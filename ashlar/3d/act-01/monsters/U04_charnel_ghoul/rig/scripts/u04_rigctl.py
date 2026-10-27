"""U04 control rig (R2): `U04_control` with ctl_* FK copies of the runtime bones, 2-bone IK on all four limbs with
contact rolls, twist aims, IK/FK switches; `U04_runtime` follows it with Copy Transforms (world -> world), like D01.

Hand (front foot), same names as P04:  ctl_X_Hand_IK (floor, under the knuckles) -> ctl_X_Fingertip_roll (pivot: finger
tips) -> ctl_X_Palm_roll (pivot: knuckles) -> ctl_X_Wrist_target (IK target, Hand copies it); ctl_X_Finger_target under
Fingertip_roll (Finger copies it); pole ctl_X_Elbow_pole behind the elbow (child of ctl_chest).
Hind foot, as D01:  ctl_X_Foot_IK (heel) -> ctl_X_Heel_roll (pivot: heel) -> ctl_X_Toe_roll (pivot: toe tips) ->
ctl_X_Ball_roll (pivot: ball) -> ctl_X_Ankle_target (Foot copies it); ctl_X_Toe_target under Toe_roll.
Hind leg has three segments since 2026-10-27 (Thigh, Calf, Calf_02), like the Q family's digitigrade leg: the 2-bone IK
(Thigh-Calf) reaches the hock; ctl_X_Hock_roll (pivot: ankle, child of Ball_roll) swings the hock fore/aft and carries
ctl_X_Hock_target (IK target, Calf_02 copies it); pole ctl_X_Knee_pole in front of the knee (child of ctl_pelvis).
Elbows and hocks point backward (flexion = negative rotation about local X); the knee points forward (flexion = positive).
IK limited to X.
"""
import bpy, math
from mathutils import Vector
import u04_layout as UL

FWD = Vector((0, -1, 0)); BACK = Vector((0, 1, 0))


def ctl_layout(rt_bones, Jm, S, heel):
    out = []

    def B(name, h, t, parent, kind):
        out.append(dict(name=name, head=Vector(h), tail=Vector(t), parent=parent, kind=kind, deform=False, connect=False))
    for b in rt_bones:
        if b['kind'] == 'socket':
            continue
        B('ctl_' + b['name'], b['head'], b['tail'], ('ctl_' + b['parent']) if b['parent'] else None, 'fk')
        out[-1]['connect'] = b['connect']
    tw = {b['name']: b for b in rt_bones}
    L = 0.06 * S
    for P, f in (('L', lambda p: Vector(p)), ('R', UL.mir)):
        wr, kn, fe, el = f(Jm['wrist']), f(Jm['knuckle']), f(Jm['finger_end']), f(Jm['elbow'])
        an, ba, te, knee, hk = f(Jm['ankle']), f(Jm['ball']), f(Jm['toe_end']), f(Jm['knee']), f(Jm['hock'])
        hl = Vector(heel[P])
        g = Vector((kn.x, kn.y, 0.0))
        B(f'ctl_{P}_Hand_IK', g, g + FWD * 0.10 * S, 'ctl_root', 'ik')
        B(f'ctl_{P}_Fingertip_roll', fe, fe + BACK * L, f'ctl_{P}_Hand_IK', 'roll')
        B(f'ctl_{P}_Palm_roll', kn, kn + BACK * L, f'ctl_{P}_Fingertip_roll', 'roll')
        B(f'ctl_{P}_Wrist_target', wr, kn, f'ctl_{P}_Palm_roll', 'target')
        B(f'ctl_{P}_Finger_target', kn, fe, f'ctl_{P}_Fingertip_roll', 'target')
        B(f'ctl_{P}_Elbow_pole', el + BACK * 0.30 * S, el + BACK * 0.36 * S, 'ctl_chest', 'pole')
        B(f'ctl_{P}_Foot_IK', hl, hl + FWD * 0.12 * S, 'ctl_root', 'ik')
        B(f'ctl_{P}_Heel_roll', hl, hl + FWD * L, f'ctl_{P}_Foot_IK', 'roll')
        B(f'ctl_{P}_Toe_roll', te, te + BACK * L, f'ctl_{P}_Heel_roll', 'roll')
        B(f'ctl_{P}_Ball_roll', ba, ba + BACK * L, f'ctl_{P}_Toe_roll', 'roll')
        B(f'ctl_{P}_Ankle_target', an, ba, f'ctl_{P}_Ball_roll', 'target')
        B(f'ctl_{P}_Hock_roll', an, hk, f'ctl_{P}_Ball_roll', 'roll')
        B(f'ctl_{P}_Hock_target', hk, an, f'ctl_{P}_Hock_roll', 'target')
        B(f'ctl_{P}_Toe_target', ba, te, f'ctl_{P}_Toe_roll', 'target')
        B(f'ctl_{P}_Knee_pole', knee + FWD * 0.30 * S, knee + FWD * 0.36 * S, 'ctl_pelvis', 'pole')
        # twist aims: a point on the twist bone's rest Z axis, carried by the hand (forearm twist) / clavicle (upper arm)
        for tb, carrier in ((f'{P}_ForeArm_twist', f'ctl_{P}_Hand'), (f'{P}_UpperArm_twist', f'ctl_{P}_Clavicle')):
            b = tw[tb]; y = (b['tail'] - b['head']).normalized(); z = UL.roll_vector(b['head'], b['tail'])
            base = b['tail'] if 'ForeArm' in tb else b['head']
            a = base + z * 0.08 * S
            B(f'ctl_{tb}_aim', a, a + y * 0.03 * S, carrier, 'aim')
    return out


def _drive(con, ctl_ob, prop):
    fc = con.driver_add('influence'); dr = fc.driver; dr.type = 'AVERAGE'
    v = dr.variables.new(); v.name = 'ik'; v.type = 'SINGLE_PROP'
    v.targets[0].id = ctl_ob; v.targets[0].data_path = f'["{prop}"]'


def _copy_rot(pb, ctl_ob, target, prop):
    c = pb.constraints.new('COPY_ROTATION'); c.name = 'FromIK'; c.target = ctl_ob; c.subtarget = target
    c.target_space = 'WORLD'; c.owner_space = 'WORLD'
    _drive(c, ctl_ob, prop)
    return c


def build(rt, rt_bones, Jm, S, heel, collection):
    cl = ctl_layout(rt_bones, Jm, S, heel)
    ct = UL.build_armature('U04_control', cl, collection)
    ct.data.display_type = 'OCTAHEDRAL'
    for side in 'LR':
        for kind in ('arm', 'leg'):
            k = f'ik_{kind}_{side}'
            ct[k] = 1.0
            ct.id_properties_ui(k).update(min=0.0, max=1.0, soft_min=0.0, soft_max=1.0, description=f'1 = IK {kind} {side}, 0 = FK')
    pbs = ct.pose.bones
    for side in 'LR':
        for host, tgt, pole, prop, lo, hi in ((f'ctl_{side}_ForeArm', f'ctl_{side}_Wrist_target', f'ctl_{side}_Elbow_pole', f'ik_arm_{side}', -150, 10),
                                              (f'ctl_{side}_Calf', f'ctl_{side}_Hock_target', f'ctl_{side}_Knee_pole', f'ik_leg_{side}', -25, 130)):
            pb = pbs[host]
            c = pb.constraints.new('IK'); c.name = 'LimbIK'; c.target = ct; c.subtarget = tgt
            c.pole_target = ct; c.pole_subtarget = pole; c.chain_count = 2; c.use_tail = True; c.use_stretch = False
            c.iterations = 2000
            pb.lock_ik_y = True; pb.lock_ik_z = True
            pb.use_ik_limit_x = True; pb.ik_min_x = math.radians(lo); pb.ik_max_x = math.radians(hi)
            _drive(c, ct, prop)
        _copy_rot(pbs[f'ctl_{side}_Hand'], ct, f'ctl_{side}_Wrist_target', f'ik_arm_{side}')
        _copy_rot(pbs[f'ctl_{side}_Finger'], ct, f'ctl_{side}_Finger_target', f'ik_arm_{side}')
        _copy_rot(pbs[f'ctl_{side}_Calf_02'], ct, f'ctl_{side}_Hock_target', f'ik_leg_{side}')
        _copy_rot(pbs[f'ctl_{side}_Foot'], ct, f'ctl_{side}_Ankle_target', f'ik_leg_{side}')
        _copy_rot(pbs[f'ctl_{side}_Toe'], ct, f'ctl_{side}_Toe_target', f'ik_leg_{side}')
        for tb in (f'{side}_ForeArm_twist', f'{side}_UpperArm_twist'):
            c = pbs['ctl_' + tb].constraints.new('LOCKED_TRACK'); c.name = 'Twist50'
            c.target = ct; c.subtarget = f'ctl_{tb}_aim'; c.lock_axis = 'LOCK_Y'; c.track_axis = 'TRACK_Z'; c.influence = 0.5
    # jaw range: rest is the modelled gape; it opens 25 deg more and closes 85 deg (teeth meet near 90, R5)
    c = pbs['ctl_jaw'].constraints.new('LIMIT_ROTATION'); c.name = 'JawRange'; c.owner_space = 'LOCAL'
    c.use_limit_x = True; c.min_x = math.radians(-85); c.max_x = math.radians(25)
    c.use_limit_y = True; c.min_y = math.radians(-8); c.max_y = math.radians(8)
    c.use_limit_z = True; c.min_z = math.radians(-8); c.max_z = math.radians(8)
    # runtime follows control
    for pb in rt.pose.bones:
        n = 'ctl_' + pb.name
        if n in pbs:
            c = pb.constraints.new('COPY_TRANSFORMS'); c.name = 'FollowControl'; c.target = ct; c.subtarget = n
            c.target_space = 'WORLD'; c.owner_space = 'WORLD'
    # collections + colours
    cols = {k: ct.data.collections.new(k) for k in ('Root/COG', 'Spine/Head', 'Arms FK', 'Legs FK', 'Jaw', 'Smock', 'Tie',
                                                    'IK + contact', 'Poles', 'Twist (auto)')}
    for b in cl:
        bone = ct.data.bones[b['name']]; n = b['name']; base = n[4:]
        side = 'L' if base.startswith('L_') else ('R' if base.startswith('R_') else 'C')
        if b['kind'] in ('ik', 'roll', 'target'):
            g = 'IK + contact'
        elif b['kind'] == 'pole':
            g = 'Poles'
        elif b['kind'] == 'aim' or base.endswith('_twist'):
            g = 'Twist (auto)'
        elif base in ('root', 'cog'):
            g = 'Root/COG'
        elif base in ('pelvis', 'spine_01', 'spine_02', 'chest', 'neck', 'neck_02', 'head'):
            g = 'Spine/Head'
        elif base.split('_', 1)[-1] in ('Clavicle', 'UpperArm', 'ForeArm', 'Hand', 'Finger'):
            g = 'Arms FK'
        elif base.split('_', 1)[-1] in ('Thigh', 'Calf', 'Calf_02', 'Foot', 'Toe'):
            g = 'Legs FK'
        elif base.startswith('tie_'):
            g = 'Tie'
        elif 'smock_' in base:
            g = 'Smock'
        else:
            g = 'Jaw'
        cols[g].assign(bone)
        bone.color.palette = ({'L': 'THEME04', 'R': 'THEME01', 'C': 'THEME03'} if b['kind'] == 'fk'
                              else {'L': 'THEME05', 'R': 'THEME02', 'C': 'THEME09'})[side]
    cols['Twist (auto)'].is_visible = False
    return ct, cl


def max_dev(ct, names):
    dev = 0.0
    for nm in names:
        pb = ct.pose.bones[nm]; r = ct.data.bones[nm].matrix_local
        dev = max(dev, pb.matrix.to_quaternion().rotation_difference(r.to_quaternion()).angle)
    return dev


def fit_pole_angles(ct):
    """Pole angle per limb so that the IK leaves the rest pose unchanged (coarse 90 deg, then 0.25 deg)."""
    out = {}
    for side in 'LR':
        for host, chain in ((f'ctl_{side}_ForeArm', (f'ctl_{side}_UpperArm', f'ctl_{side}_ForeArm')),
                            (f'ctl_{side}_Calf', (f'ctl_{side}_Thigh', f'ctl_{side}_Calf'))):
            con = ct.pose.bones[host].constraints['LimbIK']
            sc = []
            for a in range(-180, 180, 15):
                con.pole_angle = math.radians(a); bpy.context.view_layer.update(); sc.append((max_dev(ct, chain), a))
            sc.sort(); best = sc[0][1]; fine = []
            for k in range(-60, 61):
                a = best + 0.25 * k
                con.pole_angle = math.radians(a); bpy.context.view_layer.update(); fine.append((max_dev(ct, chain), a))
            fine.sort(); best = fine[0][1]; finer = []
            for k in range(-50, 51):
                a = best + 0.005 * k
                con.pole_angle = math.radians(a); bpy.context.view_layer.update(); finer.append((max_dev(ct, chain), a))
            finer.sort(); con.pole_angle = math.radians(finer[0][1]); bpy.context.view_layer.update()
            out[host] = dict(angle_deg=round(finer[0][1], 3), dev_deg=round(math.degrees(finer[0][0]), 5))
    return out
