r"""I4 tests: head island, head top and the head_top axis gate (I3 report finding 3; joint-placement.md Head row).

I3 found that the pipeline run put D01's head_top on an eye island (the old pick: the island whose surface lay nearest to a point
0.08 H above the neck base), 50 mm in front of the pivot: the head bone pointed 71 deg forward of up, S4's head bend test was
ambiguous (cos 0.15) and consensus accepted the single source unflagged. Now:

* ``landmarks_geo.head_island``: the island with the most head-column vertices; ``island_vote`` re-picks when the head mass lies
  inside another island's surface;
* ``landmarks_geo.head_top_point``: the head island's surface above the head-mass centre along the body up axis (helmets, hats,
  eyes and inner islands are other islands); an open head island -> the first surface above (a helmet's inside), lower confidence;
* ``landmarks_geo.head_axis_deviation`` + ``consensus._head_top_axis``: the head bone from a plausible pivot candidate within 25 deg
  of the arc from up to the neck direction and within 60 deg of up, else head_top fails its axis gate and is flagged.

Synthetic shapes, then D01 (helmet), FL and U01 in the pipeline's midline mode (analysis.json arms plane) and the A2 tests' mode
(hand-tip mid-x), with UniRig's landmarks for the gate (unirig_bridge.process on E:\tmp_unirig\out; skipped when missing).

PYTEST_DONT_REWRITE
"""
import math
import os
import sys

sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, HERE)

import numpy as np  # noqa: E402
import pytest  # noqa: E402

from rigcore import mesh as rmesh, npzio, template  # noqa: E402
from solvers import analysis, consensus as cs, glbmesh, unirig_bridge  # noqa: E402
from solvers import landmarks_geo as lg  # noqa: E402

REPO = os.path.normpath(os.path.join(HERE, *[".."] * 6))
G2_LM = os.path.join(REPO, "ashlar", "3d", "act-01", "monsters", "D01_hodling", "rig", "tools", "landmarks.json")
ASSETS = {"D01_hodling": (r"ashlar\3d\act-01\monsters\D01_hodling\D01_hodling.glb", 0.5, "S"),
          "FL_flagellant_vA": (r"ashlar\3d\heroes\FL_flagellant\vA\FL_flagellant_vA.glb", 1.8, "H"),
          "U01_shambler": (r"ashlar\3d\act-01\monsters\U01_shambler\U01_shambler.glb", 0.95 * 1.8, "H")}
UNIRIG_OUT = r"E:\tmp_unirig\out"


def _sphere(r, c, nu=32, nv=16, rz=None, cut_above=None):
    """UV sphere (radii r, r, rz) with outward faces; ``cut_above`` drops the faces whose vertices all lie above that z."""
    rz = r if rz is None else rz
    V = [[c[0], c[1], c[2] + rz]]
    for i in range(1, nv):
        th = math.pi * i / nv
        V += [[c[0] + r * math.sin(th) * math.cos(2 * math.pi * j / nu), c[1] + r * math.sin(th) * math.sin(2 * math.pi * j / nu),
               c[2] + rz * math.cos(th)] for j in range(nu)]
    V.append([c[0], c[1], c[2] - rz])
    F = [[0, 1 + j, 1 + (j + 1) % nu] for j in range(nu)]
    for i in range(nv - 2):
        for j in range(nu):
            a, b = 1 + i * nu + j, 1 + i * nu + (j + 1) % nu
            F += [[a, a + nu, b + nu], [a, b + nu, b]]
    last, base = len(V) - 1, 1 + (nv - 2) * nu
    F += [[base + j, last, base + (j + 1) % nu] for j in range(nu)]
    V, F = np.array(V, dtype=float), np.array(F)
    n = np.cross(V[F[:, 1]] - V[F[:, 0]], V[F[:, 2]] - V[F[:, 0]])
    if float(((V[F].mean(1) - np.asarray(c)) * n).sum()) < 0:  # make the faces point outward
        F = F[:, ::-1]
    if cut_above is not None:
        F = F[~(V[F][:, :, 2] > cut_above).all(1)]
    return V, F


def _scene(*parts):
    Vs, Fs, base = [], [], 0
    for V, F in parts:
        Vs.append(V)
        Fs.append(F + base)
        base += len(V)
    V, F = np.concatenate(Vs), np.concatenate(Fs)
    g = lg.MeshGeom(V, F)
    _, lab = rmesh.islands(F, g.weld)
    lab_w = np.zeros(len(g.V), dtype=np.int64)
    lab_w[g.weld] = lab
    return g, lab_w


def _head_parts(open_top=False, helmet=True):
    """Head sphere r 0.09 at z 0.9 (top 0.99), two eyes in front, an inner island (tongue) at z 0.88 - where the old rule's query
    point lay - and a helmet shell floating above (z 1.005-1.055)."""
    parts = [_sphere(0.09, (0, 0, 0.9), cut_above=0.975 if open_top else None),
             _sphere(0.015, (0.03, -0.08, 0.92), 12, 8), _sphere(0.015, (-0.03, -0.08, 0.92), 12, 8),
             _sphere(0.012, (0, -0.01, 0.88), 12, 8)]
    if helmet:
        parts.append(_sphere(0.11, (0, 0, 1.03), 32, 8, rz=0.025))
    return parts


def test_head_island_top_and_helmet_on_synthetic_head():
    g, lab = _scene(*_head_parts())
    out, info = lg._head(g, 1.0, 0.0, 0.8, lab, "H")
    T = np.array(out["head_top"]["pos"])
    head_isl = int(lab[0])  # the head sphere's top vertex
    assert info["island"] == head_isl and out["head_top"]["diag"]["head_island"] == head_isl
    assert out["head_top"]["confidence"] == pytest.approx(lg.HEAD_TOP_CONF) and "surface above the head-mass centre" in out["head_top"]["method"]
    assert np.allclose(T[:2], info["M"][:2]) and 0.985 <= T[2] <= 0.99  # the skull top over the head mass (faceted sphere)
    assert out["head_top"]["prior_exempt"].startswith("helmet/hat")  # the helmet island floats above it
    votes = out["head_top"]["diag"]["ray_votes"]  # diag keys are JSON strings
    assert max(votes, key=votes.get) == str(head_isl) and votes[str(head_isl)] >= 50
    assert abs(info["M"][2] - 0.9) < 0.03 and np.hypot(*info["M"][:2]) < 0.02


def test_head_top_open_island_takes_the_helmet_inside_with_lower_confidence():
    g, lab = _scene(*_head_parts(open_top=True))
    out, info = lg._head(g, 1.0, 0.0, 0.8, lab, "H")
    ht = out["head_top"]
    assert ht["confidence"] == pytest.approx(lg.HEAD_TOP_OPEN_CONF) and "open above the head-mass centre" in ht["method"]
    assert ht["pos"][2] == pytest.approx(1.005, abs=0.004) and ht["diag"]["top_island"] != info["island"]  # the helmet's underside
    g2, lab2 = _scene(*_head_parts(open_top=True, helmet=False))
    out2, _ = lg._head(g2, 1.0, 0.0, 0.8, lab2, "H")
    assert out2["head_top"]["confidence"] == pytest.approx(lg.LOW_CONF) and "no surface above" in out2["head_top"]["method"]


def test_head_axis_deviation_angles():
    up, P = np.array([0, 0, 1.0]), np.zeros(3)

    def d(deg_fwd, deg_side=0.0):  # front = -Y
        a, s = math.radians(deg_fwd), math.radians(deg_side)
        return np.array([math.sin(s), -math.sin(a) * math.cos(s), math.cos(a) * math.cos(s)])

    neck = lambda deg: -d(deg)  # noqa: E731  neck point below the pivot: neck -> pivot leans deg forward
    r = lg.head_axis_deviation(P, up, -up)
    assert r["up_deg"] == pytest.approx(0) and r["neck_deg"] == pytest.approx(0) and r["arc_deg"] == pytest.approx(0)
    r = lg.head_axis_deviation(P, d(30), neck(45))  # between upright and the neck's lean: on the arc
    assert r["up_deg"] == pytest.approx(30) and r["neck_deg"] == pytest.approx(15) and r["arc_deg"] == pytest.approx(0, abs=1e-6)
    r = lg.head_axis_deviation(P, d(71), neck(43))  # I3 D01: the eye-island top beyond the neck's lean
    assert r["arc_deg"] == pytest.approx(28) and r["up_deg"] == pytest.approx(71)
    r = lg.head_axis_deviation(P, d(-20), neck(30))  # leaning back: nearest arc end is up
    assert r["arc_deg"] == pytest.approx(20)
    r = lg.head_axis_deviation(P, d(0, 30), neck(45))  # sideways: 30 deg out of the arc's plane
    assert r["arc_deg"] == pytest.approx(30, abs=1e-6)
    assert lg.head_axis_deviation(P, P) is None and lg.head_axis_deviation(P, d(40))["arc_deg"] == pytest.approx(40)


def _e(p, c=0.7, **kw):
    return {"pos": tuple(float(v) for v in p), "confidence": c, "method": "test", **kw}


def test_head_top_axis_gate_flags_a_bad_single_source():
    a = {"neck": _e((0, -0.05, 1.5)), "head": _e((0, -0.06, 1.55), 0.6), "head_top": _e((0, -0.21, 1.6))}  # 71.6 deg forward
    f, rep = cs.fuse({"a": a}, 1.0, {"landmarks": {}})
    ht = f["head_top"]
    assert ht["gates"]["a"]["axis"].startswith("fail: head bone from pivot a") and ht["gates_failed"]["a"] == ["axis"]
    assert ht["flagged"] and ht["flag"] == "vision" and ht["kind"] == "no_plausible"
    tile = next(t for t in rep["tiles"] if "head_top" in t["ids"])
    assert tile["flag"] == "vision" and tile["required_overrides"]["head_top"]["a"] == ["a.axis"]
    a["head_top"] = _e((0, -0.08, 1.70))  # 7.6 deg forward on a 63 deg neck: on the arc
    f, _ = cs.fuse({"a": a}, 1.0, {"landmarks": {}})
    assert f["head_top"]["gates"]["a"]["axis"].startswith("pass (head bone from pivot a") and not f["head_top"]["flagged"]
    assert f["head_top"]["kind"] == "single"


def test_head_top_axis_gate_uses_any_plausible_pivot():
    """FL (I4): source a's pivot sat behind the hood (head tile a/d disagree); its head bone to the good head top leans 35 deg while
    UniRig's pivot gives 3 deg - the head top passes on d's pivot, the pivot stays on its own tile."""
    a = {"neck": _e((0, 0.0, 1.5)), "head": _e((0, 0.09, 1.6), 0.6), "head_top": _e((0, -0.02, 1.75))}
    d = {"neck": _e((0, -0.01, 1.5)), "head": _e((0, 0.0, 1.6))}
    f, _ = cs.fuse({"a": a, "d": d}, 1.0, {"landmarks": {}})
    g = f["head_top"]["gates"]["a"]["axis"]
    assert g.startswith("pass (head bone from pivot d") and not f["head_top"]["flagged"], g
    f, _ = cs.fuse({"a": a}, 1.0, {"landmarks": {}})
    assert f["head_top"]["gates"]["a"]["axis"].startswith("fail") and f["head_top"]["flagged"]
    f, _ = cs.fuse({"a": {"head_top": _e((0, 0, 1.75))}}, 1.0, {"landmarks": {}})
    assert f["head_top"]["gates"]["a"]["axis"] == "n/a: no plausible head pivot" and not f["head_top"]["flagged"]
    strict = cs.Config(head_top_arc_deg=1.0)
    f, _ = cs.fuse({"a": {"neck": _e((0, 0, 1.5)), "head": _e((0, 0, 1.6)), "head_top": _e((0, -0.02, 1.75))}}, 1.0,
                   {"landmarks": {}}, strict)
    assert f["head_top"]["gates"]["a"]["axis"].startswith("fail")  # 7.6 deg > 1 deg: the limit is the config's


# ---------------------------------------------------------------------------------------------------------------- real assets


@pytest.fixture(scope="module", params=list(ASSETS))
def asset(request, tmp_path_factory):
    name = request.param
    rel, H, fam = ASSETS[name]
    glb = os.path.join(REPO, rel)
    if not os.path.isfile(glb):
        pytest.skip(f"{name}: GLB missing")
    d = str(tmp_path_factory.mktemp(name))
    mesh = glbmesh.glb_to_mesh(glb, name, H)
    an, _ = analysis.analyse(mesh, fam, glb)
    x_arms = an["symmetry"]["region_plane_x"]["arms"]
    res = {"pipeline": lg.solve(mesh, fam, x_arms, analysis=an), "handtip": lg.solve(mesh, fam)}
    lmd = None
    rigged = os.path.join(UNIRIG_OUT, name, f"{name}_rigged.glb")
    if os.path.isfile(rigged):
        mp = os.path.join(d, "mesh.npz")
        npzio.save_mesh(mp, mesh["V"], mesh["F"], weld=mesh["weld"], UV=mesh["UV"], mat=mesh["mat"], meta=mesh["meta"])
        unirig_bridge.process(name, rigged, mp, fam, os.path.join(d, "unirig"))
        lmd = cs.load_source(os.path.join(d, "unirig", "landmarks_d.json"))[0]
    return {"name": name, "H": H, "fam": template.load_family(fam), "mesh": mesh, "res": res, "d": lmd,
            "geom": lg.MeshGeom(mesh["V"], mesh["F"], mesh["weld"])}


def test_real_head_top_on_the_head_island_in_both_midline_modes(asset):
    H, g = asset["H"], asset["geom"]
    tops = {}
    for mode, res in asset["res"].items():
        L = res["landmarks"]
        ht, P = L["head_top"], np.array(L["head"]["pos"])
        T = np.array(ht["pos"])
        tops[mode] = T
        assert ht["confidence"] == pytest.approx(lg.HEAD_TOP_CONF), (mode, ht["method"])
        votes, isl = ht["diag"]["ray_votes"], str(ht["diag"]["head_island"])  # diag keys are JSON strings
        assert max(votes, key=votes.get) == isl and votes[isl] >= 50, votes
        assert T[2] > P[2] + 0.04 * H  # the top lies well above the skull base
        dev = ht["diag"]["head_axis_deg"]
        assert dev["up_deg"] <= 30.0 and dev["arc_deg"] <= 10.0, (mode, dev)  # the I3 D01 run: 71 / 28 deg
        if asset["name"] in ("FL_flagellant_vA", "U01_shambler"):
            assert T[2] / H >= 0.98 and "prior_exempt" not in ht  # no helmet: the top of the body is the top of the head
    assert np.linalg.norm(tops["pipeline"] - tops["handtip"]) <= 0.002 * H  # the island pick no longer depends on the midline


def test_real_d01_head_top_matches_g2_tail_and_helmet_exempt(asset):
    if asset["name"] != "D01_hodling":
        pytest.skip("D01 only")
    if not os.path.isfile(G2_LM):
        pytest.skip("D01 G2 landmarks missing")
    g2 = npzio.read_json(G2_LM)["spine"]
    for mode, res in asset["res"].items():
        ht = res["landmarks"]["head_top"]
        assert ht["prior_exempt"].startswith("helmet/hat"), mode
        # G2's head tail lies in the gap under the helmet (z 0.435): tier-2 class tolerance of a convention landmark, 2 % H
        assert np.linalg.norm(np.array(ht["pos"]) - np.array(g2["head_tail"])) <= 0.02 * asset["H"], (mode, ht["pos"])
        assert np.linalg.norm(np.array(res["landmarks"]["head"]["pos"]) - np.array(g2["head"])) <= 0.010  # A2: 2 % H


def test_real_head_top_passes_the_axis_gate(asset):
    if asset["d"] is None:
        pytest.skip("UniRig output missing")
    for mode, res in asset["res"].items():
        a = {k: {"pos": tuple(v["pos"]), "confidence": v["confidence"], "method": v["method"],
                 **({"prior_exempt": v["prior_exempt"]} if v.get("prior_exempt") else {})} for k, v in res["landmarks"].items()}
        f, _ = cs.fuse({"a": a, "d": asset["d"]}, asset["H"], asset["fam"], gg=cs.GateGeometry(asset["mesh"], res["frame"]))
        gate = f["head_top"]["gates"]["a"]["axis"]
        assert gate.startswith("pass"), (mode, gate)
        assert not f["head_top"]["flagged"] and f["head_top"]["kind"] == "single", (mode, f["head_top"]["decision"])
