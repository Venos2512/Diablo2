"""W02 test poses on the control rig: stretch numbers + renders (R5, also used to tune the fold / flight presets).

blender -b --factory-startup <rig.blend> -P w02_pose.py -- <out_dir> <poses.json> [res] [views] [names] [heat]
  poses.json: {name: {"rot": {ctl_bone: [x, y, z] deg}, "loc": {ctl_bone: [x, y, z] m (local)}, "wloc": {ctl_bone: world offset m},
               "fold": f, "flight": f,
               "feet_follow_body": f, "mirror": true}}   mirror: L values copied to R (rot X same, Y/Z negated; loc x negated)
  views: comma list of rigbatch VIEW_DIRS keys (default front,left,top); names: comma list (default all); heat: 1 = also a
  stretch-colour render per view.
Writes <out_dir>/<name>_<view>.png (+ _heat), <out_dir>/poses_metrics.json (worst edge ratio, bad edges, worst bone, mm).
"""
import bpy, sys, os, json, math
import numpy as np
from mathutils import Vector, Euler

TOOLS = r'D:/Claude/Diablo2/ashlar/3d/act-01/_batches/rig_v1/tools'
sys.path.insert(0, TOOLS)
import rigbatch as rb

argv = sys.argv[sys.argv.index('--') + 1:]
OUT, PJ = os.path.abspath(argv[0]), argv[1]          # render paths must be absolute
RES = int(argv[2]) if len(argv) > 2 and argv[2] else 640
VIEWS = argv[3].split(',') if len(argv) > 3 and argv[3] else ['front', 'left', 'top']
ONLY = argv[4].split(',') if len(argv) > 4 and argv[4] else None
HEAT = len(argv) > 5 and argv[5] == '1'
os.makedirs(OUT, exist_ok=True)
rb.prefs()
POSES = json.load(open(PJ, encoding='utf-8'))
AID = 'W02_gibbet_crow'
ob = bpy.data.objects[AID]; rig = bpy.data.objects[AID + '_rig']; ctl = bpy.data.objects[AID + '_ctl']
for im in bpy.data.images:
    if im.size[0] > 1024:
        im.scale(1024, 1024)
me = ob.data
NV = len(me.vertices)
E = np.empty(len(me.edges) * 2, int); me.edges.foreach_get('vertices', E); E = E.reshape(-1, 2)
R0 = np.empty(NV * 3); me.vertices.foreach_get('co', R0); R0 = R0.reshape(NV, 3)
L0 = np.linalg.norm(R0[E[:, 0]] - R0[E[:, 1]], axis=1)
keep = L0 >= 0.003
gn = [g.name for g in ob.vertex_groups]
dom = np.zeros(NV, int)
for v in me.vertices:
    if v.groups:
        dom[v.index] = max(v.groups, key=lambda g: g.weight).group


def reset():
    for pb in ctl.pose.bones:
        pb.rotation_mode = 'XYZ'; pb.rotation_euler = (0, 0, 0); pb.location = (0, 0, 0); pb.scale = (1, 1, 1)
    ctl.pose.bones['ctl_root']['feet_follow_body'] = 0.0


def apply(p):
    reset()
    rot = dict(p.get('rot', {})); loc = dict(p.get('loc', {}))
    if p.get('mirror', True):
        for k, v in list(rot.items()):
            if '_L_' in k:
                rot.setdefault(k.replace('_L_', '_R_'), [v[0], -v[1], -v[2]])
        for k, v in list(loc.items()):
            if '_L_' in k:
                loc.setdefault(k.replace('_L_', '_R_'), [-v[0], v[1], v[2]] if k.endswith(('_Foot_IK', '_Knee_pole')) else [v[0], v[1], v[2]])
    for k, v in rot.items():
        ctl.pose.bones[k].rotation_euler = Euler([math.radians(a) for a in v], 'XYZ')
    for k, v in loc.items():
        ctl.pose.bones[k].location = Vector(v)
    wloc = dict(p.get('wloc', {}))                  # world-space offsets, converted to the bone's rest frame
    if p.get('mirror', True):
        for k, v in list(wloc.items()):
            if '_L_' in k:
                wloc.setdefault(k.replace('_L_', '_R_'), [-v[0], v[1], v[2]])
    for k, v in wloc.items():
        ctl.pose.bones[k].location = ctl.data.bones[k].matrix_local.to_3x3().inverted() @ Vector(v)
    for nm in ('fold', 'flight'):
        f = float(p.get(nm, 0.0))
        for sd in ('L', 'R'):
            ctl.pose.bones[f'ctl_{sd}_Wing_{nm}'].location = (0, 0.1 * f, 0)
    ctl.pose.bones['ctl_root']['feet_follow_body'] = float(p.get('feet_follow_body', 0.0))
    bpy.context.view_layer.update()


def metrics():
    dg = bpy.context.evaluated_depsgraph_get(); ev = ob.evaluated_get(dg).to_mesh()
    P = np.empty(NV * 3); ev.vertices.foreach_get('co', P); P = P.reshape(NV, 3)
    ob.evaluated_get(dg).to_mesh_clear()
    L1 = np.linalg.norm(P[E[:, 0]] - P[E[:, 1]], axis=1)
    q = np.where(keep, L1 / np.maximum(L0, 1e-9), 1.0)
    qq = np.maximum(q, 1 / np.maximum(q, 1e-9))
    bad = keep & ((q > 1.6) | (q < 0.5))
    i = int(qq.argmax())
    # per-bone worst ratio (dominant bone of the worse end)
    worst_by = {}
    for j in np.argsort(-qq)[:400]:
        if qq[j] < 1.25:
            break
        b = gn[dom[E[j, 0]]]
        worst_by[b] = max(worst_by.get(b, 1.0), round(float(qq[j]), 2))
    zmin = float(P[:, 2].min()); zmax = float(P[:, 2].max())
    return dict(worst=round(float(qq[i]), 2), bad_edges=int(bad.sum()), worst_bone=gn[dom[E[i, 0]]],
                worst_dlen_mm=round(1000 * abs(L1[i] - L0[i]), 1), worst_at=[round(float(c), 3) for c in P[E[i, 0]]],
                top_bones=dict(sorted(worst_by.items(), key=lambda kv: -kv[1])[:6]),
                bbox=[[round(float(c), 3) for c in P.min(0)], [round(float(c), 3) for c in P.max(0)]], z_range=[round(zmin, 3), round(zmax, 3)])


res = {}
mpath = os.path.join(OUT, 'poses_metrics.json')
if os.path.exists(mpath):
    res = json.load(open(mpath, encoding='utf-8'))
for name, p in POSES.items():
    if ONLY and name not in ONLY:
        continue
    apply(p)
    m = metrics(); res[name] = m
    print('POSE', name, json.dumps(m), flush=True)
    fr = p.get('frame', [0, 0.14, 0.38, 1.75])          # optional per-pose framing: centre xyz + window (m)
    rb.render_views(os.path.join(OUT, name), [ob], views=VIEWS, color_type='TEXTURE', res=RES,
                    frame_objs=[ob], center=Vector(fr[:3]), size=fr[3])
    if HEAT:
        cols = rb.stretch_colors(ob, lo=0.8, hi=2.0)
        rb.set_point_colors(ob, cols, 'heat')
        rb.render_views(os.path.join(OUT, name + '_heat'), [ob], views=VIEWS, color_type='VERTEX', res=RES,
                        frame_objs=[ob], center=Vector(fr[:3]), size=fr[3])
reset(); bpy.context.view_layer.update()
for i in range(8):                                  # Windows: retry briefly locked files
    try:
        with open(mpath, 'w', encoding='utf-8') as f:
            json.dump(res, f, indent=1)
        break
    except OSError:
        import time; time.sleep(0.5 + i)
print('POSES_OK', len(res))
