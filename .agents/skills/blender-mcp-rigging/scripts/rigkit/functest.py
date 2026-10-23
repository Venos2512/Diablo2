"""rigkit.functest - S5 function tests of a built rig (port of D01 ``v2_rig_function.py``), driven by the family's IK entries, plus
pose extremes (no NaN / inf, clean matrices), socket follow and the reopened-file state.

Units: metres; thresholds are D01's absolute numbers scaled by ``s = H / 0.5`` (D01 is 0.5 m tall, so its numbers come back
exactly).  Frame: Blender, Z up, character front -Y, character left +X.  Poses move control bones in WORLD space (translation or
rotation about a world axis through the bone head), so they do not depend on bone rolls.

Two measuring modes (``mode="auto"`` picks ``mesh`` when the mesh has deform-bone vertex groups):

* ``mesh``: points = evaluated mesh vertices; a bone's region = vertices whose weight on it is > 0.5 (D01).
* ``bones``: S5 runs before skinning, so points = posed heads/tails of the runtime bones + floor probes (heel and toe tip on the
  floor, from the heads of ``ctl_{S}_Heel_roll`` / ``ctl_{S}_Toe_roll``, rigidly bound to the foot / toe like vertices); a bone's
  region = its points.

The 20 tests of D01 keep D01's order (``tests``): foot IK x2, hand IK x2, knee/elbow pole x2, heel/toe/ball roll (L), root move,
cog down, chest rotate, head rotate, the four region-limited tests of ``skin.region_bones`` (D01: the sack; mesh mode only; a
family without region lists skips them) and leg IK -> FK. ``extra_tests`` holds the generic additions: R-side foot rolls, arm
IK -> FK, clavicle raise, twist drivers (``twist_tests``: pure twist and combined twist + flexion + deviation poses, FK and hand
IK, 0.5 deg), runtime coupling at rest. Region windows are D01's absolute windows tied to
the rest joints (knee z +- 0.025/0.03 m x s, heel = foot points behind the ankle and low); the elbow window is +-0.05 m x s along
the shoulder-wrist axis (D01 used |x| 0.12..0.22 m, so ``elbow_region_dz`` differs from D01 by 0.4 mm).

Names follow kit humanoid_v1 and SKELETON_STANDARD.md: ``{S}_Foot``, ``{S}_Toe``, ``chest``, ``spine_02``, ``head``, ``ctl_root``,
``ctl_cog``, ``ctl_chest``, ``ctl_neck``, ``ctl_head``, ``ctl_spine_01`` ...; chains, targets, poles and switches come from ``ik``.
"""
from __future__ import annotations

import math
import os
import sys

if __name__ == "__main__":  # run as a script: put scripts/ on sys.path (no __pycache__ next to the sources)
    sys.dont_write_bytecode = True
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np  # noqa: E402

from rigcore import mesh as rmesh  # noqa: E402

from rigkit import bl, meshio  # noqa: E402

try:
    import bpy
    from mathutils import Matrix, Quaternion, Vector
except ImportError:  # pragma: no cover - pure-Python use
    bpy = None

AX = {"x": (1.0, 0.0, 0.0), "y": (0.0, 1.0, 0.0), "z": (0.0, 0.0, 1.0)}
D01_H = 0.5


def _r(v):
    if isinstance(v, (float, np.floating)):
        return round(float(v), 5)
    return v


# --------------------------------------------------------------------------------------------------------------------------
# pose helpers (world space, D01 d01_poses)
# --------------------------------------------------------------------------------------------------------------------------

class Poser:
    """World-space pose edits on the control armature ``ct``: ``move``, ``place``, ``rotate``, ``set_ik``, ``reset``."""

    def __init__(self, ct):
        self.ct = ct

    def reset(self):
        bl.reset_pose(self.ct)

    def set_ik(self, value=None, leg=None, arm=None):
        for k in list(self.ct.keys()):
            if not k.startswith("ik_"):
                continue
            if value is not None:
                self.ct[k] = float(value)
            if leg is not None and k.startswith("ik_leg_"):
                self.ct[k] = float(leg)
            if arm is not None and k.startswith("ik_arm_"):
                self.ct[k] = float(arm)
        bl.update()

    def move(self, name, delta):
        pb = self.ct.pose.bones[name]
        m = pb.matrix.copy()
        m.translation = m.translation + Vector(delta)
        pb.matrix = m
        bl.update()

    def place(self, name, pos):
        pb = self.ct.pose.bones[name]
        m = pb.matrix.copy()
        m.translation = Vector(pos)
        pb.matrix = m
        bl.update()

    def rotate(self, name, axis, deg, pivot=None):
        """Rotate bone ``name`` by ``deg`` about the world ``axis`` (x/y/z or a vector) through its head (or ``pivot``)."""
        pb = self.ct.pose.bones[name]
        ax = Vector(AX[axis]) if isinstance(axis, str) else Vector(axis)
        pv = Vector(pivot) if pivot is not None else pb.head.copy()
        R = Matrix.Translation(pv) @ Matrix.Rotation(math.radians(deg), 4, ax) @ Matrix.Translation(-pv)
        pb.matrix = R @ pb.matrix
        bl.update()

    def hinge(self, name):
        """World direction of the pose bone's local X (its hinge)."""
        pb = self.ct.pose.bones[name]
        return (self.ct.matrix_world.to_3x3() @ pb.matrix.to_3x3() @ Vector((1.0, 0.0, 0.0))).normalized()

    def has(self, name):
        return name in self.ct.pose.bones


def pose_library(H: float, sides=("L", "R")):
    """Extreme poses of D01 ``d01_poses.POSES`` with positions scaled by ``H / 0.5``: ``{name: fn(poser)}``. Poses that need an
    absent control (``ctl_loincloth_front``, aux bones) skip that part."""
    s = H / D01_H

    def p_rest(P):
        pass

    def p_hands_raised(P):
        P.place("ctl_L_Hand_IK", (0.10 * s, -0.075 * s, 0.50 * s))
        P.place("ctl_R_Hand_IK", (-0.10 * s, -0.075 * s, 0.50 * s))

    def p_hands_crossed(P):
        P.place("ctl_L_Hand_IK", (-0.035 * s, -0.095 * s, 0.285 * s))
        P.place("ctl_R_Hand_IK", (0.035 * s, -0.095 * s, 0.30 * s))

    def p_arms_down_fk(P):
        P.set_ik(arm=0.0)
        P.rotate("ctl_L_UpperArm", "y", 80)
        P.rotate("ctl_R_UpperArm", "y", -80)
        for sd in sides:
            P.rotate(f"ctl_{sd}_ForeArm", P.hinge(f"ctl_{sd}_ForeArm"), 25)

    def p_arms_forward_fk(P):
        P.set_ik(arm=0.0)
        P.rotate("ctl_L_UpperArm", "z", -85)
        P.rotate("ctl_R_UpperArm", "z", 85)
        for sd in sides:
            P.rotate(f"ctl_{sd}_ForeArm", P.hinge(f"ctl_{sd}_ForeArm"), 70)

    def p_elbows_max_fk(P):
        P.set_ik(arm=0.0)
        for sd in sides:
            P.rotate(f"ctl_{sd}_ForeArm", P.hinge(f"ctl_{sd}_ForeArm"), 135)

    def p_squat(P):
        P.move("ctl_cog", (0, 0, -0.075 * s))
        P.rotate("ctl_spine_01", "x", 18)

    def p_long_step(P):
        P.move("ctl_L_Foot_IK", (0.0, -0.05 * s, 0.0))
        P.move("ctl_R_Foot_IK", (0.0, 0.045 * s, 0.0))
        P.rotate("ctl_R_Toe_roll", "x", 28)
        P.move("ctl_cog", (0, -0.01 * s, -0.012 * s))

    def p_twist(sign):
        def f(P):
            for nm in ("ctl_spine_01", "ctl_spine_02", "ctl_chest"):
                P.rotate(nm, "z", 15 * sign)
        return f

    def p_head_down(P):
        P.rotate("ctl_neck", "x", 18)
        P.rotate("ctl_head", "x", 22)

    def p_head_up(P):
        P.rotate("ctl_neck", "x", -15)
        P.rotate("ctl_head", "x", -22)

    def p_head_turn(P):
        P.rotate("ctl_neck", "z", 25)
        P.rotate("ctl_head", "z", 25)

    def p_hip_flex_fk(P):
        P.set_ik(leg=0.0)
        P.rotate("ctl_L_Thigh", "x", -70)
        P.rotate("ctl_L_Calf", P.hinge("ctl_L_Calf"), 95)
        P.rotate("ctl_R_Thigh", "x", 30)
        P.rotate("ctl_R_Calf", P.hinge("ctl_R_Calf"), 25)

    def p_hip_flex_fk_loin(P):
        p_hip_flex_fk(P)
        if P.has("ctl_loincloth_front"):
            P.rotate("ctl_loincloth_front", "x", -30.0)

    def p_hip_abduct_fk(P):
        P.set_ik(leg=0.0)
        P.rotate("ctl_L_Thigh", "y", -40)
        P.rotate("ctl_R_Thigh", "y", 40)

    AUX = (("ctl_helmet", "x", 14), ("ctl_sack", "x", -10), ("ctl_loincloth_front", "x", -35), ("ctl_L_ear", "z", 25),
           ("ctl_R_ear", "z", -25))

    def p_aux_motion(P):
        for nm, ax, d in AUX:
            if P.has(nm):
                P.rotate(nm, ax, d)

    return {"rest": p_rest, "hands_raised": p_hands_raised, "hands_crossed": p_hands_crossed, "arms_down_fk": p_arms_down_fk,
            "arms_forward_fk": p_arms_forward_fk, "elbows_max_fk": p_elbows_max_fk, "squat": p_squat, "long_step": p_long_step,
            "twist_p45": p_twist(1), "twist_m45": p_twist(-1), "head_down": p_head_down, "head_up": p_head_up,
            "head_turn": p_head_turn, "hip_flex_fk": p_hip_flex_fk, "hip_flex_fk_loin": p_hip_flex_fk_loin,
            "hip_abduct_fk": p_hip_abduct_fk, "aux_motion": p_aux_motion}


# --------------------------------------------------------------------------------------------------------------------------
# measuring points
# --------------------------------------------------------------------------------------------------------------------------

class Probe:
    """Points the tests measure (see the module docstring), their rest positions ``rest`` (world, float64 (n,3)) and bone regions."""

    def __init__(self, ct, rt, skel, mesh_ob=None, mode="auto"):
        self.ct, self.rt, self.mesh, self.skel = ct, rt, mesh_ob, skel
        deform = [b["name"] for b in skel["bones"] if b["deform"]]
        groups = [g.name for g in mesh_ob.vertex_groups] if mesh_ob is not None else []
        if mode == "auto":
            mode = "mesh" if mesh_ob is not None and any(g in deform for g in groups) else "bones"
        if mode == "mesh" and mesh_ob is None:
            raise ValueError("mode 'mesh' needs a mesh")
        self.mode = mode
        if mode == "mesh":
            me = mesh_ob.data
            n = len(me.vertices)
            self.names = groups
            self.gi = {nm: i for i, nm in enumerate(groups)}
            W = np.zeros((n, len(groups)))
            for v in me.vertices:
                for g in v.groups:
                    W[v.index, g.group] = g.weight
            self.W = W
            self.rest_stored = meshio.rest_vertices(mesh_ob, world=True)
            F, _ = meshio.triangles(me)
            self.edges = rmesh.unique_edges(F)
        else:
            self.labels = []  # (bone, what)
            for b in rt.data.bones:
                self.labels += [(b.name, "head"), (b.name, "tail")]
            # floor probes, rest position = head of a foot-roll control: the heel point rides on the foot, the toe-tip point on the toe
            self.probes = []
            for sd in ("L", "R"):
                for bone, src in ((f"{sd}_Foot", f"ctl_{sd}_Heel_roll"), (f"{sd}_Toe", f"ctl_{sd}_Toe_roll")):
                    if bone in rt.data.bones and src in ct.data.bones:
                        self.probes.append((bone, src))
            self.labels += [(bone, "probe:" + src) for bone, src in self.probes]
            mw = rt.matrix_world
            pts = []
            for bone, what in self.labels:
                b = rt.data.bones[bone]
                if what == "head":
                    pts.append(mw @ b.head_local)
                elif what == "tail":
                    pts.append(mw @ b.tail_local)
                else:
                    pts.append(ct.matrix_world @ ct.data.bones[what[6:]].head_local)
            self.probe_rest_local = [rt.matrix_world.inverted() @ p for p in pts]
            self.rest_stored = np.array([list(p) for p in pts], dtype=np.float64)
            self.edges = None
        self.rest = self.rest_stored.copy()

    def positions(self) -> np.ndarray:
        if self.mode == "mesh":
            return meshio.evaluated_vertices(self.mesh, world=True).astype(np.float64)
        mw = self.rt.matrix_world
        out = []
        for i, (bone, what) in enumerate(self.labels):
            pb = self.rt.pose.bones[bone]
            if what == "head":
                out.append(mw @ pb.head)
            elif what == "tail":
                out.append(mw @ pb.tail)
            else:
                M = pb.matrix @ self.rt.data.bones[bone].matrix_local.inverted()
                out.append(mw @ (M @ self.probe_rest_local[i]))
        return np.array([list(p) for p in out], dtype=np.float64)

    def bone(self, name, thr: float = 0.5) -> np.ndarray:
        if self.mode == "mesh":
            if name not in self.gi:
                return np.zeros(len(self.rest), dtype=bool)
            return self.W[:, self.gi[name]] > thr
        return np.array([b == name for b, _ in self.labels])

    def point(self, name, what="head") -> np.ndarray:
        """Mask of the head / tail point of bone ``name`` (bones mode; in mesh mode: the vertex nearest to it)."""
        b = self.rt.data.bones[name]
        p = np.array(self.rt.matrix_world @ (b.head_local if what == "head" else b.tail_local))
        m = np.zeros(len(self.rest), dtype=bool)
        m[int(np.argmin(np.linalg.norm(self.rest - p, axis=1)))] = True
        return m


# --------------------------------------------------------------------------------------------------------------------------
# helpers
# --------------------------------------------------------------------------------------------------------------------------

def _ik_by_kind(skel):
    arms = {ik["side"]: ik for ik in skel.get("ik", []) if not ik.get("foot_roll")}
    legs = {ik["side"]: ik for ik in skel.get("ik", []) if ik.get("foot_roll")}
    return arms, legs


def _rest_bone(rt, name):
    b = rt.data.bones[name]
    mw = rt.matrix_world
    return np.array(mw @ b.head_local), np.array(mw @ b.tail_local)


def _axial(P, a, b):
    """Coordinate of every rest point along a -> b (0 at a, 1 at b)."""
    d = b - a
    return (P - a) @ d / float(d @ d)


def _local_rot(arm_ob, name):
    """Pose rotation of bone ``name`` relative to its parent, in its own rest frame (quaternion)."""
    pb = arm_ob.pose.bones[name]
    b = arm_ob.data.bones[name]
    if b.parent is None:
        return (b.matrix_local.inverted() @ pb.matrix).to_quaternion()
    rest_rel = b.parent.matrix_local.inverted() @ b.matrix_local
    pose_rel = pb.parent.matrix.inverted() @ pb.matrix
    return (rest_rel.inverted() @ pose_rel).to_quaternion()


def _twist_deg(q, axis="Y"):
    """Signed rotation of quaternion ``q`` about its local ``axis`` (swing-twist), degrees; and the swing angle."""
    i = "XYZ".index(axis)
    comp = (q.x, q.y, q.z)[i]
    tw = 2.0 * math.degrees(math.atan2(comp, q.w))
    tw = (tw + 180.0) % 360.0 - 180.0
    qt = Quaternion((q.w, *[comp if k == i else 0.0 for k in range(3)])).normalized()
    swing = (qt.inverted() @ q).angle
    return tw, math.degrees(swing)


#: twist test poses of the driver bone: rotations about its rest-frame axes, applied in order (the first one first). "twist" is
#: about the bone axis Y; for the hand X = wrist flexion, Z = deviation; for the upper arm X = horizontal flexion, Z = abduction.
TWIST_CASES = (
    ("twist60", (("y", 60.0),)),
    ("twist60_flex60", (("y", 60.0), ("x", 60.0))),
    ("twist80_flex60_dev30", (("y", 80.0), ("x", 60.0), ("z", 30.0))),
    ("flexm60_devm30_twistm80", (("x", -60.0), ("z", -30.0), ("y", -80.0))),
)


def twist_case_quaternion(steps):
    """Quaternion of ``steps`` ((axis, degrees), ...) applied in order about the bone's rest axes: ``R_last @ ... @ R_first``."""
    q = Quaternion()
    for ax, d in steps:
        q = Quaternion(AX[ax], math.radians(d)) @ q
    return q


def twist_tests(P, ct, rt, skel, arms) -> list:
    """Twist bones: for every ``twist`` entry and every ``TWIST_CASES`` pose of the driver, the twist bone's local rotation must be a
    pure turn about ``axis`` equal to ``factor`` x the swing-twist twist of the pose (0.5 deg). FK poses ``ctl_<driver>`` (IK off);
    for a hand-driven twist bone the same poses are also given to the hand IK target (IK on; the hand copies its rotation). Also
    checks that the driver bone really took the pose (its measured twist equals the analytic one within 0.05 deg). The pure 60 deg
    twist keeps the round-1 ids ``twist_fk_<bone>`` / ``twist_ik_<bone>`` (with the net turn of the twist bone)."""
    rows = []
    for b in skel["bones"]:
        tw = b.get("twist")
        if not tw:
            continue
        drv, f, ax = tw["driver"], float(tw["factor"]), tw["axis"]
        ik_target = next((ik["target"] for ik in arms.values() if drv.endswith("Hand") and ik["side"] == b.get("side")), None)
        for variant, ctl_name in (("fk", "ctl_" + drv), ("ik", ik_target)):
            if ctl_name is None:
                continue
            for case, steps in TWIST_CASES:
                q = twist_case_quaternion(steps)
                q_tw, q_sw = _twist_deg(q, ax)
                P.set_ik(1.0 if variant == "ik" else 0.0)
                P.reset()
                pb = ct.pose.bones[ctl_name]
                pb.rotation_mode = "QUATERNION"
                pb.rotation_quaternion = q
                bl.update()
                d_tw, d_sw = _twist_deg(_local_rot(rt, drv), ax)
                t_tw, t_sw = _twist_deg(_local_rot(rt, b["name"]), ax)
                want = f * q_tw
                err = (t_tw - want + 180.0) % 360.0 - 180.0
                d_err = (d_tw - q_tw + 180.0) % 360.0 - 180.0
                kw = {"pose": [[a_, d_] for a_, d_ in steps], "pose_twist_deg": q_tw, "pose_swing_deg": q_sw, "driver_twist_deg": d_tw,
                      "driver_swing_deg": d_sw, "twist_local_deg": t_tw, "expected_deg": want, "error_deg": err, "twist_swing_deg": t_sw}
                if case == "twist60":
                    tid = f"twist_{variant}_{b['name']}"
                    net = (rt.data.bones[b["name"]].matrix_local.inverted() @ rt.pose.bones[b["name"]].matrix).to_quaternion()
                    kw["twist_net_deg"] = _twist_deg(net, ax)[0]
                else:
                    tid = f"twist_{variant}_{case}_{b['name']}"
                rows.append({"id": tid, "test": f"{ctl_name} {case} -> {b['name']} turns {f:+.2f} x the swing-twist twist about {ax}",
                             "pass": bool(abs(d_err) < 0.05 and abs(err) < 0.5 and t_sw < 0.5), **{k: _r(v) for k, v in kw.items()}})
    return rows


# --------------------------------------------------------------------------------------------------------------------------
# the run
# --------------------------------------------------------------------------------------------------------------------------

def run(ct, rt, skel, mesh_ob=None, mode="auto", region_bones=None) -> dict:
    """Function tests of the control rig ``ct`` driving the runtime ``rt`` (built from ``skel``). ``region_bones`` (default
    ``skel["skin"]["region_bones"]``) = ``{aux bone: allowed bones}`` for the region-limited tests. Leaves the rig at rest with IK on.
    Returns the report (``tests``, ``passed``, ``total``, ``extra_tests``, ``pose_extremes``, ``socket_follow_parent``, ...)."""
    H = float(skel["H"])
    s = H / D01_H
    P = Poser(ct)
    pr = Probe(ct, rt, skel, mesh_ob, mode)
    arms, legs = _ik_by_kind(skel)
    rest = pr.rest
    rep = {"mode": pr.mode, "H": H, "scale_vs_d01": s, "points": int(len(rest))}
    P.set_ik(1.0)
    P.reset()
    base = pr.positions()
    rep["rest_eval_vs_stored_max_m"] = float(np.abs(base - pr.rest_stored).max())
    tests, extra = [], []

    def record(lst, tid, name, passed, **kw):
        lst.append({"id": tid, "test": name, "pass": bool(passed), **{k: _r(v) for k, v in kw.items()}})

    def run_pose(fn):
        P.set_ik(1.0)
        P.reset()
        fn()
        bl.update()
        return pr.positions()

    def disp(p, m):
        return (p[m] - base[m]).mean(0) if m.any() else np.zeros(3)

    def dmax(p, m, ref=None):
        ref = base if ref is None else ref
        return float(np.abs(p[m] - ref[m]).max()) if m.any() else 0.0

    G = pr.bone
    other = {"L": "R", "R": "L"}
    sgn = {"L": 1.0, "R": -1.0}
    tol_small = 1e-4 * s

    # 1-2 foot IK
    for sd in ("L", "R"):
        if sd not in legs:
            continue
        fik = legs[sd]["foot_roll"][0]
        mv = (0.0, -0.03 * s, 0.02 * s)
        p = run_pose(lambda: P.move(fik, mv))
        foot = G(f"{sd}_Foot") | G(f"{sd}_Toe")
        o = other[sd]
        d_foot = disp(p, foot)
        d_other = dmax(p, G(f"{o}_Foot") | G(f"{o}_Toe"))
        d_torso = dmax(p, G("chest") | G("spine_02"))
        record(tests, f"foot_ik_move_{sd}", f"{sd} foot IK move {tuple(round(c, 5) for c in mv)}",
               np.allclose(d_foot, mv, atol=0.004 * s) and d_other < tol_small and d_torso < tol_small,
               moved_mean=[float(x) for x in d_foot], other_foot_max=d_other, torso_max=d_torso)
    # 3-4 hand IK
    for sd in ("L", "R"):
        if sd not in arms:
            continue
        mv = (-0.05 * s * sgn[sd], -0.05 * s, 0.03 * s)
        p = run_pose(lambda: P.move(arms[sd]["target"], mv))
        d_hand = disp(p, G(f"{sd}_Hand"))
        d_other = dmax(p, G(f"{other[sd]}_Hand"))
        d_leg = dmax(p, G(f"{sd}_Foot"))
        record(tests, f"hand_ik_move_{sd}", f"{sd} hand IK move {tuple(round(c, 5) for c in mv)}",
               np.allclose(d_hand, mv, atol=0.004 * s) and d_other < tol_small and d_leg < tol_small,
               moved_mean=[float(x) for x in d_hand], other_hand_max=d_other, leg_max=d_leg)
    # 5-8 poles (bent limbs)
    for sd in ("L", "R"):
        if sd in legs:
            lg = legs[sd]
            fik = lg["foot_roll"][0]
            p0 = run_pose(lambda: P.move(fik, (0.0, -0.03 * s, 0.035 * s)))

            def bent_knee():
                P.move(fik, (0.0, -0.03 * s, 0.035 * s))
                P.move(lg["pole"], (0.06 * s * sgn[sd], 0.0, 0.0))

            p1 = run_pose(bent_knee)
            kz = _rest_bone(rt, lg["chain"][-1])[0][2]
            kmask = (G(lg["chain"][-1]) | G(lg["chain"][0])) & (rest[:, 2] > kz - 0.025 * s) & (rest[:, 2] < kz + 0.03 * s)
            dk = (p1[kmask] - p0[kmask]).mean(0) if kmask.any() else np.zeros(3)
            sole = G(f"{sd}_Foot") & (rest[:, 2] < 0.015 * s)
            d_sole = dmax(p1, sole, p0)
            record(tests, f"knee_pole_{sd}", f"{sd} knee pole outward {round(0.06 * s, 4)} m (knee bent)",
                   dk[0] * sgn[sd] > 0.004 * s and d_sole < 0.002 * s and kmask.any(),
                   knee_region_dx_toward_pole=float(dk[0] * sgn[sd]), sole_max=d_sole, region_points=int(kmask.sum()))
        if sd in arms:
            am = arms[sd]
            mv = (-0.06 * s * sgn[sd], -0.04 * s, 0.0)
            p0 = run_pose(lambda: P.move(am["target"], mv))

            def bent_elbow():
                P.move(am["target"], mv)
                P.move(am["pole"], (0.0, 0.0, 0.08 * s))

            p1 = run_pose(bent_elbow)
            sh = _rest_bone(rt, am["chain"][0])[0]
            el, wr = _rest_bone(rt, am["chain"][-1])
            t = _axial(rest, sh, wr)
            te = float(_axial(el[None, :], sh, wr)[0])
            span = 0.05 * s / float(np.linalg.norm(wr - sh))
            emask = (G(am["chain"][-1]) | G(am["chain"][0])) & (np.abs(t - te) < span)
            de = (p1[emask] - p0[emask]).mean(0) if emask.any() else np.zeros(3)
            hand = next(b["name"] for b in skel["bones"] if b["parent"] == am["chain"][-1] and b["kind"] == "core")
            hh, ht = _rest_bone(rt, hand)
            hmask = G(hand) & (_axial(rest, hh, ht) > 0.32)
            d_hand = dmax(p1, hmask, p0)
            record(tests, f"elbow_pole_{sd}", f"{sd} elbow pole up {round(0.08 * s, 4)} m (elbow bent)",
                   de[2] > 0.004 * s and d_hand < 0.002 * s and emask.any(),
                   elbow_region_dz=float(de[2]), hand_max=d_hand, region_points=int(emask.sum()))

    # 9-11 foot roll (L in the D01 set, R in the extras)
    def foot_roll_tests(sd, lst):
        lg = legs[sd]
        fik, toe_roll, heel_roll, ball_roll = lg["foot_roll"]
        foot, toe = f"{sd}_Foot", f"{sd}_Toe"
        ankle_y = _rest_bone(rt, foot)[0][1]
        toe_m = G(toe)
        heel_m = G(foot) & (rest[:, 1] > ankle_y + 0.005 * s) & (rest[:, 2] < 0.03 * s)
        p = run_pose(lambda: P.rotate(heel_roll, "x", -25))
        record(lst, f"heel_roll_{sd}", f"{sd} heel_roll (lift toes, pivot heel)",
               disp(p, toe_m)[2] > 0.008 * s and abs(disp(p, heel_m)[2]) < 0.004 * s and heel_m.any(),
               toe_dz=float(disp(p, toe_m)[2]), heel_dz=float(disp(p, heel_m)[2]))
        p = run_pose(lambda: P.rotate(toe_roll, "x", 25))
        record(lst, f"toe_roll_{sd}", f"{sd} toe_roll (lift heel, pivot toe tip)",
               disp(p, heel_m)[2] > 0.008 * s and abs(disp(p, toe_m)[2]) < 0.006 * s,
               heel_dz=float(disp(p, heel_m)[2]), toe_dz=float(disp(p, toe_m)[2]))
        p = run_pose(lambda: P.rotate(ball_roll, "x", 25))
        record(lst, f"ball_roll_{sd}", f"{sd} ball_roll (lift heel, toes flat)",
               disp(p, heel_m)[2] > 0.006 * s and abs(disp(p, toe_m)[2]) < 0.004 * s,
               heel_dz=float(disp(p, heel_m)[2]), toe_dz=float(disp(p, toe_m)[2]))

    if "L" in legs:
        foot_roll_tests("L", tests)
    # 12 root
    mv = (0.05 * s, 0.02 * s, 0.0)
    p = run_pose(lambda: P.move("ctl_root", mv))
    dd = p - base
    record(tests, "root_move", f"root move {tuple(round(c, 5) for c in mv)}: the whole model follows",
           np.allclose(dd, mv, atol=1e-5 * s), max_dev=float(np.abs(dd - np.array(mv)).max()))
    # 13 cog
    p = run_pose(lambda: P.move("ctl_cog", (0, 0, -0.03 * s)))
    feet = (G("L_Foot") | G("R_Foot") | G("L_Toe") | G("R_Toe")) & (rest[:, 2] < 0.015 * s)
    record(tests, "cog_down", f"cog down {round(0.03 * s, 4)} m: body lowers, soles stay (IK)",
           disp(p, G("chest"))[2] < -0.025 * s and dmax(p, feet) < 3e-3 * s,
           chest_dz=float(disp(p, G("chest"))[2]), sole_max=dmax(p, feet))
    # 14 chest. "Follows" = D01's 10 mm x s, or half of what a point fixed to the chest would move (rigid 20 deg turn of the rest
    # head points about the world Z axis through the chest head): an upright head sits near that axis, so D01's number (a
    # forward-jutting head) fails a head that follows (I3, P3 integration: FL bones mode moved 25.6 mm against 36 mm)
    p = run_pose(lambda: P.rotate("ctl_chest", "z", 20))
    hp = G("head")
    c0 = _rest_bone(rt, "chest")[0]
    ca, sa = math.cos(math.radians(20.0)), math.sin(math.radians(20.0))
    q = base[hp] - c0
    rq = np.stack([ca * q[:, 0] - sa * q[:, 1], sa * q[:, 0] + ca * q[:, 1], q[:, 2]], axis=1)
    expected = float(np.abs(rq - q).max()) if hp.any() else 0.0
    head_thr = min(0.01 * s, 0.5 * expected)
    record(tests, "chest_rotate", "chest rotate 20 deg: head/arms follow, legs do not",
           dmax(p, hp) > head_thr and head_thr > 1e-4 * s and dmax(p, G("L_Calf")) < 1e-5 * s, head_max=dmax(p, hp),
           head_expected_rigid=expected, head_threshold=head_thr, leg_max=dmax(p, G("L_Calf")))
    # 15 head (+ its aux children: helmet / ears)
    aux_kids = [b["name"] for b in skel["bones"] if b["parent"] == "head" and b["kind"] == "aux"]
    head_reg = np.zeros(len(rest), dtype=bool)
    for nm in (aux_kids[:1] or ["head"]):
        head_reg |= G(nm)
    chest_z = _rest_bone(rt, "chest")[0][2]
    chest_low = G("chest") & (rest[:, 2] < chest_z - 0.005 * s)
    if not chest_low.any():
        chest_low = pr.point("chest", "head")
    p = run_pose(lambda: P.rotate("ctl_head", "z", 30))
    record(tests, "head_rotate", f"head rotate 30 deg: {(aux_kids[:1] or ['head'])[0]} follows, chest still",
           dmax(p, head_reg) > 0.01 * s and dmax(p, chest_low) < 1e-5 * s, head_region_max=dmax(p, head_reg),
           chest_max=dmax(p, chest_low))
    # 16-19 region-limited aux parts (D01: the sack) - weights only, mesh mode
    poses = pose_library(H)
    regions = region_bones if region_bones is not None else (skel.get("skin") or {}).get("region_bones") or {}
    if pr.mode == "mesh":
        for aux, allowed in regions.items():
            if aux not in pr.gi:
                continue
            reg = pr.W[:, pr.gi[aux]] > 0.0
            allowed_idx = [pr.gi[a] for a in allowed if a in pr.gi]
            mask = np.ones(len(pr.names), dtype=bool)
            mask[allowed_idx] = False
            off = pr.W[reg][:, mask].sum(1) if reg.any() else np.zeros(1)
            record(tests, f"region_static_{aux}", f"{aux} region weights only {'/'.join(allowed)}", float(off.max()) < 1e-9,
                   max_outside=float(off.max()), region_vertices=int(reg.sum()))
            if "head" in allowed or "neck" in allowed:
                continue
            for pn in ("head_turn", "head_up", "head_down"):
                pe = run_pose(lambda: poses[pn](P))
                mm = float(np.linalg.norm(pe[reg] - base[reg], axis=1).max() * 1000.0)
                still = dmax(pe, chest_low) < 1e-5 * s
                record(tests, f"region_still_{pn}_{aux}", f"{pn}: {aux} region stays still (chest fixed)",
                       mm < 3.0 * s and still, region_max_mm=mm, chest_still=bool(still))
    # 20 leg IK -> FK
    if "L" in legs:
        def fk_leg():
            P.set_ik(leg=0.0)
            P.rotate(f"ctl_{legs['L']['chain'][0]}", "x", -40)
        p = run_pose(fk_leg)
        record(tests, "fk_switch_leg_L", "IK off (leg L) + FK thigh -40 deg: the left foot follows FK",
               disp(p, G("L_Foot"))[1] < -0.03 * s and dmax(p, G("R_Foot")) < 1e-5 * s,
               foot_dy=float(disp(p, G("L_Foot"))[1]), other_foot_max=dmax(p, G("R_Foot")))

    # ---------------------------------------------------------------- extras
    if "R" in legs:
        foot_roll_tests("R", extra)
    for sd in ("L", "R"):
        if sd in arms:
            def fk_arm():
                P.set_ik(arm=0.0)
                P.rotate(f"ctl_{arms[sd]['chain'][0]}", "y", 40 * sgn[sd])
            p = run_pose(fk_arm)
            record(extra, f"fk_switch_arm_{sd}", f"IK off (arm {sd}) + FK upper arm: the hand follows FK, the other hand stays",
                   float(np.linalg.norm(disp(p, G(f"{sd}_Hand")))) > 0.03 * s and dmax(p, G(f"{other[sd]}_Hand")) < 1e-5 * s,
                   hand_move=float(np.linalg.norm(disp(p, G(f"{sd}_Hand")))), other_hand_max=dmax(p, G(f"{other[sd]}_Hand")))
        cl = f"{sd}_Clavicle"
        if cl in rt.data.bones and P.has("ctl_" + cl):
            def raise_cl():
                pb = ct.pose.bones["ctl_" + cl]
                pb.rotation_quaternion = Quaternion((1.0, 0.0, 0.0), math.radians(20))
                bl.update()
            P.set_ik(1.0)
            P.reset()
            sh0 = np.array(rt.matrix_world @ rt.pose.bones[cl].tail)
            raise_cl()
            sh1 = np.array(rt.matrix_world @ rt.pose.bones[cl].tail)
            ua = np.array(rt.matrix_world @ rt.pose.bones[f"{sd}_UpperArm"].head)
            record(extra, f"clavicle_raise_{sd}", f"ctl_{cl} +20 deg about local X: the shoulder rises, the arm follows",
                   (sh1 - sh0)[2] > 0 and float(np.linalg.norm(ua - sh1)) < 1e-5 * s,
                   shoulder_dz=float((sh1 - sh0)[2]), upperarm_head_vs_clavicle_tail=float(np.linalg.norm(ua - sh1)))
    extra.extend(twist_tests(P, ct, rt, skel, arms))
    P.set_ik(1.0)
    P.reset()
    bl.update()
    cpl = max(float(max(abs(a - c) for ra, rc in zip(pb_.matrix, rt.data.bones[pb_.name].matrix_local) for a, c in zip(ra, rc)))
              for pb_ in rt.pose.bones)
    record(extra, "coupling_rest", "runtime at rest equals its rest pose (IK on)", cpl < 1e-4, max_matrix_diff=cpl)

    rep["tests"] = tests
    rep["passed"] = sum(t["pass"] for t in tests)
    rep["total"] = len(tests)
    rep["extra_tests"] = extra
    rep["extra_passed"] = sum(t["pass"] for t in extra)
    rep["extra_total"] = len(extra)

    # ---------------------------------------------------------------- pose extremes
    sole = {sd: G(f"{sd}_Foot") | G(f"{sd}_Toe") for sd in ("L", "R")}
    ext = {}
    L0 = None
    if pr.edges is not None:
        E = pr.edges
        L0 = np.linalg.norm(base[E[:, 0]] - base[E[:, 1]], axis=1)
    for nm, fn in poses.items():
        pe = run_pose(lambda: fn(P))
        mats_ok, worst_scale, worst_det = True, 0.0, 0.0
        for arm in (ct, rt):
            for pbb in arm.pose.bones:
                m = np.array(pbb.matrix)
                if not np.isfinite(m).all():
                    mats_ok = False
                    continue
                sc = np.linalg.norm(m[:3, :3], axis=0)
                worst_scale = max(worst_scale, float(np.abs(sc - 1).max()))
                worst_det = max(worst_det, abs(float(np.linalg.det(m[:3, :3])) - 1.0))
        e = {"points_finite": bool(np.isfinite(pe).all()), "bone_matrices_finite": mats_ok, "max_bone_scale_dev": worst_scale,
             "max_bone_det_dev": worst_det, "max_point_move_m": float(np.linalg.norm(pe - base, axis=1).max()),
             "bbox_min": [float(x) for x in pe.min(0)], "bbox_max": [float(x) for x in pe.max(0)]}
        for sd in ("L", "R"):
            if sole[sd].any():
                e[f"sole_min_z_{sd}_mm"] = float(pe[sole[sd]][:, 2].min() * 1000)
        if L0 is not None:
            L1 = np.linalg.norm(pe[E[:, 0]] - pe[E[:, 1]], axis=1)
            g = (L1 - L0)[L0 > 1e-5]
            e["max_edge_growth_mm"] = float(g.max() * 1000)
            e["p99_edge_growth_mm"] = float(np.percentile(g, 99) * 1000)
        ext[nm] = e
    rep["pose_extremes"] = ext
    rep["pose_extremes_all_finite"] = all(v["points_finite"] and v["bone_matrices_finite"] and v["max_bone_scale_dev"] < 1e-3
                                          and v["max_bone_det_dev"] < 1e-3 for v in ext.values())

    # ---------------------------------------------------------------- sockets follow their parents
    socks = [b for b in skel["bones"] if b["kind"] == "socket" and b["parent"] not in (None, "root")]
    rows = {}
    refs = {}
    for nm, fn in poses.items():
        run_pose(lambda: fn(P))
        for b in socks:
            rel = np.array(rt.pose.bones[b["parent"]].matrix.inverted() @ rt.pose.bones[b["name"]].matrix)
            if b["name"] not in refs:
                refs[b["name"]] = rel
                rows[b["name"]] = {"parent_bone": b["parent"], "max_local_matrix_diff": 0.0}
            rows[b["name"]]["max_local_matrix_diff"] = max(rows[b["name"]]["max_local_matrix_diff"],
                                                           float(np.abs(rel - refs[b["name"]]).max()))
    P.set_ik(1.0)
    P.reset()
    rep["socket_follow_parent"] = rows
    rep["socket_follow_all_ok"] = all(v["max_local_matrix_diff"] < 1e-4 for v in rows.values())
    axes = {}
    for b in socks:
        if "weapon" in b["name"]:
            m = rt.pose.bones[b["name"]].matrix.to_3x3()
            axes[b["name"]] = {"Y_axis_world": [round(float(v), 4) for v in (m @ Vector((0, 1, 0)))],
                               "Z_axis_world": [round(float(v), 4) for v in (m @ Vector((0, 0, 1)))],
                               "head_world": [round(float(v), 4) for v in rt.pose.bones[b["name"]].head]}
    rep["weapon_socket_axes_rest"] = axes
    if mesh_ob is not None:
        from rigkit import skeleton

        rep["joints_inside_mesh"] = {k: v for k, v in skeleton.heads_inside(rt, mesh_ob).items() if k not in ("root", "cog", "ground")}
    bl.update()
    return rep


def open_state(ct, rt, mesh_ob) -> dict:
    """State of a freshly opened rig file (D01 ``open_state``): actions, identity pose, IK switches, objects, selection, units."""
    sc = bpy.context.scene
    state = {
        "actions": [a.name for a in bpy.data.actions],
        "pose_bones_identity": all(abs(pb.matrix_basis[i][j] - (1.0 if i == j else 0.0)) < 1e-9 for arm in (ct, rt) for pb in arm.pose.bones
                                   for i in range(4) for j in range(4)),
        "ik_props": {k: float(ct[k]) for k in ct.keys() if k.startswith("ik_")},
        "objects": {o.name: {"type": o.type, "hidden": o.hide_get(), "parent": o.parent.name if o.parent else None,
                             "loc": list(o.location), "rot": list(o.rotation_euler), "scale": list(o.scale)} for o in bpy.data.objects},
        "active_object": bpy.context.view_layer.objects.active.name if bpy.context.view_layer.objects.active else None,
        "selected": [o.name for o in bpy.data.objects if o.select_get()],
        "scene": {"fps": sc.render.fps, "frame_start": sc.frame_start, "frame_end": sc.frame_end, "unit_system": sc.unit_settings.system,
                  "unit_scale": sc.unit_settings.scale_length},
        "images_packed": {i.name: bool(i.packed_file) for i in bpy.data.images},
        "modifiers": [(m.type, m.object.name if getattr(m, "object", None) else None) for m in mesh_ob.modifiers] if mesh_ob else [],
        "mesh_vertex_groups": len(mesh_ob.vertex_groups) if mesh_ob else 0,
    }
    return state


def main(argv=None) -> int:
    """``blender -b --factory-startup -P rigkit/functest.py -- --blend <rig>.blend [--skeleton skeleton.json] [--mode auto]
    [--out rig_function.json]``: opens the saved rig (as D01 v2 did), records the open state, runs the tests. Exit 0 when every test
    passes and the extremes are clean."""
    import argparse

    from rigcore import npzio, template

    ap = argparse.ArgumentParser(description="S5 function tests on a saved rig .blend")
    ap.add_argument("--blend", required=True)
    ap.add_argument("--skeleton", default=None, help="default: skeleton.json next to the .blend")
    ap.add_argument("--asset-id", default=None)
    ap.add_argument("--mode", default="auto", choices=("auto", "mesh", "bones"))
    ap.add_argument("--out", default=None, help="default: checks/rig_function.json next to the .blend")
    a = ap.parse_args(bl.script_args() if argv is None else argv)
    d = os.path.dirname(os.path.abspath(a.blend))
    bl.open_file(a.blend)
    asset = a.asset_id or bl.scene_value("rigkit_asset_id")
    ct, rt = bl.find("control", asset), bl.find("runtime", asset)
    me = bl.find("mesh", asset, required=False)
    skel = template.load_skeleton(a.skeleton or os.path.join(d, "skeleton.json"))
    state = open_state(ct, rt, me)
    rep = run(ct, rt, skel, me, mode=a.mode)
    rep["open_state"] = state
    rep["blend"] = os.path.abspath(a.blend)
    out = npzio.write_json(a.out or os.path.join(d, "checks", "rig_function.json"), rep)
    ok = rep["passed"] == rep["total"] and rep["extra_passed"] == rep["extra_total"] and rep["pose_extremes_all_finite"]
    rpath = os.path.join(d, "rig_recipe.json")
    if os.path.exists(rpath):
        from rigcore import recipe

        rec = bl.open_recipe(rpath, asset)
        recipe.log_step(rec, "S5.functest", {"mode": rep["mode"]}, {"file": out, "passed": rep["passed"], "total": rep["total"],
                                                                   "extra_passed": rep["extra_passed"], "extra_total": rep["extra_total"], "ok": ok})
        recipe.save_recipe(rpath, rec)
    print(bl.json_line({"step": "S5.functest", "ok": ok, "mode": rep["mode"], "tests": f"{rep['passed']}/{rep['total']}",
                        "extra": f"{rep['extra_passed']}/{rep['extra_total']}", "out": out}))
    return 0 if ok else 1


if __name__ == "__main__":
    bl.run_main(main)
