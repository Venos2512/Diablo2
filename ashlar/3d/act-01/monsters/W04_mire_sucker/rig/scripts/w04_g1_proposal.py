"""G1 proposal renders: planned runtime joints over the mesh (nothing saved to a .blend).

blender -b --factory-startup rig/_work/m1_intake.blend -P w04_g1_proposal.py

Builds a throw-away armature from w04_rig_def (runtime bones; control-rig foot/pole/master positions as markers),
renders per view: X-ray mesh pass, textured pass, bone-proxy pass (+ _cam.json sidecars) into rig/_work/g1/, and writes
rig/_work/g1/labels.json (world positions of the label anchors) for w04_sheet.py.
"""
import colorsys
import json
import math
import os
import sys

import bmesh
import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import w04_common as C
import w04_rig_def as D

sys.path.insert(0, C.TOOLS)
import rigbatch as rb  # noqa: E402

OUT = os.path.join(C.WORK, 'g1')
os.makedirs(OUT, exist_ok=True)


def color(name):
    """fixed colours per body part, lighter for the distal bones, R side shifted."""
    base = {'thorax': 0.08, 'head': 0.75, 'proboscis': 0.95, 'abdomen': 0.0, 'WingF': 0.52, 'WingB': 0.45,
            'Leg1': 0.30, 'Leg3': 0.17}
    for k, h in base.items():
        if k in name:
            seg = int(name[-1]) if name[-1].isdigit() else 1
            side_shift = 0.04 if name.startswith('R_') else 0.0
            v = 0.95 - 0.12 * (seg - 1)
            return colorsys.hsv_to_rgb((h + side_shift) % 1.0, 0.85, max(v, 0.55))
    return (0.6, 0.6, 0.6)


rb.bone_color = color          # in memory only: the proxy colours of this sheet

src = bpy.data.objects[C.AID + '_Src']
B = D.build()
CB = D.control_bones(B)
arm = bpy.data.armatures.new('_g1_arm')
rig = bpy.data.objects.new('_g1_rig', arm)
bpy.context.scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig
rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
for b in B:
    eb = arm.edit_bones.new(b['name'])
    eb.head = Vector(b['head']); eb.tail = Vector(b['tail'])
    z = b['zvec'] if b['zvec'] else D.roll_z(b['head'], b['tail'], b['hinge'])
    eb.align_roll(Vector(z))
    eb.use_deform = b['kind'] == 'core' and b['name'] not in ('root', 'cog')
for b in B:
    if b['parent']:
        arm.edit_bones[b['name']].parent = arm.edit_bones[b['parent']]
bpy.ops.object.mode_set(mode='OBJECT')
proxy = rb.bone_proxy(rig, posed=False, scale=1.3)

# control markers: small cubes at IK feet (yellow), poles (cyan), wing masters (magenta), proboscis IK (orange)
bm = bmesh.new(); cols = []
mk = {'ik': (1.0, 0.85, 0.1), 'pole': (0.2, 0.9, 1.0), 'master': (1.0, 0.3, 0.9)}
for c in CB:
    if c['kind'] not in mk:
        continue
    s = 0.022 if c['kind'] != 'master' else 0.03
    m = bmesh.ops.create_cube(bm, size=s)
    for v in m['verts']:
        v.co += Vector(c['head'])
    col = mk[c['kind']] if c['name'] != 'ctl_proboscis_IK' else (1.0, 0.5, 0.1)
    cols += [col] * 8
me = bpy.data.meshes.new('_g1_ctl'); bm.to_mesh(me); bm.free()
ctl = bpy.data.objects.new('_g1_ctl', me); bpy.context.scene.collection.objects.link(ctl)
rb.set_point_colors(ctl, cols)
mk_bm = bmesh.new()  # joint balls are part of the proxy already

for img in bpy.data.images:
    if img.size[0] > 1024:
        img.scale(1024, 1024)
rb.VIEW_DIRS['top'] = (0, 0.0001, 1)
rb.VIEW_DIRS['tq'] = (0.75, -0.62, 0.35)
cam = rb.setup_render(1100)
lo, hi = rb.frame_box([src])
sh = bpy.context.scene.display.shading
views = ('front', 'left', 'top', 'back', 'tq')
for v in views:
    rb.place_camera(cam, lo, hi, v, margin=1.04)
    rb.only_visible([src]); sh.color_type = 'SINGLE'; sh.single_color = (0.70, 0.67, 0.62); sh.show_xray = True; sh.xray_alpha = 0.50
    rb.render_to(os.path.join(OUT, f'{v}_mesh.png'))
    sh.show_xray = False; sh.color_type = 'TEXTURE'
    rb.render_to(os.path.join(OUT, f'{v}_tex.png'))
    rb.only_visible([proxy, ctl]); rb.shading('VERTEX', xray=False)
    rb.render_to(os.path.join(OUT, f'{v}_bones.png'))
# close-ups: head + proboscis (left), wing root (front), legs (left, lower half)
close = [('cu_head', (0.0, -0.45, 0.85), 0.55, 'left'), ('cu_wingroot', (0.2, 0.05, 1.12), 0.45, 'front'),
         ('cu_wingtop', (0.25, 0.15, 1.15), 0.55, 'top'), ('cu_abdomen', (0.0, 0.40, 0.65), 0.75, 'left'),
         ('cu_legs_under', (0.0, 0.0, 0.70), 0.75, 'bottom')]
rb.VIEW_DIRS['bottom'] = (0, 0.0001, -1)
for name, c, size, v in close:
    cc = Vector(c); h = Vector((size,) * 3) / 2
    rb.place_camera(cam, cc - h, cc + h, v, center=cc, size=size)
    rb.only_visible([src]); sh.color_type = 'SINGLE'; sh.single_color = (0.70, 0.67, 0.62); sh.show_xray = True; sh.xray_alpha = 0.50
    rb.render_to(os.path.join(OUT, f'{name}_mesh.png'))
    rb.only_visible([proxy, ctl]); rb.shading('VERTEX', xray=False)
    rb.render_to(os.path.join(OUT, f'{name}_bones.png'))
sh.show_xray = False
labels = {}
for b in B:
    h, t = Vector(b['head']), Vector(b['tail'])
    labels[b['name']] = dict(head=list(h), tail=list(t), mid=list((h + t) / 2), kind=b['kind'])
for c in CB:
    if c['kind'] in mk:
        labels[c['name']] = dict(head=list(c['head']), mid=list(c['head']), kind=c['kind'])
with open(os.path.join(OUT, 'labels.json'), 'w') as f:
    json.dump(labels, f)
print('G1_DONE')
