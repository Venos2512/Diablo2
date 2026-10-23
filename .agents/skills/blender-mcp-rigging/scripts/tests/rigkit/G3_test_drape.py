r"""Owner G3 (Blender): leg push with drape (references/cloth-and-attachments.md §4, G3b) on a synthetic rig, and optionally on an FL
rig built by the pipeline (S5 with the G3b chains.json).

Synthetic rig: root, pelvis, thighs and calves (thigh local X = +X world, + = hip extension, as family H) and a four-chain skirt ring
(skirt_F, skirt_B, L_skirt_S, R_skirt_S; 3 bones each) whose ``leg_push`` follows solvers/chains.py: ``max_deg`` 80 facing a leg
(front/back), 60 at the side, ``drape`` 0.75. Built with ``skeleton.merge_chains_any`` + ``build_runtime`` + ``control.build_control``
(FK only) + ``control.add_chain_controls``. Checks:
  * both thighs flexed 90 deg -> front root pushed 80 deg (clamp), its bone 02 drape helper at -60 deg, so the runtime bone 02 and
    bone 03 turn (1 - 0.75) x 80 = 20 deg from rest; the back chain does not move at all;
  * left hip abduction 90 deg -> L side push clamped at 60 deg, drape -45 deg; abduction 45 -> 38.25 / -28.69 deg;
  * every drape driver equals ``control.drape_value`` of its push within 0.01 deg and is a simple expression;
  * FK still works on top: a QA chain pose (+30 deg on ``ctl_skirt_F_02``) and an animator key on the root (+10 deg on
    ``ctl_skirt_F_01``) add to the push and the drape; the runtime follows.
FL (``--fl-blend``, skipped when missing): flex 90 through ``rigkit.poses.emulation`` + ``PoseContext``: skirt_F pushed to its plan
``max_deg``, bone 02's drape = -drape x push, runtime bone 02 net turn = (1 - drape) x push.

Run:  blender -b --factory-startup -P tests/rigkit/G3_test_drape.py -- [--fl-blend <FL rig .blend after S5>] [--out <dir>]
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
from mathutils import Matrix, Quaternion, Vector  # noqa: E402

from rigcore import geom  # noqa: E402
from rigkit import bl, control, skeleton  # noqa: E402

TOL_DEG = 1.0


def _bone(name, parent, head, tail, hinge, side=None, bend_test=None):
    return {"name": name, "parent": parent, "side": side, "kind": "core", "deform": name != "root", "head": list(head),
            "tail": list(tail), "hinge": list(geom.unit(hinge)), "bend_test": bend_test, "twist": None}


def synthetic_skeleton(drape=0.75):
    bones = [_bone("root", None, (0, 0, 0), (0, 0, 0.1), (1, 0, 0)), _bone("pelvis", "root", (0, 0, 1.0), (0, 0, 1.1), (1, 0, 0))]
    for s, x in (("L", 0.1), ("R", -0.1)):
        bones.append(_bone(f"{s}_Thigh", "pelvis", (x, 0, 0.95), (x, -0.01, 0.5), (1, 0, 0), side=s,
                           bend_test="knee goes back (+Y): hip extension"))
        bones.append(_bone(f"{s}_Calf", f"{s}_Thigh", (x, -0.01, 0.5), (x, 0, 0.08), (1, 0, 0), side=s,
                           bend_test="knee flexes, foot goes back (+Y)"))
    skel = {"schema": 0, "family": "G3_synthetic", "template_version": "test", "H": 1.8, "bones": bones, "ik": [], "rom": [],
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
        facing = abs(math.cos(a)) >= 0.7
        chains.append({"id": cid, "piece": "auto:0", "class": "skirt", "side": side, "parent": "pelvis", "panel": 0,
                       "azimuth_deg": phi, "fan_root": None, "bones": bl_,
                       "leg_push": {"enabled": True, "w_L": 0.5 + 0.35 * sn, "w_R": 0.5 - 0.35 * sn, "dir": list(out),
                                    "max_deg": 80.0 if facing else 60.0, "drape": drape}})
    return skel, {"schema": 0, "asset_id": "G3_synthetic", "H": 1.8, "chains": chains, "colliders": [], "budget": {}}


def local_rot(arm, bone, axis, deg):
    pb = arm.pose.bones[bone]
    pb.rotation_mode = "QUATERNION"
    pb.rotation_quaternion = Quaternion(Vector(axis), math.radians(deg)) @ pb.rotation_quaternion
    bl.update()


def world_rot(arm, bone, axis, deg):
    pb = arm.pose.bones[bone]
    pv = pb.head.copy()
    pb.matrix = Matrix.Translation(pv) @ Matrix.Rotation(math.radians(deg), 4, Vector(axis)) @ Matrix.Translation(-pv) @ pb.matrix
    bl.update()


def helper_deg(ct, bone, suffix):
    return math.degrees(ct.pose.bones[control.ctl(bone) + suffix].rotation_euler[0])


def turn(rt, bone):
    """Angle (deg) between a runtime bone's posed and rest direction (armature space)."""
    pb = rt.pose.bones[bone]
    d = (pb.tail - pb.head).normalized()
    r = (rt.data.bones[bone].tail_local - rt.data.bones[bone].head_local).normalized()
    return math.degrees(math.acos(max(-1.0, min(1.0, d.dot(r)))))


def from_down(rt, bone):
    """Angle (deg) of a runtime bone's posed direction from straight down (-Z)."""
    pb = rt.pose.bones[bone]
    d = (pb.tail - pb.head).normalized()
    return math.degrees(math.acos(max(-1.0, min(1.0, -d.z))))


def synthetic(fails):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    skel0, chains = synthetic_skeleton()
    skel, src = skeleton.merge_chains_any(skel0, chains)
    rt, rep = skeleton.build_runtime(skel, "SYN_runtime")
    skel = skeleton.apply_flips(skel, rep["flipped"])
    ct, _ = control.build_control(rt, skel, {}, "SYN_control", sweep=False)
    cc = control.add_chain_controls(ct, skel, chains)
    res = {"merge": src, "bend_tests": f"{rep['bend_tests_passed']}/{rep['bend_tests_total']}", "pushed": cc["pushed"],
           "draped": cc["draped"]}
    if cc["draped"] != 4:
        fails.append(f"expected 4 drape helpers (bone 02 of each chain), got {cc['draped']}")
    ents = {e["chain"]: e for e in cc["chains"]}
    if not all(e.get("simple_expression") and (e.get("drape") or {}).get("simple_expression") for e in ents.values()):
        fails.append("a push or drape driver is not a simple expression")
    if ct.pose.bones["ctl_skirt_F_02"].parent.name != "ctl_skirt_F_02" + control.DRAPE_SUFFIX or \
            ct.pose.bones["ctl_skirt_F_02" + control.DRAPE_SUFFIX].parent.name != "ctl_skirt_F_01":
        fails.append("drape helper is not between ctl_skirt_F_01 and ctl_skirt_F_02")
    cases = {}
    rest_from_down = {b: from_down(rt, b) for b in ("skirt_F_02", "skirt_B_02")}
    # ---- both thighs flexed 90 deg: front 80 / -60 / net 20, back untouched
    bl.reset_pose(ct)
    for s in ("L", "R"):
        local_rot(ct, f"ctl_{s}_Thigh", (1, 0, 0), -90.0)
    c = {"push_F": helper_deg(ct, "skirt_F_01", control.PUSH_SUFFIX), "drape_F": helper_deg(ct, "skirt_F_02", control.DRAPE_SUFFIX),
         "push_B": helper_deg(ct, "skirt_B_01", control.PUSH_SUFFIX), "drape_B": helper_deg(ct, "skirt_B_02", control.DRAPE_SUFFIX),
         "turn_F_01": turn(rt, "skirt_F_01"), "turn_F_02": turn(rt, "skirt_F_02"), "turn_F_03": turn(rt, "skirt_F_03"),
         "turn_B_01": turn(rt, "skirt_B_01"), "turn_B_02": turn(rt, "skirt_B_02"), "turn_B_03": turn(rt, "skirt_B_03"),
         "F_02_from_down": from_down(rt, "skirt_F_02"), "F_02_rest_from_down": rest_from_down["skirt_F_02"]}
    cases["flex90_both"] = c
    if abs(c["push_F"] - 80.0) > TOL_DEG or abs(c["drape_F"] + 60.0) > TOL_DEG:
        fails.append(f"flex 90: front push {c['push_F']:.3f} (80), drape {c['drape_F']:.3f} (-60)")
    if abs(c["turn_F_01"] - 80.0) > TOL_DEG or abs(c["turn_F_02"] - 20.0) > TOL_DEG or abs(c["turn_F_03"] - 20.0) > TOL_DEG:
        fails.append(f"flex 90: runtime front turns {c['turn_F_01']:.2f} / {c['turn_F_02']:.2f} / {c['turn_F_03']:.2f} (80 / 20 / 20)")
    # helpers exactly 0; runtime turns measured by acos of float32 directions: noise up to about 0.03 deg
    if max(abs(c["push_B"]), abs(c["drape_B"])) > 1e-6 or max(c[k] for k in ("turn_B_01", "turn_B_02", "turn_B_03")) > 0.1:
        fails.append(f"flex 90: the back chain moved ({c['push_B']:.4f}, {c['drape_B']:.4f}, {c['turn_B_01']:.4f}, "
                     f"{c['turn_B_02']:.4f}, {c['turn_B_03']:.4f})")
    # driver = pure Python
    worst = max(abs(math.degrees(control.drape_value(math.radians(helper_deg(ct, f"{cid}_01", control.PUSH_SUFFIX)), 0.75))
                    - helper_deg(ct, f"{cid}_02", control.DRAPE_SUFFIX)) for cid in ("skirt_F", "skirt_B", "L_skirt_S", "R_skirt_S"))
    cases["drape_driver_vs_python_deg"] = worst
    if worst > 0.01:
        fails.append(f"drape driver vs drape_value differ by {worst:.4f} deg")
    # ---- FK on top: QA chain pose on bone 02 (+30) and an animator key on the root (+10) add to push and drape
    local_rot(ct, "ctl_skirt_F_02", (1, 0, 0), 30.0)
    local_rot(ct, "ctl_skirt_F_01", (1, 0, 0), 10.0)
    c = {"turn_F_01": turn(rt, "skirt_F_01"), "turn_F_02": turn(rt, "skirt_F_02"), "push_F": helper_deg(ct, "skirt_F_01", control.PUSH_SUFFIX),
         "drape_F": helper_deg(ct, "skirt_F_02", control.DRAPE_SUFFIX)}
    cases["flex90_plus_fk"] = c
    if abs(c["turn_F_01"] - 90.0) > TOL_DEG or abs(c["turn_F_02"] - 60.0) > TOL_DEG:
        fails.append(f"FK on top: runtime turns {c['turn_F_01']:.2f} / {c['turn_F_02']:.2f} (90 / 60)")
    if abs(c["push_F"] - 80.0) > TOL_DEG or abs(c["drape_F"] + 60.0) > TOL_DEG:
        fails.append(f"FK on top switched the drivers: push {c['push_F']:.3f}, drape {c['drape_F']:.3f}")
    # ---- side chain: abduction 45 (38.25 / -28.69) and 90 (clamp 60 / -45)
    for deg, push_exp in ((45.0, 0.85 * 45.0), (90.0, 60.0)):
        bl.reset_pose(ct)
        world_rot(ct, "ctl_L_Thigh", (0, -1, 0), deg)
        c = {"push_LS": helper_deg(ct, "L_skirt_S_01", control.PUSH_SUFFIX), "drape_LS": helper_deg(ct, "L_skirt_S_02", control.DRAPE_SUFFIX),
             "push_RS": helper_deg(ct, "R_skirt_S_01", control.PUSH_SUFFIX), "turn_LS_02": turn(rt, "L_skirt_S_02")}
        cases[f"abduct{int(deg)}_L"] = c
        if abs(c["push_LS"] - push_exp) > TOL_DEG or abs(c["drape_LS"] + 0.75 * push_exp) > TOL_DEG or abs(c["push_RS"]) > TOL_DEG:
            fails.append(f"abduction {deg}: L side {c['push_LS']:.3f} ({push_exp}), drape {c['drape_LS']:.3f} "
                         f"({-0.75 * push_exp:.2f}), R side {c['push_RS']:.3f} (0)")
        if abs(c["turn_LS_02"] - 0.25 * push_exp) > TOL_DEG:
            fails.append(f"abduction {deg}: runtime L_skirt_S_02 turn {c['turn_LS_02']:.2f} ({0.25 * push_exp:.2f})")
    bl.reset_pose(ct)
    res["cases"] = cases
    res["expressions"] = {"push_F": ents["skirt_F"]["expression"], "drape_F": ents["skirt_F"]["drape"]["expression"]}
    return res


def fl(path, fails):
    from rigkit import poses as RP

    bl.open_file(path)
    asset = bl.scene_value("rigkit_asset_id")
    me, rt, ct = bl.find("mesh", asset), bl.find("runtime", asset), bl.find("control", asset)
    out = {"blend": path}
    root, b2 = "skirt_F_01", "skirt_F_02"
    if control.ctl(root) + control.PUSH_SUFFIX not in ct.pose.bones or control.ctl(b2) + control.DRAPE_SUFFIX not in ct.pose.bones:
        fails.append("FL: push or drape helper of skirt_F missing")
        return out
    out["drape_helpers"] = sorted(b.name for b in ct.pose.bones if b.name.endswith(control.DRAPE_SUFFIX))
    sw = [k for k in ct.keys() if k.startswith("ik_")]
    spec = {"name": "flex90_both", "ik": {k: 0.0 for k in sw}, "tags": [],
            "ops": [{"op": "local_rot", "bones": [f"ctl_{s}_Thigh"], "axis": "X", "deg": -90.0} for s in ("L", "R")]}
    with RP.emulation(me.name, rt.name) as emu:
        pc = RP.PoseContext(ct.name, rt.name, emu["copy"])
        pc.apply(spec)
        p, d = helper_deg(ct, root, control.PUSH_SUFFIX), helper_deg(ct, b2, control.DRAPE_SUFFIX)
        out.update(push_F=p, drape_F=d, turn_F_01=turn(rt, root), turn_F_02=turn(rt, b2))
        pc.reset()
    if abs(d + 0.75 * p) > 0.01:
        fails.append(f"FL: drape {d:.3f} != -0.75 x push {p:.3f}")
    if abs(out["turn_F_02"] - 0.25 * p) > 2.0:  # FL's hinges of bone 01 and 02 are not exactly parallel
        fails.append(f"FL: runtime skirt_F_02 turns {out['turn_F_02']:.2f} (about {0.25 * p:.2f})")
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--fl-blend", default="")
    ap.add_argument("--out", default=r"E:\tmp_rigkit\G3\drape_test")
    a = ap.parse_args(bl.script_args())
    os.makedirs(a.out, exist_ok=True)
    fails = []
    res = {"test": "G3_test_drape", "synthetic": synthetic(fails)}
    res["fl"] = fl(a.fl_blend, fails) if a.fl_blend and os.path.exists(a.fl_blend) else {"skipped": "no --fl-blend"}
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
