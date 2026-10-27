"""R8 for the rig only (G2 approved 2026-10-27, no clips yet): export the approved W07 rig to <asset_dir>/rig_done/, the
layout the rigging skill's export_core.export_package writes for the other monsters (same as P06), without the control rig.

blender -b --factory-startup -P w07_r8_export.py

The source rig/W07_shroud_spinner_rig.blend is read, never saved. In memory the control armature W07_shroud_spinner_Control
(67 ctl_* bones: leg IK, poles, ik_leg_* switches) is deleted and the runtime bones' FollowControl constraints removed,
leaving the runtime skeleton (48 bones, 41 deform) in rest pose. Written to rig_done/:
  W07_shroud_spinner_rig.blend        byte copy of the source (control rig included)
  textures/                           the three Tripo maps, packed bytes as-is            (export_core._textures)
  W07_shroud_spinner_rig.fbx          Unity axes, textures embedded, no animation         (export_core._fbx)
  W07_shroud_spinner_rig.glb          +Y up, skin, every runtime bone, no animation
  anim/clips.json                     empty manifest (clips come at R6)
  W07_shroud_spinner_rig_info.json    bones, weight health, usable ranges, reimport checks
Reimport (Agent.md R8.4), each file into an empty scene:
  GLB: bone names, parents, heads; image bytes against the Tripo GLB; weights; deformed positions for sample poses
       (the source skinning transforms are copied onto the reimported bones and vertices are matched by rest position,
       so the vertices the exporter splits at UV seams do not matter);
  FBX: armature, bone, mesh and vertex counts, bone names, size.
"""
import bpy, os, sys, json, math, shutil, hashlib, struct, datetime, io, contextlib
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import w07_common as C
import numpy as np
from mathutils import Matrix, kdtree

rc = C.rb.load_skill(0.8)             # k as in validation.json (rig height 1.44 m = 0.8 H)
import export_core as ec

BLEND = os.path.join(C.RIG, C.ASSET + '_rig.blend')
OUT = os.path.join(C.ADIR, 'rig_done')
ANIM = os.path.join(OUT, 'anim')
STEM = os.path.join(OUT, C.ASSET + '_rig')
RIG_NAME, CTL_NAME = C.ASSET + '_Rig', C.ASSET + '_Control'
REPORT = os.path.join(C.WORK, 'r8_export.json')
with open(os.path.join(C.WORK, 'rig_spec.json'), encoding='utf-8') as fh:
    SPEC = json.load(fh)
with open(os.path.join(C.RIG, 'validation.json'), encoding='utf-8') as fh:
    APPROVED_SHA = json.load(fh)['inputs']['blend_sha256']
RUNTIME = [b['name'] for b in SPEC['bones']]
DEFORM = [b['name'] for b in SPEC['bones'] if b['deform']]
TOL_REST = 1e-4                       # m, reimported vertex -> source vertex at rest
TOL_POSE = 1e-3                       # m, deformed source vs deformed reimport
SAMPLES = {                           # runtime bones, local loc (m) / XYZ euler (deg); only compared source vs reimport
    'rest': {},
    'legs': {'cog': dict(loc=(0, -0.10, 0)), 'L_Leg1_02': dict(rot=(25, 0, 0)), 'L_Leg1_03': dict(rot=(-20, 0, 0)),
             'R_Leg2_02': dict(rot=(-15, 0, 10)), 'L_Leg3_01': dict(rot=(0, 0, 8)), 'R_Leg4_04': dict(rot=(20, 0, 0)),
             'L_Leg4_03': dict(rot=(15, 5, 0))},
    'head': {'cephalothorax': dict(rot=(-8, 0, 5)), 'L_fang': dict(rot=(-25, -30, 0)), 'R_fang': dict(rot=(-25, 30, 0)),
             'L_Palp_01': dict(rot=(-20, 0, 0)), 'R_Palp_02': dict(rot=(-45, 0, 0))},
    'abdomen': {'root': dict(loc=(0.2, 0, 0), rot=(0, 10, 0)), 'abdomen_01': dict(rot=(10, 0, 8)),
                'abdomen_02': dict(rot=(-12, 0, 0))},
}


def log(*a):
    print('[W07 R8]', *a, flush=True)


def mat_err(a, b):
    return max(abs(x - y) for ra, rb_ in zip(a, b) for x, y in zip(ra, rb_))


def evaluated(o):
    """Deformed vertex positions in world space."""
    dg = bpy.context.evaluated_depsgraph_get(); e = o.evaluated_get(dg); m = e.to_mesh()
    P = np.empty(len(m.vertices) * 3); m.vertices.foreach_get('co', P); e.to_mesh_clear()
    W = np.array(o.matrix_world)
    return P.reshape(-1, 3) @ W[:3, :3].T + W[:3, 3]


def apply(arm, pose):
    rc.clear_pose(arm)
    for n, p in pose.items():
        pb = arm.pose.bones[n]; pb.rotation_mode = 'XYZ'
        pb.location = p.get('loc', (0, 0, 0)); pb.rotation_euler = [math.radians(a) for a in p.get('rot', (0, 0, 0))]
    bpy.context.view_layer.update()


def skin_mats(arm):
    """World-space skinning transform of every bone: posed matrix times inverse rest matrix."""
    W = arm.matrix_world
    return {pb.name: (W @ pb.matrix) @ (W @ pb.bone.matrix_local).inverted() for pb in arm.pose.bones}


def set_skin(arm, S):
    """Pose arm so each bone has the skinning transform S[name] (works whatever the bone's rest roll/tail is)."""
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


def bbox(P):
    return [round(float(x), 4) for x in (P.max(0) - P.min(0))]


def reimported():
    """-> armatures, skinned meshes, other meshes (the glTF importer adds an Icosphere as the bones' display shape)."""
    arms = [o for o in bpy.data.objects if o.type == 'ARMATURE']
    shapes = {pb.custom_shape for a in arms for pb in a.pose.bones if pb.custom_shape}
    meshes = [o for o in bpy.data.objects if o.type == 'MESH' and o not in shapes]
    skinned = [o for o in meshes if any(md.type == 'ARMATURE' and md.object in arms for md in o.modifiers)]
    return arms, skinned, [o.name for o in meshes if o not in skinned]


# ------------------------------------------------------------------ source
ad, aid = ec.asset_dir_of(BLEND)
assert os.path.normcase(os.path.abspath(ad)) == os.path.normcase(os.path.abspath(C.ADIR)) and aid == C.ASSET, (ad, aid)
src_sha = C.sha256(BLEND)
assert src_sha == APPROVED_SHA, ('the .blend changed since R4/R5', src_sha, APPROVED_SHA)
assert C.sha256(C.GLB) == C.GLB_SHA
os.makedirs(ANIM, exist_ok=True)
shutil.copy2(BLEND, STEM + '.blend')          # the source as approved at G2, control rig included

bpy.ops.wm.open_mainfile(filepath=BLEND)
vl = bpy.context.view_layer
rig, ctl = bpy.data.objects[RIG_NAME], bpy.data.objects[CTL_NAME]
parts = ec._parts(rig)
assert len(parts) == 1 and parts[0].name == C.ASSET, [o.name for o in parts]
assert not ec._parts(ctl)
ob = parts[0]
transforms = {o.name: round(mat_err(o.matrix_world, Matrix.Identity(4)), 9) for o in (rig, ob)}
actions = [a.name for a in bpy.data.actions]
modifiers = [m.type for m in ob.modifiers]
for a in (rig, ctl):
    if a.animation_data:
        a.animation_data.action = None
rc.clear_pose(ctl); rc.clear_pose(rig); vl.update()
rest_with_ctl = evaluated(ob)

# runtime skeleton: FollowControl constraints off, control armature gone (in memory only)
removed_cons = []
for pb in rig.pose.bones:
    for c in list(pb.constraints):
        removed_cons.append(pb.name + ':' + c.name); pb.constraints.remove(c)
rig_drivers = len(rig.animation_data.drivers) if rig.animation_data else 0
ctl_bones = len(ctl.data.bones); ctl_data = ctl.data
bpy.data.objects.remove(ctl, do_unlink=True); bpy.data.armatures.remove(ctl_data)
others = sorted(o.name for o in bpy.data.objects if o not in (rig, ob))
bones = rig.data.bones
assert sorted(b.name for b in bones) == sorted(RUNTIME), [b.name for b in bones]
assert sorted(b.name for b in bones if b.use_deform) == sorted(DEFORM)
assert len(RUNTIME) == 48 and len(DEFORM) == 41
rc.clear_pose(rig); vl.update()

SRC = {}
for k, pose in SAMPLES.items():
    apply(rig, pose); SRC[k] = dict(P=evaluated(ob), S=skin_mats(rig))
rc.clear_pose(rig); vl.update()
REST = SRC['rest']['P']
ctl_free = float(np.abs(REST - rest_with_ctl).max())
heads = {b.name: (rig.matrix_world @ b.head_local).copy() for b in bones}
parents = {b.name: (b.parent.name if b.parent else None) for b in bones}
with contextlib.redirect_stdout(io.StringIO()):
    health = rc.weight_health(ob, rig)
n_verts = len(ob.data.vertices); n_tris = sum(len(p.vertices) - 2 for p in ob.data.polygons)
size = bbox(REST)
log('source', RIG_NAME, ob.name, n_verts, 'verts', 'bones', len(bones), 'removed', CTL_NAME, ctl_bones, 'bones,',
    len(removed_cons), 'constraints; rig drivers', rig_drivers, '| ctl-free rest diff', ctl_free, '| size', size,
    '| transforms', transforms, '| actions', actions, '| modifiers', modifiers, '| other objects', others)

# ------------------------------------------------------------------ export
ec._select([rig, ob])
tex = ec._textures([ob], os.path.join(OUT, 'textures')); relink = ec._direct_base_color([ob])
try:
    for img, (_, p) in tex.items():
        img.filepath_raw = p
    ec._fbx(STEM + '.fbx', [rig, ob], anim=False, deform_only=False)
finally:
    for img, (raw, _) in tex.items():
        img.filepath_raw = raw
    for m, sock in relink:
        bsdf = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
        m.node_tree.links.new(sock, bsdf.inputs['Base Color'])
ec._select([rig, ob])
bpy.ops.export_scene.gltf(filepath=STEM + '.glb', export_format='GLB', use_selection=True, export_yup=True,
                          export_skins=True, export_animations=False, export_def_bones=False,
                          export_rest_position_armature=True, export_image_format='AUTO', export_apply=False,
                          export_cameras=False, export_lights=False, export_extras=False)
with open(os.path.join(ANIM, 'clips.json'), 'w', encoding='utf-8') as fh:
    json.dump({'asset_id': C.ASSET, 'rig': RIG_NAME, 'clips': []}, fh, ensure_ascii=False, indent=1)
tex_files = sorted(os.path.relpath(p, OUT).replace('\\', '/') for _, p in tex.values())
log('exported', STEM + '.fbx', STEM + '.glb', tex_files)

# ------------------------------------------------------------------ GLB file and reimport
js, out_img = glb_images(STEM + '.glb')
_, src_img = glb_images(C.GLB)
skin_joints = [js['nodes'][j]['name'] for j in js['skins'][0]['joints']] if js.get('skins') else []
wtypes = sorted({js['accessors'][p['attributes']['WEIGHTS_0']]['componentType']
                 for m in js.get('meshes', []) for p in m['primitives'] if 'WEIGHTS_0' in p['attributes']})
glb = dict(file_mb=round(os.path.getsize(STEM + '.glb') / 2 ** 20, 2), skins=len(js.get('skins', [])),
           meshes_in_file=len(js.get('meshes', [])), nodes_in_file=len(js.get('nodes', [])),
           joints=len(skin_joints), ctl_in_file=[n.get('name') for n in js['nodes'] if str(n.get('name', '')).startswith('ctl_')],
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
R = evaluated(M)
glb.update(verts=len(R), size_m=bbox(R))
kd = kdtree.KDTree(len(REST))
for i, co in enumerate(REST):
    kd.insert(co, i)
kd.balance()
cands = [[i for _, i, _ in kd.find_range(co, TOL_REST)] for co in R]
unmatched = sum(1 for c in cands if not c)
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
glb.update(unmatched_verts=unmatched, source_verts_not_covered=int((~covered).sum()), max_influences=mw, weight_sum_off=bad_sum)
poses = {}
for k, s in SRC.items():
    set_skin(A, s['S'])
    S_re = skin_mats(A)
    D = np.linalg.norm(evaluated(M)[:, None, :] - s['P'][safe], axis=2); D[~mask] = np.inf
    d = D.min(1)[np.isfinite(D.min(1))]
    poses[k] = dict(max_mm=round(1000 * float(d.max()), 4), p999_mm=round(1000 * float(np.percentile(d, 99.9)), 4),
                    skin_mat_err=round(max(mat_err(S_re[n], s['S'][n]) for n in S_re), 7))
glb['poses'] = poses
glb['ok'] = (glb['armatures'] == 1 and glb['meshes'] == 1 and glb['meshes_in_file'] == 1 and not other
             and glb['bones'] == len(RUNTIME) and glb['joints'] == len(RUNTIME) and glb['names_ok'] and glb['parents_ok']
             and glb['deform_groups_ok'] and not glb['ctl_in_file'] and glb['animations'] == 0 and glb['head_err_mm'] < 0.1
             and unmatched == 0 and glb['source_verts_not_covered'] == 0 and mw <= 4 and bad_sum == 0
             and glb['images_same_bytes_as_tripo'] and all(p['max_mm'] < 1000 * TOL_POSE for p in poses.values()))
log('glb reimport', json.dumps(glb))

# ------------------------------------------------------------------ FBX reimport
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=STEM + '.fbx')
arms, mobs, other = reimported()
for a in arms:
    rc.clear_pose(a)
bpy.context.view_layer.update()
FP = np.concatenate([evaluated(m) for m in mobs]) if mobs else np.zeros((1, 3))
fbx = dict(file_mb=round(os.path.getsize(STEM + '.fbx') / 2 ** 20, 2), armatures=len(arms),
           bones=sum(len(a.data.bones) for a in arms), meshes=len(mobs), other_meshes=other,
           verts=sum(len(m.data.vertices) for m in mobs),
           names_ok=bool(arms) and sorted(b.name for b in arms[0].data.bones) == sorted(RUNTIME),
           size_m=bbox(FP), images_loaded=[list(i.size) for i in bpy.data.images])
fbx['ok'] = (fbx['armatures'] == 1 and fbx['bones'] == len(RUNTIME) and fbx['verts'] == n_verts
             and fbx['meshes'] == 1 and not other and fbx['names_ok']
             and max(abs(a - b) for a, b in zip(fbx['size_m'], size)) < 0.01)
log('fbx reimport', json.dumps(fbx))

# ------------------------------------------------------------------ info
files = dict(model_fbx=STEM + '.fbx', model_glb=STEM + '.glb', blend=STEM + '.blend', clips=[], textures=tex_files)
rel = {k: (os.path.relpath(v, OUT).replace('\\', '/') if isinstance(v, str) else v) for k, v in files.items()}
info = {
    'asset_id': C.ASSET, 'rig': RIG_NAME, 'exported': datetime.datetime.now().isoformat(timespec='seconds'),
    'source_blend': BLEND, 'source_sha256': src_sha, 'family': 'A', 'route': 'M',
    'units': 'm', 'blender_axes': 'Z up, faces -Y, its left = +X', 'fbx_axes': 'Y up, -Z forward (Unity)',
    'glb_axes': 'Y up, faces +Z', 'deform_only': False, 'size_m': dict(zip(('x', 'y', 'z'), size)),
    'bones': {'total': len(RUNTIME), 'deform': len(DEFORM), 'sockets': [n for n in RUNTIME if n not in DEFORM]},
    'roll_convention': 'legs and palps: local X = hinge axis, +X rotation = more flexion on both sides (R = X-mirror of L); '
                       'body bones local X ~ world +X; root, cog and ground point up (+Z)',
    'control_rig': {'kept_in': 'rig/' + os.path.basename(BLEND) + ' (and the copy here)',
                    'not_exported': f'{CTL_NAME} ({ctl_bones} ctl_* bones)', 'constraints_removed': len(removed_cons),
                    'legs': 'ctl_<S>_Leg<n>_IK at the foot tip (child of ctl_root) carries the ankle target; 2-bone IK on '
                            '_02 femur + _03 tibia with ctl_<S>_Leg<n>_pole (child of ctl_cog); _04 tarsus Damped Track to the IK control',
                    'switches': 'ik_leg_L1 .. ik_leg_R4 on the control object (1 = IK, 0 = FK)',
                    'body': 'ctl_cog raises, lowers and tilts the body with the feet planted'},
    'parts': {C.ASSET: {'role': 'body', 'verts': n_verts, 'tris': n_tris,
                        'removed_from_tripo_glb': 'two loose rear-leg fragments, 286 verts / 452 tris (G1)'}},
    'weight_health': {C.ASSET: health},
    'spring_chains': [], 'leg_colliders': [],
    'usable_ranges': {'abdomen_01': 'pitch/yaw +-10 deg (the Tripo abdomen already overlaps the head plate at rest); '
                                    '15 deg tested at 1.87x',
                      'abdomen_02': 'curl <= ~12 deg (spinneret cap); big abdomen swings go on abdomen_01',
                      'leg lift (IK control)': '0.35 m tested, stretch 1.52-2.68x',
                      'ctl_cog': '-0.30 m (body to the ground) tested, 1.62x; turn +-20 deg <= 1.48x',
                      'fangs / palps': 'fang X -25 deg, Y -+30 deg with Palp_01 X -20, Palp_02 X -45 tested, 2.69x at the palp apex',
                      '<S>_Leg<n>_01 coxa': 'FK only, small rotations: big coxa lifts push into the sternum; lift legs with the IK control'},
    'notes': ['Family A (multi-leg): 8 legs x 4 segments (_01 coxa, _02 femur, _03 tibia, _04 tarsus), 2 palps x 2, 2 fangs. '
              'Clips are made at R6 on the control rig and baked onto these bones at R8.',
              'The control rig is not exported: it drives the runtime bones through FollowControl (Copy Transforms) '
              'constraints in the source .blend only.',
              'Sockets carry no weights: root = ground origin, cog = body, ground, hit_origin, fx_head, fx_abdomen, '
              'fx_spinneret (silk).',
              'Leg1 and Leg2 of each side are fused in the Tripo mesh: their shared knob is rigid to the cephalothorax.'],
    'files': rel,
    'reimport_check': {'glb': glb, 'fbx': fbx, 'tolerance_m': {'rest_match': TOL_REST, 'pose': TOL_POSE}},
    'approved': {'G1': '2026-10-26', 'G2': '2026-10-27', 'G3': None, 'G4': None},
}
with open(STEM + '_info.json', 'w', encoding='utf-8') as fh:
    json.dump(info, fh, ensure_ascii=False, indent=1)
C.jdump(REPORT, dict(source_sha256=src_sha, ctl_free_rest_diff=ctl_free, transforms=transforms, actions=actions,
                     removed_constraints=removed_cons, glb=glb, fbx=fbx, files=rel))
log('R8 export', 'PASS' if glb['ok'] and fbx['ok'] else 'FAIL', OUT)
