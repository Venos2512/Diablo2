"""W02 diagnostics: worst stretched edges of one test pose with the weights of both ends.

blender -b --factory-startup <rig.blend> -P w02_diag_edges.py -- <poses.json> <pose name> [n]
"""
import bpy, sys, json, math
import numpy as np
from mathutils import Vector, Euler

argv = sys.argv[sys.argv.index('--') + 1:]
POSES = json.load(open(argv[0], encoding='utf-8')); NAME = argv[1]; NTOP = int(argv[2]) if len(argv) > 2 else 20
AID = 'W02_gibbet_crow'
ob = bpy.data.objects[AID]; ctl = bpy.data.objects[AID + '_ctl']
p = POSES[NAME]
rot = dict(p.get('rot', {})); wloc = dict(p.get('wloc', {}))
if p.get('mirror', True):
    for k, v in list(rot.items()):
        if '_L_' in k:
            rot.setdefault(k.replace('_L_', '_R_'), [v[0], -v[1], -v[2]])
    for k, v in list(wloc.items()):
        if '_L_' in k:
            wloc.setdefault(k.replace('_L_', '_R_'), [-v[0], v[1], v[2]])
for k, v in rot.items():
    ctl.pose.bones[k].rotation_mode = 'XYZ'; ctl.pose.bones[k].rotation_euler = Euler([math.radians(a) for a in v], 'XYZ')
for k, v in wloc.items():
    ctl.pose.bones[k].location = ctl.data.bones[k].matrix_local.to_3x3().inverted() @ Vector(v)
for nm in ('fold', 'flight'):
    for sd in ('L', 'R'):
        ctl.pose.bones[f'ctl_{sd}_Wing_{nm}'].location = (0, 0.1 * float(p.get(nm, 0)), 0)
bpy.context.view_layer.update()
me = ob.data; NV = len(me.vertices)
E = np.empty(len(me.edges) * 2, int); me.edges.foreach_get('vertices', E); E = E.reshape(-1, 2)
R0 = np.empty(NV * 3); me.vertices.foreach_get('co', R0); R0 = R0.reshape(NV, 3)
dg = bpy.context.evaluated_depsgraph_get(); ev = ob.evaluated_get(dg).to_mesh()
P = np.empty(NV * 3); ev.vertices.foreach_get('co', P); P = P.reshape(NV, 3)
L0 = np.linalg.norm(R0[E[:, 0]] - R0[E[:, 1]], axis=1); L1 = np.linalg.norm(P[E[:, 0]] - P[E[:, 1]], axis=1)
q = np.where(L0 >= 0.003, L1 / np.maximum(L0, 1e-9), 1.0); qq = np.maximum(q, 1 / np.maximum(q, 1e-9))
gn = [g.name for g in ob.vertex_groups]


def wstr(i):
    return ' '.join(f'{gn[g.group]}:{g.weight:.2f}' for g in sorted(me.vertices[i].groups, key=lambda g: -g.weight))


for j in np.argsort(-qq)[:NTOP]:
    a, b = E[j]
    pa = R0[a] - np.array([0, 0.145, 0]); pb = R0[b] - np.array([0, 0.145, 0])
    print(f'EDGE x{qq[j]:.2f} L0 {1000 * L0[j]:.1f}mm  a pre({pa[0]:+.3f},{pa[1]:+.3f},{pa[2]:.3f}) [{wstr(a)}]  '
          f'b pre({pb[0]:+.3f},{pb[1]:+.3f},{pb[2]:.3f}) [{wstr(b)}]')
