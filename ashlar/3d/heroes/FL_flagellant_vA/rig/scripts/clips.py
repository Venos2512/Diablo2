"""Synthetic QA motion clips (NOT Sorceress animations: the supplied Sorceress GLB contains no animation clips).

They exist only to prove that the skeleton, rest pose, skin weights and glTF export deform correctly under motion.
Each frame is built with world-axis joint rotations (posing.apply_pose) and baked to rotation/location keys on the bones used.
"""
import bpy, math
from posing import X, Y, Z, apply_pose

FPS = 24


def idle(f, n):
    p = 2 * math.pi * f / n
    s = math.sin(p)
    return [('L_UpperArm', Y, 66 + 1.0 * s), ('R_UpperArm', Y, -66 - 1.0 * s),
            ('L_ForeArm', Z, -10), ('R_ForeArm', Z, 10),
            ('spine_02', X, 1.6 * s), ('chest', X, 1.6 * s), ('head', X, -1.5 * s), ('head', Z, 2.0 * math.sin(p + 1.0)),
            ('front_skirt_front_skirt_02', X, -2.5 * math.sin(p + 0.5)), ('front_skirt_front_skirt_04', X, -3.5 * math.sin(p + 0.9)),
            ('R_skirt_03', X, 3.0 * math.sin(p + 1.4)), ('L_skirt_03', X, 3.0 * math.sin(p + 1.4))]


def walk(f, n):
    p = 2 * math.pi * f / n
    s, c = math.sin(p), math.cos(p)
    thL, thR = -26 * s, 26 * s                    # thigh swing (negative = forward)
    knL, knR = 38 * max(0.0, c), 38 * max(0.0, -c)   # knee flexion during the forward swing
    spec = [('cog', 'T', (0, 0, -0.025 * abs(s) - 0.01)),
            ('pelvis', Z, 5 * s), ('spine_02', Z, -4 * s), ('chest', Z, -5 * s), ('neck', Z, 5 * s),
            ('L_Thigh', X, thL), ('R_Thigh', X, thR), ('L_Calf', X, knL), ('R_Calf', X, knR),
            ('L_Foot', X, -(thL + knL) * 0.8), ('R_Foot', X, -(thR + knR) * 0.8),
            ('L_UpperArm', Y, 68), ('R_UpperArm', Y, -68), ('L_UpperArm', X, 14 * s), ('R_UpperArm', X, -14 * s),
            ('L_ForeArm', Z, -18), ('R_ForeArm', Z, 18)]
    for i, b in enumerate(('front_skirt_front_skirt_01', 'front_skirt_front_skirt_03', 'front_skirt_front_skirt_05')):
        spec.append((b, X, -(thL - thR) * 0.20 * (1 + 0.4 * i) * 0.5))
    for sd, th in (('L', thL), ('R', thR)):
        spec.append(('%s_side_skirt_side_skirt_02' % sd, Y, (12 if sd == 'L' else -12) * abs(th) / 26.0))
    return spec


def arm_swing(f, n):
    t = f / (n - 1.0)
    # raise the right arm, wind back, strike forward, recover; spine follows
    k = math.sin(math.pi * t)
    wind = math.sin(math.pi * min(1.0, t * 2.0)) if t < 0.5 else 0.0
    strike = math.sin(math.pi * (t - 0.4) / 0.6) if t > 0.4 else 0.0
    return [('R_UpperArm', Y, 55 * k), ('R_UpperArm', Z, 40 * wind - 70 * strike),
            ('R_ForeArm', Z, 60 * k), ('L_UpperArm', Y, 60), ('L_ForeArm', Z, -30),
            ('spine_01', Z, -14 * wind + 22 * strike), ('chest', Z, -10 * wind + 16 * strike), ('head', Z, 8 * strike),
            ('pelvis', Z, -6 * wind + 9 * strike)]


CLIPS = {'QA_idle': (idle, 48), 'QA_walk': (walk, 32), 'QA_arm_swing': (arm_swing, 36)}


def build_actions(arm):
    """bake each clip to an action and push it on its own NLA track (muted afterwards so the .blend opens at rest)."""
    scene = bpy.context.scene
    scene.render.fps = FPS
    if arm.animation_data is None:
        arm.animation_data_create()
    made = {}
    acts = []
    for name, (fn, n) in CLIPS.items():
        arm.animation_data.action = None
        data = []
        touched = set()
        for f in range(n):                               # pass 1: solve every frame, remember the pose-bone values
            apply_pose(arm, fn(f, n))
            frame = {}
            for pb in arm.pose.bones:
                q, loc = tuple(pb.rotation_quaternion), tuple(pb.location)
                if abs(q[0] - 1) > 1e-6 or any(abs(v) > 1e-6 for v in q[1:]) or any(abs(v) > 1e-7 for v in loc):
                    frame[pb.name] = (q, loc)
                    touched.add(pb.name)
            data.append(frame)
        act = bpy.data.actions.new(name)
        act.use_fake_user = True
        arm.animation_data.action = act
        prev = {}
        for f in range(n):                               # pass 2: write keys (no re-evaluation in between)
            for bn in sorted(touched):
                pb = arm.pose.bones[bn]
                q, loc = data[f].get(bn, ((1, 0, 0, 0), (0, 0, 0)))
                if bn in prev and sum(a * b for a, b in zip(q, prev[bn])) < 0:       # keep quaternion hemisphere continuous
                    q = tuple(-v for v in q)
                prev[bn] = q
                pb.rotation_quaternion = q
                pb.location = loc
                pb.keyframe_insert('rotation_quaternion', frame=f + 1, group=bn)
                pb.keyframe_insert('location', frame=f + 1, group=bn)
        arm.animation_data.action = None
        acts.append((name, act))
        made[name] = {'frames': n, 'fps': FPS, 'animated_bones': len(touched)}
    # NLA tracks only after every clip is baked: an active track would re-evaluate (and double) the pose while the next clip is solved
    for name, act in acts:
        track = arm.animation_data.nla_tracks.new()
        track.name = name
        strip = track.strips.new(name, 1, act)
        strip.name = name
    apply_pose(arm, [])
    return made


def mute_tracks(arm, muted=True):
    for t in arm.animation_data.nla_tracks:
        t.mute = muted
