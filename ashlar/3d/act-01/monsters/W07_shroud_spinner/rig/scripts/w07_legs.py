"""Leg analysis for W07 (system Python: py -3.11 -I w07_legs.py). Reads rig/_work/w07_mesh.npz.

Per leg of the creature's left side (+X; the mesh is mirror-symmetric about x = 0, checked here):
  - split the fused front island (Leg1 + Leg2 share one island) by geodesic Voronoi from the two tips,
  - medial polyline = centroids of geodesic-distance bands from the tip (tube cross-sections),
  - best piecewise-linear fit with 3 (and 4) segments -> joint candidates,
  - band radius profile (joint rings show as bumps).
Writes rig/_work/legs.json and rig/_work/legs_profiles.png (each leg unrolled in its vertical plane).
"""
import os, sys, json, heapq, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
WORK = os.path.join(os.path.dirname(HERE), '_work')
D = np.load(os.path.join(WORK, 'w07_mesh.npz'))
co, tris, rep, isl = D['co'], D['tris'], D['rep'], D['island']
W = np.unique(rep)                       # welded vertex ids (representatives)
wid = -np.ones(len(co), dtype=np.int64); wid[W] = np.arange(len(W))
cw = co[W]; iw = isl[W]
nb = [dict() for _ in range(len(W))]
for t in tris:
    a, b, c = wid[rep[t[0]]], wid[rep[t[1]]], wid[rep[t[2]]]
    for u, v in ((a, b), (b, c), (c, a)):
        if u != v:
            d = float(np.linalg.norm(cw[u] - cw[v])); nb[u][v] = d; nb[v][u] = d

# mirror symmetry check: every welded vertex has a partner at (-x, y, z)
from collections import defaultdict
grid = defaultdict(list)
q = 1e-3
for i, p in enumerate(cw):
    grid[(round(p[0] / q), round(p[1] / q), round(p[2] / q))].append(i)
miss = 0; dmax = 0.0
for i, p in enumerate(cw):
    m = np.array([-p[0], p[1], p[2]]); best = 1e9
    kx, ky, kz = round(m[0] / q), round(m[1] / q), round(m[2] / q)
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            for dz in (-1, 0, 1):
                for j in grid.get((kx + dx, ky + dy, kz + dz), ()):
                    best = min(best, float(np.linalg.norm(cw[j] - m)))
    if best > 2e-3:
        miss += 1
    else:
        dmax = max(dmax, best)
SYM = dict(unmatched_over_2mm=miss, max_pair_dist_m=round(dmax, 6), welded=len(W))
print('symmetry', SYM)


def dijkstra(srcs, allowed):
    dist = {}; pq = []
    for s in srcs:
        dist[s] = 0.0; pq.append((0.0, s))
    heapq.heapify(pq)
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        for v, w in nb[u].items():
            if v in allowed:
                nd = d + w
                if nd < dist.get(v, 1e18):
                    dist[v] = nd; heapq.heappush(pq, (nd, v))
    return dist


def island_verts(k):
    return set(np.nonzero(iw == k)[0].tolist())


def tip_of(vs, key):
    return min(vs, key=key)


# ------------------------------------------------------------------ legs on +X
legs = {}
I3 = island_verts(3)          # Leg1 + Leg2 fused (+X)
t1 = tip_of(I3, lambda i: cw[i][1])            # frontmost (min y)
t2 = tip_of(I3, lambda i: -cw[i][0] + 3 * cw[i][2])   # outermost low
d1 = dijkstra([t1], I3); d2 = dijkstra([t2], I3)
L1 = {i for i in I3 if d1[i] <= d2[i]}; L2 = I3 - L1
legs['Leg1'] = (L1, t1)
legs['Leg2'] = (L2, t2)
I7 = island_verts(7); legs['Leg3'] = (I7, tip_of(I7, lambda i: -cw[i][0] + 3 * cw[i][2]))
I4 = island_verts(4); legs['Leg4'] = (I4, tip_of(I4, lambda i: -cw[i][0] - cw[i][1] + 3 * cw[i][2]))
I12 = island_verts(12); legs['orphan'] = (I12, tip_of(I12, lambda i: cw[i][2] - 0.2 * cw[i][1]))
I10 = island_verts(10); legs['palp'] = (I10, tip_of(I10, lambda i: cw[i][1]))      # pedipalp: tip = frontmost
I15 = island_verts(15); legs['fang'] = (I15, tip_of(I15, lambda i: cw[i][2]))      # fang tip = lowest


def bands(vs, tip, step):
    d = dijkstra([tip], vs)
    L = max(d.values()); n = max(3, int(math.ceil(L / step)))
    acc = [[] for _ in range(n)]
    for i, x in d.items():
        acc[min(n - 1, int(x / L * n))].append(i)
    out = []
    for b in acc:
        if len(b) < 3:
            continue
        P = cw[b]; c = P.mean(axis=0)
        out.append(dict(d=float(np.mean([d[i] for i in b])), c=c, r=float(np.mean(np.linalg.norm(P - c, axis=1))), n=len(b)))
    return out, d, L


def seg_fit(P, k):
    """Best k-segment polyline through ordered points P (n x 3), breakpoints at points. Returns (cost, idx list)."""
    n = len(P)

    def cost(i, j):          # sum of squared distances of P[i..j] to segment P[i]P[j]
        a, b = P[i], P[j]; ab = b - a; L2 = float(ab @ ab)
        Q = P[i:j + 1] - a
        if L2 < 1e-12:
            return float((Q * Q).sum())
        t = np.clip(Q @ ab / L2, 0, 1)
        R = Q - np.outer(t, ab)
        return float((R * R).sum())
    C = np.full((n, n), np.inf)
    for i in range(n):
        for j in range(i + 1, n):
            C[i, j] = cost(i, j)
    # DP: best[m][j] = min cost covering 0..j with m segments
    best = np.full((k + 1, n), np.inf); arg = np.zeros((k + 1, n), dtype=int)
    best[0][0] = 0.0
    for m in range(1, k + 1):
        for j in range(1, n):
            vals = best[m - 1][:j] + C[:j, j]
            i = int(np.argmin(vals)); best[m][j] = vals[i]; arg[m][j] = i
    idx = [n - 1]; j = n - 1
    for m in range(k, 0, -1):
        j = arg[m][j]; idx.append(j)
    return float(best[k][n - 1]), idx[::-1]


res = {'symmetry': SYM}
for name, (vs, tip) in legs.items():
    step = 0.02 if name not in ('fang', 'palp') else 0.012
    B, dist, L = bands(vs, tip, step)
    P = np.array([b['c'] for b in B])
    fits = {}
    for k in (2, 3, 4):
        if len(P) > k + 1:
            c, idx = seg_fit(P, k)
            fits[k] = dict(cost=round(c, 5), idx=[int(i) for i in idx], pts=[[round(float(x), 4) for x in P[i]] for i in idx],
                           seglen=[round(float(np.linalg.norm(P[idx[m + 1]] - P[idx[m]])), 4) for m in range(k)])
    res[name] = dict(n=len(vs), tip=[round(float(x), 4) for x in cw[tip]], geo_len=round(float(L), 4),
                     bands=[dict(d=round(b['d'], 4), c=[round(float(x), 4) for x in b['c']], r=round(b['r'], 4), n=b['n']) for b in B],
                     fits=fits, verts=sorted(int(W[i]) for i in vs))
    print(f"{name}: n {len(vs)} tip {res[name]['tip']} geo {L:.3f}")
    for k, f in fits.items():
        print(f"   k={k} cost {f['cost']:.5f} seg {f['seglen']} pts {f['pts']}")

with open(os.path.join(WORK, 'legs.json'), 'w') as f:
    json.dump(res, f, indent=1)

# ------------------------------------------------------------------ profile sheet: each leg in its own vertical plane
def font(sz):
    for fn in ('arialbd.ttf', 'arial.ttf'):
        try:
            return ImageFont.truetype(fn, sz)
        except OSError:
            pass
    return ImageFont.load_default()


cell = 520; names = list(legs.keys()); cols = 4; rows = (len(names) + cols - 1) // cols
S = Image.new('RGB', (cols * cell, rows * cell), (34, 34, 38)); dr = ImageDraw.Draw(S); f = font(15)
for k, name in enumerate(names):
    vs, tip = legs[name]; r = res[name]
    P = cw[sorted(vs)]
    root = np.array(r['bands'][-1]['c']); tp = cw[tip]
    h = (tp - root); h[2] = 0; h = h / (np.linalg.norm(h) + 1e-9)          # horizontal axis root -> tip
    up = np.array([0, 0, 1.0])
    def uv(p):
        return float((p - root) @ h), float(p[2])
    U = np.array([uv(p) for p in P])
    u0, u1 = U[:, 0].min() - 0.05, U[:, 0].max() + 0.05; v0, v1 = min(0, U[:, 1].min()) - 0.05, U[:, 1].max() + 0.05
    sc = (cell - 40) / max(u1 - u0, v1 - v0)
    ox = (k % cols) * cell + 20; oy = (k // cols) * cell + 30
    def px(u, v):
        return ox + (u - u0) * sc, oy + (cell - 50) - (v - v0) * sc
    # ground line
    dr.line([px(u0, 0), px(u1, 0)], fill=(90, 90, 90))
    for (u, v) in U:
        x, y = px(u, v); dr.point((x, y), fill=(150, 150, 160))
    pts = [px(*uv(np.array(b['c']))) for b in r['bands']]
    dr.line(pts, fill=(255, 200, 80), width=2)
    for kk, col in ((3, (90, 220, 255)), (4, (255, 90, 160))):
        if kk in r['fits']:
            fp = [px(*uv(np.array(p))) for p in r['fits'][kk]['pts']]
            dr.line(fp, fill=col, width=2)
            for x, y in fp:
                dr.ellipse([x - 5, y - 5, x + 5, y + 5], outline=col, width=2)
    dr.text((ox, oy - 24), f"{name}  geo {r['geo_len']:.2f} m  (yellow medial, cyan 3-seg, pink 4-seg)", fill=(255, 225, 120), font=f)
S.save(os.path.join(WORK, 'legs_profiles.png'))
print('PROFILES', os.path.join(WORK, 'legs_profiles.png'))
