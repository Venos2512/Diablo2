r"""A1 test (Blender): the NEW S template (S.json -> H.json: clavicle + twist) built on D01 with TEST-ONLY synthesized clavicles.

    blender -b --factory-startup -P scripts/tests/rigkit/A1_test_s_template.py -- [--out E:\tmp_rigkit\A1\s_template] [--g2 <dir>]

Checks (brief "New S template on D01"): 36 bones built; every bend test passes with NO roll flip (H.json gives the feet and toes
hinge -X since 2026-10-23); skeleton.json written after the build (``skeleton.apply_flips``: no ``roll_flipped``); core-bone heads
inside the mesh; control rig with clavicle FK; twist bones driven by SWING_TWIST drivers (simple expressions, rotation mode XYZ, no
Copy Rotation): pure twist (ctl_L_Hand 60 deg about its Y -> L_ForeArm_twist 30 deg; ctl_L_UpperArm 60 deg -> L_UpperArm_twist
-30 deg local, +30 deg net) and the combined poses of ``functest.TWIST_CASES`` (twist 60 + flexion 60; twist 80 + flexion 60 +
deviation 30; all negative) on both sides, FK and hand IK, within 0.5 deg; the drivers survive ``bl.reset_pose`` and a save +
reopen without Python auto-run; function tests pass in the S5 "bones" mode and in "mesh" mode with the G2 weights remapped onto
the S bones (test-only: helmet/ears -> head, sack -> chest, loincloth_front -> pelvis; twist and clavicle bones get no weights
here). The G2 weights come from a fresh extraction into ``--g2`` (default ``<out>/g2``; sha256-checked), so the test runs on a
clean machine. Writes the report and the .blend to ``--out``; one JSON line; exit 1 on failure.
"""
import json
import os
import sys
import time
import traceback

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPTS = os.path.dirname(os.path.dirname(HERE))
REPO = os.path.normpath(os.path.join(SCRIPTS, "..", "..", "..", ".."))
D01 = os.path.join(REPO, "ashlar", "3d", "monsters", "D01_hodling")
GLB = os.path.join(D01, "D01_hodling.glb")
GLB_SHA256 = "bf22ccea25b72a879048fe3d0bf4ecf92b551984b85081ae97e3bea56f3d8c5a"
LANDMARKS = os.path.join(D01, "rig", "tools", "landmarks.json")
DEFAULT_OUT = r"E:\tmp_rigkit\A1\s_template"
H = 0.5
REMAP = {"helmet": "head", "L_ear": "head", "R_ear": "head", "sack": "chest", "loincloth_front": "pelvis"}
TWIST_BONES = ("L_UpperArm_twist", "R_UpperArm_twist", "L_ForeArm_twist", "R_ForeArm_twist")
sys.dont_write_bytecode = True
for p in (SCRIPTS, HERE):
    if p not in sys.path:
        sys.path.insert(0, p)


def _apply_remapped_weights(mesh_ob, groups, W, bone_names):
    """TEST ONLY: G2 weights by vertex index, aux columns folded into their S parents (writer B owns real skinning)."""
    import numpy as np

    cols = {}
    for j, g in enumerate(groups):
        tgt = REMAP.get(g, g)
        if tgt not in bone_names:
            raise KeyError(f"no S bone for G2 group {g!r}")
        cols.setdefault(tgt, np.zeros(W.shape[0], dtype=np.float64))
        cols[tgt] += W[:, j]
    for g in list(mesh_ob.vertex_groups):
        mesh_ob.vertex_groups.remove(g)
    for nm, col in cols.items():
        vg = mesh_ob.vertex_groups.new(name=nm)
        idx = np.flatnonzero(col > 0)
        for w in np.unique(col[idx]):
            vg.add([int(i) for i in idx[col[idx] == w]], float(w), "REPLACE")
    return sorted(cols)


def _twist_state(rt):
    """Per twist bone: rotation mode, the drivers on its rotation, their expression / simple flag / variable setup, and any
    Copy Rotation left on it."""
    ad = rt.animation_data
    out = {}
    for nm in TWIST_BONES:
        pb = rt.pose.bones[nm]
        path = pb.path_from_id("rotation_euler")
        fcs = [fc for fc in (ad.drivers if ad else []) if fc.data_path == path]
        rows = []
        for fc in fcs:
            v = fc.driver.variables[0] if len(fc.driver.variables) else None
            t = v.targets[0] if v is not None else None
            rows.append({"index": fc.array_index, "type": fc.driver.type, "expression": fc.driver.expression,
                         "simple": bool(fc.driver.is_simple_expression), "var_type": v.type if v else None,
                         "bone_target": t.bone_target if t else None, "transform_type": t.transform_type if t else None,
                         "rotation_mode": t.rotation_mode if t else None, "space": t.transform_space if t else None,
                         "modifiers": [m.type for m in fc.modifiers]})
        out[nm] = {"rotation_mode": pb.rotation_mode, "drivers": rows, "copy_rotation": [c.name for c in pb.constraints if c.type == "COPY_ROTATION"]}
    return out


def _twist_state_ok(st, skel):
    tw = {b["name"]: b["twist"] for b in skel["bones"] if b.get("twist")}
    for nm, s in st.items():
        want = tw[nm]
        if s["rotation_mode"] != "XYZ" or s["copy_rotation"] or len(s["drivers"]) != 1:
            return False
        d = s["drivers"][0]
        if not (d["index"] == 1 and d["simple"] and d["var_type"] == "TRANSFORMS" and d["bone_target"] == want["driver"]
                and d["transform_type"] == "ROT_Y" and d["rotation_mode"] == "SWING_TWIST_Y" and d["space"] == "LOCAL_SPACE"
                and d["expression"] == f"t * {float(want['factor'])!r}"):
            return False
    return len(st) == 4


def main():
    import argparse

    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=DEFAULT_OUT)
    ap.add_argument("--g2", default=None, help="folder for the re-extracted G2 reference (default <out>/g2)")
    a = ap.parse_args(argv)
    os.makedirs(a.out, exist_ok=True)
    g2_dir = a.g2 or os.path.join(a.out, "g2")
    R = {"test": "A1_test_s_template"}
    ok = False
    try:
        import numpy as np

        import A1_g2_reference
        from rigcore import landmarks, npzio, template
        from rigkit import bl, control, functest, intake, skeleton

        g2 = A1_g2_reference.extract(g2_dir)  # always fresh (sha256 of the snapshot and of the copy are checked)
        R["g2"] = {"dir": g2_dir, "sha256": g2["sha256"]}
        gw = np.load(os.path.join(g2_dir, "g2_weights.npz"))
        t0 = time.time()
        bl.new_empty_file()
        col = bl.ensure_collection("D01S_Rig")
        mesh_ob, info = intake.import_glb(GLB, expected_sha256=GLB_SHA256, mesh_name="D01S")
        info["normalize"] = intake.normalize(mesh_ob, H)
        bl.move_to_collection(mesh_ob, col)
        intake.record_scene(info, "D01S")
        fam = template.load_family("S")
        lm0 = landmarks.from_d01_landmarks(LANDMARKS)
        lm = landmarks.synthesize_missing(lm0, fam, H)  # TEST ONLY: the clavicles are invented
        R["synthesized"] = sorted(set(lm) - set(lm0))
        skel, lm2, pre = skeleton.resolve_skeleton(fam, lm, H)
        R["prebend"] = [{k: r.get(k) for k in ("chain", "action", "angle_before_deg", "angle_after_deg", "moved_m")} for r in pre["chains"]]
        rt, rt_rep = skeleton.build_runtime(skel, "D01S_runtime", col, asset_id="D01S")
        skel = skeleton.apply_flips(skel, rt_rep["flipped"])
        template.save_skeleton(os.path.join(a.out, "skeleton.json"), skel)
        R["runtime"] = {k: rt_rep[k] for k in ("bones", "deform", "sockets", "bend_tests_passed", "bend_tests_total", "flipped")}
        R["bend_tests"] = [{k: t[k] for k in ("bone", "expected", "cos", "passed", "flipped")} for t in rt_rep["bend_tests"]]
        R["runtime_collections"] = {c.name: [b.name for b in rt.data.bones if c.name in [x.name for x in b.collections]]
                                    for c in rt.data.collections_all}
        chk = skeleton.check_runtime(rt, skel, mesh_ob, H=H)
        R["checks"] = {k: v for k, v in chk.items() if k != "inside"}
        R["inside"] = {k: v for k, v in chk["inside"].items() if k in chk["inside_judged"]}
        R["weight_groups"] = _apply_remapped_weights(mesh_ob, [str(g) for g in gw["groups"]], gw["W"].astype(np.float64),
                                                     {b["name"] for b in skel["bones"]})
        intake.parent_to_armature(mesh_ob, rt)
        ct, ct_rep = control.build_control(rt, skel, lm2, "D01S_control", col, asset_id="D01S")
        R["control"] = {k: ct_rep[k] for k in ("kit", "bones", "fk", "helpers", "switches")}
        R["control"]["pole_angles"] = {k: v["angle_deg"] for k, v in ct_rep["pole_angles"].items()}
        R["control"]["pole_dev_rad"] = {k: v["dev_rad"] for k, v in ct_rep["pole_angles"].items()}
        R["control"]["coupling"] = ct_rep["coupling"]["rest_max_diff"]
        R["control"]["twist"] = ct_rep["coupling"]["twist"]
        R["twist_state"] = _twist_state(rt)  # after build_control, which ran bl.reset_pose on the runtime
        bl.reset_pose(rt)
        R["twist_state_after_reset_pose"] = _twist_state(rt)
        fb = functest.run(ct, rt, skel, mesh_ob, mode="bones")
        fm = functest.run(ct, rt, skel, mesh_ob, mode="mesh")
        npzio.write_json(os.path.join(a.out, "rig_function_bones.json"), fb)
        npzio.write_json(os.path.join(a.out, "rig_function_mesh.json"), fm)
        for tag, f in (("bones", fb), ("mesh", fm)):
            R[f"functest_{tag}"] = {"passed": f["passed"], "total": f["total"], "extra_passed": f["extra_passed"], "extra_total": f["extra_total"],
                                    "failed": [t["id"] for t in f["tests"] if not t["pass"]],
                                    "extra_failed": [t["id"] for t in f["extra_tests"] if not t["pass"]],
                                    "extremes_finite": f["pose_extremes_all_finite"], "sockets_follow": f["socket_follow_all_ok"]}
        tw = {t["id"]: t for t in fb["extra_tests"] if t["id"].startswith("twist_")}
        R["twist"] = tw
        R["twist_worst_error_deg"] = max(abs(t["error_deg"]) for t in tw.values()) if tw else None
        cl = {t["id"]: t for t in fb["extra_tests"] if t["id"].startswith("clavicle_")}
        R["clavicle"] = cl
        names = [b["name"] for b in skel["bones"]]

        def tw_ok(tid, local, net=None):
            t = tw.get(tid)
            return t is not None and t["pass"] and abs(t["twist_local_deg"] - local) < 0.5 and (net is None or abs(t["twist_net_deg"] - net) < 0.5)

        combo = [cs for cs, _ in functest.TWIST_CASES if cs != "twist60"]
        combo_ids = [f"twist_fk_{cs}_{s}_{p}_twist" for cs in combo for s in "LR" for p in ("UpperArm", "ForeArm")]
        combo_ids += [f"twist_ik_{cs}_{s}_ForeArm_twist" for cs in combo for s in "LR"]
        bl.reset_pose(ct)
        bl.reset_pose(rt)
        bl.set_mode(ct, "OBJECT")
        rt.hide_set(True)
        blend = bl.save_main(os.path.join(a.out, "D01S_rig.blend"))
        # reopen (factory startup: Python auto-run is off): the twist drivers must still evaluate
        bl.open_file(blend)
        ct2, rt2 = bpy_objects("D01S_control"), bpy_objects("D01S_runtime")
        arms = {ik["side"]: ik for ik in skel["ik"] if not ik.get("foot_roll")}
        ro = functest.twist_tests(functest.Poser(ct2), ct2, rt2, skel, arms)
        R["reopened_twist"] = {t["id"]: {"pass": t["pass"], "error_deg": t["error_deg"]} for t in ro}
        R["reopened_twist_state"] = _twist_state(rt2)
        acc = {
            "bones_36": len(names) == 36 and R["runtime"]["bones"] == 36,
            "bend_tests_all_pass": rt_rep["bend_tests_passed"] == rt_rep["bend_tests_total"] > 0,
            "no_roll_flips": not rt_rep["flipped"] and not any(b["roll_flipped"] for b in skel["bones"]),
            "runtime_collections_g2_names": list(R["runtime_collections"]) == ["Deform", "Aux", "Sockets", "Root"]
                                            and set(R["runtime_collections"]["Deform"]) >= set(TWIST_BONES),
            "core_heads_inside": not chk["core_outside_not_exempt"],
            "checks_ok": chk["ok"],
            "control_has_clavicle_fk": all(f"ctl_{s}_Clavicle" in ct2.data.bones for s in "LR") and R["control"]["bones"] == 42,
            "pole_angles_found": all(v < 1e-4 for v in R["control"]["pole_dev_rad"].values()),
            "twist_drivers_swing_twist": _twist_state_ok(R["twist_state"], skel),
            "twist_drivers_survive_reset_pose": _twist_state_ok(R["twist_state_after_reset_pose"], skel),
            "forearm_twist_30": all(tw_ok(f"twist_fk_{s}_ForeArm_twist", 30.0, 30.0) and tw_ok(f"twist_ik_{s}_ForeArm_twist", 30.0, 30.0) for s in "LR"),
            "upperarm_twist_minus30_net30": all(tw_ok(f"twist_fk_{s}_UpperArm_twist", -30.0, 30.0) for s in "LR"),
            "combined_twist_poses_0p5deg": all(tw.get(i, {}).get("pass") for i in combo_ids) and len(combo_ids) == 18,
            "twist_tests_24": len(tw) == 24 and all(t["pass"] for t in tw.values()),
            "reopened_twist_drivers_work": len(ro) == 24 and all(t["pass"] for t in ro) and _twist_state_ok(R["reopened_twist_state"], skel),
            "clavicle_fk_raises": all(cl.get(f"clavicle_raise_{s}", {}).get("pass") for s in "LR"),
            "functest_bones_pass": fb["passed"] == fb["total"] == 16 and fb["extra_passed"] == fb["extra_total"],
            "functest_mesh_pass": fm["passed"] == fm["total"] == 16 and fm["extra_passed"] == fm["extra_total"],
            "extremes_finite": fb["pose_extremes_all_finite"] and fm["pose_extremes_all_finite"],
            "skeleton_carries_builder_template": "builder" in skel and skel["template"]["sha256"] == template.template_info(fam)["sha256"],
        }
        R["acceptance"] = acc
        R["seconds"] = round(time.time() - t0, 2)
        ok = all(acc.values())
    except Exception as e:
        traceback.print_exc()
        R["error"] = repr(e)
    R["ok"] = bool(ok)
    with open(os.path.join(a.out, "s_template.json"), "w", encoding="utf-8") as f:
        f.write(json.dumps(R, indent=1, default=str))
    from rigkit import bl

    print(bl.json_line({"test": R["test"], "ok": R["ok"], "acceptance": R.get("acceptance"), "twist_worst_error_deg": R.get("twist_worst_error_deg"),
                        "error": R.get("error"), "out": a.out}))
    return 0 if ok else 1


def bpy_objects(name):
    import bpy

    return bpy.data.objects[name]


if __name__ == "__main__":
    sys.exit(main())
