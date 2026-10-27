"""B01 QA test poses on the control rig (status: experiment, QA only; never clips).

Each pose is a list of operations applied in order on B01_control after a reset:
  ('rot', bone, world_axis, degrees)          rotate a ctl bone about a world axis through its head (FK bones, rolls)
  ('move', bone, (dx, dy, dz))                translate a ctl bone in world space (IK paw controls, body)
  ('set', prop, value)                        set a custom property on the control object (ik_* switches)
World: the dog faces -Y, its left is +X, Z up. About +X a positive angle turns -Y towards -Z: nose / neck down, jaw open,
tail and toes of a forward-pointing bone down; negative = up. About +Z a positive angle turns -Y towards +X: head turns to the
dog's left. Angles are applied in order, each about the bone's current head.
"""
import bpy, math
from mathutils import Matrix, Vector, Quaternion

X, Y, Z = (1, 0, 0), (0, 1, 0), (0, 0, 1)

POSES = {
    'rest': [],
    # diagonal pair in swing (L front + R hind forward and lifted), the other pair planted back
    'step_diag': [('move', 'ctl_body', (0, -0.04, -0.02)),
                  ('move', 'ctl_L_Hand_IK', (0, -0.24, 0.12)), ('rot', 'ctl_L_Hand_IK', X, 35),
                  ('move', 'ctl_R_Hand_IK', (0, 0.08, 0.0)), ('rot', 'ctl_R_Hand_roll', X, 20),
                  ('move', 'ctl_R_Foot_IK', (0, -0.22, 0.10)), ('rot', 'ctl_R_Foot_IK', X, 30),
                  ('move', 'ctl_L_Foot_IK', (0, 0.08, 0.0)), ('rot', 'ctl_L_Foot_roll', X, 15),
                  ('rot', 'ctl_spine_01', Z, -4), ('rot', 'ctl_chest', Z, 4), ('rot', 'ctl_tail_01', Z, 8)],
    # hind end down: body pitched up around the cog and lowered; metatarsals flat, front legs straight
    'sit': [('rot', 'ctl_body', X, -32), ('move', 'ctl_body', (0, 0.05, -0.26)),
            ('move', 'ctl_L_Foot_IK', (0, -0.14, 0.05)), ('move', 'ctl_R_Foot_IK', (0, -0.14, 0.05)),
            ('rot', 'ctl_L_Foot_IK', X, -8), ('rot', 'ctl_R_Foot_IK', X, -8),
            ('rot', 'ctl_L_Foot_roll', X, -52), ('rot', 'ctl_R_Foot_roll', X, -52),
            ('rot', 'ctl_neck_01', X, -18), ('rot', 'ctl_head', X, 12),
            ('rot', 'ctl_tail_01', X, 35), ('rot', 'ctl_tail_02', X, 25)],
    # head down to the ground
    'sniff': [('rot', 'ctl_neck_01', X, 30), ('rot', 'ctl_neck_02', X, 22), ('rot', 'ctl_head', X, 22),
              ('move', 'ctl_body', (0, -0.03, -0.04)), ('rot', 'ctl_chest', X, 4)],
    # look back over the left shoulder
    'look_back': [('rot', 'ctl_spine_02', Z, 5), ('rot', 'ctl_chest', Z, 8), ('rot', 'ctl_neck_01', Z, 24),
                  ('rot', 'ctl_neck_02', Z, 22), ('rot', 'ctl_head', Z, 20)],
    # tail wag to the left + lift
    'tail_wag': [('rot', 'ctl_tail_01', Z, 15), ('rot', 'ctl_tail_02', Z, 12), ('rot', 'ctl_tail_03', Z, 10),
                 ('rot', 'ctl_tail_04', Z, 8), ('rot', 'ctl_tail_01', X, -15)],
    # jaw open 15 degrees
    'jaw_open': [('rot', 'ctl_jaw', X, 15)],
    # front leg raised and reaching forward (strike), the other legs planted
    'reach_front': [('move', 'ctl_L_Hand_IK', (0, -0.28, 0.26)), ('rot', 'ctl_L_Hand_IK', X, 40),
                    ('rot', 'ctl_L_Scapula', X, -14)],
    # hind leg stretched back
    'kick_back': [('move', 'ctl_L_Foot_IK', (0, 0.24, 0.10)), ('rot', 'ctl_L_Foot_IK', X, -25)],
    # side bend (C-curve, turning left)
    'bend_side': [('rot', 'ctl_spine_01', Z, 6), ('rot', 'ctl_spine_02', Z, 6), ('rot', 'ctl_chest', Z, 6)],
    # back arch up / sag down
    'arch': [('rot', 'ctl_spine_01', X, -6), ('rot', 'ctl_chest', X, 12)],
    # pounce: crouched, front paws forward and up, hind legs loaded
    'pounce': [('rot', 'ctl_body', X, -10), ('move', 'ctl_body', (0, -0.10, -0.06)),
               ('move', 'ctl_L_Hand_IK', (0, -0.32, 0.30)), ('rot', 'ctl_L_Hand_IK', X, 55),
               ('move', 'ctl_R_Hand_IK', (0, -0.28, 0.24)), ('rot', 'ctl_R_Hand_IK', X, 50),
               ('rot', 'ctl_L_Foot_roll', X, 15), ('rot', 'ctl_R_Foot_roll', X, 15),
               ('rot', 'ctl_neck_01', X, -10), ('rot', 'ctl_jaw', X, 12), ('rot', 'ctl_tail_01', X, 20)],
    # ears out, chain swings
    'ears_ring': [('rot', 'ctl_L_ear', Y, -20), ('rot', 'ctl_R_ear', Y, 20), ('rot', 'ctl_collar_ring', X, -25),
                  ('rot', 'ctl_head', Z, 12)],
}
PLANTED = {   # paws that must stay on the floor (contact test), by pose. Roll controls: + lifts the heel (carpus / hock up)
              # around the ball joint, - lays the pastern / metatarsus back towards the floor (sit).
    'rest': ('L_front', 'R_front', 'L_hind', 'R_hind'),
    'step_diag': ('R_front', 'L_hind'), 'sit': ('L_front', 'R_front', 'L_hind', 'R_hind'),
    'sniff': ('L_front', 'R_front', 'L_hind', 'R_hind'), 'look_back': ('L_front', 'R_front', 'L_hind', 'R_hind'),
    'tail_wag': ('L_front', 'R_front', 'L_hind', 'R_hind'), 'jaw_open': ('L_front', 'R_front', 'L_hind', 'R_hind'),
    'reach_front': ('R_front', 'L_hind', 'R_hind'), 'kick_back': ('L_front', 'R_front', 'R_hind'),
    'bend_side': ('L_front', 'R_front', 'L_hind', 'R_hind'), 'arch': ('L_front', 'R_front', 'L_hind', 'R_hind'),
    'pounce': ('L_hind', 'R_hind'), 'ears_ring': ('L_front', 'R_front', 'L_hind', 'R_hind'),
}


def reset(cr):
    for pb in cr.pose.bones:
        pb.location = (0, 0, 0); pb.rotation_mode = 'QUATERNION'
        pb.rotation_quaternion = (1, 0, 0, 0); pb.scale = (1, 1, 1)
    for p in ('ik_arm_L', 'ik_arm_R', 'ik_leg_L', 'ik_leg_R'):
        cr[p] = 1.0
    bpy.context.view_layer.update()


def rot_world(cr, name, axis, deg):
    bpy.context.view_layer.update()
    pb = cr.pose.bones[name]; M = cr.matrix_world
    W = M @ pb.matrix; h = W.to_translation()
    R = Matrix.Translation(h) @ Quaternion(Vector(axis), math.radians(deg)).to_matrix().to_4x4() @ Matrix.Translation(-h)
    pb.matrix = M.inverted() @ (R @ W)
    bpy.context.view_layer.update()


def move_world(cr, name, d):
    bpy.context.view_layer.update()
    pb = cr.pose.bones[name]; M = cr.matrix_world
    W = M @ pb.matrix
    W = Matrix.Translation(Vector(d)) @ W
    pb.matrix = M.inverted() @ W
    bpy.context.view_layer.update()


def apply(cr, name):
    reset(cr)
    for op in POSES[name]:
        if op[0] == 'rot':
            rot_world(cr, op[1], op[2], op[3])
        elif op[0] == 'move':
            move_world(cr, op[1], op[2])
        elif op[0] == 'set':
            cr[op[1]] = op[2]
    bpy.context.view_layer.update()
