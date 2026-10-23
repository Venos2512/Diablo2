r"""A1 negative tests (Blender) of rigkit.export: broken rigs must fail the right checks, never crash the validation, and the S8
step CLI must still write validation.json.

    blender -b --factory-startup -P scripts/tests/rigkit/A1_test_export_negative.py -- [--out E:\tmp_rigkit\A1\export_negative]

Builds the legacy D01 rig into ``<out>/base`` with ``A1_test_legacy_regression.stage_build`` (G2 reference re-extracted into
``<out>/base/g2``), then per variant opens that .blend, breaks it, saves ``<out>/<variant>/neg.blend`` and runs the S8 step CLI
in-process (``rigkit.export.main``, ``--out-dir <out>/<variant>``):

* ``groups``: an orphan vertex group ``junk`` (vertex 0) and one vertex (1) without any group -> the exporter adds a neutral joint;
* ``lowweight``: one vertex (2) whose only weight is 5e-5 on ``pelvis`` -> dropped by the exporter (<= 1e-4), neutral joint;
* ``roots``: an extra unparented deform bone ``stray`` in the runtime armature -> two roots;
* ``noskin``: the mesh unparented and its Armature modifier removed -> the mesh primitive has no JOINTS_0 / WEIGHTS_0;
* ``noruntime``: the runtime armature deleted -> the export itself fails.

Each variant states the checks that must fail and the ones that must still pass; every variant must write validation.json with
all 14 A1 + 5 X keys and the CLI must exit 1 without raising. ``groups`` / ``lowweight`` / ``roots`` must validate without any
recorded error (the neutral joint is handled, not caught; its weight shows as weight error 1.0); ``noskin`` must record the skin
part's error and mark the skin checks "not measured"; ``noruntime`` must fail every check as not measured with the error and its
traceback. One JSON line; exit 1 on failure.
"""
import json
import os
import sys
import time
import traceback

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPTS = os.path.dirname(os.path.dirname(HERE))
DEFAULT_OUT = r"E:\tmp_rigkit\A1\export_negative"
ASSET = "D01_hodling"
sys.dont_write_bytecode = True
for p in (SCRIPTS, HERE):
    if p not in sys.path:
        sys.path.insert(0, p)

SKIN_CHECKS = ["A1.2", "A1.3", "A1.4", "A1.5", "A1.6", "A1.7", "A1.8", "A1.13", "A1.14", "X.3_joint_count_equals_runtime_bones",
               "X.4_no_leaf_or_neutral_joints", "X.5_single_top_root"]
#: variant -> (must fail, must pass, errors allowed)
EXPECT = {  # the neutral joint of groups / lowweight is an extra joint (A1.2, X.3, X.4) and a second root (A1.3, X.5)
    "groups": (["X.1_no_orphan_vertex_groups", "X.2_no_vertex_with_only_non_bone_groups", "X.3_joint_count_equals_runtime_bones",
                "X.4_no_leaf_or_neutral_joints", "X.5_single_top_root", "A1.2", "A1.3"],
               ["A1.4", "A1.5", "A1.6", "A1.8", "A1.9", "A1.10", "A1.11", "A1.12"], False),
    "lowweight": (["X.2_no_vertex_with_only_non_bone_groups", "X.3_joint_count_equals_runtime_bones", "X.4_no_leaf_or_neutral_joints",
                   "X.5_single_top_root", "A1.2", "A1.3"],
                  ["X.1_no_orphan_vertex_groups", "A1.4", "A1.5", "A1.6", "A1.8", "A1.9", "A1.10", "A1.11", "A1.12"], False),
    "roots": (["A1.2", "A1.3", "A1.13", "X.5_single_top_root"],
              ["X.1_no_orphan_vertex_groups", "X.2_no_vertex_with_only_non_bone_groups", "X.4_no_leaf_or_neutral_joints", "A1.4", "A1.5",
               "A1.8", "A1.9", "A1.10", "A1.11", "A1.12"], False),
    "noskin": (["A1.1"] + SKIN_CHECKS,
               ["X.1_no_orphan_vertex_groups", "X.2_no_vertex_with_only_non_bone_groups", "A1.9", "A1.10", "A1.11", "A1.12"], True),
    "noruntime": ([f"A1.{i}" for i in range(1, 15)] + ["X.1_no_orphan_vertex_groups", "X.2_no_vertex_with_only_non_bone_groups",
                                                       "X.3_joint_count_equals_runtime_bones", "X.4_no_leaf_or_neutral_joints",
                                                       "X.5_single_top_root"], [], True),
}


def break_rig(variant):
    """Apply ``variant`` to the open rig file. Returns a short description."""
    from rigkit import bl

    rt, me = bl.find("runtime", ASSET), bl.find("mesh", ASSET)
    if variant == "groups":
        g = me.vertex_groups.new(name="junk")
        g.add([0], 1.0, "REPLACE")
        for vg in me.vertex_groups:
            vg.remove([1])
        return "vertex group 'junk' on vertex 0 (no bone of that name); vertex 1 removed from every group"
    if variant == "lowweight":
        for vg in me.vertex_groups:
            vg.remove([2])
        me.vertex_groups["pelvis"].add([2], 5e-5, "REPLACE")
        return "vertex 2: only pelvis = 5e-5"
    if variant == "roots":
        rt.hide_set(False)
        with bl.edit_mode(rt) as data:
            eb = data.edit_bones.new("stray")
            eb.head = (0.3, 0.0, 0.1)
            eb.tail = (0.3, 0.0, 0.2)
            eb.use_deform = True
        return "extra unparented deform bone 'stray' at x = 0.3 m"
    if variant == "noskin":
        for m in [m for m in me.modifiers if m.type == "ARMATURE"]:
            me.modifiers.remove(m)
        mw = me.matrix_world.copy()
        me.parent = None
        me.matrix_world = mw
        return "mesh unparented, Armature modifier removed"
    if variant == "noruntime":
        import bpy

        bpy.data.objects.remove(rt)
        return "runtime armature deleted: the export itself fails"
    raise ValueError(variant)


def run_variant(variant, base_dir, out):
    import bpy  # noqa: F401  (Blender only)

    import A1_test_legacy_regression as legacy
    from rigkit import bl, export

    vdir = os.path.join(out, variant)
    os.makedirs(vdir, exist_ok=True)
    vpath = os.path.join(vdir, "validation.json")
    if os.path.exists(vpath):
        os.remove(vpath)
    bl.open_file(os.path.join(base_dir, "D01_hodling_rig.blend"))
    what = break_rig(variant)
    blend = bl.save_main(os.path.join(vdir, "neg.blend"))
    t0 = time.time()
    try:
        code = export.main(["--blend", blend, "--source-glb", legacy.GLB, "--H", str(legacy.H), "--out-dir", vdir,
                            "--skeleton", os.path.join(base_dir, "skeleton.json"), "--asset-id", ASSET, "--glb-name", "neg.glb"])
        crash = None
    except Exception as e:  # the CLI must not raise
        traceback.print_exc()
        code, crash = None, repr(e)
    row = {"variant": variant, "broken": what, "exit_code": code, "cli_raised": crash, "seconds": round(time.time() - t0, 2),
           "validation_written": os.path.isfile(vpath)}
    if not row["validation_written"]:
        row["pass"] = False
        return row
    with open(vpath, encoding="utf-8") as f:
        val = json.load(f)
    must_fail, must_pass, errors_ok = EXPECT[variant]
    checks = {**val["A1"], **val["extra_checks"]}
    failed = sorted(k for k, v in checks.items() if not v["pass"])
    row.update({"failed": failed, "errors": [e["part"] + ": " + e["error"] for e in val["errors"]], "skipped": val["skipped_parts"],
                "must_fail_missing": sorted(set(must_fail) - set(failed)), "must_pass_failed": sorted(set(must_pass) & set(failed)),
                "keys_complete": sorted(val["A1"]) == sorted(export.A1_KEYS) and sorted(val["extra_checks"]) == sorted(export.X_KEYS),
                "measured": {k: checks[k]["measured"] for k in must_fail if k in checks}})
    w = val["source_consistency"].get("blend_weights_vs_runtime_glb") or {}
    row["weighted_joints_without_vertex_group"] = w.get("weighted_joints_without_vertex_group")
    row["glb_vertices_on_joints_without_group"] = w.get("glb_vertices_on_joints_without_group")
    row["max_abs_weight_diff"] = w.get("max_abs_weight_diff")
    ok = (code == 1 and crash is None and row["keys_complete"] and not row["must_fail_missing"] and not row["must_pass_failed"]
          and (bool(val["errors"]) if errors_ok else not val["errors"]))
    if variant in ("groups", "lowweight"):  # the exporter's neutral joint is recorded and its weight counted, not a crash
        ok &= (row["weighted_joints_without_vertex_group"] == ["neutral_bone"] and row["glb_vertices_on_joints_without_group"] == 1
               and row["max_abs_weight_diff"] == 1.0)
        x2 = checks["X.2_no_vertex_with_only_non_bone_groups"]["measured"]
        ok &= x2["vertices_without_groups"] == 1 and x2["examples_without_groups"] == [1 if variant == "groups" else 2]
    if variant == "noskin":
        ok &= any(e["part"] == "skin" for e in val["errors"]) and all(checks[k]["measured"].get("not_measured") for k in SKIN_CHECKS)
    if variant == "noruntime":  # nothing could be measured: every check failed as not measured, the error kept with its traceback
        ok &= (val["errors"][0]["part"] == "validate" and "LookupError" in val["errors"][0]["error"]
               and "Traceback" in val["errors"][0]["traceback"] and all(v["measured"].get("not_measured") for v in checks.values())
               and val.get("export") is None)
    row["pass"] = bool(ok)
    return row


def main():
    import argparse

    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=DEFAULT_OUT)
    ap.add_argument("--variants", default=",".join(EXPECT))
    a = ap.parse_args(argv)
    os.makedirs(a.out, exist_ok=True)
    R = {"test": "A1_test_export_negative", "out": a.out, "variants": {}}
    ok = False
    try:
        import A1_test_legacy_regression as legacy

        base = os.path.join(a.out, "base")
        os.makedirs(base, exist_ok=True)
        B = {}
        R["base_build_ok"] = legacy.stage_build(base, B)
        R["base_acceptance"] = B.get("acceptance_build")
        for v in [s.strip() for s in a.variants.split(",") if s.strip()]:
            R["variants"][v] = run_variant(v, base, a.out)
        ok = R["base_build_ok"] and bool(R["variants"]) and all(r["pass"] for r in R["variants"].values())
    except Exception as e:
        traceback.print_exc()
        R["error"] = repr(e)
    R["ok"] = bool(ok)
    with open(os.path.join(a.out, "export_negative.json"), "w", encoding="utf-8") as f:
        f.write(json.dumps(R, indent=1, default=str))
    from rigkit import bl

    print(bl.json_line({"test": R["test"], "ok": R["ok"], "variants": {k: {"pass": v["pass"], "failed": v.get("failed"), "errors": v.get("errors")}
                                                                       for k, v in R["variants"].items()},
                        "error": R.get("error"), "out": a.out}))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
