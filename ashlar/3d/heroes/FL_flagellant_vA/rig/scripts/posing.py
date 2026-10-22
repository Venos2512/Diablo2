"""Shared posing helpers (Blender): world-axis joint rotations that work on any skeleton in the D2R T-pose rest."""
import bpy, math
import numpy as np
from mathutils import Matrix, Vector

X, Y, Z = (1, 0, 0), (0, 1, 0), (0, 0, 1)


def reset_pose(arm):
    for pb in arm.pose.bones:
        pb.rotation_mode = 'QUATERNION'
        pb.rotation_quaternion = (1, 0, 0, 0)
        pb.location = (0, 0, 0)
        pb.scale = (1, 1, 1)
    bpy.context.view_layer.update()


def apply_pose(arm, spec, reset=True):
    """spec: [(bone, axis(x,y,z) | 'T', degrees | (dx,dy,dz) metres)], applied in order about each bone head, in world axes."""
    if reset:
        reset_pose(arm)
    for name, axis, deg in spec:
        pb = arm.pose.bones.get(name)
        if pb is None:
            continue
        if axis == 'T':
            pb.matrix = arm.matrix_world.inverted() @ (Matrix.Translation(Vector(deg)) @ (arm.matrix_world @ pb.matrix))
            bpy.context.view_layer.update()
            continue
        head = arm.matrix_world @ pb.head
        R = Matrix.Rotation(math.radians(deg), 4, Vector(axis))
        T = Matrix.Translation(head)
        pb.matrix = arm.matrix_world.inverted() @ (T @ R @ T.inverted() @ (arm.matrix_world @ pb.matrix))
        bpy.context.view_layer.update()


def mesh_positions(obj):
    dg = bpy.context.evaluated_depsgraph_get()
    ev = obj.evaluated_get(dg)
    me = ev.to_mesh()
    n = len(me.vertices)
    a = np.empty(n * 3)
    me.vertices.foreach_get('co', a)
    a = a.reshape(-1, 3) @ np.array(obj.matrix_world.to_3x3()).T + np.array(obj.matrix_world.translation)
    ev.to_mesh_clear()
    return a
