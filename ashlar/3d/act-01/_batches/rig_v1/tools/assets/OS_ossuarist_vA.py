"""OS Ossuarist A (hero, ashlar/3d/heroes/OS_ossuarist/vA/). User G1 2026-10-29: H 1.7 m (k 0.944), weapon sockets on both
hands (L/R_hand_socket, child of the hand, no deform), the bone pauldron on the left shoulder rigid (child of L_Clavicle),
the hip lantern and the bone bundle short spring strands, spring only on the capelet + hood behind the back.
Slim woman in T-pose, Tripo multi-view; stage-0 (1.7 m, centred): island 0 (3104 v) = head + torso + arms + capelet + collar +
floor-length skirt in ONE piece; 18/38 = L/R leg + thigh-high boot (z 0-0.95, under the skirt); 25 = pauldron (x 0.11-0.30,
z 1.36-1.50); 42 = lantern (x -0.23..-0.13, z 0.74-1.05) with its hook/chain bits 43-47; rods 23/27/28/30 + caps 24/26/29/31 =
bone bundle (x 0.10-0.22, z 0.84-1.10); 1-5/9-13/15-17/19-22/37/40 = loose hair strands and earrings (z > 1.49); 6/7/8/39 brooch
and clasps; 14 belt chain; 41 belt ring; 32/48 gems on the upper arms; 33-36/49/50 rings on the fingers. Fingers separate.
"""
GENERIC = True
HEIGHT_M = 1.7
ISL = dict(torso=[0], legs=[18, 38], arms=[])
SYM = dict(c=0.0, ops=[], center=False)
HAIR_ISL = [1, 2, 3, 4, 5, 9, 10, 11, 12, 13, 15, 16, 17, 19, 20, 21, 22, 37, 40]
# head cut from island 0 above the stand-up collar (collar top ~1.50, narrowest neck 1.46-1.48), kept in Body (user)
HEAD = dict(islands=HAIR_ISL, cut=[0], z_chin=1.50, pred=lambda c: abs(c.x) < 0.12, in_body=True)
ACC = {'pauldron': dict(islands=[25], mode='rigid', n=1, parent='L_Clavicle'),
       'lantern': dict(islands=[42, 43, 44, 45, 46, 47], mode='strand', n=2, parent='pelvis'),
       'bundle': dict(islands=[23, 24, 26, 27, 28, 29, 30, 31], mode='strand', n=2, parent='pelvis')}
# skirt (island 0 below the belt) and the capelet + hood behind the back: cloth kept in Body (user preference)
SKIRT_Z = 0.95
ROBE_CUTS = {'Cloth_Skirt': dict(islands=[0], z_max=SKIRT_Z, in_body=True),
             'Cloth_Cape': dict(islands=[0], z_max=1.47, in_body=True,
                                pred=lambda c: c.z > 1.19 and c.y > 0.035 and abs(c.x) < 0.20)}
CLOTH = {'Cloth_Skirt': dict(prefix='robe_skirt', chains=[('F', 0), ('B', 180)], half=90, n=3,
                             parent='pelvis', center='pelvis', edge_weights='neighbors'),
         'Cloth_Cape': dict(prefix='cape', chains=[('B', 180)], half=70, n=2, parent='chest', center='pelvis')}
LM = dict(arm_z_min=1.30, neck_mode='band', head_band=0.08, wrist_x=0.635)   # hand widens at |x| 0.64 (glove cuff 0.60-0.63)
PUSH_KW = dict(iters=6, smooth=0.7, rounds=6)
LAYER_SKIP = ('beads', 'flap_rope')


def s2_attrs(ob, lab, isl, info):
    info['hair_islands'] = len(HAIR_ISL)


def extra_chains(rig, parts, chains, L):
    """Weapon sockets (user G1): L/R_hand_socket at the palm (the weapon_attach point), child of the hand, no deform.
    Skirt chains rebuilt through the middle of each panel (user 2026-10-29: the skirt is four parts), see _panels."""
    import bpy
    import rigbatch as rb
    from mathutils import Vector
    body = parts['Body']; V = body.data.vertices; k = rb.K
    for tag, vs in _chain_groups(body).items():
        P = [V[i].co.copy() for i in vs]
        zb = min(p.z for p in P)
        top = [p for p in P if p.z > Z_SPLIT - 0.06] or P; t = sum(top, Vector()) / len(top); t.z = SKIRT_Z
        low = [p for p in P if p.z < zb + 0.06]; b = sum(low, Vector()) / len(low); b.z = zb + 0.01 * k
        name = f'robe_skirt_{tag}'
        chains[name] = rb.rc.add_chain(rig, name, [t.lerp(b, i / 3) for i in range(4)], 'pelvis')
    for tag, vs in _cape_flaps(body).items():
        P = [V[i].co.copy() for i in vs]
        zt, zb = max(p.z for p in P), min(p.z for p in P)
        top = [p for p in P if p.z > zt - 0.04]; t = sum(top, Vector()) / len(top); t.z = zt
        low = [p for p in P if p.z < zb + 0.04]; b = sum(low, Vector()) / len(low); b.z = zb + 0.005 * k
        name = f'cape_{tag}'
        chains[name] = rb.rc.add_chain(rig, name, [t.lerp(b, i / 2) for i in range(3)], 'chest')
    # cape_B through the middle of the hanging back capelet (the sector chain averaged the hood and the part on the skin:
    # it ran at y 0.06-0.08 under the cloth at 0.10-0.13, inside the chest/spine colliders), root where it starts to hang
    import stages, sys
    ac = body.data.attributes.get('rb_cloth'); code = stages.inbody_code(sys.modules[__name__], 'Cloth_Cape')
    fl = {i for vs in _cape_flaps(body).values() for i in vs}
    P = [V[i].co.copy() for i in range(len(V)) if ac is not None and ac.data[i].value == code and i not in fl
         and V[i].co.z < CAPE_TOP[0] + 0.02 and abs(V[i].co.x) < 0.10]
    if P:
        zt, zb = max(p.z for p in P), min(p.z for p in P)
        top = [p for p in P if p.z > zt - 0.04]; t = sum(top, Vector()) / len(top); t.z = zt
        low = [p for p in P if p.z < zb + 0.04]; b = sum(low, Vector()) / len(low); b.z = zb + 0.005 * k
        chains['cape_B'] = rb.rc.add_chain(rig, 'cape_B', [t.lerp(b, i / 2) for i in range(3)], 'chest')
    bpy.ops.object.select_all(action='DESELECT'); bpy.context.view_layer.objects.active = rig; rig.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT'); eb = rig.data.edit_bones
    if 'pauldron_01' in eb:                 # pivot on the hinge between the two orbs (user 2026-10-29), pointing up
        pb = eb['pauldron_01']; ln = (pb.tail - pb.head).length
        pb.head = Vector(PAULDRON_PIVOT); pb.tail = Vector(PAULDRON_PIVOT) + Vector((0, 0, ln)); pb.align_roll(Vector((0, -1, 0)))
    for P in 'LR':
        h = eb[f'{P}_Hand']; wa = eb[f'{P}_weapon_attach']; n = f'{P}_hand_socket'
        if n in eb:
            eb.remove(eb[n])
        b = eb.new(n); b.head = wa.head.copy(); b.tail = wa.head + (h.tail - h.head).normalized() * 0.06 * rb.K
        b.parent = h; b.use_connect = False; b.use_deform = False; b.roll = h.roll
    bpy.ops.object.mode_set(mode='OBJECT')


# User 2026-10-29 (screenshot): the pauldron turns at its round orb. Two cyan orbs on the pauldron (texture hue 0.45-0.65):
# front centre (0.139, -0.068, 1.391), back (0.149, +0.086, 1.393) = the ends of a hinge; the pivot is its middle.
PAULDRON_PIVOT = (0.144, 0.009, 1.392)


# The skirt is four separate panels below Z_SPLIT (joined only at the waist): F (x -0.11..0.09, front), B (back),
# L (x 0.09..0.30, wraps front -> back), R (x -0.29..-0.10; the slit is between F and R). User 2026-10-29: four parts,
# each panel follows its own chain only (the angular sectors mixed F/L/R across the slits). Small pieces (the slit hem
# strip, x -0.15..-0.10, 14 v) join the nearest panel.
Z_SPLIT = 0.88


def _panels(body):
    import collections, stages, sys
    A = sys.modules[__name__]
    ac = body.data.attributes.get('rb_cloth'); code = stages.inbody_code(A, 'Cloth_Skirt'); V = body.data.vertices
    S = {i for i in range(len(V)) if ac is not None and ac.data[i].value == code and V[i].co.z < Z_SPLIT}
    nb = collections.defaultdict(list)
    for e in body.data.edges:
        a, b = e.vertices; nb[a].append(b); nb[b].append(a)
    seen = set(); comps = []
    for i in S:
        if i in seen:
            continue
        st = [i]; seen.add(i); c = []
        while st:
            a = st.pop(); c.append(a)
            for b in nb[a]:
                if b in S and b not in seen:
                    seen.add(b); st.append(b)
        comps.append(c)
    comps.sort(key=len, reverse=True)
    out = {}
    for c in comps[:4]:
        cx = sum(V[i].co.x for i in c) / len(c); cy = sum(V[i].co.y for i in c) / len(c)
        tag = ('F' if cy < 0 else 'B') if abs(cx) < 0.06 else ('L' if cx > 0 else 'R')
        out[tag] = list(c)
    for c in comps[4:]:
        best = min(out, key=lambda t: min((V[i].co - V[j].co).length for i in c[:5] for j in out[t]))
        out[best] += c
    return out


# User 2026-10-29: bones for the two side flaps of the capelet (hanging at the sides behind the armpits, x 0.07-0.19,
# y 0.06-0.11, z 1.21-1.39 each side). Found by connectivity from their open hem (boundary vertices z 1.17-1.30,
# |x| 0.08-0.30) inside z FLAP['z'], |x| > FLAP['x'], one side at a time; each gets cape_L / cape_R (2 bones, child of chest).
# Their cape share goes to their own chain, easing in from the back chain over FLAP['ease'] below the flap top.
FLAP = dict(z=(1.15, 1.40), x=0.06, seed_z=(1.17, 1.30), seed_x=(0.08, 0.30), ease=0.05)


def _cape_flaps(body):
    import collections
    m = body.data; V = m.vertices
    ec = collections.Counter(e for p in m.polygons for e in p.edge_keys)
    bnd = {i for e, c in ec.items() if c == 1 for i in e}
    nb = collections.defaultdict(list)
    for e in m.edges:
        a, b = e.vertices; nb[a].append(b); nb[b].append(a)
    ok = lambda i: FLAP['z'][0] < V[i].co.z < FLAP['z'][1] and abs(V[i].co.x) > FLAP['x']
    out = {}
    for tag, sg in (('L', 1), ('R', -1)):
        seed = [i for i in bnd if FLAP['seed_z'][0] < V[i].co.z < FLAP['seed_z'][1]
                and FLAP['seed_x'][0] < sg * V[i].co.x < FLAP['seed_x'][1]]
        got = set(seed); st = list(seed)
        while st:
            i = st.pop()
            for j in nb[i]:
                if j not in got and ok(j) and sg * V[j].co.x > 0:
                    got.add(j); st.append(j)
        if got:
            out[tag] = sorted(got)
    return out


# User 2026-10-29 (shoulder weights): the capelet over the shoulders and the hood were all cape chain, so the shoulder
# skin came through it when the arm moved and the whole top would swing with a spring. Above CAPE_TOP[0] the capelet
# copies the weights of the nearest skin vertex outside the cape region (shoulder, neck, upper back), easing into the
# chains by CAPE_TOP[1]. (A computed torso + clavicle base did not match the skin beside it: 4.9x on arms_down.)
CAPE_TOP = (1.38, 1.30)


def _cape_top(body, rig, rep):
    import stages, sys
    import rigbatch as rb
    A = sys.modules[__name__]
    rc = rb.rc; V = body.data.vertices; ac = body.data.attributes['rb_cloth']; code = stages.inbody_code(A, 'Cloth_Cape')
    skin = [v.index for v in V if ac.data[v.index].value == 0 and v.co.z > CAPE_TOP[1] - 0.05]
    kd = rb.kdtree.KDTree(len(skin))
    for i in skin:
        kd.insert(V[i].co, i)
    kd.balance(); n = 0
    for v in V:
        if ac.data[v.index].value != code:
            continue
        f = rc.sm(CAPE_TOP[0], CAPE_TOP[1], v.co.z)          # 0 top (skin) .. 1 low (as computed)
        if f >= 1:
            continue
        base = dict(rb.vertex_weights(body, kd.find(v.co)[1]))
        base['neck'] = base.get('neck', 0.0) + base.pop('head', 0.0)          # the hood never turns with the head
        if base['neck'] > 0.6:                                                # and at most 0.6 neck (skill's hood cap)
            base['chest'] = base.get('chest', 0.0) + base['neck'] - 0.6; base['neck'] = 0.6
        rc.set_weights(body, v.index, rb.blend(base, rb.vertex_weights(body, v.index), f)); n += 1
    rep['cape_top'] = n
    # hood/capelet inside the neck zone: the same height ramp as the skin there (the nearest skin was a shoulder: 7x head_turn)
    _neck_ramp(body, rep, only={v.index for v in V if ac.data[v.index].value == code}, key='cape_neck_ramp')


def _flap_weights(body, rig, chains, rep):
    import rigbatch as rb
    rc = rb.rc; V = body.data.vertices; k = rb.K
    for tag, vs in _cape_flaps(body).items():
        bones = chains.get(f'cape_{tag}')
        if not bones:
            continue
        jz = rb.chain_joint_z(rig, bones); zt = max(V[i].co.z for i in vs)
        for i in vs:
            w = rb.vertex_weights(body, i)
            c = sum(x for g, x in w.items() if g.startswith('cape_'))
            if c <= 0:
                continue
            f = rc.sm(zt, zt - FLAP['ease'] * k, V[i].co.z)
            d = {g: x * (1 - f) if g.startswith('cape_') else x for g, x in w.items()}
            for g, x in rc.chain_weights(bones, jz, V[i].co.z, blend=0.03 * k).items():
                d[g] = d.get(g, 0.0) + c * f * x
            rc.set_weights(body, i, d)
        rep[f'cape_flap_{tag}'] = len(vs)


def cloth_weights_fix(parts, rig, chains, rep):
    """Each panel vertex: its chain share (robe_skirt_*) goes to its own panel's chain by height; the torso share from
    the waist seam band is kept. Side panels: two chains (front/back half), blended across the panel by y."""
    import rigbatch as rb
    rc = rb.rc; body = parts['Body']; V = body.data.vertices; k = rb.K; n = 0
    G = _chain_groups(body)
    for tag, vs in _panels(body).items():
        sub = [tag] if tag in ('F', 'B') else [tag + 'F', tag + 'B']
        bones = {t: chains.get(f'robe_skirt_{t}') for t in sub}
        if not all(bones.values()):
            continue
        jz = {t: rb.chain_joint_z(rig, b) for t, b in bones.items()}
        if len(sub) == 2:
            yF = sum(V[i].co.y for i in G[sub[0]]) / len(G[sub[0]]); yB = sum(V[i].co.y for i in G[sub[1]]) / len(G[sub[1]])
        for i in vs:
            w = rb.vertex_weights(body, i)
            c = sum(x for g, x in w.items() if g.startswith('robe_skirt_'))
            if c <= 0:
                continue
            d = {g: x for g, x in w.items() if not g.startswith('robe_skirt_')}
            z = V[i].co.z
            if len(sub) == 1:
                parts_ = [(sub[0], 1.0)]
            else:
                t = rc.sm(yF, yB, V[i].co.y); parts_ = [(sub[0], 1 - t), (sub[1], t)]
            for t_, f in parts_:
                if f <= 0:
                    continue
                for g, x in rc.chain_weights(bones[t_], jz[t_], z, blend=0.04 * k).items():
                    d[g] = d.get(g, 0.0) + c * f * x
            rc.set_weights(body, i, d); n += 1
        rep[f'skirt_panel_{tag}'] = len(vs)
    _cape_top(body, rig, rep)
    _flap_weights(body, rig, chains, rep)
    rc.finalize_weights(body)
    rep['skirt_panel_verts'] = n


def _chain_groups(body):
    """F, B whole panels; L and R split at the panel's median y into LF/LB, RF/RB (user 2026-10-29: two chains per side
    panel, the side panels wrap ~30 cm from front to back)."""
    V = body.data.vertices; out = {}
    for tag, vs in _panels(body).items():
        if tag in ('F', 'B'):
            out[tag] = vs; continue
        ys = sorted(V[i].co.y for i in vs); ym = ys[len(ys) // 2]
        out[tag + 'F'] = [i for i in vs if V[i].co.y <= ym]; out[tag + 'B'] = [i for i in vs if V[i].co.y > ym]
    return out


# Tall stand-up collar (z 1.41-1.50, r 0.07-0.11) round a thin neck (r < 0.06); chin ~1.50. The geodesic head band ran down
# the neck skin inside the collar (head_turn 24.8x at y +0.03, z 1.468: head 0.86 next to neck 0.6/chest 0.4). Neck region
# (|x| < NECK['x'], z NECK['z']) by height instead: chest -> neck over z c, neck -> head over z h on the neck skin only
# (radius < r[0], ramping out by r[1]); the collar keeps head 0 (it follows the neck, not the head).
NECK = dict(x=(0.12, 0.17), z=(1.38, 1.52), c=(1.40, 1.45), h=(1.47, 1.51), r=(0.060, 0.075), front=(-0.04, -0.07), hf=(1.455, 1.50))
# the collar is open in front: under the chin (y < front) the skin is not collar -> head ramp over z hf there (6.4x chin)


def _neck_ramp(body, rep, only=None, key='neck_ramp'):
    import math
    import rigbatch as rb
    rc = rb.rc; n = 0
    for v in body.data.vertices:
        c = v.co
        if only is not None and v.index not in only:
            continue
        if abs(c.x) > NECK['x'][1] or not (NECK['z'][0] <= c.z <= NECK['z'][1]):
            continue
        fx = 1 - rc.sm(NECK['x'][0], NECK['x'][1], abs(c.x))       # soft outer edge (hard |x| 0.13 edge: 4.7x head_turn)
        r = math.hypot(c.x, c.y)
        d = rb.blend({'chest': 1.0}, {'neck': 1.0}, rc.sm(NECK['c'][0], NECK['c'][1], c.z))
        fh = rc.sm(NECK['h'][0], NECK['h'][1], c.z) * (1 - rc.sm(NECK['r'][0], NECK['r'][1], r))
        ff = rc.sm(NECK['front'][0], NECK['front'][1], c.y) * rc.sm(NECK['hf'][0], NECK['hf'][1], c.z)
        fh = max(fh, ff)
        if fh > 0:
            d = rb.blend(d, {'head': 1.0}, fh)
        if fx < 1:
            d = rb.blend(rb.vertex_weights(body, v.index), d, fx)
        rc.set_weights(body, v.index, d); n += 1
    rep[key] = n


# Belt chain (island 14, across the front at z 0.97-1.05) and belt ring (41): the skill gave each link the nearest bone,
# R_Thigh 1 next to pelvis 1 (sit 9.1x, walk 3.6x) -> torso weights by height.
BELT_ISL = (14, 41)


def _belt(body, rig, rep):
    import rigbatch as rb
    rc = rb.rc; ai = body.data.attributes['rb_isl']; n = 0
    for v in body.data.vertices:
        if ai.data[v.index].value in BELT_ISL:
            rc.set_weights(body, v.index, rc.torso_weights(v.co, rig)); n += 1
    rep['belt'] = n


# User 2026-10-29 (screenshot, arm down): the underside of the upper arm by the armpit (|x| 0.22-0.25, z 1.33-1.35)
# kept chest 0.14-0.22 + some clavicle, so lowering the arm pulled a web between arm and ribs. Below the arm axis
# (z < PIT['z'][1]) the torso and clavicle share moves to the upper arm over |x| PIT['x'] (none inside, all outside).
PIT = dict(x=(0.14, 0.24), z=(1.27, 1.36), x_max=0.32)   # 0.165-0.215: 4.2x arms_down across the sparse pit edges
_TORSO = ('chest', 'spine_02', 'spine_01', 'pelvis', 'neck')


def _armpit(body, rig, rep):
    import rigbatch as rb
    rc = rb.rc; ac = body.data.attributes.get('rb_cloth'); n = 0
    for v in body.data.vertices:
        c = v.co; ax = abs(c.x)
        if not (PIT['z'][0] < c.z < PIT['z'][1]) or ax > PIT['x_max'] or ax < PIT['x'][0]:
            continue
        if ac is not None and ac.data[v.index].value:
            continue
        f = rc.sm(PIT['x'][0], PIT['x'][1], ax)
        P = 'L' if c.x > 0 else 'R'
        w = dict(rb.vertex_weights(body, v.index))
        gone = 0.0
        for g in list(w):
            if g in _TORSO or g == f'{P}_Clavicle':
                gone += w[g] * f; w[g] *= 1 - f
        if gone <= 1e-4:
            continue
        w[f'{P}_UpperArm'] = w.get(f'{P}_UpperArm', 0.0) + 0.75 * gone
        w[f'{P}_UpperArm_twist'] = w.get(f'{P}_UpperArm_twist', 0.0) + 0.25 * gone
        rc.set_weights(body, v.index, {g: x for g, x in w.items() if x > 1e-4}); n += 1
    rep['armpit'] = n


def body_weights_fix(body, rig, rep):
    _neck_ramp(body, rep)
    _belt(body, rig, rep)
    _armpit(body, rig, rep)


# Step 7 springs: capelet + hood back, lantern and bone bundle (short strands); pauldron rigid. Skirt: off at G1, user
# 2026-10-29 "the skirt has no spring" -> all six skirt chains on (FL skirt preset: front 1.5, sides 1.6, back 1.7),
# linked to their neighbours round the waist except across the slit (RF - F). The cape chains collide with the chest
# and upper arms (the side parts hang beside the arms).
_SKIRT = dict(enabled=True, stiffness=1.6, drag=0.45, gravity=0.4, hitRadius=0.015,  # side halves run 1-2 cm off the thighs
              endLength=0.094, wind=1.0, layer=0)
SPRING = dict(collections={'Skirt': ['robe_skirt_'], 'Cape': ['cape_'], 'Accessory': ['pauldron_', 'lantern_', 'bundle_']},
              chains={'pauldron_01': dict(enabled=False),
                      # rest gaps (moving joints vs colliders): the cape chains run close to the back and the strands
                      # beside the thighs -> small hit radii (cape_B tip was 7 cm inside spine_02 + hit radius)
                      'cape_B_01': dict(hitRadius=0.02), 'lantern_01': dict(hitRadius=0.015, layer=2), 'bundle_01': dict(hitRadius=0.015, layer=2)},   # strands hang outside the skirt
              extra_links=[['robe_skirt_F_01', 'robe_skirt_LF_01'], ['robe_skirt_LF_01', 'robe_skirt_LB_01'],
                           ['robe_skirt_LB_01', 'robe_skirt_B_01'], ['robe_skirt_B_01', 'robe_skirt_RB_01'],
                           ['robe_skirt_RB_01', 'robe_skirt_RF_01']],
              extra_chains=[dict(root=f'robe_skirt_{t}_01', **_SKIRT) for t in ('LF', 'LB', 'RF', 'RB')]
              + [dict(root=f'cape_{t}_01', stiffness=1.7, drag=0.45, gravity=0.4, hitRadius=0.02, endLength=0.094, wind=1.0,
                      layer=1) for t in ('L', 'R')],
              # editor preset list, knee spheres 0.089 -> 0.06 (touched the front halves of the side panels at rest)
              colliders=[dict(bone='pelvis', type='sphere'), dict(bone='spine_01', type='capsule'), dict(bone='spine_02', type='capsule'),
                         dict(bone='L_Thigh', type='capsule'), dict(bone='R_Thigh', type='capsule'),
                         dict(bone='L_Calf', type='capsule'), dict(bone='R_Calf', type='capsule'),
                         dict(bone='L_Calf', type='sphere', at=0.1, fit=0.8, radius=0.06),
                         dict(bone='R_Calf', type='sphere', at=0.1, fit=0.8, radius=0.06)],
              extra_colliders=[dict(bone='chest', type='capsule', tail_to='neck', radius=0.08),
                               dict(bone='L_UpperArm', type='capsule', tail_to='L_ForeArm'),
                               dict(bone='R_UpperArm', type='capsule', tail_to='R_ForeArm')],
              # auto radii swallowed the cloth: chest 0.123 reached the chin and covered the hood on the back; pelvis 0.153
              # and spine_01 0.110 touched the lantern and the bone bundle at rest -> set by hand
              radius={'pelvis': 0.12, 'spine_01': 0.095, 'spine_02': 0.085, 'L_Thigh': 0.06, 'R_Thigh': 0.06})   # spine_02 0.13 reached the capelet hem on the back
