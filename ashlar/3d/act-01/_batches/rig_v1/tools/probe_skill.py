"""Feasibility probe (R1, throwaway): can the blender-character-rigging skill run headless here?

blender -b --factory-startup -P probe_skill.py -- <glb> <out_dir> <work_height_m>

Imports the GLB (merge_vertices=True), scales it to the working height, then runs the skill's
measure_landmarks + build_body_skeleton + a crude body weighting on the WHOLE mesh (no part split,
no cloth), poses a few TEST_POSES and reports stretch + renders X-ray front/side. Nothing is saved
next to the asset; outputs go to <out_dir>.
"""
import bpy, sys, os, json, math
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
GLB, OUT, HW = argv[0], argv[1], float(argv[2])
STEM = os.path.splitext(os.path.basename(GLB))[0]
os.makedirs(OUT, exist_ok=True)
for p in (os.path.expanduser(r'~/.claude/skills/blender-character-rigging/scripts'),):
    if os.path.isdir(p):
        sys.path.insert(0, p)
sys.modules.pop('rig_core', None)
import rig_core as rc

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB, merge_vertices=True)
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
for o in meshes:
    M = o.matrix_world.copy(); o.parent = None; o.data.transform(M); o.matrix_world.identity()
for o in [o for o in bpy.data.objects if o.type != 'MESH']:
    bpy.data.objects.remove(o)
ob = meshes[0]; ob.name = STEM + '_Body'
me = ob.data
zs = [v.co.z for v in me.vertices]; H0 = max(zs) - min(zs)
s = HW / H0
me.transform(__import__('mathutils').Matrix.Scale(s, 4))
V = [v.co for v in me.vertices]
cx = (min(p.x for p in V) + max(p.x for p in V)) / 2; z0 = min(p.z for p in V)
for v in me.vertices:
    v.co.x -= cx; v.co.z -= z0
me.update()
_, isl = rc.islands(ob)
rep = dict(asset=STEM, verts=len(me.vertices), islands=len(isl), scale=s, H0=H0)
print('verts', len(me.vertices), 'islands', len(isl), 'scale', s)
rc.symmetry_report(ob)
L = rc.measure_landmarks(ob, None, verbose=True)
rep['notes'] = L['_notes']; rep['heads'] = L['_heads']
rig = rc.build_body_skeleton(STEM + '_Rig', L)
rc.bind(ob, rig)
# crude arm mask: lateral of the shoulder joint, above the hips
sh = rig.data.bones['L_UpperArm'].head_local
arm = lambda i: abs(me.vertices[i].co.x) > abs(sh.x) - 0.04 and me.vertices[i].co.z > sh.z - 0.35
rc.body_weights(ob, rig, arm)
rep['health'] = rc.weight_health(ob, rig)
st = {}
for name, spec in rc.TEST_POSES.items():
    rc.apply_pose(rig, spec)
    st[name] = rc.stretch_report(ob, top=0)
rc.clear_pose(rig); bpy.context.view_layer.update()
rep['stretch'] = st
print('STRETCH', st)

# renders: X-ray-ish (mesh semi-transparent via Workbench xray) front + side, and the walk pose
scn = bpy.context.scene
scn.render.engine = 'BLENDER_WORKBENCH'; scn.render.resolution_x = scn.render.resolution_y = 720
scn.display.shading.light = 'STUDIO'; scn.display.shading.color_type = 'TEXTURE'
scn.display.shading.show_xray = True; scn.display.shading.xray_alpha = 0.55
scn.view_settings.view_transform = 'Standard'
rig.data.display_type = 'OCTAHEDRAL'; rig.show_in_front = True
cam_d = bpy.data.cameras.new('cam'); cam_d.type = 'ORTHO'
cam = bpy.data.objects.new('cam', cam_d); scn.collection.objects.link(cam); scn.camera = cam
cam_d.ortho_scale = max(HW, max(abs(p.x) for p in V) * 2) * 1.1
views = {'front': ((0, -20, HW / 2), (math.radians(90), 0, 0)), 'side': ((20, 0, HW / 2), (math.radians(90), 0, math.radians(90)))}
for pose in ('rest', 'walk', 'arms_down'):
    if pose != 'rest':
        rc.apply_pose(rig, rc.TEST_POSES[pose])
    else:
        rc.clear_pose(rig)
    bpy.context.view_layer.update()
    for vn, (loc, rot) in views.items():
        cam.location = loc; cam.rotation_euler = rot
        scn.render.filepath = os.path.join(OUT, f'{STEM}_{pose}_{vn}.png')
        bpy.ops.render.render(write_still=True)
rc.clear_pose(rig)
with open(os.path.join(OUT, STEM + '_probe.json'), 'w') as f:
    json.dump(rep, f, indent=1, default=str)
print('PROBE_DONE')
