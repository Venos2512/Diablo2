"""rigkit.state - snapshot and diff of what the user may edit in the GUI (mcp-operations.md "User edits"): the world positions of the
``lm_*`` landmark empties, the vertex-group weights (one hash per group, keyed by WELDED vertex position so vertex order and seam
duplicates do not matter) and the pose-bone transforms; plus the writers of ``landmarks_override.json`` and
``weights_override.json``.

Units: metres.  Frame: Blender world (rig objects have identity transforms), Z up, front -Y, left +X.

Flow::

    snap0 = snapshot(mesh_ob, [ct, rt], weights_file=".../state_before_weights.npz")   # before handing over
    ...user edits...
    snap1 = snapshot(mesh_ob, [ct, rt], weights_file=".../state_after_weights.npz")
    d = diff(snap0, snap1)
    if d["landmarks"]:      write_landmarks_override(path, asset_id, d)
    if d["weights_changed_groups"]:  write_weights_override(path, asset_id, snap0, snap1, d)

Position keys are the welded positions rounded to ``decimals`` (default 6: micrometres); the weld map is
``rigcore.mesh.weld_map(rest positions)``. The diff/override functions are pure Python + numpy.
"""
from __future__ import annotations

import hashlib
import os
from datetime import datetime, timezone

import numpy as np

from rigcore import SCHEMA
from rigcore import mesh as rmesh
from rigcore import npzio

from rigkit import bl, meshio

try:
    import bpy
    from mathutils import Vector
except ImportError:  # pragma: no cover - pure-Python use
    bpy = None

LM_PREFIX = "lm_"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


# --------------------------------------------------------------------------------------------------------------------------
# landmark empties (Blender)
# --------------------------------------------------------------------------------------------------------------------------

def make_landmark_empties(landmarks, collection=None, prefix: str = LM_PREFIX, size: float = 0.01) -> list[str]:
    """One empty ``lm_<id>`` per landmark (created or moved), display SPHERE of radius ``size`` metres. Returns the names."""
    bl.require_bpy()
    names = []
    for lid, p in landmarks.items():
        nm = prefix + lid
        ob = bpy.data.objects.get(nm)
        if ob is None:
            ob = bpy.data.objects.new(nm, None)
            bl.link(ob, collection)
        ob.empty_display_type = "SPHERE"
        ob.empty_display_size = float(size)
        ob.location = Vector(p)
        ob["rigkit_landmark"] = lid
        names.append(nm)
    bl.update()
    return names


def read_landmark_empties(prefix: str = LM_PREFIX) -> dict:
    """``{id: [x, y, z]}`` world positions of every ``lm_*`` empty."""
    bl.require_bpy()
    bl.update()
    return {str(o.get("rigkit_landmark", o.name[len(prefix):])): [float(c) for c in o.matrix_world.translation]
            for o in bpy.data.objects if o.type == "EMPTY" and o.name.startswith(prefix)}


# --------------------------------------------------------------------------------------------------------------------------
# weights / pose (Blender readers)
# --------------------------------------------------------------------------------------------------------------------------

def weights_by_group(mesh_ob) -> tuple[list, np.ndarray]:
    """``(group names, W float64 (n, g))`` of ``mesh_ob``'s vertex groups (all groups, bone or not)."""
    me = mesh_ob.data
    names = [g.name for g in mesh_ob.vertex_groups]
    W = np.zeros((len(me.vertices), len(names)))
    for v in me.vertices:
        for g in v.groups:
            W[v.index, g.group] = g.weight
    return names, W


def pose_state(arm_ob) -> dict:
    """``{bone: {location, rotation_mode, rotation, scale}}`` of the pose bones (``rotation`` = quaternion, Euler or axis-angle
    values in the bone's rotation mode)."""
    out = {}
    for pb in arm_ob.pose.bones:
        rm = pb.rotation_mode
        rot = (list(pb.rotation_quaternion) if rm == "QUATERNION" else list(pb.rotation_axis_angle) if rm == "AXIS_ANGLE"
               else list(pb.rotation_euler))
        out[pb.name] = {"location": [float(c) for c in pb.location], "rotation_mode": rm, "rotation": [float(c) for c in rot],
                        "scale": [float(c) for c in pb.scale]}
    return out


# --------------------------------------------------------------------------------------------------------------------------
# keys and hashes (pure)
# --------------------------------------------------------------------------------------------------------------------------

def position_keys(V, weld=None, decimals: int = 6) -> tuple[np.ndarray, np.ndarray]:
    """``(weld int32 (n,), keys float64 (n_welded, 3))``: welded id per vertex and the welded positions rounded to ``decimals``."""
    V = np.asarray(V, dtype=np.float64)
    if weld is None:
        weld = rmesh.weld_map(V)
    keys = np.round(rmesh.welded_positions(V, weld, "first"), decimals) + 0.0
    return np.asarray(weld, dtype=np.int32), keys


def group_hashes(names, W, weld, keys, decimals_w: int = 7) -> dict:
    """``{group: sha256}`` over the sorted rows ``(key x, key y, key z, weight)`` of the vertices with weight > 0 in that group
    (seam duplicates collapse to one row when their weights agree)."""
    out = {}
    K = keys[weld]
    for j, nm in enumerate(names):
        w = np.round(W[:, j], decimals_w)
        m = w > 0
        rows = np.unique(np.column_stack([K[m], w[m]]), axis=0) if m.any() else np.zeros((0, 4))
        out[nm] = hashlib.sha256(np.ascontiguousarray(rows, dtype=np.float64).tobytes()).hexdigest()
    return out


# --------------------------------------------------------------------------------------------------------------------------
# snapshot / diff
# --------------------------------------------------------------------------------------------------------------------------

def snapshot(mesh_ob=None, armatures=(), prefix: str = LM_PREFIX, decimals: int = 6, weights_file=None) -> dict:
    """State snapshot (JSON-able): ``{schema, time, landmarks:{id: [x,y,z]}, weights:{groups, hashes, n_vertices, n_welded,
    decimals, file}, pose:{armature: pose_state}}``. With ``weights_file`` the per-vertex weights, weld map and keys are stored
    there (npz) so that ``write_weights_override`` can list the changed vertices."""
    bl.require_bpy()
    snap = {"schema": SCHEMA, "time": _now(), "landmarks": read_landmark_empties(prefix), "weights": None,
            "pose": {a.name: pose_state(a) for a in armatures}}
    if mesh_ob is not None:
        V = meshio.rest_vertices(mesh_ob, world=True)
        weld, keys = position_keys(V, decimals=decimals)
        names, W = weights_by_group(mesh_ob)
        snap["weights"] = {"mesh": mesh_ob.name, "groups": names, "hashes": group_hashes(names, W, weld, keys), "n_vertices": int(len(V)),
                           "n_welded": int(len(keys)), "decimals": decimals, "file": None}
        if weights_file:
            p = os.path.abspath(os.fspath(weights_file))
            os.makedirs(os.path.dirname(p), exist_ok=True)
            np.savez_compressed(p, W=W.astype(np.float32), groups=np.array(names, dtype=str), weld=weld, keys=keys)
            snap["weights"]["file"] = p
    return snap


def diff(before: dict, after: dict, tol_m: float = 1e-6, tol_pose: float = 1e-6) -> dict:
    """What changed between two snapshots: moved / added / removed landmarks (moved by more than ``tol_m``), weight groups whose
    hash changed (plus added / removed groups), pose bones whose transform changed. ``empty`` is True when nothing changed."""
    lb, la = before.get("landmarks") or {}, after.get("landmarks") or {}
    moved = {}
    for k in sorted(set(lb) & set(la)):
        d = float(np.linalg.norm(np.subtract(la[k], lb[k])))
        if d > tol_m:
            moved[k] = {"before": list(lb[k]), "after": list(la[k]), "moved_m": d}
    wb, wa = before.get("weights") or {}, after.get("weights") or {}
    hb, ha = wb.get("hashes") or {}, wa.get("hashes") or {}
    changed = sorted(g for g in set(hb) & set(ha) if hb[g] != ha[g])
    pose = {}
    for arm in sorted(set(before.get("pose") or {}) & set(after.get("pose") or {})):
        pb_, pa_ = before["pose"][arm], after["pose"][arm]
        bones = []
        for nm in sorted(set(pb_) & set(pa_)):
            x, y = pb_[nm], pa_[nm]
            if x["rotation_mode"] != y["rotation_mode"] or any(
                    float(np.abs(np.subtract(x[k], y[k])).max()) > tol_pose for k in ("location", "rotation", "scale")):
                bones.append(nm)
        if bones:
            pose[arm] = bones
    out = {"landmarks": moved, "landmarks_added": sorted(set(la) - set(lb)), "landmarks_removed": sorted(set(lb) - set(la)),
           "weights_changed_groups": changed, "groups_added": sorted(set(ha) - set(hb)), "groups_removed": sorted(set(hb) - set(ha)),
           "pose_changed": pose}
    out["empty"] = not any(out[k] for k in ("landmarks", "landmarks_added", "landmarks_removed", "weights_changed_groups",
                                            "groups_added", "groups_removed", "pose_changed"))
    return out


# --------------------------------------------------------------------------------------------------------------------------
# override files (pure)
# --------------------------------------------------------------------------------------------------------------------------

def _read_existing(path, kind: str) -> dict:
    if path and os.path.exists(path):
        doc = npzio.read_json(path)
        if doc.get("kind") != kind:
            raise ValueError(f"{path}: kind is {doc.get('kind')!r}, expected {kind!r}")
        return doc
    return {}


def write_landmarks_override(path, asset_id: str, d: dict, after: dict | None = None, note: str | None = None) -> str:
    """Merge the moved and added landmarks of diff ``d`` into ``landmarks_override.json`` (later edits win; earlier entries stay):
    ``{schema, asset_id, kind: "landmarks_override", updated, landmarks: {id: {pos, before, source: "e", time, note}}}``.
    Added landmarks need ``after`` (the later snapshot) for their position."""
    doc = _read_existing(path, "landmarks_override") or {"schema": SCHEMA, "asset_id": asset_id, "kind": "landmarks_override", "landmarks": {}}
    t = _now()
    for k, v in d.get("landmarks", {}).items():
        doc["landmarks"][k] = {"pos": v["after"], "before": v["before"], "source": "e", "time": t, "note": note}
    for k in d.get("landmarks_added", []):
        if after is None:
            raise ValueError("write_landmarks_override: added landmarks need the 'after' snapshot")
        doc["landmarks"][k] = {"pos": list(after["landmarks"][k]), "before": None, "source": "e", "time": t, "note": note}
    doc["updated"] = t
    return npzio.write_json(path, doc)


def weight_changes(before: dict, after: dict, groups=None, tol: float = 1e-6) -> list[dict]:
    """Per welded position, the weights that changed between two snapshots stored with ``weights_file``: ``[{pos, weights:{g: w},
    before:{g: w}, members, conflict}]``; ``groups`` limits the groups (default all common groups). When seam duplicates of one
    position disagree after the edit, the member with the largest change is taken and ``conflict`` is True."""
    zb, za = np.load(before["weights"]["file"]), np.load(after["weights"]["file"])
    gb, ga = [str(g) for g in zb["groups"]], [str(g) for g in za["groups"]]
    common = [g for g in (groups or gb) if g in gb and g in ga]
    if zb["W"].shape[0] != za["W"].shape[0] or not np.array_equal(zb["weld"], za["weld"]):
        raise ValueError("weight_changes: the two snapshots have different vertices / weld maps")
    Wb = zb["W"][:, [gb.index(g) for g in common]].astype(np.float64)
    Wa = za["W"][:, [ga.index(g) for g in common]].astype(np.float64)
    weld, keys = za["weld"], za["keys"]
    delta = np.abs(Wa - Wb).max(axis=1) if common else np.zeros(len(weld))
    out = []
    for wid in np.unique(weld[delta > tol]):
        members = np.flatnonzero(weld == wid)
        pick = members[int(np.argmax(delta[members]))]
        conflict = bool(np.abs(Wa[members] - Wa[pick]).max() > tol)
        ch = np.flatnonzero(np.abs(Wa[pick] - Wb[pick]) > tol)
        out.append({"pos": [float(c) for c in keys[wid]], "weights": {common[j]: float(Wa[pick, j]) for j in ch},
                    "before": {common[j]: float(Wb[pick, j]) for j in ch}, "members": int(len(members)), "conflict": conflict})
    return out


def write_weights_override(path, asset_id: str, before: dict, after: dict, d: dict | None = None, note: str | None = None) -> str:
    """Merge the changed weights (``weight_changes`` over the changed groups of diff ``d``) into ``weights_override.json``:
    ``{schema, asset_id, kind: "weights_override", key_decimals, updated, entries: [{pos, weights, before, time, note, conflict}]}``,
    keyed by welded vertex position (rounded to ``key_decimals``); a later entry for the same position and group wins."""
    groups = (d or {}).get("weights_changed_groups") or None
    rows = weight_changes(before, after, groups)
    dec = int(after["weights"]["decimals"])
    doc = _read_existing(path, "weights_override") or {"schema": SCHEMA, "asset_id": asset_id, "kind": "weights_override",
                                                         "key_decimals": dec, "entries": []}
    t = _now()
    index = {tuple(e["pos"]): e for e in doc["entries"]}
    for r in rows:
        key = tuple(r["pos"])
        e = index.get(key)
        if e is None:
            e = {"pos": r["pos"], "weights": {}, "before": {}, "members": r["members"], "time": t, "note": note, "conflict": False}
            doc["entries"].append(e)
            index[key] = e
        e["members"] = r["members"]
        e["weights"].update(r["weights"])
        for g, w in r["before"].items():
            e["before"].setdefault(g, w)
        e["time"], e["note"], e["conflict"] = t, note, bool(e["conflict"] or r["conflict"])
    doc["updated"] = t
    return npzio.write_json(path, doc)
