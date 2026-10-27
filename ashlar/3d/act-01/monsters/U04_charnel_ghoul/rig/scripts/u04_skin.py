"""R3 skin of U04 (numpy only: Blender 5.1 ships numpy, no scipy).

Body: seed regions per bone (rules below, Tripo units), then a harmonic solve (graph Laplacian with inverse edge-length
weights) on the welded body graph: free vertices get a smooth convex blend of the seed bones, so transitions follow the
surface and cannot jump across gaps. Twist bones take a share of the upper arm / forearm weight (skill shares).
Cloth: hood and tie follow the skin (barycentric weights of the nearest body point); smock = skin-follow on the back,
panels blend into 2-bone chains; teeth rigid (upper -> head, lower -> jaw). Max 4 influences, sum 1.
"""
import math, collections
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
import u04_joints as UJ


def sstep(e0, e1, x):
    t = np.clip((np.asarray(x, dtype=float) - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def seg(P, h, t):
    """Distance of points P (n,3) to segment h-t, raw projection u (0 at h, 1 at t), segment length."""
    h = np.asarray(h, float); t = np.asarray(t, float); L = t - h; LL = float(L @ L)
    u = ((P - h) @ L) / LL
    Q = h + np.clip(u, 0.0, 1.0)[:, None] * L
    return np.linalg.norm(P - Q, axis=1), u, math.sqrt(LL)


def mir(p):
    return (-p[0], p[1], p[2])


# ------------------------------------------------------------------ welded graph

def welded(ob, wid, nw, role_of_vertex):
    me = ob.data
    P = np.zeros((nw, 3)); seen = np.zeros(nw, bool)
    for i, v in enumerate(me.vertices):
        w = wid[i]
        if not seen[w]:
            P[w] = v.co; seen[w] = True
    role = np.empty(nw, dtype=object)
    for i in range(len(me.vertices)):
        role[wid[i]] = role_of_vertex[i]
    E = set()
    for e in me.edges:
        a, b = wid[e.vertices[0]], wid[e.vertices[1]]
        if a != b:
            E.add((min(a, b), max(a, b)))
    E = np.array(sorted(E), dtype=np.int64)
    me.calc_loop_triangles()
    tris = np.array([[wid[me.loops[l].vertex_index] for l in lt.loops] for lt in me.loop_triangles], dtype=np.int64)
    return P, role, E, tris


def laplacian_edges(P, E, nodes):
    """Edges inside `nodes` (bool mask) with inverse-length weights, both directions."""
    m = nodes[E[:, 0]] & nodes[E[:, 1]]
    a, b = E[m, 0], E[m, 1]
    w = 1.0 / np.maximum(np.linalg.norm(P[a] - P[b], axis=1), 1e-6)
    return np.concatenate([a, b]), np.concatenate([b, a]), np.concatenate([w, w])


def harmonic(P, E, nodes, fixed, Wfix):
    """Harmonic interpolation over the subgraph `nodes` (bool mask, welded ids): rows of `fixed` vertices are given
    (Wfix, any convex rows: one-hot seeds or analytic blends), free rows solve the graph Laplace equation.
    Returns W (nw, nb) (rows outside nodes = 0) and stats."""
    nw, nb = Wfix.shape
    ei, ej, ew = laplacian_edges(P, E, nodes)
    fixed = nodes & fixed; free = nodes & ~fixed
    fidx = np.nonzero(free)[0]; pos = -np.ones(nw, np.int64); pos[fidx] = np.arange(len(fidx))
    W = np.zeros((nw, nb)); W[fixed] = Wfix[fixed]
    nf = len(fidx)
    if nf:
        A = np.zeros((nf, nf)); B = np.zeros((nf, nb))
        deg = np.bincount(ei, weights=ew, minlength=nw)
        A[np.arange(nf), np.arange(nf)] = deg[fidx]
        m_ff = free[ei] & free[ej]
        np.add.at(A, (pos[ei[m_ff]], pos[ej[m_ff]]), -ew[m_ff])
        m_fc = free[ei] & fixed[ej]
        np.add.at(B, pos[ei[m_fc]], Wfix[ej[m_fc]] * ew[m_fc][:, None])
        W[fidx] = np.linalg.solve(A, B)
    W = np.clip(W, 0.0, None)
    s = W.sum(1, keepdims=True); W = np.where(s > 0, W / np.where(s > 0, s, 1), W)
    return W, dict(free=int(nf), fixed=int(fixed.sum()))


def smooth_rows(W, E, nodes, P, iters=3, alpha=0.5, keep=None):
    """Laplacian smoothing of weight rows over the subgraph (inverse-length weights). keep: bool mask not moved."""
    ei, ej, ew = laplacian_edges(P, E, nodes)
    deg = np.bincount(ei, weights=ew, minlength=len(P))
    for _ in range(iters):
        acc = np.zeros_like(W)
        np.add.at(acc, ei, W[ej] * ew[:, None])
        avg = np.where(deg[:, None] > 0, acc / np.maximum(deg[:, None], 1e-12), W)
        Wn = (1 - alpha) * W + alpha * avg
        m = nodes if keep is None else (nodes & ~keep)
        W = np.where(m[:, None], Wn, W)
    return W


def prune(W, k=4, eps=0.01):
    """Keep the k largest weights per row, drop < eps, renormalise."""
    W = W.copy()
    if W.shape[1] > k:
        idx = np.argsort(-W, axis=1)[:, k:]
        np.put_along_axis(W, idx, 0.0, axis=1)
    W[W < eps] = 0.0
    s = W.sum(1, keepdims=True)
    return np.where(s > 0, W / np.where(s > 0, s, 1), W)


# ------------------------------------------------------------------ body seeds (rules in Tripo units)

def body_seeds(T, body, bone_index, J=UJ.J):
    """Fixed rows per welded vertex. One-hot seeds for limbs, hands, feet, head, jaw, neck, clavicles; the torso core gets
    analytic hat weights along the spine (each spine bone peaks at its middle, linear to the neighbours' middles) so the
    back bends smoothly. T: positions in Tripo units. Returns (fixed mask, rows, stats, masks)."""
    n = len(T); lab = -np.ones(n, np.int64); st = collections.OrderedDict()
    nb = len(bone_index); rows = np.zeros((n, nb)); fixed_extra = np.zeros(n, bool)
    x, y, z = T[:, 0], T[:, 1], T[:, 2]; ax = np.abs(x)
    armL = (x > 0.10) & (y < -0.02) & (y > -0.42) & (z < 0.64)
    armR = (x < -0.10) & (y < -0.02) & (y > -0.42) & (z < 0.64)
    legL = (x > 0.035) & (y > 0.16) & (z < 0.56)
    legR = (x < -0.035) & (y > 0.16) & (z < 0.56)
    headneck = (((y < -0.20) & (z > 0.58)) | ((y < -0.15) & (z > 0.80))) & ~armL & ~armR
    torso = body & ~armL & ~armR & ~legL & ~legR & ~headneck

    def put(mask, name):
        m = mask & body & (lab < 0)
        lab[m] = bone_index[name]; st[name] = st.get(name, 0) + int(m.sum())

    # head / jaw: angular sectors around the jaw hinge (0 deg = forward, 90 = up)
    hy, hz = J['jaw'][1], J['jaw'][2]
    ang = np.degrees(np.arctan2(z - hz, -(y - hy))); r = np.hypot(y - hy, z - hz)
    put(headneck & (ang >= -100) & (ang <= -22) & (r >= 0.02) & (r <= 0.23) & (ax < 0.09) & (y < hy + 0.01), 'jaw')
    put(headneck & (ang >= -2) & (ang <= 135) & (r <= 0.24) & (ax < 0.13)
        & ((y < J['head'][1] + 0.005) | ((z > 0.915) & (y < -0.30))), 'head')

    def chain(mask, bones, gaps, R, lateral=None):
        """bones: [(name, h, t)]; gaps: joint gaps (len n+1, None = open end); seeds where the nearest segment of the
        chain is within R and the along-distance keeps the gaps."""
        D = []; S = []; Ls = []
        for _, h, t in bones:
            d, u, L = seg(T, h, t); D.append(d); S.append(u * L); Ls.append(L)
        D = np.array(D); S = np.array(S); k = np.argmin(D, axis=0)
        for i, (name, _, _) in enumerate(bones):
            lo = -np.inf if gaps[i] is None else gaps[i]
            hi = np.inf if gaps[i + 1] is None else Ls[i] - gaps[i + 1]
            m = mask & (k == i) & (D[i] < R) & (S[i] >= lo) & (S[i] <= hi)
            if lateral is not None:
                m &= lateral
            put(m, name)

    near_limb = np.zeros(n, bool)
    for P_, f in (('L', lambda p: p), ('R', mir)):
        arm = armL if P_ == 'L' else armR; leg = legL if P_ == 'L' else legR
        ci, sh, el, wr, kn = (np.array(f(J[k_])) for k_ in ('clav_in', 'shoulder', 'elbow', 'wrist', 'knuckle'))
        hp, kn2, hk, an, ba = (np.array(f(J[k_])) for k_ in ('hip', 'knee', 'hock', 'ankle', 'ball'))
        # hand: fingers = low parts in front of the wrist + everything in front of the knuckle line; palm = top behind the
        # knuckle line + heel; the knuckle band stays free
        put(arm & (((z < 0.040) & (y < wr[1] - 0.03)) | ((y < kn[1] - 0.025) & (z < kn[2] + 0.035))), f'{P_}_Finger')
        put(arm & (z < wr[2] - 0.015) & (y > kn[1] + 0.015) & ((z > 0.075) | (y > wr[1] - 0.005)), f'{P_}_Hand')
        # foot: toes in front of the ball, heel + midfoot behind it; ball and ankle bands free (ankle band 2.5 cm below)
        put(leg & (y < ba[1] - 0.02) & (z < an[2] - 0.01), f'{P_}_Toe')
        put(leg & (z < an[2] - 0.025) & (y > ba[1] + 0.02), f'{P_}_Foot')
        # clavicle: top of the shoulder
        d, u, _ = seg(T, ci, sh)
        put(torso & (d < 0.07) & (u > 0.35) & (u < 1.05) & (z > sh[2] - 0.03), f'{P_}_Clavicle')
        chain(arm, [(f'{P_}_UpperArm', sh, el), (f'{P_}_ForeArm', el, wr)], [0.07, 0.055, 0.03], R=0.09)
        chain(leg, [(f'{P_}_Thigh', hp, kn2), (f'{P_}_Calf', kn2, hk), (f'{P_}_Calf_02', hk, an)], [0.09, 0.04, 0.04, 0.045], R=0.10)
        # the torso must not seed the top of the limbs (inner upper arm / armpit, top of the thigh): left free
        # (thigh zone = near the thigh or the hip -> hock line, the zone used before the knee was added)
        d_ua, _, _ = seg(T, sh, el); d_th = np.minimum(seg(T, hp, kn2)[0], seg(T, hp, hk)[0])
        # armpit (below the shoulder joint) and the point of the shoulder only: the front of the chest stays with `chest`
        near_limb[((d_ua < 0.11) & ((z < sh[2] - 0.015) | (ax > abs(sh[0]) - 0.05))) | (d_th < 0.10)] = True
    # torso core: position s along the spine polyline -> hat weights (rump behind the pelvis = pelvis, front = chest)
    sp = [np.array(J[k_]) for k_ in ('pelvis', 'spine_01', 'spine_02', 'chest', 'neck')]
    spn = ['pelvis', 'spine_01', 'spine_02', 'chest']
    Ls = [float(np.linalg.norm(sp[i + 1] - sp[i])) for i in range(4)]; s0 = np.concatenate([[0.0], np.cumsum(Ls)])
    D = []; Sv = []
    for i in range(4):
        d, u, L = seg(T, sp[i], sp[i + 1]); D.append(d)
        uu = u if i == 0 else np.maximum(u, 0.0)
        uu = uu if i == 3 else np.minimum(uu, 1.0)
        Sv.append(s0[i] + uu * L)
    D = np.array(D); Sv = np.array(Sv); k = np.argmin(D, axis=0); sv = Sv[k, np.arange(n)]
    centres = [(s0[i] + s0[i + 1]) / 2 for i in range(4)]
    core = torso & (ax < 0.15) & ~near_limb & (lab < 0) & (sv <= s0[4] - 0.03)
    hat = np.zeros((n, 4))
    for i in range(4):
        lo = centres[i - 1] if i > 0 else -np.inf; hi = centres[i + 1] if i < 3 else np.inf
        up = np.clip((sv - lo) / (centres[i] - lo), 0, 1) if i > 0 else np.ones(n)
        dn = np.clip((hi - sv) / (hi - centres[i]), 0, 1) if i < 3 else np.ones(n)
        hat[:, i] = np.where(sv <= centres[i], up, dn)
    hat /= np.maximum(hat.sum(1, keepdims=True), 1e-9)
    for i, nm in enumerate(spn):
        rows[core, bone_index[nm]] = hat[core, i]
    fixed_extra |= core; st['torso_core(hat)'] = int(core.sum())
    nk = [np.array(J[k_]) for k_ in ('neck', 'neck_02', 'head')]
    chain(headneck, [('neck', nk[0], nk[1]), ('neck_02', nk[1], nk[2])], [0.03, 0.025, 0.03], R=0.12)
    masks = dict(armL=armL, armR=armR, legL=legL, legR=legR, headneck=headneck, torso=torso)
    seeded = lab >= 0
    rows[seeded] = 0.0; rows[np.nonzero(seeded)[0], lab[seeded]] = 1.0
    return seeded | fixed_extra, rows, st, masks


def split_twist(W, T, names, J=UJ.J):
    """Move a share of UpperArm / ForeArm weight to the twist bones (shares of the skill: 50 % at the shoulder end
    fading to 0 at the elbow; 0 at the elbow rising to 60 % at the wrist)."""
    ix = {n: i for i, n in enumerate(names)}
    for P_, f in (('L', lambda p: p), ('R', mir)):
        sh, el, wr = (np.array(f(J[k_])) for k_ in ('shoulder', 'elbow', 'wrist'))
        _, u, _ = seg(T, sh, el)
        ua = W[:, ix[f'{P_}_UpperArm']]; share = 0.5 * (1.0 - sstep(0.1, 1.0, u))
        W[:, ix[f'{P_}_UpperArm_twist']] += ua * share; W[:, ix[f'{P_}_UpperArm']] = ua * (1 - share)
        _, u, _ = seg(T, el, wr)
        fa = W[:, ix[f'{P_}_ForeArm']]; share = 0.6 * sstep(0.0, 0.9, u)
        W[:, ix[f'{P_}_ForeArm_twist']] += fa * share; W[:, ix[f'{P_}_ForeArm']] = fa * (1 - share)
    return W


# ------------------------------------------------------------------ cloth

def skin_follow(P, tris_body, W, query_idx):
    """Barycentric body weights at the nearest body point of each query vertex. Returns (rows, dist)."""
    verts = [Vector(p) for p in P]
    bvh = BVHTree.FromPolygons(verts, [tuple(t) for t in tris_body])
    out = np.zeros((len(query_idx), W.shape[1])); dist = np.zeros(len(query_idx))
    for k, i in enumerate(query_idx):
        loc, nrm, fi, d = bvh.find_nearest(Vector(P[i]))
        a, b, c = tris_body[fi]
        A, Bv, Cv = P[a], P[b], P[c]; p = np.array(loc)
        v0, v1, v2 = Bv - A, Cv - A, p - A
        d00, d01, d11, d20, d21 = v0 @ v0, v0 @ v1, v1 @ v1, v2 @ v0, v2 @ v1
        den = d00 * d11 - d01 * d01
        if abs(den) < 1e-18:
            bw = np.array([1.0, 0.0, 0.0])
        else:
            vv = (d11 * d20 - d01 * d21) / den; ww = (d00 * d21 - d01 * d20) / den
            bw = np.clip(np.array([1 - vv - ww, vv, ww]), 0, 1); bw /= bw.sum()
        out[k] = bw[0] * W[a] + bw[1] * W[b] + bw[2] * W[c]; dist[k] = d
    return out, dist


def chain_rows(t, names, ix, nb):
    """2-bone chain weights along t (0 root, 1 tip)."""
    R = np.zeros((len(t), nb)); s = sstep(0.35, 0.65, t)
    R[:, ix[names[0]]] = 1 - s; R[:, ix[names[1]]] = s
    return R
