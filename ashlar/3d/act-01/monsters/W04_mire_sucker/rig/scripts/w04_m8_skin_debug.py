"""Skin debug (read-only on the GLB): compute w04_skin on the intake mesh and render the hard regions and the blended
weights. blender -b --factory-startup rig/_work/m1_intake.blend -P w04_m8_skin_debug.py -- <tag>
-> rig/_work/skin_<tag>/*.png, info.json
"""
import json
import os
import sys
import time

import bpy
import numpy as np
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import w04_common as C
import w04_mesh as M
import w04_rig_def as D
import w04_skin as S
import w04_viz as V

sys.path.insert(0, C.TOOLS)
import rigbatch as rb  # noqa: E402

tag = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else 'dbg'
OUT = os.path.join(C.WORK, f'skin_{tag}')
os.makedirs(OUT, exist_ok=True)
ob = bpy.data.objects[C.AID + '_Src']
me = ob.data
n = len(me.vertices)
co = np.empty(n * 3); me.vertices.foreach_get('co', co); co = co.reshape(n, 3)
inv, U = M.weld(co, 1e-5)
E = M.edges_from_faces([tuple(int(inv[v]) for v in p.vertices) for p in me.polygons])
comp = M.components(len(U), E)
B = D.build()
cfg = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'w04_skin_cfg.json'), encoding='utf-8'))
t0 = time.time()
res = S.compute(U, E, comp, B, cfg)
print('SKIN', round(time.time() - t0, 1), 's', json.dumps(res['info'], indent=1)[:4000])
names = res['names']; lab = res['label']; W = res['W']
cnt = {names[i]: int((lab == i).sum()) for i in range(len(names))}
print('LABEL COUNTS', cnt)
json.dump(dict(info=res['info'], counts=cnt), open(os.path.join(OUT, 'info.json'), 'w'), indent=1)

for img in bpy.data.images:
    if img.size[0] > 1024:
        img.scale(1024, 1024)
rb.VIEW_DIRS['top'] = (0, 0.0001, 1)
rb.VIEW_DIRS['bottom'] = (0, 0.0001, -1)
cam = rb.setup_render(1000)
lo, hi = rb.frame_box([ob])
hard = [V.color(names[lab[inv[i]]]) for i in range(n)]
soft = [V.blend(names, W[inv[i]]) for i in range(n)]
for nm, cols in (('hard', hard), ('soft', soft)):
    rb.set_point_colors(ob, cols)
    for v in ('front', 'left', 'top', 'back', 'bottom'):
        rb.place_camera(cam, lo, hi, v, margin=1.04)
        rb.only_visible([ob]); rb.shading('VERTEX')
        rb.render_to(os.path.join(OUT, f'{nm}_{v}.png'))
    for cname, c, size, v in (('wingroot', (0.15, 0.05, 1.12), 0.40, 'front'), ('wingtop', (0.18, 0.10, 1.12), 0.45, 'top'),
                              ('abd', (0.05, 0.35, 0.75), 0.70, 'left'), ('under', (0.0, 0.0, 0.72), 0.70, 'bottom'),
                              ('head', (0.0, -0.40, 0.90), 0.45, 'left')):
        cc = Vector(c); h = Vector((size,) * 3) / 2
        rb.place_camera(cam, cc - h, cc + h, v, center=cc, size=size)
        rb.only_visible([ob]); rb.shading('VERTEX')
        rb.render_to(os.path.join(OUT, f'{nm}_cu_{cname}.png'))
print('M8_DONE')
