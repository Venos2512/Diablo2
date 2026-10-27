"""W02 R4 + R5 (static part): QA_CHECKLIST A1 on the source .blend -> rig/validation.json; skeleton overlays and weight maps.

blender -b --factory-startup <rig.blend> -P w02_validate.py -- <rig_dir> <glb>

A1 is checked on the Blender source (scope: no GLB export in this pass). A1.1/A1.7/A1.8 have Blender equivalents
(one skinned mesh / vertex groups = deform bones / rest pose consistency); the glTF-level re-check belongs to R8.
A1.9 re-imports the Tripo GLB, applies the intake transform and compares vertex positions; A1.10 hashes the packed
image bytes against the images embedded in the GLB.
"""
import bpy, sys, os, json, math, hashlib, struct, re
import numpy as np
from mathutils import Vector, Matrix

TOOLS = r'D:/Claude/Diablo2/ashlar/3d/act-01/_batches/rig_v1/tools'
sys.path.insert(0, TOOLS)
import rigbatch as rb

argv = sys.argv[sys.argv.index('--') + 1:]
RIG_DIR, GLB = os.path.abspath(argv[0]), argv[1]
QA = os.path.join(RIG_DIR, 'qa'); RAW = os.path.join(QA, 'raw'); os.makedirs(RAW, exist_ok=True)
AID = 'W02_gibbet_crow'
ob = bpy.data.objects[AID]; rig = bpy.data.objects[AID + '_rig']; ctl = bpy.data.objects[AID + '_ctl']
intake = json.loads(ob['w02_intake'])
S = intake['scale']; SHIFT = Vector(intake['shift'])
V = {}

EXPECTED = (['root', 'cog', 'pelvis', 'spine_01', 'chest', 'neck_01', 'neck_02', 'neck_03', 'head', 'beak', 'tail_01', 'tail_02'] +
            [f'{s}_{b}' for s in ('L', 'R') for b in ('Thigh', 'Calf', 'Foot', 'Toe', 'Wing_01', 'Wing_02', 'Wing_03')] +
            ['fx_wing_L', 'fx_wing_R', 'ground', 'hit_origin', 'fx_head', 'fx_chest'])
SOCKETS = ['fx_wing_L', 'fx_wing_R', 'ground', 'hit_origin', 'fx_head', 'fx_chest']


def check(key, ok, measured, threshold, note=''):
    V[key] = {'pass': bool(ok), 'measured': measured, 'threshold': threshold, 'note': note}


# A1.1 one skin, one mesh body
skinned = [o for o in bpy.data.objects if o.type == 'MESH' and any(m.type == 'ARMATURE' for m in o.modifiers)]
arm_mods = [m for m in ob.modifiers if m.type == 'ARMATURE']
check('A1.1', len(skinned) == 1 and len(arm_mods) == 1 and arm_mods[0].object == rig and len(ob.data.materials) == 1,
      dict(skinned_meshes=[o.name for o in skinned], armature_modifiers=len(arm_mods), target=arm_mods[0].object.name,
           materials=len(ob.data.materials)), '1 mesh có skin, 1 Armature modifier tới skeleton runtime', 'kiểm trên .blend; glTF ở R8')
# A1.2 names
names = [b.name for b in rig.data.bones]
bad_chars = [n for n in names if not re.fullmatch(r'[A-Za-z0-9_]+', n)]
check('A1.2', sorted(names) == sorted(EXPECTED) and len(set(names)) == len(names) and not bad_chars,
      dict(count=len(names), unique=len(set(names)), missing=sorted(set(EXPECTED) - set(names)), extra=sorted(set(names) - set(EXPECTED)),
           bad_chars=bad_chars), 'đúng bảng họ W chim (SKELETON_STANDARD §3, G1 2026-10-26), không trùng, chỉ [A-Za-z0-9_]')
# A1.3 hierarchy
roots = [b.name for b in rig.data.bones if b.parent is None]
check('A1.3', roots == ['root'], dict(roots=roots, bones=len(names)), 'một cây, gốc duy nhất root')
# weights
me = ob.data
gn = [g.name for g in ob.vertex_groups]
deform = [b.name for b in rig.data.bones if b.use_deform]
cnt = np.zeros(len(me.vertices), int); sums = np.zeros(len(me.vertices))
hist = {}
for v in me.vertices:
    ws = [g.weight for g in v.groups if g.weight > 0]
    cnt[v.index] = len(ws); sums[v.index] = sum(ws)
for c in cnt:
    hist[int(c)] = hist.get(int(c), 0) + 1
check('A1.4', int((cnt == 0).sum()) == 0, dict(vertices=len(me.vertices), empty=int((cnt == 0).sum())), '0 đỉnh trống')
err = float(np.abs(sums - 1).max())
check('A1.5', err <= 1e-6, dict(max_abs_sum_minus_1=err), '1 ± 1e-6', 'trọng số float32 của Blender')
check('A1.6', int(cnt.max()) <= 4, dict(max_influences=int(cnt.max()), histogram=hist), '≤ 4')
unknown = sorted(set(gn) - set(deform)); on_nondeform = sorted(set(gn) & set(n for n in names if n not in deform))
check('A1.7', not unknown and not on_nondeform, dict(groups=len(gn), unknown_groups=unknown, groups_on_non_deform=on_nondeform),
      'mọi vertex group là bone deform có thật', 'tương đương chỉ số joint trong khoảng; kiểm lại trên glTF ở R8')
# A1.8 rest consistency (inverse bind = inverse(matrix_local); at rest the posed matrices equal matrix_local)
for pb in ctl.pose.bones:
    pb.rotation_mode = 'XYZ'; pb.rotation_euler = (0, 0, 0); pb.location = (0, 0, 0); pb.scale = (1, 1, 1)
ctl.pose.bones['ctl_root']['feet_follow_body'] = 0.0
bpy.context.view_layer.update()
dev = 0.0
for b in rig.data.bones:
    M = rig.pose.bones[b.name].matrix; R = b.matrix_local
    dev = max(dev, max(abs(M[i][j] - R[i][j]) for i in range(4) for j in range(4)))
hier = 0.0
for b in rig.data.bones:
    if b.parent:
        loc = b.parent.matrix_local.inverted() @ b.matrix_local
        hier = max(hier, max(abs((b.parent.matrix_local @ loc)[i][j] - b.matrix_local[i][j]) for i in range(4) for j in range(4)))
check('A1.8', dev <= 1e-4 and hier <= 1e-5, dict(rest_pose_max_abs=round(dev, 8), hierarchy_max_abs=hier),
      'ma trận rest khớp phân cấp ≤ 1e-5; skeleton runtime theo rig điều khiển ở rest ≤ 1e-4',
      'rig điều khiển giữ đúng rest (IK chân lệch < 0,1 mm); IBM glTF kiểm ở R8')
# A1.10 textures: packed bytes vs GLB embedded images
with open(GLB, 'rb') as f:
    blob = f.read()
jlen = struct.unpack_from('<I', blob, 12)[0]
gj = json.loads(blob[20:20 + jlen]); boff = 20 + jlen + 8
glb_imgs = {}
for im in gj.get('images', []):
    bv = gj['bufferViews'][im['bufferView']]
    data = blob[boff + bv.get('byteOffset', 0): boff + bv.get('byteOffset', 0) + bv['byteLength']]
    glb_imgs[im.get('name', str(len(glb_imgs)))] = hashlib.sha256(data).hexdigest()
blend_imgs = {}
for im in bpy.data.images:
    if im.packed_file:
        blend_imgs[im.name] = hashlib.sha256(bytes(im.packed_file.data)).hexdigest()
match = sorted(glb_imgs.values()) == sorted(blend_imgs.values())
check('A1.10', match, dict(glb=glb_imgs, blend_packed=blend_imgs), 'byte giống nhau', 'sha256 ảnh nhúng trong GLB và ảnh đóng gói trong .blend')
# A1.9 mesh vs scaled input (re-import the GLB)
before = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=GLB, merge_vertices=True)
new = [o for o in bpy.data.objects if o not in before]
src = next(o for o in new if o.type == 'MESH')
Msrc = src.matrix_world.copy()
co_src = np.array([(Matrix.Translation(SHIFT) @ Matrix.Scale(S, 4) @ Msrc @ v.co)[:] for v in src.data.vertices])
co_rig = np.array([v.co[:] for v in me.vertices])
same = len(co_src) == len(co_rig)
d = float(np.abs(co_src - co_rig).max()) if same else None
check('A1.9', same and d <= 1e-4, dict(verts_source=len(co_src), verts_rig=len(co_rig), max_abs_m=d),
      '≤ 1e-4 m sau scale ×%.4f và dời Y +%.3f m' % (S, SHIFT.y), 'so theo chỉ số đỉnh: cùng file, cùng tuỳ chọn importer')
for o in new:
    bpy.data.objects.remove(o, do_unlink=True)
for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.images):     # drop the re-imported datablocks (.001)
    for d_ in [d_ for d_ in coll if d_.users == 0]:
        coll.remove(d_)
# A1.11 size: wingspan (rest pose spreads the wings; catalogue 0.89 H)
xs = co_rig[:, 0]; span = float(xs.max() - xs.min()); target = 0.89 * 1.8
hsel = (co_rig[:, 1] < -0.105) & (np.abs(co_rig[:, 0]) < 0.08) & (co_rig[:, 2] < 0.62)
head_top = float(co_rig[hsel, 2].max())
check('A1.11', abs(span - target) / target <= 0.02, dict(wingspan_m=round(span, 4), target_m=target, deviation_pct=round(100 * (span - target) / target, 3),
      height_rest_m=round(float(co_rig[:, 2].max()), 4), head_top_m=round(head_top, 4), head_top_H=round(head_top / 1.8, 3)), 'sải cánh 0,89H ± 2 %',
      'G1: rest dang cánh nên đo bằng sải; "đứng 0,36H" đo ở tư thế gập (qa_report)')
check('A1.12', abs(float(co_rig[:, 2].min())) <= 0.01, dict(lowest_z_m=round(float(co_rig[:, 2].min()), 6)), '0 ± 0,01 m')
wcount = {g: 0 for g in gn}
for v in me.vertices:
    for g in v.groups:
        if g.weight > 0:
            wcount[gn[g.group]] += 1
unweighted = sorted(n for n in names if wcount.get(n, 0) == 0)
allowed = set(SOCKETS) | {'root', 'cog'}
check('A1.13', set(unweighted) <= allowed, dict(unweighted=unweighted, weighted_bones=sum(1 for n in names if wcount.get(n, 0) > 0)),
      'chỉ socket (+ tổ tiên cấu trúc root, cog: ngoại lệ D01 G1, SKELETON_STANDARD §7)')
bad_obj = []
for o in (ob, rig, ctl):
    sc = o.matrix_world.to_scale()
    if any(abs(c - 1) > 1e-6 for c in sc) or any(abs(c) > 1e-6 for c in o.matrix_world.to_euler()) or o.matrix_world.to_translation().length > 1e-6:
        bad_obj.append(o.name)
check('A1.14', not bad_obj, dict(objects=[ob.name, rig.name, ctl.name], not_identity=bad_obj), 'scale 1, không scale âm, không xoay, gốc 0')
summary = dict(checks=len(V), passed=sum(1 for v in V.values() if v['pass']), failed=[k for k, v in V.items() if not v['pass']])
OUTV = dict(asset=AID, date='2026-10-26', blender=bpy.app.version_string, scope='R4 trên file nguồn .blend (không export GLB ở lượt này)',
            intake=intake, bones=len(names), deform=len(deform), sockets=SOCKETS, weighted_vertex_counts=wcount,
            A1=V, A1_summary=summary)
build = os.path.join(RIG_DIR, '_work', 'w02_build_report.json')
if os.path.exists(build):
    OUTV['build'] = json.load(open(build, encoding='utf-8'))
for i in range(8):
    try:
        with open(os.path.join(RIG_DIR, 'validation.json'), 'w', encoding='utf-8') as f:
            json.dump(OUTV, f, indent=1, ensure_ascii=False)
        break
    except OSError:
        import time; time.sleep(0.5 + i)
print('A1', json.dumps(summary))

# ------------------------------------------------------------------ R5 static renders (images downscaled in memory only)
for im in bpy.data.images:
    if im.size[0] > 1024:
        im.scale(1024, 1024)
CEN = Vector((0, 0.14, 0.38)); SIZE = 1.75
proxy = rb.bone_proxy(rig, '_bones_all', deform_only=False, scale=1.0, posed=True)
rb.render_views(os.path.join(RAW, 'xray'), [ob], views=('front', 'left', 'back', 'topdown'), color_type='TEXTURE', res=1100, xray=True,
                center=CEN, size=SIZE, bones=proxy, bone_xray_alpha=0.30)
rb.render_closeup(os.path.join(RAW, 'xray_head_left.png'), [ob], Vector((0, -0.10, 0.47)), 0.40, view='left', color_type='TEXTURE',
                  res=900, xray=True, alpha=0.3)
rb.render_closeup(os.path.join(RAW, 'xray_head_left_bones.png'), [proxy], Vector((0, -0.10, 0.47)), 0.40, view='left', color_type='VERTEX', res=900)
rb.render_closeup(os.path.join(RAW, 'xray_leg_left.png'), [ob], Vector((0.11, 0.02, 0.19)), 0.42, view='left', color_type='TEXTURE', res=900, xray=True, alpha=0.3)
rb.render_closeup(os.path.join(RAW, 'xray_leg_left_bones.png'), [proxy], Vector((0.11, 0.02, 0.19)), 0.42, view='left', color_type='VERTEX', res=900)
bpy.data.objects.remove(proxy, do_unlink=True)
# weights: dominant colour and single-bone heat
cols = rb.weight_colors(ob)
rb.set_point_colors(ob, cols, 'wcol')
rb.render_views(os.path.join(RAW, 'wcol'), [ob], views=('front', 'back', 'left', 'three_quarter'), color_type='VERTEX', res=900, center=CEN, size=SIZE)
for bn in ('L_Wing_01', 'L_Wing_02', 'L_Wing_03', 'chest', 'neck_02', 'head', 'beak', 'L_Thigh', 'L_Calf', 'L_Foot', 'pelvis', 'tail_01'):
    gi = ob.vertex_groups[bn].index
    wc = []
    for v in me.vertices:
        w = next((g.weight for g in v.groups if g.group == gi), 0.0)
        wc.append((0.25 + 0.75 * w, 0.25 + 0.15 * (1 - w), 0.28 * (1 - w) + 0.1))
    rb.set_point_colors(ob, wc, 'wone')
    view = 'front' if bn not in ('neck_02', 'head', 'beak', 'tail_01', 'L_Calf', 'L_Thigh', 'L_Foot', 'pelvis') else 'left'
    if bn in ('beak', 'head', 'neck_02'):
        rb.render_closeup(os.path.join(RAW, f'w_{bn}_{view}.png'), [ob], Vector((0, -0.12, 0.47)), 0.42, view=view, color_type='VERTEX', res=700)
    else:
        rb.render_views(os.path.join(RAW, f'w_{bn}'), [ob], views=(view,), color_type='VERTEX', res=700, center=CEN, size=SIZE)
print('VALIDATE_OK')
