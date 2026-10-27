"""Per-appendage close-ups for joint picking: each leg / palp / fang of the +X side rendered alone, camera
perpendicular to its vertical plane (textured, and flat with the 3-/4-segment fit points as markers).

blender -b --factory-startup -P w07_r1_legviews.py
Reads rig/_work/legs.json (w07_legs.py). Writes rig/_work/lv_<name>_{tex,fit}.png + _lv.json (camera frames).
"""
import bpy, bmesh, os, sys, json, math
from mathutils import Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import w07_common as C
rb = C.rb

ob, info = C.import_scaled()
me = ob.data
rep, reps = C.weld_map(ob, dist=1e-5)
LJ = json.load(open(C.WORK + '/legs.json'))


def part_object(name, vert_reps):
    S = set(vert_reps)
    keep = [i for i in range(len(me.vertices)) if rep[i] in S]
    K = set(keep)
    bm = bmesh.new(); bm.from_mesh(me); bm.verts.ensure_lookup_table()
    dead = [v for v in bm.verts if v.index not in K]
    bmesh.ops.delete(bm, geom=dead, context='VERTS')
    m2 = bpy.data.meshes.new('p_' + name); bm.to_mesh(m2); bm.free()
    for mat in me.materials:
        m2.materials.append(mat)
    o = bpy.data.objects.new('p_' + name, m2); bpy.context.scene.collection.objects.link(o)
    return o


def marker(p, r, col, name):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=p, segments=12, ring_count=8)
    o = bpy.context.active_object; o.name = name
    o.color = (col[0], col[1], col[2], 1.0)
    return o


cam = rb.setup_render(1000)
out = {}
for name in ('Leg1', 'Leg2', 'Leg3', 'Leg4', 'orphan', 'palp', 'fang'):
    L = LJ[name]
    po = part_object(name, L['verts'])
    root = Vector(L['bands'][-1]['c']); tip = Vector(L['tip'])
    h = tip - root; h.z = 0; h.normalize()
    nrm = h.cross(Vector((0, 0, 1)))
    if nrm.y > 0:
        nrm = -nrm                  # camera on the -Y (front) side of the leg plane
    if name in ('palp', 'fang'):
        nrm = Vector((1, 0, 0))     # small head parts: plain side view from +X
    pts = [po.matrix_world @ v.co for v in po.data.vertices]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    c = (lo + hi) / 2; size = max((hi - lo).length * 0.80, 0.25)
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = size; cam.data.clip_start = 0.001; cam.data.clip_end = 100
    cam.location = c + nrm * 8; cam.rotation_euler = (-nrm).to_track_quat('-Z', 'Y').to_euler()
    bpy.context.view_layer.update()
    mk = []
    r = size * 0.012
    for k, col in (('3', (0.1, 0.85, 1.0)), ('4', (1.0, 0.25, 0.6))):
        if k in L['fits']:
            for j, p in enumerate(L['fits'][k]['pts']):
                q = Vector(p)
                if k == '4':
                    q = q + nrm * 0.002
                mk.append(marker(q, r if k == '3' else r * 0.7, col, f'mk_{name}_{k}_{j}'))
    rb.only_visible([po]); rb.shading('TEXTURE')
    rb.render_to(f'{C.WORK}/lv_{name}_tex.png')
    rb.only_visible([po] + mk); sh = bpy.context.scene.display.shading
    sh.color_type = 'OBJECT'; po.color = (0.78, 0.76, 0.72, 1.0); sh.show_xray = True; sh.xray_alpha = 0.55
    rb.render_to(f'{C.WORK}/lv_{name}_fit.png')
    sh.show_xray = False
    # pixel <- world mapping for picking (u right, v up, metres; origin = camera centre)
    R = cam.matrix_world.to_3x3()
    out[name] = dict(center=list(c), right=list(R @ Vector((1, 0, 0))), up=list(R @ Vector((0, 1, 0))),
                     view=list(-nrm), ortho=size, res=1000)
    for o in mk + [po]:
        bpy.data.objects.remove(o)
C.jdump(C.WORK + '/lv_frames.json', out)
print('LEGVIEWS_DONE')
