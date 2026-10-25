"""H2_FL_hand rig, S3 consensus landmarks (python -I -B, numpy/scipy).

Sources (references/joint-placement.md; the hand family is new, so the rules are written here):
  a  geometry of this mesh (rig/_work/fingers_a.json from h04_fingers.py and the skin sections):
       finger DIP / PIP  = breakpoints of a 3-segment piecewise-linear fit of the medial curve between tip + 8 mm (the pad and nail
                           make the first 8 mm unreliable) and the web: the rest pose is curled, so the phalanges are straight pieces;
       finger MCP        = the dorsal knuckle peak along the proximal phalanx line extended into the palm;
       thumb IP          = direction change of the thumb medial curve (window 30-48 mm from the tip);
       thumb MCP         = onset of the ring growth where the thumb merges into the palm;
       wrist             = distal end of the narrow plateau of the skin sections before the hand flares (s 0.24-0.27);
  d  UniRig (rig/_work/unirig_joints.json, h04u_unirig.py): 5 chains of 3 joints (CMC/MCP, PIP, DIP), projected onto the medial curves;
  c  anatomical priors (gate only, never move a position): segment ratios after Buchholz, Armstrong & Goldstein 1992 (values from
     memory, UNVERIFIED, wide gate): proximal / middle phalanx 0.8-2.4 (this stylized hand has long middle phalanges, P2 ~ 36-38 mm), middle / distal (DIP->tip) 0.6-2.0; thumb MCP-IP / IP-tip 0.5-1.6;
  e  the lab: WRIST fraction 0.60 of 0.45 m (prepare-choice-hands.py HANDS, read off final_views.png).
Fusion: tau = clamp(max(1.5 % H, 0.5 r_local), 0.6 % H, 3 % H) with H = 0.45 m; agreeing plausible sources -> weighted mean (a 1.0, d 0.7,
e 0.7); otherwise the decision in DECISIONS below (vision, recorded with reasons) is applied.

Depth rule: finger joints sit at the ring centroid moved 5 % of the ring thickness toward the dorsum (the condyle centre is slightly dorsal
of the mid-line); MCP at 45 % of the hand thickness below the dorsal knuckle surface; the wrist at the skin-section centroid.

Writes rig/landmarks.json and rig/qa/s3_landmarks_plot.png. Usage: python -I -B h05_landmarks.py <rig_dir>
"""
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import h_common as hc  # noqa: E402

rig = sys.argv[1]
H = 0.45
fa = json.load(open(os.path.join(rig, '_work', 'fingers_a.json')))
un = json.load(open(os.path.join(rig, '_work', 'unirig_joints.json')))
UJ = {j['name']: np.array(j['head']) for j in un['joints']}
UMAP = {'thumb': ['bone_2', 'bone_3', 'bone_4'], 'index': ['bone_5', 'bone_6', 'bone_7'], 'middle': ['bone_8', 'bone_9', 'bone_10'],
        'ring': ['bone_11', 'bone_12', 'bone_13'], 'pinky': ['bone_14', 'bone_15', 'bone_16']}
d, topo = hc.load_mesh(rig)
P, F = topo.P, topo.F
main = np.bincount(topo.island).argmax()
mv = topo.island == main
fmask = mv[F].all(1)
W = dict(a=1.0, d=0.7, e=0.7)
# vision decisions where the sources disagree (filled after looking at the flag crops; see landmarks.json 'decision')
DECISIONS = json.load(open(os.path.join(rig, '_work', 'vision_decisions.json'))) if os.path.exists(os.path.join(rig, '_work', 'vision_decisions.json')) else {}


def tau(r_local):
    return float(np.clip(max(0.015 * H, 0.5 * r_local), 0.006 * H, 0.03 * H))


def curve(f):
    rr = [r for r in fa[f]['rings'] if not r.get('merged')]
    return rr, np.array([r['arc'] for r in rr]), np.array([r['centroid'] for r in rr])


def at_arc(rr, A, a):
    """interpolated ring quantities at arc a (clamped)."""
    i = int(np.clip(np.searchsorted(A, a), 1, len(A) - 1))
    t = float(np.clip((a - A[i - 1]) / max(A[i] - A[i - 1], 1e-9), 0, 1))
    lerp = lambda k: (1 - t) * np.array(rr[i - 1][k]) + t * np.array(rr[i][k])  # noqa: E731
    return dict(c=lerp('centroid'), dorsal=lerp('dorsal'), palmar=lerp('palmar'), thick=float(lerp('thick')), width=float(lerp('width')),
                dir=hc.unit(lerp('dir')), perimeter=float(lerp('perimeter')))


def seg_fit(A, C, lo, hi):
    """3-segment piecewise-linear fit of C over arc [lo, hi]: returns (b1, b2) minimising the residual of a line per piece."""
    m = (A >= lo) & (A <= hi)
    a, c = A[m], C[m]

    def resid(i0, i1):
        q = c[i0:i1]
        if len(q) < 3:
            return 0.0
        mu = q.mean(0)
        _, sv, vt = np.linalg.svd(q - mu)
        return float((sv[1:] ** 2).sum())
    best = None
    n = len(a)
    for i in range(3, n - 6):
        for j in range(i + 3, n - 3):
            e = resid(0, i + 1) + resid(i, j + 1) + resid(j, n)
            if best is None or e < best[0]:
                best = (e, i, j)
    return float(a[best[1]]), float(a[best[2]])


def project_arc(A, C, p):
    """arc of the nearest point of the polyline to p (+ distance); beyond the end: extrapolated along the last direction."""
    best = (1e9, 0.0)
    for i in range(len(C) - 1):
        u = C[i + 1] - C[i]
        t = float(np.clip((p - C[i]) @ u / max(u @ u, 1e-12), 0, 1))
        dd = np.linalg.norm(C[i] + t * u - p)
        if dd < best[0]:
            best = (dd, A[i] + t * (A[i + 1] - A[i]))
    return best[1], best[0]


def fuse(name, cands, r_local, prior_ok=None):
    """cands: {src: arc}. Returns (arc, record)."""
    t = tau(r_local)
    plaus = {k: v for k, v in cands.items() if v is not None and (prior_ok is None or prior_ok(v))}
    gates = {k: ('prior' if (v is not None and prior_ok is not None and not prior_ok(v)) else 'ok') for k, v in cands.items()}
    vals = list(plaus.values())
    spread = (max(vals) - min(vals)) if vals else None
    if name in DECISIONS:
        dec = DECISIONS[name]
        ch = dec['choice']
        val = float(np.average(vals, weights=[W[k] for k in plaus])) if ch == 'mean' else float(plaus[ch])
        return val, dict(sources={k: v for k, v in cands.items()}, gates=gates, spread=spread, tau=t, decision=f'vision:{ch}',
                         reason=dec['reason'], confidence=dec.get('confidence', 0.6))
    if len(plaus) >= 2 and spread <= t:
        val = float(np.average(vals, weights=[W[k] for k in plaus]))
        return val, dict(sources=cands, gates=gates, spread=spread, tau=t, decision='mean', confidence=0.85)
    if len(plaus) == 1:
        k = next(iter(plaus))
        return float(plaus[k]), dict(sources=cands, gates=gates, spread=None, tau=t, decision=f'single:{k}', confidence=0.6)
    # disagree: provisional = source a, flagged
    return float(plaus.get('a', vals[0])), dict(sources=cands, gates=gates, spread=spread, tau=t, decision='FLAG', confidence=0.3)


TRI = P[F[fmask]]


def vertical_hits(p):
    """(highest, lowest) z where the vertical line through p (x, y) crosses the main-island surface; None if it misses."""
    a, b, c = TRI[:, 0, :2], TRI[:, 1, :2], TRI[:, 2, :2]
    q = np.asarray(p[:2])
    d0 = (b[:, 0] - a[:, 0]) * (c[:, 1] - a[:, 1]) - (c[:, 0] - a[:, 0]) * (b[:, 1] - a[:, 1])
    ok = np.abs(d0) > 1e-14
    l1 = ((b[:, 0] - q[0]) * (c[:, 1] - q[1]) - (c[:, 0] - q[0]) * (b[:, 1] - q[1])) / np.where(ok, d0, 1)
    l2 = ((c[:, 0] - q[0]) * (a[:, 1] - q[1]) - (a[:, 0] - q[0]) * (c[:, 1] - q[1])) / np.where(ok, d0, 1)
    l3 = 1 - l1 - l2
    hit = ok & (l1 >= 0) & (l2 >= 0) & (l3 >= 0)
    if not hit.any():
        return None
    z = l1[hit] * TRI[hit, 0, 2] + l2[hit] * TRI[hit, 1, 2] + l3[hit] * TRI[hit, 2, 2]
    return float(z.max()), float(z.min())


LM = {}
REC = {}
plots = {}
for f in ['index', 'middle', 'ring', 'pinky']:
    rr, A, C = curve(f)
    web = A[-1]
    b1, b2 = seg_fit(A, C, 0.008, web)
    ua = [project_arc(A, C, UJ[n]) for n in UMAP[f]]  # (arc, dist) for MCP, PIP, DIP
    r_loc = at_arc(rr, A, b2)['width'] / 2
    # gates (c): middle/distal and proximal/middle checked after MCP
    dip, rd = fuse(f'{f}_dip', dict(a=b1, d=ua[2][0]), at_arc(rr, A, b1)['width'] / 2, prior_ok=lambda v: 0.018 < v < 0.06)
    pip, rp = fuse(f'{f}_pip', dict(a=b2, d=ua[1][0]), r_loc, prior_ok=lambda v, dip=dip: 0.6 < (v - dip) / max(dip, 1e-9) < 2.0)
    # MCP (a): knuckle peak along the proximal-phalanx line extended into the palm
    # the metacarpal lies in the palm plane, the proximal phalanx is flexed out of it: walk HORIZONTALLY (z dropped) along the direction
    # of the last 12 mm of the curve, from the curve end into the palm; at each station the dorsal / palmar surface = highest / lowest
    # hit of a vertical line with the main-island triangles (mean of 3 lines across: -3, 0, +3 mm)
    m = A >= A[-1] - 0.012
    ax_ = C[-1] - C[m][0]
    ax_[2] = 0.0
    ax_ = hc.unit(ax_)
    side = hc.unit(np.cross(ax_, hc.UP))
    prof = []
    for k in np.arange(0.0, 0.0405, 0.001):
        zs = [vertical_hits(C[-1] + k * ax_ + o * side) for o in (-0.003, 0.0, 0.003)]
        zs = [z for z in zs if z is not None]
        prof.append((k, np.mean([z[0] for z in zs]) if zs else np.nan, np.mean([z[1] for z in zs]) if zs else np.nan))
    prof = np.array(prof)
    for c_ in (1, 2):  # fill gaps
        bad = ~np.isfinite(prof[:, c_])
        if bad.any() and (~bad).sum() >= 2:
            prof[bad, c_] = np.interp(prof[bad, 0], prof[~bad, 0], prof[~bad, c_])
    # knuckle = highest dorsal point 5..40 mm beyond the curve end, refined as the centre of the top 0.4 mm plateau
    ok = (prof[:, 0] >= 0.005) & np.isfinite(prof[:, 1])
    kz = prof[ok]
    top = kz[:, 1].max()
    plat = kz[kz[:, 1] >= top - 0.0004]
    k_knuckle = float(plat[:, 0].mean())
    arc_kn = web + k_knuckle
    mcp_u = ua[0]
    mcp_d_arc = web + float((UJ[UMAP[f][0]] - C[-1]) @ ax_)
    mcp, rm = fuse(f'{f}_mcp', dict(a=arc_kn, d=mcp_d_arc), 0.012,
                   prior_ok=lambda v, pip=pip, dip=dip: 0.8 < (v - pip) / max(pip - dip, 1e-9) < 2.4)
    # positions
    def joint_pos(a_):
        g = at_arc(rr, A, a_)
        up = hc.unit(g['dorsal'] - g['palmar'])
        return g['c'] + 0.05 * g['thick'] * up
    pk = C[-1] + (mcp - web) * ax_
    kk = int(np.nanargmin(np.abs(prof[:, 0] - (mcp - web))))
    zd, zp = prof[kk, 1], prof[kk, 2]
    pk = np.array([pk[0], pk[1], zd - 0.45 * (zd - zp)])
    LM[f'{f}_mcp'] = pk
    LM[f'{f}_pip'] = joint_pos(pip)
    LM[f'{f}_dip'] = joint_pos(dip)
    LM[f'{f}_tip'] = np.array(fa[f]['tip'])
    REC[f'{f}_dip'], REC[f'{f}_pip'], REC[f'{f}_mcp'] = rd, rp, rm
    REC[f'{f}_tip'] = dict(sources=dict(a='extreme vertex of the lobe'), decision='a', confidence=0.95)
    for k_, v_ in ((f'{f}_dip', dip), (f'{f}_pip', pip), (f'{f}_mcp', mcp)):
        REC[k_]['arc_from_tip_mm'] = round(v_ * 1000, 1)
    REC[f'{f}_mcp']['knuckle_profile'] = dict(web_arc_mm=round(web * 1000, 1), knuckle_beyond_web_mm=round(k_knuckle * 1000, 1),
                                              dorsal_z=round(float(zd), 4), palmar_z=round(float(zp), 4))
    plots[f] = (prof, web)
    print(f, 'DIP a %.1f d %.1f -> %.1f %s | PIP a %.1f d %.1f -> %.1f %s | MCP a %.1f d %.1f -> %.1f %s' % (
        b1 * 1e3, ua[2][0] * 1e3, dip * 1e3, rd['decision'], b2 * 1e3, ua[1][0] * 1e3, pip * 1e3, rp['decision'],
        arc_kn * 1e3, mcp_d_arc * 1e3, mcp * 1e3, rm['decision']))

# thumb
rr, A, C = curve('thumb')
dirs = np.array([r['dir'] for r in rr])
w = (A >= 0.028) & (A <= 0.050)
# IP (a): the station of largest direction change between the distal piece (12-28 mm) and the proximal piece (52-66 mm)
dist_dir = hc.unit(dirs[(A >= 0.012) & (A <= 0.028)].mean(0))
prox_dir = hc.unit(dirs[(A >= 0.052) & (A <= 0.066)].mean(0))
cosd = dirs[w] @ dist_dir
cosp = dirs[w] @ prox_dir
ip_a = float(A[w][np.argmin(np.abs(cosd - cosp))])
per = np.array([r['perimeter'] for r in rr])
gro = np.gradient(per, A)
mcp_a = float(A[(A > 0.05)][np.argmax(gro[A > 0.05] > 1.2)]) if (gro[A > 0.05] > 1.2).any() else float(A[-1])
ua = [project_arc(A, C, UJ[n]) for n in UMAP['thumb']]
ip, rip = fuse('thumb_ip', dict(a=ip_a, d=ua[2][0]), at_arc(rr, A, ip_a)['width'] / 2, prior_ok=lambda v: 0.02 < v < 0.06)
mcp, rmc = fuse('thumb_mcp', dict(a=mcp_a, d=ua[1][0]), at_arc(rr, A, mcp_a)['width'] / 2, prior_ok=lambda v, ip=ip: 0.5 < (v - ip) / ip < 1.6)


def tpos(a_):
    g = at_arc(rr, A, a_)
    return g['c']


LM['thumb_tip'] = np.array(fa['thumb']['tip'])
LM['thumb_ip'] = tpos(ip)
# the MCP may sit beyond the merged end of the curve: extrapolate along the last direction
LM['thumb_mcp'] = tpos(min(mcp, A[-1])) + max(0.0, mcp - A[-1]) * hc.unit(C[-1] - C[-4])
REC['thumb_tip'] = dict(sources=dict(a='max-x vertex'), decision='a', confidence=0.95)
REC['thumb_ip'], REC['thumb_mcp'] = rip, rmc
REC['thumb_ip']['arc_from_tip_mm'] = round(ip * 1e3, 1)
REC['thumb_mcp']['arc_from_tip_mm'] = round(mcp * 1e3, 1)

# wrist: skin sections of the main island
secs = []
for s0 in np.arange(0.20, 0.30, 0.002):
    pcs = hc.plane_slice(P, F, np.array([0, -s0, 0]), np.array([0, -1.0, 0]), fmask)
    big = max(pcs, key=lambda r: r['perimeter'])
    secs.append((s0, big['perimeter'], big['centroid']))
pr = np.array([x[1] for x in secs])
ss = np.array([x[0] for x in secs])
pmin = pr.min()
plateau_end = float(ss[np.flatnonzero((pr <= 1.03 * pmin))[-1]])
wr, rw = fuse('wrist', dict(a=plateau_end, e=0.60 * 0.45), 0.025)
cw = secs[int(np.argmin(np.abs(ss - wr)))][2]
LM['wrist'] = np.array([cw[0], -wr, cw[2]])
REC['wrist'] = rw
REC['wrist']['s_m'] = round(wr, 4)
REC['wrist']['plateau'] = dict(min_perimeter_mm=round(pmin * 1e3, 1), s_min=round(float(ss[np.argmin(pr)]), 3))

# thumb CMC (a): base of the thenar: radial skin edge at s = wrist + 12 mm, 12 mm inside it, at the section's mid-depth;
# (d) UniRig bone_2
s_c = wr + 0.012
pcs = hc.plane_slice(P, F, np.array([0, -s_c, 0]), np.array([0, -1.0, 0]), fmask)
big = max(pcs, key=lambda r: r['perimeter'])
q = big['seg'].reshape(-1, 3)
xr = q[:, 0].max()
near = q[q[:, 0] > xr - 0.02]
cmc_a = np.array([xr - 0.012, -s_c, 0.5 * (near[:, 2].max() + near[:, 2].min())])
cmc_d = UJ['bone_2']
dcm = float(np.linalg.norm(cmc_a - cmc_d))
tc = tau(0.012)
if 'thumb_cmc' in DECISIONS:
    ch = DECISIONS['thumb_cmc']['choice']
    LM['thumb_cmc'] = cmc_a if ch == 'a' else (cmc_d if ch == 'd' else (cmc_a * W['a'] + cmc_d * W['d']) / (W['a'] + W['d']))
    REC['thumb_cmc'] = dict(sources=dict(a=cmc_a.tolist(), d=cmc_d.tolist()), spread=dcm, tau=tc, decision=f'vision:{ch}', reason=DECISIONS['thumb_cmc']['reason'])
elif dcm <= tc:
    LM['thumb_cmc'] = (cmc_a * W['a'] + cmc_d * W['d']) / (W['a'] + W['d'])
    REC['thumb_cmc'] = dict(sources=dict(a=cmc_a.tolist(), d=cmc_d.tolist()), spread=dcm, tau=tc, decision='mean', confidence=0.7)
else:
    LM['thumb_cmc'] = cmc_a
    REC['thumb_cmc'] = dict(sources=dict(a=cmc_a.tolist(), d=cmc_d.tolist()), spread=dcm, tau=tc, decision='FLAG', confidence=0.3)
print('thumb IP a %.1f d %.1f -> %s | MCP a %.1f d %.1f -> %s | CMC spread %.1f mm %s | wrist a %.3f e %.3f -> %s' % (
    ip_a * 1e3, ua[2][0] * 1e3, rip['decision'], mcp_a * 1e3, ua[1][0] * 1e3, rmc['decision'], dcm * 1e3, REC['thumb_cmc']['decision'],
    plateau_end, 0.27, rw['decision']))

# forearm axis: centroids of the skin sections between the cuff end and the band (s 0.10-0.18) -> line; sleeve end at s = 0
secs2 = []
for s0 in np.arange(0.10, 0.185, 0.005):
    pcs = hc.plane_slice(P, F, np.array([0, -s0, 0]), np.array([0, -1.0, 0]), fmask)
    secs2.append(max(pcs, key=lambda r: r['perimeter'])['centroid'])
secs2 = np.array(secs2)
LM['sleeve_end'] = np.array([0.0, 0.0, 0.0])
REC['sleeve_end'] = dict(sources=dict(e='lab frame origin = sleeve-end axis point'), decision='e', confidence=1.0)
LM['forearm_mid'] = secs2.mean(0)
pcs = hc.plane_slice(P, F, np.array([0, -0.095, 0]), np.array([0, -1.0, 0]), fmask)
LM['forearm_start'] = max(pcs, key=lambda r: r['perimeter'])['centroid']
REC['forearm_start'] = dict(sources=dict(a='skin-section centroid at s = 0.095 (the cuff end): the forearm bone runs from here to the wrist centre, so a forearm roll turns the visible forearm about its own centre line'), decision='a', confidence=0.8)
REC['forearm_mid'] = dict(sources=dict(a='mean of the skin-section centroids s 0.10-0.185'), decision='a', confidence=0.8)

out = dict(schema='hand-1', frame='Blender Z-up: fingers -Y, back of hand +Z, thumb +X, origin = sleeve-end axis point; glTF export +Y up = lab hand frame',
           H=H, tau_rule='clamp(max(1.5% H, 0.5 r_local), 0.6% H, 3% H)', weights=W,
           landmarks={k: dict(pos=[round(float(x), 6) for x in v], **{kk: vv for kk, vv in REC.get(k, {}).items()}) for k, v in LM.items()},
           unirig=dict(glb=un['glb'], mesh_match_mm=un['mesh_match_mm'], map=UMAP, note='bone_0 sleeve, bone_1 mid forearm (not used: UniRig root)'))


def conv(o):
    if isinstance(o, dict):
        return {k: conv(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [conv(v) for v in o]
    if isinstance(o, np.ndarray):
        return conv(o.tolist())
    if isinstance(o, (np.floating,)):
        return float(o)
    if isinstance(o, float):
        return round(o, 6)
    return o


hc.save_json(os.path.join(rig, 'landmarks.json'), conv(out))
flags = [k for k, v in REC.items() if v.get('decision') == 'FLAG']
print('FLAGS', flags)

import matplotlib  # noqa: E402
matplotlib.use('Agg')
import matplotlib.pyplot as plt  # noqa: E402
fig, ax = plt.subplots(2, 1, figsize=(13, 12))
q = mv & (-P[:, 1] > 0.2)
ax[0].scatter(-P[q, 1], P[q, 0], s=1, c='#bbb')
ax[1].scatter(-P[q, 1], P[q, 2], s=1, c='#bbb')
for k, v in LM.items():
    col = 'r' if REC.get(k, {}).get('decision') == 'FLAG' else 'b'
    ax[0].plot(-v[1], v[0], 'o', c=col, ms=4)
    ax[1].plot(-v[1], v[2], 'o', c=col, ms=4)
    ax[0].annotate(k, (-v[1], v[0]), fontsize=6)
for j in UJ.values():
    ax[0].plot(-j[1], j[0], 'x', c='g', ms=5)
    ax[1].plot(-j[1], j[2], 'x', c='g', ms=5)
for a_ in ax:
    a_.set_aspect('equal')
    a_.grid(alpha=0.3)
ax[0].set_title('landmarks (blue fused, red flagged), UniRig joints green x; top: s ->, x ^')
ax[1].set_title('side: s ->, z ^ (back of hand)')
plt.tight_layout()
plt.savefig(os.path.join(rig, 'qa', 's3_landmarks_plot.png'), dpi=70)
