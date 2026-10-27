"""B03 Ember-Pot A (wave 1). Mesh top (brick crown) ~1H = 1.80 m; body to the top of the iron band ~1.60 m
(design: the crown adds ~0.13 of the full height) -> proportions and k from 1.60. Symmetric (no fix).
Stage-0 islands: 9 head (mask, iron band, brick crown) + 7/8/10/11/14/26/27 rivets, 0 scarf + shawl over the shoulders
and back, 4 back flap, 6/3 bits of that shawl (0/4/6/3 touch each other and the robe), 2 red poncho robe, 15-24 bits on
the robe, 5 trousers, 12/28 boots, 25/33 bandaged arms (separate, from the shoulder edge). Arms at z ~1.30.
"""
GENERIC = True
HEIGHT_M = 1.80
K_HEIGHT = 1.60
ISL = dict(torso=[2], legs=[12, 28], arms=[25, 33], head=[9])
SYM = dict(c=0.0, ops=[], center=False)
HEAD = dict(islands=[9, 7, 8, 10, 11, 14, 26, 27], cut=[], z_chin=None)
CLOTH_ISL = {'Cloth_Cape': [0, 4, 6, 3]}
# robe kept inside Body (user preference since P02: no separate skirt part)
ROBE_CUTS = {'Cloth_Robe': dict(islands=[2, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24], z_max=0.90, in_body=True)}
SIX = [('FL', 35), ('FR', -35), ('L', 90), ('R', -90), ('BL', 145), ('BR', -145)]
CLOTH = {'Cloth_Robe': dict(prefix='robe_poncho', chains=SIX, half=20, n=3, parent='pelvis', center='pelvis'),
         'Cloth_Cape': dict(prefix='robe_shawl', chains=[('B', 180), ('L', 110), ('R', -110)], half=25, n=3, parent='chest',
                            center=(0.0, -0.05))}
LM = dict(H_body=1.60, arm_islands_src=[25], neck_half_w=0.07, leg_win=(-0.08, 0.05),
          torso_half_w=0.22,        # arms are islands from the poncho edge (x 0.51): the skill measured half-width 0 -> shoulder x 0.036
          hip_blend=(0.10, 0.06, 0.05),   # crotch of the trousers: L_Thigh 1 next to R_Thigh 1 at x 0 tore 16-20x on walk/kick
          head_measure_zmax=1.61)   # head = mask + iron band (top ~1.60); the hollow brick crown above rides the head bone
PUSH_KW = dict(iters=6, smooth=0.7, rounds=6)
LAYER_SKIP = ('beads', 'flap_rope')


# Shoulder flaps: the shawl over each shoulder (Cloth_Cape, x 0.26-0.54, z 1.20-1.46) rode robe_shawl_L/R (children of
# chest) and stuck out level when the arms came down (user 2026-10-27: "add bones so this part folds down with the arm").
# shoulder_L/R: one bone from the top of the shoulder to the flap's edge, child of the UpperArm; the flap blends from the
# shawl chain at the neck side (x 0.24) to that bone past x 0.36.
PAD = dict(head=(0.28, 0.03, 1.43), tail=(0.54, 0.03, 1.40), x=(0.22, 0.42), z=(1.10, 1.26))   # z: ramp in (hard cut at 1.18 tore 8x)


def extra_chains(rig, parts, chains, L):
    import rigbatch as rb
    from mathutils import Vector
    for s, sg in (('L', 1), ('R', -1)):
        h, t = PAD['head'], PAD['tail']
        chains[f'shoulder_{s}'] = rb.rc.add_chain(rig, f'shoulder_{s}', [Vector((sg * h[0], h[1], h[2])), Vector((sg * t[0], t[1], t[2]))],
                                                  f'{s}_UpperArm')


# Cape front (scarf round the neck + the V over the chest) follows the body bones; only the back keeps the spring chains
# (user 2026-10-27). Torso weights in front of y_front[0], blending to the chain weights by y_front[1].
CAPE_FRONT = dict(y=(-0.06, 0.04))


def cloth_weights_fix(parts, rig, chains, rep):
    import rigbatch as rb
    rc = rb.rc; cape = parts.get('Cloth_Cape'); n = 0; nf = 0
    if cape is None:
        return
    for v in cape.data.vertices:
        f = rc.sm(CAPE_FRONT['y'][0], CAPE_FRONT['y'][1], v.co.y)          # 0 front (body) .. 1 back (chains)
        if f < 1:
            rc.set_weights(cape, v.index, rb.blend(rc.torso_weights(v.co, rig), rb.vertex_weights(cape, v.index), f)); nf += 1
    rep['cape_front'] = dict(verts=nf, **CAPE_FRONT)
    for v in cape.data.vertices:
        c = v.co
        f = rc.sm(PAD['x'][0], PAD['x'][1], abs(c.x)) * rc.sm(PAD['z'][0], PAD['z'][1], c.z)
        if f > 0:
            b = chains['shoulder_L' if c.x > 0 else 'shoulder_R'][0]
            rc.set_weights(cape, v.index, rb.blend(rb.vertex_weights(cape, v.index), {b: 1.0}, f)); n += 1
    rep['shoulder_flaps'] = dict(verts=n, **PAD)


# layers + springs (spring_layers.py): poncho (in Body, layer 0) and shawl (Cape part, layer 1) chains with the presets;
# the shoulder flap bones follow the arm (no spring), own collection.
SPRING = dict(collections={'Robe': ['robe_poncho_'], 'Cape': ['robe_shawl_'], 'Shoulder': ['shoulder_']},
              # poncho in Body inflates the auto radii (pelvis 0.34, spine 0.31/0.36); hips ~0.30 half-width (trousers at z 0.55);
              # legs stay auto (baggy trousers: thigh 0.17 is real, boots 0.10)
              # body colliders (user 2026-10-27: "check the body colliders"): the spine bones sit near the back (y +0.07..+0.11,
              # the shawl pulled the section centre back) while the torso runs y -0.30 (poncho front) .. +0.22 (back): the
              # shapes stuck out of the back and left the belly empty -> moved forward to the torso centre, r 0.22 inside the cloth
              colliders=[dict(bone='pelvis', type='sphere', shift=(0, -0.12, 0), radius=0.22),
                         dict(bone='spine_01', type='capsule', shift=(0, -0.13, 0), radius=0.22),
                         dict(bone='spine_02', type='capsule', shift=(0, -0.14, 0), radius=0.22),
                         dict(bone='L_Thigh', type='capsule'), dict(bone='R_Thigh', type='capsule'),
                         dict(bone='L_Calf', type='capsule'), dict(bone='R_Calf', type='capsule'),
                         dict(bone='L_Calf', type='sphere', at=0.1, fit=0.8), dict(bone='R_Calf', type='sphere', at=0.1, fit=0.8)])
