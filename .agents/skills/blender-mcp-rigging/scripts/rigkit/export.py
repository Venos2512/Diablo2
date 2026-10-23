"""rigkit.export - S8: test GLB export with the fixed exporter arguments (references/export-runtime.md) and the validation
A1.1-A1.14 of QA_CHECKLIST.md plus the extra checks (port of D01 ``v1_validate.py``) -> ``validation.json``.

Units: metres.  Frames: Blender Z up / front -Y; the GLB is +Y up / front +Z (Blender (x, y, z) -> glTF (x, z, -y)).

The test GLB is NOT a release file (R8 makes those): runtime armature + mesh only, no animation. ``validate`` opens the rig .blend
and, for A1.9, resets the session and re-imports the GLB from a fresh folder, so run it in a background Blender::

    blender -b --factory-startup -P rigkit/export.py -- --blend rig.blend --source-glb asset.glb --H 0.5 --out-dir checks/
                                                          [--skeleton skeleton.json] [--asset-id D01_hodling]

The validation never stops at the first broken input: each part (source GLB, test GLB, skin, .blend, each check) is guarded, an
unmeasured check is recorded as failed with the reason (``errors``), and the CLI always writes ``validation.json``. The weight rule
is the exporter's (drop <= ``DROP_WEIGHT`` = 1e-4, top 4, renormalize), also for X.2.

GLB reading (``read_glb``, ``accessor``, ``node_globals`` ...) and ``exporter_weights`` / ``summarize`` are pure Python + numpy.
"""
from __future__ import annotations

import datetime
import hashlib
import json
import os
import re
import shutil
import struct
import sys
import time
import traceback
import types

import numpy as np

if __name__ == "__main__":  # run as a script: put scripts/ on sys.path (no __pycache__ next to the sources)
    sys.dont_write_bytecode = True
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rigkit import bl  # noqa: E402

try:
    import bpy
    from mathutils import Matrix, Vector, kdtree
except ImportError:  # pragma: no cover - pure-Python use
    bpy = None

#: references/export-runtime.md, fixed (plus the D01 extras: no cameras / lights / custom properties, images as stored)
EXPORT_ARGS = dict(
    export_format="GLB", use_selection=True, export_yup=True, export_apply=False,
    export_skins=True, export_all_influences=False, export_influence_nb=4,
    export_rest_position_armature=True, export_leaf_bone=False, export_def_bones=False,
    export_hierarchy_flatten_bones=False, export_armature_object_remove=False, export_animations=False,
    export_image_format="AUTO", export_cameras=False, export_lights=False, export_extras=False,
)
TEXTURE_ROLES = (("baseColor", ("pbrMetallicRoughness", "baseColorTexture")),
                 ("metallicRoughness", ("pbrMetallicRoughness", "metallicRoughnessTexture")),
                 ("normal", ("normalTexture",)), ("occlusion", ("occlusionTexture",)), ("emissive", ("emissiveTexture",)))


# --------------------------------------------------------------------------------------------------------------------------
# GLB reading (pure Python)
# --------------------------------------------------------------------------------------------------------------------------

_CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
_NC = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT2": 4, "MAT3": 9, "MAT4": 16}


def read_glb(path) -> tuple:
    """``(json_dict, bin_bytes)`` of a GLB file."""
    b = open(os.fspath(path), "rb").read()
    if b[:4] != b"glTF":
        raise ValueError(f"{path}: not a GLB")
    jl = struct.unpack("<I", b[12:16])[0]
    js = json.loads(b[20:20 + jl])
    off = 20 + jl
    if off + 8 > len(b):
        return js, b""
    bl_ = struct.unpack("<I", b[off:off + 4])[0]
    return js, b[off + 8:off + 8 + bl_]


def accessor(js, bin_, i) -> np.ndarray:
    """Accessor ``i`` as an array (n, components); normalized integer accessors become float64 in [0, 1] / [-1, 1]."""
    a = js["accessors"][i]
    bv = js["bufferViews"][a["bufferView"]]
    dt = np.dtype(_CT[a["componentType"]])
    nc = _NC[a["type"]]
    stride = bv.get("byteStride", dt.itemsize * nc)
    base = bv.get("byteOffset", 0) + a.get("byteOffset", 0)
    cnt = a["count"]
    if stride == dt.itemsize * nc:
        arr = np.frombuffer(bin_, dtype=dt, count=cnt * nc, offset=base).reshape(cnt, nc)
    else:
        arr = np.stack([np.frombuffer(bin_, dtype=dt, count=nc, offset=base + k * stride) for k in range(cnt)])
    if a.get("normalized"):
        info = np.iinfo(dt)
        arr = np.maximum(arr.astype(np.float64) / info.max, -1.0)
    return arr.astype(np.float64) if arr.dtype.kind == "f" else arr


def image_bytes(js, bin_, i) -> bytes:
    bv = js["bufferViews"][js["images"][i]["bufferView"]]
    o = bv.get("byteOffset", 0)
    return bin_[o:o + bv["byteLength"]]


def sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def node_local(n) -> np.ndarray:
    if "matrix" in n:
        return np.array(n["matrix"], dtype=np.float64).reshape(4, 4).T
    t = np.array(n.get("translation", [0, 0, 0]), float)
    q = np.array(n.get("rotation", [0, 0, 0, 1]), float)
    s = np.array(n.get("scale", [1, 1, 1]), float)
    x, y, z, w = q
    R = np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                  [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                  [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
    M = np.eye(4)
    M[:3, :3] = R * s
    M[:3, 3] = t
    return M


def node_globals(js) -> tuple[dict, dict]:
    """``(world matrix per node index, parent per node index)``."""
    nodes = js["nodes"]
    parent = {}
    for i, n in enumerate(nodes):
        for c in n.get("children", []):
            parent[c] = i
    G: dict = {}

    def g(i):
        if i not in G:
            M = node_local(nodes[i])
            G[i] = (g(parent[i]) @ M) if i in parent else M
        return G[i]

    for i in range(len(nodes)):
        g(i)
    return G, parent


def texture_roles(js, bin_) -> dict:
    """``{role: sha256 of the image bytes}`` for the first material's texture slots."""
    if not js.get("materials"):
        return {}
    m = js["materials"][0]
    out = {}
    for role, path in TEXTURE_ROLES:
        d = m
        for k in path:
            d = d.get(k) if isinstance(d, dict) else None
        if d and "index" in d:
            out[role] = sha(image_bytes(js, bin_, js["textures"][d["index"]]["source"]))
    return out


def _f(x):
    return float(np.round(float(x), 9))


# --------------------------------------------------------------------------------------------------------------------------
# export (Blender)
# --------------------------------------------------------------------------------------------------------------------------

def export_test_glb(rt_ob, mesh_ob, out_path, ct_ob=None) -> dict:
    """Export the runtime armature + mesh (only these two selected) at the rest pose with ``EXPORT_ARGS`` to ``out_path`` (written
    to a temp name, then renamed). Hidden / selection state is restored. Returns ``{path, bytes, sha256, args}``."""
    bl.require_bpy()
    out_path = os.path.abspath(os.fspath(out_path))
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    for arm in (ct_ob, rt_ob):
        if arm is not None:
            bl.reset_pose(arm)
    if bpy.context.object is not None and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")
    vl = bpy.context.view_layer
    hidden = {o.name: o.hide_get() for o in (rt_ob, mesh_ob)}
    selected = [o for o in vl.objects if o.select_get()]
    active = vl.objects.active
    try:
        for o in (rt_ob, mesh_ob):
            o.hide_set(False)
        for o in list(vl.objects):
            o.select_set(False)
        rt_ob.select_set(True)
        mesh_ob.select_set(True)
        vl.objects.active = rt_ob
        tmp = out_path + ".tmp.glb"
        if os.path.exists(tmp):
            os.remove(tmp)
        bpy.ops.export_scene.gltf(filepath=tmp, **EXPORT_ARGS)
        for _ in range(15):
            try:
                os.replace(tmp, out_path)
                break
            except OSError:
                time.sleep(1.0)
        else:
            raise RuntimeError(f"could not write {out_path}")
    finally:
        for o in list(vl.objects):
            o.select_set(o in selected)
        vl.objects.active = active
        for nm, h in hidden.items():
            bpy.data.objects[nm].hide_set(h)
    return {"path": out_path, "bytes": os.path.getsize(out_path), "sha256": bl.sha256_file(out_path), "args": dict(EXPORT_ARGS)}


# --------------------------------------------------------------------------------------------------------------------------
# validation (Blender: opens files, resets the session for A1.9)
# --------------------------------------------------------------------------------------------------------------------------

A1_KEYS = tuple(f"A1.{i}" for i in range(1, 15))
X_KEYS = ("X.1_no_orphan_vertex_groups", "X.2_no_vertex_with_only_non_bone_groups", "X.3_joint_count_equals_runtime_bones",
          "X.4_no_leaf_or_neutral_joints", "X.5_single_top_root")
#: the exporter drops weights <= DROP_WEIGHT, keeps the 4 largest and renormalizes; a vertex left without a bone weight above it is
#: bound to an added neutral joint (export-runtime.md)
DROP_WEIGHT = 1e-4
#: A1.14 joint scale: every joint's rest TRS scale within 1 +- BONE_SCALE_TOL. No rigkit rig carries a bone scale; what the GLB
#: shows is float32 noise of Blender's rest bone matrices, and it is not uniform: ``vec_roll_to_mat3_normalized`` builds a bone
#: matrix from 1 + y of the bone axis and switches to a series below 1 + y = 6.1e-3, i.e. within 6.33 deg of its -Y singularity,
#: which the Y-up export puts at Blender -Z (thighs and shins pointing almost straight down). The float32 cancellation in 1 + y
#: above the switch and the series truncation (sin^6 / 16) below it leave a basis-vector length error of up to
#: 2 x sin^4(6.33 deg) / 8 = 3.7e-5 right at the switch; elsewhere the noise is a few float32 eps (1.19e-7). Measured (I4 sweep of
#: 4812 bone axes 0-20 deg off -Z, tests/rigkit/I4_test_bone_scale_noise.py): worst 3.61e-5 at 6.30 deg, 1.4e-5 at 5 deg, <= 6e-7
#: below 2 deg; FL R_Thigh 1.84e-5 (it failed the old 1e-5), D01 R_Thigh 5.5e-6; every joint not pointing down <= 5 eps. 5e-5 covers
#: the bound with 35 % margin and still flags any authored scale (Blender shows 3 decimals; 1e-3 is 20 x the tolerance).
BONE_SCALE_TOL = 5e-5


def _src_scaled(src_pos, factor, offset_z):
    """Source glTF positions after S2 (glTF frame): (x, y - offset_z, z) * factor."""
    p = np.array(src_pos, dtype=np.float64)
    p[:, 1] -= offset_z
    return p * factor


def _gltf_to_blender(p):
    return np.stack([p[:, 0], -p[:, 2], p[:, 1]], 1)


def _kd(points):
    kd = kdtree.KDTree(len(points))
    for i, p in enumerate(points):
        kd.insert(Vector(p), i)
    kd.balance()
    return kd


def exporter_weights(row, drop: float = DROP_WEIGHT, keep: int = 4) -> np.ndarray:
    """The exporter's rule on one weight row (bone columns only): drop ``<= drop``, keep the ``keep`` largest, renormalize (an all-zero
    row stays zero: that vertex gets the neutral joint). Pure numpy."""
    ref = np.array(row, dtype=np.float64)
    ref[ref <= drop] = 0.0
    if (ref > 0).sum() > keep:
        ref[np.argsort(ref)[:-keep]] = 0.0
    if ref.sum() > 0:
        ref /= ref.sum()
    return ref


def summarize(A, X) -> dict:
    """``{A1_summary, extra_summary}`` of the check dicts (``checks``, ``passed``, ``failed`` keys)."""
    return {"A1_summary": {"checks": len(A), "passed": sum(v["pass"] for v in A.values()), "failed": [k for k, v in A.items() if not v["pass"]]},
            "extra_summary": {"checks": len(X), "passed": sum(v["pass"] for v in X.values()), "failed": [k for k, v in X.items() if not v["pass"]]}}


def validate(glb_path, source_glb, H, blend_path, skel=None, asset_id=None, factor=None, offset_z=None, reimport=True,
             structural=None, functest=None) -> dict:
    """A1.1-A1.14 + extra checks X.1-X.5 for the test GLB ``glb_path`` exported from ``blend_path`` (opened here), against the
    source GLB.

    ``skel``: resolved skeleton dict (expected bone names, kinds); without it the runtime armature's bones are expected.
    ``factor`` / ``offset_z``: S2 values (default: the scene properties written by ``intake.record_scene``, else recomputed from the
    source as ``H / height``). ``structural``: non-weighted, non-socket bones allowed by A1.13 (default: the skeleton's non-deform
    non-socket bones, e.g. root, cog). ``functest``: a ``functest.run`` report to embed. Every record holds pass, measured,
    threshold, note; nothing passes without a measurement.

    Robust by parts (source GLB, test GLB, its skin, the .blend, then each check): an exception is recorded in ``errors`` (part,
    message, traceback), parts that need a failed part are listed in ``skipped``, and every A1 / X check that could not be measured
    is written as failed with the reason, so all 14 + 5 keys are always present and the dict can always be written. Joints that
    carry weight in the GLB but have no vertex group in the .blend (the exporter's ``neutral_bone`` for a vertex without a bone
    weight above ``DROP_WEIGHT``) are listed (``source_consistency.blend_weights_vs_runtime_glb.weighted_joints_without_vertex_group``)
    and their weight counts as weight error. Returns the validation dict (write it with ``rigcore.npzio.write_json``).
    """
    bl.require_bpy()
    A, V, X = {}, {}, {}
    errors, skipped, done = [], [], set()
    c = types.SimpleNamespace()

    def rec(d, key, passed, measured, threshold, note=""):
        d[key] = {"pass": bool(passed), "measured": measured, "threshold": threshold, "note": note}

    def part(name, needs, fn):
        missing = [n for n in needs if n not in done]
        if missing:
            skipped.append({"part": name, "needs": missing})
            return False
        try:
            fn()
        except Exception as e:  # recorded; the checks of this part stay unmeasured (failed)
            errors.append({"part": name, "error": f"{type(e).__name__}: {e}", "traceback": traceback.format_exc(limit=8)})
            return False
        done.add(name)
        return True

    # ---------------------------------------------------------------- inputs
    def p_source():
        c.src_js, src_bin = read_glb(source_glb)
        sp = c.src_js["meshes"][0]["primitives"][0]
        c.S_pos = accessor(c.src_js, src_bin, sp["attributes"]["POSITION"])
        c.S_uv = accessor(c.src_js, src_bin, sp["attributes"]["TEXCOORD_0"]) if "TEXCOORD_0" in sp["attributes"] else None
        c.S_idx = accessor(c.src_js, src_bin, sp["indices"]).reshape(-1)
        c.src_roles = texture_roles(c.src_js, src_bin)

    def p_glb():
        c.js, c.bn = read_glb(glb_path)
        c.prim = c.js["meshes"][0]["primitives"][0]
        c.attrs = c.prim["attributes"]
        c.R_pos = accessor(c.js, c.bn, c.attrs["POSITION"])
        c.R_uv = accessor(c.js, c.bn, c.attrs["TEXCOORD_0"]) if "TEXCOORD_0" in c.attrs else None
        c.R_idx = accessor(c.js, c.bn, c.prim["indices"]).reshape(-1)
        c.nodes = c.js["nodes"]
        c.mesh_nodes = [i for i, n in enumerate(c.nodes) if "mesh" in n]
        c.GL, c.parent = node_globals(c.js)

    def p_skin():
        c.skin = c.js["skins"][0]
        c.joints = c.skin["joints"]
        c.jnames = [c.nodes[j]["name"] for j in c.joints]
        c.jset = set(c.joints)
        c.R_j = accessor(c.js, c.bn, c.attrs["JOINTS_0"]).astype(int)
        c.R_w = accessor(c.js, c.bn, c.attrs["WEIGHTS_0"]).astype(np.float64)
        c.roots = [j for j in c.joints if c.parent.get(j) not in c.jset]
        c.arm_node = c.nodes[c.parent[c.roots[0]]] if c.roots and c.roots[0] in c.parent else {}
        c.used = np.unique(c.R_j[c.R_w > 0])
        c.wb = sorted({c.jnames[k] for k in c.used})

    def p_blend():
        bl.open_file(blend_path)
        sc = bpy.context.scene
        c.ct = bl.find("control", asset_id, required=False)
        c.rt = bl.find("runtime", asset_id)
        c.me = bl.find("mesh", asset_id)
        f, oz = factor, offset_z
        if f is None:
            f = float(sc["rigkit_scale_factor"]) if "rigkit_scale_factor" in sc else None
        if oz is None:
            oz = float(sc["rigkit_offset_z"]) if "rigkit_offset_z" in sc else 0.0
        if f is None:
            if "source" not in done:
                raise RuntimeError("no rigkit_scale_factor in the scene and the source GLB could not be read")
            f = float(H) / float(c.S_pos[:, 1].max() - c.S_pos[:, 1].min())
            oz = float(c.S_pos[:, 1].min())
        c.factor, c.offset_z = f, oz
        c.rt_bones = [b.name for b in c.rt.data.bones]
        c.bone_set = set(c.rt_bones)
        if skel is not None:
            c.expected = [b["name"] for b in skel["bones"]]
            kinds = {b["name"]: b for b in skel["bones"]}
        else:
            c.expected = list(c.rt_bones)
            kinds = {b.name: {"name": b.name, "kind": "socket" if not b.use_deform and b.parent is not None and not b.children else "core",
                              "deform": b.use_deform} for b in c.rt.data.bones}
        c.sockets = [n_ for n_, b in kinds.items() if b["kind"] == "socket"]
        c.core = [n_ for n_, b in kinds.items() if b["kind"] == "core"]
        c.structural = list(structural) if structural is not None else [n_ for n_, b in kinds.items() if not b["deform"] and b["kind"] != "socket"]
        c.n = len(c.me.data.vertices)
        c.vgn = [g.name for g in c.me.vertex_groups]
        c.gidx = {nm: i for i, nm in enumerate(c.vgn)}
        Wb = np.zeros((c.n, len(c.vgn)))
        for v in c.me.data.vertices:
            for g in v.groups:
                Wb[v.index, g.group] = g.weight
        c.Wb = Wb

    part("source", (), p_source)
    part("glb", (), p_glb)
    part("skin", ("glb",), p_skin)
    part("blend", (), p_blend)

    # ---------------------------------------------------------------- A1.1-A1.8, A1.10-A1.12, A1.14
    def k_a1_1():
        skins = c.js.get("skins", [])
        skin_nodes = [i for i, n in enumerate(c.nodes) if "skin" in n]
        prims = c.js["meshes"][0]["primitives"]
        rec(A, "A1.1", len(skins) == 1 and len(c.js["meshes"]) == 1 and len(prims) == 1 and len(c.mesh_nodes) == 1 and skin_nodes == c.mesh_nodes,
            {"skins": len(skins), "meshes": len(c.js["meshes"]), "primitives": len(prims), "mesh_nodes": len(c.mesh_nodes),
             "skinned_nodes": len(skin_nodes)},
            "1 skin, 1 mesh, 1 primitive, mesh node = skinned node", "test GLB")

    def k_a1_2():
        jn = c.jnames
        bad_chars = [n_ for n_ in jn if not re.fullmatch(r"[A-Za-z0-9_]+", n_)]
        bad_side = [n_ for n_ in jn if re.match(r"^(left|right)", n_, re.I) or n_.endswith((".L", ".R", "_left", "_right", ".l", ".r"))]
        rec(A, "A1.2", sorted(jn) == sorted(c.expected) and len(set(jn)) == len(jn) == len(c.expected)
            and set(c.core) <= set(jn) and set(c.sockets) <= set(jn) and not bad_chars and not bad_side,
            {"count": len(jn), "unique": len(set(jn)), "expected": len(c.expected), "missing_core": sorted(set(c.core) - set(jn)),
             "missing_socket": sorted(set(c.sockets) - set(jn)), "extra": sorted(set(jn) - set(c.expected)), "bad_chars": bad_chars,
             "bad_side_names": bad_side},
            "names = the family skeleton (SKELETON_STANDARD.md section 3 + brief aux); unique; [A-Za-z0-9_]; L_/R_ prefixes", "")

    def k_a1_3():
        roots = c.roots
        rec(A, "A1.3", len(roots) == 1 and c.nodes[roots[0]]["name"] == "root",
            {"roots": [c.nodes[r]["name"] for r in roots], "joint_count": len(c.joints),
             "skeleton_node_parent": c.nodes[c.parent[roots[0]]]["name"] if roots and roots[0] in c.parent else None},
            "exactly one root among the joints, named root", "root's parent is the armature node (not a joint)")

    def k_a1_4_7():
        R_w, R_j = c.R_w, c.R_j
        nz = (R_w > 0).sum(1)
        sums = R_w.sum(1)
        has_set1 = "JOINTS_1" in c.attrs or "WEIGHTS_1" in c.attrs
        rec(A, "A1.4", int((nz == 0).sum()) == 0 and int((sums <= 0).sum()) == 0, {"vertices": int(len(R_w)), "empty_vertices": int((nz == 0).sum())},
            "0 empty vertices", "")
        rec(A, "A1.5", float(np.abs(sums - 1).max()) <= 1e-6,
            {"max_abs_sum_minus_1": _f(np.abs(sums - 1).max()), "min_sum": _f(sums.min()), "max_sum": _f(sums.max())}, "1 +- 1e-6",
            "WEIGHTS_0 float32")
        rec(A, "A1.6", int(nz.max()) <= 4 and not has_set1,
            {"max_nonzero_influences": int(nz.max()), "has_JOINTS_1": has_set1, "histogram": {int(k): int((nz == k).sum()) for k in np.unique(nz)}},
            "<= 4", "")
        rec(A, "A1.7", int(R_j.max()) < len(c.joints) and int(R_j.min()) >= 0,
            {"joints_in_skin": len(c.joints), "max_index_used": int(c.used.max()), "min_index": int(R_j.min()),
             "distinct_joints_with_weight": int(len(c.used))},
            "0 <= index < joint count", "")

    def k_a1_8():
        ibm = accessor(c.js, c.bn, c.skin["inverseBindMatrices"]).reshape(-1, 4, 4)
        mesh_G = c.GL[c.mesh_nodes[0]]
        errs = [float(np.abs(ibm[k].T - np.linalg.inv(np.linalg.inv(mesh_G) @ c.GL[j])).max()) for k, j in enumerate(c.joints)]
        rec(A, "A1.8", max(errs) <= 1e-5, {"max_abs_err": _f(max(errs)), "joints": len(errs), "mesh_node_world_is_identity": bool(np.allclose(mesh_G, np.eye(4)))},
            "<= 1e-5", "IBM_j == inverse(inverse(mesh_world) @ joint_world) at rest")

    def k_a1_10():
        rt_roles = texture_roles(c.js, c.bn)
        rec(A, "A1.10", rt_roles == c.src_roles and len(c.js.get("images", [])) == len(c.src_js.get("images", [])),
            {"source_sha256": c.src_roles, "runtime_sha256": rt_roles, "images": len(c.js.get("images", [])),
             "source_images": len(c.src_js.get("images", []))},
            "byte-identical by role", "sha256 of the embedded image bytes; the exporter does not re-encode")

    def k_a1_11_12():
        ymax, ymin = float(c.R_pos[:, 1].max()), float(c.R_pos[:, 1].min())
        rec(A, "A1.11", abs(ymax - H) / H <= 0.02, {"bounds_y_max_m": _f(ymax), "bounds_y_min_m": _f(ymin), "target_m": float(H),
                                                    "deviation_pct": _f((ymax - H) / H * 100), "bbox_min": [_f(v) for v in c.R_pos.min(0)],
                                                    "bbox_max": [_f(v) for v in c.R_pos.max(0)]},
            "+-2% of H", "height = highest point of the whole mesh")
        rec(A, "A1.12", abs(ymin) <= 0.01, {"lowest_vertex_y_m": _f(ymin)}, "0 +- 0.01 m", "")

    def k_a1_14():
        nodes = c.nodes
        bone_scale_dev, neg, worst = 0.0, False, None
        for j in c.joints:
            s_ = np.array(nodes[j].get("scale", [1, 1, 1]))
            if float(np.abs(s_ - 1).max()) > bone_scale_dev:
                bone_scale_dev, worst = float(np.abs(s_ - 1).max()), nodes[j].get("name")
            neg |= bool((s_ <= 0).any())
        ident = lambda n_: all(k not in n_ for k in ("matrix", "translation", "rotation", "scale"))  # noqa: E731
        glb_obj_ok = ident(c.arm_node) and ident(nodes[c.mesh_nodes[0]])
        obj_t, blend_ok = {}, True
        for o in [x for x in (c.ct, c.rt, c.me) if x is not None]:
            t = {"loc": [_f(v) for v in o.location], "rot_euler": [_f(v) for v in o.rotation_euler], "scale": [_f(v) for v in o.scale],
                 "delta_loc": [_f(v) for v in o.delta_location], "delta_rot": [_f(v) for v in o.delta_rotation_euler],
                 "delta_scale": [_f(v) for v in o.delta_scale]}
            obj_t[o.name] = t
            blend_ok &= (max(abs(v) for v in t["loc"] + t["rot_euler"] + t["delta_loc"] + t["delta_rot"]) == 0
                         and np.allclose(t["scale"], 1) and np.allclose(t["delta_scale"], 1))
        pinv_ok = bool(np.allclose(np.array(c.me.matrix_parent_inverse), np.eye(4)))
        blend_ok &= c.me.parent == c.rt and pinv_ok
        rec(A, "A1.14", glb_obj_ok and not neg and bone_scale_dev <= BONE_SCALE_TOL and blend_ok,
            {"blend_objects": obj_t, "mesh_parent": c.me.parent.name if c.me.parent else None, "mesh_parent_inverse_identity": pinv_ok,
             "glb_armature_and_mesh_nodes_identity_TRS": glb_obj_ok, "glb_root_bone_identity_TRS": ident(nodes[c.roots[0]]) if c.roots else None,
             "glb_bone_max_scale_dev": _f(bone_scale_dev), "glb_bone_max_scale_dev_joint": worst, "glb_negative_scale": neg},
            f"object scale 1, no negative scale, rotation applied; bone scale 1 +- {BONE_SCALE_TOL:g}",
            "small bone scale deviations are float32 noise of the rest bone matrices, up to 3.7e-5 for bones within ~6 deg of "
            "straight down (rigkit.export.BONE_SCALE_TOL)")

    part("A1.1", ("glb",), k_a1_1)
    part("A1.2", ("skin", "blend"), k_a1_2)
    part("A1.3", ("skin",), k_a1_3)
    part("A1.4-A1.7", ("skin",), k_a1_4_7)
    part("A1.8", ("skin",), k_a1_8)
    part("A1.10", ("source", "glb"), k_a1_10)
    part("A1.11-A1.12", ("glb",), k_a1_11_12)
    part("A1.14", ("skin", "blend"), k_a1_14)

    # ---------------------------------------------------------------- source consistency
    def v_spatial():
        from rigkit import meshio

        c.S_scaled = _src_scaled(c.S_pos, c.factor, c.offset_z)
        c.src_bl = _gltf_to_blender(c.S_scaled)
        bl_co = meshio.rest_vertices(c.me, world=True)
        c.same_count = c.n == len(c.S_pos)
        V["blend_mesh_vs_scaled_source"] = {"vertex_count": c.n, "source_vertex_count": int(len(c.S_pos)),
                                            "max_vertex_diff_m": _f(np.abs(bl_co - c.src_bl).max()) if c.same_count else None,
                                            "scale_factor": _f(c.factor), "offset_z_m": _f(c.offset_z)}
        kd_s = _kd(c.S_scaled)
        R_pos, R_uv, S_uv = c.R_pos, c.R_uv, c.S_uv
        match = np.full(len(R_pos), -1)
        fwd = np.zeros(len(R_pos))
        for i, p in enumerate(R_pos):
            cand = kd_s.find_range(Vector(p), 2e-5)
            if not cand:
                fwd[i] = kd_s.find(Vector(p))[2]
                continue
            best = min(cand, key=lambda t: float(np.abs(S_uv[t[1]] - R_uv[i]).max())) if S_uv is not None and R_uv is not None else cand[0]
            fwd[i] = best[2]
            match[i] = best[1]
        kd_r = _kd(R_pos)
        rev = np.array([kd_r.find(Vector(p))[2] for p in c.S_scaled])
        _, weld_id = np.unique(c.S_pos.astype(np.float32), axis=0, return_inverse=True)
        weld_id = weld_id.ravel()

        def tri_keys(idx, remap):
            out = {}
            for t in idx.reshape(-1, 3):
                if remap is not None and (remap[t] < 0).any():
                    k = ("unmatched",)
                else:
                    k = tuple(sorted(int(weld_id[remap[v] if remap is not None else v]) for v in t))
                out[k] = out.get(k, 0) + 1
            return out

        c.tri_match = tri_keys(c.S_idx, None) == tri_keys(c.R_idx, match)
        c.match, c.fwd, c.rev = match, fwd, rev
        V["glb_vs_source_spatial"] = {"runtime_vertices": int(len(R_pos)), "source_vertices": int(len(c.S_pos)), "forward_max_dist_m": _f(fwd.max()),
                                      "reverse_max_dist_m": _f(rev.max()), "triangle_welded_vertex_triples_equal": bool(c.tri_match),
                                      "unmatched_runtime_vertices": int((match < 0).sum())}

    def v_weights():
        # the exporter's rule on the .blend weights (bone groups only) vs the GLB; a joint without a vertex group (the exporter's
        # neutral joint) gets a column of its own, which the .blend side never fills: its weight counts as error
        no_group = sorted({nm for nm in c.jnames if nm not in c.gidx})
        cols = {nm: i for i, nm in enumerate(c.vgn + no_group)}
        bone_cols = [c.gidx[b] for b in c.rt_bones if b in c.gidx]
        w_err, worst, on_extra, extra_max = 0.0, None, 0, 0.0
        compared = 0
        if c.same_count:
            for i in range(len(c.R_pos)):
                s_ = c.match[i]
                if s_ < 0:
                    continue
                row = np.zeros(len(cols))
                for jj, ww in zip(c.R_j[i], c.R_w[i]):
                    if ww > 0:
                        row[cols[c.jnames[jj]]] += ww
                full = np.zeros(len(c.vgn))  # bone columns only, in vertex-group order (as round 1: same tie order)
                full[bone_cols] = c.Wb[s_, bone_cols]
                ref = np.concatenate([exporter_weights(full), np.zeros(len(no_group))])
                e = float(np.abs(row - ref).max())
                compared += 1
                if e > w_err:
                    w_err, worst = e, int(i)
                if no_group:
                    xw = float(row[len(c.vgn):].sum())
                    if xw > 0:
                        on_extra += 1
                        extra_max = max(extra_max, xw)
        V["blend_weights_vs_runtime_glb"] = {
            "max_abs_weight_diff": _f(w_err) if c.same_count else None, "worst_glb_vertex": worst, "vertices_compared": compared,
            "vertex_groups_in_blend": len(c.vgn), "weighted_joints_without_vertex_group": [nm for nm in no_group if nm in c.wb],
            "glb_vertices_on_joints_without_group": on_extra, "max_weight_on_joints_without_group": _f(extra_max),
            "note": ("matched by position + UV; groups by bone name; the exporter's rule (drop <= 1e-4, top 4, renormalize) applied to the "
                     ".blend side; weight on a joint without a vertex group (neutral joint) counts as error")
                    + ("" if c.same_count else "; NOT compared: the .blend and the source have different vertex counts")}

    def v_rest():
        Cm = Matrix(((1, 0, 0, 0), (0, 0, 1, 0), (0, -1, 0, 0), (0, 0, 0, 1)))
        rt = c.rt
        rest_rows = {nm: float(np.abs(c.GL[j] - np.array(Cm @ rt.data.bones[nm].matrix_local)).max()) for j, nm in zip(c.joints, c.jnames)
                     if nm in rt.data.bones}
        V["blend_runtime_rest_vs_glb"] = {"max_abs_matrix_diff": _f(max(rest_rows.values())) if rest_rows else None,
                                          "worst_bone": max(rest_rows, key=rest_rows.get) if rest_rows else None,
                                          "bone_count_blend": len(c.rt_bones), "bone_count_glb": len(c.joints)}
        if c.ct is not None:
            ctl_err = 0.0
            for b in c.ct.data.bones:
                if b.name.startswith("ctl_") and b.name[4:] in rt.data.bones:
                    ctl_err = max(ctl_err, float(np.abs(np.array(rt.data.bones[b.name[4:]].matrix_local) - np.array(b.matrix_local)).max()))
            V["control_vs_runtime_rest_max_diff"] = _f(ctl_err)
        nodes = c.nodes
        V["hidden_helpers"] = {"glb_node_names_with_ctl_prefix": [x["name"] for x in nodes if x.get("name", "").startswith("ctl_")],
                               "glb_node_count": len(nodes), "glb_expected_node_count": len(c.expected) + 2,
                               "glb_nodes_not_bones": [x.get("name") for i, x in enumerate(nodes) if i not in c.jset],
                               "glb_animations": len(c.js.get("animations", [])), "glb_extra_meshes": len(c.js["meshes"]) - 1}
        V["bones"] = {"runtime_total": len(c.rt_bones), "control_total": len(c.ct.data.bones) if c.ct else None,
                      "deform": sum(1 for b in rt.data.bones if b.use_deform), "weighted_in_glb": c.wb, "weighted_count": len(c.wb)}

    part("spatial", ("source", "glb", "blend"), v_spatial)
    part("weights", ("spatial", "skin"), v_weights)
    part("rest", ("skin", "blend"), v_rest)

    # ---------------------------------------------------------------- A1.13
    def k_a1_13():
        nodes, parent, jset = c.nodes, c.parent, c.jset
        zero = [nm for nm in c.jnames if nm not in c.wb]
        anc = set()
        for j in c.joints:
            if nodes[j]["name"] in c.wb or nodes[j]["name"] in c.sockets:
                p = parent.get(j)
                while p in jset:
                    anc.add(nodes[p]["name"])
                    p = parent.get(p)
        ok_zero = all(z in c.sockets or (z in anc and z in c.structural) for z in zero)
        rec(A, "A1.13", ok_zero,
            {"zero_weight_bones": zero, "of_which_sockets": [z for z in zero if z in c.sockets],
             "of_which_structural_ancestors": [z for z in zero if z not in c.sockets],
             "allowed_structural": list(c.structural), "weighted_bones": len(c.wb)},
            "only sockets + structural ancestors (root, cog: exception agreed at G1)", "")

    part("A1.13", ("skin", "blend"), k_a1_13)

    # ---------------------------------------------------------------- extra checks (export-runtime.md)
    def x_groups():
        vgn, bone_set = c.vgn, c.bone_set
        orphan = [g for g in vgn if g not in bone_set]
        nonbone_only, nogroup, ex_nonbone, ex_none = 0, 0, [], []
        for v in c.me.data.vertices:
            kept = [vgn[g.group] for g in v.groups if g.weight > DROP_WEIGHT]  # what survives the exporter's drop rule
            if not kept:
                nogroup += 1
                if len(ex_none) < 10:
                    ex_none.append(v.index)
            elif not any(nm in bone_set for nm in kept):
                nonbone_only += 1
                if len(ex_nonbone) < 10:
                    ex_nonbone.append(v.index)
        rec(X, "X.1_no_orphan_vertex_groups", not orphan, {"orphan_groups": orphan}, "0 vertex groups without a runtime bone", "")
        rec(X, "X.2_no_vertex_with_only_non_bone_groups", nonbone_only == 0 and nogroup == 0,
            {"vertices_only_non_bone_groups": nonbone_only, "vertices_without_groups": nogroup,
             "examples_only_non_bone_groups": ex_nonbone, "examples_without_groups": ex_none, "weight_threshold": DROP_WEIGHT},
            "0", f"counted after the exporter's drop rule (weight > {DROP_WEIGHT:g}); such vertices get a neutral joint")

    def x_joints():
        jn, bone_set = c.jnames, c.bone_set
        rec(X, "X.3_joint_count_equals_runtime_bones", len(c.joints) == len(c.rt_bones) and set(jn) == bone_set,
            {"joints": len(c.joints), "runtime_bones": len(c.rt_bones), "joints_not_bones": sorted(set(jn) - bone_set),
             "bones_not_joints": sorted(bone_set - set(jn))}, "equal", "")
        leafish = [n_ for n_ in jn if n_.endswith("_end") or n_.lower().startswith("neutral")]
        rec(X, "X.4_no_leaf_or_neutral_joints", not leafish and set(jn) <= bone_set,
            {"leaf_or_neutral": leafish, "joints_not_bones": sorted(set(jn) - bone_set)},
            "none", "export_leaf_bone=False; no vertex without a bone group")

    def x_root():
        arm_children = [c.nodes[ch]["name"] for ch in c.arm_node.get("children", []) if ch in c.jset] if c.arm_node else []
        rec(X, "X.5_single_top_root", arm_children == ["root"], {"joints_under_armature_node": arm_children}, "only root", "")

    part("X.1-X.2", ("blend",), x_groups)
    part("X.3-X.4", ("skin", "blend"), x_joints)
    part("X.5", ("skin",), x_root)

    # ---------------------------------------------------------------- A1.9: clean reimport from a fresh folder (resets the session: last)
    def k_a1_9():
        from rigkit import meshio

        tmpd = os.path.join(os.path.dirname(os.path.abspath(glb_path)), "reimport_tmp_" + datetime.datetime.now().strftime("%H%M%S%f"))
        os.makedirs(tmpd)
        try:
            shutil.copy2(glb_path, tmpd)
            bpy.ops.wm.read_factory_settings(use_empty=True)
            bpy.ops.import_scene.gltf(filepath=os.path.join(tmpd, os.path.basename(glb_path)))
            imp_mesh = [o for o in bpy.data.objects if o.type == "MESH"][0]
            imp_arm = [o for o in bpy.data.objects if o.type == "ARMATURE"]
            ipos = meshio.evaluated_vertices(imp_mesh, world=True).astype(np.float64)
            kd_b = _kd(c.src_bl)
            fwd_b = max(kd_b.find(Vector(p))[2] for p in ipos)
            kd_i = _kd(ipos)
            rev_b = max(kd_i.find(Vector(p))[2] for p in c.src_bl)
            imp_bones = len(imp_arm[0].data.bones) if imp_arm else 0
            rec(A, "A1.9", fwd_b <= 1e-4 and rev_b <= 1e-4 and c.tri_match and c.fwd.max() <= 1e-4 and c.rev.max() <= 1e-4,
                {"blender_reimport_forward_max_m": _f(fwd_b), "blender_reimport_reverse_max_m": _f(rev_b), "glb_direct_forward_max_m": _f(c.fwd.max()),
                 "glb_direct_reverse_max_m": _f(c.rev.max()), "triangle_position_multisets_equal": bool(c.tri_match),
                 "reimport_vertex_count": int(len(ipos)), "source_vertex_count": int(len(c.src_bl)), "reimport_bones": imp_bones,
                 "reimport_vertex_groups": len(imp_mesh.vertex_groups), "reimport_images": {i.name: list(i.size) for i in bpy.data.images},
                 "tolerance_m": 1e-4},
                "<= 1e-4 m both ways (spatial match; seam duplicates ignored)", "fresh folder, empty scene; folder removed afterwards")
        finally:
            shutil.rmtree(tmpd, ignore_errors=True)

    if reimport:
        part("A1.9", ("spatial",), k_a1_9)
    else:
        rec(A, "A1.9", False, {"skipped": True}, "<= 1e-4 m", "reimport skipped by the caller: not measured, so not passed")

    # ---------------------------------------------------------------- every check present; unmeasured = failed
    why = "; ".join(f"{e['part']}: {e['error']}" for e in errors) or "; ".join(f"{s['part']} needs {s['needs']}" for s in skipped)
    for key in A1_KEYS:
        if key not in A:
            rec(A, key, False, {"not_measured": True}, "-", f"not measured ({why})")
    for key in X_KEYS:
        if key not in X:
            rec(X, key, False, {"not_measured": True}, "-", f"not measured ({why})")
    A = {k: A[k] for k in A1_KEYS}
    X = {k: X[k] for k in X_KEYS}

    def _sha(p):
        return bl.sha256_file(p) if p and os.path.isfile(p) else None

    out = {
        "asset": asset_id, "date": datetime.date.today().isoformat(), "blender": bpy.app.version_string,
        "scope": "S8 test GLB (rig/checks), not the release <asset>_rig.glb",
        "inputs": {"source_glb": os.path.abspath(source_glb), "source_glb_sha256": _sha(source_glb), "blend": os.path.abspath(blend_path),
                   "blend_sha256": _sha(blend_path), "test_glb": os.path.abspath(glb_path), "test_glb_sha256": _sha(glb_path),
                   "test_glb_bytes": os.path.getsize(glb_path) if os.path.isfile(glb_path) else None,
                   "scale_factor": _f(c.factor) if hasattr(c, "factor") else None,
                   "offset_z_m": _f(c.offset_z) if hasattr(c, "offset_z") else None, "H": float(H), "export_args": dict(EXPORT_ARGS)},
        "A1": A,
        **summarize(A, X),
        "extra_checks": X,
        "source_consistency": V,
        "errors": errors,
        "skipped_parts": skipped,
        "material_note": "the Blender exporter drops some source material extensions (D01: KHR_materials_volume, default specularFactor); "
                         "textures stay byte-identical (A1.10)",
        "source_extensions": c.src_js.get("extensionsUsed", []) if hasattr(c, "src_js") else None,
        "test_glb_extensions": c.js.get("extensionsUsed", []) if hasattr(c, "js") else None,
    }
    if functest is not None:
        out["rig_function_tests"] = {"passed": functest.get("passed"), "total": functest.get("total"), "tests": functest.get("tests"),
                                     "extra_passed": functest.get("extra_passed"), "extra_total": functest.get("extra_total")}
        out["pose_extremes_all_finite"] = functest.get("pose_extremes_all_finite")
    return out


def failed_validation(error: BaseException, inputs: dict) -> dict:
    """A validation dict for a run that could not validate at all (export failed, or ``validate`` itself raised): every A1 / X
    check failed as not measured, with the error and its traceback."""
    msg = f"{type(error).__name__}: {error}"
    A = {k: {"pass": False, "measured": {"not_measured": True}, "threshold": "-", "note": f"not measured ({msg})"} for k in A1_KEYS}
    X = {k: {"pass": False, "measured": {"not_measured": True}, "threshold": "-", "note": f"not measured ({msg})"} for k in X_KEYS}
    tb = "".join(traceback.format_exception(type(error), error, error.__traceback__))
    return {"date": datetime.date.today().isoformat(), "scope": "S8 test GLB (rig/checks), not the release <asset>_rig.glb",
            "inputs": inputs, "A1": A, **summarize(A, X), "extra_checks": X, "source_consistency": {},
            "errors": [{"part": "validate", "error": msg, "traceback": tb}], "skipped_parts": []}


def main(argv=None):
    """S8 step CLI (see the module docstring). ``validation.json`` is always written to ``--out-dir``, also when the export or the
    validation fails (then with every check failed and the error). Exit 0 only when every A1 and X check passes."""
    import argparse

    from rigcore import npzio, template

    ap = argparse.ArgumentParser(description="S8: export the test GLB from a rig .blend and validate it (A1.1-A1.14 + extras)")
    ap.add_argument("--blend", required=True)
    ap.add_argument("--source-glb", required=True)
    ap.add_argument("--H", type=float, required=True)
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("--asset-id", default=None)
    ap.add_argument("--skeleton", default=None, help="skeleton.json (expected bone names and kinds)")
    ap.add_argument("--glb-name", default=None)
    a = ap.parse_args(bl.script_args() if argv is None else argv)
    vpath = os.path.join(a.out_dir, "validation.json")
    info = None
    try:
        bl.open_file(a.blend)
        rt = bl.find("runtime", a.asset_id)
        me = bl.find("mesh", a.asset_id)
        ct = bl.find("control", a.asset_id, required=False)
        glb = os.path.join(a.out_dir, a.glb_name or f"{a.asset_id or me.name}_runtime_check.glb")
        info = export_test_glb(rt, me, glb, ct)
        skel = template.load_skeleton(a.skeleton) if a.skeleton else None
        val = validate(glb, a.source_glb, a.H, a.blend, skel=skel, asset_id=a.asset_id)
    except Exception as e:  # still write validation.json: the failure is evidence too
        val = failed_validation(e, {"source_glb": os.path.abspath(a.source_glb), "blend": os.path.abspath(a.blend), "H": a.H,
                                    "export_args": dict(EXPORT_ARGS)})
        print("ERROR: " + val["errors"][0]["traceback"])
    val["export"] = info
    path = npzio.write_json(vpath, val)
    ok = not val["A1_summary"]["failed"] and not val["extra_summary"]["failed"]
    rpath = os.path.join(os.path.dirname(os.path.abspath(a.blend)), "rig_recipe.json")
    if os.path.exists(rpath):
        from rigcore import recipe

        rec = recipe.load_recipe(rpath)
        recipe.log_step(rec, "S8", {"export_args": dict(EXPORT_ARGS), "H": a.H},
                        {"validation": path, "test_glb": info["path"] if info else None, "test_glb_sha256": info["sha256"] if info else None,
                         "A1": val["A1_summary"], "extra": val["extra_summary"], "errors": [e["error"] for e in val["errors"]], "ok": ok})
        recipe.save_recipe(rpath, rec)
    print(bl.json_line({"step": "S8", "ok": ok, "validation": path, "A1": val["A1_summary"], "extra": val["extra_summary"],
                        "errors": [e["part"] + ": " + e["error"] for e in val["errors"]]}))
    return 0 if ok else 1


if __name__ == "__main__":
    bl.run_main(main)
