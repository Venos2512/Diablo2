r"""G3: solvers/chains.py fixes of phase G - bones from the free length, the no-crossing rule (spec §3.2), the review r1 minors
m1 (leg-push root height as a fraction of H), m2 (``min_leg_distance`` inside ``spring``) and m3 (skirt rings of any count 2-8).

    E:\tools\rigkit-env\Scripts\python.exe -I -B -m pytest tests/solvers/G3_chains_test.py -q -p no:cacheprovider

Pure numpy on synthetic data, plus G1's skirt fixture (tests/solvers/G1_helpers.py) for the ring overrides.
"""
import copy
import math
import os
import sys

import numpy as np
import pytest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, HERE)

from solvers import chains as ch  # noqa: E402


# ------------------------------------------------------------------ m3: any ring count
@pytest.mark.parametrize("n", range(2, 9))
def test_G3_ring_layout_any_count(n):
    lay = ch.ring_layout(n)
    assert len(lay) == n and len({k for _, k in lay}) == n  # unique keys
    az = sorted(a for a, _ in lay)
    gaps = np.diff(az + [az[0] + 360.0])
    assert n in ch.RING or np.allclose(gaps, 360.0 / n, atol=1e-3)  # even azimuths (the named 6-ring keeps its diagonals)
    assert (0.0, "F") in [(round(a, 4), k) for a, k in lay]
    for a, k in lay:  # L_/R_ only off the midline; side matches the sign of the azimuth (+ = character's left)
        if k in ("F", "B"):
            assert abs(a) < 22.5 or abs(a) >= 157.5
        else:
            assert k.startswith("L_" if a > 0 else "R_")
    if n in ch.RING:
        assert lay == ch.RING[n]
    with pytest.raises(ValueError):
        ch.ring_layout(9)


def test_G3_override_chains_clamped_and_reported():
    pc = {"id": "g00", "class": "skirt", "layer": 0, "length": 1.2, "free_length": 1.0, "z_min": 0.1, "override_chains": 5,
          "attach": {"points": [[0, 0, 1.0]]}}
    plan = ch.count_plan([pc], 1.8, 32, {"knee_z": 0.5, "ankle_z": 0.1})
    assert plan["pieces"]["g00"]["ring"] == plan["pieces"]["g00"]["chains"] == 5
    pc9 = dict(pc, override_chains=11)
    e = ch.count_plan([pc9], 1.8, 64, {"knee_z": 0.5, "ankle_z": 0.1})["pieces"]["g00"]
    assert e["chains"] == 8 and "clamped" in e["why"]


def test_G3_bones_from_free_length():
    body = {"knee_z": 0.5, "ankle_z": 0.1}
    pc = {"id": "s", "class": "strip", "layer": 0, "length": 0.075, "free_length": 0.0376, "z_min": 0.14,
          "attach": {"points": [[0, 0, 0.2]]}}
    assert ch.count_plan([pc], 0.5, 4, body)["pieces"]["s"]["bones"] == 1  # D01's back flap: free length -> 1 bone
    assert ch.count_plan([dict(pc, free_length=None)], 0.5, 4, body)["pieces"]["s"]["bones"] == 2  # plain length -> 2


# ------------------------------------------------------------------ m1: leg push by a fraction of H
@pytest.mark.parametrize("H", [0.5, 1.8, 3.0])
def test_G3_leg_push_root_height_scales_with_H(H):
    body = {"z_hip": 0.55 * H}
    out = [0.0, -1.0, 0.0]
    hem = [0.0, 0.0, 0.3 * H]
    on = ch._leg_push("strip", 0.0, [0, 0, body["z_hip"] + 0.09 * H], body, out, H, hem=hem)
    off = ch._leg_push("strip", 0.0, [0, 0, body["z_hip"] + 0.11 * H], body, out, H, hem=hem)
    short = ch._leg_push("strip", 0.0, [0, 0, body["z_hip"] + 0.05 * H], body, out, H, hem=[0, 0, body["z_hip"] + 0.01 * H])
    side = ch._leg_push("strip", 90.0, [0, 0, body["z_hip"]], body, out, H, hem=hem)
    assert on["enabled"] and not off["enabled"] and not short["enabled"] and not side["enabled"]
    assert ch._leg_push("skirt", 90.0, [0, 0, body["z_hip"] + 0.5 * H], body, out, H)["enabled"]  # every skirt chain


# ------------------------------------------------------------------ no-crossing rule
def _ring_chain(cid, az, roots_az, H=1.8, axis=(0.0, 0.0), n=3):
    """A straight synthetic ring chain hanging from radius 0.15 at z 1.2 to radius 0.4 at z 0.2; the root sits at ``roots_az``."""
    J = []
    for i in range(n + 1):
        f = i / n
        a = math.radians(roots_az if i == 0 else az)
        r = 0.15 + 0.25 * f
        J.append([axis[0] + r * math.sin(a), axis[1] - r * math.cos(a), 1.2 - f])
    bones = [{"name": f"{cid}_{i + 1:02d}", "parent": "pelvis", "head": J[i], "tail": J[i + 1], "hinge": [1.0, 0.0, 0.0]}
             for i in range(n)]
    return {"id": cid, "piece": "g00", "class": "skirt", "azimuth_deg": az, "fan_root": None, "bones": bones}


def test_G3_uncross_ring_roots_and_levels():
    azs = [(-180.0, "skirt_B"), (-90.0, "R_skirt_S"), (-45.0, "R_skirt_FS"), (0.0, "skirt_F"), (90.0, "L_skirt_S")]
    chains = [_ring_chain(cid, az, az) for az, cid in azs]
    good = copy.deepcopy(chains)
    doc = {"crossing": []}
    ch._uncross_rings(good, (0.0, 0.0), 1.8, doc)
    assert doc["crossing"] == []  # an ordered ring is left alone
    # FL's case: skirt_F's root drifted to -61 deg, past R_skirt_FS's root at -45 (G1's crossing near the right front)
    chains[3] = _ring_chain("skirt_F", 0.0, -61.0)
    doc = {"crossing": []}
    ch._uncross_rings(chains, (0.0, 0.0), 1.8, doc)
    assert len(doc["crossing"]) == 1 and doc["crossing"][0]["piece"] == "g00"
    fx = doc["crossing"][0]["fixed"]
    assert any(set(f["chains"]) == {"R_skirt_FS", "skirt_F"} and f["level"] == 0 for f in fx)
    for c in chains:  # every level in azimuth order again, bones still connected
        J = np.array([b["head"] for b in c["bones"]] + [c["bones"][-1]["tail"]])
        assert all(np.allclose(c["bones"][i]["tail"], c["bones"][i + 1]["head"]) for i in range(len(c["bones"]) - 1))
        if c["id"] == "skirt_F":
            assert abs(math.degrees(math.atan2(J[0, 0], -J[0, 1]))) < 1e-6  # the root went back to its own azimuth
    ring = sorted(chains, key=lambda c: c["azimuth_deg"])
    for lev in range(4):
        phi = [math.degrees(math.atan2(c["bones"][lev]["head"][0] if lev < 3 else c["bones"][-1]["tail"][0],
                                       -(c["bones"][lev]["head"][1] if lev < 3 else c["bones"][-1]["tail"][1]))) for c in ring]
        assert phi == sorted(phi)
    # a crossing below the root (level 2): turned back to the pair's mid azimuth +- a quarter of their root gap
    chains = [_ring_chain(cid, az, az) for az, cid in azs]
    b = chains[2]["bones"]  # R_skirt_FS: joint 2 swings past skirt_F (to +10 deg)
    r = math.hypot(*b[1]["tail"][:2])
    b[1]["tail"] = b[2]["head"] = [r * math.sin(math.radians(10.0)), -r * math.cos(math.radians(10.0)), b[1]["tail"][2]]
    doc = {"crossing": []}
    ch._uncross_rings(chains, (0.0, 0.0), 1.8, doc)
    p_fs = math.degrees(math.atan2(chains[2]["bones"][2]["head"][0], -chains[2]["bones"][2]["head"][1]))
    p_f = math.degrees(math.atan2(chains[3]["bones"][2]["head"][0], -chains[3]["bones"][2]["head"][1]))
    assert doc["crossing"] and p_f - p_fs >= 0.25 * 45.0 - 1e-6
    assert all(v > 0 for v in doc["crossing"][0]["min_polyline_gap_H"].values())


# ------------------------------------------------------------------ m2 + plan on G1's skirt fixture
def test_G3_plan_spring_block_and_ring_override():
    import G1_helpers as fx
    from solvers import garments as gm

    mesh, skel = fx.fixture("skirt")
    doc, arr = gm.classify(mesh, skel)
    plan = ch.plan(doc, arr, mesh, skel)
    assert plan["chains"]
    for c in plan["chains"]:
        assert "min_leg_distance" in c["spring"]  # the contract's place (review m2); the chain-level key stays as an alias
        assert c["spring"]["min_leg_distance"] == c.get("min_leg_distance", c["spring"]["min_leg_distance"])
        assert {"stiffness", "gravityPower", "gravityDir", "dragForce", "hitRadius"} <= set(c["spring"])
    sk = next(p for p in doc["pieces"] if p["class"] == "skirt")
    for n in (3, 5, 7):  # review m3: no KeyError, n chains on the ring
        d2 = copy.deepcopy(doc)
        next(p for p in d2["pieces"] if p["id"] == sk["id"])["override_chains"] = n
        p2 = ch.plan(d2, arr, mesh, skel)
        assert len([c for c in p2["chains"] if c["class"] == "skirt"]) == n


# ------------------------------------------------------------------ G3b: coverage fit, push limits + drape, capes and fans
def test_G3b_bone_rows_matches_the_overlay_dominance():
    from solvers import skin_garment as sg  # read only: the estimate must follow the overlay's along() rule

    t = np.random.default_rng(3).random(4000)
    for n in (1, 2, 3, 5):
        W = sg.along(t, n)
        dom = W.argmax(1)
        want = np.bincount(dom[dom > 0] - 1, minlength=n)
        assert ch.bone_rows(t, n).tolist() == want.tolist(), n


def _ring_case(rows_per_chain, t_of):
    """A 4-chain ring (F, L_S, B, R_S) with ``rows_per_chain`` rows each at its own azimuth and t from ``t_of(j, count)``."""
    az = [0.0, 90.0, 180.0, -90.0]
    phi, t = [], []
    for j, n in enumerate(rows_per_chain):
        phi += [az[j]] * n
        t += list(t_of(j, n))
    n_all = len(phi)
    specs = [(nm, sd, a, None, None, False) for nm, sd, a in (("skirt_F", None, 0.0), ("skirt_S", "L", 90.0),
                                                               ("skirt_B", None, 180.0), ("skirt_S", "R", -90.0))]
    arrays = {"phi": np.array(phi, float)}
    return specs, np.zeros(n_all, int), np.array(t, float), arrays


def test_G3b_fit_coverage_drops_bones_then_chains():
    pc = {"id": "g00", "class": "skirt"}
    # every chain 40 rows spread evenly in t: 3 bones of about 11 rows pass
    specs, piece, t, arrays = _ring_case([40] * 4, lambda j, n: np.linspace(0.05, 0.999, n))
    cnt, doc = {"trims": []}, {"notes": []}
    sp, nb = ch._fit_coverage("skirt", pc, 0, specs, 3, np.arange(len(t)), piece, t, arrays, cnt, doc)
    assert nb == 3 and len(sp) == 4 and not cnt["trims"] and doc["coverage"][0]["ok"]
    # the back chain's cloth ends at t 0.6: its 3rd bone has no row -> every chain of the ring drops to 2 bones
    specs, piece, t, arrays = _ring_case([40] * 4, lambda j, n: np.linspace(0.05, 0.6 if j == 2 else 0.999, n))
    cnt, doc = {"trims": []}, {"notes": []}
    sp, nb = ch._fit_coverage("skirt", pc, 0, specs, 3, np.arange(len(t)), piece, t, arrays, cnt, doc)
    assert nb == 2 and len(sp) == 4 and cnt["trims"] == [{"trim": "coverage_bones", "piece": "g00", "from": 3, "to": 2}]
    assert all(min(v) >= ch.COVER_MIN_ROWS for v in doc["coverage"][0]["rows_per_bone"].values())
    # a narrow side panel with 5 rows cannot hold one bone: it merges into its neighbours, the rest keep 3 bones
    specs, piece, t, arrays = _ring_case([40, 5, 40, 40], lambda j, n: np.linspace(0.05, 0.999, n))
    cnt, doc = {"trims": []}, {"notes": []}
    sp, nb = ch._fit_coverage("skirt", pc, 0, specs, 3, np.arange(len(t)), piece, t, arrays, cnt, doc)
    assert len(sp) == 3 and "L_skirt_S" not in [(s[1] + "_" if s[1] else "") + s[0] for s in sp]
    assert cnt["trims"][0]["trim"] == "coverage_merge_chain" and cnt["trims"][0]["chain"] == "L_skirt_S"
    assert nb == 3  # its 5 rows now ride on F and B
    # a strip: rows per bone from its own t
    cnt, doc = {"trims": []}, {"notes": []}
    t1 = np.linspace(0.05, 0.999, 20)
    sp, nb = ch._fit_coverage("strip", {"id": "g02"}, 0, [("tail_1", "L", None, np.ones(20, bool), None, False)], 3,
                              np.arange(20), np.zeros(20, int), t1, {}, cnt, doc)
    assert nb == 2 and doc["coverage"][0]["rows_per_bone"]["L_tail_1"] == ch.bone_rows(t1, 2).tolist()


@pytest.mark.parametrize("phi,deg", [(0.0, 80.0), (180.0, 80.0), (-45.0, 80.0), (52.0, 60.0), (90.0, 60.0), (-132.9, 60.0)])
def test_G3b_push_limit_by_facing_and_drape(phi, deg):
    lp = ch._leg_push("skirt", phi, [0, 0, 1.0], {"z_hip": 1.0}, [0.0, -1.0, 0.0], 1.8)
    assert lp["max_deg"] == deg and lp["drape"] == ch.DRAPE == 0.75


def _lat_chain(cid, cls, piece, xs, z0=1.4, dz=0.2, parent="chest", fan_root=None, out=(0.0, 1.0, 0.0)):
    J = [[x, 0.1, z0 - dz * i] for i, x in enumerate(xs)]
    bones = []
    par = parent
    for i in range(len(J) - 1):
        nm = f"{cid}_{i + 1:02d}"
        bones.append({"name": nm, "parent": par, "head": J[i], "tail": J[i + 1], "hinge": [1.0, 0.0, 0.0]})
        par = nm
    return {"id": cid, "piece": piece, "class": cls, "fan_root": fan_root, "bones": bones,
            "leg_push": {"enabled": False, "dir": list(out)}}


def test_G3b_uncross_cape():
    chains = [_lat_chain("R_cape", "cape", "c0", [-0.10, -0.12, -0.13, -0.14]),
              _lat_chain("cape_C", "cape", "c0", [0.00, 0.00, -0.20, -0.25]),  # swings past R_cape below level 1
              _lat_chain("L_cape", "cape", "c0", [0.10, 0.12, 0.13, 0.14])]
    doc = {"crossing": []}
    ch._uncross_lateral(chains, 1.8, doc)
    assert doc["crossing"] and doc["crossing"][0]["group"] == "cape" and doc["crossing"][0]["piece"] == "c0"
    for lev in range(4):
        xs = [(c["bones"][lev]["head"] if lev < 3 else c["bones"][-1]["tail"])[0] for c in chains]
        assert xs == sorted(xs), (lev, xs)
        assert min(np.diff(xs)) >= 0.25 * 0.10 - 1e-9
    for c in chains:
        assert all(np.allclose(c["bones"][i]["tail"], c["bones"][i + 1]["head"]) for i in range(len(c["bones"]) - 1))
    ok = [_lat_chain("R_cape", "cape", "c1", [-0.1] * 4), _lat_chain("cape_C", "cape", "c1", [0.0] * 4),
          _lat_chain("L_cape", "cape", "c1", [0.1] * 4)]
    doc = {"crossing": []}
    ch._uncross_lateral(ok, 1.8, doc)
    assert doc["crossing"] == []


def test_G3b_uncross_fan():
    lead = _lat_chain("tail_1", "strip", "s0", [0.0, 0.0, 0.0, 0.0], parent="pelvis", out=(0.0, -1.0, 0.0))
    mem = _lat_chain("tail_2", "strip", "s1", [0.08, 0.06, -0.05], z0=1.2, parent=lead["bones"][0]["name"],
                     fan_root=lead["bones"][0]["name"], out=(0.0, -1.0, 0.0))  # starts left of the leader, ends right of it
    doc = {"crossing": []}
    ch._uncross_lateral([lead, mem], 1.8, doc)
    assert doc["crossing"] and doc["crossing"][0]["group"] == "fan"
    u = np.array([1.0, 0.0, 0.0])  # across the leader's outward -Y
    JL = np.array([b["head"] for b in lead["bones"]] + [lead["bones"][-1]["tail"]])
    JM = np.array([b["head"] for b in mem["bones"]] + [mem["bones"][-1]["tail"]])
    side = [float((JM[i] - JL[i + 1]) @ u) for i in range(len(JM))]  # member levels line up with the leader's from bone 02
    assert all(s > 0 for s in side) or all(s < 0 for s in side), side
