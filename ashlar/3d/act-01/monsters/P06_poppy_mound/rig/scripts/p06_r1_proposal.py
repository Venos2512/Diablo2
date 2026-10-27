"""R1 proposal for G1: landmarks -> runtime bone table -> renders of the expected joints over the mesh.

blender -b --factory-startup -P p06_r1_proposal.py

Writes rig/_work/g1_joints.json (landmarks, flora groups, bone table) and rig/_work/g1_<view>.png + _bones.png +
_labels.json (front, left, topdown, three_quarter). Nothing is saved to a .blend (R2 builds the rig file).
"""
import bpy, os, sys, json, math
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import p06_common as C
from mathutils import Vector

ob, info = C.intake()
cls = C.classify(ob)
L = C.landmarks(ob, cls)
T = C.bone_table(L)
rig = C.build_rig(T)

# mesh checks for the brief
me = ob.data
import bmesh
bm = bmesh.new(); bm.from_mesh(me)
bnd = [e for e in bm.edges if e.is_boundary]
floor_bnd = sum(1 for e in bnd if max(v.co.z for v in e.verts) < 0.03)
down_area = sum(f.calc_area() for f in bm.faces if f.normal.z < -0.7 and f.calc_center_median().z < 0.03)
bm.free()
fl = [dict(id=f['id'], n=f['n'], kind=f['kind'], group=f['group'], attach=[round(x, 3) for x in f['attach']],
           head=[round(x, 3) for x in f['head']], hi_z=round(f['hi'].z, 3), near_frac=round(f['near_frac'], 2))
      for f in cls['flora']]
out = dict(info=info, zmax_body=round(L['zmax'], 3), cap_centre=[round(x, 3) for x in L['cap_centre']],
           crown_top=[round(x, 3) for x in L['crown_top']],
           faces={k: [round(x, 3) for x in v] for k, v in L['faces'].items()},
           blooms={g: dict(base=[round(x, 3) for x in d['base']], head=[round(x, 3) for x in d['head']], ids=d['ids'],
                           leaves=d.get('leaves', []), spawn=[round(x, 3) for x in d['spawn']]) for g, d in L['blooms'].items()},
           mesh=dict(boundary_edges=len(bnd), floor_boundary_edges=floor_bnd, floor_down_area_m2=round(down_area, 3)),
           flora=fl, bones=C.table_json(T))
C.write_json(os.path.join(C.WORK, 'g1_joints.json'), out)

# ---- renders: textured mesh (x-ray) + bone proxy pass + label anchors
C.downscale_textures(1024)
scn = bpy.context.scene
proxy = C.rb.bone_proxy(rig, posed=False, scale=1.6)
cam = C.rb.setup_render(1000)
lo, hi = C.rb.frame_box([ob])
for v in ('front', 'left', 'topdown', 'three_quarter'):
    C.rb.place_camera(cam, lo, hi, v, margin=1.04)
    C.rb.only_visible([ob]); C.rb.shading('TEXTURE', xray=False)
    C.rb.render_to(os.path.join(C.WORK, f'g1_{v}.png'))
    C.rb.only_visible([proxy]); C.rb.shading('VERTEX', xray=False)
    C.rb.render_to(os.path.join(C.WORK, f'g1_{v}_bones.png'))
    labs = []
    for b in rig.data.bones:
        a = b.head_local.lerp(b.tail_local, 0.5) if b.use_deform else b.head_local
        u, w, d = C.project(scn, cam, a)
        labs.append(dict(name=b.name, u=u, v=w, deform=b.use_deform))
    C.write_json(os.path.join(C.WORK, f'g1_{v}_labels.json'), labs)
for o in scn.objects:
    o.hide_render = False
print('R1_PROPOSAL_DONE')
