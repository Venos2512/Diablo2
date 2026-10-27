"""Mesh data for the W07 analysis scripts (system Python). Welded vertices, adjacency, island roles."""
import os, heapq, math
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
WORK = os.path.join(os.path.dirname(HERE), '_work')
D = np.load(os.path.join(WORK, 'w07_mesh.npz'))
co, tris, rep, isl = D['co'], D['tris'], D['rep'], D['island']
HEIGHT, SCALE = float(D['height']), float(D['scale'])
W = np.unique(rep)                                   # representative (original) index of each welded vertex
wid = -np.ones(len(co), dtype=np.int64); wid[W] = np.arange(len(W))
cw = co[W]; iw = isl[W]
nb = [dict() for _ in range(len(W))]
for t in tris:
    a, b, c = wid[rep[t[0]]], wid[rep[t[1]]], wid[rep[t[2]]]
    for u, v in ((a, b), (b, c), (c, a)):
        if u != v:
            d = float(np.linalg.norm(cw[u] - cw[v])); nb[u][v] = d; nb[v][u] = d

# island ids (w07_common.welded_islands, deterministic) -> roles; checked by size and side
ROLE = {'abdomen': 0, 'ceph': 1,
        'L': dict(fused12=3, leg3=7, leg4=4, orphan=12, palp=10, palpcoxa=8, fang=15, lump=16, eye_out=19, eye_in=20),
        'R': dict(fused12=2, leg3=6, leg4=5, orphan=13, palp=11, palpcoxa=9, fang=14, lump=17, eye_out=18, eye_in=21)}
EXPECT_N = {0: 1400, 1: 565, 2: 409, 3: 409, 4: 318, 5: 318, 6: 248, 7: 246, 8: 222, 9: 221, 10: 211, 11: 211,
            12: 115, 13: 115, 14: 65, 15: 64, 16: 48, 17: 48, 18: 26, 19: 26, 20: 26, 21: 26}
for _k, _n in EXPECT_N.items():
    assert int((iw == _k).sum()) == _n, f'island {_k} changed'
for _s, _sg in (('L', 1), ('R', -1)):
    for _role, _k in ROLE[_s].items():
        assert np.sign(cw[iw == _k][:, 0].mean()) == _sg, (_s, _role, _k)


def verts(k):
    return np.nonzero(iw == k)[0]


def dijkstra(srcs, allowed):
    dist = {}; pq = []
    for s in srcs:
        dist[int(s)] = 0.0; pq.append((0.0, int(s)))
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


def tip_vertex(vs, score):
    return int(vs[np.argmin([score(cw[i]) for i in vs])])


def line_fit(P):
    c = P.mean(axis=0); _, _, Vt = np.linalg.svd(P - c, full_matrices=False)
    return c, Vt[0]


def mirror(P):
    P = np.array(P, dtype=float).copy(); P[..., 0] *= -1
    return P
