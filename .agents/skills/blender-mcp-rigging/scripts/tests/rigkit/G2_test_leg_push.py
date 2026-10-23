r"""Owner G2 (Blender): leg-push drivers (references/cloth-and-attachments.md §4) on a synthetic rig and on FL.

Synthetic rig: root, pelvis, thighs and calves (thigh local X = +X world, + = hip extension, as family H) and a four-chain skirt
ring (skirt_F, skirt_B, L_skirt_S, R_skirt_S; 3 bones each), merged with ``rigkit.skeleton.merge_chains_any``, built with
``skeleton.build_runtime`` + ``control.build_control`` (FK only) + ``control.add_chain_controls``. Checks:
  * both thighs flexed 90 deg (local X -90) -> skirt_F root pushed 60 deg (clamp), skirt_B 0;
  * left hip abduction 45 deg (knee outward) -> L_skirt_S 0.85 x 45 = 38.25 deg within 1 deg, R_skirt_S 0;
  * the runtime chain roots follow (Copy Transforms): their rotation from rest equals the push angle, tails move outward;
  * the driver matches the pure-Python ``leg_push_value`` and is a simple expression.
FL (``--fl-blend``, the fixture rig after S5 with ``--chains``; skipped when missing): the same poses through
``rigkit.poses.emulation`` + ``PoseContext`` (FK thigh rotations on the control rig, runtime emulation copy): pushes of tail_F /
tail_B / L_tail_S / R_tail_S and the runtime roots' rotations.

Run:  blender -b --factory-startup -P tests/rigkit/G2_test_leg_push.py -- [--fl-blend E:\tmp_rigkit\G2\fl\FL_flagellant_vA_rig.blend]
          [--out E:\tmp_rigkit\G2\leg_push]
Prints one JSON line; exit 1 on failure.
"""
import argparse
import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPTS = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, SCRIPTS)
sys.dont_write_bytecode = True

import bpy  # noqa: E402
from mathutils import Matrix, Vector  # noqa: E402

from rigcore import geom  # noqa: E402
from rigkit import bl, control, skeleton  # noqa: E402

TOL_DEG = 1.0


def _bone(name, parent, head, tail, hinge, kind="core", side=None, bend_test=None):
    return {"name": name, "parent": parent, "side": side, "kind": kind, "deform": name != "root", "head": list(head),
            "tail": list(tail), "hinge": list(geom.unit(hinge)), "bend_test": bend_test, "twist": None}


def synthetic_skeleton():
    bones = [_bone("root", None, (0, 0, 0), (0, 0, 0.1), (1, 0, 0)),
             _bone("pelvis", "root", (0, 0, 1.0), (0, 0, 1.1), (1, 0, 0))]
    for s, x in (("L", 0.1), ("R", -0.1)):
        bones.append(_bone(f"{s}_Thigh", "pelvis", (x, 0, 0.95), (x, -0.01, 0.5), (1, 0, 0), side=s,
                           bend_test="knee goes back (+Y): hip extension"))
        bones.append(_bone(f"{s}_Calf", f"{s}_Thigh", (x, -0.01, 0.5), (x, 0, 0.08), (1, 0, 0), side=s,
                           bend_test="knee flexes, foot goes back (+Y)"))
    skel = {"schema": 0, "family": "G2_synthetic", "template_version": "test", "H": 1.8, "bones": bones, "ik": [], "rom": [],
            "rom_compound": [], "skin": {}, "builder": {}}
    chains = []
    for cid, phi, side in (("skirt_F", 0.0, None), ("skirt_B", 180.0, None), ("L_skirt_S", 90.0, "L"), ("R_skirt_S", -90.0, "R")):
        a = math.radians(phi)
        out = (math.sin(a), -math.cos(a), 0.0)
        r0, r1 = 0.17, 0.26
        pts = [(out[0] * (r0 + (r1 - r0) * k / 3), out[1] * (r0 + (r1 - r0) * k / 3), 1.0 - 0.22 * k) for k in range(4)]
        bl_ = []
        for k in range(3):
            y = geom.unit(geom.sub(pts[k + 1], pts[k]))
            hinge = geom.unit(geom.cross(y, out))
            bl_.append({"name": f"{cid}_{k + 1:02d}", "parent": "pelvis" if k == 0 else bl_[-1]["name"], "head": list(pts[k]),
                        "tail": list(pts[k + 1]), "hinge": list(hinge)})
        sn = math.sin(a)
        chains.append({"id": cid, "piece": "auto:0", "class": "skirt", "side": side, "parent": "pelvis", "panel": 0,
                       "azimuth_deg": phi, "fan_root": None, "bones": bl_,
                       "leg_push": {"enabled": True, "w_L": 0.5 + 0.35 * sn, "w_R": 0.5 - 0.35 * sn, "dir": list(out),
                                    "max_deg": 60.0}})
    return skel, {"schema": 0, "asset_id": "G2_synthetic", "H": 1.8, "chains": chains, "colliders": [], "budget": {}}


def world_rot(arm, bone, axis, deg):
    pb = arm.pose.bones[bone]
    pv = pb.head.copy()
    R = Matrix.Translation(pv) @ Matrix.Rotation(math.radians(deg), 4, Vector(axis)) @ Matrix.Translation(-pv)
    pb.matrix = R @ pb.matrix
    bl.update()


def local_rot(arm, bone, axis, deg):
    from mathutils import Quaternion

    pb = arm.pose.bones[bone]
    pb.rotation_mode = "QUATERNION"
    pb.rotation_quaternion = Quaternion(Vector(axis), math.radians(deg)) @ pb.rotation_quaternion
    bl.update()


def push_deg(ct, root):
    return math.degrees(ct.pose.bones[control.ctl(root) + control.PUSH_SUFFIX].rotation_euler[0])


def runtime_turn(rt, root):
    """(angle deg of the runtime root's pose vs rest, cos of its tail motion with its rest local Z = outward)."""
    pb = rt.pose.bones[root]
    rest = rt.data.bones[root].matrix_local
    ang = math.degrees(pb.matrix.to_quaternion().rotation_difference(rest.to_quaternion()).angle)
    d = pb.tail - rt.data.bones[root].tail_local
    z = rest.to_3x3() @ Vector((0, 0, 1))
    return ang, (float(d.normalized().dot(z)) if d.length > 1e-9 else None)


def synthetic(fails):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    skel0, chains = synthetic_skeleton()
    skel, src = skeleton.merge_chains_any(skel0, chains)
    rt, rep = skeleton.build_runtime(skel, "SYN_runtime")
    skel = skeleton.apply_flips(skel, rep["flipped"])
    ct, crep = control.build_control(rt, skel, {}, "SYN_control", sweep=False)
    cc = control.add_chain_controls(ct, skel, chains)
    res = {"merge": src, "bend_tests": f"{rep['bend_tests_passed']}/{rep['bend_tests_total']}", "pushed": cc["pushed"]}
    if rep["bend_tests_passed"] != rep["bend_tests_total"]:
        fails.append(f"synthetic bend tests {res['bend_tests']}")
    exprs = {e["chain"]: e for e in cc["chains"]}
    if not all(e.get("simple_expression") for e in exprs.values()):
        fails.append("a leg-push driver is not a simple expression")
    cases = {}
    # both thighs flexed 90 deg (H: + local X = extension)
    bl.reset_pose(ct)
    for s in ("L", "R"):
        local_rot(ct, f"ctl_{s}_Thigh", (1, 0, 0), -90.0)
    bl.update()
    c = {r: push_deg(ct, r) for r in ("skirt_F_01", "skirt_B_01", "L_skirt_S_01", "R_skirt_S_01")}
    c["runtime"] = {r: runtime_turn(rt, r) for r in ("skirt_F_01", "skirt_B_01")}
    cases["flex90_both"] = c
    if abs(c["skirt_F_01"] - 60.0) > TOL_DEG or abs(c["skirt_B_01"]) > TOL_DEG:
        fails.append(f"flex 90 both: front {c['skirt_F_01']:.3f} (60), back {c['skirt_B_01']:.3f} (0)")
    # the tail's chord after a turn by A about X points A/2 away from the rest local Z: cos(30 deg) = 0.866 for 60 deg
    if abs(c["runtime"]["skirt_F_01"][0] - 60.0) > TOL_DEG or (c["runtime"]["skirt_F_01"][1] or 0) < math.cos(math.radians(30.0)) - 0.01:
        fails.append(f"runtime skirt_F_01 does not follow: {c['runtime']['skirt_F_01']}")
    if abs(c["runtime"]["skirt_B_01"][0]) > TOL_DEG:
        fails.append(f"runtime skirt_B_01 moved: {c['runtime']['skirt_B_01']}")
    # left hip abduction 45 deg: the knee goes outward (+X): world rotation about -Y through the hip
    bl.reset_pose(ct)
    world_rot(ct, "ctl_L_Thigh", (0, -1, 0), 45.0)
    knee = ct.pose.bones["ctl_L_Thigh"].tail - ct.data.bones["ctl_L_Thigh"].tail_local
    c = {r: push_deg(ct, r) for r in ("skirt_F_01", "skirt_B_01", "L_skirt_S_01", "R_skirt_S_01")}
    c["knee_motion"] = list(knee)
    c["runtime"] = {"L_skirt_S_01": runtime_turn(rt, "L_skirt_S_01")}
    cases["abduct45_L"] = c
    if abs(c["L_skirt_S_01"] - 0.85 * 45.0) > TOL_DEG or abs(c["R_skirt_S_01"]) > TOL_DEG:
        fails.append(f"abduction 45 L: L side {c['L_skirt_S_01']:.3f} (38.25), R side {c['R_skirt_S_01']:.3f} (0)")
    if max(abs(c["skirt_F_01"]), abs(c["skirt_B_01"])) > TOL_DEG:
        fails.append(f"abduction 45 L moved front/back chains: {c['skirt_F_01']:.3f} / {c['skirt_B_01']:.3f}")
    if abs(c["runtime"]["L_skirt_S_01"][0] - c["L_skirt_S_01"]) > TOL_DEG:
        fails.append(f"runtime L_skirt_S_01 does not follow: {c['runtime']['L_skirt_S_01']}")
    # combined: L flex 40 + abduction 20; driver vs pure-Python value of the same channels
    bl.reset_pose(ct)
    local_rot(ct, "ctl_L_Thigh", (1, 0, 0), -40.0)
    local_rot(ct, "ctl_L_Thigh", (0, 0, 1), -20.0)
    pb = ct.pose.bones["ctl_L_Thigh"]
    q = pb.rotation_quaternion
    sw, _tw = q.to_swing_twist("Y")
    ang = sw.angle
    chans = {"L": (2 * math.asin(max(-1.0, min(1.0, sw.x))), 2 * math.asin(max(-1.0, min(1.0, sw.z))), ang), "R": (0.0, 0.0, 0.0)}
    worst = 0.0
    for r in ("skirt_F_01", "L_skirt_S_01", "skirt_B_01", "R_skirt_S_01"):
        e = exprs[r[:-3]]
        ref = math.degrees(control.leg_push_value(e["coeffs"], e["push"]["max_deg"], chans))
        worst = max(worst, abs(ref - push_deg(ct, r)))
    cases["combined_driver_vs_python_deg"] = worst
    if worst > 0.01:
        fails.append(f"driver vs leg_push_value differ by {worst:.4f} deg")
    bl.reset_pose(ct)
    res["cases"] = cases
    res["expression_F"] = exprs["skirt_F"]["expression"]
    return res


def fl(path, fails):
    from rigkit import poses as RP

    bl.open_file(path)
    asset = bl.scene_value("rigkit_asset_id")
    me, rt, ct = bl.find("mesh", asset), bl.find("runtime", asset), bl.find("control", asset)
    out = {"blend": path}
    roots = [r for r in ("tail_F_01", "tail_B_01", "L_tail_S_01", "R_tail_S_01") if control.ctl(r) + control.PUSH_SUFFIX in ct.pose.bones]
    out["pushed_roots"] = roots
    if len(roots) != 4:
        fails.append(f"FL: push helpers missing ({roots})")
        return out
    sw = [k for k in ct.keys() if k.startswith("ik_")]
    specs = {
        "flex90_both": {"name": "flex90_both", "ik": {k: 0.0 for k in sw}, "tags": [],
                        "ops": [{"op": "local_rot", "bones": [f"ctl_{s}_Thigh"], "axis": "X", "deg": -90.0} for s in ("L", "R")]},
        "abduct45_L": {"name": "abduct45_L", "ik": {k: 0.0 for k in sw}, "tags": [],
                       "ops": [{"op": "world_rot", "bone": "ctl_L_Thigh", "axis": [0.0, -1.0, 0.0], "deg": 45.0}]},
    }
    with RP.emulation(me.name, rt.name) as emu:
        pc = RP.PoseContext(ct.name, rt.name, emu["copy"])
        for nm, sp in specs.items():
            pc.apply(sp)
            c = {r: push_deg(ct, r) for r in roots}
            c["runtime"] = {r: runtime_turn(rt, r) for r in roots}
            out[nm] = c
        pc.reset()
    f, a = out["flex90_both"], out["abduct45_L"]
    if abs(f["tail_F_01"] - 60.0) > TOL_DEG or abs(f["tail_B_01"]) > TOL_DEG:
        fails.append(f"FL flex 90: front {f['tail_F_01']:.3f} (60), back {f['tail_B_01']:.3f} (0)")
    if abs(f["runtime"]["tail_F_01"][0] - f["tail_F_01"]) > TOL_DEG:
        fails.append(f"FL runtime tail_F_01 does not follow: {f['runtime']['tail_F_01']}")
    exp = 0.85 * 45.0
    # FL's thigh is not vertical: the abduction is a world rotation, the swing toward +X is slightly less than 45 deg
    out["abduct45_L_expected_deg"] = exp
    if abs(a["L_tail_S_01"] - exp) > TOL_DEG or abs(a["R_tail_S_01"]) > TOL_DEG:
        fails.append(f"FL abduction 45 L: L side {a['L_tail_S_01']:.3f} ({exp}), R side {a['R_tail_S_01']:.3f} (0)")
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--fl-blend", default=r"E:\tmp_rigkit\G2\fl\FL_flagellant_vA_rig.blend")
    ap.add_argument("--out", default=r"E:\tmp_rigkit\G2\leg_push")
    a = ap.parse_args(bl.script_args())
    os.makedirs(a.out, exist_ok=True)
    fails = []
    res = {"test": "G2_test_leg_push", "synthetic": synthetic(fails)}
    if os.path.exists(a.fl_blend):
        res["fl"] = fl(a.fl_blend, fails)
    else:
        res["fl"] = {"skipped": f"missing {a.fl_blend}"}
    res["ok"] = not fails
    res["fails"] = fails
    with open(os.path.join(a.out, "summary.json"), "w", encoding="utf-8") as f:
        json.dump(res, f, indent=1, default=str)
    print(bl.json_line(res))
    return 0 if not fails else 1


if __name__ == "__main__":
    try:
        rc = main()
    except Exception:
        import traceback

        traceback.print_exc()
        rc = 1
    bl.exit_now(rc)
