"""B01 R4: automatic checks (QA_CHECKLIST A1) on the saved rig + control-rig function tests -> rig/validation.json.

blender -b --factory-startup rig/B01_sextons_dog_rig.blend -P b01_r4_validate.py -- <qa_tag>

No GLB/FBX export in this pass (user scope): A1 items that the checklist states for an exported GLB are measured on their
.blend equivalent and say so in 'note' (A1.1, A1.7, A1.8, A1.9). The GLB is read only (A1.9 re-import, A1.10 image bytes).
"""
import bpy, sys, os, json, math, hashlib, struct, time
import numpy as np
from mathutils import Vector, Matrix, kdtree

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import b01_common as C
import b01_skel as S
import b01_poses as PO

TAG = sys.argv[sys.argv.index('--') + 1]
t0 = time.time()
ob = bpy.data.objects[C.AID]; rt = bpy.data.objects['B01_runtime']; cr = bpy.data.objects['B01_control']
me = ob.data; vl = bpy.context.view_layer
A1 = {}


def item(k, ok, measured, threshold, note=''):
    A1[k] = dict(pass_=bool(ok), measured=measured, threshold=threshold, note=note)


# ---- A1.1 one skin, one body mesh
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
mods = [m for m in ob.modifiers if m.type == 'ARMATURE']
item('A1.1', len(meshes) == 1 and len(mods) == 1 and mods[0].object == rt,
     dict(mesh_objects=[o.name for o in meshes], armature_modifiers=[(m.name, m.object.name) for m in mods],
          polygons=len(me.polygons), triangles=sum(len(p.vertices) - 2 for p in me.polygons)),
     '1 mesh, 1 Armature modifier -> B01_runtime', '.blend (no export this pass): one mesh object = one glTF mesh + one skin')
# ---- A1.2 names
names = [b.name for b in rt.data.bones]
expected = [b[0] for b in S.bones()]
bad = [n for n in names if (' ' in n or '.' in n or not all(c.isalnum() or c == '_' for c in n))]
side_bad = [n for n in names if n.lower().endswith(('_l', '_r', '.l', '.r', '_left', '_right'))]
item('A1.2', sorted(names) == sorted(expected) and len(set(names)) == len(names) and not bad and not side_bad,
     dict(count=len(names), unique=len(set(names)), missing=sorted(set(expected) - set(names)), extra=sorted(set(names) - set(expected)),
          bad_chars=bad, suffix_side=side_bad),
     'names of SKELETON_STANDARD.md §3 Họ Q (B01 table), unique, [A-Za-z0-9_], L_/R_ prefix')
# ---- A1.3 one tree, root unique
roots = [b.name for b in rt.data.bones if b.parent is None]
item('A1.3', roots == ['root'], dict(roots=roots, bones=len(names)), 'one root named root')
# ---- weights A1.4-A1.7
gn = [g.name for g in ob.vertex_groups]
deform = {b.name for b in rt.data.bones if b.use_deform}
sums = np.array([sum(g.weight for g in v.groups) for v in me.vertices])
ninf = np.array([sum(1 for g in v.groups if g.weight > 0) for v in me.vertices])
item('A1.4', int((ninf == 0).sum()) == 0, dict(vertices=len(me.vertices), empty=int((ninf == 0).sum())), '0 empty vertices')
item('A1.5', float(np.abs(sums - 1).max()) <= 1e-6, dict(max_abs_sum_minus_1=float(np.abs(sums - 1).max()),
                                                          min_sum=float(sums.min()), max_sum=float(sums.max())), '1 +- 1e-6')
hist = {str(k): int((ninf == k).sum()) for k in range(1, 9) if (ninf == k).sum()}
item('A1.6', int(ninf.max()) <= 4, dict(max_influences=int(ninf.max()), histogram=hist), '<= 4')
unknown = sorted(set(gn) - set(names)); on_nondeform = sorted(set(gn) & (set(names) - deform))
weighted = sorted({gn[g.group] for v in me.vertices for g in v.groups if g.weight > 0})
item('A1.7', not unknown and not on_nondeform,
     dict(vertex_groups=len(gn), unknown_groups=unknown, groups_on_non_deform=on_nondeform, bones_with_weight=len(weighted)),
     'every vertex group = a deform bone of B01_runtime', '.blend equivalent of joint index range: group name -> bone')
# ---- A1.8 bind = rest: rest pose deformation is the identity; runtime rest == control rest
R0 = np.array([v.co[:] for v in me.vertices])
rt.data.pose_position = 'REST'; vl.update()
dg = bpy.context.evaluated_depsgraph_get(); ev = ob.evaluated_get(dg).to_mesh()
P = np.array([v.co[:] for v in ev.vertices]); ob.evaluated_get(dg).to_mesh_clear()
bind_dev = float(np.linalg.norm(P - R0, axis=1).max())
rt.data.pose_position = 'POSE'; PO.reset(cr); vl.update()
dg = bpy.context.evaluated_depsgraph_get(); ev = ob.evaluated_get(dg).to_mesh()
P = np.array([v.co[:] for v in ev.vertices]); ob.evaluated_get(dg).to_mesh_clear()
ik_rest_dev = float(np.linalg.norm(P - R0, axis=1).max())
mat_err = 0.0
for b in rt.data.bones:
    pb = rt.pose.bones[b.name]
    mat_err = max(mat_err, max(abs(x) for r in (pb.matrix - b.matrix_local) for x in r))
item('A1.8', bind_dev <= 1e-5, dict(bind_vertex_dev_m=bind_dev, runtime_bones=len(rt.data.bones)), '<= 1e-5',
     '.blend: armature in REST position deforms the mesh to exactly the stored mesh (bind = rest). The IK-at-rest residual '
     'of the control rig is a separate function test')
# ---- A1.10 textures: packed image bytes == GLB embedded bytes
with open(C.GLB, 'rb') as f:
    data = f.read()
magic, ver, length = struct.unpack_from('<4sII', data, 0)
jl, jt = struct.unpack_from('<II', data, 12); js = json.loads(data[20:20 + jl])
bl, bt = struct.unpack_from('<II', data, 20 + jl); bin_ = data[28 + jl:28 + jl + bl]
glb_imgs = {}
for im in js.get('images', []):
    bv = js['bufferViews'][im['bufferView']]
    raw = bin_[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']]
    glb_imgs[im.get('name', str(len(glb_imgs)))] = hashlib.sha256(raw).hexdigest()
blend_imgs = {im.name: hashlib.sha256(im.packed_file.data).hexdigest() for im in bpy.data.images if im.packed_file}
item('A1.10', sorted(glb_imgs.values()) == sorted(blend_imgs.values()) and len(blend_imgs) == 3,
     dict(glb=glb_imgs, blend_packed=blend_imgs, sizes={im.name: list(im.size) for im in bpy.data.images if im.packed_file}),
     'byte-identical (sha256) to the GLB', 'images packed in the .blend')
# ---- A1.9 mesh == scaled GLB (re-import in a scratch scene)
info = json.loads(ob['b01_intake'])
before = {k: set(getattr(bpy.data, k)) for k in ('meshes', 'materials', 'images', 'textures', 'objects', 'node_groups')}
scratch = bpy.data.scenes.new('_a19'); win = bpy.context.window
old_scene = win.scene; win.scene = scratch
bpy.ops.import_scene.gltf(filepath=C.GLB, merge_vertices=True)
imp = [o for o in scratch.objects if o.type == 'MESH'][0]
Mi = imp.matrix_world.copy()
G = np.array([(Mi @ v.co)[:] for v in imp.data.vertices]) * info['scale'] - np.array(info['offset'])
uv_g = imp.data.uv_layers.active.data; uv_r = me.uv_layers.active.data
same_topo = len(imp.data.polygons) == len(me.polygons) and all(
    tuple(a.vertices) == tuple(b.vertices) for a, b in zip(imp.data.polygons, me.polygons))
pos_err = float(np.linalg.norm(G - R0, axis=1).max()) if len(G) == len(R0) else None
uv_err = max((abs(a.uv[0] - b.uv[0]) + abs(a.uv[1] - b.uv[1])) for a, b in zip(uv_g, uv_r)) if len(uv_g) == len(uv_r) else None
win.scene = old_scene
for o in list(scratch.objects):
    bpy.data.objects.remove(o)
bpy.data.scenes.remove(scratch)
for k, old in before.items():
    coll = getattr(bpy.data, k)
    for idb in [q for q in coll if q not in old]:
        coll.remove(idb)
item('A1.9', same_topo and pos_err is not None and pos_err <= 1e-4 and uv_err is not None and uv_err <= 1e-6,
     dict(same_polygons_and_order=same_topo, max_vertex_dist_m=pos_err, max_uv_diff=uv_err, scale=info['scale'],
          offset=info['offset']), 'vertex distance <= 1e-4 m (and same topology, UV)',
     'GLB re-imported with the rig\'s importer settings, scaled by the stored factor; compared vertex by vertex with the rig mesh')
# ---- A1.11 size, A1.12 floor
L_y = float(R0[:, 1].max() - R0[:, 1].min()); H_z = float(R0[:, 2].max() - R0[:, 2].min())
item('A1.11', abs(L_y - 2.16) / 2.16 <= 0.02 and abs(H_z - 0.72 * 1.8) / (0.72 * 1.8) <= 0.02,
     dict(length_y_m=round(L_y, 4), height_z_m=round(H_z, 4), length_err_pct=round(100 * (L_y - 2.16) / 2.16, 2),
          height_err_pct_vs_0_72H=round(100 * (H_z - 1.296) / 1.296, 2)),
     'G1 (family Q): length 1.2H = 2.16 m +- 2 % and height 0.72H = 1.296 m +- 2 %')
item('A1.12', abs(float(R0[:, 2].min())) <= 0.01, dict(lowest_z_m=float(R0[:, 2].min())), '0 +- 0.01 m')
# ---- A1.13 bones without weight
unweighted = sorted(set(names) - set(weighted))
allowed = set(S.SOCKETS) | set(S.STRUCTURAL)
item('A1.13', set(unweighted) == allowed, dict(unweighted=unweighted, expected=sorted(allowed)),
     'only sockets + structural ancestors (root, cog)', 'SKELETON_STANDARD §7 keeps root/cog as structural ancestors')
# ---- A1.14 transforms
tr = {}
for o in (ob, rt, cr):
    tr[o.name] = dict(loc=list(o.location), rot=list(o.rotation_euler), scale=list(o.scale), parent=o.parent.name if o.parent else None,
                      parent_inverse_identity=all(abs(o.matrix_parent_inverse[i][j] - (i == j)) < 1e-9 for i in range(4) for j in range(4)))
ok14 = all(all(abs(x - 1) < 1e-9 for x in v['scale']) and all(abs(x) < 1e-9 for x in v['loc'] + v['rot']) and v['parent_inverse_identity']
           for v in tr.values())
item('A1.14', ok14, tr, 'scale 1, no negative scale, rotation applied (identity object transforms)')

# ---- control rig function tests
tests = []
REST = R0


def evalP():
    dg = bpy.context.evaluated_depsgraph_get(); e = ob.evaluated_get(dg).to_mesh()
    Pp = np.array([v.co[:] for v in e.vertices]); ob.evaluated_get(dg).to_mesh_clear()
    return Pp


region = {}
for s, sx in (('L', 1), ('R', -1)):
    region[f'{s}_front'] = np.flatnonzero((REST[:, 1] < 0.0876) & (sx * REST[:, 0] > 0.06) & (REST[:, 2] < 0.03))   # soles
    region[f'{s}_hind'] = np.flatnonzero((REST[:, 1] >= 0.0876) & (REST[:, 1] < 0.81) & (sx * REST[:, 0] > 0.06) & (REST[:, 2] < 0.03))
torso = np.flatnonzero((REST[:, 2] > 0.75) & (np.abs(REST[:, 1]) < 0.3))
for ctl, reg in (('ctl_L_Hand_IK', 'L_front'), ('ctl_R_Hand_IK', 'R_front'), ('ctl_L_Foot_IK', 'L_hind'), ('ctl_R_Foot_IK', 'R_hind')):
    PO.reset(cr); d = (0.0, -0.06, 0.05); PO.move_world(cr, ctl, d); Pp = evalP()
    moved = (Pp[region[reg]] - REST[region[reg]]).mean(0)
    others = max(float(np.linalg.norm(Pp[region[k]] - REST[region[k]], axis=1).max()) for k in region if k != reg)
    tor = float(np.linalg.norm(Pp[torso] - REST[torso], axis=1).max())
    tests.append(dict(test=f'{ctl} move {d}', pass_=bool(np.allclose(moved, d, atol=0.006) and others < 1e-4 and tor < 1e-4),
                      paw_mean_move=[round(x, 4) for x in moved], other_paws_max_m=others, torso_max_m=tor))
for ctl, reg, prop in (('ctl_L_Hand_IK', 'L_front', 'ik_arm_L'), ('ctl_L_Foot_IK', 'L_hind', 'ik_leg_L')):
    PO.reset(cr); PO.move_world(cr, ctl, (0, -0.06, 0.05)); cr[prop] = 0.0; cr.update_tag(); bpy.context.scene.frame_set(1); vl.update(); Pp = evalP()
    back = float(np.linalg.norm(Pp[region[reg]] - REST[region[reg]], axis=1).max())
    tests.append(dict(test=f'{prop} = 0 (FK): moved {ctl} has no effect', pass_=back < 1e-4, paw_dev_m=back))
    cr[prop] = 1.0; cr.update_tag(); bpy.context.scene.frame_set(1)
PO.reset(cr); PO.move_world(cr, 'ctl_body', (0, 0, -0.08)); Pp = evalP()
paws = max(float(np.linalg.norm(Pp[region[k]] - REST[region[k]], axis=1).max()) for k in region)
tor = (Pp[torso] - REST[torso]).mean(0)
tests.append(dict(test='ctl_body down 8 cm: torso follows, paws stay (IK)', pass_=bool(abs(tor[2] + 0.08) < 0.01 and paws < 0.004),
                  torso_mean_dz=round(float(tor[2]), 4), paws_max_m=paws))
PO.reset(cr); PO.move_world(cr, 'ctl_root', (0.1, 0.2, 0)); Pp = evalP()
dev = float(np.abs((Pp - REST) - np.array([0.1, 0.2, 0])).max())
tests.append(dict(test='ctl_root move: whole dog follows', pass_=dev < 1e-4, max_dev_m=dev))
PO.reset(cr); PO.rot_world(cr, 'ctl_L_Elbow_pole', (0, 0, 1), 0); PO.move_world(cr, 'ctl_L_Hand_IK', (0, 0.0, 0.15)); vl.update()
e0 = cr.pose.bones['ctl_L_ForeArm'].head.copy(); PO.move_world(cr, 'ctl_L_Elbow_pole', (0.25, 0, 0)); e1 = cr.pose.bones['ctl_L_ForeArm'].head.copy()
tests.append(dict(test='elbow pole moved +X: elbow follows +X', pass_=(e1 - e0).x > 0.005, elbow_dx_m=round((e1 - e0).x, 4)))
PO.reset(cr); PO.move_world(cr, 'ctl_L_Foot_IK', (0, 0.0, 0.15)); vl.update()
k0 = cr.pose.bones['ctl_L_Calf'].head.copy(); PO.move_world(cr, 'ctl_L_Knee_pole', (0.25, 0, 0)); k1 = cr.pose.bones['ctl_L_Calf'].head.copy()
tests.append(dict(test='knee pole moved +X: knee follows +X', pass_=(k1 - k0).x > 0.005, knee_dx_m=round((k1 - k0).x, 4)))
PO.reset(cr); PO.rot_world(cr, 'ctl_L_Foot_roll', (1, 0, 0), 25); vl.update(); Pp = evalP()
toes = np.flatnonzero((REST[:, 1] > 0.45) & (REST[:, 1] < 0.56) & (REST[:, 0] > 0.06) & (REST[:, 2] < 0.04))   # toe tips, ahead of the ball blend
pad = np.flatnonzero((REST[:, 1] > 0.69) & (REST[:, 1] < 0.81) & (REST[:, 0] > 0.06) & (REST[:, 2] < 0.03))
lift = float((Pp[pad, 2] - REST[pad, 2]).mean())
tests.append(dict(test='ctl_L_Foot_roll +25 (digitigrade heel lift): metatarsal pad lifts, toes stay',
                  pass_=bool(lift > 0.02 and float(np.abs(Pp[toes] - REST[toes]).max()) < 0.005),
                  pad_mean_lift_m=round(lift, 4), toes_max_dev_m=float(np.abs(Pp[toes] - REST[toes]).max())))
PO.reset(cr); vl.update()
tests.append(dict(test='IK on at rest: runtime pose == bind (control rig residual)', pass_=mat_err < 1e-3 and ik_rest_dev < 1e-4,
                  max_matrix_diff=mat_err, max_vertex_dev_m=ik_rest_dev))
# runtime == control in a pose
PO.apply(cr, 'step_diag'); vl.update()
rc_err = 0.0
for b in rt.data.bones:
    if b.name in S.SOCKETS:
        continue
    cn = {'root': 'ctl_root', 'cog': 'ctl_body'}.get(b.name, 'ctl_' + b.name)
    rc_err = max(rc_err, max(abs(x) for r in ((rt.matrix_world @ rt.pose.bones[b.name].matrix) - (cr.matrix_world @ cr.pose.bones[cn].matrix)) for x in r))
tests.append(dict(test='runtime bones == control bones (step_diag)', pass_=rc_err < 1e-5, max_matrix_diff=rc_err))
sock = []
for sname in ('fx_head', 'fx_mouth'):
    pb = rt.pose.bones[sname]; par = pb.parent
    rel = par.matrix.inverted() @ pb.matrix; rel0 = par.bone.matrix_local.inverted() @ pb.bone.matrix_local
    sock.append(max(abs(x) for r in (rel - rel0) for x in r))
tests.append(dict(test='sockets follow their parent (step_diag)', pass_=max(sock) < 1e-5, max_local_diff=max(sock)))
PO.reset(cr)

# ---- assemble
qa = json.load(open(os.path.join(C.WORK, f'qa_{TAG}.json')))
build = json.load(open(os.path.join(C.WORK, 'build.json')))
for k in A1:
    A1[k]['pass'] = A1[k].pop('pass_')
for t in tests:
    t['pass'] = t.pop('pass_')
out = dict(asset=C.AID, date='2026-10-26', blender=bpy.app.version_string, family='Q', route='M',
           glb_sha256=C.GLB_SHA256, scale=info['scale'], length_m=info['length_m'],
           A1=A1, A1_summary=f"{sum(v['pass'] for v in A1.values())}/{len(A1)}",
           rig_function_tests=tests, rig_function_summary=f"{sum(t['pass'] for t in tests)}/{len(tests)}",
           bones=dict(runtime=len(names), deform=len(deform), weighted=len(weighted), control=len(cr.data.bones)),
           poles=build['poles'], skin=build['skin'], poses=qa['poses'], rest_collar_inside_samples=qa['rest_collar_inside'],
           tools=dict(scripts='rig/scripts/ (b01_common, b01_skel, b01_skin, b01_poses, b01_r2_build, b01_r5_qa, b01_r4_validate, '
                                'b01_g2_sheets)', imported_unmodified='ashlar/3d/act-01/_batches/rig_v1/tools/rigbatch.py, compose.py'),
           seconds=round(time.time() - t0, 1))
C.jdump(os.path.join(C.RIG, 'validation.json'), out)
print('[val] A1', out['A1_summary'], {k: v['pass'] for k, v in A1.items()})
print('[val] tests', out['rig_function_summary'], [(t['test'], t['pass']) for t in tests])
print('B01_VALIDATE_DONE', out['seconds'], 's')
