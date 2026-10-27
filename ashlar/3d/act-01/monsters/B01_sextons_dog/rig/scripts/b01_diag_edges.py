"""Diagnostic: worst edges per test pose (ratio and absolute change), with their position and dominant bones.

blender -b --factory-startup rig/B01_sextons_dog_rig.blend -P b01_diag_edges.py -- <pose,pose,...>
"""
import bpy, sys, os
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import b01_common as C
import b01_poses as PO

poses = sys.argv[sys.argv.index('--') + 1].split(',')
ob = bpy.data.objects[C.AID]; cr = bpy.data.objects['B01_control']; me = ob.data
R = np.array([v.co[:] for v in me.vertices]); E = np.array([e.vertices[:] for e in me.edges])
gn = [g.name for g in ob.vertex_groups]
dom = []
for v in me.vertices:
    g = sorted(v.groups, key=lambda g: -g.weight)[:2]
    dom.append('/'.join(f'{gn[x.group]}:{x.weight:.2f}' for x in g))
L0 = np.linalg.norm(R[E[:, 0]] - R[E[:, 1]], axis=1)
for p in poses:
    PO.apply(cr, p)
    dg = bpy.context.evaluated_depsgraph_get(); ev = ob.evaluated_get(dg).to_mesh()
    P = np.array([v.co[:] for v in ev.vertices]); ob.evaluated_get(dg).to_mesh_clear()
    L1 = np.linalg.norm(P[E[:, 0]] - P[E[:, 1]], axis=1)
    m = L0 >= 0.004
    q = np.where(m, np.maximum(L1 / L0, L0 / np.maximum(L1, 1e-9)), 1)
    dl = np.abs(L1 - L0)
    print(f'== {p}: ratio p50 {np.percentile(q[m], 50):.2f} p99 {np.percentile(q[m], 99):.2f} p99.9 {np.percentile(q[m], 99.9):.2f} '
          f'max {q.max():.2f}; >1.6: {(q > 1.6).sum()} / {m.sum()}; dlen p99 {1000 * np.percentile(dl, 99):.0f} mm max {1000 * dl.max():.0f} mm')
    for k in np.argsort(-q)[:6]:
        a, b = E[k]
        print(f'   ratio {q[k]:5.2f} L0 {1000 * L0[k]:5.1f}mm at {np.round(R[a], 3)}  {dom[a]} | {dom[b]}')
    for k in np.argsort(-dl)[:5]:
        a, b = E[k]
        print(f'   dlen {1000 * dl[k]:5.0f}mm L0 {1000 * L0[k]:5.1f}mm at {np.round(R[a], 3)}  {dom[a]} | {dom[b]}')
PO.reset(cr)
