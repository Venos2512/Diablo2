"""P01 The Soothed A (wave 1). 0.95H = 1.71 m. Mirror-symmetric mesh (no symmetry fix).
Stage-0 islands: 0 = everything (dress, blue outer robe with hanging sleeves, arms, hands, neck, face, cap, hair);
11/77 feet + shins; ~140 small islands touching 0 (face details, hair locks). Chin 1.48, arms at z ~1.38.
The blue sleeves hang to z ~1.0; the blue front panels to ~0.75 over the beige dress (ankles 0.19).
Head = island 0 above the chin + small islands entirely above it; hair locks crossing the chin = Accessory
(top follows the head, bottom the skin); robe = island 0 below 1.00 inside |x| < 0.26 (sleeve rags excluded).
"""
GENERIC = True
HEIGHT_M = 1.71
Z_CHIN = 1.48
ISL = dict(torso=[0], legs=[11, 77])
SYM = dict(c=0.0, ops=[], center=False)
HEAD = dict(islands=[], cut=[0], z_chin=Z_CHIN)
ACC = {'hair_L': dict(islands=[], mode='blend_head', head_frac=0.0), 'hair_R': dict(islands=[], mode='blend_head', head_frac=0.0)}   # blend over the whole lock: 7.4x on a head turn
# robe: below the sleeve tips (z 0.85) the whole dress; between 0.85 and 1.00 only |x| < 0.26 (the hanging sleeves are outside).
# The first cut (|x| < 0.26 at every height) left the wide dress sides in Body with thigh weights: 105x on a kick.
def _robe(c):
    return c.z < 0.85 or abs(c.x) < 0.26


ROBE_CUTS = {'Cloth_Robe': dict(islands=[0], z_max=1.00, pred=_robe, absorb_small=400)}   # dress patches were Body with thigh weights
SIX = [('FL', 35), ('FR', -35), ('L', 90), ('R', -90), ('BL', 145), ('BR', -145)]
CLOTH = {'Cloth_Robe': dict(prefix='robe_dress', chains=SIX, half=20, n=3, parent='pelvis', center='pelvis')}
SLEEVE_GEO = dict(islands=[0], x_min=0.26, z_min=0.85, z_max=1.32, detach_z=1.32)   # sleeves fused to the hip and robe side: detach the whole sleeve region (1.15: arms_fwd 14x, 1.32: 7.5x)
SLEEVES = dict(z_top=1.32)
# arms: one island with the robe -> the auto torso walk stopped at x 0.005; torso side wall below the armpit 0.124 (z 1.30
# section gap 0.124-0.155 to the sleeve) -> 0.13. Wrist: forearm y-width 0.05 at x 0.58-0.68, hand widens from 0.70 -> 0.695
LM = dict(neck_half_w=0.065, leg_win=(-0.08, 0.05), head_band=0.10, torso_half_w=0.13, wrist_x=0.695,
          # no thigh mesh (dress): the auto thigh radius caught the sleeve tips (0.222) and blew the dress out on a step
          leg_radii=dict(thigh_r=0.08))
PUSH_KW = dict(iters=6, smooth=0.7, rounds=6)
LAYER_SKIP = ('beads', 'flap_rope')


def s2_attrs(ob, lab, isl, info):
    m = ob.data; head, hl, hr = [], [], []
    for kk, c in enumerate(isl):
        if kk in (0, 11, 77):
            continue
        zs = [m.vertices[i].co.z for i in c]
        if min(zs) >= Z_CHIN - 0.01:
            head.append(kk)
        elif max(zs) > Z_CHIN - 0.01:
            (hl if sum(m.vertices[i].co.x for i in c) > 0 else hr).append(kk)
    HEAD['islands'] = head; ACC['hair_L']['islands'] = hl; ACC['hair_R']['islands'] = hr
    info['head_small_islands'] = len(head); info['hair_locks'] = [len(hl), len(hr)]

# springs: the loose blue coat is Body, so the auto collider radii around the hips came out 0.22 (pelvis) / 0.19 (waist) and
# would push the dress chains out at rest -> body-sized hips/waist.
SPRING = dict(radius={'pelvis': 0.14, 'spine_01': 0.13})
