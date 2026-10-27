"""Blender helpers shared by the W04 build / validation / QA scripts (run inside Blender)."""
import math

import bpy
import numpy as np
from mathutils import Vector

import w04_common as C
import w04_rig_def as D


def set_mode(ob, mode):
    bpy.context.view_layer.update()
    if bpy.context.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    for o in list(bpy.context.view_layer.objects):
        o.select_set(False)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.mode_set(mode=mode)


def add_edit_bone(arm, b, deform):
    eb = arm.edit_bones.new(b['name'])
    eb.head = Vector(b['head'])
    eb.tail = Vector(b['tail'])
    z = b['zvec'] if b.get('zvec') else D.roll_z(b['head'], b['tail'], b.get('hinge') or D.X)
    eb.align_roll(Vector(z))
    eb.use_deform = deform
    eb.use_connect = False
    return eb


def mesh():
    return bpy.data.objects[C.MESH]


def runtime():
    return bpy.data.objects[C.RUNTIME]


def control():
    return bpy.data.objects[C.CONTROL]


def reset_pose(arm_ob):
    for pb in arm_ob.pose.bones:
        pb.location = (0, 0, 0)
        pb.rotation_mode = 'QUATERNION'
        pb.rotation_quaternion = (1, 0, 0, 0)
        pb.scale = (1, 1, 1)
    bpy.context.view_layer.update()


def eval_co(ob=None):
    ob = ob or mesh()
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    ev = ob.evaluated_get(dg)
    me = ev.to_mesh()
    n = len(me.vertices)
    a = np.empty(n * 3)
    me.vertices.foreach_get('co', a)
    ev.to_mesh_clear()
    mw = np.array(ob.matrix_world)
    return a.reshape(n, 3) @ mw[:3, :3].T + mw[:3, 3]


def rest_co(ob=None):
    ob = ob or mesh()
    me = ob.data
    n = len(me.vertices)
    a = np.empty(n * 3)
    me.vertices.foreach_get('co', a)
    mw = np.array(ob.matrix_world)
    return a.reshape(n, 3) @ mw[:3, :3].T + mw[:3, 3]


def rot_local(arm_ob, name, axis, deg):
    """rotate a pose bone about one of its local axes (on top of what it has)."""
    from mathutils import Quaternion
    pb = arm_ob.pose.bones[name]
    pb.rotation_mode = 'QUATERNION'
    q = Quaternion(Vector(axis), math.radians(deg))
    pb.rotation_quaternion = pb.rotation_quaternion @ q


def rot_world(arm_ob, name, axis_world, deg, pivot_local=True):
    """rotate a pose bone about a WORLD axis through its head (converted to the bone's local frame)."""
    from mathutils import Quaternion
    pb = arm_ob.pose.bones[name]
    bpy.context.view_layer.update()
    M = (arm_ob.matrix_world @ pb.matrix).to_3x3().normalized()
    ax_local = M.inverted() @ Vector(axis_world)
    pb.rotation_mode = 'QUATERNION'
    pb.rotation_quaternion = pb.rotation_quaternion @ Quaternion(ax_local.normalized(), math.radians(deg))
