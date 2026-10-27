"""W02 R1: slab renders (orthographic camera with a 2 cm clip window) to read joint centres inside the mesh.

blender -b --factory-startup -P w02_r1_sections.py -- <glb> <out_dir> <scale> <spec> [<spec> ...]
  spec: x=<value> (seen from +X) | z=<value> (seen from above) | y=<value> (seen from the front, -Y)
        optional @<window m>[@<u>,<v>] (centre on the two other axes), e.g. y=-0.40@0.12@0,0.45
Each slab is rendered at 800 px with a fixed 0.9 m (x, y slabs) / 1.7 m (z slabs) window and a _cam.json sidecar
(rigbatch.render_to) so tools/compose.py gridlines can draw a metric grid.
"""
import bpy, sys, os
from mathutils import Vector, Matrix

TOOLS = r'D:/Claude/Diablo2/ashlar/3d/act-01/_batches/rig_v1/tools'
sys.path.insert(0, TOOLS)
import rigbatch as rb

argv = sys.argv[sys.argv.index('--') + 1:]
GLB, OUT, S = argv[0], argv[1], float(argv[2]); SPECS = argv[3:]
os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
rb.prefs()
bpy.ops.import_scene.gltf(filepath=GLB, merge_vertices=True)
ob = next(o for o in bpy.data.objects if o.type == 'MESH')
M = ob.matrix_world.copy(); ob.parent = None; ob.data.transform(M); ob.matrix_world.identity()
for o in [o for o in bpy.data.objects if o.type != 'MESH']:
    bpy.data.objects.remove(o)
ob.data.transform(Matrix.Scale(S, 4)); ob.data.update()
for im in bpy.data.images:
    if im.size[0] > 1024:
        im.scale(1024, 1024)
cam = rb.setup_render(800)
rb.shading('TEXTURE')
sh = bpy.context.scene.display.shading
sh.show_backface_culling = False
D = 2.0; HALF = 0.01
for spec in SPECS:
    ax, rest = spec.split('='); parts = rest.split('@'); val = float(parts[0])
    if ax == 'x':
        loc = Vector((val + D, -0.05, 0.42)); d = Vector((-1, 0, 0)); size = 0.9
    elif ax == 'y':
        loc = Vector((0.0, val - D, 0.42)); d = Vector((0, 1, 0)); size = 1.7
    else:
        loc = Vector((0.0, -0.05, val + D)); d = Vector((0, 0, -1)); size = 1.7
    if len(parts) > 1:                      # optional window size and centre: x=0.1@0.2@<u>,<v> (u, v = the two other axes)
        size = float(parts[1])
        if len(parts) > 2:
            u, v = (float(t) for t in parts[2].split(','))
            if ax == 'x':
                loc.y, loc.z = u, v
            elif ax == 'y':
                loc.x, loc.z = u, v
            else:
                loc.x, loc.y = u, v
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = size
    cam.data.clip_start = D - HALF; cam.data.clip_end = D + HALF
    cam.location = loc; cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    rb.render_to(os.path.join(OUT, f'sec_{ax}{val:+.3f}' + ('_w%.2f' % size if len(parts) > 1 else '') + '.png'))
print('SECTIONS_OK', len(SPECS))
