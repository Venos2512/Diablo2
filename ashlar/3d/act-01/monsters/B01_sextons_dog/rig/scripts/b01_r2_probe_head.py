"""B01 R2 probe: textured close-ups of the muzzle (side, front, below) for the mouth line, and ear-flap numbers.

blender -b --factory-startup -P b01_r2_probe_head.py
Writes rig/_work/hp_*.png (+ _cam.json for metric grids) and rig/_work/head_probe.json.
"""
import bpy, sys, os, math, json
from mathutils import Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import b01_common as C
C.tools_path()
import rigbatch as rb

C.texture_limit(2048)
ob, info = C.intake()
me = ob.data
cam = rb.setup_render(1400)
bpy.context.scene.render.film_transparent = False
bpy.context.scene.world = bpy.data.worlds.new('w')
lo, hi = rb.frame_box([ob])
for tag, view, c, size in (('muzzle_left', 'left', (0.1, -0.95, 0.80), 0.36), ('muzzle_front', 'front', (0, -0.95, 0.82), 0.40),
                           ('head_left', 'left', (0.1, -0.86, 0.88), 0.50), ('head_front', 'front', (0, -0.86, 0.88), 0.62)):
    rb.place_camera(cam, lo, hi, view, center=Vector(c), size=size)
    rb.shading('TEXTURE'); rb.render_to(os.path.join(C.WORK, f'hp_{tag}.png'))
# from below, looking up (+Z): image up = -Y (nose up), right = +X
cd = cam.data; cd.type = 'ORTHO'; cd.ortho_scale = 0.45
cam.location = (0, -0.92, -2.0); cam.rotation_euler = (math.pi, 0, 0)
rb.shading('TEXTURE'); rb.render_to(os.path.join(C.WORK, 'hp_muzzle_below.png'))

# ear-flap numbers: head-region vertices by |x| band and normal direction
V = me.vertices; out = {}
for lo_x, hi_x in ((0.15, 0.17), (0.17, 0.185), (0.185, 0.20), (0.20, 0.23), (0.23, 0.32)):
    S = [v for v in V if lo_x <= v.co.x < hi_x and -0.97 < v.co.y < -0.74 and 0.66 < v.co.z < 1.06]
    if not S:
        continue
    inward = [v for v in S if v.normal.x < -0.3]
    out[f'{lo_x:.3f}-{hi_x:.3f}'] = dict(n=len(S), inward=len(inward),
                                          y=[round(min(v.co.y for v in S), 3), round(max(v.co.y for v in S), 3)],
                                          z=[round(min(v.co.z for v in S), 3), round(max(v.co.z for v in S), 3)])
E = [v.co for v in V if v.co.x >= 0.19 and -0.97 < v.co.y < -0.74 and 0.66 < v.co.z < 1.06]
cen = sum(E, Vector()) / len(E)
out['ear_x>=0.19'] = dict(n=len(E), centroid=[round(c, 4) for c in cen],
                          y=[round(min(p.y for p in E), 3), round(max(p.y for p in E), 3)],
                          z=[round(min(p.z for p in E), 3), round(max(p.z for p in E), 3)],
                          top_band=[round(c, 4) for c in (sum((p for p in E if p.z > max(q.z for q in E) - 0.05), Vector())
                                                         / max(1, sum(1 for p in E if p.z > max(q.z for q in E) - 0.05)))],
                          bottom_band=[round(c, 4) for c in (sum((p for p in E if p.z < min(q.z for q in E) + 0.05), Vector())
                                                            / max(1, sum(1 for p in E if p.z < min(q.z for q in E) + 0.05)))])
C.jdump(os.path.join(C.WORK, 'head_probe.json'), out)
print(json.dumps(out, indent=1))
print('B01_HEADPROBE_DONE')
