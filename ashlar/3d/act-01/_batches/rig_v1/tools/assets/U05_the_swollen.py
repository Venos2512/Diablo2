"""U05 The Swollen A (wave 1). 0.95H = 1.71 m.
Stage-0 islands: 3 = everything (head + face, belly, arms, legs, the rag drape hanging from the shoulders around the
sides and back to z ~0.2), 7 back of the head + hair bits (small islands above 1.40), 5/34 beard tentacles from the
mouth (to z 0.93), 2 loincloth (front, below the belly), many small rag bits on the body.
Symmetry: upper body axis +0.033 (legs +0.017); arm tips symmetric about -0.0165 -> the fused arms get +0.0495
(ramp past the shoulder, only above z 1.05-1.25 so the belly is not moved), then centre.
Sections: below z 0.62 the drape hangs free of the legs (>12 cm from their axes) at the sides/back; the belly is the front.
"""
import math
GENERIC = True
HEIGHT_M = 1.71
ISL = dict(torso=[3])
SYM = dict(c=0.033, ops=[('ramp_z', [3], 0.0495, 0.30, 0.55, 1.05, 1.25)], center=True)
# head cut from island 3 above the chin, near the axis only: the T-pose arms and shoulders reach above 1.47 and were
# cut as head (head 0.3-0.6 on the shoulders and forearms: arms_down/head_turn 15-21x)
# behind the head only above the head joint (z 1.56): the nape down to 1.45 followed the head (user 2026-10-27, tilt back)
# island 7 (back of the head + hair) is cut by the same rule instead of going whole (it hangs to z 1.40 behind)
# user 2026-10-27 (side view circled): head = skull + face + jaw, above the line from the back of the skull at ear level
# (y +0.17, z 1.61) down to the throat under the jaw (y -0.11, z 1.41)
def _above_head_line(c, dz=0.0):
    return c.z > 1.61 + (c.y - 0.17) * (0.20 / 0.28) + dz


HEAD = dict(islands=[], cut=[3, 7], z_chin=1.38, pred=lambda c: abs(c.x) < 0.20 and _above_head_line(c), in_body=True)
# tentacles ~0.5 m from the mouth to z 0.93: 6 bones each (user 2026-10-27: smoother motion; was 3)
# along=True: weights by the position along the (hand-bent) bone chain, not by height (user: 'skin the tentacles properly')
ACC = {'tentacle_L': dict(islands=[34], mode='strand', bone='tentacle_L', n=6, parent='head', along=True),
       'tentacle_R': dict(islands=[5], mode='strand', bone='tentacle_R', n=6, parent='head', along=True)}
CLOTH_ISL = {'Cloth_Robe': [2]}      # loincloth shares 16 vertices with the rag drape: one part, one weight field
LEGS = []          # leg axes (x, y), measured in s2_attrs


def _rag(c):
    # not the belly (front) and not the feet: the toes reach > 0.12 in front of the ankle axis and were taken as rag, so
    # the L/FL chains ran to the floor (user 2026-10-27); the real hem stops at ~0.2
    if c.y < -0.15 or c.z < 0.16 or not LEGS:
        return False
    return min(math.hypot(c.x - x, c.y - y) for x, y in LEGS) > 0.12


ROBE_CUTS = {'Cloth_Robe': dict(islands=[3], z_max=0.62, pred=_rag, in_body=True)}   # no separate skirt part (user, P02)
# rags (user 2026-10-27 'check the rag bones'): most rag vertices hang at +-30..90 deg (front-sides, hem on the floor) with
# no chain between F (0) and L/R (75), and the side chains ran 0.68 m on 3 bones -> FL/FR at +-40, L/R at +-85, 4 bones
# FL/FR removed again (user 2026-10-27: 'remove rags FR and FL'): F, L/R 85, BL/BR 130, B, 4 bones
CLOTH = {'Cloth_Robe': dict(prefix='robe_rags', chains=[('F', 0), ('L', 85), ('R', -85), ('BL', 130), ('BR', -130), ('B', 180)],
                            half=25, n=4, parent='pelvis', center='pelvis', edge_weights='neighbors')}   # rag edge = weights of the leg/foot it touches
# no SLEEVE_GEO: without the sleeve chains its labels only forced the drape beside the armpit to arm 1 next to spine 1
# (arms_down 19.6x)
# no SLEEVES chain: the user removed the under-arm drape chains on P05 ("remove these bones")
LM = dict(neck_half_w=0.07, leg_win=(-0.08, 0.05), neck_mode='band', head_band=0.10,
          hip_blend=(0.10, 0.06, 0.05))   # soft crotch (F01/P05/B03)
PUSH_KW = dict(iters=6, smooth=0.7, rounds=6)
LAYER_SKIP = ('beads', 'flap_rope')


def s2_attrs(ob, lab, isl, info):
    m = ob.data
    near = [kk for kk, c in enumerate(isl) if kk not in (2, 3, 5, 7, 34) and min(m.vertices[i].co.z for i in c) > 1.40
            and max(abs(m.vertices[i].co.x) for i in c) < 0.25]   # rag bits on the shoulders/arms are not head
    # hair bits that hang below the head joint (down the nape) blend head -> skin instead of riding the head whole
    hang = [kk for kk in near if any(not _above_head_line(m.vertices[i].co, -0.02) for i in isl[kk])]
    HEAD['islands'] = [kk for kk in near if kk not in hang]
    ACC['hair'] = dict(islands=hang, mode='blend_head', head_frac=0.5)
    info['hair_hang_islands'] = len(hang)
    LEGS.clear()
    for s in (1, -1):
        P = [m.vertices[i].co for i in isl[3] if m.vertices[i].co.z < 0.25 and s * m.vertices[i].co.x > 0.03]
        LEGS.append(((min(p.x for p in P) + max(p.x for p in P)) / 2, (min(p.y for p in P) + max(p.y for p in P)) / 2))
    info['legs'] = [tuple(round(v, 3) for v in a) for a in LEGS]; info['head_islands'] = len(HEAD['islands'])


# The belly hangs to z ~0.5 in front of the thighs: the skill gave it L_Thigh 1 | R_Thigh 1 split at x 0 (walk 62x, kick 78x,
# sit 81x). Belly = Body (not the in-body rags) in front of y belly_y[0] below the hips -> torso weights, ramped in over
# belly_y; it is the pelvis's mass, not the legs'.
BELLY = dict(y=(-0.10, -0.18), z=(0.40, 0.98), z_ramp=(0.40, 0.56))   # bottom of the belly meets the knees: ramp


def body_weights_fix(body, rig, rep):
    import rigbatch as rb
    rc = rb.rc; V = body.data.vertices; d = BELLY; n = 0
    ac = body.data.attributes.get('rb_cloth')
    for v in V:
        c = v.co
        if not (d['z'][0] < c.z < d['z'][1]) or (ac is not None and ac.data[v.index].value):
            continue
        f = rc.sm(d['y'][0], d['y'][1], c.y) * rc.sm(d['z_ramp'][0], d['z_ramp'][1], c.z)
        if f > 0:
            rc.set_weights(body, v.index, rb.blend(rb.vertex_weights(body, v.index), rc.torso_weights(c, rig), f)); n += 1
    rep['belly'] = dict(verts=n, **d)
    # rag hems and skin hanging beside the legs outside the rag cut (within 0.18 of a leg axis) got torso = pelvis 1
    # next to Foot/Calf 1 (kick 53x, sit 46x): they follow the leg on their side
    B = rig.data.bones; m_ = 0
    legs = {s_: [(B[f'{s_}_Thigh'].head_local, B[f'{s_}_Thigh'].tail_local), (B[f'{s_}_Calf'].head_local, B[f'{s_}_Calf'].tail_local),
                 (B[f'{s_}_Foot'].head_local, B[f'{s_}_Foot'].tail_local)] for s_ in 'LR'}
    def segd(p, sg):
        out = 1e9
        for a_, b_ in sg:
            ab = b_ - a_; t = max(0.0, min(1.0, (p - a_).dot(ab) / max(ab.length_squared, 1e-12))); out = min(out, (p - (a_ + ab * t)).length)
        return out
    for v in V:
        c = v.co
        if c.z > 0.60 or (ac is not None and ac.data[v.index].value):
            continue
        w = rb.vertex_weights(body, v.index)
        tor = sum(x for g, x in w.items() if g in ('pelvis', 'spine_01', 'spine_02', 'chest'))
        if tor < 0.5 and sum(w.values()) > 1e-6:        # empty = finalize would make it pelvis 1
            continue
        s_ = 'L' if c.x > 0 else 'R'; dd = segd(c, legs[s_]); f = rc.sm(0.18, 0.10, dd)
        if f > 0:
            rc.set_weights(body, v.index, rb.blend(w, rc.leg_weights(c, rig), f)); m_ += 1
    rep['hem_to_leg'] = m_


# Arm band: the stage made all of |x| > shoulder + 0.20 above shoulder - 0.35 arm, i.e. the coat hanging below the arm
# to z ~1.0 (forearm 1 next to spine 1 at z 1.06: arms_down 23x). As P05 (where the user wanted the drape off the
# arm): arm = within r_one of the UpperArm/ForeArm/Hand segments; torso = lower than `below` under the shoulder joint
# and farther than r_zero from them; the rest blends harmonically.
ARM_BAND = dict(r_one=0.11, r_zero=0.20, below=0.22)


def arm_band(body, rig, band, ones, zeros, rep):
    V = body.data.vertices; B = rig.data.bones; d = ARM_BAND
    segs = []
    for s_ in 'LR':
        for n in (f'{s_}_UpperArm', f'{s_}_ForeArm', f'{s_}_Hand'):
            segs.append((B[n].head_local, B[n].tail_local))
    def dist(p):
        best = 1e9
        for a_, b_ in segs:
            ab = b_ - a_; t = max(0.0, min(1.0, (p - a_).dot(ab) / max(ab.length_squared, 1e-12)))
            best = min(best, (p - (a_ + ab * t)).length)
        return best
    zl = B['L_UpperArm'].head_local.z - d['below']
    ones2, zeros2 = [], []; z0 = set(zeros)
    for i in band:
        c = V[i].co; r = dist(c)
        if r < d['r_one']:
            ones2.append(i)
        elif i in z0 or (c.z < zl and r > d['r_zero']):
            zeros2.append(i)
    rep['arm_band'] = dict(ones=len(ones2), zeros=len(zeros2), free=len(band) - len(ones2) - len(zeros2), was=dict(ones=len(ones), zeros=len(zeros)))
    return ones2, zeros2


# layers + springs (spring_layers.py): rags (6 chains, in Body) and the two tentacles (6 bones, heavy flesh: stiffer and
# less gravity than the strand preset 0.8/0.8, they already hang down at rest).
_TENT = dict(stiffness=1.2, drag=0.4, gravity=0.4, wind=0.2, hitRadius=0.04)
SPRING = dict(collections={'Robe': ['robe_rags_'], 'Tentacle': ['tentacle_']},
              chains={'tentacle_L_01': _TENT, 'tentacle_R_01': _TENT},
              # auto radii swallowed the body (pelvis 0.47, thighs 0.26-0.29, one knee 0.31): belly + rags in Body. Skin
              # measured: belly y -0.41..+0.39, x +-0.48 at z 0.85 while the spine bones sit at y +0.08..+0.14; calf
              # half-width 0.07 at z 0.3. Body shapes moved to the belly centre, a bit inside the skin.
              colliders=[dict(bone='pelvis', type='sphere', shift=(0, -0.10, 0.10), radius=0.36),
                         dict(bone='spine_01', type='capsule', shift=(0, -0.11, 0), radius=0.33),
                         dict(bone='spine_02', type='capsule', shift=(0, -0.05, 0), radius=0.27),
                         dict(bone='L_Thigh', type='capsule', radius=0.11), dict(bone='R_Thigh', type='capsule', radius=0.11),
                         dict(bone='L_Calf', type='capsule', radius=0.07), dict(bone='R_Calf', type='capsule', radius=0.07),
                         dict(bone='L_Calf', type='sphere', at=0.1, radius=0.09), dict(bone='R_Calf', type='sphere', at=0.1, radius=0.09)])
