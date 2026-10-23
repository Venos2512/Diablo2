"""Owner C: D01 acceptance of P3 writer C (fix round 3) - pipeline outputs vs the D01 v4 reference numbers (validation.json,
sack_flap.json) and the review r1 / r2 findings: rigid candidate loses every hinge region, ball-occupancy joint volumes, candy
wrapper with the wrist band, flag sheet, parity, the S-template run and the MCP chunk timing; round 3: regions that no pose
exercises (legacy toes), toe / ear ROM entries, the deepest penetration pair + inside-test margin, cutaway / hinge flag tiles,
region scores of writer B's candidates keyed by meta.candidate.

The outputs come from ``scripts/tests/rigkit/C_run_d01_pipeline.py`` (default --out E:\\tmp_rigkit\\C_r3); the tests skip when they
are missing. D01 files are read only (sys.dont_write_bytecode is set by conftest before d01_skin is imported).
"""
import json
import os
import sys

import numpy as np
import pytest

from rigcore import npzio, schema

OUT = r"E:\tmp_rigkit\C_r3"
LEG = os.path.join(OUT, "d01", "legacy")
ROM = os.path.join(OUT, "d01", "rom")
CAND = os.path.join(OUT, "d01", "candidates")
SRUN = os.path.join(OUT, "s_template", "run")
B_KEYS = {"A_region", "B_transfer", "C_unirig"}  # meta.candidate of writer B's candidate files
D01_RIG = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "..", "..", "ashlar", "3d", "monsters",
                                        "D01_hodling", "rig"))
BRIEF = {"head_turn": 15.8, "squat": 11.0, "twist_p45": 10.8, "twist_m45": 7.5, "hands_crossed": 22.9, "hip_flex_fk": 8.6}
# D01 hinge regions (bone regions of the G2 weights): knees, elbows, hips (+ pelvis side), shoulders (+ chest side), ankles, wrists,
# neck (the neck bone dominates no vertex, so the neck crease lies in the head and chest regions)
HINGE = ["L_Calf", "R_Calf", "L_ForeArm", "R_ForeArm", "L_Thigh", "R_Thigh", "pelvis", "L_UpperArm", "R_UpperArm", "chest",
         "L_Foot", "R_Foot", "L_Hand", "R_Hand", "head"]


def _json(p):
    if not os.path.exists(p):
        pytest.skip(f"missing {p}: run scripts/tests/rigkit/C_run_d01_pipeline.py first")
    with open(p, "rb") as f:
        return json.loads(f.read().decode("utf-8"))


@pytest.fixture(scope="module")
def metrics():
    return _json(os.path.join(LEG, "metrics", "metrics.json"))


@pytest.fixture(scope="module")
def rom():
    return _json(os.path.join(ROM, "metrics", "metrics.json"))


@pytest.fixture(scope="module")
def ref():
    return _json(os.path.join(D01_RIG, "validation.json"))


def test_C_d01_metrics_schema(metrics):
    schema.validate_metrics(metrics)
    assert len(metrics["poses"]) == 17 and "legacy_d01" in metrics


def test_C_d01_edge_growth_matches(metrics, ref):
    """Max absolute edge growth per pose within 0.5 mm of D01 v4, in the D01 definition (raw edges) and the generic welded one."""
    rows = []
    for nm, r in ref["pose_extremes"].items():
        leg = metrics["legacy_d01"]["pose_extremes"][nm]["max_edge_growth_mm"]
        gen = metrics["poses"][nm]["_mesh"]["edge_growth_max_mm"]
        rows.append((nm, r["max_edge_growth_mm"], leg, gen))
        assert abs(leg - r["max_edge_growth_mm"]) <= 0.5, (nm, leg, r["max_edge_growth_mm"])
        assert abs(gen - r["max_edge_growth_mm"]) <= 0.5, (nm, gen, r["max_edge_growth_mm"])
        p99 = metrics["legacy_d01"]["pose_extremes"][nm]["p99_edge_growth_mm"]
        assert abs(p99 - r["p99_edge_growth_mm"]) <= 0.05, (nm, p99, r["p99_edge_growth_mm"])
    for nm, v in BRIEF.items():  # the values quoted in the brief (qa_report v4, rounded to 0.1 mm)
        assert abs(metrics["legacy_d01"]["pose_extremes"][nm]["max_edge_growth_mm"] - v) <= 0.5
    assert len(rows) == 17


def test_C_d01_soles(metrics, ref):
    for nm, r in ref["pose_extremes"].items():
        for s in ("L", "R"):
            assert abs(metrics["legacy_d01"]["pose_extremes"][nm][f"sole_min_z_{s}_mm"] - r[f"sole_min_z_{s}_mm"]) <= 0.01


def test_C_d01_loincloth(metrics):
    ff = metrics["legacy_d01"]["flap_front"]
    u, c = ff["hip_flex_fk"]["vs_rest"], ff["hip_flex_fk_loin"]["vs_rest"]
    assert u["new_inside_vertices_thigh"] == 4 and u["new_intersecting_triangles_thigh"] == 9
    assert u["max_depth_thigh_mm"] == pytest.approx(0.7565, abs=0.0005)
    assert u["new_covered_by_thigh_vertices"] == 4
    assert c["new_inside_vertices_thigh"] == 0 and c["new_intersecting_triangles_thigh"] == 0 and c["new_covered_by_thigh_vertices"] == 0
    assert ff["rest"]["inside_vertices_thigh"] == 0
    # the generic method sees the same intrusion: L_Thigh faces in penetrating pairs (deeper than eps = 0.25 mm), depth 0.76 mm
    gen = metrics["poses"]["hip_flex_fk"]["L_Thigh"]["penetration"]
    assert gen["n_tris"] > 0 and gen["max_depth"] == pytest.approx(0.7565e-3, abs=0.01e-3)
    assert metrics["poses"]["hip_flex_fk_loin"]["L_Thigh"]["penetration"]["n_tris"] == 0


def test_C_d01_planted_overlap_validation(metrics):
    """D01 B2 method check reproduced: flap moved back 0/4/8/12 mm at rest -> the same counts as D01 v4 (sack_flap.json)."""
    sf = _json(os.path.join(D01_RIG, "checks", "sack_flap.json"))["flap_validation"]["synthetic_shift"]
    ours = metrics["legacy_d01"]["planted_validation"]
    assert ours["synthetic_monotonic"]
    for a, b in zip(ours["synthetic_shift"], sf):
        assert a["inside_vertices_total"] == b["inside_vertices_total"]
        assert a["intersecting_triangles_total"] == b["intersecting_triangles_total"]
        assert a["max_depth_other_mm"] == pytest.approx(b["max_depth_other_mm"], abs=0.01)


def test_C_d01_parity():
    rep = _json(os.path.join(LEG, "parity", "parity.json"))
    assert rep["pass"] and rep["max_m"] <= 1e-4 * 0.5 / 1.8 and rep["weights_check_ok"] and rep["weights_check_max"] <= 1e-6
    assert rep["unmatched_glb_vertices"] == 0 and rep["welded_ids_covered"] == rep["n_welded_source"]
    assert len(rep["per_pose"]) == 17


def test_C_d01_legacy_classes_match_d01_skin():
    """The geometry-only flap_front / body classes of solvers.legacy_d01.classes equal d01_skin.compute's."""
    mesh_p = os.path.join(LEG, "mesh.npz")
    if not os.path.exists(mesh_p):
        pytest.skip("missing D01 mesh.npz")
    tools = os.path.join(D01_RIG, "tools")
    sys.dont_write_bytecode = True
    sys.path.insert(0, tools)
    try:
        import d01_skin
    finally:
        sys.path.remove(tools)
    from solvers import legacy_d01, metrics as M

    m = npzio.load_mesh(mesh_p)
    with np.errstate(invalid="ignore", divide="ignore"):  # zero colours: d01_skin's horn test divides 0 / 0
        res = d01_skin.compute(m["V"], np.zeros_like(m["V"]), m["F"].astype(np.int64))
    cls = res["cls"][res["inv"]]
    cx = M.Context(m, npzio.load_poses(os.path.join(LEG, "poses.npz")), npzio.load_weights(os.path.join(LEG, "weights.npz")))
    cl = legacy_d01.classes(cx)
    assert np.array_equal(cl["flap_w"][cx.weld], cls == "flap_front")
    assert np.array_equal(cl["body_w"][cx.weld], np.isin(cls, ("main", "ear", "strap", "sack")))


@pytest.mark.parametrize("which", ["legacy", "rom"])
def test_C_d01_rigid_candidate_loses_every_hinge_region(which):
    """Review r1 regression: the argmax one-hot ("rigid") candidate of the G2 weights loses every D01 hinge region."""
    d = LEG if which == "legacy" else ROM
    sc = _json(os.path.join(d, "metrics", "region_scores.json"))
    det = _json(os.path.join(d, "metrics", "region_scores_detail.json"))
    prim = det["primary"]
    lost = {r: (sc[r][prim], sc[r]["rigid"]) for r in HINGE}
    assert all(det["regions"][r]["decision"]["winner"] == prim for r in HINGE), lost
    assert all(sc[r]["rigid"] > sc[r][prim] for r in HINGE), lost


def test_C_d01_rom_ball_volumes(rom):
    """Ball occupancy (r = 0.8 x limb radius) in the review's poses; the review probe radius (factor 2) reproduces its numbers."""
    v = rom["joints"]["volume"]
    assert v["knee_L"]["ratio"]["knee_flexion_L_p140"] == pytest.approx(0.58, abs=0.03)
    assert v["knee_R"]["ratio"]["knee_flexion_R_p140"] == pytest.approx(0.58, abs=0.03)
    assert 0.6 < v["hip_L"]["ratio"]["hip_flexion_L_m120"] < 0.85  # 0.79 at r = 0.8 x limb radius
    assert 0.6 < v["shoulder_R"]["ratio"]["arms_crossed"] < 0.85  # 0.73
    assert all(v[k]["measurable"] for k in ("knee_L", "knee_R", "hip_L", "hip_R", "shoulder_L", "shoulder_R", "elbow_L", "elbow_R"))
    assert rom["lights"]["deform_joint_volume"] == "red"
    b2 = _json(os.path.join(ROM, "metrics_ball2", "metrics.json"))["joints"]["volume"]
    assert b2["knee_L"]["ratio"]["knee_flexion_L_p140"] == pytest.approx(0.58, abs=0.03)  # review: 0.58
    assert b2["hip_L"]["ratio"]["hip_flexion_L_m120"] == pytest.approx(0.67, abs=0.03)  # review: 0.67
    assert b2["shoulder_R"]["ratio"]["arms_crossed"] == pytest.approx(0.64, abs=0.03)  # review: 0.64
    mir = rom["joints"]["volume_mirror"]
    assert {"shoulder", "elbow", "hip", "knee"} <= set(mir) and mir["knee"]["n_pose_pairs"] > 10


def test_C_d01_rom_candy_wrapper(rom):
    c = rom["candy_wrapper"]["forearm_pronation_L_m80"]["L"]["slices"]
    assert c["0.9"] == pytest.approx(0.83, abs=0.02) and c["0.5"] == pytest.approx(1.0, abs=1e-3)
    det = rom["summary"]["lights_detail"]["deform_candy_wrapper"]
    assert rom["lights"]["deform_candy_wrapper"] != "green" and det["capped_at_yellow"] == {"L": "no twist bones", "R": "no twist bones"}
    assert det["min_ratio"] <= 0.85 and det["slice"] in ("0.9", "wrist")


def test_C_d01_lights_and_flag_sheets(metrics, rom):
    for doc in (metrics, rom):
        assert {"deform_torn_edges_extreme", "deform_area_change", "deform_joint_volume", "joint_core_heads_inside"} <= set(doc["lights"])
        assert "deform_edge_ratio" not in doc["lights"]
    assert "deform_torn_edges_standard" in rom["lights"] and "deform_penetration_standard" in rom["lights"]
    for d in (LEG, ROM):
        info = _json(os.path.join(d, "render", "info.json"))
        fl = info["flags"]
        assert 0 < len(fl) <= 8 and fl[0]["light"] == "red" and any(t["xray"] or t.get("cut") is not None for t in fl)
        assert os.path.exists(os.path.join(d, "render", "qa_flag_sheet.jpg"))
    assert os.path.exists(os.path.join(LEG, "render", "qa_penetration_closeups.jpg"))


def test_C_d01_legacy_toes_not_exercised(metrics):
    """Review r2 item 1: the D01 QA poses never flex the toes (0.03 deg at most), so the toe regions have no winner: the same
    score for every candidate, decided_by "not_exercised", G2 flag. The ears ARE exercised there (aux_motion swings them 25 deg)."""
    s = metrics["summary"]
    assert s["not_exercised"] == ["L_Toe", "R_Toe"] and set(s["region_scores_flag_g2"]) >= {"L_Toe", "R_Toe"}
    ex = s["region_exercise"]
    assert ex["L_Toe"]["max_deg"] < 0.1 and ex["R_Toe"]["max_deg"] < 0.1
    assert ex["L_ear"]["exercised"] and ex["L_ear"]["max_deg"] == pytest.approx(25.0, abs=0.01) and ex["L_ear"]["pose"] == "aux_motion"
    assert ex["pelvis"]["exercised"] and ex["pelvis"]["max_deg"] > 60  # by the hips: its own joint to cog never turns
    sc = _json(os.path.join(LEG, "metrics", "region_scores.json"))
    det = _json(os.path.join(LEG, "metrics", "region_scores_detail.json"))
    for r in ("L_Toe", "R_Toe"):
        assert len(set(sc[r].values())) == 1  # no preference
        d = det["regions"][r]["decision"]
        assert d["winner"] is None and d["decided_by"] == "not_exercised" and d["flag_g2"]
    assert det["regions"]["helmet"]["decision"]["decided_by"] == "equivalent"  # identical behaviour (review r2 nit)


def test_C_d01_rom_toes_and_ears_exercised(rom):
    """The ROM gets toe flexion +-30 deg and ear motion +-25 deg (the control bones exist on D01): the toe and ear regions are
    exercised and decided by a measured step; helmet, sack and loincloth have no generic motion and stay not exercised."""
    names = rom["summary"]["pose_names"]
    extra = [n for n in names if n.startswith(("toe_flexion_", "ear_motion_"))]
    assert len(extra) == 16 and len(names) == 96 + 16
    ex = rom["summary"]["region_exercise"]
    for r, deg in (("L_Toe", 30.0), ("R_Toe", 30.0), ("L_ear", 25.0), ("R_ear", 25.0)):
        assert ex[r]["exercised"] and ex[r]["max_deg"] == pytest.approx(deg, abs=0.05), (r, ex[r])
    assert set(rom["summary"]["not_exercised"]) == {"helmet", "sack", "loincloth_front"}
    det = _json(os.path.join(ROM, "metrics", "region_scores_detail.json"))
    for r in ("L_Toe", "R_Toe", "L_ear", "R_ear"):
        d = det["regions"][r]["decision"]
        assert d["winner"] is not None and d["decided_by"] not in ("not_exercised", None), (r, d)
    # with the toes flexed the rigid cut loses both toe regions (r2: it won them, the toes never moved); the ears are reported
    # as measured: G2 wins R_ear, the rigid cut wins L_ear (G2 tears more when the ear swings 25 deg; a G2 weight question)
    prim = det["primary"]
    for r in ("L_Toe", "R_Toe"):
        c = det["regions"][r]["candidates"]
        assert det["regions"][r]["decision"]["winner"] == prim and c["rigid"]["tear_worst"] > c[prim]["tear_worst"]
    assert det["regions"]["R_ear"]["decision"]["winner"] == prim


def test_C_d01_penetration_pair_and_margin(metrics):
    """Item 2 / nit 5: the deepest penetration names both parts (helmet into the sack, 26.94 mm, behind the head) and the inside
    test is robust on closed targets: hands_crossed reads w = 1.0 for its deepest vertex (r2: 0.52 on the open cut surface)."""
    pen = metrics["summary"]["lights_detail"]["deform_penetration_extreme_depth"]
    pair = pen["pair"]
    assert (pair["intruder"], pair["into"], pair["target"]) == ("helmet", "sack", "island") and pen["at"]["pose"] == "head_up"
    assert pair["depth"] == pytest.approx(0.02694, abs=1e-4) and pair["w"] == pytest.approx(1.0, abs=1e-3) and pair["hot"][1] > 0.03
    mg = metrics["summary"]["penetration_margin"]["per_pose"]
    hc = mg["hands_crossed"]
    assert hc["deepest"]["w"] == pytest.approx(1.0, abs=1e-3) and hc["min_margin"] > 0.4
    assert hc["deepest"]["target"] == "cut" and hc["deepest"]["into"] == "spine_02"
    assert hc["deepest"]["depth"] == pytest.approx(0.01532, abs=2e-4)  # the reviewer's limb-chain target gave 15.32 mm
    assert all(v["min_margin"] is None or v["min_margin"] > 0.25 for v in mg.values()), {k: v["min_margin"] for k, v in mg.items()}


def test_C_d01_flag_tiles_cutaway_and_hinge():
    """Item 2 / nit 7: the deepest penetration tile is a cutaway seen from behind (helmet into sack), with an uncut twin; the
    joint-volume tile looks along the posed elbow hinge."""
    for d in (LEG, ROM):
        fl = _json(os.path.join(d, "render", "info.json"))["flags"]
        cut = [t for t in fl if t.get("cut") is not None]
        assert cut and cut[0]["caption"] == "helmet into sack" and cut[0]["view"] in ("back", "bl", "br") and cut[0]["dots"]
        assert any(t.get("context") for t in fl) or len(fl) == 8
        jv = [t for t in fl if t["metric"] == "deform_joint_volume"]
        assert jv and jv[0]["view"] == "hinge" and len(jv[0]["view_dir"]) == 3 and "largest" in jv[0]["value"]


def test_C_d01_candidates_region_scores_for_B():
    """Item 4: region scores of writer B's candidates on the joined legacy + ROM pose set, keys = each file's meta.candidate,
    next to the G2 runtime weights and the rigid probe; the rigid probe still loses every hinge region to G2."""
    sc = _json(os.path.join(CAND, "region_scores.json"))
    det = _json(os.path.join(CAND, "region_scores_detail.json"))
    inp = _json(os.path.join(CAND, "inputs.json"))
    keys = {"emulated:D01_hodling", "rigid"} | B_KEYS
    assert set(det["candidates"]) == keys and all(set(v) == keys for v in sc.values())
    assert {f["candidate"] for f in inp["b_files"]} == B_KEYS and inp["poses"]["n_poses"] == 17 + 111
    assert os.path.exists(os.path.join(CAND, "regions.npz")) and det["not_exercised"] == []
    for r in HINGE:
        assert sc[r]["rigid"] > sc[r]["emulated:D01_hodling"], (r, sc[r])
    assert all(d["decision"]["decided_by"] for d in det["regions"].values())


def test_C_d01_rom_render_chunks_under_20s():
    s = _json(os.path.join(ROM, "render", "chunk_times.json"))
    assert s["seconds"] and len(s["seconds"]) == len(s["chunks"]) and max(s["seconds"]) < 20.0


def test_C_s_template_run():
    """A1's humanoid_v1 S-template rig (G2 weights remapped by name, test only): poses, metrics and a render run end to end."""
    m = _json(os.path.join(SRUN, "metrics", "metrics.json"))
    schema.validate_metrics(m)
    po = npzio.load_poses(os.path.join(SRUN, "poses.npz"))
    assert len(po["names"]) == 112 and m["summary"]["n_poses"] == 112  # 104 + toe flexion (fix round 3)
    assert {"deform_joint_volume", "deform_candy_wrapper", "joint_core_heads_inside"} <= set(m["lights"])
    tw = m["twist"]
    assert tw["L"]["bones"] == ["L_ForeArm_twist"] and tw["L"]["note"] == "twist bones carry no weight"
    assert os.path.exists(os.path.join(SRUN, "render", "qa_flag_sheet.jpg"))
    assert os.path.exists(os.path.join(SRUN, "render", "qa_skeleton_overlay_front.jpg"))
