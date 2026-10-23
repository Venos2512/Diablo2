r"""I4 tests: candidate A's limb envelope (skin_region + skin_profiles.apply_limb_envelope, shared with candidate B).

I3 found that candidate A on generic rules leaked limb weight onto the torso (1269 welded rows on D01, 428 on FL), so the
selector's leak gate dropped it in 9 regions. A now applies B's two-stage envelope on its generic path (no ``candidate_a.steps``):
on the raw inverse-distance weights before normalization and again after the smoothing. With asset steps (D01's legacy rules) it
stays off unless ``candidate_a.envelope`` asks for it, so the legacy path still reproduces G2.

Synthetic figure (tests/solvers/B_helpers.py) for the switches; the dev data of writer B (E:\tmp_rigkit\B\{d01, fl}: mesh.npz +
skeleton.json) with generic rules for the leak numbers (skipped when missing).
"""
import os
import sys

sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, HERE)

import numpy as np  # noqa: E402
import pytest  # noqa: E402

import B_helpers as hp  # noqa: E402
from rigcore import npzio, template  # noqa: E402
from solvers import skin_common as sc  # noqa: E402
from solvers import skin_profiles as sp  # noqa: E402
from solvers import skin_region as sr  # noqa: E402
from solvers import skin_rules  # noqa: E402
from solvers import skin_transfer as st  # noqa: E402

DEV = r"E:\tmp_rigkit\B"
LEGACY_RULES = os.path.join(HERE, "B_d01_skin_rules.json")
DEFAULT_STEPS = [{"op": "distance", "where": "True", "bones": None}, {"op": "smooth", "where": "True", **sr.DEFAULT_SMOOTH}]


def _explicit_default_steps(bones):
    steps = [dict(s) for s in DEFAULT_STEPS]
    steps[0]["bones"] = list(bones)
    return steps


def test_shared_envelope_is_candidate_bs():
    assert st.ENVELOPE is sp.LIMB_ENVELOPE and st.limb_envelope is sp.limb_envelope and st.normalize_heat is sp.normalize_rows


def test_generic_path_envelope_on_by_default_and_switchable():
    mesh, skel = hp.figure()
    W_on, rs_on = sr.run(mesh, skel, {})
    assert rs_on.envelope == sp.LIMB_ENVELOPE and rs_on.report["envelope"]["spec"] == sp.LIMB_ENVELOPE
    env = rs_on.report["envelope"]["mesh"]
    assert set(env["units"]) == {"L_UpperArm", "R_UpperArm", "L_Thigh", "R_Thigh"} and "rows_changed" in env
    dist = [s for s in rs_on.report["steps"] if s["op"] == "distance"]
    assert len(dist) == 1 and "rows_changed" in dist[0]["envelope"]  # stage 1 on the raw weights
    W_off, rs_off = sr.run(mesh, skel, {"candidate_a": {"envelope": {}}})
    assert not rs_off.envelope and rs_off.report["envelope"] == {"spec": None, "mesh": None}
    assert "envelope" not in [k for s in rs_off.report["steps"] for k in s]
    W_null, _ = sr.run(mesh, skel, {"candidate_a": {"envelope": None}})
    assert np.array_equal(W_off, W_null)
    for W, rs in ((W_on, rs_on), (W_off, rs_off)):  # both valid weights
        assert np.allclose(W.sum(1), 1.0, atol=1e-6) and ((W > 0).sum(1) <= 4).all()


def test_asset_steps_keep_it_off_unless_asked():
    mesh, skel = hp.figure()
    names = sr.RegionSkin(mesh, skel, {}).bones.names
    rules = {"candidate_a": {"steps": _explicit_default_steps(names)}}
    W_steps, rs_steps = sr.run(mesh, skel, rules)
    assert rs_steps.envelope is None and rs_steps.report["envelope"]["spec"] is None
    W_off, _ = sr.run(mesh, skel, {"candidate_a": {"envelope": {}}})
    assert np.array_equal(W_steps, W_off)  # explicit default steps without the envelope = the generic path switched off
    W_asked, rs_asked = sr.run(mesh, skel, {"candidate_a": {"steps": _explicit_default_steps(names), "envelope": sp.LIMB_ENVELOPE}})
    W_on, _ = sr.run(mesh, skel, {})
    assert rs_asked.envelope == sp.LIMB_ENVELOPE and np.array_equal(W_asked, W_on)  # opt-in with steps = the generic default
    legacy = skin_rules.load_rules(LEGACY_RULES)
    assert legacy["candidate_a"].get("steps") and "envelope" not in legacy["candidate_a"]  # D01 legacy: off (reproduces G2)


def test_bad_envelope_configs_raise():
    mesh, skel = hp.figure()
    with pytest.raises(sc.RuleError, match="candidate_a.envelope"):
        sr.RegionSkin(mesh, skel, {"candidate_a": {"envelope": "on"}})
    with pytest.raises(ValueError, match="unknown keys"):
        sr.RegionSkin(mesh, skel, {"candidate_a": {"envelope": {"Thigh": {"below": [0, 1]}}}})


@pytest.mark.parametrize("asset", ["d01", "fl"])
def test_dev_data_generic_rules_leak(asset):
    """Writer B's dev meshes with generic rules: plain A leaks far beyond the red band (> 10 rows); with the envelope 0 rows."""
    d = os.path.join(DEV, asset)
    if not (os.path.isfile(os.path.join(d, "mesh.npz")) and os.path.isfile(os.path.join(d, "skeleton.json"))):
        pytest.skip(f"dev data missing: {d}")
    mesh, skel = npzio.load_mesh(os.path.join(d, "mesh.npz")), template.load_skeleton(os.path.join(d, "skeleton.json"))
    W_on, rs_on = sr.run(mesh, skel, {})
    _, rs_off = sr.run(mesh, skel, {"candidate_a": {"envelope": {}}})
    assert rs_off.report["limb_leak"]["rows"] > 10, rs_off.report["limb_leak"]["rows"]
    assert rs_on.report["limb_leak"]["rows"] == 0 and not rs_on.report["limb_leak"]["over_band"], rs_on.report["limb_leak"]
    inv = rs_on.report["enforce"]["invariants"]
    assert inv["sum_err_max"] <= 1e-6 and inv["max_influences"] <= 4 and inv["empty"] == 0
