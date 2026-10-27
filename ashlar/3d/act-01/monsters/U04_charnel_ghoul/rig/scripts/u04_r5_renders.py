"""R5 renders for the G2 sheets (read only): runtime skeleton over X-ray mesh, control rig, weight maps by region.

blender -b --factory-startup rig/U04_charnel_ghoul_rig.blend -P u04_r5_renders.py -- r5
Writes rig/qa/raw/g2_*.png (+ bones passes). Pose renders come from u04_qa.py -- poses render.
"""
import bpy, bmesh, os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import u04_common as C
import u04_qa as Q
from mathutils import Vector
rb = C.rb
RAW = os.path.join(C.QA, 'raw'); os.makedirs(RAW, exist_ok=True)
for im in bpy.data.images:
    if im.size[0] > 1024:
        im.scale(1024, 1024)
Q.reset()
ob, rt, ct, S = Q.ob, Q.rt, Q.ct, Q.S
sh = bpy.context.scene.display.shading
PAL = [(1, 0.15, 0.15), (0.15, 0.9, 0.2), (0.2, 0.35, 1), (1, 0.9, 0.1), (1, 0.2, 1), (0.1, 0.95, 0.95), (1, 0.55, 0.1), (1, 1, 1)]
legend = {}


def xray_pass(prefix, views, proxy, center=None, size=None, res=1000):
    cam = rb.setup_render(res); lo, hi = rb.frame_box([ob])
    for v in views:
        rb.place_camera(cam, lo, hi, v, center=center, size=size)
        rb.only_visible([ob]); sh.color_type = 'SINGLE'; sh.single_color = (0.80, 0.78, 0.74); sh.show_xray = True; sh.xray_alpha = 0.22
        rb.render_to(f'{prefix}_{v}.png')
        rb.only_visible([proxy]); rb.shading('VERTEX', xray=False); rb.render_to(f'{prefix}_{v}_bones.png')
    sh.show_xray = False
    for o in bpy.context.scene.objects:
        o.hide_render = False


# 1 runtime skeleton
px = rb.bone_proxy(rt, posed=False, scale=1.0)
xray_pass(os.path.join(RAW, 'g2_skel'), ('front', 'left', 'back', 'topdown'), px)
xray_pass(os.path.join(RAW, 'g2_skel_head'), ('left',), px, center=Vector((0, -0.36 * S, 0.82 * S)), size=0.5 * S, res=800)
bpy.data.objects.remove(px)


# 2 control rig: FK blue, IK/contact yellow, poles magenta, twist aims grey
def ctl_proxy():
    bm = bmesh.new(); cols = []
    for b in ct.data.bones:
        n = b.name; h = b.head_local; t = b.tail_local; L = (t - h).length
        if L < 1e-6:
            continue
        kind = ('pole' if n.endswith('_pole') else 'aim' if n.endswith('_aim') else
                'ik' if any(k in n for k in ('_IK', '_roll', '_target')) else 'fk')
        c = {'fk': (0.25, 0.45, 1.0), 'ik': (1.0, 0.85, 0.1), 'pole': (1.0, 0.2, 0.9), 'aim': (0.6, 0.6, 0.6)}[kind]
        Mb = b.matrix_local.to_3x3(); x = Mb @ Vector((1, 0, 0)); z = Mb @ Vector((0, 0, 1)); y = (t - h) / L
        w = (0.11 if kind != 'fk' else 0.07) * L
        p1 = h + y * (0.15 * L)
        ring = [p1 + x * w, p1 + z * w, p1 - x * w, p1 - z * w]
        vs = [bm.verts.new(h)] + [bm.verts.new(r) for r in ring] + [bm.verts.new(t)]
        for i in range(4):
            bm.faces.new((vs[0], vs[1 + (i + 1) % 4], vs[1 + i])); bm.faces.new((vs[5], vs[1 + i], vs[1 + (i + 1) % 4]))
        cols += [c] * 6
    me = bpy.data.meshes.new('_ctl_proxy'); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new('_ctl_proxy', me); bpy.context.scene.collection.objects.link(o)
    rb.set_point_colors(o, cols)
    return o


cp = ctl_proxy()
xray_pass(os.path.join(RAW, 'g2_ctl'), ('left', 'three_quarter'), cp)
bpy.data.objects.remove(cp)

# 3 weights: all bones blended, then regions with distinct colours
rb.set_point_colors(ob, rb.weight_colors(ob), name='u04_w')
rb.render_views(os.path.join(RAW, 'g2_w_all'), [ob], views=('front', 'left', 'back', 'three_quarter'), color_type='VERTEX', res=900)
REG = {
    'headjaw': (['head', 'jaw', 'neck_02', 'neck', 'chest'], (0, -0.36, 0.80), 0.42, 'left'),
    'shoulder': (['chest', 'L_Clavicle', 'L_UpperArm', 'L_UpperArm_twist', 'spine_02', 'L_ForeArm'], (0.17, -0.14, 0.60), 0.40, 'left'),
    'shoulder_f': (['chest', 'L_Clavicle', 'L_UpperArm', 'L_UpperArm_twist', 'spine_02', 'L_ForeArm'], (0.17, -0.14, 0.60), 0.40, 'front'),
    'torso': (['pelvis', 'spine_01', 'spine_02', 'chest', 'L_Thigh', 'L_Clavicle'], (0.0, 0.05, 0.62), 0.62, 'left'),
    'hip': (['pelvis', 'L_Thigh', 'spine_01', 'L_Calf'], (0.15, 0.27, 0.50), 0.42, 'back'),
    'elbow': (['L_UpperArm', 'L_UpperArm_twist', 'L_ForeArm', 'L_ForeArm_twist', 'L_Hand'], (0.23, -0.14, 0.33), 0.50, 'left'),
    'hand': (['L_ForeArm', 'L_ForeArm_twist', 'L_Hand', 'L_Finger'], (0.26, -0.22, 0.08), 0.28, 'topdown'),
    'leg': (['L_Thigh', 'L_Calf', 'L_Calf_02', 'L_Foot', 'L_Toe', 'pelvis'], (0.17, 0.33, 0.33), 0.70, 'left'),
    'foot': (['L_Calf_02', 'L_Foot', 'L_Toe', 'L_Calf'], (0.17, 0.40, 0.18), 0.36, 'left'),
    'smock': (['smock_front_01', 'smock_front_02', 'L_smock_shoulder_01', 'L_smock_shoulder_02', 'L_smock_flank_01',
               'L_smock_flank_02', 'smock_back_01', 'smock_back_02'], (0.0, 0.05, 0.58), 0.75, 'left'),
    'tie_hood': (['tie_01', 'tie_02', 'neck', 'chest', 'head', 'neck_02'], (0, -0.30, 0.75), 0.45, 'three_quarter'),
}
gi = {g.name: g.index for g in ob.vertex_groups}
for tag, (bones, c, size, view) in REG.items():
    col = {gi[n]: PAL[k % len(PAL)] for k, n in enumerate(bones) if n in gi}
    cols = []
    for v in ob.data.vertices:
        acc = Vector((0.12, 0.12, 0.12))
        for g in v.groups:
            if g.group in col:
                acc += Vector(col[g.group]) * g.weight
        cols.append(tuple(min(x, 1.0) for x in acc))
    rb.set_point_colors(ob, cols, name='u04_w')
    rb.render_closeup(os.path.join(RAW, f'g2_wr_{tag}.png'), [ob], Vector(c) * S, size * S, view, color_type='VERTEX', res=700)
    legend[tag] = [(n, PAL[k % len(PAL)]) for k, n in enumerate(bones)]
C.save_json(os.path.join(RAW, 'g2_legend.json'), legend)
print('R5_RENDERS_DONE')
