"""P04 Hive-Sleeper, R0/R1 probe (headless Blender 5.1, read-only on the GLB).

blender -b --factory-startup -P p00_probe.py -- <glb> <out_dir>

Works in the GLB's own units (Tripo: longest edge 1 m). Writes <out_dir>/probe.json (islands, texture classes, limb
slices, exact sections) and renders with camera sidecars (*_cam.json) for grids/overlays. Reuses render helpers of
_batches/rig_v1/tools/rigbatch.py (imported, not modified).
"""
import bpy, bmesh, sys, os, json, math, collections
import numpy as np
from mathutils import Vector, Matrix

TOOLS = r'D:/Claude/Diablo2/ashlar/3d/act-01/_batches/rig_v1/tools'
sys.path.insert(0, TOOLS)
import rigbatch as rb

argv = sys.argv[sys.argv.index('--') + 1:]
GLB, OUT = argv[0], argv[1]
os.makedirs(OUT, exist_ok=True)

# ------------------------------------------------------------------ import (no scaling)
bpy.ops.wm.read_factory_settings(use_empty=True)
rb.prefs()
bpy.ops.import_scene.gltf(filepath=GLB, merge_vertices=True)
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
for o in meshes:
    M = o.matrix_world.copy(); o.parent = None; o.data.transform(M); o.matrix_world.identity()
for o in [o for o in bpy.data.objects if o.type != 'MESH']:
    bpy.data.objects.remove(o)
assert len(meshes) == 1, len(meshes)
ob = meshes[0]; ob.name = 'P04_Src'; me = ob.data
V = np.array([v.co[:] for v in me.vertices])
print('verts', len(V), 'faces', len(me.polygons), 'bbox', V.min(0).round(4), V.max(0).round(4))

# ------------------------------------------------------------------ islands
lab, isl = rb._islands(ob)
lab = np.array(lab)
order = sorted(range(len(isl)), key=lambda k: -len(isl[k]))
rank = {k: r for r, k in enumerate(order)}        # island id by size rank (0 = biggest)
lab_r = np.array([rank[k] for k in lab])

# ------------------------------------------------------------------ texture classes (base colour at each vertex's UVs)
mat = me.materials[0]
def upstream_image(sock, depth=0):
    for l in sock.links:
        nd = l.from_node
        if nd.type == 'TEX_IMAGE' and nd.image:
            return nd.image
        if depth < 6:
            for s in nd.inputs:
                im = upstream_image(s, depth + 1)
                if im:
                    return im
    return None
img = None
for n in mat.node_tree.nodes:
    if n.type == 'BSDF_PRINCIPLED':
        img = upstream_image(n.inputs['Base Color'])
print('base colour image', img.name if img else None, [i.name for i in bpy.data.images])
img_small = img.copy(); img_small.scale(1024, 1024)
W_, H_ = img_small.size
px = np.empty(W_ * H_ * 4, dtype=np.float32); img_small.pixels.foreach_get(px); px = px.reshape(H_, W_, 4)
uv = me.uv_layers.active.data
acc = np.zeros((len(V), 3)); cnt = np.zeros(len(V))
for p in me.polygons:
    for li in p.loop_indices:
        vi = me.loops[li].vertex_index; u, v = uv[li].uv
        x = min(max(int(u * W_), 0), W_ - 1); y = min(max(int(v * H_), 0), H_ - 1)
        acc[vi] += px[y, x, :3]; cnt[vi] += 1
srgb = acc / np.maximum(cnt, 1)[:, None]           # Image.pixels of a byte image = stored (sRGB-encoded) values
col = np.where(srgb <= 0.04045, srgb / 12.92, np.power((np.clip(srgb, 0, 1) + 0.055) / 1.055, 2.4))   # linear, for display
import colorsys
hsv = np.array([colorsys.rgb_to_hsv(*c) for c in srgb])
np.save(os.path.join(OUT, 'vcol_srgb.npy'), srgb)
np.save(os.path.join(OUT, 'verts.npy'), V)
np.save(os.path.join(OUT, 'island_rank.npy'), lab_r)
# faces for later python-side work
F = [list(p.vertices) for p in me.polygons]
with open(os.path.join(OUT, 'faces.json'), 'w') as f:
    json.dump(F, f)

# ------------------------------------------------------------------ island table
rows = []
for k in order:
    ids = np.array(isl[k]); P = V[ids]; c = srgb[ids].mean(0); h = hsv[ids]
    rows.append(dict(rank=rank[k], n=len(ids), c=P.mean(0).round(4).tolist(), lo=P.min(0).round(4).tolist(),
                     hi=P.max(0).round(4).tolist(), rgb=(c * 255).round().astype(int).tolist(),
                     hue=round(float(np.median(h[:, 0])) * 360, 1), sat=round(float(np.median(h[:, 1])), 3),
                     val=round(float(np.median(h[:, 2])), 3)))

# ------------------------------------------------------------------ limb slices
def slices(ids, axis, lo, hi, step):
    ai = 'xyz'.index(axis); P = V[ids]; out = []
    t = lo
    while t < hi - 1e-9:
        S = P[(P[:, ai] >= t) & (P[:, ai] < t + step)]
        if len(S) >= 3:
            out.append(dict(t=round(t + step / 2, 4), n=int(len(S)), lo=S.min(0).round(4).tolist(), hi=S.max(0).round(4).tolist(),
                            c=S.mean(0).round(4).tolist()))
        t += step
    return out

arm_ids = {}
for r in rows[:6]:
    if r['n'] > 300 and r['hi'][2] < 0.5 and r['lo'][1] < -0.45:      # forearm/hand islands touch the floor at the front
        side = 'L' if r['c'][0] > 0 else 'R'
        arm_ids[side] = r['rank']
leg_rank = [r['rank'] for r in rows if r['n'] > 500 and r['hi'][1] > 0.45][0]
big_rank = 0
limb = {}
for s, rk in arm_ids.items():
    ids = np.where(lab_r == rk)[0]
    limb[f'arm_{s}_z'] = slices(ids, 'z', 0.0, 0.45, 0.01)
legs = np.where(lab_r == leg_rank)[0]
for s, sg in (('L', 1), ('R', -1)):
    ids = legs[(V[legs, 0] * sg) > 0.015]
    limb[f'leg_{s}_y'] = slices(ids, 'y', -0.26, 0.51, 0.01)
    limb[f'leg_{s}_z'] = slices(ids, 'z', 0.0, 0.36, 0.01)
mid = legs[np.abs(V[legs, 0]) <= 0.015]
limb['legs_mid_y'] = slices(mid, 'y', -0.26, 0.51, 0.01)

# ------------------------------------------------------------------ exact sections (per island)
def section(axis, value):
    ai = 'xyz'.index(axis); out = []
    for p in me.polygons:
        ids = list(p.vertices); pts = V[ids]; d = pts[:, ai] - value
        cut = []
        for i in range(len(ids)):
            a, b = pts[i], pts[(i + 1) % len(ids)]; da, db = d[i], d[(i + 1) % len(ids)]
            if (da < 0) != (db < 0):
                cut.append(a + (b - a) * (da / (da - db)))
        if len(cut) >= 2:
            out.append([cut[0].round(5).tolist(), cut[1].round(5).tolist(), int(lab_r[ids[0]])])
    return out

sections = {}
for x in (0.0, 0.03, 0.06, 0.09, 0.12, 0.15, 0.18):
    sections[f'x{x:+.2f}'] = section('x', x)
for y in np.arange(-0.48, 0.50, 0.02):
    sections[f'y{y:+.2f}'] = section('y', float(y))
for z in (0.02, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5):
    sections[f'z{z:.2f}'] = section('z', z)

json.dump(dict(glb=GLB, verts=len(V), faces=len(me.polygons), bbox=[V.min(0).round(4).tolist(), V.max(0).round(4).tolist()],
               islands=rows, arm_rank=arm_ids, leg_rank=leg_rank, limb=limb, image=[img.name, list(img.size)]),
          open(os.path.join(OUT, 'probe.json'), 'w'), indent=1)
json.dump(sections, open(os.path.join(OUT, 'sections.json'), 'w'))

# ------------------------------------------------------------------ renders
cam = rb.setup_render(1024)
lo, hi = rb.frame_box([ob])
for v in ('left', 'front', 'top', 'topdown', 'back', 'three_quarter'):
    rb.place_camera(cam, lo, hi, v)
    rb.only_visible([ob]); rb.shading('TEXTURE')
    rb.render_to(os.path.join(OUT, f'tex_{v}.png'))
# island colours (x-ray) for the parts
cols = []
for r_ in lab_r:
    cols.append(rb.golden_color(int(r_), s=0.65, v=0.95) if r_ > 0 else (0.85, 0.62, 0.52))
rb.set_point_colors(ob, cols, 'isl')
for v in ('left', 'front', 'topdown'):
    rb.place_camera(cam, lo, hi, v)
    rb.only_visible([ob]); rb.shading('VERTEX', xray=True, alpha=0.45)
    rb.render_to(os.path.join(OUT, f'isl_{v}.png'))
# texture-colour as vertex colour (sanity view of the classifier input)
rb.set_point_colors(ob, [tuple(c) for c in col], 'tcol')
for v in ('left', 'front'):
    rb.place_camera(cam, lo, hi, v)
    rb.only_visible([ob]); rb.shading('VERTEX', xray=False)
    rb.render_to(os.path.join(OUT, f'vcol_{v}.png'))
print('PROBE_DONE')
