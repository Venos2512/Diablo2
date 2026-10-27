"""P04 Hive-Sleeper, R3 skin: weights by region models + edge-length Laplacian smoothing on the welded mesh (numpy).

Automatic Weights (bone heat) fails on Tripo meshes, so (rig_v1 §2b): parametric weights along the bones (limb chains,
trunk chain along Y, cloth chains along Z) inside region masks, then smoothing over the welded mesh (co-located vertices
share one node, so UV seams never crack), rigid parts fixed (dome caps), knots averaged, at most 4 influences, sum 1.
All positions in metres in the rig frame (faces -Y, left = +X, z up). `bones` = {name: (head, tail)} of the runtime rig.
"""
import math, collections
import numpy as np


def sm(a, b, t):
    """Smoothstep from a to b (a > b allowed), vectorised."""
    t = np.asarray(t, dtype=float)
    if a == b:
        return (t >= b).astype(float)
    u = np.clip((t - a) / (b - a), 0.0, 1.0)
    return u * u * (3 - 2 * u)


def chain1d(t, bounds, names, half):
    """Weights of bones ordered along a coordinate t (ascending): names[0] below bounds[0], names[i] between
    bounds[i-1] and bounds[i], names[-1] above bounds[-1]; smooth over +-half[i] around each bound.
    half[i] may be a (below, above) pair. Returns {name: array}."""
    F = []
    for b, h in zip(bounds, half):
        lo, hi = (h, h) if np.isscalar(h) else h
        F.append(sm(b - lo, b + hi, t))
    out = {}
    out[names[0]] = 1.0 - F[0]
    for i in range(1, len(names) - 1):
        out[names[i]] = np.clip(F[i - 1] - F[i], 0, 1)
    out[names[-1]] = F[-1]
    return out


def seg_param(P, pts):
    """Arc-length parameter of points P (n,3) projected on the polyline pts (k,3) (nearest segment). Before the first
    point the parameter is negative (unclamped), after the last it continues. Returns (s, dist)."""
    pts = [np.asarray(p, float) for p in pts]
    L = [0.0]
    for a, b in zip(pts[:-1], pts[1:]):
        L.append(L[-1] + np.linalg.norm(b - a))
    best_d = np.full(len(P), np.inf); best_s = np.zeros(len(P))
    nseg = len(pts) - 1
    for i, (a, b) in enumerate(zip(pts[:-1], pts[1:])):
        ab = b - a; l2 = ab @ ab
        t = ((P - a) @ ab) / l2
        tc = np.clip(t, 0, 1)
        if i == 0:
            tc = np.minimum(t, 1.0)            # allow before the start
        if i == nseg - 1:
            tc = np.maximum(tc, 0.0) if i > 0 else tc
            tc = np.where(t > 1, t, tc)        # allow after the end
        q = a + tc[:, None] * ab
        d = np.linalg.norm(P - q, axis=1)
        s = L[i] + tc * math.sqrt(l2)
        m = d < best_d
        best_d[m] = d[m]; best_s[m] = s[m]
    return best_s, best_d, L


def seg_dist(P, a, b):
    a = np.asarray(a, float); b = np.asarray(b, float); ab = b - a
    t = np.clip(((P - a) @ ab) / (ab @ ab), 0, 1)
    return np.linalg.norm(P - (a + t[:, None] * ab), axis=1)


class Skin:
    def __init__(self, V, polys, srgb, bones, deform_names, weld_eps=1e-5):
        self.V = np.asarray(V, float); self.n = len(self.V)
        key = np.round(self.V / weld_eps).astype(np.int64)
        _, first, inv = np.unique(key, axis=0, return_index=True, return_inverse=True)
        self.wid = inv.ravel(); self.P = self.V[first]; self.m = len(self.P)
        e = []
        for poly in polys:
            k = len(poly)
            for i in range(k):
                e.append((self.wid[poly[i]], self.wid[poly[(i + 1) % k]]))
        E = np.array(e, dtype=np.int64); E = np.sort(E, axis=1); E = E[E[:, 0] != E[:, 1]]
        self.E = np.unique(E, axis=0)
        self.elen = np.linalg.norm(self.P[self.E[:, 0]] - self.P[self.E[:, 1]], axis=1)
        self.comp = self._components()
        col = np.zeros((self.m, 3)); cnt = np.zeros(self.m)
        np.add.at(col, self.wid, srgb); np.add.at(cnt, self.wid, 1)
        self.col = col / np.maximum(cnt, 1)[:, None]
        self.bones = {k: (np.asarray(h, float), np.asarray(t, float)) for k, (h, t) in bones.items()}
        self.names = list(deform_names); self.ix = {n: i for i, n in enumerate(self.names)}
        self.W = np.zeros((self.m, len(self.names)))
        self.region = np.zeros(self.m, dtype=np.int32)       # see REGIONS
        self.fixed = np.zeros(self.m, dtype=bool)
        self.log = collections.OrderedDict()

    REGIONS = ['none', 'trunk', 'head', 'dome', 'drape', 'arm', 'leg', 'belly', 'sleeve', 'panel', 'ribbon', 'bit']

    # ------------------------------------------------------------------ topology
    def _components(self):
        par = np.arange(self.m)
        def find(a):
            while par[a] != a:
                par[a] = par[par[a]]; a = par[a]
            return a
        for a, b in self.E:
            ra, rb = find(a), find(b)
            if ra != rb:
                par[ra] = rb
        roots = np.array([find(i) for i in range(self.m)])
        _, comp = np.unique(roots, return_inverse=True)
        return comp

    def comp_nodes(self, c):
        return np.where(self.comp == c)[0]

    def comp_table(self):
        rows = []
        for c in range(self.comp.max() + 1):
            ids = self.comp_nodes(c); P = self.P[ids]; col = self.col[ids].mean(0)
            red = float(np.mean((self.col[ids, 0] > self.col[ids, 1] + 0.18) & (self.col[ids, 0] > 0.25)))
            rows.append(dict(c=c, n=len(ids), lo=P.min(0), hi=P.max(0), cen=P.mean(0), red=red, rgb=col))
        return rows

    def bone(self, n):
        return self.bones[n]

    # ------------------------------------------------------------------ weight helpers
    def put(self, ids, d, mask=None):
        """W[ids] = (1-mask)*W[ids] + mask*d (d: {bone: array or scalar}); mask None = replace."""
        D = np.zeros((len(ids), len(self.names)))
        for n, w in d.items():
            D[:, self.ix[n]] += w
        s = D.sum(1, keepdims=True); D = D / np.where(s > 0, s, 1)
        if mask is None:
            self.W[ids] = D
        else:
            mk = np.asarray(mask, float)[:, None]
            self.W[ids] = (1 - mk) * self.W[ids] + mk * D

    def dense(self, ids, d):
        D = np.zeros((len(ids), len(self.names)))
        for n, w in d.items():
            D[:, self.ix[n]] += w
        s = D.sum(1, keepdims=True)
        return D / np.where(s > 0, s, 1)

    def smooth(self, ids, iters, lam=0.5, fixed=None):
        """Edge-length weighted Laplacian smoothing of W restricted to the nodes ids (edges inside the set)."""
        ids = np.asarray(ids); inset = np.zeros(self.m, bool); inset[ids] = True
        sel = inset[self.E[:, 0]] & inset[self.E[:, 1]]
        E = self.E[sel]; w = 1.0 / np.maximum(self.elen[sel], 1e-4)
        fx = np.zeros(self.m, bool)
        if fixed is not None:
            fx[fixed] = True
        fx |= self.fixed
        for _ in range(iters):
            acc = np.zeros_like(self.W); wsum = np.zeros(self.m)
            np.add.at(acc, E[:, 0], self.W[E[:, 1]] * w[:, None]); np.add.at(acc, E[:, 1], self.W[E[:, 0]] * w[:, None])
            np.add.at(wsum, E[:, 0], w); np.add.at(wsum, E[:, 1], w)
            upd = inset & (wsum > 0) & ~fx
            avg = acc[upd] / wsum[upd][:, None]
            self.W[upd] = (1 - lam) * self.W[upd] + lam * avg

    def harmonic(self, ids, s0, fixed, iters=1500):
        """Scalar harmonic field on the nodes ids (edges inside the set, 1/length weights): values of s0 kept where
        fixed (bool per ids), Jacobi iterations elsewhere starting from s0. Returns the field on ids."""
        ids = np.asarray(ids); inset = np.zeros(self.m, bool); inset[ids] = True
        sel = inset[self.E[:, 0]] & inset[self.E[:, 1]]
        E = self.E[sel]; w = 1.0 / np.maximum(self.elen[sel], 1e-4)
        s = np.zeros(self.m); s[ids] = s0
        fx = np.zeros(self.m, bool); fx[ids[np.asarray(fixed, bool)]] = True
        wsum = np.bincount(E[:, 0], weights=w, minlength=self.m) + np.bincount(E[:, 1], weights=w, minlength=self.m)
        free = inset & ~fx & (wsum > 0)
        for _ in range(iters):
            acc = np.bincount(E[:, 0], weights=s[E[:, 1]] * w, minlength=self.m) + \
                np.bincount(E[:, 1], weights=s[E[:, 0]] * w, minlength=self.m)
            s[free] = acc[free] / wsum[free]
        return s[ids]

    def finalize(self, limit=4, prune=0.01):
        W = self.W.copy()
        order = np.argsort(-W, axis=1)
        keep = np.zeros_like(W, bool)
        rows = np.arange(len(W))[:, None]
        keep[rows, order[:, :limit]] = True
        W[~keep] = 0; W[W < prune] = 0
        s = W.sum(1, keepdims=True)
        bad = (s[:, 0] <= 0)
        W = W / np.where(s > 0, s, 1)
        self.W = W
        return int(bad.sum())

    def vertex_weights(self):
        """Per original vertex: list of (bone, weight) (identical for co-located vertices)."""
        out = []
        for i in range(self.n):
            r = self.W[self.wid[i]]
            nz = np.nonzero(r)[0]
            out.append([(self.names[j], float(r[j])) for j in nz])
        return out
