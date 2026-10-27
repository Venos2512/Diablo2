"""P07 Cradle-Warden A (wave 2). Canon 2.2H = 3.96 m (user 2026-10-27 chose canon over the sheet's 1.5H).
Stitched dwarf giant: faceless dome head under a frilled hood, huge sausage arms (to |x| 3.1, z 2.3-3.1), short legs
(feet z 0-0.3, |x| 0.58-1.55), big belly (y to -1.58), a woven cradle cage on the back (y > ~1.0, z ~1.8-3.5).
Stage-0: everything is ONE island (1, 5176 verts) + the buttons down the front and island 2 (152 verts, a band on the
cage back, y 1.15-1.36, z 2.43-2.77). Brief: cage rigid (child of chest).
"""
GENERIC = True
HEIGHT_M = 3.96
ISL = dict(torso=[1], legs=[], arms=[])
SYM = dict(c=0.0, ops=[], center=False)
# head = the dome + hood above the shoulders near the axis, kept in Body (user, P05)
HEAD = dict(islands=[], cut=[1], z_chin=3.15, pred=lambda c: abs(c.x) < 0.60, in_body=True)   # 0.95 took the shoulder frills (head_turn 24x)
ACC = {'cage': dict(islands=[2], mode='rigid', n=1, parent='chest')}
# shirt hem over the legs (walk 43x, kick 53x: the front flap followed one thigh): the shirt below z 1.35 outside the leg
# cylinders (axis |x| 1.0, y -0.1, r 0.55) is cloth kept inside Body (user preference since P02) with F/L/R/B chains
HEM_LEG_R = 0.55
# user 2026-10-27 deleted the L/R/B shirt chains in Blender and kept F: only the front flap hanging between the legs
# (y < -0.9, |x| < 0.9) is cloth now; the sides and back of the hem follow the hips/thighs again
ROBE_CUTS = {'Cloth_Robe': dict(islands=[1], z_max=1.35, in_body=True, absorb_small=80,   # + the low buttons (split L/R thigh: walk 35x)
                                pred=lambda c: c.z > 0.40 and c.y < -0.9 and abs(c.x) < 0.9
                                and min(((c.x - s) ** 2 + (c.y + 0.1) ** 2) ** 0.5 for s in (1.0, -1.0)) > HEM_LEG_R)}
# (z > 0.40: the toes reach y -0.65, outside the leg cylinder, and were taken as hem: kick spikes)
CLOTH = {'Cloth_Robe': dict(prefix='robe_shirt', chains=[('F', 0)], half=45, n=3,
                            parent='pelvis', center='pelvis', edge_weights='neighbors')}
LM = dict(arm_z_min=2.2, neck_mode='band', head_band=0.18)   # sweep 0.08/0.12/0.18: head_turn 23.6/12.3/9.3x
PUSH_KW = dict(iters=6, smooth=0.7, rounds=6)
LAYER_SKIP = ('beads', 'flap_rope')


def landmarks_fix(L, parts, notes):
    """Fused mesh, chibi giant: joints from the profile (stage-0 z bins). Arms z 2.28-3.13 (centre 2.72, y ~-0.1),
    torso half width 1.2 at z 2.0, stitched band at the shoulder (|x| ~1.45) and the cuff (~2.55), round hand to 3.1;
    legs separate below z ~1.0, feet centred at |x| ~1.0; head dome z 3.2-3.96."""
    S = dict(pelvis=(0.0, -0.05, 1.10), spine1=(0.0, -0.05, 1.55), spine2=(0.0, -0.05, 2.00), chest=(0.0, -0.05, 2.45),
             neck=(0.0, -0.10, 3.00), head=(0.0, -0.20, 3.20), head_top=(0.0, -0.20, 3.96),
             shoulder=(1.15, -0.10, 2.72), elbow=(1.95, -0.10, 2.72), wrist=(2.65, -0.10, 2.70))
    for k_, v in S.items():
        if k_ in L:
            L[k_] = v
    L['hand_end'] = (3.08, -0.10, 2.70)
    for s_, sg in (('L_', 1), ('R_', -1), ('', 1)):
        if s_ + 'hip' in L:
            L[s_ + 'hip'] = (sg * 0.90, -0.05, 1.00)
        if s_ + 'knee' in L:
            L[s_ + 'knee'] = (sg * 1.00, -0.20, 0.55)
    notes.append('spine/neck/head/arm/leg joints set by hand (fused mesh)')


def _cage_verts(ob):
    """Cage = light wood (texture: hue 0.02-0.15, sat > 0.38, value > 0.33) behind the back (y > 0.9, z 1.8-3.5) or over
    the shoulders (y > 0.3 above z 2.9). The back inside the cage is the same hue but dark (value ~0.25) and the hood is
    pale cloth (sat ~0.25), so position alone took the back and left the top bars with the head. Then 3 fill passes
    (>= 60 % cage neighbours) and one prune pass (< 30 %)."""
    import bpy, colorsys, collections
    import numpy as np
    m = ob.data; V = m.vertices; n = len(V)
    img = next((im for im in bpy.data.images if 'basecolor' in im.name.lower()), None)
    im = img.copy(); im.scale(1024, 1024); W, H = im.size
    px = np.empty(W * H * 4, dtype=np.float32); im.pixels.foreach_get(px); px = px.reshape(H, W, 4); bpy.data.images.remove(im)
    uv = m.uv_layers.active.data; acc = np.zeros((n, 3)); cnt = np.zeros(n)
    for li, lp in enumerate(m.loops):
        u, v = uv[li].uv
        acc[lp.vertex_index] += px[min(H - 1, max(0, int(v % 1.0 * H))), min(W - 1, max(0, int(u % 1.0 * W))), :3]; cnt[lp.vertex_index] += 1
    rgb = acc / np.maximum(cnt, 1)[:, None]
    zone = lambda c: (c.y > 0.9 and 1.8 < c.z < 3.5) or (c.y > 0.3 and c.z > 2.9)
    out = set()
    for i in range(n):
        if not zone(V[i].co):
            continue
        h, s_, val = colorsys.rgb_to_hsv(*rgb[i])
        if 0.02 < h < 0.15 and s_ > 0.38 and val > 0.33:
            out.add(i)
    nb = collections.defaultdict(list)
    for e in m.edges:
        a_, b_ = e.vertices; nb[a_].append(b_); nb[b_].append(a_)
    for _ in range(3):
        add = [i for i in range(n) if i not in out and zone(V[i].co) and nb[i] and sum(t in out for t in nb[i]) >= 0.6 * len(nb[i])]
        out |= set(add)
    out -= {i for i in out if nb[i] and sum(t in out for t in nb[i]) < 0.3 * len(nb[i])}
    seen = set()                            # specks on the back (same wood tone in the light): drop pieces < 25 verts
    for i in list(out):
        if i in seen:
            continue
        comp = [i]; seen.add(i); k_ = 0
        while k_ < len(comp):
            for t in nb[comp[k_]]:
                if t in out and t not in seen:
                    seen.add(t); comp.append(t)
            k_ += 1
        if len(comp) < 25:
            out -= set(comp)
    return out


def s2_labels(ob, lab, isl, info):
    import sys, stages
    A = sys.modules[__name__]
    labels = stages.default_labels(A, ob, lab, isl)
    cage = _cage_verts(ob)
    at = ob.data.attributes.get('rb_acc') or ob.data.attributes.new('rb_acc', 'INT', 'POINT')
    code = list(ACC).index('cage') + 1; nf = 0
    for p in ob.data.polygons:
        if all(v in cage for v in p.vertices):
            labels[p.index] = 'Accessory'; nf += 1
            for v in p.vertices:
                at.data[v].value = code
    info['cage'] = dict(verts=len(cage), faces=nf)
    return labels


# The cage (rigid on the chest) is cut from the hood/back: Body and Head edges along the cut take the cage bone, blending
# back over CAGE_BAND (geodesic), as D02's pot (head_turn tore the seam 1148 mm, walk 254 mm).
CAGE_BAND = 0.30   # 0.15: walk 12x where the cage meets the lower back
CAGE_BAND_HEAD = 0.35     # the cage arc touches the back of the hood: a short band twisted it (head_turn 24x)


def _cage_seam(part, acc, rep, key, band=None):
    import rigbatch as rb
    rc = rb.rc
    cut = set(rb.coincident_map(part, acc)) if acc is not None else set()
    if not cut:
        return
    lbl, dist = rb.geodesic_voronoi(part, {i: i for i in cut}, lambda i: True)
    n = 0; band = band or CAGE_BAND
    for i, d in dist.items():
        if d < band:
            rc.set_weights(part, i, rb.blend({'cage_01': 1.0}, rb.vertex_weights(part, i), rc.sm(0.0, band, d))); n += 1
    rep[key] = dict(cut=len(cut), band=n)


# user 2026-10-27 (circled the bonnet + face: "the head skin takes too much of the back of the neck"): head weight is
# capped by a mask: full in front of y HEAD_MASK['y'][0] above z HEAD_MASK['z'][1], none behind y[1] or below z[0];
# what is taken off goes to the neck. The drape behind the bonnet (y 0.6-1.0, z 2.8-3.4, was head 0.5-1.0) and the
# ribbons under the chin (z < 3.1) no longer turn with the head.
HEAD_MASK = dict(y=(0.30, 0.50), z=(3.10, 3.30))
# user 2026-10-27 ("the face stretches, add some chin"): the face dome goes down to z ~2.85 in front (y -1.0..-1.1,
# |x| < 0.3) under the z mask -> that chin is all head (ramps: y -0.80..-0.92, z 2.78..2.90, |x| 0.30..0.40); the chin
# ribbons hang beside it at |x| 0.4-0.7, y > -0.85 and stay neck.
CHIN = dict(y=(-0.80, -0.92), z=(2.78, 2.90), x=(0.30, 0.40))


def _head_mask(part, rep, key):
    import rigbatch as rb
    rc = rb.rc; n = 0
    for v in part.data.vertices:
        c = v.co
        f = (1 - rc.sm(HEAD_MASK['y'][0], HEAD_MASK['y'][1], c.y)) * rc.sm(HEAD_MASK['z'][0], HEAD_MASK['z'][1], c.z)
        w = rb.vertex_weights(part, v.index); h = w.get('head', 0.0)
        fc = rc.sm(CHIN['y'][0], CHIN['y'][1], c.y) * rc.sm(CHIN['z'][0], CHIN['z'][1], c.z) * (1 - rc.sm(CHIN['x'][0], CHIN['x'][1], abs(c.x)))
        if fc > f and fc > h + 1e-4:
            rc.set_weights(part, v.index, rb.blend(w, {'head': 1.0}, fc)); n += 1
            continue
        if h > f + 1e-4:
            w['head'] = f; w['neck'] = w.get('neck', 0.0) + h - f
            rc.set_weights(part, v.index, {k: x for k, x in w.items() if x > 1e-4}); n += 1
    rep[key] = n


def body_weights_fix(body, rig, rep):
    import stages
    parts = stages.parts_by_role()
    acc = parts.get('Accessory')
    _head_mask(body, rep, 'head_mask_body')
    if parts.get('Head') is not None:
        _head_mask(parts['Head'], rep, 'head_mask_head')
    _cage_seam(body, acc, rep, 'cage_seam_body')
    if parts.get('Head') is not None:
        _cage_seam(parts['Head'], acc, rep, 'cage_seam_head', CAGE_BAND_HEAD)


# layers + springs (spring_layers.py): front shirt flap F in Body (preset); the cage is rigid (no spring).
# auto pelvis sphere r 1.41 (the belly) reached the ground and swallowed the flap (~1.3 from the pelvis) -> by hand
SPRING = dict(collections={'Shirt': ['robe_shirt_'], 'Cage': ['cage_']}, chains={'cage_01': dict(enabled=False)},
              radius={'pelvis': 1.0, 'spine_01': 1.1})
