"""P03 Hush-Moths R4: automatic checks (QA_CHECKLIST A1) + variant B + numbers on the QA poses -> rig/validation.json.

blender -b --factory-startup -P p03_r4_validate.py
Opens rig/P03_hush_moths_rig.blend read only (never saved here). The GLB is re-imported once for A1.9 / A1.10.
"""
import bpy, sys, os, json, hashlib, struct, math, time
import numpy as np
from mathutils import Vector, Matrix, kdtree
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import p03_common as pc  # noqa: E402
import p03_skeleton as sk  # noqa: E402
import p03_skin as skin  # noqa: E402
import p03_qa as qa  # noqa: E402

RIG = pc.ADIR + '/rig'
t0 = time.time()
bpy.ops.wm.open_mainfile(filepath=RIG + '/P03_hush_moths_rig.blend')
ob = bpy.data.objects['P03_hush_moths']; rig = bpy.data.objects['P03_hush_moths_rig']; ctl = bpy.data.objects['P03_hush_moths_ctl']
me = ob.data; N = len(me.vertices)
H_CAT = float(rig['height_m']); S = float(rig['scale_glb_to_m'])
V = dict(asset=pc.ASSET, date='2026-10-26', blender=bpy.app.version_string, file='rig/P03_hush_moths_rig.blend', height_catalog_m=H_CAT,
         scale_glb_to_m=S, A1={}, notes=[])

# ------------------------------------------------------------------ weights as a matrix
gn = [g.name for g in ob.vertex_groups]
Wm = np.zeros((N, len(gn)))
for v in me.vertices:
    for g in v.groups:
        Wm[v.index, g.group] = g.weight
deform = [b.name for b in rig.data.bones if b.use_deform]
nondeform = [b.name for b in rig.data.bones if not b.use_deform]
EXPECT_CORE = ['root', 'cog', 'thorax', 'head', 'abdomen_01', 'abdomen_02', 'abdomen_03']
for s in ('L', 'R'):
    EXPECT_CORE += [f'{s}_antenna_01', f'{s}_antenna_02', f'{s}_WingF_01', f'{s}_WingF_02', f'{s}_WingB_01', f'{s}_WingB_02']
    EXPECT_CORE += [f'{s}_Leg{n}_0{k}' for n in (1, 2, 3) for k in (1, 2, 3)]
EXPECT_SOCK = ['ground', 'hit_origin', 'fx_thorax', 'fx_head', 'fx_wing_L', 'fx_wing_R']
names = [b.name for b in rig.data.bones]


def res(key, ok, value, threshold):
    V['A1'][key] = dict(pass_=bool(ok), value=value, threshold=threshold)


skinned = [o for o in bpy.data.objects if o.type == 'MESH' and any(m.type == 'ARMATURE' for m in o.modifiers)]
res('A1.1_one_skin_one_mesh', len(skinned) == 1 and sum(m.type == 'ARMATURE' for m in ob.modifiers) == 1,
    dict(skinned_meshes=[o.name for o in skinned], armature_modifiers=sum(m.type == 'ARMATURE' for m in ob.modifiers)), '1 / 1')
bad_names = [n for n in names if ('.' in n or ' ' in n or (n.endswith(('_L', '_R')) and not n.startswith('fx_')))]
res('A1.2_bone_names', sorted(names) == sorted(EXPECT_CORE + EXPECT_SOCK) and not bad_names and len(set(names)) == len(names),
    dict(count=len(names), missing=sorted(set(EXPECT_CORE + EXPECT_SOCK) - set(names)), extra=sorted(set(names) - set(EXPECT_CORE + EXPECT_SOCK)),
         bad=bad_names), 'bảng G1 (SKELETON_STANDARD §3, họ W côn trùng bay), không trùng')
roots = [b.name for b in rig.data.bones if b.parent is None]
res('A1.3_single_tree_root', roots == ['root'], dict(roots=roots), "một gốc 'root'")
cnt = (Wm > 0).sum(1); sums = Wm.sum(1)
res('A1.4_no_empty_vertex', int((cnt == 0).sum()) == 0, int((cnt == 0).sum()), '0')
res('A1.5_weight_sum', float(np.abs(sums - 1).max()) <= 1e-6, float(np.abs(sums - 1).max()), '1 ± 1e-6')
res('A1.6_max_influences', int(cnt.max()) <= 4, dict(max=int(cnt.max()), histogram={int(k): int((cnt == k).sum()) for k in range(1, 5)}), '≤ 4')
unknown = sorted(set(gn) - set(deform))
res('A1.7_groups_map_to_deform_bones', not unknown, dict(groups=len(gn), unknown_or_non_deform=unknown), 'mọi group là bone deform')
# A1.8 (Blender-side equivalent): child rest relative to parent is rigid (orthonormal, det 1) -> IBMs follow the hierarchy
err8 = 0.0
for b in rig.data.bones:
    Mr = b.matrix_local if b.parent is None else b.parent.matrix_local.inverted() @ b.matrix_local
    R = Mr.to_3x3()
    err8 = max(err8, float(np.abs(np.array(R @ R.transposed()) - np.eye(3)).max()), abs(R.determinant() - 1))
res('A1.8_bind_hierarchy (Blender)', err8 <= 1e-5, err8, '≤ 1e-5 (kiểm lại trên GLB ở R8)')

# A1.9 / A1.10: re-import the GLB, same scale/offset as the intake
info = json.loads(ob['rb_intake'])
before = set(bpy.data.objects); before_img = set(bpy.data.images)
bpy.ops.import_scene.gltf(filepath=pc.GLB, merge_vertices=True)
new = [o for o in bpy.data.objects if o not in before and o.type == 'MESH']
src = new[0]; Mw = src.matrix_world.copy()
Q = np.array([(Mw @ v.co) for v in src.data.vertices]) * info['scale'] - np.array(info['offset'])
P0 = np.array([v.co[:] for v in me.vertices])
same_count = len(Q) == len(P0)
d9 = float(np.linalg.norm(Q - P0, axis=1).max()) if same_count else None
res('A1.9_mesh_matches_scaled_input', same_count and d9 <= 1e-4, dict(max_m=d9, verts=len(P0), reimport_verts=len(Q)), '≤ 1e-4 m')
for o in [o for o in bpy.data.objects if o not in before]:
    bpy.data.objects.remove(o)
for im in [i for i in bpy.data.images if i not in before_img]:
    bpy.data.images.remove(im)
# GLB image bytes
with open(pc.GLB, 'rb') as f:
    blob = f.read()
jlen = struct.unpack_from('<I', blob, 12)[0]; J = json.loads(blob[20:20 + jlen])
bin_off = 20 + jlen + 8
glb_imgs = {}
for im in J.get('images', []):
    bv = J['bufferViews'][im['bufferView']]
    data = blob[bin_off + bv.get('byteOffset', 0): bin_off + bv.get('byteOffset', 0) + bv['byteLength']]
    glb_imgs[im.get('name', '?')] = hashlib.sha256(data).hexdigest()
blend_imgs = {}
for im in bpy.data.images:
    if im.packed_file:
        blend_imgs[im.name] = hashlib.sha256(bytes(im.packed_file.data)).hexdigest()
res('A1.10_textures_unchanged', sorted(glb_imgs.values()) == sorted(blend_imgs.values()) and len(glb_imgs) == 3,
    dict(glb=glb_imgs, blend=blend_imgs), 'byte giống nhau (sha256)')
zmax = float(P0[:, 2].max()); zmin = float(P0[:, 2].min())
res('A1.11_height', abs(zmax - H_CAT) / H_CAT <= 0.02, dict(height_m=round(zmax, 4), catalog_m=H_CAT), '±2 %')
res('A1.12_feet_on_ground', abs(zmin) <= 0.01, round(zmin, 5), '0 ± 0.01 m')
w_by_bone = {n: int((Wm[:, gn.index(n)] > 0).sum()) if n in gn else 0 for n in names}
unweighted = sorted(n for n in names if w_by_bone[n] == 0)
res('A1.13_unweighted_bones', sorted(unweighted) == sorted(['root', 'cog'] + EXPECT_SOCK),
    dict(unweighted=unweighted, note='root, cog = tổ tiên cấu trúc (giữ), còn lại là socket'), 'chỉ socket (+ root, cog)')
objs = [ob, rig, ctl]
tr = {o.name: dict(scale=[round(x, 6) for x in o.scale], rot=[round(x, 6) for x in o.rotation_euler], loc=[round(x, 6) for x in o.location],
                   world_identity=bool(np.allclose(np.array(o.matrix_world), np.eye(4), atol=1e-6))) for o in objs}
res('A1.14_transforms', all(v['world_identity'] for v in tr.values()), tr, 'scale 1, không âm, xoay đã áp dụng')

# ------------------------------------------------------------------ extra: symmetry of weights, B collapse, coverage, islands
kd = kdtree.KDTree(N)
for i, p in enumerate(P0):
    kd.insert(p, i)
kd.balance()
col = {n: i for i, n in enumerate(gn)}


def mname(n):
    return 'R_' + n[2:] if n.startswith('L_') else 'L_' + n[2:] if n.startswith('R_') else n


perm = [col[mname(n)] for n in gn]
WB, nB = skin.collapse(Wm, gn, sk.B_COLLAPSE)
cB = (WB > 1e-9).sum(1)
V['variant_B'] = dict(bones_runtime=len([n for n in names if n not in sk.B_COLLAPSE and n not in sk.B_DROP_SOCKETS]),
                      deform=len(nB), max_influences=int(cB.max()), sum_max_dev=float(np.abs(WB.sum(1) - 1).max()),
                      empty=int((cB == 0).sum()), collapse=sk.B_COLLAPSE, dropped_sockets=sk.B_DROP_SOCKETS)
V['weights_per_bone'] = {n: dict(verts=int((Wm[:, col[n]] > 0).sum()), dominant=int((Wm[:, col[n]] >= 0.5).sum())) for n in gn}

import bmesh  # noqa: E402
bm = bmesh.new(); bm.from_mesh(me); bm.verts.ensure_lookup_table()
seen = [-1] * N; isl = []
for v in bm.verts:
    if seen[v.index] >= 0:
        continue
    k = len(isl); st = [v]; seen[v.index] = k; comp = []
    while st:
        a = st.pop(); comp.append(a.index)
        for e in a.link_edges:
            b = e.other_vert(a)
            if seen[b.index] < 0:
                seen[b.index] = k; st.append(b)
    isl.append(comp)
bnd = np.zeros(len(isl), dtype=int); nonman = np.zeros(len(isl), dtype=int)
for e in bm.edges:
    k = seen[e.verts[0].index]; nf = len(e.link_faces)
    if nf == 1:
        bnd[k] += 1
    elif nf > 2:
        nonman[k] += 1
bm.free()


def dominant_role(comp):
    tot = Wm[comp].sum(0); n = gn[int(np.argmax(tot))]
    if n in ('thorax', 'abdomen_01', 'abdomen_02', 'abdomen_03') and len(comp) > 1000:
        return 'body'
    if n == 'head':
        return 'head/eye'
    for key in ('antenna', 'WingF', 'WingB', 'Leg1', 'Leg2', 'Leg3'):
        if key in n:
            return n[:2] + key
    return n


roles = [dominant_role(c) for c in isl]
V['islands'] = dict(count=len(isl), open_islands={f'{roles[k]}#{k}': dict(verts=len(isl[k]), boundary_edges=int(bnd[k]), nonmanifold=int(nonman[k]))
                                                   for k in range(len(isl)) if bnd[k] or nonman[k]})
# weight symmetry: mirror partner searched among the vertices of the same kind of part (leg with leg, body with body...)
kind = {k: roles[k].replace('L_', '').replace('R_', '') for k in range(len(isl))}
by_kind = {}
for k, c in enumerate(isl):
    by_kind.setdefault(kind[k], []).extend(c)
kdk = {}
for kk, vv in by_kind.items():
    t = kdtree.KDTree(len(vv))
    for i in vv:
        t.insert(P0[i], i)
    t.balance(); kdk[kk] = t
dmax = 0.0; dsum = 0.0; far = 0; worst = None
for i, p in enumerate(P0):
    _, j, dd = kdk[kind[seen[i]]].find((-p[0], p[1], p[2]))
    if dd > 0.002:
        far += 1; continue
    diff = float(np.abs(Wm[i] - Wm[j][perm]).max()); dsum += diff
    if diff > dmax:
        dmax = diff; worst = [round(float(x), 4) for x in p]
V['weights_symmetry'] = dict(max_abs_diff=round(dmax, 4), at=worst, mean_abs_diff=round(dsum / max(1, N - far), 6),
                             verts_without_mirror_2mm=far, note='mirror partner among the same kind of part')
# coincident cross-island groups (weights averaged at R3)
cross = []
for i in range(N):
    for (_, j, dd) in kd.find_range(P0[i], 1e-6):
        if j > i and seen[j] != seen[i]:
            cross.append((roles[seen[i]], roles[seen[j]]))
from collections import Counter  # noqa: E402
V['coincident_cross_island'] = {f'{a} | {b}': c for (a, b), c in Counter(cross).items()}

# ------------------------------------------------------------------ QA poses (numbers)
role_v = {r: np.array([i for k, c in enumerate(isl) if roles[k] == r for i in c]) for r in set(roles)}
body_v = role_v['body']; head_v = role_v['head/eye']
wingF = {s: role_v[f'{s}_WingF'] for s in 'LR'}; wingB = {s: role_v[f'{s}_WingB'] for s in 'LR'}
legs_v = np.concatenate([role_v[f'{s}_Leg{n}'] for s in 'LR' for n in (1, 2, 3)])
ant_v = np.concatenate([v for r, v in role_v.items() if 'antenna' in r])
abd_v = body_v[(Wm[body_v][:, [col['abdomen_01'], col['abdomen_02'], col['abdomen_03']]].sum(1) >= 0.5)]
F_body = qa.island_faces(me, body_v); F_wF = {s: qa.island_faces(me, wingF[s]) for s in 'LR'}; F_wB = {s: qa.island_faces(me, wingB[s]) for s in 'LR'}
# hind-wing vertices close to the fore wing at rest (the layered zone): unsigned gap + inside flag (parity, closed slabs)
close = {}
for s_ in 'LR':
    bvh = qa.bvh_of(P0, F_wF[s_]); ins, du = qa.near_inside(bvh, P0[wingB[s_]])
    m = du < 0.015
    close[s_] = (wingB[s_][m], du[m], ins[m])
foot_tip = {}
for s_ in 'LR':
    for n in (1, 2, 3):
        vv = role_v[f'{s_}_Leg{n}']; foot_tip[f'{s_}_Leg{n}'] = int(vv[np.argmin(P0[vv][:, 2])])
K = H_CAT / 1.8
wings_all = np.concatenate([wingF['L'], wingF['R'], wingB['L'], wingB['R']])


def measure(P, base=None):
    r = {}
    st, qq, E = qa.edge_stretch(me, P0, P, 0.004 * K)
    r['stretch'] = st
    reg = {}
    for name, vv in (('body', body_v), ('legs', legs_v), ('wings', wings_all), ('antennae', ant_v)):
        m = np.isin(E[:, 0], vv)
        reg[name] = round(float(qq[m].max()), 3) if m.any() else 1.0
    r['stretch_by_region'] = reg
    r['bad_edges_by_region'] = {name: int(((qq > 1.6) & np.isin(E[:, 0], vv)).sum()) for name, vv in
                                (('body', body_v), ('legs', legs_v), ('wings', wings_all), ('antennae', ant_v))}
    bb = qa.bvh_of(P, F_body)
    layers = {}
    for s_ in 'LR':
        bf = qa.bvh_of(P, F_wF[s_]); vv, du0, in0 = close[s_]
        ins, du = qa.near_inside(bf, P[vv])
        new_in = ins & ~in0
        out = ~ins & ~in0
        layers[s_] = dict(zone_verts=int(len(vv)), inside_n=int(ins.sum()), new_inside_n=int(new_in.sum()),
                          new_inside_depth_mm=round(float(du[new_in].max()) * 1000, 2) if new_in.any() else 0.0,
                          gap_open_mm=round(float((du[out] - du0[out]).max()) * 1000, 2) if out.any() else 0.0,
                          gap_mean_mm=round(float(du[out].mean()) * 1000, 2) if out.any() else 0.0)
    r['wing_layers'] = layers
    r['wing_verts_inside_body'] = int(qa.inside_parity(bb, P[wings_all]).sum())
    r['head_verts_inside_body'] = int(qa.inside_parity(bb, P[head_v]).sum())
    r['leg_verts_inside_body'] = int(qa.inside_parity(bb, P[legs_v]).sum())
    near = {}
    for s_ in 'LR':
        for nm, F in (('F', F_wF[s_]), ('B', F_wB[s_])):
            bw = qa.bvh_of(P, F)
            il, dl = qa.near_inside(bw, P[legs_v]); ia, da = qa.near_inside(bw, P[ant_v]); ib, db = qa.near_inside(bw, P[abd_v])
            near[f'{s_}_Wing{nm}'] = dict(legs_inside=int(il.sum()), legs_min_mm=round(float(dl.min()) * 1000, 1),
                                          antenna_inside=int(ia.sum()), antenna_min_mm=round(float(da.min()) * 1000, 1),
                                          abdomen_inside=int(ib.sum()), abdomen_min_mm=round(float(db.min()) * 1000, 1))
    r['wing_contacts'] = near
    r['foot_tip_move_mm'] = {k: round(float(np.linalg.norm(P[i] - P0[i])) * 1000, 1) for k, i in foot_tip.items()}
    if base:
        for k in ('wing_verts_inside_body', 'head_verts_inside_body', 'leg_verts_inside_body'):
            r[k + '_vs_rest'] = r[k] - base[k]
        for k, v in near.items():
            for kk in ('legs_inside', 'antenna_inside', 'abdomen_inside'):
                v[kk + '_vs_rest'] = v[kk] - base['wing_contacts'][k][kk]
    return r


obB = ob.copy(); obB.data = ob.data.copy(); obB.name = 'P03_variant_B_tmp'; bpy.context.scene.collection.objects.link(obB)
for g in list(obB.vertex_groups):
    obB.vertex_groups.remove(g)
vgB = {n: obB.vertex_groups.new(name=n) for n in nB}
for i in range(N):
    for k in np.nonzero(WB[i] > 1e-9)[0]:
        vgB[nB[k]].add([i], float(WB[i, k]), 'REPLACE')
poses = {}
base = None
for name, spec in qa.POSES.items():
    qa.apply(ctl, spec)
    P = qa.positions(ob)
    r = measure(P, base)
    PB = qa.positions(obB)
    r['variant_B_stretch'] = qa.edge_stretch(me, P0, PB, 0.004 * K)[0]
    if name == 'rest':
        base = r; r['rest_max_dev_m'] = float(np.abs(P - P0).max())
    poses[name] = r
qa.clear(ctl)
V['poses'] = poses
V['pose_defs'] = qa.POSES
V['A1_pass'] = all(x['pass_'] for x in V['A1'].values())
V['seconds'] = round(time.time() - t0, 1)
with open(RIG + '/validation.json', 'w', encoding='utf-8') as f:
    json.dump(V, f, indent=1, ensure_ascii=False, default=lambda o: o.tolist() if hasattr(o, 'tolist') else str(o))
print('R4_DONE A1_pass', V['A1_pass'], {k: v['pass_'] for k, v in V['A1'].items()})
