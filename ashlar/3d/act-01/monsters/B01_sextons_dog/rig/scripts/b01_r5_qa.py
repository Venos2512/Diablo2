"""B01 R5: QA numbers + renders on the saved rig (headless Workbench, textures clamped to 1024).

blender -b --factory-startup rig/B01_sextons_dog_rig.blend -P b01_r5_qa.py -- <tag> [quick|full]

quick: test poses -> numbers + one textured view and one stretch-heat view per pose (rig/_work/qa_<tag>/).
full : + three views per pose, skeleton overlay (runtime, labelled positions), control rig overlay, weight maps.
Numbers -> rig/_work/qa_<tag>.json. Nothing is saved into the .blend.
"""
import bpy, bmesh, sys, os, math, json, time
import numpy as np
from mathutils import Vector, Matrix, kdtree
from mathutils.bvhtree import BVHTree
from bpy_extras.object_utils import world_to_camera_view

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import b01_common as C
import b01_poses as PO
C.tools_path()
import rigbatch as rb

argv = sys.argv[sys.argv.index('--') + 1:]
TAG = argv[0]; MODE = argv[1] if len(argv) > 1 else 'quick'
OUT = os.path.join(C.WORK, f'qa_{TAG}'); os.makedirs(OUT, exist_ok=True)
C.texture_limit(1024)
t0 = time.time()
ob = bpy.data.objects[C.AID]; rt = bpy.data.objects['B01_runtime']; cr = bpy.data.objects['B01_control']
scn = bpy.context.scene; vl = bpy.context.view_layer
me = ob.data
REST = np.array([v.co[:] for v in me.vertices])

# ---- regions for checks (rest positions)
islands_lab, isl = rb._islands(ob)
sizes = sorted(((len(c), k) for k, c in enumerate(isl)), reverse=True)
body_k = sizes[0][1]; collar_k = sizes[1][1]
body_idx = np.array(isl[body_k]); collar_idx = np.array(isl[collar_k])
PAWS = {}
for s, sx in (('L', 1), ('R', -1)):
    for end, cond in (('front', REST[:, 1] < 0.0876), ('hind', REST[:, 1] >= 0.0876)):
        m = cond & (sx * REST[:, 0] > 0) & (REST[:, 2] < 0.03)
        PAWS[f'{s}_{end}'] = np.flatnonzero(m)


def evaluated():
    dg = bpy.context.evaluated_depsgraph_get(); ev = ob.evaluated_get(dg).to_mesh()
    P = np.array([v.co[:] for v in ev.vertices]); ob.evaluated_get(dg).to_mesh_clear()
    return P


def body_bvh(P):
    bm = bmesh.new(); bm.from_mesh(me); bm.verts.ensure_lookup_table()
    for v in bm.verts:
        v.co = Vector(P[v.index])
    keep = set(body_idx.tolist())
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.index not in keep], context='VERTS')
    t = BVHTree.FromBMesh(bm); bm.free()
    return t


DIRS = [Vector((0.31, 0.53, 0.79)).normalized(), Vector((-0.62, 0.21, -0.75)).normalized(), Vector((0.11, -0.97, 0.2)).normalized()]


def inside(tree, p):
    votes = 0
    for d in DIRS:
        n = 0; q = Vector(p)
        for _ in range(48):
            hit = tree.ray_cast(q, d)
            if hit[0] is None:
                break
            n += 1; q = hit[0] + d * 1e-5
        votes += n % 2
    return votes >= 2


def collar_inside(P):
    tree = body_bvh(P)
    sub = collar_idx[::3]
    return int(sum(1 for i in sub if inside(tree, P[i]))), len(sub)


REST_COLLAR_IN = collar_inside(REST)[0]


def edge_numbers():
    w, bad, dw, dm = rb.edge_stats(ob, 0.004)
    return dict(stretch=w, bad_edges=bad, worst_dlen_mm=dw, max_dlen_mm=dm)


def contact(P, planted):
    out = {}
    for k, idx in PAWS.items():
        z = P[idx, 2]
        out[k] = dict(min_z_mm=round(1000 * float(z.min()), 1), planted=k in planted)
    ok = all(abs(out[k]['min_z_mm']) <= 10 for k in planted) and all(v['min_z_mm'] >= -10 for v in out.values())
    return out, ok


def render_pose(name, views, heat=True, res=760):
    cam = rb.setup_render(res)
    lo, hi = rb.frame_box([ob]); lo = Vector((min(lo.x, -0.45), min(lo.y, -1.25), 0.0)); hi = Vector((max(hi.x, 0.45), max(hi.y, 1.15), max(hi.z, 1.35)))
    size = max(hi.x - lo.x, hi.y - lo.y, hi.z - lo.z) * 1.04
    c = (lo + hi) / 2
    for v in views:
        rb.place_camera(cam, lo, hi, v, center=c, size=size)
        rb.only_visible([ob]); rb.shading('TEXTURE'); rb.render_to(os.path.join(OUT, f'pose_{name}_{v}.png'))
    if heat:
        rb.set_point_colors(ob, rb.stretch_colors(ob, 0.8, 1.6), name='rb_heat')
        rb.place_camera(cam, lo, hi, views[0], center=c, size=size)
        rb.only_visible([ob]); rb.shading('VERTEX'); rb.render_to(os.path.join(OUT, f'pose_{name}_{views[0]}_heat.png'))
        rb.clear_point_colors(ob, name='rb_heat')
    for o in scn.objects:
        o.hide_render = False


VIEWS = {'step_diag': ('left', 'front', 'three_quarter'), 'sit': ('left', 'three_quarter', 'back'),
         'sniff': ('left', 'front', 'three_quarter'), 'look_back': ('top_q', 'front', 'three_quarter'),
         'tail_wag': ('back', 'left', 'top_q'), 'jaw_open': ('head_l', 'head_f', 'three_quarter'),
         'reach_front': ('left', 'front', 'three_quarter'), 'kick_back': ('left', 'back', 'three_quarter'),
         'bend_side': ('top_q', 'front', 'three_quarter'), 'arch': ('left', 'front', 'three_quarter'),
         'pounce': ('left', 'front', 'three_quarter'), 'ears_ring': ('head_f', 'head_l', 'three_quarter'),
         'rest': ('left', 'front', 'three_quarter')}
rb.VIEW_DIRS['top_q'] = (0.0, 0.15, 1.0)
rb.VIEW_DIRS['head_l'] = (1, 0, 0); rb.VIEW_DIRS['head_f'] = (0, -1, 0)


def render_views(name, views, heat):
    head_views = [v for v in views if v.startswith('head_')]
    body_views = [v for v in views if not v.startswith('head_')]
    if body_views:
        render_pose(name, body_views if MODE == 'full' else body_views[:1], heat=heat)
    if head_views:
        cam = rb.setup_render(700)
        dg_c = Vector((0, -0.88, 0.85))
        for hv in (head_views if MODE == 'full' else head_views[:1]):
            rb.place_camera(cam, Vector((-1, -1, -1)), Vector((1, 1, 1)), hv, center=dg_c, size=0.62)
            rb.only_visible([ob]); rb.shading('TEXTURE'); rb.render_to(os.path.join(OUT, f'pose_{name}_{hv}.png'))
        if heat:
            rb.set_point_colors(ob, rb.stretch_colors(ob, 0.8, 1.6), name='rb_heat')
            rb.place_camera(cam, Vector((-1, -1, -1)), Vector((1, 1, 1)), head_views[0], center=dg_c, size=0.62)
            rb.only_visible([ob]); rb.shading('VERTEX'); rb.render_to(os.path.join(OUT, f'pose_{name}_{head_views[0]}_heat.png'))
            rb.clear_point_colors(ob, name='rb_heat')
        for o in scn.objects:
            o.hide_render = False


res = dict(tag=TAG, mode=MODE, rest_collar_inside=REST_COLLAR_IN, poses={})
for name in PO.POSES:
    PO.apply(cr, name)
    P = evaluated()
    r = edge_numbers()
    con, ok = contact(P, PO.PLANTED[name])
    r['contact'] = con; r['contact_ok'] = ok
    ci, cn = collar_inside(P)
    r['collar_inside'] = ci; r['collar_inside_delta'] = ci - REST_COLLAR_IN; r['collar_samples'] = cn
    r['max_move_m'] = round(float(np.linalg.norm(P - REST, axis=1).max()), 3)
    res['poses'][name] = r
    print('[qa]', name, r['stretch'], r['bad_edges'], r['max_dlen_mm'], 'contact', ok, 'collar', ci - REST_COLLAR_IN)
    render_views(name, VIEWS[name], heat=name != 'rest')
PO.reset(cr)

if MODE == 'full':
    # ---- skeleton overlay (runtime rest), labelled joint positions
    labels = {}
    proxy = rb.bone_proxy(rt, posed=False, scale=1.3)
    cam = rb.setup_render(1200); lo, hi = rb.frame_box([ob])

    def two_pass(tag, xray=0.30):
        sh = scn.display.shading
        rb.only_visible([ob]); sh.color_type = 'SINGLE'; sh.single_color = (0.80, 0.78, 0.74); sh.show_xray = True; sh.xray_alpha = xray
        rb.render_to(os.path.join(OUT, f'skel_{tag}.png'))
        rb.only_visible([proxy]); rb.shading('VERTEX', xray=False); rb.render_to(os.path.join(OUT, f'skel_{tag}_bones.png'))
        vl.update(); labels[tag] = {}
        for b in rt.data.bones:
            u, v, d = world_to_camera_view(scn, cam, rt.matrix_world @ b.head_local); labels[tag][b.name] = [round(u, 4), round(v, 4)]
        for o in scn.objects:
            o.hide_render = False
        sh.show_xray = False
    for v in ('left', 'front', 'back'):
        rb.place_camera(cam, lo, hi, v, margin=1.06); two_pass(v)
    cam.data.ortho_scale = max(hi.x - lo.x, hi.y - lo.y) * 1.06
    cam.location = ((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, hi.z + 5); cam.rotation_euler = (0, 0, math.pi); two_pass('top')
    for tag, view, c, size in (('head_left', 'left', (0, -0.86, 0.90), 0.62), ('fleg_left', 'left', (0.2, -0.40, 0.58), 1.25),
                               ('hleg_left', 'left', (0.2, 0.62, 0.55), 1.20), ('tail_back', 'back', (0, 0.75, 0.65), 0.90)):
        rb.place_camera(cam, lo, hi, view, center=Vector(c), size=size); two_pass(tag, xray=0.45)
    bpy.data.objects.remove(proxy)
    json.dump(labels, open(os.path.join(OUT, 'skel_labels.json'), 'w'))
    # ---- control rig overlay (IK paw controls, poles, FK)
    cproxy = rb.bone_proxy(cr, posed=False, scale=1.0)
    for v in ('left', 'front'):
        rb.place_camera(cam, Vector((-0.6, -1.25, -0.05)), Vector((0.6, 1.25, 1.35)), v, margin=1.04)
        sh = scn.display.shading
        rb.only_visible([ob]); sh.color_type = 'SINGLE'; sh.single_color = (0.80, 0.78, 0.74); sh.show_xray = True; sh.xray_alpha = 0.25
        rb.render_to(os.path.join(OUT, f'ctl_{v}.png'))
        rb.only_visible([cproxy]); rb.shading('VERTEX', xray=False); rb.render_to(os.path.join(OUT, f'ctl_{v}_bones.png'))
        for o in scn.objects:
            o.hide_render = False
        sh.show_xray = False
    clab = {}
    for v in ('left', 'front'):
        rb.place_camera(cam, Vector((-0.6, -1.25, -0.05)), Vector((0.6, 1.25, 1.35)), v, margin=1.04); vl.update(); clab[v] = {}
        for b in cr.data.bones:
            if b.name.endswith(('_IK', '_pole', '_roll')) or b.name in ('ctl_body', 'ctl_root'):
                u, vv, d = world_to_camera_view(scn, cam, cr.matrix_world @ b.head_local); clab[v][b.name] = [round(u, 4), round(vv, 4)]
    json.dump(clab, open(os.path.join(OUT, 'ctl_labels.json'), 'w'))
    bpy.data.objects.remove(cproxy)
    # ---- weight maps: dominant bone, and single-bone heat for key bones
    import colorsys
    PAL = {'pelvis': (1.0, 0.25, 0.2), 'spine_01': (1.0, 0.6, 0.1), 'spine_02': (1.0, 0.92, 0.2), 'chest': (0.3, 0.85, 0.3),
           'neck_01': (0.2, 0.85, 0.9), 'neck_02': (0.25, 0.45, 1.0), 'head': (0.65, 0.35, 1.0), 'jaw': (1.0, 0.45, 0.75),
           'ear': (0.75, 0.45, 0.2), 'collar': (0.55, 0.55, 0.55), 'collar_ring': (0.95, 0.95, 0.95),
           'tail_01': (0.0, 0.65, 0.55), 'tail_02': (0.7, 0.7, 0.1), 'tail_03': (0.0, 0.45, 0.38), 'tail_04': (0.95, 0.95, 0.4),
           'Scapula': (0.85, 0.7, 0.0), 'UpperArm': (0.9, 0.2, 0.9), 'ForeArm': (0.3, 0.7, 1.0), 'Hand': (0.6, 1.0, 0.2),
           'Finger': (1.0, 0.4, 0.3), 'Thigh': (0.55, 0.25, 0.85), 'Calf': (0.3, 0.7, 1.0), 'Foot': (0.6, 1.0, 0.2),
           'Toe': (1.0, 0.4, 0.3)}
    gn = [g.name for g in ob.vertex_groups]
    base = lambda n: n[2:] if n[:2] in ('L_', 'R_') else n
    cols = []
    for v in me.vertices:
        c = Vector((0, 0, 0)); t = 0
        for g in v.groups:
            c += Vector(PAL.get(base(gn[g.group]), (0.5, 0.5, 0.5))) * g.weight; t += g.weight
        cols.append(tuple(c / t) if t else (0.1, 0.1, 0.1))
    rb.set_point_colors(ob, cols, name='wdom')
    cam = rb.setup_render(1000); lo, hi = rb.frame_box([ob])
    for v in ('left', 'front', 'back', 'three_quarter'):
        rb.place_camera(cam, lo, hi, v, margin=1.05); rb.only_visible([ob]); rb.shading('VERTEX')
        rb.render_to(os.path.join(OUT, f'wdom_{v}.png'))
    cam.data.ortho_scale = max(hi.x - lo.x, hi.y - lo.y) * 1.05
    cam.location = (0, 0, -5); cam.rotation_euler = (math.pi, 0, 0); rb.render_to(os.path.join(OUT, 'wdom_below.png'))
    rb.place_camera(cam, lo, hi, 'left', center=Vector((0, -0.86, 0.88)), size=0.55); rb.render_to(os.path.join(OUT, 'wdom_head_left.png'))
    rb.place_camera(cam, lo, hi, 'front', center=Vector((0, -0.86, 0.88)), size=0.62); rb.render_to(os.path.join(OUT, 'wdom_head_front.png'))
    json.dump({k: PAL[k] for k in PAL}, open(os.path.join(OUT, 'wdom_colors.json'), 'w'))
    rb.clear_point_colors(ob, name='wdom')
    # influence count map
    ncol = {1: (0.25, 0.45, 0.9), 2: (0.3, 0.8, 0.35), 3: (0.95, 0.8, 0.2), 4: (0.9, 0.25, 0.2)}
    rb.set_point_colors(ob, [ncol.get(len([g for g in v.groups if g.weight > 0]), (0, 0, 0)) for v in me.vertices], name='winf')
    for v in ('left', 'front'):
        rb.place_camera(cam, lo, hi, v, margin=1.05); rb.only_visible([ob]); rb.shading('VERTEX')
        rb.render_to(os.path.join(OUT, f'winf_{v}.png'))
    rb.clear_point_colors(ob, name='winf')
    # single-bone heat
    def heat(w):
        t = max(0.0, min(1.0, w))
        return colorsys.hsv_to_rgb(0.66 * (1 - t), 0.85, 0.35 + 0.6 * t) if t > 0 else (0.12, 0.12, 0.14)
    SINGLE = [('L_Scapula', 'left'), ('L_UpperArm', 'left'), ('L_ForeArm', 'left'), ('L_Thigh', 'left'), ('L_Calf', 'left'),
              ('chest', 'left'), ('neck_01', 'left'), ('neck_02', 'left'), ('head', 'head_l'), ('jaw', 'head_f'),
              ('L_ear', 'head_f'), ('tail_01', 'back'), ('pelvis', 'left'), ('spine_02', 'left')]
    for bname, v in SINGLE:
        gi = ob.vertex_groups[bname].index
        cols = [heat(next((g.weight for g in vv.groups if g.group == gi), 0.0)) for vv in me.vertices]
        rb.set_point_colors(ob, cols, name='wone')
        if v.startswith('head_'):
            rb.place_camera(cam, lo, hi, 'left' if v == 'head_l' else 'front', center=Vector((0, -0.86, 0.88)), size=0.62)
        else:
            rb.place_camera(cam, lo, hi, v, margin=1.05)
        rb.only_visible([ob]); rb.shading('VERTEX'); rb.render_to(os.path.join(OUT, f'wone_{bname}.png'))
        rb.clear_point_colors(ob, name='wone')
    for o in scn.objects:
        o.hide_render = False

res['seconds'] = round(time.time() - t0, 1)
C.jdump(os.path.join(C.WORK, f'qa_{TAG}.json'), res)
print('B01_QA_DONE', TAG, MODE, res['seconds'], 's')
