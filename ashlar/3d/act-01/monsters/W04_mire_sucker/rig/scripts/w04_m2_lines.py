"""R1 measurement: geodesic level-set centre lines of the legs, proboscis, lobes and wing blades (read-only).

blender -b --factory-startup rig/_work/m1_intake.blend -P w04_m2_lines.py

Writes rig/_work/m2_lines.json: welded components, seeds, and per seed the ring centroids/radii by geodesic distance.
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
inv, uco = M.weld(co, 1e-5)
faces = [tuple(int(inv[v]) for v in p.vertices) for p in me.polygons]
E = M.edges_from_faces(faces)
nu = len(uco)
adj = M.adjacency(nu, E, uco)
comp = M.components(nu, E)
sizes = np.bincount(comp)
order = np.argsort(-sizes)
comps = []
for c in order:
    P = uco[comp == c]
    comps.append(dict(id=int(c), n=int(sizes[c]), lo=P.min(0).round(3).tolist(), hi=P.max(0).round(3).tolist(),
                      c=P.mean(0).round(3).tolist()))
print('WELDED', nu, 'components', len(sizes))
for r in comps[:20]:
    print('  comp', r)
main = int(order[0])
inmain = comp == main

# ---------------- seeds
seeds = {}
low = np.nonzero(inmain & (uco[:, 2] < 0.035))[0]
# cluster the foot vertices in xy
P = uco[low, :2]
par = list(range(len(low)))


def f(a):
    while par[a] != a:
        par[a] = par[par[a]]; a = par[a]
    return a


D = np.linalg.norm(P[:, None] - P[None], axis=2)
for a, b in zip(*np.nonzero(np.triu(D < 0.03, 1))):
    ra, rb = f(a), f(b)
    if ra != rb:
        par[ra] = rb
groups = {}
for a in range(len(low)):
    groups.setdefault(f(a), []).append(low[a])
feet = sorted(groups.values(), key=lambda g: (np.sign(uco[g, 0].mean()), uco[g, 1].mean()))
for g in feet:
    g = np.array(g)
    c = uco[g].mean(0)
    s = g[np.argmin(np.linalg.norm(uco[g, :2] - c[:2], axis=1) + 2 * uco[g, 2])]
    side = 'L' if c[0] > 0 else 'R'
    seeds[f'foot_{side}_{c[1]:+.2f}'] = int(s)
mi = np.nonzero(inmain)[0]
seeds['proboscis_tip'] = int(mi[np.argmin(uco[mi, 1])])
for side, sg in (('L', 1), ('R', -1)):
    lob = mi[(uco[mi, 1] > 0.3) & (sg * uco[mi, 0] > 0.0) & (sg * uco[mi, 0] < 0.3) & (uco[mi, 2] < 0.8)]
    seeds[f'lobe_tip_{side}'] = int(lob[np.argmin(uco[lob, 2] - 0.3 * uco[lob, 1])])
    w = mi[(sg * uco[mi, 0] > 0.15) & (uco[mi, 2] > 1.1)]
    seeds[f'wing_top_{side}'] = int(w[np.argmax(uco[w, 2])])
    w2 = mi[(sg * uco[mi, 0] > 0.15) & (uco[mi, 2] > 1.0)]
    seeds[f'wing_back_{side}'] = int(w2[np.argmax(uco[w2, 1])])
print('SEEDS', {k: uco[v].round(3).tolist() for k, v in seeds.items()})

lines = {}
for name, s in seeds.items():
    dist, _ = M.dijkstra(adj, [s], limit=1.6)
    rings = M.level_rings(uco, adj, dist, 0.015, 1.4)
    lines[name] = dict(seed=uco[s].round(4).tolist(), rings=rings)
    print('LINE', name, 'seed', uco[s].round(3).tolist())
    for b in rings[:80]:
        r0 = b['rings'][0]
        extra = '' if len(b['rings']) == 1 else f"  +{len(b['rings']) - 1} [{', '.join(str(x['n']) for x in b['rings'][1:4])}]"
        print(f"   d{b['d']:.3f} n{r0['n']:4d} c({r0['c'][0]:+.3f},{r0['c'][1]:+.3f},{r0['c'][2]:.3f}) r{r0['r']:.3f}{extra}")
        if r0['r'] > 0.09:
            break
with open(os.path.join(C.WORK, 'm2_lines.json'), 'w') as fh:
    json.dump(dict(welded=nu, comps=comps, seeds={k: uco[v].round(4).tolist() for k, v in seeds.items()}, lines=lines), fh)
print('M2_DONE')
