"""H2_FL_hand rig, S3 source d (blender -b): read UniRig's rigged GLB, bring its joints and mesh into the rig frame.

The rigged GLB is UniRig's output on the ORIGINAL Tripo GLB (glTF world of the source). Joints and mesh vertices are taken in Blender world
space after import (= C g_world), mapped by C M_world_to_hand C^-1 (rig/_work/frame.json); the mesh is compared to rig/_work/mesh.npz to
prove the frame matches. Writes rig/_work/unirig_joints.json {joints: [{name, parent, head, tail}], mesh_match_mm}.
Usage: blender -b --factory-startup -P h04u_unirig.py -- <rig_dir> <rigged.glb>
"""
import json
import os
import sys

import bpy
import numpy as np
from mathutils import Matrix

argv = sys.argv[sys.argv.index('--') + 1:]
rig, glb = argv[0], argv[1]
fr = json.load(open(os.path.join(rig, '_work', 'frame.json')))
C = Matrix(fr['C_gltf_to_blender'])
T = C @ Matrix(fr['M_world_to_hand']) @ C.inverted()
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb, disable_bone_shape=True)
arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
joints = []
for b in arm.data.bones:
    h = T @ (arm.matrix_world @ b.head_local)
    t = T @ (arm.matrix_world @ b.tail_local)
    joints.append(dict(name=b.name, parent=b.parent.name if b.parent else None, head=list(h), tail=list(t)))
me = next(o for o in bpy.context.scene.objects if o.type == 'MESH')
dg = bpy.context.evaluated_depsgraph_get()
V = np.array([list(T @ (me.matrix_world @ v.co)) for v in me.data.vertices])
ref = np.load(os.path.join(rig, '_work', 'mesh.npz'), allow_pickle=True)['V']
from mathutils.kdtree import KDTree
kd = KDTree(len(ref))
for i, p in enumerate(ref):
    kd.insert(p, i)
kd.balance()
dist = [kd.find(p)[2] for p in V[::7]]
out = dict(glb=glb, n_joints=len(joints), joints=joints, mesh_match_mm=dict(max=float(max(dist) * 1000), median=float(np.median(dist) * 1000)))
json.dump(out, open(os.path.join(rig, '_work', 'unirig_joints.json'), 'w'), indent=1)
print('H04U ' + json.dumps(dict(n=len(joints), match=out['mesh_match_mm'])))
