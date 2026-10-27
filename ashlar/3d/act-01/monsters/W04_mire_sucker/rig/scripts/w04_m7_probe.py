"""Probe (read-only): wing rib sections near the hinge + z layers over the abdomen (plates vs lobes).
blender -b --factory-startup rig/_work/m1_intake.blend -P w04_m7_probe.py"""
import os, sys
import bpy
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import w04_common as C
import w04_mesh as M
ob = bpy.data.objects[C.AID + '_Src']; me = ob.data; n = len(me.vertices)
co = np.empty(n * 3); me.vertices.foreach_get('co', co); co = co.reshape(n, 3)
inv, U = M.weld(co, 1e-5)
E = M.edges_from_faces([tuple(int(inv[v]) for v in p.vertices) for p in me.polygons])
comp = M.components(len(U), E); main = int(np.argmax(np.bincount(comp)))
def section(p, d, R):
    d = d / np.linalg.norm(d); s = (U - p) @ d; a, b = E[:, 0], E[:, 1]
    m = (s[a] * s[b] < 0) & (comp[a] == main)
    ea, eb = a[m], b[m]; t = s[ea] / (s[ea] - s[eb]); P = U[ea] + (U[eb] - U[ea]) * t[:, None]
    P = P[np.linalg.norm(P - p, axis=1) < R]
    if len(P) == 0: return None
    D = np.linalg.norm(P[:, None] - P[None], axis=2); keep = {int(np.argmin(np.linalg.norm(P - p, axis=1)))}
    while True:
        new = set(np.nonzero((D[sorted(keep)] < 0.02).any(0))[0].tolist()) - keep
        if not new: break
        keep |= new
    Q = P[sorted(keep)]
    return Q.mean(0).round(3).tolist(), (Q.max(0) - Q.min(0)).round(3).tolist(), len(Q)
root = np.array([0.15, 0.0, 1.11]); tip = np.array([0.614, 0.623, 1.566]); d = (tip - root) / np.linalg.norm(tip - root)
print('RIB sections along the leading edge (normal = span)')
# the rib runs along the upper edge: offset the probe point toward the rib (leading edge) using the top-most wing verts
for s in np.arange(-0.14, 0.16, 0.02):
    p = root + d * s
    print(f'  s{s:+.2f} p{p.round(3).tolist()} ->', section(p, d, 0.06))
print('LAYERS over the abdomen: |x|<0.06 and x 0.06-0.14, z clusters per y bin')
for xr in ((0.0, 0.06), (0.06, 0.14), (0.14, 0.22)):
    for y0 in np.arange(0.08, 0.62, 0.04):
        sel = (comp == main) & (np.abs(U[:, 0]) >= xr[0]) & (np.abs(U[:, 0]) < xr[1]) & (U[:, 1] >= y0) & (U[:, 1] < y0 + 0.04) & (U[:, 2] > 0.4)
        z = np.sort(U[sel, 2])
        if len(z) == 0: continue
        cl = [[z[0], z[0]]]
        for v in z[1:]:
            if v - cl[-1][1] > 0.03: cl.append([v, v])
            else: cl[-1][1] = v
        print(f'  x{xr} y{y0:.2f}: ' + ' | '.join(f'{a:.2f}-{b:.2f}' for a, b in cl))
