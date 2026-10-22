"""Tu the thu cuc tri cho QA rig D01 (chi dung de QA: khong phai animation production). Chay trong Blender.

Moi tu the chi dung diem dieu khien that cua rig (ctl_*): IK tay/chan, FK than/dau/tay/chan khi tat IK, cog.
Vi tri/xoay dat theo toa do the gioi (m, do) qua pose-bone matrix, nen khong phu thuoc truc local cua bone.
"""
import math

import bpy
from mathutils import Matrix, Vector

import d01_rigkit as K

AX = {"x": Vector((1, 0, 0)), "y": Vector((0, 1, 0)), "z": Vector((0, 0, 1))}


def _ct():
    return K.control()


def place(name, world_pos, rot_world=None):
    ct = _ct()
    pb = ct.pose.bones[name]
    m = pb.matrix.copy()
    m.translation = Vector(world_pos)
    pb.matrix = m
    bpy.context.view_layer.update()


def move(name, delta):
    ct = _ct()
    pb = ct.pose.bones[name]
    m = pb.matrix.copy()
    m.translation = m.translation + Vector(delta)
    pb.matrix = m
    bpy.context.view_layer.update()


def rotate(name, axis, deg, pivot=None):
    """Xoay bone quanh truc the gioi 'axis' (x/y/z hoac Vector) mot goc deg, tam xoay = dau bone (mac dinh)."""
    ct = _ct()
    pb = ct.pose.bones[name]
    ax = AX[axis] if isinstance(axis, str) else Vector(axis)
    pv = Vector(pivot) if pivot is not None else pb.head.copy()
    R = Matrix.Translation(pv) @ Matrix.Rotation(math.radians(deg), 4, ax) @ Matrix.Translation(-pv)
    pb.matrix = R @ pb.matrix
    bpy.context.view_layer.update()


def set_ik(leg=None, arm=None):
    ct = _ct()
    for s in K.SIDES:
        if leg is not None:
            ct[f"ik_leg_{s}"] = leg
        if arm is not None:
            ct[f"ik_arm_{s}"] = arm
    bpy.context.view_layer.update()


def p_rest():
    pass


def p_hands_raised():
    place("ctl_L_Hand_IK", (0.10, -0.075, 0.50))
    place("ctl_R_Hand_IK", (-0.10, -0.075, 0.50))


def p_hands_crossed():
    place("ctl_L_Hand_IK", (-0.035, -0.095, 0.285))
    place("ctl_R_Hand_IK", (0.035, -0.095, 0.30))


def p_arms_down_fk():
    set_ik(arm=0.0)
    rotate("ctl_L_UpperArm", "y", 80)
    rotate("ctl_R_UpperArm", "y", -80)
    for s in K.SIDES:
        pb = _ct().pose.bones[f"ctl_{s}_ForeArm"]
        rotate(f"ctl_{s}_ForeArm", pb_hinge(pb), 25)


def pb_hinge(pb):
    """Truc ban le (the gioi) cua pose bone = truc local X cua no."""
    return (_ct().matrix_world.to_3x3() @ pb.matrix.to_3x3() @ Vector((1, 0, 0))).normalized()


def p_arms_forward_fk():
    set_ik(arm=0.0)
    rotate("ctl_L_UpperArm", "z", -85)
    rotate("ctl_R_UpperArm", "z", 85)
    for s in K.SIDES:
        pb = _ct().pose.bones[f"ctl_{s}_ForeArm"]
        rotate(f"ctl_{s}_ForeArm", pb_hinge(pb), 70)


def p_elbows_max_fk():
    set_ik(arm=0.0)
    for s in K.SIDES:
        pb = _ct().pose.bones[f"ctl_{s}_ForeArm"]
        rotate(f"ctl_{s}_ForeArm", pb_hinge(pb), 135)


def p_squat():
    move("ctl_cog", (0, 0, -0.075))
    rotate("ctl_spine_01", "x", 18)


def p_long_step():
    """Buoc dai trong tam voi that cua chan (hong->co chan ~0,13 m): chan truoc +0,05 ra truoc, chan sau 0,045 ra sau, got chan sau nhac."""
    move("ctl_L_Foot_IK", (0.0, -0.05, 0.0))
    move("ctl_R_Foot_IK", (0.0, 0.045, 0.0))
    rotate("ctl_R_Toe_roll", "x", 28)  # nhac got chan sau quanh mui chan (x duong = got nang)
    move("ctl_cog", (0, -0.01, -0.012))


def p_twist_p45():
    for nm in ("ctl_spine_01", "ctl_spine_02", "ctl_chest"):
        rotate(nm, "z", 15)


def p_twist_m45():
    for nm in ("ctl_spine_01", "ctl_spine_02", "ctl_chest"):
        rotate(nm, "z", -15)


def p_head_down():
    rotate("ctl_neck", "x", 18)
    rotate("ctl_head", "x", 22)


def p_head_up():
    rotate("ctl_neck", "x", -15)
    rotate("ctl_head", "x", -22)


def p_head_turn():
    rotate("ctl_neck", "z", 25)
    rotate("ctl_head", "z", 25)


def p_hip_flex_fk():
    set_ik(leg=0.0)
    rotate("ctl_L_Thigh", "x", -70)
    pb = _ct().pose.bones["ctl_L_Calf"]
    rotate("ctl_L_Calf", pb_hinge(pb), 95)
    rotate("ctl_R_Thigh", "x", 30)
    pb = _ct().pose.bones["ctl_R_Calf"]
    rotate("ctl_R_Calf", pb_hinge(pb), 25)


def p_hip_abduct_fk():
    set_ik(leg=0.0)
    rotate("ctl_L_Thigh", "y", -40)
    rotate("ctl_R_Thigh", "y", 40)


def p_aux_motion():
    rotate("ctl_helmet", "x", 14)
    rotate("ctl_sack", "x", -10)
    rotate("ctl_loincloth_front", "x", -35)
    rotate("ctl_L_ear", "z", 25)
    rotate("ctl_R_ear", "z", -25)


POSES = {
    "rest": p_rest,
    "hands_raised": p_hands_raised,
    "hands_crossed": p_hands_crossed,
    "arms_down_fk": p_arms_down_fk,
    "arms_forward_fk": p_arms_forward_fk,
    "elbows_max_fk": p_elbows_max_fk,
    "squat": p_squat,
    "long_step": p_long_step,
    "twist_p45": p_twist_p45,
    "twist_m45": p_twist_m45,
    "head_down": p_head_down,
    "head_up": p_head_up,
    "head_turn": p_head_turn,
    "hip_flex_fk": p_hip_flex_fk,
    "hip_abduct_fk": p_hip_abduct_fk,
    "aux_motion": p_aux_motion,
}


def apply(name):
    ct = _ct()
    set_ik(leg=1.0, arm=1.0)
    K.reset_pose(ct)
    POSES[name]()
    bpy.context.view_layer.update()
