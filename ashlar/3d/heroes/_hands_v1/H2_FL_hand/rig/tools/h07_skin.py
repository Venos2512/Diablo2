"""H2_FL_hand rig, S6 candidate A + the shared enforcement (python -I -B, numpy / scipy).

Candidate A (region + crease planes, designed for LBS):
  rigid islands     eyelets / laces (s < 0.1) -> hand_root; the two braided cords -> forearm_twist; band, chain, rivets -> forearm (1.0 each)
  cuff              main-island rows with s <= cuff_end -> hand_root (the sleeve cuff is part of the skin island)
  forearm skin      ramps along s: hand_root -> forearm_twist over the visible gap between the cuff and the first cord, forearm_twist ->
                    forearm under the second cord (hidden), forearm beyond
  wrist crease      hand share = smootherstep of the signed distance to a plane through (wrist head + offset along the plane normal), normal =
                    bisector of the forearm and wrist directions; offset / half width from the recipe (the band covers the joint, so the
                    visible crease is moved to the band edge)
  hand              per finger chain weights from crease planes at MCP (CMC for the thumb), PIP, DIP (IP): distal share = smootherstep(u / h)
                    with u = (v - J) . unit(dir_in + dir_out); an optional inner-crease bias moves the palmar side toward the distal bone
  partition         which finger's chain a palm row follows: LOBES (vertices beyond each finger's web, by topology) are one-hot; palm rows get
                    the harmonic extension of the lobe one-hots (Laplace on the welded graph), so webs are shared and nothing reaches a
                    neighbour's lobe; thumb_01 is also faded by the distance to its segment (no thenar weight on the hypothenar)
  smoothing         `smooth_passes` Jacobi passes (lambda 0.25) on free rows, then ENFORCE
Enforce (all candidates): rigid islands / cuff exact, lobe gating (a finger's lobe takes only its own bones + wrist), top-4, prune < 0.01,
normalise, co-located duplicates identical (weights are computed on welded ids and scattered).
Writes rig/_work/weights_<tag>.npz {W (n,k) per original vertex, bones (k,), lobe (n_w,), region (n_w,)} + a summary json line.
Usage: python -I -B h07_skin.py <rig_dir> [tag=A]          (reads recipe 'skin' + 'skin_variants'[tag] overrides)
       python -I -B h07_skin.py <rig_dir> enforce <in.npz> <tag>   (enforce an external candidate, e.g. B = Blender bone heat)
"""
import json
import os
import sys

import numpy as np
import scipy.sparse as sp
from scipy.sparse.csgraph import connected_components
from scipy.sparse.linalg import spsolve

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import h_common as hc  # noqa: E402

rig = sys.argv[1]
mode = sys.argv[2] if len(sys.argv) > 2 else 'A'
d, topo = hc.load_mesh(rig)
P, F, E = topo.P, topo.F, topo.edges
nw = topo.n_w
s = -P[:, 1]
sk = json.load(open(os.path.join(rig, '_work', 'skeleton.json')))
LM = {k: np.array(v['pos']) for k, v in json.load(open(os.path.join(rig, 'landmarks.json')))['landmarks'].items()}
fa = json.load(open(os.path.join(rig, '_work', 'fingers_a.json')))
recipe = json.load(open(os.path.join(rig, 'rig_recipe.json')))
BONES = [n for n in sk['order'] if sk['bones'][n]['deform']]
BI = {n: i for i, n in enumerate(BONES)}
K = len(BONES)
FINGERS = ['thumb', 'index', 'middle', 'ring', 'pinky']
main = int(np.bincount(topo.island).argmax())
in_main = topo.island == main


def bone(n):
    b = sk['bones'][n]
    return np.array(b['head']), np.array(b['tail'])


def sstep(x):
    """smootherstep on [-1, 1] -> [0, 1]."""
    t = np.clip((x + 1) / 2, 0, 1)
    return t * t * t * (t * (6 * t - 15) + 10)


# ---------------------------------------------------------------- islands
RIGID = {}
for k in range(topo.n_islands):
    if k == main:
        continue
    m = topo.island == k
    smax, smin = s[m].max(), s[m].min()
    if smax < 0.1:
        RIGID[k] = 'hand_root'
    elif smax <= 0.192 and smin >= 0.12:
        RIGID[k] = 'forearm_twist'
    else:
        RIGID[k] = 'forearm'

# ---------------------------------------------------------------- lobes (topology): beyond each finger's web plane, the component holding the tip
lobe = np.full(nw, -1)
A_ = sp.coo_matrix((np.ones(len(E)), (E[:, 0], E[:, 1])), shape=(nw, nw)).tocsr()
A_ = A_ + A_.T
web_pt = {}
for fi, f in enumerate(FINGERS):
    rr = [r for r in fa[f]['rings'] if not r.get('merged')]
    C = np.array([r['centroid'] for r in rr])
    wp, wd = C[-1], hc.unit(C[-4] - C[-1])  # web point, direction toward the tip
    web_pt[f] = (wp, wd)
    beyond = in_main & (((P - wp) @ wd) > 0)
    idx = np.flatnonzero(beyond)
    sub = A_[idx][:, idx]
    nc, lab = connected_components(sub, directed=False)
    tip = int(np.argmin(np.linalg.norm(P - np.array(fa[f]['tip']), axis=1)))
    comp = lab[np.flatnonzero(idx == tip)[0]]
    mem = idx[lab == comp]
    assert (lobe[mem] == -1).all(), f'lobes overlap at {f}'
    lobe[mem] = fi


def chain_weights(f, cfg):
    """(nw, K) weights of finger f's chain incl. its wrist share, from crease planes."""
    W = np.zeros((nw, K))
    if f == 'thumb':
        names = ['wrist', 'thumb_01', 'thumb_02', 'thumb_03']
        joints = [LM['thumb_cmc'], LM['thumb_mcp'], LM['thumb_ip']]
        dins = [hc.unit(bone('wrist')[1] - bone('wrist')[0])] + [hc.unit(bone(f'thumb_0{k}')[1] - bone(f'thumb_0{k}')[0]) for k in (1, 2)]
        hs = [cfg['thumb_cmc_h'], cfg['thumb_mcp_h'], cfg['thumb_ip_h']]
        offs = [cfg['thumb_cmc_off'], 0.0, 0.0]
    else:
        names = ['wrist', f'{f}_01', f'{f}_02', f'{f}_03']
        joints = [LM[f'{f}_mcp'], LM[f'{f}_pip'], LM[f'{f}_dip']]
        dins = [hc.unit(LM[f'{f}_mcp'] - LM['wrist'])] + [hc.unit(bone(f'{f}_0{k}')[1] - bone(f'{f}_0{k}')[0]) for k in (1, 2)]
        hs = [cfg['mcp_h'], cfg['pip_h'], cfg['dip_h']]
        offs = [cfg['mcp_off'], 0.0, 0.0]
    g = []
    for k in range(3):
        dout = hc.unit(bone(names[k + 1])[1] - bone(names[k + 1])[0])
        n = hc.unit(dins[k] + dout)
        u = (P - joints[k]) @ n - offs[k]
        if cfg['inner_bias'] > 0:
            # palmar side of the joint: the side the hinge flexes toward (+Z local of the distal bone)
            ml = np.array(sk['bones'][names[k + 1]]['matrix_local'])
            zf = ml[:3, 2]
            depth = np.maximum(0.0, (P - joints[k]) @ zf)
            u = u + cfg['inner_bias'] * depth
        g.append(sstep(u / hs[k]))
    g1, g2, g3 = g
    W[:, BI[names[0]]] = 1 - g1
    W[:, BI[names[1]]] = g1 * (1 - g2)
    W[:, BI[names[2]]] = g1 * g2 * (1 - g3)
    W[:, BI[names[3]]] = g1 * g2 * g3
    return W


def seg_dist(p, a, b):
    ab = b - a
    t = np.clip((p - a) @ ab / (ab @ ab), 0, 1)
    return np.linalg.norm(p - (a + t[:, None] * ab), axis=1)


def harmonic_partition():
    """p (nw, 5): lobes one-hot, other main-island rows = harmonic extension; non-main rows 0."""
    fixed = lobe >= 0
    free = in_main & ~fixed
    deg = np.asarray(A_.sum(1)).ravel()
    Lap = sp.diags(deg) - A_
    fi_, fr_ = np.flatnonzero(fixed), np.flatnonzero(free)
    Pfix = np.zeros((len(fi_), 5))
    Pfix[np.arange(len(fi_)), lobe[fi_]] = 1
    Lff = Lap[fr_][:, fr_].tocsc()
    Lfx = Lap[fr_][:, fi_]
    p = np.zeros((nw, 5))
    p[fi_] = Pfix
    rhs = -(Lfx @ Pfix)
    # a free component with no fixed row (the cuff end) would be singular: tiny diagonal regulariser toward uniform
    Lff = Lff + sp.identity(len(fr_)) * 1e-9
    sol = spsolve(Lff, rhs + 1e-9 * 0.2)
    p[fr_] = np.clip(sol, 0, None)
    p /= np.maximum(p.sum(1, keepdims=True), 1e-12)
    return p


def candidate_A(cfg):
    W = np.zeros((nw, K))
    # forearm chain along s (main island)
    fa_ = np.zeros((nw, K))
    r0, r1 = cfg['ramp_root_twist']
    t0, t1 = cfg['ramp_twist_fore']
    a = sstep((s - (r0 + r1) / 2) / ((r1 - r0) / 2))
    if cfg.get('twist_ramp') == 'linear':  # constant shear over the visible gap (smootherstep peaks at 1.875 x the mean slope)
        a = np.clip((s - r0) / (r1 - r0), 0, 1)
    b = sstep((s - (t0 + t1) / 2) / ((t1 - t0) / 2))
    fa_[:, BI['hand_root']] = 1 - a
    fa_[:, BI['forearm_twist']] = a * (1 - b)
    fa_[:, BI['forearm']] = a * b
    # hand
    p = harmonic_partition()
    hand = np.zeros((nw, K))
    t1h, t1t = bone('thumb_01')
    d_t1 = seg_dist(P, t1h, t1t)
    fade = 1 - sstep((d_t1 - (cfg['thumb_r_in'] + cfg['thumb_r_out']) / 2) / ((cfg['thumb_r_out'] - cfg['thumb_r_in']) / 2))
    fade[lobe == 0] = 1.0
    for fi, f in enumerate(FINGERS):
        cw = chain_weights(f, cfg)
        pf = p[:, fi] * (fade if f == 'thumb' else 1.0)
        hand += pf[:, None] * cw
    rest = 1 - hand.sum(1)  # the thumb fade's removed share -> wrist
    hand[:, BI['wrist']] += np.clip(rest, 0, None)
    # wrist crease
    wh, wt = bone('wrist')
    fh, ft = bone('forearm')
    nwr = hc.unit(hc.unit(ft - fh) + hc.unit(wt - wh))
    u = (P - wh) @ nwr - cfg['wrist_off']
    th = sstep(u / cfg['wrist_h'])
    W = (1 - th)[:, None] * fa_ + th[:, None] * hand
    # cuff
    W[in_main & (s <= cfg['cuff_end'])] = 0
    W[in_main & (s <= cfg['cuff_end']), BI['hand_root']] = 1
    return W, dict(partition_thumb_max_on_pinky_side=float(p[(lobe < 0) & in_main & (P[:, 0] < 0.02), 0].max()) if ((lobe < 0) & in_main & (P[:, 0] < 0.02)).any() else 0.0)


def enforce(W, cfg):
    W = W.copy()
    # lobe gating
    for fi, f in enumerate(FINGERS):
        m = lobe == fi
        allow = np.zeros(K, bool)
        allow[[BI[n] for n in BONES if n.startswith(f + '_')]] = True
        allow[BI['wrist']] = True
        W[np.ix_(m, ~allow)] = 0
    # rigid islands, cuff
    for k, bn in RIGID.items():
        m = topo.island == k
        W[m] = 0
        W[m, BI[bn]] = 1
    m = in_main & (s <= cfg['cuff_end'])
    W[m] = 0
    W[m, BI['hand_root']] = 1
    # top-4, prune, normalise
    order = np.argsort(-W, axis=1)
    W[np.arange(nw)[:, None], order[:, 4:]] = 0
    W[W < cfg['prune']] = 0
    W /= np.maximum(W.sum(1, keepdims=True), 1e-12)
    # finger lobes: at most 2 influences when the 3rd+ sum < 0.05
    m = lobe >= 0
    o = np.argsort(-W[m], axis=1)
    Wm = W[m]
    tail = np.take_along_axis(Wm, o[:, 2:], 1).sum(1)
    cut = tail < 0.05
    rows = np.flatnonzero(cut)
    Wm[rows[:, None], o[rows, 2:]] = 0
    Wm /= Wm.sum(1, keepdims=True)
    W[m] = Wm
    return W


def smooth(W, cfg):
    free = in_main & (s > cfg['cuff_end'])
    for _ in range(cfg['smooth_passes']):
        W = hc.sc.smooth_pass(W, E, free, 0.25)
        W = enforce(W, cfg)
    return W


def summary(W, tag, extra=None):
    nz = (W > 0).sum(1)
    leak = 0
    for fi, f in enumerate(FINGERS):
        m = lobe == fi
        other = [BI[n] for n in BONES if any(n.startswith(g + '_') for g in FINGERS if g != f)]
        leak += int((W[m][:, other].sum(1) > 0).sum())
    out = dict(tag=tag, rows=int(nw), max_influences=int(nz.max()), rows_by_influences={int(k): int((nz == k).sum()) for k in range(1, 5)},
               lobe_rows={f: int((lobe == i).sum()) for i, f in enumerate(FINGERS)}, neighbour_leak_rows=leak,
               bone_coverage={n: int((W[:, BI[n]] > 0).sum()) for n in BONES}, rigid_islands={int(k): v for k, v in RIGID.items()})
    if extra:
        out.update(extra)
    return out


def save(W, tag, info):
    Wv = topo.scatter(W)  # per original vertex: duplicates identical
    np.savez(os.path.join(rig, '_work', f'weights_{tag}.npz'), W=Wv.astype(np.float64), bones=np.array(BONES), lobe=lobe, weld=topo.weld)
    hc.save_json(os.path.join(rig, '_work', f'weights_{tag}.json'), info)
    print('H07 ' + json.dumps(dict(tag=tag, max_inf=info['max_influences'], leak=info['neighbour_leak_rows'], lobes=info['lobe_rows'])))


def load_w(tag):
    z = np.load(os.path.join(rig, '_work', f'weights_{tag}.npz'), allow_pickle=True)
    names = [str(x) for x in z['bones']]
    Wv = np.zeros((topo.n, K))
    for j, n in enumerate(names):
        Wv[:, BI[n]] = z['W'][:, j]
    return topo.gather(Wv, how='first')


ARM = ['hand_root', 'forearm_twist', 'forearm']
if mode == 'hybrid':
    # per-region selection (S7 numbers): hand rows from candidate B (bone heat), the arm share re-distributed with A's forearm chain
    # (cuff / twist ramp / forearm). wrist='B' keeps B's own forearm->hand transition; wrist='A' uses A's wrist crease plane.
    ta, tb, tag, wsrc = sys.argv[3], sys.argv[4], sys.argv[5], (sys.argv[6] if len(sys.argv) > 6 else 'B')
    cfg = dict(recipe['skin'])
    cfg.update(recipe.get('skin_variants', {}).get(ta, {}))
    WB_ = load_w(tb)  # A contributes its recipe (forearm chain), not its weights
    ai = [BI[n] for n in ARM]
    hi = [j for j in range(K) if j not in ai]
    r0, r1 = cfg['ramp_root_twist']
    t0, t1 = cfg['ramp_twist_fore']
    a = np.clip((s - r0) / (r1 - r0), 0, 1) if cfg.get('twist_ramp') == 'linear' else sstep((s - (r0 + r1) / 2) / ((r1 - r0) / 2))
    b = sstep((s - (t0 + t1) / 2) / ((t1 - t0) / 2))
    chainA = np.stack([1 - a, a * (1 - b), a * b], 1)
    if wsrc in ('B', 'Bcut'):
        hand = WB_[:, hi]
        if wsrc == 'Bcut':  # B's heat leaks hand weight far up the forearm: keep it only from hand_cut[0] (0) to hand_cut[1] (1) along s
            c0, c1 = cfg.get('hand_cut', [0.22, 0.26])
            hand = hand * sstep((s - (c0 + c1) / 2) / ((c1 - c0) / 2))[:, None]
        arm_mass = 1 - hand.sum(1)
    else:
        wh, wt = bone('wrist')
        fh, ft = bone('forearm')
        nwr = hc.unit(hc.unit(ft - fh) + hc.unit(wt - wh))
        th = sstep(((P - wh) @ nwr - cfg['wrist_off']) / cfg['wrist_h'])
        hb = WB_[:, hi]
        hb = hb / np.maximum(hb.sum(1, keepdims=True), 1e-12)
        hand = th[:, None] * hb
        arm_mass = 1 - th
    W = np.zeros((nw, K))
    W[:, hi] = hand
    W[:, ai] = arm_mass[:, None] * chainA
    W = enforce(W, cfg)
    save(W, tag, summary(W, tag, dict(hybrid=dict(A=ta, B=tb, wrist=wsrc))))
elif mode == 'enforce':
    src, tag = sys.argv[3], sys.argv[4]
    cfg = dict(recipe['skin'])
    z = np.load(src, allow_pickle=True)
    Wsrc = z['W']
    names = [str(x) for x in z['bones']]
    Wv = np.zeros((topo.n, K))
    for j, n in enumerate(names):
        if n in BI:
            Wv[:, BI[n]] = Wsrc[:, j]
    Ww = topo.gather(Wv)  # mean over duplicates
    Ww = enforce(Ww, cfg)
    save(Ww, tag, summary(Ww, tag, dict(source=src)))
else:
    tag = mode
    cfg = dict(recipe['skin'])
    cfg.update(recipe.get('skin_variants', {}).get(tag, {}))
    W, ex = candidate_A(cfg)
    W = enforce(W, cfg)
    W = smooth(W, cfg)
    save(W, tag, summary(W, tag, dict(cfg=cfg, **ex)))
