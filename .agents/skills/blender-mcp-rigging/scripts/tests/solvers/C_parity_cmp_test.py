"""Owner C: solvers.parity_cmp on a synthetic source / reimport pair (different vertex order and seam splits). rigkit-env."""
import os

import numpy as np
import pytest

from rigcore import npzio
from solvers import parity_cmp as PC


def _case(tmp, dev=0.0, drop=False):
    rng = np.random.default_rng(1)
    V = rng.uniform(-0.2, 0.2, (40, 3))
    V = np.concatenate([V, V[:5]])  # 5 seam duplicates in the source
    F = np.array([[0, 1, 2], [2, 3, 4]])
    npzio.save_mesh(os.path.join(tmp, "mesh.npz"), V, F, meta={"asset_id": "s", "H": 0.5})
    P = np.stack([V, V + [0.01, 0.0, 0.02]]).astype(np.float32)  # rest, moved
    npzio.save_poses(os.path.join(tmp, "poses.npz"), ["rest", "move"], P, ["b"], np.zeros((2, 1, 3), np.float32),
                     np.ones((2, 1, 3), np.float32), meta={"rest_index": 0})
    # reimport: shuffled, no duplicates for the first 3 ids but extra split copies for ids 10..12
    order = rng.permutation(40)
    R = np.concatenate([V[order], V[10:13]])
    Q = np.stack([R, R + [0.01, 0.0, 0.02]])
    if dev:
        Q[1, 0] += [dev, 0, 0]
    if drop:
        R, Q = R[1:], Q[:, 1:]
    npzio.save_poses(os.path.join(tmp, "re.npz"), ["rest", "move"], Q.astype(np.float32), ["b"], np.zeros((2, 1, 3), np.float32),
                     np.ones((2, 1, 3), np.float32), extra={"rest_raw": R})
    return [npzio.load_poses(os.path.join(tmp, "poses.npz")), npzio.load_mesh(os.path.join(tmp, "mesh.npz")),
            npzio.load_poses(os.path.join(tmp, "re.npz"))]


def test_C_parity_identical_passes(tmp_path):
    rep = PC.compare(*_case(str(tmp_path)), H=0.5)
    assert rep["pass"] and rep["max_m"] < 1e-6 and rep["unmatched_glb_vertices"] == 0
    assert rep["welded_ids_covered"] == rep["n_welded_source"] == 40
    assert rep["tolerance_m"] == pytest.approx(1e-4 * 0.5 / 1.8)


def test_C_parity_deviation_fails_and_is_located(tmp_path):
    rep = PC.compare(*_case(str(tmp_path), dev=1e-4), H=0.5)
    assert not rep["pass"] and rep["per_pose"]["move"]["max_m"] == pytest.approx(1e-4, rel=1e-3)
    assert rep["per_pose"]["rest"]["pass"]


def test_C_parity_missing_vertex_fails(tmp_path):
    rep = PC.compare(*_case(str(tmp_path), drop=True), H=0.5)
    assert rep["welded_ids_covered"] == 39 and not rep["pass"]


def test_C_parity_fails_when_emulation_weight_check_failed(tmp_path):
    src, mesh, imp = _case(str(tmp_path))
    imp["meta"]["emulation"] = {"weights_check_max": 2e-6}
    rep = PC.compare(src, mesh, imp, H=0.5)
    assert rep["max_m"] < 1e-6 and not rep["weights_check_ok"] and not rep["pass"]
    imp["meta"]["emulation"] = {"weights_check_max": 1e-7}
    assert PC.compare(src, mesh, imp, H=0.5)["pass"]
