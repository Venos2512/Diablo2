"""P04 Hive-Sleeper, R1 (G1 proposal): build the PROPOSED runtime skeleton on the scaled mesh and render it.

blender -b --factory-startup -P p02_propose.py -- <out_dir>

Nothing is saved as .blend; output: <out_dir>/prop_*.png (+ bone passes, camera sidecars), joints.json (world, m)
and <rig>/_work/proposal_bones.json (bone table for the brief).
"""
import bpy, sys, os, json
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import p04_common as C
sys.path.insert(0, C.TOOLS)
import rigbatch as rb

OUT = sys.argv[sys.argv.index('--') + 1]
os.makedirs(OUT, exist_ok=True)
ob = C.import_scaled(bpy)
V = [v.co for v in ob.data.vertices]
lo = Vector((min(p.x for p in V), min(p.y for p in V), min(p.z for p in V)))
hi = Vector((max(p.x for p in V), max(p.y for p in V), max(p.z for p in V)))
print('scaled bbox', tuple(round(c, 4) for c in lo), tuple(round(c, 4) for c in hi), 'S', round(C.S, 5))

T = C.bone_table()
rig = C.build_armature(bpy, 'P04_proposal', T)
joints = {b['name']: [list(b['head']), list(b['tail']), b['kind'], b['deform']] for b in T}
json.dump(dict(S=C.S, bbox=[list(lo), list(hi)], bones=joints), open(os.path.join(OUT, 'joints.json'), 'w'), indent=1)
table = [dict(name=b['name'], parent=b['parent'], kind=b['kind'], deform=b['deform'],
              head=[round(c, 3) for c in b['head']], tail=[round(c, 3) for c in b['tail']],
              length=round((b['tail'] - b['head']).length, 3)) for b in T]
json.dump(dict(S=C.S, top_m=C.TOP_M, landmarks_m=C.landmarks_real(), bones=table,
               counts=dict(total=len(T), deform=sum(1 for b in T if b['deform']),
                           sockets=sum(1 for b in T if b['kind'] == 'socket'))),
          open(os.path.join(C.WORK, 'proposal_bones.json'), 'w'), indent=1)
print('bones', len(T), 'deform', sum(1 for b in T if b['deform']))

proxy = rb.bone_proxy(rig, posed=False, scale=1.6)
cam = rb.setup_render(1100)
sh = bpy.context.scene.display.shading
rb.VIEW_DIRS['three_quarter'] = (0.75, -0.65, 0.35)
for v in ('front', 'left', 'top', 'three_quarter'):
    rb.place_camera(cam, lo, hi, v)
    rb.only_visible([ob]); sh.color_type = 'TEXTURE'; sh.show_xray = True; sh.xray_alpha = 0.55
    rb.render_to(os.path.join(OUT, f'prop_{v}.png'))
    rb.only_visible([proxy]); rb.shading('VERTEX', xray=False)
    rb.render_to(os.path.join(OUT, f'prop_{v}_bones.png'))
for o in bpy.context.scene.objects:
    o.hide_render = False
print('PROPOSE_DONE')
