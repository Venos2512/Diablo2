"""H2_FL_hand rig, S0/S2 (blender -b): import the source GLB read-only, bake the lab-frame transform (rig/_work/frame.json) into the
mesh data, and dump the mesh for rigkit-env.

Blender frame after this step (glTF export with +Y up gives back the lab hand frame exactly):
  Blender (x, y, z) = (h.x, -h.z, h.y): fingers toward -Y, back of the hand +Z, palm -Z, origin = the sleeve-end axis point.

Writes rig/_work/h02_base.blend (mesh object 'H2_FL_hand', identity transform) and rig/_work/mesh.npz
(V (n,3) Blender object = world space, F (m,3) loop triangles as vertex ids, UV per vertex (first loop), weld (n,), meta json).

Usage: blender -b --factory-startup -P h02_import.py -- <rig_dir>
"""
import hashlib
import json
import os
import sys

import bpy
import numpy as np
from mathutils import Matrix

rig = sys.argv[sys.argv.index('--') + 1]
SRC = r'E:/Diablo2/ashlar/3d/heroes/_hands_v1/H2_FL_hand/choice_hands_H2_FL_hand.glb'
fr = json.load(open(os.path.join(rig, '_work', 'frame.json')))
sha = hashlib.sha256(open(SRC, 'rb').read()).hexdigest()

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
assert len(meshes) == 1, [o.name for o in bpy.context.scene.objects]
ob = meshes[0]
# importer: mesh data in Blender axes = C g_local; object matrix = C node C^-1 (+ parents). We want data = C M C^-1 (data) with M on glTF mesh-local.
C = Matrix(fr['C_gltf_to_blender'])
M = Matrix(fr['M_gltf_mesh_to_hand'])
ob.data.transform(C @ M @ C.inverted())
# clear every parent / transform, the mesh data is now in the hand frame
for o in list(bpy.context.scene.objects):
    if o is not ob and o.type != 'MESH':
        pass
ob.parent = None
ob.matrix_world = Matrix.Identity(4)
for o in list(bpy.context.scene.objects):
    if o is not ob:
        bpy.data.objects.remove(o, do_unlink=True)
ob.name = 'H2_FL_hand'
ob.data.name = 'H2_FL_hand'
me = ob.data
n = len(me.vertices)
V = np.empty(n * 3)
me.vertices.foreach_get('co', V)
V = V.reshape(-1, 3)
me.calc_loop_triangles()
F = np.empty(len(me.loop_triangles) * 3, dtype=np.int64)
me.loop_triangles.foreach_get('vertices', F)
F = F.reshape(-1, 3)
lv = np.empty(len(me.loops), dtype=np.int64)
me.loops.foreach_get('vertex_index', lv)
uvl = np.empty(len(me.loops) * 2)
me.uv_layers[0].data.foreach_get('uv', uvl)
uvl = uvl.reshape(-1, 2)
UV = np.zeros((n, 2))
UV[lv[::-1]] = uvl[::-1]
# weld: positions within 1e-6 x bbox diagonal
diag = float(np.linalg.norm(V.max(0) - V.min(0)))
key = np.round(V / (1e-6 * diag)).astype(np.int64)
_, weld = np.unique(key, axis=0, return_inverse=True)
weld = weld.reshape(-1)
meta = dict(H=0.45, frame='blender: fingers -Y, back of hand +Z, origin sleeve end; glTF +Y up = lab hand frame', source=SRC, sha256=sha,
            n_vertices=n, n_tris=len(F), n_welded=int(weld.max() + 1),
            images=[dict(name=i.name, size=list(i.size), packed=bool(i.packed_file)) for i in bpy.data.images])
np.savez(os.path.join(rig, '_work', 'mesh.npz'), V=V, F=F, UV=UV, weld=weld, meta=json.dumps(meta))
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(rig, '_work', 'h02_base.blend'))
print('H02 ' + json.dumps(dict(meta=meta, bbox=[V.min(0).tolist(), V.max(0).tolist()])))
