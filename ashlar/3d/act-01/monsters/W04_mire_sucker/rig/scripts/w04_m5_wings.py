"""R1 measurement, pass 3: wings, proboscis, lobes, head (read-only).

blender -b --factory-startup rig/_work/m1_intake.blend -P w04_m5_wings.py

Wing (left, x > 0): PCA plane of the vertices beyond the wing root, blade tips (local maxima of the span coordinate),
the root band (where wing vertices meet the thorax), per-island membership. Plane cuts for tube centres:
refine(p, d) = centroid of the mesh cross-section through p with normal d (loop nearest p).
Renders: the left wing seen along its plane normal (island colours), the head/proboscis side, the lobes back/side.
-> rig/_work/m5_wings.json
"""
import json
import os
import sys

import bpy
import numpy as np
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import w04_common as C
import w04_mesh as M

sys.path.insert(0, C.TOOLS)
import rigbatch as rb  # noqa: E402

ob = bpy.data.objects[C.AID + '_Src']
me = ob.data
n = len(me.vertices)
co = np.empty(n * 3); me.vertices.foreach_get('co', co); co = co.reshape(n, 3)
inv, U = M.weld(co, 1e-5)
faces = [tuple(int(inv[v]) for v in p.vertices) for p in me.polygons]
E = M.edges_from_faces(faces)
nu = len(U)
adj = M.adjacency(nu, E, U)
comp = M.components(nu, E)
sizes = np.bincount(comp)
main = int(np.argmax(sizes))
x, y, z = U[:, 0], U[:, 1], U[:, 2]
out = {}


def refine(p, d, R=0.07):
    """centre of the cross-section loop through p, normal d."""
    p = np.asarray(p, float); d = np.asarray(d, float); d = d / np.linalg.norm(d)
    s = (U - p) @ d
    a, b = E[:, 0], E[:, 1]
    m = (s[a] * s[b] < 0)
    if not m.any():
        return None
    ea, eb = a[m], b[m]
    t = s[ea] / (s[ea] - s[eb])
    P = U[ea] + (U[eb] - U[ea]) * t[:, None]
    near = np.linalg.norm(P - p, axis=1) < R
    if not near.any():
        return None
    P = P[near]
    # cluster: keep the points connected (3 cm single linkage) to the one nearest p
    D = np.linalg.norm(P[:, None] - P[None], axis=2)
    keep = {int(np.argmin(np.linalg.norm(P - p, axis=1)))}
    grow = True
    while grow:
        new = set(np.nonzero((D[list(keep)] < 0.03).any(0))[0].tolist()) - keep
        grow = bool(new); keep |= new
    Q = P[sorted(keep)]
    return dict(c=Q.mean(0).round(4).tolist(), w=(Q.max(0) - Q.min(0)).round(3).tolist(), n=int(len(Q)))


# ---------------- wing (left)
wing_sel = (comp == main) & (x > 0.16) & (z > 1.08)
lower = np.nonzero(sizes == 61)[0]
low_L = [c for c in lower if U[comp == c, 0].mean() > 0][0]
W = np.nonzero(wing_sel | (comp == low_L))[0]
P = U[W]
c0 = P.mean(0)
u, s_, vt = np.linalg.svd(P - c0, full_matrices=False)
ax_span, ax_chord, normal = vt[0], vt[1], vt[2]
if ax_span[2] < 0:
    ax_span = -ax_span
if normal[0] < 0:
    normal = -normal
out['wing_L'] = dict(centroid=c0.round(4).tolist(), span=ax_span.round(4).tolist(), chord=ax_chord.round(4).tolist(),
                     normal=normal.round(4).tolist(), sv=s_.round(3).tolist())
print('WING_L pca centroid', c0.round(3), 'span', ax_span.round(3), 'chord', ax_chord.round(3), 'normal', normal.round(3), 'sv', s_.round(2))
# root band: main-island verts with 0.08 < x < 0.20 and z > 0.98 that are geodesically connected to the wing
root_cand = np.nonzero((comp == main) & (x > 0.06) & (x < 0.22) & (z > 0.98) & (y > -0.15) & (y < 0.25))[0]
Rp = U[root_cand]
print('ROOT candidates', len(root_cand), 'x', Rp[:, 0].min().round(3), Rp[:, 0].max().round(3), 'y', Rp[:, 1].min().round(3),
      Rp[:, 1].max().round(3), 'z', Rp[:, 2].min().round(3), Rp[:, 2].max().round(3))
# blade tips: per island/area, vertices with the largest span coordinate in clusters
span = (U - c0) @ ax_span
chord = (U - c0) @ ax_chord
Wm = W[np.argsort(-span[W])]
tips = []
for v in Wm:
    if all(np.linalg.norm(U[v] - U[t]) > 0.06 for t in tips):
        # local maximum: no neighbour within 6 cm has a larger span
        near = W[np.linalg.norm(U[W] - U[v], axis=1) < 0.06]
        if span[near].max() <= span[v] + 1e-9:
            tips.append(v)
    if len(tips) >= 8:
        break
out['wing_L']['tips'] = [dict(p=U[t].round(4).tolist(), span=round(float(span[t]), 3), chord=round(float(chord[t]), 3),
                              comp=int(comp[t])) for t in tips]
print('TIPS', [(U[t].round(3).tolist(), round(float(span[t]), 3), int(comp[t])) for t in tips])
# the lower blade island extent + its nearest approach to the main island
Lb = np.nonzero(comp == low_L)[0]
d_main = np.array([np.min(np.linalg.norm(U[(comp == main)] - U[v], axis=1)) for v in Lb])
out['wing_L']['lower_blade'] = dict(n=int(len(Lb)), lo=U[Lb].min(0).round(3).tolist(), hi=U[Lb].max(0).round(3).tolist(),
                                    min_gap_to_main=round(float(d_main.min()), 4),
                                    nearest_vertex=U[Lb[np.argmin(d_main)]].round(4).tolist())
print('LOWER BLADE', out['wing_L']['lower_blade'])

# span profile: chord width and thickness of the wing set per span bin
prof = []
for s0 in np.arange(span[W].min(), span[W].max(), 0.04):
    sel = W[(span[W] >= s0) & (span[W] < s0 + 0.04)]
    if len(sel) == 0:
        continue
    q = U[sel]
    prof.append(dict(s=round(float(s0 + 0.02), 3), n=int(len(sel)), c=q.mean(0).round(3).tolist(),
                     chord=[round(float(chord[sel].min()), 3), round(float(chord[sel].max()), 3)],
                     thick=round(float(((q - c0) @ normal).max() - ((q - c0) @ normal).min()), 3)))
out['wing_L']['profile'] = prof
for r in prof:
    print('  span', r)

# ---------------- proboscis / head / lobes: plane-cut centres
tip = int(np.argmin(y))
out['proboscis_tip'] = U[tip].round(4).tolist()
pro = []
d_pro = np.array([0.0, 0.77, 0.64])                      # tip -> root direction guess (forward-down 40 deg)
for k in range(0, 16):
    p = U[tip] + d_pro * (0.03 + 0.03 * k)
    r = refine(p, d_pro)
    pro.append(dict(p=p.round(3).tolist(), sec=r))
out['proboscis'] = pro
print('PROBOSCIS tip', U[tip].round(3))
for r in pro:
    print('  ', r['p'], r['sec'])
lob = []
for side, sg in (('L', 1), ('R', -1)):
    m = (comp == main) & (sg * x > 0.0) & (sg * x < 0.24) & (y > 0.12) & (z < 0.95) & (z > 0.25)
    idx = np.nonzero(m)[0]
    t_ = idx[np.argmin(z[idx] - 0.5 * y[idx])]
    out[f'lobe_tip_{side}'] = U[t_].round(4).tolist()
    for zz in np.arange(0.35, 0.96, 0.05):
        sl = idx[np.abs(z[idx] - zz) < 0.02]
        if len(sl):
            q = U[sl]
            lob.append(dict(side=side, z=round(float(zz), 2), n=int(len(sl)), c=q.mean(0).round(3).tolist(),
                            x=[round(float(q[:, 0].min()), 3), round(float(q[:, 0].max()), 3)],
                            y=[round(float(q[:, 1].min()), 3), round(float(q[:, 1].max()), 3)]))
out['lobes'] = lob
print('LOBE tips', out['lobe_tip_L'], out['lobe_tip_R'])
for r in lob:
    if r['side'] == 'L':
        print('  ', r)
# head + thorax: y sections (body only |x| < 0.2, z > 0.7)
body = []
for yy in np.arange(-0.44, 0.30, 0.02):
    sl = np.nonzero((comp == main) & (np.abs(y - yy) < 0.01) & (np.abs(x) < 0.2) & (z > 0.72) & (z < 1.25))[0]
    if len(sl):
        q = U[sl]
        body.append(dict(y=round(float(yy), 2), n=int(len(sl)), z=[round(float(q[:, 2].min()), 3), round(float(q[:, 2].max()), 3)],
                         x=[round(float(q[:, 0].min()), 3), round(float(q[:, 0].max()), 3)], zc=round(float(np.median(q[:, 2])), 3)))
out['body_y'] = body
for r in body:
    print('  body', r)
with open(os.path.join(C.WORK, 'm5_wings.json'), 'w') as f:
    json.dump(out, f)

# ---------------- renders
for img in bpy.data.images:
    if img.size[0] > 1024:
        img.scale(1024, 1024)
cols = [(0.72, 0.66, 0.6) if comp[inv[i]] == main else rb.golden_color(int(comp[inv[i]]) + 3) for i in range(n)]
rb.set_point_colors(ob, cols)
cam = rb.setup_render(1000)
rb.VIEW_DIRS['_wn'] = tuple(normal.tolist())
cw = Vector(c0.tolist())
rb.place_camera(cam, cw - Vector((0.4,) * 3), cw + Vector((0.4,) * 3), '_wn', center=cw, size=0.8)
rb.only_visible([ob]); rb.shading('VERTEX')
rb.render_to(os.path.join(C.WORK, 'm5_wingL_normal.png'))
rb.shading('TEXTURE')
rb.render_to(os.path.join(C.WORK, 'm5_wingL_normal_tex.png'))
print('M5_DONE')
