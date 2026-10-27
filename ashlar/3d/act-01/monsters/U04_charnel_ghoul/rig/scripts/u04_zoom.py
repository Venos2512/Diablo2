"""Close-up diagnostics: one pose of u04_qa.POSES around a point: textured, stretch heat, weights of chosen bones.

blender -b --factory-startup rig/U04_charnel_ghoul_rig.blend -P u04_zoom.py -- zoom <pose> <cx,cy,cz Tripo> <size Tripo> <view> <tag> [bones]
Writes rig/_work/z_<tag>_{tex,heat,w}.png. Read only.
"""
import bpy, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import u04_common as C
import u04_qa as Q                      # mode 'zoom': only the helpers and the pose library are set up
from mathutils import Vector
rb = C.rb
a = C.argv()
pose, cen, size, view, tag = a[1], [float(x) for x in a[2].split(',')], float(a[3]), a[4], a[5]
bones = a[6].split(',') if len(a) > 6 and a[6] else None
PAL = [(1, 0.15, 0.15), (0.15, 0.9, 0.2), (0.2, 0.35, 1), (1, 0.9, 0.1), (1, 0.2, 1), (0.1, 0.95, 0.95), (1, 0.55, 0.1), (1, 1, 1)]
for im in bpy.data.images:
    if im.size[0] > 1024:
        im.scale(1024, 1024)
Q.apply_pose(Q.POSES[pose])
ob = Q.ob; S = Q.S; c = Vector(cen) * S; sz = size * S
pre = os.path.join(C.WORK, f'z_{tag}')
rb.render_closeup(pre + '_tex.png', [ob], c, sz, view, color_type='TEXTURE', res=700)
rb.set_point_colors(ob, rb.stretch_colors(ob), name='u04_st')
rb.render_closeup(pre + '_heat.png', [ob], c, sz, view, color_type='VERTEX', res=700)
if bones:
    gi = {g.name: g.index for g in ob.vertex_groups}; col = {gi[n]: PAL[k % len(PAL)] for k, n in enumerate(bones) if n in gi}
    cols = []
    for v in ob.data.vertices:
        acc = Vector((0.12, 0.12, 0.12))
        for g in v.groups:
            if g.group in col:
                acc += Vector(col[g.group]) * g.weight
        cols.append(tuple(min(x, 1.0) for x in acc))
    print('LEGEND', [(n, PAL[k % len(PAL)]) for k, n in enumerate(bones)])
else:
    cols = rb.weight_colors(ob)
rb.set_point_colors(ob, cols, name='u04_w')
rb.render_closeup(pre + '_w.png', [ob], c, sz, view, color_type='VERTEX', res=700)
print('ZOOM_DONE', pre)
