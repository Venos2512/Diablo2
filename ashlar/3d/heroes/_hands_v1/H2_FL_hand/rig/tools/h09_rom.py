"""H2_FL_hand rig, S7 ROM poses (blender -b): pose the CONTROL rig, evaluate the mesh under runtime emulation, dump positions.

Runtime emulation: the mesh has only the Armature modifier (Preserve Volume off), every bone bbone_segments = 1, weights already top-4 +
normalised (h07 enforce; the glTF exporter rule leaves them unchanged), so Blender's evaluated mesh = three.js LBS (checked again at S8).
Poses come from rig_recipe.json 'rom'. 'lab' poses re-implement lookdev-lab/src/env/choiceHands.js createFingerRig (axes derived from the
bone chain in the hand frame, palm = -Z) with FINGER_POSES, applied to the ctl bones (the runtime copies them).
Writes rig/_work/poses_<tag>.npz {P (p,n,3), names, M (p,b,4,4) runtime world matrices, rest (b,4,4), bones, heads (p,b,3)} and
rig/_work/lab_axes.json (the derived lab axes, in the hand frame, for the report / FINGER_AXES).
Usage: blender -b --factory-startup -P h09_rom.py -- <rig_dir> <tag> [pose,pose,...]
"""
import json
import math
import os
import sys

import bpy
import numpy as np
from mathutils import Matrix, Quaternion, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

argv = sys.argv[sys.argv.index('--') + 1:]
rig, tag = argv[0], argv[1]
only = argv[2].split(',') if len(argv) > 2 else None
bpy.ops.wm.open_mainfile(filepath=os.path.join(rig, '_work', f'h08_{tag}.blend'))
R = json.load(open(os.path.join(rig, 'rig_recipe.json')))
rom = R['rom']
mesh = bpy.data.objects['H2_FL_hand']
rt = bpy.data.objects['H2_FL_hand_rig']
ctl = bpy.data.objects['H2_FL_hand_ctl']
assert [m.type for m in mesh.modifiers] == ['ARMATURE'] and not mesh.modifiers[0].use_deform_preserve_volume
for b in rt.data.bones:
    b.bbone_segments = 1
import h_pose_bl  # noqa: E402
h_pose_bl.bind(ctl, R)
apply, reset, LAB, SPREAD_SIGN = h_pose_bl.apply, h_pose_bl.reset, h_pose_bl.LAB, h_pose_bl.SPREAD_SIGN
DEG = math.pi / 180


names = [n for n in rom['poses'] if (only is None or n in only)]
bones = [b.name for b in rt.data.bones]
n = len(mesh.data.vertices)
Pout = np.zeros((len(names), n, 3), np.float64)
Mout = np.zeros((len(names), len(bones), 4, 4))
heads = np.zeros((len(names), len(bones), 3))
twist = {}
for i, nm in enumerate(names):
    apply(rom['poses'][nm])
    dg = bpy.context.evaluated_depsgraph_get()
    ev = mesh.evaluated_get(dg)
    me = ev.to_mesh()
    co = np.empty(n * 3)
    me.vertices.foreach_get('co', co)
    ev.to_mesh_clear()
    Pout[i] = co.reshape(-1, 3)
    for j, b in enumerate(bones):
        M = rt.matrix_world @ rt.pose.bones[b].matrix
        Mout[i, j] = np.array(M)
        heads[i, j] = np.array(rt.matrix_world @ rt.pose.bones[b].head)
    # twist check: forearm_twist turn about the forearm axis vs the forearm's
    fq = rt.pose.bones['forearm'].matrix.to_quaternion() @ rt.data.bones['forearm'].matrix_local.to_quaternion().inverted()
    tq = rt.pose.bones['forearm_twist'].matrix.to_quaternion() @ rt.data.bones['forearm_twist'].matrix_local.to_quaternion().inverted()
    twist[nm] = [round(math.degrees(fq.angle), 2), round(math.degrees(tq.angle), 2)]
rest = np.array([np.array(rt.matrix_world @ b.matrix_local) for b in rt.data.bones])
reset()
np.savez(os.path.join(rig, '_work', f'poses_{tag}.npz'), P=Pout, names=np.array(names), M=Mout, rest=rest, bones=np.array(bones), heads=heads)
json.dump(dict(lab_axes_hand_frame_blender=LAB, spread_sign=SPREAD_SIGN, note='Blender frame; lab (glTF) = (x, z, -y)'),
          open(os.path.join(rig, '_work', 'lab_axes.json'), 'w'), indent=1)
print('H09 ' + json.dumps(dict(tag=tag, poses=len(names), twist_forearm_vs_twistbone=twist)))
