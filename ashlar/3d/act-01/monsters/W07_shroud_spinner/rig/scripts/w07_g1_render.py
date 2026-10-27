"""G1 proposal renders: proposed runtime skeleton (rig/_work/rig_spec.json) over the X-ray mesh.

blender -b --factory-startup -P w07_g1_render.py
Writes rig/_work/g1/*.png (+ _cam.json). Composited by w07_g1_sheet.py. Nothing is saved as .blend.
"""
import bpy, os, sys, json, math, colorsys
from mathutils import Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import w07_common as C
rb = C.rb
OUT = C.WORK + '/g1'
os.makedirs(OUT, exist_ok=True)
SPEC = json.load(open(C.WORK + '/rig_spec.json'))

GROUP_HUE = {'leg1': 0.00, 'leg2': 0.13, 'leg3': 0.33, 'leg4': 0.58, 'leg5': 0.83, 'palp': 0.47, 'head': 0.90,
             'body': 0.10}
BY_NAME = {b['name']: b for b in SPEC['bones']}


def spider_color(name):
    b = BY_NAME.get(name)
    if not b:
        return (0.6, 0.6, 0.6)
    g = b['group']
    if g in ('root', 'socket'):
        return (0.55, 0.55, 0.55)
    if name in ('abdomen_01', 'abdomen_02'):
        return (1.0, 0.55, 0.75) if name == 'abdomen_01' else (0.85, 0.35, 0.95)
    if name == 'cephalothorax':
        return (1.0, 0.85, 0.25)
    h = GROUP_HUE.get(g, 0.0)
    seg = int(name[-2:]) if name[-2:].isdigit() else 1
    v = 1.0 - 0.12 * (seg - 1)
    s = 0.85 if name.startswith('L_') else 0.45
    return colorsys.hsv_to_rgb(h, s, v)


rb.bone_color = spider_color          # runtime rebinding for this process only (rigbatch.py is not modified)

ob, info = C.import_scaled()
me = ob.data
rep, reps = C.weld_map(ob, dist=1e-5)
lab, groups = C.welded_islands(ob, rep)
ORPH = {12, 13}
cols = [(0.95, 0.15, 0.12) if lab[i] in ORPH else (0.80, 0.78, 0.74) for i in range(len(me.vertices))]
rb.set_point_colors(ob, cols, name='g1col')

# armature from the spec
arm = bpy.data.armatures.new('W07_proposal'); rig = bpy.data.objects.new('W07_proposal', arm)
bpy.context.scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode='EDIT')
for b in SPEC['bones']:
    eb = arm.edit_bones.new(b['name']); eb.head = b['head']; eb.tail = b['tail']
    eb.align_roll(Vector(b['z'])); eb.use_deform = b['deform']
for b in SPEC['bones']:
    if b['parent']:
        arm.edit_bones[b['name']].parent = arm.edit_bones[b['parent']]
bpy.ops.object.mode_set(mode='OBJECT')
# roll check: legs' local X should be the hinge axis (normal of the leg plane)
chk = {}
for b in SPEC['bones']:
    bb = arm.bones[b['name']]
    z = bb.matrix_local.to_3x3() @ Vector((0, 0, 1))
    chk[b['name']] = round(math.degrees(z.angle(Vector(b['z']))), 3)
print('roll check: max angle between spec z and bone z (deg):', max(chk.values()))

proxy = rb.bone_proxy(rig, posed=False)
cam = rb.setup_render(1200)
sh = bpy.context.scene.display.shading
lo, hi = rb.frame_box([ob])
VIEWS = {'front': (0, -1, 0), 'left': (1, 0, 0), 'topdown': (0, 0, 1), 'three_quarter': (0.7, -0.7, 0.45), 'back': (0, 1, 0)}
for v, d in VIEWS.items():
    d = Vector(d).normalized(); c = (lo + hi) / 2
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = max((hi - lo).x, (hi - lo).y, (hi - lo).z) * 1.06
    cam.location = c + d * 10; cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
    bpy.context.view_layer.update()
    rb.only_visible([ob]); sh.color_type = 'VERTEX'; sh.show_xray = True; sh.xray_alpha = 0.32
    rb.render_to(f'{OUT}/xr_{v}.png')
    sh.show_xray = False; sh.color_type = 'TEXTURE'
    rb.render_to(f'{OUT}/tex_{v}.png')
    rb.only_visible([proxy]); sh.color_type = 'VERTEX'
    rb.render_to(f'{OUT}/xr_{v}_bones.png')
# close-ups: head (front-left 3/4 and side), fused leg1/leg2 root from below, orphan legs from behind-left
CLOSE = {'head_fq': ((0.0, -0.75, 0.70), 0.85, (0.55, -0.8, 0.25)),
         'head_side': ((0.0, -0.75, 0.68), 0.85, (1, 0, 0)),
         'roots_below': ((0.0, -0.35, 0.60), 1.20, (0.0, -0.25, -1.0)),
         'orphan_bq': ((0.0, 0.90, 0.55), 1.50, (0.75, 0.75, 0.1))}
for nm, (c, size, d) in CLOSE.items():
    d = Vector(d).normalized(); c = Vector(c)
    cam.data.ortho_scale = size; cam.location = c + d * 10; cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
    bpy.context.view_layer.update()
    rb.only_visible([ob]); sh.color_type = 'VERTEX'; sh.show_xray = True; sh.xray_alpha = 0.40
    rb.render_to(f'{OUT}/cu_{nm}.png')
    sh.show_xray = False; sh.color_type = 'TEXTURE'
    rb.render_to(f'{OUT}/cu_{nm}_tex.png')
    rb.only_visible([proxy]); sh.color_type = 'VERTEX'
    rb.render_to(f'{OUT}/cu_{nm}_bones.png')
# orphan + fused-root facts for the brief
me.calc_loop_triangles()
orph_tris = sum(1 for t in me.loop_triangles if lab[t.vertices[0]] in ORPH)
orph_verts = sum(1 for i in range(len(me.vertices)) if lab[i] in ORPH)
C.jdump(OUT + '/facts.json', dict(orphan_tris=orph_tris, orphan_verts_raw=orph_verts, tris=len(me.loop_triangles),
                                  roll_check_max_deg=max(chk.values()), info=info))
print('G1_RENDER_DONE', orph_tris, orph_verts)
