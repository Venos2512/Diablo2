"""R1: smock / hood / tie analysis (read only). Distance of each cloth vertex to the body surface, hem loops,
renders coloured by distance (blue = on the skin, red >= 6 cm Tripo units).

blender -b --factory-startup -P u04_r1_cloth.py
"""
import bpy, bmesh, os, sys, json, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import u04_common as C
from mathutils import Vector
from mathutils.bvhtree import BVHTree
rb = C.rb

ob = C.import_glb(1.0)
me = ob.data; V = [v.co.copy() for v in me.vertices]
wid, nw = C.weld_ids(ob)
lab, isl = C.welded_islands(ob, wid)
role = {0: 'body', 1: 'smock', 2: 'hood', 3: 'tie'}
R = [role.get(lab[i], 'tooth') for i in range(len(V))]
body_faces = [tuple(p.vertices) for p in me.polygons if R[p.vertices[0]] == 'body']
bvh = BVHTree.FromPolygons(V, body_faces)
dist = []
for i, p in enumerate(V):
    if R[i] in ('smock', 'hood', 'tie'):
        hit = bvh.find_nearest(p)
        dist.append(hit[3] if hit[0] is not None else 1.0)
    else:
        dist.append(0.0)


def ramp(d, hi=0.06):
    t = min(d / hi, 1.0)
    return (0.15 + 0.85 * t, 0.35 * (1 - abs(2 * t - 1)) + 0.2, 0.95 * (1 - t) + 0.05)


cols = []
for i in range(len(V)):
    if R[i] == 'body':
        cols.append((0.55, 0.52, 0.50))
    elif R[i] == 'tooth':
        cols.append((1.0, 0.9, 0.2))
    else:
        cols.append(ramp(dist[i]))
rb.set_point_colors(ob, cols, name='u04_dist')
rb.render_views(os.path.join(C.WORK, 'r1_cloth'), [ob], views=('front', 'left', 'back', 'topdown', 'three_quarter'),
                color_type='VERTEX', res=1100)

# hem loops of the smock (boundary edges of smock faces)
bm = bmesh.new(); bm.from_mesh(me); bm.verts.ensure_lookup_table()
loops = []
for rl in ('smock', 'hood', 'tie'):
    bnd = [e for e in bm.edges if e.is_boundary and R[e.verts[0].index] == rl]
    seen = set()
    adj = {}
    for e in bnd:
        a, b = e.verts[0].index, e.verts[1].index
        adj.setdefault(a, []).append(b); adj.setdefault(b, []).append(a)
    for s in adj:
        if s in seen:
            continue
        comp = []; st = [s]; seen.add(s)
        while st:
            a = st.pop(); comp.append(a)
            for b in adj[a]:
                if b not in seen:
                    seen.add(b); st.append(b)
        P = [V[i] for i in comp]
        loops.append(dict(role=rl, n=len(comp), c=C.r(sum(P, Vector()) / len(P)),
                          lo=C.r(Vector((min(p.x for p in P), min(p.y for p in P), min(p.z for p in P)))),
                          hi=C.r(Vector((max(p.x for p in P), max(p.y for p in P), max(p.z for p in P))))))
bm.free()
loops.sort(key=lambda L: (L['role'], -L['n']))
# smock vertex stats by sector (angle around the torso axis seen from the top) and by height
S = [i for i in range(len(V)) if R[i] == 'smock']
far = [i for i in S if dist[i] > 0.03]
stats = dict(smock_n=len(S), smock_far_n=len(far),
             far_z=[C.r(min(V[i].z for i in far)), C.r(max(V[i].z for i in far))] if far else None,
             hood_n=sum(1 for r_ in R if r_ == 'hood'), tie_n=sum(1 for r_ in R if r_ == 'tie'),
             hood_far=sum(1 for i in range(len(V)) if R[i] == 'hood' and dist[i] > 0.02),
             tie_far=sum(1 for i in range(len(V)) if R[i] == 'tie' and dist[i] > 0.02))
C.save_json(os.path.join(C.WORK, 'r1_cloth.json'), dict(stats=stats, loops=loops))
# save per-vertex distance for later stages
C.save_json(os.path.join(C.WORK, 'r1_cloth_dist.json'), dict(role=R, dist=[round(d, 5) for d in dist]))
print('R1_CLOTH_DONE', stats)
