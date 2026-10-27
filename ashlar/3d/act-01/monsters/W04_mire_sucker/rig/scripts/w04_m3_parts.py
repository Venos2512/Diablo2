"""R1 measurement, pass 2: which limbs hang below the body, and their centre lines (read-only).

blender -b --factory-startup rig/_work/m1_intake.blend -P w04_m3_parts.py

- components of the welded mesh below z = ZCUT with the abdomen lobes removed (each leg -> one component)
- per component: the lowest vertex (foot), the geodesic path from the foot to the body, and local centroids along it
  (vertices within R of the path point that are also geodesically close -> centre of the tube)
- the same path/centroid trace for the proboscis tip, the two lobe tips and the wing blade tips
-> rig/_work/m3_parts.json
"""
import json
import os
import sys

import bpy
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import w04_common as C
import w04_mesh as M

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
main = int(np.argmax(np.bincount(comp)))
inmain = comp == main
x, y, z = U[:, 0], U[:, 1], U[:, 2]


def sub_components(mask):
    idx = np.nonzero(mask)[0]
    s = set(idx.tolist()); lab = {}
    out = []
    for v in idx:
        if v in lab:
            continue
        st = [v]; lab[v] = len(out); cc = []
        while st:
            a = st.pop(); cc.append(a)
            for b, _ in adj[a]:
                if b in s and b not in lab:
                    lab[b] = len(out); st.append(b)
        out.append(np.array(cc))
    return sorted(out, key=len, reverse=True)


def path_to(src, dst_mask):
    """shortest edge path from src to the nearest vertex of dst_mask."""
    dist, _ = M.dijkstra(adj, [src])
    cand = np.nonzero(dst_mask & np.isfinite(dist))[0]
    t = cand[np.argmin(dist[cand])]
    # walk back greedily along decreasing dist
    path = [t]
    while path[-1] != src:
        a = path[-1]
        best = min(adj[a], key=lambda bl: dist[bl[0]] + bl[1] * 0 if dist[bl[0]] < dist[a] else np.inf)
        if dist[best[0]] >= dist[a]:
            break
        path.append(best[0])
    return path[::-1], dist


def centroids(path, R=0.03, G=0.05, step=0.02):
    """local tube centres along a path: every `step` metres of path length, vertices within R (euclid) and within
    G (geodesic from that path vertex) -> centroid."""
    out = []
    acc = 0.0; last = None
    for i, v in enumerate(path):
        if last is not None:
            acc += float(np.linalg.norm(U[v] - U[last]))
        last = v
        if i and acc < step and i != len(path) - 1:
            continue
        acc = 0.0
        d, _ = M.dijkstra(adj, [v], limit=G)
        near = np.nonzero(np.isfinite(d) & (np.linalg.norm(U - U[v], axis=1) < R))[0]
        c = U[near].mean(0)
        r = float(np.linalg.norm(U[near] - c, axis=1).mean())
        out.append(dict(p=U[v].round(4).tolist(), c=c.round(4).tolist(), r=round(r, 4), n=int(len(near))))
    return out


res = dict(limbs=[], traces={})
ZCUT = 0.70
lobes = (np.abs(x) < 0.22) & (y > 0.12) & (z < 0.95)
low = inmain & (z < ZCUT) & ~lobes
cc = sub_components(low)
print('LOW COMPONENTS (z<%.2f, lobes removed):' % ZCUT, [len(c) for c in cc[:12]])
body = inmain & (z > 0.80) & (np.abs(x) < 0.12) & (y > -0.25) & (y < 0.15)
for k, c in enumerate(cc[:10]):
    if len(c) < 15:
        continue
    P = U[c]
    foot = c[np.argmin(P[:, 2])]
    path, dist = path_to(foot, body)
    cen = centroids(path)
    row = dict(k=k, n=int(len(c)), lo=P.min(0).round(3).tolist(), hi=P.max(0).round(3).tolist(), foot=U[foot].round(4).tolist(),
               path_len=round(float(dist[path[-1]]), 3), centres=cen)
    res['limbs'].append(row)
    print(f"limb {k}: n{len(c)} foot {U[foot].round(3).tolist()} lo {row['lo']} hi {row['hi']} pathlen {row['path_len']}")
    for q in cen:
        print(f"     c({q['c'][0]:+.3f},{q['c'][1]:+.3f},{q['c'][2]:.3f}) r{q['r']:.3f} n{q['n']}")

mi = np.nonzero(inmain)[0]
tips = {'proboscis': int(mi[np.argmin(y[mi])])}
for side, sg in (('L', 1), ('R', -1)):
    lob = mi[lobes[mi] & (sg * x[mi] > 0.0)]
    tips[f'lobe_{side}'] = int(lob[np.argmin(z[lob])])
    w = mi[(sg * x[mi] > 0.15) & (z[mi] > 1.05)]
    tips[f'wing_top_{side}'] = int(w[np.argmax(z[w])])
    tips[f'wing_back_{side}'] = int(w[np.argmax(y[w] + 0.3 * z[w])])
body_c = inmain & (np.linalg.norm(U - np.array([0.0, -0.05, 0.95]), axis=1) < 0.08)
for name, t in tips.items():
    path, dist = path_to(t, body_c)
    cen = centroids(path, R=0.035, G=0.06, step=0.03)
    res['traces'][name] = dict(tip=U[t].round(4).tolist(), centres=cen)
    print(f"trace {name}: tip {U[t].round(3).tolist()}")
    for q in cen:
        print(f"     c({q['c'][0]:+.3f},{q['c'][1]:+.3f},{q['c'][2]:.3f}) r{q['r']:.3f} n{q['n']}")
with open(os.path.join(C.WORK, 'm3_parts.json'), 'w') as f:
    json.dump(res, f)
print('M3_DONE')
