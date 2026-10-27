r"""rigkit.parity - S8: test GLB of the runtime emulation, clean reimport in a fresh folder, the same poses on the reimported armature.

Steps (``run``):
  1. open the rig file; inside ``rigkit.poses.emulation`` (exporter-rule weights, Armature modifier only, bbone_segments = 1,
     weighted non-deform bones deforming; ``weights_check_max`` above 1e-6 is an error) put the control rig at the neutral pose and
     export the runtime armature + emulated copy with the FIXED exporter arguments of references/export-runtime.md: A1's
     ``rigkit.export.export_test_glb`` when it imports (same fixed arguments plus no cameras / lights / extras), else this
     module's ``export_test_glb`` with ``EXPORT_ARGS``; the summary records which one ran (``exporter``). The context restores
     the file exactly when it ends, also on errors (``export_current`` is this step on the file already open, e.g. over MCP).
  2. copy the GLB into a NEW empty folder, ``read_factory_settings(use_empty=True)``, import it.
  3. for every sampled pose of poses.npz: give each reimported bone the source bone's world skinning matrix
     S = pose_world @ inverse(rest_world) (from the ``pose_mats`` / ``rest_mats`` extras), i.e. its world pose matrix becomes
     S @ rest_world_reimport (so the bone's local frame, which the importer may choose differently, does not matter), written as
     ``matrix_basis`` parent-first (default inheritance, which the importer creates); ``bone_fit_max`` checks the result.
  4. evaluate the reimported mesh (world space) per pose and write ``reimport_poses.npz`` (names, P (p, n_glb, 3), reimported
     bones; extras ``rest`` = reimported positions skinned at the identity pose, ``rest_raw`` = stored GLB positions; meta
     ``emulation.weights_check_max``). ``solvers/parity_cmp.py`` compares it with poses.npz by welded position.

Units metres, Blender frame (Z up, front -Y, left +X); glTF is +Y up and the importer converts back.

Run: blender -b --factory-startup -P parity.py -- --blend RIG.blend --poses DIR/poses.npz --out-dir DIR/parity [--mesh M --runtime R]
Prints one JSON line; exit code 1 on failure.
"""
from __future__ import annotations

import argparse
import datetime
import json
import os
import shutil
import sys
import time

import numpy as np

if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import bpy
    from mathutils import Matrix
except ImportError:  # pragma: no cover - Blender only
    bpy = None

from rigcore import npzio  # noqa: E402

#: references/export-runtime.md "Exporter arguments (fixed)"
EXPORT_ARGS = dict(export_format="GLB", use_selection=True, export_yup=True, export_apply=False, export_skins=True,
                   export_all_influences=False, export_influence_nb=4, export_rest_position_armature=True, export_leaf_bone=False,
                   export_def_bones=False, export_hierarchy_flatten_bones=False, export_armature_object_remove=False,
                   export_animations=False)


def _need_bpy():
    if bpy is None:
        raise RuntimeError("rigkit.parity runs inside Blender 5.2")


def export_test_glb(runtime_name: str, mesh_name: str, out_glb: str) -> dict:
    """Export ``runtime_name`` + ``mesh_name`` (normally the emulated copy) with EXPORT_ARGS. Hidden objects are shown for the
    export and hidden again. Returns {path, bytes, objects}."""
    _need_bpy()
    rt = bpy.data.objects[runtime_name]
    me = bpy.data.objects[mesh_name]
    hidden = {o.name: o.hide_get() for o in (rt, me)}
    for o in (rt, me):
        o.hide_set(False)
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    rt.select_set(True)
    me.select_set(True)
    bpy.context.view_layer.objects.active = rt
    os.makedirs(os.path.dirname(os.path.abspath(out_glb)), exist_ok=True)
    tmp = out_glb + ".tmp.glb"
    if os.path.exists(tmp):
        os.remove(tmp)
    bpy.ops.export_scene.gltf(filepath=tmp, **EXPORT_ARGS)
    for attempt in range(15):  # Windows scanners lock fresh files for a moment
        try:
            os.replace(tmp, out_glb)
            break
        except OSError:
            time.sleep(1.0)
    else:
        raise OSError(f"cannot move {tmp} to {out_glb}")
    for o in (rt, me):
        o.hide_set(hidden[o.name])
    return {"path": out_glb, "bytes": os.path.getsize(out_glb), "objects": [rt.name, me.name], "args": EXPORT_ARGS}


def fresh_copy(glb: str, root: str) -> str:
    """Copy ``glb`` into a new empty folder under ``root`` (name with a timestamp); returns the copied path."""
    d = os.path.join(root, "reimport_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S_%f"))
    os.makedirs(d)
    dst = os.path.join(d, os.path.basename(glb))
    shutil.copy2(glb, dst)
    return dst


def import_clean(glb: str) -> dict:
    """Empty scene, import ``glb``; returns the armature and mesh objects of the import."""
    _need_bpy()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    props = {p.identifier for p in bpy.ops.import_scene.gltf.get_rna_type().properties}
    kw = {"disable_bone_shape": True} if "disable_bone_shape" in props else {}  # else the importer adds an Icosphere bone shape
    bpy.ops.import_scene.gltf(filepath=glb, **kw)
    arms = [o for o in bpy.data.objects if o.type == "ARMATURE"]
    meshes = [o for o in bpy.data.objects if o.type == "MESH" and any(m.type == "ARMATURE" for m in o.modifiers)]
    if len(arms) != 1 or len(meshes) != 1:
        raise ValueError(f"reimport: expected 1 armature and 1 skinned mesh, got {[o.name for o in arms]} / "
                         f"{[o.name for o in bpy.data.objects if o.type == 'MESH']}")
    return {"armature": arms[0], "mesh": meshes[0], "import_kwargs": kw}


def _world(ob):
    dg = bpy.context.evaluated_depsgraph_get()
    ev = ob.evaluated_get(dg)
    me = ev.to_mesh()
    try:
        a = np.empty(len(me.vertices) * 3)
        me.vertices.foreach_get("co", a)
    finally:
        ev.to_mesh_clear()
    mw = np.array(ob.matrix_world)
    return a.reshape(-1, 3) @ mw[:3, :3].T + mw[:3, 3]


def set_skinning(arm, skin_world: dict) -> float:
    """Pose ``arm`` so that each bone named in ``skin_world`` ({name: 4x4 world skinning matrix}) has the world pose matrix
    S @ rest_world; other bones keep identity. Bases are written parent-first with pose_b = pose_p @ (rest_p^-1 rest_b) @ basis_b.
    Returns the largest |evaluated pose matrix - target| (bone_fit)."""
    mw = np.array(arm.matrix_world)
    mwi = np.linalg.inv(mw)
    target = {}
    for b in arm.data.bones:  # parents come before children in data.bones
        R = np.array(b.matrix_local)
        S = skin_world.get(b.name)
        if S is None:
            Pp = target[b.parent.name] @ np.linalg.inv(np.array(b.parent.matrix_local)) @ R if b.parent else R
            target[b.name] = Pp  # follows its parent rigidly with identity basis
        else:
            target[b.name] = mwi @ S @ mw @ R
    for b in arm.data.bones:
        pb = arm.pose.bones[b.name]
        R = np.array(b.matrix_local)
        if b.parent:
            Rp = np.array(b.parent.matrix_local)
            basis = np.linalg.inv(np.linalg.inv(Rp) @ R) @ np.linalg.inv(target[b.parent.name]) @ target[b.name]
        else:
            basis = np.linalg.inv(R) @ target[b.name]
        pb.rotation_mode = "QUATERNION"
        pb.matrix_basis = Matrix(basis.tolist())
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    ev = arm.evaluated_get(dg)
    return max(float(np.abs(np.array(ev.pose.bones[n].matrix) - t).max()) for n, t in target.items())


def pose_reimport(arm, mesh, poses: dict, names=None) -> dict:
    """Evaluate the reimported mesh for each pose (all, or ``names``) of a loaded poses.npz dict. Returns arrays + fit."""
    src_bones = [str(b) for b in poses["bone_names"]]
    pm = poses["extra"]["pose_mats"]
    rm = poses["extra"]["rest_mats"]
    rest_inv = np.linalg.inv(rm)
    sel = [i for i, n in enumerate(poses["names"]) if names is None or str(n) in names]
    for pb in arm.pose.bones:
        pb.matrix_basis = Matrix.Identity(4)
    bpy.context.view_layer.update()
    rest = _world(mesh)  # skinned at the identity pose (float32 bind matrices: ~1e-6 m)
    co = np.empty(len(mesh.data.vertices) * 3)
    mesh.data.vertices.foreach_get("co", co)
    mw = np.array(mesh.matrix_world)
    rest_raw = co.reshape(-1, 3) @ mw[:3, :3].T + mw[:3, 3]  # stored GLB positions in world space
    out_P, out_H, out_T, fits, done = [], [], [], {}, []
    imp_names = [b.name for b in arm.data.bones]
    missing = [b for b in imp_names if b not in src_bones]
    for i in sel:
        skin = {b: pm[i, src_bones.index(b)] @ rest_inv[src_bones.index(b)] for b in imp_names if b in src_bones}
        fits[str(poses["names"][i])] = set_skinning(arm, skin)
        out_P.append(_world(mesh).astype(np.float32))
        dg = bpy.context.evaluated_depsgraph_get()
        ev = arm.evaluated_get(dg)
        out_H.append([list(ev.matrix_world @ ev.pose.bones[n].head) for n in imp_names])
        out_T.append([list(ev.matrix_world @ ev.pose.bones[n].tail) for n in imp_names])
        done.append(str(poses["names"][i]))
    return {"names": done, "P": np.array(out_P), "heads": np.array(out_H, np.float32), "tails": np.array(out_T, np.float32),
            "bone_names": imp_names, "rest": rest, "rest_raw": rest_raw, "fits": fits, "bones_not_in_source": missing}


def export_current(out_dir, mesh=None, runtime=None, control=None, method="gn") -> dict:
    """Step 1 on the file that is open now: test GLB of the runtime emulation inside ``rigkit.poses.emulation`` (file restored
    on exit). Returns {glb, sha256, bytes, exporter, args, emulation: {copy, weights_check_max}, mesh, runtime}."""
    _need_bpy()
    from rigkit import bl, poses as RP

    os.makedirs(out_dir, exist_ok=True)
    me = bpy.data.objects[mesh] if mesh else bl.find("mesh")
    rt = bpy.data.objects[runtime] if runtime else bl.find("runtime")
    ctl = bpy.data.objects[control] if control else next(
        (o for o in bpy.data.objects if o.type == "ARMATURE" and o is not rt and o.name.endswith("_control")), None)
    glb = os.path.join(out_dir, f"{me.name}_runtime_test.glb")
    try:
        from rigkit import export as a1_export
    except Exception as e:  # A1's module missing or broken: same fixed arguments here
        a1_export, why = None, f"{type(e).__name__}: {e}"
    with RP.emulation(me.name, rt.name, method=method) as emu:
        if ctl is not None:  # export at the neutral pose (restored with the file state)
            bl.reset_pose(ctl)
        if a1_export is not None and hasattr(a1_export, "export_test_glb"):
            exp = a1_export.export_test_glb(rt, bpy.data.objects[emu["copy"]], glb, ct_ob=ctl)
            exporter = "rigkit.export.export_test_glb (A1)"
        else:
            exp = export_test_glb(rt.name, emu["copy"], glb)
            exporter = "rigkit.parity.export_test_glb (" + (why if a1_export is None else "A1 module has no export_test_glb") + ")"
        emu_info = {k: emu[k] for k in ("copy", "weights_check_max", "weights_check_tol", "bones_changed", "weights_path")}
    return {"glb": glb, "sha256": bl.sha256_file(glb), "bytes": exp["bytes"], "exporter": exporter,
            "args": exp.get("args", EXPORT_ARGS), "emulation": emu_info, "mesh": me.name, "runtime": rt.name}


def run(blend, poses_path, out_dir, mesh=None, runtime=None, names=None, method="gn") -> dict:
    _need_bpy()
    t0 = time.time()
    os.makedirs(out_dir, exist_ok=True)
    bpy.ops.wm.open_mainfile(filepath=blend)
    ex = export_current(out_dir, mesh, runtime, method=method)
    glb = ex["glb"]
    copied = fresh_copy(glb, out_dir)
    poses = npzio.load_poses(poses_path)
    objs = import_clean(copied)
    res = pose_reimport(objs["armature"], objs["mesh"], poses, names)
    out = os.path.join(out_dir, "reimport_poses.npz")
    meta = {"glb": glb, "glb_sha256": ex["sha256"], "reimport_glb": copied, "source_poses": os.path.abspath(poses_path),
            "export_args": ex["args"], "exporter": ex["exporter"], "bone_fit_max": max(res["fits"].values(), default=0.0),
            "bone_fit": res["fits"], "bones_not_in_source": res["bones_not_in_source"], "emulation": ex["emulation"],
            "imported_mesh": objs["mesh"].name, "imported_armature": objs["armature"].name, "blender": bpy.app.version_string}
    npzio.save_poses(out, res["names"], res["P"], res["bone_names"], res["heads"], res["tails"], meta=meta,
                     extra={"rest": res["rest"], "rest_raw": res["rest_raw"]})
    summary = {"ok": True, "glb": glb, "glb_bytes": ex["bytes"], "exporter": ex["exporter"], "reimport_glb": copied,
               "reimport_poses": out, "n_poses": len(res["names"]), "n_vertices_glb": int(res["P"].shape[1]),
               "n_bones_glb": len(res["bone_names"]), "bone_fit_max": meta["bone_fit_max"],
               "bones_not_in_source": res["bones_not_in_source"], "weights_check_max": ex["emulation"]["weights_check_max"],
               "seconds": round(time.time() - t0, 2)}
    npzio.write_json(os.path.join(out_dir, "parity_blender.json"), summary)
    return summary


def main(argv=None):
    from rigkit import bl

    ap = argparse.ArgumentParser(description="S8 test GLB + clean reimport + posed comparison data (Blender)")
    ap.add_argument("--blend", required=True)
    ap.add_argument("--poses", required=True, help="poses.npz of rigkit.poses (needs the pose_mats/rest_mats extras)")
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("--mesh")
    ap.add_argument("--runtime")
    ap.add_argument("--only", default="", help="comma list of pose names to sample (default all)")
    a = ap.parse_args(bl.script_args(argv) if argv is None else argv)
    try:
        res = run(a.blend, a.poses, a.out_dir, mesh=a.mesh, runtime=a.runtime, names=[x for x in a.only.split(",") if x] or None)
        print(json.dumps(res))
        return 0
    except Exception as e:
        import traceback

        traceback.print_exc()
        print(json.dumps({"ok": False, "error": f"{type(e).__name__}: {e}"}))
        return 1


if __name__ == "__main__":
    code = main()
    if bpy is not None and bpy.app.background:
        from rigkit import bl

        bl.exit_now(code)  # os._exit without Blender's teardown, after removing the session temp folder Blender would remove
    sys.exit(code)
