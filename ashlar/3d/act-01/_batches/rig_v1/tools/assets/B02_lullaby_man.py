"""B02 Lullaby Man A (wave 2). User 2026-10-27 (G1): hood peak = 2.2H = 3.96 m -> mesh (cage spire tip) 4.686 m,
k from the body (3.96 m) = 2.2.
Tall sewn nurse: one fused island 0 = robe (bell hem on the floor, |x| to 1.09) + torso + bare arms (T-pose z ~3.28,
hand tips |x| 1.79) + wide bell sleeves (x 0.40-1.0, hanging to z ~2.4) + face sack + hood (chin ~3.38, corners 3.96).
Cage-cradle on the back (rigid): 4 (three cocoons), 15/31/16/32 posts, 5/6/7 rings, 2 roof, 9-12 finials, 17/33 struts.
13/28 hood lappets over the chest (z 2.75-3.70), 18/34 cloth strips hanging from the cage bottom (z 3.26 -> 1.55) with
19/35 knots and 20/21/36 bits, 8 belt, 3 buckle, 1 chest ring, 24-27/29 rivets, 22/23/37/38 sleeve-tip bits,
14/30 shoe tips poking out at the front hem (y -1.32..-0.64): NO leg mesh.
Symmetry: torso/cage axis +0.0587, arms (hand tips, wrists) symmetric about 0 -> L arm 12 cm short.
Brief: robe F/L/B/R instead of legs, cage rigid, ribbons as chains.
"""
GENERIC = True
HEIGHT_M = 4.686
K_HEIGHT = 3.96
ISL = dict(torso=[0], legs=[14, 30], arms=[])
# arms + sleeves (|x - c| beyond 0.40, ramp to 0.70) move with the torso offset; only above z 2.0-2.3 (the robe below
# reaches |x| 1.09 at the hem). After centring the arms keep their x and the torso is on 0.
SYM = dict(c=0.0587, ops=[('ramp_z', [0], 0.0587, 0.40 / 2.2, 0.70 / 2.2, 2.0, 2.3)], center=True)
# head = face sack + hood above the chin near the axis; kept in Body (user, P05)
HEAD = dict(islands=[], cut=[0], z_chin=3.38, pred=lambda c: abs(c.x) < 0.27 or c.z > 3.50, in_body=True)   # 0.40 took the hood mantle on the shoulders
# robe below the belt kept inside Body (user preference since P02); the hanging sleeves (|x| > 0.45 above z 2.25) are not robe
ROBE_CUTS = {'Cloth_Robe': dict(islands=[0], z_max=2.40, in_body=True, pred=lambda c: c.z < 2.25 or abs(c.x) < 0.45)}
CLOTH = {'Cloth_Robe': dict(prefix='robe_lullaby', chains=[('F', 0), ('L', 90), ('B', 180), ('R', -90)], half=30, n=4,
                            parent='pelvis', center='pelvis', edge_weights='neighbors')}
CAGE_ISL = [4, 15, 31, 16, 32, 5, 6, 7, 2, 9, 10, 11, 12, 17, 33]
ACC = {'cage': dict(islands=CAGE_ISL, mode='rigid', n=1, parent='chest'),
       'lappet_L': dict(islands=[13], mode='strand', n=3, parent='head'),
       'lappet_R': dict(islands=[28], mode='strand', n=3, parent='head'),
       'ribbon_L': dict(islands=[18, 19, 20, 21], mode='strand', n=3, parent='cage_01'),
       'ribbon_R': dict(islands=[34, 35, 36], mode='strand', n=3, parent='cage_01')}
LM = dict(H_body=3.96, torso_half_w=0.31, wrist_x=1.36, arm_axis=(0.0, 3.28), arm_z_min=3.15,
          neck_mode='band', head_band=0.10, leg_win=(-0.08, 0.05),
          arm_mask_x=0.25, arm_mask_z=2.30,
          # no leg mesh: slim legs, shoe-size foot (the auto radii would catch the robe)
          leg_radii=dict(thigh_r=0.19, knee_r=0.15, calf_r=0.13, foot_r=0.17))
PUSH_KW = dict(iters=6, smooth=0.7, rounds=6)
LAYER_SKIP = ('beads', 'flap_rope')


def landmarks_fix(L, parts, notes):
    """No leg mesh: hips by body proportion (H_body 3.96), feet from the shoe-tip islands 14/30 (the robe hem is in the
    low z band, so the skill's leg/foot search reads the hem). Shoe tips y -1.32..-0.64, centres |x| 0.31: ankle above
    the back third, ball at 70 %, toe at the tip; knee on the hip -> ankle line, pre-bent forward."""
    import rigbatch as rb
    body = parts['Body']; ai = body.data.attributes['rb_isl']; V = body.data.vertices
    Hb = 3.96
    for isl_id, Pn, sg in ((14, 'L', 1), (30, 'R', -1)):
        F = [V[i].co.copy() for i in range(len(V)) if ai.data[i].value == isl_id]
        if not F:
            continue
        fx = (min(p.x for p in F) + max(p.x for p in F)) / 2
        yb, yf = max(p.y for p in F), min(p.y for p in F)
        ank = rb.Vector((fx, yb - 0.15 * (yb - yf), 0.053 * Hb))
        toe = rb.Vector((fx, yf, 0.011 * Hb))
        ball = rb.Vector((fx, ank.y + 0.70 * (yf - ank.y), 0.017 * Hb))
        hip = rb.Vector((sg * 0.05 * Hb, L['pelvis'][1], 0.517 * Hb))
        t = (hip.z - 0.267 * Hb) / (hip.z - ank.z)
        kn = hip.lerp(ank, t); kn.y -= 0.006 * Hb
        for kk, v in (('hip', hip), ('knee', kn), ('ankle', ank), ('ball', ball), ('toe', toe)):
            L[Pn + '_' + kk] = tuple(round(x, 4) for x in v)
    for kk in ('hip', 'knee', 'ankle', 'ball', 'toe'):
        if 'L_' + kk in L:
            L[kk] = L['L_' + kk]
    notes.append('legs: hips by proportion, feet from shoe islands 14/30 (no leg mesh)')
    # hunched: the face sack hangs forward of the shoulders (chin y -0.46 z 3.41, nape y ~0.05), the back rises to z ~3.5
    # under the hood. Measured neck base 3.20 was below the arm line (3.28) and the clavicles ran up -> set by hand.
    L['neck'] = (0.0, 0.0, 3.30); L['head'] = (0.0, -0.25, 3.50)
    L['clav_in'] = (L['clav_in'][0], 0.0, 3.25)
    notes.append('neck/head set by hand (hunched, face sack forward of the shoulders)')


# user 2026-10-28 (head posed, circled the hood back over the nape: "head takes too much of the neck"): the head band
# and the Head cut gave head 0.4-1.0 to the hood drape behind the nape (y -0.1..+0.3, z 3.2-3.5). Head weight is capped:
# full above z HEAD_MASK['z_top'] ramp, or in front of y HEAD_MASK['y'] above HEAD_MASK['z_front']; what is taken off
# goes to the neck (as P07).
# user 2026-10-28 round 2 (head down, circled the hood back panel behind the face, y -0.1..0, z 3.45-3.85): still all head
# above z 3.45 -> the mask is front/back now: head only in front of y -0.20..-0.06; the crown (z 3.78-3.90) keeps the hood shape
# round 3 (head rolled, arrows at the throat under the chin and the mantle beside the face at shoulder height): the head
# band left head 0.3-1.0 below the cut (z < 3.44) -> below z 3.42-3.50 only the chin tip of the face sack (y < -0.30..-0.38)
# stays head, and below z 3.50-3.60 only the middle (|x| < 0.18..0.26)
HEAD_MASK = dict(z_top=(3.78, 3.90), y=(-0.20, -0.06), z_front=(3.42, 3.50), x=(0.18, 0.26), x_z=(3.50, 3.60),
                 chin_y=(-0.30, -0.38), chin_z=(3.30, 3.36))


def _head_mask(part, rep, key):
    import rigbatch as rb
    rc = rb.rc; n = 0; m = HEAD_MASK
    for v in part.data.vertices:
        c = v.co
        fx = max(1 - rc.sm(m['x'][0], m['x'][1], abs(c.x)), rc.sm(m['x_z'][0], m['x_z'][1], c.z))
        f = max(rc.sm(m['z_top'][0], m['z_top'][1], c.z),
                (1 - rc.sm(m['y'][0], m['y'][1], c.y)) * rc.sm(m['z_front'][0], m['z_front'][1], c.z) * fx,
                rc.sm(m['chin_y'][0], m['chin_y'][1], c.y) * rc.sm(m['chin_z'][0], m['chin_z'][1], c.z) * fx)
        w = rb.vertex_weights(part, v.index); h = w.get('head', 0.0)
        if h > f + 1e-4:
            w['head'] = f; w['neck'] = w.get('neck', 0.0) + h - f
            rc.set_weights(part, v.index, {k_: x for k_, x in w.items() if x > 1e-4}); n += 1
    rep[key] = n


def body_weights_fix(body, rig, rep):
    import stages
    parts = stages.parts_by_role()
    _head_mask(body, rep, 'head_mask_body')
    if parts.get('Head') is not None:
        _head_mask(parts['Head'], rep, 'head_mask_head')


# user 2026-10-28: spring bones for the hanging part of the bell sleeves -> sleeve_L/R (2 bones, child of UpperArm, the
# stage's SLEEVES chains). Sleeve = island 0 between |x| 0.42 and 1.05 (the bare forearm/hand start at ~1.0; the stage's
# SLEEVE_GEO has no x_max, so s2_attrs clears beyond it), z 2.30-3.40, + the sleeve-tip bits 22/23/37/38. The whole
# sleeve still follows the arm (chain under UpperArm); the chain takes over below z 3.15 -> 2.93.
SLEEVE_GEO = dict(islands=[0, 22, 23, 37, 38], x_min=0.42, z_min=2.30, z_max=3.40)
SLEEVE_X_MAX = 1.05
SLEEVES = dict(z_top=3.15)


def s2_attrs(ob, lab, isl, info):
    a = ob.data.attributes.get('rb_sleeve')
    if a is None:
        return
    n = 0
    for v in ob.data.vertices:
        if a.data[v.index].value and abs(v.co.x) > SLEEVE_X_MAX:
            a.data[v.index].value = 0; n += 1
    info['sleeve_cleared_beyond_x'] = n


# layers + springs (spring_layers.py), user "ok, làm tiếp" 2026-10-28. Robe F/L/B/R in Body; sleeves; hood lappets (head),
# cage ribbons (cage_01); the cage is rigid (no spring). Robe/sleeves/hood in Body inflate every auto radius -> by hand:
# torso under the robe ~+-0.30 at the belt (pelvis 2.13 sits in the bell), chest 0.22 keeps clear of the lappets
# (y -0.23..-0.47 in front of the chest bone at y 0), bare forearm r ~0.05 -> upper arm 0.08.
# 2.4 m floor-length robe: stiffness x1.5, gravity 0.25 (P02: sagged 7.8 cm at rest with the defaults).
SPRING = dict(collections={'Robe': ['robe_lullaby_'], 'Sleeves': ['sleeve_'], 'Cage': ['cage_'], 'Lappets': ['lappet_'],
                           'Ribbons': ['ribbon_']},
              radius={'pelvis': 0.30, 'spine_01': 0.26, 'spine_02': 0.24, 'chest': 0.22,
                      'L_UpperArm': 0.08, 'R_UpperArm': 0.08, 'L_Calf': 0.13, 'R_Calf': 0.13},   # calf: auto 0.079 from 8 shoe verts
              chains={'cage_01': dict(enabled=False),
                      'lappet_L_01': dict(stiffness=1.0, drag=0.35, gravity=0.5, wind=0.8),
                      'lappet_R_01': dict(stiffness=1.0, drag=0.35, gravity=0.5, wind=0.8),
                      'ribbon_L_01': dict(stiffness=0.9, drag=0.35, gravity=0.6, wind=1.0),
                      'ribbon_R_01': dict(stiffness=0.9, drag=0.35, gravity=0.6, wind=1.0),
                      'robe_lullaby_F_01': dict(stiffness=2.25, gravity=0.25), 'robe_lullaby_L_01': dict(stiffness=2.4, gravity=0.25),
                      'robe_lullaby_R_01': dict(stiffness=2.4, gravity=0.25), 'robe_lullaby_B_01': dict(stiffness=2.55, gravity=0.25)})
