"""schema + npzio: round trips, dtype coercion, shape/dtype/value errors, weight sums, JSON validators."""
import copy
import os
import re

import numpy as np
import pytest

from rigcore import SCHEMA, npzio, schema
from rigcore.mesh import weld_map


def _mesh_arrays(n=40, m=30, seed=0):
    rng = np.random.default_rng(seed)
    V = rng.normal(size=(n, 3))
    V[5] = V[3]  # a seam duplicate
    F = rng.integers(0, n, size=(m, 3))
    return V, F


META = npzio.mesh_meta("T01_test", 0.5, scale_factor=0.68, source_sha256="ab" * 32)


def test_mesh_round_trip_and_dtypes(tmp_path):
    V, F = _mesh_arrays()
    UV = np.random.default_rng(1).random((40, 2))
    mat = np.arange(30) % 3
    p = npzio.save_mesh(tmp_path / "m" / "mesh.npz", V.astype(np.float32), F.astype(np.int64), weld=None, UV=UV, mat=mat, meta=META)
    d = npzio.load_mesh(p)
    assert d["V"].dtype == np.float64 and d["V"].shape == (40, 3)
    assert d["F"].dtype == np.int32 and d["weld"].dtype == np.int32
    assert d["UV"].dtype == np.float32 and d["mat"].dtype == np.int16
    np.testing.assert_array_equal(d["V"], V.astype(np.float32).astype(np.float64))
    np.testing.assert_array_equal(d["F"], F)
    assert d["weld"][3] == d["weld"][5] and d["weld"].max() + 1 == 39  # computed by weld_map
    assert d["meta"]["asset_id"] == "T01_test" and d["meta"]["H"] == 0.5 and d["meta"]["schema"] == SCHEMA
    assert d["meta"]["source_sha256"] == "ab" * 32
    assert d["extra"] == {}
    # on-disk format: meta is a 0-d unicode JSON string, no pickles
    with np.load(p, allow_pickle=False) as z:
        assert z["meta"].ndim == 0 and z["meta"].dtype.kind == "U"
        assert set(z.files) == {"V", "F", "weld", "UV", "mat", "meta"}
    assert [f for f in os.listdir(os.path.dirname(p))] == ["mesh.npz"]  # temp file renamed away


def test_mesh_optional_absent_and_extra(tmp_path):
    V, F = _mesh_arrays()
    p = npzio.save_mesh(tmp_path / "mesh.npz", V, F, weld=weld_map(V), meta=META, extra={"loop_vert": np.arange(90)})
    d = npzio.load_mesh(p)
    assert d["UV"] is None and d["mat"] is None
    np.testing.assert_array_equal(d["extra"]["loop_vert"], np.arange(90))
    with pytest.raises(ValueError, match="clashes"):
        npzio.save_mesh(tmp_path / "x.npz", V, F, meta=META, extra={"V": np.zeros(3)})


@pytest.mark.parametrize("bad, pattern", [
    (dict(V=np.zeros((10, 2))), r"key 'V': expected shape \(n, 3\), got \(10, 2\)"),
    (dict(V=np.zeros(10)), r"key 'V': expected shape"),
    (dict(F=np.zeros((5, 4), dtype=int)), r"key 'F': expected shape \(m, 3\)"),
    (dict(F=np.full((4, 3), 99)), r"outside \[0, 10\)"),
    (dict(F=np.full((4, 3), -1)), r"outside \[0, 10\)"),
    (dict(F=np.zeros((4, 3), dtype=np.float64)), r"key 'F': expected an integer array"),
    (dict(weld=np.zeros(9, dtype=int)), r"key 'weld': dimension 'n' is 9 but 10 in 'V'"),
    (dict(weld=np.array([0, 2, 2, 2, 2, 2, 2, 2, 2, 2])), r"not contiguous"),
    (dict(UV=np.zeros((10, 3))), r"key 'UV': expected shape \(n, 2\)"),
    (dict(mat=np.zeros(3, dtype=int)), r"key 'mat': dimension 'm' is 3 but 4 in 'F'"),
    (dict(V=np.full((10, 3), np.nan)), r"key 'V': contains NaN"),
    (dict(V=np.array([["a", "b", "c"]] * 10)), r"key 'V': expected a real numeric array"),
    (dict(F=np.full((4, 3), 2 ** 40)), r"do not fit int32"),
])
def test_mesh_bad_arrays_raise(tmp_path, bad, pattern):
    good = dict(V=np.zeros((10, 3)), F=np.zeros((4, 3), dtype=int), weld=np.arange(10), meta=META)
    good.update(bad)
    with pytest.raises(ValueError, match=pattern):
        schema.validate_mesh(good)


def test_mesh_bad_meta(tmp_path):
    V, F = _mesh_arrays()
    for meta, pat in [({}, "missing required key 'asset_id'"), ({"asset_id": "a"}, "missing required key 'H'"),
                      ({"asset_id": "a", "H": -1}, "meta.H must be a positive"),
                      ({"asset_id": "a", "H": 0.5, "schema": 7}, "meta.schema is 7"),
                      ({"asset_id": "", "H": 0.5}, "asset_id must be a non-empty")]:
        with pytest.raises(ValueError, match=pat):
            npzio.save_mesh(tmp_path / "m.npz", V, F, meta=meta)
    with pytest.raises(ValueError, match="missing required key 'V'"):
        schema.validate_mesh(dict(F=F, weld=np.arange(40), meta=META))
    with pytest.raises(ValueError, match="not valid JSON"):
        schema.normalize_meta("mesh", "{not json")


def test_load_rejects_corrupt_files(tmp_path):
    # a file written by someone else with a wrong shape / dtype must be rejected on load
    p = tmp_path / "bad.npz"
    np.savez_compressed(p, V=np.zeros((5, 2)), F=np.zeros((1, 3), dtype=np.int32), weld=np.arange(5, dtype=np.int32),
                        meta=np.array('{"schema": 0, "asset_id": "a", "H": 1.0}'))
    with pytest.raises(ValueError, match="key 'V'"):
        npzio.load_mesh(p)
    np.savez_compressed(p, V=np.zeros((5, 3)), F=np.zeros((1, 3), dtype=np.int32), weld=np.arange(5, dtype=np.int32))
    with pytest.raises(ValueError, match="no 'meta'"):
        npzio.load_mesh(p)
    # coercion on load: float32 V and int64 F are accepted and normalized
    np.savez_compressed(p, V=np.zeros((5, 3), np.float32), F=np.zeros((1, 3), np.int64), weld=np.arange(5),
                        meta=np.array('{"schema": 0, "asset_id": "a", "H": 1.0}'))
    d = npzio.load_mesh(p)
    assert d["V"].dtype == np.float64 and d["F"].dtype == np.int32 and d["weld"].dtype == np.int32


# --------------------------------------------------------------------------------------------------------------------------
# weights
# --------------------------------------------------------------------------------------------------------------------------

def _weights(n=12, k=4, seed=0):
    rng = np.random.default_rng(seed)
    W = rng.random((n, k))
    W /= W.sum(1, keepdims=True)
    return [f"b{i}" for i in range(k)], W


def test_weights_round_trip(tmp_path):
    bones, W = _weights()
    locked = np.zeros(12, dtype=bool)
    locked[2] = True
    p = npzio.save_weights(tmp_path / "weights.npz", bones, W, locked=locked, meta={"candidate": "A", "params": {"x": 1}}, check_sums=True)
    d = npzio.load_weights(p, check_sums=True)
    assert d["bones"].dtype.kind == "U" and d["bones"].tolist() == bones
    assert d["W"].dtype == np.float32 and d["W"].shape == (12, 4)
    np.testing.assert_allclose(d["W"], W, atol=1e-6)
    assert d["locked"].dtype == bool and d["locked"][2]
    assert d["meta"]["candidate"] == "A" and d["meta"]["params"] == {"x": 1}
    p2 = npzio.save_weights(tmp_path / "w2.npz", bones, W, meta={"candidate": "B"})
    assert npzio.load_weights(p2)["locked"] is None


def test_weights_sum_checks(tmp_path):
    bones, W = _weights()
    Wbad = W.copy()
    Wbad[7, 0] += 0.01
    meta = {"candidate": "A"}
    npzio.save_weights(tmp_path / "ok.npz", bones, Wbad, meta=meta)  # not checked unless asked
    with pytest.raises(ValueError, match=r"1 of 12 deforming rows do not sum to 1.*vertex 7"):
        npzio.save_weights(tmp_path / "w.npz", bones, Wbad, meta=meta, check_sums=True)
    with pytest.raises(ValueError, match="do not sum to 1"):
        npzio.load_weights(tmp_path / "ok.npz", check_sums=True)
    mask = np.ones(12, dtype=bool)
    mask[7] = False  # vertex 7 does not deform: excluded
    npzio.save_weights(tmp_path / "w.npz", bones, Wbad, meta=meta, check_sums=True, deform_mask=mask)
    # within 1e-4 passes, all-zero deforming row fails, zero row passes when masked out
    Wok = W.copy()
    Wok[0, 0] += 5e-5
    npzio.save_weights(tmp_path / "w.npz", bones, Wok, meta=meta, check_sums=True)
    Wz = W.copy()
    Wz[3] = 0
    with pytest.raises(ValueError, match="do not sum to 1"):
        npzio.save_weights(tmp_path / "w.npz", bones, Wz, meta=meta, check_sums=True)
    mask = np.ones(12, dtype=bool)
    mask[3] = False
    npzio.save_weights(tmp_path / "w.npz", bones, Wz, meta=meta, check_sums=True, deform_mask=mask)
    # negative weight that still sums to 1
    Wn = W.copy()
    Wn[1, 0] = -0.2
    Wn[1, 1] = 1.0 - Wn[1, 0] - Wn[1, 2:].sum()
    with pytest.raises(ValueError, match="negative weight|> 1"):
        schema.check_weight_sums(Wn)
    assert schema.check_weight_sums(W) < 1e-12


@pytest.mark.parametrize("kw, pattern", [
    (dict(bones=["a", "a", "b", "c"]), "duplicate bone names"),
    (dict(bones=["a", "b", "c"]), r"key 'W': dimension 'k' is 4 but 3 in 'bones'"),
    (dict(bones=["a", "", "b", "c"]), "empty name"),
    (dict(W=np.zeros((12, 3))), r"dimension 'k' is 3 but 4"),
    (dict(W=np.zeros(12)), r"key 'W': expected shape \(n, k\)"),
    (dict(locked=np.zeros(11, dtype=bool)), r"key 'locked': dimension 'n' is 11 but 12 in 'W'"),
    (dict(locked=np.zeros(12, dtype=int)), r"key 'locked': expected a bool array"),
    (dict(meta={"schema": 0}), "missing required key 'candidate'"),
    (dict(bones=[1, 2, 3, 4]), r"key 'bones'"),
])
def test_weights_bad_raise(kw, pattern):
    bones, W = _weights()
    d = dict(bones=bones, W=W, meta={"candidate": "A", "schema": 0})
    d.update(kw)
    with pytest.raises(ValueError, match=pattern):
        schema.validate_weights(d)


# --------------------------------------------------------------------------------------------------------------------------
# poses
# --------------------------------------------------------------------------------------------------------------------------

def test_poses_round_trip_and_errors(tmp_path):
    rng = np.random.default_rng(3)
    p_, n, b = 3, 20, 5
    P, heads, tails = rng.normal(size=(p_, n, 3)), rng.normal(size=(p_, b, 3)), rng.normal(size=(p_, b, 3))
    names, bones = ["rest", "t", "u"], [f"bone{i}" for i in range(b)]
    path = npzio.save_poses(tmp_path / "poses.npz", names, P, bones, heads, tails, meta={"asset_id": "T01"})
    d = npzio.load_poses(path)
    assert d["P"].dtype == np.float32 and d["P"].shape == (3, 20, 3)
    assert d["heads"].dtype == np.float32 and d["tails"].shape == (3, 5, 3)
    assert d["names"].tolist() == names and d["bone_names"].tolist() == bones
    np.testing.assert_allclose(d["P"], P, atol=1e-6)
    assert d["meta"]["asset_id"] == "T01" and d["meta"]["schema"] == SCHEMA
    with pytest.raises(ValueError, match=r"key 'heads': dimension 'p' is 2 but 3"):
        npzio.save_poses(tmp_path / "x.npz", names, P, bones, heads[:2], tails)
    with pytest.raises(ValueError, match=r"key 'tails': dimension 'b' is 4 but 5"):
        npzio.save_poses(tmp_path / "x.npz", names, P, bones, heads, tails[:, :4])
    with pytest.raises(ValueError, match=r"key 'P': expected shape \(p, n, 3\)"):
        npzio.save_poses(tmp_path / "x.npz", names, P[:, :, :2], bones, heads, tails)
    with pytest.raises(ValueError, match="duplicate entries in 'names'"):
        npzio.save_poses(tmp_path / "x.npz", ["a", "a", "b"], P, bones, heads, tails)
    with pytest.raises(ValueError, match="NaN"):
        Pn = P.copy()
        Pn[0, 0, 0] = np.nan
        npzio.save_poses(tmp_path / "x.npz", names, Pn, bones, heads, tails)


def test_cross_file_consistency():
    V, F = _mesh_arrays()
    mesh = schema.validate_mesh(dict(V=V, F=F, weld=weld_map(V), meta=META))
    bones, W = _weights(n=40)
    w = schema.validate_weights(dict(bones=bones, W=W, meta={"candidate": "A", "schema": 0}))
    schema.check_consistency(mesh=mesh, weights=w)
    bones, W = _weights(n=41)
    w2 = schema.validate_weights(dict(bones=bones, W=W, meta={"candidate": "A", "schema": 0}))
    with pytest.raises(ValueError, match="vertex count mismatch"):
        schema.check_consistency(mesh=mesh, weights=w2)


# --------------------------------------------------------------------------------------------------------------------------
# JSON validators
# --------------------------------------------------------------------------------------------------------------------------

GOOD_LANDMARKS = {"schema": 0, "asset_id": "D01", "family": "S", "H": 0.5, "landmarks": {
    "pelvis": {"pos": [0, 0.028, 0.185], "sources": {"a": [0, 0, 0.18], "d": [0, 0, 0.19]}, "spread": 0.002,
               "decision": "mean", "confidence": 0.9, "flagged": False},
    "head_top": {"pos": [0, 0, 0.5]}}}


def test_validate_landmarks():
    assert schema.validate_landmarks(copy.deepcopy(GOOD_LANDMARKS))
    for mut, pat in [
        (lambda d: d.pop("H"), "missing required key 'H'"),
        (lambda d: d.update(schema=3), "schema is 3"),
        (lambda d: d["landmarks"]["pelvis"].update(pos=[1, 2]), "'pos' must be three finite numbers"),
        (lambda d: d["landmarks"]["pelvis"].update(pos=[1, 2, float("nan")]), "'pos' must be three finite"),
        (lambda d: d["landmarks"]["pelvis"]["sources"].update(z=[0, 0, 0]), "unknown source key 'z'"),
        (lambda d: d["landmarks"]["pelvis"].update(flagged="yes"), "'flagged' must be a bool"),
        (lambda d: d["landmarks"].update(bad={"nopos": 1}), "missing required key 'pos'"),
    ]:
        doc = copy.deepcopy(GOOD_LANDMARKS)
        mut(doc)
        with pytest.raises(ValueError, match=pat):
            schema.validate_landmarks(doc)


def test_validate_metrics_and_analysis():
    m = {"schema": 0, "asset_id": "D01", "joints": {}, "summary": {}, "lights": {"stretch": "green"},
         "poses": {"squat": {"arm_L": {k: 1.0 for k in schema.METRIC_KEYS if k != "penetration"}}}}
    m["poses"]["squat"]["arm_L"]["penetration"] = {"n_tris": 0, "max_depth": 0.0}
    m["poses"]["squat"]["arm_L"]["volume_ratio"] = None
    assert schema.validate_metrics(m)
    bad = copy.deepcopy(m)
    del bad["poses"]["squat"]["arm_L"]["seam_crack_max"]
    with pytest.raises(ValueError, match="missing metric 'seam_crack_max'"):
        schema.validate_metrics(bad)
    bad = copy.deepcopy(m)
    bad["lights"]["stretch"] = "blue"
    with pytest.raises(ValueError, match="lights"):
        schema.validate_metrics(bad)
    bad = copy.deepcopy(m)
    bad["poses"]["squat"]["arm_L"]["penetration"] = 3
    with pytest.raises(ValueError, match="penetration"):
        schema.validate_metrics(bad)
    assert schema.validate_analysis({"schema": 0, "asset_id": "D01", "n_vertices": 6505, "n_welded": 5389})
    with pytest.raises(ValueError, match="n_vertices"):
        schema.validate_analysis({"schema": 0, "asset_id": "D01", "n_vertices": -1})


def test_validate_dispatch_and_kinds():
    assert set(schema.FILE_KINDS) == set(schema.VALIDATORS) == set(schema.FILE_NAMES)
    assert schema.FILE_NAMES["recipe"] == "rig_recipe.json"
    with pytest.raises(ValueError, match="unknown file kind"):
        schema.validate("nope", {})
    assert schema.validate("landmarks", copy.deepcopy(GOOD_LANDMARKS))


def test_write_json_atomic_and_strict(tmp_path):
    p = npzio.write_json(tmp_path / "a" / "x.json", {"a": np.float32(1.5), "b": np.arange(3), "c": (1, 2)})
    assert npzio.read_json(p) == {"a": 1.5, "b": [0, 1, 2], "c": [1, 2]}
    assert b"\r" not in open(p, "rb").read()
    with pytest.raises(ValueError):
        npzio.write_json(tmp_path / "bad.json", {"a": float("nan")})
    assert not (tmp_path / "bad.json").exists()


def _minimal_docs():
    from rigcore import recipe

    skel = {"schema": 0, "family": "T", "template_version": "1", "H": 1.0, "ik": [], "rom": [], "rom_compound": [], "skin": {},
            "bones": [{"name": "root", "parent": None, "kind": "core", "deform": False, "head": [0, 0, 0], "tail": [0, 0, 1],
                       "hinge": [1, 0, 0], "bend_test": None, "twist": None}]}
    metrics = {"schema": 0, "asset_id": "A", "poses": {}, "joints": {}, "summary": {}, "lights": {}}
    analysis = {"schema": 0, "asset_id": "A"}
    return {"landmarks": GOOD_LANDMARKS, "skeleton": skel, "recipe": recipe.new_recipe("A", stamp=False), "metrics": metrics,
            "analysis": analysis}


def test_required_key_constants_match_the_validators():
    docs = _minimal_docs()
    req = {"landmarks": schema.LANDMARKS_REQUIRED, "skeleton": schema.SKELETON_REQUIRED, "recipe": schema.RECIPE_REQUIRED,
           "metrics": schema.METRICS_REQUIRED, "analysis": schema.ANALYSIS_REQUIRED}
    for kind, keys in req.items():
        assert schema.validate(kind, copy.deepcopy(docs[kind]))
        for k in keys:
            bad = copy.deepcopy(docs[kind])
            del bad[k]
            with pytest.raises(ValueError, match=f"{kind}: missing required key '{k}'"):
                schema.validate(kind, bad)
        with pytest.raises(ValueError, match="expected an object"):
            schema.validate(kind, [])
    for k in schema.BONE_REQUIRED:
        bad = copy.deepcopy(docs["skeleton"])
        del bad["bones"][0][k]
        with pytest.raises(ValueError, match=re.escape(("skeleton: bones[0]" if k == "name" else "skeleton: bone 'root'")
                                                       + f": missing required key '{k}'")):
            schema.validate_skeleton(bad)
    for k in schema.STEP_REQUIRED:
        bad = copy.deepcopy(docs["recipe"])
        bad["steps"].append({"step": "S1", "time": "t", "params": {}, "outputs": {}})
        del bad["steps"][0][k]
        with pytest.raises(ValueError, match=re.escape(f"recipe: steps[0]: missing required key '{k}'")):
            schema.validate_recipe(bad)
    for k in schema.LANDMARK_ENTRY_REQUIRED:
        bad = copy.deepcopy(GOOD_LANDMARKS)
        del bad["landmarks"]["pelvis"][k]
        with pytest.raises(ValueError, match=f"landmark 'pelvis': missing required key '{k}'"):
            schema.validate_landmarks(bad)
    assert set(schema.LANDMARK_ENTRY_OPTIONAL) >= {"sources", "spread", "decision", "confidence", "flagged"}
