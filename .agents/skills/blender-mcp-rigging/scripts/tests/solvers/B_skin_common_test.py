"""Writer B: synthetic tests of solvers.skin_common (enforce, influence-cap rule, limb groups, invariants, exporter rule, overrides,
BFS order, import without scipy/igl)."""
import os
import subprocess
import sys

import numpy as np
import pytest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from solvers import skin_common as sc  # noqa: E402
from solvers import skin_profiles as sp  # noqa: E402
from solvers import skin_rules  # noqa: E402

import B_helpers as hp  # noqa: E402

SCRIPTS = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def _pair_skeleton(H=1.0):
    """pelvis (centre) + L_/R_ thighs + an aux bone 'sack' under pelvis + 'helmet'."""
    b = [hp.bone("root", None, (0, 0, 0), (0, 0, 0.02), deform=False),
         hp.bone("pelvis", "root", (0, 0, 0.5), (0, 0, 0.6)),
         hp.bone("L_Thigh", "pelvis", (0.1, 0, 0.5), (0.1, 0, 0.1)),
         hp.bone("R_Thigh", "pelvis", (-0.1, 0, 0.5), (-0.1, 0, 0.1)),
         hp.bone("spine", "pelvis", (0, 0, 0.6), (0, 0, 0.8)),
         hp.bone("sack", "spine", (0, 0.1, 0.7), (0, 0.15, 0.8), kind="aux"),
         hp.bone("helmet", "spine", (0, 0, 0.9), (0, 0, 1.0), kind="aux")]
    return hp.skeleton(b, H)


def _grid_mesh(H=1.0, n=21):
    xs = np.linspace(-0.3, 0.3, n)
    zs = np.linspace(0.0, 1.0, n)
    X, Z = np.meshgrid(xs, zs, indexing="ij")
    V = np.stack([X.ravel(), np.zeros(X.size), Z.ravel()], 1)
    idx = np.arange(X.size).reshape(n, n)
    F = []
    for i in range(n - 1):
        for j in range(n - 1):
            a, b, c, d = idx[i, j], idx[i + 1, j], idx[i, j + 1], idx[i + 1, j + 1]
            F += [[a, b, d], [a, d, c]]
    return hp.mesh_dict(V, np.array(F), H)


def _cons(rules=None, H=1.0):
    m = _grid_mesh(H)
    topo = sc.weld_topo(m)
    bones = sc.BoneSet.from_skeleton(_pair_skeleton(H))
    ctx = skin_rules.RuleContext(topo, bones)
    labels = skin_rules.classify(ctx, (rules or {}).get("classes", []))
    cons = skin_rules.build_constraints(topo, bones, rules or {}, labels=labels)
    return topo, bones, cons


@pytest.fixture(scope="module")
def fig():
    m, skel = hp.figure()
    setup = skin_rules.prepare(m, skel, {})
    return m, skel, setup


# --------------------------------------------------------------------------------------------------------------------------
# enforce
# --------------------------------------------------------------------------------------------------------------------------


def test_B_enforce_invariants_random():
    topo, bones, cons = _cons({"side_gate": {"band_H": 0.01}})
    rng = np.random.default_rng(1)
    W = rng.random((topo.n_w, bones.k)) ** 4
    W[rng.random(W.shape) < 0.3] = 0
    W[5] = 0.0  # an empty row gets the nearest allowed bone
    n_empty = int((W.sum(1) == 0).sum())
    Wf, rep = sc.enforce(W, cons)
    inv = rep["invariants"]
    assert inv["sum_err_max"] <= 1e-6 and inv["max_influences"] <= 4 and inv["empty"] == 0 and inv["below_prune"] == 0
    assert rep["empty_filled"] == n_empty >= 1


def test_B_enforce_idempotent():
    topo, bones, cons = _cons({"side_gate": {"band_H": 0.01}, "rigid": {"cap": {"where": "z > 0.95", "bone": "helmet"}}})
    rng = np.random.default_rng(2)
    W = rng.random((topo.n_w, bones.k)) ** 3
    W1, _ = sc.enforce(W, cons)
    W2, _ = sc.enforce(W1, cons)
    assert np.abs(W2 - W1).max() <= 1e-12
    W3, _ = sc.enforce(W1.astype(np.float32), cons)  # after a float32 round trip (weights.npz storage)
    assert np.abs(W3 - W1).max() <= 1e-6


def test_B_enforce_caps_and_prune():
    topo, bones, cons = _cons({})
    cons.caps = np.full(topo.n_w, 2)
    cons.prune = 0.05
    W = np.zeros((topo.n_w, bones.k))
    cols = [bones.col(n) for n in ("pelvis", "spine", "sack", "helmet")]  # unsided bones: the side gate stays out of it
    W[:, cols] = [0.5, 0.3, 0.12, 0.05]
    Wf, rep = sc.enforce(W, cons)
    assert ((Wf > 0).sum(1) <= 2).all()
    assert np.allclose(Wf[:, cols[0]], 0.5 / 0.8) and np.allclose(Wf[:, cols[1]], 0.3 / 0.8)
    cons.caps = np.full(topo.n_w, 4)
    Wf, rep = sc.enforce(W, cons)  # cap 4: 0.05 / 0.97 = 0.0515 survives prune 0.05, nothing else is cut
    assert ((Wf > 0).sum(1) == 4).all() and rep["pruned"] == 0


def test_B_seam_duplicates_equal_after_enforce():
    m, skel, _ = hp.bent_arm()
    topo = sc.weld_topo(m)
    assert topo.n_w < topo.n  # the tube has seam duplicates
    bones = sc.BoneSet.from_skeleton(skel)
    cons = skin_rules.build_constraints(topo, bones, {})
    rng = np.random.default_rng(3)
    W_full = rng.random((topo.n, bones.k))  # duplicates disagree on purpose
    assert sc.seam_max_diff(W_full, m["weld"]) > 0.1
    Wf, _ = sc.enforce(topo.gather(W_full), cons)
    out = sc.to_full(Wf, topo)
    assert sc.seam_max_diff(out, m["weld"]) <= 1e-6


def test_B_checked_fold_raises_invariant_error(monkeypatch):
    topo, bones, cons = _cons({"side_gate": {"band_H": 0.01}})
    W = np.zeros((topo.n_w, bones.k))
    W[:, bones.col("L_Thigh")] = 1.0  # forbidden on the right side
    assert np.abs(np.where(~cons.allowed, sc.checked_fold(W, cons, "ok"), 0.0)).max() == 0.0
    monkeypatch.setattr(sc, "fold", lambda W_, c_: np.array(W_, dtype=np.float64))  # a broken fold
    with pytest.raises(sc.InvariantError) as ei:
        sc.checked_fold(W, cons, "broken")
    assert ei.value.report["forbidden_weight_max"] == 1.0


# --------------------------------------------------------------------------------------------------------------------------
# influence-cap rule and limb groups
# --------------------------------------------------------------------------------------------------------------------------


def _row(bones, **w):
    r = np.zeros(bones.k)
    for n, v in w.items():
        r[bones.col(n)] = v
    return r


def _cap_cons(setup, rows, P=None):
    """Constraints of the figure restricted to len(rows) synthetic rows placed at ``P`` (default: the chest, outside every crease
    zone; every bone allowed there)."""
    c = setup.cons
    n = len(rows)
    P = np.tile(setup.bones.head[setup.bones.col("chest")], (n, 1)) if P is None else np.asarray(P, dtype=np.float64)
    return c.copy_with(allowed=np.ones((n, setup.bones.k), bool), region_of=np.full(n, -1), rigid_col=np.full(n, -1),
                       caps=np.full(n, 4), locked=None, locked_val=None, side_allowed=None,
                       groups=sp.limb_groups(setup.bones, setup.topo, None, P), notes={"_P": P})


def test_B_cap_rule_small_tail_blend_and_report(fig):
    """Blend caps are tolerance caps (review r2): a shoulder / hip blend row drops its entries beyond the cap only when they sum
    below extra_tol (0.05); rows at or above it keep them and are reported per group."""
    m, skel, setup = fig
    b = setup.bones
    rows = np.array([_row(b, chest=0.6, spine_02=0.36, neck=0.025, head=0.015),       # 3rd+ = 0.04 < 0.05 -> 2 influences
                     _row(b, chest=0.5, spine_02=0.34, neck=0.1, head=0.06),          # 3rd+ = 0.16 -> keeps 4
                     _row(b, L_UpperArm=0.5, chest=0.3, L_Clavicle=0.12, spine_02=0.08),  # shoulder blend, 4th 0.08 -> kept
                     _row(b, L_Thigh=0.45, pelvis=0.3, spine_01=0.15, spine_02=0.1),  # hip blend, 4th 0.1 -> kept
                     _row(b, L_Thigh=0.5, L_Calf=0.3, pelvis=0.12, spine_01=0.08),    # hip blend, 4th 0.08 -> kept
                     _row(b, L_Thigh=0.5, pelvis=0.32, spine_01=0.15, spine_02=0.03)])  # hip blend, 4th 0.03 -> 3
    cons = _cap_cons(setup, rows)
    W, rep = sc.enforce(rows, cons)
    nnz = (W > 0).sum(1)
    assert nnz.tolist() == [2, 4, 4, 4, 4, 3]
    assert np.allclose(W[0, [b.col("chest"), b.col("spine_02")]], [0.6 / 0.96, 0.36 / 0.96])
    assert np.allclose(W[2:5], rows[2:5])  # kept rows are left as they are
    assert np.allclose(W[5, [b.col("L_Thigh"), b.col("pelvis"), b.col("spine_01")]], np.array([0.5, 0.32, 0.15]) / 0.97)
    caps = rep["caps"]
    assert caps["rows_capped_small"] == 1 and caps["rows_capped_group_or_finger"] == 1 and caps["rows_capped_blend"] == 1
    assert abs(caps["removed_max"] - 0.04) < 1e-12 and caps["small_cap_removed_max"] < 0.05
    assert abs(caps["blend_cap_removed_max"] - 0.03) < 1e-12
    assert caps["blend_rows_shoulder_L"] == 1 and caps["blend_rows_hip_L"] == 3 and caps["blend_rows_kept_over_cap"] == 3
    assert caps["blend_rows_kept_over_cap_shoulder_L"] == 1 and caps["blend_rows_kept_over_cap_hip_L"] == 2
    assert caps["blend_rows_kept_over_cap_hip_R"] == 0 and caps["kept_beyond_max_hip_R"] == 0.0
    assert abs(caps["kept_beyond_max_shoulder_L"] - 0.08) < 1e-12 and abs(caps["kept_beyond_max_hip_L"] - 0.1) < 1e-12
    assert caps["kept_bones_hip_L"] == {"spine_02": {"entries": 1, "weight_sum": 0.1, "weight_max": 0.1},
                                        "spine_01": {"entries": 1, "weight_sum": 0.08, "weight_max": 0.08}}
    assert list(caps["kept_bones_shoulder_L"]) == ["spine_02"]
    assert rep["invariants"]["cap_rule_over"] == 0 and rep["invariants"]["blend_rows_kept_over_cap"] == 3
    W2, _ = sc.enforce(W, cons)
    assert np.abs(W2 - W).max() <= 1e-12  # enforce twice = once


def test_B_cap_rule_finger_cap_stays_hard(fig):
    """The finger cap is hard: a finger row keeps 2 influences even when that removes >= extra_tol, also when the row is a blend
    row whose tail the tolerance would keep (L_Hand stands in for a finger column; the figure has no finger bones)."""
    m, skel, setup = fig
    b = setup.bones
    rows = np.array([_row(b, L_Hand=0.5, L_ForeArm=0.3, chest=0.12, spine_02=0.08),
                     _row(b, L_Hand=0.4, L_UpperArm=0.3, chest=0.2, spine_02=0.1)])  # also a shoulder blend row, 4th 0.1
    base = _cap_cons(setup, rows)
    rule = sc.CapRule(extra_tol=0.05, small_cap=2, groups=base.cap_rule.groups, finger_cols=np.array([b.col("L_Hand")]),
                      finger_cap=2)
    cons = base.copy_with(cap_rule=rule)
    W, rep = sc.enforce(rows, cons)
    assert ((W > 0).sum(1) == 2).all() and np.allclose(W[:, b.col("L_Hand")], [0.5 / 0.8, 0.4 / 0.7])
    caps = rep["caps"]
    assert caps["finger_rows"] == 2 and abs(caps["finger_cap_removed_max"] - 0.3) < 1e-12
    assert caps["blend_rows_shoulder_L"] == 1 and caps["blend_rows_kept_over_cap_shoulder_L"] == 0
    W2, _ = sc.enforce(W, cons)
    assert np.abs(W2 - W).max() <= 1e-12


def test_B_cap_rule_blend_tolerance_invariant(fig):
    """check_invariants: a blend row over its cap is valid when its entries beyond the cap sum to >= extra_tol (kept, counted)
    and invalid below it (0.03: enforce would have dropped it)."""
    m, skel, setup = fig
    b = setup.bones
    kept = np.array([_row(b, L_Thigh=0.45, pelvis=0.3, spine_01=0.15, spine_02=0.1)])
    rep = sc.check_invariants(kept, _cap_cons(setup, kept))
    assert rep["cap_rule_over"] == 0 and rep["blend_rows_kept_over_cap"] == 1
    bad = np.array([_row(b, L_Thigh=0.5, pelvis=0.32, spine_01=0.15, spine_02=0.03)])  # uncapped: 4th 0.03 < 0.05
    with pytest.raises(sc.InvariantError) as ei:
        sc.check_invariants(bad, _cap_cons(setup, bad))
    assert ei.value.report["cap_rule_over"] == 1 and ei.value.report["blend_rows_kept_over_cap"] == 0
    fixed, _ = sc.enforce(bad, _cap_cons(setup, bad))
    assert (fixed > 0).sum() == 3 and sc.check_invariants(fixed, _cap_cons(setup, bad))["cap_rule_over"] == 0


def test_B_cap_rule_blend_cap_then_small_tail_is_idempotent(fig):
    """A hip blend row whose 3rd influence falls below extra_tol only after the blend cap (4 -> 3 -> 2): one enforce settles it
    (the small-tail test runs after the blend cap), and a second enforce changes nothing."""
    m, skel, setup = fig
    b = setup.bones
    rows = np.array([_row(b, L_Thigh=0.5, pelvis=0.42, spine_02=0.045, spine_01=0.035)])
    cons = _cap_cons(setup, rows)
    W1, _ = sc.enforce(rows, cons)
    W2, _ = sc.enforce(W1, cons)
    assert (W1 > 0).sum() == 2 and np.abs(W2 - W1).max() <= 1e-12


def test_B_cap_rule_random_idempotent_and_checked(fig):
    m, skel, setup = fig
    rng = np.random.default_rng(7)
    W = rng.random((setup.topo.n_w, setup.bones.k)) ** 6
    W[rng.random(W.shape) < 0.5] = 0.0
    W1, rep = sc.enforce(W, setup.cons)
    assert rep["invariants"]["cap_rule_over"] == 0 and rep["invariants"]["cap_rule_small_tail"] == 0
    assert rep["invariants"]["blend_rows_kept_over_cap"] > 0 and rep["caps"]["rows_capped_blend"] > 0  # both branches run
    assert rep["caps"]["blend_cap_removed_max"] < 0.05 and rep["caps"]["small_cap_removed_max"] < 0.05
    W2, _ = sc.enforce(W1, setup.cons)
    assert np.abs(W2 - W1).max() <= 1e-12
    W3, _ = sc.enforce(W1.astype(np.float32), setup.cons)
    assert np.abs(W3 - W1).max() <= 1e-6
    bad = W1.copy()
    r = int(np.flatnonzero((W1 > 0).sum(1) == 2)[0])
    j = int(np.flatnonzero(W1[r] == 0)[0])
    bad[r, j] = 0.02  # a third influence far below extra_tol (kept unnormalized: the row-sum check fires too)
    with pytest.raises(sc.InvariantError) as ei:
        sc.check_invariants(bad, setup.cons)
    assert ei.value.report["cap_rule_small_tail"] >= 1


def test_B_drop_entries_limb_groups(fig):
    m, skel, setup = fig
    b = setup.bones
    elbow_side = b.head[b.col("L_ForeArm")] + 0.1 * (b.tail[b.col("L_ForeArm")] - b.head[b.col("L_ForeArm")])
    wrist_side = b.head[b.col("L_ForeArm")] + 0.8 * (b.tail[b.col("L_ForeArm")] - b.head[b.col("L_ForeArm")])
    P = np.array([b.head[b.col("L_UpperArm")], b.head[b.col("L_Calf")], b.head[b.col("chest")], elbow_side, wrist_side])
    g = sp.limb_groups(b, setup.topo, None, P)
    W = np.array([_row(b, L_UpperArm=0.6, L_UpperArm_twist=0.005, chest=0.395),      # twist entry -> its unit
                  _row(b, L_Thigh=0.03, L_Calf=0.6, pelvis=0.37),                    # thigh -> its crease partner (calf)
                  _row(b, L_UpperArm_twist=0.004, chest=0.5, spine_02=0.496),        # no partner left -> renormalized later
                  _row(b, L_ForeArm_twist=0.03, L_UpperArm=0.4, L_Hand=0.2, chest=0.37),  # forearm near the elbow -> upper arm
                  _row(b, L_ForeArm_twist=0.03, L_UpperArm=0.4, L_Hand=0.2, chest=0.37)])  # near the wrist -> hand
    drop = W < 0.01
    drop &= W > 0
    drop[1, b.col("L_Thigh")] = True
    drop[3:, b.col("L_ForeArm_twist")] = True
    out, lost, back = sc.drop_entries(W, drop, g)
    assert np.isclose(out[0, b.col("L_UpperArm")], 0.605) and out[0, b.col("L_UpperArm_twist")] == 0.0
    assert np.isclose(out[1, b.col("L_Calf")], 0.63) and np.isclose(out[1, b.col("pelvis")], 0.37)
    assert np.isclose(out[2].sum(), 0.996)
    assert np.isclose(out[3, b.col("L_UpperArm")], 0.43) and np.isclose(out[3, b.col("L_Hand")], 0.2)
    assert np.isclose(out[4, b.col("L_UpperArm")], 0.4) and np.isclose(out[4, b.col("L_Hand")], 0.23)
    assert np.allclose(back, [0.005, 0.03, 0.0, 0.03, 0.03]) and np.allclose(lost, [0.005, 0.03, 0.004, 0.03, 0.03])
    out0, _, back0 = sc.drop_entries(W, drop, None)  # no groups: plain removal
    assert np.isclose(out0[0].sum(), 0.995) and not back0.any()


def test_B_crease_partner_only_inside_its_zone(fig):
    """Review r2 R2: a dropped limb entry goes to the other side of a crease only where that crease acts. A row 2r above the knee
    with Calf 0.008 loses the Calf entry (prune) and keeps its Thigh : pelvis ratio (renormalized over the row); the same row
    inside the knee band gives the Calf weight to the thigh; a chest row's stray forearm entry is not moved to the upper arm
    (round 2: the forearm's elbow half came from an unclamped t, so the torso counted as near the elbow)."""
    m, skel, setup = fig
    b = setup.bones
    knee = {c.name: c for c in sp.crease_specs(setup.topo, b, sp.profile_config(None))[0]}["knee_L"]
    up = sc._unit(b.head[b.col("L_Thigh")] - b.tail[b.col("L_Thigh")])  # from the knee toward the hip
    P = np.array([knee.J + 2.0 * knee.r * up, knee.J + 0.5 * knee.h * up, b.head[b.col("chest")]])
    assert knee.zone(P).tolist() == [False, True, False]
    rows = np.array([_row(b, L_Thigh=0.6, pelvis=0.392, L_Calf=0.008),
                     _row(b, L_Thigh=0.6, pelvis=0.392, L_Calf=0.008),
                     _row(b, L_UpperArm=0.3, chest=0.692, L_ForeArm=0.008)])
    W, rep = sc.enforce(rows, _cap_cons(setup, rows, P))
    t, p, c = b.col("L_Thigh"), b.col("pelvis"), b.col("L_Calf")
    assert W[0, c] == 0.0 and np.isclose(W[0, t] / W[0, p], 0.6 / 0.392) and np.isclose(W[0].sum(), 1.0)
    assert W[1, c] == 0.0 and np.isclose(W[1, t], 0.608) and np.isclose(W[1, p], 0.392)  # in the knee zone: to the thigh
    ua, ch = b.col("L_UpperArm"), b.col("chest")
    assert W[2, b.col("L_ForeArm")] == 0.0 and np.isclose(W[2, ua] / W[2, ch], 0.3 / 0.692)
    g = setup.cons.groups  # on the figure: every partner row lies in its crease's zone
    specs = {c_.name: c_ for c_ in sp.crease_specs(setup.topo, b, sp.profile_config(None))[0]}
    zk = specs["knee_L"].zone(setup.topo.P)
    assert np.array_equal(g.partners[b.col("L_Calf")][0][0], zk) and np.array_equal(g.partners[b.col("L_Thigh")][0][0], zk)
    assert 0 < zk.sum() < 0.1 * setup.topo.n_w


# --------------------------------------------------------------------------------------------------------------------------
# exporter rule, overrides, BFS order
# --------------------------------------------------------------------------------------------------------------------------


def _exporter_reference(W, drop=1e-4, k=4):
    out = np.zeros_like(W, dtype=np.float64)
    for i, row in enumerate(W):
        items = [(w, j) for j, w in enumerate(row) if w > drop]
        items.sort(key=lambda t: (-t[0], t[1]))
        items = items[:k]
        s = sum(w for w, _ in items)
        for w, j in items:
            out[i, j] = w / s if s > 0 else 0.0
    return out


def test_B_exporter_rule_matches_reference():
    rng = np.random.default_rng(4)
    W = rng.random((500, 9)) ** 3
    W[rng.random(W.shape) < 0.4] = 0.0
    W[rng.random(W.shape) < 0.05] = 5e-5  # below the drop threshold
    W[7] = 0.0
    assert np.abs(sc.exporter_rule(W) - _exporter_reference(W)).max() <= 1e-12


def test_B_overrides_record_apply_enforce():
    topo, bones, cons = _cons({})
    rng = np.random.default_rng(5)
    W_ref, _ = sc.enforce(rng.random((topo.n_w, bones.k)), cons)
    W_user = W_ref.copy()
    rows = [10, 200]
    W_user[rows] = 0.0
    W_user[rows, bones.col("spine")] = 0.7
    W_user[rows, bones.col("pelvis")] = 0.3
    doc = sc.overrides_record(topo.P, bones.names, W_ref, W_user, "synthetic", 1.0)
    assert {tuple(e["pos"]) for e in doc["entries"]} == {tuple(topo.P[r]) for r in rows}
    locked, vals, rep = sc.overrides_apply(doc, topo.P, bones)
    assert rep["applied"] == len(doc["entries"]) and rep["unmatched_pos"] == 0
    c2 = cons.copy_with(locked=locked, locked_val=vals)
    Wf, _ = sc.enforce(W_ref, c2)
    assert np.allclose(Wf[rows][:, [bones.col("spine"), bones.col("pelvis")]], [[0.7, 0.3]] * 2)
    assert np.allclose(np.delete(Wf, rows, 0), np.delete(W_ref, rows, 0))


def test_B_overrides_zeroed_row_raises():
    topo, bones, cons = _cons({})
    rng = np.random.default_rng(8)
    W_ref, _ = sc.enforce(rng.random((topo.n_w, bones.k)), cons)
    W_user = W_ref.copy()
    W_user[33] = 0.0  # the user removed every weight of one vertex
    with pytest.raises(ValueError, match="remove every weight"):
        sc.overrides_record(topo.P, bones.names, W_ref, W_user, "synthetic", 1.0)
    # a hand-written override file doing the same must not silently bind the vertex to bone 0
    doc = {"entries": [{"pos": topo.P[33].tolist(), "bone": n, "weight": 0.0} for n in bones.names]}
    locked, vals, _ = sc.overrides_apply(doc, topo.P, bones, pos_tol=1e-9)
    with pytest.raises(ValueError, match="zero every weight"):
        sc.enforce(W_ref, cons.copy_with(locked=locked, locked_val=vals))


def test_B_bfs_nearest_source_order_independent():
    m, _, _ = hp.bent_arm()
    topo = sc.weld_topo(m)
    src = topo.P[:, 0] < 0.15
    elig = ~src
    hop1, near1 = sc.bfs_nearest_source(topo, src, elig, 30)
    perm = np.random.default_rng(6).permutation(m["V"].shape[0])
    inv = np.argsort(perm)
    m2 = hp.mesh_dict(m["V"][perm], inv[m["F"]], 1.0)
    topo2 = sc.weld_topo(m2)
    src2 = topo2.P[:, 0] < 0.15
    hop2, near2 = sc.bfs_nearest_source(topo2, src2, ~src2, 30)
    # compare by position: same hop and same source position for every welded position
    key1 = {tuple(np.round(p, 9)): (h, tuple(np.round(topo.P[n], 9)) if n >= 0 else None) for p, h, n in zip(topo.P, hop1, near1)}
    key2 = {tuple(np.round(p, 9)): (h, tuple(np.round(topo2.P[n], 9)) if n >= 0 else None) for p, h, n in zip(topo2.P, hop2, near2)}
    assert key1 == key2


# --------------------------------------------------------------------------------------------------------------------------
# Blender-side import: numpy + rigcore only
# --------------------------------------------------------------------------------------------------------------------------


_BLOCKED_IMPORT = r"""
import importlib.util, os, sys
sys.dont_write_bytecode = True
for name in ("scipy", "igl", "trimesh", "solvers"):
    sys.modules[name] = None  # any import of these raises ImportError
scripts = sys.argv[1]
sys.path.insert(0, scripts)
spec = importlib.util.spec_from_file_location("rigkit_skin_common", os.path.join(scripts, "solvers", "skin_common.py"))
mod = importlib.util.module_from_spec(spec)
sys.modules["rigkit_skin_common"] = mod
spec.loader.exec_module(mod)
import numpy as np
W = np.array([[0.5, 0.3, 0.2, 0.0], [0.0, 0.0, 0.0, 1.0]])
ref = mod.exporter_rule(W, drop=0.25)
assert np.allclose(ref, [[0.625, 0.375, 0.0, 0.0], [0, 0, 0, 1.0]]), ref
names = ["a", "b", "c", "d"]
bones = mod.BoneSet(names=names, head=np.zeros((4, 3)), tail=np.ones((4, 3)), hinge=np.zeros((4, 3)), side=[None] * 4,
                    kind=["core"] * 4, parent=[None] * 4, twist=[None] * 4,
                    all_bones={n: {"name": n, "parent": None} for n in names}, H=1.0)
cons = mod.Constraints(bones=bones, allowed=np.ones((2, 4), bool), region_of=np.full(2, -1), regions=[], rigid_col=np.full(2, -1),
                       caps=np.full(2, 4), prune=0.01, max_influences=4)
out, rep = mod.enforce(W, cons)
loaded = sorted(k for k in sys.modules if k.split(".")[0] in ("scipy", "igl", "trimesh", "solvers") and sys.modules[k] is not None)
print("OK", rep["invariants"]["sum_err_max"], loaded)
"""


def test_B_limb_columns_and_leak_counts():
    """I2 (review B r3): limb bones = limb chains incl. descendants (a finger under the hand), not ears or sacks; limb_leak counts
    torso rows far from the upper arm (unit incl. its twist bone) and torso rows high above the hip joint, per side, with the
    review's above-joint numbers, the union and the rows per region."""
    names = ["chest", "head", "L_ear", "L_Clavicle", "L_UpperArm", "L_UpperArm_twist", "L_Hand", "L_index_01", "sack", "R_Thigh"]
    par = {"chest": None, "head": "chest", "L_ear": "head", "L_Clavicle": "chest", "L_UpperArm": "L_Clavicle",
           "L_UpperArm_twist": "L_UpperArm", "L_Hand": "L_UpperArm", "L_index_01": "L_Hand", "sack": "chest", "R_Thigh": None}
    assert sc.limb_columns(names, par).tolist() == [False, False, False, True, True, True, True, True, False, True]
    assert sc.limb_columns(["L_index_01"]).tolist() == [False]  # without the hierarchy only the base names count
    names = ["chest", "L_UpperArm", "L_UpperArm_twist", "R_Thigh"]
    heads = np.array([[0, 0, 1.0], [0.2, 0, 1.4], [0.25, 0, 1.4], [-0.1, 0, 0.9]])
    tails = np.array([[0, 0, 1.4], [0.4, 0, 1.4], [0.3, 0, 1.4], [-0.1, 0, 0.5]])  # upper arm 0.2 m, thigh 0.4 m
    P = np.array([[0.05, 0, 1.0],    # torso, 0.427 m from the upper arm (> 0.15): leaks 0.3 of the arm unit
                  [0.05, 0, 1.05],   # torso, far, only 0.05 of the arm: below w_min
                  [0.1, 0, 1.38],    # torso, 0.1 m from the arm (< 0.15): not far
                  [0.3, 0.03, 1.4],  # nearest bone = the arm: not a torso row
                  [-0.05, 0, 1.1],   # torso, 0.5 thigh lengths above the R hip: leaks 0.2 thigh
                  [-0.06, 0, 0.98]])  # torso (chest 0.063 m, thigh head 0.089 m), 0.2 thigh lengths above the hip: not high
    W = np.zeros((6, 4))
    W[:, 0] = 1.0
    W[0, [0, 2]] = [0.7, 0.3]
    W[1, [0, 1]] = [0.95, 0.05]
    W[2, [0, 1]] = [0.5, 0.5]
    W[3, [0, 1]] = [0.0, 1.0]
    W[4, [0, 3]] = [0.8, 0.2]
    W[5, [0, 3]] = [0.6, 0.4]
    reg = {"chest": np.array([1, 1, 1, 0, 1, 1], bool), "L_UpperArm": np.array([0, 0, 0, 1, 0, 0], bool)}
    r = sc.limb_leak(P, W, names, heads, tails, {"L_UpperArm_twist": "L_UpperArm"}, regions=reg, with_mask=True)
    a, t = r["by_limb"]["arm_L"], r["by_limb"]["thigh_R"]
    assert a["rows"] == 1 and a["bones"] == ["L_UpperArm", "L_UpperArm_twist"] and a["w_max"] == pytest.approx(0.3)
    assert a["length_m"] == pytest.approx(0.2) and set(r["by_limb"]) == {"arm_L", "thigh_R"}
    assert t["rows"] == 1 and t["w_max"] == pytest.approx(0.2) and t["rows_above_joint"] == 2
    assert t["height_max_rel"] == pytest.approx(0.5) and t["w_max_above_joint"] == pytest.approx(0.4)
    assert r["rows"] == 2 and r["mask"].tolist() == [True, False, False, False, True, False] and r["w_max"] == pytest.approx(0.3)
    assert r["by_region"] == {"chest": {"rows": 2, "arm_L": 1, "thigh_R": 1}}
    assert r["params"] == sc.LEAK_PARAMS and r["torso_rows"] == 5
    cfg = sc.leak_config()
    assert cfg["params"] == sc.LEAK_PARAMS and cfg["band"] == 3 and "L_UpperArm" in cfg["gate_regions"]


def test_B_finish_reports_limb_leak(fig):
    """Every candidate's finish report carries limb_leak (skinning.md "Candidate B limb envelope"): torso rows given 0.3 of
    L_UpperArm far from the arm are counted, the clean weights have none."""
    m, skel, setup = fig
    b = setup.bones
    P = setup.topo.P
    W = np.zeros((setup.topo.n_w, b.k))
    near = np.stack([sc.seg_dist(P, b.head[j], b.tail[j])[0] for j in range(b.k)], 1).argmin(1)
    W[np.arange(len(P)), near] = 1.0
    _, rep = skin_rules.finish(W, setup, skel, {})
    assert rep["limb_leak"]["rows"] == 0 and not rep["limb_leak"]["over_band"] and rep["limb_leak"]["band"] == 3
    # left half of the torso tube (radius 0.14), outside the side band, between the hips and the shoulders: nearest bone = spine
    belly = (np.hypot(P[:, 0], P[:, 1]) > 0.13) & (P[:, 0] > 0.03) & (P[:, 2] > 1.1) & (P[:, 2] < 1.2)
    W2 = W.copy()
    W2[belly] *= 0.7
    W2[belly, b.col("L_UpperArm")] += 0.3
    _, rep2 = skin_rules.finish(W2, setup, skel, {})
    assert rep2["limb_leak"]["by_limb"]["arm_L"]["rows"] == int(belly.sum()) > 3 and rep2["limb_leak"]["over_band"]


def test_B_skin_common_imports_without_scipy_igl():
    """rigkit/skin_io.py loads skin_common by path inside Blender: it must work with scipy, igl and the solvers package blocked."""
    r = subprocess.run([sys.executable, "-I", "-B", "-c", _BLOCKED_IMPORT, SCRIPTS], capture_output=True, text=True, timeout=120)
    assert r.returncode == 0, r.stderr[-2000:]
    assert r.stdout.strip().startswith("OK") and r.stdout.strip().endswith("[]"), r.stdout
