"""B dev data: G2-approved D01 rig -> mesh.npz, gt_weights.npz, skeleton.json (+ export.json summary). Headless Blender only.

Run (on a COPY of the G2 .blend; the asset folder is read-only):

    blender.exe -b --factory-startup <copy>.blend -P B_export_d01.py -- --out E:\\tmp_rigkit\\B\\d01

Writes into ``--out``:
* ``mesh.npz``: object-space V of mesh ``D01_hodling`` (float64 of the stored float32, Blender vertex order), F from loop
  triangles, weld (rigcore.mesh.weld_map), UV per vertex (last loop wins, as D01 a0_dump_mesh), extras ``col`` (base colour at
  the UV, sampled exactly as D01 d01_common.sample_basecolor: image copy scaled to 1024, nearest pixel) and ``N`` (vertex normals);
* ``gt_weights.npz``: the 25 vertex groups (= deform bones of the 35-bone runtime ``D01_runtime``) in skeleton order, candidate
  ``gt_g2``;
* ``skeleton.json``: resolved-skeleton dict of ``D01_runtime`` (heads/tails in armature space = world, hinge = bone local X,
  kind from the bone collections, deform flags, parents) with the S family ``skin`` block;
* ``export.json``: counts and checks. Prints one JSON line ``B_EXPORT {...}``; exit code 1 on failure.
"""
import argparse
import json
import os
import sys

sys.dont_write_bytecode = True  # Blender's Python writes bytecode by default: keep the skill folders clean
import traceback

SCRIPTS = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, SCRIPTS)

import bpy  # noqa: E402
import numpy as np  # noqa: E402

from rigcore import mesh as rmesh  # noqa: E402
from rigcore import npzio, template  # noqa: E402
from rigkit import skin_io  # noqa: E402

D01_SCALE = 0.679495687
D01_GLB_SHA = "bf22ccea25b72a879048fe3d0bf4ecf92b551984b85081ae97e3bea56f3d8c5a"
KIND_OF_COLLECTION = {"Root": "core", "Deform": "core", "Aux": "aux", "Sockets": "socket"}


def sample_basecolor(uv, max_side=1024):
    """Copy of D01 d01_common.sample_basecolor (same image, same resample, same nearest-pixel rule)."""
    src = [i for i in bpy.data.images if "basecolor" in i.name.lower()][0]
    cp = src.copy()
    cp.scale(max_side, max_side)
    px = np.empty(max_side * max_side * 4, dtype=np.float32)
    cp.pixels.foreach_get(px)
    px = px.reshape(max_side, max_side, 4)[:, :, :3]
    u = np.clip((uv[:, 0] * (max_side - 1)).round().astype(int), 0, max_side - 1)
    v = np.clip((uv[:, 1] * (max_side - 1)).round().astype(int), 0, max_side - 1)
    col = px[v, u]
    bpy.data.images.remove(cp)
    return col.astype(np.float64)


def mesh_arrays(ob):
    me = ob.data
    n = len(me.vertices)
    co = np.empty(n * 3, dtype=np.float32)
    me.vertices.foreach_get("co", co)
    V = co.reshape(n, 3).astype(np.float64)
    me.calc_loop_triangles()
    tris = np.empty(len(me.loop_triangles) * 3, dtype=np.int64)
    me.loop_triangles.foreach_get("vertices", tris)
    F = tris.reshape(-1, 3)
    uvl = me.uv_layers[0].data
    uv_loop = np.empty(len(uvl) * 2)
    uvl.foreach_get("uv", uv_loop)
    vert_of_loop = np.empty(len(me.loops), dtype=np.int64)
    me.loops.foreach_get("vertex_index", vert_of_loop)
    uv = np.zeros((n, 2))
    uv[vert_of_loop] = uv_loop.reshape(-1, 2)
    nor = np.empty(n * 3, dtype=np.float32)
    me.vertices.foreach_get("normal", nor)
    mat = np.empty(len(me.loop_triangles), dtype=np.int64)
    me.loop_triangles.foreach_get("material_index", mat)
    return V, F, uv, nor.reshape(n, 3), mat


def skeleton_dict(arm_ob, H, skin_block):
    bones = []
    for b in arm_ob.data.bones:  # bones are stored parent-before-child
        colls = [c.name for c in b.collections]
        kind = next((KIND_OF_COLLECTION[c] for c in colls if c in KIND_OF_COLLECTION), "core")
        ml = np.array(b.matrix_local)
        x = ml[:3, 0] / np.linalg.norm(ml[:3, 0])
        side = b.name[0] if b.name[:2] in ("L_", "R_") else (b.name[-1] if b.name[-2:] in ("_L", "_R") else None)
        bones.append({"name": b.name, "parent": b.parent.name if b.parent else None, "kind": kind, "deform": bool(b.use_deform),
                      "head": [float(c) for c in b.head_local], "tail": [float(c) for c in b.tail_local],
                      "hinge": [float(c) for c in x], "bend_test": None, "twist": None, "side": side})
    return {"schema": 0, "family": "S_legacy_D01", "template_version": "g2_approved_2026-10-21", "H": float(H),
            "control_kit": None, "bones": bones, "ik": [], "rom": [], "rom_compound": [], "skin": skin_block,
            "warnings": ["exported from the G2 snapshot D01_runtime (B_export_d01.py); hinge = bone local X"]}


def main(argv):
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--mesh", default="D01_hodling")
    ap.add_argument("--armature", default="D01_runtime")
    ap.add_argument("--H", type=float, default=0.5)
    a = ap.parse_args(argv)
    os.makedirs(a.out, exist_ok=True)
    ob = bpy.data.objects[a.mesh]
    arm = bpy.data.objects[a.armature]
    checks = {"mesh_world_identity": bool(np.allclose(np.array(ob.matrix_world), np.eye(4))),
              "armature_world_identity": bool(np.allclose(np.array(arm.matrix_world), np.eye(4)))}
    V, F, uv, N, mat = mesh_arrays(ob)
    weld = rmesh.weld_map(V)
    col = sample_basecolor(uv)
    meta = npzio.mesh_meta(a.mesh, a.H, scale_factor=D01_SCALE, source_sha256=D01_GLB_SHA,
                           blend=bpy.data.filepath, exporter="tests/rigkit/B_export_d01.py")
    npzio.save_mesh(os.path.join(a.out, "mesh.npz"), V, F, weld=weld, UV=uv.astype(np.float32), mat=mat.astype(np.int16),
                    meta=meta, extra={"col": col.astype(np.float32), "N": N})
    fam = template.expand_sides(template.load_family("S"))
    skel = skeleton_dict(arm, a.H, fam["skin"])
    template.save_skeleton(os.path.join(a.out, "skeleton.json"), skel)
    deform = [b["name"] for b in skel["bones"] if b["deform"]]
    groups = [vg.name for vg in ob.vertex_groups]
    names, W = skin_io.read_groups(ob, deform, method="gn")
    _, W_loop = skin_io.read_groups(ob, deform, method="loop")
    checks["gn_vs_loop_max_diff"] = float(np.abs(W - W_loop).max())
    npzio.save_weights(os.path.join(a.out, "gt_weights.npz"), names, W,
                       meta={"candidate": "gt_g2", "params": {"source": bpy.data.filepath, "object": a.mesh}})
    s = W.sum(1)
    summary = {"vertices": int(V.shape[0]), "triangles": int(F.shape[0]), "welded": int(weld.max()) + 1,
               "groups": groups, "deform_bones": deform, "groups_equal_deform": sorted(groups) == sorted(deform),
               "bones_total": len(skel["bones"]), "weight_sum_err": float(np.abs(s - 1).max()),
               "max_influences": int((W > 0).sum(1).max()), "empty": int((s == 0).sum()), "checks": checks,
               "out": a.out}
    ok = (checks["mesh_world_identity"] and checks["armature_world_identity"] and summary["groups_equal_deform"]
          and checks["gn_vs_loop_max_diff"] == 0.0 and summary["empty"] == 0)
    summary["ok"] = bool(ok)
    npzio.write_json(os.path.join(a.out, "export.json"), summary)
    print("B_EXPORT " + json.dumps(summary))
    return 0 if ok else 1


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    try:
        code = main(argv)
    except Exception:
        traceback.print_exc()
        print("B_EXPORT " + json.dumps({"ok": False, "error": traceback.format_exc(limit=3)}))
        code = 1
    sys.stdout.flush()
    os._exit(code)
