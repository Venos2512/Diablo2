"""B04 Willow Bride A (rig_v1). ~1H = 1.80 m (GLB 0.994 -> x1.811; veil top = 1.80, catalogue ~1H, no canon question).
Drowned bride: one low-poly piece (island 4, 1712 verts) = head + veil + hair + bodice + puffed sleeves + bare arms +
floor-length gown (hem z 0, flared to |x| 0.58, train y -0.68..0.42). NO leg mesh: the root strands replace the legs.
Body axis x +0.028 (head, torso, arms all agree) -> centred.
Measured (centred): chin 1.585, face y -0.23, neck ring y -0.17..-0.06 at 1.52, chest y -0.245..-0.05 at 1.38, empire
waist tie z 1.22-1.29 (front y -0.23, back -0.08), arms z 1.40-1.53 (axis y -0.108, z 1.468), puffed sleeve to |x| ~0.39,
narrowest forearm 0.57-0.63, hand from ~0.65, finger tips 0.845.
Veil = open sheet of island 4 (free edge loop z 0.72-1.54): over the head, nape and shoulders, hanging behind the back to
a point at z 0.72 (y +0.205), 10-20 cm behind the gown back (y +0.04..-0.08); the roots run between them.
Roots: islands 71 (R, 1110 v), 23 (L, 602 v), 0/1/2/7/14 (back), 50 (L front), 65 (L back, far), 35/36 (L shoulder
front strands); tops at z 1.19-1.50 behind/beside the shoulders (from the hair), spreading on the floor to |x| 0.9.
Circlet 11 + ~85 small islands (leaves on the circlet, roots and veil; ribbon ends of the waist tie 6/9/15, knot 73).
Brief: gown F/L/B/R, roots follow the nearest gown chain.
"""
GENERIC = True
HEIGHT_M = 1.80
ISL = dict(torso=[4], legs=[], arms=[])
SYM = dict(c=0.028, ops=[], center=True)
ROOT_ISL = [0, 1, 2, 7, 14, 23, 35, 36, 50, 65, 71]
# head = face/hair/veil above the chin cut + the circlet and the small bits on it (s2_attrs); kept in Body (user, P05)
HEAD = dict(islands=[11], cut=[4], z_chin=1.585, pred=lambda c: abs(c.x) < 0.20, in_body=True)


def _veil(c):
    """Veil hanging behind the back: well behind the back surface (gown back y +0.04 at z 0.65 .. -0.08 at the tie,
    upper back -0.05 at 1.40; veil +0.205 at 0.72 .. +0.034 at 1.49)."""
    return 0.69 < c.z < 1.53 and abs(c.x) < 0.26 and c.y > 0.10 - 0.125 * (c.z - 0.70)


# gown and veil stay inside Body (user preference since P02); veil first (the loop takes the first match)
ROBE_CUTS = {'Cloth_Veil': dict(islands=[4], z_max=1.53, pred=_veil, in_body=True),
             'Cloth_Gown': dict(islands=[4], z_max=1.20, in_body=True)}
CLOTH = {'Cloth_Gown': dict(prefix='robe_gown', chains=[('F', 0), ('L', 90), ('B', 180), ('R', -90)], half=45, n=4,
                            parent='pelvis', center='pelvis'),
         'Cloth_Veil': dict(prefix='robe_veil', chains=[('B', 180)], half=80, n=3, parent='chest', center=(0.0, -0.12),
                            seam_band=0.12)}
# roots and the loose bits: weighted in cloth_weights_fix (mode 'custom' = no stage rule)
ACC = {'roots': dict(islands=list(ROOT_ISL), mode='custom'),
       'bits': dict(islands=[], mode='custom')}
LM = dict(neck_mode='band', head_band=0.12, arm_z_min=1.35, torso_half_w=0.15, wrist_x=0.65,
          arm_mask_x=0.14, arm_mask_z=1.33, cap=(0.07, 0.10),
          # no leg mesh: slim human legs for the skirt push (auto radii would measure the gown)
          leg_radii=dict(thigh_r=0.085, knee_r=0.07, calf_r=0.06, foot_r=0.08))
PUSH_KW = dict(iters=6, smooth=0.7, rounds=6)
LAYER_SKIP = ('beads', 'flap_rope')


def s2_attrs(ob, lab, isl, info):
    """Small islands: above z 1.55 near the head axis -> Head (circlet leaves, hair bits); the rest -> 'bits'
    (leaves on roots/veil, ribbon ends and knot of the waist tie), which follow the nearest Body/root vertex."""
    V = ob.data.vertices; head, bits = [], []
    for kk, c in enumerate(isl):
        if kk == 4 or kk == 11 or kk in ROOT_ISL:
            continue
        P = [V[i].co for i in c]
        if min(p.z for p in P) > 1.55 and max(abs(p.x) for p in P) < 0.22:
            head.append(kk)
        else:
            bits.append(kk)
    HEAD['islands'] = [11] + head
    ACC['bits']['islands'] = bits
    info['head_islands'] = HEAD['islands']; info['bits_islands'] = len(bits)


def landmarks_fix(L, parts, notes):
    """Fused mesh, no legs: joints from the measured profile (centred x). Torso centre y ~-0.15 (front -0.23..-0.25,
    back -0.05..-0.08); neck ring centre -0.11 at 1.52; skull mid -0.14; arm axis (y -0.108, z 1.468)."""
    S = dict(pelvis=(0.0, -0.150, 0.97), spine1=(0.0, -0.148, 1.10), spine2=(0.0, -0.145, 1.22), chest=(0.0, -0.140, 1.36),
             neck=(0.0, -0.110, 1.52), head=(0.0, -0.140, 1.62), head_top=(0.0, -0.140, 1.80),
             shoulder=(0.17, -0.100, 1.468), elbow=(0.42, -0.108, 1.468), wrist=(0.65, -0.110, 1.470))
    for k_, v in S.items():
        L[k_] = v
    L['hand_end'] = (0.845, -0.110, 1.455)
    L['clav_in'] = (0.031, -0.125, 1.495)
    legs = dict(hip=(0.09, -0.150, 0.93), knee=(0.095, -0.160, 0.48), ankle=(0.10, -0.150, 0.095),
                ball=(0.10, -0.250, 0.03), toe=(0.10, -0.300, 0.02))
    for s_, sg in (('L_', 1), ('R_', -1), ('', 1)):
        for k_, (x, y, z) in legs.items():
            L[s_ + k_] = (sg * x, y, z)
    notes.append('all joints set by hand (fused mesh, legs hidden by the gown: human proportions)')


def cloth_weights_fix(parts, rig, chains, rep):
    """Roots: the nearest strand chain (BACK_HAIR, hair + root = one chain); without strand chains (fallback, v1) the
    gown chains nearest in angle below ROOT_BLEND, the torso above. Bits: rigid on the vertex nearest their top."""
    import json, stages
    import rigbatch as rb
    rc = rb.rc
    acc = parts.get('Accessory'); body = parts['Body']
    if acc is None:
        return
    spec = CLOTH['Cloth_Gown']
    ch = {f"{spec['prefix']}_{t}": chains[f"{spec['prefix']}_{t}"] for t, _ in spec['chains'] if f"{spec['prefix']}_{t}" in chains}
    ang = {f"{spec['prefix']}_{t}": a for t, a in spec['chains']}
    lm = json.loads(rig['rb_landmarks']); cen = (0.0, lm['pelvis'][1])
    at = acc.data.attributes['rb_acc']; codes = {n: i for i, n in enumerate(ACC, start=1)}
    AV = acc.data.vertices
    roots = [i for i in range(len(AV)) if at.data[i].value == codes['roots']]
    for i in roots:
        co = AV[i].co
        d = rb.angular_chain_weights(co, rig, ch, ang, cen, blend_z=0.06)
        s_ = rc.sm(ROOT_BLEND[0], ROOT_BLEND[1], co.z)
        if s_ < 1:
            d = rb.blend(rc.torso_weights(co, rig), d, s_)
        rc.set_weights(acc, i, d)
    nh = 0
    hch = {n: chains[n] for n in BACK_HAIR if n in chains}
    B_ = rig.data.bones
    def pdist(bones, p):
        best = 1e9
        for n_ in bones:
            a, b = B_[n_].head_local, B_[n_].tail_local; ab = b - a
            t = max(0.0, min(1.0, (p - a).dot(ab) / max(ab.length_squared, 1e-12)))
            best = min(best, (p - (a + ab * t)).length)
        return best
    # hair + root = one strand chain: every root vertex takes the NEAREST strand chain (by distance to its bones), not
    # its island's: the stub tops of the short lower roots (2, 50 ...) hide under the strands and showed when they swung
    for i in (roots if hch else []):
        co = AV[i].co
        bones = min(hch.values(), key=lambda bs: pdist(bs, co))
        hd, s_ = rb.polyline_chain_weights(rig, bones, co, HAIR_W_BLEND)
        rc.set_weights(acc, i, rb.blend(rc.torso_weights(co, rig), hd, rc.sm(0.0, HAIR_TOP, s_))); nh += 1
    rep['back_hair_verts'] = nh
    rc.smooth_weights(acc, roots, iters=ROOT_SMOOTH)     # stiff wood: no sharp steps along a root (walk 9.9x)
    bits = [i for i in range(len(AV)) if at.data[i].value == codes['bits']]
    if bits:
        kd = rb.kdtree.KDTree(len(body.data.vertices) + len(roots)); src = {}
        n = 0
        for v in body.data.vertices:
            kd.insert(v.co, n); src[n] = (body, v.index); n += 1
        for i in roots:
            kd.insert(AV[i].co, n); src[n] = (acc, i); n += 1
        kd.balance()
        ai = acc.data.attributes['rb_isl']; by = {}
        for i in bits:
            by.setdefault(ai.data[i].value, []).append(i)
        for kk, vs in by.items():          # each bit rigid on what it hangs from: the vertex nearest its top
            top = max(vs, key=lambda i: AV[i].co.z)       # (per-vertex nearest tore the waist knot 15x on a bend)
            o, j = src[kd.find(AV[top].co)[1]]; d = rb.vertex_weights(o, j)
            for i in vs:
                rc.set_weights(acc, i, d)
    seam = 0                               # vertices shared with Body/Head take theirs (head turn opened 62 mm)
    for o in [stages.parts_by_role().get(r) for r in ('Body', 'Head')]:
        if o is None:
            continue
        for i, j in rb.coincident_map(acc, o).items():
            rc.set_weights(acc, i, rb.vertex_weights(o, j)); seam += 1
    rc.finalize_weights(acc)
    rep['roots'] = dict(verts=len(roots), bits=len(bits), blend=ROOT_BLEND, seam=seam)


ROOT_BLEND = (1.15, 0.85)   # z: torso above the first, gown chains below the second
ROOT_SMOOTH = 8


# Low-poly arm: rings at |x| 0.405 / 0.434 / 0.476 round the elbow (0.42), so the skill's +-0.04 window put the whole
# bend on one 3 cm ring gap (elbows 36.8x): UpperArm -> ForeArm share eased over ELBOW_WIN around the elbow joint.
ELBOW_WIN = (-0.05, 0.06)
# Head turn (7.4x): the veil on the shoulders next to the chin cut took head 0.7-1. Head share capped by the horizontal
# distance r to the head axis (x 0, y -0.14): full inside HEAD_R[0], none beyond HEAD_R[1]; above HEAD_FREE_Z[1] free.
# What is taken off goes to the neck.
HEAD_R = (0.10, 0.16)
HEAD_FREE_Z = (1.62, 1.68)


def _head_cap(part):
    import rigbatch as rb
    rc = rb.rc; n = 0
    for v in part.data.vertices:
        c = v.co
        r = ((c.x) ** 2 + (c.y + 0.14) ** 2) ** 0.5
        f = max(1 - rc.sm(HEAD_R[0], HEAD_R[1], r), rc.sm(HEAD_FREE_Z[0], HEAD_FREE_Z[1], c.z))
        w = rb.vertex_weights(part, v.index); h = w.get('head', 0.0)
        if h > f + 1e-4:
            w['head'] = f; w['neck'] = w.get('neck', 0.0) + h - f
            rc.set_weights(part, v.index, {k: x for k, x in w.items() if x > 1e-4}); n += 1
    return n


def body_weights_fix(body, rig, rep):
    import stages
    import rigbatch as rb
    rc = rb.rc; B = rig.data.bones; n = 0
    for v in body.data.vertices:
        c = v.co
        if c.z < 1.36 or abs(c.x) < 0.30:
            continue
        Pn = 'L' if c.x > 0 else 'R'; ex = abs(B[Pn + '_ForeArm'].head_local.x)
        if not (ex + ELBOW_WIN[0] - 0.01 < abs(c.x) < ex + ELBOW_WIN[1] + 0.01):
            continue
        w = rb.vertex_weights(body, v.index)
        names = [Pn + s_ for s_ in ('_UpperArm', '_UpperArm_twist', '_ForeArm', '_ForeArm_twist')]
        tot = sum(w.pop(nm, 0.0) for nm in names)
        if tot <= 0:
            continue
        f = rc.sm(ex + ELBOW_WIN[0], ex + ELBOW_WIN[1], abs(c.x))
        w[Pn + '_UpperArm'] = w.get(Pn + '_UpperArm', 0.0) + tot * (1 - f)
        w[Pn + '_ForeArm'] = w.get(Pn + '_ForeArm', 0.0) + tot * f
        rc.set_weights(body, v.index, {k: x for k, x in w.items() if x > 1e-4}); n += 1
    rep['elbow_blend'] = n
    rep['head_cap_body'] = _head_cap(body)
    _hair_weights(body, rig, rep)
    head = stages.parts_by_role().get('Head')
    if head is not None:
        rep['head_cap_head'] = _head_cap(head)


# user 2026-10-28 ("add bones for the hair"): the two wavy locks in front of the chest hang from the temples to z ~1.20
# (L) / 1.29 (R); below the chin cut they are their own Body islands (121 / 94 verts). Each gets a 3-bone chain
# hair_L / hair_R (child of head); the top eases from the head weights (same cap as the Head part at the cut) over
# HAIR_TOP_BLEND. The back hair is under the veil and turns into the roots (gown chains).
HAIR_N = 3
HAIR_TOP_BLEND = 0.04


def _locks(body):
    """Body vertex lists of the front locks {L: [...], R: [...]}: the islands other than the main one, by x sign."""
    import rigbatch as rb
    lab, isl = rb._islands(body); V = body.data.vertices
    main = max(range(len(isl)), key=lambda kk: len(isl[kk])); out = {}
    for kk, c in enumerate(isl):
        if kk == main or len(c) < 30:
            continue
        cx = sum(V[i].co.x for i in c) / len(c)
        out.setdefault('L' if cx > 0 else 'R', []).extend(c)
    return out


def extra_chains(rig, parts, chains, L):
    import stages
    import rigbatch as rb
    rc = rb.rc; body = parts['Body']; V = body.data.vertices
    for Pn, vs in _locks(body).items():
        pts = stages.item_chain([V[i].co.copy() for i in vs], HAIR_N, rb.K)
        chains[f'hair_{Pn}'] = rc.add_chain(rig, f'hair_{Pn}', pts, 'head')
    acc = parts.get('Accessory')
    if acc is not None:
        AV = acc.data.vertices
        for name, vs in _hair_groups(acc).items():
            if vs:
                chains[name] = rc.add_chain(rig, name, _strand_path(acc, vs, BACK_HAIR[name][1]), 'chest')


def _hair_weights(body, rig, rep):
    import json
    import rigbatch as rb
    rc = rb.rc; chains = json.loads(rig['rb_chains']); V = body.data.vertices; n = 0
    for Pn, vs in _locks(body).items():
        bones = chains.get(f'hair_{Pn}')
        if not bones:
            continue
        jz = rb.chain_joint_z(rig, bones); zt = max(V[i].co.z for i in vs)
        for i in vs:
            c = V[i].co
            r = (c.x ** 2 + (c.y + 0.14) ** 2) ** 0.5
            f = max(1 - rc.sm(HEAD_R[0], HEAD_R[1], r), rc.sm(HEAD_FREE_Z[0], HEAD_FREE_Z[1], c.z))
            top = {'head': f, 'neck': 1 - f} if f < 1 else {'head': 1.0}
            d = rb.blend(top, rc.chain_weights(bones, jz, c.z, blend=0.03), rc.sm(zt, zt - HAIR_TOP_BLEND, c.z))
            rc.set_weights(body, i, {k: x for k, x in d.items() if x > 1e-4}); n += 1
    rep['hair_locks'] = n


# user 2026-10-28 ("no, the long hair at the BACK"): the long back hair is the root strands themselves (under the veil they
# come out of the nape / shoulders at z ~1.49 and run to the floor). Groups of stage-0 islands -> chain name, bones;
# parent chest (the strands start below the head, under the veil).
# user 2026-10-28 ("hair and root are ONE bone [chain]"): each strand is one chain from its top to the tip of its root on
# the floor (no gown chains on the roots any more); bones per strand below. Every root vertex follows the nearest strand
# chain (short lower roots and the stub tops hidden under the strands included).
BACK_HAIR = {'hair_back_R': ([71], 5), 'hair_back_L': ([23], 5), 'hair_side_L': ([35, 36], 3),
             'hair_back_B1': ([7], 4), 'hair_back_B2': ([0], 4)}
HAIR_W_BLEND = 0.06           # chain_weights blend along a strand chain (m)
HAIR_TOP = 0.04               # arc length over which the strand top eases from the torso weights


def _strand_path(acc, vs, n):
    """Chain points along a strand: geodesic distance from its top band, the farthest vertex, the shortest path back
    to the top; at each path vertex the tube centre = centroid of the strand vertices at the same geodesic distance
    within 12 cm (one branch only); then n+1 points at equal arc length."""
    import collections
    import rigbatch as rb
    V = acc.data.vertices; vset = set(vs)
    zt = max(V[i].co.z for i in vs)
    top = [i for i in vs if V[i].co.z > zt - 0.03]
    _, dist = rb.geodesic_voronoi(acc, {i: i for i in top}, lambda i: i in vset)
    nb = collections.defaultdict(list)
    for e in acc.data.edges:
        a, b = e.vertices
        if a in vset and b in vset:
            nb[a].append(b); nb[b].append(a)
    far = max(dist, key=dist.get); path = [far]
    while dist[path[-1]] > 0:
        nxt = min(nb[path[-1]], key=lambda j: dist.get(j, 1e9))
        if dist.get(nxt, 1e9) >= dist[path[-1]]:
            break
        path.append(nxt)
    path.reverse()
    cen = []
    for i in path:
        d = dist[i]; p = V[i].co
        S = [V[j].co for j in vs if j in dist and abs(dist[j] - d) < 0.03 and (V[j].co - p).length < 0.12]
        cen.append(sum(S, rb.Vector()) / len(S) if S else p.copy())
    acc_l = [0.0]
    for a, b in zip(cen, cen[1:]):
        acc_l.append(acc_l[-1] + (b - a).length)
    L = acc_l[-1]; pts = []
    for t in range(n + 1):
        x = L * t / n; k_ = 0
        while k_ < len(acc_l) - 2 and acc_l[k_ + 1] < x:
            k_ += 1
        seg = max(acc_l[k_ + 1] - acc_l[k_], 1e-9)
        pts.append(cen[k_].lerp(cen[k_ + 1], min(1.0, (x - acc_l[k_]) / seg)))
    return pts


def _hair_groups(acc):
    ai = acc.data.attributes['rb_isl']; out = {}
    for name, (ids, n) in BACK_HAIR.items():
        out[name] = [i for i in range(len(acc.data.vertices)) if ai.data[i].value in ids]
    return out


# layers + springs (spring_layers.py): gown (Body) layer 0; the hair/root strands lie on it (1); the veil hangs outside
# them (2). Strands = hair + root, one chain each, child of chest: very stiff, heavy, little wind, so the root base stays
# near the floor; the front locks swing freely over a chest capsule. The gown/veil in Body inflate every auto torso radius
# (no leg mesh either) -> torso radii by hand from the sections (chest y -0.245..-0.05, waist -0.23..-0.08).
_STRAND = dict(stiffness=3.0, drag=0.6, gravity=0.15, wind=0.1, hitRadius=0.05, endLength=0.05, layer=1)
_LOCK = dict(stiffness=1.0, drag=0.35, gravity=0.5, wind=0.8, hitRadius=0.03, endLength=0.04)
SPRING = dict(collections={'Gown': ['robe_gown_'], 'Veil': ['robe_veil_'], 'Hair': ['hair_L_', 'hair_R_'],
                           'Roots': ['hair_back_', 'hair_side_']},
              layers={'Cloth_Gown': 0, 'Cloth_Veil': 2},
              extra_chains=[dict(root=f'{n}_01', **_STRAND) for n in BACK_HAIR]
                           + [dict(root='hair_L_01', **_LOCK), dict(root='hair_R_01', **_LOCK)],
              radius={'pelvis': 0.10, 'spine_01': 0.10, 'spine_02': 0.10},
              extra_colliders=[dict(bone='chest', type='capsule', tail_to='neck', radius=0.09)])
