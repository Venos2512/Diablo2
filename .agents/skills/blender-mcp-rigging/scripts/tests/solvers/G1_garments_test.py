"""G1 (phase G) tests: garment classification (S3g), chain plan, garment overlay (S6/S7) on synthetic fixtures and on the FL / D01
dev data. Outputs (acceptance numbers in ``acceptance_*.json``, the FL / D01 plan files) go to ``<pytest basetemp>/G1out``, so
``--basetemp`` redirects them and no run overwrites another writer's evidence (G4; this used to be E:\\tmp_rigkit\\G1).

Run: E:\\tools\\rigkit-env\\Scripts\\python.exe -I -B -m pytest scripts/tests/solvers/G1_garments_test.py -q --basetemp <dir>
"""
from __future__ import annotations

import json
import os
import sys
import time

import numpy as np
import pytest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import G1_helpers as fx  # noqa: E402
from rigcore import npzio  # noqa: E402
from solvers import chains as ch  # noqa: E402
from solvers import garments as gm  # noqa: E402
from solvers import skin_common as sc  # noqa: E402
from solvers import skin_garment as sg  # noqa: E402

OUT = None  # <pytest basetemp>/G1out (set by the autouse fixture below)
DEV = {"FL": r"E:\tmp_rigkit\I4\FL_H", "D01": r"E:\tmp_rigkit\I5\D01_S"}


@pytest.fixture(autouse=True, scope="session")
def _out_dir(tmp_path_factory):
    global OUT
    OUT = os.path.join(str(tmp_path_factory.getbasetemp()), "G1out")
    os.makedirs(OUT, exist_ok=True)
    yield OUT


def _save(name, obj):
    os.makedirs(OUT, exist_ok=True)
    npzio.write_json(os.path.join(OUT, name), obj)


def _run(mesh, skel, analysis=None, arrays=None, aux_budget=32):
    doc, arr = gm.classify(mesh, skel, analysis, arrays, aux_budget=aux_budget)
    chains = ch.plan(doc, arr, mesh, skel)
    return doc, arr, chains


def _live(doc):
    return [p for p in doc["pieces"] if p["class"] != "tight"]


# ------------------------------------------------------------------------------------------------------------- fixtures

CASES = {  # case -> [(class, layer, chains)] of the non-tight pieces
    "skirt": [("skirt", 0, 6)],
    "tails": [("strip", 0, 1)] * 3,
    "cape": [("cape", 0, 3)],
    "beads": [("cluster", 0, 1)],
    "layered": [("skirt", 0, 8), ("skirt", 1, 0)],
    "shirt": [],
    "body": [],
}


@pytest.mark.parametrize("case", sorted(CASES))
def test_fixture_classes_and_chains(case):
    mesh, skel = fx.fixture(case)
    doc, arr, chains = _run(mesh, skel)
    got = sorted((p["class"], p["layer"], p["chains_planned"]) for p in _live(doc))
    _save(f"fixture_{case}.json", {"pieces": [(p["id"], p["class"], p["layer"], p["chains_planned"], p["bones_planned"],
                                                p["confidence"]) for p in doc["pieces"]],
                                    "chains": [(c["id"], len(c["bones"])) for c in chains["chains"]], "budget": chains["budget"]})
    assert got == sorted(CASES[case]), got
    assert chains["budget"]["used"] <= 32
    names = [b["name"] for c in chains["chains"] for b in c["bones"]]
    assert len(names) == len(set(names))
    assert not set(names) & {b["name"] for b in skel["bones"]}
    if case == "shirt":
        assert not chains["chains"]


def test_fixture_names_mirror_and_hinge():
    mesh, skel = fx.fixture("skirt")
    doc, arr, chains = _run(mesh, skel)
    by = {c["id"]: c for c in chains["chains"]}
    assert {"skirt_F", "skirt_B", "L_skirt_S", "R_skirt_S", "L_skirt_FS", "R_skirt_FS"} <= set(by)
    x0 = doc["body"]["x_mid"]
    for cid, c in by.items():
        if cid.startswith("L_"):
            r = by["R_" + cid[2:]]
            for bl, br in zip(c["bones"], r["bones"]):
                m = np.array(br["head"])
                m[0] = 2 * x0 - m[0]
                assert np.linalg.norm(np.array(bl["head"]) - m) <= 0.01 * fx.H
        for b in c["bones"]:
            x = np.array(b["hinge"])
            y = np.subtract(b["tail"], b["head"])
            assert abs(np.linalg.norm(x) - 1) < 1e-9 and abs(x @ y) < 1e-6 * np.linalg.norm(y)
            out = np.array(c["leg_push"]["dir"])
            z = np.cross(x, y / np.linalg.norm(y))
            assert z @ out > 0  # +X rotation swings the tail toward the outward direction
        assert c["spring"]["stiffness"] == 1.0 and c["spring"]["gravityDir"] == [0.0, 0.0, -1.0]
        assert c["min_leg_distance"] is not None
    assert by["skirt_F"]["leg_push"]["w_L"] == pytest.approx(0.5)
    assert by["L_skirt_S"]["leg_push"]["w_L"] == pytest.approx(0.85)
    merged = ch.merge_chains(skel, chains)
    from rigcore import schema

    schema.validate_skeleton(merged)
    assert sum(b["kind"] == "aux" for b in merged["bones"]) == chains["budget"]["used"]
    import re

    roots = [b for b in merged["bones"] if b["kind"] == "aux" and b["bend_test"]]
    assert len(roots) == len(chains["chains"])
    for b in roots:  # rigkit/skeleton.py parse_bend_test needs a (+X|-X|+Y|-Y|+Z|-Z) token naming the world direction
        m = re.search(r"\(([+-][XYZ])\)", b["bend_test"])
        assert m and m.group(1) == ch.axis_token(b["outward"])
        y = np.subtract(b["tail"], b["head"])
        z = np.cross(np.array(b["hinge"]), y / np.linalg.norm(y))  # positive X rotation moves the tail toward local Z
        assert z @ np.array(b["outward"]) > 0


def test_budget_trims_order():
    pieces = [{"id": "s", "class": "skirt", "length": 1.0, "z_min": 0.1, "floor_length": True, "inner_frac": 0.2, "layer": 0},
              {"id": "c", "class": "cluster", "length": 0.8, "n_items": 12, "layer": 0}]
    plan = ch.count_plan(pieces, 1.8, 10, {"knee_z": 0.5, "ankle_z": 0.1})
    kinds = [t["trim"] for t in plan["trims"]]
    assert kinds[0] == "bones_to_3" and "skirt_8_to_6" in kinds and kinds.index("bones_to_3") < kinds.index("skirt_8_to_6")
    # review r1 m4 (the old "used <= 10 or over_budget" was a tautology): the exact trims in spec order; a budget of 10 cannot
    # be met (the minimum 4-chain ring x 3 bones = 12), so the plan says over_budget with used = the real bone count; a budget of
    # 12 is met with the same trims and no over_budget
    assert kinds == ["bones_to_3", "bones_to_3", "skirt_8_to_6", "skirt_6_to_4", "cluster_rigid"], kinds
    used = sum(c["chains"] * c["bones"] for c in plan["pieces"].values())
    assert plan["used"] == used == 12 and plan["over_budget"] is True, plan
    plan12 = ch.count_plan(pieces, 1.8, 12, {"knee_z": 0.5, "ankle_z": 0.1})
    assert plan12["used"] <= 12 and plan12["over_budget"] is False, plan12
    assert plan12["used"] == sum(c["chains"] * c["bones"] for c in plan12["pieces"].values())


def test_along_monotone_and_material_split():
    t = np.linspace(0, 1, 101)
    for n in (1, 3, 5):
        A = sg.along(t, n)
        assert np.allclose(A.sum(1), 1)
        mean_idx = A @ np.arange(n + 1)
        assert (np.diff(mean_idx) >= -1e-12).all()
        assert ((A > 0).sum(1) <= 2).all()
    A = sg.along(t, 3, rigid_below=0.6)
    assert np.allclose(A[t >= 0.6, 3], 1.0) and (np.diff(A @ np.arange(4)) >= -1e-12).all()
    mat = np.array([0] * 60 + [1] * 40)
    sp = gm.material_split(np.arange(100), np.linspace(0, 1, 100).astype(np.float32), mat, 0.15)
    assert sp is not None and 0.5 <= sp["t"] <= 0.65 and sp["below"] == 1


@pytest.mark.parametrize("case", ["skirt", "tails", "cape", "beads", "layered"])
def test_fixture_overlay_invariants(case):
    mesh, skel = fx.fixture(case)
    doc, arr, chains = _run(mesh, skel)
    merged = ch.merge_chains(skel, chains)
    names, W, alpha, rules, rep = sg.overlay(mesh, doc, arr, chains, merged)
    topo = sc.weld_topo(mesh)
    setup, mrules = sg.garment_setup(mesh, merged, {}, rules)
    bn, bw = fx.body_weights(mesh, skel)
    Wf, ar = sg.to_full(topo, W, alpha)
    Wb, frep = sg.apply_overlay({"bones": bn, "W": bw}, {"bones": names, "W": Wf, "alpha": ar}, mrules, setup, merged, arr)
    chk = sg.check_overlay(Wb, setup.bones.names, doc, arr, chains, topo, setup, mrules, merged, alpha=alpha)
    chk["seam_max_diff"] = sc.seam_max_diff(sc.to_full(Wb, topo), mesh["weld"])
    _save(f"fixture_{case}_overlay_check.json", chk)
    assert chk["ok"], chk
    assert chk["seam_max_diff"] <= 1e-6
    # overlay is deterministic
    names2, W2, alpha2, rules2, _ = sg.overlay(mesh, doc, arr, chains, merged)
    assert np.array_equal(W, W2) and np.array_equal(alpha, alpha2)
    if case == "layered":
        assert chk["inner_rows"] > 0
    if case == "beads":
        assert any(k.startswith("garment_g00_item") for k in rules["rigid"])


def test_legacy_family_is_empty():
    mesh, skel = fx.fixture("skirt")
    doc, arr = gm.classify(mesh, skel, family="S_legacy_D01")
    assert doc["pieces"] == [] and arr == {}
    assert ch.plan(doc, arr, mesh, skel)["chains"] == []


# ------------------------------------------------------------------------------------------------------------- dev data


def _dev(tag):
    d = DEV[tag]
    if not os.path.isdir(d):
        pytest.skip(f"dev data missing: {d}")
    mesh = npzio.load_mesh(os.path.join(d, "_work", "mesh.npz"))
    skel = npzio.read_json(os.path.join(d, "skeleton.json"))
    an = npzio.read_json(os.path.join(d, "analysis.json"))
    with np.load(os.path.join(d, "analysis.npz"), allow_pickle=False) as z:
        arr = {k: z[k] for k in z.files if k in ("thickness_welded", "island_welded")}
    return d, mesh, skel, an, arr


def _dev_run(tag):
    d, mesh, skel, an, arr = _dev(tag)
    times = {}
    t0 = time.time()
    doc, garr = gm.classify(mesh, skel, an, arr)
    times["garments_s"] = time.time() - t0
    t0 = time.time()
    chains = ch.plan(doc, garr, mesh, skel)
    times["chains_s"] = time.time() - t0
    t0 = time.time()
    merged = ch.merge_chains(skel, chains)
    names, W, alpha, rules, rep = sg.overlay(mesh, doc, garr, chains, merged)
    topo = sc.weld_topo(mesh)
    Wf, af = sg.to_full(topo, W, alpha)
    setup, mrules = sg.garment_setup(mesh, merged, npzio.read_json(os.path.join(d, "skin_rules.json")), rules)
    body = npzio.load_weights(os.path.join(d, "weights.npz"))
    Wb, frep = sg.apply_overlay({"bones": [str(b) for b in body["bones"]], "W": body["W"]},
                                {"bones": names, "W": Wf, "alpha": af}, mrules, setup, merged, garr)
    times["skin_garment_s"] = time.time() - t0
    chk = sg.check_overlay(Wb, setup.bones.names, doc, garr, chains, topo, setup, mrules, merged, alpha=alpha)
    chk["seam_max_diff"] = sc.seam_max_diff(sc.to_full(Wb, topo), mesh["weld"])
    out = os.path.join(OUT, tag)
    gm.save(doc, garr, os.path.join(out, "garments.json"), os.path.join(out, "garments.npz"))
    npzio.write_json(os.path.join(out, "chains.json"), chains)
    sg.save(os.path.join(out, "garment_overlay.npz"), os.path.join(out, "garment_rules.json"), names, Wf, af, rules,
            {"asset_id": doc["asset_id"]})
    return doc, garr, chains, chk, times


def test_fl_acceptance():
    doc, garr, chains, chk, times = _dev_run("FL")
    live = _live(doc)
    cls = {p["id"]: p for p in live}
    acc = {"pieces": [{k: p.get(k) for k in ("id", "class", "confidence", "n_welded", "layer", "side", "parent", "chains_planned",
                                             "bones_planned", "islands")} for p in live],
           "chains": [(c["id"], c["class"], len(c["bones"])) for c in chains["chains"]], "budget": chains["budget"],
           "coverage": doc["coverage"], "check": chk, "times_s": times, "asymmetry": chains["asymmetry"]}
    _save("acceptance_FL.json", acc)
    assert chains["budget"]["used"] <= 32
    assert doc["coverage"]["frac"] >= 0.95
    rigid_isl = [set(p.get("islands") or []) for p in live if p["class"] == "rigid_hanging"]
    assert any(22 in s for s in rigid_isl), "lantern (island 22) must be rigid_hanging"
    assert any(19 in s for s in rigid_isl), "flask (island 19) must be rigid_hanging"
    beads = [p for p in live if p["class"] == "cluster"]
    assert beads and len(set(beads[0]["islands"]) & set(range(2, 14))) >= 10
    assert any(p["class"] == "skirt" and p["chains_planned"] >= 4 for p in live)
    assert chk["ok"], chk
    assert chk["seam_max_diff"] <= 1e-6
    assert all(v < 60 for v in times.values())


def test_d01_acceptance():
    doc, garr, chains, chk, times = _dev_run("D01")
    acc = {"pieces": [{k: p.get(k) for k in ("id", "class", "confidence", "n_welded", "layer", "side", "parent", "chains_planned",
                                             "bones_planned", "merged_into")} for p in doc["pieces"]],
           "chains": [(c["id"], c["class"], len(c["bones"])) for c in chains["chains"]], "budget": chains["budget"],
           "coverage": doc["coverage"], "check": chk, "times_s": times}
    _save("acceptance_D01.json", acc)
    chained = [p for p in doc["pieces"] if p["chains_planned"]]
    assert len(chained) == 2 and all(p["class"] == "strip" for p in chained)
    P = sc.weld_topo(npzio.load_mesh(os.path.join(DEV["D01"], "_work", "mesh.npz"))).P
    an = np.load(os.path.join(DEV["D01"], "analysis.npz"))["island_welded"]
    for k, p in enumerate(doc["pieces"]):
        if p["chains_planned"]:
            rows = np.flatnonzero(garr["piece"] == k)
            assert set(np.unique(an[rows]).tolist()) == {1}, "chains only on the loincloth island"
    assert chains["budget"]["used"] <= 4
    assert chk["ok"], chk
