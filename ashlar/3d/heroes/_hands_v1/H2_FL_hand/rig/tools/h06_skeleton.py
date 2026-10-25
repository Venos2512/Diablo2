"""H2_FL_hand rig, S4 runtime skeleton + S5 control rig (blender -b).

Input: rig/_work/h02_base.blend (mesh in the lab frame), rig/landmarks.json, rig/rig_recipe.json ("skeleton" block).
Output: rig/_work/h06_skel.blend (+ the mesh parented, no weights yet), rig/_work/skeleton.json (rest heads / tails / matrices).

Runtime armature 'H2_FL_hand_rig' (export layer, standard names, deform bones + 3 unweighted sockets):
  hand_root (sleeve end, in the wall) -> forearm -> wrist -> {thumb,index,middle,ring,pinky}_01..03
  forearm -> forearm_twist (deform helper at 50-75 % of the forearm, 50 % of the forearm roll; added against the candy wrapper, a G2 item)
  sockets: fx_palm (wrist), fx_thumb (thumb_03), fx_tip_index (index_03)
Rolls: local X = the flexion hinge, +X rotation flexes toward the palm (-Z), verified by a pose test written to skeleton.json.
  Long fingers: _01 hinge = the CONVERGENCE plane (contains the MCP, the palm normal and the scaphoid point S, so a fist points every
  finger at S); _02/_03 = blend of that plane and the finger's own rest-curl plane (recipe 'conv_blend_distal').
  Thumb: hinges that bring the tip toward an opposition target on the palm (recipe 'thumb_targets').
Control armature 'H2_FL_hand_ctl': ctl_<runtime name> FK bones (same rest, same rolls), ctl_fist slider (local Y 0..0.02 m) whose
  Transformation constraints add the fist curl to every finger ctl bone (recipe 'fist_deg'); the runtime bones follow by Copy
  Transforms (world); forearm_twist (child of forearm) has a driver: rotation_euler.y = -(1 - twist_factor) x (SWING_TWIST_Y of ctl_forearm, local),
  so its world roll is twist_factor x the forearm roll.
Usage: blender -b --factory-startup -P h06_skeleton.py -- <rig_dir>
"""
import json
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

rig = sys.argv[sys.argv.index('--') + 1]
L = {k: Vector(v['pos']) for k, v in json.load(open(os.path.join(rig, 'landmarks.json')))['landmarks'].items()}
R = json.load(open(os.path.join(rig, 'rig_recipe.json')))['skeleton']
bpy.ops.wm.open_mainfile(filepath=os.path.join(rig, '_work', 'h02_base.blend'))
for o in list(bpy.data.objects):
    if o.name != 'H2_FL_hand':
        bpy.data.objects.remove(o, do_unlink=True)
mesh = bpy.data.objects['H2_FL_hand']
N = Vector((0, 0, -1))  # palm normal (lab frame: palm = -y lab = -Z Blender)
FING = ['index', 'middle', 'ring', 'pinky']


def perp(v, y):
    return (v - y * v.dot(y)).normalized()


def hinge_toward(y, t):
    """X axis such that +X rotation moves the tail toward t (a direction): X = y x t_perp."""
    return y.cross(perp(t, y)).normalized()


def plane_normal(pts):
    import numpy as np
    q = np.array([list(p) for p in pts])
    q = q - q.mean(0)
    return Vector(np.linalg.svd(q)[2][2].tolist())


# ---------------------------------------------------------------- bone table: name -> (head, tail, parent, connect, hinge X, deform)
B = {}
fa_dir = (L['wrist'] - L['forearm_start']).normalized()
hr_tail = L['forearm_start']  # hand_root spans the cuff (sleeve end -> cuff end), the forearm bone the visible forearm
x_fore = hinge_toward(fa_dir, N)
B['hand_root'] = (L['sleeve_end'], hr_tail, None, False, hinge_toward((hr_tail - L['sleeve_end']).normalized(), N), True)
B['forearm'] = (hr_tail, L['wrist'], 'hand_root', True, x_fore, True)
tw0, tw1 = R['twist_span']
B['forearm_twist'] = (hr_tail.lerp(L['wrist'], tw0), hr_tail.lerp(L['wrist'], tw1), 'forearm', False, x_fore, True)
wrist_tail = L['middle_mcp']
y_w = (wrist_tail - L['wrist']).normalized()
B['wrist'] = (L['wrist'], wrist_tail, 'forearm', True, hinge_toward(y_w, N), True)
S = Vector(R['scaphoid_point'])
info = {}
for f in FING:
    j = [L[f'{f}_mcp'], L[f'{f}_pip'], L[f'{f}_dip']]
    tip = L[f'{f}_tip']
    tip_in = tip + (j[2] - tip).normalized() * R['tip_inset']
    pts = j + [tip_in]
    n_rest = plane_normal(pts)
    n_conv = (S - j[0]).cross(N).normalized()
    prev = None
    for k in range(3):
        y = (pts[k + 1] - pts[k]).normalized()
        w = R.get('conv_blend_proximal', 1.0) if k == 0 else R['conv_blend_distal']
        # orient both normals the same way first (their sign is arbitrary)
        nr = n_rest if n_rest.dot(n_conv) >= 0 else -n_rest
        h = perp(n_conv * w + nr * (1 - w), y)
        if 'hinge_mix' in R:  # {conv, rest, palm} weights; palm = y x N (the lab's own derivation: perpendicular to the finger in the palm plane)
            mx = R['hinge_mix']['proximal' if k == 0 else 'distal']
            npalm = y.cross(N).normalized()
            npalm = npalm if npalm.dot(n_conv) >= 0 else -npalm
            h = perp(n_conv * mx['conv'] + nr * mx['rest'] + npalm * mx['palm'], y)
        # sign: +X flexes toward the palm. _01 by the palm normal; distal by continuity with the parent hinge
        if prev is None:
            if h.cross(y).dot(N) < 0:
                h = -h
        elif h.dot(prev) < 0:
            h = -h
        prev = h
        B[f'{f}_0{k + 1}'] = (pts[k], pts[k + 1], 'wrist' if k == 0 else f'{f}_0{k}', k > 0, h, True)
    info[f] = dict(n_rest=list(n_rest), n_conv=list(n_conv), rest_conv_angle_deg=math.degrees(n_rest.angle(n_conv) if n_rest.dot(n_conv) >= 0 else (-n_rest).angle(n_conv)))
# thumb
tj = [L['thumb_cmc'], L['thumb_mcp'], L['thumb_ip']]
ttip = L['thumb_tip']
t_in = ttip + (tj[2] - ttip).normalized() * R['tip_inset']
tp = tj + [t_in]
for k in range(3):
    y = (tp[k + 1] - tp[k]).normalized()
    T = Vector(R['thumb_targets'][k])
    h = hinge_toward(y, T - tp[k])
    B[f'thumb_0{k + 1}'] = (tp[k], tp[k + 1], 'wrist' if k == 0 else f'thumb_0{k}', k > 0, h, True)
# sockets
pc = Vector(R['fx_palm'])
B['fx_palm'] = (pc, pc + N * 0.02, 'wrist', False, hinge_toward(N, -y_w), False)
yi = (B['index_03'][1] - B['index_03'][0]).normalized()
B['fx_tip_index'] = (L['index_tip'], L['index_tip'] + yi * 0.015, 'index_03', False, B['index_03'][4], False)
yt = (B['thumb_03'][1] - B['thumb_03'][0]).normalized()
B['fx_thumb'] = (L['thumb_tip'], L['thumb_tip'] + yt * 0.015, 'thumb_03', False, B['thumb_03'][4], False)
ORDER = ['hand_root', 'forearm', 'forearm_twist', 'wrist'] + [f'{f}_0{k}' for f in ['thumb'] + FING for k in (1, 2, 3)] + ['fx_palm', 'fx_thumb', 'fx_tip_index']


def build(name, prefix, deform_flags=True):
    arm_d = bpy.data.armatures.new(name)
    arm = bpy.data.objects.new(name, arm_d)
    bpy.context.scene.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm
    for o in bpy.context.selected_objects:
        o.select_set(False)
    arm.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm_d.edit_bones
    for n in ORDER:
        h, t, par, con, x, dfm = B[n]
        b = eb.new(prefix + n)
        b.head, b.tail = h, t
        y = (t - h).normalized()
        b.align_roll(x.cross(y))  # local Z = X x Y
        b.use_deform = dfm if deform_flags else False
        b.inherit_scale = 'FULL'
        b.bbone_segments = 1
        if par:
            b.parent = eb[prefix + par]
            b.use_connect = con
    bpy.ops.object.mode_set(mode='OBJECT')
    return arm


rt = build('H2_FL_hand_rig', '')
ctl = build('H2_FL_hand_ctl', 'ctl_', deform_flags=False)
# ctl_fist slider: a small bone above the back of the hand, local Y moves 0..fist_travel
bpy.context.view_layer.objects.active = ctl
bpy.ops.object.mode_set(mode='EDIT')
eb = ctl.data.edit_bones
fb = eb.new('ctl_fist')
fb.head = L['wrist'] + Vector((0, -0.04, 0.05))
fb.tail = fb.head + Vector((0, -0.02, 0))
fb.parent = eb['ctl_wrist']
fb.use_deform = False
bpy.ops.object.mode_set(mode='OBJECT')
pf = ctl.pose.bones['ctl_fist']
pf.lock_location = (True, False, True)
pf.lock_rotation = (True, True, True)
pf.lock_scale = (True, True, True)
lim = pf.constraints.new('LIMIT_LOCATION')
lim.use_min_y = lim.use_max_y = True
lim.min_y, lim.max_y = 0.0, R['fist_travel']
lim.owner_space = 'LOCAL'
lim.use_transform_limit = True
for o in ctl.pose.bones:
    o.rotation_mode = 'QUATERNION'
for o in rt.pose.bones:
    o.rotation_mode = 'QUATERNION'
# fist: Transformation constraint per finger ctl bone (fist slider local Y -> local X rotation, added after)
for n, deg in R['fist_deg'].items():
    pb = ctl.pose.bones['ctl_' + n]
    c = pb.constraints.new('TRANSFORM')
    c.name = 'fist'
    c.target = ctl
    c.subtarget = 'ctl_fist'
    c.target_space = 'LOCAL'
    c.owner_space = 'LOCAL'
    c.map_from = 'LOCATION'
    c.from_min_y, c.from_max_y = 0.0, R['fist_travel']
    c.map_to = 'ROTATION'
    c.map_to_x_from = 'Y'
    c.map_to_y_from = 'Y'
    c.map_to_z_from = 'Y'
    c.to_min_x_rot, c.to_max_x_rot = 0.0, math.radians(deg[0])
    c.to_min_y_rot = c.to_max_y_rot = 0.0
    c.to_min_z_rot, c.to_max_z_rot = 0.0, math.radians(deg[1]) if len(deg) > 1 else 0.0
    c.mix_mode_rot = 'AFTER'
# runtime follows the control layer
for n in ORDER:
    if n == 'forearm_twist':
        continue
    c = rt.pose.bones[n].constraints.new('COPY_TRANSFORMS')
    c.target = ctl
    c.subtarget = 'ctl_' + n
    c.target_space = c.owner_space = 'WORLD'
# twist helper: driver = factor x twist of ctl_forearm (SWING_TWIST_Y, local)
pt = rt.pose.bones['forearm_twist']
pt.rotation_mode = 'XYZ'
fc = pt.driver_add('rotation_euler', 1)
drv = fc.driver
drv.type = 'SCRIPTED'
v = drv.variables.new()
v.name = 't'
v.type = 'TRANSFORMS'
v.targets[0].id = ctl
v.targets[0].bone_target = 'ctl_forearm'
v.targets[0].transform_type = 'ROT_Y'
v.targets[0].rotation_mode = 'SWING_TWIST_Y'
v.targets[0].transform_space = 'LOCAL_SPACE'
drv.expression = f"{-(1.0 - R['twist_factor']):.4f}*t"  # child of forearm: inherits the full roll, gives back (1 - factor)
# ctl_forearm_twist exists in the ctl layer (built from the same table) but nothing reads it: remove it
bpy.context.view_layer.objects.active = ctl
bpy.ops.object.mode_set(mode='EDIT')
ctl.data.edit_bones.remove(ctl.data.edit_bones['ctl_forearm_twist'])
bpy.ops.object.mode_set(mode='OBJECT')
# bone collections / colours for the GUI
for arm, groups in ((ctl, {'ctl_fingers': [b for b in ctl.data.bones if b.name.split('_')[1] in ('thumb', 'index', 'middle', 'ring', 'pinky')],
                          'ctl_main': [b for b in ctl.data.bones if b.name.split('_')[1] not in ('thumb', 'index', 'middle', 'ring', 'pinky')]}),):
    for gname, bones in groups.items():
        bc = arm.data.collections.new(gname)
        for b in bones:
            bc.assign(b)
rt.data.display_type = 'STICK'
ctl.data.display_type = 'OCTAHEDRAL'
ctl.show_in_front = True
# mesh -> runtime armature
mesh.parent = rt
mesh.matrix_parent_inverse = Matrix.Identity(4)
md = mesh.modifiers.new('Armature', 'ARMATURE')
md.object = rt
md.use_deform_preserve_volume = False
md.use_vertex_groups = True
# ---------------------------------------------------------------- bend tests: +20 deg X on each ctl bone, tail displacement toward the palm side
bpy.context.view_layer.update()
tests = {}
for n in ORDER:
    if n.startswith('fx_') or n == 'forearm_twist' or n == 'hand_root':
        continue
    pb = ctl.pose.bones['ctl_' + n]
    t0 = (ctl.matrix_world @ pb.tail).copy()
    pb.rotation_quaternion = Matrix.Rotation(math.radians(20), 4, 'X').to_quaternion()
    bpy.context.view_layer.update()
    t1 = (ctl.matrix_world @ pb.tail).copy()
    pb.rotation_quaternion = (1, 0, 0, 0)
    bpy.context.view_layer.update()
    dv = t1 - t0
    if n.startswith('thumb'):
        k = int(n[-1]) - 1
        good = dv.dot(Vector(R['thumb_targets'][k]) - B[n][0]) > 0
    else:
        good = dv.dot(N) > 0
    tests[n] = dict(disp_mm=[round(x * 1000, 2) for x in dv], toward_palm=bool(good))
# runtime == control at rest
bpy.context.view_layer.update()
rest_diff = max((rt.pose.bones[n].matrix - ctl.pose.bones['ctl_' + n].matrix).to_3x3().to_quaternion().angle if False else
                max(abs(a - b) for ra, rb in zip(rt.pose.bones[n].matrix, ctl.pose.bones['ctl_' + n].matrix) for a, b in zip(ra, rb))
                for n in ORDER if n != 'forearm_twist')
sk = dict(bones={}, order=ORDER, bend_tests=tests, rest_runtime_vs_ctl=rest_diff, finger_planes=info)
for b in rt.data.bones:
    sk['bones'][b.name] = dict(head=list(b.head_local), tail=list(b.tail_local), parent=b.parent.name if b.parent else None,
                               deform=b.use_deform, matrix_local=[list(r) for r in b.matrix_local], roll_x=list(b.matrix_local.to_3x3().col[0]))
json.dump(sk, open(os.path.join(rig, '_work', 'skeleton.json'), 'w'), indent=1)
os.makedirs(os.path.join(rig, '_snapshots'), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(rig, '_work', 'h06_skel.blend'))
bad = [n for n, t in tests.items() if not t['toward_palm']]
print('H06 ' + json.dumps(dict(bones=len(rt.data.bones), ctl=len(ctl.data.bones), bend_fail=bad, rest_diff=rest_diff,
                                conv_angles={f: round(v['rest_conv_angle_deg'], 1) for f, v in info.items()})))
