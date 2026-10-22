"""QA: skin-weight heat maps rendered on the re-imported GLB.
blender -b --factory-startup -P qa_weights.py -- <rigged.glb> <out_dir>
Writes <out_dir>/weights_<bone>.png (0 = blue ... 1 = red, front view) and weights_dominant_<view>.png (hash colour per dominant bone)."""
import bpy, sys, os, math, colorsys, hashlib
import numpy as np
glb, out = sys.argv[sys.argv.index('--') + 1:][:2]
os.makedirs(out, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
mesh = [o for o in bpy.data.objects if o.type == 'MESH' and o.vertex_groups][0]
for o in list(bpy.data.objects):
    if o.name.startswith('Icosphere'):
        bpy.data.objects.remove(o)
me = mesh.data
n = len(me.vertices)
names = {vg.index: vg.name for vg in mesh.vertex_groups}
W = {}
for v in me.vertices:
    for g in v.groups:
        W.setdefault(names[g.group], np.zeros(n))[v.index] = g.weight
sc = bpy.context.scene
sc.render.engine = 'BLENDER_WORKBENCH'
sh = sc.display.shading
sh.light = 'FLAT'; sh.color_type = 'VERTEX'; sh.show_shadows = False
sc.render.resolution_x, sc.render.resolution_y = 900, 1100
sc.view_settings.view_transform = 'Standard'
sc.world = bpy.data.worlds.new('w'); sc.world.color = (0.22, 0.22, 0.25)
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
cam.data.type = 'ORTHO'; cam.data.ortho_scale = 2.6
V = {'front': ((0, -9, 0.95), (math.radians(90), 0, 0)), 'back': ((0, 9, 0.95), (math.radians(90), 0, math.radians(180))),
     'side': ((9, 0, 0.95), (math.radians(90), 0, math.radians(90)))}
attr = me.color_attributes.new('QA', 'FLOAT_COLOR', 'POINT')
# loop colour attributes are used by Workbench; POINT domain works for vertex colour display
def setcol(arr):
    flat = np.concatenate([arr, np.ones((n, 1))], axis=1).ravel()
    attr.data.foreach_set('color', flat)
    me.update()
def render(name, view):
    cam.location, cam.rotation_euler = V[view]
    sc.render.filepath = os.path.join(out, name).replace(chr(92), '/')
    bpy.ops.render.render(write_still=True)
def heat(w):
    r = np.clip(2 * w, 0, 1); b = np.clip(2 * (1 - w), 0, 1); g = 1 - np.abs(2 * w - 1)
    return np.stack([r, g * 0.9, b], axis=1)
for b in ['spine_01', 'chest', 'neck', 'head', 'L_Clavicle', 'L_UpperArm', 'L_ForeArm', 'L_Wrist', 'L_Thigh', 'L_Calf', 'L_Foot',
          'front_skirt_front_skirt_02', 'front_skirt_front_skirt_05', 'L_side_skirt_side_skirt_03', 'R_skirt_03', 'pelvis']:
    if b in W:
        setcol(heat(W[b]))
        render('weights_%s_front.png' % b, 'front')
cols = {}
for b in W:
    h = int(hashlib.md5(b.encode()).hexdigest()[:6], 16) / 0xFFFFFF
    cols[b] = np.array(colorsys.hsv_to_rgb(h, 0.85, 0.95))
C = np.zeros((n, 3))
for b, w in W.items():
    C += w[:, None] * cols[b][None, :]
setcol(C)
for v in ('front', 'back', 'side'):
    render('weights_dominant_%s.png' % v, v)
