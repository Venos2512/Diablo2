"""A0: import GLB goc (chi doc) vao Blender, scale deu ve 0,5 m, ghi mesh ra npz de phan tich landmark ngoai Blender.

Chay:  blender -b --factory-startup -P a0_dump_mesh.py
Ra: rig/_work/mesh_scaled.npz (co, nor, uv, tris), rig/_work/mesh_scaled_info.json
"""
import json
import os
import sys

import bpy
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import d01_common as C

assert C.sha256_file(C.GLB) == C.GLB_SHA256, "GLB goc da bi doi"
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=C.GLB)
ob = [o for o in bpy.data.objects if o.type == "MESH"][0]
me = ob.data
n = len(me.vertices)
co = np.empty(n * 3, dtype=np.float64)
me.vertices.foreach_get("co", co)
co = co.reshape(n, 3)
mw = np.array(ob.matrix_world)
co = co @ mw[:3, :3].T + mw[:3, 3]
zmax = co[:, 2].max()
f = C.TARGET_HEIGHT_M / zmax
co *= f
me.calc_loop_triangles()
tris = np.empty(len(me.loop_triangles) * 3, dtype=np.int64)
me.loop_triangles.foreach_get("vertices", tris)
tris = tris.reshape(-1, 3)
uvl = me.uv_layers[0].data
uv_loop = np.empty(len(uvl) * 2)
uvl.foreach_get("uv", uv_loop)
uv_loop = uv_loop.reshape(-1, 2)
vert_of_loop = np.empty(len(me.loops), dtype=np.int64)
me.loops.foreach_get("vertex_index", vert_of_loop)
uv = np.zeros((n, 2))
uv[vert_of_loop] = uv_loop
nor = np.empty(n * 3)
me.vertices.foreach_get("normal", nor)
os.makedirs(C.WORK, exist_ok=True)
col = C.sample_basecolor(uv)
np.savez_compressed(os.path.join(C.WORK, "mesh_scaled.npz"), co=co, nor=nor.reshape(n, 3), uv=uv, tris=tris, col=col)
info = {"factor": f, "vertices": n, "triangles": len(tris), "bbox_min": co.min(0).tolist(), "bbox_max": co.max(0).tolist(),
        "object_matrix_world_is_identity": bool(np.allclose(mw, np.eye(4)))}
json.dump(info, open(os.path.join(C.WORK, "mesh_scaled_info.json"), "w"), indent=1)
print(json.dumps(info))
