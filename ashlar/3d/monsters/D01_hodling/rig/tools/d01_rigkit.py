"""Ham Blender dung chung cho build, kiem tra va QA rig D01 (chi chay trong Blender)."""
import math

import bpy
from mathutils import Matrix, Vector

import d01_common as C
import d01_rig_def as D

SIDES = ("L", "R")


def obj(name):
    return bpy.data.objects[name]


def get_mesh():
    return bpy.data.objects[C.MESH_NAME]


def runtime():
    return bpy.data.objects[C.RUNTIME_ARM]


def control():
    return bpy.data.objects[C.CONTROL_ARM]


def set_mode(ob, mode):
    bpy.context.view_layer.update()
    for o in list(bpy.context.view_layer.objects):
        if o is not None:
            o.select_set(False)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.mode_set(mode=mode)


def add_edit_bone(arm, name, head, tail, hinge=None, zvec=None, parent=None, deform=False):
    eb = arm.edit_bones.new(name)
    eb.head = Vector(head)
    eb.tail = Vector(tail)
    if zvec is None:
        zvec, _ = D.roll_z(head, tail, hinge or D.X)
    eb.align_roll(Vector(zvec))
    eb.use_deform = deform
    eb.use_connect = False
    if parent:
        eb.parent = arm.edit_bones[parent]
    return eb


def reset_pose(arm_ob):
    for pb in arm_ob.pose.bones:
        pb.location = (0, 0, 0)
        pb.rotation_mode = "QUATERNION"
        pb.rotation_quaternion = (1, 0, 0, 0)
        pb.scale = (1, 1, 1)
    bpy.context.view_layer.update()


def eval_mesh_positions(ob=None):
    """Toa do dinh sau khi bien dang (depsgraph da danh gia), numpy (n,3), the gioi."""
    import numpy as np
    ob = ob or get_mesh()
    dg = bpy.context.evaluated_depsgraph_get()
    ev = ob.evaluated_get(dg)
    me = ev.to_mesh()
    n = len(me.vertices)
    a = np.empty(n * 3)
    me.vertices.foreach_get("co", a)
    ev.to_mesh_clear()
    a = a.reshape(n, 3)
    mw = np.array(ob.matrix_world)
    return a @ mw[:3, :3].T + mw[:3, 3]


def rest_positions(ob=None):
    import numpy as np
    ob = ob or get_mesh()
    me = ob.data
    n = len(me.vertices)
    a = np.empty(n * 3)
    me.vertices.foreach_get("co", a)
    a = a.reshape(n, 3)
    mw = np.array(ob.matrix_world)
    return a @ mw[:3, :3].T + mw[:3, 3]


def world_pose_head_tail(arm_ob, name):
    pb = arm_ob.pose.bones[name]
    mw = arm_ob.matrix_world
    return mw @ pb.head, mw @ pb.tail


def deg(x):
    return math.radians(x)
