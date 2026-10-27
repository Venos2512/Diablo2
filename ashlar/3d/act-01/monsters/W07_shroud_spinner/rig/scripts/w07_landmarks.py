"""W07 landmarks for the rig (system Python: py -3.11 -I w07_landmarks.py). Reads rig/_work/w07_mesh.npz.

Legs, palps, fangs and the orphan rear leg pieces are straight faceted bars. Joints = intersections of the
bar axes, found by "k-lines": vertices are assigned to the nearest segment of the current joint chain, a line
is fitted to each bar (PCA), and interior joints move to the closest-approach midpoint of consecutive bar
axes (or the gap midpoint when two bars are nearly collinear). Initialised from a dynamic-programming polyline
fit of the geodesic medial curve. Both sides are measured; the rig uses the mirror average (the mesh is
mirror-symmetric at island level; per-vertex topology is not).

Writes rig/_work/landmarks.json.
"""
import os, json, heapq, math
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
WORK = os.path.join(os.path.dirname(HERE), '_work')
D = np.load(os.path.join(WORK, 'w07_mesh.npz'))
co, tris, rep, isl = D['co'], D['tris'], D['rep'], D['island']
W = np.unique(rep)
wid = -np.ones(len(co), dtype=np.int64); wid[W] = np.arange(len(W))
cw = co[W]; iw = isl[W]
nb = [dict() for _ in range(len(W))]
for t in tris:
    a, b, c = wid[rep[t[0]]], wid[rep[t[1]]], wid[rep[t[2]]]
    for u, v in ((a, b), (b, c), (c, a)):
        if u != v:
            d = float(np.linalg.norm(cw[u] - cw[v])); nb[u][v] = d; nb[v][u] = d

# island roles (ids from w07_r1_probe / w07_common.welded_islands, checked by size and side)
ROLE = {'abdomen': 0, 'ceph': 1,
        'L': dict(fused12=3, leg3=7, leg4=4, orphan=12, palp=10, palpcoxa=8, fang=15, lump=16, eye_out=19, eye_in=20),
        'R': dict(fused12=2, leg3=6, leg4=5, orphan=13, palp=11, palpcoxa=9, fang=14, lump=17, eye_out=18, eye_in=21)}
EXPECT_N = {0: 1400, 1: 565, 2: 409, 3: 409, 4: 318, 5: 318, 6: 248, 7: 246, 8: 222, 9: 221, 10: 211, 11: 211,
            12: 115, 13: 115, 14: 65, 15: 64, 16: 48, 17: 48, 18: 26, 19: 26, 20: 26, 21: 26}
for k, n in EXPECT_N.items():
    got = int((iw == k).sum()); assert got == n, f'island {k}: {got} verts, expected {n}'
for s, sg in (('L', 1), ('R', -1)):
    for role, k in ROLE[s].items():
        assert np.sign(cw[iw == k][:, 0].mean()) == sg, (s, role, k)


def verts(k):
    return np.nonzero(iw == k)[0]


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


def medial(vs, tip, step=0.02):
    S = set(int(i) for i in vs); d = dijkstra([int(tip)], S)
    L = max(d.values()); n = max(3, int(math.ceil(L / step)))
    acc = [[] for _ in range(n)]
    for i, x in d.items():
        acc[min(n - 1, int(x / L * n))].append(i)
    return np.array([cw[b].mean(axis=0) for b in acc if len(b) >= 3]), d


def dp_fit(P, k):
    n = len(P)

    def cost(i, j):
        a, b = P[i], P[j]; ab = b - a; L2 = float(ab @ ab); Q = P[i:j + 1] - a
        if L2 < 1e-12:
            return float((Q * Q).sum())
        t = np.clip(Q @ ab / L2, 0, 1); R = Q - np.outer(t, ab)
        return float((R * R).sum())
    C = np.full((n, n), np.inf)
    for i in range(n):
        for j in range(i + 1, n):
            C[i, j] = cost(i, j)
    best = np.full((k + 1, n), np.inf); arg = np.zeros((k + 1, n), dtype=int); best[0][0] = 0.0
    for m in range(1, k + 1):
        for j in range(1, n):
            vals = best[m - 1][:j] + C[:j, j]; i = int(np.argmin(vals)); best[m][j] = vals[i]; arg[m][j] = i
    idx = [n - 1]; j = n - 1
    for m in range(k, 0, -1):
        j = arg[m][j]; idx.append(j)
    return [P[i] for i in idx[::-1]]


def seg_dist(P, a, b):
    ab = b - a; L2 = float(ab @ ab)
    t = np.clip(((P - a) @ ab) / max(L2, 1e-12), 0, 1)
    return np.linalg.norm(P - (a + np.outer(t, ab)), axis=1)


def fit_line(Q):
    c = Q.mean(axis=0); _, _, Vt = np.linalg.svd(Q - c, full_matrices=False)
    return c, Vt[0]


def line_meet(c1, d1, c2, d2):
    w0 = c1 - c2; a = d1 @ d1; b = d1 @ d2; c = d2 @ d2; d = d1 @ w0; e = d2 @ w0
    den = a * c - b * b
    if den < 1e-9:
        return None, 1e9
    s = (b * e - c * d) / den; t = (a * e - b * d) / den
    p1 = c1 + s * d1; p2 = c2 + t * d2
    return (p1 + p2) / 2, float(np.linalg.norm(p1 - p2))


def klines(P, chains, iters=60, min_angle=12.0, max_gap=0.06):
    """P: points. chains: list of (k+1,3) joint arrays root->tip. All segments of all chains compete for P."""
    chains = [np.array(J, dtype=float) for J in chains]
    info = {}
    for it in range(iters):
        segs = [(ci, i) for ci, J in enumerate(chains) for i in range(len(J) - 1)]
        Dm = np.stack([seg_dist(P, chains[ci][i], chains[ci][i + 1]) for ci, i in segs], 1)
        asg = Dm.argmin(1)
        lines = {}
        for s, (ci, i) in enumerate(segs):
            Q = P[asg == s]
            if len(Q) < 5:
                continue
            c, d = fit_line(Q)
            if d @ (chains[ci][i + 1] - chains[ci][i]) < 0:
                d = -d
            lines[(ci, i)] = (c, d, Q)
        moved = 0.0; new = []
        for ci, J in enumerate(chains):
            NJ = J.copy(); k = len(J) - 1
            for i in range(1, k):
                if (ci, i - 1) not in lines or (ci, i) not in lines:
                    continue
                c1, d1, Q1 = lines[(ci, i - 1)]; c2, d2, Q2 = lines[(ci, i)]
                ang = math.degrees(math.acos(min(1.0, abs(float(d1 @ d2)))))
                p, gap = line_meet(c1, d1, c2, d2) if ang >= min_angle else (None, 1e9)
                if p is None or gap > max_gap:
                    e1 = c1 + d1 * ((Q1 - c1) @ d1).max(); s2 = c2 + d2 * ((Q2 - c2) @ d2).min()
                    p = (e1 + s2) / 2
                NJ[i] = p
                info[(ci, i)] = dict(angle=round(ang, 1), gap=round(gap, 4) if gap < 1e8 else None)
            if (ci, 0) in lines:
                c, d, Q = lines[(ci, 0)]; NJ[0] = c + d * ((Q - c) @ d).min()
            if (ci, k - 1) in lines:
                c, d, Q = lines[(ci, k - 1)]; NJ[k] = c + d * ((Q - c) @ d).max()
            moved = max(moved, float(np.abs(NJ - J).max())); new.append(NJ)
        chains = new
        if moved < 1e-5:
            break
    # final assignment + per-bar residual
    segs = [(ci, i) for ci, J in enumerate(chains) for i in range(len(J) - 1)]
    Dm = np.stack([seg_dist(P, chains[ci][i], chains[ci][i + 1]) for ci, i in segs], 1)
    asg = Dm.argmin(1)
    resid = {f'{ci}.{i}': round(float(np.sqrt((Dm[asg == s, s] ** 2).mean())), 4) for s, (ci, i) in enumerate(segs) if (asg == s).any()}
    return chains, asg, segs, dict(iters=it + 1, resid_rms=resid, joints={f'{a}.{b}': v for (a, b), v in info.items()})


def tip_vertex(vs, score):
    return int(vs[np.argmin([score(cw[i]) for i in vs])])


def side_landmarks(S, sg):
    R = ROLE[S]; out = {}
    # ---- fused Leg1 + Leg2: split by geodesic Voronoi for the initial medial curves only
    F = verts(R['fused12'])
    t1 = tip_vertex(F, lambda p: p[1])                         # frontmost tip
    t2 = tip_vertex(F, lambda p: -sg * p[0] + 3 * p[2])        # outermost low tip
    d1 = dijkstra([t1], set(F.tolist())); d2 = dijkstra([t2], set(F.tolist()))
    A = np.array([i for i in F if d1[i] <= d2[i]]); B = np.array([i for i in F if d1[i] > d2[i]])
    init = []
    for part, tip in ((A, t1), (B, t2)):
        M, _ = medial(part, tip); init.append(np.array(dp_fit(M, 4)[::-1]))   # root -> tip
    # Leg2's medial stops at the Voronoi border: extend its root to the fused root (Leg1's root)
    init[1][0] = init[0][0]
    ch, asg, segs, inf = klines(cw[F], init)
    out['Leg1'] = dict(joints=ch[0], fit=inf, n=int(len(F)), fused_with='Leg2')
    out['Leg2'] = dict(joints=ch[1], fit=inf, n=int(len(F)), fused_with='Leg1')
    out['_fused_assign'] = dict(verts=F.tolist(), seg=[segs[s][0] * 10 + segs[s][1] for s in asg])
    for name, key in (('Leg3', 'leg3'), ('Leg4', 'leg4')):
        V = verts(R[key]); tip = tip_vertex(V, lambda p: -sg * p[0] - 0.3 * p[1] * (1 if key == 'leg4' else 0) + 3 * p[2])
        M, _ = medial(V, tip); J0 = np.array(dp_fit(M, 4)[::-1])
        ch, asg, segs, inf = klines(cw[V], [J0])
        out[name] = dict(joints=ch[0], fit=inf, n=int(len(V)))
    # ---- orphan rear leg piece: 2 bars (upper bar, tapered tip)
    V = verts(R['orphan']); tip = tip_vertex(V, lambda p: p[2])
    M, _ = medial(V, tip); J0 = np.array(dp_fit(M, 2)[::-1])
    ch, asg, segs, inf = klines(cw[V], [J0])
    out['orphan'] = dict(joints=ch[0], fit=inf, n=int(len(V)))
    # ---- palp: 3 bars (base up to the top joint, middle down-forward, claw)
    V = verts(R['palp']); tip = tip_vertex(V, lambda p: p[2] + 0.5 * p[1])
    M, _ = medial(V, tip, step=0.012); J0 = np.array(dp_fit(M, 3)[::-1])
    ch, asg, segs, inf = klines(cw[V], [J0], min_angle=10.0)
    out['palp'] = dict(joints=ch[0], fit=inf, n=int(len(V)))
    # ---- fang: one blade; root = centroid of the top 15 % along the blade axis, tip = lowest vertex
    V = verts(R['fang']); P = cw[V]; c, d = fit_line(P)
    if d[2] > 0:
        d = -d                                                     # root -> tip points down
    s = (P - c) @ d; root = P[s <= s.min() + 0.15 * (s.max() - s.min())].mean(axis=0)
    tipv = P[np.argmin(P[:, 2])]
    out['fang'] = dict(joints=np.array([root, tipv]), n=int(len(V)))
    # ---- small rigid head parts
    for role in ('palpcoxa', 'lump', 'eye_out', 'eye_in'):
        P = cw[verts(R[role])]; out[role] = dict(center=P.mean(axis=0), lo=P.min(axis=0), hi=P.max(axis=0), n=int(len(P)))
    return out


def sphere_fit(P):
    A = np.c_[2 * P, np.ones(len(P))]; b = (P ** 2).sum(1)
    x, *_ = np.linalg.lstsq(A, b, rcond=None); c = x[:3]; r = math.sqrt(x[3] + c @ c)
    return c, r


L = side_landmarks('L', 1); Rr = side_landmarks('R', -1)


def mirror(p):
    p = np.array(p, dtype=float).copy(); p[..., 0] *= -1; return p


SYM = {}; ASYM = {}
for name in ('Leg1', 'Leg2', 'Leg3', 'Leg4', 'orphan', 'palp', 'fang'):
    a = L[name]['joints']; b = mirror(Rr[name]['joints'])
    SYM[name] = (a + b) / 2; ASYM[name] = [round(float(x), 4) for x in np.linalg.norm(a - b, axis=1)]
for role in ('palpcoxa', 'lump', 'eye_out', 'eye_in'):
    SYM[role] = (L[role]['center'] + mirror(Rr[role]['center'])) / 2

# ---------------------------------------------------------------- body
Pa = cw[verts(ROLE['abdomen'])]; Pc = cw[verts(ROLE['ceph'])]
ab_c, ab_r = sphere_fit(Pa)
spin = Pa[np.argmax(Pa @ np.array([0, 0.62, -0.78]))]               # spinneret: rear-bottom extreme
ceph_front = Pc[np.argmin(Pc[:, 1])]
mid_c = Pc[(np.abs(Pc[:, 0]) < 0.08) & (Pc[:, 1] > Pc[:, 1].max() - 0.12)]
mid_a = Pa[(np.abs(Pa[:, 0]) < 0.10) & (Pa[:, 1] < Pa[:, 1].min() + 0.12)]
pedicel = (mid_c.mean(axis=0) + mid_a.mean(axis=0)) / 2
roots = np.array([SYM[n][0] for n in ('Leg1', 'Leg2', 'Leg3', 'Leg4')])
socket_c = np.array([0.0, roots[:, 1].mean(), roots[:, 2].mean()])
# ceph profile on the mid-plane (for the bone axis): y extents and z range of |x| < 0.05
mp = Pc[np.abs(Pc[:, 0]) < 0.05]
body = dict(abdomen_center=ab_c, abdomen_radius=ab_r, abdomen_lo=Pa.min(axis=0), abdomen_hi=Pa.max(axis=0),
            spinneret_tip=spin, ceph_front=ceph_front, ceph_lo=Pc.min(axis=0), ceph_hi=Pc.max(axis=0),
            ceph_mid_back=mid_c.mean(axis=0), abdomen_mid_front=mid_a.mean(axis=0), pedicel=pedicel,
            leg_socket_center=socket_c, ceph_centroid=Pc.mean(axis=0))


def js(x):
    if isinstance(x, dict):
        return {str(k): js(v) for k, v in x.items() if not str(k).startswith('_')}
    if isinstance(x, (list, tuple)):
        return [js(v) for v in x]
    if isinstance(x, np.ndarray):
        return np.round(x.astype(float), 4).tolist()
    if isinstance(x, (np.floating, float)):
        return round(float(x), 4)
    if isinstance(x, (np.integer,)):
        return int(x)
    return x


out = dict(units='m, Blender Z-up, creature faces -Y, its left = +X', height_m=float(D['height']), scale=float(D['scale']),
           L=js(L), R=js(Rr), sym=js(SYM), asym_L_vs_mirrorR=ASYM, body=js(body),
           fused_assign_L=dict(verts=[int(W[i]) for i in L['_fused_assign']['verts']], seg=L['_fused_assign']['seg']),
           fused_assign_R=dict(verts=[int(W[i]) for i in Rr['_fused_assign']['verts']], seg=Rr['_fused_assign']['seg']))
with open(os.path.join(WORK, 'landmarks.json'), 'w') as f:
    json.dump(out, f, indent=1)

for name in ('Leg1', 'Leg2', 'Leg3', 'Leg4', 'orphan', 'palp', 'fang'):
    J = SYM[name]; segl = [round(float(np.linalg.norm(J[i + 1] - J[i])), 3) for i in range(len(J) - 1)]
    angs = []
    for i in range(1, len(J) - 1):
        u = J[i] - J[i - 1]; v = J[i + 1] - J[i]
        angs.append(round(math.degrees(math.acos(np.clip(u @ v / np.linalg.norm(u) / np.linalg.norm(v), -1, 1))), 1))
    print(f"{name:7s} joints {np.round(J, 3).tolist()}\n        seg {segl} bend {angs} asym {ASYM[name]}")
    if name in L and 'fit' in L[name]:
        print('        fitL', L[name]['fit']['iters'], L[name]['fit']['resid_rms'], L[name]['fit']['joints'])
for k, v in body.items():
    print(k, np.round(v, 4).tolist() if isinstance(v, np.ndarray) else round(v, 4))
