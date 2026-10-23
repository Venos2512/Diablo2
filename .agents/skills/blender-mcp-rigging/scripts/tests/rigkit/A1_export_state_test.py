"""A1 unit tests (rigkit-env, pure Python): the GLB reader of rigkit.export on D01's source GLB, and the pure parts of rigkit.state
(position keys, per-group hashes, snapshot diff, override writers, weight changes with seam duplicates).

Run from ``scripts/``:  E:\\tools\\rigkit-env\\Scripts\\python.exe -I -m pytest tests/rigkit -q
"""
import json
import os

import numpy as np
import pytest

from rigcore import npzio
from rigkit import export, state

D01_TEXTURES = {"baseColor": "9bf5cece4b050c8bc6d513128ecf262a7cc598dd3917ea217b560f94af1c8128",
                "metallicRoughness": "8c1047525b3d63cb4547f637fca5232fd63fff0f109e6012b8b94e6549b93c14",
                "normal": "b3502fa33b086e1ecdafb012ab04a031e9cdfeb69d4a9498256bf31654690d3a"}


def test_read_d01_source_glb(d01_glb_path):
    js, bn = export.read_glb(d01_glb_path)
    prim = js["meshes"][0]["primitives"][0]
    P = export.accessor(js, bn, prim["attributes"]["POSITION"])
    idx = export.accessor(js, bn, prim["indices"]).reshape(-1)
    assert P.shape == (6505, 3) and idx.size == 10668 * 3
    assert float(P[:, 1].min()) == 0.0 and abs(0.5 / float(P[:, 1].max()) - 0.6794956867949569) < 1e-15
    G, parent = export.node_globals(js)
    assert parent == {1: 0} and np.allclose(G[1], np.eye(4))
    assert export.texture_roles(js, bn) == D01_TEXTURES


def test_node_local_trs():
    n = {"translation": [1, 2, 3], "rotation": [0, 0, np.sin(np.pi / 4), np.cos(np.pi / 4)], "scale": [2, 2, 2]}
    M = export.node_local(n)
    assert np.allclose(M[:3, 3], [1, 2, 3])
    assert np.allclose(M[:3, :3] @ [1, 0, 0], [0, 2, 0])  # 90 deg about Z, scale 2
    assert np.allclose(export.node_local({"matrix": list(np.eye(4).ravel())}), np.eye(4))


def _box():
    corners = np.array([[x, y, z] for x in (0.0, 1.0) for y in (0.0, 1.0) for z in (0.0, 1.0)])
    V = np.repeat(corners, 3, axis=0)  # 3 duplicates per position, as seam splits
    return V


def test_position_keys_and_hash_invariance():
    V = _box()
    weld, keys = state.position_keys(V)
    assert keys.shape == (8, 3) and int(weld.max()) == 7
    W = np.zeros((24, 2))
    W[:, 0] = np.linspace(0.1, 0.8, 8).repeat(3)
    W[:, 1] = 1 - W[:, 0]
    h = state.group_hashes(["a", "b"], W, weld, keys)
    perm = np.random.default_rng(0).permutation(24)
    weld2, keys2 = state.position_keys(V[perm])
    assert state.group_hashes(["a", "b"], W[perm], weld2, keys2) == h  # vertex order does not matter
    W3 = W.copy()
    W3[5, 0] += 0.01
    assert state.group_hashes(["a", "b"], W3, weld, keys)["a"] != h["a"]


def _snap(lm, hashes, pose):
    return {"schema": 0, "time": "t", "landmarks": lm, "weights": {"hashes": hashes}, "pose": pose}


def test_diff():
    pose = {"rig": {"b": {"location": [0, 0, 0], "rotation_mode": "QUATERNION", "rotation": [1, 0, 0, 0], "scale": [1, 1, 1]}}}
    pose2 = json.loads(json.dumps(pose))
    pose2["rig"]["b"]["rotation"] = [0.9, 0.1, 0, 0]
    a = _snap({"knee_L": [0, 0, 0.5], "hip_L": [0, 0, 1]}, {"g": "1", "h": "2"}, pose)
    b = _snap({"knee_L": [0, -0.01, 0.5], "hip_L": [0, 0, 1], "new": [1, 1, 1]}, {"g": "1", "h": "3", "k": "4"}, pose2)
    d = state.diff(a, b)
    assert list(d["landmarks"]) == ["knee_L"] and d["landmarks_added"] == ["new"]
    assert d["weights_changed_groups"] == ["h"] and d["groups_added"] == ["k"]
    assert d["pose_changed"] == {"rig": ["b"]} and not d["empty"]
    assert state.diff(a, a)["empty"]


def test_overrides_merge(tmp_path):
    p = str(tmp_path / "landmarks_override.json")
    a = _snap({"knee_L": [0, 0, 0.5]}, {}, {})
    b = _snap({"knee_L": [0, -0.01, 0.5], "toe_L": [0, -0.1, 0]}, {}, {})
    state.write_landmarks_override(p, "x", state.diff(a, b), b)
    c = _snap({"knee_L": [0, -0.02, 0.5], "toe_L": [0, -0.1, 0]}, {}, {})
    state.write_landmarks_override(p, "x", state.diff(b, c), c)
    doc = npzio.read_json(p)
    assert doc["kind"] == "landmarks_override" and set(doc["landmarks"]) == {"knee_L", "toe_L"}
    assert doc["landmarks"]["knee_L"]["pos"] == [0, -0.02, 0.5] and doc["landmarks"]["knee_L"]["before"] == [0, -0.01, 0.5]
    with pytest.raises(ValueError):
        state.write_landmarks_override(str(tmp_path / "x.json"), "x", {"landmarks_added": ["toe_L"]}, None)


def test_weight_changes_seams_and_conflict(tmp_path):
    V = _box()
    weld, keys = state.position_keys(V)
    W0 = np.full((24, 1), 0.5, dtype=np.float32)
    W1 = W0.copy()
    W1[0:3, 0] = 0.25  # all three duplicates of position 0
    W1[3, 0] = 0.75  # only one duplicate of position 1 -> conflict
    files = []
    for k, W in enumerate((W0, W1)):
        f = str(tmp_path / f"s{k}.npz")
        np.savez_compressed(f, W=W, groups=np.array(["g"]), weld=weld, keys=keys)
        files.append(f)
    s0 = {"weights": {"file": files[0], "decimals": 6}}
    s1 = {"weights": {"file": files[1], "decimals": 6}}
    rows = state.weight_changes(s0, s1)
    assert len(rows) == 2
    by = {tuple(r["pos"]): r for r in rows}
    r0, r1 = by[tuple(keys[0])], by[tuple(keys[1])]
    assert r0["weights"] == {"g": 0.25} and r0["before"] == {"g": 0.5} and r0["members"] == 3 and not r0["conflict"]
    assert r1["weights"] == {"g": 0.75} and r1["conflict"]
    out = state.write_weights_override(str(tmp_path / "w.json"), "box", s0, s1, {"weights_changed_groups": ["g"]})
    doc = npzio.read_json(out)
    assert doc["kind"] == "weights_override" and len(doc["entries"]) == 2 and doc["key_decimals"] == 6
    assert os.path.getsize(out) > 0


def test_exporter_weights_rule():
    r = export.exporter_weights([0.5, 0.3, 5e-5, 0.1, 0.06, 0.04, 1e-4])
    assert r[2] == 0.0 and r[6] == 0.0 and r[5] == 0.0  # <= 1e-4 dropped; then only the 4 largest kept
    assert np.isclose(r.sum(), 1.0) and np.allclose(r[[0, 1, 3, 4]], np.array([0.5, 0.3, 0.1, 0.06]) / 0.96)
    assert not export.exporter_weights([5e-5, 1e-4, 0.0]).any()  # nothing left: the exporter's neutral joint
    assert np.allclose(export.exporter_weights([2.0, 2.0]), [0.5, 0.5])
    assert export.DROP_WEIGHT == 1e-4


def test_summarize_and_failed_validation():
    A = {k: {"pass": k != "A1.3"} for k in export.A1_KEYS}
    X = {k: {"pass": True} for k in export.X_KEYS}
    s = export.summarize(A, X)
    assert s["A1_summary"] == {"checks": 14, "passed": 13, "failed": ["A1.3"]} and s["extra_summary"]["failed"] == []
    try:
        raise KeyError("JOINTS_0")
    except KeyError as e:
        v = export.failed_validation(e, {"blend": "x.blend"})
    assert list(v["A1"]) == list(export.A1_KEYS) and list(v["extra_checks"]) == list(export.X_KEYS)
    assert v["A1_summary"]["passed"] == 0 and len(v["extra_summary"]["failed"]) == 5
    assert "JOINTS_0" in v["errors"][0]["error"] and "Traceback" in v["errors"][0]["traceback"]
    json.dumps(v)  # writable
