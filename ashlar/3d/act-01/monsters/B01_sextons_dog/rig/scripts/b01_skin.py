"""B01 R3 skin (route M, no Blender bone heat): runs inside Blender, numpy only.

1. Weld the mesh by position (UV-seam duplicates share one weight row), islands, vertex areas, averaged normals.
2. Rigid parts by island: collar band + 13 rivets -> collar; 2 chain links + brass ring -> collar_ring (100 %).
3. Body labels: argmin over allowed bones of d(v, bone segment) / r_bone(t)  (normalised distance: the torso bones have a
   large radius so the deep chest stays on the spine, legs a small one). Gates keep bones in their region (side, front/hind,
   height, distance along the body). Masks override: ear flaps -> L/R_ear, chin + jaw underside -> jaw, tail -> tail chain.
4. Blend by geodesic distance to each label boundary (multi-source Dijkstra from the boundary edge midpoints): the other
   bone gets 1 - smoothstep(d / w) against 1 for the own bone, w = blend half-width of that joint, so every boundary is
   50/50 whatever the mesh density, and nothing leaks across air gaps (legs, ear vs cheek).
5. Drop < 1 %, top 4, normalise. Returns {bone: {mesh vertex index: weight}} plus stats.
"""
import math, heapq
import numpy as np

# ---------------------------------------------------------------- parameters (metres, G1 scale)
# normalised-distance radius (head, tail) per bone. Torso bones: radius of the body around the spine (vs limbs only);
# limb bones: radius of the limb, larger for Scapula / UpperArm whose skin lies on the chest wall; Finger / Toe start small
# so the pads behind the ball joint go with Hand / Foot (heel lift of a digitigrade paw).
RADIUS = {
    'pelvis': (0.30, 0.30), 'spine_01': (0.30, 0.32), 'spine_02': (0.33, 0.40), 'chest': (0.42, 0.45),
    'neck_01': (0.38, 0.32), 'neck_02': (0.31, 0.27), 'head': (0.20, 0.12),
    'Scapula': (0.24, 0.22), 'UpperArm': (0.20, 0.16), 'ForeArm': (0.11, 0.09), 'Hand': (0.08, 0.12), 'Finger': (0.07, 0.14),
    'Thigh': (0.20, 0.15), 'Calf': (0.13, 0.10), 'Foot': (0.09, 0.12), 'Toe': (0.07, 0.14),
}
# blend half-width per label (metres); a boundary between A and B uses min(W[A], W[B])
WIDTH = {
    'pelvis': 0.15, 'spine_01': 0.16, 'spine_02': 0.16, 'chest': 0.15, 'neck_01': 0.12, 'neck_02': 0.10, 'head': 0.08,
    'jaw': 0.025, 'ear': 0.035, 'tail_01': 0.08, 'tail': 0.06,
    'Scapula': 0.12, 'UpperArm': 0.11, 'ForeArm': 0.07, 'Hand': 0.04, 'Finger': 0.03,
    'Thigh': 0.15, 'Calf': 0.08, 'Foot': 0.05, 'Toe': 0.03,
}
TORSO = ('pelvis', 'spine_01', 'spine_02', 'chest', 'neck_01', 'neck_02', 'head')
FRONT = ('Scapula', 'UpperArm', 'ForeArm', 'Hand', 'Finger')
HIND = ('Thigh', 'Calf', 'Foot', 'Toe')
TAIL = ('tail_01', 'tail_02', 'tail_03', 'tail_04')
# torso chain split by boundary curves y_b(z) (piecewise linear, metres): in front of the curve (y < y_b) = next bone.
# chest|neck_01 runs forward both at the bottom (the point of the chest stays on chest) and at the top (the withers hump
# stays mostly on chest); the geodesic smoothing blends either side.
TORSO_CURVES = [('spine_01', [(0.0, 0.36), (2.0, 0.36)]), ('spine_02', [(0.0, 0.10), (2.0, 0.10)]),
                ('chest', [(0.0, -0.18), (2.0, -0.18)]),
                ('neck_01', [(0.30, -0.70), (0.50, -0.66), (0.95, -0.50), (1.35, -0.62)]),
                ('neck_02', [(0.30, -0.80), (0.50, -0.76), (0.96, -0.65), (1.35, -0.70)]),
                ('head', [(0.0, -0.785), (2.0, -0.785)])]
# beside the skull (|x| > 0.14, ear roots) the head reaches back to y -0.73 above z 0.90, so the whole ear attachment is head
HEAD_SIDE = [(0.0, -0.785), (0.82, -0.785), (0.92, -0.73), (2.0, -0.73)]
HEAD_SIDE_X = (0.10, 0.14)
# outside the collar (|x| > 0.24) the back edge of the ear flap is fused to the neck skin down to z 0.78: head there too
HEAD_OUT = [(0.0, -0.785), (0.72, -0.785), (0.78, -0.70), (1.0, -0.70), (1.1, -0.73), (2.0, -0.73)]
HEAD_OUT_X = (0.21, 0.24)
TAIL_Y_ALL = 0.81          # behind the hind heels (hock back 0.79, heel 0.807) every body vertex is tail
# limb gates: (|x| min, y min, y max, z min, z max)
LEG_GATE = {'Scapula': (0.12, -0.66, -0.22, 0.60, 1.20), 'UpperArm': (0.11, -0.68, -0.15, 0.28, 0.90),
            'ForeArm': (0.09, -9, 0.0, -9, 0.62), 'Hand': (0.06, -9, 0.0, -9, 0.30), 'Finger': (0.06, -9, 0.0, -9, 0.15),
            'Thigh': (0.06, 0.30, 9, 0.35, 9), 'Calf': (0.07, 0.25, 9, -9, 0.80), 'Foot': (0.06, 0.25, 9, -9, 0.45),
            'Toe': (0.06, 0.25, 9, -9, 0.15)}
TORSO_ZMIN = 0.28          # nothing below the brisket (z 0.31) belongs to the torso: legs and paws only
MIDLINE = 0.05             # leg weights fade to 0 between |x| = MIDLINE and the midline, never cross it
EAR_BOX = dict(y=(-0.92, -0.735), z=(0.68, 1.045), x_out=0.185, x_in=0.15, nx_in=-0.3)
JAW_BOX = dict(y=(-1.03, -0.835), x=0.075, z=0.712)
TAIL_X = 0.08


def base_name(b):
    return b[2:] if b[:2] in ('L_', 'R_') else b


def width(b):
    n = base_name(b)
    if n == 'ear':
        return WIDTH['ear']
    if n.startswith('tail_'):
        return WIDTH['tail_01'] if n == 'tail_01' else WIDTH['tail']
    return WIDTH.get(n, 0.06)


def weld(me, tol=1e-6):
    """Positional weld: rep[i] = welded id of mesh vertex i. Returns P, rep, edges (welded), faces (welded index lists)."""
    co = np.array([v.co[:] for v in me.vertices])
    key = np.round(co / tol).astype(np.int64)
    _, rep, inv = np.unique(key, axis=0, return_index=True, return_inverse=True)
    inv = inv.reshape(-1)
    P = co[rep]
    faces = [[int(inv[i]) for i in p.vertices] for p in me.polygons]
    E = set()
    for f in faces:
        for a, b in zip(f, f[1:] + f[:1]):
            if a != b:
                E.add((min(a, b), max(a, b)))
    return P, inv, np.array(sorted(E)), faces


def islands(n, E):
    par = np.arange(n)

    def find(a):
        while par[a] != a:
            par[a] = par[par[a]]; a = par[a]
        return a
    for a, b in E:
        ra, rb = find(a), find(b)
        if ra != rb:
            par[ra] = rb
    roots = np.array([find(i) for i in range(n)])
    _, lab = np.unique(roots, return_inverse=True)
    return lab


def vertex_areas_normals(P, faces, me, inv):
    n = len(P); A = np.zeros(n); N = np.zeros((n, 3))
    for f in faces:
        if len(f) < 3:
            continue
        p0 = P[f[0]]; ar = 0.0
        for i in range(1, len(f) - 1):
            ar += 0.5 * np.linalg.norm(np.cross(P[f[i]] - p0, P[f[i + 1]] - p0))
        for v in f:
            A[v] += ar / len(f)
    for i, v in enumerate(me.vertices):
        N[inv[i]] += v.normal[:]
    N /= np.maximum(np.linalg.norm(N, axis=1, keepdims=True), 1e-9)
    return A, N


def seg_dist(P, a, b):
    a = np.asarray(a); ab = np.asarray(b) - a; L2 = max(ab @ ab, 1e-12)
    t = np.clip((P - a) @ ab / L2, 0, 1)
    return np.linalg.norm(P - (a + t[:, None] * ab), axis=1), t


def polyline_dist(P, pts):
    best = np.full(len(P), np.inf); seg = np.zeros(len(P), int); tt = np.zeros(len(P))
    for i in range(len(pts) - 1):
        d, t = seg_dist(P, pts[i], pts[i + 1])
        m = d < best; best[m] = d[m]; seg[m] = i; tt[m] = t[m]
    return best, seg, tt


def csr(n, E, P):
    L = np.linalg.norm(P[E[:, 0]] - P[E[:, 1]], axis=1)
    src = np.concatenate([E[:, 0], E[:, 1]]); dst = np.concatenate([E[:, 1], E[:, 0]]); ln = np.concatenate([L, L])
    o = np.argsort(src, kind='stable'); src, dst, ln = src[o], dst[o], ln[o]
    indptr = np.zeros(n + 1, int); np.add.at(indptr, src + 1, 1); indptr = np.cumsum(indptr)
    return indptr, dst, ln


def pair_ok(a, b, bones):
    """May labels a and b blend? Never across sides or between two legs; ears and jaw only with the head (jaw also neck_02)."""
    A, B = bones[a], bones[b]
    sa, sb = A[:2] if A[:2] in ('L_', 'R_') else '', B[:2] if B[:2] in ('L_', 'R_') else ''
    na, nb_ = base_name(A), base_name(B)
    if sa and sb and sa != sb:
        return False
    legs = (FRONT, HIND)
    for i, grp in enumerate(legs):
        if na in grp and any(nb_ in g for j, g in enumerate(legs) if j != i):
            return False
    for x_, y_ in ((na, nb_), (nb_, na)):
        if x_ == 'ear' and y_ != 'head':
            return False
        if x_ == 'jaw' and y_ not in ('head', 'neck_02'):
            return False
    return True


def boundary_blend(label, nb, Wl, indptr, nbr, ln, active, bones, x):
    """Weights from geodesic distance to label boundaries. Wl[k] = blend half-width of label k."""
    n = len(label)
    OK = np.array([[pair_ok(a, b, bones) for b in range(nb)] for a in range(nb)])
    side = np.array([1 if b.startswith('L_') else -1 if b.startswith('R_') else 0 for b in bones])
    legbone = np.array([base_name(b) in FRONT + HIND for b in bones])
    R = np.zeros((n, nb)); R[np.arange(n), label] = 1.0
    for B in np.unique(label[active]):
        wmax = Wl[B]
        reach = active & OK[B][label]
        if legbone[B]:
            reach &= side[B] * x > 0.0
        hq = []; dist = {}
        for u in np.flatnonzero(label == B):
            for j in range(indptr[u], indptr[u + 1]):
                v = nbr[j]
                if label[v] != B and reach[v]:
                    d = 0.5 * ln[j]
                    if d < dist.get(v, np.inf):
                        dist[v] = d; heapq.heappush(hq, (d, v))
        while hq:
            d, u = heapq.heappop(hq)
            if d > dist.get(u, np.inf):
                continue
            for j in range(indptr[u], indptr[u + 1]):
                v = nbr[j]; nd = d + ln[j]
                if label[v] != B and reach[v] and nd < wmax and nd < dist.get(v, np.inf):
                    dist[v] = nd; heapq.heappush(hq, (nd, v))
        for v, d in dist.items():
            w = min(Wl[B], Wl[label[v]])
            if d < w:
                t = d / w
                f = 1.0 - (3 * t * t - 2 * t * t * t)
                if legbone[B]:             # fade a leg's weight to 0 at the midline (no seam between the two sides)
                    f *= min(1.0, side[B] * x[v] / MIDLINE)
                R[v, B] += f
    return R / R.sum(1, keepdims=True)


def compute(mesh_ob, rig, J, log=print):
    """Weights for every deform bone of `rig` (rest pose). J: b01_skel.J (tail polyline)."""
    me = mesh_ob.data
    M = rig.matrix_world.inverted() @ mesh_ob.matrix_world
    assert all(abs(M[i][j] - (1.0 if i == j else 0.0)) < 1e-9 for i in range(4) for j in range(4)), 'mesh and rig must share a space'
    P, inv, E, faces = weld(me)
    n = len(P)
    lab = islands(n, E)
    sizes = np.bincount(lab); order = np.argsort(-sizes)
    rank = np.empty_like(order); rank[order] = np.arange(len(order))
    vr = rank[lab]                                      # island rank per welded vertex
    assert sizes[order[0]] > 4000 and sizes[order[1]] == 181, f'unexpected islands {sizes[order[:5]]}'
    A, N = vertex_areas_normals(P, faces, me, inv)
    bones = [b.name for b in rig.data.bones if b.use_deform]
    bi = {b: i for i, b in enumerate(bones)}
    nb = len(bones)
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    body = vr == 0
    # ---- torso label by the boundary curves
    label = np.full(n, bi['pelvis'])
    for nm, pts in TORSO_CURVES:
        zz = np.array([q[0] for q in pts]); yy = np.array([q[1] for q in pts])
        yb = np.interp(z, zz, yy)
        if nm == 'head':
            ys = np.interp(z, [q[0] for q in HEAD_SIDE], [q[1] for q in HEAD_SIDE])
            t = np.clip((np.abs(x) - HEAD_SIDE_X[0]) / (HEAD_SIDE_X[1] - HEAD_SIDE_X[0]), 0, 1)
            yb = yb + (ys - yb) * t
            yo = np.interp(z, [q[0] for q in HEAD_OUT], [q[1] for q in HEAD_OUT])
            t = np.clip((np.abs(x) - HEAD_OUT_X[0]) / (HEAD_OUT_X[1] - HEAD_OUT_X[0]), 0, 1)
            yb = yb + (yo - yb) * t
        label[y < yb] = bi[nm]
    # torso score: distance to the spine polyline / body radius along it
    chain = [rig.data.bones[b] for b in TORSO]
    best = np.full(n, np.inf)
    for bb in chain:
        d, t = seg_dist(P, bb.head_local, bb.tail_local)
        r = RADIUS[bb.name][0] + (RADIUS[bb.name][1] - RADIUS[bb.name][0]) * t
        best = np.minimum(best, d / r)
    # limb scores with gates; a limb wins where its normalised distance beats the torso's
    S = np.full((n, nb), np.inf)
    for b in bones:
        nm = base_name(b)
        if nm not in FRONT + HIND:
            continue
        bb = rig.data.bones[b]
        d, t = seg_dist(P, bb.head_local, bb.tail_local)
        r = RADIUS[nm][0] + (RADIUS[nm][1] - RADIUS[nm][0]) * t
        side = 1 if b.startswith('L_') else -1
        ax0, y0, y1, z0, z1 = LEG_GATE[nm]
        g = body & (side * x > ax0) & (side * x > 0.0) & (y > y0) & (y < y1) & (z > z0) & (z < z1)
        S[g, bi[b]] = (d / r)[g]
    lmin = S.min(1); larg = np.argmin(S, 1)
    best[z < TORSO_ZMIN] = np.inf
    limb = body & np.isfinite(lmin) & (lmin < best)
    label[limb] = larg[limb]
    # ---- masks (override)
    ax = np.abs(x)
    ebox = body & (y > EAR_BOX['y'][0]) & (y < EAR_BOX['y'][1]) & (z > EAR_BOX['z'][0]) & (z < EAR_BOX['z'][1])
    ear_out = ebox & (ax >= EAR_BOX['x_out'])
    ear_in = ebox & (ax >= EAR_BOX['x_in']) & (ax < EAR_BOX['x_out']) & (np.sign(x) * N[:, 0] < EAR_BOX['nx_in'])
    ear = ear_out | ear_in
    label[ear & (x > 0)] = bi['L_ear']; label[ear & (x < 0)] = bi['R_ear']
    jaw = body & (y > JAW_BOX['y'][0]) & (y < JAW_BOX['y'][1]) & (ax < JAW_BOX['x']) & (z < JAW_BOX['z'])
    label[jaw] = bi['jaw']
    tp = [J[k] for k in ('tail_01', 'tail_02', 'tail_03', 'tail_04', 'tail_end')]
    td, tseg, tt = polyline_dist(P, tp)
    s_along = np.zeros(n)
    for i in range(4):
        s_along[tseg == i] = i + tt[tseg == i]
    r_tail = 0.16 - 0.11 * np.clip(s_along / 4.0, 0, 1)
    tail = body & (((ax < TAIL_X) & (y > tp[0][1]) & (td < r_tail) & ~((y < 0.735) & (z < 0.76))) | (y > TAIL_Y_ALL))
    for i in range(4):
        label[tail & (tseg == i)] = bi[TAIL[i]]
    # rigid islands
    collar = (vr == 1) | (vr >= 5)
    ring = (vr >= 2) & (vr <= 4)
    label[collar] = bi['collar']; label[ring] = bi['collar_ring']
    assert (label >= 0).all(), f'{(label < 0).sum()} vertices without a label'
    # ---- blending at the label boundaries (body island only; rigid islands keep 100 %)
    Wl = np.array([width(b) for b in bones])
    indptr, nbr, ln = csr(n, E, P)
    W = boundary_blend(label, nb, Wl, indptr, nbr, ln, active=body, bones=bones, x=x)
    # ---- limit
    W[W < 0.01] = 0.0
    keep = np.argsort(-W, 1)[:, :4]
    W4 = np.zeros_like(W); rows = np.arange(n)[:, None]
    W4[rows, keep] = W[rows, keep]
    W4 /= W4.sum(1, keepdims=True)
    # ---- back to mesh vertices
    groups = {b: {} for b in bones}
    for i in range(len(me.vertices)):
        row = W4[inv[i]]
        for j in np.flatnonzero(row):
            groups[bones[j]][i] = float(row[j])
    stats = dict(welded=n, islands=int(len(sizes)), labels={b: int((label == bi[b]).sum()) for b in bones},
                 limb_vertices=int(limb.sum()),
                 masks=dict(ear=int(ear.sum()), ear_inner=int(ear_in.sum()), jaw=int(jaw.sum()), tail=int(tail.sum()),
                            collar=int(collar.sum()), ring=int(ring.sum())),
                 influences={k: int(((W4 > 0).sum(1) == k).sum()) for k in (1, 2, 3, 4)})
    log('[skin]', stats)
    return groups, stats, dict(P=P, inv=inv, label=label, bones=bones, W=W4, vr=vr)
