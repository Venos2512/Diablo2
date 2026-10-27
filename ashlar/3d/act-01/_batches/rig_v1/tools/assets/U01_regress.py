"""Regression of the generic stages (stages.py) against the approved pilot U01 Shambler (G2 2026-10-26).

Reads U01's GLB and the user's editor joints; writes ONLY to tmp/rig_v1/U01_regress (rig_out/), never to the
approved U01 files. Expected: QA numbers equal to U01's rig/validation.json within rounding.
"""
import collections
import rigbatch as rb
import U01_shambler as U

GENERIC = True
SRC_AID = 'U01_shambler'
HEIGHT_M = 1.71
ISL = dict(torso=[0], head=[1], legs=[13, 15], arms=[14, 16])
SYM = dict(c=0.031, ops=[('ramp', [14, 16], 0.031, 0.30, 0.55)], center=True)
HEAD = dict(islands=[2, 3, 4, 5, 6, 10, 12], cut=[1], z_chin=U.Z_CHIN)
ACC = {'knot': dict(islands=[9], mode='follow_uniform'),
       'rope_L': dict(islands=[11], mode='strand', bone='flap_rope_L', n=2),
       'rope_R': dict(islands=[8], mode='strand', bone='flap_rope_R', n=2)}
CLOTH = {'Cloth_Robe': dict(prefix='robe_tunic', chains=U.TUNIC_CHAINS, half=U.TUNIC_HALF, n=3, parent='pelvis', center='pelvis'),
         'Cloth_Cape': dict(prefix='robe_cape', chains=[('B', 180), ('L', 120), ('R', -120)], half=20, n=3, parent='chest',
                            center=(0.0, -0.05))}
SLEEVES = dict(z_top=1.44)
LM = dict(torso_half_w=U.TORSO_HALF_W, wrist_x=U.WRIST_X, knee_z=U.KNEE_Z, neck_half_w=U.NECK_HALF_W, leg_win=(-0.08, 0.05),
          arm_mask_x=U.ARM_MASK_X, arm_mask_z=U.ARM_MASK_Z, cap=(0.12, 0.04), arm_islands_src=[14], arm_anchor_x=0.40)
PUSH_KW = dict(iters=6, smooth=0.7, rounds=6)
LAYER_SKIP = ('beads', 'flap_rope')


def s2_attrs(ob, lab, isl, info):
    tl, tinfo = U._torso_labels(ob, lab)
    info['torso_labels'] = tinfo; info['labels'] = tl
    a = ob.data.attributes.get('rb_sleeve') or ob.data.attributes.new('rb_sleeve', 'INT', 'POINT')
    for i, s_ in tl.items():
        if s_.startswith('sleeve'):
            a.data[i].value = 1 if s_ == 'sleeveL' else 2


def s2_labels(ob, lab, isl, info):
    m = ob.data; tl = info['labels']; out = []
    acc = {9, 8, 11}; head_all = {2, 3, 4, 5, 6, 10, 12}
    for p in m.polygons:
        kk = lab[p.vertices[0]]; cz = sum(m.vertices[i].co.z for i in p.vertices) / len(p.vertices)
        if kk in head_all or (kk == 1 and cz >= U.Z_CHIN):
            out.append('Head')
        elif kk in acc:
            out.append('Accessory')
        elif kk == 0 and all(tl.get(i) == 'cape' for i in p.vertices):
            out.append('Cloth_Cape')
        elif kk == 0 and cz < U.Z_WAIST:
            out.append('Cloth_Robe')
        else:
            out.append('Body')
    return out
