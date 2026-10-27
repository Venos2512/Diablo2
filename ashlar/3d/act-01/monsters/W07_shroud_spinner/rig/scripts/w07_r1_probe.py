"""R1 probe for W07: islands, medial curves, island-colour + texture renders (no rig yet).

blender -b --factory-startup -P w07_r1_probe.py
Writes rig/_work/r1_islands.json, rig/_work/r1_medial.json, rig/_work/r1_*.png (+ _cam.json, _labels.json).
"""
import bpy, os, sys, json, math, heapq
import numpy as np
from mathutils import Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import w07_common as C
rb = C.rb

ob, info = C.import_scaled()
me = ob.data
n = len(me.vertices)
CO = np.array([v.co[:] for v in me.vertices])
rep, reps = C.weld_map(ob, dist=1e-5)
lab, groups = C.welded_islands(ob, rep)
print('verts', n, 'welded', len(reps), 'islands', len(groups))

# welded adjacency (rep -> set of reps) with edge lengths
adj = {}
for e in me.edges:
    a, b = rep[e.vertices[0]], rep[e.vertices[1]]
    if a == b:
        continue
    d = float(np.linalg.norm(CO[a] - CO[b]))
    adj.setdefault(a, {})[b] = d; adj.setdefault(b, {})[a] = d


def dijkstra(src, allowed):
    dist = {src: 0.0}; pq = [(0.0, src)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist.get(u, 1e9):
            continue
        for v, w in adj.get(u, {}).items():
            if v not in allowed:
                continue
            nd = d + w
            if nd < dist.get(v, 1e9):
                dist[v] = nd; heapq.heappush(pq, (nd, v))
    return dist


rows = []; medial = {}
for k, g in enumerate(groups):
    P = CO[g]
    c = P.mean(axis=0)
    cov = np.cov((P - c).T) if len(g) > 3 else np.eye(3)
    w, V = np.linalg.eigh(cov)
    ax = V[:, -1]; proj = (P - c) @ ax
    row = dict(id=k, n=len(g), c=[round(x, 4) for x in c],
               lo=[round(x, 4) for x in P.min(axis=0)], hi=[round(x, 4) for x in P.max(axis=0)],
               pca_axis=[round(x, 3) for x in ax], pca_len=round(float(proj.max() - proj.min()), 4),
               pca_sd=[round(math.sqrt(max(x, 0)), 4) for x in w[::-1]])
    rows.append(row)
    if len(g) >= 40:
        allowed = set(g)
        # start = vertex farthest from the creature's centre line (leg tips) or lowest vertex
        far = max(g, key=lambda i: (CO[i][0] ** 2 + CO[i][1] ** 2) ** 0.5 - 0.3 * CO[i][2])
        d1 = dijkstra(far, allowed)
        other = max(d1, key=d1.get)            # opposite end
        d2 = dijkstra(other, allowed)
        # medial polyline from `far`: bin by geodesic distance
        L = max(d1.values()); nb = max(8, min(60, int(len(g) / 12)))
        bins = [[] for _ in range(nb)]
        for i, d in d1.items():
            bins[min(nb - 1, int(d / L * nb))].append(i)
        poly = []
        for b in bins:
            if b:
                Q = CO[b]
                poly.append(dict(d=round(float(np.mean([d1[i] for i in b])), 4), c=[round(x, 4) for x in Q.mean(axis=0)],
                                 r=round(float(np.mean(np.linalg.norm(Q - Q.mean(axis=0), axis=1))), 4), n=len(b)))
        medial[k] = dict(start=int(far), start_co=[round(x, 4) for x in CO[far]], end=int(other),
                         end_co=[round(x, 4) for x in CO[other]], geo_len=round(L, 4), poly=poly)

C.jdump(C.WORK + '/r1_islands.json', dict(info=info, welded=len(reps), islands=rows))
C.jdump(C.WORK + '/r1_medial.json', medial)

# ---------------------------------------------------------------- renders
cols = []
for i in range(n):
    k = lab[i]
    cols.append(rb.golden_color(k, s=0.65, v=0.95))
rb.set_point_colors(ob, cols, name='isl')
res = 1100
cam = rb.setup_render(res)
lo, hi = rb.frame_box([ob])
for view in ('front', 'left', 'back', 'topdown', 'three_quarter'):
    rb.place_camera(cam, lo, hi, view, margin=1.06)
    bpy.context.view_layer.update()
    rb.only_visible([ob])
    rb.shading('VERTEX')
    p = f'{C.WORK}/r1_isl_{view}.png'
    rb.render_to(p)
    uv = C.project_points([r['c'] for r in rows], res)
    C.jdump(p[:-4] + '_labels.json', [dict(id=r['id'], u=u, v=v) for r, (u, v, z) in zip(rows, uv)])
    rb.shading('TEXTURE')
    rb.render_to(f'{C.WORK}/r1_tex_{view}.png')
print('R1_PROBE_DONE')
