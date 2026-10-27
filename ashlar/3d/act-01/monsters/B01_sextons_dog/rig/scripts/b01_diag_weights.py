"""Diagnostic: dominant-bone colour map of the rig mesh, several views (rig/_work/dw_<view>.png).

blender -b --factory-startup rig/B01_sextons_dog_rig.blend -P b01_diag_weights.py -- [tag]
"""
import bpy, sys, os, math, colorsys
from mathutils import Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import b01_common as C
C.tools_path()
import rigbatch as rb

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
tag = argv[0] if argv else 'dw'
C.texture_limit(1024)
ob = bpy.data.objects[C.AID]
PAL = {'pelvis': (1.0, 0.25, 0.2), 'spine_01': (1.0, 0.6, 0.1), 'spine_02': (1.0, 0.92, 0.2), 'chest': (0.3, 0.85, 0.3),
       'neck_01': (0.2, 0.85, 0.9), 'neck_02': (0.25, 0.45, 1.0), 'head': (0.65, 0.35, 1.0), 'jaw': (1.0, 0.45, 0.75),
       'ear': (0.75, 0.45, 0.2), 'collar': (0.55, 0.55, 0.55), 'collar_ring': (0.95, 0.95, 0.95),
       'tail_01': (0.0, 0.65, 0.55), 'tail_02': (0.7, 0.7, 0.1), 'tail_03': (0.0, 0.45, 0.38), 'tail_04': (0.95, 0.95, 0.4),
       'Scapula': (0.85, 0.7, 0.0), 'UpperArm': (0.9, 0.2, 0.9), 'ForeArm': (0.3, 0.7, 1.0), 'Hand': (0.6, 1.0, 0.2),
       'Finger': (1.0, 0.4, 0.3), 'Thigh': (0.55, 0.25, 0.85), 'Calf': (0.3, 0.7, 1.0), 'Foot': (0.6, 1.0, 0.2),
       'Toe': (1.0, 0.4, 0.3)}
COL = {}
for g in ob.vertex_groups:
    n = g.name; base = n[2:] if n[:2] in ('L_', 'R_') else n
    COL[n] = PAL.get(base, (0.5, 0.5, 0.5))
ORDER = [k for k in PAL]
gn = [g.name for g in ob.vertex_groups]
cols = []
for v in ob.data.vertices:
    c = Vector((0, 0, 0)); t = 0
    for g in v.groups:
        c += Vector(COL.get(gn[g.group], (0.5, 0.5, 0.5))) * g.weight; t += g.weight
    cols.append(tuple(c / t) if t else (0.1, 0.1, 0.1))
rb.set_point_colors(ob, cols, name='dw')
cam = rb.setup_render(1000)
lo, hi = rb.frame_box([ob])
for v in ('left', 'front', 'back', 'three_quarter'):
    rb.place_camera(cam, lo, hi, v, margin=1.05)
    rb.only_visible([ob]); rb.shading('VERTEX'); rb.render_to(os.path.join(C.WORK, f'{tag}_{v}.png'))
cd = cam.data; cd.type = 'ORTHO'; e = hi - lo; cd.ortho_scale = max(e.x, e.y) * 1.05
cam.location = (0, 0, -5); cam.rotation_euler = (math.pi, 0, 0)
rb.render_to(os.path.join(C.WORK, f'{tag}_below.png'))
cam.location = (0, 0, 5); cam.rotation_euler = (0, 0, math.pi)
rb.render_to(os.path.join(C.WORK, f'{tag}_top.png'))
# head close-ups
for v, c, s in (('left', (0, -0.86, 0.88), 0.55), ('front', (0, -0.86, 0.88), 0.62)):
    rb.place_camera(cam, lo, hi, v, center=Vector(c), size=s)
    rb.render_to(os.path.join(C.WORK, f'{tag}_head_{v}.png'))
import json
json.dump({n: PAL[n] for n in ORDER}, open(os.path.join(C.WORK, f'{tag}_colors.json'), 'w'))
print('DIAG_DONE')
