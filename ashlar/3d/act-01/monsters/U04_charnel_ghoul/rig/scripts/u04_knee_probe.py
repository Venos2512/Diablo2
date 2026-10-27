"""Centre of the hind leg at the knee the user marked in the editor (2026-10-27, side view, red dot), read only.

blender -b --factory-startup rig/U04_charnel_ghoul_rig.blend -P u04_knee_probe.py -- <y_m> <z_m>
y, z in metres (armature space, read off the screenshot by fitting the hip/knee/ankle/toe markers). Prints the leg
section around that point in Tripo units: x centre of the body skin, front/back contour at that height.
"""
import bpy, os, sys, json
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import u04_common as C

ym, zm = (float(v) for v in C.argv()[:2])
ob = bpy.data.objects[C.AID]; S = bpy.context.scene['u04_scale']
wid, nw = C.weld_ids(ob); lab_v, _ = C.welded_islands(ob, wid)
co = np.array([v.co[:] for v in ob.data.vertices]) / S
body = np.array([lab_v[i] == 0 for i in range(len(co))])
y0, z0 = ym / S, zm / S
out = {'point_tripo': [round(y0, 4), round(z0, 4)]}
for dz in (0.01, 0.02):
    m = body & (co[:, 0] > 0.035) & (np.abs(co[:, 2] - z0) < dz) & (np.abs(co[:, 1] - y0) < 0.12)
    xs, ys = co[m, 0], co[m, 1]
    out[f'slab_{dz}'] = dict(n=int(m.sum()), x=[round(float(xs.min()), 4), round(float(xs.max()), 4)], x_mid=round(float((xs.min() + xs.max()) / 2), 4),
                             y=[round(float(ys.min()), 4), round(float(ys.max()), 4)], y_mid=round(float((ys.min() + ys.max()) / 2), 4))
print('KNEE_PROBE', json.dumps(out))
