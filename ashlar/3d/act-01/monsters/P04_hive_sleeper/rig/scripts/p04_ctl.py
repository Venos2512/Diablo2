"""P04 Hive-Sleeper, R2: control rig (ctl_*) over the runtime skeleton. Pattern of D01 (two armatures, runtime follows the
control by world Copy Transforms, rest identical) with Qh contacts:

- arms: ctl_<S>_Hand_IK (on the floor at the knuckles, child of ctl_root) -> ctl_<S>_Fingertip_roll (pivot at the middle
  fingertip) -> ctl_<S>_Palm_roll (pivot at the knuckles: lifts the heel of the hand, fingers stay down) ->
  ctl_<S>_Wrist_target (IK target of UpperArm+ForeArm, Hand copies its rotation); ctl_<S>_Finger_target under the
  fingertip roll (Finger copies it); pole ctl_<S>_Elbow_pole behind the elbow (+Y), child of ctl_chest.
- legs: ctl_<S>_Knee_IK (on the floor at the knee, along the shin, child of ctl_root): Thigh 1-bone IK aims at it, Calf
  copies its rotation (the shin lies along the control); Foot, Toe FK.
- switches ik_arm_<S>, ik_leg_<S> (custom properties, 1 = IK) drive the influences (no Python needed).
- twist: ctl_<S>_ForeArm_twist Y = 0.5 x twist of ctl_<S>_Hand about its local Z (≈ the forearm axis in this rest),
  ctl_<S>_UpperArm_twist Y = -0.5 x twist of ctl_<S>_UpperArm about its Y (drivers, simple expressions).
"""
import math
import bpy
from mathutils import Vector

FK_COLLECTIONS = [('Root/COG', ('root', 'cog')), ('Spine/Head', ('pelvis', 'spine_01', 'spine_02', 'chest', 'neck', 'neck_02', 'head')),
                  ('Domes', ('dome_',)), ('Cloth', ('shirt_',)),
                  ('Arms', ('Clavicle', 'UpperArm', 'ForeArm', 'Hand', 'Finger')), ('Legs', ('Thigh', 'Calf', 'Foot', 'Toe'))]


def _mode(ob, mode):
    if bpy.context.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    if mode != 'OBJECT':
        bpy.ops.object.mode_set(mode=mode)


def _drive(owner, path, ct, prop, index=-1):
    fc = owner.driver_add(path, index) if index >= 0 else owner.driver_add(path)
    dr = fc.driver; dr.type = 'AVERAGE'
    v = dr.variables.new(); v.name = 'ik'; v.type = 'SINGLE_PROP'
    v.targets[0].id = ct; v.targets[0].data_path = f'["{prop}"]'
    return fc


def build(rt, roll_vector, name='P04_hive_sleeper_ctl', collection=None):
    """rt: runtime armature object (rest = bind pose). Returns the control armature object and a report dict."""
    R = {b.name: (b.head_local.copy(), b.tail_local.copy(), b.parent.name if b.parent else None, b.use_connect, b.use_deform)
         for b in rt.data.bones}
    sockets = {n for n, v in R.items() if not v[4] and n not in ('root', 'cog')}
    data = bpy.data.armatures.new(name); ct = bpy.data.objects.new(name, data)
    (collection or bpy.context.scene.collection).objects.link(ct)
    _mode(ct, 'EDIT'); eb = data.edit_bones
    # FK twins: copy head/tail/roll of the runtime edit bones exactly
    _mode(rt, 'EDIT'); rolls = {e.name: e.roll for e in rt.data.edit_bones}
    _mode(ct, 'EDIT'); eb = data.edit_bones
    made = []
    for n, (h, t, par, conn, deform) in R.items():
        if n in sockets:
            continue
        e = eb.new('ctl_' + n); e.head = h; e.tail = t; e.roll = rolls[n]; e.use_deform = False
        made.append(n)
    for n in made:
        par = R[n][2]
        if par:
            eb['ctl_' + n].parent = eb['ctl_' + par]; eb['ctl_' + n].use_connect = R[n][3]
    extra = []
    def E(n, h, t, par, zvec=None, roll_from=None):
        e = eb.new(n); e.head = h; e.tail = t; e.use_deform = False
        if roll_from:
            e.roll = rolls[roll_from]
        elif zvec is not None:
            e.align_roll(Vector(zvec))
        e.parent = eb[par]; extra.append(n)
        return e
    for S in ('L', 'R'):
        wr, kn = R[f'{S}_Hand'][0], R[f'{S}_Hand'][1]; fe = R[f'{S}_Finger'][1]
        fwd = Vector((kn.x - wr.x, kn.y - wr.y, 0)).normalized()
        E(f'ctl_{S}_Hand_IK', Vector((kn.x, kn.y, kn.z)), kn + fwd * 0.12, 'ctl_root', zvec=(0, 0, 1))
        E(f'ctl_{S}_Fingertip_roll', fe, fe + fwd * 0.05, f'ctl_{S}_Hand_IK', zvec=(0, 0, 1))
        E(f'ctl_{S}_Palm_roll', kn, kn + fwd * 0.05, f'ctl_{S}_Fingertip_roll', zvec=(0, 0, 1))
        E(f'ctl_{S}_Wrist_target', wr, kn, f'ctl_{S}_Palm_roll', roll_from=f'{S}_Hand')
        E(f'ctl_{S}_Finger_target', kn, fe, f'ctl_{S}_Fingertip_roll', roll_from=f'{S}_Finger')
        el = R[f'{S}_ForeArm'][0]
        E(f'ctl_{S}_Elbow_pole', el + Vector((0, 0.30, 0)), el + Vector((0, 0.36, 0)), 'ctl_chest', zvec=(0, 0, 1))
        kq, an = R[f'{S}_Calf'][0], R[f'{S}_Calf'][1]
        E(f'ctl_{S}_Knee_IK', kq, kq + (an - kq).normalized() * 0.18, 'ctl_root', roll_from=f'{S}_Calf')
    _mode(ct, 'OBJECT')
    data.display_type = 'OCTAHEDRAL'; ct.show_in_front = True

    # runtime follows control
    for pb in rt.pose.bones:
        if 'ctl_' + pb.name in ct.pose.bones:
            c = pb.constraints.new('COPY_TRANSFORMS'); c.name = 'FollowControl'
            c.target = ct; c.subtarget = 'ctl_' + pb.name; c.target_space = 'WORLD'; c.owner_space = 'WORLD'
    for S in ('L', 'R'):
        for k in ('arm', 'leg'):
            p = f'ik_{k}_{S}'; ct[p] = 1.0
            ct.id_properties_ui(p).update(min=0.0, max=1.0, soft_min=0.0, soft_max=1.0, description=f'1 = IK {k} {S}, 0 = FK')
        fo = ct.pose.bones[f'ctl_{S}_ForeArm']
        ik = fo.constraints.new('IK'); ik.name = 'ArmIK'; ik.target = ct; ik.subtarget = f'ctl_{S}_Wrist_target'
        ik.pole_target = ct; ik.pole_subtarget = f'ctl_{S}_Elbow_pole'; ik.chain_count = 2; ik.use_tail = True; ik.use_stretch = False
        _drive(ik, 'influence', ct, f'ik_arm_{S}')
        fo.lock_ik_y = True; fo.lock_ik_z = True
        for bn, tg in ((f'ctl_{S}_Hand', f'ctl_{S}_Wrist_target'), (f'ctl_{S}_Finger', f'ctl_{S}_Finger_target')):
            cr = ct.pose.bones[bn].constraints.new('COPY_ROTATION'); cr.name = 'FromContact'
            cr.target = ct; cr.subtarget = tg; cr.target_space = 'WORLD'; cr.owner_space = 'WORLD'
            _drive(cr, 'influence', ct, f'ik_arm_{S}')
        th = ct.pose.bones[f'ctl_{S}_Thigh']
        ik = th.constraints.new('IK'); ik.name = 'KneeAim'; ik.target = ct; ik.subtarget = f'ctl_{S}_Knee_IK'
        ik.chain_count = 1; ik.use_tail = True; ik.use_stretch = False
        _drive(ik, 'influence', ct, f'ik_leg_{S}')
        cr = ct.pose.bones[f'ctl_{S}_Calf'].constraints.new('COPY_ROTATION'); cr.name = 'FromKnee'
        cr.target = ct; cr.subtarget = f'ctl_{S}_Knee_IK'; cr.target_space = 'WORLD'; cr.owner_space = 'WORLD'
        _drive(cr, 'influence', ct, f'ik_leg_{S}')
        # twist drivers
        for tw, src, ch, mode, fac in ((f'ctl_{S}_ForeArm_twist', f'ctl_{S}_Hand', 'ROT_Z', 'SWING_TWIST_Z', 0.5),
                                       (f'ctl_{S}_UpperArm_twist', f'ctl_{S}_UpperArm', 'ROT_Y', 'SWING_TWIST_Y', -0.5)):
            pb = ct.pose.bones[tw]; pb.rotation_mode = 'XYZ'
            fc = pb.driver_add('rotation_euler', 1); dr = fc.driver; dr.type = 'SCRIPTED'
            v = dr.variables.new(); v.name = 'tw'; v.type = 'TRANSFORMS'
            v.targets[0].id = ct; v.targets[0].bone_target = src; v.targets[0].transform_type = ch
            v.targets[0].rotation_mode = mode; v.targets[0].transform_space = 'LOCAL_SPACE'
            dr.expression = f'{fac} * tw'
    # bone collections and colours
    cols = {n: data.collections.new(n) for n in [c[0] for c in FK_COLLECTIONS] + ['Contacts', 'Poles']}
    for b in data.bones:
        n = b.name
        if n in extra:
            (cols['Poles'] if n.endswith('_pole') else cols['Contacts']).assign(b)
            b.color.palette = 'THEME09' if n.endswith('_IK') else 'THEME05'
            continue
        base = n[4:]
        for cname, keys in FK_COLLECTIONS:
            if base in keys or any(k in base for k in keys if k.endswith('_') or k[0].isupper()):
                cols[cname].assign(b); break
        b.color.palette = 'THEME04' if base.startswith('L_') else ('THEME01' if base.startswith('R_') else 'THEME03')
    bpy.context.view_layer.update()
    # pole angle: search the angle that keeps the rest pose (deviation of UpperArm + ForeArm)
    report = {}
    for S in ('L', 'R'):
        con = ct.pose.bones[f'ctl_{S}_ForeArm'].constraints['ArmIK']
        def dev():
            bpy.context.view_layer.update(); worst = 0.0
            for n in (f'ctl_{S}_UpperArm', f'ctl_{S}_ForeArm'):
                q1 = ct.pose.bones[n].matrix.to_quaternion(); q0 = ct.data.bones[n].matrix_local.to_quaternion()
                worst = max(worst, q0.rotation_difference(q1).angle)
            return worst
        scores = []
        for a in range(-180, 180, 15):
            con.pole_angle = math.radians(a); scores.append((dev(), a))
        best = min(scores)
        for step in (0.5, 0.05, 0.005):
            fine = []
            for k in range(-12, 13):
                a = best[1] + step * k; con.pole_angle = math.radians(a); fine.append((dev(), a))
            best = min(fine)
        con.pole_angle = math.radians(best[1])
        con.iterations = 1000
        report[f'pole_angle_{S}'] = dict(deg=best[1], rest_dev_deg=round(math.degrees(best[0]), 4))
    bpy.context.view_layer.update()
    return ct, report


def rest_deviation(rt, ct):
    """Max angle (deg) and offset (m) between runtime pose and rest with the control at rest (should be ~0)."""
    bpy.context.view_layer.update()
    worst_a = 0.0; worst_d = 0.0
    for pb in rt.pose.bones:
        b = rt.data.bones[pb.name]
        worst_a = max(worst_a, math.degrees(b.matrix_local.to_quaternion().rotation_difference(pb.matrix.to_quaternion()).angle))
        worst_d = max(worst_d, (b.head_local - pb.head).length)
    return round(worst_a, 4), round(worst_d, 6)
