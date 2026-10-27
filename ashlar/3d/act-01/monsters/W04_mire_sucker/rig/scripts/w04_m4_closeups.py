"""R1 close-up renders with a 5 cm grid sidecar (read-only). blender -b rig/_work/m1_intake.blend -P w04_m4_closeups.py -- <spec.json>

spec: list of {name, center [x,y,z], size, dir [dx,dy,dz], color: TEXTURE|VERTEX|SINGLE, xray: bool, clip: [axis, lo, hi]}
'clip' hides the faces whose centre is outside [lo, hi] on axis (a copy of the mesh is cut, the source is untouched).
Output: rig/_work/c_<name>.png (+ _cam.json).
"""
import json
import os
import sys

import bmesh
import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import w04_common as C

sys.path.insert(0, C.TOOLS)
import rigbatch as rb  # noqa: E402

spec = json.load(open(sys.argv[sys.argv.index('--') + 1], encoding='utf-8'))
src = bpy.data.objects[C.AID + '_Src']
for img in bpy.data.images:
    if img.size[0] > 1024:
        img.scale(1024, 1024)
cam = rb.setup_render(1000)
for s in spec:
    ob = src
    if s.get('clip'):
        ax, lo, hi = s['clip']
        me = src.data.copy()
        bm = bmesh.new(); bm.from_mesh(me)
        dead = [f for f in bm.faces if not (lo <= f.calc_center_median()[ax] <= hi)]
        bmesh.ops.delete(bm, geom=dead, context='FACES')
        bm.to_mesh(me); bm.free()
        ob = bpy.data.objects.new('_clip', me); bpy.context.scene.collection.objects.link(ob)
    rb.VIEW_DIRS['_c'] = tuple(s['dir'])
    c = Vector(s['center']); h = Vector((s['size'],) * 3) / 2
    rb.place_camera(cam, c - h, c + h, '_c', center=c, size=s['size'])
    rb.only_visible([ob])
    sh = bpy.context.scene.display.shading
    if s.get('color', 'TEXTURE') == 'SINGLE':
        sh.color_type = 'SINGLE'; sh.single_color = (0.75, 0.72, 0.68)
    else:
        sh.color_type = s.get('color', 'TEXTURE')
    sh.show_xray = bool(s.get('xray')); sh.xray_alpha = 0.35
    rb.render_to(os.path.join(C.WORK, f"c_{s['name']}.png"))
    sh.show_xray = False
    if ob is not src:
        me = ob.data; bpy.data.objects.remove(ob); bpy.data.meshes.remove(me)
    for o in bpy.context.scene.objects:
        o.hide_render = False
print('M4_DONE')
