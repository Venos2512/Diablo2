"""W04 Mire-Sucker skeleton definition (plain Python, no bpy): runtime bones + control rig, from rig/_work/landmarks.json.

Blender space: Z up, the fly faces -Y, +X = its left. Left side is measured, the right side is the mirror (x -> -x;
the mesh is mirror-symmetric to 0.0 mm at the landmarks, w04_m6_landmarks.py).

Runtime skeleton (goes to the GLB at R8): root, cog, thorax, head, proboscis_01..03, abdomen_01, L/R_abdomen_02..03,
L/R_WingF_01..02 (upper long blade + leading-edge rib), L/R_WingB_01..02 (lower short blades), legs L/R_Leg<n>_01..04
(01 coxa, 02 femur, 03 tibia, 04 tarsus + claw); the mesh has the front (Leg1) and hind (Leg3) pairs only, no middle pair.
Sockets: ground, hit_origin, fx_head, fx_thorax, fx_abdomen.
Each bone: dict(name, parent, head, tail, hinge, zvec, kind). Roll: local X ~ hinge (made orthogonal to the bone), or
local Z ~ zvec when given. kind: core | socket.
"""
import json
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))
LM_PATH = os.path.join(os.path.dirname(HERE), '_work', 'landmarks.json')
X, Y, Z = (1.0, 0.0, 0.0), (0.0, 1.0, 0.0), (0.0, 0.0, 1.0)
LEGS = ('Leg1', 'Leg3')
SIDES = ('L', 'R')

# measured-point overrides (metres, left side), reason in the comment
OVERRIDE = {
    # tibia and tarsus are nearly collinear, so their line intersection drifts (front leg: z 0.42). The ankle is the centre of
    # the horizontal section at the visible kink (landmarks 'ankle_h': z 0.285 front, 0.318 hind); the tarsus runs from there
    # through the section just above the claws ('foot_h') down to the claw base:
    ('Leg1', 'foot_z'): 0.035,    # front claws reach z 0.000
    ('Leg3', 'foot_z'): 0.075,    # hind claws end at z 0.047: the hind feet hover 4.7 cm in the rest pose (mesh as built)
}


def load():
    with open(LM_PATH, encoding='utf-8') as f:
        return json.load(f)


def add(a, b):
    return tuple(x + y for x, y in zip(a, b))


def sub(a, b):
    return tuple(x - y for x, y in zip(a, b))


def mul(a, s):
    return tuple(x * s for x in a)


def lerp(a, b, t):
    return tuple(x + (y - x) * t for x, y in zip(a, b))


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def cross(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def unit(v):
    n = math.sqrt(dot(v, v))
    return tuple(c / n for c in v)


def mir(p):
    return (-p[0], p[1], p[2])


def mirv(v):
    """mirror of a direction vector (x -> -x)."""
    return (-v[0], v[1], v[2])


def bend_normal(a, m, b):
    """hinge of the joint m in the chain a-m-b: positive rotation about it bends the joint further (both sides)."""
    return unit(cross(sub(m, a), sub(b, m)))


def point_on(a, b, z):
    t = (z - a[2]) / (b[2] - a[2])
    return lerp(a, b, t)


def leg_points(LM, leg):
    g = LM[leg]
    p = dict(root=tuple(g['root']), troch=tuple(g['troch']), knee=tuple(g['knee']), ankle=tuple(g['ankle']), foot=tuple(g['foot']))
    if g.get('ankle_h') and g.get('foot_h'):
        p['ankle'] = tuple(g['ankle_h'])
        p['foot'] = point_on(p['ankle'], tuple(g['foot_h']), OVERRIDE[(leg, 'foot_z')])
    return p


def build(LM=None):
    LM = LM or load()
    B = []

    def bone(name, parent, head, tail, hinge=X, zvec=None, kind='core'):
        B.append(dict(name=name, parent=parent, head=tuple(round(c, 5) for c in head), tail=tuple(round(c, 5) for c in tail),
                      hinge=hinge, zvec=zvec, kind=kind))

    th_c = tuple(LM['thorax_c']); neck = tuple(LM['neck']); hf = tuple(LM['head_front']); rear = tuple(LM['thorax_rear'])
    bone('root', None, (0, 0, 0), (0, 0, 0.06))
    bone('cog', 'root', th_c, add(th_c, (0, 0, 0.05)))
    bone('thorax', 'cog', th_c, neck)
    bone('head', 'thorax', neck, hf)
    pr, pt = tuple(LM['proboscis']['root']), tuple(LM['proboscis']['tip'])
    pr, pt = (0.0, pr[1], pr[2]), (0.0, pt[1], pt[2])     # centre line (mesh symmetric)
    p1, p2 = lerp(pr, pt, 1 / 3), lerp(pr, pt, 2 / 3)
    bone('proboscis_01', 'head', pr, p1)
    bone('proboscis_02', 'proboscis_01', p1, p2)
    bone('proboscis_03', 'proboscis_02', p2, pt)
    # abdomen: shared base from the thorax rear to the lobe split, then one 2-bone chain per lobe along its long axis
    lb = LM['lobe_L']
    base, tip, axis, L = tuple(lb['base']), tuple(lb['tip']), tuple(lb['axis']), lb['length']
    l25 = add(base, mul(axis, 0.25 * L)); l60 = add(base, mul(axis, 0.60 * L))
    split = (0.0, l25[1], l25[2])
    bone('abdomen_01', 'thorax', rear, split)
    for side in SIDES:
        f = (lambda p: p) if side == 'L' else mir
        bone(f'{side}_abdomen_02', 'abdomen_01', f(l25), f(l60))
        bone(f'{side}_abdomen_03', f'{side}_abdomen_02', f(l60), f(tip))
    # wings: two blade chains per side from one shared hinge (SKELETON_STANDARD §3, W insects). Local Z = normal of the wing's
    # dorsal surface: the wings are raised and swept back, so the dorsal side faces in, back and up (-n of the PCA normal n,
    # which points out); X lies in the wing plane, so rotating about X flaps, about Y pitches the blade, about Z sweeps it.
    w = LM['wing_L']
    wr = tuple(w['root']); tF = tuple(w['tipF']); tB = tuple(w['lower_tip']); nrm = tuple(w['normal'])
    mF = lerp(wr, tF, 0.45); mB = lerp(wr, tB, 0.45)
    for side in SIDES:
        f = (lambda p: p) if side == 'L' else mir
        dors = mul(nrm, -1.0)
        n_ = dors if side == 'L' else mirv(dors)
        bone(f'{side}_WingF_01', 'thorax', f(wr), f(mF), zvec=n_)
        bone(f'{side}_WingF_02', f'{side}_WingF_01', f(mF), f(tF), zvec=n_)
        bone(f'{side}_WingB_01', 'thorax', f(wr), f(mB), zvec=n_)
        bone(f'{side}_WingB_02', f'{side}_WingB_01', f(mB), f(tB), zvec=n_)
    # legs
    for leg in LEGS:
        P = leg_points(LM, leg)
        for side in SIDES:
            f = (lambda p: p) if side == 'L' else mir
            q = {k: f(v) for k, v in P.items()}
            hk = bend_normal(q['troch'], q['knee'], q['ankle'])
            ha = bend_normal(q['knee'], q['ankle'], q['foot'])
            hc = bend_normal(q['root'], q['troch'], q['knee'])
            bone(f'{side}_{leg}_01', 'thorax', q['root'], q['troch'], hinge=hc)
            bone(f'{side}_{leg}_02', f'{side}_{leg}_01', q['troch'], q['knee'], hinge=hk)
            bone(f'{side}_{leg}_03', f'{side}_{leg}_02', q['knee'], q['ankle'], hinge=hk)
            bone(f'{side}_{leg}_04', f'{side}_{leg}_03', q['ankle'], q['foot'], hinge=ha)
    # sockets (no weights)
    bone('ground', 'root', (0, 0, 0), (0, 0, 0.03), kind='socket')
    d = unit(sub(pt, pr))
    bone('hit_origin', 'proboscis_03', pt, add(pt, mul(d, 0.03)), kind='socket')
    eye = LM['eye_L']['c']
    fh = (0.0, eye[1] + 0.02, eye[2] + 0.02)
    bone('fx_head', 'head', fh, add(fh, (0, 0, 0.03)), kind='socket')
    bone('fx_thorax', 'thorax', th_c, add(th_c, (0, -0.03, 0)), kind='socket')
    fa = (0.0, lb['centre'][1], lb['centre'][2])
    bone('fx_abdomen', 'abdomen_01', fa, add(fa, (0, 0, 0.03)), kind='socket')
    return B


def by_name(B=None):
    return {b['name']: b for b in (B or build())}


def deform_names(B=None):
    return [b['name'] for b in (B or build()) if b['kind'] == 'core' and b['name'] not in ('root', 'cog')]


def roll_z(head, tail, hinge):
    """world vector the bone's local Z must point to so that local X ~ hinge."""
    d = unit(sub(tail, head))
    hp = sub(hinge, mul(d, dot(hinge, d)))
    if math.sqrt(dot(hp, hp)) < 1e-6:
        hp = (1.0, 0.0, 0.0) if abs(d[0]) < 0.9 else (0.0, 1.0, 0.0)
    hp = unit(hp)
    return unit(cross(hp, d))


def control_bones(B=None, LM=None):
    """Control rig (ctl_*, never exported): FK copy of every runtime bone except sockets, a wing master per side, leg IK
    (2-bone IK femur+tibia to an ankle target under a foot control on the ground, pole at the knee, tarsus copies the
    foot control's orientation), proboscis IK target (off by default)."""
    LM = LM or load()
    B = B or build(LM)
    bn = by_name(B)
    out = []
    for b in B:
        if b['kind'] == 'socket':
            continue
        par = ('ctl_' + b['parent']) if b['parent'] else None
        out.append(dict(name='ctl_' + b['name'], parent=par, head=b['head'], tail=b['tail'], hinge=b['hinge'], zvec=b['zvec'],
                        kind='fk', rt=b['name']))
    ob = {c['name']: c for c in out}
    for side in SIDES:
        w1 = bn[f'{side}_WingF_01']
        sg = 1.0 if side == 'L' else -1.0
        # flap master at the shared hinge (as P03): points out sideways, local X along the body axis (L: -Y, R: +Y) so that
        # rotating +X raises the wing on both sides
        out.append(dict(name=f'ctl_{side}_Wing', parent='ctl_thorax', head=w1['head'], tail=add(w1['head'], (0.08 * sg, 0.0, 0.0)),
                        hinge=(0.0, -sg, 0.0), zvec=None, kind='master'))
        for nm in (f'ctl_{side}_WingF_01', f'ctl_{side}_WingB_01'):
            ob[nm]['parent'] = f'ctl_{side}_Wing'
        for leg in LEGS:
            b2, b3, b4 = bn[f'{side}_{leg}_02'], bn[f'{side}_{leg}_03'], bn[f'{side}_{leg}_04']
            foot = b4['tail']
            fwd = (0.0, -1.0, 0.0)
            out.append(dict(name=f'ctl_{side}_{leg}_IK', parent='ctl_root', head=(foot[0], foot[1], foot[2]),
                            tail=add(foot, mul(fwd, 0.06)), hinge=None, zvec=Z, kind='ik'))
            out.append(dict(name=f'ctl_{side}_{leg}_tarsus', parent=f'ctl_{side}_{leg}_IK', head=b4['head'], tail=b4['tail'],
                            hinge=b4['hinge'], zvec=None, kind='target'))
            kn = b3['head']
            # pole: from the troch-ankle line out through the knee
            a, c = b2['head'], b3['tail']
            ab = sub(c, a)
            t = dot(sub(kn, a), ab) / dot(ab, ab)
            foot_line = add(a, mul(ab, t))
            bd = unit(sub(kn, foot_line))
            out.append(dict(name=f'ctl_{side}_{leg}_pole', parent='ctl_cog', head=add(kn, mul(bd, 0.25)),
                            tail=add(kn, mul(bd, 0.30)), hinge=X, zvec=None, kind='pole'))
    p3 = bn['proboscis_03']
    d = unit(sub(p3['tail'], p3['head']))
    out.append(dict(name='ctl_proboscis_IK', parent='ctl_root', head=p3['tail'], tail=add(p3['tail'], mul(d, 0.05)),
                    hinge=X, zvec=None, kind='ik'))
    return out


if __name__ == '__main__':
    B = build()
    from collections import Counter
    print(len(B), Counter(b['kind'] for b in B), 'deform', len(deform_names(B)))
    for b in B:
        L = math.sqrt(dot(sub(b['tail'], b['head']), sub(b['tail'], b['head'])))
        print(f"{b['name']:16s} <- {str(b['parent']):14s} head {tuple(round(c, 3) for c in b['head'])} "
              f"tail {tuple(round(c, 3) for c in b['tail'])} len {L:.3f}")
    CB = control_bones()
    print('control', len(CB), Counter(c['kind'] for c in CB))
