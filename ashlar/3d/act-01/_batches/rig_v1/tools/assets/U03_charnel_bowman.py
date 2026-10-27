"""U03 Charnel Bowman A (wave 2). 0.95H = 1.71 m. Skeleton archer from separate bone pieces, torn cloak from the shoulders to
the knees (open in front), green loincloth, quiver diagonal on the back with arrows above the left shoulder.
Stage-0: body pieces centred on x +0.054 (skull 0.066, legs 0.055) while the arm tips are symmetric about 0 (hands 0,
forearms 0.013, upper arms 0.04) -> arm islands ramp +0.054 with |x - c| 0.15..0.60, then all centred.
Islands: 4 skull, 6 jaw, 27 neck vertebrae, 2 ribcage, 15 spine, 10 pelvis, 56/82 femurs, 60/89 shins, feet bits,
59/90 upper arms, 80/108 forearms, 81/109 hands, 12 cloak, 20 loincloth, quiver + straps + arrows = the back islands
(found in s2_attrs).
"""
from mathutils import Vector

GENERIC = True
HEIGHT_M = 1.71
ARMS = [59, 65, 76, 77, 79, 80, 81, 86, 87, 88, 90, 91, 108, 109]
ISL = dict(torso=[2, 15], legs=[56, 82, 60, 89], arms=[81, 109])
SYM = dict(c=0.054, ops=[('ramp', ARMS, 0.054, 0.15, 0.60)], center=True)
HEAD = dict(islands=[4, 6], cut=[], z_chin=None)
# quiver (brief: rigid, child of chest); its islands are filled in s2_attrs
ACC = {'quiver': dict(islands=[], mode='rigid', n=1, parent='chest')}
# the two ties at the crotch (18, 50) were deleted by the user in Blender (2026-10-27: 'remove the extra mesh at the crotch')
DELETE_ISL = [18, 50]
# cloak: own part (separate island, like B03's shawl), sides + back chains (brief: 2 back chains; the sides hang too)
CLOTH_ISL = {'Cloth_Cape': [12, 40]}   # 40 = strap over the shoulders, shares vertices with the cloak
# loincloth kept inside Body (user preference since P02), F/B chains
# front skirt (user 2026-10-27, selected in Blender): the flap hanging in front of the thighs is joined to the spine piece
# (island 15: spine z 1.0-1.23, flap y -0.13..-0.16 from z 0.95 down to 0.5) -> its own in-Body cloth with one chain
ROBE_CUTS = {'Cloth_Robe': dict(islands=[20], z_max=2.0, in_body=True),
             'Cloth_Front': dict(islands=[15], z_max=0.97, pred=lambda c: c.y < -0.09, in_body=True)}
# loincloth: its long panel hangs between the legs just behind the femurs (y 0..0.13, z 0.28-0.95), the front is only a
# waistband; F floated under it (user: 'remove these chains, add bones for the front skirt') -> 3 chains across the
# panel (angles round a centre in front of it), 4 bones
CLOTH = {'Cloth_Robe': dict(prefix='robe_loin', chains=[('L', 150), ('C', 180), ('R', -150)], half=16, n=4, parent='pelvis',
                            center=(0.0, -0.08), edge_weights='neighbors'),
         'Cloth_Front': dict(prefix='robe_front', chains=[('F', 0)], half=80, n=4, parent='pelvis', center=(0.0, -0.02),
                             edge_weights='neighbors'),
         # user 2026-10-27 ('the back cloak bones are not right'): chains rooted at the nape ran diagonally and L/BL, R/BR
         # nearly overlapped -> only the cloak below the shoulders (z < 1.42) places them
         'Cloth_Cape': dict(prefix='robe_cloak', chains=[('L', 100), ('R', -100), ('BL', 150), ('BR', -150)], half=25, n=3,
                            parent='chest', center=(0.0, 0.0), z_top=1.42)}
LM = dict(leg_win=(-0.08, 0.05), hip_blend=(0.10, 0.06, 0.05),
          wrist_x=0.595)   # hand islands start at 0.593 (proportion put the wrist at 0.50 and the elbow at 0.34)
PUSH_KW = dict(iters=6, smooth=0.7, rounds=6)
LAYER_SKIP = ('beads', 'flap_rope')


def s2_attrs(ob, lab, isl, info):
    """Quiver = islands behind the back (y > 0 everywhere, above z 1.0) and the arrows above z 1.5; not the skull (4)."""
    V = ob.data.vertices; q = []
    for kk, c in enumerate(isl):
        if kk in (4, 6, 12, 18, 40, 50) or kk in ARMS:      # 40 went to the quiver and gapped 48 mm from the cloak
            continue
        P = [V[i].co for i in c]
        if (min(p.y for p in P) > -0.005 and min(p.z for p in P) > 1.0) or min(p.z for p in P) > 1.5:
            q.append(kk)
    ACC['quiver']['islands'] = q
    info['quiver_islands'] = len(q)


# Cape front (over the collarbones) follows the body, the back keeps the chains (as B03, user 2026-10-27)
CAPE_FRONT = dict(y=(-0.06, 0.04))


def cloth_weights_fix(parts, rig, chains, rep):
    import rigbatch as rb
    rc = rb.rc; cape = parts.get('Cloth_Cape'); nf = 0
    if cape is None:
        return
    for v in cape.data.vertices:
        f = rc.sm(CAPE_FRONT['y'][0], CAPE_FRONT['y'][1], v.co.y)
        if f < 1:
            rc.set_weights(cape, v.index, rb.blend(rc.torso_weights(v.co, rig), rb.vertex_weights(cape, v.index), f)); nf += 1
    rep['cape_front'] = dict(verts=nf, **CAPE_FRONT)


# layers + springs (spring_layers.py): loincloth panel (L/C/R) and front flap on layer 0, cloak outside them (1);
# the quiver is rigid (no spring).
SPRING = dict(collections={'Robe': ['robe_loin_', 'robe_front_'], 'Cape': ['robe_cloak_'], 'Quiver': ['quiver']},
              layers={'Cloth_Robe': 0, 'Cloth_Front': 0, 'Cloth_Cape': 1},
              chains={'quiver_01': dict(enabled=False)})
