"""Close-ups for R1: head parts, leg roots, rear (orphan leg pieces, spinneret). Island colours + labels, texture.

blender -b --factory-startup -P w07_r1_closeups.py
Writes rig/_work/cu_<region>_<view>_{isl,tex}.png and _labels.json.
"""
import bpy, os, sys, json, math
from mathutils import Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import w07_common as C
rb = C.rb

ob, info = C.import_scaled()
me = ob.data
rep, reps = C.weld_map(ob, dist=1e-5)
lab, groups = C.welded_islands(ob, rep)
import numpy as np
CO = np.array([v.co[:] for v in me.vertices])
cent = [CO[g].mean(axis=0) for g in groups]
rb.set_point_colors(ob, [rb.golden_color(lab[i], s=0.65, v=0.95) for i in range(len(me.vertices))], name='isl')

VIEWS = {'front': (0, -1, 0), 'left': (1, 0, 0), 'top': (0, 0, 1), 'bottom': (0, 0, -1), 'back': (0, 1, 0),
         'fq_low': (0.6, -0.7, -0.35), 'bq_low': (0.6, 0.7, -0.3), 'fq_high': (0.6, -0.7, 0.6)}
REGIONS = {
    'head': ((0.0, -0.55, 0.74), 0.95, ('front', 'left', 'top', 'bottom', 'fq_low', 'fq_high')),
    'roots': ((0.30, -0.25, 0.70), 1.10, ('top', 'bottom', 'fq_high', 'back')),
    'rear': ((0.0, 0.85, 0.55), 1.30, ('back', 'left', 'bottom', 'bq_low')),
}
cam = rb.setup_render(1000)
sh = bpy.context.scene.display.shading
for reg, (c, size, views) in REGIONS.items():
    c = Vector(c)
    for v in views:
        d = Vector(VIEWS[v]).normalized()
        cam.data.type = 'ORTHO'; cam.data.ortho_scale = size; cam.data.clip_start = 0.001; cam.data.clip_end = 100
        cam.location = c + d * 8
        up = 'Y' if abs(d.z) < 0.99 else 'Y'
        cam.rotation_euler = (-d).to_track_quat('-Z', up).to_euler()
        bpy.context.view_layer.update()
        rb.only_visible([ob])
        sh.color_type = 'VERTEX'; sh.show_xray = False
        p = f'{C.WORK}/cu_{reg}_{v}_isl.png'; rb.render_to(p)
        uv = C.project_points([list(x) for x in cent], 1000)
        C.jdump(p[:-4] + '_labels.json', [dict(id=k, u=float(a), v=float(b)) for k, (a, b, z) in enumerate(uv)
                                          if 0.02 < a < 0.98 and 0.02 < b < 0.98])
        sh.color_type = 'TEXTURE'; rb.render_to(f'{C.WORK}/cu_{reg}_{v}_tex.png')
print('CLOSEUPS_DONE')
