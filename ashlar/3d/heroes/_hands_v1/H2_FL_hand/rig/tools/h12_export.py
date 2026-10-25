"""H2_FL_hand rig, S8/S9 (blender -b): the source .blend and the runtime GLB.

1. open rig/_work/h08_<tag>.blend, rest pose, every bone bbone_segments 1, save rig/H2_FL_hand_rig.blend (mesh + control rig + runtime
   skeleton, no Actions) and a snapshot copy in rig/_snapshots/;
2. export <asset_dir>/H2_FL_hand_rig.glb: runtime armature + mesh only, fixed arguments of references/export-runtime.md (+Y up, rest position,
   4 influences, no leaf bones, no animations, def-bones off so the 3 sockets stay); the textures are the source's own images (packed from the
   Tripo GLB), so the glTF frame of the file = the lab hand frame (+z fingers, +y back of the hand, origin = sleeve-end axis point);
3. clean reimport from a copied folder into an empty scene (rig/_work/reimport/): bone names / count / rest heads, then posed parity: the
   reimported armature is driven by the skinning deltas S = M_pose M_rest^-1 of rig/_work/poses_<tag>.npz (axis-convention free) and the
   evaluated mesh is compared with the source evaluation, vertices matched by rest position.
Writes rig/_work/export_check.json. Usage: blender -b --factory-startup -P h12_export.py -- <rig_dir> <tag>
"""
import hashlib
import json
import os
import shutil
import sys

import bpy
import numpy as np
from mathutils import Matrix
from mathutils.kdtree import KDTree

argv = sys.argv[sys.argv.index('--') + 1:]
rig, tag = argv[0], argv[1]
asset = os.path.dirname(os.path.abspath(rig))
bpy.ops.wm.open_mainfile(filepath=os.path.join(rig, '_work', f'h08_{tag}.blend'))
mesh = bpy.data.objects['H2_FL_hand']
rt = bpy.data.objects['H2_FL_hand_rig']
ctl = bpy.data.objects['H2_FL_hand_ctl']
for pb in ctl.pose.bones:
    pb.rotation_mode = 'QUATERNION'
    pb.rotation_quaternion = (1, 0, 0, 0)
    pb.location = (0, 0, 0)
for b in rt.data.bones:
    b.bbone_segments = 1
for a in bpy.data.actions:
    bpy.data.actions.remove(a)
mesh.data['rig_weights'] = tag
rt.data['frame'] = 'Blender: fingers -Y, back of hand +Z, origin sleeve-end axis point; glTF +Y up export = lab hand frame'
bpy.context.view_layer.update()
blend = os.path.join(rig, 'H2_FL_hand_rig.blend')
bpy.ops.wm.save_as_mainfile(filepath=blend)
os.makedirs(os.path.join(rig, '_snapshots'), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(rig, '_snapshots', f'S9_{tag}.blend'), copy=True)
# export
for o in bpy.context.view_layer.objects:
    o.select_set(False)
mesh.select_set(True)
rt.select_set(True)
bpy.context.view_layer.objects.active = rt
glb = os.path.join(asset, 'H2_FL_hand_rig.glb')
bpy.ops.export_scene.gltf(filepath=glb, export_format='GLB', use_selection=True, export_yup=True, export_apply=False,
                          export_skins=True, export_all_influences=False, export_influence_nb=4, export_rest_position_armature=True,
                          export_leaf_bone=False, export_def_bones=False, export_hierarchy_flatten_bones=False, export_armature_object_remove=False,
                          export_animations=False)
src_bones = {b.name: (np.array(b.head_local), np.array(b.tail_local), b.use_deform) for b in rt.data.bones}
V0 = np.array([v.co[:] for v in mesh.data.vertices])
z = np.load(os.path.join(rig, '_work', f'poses_{tag}.npz'), allow_pickle=True)
names = [str(x) for x in z['names']]
bnames = [str(b) for b in z['bones']]
samples = [n for n in ('fist', 'spread', 'pron90', 'wrist_flex40', 'lab_grip_tuned', 'point') if n in names]
# reimport from a copied folder
rd = os.path.join(rig, '_work', 'reimport')
shutil.rmtree(rd, ignore_errors=True)
os.makedirs(rd)
glb2 = os.path.join(rd, 'H2_FL_hand_rig.glb')
shutil.copy2(glb, glb2)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb2, disable_bone_shape=True)
arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
me2 = next(o for o in bpy.context.scene.objects if o.type == 'MESH')
re_b = {b.name: (np.array(arm.matrix_world @ b.head_local)) for b in arm.data.bones}
res = dict(glb=glb, glb_bytes=os.path.getsize(glb), glb_sha256=hashlib.sha256(open(glb, 'rb').read()).hexdigest(), blend=blend,
           bones_src=len(src_bones), bones_reimport=len(re_b), names_equal=sorted(src_bones) == sorted(re_b),
           max_head_diff_m=float(max(np.linalg.norm(src_bones[n][0] - re_b[n]) for n in src_bones if n in re_b)),
           mesh_objects=len([o for o in bpy.context.scene.objects if o.type == 'MESH']), reimport_vertices=len(me2.data.vertices),
           object_scales=[list(o.scale) for o in bpy.context.scene.objects])
# vertex map (reimport -> source) by rest position
kd = KDTree(len(V0))
for i, p in enumerate(V0):
    kd.insert(p, i)
kd.balance()
Vr = np.array([list(me2.matrix_world @ v.co) for v in me2.data.vertices])
mp, dmax = [], 0.0
for p in Vr:
    _, i, dd = kd.find(p)
    mp.append(i)
    dmax = max(dmax, dd)
mp = np.array(mp)
res['rest_match_max_m'] = dmax
rest_src = {n: Matrix(z['rest'][j].tolist()) for j, n in enumerate(bnames)}
rest_re = {b.name: arm.matrix_world @ b.matrix_local for b in arm.data.bones}
order = [b.name for b in arm.data.bones]  # parents before children
par = {}
for pn in samples:
    i = names.index(pn)
    for pb in arm.pose.bones:
        pb.matrix_basis = Matrix.Identity(4)
    bpy.context.view_layer.update()
    for n in order:
        j = bnames.index(n)
        S = Matrix(z['M'][i, j].tolist()) @ rest_src[n].inverted()
        arm.pose.bones[n].matrix = arm.matrix_world.inverted() @ S @ rest_re[n]
        bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    ev = me2.evaluated_get(dg)
    m = ev.to_mesh()
    Pr = np.array([list(me2.matrix_world @ v.co) for v in m.vertices])
    ev.to_mesh_clear()
    par[pn] = float(np.linalg.norm(Pr - z['P'][i][mp], axis=1).max())
res['posed_parity_max_m'] = par
res['tolerance_m'] = 1e-4 * 0.45 / 1.8
json.dump(res, open(os.path.join(rig, '_work', 'export_check.json'), 'w'), indent=1)
print('H12 ' + json.dumps(res))
