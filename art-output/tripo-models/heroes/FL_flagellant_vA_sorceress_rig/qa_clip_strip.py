"""QA: render frames of the authored QA clips from the .blend (textured) as contact-sheet inputs.
blender -b --factory-startup -P qa_clip_strip.py -- <rig.blend> <out_dir>"""
import bpy, sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
path, out = sys.argv[sys.argv.index('--') + 1:][:2]
os.makedirs(out, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=path)
sc = bpy.context.scene
arm = bpy.data.objects['FL_flagellant_vA_rig']
sc.render.engine = 'BLENDER_WORKBENCH'
sh = sc.display.shading; sh.light = 'STUDIO'; sh.color_type = 'TEXTURE'; sh.show_shadows = False
sc.render.resolution_x, sc.render.resolution_y = 900, 1100
sc.view_settings.view_transform = 'Standard'
sc.world = bpy.data.worlds.new('w'); sc.world.color = (0.35, 0.35, 0.38)
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
cam.data.type = 'ORTHO'; cam.data.ortho_scale = 2.6
V = {'front': ((0, -9, 0.95), (math.radians(90), 0, 0)), 'side': ((9, 0, 0.95), (math.radians(90), 0, math.radians(90)))}
FR = {'QA_walk': [0, 4, 8, 12, 16, 20, 24, 28], 'QA_arm_swing': [0, 6, 12, 18, 24, 30], 'QA_idle': [0, 12, 24, 36]}
for clip, frames in FR.items():
    arm.animation_data.action = bpy.data.actions[clip]
    for f in frames:
        sc.frame_set(f + 2)
        sc.frame_set(f + 1)          # step away and back so the first frame is really evaluated
        bpy.context.view_layer.update()
        for v, (loc, rot) in V.items():
            cam.location, cam.rotation_euler = loc, rot
            sc.render.filepath = os.path.join(out, 'pose_%s_f%02d_%s.png' % (clip, f, v)).replace(chr(92), '/')
            bpy.ops.render.render(write_still=True)
