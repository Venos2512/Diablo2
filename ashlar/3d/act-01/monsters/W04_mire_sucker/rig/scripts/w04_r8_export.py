"""R8 for the rig only (G2 approved 2026-10-27, no clips yet): export the approved rig to <asset_dir>/rig_done/, the
layout of the rigging skill's export_core.export_package, without the control rig. Same method as B01 and P06
(rig/scripts/b01_r8_export.py, p06_r8_export.py of those assets): export_package is not called because it saves the
.blend and would export W04_mire_sucker_Control too.

blender -b --factory-startup -P w04_r8_export.py

The source rig/W04_mire_sucker_rig.blend is read, never saved. The 28 test poses of w04_q1_qa.py (same table below) are
posed on the control rig first and their skinning transforms recorded. Then, in memory only, the Copy Transforms
constraints of the runtime skeleton are removed and the control rig deleted, leaving W04_mire_sucker_Skeleton (41 bones,
34 deform) in rest pose. Written to rig_done/:
  W04_mire_sucker_rig.blend        byte copy of the source (control rig included)
  textures/                        the three Tripo maps, packed bytes as-is            (export_core._textures)
  W04_mire_sucker_rig.fbx          Unity axes, textures embedded, no animation         (export_core._fbx)
  W04_mire_sucker_rig.glb          +Y up, skin, every runtime bone, no animation
  anim/clips.json                  empty manifest (clips come at R6)
  W04_mire_sucker_rig_info.json    bones, weight health, usable ranges, reimport checks
Reimport (Agent.md R8.4), each file into an empty scene: bone names, parents, heads; image bytes against the Tripo GLB;
weights; deformed positions of every test pose (the recorded skinning transforms are copied onto the reimported bones
and vertices are matched by rest position, so the vertices the exporters split at UV seams do not matter).
-> rig/_work/r8_export.json
"""
import contextlib
import datetime
import io
import json
import os
import shutil
import sys
import time

import bpy
import numpy as np
from mathutils import Matrix, Vector, kdtree

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import w04_bkit as K
import w04_common as C
import w04_glb as G
import w04_rig_def as D

sys.path.insert(0, C.TOOLS)
import rigbatch as rb  # noqa: E402
rc = rb.load_skill(C.K)               # the skill's rig_core; export_core binds to the same module
import export_core as ec  # noqa: E402

T0 = time.time()
OUT = os.path.join(C.ADIR, 'rig_done')
ANIM = os.path.join(OUT, 'anim')
STEM = os.path.join(OUT, C.AID + '_rig')
B = D.build()
RUNTIME = [b['name'] for b in B]
DEFORM = D.deform_names(B)
TOL_REST = 1e-4                       # m, reimported vertex -> source vertex at rest
TOL_POSE = 1e-3                       # m, deformed source vs deformed reimport
REPORT = os.path.join(C.WORK, 'r8_export.json')


def log(*a):
    print('[w04 r8]', *a, flush=True)


def jdump(path, obj):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, indent=1, ensure_ascii=False)


def mat_err(a, b):
    return max(abs(x - y) for ra, rb_ in zip(a, b) for x, y in zip(ra, rb_))


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
    R = K.eval_co(M)
    kd = kdtree.KDTree(len(REST))
    for i, co in enumerate(REST):
        kd.insert(co, i)
    kd.balance()
    cands = [[i for _, i, _ in kd.find_range(co, TOL_REST)] for co in R]
    covered = np.zeros(len(REST), bool)
    for c in cands:
        covered[c] = True
    nk = max(1, max(len(c) for c in cands))
    idx = np.full((len(R), nk), -1)
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
        Dd = np.linalg.norm(K.eval_co(M)[:, None, :] - s['P'][safe], axis=2); Dd[~mask] = np.inf
        d = Dd.min(1); d = d[np.isfinite(d)]
        poses[k] = dict(max_mm=round(1000 * float(d.max()), 4), p999_mm=round(1000 * float(np.percentile(d, 99.9)), 4),
                        skin_mat_err=round(max(mat_err(S_re[n], s['S'][n]) for n in S_re), 7))
    rc.clear_pose(A); bpy.context.view_layer.update()
    res['poses'] = poses
    res['pose_ok'] = all(p['max_mm'] < 1000 * TOL_POSE for p in poses.values())
    return res


# ------------------------------------------------------------------ test poses on the control rig (as w04_q1_qa.py)
def rl(name, axis, deg):
    K.rot_local(ct, name, axis, deg)


def loc(name, v):
    ct.pose.bones[name].location = v


def spread():
    rl('ctl_L_Wing', (1, 0, 0), -35); rl('ctl_L_Wing', (0, 0, 1), -50)
    rl('ctl_R_Wing', (1, 0, 0), -35); rl('ctl_R_Wing', (0, 0, 1), 50)


def flight():
    """spread + pitch the wing about its span until the dorsal side faces up (sign picked per side by the result)"""
    spread()
    for s in 'LR':
        best = None
        for sg in (1, -1):
            pb = ct.pose.bones[f'ctl_{s}_Wing']
            q0 = pb.rotation_quaternion.copy()
            rl(f'ctl_{s}_Wing', (0, 1, 0), 75 * sg)
            bpy.context.view_layer.update()
            zz = ((rt.matrix_world @ rt.pose.bones[f'{s}_WingF_01'].matrix).to_3x3() @ Vector((0, 0, 1))).z
            if best is None or zz > best[0]:
                best = (zz, sg)
            pb.rotation_quaternion = q0
        rl(f'ctl_{s}_Wing', (0, 1, 0), 75 * best[1])


POSES = {
    'wings_spread': lambda: spread(),
    'wings_pitch': lambda: flight(),
    'wings_up': lambda: (spread(), rl('ctl_L_Wing', (1, 0, 0), 45), rl('ctl_R_Wing', (1, 0, 0), 45)),
    'wings_down': lambda: (spread(), rl('ctl_L_Wing', (1, 0, 0), -40), rl('ctl_R_Wing', (1, 0, 0), -40)),
    'wings_twist': lambda: (spread(), [rl(f'ctl_{s}_Wing{w}_01', (0, 1, 0), 25 if s == 'L' else -25) for s in 'LR' for w in 'FB']),
    'wings_fan': lambda: [(rl(f'ctl_{s}_WingB_01', (1, 0, 0), -20), rl(f'ctl_{s}_WingF_01', (1, 0, 0), 10)) for s in 'LR'],
    'wings_fold': lambda: (rl('ctl_L_Wing', (0, 0, 1), 20), rl('ctl_R_Wing', (0, 0, 1), -20),
                           rl('ctl_L_Wing', (1, 0, 0), -15), rl('ctl_R_Wing', (1, 0, 0), -15)),
    'lift_L1': lambda: loc('ctl_L_Leg1_IK', (0, 0, 0.12)),
    'lift_R1': lambda: loc('ctl_R_Leg1_IK', (0, 0, 0.12)),
    'lift_L3': lambda: loc('ctl_L_Leg3_IK', (0, 0, 0.12)),
    'lift_R3': lambda: loc('ctl_R_Leg3_IK', (0, 0, 0.12)),
    'step_L1_fwd': lambda: loc('ctl_L_Leg1_IK', (0, 0.15, 0.05)),
    'step_L3_back': lambda: loc('ctl_L_Leg3_IK', (0, -0.12, 0.05)),
    'body_down': lambda: loc('ctl_cog', (0, -0.15, 0)),
    'body_roll': lambda: rl('ctl_cog', (0, 0, 1), 12),
    'stab': lambda: (loc('ctl_cog', (0, -0.04, 0.08)), rl('ctl_cog', (1, 0, 0), 10), rl('ctl_head', (1, 0, 0), 12),
                     rl('ctl_proboscis_01', (1, 0, 0), -8)),
    'suck_pin': lambda: (ct.__setitem__('ik_proboscis', 1.0), loc('ctl_cog', (0, -0.06, 0)), rl('ctl_cog', (1, 0, 0), 8)),
    'lobes_sway': lambda: rl('ctl_abdomen_01', (0, 0, 1), 14),
    'lobes_opposite': lambda: (rl('ctl_L_abdomen_02', (1, 0, 0), 15), rl('ctl_R_abdomen_02', (1, 0, 0), -15)),
    'lobes_opposite_8': lambda: (rl('ctl_L_abdomen_02', (1, 0, 0), 8), rl('ctl_R_abdomen_02', (1, 0, 0), -8)),
    'lobes_down': lambda: (rl('ctl_L_abdomen_02', (1, 0, 0), -18), rl('ctl_R_abdomen_02', (1, 0, 0), -18)),
    'abdomen_up': lambda: rl('ctl_abdomen_01', (1, 0, 0), 15),
    'abdomen_down': lambda: rl('ctl_abdomen_01', (1, 0, 0), -15),
    'abdomen_down_8': lambda: rl('ctl_abdomen_01', (1, 0, 0), -8),
    'wings_down_60': lambda: (spread(), rl('ctl_L_Wing', (1, 0, 0), -25), rl('ctl_R_Wing', (1, 0, 0), -25)),
    'head_down': lambda: rl('ctl_head', (1, 0, 0), 20),
    'head_up': lambda: rl('ctl_head', (1, 0, 0), -20),
    'head_turn': lambda: rl('ctl_head', (0, 0, 1), 25),
}


def reset():
    K.reset_pose(ct)
    ct['ik_proboscis'] = 0.0
    for s in 'LR':
        for l in ('1', '3'):
            ct[f'ik_leg_{s}{l}'] = 1.0
    ct.update_tag(); scn.frame_set(scn.frame_current)      # switches drive constraint influence: re-run the drivers


# ------------------------------------------------------------------ source
ad, aid = ec.asset_dir_of(C.BLEND)
assert os.path.normcase(ad) == os.path.normcase(C.ADIR) and aid == C.AID, (ad, aid)
os.makedirs(ANIM, exist_ok=True)
src_sha = C.sha256_file(C.BLEND)
shutil.copy2(C.BLEND, STEM + '.blend')          # the source as approved, control rig included

bpy.ops.wm.open_mainfile(filepath=C.BLEND)
vl = bpy.context.view_layer; scn = bpy.context.scene
ob, rt, ct = K.mesh(), K.runtime(), K.control()
parts = ec._parts(rt)
assert parts == [ob], [o.name for o in parts]
assert ob.parent in (None, rt), ob.parent
assert sorted(b.name for b in rt.data.bones) == sorted(RUNTIME), [b.name for b in rt.data.bones]
assert sorted(b.name for b in rt.data.bones if b.use_deform) == sorted(DEFORM)
transforms = {o.name: round(mat_err(o.matrix_world, Matrix.Identity(4)), 9) for o in (rt, ct, ob)}
actions = [a.name for a in bpy.data.actions]
scale = float(scn['w04_scale'])

SRC = {}
for k, fn in POSES.items():
    reset(); fn(); ct.update_tag(); scn.frame_set(scn.frame_current)
    SRC[k] = dict(P=K.eval_co(ob), S=skin_mats(rt))
reset()
rest_with_ctl = K.eval_co(ob)
moved = {k: round(1000 * float(np.linalg.norm(s['P'] - rest_with_ctl, axis=1).max()), 1) for k, s in SRC.items()}

# runtime skeleton alone: constraints off, control rig gone (in memory only)
removed_cons = []
for pb in rt.pose.bones:
    for c in list(pb.constraints):
        removed_cons.append(pb.name + ':' + c.type); pb.constraints.remove(c)
ctl_bones = len(ct.data.bones)
ct_data = ct.data
bpy.data.objects.remove(ct, do_unlink=True)
bpy.data.armatures.remove(ct_data)
left = [o.name for o in bpy.data.objects if o.type == 'ARMATURE' and o is not rt]
assert not left, left
rc.clear_pose(rt); vl.update()
REST = K.eval_co(ob)
ctl_free = float(np.abs(REST - rest_with_ctl).max())
rest_vs_data = float(np.abs(REST - K.rest_co(ob)).max())
strip = {}                                       # the recorded transforms reproduce every pose on the bare runtime rig
for k, s in SRC.items():
    set_skin(rt, s['S'])
    strip[k] = round(1000 * float(np.linalg.norm(K.eval_co(ob) - s['P'], axis=1).max()), 4)
rc.clear_pose(rt); vl.update()
heads = {b.name: (rt.matrix_world @ b.head_local).copy() for b in rt.data.bones}
parents = {b.name: (b.parent.name if b.parent else None) for b in rt.data.bones}
with contextlib.redirect_stdout(io.StringIO()):
    health = rc.weight_health(ob, rt)
n_verts = len(ob.data.vertices); n_tris = sum(len(p.vertices) - 2 for p in ob.data.polygons)
ob_name, rt_name = ob.name, rt.name              # the reimports below reset the scene
size = bbox(REST)
log('source', rt_name, ob_name, n_verts, 'verts', len(RUNTIME), 'bones; removed', C.CONTROL, ctl_bones, 'bones,',
    len(removed_cons), 'constraints; ctl-free rest diff', ctl_free, 'm; rest vs mesh data', rest_vs_data,
    'm; strip max mm', max(strip.values()), '; size', size, '; transforms', transforms, '; actions', actions)

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
jdump(os.path.join(ANIM, 'clips.json'), {'asset_id': C.AID, 'rig': rt_name, 'clips': []})
tex_files = sorted(os.path.relpath(p, OUT).replace('\\', '/') for _, p in tex.values())
log('exported', STEM + '.fbx', STEM + '.glb', tex_files)

# ------------------------------------------------------------------ GLB file and reimport
js, bin_ = G.read(STEM + '.glb')
out_img = G.images_by_role(js, bin_)
src_img = G.images_by_role(*G.read(C.GLB))
skin_joints = [js['nodes'][j]['name'] for j in js['skins'][0]['joints']] if js.get('skins') else []
wtypes = sorted({js['accessors'][p['attributes']['WEIGHTS_0']]['componentType']
                 for m in js.get('meshes', []) for p in m['primitives'] if 'WEIGHTS_0' in p['attributes']})
glb = dict(file_mb=round(os.path.getsize(STEM + '.glb') / 2 ** 20, 2), skins=len(js.get('skins', [])),
           meshes_in_file=len(js.get('meshes', [])), nodes_in_file=len(js.get('nodes', [])), joints=len(skin_joints),
           ctl_in_file=[n.get('name') for n in js['nodes'] if str(n.get('name', '')).startswith('ctl_')],
           animations=len(js.get('animations', [])), weights_component_type=wtypes,
           images={r: dict(mime=i['mime'], mb=round(i['bytes'] / 2 ** 20, 2)) for r, i in out_img.items()},
           images_same_bytes_as_tripo=(sorted(out_img) == sorted(src_img)
                                       and all(out_img[r]['sha256'] == src_img[r]['sha256'] for r in src_img)))

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
files = dict(model_fbx=STEM + '.fbx', model_glb=STEM + '.glb', blend=STEM + '.blend', clips=[], textures=tex_files)
rel = {k: (os.path.relpath(v, OUT).replace('\\', '/') if isinstance(v, str) else v) for k, v in files.items()}
info = {
    'asset_id': C.AID, 'rig': rt_name, 'exported': datetime.datetime.now().isoformat(timespec='seconds'),
    'source_blend': C.BLEND, 'source_sha256': src_sha, 'tripo_glb_sha256': C.GLB_SHA256,
    'family': 'W (flying insect, with P03)', 'route': 'M',
    'units': 'm', 'blender_axes': 'Z up, faces -Y, its left = +X', 'fbx_axes': 'Y up, -Z forward (Unity)',
    'glb_axes': 'Y up, faces +Z', 'deform_only': False, 'size_m': dict(zip(('x', 'y', 'z'), size)),
    'height_m': C.HEIGHT_M, 'height_rule': 'wing tips 0.87 H (H = 1.8 m)', 'scale_from_tripo': round(scale, 6),
    'bones': {'total': len(RUNTIME), 'deform': len(DEFORM), 'sockets': [n for n in RUNTIME if n not in DEFORM]},
    'control_rig': {'kept_in': 'rig/' + os.path.basename(C.BLEND) + ' (and the copy here)', 'object': C.CONTROL,
                    'bones': ctl_bones, 'not_exported': True, 'constraints_removed': len(removed_cons),
                    'drive': rt_name + ' copies ' + C.CONTROL + ' bone by bone (Copy Transforms, world space)',
                    'switches': {'ik_leg_L1 / ik_leg_R1': 'front legs, 1 = IK (default)',
                                 'ik_leg_L3 / ik_leg_R3': 'hind legs, 1 = IK (default)',
                                 'ik_proboscis': 'proboscis tip pinned to ctl_proboscis_IK, 1 = IK (default 0 = FK)'}},
    'parts': {ob_name: {'role': 'body (one piece: wings, legs, proboscis and sacs fused)', 'verts': n_verts, 'tris': n_tris}},
    'weight_health': {ob_name: health},
    'rigid_parts': {'eyes': 'loose pieces, head only', 'lower wing blade': 'loose piece per side, L/R_WingB_01..02 only',
                    'leg spurs': 'two loose pieces, L_Leg1_03'},
    'removed_from_tripo_mesh': 'two flat ground strips (the concept shadow modelled as geometry), G1; the Tripo GLB is unchanged',
    'spring_chains': [], 'leg_colliders': [],
    'usable_ranges': {
        'hind legs': '98 % extended at rest (femur 0.108 + tibia 0.405 m, hip to ankle 0.503 m): raising the body more '
                     'than ~1-2 cm with the hind feet planted lifts them; lowering the body is fine (15 cm tested)',
        'hind feet': 'hover 4.7 cm above the floor at rest (kept at G1): standing clips pull ctl_*_Leg3_IK down',
        'abdomen_01': 'down <= ~8 deg (past that the hind tibiae sink into the sacs, 24 mm at 15 deg); up 15 deg fine',
        'L/R_abdomen_02 (sacs)': 'opposite swing +-8 deg clean (1.48x), +-15 deg usable (1.99x); both down 18 deg fine',
        'step back (hind foot)': '12 cm back touches the sacs (14 mm)',
        'wings': 'spread, pitch about the span, up 45 deg, down to -75 deg, twist 25 deg, fan, fold: <= 2.0x; the rib '
                 'root slides under the shoulder plates (hidden)',
        'proboscis': 'three rigid segments: pinning the tip (IK) with a large body move kinks it into three'},
    'notes': ['Family W, flying insect subgroup (with P03). Bone names follow the W04 table in SKELETON_STANDARD.md '
              'section 3: L/R_Leg1_* front, L/R_Leg3_* hind, 4 segments each; the mesh has no middle legs, so Leg2 is '
              'left out. Fore and hind wing chains share one hinge per side.',
              'Clips are made at R6 on the control rig and baked onto ' + rt_name + ' at R8.',
              'The control rig is not exported: ' + C.CONTROL + ' (51 ctl_* bones: IK on four legs with poles and foot '
              'controls, one wing master per side at the shared hinge, proboscis IK) stays in the source .blend.',
              'Sockets carry no weights: root and ground = floor, cog = body centre, hit_origin = proboscis tip (child of '
              'proboscis_03), fx_head / fx_thorax / fx_abdomen = VFX points.',
              'Weights and the remaining limits: rig/qa_report.md section 5.'],
    'files': rel,
    'reimport_check': {'glb': glb, 'fbx': fbx, 'tolerance_m': {'rest_match': TOL_REST, 'pose': TOL_POSE},
                       'sample_poses': list(SRC), 'strip_check_max_mm': strip},
    'approved': {'G1': '2026-10-26', 'G2': '2026-10-27', 'G3': None, 'G4': None},
}
jdump(STEM + '_info.json', info)
jdump(REPORT, dict(source_sha256=src_sha, ctl_free_rest_diff=ctl_free, rest_vs_mesh_data=rest_vs_data,
                   strip_check_max_mm=strip, pose_moved_max_mm=moved, transforms=transforms, actions=actions,
                   removed_constraints=removed_cons, glb=glb, fbx=fbx, files=rel, seconds=round(time.time() - T0, 1)))
log('R8 export', 'PASS' if glb['ok'] and fbx['ok'] else 'FAIL', OUT, round(time.time() - T0, 1), 's')
