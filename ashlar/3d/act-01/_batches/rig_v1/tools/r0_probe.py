"""R0 probe for one Tripo GLB (read-only: the GLB is never written).

blender -b --factory-startup -P r0_probe.py -- <glb> <out_dir>

Writes <out_dir>/<stem>_r0.json and four 640 px renders (front/side x texture/islands).
Measures in Blender space (Z up, the character faces -Y after the glTF import):
counts, bbox, raw islands (UV-seam split) and welded islands (geometric pieces),
a width profile per 2 % of height, leg gaps near the floor, arm band.
"""
import bpy, bmesh, sys, os, json, math, colorsys, collections, hashlib
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
GLB, OUT = argv[0], argv[1]
STEM = os.path.splitext(os.path.basename(GLB))[0]
os.makedirs(OUT, exist_ok=True)


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB, merge_vertices=False)
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
for o in meshes:                                  # bake the node transforms into the mesh
    M = o.matrix_world.copy()
    o.parent = None
    o.data.transform(M)
    o.matrix_world.identity()
for o in [o for o in bpy.data.objects if o.type != 'MESH']:
    bpy.data.objects.remove(o)
if len(meshes) > 1:
    bpy.ops.object.select_all(action='DESELECT')
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.join()
ob = bpy.context.view_layer.objects.active or meshes[0]
me = ob.data
V = [v.co.copy() for v in me.vertices]
xs, ys, zs = [p.x for p in V], [p.y for p in V], [p.z for p in V]
H = max(zs) - min(zs)


def islands_of(bm):
    bm.verts.ensure_lookup_table()
    lab = [-1] * len(bm.verts); out = []
    for v in bm.verts:
        if lab[v.index] >= 0:
            continue
        k = len(out); lab[v.index] = k; st = [v]; comp = []
        while st:
            a = st.pop(); comp.append(a.index)
            for e in a.link_edges:
                b = e.other_vert(a)
                if lab[b.index] < 0:
                    lab[b.index] = k; st.append(b)
        out.append(comp)
    return lab, out


bm = bmesh.new(); bm.from_mesh(me)
raw_lab, raw_isl = islands_of(bm)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
bm.verts.ensure_lookup_table(); bm.faces.ensure_lookup_table()
wl, wisl = islands_of(bm)
wco = [v.co.copy() for v in bm.verts]
nonman = sum(1 for e in bm.edges if len(e.link_faces) > 2)
boundary = sum(1 for e in bm.edges if len(e.link_faces) == 1)
welded_verts = len(bm.verts)

isl_rows = []
for k, c in enumerate(wisl):
    P = [wco[i] for i in c]
    isl_rows.append(dict(n=len(c), x=[round(min(p.x for p in P), 4), round(max(p.x for p in P), 4)],
                         y=[round(min(p.y for p in P), 4), round(max(p.y for p in P), 4)],
                         z=[round(min(p.z for p in P), 4), round(max(p.z for p in P), 4)]))
isl_rows.sort(key=lambda r: -r['n'])

# width profile, 2 % bands
z0 = min(zs); prof = []
for b in range(50):
    lo, hi = z0 + H * b / 50, z0 + H * (b + 1) / 50
    S = [p for p in V if lo <= p.z < hi]
    if S:
        prof.append(dict(z=round((lo + hi) / 2 - z0, 4), n=len(S), xmin=round(min(p.x for p in S), 4),
                         xmax=round(max(p.x for p in S), 4), ymin=round(min(p.y for p in S), 4), ymax=round(max(p.y for p in S), 4)))

# gaps along x near the floor (legs vs robe/roots) at a few heights
def x_gaps(zc, tol):
    S = sorted(p.x for p in V if abs(p.z - (z0 + zc)) < tol)
    if len(S) < 4:
        return []
    out = []
    for a, b in zip(S, S[1:]):
        if b - a > 0.02 * H:
            out.append([round(a, 4), round(b, 4)])
    return out
gaps = {f'{f:.2f}H': x_gaps(f * H, 0.01 * H) for f in (0.02, 0.06, 0.12, 0.2, 0.3, 0.4)}

# texture sizes
imgs = [dict(name=i.name, size=list(i.size)) for i in bpy.data.images]

res = dict(asset=STEM, glb=GLB.replace('\\', '/'), sha256=sha256(GLB), bytes=os.path.getsize(GLB),
           verts=len(me.vertices), faces=len(me.polygons), tris=sum(len(p.vertices) - 2 for p in me.polygons),
           welded_verts=welded_verts, raw_islands=len(raw_isl), welded_islands=len(wisl),
           nonmanifold_edges=nonman, boundary_edges=boundary,
           bbox=dict(x=[round(min(xs), 4), round(max(xs), 4)], y=[round(min(ys), 4), round(max(ys), 4)],
                     z=[round(min(zs), 4), round(max(zs), 4)]),
           size=dict(width_x=round(max(xs) - min(xs), 4), depth_y=round(max(ys) - min(ys), 4), height_z=round(H, 4)),
           islands_top=isl_rows[:40], islands_small=sum(1 for r in isl_rows if r['n'] < 30),
           profile=prof, floor_gaps=gaps, images=imgs, vgroups=len(ob.vertex_groups),
           uv_layers=len(me.uv_layers), materials=[m.name for m in me.materials if m])
with open(os.path.join(OUT, STEM + '_r0.json'), 'w', encoding='utf-8') as f:
    json.dump(res, f, indent=1)

# ---- island colours as a face colour attribute (welded islands, mapped back via positions)
from mathutils import kdtree
kd = kdtree.KDTree(len(wco))
for i, p in enumerate(wco):
    kd.insert(p, i)
kd.balance()
order = sorted(range(len(wisl)), key=lambda k: -len(wisl[k]))
rank = {k: r for r, k in enumerate(order)}
def col(k):
    r = rank[k]
    h = (r * 0.61803398875) % 1.0
    return colorsys.hsv_to_rgb(h, 0.55 + 0.4 * ((r * 7) % 3) / 2, 0.95)
attr = me.color_attributes.new('island', 'FLOAT_COLOR', 'POINT')
for v in me.vertices:
    j = kd.find(v.co)[1]; c = col(wl[j])
    attr.data[v.index].color = (c[0], c[1], c[2], 1.0)
bm.free()

# ---- renders (Workbench, orthographic)
scn = bpy.context.scene
scn.render.engine = 'BLENDER_WORKBENCH'
scn.render.resolution_x = scn.render.resolution_y = 640
scn.render.film_transparent = False
scn.display.shading.light = 'STUDIO'
scn.display.shading.show_object_outline = False
scn.view_settings.view_transform = 'Standard'
world = bpy.data.worlds.new('w'); scn.world = world
cam_d = bpy.data.cameras.new('cam'); cam_d.type = 'ORTHO'
cam = bpy.data.objects.new('cam', cam_d); scn.collection.objects.link(cam); scn.camera = cam
cx = (min(xs) + max(xs)) / 2; cy = (min(ys) + max(ys)) / 2; cz = (min(zs) + max(zs)) / 2
span = max(max(xs) - min(xs), max(ys) - min(ys), H) * 1.08
cam_d.ortho_scale = span; cam_d.clip_start = 0.01; cam_d.clip_end = 100
views = {'front': ((cx, cy - 20, cz), (math.radians(90), 0, 0)),
         'side': ((cx + 20, cy, cz), (math.radians(90), 0, math.radians(90)))}
for mode in ('tex', 'isl'):
    scn.display.shading.color_type = 'TEXTURE' if mode == 'tex' else 'VERTEX'
    if mode == 'isl':
        me.color_attributes.active_color = attr
    for vn, (loc, rot) in views.items():
        cam.location = loc; cam.rotation_euler = rot
        scn.render.filepath = os.path.join(OUT, f'{STEM}_{vn}_{mode}.png')
        bpy.ops.render.render(write_still=True)
print('R0_DONE', STEM)
