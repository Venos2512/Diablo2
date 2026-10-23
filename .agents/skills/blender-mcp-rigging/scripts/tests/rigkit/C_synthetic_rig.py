r"""Owner C, Blender test helper: the adversarial synthetic rig used by the C_test_* Blender scripts (no asset files).

``build()`` makes a rig that breaks every runtime-emulation rule: armature ``T_runtime`` with 5 deform bones b1..b5 along +X (b2 with
bbone_segments 3) and a NON-deform socket ``sock`` (child of b5) that carries weights; tube mesh ``T_mesh`` (252 vertices, radius
2 cm, 0.2 m long) with 6 weighted groups (every vertex has > 4 influences, some weights <= 1e-4), a non-bone group ``junk``, an
Armature modifier with Preserve Volume ON, a Corrective Smooth modifier, parent type ARMATURE. ``dress_state()`` adds the state the
tools must restore exactly: an Action with a slot on the armature at frame 7, IK-like custom properties, an Euler pose channel, a
hidden helper object, a selection, non-default render / Workbench settings and a world.

Units: metres, Blender frame (Z up, front -Y, left +X).
"""
import math

import bpy
import numpy as np

NAMES = ["b1", "b2", "b3", "b4", "b5", "sock"]


def build():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    arm_d = bpy.data.armatures.new("T_runtime")
    arm = bpy.data.objects.new("T_runtime", arm_d)
    bpy.context.scene.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="EDIT")
    prev = None
    for i in range(5):
        eb = arm_d.edit_bones.new(f"b{i + 1}")
        eb.head, eb.tail = (0.04 * i, 0, 0), (0.04 * (i + 1), 0, 0)
        eb.align_roll((0, 0, 1))
        eb.parent, eb.use_connect = prev, False
        prev = eb
    sk = arm_d.edit_bones.new("sock")
    sk.head, sk.tail, sk.parent = (0.2, 0, 0), (0.22, 0, 0), prev
    bpy.ops.object.mode_set(mode="OBJECT")
    arm_d.bones["sock"].use_deform = False
    arm_d.bones["b2"].bbone_segments = 3
    n_around, n_rings, r = 12, 21, 0.02
    verts, faces = [], []
    for k in range(n_rings):
        x = 0.2 * k / (n_rings - 1)
        for j in range(n_around):
            a = 2 * math.pi * j / n_around
            verts.append((x, r * math.cos(a), r * math.sin(a)))
    for k in range(n_rings - 1):
        for j in range(n_around):
            a, b = k * n_around + j, k * n_around + (j + 1) % n_around
            faces.append((a, b, b + n_around, a + n_around))
    me = bpy.data.meshes.new("T_mesh")
    me.from_pydata(verts, [], faces)
    ob = bpy.data.objects.new("T_mesh", me)
    bpy.context.scene.collection.objects.link(ob)
    rng = np.random.default_rng(5)
    xs = np.array(verts)[:, 0]
    W = np.zeros((len(verts), 6), np.float32)
    for i in range(5):
        W[:, i] = np.exp(-((xs - 0.04 * i - 0.02) / 0.03) ** 2) + rng.uniform(0.01, 0.05, len(verts))
    W[::7, 0] = 5e-5  # dropped by the exporter rule
    W[xs > 0.18, 5] = 0.3  # socket weights: the exporter skins them, Blender would not (non-deform)
    W /= W.sum(1, keepdims=True)
    for j, nm in enumerate(NAMES):
        vg = ob.vertex_groups.new(name=nm)
        for v in range(len(verts)):
            if W[v, j] > 0:
                vg.add([v], float(W[v, j]), "REPLACE")
    junk = ob.vertex_groups.new(name="junk")
    junk.add(list(range(0, len(verts), 3)), 0.9, "REPLACE")
    am = ob.modifiers.new("arm", "ARMATURE")
    am.object = arm
    am.use_deform_preserve_volume = True
    ob.modifiers.new("cs", "CORRECTIVE_SMOOTH")
    ob.parent = arm
    ob.parent_type = "ARMATURE"
    bpy.context.view_layer.update()
    return arm, ob, NAMES


def dress_state(arm):
    """State that the S7/S8 tools change and must restore (see the module docstring)."""
    act = bpy.data.actions.new("T_idle")
    arm.animation_data_create()
    arm.animation_data.action = act
    pb = arm.pose.bones["b1"]
    pb.rotation_mode = "QUATERNION"
    pb.rotation_quaternion = (0.995, 0.0998, 0.0, 0.0)
    pb.keyframe_insert("rotation_quaternion", frame=1)
    pb.rotation_quaternion = (0.98, 0.0, 0.199, 0.0)
    pb.keyframe_insert("rotation_quaternion", frame=10)
    p3 = arm.pose.bones["b3"]
    p3.rotation_mode = "XYZ"
    p3.rotation_euler = (0.1, 0.2, 0.3)
    p3.location = (0.001, 0.0, 0.002)
    arm["ik_arm_L"] = 0.25
    arm["note"] = "keep"
    sc = bpy.context.scene
    sc.frame_set(7)
    helper = bpy.data.objects.new("T_helper", None)
    sc.collection.objects.link(helper)
    helper.hide_set(True)
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    sc.render.resolution_x, sc.render.resolution_y = 321, 123
    sc.render.film_transparent = True
    sc.display.shading.light = "MATCAP"
    sc.world = bpy.data.worlds.new("T_world")
    sc.world.color = (0.1, 0.2, 0.3)
    bpy.context.view_layer.update()
    return act


def save(path):
    """Save the open file as ``path`` (a copy for the headless tools); the open file keeps its state."""
    bpy.ops.wm.save_as_mainfile(filepath=path, copy=True)
    return path
