"""W01 Mortar-Rat B (rig_v1). Catalogue 0.22H: user 2026-10-27 chose ear tips = 0.40 m (skull crown 0.372 m), k 0.222.
Standing rat, digitigrade hind legs (thigh hip->knee forward, calf knee->heel back, Foot = metatarsus heel->ball, Toe),
long thick tail curving back on the floor, two very large flat ears, chalk-white mortar spines in two clusters.
Stage-0 (H 0.40): island 0 = the whole body in ONE piece (3403 v: head, ears, arms, legs, tail); 1/34 eyes; the spine
cones are loose islands (2-21, 23-27 and their mirrors 35-60, 20-52 v each; shoulder cluster z 0.26-0.34, hip cluster
z 0.10-0.19); 22/28/29 + 55/61/62 toe claws; 30-33 + 63-66 finger claws.
Profile (1 cm grid renders, tmp/rig_v1/W01_mortar_rat/g_*_grid.png): arms at z 0.264-0.278 (y -0.067..-0.050) from
|x| 0.04 to the claw tips at 0.178, paw from |x| ~0.13; neck base z ~0.283; jaw meets the throat at (y -0.092, z 0.31);
skull crown 0.372; knee front at (y -0.078, z 0.089); heel back at (y -0.014, z 0.048); toes y -0.07..-0.11 on the floor.
Brief: tail 5 bones, 2 ears, spines rigid on the nearest skin.
"""
GENERIC = True
HEIGHT_M = 0.40
ISL = dict(torso=[0], legs=[], arms=[])
SYM = dict(c=0.0, ops=[], center=False)          # torso axis x +0.0000 (s0)
# head = eyes + the skull/snout/ears above a slanted cut from the throat (y -0.092, z 0.310) up to the nape (y -0.035,
# z 0.338); kept in Body (user preference since P05)
HEAD = dict(islands=[1, 34], cut=[0], z_chin=0.28, pred=lambda c: c.z > 0.310 + 0.49 * (c.y + 0.092), in_body=True)
LM = dict(arm_z_min=0.25, head_measure_zmax=0.365, neck_mode='band', head_band=0.14, arm_mask_x=0.034, arm_mask_z=0.248)
PUSH_KW = dict(iters=6, smooth=0.7, rounds=6)
LAYER_SKIP = ('beads', 'flap_rope')


def landmarks_fix(L, parts, notes):
    """One fused piece, rat proportions: every joint from the grid renders (the skill's slices assume a human)."""
    S = dict(pelvis=(0.0, -0.030, 0.130), spine1=(0.0, -0.036, 0.165), spine2=(0.0, -0.042, 0.200),
             chest=(0.0, -0.049, 0.237), neck=(0.0, -0.056, 0.283), head=(0.0, -0.068, 0.320), head_top=(0.0, -0.080, 0.372),
             shoulder=(0.036, -0.058, 0.272), elbow=(0.086, -0.058, 0.271), wrist=(0.128, -0.058, 0.270))
    for k_, v in S.items():
        L[k_] = v
    L['hand_end'] = (0.176, -0.058, 0.268)
    L['clav_in'] = (0.007, -0.053, 0.277)
    for s_, sg in (('L_', 1), ('R_', -1), ('', 1)):
        L[s_ + 'hip'] = (sg * 0.028, -0.030, 0.125)
        L[s_ + 'knee'] = (sg * 0.034, -0.066, 0.086)
        L[s_ + 'ankle'] = (sg * 0.033, -0.022, 0.046)       # heel (hock): Calf knee -> heel, Foot heel -> ball
        L[s_ + 'ball'] = (sg * 0.042, -0.076, 0.011)
        L[s_ + 'toe'] = (sg * 0.046, -0.106, 0.006)
    notes.append('all joints set by hand (fused rat, digitigrade legs: ankle = heel)')


# ------------------------------------------------------------------ tail + ears (s3)
# first guess of the tail centre line (left grid render); refined from the mesh in extra_chains
TAIL_GUESS = [(0, -0.008, 0.112), (0, 0.013, 0.075), (0, 0.031, 0.050), (0, 0.060, 0.028), (0, 0.100, 0.019),
              (0, 0.140, 0.019), (0, 0.158, 0.030), (0, 0.163, 0.046)]
TAIL = dict(n=5, x=0.017, r=0.021, root=0.025, blend=0.012, free_s=0.03)
EAR = dict(x=0.020, z=0.334, root=0.010, blend=0.010)


def _poly_nearest(pts, p):
    """(distance, arc length) of the nearest point on the polyline pts."""
    best = None; acc = 0.0
    for a, b in zip(pts[:-1], pts[1:]):
        ab = b - a; L_ = ab.length
        t = max(0.0, min(1.0, (p - a).dot(ab) / max(L_ * L_, 1e-12))); d = (p - (a + ab * t)).length
        if best is None or d < best[0]:
            best = (d, acc + t * L_)
        acc += L_
    return best


def _resample(pts, n):
    import rigbatch as rb
    seg = [(b - a).length for a, b in zip(pts[:-1], pts[1:])]; tot = sum(seg); out = []
    for j in range(n + 1):
        s = tot * j / n; acc = 0.0
        for (a, b), L_ in zip(zip(pts[:-1], pts[1:]), seg):
            if acc + L_ >= s - 1e-12:
                out.append(a.lerp(b, (s - acc) / max(L_, 1e-12))); break
            acc += L_
        else:
            out.append(pts[-1].copy())
    return out


def _tail_points(body):
    from mathutils import Vector
    ai = body.data.attributes['rb_isl']; G = [Vector(p) for p in TAIL_GUESS]
    S = []
    for v in body.data.vertices:
        c = v.co
        if ai.data[v.index].value != 0 or abs(c.x) > TAIL['x']:
            continue
        d, s = _poly_nearest(G, c)
        if d < TAIL['r']:
            S.append((s, c.copy()))
    smax = max(s for s, _ in S); nb = 14; cen = [G[0].copy()]
    for j in range(1, nb):
        lo, hi = smax * j / nb, smax * (j + 1) / nb
        P = [c for s, c in S if lo <= s < hi]
        if len(P) >= 4:
            m = sum(P, Vector()) / len(P); m.x = 0.0; cen.append(m)
    tip = [c for s, c in S if s > smax - 0.004]
    t = sum(tip, Vector()) / len(tip); t.x = 0.0; cen.append(t)
    return _resample(cen, TAIL['n']), len(S)


def _ear_points(head, sg):
    from mathutils import Vector
    E = [v.co.copy() for v in head.data.vertices if sg * v.co.x > EAR['x'] and v.co.z > EAR['z']]
    base = [p for p in E if sg * p.x < EAR['x'] + 0.006]
    r = sum(base, Vector()) / len(base)
    zt = max(p.z for p in E); top = [p for p in E if p.z > zt - 0.006]; t = sum(top, Vector()) / len(top)
    return [r, r.lerp(t, 0.45), t], len(E)


def extra_chains(rig, parts, chains, L):
    import rigbatch as rb
    pts, n = _tail_points(parts['Body'])
    chains['tail'] = rb.rc.add_chain(rig, 'tail', pts, 'pelvis')
    head = parts.get('Head')
    for s, sg in (('L', 1), ('R', -1)):
        ep, ne = _ear_points(head, sg)
        chains[f'ear_{s}'] = rb.rc.add_chain(rig, f'ear_{s}', ep, 'head')
    L['_notes'].append(f'tail {len(pts) - 1} bones from {n} verts: ' + ' '.join(f'({p.y:+.3f},{p.z:.3f})' for p in pts)
                       + f'; ears {ne} verts each')


# ------------------------------------------------------------------ weights (s4)
def is_arm(i, V, lab, torso, arm_isl, sl, shj):
    """Arm = the fused body (island 0) beyond the armpit; the loose spine cones are placed later (rigid)."""
    c = V[i].co
    return lab[i] == torso and abs(c.x) > LM['arm_mask_x'] and c.z > LM['arm_mask_z']


LEG = dict(z=(0.035, -0.020), x=(0.004, 0.016), blend=0.010)
RIGID_BASE = 0.004          # spine/claw base = its vertices within this of its closest point to the skin


def _chain_of(rig, prefix):
    import json
    return json.loads(rig['rb_chains'])[prefix]


def _seg_weights(rig, bones, c, blend):
    import rigbatch as rb
    return rb.polyline_chain_weights(rig, bones, c, blend)


def _tail_weights(body, rig, rep):
    import rigbatch as rb
    rc = rb.rc; ai = body.data.attributes['rb_isl']; bones = _chain_of(rig, 'tail'); B = rig.data.bones
    pts = [B[bones[0]].head_local] + [B[b].tail_local for b in bones]
    out = set()
    for v in body.data.vertices:
        c = v.co
        if ai.data[v.index].value != 0:
            continue
        d, s = _poly_nearest(pts, c)
        # the whole section past the root (the tail is ~3.4 cm wide on the floor); near the root only the midline,
        # the buttocks beside it stay with the hips
        if d > TAIL['r'] or s <= 0.0 or (s < TAIL['free_s'] and abs(c.x) > TAIL['x']):
            continue
        w, _ = _seg_weights(rig, bones, c, TAIL['blend'])
        rc.set_weights(body, v.index, rb.blend({'pelvis': 1.0}, w, rc.sm(0.0, TAIL['root'], s))); out.add(v.index)
    rep['tail_verts'] = len(out)
    return out


def _plane_chain_weights(rig, bones, p, w):
    """Weights along a bent chain by the bisector plane of each joint (normal = mean of the two bone directions):
    the nearest-segment rule jumped a whole bone across the inside of the knee (sit/knees 9x)."""
    import rigbatch as rb
    B = rig.data.bones; f = []
    for a, b in zip(bones[:-1], bones[1:]):
        j = B[b].head_local; n = ((B[a].tail_local - B[a].head_local).normalized() + (B[b].tail_local - j).normalized()).normalized()
        f.append(rb.rc.sm(-w, w, (p - j).dot(n)))
    out = {}; pre = 1.0
    for i, n_ in enumerate(bones):
        x = pre * (1 - f[i]) if i < len(f) else pre
        if x > 1e-4:
            out[n_] = x
        pre *= f[i] if i < len(f) else 0.0
    return out


def _leg_weights(body, rig, skip, rep):
    import rigbatch as rb
    rc = rb.rc; ai = body.data.attributes['rb_isl']; hz = rig.data.bones['L_Thigh'].head_local.z; n = 0
    for v in body.data.vertices:
        c = v.co
        if v.index in skip or ai.data[v.index].value != 0:
            continue
        sz = rc.sm(hz + LEG['z'][0], hz + LEG['z'][1], c.z)
        if sz <= 0:                 # above the hips: the stage's torso weights stay
            continue
        s = sz * rc.sm(LEG['x'][0], LEG['x'][1], abs(c.x))       # crotch midline: hips, not one thigh
        P_ = 'L' if c.x > 0 else 'R'
        w = _plane_chain_weights(rig, [f'{P_}_Thigh', f'{P_}_Calf', f'{P_}_Foot', f'{P_}_Toe'], c, LEG['blend'])
        rc.set_weights(body, v.index, rb.blend(rc.torso_weights(c, rig), w, s)); n += 1
    rep['leg_verts'] = n


def _rigid_islands(body, rep):
    """Spines and claws: one uniform weight set per island = the mean skin weight under its base, so each cone stays
    rigid and stays on the skin it grows from."""
    import rigbatch as rb, collections
    rc = rb.rc; ai = body.data.attributes['rb_isl']; V = body.data.vertices
    skin = [i for i in range(len(V)) if ai.data[i].value == 0]
    kd = rb.kdtree.KDTree(len(skin))
    for i in skin:
        kd.insert(V[i].co, i)
    kd.balance()
    groups = collections.defaultdict(list)
    for i in range(len(V)):
        if ai.data[i].value != 0:
            groups[ai.data[i].value].append(i)
    top = collections.Counter()
    for kk, vs in groups.items():
        near = [(kd.find(V[i].co), i) for i in vs]
        dmin = min(f[2] for f, _ in near)
        acc = collections.Counter()
        for (co, j, d), i in near:
            if d <= dmin + RIGID_BASE:
                for g, x in rb.vertex_weights(body, j).items():
                    acc[g] += x
        w = dict(acc.most_common(4)); t = sum(w.values())
        w = {g: x / t for g, x in w.items()}
        for i in vs:
            rc.set_weights(body, i, w)
        top[max(w, key=w.get)] += 1
    rep['rigid_islands'] = dict(n=len(groups), main_bone=dict(top))


def _ear_weights(head, rig, rep):
    import rigbatch as rb
    rc = rb.rc; n = 0
    for s, sg in (('L', 1), ('R', -1)):
        bones = _chain_of(rig, f'ear_{s}')
        for v in head.data.vertices:
            c = v.co
            if sg * c.x <= EAR['x'] or c.z <= EAR['z']:
                continue
            w, sa = _seg_weights(rig, bones, c, EAR['blend'])
            rc.set_weights(head, v.index, rb.blend({'head': 1.0}, w, rc.sm(0.0, EAR['root'], sa))); n += 1
    rep['ear_verts'] = n


# user 2026-10-28 (circled skull + snout + ears: "head weight only here, now it reaches the neck"): no head weight below the
# cut (the stage's band head -> torso on the Body side becomes neck -> torso); the blend sits inside the head instead,
# from the Body weights at the cut to head 1 over HEAD_IN (geodesic).
HEAD_IN = 0.010


def _head_inside(body, head, rep):
    import rigbatch as rb
    rc = rb.rc; n = 0
    for v in body.data.vertices:
        w = rb.vertex_weights(body, v.index); h = w.pop('head', 0.0)
        if h > 0:
            w['neck'] = w.get('neck', 0.0) + h; rc.set_weights(body, v.index, w); n += 1
    cut = rb.coincident_map(head, body)
    lbl, dist = rb.geodesic_voronoi(head, {i: i for i in cut}, lambda i: True)
    m = 0
    for i, d in dist.items():
        if d < HEAD_IN:
            rc.set_weights(head, i, rb.blend(rb.vertex_weights(body, cut[lbl[i]]), {'head': 1.0}, rc.sm(0.0, HEAD_IN, d))); m += 1
    rep['head_inside'] = dict(body_head_to_neck=n, cut=len(cut), head_band=m)


def body_weights_fix(body, rig, rep):
    import stages
    tail = _tail_weights(body, rig, rep)
    _leg_weights(body, rig, tail, rep)
    _rigid_islands(body, rep)
    head = stages.parts_by_role().get('Head')
    if head is not None:
        _head_inside(body, head, rep)
        _ear_weights(head, rig, rep)


# ------------------------------------------------------------------ springs (spring_layers.py), user "ok" 2026-10-28
# tail: lies on the floor at rest, so little gravity (no floor collider) and fairly stiff; collides with the legs only
# (a pelvis sphere / spine capsules would hold the tail root, which sits inside the rump). Ears: stiff, light, no collision
# (the root sits on the skull: a head sphere would push them at rest). Spines/claws are rigid weights, no bones.
SPRING = dict(collections={'Tail': ['tail_'], 'Ears': ['ear_']},
              extra_chains=[dict(root='tail_01', stiffness=1.4, drag=0.45, gravity=0.1, hitRadius=0.012, endLength=0.0,
                                 wind=0.3, layer=0)]
              + [dict(root=f'ear_{s}_01', stiffness=2.2, drag=0.5, gravity=0.05, hitRadius=0.006, endLength=0.0,
                      wind=0.6, collide=False, layer=0) for s in 'LR'],
              colliders=[dict(bone=f'{s}_Thigh', type='capsule', radius=0.020) for s in 'LR']      # auto 0.024 stood out of the thigh
              + [dict(bone=f'{s}_{b}', type='capsule') for s in 'LR' for b in ('Calf', 'Foot')])
