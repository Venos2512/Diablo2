"""R1: joint landmarks of W04 from the scaled mesh (read-only) -> rig/_work/landmarks.json (left side, +X; the mesh is
mirror-symmetric, checked here per landmark).

blender -b --factory-startup rig/_work/m1_intake.blend -P w04_m6_landmarks.py

Method (numbers from w04_m2..m5): every limb segment gets cross-sections perpendicular to its guessed direction at
several points; the section centroids are fitted with a 3D line; a joint is the midpoint of the closest approach of the
lines of the two segments that meet there. Points inside the body (coxa roots, wing root, neck) stay as measured guesses.
"""
import json
import os
import sys

import bpy
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import w04_common as C
import w04_mesh as M

ob = bpy.data.objects[C.AID + '_Src']
me = ob.data
n = len(me.vertices)
co = np.empty(n * 3); me.vertices.foreach_get('co', co); co = co.reshape(n, 3)
inv, U = M.weld(co, 1e-5)
faces = [tuple(int(inv[v]) for v in p.vertices) for p in me.polygons]
E = M.edges_from_faces(faces)
comp = M.components(len(U), E)
sizes = np.bincount(comp)
main = int(np.argmax(sizes))
log = []


def section(p, d, R=0.06, link=0.03, mask=None):
    p = np.asarray(p, float); d = np.asarray(d, float); d = d / np.linalg.norm(d)
    s = (U - p) @ d
    a, b = E[:, 0], E[:, 1]
    m = (s[a] * s[b] < 0)
    if mask is not None:
        m &= mask[a] & mask[b]
    if not m.any():
        return None
    ea, eb = a[m], b[m]
    t = s[ea] / (s[ea] - s[eb])
    P = U[ea] + (U[eb] - U[ea]) * t[:, None]
    P = P[np.linalg.norm(P - p, axis=1) < R]
    if len(P) == 0:
        return None
    D = np.linalg.norm(P[:, None] - P[None], axis=2)
    keep = {int(np.argmin(np.linalg.norm(P - p, axis=1)))}
    while True:
        new = set(np.nonzero((D[sorted(keep)] < link).any(0))[0].tolist()) - keep
        if not new:
            break
        keep |= new
    Q = P[sorted(keep)]
    return Q.mean(0), float(np.linalg.norm(Q - Q.mean(0), axis=1).mean())


def fit_line(a, b, ts=(0.25, 0.4, 0.55, 0.7), R=0.06):
    """section centroids along the guessed segment a->b -> (point, unit dir, mean radius, centroids)."""
    a = np.asarray(a, float); b = np.asarray(b, float); d = (b - a) / np.linalg.norm(b - a)
    cs = []; rs = []
    for t in ts:
        r = section(a + (b - a) * t, d, R=R, mask=(comp == main))
        if r is not None:
            cs.append(r[0]); rs.append(r[1])
    cs = np.array(cs)
    c0 = cs.mean(0)
    if len(cs) >= 2:
        _, _, vt = np.linalg.svd(cs - c0)
        dd = vt[0] if vt[0] @ d > 0 else -vt[0]
    else:
        dd = d
    return c0, dd, float(np.mean(rs)) if rs else 0.0, cs


def closest(p1, d1, p2, d2):
    w = p1 - p2
    a, b, c, d_, e = d1 @ d1, d1 @ d2, d2 @ d2, d1 @ w, d2 @ w
    den = a * c - b * b
    s = (b * e - c * d_) / den if abs(den) > 1e-9 else 0.0
    t = (a * e - b * d_) / den if abs(den) > 1e-9 else 0.0
    q1, q2 = p1 + s * d1, p2 + t * d2
    return (q1 + q2) / 2, float(np.linalg.norm(q1 - q2))


def on_line_z(p, d, zz):
    return p + d * ((zz - p[2]) / d[2])


LM = {}
# ------------------------------------------------------------------ legs (guesses from m3 traces / close-ups)
G = {
    'Leg1': dict(root=(0.070, -0.030, 0.830), troch=(0.105, -0.010, 0.715), knee=(0.250, -0.225, 0.775),
                 ankle=(0.395, -0.290, 0.280), foot=(0.465, -0.330, 0.030), foot_z=0.03, ankle_hz=0.285),
    'Leg3': dict(root=(0.060, 0.095, 0.840), troch=(0.105, 0.125, 0.755), knee=(0.180, 0.155, 0.635),
                 ankle=(0.235, 0.355, 0.265), foot=(0.305, 0.335, 0.075), foot_z=0.075, ankle_hz=0.318),
}
for leg, g in G.items():
    fem = fit_line(g['troch'], g['knee'], ts=(0.3, 0.45, 0.6, 0.75), R=0.05)
    tib = fit_line(g['knee'], g['ankle'], ts=(0.15, 0.3, 0.45, 0.6, 0.75, 0.85), R=0.05)
    tar = fit_line(g['ankle'], g['foot'], ts=(0.2, 0.4, 0.6, 0.8), R=0.05)
    knee, gk = closest(fem[0], fem[1], tib[0], tib[1])
    ankle, ga = closest(tib[0], tib[1], tar[0], tar[1])
    foot = on_line_z(tar[0], tar[1], g['foot_z'])
    # trochanter: on the femur line nearest the guess
    tr = np.asarray(g['troch']); troch = fem[0] + fem[1] * ((tr - fem[0]) @ fem[1])
    LM[leg] = dict(root=list(g['root']), troch=troch.round(4).tolist(), knee=knee.round(4).tolist(),
                   ankle=ankle.round(4).tolist(), foot=foot.round(4).tolist(),
                   r_femur=round(fem[2], 4), r_tibia=round(tib[2], 4), r_tarsus=round(tar[2], 4))
    # horizontal sections at the visible tibia/tarsus kink and just above the claws (the lines are nearly collinear there)
    for key, zz, guess in (('ankle_h', g.get('ankle_hz', g['ankle'][2]), g['ankle']), ('foot_h', g['foot_z'] + 0.015, g['foot'])):
        r = section((guess[0], guess[1], zz), (0, 0, 1), R=0.06, mask=(comp == main))
        LM[leg][key] = r[0].round(4).tolist() if r is not None else None
        log.append(f'   {key} z {zz:.3f}: {LM[leg][key]} r {r[1] if r else None}')
    log.append(f'{leg}: knee gap {gk:.4f} ankle gap {ga:.4f} radii fem {fem[2]:.3f} tib {tib[2]:.3f} tar {tar[2]:.3f}')
    for k in ('troch', 'knee', 'ankle', 'foot'):
        log.append(f'   {k:6s} guess {np.round(g[k], 3).tolist()} -> {LM[leg][k]}')

# ------------------------------------------------------------------ proboscis: section line fit (tip -> face)
tip = U[np.argmin(U[:, 1])]
d_pro = np.array([0.0, 0.7071, 0.7071])
cs = []
for k in range(12):
    r = section(tip + d_pro * (0.03 + 0.03 * k), d_pro, R=0.05, mask=(comp == main))
    if r is not None and r[1] < 0.03:
        cs.append(r[0])
cs = np.array(cs); c0 = cs.mean(0); _, _, vt = np.linalg.svd(cs - c0); dp = vt[0] if vt[0] @ d_pro > 0 else -vt[0]
# root: where the section stops being a thin tube (face) ~ y -0.42
root_y = -0.418
pro_root = c0 + dp * ((root_y - c0[1]) / dp[1])
pro_tip = c0 + dp * ((tip - c0) @ dp)
LM['proboscis'] = dict(root=pro_root.round(4).tolist(), tip=pro_tip.round(4).tolist(), tip_vertex=tip.round(4).tolist(),
                       dir=dp.round(4).tolist())
log.append(f'proboscis root {pro_root.round(3).tolist()} tip {pro_tip.round(3).tolist()} dir {dp.round(3).tolist()} '
           f'angle below horizontal {np.degrees(np.arctan2(-(-dp[2]), abs(dp[1]))):.1f}')

# ------------------------------------------------------------------ head / neck / thorax (measured guesses)
eyes = [c for c in range(len(sizes)) if sizes[c] == 86]
eyeL = U[comp == [c for c in eyes if U[comp == c, 0].mean() > 0][0]]
LM['eye_L'] = dict(c=eyeL.mean(0).round(4).tolist(), r=round(float(np.linalg.norm(eyeL - eyeL.mean(0), axis=1).max()), 4))
LM['neck'] = [0.0, -0.245, 1.000]           # occiput / collar between head and thorax (y-sections: waist at y -0.28..-0.24)
LM['head_front'] = [0.0, -0.430, 0.965]     # face front above the proboscis root
LM['thorax_c'] = [0.0, -0.030, 0.960]       # thorax centre (cog): body spans y -0.20..0.15, z 0.72..1.22
LM['thorax_rear'] = [0.0, 0.120, 0.925]     # abdomen junction under the back plates

# ------------------------------------------------------------------ lobes: PCA of the left lobe vertices
x, y, z = U[:, 0], U[:, 1], U[:, 2]
hind = LM['Leg3']
def dist_line(P, a, b):
    a = np.asarray(a); b = np.asarray(b); ab = b - a
    t = np.clip(((P - a) @ ab) / (ab @ ab), 0, 1)
    return np.linalg.norm(P - (a + t[:, None] * ab), axis=1)
lobe_m = (comp == main) & (x > 0.0) & (y > 0.16) & (z > 0.30) & (z < 0.90) & (x < 0.24)
lobe_m &= dist_line(U, hind['troch'], hind['knee']) > 0.05
lobe_m &= dist_line(U, hind['knee'], hind['ankle']) > 0.05
Lp = U[lobe_m]
lc = Lp.mean(0); _, sv, vt = np.linalg.svd(Lp - lc)
ax = vt[0] if vt[0][1] > 0 else -vt[0]
proj = (Lp - lc) @ ax
base = lc + ax * proj.min(); tipL = lc + ax * proj.max()
LM['lobe_L'] = dict(centre=lc.round(4).tolist(), axis=ax.round(4).tolist(), base=base.round(4).tolist(), tip=tipL.round(4).tolist(),
                    length=round(float(proj.max() - proj.min()), 4), sv=sv.round(3).tolist(), n=int(lobe_m.sum()))
log.append(f"lobe_L centre {lc.round(3).tolist()} axis {ax.round(3).tolist()} base {base.round(3).tolist()} tip {tipL.round(3).tolist()} len {proj.max() - proj.min():.3f}")

# ------------------------------------------------------------------ wings (left): root + blade tips (m5)
wing_m = (comp == main) & (x > 0.16) & (z > 1.08)
lowL = [c for c in range(len(sizes)) if sizes[c] == 61 and U[comp == c, 0].mean() > 0][0]
Lb = U[comp == lowL]
lbc = Lb.mean(0); _, _, vt = np.linalg.svd(Lb - lbc); la = vt[0] if vt[0][1] > 0 else -vt[0]
lpr = (Lb - lbc) @ la
LM['wing_L'] = dict(root=[0.150, 0.000, 1.110],
                    tipF=U[wing_m][np.argmax(U[wing_m][:, 2])].round(4).tolist(),
                    tipF2=[0.548, 0.680, 1.449],
                    lower_root=(lbc + la * lpr.min()).round(4).tolist(), lower_tip=(lbc + la * lpr.max()).round(4).tolist(),
                    bottom_tip=[0.430, 0.482, 1.320])
Wp = U[wing_m | (comp == lowL)]
wc = Wp.mean(0); _, _, vt = np.linalg.svd(Wp - wc)
nrm = vt[2] if vt[2][0] > 0 else -vt[2]
LM['wing_L']['normal'] = nrm.round(4).tolist()
LM['wing_L']['centroid'] = wc.round(4).tolist()
log.append(f"wing_L {LM['wing_L']}")

# ------------------------------------------------------------------ symmetry check: mirror of the left landmarks vs the mesh
mirror_err = []
for leg in ('Leg1', 'Leg3'):
    for k in ('knee', 'ankle', 'foot'):
        p = np.array(LM[leg][k]); q = p * np.array([-1, 1, 1])
        dl = np.min(np.linalg.norm(U - p, axis=1)); dr = np.min(np.linalg.norm(U - q, axis=1))
        mirror_err.append(abs(dl - dr))
LM['mirror_check_max_m'] = round(float(max(mirror_err)), 5)
LM['notes'] = log
with open(os.path.join(C.WORK, 'landmarks.json'), 'w') as f:
    json.dump(LM, f, indent=1)
print('\n'.join(log))
print('MIRROR max |dL-dR|', LM['mirror_check_max_m'])
print('M6_DONE')
