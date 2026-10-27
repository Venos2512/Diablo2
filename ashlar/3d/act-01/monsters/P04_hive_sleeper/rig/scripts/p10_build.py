"""P04 Hive-Sleeper, R2 + R3: build rig/P04_hive_sleeper_rig.blend from the GLB (read-only).

blender -b --factory-startup -P p10_build.py -- [--no-save] [--preview <dir>]

One mesh at real size (S = 1.75695, top 1.08 m), runtime skeleton P04_hive_sleeper_rig (bone table of p04_common,
roll rule X = +X), weights (p04_skinmodel on p04_weights.Skin), control rig P04_hive_sleeper_ctl (p04_ctl). Writes
rig/_work/build_report.json; --preview renders dominant-bone weight colours to <dir>.
"""
import bpy, sys, os, json, time
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import p04_common as C
import p04_weights as PW
import p04_skinmodel as SM
import p04_ctl as CTL
sys.path.insert(0, C.TOOLS)
import rigbatch as rb

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
SAVE = '--no-save' not in argv
PREVIEW = argv[argv.index('--preview') + 1] if '--preview' in argv else None
t0 = time.time()
rb.K = 1.0

ob = C.import_scaled(bpy, name=C.ASSET)
me = ob.data
srgb, img_name = C.vertex_srgb(bpy, ob)
V = np.array([v.co[:] for v in me.vertices])
polys = [list(p.vertices) for p in me.polygons]

scn = bpy.context.scene
col_rig = bpy.data.collections.new('P04_Runtime'); scn.collection.children.link(col_rig)
col_ctl = bpy.data.collections.new('P04_Control'); scn.collection.children.link(col_ctl)
scn.collection.objects.unlink(ob); col_rig.objects.link(ob)

T = C.bone_table()
rt = C.build_armature(bpy, 'P04_hive_sleeper_rig', T, display='STICK')
scn.collection.objects.unlink(rt); col_rig.objects.link(rt)
rt.show_in_front = False
rt['skill_scale'] = 1.0; rt['scale_S'] = C.S; rt['top_m'] = C.TOP_M
rt['roll_rule'] = 'local X = world +X projected off the bone; clavicles Z up (Qh, shared with U04)'
deform = [b['name'] for b in T if b['deform']]
bones = {b.name: (list(b.head_local), list(b.tail_local)) for b in rt.data.bones}

# ------------------------------------------------------------------ R3 weights
sk = PW.Skin(V, polys, srgb, bones, deform)
info = SM.run(sk)
info['empty_before_finalize'] = sk.finalize()
VW = sk.vertex_weights()
for n in deform:
    ob.vertex_groups.new(name=n)
G = {g.name: g for g in ob.vertex_groups}
for i, lst in enumerate(VW):
    for n, w in lst:
        G[n].add([i], w, 'REPLACE')
reg = me.attributes.new('p04_region', 'INT', 'POINT')
reg.data.foreach_set('value', sk.region[sk.wid].astype(np.int32))
mod = ob.modifiers.new('Armature', 'ARMATURE'); mod.object = rt; mod.use_vertex_groups = True
ob.parent = rt; ob.matrix_parent_inverse = rt.matrix_world.inverted()

# ------------------------------------------------------------------ R2 control rig
ct, rep = CTL.build(rt, C.roll_vector, collection=col_ctl)
dev = CTL.rest_deviation(rt, ct)

# ------------------------------------------------------------------ report
used = {n for lst in VW for n, _ in lst}
report = dict(asset=C.ASSET, date=time.strftime('%Y-%m-%d'), blender=bpy.app.version_string, glb=C.GLB, S=C.S, top_m=C.TOP_M,
              verts=len(me.vertices), faces=len(me.polygons), welded_nodes=sk.m, base_colour=img_name,
              bones=len(rt.data.bones), deform=len(deform), deform_used=len(used & set(deform)),
              deform_unused=sorted(set(deform) - used), ctl_bones=len(ct.data.bones), skin=info, pole=rep,
              rest_deviation_deg_m=dev, seconds=round(time.time() - t0, 1))
os.makedirs(C.WORK, exist_ok=True)
json.dump(report, open(os.path.join(C.WORK, 'build_report.json'), 'w'), indent=1, default=str)
print(json.dumps(report, indent=1, default=str))

if PREVIEW:
    os.makedirs(PREVIEW, exist_ok=True)
    rb.set_point_colors(ob, rb.weight_colors(ob), 'wcol')
    cam = rb.setup_render(900); lo, hi = rb.frame_box([ob])
    rb.VIEW_DIRS['three_quarter'] = (0.75, -0.65, 0.35); rb.VIEW_DIRS['back_q'] = (0.6, 0.8, 0.35)
    for v in ('left', 'front', 'back_q', 'three_quarter', 'bottom'):
        if v == 'bottom':
            rb.VIEW_DIRS['bottom'] = (0, 0.0001, -1)
        rb.place_camera(cam, lo, hi, v); rb.only_visible([ob]); rb.shading('VERTEX')
        rb.render_to(os.path.join(PREVIEW, f'w_{v}.png'))
    rb.clear_point_colors(ob, 'wcol')
    for o in bpy.context.scene.objects:
        o.hide_render = False

if SAVE:
    scn.render.fps = 24
    for scr in bpy.data.screens:
        for area in scr.areas:
            if area.type == 'VIEW_3D':
                for sp in area.spaces:
                    if sp.type == 'VIEW_3D':
                        sp.shading.type = 'SOLID'; sp.shading.color_type = 'TEXTURE'
    for o in ('_rb_cam',):
        x = bpy.data.objects.get(o)
        if x:
            bpy.data.objects.remove(x)
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = ct
    rb.save(os.path.join(C.RIG_DIR, f'{C.ASSET}_rig.blend'))
print('BUILD_DONE', round(time.time() - t0, 1), 's')
