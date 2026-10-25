"""H2_FL_hand rig: contact-limited curl for the grip poses (rigkit-env: igl + numpy FK/LBS of h_fk, parity-checked with Blender).

This stylized hand has long fingers (MCP->tip 112-127 mm) against a ~45 mm thick palm, so textbook fist angles (MCP 85 / PIP 100 / DIP 65)
bury the tips 7-15 mm in the palm. For a pose spec, every finger's ADDED curl is scaled by k (the MCP keeps `mcp_keep` of its share) and k is
bisected to the largest value whose deepest intrusion of that finger (into the palm, the other fingers, the thumb) is <= `limit_mm`.
Fingers are solved pinky -> index (each one against the already solved ones), then the thumb. Intrusion depth = distance of a lobe vertex
behind the nearest face of the other parts (that face's normal), only where the lobe newly intersects them (h10's rule).

Usage: python -I -B h14_pose_tune.py <rig_dir> <weights_tag> <pose> [limit_mm=1.0] [mcp_keep=1.0]
Prints the tuned per-finger angles (curl lists) and writes rig/_work/tuned_<pose>.json.
"""
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import h_common as hc  # noqa: E402
import h_fk  # noqa: E402
from solvers import metrics as sm  # noqa: E402

rig, tag, pose = sys.argv[1], sys.argv[2], sys.argv[3]
LIM = float(sys.argv[4]) / 1000 if len(sys.argv) > 4 else 0.001
MKEEP = float(sys.argv[5]) if len(sys.argv) > 5 else 1.0
d, topo = hc.load_mesh(rig)
fk = h_fk.FK(rig)
z = np.load(os.path.join(rig, '_work', 'poses_A.npz'), allow_pickle=True)
bn, rest = [str(b) for b in z['bones']], z['rest']
wz = np.load(os.path.join(rig, '_work', f'weights_{tag}.npz'), allow_pickle=True)
WB = [str(b) for b in wz['bones']]
lobe = wz['lobe']
FING = ['thumb', 'index', 'middle', 'ring', 'pinky']
main = int(np.bincount(topo.island).argmax())
in_main = topo.island == main
Fw = topo.F
FL = {f: Fw[(lobe[Fw] == fi).all(1)] for fi, f in enumerate(FING)}
FO = {f: Fw[in_main[Fw].all(1) & ~(lobe[Fw] == fi).any(1)] for fi, f in enumerate(FING)}
P0 = topo.P


def keys(Fa, Fb, ia, ib):
    return set(zip(map(tuple, np.sort(Fa[ia], 1)), map(tuple, np.sort(Fb[ib], 1))))


REST = {f: keys(FL[f], FO[f], *sm.intersecting_pairs(P0, FL[f], FO[f])) for f in FING}


def positions(spec):
    M = fk.mats(spec, bn)
    return topo.gather(h_fk.lbs(d['V'], wz['W'], WB, M, rest, bn), how='first')


def depth(f, Pw):
    fi = FING.index(f)
    ia, ib = sm.intersecting_pairs(Pw, FL[f], FO[f])
    new = [k for k in keys(FL[f], FO[f], ia, ib) if k not in REST[f]]
    if not new:
        return (0.0, 0.0) if SPLIT else 0.0
    verts = np.unique(np.array([a for a, b in new]).ravel())
    lv = np.flatnonzero(lobe == fi)
    cand = lv[np.min(np.linalg.norm(Pw[lv][:, None] - Pw[verts][None], axis=2), 1) < 0.008]
    dist, fidx = sm.surface_distance(Pw, FO[f], Pw[cand])
    fo = FO[f][fidx]
    nrm = np.cross(Pw[fo[:, 1]] - Pw[fo[:, 0]], Pw[fo[:, 2]] - Pw[fo[:, 0]])
    nrm /= np.maximum(np.linalg.norm(nrm, axis=1, keepdims=True), 1e-20)
    sd = np.einsum('ij,ij->i', Pw[cand] - Pw[fo[:, 0]], nrm)
    dep = np.where(sd < 0, dist, 0.0)
    # owner of the face behind which a vertex sits: another finger's lobe (side contact) or the palm / thumb base
    own = lobe[fo].max(1)
    dn = float(dep[own >= 0].max()) if (own >= 0).any() else 0.0
    dp = float(dep[own < 0].max()) if (own < 0).any() else 0.0
    return (dp, dn) if SPLIT else float(dep.max())


SPLIT = False


def depth2(f, Pw):
    global SPLIT
    SPLIT = True
    try:
        return depth(f, Pw)
    finally:
        SPLIT = False


base = json.loads(json.dumps(fk.R['rom']['poses'][pose]))
# express the pose as explicit curls (fist slider -> its fist_deg)
curl = {f: [0.0, 0.0, 0.0] for f in FING}
if 'fist' in base:
    for n, deg in fk.R['skeleton']['fist_deg'].items():
        curl[n[:-3]][int(n[-1]) - 1] += base['fist'] * deg[0]
for f, c in base.get('curl', {}).items():
    curl[f] = [curl[f][k] + c[k] for k in range(3)]
spec = {k: v for k, v in base.items() if k not in ('fist', 'curl')}
target = {f: list(c) for f, c in curl.items()}
K = {}


def build(kmap):
    s = dict(spec)
    s['curl'] = {}
    for f in FING:
        k = kmap.get(f, 0.0 if f not in solved else K[f])
        c = target[f]
        s['curl'][f] = [c[0] * (MKEEP + (1 - MKEEP) * k) if f != 'thumb' else c[0] * k, c[1] * k, c[2] * k]
    return s


solved = []
order = ['pinky', 'ring', 'middle', 'index', 'thumb']
report = {}
for f in order:
    if max(abs(x) for x in target[f]) < 1e-6:
        K[f] = 1.0
        solved.append(f)
        continue
    lo, hi = 0.0, 1.0
    kmap = {g: K[g] for g in solved}
    kmap[f] = 0.0
    nb0 = depth2(f, positions(build(kmap)))[1]  # side contact with the neighbours that the MCP flexion alone already makes
    NBLIM = nb0 + 0.0005

    def ok(Pw):
        dp, dn = depth2(f, Pw)
        return dp <= LIM and dn <= max(NBLIM, LIM)
    kmap[f] = 1.0
    dfull = depth(f, positions(build(kmap)))
    if ok(positions(build(kmap))):
        K[f] = 1.0
    else:
        for _ in range(9):
            mid = (lo + hi) / 2
            kmap[f] = mid
            if ok(positions(build(kmap))):
                lo = mid
            else:
                hi = mid
        K[f] = lo
    solved.append(f)
    kmap[f] = K[f]
    dpp, dnn = depth2(f, positions(build(kmap)))
    report[f] = dict(k=round(K[f], 3), depth_full_mm=round(dfull * 1000, 2), palm_mm=round(dpp * 1000, 2), side_contact_mm=round(dnn * 1000, 2),
                     side_contact_at_k0_mm=round(nb0 * 1000, 2))
    print(f, report[f], flush=True)
final = build({g: K[g] for g in FING})
# final check: every finger against everything (later fingers may push into earlier ones)
Pw = positions(final)
check = {f: [round(x * 1000, 2) for x in depth2(f, Pw)] for f in FING}  # [palm, side contact]
out = dict(pose=pose, weights=tag, limit_mm=LIM * 1000, mcp_keep=MKEEP, k=report, final_depth_mm=check,
           curl={f: [round(x, 1) for x in final['curl'][f]] for f in FING}, spec={k: v for k, v in final.items()})
hc.save_json(os.path.join(rig, '_work', f'tuned_{pose}.json'), out)
print('H14 ' + json.dumps(dict(pose=pose, curl=out['curl'], final_depth_mm=check)))
