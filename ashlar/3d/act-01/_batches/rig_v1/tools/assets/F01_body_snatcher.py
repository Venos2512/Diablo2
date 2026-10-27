"""F01 Body-Snatcher A (wave 1). ~1H = 1.80 m. Stage-0 islands (importer weld):
2 hood + face + shirt + sleeves (one piece), 3 smock skirt, 0/11 bits sewn to the skirt, 4 trousers, 10/17 boots,
12/20 forearm + hand, 1 rope looped over the shoulders, 8/15 rope ends on the chest, 5 sash, 14 sash knot,
6/7 rope coil + 9 its hook (hanging on the right hip), 16/18/19 sash ends on the skirt, 13/21 sleeve bits.
Symmetry: body axis +0.018 everywhere, sleeves symmetric about it, forearm/hand islands symmetric about 0 (same case as U01).
Chin 1.565 (head close-up, 5 cm grid); arms at z ~1.465.
"""
GENERIC = True
HEIGHT_M = 1.80
ISL = dict(torso=[2], legs=[10, 17], arms=[12, 20])
SYM = dict(c=0.018, ops=[('ramp', [12, 20], 0.018, 0.30, 0.55)], center=True)
HEAD = dict(islands=[], cut=[2], z_chin=1.565)
CLOTH_ISL = {'Cloth_Robe': [3, 0, 11]}
ACC = {'sash': dict(islands=[5], mode='follow_uniform'),   # user joints put spine1 inside the sash: follow 6.3x on twist, torso 4.3x on bend
       'rope_shoulders': dict(islands=[1], mode='follow', strip=['head']),
       'rope_chest_L': dict(islands=[8], mode='follow_uniform'),      # bend: follow 4.6x across chest/spine_02
       'rope_chest_R': dict(islands=[15], mode='follow_uniform'),      # bend: follow 4.6x across chest/spine_02
       'sash_knot': dict(islands=[14], mode='follow_uniform'),
       'rope_coil': dict(islands=[6, 7, 9], mode='rigid', bone='rope_coil'),
       'sash_ends': dict(islands=[16, 18, 19], mode='follow_cloth', part='Cloth_Robe')}
SIX = [('FL', 35), ('FR', -35), ('L', 90), ('R', -90), ('BL', 145), ('BR', -145)]
CLOTH = {'Cloth_Robe': dict(prefix='robe_smock', chains=SIX, half=20, n=3, parent='pelvis', center='pelvis')}
SLEEVE_GEO = dict(islands=[2], x_min=0.30, z_min=1.20, z_max=1.43)
SLEEVES = dict(z_top=1.43)
# torso: the auto section walk stops on the hood drape near x 0 (0.015); side wall under the armpits 0.17-0.20 (z 1.30
# section, shirt is loose) -> 0.17 as U01. Wrist: forearm y-extent ~0.03 at x 0.58-0.62, palm widens from 0.64.
# trousers are one piece (crotch): hip_blend. Hood is layered (face skin in, cowl out): z-only head band 12 cm, none past
# 17-24 cm from the neck axis (sweep: head_turn geodesic 5.21x -> 4.08x, head_nod 3.16 -> 2.19).
LM = dict(knee_z=0.46, arm_islands_src=[12], torso_half_w=0.17, wrist_x=0.635, neck_half_w=0.07, leg_win=(-0.08, 0.05),
          head_band=0.12, head_band_mode='z', head_band_rr=(0.17, 0.24), hip_blend=(0.10, 0.06, 0.05))
PUSH_KW = dict(iters=6, smooth=0.7, rounds=6)
LAYER_SKIP = ('beads', 'flap_rope')
