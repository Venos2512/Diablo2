"""R0-R1 inspection of P06 Poppy-Mound at real size (read-only on the GLB; nothing saved but JSON + renders).

blender -b --factory-startup -P p06_r1_inspect.py

Writes rig/_work/r1_inspect.json (scale, islands, crown, footprint, height field) and rig/_work/r1_*.png renders
(textured: front/back/left/right/top/three_quarter; island colours with ids: top/front/left).
"""
import bpy, os, sys, json, math, colorsys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import p06_common as C
from mathutils import Vector

ob, info = C.intake()
me = ob.data
rep, groups, nbrs, wco = C.weld_map(ob)
wlab, wisl = C.welded_islands(nbrs)
order = sorted(range(len(wisl)), key=lambda k: -len(wisl[k]))
body_k = order[0]
C.log('welded verts', len(groups), 'islands', len(wisl), 'body', len(wisl[body_k]))

# per-vertex island id (rank: 0 = body)
rank = {k: r for r, k in enumerate(order)}
vis = [rank[wlab[rep[i]]] for i in range(len(me.vertices))]

# ---- islands
def pca(P):
    import numpy as np
    A = np.array([[p.x, p.y, p.z] for p in P]); c = A.mean(0); U, S, Vt = np.linalg.svd(A - c, full_matrices=False)
    return [round(float(s) / math.sqrt(max(len(P) - 1, 1)), 4) for s in S], [round(float(x), 3) for x in Vt[0]]

bt = C.bvh(ob)
body_verts = [i for i in range(len(me.vertices)) if vis[i] == 0]
from mathutils.bvhtree import BVHTree
body_faces = [list(p.vertices) for p in me.polygons if vis[p.vertices[0]] == 0]
body_bvh = BVHTree.FromPolygons([v.co.copy() for v in me.vertices], body_faces)
rows = []
for r, k in enumerate(order):
    W = wisl[k]; P = [wco[w] for w in W]
    c = sum(P, Vector()) / len(P)
    lo = min(P, key=lambda p: p.z); hi = max(P, key=lambda p: p.z)
    sd, ax = pca(P)
    row = dict(id=r, n=len(W), c=[round(x, 3) for x in c], lo=[round(x, 3) for x in lo], hi=[round(x, 3) for x in hi],
               x=[round(min(p.x for p in P), 3), round(max(p.x for p in P), 3)],
               y=[round(min(p.y for p in P), 3), round(max(p.y for p in P), 3)],
               z=[round(min(p.z for p in P), 3), round(max(p.z for p in P), 3)], sd=sd, axis=ax)
    if r > 0:
        loc, nrm, fi, d = body_bvh.find_nearest(lo)
        row['lo_to_body'] = round(d, 3)
        # vertices of this island below / inside the body surface (ray up from the point hits body => inside)
        inside = 0
        for p in P:
            hit = body_bvh.ray_cast(p + Vector((0, 0, 1e-4)), Vector((0, 0, 1)))
            if hit[0] is not None and (hit[1].dot(Vector((0, 0, 1))) > 0):
                inside += 1
        row['inside_frac'] = round(inside / len(P), 3)
    rows.append(row)

# ---- body: crown, footprint, height field
BP = [wco[w] for w in wisl[body_k]]
crown = max(BP, key=lambda p: p.z)
zmax = crown.z
foot = [p for p in BP if p.z < 0.03]
fc = sum(foot, Vector()) / len(foot)
az = []
for a in range(0, 360, 15):
    d = Vector((math.sin(math.radians(a)), -math.cos(math.radians(a)), 0))   # a=0 -> front (-Y), 90 -> +X (left)
    best = 0.0; bz = 0
    for p in BP:
        q = Vector((p.x, p.y, 0))
        if q.length < 1e-6:
            continue
        if q.normalized().dot(d) > math.cos(math.radians(7.5)):
            if q.length > best:
                best = q.length; bz = p.z
    az.append(dict(az=a, r_max=round(best, 3), z_at=round(bz, 3)))
step = 0.25
hf = {}
for p in BP:
    key = (round(p.x / step), round(p.y / step))
    hf[key] = max(hf.get(key, 0), p.z)
hfield = [dict(x=round(k[0] * step, 2), y=round(k[1] * step, 2), z=round(v, 3)) for k, v in sorted(hf.items())]
# volume-ish centroid of the body (area weighted surface centroid)
A = 0; cen = Vector()
for p in me.polygons:
    if vis[p.vertices[0]] == 0:
        A += p.area; cen += p.center * p.area
cen /= A
prof = []
for b in range(12):
    lo, hi = zmax * b / 12, zmax * (b + 1) / 12
    S = [p for p in BP if lo <= p.z < hi]
    if S:
        prof.append(dict(z=round((lo + hi) / 2, 3), n=len(S), x=[round(min(p.x for p in S), 3), round(max(p.x for p in S), 3)],
                         y=[round(min(p.y for p in S), 3), round(max(p.y for p in S), 3)]))
res = dict(info=info, welded_verts=len(groups), welded_islands=len(wisl), body_n=len(wisl[body_k]),
           crown=[round(x, 3) for x in crown], body_zmax=round(zmax, 3), foot_centre=[round(x, 3) for x in fc],
           body_surface_centroid=[round(x, 3) for x in cen], footprint_by_azimuth=az, profile=prof, islands=rows,
           heightfield_025=hfield)
C.write_json(os.path.join(C.WORK, 'r1_inspect.json'), res)

# ---- renders
C.downscale_textures(1024)
scn = bpy.context.scene
cam = C.rb.setup_render(1100)
scn.render.film_transparent = False
lo, hi = C.rb.frame_box([ob])
for v in ('front', 'back', 'left', 'right', 'topdown', 'three_quarter'):
    C.rb.place_camera(cam, lo, hi, v)
    C.rb.only_visible([ob]); C.rb.shading('TEXTURE')
    C.rb.render_to(os.path.join(C.WORK, f'r1_{v}_tex.png'))

# island colours
cols = []
for i in range(len(me.vertices)):
    r = vis[i]
    cols.append((0.62, 0.55, 0.52) if r == 0 else colorsys.hsv_to_rgb((r * 0.61803398875) % 1.0, 0.75, 0.95))
C.rb.set_point_colors(ob, cols, 'isl')
labels = {}
for v in ('topdown', 'front', 'left', 'right', 'back'):
    C.rb.place_camera(cam, lo, hi, v)
    C.rb.shading('VERTEX')
    p = os.path.join(C.WORK, f'r1_{v}_isl.png'); C.rb.render_to(p)
    L = []
    for row in rows[1:]:
        u, vv, d = C.project(scn, cam, row['hi'])
        L.append(dict(id=row['id'], u=u, v=vv))
    C.write_json(os.path.join(C.WORK, f'r1_{v}_isl_labels.json'), L)
print('R1_INSPECT_DONE')
