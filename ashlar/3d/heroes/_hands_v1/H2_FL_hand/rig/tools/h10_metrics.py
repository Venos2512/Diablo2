"""H2_FL_hand rig, S7 metrics (rigkit-env: numpy, scipy, igl) on rig/_work/poses_<tag>.npz.

Definitions (references/deformation-qa.md, adapted to the hand; H = 0.45 m):
  torn edge      welded edge with posed/rest > 1.5 AND growth > 0.2 % H (0.9 mm); per region (dominant bone of candidate A)
  area           area-weighted fraction of faces (min angle >= 10 deg) with |posed/rest - 1| > 0.15, per region
  joint volume   ball occupancy: lattice points in a ball of r = 0.8 x the local limb radius at the child bone head, moved with the child
                 bone, inside the posed main island (generalized winding number) / the same at rest
  candy wrapper  enclosed area of the main-island section at s = 0.105 / 0.115 (visible forearm gap) and 0.29 / 0.30 (hand at the band
                 edge), posed / rest (the forearm roll keeps the axis, so the rest planes are valid)
  penetration    finger lobes vs other lobes and vs the rest of the hand: triangle pairs intersecting in the pose but not at rest; depth
                 of each intruding lobe vertex = distance behind the nearest face of the other part (that face's normal); counted when
                 > 0.05 % H (0.225 mm); 'deep' > 1 mm. Hand skin inside the BAND (closed islands, winding number) newly vs rest: count, depth
  rigid          max |edge length change| (mm) on rigid islands and the cuff (target < 1 mm)
  seam           max distance between co-located duplicates (mm)
Writes rig/_work/metrics_<tag>.json. Usage: python -I -B h10_metrics.py <rig_dir> <tag>
"""
import json
import os
import sys

import igl
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import h_common as hc  # noqa: E402
from solvers import metrics as sm  # noqa: E402

rig, tag = sys.argv[1], sys.argv[2]
H = 0.45
d, topo = hc.load_mesh(rig)
FKMODE = '--fk' in sys.argv  # positions from h_fk (numpy FK + LBS, parity-checked against Blender) instead of poses_<tag>.npz
OUT = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else f'metrics_{tag}.json'
ONLY = sys.argv[sys.argv.index('--poses') + 1].split(',') if '--poses' in sys.argv else None
z = np.load(os.path.join(rig, '_work', 'poses_A.npz' if FKMODE else f'poses_{tag}.npz'), allow_pickle=True)
names = [str(x) for x in z['names']]
Pall, Mall, rest_m, bones = z['P'], z['M'], z['rest'], [str(b) for b in z['bones']]
if FKMODE:
    import h_fk
    fk = h_fk.FK(rig)
    specs = fk.R['rom']['poses']
    names = [n for n in specs if ONLY is None or n in ONLY]
    wz = np.load(os.path.join(rig, '_work', f'weights_{tag}.npz'), allow_pickle=True)
    Mall = np.array([fk.mats(specs[n], bones) for n in names])
    Pall = np.array([h_fk.lbs(d['V'], wz['W'], [str(b) for b in wz['bones']], Mall[i], rest_m, bones) for i in range(len(names))])
BI = {b: i for i, b in enumerate(bones)}
wA = np.load(os.path.join(rig, '_work', 'weights_A.npz'), allow_pickle=True)
WA = topo.gather(wA['W'], how='first')
wb = [str(b) for b in wA['bones']]
lobe = wA['lobe']
dom = np.array(wb)[np.argmax(WA, 1)]
W = topo.gather(np.load(os.path.join(rig, '_work', f'weights_{tag}.npz'), allow_pickle=True)['W'], how='first')
main = int(np.bincount(topo.island).argmax())
in_main = topo.island == main
FING = ['thumb', 'index', 'middle', 'ring', 'pinky']
s_rest = -topo.P[:, 1]
cuff = in_main & (s_rest <= 0.092)


def region_of(i):
    if not in_main[i]:
        return 'rigid'
    if lobe[i] >= 0:
        return FING[lobe[i]]
    b = dom[i]
    for f in FING:
        if b.startswith(f + '_'):
            return f
    return {'hand_root': 'cuff_forearm', 'forearm': 'cuff_forearm', 'forearm_twist': 'cuff_forearm'}.get(b, 'palm')


REG = np.array([region_of(i) for i in range(topo.n_w)])
REGIONS = sorted(set(REG))
Fw, E = topo.F, topo.edges
P0 = topo.P
el0 = np.linalg.norm(P0[E[:, 0]] - P0[E[:, 1]], axis=1)
ar0 = sm.tri_areas(P0, Fw)
ang0 = sm.tri_min_angles(P0, Fw)
good_f = (ang0 >= np.radians(10)) & (ar0 > (1e-5 * H) ** 2)
Fmain = Fw[in_main[Fw].all(1)]
band_isl = [k for k in range(topo.n_islands) if k != main and (s_rest[topo.island == k].max() > 0.2)]
Fband = Fw[np.isin(topo.island[Fw[:, 0]], band_isl)]
rigid_e = (~in_main[E[:, 0]]) | (cuff[E[:, 0]] & cuff[E[:, 1]])
# lattice
LAT = sm.ball_lattice(7)


def welded(Pv):
    return topo.gather(Pv, how='first')


def seam(Pv):
    first = welded(Pv)[topo.weld]
    return float(np.linalg.norm(Pv - first, axis=1).max())


def joint_balls():
    out = {}
    for f in FING:
        for k in (1, 2, 3):
            child = f'{f}_0{k}'
            if f != 'thumb' and k == 1:
                jn = f'{f}_mcp'
            else:
                jn = {('thumb', 1): 'thumb_cmc', ('thumb', 2): 'thumb_mcp', ('thumb', 3): 'thumb_ip'}.get((f, k), f'{f}_{["", "mcp", "pip", "dip"][k]}')
            out[jn] = child
    out['wrist'] = 'wrist'
    return out


JB = joint_balls()
SK = json.load(open(os.path.join(rig, '_work', 'skeleton.json')))['bones']
ball = {}
for jn, child in JB.items():
    h, t = np.array(SK[child]['head']), np.array(SK[child]['tail'])
    ln = np.linalg.norm(t - h)
    near = in_main & (np.linalg.norm(P0 - h, axis=1) < 0.6 * ln) & (W[:, wb.index(child)] >= 0.5)
    dd = sm.seg_dist(P0[near], h, t) if hasattr(sm, 'seg_dist') else hc.sc.seg_dist(P0[near], h, t)
    r = float(np.median(dd)) if near.any() else 0.008
    rb = min(0.8 * r, 0.6 * ln)
    pts = h + LAT * rb
    occ0 = float((sm.winding_inside(P0, Fmain, pts) > 0.5).mean())
    ball[jn] = dict(child=child, radius_mm=r * 1000, ball_mm=rb * 1000, pts=pts, occ0=occ0)


def section_area(Pw, s0):
    a = sm.slice_area(Pw, Fmain, np.array([0, -s0, 0]), np.array([0, -1.0, 0]))
    return a


SEC = [0.105, 0.115, 0.29, 0.30]
sec0 = {s0: section_area(P0, s0) for s0 in SEC}
FL = {f: Fw[(lobe[Fw] == fi).all(1)] for fi, f in enumerate(FING)}
FOTHER = {f: Fw[in_main[Fw].all(1) & ~(lobe[Fw] == fi).any(1)] for fi, f in enumerate(FING)}


def pair_key(Fa, Fb, ia, ib):
    return set(zip(map(tuple, np.sort(Fa[ia], 1)), map(tuple, np.sort(Fb[ib], 1))))


REST_PAIRS = {f: pair_key(FL[f], FOTHER[f], *sm.intersecting_pairs(P0, FL[f], FOTHER[f])) for f in FING}
band_in0 = (sm.winding_inside(P0, Fband, P0[in_main]) > 0.5) if len(Fband) else None


def penetration(Pw):
    out = {}
    for fi, f in enumerate(FING):
        ia, ib = sm.intersecting_pairs(Pw, FL[f], FOTHER[f])
        keys = pair_key(FL[f], FOTHER[f], ia, ib)
        new = [k for k in keys if k not in REST_PAIRS[f]]
        if not new:
            out[f] = dict(new_pairs=0, n_vert=0, max_depth_mm=0.0, into=[])
            continue
        verts = np.unique(np.array([a for a, b in new]).ravel())
        # grow the intruding piece: lobe vertices within 8 mm of a crossing vertex
        lv = np.flatnonzero(lobe == fi)
        cand = lv[np.min(np.linalg.norm(Pw[lv][:, None] - Pw[verts][None], axis=2), 1) < 0.008]
        Fo = FOTHER[f]
        dist, fidx = sm.surface_distance(Pw, Fo, Pw[cand])
        fo = Fo[fidx]
        nrm = np.cross(Pw[fo[:, 1]] - Pw[fo[:, 0]], Pw[fo[:, 2]] - Pw[fo[:, 0]])
        nrm /= np.maximum(np.linalg.norm(nrm, axis=1, keepdims=True), 1e-20)
        sd = np.einsum('ij,ij->i', Pw[cand] - Pw[fo[:, 0]], nrm)
        depth = np.where(sd < 0, dist, 0.0)
        into = sorted(set(REG[np.unique(np.array([b for a, b in new]).ravel())]))
        cnt = depth > 0.0005 * H
        own = lobe[fo].max(1)  # >= 0: behind another finger's lobe (side contact of pressed fingers); < 0: palm / thumb base / wrist
        side = float(depth[own >= 0].max() * 1000) if (own >= 0).any() else 0.0
        palm = float(depth[own < 0].max() * 1000) if (own < 0).any() else 0.0
        out[f] = dict(new_pairs=len(new), n_vert=int(cnt.sum()), n_deep=int((depth > 0.001).sum()), max_depth_mm=float(depth.max() * 1000), into=into,
                      palm_depth_mm=palm, finger_depth_mm=side)
    if band_in0 is not None:
        bi = sm.winding_inside(Pw, Fband, Pw[in_main]) > 0.5
        newin = bi & ~band_in0
        idx = np.flatnonzero(in_main)[newin]
        dep = sm.surface_distance(Pw, Fband, Pw[idx])[0] if len(idx) else np.zeros(0)
        out['skin_in_band'] = dict(n_vert=int((dep > 0.0005 * H).sum()), max_depth_mm=float(dep.max() * 1000) if len(dep) else 0.0,
                                   regions=sorted(set(REG[idx[dep > 0.0005 * H]])) if len(idx) else [])
    return out


res = dict(tag=tag, poses={}, joints={k: dict(child=v['child'], radius_mm=round(v['radius_mm'], 2), ball_mm=round(v['ball_mm'], 2), rest_occ=round(v['occ0'], 3)) for k, v in ball.items()},
           sections_rest_mm2={str(k): (v * 1e6 if v else None) for k, v in sec0.items()})
for p, nm in enumerate(names):
    Pv = Pall[p]
    Pw = welded(Pv)
    el = np.linalg.norm(Pw[E[:, 0]] - Pw[E[:, 1]], axis=1)
    ratio = el / np.maximum(el0, 1e-12)
    torn = (ratio > 1.5) & (el - el0 > 0.002 * H) & (el0 > 2e-5 * H)
    ar = sm.tri_areas(Pw, Fw)
    ach = np.abs(ar / np.maximum(ar0, 1e-20) - 1)
    reg_e = {}
    for rg in REGIONS:
        em = (REG[E[:, 0]] == rg) | (REG[E[:, 1]] == rg)
        fm = good_f & (REG[Fw] == rg).any(1)
        reg_e[rg] = dict(torn=int((torn & em).sum()), edge_p99=float(np.percentile(ratio[em], 99)) if em.any() else None,
                         edge_max=float(ratio[em].max()) if em.any() else None, edge_min=float(ratio[em].min()) if em.any() else None,
                         area_frac=float((ar0[fm] * (ach[fm] > 0.15)).sum() / max(ar0[fm].sum(), 1e-20)) if fm.any() else None)
    rig_dev = float(np.abs(el - el0)[rigid_e].max() * 1000)
    jv = {}
    for jn, b in ball.items():
        j = BI[b['child']]
        S = Mall[p, j] @ np.linalg.inv(rest_m[j])
        pts = (S[:3, :3] @ b['pts'].T).T + S[:3, 3]
        occ = float((sm.winding_inside(Pw, Fmain, pts) > 0.5).mean())
        jv[jn] = round(occ / max(b['occ0'], 1e-9), 3)
    secs = {}
    for s0 in SEC:
        a = section_area(Pw, s0)
        secs[str(s0)] = round(a / sec0[s0], 3) if (a and sec0[s0]) else None
    pen = penetration(Pw) if nm != 'rest' else {}
    res['poses'][nm] = dict(regions=reg_e, torn_total=int(torn.sum()), rigid_dev_mm=round(rig_dev, 4), seam_mm=round(seam(Pv) * 1000, 5),
                            joint_volume=jv, sections=secs, penetration=pen)
    if '--quiet' not in sys.argv:
      print(nm, 'torn', int(torn.sum()), 'rigid', round(rig_dev, 3), 'minvol', min(jv.items(), key=lambda x: x[1]),
          'pen', {k: (v.get('n_vert'), round(v.get('max_depth_mm', 0), 2)) for k, v in pen.items()}, 'sec', secs, flush=True)
# heads inside at rest
heads = {b: np.array(SK[b]['head']) for b in bones if not b.startswith('fx_')}
wn = sm.winding_inside(P0, Fmain, np.array(list(heads.values())))
res['heads_inside_main'] = {b: bool(w > 0.5) for b, w in zip(heads, wn)}
res['regions'] = {rg: int((REG == rg).sum()) for rg in REGIONS}
hc.save_json(os.path.join(rig, '_work', OUT), res)
print('H10 heads outside:', [b for b, v in res['heads_inside_main'].items() if not v])
