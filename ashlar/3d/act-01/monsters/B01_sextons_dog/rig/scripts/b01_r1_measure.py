"""B01 R1: measure the mesh at the proposed real size, dump numbers and render grid-ready views.

blender -b --factory-startup -P b01_r1_measure.py

Writes rig/_work/measure.json (islands, silhouettes, leg slices), rig/_work/welded.npz (welded positions,
island labels) and rig/_work/m_*.png renders with _cam.json sidecars (rig_v1 compose.py gridlines).
"""
import bpy, bmesh, sys, os, json, math
import numpy as np
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import b01_common as C
C.tools_path()
import rigbatch as rb

C.texture_limit(1024)
ob, info = C.intake()
me = ob.data
print('[b01] intake', info)

# ---- welded copy: positions, edges, islands
bm = bmesh.new(); bm.from_mesh(me)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
bm.verts.ensure_lookup_table()
P = np.array([v.co[:] for v in bm.verts])
E = np.array([[e.verts[0].index, e.verts[1].index] for e in bm.edges])
lab = -np.ones(len(P), int); isl = []
adj = [[] for _ in range(len(P))]
for a, b in E:
    adj[a].append(b); adj[b].append(a)
for s in range(len(P)):
    if lab[s] >= 0:
        continue
    k = len(isl); lab[s] = k; st = [s]; comp = []
    while st:
        a = st.pop(); comp.append(a)
        for b in adj[a]:
            if lab[b] < 0:
                lab[b] = k; st.append(b)
    isl.append(comp)
order = sorted(range(len(isl)), key=lambda k: -len(isl[k]))
rows = []
for r, k in enumerate(order):
    Q = P[isl[k]]
    rows.append(dict(rank=r, island=k, n=len(isl[k]), lo=Q.min(0).round(4).tolist(), hi=Q.max(0).round(4).tolist(),
                     c=Q.mean(0).round(4).tolist()))
body_k = order[0]
np.savez(os.path.join(C.WORK, 'welded.npz'), P=P, E=E, lab=lab, body=body_k)
bm.free()

B = P[lab == body_k]
res = dict(info=info, n_welded=len(P), n_islands=len(isl), islands=rows)

# ---- silhouettes along y (1 cm bins): all body verts, and the mid-sagittal band |x| < 3 cm
def sil(Q, step=0.01):
    out = []
    y0, y1 = Q[:, 1].min(), Q[:, 1].max()
    for y in np.arange(y0, y1 + step, step):
        S = Q[(Q[:, 1] >= y) & (Q[:, 1] < y + step)]
        if len(S):
            out.append([round(float(y + step / 2), 3), round(float(S[:, 2].min()), 4), round(float(S[:, 2].max()), 4),
                        round(float(S[:, 0].min()), 4), round(float(S[:, 0].max()), 4), int(len(S))])
    return out
res['sil_all'] = sil(B)
res['sil_mid'] = sil(B[np.abs(B[:, 0]) < 0.03])

# ---- z profile (2 cm): x and y extents
prof = []
for z in np.arange(0, B[:, 2].max() + 0.02, 0.02):
    S = B[(B[:, 2] >= z) & (B[:, 2] < z + 0.02)]
    if len(S):
        prof.append([round(float(z + 0.01), 3), int(len(S)), round(float(S[:, 0].min()), 4), round(float(S[:, 0].max()), 4),
                     round(float(S[:, 1].min()), 4), round(float(S[:, 1].max()), 4)])
res['z_profile'] = prof

# ---- legs: quadrant split below z 0.55 m, 2 cm slices -> centroid / extents of the leg column.
# Front/hind split at the y gap between the paws at floor level.
foot = B[B[:, 2] < 0.04]
ys = np.sort(foot[:, 1]); gaps = np.diff(ys); g = int(np.argmax(gaps))
y_split = float((ys[g] + ys[g + 1]) / 2)
res['paw_y_split'] = round(y_split, 4)
legs = {}
for side, sx in (('L', 1), ('R', -1)):
    for end, cond in (('front', B[:, 1] < y_split), ('hind', B[:, 1] >= y_split)):
        Q = B[cond & (sx * B[:, 0] > 0.0)]
        sl = []
        for z in np.arange(0, 0.70, 0.02):
            S = Q[(Q[:, 2] >= z) & (Q[:, 2] < z + 0.02)]
            if len(S) < 3:
                continue
            sl.append(dict(z=round(float(z + 0.01), 3), n=int(len(S)), c=S.mean(0).round(4).tolist(),
                           x=[round(float(S[:, 0].min()), 4), round(float(S[:, 0].max()), 4)],
                           y=[round(float(S[:, 1].min()), 4), round(float(S[:, 1].max()), 4)]))
        legs[f'{side}_{end}'] = sl
res['legs'] = legs

# ---- paws at the floor (z < 4 cm): toe front, heel back, x centre
paws = {}
for side, sx in (('L', 1), ('R', -1)):
    for end, cond in (('front', foot[:, 1] < y_split), ('hind', foot[:, 1] >= y_split)):
        Q = foot[cond & (sx * foot[:, 0] > 0)]
        paws[f'{side}_{end}'] = dict(n=int(len(Q)), c=Q.mean(0).round(4).tolist(), lo=Q.min(0).round(4).tolist(),
                                     hi=Q.max(0).round(4).tolist())
res['paws'] = paws
C.jdump(os.path.join(C.WORK, 'measure.json'), res)
print('[b01] islands', len(isl), 'body', len(B), 'y_split', y_split)

# ---- renders (Workbench, ortho) for gridlines
cam = rb.setup_render(1100)
bpy.context.scene.render.film_transparent = False
w = bpy.data.worlds.new('w'); bpy.context.scene.world = w
lo, hi = rb.frame_box([ob])
views = ('left', 'front', 'back')
for v in views:
    rb.place_camera(cam, lo, hi, v, margin=1.06)
    rb.shading('TEXTURE'); rb.render_to(os.path.join(C.WORK, f'm_{v}_tex.png'))
    sh = bpy.context.scene.display.shading
    sh.color_type = 'SINGLE'; sh.single_color = (0.80, 0.78, 0.74); sh.show_xray = True; sh.xray_alpha = 0.35
    rb.render_to(os.path.join(C.WORK, f'm_{v}_xray.png')); sh.show_xray = False

# top-down: camera above, image up = -Y (head up), image right = -X
cd = cam.data; cd.type = 'ORTHO'
ext = hi - lo; cd.ortho_scale = max(ext.x, ext.y) * 1.06
cam.location = ((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, hi.z + 5)
cam.rotation_euler = (0, 0, math.pi)
rb.shading('TEXTURE'); rb.render_to(os.path.join(C.WORK, 'm_top_tex.png'))

# left half only (x > 0) from the right side (camera at -X looking +X): shows the inner face of the L legs
import bmesh as _bm
half = ob.copy(); half.data = ob.data.copy(); half.name = 'half_L'; bpy.context.scene.collection.objects.link(half)
b2 = _bm.new(); b2.from_mesh(half.data)
_bm.ops.delete(b2, geom=[v for v in b2.verts if v.co.x < 0.0], context='VERTS'); b2.to_mesh(half.data); b2.free()
rb.only_visible([half])
rb.place_camera(cam, lo, hi, 'right', margin=1.06)
rb.shading('TEXTURE'); rb.render_to(os.path.join(C.WORK, 'm_halfL_inner_tex.png'))
for o in bpy.context.scene.objects:
    o.hide_render = False
print('B01_MEASURE_DONE')
