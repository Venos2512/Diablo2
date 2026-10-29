"""PB Pallbearer A (hero, ashlar/3d/heroes/PB_pallbearer/vA/). User G1 2026-10-29: H 1.9 m to the helmet top (k 1.056;
GLB 0.945 m, the frame top 0.943 is level with the helmet), weapon sockets on both hands (L/R_hand_socket, child of the
hand, no deform), the coffin frame rigid (own bone, child of chest); spring: cape (L shoulder), tabard front and back,
the two bells and the lantern (short strands).
Heavy paladin in plate, T-pose facing -Y, symmetric axes (s0: all within 1 mm). Stage-0 (1.9 m, 69 islands):
5 (1649 v) = helmet + face + torso + upper arms + legs in ONE piece (z 0.09-1.90); 38/68 = L/R gauntlet (forearm + hand,
|x| from 0.527), fingers separate but the pipeline keeps one Hand bone (as OS); 37/67 elbow caps; 20/49 sabatons;
18/48 pauldrons; 15/45 shoulder straps; 14/44 hip plates; 6 = tabard front (y -0.30..-0.22, z 0.32-1.11), 3 = tabard
back (y 0.00-0.16, z 0.41-1.12); 21 = cape on the L side (x 0.20-0.50, z 0.37-1.60); frame = 0 brick panel, 1 bottom bar,
2 hanging straps, 4 top bar, 16/46 posts (all y > 0.04, z 1.04-1.90, they touch only each other); R hip: TWO bells,
52 front (+ chain 54, links 63/59) and 56 behind it (+ chain 57, links 61/62), on belt loops 51/50 (Body); L hip: lantern
22 + ring 30, chain 25, hook 27, on belt loop 19 (Body). 10/40 helmet rivets; 7/8 belt buckle; the rest studs/knee bits.
"""
GENERIC = True
HEIGHT_M = 1.9
ISL = dict(torso=[5], legs=[20, 49], arms=[38, 68])
SYM = dict(c=0.0, ops=[], center=False)
# head = helmet + face cut from island 5 above the chin inside the gorget (gorget |x| ~0.135, helmet |x| <= 0.107),
# kept in Body (user preference)
HEAD = dict(islands=[10, 40], cut=[5], z_chin=1.615, pred=lambda c: abs(c.x) < 0.115, in_body=True)
# tabard front/back and the cape: separate cloth islands kept inside Body (user preference: no separate cloth part)
ROBE_CUTS = {'Cloth_TabF': dict(islands=[6], z_max=2.0, in_body=True),
             'Cloth_TabB': dict(islands=[3], z_max=2.0, in_body=True),
             'Cloth_Cape': dict(islands=[21], z_max=2.0, in_body=True)}
CLOTH = {'Cloth_TabF': dict(prefix='robe_tabardF', chains=[('F', 0)], half=80, n=3, parent='pelvis', center='pelvis',
                            edge_weights='neighbors'),
         'Cloth_TabB': dict(prefix='robe_tabardB', chains=[('B', 180)], half=80, n=3, parent='pelvis', center='pelvis',
                            edge_weights='neighbors'),
         # cape hangs from the L shoulder down the L side and back: chains below the shoulder only
         'Cloth_Cape': dict(prefix='robe_cape', chains=[('L', 95), ('BL', 140)], half=25, n=3, parent='chest',
                            center=(0.0, 0.0), z_top=1.42, edge_weights='neighbors')}
ACC = {'frame': dict(islands=[0, 1, 2, 4, 16, 46], mode='rigid', n=1, parent='chest'),
       'bellF': dict(islands=[52, 54, 63, 59], mode='strand', n=2, parent='pelvis'),
       'bellB': dict(islands=[56, 57, 61, 62], mode='strand', n=2, parent='pelvis'),
       'lantern': dict(islands=[22, 30, 25, 27], mode='strand', n=2, parent='pelvis'),
       # user 2026-10-29: pauldrons split off with their own bone moving with the shoulder (rigid, child of the clavicle,
       # as OS); the rivets/studs touching each plate go with it (s0 touch: 18 <- 24/26/28/31-35, 48 <- 53/58/60/65)
       # the round disc on the front of each plate (17/47) is the pauldron's hinge and goes with it (user 2026-10-29)
       # user 2026-10-29: the 50/50 pauldron/upper-arm skin mix shrank the plate; as a child of the upper arm it followed
       # the lowered arm too much; a Copy Rotation (half the arm) was then dropped by the user -> 100 % on its own bone,
       # the bone a child of the clavicle (user choice), keyed by the animator; pivot see extra_chains
       'pauldronL': dict(islands=[18, 17, 24, 26, 28, 31, 32, 33, 34, 35], mode='rigid', n=1, parent='L_Clavicle'),
       'pauldronR': dict(islands=[48, 47, 53, 58, 60, 65], mode='rigid', n=1, parent='R_Clavicle')}
# arm mask: the broad breastplate is torso (default |x| > shoulder - 0.08, z > shoulder - 0.35 took the chest sides)
# arm band: all arm beyond x 0.30 (under the pauldron, default shoulder + 0.20 left x 0.28 at 0.2 arm: 24x elbows) and
# over the shoulder top beyond shoulder + cap; torso inside x 0.23 / below z 1.33. Hips: pelvis fades in over
# hip - 0.08 .. hip + 0.06, thighs cross-fade over |x| < 0.05 (crotch and the front hip under the belt tore 6-10x)
LM = dict(neck_mode='band', head_band=0.08, arm_mask_x=0.21, arm_mask_z=1.30, arm_anchor_x=0.30, cap=(0.05, 0.0),
          hip_blend=(0.08, 0.06, 0.05))
PUSH_KW = dict(iters=6, smooth=0.7, rounds=6)
LAYER_SKIP = ('beads', 'flap_rope')


def s2_labels(ob, lab, isl, info):
    """Default labels; the face cut keeps only its largest connected piece (the gorget's inner rim above the chin goes
    back to Body), as EX."""
    import sys, collections, stages
    A = sys.modules[__name__]
    labels = stages.default_labels(A, ob, lab, isl)
    m = ob.data
    cut = [p.index for p in m.polygons if labels[p.index] == 'Head' and lab[p.vertices[0]] == 5]
    byv = collections.defaultdict(list)
    for fi in cut:
        for v in m.polygons[fi].vertices:
            byv[v].append(fi)
    seen, comps = set(), []
    for f0 in cut:
        if f0 in seen:
            continue
        comp = [f0]; seen.add(f0); j = 0
        while j < len(comp):
            for v in m.polygons[comp[j]].vertices:
                for g in byv[v]:
                    if g not in seen:
                        seen.add(g); comp.append(g)
            j += 1
        comps.append(comp)
    comps.sort(key=len, reverse=True)
    for comp in comps[1:]:
        for fi in comp:
            labels[fi] = 'Body'
    info['head_cut_pieces'] = [len(c) for c in comps]
    return labels


def extra_chains(rig, parts, chains, L):
    """Weapon sockets (user G1): L/R_hand_socket at the palm (the weapon_attach point), child of the hand, no deform."""
    import bpy
    import rigbatch as rb
    bpy.ops.object.select_all(action='DESELECT'); bpy.context.view_layer.objects.active = rig; rig.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT'); eb = rig.data.edit_bones
    for P in 'LR':
        h = eb[f'{P}_Hand']; wa = eb[f'{P}_weapon_attach']; n = f'{P}_hand_socket'
        if n in eb:
            eb.remove(eb[n])
        b = eb.new(n); b.head = wa.head.copy(); b.tail = wa.head + (h.tail - h.head).normalized() * 0.06 * rb.K
        b.parent = h; b.use_connect = False; b.use_deform = False; b.roll = h.roll
    # user 2026-10-29: the pauldron pivots at the round disc on the front of the shoulder (islands 17/47, x/z of its
    # centre measured from the mesh, depth of the shoulder joint): bone head there, pointing out along the upper arm (same roll), so the plate swings round that point
    from mathutils import Vector
    src = parts.get('Accessory') or parts['Body']     # the discs moved to the pauldron items (Accessory)
    lab_isl = src.data.attributes['rb_isl']; BV = src.data.vertices
    for P, isl_id in (('L', 17), ('R', 47)):
        n = f'pauldron{P}_01'
        if n not in eb:
            continue
        pts = [BV[i].co for i in range(len(BV)) if lab_isl.data[i].value == isl_id]
        if not pts:
            continue
        c = sum(pts, Vector()) / len(pts)
        ua = eb[f'{P}_UpperArm']; b = eb[n]
        c = Vector((c.x, ua.head.y, c.z))      # user: "not in the middle of the shoulder" -> depth of the shoulder joint
        b.head = c; b.tail = c + (ua.tail - ua.head).normalized() * 0.15 * rb.K; b.roll = ua.roll
    bpy.ops.object.mode_set(mode='OBJECT')
    # no constraint on the pauldron bones (user 2026-10-29: Copy Rotation removed); clear any left in an old blend
    for P in 'LR':
        pb = rig.pose.bones.get(f'pauldron{P}_01')
        if pb is not None:
            for c_ in list(pb.constraints):
                pb.constraints.remove(c_)


def landmarks_fix(L, parts, notes):
    """The breastplate is wider than the measured torso section (half-width 0.015 -> shoulder x 0.053) and the wrist came
    from proportion. Arm joints from the mesh (an_armL_front/top): elbow at the gap between upper arm and gauntlet (elbow
    cap 37 at x 0.48-0.56), wrist at the gauntlet cuff end (x 0.775), finger tips 1.005; arm axis y -0.09, z 1.46.
    Hips were at the belt (thigh : shin 1.25): crotch closes at z ~0.85, hip joints at HIP_Z."""
    S = dict(shoulder=(0.22, -0.075, 1.48), elbow=(0.525, -0.09, 1.465), wrist=(0.775, -0.105, 1.448),
             hand_end=(1.0, -0.11, 1.44))
    for k_, v in S.items():
        L[k_] = v
    old = {s_: L.get(s_ + 'hip') for s_ in ('L_', 'R_', '')}
    for s_ in ('L_', 'R_', ''):
        if L.get(s_ + 'hip'):
            x, y, z = L[s_ + 'hip']; L[s_ + 'hip'] = (x, y, HIP_Z)
    notes.append(f'arm joints set by hand; hips z {old["L_"]} -> {HIP_Z}; knee {L.get("L_knee")} ankle {L.get("L_ankle")}')


HIP_Z = 0.96

# Small rigid Body pieces (buckle, studs, belt loops, elbow/knee caps): one weight per island (the island mean), else the
# belt buckle straddling pelvis/spine_01 stretched 16x on bend. Hip plates (14/44) hang from the belt over the thighs:
# pelvis at the top, easing to THIGH_MAX thigh at the bottom (hard pelvis|thigh split: 9-10x on kick/sit). Crotch
# (island 5, |x| < CROTCH['x'], z in CROTCH['z']): L_Thigh 1 met R_Thigh 1 on the centre line (8.6x walk) -> smooth L/R
# across x and part pelvis near the centre.
RIGID_MAX = 64
SMOOTH = {'shoulder': ((0.17, 0.34), (1.30, 1.66), 12), 'hip': ((0.0, 0.26), (0.86, 1.08), 12)}
HIP_PLATES = (14, 44)
THIGH_MAX = 0.6
CROTCH = dict(x=0.0, z=(0.74, 0.98), pelvis=0.5)   # off: LM hip_blend does the crotch


def body_weights_fix(body, rig, rep):
    import collections
    import rigbatch as rb
    rc = rb.rc; V = body.data.vertices; ia = body.data.attributes['rb_isl']
    by = collections.defaultdict(list)
    for v in V:
        by[ia.data[v.index].value].append(v.index)
    nr = 0
    for kk, ids in by.items():
        if kk in (5, 38, 68, 6, 3, 21) or kk in HIP_PLATES or len(ids) > RIGID_MAX:
            continue
        acc = collections.Counter()
        for i in ids:
            for n, w in rb.vertex_weights(body, i).items():
                acc[n] += w / len(ids)
        for i in ids:
            rc.set_weights(body, i, dict(acc)); nr += 1
    nh = 0
    for kk in HIP_PLATES:
        ids = by.get(kk, [])
        if not ids:
            continue
        zt = max(V[i].co.z for i in ids); zb = min(V[i].co.z for i in ids)
        for i in ids:
            c = V[i].co; th = 'L_Thigh' if c.x > 0 else 'R_Thigh'
            t = THIGH_MAX * rc.sm(zt, zb, c.z)
            rc.set_weights(body, i, {'pelvis': 1 - t, th: t}); nh += 1
    nc = 0
    for i in by.get(5, []):
        c = V[i].co
        if abs(c.x) >= CROTCH['x'] or not (CROTCH['z'][0] < c.z < CROTCH['z'][1]):
            continue
        s_ = rc.sm(-0.05, 0.05, c.x)
        lr = {'R_Thigh': 1 - s_, 'L_Thigh': s_}
        f = CROTCH['pelvis'] * (1 - rc.sm(0.0, CROTCH['x'], abs(c.x)))
        cur = rb.vertex_weights(body, i)
        legs = sum(w for n, w in cur.items() if n.endswith('_Thigh'))
        if legs < 0.5:
            continue
        rc.set_weights(body, i, rb.blend(lr, {'pelvis': 1.0}, f)); nc += 1
    # island 5 zones where the blends meet hard (QA tops): armpit/shoulder under the pauldron and the hip under the belt
    ns = {}
    for name, (xr, zr, it) in SMOOTH.items():
        vs = [i for i in by.get(5, []) if xr[0] <= abs(V[i].co.x) <= xr[1] and zr[0] <= V[i].co.z <= zr[1]]
        if vs:
            rc.smooth_weights(body, vs, iters=it, factor=0.5)
        ns[name] = len(vs)
    rc.finalize_weights(body)
    rep['pb_fix'] = dict(rigid=nr, hip_plates=nh, crotch=nc, smooth=ns)


# Pauldrons on the clavicle alone stayed level: shelves sticking out with the arm down 50 deg, the upper arm rising through
# them at 35 deg up. Each plate keeps its own bone (child of the clavicle, for animation) but every plate vertex carries the
# same mix PAULDRON_ARM of the upper arm: the plate stays rigid and turns with half the arm.
PAULDRON_ARM = 0.0   # was 0.5: linear blend of two bones shrank the plate (user 2026-10-29)


def acc_weights_fix(acc, body, rig, rep):
    import rigbatch as rb
    rc = rb.rc; at = acc.data.attributes['rb_acc']; n = 0
    for name, P in (('pauldronL', 'L'), ('pauldronR', 'R')):
        code = list(ACC).index(name) + 1; bone = f'{name}_01'
        for v in acc.data.vertices:
            if at.data[v.index].value == code:
                rc.set_weights(acc, v.index, {bone: 1 - PAULDRON_ARM, f'{P}_UpperArm': PAULDRON_ARM}); n += 1
    rc.finalize_weights(acc)
    rep['pauldron_mix'] = dict(verts=n, arm=PAULDRON_ARM)


# layers + springs (spring_layers.py): tabard front/back on layer 0, the cape outside (1); bells and lantern short springs;
# the coffin frame and the pauldrons are rigid (no spring)
SPRING = dict(collections={'Tabard': ['robe_tabardF_', 'robe_tabardB_'], 'Cape': ['robe_cape_'], 'Frame': ['frame_'],
                           'Pauldron': ['pauldron'], 'Hanging': ['bellF_', 'bellB_', 'lantern_']},
              layers={'Cloth_TabF': 0, 'Cloth_TabB': 0, 'Cloth_Cape': 1},
              chains={'frame_01': dict(enabled=False), 'pauldronL_01': dict(enabled=False),
                      'pauldronR_01': dict(enabled=False)},
              # auto radii measured the plate armour: pelvis 0.225 reached y -0.305 through the front tabard (-0.26),
              # spine_02 0.232 touched the cape's inner edge, knee spheres 0.123 -> set by hand inside the cloth
              radius={'pelvis': 0.15, 'spine_01': 0.15, 'spine_02': 0.17, 'L_Thigh': 0.11, 'R_Thigh': 0.11},
              colliders=[dict(bone='pelvis', type='sphere'), dict(bone='spine_01', type='capsule'),
                         dict(bone='spine_02', type='capsule'),
                         dict(bone='L_Thigh', type='capsule'), dict(bone='R_Thigh', type='capsule'),
                         dict(bone='L_Calf', type='capsule'), dict(bone='R_Calf', type='capsule'),
                         dict(bone='L_Calf', type='sphere', at=0.1, radius=0.10),
                         dict(bone='R_Calf', type='sphere', at=0.1, radius=0.10)])
