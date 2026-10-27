"""P03 Hush-Moths R3: skin weights (numpy), per island.

Method (rig_v1 §2b, adapted to a mesh whose parts are separate islands):
- rigid islands (head, eyes) -> one bone;
- chains (legs, antennae, wings, body) -> arc-length parameter of the closest point on the chain's centre line, smooth blends of
  given half-width around each joint (every cross-section of a limb gets the same weights: no twisting at the knobs);
- the body island (fluff + thorax + abdomen, welded) is then smoothed with a uniform Laplacian;
- coincident vertices (split normals, touching islands) get identical weights; top 4, prune < 0.005, sum 1.
"""
import numpy as np
from mathutils import kdtree


def smoothstep(x):
    x = np.clip(x, 0.0, 1.0)
    return x * x * (3 - 2 * x)


def polyline_param(P, line):
    """Arc-length parameter s (and distance) of the closest point on a polyline, for points P (n, 3)."""
    line = np.asarray(line, dtype=float)
    a = line[:-1]; d = line[1:] - a; L = np.linalg.norm(d, axis=1); cum = np.concatenate([[0.0], np.cumsum(L)])
    best_s = np.zeros(len(P)); best_d = np.full(len(P), np.inf)
    for k in range(len(a)):
        if L[k] < 1e-9:
            continue
        t = np.clip(((P - a[k]) @ d[k]) / (L[k] ** 2), 0.0, 1.0)
        q = a[k] + t[:, None] * d[k]
        dist = np.linalg.norm(P - q, axis=1)
        m = dist < best_d
        best_d[m] = dist[m]; best_s[m] = cum[k] + t[m] * L[k]
    return best_s, best_d, cum


def chain_weights(s, joints, halfw):
    """Bones b0..bn along s with joints s_j (n of them) and blend half-widths: (len(s), n+1) weights summing to 1."""
    past = [smoothstep((s - sj + b) / (2 * b)) for sj, b in zip(joints, halfw)]
    cols = [1 - past[0]] + [np.clip(past[k - 1] - past[k], 0, 1) for k in range(1, len(past))] + [past[-1]]
    W = np.stack(cols, axis=1)
    return W / np.maximum(W.sum(1, keepdims=True), 1e-12)


def compute(M, LM, bones_A, log=print):
    """Returns (W (N, nb), names list, report dict)."""
    deform = [b['name'] for b in bones_A if b['deform']]
    col = {n: i for i, n in enumerate(deform)}
    N = M.N; CO = M.CO
    W = np.zeros((N, len(deform)))
    done = np.zeros(N, dtype=bool)
    rep = {}
    B = {b['name']: b for b in bones_A}

    def put(idx, names, Wl):
        for j, n in enumerate(names):
            W[idx, col[n]] += Wl[:, j]
        done[idx] = True

    # rigid: head + eyes
    idx = np.concatenate([M.isl[i] for i in M.ids('head') + M.ids('eye')]).astype(int)
    put(idx, ['head'], np.ones((len(idx), 1))); rep['head_rigid'] = int(len(idx))

    # antennae: rachis param; each small comb island rigid at its mean parameter
    for side in ('L', 'R'):
        A = LM['antennae'][side]
        line = np.vstack([A['base'][None], A['rachis']])
        s_mid = polyline_param(A['mid'][None], line)[0][0]
        names = [f'{side}_antenna_01', f'{side}_antenna_02']
        for i in M.ids('antenna', side):
            vi = np.array(M.isl[i]); s, _, _ = polyline_param(CO[vi], line)
            put(vi, names, chain_weights(s, [s_mid], [0.03]))
        rep[f'{side}_antenna_joint_s'] = round(float(s_mid), 4)

    # wings: bone polyline pivot -> mid -> outer; blend half-width 11 % of the span
    for side in ('L', 'R'):
        Wd = LM['wings'][side]
        for kind in ('F', 'B'):
            D = Wd[kind]; line = np.array([Wd['pivot'], D['mid'], D['outer']])
            vi = np.array(M.isl[M.ids('wing_' + kind, side)[0]])
            s, _, cum = polyline_param(CO[vi], line)
            b = 0.11 * float(D['span_len'])
            put(vi, [f'{side}_Wing{kind}_01', f'{side}_Wing{kind}_02'], chain_weights(s, [cum[1]], [b]))
            rep[f'{side}_Wing{kind}_blend_halfwidth_m'] = round(b, 4)

    # legs: signed distance to the bisector plane at hip / knee / ankle. A closest-point parameter on the bent centre line jumps
    # on the inner side of a folded knee (two vertices 1.4 mm apart differed by 0.84 in weight -> 7x stretch); planes do not.
    for side in ('L', 'R'):
        for n in (1, 2, 3):
            G = LM['legs'][f'{side}_Leg{n}']
            pts = [np.asarray(G[k], dtype=float) for k in ('root_end', 'hip', 'knee', 'ankle', 'tip')]
            vi = np.array(M.isl[M.legs[f'{side}_Leg{n}']]); P = CO[vi]

            def bis(i):
                d1 = pts[i] - pts[i - 1]; d2 = pts[i + 1] - pts[i]
                d2 = d2 / np.linalg.norm(d2)
                nrm = d2 if np.linalg.norm(d1) < 1e-6 else d1 / np.linalg.norm(d1) + d2
                return nrm / np.linalg.norm(nrm)
            dh = (P - pts[1]) @ bis(1); dk = (P - pts[2]) @ bis(2); da = (P - pts[3]) @ bis(3)
            ph = smoothstep((dh + 0.012) / 0.012)                 # thorax until 12 mm inside the body, leg from the hip
            pk = np.minimum(smoothstep((dk + 0.013) / 0.026), ph)
            pa = np.minimum(smoothstep((da + 0.010) / 0.020), pk)
            Wl = np.stack([1 - ph, ph - pk, pk - pa, pa], axis=1)
            put(vi, ['thorax', f'{side}_Leg{n}_01', f'{side}_Leg{n}_02', f'{side}_Leg{n}_03'], Wl)
            rep[f'{side}_Leg{n}'] = dict(thorax_verts=int((ph < 0.999).sum()), knee_blend_verts=int(((pk > 0.001) & (pk < 0.999)).sum()),
                                         ankle_blend_verts=int(((pa > 0.001) & (pa < 0.999)).sum()))

    # body: parameter = y (along the body). The abdomen axis bends down by ~50 deg towards the tip and the body is 30 cm tall,
    # so closest-point projection on the bent axis sent the belly (y 0.12, 13 cm under the axis) to abdomen_02/03 (stretch 9.5x).
    ab = LM['abdomen']
    vi = np.array(M.isl[M.body_i])
    s = CO[vi][:, 1]
    names = ['thorax', 'abdomen_01', 'abdomen_02', 'abdomen_03']
    jy = [float(ab[0][1]) + 0.012, float(ab[1][1]), float(ab[2][1])]      # thorax fully rigid until the hind-leg roots
    Wb = chain_weights(s, jy, [0.028, 0.022, 0.018])
    cum = [0, 0, 0] + jy
    # uniform Laplacian smoothing on the welded body island (keeps sums at 1)
    loc = {int(v): k for k, v in enumerate(vi)}
    nbr = [[] for _ in vi]
    for a, b_ in M.E:
        if a in loc and b_ in loc:
            nbr[loc[a]].append(loc[b_]); nbr[loc[b_]].append(loc[a])
    for _ in range(6):
        avg = np.array([Wb[nb].mean(0) if nb else Wb[k] for k, nb in enumerate(nbr)])
        Wb = 0.5 * Wb + 0.5 * avg
    put(vi, names, Wb / Wb.sum(1, keepdims=True))
    rep['body_joint_y'] = [round(float(x), 4) for x in jy]

    rep['unassigned'] = int((~done).sum())
    # coincident vertices -> identical weights, but only inside one island or between the parts of one antenna (comb teeth on
    # the shaft). A leg vertex touching the fluff must not be glued to it (the fluff would follow the leg as a spike).
    def part(i):
        ro, sd = M.role[M.lab[i]]
        return ('antenna', sd) if ro == 'antenna' else ('island', M.lab[i])
    kd = kdtree.KDTree(N)
    for i, p in enumerate(CO):
        kd.insert(p, i)
    kd.balance()
    cgroups = []; skipped = 0
    seen = np.zeros(N, dtype=bool)
    for i in range(N):
        if seen[i]:
            continue
        grp = [j for (_, j, dd) in kd.find_range(CO[i], 1e-6)]
        seen[grp] = True
        by = {}
        for j in grp:
            by.setdefault(part(j), []).append(j)
        if len(by) > 1:
            skipped += 1
        cgroups += [g for g in by.values() if len(g) > 1]

    def coincident_avg():
        for g in cgroups:
            W[g] = W[g].mean(0)
    coincident_avg()
    rep['coincident_groups'] = len(cgroups); rep['coincident_cross_part_left_free'] = skipped
    # L/R symmetry: average every vertex with its mirror partner (bone names mirrored); the mesh is symmetric to 0.2 mm
    mir = np.array([col[('R_' + n[2:]) if n.startswith('L_') else ('L_' + n[2:]) if n.startswith('R_') else n] for n in deform])
    W0 = W.copy(); paired = 0
    for i, p in enumerate(CO):
        _, j, dd = kd.find((-p[0], p[1], p[2]))
        if dd < 0.001 and M.role[M.lab[i]][0] == M.role[M.lab[j]][0]:
            W[i] = 0.5 * (W0[i] + W0[j][mir]); paired += 1
    rep['mirror_paired_verts'] = paired
    coincident_avg()
    # top 4, prune, normalise
    order = np.argsort(-W, axis=1)
    W2 = np.zeros_like(W)
    for i in range(N):
        keep = [k for k in order[i, :4] if W[i, k] >= 0.005]
        if not keep:
            keep = [order[i, 0]]
        W2[i, keep] = W[i, keep]
    W2 /= W2.sum(1, keepdims=True)
    rep['max_influences'] = int((W2 > 0).sum(1).max())
    return W2, deform, rep


def write_groups(ob, W, names):
    for g in list(ob.vertex_groups):
        ob.vertex_groups.remove(g)
    vg = {n: ob.vertex_groups.new(name=n) for n in names}
    for i in range(W.shape[0]):
        for k in np.nonzero(W[i])[0]:
            vg[names[k]].add([i], float(W[i, k]), 'REPLACE')


def collapse(W, names, mapping):
    """Variant B: move the weight columns of dropped bones onto their targets. Returns (W_B, names_B)."""
    idx = {n: i for i, n in enumerate(names)}
    keep = [n for n in names if n not in mapping]
    WB = np.zeros((W.shape[0], len(keep))); kidx = {n: i for i, n in enumerate(keep)}
    for n in names:
        t = n
        while t in mapping:
            t = mapping[t]
        WB[:, kidx[t]] += W[:, idx[n]]
    return WB, keep
