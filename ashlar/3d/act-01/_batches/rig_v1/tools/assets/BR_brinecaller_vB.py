"""BR Brinecaller B (hero, Tripo 2026-10-27, variant 1). Height 1.80 m (user G1 2026-10-29, k = 1.0; GLB 0.9995 m).
Adult woman in T-pose facing -Y, anatomical right = -X. Stage-0 (importer weld, 5598 verts, 181 islands):
1 = the whole body (skin, top, corset, trousers, boots, half-skirt, hip belts, rope coil on the R shoulder, the flask
glass on the back of the R hip), 0 = hair bun, 2/7/13/15/16/36/37/38/41... hair strands round the face, 28 = flask rope
net (back R hip, c -0.13 0.13 0.94), 34 + 35 = salt jar (front R hip), 23/83 upper arm bands, the rest small belt
items, kelp strips (R hip 53-67) and salt crystals (R shin, bracers).
G1 (user): one hand bone (four fingers fused), weapon sockets on both hands (L/R_weapon_attach, built by rb.build_skeleton),
rigid own bones: rope coil (chest), flask and jar (pelvis, mesh 100 % on the bone, the bone is a spring), skirt springs.
"""
GENERIC = True
HEIGHT_M = 1.80
ISL = dict(torso=[1], legs=[], arms=[])
SYM = dict(c=0.0, ops=[], center=False)       # head/feet/torso/arms axes all within 6 mm (s0)
# head = the hair/face islands above the collar + island 1 above the chin near the axis, kept in Body (user, P05)
HEAD = dict(islands=[0], cut=[1], z_chin=1.53, pred=lambda c: abs(c.x) < 0.11, in_body=True)
# half-skirt (teal, cut by texture in s2_labels) kept inside Body (user preference since P02)
ROBE_CUTS = {'Cloth_Robe': dict(islands=[], z_max=0.0, in_body=True)}
CLOTH = {'Cloth_Robe': dict(prefix='robe_skirt', chains=[('F', 0), ('FL', 45), ('L', 90), ('BL', 135)], half=22.5, n=3,
                            parent='pelvis', center='pelvis', edge_weights='neighbors')}
# loose islands that sit on an item go with it (user 2026-10-29 "cut the accessory parts again"; distances in s1):
# salt crystals on the rope, beads/leaves on the flask + the knot at its neck (31 = chest buckle, 46/50 = a small cap
# beside the jar: Body). The kelp strips
# at the R hip (54/57/58) hang from the belt, not the flask: Body.
ACC = {'rope': dict(islands=[43, 45, 48, 51, 55, 59, 61, 62], mode='rigid', n=1, parent='chest'),
       'flask': dict(islands=[28, 25, 29, 40, 42, 47, 69], mode='rigid', n=1, parent='pelvis'),
       'jar': dict(islands=[34, 35], mode='rigid', n=1, parent='pelvis')}
LM = dict(neck_mode='band', head_band=0.10)
PUSH_KW = dict(iters=6, smooth=0.7, rounds=6)
LAYER_SKIP = ('beads', 'flap_rope')

# texture zones (s0 HSV, 2026-10-29): rope h 0.08-0.09 s ~0.68; skin h ~0.06 s ~0.45; skirt teal h ~0.50 s > 0.5;
# trousers grey s ~0.12; flask glass s > 0.3 (water teal / rope tan), the buttock behind it is grey trousers
ROPE = dict(x=(-0.30, -0.05), z=(1.08, 1.53), h=(0.065, 0.13), s=0.55, v=0.12, min_comp=40)
# flask glass: island-1 vertices inside the box of the rope net (island 28) behind the buttock, not grey trousers
FLASK = dict(x=(-0.235, -0.025), y_min=0.075, z=(0.835, 1.075), s=0.18, under=0.025, under_y=0.12,
             x_out=-0.15, y_out=0.05)   # outside the buttock (x < -0.15) the glass side reaches y 0.054
# half-skirt: teal, and hanging off the leg: farther than the leg radius (90th pct of the grey trouser vertices round a
# per-slice leg axis) + SKIRT['gap']. The teal painted on the L buttock (trouser surface) stays Body.
FLASK_NECK = dict(r=0.03, z=(1.0, 1.15), y_min=0.13)   # axis = centroid of the net's top (z > 1.03)
SKIRT = dict(z=(0.50, 0.99), h=(0.40, 0.62), s=0.30, gap=0.012, slice=0.03)


def _rgb(ob):
    import bpy
    import numpy as np
    m = ob.data; n = len(m.vertices)
    img = next(im for im in bpy.data.images if 'basecolor' in im.name.lower())
    im = img.copy(); im.scale(1024, 1024); W, H = im.size
    px = np.empty(W * H * 4, dtype=np.float32); im.pixels.foreach_get(px); px = px.reshape(H, W, 4); bpy.data.images.remove(im)
    uv = m.uv_layers.active.data; acc = np.zeros((n, 3)); cnt = np.zeros(n)
    for li, lp in enumerate(m.loops):
        u, v = uv[li].uv
        acc[lp.vertex_index] += px[min(H - 1, max(0, int(v % 1.0 * H))), min(W - 1, max(0, int(u % 1.0 * W))), :3]
        cnt[lp.vertex_index] += 1
    return acc / np.maximum(cnt, 1)[:, None]


def _nbrs(m):
    import collections
    nb = collections.defaultdict(list)
    for e in m.edges:
        a_, b_ = e.vertices; nb[a_].append(b_); nb[b_].append(a_)
    return nb


def _clean(out, nb, zone, n, fill=3, keep=0.6, prune=0.3, min_comp=0):
    for _ in range(fill):
        out |= {i for i in range(n) if i not in out and zone(i) and nb[i] and sum(t in out for t in nb[i]) >= keep * len(nb[i])}
    out -= {i for i in out if nb[i] and sum(t in out for t in nb[i]) < prune * len(nb[i])}
    if min_comp:
        seen = set()
        for i in list(out):
            if i in seen:
                continue
            comp = [i]; seen.add(i); j = 0
            while j < len(comp):
                for t in nb[comp[j]]:
                    if t in out and t not in seen:
                        seen.add(t); comp.append(t)
                j += 1
            if len(comp) < min_comp:
                out -= set(comp)
    return out


def select(ob, lab):
    """Vertex sets cut from island 1 by position + texture: rope coil, flask glass, half-skirt."""
    import colorsys
    m = ob.data; V = m.vertices; n = len(V); rgb = _rgb(ob); nb = _nbrs(m)
    hsv = [colorsys.rgb_to_hsv(*rgb[i]) for i in range(n)]
    in1 = lambda i: lab[i] == 1
    R = ROPE
    rz = lambda i: in1(i) and R['x'][0] < V[i].co.x < R['x'][1] and R['z'][0] < V[i].co.z < R['z'][1]
    rope = {i for i in range(n) if rz(i) and R['h'][0] < hsv[i][0] < R['h'][1] and hsv[i][1] > R['s'] and hsv[i][2] > R['v']}
    rope = _clean(rope, nb, rz, n, fill=8, keep=0.5, min_comp=R['min_comp'])
    F = FLASK
    fz = lambda i: (in1(i) and F['x'][0] < V[i].co.x < F['x'][1]
                    and V[i].co.y > (F['y_out'] if V[i].co.x < F['x_out'] else F['y_min'])
                    and F['z'][0] < V[i].co.z < F['z'][1])
    flask = {i for i in range(n) if fz(i) and hsv[i][1] > F['s']}
    from mathutils import kdtree                # + the glass right under the net (pale highlights fail the colour test)
    net = [i for i in range(n) if lab[i] == 28]; kd = kdtree.KDTree(len(net))
    for i in net:
        kd.insert(V[i].co, i)
    kd.balance()
    flask |= {i for i in range(n) if fz(i) and V[i].co.y > F['under_y'] and kd.find(V[i].co)[2] < F['under']}
    flask = _clean(flask, nb, fz, n, fill=8, keep=0.5, min_comp=20)
    S = SKIRT
    teal = lambda i: S['h'][0] < hsv[i][0] < S['h'][1] and hsv[i][1] > S['s']
    grey = [i for i in range(n) if in1(i) and hsv[i][1] < 0.25 and S['z'][0] - 0.05 < V[i].co.z < S['z'][1] + 0.05
            and abs(V[i].co.x) > 0.01]
    def leg(c):
        """(axis x, axis y, radius) of the leg on c's side at c.z, from the grey trouser vertices."""
        G = [V[j].co for j in grey if abs(V[j].co.z - c.z) < S['slice'] and (V[j].co.x > 0) == (c.x > 0)]
        if len(G) < 6:
            return None
        ax = sum(g.x for g in G) / len(G); ay = sum(g.y for g in G) / len(G)
        d = sorted(((g.x - ax) ** 2 + (g.y - ay) ** 2) ** 0.5 for g in G)
        return ax, ay, d[int(0.9 * (len(d) - 1))]
    def off_leg(i):
        c = V[i].co; L_ = leg(c)
        return L_ is None or ((c.x - L_[0]) ** 2 + (c.y - L_[1]) ** 2) ** 0.5 > L_[2] + S['gap']
    sz = lambda i: in1(i) and S['z'][0] < V[i].co.z < S['z'][1] and i not in flask and not fz(i)
    skirt = {i for i in range(n) if sz(i) and teal(i) and off_leg(i)}
    skirt = _clean(skirt, nb, lambda i: sz(i) and teal(i), n, min_comp=30)
    # flask neck + cork above the glass (island 1, tied at the belt): near the net's top axis
    NK = FLASK_NECK
    top = [V[i].co for i in range(n) if lab[i] == 28 and V[i].co.z > 1.03]
    NK['c'] = (sum(p.x for p in top) / len(top), sum(p.y for p in top) / len(top))
    neck = {i for i in range(n) if in1(i) and NK['z'][0] < V[i].co.z < NK['z'][1] and V[i].co.y > NK['y_min']
            and ((V[i].co.x - NK['c'][0]) ** 2 + (V[i].co.y - NK['c'][1]) ** 2) ** 0.5 < NK['r']}
    flask |= neck
    return dict(rope=rope, flask=flask, skirt=skirt)


def s2_attrs(ob, lab, isl, info):
    """Head bits: small islands wholly above z 1.47 near the axis (hair strands, bun pin)."""
    V = ob.data.vertices; head = []
    for kk, c in enumerate(isl):
        if kk == 1:
            continue
        P = [V[i].co for i in c]
        if min(p.z for p in P) > 1.47 and max(abs(p.x) for p in P) < 0.14:
            head.append(kk)
    HEAD['islands'] = sorted(set([0] + head))
    info['head_islands'] = HEAD['islands']


# user 2026-10-29 11:08 split the accessory parts again in the Blender window (rig.blend): rope seam along the shoulder
# and the patch behind it, the flask neck/knot at the back belt, 26/27 and the kelp strips 54/57/58 -> Accessory, no
# weight edits. Saved as rig/<aid>_user_parts.json (vertex positions + item); s2 reproduces it by position (s1 coords).
USER_PARTS = 'BR_brinecaller_vB_user_parts.json'


def _user_parts(ob):
    import os, json, rigbatch as rb
    from mathutils import kdtree, Vector
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), *['..'] * 7))
    path = os.path.join(rb.asset_dir(root, 'BR_brinecaller_vB'), 'rig', USER_PARTS)
    if not os.path.isfile(path):
        return None
    rows = json.load(open(path, encoding='utf-8'))['verts']
    kd = kdtree.KDTree(len(rows))
    for j, r in enumerate(rows):
        kd.insert(Vector(r[:3]), j)
    kd.balance(); out = {}
    for v in ob.data.vertices:
        co, j, d = kd.find(v.co)
        if d < 2e-4:
            out[v.index] = rows[j][4]
    return out


def s2_labels(ob, lab, isl, info):
    import sys, stages
    A = sys.modules[__name__]
    labels = stages.default_labels(A, ob, lab, isl)
    sel = select(ob, lab)
    at = ob.data.attributes.get('rb_acc') or ob.data.attributes.new('rb_acc', 'INT', 'POINT')
    nf = {}
    for name in ('rope', 'flask'):
        code = list(ACC).index(name) + 1; S = sel.get(name, set())
        for p in ob.data.polygons:
            if labels[p.index] == 'Body' and all(v in S for v in p.vertices):
                labels[p.index] = 'Accessory'; nf[name] = nf.get(name, 0) + 1
                for v in p.vertices:
                    at.data[v].value = code
    up = _user_parts(ob)
    if up:                                   # user's split in Blender wins: every vertex of the saved Accessory
        nu = 0
        allu = set(up)
        for p in ob.data.polygons:
            if labels[p.index] == 'Body' and all(v in allu for v in p.vertices):
                labels[p.index] = 'Accessory'; nu += 1
        for i, name in up.items():
            at.data[i].value = list(ACC).index(name) + 1
        nf['user_faces'] = nu; info['user_parts'] = {n_: sum(1 for x in up.values() if x == n_) for n_ in ACC}
    S = sel['skirt']; fs = stages.INBODY_FACES.setdefault('Cloth_Robe', [])
    for p in ob.data.polygons:
        if labels[p.index] == 'Body' and all(v in S for v in p.vertices):
            fs.append(p.index)
    nf['skirt'] = len(fs)
    info['cut_faces'] = nf
    return labels


# accessory pieces cut from island 1 (rope, flask glass): the Body edge along the cut takes the item bone, blending back
# over SEAM_BAND (geodesic), as D04's sack / P07's cage
SEAM_BAND = dict(rope_01=0.05, flask_01=0.04)


def _seam(part, acc, rep, key):
    import rigbatch as rb
    rc = rb.rc
    if acc is None:
        return
    at = acc.data.attributes['rb_acc']; names = list(ACC)
    cm = rb.coincident_map(part, acc)          # body vertex -> accessory vertex
    for bone, band in SEAM_BAND.items():
        code = names.index(bone.rsplit('_', 1)[0]) + 1
        cut = {i for i, j in cm.items() if at.data[j].value == code}
        if not cut:
            continue
        lbl, dist = rb.geodesic_voronoi(part, {i: i for i in cut}, lambda i: True)
        n = 0
        for i, d in dist.items():
            if d < band:
                rc.set_weights(part, i, rb.blend({bone: 1.0}, rb.vertex_weights(part, i), rc.sm(0.0, band, d))); n += 1
        rep[f'{key}_{bone}'] = dict(cut=len(cut), band=n)


# small loose pieces in Body (belt ring + bead, pouches, kelp strips, crystals, arm bands): one weight set per island
# (the mean of its own skin weights, top 4), so a piece on the hip line moves as one block. s5 2026-10-29: the ring on
# the L front hip (island 17) was half pelvis, half L_Thigh: kick 35x, sit 40x.
UNIFORM_MAX = 400


def _uniform_islands(body, rep):
    import collections
    import rigbatch as rb
    rc = rb.rc; ai = body.data.attributes['rb_isl']; groups = collections.defaultdict(list)
    for v in body.data.vertices:
        kk = ai.data[v.index].value
        if kk != 1:
            groups[kk].append(v.index)
    n = 0
    for kk, vs in groups.items():
        if len(vs) > UNIFORM_MAX:
            continue
        avg = collections.Counter()
        for i in vs:
            for g, x in rb.vertex_weights(body, i).items():
                avg[g] += x / len(vs)
        top = dict(avg.most_common(4)); t = sum(top.values())
        for i in vs:
            rc.set_weights(body, i, {g: x / t for g, x in top.items()})
        n += 1
    rep['uniform_islands'] = n


# user 2026-10-29 ("the head bone puts too much weight into the neck"): head was 1.0 down to z 1.48 (neck joint 1.46,
# head joint 1.55, chin ~1.52). Head weight capped by height: chin/jaw in front of y CHIN_Y full from z CHIN_Z[1], none
# below CHIN_Z[0]; elsewhere (neck, nape) full from NECK_Z[1], none below NECK_Z[0]. The share taken off goes to neck.
CHIN_Y = (-0.06, -0.08)
CHIN_Z = (1.50, 1.53)
NECK_Z = (1.535, 1.575)


def _head_mask(part, rep, key):
    import rigbatch as rb
    rc = rb.rc; n = 0; ai = part.data.attributes.get('rb_isl')
    for v in part.data.vertices:
        if ai is not None and ai.data[v.index].value != 1:
            continue                       # hair strands / bun pieces stay all head (strand tips hang below the mask)
        c = v.co; w = rb.vertex_weights(part, v.index); h = w.get('head', 0.0)
        if h <= 0:
            continue
        fc = rc.sm(CHIN_Y[0], CHIN_Y[1], c.y)
        cap = fc * rc.sm(CHIN_Z[0], CHIN_Z[1], c.z) + (1 - fc) * rc.sm(NECK_Z[0], NECK_Z[1], c.z)
        if h > cap + 1e-4:
            w['head'] = cap; w['neck'] = w.get('neck', 0.0) + h - cap
            rc.set_weights(part, v.index, {k: x for k, x in w.items() if x > 1e-4}); n += 1
    rep[key] = n


def body_weights_fix(body, rig, rep):
    import stages
    parts = stages.parts_by_role()
    _seam(body, parts.get('Accessory'), rep, 'seam_body')
    _uniform_islands(body, rep)
    _head_mask(body, rep, 'head_mask_body')
    if parts.get('Head') is not None:
        _head_mask(parts['Head'], rep, 'head_mask_head')


def landmarks_fix(L, parts, notes):
    """Hand is part of island 1, so the wrist came from proportion (0.577: a 0.28 m hand). From the arm close-up
    (an_armL_front): bracer ends at |x| 0.70 (wrist), thumb root 0.745, tips 0.853; upper arm narrows into the elbow
    at ~0.445 just above the bracer start (0.47)."""
    e = L['elbow']; w = L['wrist']
    L['elbow'] = (0.445, e[1], 1.400)
    L['wrist'] = (0.698, w[1], 1.402)
    notes.append('elbow/wrist set from the arm close-up (wrist 0.577 -> 0.698, elbow 0.411 -> 0.445)')


# user 2026-10-29 ("fix the skirt stuck to the thigh bone"): the BL/L panels are fused to the trouser surface along the
# back/side of the L thigh; the region edge took L_Thigh 1.0 but the next ring was all chain (kick/sit 20x). Skirt vertices
# within LEG_BAND (geodesic, inside the skirt) of an edge vertex touching leg skin (main bone *_Thigh / *_Calf) blend from
# that leg skin's weights to their chain weights.
LEG_BAND = 0.06


def cloth_weights_fix(parts, rig, chains, rep):
    import collections
    import rigbatch as rb
    rc = rb.rc; body = parts['Body']; m = body.data; ac = m.attributes.get('rb_cloth')
    if ac is None:
        return
    R = {i for i in range(len(m.vertices)) if ac.data[i].value}
    nbr = collections.defaultdict(list)
    for e in m.edges:
        a_, b_ = e.vertices
        if (a_ in R) != (b_ in R):
            i, j = (a_, b_) if a_ in R else (b_, a_)
            nbr[i].append(j)
    seeds = {}
    for i, js in nbr.items():
        acc = collections.Counter()
        for j in js:
            w = rb.vertex_weights(body, j)
            if w and ('Thigh' in max(w, key=w.get) or 'Calf' in max(w, key=w.get)):
                for g, x in w.items():
                    acc[g] += x
        t = sum(acc.values())
        if t > 0:
            seeds[i] = {g: x / t for g, x in acc.items()}
    if not seeds:
        return
    lbl, dist = rb.geodesic_voronoi(body, {i: i for i in seeds}, lambda i: i in R)
    n = 0
    keep = m.attributes.get('rb_keep_thigh') or m.attributes.new('rb_keep_thigh', 'INT', 'POINT')
    for i, d in dist.items():
        if i in R and d < LEG_BAND and lbl.get(i) in seeds:
            rc.set_weights(body, i, rb.blend(seeds[lbl[i]], rb.vertex_weights(body, i), rc.sm(0.0, LEG_BAND, d))); n += 1
            keep.data[i].value = 1         # s5 strips thigh weights from cloth: rb.push_setup keeps these (opt-in flag)
    rc.finalize_weights(body)
    rep['skirt_leg_seam'] = dict(seeds=len(seeds), band=n)


# layers + springs (spring_layers.py, G1 2026-10-29): half-skirt F/FL/L/BL in Body (skirt presets); flask and jar meshes
# are rigid on their own bone and that bone swings (spring, accessory preset); the rope coil is rigid (no spring)
SPRING = dict(collections={'Skirt': ['robe_skirt_'], 'Accessory': ['rope_', 'flask_', 'jar_']},
              chains={'rope_01': dict(enabled=False)},
              # auto radii followed the cloth: pelvis sphere 0.186 (belt + skirt roots), L_Thigh 0.129 (the skirt panel on it,
              # R_Thigh 0.087) -> by hand so the colliders sit inside the skirt; knee spheres (0.097, top ~z 0.58) kept
              radius={'pelvis': 0.13, 'L_Thigh': 0.087})
