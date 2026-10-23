r"""A2 Blender cross-check: does solvers.glbmesh (trimesh, no Blender) give the same vertices, in the same order, as Blender's glTF
importer? B and C rely on that vertex correspondence (weights.npz / poses.npz rows = Blender vertex indices).

Run headless (Blender 5.2):
    blender.exe -b --factory-startup -P A2_test_glb_import_order.py -- --glb <file.glb> --mesh-npz <glbmesh mesh.npz>
        [--out E:\tmp_rigkit\A2\blender_check\<asset>.npz] [--json <summary.json>]

Imports the GLB with the importer defaults (merge vertices off), takes the evaluated world positions of the mesh, applies the same S2
rule (uniform factor so the Z extent = H from the npz meta, lowest vertex at z = 0), and compares with mesh.npz: vertex count,
per-index positions, UVs, triangles (in order and as sets), material count. Prints one JSON summary line (prefix "A2_SUMMARY ")
and exits 1 on a vertex count/order mismatch. Writes nothing outside --out/--json.
"""
import json
import os
import sys

import bpy
import numpy as np


def args():
    import argparse

    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--glb", required=True)
    ap.add_argument("--mesh-npz", required=True)
    ap.add_argument("--out", default=None)
    ap.add_argument("--json", default=None)
    ap.add_argument("--tol", type=float, default=1e-6, help="metres, after S2")
    return ap.parse_args(argv)


def blender_arrays(glb):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=glb)
    obs = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    if len(obs) != 1:
        raise SystemExit(f"expected one mesh object, got {len(obs)}")
    ob = obs[0]
    me = ob.data
    n = len(me.vertices)
    co = np.empty(n * 3, dtype=np.float64)
    me.vertices.foreach_get("co", co)
    co = co.reshape(n, 3)
    mw = np.array(ob.matrix_world)
    co = co @ mw[:3, :3].T + mw[:3, 3]
    me.calc_loop_triangles()
    tris = np.empty(len(me.loop_triangles) * 3, dtype=np.int64)
    me.loop_triangles.foreach_get("vertices", tris)
    tris = tris.reshape(-1, 3)
    uv = None
    if me.uv_layers:
        uvl = me.uv_layers[0].data
        uv_loop = np.empty(len(uvl) * 2)
        uvl.foreach_get("uv", uv_loop)
        vert_of_loop = np.empty(len(me.loops), dtype=np.int64)
        me.loops.foreach_get("vertex_index", vert_of_loop)
        uv = np.zeros((n, 2))
        uv[vert_of_loop] = uv_loop.reshape(-1, 2)
    poly_sizes = np.empty(len(me.polygons), dtype=np.int64)
    me.polygons.foreach_get("loop_total", poly_sizes)
    return {"V": co, "tris": tris, "uv": uv, "n_polygons": len(me.polygons), "max_polygon_size": int(poly_sizes.max()),
            "n_materials": len(me.materials), "matrix_world_identity": bool(np.allclose(mw, np.eye(4))), "object": ob.name,
            "blender_version": bpy.app.version_string}


def main():
    a = args()
    b = blender_arrays(a.glb)
    with np.load(a.mesh_npz, allow_pickle=False) as z:
        V = z["V"]
        F = z["F"]
        UV = z["UV"] if "UV" in z.files else None
        meta = json.loads(str(z["meta"][()]))
    H = float(meta["H"])
    Vb = b["V"]
    zmin, zmax = Vb[:, 2].min(), Vb[:, 2].max()
    factor = H / (zmax - zmin)
    Vb = Vb * factor
    Vb[:, 2] -= zmin * factor
    out = {"glb": a.glb, "mesh_npz": a.mesh_npz, "blender": b["blender_version"], "object": b["object"],
           "n_vertices_blender": int(len(Vb)), "n_vertices_npz": int(len(V)),
           "n_loop_triangles_blender": int(len(b["tris"])), "n_triangles_npz": int(len(F)),
           "n_polygons_blender": b["n_polygons"], "max_polygon_size_blender": b["max_polygon_size"],
           "matrix_world_identity": b["matrix_world_identity"], "factor_blender": factor,
           "factor_npz": meta.get("scale_factor")}
    ok = len(Vb) == len(V)
    if ok:
        d = np.abs(Vb - V).max(axis=1)
        out["position_max_abs_diff_m"] = float(d.max())
        out["vertices_over_tol"] = int((d > a.tol).sum())
        ok = out["vertices_over_tol"] == 0
        if UV is not None and b["uv"] is not None:
            out["uv_max_abs_diff"] = float(np.abs(b["uv"] - UV).max())
        same_order = len(b["tris"]) == len(F) and bool(np.array_equal(b["tris"], F))
        out["triangles_identical_in_order"] = same_order
        sb = {tuple(sorted(t)) for t in b["tris"].tolist()}
        sn = {tuple(sorted(t)) for t in F.tolist()}
        out["triangles_identical_as_sets"] = sb == sn
        out["triangles_only_in_blender"] = len(sb - sn)
        out["triangles_only_in_npz"] = len(sn - sb)
    out["vertex_order_match"] = bool(ok)
    if a.out:
        os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
        np.savez_compressed(a.out, V=Vb, tris=b["tris"], uv=b["uv"] if b["uv"] is not None else np.zeros((0, 2)))
    line = json.dumps(out)
    if a.json:
        os.makedirs(os.path.dirname(os.path.abspath(a.json)), exist_ok=True)
        with open(a.json, "w", encoding="utf-8") as f:
            f.write(json.dumps(out, indent=2) + "\n")
    print("A2_SUMMARY " + line, flush=True)
    sys.stdout.flush()
    os._exit(0 if ok else 1)


main()
