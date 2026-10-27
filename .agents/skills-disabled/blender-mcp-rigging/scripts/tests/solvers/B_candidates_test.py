"""Writer B: synthetic tests of the proxy, candidates A/B/C and the selector (no asset data)."""
import os
import sys

import numpy as np
import pytest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from rigcore import npzio  # noqa: E402
from solvers import proxy as px  # noqa: E402
from solvers import skin_common as sc  # noqa: E402
from solvers import skin_region as sr  # noqa: E402
from solvers import skin_select as ss  # noqa: E402
from solvers import skin_transfer as st  # noqa: E402
from solvers import skin_unirig as su  # noqa: E402

import B_helpers as hp  # noqa: E402


@pytest.fixture(scope="module")
def arm():
    m, skel, t = hp.bent_arm()
    return m, skel, t, sc.weld_topo(m), sc.BoneSet.from_skeleton(skel)


@pytest.fixture(scope="module")
def figures():
    """The T-pose figure and the same figure shifted +0.05 m in X, each with candidates A (default steps) and B."""
    out = {}
    for dx in (0.0, 0.05):
        m, skel = hp.figure(dx=dx)
        Wa, rs = sr.run(m, skel, {})
        Wb, ts = st.run(m, skel, {}, params={"res": 96})
        out[dx] = {"mesh": m, "skel": skel, "A": Wa, "rs": rs, "B": Wb, "ts": ts}
    return out


def _ring_means(topo, values, t_w, nbins=40):
    bins = np.clip((t_w * nbins).astype(int), 0, nbins - 1)
    out = []
    for b in range(nbins):
        m = bins == b
        if m.any():
            out.append((b, float(values[m].mean())))
    return out


# --------------------------------------------------------------------------------------------------------------------------
# proxy, inpaint, candidates
# --------------------------------------------------------------------------------------------------------------------------


def test_B_proxy_watertight_one_component(arm):
    m, skel, t, topo, bones = arm
    p = px.build_proxy(topo.P, topo.F, 1.0, res=96)
    assert p.info["watertight"] and p.info["components"] == 1 and p.info["boundary_edges"] == 0
    mp = px.map_points(p, topo.P, topo.normals)
    assert np.median(mp["dist"]) < 2 * p.h and np.nanmedian(mp["cos"]) > 0.9


def test_B_proxy_bridges_separate_parts():
    V1, F1, _ = hp.tube([(0, 0, 0.2), (0, 0, 0.6)], radius=0.05)
    V2, F2, _ = hp.tube([(0.3, 0, 0.2), (0.3, 0, 0.6)], radius=0.05)
    V = np.vstack([V1, V2])
    F = np.vstack([F1, F2 + len(V1)])
    p = px.build_proxy(V, F, 1.0, res=64)
    assert p.info["components_before_bridge"] == 2 and len(p.info["bridges"]) == 1
    assert p.info["watertight"] and p.info["components"] == 1


def test_B_inpaint_monotone_ramp_across_joint(arm):
    """Known: 100 % upper far from the joint, 100 % lower far beyond it; the band around the joint is inpainted. The lower-bone
    weight must rise monotonically along the tube axis (ring means) from 0 to 1, rows sum to 1, w >= 0."""
    m, skel, t, topo, bones = arm
    t_w = topo.gather(t)
    a, b = bones.col("upper"), bones.col("lower")
    W = np.zeros((topo.n_w, bones.k))
    known = (t_w < 0.35) | (t_w > 0.65)
    W[t_w < 0.35, a] = 1.0
    W[t_w > 0.65, b] = 1.0
    for energy in ("rswt", "harmonic"):
        Wi, info = st.inpaint(topo, W, known, 1.0, energy=energy)
        assert np.allclose(Wi.sum(1), 1.0) and Wi.min() >= 0.0
        assert info["sum_err_before_clamp"] < 1e-8
        rm = _ring_means(topo, Wi[:, b], t_w)
        vals = [v for _, v in rm]
        assert vals[0] < 1e-9 and vals[-1] > 1 - 1e-9
        assert all(v2 >= v1 - 1e-6 for v1, v2 in zip(vals, vals[1:])), (energy, vals)
        mid = [v for bb, v in rm if 18 <= bb <= 21]
        assert min(mid) > 0.2 and max(mid) < 0.8  # a real ramp, not a step at one ring


def test_B_candidate_B_on_bent_arm(arm):
    m, skel, t, topo, bones = arm
    Ww, ts = st.run(m, skel, {}, params={"res": 96})
    inv = ts.report["enforce"]["invariants"]
    assert inv["sum_err_max"] <= 1e-6 and inv["empty"] == 0 and inv["max_influences"] <= 4
    assert ts.report["proxy"]["watertight"] and ts.report["transfer"]["copied_fraction"] > 0.7
    t_w = topo.gather(t)
    rm = _ring_means(topo, Ww[:, bones.col("lower")], t_w, nbins=20)
    vals = [v for _, v in rm]
    assert vals[0] < 0.05 and vals[-1] > 0.95
    assert all(v2 >= v1 - 0.02 for v1, v2 in zip(vals, vals[1:]))


def test_B_candidate_A_default_on_bent_arm(arm):
    m, skel, t, topo, bones = arm
    Ww, rs = sr.run(m, skel, {})
    assert rs.report["enforce"]["invariants"]["empty"] == 0
    t_w = topo.gather(t)
    assert Ww[t_w < 0.2, bones.col("upper")].mean() > 0.9 and Ww[t_w > 0.8, bones.col("lower")].mean() > 0.9


def test_B_candidate_A_rejects_unknown_op(arm):
    m, skel, *_ = arm
    with pytest.raises(sc.RuleError):
        sr.run(m, skel, {"candidate_a": {"steps": [{"op": "nope"}]}})


def test_B_candidate_A_folds_before_the_first_pass_and_raises(arm, monkeypatch):
    """Every smoothing pass is preceded by a fold (also the first one, review r1 #7) and a fold that leaves forbidden weight raises
    InvariantError instead of an assert."""
    m, skel, t, topo, bones = arm
    rules = {"classes": [{"set": "a", "where": "x < 0.25"}],
             "regions": {"a_reg": {"where": "cls == 'a'", "allowed": ["upper"]}}}
    rs = sr.RegionSkin(m, skel, rules)
    W = np.zeros((topo.n_w, bones.k))
    W[:, bones.col("lower")] = 1.0  # forbidden on the region rows
    W0, info = rs.op_smooth(W.copy(), {"op": "smooth", "where": "True", "iters": 0})
    a_rows = rs.labels == "a"
    assert info["iters"] == 0 and np.allclose(W0[a_rows, bones.col("upper")], 1.0)
    assert not (W0[a_rows][:, bones.col("lower")] > 0).any()
    monkeypatch.setattr(sc, "fold", lambda W_, c_: np.array(W_, dtype=np.float64))
    with pytest.raises(sc.InvariantError):
        rs.op_smooth(W.copy(), {"op": "smooth", "where": "True", "iters": 2})


def test_B_candidates_shift_invariant(figures):
    """Mesh + skeleton shifted +0.05 m in X give the same weights (side planes from the skeleton, never x = 0)."""
    f0, f1 = figures[0.0], figures[0.05]
    for c in ("A", "B"):
        assert np.abs(f1[c] - f0[c]).max() <= 1e-6, c
    p0 = f0["rs"].report["side_planes"]
    p1 = f1["ts"].report["side_planes"]
    assert abs(p1["torso"] - p0["torso"] - 0.05) < 1e-12
    for c in ("A", "B"):
        inv = (f0["rs"] if c == "A" else f0["ts"]).report["enforce"]["invariants"]
        assert inv["forbidden_rows"] == 0 and inv["cap_rule_over"] == 0 and inv["cap_rule_small_tail"] == 0


def test_B_candidates_on_figure_wrist_and_twist(figures):
    """Candidates on the figure: no Hand weight on the forearm beyond the wrist band, forearm effective twist 0.5 t."""
    from solvers import skin_profiles as sp

    f = figures[0.0]
    for c, obj in (("A", f["rs"]), ("B", f["ts"])):
        W = f[c]
        ext = sp.wrist_extent(W, obj.topo, obj.bones)
        assert ext["L"]["ok"] and ext["R"]["ok"], (c, ext)
        assert obj.report["rounds"]["converged"]
        bins = sp.twist_bins(W, obj.topo, obj.bones)["L_ForeArm"]["bins"]
        assert all(b["max_dev"] is None or b["max_dev"] < 0.05 for b in bins), (c, bins)


# --------------------------------------------------------------------------------------------------------------------------
# candidate C
# --------------------------------------------------------------------------------------------------------------------------


def test_B_unirig_remap_folds_nulls_fingers_and_missing_columns():
    names = ["hips", "spine", "clav_l", "arm_l", "hand_l", "finger_l", "extra_l"]
    parent = {"hips": None, "spine": "hips", "clav_l": "spine", "arm_l": "clav_l", "hand_l": "arm_l", "finger_l": "hand_l",
              "extra_l": "finger_l"}
    bmap = {"hips": "pelvis", "spine": "chest", "clav_l": "L_Clavicle", "arm_l": "L_UpperArm", "hand_l": "L_Hand",
            "finger_l": "L_Hand", "extra_l": None}
    W_u = np.eye(7)
    cols = ["pelvis", "chest", "L_UpperArm", "L_Hand", "sack"]  # no clavicle column (D01 legacy), an aux column
    W, rep = su.remap(W_u, names, parent, bmap, cols, su.standard_parents())
    assert W[2].tolist() == [0, 1, 0, 0, 0]  # clavicle -> chest by the standard hierarchy
    assert W[5].tolist() == [0, 0, 0, 1, 0] and W[6].tolist() == [0, 0, 0, 1, 0]  # finger, unmapped child -> hand
    assert rep["columns_unmatched"] == ["sack"] and rep["dropped_weight_sum"] == 0.0


def test_B_unirig_fill_from_B(arm):
    m, skel, t, topo, bones = arm
    a, b = bones.col("upper"), bones.col("lower")
    W0 = np.zeros((topo.n_w, bones.k))
    W0[:, a] = 1.0  # "UniRig" knows only the upper bone
    Wf = np.zeros_like(W0)
    t_w = topo.gather(t)
    Wf[:, b] = np.clip((t_w - 0.4) / 0.2, 0, 1)
    Wf[:, a] = 1 - Wf[:, b]
    W, rep = su.fill_unmatched(topo, W0, Wf, [b], 1.0, 0.02, 0.5, 2, energy="harmonic")
    assert rep["pinned_rows"] > 0 and np.allclose(W.sum(1), 1.0) and W.min() >= 0
    assert np.allclose(W[t_w > 0.7, b], 1.0)  # pinned from B
    assert np.allclose(W[t_w < 0.3, a], 1.0)  # outside B's support: UniRig rows untouched


def test_B_unirig_vertex_order_is_checked(arm, tmp_path):
    """Candidate C never assumes the vertex order silently (review r1 #6)."""
    m, skel, t, topo, bones = arm
    d = tmp_path / "unirig"
    d.mkdir()
    n = m["V"].shape[0]
    Wu = np.zeros((n, 2), np.float32)
    Wu[:, 0] = (m["V"][:, 0] < 0.3).astype(np.float32)
    Wu[:, 1] = 1.0 - Wu[:, 0]
    npzio.save_weights(str(d / "unirig_weights.npz"), ["j0", "j1"], Wu, meta={"candidate": "unirig_raw"})
    npzio.write_json(str(d / "bone_map.json"), {"j0": "upper", "j1": "lower"})
    with pytest.raises(ValueError, match="cannot be checked"):  # no correspondence.json
        su.load_unirig_dir(str(d), m)
    u = su.load_unirig_dir(str(d), m, assume_order=True)
    assert u["info"]["order"] == "unverified" and "UNVERIFIED" in u["info"]["rows"]
    npzio.write_json(str(d / "correspondence.json"), {"mesh_npz": str(d / "gone" / "mesh.npz")})
    with pytest.raises(ValueError, match="not on disk"):
        su.load_unirig_dir(str(d), m)
    npzio.save_mesh(str(d / "mesh.npz"), m["V"], m["F"], weld=m["weld"], meta=m["meta"])
    npzio.write_json(str(d / "correspondence.json"), {"mesh_npz": str(d / "mesh.npz")})
    u = su.load_unirig_dir(str(d), m)
    assert u["info"]["order"] == "verified" and np.array_equal(u["W"], Wu.astype(np.float64))
    perm = np.random.default_rng(9).permutation(n)  # A2's rows follow another vertex order: re-ordered by position
    inv = np.argsort(perm)
    npzio.save_mesh(str(d / "mesh.npz"), m["V"][perm], inv[m["F"]], meta=m["meta"])
    npzio.save_weights(str(d / "unirig_weights.npz"), ["j0", "j1"], Wu[perm], meta={"candidate": "unirig_raw"})
    u = su.load_unirig_dir(str(d), m)
    assert u["info"]["order"] == "remapped" and u["info"]["remap_max_dist_m"] == 0.0
    assert np.abs(u["W"] - Wu).max() == 0.0 or sc.seam_max_diff(np.asarray(u["W"]), m["weld"]) <= 1.0


# --------------------------------------------------------------------------------------------------------------------------
# selector
# --------------------------------------------------------------------------------------------------------------------------


def test_B_select_manual_choice_and_band(arm):
    m, skel, t, topo, bones = arm
    a, b = bones.col("upper"), bones.col("lower")
    W1 = np.zeros((topo.n, bones.k))
    W1[:, a] = 1.0
    W2 = np.zeros((topo.n, bones.k))
    W2[:, b] = 1.0
    cand = {"X": {"bones": np.array(bones.names), "W": W1}, "Y": {"bones": np.array(bones.names), "W": W2}}
    t_w = topo.gather(t)
    regions = {"near": t_w < 0.5, "far": t_w >= 0.5}
    W, rep, topo2, _, _ = ss.select(m, skel, cand, {}, regions, manual={"near": "X", "far": "Y"}, band=2)
    assert rep["vertices_per_candidate"] == {"X": int((t_w < 0.5).sum()), "Y": int((t_w >= 0.5).sum())}
    assert np.allclose(W[t_w < 0.4, a], 1.0) and np.allclose(W[t_w > 0.6, b], 1.0)
    band = (t_w > 0.45) & (t_w < 0.55)
    assert ((W[band, a] > 0) & (W[band, b] > 0)).any()  # blended rows across the border
    W_s, rep_s, *_ = ss.select(m, skel, cand, {}, regions, scores={"near": {"X": 1.0, "Y": 2.0}, "far": {"X": 3.0, "Y": 0.5}})
    assert rep_s["choice"] == {"near": "X", "far": "Y"} and rep_s["default"] == "Y" and rep_s["unmatched_score_keys"] == []


def test_B_select_one_candidate_everywhere_unchanged(figures):
    """Choosing one candidate everywhere returns it unchanged (<= 1e-6), also through float32 weights.npz storage."""
    f = figures[0.0]
    rs, ts = f["rs"], f["ts"]
    names = np.array(rs.bones.names)
    A32 = {"bones": names, "W": sc.to_full(f["A"], rs.topo), "meta": {"candidate": sr.CANDIDATE}}
    B32 = {"bones": names, "W": sc.to_full(f["B"], ts.topo), "meta": {"candidate": st.CANDIDATE}}
    for chosen, ref in (("A", f["A"]), ("B", f["B"])):
        W, rep, *_ = ss.select(f["mesh"], f["skel"], {"A": A32, "B": B32}, {}, None, manual={}, default=chosen)
        assert rep["mixed_rows"] == 0 and np.abs(W - ref).max() <= 1e-6, chosen
    # a real blend: profiles re-applied on the mixed rows only, result valid and stable
    regions = {"up": f["rs"].topo.P[:, 2] >= 1.2, "down": f["rs"].topo.P[:, 2] < 1.2}
    W, rep, topo, bones, cons = ss.select(f["mesh"], f["skel"], {"A": A32, "B": B32}, {}, regions,
                                          manual={"up": "A", "down": "B"})
    assert rep["mixed_rows"] > 0 and rep["profiles"]["rows_replaced"] == rep["mixed_rows"]
    assert np.abs(W[topo.P[:, 2] > 1.4] - f["A"][topo.P[:, 2] > 1.4]).max() <= 1e-6  # far from the border: A's rows unchanged


def test_B_select_score_keys_and_errors(arm):
    m, skel, t, topo, bones = arm
    W1 = np.zeros((topo.n, bones.k))
    W1[:, 0] = 1.0
    cand = {"A": {"bones": np.array(bones.names), "W": W1, "meta": {"candidate": "A_region"}},
            "B": {"bones": np.array(bones.names), "W": W1.copy(), "meta": {"candidate": "B_transfer"}}}
    t_w = topo.gather(t)
    regions = {"near": t_w < 0.5, "far": t_w >= 0.5}
    c_style = {"near": {"emulated:D01_hodling": 0.2, "D01_source": 0.21, "rigid_onehot": 0.3},
               "far": {"emulated:D01_hodling": 0.1, "D01_source": 0.11, "rigid_onehot": 0.05}}
    with pytest.raises(ValueError, match="no region has a usable score"):  # writer C's D01 keys name no candidate
        ss.select(m, skel, cand, {}, regions, scores=c_style)
    W, rep, *_ = ss.select(m, skel, cand, {}, regions, scores=c_style, key_map={"D01_source": "A", "rigid_onehot": "B"})
    assert rep["choice"] == {"near": "A", "far": "B"} and rep["unmatched_score_keys"] == ["emulated:D01_hodling"]
    # writer C names the primary weights by meta.candidate: matched without a map
    scores = {"near": {"A_region": 0.1, "B": 0.3}, "far": {"A_region": 0.4, "B": 0.2}, "foot": {"other": 1.0}}
    W, rep, *_ = ss.select(m, skel, cand, {}, regions, scores=scores)
    assert rep["choice"] == {"near": "A", "far": "B"} and rep["unmatched_score_keys"] == ["other"]
    assert rep["regions_without_score"] == ["foot"] and rep["score_keys"]["A_region"] == "A"
    with pytest.raises(ValueError, match="not a candidate"):
        ss.score_keys(["A", "B"], key_map={"x": "C"})


def _clean_and_leaky(f):
    """Leak-free weights of the figure (each row one-hot on its nearest deform segment) and a copy whose left belly rows carry
    0.3 L_UpperArm (far from the arm: limb-leak rows). The figure's own candidates leak (thighs right under the torso tube)."""
    rs = f["rs"]
    b, P = rs.bones, rs.topo.P
    Wc = np.zeros((len(P), b.k))
    Wc[np.arange(len(P)), np.stack([sc.seg_dist(P, b.head[j], b.tail[j])[0] for j in range(b.k)], 1).argmin(1)] = 1.0
    belly = (np.hypot(P[:, 0], P[:, 1]) > 0.13) & (P[:, 0] > 0.03) & (P[:, 2] > 1.1) & (P[:, 2] < 1.2)
    Wl = Wc.copy()
    Wl[belly] *= 0.7
    Wl[belly, b.col("L_UpperArm")] += 0.3
    return Wc, Wl, belly


def test_B_select_limb_leak_gate(figures):
    """I2 (review B r3): scores prefer B everywhere, but B leaks upper-arm weight onto the belly: B is dropped in the gate
    regions holding more than 3 of its leaking rows (spine_01) and wins elsewhere (head); without the gate it wins everywhere;
    when every candidate leaks nobody is dropped and the region is flagged for G2; a manual choice is not gated."""
    f = figures[0.0]
    rs = f["rs"]
    names = np.array(rs.bones.names)
    Wc, Wl, belly = _clean_and_leaky(f)
    cand = {"A": {"bones": names, "W": sc.to_full(Wc, rs.topo), "meta": {"candidate": sr.CANDIDATE}},
            "B": {"bones": names, "W": sc.to_full(Wl, rs.topo), "meta": {"candidate": st.CANDIDATE}}}
    regions = ss.derive_regions(Wc, rs.bones)
    scores = {r: {sr.CANDIDATE: 2.0, st.CANDIDATE: 1.0} for r in regions}
    W, rep, topo, bones, cons = ss.select(f["mesh"], f["skel"], cand, {}, regions, scores=scores)
    lg = rep["leak_gate"]
    assert lg["candidates"]["B"]["rows"] == int(belly.sum()) > 3 and lg["candidates"]["A"]["rows"] == 0
    assert lg["band"] == 3 and lg["applied"] and set(lg["dropped"]) == {"spine_01", "spine_02"}
    assert lg["regions"]["spine_01"]["rows"] == {"A": 0, "B": 15} and lg["candidates"]["B"]["by_limb"]["arm_L"] == 20
    assert rep["choice"]["spine_01"] == "A" and rep["choice"]["head"] == "B" and "dropped" in rep["regions"]["spine_01"]["decided"]
    assert all(rep["choice"][r] == "A" for r in lg["dropped"]) and set(lg["dropped"]) <= set(lg["gate_regions"])
    assert rep["limb_leak"]["rows"] == 0 and not any("leak" in x["reason"] for x in rep["flag_g2"])
    _, rep0, *_ = ss.select(f["mesh"], f["skel"], cand, {}, regions, scores=scores, leak_gate=False)
    assert set(rep0["choice"].values()) == {"B"} and rep0["leak_gate"]["dropped"] == {}
    both = {"A": dict(cand["B"], meta={"candidate": sr.CANDIDATE}), "B": cand["B"]}
    _, rep2, *_ = ss.select(f["mesh"], f["skel"], both, {}, regions, scores=scores)
    assert rep2["leak_gate"]["dropped"] == {} and rep2["leak_gate"]["regions"]["spine_01"]["all_leak"]
    assert rep2["choice"]["spine_01"] == "B" and any(x["region"] == "spine_01" and "every candidate leaks" in x["reason"]
                                                     for x in rep2["flag_g2"])
    _, rep3, *_ = ss.select(f["mesh"], f["skel"], cand, {}, regions, manual={"spine_01": "B"})
    assert rep3["choice"] == {"spine_01": "B"} and rep3["leak_gate"]["dropped"] == {}
    assert rep3["regions"]["spine_01"]["leak_rows"]["B"] > 3


def test_B_select_not_exercised_keeps_rule_candidate(figures):
    """Regions no pose exercises (writer C's detail ``not_exercised``; without a detail file: equal scores for every candidate)
    keep the rule-based candidate A (meta.candidate A_region) and are flagged for G2; C's own G2 flags are passed on."""
    f = figures[0.0]
    rs = f["rs"]
    names = np.array(rs.bones.names)
    cand = {"X": {"bones": names, "W": sc.to_full(f["B"], f["ts"].topo), "meta": {"candidate": st.CANDIDATE}},
            "Y": {"bones": names, "W": sc.to_full(f["A"], rs.topo), "meta": {"candidate": sr.CANDIDATE}}}
    regions = ss.derive_regions(f["A"], rs.bones)
    scores = {r: {st.CANDIDATE: 1.0, sr.CANDIDATE: 2.0} for r in regions}
    detail = {"not_exercised": ["head"], "flag_g2": ["head", "L_Hand"],
              "regions": {"L_Hand": {"decision": {"decided_by": "near tie: smoother weights", "flag_g2": True}}}}
    _, rep, *_ = ss.select(f["mesh"], f["skel"], cand, {}, regions, scores=scores, detail=detail)
    assert rep["rule_candidate"] == "Y" and rep["choice"]["head"] == "Y" and rep["choice"]["L_ForeArm"] == "X"
    assert rep["not_exercised"] == ["head"] and rep["regions"]["head"]["decided"].startswith("kept: no preference")
    assert rep["c_for_skin_select"] is None  # the detail above has no for_skin_select text; C's real one is passed on
    fl = {x["region"]: x["reason"] for x in rep["flag_g2"]}
    assert "kept on the rule-based candidate Y" in fl["head"] and fl["L_Hand"] == "writer C: near tie: smoother weights"
    eq = dict(scores, head={st.CANDIDATE: 0.0, sr.CANDIDATE: 0.0})
    _, rep2, *_ = ss.select(f["mesh"], f["skel"], cand, {}, regions, scores=eq)
    assert rep2["choice"]["head"] == "Y" and rep2["not_exercised"] == ["head"] and rep2["choice"]["L_ForeArm"] == "X"
    _, rep3, *_ = ss.select(f["mesh"], f["skel"], cand, {}, regions, scores=eq, rule="X")
    assert rep3["choice"]["head"] == "X"
    with pytest.raises(ValueError, match="rule candidate"):
        ss.select(f["mesh"], f["skel"], cand, {}, regions, scores=eq, rule="Z")


def test_B_limb_envelope_factors():
    """Candidate B's limb envelope (skin_transfer step 2b): 1 near the limb root, 0 beyond its interval, smoothstep in between
    (0.5 at the middle); the upper arm's twist bone follows the upper arm; the thigh also fades with the height above the hip
    joint; every other column keeps 1; unknown keys raise."""
    bones = sc.BoneSet.from_skeleton(hp.figure()[1])
    ua, tw, th = bones.col("L_UpperArm"), bones.col("L_UpperArm_twist"), bones.col("L_Thigh")
    L = bones.length(ua)
    mid = 0.5 * (bones.head[ua] + bones.tail[ua])
    X_arm = np.array([mid - [0, 0, d * L] for d in (0.4, 0.625, 0.8)])  # 0.4 / 0.625 / 0.8 L below the upper-arm segment
    up = bones.head[th] - bones.tail[th]
    X_leg = np.array([bones.head[th] + h * up for h in (0.05, 0.2, 0.35)])  # 0.05 / 0.2 / 0.35 thigh lengths above the hip
    E, info = st.limb_envelope(np.vstack([X_arm, X_leg]), bones)
    assert np.allclose(E[:3, ua], [1.0, 0.5, 0.0]) and np.allclose(E[:3, tw], E[:3, ua])
    assert np.allclose(E[3:, th], [1.0, 0.5, 0.0])  # (R_Thigh fades there too: the points lie as high above the R hip joint)
    others = [j for j in range(bones.k) if j not in (ua, tw, th, bones.col("R_UpperArm"), bones.col("R_UpperArm_twist"),
                                                      bones.col("R_Thigh"))]
    assert np.all(E[:, others] == 1.0) and info["units"]["L_UpperArm"]["bones"] == ["L_UpperArm", "L_UpperArm_twist"]
    E0, _ = st.limb_envelope(np.vstack([X_arm, X_leg]), bones, {"UpperArm": {"dist": [0.75, 1.0]}})
    assert np.allclose(E0[:3, ua], [1.0, 1.0, 1.0 - 0.104]) and np.all(E0[:, th] == 1.0)  # S(0.2) = 0.104 at 0.8 L
    with pytest.raises(ValueError, match="unknown keys"):
        st.limb_envelope(X_arm, bones, {"Thigh": {"below": [0.0, 1.0]}})
    W = np.full((6, bones.k), 1.0 / bones.k)
    Wn, empty = st.normalize_heat(W * E, fallback=W)
    assert np.allclose(Wn.sum(1), 1.0) and not empty.any() and np.all(Wn[2, [ua, tw]] == 0)


def test_B_candidate_B_envelope_reported_and_switchable(arm, figures):
    """The envelope runs on the proxy heat and again on the mesh rows (reported), and ``envelope = {}`` switches it off; on the
    bent arm (no limb root) it changes nothing."""
    ts = figures[0.0]["ts"]
    env = ts.report["heat"]["envelope"]
    assert set(env["units"]) == {"L_UpperArm", "R_UpperArm", "L_Thigh", "R_Thigh"} and "rows_changed" in env
    assert "rows_changed" in ts.report["envelope_mesh"] and ts.params["envelope"] == st.ENVELOPE
    m, skel, t, topo, bones = arm
    W1, ts1 = st.run(m, skel, {}, params={"res": 96})
    W0, ts0 = st.run(m, skel, {}, params={"res": 96, "envelope": {}})
    assert ts0.report["heat"]["envelope"] is None and "envelope_mesh" not in ts0.report
    assert ts1.report["heat"]["envelope"]["units"] == {} and np.abs(W1 - W0).max() == 0.0
