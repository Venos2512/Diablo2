"""Smock vertices inside the body for one pose (red), rest-inside ones (yellow). Diagnostic, read only.

blender -b --factory-startup rig/U04_charnel_ghoul_rig.blend -P u04_inside.py -- inside <pose> <tag>
"""
import bpy, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import u04_common as C
import u04_qa as Q
rb = C.rb
a = C.argv(); pose, tag = a[1], a[2]
for im in bpy.data.images:
    if im.size[0] > 1024:
        im.scale(1024, 1024)
sm = np.nonzero(Q.role == 'smock')[0]
Q.reset(); base = set(Q.inside_list(Q.posed(), sm))
Q.apply_pose(Q.POSES[pose]); co = Q.posed(); ins = set(Q.inside_list(co, sm))
new = ins - base
by = {}
for i in new:
    b = Q.dominant_bone(i); by[b] = by.get(b, 0) + 1
print('INSIDE', pose, 'rest', len(base), 'pose', len(ins), 'new', len(new), sorted(by.items(), key=lambda t: -t[1])[:8])
cols = []
for i in range(Q.NV):
    if i in new:
        cols.append((1, 0.1, 0.1))
    elif i in base:
        cols.append((1, 0.9, 0.1))
    elif Q.role[i] == 'smock':
        cols.append((0.75, 0.75, 0.75))
    else:
        cols.append((0.35, 0.33, 0.32))
rb.set_point_colors(Q.ob, cols, name='u04_in')
from mathutils import Vector
lo = Vector(co.min(0)); hi = Vector(co.max(0)); c0 = (lo + hi) / 2; sz = max(hi - lo) * 1.1
rb.render_views(os.path.join(C.WORK, f'in_{tag}'), [Q.ob], views=('left', 'right', 'topdown', 'front'), color_type='VERTEX', res=600,
                center=c0, size=sz)
