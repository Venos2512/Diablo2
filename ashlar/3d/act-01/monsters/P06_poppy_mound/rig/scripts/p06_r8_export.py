"""R8 for the rig only (G2 approved 2026-10-27, no clips yet): export the approved rig to <asset_dir>/rig_done/, the
layout the rigging skill's export_core.export_package writes for the other monsters, without the control rig.

blender -b --factory-startup -P p06_r8_export.py

The source rig/P06_poppy_mound_rig.blend is read, never saved: its control rig (ctl_breath, ctl_sway and their
Transformation constraints) stays there. In memory the constraints are removed and the ctl_* bones deleted, leaving the
runtime skeleton (root, 10 deform, 4 fx_* sockets) in rest pose. Written to rig_done/:
  P06_poppy_mound_rig.blend        byte copy of the source (control rig included)
  textures/                        the three Tripo maps, packed bytes as-is            (export_core._textures)
  P06_poppy_mound_rig.fbx          Unity axes, textures embedded, no animation         (export_core._fbx)
  P06_poppy_mound_rig.glb          +Y up, skin, every runtime bone, no animation
  anim/clips.json                  empty manifest (clips come at R6)
  P06_poppy_mound_rig_info.json    bones, weight health, usable ranges, reimport checks
Reimport (Agent.md R8.4), each file into an empty scene:
  GLB: bone names, parents, heads; image bytes against the Tripo GLB; weights; deformed positions for sample poses
       (the source skinning transforms are copied onto the reimported bones and vertices are matched by rest position,
       so the vertices the exporter splits at UV seams do not matter);
  FBX: armature, bone, mesh and vertex counts, bone names, size (as export_core._reimport_check, which needs a window).
"""
import bpy, os, sys, json, math, shutil, hashlib, struct, datetime, io, contextlib
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import p06_common as C
import numpy as np
from mathutils import Matrix, kdtree

rc = C.rb.load_skill(1.0)             # the skill's rig_core (k = H/1.8 = 1); export_core binds to the same module
import export_core as ec

OUT = os.path.join(C.ADIR, 'rig_done')
ANIM = os.path.join(OUT, 'anim')
STEM = os.path.join(OUT, C.AID + '_rig')
RUNTIME = ['root', 'body', 'crown', 'flank_front', 'L_flank', 'R_flank', 'flank_back', 'bloom_center', 'bloom_main',
           'L_bloom', 'R_bloom', 'fx_spawn_main', 'fx_spawn_L', 'fx_spawn_R', 'fx_body']
DEFORM = ['body', 'crown', 'flank_front', 'L_flank', 'R_flank', 'flank_back', 'bloom_center', 'bloom_main', 'L_bloom', 'R_bloom']
FLANKS = ['flank_front', 'L_flank', 'R_flank', 'flank_back']
TOL_REST = 1e-4                       # m, reimported vertex -> source vertex at rest
TOL_POSE = 1e-3                       # m, deformed source vs deformed reimport
SAMPLES = {
    'rest': {},
    'swell': {'crown': dict(loc=(0, 0.08, 0)), **{f: dict(loc=(0, 0.06, 0)) for f in FLANKS}},
    'sway': {'root': dict(loc=(0.2, 0, 0), rot=(0, 0, 10)), 'bloom_center': dict(rot=(20, 0, 15)),
             'bloom_main': dict(rot=(0, 0, 20)), 'L_bloom': dict(rot=(12, 0, 0)), 'R_bloom': dict(rot=(0, 0, -12))},
    'hit': {'crown': dict(rot=(-6, 0, 0)), 'flank_front': dict(loc=(0, -0.04, 0)), 'body': dict(rot=(0, 4, 0)),
            'L_flank': dict(rot=(5, 0, 0))},
}
REPORT = os.path.join(C.WORK, 'r8_export.json')


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


# ------------------------------------------------------------------ source
ad, aid = ec.asset_dir_of(C.BLEND)
assert os.path.normcase(ad) == os.path.normcase(C.ADIR) and aid == C.AID, (ad, aid)
os.makedirs(ANIM, exist_ok=True)
src_sha = C.sha256(C.BLEND)
shutil.copy2(C.BLEND, STEM + '.blend')          # the source as approved, control rig included

bpy.ops.wm.open_mainfile(filepath=C.BLEND)
vl = bpy.context.view_layer
rig = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
parts = ec._parts(rig)
assert len(parts) == 1, [o.name for o in parts]
ob = parts[0]
transforms = {o.name: round(mat_err(o.matrix_world, Matrix.Identity(4)), 9) for o in (rig, ob)}
actions = [a.name for a in bpy.data.actions]
if rig.animation_data:
    rig.animation_data.action = None
rc.clear_pose(rig); vl.update()
rest_with_ctl = evaluated(ob)

# runtime skeleton: constraints off, ctl_* bones and the Control collection gone (in memory only)
removed_cons = []
for pb in rig.pose.bones:
    for c in list(pb.constraints):
        removed_cons.append(pb.name + ':' + c.name); pb.constraints.remove(c)
ec._select([rig])
bpy.ops.object.mode_set(mode='EDIT')
ctl = [b.name for b in rig.data.edit_bones if b.name.startswith('ctl_')]
for n in ctl:
    rig.data.edit_bones.remove(rig.data.edit_bones[n])
bpy.ops.object.mode_set(mode='OBJECT')
if 'Control' in rig.data.collections:
    rig.data.collections.remove(rig.data.collections['Control'])
bones = rig.data.bones
assert sorted(b.name for b in bones) == sorted(RUNTIME), [b.name for b in bones]
assert sorted(b.name for b in bones if b.use_deform) == sorted(DEFORM)
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
rig_name, ob_name = rig.name, ob.name
size = bbox(REST)
C.log('source', rig_name, ob_name, n_verts, 'verts', 'bones', len(bones), 'removed', ctl, len(removed_cons), 'constraints',
      'ctl-free rest diff', ctl_free, 'size', size, 'transforms', transforms, 'actions', actions)

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
    json.dump({'asset_id': C.AID, 'rig': rig_name, 'clips': []}, fh, ensure_ascii=False, indent=1)
tex_files = sorted(os.path.relpath(p, OUT).replace('\\', '/') for _, p in tex.values())
C.log('exported', STEM + '.fbx', STEM + '.glb', tex_files)

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

def reimported():
    """-> armatures, skinned meshes, other meshes (the glTF importer adds an Icosphere as the bones' display shape)."""
    arms = [o for o in bpy.data.objects if o.type == 'ARMATURE']
    shapes = {pb.custom_shape for a in arms for pb in a.pose.bones if pb.custom_shape}
    meshes = [o for o in bpy.data.objects if o.type == 'MESH' and o not in shapes]
    skinned = [o for o in meshes if any(md.type == 'ARMATURE' and md.object in arms for md in o.modifiers)]
    return arms, skinned, [o.name for o in meshes if o not in skinned]


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
gi = {g.index: g.name for g in M.vertex_groups}
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
             and glb['bones'] == len(RUNTIME) and glb['joints'] == len(RUNTIME) and glb['names_ok'] and glb['parents_ok'] and glb['deform_groups_ok'] and not glb['ctl_in_file']
             and glb['animations'] == 0 and glb['head_err_mm'] < 0.1 and unmatched == 0 and glb['source_verts_not_covered'] == 0
             and mw <= 4 and bad_sum == 0 and all(p['max_mm'] < 1000 * TOL_POSE for p in poses.values()))
C.log('glb reimport', json.dumps(glb))

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
C.log('fbx reimport', json.dumps(fbx))

# ------------------------------------------------------------------ info
files = dict(model_fbx=STEM + '.fbx', model_glb=STEM + '.glb', blend=STEM + '.blend', clips=[], textures=tex_files)
rel = {k: (os.path.relpath(v, OUT).replace('\\', '/') if isinstance(v, str) else v) for k, v in files.items()}
info = {
    'asset_id': C.AID, 'rig': rig_name, 'exported': datetime.datetime.now().isoformat(timespec='seconds'),
    'source_blend': C.BLEND, 'source_sha256': src_sha, 'family': 'O', 'route': 'M',
    'units': 'm', 'blender_axes': 'Z up, faces -Y, its left = +X', 'fbx_axes': 'Y up, -Z forward (Unity)',
    'glb_axes': 'Y up, faces +Z', 'deform_only': False, 'size_m': dict(zip(('x', 'y', 'z'), size)),
    'bones': {'total': len(RUNTIME), 'deform': len(DEFORM), 'sockets': [n for n in RUNTIME if n not in DEFORM]},
    'control_rig': {'kept_in': 'rig/' + os.path.basename(C.BLEND) + ' (and the copy here)', 'not_exported': ctl,
                    'constraints_removed': len(removed_cons),
                    'ctl_breath': 'local Y -> crown loc Y x1.0, flank_* loc Y x0.75',
                    'ctl_sway': 'local loc/rot X,Z -> bloom_center x1.0, L_bloom/R_bloom x0.9, bloom_main x0.4'},
    'parts': {ob_name: {'role': 'body', 'verts': n_verts, 'tris': n_tris}},
    'weight_health': {ob_name: health},
    'spring_chains': [], 'leg_colliders': [],
    'usable_ranges': {'bloom_main': '+-30 deg', 'bloom_center': 'X +-30 deg, Z +-20 deg', 'L_bloom': '+-15 deg',
                      'R_bloom': '+-15 deg', 'ctl_sway': 'translate <= 0.10 m',
                      'death_collapse': 'crown -0.25 m + flank sag 0.10 m (body stretch 1.82x)'},
    'notes': ['Family O (object / nest): no locomotion. Clips (idle breath, cast = moth release at fx_spawn_*, hit, death) '
              'are made at R6 on the control rig and baked onto these bones at R8.',
              'The control rig is not exported: ctl_breath / ctl_sway drive the runtime bones through Transformation '
              'constraints in the source .blend only.',
              'One bone per flower cluster: keep L_bloom / R_bloom within +-15 deg; beyond that the outer stems stretch '
              'past 1.6x (qa_report.md section 5).',
              'Sockets carry no weights: fx_spawn_main / fx_spawn_L / fx_spawn_R = Hush-Moth release points, '
              'fx_body = hit / death VFX, root = ground.'],
    'files': rel,
    'reimport_check': {'glb': glb, 'fbx': fbx, 'tolerance_m': {'rest_match': TOL_REST, 'pose': TOL_POSE}},
    'approved': {'G1': '2026-10-26', 'G2': '2026-10-27', 'G3': None, 'G4': None},
}
with open(STEM + '_info.json', 'w', encoding='utf-8') as fh:
    json.dump(info, fh, ensure_ascii=False, indent=1)
C.write_json(REPORT, dict(source_sha256=src_sha, ctl_free_rest_diff=ctl_free, transforms=transforms, actions=actions,
                          removed_constraints=removed_cons, glb=glb, fbx=fbx, files=rel))
C.log('R8 export', 'PASS' if glb['ok'] and fbx['ok'] else 'FAIL', OUT)
