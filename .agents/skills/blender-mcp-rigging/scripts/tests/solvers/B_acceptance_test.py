r"""Writer B acceptance on real data: candidates A/B/C on D01 vs the G2-approved weights, B/C on FL (validity + soft numbers), the
selector on writer C's real D01 region scores and on FL.

Needs the dev data (skipped otherwise):
* E:\tmp_rigkit\B\d01\{mesh.npz, gt_weights.npz, skeleton.json} from ``tests/rigkit/B_export_d01.py`` (headless Blender on a copy
  of the G2 snapshot);
* UniRig maps: writer A2's ``E:\tmp_rigkit\A2\unirig\<asset>\`` when published, else ``E:\tmp_rigkit\B\unirig\<asset>\`` made by
  A2's own ``unirig_bridge.process`` from the existing UniRig output (no UniRig run);
* FL: E:\tmp_rigkit\B\fl\{mesh.npz, skeleton.json} (A2's FL mesh.npz + an H skeleton resolved from UniRig landmarks, dev only);
* writer C's current D01 region scores (``C_SCORE_DIRS``): the round-3 run E:\tmp_rigkit\C_r3\d01\candidates (it scored B_r3's
  acc files) and the re-run on this round's candidates (``C_run_d01_pipeline.py --out E:\tmp_rigkit\I2\C_pipe --b-dir
  E:\tmp_rigkit\I2\B``), each with region_scores.json, region_scores_detail.json, regions.npz and inputs.json (the scored files
  with their sha256: the selector runs on exactly those files and skips a folder whose files changed since).

Writes E:\tmp_rigkit\I2\B\acceptance.json and the candidate weights (acc_*.npz) under E:\tmp_rigkit\I2\B\{d01, fl} (round I2;
B_r3 stays as it was). A candidate file is rewritten only when its content changes, so writer C's sha256 of it stays valid
across re-runs. FL B and C also carry the review r2 blend-cap numbers: per blend group the rows kept over their cap, the largest
kept tail and its top 5 bones (``blend_caps``), and ``cap_effect`` (influence histogram, weight-jump edges against the same finish
without the cap rule, removals per cap step, finish rounds and finish twice). Every candidate reports ``limb_leak`` (review B r3;
skin_common.limb_leak on the welded rows), candidate B also without its limb envelope (``envelope_effect``).
"""
import hashlib
import json
import os
import sys

import numpy as np
import pytest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from rigcore import npzio, template  # noqa: E402
from solvers import skin_common as sc  # noqa: E402
from solvers import skin_profiles as sp  # noqa: E402
from solvers import skin_region as sr  # noqa: E402
from solvers import skin_rules  # noqa: E402
from solvers import skin_select as ss  # noqa: E402
from solvers import skin_transfer as st  # noqa: E402
from solvers import skin_unirig as su  # noqa: E402

IN_ROOT = r"E:\tmp_rigkit\B"
OUT_ROOT = r"E:\tmp_rigkit\I2\B"
D01 = os.path.join(IN_ROOT, "d01")
FL = os.path.join(IN_ROOT, "fl")
C_SCORE_DIRS = {"C_r3": r"E:\tmp_rigkit\C_r3\d01\candidates", "I2": r"E:\tmp_rigkit\I2\C_pipe\d01\candidates"}
SHORT = {sr.CANDIDATE: "A", st.CANDIDATE: "B", su.CANDIDATE: "C"}  # meta.candidate -> candidate name in the selector
RULES = os.path.join(os.path.dirname(os.path.abspath(__file__)), "B_d01_skin_rules.json")
SACK_LIST = ("sack", "chest", "spine_02", "spine_01")
RESULTS: dict = {}


def _out(*parts):
    p = os.path.join(OUT_ROOT, *parts)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    return p


def _unirig_dir(asset):
    for root in (r"E:\tmp_rigkit\A2\unirig", os.path.join(IN_ROOT, "unirig")):
        d = os.path.join(root, asset)
        if os.path.isfile(os.path.join(d, "bone_map.json")) and os.path.isfile(os.path.join(d, "unirig_weights.npz")):
            return d
    return None


def _need(*paths):
    for p in paths:
        if not os.path.exists(p):
            pytest.skip(f"dev data missing: {p}")


def _sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for c in iter(lambda: f.read(1 << 20), b""):
            h.update(c)
    return h.hexdigest()


def _save_weights(path, names, W, meta):
    """npzio.save_weights unless ``path`` already holds the same bones, weights and meta (then the file and its sha256, which
    writer C's inputs.json pins, stay as they are). Returns True when written."""
    meta = json.loads(json.dumps(meta, default=str))
    if os.path.exists(path):
        old = npzio.load_weights(path)
        if (old["bones"].tolist() == list(names) and np.array_equal(old["W"], np.asarray(W, dtype=np.float32))
                and json.dumps(old["meta"], sort_keys=True) == json.dumps(meta, sort_keys=True)):
            return False
    npzio.save_weights(path, names, W, meta=meta, check_sums=True)
    return True


def _leak(rep):
    """The limb_leak numbers of a finish report, without the per-region table (review B r3)."""
    lk = rep["limb_leak"]
    return {"rows": lk["rows"], "w_max": lk["w_max"], "band": lk["band"], "over_band": lk["over_band"],
            "by_limb": {k: {kk: v[kk] for kk in ("rows", "w_max", "rows_above_joint", "height_max_rel") if kk in v}
                        for k, v in lk["by_limb"].items()}}


def _decisive_agreement(W_full, names, gt, weld, margin=0.05):
    """Dominant-bone agreement with G2 on the welded rows whose two largest G2 weights differ by >= ``margin`` (G2 splits many
    belt rows exactly 50/50 between pelvis and spine_01: their argmax is a column-order tie), next to the plain agreement."""
    union = list(dict.fromkeys(list(names) + gt["bones"].tolist()))
    weld = np.asarray(weld)
    n_w = int(weld.max()) + 1
    cnt = np.bincount(weld, minlength=n_w)[:, None]

    def welded(W, cols):
        out = np.zeros((n_w, len(union)))
        for j, n in enumerate(cols):
            np.add.at(out[:, union.index(n)], weld, np.asarray(W, dtype=np.float64)[:, j])
        return out / cnt

    G, Wc = welded(gt["W"], gt["bones"].tolist()), welded(W_full, names)
    srt = -np.sort(-G, axis=1)
    dec = (srt[:, 0] - srt[:, 1]) >= margin
    agree = Wc.argmax(1) == G.argmax(1)
    return {"margin": margin, "rows": int(dec.sum()), "of": int(n_w), "agreement_decisive": float(agree[dec].mean()),
            "agreement_all": float(agree.mean())}


def _validity(W_full, names, cons, topo, weld):
    """Checks on the per-original-vertex float32 weights as saved."""
    W = np.asarray(W_full, dtype=np.float64)
    s = W.sum(1)
    nnz = (W > 0).sum(1)
    Ww = topo.gather(W)
    return {"sum_err_max": float(np.abs(s - 1).max()), "max_influences": int(nnz.max()), "empty": int((nnz == 0).sum()),
            "forbidden_rows": int(((Ww > 1e-7) & ~cons.allowed).any(1).sum()),
            "side_gate_rows": int(((Ww > 1e-7) & ~cons.side_allowed).any(1).sum()),
            "seam_max_diff": sc.seam_max_diff(W, weld),
            "bones_without_weight": [n for j, n in enumerate(names) if W[:, j].max() == 0],
            "influence_hist": {str(i): int((topo.gather(nnz.astype(float)) == i).sum()) for i in range(5)}}


def _assert_valid(v):
    assert v["sum_err_max"] <= 1e-6 and v["max_influences"] <= 4 and v["empty"] == 0
    assert v["forbidden_rows"] == 0 and v["side_gate_rows"] == 0 and v["seam_max_diff"] <= 1e-6


def _l1(W, names, gt, weld):
    r = sc.compare_weights(W, gt["W"], names, gt["bones"].tolist(), weld=weld)
    r.pop("l1_rows")
    worst = sorted(r["per_bone"].items(), key=lambda kv: kv[1]["agree"])[:6]
    r["per_bone_worst"] = {k: v for k, v in worst}
    r.pop("per_bone")
    return r


def _save(tag, data):
    RESULTS[tag] = data
    doc = {"schema": 0, "writer": "B", "round": "I2 (P3 integration)", "inputs": IN_ROOT, "results": RESULTS}
    npzio.write_json(_out("acceptance.json"), doc)


def _planes(rep):
    p = rep["side_planes"]
    return {k: p[k] for k in ("torso", "torso_source", "skeleton_torso", "chains", "chains_without_mirror", "explicit", "band_m",
                              "warnings")}


def _blend_caps(caps):
    """Per blend group of one enforce caps report: blend rows, rows kept over their cap (tolerance cap, review r2), the largest
    kept tail beyond the cap and the top 5 bones of the kept entries."""
    groups = sorted(k[len("blend_rows_kept_over_cap_"):] for k in caps if k.startswith("blend_rows_kept_over_cap_"))
    return {g: {"blend_rows": caps[f"blend_rows_{g}"], "kept_over_cap": caps[f"blend_rows_kept_over_cap_{g}"],
                "kept_beyond_max": caps[f"kept_beyond_max_{g}"], "kept_bones_top5": caps[f"kept_bones_{g}"]} for g in groups}


def _cap_effect(obj, W, Wraw, skel):
    """The review r2 blend-cap numbers on welded final weights ``W`` of a candidate (``Wraw`` = its weights before finish):
    influence histogram, edges whose largest weight jump is > 0.25, edges whose jump grew by > 0.1 against the same finish
    without the cap rule, the largest removal per row and per cap step over all rounds, finish rounds and finish twice."""
    s0 = skin_rules.Setup(obj.topo, obj.bones, obj.setup.colors, obj.setup.ctx, obj.setup.labels,
                          obj.cons.copy_with(cap_rule=None))
    W0, _ = skin_rules.finish(Wraw, s0, skel, {})
    W2, _ = skin_rules.finish(W, obj.setup, skel, {})
    e = obj.topo.edges
    jump = lambda X: np.abs(X[e[:, 0]] - X[e[:, 1]]).max(1)  # noqa: E731
    hist = lambda X: {str(i): int(((X > 0).sum(1) == i).sum()) for i in range(1, 5)}  # noqa: E731
    rounds = obj.report["rounds"]
    caps = [r["caps"] for r in rounds["per_round"] if r["caps"]]
    mx = lambda k: max(float(c[k]) for c in caps)  # noqa: E731
    return {"influence_hist": hist(W), "influence_hist_no_cap": hist(W0), "edges_jump_gt_0.25": int((jump(W) > 0.25).sum()),
            "edges_jump_gt_0.25_no_cap": int((jump(W0) > 0.25).sum()),
            "edges_jump_grew_gt_0.1_vs_no_cap": int((jump(W) - jump(W0) > 0.1).sum()),
            "removed_max_per_row": mx("removed_max"),
            "rows_removed_ge_extra_tol_over_two_steps": int(caps[0]["rows_removed_over_extra_tol"]),
            "blend_cap_removed_max": mx("blend_cap_removed_max"), "small_cap_removed_max": mx("small_cap_removed_max"),
            "blend_rows_kept_over_cap": int(caps[-1]["blend_rows_kept_over_cap"]),
            "finish_rounds": rounds["rounds"], "converged": rounds["converged"],
            "finish_twice_max_diff": float(np.abs(W2 - W).max())}


def _soft(obj, W, skel, rules=None):
    """FL soft numbers (review r1 #12, r2): side planes, caps (per blend group), wrist extent, effective twist per 10 % bin, hip
    transition, rounds, crease band coverage."""
    tb = sp.twist_bins(W, obj.topo, obj.bones)
    twist = {seg: {"mode": d["mode"], "t0": d["t0"],
                   "bins": [{"t": f"{b['t_lo']:.1f}-{b['t_hi']:.1f}", "n": b["n"],
                             "mean": None if b["mean"] is None else round(b["mean"], 4), "target_mid": round(b["target_mid"], 4),
                             "max_dev": None if b["max_dev"] is None else round(b["max_dev"], 4)} for b in d["bins"]]}
             for seg, d in tb.items()}
    rounds = obj.report["rounds"]
    final = {k: v for k, v in obj.report["enforce"]["caps"].items() if k != "rule"}
    return {"side_planes": _planes(obj.report), "cap_rule": obj.report["enforce"]["caps"]["rule"],
            "blend_caps": {"final_pass": _blend_caps(final), "first_round": _blend_caps(rounds["per_round"][0]["caps"])},
            "caps_first_round": rounds["per_round"][0]["caps"], "caps_final_pass": final,
            "wrist_extent": sp.wrist_extent(W, obj.topo, obj.bones, (rules or {}).get("profiles")),
            "effective_twist_per_10pct": twist, "hip_transition": obj.report["profiles"]["hip_transition"],
            "finish_rounds": {k: v for k, v in rounds.items() if k != "per_round"},
            "per_round": [{k: v for k, v in r.items() if k != "caps"} for r in rounds["per_round"]],
            "influence_hist": obj.report["enforce"]["invariants"]["influence_hist"],
            "creases": [{k: c[k] for k in ("joint", "half_width_m", "ring_m", "rows", "changed_rows", "band")}
                        for c in obj.report["profiles"].get("creases", [])],
            "crease_band_flags": obj.report["profiles"].get("crease_band_flags", [])}


def _assert_blend_caps(soft):
    """Review r2 R1: no cap step removes extra_tol (0.05) or more of a row; every blend group reports its kept rows."""
    for k in ("caps_first_round", "caps_final_pass"):
        assert soft[k]["small_cap_removed_max"] < 0.05 and soft[k]["blend_cap_removed_max"] < 0.05
    for part in ("final_pass", "first_round"):
        assert sorted(soft["blend_caps"][part]) == ["hip_L", "hip_R", "shoulder_L", "shoulder_R"]
        for g in soft["blend_caps"][part].values():
            assert g["kept_over_cap"] == 0 or (g["kept_beyond_max"] >= 0.05 and 0 < len(g["kept_bones_top5"]) <= 5)


# --------------------------------------------------------------------------------------------------------------------------
# D01 (legacy 35-bone rig, profiles off)
# --------------------------------------------------------------------------------------------------------------------------


@pytest.fixture(scope="module")
def d01():
    _need(os.path.join(D01, "mesh.npz"), os.path.join(D01, "gt_weights.npz"), os.path.join(D01, "skeleton.json"))
    return (npzio.load_mesh(os.path.join(D01, "mesh.npz")), npzio.load_weights(os.path.join(D01, "gt_weights.npz")),
            template.load_skeleton(os.path.join(D01, "skeleton.json")), skin_rules.load_rules(RULES))


@pytest.fixture(scope="module")
def d01_B(d01):
    m, gt, sk, rules = d01
    Ww, ts = st.run(m, sk, rules)
    W = sc.to_full(Ww, ts.topo)
    path = _out("d01", "acc_B.npz")
    _save_weights(path, ts.bones.names, W, {"candidate": st.CANDIDATE, "params": ts.params})
    return W, ts, path


@pytest.fixture(scope="module")
def d01_B_plain(d01):
    """Candidate B without its limb envelope (the review r3 weights), for the before / after numbers."""
    m, gt, sk, rules = d01
    Ww, ts = st.run(m, sk, rules, params={"envelope": {}})
    return sc.to_full(Ww, ts.topo), ts


def test_B_acc_g2_satisfies_d01_rules(d01):
    """The rules file is consistent with G2: G2 itself has no weight on any forbidden (row, bone) pair."""
    m, gt, sk, rules = d01
    rs = sr.RegionSkin(m, sk, rules)
    G = rs.topo.gather(np.stack([gt["W"][:, gt["bones"].tolist().index(n)] for n in rs.bones.names], 1).astype(np.float64))
    bad = int(((G > 0) & ~rs.cons.allowed).any(1).sum())
    leak = skin_rules.limb_leak_report(G, rs.setup)  # review B r3: the approved weights calibrate the band (<= 3 rows)
    _save("g2_vs_rules", {"forbidden_rows": bad, "labels": {k: int(v) for k, v in zip(*np.unique(rs.labels, return_counts=True))},
                          "limb_leak_g2": _leak({"limb_leak": leak})})
    assert bad == 0
    assert leak["rows"] == 2 and not leak["over_band"] and leak["by_limb"]["arm_L"]["rows"] == 2  # 3 original vertices, 2 welded


def test_B_acc_candidate_A_d01(d01):
    m, gt, sk, rules = d01
    Ww, rs = sr.run(m, sk, rules)
    W = sc.to_full(Ww, rs.topo)
    _save_weights(_out("d01", "acc_A.npz"), rs.bones.names, W, {"candidate": sr.CANDIDATE, "params": {}})
    l1 = _l1(W, rs.bones.names, gt, m["weld"])
    v = _validity(W, rs.bones.names, rs.cons, rs.topo, m["weld"])
    sack = rs.topo.scatter(rs.labels) == "sack"
    off = [j for j, n in enumerate(rs.bones.names) if n not in SACK_LIST]
    leak = int((W[np.ix_(sack, off)] > 0).any(1).sum())
    _save("A_d01", {"l1_vs_g2": l1, "validity": v, "sack_vertices": int(sack.sum()), "sack_vertices_outside_list": leak,
                    "side_planes": _planes(rs.report), "finish_rounds": rs.report["rounds"], "steps": rs.report["steps"],
                    "limb_leak": _leak(rs.report)})
    _assert_valid(v)
    assert not rs.report["limb_leak"]["over_band"]
    assert l1["l1_mean"] <= 0.02 and l1["dominant_agreement"] >= 0.98
    assert leak == 0 and sack.sum() == 538  # D01 B1 regression (qa_report: 538 sack-cloth vertices, 0 outside the list)
    p = rs.report["side_planes"]  # explicit rules planes agree with the skeleton's (no warning)
    assert not p["warnings"] and abs(p["chains"]["L_Thigh|R_Thigh"] - 0.0105) < 1e-6


def test_B_acc_candidate_B_d01(d01, d01_B, d01_B_plain):
    """Candidate B on D01 with the limb envelope (I2): valid, limb leak within the band (review r3: 96 welded rows), L1 vs G2 not
    worse than without the envelope; the dominant-bone agreement is reported on all rows and on the rows where G2 itself is
    decisive (its two largest weights >= 0.05 apart)."""
    m, gt, sk, rules = d01
    W, ts, _ = d01_B
    W0, ts0 = d01_B_plain
    v = _validity(W, ts.bones.names, ts.cons, ts.topo, m["weld"])
    l1, l1_0 = _l1(W, ts.bones.names, gt, m["weld"]), _l1(W0, ts0.bones.names, gt, m["weld"])
    eff = {"with_envelope": {"l1_mean": l1["l1_mean"], "dominant_agreement": l1["dominant_agreement"],
                             "decisive": _decisive_agreement(W, ts.bones.names, gt, m["weld"]), "limb_leak": _leak(ts.report)},
           "without_envelope": {"l1_mean": l1_0["l1_mean"], "dominant_agreement": l1_0["dominant_agreement"],
                                "decisive": _decisive_agreement(W0, ts0.bones.names, gt, m["weld"]),
                                "limb_leak": _leak(ts0.report)},
           "envelope": ts.params["envelope"], "proxy_stage": {k: v_ for k, v_ in ts.report["heat"]["envelope"].items()
                                                               if k != "spec"},
           "mesh_stage": {k: v_ for k, v_ in ts.report["envelope_mesh"].items() if k != "spec"},
           "l1_change_vs_without": l1["l1_mean"] - l1_0["l1_mean"]}
    _save("B_d01", {"l1_vs_g2": l1, "validity": v, **{k: ts.report[k] for k in ("proxy", "heat", "transfer", "inpaint")},
                    "limb_leak": _leak(ts.report), "envelope_effect": eff})
    _assert_valid(v)
    assert ts.report["proxy"]["watertight"] and ts.report["rounds"]["converged"]
    assert not ts.report["limb_leak"]["over_band"] and ts0.report["limb_leak"]["rows"] > 50
    assert l1["l1_mean"] <= l1_0["l1_mean"] + 1e-3


def test_B_acc_candidate_C_d01(d01, d01_B):
    m, gt, sk, rules = d01
    ud = _unirig_dir("D01_hodling")
    if ud is None:
        pytest.skip("no UniRig bone map for D01")
    u = su.load_unirig_dir(ud, m)
    out = {}
    for tag, fill in (("C_d01", d01_B[2]), ("C_d01_nofill", None)):
        Ww, us = su.run(m, sk, u, rules, fill_from=fill)
        W = sc.to_full(Ww, us.topo)
        if fill:
            _save_weights(_out("d01", "acc_C.npz"), us.bones.names, W, {"candidate": su.CANDIDATE, "params": {}})
        v = _validity(W, us.bones.names, us.cons, us.topo, m["weld"])
        out[tag] = v
        _save(tag, {"unirig_dir": ud, "vertex_order": u["info"].get("order"), "rows": u["info"].get("rows"),
                    "l1_vs_g2": _l1(W, us.bones.names, gt, m["weld"]), "validity": v, "remap": us.report["remap"],
                    "fill": us.report["fill"], "limb_leak": _leak(us.report)})
    _assert_valid(out["C_d01"])
    assert u["info"]["order"] in ("verified", "remapped")


@pytest.mark.parametrize("tag", sorted(C_SCORE_DIRS))
def test_B_acc_select_with_current_c_region_scores_d01(d01, tag):
    """Task I2-4: the selector on writer C's current D01 region scores (keys = meta.candidate of B's files; C's
    ``emulated:D01_hodling`` (G2) and ``rigid`` stay unmatched) with C's regions.npz and region_scores_detail.json, on exactly the
    weights files C scored (inputs.json paths + sha256; a folder whose files changed since is skipped). The limb-leak gate:
    in every gate region the chosen candidate is within the band unless every candidate leaks there (flagged for G2); regions
    no pose exercised keep A. Recorded with and without the gate."""
    m, gt, sk, rules = d01
    d = C_SCORE_DIRS[tag]
    _need(*(os.path.join(d, f) for f in ("region_scores.json", "region_scores_detail.json", "regions.npz", "inputs.json")))
    inp = npzio.read_json(os.path.join(d, "inputs.json"))
    files = {}
    for f in inp["b_files"]:
        _need(f["path"])
        if _sha(f["path"]) != f["sha256"]:
            pytest.skip(f"{f['path']} changed since writer C scored it ({tag}): re-run C_run_d01_pipeline.py --only-candidates")
        files[SHORT[f["candidate"]]] = f["path"]
    cand = {n: npzio.load_weights(files[n]) for n in sorted(files)}
    scores = npzio.read_json(os.path.join(d, "region_scores.json"))
    detail = npzio.read_json(os.path.join(d, "region_scores_detail.json"))
    regions = ss.load_regions(os.path.join(d, "regions.npz"))
    W, rep, topo, bones, cons = ss.select(m, sk, cand, rules, regions, scores=scores, detail=detail)
    W0, rep0, *_ = ss.select(m, sk, cand, rules, regions, scores=scores, detail=detail, leak_gate=False)
    v = _validity(sc.to_full(W, topo), bones.names, cons, topo, m["weld"])
    gate = rep["leak_gate"]
    changed = {r: [rep0["choice"].get(r), rep["choice"].get(r)] for r in regions if rep0["choice"].get(r) != rep["choice"].get(r)}
    _save(f"select_d01_current_c_scores_{tag}", {
        "scores_dir": d, "candidate_files": files, "c_inputs_mtime": [f.get("mtime") for f in inp["b_files"]],
        "unmatched_score_keys": rep["unmatched_score_keys"], "choice": rep["choice"], "choice_without_gate": rep0["choice"],
        "changed_by_gate": changed, "decided": rep["decided"], "leak_dropped": gate["dropped"],
        "leak_rows_per_gate_region": {r: g["rows"] for r, g in gate["regions"].items()},
        "candidate_leak": {c: {k: x[k] for k in ("rows", "w_max", "by_limb")} for c, x in gate["candidates"].items()},
        "flag_g2": rep["flag_g2"], "not_exercised": rep["not_exercised"], "rule_candidate": rep["rule_candidate"],
        "selected_limb_leak": _leak(rep), "selected_limb_leak_without_gate": _leak(rep0), "validity": v,
        "vertices_per_candidate": rep["vertices_per_candidate"]})
    _assert_valid(v)
    assert rep["unmatched_score_keys"] == ["emulated:D01_hodling", "rigid"] and set(rep["candidates"]) == set(files)
    assert rep["rule_candidate"] == "A" and set(rep["not_exercised"]) == set(detail["not_exercised"])
    assert rep["c_for_skin_select"] == detail["for_skin_select"]
    assert all(rep["choice"][r] == "A" for r in rep["not_exercised"] if r in rep["choice"])
    for r, g in gate["regions"].items():
        c = rep["choice"].get(r)
        assert c is None or g["rows"][c] <= gate["band"] or g["all_leak"], (r, c, g)
    assert all(rep0["choice"][r] in gate["dropped"].get(r, []) for r in changed)  # the gate only moved dropped candidates


# --------------------------------------------------------------------------------------------------------------------------
# FL (family H: clavicle, twist bones, profiles on)
# --------------------------------------------------------------------------------------------------------------------------


@pytest.fixture(scope="module")
def fl():
    _need(os.path.join(FL, "mesh.npz"), os.path.join(FL, "skeleton.json"))
    return npzio.load_mesh(os.path.join(FL, "mesh.npz")), template.load_skeleton(os.path.join(FL, "skeleton.json"))


@pytest.fixture(scope="module")
def fl_B(fl):
    m, sk = fl
    Ww, ts = st.run(m, sk, {})
    W = sc.to_full(Ww, ts.topo)
    pB = _out("fl", "acc_B.npz")
    _save_weights(pB, ts.bones.names, W, {"candidate": st.CANDIDATE, "params": ts.params})
    return Ww, W, ts, pB


def test_B_acc_candidate_B_fl(fl, fl_B):
    m, sk = fl
    Ww, W, ts, pB = fl_B
    vB = _validity(W, ts.bones.names, ts.cons, ts.topo, m["weld"])
    soft = _soft(ts, Ww, sk)
    leak = _leak(ts.report)
    eff = _cap_effect(ts, Ww, ts.raw()[0], sk)
    Ww0, ts0 = st.run(m, sk, {}, params={"envelope": {}})  # the review r3 weights (no limb envelope)
    r0 = sc.compare_weights(sc.to_full(Ww0, ts0.topo), W, ts0.bones.names, ts.bones.names, weld=m["weld"])
    pC = r"E:\tmp_rigkit\B_r3\fl\acc_C.npz"  # FL candidate C of round 3 (UniRig + B's fill): the leak calibration reference
    vsC = {}
    if os.path.exists(pC):
        wc = npzio.load_weights(pC)
        for tg, X, nm in (("with_envelope", W, ts.bones.names), ("without_envelope", sc.to_full(Ww0, ts0.topo), ts0.bones.names)):
            rc = sc.compare_weights(X, wc["W"], nm, wc["bones"].tolist(), weld=m["weld"])
            vsC[tg] = {"l1_mean": rc["l1_mean"], "dominant_agreement": rc["dominant_agreement"]}
    env = {"limb_leak": leak, "without_envelope": {"limb_leak": _leak(ts0.report),
                                                   "hip_transition": ts0.report["profiles"]["hip_transition"]},
           "vs_without": {"l1_mean": r0["l1_mean"], "l1_max": r0["l1_max"], "dominant_agreement": r0["dominant_agreement"]},
           "vs_review_r3_candidate_C": vsC, "proxy_stage": {k: v_ for k, v_ in ts.report["heat"]["envelope"].items() if k != "spec"},
           "mesh_stage": {k: v_ for k, v_ in ts.report["envelope_mesh"].items() if k != "spec"}}
    _save("B_fl", {"validity": vB, **{k: ts.report[k] for k in ("proxy", "heat", "transfer", "inpaint")}, "cap_effect": eff,
                   "soft": soft, "limb_leak": leak, "envelope_effect": env})
    _assert_valid(vB)
    assert not leak["over_band"] and ts0.report["limb_leak"]["rows"] > 500  # review r3: 677 welded rows without the envelope
    assert all(h["ok"] for h in soft["hip_transition"].values())
    assert not vB["bones_without_weight"]  # twist bones are weighted (FL failure #9)
    assert soft["wrist_extent"]["L"]["ok"] and soft["wrist_extent"]["R"]["ok"]  # hand <= band + one ring above the wrist
    assert abs(soft["side_planes"]["chains"]["L_Clavicle|R_Clavicle"] - 0.0422) < 5e-4
    assert abs(soft["side_planes"]["chains"]["L_Thigh|R_Thigh"] - 0.0492) < 5e-4
    _assert_blend_caps(soft)  # each cap step removes < extra_tol; kept rows reported per group
    assert eff["edges_jump_grew_gt_0.1_vs_no_cap"] == 0 and eff["finish_twice_max_diff"] <= 1e-9
    assert ts.report["rounds"]["converged"]


def test_B_acc_candidate_C_fl(fl, fl_B):
    m, sk = fl
    Ww_b, W_b, ts, pB = fl_B
    ud = _unirig_dir("FL_flagellant_vA")
    if ud is None:
        pytest.skip("no UniRig bone map for FL")
    u = su.load_unirig_dir(ud, m)
    Wc, us = su.run(m, sk, u, {}, fill_from=pB)
    Wcf = sc.to_full(Wc, us.topo)
    _save_weights(_out("fl", "acc_C.npz"), us.bones.names, Wcf, {"candidate": su.CANDIDATE, "params": {}})
    vC = _validity(Wcf, us.bones.names, us.cons, us.topo, m["weld"])
    rB = sc.compare_weights(Wcf, W_b, us.bones.names, ts.bones.names, weld=m["weld"])
    soft = _soft(us, Wc, sk)
    eff = _cap_effect(us, Wc, us.raw(), sk)
    _save("C_fl", {"unirig_dir": ud, "vertex_order": u["info"].get("order"), "rows": u["info"].get("rows"), "validity": vC,
                   "remap": us.report["remap"], "fill": us.report["fill"],
                   "vs_B": {"l1_mean": rB["l1_mean"], "dominant_agreement": rB["dominant_agreement"]}, "cap_effect": eff,
                   "soft": soft, "limb_leak": _leak(us.report)})
    _assert_valid(vC)
    assert not vC["bones_without_weight"] and u["info"]["order"] in ("verified", "remapped")
    assert soft["wrist_extent"]["L"]["ok"] and soft["wrist_extent"]["R"]["ok"]
    _assert_blend_caps(soft)
    assert eff["finish_twice_max_diff"] <= 1e-9 and us.report["rounds"]["converged"]


def test_B_acc_select_fl_idempotent(fl, fl_B):
    """Review r1 #4: choosing one candidate everywhere returns it unchanged (<= 1e-6); profiles and finish applied twice = once."""
    m, sk = fl
    Ww_b, W_b, ts, pB = fl_B
    pC = _out("fl", "acc_C.npz")
    _need(pC)
    cand = {"B": npzio.load_weights(pB), "C": npzio.load_weights(pC)}
    res = {}
    for chosen in ("B", "C"):
        W, rep, topo, bones, cons = ss.select(m, sk, cand, {}, None, manual={}, default=chosen)
        ref = topo.gather(cand[chosen]["W"].astype(np.float64))
        res[f"all_{chosen}_max_diff"] = float(np.abs(W - ref).max())
        res[f"all_{chosen}_rows_over_1e-6"] = int((np.abs(W - ref).max(1) > 1e-6).sum())
    Wraw, _ = ts.raw()
    P1, _ = sp.apply_profiles(Wraw, ts.topo, ts.bones, sk["skin"], None)
    P2, _ = sp.apply_profiles(P1, ts.topo, ts.bones, sk["skin"], None)
    F2, _ = skin_rules.finish(Ww_b, ts.setup, sk, {})
    res.update(profiles_twice_vs_once=float(np.abs(P2 - P1).max()), finish_twice_vs_once=float(np.abs(F2 - Ww_b).max()))
    _save("select_fl_idempotence", res)
    assert res["all_B_max_diff"] <= 1e-6 and res["all_C_max_diff"] <= 1e-6
    assert res["profiles_twice_vs_once"] <= 1e-6 and res["finish_twice_vs_once"] <= 1e-6
