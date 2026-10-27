"""W04 skin weights (numpy only, no bpy). R3 of rig/rig_brief.md.

Input: welded positions U (n,3), welded edges E, component labels comp, runtime bone table B (w04_rig_def.build()).
Output: dict(W (n, nb) weights per welded vertex, names, label (hard region per vertex), info).

1. Regions. Each limb is cut from the body by a plane at its root; the limb region is the connected piece (through edges
   whose both ends pass the test) of the limb's seed vertex among vertices that are (a) on the distal side of the plane and
   (b) inside a capsule around the limb's bone chain. The capsule stops the piece from leaking along the body surface; the
   connectivity keeps neighbouring parts that do not share the limb's surface (thorax plates over the lobes, crest thorns
   beside the wing hinge, the hind leg beside the lobes) out of it. Order: proboscis, head, wings, legs, abdomen; the rest
   of the main island is thorax. Loose pieces: eyes -> head, lower wing blades -> WingB chain, leg spurs -> nearest leg bone.
2. Inside a region each vertex takes the nearest bone of that region's chain (distance to the bone segment).
3. Transitions: for every allowed pair of touching labels (parent-child, WingF-WingB, the two lobes) the vertices within a
   geodesic band of the shared border are freed and solved as a harmonic (Laplace) field with the rest fixed one-hot.
4. Thorax plates that overhang the abdomen follow abdomen_01 partly (gradient along +Y).
5. At most 4 influences, renormalised to sum 1.
"""
import heapq

import numpy as np

import w04_mesh as M


def unit(v):
    v = np.asarray(v, float)
    return v / np.linalg.norm(v)


def seg_dist(P, a, b):
    a = np.asarray(a, float); b = np.asarray(b, float)
    ab = b - a
    t = np.clip(((P - a) @ ab) / max(ab @ ab, 1e-12), 0.0, 1.0)
    return np.linalg.norm(P - (a + t[:, None] * ab), axis=1), t


def chain_dist(P, bones):
    return np.min(np.stack([seg_dist(P, b['head'], b['tail'])[0] for b in bones], 1), 1)


def grow(adj, seed, ok):
    """connected piece of `seed` through vertices with ok[v]."""
    if not ok[seed]:
        return np.zeros(len(ok), bool)
    out = np.zeros(len(ok), bool)
    out[seed] = True
    st = [seed]
    while st:
        a = st.pop()
        for b, _ in adj[a]:
            if ok[b] and not out[b]:
                out[b] = True
                st.append(b)
    return out


def grow_multi(adj, seeds, ok):
    out = np.zeros(len(ok), bool)
    st = [int(v) for v in seeds if ok[v]]
    for v in st:
        out[v] = True
    while st:
        a = st.pop()
        for b, _ in adj[a]:
            if ok[b] and not out[b]:
                out[b] = True
                st.append(b)
    return out


def fill_nearest(adj, label, todo):
    """label the `todo` vertices with the label of the geodesically nearest labelled vertex (paths through todo vertices)."""
    n = len(adj)
    dist = np.full(n, np.inf)
    pq = []
    for v in np.nonzero(todo)[0]:
        for b, l in adj[v]:
            if not todo[b] and label[b] >= 0 and l < dist[v]:
                dist[v] = l
                label[v] = label[b]
    for v in np.nonzero(np.isfinite(dist))[0]:
        pq.append((dist[v], int(v)))
    heapq.heapify(pq)
    while pq:
        d, a = heapq.heappop(pq)
        if d > dist[a]:
            continue
        for b, l in adj[a]:
            if todo[b] and d + l < dist[b]:
                dist[b] = d + l
                label[b] = label[a]
                heapq.heappush(pq, (d + l, b))
    return int(np.isfinite(dist[todo]).sum())


def band_from(adj, src_mask, allowed, width):
    """geodesic distance (<= width) from the vertices in src_mask, through allowed vertices."""
    dist = np.full(len(adj), np.inf)
    pq = [(0.0, int(v)) for v in np.nonzero(src_mask)[0]]
    for _, v in pq:
        dist[v] = 0.0
    heapq.heapify(pq)
    while pq:
        d, a = heapq.heappop(pq)
        if d > dist[a] or d > width:
            continue
        for b, l in adj[a]:
            if not allowed[b]:
                continue
            nd = d + l
            if nd < dist[b] and nd <= width:
                dist[b] = nd
                heapq.heappush(pq, (nd, b))
    return dist


def harmonic(W, free, E, L, iters=1500, tol=1e-7):
    """Jacobi iterations of the edge-length-weighted graph Laplacian on the free rows of W (others fixed)."""
    w = 1.0 / np.maximum(L, 1e-5)
    a, b = E[:, 0], E[:, 1]
    # directed edges into free vertices
    src = np.concatenate([a, b]); dst = np.concatenate([b, a]); ww = np.concatenate([w, w])
    m = free[src]
    src, dst, ww = src[m], dst[m], ww[m]
    fidx = np.nonzero(free)[0]
    deg = np.bincount(src, weights=ww, minlength=len(free))
    W = W.copy()
    chans = np.nonzero(W[np.unique(np.concatenate([src, dst]))].any(0))[0]
    nv = len(free)
    for it in range(iters):
        acc = np.zeros((nv, len(chans)))
        for k, c in enumerate(chans):
            acc[:, k] = np.bincount(src, weights=W[dst, c] * ww, minlength=nv)
        new = np.zeros((len(fidx), W.shape[1]))
        new[:, chans] = acc[fidx] / np.maximum(deg[fidx], 1e-12)[:, None]
        delta = np.abs(new - W[fidx]).max() if len(fidx) else 0.0
        W[fidx] = new
        if delta < tol:
            break
    return W, it + 1


def compute(U, E, comp, B, cfg=None):
    cfg = cfg or {}
    bn = {b['name']: b for b in B}
    names = [b['name'] for b in B if b['kind'] == 'core' and b['name'] not in ('root', 'cog')]
    ix = {n: i for i, n in enumerate(names)}
    n = len(U)
    adj = M.adjacency(n, E, U)
    L = np.linalg.norm(U[E[:, 0]] - U[E[:, 1]], axis=1)
    sizes = np.bincount(comp)
    main = int(np.argmax(sizes))
    inmain = comp == main
    label = np.full(n, -1, dtype=np.int64)
    info = dict(regions={}, loose={})
    x, y, z = U[:, 0], U[:, 1], U[:, 2]

    def chain(prefix_list):
        return [bn[nm] for nm in prefix_list]

    def assign_nearest(mask, bones):
        idx = np.nonzero(mask)[0]
        D = np.stack([seg_dist(U[idx], b['head'], b['tail'])[0] for b in bones], 1)
        label[idx] = np.array([ix[bones[k]['name']] for k in np.argmin(D, 1)])

    def region(name, plane_p, plane_n, bones, R, seed, extra=None, seed_r=0.0, seed_bones=None, spheres=(), planes=()):
        P0 = np.asarray(plane_p, float); nn = unit(plane_n)
        cap = chain_dist(U, bones) < R
        for c_, r_ in spheres:
            cap |= np.linalg.norm(U - np.asarray(c_, float), axis=1) < r_
        ok = inmain & (label < 0) & (((U - P0) @ nn) > 0) & cap
        for pp_, pn_ in planes:                        # further half-spaces the region must also be on the far side of
            ok &= ((U - np.asarray(pp_, float)) @ unit(pn_)) > 0
        if extra is not None:
            ok &= extra
        seeds = [seed]
        if seed_r > 0:
            seeds += np.nonzero(ok & (chain_dist(U, seed_bones or bones) < seed_r))[0].tolist()
        reg = grow_multi(adj, seeds, ok)
        info['regions'][name] = int(reg.sum())
        return reg

    # ---------------- loose pieces
    for c in range(len(sizes)):
        if c == main:
            continue
        idx = np.nonzero(comp == c)[0]
        cc = U[idx].mean(0)
        if cc[1] < -0.25 and cc[2] > 0.85:
            label[idx] = ix['head']; kind = 'eye->head'
        elif cc[2] > 1.0 and abs(cc[0]) > 0.15:
            s = 'L' if cc[0] > 0 else 'R'
            assign_nearest(comp == c, chain([f'{s}_WingB_01', f'{s}_WingB_02'])); kind = f'lower blade->{s}_WingB'
        else:
            legs = [b for b in B if '_Leg' in b['name']]
            D = np.stack([seg_dist(U[idx], b['head'], b['tail'])[0].mean() * np.ones(1) for b in legs], 1)[0]
            k = int(np.argmin(D))
            label[idx] = ix[legs[k]['name']]; kind = f'spur->{legs[k]["name"]}'
        info['loose'][int(c)] = dict(n=int(len(idx)), c=cc.round(3).tolist(), to=kind)

    # ---------------- proboscis (tip seed), head (eye-side seed)
    pro = chain(['proboscis_01', 'proboscis_02', 'proboscis_03'])
    p_root = np.asarray(pro[0]['head']); p_dir = unit(np.asarray(pro[2]['tail']) - p_root)
    tip = int(np.argmin(np.where(inmain, y, np.inf)))
    r_pro = region('proboscis', p_root + p_dir * cfg.get('pro_cut', 0.0), p_dir, pro, 0.06, tip)
    assign_nearest(r_pro, pro)
    hb = bn['head']
    h_dir = unit(np.asarray(hb['tail']) - np.asarray(hb['head']))
    h_seed_pt = np.asarray(hb['tail'])
    cand = np.nonzero(inmain & (label < 0))[0]
    h_seed = int(cand[np.argmin(np.linalg.norm(U[cand] - h_seed_pt, axis=1))])
    r_head = region('head', np.asarray(hb['head']) + h_dir * cfg.get('neck_cut', 0.0), h_dir, [hb] + pro, 0.17, h_seed,
                    seed_r=cfg.get('head_seed_r', 0.10), seed_bones=[hb])
    label[r_head] = ix['head']

    # ---------------- wings: cut at the hinge, normal = mean of the two inner wing bones; stay outboard of the thorax top
    for s, sg in (('L', 1.0), ('R', -1.0)):
        wb = chain([f'{s}_WingF_01', f'{s}_WingF_02', f'{s}_WingB_01', f'{s}_WingB_02'])
        hinge = np.asarray(wb[0]['head'])
        nrm = unit(unit(np.asarray(wb[0]['tail']) - hinge) + unit(np.asarray(wb[2]['tail']) - hinge))
        wseed_pt = np.asarray(wb[1]['tail'])
        cand = np.nonzero(inmain & (label < 0))[0]
        wseed = int(cand[np.argmin(np.linalg.norm(U[cand] - wseed_pt, axis=1))])
        r_w = region(f'wing_{s}', hinge + nrm * cfg.get('wing_cut', 0.0), nrm, wb, cfg.get('wing_cap', 0.24), wseed,
                     extra=(sg * x > cfg.get('wing_xmin', 0.12)), seed_r=cfg.get('wing_seed_r', 0.05), seed_bones=wb[:2])
        # the main-island wing (leading-edge rib + upper blades + the short bottom blade, all joined) is WingF; WingB is the
        # separate lower blade (loose piece above), so the two blade chains share no edges and can fan without tearing
        assign_nearest(r_w, wb[:2])

    # ---------------- legs: cut part-way down the coxa
    for leg in ('Leg1', 'Leg3'):
        for s in ('L', 'R'):
            lb = chain([f'{s}_{leg}_0{k}' for k in (1, 2, 3, 4)])
            j0, j1 = np.asarray(lb[0]['head']), np.asarray(lb[0]['tail'])
            cut = j0 + (j1 - j0) * cfg.get('coxa_cut', 0.45)
            foot_pt = np.asarray(lb[3]['tail'])
            cand = np.nonzero(inmain & (label < 0))[0]
            fseed = int(cand[np.argmin(np.linalg.norm(U[cand] - foot_pt, axis=1))])
            r_l = region(f'{s}_{leg}', cut, j1 - j0, lb, cfg.get('leg_cap', 0.075), fseed, seed_r=cfg.get('leg_seed_r', 0.045),
                         spheres=[(foot_pt, cfg.get('foot_sphere', 0.16))])
            assign_nearest(r_l, lb)

    # ---------------- abdomen: cut at the thorax rear along abdomen_01; seeds at both lobe tips
    ab = chain(['abdomen_01', 'L_abdomen_02', 'L_abdomen_03', 'R_abdomen_02', 'R_abdomen_03'])
    a0, a1 = np.asarray(ab[0]['head']), np.asarray(ab[0]['tail'])
    r_ab = np.zeros(n, bool)
    for s, bi in (('L', 2), ('R', 4)):
        tp = np.asarray(ab[bi]['tail'])
        cand = np.nonzero(inmain & (label < 0))[0]
        aseed = int(cand[np.argmin(np.linalg.norm(U[cand] - tp, axis=1))])
        # two cuts: the tilted one along abdomen_01 keeps the thorax plates that overhang the lobes out (their only link to the
        # lobes is high up at the junction), the vertical one behind the hind coxae keeps the abdomen off the hind legs
        pp, pn = a0 + (a1 - a0) * cfg.get('abd_cut', 0.15), a1 - a0
        extra_planes = [((0.0, cfg['abd_plane_y'], 0.0), (0.0, 1.0, 0.0))] if cfg.get('abd_plane_y') is not None else []
        r_ab |= region(f'abdomen_{s}', pp, pn, ab, cfg.get('abd_cap', 0.24), aseed, extra=(z < cfg.get('abd_zmax', 0.97)),
                       planes=extra_planes)
    # lobes by side, base by nearest segment
    idx = np.nonzero(r_ab)[0]
    if len(idx):
        D = np.stack([seg_dist(U[idx], b['head'], b['tail'])[0] for b in ab], 1)
        # a lobe vertex may not take the other side's bones
        side = np.sign(x[idx])
        D[side > 0, 3:] = np.inf
        D[side < 0, 1:3] = np.inf
        label[idx] = np.array([ix[ab[k]['name']] for k in np.argmin(D, 1)])
    info['regions']['abdomen'] = int(r_ab.sum())

    # ---------------- thorax = the unlabelled piece around the thorax; leftovers (claw tips, knee thorns, the face patch between
    # the eyes, all cut off from their limb's seed) take the geodesically nearest label
    tb = bn['thorax']
    cand = np.nonzero(inmain & (label < 0))[0]
    tseed = int(cand[np.argmin(seg_dist(U[cand], tb['head'], tb['tail'])[0])])
    r_th = grow(adj, tseed, inmain & (label < 0))
    label[r_th] = ix['thorax']
    info['regions']['thorax'] = int(r_th.sum())
    left = inmain & (label < 0)
    info['leftover'] = int(left.sum())
    info['leftover_filled'] = fill_nearest(adj, label, left)
    still = inmain & (label < 0)
    label[still] = ix['thorax']
    info['leftover_unreached'] = int(still.sum())

    # ---------------- transitions (harmonic bands)
    W = np.zeros((n, len(names)))
    W[np.arange(n), label] = 1.0
    pairs = {}
    for b in B:
        if b['name'] in ix and b['parent'] in ix:
            pairs[(b['parent'], b['name'])] = None
    pairs[('L_abdomen_02', 'R_abdomen_02')] = None
    for s in ('L', 'R'):                       # siblings that may touch under the thorax rear
        pairs[('abdomen_01', f'{s}_Leg3_01')] = None
    pairs[('L_abdomen_03', 'R_abdomen_03')] = None
    widths = cfg.get('band', {})

    def width_of(a, b):
        if a[:2] in ('L_', 'R_') and b[:2] in ('L_', 'R_') and a[2:] == b[2:]:
            return widths.get('lobes_LR_' + a[2:], 0.12)       # the cleft between the two lobes
        for key in (b, a):
            for pat, w in widths.items():
                if pat in key:
                    return w
        return 0.03
    free = np.zeros(n, bool)
    a_, b_ = E[:, 0], E[:, 1]
    band_rep = {}
    for (pa, ch) in pairs:
        ia, ic = ix[pa], ix[ch]
        border = ((label[a_] == ia) & (label[b_] == ic)) | ((label[a_] == ic) & (label[b_] == ia))
        if not border.any():
            continue
        src = np.zeros(n, bool); src[a_[border]] = True; src[b_[border]] = True
        allowed = (label == ia) | (label == ic)
        w = width_of(pa, ch)
        d = band_from(adj, src, allowed, w)
        fb = np.isfinite(d)
        free |= fb
        band_rep[f'{pa}|{ch}'] = dict(width=w, border_edges=int(border.sum()), free=int(fb.sum()))
    # keep a fixed core in the middle of every bone below the big body bones, so that a band never covers a whole short bone
    # (proboscis_02/03, hind coxa and femur): without fixed 1-values its channel would decay to 0 in the harmonic solve
    # a bone whose region is (almost) all inside bands would get no fixed 1-values and its channel would decay in the harmonic
    # solve (short bones: proboscis_02/03, hind coxa/femur; narrow regions: abdomen_01). Such a bone keeps the most interior
    # quarter of its region fixed (largest geodesic distance to its region border).
    info['core'] = {}
    frac = cfg.get('core_frac', 0.25)
    border_v = np.zeros(n, bool)
    diff = label[a_] != label[b_]
    border_v[a_[diff]] = True; border_v[b_[diff]] = True
    for nm, i in ix.items():
        idx = np.nonzero(label == i)[0]
        if len(idx) == 0 or nm in ('thorax',):
            continue
        fixed_frac = 1.0 - free[idx].mean()
        if fixed_frac >= frac:
            continue
        inside = label == i
        d = band_from(adj, border_v & inside, inside, 1.0)
        k = max(1, int(round(frac * len(idx))))
        core = idx[np.argsort(-np.where(np.isfinite(d[idx]), d[idx], 0.0))[:k]]
        free[core] = False
        info['core'][nm] = int(len(core))
    # never free a vertex of a loose rigid piece (eyes, spurs)
    for c in range(len(sizes)):
        if c != main and not (abs(U[comp == c, 0].mean()) > 0.15 and U[comp == c, 2].mean() > 1.0):
            free[comp == c] = False
    W, iters = harmonic(W, free, E, L, iters=cfg.get('iters', 2000))
    info['bands'] = band_rep
    info['harmonic_iters'] = iters
    info['free'] = int(free.sum())

    # ---------------- thorax plates over the abdomen follow abdomen_01 partly
    pl = (label == ix['thorax']) & (y > cfg.get('plate_y0', 0.12))
    sm = lambda t: t * t * (3 - 2 * t)
    t = np.clip((y - cfg.get('plate_y0', 0.12)) / (cfg.get('plate_y1', 0.45) - cfg.get('plate_y0', 0.12)), 0, 1)
    s_ = cfg.get('plate_follow', 0.6) * sm(t)
    s_[~pl] = 0
    moved = W[:, ix['thorax']] * s_
    W[:, ix['thorax']] -= moved
    W[:, ix['abdomen_01']] += moved
    info['plates'] = dict(n=int(pl.sum()), max_follow=float(s_.max()))

    # ---------------- prune to 4, normalise
    W[W < 1e-4] = 0.0
    order = np.argsort(-W, 1)
    keep = np.zeros_like(W, bool)
    rows = np.arange(n)[:, None]
    keep[rows, order[:, :4]] = True
    W[~keep] = 0.0
    W /= W.sum(1, keepdims=True)
    info['max_influences'] = int((W > 0).sum(1).max())
    return dict(W=W, names=names, label=label, info=info)
