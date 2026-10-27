"""R5: QA renders + per-pose numbers for G2 (QA_CHECKLIST A2). Nothing is saved to the .blend.

blender -b --factory-startup rig/W04_mire_sucker_rig.blend -P w04_q1_qa.py

- skeleton over X-ray mesh (front, left, back, top) + control markers
- weights: dominant bone colours (5 views) and single-bone weight heat for the hard areas
- test poses on the control rig (wings, legs, body, proboscis, lobes, head): max edge stretch, bad edges, worst region,
  NEW penetrations vs rest (wing -> thorax, lobes -> thorax plates, hind legs <-> lobes, lobe <-> lobe), renders + heat
-> rig/qa/raw/*.png, rig/_work/q1_poses.json (merged into validation.json as A2_poses)
"""
import json
import math
import os
import sys
import time

import bmesh
import bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import w04_bkit as K
import w04_common as C
import w04_mesh as M
import w04_rig_def as D
import w04_viz as VZ

sys.path.insert(0, C.TOOLS)
import rigbatch as rb  # noqa: E402

T0 = time.time()
RAW = os.path.join(C.QA, 'raw')
os.makedirs(RAW, exist_ok=True)
rb.bone_color = VZ.color
ob, rt, ct = K.mesh(), K.runtime(), K.control()
me = ob.data
n = len(me.vertices)
for img in bpy.data.images:          # in memory only (file never saved): light renders
    if img.size[0] > 1024:
        img.scale(1024, 1024)
rest = K.rest_co(ob)
inv, U = M.weld(rest, 1e-5)
faces = [tuple(p.vertices) for p in me.polygons]
gn = [g.name for g in ob.vertex_groups]
Wd = np.zeros((n, len(gn)))
for v in me.vertices:
    for g in v.groups:
        Wd[v.index, g.group] = g.weight
dom = np.array([gn[i] for i in np.argmax(Wd, 1)])
grp = np.array(['wing' if 'Wing' in d else 'thorax' if d in ('thorax',) else 'abd01' if d == 'abdomen_01' else
                'lobeL' if d.startswith('L_abdomen') else 'lobeR' if d.startswith('R_abdomen') else
                'leg3' if '_Leg3' in d else 'leg1' if '_Leg1' in d else 'head' if d in ('head',) else
                'proboscis' if 'proboscis' in d else 'other' for d in dom])
E = np.array([tuple(e.vertices) for e in me.edges])
L0 = np.linalg.norm(rest[E[:, 0]] - rest[E[:, 1]], axis=1)
long_e = L0 >= 0.004 * C.K


def stretch(P):
    L1 = np.linalg.norm(P[E[:, 0]] - P[E[:, 1]], axis=1)
    q = L1 / np.maximum(L0, 1e-9)
    qq = np.maximum(q, 1 / np.maximum(q, 1e-9))
    qq[~long_e] = 1.0
    bad = int(((q > 1.6) | (q < 0.5))[long_e].sum())
    worst = int(np.argmax(qq))
    reg = {}
    for g_ in ('wing', 'thorax', 'abd01', 'lobeL', 'lobeR', 'leg1', 'leg3', 'head', 'proboscis'):
        m = (grp[E[:, 0]] == g_) | (grp[E[:, 1]] == g_)
        if m.any():
            reg[g_] = round(float(qq[m].max()), 2)
    return dict(max=round(float(qq.max()), 2), bad_edges=bad, worst_edge_bones=[dom[E[worst, 0]], dom[E[worst, 1]]],
                worst_edge_rest_mm=round(1000 * float(L0[worst]), 1), per_region=reg)


def faces_of(mask_fn):
    return [f for f in faces if all(mask_fn(i) for i in f)]


TARGETS = {'thorax': faces_of(lambda i: grp[i] in ('thorax', 'abd01')), 'lobes': faces_of(lambda i: grp[i] in ('lobeL', 'lobeR')),
           'lobeL': faces_of(lambda i: grp[i] == 'lobeL'), 'lobeR': faces_of(lambda i: grp[i] == 'lobeR'),
           'legs3': faces_of(lambda i: grp[i] == 'leg3')}
SRC = {'wing->thorax': (grp == 'wing', 'thorax'), 'lobes->thorax': (np.isin(grp, ['lobeL', 'lobeR']), 'thorax'),
       'hindlegs->lobes': (grp == 'leg3', 'lobes'), 'lobes->hindlegs': (np.isin(grp, ['lobeL', 'lobeR']), 'legs3'),
       'lobeL->lobeR': (grp == 'lobeL', 'lobeR')}


def inside(P):
    out = {}
    for key, (m, tg) in SRC.items():
        bvh = BVHTree.FromPolygons([tuple(p) for p in P], TARGETS[tg], all_triangles=False)
        idx = np.nonzero(m)[0]
        flag = np.zeros(n, bool); depth = np.zeros(n); face = np.full(n, -1)
        for i in idx:
            hit = bvh.find_nearest(Vector(P[i]), 0.06)
            if hit[0] is None:
                continue
            d = (Vector(P[i]) - hit[0]).dot(hit[1])
            if d < -0.002:
                flag[i] = True; depth[i] = -d; face[i] = hit[2]
        out[key] = (flag, depth, face, tg)
    return out


reset_rest = None


def penetration(P):
    cur = inside(P)
    r = {}
    disp = P - REST_EVAL
    for key in SRC:
        flag, depth, face, tg = cur[key]
        new = flag & ~IN_REST[key][0]
        # only count a vertex that really moved against the face it is behind (> 1 mm): vertices sitting between two
        # nearly equidistant faces at the wing root flip sign with float noise otherwise
        for i in np.nonzero(new)[0]:
            fv = TARGETS[tg][face[i]]
            rel = np.linalg.norm(disp[i] - disp[list(fv)].mean(0))
            if rel < 0.001:
                new[i] = False
        r[key] = dict(new=int(new.sum()), max_depth_mm=round(1000 * float(cur[key][1][new].max()), 1) if new.any() else 0.0)
    return r


# ------------------------------------------------------------------ poses on the control rig
def rl(name, axis, deg):
    K.rot_local(ct, name, axis, deg)


def loc(name, v):
    ct.pose.bones[name].location = v


def spread():
    rl('ctl_L_Wing', (1, 0, 0), -35); rl('ctl_L_Wing', (0, 0, 1), -50)
    rl('ctl_R_Wing', (1, 0, 0), -35); rl('ctl_R_Wing', (0, 0, 1), 50)


def flight():
    """spread + pitch the wing about its span until the dorsal side faces up (sign picked per side by the result)"""
    spread()
    for s in 'LR':
        best = None
        for sg in (1, -1):
            pb = ct.pose.bones[f'ctl_{s}_Wing']
            q0 = pb.rotation_quaternion.copy()
            rl(f'ctl_{s}_Wing', (0, 1, 0), 75 * sg)
            bpy.context.view_layer.update()
            zz = ((rt.matrix_world @ rt.pose.bones[f'{s}_WingF_01'].matrix).to_3x3() @ Vector((0, 0, 1))).z
            if best is None or zz > best[0]:
                best = (zz, sg)
            pb.rotation_quaternion = q0
        rl(f'ctl_{s}_Wing', (0, 1, 0), 75 * best[1])
        FLIGHT_SIGN[s] = best


FLIGHT_SIGN = {}
POSES = {
    'wings_spread': lambda: spread(),
    'wings_pitch': lambda: flight(),
    'wings_up': lambda: (spread(), rl('ctl_L_Wing', (1, 0, 0), 45), rl('ctl_R_Wing', (1, 0, 0), 45)),
    'wings_down': lambda: (spread(), rl('ctl_L_Wing', (1, 0, 0), -40), rl('ctl_R_Wing', (1, 0, 0), -40)),
    'wings_twist': lambda: (spread(), [rl(f'ctl_{s}_Wing{w}_01', (0, 1, 0), 25 if s == 'L' else -25) for s in 'LR' for w in 'FB']),
    'wings_fan': lambda: [(rl(f'ctl_{s}_WingB_01', (1, 0, 0), -20), rl(f'ctl_{s}_WingF_01', (1, 0, 0), 10)) for s in 'LR'],
    'wings_fold': lambda: (rl('ctl_L_Wing', (0, 0, 1), 20), rl('ctl_R_Wing', (0, 0, 1), -20),
                           rl('ctl_L_Wing', (1, 0, 0), -15), rl('ctl_R_Wing', (1, 0, 0), -15)),
    'lift_L1': lambda: loc('ctl_L_Leg1_IK', (0, 0, 0.12)),
    'lift_R1': lambda: loc('ctl_R_Leg1_IK', (0, 0, 0.12)),
    'lift_L3': lambda: loc('ctl_L_Leg3_IK', (0, 0, 0.12)),
    'lift_R3': lambda: loc('ctl_R_Leg3_IK', (0, 0, 0.12)),
    'step_L1_fwd': lambda: loc('ctl_L_Leg1_IK', (0, 0.15, 0.05)),
    'step_L3_back': lambda: loc('ctl_L_Leg3_IK', (0, -0.12, 0.05)),
    'body_down': lambda: loc('ctl_cog', (0, -0.15, 0)),
    'body_roll': lambda: rl('ctl_cog', (0, 0, 1), 12),
    'stab': lambda: (loc('ctl_cog', (0, -0.04, 0.08)), rl('ctl_cog', (1, 0, 0), 10), rl('ctl_head', (1, 0, 0), 12),
                     rl('ctl_proboscis_01', (1, 0, 0), -8)),
    'suck_pin': lambda: (ct.__setitem__('ik_proboscis', 1.0), loc('ctl_cog', (0, -0.06, 0)), rl('ctl_cog', (1, 0, 0), 8)),
    'lobes_sway': lambda: rl('ctl_abdomen_01', (0, 0, 1), 14),
    'lobes_opposite': lambda: (rl('ctl_L_abdomen_02', (1, 0, 0), 15), rl('ctl_R_abdomen_02', (1, 0, 0), -15)),
    'lobes_opposite_8': lambda: (rl('ctl_L_abdomen_02', (1, 0, 0), 8), rl('ctl_R_abdomen_02', (1, 0, 0), -8)),
    'lobes_down': lambda: (rl('ctl_L_abdomen_02', (1, 0, 0), -18), rl('ctl_R_abdomen_02', (1, 0, 0), -18)),
    'abdomen_up': lambda: rl('ctl_abdomen_01', (1, 0, 0), 15),
    'abdomen_down': lambda: rl('ctl_abdomen_01', (1, 0, 0), -15),
    'abdomen_down_8': lambda: rl('ctl_abdomen_01', (1, 0, 0), -8),
    'wings_down_60': lambda: (spread(), rl('ctl_L_Wing', (1, 0, 0), -25), rl('ctl_R_Wing', (1, 0, 0), -25)),
    'head_down': lambda: rl('ctl_head', (1, 0, 0), 20),
    'head_up': lambda: rl('ctl_head', (1, 0, 0), -20),
    'head_turn': lambda: rl('ctl_head', (0, 0, 1), 25),
}
RENDER = list(POSES)
VIEWS = {'wings_spread': ('front', 'top'), 'wings_pitch': ('front', 'top'), 'wings_up': ('front', 'tq'), 'wings_down': ('front', 'tq'), 'wings_twist': ('front', 'left'),
         'wings_fan': ('left', 'back'), 'wings_fold': ('top', 'left'), 'body_roll': ('front', 'back'), 'lobes_sway': ('back', 'top'),
         'lobes_opposite': ('left', 'back'), 'head_turn': ('top', 'front')}
rb.VIEW_DIRS['top'] = (0, 0.0001, 1)
rb.VIEW_DIRS['tq'] = (0.75, -0.62, 0.35)
rb.VIEW_DIRS['tqb'] = (0.6, 0.6, 0.5)
WR = (0.17, 0.02, 1.12)
CLOSE = {'wings_spread': {'root_front': (WR, 0.42, 'front'), 'root_top': (WR, 0.42, 'top')},
         'wings_pitch': {'root_front': (WR, 0.42, 'front'), 'root_tq': (WR, 0.42, 'tqb')},
         'wings_up': {'root_front': (WR, 0.42, 'front')}, 'wings_down_60': {'root_front': (WR, 0.42, 'front')},
         'wings_down': {'root_front': (WR, 0.42, 'front')}, 'wings_fold': {'root_top': (WR, 0.42, 'top')},
         'body_down': {'coxa': ((0.15, -0.08, 0.68), 0.50, 'left')}, 'lift_L1': {'coxa': ((0.2, -0.12, 0.62), 0.55, 'left')},
         'lobes_opposite': {'cleft': ((0.0, 0.45, 0.55), 0.55, 'back')}, 'lobes_opposite_8': {'cleft': ((0.0, 0.45, 0.55), 0.55, 'back')},
         'abdomen_down_8': {'hind': ((0.18, 0.3, 0.45), 0.5, 'left')}, 'abdomen_down': {'hind': ((0.18, 0.3, 0.45), 0.5, 'left')},
         'step_L3_back': {'hind': ((0.18, 0.3, 0.45), 0.5, 'left')}, 'abdomen_up': {'plates': ((0.05, 0.3, 0.85), 0.5, 'left')},
         'head_turn': {'neck': ((0.0, -0.3, 0.98), 0.4, 'top')}, 'head_up': {'neck': ((0.0, -0.3, 0.98), 0.4, 'left')},
         'suck_pin': {'proboscis': ((0.0, -0.52, 0.78), 0.45, 'left')}, 'stab': {'proboscis': ((0.0, -0.55, 0.8), 0.5, 'left')}}
rb.VIEW_DIRS['bottom'] = (0, 0.0001, -1)


def reset():
    K.reset_pose(ct)
    ct['ik_proboscis'] = 0.0
    for s in 'LR':
        for l in ('1', '3'):
            ct[f'ik_leg_{s}{l}'] = 1.0
    bpy.context.view_layer.update()


def box(P, pad=0.06):
    lo = Vector(P.min(0)) - Vector((pad,) * 3); hi = Vector(P.max(0)) + Vector((pad,) * 3)
    lo.z = min(lo.z, -0.02)
    return lo, hi


cam = rb.setup_render(900)
sh = bpy.context.scene.display.shading
results = {}
reset()
REST_EVAL = K.eval_co(ob)
IN_REST = inside(REST_EVAL)
results['rest'] = dict(stretch=stretch(REST_EVAL), penetration={k: dict(rest_inside=int(v[0].sum())) for k, v in IN_REST.items()})
for name, fn in POSES.items():
    reset()
    fn()
    bpy.context.view_layer.update()
    P = K.eval_co(ob)
    results[name] = dict(stretch=stretch(P), penetration=penetration(P))
    feet = {f'{s}_{l}': round(float((rt.matrix_world @ rt.pose.bones[f'{s}_{l}_04'].tail).z), 4) for s in 'LR' for l in ('Leg1', 'Leg3')}
    results[name]['foot_z'] = feet
    if name in RENDER:
        lo, hi = box(P)
        for v in VIEWS.get(name, ('front', 'left')):
            rb.place_camera(cam, lo, hi, v, margin=1.03)
            rb.only_visible([ob]); sh.color_type = 'TEXTURE'; sh.show_xray = False
            rb.render_to(os.path.join(RAW, f'pose_{name}_{v}.png'))
        rb.set_point_colors(ob, rb.stretch_colors(ob), name='rb_heat')
        v = VIEWS.get(name, ('front', 'left'))[0]
        rb.place_camera(cam, lo, hi, v, margin=1.03)
        rb.only_visible([ob]); rb.shading('VERTEX')
        rb.render_to(os.path.join(RAW, f'pose_{name}_{v}_heat.png'))
        rb.clear_point_colors(ob, name='rb_heat')
        for cn, (c, size, vv) in CLOSE.get(name, {}).items():
            cc = Vector(c); hh = Vector((size,) * 3) / 2
            rb.place_camera(cam, cc - hh, cc + hh, vv, center=cc, size=size)
            rb.only_visible([ob]); sh.color_type = 'TEXTURE'
            rb.render_to(os.path.join(RAW, f'pose_{name}_cu_{cn}.png'))
    print('POSE', name, results[name]['stretch']['max'], results[name]['stretch']['bad_edges'],
          {k: v['new'] for k, v in results[name]['penetration'].items()})
reset()

# ------------------------------------------------------------------ skeleton overlay (rest), weights
cam = rb.setup_render(1100)
lo, hi = rb.frame_box([ob])
proxy = rb.bone_proxy(rt, posed=False, scale=1.3)
for v in ('front', 'left', 'back', 'top'):
    rb.place_camera(cam, lo, hi, v, margin=1.04)
    rb.only_visible([ob]); sh.color_type = 'SINGLE'; sh.single_color = (0.70, 0.67, 0.62); sh.show_xray = True; sh.xray_alpha = 0.45
    rb.render_to(os.path.join(RAW, f'skel_{v}_mesh.png'))
    sh.show_xray = False
    rb.only_visible([proxy]); rb.shading('VERTEX')
    rb.render_to(os.path.join(RAW, f'skel_{v}_bones.png'))
bpy.data.objects.remove(proxy)
lab = {b.name: dict(mid=list((b.head_local + b.tail_local) / 2), head=list(b.head_local), tail=list(b.tail_local)) for b in rt.data.bones}
for b in ct.data.bones:
    if b.name.endswith(('_IK', '_pole')) or b.name in ('ctl_L_Wing', 'ctl_R_Wing'):
        lab[b.name] = dict(mid=list(b.head_local), head=list(b.head_local), tail=list(b.tail_local))
json.dump(lab, open(os.path.join(RAW, 'labels.json'), 'w'))
cols = [VZ.blend(gn, Wd[i]) for i in range(n)]
rb.set_point_colors(ob, cols, name='rb_w')
for v in ('front', 'left', 'back', 'top', 'bottom'):
    rb.place_camera(cam, lo, hi, v, margin=1.04)
    rb.only_visible([ob]); rb.shading('VERTEX')
    rb.render_to(os.path.join(RAW, f'w_dom_{v}.png'))
rb.clear_point_colors(ob, name='rb_w')
# single-bone heat maps for the hard areas
HEAT = [('L_WingF_01', 'front', (0.22, 0.10, 1.18), 0.55), ('L_WingB_01', 'left', (0.25, 0.15, 1.18), 0.60),
        ('L_Leg1_02', 'front', (0.18, -0.12, 0.74), 0.45), ('L_Leg1_01', 'bottom', (0.08, 0.0, 0.76), 0.40),
        ('L_Leg3_01', 'bottom', (0.08, 0.10, 0.76), 0.40), ('abdomen_01', 'left', (0.05, 0.30, 0.80), 0.60),
        ('L_abdomen_02', 'back', (0.05, 0.45, 0.62), 0.60), ('head', 'left', (0.0, -0.30, 0.96), 0.40),
        ('proboscis_01', 'left', (0.0, -0.48, 0.83), 0.35)]
for bone, v, c, size in HEAT:
    gi = gn.index(bone)
    colh = []
    for i in range(n):
        w = Wd[i, gi]
        colh.append((0.15 + 0.85 * w, 0.15 + 0.35 * (1 - abs(2 * w - 1)), 0.25 * (1 - w)))
    rb.set_point_colors(ob, colh, name='rb_h')
    cc = Vector(c); h = Vector((size,) * 3) / 2
    rb.place_camera(cam, cc - h, cc + h, v, center=cc, size=size)
    rb.only_visible([ob]); rb.shading('VERTEX')
    rb.render_to(os.path.join(RAW, f'w_heat_{bone}_{v}.png'))
    rb.clear_point_colors(ob, name='rb_h')
for o in bpy.context.scene.objects:
    o.hide_render = False
results['_pitch_sign'] = {k: [round(v[0], 3), v[1]] for k, v in FLIGHT_SIGN.items()}
json.dump(results, open(os.path.join(C.WORK, 'q1_poses.json'), 'w'), indent=1)
vp = os.path.join(C.RIG, 'validation.json')
V = json.load(open(vp, encoding='utf-8'))
V['A2_poses'] = results
V['A2_note'] = ('độ giãn = max(dài sau / dài rest, nghịch đảo) của cạnh ≥ 3,5 mm; xuyên = đỉnh nằm sau mặt gần nhất của vùng đích '
                '> 2 mm, chỉ đếm đỉnh MỚI so với rest (mesh vỏ hở, rest đã có chồng lớp)')
open(vp, 'w', encoding='utf-8').write(json.dumps(V, indent=1, ensure_ascii=False))
print('Q1_DONE', round(time.time() - T0, 1), 's')
