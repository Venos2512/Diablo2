"""F02 Poppy Nurse A (wave 1). Wimple top 1.08H = 1.944 m; head top ~1.83 (body height for proportions and k).
Stage-0 islands: 2 bodice + trumpet sleeves, 4 face, 9/11-15 eyes/brows, 3 coif (wraps the face and the neck down
to the chest, touches 2), 5 wimple, 8 sash, 17/19 forearm + hand, 16/18 shoes (NO leg mesh), 1 floor-length skirt,
6 front apron, 0 left-back panel, 7 right-back panel, 10 back strip (cloth layers do not touch each other).
Symmetry: body (face, coif, wimple, skirt, shoes) axis +0.057; hand tips symmetric about 0 (right arm reaches
11.4 cm further); sleeve ends symmetric about +0.040 -> sleeves +0.017 (ramp), hands +0.057 (rigid), then centre.
Chin 1.66.
"""
GENERIC = True
HEIGHT_M = 1.944
K_HEIGHT = 1.83
ISL = dict(torso=[2], legs=[16, 18], arms=[17, 19], head=[4])
SYM = dict(c=0.057, ops=[('ramp', [2], 0.017, 0.30, 0.55), ('shift', [17, 19], 0.057)], center=True)
HEAD = dict(islands=[4, 5, 9, 11, 12, 13, 14, 15], cut=[3], z_chin=1.66)
CLOTH_ISL = {'Cloth_Skirt': [1], 'Cloth_Apron': [6], 'Cloth_PanelL': [0], 'Cloth_PanelR': [7], 'Cloth_Strip': [10]}
ACC = {'sash': dict(islands=[8], mode='follow')}
SIX = [('FL', 35), ('FR', -35), ('L', 90), ('R', -90), ('BL', 145), ('BR', -145)]
# skirt: 6 chains left a 70 deg chord at the front: the spring layer surface (chords between chains) ran ~5 cm inside the
# skirt mesh, so the apron (layer 1) sank into the skirt in motion (user, editor Spring). + centre chains F/B (35 deg chords).
EIGHT = SIX + [('F', 0), ('B', 180)]
CLOTH = {'Cloth_Skirt': dict(prefix='robe_skirt', chains=EIGHT, half=17, n=4, top_follow=0.08),
         'Cloth_Apron': dict(prefix='apron_front', chains=[('FL', 25), ('FR', -25)], half=30, n=3, top_follow=0.08),
         'Cloth_PanelL': dict(prefix='flap_panelL', chains=[('A', 100), ('B', 150)], half=30, n=3, top_follow=0.08),
         'Cloth_PanelR': dict(prefix='flap_panelR', chains=[('A', -100), ('B', -150)], half=30, n=3, top_follow=0.08),
         'Cloth_Strip': dict(prefix='flap_strip', chains=[('B', 180)], half=40, n=3, top_follow=0.08)}
SLEEVE_GEO = dict(islands=[2], x_min=0.32, z_min=1.00, z_max=1.44)
SLEEVES = dict(z_top=1.44)
LM = dict(H_body=1.83, legs_from_feet=True, arm_islands_src=[17], arm_axis=(-0.09, 1.49), neck_half_w=0.075,
          neck_mode='band', leg_win=(-0.08, 0.05), head_band=0.16,      # coif band 10 -> 16 cm: head_turn 4.73x -> 2.37x
          # no leg mesh: the auto radii measured the shoes (calf 0.103) -> slim human legs for the skirt push
          leg_radii=dict(thigh_r=0.085, knee_r=0.07, calf_r=0.06, foot_r=0.085))   # foot = the shoe (auto 0.082)
PUSH_KW = dict(iters=6, smooth=0.85, rounds=8)
LAYER_SKIP = ('beads', 'flap_rope')

# springs: skirt layer 0; apron + side/back panels lie on it (1); the back strip lies on the panels (2) - s5 layer pairs
SPRING = dict(layers={'Cloth_Skirt': 0, 'Cloth_Apron': 1, 'Cloth_PanelL': 1, 'Cloth_PanelR': 1, 'Cloth_Strip': 2},
              radius={'pelvis': 0.14, 'spine_01': 0.13})     # hips/waist are inside the skirt: nothing to measure
