"""QA helper: open a .blend (or import a .glb), draw the skeleton as red sticks in front of the mesh, render ortho views (Workbench, textured).
blender -b -P qa_overlay.py -- <file.blend|.glb> <out_prefix> [view ...]   views: front side back 34
"""
import bpy, sys, math
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]
path, out = a[0], a[1]
views = a[2:] or ['front', 'side']
bpy.ops.wm.read_factory_settings(use_empty=True)
if path.endswith('.blend'):
    bpy.ops.wm.open_mainfile(filepath=path)
else:
    bpy.ops.import_scene.gltf(filepath=path)
sc = bpy.context.scene
arm = [o for o in bpy.data.objects if o.type == 'ARMATURE']
if arm:
    arm = arm[0]
    cu = bpy.data.curves.new('sticks', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = 0.003
    for pb in arm.pose.bones:
        if pb.parent:
            sp = cu.splines.new('POLY'); sp.points.add(1)
            h0 = arm.matrix_world @ pb.parent.head; h1 = arm.matrix_world @ pb.head
            sp.points[0].co = (*h0, 1); sp.points[1].co = (*h1, 1)
    ob = bpy.data.objects.new('QA_sticks', cu); sc.collection.objects.link(ob)
    mat = bpy.data.materials.new('red'); mat.diffuse_color = (1, 0.1, 0.1, 1); cu.materials.append(mat)
    ob.show_in_front = True
    # joint dots
    cu2 = bpy.data.curves.new('dots', 'CURVE'); cu2.dimensions = '3D'; cu2.bevel_depth = 0.008
    for pb in arm.pose.bones:
        h = arm.matrix_world @ pb.head
        sp = cu2.splines.new('POLY'); sp.points.add(1); sp.points[0].co = (*h, 1); sp.points[1].co = (h.x, h.y, h.z + 0.004, 1)
    ob2 = bpy.data.objects.new('QA_dots', cu2); sc.collection.objects.link(ob2); ob2.show_in_front = True
    m2 = bpy.data.materials.new('yel'); m2.diffuse_color = (1, 0.9, 0.1, 1); cu2.materials.append(m2)
sc.render.engine = 'BLENDER_WORKBENCH'
sh = sc.display.shading; sh.light = 'STUDIO'; sh.color_type = 'TEXTURE'; sh.show_shadows = False
sc.render.resolution_x = sc.render.resolution_y = 1400
sc.view_settings.view_transform = 'Standard'
sc.world = bpy.data.worlds.new('w'); sc.world.color = (0.35, 0.35, 0.38)
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
cam.data.type = 'ORTHO'; cam.data.ortho_scale = 2.3
V = {'front': ((0, -8, 0.9), (math.radians(90), 0, 0)), 'side': ((8, 0, 0.9), (math.radians(90), 0, math.radians(90))),
     'back': ((0, 8, 0.9), (math.radians(90), 0, math.radians(180)))}
for v in views:
    cam.location, cam.rotation_euler = V[v]
    sc.render.filepath = f'{out}_{v}.png'
    bpy.ops.render.render(write_still=True)
