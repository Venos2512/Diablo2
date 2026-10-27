"""W03 Hush-Wolf A (wave 3). 0.95H = 1.71 m (catalogue; ear tips are the top, skull top ~1.60).
Lanky upright wolf on digitigrade legs, long muzzle (to y -0.34 at z 1.41), tall ears (tips z 1.71), spiky mane behind the
neck, long thin T-pose arms (z 1.29-1.38, hands from |x| ~0.61 to the claw tips at 0.87), a torn cloth panel over the
shoulders hanging down the back to z 0.26.
Stage-0 (importer weld): 2 = whole body + head (4297 verts), 0 = the cloth panel (882, y -0.16..0.34, z 0.26-1.43),
1 = an inner strip behind the back (y 0.11-0.24, z 0.36-1.26, touches 2), 19/37 = inner side layers of the panel
(|x| 0.18-0.26, z 0.83-1.24, touch 0), 9/27 = small tufts at the jaw (z 1.38-1.47), the rest are 3-13 vert fur flecks.
Legs measured on the mesh (left/front views with a 5 cm grid): hip ~(0.09, z 0.84), crotch 0.80, knee forward
(0.125, -0.06, 0.56), hock back (0.135, +0.10, 0.31), metatarsal down to the toes at (0.15, -0.04, 0.045), claw tips
(0.17, -0.21). Bone names stay standard (BRIEF 2a): Thigh hip->knee, Calf knee->hock, Foot hock->ball, Toe.
"""
GENERIC = True
HEIGHT_M = 1.71
ISL = dict(torso=[2], legs=[], arms=[])
SYM = dict(c=0.004, ops=[], center=True)     # torso axis +0.004, arm tips symmetric about 0 (0.4 cm: no arm fix)
# head = skull + muzzle + ears cut from the body piece, kept in Body (user, P05). The throat under the jaw and the mane
# behind the skull stay neck (thread brief: the head must not spread into the nape).
HEAD_Z = 1.37


def _head_pred(c):
    if abs(c.x) > 0.17:
        return False
    # the sides behind the jaw (y > -0.08) start at z 1.47: lower, the cape's top edge (|x| 0.09-0.14, y 0-0.07,
    # z 1.40-1.44) touched head skin and gapped 51 mm on head_turn
    return ((c.y < -0.15 and c.z > 1.37) or (c.y < -0.08 and c.z > 1.42) or (c.z > 1.47 and c.y < 0.03)
            or c.z > 1.60)


HEAD = dict(islands=[], cut=[2], z_chin=HEAD_Z, pred=_head_pred, in_body=True)
# cloth panel + its inner layers: own part (separate islands, as U03's cloak); front over the shoulders follows the body,
# the back hangs on chains (user preference)
CLOTH_ISL = {'Cloth_Cape': [0, 1, 19, 37]}
# 5 chains (L/BL/B/BR/R) tore between the short side chain and BL (knees 9.8x, walk 4.3x): 3 chains, wider sectors
CLOTH = {'Cloth_Cape': dict(prefix='robe_cape', chains=[('L', 125), ('B', 180), ('R', -125)],
                            half=30, n=4, parent='chest', center=(0.0, 0.0), z_top=1.30)}
# arm mask: the torso is 0.13-0.15 wide at z 1.1-1.2 and the armpit is at |x| ~0.16, z ~1.2
LM = dict(leg_win=(-0.05, 0.08), hip_blend=(0.10, 0.06, 0.04), neck_mode='band', head_band=0.06,
          wrist_x=0.61, arm_z_min=1.20, arm_mask_x=0.16, arm_mask_z=1.22)
PUSH_KW = dict(iters=6, smooth=0.7, rounds=6)
LAYER_SKIP = ('beads', 'flap_rope')

LEG = dict(hip=(0.09, -0.01, 0.84), knee=(0.125, -0.06, 0.56), ankle=(0.135, 0.10, 0.31),
           ball=(0.15, -0.04, 0.045), toe=(0.17, -0.21, 0.015))


# measured: the torso section mixed in the cape (pelvis y +0.12), the head joint fell in the muzzle (y -0.20) and the
# head top on the ear tips, the torso half-width came out 0.003 (shoulder x 0.037) -> set from the mesh sections
# (body only): torso y centre -0.01..+0.02 (z 0.9-1.2), neck front -0.12 / back +0.09 without the mane, skull base
# behind the ears at z ~1.445, skull top ~1.60; arm axis z 1.33-1.34, y +0.01 -> -0.01 out to the wrist
UPPER = dict(pelvis=(0.0, 0.02, 0.90), spine1=(0.0, 0.0, 1.00), spine2=(0.0, -0.01, 1.10), chest=(0.0, -0.01, 1.20),
             neck=(0.0, -0.01, 1.30), head=(0.0, 0.0, 1.445), head_top=(0.0, -0.04, 1.62), clav_in=(0.03, -0.01, 1.28),
             shoulder=(0.19, 0.01, 1.335), elbow=(0.445, 0.01, 1.338), wrist=(0.61, -0.01, 1.335),
             hand_end=(0.866, -0.018, 1.322))


def landmarks_fix(L, parts, notes):
    """Digitigrade legs: the skill puts the knee at 0.267H and the ankle at 0.053H (human) -> set from the mesh."""
    for kk, v in UPPER.items():
        L[kk] = v
    notes.append('spine/neck/head/arm joints set by hand from the mesh sections')
    for s_, sg in (('L_', 1), ('R_', -1), ('', 1)):
        for kk, v in LEG.items():
            if s_ + kk in L:
                L[s_ + kk] = (sg * v[0], v[1], v[2])
    notes.append('digitigrade legs set from the mesh: ' + ', '.join(f'{kk} {v}' for kk, v in LEG.items()))


# ears (brief: 2 ears): 2 bones each, children of head, from the ear base (z ~1.565) to the tip (1.71)
EAR = dict(x=0.035, z=(1.565, 1.60))


def _ear_pts(head, s):
    return [v.co.copy() for v in head.data.vertices if s * v.co.x > EAR['x'] and v.co.z > EAR['z'][0]]


def extra_chains(rig, parts, chains, L):
    import rigbatch as rb
    head = parts.get('Head')
    if head is None:
        return
    for s, Pn in ((1, 'L'), (-1, 'R')):
        P_ = _ear_pts(head, s)
        tip = max(P_, key=lambda p: p.z).copy()
        low = [p for p in P_ if p.z < EAR['z'][1]]
        base = sum(low, rb.Vector()) / len(low); base.z = EAR['z'][0]
        tip.z -= 0.005
        chains[f'ear_{Pn}'] = rb.rc.add_chain(rig, f'ear_{Pn}', [base, base.lerp(tip, 0.5), tip], 'head')


def _ears(head, rig, rep):
    import json, rigbatch as rb
    rc = rb.rc; chains = json.loads(rig['rb_chains']); n = 0
    for v in head.data.vertices:
        c = v.co; Pn = 'L' if c.x > 0 else 'R'
        if abs(c.x) <= EAR['x'] - 0.01 or f'ear_{Pn}' not in chains:
            continue
        f = rc.sm(EAR['z'][0], EAR['z'][1], c.z) * rc.sm(EAR['x'] - 0.01, EAR['x'] + 0.01, abs(c.x))
        if f <= 0:
            continue
        bones = chains[f'ear_{Pn}']
        d = rc.chain_weights(bones, rb.chain_joint_z(rig, bones), c.z, blend=0.02)
        rc.set_weights(head, v.index, rb.blend(rb.vertex_weights(head, v.index), d, f)); n += 1
    rep['ear_verts'] = n


# the neck is short (joint z 1.30 -> head 1.445) and the skill caps neck at 0.6 (hoods): the throat under the jaw kept
# chest 0.4 next to head 0.8 (head_nod 7.7x) -> above the neck joint the neck + chest share goes to neck by height
NECK_RAMP = (1.27, 1.35)
NECK_SIDE = (0.09, 0.16)
# user 2026-10-28 (head tilted back: 'the back of the head breaks', arrows at the mane spikes behind the ears): the head
# cut ends at y 0.03 behind the skull and the mane was neck 1 past a 6 cm band -> head share behind the skull by height
# and depth: h = sm(z0, z1, z) * (1 - drop * sm(y0, y1, y)), only raises head; then smoothed
BACK_HEAD = dict(z=(1.40, 1.56), y=(0.04, 0.18), drop=0.6, x=0.17, y_min=-0.04)
# low-poly elbow (no vertex ring between |x| 0.44 and 0.52): smooth the arm weights over ELBOW_SMOOTH (elbows 13x)
ELBOW_SMOOTH = (0.37, 0.53)


def body_weights_fix(body, rig, rep):
    import stages, rigbatch as rb
    rc = rb.rc
    head = stages.parts_by_role().get('Head')
    if head is not None:
        _ears(head, rig, rep)
        rc.finalize_weights(head)
    n = 0
    for v in body.data.vertices:
        d = rb.vertex_weights(body, v.index)
        if v.co.z <= NECK_RAMP[0] or 'neck' not in d:
            continue
        t = d.get('neck', 0.0) + d.get('chest', 0.0); nn = max(d['neck'], t * rc.sm(NECK_RAMP[0], NECK_RAMP[1], v.co.z))
        if nn > d['neck'] + 1e-4:
            d['neck'] = nn; d['chest'] = t - nn
            rc.set_weights(body, v.index, {k_: x for k_, x in d.items() if x > 1e-5}); n += 1
    rep['neck_ramp'] = n
    # shoulder tops: the skill gives neck to everything above the neck base (arms_fwd 8.1x at the R shoulder); fade it
    # to chest sideways only (|x| NECK_SIDE): the stage's neck_half_w also took the mane behind the neck (head_nod 3.8x)
    n = 0
    for v in body.data.vertices:
        d = rb.vertex_weights(body, v.index); f = rc.sm(NECK_SIDE[0], NECK_SIDE[1], abs(v.co.x))
        if f > 0 and d.get('neck', 0) > 0 and 'head' not in d:
            d['chest'] = d.get('chest', 0.0) + d['neck'] * f; d['neck'] *= (1 - f)
            rc.set_weights(body, v.index, {k_: x for k_, x in d.items() if x > 1e-5}); n += 1
    rep['neck_side'] = n
    bh = BACK_HEAD; reg = []
    for v in body.data.vertices:
        c = v.co
        if c.y < bh['y_min'] or abs(c.x) > bh['x'] or c.z < bh['z'][0]:
            continue
        reg.append(v.index)
        h = rc.sm(*bh['z'], c.z) * (1 - bh['drop'] * rc.sm(*bh['y'], c.y))
        d = rb.vertex_weights(body, v.index); h0 = d.get('head', 0.0)
        if h > h0 + 1e-4:
            rc.set_weights(body, v.index, rb.blend(d, {'head': 1.0}, (h - h0) / max(1e-6, 1 - h0)))
    rc.smooth_weights(body, reg, iters=4)
    rep['back_head'] = len(reg)
    ev = [v.index for v in body.data.vertices if ELBOW_SMOOTH[0] < abs(v.co.x) < ELBOW_SMOOTH[1] and v.co.z > 1.2]
    rc.smooth_weights(body, ev, iters=6)
    rep['elbow_smooth'] = len(ev)


# cloth panel: the front (over the collarbones and the side edges in front of y CAPE_FRONT) follows the body,
# the back keeps the chains (user preference, as U03/B03)
CAPE_FRONT = dict(y=(-0.02, 0.08))


def cloth_weights_fix(parts, rig, chains, rep):
    import rigbatch as rb
    rc = rb.rc; cape = parts.get('Cloth_Cape'); nf = 0
    if cape is None:
        return
    band = rb.seam_band(cape, parts['Body'], 0.10 * rb.K)     # the seam band to the body was set by the stage: keep it
    for v in cape.data.vertices:
        f = rc.sm(CAPE_FRONT['y'][0], CAPE_FRONT['y'][1], v.co.y)
        if v.index in band:
            j, s_ = band[v.index]; f = max(f, 1 - s_)
        if f < 1:
            rc.set_weights(cape, v.index, rb.blend(rc.torso_weights(v.co, rig), rb.vertex_weights(cape, v.index), f)); nf += 1
    rc.finalize_weights(cape)
    rep['cape_front'] = dict(verts=nf, **CAPE_FRONT)
    rep['coincident_avg'] = _coincident_avg([parts['Body'], cape])


def _coincident_avg(objs, tol=1e-5):
    """Vertices lying on each other across Body/Cape (and the fur tufts on the skin) share the average weights. The jaw
    tufts (islands 9/27) touch both the neck skin and the cape: the cape copied one of two coincident Body vertices
    (neck 0.98 vs head 0.66) and gapped 30 mm on head_turn."""
    import collections, rigbatch as rb
    rc = rb.rc; pts = [(o, v.index, v.co.copy()) for o in objs for v in o.data.vertices]
    kd = rb.kdtree.KDTree(len(pts))
    for j, (_, _, co) in enumerate(pts):
        kd.insert(co, j)
    kd.balance(); seen = set(); n = 0
    for j, (o, i, co) in enumerate(pts):
        if j in seen:
            continue
        hits = [h for _, h, _ in kd.find_range(co, tol)]
        seen.update(hits)
        if len(hits) < 2:
            continue
        acc = collections.Counter()
        for h in hits:
            for g, x in rb.vertex_weights(pts[h][0], pts[h][1]).items():
                acc[g] += x / len(hits)
        top = dict(acc.most_common(4)); t = sum(top.values())
        for h in hits:
            rc.set_weights(pts[h][0], pts[h][1], {g: x / t for g, x in top.items()})
        n += 1
    for o in objs:
        rc.finalize_weights(o)
    return n


# layers + springs (spring_layers.py): cape L/B/R chains on layer 0 (ring-linked); the ears get a stiff light spring
# (small flop when the head moves), no collision. Auto radii spine_02 0.144 / pelvis 0.127 reached back into the cape's
# inner lining (y ~0.11 behind the back) -> 0.11 by hand
EAR_SPRING = dict(enabled=True, collide=False, stiffness=2.5, drag=0.5, gravity=0.0, hitRadius=0.02, endLength=0.02, wind=0.2)
SPRING = dict(collections={'Cape': ['robe_cape_'], 'Ears': ['ear_']}, radius={'spine_02': 0.11, 'pelvis': 0.11},
              extra_chains=[dict(root='ear_L_01', **EAR_SPRING), dict(root='ear_R_01', **EAR_SPRING)])
