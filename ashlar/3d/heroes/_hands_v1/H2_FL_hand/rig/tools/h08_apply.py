"""H2_FL_hand rig, S6 in Blender (blender -b).

  apply <tag>  : open rig/_work/h06_skel.blend, write rig/_work/weights_<tag>.npz into vertex groups (one group per runtime deform bone,
                 written per group with VertexGroup.add batched by equal weight), save rig/_work/h08_<tag>.blend
  heat         : candidate B input: Blender bone heat (ARMATURE_AUTO) on a copy of the mesh and the runtime armature scaled x10 about the
                 origin (the heat solver has an absolute 1e-4 epsilon; references/skinning.md), weights read back per original vertex into
                 rig/_work/weights_Bheat_raw.npz; empty rows / bones counted (bone heat stops silently at the first failing bone)
Usage: blender -b --factory-startup -P h08_apply.py -- <rig_dir> apply <tag> | heat
"""
import json
import os
import sys

import bpy
import numpy as np
from mathutils import Matrix

argv = sys.argv[sys.argv.index('--') + 1:]
rig, mode = argv[0], argv[1]
bpy.ops.wm.open_mainfile(filepath=os.path.join(rig, '_work', 'h06_skel.blend'))
mesh = bpy.data.objects['H2_FL_hand']
rt = bpy.data.objects['H2_FL_hand_rig']
n = len(mesh.data.vertices)

if mode == 'apply':
    tag = argv[2]
    z = np.load(os.path.join(rig, '_work', f'weights_{tag}.npz'), allow_pickle=True)
    W, bones = z['W'], [str(b) for b in z['bones']]
    assert W.shape[0] == n
    mesh.vertex_groups.clear()
    for j, b in enumerate(bones):
        vg = mesh.vertex_groups.new(name=b)
        col = np.round(W[:, j], 6)
        for val in np.unique(col[col > 0]):
            idx = np.flatnonzero(col == val).tolist()
            vg.add(idx, float(val), 'REPLACE')
    # check: read back
    got = np.zeros_like(W)
    gi = {vg.index: j for j, vg in enumerate(mesh.vertex_groups)}
    for v in mesh.data.vertices:
        for g in v.groups:
            got[v.index, gi[g.group]] = g.weight
    err = float(np.abs(got - W).max())
    mesh.data['weights_tag'] = tag
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(rig, '_work', f'h08_{tag}.blend'))
    print('H08 ' + json.dumps(dict(tag=tag, groups=len(bones), readback_err=err)))
else:
    S = 10.0
    for o in bpy.context.selected_objects:
        o.select_set(False)
    m2 = mesh.copy()
    m2.data = mesh.data.copy()
    m2.modifiers.clear()
    m2.vertex_groups.clear()
    bpy.context.scene.collection.objects.link(m2)
    a2 = rt.copy()
    a2.data = rt.data.copy()
    bpy.context.scene.collection.objects.link(a2)
    for pb in a2.pose.bones:  # no constraints / drivers on the heat copy
        for c in list(pb.constraints):
            pb.constraints.remove(c)
    if a2.animation_data:
        a2.animation_data_clear()
    m2.parent = None
    m2.matrix_world = Matrix.Scale(S, 4)
    a2.matrix_world = Matrix.Scale(S, 4)
    bpy.context.view_layer.update()
    for o in (m2, a2):
        bpy.context.view_layer.objects.active = o
        o.select_set(True)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        o.select_set(False)
    # bone heat on the Tripo mesh fails for every bone (21 islands, 161 non-manifold edges): heat on a closed voxel proxy instead,
    # then transfer to the mesh by the nearest surface point (Data Transfer POLYINTERP_NEAREST)
    VOX = float(argv[2]) if len(argv) > 2 else 0.015  # in the x10 space: 1.5 mm
    px = m2.copy()
    px.data = m2.data.copy()
    bpy.context.scene.collection.objects.link(px)
    rm = px.modifiers.new('vox', 'REMESH')
    rm.mode = 'VOXEL'
    rm.voxel_size = VOX
    bpy.context.view_layer.objects.active = px
    bpy.ops.object.modifier_apply(modifier='vox')
    for o in bpy.context.selected_objects:
        o.select_set(False)
    px.select_set(True)
    a2.select_set(True)
    bpy.context.view_layer.objects.active = a2
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    pv = len(px.data.vertices)
    pe = sum(1 for v in px.data.vertices if len(v.groups) == 0)
    for vg in px.vertex_groups:
        m2.vertex_groups.new(name=vg.name)
    dt = m2.modifiers.new('dt', 'DATA_TRANSFER')
    dt.object = px
    dt.use_vert_data = True
    dt.data_types_verts = {'VGROUP_WEIGHTS'}
    dt.vert_mapping = 'POLYINTERP_NEAREST'
    dt.layers_vgroup_select_src = 'ALL'
    dt.layers_vgroup_select_dst = 'NAME'
    for o in bpy.context.selected_objects:
        o.select_set(False)
    bpy.context.view_layer.objects.active = m2
    m2.select_set(True)
    bpy.ops.object.modifier_apply(modifier='dt')
    names = [b.name for b in a2.data.bones if b.use_deform]
    W = np.zeros((n, len(names)))
    gi = {vg.index: vg.name for vg in m2.vertex_groups}
    col = {nm: j for j, nm in enumerate(names)}
    print('H08 proxy ' + json.dumps(dict(proxy_vertices=pv, proxy_empty=pe, voxel_mm=VOX / S * 1000)))
    for v in m2.data.vertices:
        for g in v.groups:
            nm = gi[g.group]
            if nm in col:
                W[v.index, col[nm]] = g.weight
    empty = int((W.sum(1) <= 0).sum())
    cover = {nm: int((W[:, j] > 0).sum()) for nm, j in col.items()}
    np.savez(os.path.join(rig, '_work', 'weights_Bheat_raw.npz'), W=W, bones=np.array(names))
    print('H08 ' + json.dumps(dict(mode='heat', empty_rows=empty, coverage=cover)))
