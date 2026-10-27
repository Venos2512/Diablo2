"""R4 + R5 for W07: A1 checks, control-rig function tests, test poses (numbers + renders).

blender -b --factory-startup -P w07_qa.py [-- --no-render]
Opens rig/W07_shroud_spinner_rig.blend read-only (never saved). Writes rig/validation.json and raw renders to
rig/qa/raw/ (composited by w07_g2_sheets.py). Base colour texture is downscaled to 2048 in memory for rendering.
"""
import bpy, os, sys, json, math, hashlib, struct, colorsys, re
import numpy as np
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import w07_common as C
rb = C.rb

ARGS = C.script_args()
RENDER = '--no-render' not in ARGS
BLEND = C.RIG + '/W07_shroud_spinner_rig.blend'
if '--blend' in ARGS:
    BLEND = ARGS[ARGS.index('--blend') + 1]
ONLY = ARGS[ARGS.index('--only') + 1].split(',') if '--only' in ARGS else None
RAW = C.QA + '/raw'
os.makedirs(RAW, exist_ok=True)
SPEC = json.load(open(C.WORK + '/rig_spec.json'))
BUILD = json.load(open(C.WORK + '/build_report.json'))
rb.open_blend(BLEND)
ob = bpy.data.objects['W07_shroud_spinner']; rig = bpy.data.objects['W07_shroud_spinner_Rig']
ctl = bpy.data.objects['W07_shroud_spinner_Control']
me = ob.data
NV = len(me.vertices)
V = {}


def upd():
    bpy.context.view_layer.update()


def A(key, ok, measured, threshold, note=''):
    V.setdefault('A1', {})[key] = {'pass': bool(ok), 'measured': measured, 'threshold': threshold, 'note': note}


# ------------------------------------------------------------------ A1
mesh_objs = [o for o in bpy.data.objects if o.type == 'MESH']
skinned = [o for o in mesh_objs if any(m.type == 'ARMATURE' for m in o.modifiers)]
mods = [m for m in ob.modifiers if m.type == 'ARMATURE']
A('A1.1', len(mesh_objs) == 1 and len(skinned) == 1 and len(mods) == 1 and mods[0].object == rig,
  dict(mesh_objects=len(mesh_objs), skinned=len(skinned), armature_modifiers=len(mods), target=mods[0].object.name if mods else None),
  'một mesh, một skin (Armature modifier) trỏ vào skeleton runtime')
names = [b.name for b in rig.data.bones]
spec_names = [b['name'] for b in SPEC['bones']]
bad = [n for n in names if not re.fullmatch(r'[A-Za-z0-9_]+', n)]
side_bad = [n for n in names if re.search(r'(\.L|\.R|_left|_right)$', n)]
A('A1.2', sorted(names) == sorted(spec_names) and len(set(names)) == len(names) and not bad and not side_bad,
  dict(count=len(names), unique=len(set(names)), missing=sorted(set(spec_names) - set(names)), extra=sorted(set(names) - set(spec_names)),
       bad_chars=bad, bad_side=side_bad), 'tên đúng bảng G1 (SKELETON_STANDARD §3 Họ A), không trùng, [A-Za-z0-9_], tiền tố L_/R_')
roots = [b.name for b in rig.data.bones if b.parent is None]
A('A1.3', roots == ['root'], dict(roots=roots), 'một cây, gốc duy nhất root')
gn = {g.index: g.name for g in ob.vertex_groups}
Wv = np.zeros((NV, len(gn)), dtype=np.float64)
for v in me.vertices:
    for g in v.groups:
        Wv[v.index, g.group] = g.weight
nz = (Wv > 0).sum(1); sums = Wv.sum(1)
A('A1.4', int((nz == 0).sum()) == 0, dict(vertices=NV, empty=int((nz == 0).sum())), '0 đỉnh trống')
A('A1.5', float(np.abs(sums - 1).max()) <= 1e-6, dict(max_abs_sum_minus_1=float(f'{np.abs(sums - 1).max():.3g}')), '1 ± 1e-6',
  'trọng số float32 của Blender; đo trên vertex group')
hist = {int(k): int(v) for k, v in zip(*np.unique(nz, return_counts=True))}
A('A1.6', int(nz.max()) <= 4, dict(max_influences=int(nz.max()), histogram=hist), '<= 4')
deform = {b.name for b in rig.data.bones if b.use_deform}
groups_bad = [n for n in gn.values() if n not in deform]
A('A1.7', not groups_bad and all(n in rig.data.bones for n in gn.values()),
  dict(vertex_groups=len(gn), deform_bones=len(deform), groups_not_deform=groups_bad),
  'mọi vertex group là bone deform của skeleton runtime (tương đương chỉ số joint hợp lệ)')
# A1.8: rest pose evaluation = bind (hierarchy consistent, inverse binds = inverse(rest world))
upd()
dg = bpy.context.evaluated_depsgraph_get()
ev = ob.evaluated_get(dg).to_mesh(); P_rest_def = np.array([v.co[:] for v in ev.vertices]); ob.evaluated_get(dg).to_mesh_clear()
P_rest = np.array([v.co[:] for v in me.vertices])
bind_err = float(np.abs(P_rest_def - P_rest).max())
hier_err = 0.0
for b in rig.data.bones:
    if b.parent:
        rel = b.parent.matrix_local.inverted() @ b.matrix_local
        hier_err = max(hier_err, max(abs(x) for r in (b.parent.matrix_local @ rel - b.matrix_local) for x in r))
pose_err = 0.0
for pb in rig.pose.bones:
    r = rig.data.bones[pb.name].matrix_local
    pose_err = max(pose_err, max(abs(x) for row in (pb.matrix - r) for x in row))
A('A1.8', bind_err <= 1e-5 and hier_err <= 1e-5 and pose_err <= 1e-5,
  dict(rest_deform_max_m=float(f'{bind_err:.3g}'), hierarchy_max=float(f'{hier_err:.3g}'), rest_pose_vs_bind_max=float(f'{pose_err:.3g}'),
       objects_identity=all(o.matrix_world == Matrix.Identity(4) for o in (ob, rig, ctl))), '<= 1e-5',
  'đo trong Blender: tư thế nghỉ qua rig điều khiển = bind; ma trận bind nghịch đảo của file glTF kiểm ở R8 (lượt này không export)')


# A1.9 + A1.10 straight from the GLB file (no Blender importer)
def glb_parse(path):
    with open(path, 'rb') as f:
        data = f.read()
    off = 12; js = None; bin_ = None
    while off < len(data):
        ln, typ = struct.unpack_from('<II', data, off); chunk = data[off + 8: off + 8 + ln]
        if typ == 0x4E4F534A:
            js = json.loads(chunk)
        elif typ == 0x004E4942:
            bin_ = chunk
        off += 8 + ln
    return js, bin_


js, bin_ = glb_parse(C.GLB)
prim = js['meshes'][0]['primitives'][0]
acc = js['accessors'][prim['attributes']['POSITION']]; bv = js['bufferViews'][acc['bufferView']]
start = bv.get('byteOffset', 0) + acc.get('byteOffset', 0); stride = bv.get('byteStride', 12)
cnt = acc['count']
pos = np.array([struct.unpack_from('<3f', bin_, start + i * stride) for i in range(cnt)], dtype=np.float64)
bl = np.stack([pos[:, 0], -pos[:, 2], pos[:, 1]], 1)          # glTF Y-up -> Blender Z-up
z0 = bl[:, 2].min(); s = C.HEIGHT_M / (bl[:, 2].max() - z0)
bl[:, 2] -= z0; bl *= s
src = np.zeros(NV, dtype=np.int32); me.attributes['src_index'].data.foreach_get('value', src)
d9 = np.linalg.norm(P_rest - bl[src], axis=1)
A('A1.9', float(d9.max()) <= 1e-4 and cnt == BUILD['mesh']['glb_verts'],
  dict(glb_vertices=cnt, rig_vertices=NV, removed_orphan_vertices=cnt - NV, max_dist_m=float(f'{d9.max():.3g}')),
  '<= 1e-4 m', 'so từng đỉnh qua src_index với POSITION của GLB đã scale; 286 đỉnh của 2 đoạn chân rời xoá theo G1 (không so)')
img_sha = {}
for im in js['images']:
    v = js['bufferViews'][im['bufferView']]; b = bin_[v.get('byteOffset', 0): v.get('byteOffset', 0) + v['byteLength']]
    img_sha[im.get('name', str(len(img_sha)))] = hashlib.sha256(b).hexdigest()
blend_sha = {}
for im in bpy.data.images:
    if im.packed_file:
        blend_sha[im.name] = hashlib.sha256(bytes(im.packed_file.data)).hexdigest()
A('A1.10', sorted(img_sha.values()) == sorted(blend_sha.values()),
  dict(glb={k: v[:16] for k, v in img_sha.items()}, blend={k: v[:16] for k, v in blend_sha.items()}),
  'byte giống nhau (sha256 ảnh nhúng GLB = ảnh đóng gói trong .blend)')
zmin, zmax = float(P_rest[:, 2].min()), float(P_rest[:, 2].max())
A('A1.11', abs((zmax - zmin) - C.HEIGHT_M) <= 0.02 * C.HEIGHT_M, dict(height_m=round(zmax - zmin, 5), target_m=C.HEIGHT_M), '± 2 %')
A('A1.12', abs(zmin) <= 0.01, dict(min_z_m=round(zmin, 5)), '0 ± 0,01 m')
used = set(np.nonzero(Wv.sum(0) > 0)[0]); used_names = {gn[i] for i in used}
unweighted = sorted(n for n in names if n not in used_names)
expected_unw = sorted(b['name'] for b in SPEC['bones'] if not b['deform'])
A('A1.13', unweighted == expected_unw, dict(unweighted=unweighted),
  'chỉ root, cog (tổ tiên cấu trúc, SKELETON_STANDARD §7) và socket')
tr_ok = all(o.matrix_world == Matrix.Identity(4) and min(o.scale) > 0 for o in (ob, rig, ctl))
A('A1.14', tr_ok, dict({o.name: dict(loc=list(o.location), rot=list(o.rotation_euler), scale=list(o.scale)) for o in (ob, rig, ctl)}),
  'scale 1, không âm, xoay đã áp dụng')
V['A1_summary'] = f"{sum(1 for x in V['A1'].values() if x['pass'])}/{len(V['A1'])}"

# ------------------------------------------------------------------ weight health per part (welded islands)
rep, _ = C.weld_map(ob, dist=1e-5); rep = np.array(rep)
lab, groups = C.welded_islands(ob, rep); lab = np.array(lab)
V['weights'] = dict(by_group={gn[j]: int((Wv[:, j] > 0).sum()) for j in range(len(gn))},
                    influences_hist=hist, build=BUILD['skin'], pruned_over4_at_build=BUILD['weights']['pruned_over4'])
# co-located vertices (UV/normal seams) must share weights
grp = {}
for i, r in enumerate(rep):
    grp.setdefault(int(r), []).append(i)
dup = [g for g in grp.values() if len(g) > 1]
wdiff = max((float(np.abs(Wv[g] - Wv[g[0]]).max()) for g in dup), default=0.0)
V['weights']['colocated_groups'] = len(dup); V['weights']['colocated_weight_diff_max'] = wdiff

# ------------------------------------------------------------------ helpers for posing / measuring
LEGS = [(s, n) for s in 'LR' for n in range(1, 5)]
CB = ctl.pose.bones


def reset():
    for pb in CB:
        pb.location = (0, 0, 0); pb.rotation_quaternion = (1, 0, 0, 0); pb.rotation_euler = (0, 0, 0); pb.scale = (1, 1, 1)
    for s, n in LEGS:
        ctl[f'ik_leg_{s}{n}'] = 1.0
    upd()


def move(name, delta):
    upd(); pb = CB[name]; M = pb.matrix.copy(); M.translation = M.translation + Vector(delta); pb.matrix = M; upd()


def rot(name, axis, deg, pivot=None):
    upd(); pb = CB[name]; M = pb.matrix.copy(); h = Vector(pivot) if pivot is not None else M.translation.copy()
    R = Matrix.Rotation(math.radians(deg), 4, Vector(axis).normalized())
    pb.matrix = Matrix.Translation(h) @ R @ Matrix.Translation(-h) @ M; upd()


def tip_errors():
    out = {}
    for s, n in LEGS:
        if ctl[f'ik_leg_{s}{n}'] < 0.5:
            continue
        t = rig.pose.bones[f'{s}_Leg{n}_04'].tail; g = CB[f'ctl_{s}_Leg{n}_IK'].head
        out[f'{s}{n}'] = (t - g).length
    return out


def evaluated():
    dg = bpy.context.evaluated_depsgraph_get(); e = ob.evaluated_get(dg).to_mesh()
    P = np.array([v.co[:] for v in e.vertices]); ob.evaluated_get(dg).to_mesh_clear()
    return P


ROLE_OF = {}
isl_n = {k: len(g) for k, g in enumerate(groups)}
for k, g in enumerate(groups):
    n = isl_n[k]; x = P_rest[g][:, 0].mean()
    ROLE_OF[k] = ('abdomen' if n == 1400 else 'ceph' if n == 565 else
                  'leg' if n in (409, 246, 248, 318) else 'other')
vrole = np.array([ROLE_OF[int(l)] for l in lab])
me.calc_loop_triangles()
TRI = np.array([t.vertices[:] for t in me.loop_triangles])


def inside_count(P, target_role, query_mask):
    """Vertices of query_mask inside the (deformed) target island: generalised winding number |w| > 0.5
    (robust for the open, non-manifold Tripo shells; invariant under rigid motion)."""
    tv = set(np.nonzero(vrole == target_role)[0].tolist())
    T = np.array([t for t in TRI if t[0] in tv])
    A_, B_, C_ = P[T[:, 0]], P[T[:, 1]], P[T[:, 2]]
    Q = P[np.nonzero(query_mask)[0]]
    c = 0
    for ch in np.array_split(Q, max(1, len(Q) // 128)):
        a = A_[None] - ch[:, None]; b = B_[None] - ch[:, None]; d = C_[None] - ch[:, None]
        la, lb, ld = (np.linalg.norm(x, axis=2) for x in (a, b, d))
        det = np.einsum('ijk,ijk->ij', a, np.cross(b, d))
        den = la * lb * ld + np.einsum('ijk,ijk->ij', a, b) * ld + np.einsum('ijk,ijk->ij', b, d) * la + np.einsum('ijk,ijk->ij', d, a) * lb
        w = (2 * np.arctan2(det, den)).sum(1) / (4 * math.pi)
        c += int((np.abs(w) > 0.5).sum())
    return c


def inside_depth(P, target_role, query_mask):
    """Max depth (mm) of query vertices inside the target island (winding number inside + nearest-surface distance)."""
    tv = set(np.nonzero(vrole == target_role)[0].tolist())
    T = [list(t) for t in TRI if t[0] in tv]
    bvh = BVHTree.FromPolygons([Vector(p) for p in P], T, all_triangles=True)
    idx = np.nonzero(query_mask)[0]; inside = np.zeros(len(idx), dtype=bool)
    A_, B_, C_ = (P[np.array(T)[:, k]] for k in range(3))
    for ci, ch in zip(np.array_split(np.arange(len(idx)), max(1, len(idx) // 128)), np.array_split(P[idx], max(1, len(idx) // 128))):
        a = A_[None] - ch[:, None]; b = B_[None] - ch[:, None]; d = C_[None] - ch[:, None]
        la, lb, ld = (np.linalg.norm(x, axis=2) for x in (a, b, d))
        det = np.einsum('ijk,ijk->ij', a, np.cross(b, d))
        den = la * lb * ld + np.einsum('ijk,ijk->ij', a, b) * ld + np.einsum('ijk,ijk->ij', b, d) * la + np.einsum('ijk,ijk->ij', d, a) * lb
        inside[ci] = np.abs((2 * np.arctan2(det, den)).sum(1) / (4 * math.pi)) > 0.5
    dep = [bvh.find_nearest(Vector(P[i]))[3] for i in idx[inside]]
    return round(1000 * max(dep), 1) if dep else 0.0


EDGES = np.array([e.vertices[:] for e in me.edges]); L0 = np.linalg.norm(P_rest[EDGES[:, 0]] - P_rest[EDGES[:, 1]], axis=1)
MINLEN = 0.004 * (C.HEIGHT_M / 1.8)
dup_pairs = np.array([(g[0], j) for g in dup for j in g[1:]])


def metrics(P):
    keep = L0 >= MINLEN
    L1 = np.linalg.norm(P[EDGES[:, 0]] - P[EDGES[:, 1]], axis=1)
    q = L1[keep] / L0[keep]; qq = np.maximum(q, 1 / np.maximum(q, 1e-9))
    i = int(np.argmax(qq)); e = EDGES[keep][i]
    gap = float(np.linalg.norm(P[dup_pairs[:, 0]] - P[dup_pairs[:, 1]], axis=1).max()) if len(dup_pairs) else 0.0
    return dict(stretch=round(float(qq.max()), 3), bad_edges=int(((q > 1.6) | (q < 0.5)).sum()),
                worst_edge_mm=round(1000 * float(abs(L1[keep][i] - L0[keep][i])), 1),
                worst_at=[round(x, 3) for x in ((P[e[0]] + P[e[1]]) / 2).tolist()],
                worst_role=str(vrole[e[0]]), seam_gap_mm=round(1000 * gap, 4))


# ------------------------------------------------------------------ control rig function tests
reset()
F = {}
F['rest_runtime_max_dev'] = float(f"{max(max(abs(x) for row in (pb.matrix - rig.data.bones[pb.name].matrix_local) for x in row) for pb in rig.pose.bones):.3g}")
moved = {}
for s, n in LEGS:
    reset(); tip = CB[f'ctl_{s}_Leg{n}_IK'].head; root = rig.data.bones[f'{s}_Leg{n}_01'].head_local
    hin = Vector((root.x - tip.x, root.y - tip.y, 0)).normalized()
    move(f'ctl_{s}_Leg{n}_IK', tuple(hin * 0.12 + Vector((0, -0.08, 0.20))))
    moved[f'{s}{n}'] = round(1000 * tip_errors()[f'{s}{n}'], 3)
F['foot_follow_error_mm'] = moved
reset(); move('ctl_cog', (0, 0, -0.30))
F['cog_down_0.30_tip_error_mm_max'] = round(1000 * max(tip_errors().values()), 3)
knees = {f'{s}{n}': round(rig.pose.bones[f'{s}_Leg{n}_03'].head.z - rig.data.bones[f'{s}_Leg{n}_03'].head_local.z, 3) for s, n in LEGS}
F['cog_down_0.30_knee_dz_m'] = knees
reset(); ctl['ik_leg_L1'] = 0.0; upd(); move('ctl_cog', (0, 0, -0.10))
F['fk_switch_L1_tip_moves_with_body_m'] = round((rig.pose.bones['L_Leg1_04'].tail - CB['ctl_L_Leg1_IK'].head).length, 3)
reset()
V['control_rig'] = F
print('function', json.dumps(F))

# ------------------------------------------------------------------ test poses
GA = [('L', 1), ('R', 2), ('L', 3), ('R', 4)]; GB = [('R', 1), ('L', 2), ('R', 3), ('L', 4)]


def lift(s, n):
    tip = CB[f'ctl_{s}_Leg{n}_IK'].head; root = rig.data.bones[f'{s}_Leg{n}_01'].head_local
    h = Vector((root.x - tip.x, root.y - tip.y, 0)).normalized()
    move(f'ctl_{s}_Leg{n}_IK', tuple(h * 0.18 + Vector((0, 0, 0.35))))


def gait(up, back):
    for s, n in up:
        move(f'ctl_{s}_Leg{n}_IK', (0, -0.15, 0.22))
    for s, n in back:
        move(f'ctl_{s}_Leg{n}_IK', (0, 0.10, 0.0))
    move('ctl_cog', (0, -0.03, -0.02))


def pose_body_low():
    move('ctl_cog', (0, 0, -0.30))


def pose_rear_up():
    move('ctl_cog', (0, 0.04, 0.08)); rot('ctl_cog', (1, 0, 0), -15)
    for s in 'LR':
        sg = 1 if s == 'L' else -1
        move(f'ctl_{s}_Leg1_IK', (0.0, -0.05, 0.42)); rot(f'ctl_{s}_Leg1_IK', (1, 0, 0), -60)   # tarsus points forward
        move(f'ctl_{s}_Leg2_IK', (0, 0.0, 0.10))


def pose_fangs():
    for s in 'LR':
        sg = 1 if s == 'L' else -1
        rot(f'ctl_{s}_fang', (1, 0, 0), -25); rot(f'ctl_{s}_fang', (0, 1, 0), -30 * sg)
        rot(f'ctl_{s}_Palp_01', (1, 0, 0), -20); rot(f'ctl_{s}_Palp_01', (0, 1, 0), -15 * sg)
        rot(f'ctl_{s}_Palp_02', (1, 0, 0), -45)
    move('ctl_cog', (0, 0, 0.05)); rot('ctl_cog', (1, 0, 0), -8)


def pose_turn(deg):
    rot('ctl_cog', (0, 0, 1), deg)


def pose_abdomen(pitch=10, yaw=10, curl=-12):
    rot('ctl_abdomen_01', (1, 0, 0), pitch); rot('ctl_abdomen_01', (0, 0, 1), yaw); rot('ctl_abdomen_02', (1, 0, 0), curl)


POSES = {'gait_A': lambda: gait(GA, GB), 'gait_B': lambda: gait(GB, GA), 'body_low': pose_body_low, 'rear_up': pose_rear_up,
         'fangs': pose_fangs, 'turn_L': lambda: pose_turn(20), 'turn_R': lambda: pose_turn(-20), 'abdomen': pose_abdomen,
         'abdomen_max': lambda: pose_abdomen(15, 12, -20), 'rest': lambda: None}
for s, n in LEGS:
    POSES[f'lift_{s}{n}'] = (lambda s=s, n=n: lift(s, n))

legmask = vrole == 'leg'
rest_in = dict(legs_in_ceph=inside_count(P_rest, 'ceph', legmask), legs_in_abdomen=inside_count(P_rest, 'abdomen', legmask),
               abdomen_in_ceph=inside_count(P_rest, 'ceph', vrole == 'abdomen'))
V['penetration_rest'] = rest_in
res = {}
if RENDER:
    for im in bpy.data.images:
        if im.size[0] > 2048:
            im.scale(2048, 2048)
    spider = {b['name']: b for b in SPEC['bones']}
    HUE = {'leg1': 0.00, 'leg2': 0.13, 'leg3': 0.33, 'leg4': 0.58, 'palp': 0.47, 'head': 0.90}

    def spider_color(name):
        b = spider.get(name)
        if not b or b['group'] in ('root', 'socket'):
            return (0.55, 0.55, 0.55)
        if name == 'cephalothorax':
            return (1.0, 0.85, 0.25)
        if name == 'abdomen_01':
            return (1.0, 0.55, 0.75)
        if name == 'abdomen_02':
            return (0.75, 0.30, 0.95)
        seg = int(name[-2:]) if name[-2:].isdigit() else 1
        return colorsys.hsv_to_rgb(HUE[b['group']], 0.85 if name.startswith('L_') else 0.45, 1.0 - 0.13 * (seg - 1))
    rb.bone_color = spider_color            # this process only; rigbatch.py is not modified
    cam = rb.setup_render(900); sh = bpy.context.scene.display.shading
    lo, hi = Vector(P_rest.min(0)), Vector(P_rest.max(0)); ctr = (lo + hi) / 2; size = max(hi - lo) * 1.12
    VIEWS = {'front': (0, -1, 0), 'left': (1, 0, 0), 'right': (-1, 0, 0), 'back': (0, 1, 0), 'topdown': (0, 0, 1),
             'three_quarter': (0.7, -0.7, 0.45)}

    def cam_to(view, center=None, sz=None):
        d = Vector(VIEWS[view] if isinstance(view, str) else view).normalized(); c = Vector(center) if center else ctr
        cam.data.type = 'ORTHO'; cam.data.ortho_scale = sz or size; cam.location = c + d * 12
        cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler(); upd()

    # skeleton overlay (rest)
    reset(); rig.hide_set(False); proxy = rb.bone_proxy(rig, posed=False)
    for v in ('front', 'left', 'back', 'topdown'):
        cam_to(v); rb.only_visible([ob]); sh.color_type = 'SINGLE'; sh.single_color = (0.80, 0.78, 0.74); sh.show_xray = True; sh.xray_alpha = 0.30
        rb.render_to(f'{RAW}/skel_{v}.png'); sh.show_xray = False
        rb.only_visible([proxy]); sh.color_type = 'VERTEX'; rb.render_to(f'{RAW}/skel_{v}_bones.png')
    bpy.data.objects.remove(proxy)
    # weight colours
    rb.set_point_colors(ob, rb.weight_colors(ob), name='wcol')
    for v in ('front', 'left', 'topdown', 'three_quarter'):
        cam_to(v); rb.only_visible([ob]); sh.color_type = 'VERTEX'; rb.render_to(f'{RAW}/wcol_{v}.png')
    knee = Vector(spider['L_Leg3_03']['head']); cam_to((0.3, -1, 0.15), center=knee + Vector((0.1, 0, -0.1)), sz=0.9)
    rb.render_to(f'{RAW}/wcol_leg3_close.png')
    cam_to((0.25, -0.35, -1), center=(0.0, -0.40, 0.62), sz=1.0); rb.render_to(f'{RAW}/wcol_roots_below.png')
    cam_to((0.35, 0.8, -0.25), center=(0.0, 0.80, 0.62), sz=0.95); rb.render_to(f'{RAW}/wcol_abdomen_cap.png')
    rb.clear_point_colors(ob, name='wcol')

for name, fn in POSES.items():
    if ONLY and name not in ONLY:
        continue
    reset(); fn()
    P = evaluated(); m = metrics(P)
    te = tip_errors(); m['tip_error_mm_max'] = round(1000 * max(te.values()), 3) if te else None
    m['tip_error_over1mm'] = {k: round(1000 * x, 1) for k, x in te.items() if x > 0.001}
    if not name.startswith('lift_'):
        m['legs_in_ceph'] = inside_count(P, 'ceph', legmask); m['legs_in_abdomen'] = inside_count(P, 'abdomen', legmask)
        m['abdomen_in_ceph'] = inside_count(P, 'ceph', vrole == 'abdomen')
        m['abdomen_in_ceph_depth_mm'] = inside_depth(P, 'ceph', vrole == 'abdomen')
    res[name] = m
    print(name, json.dumps(m))
    if RENDER:
        if name.startswith('lift_'):
            cam_to('left' if name[5] == 'L' else 'right'); rb.only_visible([ob]); sh.color_type = 'TEXTURE'
            rb.render_to(f'{RAW}/pose_{name}_side.png')
            lb = [f'{name[5]}_Leg{name[6]}_0{i}' for i in range(1, 5)]
            cols = [c if c != (0.15, 0.15, 0.15) else (0.80, 0.78, 0.74) for c in rb.weight_colors(ob, bones=lb)]
            rb.set_point_colors(ob, cols, name='hl'); sh.color_type = 'VERTEX'
            cam_to('left' if name[5] == 'L' else 'right'); rb.render_to(f'{RAW}/pose_{name}_side_hl.png')
            cam_to('three_quarter' if name[5] == 'L' else (-0.7, -0.7, 0.45)); rb.render_to(f'{RAW}/pose_{name}_3q_hl.png')
            rb.clear_point_colors(ob, name='hl')
            if name in ('lift_L2', 'lift_L1'):
                rb.set_point_colors(ob, rb.stretch_colors(ob), name='heat')
                j = Vector(spider['L_Leg2_02' if name == 'lift_L2' else 'L_Leg1_02']['head'])
                pbj = rig.pose.bones['L_Leg2_02' if name == 'lift_L2' else 'L_Leg1_02'].head
                cam_to((0.5, -0.6, 0.6), center=pbj, sz=0.45); sh.color_type = 'VERTEX'; rb.render_to(f'{RAW}/pose_{name}_hip_heat.png')
                sh.color_type = 'TEXTURE'; rb.render_to(f'{RAW}/pose_{name}_hip_tex.png')
                rb.clear_point_colors(ob, name='heat')
            continue
        if name.startswith('gait'):
            up = GA if name == 'gait_A' else GB
            ub = {f'{s_}_Leg{n_}_0{i}' for s_, n_ in up for i in range(1, 5)}
            dn = {f'{s_}_Leg{n_}_0{i}' for s_, n_ in LEGS for i in range(1, 5)} - ub
            gnames = {g.index: g.name for g in ob.vertex_groups}; cols = []
            for v in me.vertices:
                wu = sum(g.weight for g in v.groups if gnames[g.group] in ub); wd = sum(g.weight for g in v.groups if gnames[g.group] in dn)
                cols.append((1.0, 0.55, 0.15) if wu > 0.5 else (0.25, 0.55, 1.0) if wd > 0.5 else (0.80, 0.78, 0.74))
            rb.set_point_colors(ob, cols, name='hl'); sh.color_type = 'VERTEX'
            for v in ('topdown', 'left'):
                cam_to(v); rb.only_visible([ob]); rb.render_to(f'{RAW}/pose_{name}_{v}_hl.png')
            rb.clear_point_colors(ob, name='hl')
        views = ('front', 'left', 'three_quarter') + (('topdown',) if name.startswith('gait') else ())
        for v in views:
            cam_to(v); rb.only_visible([ob]); sh.color_type = 'TEXTURE'; rb.render_to(f'{RAW}/pose_{name}_{v}.png')
        rb.set_point_colors(ob, rb.stretch_colors(ob), name='heat')
        cam_to('three_quarter'); sh.color_type = 'VERTEX'; rb.render_to(f'{RAW}/pose_{name}_heat.png')
        rb.clear_point_colors(ob, name='heat')
        if name in ('fangs', 'rest'):
            for v, d in (('fangs_front', (0, -1, 0.1)), ('fangs_fq', (0.6, -0.8, 0.2))):
                cam_to(d, center=(0, -0.78, 0.68), sz=0.9); sh.color_type = 'TEXTURE'; rb.render_to(f'{RAW}/pose_{name}_{v}.png')
            if name == 'fangs':
                rb.set_point_colors(ob, rb.stretch_colors(ob), name='heat')
                cam_to((0.8, -0.6, 0.15), center=rig.pose.bones['L_Palp_02'].head, sz=0.5); sh.color_type = 'VERTEX'
                rb.render_to(f'{RAW}/pose_fangs_palp_heat.png'); sh.color_type = 'TEXTURE'; rb.render_to(f'{RAW}/pose_fangs_palp_tex.png')
                rb.clear_point_colors(ob, name='heat')
        if name.startswith('abdomen'):
            rb.set_point_colors(ob, rb.stretch_colors(ob), name='heat')
            cam_to((0.6, 0.6, 0.3), center=(0, 0.55, 0.80), sz=1.3); sh.color_type = 'VERTEX'; rb.render_to(f'{RAW}/pose_{name}_back_heat.png')
            rb.clear_point_colors(ob, name='heat')
reset()
V['poses'] = res
V['asset'] = C.ASSET; V['date'] = '2026-10-26'; V['blender'] = bpy.app.version_string
V['inputs'] = dict(glb=C.GLB, glb_sha256=C.GLB_SHA, blend='rig/W07_shroud_spinner_rig.blend',
                   blend_sha256=C.sha256(BLEND), scale=BUILD['mesh']['scale'], height_m=C.HEIGHT_M, k=C.HEIGHT_M / 1.8)
V['mesh'] = BUILD['mesh']; V['bones'] = BUILD['bones']; V['pole_angles'] = BUILD['pole_angles']
V['stretch_measure'] = f'edge length posed/rest, max(q, 1/q), edges >= {MINLEN * 1000:.1f} mm; bad = q > 1.6 or q < 0.5'
if ONLY is None and RENDER:
    C.jdump(C.RIG + '/validation.json', V)
else:
    C.jdump(C.WORK + '/validation_trial.json', V)
print('QA_DONE', V['A1_summary'])
