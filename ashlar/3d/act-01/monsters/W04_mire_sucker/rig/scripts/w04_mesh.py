"""Mesh helpers for W04 (numpy only, no bpy): distance weld, edge graph, Dijkstra, level-set centre lines.

The importer weld (merge_vertices) keeps vertices apart where normals differ, so the wing cells and the plates come in as
many small islands. Rigging needs the geometric connectivity: weld(co, tol) merges positions closer than tol.
"""
import heapq

import numpy as np


def weld(co, tol=1e-5):
    """-> (inv, uco): inv[i] = welded index of vertex i, uco = welded positions (first occurrence)."""
    q = np.round(co / tol).astype(np.int64)
    _, first, inv = np.unique(q, axis=0, return_index=True, return_inverse=True)
    inv = inv.ravel()
    # neighbours across a rounding cell border: merge pairs closer than tol with a second, shifted grid
    q2 = np.round(co / tol + 0.5).astype(np.int64)
    _, inv2 = np.unique(q2, axis=0, return_inverse=True)
    inv2 = inv2.ravel()
    par = np.arange(len(first))

    def find(a):
        while par[a] != a:
            par[a] = par[par[a]]
            a = par[a]
        return a
    rep = {}
    for i, g in enumerate(inv2):
        r = rep.get(g)
        if r is None:
            rep[g] = inv[i]
        else:
            a, b = find(r), find(inv[i])
            if a != b:
                par[b] = a
    roots = np.array([find(a) for a in range(len(first))])
    _, inv3 = np.unique(roots, return_inverse=True)
    inv = inv3.ravel()[inv]
    m = inv.max() + 1
    uco = np.zeros((m, 3))
    cnt = np.zeros(m)
    np.add.at(uco, inv, co)
    np.add.at(cnt, inv, 1)
    return inv, uco / cnt[:, None]


def edges_from_faces(faces_u):
    """faces_u: list of welded vertex index tuples -> unique undirected edges (E,2)."""
    e = []
    for f in faces_u:
        k = len(f)
        for i in range(k):
            a, b = f[i], f[(i + 1) % k]
            if a != b:
                e.append((min(a, b), max(a, b)))
    return np.unique(np.array(e, dtype=np.int64), axis=0)


def adjacency(n, E, uco):
    L = np.linalg.norm(uco[E[:, 0]] - uco[E[:, 1]], axis=1)
    adj = [[] for _ in range(n)]
    for (a, b), l in zip(E, L):
        adj[a].append((b, l))
        adj[b].append((a, l))
    return adj


def components(n, E):
    par = np.arange(n)

    def find(a):
        while par[a] != a:
            par[a] = par[par[a]]
            a = par[a]
        return a
    for a, b in E:
        ra, rb = find(a), find(b)
        if ra != rb:
            par[ra] = rb
    roots = np.array([find(a) for a in range(n)])
    _, lab = np.unique(roots, return_inverse=True)
    return lab.ravel()


def dijkstra(adj, sources, allowed=None, limit=np.inf):
    """sources: {vertex: label} or iterable of vertices -> (dist array, label array)."""
    n = len(adj)
    dist = np.full(n, np.inf)
    lab = np.full(n, -1, dtype=np.int64)
    pq = []
    items = sources.items() if isinstance(sources, dict) else ((s, 0) for s in sources)
    for s, l in items:
        dist[s] = 0.0
        lab[s] = l
        pq.append((0.0, s))
    heapq.heapify(pq)
    while pq:
        d, a = heapq.heappop(pq)
        if d > dist[a] or d > limit:
            continue
        for b, l in adj[a]:
            if allowed is not None and not allowed[b]:
                continue
            nd = d + l
            if nd < dist[b]:
                dist[b] = nd
                lab[b] = lab[a]
                heapq.heappush(pq, (nd, b))
    return dist, lab


def level_rings(uco, adj, dist, step, dmax, members=None):
    """Centre line of a tube from a geodesic distance field: for each band [k*step, (k+1)*step) take the connected
    components of the band (through mesh edges inside the band) -> list of rings per band:
    dict(d, n, c (centroid), r (mean radius), comps)."""
    n = len(uco)
    band = np.floor(dist / step).astype(np.int64)
    out = []
    kmax = int(dmax / step)
    for k in range(kmax + 1):
        idx = np.nonzero((band == k) & np.isfinite(dist))[0]
        if members is not None:
            idx = idx[members[idx]]
        if len(idx) == 0:
            continue
        s = set(idx.tolist())
        seen = set()
        comps = []
        for v in idx:
            if v in seen:
                continue
            st = [v]
            seen.add(v)
            comp = []
            while st:
                a = st.pop()
                comp.append(a)
                for b, _ in adj[a]:
                    if b in s and b not in seen:
                        seen.add(b)
                        st.append(b)
            comps.append(comp)
        rings = []
        for comp in sorted(comps, key=len, reverse=True):
            P = uco[comp]
            c = P.mean(0)
            r = float(np.linalg.norm(P - c, axis=1).mean())
            rings.append(dict(n=len(comp), c=c.round(4).tolist(), r=round(r, 4)))
        out.append(dict(d=round((k + 0.5) * step, 4), rings=rings))
    return out


def point_seg(p, a, b):
    """distance from points p (N,3) to segment a-b and the parameter t in [0,1]."""
    ab = b - a
    L2 = float(ab @ ab)
    t = np.clip(((p - a) @ ab) / max(L2, 1e-12), 0.0, 1.0)
    q = a + t[:, None] * ab
    return np.linalg.norm(p - q, axis=1), t
