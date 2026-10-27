"""B05 Hospice Mother A (wave 3). Canon 2.75H = 4.95 m (user 2026-10-27 chose canon over the sheet's 3.0H); k 2.75.
Faceless veiled giantess, EIGHT arms (4 pairs) straight out to the sides, bell gown to the floor (no legs, no feet).
Stage-0 islands (importer weld): 0 hood + shoulder capelet (= top layer of the upper sleeve tier, |x| to 1.18) + back veil
panel (behind, down to z 1.57); 1 front veil panel (z 2.16-4.87, in front of the chest); 2 gown (z 0.05-4.14);
4 lower gown / hem (z 0-1.88); 3/18/32 hem bits; 5/23 ochre stole bands (z 0.94-4.13, in front);
arms by pair (top -> bottom, L/R): 1 = 22/37 (z 4.24), 2 = 19/33 (3.72-3.89), 3 = 21/38 (3.12-3.17), 4 = 20/34 (2.57-2.86);
39 = 3-vertex bit at the R4 hand; sleeve tiers L 11/13 (upper) 12/14/15/16/17 (lower), R 25/27 + 26/28/29/30/31/35/36;
6-10/24 = 3-4 vertex bits on the capelet. Symmetry: body and sleeve tiers about x +0.085, the 8 arm islands about 0
(R arms 17 cm longer) -> ramp the arms +0.085 from the root (hidden in the tiers) out, then centre.
No real torso (hollow cloth shell): joints set by hand from sections (torso axis y -0.43; hood centre y -0.50, point
leans forward); legs hidden in the gown.
"""
GENERIC = True
HEIGHT_M = 4.95

ARMS = {1: (22, 37), 2: (19, 33), 3: (21, 38), 4: (20, 34)}       # pair -> (L island, R island)
ARM_EXTRA = {'R4': [39]}                                         # loose bits that belong to an arm
TIER = {'L': [11, 12, 13, 14, 15, 16, 17], 'R': [25, 26, 27, 28, 29, 30, 31, 35, 36]}
ARM_ISL_ALL = [i for p in ARMS.values() for i in p] + [39]
ISL = dict(torso=[2], arms=ARM_ISL_ALL)
SYM = dict(c=0.085, ops=[('ramp', ARM_ISL_ALL, 0.085, 0.29, 0.52)], center=True)
# hood = island 0 above the shoulders, inside |x| 0.36 (the capelet slopes out from there); kept in Body (user)
HEAD = dict(islands=[], cut=[0], z_chin=4.42, pred=lambda c: abs(c.x) < 0.36, in_body=True)
# gown below the waist + hem bits; back veil panel = island 0 behind the back below the capelet. Both stay in Body (user).
ROBE_CUTS = {'Cloth_Robe': dict(islands=[2, 4, 3, 18, 32], z_max=2.45, in_body=True),
             'Cloth_BackVeil': dict(islands=[0], z_max=3.35, pred=lambda c: c.y > -0.25 and abs(c.x) < 0.70, in_body=True)}
CLOTH = {'Cloth_Robe': dict(prefix='robe_gown', chains=[('F', 0), ('L', 90), ('B', 180), ('R', -90)], half=45, n=4,
                            parent='pelvis', center='pelvis'),
         'Cloth_BackVeil': dict(prefix='veil_back', chains=[('B', 180)], half=70, n=3, parent='chest', center='pelvis',
                                seam_band=0.06)}
# front veil hangs from the hood face: 3-bone chain on the head (as P02's face veil, user-approved); stoles lie flat on
# the gown front -> follow the skin under them (chest above, gown chains below)
ACC = {'veil_front': dict(islands=[1], mode='strand', bone='veil_front', n=3, parent='head'),
       'stole_L': dict(islands=[5], mode='follow'),
       'stole_R': dict(islands=[23], mode='follow')}
LM = dict(H_body=4.95, arm_islands_src=[22], torso_half_w=0.56, neck_mode='band', head_band=0.16, neck_half_w=0.30,
          leg_win=(-0.08, 0.05),
          # no leg mesh: the auto radii would measure the gown
          leg_radii=dict(thigh_r=0.24, knee_r=0.20, calf_r=0.17, foot_r=0.20))
PUSH_KW = dict(iters=6, smooth=0.7, rounds=6)
LAYER_SKIP = ('beads', 'flap_rope')

# torso / head joints (centred x) from the sections: gown/capelet centre y -0.43, hood centre y -0.50 at z 4.5 and
# -0.66 near the point (leans forward); pelvis low (2.30) so all four arm pairs sit on the torso
SPINE = dict(pelvis=(0.0, -0.42, 2.30), spine1=(0.0, -0.43, 2.70), spine2=(0.0, -0.43, 3.10), chest=(0.0, -0.44, 3.55),
             neck=(0.0, -0.46, 4.36), head=(0.0, -0.50, 4.52), head_top=(0.0, -0.66, 4.88))
LEGS = dict(hip=(0.28, -0.42, 2.20), knee=(0.30, -0.48, 1.20), ankle=(0.32, -0.42, 0.22), ball=(0.32, -0.66, 0.08),
            toe=(0.32, -0.86, 0.05))
SHOULDER_X = {1: 0.66, 2: 0.60, 3: 0.60, 4: 0.60}        # inside the arm roots (|x| 0.81-1.03), hidden in the tiers
ARM_PARENT = {2: 'chest', 3: 'spine_02', 4: 'spine_01'}
ARM_J = {}                                             # (side, pair) -> dict(sh, el, wr, he) filled by landmarks_fix


def _arm_pts(body, isl_ids):
    ai = body.data.attributes['rb_isl']; V = body.data.vertices
    return [V[i].co.copy() for i in range(len(V)) if ai.data[i].value in isl_ids]


def landmarks_fix(L, parts, notes):
    import rigbatch as rb, stages
    k = rb.K; body = parts['Body']
    for kk, v in SPINE.items():
        L[kk] = v
    for kk, v in LEGS.items():
        L[kk] = v; L['L_' + kk] = v; L['R_' + kk] = (-v[0], v[1], v[2])
    for n, (il, ir) in ARMS.items():         # measured on the L arm, mirrored (the arms are symmetric after s1; the
        Pts = _arm_pts(body, {il})            # wrist search gave R1 1.66 vs L1 1.93 on the same hand)
        root = min(p.x for p in Pts); tip = max(p.x for p in Pts)
        sx = SHOULDER_X[n]
        wx = stages.find_wrist(Pts, sx, tip, k) or (sx + 0.78 * (tip - sx))
        ex = sx + 0.545 * (wx - sx)
        S0 = [p for p in Pts if p.x < root + 0.12]           # open tube end: few vertices at the very root
        a0 = ((min(p.y for p in S0) + max(p.y for p in S0)) / 2, (min(p.z for p in S0) + max(p.z for p in S0)) / 2)
        def at(x, a0=a0, Pts=Pts):
            a = stages._axis_at(Pts, x, w=0.035) or a0
            return (round(x, 4), round(a[0], 4), round(a[1], 4))
        sh = (sx, round(a0[0], 4), round(a0[1], 4))
        el, wr = at(ex), at(wx)
        he = (round(tip, 4), wr[1], round(wr[2] - 0.008 * 4.95, 4))
        ARM_J[('L', n)] = dict(sh=sh, el=el, wr=wr, he=he)
        ARM_J[('R', n)] = {kk: (-v[0], v[1], v[2]) for kk, v in ARM_J[('L', n)].items()}
        notes.append(f'arm {n}: root {root:.3f} shoulder {sh} elbow {el} wrist {wr} tip {tip:.3f} (L, mirrored)')
    for P in 'LR':
        j = ARM_J[(P, 1)]
        pre = '' if P == 'L' else 'R_'
        L[pre + 'shoulder'], L[pre + 'elbow'], L[pre + 'wrist'], L[pre + 'hand_end'] = j['sh'], j['el'], j['wr'], j['he']
    L['clav_in'] = (0.084, -0.45, 4.30)
    notes.append('spine/neck/head/legs set by hand (hollow cloth shell, no legs); 8 arms measured per island')


def extra_chains(rig, parts, chains, L):
    """Arms 2-4 per side: <side>_UpperArm_<n> (parent: torso bone at that height) -> _ForeArm_<n> -> _Hand_<n>,
    same rolls and connect flags as the main arm (no clavicle/twist: generic bones, not in the Unity avatar)."""
    import bpy
    from mathutils import Vector
    bpy.ops.object.select_all(action='DESELECT'); bpy.context.view_layer.objects.active = rig; rig.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT'); eb = rig.data.edit_bones
    for n in (2, 3, 4):
        for P in 'LR':
            j = ARM_J[(P, n)]; sh, el, wr, he = (Vector(j[x]) for x in ('sh', 'el', 'wr', 'he'))
            spec = ((f'{P}_UpperArm_{n}', sh, el, ARM_PARENT[n], False), (f'{P}_ForeArm_{n}', el, wr, f'{P}_UpperArm_{n}', True),
                    (f'{P}_Hand_{n}', wr, wr.lerp(he, 0.55), f'{P}_ForeArm_{n}', True))
            for name, h, t, par, conn in spec:
                if name in eb:
                    eb.remove(eb[name])
                b = eb.new(name); b.head = h; b.tail = t; b.parent = eb[par]; b.use_connect = conn; b.use_deform = True
                b.align_roll(Vector((0, 0, 1)))
    bpy.ops.object.mode_set(mode='OBJECT')


def is_arm(i, V, lab, torso, arm_isl, sl, shj):
    return False          # all eight arms and the sleeve tiers are weighted in body_weights_fix


def _isl_attr(body):
    return body.data.attributes['rb_isl']


ARMSET = ('Clavicle', 'UpperArm', 'UpperArm_twist', 'ForeArm', 'ForeArm_twist', 'Hand')
SIGMA = 0.15              # (x k) arm-mixing falloff for tier vertices (distance to each arm's shoulder->wrist line)
# island-0 capelet beyond this |x| between these z is the top layer of the upper tier (sleeve -> follows the arms)
CAPELET = dict(x=0.45, z=(3.20, 4.47))


def _arm_bones(P, n):
    if n == 1:
        return {a: f'{P}_{a}' for a in ARMSET}
    up, fo, ha = f'{P}_UpperArm_{n}', f'{P}_ForeArm_{n}', f'{P}_Hand_{n}'
    return {'Clavicle': None, 'UpperArm': up, 'UpperArm_twist': up, 'ForeArm': fo, 'ForeArm_twist': fo, 'Hand': ha}


def _arm_w(co, rig, P, n):
    """The skill's T-pose arm weights (body_weights arm branch) for arm n of side P at point co."""
    import rigbatch as rb
    rc = rb.rc; k = rb.K; B = rig.data.bones; bn = _arm_bones(P, n)
    s = abs(B[bn['UpperArm']].head_local.x); e = abs(B[bn['ForeArm']].head_local.x); w = abs(B[bn['Hand']].head_local.x)
    win = dict(shoulder=(s - 0.045 * k, s + 0.085 * k), elbow=(e - 0.04 * k, e + 0.04 * k), wrist=(w - 0.03 * k, w + 0.02 * k))
    t = abs(co.x); s0 = win['shoulder'][0]
    f = 1 - rc.sm(s0 - 0.01 * k, s0 + 0.07 * k, t)
    tw = rc.torso_weights(co, rig)
    mine = {f'{P}_{a}' for a in ARMSET} if n == 1 else set()
    d = {g: x * f for g, x in tw.items() if g not in mine}; rest = 1 - sum(d.values())
    for g, x in rc.arm_weights(t, P, **win).items():
        a = g.split('_', 1)[1]; tgt = bn[a]
        if tgt is None:          # extra arm: the clavicle share goes to the torso at the point
            for g2, x2 in tw.items():
                d[g2] = d.get(g2, 0) + x * rest * x2
        else:
            d[tgt] = d.get(tgt, 0) + x * rest
    return d


def _seg_dist(p, a, b):
    ab = b - a; t = max(0.0, min(1.0, (p - a).dot(ab) / max(ab.length_squared, 1e-12)))
    return (p - (a + ab * t)).length


def body_weights_fix(body, rig, rep):
    import math, rigbatch as rb, stages
    rc = rb.rc; k = rb.K; B = rig.data.bones; V = body.data.vertices; ai = _isl_attr(body)
    own = {}
    for n, (il, ir) in ARMS.items():
        own[il] = ('L', n); own[ir] = ('R', n)
    for kk, v in ARM_EXTRA.items():
        for i_ in v:
            own[i_] = (kk[0], int(kk[1]))
    tier = {i_: P for P, v in TIER.items() for i_ in v}
    lines = {}
    for P in 'LR':
        for n in ARMS:
            bn = _arm_bones(P, n)
            lines[(P, n)] = (B[bn['UpperArm']].head_local.copy(), B[bn['Hand']].head_local.copy())
    na = nt = 0; tier_vs = []
    for v in V:
        kk = ai.data[v.index].value; co = v.co
        if kk in own:
            P, n = own[kk]; rc.set_weights(body, v.index, _arm_w(co, rig, P, n)); na += 1; continue
        cap = kk == 0 and abs(co.x) > CAPELET['x'] and CAPELET['z'][0] < co.z < CAPELET['z'][1]
        if kk not in tier and not cap:
            continue
        P = tier.get(kk) or ('L' if co.x > 0 else 'R')
        ws = {n: math.exp(-(_seg_dist(co, *lines[(P, n)]) / (SIGMA * k)) ** 2) for n in ARMS}
        tot = sum(ws.values())
        if tot < 1e-9:
            n0 = min(ARMS, key=lambda n: _seg_dist(co, *lines[(P, n)])); ws = {n0: 1.0}; tot = 1.0
        d = {}
        for n, wn in ws.items():
            if wn / tot < 0.02:
                continue
            bn = _arm_bones(P, n)
            for g, x in _arm_w(co, rig, P, n).items():
                if g in (bn['ForeArm'], bn['ForeArm_twist'], bn['Hand']):   # tiers end near the elbow: they hang from
                    g = bn['UpperArm']                                        # the upper arm (elbow bend tore 8x)
                d[g] = d.get(g, 0) + x * wn / tot
        rc.set_weights(body, v.index, dict(sorted(d.items(), key=lambda t: -t[1])[:4])); nt += 1; tier_vs.append(v.index)
    rc.smooth_weights(body, tier_vs, iters=TIER_SMOOTH, factor=0.5)     # shared tiers: no sharp arm-to-arm step
    # hood below the head cut: the geodesic band on this coarse mesh (edges ~10 cm) left head 1 next to chest 0.8
    # (head turn 8.6x) -> Laplacian-smooth the band region, keeping the cut vertices at head 1
    head = stages.parts_by_role().get('Head')
    if head is not None:
        cut = set(rb.coincident_map(body, head)); nk = B['neck'].head_local; tset = set(tier_vs)
        hv = [v.index for v in V if v.index not in cut and v.index not in tset and v.co.z > HOOD_SMOOTH['z']
              and math.hypot(v.co.x - nk.x, v.co.y - nk.y) < HOOD_SMOOTH['r']]
        rc.smooth_weights(body, hv, iters=HOOD_SMOOTH['iters'], factor=0.5)
        rep['hood_smooth'] = len(hv)
    rc.finalize_weights(body)
    rep['arms8'] = dict(arm_verts=na, tier_verts=nt, smooth=TIER_SMOOTH)


TIER_SMOOTH = 15
HOOD_SMOOTH = dict(z=3.95, r=0.80, iters=10)
STOLE_SMOOTH = 10


def acc_weights_fix(acc, body, rig, rep):
    """Stoles (follow): long strips with few vertices took the weights of whichever gown/veil vertex was nearest,
    so neighbours differed (robe F 0.95 next to F 0.70 + R 0.29: 11.8x on a kick). Laplacian-smooth along the strip."""
    import rigbatch as rb
    at = acc.data.attributes['rb_acc']; codes = {list(ACC).index(n) + 1 for n in ('stole_L', 'stole_R')}
    vs = [i for i in range(len(acc.data.vertices)) if at.data[i].value in codes]
    rb.rc.smooth_weights(acc, vs, iters=STOLE_SMOOTH, factor=0.5)
    rb.rc.finalize_weights(acc)
    rep['stole_smooth'] = len(vs)
