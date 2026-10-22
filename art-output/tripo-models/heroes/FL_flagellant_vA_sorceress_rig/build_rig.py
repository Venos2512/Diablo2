"""Rig transfer: D2R Sorceress skeleton -> Tripo 'FL_flagellant_vA' mesh.  Run inside Blender (background):

  blender -b --factory-startup -P build_rig.py -- --out <dir> [--src <sorceress.glb>] [--tgt <flagellant.glb>] [--stop fit|skin]

Steps
  1. import the Sorceress GLB only as a *template* (bone names, hierarchy, rest orientations)
  2. import the Flagellant mesh, scale to design height (1.8 m) and centre it on the body axis
  3. rebuild the 181-bone armature: same names/parents/local axes, joints moved onto Flagellant landmarks (rig_fit.py)
  4. skin the single mesh (skin.py), save .blend, export .glb
Nothing is written next to the inputs; the attachments are only read.
"""
import bpy, sys, os, json, math
import numpy as np
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import rig_fit

ATT = 'C:/Users/HLC_2021/.t3/userdata/attachments/'
DEF_SRC = ATT + 'e6e4f735-8929-46de-80d2-ccf7c75885f3-8ac7bb44-5270-469b-afc9-ea55978e8516-glb.glb'
DEF_TGT = ATT + 'e6e4f735-8929-46de-80d2-ccf7c75885f3-df4f46f7-90e0-4e21-9ace-e84092e9353f-glb.glb'
ARM_NAME = 'FL_flagellant_vA_rig'
MESH_NAME = 'FL_flagellant_vA_body'
BASE = 'FL_flagellant_vA_sorceress_rig'


def args():
    a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    o = {'out': HERE, 'src': DEF_SRC, 'tgt': DEF_TGT, 'stop': 'all'}
    for i in range(0, len(a), 2):
        o[a[i].lstrip('-')] = a[i + 1]
    return o


def import_template(path):
    """read Sorceress armature: per bone parent, true-world head (m), rest orientation (3x3), display length."""
    existing = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in existing]
    arm = [o for o in new if o.type == 'ARMATURE'][0]
    scale = arm.pose.bones['root'].scale[0]      # 1.15, the D2R root node scale (kept as pose scale by the importer)
    src = {}
    for b in arm.data.bones:
        m = b.matrix_local
        src[b.name] = {'parent': b.parent.name if b.parent else None, 'head': tuple(m.translation),
                       'rot': [tuple(r) for r in m.to_3x3()], 'length': b.length,
                       'order': 0}
    names = [b.name for b in arm.data.bones]
    for i, n in enumerate(names):
        src[n]['order'] = i
    stats = {'bones': len(names), 'root_scale': scale}
    for o in new:
        bpy.data.objects.remove(o, do_unlink=True)
    return src, stats


def import_target(path):
    existing = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in existing]
    mesh = [o for o in new if o.type == 'MESH'][0]
    for o in new:
        if o is not mesh:
            bpy.data.objects.remove(o, do_unlink=True)
    mesh.parent = None
    mesh.matrix_world = Matrix.Identity(4)
    return mesh


def prep_mesh(mesh):
    """scale u -> metres and centre on the body axis (x=CX, y=CY become 0), apply."""
    for o in bpy.context.selected_objects:
        o.select_set(False)
    mesh.select_set(True)
    bpy.context.view_layer.objects.active = mesh
    mesh.scale = (rig_fit.S,) * 3
    mesh.location = (0, 0, 0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    for v in mesh.data.vertices:
        v.co.x -= rig_fit.CX * rig_fit.S
        v.co.y -= rig_fit.CY * rig_fit.S
    mesh.data.update()
    mesh.name = MESH_NAME
    mesh.data.name = MESH_NAME
    return mesh


def build_armature(src, placed):
    arm_data = bpy.data.armatures.new(ARM_NAME)
    arm_obj = bpy.data.objects.new(ARM_NAME, arm_data)
    bpy.context.scene.collection.objects.link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj
    arm_obj.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    # shift so that the body axis is the origin (the mesh was shifted the same way)
    off = Vector((rig_fit.CX * rig_fit.S, rig_fit.CY * rig_fit.S, 0.0))
    order = sorted(src, key=lambda n: src[n]['order'])
    ebs = {}
    # children heads for display length
    children = {}
    for n in order:
        if src[n]['parent']:
            children.setdefault(src[n]['parent'], []).append(n)
    pos = {n: placed[n][0] - Vector((off.x, off.y, 0)) for n in order}
    for n in order:
        eb = arm_data.edit_bones.new(n)
        # src['rot'] holds the template 3x3 rows; columns are the bone axes (X = D2R primary axis, Y = Blender bone axis)
        R = Matrix(src[n]['rot'])
        ydir = Vector((R[0][1], R[1][1], R[2][1]))
        ch = children.get(n, [])
        if ch:
            L = min((pos[c] - pos[n]).length for c in ch)
        else:
            L = 0.0
        if L < 0.02:
            L = max(0.02, src[n]['length'] * 0.5)
        L = min(L, 0.25)
        eb.head = pos[n]
        eb.tail = pos[n] + ydir * L
        # roll: set from the full orientation matrix
        M = R.to_4x4()
        M.translation = pos[n]
        eb.matrix = M
        ebs[n] = eb
    for n in order:
        p = src[n]['parent']
        if p:
            ebs[n].parent = ebs[p]
    bpy.ops.object.mode_set(mode='OBJECT')
    return arm_obj


def check_orientation(arm_obj, src):
    """max angle between built bone axes and the template axes (must be ~0 so local rotations stay Sorceress-compatible)."""
    worst = 0.0
    for b in arm_obj.data.bones:
        R = Matrix(src[b.name]['rot'])
        m = b.matrix_local.to_3x3()
        for i in range(3):
            a = Vector((R[0][i], R[1][i], R[2][i])).angle(m.col[i], 0.0)
            worst = max(worst, a)
    return math.degrees(worst)


def export_glb(path, arm, mesh, anim=False, images=True):
    for ob in bpy.context.selected_objects:
        ob.select_set(False)
    arm.select_set(True)
    mesh.select_set(True)
    bpy.context.view_layer.objects.active = arm
    kw = dict(filepath=path, export_format='GLB', use_selection=True, export_apply=False, export_skins=True, export_def_bones=False,
              export_yup=True, export_image_format='AUTO' if images else 'NONE', export_animations=anim, export_extras=True)
    if anim:
        kw.update(export_animation_mode='NLA_TRACKS', export_force_sampling=True)
    bpy.ops.export_scene.gltf(**kw)


def weight_stats(mesh):
    n = len(mesh.data.vertices)
    cnt = {}
    sums = np.zeros(n)
    nz = np.zeros(n, dtype=int)
    names = {vg.index: vg.name for vg in mesh.vertex_groups}
    for v in mesh.data.vertices:
        for g in v.groups:
            if g.weight > 0:
                cnt[names[g.group]] = cnt.get(names[g.group], 0) + 1
                sums[v.index] += g.weight
                nz[v.index] += 1
    return cnt, sums, nz


def finish(o, src, st, placed, arm, mesh, info):
    import clips
    out = o['out']
    scene = bpy.context.scene
    scene.name = 'FL_flagellant_vA'
    for k in list(scene.keys()):
        del scene[k]                           # drop the Sorceress scene extras that the template import left behind
    scene['rig_template'] = 'D2R characters/player/sorceress skeleton (bone names, hierarchy, local axes)'
    for b in arm.data.bones:
        b.use_deform = True                    # same as the Sorceress skin: every bone is a skin joint (unweighted ones are attach/face/hair helpers)
    arm.data.display_type = 'STICK'
    arm.show_in_front = True
    arm['rig_source'] = 'd2r-sorceress.glb (bone names, hierarchy, local axes)'
    arm['mesh_source'] = 'FL_flagellant_vA.glb (Tripo)'
    arm['mesh_scale_u_to_m'] = rig_fit.S
    arm['d2r_root_scale'] = rig_fit.SRC_ROOT_SCALE
    cnt, sums, nz = weight_stats(mesh)
    rows = []
    for nme in sorted(src, key=lambda k: src[k]['order']):
        h_src = Vector(src[nme]['head']) * rig_fit.SRC_ROOT_SCALE
        h_tgt = Vector(arm.data.bones[nme].head_local)
        rows.append({'bone': nme, 'parent': src[nme]['parent'], 'placement_rule': placed[nme][1],
                     'sorceress_head_m': [round(v, 4) for v in h_src], 'flagellant_head_m': [round(v, 4) for v in h_tgt],
                     'weighted_vertices': cnt.get(nme, 0)})
    report = {'bones': rows,
              'skin': dict(info, vertices=len(mesh.data.vertices), min_weight_sum=float(sums.min()), max_weight_sum=float(sums.max()),
                           max_influences_per_vertex=int(nz.max()), vertices_without_weight=int((nz == 0).sum())),
              'template': st, 'S': rig_fit.S, 'CX_CY_u': [rig_fit.CX, rig_fit.CY]}
    json.dump(report, open(os.path.join(out, 'build_report.json'), 'w'), indent=1)
    glb = os.path.join(out, BASE + '.glb')
    export_glb(glb, arm, mesh)
    print('EXPORTED', glb, os.path.getsize(glb))
    made = clips.build_actions(arm)
    qa_glb = os.path.join(out, 'qa', BASE + '_qa_clips_geometry_only.glb')
    os.makedirs(os.path.dirname(qa_glb), exist_ok=True)
    export_glb(qa_glb, arm, mesh, anim=True, images=False)
    clips.mute_tracks(arm, True)
    clips.apply_pose(arm, [])
    report['qa_clips'] = made
    json.dump(report, open(os.path.join(out, 'build_report.json'), 'w'), indent=1)
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, BASE + '.blend'))
    print('SAVED', os.path.join(out, BASE + '.blend'))


def main():
    o = args()
    os.makedirs(o['out'], exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    src, st = import_template(o['src'])
    mesh = prep_mesh(import_target(o['tgt']))
    A = rig_fit.anchors()
    placed = rig_fit.place_all(src, A, rig_fit.skirt_targets())
    arm = build_armature(src, placed)
    print('ORIENT_MAX_DEG', check_orientation(arm, src))
    if o['stop'] == 'fit':
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(o['out'], 'stage_fit.blend'))
        return
    import skin
    info = skin.run(arm, mesh, placed)
    print('SKIN', json.dumps(info))
    if o['stop'] == 'skin':
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(o['out'], 'stage_skin.blend'))
        return
    finish(o, src, st, placed, arm, mesh, info)


if __name__ == '__main__':
    main()
