"""U02 Charnel Dead A (wave 2). 0.95H = 1.71 m. Skeleton warrior built from separate bone pieces; symmetric.
Stage-0 islands: 4 = legs + pelvis + feet (one piece, z 0-1.03), 2 = ribcage + spine + both humeri (x to 0.53),
22/46 forearms (x 0.53-0.85), 23/47 hands (0.83-1.05), 5 skull, 12/24 clavicles, 13/25 iliac wings, 1 loincloth
(z 0.34-1.03), 0 torn tunic (back) + 7 its front panel, 8/9 diagonal strap, 27 right pauldron (+ 17-vert rivets),
6/11 belt buckle, 21/38 sandal straps.
"""
import collections
from mathutils import Vector

GENERIC = True
HEIGHT_M = 1.71
ISL = dict(torso=[2], legs=[4], arms=[23, 47])
SYM = dict(c=0.0, ops=[], center=False)
HEAD = dict(islands=[5], cut=[], z_chin=None)
# armour as separate rigid accessories with their own bone (user 2026-10-27: "split the pauldron, chest and back armour
# into accessories"): pauldron on the R upper arm (folds with the arm, as asked for B03's shoulder flaps), chest and back
# plates on the chest; strap and buckle still follow the skin. Pauldron rivets are added in s2_attrs.
ACC = {'pauldron': dict(islands=[27], mode='rigid', n=1, parent='R_UpperArm'),
       'chest_plate': dict(islands=[7], mode='rigid', n=1, parent='chest'),
       'back_plate': dict(islands=[0], mode='rigid', n=1, parent='chest'),
       'strap': dict(islands=[8, 9], mode='follow'), 'buckle': dict(islands=[6, 11], mode='follow')}
# loincloth kept inside Body (user preference since P02: no separate skirt part), F/B chains (brief: khố F/B)
ROBE_CUTS = {'Cloth_Robe': dict(islands=[1], z_max=2.0, in_body=True)}
CLOTH = {'Cloth_Robe': dict(prefix='robe_loin', chains=[('F', 0), ('B', 180)], half=40, n=3, parent='pelvis', center='pelvis',
                            edge_weights='neighbors')}
LM = dict(leg_win=(-0.08, 0.05), hip_blend=(0.10, 0.06, 0.05))
PUSH_KW = dict(iters=6, smooth=0.7, rounds=6)
LAYER_SKIP = ('beads', 'flap_rope')


def s2_attrs(ob, lab, isl, info):
    """Small islands (< 30 verts) inside the pauldron's box are its rivets."""
    V = ob.data.vertices; riv = []
    for kk, c in enumerate(isl):
        if len(c) >= 30 or kk in ACC['pauldron']['islands']:
            continue
        cen = sum((V[i].co for i in c), Vector()) / len(c)
        if -0.34 < cen.x < -0.10 and 1.31 < cen.z < 1.53:
            riv.append(kk)
    ACC['pauldron']['islands'] = [27] + riv
    info['pauldron_rivets'] = len(riv)


# layers + springs (spring_layers.py): loincloth F/B springs; the armour plates are rigid and do not spring.
SPRING = dict(collections={'Robe': ['robe_loin_'], 'Armor': ['pauldron', 'chest_plate', 'back_plate']},
              chains={'pauldron_01': dict(enabled=False), 'chest_plate_01': dict(enabled=False),
                      'back_plate_01': dict(enabled=False)})
