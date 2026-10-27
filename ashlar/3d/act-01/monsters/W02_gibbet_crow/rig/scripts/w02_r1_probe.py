"""W02 Gibbet-Crow, R1 probe: measure the GLB for the joint proposal (read-only on the GLB).

blender -b --factory-startup -P w02_r1_probe.py -- <glb> <out_dir> <scale>

Imports the GLB (importer welds co-located verts), scales it uniformly by <scale> (mesh units -> metres),
classifies every vertex by island and by base-colour class (pink head skin, bone bill, dark feather, scaly leg),
and writes <out_dir>/w02_r1_probe.json with slices along the wing (x), the body (z, side profile), the legs
and the tail. Renders 1024 px textured / class-coloured / island-coloured views with camera sidecars
(rigbatch.render_to) for the joint overlay drawn later by w02_r1_overlay.py.
"""
import bpy, bmesh, sys, os, json, math, colorsys
import numpy as np
from mathutils import Vector, Matrix

TOOLS = r'D:/Claude/Diablo2/ashlar/3d/act-01/_batches/rig_v1/tools'
sys.path.insert(0, TOOLS)
import rigbatch as rb

argv = sys.argv[sys.argv.index('--') + 1:]
GLB, OUT, S = argv[0], argv[1], float(argv[2])
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
rb.prefs()
bpy.ops.import_scene.gltf(filepath=GLB, merge_vertices=True)
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
for o in meshes:
    M = o.matrix_world.copy(); o.parent = None; o.data.transform(M); o.matrix_world.identity()
for o in [o for o in bpy.data.objects if o.type != 'MESH']:
    bpy.data.objects.remove(o)
assert len(meshes) == 1, len(meshes)
ob = meshes[0]; ob.name = 'W02_Src'; me = ob.data
me.transform(Matrix.Scale(S, 4)); me.update()

N = len(me.vertices)
co = np.empty(N * 3, np.float32); me.vertices.foreach_get('co', co); co = co.reshape(N, 3).astype(np.float64)

# ---------------------------------------------------------------- texture classes (base colour at 1024)
mat = me.materials[0]
img = None
for nd in mat.node_tree.nodes:
    if nd.type == 'BSDF_PRINCIPLED':
        lk = nd.inputs['Base Color'].links
        if lk and lk[0].from_node.type == 'TEX_IMAGE':
            img = lk[0].from_node.image
if img is None:
    img = next((im for im in bpy.data.images if 'basecolor' in im.name.lower() or 'base' in im.name.lower()), None)
print('BASE_IMAGE', img and img.name, [im.name for im in bpy.data.images])
for im in bpy.data.images:          # render/probe at 1024 (8 parallel threads on this machine)
    if im.size[0] > 1024:
        im.scale(1024, 1024)
W_, H_ = img.size
px = np.empty(W_ * H_ * 4, np.float32); img.pixels.foreach_get(px); px = px.reshape(H_, W_, 4)
uvl = me.uv_layers.active.data
nl = len(me.loops)
uv = np.empty(nl * 2, np.float32); uvl.foreach_get('uv', uv); uv = uv.reshape(nl, 2)
lv = np.empty(nl, np.int32); me.loops.foreach_get('vertex_index', lv)
iu = np.clip((uv[:, 0] % 1.0) * W_, 0, W_ - 1).astype(int); iv = np.clip((uv[:, 1] % 1.0) * H_, 0, H_ - 1).astype(int)
lc = px[iv, iu, :3]
vc = np.zeros((N, 3)); cnt = np.zeros(N)
np.add.at(vc, lv, lc); np.add.at(cnt, lv, 1)
vc /= np.maximum(cnt, 1)[:, None]
hsv = np.array([colorsys.rgb_to_hsv(*c) for c in vc])
h, s, v = hsv[:, 0], hsv[:, 1], hsv[:, 2]
CL = np.full(N, 'feather', dtype=object)
pink = ((h > 0.90) | (h < 0.06)) & (s > 0.22) & (v > 0.30)
bone_c = (~pink) & (v > 0.52) & (s < 0.32)
CL[pink] = 'skin'; CL[bone_c] = 'bill'

# ---------------------------------------------------------------- islands
lab, isl = rb._islands(ob)
lab = np.array(lab)
rows = []
for k, c in enumerate(isl):
    P = co[c]
    rows.append(dict(id=k, n=len(c), c=P.mean(0).round(4).tolist(), lo=P.min(0).round(4).tolist(), hi=P.max(0).round(4).tolist(),
                     skin=int((CL[c] == 'skin').sum()), bill=int((CL[c] == 'bill').sum())))
rows.sort(key=lambda r: -r['n'])
main = rows[0]['id']
legs = [r for r in rows[1:4] if r['lo'][2] < 0.01]
tail = [r for r in rows[1:6] if r['hi'][1] > 0.3 * S and r['lo'][2] > 0.05 * S]

def stats(P):
    return dict(n=int(len(P)), lo=P.min(0).round(4).tolist(), hi=P.max(0).round(4).tolist(), c=P.mean(0).round(4).tolist()) if len(P) else None

res = dict(glb=GLB.replace('\\', '/'), scale=S, verts=N, faces=len(me.polygons), islands=len(isl), main_island=main,
           bbox=dict(lo=co.min(0).round(4).tolist(), hi=co.max(0).round(4).tolist()),
           islands_top=rows[:14], legs=[r['id'] for r in legs], tail=[r['id'] for r in tail],
           classes={c: int((CL == c).sum()) for c in ('skin', 'bill', 'feather')})

M = lab == main
Pm = co[M]
# head: skin + bill on the main island (ruff feathers are separate islands)
res['head_skin'] = stats(co[M & (CL == 'skin')])
res['bill'] = stats(co[(CL == 'bill') & (co[:, 2] > 0.2 * S)])

# body side profile at the midline: per z band, y range of main-island verts with |x| < 0.03 S
prof = []
for z0 in np.arange(0.0, co[:, 2].max(), 0.01 * S):
    sel = M & (np.abs(co[:, 0]) < 0.03 * S) & (co[:, 2] >= z0) & (co[:, 2] < z0 + 0.01 * S)
    if sel.sum():
        P = co[sel]
        prof.append(dict(z=round(float(z0 + 0.005 * S), 4), n=int(sel.sum()), y=[round(float(P[:, 1].min()), 4), round(float(P[:, 1].max()), 4)]))
res['mid_profile'] = prof

# body width per z band (main island), only verts behind the wing plane cluster (y > wing plane + 1 cm) are flank
wid = []
for z0 in np.arange(0.0, co[:, 2].max(), 0.01 * S):
    sel = M & (co[:, 2] >= z0) & (co[:, 2] < z0 + 0.01 * S)
    if sel.sum():
        P = co[sel]
        wid.append(dict(z=round(float(z0 + 0.005 * S), 4), n=int(sel.sum()), x=[round(float(P[:, 0].min()), 4), round(float(P[:, 0].max()), 4)],
                        y=[round(float(P[:, 1].min()), 4), round(float(P[:, 1].max()), 4)]))
res['main_z_bands'] = wid

# wing slices along +x (left wing): leading-edge top, feather bottom, y spread of the top band
wing = []
for x0 in np.arange(0.0, co[:, 0].max(), 0.01 * S):
    sel = M & (co[:, 0] >= x0) & (co[:, 0] < x0 + 0.01 * S)
    allx = (co[:, 0] >= x0) & (co[:, 0] < x0 + 0.01 * S)
    if not sel.sum():
        continue
    P = co[sel]; zt = P[:, 2].max()
    top = P[P[:, 2] > zt - 0.02 * S]
    wing.append(dict(x=round(float(x0 + 0.005 * S), 4), n=int(sel.sum()), z=[round(float(P[:, 2].min()), 4), round(float(zt), 4)],
                     y=[round(float(P[:, 1].min()), 4), round(float(P[:, 1].max()), 4)],
                     top_y=[round(float(top[:, 1].min()), 4), round(float(top[:, 1].max()), 4)],
                     top_c=top.mean(0).round(4).tolist(), all_n=int(allx.sum()),
                     all_z=[round(float(co[allx, 2].min()), 4), round(float(co[allx, 2].max()), 4)]))
res['wing_x_slices'] = wing

# legs: per z band centre of each leg island
legd = []
for r in legs:
    idx = np.array(isl[r['id']]); P = co[idx]; bands = []
    for z0 in np.arange(0.0, P[:, 2].max(), 0.005 * S):
        q = P[(P[:, 2] >= z0) & (P[:, 2] < z0 + 0.005 * S)]
        if len(q):
            bands.append(dict(z=round(float(z0 + 0.0025 * S), 4), n=int(len(q)), c=q.mean(0).round(4).tolist(),
                              x=[round(float(q[:, 0].min()), 4), round(float(q[:, 0].max()), 4)],
                              y=[round(float(q[:, 1].min()), 4), round(float(q[:, 1].max()), 4)]))
    legd.append(dict(id=r['id'], bands=bands))
res['leg_bands'] = legd

# tail principal axis
if tail:
    P = co[np.array(isl[tail[0]['id']])]
    c = P.mean(0); u, sv, vt = np.linalg.svd(P - c, full_matrices=False)
    ax = vt[0] if vt[0][1] > 0 else -vt[0]
    t = (P - c) @ ax
    res['tail_axis'] = dict(c=c.round(4).tolist(), dir=ax.round(4).tolist(), root=(c + ax * t.min()).round(4).tolist(),
                            tip=(c + ax * t.max()).round(4).tolist(), spread=sv.round(4).tolist())

with open(os.path.join(OUT, 'w02_r1_probe.json'), 'w', encoding='utf-8') as f:
    json.dump(res, f, indent=1)
np.save(os.path.join(OUT, 'w02_r1_co.npy'), co)
np.save(os.path.join(OUT, 'w02_r1_lab.npy'), lab)
np.save(os.path.join(OUT, 'w02_r1_cls.npy'), np.array([{'skin': 1, 'bill': 2}.get(c, 0) for c in CL], np.int8))
print('PROBE_OK', json.dumps(dict(main=main, legs=res['legs'], tail=res['tail'], classes=res['classes'], bbox=res['bbox'])))

# ---------------------------------------------------------------- renders
cols_isl = []
for i in range(N):
    k = lab[i]
    cols_isl.append((0.78, 0.55, 0.5) if k == main else rb.golden_color(int(k), 0.65, 0.95))
cols_cls = [(1.0, 0.45, 0.55) if c == 'skin' else (0.95, 0.9, 0.6) if c == 'bill' else (0.35, 0.37, 0.42) for c in CL]
views = ('front', 'left', 'back', 'top', 'topdown', 'three_quarter')
rb.render_views(os.path.join(OUT, 'w02_tex'), [ob], views=views, color_type='TEXTURE', res=1024)
rb.set_point_colors(ob, cols_isl, 'isl')
rb.render_views(os.path.join(OUT, 'w02_isl'), [ob], views=('front', 'left', 'back', 'topdown'), color_type='VERTEX', res=1024)
rb.set_point_colors(ob, cols_cls, 'cls')
rb.render_views(os.path.join(OUT, 'w02_cls'), [ob], views=('front', 'left'), color_type='VERTEX', res=1024)
print('RENDER_OK')
