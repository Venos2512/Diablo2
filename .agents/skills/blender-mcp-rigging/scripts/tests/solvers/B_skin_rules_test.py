"""Writer B: synthetic tests of solvers.skin_rules (rule expressions, classes, side-gate planes from the skeleton, regions,
rigid)."""
import os
import sys
import warnings

import numpy as np
import pytest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from solvers import skin_common as sc  # noqa: E402
from solvers import skin_rules  # noqa: E402

import B_helpers as hp  # noqa: E402
from B_skin_common_test import _cons, _grid_mesh, _pair_skeleton  # noqa: E402


# --------------------------------------------------------------------------------------------------------------------------
# rule expressions
# --------------------------------------------------------------------------------------------------------------------------


def test_B_eval_expr_grammar():
    env = {"x": np.array([-1.0, 0.0, 2.0]), "y": np.array([1.0, 2.0, 3.0]), "cls": np.array(["a", "b", "c"])}
    f = {"abs": np.abs}
    ev = skin_rules.eval_expr
    assert ev("x > 0 and y < 4", env, f).tolist() == [False, False, True]
    assert ev("-0.5 < x < 1", env, f).tolist() == [False, True, False]
    assert ev("cls in ('a', 'c') or not y > 1", env, f).tolist() == [True, False, True]
    assert ev("abs(x) * 2 + y ** 2", env, f).tolist() == [3.0, 4.0, 13.0]
    assert ev("cls == 'b'", env, f).tolist() == [False, True, False]


@pytest.mark.parametrize("bad", ["__import__('os')", "x.real", "x[0]", "lambda: 1", "[c for c in x]", "open('f')", "z > 1",
                                 "x if y else 0", "f(x=1)"])
def test_B_eval_expr_rejects(bad):
    env = {"x": np.zeros(2), "y": np.ones(2)}
    with pytest.raises(sc.RuleError):
        skin_rules.eval_expr(bad, env, {"f": lambda **k: 0})


def test_B_classify_islands_set_vote():
    V1, F1, _ = hp.tube([(0, 0, 0), (0, 0, 1)], radius=0.1, n_per_seg=10, seam=False)
    V2, F2, _ = hp.tube([(0.5, 0, 0.8), (0.5, 0, 0.9)], radius=0.02, n_per_seg=3, seam=False)
    V = np.vstack([V1, V2])
    F = np.vstack([F1, F2 + len(V1)])
    m = hp.mesh_dict(V, F, 1.0)
    topo = sc.weld_topo(m)
    ctx = skin_rules.RuleContext(topo, sc.BoneSet.from_skeleton(_pair_skeleton()))
    lab = skin_rules.classify(ctx, [{"islands": {"main": "body", "else": "bit", "rules": [{"if": "cz > 0.8", "set": "small"}]}},
                                    {"set": "top", "where": "cls == 'body' and z > 0.9"},
                                    {"vote": {"among": ["body", "top"], "target": "top", "other": "body", "iters": 1,
                                              "min_nbrs": 3, "grow_frac": 0.99, "shrink_frac": 0.0}}])
    assert set(lab[topo.P[:, 0] > 0.3]) == {"small"}
    assert (lab[(topo.P[:, 0] < 0.3) & (topo.P[:, 2] > 0.95)] == "top").all()


# --------------------------------------------------------------------------------------------------------------------------
# side gate planes
# --------------------------------------------------------------------------------------------------------------------------


def _lr_skeleton(torso_x, pairs, H=1.8):
    """Unsided spine at x = torso_x and L/R chains whose root heads sit at the given x: pairs = {base: (xL, xR)}; every chain gets a
    child bone with other x (its plane must still be the root pair's)."""
    b = [hp.bone("root", None, (0, 0, 0), (0, 0, 0.04), deform=False),
         hp.bone("pelvis", "root", (torso_x, 0, 0.9), (torso_x, 0, 1.0)),
         hp.bone("chest", "pelvis", (torso_x, 0, 1.0), (torso_x, 0, 1.4)),
         hp.bone("head", "chest", (torso_x, 0, 1.5), (torso_x, 0, 1.8))]
    for base, (xl, xr) in pairs.items():
        par = "chest" if base == "Clavicle" else "pelvis"
        z = 1.4 if base == "Clavicle" else 0.9
        b += [hp.bone(f"L_{base}", par, (xl, 0, z), (xl + 0.1, 0, z - 0.05)),
              hp.bone(f"R_{base}", par, (xr, 0, z), (xr - 0.1, 0, z - 0.05)),
              hp.bone(f"L_{base}_child", f"L_{base}", (xl + 0.1, 0, z - 0.05), (xl + 0.6, 0, z - 0.1)),
              hp.bone(f"R_{base}_child", f"R_{base}", (xr - 0.1, 0, z - 0.05), (xr - 0.5, 0, z - 0.1))]
    return sc.BoneSet.from_skeleton(hp.skeleton(b, H))


def test_B_side_planes_from_skeleton_fl_and_d01_values():
    # FL dev skeleton heads (E:\tmp_rigkit\B\fl\skeleton.json): spine x 0.0457, clavicles 0.1020 / -0.0176, thighs 0.1723 / -0.0738
    fl = _lr_skeleton(0.0457, {"Clavicle": (0.1020, -0.0176), "Thigh": (0.1723, -0.0738)})
    x0, by, rep = skin_rules.side_planes({}, fl, 0.018)
    assert abs(x0 - 0.0457) < 1e-12 and rep["torso_source"] == "skeleton" and not rep["warnings"]
    assert abs(by["L_Clavicle"] - 0.0422) < 1e-12 and abs(by["R_Clavicle_child"] - 0.0422) < 1e-12  # chain plane, not 0
    assert abs(by["L_Thigh"] - 0.04925) < 1e-12 and abs(by["L_Thigh_child"] - 0.04925) < 1e-12
    # D01 G2 runtime: legs mirrored about x = 0.0105 (thighs 0.052 / -0.031), spine at x ~ 0
    d01 = _lr_skeleton(0.0, {"Thigh": (0.052, -0.031), "UpperArm": (0.078, -0.078)})
    x0, by, rep = skin_rules.side_planes({}, d01, 0.005)
    assert abs(by["R_Thigh_child"] - 0.0105) < 1e-12 and abs(by["L_UpperArm"]) < 1e-12 and x0 == 0.0


def test_B_side_planes_rules_override_and_warning():
    fl = _lr_skeleton(0.0457, {"Clavicle": (0.1020, -0.0176), "Thigh": (0.1723, -0.0738)})
    rules = {"side_gate": {"x0": 0.0, "planes": [{"x0": 0.05, "bones": ["{S}_Thigh"]}]}}
    with warnings.catch_warnings(record=True) as w:
        warnings.simplefilter("always")
        x0, by, rep = skin_rules.side_planes(rules, fl, 0.018)
    assert x0 == 0.0 and rep["torso_source"] == "rules"
    assert by["L_Thigh"] == 0.05 and by["R_Thigh"] == 0.05 and abs(by["L_Thigh_child"] - 0.04925) < 1e-12
    assert len(rep["warnings"]) == 1 and "torso plane" in rep["warnings"][0]  # 45.7 mm off; the thigh plane is 0.75 mm off
    assert len(w) == 1


def test_B_side_gate_band_and_fold():
    topo, bones, cons = _cons({"side_gate": {"band_H": 0.01}})
    x = topo.P[:, 0]
    jl, jr = bones.col("L_Thigh"), bones.col("R_Thigh")
    assert cons.allowed[x >= -0.01, jl].all() and not cons.allowed[x < -0.01, jl].any()
    assert cons.allowed[x <= 0.01, jr].all() and not cons.allowed[x > 0.01, jr].any()
    W = np.zeros((topo.n_w, bones.k))
    W[:, jl] = 0.6
    W[:, jr] = 0.4
    Wf, rep = sc.enforce(W, cons)
    jp = bones.col("pelvis")
    left = x > 0.01
    assert np.allclose(Wf[left, jr], 0.0) and np.allclose(Wf[left, jp], 0.4)  # R weight folded into the common parent
    right = x < -0.01
    assert np.allclose(Wf[right, jl], 0.0) and np.allclose(Wf[right, jp], 0.6)
    mid = np.abs(x) <= 0.01
    assert np.allclose(Wf[mid, jl], 0.6) and np.allclose(Wf[mid, jr], 0.4)  # inside the band both sides stay
    assert rep["invariants"]["forbidden_rows"] == 0


def test_B_side_gate_explicit_planes():
    with pytest.warns(UserWarning, match="off the skeleton's plane"):  # the pair skeleton's thighs are mirrored about x = 0
        topo, bones, cons = _cons({"side_gate": {"band_H": 0.01, "planes": [{"x0": 0.05, "bones": ["{S}_Thigh"]}]}})
    x = topo.P[:, 0]
    jr = bones.col("R_Thigh")
    assert cons.allowed[x <= 0.06, jr].all() and not cons.allowed[x > 0.06 + 1e-9, jr].any()
    assert cons.notes["side_planes"]["explicit"] == {"L_Thigh": 0.05, "R_Thigh": 0.05}


def test_B_side_gate_shift_invariant():
    """Mesh + skeleton shifted +0.05 m in X: the same allowed (row, bone) pairs, planes shifted by exactly 0.05 (they come from
    the skeleton, never x = 0)."""
    m0, sk0 = hp.figure()
    m1, sk1 = hp.figure(dx=0.05)
    s0, s1 = skin_rules.prepare(m0, sk0, {}), skin_rules.prepare(m1, sk1, {})
    assert np.array_equal(s0.cons.allowed, s1.cons.allowed)
    p0, p1 = s0.cons.notes["side_planes"], s1.cons.notes["side_planes"]
    assert abs(p1["torso"] - p0["torso"] - 0.05) < 1e-12
    assert all(abs(p1["chains"][k] - p0["chains"][k] - 0.05) < 1e-12 for k in p0["chains"])
    # the round-1 default (every plane at x = 0) would not be shift invariant on this figure
    a0, _ = skin_rules.side_gate_allowed(s0.topo.P, s0.bones, s0.cons.side_band, 0.0)
    a1, _ = skin_rules.side_gate_allowed(s1.topo.P, s1.bones, s1.cons.side_band, 0.0)
    assert not np.array_equal(a0, a1)


# --------------------------------------------------------------------------------------------------------------------------
# regions, rigid
# --------------------------------------------------------------------------------------------------------------------------


def test_B_region_fold_map_and_nearest():
    rules = {"classes": [{"set": "sack", "where": "z > 0.7"}],
             "regions": {"sack": {"where": "cls == 'sack'", "allowed": ["sack", "spine"], "fold": {"pelvis": "spine"}}}}
    topo, bones, cons = _cons(rules)
    W = np.zeros((topo.n_w, bones.k))
    W[:, bones.col("pelvis")] = 0.5
    W[:, bones.col("helmet")] = 0.2
    W[:, bones.col("L_Thigh")] = 0.3
    Wf, _ = sc.enforce(W, cons)
    s = topo.P[:, 2] > 0.7
    # pelvis -> spine by the map; helmet -> spine (tree neighbour, allowed); L_Thigh -> pelvis (not allowed) -> spine
    assert np.allclose(Wf[s, bones.col("spine")], 1.0)
    x = topo.P[:, 0]
    left, right = ~s & (x > 0.01), ~s & (x < -0.01)  # outside the region only the side gate acts
    assert np.allclose(Wf[left, bones.col("pelvis")], 0.5) and np.allclose(Wf[left, bones.col("L_Thigh")], 0.3)
    assert np.allclose(Wf[right, bones.col("pelvis")], 0.8) and np.allclose(Wf[right, bones.col("L_Thigh")], 0.0)


def test_B_region_allowed_from_family_region_bones():
    m = _grid_mesh()
    topo = sc.weld_topo(m)
    bones = sc.BoneSet.from_skeleton(_pair_skeleton())
    labels = skin_rules.classify(skin_rules.RuleContext(topo, bones), [{"set": "sack", "where": "z > 0.7"}])
    rules = {"regions": {"sack": {"where": "cls == 'sack'", "fold": {"*": "spine"}}}}
    cons = skin_rules.build_constraints(topo, bones, rules, labels=labels, skin_block={"region_bones": {"sack": ["sack", "spine"]}})
    s = topo.P[:, 2] > 0.7
    allowed_cols = sorted(np.flatnonzero(cons.allowed[np.flatnonzero(s)[0]]).tolist())
    assert allowed_cols == sorted([bones.col("sack"), bones.col("spine")])
    with pytest.raises(sc.RuleError):
        skin_rules.build_constraints(topo, bones, rules, labels=labels, skin_block={})


def test_B_rigid_rows_one_hot():
    rules = {"rigid": {"cap": {"where": "z > 0.9", "bone": "helmet"}}}
    topo, bones, cons = _cons(rules)
    rng = np.random.default_rng(0)
    W = rng.random((topo.n_w, bones.k))
    Wf, rep = sc.enforce(W, cons)
    r = topo.P[:, 2] > 0.9
    assert np.allclose(Wf[r, bones.col("helmet")], 1.0) and np.allclose(Wf[r].sum(1), 1.0)
    assert rep["invariants"]["rigid_bad"] == 0


def test_B_finish_warns_when_not_converged(monkeypatch):
    """Review r2 N5: finish warns (and reports converged: false) when it has not reached a fixed point after FINISH_ROUNDS."""
    m, sk = hp.figure()
    setup = skin_rules.prepare(m, sk, {})
    W = np.random.default_rng(12).random((setup.topo.n_w, setup.bones.k)) ** 4
    with warnings.catch_warnings():
        warnings.simplefilter("error")  # a converging run warns nothing
        _, rep = skin_rules.finish(W, setup, sk, {})
    assert rep["rounds"]["converged"]
    monkeypatch.setattr(skin_rules, "FINISH_TOL", -1.0)  # no change is ever small enough
    with pytest.warns(UserWarning, match="not converged after 4 rounds"):
        _, rep = skin_rules.finish(W, setup, sk, {})
    assert rep["rounds"]["rounds"] == skin_rules.FINISH_ROUNDS == 4 and not rep["rounds"]["converged"]


def test_B_profiles_config_controls_cap_rule_and_groups():
    m, sk = hp.figure()
    on = skin_rules.prepare(m, sk, {}).cons
    off = skin_rules.prepare(m, sk, {"profiles": {"enabled": False}}).cons
    nocap = skin_rules.prepare(m, sk, {"profiles": {"caps": False}}).cons
    assert on.cap_rule is not None and on.groups is not None
    assert off.cap_rule is None and off.groups is None  # D01's legacy rig: plain enforce as in round 1
    assert nocap.cap_rule is None and nocap.groups is not None
    with pytest.raises(sc.RuleError):
        skin_rules.prepare(m, sk, {"profiles": {"zone_rho": 0.35}})
