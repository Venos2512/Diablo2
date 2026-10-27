"""W02 R1: orthographic close-ups with texture and with island colours (camera sidecars for grids / overlays).

blender -b --factory-startup -P w02_r1_closeups.py -- <glb> <out_dir> <scale> [name:cx,cy,cz:size:view1/view2 ...]
Without shot arguments renders the default set (head, foot, wing root, tail).
"""
import bpy, sys, os
from mathutils import Vector, Matrix

TOOLS = r'D:/Claude/Diablo2/ashlar/3d/act-01/_batches/rig_v1/tools'
sys.path.insert(0, TOOLS)
import rigbatch as rb

argv = sys.argv[sys.argv.index('--') + 1:]
GLB, OUT, S = argv[0], argv[1], float(argv[2])
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
lab, isl = rb._islands(ob)
sizes = sorted(range(len(isl)), key=lambda k: -len(isl[k]))
main = sizes[0]
cols = [(0.78, 0.55, 0.5) if lab[i] == main else rb.golden_color(lab[i], 0.65, 0.95) for i in range(len(ob.data.vertices))]
rb.set_point_colors(ob, cols, 'isl')
shots = [('head', (0, -0.33, 0.49), 0.28, ('front', 'left', 'top')),
         ('foot', (0.14, -0.13, 0.10), 0.36, ('front', 'left')),
         ('wingroot', (0.14, -0.15, 0.45), 0.42, ('front', 'back', 'left', 'top')),
         ('tail', (0, 0.22, 0.32), 0.50, ('left', 'back', 'topdown'))]
if len(argv) > 3:
    shots = []
    for a in argv[3:]:
        n, c, sz, vs = a.split(':')
        shots.append((n, tuple(float(x) for x in c.split(',')), float(sz), tuple(vs.split('/'))))
for name, c, size, views in shots:
    for v in views:
        for ct, tag in (('TEXTURE', 'tex'), ('VERTEX', 'isl')):
            rb.render_closeup(os.path.join(OUT, f'cu_{name}_{v}_{tag}.png'), [ob], Vector(c), size, view=v, color_type=ct, res=800)
print('CLOSEUPS_OK')
