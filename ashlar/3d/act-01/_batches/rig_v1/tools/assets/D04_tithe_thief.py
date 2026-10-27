"""D04 Tithe-Thief A (wave 2). Canon 0.50H = 0.90 m (user 2026-10-27 chose canon over the sheet's 0.68H).
Hunched goblin under a huge sack: the head pokes forward (y -0.33..-0.09) under a hood that is one piece with the sack.
Stage-0 islands: 1 = head + ears, 0/13 eyes, 21/52 horns (on the hood), 2 = sack + hood (hood = y < -0.12, |x| < 0.10),
8 = tunic with short sleeves (z 0.13-0.54), 14/46 legs + feet (to z 0.35), 32/62 whole arms (x from 0.13, z 0.44-0.49),
17/51 + 22/53 + 23/54 + 26/58 shoulder straps and buckles, 20 candlestick, 49/63/4-6/16/18/47/50 jars and box on top,
7/10/25 sack bands, 39/43/65/70/66... discs hanging on the sack sides.
Brief: sack rigid (child of chest), candlestick, tunic F/B.
"""
GENERIC = True
HEIGHT_M = 0.90
ISL = dict(torso=[8], legs=[14, 46], arms=[32, 62])
SYM = dict(c=0.013, ops=[], center=True)
# head = face + eyes/teeth/horns (islands wholly in front of y -0.12 above the collar, found in s2_attrs) + the hood cut
# from the sack piece (y < -0.13); kept in Body (user, P05)
HEAD = dict(islands=[1], cut=[2], z_chin=0.40, pred=lambda c: c.y < -0.13, in_body=True)
# tunic below the hips kept inside Body (user preference since P02), F/B chains (brief)
ROBE_CUTS = {'Cloth_Robe': dict(islands=[8], z_max=0.30, in_body=True)}
CLOTH = {'Cloth_Robe': dict(prefix='robe_tunic', chains=[('F', 0), ('B', 180)], half=60, n=3, parent='pelvis',
                            center='pelvis', edge_weights='neighbors')}
# sack (rest of island 2, labelled in s2_labels) and whatever sits on it: rigid on the chest; candlestick own bone (brief)
ACC = {'sack': dict(islands=[], mode='rigid', n=1, parent='chest'),
       'candle': dict(islands=[20], mode='rigid', n=1, parent='chest')}
LM = dict(leg_win=(-0.08, 0.05), hip_blend=(0.10, 0.06, 0.05), arm_z_min=0.40)
PUSH_KW = dict(iters=6, smooth=0.7, rounds=6)
LAYER_SKIP = ('beads', 'flap_rope')
HOOD_Y = -0.13


def landmarks_fix(L, parts, notes):
    """Hunched chibi under a sack: the measured spine collapsed to the arm line and the head bone ran back into the sack.
    Set from the mesh (centred x): legs to z 0.35, arms at z 0.44-0.49 (y -0.14..-0.02) from x 0.12, sleeve openings
    at |x| 0.19; head piece z 0.44-0.63 well in front of the body (y -0.33..-0.09), hood top ~0.70."""
    S = dict(pelvis=(0.0, -0.06, 0.33), spine1=(0.0, -0.06, 0.37), spine2=(0.0, -0.065, 0.41), chest=(0.0, -0.07, 0.44),
             neck=(0.0, -0.10, 0.47), head=(0.0, -0.15, 0.50), head_top=(0.0, -0.20, 0.70),
             shoulder=(0.11, -0.08, 0.468), elbow=(0.255, -0.075, 0.468), wrist=(0.385, -0.08, 0.468))
    for k_, v in S.items():
        if k_ in L:
            L[k_] = v
    L['hand_end'] = (0.459, -0.08, 0.464)
    # hips measured at the arm line (0.465): legs reach z 0.35 under the tunic, ankles 0.05
    for s_, sg in (('L_', 1), ('R_', -1), ('', 1)):
        if s_ + 'hip' in L:
            L[s_ + 'hip'] = (sg * 0.075, -0.065, 0.32)
        if s_ + 'knee' in L:
            L[s_ + 'knee'] = (sg * 0.085, -0.075, 0.19)
    notes.append('spine/neck/head/arm joints set by hand (hunched chibi)')


# Arms are whole islands 32/62 that start inside the short tunic sleeves (|x| 0.12), so the stage's arm-island test
# (beyond shoulder + 0.05k) missed them (arm mask 170). Arm = those islands + the tunic sleeves (sleeve rule: the whole
# sleeve follows the arm): tunic above z SLEEVE['z'] beyond |x| SLEEVE['one'] is all arm, inside SLEEVE['zero'] torso.
ARM_ISL = (32, 62)
SLEEVE = dict(z=0.40, one=0.15, zero=0.10)


def is_arm(i, V, lab, torso, arm_isl, sl, shj):
    return _isl(i) in ARM_ISL or (_isl(i) == 8 and abs(V[i].co.x) > SLEEVE['zero'] and V[i].co.z > SLEEVE['z'] - 0.03)


_ISL = {}


def _isl(i):
    """Stage-0 island id of a Body vertex (rb_isl, kept by every part)."""
    if 'a' not in _ISL:
        import stages
        _ISL['a'] = stages.parts_by_role()['Body'].data.attributes['rb_isl']
    return _ISL['a'].data[i].value


def arm_band(body, rig, band, ones, zeros, rep):
    V = body.data.vertices; ones2, zeros2 = [], []
    for i in band:
        c = V[i].co
        if _isl(i) in ARM_ISL or abs(c.x) > SLEEVE['one']:
            ones2.append(i)
        elif abs(c.x) < SLEEVE['zero'] + 0.01 or c.z < SLEEVE['z']:
            zeros2.append(i)
    rep['arm_band'] = dict(ones=len(ones2), zeros=len(zeros2), free=len(band) - len(ones2) - len(zeros2))
    return ones2, zeros2


def s2_attrs(ob, lab, isl, info):
    """Head bits: islands wholly in front (y < -0.12) above the collar (z > 0.44). Sack items: islands wholly behind
    y -0.13 above z 0.25 that are not body pieces (straps/buckles reach y -0.15 in front of the chest)."""
    V = ob.data.vertices; head, sack = [], []
    named = {i for v in ISL.values() for i in v} | {1, 2, 20}
    for kk, c in enumerate(isl):
        if kk in named:
            continue
        P = [V[i].co for i in c]
        if max(p.y for p in P) < -0.12 and min(p.z for p in P) > 0.44:
            head.append(kk)
        elif min(p.y for p in P) > -0.13 and min(p.z for p in P) > 0.25:
            sack.append(kk)
    HEAD['islands'] = [1] + head
    SACK_ISL[:] = sack
    info['head_islands'] = HEAD['islands']; info['sack_islands'] = len(sack)


SACK_ISL = []


def s2_labels(ob, lab, isl, info):
    import sys, stages
    A = sys.modules[__name__]
    labels = stages.default_labels(A, ob, lab, isl)
    at = ob.data.attributes.get('rb_acc') or ob.data.attributes.new('rb_acc', 'INT', 'POINT')
    code = list(ACC).index('sack') + 1; nf = 0; items = set(SACK_ISL)
    for p in ob.data.polygons:
        kk = lab[p.vertices[0]]
        if labels[p.index] == 'Body' and (kk in items or kk == 2):
            labels[p.index] = 'Accessory'; nf += 1
            for v in p.vertices:
                at.data[v].value = code
    info['sack_faces'] = nf
    return labels


# The sack (rigid on the chest) was cut from the hood: the hood edge along the cut takes the sack bone, blending back to
# the head over SACK_BAND (geodesic), as D02's pot. User 2026-10-27 (head turned up: the hood broke at the sack edge,
# "too much skin into the sack"): 0.04 -> 0.08, the back half of the hood now eases into the sack.
SACK_BAND = 0.08
# The face piece (island 1) runs down into the collar as a thin neck (z 0.43-0.51 behind y -0.14) and was all head, so the
# collar tore when the head moved (user: "too much skin into the neck"). Head = in front of y NECK['y'] or above z
# NECK['z']; the rest is neck, easing to chest below NECK['chest'].
NECK = dict(y=(-0.14, -0.20), z=(0.50, 0.54), chest=(0.44, 0.48))


def _sack_seam(part, acc, rep, key):
    import rigbatch as rb
    rc = rb.rc
    cut = set(rb.coincident_map(part, acc)) if acc is not None else set()
    if not cut:
        return
    lbl, dist = rb.geodesic_voronoi(part, {i: i for i in cut}, lambda i: True)
    n = 0
    for i, d in dist.items():
        if d < SACK_BAND:
            rc.set_weights(part, i, rb.blend({'sack_01': 1.0}, rb.vertex_weights(part, i), rc.sm(0.0, SACK_BAND, d))); n += 1
    rep[key] = dict(cut=len(cut), band=n)


def body_weights_fix(body, rig, rep):
    import stages
    parts = stages.parts_by_role()
    acc = parts.get('Accessory')
    _sack_seam(body, acc, rep, 'sack_seam_body')
    head = parts.get('Head')
    if head is None:
        return
    import rigbatch as rb
    rc = rb.rc; ia = head.data.attributes['rb_isl']; n = 0
    for v in head.data.vertices:
        if ia.data[v.index].value != 1:
            continue
        c = v.co; fh = max(rc.sm(NECK['y'][0], NECK['y'][1], c.y), rc.sm(NECK['z'][0], NECK['z'][1], c.z))
        if fh >= 1:
            continue
        fc = 1 - rc.sm(NECK['chest'][0], NECK['chest'][1], c.z)
        low = rb.blend({'neck': 1.0}, {'chest': 1.0}, fc)
        rc.set_weights(head, v.index, rb.blend(low, {'head': 1.0}, fh)); n += 1
    rep['neck_from_face'] = n
    _sack_seam(head, acc, rep, 'sack_seam_head')


# layers + springs (spring_layers.py): tunic F/B in Body (presets); sack and candlestick are rigid (no spring).
# auto spine radii (0.115/0.117) are the tunic itself and spine_02's capsule reached the chin -> set by hand
SPRING = dict(collections={'Tunic': ['robe_tunic_'], 'Sack': ['sack_', 'candle_']},
              chains={'sack_01': dict(enabled=False), 'candle_01': dict(enabled=False)},
              radius={'spine_01': 0.10, 'spine_02': 0.085})
