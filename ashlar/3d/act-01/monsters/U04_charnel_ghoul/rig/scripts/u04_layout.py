"""Runtime skeleton layout of U04 (names, parents, head/tail, roll rule) and an armature builder.

Roll rule (Qh, written in rig_brief.md for P04 too): every bone's local X is the world +X axis (the left of the
monster) projected off the bone, so bending in the sagittal plane (gallop, pounce, head up/down, jaw) is a
rotation about local X on both sides; the clavicles (along X) keep local Z up. The rule is mirror-consistent:
it gives the same axes as Blender's symmetrize.
"""
import bpy
from mathutils import Vector

CORE_H = ['root', 'cog', 'pelvis', 'spine_01', 'spine_02', 'chest', 'neck', 'head'] + \
    [f'{s}_{b}' for s in 'LR' for b in ('Clavicle', 'UpperArm', 'UpperArm_twist', 'ForeArm', 'ForeArm_twist', 'Hand',
                                        'Thigh', 'Calf', 'Foot', 'Toe')]
QH_SHARED = ['L_Finger', 'R_Finger']          # proposed for both Qh assets (hands planted like feet)
SOCKETS = ['ground', 'hit_origin', 'fx_chest', 'fx_head', 'fx_mouth', 'fx_hand_L', 'fx_hand_R']


def mir(p):
    return Vector((-p[0], p[1], p[2]))


def layout(Jm, chains, s):
    """Jm: joint dict in metres (L side); chains: {name: [p0, p1, p2]} in metres (already per side).
    Returns a list of dicts: name, head, tail, parent, connect, deform, kind (core/qh/extra/cloth/socket)."""
    V = {k: Vector(v) for k, v in Jm.items()}
    out = []

    def B(name, h, t, parent=None, connect=False, deform=True, kind='core'):
        out.append(dict(name=name, head=Vector(h), tail=Vector(t), parent=parent, connect=connect, deform=deform, kind=kind))
    mid_y = (V['pelvis'].y + V['chest'].y) / 2
    mid_z = (V['pelvis'].z + V['chest'].z) / 2
    B('root', (0, 0, 0), (0, 0.20 * s, 0), deform=False)
    B('ground', (0, 0, 0), (0, 0.10 * s, 0), 'root', deform=False, kind='socket')
    hit = V['hit']
    B('hit_origin', hit, hit + Vector((0, -0.08 * s, 0)), 'root', deform=False, kind='socket')
    B('cog', (0, mid_y, mid_z), (0, mid_y + 0.15 * s, mid_z), 'root', deform=False)
    B('pelvis', V['pelvis'], V['spine_01'], 'cog')
    B('spine_01', V['spine_01'], V['spine_02'], 'pelvis', True)
    B('spine_02', V['spine_02'], V['chest'], 'spine_01', True)
    B('chest', V['chest'], V['neck'], 'spine_02', True)
    fc = Vector((0, V['neck'].y - 0.03 * s, V['neck'].z - 0.11 * s))
    B('fx_chest', fc, fc + Vector((0, -0.06 * s, 0)), 'chest', deform=False, kind='socket')
    B('neck', V['neck'], V['neck_02'], 'chest', True)
    B('neck_02', V['neck_02'], V['head'], 'neck', True, kind='extra')
    B('head', V['head'], V['head_end'], 'neck_02', True)
    ht = V['head_end']
    B('fx_head', ht, ht + Vector((0, 0, 0.06 * s)), 'head', deform=False, kind='socket')
    fm = V['mouth']
    B('fx_mouth', fm, fm + Vector((0, -0.06 * s, 0)), 'head', deform=False, kind='socket')
    B('jaw', V['jaw'], V['jaw_end'], 'head', kind='extra')
    for P, f in (('L', lambda p: Vector(p)), ('R', mir)):
        ci, sh, el, wr, kn, fe = (f(V[k]) for k in ('clav_in', 'shoulder', 'elbow', 'wrist', 'knuckle', 'finger_end'))
        B(f'{P}_Clavicle', ci, sh, 'chest')
        B(f'{P}_UpperArm', sh, el, f'{P}_Clavicle', True)
        B(f'{P}_UpperArm_twist', sh, sh.lerp(el, 0.5), f'{P}_UpperArm')
        B(f'{P}_ForeArm', el, wr, f'{P}_UpperArm', True)
        B(f'{P}_ForeArm_twist', el.lerp(wr, 0.5), wr, f'{P}_ForeArm')
        B(f'{P}_Hand', wr, kn, f'{P}_ForeArm', True)
        B(f'{P}_Finger', kn, fe, f'{P}_Hand', True, kind='qh')
        pm = wr.lerp(kn, 0.5)
        B(f'fx_hand_{P}', pm, pm + Vector((0, 0, -0.04 * s)), f'{P}_Hand', deform=False, kind='socket')
        hp, kn2, hk, an, ba, te = (f(V[k]) for k in ('hip', 'knee', 'hock', 'ankle', 'ball', 'toe_end'))
        B(f'{P}_Thigh', hp, kn2, 'pelvis')
        B(f'{P}_Calf', kn2, hk, f'{P}_Thigh', True)
        B(f'{P}_Calf_02', hk, an, f'{P}_Calf', True, kind='extra')     # hock -> heel (2026-10-27, user)
        B(f'{P}_Foot', an, ba, f'{P}_Calf_02', True)
        B(f'{P}_Toe', ba, te, f'{P}_Foot', True)
    B('tie_01', V['tie'], V['tie_mid'], 'neck', kind='extra')
    B('tie_02', V['tie_mid'], V['tie_end'], 'tie_01', True, kind='extra')
    for name, (parent, pts) in chains.items():
        B(f'{name}_01', pts[0], pts[1], parent, kind='cloth')
        B(f'{name}_02', pts[1], pts[2], f'{name}_01', True, kind='cloth')
    return out


def roll_vector(head, tail):
    """Z target for align_roll so that local X ~ world +X (clavicles: Z up)."""
    y = (Vector(tail) - Vector(head)).normalized()
    z = Vector((1, 0, 0)).cross(y)
    if z.length < 0.35:                 # bone close to the X axis (clavicles)
        return Vector((0, 0, 1))
    return z.normalized()


def build_armature(name, bones, collection=None, display='OCTAHEDRAL'):
    arm = bpy.data.armatures.new(name); rig = bpy.data.objects.new(name, arm)
    (collection or bpy.context.scene.collection).objects.link(rig)
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = rig; rig.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm.edit_bones
    for b in bones:
        e = eb.new(b['name']); e.head = b['head']; e.tail = b['tail']; e.use_deform = b['deform']
        e.align_roll(roll_vector(b['head'], b['tail']))
    for b in bones:
        if b['parent']:
            e = eb[b['name']]; e.parent = eb[b['parent']]; e.use_connect = b['connect']
    bpy.ops.object.mode_set(mode='OBJECT')
    arm.display_type = display; rig.show_in_front = True
    return rig
