r"""A1 legacy regression (Blender): rebuild D01 Hodling's G2 rig with rigkit and compare it with the G2-approved file.

    blender -b --factory-startup -P scripts/tests/rigkit/A1_test_legacy_regression.py -- [--out E:\tmp_rigkit\A1\legacy]
                                                                                          [--stages build,functest,export] [--g2 <dir>]

Pipeline: G2 reference re-extracted into ``--g2`` (default ``<out>/g2``; A1_g2_reference.extract checks the sha256 of the G2
snapshot and of its copy) -> D01_hodling.glb (read only, sha256) -> intake (H = 0.5) -> from_d01_landmarks + S_legacy_D01.json +
legacy pre-bend -> runtime armature -> G2 vertex weights copied by vertex index (private helper below; skin_io belongs to writer
B) -> parent -> control kit humanoid_v1 (pole sweep) -> compare with the G2 reference -> save -> reopen -> function tests (vs D01
checks/rig_function.json) -> test GLB export + validation (vs D01 validation.json).

Acceptance (every computed comparison gates): runtime bone head/tail <= 1e-5 m, rest matrices <= 1e-4, rolls, names, order,
parents, deform/connect/scale/bbone flags, bone collections and colours as G2; control: the same 45 names in the same order, rest
matrices, rolls, parents, collections, colours, constraints (all recorded fields incl. influence, mix mode, axes, inverts, pole
angle), IK locks, drivers, switches; mesh groups + Armature modifier; objects; pole angles -90 deg; no roll flip; function tests
20/20 with D01's verdicts; A1.1-A1.14 = 14/14 with D01's verdicts; test GLB byte-identical to D01's check GLB. Outputs go to
``--out``; one JSON summary line; exit 1 on failure. ``stage_build`` is also used by A1_test_export_negative.py.
"""
import json
import math
import os
import sys
import time
import traceback

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPTS = os.path.dirname(os.path.dirname(HERE))
REPO = os.path.normpath(os.path.join(SCRIPTS, "..", "..", "..", ".."))
D01 = os.path.join(REPO, "ashlar", "3d", "act-01", "monsters", "D01_hodling")
GLB = os.path.join(D01, "D01_hodling.glb")
GLB_SHA256 = "bf22ccea25b72a879048fe3d0bf4ecf92b551984b85081ae97e3bea56f3d8c5a"
LANDMARKS = os.path.join(D01, "rig", "tools", "landmarks.json")
D01_FUNC = os.path.join(D01, "rig", "checks", "rig_function.json")
D01_VALIDATION = os.path.join(D01, "rig", "validation.json")
DEFAULT_OUT = r"E:\tmp_rigkit\A1\legacy"
H = 0.5
sys.dont_write_bytecode = True
for p in (SCRIPTS, HERE):
    if p not in sys.path:
        sys.path.insert(0, p)


# --------------------------------------------------------------------------------------------------------------------------
# private weight helper (writer B owns rigkit.skin_io; this only copies the G2 weights by vertex index for the regression)
# --------------------------------------------------------------------------------------------------------------------------

def _apply_weights_by_index(mesh_ob, groups, W):
    import numpy as np

    for g in list(mesh_ob.vertex_groups):
        mesh_ob.vertex_groups.remove(g)
    for j, nm in enumerate(groups):
        vg = mesh_ob.vertex_groups.new(name=str(nm))
        col = W[:, j]
        idx = np.flatnonzero(col > 0)
        for w in np.unique(col[idx]):  # batched: one add() per distinct weight
            vg.add([int(i) for i in idx[col[idx] == w]], float(w), "REPLACE")
    return len(groups)


def _mat_diff(a, b):
    return max(abs(x - y) for ra, rb in zip(a, b) for x, y in zip(ra, rb))


def _vec_diff(a, b):
    return max(abs(x - y) for x, y in zip(a, b))


#: constraint fields compared with the G2 record (A1_g2_reference._constraints records them when the constraint has them)
CON_FIELDS = ("subtarget", "pole_subtarget", "target_space", "owner_space", "chain_count", "use_tail", "use_stretch", "mix_mode",
              "use_x", "use_y", "use_z", "invert_x", "invert_y", "invert_z")


def con_sig(ob):
    """``{pose bone: [(type, name, influence, target, pole target, pole angle deg, *CON_FIELDS)]}`` of a live armature."""
    out = {}
    for pb in ob.pose.bones:
        rows = []
        for c in pb.constraints:
            tgt, pol = getattr(c, "target", None), getattr(c, "pole_target", None)
            rows.append((c.type, c.name, round(float(c.influence), 6), tgt.name if tgt else None, pol.name if pol else None,
                         round(math.degrees(c.pole_angle), 6) if c.type == "IK" else None) + tuple(getattr(c, k, None) for k in CON_FIELDS))
        if rows:
            out[pb.name] = rows
    return out


def ref_con_sig(cons):
    """The same signature from the G2 record ``{bone: {constraints: [...]}}``."""
    out = {}
    for bn, d in cons.items():
        rows = [(c["type"], c["name"], round(float(c["influence"]), 6), c.get("target"), c.get("pole_target"),
                 round(math.degrees(c["pole_angle"]), 6) if c["type"] == "IK" else None) + tuple(c.get(k) for k in CON_FIELDS)
                for c in d["constraints"]]
        if rows:
            out[bn] = rows
    return out


def drv_sig(ob):
    """Sorted ``(data_path, driver type, ((var name, var type, target id, data path), ...))`` of an object's drivers."""
    ad = ob.animation_data
    if ad is None:
        return []
    return sorted((fc.data_path, fc.driver.type, tuple((v.name, v.type, v.targets[0].id.name if v.targets[0].id else None,
                                                        v.targets[0].data_path) for v in fc.driver.variables)) for fc in ad.drivers)


def lock_sig(pb):
    return (bool(pb.lock_ik_x), bool(pb.lock_ik_y), bool(pb.lock_ik_z), bool(pb.use_ik_limit_x), round(pb.ik_min_x, 7), round(pb.ik_max_x, 7))


# --------------------------------------------------------------------------------------------------------------------------
# stages
# --------------------------------------------------------------------------------------------------------------------------

def stage_build(out, R, g2_dir=None):
    """Rebuild D01 into ``out`` (D01_hodling_rig.blend, skeleton.json, landmarks_used.json, mesh.npz, rig_recipe.json) and compare it
    with the G2 reference, re-extracted into ``g2_dir`` (default ``<out>/g2``). Fills ``R``; returns True when every gate holds."""
    import bpy
    import numpy as np

    import A1_g2_reference
    from rigcore import landmarks, recipe, template
    from rigkit import bl, control, intake, meshio, skeleton

    g2_dir = g2_dir or os.path.join(out, "g2")
    t_g2 = time.time()
    ref = A1_g2_reference.extract(g2_dir)  # always fresh: checks the sha256 of the G2 snapshot and of the copy
    gw = np.load(os.path.join(g2_dir, "g2_weights.npz"))
    R["g2"] = {"dir": g2_dir, "sha256": ref["sha256"], "copy": ref["copy"], "seconds": round(time.time() - t_g2, 2)}
    t0 = time.time()
    bl.new_empty_file()
    fam = template.load_family("S_legacy_D01")
    names = fam["builder"]["names"]
    col = bl.ensure_collection(names["collection"])
    mesh_ob, info = intake.import_glb(GLB, expected_sha256=GLB_SHA256, mesh_name=names["mesh"])
    info["normalize"] = intake.normalize(mesh_ob, H)
    info["packed"] = intake.pack_images()
    bl.move_to_collection(mesh_ob, col)
    intake.record_scene(info, "D01_hodling")
    rec = recipe.new_recipe("D01_hodling", glb=GLB, sha256=info["sha256"], family=fam["family"],
                            template=template.template_info(fam), factor=info["normalize"]["factor"], H=H)
    recipe.log_step(rec, "S2", {"H": H}, info["normalize"])
    R["intake"] = {k: info[k] for k in ("sha256", "vertices", "polygons", "triangles", "removed_empties")}
    R["intake"]["normalize"] = info["normalize"]
    R["intake"]["factor_vs_d01"] = abs(info["normalize"]["factor"] - 0.6794956867949569)
    V = meshio.rest_vertices(mesh_ob)
    R["intake"]["vertices_vs_g2_max_m"] = float(np.abs(V - gw["V"]).max())
    R["mesh_npz"] = meshio.export_mesh_npz(mesh_ob, os.path.join(out, "mesh.npz"), "D01_hodling", H,
                                           scale_factor=info["normalize"]["factor"], source_sha256=info["sha256"])

    lm = landmarks.from_d01_landmarks(LANDMARKS)
    skel, lm2, pre = skeleton.resolve_skeleton(fam, lm, H)
    recipe.log_step(rec, "S4.prebend", pre["params"], {"chains": pre["chains"]})
    landmarks.save_landmarks(os.path.join(out, "landmarks_used.json"), "D01_hodling", fam["family"], H, lm2)
    rt, rt_rep = skeleton.build_runtime(skel, names["runtime"], col, asset_id="D01_hodling")
    skel = skeleton.apply_flips(skel, rt_rep["flipped"])  # skeleton.json = the built armature (no flip expected here)
    template.save_skeleton(os.path.join(out, "skeleton.json"), skel)
    recipe.log_step(rec, "S4", rt_rep["params"], {"bend_tests_passed": rt_rep["bend_tests_passed"], "flipped": rt_rep["flipped"]})
    R["runtime_build"] = {k: rt_rep[k] for k in ("bones", "deform", "sockets", "bend_tests_passed", "bend_tests_total", "flipped")}
    R["runtime_build"]["bend_tests"] = rt_rep["bend_tests"]

    R["weights_groups"] = _apply_weights_by_index(mesh_ob, [str(g) for g in gw["groups"]], gw["W"])
    R["parent"] = intake.parent_to_armature(mesh_ob, rt)
    builder, binfo = control.builder_of(skel)  # carried in the skeleton (no family reload)
    R["builder_source"] = binfo
    cparams = control.control_params({"builder": builder})
    ct, ct_rep = control.build_control(rt, skel, lm2, names["control"], col, params=cparams, asset_id="D01_hodling")
    recipe.log_step(rec, "S5", cparams, {"pole_angles": ct_rep["pole_angles"], "coupling": ct_rep["coupling"]["rest_max_diff"]})
    R["control_build"] = {k: ct_rep[k] for k in ("kit", "bones", "fk", "helpers", "switches", "pole_angles")}
    R["control_build"]["coupling_rest"] = ct_rep["coupling"]["rest_max_diff"]
    R["checks"] = skeleton.check_runtime(rt, skel, mesh_ob, exempt=fam["builder"]["inside_exempt"], H=H)
    R["checks"].pop("inside", None)

    # ---------------------------------------------------------------- compare with G2
    cmp = {}
    rt_ref = {b["name"]: b for b in ref["runtime"]["bones"]}
    got_names = [b.name for b in rt.data.bones]
    cmp["runtime_same_names"] = set(got_names) == set(rt_ref)
    cmp["runtime_same_order"] = got_names == [b["name"] for b in ref["runtime"]["bones"]]
    hd = max(max(_vec_diff(b.head_local, rt_ref[b.name]["head"]), _vec_diff(b.tail_local, rt_ref[b.name]["tail"])) for b in rt.data.bones)
    md = max(_mat_diff(b.matrix_local, rt_ref[b.name]["matrix_local"]) for b in rt.data.bones)
    cmp["runtime_head_tail_max_m"] = hd
    cmp["runtime_matrix_max"] = md
    cmp["runtime_parents_equal"] = all((b.parent.name if b.parent else None) == rt_ref[b.name]["parent"] for b in rt.data.bones)
    cmp["runtime_deform_equal"] = all(b.use_deform == rt_ref[b.name]["deform"] for b in rt.data.bones)
    cmp["runtime_connect_scale_bbone_equal"] = all(not b.use_connect and b.inherit_scale == rt_ref[b.name]["inherit_scale"]
                                                   and b.bbone_segments == rt_ref[b.name]["bbone_segments"] for b in rt.data.bones)
    rolls = skeleton.read_rolls(rt)
    cmp["runtime_roll_max_rad"] = max(abs(math.remainder(rolls[n] - rt_ref[n]["roll"], 2 * math.pi)) for n in rolls)
    cmp["runtime_collection_list_equal"] = [c.name for c in rt.data.collections_all] == ref["runtime"]["collections"]
    cmp["runtime_bone_collections_equal"] = all([c.name for c in b.collections] == rt_ref[b.name]["collections"] for b in rt.data.bones)
    cmp["runtime_colors_equal"] = all(b.color.palette == rt_ref[b.name]["color"] for b in rt.data.bones)
    ct_ref = {b["name"]: b for b in ref["control"]["bones"]}
    c_names = [b.name for b in ct.data.bones]
    cmp["control_count"] = len(c_names)
    cmp["control_same_names"] = set(c_names) == set(ct_ref)
    cmp["control_same_order"] = c_names == [b["name"] for b in ref["control"]["bones"]]
    cmp["control_matrix_max"] = max(_mat_diff(b.matrix_local, ct_ref[b.name]["matrix_local"]) for b in ct.data.bones if b.name in ct_ref)
    cmp["control_head_tail_max_m"] = max(max(_vec_diff(b.head_local, ct_ref[b.name]["head"]), _vec_diff(b.tail_local, ct_ref[b.name]["tail"]))
                                         for b in ct.data.bones if b.name in ct_ref)
    c_rolls = skeleton.read_rolls(ct)
    cmp["control_roll_max_rad"] = max(abs(math.remainder(c_rolls[n] - ct_ref[n]["roll"], 2 * math.pi)) for n in c_rolls if n in ct_ref)
    cmp["control_parents_equal"] = all((b.parent.name if b.parent else None) == ct_ref[b.name]["parent"] for b in ct.data.bones if b.name in ct_ref)
    cmp["control_flags_equal"] = all(b.use_deform == ct_ref[b.name]["deform"] and b.use_connect == ct_ref[b.name]["connect"]
                                     and b.inherit_scale == ct_ref[b.name]["inherit_scale"] and b.bbone_segments == ct_ref[b.name]["bbone_segments"]
                                     for b in ct.data.bones if b.name in ct_ref)
    cmp["control_collection_list_equal"] = [c.name for c in ct.data.collections_all] == ref["control"]["collections"]
    cmp["control_collections_equal"] = all([c.name for c in b.collections] == ct_ref[b.name]["collections"] for b in ct.data.bones if b.name in ct_ref)
    cmp["control_colors_equal"] = all(b.color.palette == ct_ref[b.name]["color"] for b in ct.data.bones if b.name in ct_ref)
    # constraints (every recorded field), IK locks and limits, drivers, switches
    got_c, want_c = con_sig(ct), ref_con_sig(ref["control"]["constraints"])
    got_r, want_r = con_sig(rt), ref_con_sig(ref["runtime"]["constraints"])
    cmp["control_constraints_equal"] = got_c == want_c
    cmp["runtime_constraints_equal"] = got_r == want_r
    cmp["constraint_rows_compared"] = {"control": sum(len(v) for v in want_c.values()), "runtime": sum(len(v) for v in want_r.values())}
    if not (cmp["control_constraints_equal"] and cmp["runtime_constraints_equal"]):
        cmp["constraint_differences"] = {f"{side}:{bn}": {"got": got.get(bn), "g2": want.get(bn)}
                                         for side, got, want in (("control", got_c, want_c), ("runtime", got_r, want_r))
                                         for bn in sorted(set(got) | set(want)) if got.get(bn) != want.get(bn)}
    ref_locks = {bn: (*[bool(x) for x in d["lock_ik"]], bool(d["use_ik_limit_x"]), round(d["ik_min_x"], 7), round(d["ik_max_x"], 7))
                 for bn, d in ref["control"]["constraints"].items()}
    got_locks = {pb.name: lock_sig(pb) for pb in ct.pose.bones
                 if pb.name in ref_locks or pb.lock_ik_x or pb.lock_ik_y or pb.lock_ik_z or pb.use_ik_limit_x}
    cmp["ik_locks_equal"] = got_locks == ref_locks
    cmp["drivers_equal"] = drv_sig(ct) == sorted((d["path"], d["type"], tuple(tuple(v) for v in d["vars"])) for d in ref["control"]["drivers"])
    cmp["drivers_compared"] = len(ref["control"]["drivers"])
    cmp["runtime_drivers"] = [d[0] for d in drv_sig(rt)]  # the legacy rig has no twist bones: none expected
    cmp["switches_equal"] = {k: float(ct[k]) for k in ct.keys() if k.startswith("ik_")} == ref["control"]["switches"]
    cmp["pole_angles_deg"] = {k: v["angle_deg"] for k, v in ct_rep["pole_angles"].items()}
    cmp["pole_dev_rad_max"] = max(v["dev_rad"] for v in ct_rep["pole_angles"].values())
    cmp["pole_refined"] = {k: v["refined"] for k, v in ct_rep["pole_angles"].items()}
    me_mod = ref["mesh"]["modifiers"][0]
    m0 = mesh_ob.modifiers[0]
    cmp["mesh_modifier_equal"] = (len(mesh_ob.modifiers) == len(ref["mesh"]["modifiers"]) == 1 and m0.type == me_mod["type"]
                                  and m0.name == me_mod["name"] and m0.object.name == me_mod["object"]
                                  and m0.use_vertex_groups == me_mod["use_vertex_groups"] and m0.use_bone_envelopes == me_mod["use_bone_envelopes"]
                                  and m0.use_deform_preserve_volume == me_mod["use_deform_preserve_volume"])
    cmp["mesh_groups_equal"] = [g.name for g in mesh_ob.vertex_groups] == ref["mesh"]["groups"]
    objs = {o.name: {"type": o.type, "parent": o.parent.name if o.parent else None, "collections": [c.name for c in o.users_collection]}
            for o in bpy.data.objects}
    cmp["objects_equal"] = objs == {k: {kk: v[kk] for kk in ("type", "parent", "collections")} for k, v in ref["objects"].items()}
    cmp["objects_matrix_world_max"] = max(_mat_diff(o.matrix_world, ref["objects"][o.name]["matrix_world"]) for o in bpy.data.objects
                                          if o.name in ref["objects"])
    R["compare_g2"] = cmp
    acc = {
        "runtime_head_tail_le_1e-5": hd <= 1e-5,
        "runtime_matrix_le_1e-4": md <= 1e-4,
        "runtime_structure": cmp["runtime_same_names"] and cmp["runtime_same_order"] and cmp["runtime_parents_equal"]
                             and cmp["runtime_deform_equal"] and cmp["runtime_connect_scale_bbone_equal"] and len(got_names) == 35,
        "runtime_rolls_equal": cmp["runtime_roll_max_rad"] <= 1e-9,
        "runtime_collections_colors_equal": cmp["runtime_collection_list_equal"] and cmp["runtime_bone_collections_equal"]
                                            and cmp["runtime_colors_equal"],
        "control_45_same_names_order": cmp["control_count"] == 45 and cmp["control_same_names"] and cmp["control_same_order"],
        "control_matrix_le_1e-4": cmp["control_matrix_max"] <= 1e-4 and cmp["control_head_tail_max_m"] <= 1e-5,
        "control_rolls_equal": cmp["control_roll_max_rad"] <= 1e-9,
        "control_parents_flags_equal": cmp["control_parents_equal"] and cmp["control_flags_equal"],
        "control_collections_colors_equal": cmp["control_collection_list_equal"] and cmp["control_collections_equal"]
                                            and cmp["control_colors_equal"],
        "constraints_equal": cmp["control_constraints_equal"] and cmp["runtime_constraints_equal"]
                             and cmp["constraint_rows_compared"]["control"] > 0 and cmp["constraint_rows_compared"]["runtime"] > 0,
        "ik_locks_equal": cmp["ik_locks_equal"],
        "drivers_equal": cmp["drivers_equal"] and cmp["drivers_compared"] > 0 and cmp["runtime_drivers"] == [],
        "switches_equal": cmp["switches_equal"],
        "pole_angles_minus_90": all(abs(a + 90.0) < 1e-9 for a in cmp["pole_angles_deg"].values()) and len(cmp["pole_angles_deg"]) == 4,
        "mesh_modifier_groups_objects_equal": cmp["mesh_modifier_equal"] and cmp["mesh_groups_equal"] and cmp["objects_equal"]
                                              and cmp["objects_matrix_world_max"] == 0.0,
        "bend_tests_pass_no_flip": rt_rep["bend_tests_passed"] == rt_rep["bend_tests_total"] and not rt_rep["flipped"]
                                   and not any(b["roll_flipped"] for b in skel["bones"]),
        "builder_from_skeleton": binfo["source"] == "skeleton" and binfo["warning"] is None,
        "intake_vertices_equal_g2": R["intake"]["vertices_vs_g2_max_m"] == 0.0 and info["normalize"]["ok"],
        "checks_ok": R["checks"]["ok"],
    }
    R["acceptance_build"] = acc

    # ---------------------------------------------------------------- package like D01 and save
    bl.reset_pose(ct)
    bl.reset_pose(rt)
    sc = bpy.context.scene
    sc.unit_settings.system = "METRIC"
    sc.unit_settings.scale_length = 1.0
    sc.render.fps = 24
    sc.frame_start, sc.frame_end, sc.frame_current = 1, 24, 1
    bl.set_mode(ct, "OBJECT")
    rt.hide_set(True)
    blend = os.path.join(out, "D01_hodling_rig.blend")
    bl.save_main(blend)
    recipe.log_step(rec, "S9.save", {}, {"blend": blend})
    recipe.save_recipe(os.path.join(out, "rig_recipe.json"), rec)
    R["blend"] = blend
    R["build_seconds"] = round(time.time() - t0, 2)
    return all(acc.values())


def main():
    import argparse

    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=DEFAULT_OUT)
    ap.add_argument("--stages", default="build,functest,export")
    ap.add_argument("--g2", default=None, help="folder for the re-extracted G2 reference (default <out>/g2)")
    a = ap.parse_args(argv)
    os.makedirs(a.out, exist_ok=True)
    stages = [s.strip() for s in a.stages.split(",") if s.strip()]
    R = {"test": "A1_test_legacy_regression", "stages": stages}
    ok = True
    try:
        if "build" in stages:
            R["build_ok"] = stage_build(a.out, R, a.g2)
            ok &= R["build_ok"]
        if "functest" in stages:
            R["functest_ok"] = stage_functest(a.out, R)
            ok &= R["functest_ok"]
        if "export" in stages:
            R["export_ok"] = stage_export(a.out, R)
            ok &= R["export_ok"]
    except Exception as e:
        traceback.print_exc()
        R["error"] = repr(e)
        ok = False
    R["ok"] = bool(ok)
    from rigkit import bl

    with open(os.path.join(a.out, "legacy_regression.json"), "w", encoding="utf-8") as f:
        f.write(json.dumps(R, indent=1, default=str))
    summary = {"test": R["test"], "ok": R["ok"], "out": a.out}
    for k in ("acceptance_build", "acceptance_functest", "acceptance_export"):
        if k in R:
            summary[k] = R[k]
    if "error" in R:
        summary["error"] = R["error"]
    print(bl.json_line(summary))
    return 0 if ok else 1


#: D01 rig_function.json key -> rigkit functest key, where the names differ
_RENAMED = {"helmet_max": "head_region_max", "sack_max_mm": "region_max_mm"}  # D01 "sack_vertices" counts sack cloth only: not compared


def _numeric_diff(d01_test, mine):
    worst, keys = 0.0, []
    for k, v in d01_test.items():
        if k in ("test", "pass"):
            continue
        mk = _RENAMED.get(k, k)
        if mk not in mine:
            continue
        a, b = v, mine[mk]
        if isinstance(a, list) and isinstance(b, list) and len(a) == len(b):
            d = max(abs(float(x) - float(y)) for x, y in zip(a, b))
        elif isinstance(a, (int, float)) and isinstance(b, (int, float)) and not isinstance(a, bool):
            d = abs(float(a) - float(b))
        else:
            continue
        keys.append(k)
        worst = max(worst, d)
    return worst, keys


def stage_functest(out, R):
    from rigcore import npzio, template
    from rigkit import bl, functest

    blend = os.path.join(out, "D01_hodling_rig.blend")
    bl.open_file(blend)  # the saved file, reopened (as D01 v2_rig_function)
    ct, rt, me = bl.find("control", "D01_hodling"), bl.find("runtime", "D01_hodling"), bl.find("mesh", "D01_hodling")
    state = functest.open_state(ct, rt, me)
    skel = template.load_skeleton(os.path.join(out, "skeleton.json"))
    t0 = time.time()
    rep = functest.run(ct, rt, skel, me, mode="mesh")
    rep["seconds"] = round(time.time() - t0, 2)
    rep["open_state"] = state
    npzio.write_json(os.path.join(out, "rig_function.json"), rep)
    bones = functest.run(ct, rt, skel, me, mode="bones")  # the S5 (pre-skin) mode on the same rig
    npzio.write_json(os.path.join(out, "rig_function_bones.json"), bones)
    R["functest_bones_mode"] = {"passed": bones["passed"], "total": bones["total"], "extra_passed": bones["extra_passed"],
                                "extra_total": bones["extra_total"], "failed": [t["id"] for t in bones["tests"] if not t["pass"]],
                                "extra_failed": [t["id"] for t in bones["extra_tests"] if not t["pass"]]}
    d01 = json.load(open(D01_FUNC, encoding="utf-8"))
    rows = []
    for t_ref, t in zip(d01["control_tests"], rep["tests"]):
        d, keys = _numeric_diff(t_ref, t)
        rows.append({"d01": t_ref["test"], "rigkit": t["id"], "d01_pass": t_ref["pass"], "pass": t["pass"], "max_numeric_diff": d, "keys": keys})
    ext = {}
    for nm, e in rep["pose_extremes"].items():
        r = d01["pose_extremes"].get(nm)
        if r:
            ext[nm] = {"max_move_diff_m": abs(e["max_point_move_m"] - r["max_vertex_move_m"]),
                       "max_edge_growth_diff_mm": abs(e.get("max_edge_growth_mm", 0.0) - r["max_edge_growth_mm"])}
    inside_ref = d01["joints_inside_mesh"]
    inside_diff = sorted(k for k, v in rep.get("joints_inside_mesh", {}).items() if k in inside_ref and v["inside"] != inside_ref[k]["head_inside_mesh"])
    st_ref = d01["open_state"]
    R["functest"] = {"passed": rep["passed"], "total": rep["total"], "extra_passed": rep["extra_passed"], "extra_total": rep["extra_total"],
                     "failed": [t["id"] for t in rep["tests"] if not t["pass"]], "extra_failed": [t["id"] for t in rep["extra_tests"] if not t["pass"]],
                     "vs_d01": rows, "max_numeric_diff_vs_d01": max(r["max_numeric_diff"] for r in rows) if rows else None,
                     "pose_extremes_vs_d01": ext, "rest_eval_vs_stored_max_m": rep["rest_eval_vs_stored_max_m"],
                     "joints_inside_differ_from_d01": inside_diff, "seconds": rep["seconds"]}
    acc = {
        "d01_tests_20_of_20": rep["total"] == 20 and rep["passed"] == 20 and len(rows) == 20,
        "same_verdicts_as_d01": all(r["pass"] == r["d01_pass"] for r in rows),
        "extra_tests_pass": rep["extra_passed"] == rep["extra_total"],
        "bones_mode_16_of_16": bones["total"] == 16 and bones["passed"] == 16 and bones["extra_passed"] == bones["extra_total"],
        "pose_extremes_finite": rep["pose_extremes_all_finite"] and bones["pose_extremes_all_finite"],
        "sockets_follow": rep["socket_follow_all_ok"],
        "open_state_like_d01": state["actions"] == [] and state["pose_bones_identity"] and state["ik_props"] == st_ref["ik_props"]
                               and state["active_object"] == st_ref["active_object"] and state["mesh_vertex_groups"] == st_ref["mesh_vertex_groups"]
                               and [list(m) for m in state["modifiers"]] == [list(m) for m in st_ref["modifiers"]],
    }
    R["acceptance_functest"] = acc
    return all(acc.values())


def stage_export(out, R):
    from rigcore import npzio, template
    from rigkit import bl, export

    blend = os.path.join(out, "D01_hodling_rig.blend")
    bl.open_file(blend)
    rt, me, ct = bl.find("runtime", "D01_hodling"), bl.find("mesh", "D01_hodling"), bl.find("control", "D01_hodling")
    t0 = time.time()
    glb = export.export_test_glb(rt, me, os.path.join(out, "checks", "D01_hodling_runtime_check.glb"), ct)
    skel = template.load_skeleton(os.path.join(out, "skeleton.json"))
    func = os.path.join(out, "rig_function.json")
    ft = json.load(open(func, encoding="utf-8")) if os.path.exists(func) else None
    val = export.validate(glb["path"], GLB, H, blend, skel=skel, asset_id="D01_hodling", functest=ft)
    val["export"] = glb
    npzio.write_json(os.path.join(out, "validation.json"), val)
    d01 = json.load(open(D01_VALIDATION, encoding="utf-8"))
    keys = sorted(d01["A1"])
    same = {k: val["A1"][k]["pass"] == d01["A1"][k]["pass"] for k in keys}
    m, r = val["A1"], d01["A1"]
    numbers = {
        "A1.2_count": (m["A1.2"]["measured"]["count"], r["A1.2"]["measured"]["count"]),
        "A1.4_vertices": (m["A1.4"]["measured"]["vertices"], r["A1.4"]["measured"]["vertices"]),
        "A1.5_max_abs_sum_minus_1": (m["A1.5"]["measured"]["max_abs_sum_minus_1"], r["A1.5"]["measured"]["max_abs_sum_minus_1"]),
        "A1.6_histogram": (m["A1.6"]["measured"]["histogram"], {int(k): v for k, v in r["A1.6"]["measured"]["histogram"].items()}),
        "A1.7_distinct_joints_with_weight": (m["A1.7"]["measured"]["distinct_joints_with_weight"], r["A1.7"]["measured"]["distinct_joints_with_weight"]),
        "A1.8_max_abs_err": (m["A1.8"]["measured"]["max_abs_err"], r["A1.8"]["measured"]["max_abs_err"]),
        "A1.9_reimport_forward_max_m": (m["A1.9"]["measured"]["blender_reimport_forward_max_m"], r["A1.9"]["measured"]["blender_reimport_forward_max_m"]),
        "A1.10_runtime_sha256": (m["A1.10"]["measured"]["runtime_sha256"], r["A1.10"]["measured"]["runtime_sha256"]),
        "A1.11_bounds_y_max_m": (m["A1.11"]["measured"]["bounds_y_max_m"], r["A1.11"]["measured"]["bounds_y_max_m"]),
        "A1.13_zero_weight_bones": (sorted(m["A1.13"]["measured"]["zero_weight_bones"]), sorted(r["A1.13"]["measured"]["zero_weight_bones"])),
        "A1.14_glb_bone_max_scale_dev": (m["A1.14"]["measured"]["glb_bone_max_scale_dev"], r["A1.14"]["measured"]["glb_bone_max_scale_dev"]),
    }
    R["export"] = {"glb": glb["path"], "bytes": glb["bytes"], "seconds": round(time.time() - t0, 2), "A1_summary": val["A1_summary"],
                   "extra_summary": val["extra_summary"], "same_verdicts_as_d01": same,
                   "numbers_vs_d01": {k: {"rigkit": a, "d01": b, "equal": a == b} for k, (a, b) in numbers.items()},
                   "glb_sha256_equal_d01": glb["sha256"] == d01["inputs"]["runtime_check_glb_sha256"],
                   "source_consistency": val["source_consistency"]}
    acc = {
        "A1_14_of_14": val["A1_summary"]["checks"] == 14 and val["A1_summary"]["passed"] == 14,
        "same_verdicts_as_d01": all(same.values()) and len(keys) == 14,
        "extra_checks_pass": val["extra_summary"]["checks"] == 5 and not val["extra_summary"]["failed"],
        "no_validation_errors": not val["errors"] and not val["skipped_parts"],
        "glb_sha256_equal_d01": R["export"]["glb_sha256_equal_d01"],
    }
    R["acceptance_export"] = acc
    return all(acc.values())


if __name__ == "__main__":
    sys.exit(main())
