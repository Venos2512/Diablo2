"""R8 for the rig only (G2 approved 2026-10-27 after the user checked it in Blender; no clips yet): export the approved
rig to <asset_dir>/rig_done/, the layout of the rigging skill's export_core.export_package, without the control rig,
and generate variant B (swarm) as decided at G1.
Same method as P06 / B01 (rig/scripts/b01_r8_export.py of that asset): export_package is not called because it saves
the .blend and would export P03_hush_moths_ctl too.

blender -b --factory-startup -P p03_r8_export.py

The source rig/P03_hush_moths_rig.blend is read, never saved. The 22 QA poses of p03_qa.POSES are posed on the control
rig first and the skinning transforms of the runtime bones recorded. Then, in memory only, the Copy Transforms
constraints of P03_hush_moths_rig are removed and P03_hush_moths_ctl deleted, leaving the runtime skeleton (43 bones,
35 deform) in rest pose: that is A. B is A with the bones of rig['variant_B_collapse'] removed (their weights added to
the bone named there; the kept bones keep their bind) and the sockets of rig['variant_B_drop_sockets'] removed:
24 bones, 20 deform. Written to rig_done/:
  P03_hush_moths_rig.blend           byte copy of the source (control rig included)
  textures/                          the three Tripo maps, packed bytes as-is         (export_core._textures)
  P03_hush_moths_rig.fbx / .glb      A: FBX Unity axes, textures embedded; GLB +Y up; skin, every bone, no animation
  P03_hush_moths_B_rig.fbx / .glb    B, the same way (the name ends in _rig so export_core.asset_dir_of skips it)
  anim/clips.json                    empty manifest (clips come at R6; a clip made on A plays on B)
  P03_hush_moths_rig_info.json       bones, variant B, weight health, usable ranges, reimport checks
Reimport (Agent.md R8.4), each file into an empty scene: bone names, parents, heads; GLB inverse bind matrices against
the joint hierarchy (A1.8); image bytes against the Tripo GLB; weights; deformed positions of every QA pose (the
recorded skinning transforms are copied onto the reimported bones and vertices are matched by rest position, so the
vertices the exporters split at UV seams do not matter).
"""
import bpy, os, sys, json, shutil, hashlib, struct, datetime, io, contextlib
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import p03_common as C          # puts the rig_v1 tools on sys.path, imports rigbatch
import p03_qa as Q
import numpy as np
from mathutils import Matrix, kdtree

rc = C.rb.load_skill(1.0)       # the skill's rig_core; export_core binds to the same module
import export_core as ec

AID = C.ASSET
ADIR = os.path.normpath(C.ADIR)
BLEND = os.path.join(ADIR, 'rig', AID + '_rig.blend')
WORK = os.path.join(ADIR, 'rig', '_work')
OUT = os.path.join(ADIR, 'rig_done')
ANIM = os.path.join(OUT, 'anim')
STEM, STEM_B = os.path.join(OUT, AID + '_rig'), os.path.join(OUT, AID + '_B_rig')
RUNTIME_OB, CONTROL_OB, MESH_OB = AID + '_rig', AID + '_ctl', AID
with open(os.path.join(WORK, 'g1', 'bones_A.json'), encoding='utf-8') as f:
    BONES_A = json.load(f)
with open(os.path.join(WORK, 'g1', 'bones_B.json'), encoding='utf-8') as f:
    BONES_B = json.load(f)
RUNTIME, DEFORM = [b['name'] for b in BONES_A], [b['name'] for b in BONES_A if b['deform']]
RUNTIME_B, DEFORM_B = [b['name'] for b in BONES_B], [b['name'] for b in BONES_B if b['deform']]
TOL_REST = 1e-4                       # m, reimported vertex -> source vertex at rest
TOL_POSE = 1e-3                       # m, deformed source vs deformed reimport
TOL_BIND = 1e-5                       # A1.8: inverse bind matrix x joint world matrix vs identity
REPORT = os.path.join(WORK, 'r8_export.json')


def log(*a):
    print('[p03 r8]', *a, flush=True)


def _js(o):
    return o.tolist() if hasattr(o, 'tolist') else (list(o) if hasattr(o, '__len__') else str(o))


def jdump(path, obj):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, indent=1, ensure_ascii=False, default=_js)


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def mat_err(a, b):
    return max(abs(x - y) for ra, rb_ in zip(a, b) for x, y in zip(ra, rb_))


def evaluated(o):
    """Deformed vertex positions in world space."""
    dg = bpy.context.evaluated_depsgraph_get(); e = o.evaluated_get(dg); m = e.to_mesh()
    X = np.empty(len(m.vertices) * 3); m.vertices.foreach_get('co', X); e.to_mesh_clear()
    W = np.array(o.matrix_world)
    return X.reshape(-1, 3) @ W[:3, :3].T + W[:3, 3]


def skin_mats(arm):
    """World-space skinning transform of every bone: posed matrix times inverse rest matrix."""
    W = arm.matrix_world
    return {pb.name: (W @ pb.matrix) @ (W @ pb.bone.matrix_local).inverted() for pb in arm.pose.bones}


def set_skin(arm, S):
    """Pose arm so each bone has the skinning transform S[name] (whatever the bone's rest roll/tail is)."""
    W = arm.matrix_world; Wi = W.inverted(); rc.clear_pose(arm); bpy.context.view_layer.update()
    for pb in sorted(arm.pose.bones, key=lambda b: len(b.parent_recursive)):
        pb.matrix = Wi @ S[pb.name] @ W @ pb.bone.matrix_local
        bpy.context.view_layer.update()


def glb_parse(path):
    with open(path, 'rb') as f:
        data = f.read()
    off = 12; js = None; bin_ = b''
    while off < len(data):
        ln, typ = struct.unpack_from('<I4s', data, off); off += 8
        chunk = data[off:off + ln]; off += ln
        if typ == b'JSON':
            js = json.loads(chunk.decode('utf-8'))
        elif typ.startswith(b'BIN'):
            bin_ = chunk
    return js, bin_


def glb_images(js, bin_):
    out = []
    for im in js.get('images', []):
        bv = js['bufferViews'][im['bufferView']]; o = bv.get('byteOffset', 0)
        b = bin_[o:o + bv['byteLength']]
        out.append(dict(name=im.get('name'), mime=im.get('mimeType'), bytes=len(b), sha256=hashlib.sha256(b).hexdigest()))
    return out


def glb_bind_err(js, bin_):
    """A1.8 on the file: max |IBM_j @ world_j - I| over the joints, world_j composed from the node TRS hierarchy."""
    nodes = js['nodes']; parent = {c: i for i, n in enumerate(nodes) for c in n.get('children', [])}

    def local(n):
        if 'matrix' in n:
            return np.array(n['matrix'], float).reshape(4, 4).T
        x, y, z, w = n.get('rotation', [0, 0, 0, 1]); t = n.get('translation', [0, 0, 0]); s = n.get('scale', [1, 1, 1])
        R = np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                      [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                      [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
        M = np.eye(4); M[:3, :3] = R * np.array(s, float)[None, :]; M[:3, 3] = t
        return M

    cache = {}

    def world(i):
        if i not in cache:
            cache[i] = world(parent[i]) @ local(nodes[i]) if i in parent else local(nodes[i])
        return cache[i]

    sk = js['skins'][0]; acc = js['accessors'][sk['inverseBindMatrices']]; bv = js['bufferViews'][acc['bufferView']]
    off = bv.get('byteOffset', 0) + acc.get('byteOffset', 0)
    ibm = np.frombuffer(bin_, dtype='<f4', count=16 * acc['count'], offset=off).reshape(-1, 4, 4).transpose(0, 2, 1)
    return float(max(np.abs(ibm[k] @ world(j) - np.eye(4)).max() for k, j in enumerate(sk['joints'])))


def bbox(X):
    return [round(float(v), 4) for v in (X.max(0) - X.min(0))]


def reimported():
    """-> armatures, skinned meshes, other meshes (the glTF importer adds an Icosphere as the bones' display shape)."""
    arms = [o for o in bpy.data.objects if o.type == 'ARMATURE']
    shapes = {pb.custom_shape for a in arms for pb in a.pose.bones if pb.custom_shape}
    meshes = [o for o in bpy.data.objects if o.type == 'MESH' and o not in shapes]
    skinned = [o for o in meshes if any(md.type == 'ARMATURE' and md.object in arms for md in o.modifiers)]
    return arms, skinned, [o.name for o in meshes if o not in skinned]


def compare(A, M, SRC, REST):
    """Reimported armature A + mesh M against the source: weights, rest match, every sample pose."""
    R = evaluated(M)
    kd = kdtree.KDTree(len(REST))
    for i, co in enumerate(REST):
        kd.insert(co, i)
    kd.balance()
    cands = [[i for _, i, _ in kd.find_range(co, TOL_REST)] for co in R]
    covered = np.zeros(len(REST), bool)
    for c in cands:
        covered[c] = True
    K = max(1, max(len(c) for c in cands))
    idx = np.full((len(R), K), -1)
    for i, c in enumerate(cands):
        idx[i, :len(c)] = c
    mask = idx >= 0; safe = np.where(mask, idx, 0)
    mw = 0; bad_sum = 0
    for v in M.data.vertices:
        ws = [g.weight for g in v.groups if g.weight > 0]
        mw = max(mw, len(ws)); bad_sum += abs(sum(ws) - 1) > 1e-3
    res = dict(verts=len(R), size_m=bbox(R), unmatched_verts=sum(1 for c in cands if not c),
               source_verts_not_covered=int((~covered).sum()), max_influences=mw, weight_sum_off=bad_sum)
    poses = {}
    for k, s in SRC.items():
        set_skin(A, s['S'])
        S_re = skin_mats(A)
        D = np.linalg.norm(evaluated(M)[:, None, :] - s['P'][safe], axis=2); D[~mask] = np.inf
        d = D.min(1); d = d[np.isfinite(d)]
        poses[k] = dict(max_mm=round(1000 * float(d.max()), 4), p999_mm=round(1000 * float(np.percentile(d, 99.9)), 4),
                        skin_mat_err=round(max(mat_err(S_re[n], s['S'][n]) for n in S_re), 7))
    rc.clear_pose(A); bpy.context.view_layer.update()
    res['poses'] = poses
    res['pose_ok'] = all(p['max_mm'] < 1000 * TOL_POSE for p in poses.values())
    return res


def check_glb(stem, exp):
    """exp: names, deform, parents, heads, SRC, REST of the variant written to stem.glb."""
    js, bin_ = glb_parse(stem + '.glb')
    out_img = glb_images(js, bin_)
    joints = [js['nodes'][j]['name'] for j in js['skins'][0]['joints']] if js.get('skins') else []
    wtypes = sorted({js['accessors'][p['attributes']['WEIGHTS_0']]['componentType']
                     for m in js.get('meshes', []) for p in m['primitives'] if 'WEIGHTS_0' in p['attributes']})
    g = dict(file_mb=round(os.path.getsize(stem + '.glb') / 2 ** 20, 2), skins=len(js.get('skins', [])),
             meshes_in_file=len(js.get('meshes', [])), nodes_in_file=len(js.get('nodes', [])), joints=len(joints),
             joints_ok=sorted(joints) == sorted(exp['names']),
             ctl_in_file=[n.get('name') for n in js['nodes'] if str(n.get('name', '')).startswith('ctl_')],
             animations=len(js.get('animations', [])), weights_component_type=wtypes,
             bind_err=glb_bind_err(js, bin_) if js.get('skins') else None,
             images=[dict(name=i['name'], mime=i['mime'], mb=round(i['bytes'] / 2 ** 20, 2)) for i in out_img],
             images_same_bytes_as_tripo=sorted(i['sha256'] for i in out_img) == sorted(i['sha256'] for i in SRC_IMG))
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=stem + '.glb')
    arms, mobs, other = reimported()
    A, M = arms[0], mobs[0]
    rc.clear_pose(A); bpy.context.view_layer.update()
    g.update(armatures=len(arms), meshes=len(mobs), other_meshes=other, bones=len(A.data.bones),
             names_ok=sorted(b.name for b in A.data.bones) == sorted(exp['names']),
             deform_groups_ok=sorted(x.name for x in M.vertex_groups if x.name in exp['deform']) == sorted(exp['deform']),
             parents_ok=all((b.parent.name if b.parent else None) == exp['parents'][b.name] for b in A.data.bones),
             head_err_mm=round(1000 * max((A.matrix_world @ b.head_local - exp['heads'][b.name]).length
                                          for b in A.data.bones), 4),
             images_loaded=[list(i.size) for i in bpy.data.images])
    g.update(compare(A, M, exp['SRC'], exp['REST']))
    g['ok'] = (g['armatures'] == 1 and g['meshes'] == 1 and g['meshes_in_file'] == 1 and not other
               and g['bones'] == len(exp['names']) and g['joints_ok'] and g['names_ok'] and g['parents_ok']
               and g['deform_groups_ok'] and not g['ctl_in_file'] and g['animations'] == 0 and g['head_err_mm'] < 0.1
               and g['bind_err'] is not None and g['bind_err'] <= TOL_BIND
               and g['images_same_bytes_as_tripo'] and g['unmatched_verts'] == 0 and g['source_verts_not_covered'] == 0
               and g['max_influences'] <= 4 and g['weight_sum_off'] == 0 and g['pose_ok'])
    return g


def check_fbx(stem, exp):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=stem + '.fbx')
    arms, mobs, other = reimported()
    x = dict(file_mb=round(os.path.getsize(stem + '.fbx') / 2 ** 20, 2), armatures=len(arms),
             bones=sum(len(a.data.bones) for a in arms), meshes=len(mobs), other_meshes=other,
             names_ok=bool(arms) and sorted(b.name for b in arms[0].data.bones) == sorted(exp['names']),
             parents_ok=bool(arms) and all((b.parent.name if b.parent else None) == exp['parents'][b.name]
                                           for b in arms[0].data.bones if b.name in exp['parents']),
             images_loaded=[list(i.size) for i in bpy.data.images])
    if len(arms) == 1 and len(mobs) == 1:
        rc.clear_pose(arms[0]); bpy.context.view_layer.update()
        x.update(compare(arms[0], mobs[0], exp['SRC'], exp['REST']))
    x['ok'] = (x['armatures'] == 1 and x['bones'] == len(exp['names']) and x['meshes'] == 1 and not other
               and x['names_ok'] and x['parents_ok'] and x.get('verts') == N_VERTS and x.get('unmatched_verts') == 0
               and x.get('max_influences', 9) <= 4 and x.get('weight_sum_off') == 0 and x.get('pose_ok', False)
               and max(abs(a - b) for a, b in zip(x['size_m'], SIZE)) < 0.01)
    return x


def influences(o):
    mw = 0; empty = 0; off = 0.0
    for v in o.data.vertices:
        ws = [g.weight for g in v.groups if g.weight > 0]
        mw = max(mw, len(ws)); empty += not ws; off = max(off, abs(sum(ws) - 1))
    return dict(max_influences=mw, empty_verts=empty, sum_max_dev=off)


# ------------------------------------------------------------------ source
ad, aid = ec.asset_dir_of(BLEND)
assert os.path.normcase(ad) == os.path.normcase(ADIR) and aid == AID, (ad, aid)
os.makedirs(ANIM, exist_ok=True)
src_sha = sha256(BLEND)
shutil.copy2(BLEND, STEM + '.blend')          # the source as approved, control rig included
SRC_IMG = glb_images(*glb_parse(C.GLB))            # image bytes of the Tripo GLB

bpy.ops.wm.open_mainfile(filepath=BLEND)
vl = bpy.context.view_layer; scn = bpy.context.scene
rt, cr = bpy.data.objects[RUNTIME_OB], bpy.data.objects[CONTROL_OB]
parts = ec._parts(rt)
assert len(parts) == 1 and parts[0].name == MESH_OB, [o.name for o in parts]
ob = parts[0]
assert ob.parent in (None, rt), ob.parent
assert sorted(b.name for b in rt.data.bones) == sorted(RUNTIME), [b.name for b in rt.data.bones]
assert sorted(b.name for b in rt.data.bones if b.use_deform) == sorted(DEFORM)
COLLAPSE = json.loads(rt['variant_B_collapse']); DROP = json.loads(rt['variant_B_drop_sockets'])
assert sorted(set(RUNTIME) - set(COLLAPSE) - set(DROP)) == sorted(RUNTIME_B), 'variant B props vs bones_B.json'
assert sorted(set(DEFORM) - set(COLLAPSE)) == sorted(DEFORM_B)
assert all(t in DEFORM_B for t in COLLAPSE.values())
transforms = {o.name: round(mat_err(o.matrix_world, Matrix.Identity(4)), 9) for o in (rt, cr, ob)}
actions = [a.name for a in bpy.data.actions]


def settle():
    cr.update_tag(); scn.frame_set(scn.frame_current)


# QA poses on the control rig (the runtime follows by Copy Transforms)
SRC = {}
for k, spec in Q.POSES.items():
    Q.apply(cr, spec); settle()
    SRC[k] = dict(P=evaluated(ob), S=skin_mats(rt))
Q.clear(cr); settle()
rest_with_ctl = evaluated(ob)
moved_mm = {k: round(1000 * float(np.linalg.norm(s['P'] - rest_with_ctl, axis=1).max()), 1) for k, s in SRC.items()}
assert all(v > 5 for k, v in moved_mm.items() if k != 'rest'), moved_mm      # every test pose really deforms

# runtime skeleton alone: constraints and drivers off, control rig gone (in memory only)
removed_cons = []
for pb in rt.pose.bones:
    for c in list(pb.constraints):
        removed_cons.append(pb.name + ':' + c.type); pb.constraints.remove(c)
rt_drivers = 0
if rt.animation_data:
    rt_drivers = len(rt.animation_data.drivers)
    for d in list(rt.animation_data.drivers):
        rt.animation_data.drivers.remove(d)
ctl_bones = len(cr.data.bones)
cr_data = cr.data
bpy.data.objects.remove(cr, do_unlink=True)
bpy.data.armatures.remove(cr_data)
left = [o.name for o in bpy.data.objects if o.type == 'ARMATURE' and o is not rt]
assert not left, left
rc.clear_pose(rt); vl.update()
REST = evaluated(ob)
ctl_free = float(np.abs(REST - rest_with_ctl).max())
strip = {}                                       # the recorded transforms reproduce every pose on the bare runtime rig
for k, s in SRC.items():
    set_skin(rt, s['S'])
    strip[k] = round(1000 * float(np.linalg.norm(evaluated(ob) - s['P'], axis=1).max()), 4)
rc.clear_pose(rt); vl.update()
heads = {b.name: (rt.matrix_world @ b.head_local).copy() for b in rt.data.bones}
parents = {b.name: (b.parent.name if b.parent else None) for b in rt.data.bones}
bind_A = {b.name: b.matrix_local.copy() for b in rt.data.bones}
with contextlib.redirect_stdout(io.StringIO()):
    health = rc.weight_health(ob, rt)
infl_A = influences(ob)
N_VERTS = len(ob.data.vertices); n_tris = sum(len(p.vertices) - 2 for p in ob.data.polygons)
SIZE = bbox(REST)
scale_glb = float(rt['scale_glb_to_m']); height_m = float(rt['height_m'])
log('source', rt.name, ob.name, N_VERTS, 'verts', len(RUNTIME), 'bones; removed', CONTROL_OB, ctl_bones, 'bones,',
    len(removed_cons), 'constraints,', rt_drivers, 'runtime drivers; ctl-free rest diff', ctl_free, 'm; strip max mm',
    max(strip.values()), '; size', SIZE, '; transforms', transforms, '; actions', actions)

# ------------------------------------------------------------------ export
tex = ec._textures([ob], os.path.join(OUT, 'textures'))
tex_files = sorted(os.path.relpath(p, OUT).replace('\\', '/') for _, p in tex.values())


def export_pair(stem):
    relink = ec._direct_base_color([ob])
    try:
        for img, (_, p) in tex.items():
            img.filepath_raw = p
        ec._fbx(stem + '.fbx', [rt, ob], anim=False, deform_only=False)
    finally:
        for img, (raw, _) in tex.items():
            img.filepath_raw = raw
        for m, sock in relink:
            bsdf = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
            m.node_tree.links.new(sock, bsdf.inputs['Base Color'])
    ec._select([rt, ob])
    bpy.ops.export_scene.gltf(filepath=stem + '.glb', export_format='GLB', use_selection=True, export_yup=True,
                              export_skins=True, export_animations=False, export_def_bones=False,
                              export_rest_position_armature=True, export_image_format='AUTO', export_apply=False,
                              export_cameras=False, export_lights=False, export_extras=False)


export_pair(STEM)
log('exported A', STEM + '.fbx', STEM + '.glb', tex_files)

# ------------------------------------------------------------------ variant B (in memory, from A)
vg = ob.vertex_groups
gname = {g.index: g.name for g in vg}
new_w = []
for v in ob.data.vertices:
    acc = {}
    for g in v.groups:
        n = gname[g.group]; t = COLLAPSE.get(n, n)
        acc[t] = acc.get(t, 0.0) + g.weight
    new_w.append(acc)
for n in COLLAPSE:
    vg.remove(vg[n])
for i, acc in enumerate(new_w):
    for t, w in acc.items():
        vg[t].add([i], w, 'REPLACE')
ec._select([rt])
bpy.ops.object.mode_set(mode='EDIT')
eb = rt.data.edit_bones
for n in list(COLLAPSE) + list(DROP):
    eb.remove(eb[n])
bpy.ops.object.mode_set(mode='OBJECT')
assert sorted(b.name for b in rt.data.bones) == sorted(RUNTIME_B)
parents_B = {b.name: (b.parent.name if b.parent else None) for b in rt.data.bones}
assert all(parents_B[n] == parents[n] for n in RUNTIME_B), 'B changed a parent'
bind_B_err = max(mat_err(rt.data.bones[n].matrix_local, bind_A[n]) for n in RUNTIME_B)
groups_B = sorted(g.name for g in vg)
unweighted_B = [n for n in DEFORM_B if not any(g.group == vg[n].index and g.weight > 0
                                               for v in ob.data.vertices for g in v.groups)]
SRC_B = {}
for k, s in SRC.items():
    S = {n: s['S'][n] for n in RUNTIME_B}
    set_skin(rt, S)
    SRC_B[k] = dict(P=evaluated(ob), S=S)
rc.clear_pose(rt); vl.update()
REST_B = evaluated(ob)
rest_B_diff = float(np.abs(REST_B - REST).max())
with contextlib.redirect_stdout(io.StringIO()):
    health_B = rc.weight_health(ob, rt)
infl_B = influences(ob)
log('variant B', len(RUNTIME_B), 'bones,', len(DEFORM_B), 'deform; groups', len(groups_B), '; unweighted', unweighted_B,
    '; bind diff', bind_B_err, '; rest diff', rest_B_diff, '; influences', infl_B)
export_pair(STEM_B)
log('exported B', STEM_B + '.fbx', STEM_B + '.glb')
jdump(os.path.join(ANIM, 'clips.json'), {'asset_id': AID, 'rig': RUNTIME_OB, 'clips': [],
                                         'variant_B': os.path.basename(STEM_B) + '.glb / .fbx: subset of the runtime '
                                         'skeleton with the same bind; a clip made on A plays on B (tracks of the '
                                         'missing bones are skipped)'})

# ------------------------------------------------------------------ reimport
exp_A = dict(names=RUNTIME, deform=DEFORM, parents=parents, heads=heads, SRC=SRC, REST=REST)
exp_B = dict(names=RUNTIME_B, deform=DEFORM_B, parents=parents_B, heads={n: heads[n] for n in RUNTIME_B},
             SRC=SRC_B, REST=REST_B)
glb = check_glb(STEM, exp_A); log('glb A reimport', 'ok' if glb['ok'] else 'FAIL', json.dumps(glb))
fbx = check_fbx(STEM, exp_A); log('fbx A reimport', 'ok' if fbx['ok'] else 'FAIL', json.dumps(fbx))
glb_B = check_glb(STEM_B, exp_B); log('glb B reimport', 'ok' if glb_B['ok'] else 'FAIL', json.dumps(glb_B))
fbx_B = check_fbx(STEM_B, exp_B); log('fbx B reimport', 'ok' if fbx_B['ok'] else 'FAIL', json.dumps(fbx_B))

# ------------------------------------------------------------------ info
files = dict(model_fbx=STEM + '.fbx', model_glb=STEM + '.glb', model_B_fbx=STEM_B + '.fbx', model_B_glb=STEM_B + '.glb',
             blend=STEM + '.blend', clips=[], textures=tex_files)
rel = {k: (os.path.relpath(v, OUT).replace('\\', '/') if isinstance(v, str) else v) for k, v in files.items()}
SOCKETS = [n for n in RUNTIME if n not in DEFORM and n not in ('root', 'cog')]
info = {
    'asset_id': AID, 'rig': RUNTIME_OB, 'exported': datetime.datetime.now().isoformat(timespec='seconds'),
    'source_blend': BLEND, 'source_sha256': src_sha, 'family': 'W (flying insect)', 'route': 'M',
    'units': 'm', 'blender_axes': 'Z up, faces -Y, its left = +X', 'fbx_axes': 'Y up, -Z forward (Unity)',
    'glb_axes': 'Y up, faces +Z', 'deform_only': False, 'size_m': dict(zip(('x', 'y', 'z'), SIZE)),
    'height_m': height_m, 'scale_from_tripo': round(scale_glb, 6),
    'bones': {'total': len(RUNTIME), 'deform': len(DEFORM), 'non_deform': ['root', 'cog'], 'sockets': SOCKETS},
    'variant_B': {'use': 'swarm instances (fewer bones); A for close-ups', 'files': [rel['model_B_glb'], rel['model_B_fbx']],
                  'bones': {'total': len(RUNTIME_B), 'deform': len(DEFORM_B),
                            'sockets': [n for n in SOCKETS if n in RUNTIME_B]},
                  'collapsed_into': COLLAPSE, 'dropped_sockets': DROP,
                  'same_bind_as_A': {'max_matrix_diff': bind_B_err, 'rest_mesh_diff_m': rest_B_diff},
                  'weights': infl_B, 'unweighted_deform': unweighted_B,
                  'motion': 'antennae one rigid piece, legs one rigid piece each (turn at the hip), abdomen 2 segments; '
                            'the 8 wing bones are kept'},
    'control_rig': {'kept_in': 'rig/' + os.path.basename(BLEND) + ' (and the copy here)', 'object': CONTROL_OB,
                    'bones': ctl_bones, 'not_exported': True, 'constraints_removed': len(removed_cons),
                    'drive': RUNTIME_OB + ' copies ' + CONTROL_OB + ' bone by bone (Copy Transforms, world space)',
                    'main_controls': {'ctl_wings': 'X = flap both sides', 'ctl_L_Wing / ctl_R_Wing': 'one side, shared '
                                      'hinge of fore and hind wing', 'ctl_abdomen_curl': 'X = curl all 3 segments',
                                      'ctl_<side>_Leg<n>_IK / _pole': 'leg IK, 6 legs'},
                    'switches': {'ik_leg_L1 .. ik_leg_R3': 'custom props on ' + CONTROL_OB + ', 1 = IK, 0 = FK'}},
    'parts': {MESH_OB: {'role': 'whole moth, one mesh (body + 36 separate islands: head, eyes, legs, wings, antennae)',
                        'verts': N_VERTS, 'tris': n_tris}},
    'weight_health': {MESH_OB: health, MESH_OB + ' (B)': health_B}, 'weights_A': infl_A,
    'rigid_parts': {'head + eyes': 'rigid on head', 'wings': 'own bones only, no thorax weight'},
    'spring_chains': [], 'leg_colliders': [],
    'usable_ranges': {
        'wing flap (ctl_wings, ctl_L/R_Wing)': 'fore and hind wing share one hinge: any common angle keeps the two layers '
                                               'together (tested -45..+65 deg)',
        'hind wing alone (ctl_*_WingB_01)': '<= 2-3 deg against the fore wing (10 deg separates the layers by 5-6 cm)',
        'wing flex (*_02)': '<= 10 deg, hind wing no more than fore wing (30 deg separated them by 46 mm)',
        'wings down while standing': 'past ~30 deg the hind wing touches the middle / hind legs; legs are tucked in flight',
        'abdomen curl': '<= 10 deg per segment looks clean; 15 deg per segment (45 at the tip) stretches 2.5-2.7x near '
                        'the waist',
        'head': '+-15 deg', 'antennae': '+-25 deg per segment',
        'legs': 'strong folds (flight tuck, IK lift) flatten the inner side of the knee / ankle knobs'},
    'notes': ['Family W, flying-insect group (first one). Clips are made at R6 on the control rig and baked onto ' +
              RUNTIME_OB + ' at R8; variant B takes the same clips.',
              'The control rig is not exported: ' + CONTROL_OB + ' (53 ctl_* bones) stays in the source .blend.',
              'Sockets carry no weights: root and ground = floor, cog = body centre, hit_origin = hit reaction, '
              'fx_thorax / fx_head / fx_wing_L / fx_wing_R = VFX points (B keeps ground and fx_thorax).',
              'Legs have 3 segments (_01 hip-knee, _02 knee-ankle, _03 ankle-tip), as approved at G1; W04 / W07 use 4 '
              '(_02 there is the femur), so retargeting between them needs a map.',
              'Weights and the remaining limits: rig/qa_report.md sections 5 and 6.'],
    'files': rel,
    'reimport_check': {'glb': glb, 'fbx': fbx, 'glb_B': glb_B, 'fbx_B': fbx_B,
                       'tolerance_m': {'rest_match': TOL_REST, 'pose': TOL_POSE}, 'bind_tolerance': TOL_BIND,
                       'sample_poses': list(SRC), 'pose_max_move_mm': moved_mm, 'strip_check_max_mm': strip},
    'approved': {'G1': '2026-10-26', 'G2': '2026-10-27', 'G3': None, 'G4': None},
}
jdump(STEM + '_info.json', info)
jdump(REPORT, dict(source_sha256=src_sha, ctl_free_rest_diff=ctl_free, strip_check_max_mm=strip, transforms=transforms,
                   actions=actions, removed_constraints=removed_cons, runtime_drivers_removed=rt_drivers,
                   pose_max_move_mm=moved_mm, variant_B=info['variant_B'], glb=glb, fbx=fbx, glb_B=glb_B, fbx_B=fbx_B,
                   files=rel))
log('R8 export', 'PASS' if glb['ok'] and fbx['ok'] and glb_B['ok'] and fbx_B['ok'] else 'FAIL', OUT)
