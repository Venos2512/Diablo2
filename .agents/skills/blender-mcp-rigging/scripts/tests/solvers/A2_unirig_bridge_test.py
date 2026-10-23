"""A2 tests: solvers.unirig_bridge - UniRig joints -> standard names by hierarchy and position (never by index), long arm chains
(hand = the node after the forearm, review r1), source-d landmarks, mesh correspondence, and the run wrapper (exclusive lock, per-run
work folder as cwd, no writes into E:\\tools\\unirig). Uses the existing UniRig outputs in E:\\tmp_unirig\\out\\<asset>\\ (read-only)
and, when present, the stats of the r2 wrapper run in E:\\tmp_unirig\\out_r2\\D01_hodling\\.

PYTEST_DONT_REWRITE
"""
import json
import os
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import numpy as np  # noqa: E402
import pytest  # noqa: E402

from solvers import glbmesh, unirig_bridge as ub  # noqa: E402

REPO = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), *[".."] * 6))
ASSETS = {"D01_hodling": (r"ashlar\3d\monsters\D01_hodling\D01_hodling.glb", 0.5),
          "FL_flagellant_vA": (r"ashlar\3d\heroes\FL_flagellant_vA\FL_flagellant_vA.glb", 1.8)}
STD_BONES = {"pelvis", "spine_01", "spine_02", "chest", "neck", "head"} | {
    f"{s}_{b}" for s in "LR" for b in ("Clavicle", "UpperArm", "ForeArm", "Hand", "Thigh", "Calf", "Foot", "Toe")}


def _load(asset):
    rel, H = ASSETS[asset]
    glb = os.path.join(REPO, rel)
    rigged = os.path.join(ub.UNIRIG_OUT, asset, f"{asset}_rigged.glb")
    if not (os.path.isfile(glb) and os.path.isfile(rigged)):
        pytest.skip(f"{asset}: GLB or UniRig output missing")
    mesh = glbmesh.glb_to_mesh(glb, asset, H)
    u = ub.read_rigged_glb(rigged)
    P = ub.to_mesh_frame(u["P_gltf"], mesh["meta"]["scale_factor"], mesh["meta"]["z_offset"])
    return mesh, u, P


@pytest.fixture(scope="module", params=list(ASSETS))
def asset_data(request):
    return (request.param,) + _load(request.param)


def test_chain_structure(asset_data):
    asset, mesh, u, P = asset_data
    m = ub.map_joints(u["names"], u["parent"], P)
    names = u["names"]
    assert u["parent"][m["pelvis"]] == -1  # hips = tree root
    assert len(m["spine"]) == 2 and m["spine_std"]["spine_01"] is not None and m["spine_std"]["spine_02"] is not None
    assert len(m["neck_chain"]) == 2 and m["neck"] is not None and m["head"] is not None
    xc = P[m["chest"], 0]
    for side, sgn in (("L", 1), ("R", -1)):
        a = m["arms"][side]
        assert None not in (a["clavicle"], a["upperarm"], a["forearm"], a["hand"])
        assert len(a["fingers"]) == 5 and all(len(f) == 3 for f in a["fingers"])
        chain = [a["clavicle"], a["upperarm"], a["forearm"], a["hand"]]
        assert all(u["parent"][chain[i + 1]] == chain[i] for i in range(3))  # parent-child chain
        assert all(sgn * (P[i, 0] - xc) > 0 for i in chain[1:])  # left = +X
        xs = [abs(P[i, 0] - xc) for i in chain]
        assert xs == sorted(xs)  # outward along the arm
        lg = m["legs"][side]
        leg = [lg["thigh"], lg["calf"], lg["foot"], lg["toe"]]
        assert None not in leg and all(u["parent"][leg[i + 1]] == leg[i] for i in range(3))
        assert u["parent"][lg["thigh"]] == m["pelvis"]
        zs = [P[i, 2] for i in leg]
        assert zs[0] > zs[1] > zs[2]  # hip above knee above ankle
    bmap = ub.bone_map(m)
    assert set(bmap) == set(names) and None not in bmap.values()
    assert set(bmap.values()) == STD_BONES
    assert sum(1 for v in bmap.values() if v == "L_Hand") == 16  # hand + 15 finger joints collapse into the hand


def test_mapping_is_not_by_index_or_name(asset_data):
    """Shuffle the joint order and rename every joint: the roles must follow hierarchy and position."""
    asset, mesh, u, P = asset_data
    m0 = ub.map_joints(u["names"], u["parent"], P)
    k = len(u["names"])
    rng = np.random.default_rng(7)
    perm = rng.permutation(k)  # new index j holds old joint perm[j]
    inv = np.empty(k, dtype=np.int64)
    inv[perm] = np.arange(k)
    parent2 = np.array([inv[u["parent"][perm[j]]] if u["parent"][perm[j]] >= 0 else -1 for j in range(k)])
    names2 = [f"j{rng.integers(1_000_000)}_{j}" for j in range(k)]
    m1 = ub.map_joints(names2, parent2, P[perm])
    b0 = {u["names"][i]: j["bone"] for i, j in enumerate(m0["joints"])}
    b1 = {u["names"][perm[j]]: m1["joints"][j]["bone"] for j in range(k)}
    assert b0 == b1


def test_landmarks_d(asset_data):
    asset, mesh, u, P = asset_data
    from solvers.landmarks_geo import MeshGeom

    m = ub.map_joints(u["names"], u["parent"], P)
    lms = ub.landmarks_from_map(m, P, MeshGeom(mesh["V"], mesh["F"], mesh["weld"]))
    for side in "LR":
        a = m["arms"][side]
        assert np.allclose(lms[f"clavicle_{side}"]["pos"], P[a["clavicle"]])
        assert np.allclose(lms[f"shoulder_{side}"]["pos"], P[a["upperarm"]])  # shoulder = upper-arm head
        assert np.allclose(lms[f"wrist_{side}"]["pos"], P[a["hand"]])
        assert np.allclose(lms[f"hip_{side}"]["pos"], P[m["legs"][side]["thigh"]])
        assert lms[f"ball_ground_{side}"]["pos"][2] == 0.0 and lms[f"toe_ground_{side}"]["pos"][2] == 0.0
        tip = np.array(lms[f"hand_tip_{side}"]["pos"])
        assert abs(tip[0] - P[a["hand"], 0]) > abs(lms[f"palm_{side}"]["pos"][0] - P[a["hand"], 0])  # tip beyond the palm
    assert np.allclose(lms["pelvis"]["pos"], P[m["pelvis"]])
    assert "head_top" not in lms  # UniRig has no head end joint in this topology


def test_correspondence_exact_and_nearest(asset_data):
    asset, mesh, u, P = asset_data
    Vu = ub.to_mesh_frame(u["V_gltf"], mesh["meta"]["scale_factor"], mesh["meta"]["z_offset"])
    c = ub.correspondence(mesh["V"], Vu)
    assert c["exact"] and c["max_dist"] == 0.0
    rng = np.random.default_rng(3)
    perm = rng.permutation(len(Vu))
    c2 = ub.correspondence(mesh["V"], Vu[perm])
    assert not c2["exact"]
    assert np.allclose(Vu[perm][c2["ours_to_unirig"]], mesh["V"])  # nearest = the same position
    assert u["bind_error"] < 1e-4  # rest pose = bind pose
    W = u["W"]
    assert np.allclose(W.sum(1), 1.0, atol=1e-4) and (W > 1e-6).sum(1).max() <= 4


def test_synthetic_biped_without_clavicles_and_swapped_sides():
    """Minimal tree: hips -> spine -> chest -> {neck -> head, arm(3 nodes) x2}, hips -> legs(4) x2; the right chains come first."""
    pts, par, names = [], [], []

    def add(p, parent):
        pts.append(p)
        par.append(parent)
        names.append(f"n{len(names)}")
        return len(pts) - 1

    hips = add((0, 0, 1.0), -1)
    sp = add((0, 0, 1.15), hips)
    chest = add((0, 0, 1.35), sp)
    for sgn in (-1, 1):  # right first
        up = add((0.2 * sgn, 0, 1.4), chest)
        fo = add((0.45 * sgn, 0, 1.4), up)
        add((0.7 * sgn, 0, 1.4), fo)
    nk = add((0, 0, 1.5), chest)
    add((0, 0, 1.6), nk)
    for sgn in (-1, 1):
        th = add((0.1 * sgn, 0, 0.95), hips)
        ca = add((0.1 * sgn, 0, 0.5), th)
        fo = add((0.1 * sgn, 0.0, 0.08), ca)
        add((0.1 * sgn, -0.12, 0.02), fo)
    m = ub.map_joints(names, np.array(par), np.array(pts, dtype=float))
    for side, sgn in (("L", 1), ("R", -1)):
        a = m["arms"][side]
        assert a["clavicle"] is None
        assert sgn * pts[a["upperarm"]][0] == pytest.approx(0.2) and sgn * pts[a["hand"]][0] == pytest.approx(0.7)
        assert sgn * pts[m["legs"][side]["thigh"]][0] == pytest.approx(0.1)
    bm = ub.bone_map(m)
    assert bm[names[sp]] == "spine_01" and "spine_02" not in bm.values()
    lm = ub.landmarks_from_map(m, np.array(pts, dtype=float))
    assert "spine_02" in lm and lm["spine_02"]["confidence"] < 1.0  # derived by arc length


def _biped(arm_nodes):
    """hips -> spine -> chest -> {neck -> head, arm chain x2 (``arm_nodes`` x positions, then 3 fingers on the last node), legs x2}."""
    pts, par, names = [], [], []

    def add(p, parent):
        pts.append(p)
        par.append(parent)
        names.append(f"n{len(names)}")
        return len(pts) - 1

    hips = add((0, 0, 1.0), -1)
    sp = add((0, 0, 1.15), hips)
    chest = add((0, 0, 1.35), sp)
    ids = {}
    for sgn, side in ((1, "L"), (-1, "R")):
        prev, chain = chest, []
        for x in arm_nodes:
            prev = add((sgn * x, 0, 1.4), prev)
            chain.append(prev)
        for k in range(3):
            f1 = add((sgn * (arm_nodes[-1] + 0.03), -0.02 + 0.02 * k, 1.4), chain[-1])
            add((sgn * (arm_nodes[-1] + 0.06), -0.02 + 0.02 * k, 1.4), f1)
        ids[side] = chain
    nk = add((0, 0, 1.5), chest)
    add((0, 0, 1.6), nk)
    for sgn in (-1, 1):
        th = add((0.1 * sgn, 0, 0.95), hips)
        ca = add((0.1 * sgn, 0, 0.5), th)
        fo = add((0.1 * sgn, 0.0, 0.08), ca)
        add((0.1 * sgn, -0.12, 0.02), fo)
    return names, np.array(par), np.array(pts, dtype=float), ids


def test_long_arm_chain_hand_is_the_node_after_the_forearm():
    """Review r1 finding 14: clavicle, upper arm, forearm, hand, finger1, finger2 in one single-child chain: chain[-1] is a fingertip."""
    names, par, P, ids = _biped([0.05, 0.2, 0.45, 0.7, 0.74, 0.77])
    m = ub.map_joints(names, par, P)
    for side in ("L", "R"):
        a, chain = m["arms"][side], ids[side]
        assert (a["clavicle"], a["upperarm"], a["forearm"], a["hand"]) == tuple(chain[:4])
        assert a["fingers"][0] == chain[4:]  # the tail after the hand is one finger chain
        bm = ub.bone_map(m)
        assert bm[names[chain[3]]] == f"{side}_Hand" and bm[names[chain[5]]] == f"{side}_Hand"
        assert bm[names[chain[2]]] == f"{side}_ForeArm" and bm[names[chain[1]]] == f"{side}_UpperArm"
    lm = ub.landmarks_from_map(m, P)
    assert lm["wrist_L"]["pos"][0] == pytest.approx(0.7) and lm["elbow_L"]["pos"][0] == pytest.approx(0.45)
    assert lm["hand_tip_L"]["pos"][0] > 0.77  # beyond the last finger joint, not at the "hand" fingertip node
    names, par, P, ids = _biped([0.05, 0.2, 0.45, 0.7])  # the regular 4-node chain is unchanged
    a = ub.map_joints(names, par, P)["arms"]["L"]
    assert a["hand"] == ids["L"][3] and len(a["fingers"]) == 3


def test_unirig_lock_is_exclusive_and_reports_stale_owners(tmp_path):
    lock = str(tmp_path / "unirig.lock")
    with ub.UniRigLock(lock, {"glb": "x"}):
        assert os.path.isfile(lock)
        with pytest.raises(RuntimeError, match="locked by pid"):
            with ub.UniRigLock(lock):
                pass
    assert not os.path.exists(lock)  # released
    with open(lock, "w", encoding="utf-8") as fh:  # a lock left by a dead process
        json.dump({"pid": 999999, "token": "dead", "started": "yesterday"}, fh)
    with pytest.raises(RuntimeError, match="STALE"):
        with ub.UniRigLock(lock):
            pass
    with ub.UniRigLock(lock, break_stale=True):
        assert json.load(open(lock, encoding="utf-8"))["pid"] == os.getpid()
    assert not os.path.exists(lock)


def test_run_wrapper_uses_a_per_run_work_folder(tmp_path):
    """Dry run: the stages run with cwd = a fresh per-run folder holding a copy of UniRig's configs, PYTHONPATH = the repo, no bytecode
    writes; every product path lies in the work folder (UniRig writes its npz next to each input)."""
    if not os.path.isdir(os.path.join(ub.UNIRIG_REPO, "configs")):
        pytest.skip("UniRig not installed")
    glb = os.path.join(REPO, ASSETS["D01_hodling"][0])
    r = ub.run(glb, out_dir=str(tmp_path / "out"), work_root=str(tmp_path / "work"), lock_path=str(tmp_path / "l.lock"), dry_run=True)
    work = r["work"]
    assert r["cwd"] == work and os.path.isdir(os.path.join(work, "configs", "task")) and os.path.isfile(os.path.join(work, "D01_hodling.glb"))
    assert r["env"]["PYTHONPATH"] == ub.UNIRIG_REPO and r["env"]["PYTHONDONTWRITEBYTECODE"] == "1"
    assert r["env"]["TEMP"].startswith(work) and r["env"]["BLENDER_USER_CONFIG"].startswith(work)
    for argv in r["commands"]:
        for arg in argv[2:]:
            if arg.startswith(("--input=", "--output=", "--output_dir=", "--npz_dir=", "--source=", "--target=")):
                assert arg.split("=", 1)[1].startswith(work), arg
    assert [c[1] if c[1] == "-m" else os.path.basename(c[1]) for c in r["commands"]] == ["-m", "run.py", "-m", "run.py", "-m"]
    assert not os.path.exists(str(tmp_path / "l.lock"))


def test_tree_diff():
    a = {"x.txt": (1, 10), "y.txt": (2, 20)}
    b = {"x.txt": (1, 10), "y.txt": (3, 21), "lightning_logs/version_11/h.yaml": (5, 30)}
    assert ub.tree_diff(a, b) == {"added": ["lightning_logs/version_11/h.yaml"], "removed": [], "changed": ["y.txt"]}


def test_r2_run_left_the_unirig_tree_untouched():
    """Evidence of the real wrapper run (D01, 2026-10-23): no file under E:\\tools\\unirig\\UniRig was added, removed or changed;
    same skeleton as the round-1 run (same seed)."""
    stats = r"E:\tmp_unirig\out_r2\D01_hodling\D01_hodling_stats.json"
    if not os.path.isfile(stats):
        pytest.skip("no r2 wrapper run recorded")
    st = json.load(open(stats, encoding="utf-8"))
    assert st["side_effects"]["unirig_tree"] == {"added": [], "removed": [], "changed": []}
    assert st["cwd"].startswith(r"E:\tmp_unirig\work") and os.path.isdir(os.path.join(st["work"], "lightning_logs"))
    old = r"E:\tmp_unirig\out\D01_hodling\D01_hodling_rigged.glb"
    if os.path.isfile(old):
        a, b = ub.read_rigged_glb(old), ub.read_rigged_glb(st["outputs"]["D01_hodling_rigged.glb"])
        assert a["names"] == b["names"] and np.abs(a["P_gltf"] - b["P_gltf"]).max() < 1e-6
