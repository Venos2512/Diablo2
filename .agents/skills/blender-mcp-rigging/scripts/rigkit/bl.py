"""rigkit.bl - shared Blender helpers: mode switching, temp_override for view/armature operators, object lookup by role, saving
copies (snapshots), script arguments, small conversions.

Units: metres.  Frame: Blender, Z up, character front -Y, character left +X.

Object roles (CONTRACT.md "Objects in a rig .blend"): mesh ``<asset_id>``, runtime armature ``<asset_id>_runtime``, control armature
``<asset_id>_control``. Builders also tag their objects with the custom properties ``rigkit_role`` and ``rigkit_asset``; lookup tries
the tag first, then the names, then the D01 legacy names (``D01_hodling`` / ``D01_runtime`` / ``D01_control``).

Nothing here depends on a process id or on a GUI window: the same calls work in an MCP session and under ``blender -b``.
"""
from __future__ import annotations

import contextlib
import json
import math
import os
import sys
import time

try:  # pure-Python callers (rigkit-env unit tests) import this module without Blender
    import bpy
except ImportError:  # pragma: no cover - outside Blender
    bpy = None

ROLES = ("mesh", "runtime", "control")
ROLE_SUFFIX = {"mesh": "", "runtime": "_runtime", "control": "_control"}
#: D01's rig file predates the naming rule; accepted for the legacy regression
LEGACY_NAMES = {"D01_hodling": {"mesh": "D01_hodling", "runtime": "D01_runtime", "control": "D01_control"}}


def require_bpy():
    """Raise a clear error when a Blender-only helper is called outside Blender."""
    if bpy is None:
        raise RuntimeError("this rigkit function needs Blender (bpy); run it inside Blender 5.2")
    return bpy


# --------------------------------------------------------------------------------------------------------------------------
# script arguments / files
# --------------------------------------------------------------------------------------------------------------------------

def script_args(argv=None) -> list:
    """Arguments after ``--`` on the Blender command line (``blender -b -P x.py -- a b`` -> ``["a", "b"]``)."""
    argv = sys.argv if argv is None else argv
    return list(argv[argv.index("--") + 1:]) if "--" in argv else []


def run_main(main):
    """Run a step CLI's ``main()`` and exit with its code. Any exception prints its traceback and exits 1: Blender itself would
    exit 0 after an uncaught script error unless ``--python-exit-code`` is given."""
    import traceback

    try:
        code = main()
    except SystemExit:
        raise
    except BaseException:
        traceback.print_exc()
        code = 1
    sys.stdout.flush()
    sys.exit(int(code or 0))


def purge_session_tempdir() -> str | None:
    """Delete Blender's per-session temp folder (``bpy.app.tempdir`` = ``<TEMP>/blender_<id>/``). Blender removes it itself on a
    normal exit; a module that ends with ``os._exit`` skips that cleanup and leaves the folder behind, so it calls ``exit_now``.
    Only a folder named ``blender_*`` is touched. Returns the removed path, or None (outside Blender, no such folder)."""
    if bpy is None:
        return None
    import shutil

    d = os.path.normpath(bpy.app.tempdir or "")
    if not os.path.basename(d).startswith("blender_") or not os.path.isdir(d):
        return None
    shutil.rmtree(d, ignore_errors=True)
    return None if os.path.exists(d) else d


def exit_now(code: int):
    """End a background Blender job at once with ``code``: flush stdout / stderr, remove the session temp folder
    (``purge_session_tempdir``), then ``os._exit`` (skips Blender's teardown; the exit code reaches the caller unchanged)."""
    sys.stdout.flush()
    sys.stderr.flush()
    try:
        purge_session_tempdir()
    except OSError:
        pass
    os._exit(int(code or 0))


def sha256_file(path) -> str:
    import hashlib

    h = hashlib.sha256()
    with open(os.fspath(path), "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def json_line(obj) -> str:
    """One compact JSON line (test scripts print exactly one of these as their summary)."""
    from rigcore.schema import json_default

    return json.dumps(obj, separators=(",", ":"), default=json_default, allow_nan=True)


def new_empty_file():
    """Reset to an empty file (``read_factory_settings(use_empty=True)``). Only for ``blender -b`` jobs: it discards the open file."""
    require_bpy()
    bpy.ops.wm.read_factory_settings(use_empty=True)


def _retry(fn, what: str, tries: int = 10, wait: float = 1.0):
    last = None
    for _ in range(tries):
        try:
            return fn()
        except (RuntimeError, OSError) as e:  # Windows scanners lock fresh files for a moment
            last = e
            time.sleep(wait)
    raise RuntimeError(f"{what} failed after {tries} tries: {last}")


def save_copy(path, overwrite: bool = False, compress: bool = True) -> str:
    """Snapshot: ``save_as_mainfile(copy=True)`` -> the open file keeps its path. Refuses to overwrite unless ``overwrite``."""
    require_bpy()
    path = os.path.abspath(os.fspath(path))
    if os.path.exists(path) and not overwrite:
        raise FileExistsError(f"snapshot exists, not overwriting: {path}")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    _retry(lambda: bpy.ops.wm.save_as_mainfile(filepath=path, copy=True, compress=compress), f"save copy {path}")
    return path


def save_main(path, compress: bool = True, backup: bool = False) -> str:
    """Save the open file as ``path`` (it becomes the open file). ``backup=False`` writes no ``.blend1``: the preference
    ``save_version`` is set to 0 for this call only and restored afterwards."""
    require_bpy()
    path = os.path.abspath(os.fspath(path))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    fp = bpy.context.preferences.filepaths
    old = fp.save_version
    try:
        if not backup:
            fp.save_version = 0
        _retry(lambda: bpy.ops.wm.save_as_mainfile(filepath=path, compress=compress), f"save {path}")
    finally:
        fp.save_version = old
    return path


def open_file(path):
    """Open a .blend (discards the open file)."""
    require_bpy()
    bpy.ops.wm.open_mainfile(filepath=os.path.abspath(os.fspath(path)))


# --------------------------------------------------------------------------------------------------------------------------
# objects
# --------------------------------------------------------------------------------------------------------------------------

def rig_names(asset_id: str, family=None) -> dict:
    """Object names of a rig: ``{mesh, runtime, control, collection}`` = ``<asset_id>``, ``<asset_id>_runtime``, ``<asset_id>_control``,
    ``<asset_id>_rig``, overridden by ``family["builder"]["names"]`` (the D01 legacy family keeps D01's names)."""
    names = {"mesh": asset_id, "runtime": asset_id + "_runtime", "control": asset_id + "_control", "collection": asset_id + "_rig"}
    over = ((family or {}).get("builder") or {}).get("names") or {}
    names.update({k: v for k, v in over.items() if k in names})
    return names


def open_recipe(path, asset_id: str, **new_kw) -> dict:
    """``rig_recipe.json`` at ``path`` (validated) or, when absent, ``rigcore.recipe.new_recipe(asset_id, **new_kw)``."""
    from rigcore import recipe

    if path and os.path.exists(path):
        rec = recipe.load_recipe(path)
        if rec["asset_id"] != asset_id:
            raise ValueError(f"{path} belongs to asset {rec['asset_id']!r}, not {asset_id!r}")
        return rec
    return recipe.new_recipe(asset_id, **new_kw)


def scene_value(key: str, default=None):
    """A custom property of the scene (``rigkit_H``, ``rigkit_asset_id`` ... written by ``intake.record_scene``)."""
    require_bpy()
    sc = bpy.context.scene
    return sc[key] if key in sc else default


def tag(ob, role: str, asset_id: str | None = None):
    """Mark ``ob`` with its rig role (``mesh`` / ``runtime`` / ``control``) and asset id."""
    if role not in ROLES:
        raise ValueError(f"role must be one of {ROLES}, got {role!r}")
    ob["rigkit_role"] = role
    if asset_id:
        ob["rigkit_asset"] = asset_id
    return ob


def find(role: str, asset_id: str | None = None, required: bool = True):
    """Object of a rig role. Order: custom property ``rigkit_role`` (+ ``rigkit_asset`` when ``asset_id`` is given), then the
    contract names ``<asset_id>``/``<asset_id>_runtime``/``<asset_id>_control``, then the D01 legacy names."""
    require_bpy()
    if role not in ROLES:
        raise ValueError(f"role must be one of {ROLES}, got {role!r}")
    want_type = "MESH" if role == "mesh" else "ARMATURE"
    tagged = [o for o in bpy.data.objects if o.get("rigkit_role") == role and o.type == want_type
              and (asset_id is None or o.get("rigkit_asset") == asset_id)]
    if len(tagged) > 1:  # copies keep custom properties: prefer the object that carries its contract name
        named = [o for o in tagged if o.get("rigkit_asset") and o.name == o["rigkit_asset"] + ROLE_SUFFIX[role]]
        named = named or [o for o in tagged if o.get("rigkit_asset") in LEGACY_NAMES
                          and o.name == LEGACY_NAMES[o["rigkit_asset"]][role]]
        if len(named) == 1:
            return named[0]
        raise LookupError(f"several objects tagged {role!r}: {[o.name for o in tagged]}; pass asset_id")
    if len(tagged) == 1:
        return tagged[0]
    names = []
    if asset_id:
        names.append(asset_id + ROLE_SUFFIX[role])
        if asset_id in LEGACY_NAMES:
            names.append(LEGACY_NAMES[asset_id][role])
    else:
        names.extend(v[role] for v in LEGACY_NAMES.values())
    for nm in names:
        o = bpy.data.objects.get(nm)
        if o is not None and o.type == want_type:
            return o
    if required:
        raise LookupError(f"no {role} object (asset {asset_id!r}); looked for tags and names {names}")
    return None


def link(ob, collection=None):
    """Link ``ob`` to ``collection`` (default: the scene collection)."""
    require_bpy()
    (collection or bpy.context.scene.collection).objects.link(ob)
    return ob


def ensure_collection(name: str):
    """Collection ``name`` under the scene collection (created when missing)."""
    require_bpy()
    col = bpy.data.collections.get(name)
    if col is None:
        col = bpy.data.collections.new(name)
    if col.name not in bpy.context.scene.collection.children:
        bpy.context.scene.collection.children.link(col)
    return col


def move_to_collection(ob, col):
    for c in list(ob.users_collection):
        c.objects.unlink(ob)
    col.objects.link(ob)
    return ob


# --------------------------------------------------------------------------------------------------------------------------
# modes / context
# --------------------------------------------------------------------------------------------------------------------------

def update():
    require_bpy()
    bpy.context.view_layer.update()


def set_mode(ob, mode: str):
    """Make ``ob`` the only selected, active, visible object and switch it to ``mode`` (``OBJECT``/``EDIT``/``POSE``)."""
    require_bpy()
    vl = bpy.context.view_layer
    if bpy.context.object is not None and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")
    vl.update()
    if ob.hide_get():
        ob.hide_set(False)
    ob.hide_viewport = False
    for o in list(vl.objects):
        if o is not None and o.select_get():
            o.select_set(False)
    vl.objects.active = ob
    ob.select_set(True)
    if mode != "OBJECT":
        bpy.ops.object.mode_set(mode=mode)


@contextlib.contextmanager
def edit_mode(ob):
    """``with edit_mode(arm):`` edit bones of ``arm``; back to OBJECT mode afterwards (also on errors)."""
    set_mode(ob, "EDIT")
    try:
        yield ob.data
    finally:
        bpy.ops.object.mode_set(mode="OBJECT")


@contextlib.contextmanager
def view3d_override():
    """``temp_override`` with a VIEW_3D area/region when a window has one (GUI / MCP session); a no-op under ``blender -b``,
    where view operators are not available anyway. Yields the area or None."""
    require_bpy()
    wm = bpy.context.window_manager
    for win in getattr(wm, "windows", []):
        for area in win.screen.areas:
            if area.type == "VIEW_3D":
                region = next((r for r in area.regions if r.type == "WINDOW"), None)
                with bpy.context.temp_override(window=win, area=area, region=region):
                    yield area
                return
    yield None


@contextlib.contextmanager
def deform_paused():
    """Turn every Armature modifier off in the viewport while the block runs (pole sweeps and bend tests only need bones; with a
    big skinned mesh each depsgraph update would deform it). The previous ``show_viewport`` states are restored afterwards."""
    require_bpy()
    saved = []
    for o in bpy.data.objects:
        for m in getattr(o, "modifiers", []):
            if m.type == "ARMATURE" and m.show_viewport:
                saved.append(m)
                m.show_viewport = False
    try:
        yield len(saved)
    finally:
        for m in saved:
            m.show_viewport = True
        update()


_ROTATION_PATHS = ("rotation_euler", "rotation_quaternion", "rotation_axis_angle")


def driven_rotation_bones(arm_ob) -> set:
    """Names of the pose bones of ``arm_ob`` whose rotation channels carry a driver (the twist bones of ``control.couple_runtime``:
    ``rotation_euler[1]`` in XYZ mode)."""
    ad = arm_ob.animation_data
    paths = {fc.data_path for fc in ad.drivers} if ad is not None else set()
    if not paths:
        return set()
    return {pb.name for pb in arm_ob.pose.bones if any(pb.path_from_id(p) in paths for p in _ROTATION_PATHS)}


def reset_pose(arm_ob, update_scene: bool = True):
    """Every pose bone to identity (quaternion mode). Bones whose rotation is driven (twist bones) keep their rotation mode, so
    their driver still acts; their rotation channels are zeroed (the driver sets them again on the next evaluation)."""
    driven = driven_rotation_bones(arm_ob)
    for pb in arm_ob.pose.bones:
        pb.location = (0.0, 0.0, 0.0)
        if pb.name in driven:
            pb.rotation_euler = (0.0, 0.0, 0.0)
            pb.rotation_quaternion = (1.0, 0.0, 0.0, 0.0)
        else:
            pb.rotation_mode = "QUATERNION"
            pb.rotation_quaternion = (1.0, 0.0, 0.0, 0.0)
        pb.scale = (1.0, 1.0, 1.0)
    if update_scene:
        update()


# --------------------------------------------------------------------------------------------------------------------------
# conversions
# --------------------------------------------------------------------------------------------------------------------------

def mat_list(m) -> list:
    """mathutils Matrix -> nested list of floats (row-major)."""
    return [[float(v) for v in row] for row in m]


def vec_list(v) -> list:
    return [float(c) for c in v]


def rad(deg: float) -> float:
    """Degrees -> radians (was ``deg()`` in round 1, a misleading name; nothing called it)."""
    return math.radians(deg)
