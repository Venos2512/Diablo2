"""Writer B: synthetic tests of solvers.skin_profiles (twist ramps, wrist / elbow creases, idempotence, cap-rule and limb
groups)."""
import os
import sys

import numpy as np
import pytest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from solvers import skin_common as sc  # noqa: E402
from solvers import skin_profiles as sp  # noqa: E402
from solvers import skin_rules  # noqa: E402

import B_helpers as hp  # noqa: E402


def _arm_points(x):
    return np.stack([x, 0.01 * np.sin(x * 40), np.full_like(x, 0.6)], 1)


def _seg(bones, name):
    return {s["segment"]: s for s in sp.twist_segments(bones)}[name]


# --------------------------------------------------------------------------------------------------------------------------
# twist ramps (hp.twist_arm: L_UpperArm 0.2..0.5 with its twist head at t = 0.25; L_ForeArm 0.5..0.8; L_Hand 0.8..0.9)
# --------------------------------------------------------------------------------------------------------------------------


def test_B_twist_forearm_ramp():
    bones = sc.BoneSet.from_skeleton(hp.twist_arm())
    x = np.linspace(0.45, 0.95, 201)
    P = _arm_points(x)
    fa, ft, hd, ch = (bones.col(n) for n in ("L_ForeArm", "L_ForeArm_twist", "L_Hand", "chest"))
    W = np.zeros((len(x), bones.k))
    fore = (x >= 0.5) & (x < 0.8)
    W[fore, fa], W[fore, hd], W[fore, ch] = 0.7, 0.2, 0.1  # the hand and chest columns must not move
    W[x >= 0.8, hd] = 1.0
    W[x < 0.5, bones.col("L_UpperArm")] = 1.0
    Wr, info = sp.apply_twist_ramps(W, P, bones)
    t = (x[fore] - 0.5) / 0.3
    e = sp.effective_twist(Wr[fore], bones, _seg(bones, "L_ForeArm"))
    assert np.abs(e - 0.5 * t).max() <= 1e-12  # effective twist f t: 0 at the elbow, 0.5 at the wrist
    assert np.abs(Wr[fore, ft] / (Wr[fore, fa] + Wr[fore, ft]) - t).max() <= 1e-12
    assert np.abs(Wr[fore, fa] + Wr[fore, ft] - 0.7).max() <= 1e-12  # only m = ForeArm + twist is re-split
    assert np.array_equal(Wr[:, hd], W[:, hd]) and np.array_equal(Wr[:, ch], W[:, ch])  # driver (Hand) never in the ramp
    rows = {i["segment"]: i["rows"] for i in info}
    assert rows["L_ForeArm"] == int(fore.sum())  # rows counted with mass > 1e-6


def test_B_twist_upper_arm_ramp():
    bones = sc.BoneSet.from_skeleton(hp.twist_arm())
    x = np.linspace(0.2, 0.5, 121, endpoint=False)
    P = _arm_points(x)
    ua, ut, ch = bones.col("L_UpperArm"), bones.col("L_UpperArm_twist"), bones.col("chest")
    W = np.zeros((len(x), bones.k))
    W[:, ua], W[:, ch] = 0.8, 0.2
    Wr, _ = sp.apply_twist_ramps(W, P, bones)
    seg = _seg(bones, "L_UpperArm")
    t0 = seg["t0"]
    assert abs(t0 - 0.25) < 1e-12 and seg["mode"] == "self"
    t = (x - 0.2) / 0.3
    a = np.clip((t - t0) / (1 - t0), 0, 1)
    m = Wr[:, ua] + Wr[:, ut]
    t_share = Wr[:, ut] / m  # twist bone: 1 up to t0, then (1 - t) / (1 - t0)
    assert np.abs(t_share - np.where(t <= t0, 1.0, (1 - t) / (1 - t0))).max() <= 1e-12
    assert np.abs(Wr[:, ua] / m - a).max() <= 1e-12  # UpperArm (G) share = a
    roll = sp.effective_twist(Wr, bones, seg)  # roll share 1 + f (1 - a): 0.5 up to t0, then linear to 1 at the elbow
    assert np.abs(roll - (1 - 0.5 * (1 - a))).max() <= 1e-12
    assert np.abs(m - 0.8).max() <= 1e-12 and np.array_equal(Wr[:, ch], W[:, ch])


def test_B_twist_several_twist_bones_per_segment():
    """Two forearm twist bones (factors 1/3 and 2/3, driver Hand): effective twist (2/3) t through twist_ramp_weights."""
    lerp = lambda a, b, t: tuple(np.asarray(a) + t * (np.asarray(b) - np.asarray(a)))
    E, Wr_, T = (0.5, 0, 0.6), (0.8, 0, 0.6), (0.9, 0, 0.6)
    b = [hp.bone("L_ForeArm", None, E, Wr_, hinge=(0, 0, 1)),
         hp.bone("L_ForeArm_twist1", "L_ForeArm", lerp(E, Wr_, 0.33), lerp(E, Wr_, 0.5), kind="twist", hinge=(0, 0, 1),
                 twist={"driver": "L_Hand", "axis": "Y", "factor": 1 / 3}),
         hp.bone("L_ForeArm_twist2", "L_ForeArm", lerp(E, Wr_, 0.66), lerp(E, Wr_, 0.83), kind="twist", hinge=(0, 0, 1),
                 twist={"driver": "L_Hand", "axis": "Y", "factor": 2 / 3}),
         hp.bone("L_Hand", "L_ForeArm", Wr_, T, hinge=(0, 1, 0))]
    bones = sc.BoneSet.from_skeleton(hp.skeleton(b, 1.0))
    x = np.linspace(0.5, 0.8, 61)
    W = np.zeros((len(x), bones.k))
    W[:, bones.col("L_ForeArm")] = 1.0
    Wr, _ = sp.apply_twist_ramps(W, _arm_points(x), bones)
    seg = _seg(bones, "L_ForeArm")
    t = (x - 0.5) / 0.3
    assert np.abs(sp.effective_twist(Wr, bones, seg) - (2 / 3) * t).max() <= 1e-12
    assert ((Wr > 0).sum(1) <= 2).all() and np.allclose(Wr.sum(1), 1.0)


# --------------------------------------------------------------------------------------------------------------------------
# creases
# --------------------------------------------------------------------------------------------------------------------------


@pytest.fixture(scope="module")
def straight_arm():
    """Tube along the twist arm (rings every 1 cm, radius 3 cm) + the twist-arm bones."""
    V, F, _ = hp.tube([(0.15, 0.0, 0.6), (0.95, 0.0, 0.6)], radius=0.03, n_around=16, n_per_seg=80)
    m = hp.mesh_dict(V, F, 1.0)
    return sc.weld_topo(m), sc.BoneSet.from_skeleton(hp.twist_arm())


def test_B_wrist_crease_hard_band(straight_arm):
    topo, bones = straight_arm
    specs, _ = sp.crease_specs(topo, bones, sp.profile_config({"crease": False, "wrist_bias": 0.0}))
    assert [c.name for c in specs] == ["wrist_L"]
    c = specs[0]
    # h = 0.5 x 2 rings x local edge length (median of the axial 1 cm, circumferential 1.18 cm and diagonal edges)
    assert abs(c.h - c.ring) < 1e-12 and 0.0095 < c.ring < 0.0155
    fa, ft, hd = bones.col("L_ForeArm"), bones.col("L_ForeArm_twist"), bones.col("L_Hand")
    x = topo.P[:, 0]
    W = np.zeros((topo.n_w, bones.k))
    W[x < 0.8, fa] = 1.0
    W[x >= 0.8, hd] = 1.0
    leak = (x > 0.6) & (x < 0.8)  # a candidate whose hand weight spreads up the forearm (review r1, FL)
    W[leak, hd], W[leak, fa] = 0.3, 0.7
    Wc, info = sp.apply_crease(W, topo.P, c)
    u = (topo.P - c.J) @ c.n
    share = Wc[:, hd] / (Wc[:, fa] + Wc[:, ft] + Wc[:, hd])
    assert np.abs(share - np.clip(0.5 + u / (2 * c.h), 0, 1)).max() <= 1e-12
    at = np.abs(u) < 1e-9
    assert at.any() and np.allclose(share[at], 0.5)
    o = np.argsort(u)
    assert (np.diff(share[o]) >= -1e-12).all()  # monotone along the arm
    assert (Wc[u < -c.h, hd] == 0).all()  # no Hand weight on the forearm beyond the band
    assert np.allclose(Wc[u > c.h, hd], 1.0)
    Wc2, _ = sp.apply_crease(Wc, topo.P, c)
    assert np.abs(Wc2 - Wc).max() <= 1e-12


def test_B_wrist_crease_palm_bias(straight_arm):
    topo, bones = straight_arm
    c = sp.crease_specs(topo, bones, sp.profile_config({"crease": False}))[0][0]
    assert np.allclose(c.f, [0, 0, -1])  # palm side from the Hand hinge (+Y for L): -Z
    fa, hd = bones.col("L_ForeArm"), bones.col("L_Hand")
    W = np.zeros((topo.n_w, bones.k))
    W[:, fa] = 1.0
    Wc, _ = sp.apply_crease(W, topo.P, c)
    u = (topo.P - c.J) @ c.n
    ring = np.abs(u + 0.01) < 1e-6  # the vertex ring 1 cm above the wrist plane
    z = topo.P[ring, 2] - 0.6
    sh = Wc[ring, hd]
    assert ring.sum() >= 16 and sh[z < -0.02].min() > sh[z > 0.02].max()  # palm-side vertices lean to the hand
    assert sh.max() <= np.clip(0.5 + (-0.01 + c.bias * c.h) / (2 * c.h), 0, 1) + 1e-12  # by at most bias x h


def _renamed_bent_arm():
    m, skel, _ = hp.bent_arm()
    topo = sc.weld_topo(m)
    bones = sc.BoneSet.from_skeleton(skel)
    bones.names = ["L_UpperArm" if n == "upper" else "L_ForeArm" if n == "lower" else n for n in bones.names]
    return topo, bones


def test_B_elbow_crease_envelope_and_idempotent():
    topo, bones = _renamed_bent_arm()
    specs, _ = sp.crease_specs(topo, bones, sp.profile_config({"wrist": False, "crease_bias": 0.0}))
    c = {s.name: s for s in specs}["elbow_L"]
    a, b = bones.col("L_UpperArm"), bones.col("L_ForeArm")
    u = (topo.P - c.J) @ c.n
    W = np.zeros((topo.n_w, bones.k))
    W[u < 0, a] = 1.0
    W[u >= 0, b] = 1.0
    Wc, info = sp.apply_crease(W, topo.P, c)
    fb = Wc[:, b] / (Wc[:, a] + Wc[:, b])
    p = np.clip(0.5 + u / (2 * c.h), 0, 1)
    inner = np.abs(u) <= c.h
    assert np.abs(fb[inner] - p[inner]).max() <= 1e-12 and np.allclose(fb[np.abs(u) < 1e-9], 0.5)
    o = np.argsort(u)
    assert (np.diff(fb[o]) >= -1e-12).all()
    # a candidate with its own mixed split (30 % distal everywhere): beyond 2h it is kept, between h and 2h it is clipped into
    # the envelope that widens from [p, p] to [0, 1]
    W2 = np.zeros_like(W)
    W2[:, a], W2[:, b] = 0.7, 0.3
    Wc2, _ = sp.apply_crease(W2, topo.P, c)
    f2 = Wc2[:, b] / (Wc2[:, a] + Wc2[:, b])
    assert np.allclose(f2[np.abs(u) >= 2 * c.h], 0.3) and np.allclose(f2[inner], p[inner])
    s = sc.smoothstep((np.abs(u) - c.h) / c.h)
    assert (f2 >= p * (1 - s) - 1e-12).all() and (f2 <= p + (1 - p) * s + 1e-12).all()
    o2 = np.argsort(u)
    assert np.abs(np.diff(f2[o2])).max() <= 2.0 * np.diff(u[o2]).max() / c.h + 1e-9  # continuous: no step beyond the ramp slope
    for Wx in (Wc, Wc2):  # idempotent
        Wy, _ = sp.apply_crease(Wx, topo.P, c)
        assert np.abs(Wy - Wx).max() <= 1e-12


# --------------------------------------------------------------------------------------------------------------------------
# whole profile chain on the figure
# --------------------------------------------------------------------------------------------------------------------------


@pytest.fixture(scope="module")
def fig():
    m, skel = hp.figure()
    return m, skel, skin_rules.prepare(m, skel, {})


def test_B_profiles_and_finish_idempotent(fig):
    m, skel, setup = fig
    rng = np.random.default_rng(11)
    W = rng.random((setup.topo.n_w, setup.bones.k)) ** 4
    W[rng.random(W.shape) < 0.4] = 0.0
    P1, info = sp.apply_profiles(W, setup.topo, setup.bones, skel["skin"], None)
    P2, _ = sp.apply_profiles(P1, setup.topo, setup.bones, skel["skin"], None)
    assert np.abs(P2 - P1).max() <= 1e-12  # profiles applied twice = once
    assert [c["joint"] for c in info["creases"]] == ["wrist_L", "wrist_R", "elbow_L", "elbow_R", "knee_L", "knee_R"]
    F1, r1 = skin_rules.finish(W, setup, skel, {})
    F2, r2 = skin_rules.finish(F1, setup, skel, {})
    assert np.abs(F2 - F1).max() <= 1e-9  # profiles + enforce applied twice = once (limb groups keep dropped weight on the limb)
    assert r1["rounds"]["converged"] and r2["rounds"]["converged"] and r2["rounds"]["rounds"] == 2


def test_B_cap_rule_and_limb_groups_from_names(fig):
    m, skel, setup = fig
    names = setup.bones.names
    rule = setup.cons.cap_rule.describe(names)
    g = {x["name"]: x for x in rule["groups"]}
    assert g["shoulder_L"]["a"] == ["L_UpperArm", "L_UpperArm_twist"] and g["shoulder_L"]["b"] == ["chest", "L_Clavicle"]
    assert g["hip_R"]["a"] == ["R_Thigh"] and g["hip_R"]["b"] == ["pelvis", "spine_01"] and g["hip_R"]["cap"] == 3
    assert rule["extra_tol"] == 0.05 and rule["small_cap"] == 2 and rule["finger_bones"] == []
    lg = setup.cons.groups.describe(names)
    units = [["L_UpperArm", "L_UpperArm_twist"], ["R_UpperArm", "R_UpperArm_twist"], ["L_ForeArm", "L_ForeArm_twist"],
             ["R_ForeArm", "R_ForeArm_twist"]]
    assert sorted(map(sorted, lg["units"])) == sorted(map(sorted, units))
    # partners act only inside their crease's zone (review r2 R2)
    zone = {c.name: c.zone(setup.topo.P) for c in sp.crease_specs(setup.topo, setup.bones, sp.profile_config(None))[0]}
    pt = lg["partners"]
    assert [x["bones"] for x in pt["L_Hand"]] == [["L_ForeArm", "L_ForeArm_twist"]]
    assert pt["L_Hand"][0]["rows"] == int(zone["wrist_L"].sum()) and 0 < pt["L_Hand"][0]["rows"] < setup.topo.n_w
    assert [x["bones"] for x in pt["L_UpperArm_twist"]] == [["L_ForeArm", "L_ForeArm_twist"]]
    assert pt["L_UpperArm_twist"][0]["rows"] == int(zone["elbow_L"].sum())
    assert [x["bones"] for x in pt["L_Thigh"]] == [["L_Calf"]] and [x["bones"] for x in pt["R_Calf"]] == [["R_Thigh"]]
    assert pt["R_Calf"][0]["rows"] == int(zone["knee_R"].sum()) < 0.1 * setup.topo.n_w
    fa = pt["L_ForeArm_twist"]  # between two creases: the elbow half gives to the upper arm, the wrist half to the hand
    assert [x["bones"] for x in fa] == [["L_UpperArm", "L_UpperArm_twist"], ["L_Hand"]]
    (m_e, _), (m_w, _) = setup.cons.groups.partners[setup.bones.col("L_ForeArm_twist")]
    assert m_e.any() and m_w.any() and not (m_e & m_w).any()
    assert not (m_e & ~zone["elbow_L"]).any() and not (m_w & ~zone["wrist_L"]).any()
    assert not (m_e | m_w)[setup.topo.P[:, 0] < 0.16].any()  # torso and the other side: no forearm give-back at all
    off = sp.limb_groups(setup.bones, setup.topo, {"crease": False, "wrist": False})
    assert off.partners == {} and len(off.units) == 4  # disabled creases give no partner


def test_B_cap_rule_rejects_blend_cap_below_small_cap(fig):
    """A blend cap below the small cap raises only while the small cap is below the hard cap (review B r3 nit a): with
    default_non_joint >= max_influences the small cap removes nothing, so hip 3 / default_non_joint 4 is accepted and one enforce
    is idempotent on a hip blend row with four influences."""
    m, skel, setup = fig
    with pytest.raises(sc.RuleError, match="below default_non_joint"):
        sp.cap_rule(setup.bones, {"max_influences_by_region": {"hip": 1}}, sp.profile_config(None))
    with pytest.raises(sc.RuleError, match="below the hard cap 4"):
        sp.cap_rule(setup.bones, {"max_influences_by_region": {"hip": 2, "default_non_joint": 3}}, sp.profile_config(None))
    blk = {"max_influences": 4, "max_influences_by_region": {"hip": 3, "shoulder": 3, "default_non_joint": 4}}
    rule = sp.cap_rule(setup.bones, blk, sp.profile_config(None))
    assert rule.small_cap == 4 and {g[3] for g in rule.groups} == {3}
    with pytest.raises(sc.RuleError):
        sp.cap_rule(setup.bones, blk, sp.profile_config(None), max_influences=5)  # small cap 4 < hard cap 5: guarded again
    b = setup.bones
    rows = np.zeros((2, b.k))
    cols = [b.col("L_Thigh"), b.col("pelvis"), b.col("spine_01"), b.col("spine_02")]
    rows[0, cols] = [0.6, 0.3, 0.06, 0.04]  # tail beyond the blend cap 3 = 0.04 < extra_tol: cut to 3
    rows[1, cols] = [0.55, 0.3, 0.09, 0.06]  # tail 0.06 >= extra_tol: kept with 4 (and the small cap 4 removes nothing)
    P = np.tile(b.head[b.col("pelvis")], (2, 1))
    cons = setup.cons.copy_with(allowed=np.ones((2, b.k), bool), region_of=np.full(2, -1), rigid_col=np.full(2, -1),
                                caps=np.full(2, 4), locked=None, locked_val=None, side_allowed=None, cap_rule=rule,
                                groups=sp.limb_groups(b, setup.topo, None, P))
    W1, _ = sc.enforce(rows, cons)
    W2, _ = sc.enforce(W1, cons)
    assert np.abs(W2 - W1).max() <= 1e-12 and (W1 > 0).sum(1).tolist() == [3, 4]


def test_B_wrist_crease_zone_a_pose():
    """Review r2 N3: the hard wrist crease acts only within half a forearm length of the forearm / hand segments. In an A-pose
    (arms 45 deg down) the shins lie on the hand side of the wrist plane; stray forearm weight there stays forearm weight (the
    unlimited crease turned it into Hand weight), while the band at the wrist is the same as in a T-pose."""
    m, skel = hp.figure(arm_drop=45.0)
    topo, bones = sc.weld_topo(m), sc.BoneSet.from_skeleton(skel)
    c = {s.name: s for s in sp.crease_specs(topo, bones, sp.profile_config({"wrist_bias": 0.0}))[0]}["wrist_L"]
    fa, ft, hd, ca = (bones.col(n) for n in ("L_ForeArm", "L_ForeArm_twist", "L_Hand", "L_Calf"))
    P = topo.P
    u = c.coords(P)[0]
    shin = (P[:, 0] > 0.0) & (P[:, 2] < 0.4)
    arm = (P[:, 0] > 0.2) & (P[:, 2] > 0.8)
    assert shin.sum() > 50 and (u[shin] > c.h).all()  # the old half-space reached the whole shin
    zone = c.zone(P)
    assert not zone[shin].any() and zone[arm & (np.abs(u) < 2 * c.h)].all()
    W = np.zeros((topo.n_w, bones.k))
    W[arm & (u < 0), fa] = 1.0
    W[arm & (u >= 0), hd] = 1.0
    W[shin, fa], W[shin, ca] = 0.2, 0.8  # stray forearm weight on the shin
    Wc, _ = sp.apply_crease(W, P, c)
    assert np.array_equal(Wc[shin], W[shin]) and not Wc[shin, hd].any()
    share = Wc[arm, hd] / (Wc[arm, fa] + Wc[arm, ft] + Wc[arm, hd])
    assert np.abs(share - np.clip(0.5 + u[arm] / (2 * c.h), 0, 1)).max() <= 1e-12


def test_B_crease_coverage_band_and_gap(straight_arm):
    """Review r2 N2: band coverage per crease. The straight tube has rows on both sides of the wrist band; a hand that starts 3 cm
    beyond the wrist (one side without rows, as FL's R wrist nearly is) is flagged."""
    topo, bones = straight_arm
    c = sp.crease_specs(topo, bones, sp.profile_config({"crease": False}))[0][0]
    cov = sp.crease_coverage(topo, c)
    assert cov["band_rows_proximal"] >= 16 and cov["band_rows_distal"] >= 16 and not cov["one_side_empty"]
    assert cov["edges_crossing"] > 0 and cov["crossing_edge_max_m"] <= 2 * c.h and not cov["crossing_edge_over_band"]
    V1, F1, _ = hp.tube([(0.15, 0.0, 0.6), (0.79, 0.0, 0.6)], radius=0.03, n_around=16, n_per_seg=64)
    V2, F2, _ = hp.tube([(0.83, 0.0, 0.6), (0.95, 0.0, 0.6)], radius=0.03, n_around=16, n_per_seg=12)
    topo2 = sc.weld_topo(hp.mesh_dict(np.vstack([V1, V2]), np.vstack([F1, F2 + len(V1)]), 1.0))
    c2 = sp.crease_specs(topo2, bones, sp.profile_config({"crease": False}))[0][0]
    cov2 = sp.crease_coverage(topo2, c2)
    assert cov2["one_side_empty"] and cov2["band_rows_distal"] == 0 and cov2["band_rows_proximal"] >= 16
    assert abs(cov2["nearest_row_distal_m"] - 0.03) < 1e-9 and cov2["edges_crossing"] == 0
    assert cov2["crossing_edge_max_m"] is None
    _, info = sp.apply_profiles(np.zeros((topo2.n_w, bones.k)), topo2, bones, None, {"crease": False})
    assert [f.split(":")[0] for f in info["crease_band_flags"]] == ["wrist_L"]
    assert info["creases"][0]["band"] == cov2


def test_B_profile_measurements(fig):
    m, skel, setup = fig
    W = np.zeros((setup.topo.n_w, setup.bones.k))
    b = setup.bones
    x = setup.topo.P[:, 0]
    arm = np.abs(x) > 0.16
    W[~arm, b.col("chest")] = 1.0
    for s, sg in (("L", 1.0), ("R", -1.0)):
        side = arm & (sg * x > 0)
        W[side & (sg * x < 0.45), b.col(f"{s}_UpperArm")] = 1.0
        W[side & (sg * x >= 0.45), b.col(f"{s}_ForeArm")] = 1.0
    F, rep = skin_rules.finish(W, setup, skel, {})
    ext = sp.wrist_extent(F, setup.topo, setup.bones)
    assert ext["L"]["ok"] and ext["R"]["ok"] and ext["L"]["extent_m"] <= ext["L"]["half_width_m"] * (1 + 0.25) + 1e-9
    bins = sp.twist_bins(F, setup.topo, setup.bones)
    fore = bins["L_ForeArm"]["bins"]
    assert all(bb["max_dev"] is None or bb["max_dev"] < 0.02 for bb in fore)
    assert abs(fore[5]["mean"] - 0.5 * 0.55) < 0.03 and bins["L_UpperArm"]["mode"] == "self"


def _ring_rows(head, tail, radii, du, u_range, n_around=24):
    """Points around the segment head->tail at the given radii, every ``du`` along it over ``u_range`` (m from head)."""
    head, tail = np.asarray(head, float), np.asarray(tail, float)
    d = (tail - head) / np.linalg.norm(tail - head)
    e1 = sc._unit(np.cross(d, [0.0, 1.0, 0.0]))
    e2 = np.cross(d, e1)
    out = []
    for u in np.arange(u_range[0], u_range[1] + 1e-12, du):
        for i, r in enumerate(radii):
            a = 2 * np.pi * (np.arange(n_around) + 0.5 * i) / n_around
            out.append(head + u * d + r * (np.cos(a)[:, None] * e1 + np.sin(a)[:, None] * e2))
    return np.vstack(out)


def test_B_hip_transition_on_thigh_excludes_robe_between_legs():
    """Review r2 N4: the hip transition is measured on the thigh (rho < 1.25 R; rows beyond R in the inner half of the gap between
    the legs left out). Thick legs (radii 6-12 cm around thigh lines 20 cm apart) carry a clean ramp f = thigh share from 0 at
    the hip to 1 at 0.2 L; a dense robe strip between the legs (f = 1/3) delays the 0.9 median of all rows past the strip."""
    from types import SimpleNamespace

    m, skel = hp.figure()
    bones = sc.BoneSet.from_skeleton(skel)
    t, tr, pv = bones.col("L_Thigh"), bones.col("R_Thigh"), bones.col("pelvis")
    L = bones.length(t)
    legs = [_ring_rows(bones.head[j], bones.tail[j], np.linspace(0.06, 0.12, 7), 0.005, (-0.05, 0.42), n_around=12)
            for j in (t, tr)]
    ys, zs = np.linspace(-0.04, 0.04, 17), np.arange(0.55, 0.9001, 0.002)
    robe = np.array([(x, y, z) for x in (-0.009, -0.006, -0.003) for y in ys for z in zs])
    P = np.vstack(legs + [robe])
    W = np.zeros((len(P), bones.k))
    n0, n1 = len(legs[0]), len(legs[0]) + len(legs[1])
    for j, sl in ((t, slice(0, n0)), (tr, slice(n0, n1))):
        d = (bones.tail[j] - bones.head[j]) / bones.length(j)
        f = np.clip(((P[sl] - bones.head[j]) @ d) / (0.2 * L), 0.0, 1.0)
        W[sl, j], W[sl, pv] = f, 1.0 - f
    W[n1:, t], W[n1:, tr], W[n1:, pv] = 0.25, 0.25, 0.5
    res = sp.measure_hip_transition(W, SimpleNamespace(P=P), bones)["L"]
    assert res["measured_on"] == "on_thigh" and 0.07 < res["thigh_radius_m"] < 0.095
    assert res["max_median"] >= 0.9 and abs(res["width_over_thigh"] - 0.16) <= 0.03 and res["ok"]
    al = res["all_rows"]
    assert al["rows"] > res["rows"] and (al["width_over_thigh"] is None or al["width_over_thigh"] > 0.4), al
