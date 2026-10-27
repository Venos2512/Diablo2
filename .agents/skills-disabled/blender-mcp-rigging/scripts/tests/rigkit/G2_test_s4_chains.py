r"""Owner G2 (Blender): S4 with ``--chains`` on FL (fixture plan) against S4 without chains.

Checks: chain bones built with the plan's names and parents, ``kind aux`` in the ``Aux`` collection, deform on; every chain root
passes its bend test (+X swings outward) and every chain bone's rest local Z points outward (+X rotation moves the tail out); the
core bones keep the same rolls and bend-test results as the run without chains; the merge used (G1 or the G2 fallback).

Run:  blender -b --factory-startup -P tests/rigkit/G2_test_s4_chains.py -- [--intake-blend <S2 snapshot>] [--chains <chains.json>]
          [--out E:\tmp_rigkit\G2\s4]
Prints one JSON line; exit 1 on failure. Outputs: <out>/{nochains,chains}/(rig .blend, skeleton.json, s4_report.json), summary.json.
"""
import argparse
import json
import math
import os
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPTS = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, SCRIPTS)
sys.dont_write_bytecode = True

import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

from rigkit import bl, skeleton  # noqa: E402

FL = r"E:\tmp_rigkit\I4\FL_H"


def run_s4(out, intake, chains):
    os.makedirs(out, exist_ok=True)
    blend = os.path.join(out, "FL_flagellant_vA_rig.blend")
    shutil.copyfile(intake, blend)
    args = ["--blend", blend, "--landmarks", os.path.join(FL, "landmarks.json"), "--family", "H", "--out-dir", out]
    if chains:
        args += ["--chains", chains]
    code = skeleton.main(args)
    with open(os.path.join(out, "s4_report.json"), "rb") as f:
        rep = json.loads(f.read().decode("utf-8"))
    with open(os.path.join(out, "skeleton.json"), "rb") as f:
        skel = json.loads(f.read().decode("utf-8"))
    return code, rep, skel, blend


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--intake-blend", default=os.path.join(FL, "_snapshots", "S2", "FL_flagellant_vA_rig.blend"))
    ap.add_argument("--chains", default=os.path.join(HERE, "G2_fixtures", "FL_chains_fixture.json"))
    ap.add_argument("--out", default=r"E:\tmp_rigkit\G2\s4")
    a = ap.parse_args(bl.script_args())
    fails = []
    code0, rep0, skel0, _ = run_s4(os.path.join(a.out, "nochains"), a.intake_blend, None)
    code1, rep1, skel1, blend1 = run_s4(os.path.join(a.out, "chains"), a.intake_blend, a.chains)
    with open(a.chains, "rb") as f:
        plan = json.loads(f.read().decode("utf-8"))
    if code0 != 0 or code1 != 0:
        fails.append(f"S4 exit codes {code0} / {code1}")
    # chain bones in the armature
    bl.open_file(blend1)
    rt = bl.find("runtime", "FL_flagellant_vA")
    bones = rt.data.bones
    aux = rt.data.collections.get("Aux")
    plan_bones = [(c, b) for c in plan["chains"] for b in c["bones"]]
    built = []
    for c, b in plan_bones:
        nm = b["name"]
        if nm not in bones:
            fails.append(f"missing chain bone {nm}")
            continue
        bb = bones[nm]
        if (bb.parent.name if bb.parent else None) != b["parent"]:
            fails.append(f"{nm}: parent {bb.parent.name if bb.parent else None} != {b['parent']}")
        if aux is None or nm not in [x.name for x in aux.bones]:
            fails.append(f"{nm}: not in the Aux collection")
        if not bb.use_deform:
            fails.append(f"{nm}: not deforming")
        out = skeleton.chain_outward(c)
        z = bb.matrix_local.to_3x3() @ Vector((0.0, 0.0, 1.0))
        cz = float(z.dot(Vector(out))) if out is not None else None
        built.append({"bone": nm, "chain": c["id"], "local_z_dot_outward": cz})
        if cz is not None and cz < 0.25:
            fails.append(f"{nm}: local Z . outward = {cz:.3f} (+X would not swing outward)")
    sk_chain = [b for b in skel1["bones"] if b.get("chain")]
    if [b["name"] for b in sk_chain] != [b["name"] for _, b in plan_bones]:
        fails.append("skeleton.json chain bones differ from the plan order")
    if any(b["kind"] != "aux" or not b["deform"] for b in sk_chain):
        fails.append("chain bone with kind != aux or deform off in skeleton.json")
    roots = rep1.get("chains", {}).get("root_bend_tests", [])
    if len(roots) != len(plan["chains"]) or not all(r["passed"] for r in roots):
        fails.append(f"chain root bend tests: {[(r['bone'], round(r['cos'], 3), r['passed']) for r in roots]}")
    # core unchanged
    core = [b["name"] for b in skel0["bones"]]
    r0, r1 = rep0["build"]["rolls"], rep1["build"]["rolls"]
    roll_diff = max(abs(r0[n] - r1[n]) for n in core)
    bt0 = {r["bone"]: r for r in rep0["build"]["bend_tests"]}
    bt1 = {r["bone"]: r for r in rep1["build"]["bend_tests"]}
    bt_diff = [n for n in bt0 if (bt0[n]["passed"], bt0[n]["flipped"], round(bt0[n]["cos"], 12)) != (bt1[n]["passed"], bt1[n]["flipped"], round(bt1[n]["cos"], 12))]
    core_same = {k: skel0["bones"][i][k] == skel1["bones"][i][k] for i in range(len(core)) for k in ("head", "tail", "hinge", "parent")}
    if roll_diff > 0.0:
        fails.append(f"core rolls changed by {roll_diff}")
    if bt_diff:
        fails.append(f"core bend tests changed: {bt_diff}")
    if not all(core_same.values()):
        fails.append("core bones of skeleton.json changed")
    if rep0["checks"]["ok"] != rep1["checks"]["ok"] or rep0["checks"]["core_outside"] != rep1["checks"]["core_outside"]:
        fails.append("S4 checks differ")
    summary = {"test": "G2_test_s4_chains", "ok": not fails, "fails": fails, "merge_source": rep1.get("chains", {}).get("source"),
               "bones": [rep0["build"]["bones"], rep1["build"]["bones"]],
               "bend_tests": [f"{rep0['build']['bend_tests_passed']}/{rep0['build']['bend_tests_total']}",
                              f"{rep1['build']['bend_tests_passed']}/{rep1['build']['bend_tests_total']}"],
               "root_bend_tests": [{"bone": r["bone"], "expected": r["expected"], "cos": round(r["cos"], 4), "flipped": r["flipped"],
                                    "passed": r["passed"]} for r in roots],
               "core_roll_max_diff_rad": roll_diff, "chain_bones": len(built),
               "min_local_z_dot_outward": min((b["local_z_dot_outward"] for b in built if b["local_z_dot_outward"] is not None),
                                              default=None),
               "aux_outside": rep1["checks"].get("aux_outside"), "out": a.out}
    with open(os.path.join(a.out, "summary.json"), "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=1)
    print(bl.json_line(summary))
    return 0 if not fails else 1


if __name__ == "__main__":
    try:
        rc = main()
    except Exception:
        import traceback

        traceback.print_exc()
        rc = 1
    bl.exit_now(rc)
