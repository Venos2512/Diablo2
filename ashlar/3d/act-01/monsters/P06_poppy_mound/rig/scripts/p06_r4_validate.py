"""R4: automatic checks QA_CHECKLIST A1.1-A1.14 on rig/P06_poppy_mound_rig.blend -> rig/validation.json.

blender -b --factory-startup -P p06_r4_validate.py

A1.9 compares the skinned rest mesh with a fresh intake of the GLB (same importer, same scale); A1.10 compares the images
packed in the .blend with the images embedded in the GLB (sha256 of the bytes); A1.11 uses the catalogue WIDTH (4,50 m).
"""
import bpy, os, sys, json, math, hashlib, struct
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import p06_common as C
import numpy as np

EXPECT_RUNTIME = ['root', 'body', 'crown', 'flank_front', 'L_flank', 'R_flank', 'flank_back', 'bloom_center', 'bloom_main',
                  'L_bloom', 'R_bloom', 'fx_spawn_main', 'fx_spawn_L', 'fx_spawn_R', 'fx_body']
EXPECT_DEFORM = ['body', 'crown', 'flank_front', 'L_flank', 'R_flank', 'flank_back', 'bloom_center', 'bloom_main', 'L_bloom', 'R_bloom']
EXPECT_CONTROL = ['ctl_breath', 'ctl_sway']

# fresh reference: the GLB at real size, before anything else is loaded
ref_ob, ref_info = C.intake(name='_ref')
REF = np.array([v.co[:] for v in ref_ob.data.vertices])

# GLB embedded images
def glb_images(path):
    with open(path, 'rb') as f:
        data = f.read()
    off = 12; js = None; bin_ = None
    while off < len(data):
        ln, typ = struct.unpack_from('<I4s', data, off); off += 8
        chunk = data[off:off + ln]; off += ln
        if typ == b'JSON':
            js = json.loads(chunk.decode('utf-8'))
        elif typ.startswith(b'BIN'):
            bin_ = chunk
    out = {}
    for im in js.get('images', []):
        bv = js['bufferViews'][im['bufferView']]
        b = bin_[bv.get('byteOffset', 0): bv.get('byteOffset', 0) + bv['byteLength']]
        out[im.get('name', str(len(out)))] = hashlib.sha256(b).hexdigest()
    return out
GLB_IMG = glb_images(C.GLB)

bpy.ops.wm.open_mainfile(filepath=C.BLEND)
rig = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
ob = next(o for o in meshes if any(m.type == 'ARMATURE' for m in o.modifiers))
me = ob.data
bones = rig.data.bones
runtime = [b.name for b in bones if not b.name.startswith('ctl_')]
control = [b.name for b in bones if b.name.startswith('ctl_')]
deform = [b.name for b in bones if b.use_deform]
R = []

def check(id_, name, thr, value, ok, note=''):
    R.append(dict(id=id_, check=name, threshold=thr, value=value, pass_=bool(ok), note=note))

# A1.1
skinned = [o.name for o in meshes if any(m.type == 'ARMATURE' for m in o.modifiers)]
arm_mods = [m for m in ob.modifiers if m.type == 'ARMATURE']
check('A1.1', 'Một skin, một mesh thân', '1 mesh có Armature modifier, 1 armature',
      dict(skinned_meshes=skinned, armature_modifiers=len(arm_mods), armatures=[o.name for o in bpy.data.objects if o.type == 'ARMATURE']),
      len(skinned) == 1 and len(arm_mods) == 1 and arm_mods[0].object == rig and len(meshes) == 1)

# A1.2
import re
bad_chars = [n for n in runtime + control if re.search(r'[\s.]', n)]
check('A1.2', 'Tên bone đúng chuẩn (họ O, SKELETON_STANDARD §3), không trùng', 'khớp bảng G1 2026-10-26',
      dict(runtime=runtime, control=control, missing=sorted(set(EXPECT_RUNTIME) - set(runtime)),
           extra=sorted(set(runtime) - set(EXPECT_RUNTIME)), bad_chars=bad_chars),
      sorted(runtime) == sorted(EXPECT_RUNTIME) and sorted(control) == sorted(EXPECT_CONTROL) and not bad_chars
      and len(set(b.name for b in bones)) == len(bones))

# A1.3
roots = [b.name for b in bones if b.parent is None]
def anc(b):
    while b.parent:
        b = b.parent
    return b.name
check('A1.3', 'Phân cấp một cây, root là gốc duy nhất', "roots == ['root']",
      dict(roots=roots, all_under_root=all(anc(b) == 'root' for b in bones)), roots == ['root'])

# weights
gn = [g.name for g in ob.vertex_groups]
counts = []; sums = []; empty = 0; unknown = set(); on_nondeform = 0
for v in me.vertices:
    ws = [(gn[g.group], g.weight) for g in v.groups if g.weight > 0]
    counts.append(len(ws)); s = sum(w for _, w in ws); sums.append(s)
    if not ws:
        empty += 1
    for n, _ in ws:
        if n not in bones:
            unknown.add(n)
        elif not bones[n].use_deform:
            on_nondeform += 1
sums = np.array(sums)
check('A1.4', 'Mọi đỉnh có ít nhất một trọng số', '0 đỉnh trống', empty, empty == 0)
dev = float(np.max(np.abs(sums - 1.0)))
check('A1.5', 'Tổng trọng số mỗi đỉnh', '1 ± 1e-6', dict(max_abs_dev=dev), dev <= 1e-6,
      'trọng số lưu float32 trong Blender' if dev > 0 else '')
check('A1.6', 'Số ảnh hưởng mỗi đỉnh', '≤ 4', dict(max=int(max(counts)), hist={str(k): int(counts.count(k)) for k in sorted(set(counts))}),
      max(counts) <= 4)
check('A1.7', 'Chỉ số joint nằm trong khoảng (mọi vertex group là bone deform có thật)', 'đúng',
      dict(groups=gn, unknown=sorted(unknown), weights_on_non_deform=on_nondeform),
      not unknown and on_nondeform == 0 and set(gn) <= set(deform))

# A1.8 rest pose: pose matrices == bind matrices; skinned rest == base mesh
for pb in rig.pose.bones:
    pb.location = (0, 0, 0); pb.rotation_euler = (0, 0, 0); pb.rotation_quaternion = (1, 0, 0, 0); pb.scale = (1, 1, 1)
bpy.context.view_layer.update()
mdev = max(max(abs(a - b) for ra, rb_ in zip(pb.matrix, bones[pb.name].matrix_local) for a, b in zip(ra, rb_))
           for pb in rig.pose.bones)
dg = bpy.context.evaluated_depsgraph_get()
ev = ob.evaluated_get(dg).to_mesh()
EV = np.array([v.co[:] for v in ev.vertices]); ob.evaluated_get(dg).to_mesh_clear()
BASE = np.array([v.co[:] for v in me.vertices])
skin_dev = float(np.max(np.linalg.norm(EV - BASE, axis=1)))
check('A1.8', 'Ma trận bind khớp phân cấp (pose nghỉ = bind; mesh skin ở pose nghỉ = mesh gốc)', 'sai số ≤ 1e-5',
      dict(max_matrix_dev=float(mdev), rest_skin_dev_m=skin_dev), mdev <= 1e-5 and skin_dev <= 1e-5)

# A1.9
same = REF.shape == EV.shape
d9 = float(np.max(np.linalg.norm(EV - REF, axis=1))) if same else None
check('A1.9', 'Mesh skin ở pose nghỉ khớp GLB đầu vào đã scale (nạp lại GLB, cùng scale)', 'khoảng cách đỉnh ≤ 1e-4 m',
      dict(verts=len(EV), ref_verts=len(REF), max_dist_m=d9), same and d9 <= 1e-4)

# A1.10
packed = {}
for im in bpy.data.images:
    if im.packed_file:
        packed[im.name] = hashlib.sha256(bytes(im.packed_file.data)).hexdigest()
match = {n: (packed.get(n) == h) for n, h in GLB_IMG.items()}
check('A1.10', 'Texture không đổi so với GLB gốc', 'byte giống nhau (sha256)',
      dict(glb=GLB_IMG, blend=packed, size=[list(im.size) for im in bpy.data.images if im.packed_file]), all(match.values()) and len(match) == 3)

# A1.11 / A1.12
xs = EV[:, 0]; ys = EV[:, 1]; zs = EV[:, 2]
width = float(xs.max() - xs.min())
check('A1.11', 'Kích thước bounds theo danh mục (danh mục cho CHIỀU RỘNG 2,5H = 4,50 m)', '4,50 m ± 2 %',
      dict(width_m=round(width, 4), depth_m=round(float(ys.max() - ys.min()), 4), height_m=round(float(zs.max()), 4),
           height_H=round(float(zs.max()) / C.H, 3)), abs(width - C.WIDTH_M) <= 0.02 * C.WIDTH_M)
check('A1.12', 'Đế chạm đất', 'z thấp nhất = 0 ± 0,01 m', dict(z_min=round(float(zs.min()), 5)), abs(float(zs.min())) <= 0.01)

# A1.13
weighted = set(n for n in gn if any(g.group == gn.index(n) and g.weight > 0 for v in me.vertices for g in v.groups))
unweighted_rt = [n for n in runtime if n not in weighted]
check('A1.13', 'Bone runtime không trọng số chỉ là socket (và tổ tiên cấu trúc)', 'root + fx_*',
      dict(unweighted_runtime=unweighted_rt, control_bones_not_exported=control),
      all(n == 'root' or n.startswith('fx_') for n in unweighted_rt))

# A1.14
def tr_ok(o):
    M = o.matrix_world
    return all(abs(M[i][j] - (1.0 if i == j else 0.0)) < 1e-6 for i in range(4) for j in range(4))
check('A1.14', 'Scale object = 1, không scale âm, xoay đã áp dụng', 'matrix_world = I cho mesh và armature',
      dict(mesh=[list(o.matrix_world.to_scale()) for o in [ob]], rig=list(rig.matrix_world.to_scale())), tr_ok(ob) and tr_ok(rig))

# family extras
cons = {pb.name: [(c.type, c.subtarget, c.name) for c in pb.constraints] for pb in rig.pose.bones if pb.constraints}
extra = dict(deform_bones=len(deform), deform_max_family_O=10, runtime_bones=len(runtime), control_bones=control,
             constraints=cons, packed_images=list(packed), verts=len(me.vertices), tris=sum(len(p.vertices) - 2 for p in me.polygons),
             blend=os.path.relpath(C.BLEND, C.REPO).replace('\\', '/'), glb_sha256=ref_info['sha256'], scale=ref_info['scale'])
ok_all = all(r['pass_'] for r in R)
out = dict(asset=C.AID, date='2026-10-26', stage='R4', family='O', route='M', result='PASS' if ok_all else 'FAIL',
           passed=sum(r['pass_'] for r in R), total=len(R), checks=[{**{k: v for k, v in r.items() if k != 'pass_'}, 'pass': r['pass_']} for r in R],
           extra=extra)
r5 = os.path.join(C.WORK, 'r5_metrics.json')
if os.path.exists(r5):
    with open(r5, encoding='utf-8') as f:
        out['pose_metrics'] = json.load(f).get('summary')
C.write_json(os.path.join(C.RIG, 'validation.json'), out)
for r in R:
    print('CHECK', r['id'], 'PASS' if r['pass_'] else 'FAIL', json.dumps(r['value'], ensure_ascii=False)[:160])
print('R4_DONE', out['result'], f"{out['passed']}/{out['total']}")
