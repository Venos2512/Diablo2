"""R0/R1 measurement for W04 (read-only on the GLB).

blender -b --factory-startup -P w04_m1_measure.py

- intake (rigbatch.intake: importer weld, uniform scale to 1.566 m, soles on z = 0, bbox centred in x/y)
- saves rig/_work/m1_intake.blend (original textures, nothing else)
- islands, horizontal (z) and frontal (y) cross-section clusters -> rig/_work/m1_measure.json
- orthographic renders with a camera sidecar for the 5 cm grid (compose.py gridlines): rig/_work/m1_<view>.png
"""
import json
import os
import sys

import bpy
import numpy as np
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import w04_common as C

sys.path.insert(0, C.TOOLS)
import rigbatch as rb   # noqa: E402  (skill not loaded: only intake / islands / render helpers are used)

assert C.sha256_file(C.GLB) == C.GLB_SHA256, 'GLB changed since R0'
os.makedirs(C.WORK, exist_ok=True)
ob, info = rb.intake(C.GLB, C.AID, C.HEIGHT_M)
me = ob.data
rb.save(os.path.join(C.WORK, 'm1_intake.blend'))

n = len(me.vertices)
co = np.empty(n * 3); me.vertices.foreach_get('co', co); co = co.reshape(n, 3)
ed = np.empty(len(me.edges) * 2, dtype=np.int64); me.edges.foreach_get('vertices', ed); ed = ed.reshape(-1, 2)
lab, isl, rows = rb.island_rows(ob)
lab = np.array(lab)


def clusters(pts, thr):
    """single-linkage clusters of 2D points (small n)."""
    m = len(pts)
    if m == 0:
        return []
    par = list(range(m))

    def f(a):
        while par[a] != a:
            par[a] = par[par[a]]; a = par[a]
        return a
    d = np.linalg.norm(pts[:, None, :] - pts[None, :, :], axis=2)
    ii, jj = np.nonzero(np.triu(d < thr, 1))
    for a, b in zip(ii, jj):
        ra, rb_ = f(a), f(b)
        if ra != rb_:
            par[ra] = rb_
    groups = {}
    for a in range(m):
        groups.setdefault(f(a), []).append(a)
    return list(groups.values())


def section(axis, value, thr=0.012):
    a = co[ed[:, 0], axis]; b = co[ed[:, 1], axis]
    m = (a - value) * (b - value) < 0
    if not m.any():
        return []
    e = ed[m]; t = (value - co[e[:, 0], axis]) / (co[e[:, 1], axis] - co[e[:, 0], axis])
    p = co[e[:, 0]] + (co[e[:, 1]] - co[e[:, 0]]) * t[:, None]
    other = [i for i in range(3) if i != axis]
    q = p[:, other]
    out = []
    for g in clusters(q, thr):
        P = p[g]; isl_ids = sorted(set(int(lab[e[k, 0]]) for k in g))
        out.append(dict(n=len(g), c=[round(float(v), 4) for v in P.mean(0)],
                        lo=[round(float(v), 4) for v in P.min(0)], hi=[round(float(v), 4) for v in P.max(0)], isl=isl_ids))
    out.sort(key=lambda r: (r['c'][other[0]], r['c'][other[1]]))
    return out


zsec = {f'{z:.3f}': section(2, z) for z in np.arange(0.01, C.HEIGHT_M, 0.01)}
ysec = {f'{y:.3f}': section(1, y) for y in np.arange(round(co[:, 1].min(), 2) + 0.01, co[:, 1].max(), 0.01)}
xsec = {f'{x:.3f}': section(0, x) for x in np.arange(0.0, co[:, 0].max(), 0.01)}
out = dict(info=info, bbox=dict(lo=co.min(0).round(4).tolist(), hi=co.max(0).round(4).tolist()),
           islands=rows, zsec=zsec, ysec=ysec, xsec=xsec)
with open(os.path.join(C.WORK, 'm1_measure.json'), 'w') as f:
    json.dump(out, f, indent=1)
print('ISLANDS', [(r['id'], r['n'], r['c']) for r in rows])

# ------------------------------------------------------------------ renders (textures downscaled in memory, file not saved)
for img in bpy.data.images:
    if img.size[0] > 1024:
        img.scale(1024, 1024)
rb.VIEW_DIRS['bottom'] = (0, 0.0001, -1)
rb.VIEW_DIRS['top'] = (0, 0.0001, 1)
cam = rb.setup_render(1200)
lo, hi = rb.frame_box([ob])
for v in ('front', 'left', 'back', 'top', 'bottom', 'three_quarter'):
    rb.place_camera(cam, lo, hi, v, margin=1.05)
    rb.only_visible([ob]); rb.shading('TEXTURE')
    rb.render_to(os.path.join(C.WORK, f'm1_{v}.png'))
# island colours (main island grey, others coloured) for the side and front
cols = [(0.7, 0.62, 0.58) if lab[i] == 0 else rb.golden_color(int(lab[i])) for i in range(n)]
rb.set_point_colors(ob, cols)
for v in ('front', 'left', 'top'):
    rb.place_camera(cam, lo, hi, v, margin=1.05)
    rb.only_visible([ob]); rb.shading('VERTEX')
    rb.render_to(os.path.join(C.WORK, f'm1_isl_{v}.png'))
print('M1_DONE')
