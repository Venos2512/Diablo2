"""Owner C: the pure-Python parts of rigkit.poses / rigkit.legacy_d01 / rigkit.render (no Blender): positive-text parsing, the
sign-test rule, ROM planning from the H/S templates, compound plans, the D01 legacy specs, chunk merging, render shot planning
(clusters, chunk ranges). Runs in rigkit-env:

    E:\\tools\\rigkit-env\\Scripts\\python.exe -I -m pytest scripts/tests/rigkit -q -k C_ -p no:cacheprovider
"""
import os

import numpy as np
import pytest

from rigcore import npzio, template
from rigkit import legacy_d01, poses as RP, render as R


def test_C_positive_direction():
    assert RP.positive_direction("elbow goes up (+Z)", "L") == (0.0, 0.0, 1.0)
    assert RP.positive_direction("elbow goes up (+Z)", "R") == (0.0, 0.0, 1.0)  # explicit axes are world axes
    assert RP.positive_direction("knee goes outward, away from the midline", "L") == (1.0, 0.0, 0.0)
    assert RP.positive_direction("knee goes outward, away from the midline", "R") == (-1.0, 0.0, 0.0)
    assert RP.positive_direction("either; symmetric range", "L") is None
    assert RP.positive_direction(None, "L") is None
    assert RP.positive_direction("hand goes forward", None) == (0.0, -1.0, 0.0)
    with pytest.raises(ValueError):
        RP.positive_direction("sideways somehow", "L")


def test_C_plan_rom_counts_tags_and_skips():
    fam = template.expand_sides(template.load_family("S"))
    specs, skipped = RP.plan_rom(fam)
    # per side: 9 entries with both signs (4 samples) + elbow and knee (0..max: 2 samples) = 40; centre: 4 entries x 4 = 16;
    # + toe flexion +-30 deg (4 samples per side: S has Toe bones, fix round 3)
    assert len(specs) == 2 * 40 + 16 + 2 * 4 and not skipped
    names = [s["name"] for s in specs]
    assert len(set(names)) == len(names)
    sa = {s["name"]: s for s in specs if s["joint"] == "shoulder_abduction_L"}
    assert list(sa) == ["shoulder_abduction_L_p40", "shoulder_abduction_L_p80", "shoulder_abduction_L_m45", "shoulder_abduction_L_m90"]
    assert "standard" in sa["shoulder_abduction_L_p40"]["tags"] and "extreme" in sa["shoulder_abduction_L_p80"]["tags"]
    op = sa["shoulder_abduction_L_p80"]["ops"][0]
    assert op["bones"] == ["ctl_L_UpperArm"] and op["axis"] == "Z" and op["positive"] == "elbow goes up (+Z)"
    assert set(sa["shoulder_abduction_L_p80"]["ik"]) == {"ik_arm_L", "ik_arm_R", "ik_leg_L", "ik_leg_R"}  # FK for joint ROM
    assert all(v == 0.0 for v in sa["shoulder_abduction_L_p80"]["ik"].values())
    # X entries never carry a positive text (their sign follows the bend tests)
    assert all(o["positive"] is None for s in specs for o in s["ops"] if o["axis"] == "X")
    # feet: a hip entry frees its own foot only; arm and spine entries keep both feet planted
    hip = next(s for s in specs if s["name"] == "hip_flexion_L_m120")
    assert "planted_R" in hip["tags"] and "planted_L" not in hip["tags"]
    sp = next(s for s in specs if s["name"] == "spine_twist_p45")
    assert {"planted_L", "planted_R"} <= set(sp["tags"]) and sp["ops"][0]["bones"] == ["ctl_spine_01", "ctl_spine_02", "ctl_chest"]
    assert "forearm_twist_R" in next(s for s in specs if s["name"] == "forearm_pronation_R_m80")["tags"]
    # missing controls (D01 has no clavicle) are skipped and reported
    controls = {o["bones"][0] for s in specs for o in s["ops"]} | {b for s in specs for o in s["ops"] for b in o["bones"]}
    controls -= {"ctl_L_Clavicle", "ctl_R_Clavicle"}
    specs2, skipped2 = RP.plan_rom(fam, controls)
    assert len(specs2) == len(specs) - 8 and [s["id"] for s in skipped2] == ["clavicle_raise_L", "clavicle_raise_R"]


def test_C_extra_rom_toes_and_ears():
    """Review r2 item 1: toe flexion +-30 deg (references/deformation-qa.md) and ear motion +-25 deg (D01 aux_motion) join the
    generic ROM when the control bones exist; about the hinge X, both signs, the toe frees its own foot; nothing is added when
    the bones are missing or the family already has an entry for the joint."""
    fam = template.expand_sides(template.load_family("S_legacy_D01"))
    assert RP.extra_rom(fam, set()) == []  # no control bones: nothing added
    controls = {b for e in fam["rom"] for b in e["control"].split("+")} | {"ctl_L_Toe", "ctl_R_Toe", "ctl_L_ear", "ctl_R_ear"}
    specs, skipped = RP.plan_rom(fam, controls)
    extra = [s for s in specs if s["joint"].startswith(("toe_flexion", "ear_motion"))]
    assert [s["name"] for s in extra] == [
        "toe_flexion_L_p15", "toe_flexion_L_p30", "toe_flexion_L_m15", "toe_flexion_L_m30",
        "toe_flexion_R_p15", "toe_flexion_R_p30", "toe_flexion_R_m15", "toe_flexion_R_m30",
        "ear_motion_L_p12.5", "ear_motion_L_p25", "ear_motion_L_m12.5", "ear_motion_L_m25",
        "ear_motion_R_p12.5", "ear_motion_R_p25", "ear_motion_R_m12.5", "ear_motion_R_m25"] and not skipped
    toe = next(s for s in extra if s["name"] == "toe_flexion_L_p30")
    assert toe["ops"][0]["bones"] == ["ctl_L_Toe"] and toe["ops"][0]["axis"] == "X" and toe["ops"][0]["positive"] is None
    assert "extreme" in toe["tags"] and "planted_R" in toe["tags"] and "planted_L" not in toe["tags"]
    ear = next(s for s in extra if s["name"] == "ear_motion_R_m12.5")
    assert ear["ops"][0]["bones"] == ["ctl_R_ear"] and ear["ops"][0]["deg"] == -12.5 and "standard" in ear["tags"]
    assert {"planted_L", "planted_R"} <= set(ear["tags"]) and all(s["ik"] for s in extra)  # FK (all switches off)
    # only the bones that exist; without a control list the family's runtime bones decide (S: Toe, no ears)
    sp, _ = RP.plan_rom(fam, controls - {"ctl_L_ear", "ctl_R_ear", "ctl_R_Toe"})
    assert [s["name"] for s in sp if s["joint"].startswith(("toe", "ear"))] == [s["name"] for s in extra[0:4]]
    s_fam = template.expand_sides(template.load_family("S"))
    assert {e["id"] for e in RP.extra_rom(s_fam)} == {"toe_flexion_L", "toe_flexion_R"}
    # a family that has its own toe entry keeps it (no duplicate)
    own = dict(fam, rom=fam["rom"] + [{"joint": "toe_flexion", "control": "ctl_L_Toe", "axis": "X", "range_deg": [-20, 20],
                                       "id": "toe_flexion_L", "side": "L"}])
    assert [e["id"] for e in RP.extra_rom(own, controls)] == ["ear_motion_L", "ear_motion_R"]


def test_C_plan_compound_from_rest_bones():
    fam = template.expand_sides(template.load_family("S"))
    H = 0.5
    bones = {"chest": ([0, 0.0, 0.3], [0, 0, 0.35]), "head": ([0, 0, 0.37], [0, 0, 0.5])}
    for s, x in (("L", 0.05), ("R", -0.05)):
        bones[f"{s}_Thigh"] = ([x, 0, 0.18], [x, 0, 0.11])
        bones[f"{s}_Calf"] = ([x, 0, 0.11], [x, 0, 0.05])
    specs, skipped = RP.plan_compound(fam["rom_compound"], bones, H, fam)
    assert [s["name"] for s in specs] == fam["rom_compound"] and not skipped
    sq = specs[0]["ops"]
    assert sq[0] == {"op": "move", "bone": "ctl_cog", "delta": [0.0, 0.0, -0.075]}  # D01: cog -7.5 cm at H = 0.5
    ls = next(s for s in specs if s["name"] == "long_step")["ops"]
    assert ls[0]["delta"][1] == pytest.approx(-0.385 * 0.13)  # step scaled by the hip-to-ankle reach (0.13 m)
    hk = next(s for s in specs if s["name"] == "hip_flex_knee_bent")
    assert set(hk["ik"]) == {"ik_leg_L", "ik_leg_R"} and "planted_L" not in hk["tags"]
    specs3, skipped3 = RP.plan_compound(["squat", "moonwalk"], bones, H, fam)
    assert [s["id"] for s in skipped3] == ["moonwalk"]


def test_C_sign_from_test_rule():
    good = RP.sign_from_test([0, 0, 0], [0.002, 0.0, 0.015], [0, 0, 1])
    assert good["sign"] == 1 and not good["weak"] and good["cos"] > 0.9
    neg = RP.sign_from_test([0, 0, 0], [0.0, 0.0, -0.015], [0, 0, 1])
    assert neg["sign"] == -1 and not neg["weak"]
    assert RP.sign_from_test([0, 0, 0], [0, 0, 0], [0, 0, 1])["weak"]  # no motion
    assert RP.sign_from_test([0, 0, 0], [0.015, 0.0, 0.003], [0, 0, 1])["weak"]  # |cos| = 0.196 < 0.3


def test_C_legacy_d01_specs_moved_out_of_poses():
    specs = legacy_d01.specs()
    assert [s["name"] for s in specs] == list(legacy_d01.POSE_ORDER) and len(specs) == 17
    assert not hasattr(RP, "legacy_d01_specs") and not hasattr(RP, "D01_POSE_ORDER")  # N4: D01-only code lives elsewhere
    assert all(s["ops"] == [{"op": "action", "action": "QA_pose_" + s["name"]}] for s in specs)
    free = [s["name"] for s in specs if "planted_L" not in s["tags"]]
    assert free == ["hip_flex_fk", "hip_flex_fk_loin", "hip_abduct_fk"]


def test_C_merge_chunks(tmp_path):
    n, b = 5, 3
    rest_mats = np.stack([np.eye(4)] * b)
    paths = []
    for i0, names in ((0, ["rest", "a"]), (2, ["b"])):
        p = len(names)
        P = np.random.default_rng(i0).normal(size=(p, n, 3)).astype(np.float32)
        meta = {"asset_id": "x", "H": 0.5, "chunk": [i0, i0 + p], "tags": {k: ["t" + k] for k in names},
                "specs": {k: {"name": k} for k in names}}
        path = os.path.join(str(tmp_path), f"poses_chunk_{i0:04d}.npz")
        npzio.save_poses(path, names, P, ["r", "s", "t"], np.zeros((p, b, 3), np.float32), np.ones((p, b, 3), np.float32), meta=meta,
                         extra={"pose_mats": np.stack([rest_mats] * p), "rest_mats": rest_mats,
                                "parents": np.array([-1, 0, 1], np.int32), "deform": np.ones(b, bool)})
        paths.append(path)
    out = RP.merge_chunks(paths, os.path.join(str(tmp_path), "poses.npz"), {"extra_meta": 1})
    m = npzio.load_poses(out)
    assert m["names"].tolist() == ["rest", "a", "b"] and m["P"].shape == (3, n, 3)
    assert m["meta"]["rest_index"] == 0 and m["meta"]["extra_meta"] == 1 and "chunk" not in m["meta"]
    assert set(m["meta"]["tags"]) == {"rest", "a", "b"} and m["extra"]["pose_mats"].shape == (3, b, 4, 4)


def test_C_render_clusters_and_chunk_ranges():
    pts = np.concatenate([np.random.default_rng(1).normal(0, 0.002, (30, 3)), np.random.default_rng(2).normal(0, 0.002, (12, 3)) + 0.2])
    w = np.r_[np.ones(30), np.full(12, 5.0)]
    cl = R.clusters(pts, 0.03, w, max_k=2)
    assert len(cl) == 2 and sorted(cl[0].tolist()) == list(range(30, 42)) and sorted(cl[1].tolist()) == list(range(30))
    assert len(R.clusters(pts, 0.03, w, max_k=1)) == 1
    jobs = [{"res": 900}] * 50 + [{"res": 1400}] * 5
    rng = R.chunk_ranges(jobs, max_seconds=3.0, setup_seconds=1.0)
    assert rng[0][0] == 0 and rng[-1][1] == 55 and all(a < b for a, b in rng)
    assert all(rng[i][1] == rng[i + 1][0] for i in range(len(rng) - 1))
    est = [1.0 + sum(R.SHOT_SECONDS_900 * (j["res"] / 900) ** 2 for j in jobs[a:b]) for a, b in rng]
    assert max(est) <= 3.0 + 1e-9


def test_C_render_plan_from_poses_only(tmp_path):
    """plan_shots needs no Blender state: boxes come from poses.npz positions; per-bone shots from the weights."""
    n, b = 30, 2
    rng = np.random.default_rng(4)
    P = rng.normal(0, 0.05, (2, n, 3)).astype(np.float32)
    P[1, :, 0] += 0.3
    path = os.path.join(str(tmp_path), "poses.npz")
    npzio.save_poses(path, ["rest", "move"], P, ["a", "b"], np.zeros((2, b, 3), np.float32), np.ones((2, b, 3), np.float32),
                     meta={"rest_index": 0, "H": 0.5, "specs": {}}, extra={"deform": np.ones(b, bool), "parents": np.array([-1, 0])})
    po = npzio.load_poses(path)
    W = np.zeros((n, 2), np.float32)
    W[:15, 0] = 1
    W[15:, 1] = 1
    plan = R.plan_shots(po, W, ["a", "b"], what=("skel", "bones", "poses"))
    names = [j["name"] for j in plan["jobs"]]
    assert {"skel_front", "b_a_front", "b_b_back", "p_move_arpg", "p_rest_front"} <= set(names)
    box = next(j["box"] for j in plan["jobs"] if j["name"] == "p_move_front")
    assert np.allclose(box[0], P[1].min(0), atol=1e-6) and np.allclose(box[1], P[1].max(0), atol=1e-6)
    assert plan["info"]["bone_stats"]["a"]["verts_gt_0.5"] == 15


def test_C_render_flag_tiles_priority_merge_and_xray(tmp_path):
    """plan_flags: red before yellow, FLAG_PRIORITY inside a colour, the standard-pose penetration merged into the extreme one
    when both point at the same region, the deepest penetration as a CUTAWAY tile with dots (fix round 3: replaces its X-ray
    tile; the joint-drift tile stays X-ray), at most 8 tiles."""
    n = 40
    rng = np.random.default_rng(9)
    P = rng.normal(0, 0.05, (3, n, 3)).astype(np.float32)
    bones = ["pelvis", "L_ForeArm", "L_Hand", "helmet", "L_Foot"]
    path = os.path.join(str(tmp_path), "poses.npz")
    npzio.save_poses(path, ["rest", "a", "b"], P, bones, P[:, :5].copy(), P[:, :5] + 0.01, meta={"rest_index": 0, "H": 0.5},
                     extra={"deform": np.ones(5, bool), "parents": np.array([-1, 0, 1, 0, 0])})
    po = npzio.load_poses(path)
    pen = np.full((3, n), -1.0, np.float32)
    pen[2, :6] = [0.004, 0.003, 0.0, 0.0, 0.002, 0.001]
    torn = np.zeros((3, n), np.uint8)
    torn[1, 25:29] = 1
    area = np.zeros((3, n), np.float32)
    area[1, 30:34] = 0.3
    fields = {"names": np.array(["rest", "a", "b"]), "penetration": pen, "torn": torn, "area": area,
              "region_of_vertex": np.r_[np.zeros(20, np.int16), np.ones(20, np.int16)], "region_names": np.array(["helmet", "L_ForeArm"])}
    names = ["deform_torn_edges_extreme", "deform_area_change", "deform_joint_volume", "deform_candy_wrapper", "joint_core_heads_inside",
             "deform_penetration_standard", "deform_penetration_extreme_depth", "deform_torn_edges_standard", "deform_ground_contact"]
    lights = {k: "red" for k in names}
    lights["deform_ground_contact"] = "yellow"
    det = {"deform_torn_edges_extreme": {"max_region_fraction": 0.1, "n_torn": 4, "at": {"pose": "a", "region": "L_ForeArm"}},
           "deform_torn_edges_standard": {"max_torn_edges": 4, "at": {"pose": "a", "region": "L_ForeArm"}},
           "deform_area_change": {"max_area_fraction": 0.2, "at": {"pose": "a", "region": "L_ForeArm"}},
           "deform_joint_volume": {"min_ratio": 0.5, "joint": "elbow_L", "pose": "a"},
           "deform_candy_wrapper": {"min_ratio": 0.6, "side": "L", "pose": "a", "slice": "wrist"},
           "joint_core_heads_inside": {"max_outside_m": 0.002, "at": {"pose": "a", "bone": "L_Hand"}},
           "deform_penetration_standard": {"max_faces": 12, "at": {"pose": "b", "region": "helmet"}},
           "deform_penetration_extreme_depth": {"max_depth_m": 0.004, "at": {"pose": "b", "region": "helmet"}},
           "deform_ground_contact": {"worst_mm": 4.0, "side": "L", "pose": "a"}}
    metrics = {"lights": lights, "summary": {"lights_detail": det},
               "joints": {"volume": {"elbow_L": {"child": "L_ForeArm", "radius_m": 0.01}}}}
    tiles = R.plan_flags(po, fields, metrics, 0.5)
    order = [(t["metric"], t["xray"], t["cut"] is not None) for t in tiles]
    # 7 red metrics (the standard-pose penetration merged into the extreme one: same region) + the yellow ground contact = 8
    assert order == [("deform_penetration_extreme_depth", False, True), ("deform_torn_edges_standard", False, False),
                     ("deform_torn_edges_extreme", False, False), ("deform_joint_volume", False, False),
                     ("deform_candy_wrapper", False, False), ("deform_area_change", False, False),
                     ("joint_core_heads_inside", True, False), ("deform_ground_contact", False, False)], order
    assert tiles[0]["dots"] and "penetration_standard" in tiles[0]["value"] and tiles[0]["also"] == ["deform_penetration_standard"]
    assert tiles[0]["name"].startswith("flag_0c_") and tiles[-1]["light"] == "yellow"
    # without the yellow metric a slot is left: the uncut textured twin of the cutaway is added next to it
    lights2 = {k: v for k, v in lights.items() if v == "red"}
    tiles2 = R.plan_flags(po, fields, dict(metrics, lights=lights2), 0.5)
    assert [(t["metric"], t["cut"] is not None, bool(t.get("context"))) for t in tiles2[:2]] == [
        ("deform_penetration_extreme_depth", False, True), ("deform_penetration_extreme_depth", True, False)] and len(tiles2) == 8
    assert not tiles2[0]["dots"] and tiles2[1]["dots"] and tiles2[0]["shade"] == "texture" and tiles2[1]["color"] == ["pen", "b"]
    assert len({t["name"] for t in tiles}) == 8
    # with the deepest pair of metrics.json: caption "<intruder> into <region>", the view faces the hot spot from the local body
    # centre, the cut plane sits just in front of the hot spot
    hot = (P[2, :6].mean(0) + np.array([0.0, 0.3, 0.0])).tolist()  # far behind the body: a back view
    det3 = dict(det, deform_penetration_extreme_depth=dict(det["deform_penetration_extreme_depth"], pair={
        "intruder": "helmet", "into": "sack", "target": "island", "depth": 0.004, "hot": hot, "w": 1.0}))
    t3 = R.plan_flags(po, fields, dict(metrics, summary={"lights_detail": det3}), 0.5)[0]
    assert t3["caption"] == "helmet into sack" and "helmet into sack" in t3["value"] and t3["view"] == "back"
    c = (np.asarray(t3["box"][0]) + np.asarray(t3["box"][1])) / 2
    assert t3["cut"] == pytest.approx(float(np.dot(np.asarray(hot) - c, [0, 1, 0])) + R.CUT_IN_FRONT_H * 0.5)


def test_C_render_views_facing_hinge_and_wrap():
    """facing_view picks the horizontal view on the hot spot's side of the local body centre; hinge_view looks along the posed
    local X from the outside; wrap_text never drops words."""
    rng = np.random.default_rng(3)
    P = rng.normal(0, 0.02, (400, 3)) + [0, 0, 0.4]
    assert R.facing_view(P, [0.0, 0.08, 0.4], 0.5) == "back"
    assert R.facing_view(P, [0.0, -0.08, 0.4], 0.5) == "front"
    assert R.facing_view(P, [0.08, 0.0, 0.4], 0.5) == "left" and R.facing_view(P, [-0.08, 0.0, 0.4], 0.5) == "side"
    assert R.facing_view(P, [0.06, 0.06, 0.4], 0.5) == "bl" and R.facing_view(P, [-0.06, -0.06, 0.4], 0.5) == "fr"
    assert R.facing_view(P, [0.001, 0.0, 0.4], 0.5, "fl") == "fl"  # on the body axis: the fallback
    # the context tile of a cutaway turns 90 deg toward the hot spot's side (a back view -> a side view)
    assert R.context_view("back", [-0.02, 0.08, 0.4], P) == "side" and R.context_view("back", [0.02, 0.08, 0.4], P) == "left"
    assert R.context_view("front", None, P) in ("side", "left")
    pm = np.stack([np.eye(4)] * 2)[None].repeat(2, 0)
    pm[1, 1, :3, 3] = [0.1, 0, 0.4]
    pm[1, 1, :3, 0] = [-1.0, 0, 0]  # posed hinge X points to -X, the joint sits at +X: look from +X
    po = {"names": np.array(["rest", "bend"]), "bone_names": np.array(["a", "b"]), "extra": {"pose_mats": pm}}
    assert R.hinge_view(po, "bend", "b", P) == [1.0, 0.0, 0.0]
    assert R.hinge_view({"names": po["names"], "bone_names": po["bone_names"], "extra": {}}, "bend", "b", P) is None
    from PIL import ImageFont

    fnt = ImageFont.load_default()
    text = "27.54 mm deep: helmet into sack; also red penetration_standard: 82 faces in neck_bend_m40"
    rows = R.wrap_text(text, fnt, 120)
    assert len(rows) > 1 and " ".join(rows) == text
