"""H2_FL_hand rig, S3 source a (geometry + texture) for the fingers: medial curves marched from each fingertip, with per-ring profiles.

For each finger: start at the tip (extreme vertex of its lobe), march toward the palm with planes perpendicular to the current direction
(step 1.5 mm), keep the slice piece nearest the prediction, re-centre on its centroid. Stops where the ring merges into the palm (perimeter
jump), which is the web of that finger. Per ring: arc length from the tip, centroid, perimeter, the dorsal and palmar surface points
(along the local 'up' = back of the hand, for the thumb its own dorsal = the nail side), the bend angle of the medial curve (window 5 mm)
and the texture luminance under the palmar / dorsal point (flexion creases are darker lines in the Tripo albedo).

Writes rig/_work/fingers_a.json + rig/qa/s3_finger_profiles.png + rig/qa/s3_medial_curves.png.
Usage: python -I -B h04_fingers.py <rig_dir>
"""
import os
import sys

import numpy as np
from PIL import Image
from scipy.spatial import cKDTree

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import h_common as hc  # noqa: E402

rig = sys.argv[1]
d, topo = hc.load_mesh(rig)
P, F = topo.P, topo.F
s = -P[:, 1]
main = np.bincount(topo.island).argmax()
mask_v = topo.island == main
face_mask = mask_v[F].all(1)

# texture lookup on the ORIGINAL faces (UV seams)
V0, F0, UV0 = d['V'], d['F'], d['UV']
tex = np.asarray(Image.open(os.path.join(rig, '_work', 'basecolor_512.png')).convert('RGB'), dtype=np.float32) / 255.0
lum_img = tex @ np.array([0.2126, 0.7152, 0.0722])
cent0 = V0[F0].mean(1)
kd0 = cKDTree(cent0)


def lum_at(p):
    _, idx = kd0.query(p, k=6)
    best, bd = None, 1e9
    for f in np.atleast_1d(idx):
        a, b, c = V0[F0[f]]
        n = np.cross(b - a, c - a)
        nn = np.linalg.norm(n)
        if nn < 1e-14:
            continue
        n /= nn
        q = p - ((p - a) @ n) * n
        m = np.array([b - a, c - a]).T
        uv, *_ = np.linalg.lstsq(m, q - a, rcond=None)
        w = np.array([1 - uv.sum(), uv[0], uv[1]])
        dist = abs((p - a) @ n) + max(0, -w.min()) * 0.01
        if dist < bd:
            bd, best = dist, (f, np.clip(w, 0, 1) / max(np.clip(w, 0, 1).sum(), 1e-9))
    f, w = best
    uv = (UV0[F0[f]] * w[:, None]).sum(0)
    h, wd = lum_img.shape
    return float(lum_img[int(np.clip((1 - uv[1]) * (h - 1), 0, h - 1)), int(np.clip(uv[0] * (wd - 1), 0, wd - 1))])


# lobes of the four long fingers: main-island vertices beyond s = 0.388 (slices show 4 separate loops from 0.382 on)
far = mask_v & (s > 0.388)
e = topo.edges
ek = far[e[:, 0]] & far[e[:, 1]]
import scipy.sparse as sp  # noqa: E402
from scipy.sparse.csgraph import connected_components  # noqa: E402
A = sp.coo_matrix((np.ones(ek.sum()), (e[ek, 0], e[ek, 1])), shape=(topo.n_w, topo.n_w))
nc, lab = connected_components(A, directed=False)
lobes = [np.flatnonzero((lab == k) & far) for k in range(nc)]
lobes = [l for l in lobes if len(l) > 40]
lobes.sort(key=lambda l: -P[l, 0].mean())  # +x first: index (next to the thumb) ... pinky
assert len(lobes) == 4, [len(l) for l in lobes]
tips = {}
for name, l in zip(['index', 'middle', 'ring', 'pinky'], lobes):
    base = P[l][s[l] < 0.395].mean(0)
    far_v = l[np.argmax(np.linalg.norm(P[l] - base, axis=1))]
    tips[name] = dict(tip=int(far_v), base=base)
# thumb: the vertex of largest x
tv = int(np.flatnonzero(mask_v)[np.argmax(P[mask_v, 0])])
tips['thumb'] = dict(tip=tv, base=np.array([0.07, -0.30, -0.03]))


def march(name):
    t = tips[name]
    c = P[t['tip']].copy()
    dvec = hc.unit(t['base'] - c)
    rings = []
    arc = 0.0
    step = 0.0015
    # first plane 1.5 mm inside the tip
    perims = []
    for it in range(200):
        cp = c + step * dvec
        pieces = hc.plane_slice(P, F, cp, dvec, face_mask)
        if not pieces:
            break
        pc = min(pieces, key=lambda r: np.linalg.norm(r['centroid'] - cp))
        if np.linalg.norm(pc['centroid'] - cp) > 0.02:
            break
        if len(perims) >= 6 and pc['perimeter'] > 1.45 * np.median(perims[-6:]):
            rings.append(dict(merged=True, arc=arc + step, perimeter=pc['perimeter'], centroid=pc['centroid'].tolist()))
            break
        newc = pc['centroid']
        # local frame: up = dorsal direction across the finger
        up = hc.UP if name != 'thumb' else hc.unit(np.array([0.0, 0.35, 1.0]))
        u = hc.unit(up - (up @ dvec) * dvec)
        pts = pc['seg'].reshape(-1, 3)
        h = (pts - newc) @ u
        dors, palm = pts[np.argmax(h)], pts[np.argmin(h)]
        side = hc.unit(np.cross(dvec, u))
        wv = (pts - newc) @ side
        arc += np.linalg.norm(newc - c)
        rings.append(dict(arc=arc, centroid=newc.tolist(), dir=dvec.tolist(), perimeter=pc['perimeter'], dorsal=dors.tolist(), palmar=palm.tolist(),
                          thick=float(h.max() - h.min()), width=float(wv.max() - wv.min()), lum_palm=lum_at(palm), lum_dors=lum_at(dors)))
        perims.append(pc['perimeter'])
        nd = hc.unit(newc - c) if np.linalg.norm(newc - c) > 1e-5 else dvec
        dvec = hc.unit(0.5 * dvec + 0.5 * nd) if it > 1 else dvec
        c = newc
    return rings


out = {}
for name in hc.FINGERS:
    rings = march(name)
    cen = np.array([r['centroid'] for r in rings if not r.get('merged')])
    arc = np.array([r['arc'] for r in rings if not r.get('merged')])
    # bend angle of the medial curve: angle between the chords over +-2.5 mm
    bend = np.zeros(len(cen))
    for i in range(len(cen)):
        a = np.searchsorted(arc, arc[i] - 0.0025)
        b = np.searchsorted(arc, arc[i] + 0.0025)
        b = min(b, len(cen) - 1)
        if a < i < b:
            v1, v2 = hc.unit(cen[i] - cen[a]), hc.unit(cen[b] - cen[i])
            bend[i] = np.degrees(np.arccos(np.clip(v1 @ v2, -1, 1)))
    for r, bv in zip([r for r in rings if not r.get('merged')], bend):
        r['bend_deg'] = float(bv)
    out[name] = dict(tip=P[tips[name]['tip']].tolist(), rings=rings, web_arc=rings[-1]['arc'] if rings and rings[-1].get('merged') else None)
    print(name, 'rings', len(rings), 'web arc mm', round((out[name]['web_arc'] or 0) * 1000, 1), 'tip', np.round(out[name]['tip'], 4).tolist())
hc.save_json(os.path.join(rig, '_work', 'fingers_a.json'), out)

import matplotlib  # noqa: E402
matplotlib.use('Agg')
import matplotlib.pyplot as plt  # noqa: E402

fig, ax = plt.subplots(5, 1, figsize=(13, 17))
for k, name in enumerate(hc.FINGERS):
    rr = [r for r in out[name]['rings'] if not r.get('merged')]
    a = np.array([r['arc'] for r in rr]) * 1000
    ax[k].plot(a, [r['perimeter'] * 1000 / 3 for r in rr], label='perimeter/3 mm')
    ax[k].plot(a, [r['thick'] * 1000 for r in rr], label='thickness mm')
    ax[k].plot(a, [r['bend_deg'] for r in rr], label='bend deg (5 mm)')
    ax[k].plot(a, [r['lum_palm'] * 40 for r in rr], label='palm lum x40')
    ax[k].plot(a, [r['lum_dors'] * 40 for r in rr], label='dorsal lum x40')
    ax[k].set_title(f'{name}: arc length from tip (mm) ->; web at {out[name]["web_arc"] and out[name]["web_arc"] * 1000:.1f} mm' if out[name]['web_arc'] else name)
    ax[k].set_xticks(np.arange(0, a.max() + 2, 2))
    ax[k].grid(alpha=0.3)
    ax[k].legend(fontsize=7, loc='upper left')
plt.tight_layout()
plt.savefig(os.path.join(rig, 'qa', 's3_finger_profiles.png'), dpi=60)

fig, ax = plt.subplots(2, 1, figsize=(13, 12))
q = mask_v & (s > 0.24)
ax[0].scatter(s[q], P[q, 0], s=1, c='#999')
ax[1].scatter(s[q], P[q, 2], s=1, c='#999')
for name in hc.FINGERS:
    c = np.array([r['centroid'] for r in out[name]['rings'] if not r.get('merged')])
    ax[0].plot(-c[:, 1], c[:, 0], '-', lw=1.5)
    ax[1].plot(-c[:, 1], c[:, 2], '-', lw=1.5)
for a_ in ax:
    a_.set_aspect('equal')
    a_.grid(alpha=0.3)
ax[0].set_title('top (s ->, x ^)')
ax[1].set_title('side (s ->, z ^ back)')
plt.tight_layout()
plt.savefig(os.path.join(rig, 'qa', 's3_medial_curves.png'), dpi=70)
