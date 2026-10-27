"""Quick weight view of the saved rig: blended bone colours (rigbatch.weight_colors), 4 views + head and shoulder close-ups.

blender -b --factory-startup rig/U04_charnel_ghoul_rig.blend -P u04_wview.py -- <prefix> [bone,bone,...]
"""
import bpy, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import u04_common as C
from mathutils import Vector
rb = C.rb
a = C.argv(); pre = os.path.join(C.WORK, a[0] if a else 'w')
only = set(a[1].split(',')) if len(a) > 1 and a[1] else None
for im in bpy.data.images:
    if im.size[0] > 1024:
        im.scale(1024, 1024)
ob = bpy.data.objects[C.AID]
cols = rb.weight_colors(ob, bones=only)
rb.set_point_colors(ob, cols, name='u04_w')
rb.render_views(pre, [ob], views=('front', 'left', 'back', 'topdown', 'three_quarter'), color_type='VERTEX', res=900)
S = bpy.context.scene['u04_scale']
rb.render_closeup(pre + '_head_left.png', [ob], Vector((0, -0.36 * S, 0.80 * S)), 0.42 * S, 'left', color_type='VERTEX', res=800)
rb.render_closeup(pre + '_head_front.png', [ob], Vector((0, -0.36 * S, 0.80 * S)), 0.42 * S, 'front', color_type='VERTEX', res=800)
rb.render_closeup(pre + '_shoulder_front.png', [ob], Vector((0.18 * S, -0.12 * S, 0.62 * S)), 0.36 * S, 'front', color_type='VERTEX', res=800)
rb.render_closeup(pre + '_hip_left.png', [ob], Vector((0.15 * S, 0.25 * S, 0.50 * S)), 0.40 * S, 'left', color_type='VERTEX', res=800)
print('WVIEW_DONE')
