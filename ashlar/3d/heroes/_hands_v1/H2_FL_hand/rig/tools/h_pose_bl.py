"""H2_FL_hand rig: pose application on the CONTROL rig in Blender, shared by h09_rom.py (metrics) and h11_render.py (images), so both
show the same pose for the same rig_recipe.json 'rom' spec. Call bind(ctl, R) once after the file is open; then apply(spec) / reset().
Same semantics as h_fk.py (numpy FK, parity-checked)."""
import math

import bpy
from mathutils import Matrix, Quaternion, Vector

ctl = None
R = None
rom = None


def bind(ctl_obj, recipe):
    global ctl, R, rom, SPREAD_SIGN, LAB, LP
    ctl, R, rom = ctl_obj, recipe, recipe['rom']
    _init()


def _init():
    global SPREAD_SIGN, LAB, LP
    # spread sign per _01: +spread must move the tail toward world +x
    SPREAD_SIGN = {}
    for f in FING[1:]:
        b = ctl.data.bones[f'ctl_{f}_01']
        zl = Vector((0, 0, 1))
        q = Quaternion(zl, 10 * DEG)
        y0 = b.matrix_local.to_3x3() @ Vector((0, 1, 0))
        y1 = b.matrix_local.to_3x3() @ (q.to_matrix() @ Vector((0, 1, 0)))
        SPREAD_SIGN[f] = 1.0 if (y1 - y0).x > 0 else -1.0

    # lab axes (createFingerRig): along from the chain, curl = along x n (n = palm projected), self-checked, spread = along x curl (dorsum side)
    LAB = {}
    for f in FING:
        heads = [ctl.data.bones[f'ctl_{f}_0{k}'].head_local for k in (1, 2, 3)]
        for k in range(3):
            if k < 2:
                along = (heads[k + 1] - heads[k]).normalized()
            else:
                along = (heads[2] - heads[1]).normalized()
            n = (PALM - along * PALM.dot(along)).normalized()
            curl = along.cross(n).normalized()
            turned = Quaternion(curl, 5 * DEG) @ along
            if turned.dot(PALM) <= along.dot(PALM):
                curl = -curl
            spread = along.cross(curl).normalized()
            if spread.z < 0:  # lab: spreadH.y < 0 -> negate (lab y = Blender z)
                spread = -spread
            LAB[f'{f}_0{k + 1}'] = dict(curl=list(curl), spread=list(spread), along=list(along))
    LP = rom['lab_finger_poses']

FING = ['thumb', 'index', 'middle', 'ring', 'pinky']
PALM = Vector((0, 0, -1))
DEG = math.pi / 180


def reset():
    for pb in ctl.pose.bones:
        pb.rotation_mode = 'QUATERNION'
        pb.rotation_quaternion = (1, 0, 0, 0)
        pb.location = (0, 0, 0)
        pb.scale = (1, 1, 1)
    bpy.context.view_layer.update()


def local_axis(bname, axis_world):
    """a hand-frame (armature space) direction -> the bone's rest-local axis."""
    m = ctl.data.bones[bname].matrix_local.to_3x3()
    return (m.inverted() @ axis_world).normalized()





def lab_angles(f, offer, grip):
    p = LP[f]
    lerp = lambda a, b, t: a + (b - a) * t  # noqa: E731
    curl = [lerp(lerp(p['relaxed'][k], p['open'][k], offer), p['grip'][k], grip) for k in range(3)]
    spread = lerp(lerp(p['spread']['relaxed'], p['spread']['open'], offer), p['spread']['grip'], grip)
    return curl, spread


def apply(spec):
    reset()
    if 'lab' in spec:
        offer, grip = spec['lab']
        for f in FING:
            curl, spread = lab_angles(f, offer, grip)
            for k in range(3):
                bn = f'ctl_{f}_0{k + 1}'
                ax = LAB[f'{f}_0{k + 1}']
                q = Quaternion((1, 0, 0, 0))
                if k == 0:
                    q = q @ Quaternion(local_axis(bn, Vector(ax['spread'])), spread * DEG)
                q = q @ Quaternion(local_axis(bn, Vector(ax['curl'])), curl[k] * DEG)
                ctl.pose.bones[bn].rotation_quaternion = q
    if 'lab_curl' in spec:  # explicit angles about the lab-derived axes (the contact-limited lab grip proposed for this hand)
        for f, cl in spec['lab_curl'].items():
            for k in range(3):
                bn = f'ctl_{f}_0{k + 1}'
                ax = LAB[f'{f}_0{k + 1}']
                q = Quaternion((1, 0, 0, 0))
                if k == 0:
                    q = q @ Quaternion(local_axis(bn, Vector(ax['spread'])), spec.get('lab_spread', {}).get(f, 0.0) * DEG)
                q = q @ Quaternion(local_axis(bn, Vector(ax['curl'])), cl[k] * DEG)
                ctl.pose.bones[bn].rotation_quaternion = q
    for f, c in spec.get('curl', {}).items():
        for k in range(3):
            pb = ctl.pose.bones[f'ctl_{f}_0{k + 1}']
            pb.rotation_quaternion = pb.rotation_quaternion @ Quaternion(Vector((1, 0, 0)), c[k] * DEG)
    for f, a in spec.get('spread', {}).items():
        pb = ctl.pose.bones[f'ctl_{f}_01']
        pb.rotation_quaternion = Quaternion(Vector((0, 0, 1)), SPREAD_SIGN[f] * a * DEG) @ pb.rotation_quaternion
    for bn, e in spec.get('bones', {}).items():
        pb = ctl.pose.bones['ctl_' + bn]
        pb.rotation_quaternion = pb.rotation_quaternion @ Matrix.Rotation(e[0] * DEG, 4, 'X').to_quaternion() @ \
            Matrix.Rotation(e[1] * DEG, 4, 'Y').to_quaternion() @ Matrix.Rotation(e[2] * DEG, 4, 'Z').to_quaternion()
    if 'fist' in spec:
        ctl.pose.bones['ctl_fist'].location = (0, spec['fist'] * R['skeleton']['fist_travel'], 0)
    bpy.context.view_layer.update()
