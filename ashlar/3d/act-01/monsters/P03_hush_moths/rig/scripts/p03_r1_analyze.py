"""P03 Hush-Moths, R0-R1: measure the GLB for the rig brief (headless Blender 5.1, GLB read only).

blender -b --factory-startup -P p03_r1_analyze.py -- <glb> <out_dir> <height_m>

Intake with the rig_v1 helper (one welded mesh, uniform scale to height_m, feet on z = 0, facing -Y), then:
islands and their role (body, head, eyes, antenna, wings, legs), mirror symmetry, the front leg that is welded
into the body, a centre line + radius profile per leg (geodesic bins from the root), the body profile along y,
wing planes / roots / tips / the fore-hind gap, antenna axes. Writes <out_dir>/r1_analysis.json and renders
(texture, island roles, 1024 px) with camera sidecars for grids.
"""
import bpy, bmesh, sys, os, json, math, heapq
import numpy as np
from mathutils import Vector, kdtree

TOOLS = 'D:/Claude/Diablo2/ashlar/3d/act-01/_batches/rig_v1/tools'
sys.path.insert(0, TOOLS)
import rigbatch as rb  # noqa: E402

argv = sys.argv[sys.argv.index('--') + 1:]
GLB, OUT, HEIGHT = argv[0], argv[1], float(argv[2])
os.makedirs(OUT, exist_ok=True)

ob, info = rb.intake(GLB, 'P03_hush_moths', HEIGHT)
me = ob.data
S = info['scale']                         # metres per GLB unit
CO = np.array([v.co[:] for v in me.vertices])
N = len(CO)
U = CO / S                                # normalised (GLB) units, for rules written from the R0 numbers
lab, isl = rb._islands(ob)

# edges for geodesics
E = np.array([e.vertices[:] for e in me.edges])
adj = [[] for _ in range(N)]
for a, b in E:
    d = float(np.linalg.norm(CO[a] - CO[b]))
    adj[a].append((b, d)); adj[b].append((a, d))
edge_len = np.linalg.norm(CO[E[:, 0]] - CO[E[:, 1]], axis=1)


def pca(P):
    c = P.mean(0); w, V = np.linalg.eigh(np.cov((P - c).T))
    o = np.argsort(w)[::-1]
    return c, w[o], V[:, o].T            # axes rows: major, mid, minor (minor = plane normal)


def r(v, n=4):
    return [round(float(x), n) for x in v]


# ---------------------------------------------------------------- island roles
rows = []
order = sorted(range(len(isl)), key=lambda i: -len(isl[i]))
body_i = order[0]
for i in order:
    idx = np.array(isl[i]); P = U[idx]; c = P.mean(0); lo = P.min(0); hi = P.max(0)
    if i == body_i:
        role = 'body'
    elif hi[0] - lo[0] > 0.25 and c[2] > 0.25:
        role = 'wing_F'
    elif hi[0] - lo[0] > 0.2 and 0.08 < c[2] < 0.22:
        role = 'wing_B'
    elif lo[2] < 0.02:
        role = 'leg'
    elif c[2] > 0.26 and c[1] < -0.04:
        role = 'antenna'
    elif len(idx) > 150 and abs(c[0]) < 0.02:
        role = 'head'
    elif len(idx) < 80 and c[1] < -0.06 and 0.17 < c[2] < 0.26:
        role = 'eye'
    else:
        role = 'other'
    side = '' if role in ('body', 'head') else ('L' if c[0] > 0 else 'R')   # facing -Y: the moth's left is +X
    rows.append(dict(id=i, n=len(idx), role=role, side=side, c=r(c * S), lo=r(lo * S), hi=r(hi * S)))

role_of = {rw['id']: (rw['role'], rw['side']) for rw in rows}

# ---------------------------------------------------------------- mirror symmetry (per island, metres)
kd_all = kdtree.KDTree(N)
for i, p in enumerate(CO):
    kd_all.insert(p, i)
kd_all.balance()
mir_d = np.array([kd_all.find((-p[0], p[1], p[2]))[2] for p in CO])
sym = {}
for rw in rows:
    d = mir_d[isl[rw['id']]]
    rw['mirror_mm'] = [round(float(np.mean(d)) * 1000, 2), round(float(np.max(d)) * 1000, 2)]
sym['all_mean_mm'] = round(float(mir_d.mean()) * 1000, 2)
sym['all_p95_mm'] = round(float(np.percentile(mir_d, 95)) * 1000, 2)
sym['all_max_mm'] = round(float(mir_d.max()) * 1000, 2)
sym['centre_x_mm'] = round(float((CO[:, 0].min() + CO[:, 0].max()) / 2) * 1000, 3)

# ---------------------------------------------------------------- legs: separate islands + the one welded into the body
legs = [rw for rw in rows if rw['role'] == 'leg']
body_idx = np.array(isl[body_i])
leg_sets = {}
for rw in legs:
    leg_sets[rw['id']] = dict(idx=np.array(isl[rw['id']]), side=rw['side'], src='island')
# a leg whose mirror twin is an island but which itself is missing -> it is welded into the body
twin_found = set()
for a in legs:
    for b in legs:
        if a is not b and a['side'] != b['side'] and np.linalg.norm(np.array(a['c']) * [-1, 1, 1] - np.array(b['c'])) < 0.02:
            twin_found.add(a['id'])
welded = []
for rw in legs:
    if rw['id'] in twin_found:
        continue
    kd = kdtree.KDTree(len(isl[rw['id']]))
    for j, vi in enumerate(isl[rw['id']]):
        kd.insert(CO[vi], j)
    kd.balance()
    tol = 0.004 * S
    hit = [vi for vi in body_idx if kd.find((-CO[vi][0], CO[vi][1], CO[vi][2]))[2] < tol and
           np.sign(CO[vi][0]) == -np.sign(rw['c'][0])]
    side = 'R' if rw['side'] == 'L' else 'L'
    key = f'body_leg_{side}'
    leg_sets[key] = dict(idx=np.array(hit), side=side, src=f'welded into body, mirror of island {rw["id"]}')
    welded.append(dict(key=key, n=len(hit), twin=rw['id'], twin_n=rw['n']))


def dijkstra(src, allowed):
    dist = {src: 0.0}; h = [(0.0, src)]
    while h:
        d, a = heapq.heappop(h)
        if d > dist.get(a, 1e9):
            continue
        for b, w in adj[a]:
            if b in allowed and d + w < dist.get(b, 1e9):
                dist[b] = d + w; heapq.heappush(h, (d + w, b))
    return dist


body_axis_x = 0.0
leg_rows = []
for key, L in leg_sets.items():
    idx = L['idx']
    if len(idx) == 0:
        continue
    allowed = set(int(i) for i in idx)
    P = CO[idx]
    zmin = P[:, 2].min()
    # tip: among the lowest verts, the one farthest from the body centre (x 0, y 0) horizontally
    low = idx[P[:, 2] < zmin + 0.004 * S]
    tip = int(max(low, key=lambda i: math.hypot(CO[i][0], CO[i][1])))
    d_tip = dijkstra(tip, allowed)
    root = int(max(d_tip, key=d_tip.get))
    d_root = dijkstra(root, allowed)
    verts = np.array(list(d_root.keys())); g = np.array([d_root[i] for i in verts])
    nb = 28; edges = np.linspace(0, g.max() + 1e-9, nb + 1)
    prof = []
    for k in range(nb):
        m = (g >= edges[k]) & (g < edges[k + 1])
        if m.sum() < 3:
            continue
        Q = CO[verts[m]]; c = Q.mean(0)
        prof.append(dict(s=round(float((edges[k] + edges[k + 1]) / 2), 4), n=int(m.sum()), c=r(c),
                         rad=round(float(np.linalg.norm(Q - c, axis=1).mean()), 4)))
    unreached = len(idx) - len(verts)
    leg_rows.append(dict(key=str(key), side=L['side'], src=L['src'], n=int(len(idx)), unreached=int(unreached),
                         root=r(CO[root]), tip=r(CO[tip]), length_geo=round(float(g.max()), 4), profile=prof))

# order legs front -> back per side (by root y), name Leg1..3
for side in ('L', 'R'):
    ls = sorted([lr for lr in leg_rows if lr['side'] == side], key=lambda lr: lr['tip'][1])
    for k, lr in enumerate(ls):
        lr['name'] = f'{side}_Leg{k + 1}'

# ---------------------------------------------------------------- body profile along y (side view), legs removed
leg_v = set()
for L in leg_sets.values():
    leg_v |= set(int(i) for i in L['idx'])
core = np.array([i for i in body_idx if int(i) not in leg_v])
Pc = CO[core]
ys = np.arange(Pc[:, 1].min(), Pc[:, 1].max() + 0.01 * S, 0.01 * S)
body_prof = []
for y0 in ys:
    m = (Pc[:, 1] >= y0) & (Pc[:, 1] < y0 + 0.01 * S)
    if m.sum() < 4:
        continue
    Q = Pc[m]
    body_prof.append(dict(y=round(float(y0 + 0.005 * S), 4), n=int(m.sum()), z=[round(float(Q[:, 2].min()), 4),
                     round(float(Q[:, 2].max()), 4)], x=[round(float(Q[:, 0].min()), 4), round(float(Q[:, 0].max()), 4)],
                     zc=round(float(Q[:, 2].mean()), 4)))
# z slices (front view)
zs = np.arange(0, Pc[:, 2].max() + 0.01 * S, 0.01 * S)
body_zprof = []
for z0 in zs:
    m = (Pc[:, 2] >= z0) & (Pc[:, 2] < z0 + 0.01 * S)
    if m.sum() < 4:
        continue
    Q = Pc[m]
    body_zprof.append(dict(z=round(float(z0 + 0.005 * S), 4), n=int(m.sum()), x=[round(float(Q[:, 0].min()), 4),
                      round(float(Q[:, 0].max()), 4)], y=[round(float(Q[:, 1].min()), 4), round(float(Q[:, 1].max()), 4)]))

# ---------------------------------------------------------------- wings
wings = {}
for rw in rows:
    if not rw['role'].startswith('wing'):
        continue
    idx = np.array(isl[rw['id']]); P = CO[idx]
    c, w, A = pca(P)
    nrm = A[2] if A[2][1] >= 0 else -A[2]
    ax = np.abs(P[:, 0])
    root_pts = P[ax < ax.min() + 0.02 * S]
    tip = P[np.argmax(ax)]
    # thickness: spread along the normal
    t = (P - c) @ nrm
    # leading edge (front-most = min y) and trailing edge per span band
    bands = []
    for f in np.linspace(0.05, 0.95, 10):
        x0 = ax.min() + f * (ax.max() - ax.min())
        m = np.abs(ax - x0) < 0.012 * S
        if m.sum() < 2:
            continue
        Q = P[m]
        bands.append(dict(f=round(float(f), 2), zmax=round(float(Q[:, 2].max()), 4), zmin=round(float(Q[:, 2].min()), 4),
                          ymin=round(float(Q[:, 1].min()), 4), ymax=round(float(Q[:, 1].max()), 4)))
    wings[f"{rw['side']}_{rw['role']}"] = dict(id=rw['id'], n=len(idx), centroid=r(c), normal=r(nrm), axes=[r(a) for a in A],
                                              spread=r(np.sqrt(w)), thickness_mm=[round(float(t.min()) * 1000, 1), round(float(t.max()) * 1000, 1)],
                                              root=r(root_pts.mean(0)), root_lo=r(root_pts.min(0)), root_hi=r(root_pts.max(0)),
                                              tip=r(tip), bands=bands)
# fore-hind gap per side: distance from each hind-wing vertex to the fore wing surface
gaps = {}
for side in ('L', 'R'):
    f = wings.get(f'{side}_wing_F'); b = wings.get(f'{side}_wing_B')
    if not (f and b):
        continue
    fidx = isl[f['id']]; bidx = isl[b['id']]
    bm = bmesh.new(); bm.from_mesh(me); bm.verts.ensure_lookup_table(); bm.faces.ensure_lookup_table()
    keep = set(fidx)
    from mathutils.bvhtree import BVHTree
    fverts = [CO[i] for i in range(N)]
    ffaces = [[v.index for v in fc.verts] for fc in bm.faces if all(v.index in keep for v in fc.verts)]
    bvh = BVHTree.FromPolygons(fverts, ffaces)
    bm.free()
    dd = []
    for vi in bidx:
        hit = bvh.find_nearest(Vector(CO[vi]))
        dd.append(hit[3] if hit[0] is not None else 1.0)
    dd = np.array(dd)
    close = np.array(bidx)[dd < 0.01]
    gaps[side] = dict(min_mm=round(float(dd.min()) * 1000, 2), p5_mm=round(float(np.percentile(dd, 5)) * 1000, 2),
                      n_within_5mm=int((dd < 0.005).sum()), n_within_10mm=int((dd < 0.01).sum()),
                      close_region=dict(lo=r(CO[close].min(0)) if len(close) else None, hi=r(CO[close].max(0)) if len(close) else None))

# ---------------------------------------------------------------- antennae, head, eyes
ant = {}
for side in ('L', 'R'):
    ids = [rw['id'] for rw in rows if rw['role'] == 'antenna' and rw['side'] == side]
    if not ids:
        continue
    idx = np.concatenate([isl[i] for i in ids]); P = CO[idx]
    c, w, A = pca(P)
    lowest = P[np.argmin(P[:, 2])]; highest = P[np.argmax(P[:, 2])]
    main = max(ids, key=lambda i: len(isl[i]))
    Pm = CO[isl[main]]
    ant[side] = dict(islands=ids, n=int(len(idx)), base=r(lowest), tip=r(highest), centroid=r(c), axis=r(A[0]),
                     main_island=main, main_base=r(Pm[np.argmin(Pm[:, 2])]), main_tip=r(Pm[np.argmax(Pm[:, 2])]))
head = [rw for rw in rows if rw['role'] == 'head']
eyes = [rw for rw in rows if rw['role'] == 'eye']

bb_lo = CO.min(0); bb_hi = CO.max(0)
res = dict(asset='P03_hush_moths', info=info, scale_glb_to_m=S, bbox=dict(lo=r(bb_lo), hi=r(bb_hi), size=r(bb_hi - bb_lo)),
           verts=N, faces=len(me.polygons), edges=len(me.edges), edge_len_mm=dict(mean=round(float(edge_len.mean()) * 1000, 2),
           p5=round(float(np.percentile(edge_len, 5)) * 1000, 2), p95=round(float(np.percentile(edge_len, 95)) * 1000, 2)),
           islands=rows, symmetry=sym, welded_legs=welded, legs=leg_rows, body_profile_y=body_prof, body_profile_z=body_zprof,
           wings=wings, wing_gaps=gaps, antennae=ant, head=head, eyes=eyes)
with open(os.path.join(OUT, 'r1_analysis.json'), 'w', encoding='utf-8') as f:
    json.dump(res, f, indent=1, ensure_ascii=False)

# ---------------------------------------------------------------- renders: texture + island roles (+ leg centre lines)
ROLE_COL = {'body': (0.85, 0.62, 0.52), 'head': (0.35, 0.55, 0.95), 'eye': (0.95, 0.2, 0.2), 'antenna': (0.6, 0.3, 0.9),
            'wing_F': (0.3, 0.8, 0.45), 'wing_B': (0.2, 0.75, 0.85), 'leg': (0.95, 0.8, 0.15), 'other': (1, 0, 1)}
cols = [ROLE_COL[role_of[lab[i]][0]] for i in range(N)]
for key, L in leg_sets.items():
    if str(key).startswith('body_leg'):
        for i in L['idx']:
            cols[int(i)] = (0.95, 0.45, 0.1)
rb.set_point_colors(ob, cols)

# centre-line markers
bm = bmesh.new()
for lr in leg_rows:
    for p in lr['profile']:
        bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.0035, matrix=__import__('mathutils').Matrix.Translation(p['c']))
for p in body_prof:
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.003,
                               matrix=__import__('mathutils').Matrix.Translation((0, p['y'], (p['z'][0] + p['z'][1]) / 2)))
mk = bpy.data.meshes.new('_marks'); bm.to_mesh(mk); bm.free()
mo = bpy.data.objects.new('_marks', mk); bpy.context.scene.collection.objects.link(mo)
rb.set_point_colors(mo, [(0.05, 0.05, 0.05)] * len(mk.vertices))

pre = os.path.join(OUT, 'p03')
rb.render_views(pre + '_tex', [ob], views=('front', 'left', 'back', 'topdown', 'three_quarter'), color_type='TEXTURE', res=1024)
rb.render_views(pre + '_role', [ob, mo], views=('front', 'left', 'topdown'), color_type='VERTEX', res=1024, frame_objs=[ob])
rb.render_views(pre + '_rolex', [ob, mo], views=('front', 'left', 'topdown'), color_type='VERTEX', res=1024, frame_objs=[ob],
                xray=True)
print('R1_ANALYZE_DONE', OUT)
