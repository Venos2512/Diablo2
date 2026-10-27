"""R2 + R3: build the whole W04 rig from the original GLB -> rig/W04_mire_sucker_rig.blend (repeatable, GLB read-only).

blender -b --factory-startup -P w04_b1_build.py

1. intake (rigbatch.intake): importer weld, uniform scale to 1.566 m, soles on z = 0, facing -Y
2. delete the two flat ground strips (G1 question 6): welded pieces lying entirely below z 0.02
3. runtime skeleton W04_mire_sucker_Skeleton (w04_rig_def.build: 41 bones, 34 deform + root, cog + 5 sockets)
4. skin (w04_skin.compute, config w04_skin_cfg.json) -> vertex groups + Armature modifier, mesh parented to the skeleton
5. control rig W04_mire_sucker_Control (ctl_*): FK copy, wing masters, 2-bone leg IK + tarsus from the foot control,
   proboscis IK (off), IK/FK switches as custom properties driving the constraint influences
6. runtime bones follow the control rig (Copy Transforms, world -> world); pole angles searched so the rest pose is unchanged
7. textured viewport, 24 fps, save (previous file copied to rig/_work/prev/)
"""
import json
import math
import os
import shutil
import sys
import time

import bmesh
import bpy
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import w04_bkit as K
import w04_common as C
import w04_mesh as M
import w04_rig_def as D
import w04_skin as S

sys.path.insert(0, C.TOOLS)
import rigbatch as rb  # noqa: E402

T0 = time.time()
assert C.sha256_file(C.GLB) == C.GLB_SHA256, 'GLB changed'
LOG = []


def log(*a):
    s = ' '.join(str(x) for x in a)
    print('[b1]', s)
    LOG.append(s)


# ------------------------------------------------------------------ 1. intake
ob, info = rb.intake(C.GLB, C.AID, C.HEIGHT_M)
ob.name = C.MESH
ob.data.name = C.MESH + '_mesh'
me = ob.data
log('intake', json.dumps({k: info[k] for k in ('glb_height', 'scale', 'height_m', 'verts', 'faces')}))

# ------------------------------------------------------------------ 2. delete the ground strips
n0, f0 = len(me.vertices), len(me.polygons)
co = np.empty(n0 * 3); me.vertices.foreach_get('co', co); co = co.reshape(n0, 3)
inv, U = M.weld(co, 1e-5)
E = M.edges_from_faces([tuple(int(inv[v]) for v in p.vertices) for p in me.polygons])
comp = M.components(len(U), E)
strips = [c for c in range(comp.max() + 1) if U[comp == c, 2].max() < 0.02]
dead = set(np.nonzero(np.isin(comp[inv], strips))[0].tolist())
bm = bmesh.new(); bm.from_mesh(me); bm.verts.ensure_lookup_table()
bmesh.ops.delete(bm, geom=[bm.verts[i] for i in sorted(dead)], context='VERTS')
bm.to_mesh(me); bm.free(); me.update()
STRIPS = dict(pieces=len(strips), verts_removed=n0 - len(me.vertices), faces_removed=f0 - len(me.polygons),
              tris_removed=None, z_max=round(float(max(U[comp == c, 2].max() for c in strips)), 4))
log('strips deleted', STRIPS)
ob['w04_deleted_ground_strips'] = json.dumps(STRIPS)

for img in bpy.data.images:
    if img.source == 'FILE' and not img.packed_file:
        img.pack()

# ------------------------------------------------------------------ 3. runtime skeleton
col = bpy.data.collections.new('W04_Rig')
bpy.context.scene.collection.children.link(col)
for c in list(ob.users_collection):
    c.objects.unlink(ob)
col.objects.link(ob)
B = D.build()
deform = set(D.deform_names(B))
rt_arm = bpy.data.armatures.new(C.RUNTIME)
rt = bpy.data.objects.new(C.RUNTIME, rt_arm)
col.objects.link(rt)
K.set_mode(rt, 'EDIT')
for b in B:
    K.add_edit_bone(rt_arm, b, b['name'] in deform)
for b in B:
    if b['parent']:
        rt_arm.edit_bones[b['name']].parent = rt_arm.edit_bones[b['parent']]
K.set_mode(rt, 'OBJECT')
rt_arm.display_type = 'OCTAHEDRAL'
rt.show_in_front = True
groups = {'Root': ('root', 'cog'), 'Body': ('thorax', 'head', 'abdomen_01'), 'Proboscis': ('proboscis',),
          'Abdomen': ('_abdomen_',), 'Wings': ('Wing',), 'Legs': ('_Leg',), 'Sockets': ()}
bcol = {k: rt_arm.collections.new(k) for k in groups}
for b in B:
    bone = rt_arm.bones[b['name']]
    if b['kind'] == 'socket':
        bcol['Sockets'].assign(bone); continue
    for k, pats in groups.items():
        if any((p == b['name']) if k in ('Root', 'Body') else (p in b['name']) for p in pats):
            bcol[k].assign(bone); break

# ------------------------------------------------------------------ 4. skin
n = len(me.vertices)
co = np.empty(n * 3); me.vertices.foreach_get('co', co); co = co.reshape(n, 3)
inv, U = M.weld(co, 1e-5)
E = M.edges_from_faces([tuple(int(inv[v]) for v in p.vertices) for p in me.polygons])
comp = M.components(len(U), E)
cfg = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'w04_skin_cfg.json'), encoding='utf-8'))
t1 = time.time()
res = S.compute(U, E, comp, B, cfg)
log('skin', round(time.time() - t1, 1), 's; regions', res['info']['regions'], 'free', res['info']['free'],
    'iters', res['info']['harmonic_iters'], 'max infl', res['info']['max_influences'])
Wn = res['W'][inv]
names = res['names']
used = [i for i, nm in enumerate(names) if Wn[:, i].max() > 0]
vg = {}
for i in used:
    vg[i] = ob.vertex_groups.new(name=names[i])
for vi in range(n):
    row = Wn[vi]
    for bi in np.nonzero(row)[0]:
        vg[bi].add([vi], float(row[bi]), 'REPLACE')
mod = ob.modifiers.new('Armature', 'ARMATURE')
mod.object = rt
mod.use_vertex_groups = True
ob.parent = rt
ob.parent_type = 'OBJECT'
json.dump(dict(info=res['info'], cfg=cfg), open(os.path.join(C.WORK, 'b1_skin_info.json'), 'w'), indent=1)

# ------------------------------------------------------------------ 5. control rig
ct_arm = bpy.data.armatures.new(C.CONTROL)
ct = bpy.data.objects.new(C.CONTROL, ct_arm)
col.objects.link(ct)
CB = D.control_bones(B)
K.set_mode(ct, 'EDIT')
for b in CB:
    K.add_edit_bone(ct_arm, b, False)
for b in CB:
    if b['parent']:
        ct_arm.edit_bones[b['name']].parent = ct_arm.edit_bones[b['parent']]
K.set_mode(ct, 'OBJECT')
ct_arm.display_type = 'OCTAHEDRAL'
ct.show_in_front = True

# runtime follows control
for pb in rt.pose.bones:
    c_name = 'ctl_' + pb.name
    if c_name in ct.pose.bones:
        c = pb.constraints.new('COPY_TRANSFORMS')
        c.name = 'FollowControl'
        c.target = ct; c.subtarget = c_name
        c.target_space = 'WORLD'; c.owner_space = 'WORLD'; c.mix_mode = 'REPLACE'

SW = {}
for leg in D.LEGS:
    for s in D.SIDES:
        SW[f'ik_leg_{s}{leg[-1]}'] = 1.0
SW['ik_proboscis'] = 0.0
for key, v in SW.items():
    ct[key] = v
    ct.id_properties_ui(key).update(min=0.0, max=1.0, soft_min=0.0, soft_max=1.0, description='1 = IK, 0 = FK')


def drive(constraint, prop):
    fc = constraint.driver_add('influence')
    dr = fc.driver
    dr.type = 'AVERAGE'
    var = dr.variables.new()
    var.name = 'ik'; var.type = 'SINGLE_PROP'
    var.targets[0].id = ct
    var.targets[0].data_path = f'["{prop}"]'


KNEE = {}
for leg in D.LEGS:
    for s in D.SIDES:
        key = f'ik_leg_{s}{leg[-1]}'
        tib = ct.pose.bones[f'ctl_{s}_{leg}_03']
        ik = tib.constraints.new('IK')
        ik.name = 'LegIK'
        ik.target = ct; ik.subtarget = f'ctl_{s}_{leg}_tarsus'
        ik.pole_target = ct; ik.pole_subtarget = f'ctl_{s}_{leg}_pole'
        ik.chain_count = 2; ik.use_tail = True; ik.use_stretch = False
        tib.lock_ik_y = True; tib.lock_ik_z = True
        # knee hinge: +X = more bend. Rest bend: front ~90 deg, hind ~28 deg (hind leg 98 % extended); never past straight
        b2, b3 = D.by_name(B)[f'{s}_{leg}_02'], D.by_name(B)[f'{s}_{leg}_03']
        u = np.subtract(b2['tail'], b2['head']); f = np.subtract(b3['tail'], b3['head'])
        rest_bend = math.degrees(math.acos(np.dot(u, f) / np.linalg.norm(u) / np.linalg.norm(f)))
        tib.use_ik_limit_x = True; tib.ik_min_x = -math.radians(rest_bend - 2.0); tib.ik_max_x = math.radians(120)
        KNEE[f'{s}_{leg}'] = dict(rest_bend_deg=round(rest_bend, 1), ik_min_deg=round(-(rest_bend - 2.0), 1), ik_max_deg=120)
        drive(ik, key)
        cr = ct.pose.bones[f'ctl_{s}_{leg}_04'].constraints.new('COPY_ROTATION')
        cr.name = 'FromFootControl'
        cr.target = ct; cr.subtarget = f'ctl_{s}_{leg}_tarsus'
        cr.target_space = 'WORLD'; cr.owner_space = 'WORLD'
        drive(cr, key)
pb3 = ct.pose.bones['ctl_proboscis_03']
ik = pb3.constraints.new('IK')
ik.name = 'ProboscisIK'
ik.target = ct; ik.subtarget = 'ctl_proboscis_IK'
ik.chain_count = 3; ik.use_tail = True; ik.use_stretch = False
drive(ik, 'ik_proboscis')

# bone collections + colours (control)
cc = {k: ct_arm.collections.new(k) for k in ('Root/COG', 'Body FK', 'Proboscis', 'Abdomen', 'Wings', 'Legs FK', 'IK feet + proboscis',
                                               'Poles', 'Foot targets')}
for b in CB:
    bone = ct_arm.bones[b['name']]
    nm = b['name']
    if b['kind'] == 'fk':
        r = b['rt']
        k = ('Root/COG' if r in ('root', 'cog') else 'Body FK' if r in ('thorax', 'head', 'abdomen_01') else
             'Proboscis' if 'proboscis' in r else 'Abdomen' if '_abdomen_' in r else 'Wings' if 'Wing' in r else 'Legs FK')
    elif b['kind'] == 'master':
        k = 'Wings'
    elif b['kind'] == 'ik':
        k = 'IK feet + proboscis'
    elif b['kind'] == 'pole':
        k = 'Poles'
    else:
        k = 'Foot targets'
    cc[k].assign(bone)
    side = 'L' if nm.startswith('ctl_L_') else 'R' if nm.startswith('ctl_R_') else 'C'
    if b['kind'] in ('fk',):
        bone.color.palette = {'L': 'THEME04', 'R': 'THEME01', 'C': 'THEME03'}[side]
    else:
        bone.color.palette = {'L': 'THEME05', 'R': 'THEME02', 'C': 'THEME09'}[side]

# ------------------------------------------------------------------ 6. pole angles: rest stays rest
bpy.context.view_layer.update()


def max_dev(names_):
    dev = 0.0
    for nm in names_:
        pb = ct.pose.bones[nm]
        r = ct.data.bones[nm].matrix_local
        dev = max(dev, pb.matrix.to_quaternion().rotation_difference(r.to_quaternion()).angle)
    return dev


POLE = {}
for leg in D.LEGS:
    for s in D.SIDES:
        con = ct.pose.bones[f'ctl_{s}_{leg}_03'].constraints['LegIK']
        tn = (f'ctl_{s}_{leg}_02', f'ctl_{s}_{leg}_03')
        coarse = []
        for ang in range(-180, 180, 15):
            con.pole_angle = math.radians(ang); bpy.context.view_layer.update()
            coarse.append((max_dev(tn), ang))
        coarse.sort()
        fine = []
        for k in range(-60, 61):
            ang = coarse[0][1] + 0.25 * k
            con.pole_angle = math.radians(ang); bpy.context.view_layer.update()
            fine.append((max_dev(tn), ang))
        fine.sort()
        con.pole_angle = math.radians(fine[0][1]); bpy.context.view_layer.update()
        POLE[f'{s}_{leg}'] = dict(deg=fine[0][1], rest_dev_deg=round(math.degrees(fine[0][0]), 4))
log('pole angles', POLE)
log('knee IK limits', KNEE)
bpy.context.scene['w04_knee_limits'] = json.dumps(KNEE)
# rest check: every runtime bone at its rest matrix with IK on
bpy.context.view_layer.update()
dev = max(rt.pose.bones[b.name].matrix.to_quaternion().rotation_difference(b.matrix_local.to_quaternion()).angle
          for b in rt.data.bones)
pdev = max((rt.pose.bones[b.name].head - b.head_local).length for b in rt.data.bones)
log('rest with IK on: max rot dev deg', round(math.degrees(dev), 4), 'max head dev m', round(pdev, 6))

# ------------------------------------------------------------------ 7. scene, viewport, save
K.reset_pose(ct)
sc = bpy.context.scene
sc.unit_settings.system = 'METRIC'; sc.unit_settings.scale_length = 1.0
sc.render.fps = 24; sc.frame_start, sc.frame_end = 1, 24; sc.frame_current = 1
sc.tool_settings.use_keyframe_insert_auto = False
rt.hide_set(True)
for o in col.objects:
    o.select_set(False)
bpy.context.view_layer.objects.active = ct
ct.select_set(True)
for scr in bpy.data.screens:
    for area in scr.areas:
        if area.type == 'VIEW_3D':
            sp = area.spaces[0]
            sp.shading.type = 'SOLID'; sp.shading.light = 'STUDIO'; sp.shading.color_type = 'TEXTURE'
            sp.overlay.show_bones = True
            sp.clip_start = 0.001; sp.clip_end = 100.0
sc['w04_scale'] = info['scale']
sc['w04_height_m'] = C.HEIGHT_M
sc['w04_k'] = C.K
sc['w04_source_sha256'] = C.GLB_SHA256
sc['w04_rig_status'] = 'R2-R3 build 2026-10-26, cho G2; khong co Action'
sc['w04_pole_angles'] = json.dumps(POLE)
if os.path.exists(C.BLEND):
    os.makedirs(os.path.join(C.WORK, 'prev'), exist_ok=True)
    try:
        shutil.copy2(C.BLEND, os.path.join(C.WORK, 'prev', os.path.basename(C.BLEND)))
    except OSError as e:
        log('WARN prev copy', e)
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=C.BLEND, compress=True)
log('saved', C.BLEND, 'in', round(time.time() - T0, 1), 's')
with open(os.path.join(C.WORK, 'b1_build_log.txt'), 'w', encoding='utf-8') as f:
    f.write('\n'.join(LOG) + '\n')
print('B1_DONE')
