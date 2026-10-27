"""P02 Hush-Herald A (wave 1). Hood peak 1.22H = 2.196 m; body (soles to the head top inside the hood) ~1.757 m.
Stage-0 islands: 0 robe + body + trumpet sleeves (floor length, layered tiers), 2 cone hood with its front bib down to
the chest (z 1.25), 1 face veil in front of the face (z 1.36-1.88, does not touch the robe panel below it),
4/6 forearm + hand, 3/5 feet (NO leg mesh). Symmetry: body axis +0.025; hand tips symmetric about 0 -> hands +0.025.
No face/neck to measure: hood cut at 1.60 (cone = Head, bib = Body with a head band), veil blends head -> skin.
"""
GENERIC = True
HEIGHT_M = 2.196
K_HEIGHT = 1.757
ISL = dict(torso=[0], legs=[3, 5], arms=[4, 6])
SYM = dict(c=0.025, ops=[('shift', [4, 6], 0.025)], center=True)
HEAD = dict(islands=[], cut=[2], z_chin=1.60)
ACC = {'veil': dict(islands=[1], mode='strand', bone='veil', n=3, parent='head')}   # user: 3-bone chain for the face veil
# robe: below z 1.00 the whole robe (its flared tiers pass |x| 0.40 near the floor and were left in Body with leg
# weights), 1.00-1.05 only |x| < 0.40; small loose islands on it go with it.
def _robe(c):
    return c.z < 1.00 or abs(c.x) < 0.40


ROBE_CUTS = {'Cloth_Robe': dict(islands=[0], z_max=1.05, pred=_robe, absorb_small=400, in_body=True)}   # user: robe stays in Body
SIX = [('FL', 35), ('FR', -35), ('L', 90), ('R', -90), ('BL', 145), ('BR', -145)]
CLOTH = {'Cloth_Robe': dict(prefix='robe_herald', chains=SIX, half=20, n=4, parent='pelvis', center='pelvis')}
SLEEVE_GEO = dict(islands=[0], x_min=0.32, z_min=1.00, z_max=1.47, detach_z=1.47)   # trumpet sleeves fused to the robe side
SLEEVES = dict(z_top=1.47)
LM = dict(H_body=1.757, legs_from_feet=True, arm_islands_src=[4], arm_axis=(-0.05, 1.535), neck_mode='band',
          neck_half_w=0.07, leg_win=(-0.08, 0.05), head_band=0.10,
          # arms inside one island with the robe: the auto torso walk gave 0 -> body-proportion shoulder 0.175 (hw 0.14);
          # wrist: sleeve ends ~0.68, hand from 0.70 (palm widest 0.80-0.82, tips 0.91) -> 0.705
          torso_half_w=0.14, wrist_x=0.705,
          # no leg mesh: the auto radii caught the robe tiers (thigh 0.23, calf 0.21) -> slim legs, shoe-size foot
          leg_radii=dict(thigh_r=0.085, knee_r=0.07, calf_r=0.06, foot_r=0.08))
PUSH_KW = dict(iters=6, smooth=0.7, rounds=6)
LAYER_SKIP = ('beads', 'flap_rope')

# springs: robe in Body inflates the auto hip/waist radii; the face veil hangs in front of the face -> head sphere behind it.
SPRING = dict(radius={'pelvis': 0.14, 'spine_01': 0.13, 'spine_02': 0.13, 'chest': 0.14, 'L_Calf': 0.06, 'R_Calf': 0.06,
                      'L_UpperArm': 0.06, 'R_UpperArm': 0.06},   # robe/bib/sleeves in Body inflate every auto radius
              extra_colliders=[dict(bone='head', type='sphere', offset=[0.0, 0.08, 0.0], radius=0.10)],
              # floor-length flared robe sagged 7.8 cm at rest (gravity only): stiffness x1.5, gravity 0.25 -> 4 cm
              chains={'veil_01': dict(stiffness=1.0, drag=0.35, gravity=0.5, wind=0.8, hitRadius=0.03),
                      'robe_herald_FL_01': dict(stiffness=2.25, gravity=0.25), 'robe_herald_FR_01': dict(stiffness=2.25, gravity=0.25),
                      'robe_herald_L_01': dict(stiffness=2.4, gravity=0.25), 'robe_herald_R_01': dict(stiffness=2.4, gravity=0.25),
                      'robe_herald_BL_01': dict(stiffness=2.55, gravity=0.25), 'robe_herald_BR_01': dict(stiffness=2.55, gravity=0.25)})
