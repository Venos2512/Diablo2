"""P04 Hive-Sleeper, R8 for the rig only (G2 approved 2026-10-27, no clips yet): export the approved rig to
<asset_dir>/rig_done/, the layout of the rigging skill's export_core.export_package, without the control rig.
Same method as B01 and P06 (rig/scripts/b01_r8_export.py, p06_r8_export.py of those assets): export_package is not
called because it saves the .blend and would export P04_hive_sleeper_ctl too.

blender -b --factory-startup -P p30_r8_export.py

rig/P04_hive_sleeper_rig.blend is read, never saved. The QA test poses of p20_qa.py are posed on the control rig first
and their skinning transforms recorded. Then, in memory only, the Copy Transforms constraints of P04_hive_sleeper_rig
are removed and the control rig deleted, leaving the runtime skeleton (54 bones, 46 deform) in rest pose.
Written to rig_done/:
  P04_hive_sleeper_rig.blend        byte copy of the source (control rig included)
  textures/                         the three Tripo maps, packed bytes as-is            (export_core._textures)
  P04_hive_sleeper_rig.fbx          Unity axes, textures embedded, no animation         (export_core._fbx)
  P04_hive_sleeper_rig.glb          +Y up, skin, every runtime bone, no animation
  anim/clips.json                   empty manifest (clips come at R6)
  P04_hive_sleeper_rig_info.json    bones, weight health, usable ranges, reimport checks
Reimport (rig-anim/Agent.md R8.4), each file into an empty scene: bone names, parents, heads; image bytes against the
Tripo GLB; weights; deformed positions of every QA test pose (the recorded skinning transforms are copied onto the
reimported bones and vertices are matched by rest position, so the vertices the exporters split at UV seams do not
matter). Numbers: rig/_work/r8_export.json.
"""
import bpy, os, sys, ast, math, json, shutil, hashlib, struct, datetime, io, contextlib, re
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import p04_common as C
sys.path.insert(0, C.TOOLS)
import numpy as np
from mathutils import Matrix, Vector, Quaternion, kdtree
import rigbatch as rb
rc = rb.load_skill(1.0)               # the skill's rig_core; export_core binds to the same module
import export_core as ec

BLEND = os.path.join(C.RIG_DIR, C.ASSET + '_rig.blend')
OUT = os.path.join(C.ROOT, 'rig_done')
ANIM = os.path.join(OUT, 'anim')
STEM = os.path.join(OUT, C.ASSET + '_rig')
RUNTIME_OB, CONTROL_OB = 'P04_hive_sleeper_rig', 'P04_hive_sleeper_ctl'
BONES = C.bone_table()
RUNTIME = [b['name'] for b in BONES]
DEFORM = [b['name'] for b in BONES if b['deform']]
TOL_REST = 1e-4                       # m, reimported vertex -> source vertex at rest
TOL_POSE = 1e-3                       # m, deformed source vs deformed reimport
REPORT = os.path.join(C.WORK, 'r8_export.json')


def log(*a):
    print('[p04 r8]', *a, flush=True)


def jdump(path, obj):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, indent=1, ensure_ascii=False)


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def mat_err(a, b):
    return max(abs(x - y) for ra, rb_ in zip(a, b) for x, y in zip(ra, rb_))


def qa_poses(ct):
    """POSES and the helpers that pose them, read from p20_qa.py (its module body opens the .blend and renders)."""
    path = os.path.join(HERE, 'p20_qa.py')
    with open(path, encoding='utf-8') as f:
        src = f.read()
    want = {'upd', 'reset', 'move', 'rot', 'apply', 'TWIST', 'POSES'}
    parts = [ast.get_source_segment(src, n) for n in ast.parse(src).body
             if (isinstance(n, ast.FunctionDef) and n.name in want)
             or (isinstance(n, ast.Assign) and any(getattr(t, 'id', None) in want for t in n.targets))]
    ns = dict(bpy=bpy, math=math, Vector=Vector, Quaternion=Quaternion, ct=ct)
    exec(compile('\n\n'.join(parts), path, 'exec'), ns)
    assert want <= set(ns), want - set(ns)
    return ns


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


def glb_images(path):
    js, bin_ = glb_parse(path)
    out = []
    for im in js.get('images', []):
        bv = js['bufferViews'][im['bufferView']]; o = bv.get('byteOffset', 0)
        b = bin_[o:o + bv['byteLength']]
        out.append(dict(name=im.get('name'), mime=im.get('mimeType'), bytes=len(b), sha256=hashlib.sha256(b).hexdigest()))
    return js, out


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


# ------------------------------------------------------------------ source
ad, aid = ec.asset_dir_of(BLEND)
assert os.path.normcase(os.path.abspath(ad)) == os.path.normcase(os.path.abspath(C.ROOT)) and aid == C.ASSET, (ad, aid)
os.makedirs(ANIM, exist_ok=True)
src_sha = sha256(BLEND)
shutil.copy2(BLEND, STEM + '.blend')          # the source as approved, control rig included

bpy.ops.wm.open_mainfile(filepath=BLEND)
vl = bpy.context.view_layer; scn = bpy.context.scene
rt, cr = bpy.data.objects[RUNTIME_OB], bpy.data.objects[CONTROL_OB]
parts = ec._parts(rt)
assert len(parts) == 1 and parts[0].name == C.ASSET, [o.name for o in parts]
ob = parts[0]
assert ob.parent in (None, rt), ob.parent
assert sorted(b.name for b in rt.data.bones) == sorted(RUNTIME), [b.name for b in rt.data.bones]
assert sorted(b.name for b in rt.data.bones if b.use_deform) == sorted(DEFORM)
transforms = {o.name: round(mat_err(o.matrix_world, Matrix.Identity(4)), 9) for o in (rt, cr, ob)}
actions = [a.name for a in bpy.data.actions]
scale_S = float(rt.get('scale_S', C.S))

# QA test poses on the control rig (the runtime follows by Copy Transforms)
Q = qa_poses(cr)
SRC = {}
for k, spec in Q['POSES'].items():
    Q['apply'](spec); cr.update_tag(); scn.frame_set(scn.frame_current)
    SRC[k] = dict(P=evaluated(ob), S=skin_mats(rt))
Q['reset'](); cr.update_tag(); scn.frame_set(scn.frame_current)
rest_with_ctl = evaluated(ob)

# runtime skeleton alone: constraints off, control rig gone (in memory only)
removed_cons = []
for pb in rt.pose.bones:
    for c in list(pb.constraints):
        removed_cons.append(pb.name + ':' + c.type); pb.constraints.remove(c)
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
with contextlib.redirect_stdout(io.StringIO()):
    health = rc.weight_health(ob, rt)
n_verts = len(ob.data.vertices); n_tris = sum(len(p.vertices) - 2 for p in ob.data.polygons)
ob_name = ob.name                                # the reimports below reset the scene
size = bbox(REST)
log('source', rt.name, ob.name, n_verts, 'verts', len(RUNTIME), 'bones; removed', CONTROL_OB, ctl_bones, 'bones,',
    len(removed_cons), 'constraints; ctl-free rest diff', ctl_free, 'm; strip max mm', max(strip.values()),
    '; size', size, '; transforms', transforms, '; actions', actions)

# ------------------------------------------------------------------ export
ec._select([rt, ob])
tex = ec._textures([ob], os.path.join(OUT, 'textures')); relink = ec._direct_base_color([ob])
try:
    for img, (_, p) in tex.items():
        img.filepath_raw = p
    ec._fbx(STEM + '.fbx', [rt, ob], anim=False, deform_only=False)
finally:
    for img, (raw, _) in tex.items():
        img.filepath_raw = raw
    for m, sock in relink:
        bsdf = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
        m.node_tree.links.new(sock, bsdf.inputs['Base Color'])
ec._select([rt, ob])
bpy.ops.export_scene.gltf(filepath=STEM + '.glb', export_format='GLB', use_selection=True, export_yup=True,
                          export_skins=True, export_animations=False, export_def_bones=False,
                          export_rest_position_armature=True, export_image_format='AUTO', export_apply=False,
                          export_cameras=False, export_lights=False, export_extras=False)
jdump(os.path.join(ANIM, 'clips.json'), {'asset_id': C.ASSET, 'rig': RUNTIME_OB, 'clips': []})
tex_files = sorted(os.path.relpath(p, OUT).replace('\\', '/') for _, p in tex.values())
log('exported', STEM + '.fbx', STEM + '.glb', tex_files)

# ------------------------------------------------------------------ GLB file and reimport
js, out_img = glb_images(STEM + '.glb')
_, src_img = glb_images(C.GLB)
skin_joints = [js['nodes'][j]['name'] for j in js['skins'][0]['joints']] if js.get('skins') else []
wtypes = sorted({js['accessors'][p['attributes']['WEIGHTS_0']]['componentType']
                 for m in js.get('meshes', []) for p in m['primitives'] if 'WEIGHTS_0' in p['attributes']})
glb = dict(file_mb=round(os.path.getsize(STEM + '.glb') / 2 ** 20, 2), skins=len(js.get('skins', [])),
           meshes_in_file=len(js.get('meshes', [])), nodes_in_file=len(js.get('nodes', [])), joints=len(skin_joints),
           ctl_in_file=[n.get('name') for n in js['nodes'] if str(n.get('name', '')).startswith('ctl_')],
           animations=len(js.get('animations', [])), weights_component_type=wtypes,
           images=[dict(name=i['name'], mime=i['mime'], mb=round(i['bytes'] / 2 ** 20, 2)) for i in out_img],
           images_same_bytes_as_tripo=sorted(i['sha256'] for i in out_img) == sorted(i['sha256'] for i in src_img))

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=STEM + '.glb')
arms, mobs, other = reimported()
A, M = arms[0], mobs[0]
rc.clear_pose(A); bpy.context.view_layer.update()
glb.update(armatures=len(arms), meshes=len(mobs), other_meshes=other, bones=len(A.data.bones), skinned=True,
           names_ok=sorted(b.name for b in A.data.bones) == sorted(RUNTIME),
           deform_groups_ok=sorted(g.name for g in M.vertex_groups if g.name in DEFORM) == sorted(DEFORM),
           parents_ok=all((b.parent.name if b.parent else None) == parents[b.name] for b in A.data.bones),
           head_err_mm=round(1000 * max((A.matrix_world @ b.head_local - heads[b.name]).length for b in A.data.bones), 4),
           images_loaded=[list(i.size) for i in bpy.data.images])
glb.update(compare(A, M, SRC, REST))
glb['ok'] = (glb['armatures'] == 1 and glb['meshes'] == 1 and glb['meshes_in_file'] == 1 and not other
             and glb['bones'] == len(RUNTIME) and glb['joints'] == len(RUNTIME) and glb['names_ok'] and glb['parents_ok']
             and glb['deform_groups_ok'] and not glb['ctl_in_file'] and glb['animations'] == 0 and glb['head_err_mm'] < 0.1
             and glb['images_same_bytes_as_tripo'] and glb['unmatched_verts'] == 0 and glb['source_verts_not_covered'] == 0
             and glb['max_influences'] <= 4 and glb['weight_sum_off'] == 0 and glb['pose_ok'])
log('glb reimport', json.dumps(glb))

# ------------------------------------------------------------------ FBX reimport
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=STEM + '.fbx')
arms, mobs, other = reimported()
fbx = dict(file_mb=round(os.path.getsize(STEM + '.fbx') / 2 ** 20, 2), armatures=len(arms),
           bones=sum(len(a.data.bones) for a in arms), meshes=len(mobs), other_meshes=other,
           names_ok=bool(arms) and sorted(b.name for b in arms[0].data.bones) == sorted(RUNTIME),
           images_loaded=[list(i.size) for i in bpy.data.images])
if len(arms) == 1 and len(mobs) == 1:
    rc.clear_pose(arms[0]); bpy.context.view_layer.update()
    fbx.update(compare(arms[0], mobs[0], SRC, REST))
fbx['ok'] = (fbx['armatures'] == 1 and fbx['bones'] == len(RUNTIME) and fbx['meshes'] == 1 and not other
             and fbx['names_ok'] and fbx.get('verts') == n_verts and fbx.get('unmatched_verts') == 0
             and fbx.get('max_influences', 9) <= 4 and fbx.get('weight_sum_off') == 0 and fbx.get('pose_ok', False)
             and max(abs(a - b) for a, b in zip(fbx['size_m'], size)) < 0.01)
log('fbx reimport', json.dumps(fbx))

# ------------------------------------------------------------------ info
chains = {}
for b in BONES:
    if b['kind'] == 'cloth':
        chains.setdefault(re.sub(r'_\d+$', '', b['name']), []).append(b['name'])
files = dict(model_fbx=STEM + '.fbx', model_glb=STEM + '.glb', blend=STEM + '.blend', clips=[], textures=tex_files)
rel = {k: (os.path.relpath(v, OUT).replace('\\', '/') if isinstance(v, str) else v) for k, v in files.items()}
info = {
    'asset_id': C.ASSET, 'rig': RUNTIME_OB, 'exported': datetime.datetime.now().isoformat(timespec='seconds'),
    'source_blend': BLEND.replace('\\', '/'), 'source_sha256': src_sha, 'family': 'Qh', 'route': 'M',
    'units': 'm', 'blender_axes': 'Z up, faces -Y, its left = +X', 'fbx_axes': 'Y up, -Z forward (Unity)',
    'glb_axes': 'Y up, faces +Z', 'deform_only': False, 'size_m': dict(zip(('x', 'y', 'z'), size)),
    'scale_from_tripo': round(scale_S, 6),
    'bones': {'total': len(RUNTIME), 'deform': len(DEFORM), 'sockets': [n for n in RUNTIME if n not in DEFORM]},
    'control_rig': {'kept_in': 'rig/' + os.path.basename(BLEND) + ' (and the copy here)', 'object': CONTROL_OB,
                    'bones': ctl_bones, 'not_exported': True, 'constraints_removed': len(removed_cons),
                    'drive': RUNTIME_OB + ' copies ' + CONTROL_OB + ' bone by bone (Copy Transforms, world space)',
                    'switches': {'ik_arm_L / ik_arm_R': 'planted hands, 1 = IK (Hand_IK > Fingertip_roll > Palm_roll)',
                                 'ik_leg_L / ik_leg_R': 'knee contact, 1 = IK (Thigh aims at Knee_IK, Calf follows)'},
                    'twist': 'L/R_ForeArm_twist and L/R_UpperArm_twist are driven in the control rig: bake them at R8'},
    'parts': {ob_name: {'role': 'body (nightshirt, hood, face, hair and the three domes are one piece)',
                        'verts': n_verts, 'tris': n_tris}},
    'weight_health': {ob_name: health},
    'rigid_parts': {'dome_01': 'front larval dome, rigid, parent chest', 'dome_02': 'middle dome, rigid, parent spine_02',
                    'dome_03': 'rear dome, rigid, parent pelvis', 'grooves': '6 cm blend band between the domes'},
    'spring_chains': [{'chain': k, 'bones': v} for k, v in chains.items()],
    'leg_colliders': [],
    'usable_ranges': {'head (neck + neck_02 + head)': 'keep within about +-30 deg in total: at 35-50 deg the hood '
                                                      'stretches 3.5-4.4x where it meets the rigid front dome',
                      'spine twist / side bend with hands planted': '24 deg twist or 18 deg side bend pushes the '
                                                                    'shoulder drapes into the forearms',
                      'knee IK': 'Thigh is a one-bone IK aiming at Knee_IK: past the thigh length the knee falls '
                                 'about 1.5 cm short; keep ctl_cog height consistent with the knee targets',
                      'domes': '+-12 deg rocks squeeze the grooves (1.9x)',
                      'forearm twist': 'a 40 deg hand turn twists the forearm 23 deg (ideal 20)'},
    'notes': ['Family Qh (H core names + L/R_Finger + neck_02), the layout shared with U04 Charnel Ghoul (U04 adds '
              'L/R_Calf_02 for its three-segment hind legs; P04 has none). The Qh clip set is made at R6 on the '
              'control rig and baked onto ' + RUNTIME_OB + ' at R8.',
              'The control rig is not exported: ' + CONTROL_OB + ' (' + str(ctl_bones) + ' ctl_* bones: hand IK stack '
              'with heel and fingertip roll, elbow poles, knee-contact legs, IK/FK switches, twist drivers) stays in '
              'the source .blend.',
              'Sockets carry no weights: root and ground = floor, cog = mid-trunk, hit_origin = hit reaction (in front '
              'of the head), fx_head / fx_chest / fx_hand_L / fx_hand_R = VFX points. No weapon sockets (G1).',
              'The seven shirt chains (2 bones each) want spring bones with capsule colliders on the arms and thighs '
              'in the engine; in Blender they follow their parents.',
              'Weights and the remaining limits: rig/qa_report.md.'],
    'files': rel,
    'reimport_check': {'glb': glb, 'fbx': fbx, 'tolerance_m': {'rest_match': TOL_REST, 'pose': TOL_POSE},
                       'sample_poses': list(SRC), 'strip_check_max_mm': strip},
    'approved': {'G1': '2026-10-26', 'G2': '2026-10-27', 'G3': None, 'G4': None},
}
jdump(STEM + '_info.json', info)
jdump(REPORT, dict(source_sha256=src_sha, ctl_free_rest_diff=ctl_free, strip_check_max_mm=strip, transforms=transforms,
                   actions=actions, removed_constraints=removed_cons, glb=glb, fbx=fbx, files=rel))
log('R8 export', 'PASS' if glb['ok'] and fbx['ok'] else 'FAIL', OUT)
