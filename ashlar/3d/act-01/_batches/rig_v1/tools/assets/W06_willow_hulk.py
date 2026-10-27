"""W06 Willow-Hulk B (wave 3). Canon 1.75H = 3.15 m (user 2026-10-27 chose canon over the sheet's 1.22H), k = 1.75.
Tall columnar hulk of twisted roots, asymmetric on purpose: huge RIGHT root arm (-X, shoulder |x| ~0.42 to root
fingertips 2.62 from the axis) and a short LEFT stub arm (+X, root to 1.14 + a bone hand, islands 68-71, to 1.57).
Root-column legs without a knee shape, crotch ~1.05 (0.35H, not the skill's 0.47H), root toes spread on the floor.
Stage-0 (x relative to the body axis 0.523; the GLB bbox centre is off because the right arm is longer):
2 = everything fused (trunk, legs, both root arms, head mass behind the skull), 35 = bone skull (face, z 2.51-2.94,
y -0.57..-0.33), 34 = noose (around the skull/neck, loop down the chest to z 1.78), rib pairs 21/46 27/47 28/44 32/43,
bone hand 68-71, everything else = leaf islands (frond crown + fronds down the upper back, moss on the arms/hips).
Arms are measured per side (R_* landmark keys, rb.build_skeleton), never mirrored.
"""
GENERIC = True
HEIGHT_M = 3.15
ISL = dict(torso=[2], legs=[], arms=[])           # arms empty: the R root fingers are island 2, so no Hand-island rule
SYM = dict(c=0.523, ops=[], center=True)
MAIN = 2
SKULL = 35
NOOSE = 34
RIBS = (21, 46, 27, 47, 28, 44, 32, 43)
BONE_HAND = (68, 69, 70, 71)
# head = skull + the head mass of island 2 above the shoulders near the axis; kept in Body (user, P05)
HEAD = dict(islands=[SKULL], cut=[MAIN], z_chin=2.62, pred=lambda c: abs(c.x) < 0.30, in_body=True)
LM = dict(arm_z_min=2.15, arm_mask_x=0.40, arm_mask_z=2.10,
          leg_win=(-0.12, 0.12))     # no knee shape on the root columns: a wide thigh -> calf blend
PUSH_KW = dict(iters=6, smooth=0.7, rounds=6)
LAYER_SKIP = ('beads', 'flap_rope')
# arm joints per side (centred x, from the section profile: arm axis z ~2.38, y ~-0.06)
ARM = dict(L=dict(shoulder=(0.42, -0.05, 2.42), elbow=(0.73, -0.05, 2.42), wrist=(1.00, -0.07, 2.42), hand_end=(1.57, -0.04, 2.38)),
           R=dict(shoulder=(-0.42, -0.05, 2.42), elbow=(-1.25, -0.06, 2.38), wrist=(-1.97, -0.08, 2.39), hand_end=(-2.62, -0.06, 2.38)))


def landmarks_fix(L, parts, notes):
    """Columnar root body: the skill's proportions (hip 0.517H = 1.63 m) sit far above the crotch (~1.05). Joints from
    the section profile: torso half width ~0.31 at z 1.7-1.9, ~0.40 at the arm line; legs centred at |x| ~0.30 from
    z 1.0 down; skull face z 2.51-2.94 in front of the head mass; frond crown to 3.15."""
    S = dict(pelvis=(0.0, -0.04, 1.20), spine1=(0.0, -0.05, 1.50), spine2=(0.0, -0.05, 1.80), chest=(0.0, -0.04, 2.08),
             neck=(0.0, -0.06, 2.44), head=(0.0, -0.16, 2.64), head_top=(0.0, -0.16, 3.15))
    for k_, v in S.items():
        L[k_] = v
    for side in ('L', 'R'):
        for key, v in ARM[side].items():
            L[key if side == 'L' else 'R_' + key] = v
    ci = L['clav_in']
    L['clav_in'] = (abs(ci[0]), -0.05, 2.40); L['R_clav_in'] = (-abs(ci[0]), -0.05, 2.40)
    for s_, sg in (('L_', 1), ('R_', -1)):
        L[s_ + 'hip'] = (sg * 0.25, -0.02, 1.15)
        L[s_ + 'knee'] = (sg * 0.30, -0.06, 0.66)
        L[s_ + 'ankle'] = (sg * 0.31, -0.02, 0.22)
        L[s_ + 'ball'] = (sg * 0.31, -0.36, 0.06)
        L[s_ + 'toe'] = (sg * 0.31, -0.62, 0.03)
    for kk in ('hip', 'knee', 'ankle', 'ball', 'toe'):
        L[kk] = L['L_' + kk]
    notes.append('spine/neck/head/legs set by hand (columnar root body); arms per side (R_* keys, not mirrored)')


def is_arm(i, V, lab, torso, arm_isl, sl, shj):
    """Arm = island 2 beyond the arm mask x at the arm line, plus the bone hand. Leaves are re-weighted later."""
    c = V[i].co
    return _isl(i) in BONE_HAND or (_isl(i) == MAIN and abs(c.x) > LM['arm_mask_x'] and c.z > LM['arm_mask_z'])


_ISL = {}


def _isl(i):
    if 'a' not in _ISL:
        import stages
        _ISL['a'] = stages.parts_by_role()['Body'].data.attributes['rb_isl']
    return _ISL['a'].data[i].value


# Loose pieces on the skin (leaves, noose, ribs) take the weights of the nearest skin (island 2 in Body + the head part,
# head 1). Leaves hanging from the crown/shoulders are drapes: they never follow the arm (arm share -> torso weights);
# only moss lying on an arm (island centre |x| > ARM_LEAF_X) keeps the arm.
ARM_LEAF_X = 0.75
LOOSE_SMOOTH = 30
# noose (z 1.78-2.88, knot ~2.3 under the skull): chest below the knot, neck above, head beside the skull
NOOSE_Z = dict(neck=(2.30, 2.50), head=(2.58, 2.78))


def body_weights_fix(body, rig, rep):
    import collections, stages
    import rigbatch as rb
    rc = rb.rc
    _legs(body, rig, rep)                                # skin first: the loose pieces copy it
    parts = stages.parts_by_role(); head = parts.get('Head')
    V = body.data.vertices; ai = body.data.attributes['rb_isl']
    skin = [i for i in range(len(V)) if ai.data[i].value == MAIN]
    pts = [(V[i].co.copy(), rb.vertex_weights(body, i)) for i in skin]
    if head is not None:
        pts += [(v.co.copy(), {'head': 1.0}) for v in head.data.vertices]
    kd = rb.kdtree.KDTree(len(pts))
    for j, (co, _) in enumerate(pts):
        kd.insert(co, j)
    kd.balance()
    loose = collections.defaultdict(list)
    for i in range(len(V)):
        kk = ai.data[i].value
        if kk != MAIN:
            loose[kk].append(i)
    armb = lambda n: any(n.startswith(f'{s}_{b}') for s in 'LR' for b in ('UpperArm', 'ForeArm', 'Hand'))
    n_arm = n_drape = 0
    for kk, vs in loose.items():
        if kk in BONE_HAND:
            continue
        cx = sum(V[i].co.x for i in vs) / len(vs)
        on_arm = abs(cx) > ARM_LEAF_X
        for i in vs:
            d = dict(pts[kd.find(V[i].co)[1]][1])
            if not on_arm:
                gone = sum(x for n, x in d.items() if armb(n))
                if gone > 0:
                    d = collections.Counter({n: x for n, x in d.items() if not armb(n)})
                    for n, x in rc.torso_weights(V[i].co, rig).items():
                        d[n] += gone * x
                    d = dict(d)
            rc.set_weights(body, i, d)
        rc.smooth_weights(body, vs, iters=LOOSE_SMOOTH)    # nearest skin jumps (Head part / back skin) inside one leaf
        if on_arm:
            n_arm += 1
        else:
            n_drape += 1
    rep['loose_follow'] = dict(islands=len(loose), on_arm=n_arm, drape=n_drape)
    for i in loose.get(NOOSE, []):        # rope beside the skull turns with the head, the knot and loop stay on the chest
        z = V[i].co.z; d = rb.blend(rb.vertex_weights(body, i), {'neck': 1.0}, rc.sm(NOOSE_Z['neck'][0], NOOSE_Z['neck'][1], z))
        rc.set_weights(body, i, rb.blend(d, {'head': 1.0}, rc.sm(NOOSE_Z['head'][0], NOOSE_Z['head'][1], z)))


# Legs: the root toes of both feet meet behind the heels (x ~0, y +0.22, z 0) and the skill splits L/R at x = 0 and
# thigh -> pelvis at hip + 2 cm: step_back 43x, walk 32x, sit 12.8x at the hip front. Island 2 below hip + LEG['top']:
# L share from the geodesic distances to the two leg columns (cross-fade over |dR - dL| < LEG['g']), pelvis share
# fading in over hip +- LEG['hip'].
LEG = dict(top=0.25, g=0.15, hip=0.12, seed_x=0.15, seed_z=(0.35, 0.90))


def _legs(body, rig, rep):
    import collections
    import rigbatch as rb
    rc = rb.rc; V = body.data.vertices; ai = body.data.attributes['rb_isl']; B = rig.data.bones
    hipz = min(B['L_Thigh'].head_local.z, B['R_Thigh'].head_local.z)
    reg = {i for i in range(len(V)) if ai.data[i].value == MAIN and V[i].co.z < hipz + LEG['top'] and abs(V[i].co.x) < 0.60}
    seeds = {s: {i: s for i in reg if s * V[i].co.x > LEG['seed_x'] and LEG['seed_z'][0] < V[i].co.z < LEG['seed_z'][1]} for s in (1, -1)}
    dist = {s: rb.geodesic_voronoi(body, seeds[s], lambda i: i in reg)[1] for s in (1, -1)}
    n = 0
    for i in reg:
        co = V[i].co
        dl, dr = dist[1].get(i, 1e9), dist[-1].get(i, 1e9)
        s_ = rc.sm(-LEG['g'], LEG['g'], dr - dl) if min(dl, dr) < 1e8 else (1.0 if co.x > 0 else 0.0)
        p = rc.sm(hipz - LEG['hip'], hipz + LEG['hip'], co.z)
        d = collections.Counter()
        for sgn, share in ((1.0, s_), (-1.0, 1 - s_)):
            if share > 0 and p < 1:
                for nm, x in rc.leg_weights(rb.Vector((sgn, co.y, co.z)), rig).items():
                    d[nm] += x * share * (1 - p)
        if p > 0:
            for nm, x in rc.torso_weights(co, rig).items():
                d[nm] += x * p
        rc.set_weights(body, i, dict(d)); n += 1
    rep['legs'] = dict(verts=n, seeds_L=len(seeds[1]), seeds_R=len(seeds[-1]), **LEG)


# layers + springs (spring_layers.py): no cloth chain and no accessory bone (leaves, noose and ribs follow the skin);
# only the Body/Socket collections and the leg/spine colliders for later springs.
# auto spine_02 radius 0.507 took the back fronds and the ribs (torso ~+-0.31 there) -> by hand
SPRING = dict(collections={}, radius={"spine_02": 0.30})
