"""G4 (phase G, review r1 fixes) tests: transition band from every junction (B1), slit cut only where the cloth is separated (M1),
inner layers interpolated from the outer surface (M2), one garment_bleed definition judged by the outer_ref's piece (M5), strip
hem ramp (m8). Synthetic fixtures from G1_helpers; outputs only under the pytest basetemp.

Run: E:\\tools\\rigkit-env\\Scripts\\python.exe -I -B -m pytest scripts/tests/solvers/G4_garment_fixes_test.py -q --basetemp <dir>
"""
from __future__ import annotations

import copy
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import G1_helpers as fx  # noqa: E402
from solvers import chains as ch  # noqa: E402
from solvers import garments as gm  # noqa: E402
from solvers import skin_common as sc  # noqa: E402
from solvers import skin_garment as sg  # noqa: E402


def _plan(mesh, skel):
    doc, arr = gm.classify(mesh, skel)
    chains = ch.plan(doc, arr, mesh, skel)
    return doc, arr, chains, ch.merge_chains(skel, chains)


def _apply(mesh, skel, doc, arr, chains, merged):
    names, W, alpha, rules, rep = sg.overlay(mesh, doc, arr, chains, merged)
    topo = sc.weld_topo(mesh)
    setup, mrules = sg.garment_setup(mesh, merged, {}, rules)
    bn, bw = fx.body_weights(mesh, skel)
    Wf, af = sg.to_full(topo, W, alpha)
    Wb, frep = sg.apply_overlay({"bones": bn, "W": bw}, {"bones": names, "W": Wf, "alpha": af}, mrules, setup, merged, arr)
    chk = sg.check_overlay(Wb, setup.bones.names, doc, arr, chains, topo, setup, mrules, merged, alpha=alpha)
    return names, W, alpha, rules, rep, topo, setup, Wb, chk


def _fuse_to_legs(mesh, arr, z_lo=0.55, z_hi=0.75):
    """The skirt fixture fused to the leg tubes below its top line: one triangle per cone row inside the band of heights,
    joining the cone vertex to the two nearest leg vertices (the welded ids do not change, so garments.npz stays valid)."""
    m = copy.deepcopy(mesh)
    topo = sc.weld_topo(m)
    V = np.asarray(m["V"], float)
    weld = np.asarray(m["weld"])
    piece = np.asarray(arr["piece"])
    leg_w = np.flatnonzero((piece < 0) & (topo.P[:, 2] > z_lo - 0.1) & (topo.P[:, 2] < z_hi + 0.1) & (np.abs(topo.P[:, 0]) < 0.2))
    first = np.full(topo.n_w, -1)
    first[weld[::-1]] = np.arange(len(weld))[::-1]
    cone = np.flatnonzero((piece >= 0) & (topo.P[:, 2] > z_lo) & (topo.P[:, 2] < z_hi) & (np.abs(topo.P[:, 0]) > 0.12)
                          & (np.abs(topo.P[:, 1]) < 0.12))
    F = [m["F"]]
    for v in cone:
        d = np.linalg.norm(topo.P[leg_w] - topo.P[v], axis=1)
        two = leg_w[np.argsort(d)[:2]]
        F.append(np.array([[first[v], first[two[0]], first[two[1]]]], np.int32))
    m["F"] = np.concatenate(F).astype(np.int32)
    assert len(cone) >= 4
    return m, cone


def test_G4_band_from_every_junction():
    """B1: a skirt fused to the legs below its top line gets band rows at the fused rows (not only at the belt), the band rows keep
    their leg bones, rows with a complete overlay carry none, and the border has no weight seam."""
    mesh0, skel = fx.fixture("skirt")
    doc, arr, chains, merged = _plan(mesh0, skel)
    mesh, fused = _fuse_to_legs(mesh0, arr)
    names, W, alpha, rules, rep, topo, setup, Wb, chk = _apply(mesh, skel, doc, arr, chains, merged)
    assert (alpha[fused] < 1).all() and (alpha[fused] > 0).all(), alpha[fused]
    info = rep["pieces"][doc["pieces"][0]["id"]]
    assert info["junction_rows"] >= len(fused)
    assert chk["ok"], chk
    assert chk["leg_weight_on_hanging_max"] == 0.0 and chk["leg_weight_on_band_max"] > 0.1
    c = chk["continuity"]
    assert c["ok"] and c["border"]["seam_edges"] == 0 and c["border"]["max"] <= max(0.5, c["limit"]), c
    # without the junction band (G1's overlay: band only from the attachment line) the fused rows step 1:1 to the leg
    reg = rules["regions"][f"garment_{doc['pieces'][0]['id']}"]["vertex_ids"]
    assert not set(fused.tolist()) & set(reg), "band rows must not be in the garment region (they keep their body bones)"


def test_G4_slit_cut_only_where_separated():
    """M1: a slit record on a cone that is connected all round cuts nothing (outer edges cross the slit azimuth at every
    height); a slit seen on fewer than 3 section levels is dropped; a real open gap is cut."""
    mesh, skel = fx.fixture("skirt")
    doc, arr, chains, merged = _plan(mesh, skel)
    pc = doc["pieces"][0]
    base = sg.overlay(mesh, doc, arr, chains, merged)
    az = sorted(c["azimuth_deg"] for c in chains["chains"])
    mid = 0.5 * (az[0] + az[1])
    for levels in (5, 2):
        d2 = copy.deepcopy(doc)
        d2["pieces"][0]["slits"] = [{"phi_deg": mid, "width_deg": 8.0, "z_top": pc["z_top"] - 0.01, "levels": levels}]
        got = sg.overlay(mesh, d2, arr, chains, merged)
        assert np.allclose(got[1], base[1]), levels  # no cut anywhere: the cloth is connected across the slit
        used = got[4]["pieces"][pc["id"]]["slits"][0]["used"]
        assert ("dropped" in used) == (levels < 3), used
    # a cone open between 120 and 140 deg over its whole height (a real slit, found by S3g on every level, between the L_S and B
    # chains) is cut: rows on each side of the gap below the slit top take one chain only
    bld = fx.Builder()
    fx.body(bld)
    fx.cone_sheet(bld, 1.02, 0.3, 0.22, 0.36, phi0=140.0, phi1=480.0)
    m2, skel2 = bld.mesh("G4_open_gap"), fx.skeleton()
    doc2, arr2, chains2, merged2 = _plan(m2, skel2)
    k = next(i for i, p in enumerate(doc2["pieces"]) if p["class"] == "skirt")
    pc2 = doc2["pieces"][k]
    sl = [x for x in pc2["slits"] if abs(((x["phi_deg"] - 130.0) + 180) % 360 - 180) < 10]
    assert sl and sl[0]["levels"] >= 3, pc2["slits"]
    names, W, alpha, rules, rep = sg.overlay(m2, doc2, arr2, chains2, merged2)
    used = [x["used"] for x in rep["pieces"][pc2["id"]]["slits"] if abs(((x["phi_deg"] - 130.0) + 180) % 360 - 180) < 10][0]
    assert used.startswith("cut"), used
    topo2 = sc.weld_topo(m2)
    rows = np.flatnonzero(np.asarray(arr2["piece"]) == k)
    phi = np.asarray(arr2["phi"])[rows]
    tt = np.nan_to_num(np.asarray(arr2["t"], float)[rows], nan=0.0)
    near = rows[(np.abs(((phi - 130.0) + 180) % 360 - 180) < 14.0) & (tt > 0.3) & (topo2.P[rows, 2] < sl[0]["z_top"])]
    assert near.size > 0
    cs = [[j for j, nm in enumerate(names) if nm.startswith(c["id"] + "_")] for c in chains2["chains"] if c["piece"] == pc2["id"]]
    for r in near:  # one chain only on each side of the gap
        assert sum(W[r, cc].sum() > 1e-9 for cc in cs) == 1, (r, phi[rows == r])


def test_G4_inner_layer_follows_outer_surface():
    """M2: inner rows (layered fixture) interpolate the outer surface (closest triangle) and follow it after finish; no inner
    edge seam; the interpolation is smoother than the old copy of one nearest row."""
    mesh, skel = fx.fixture("layered")
    doc, arr, chains, merged = _plan(mesh, skel)
    names, W, alpha, rules, rep, topo, setup, Wb, chk = _apply(mesh, skel, doc, arr, chains, merged)
    assert chk["ok"], chk
    assert chk["inner_follow_rows"] > 0 and chk["inner_follow_diff_max"] <= 1e-9
    assert chk["continuity"]["inner"]["seam_edges"] == 0
    imap = sg.inner_map(topo, arr)
    assert imap["rows"].size == chk["inner_rows"] and (imap["dist"] < 0.2).all()
    assert np.allclose(imap["bary"].sum(1), 1.0) and (imap["bary"] >= -1e-12).all()
    # barycentric point lies on the triangle and is the closest of the candidates
    X = (imap["bary"][:, :, None] * topo.P[imap["tri"]]).sum(1)
    assert np.allclose(np.linalg.norm(X - topo.P[imap["rows"]], axis=1), imap["dist"])
    # the old copy rule: jumps across inner-inner edges are not smaller than the interpolated ones
    oref = np.asarray(arr["outer_ref"])
    a, b = topo.edges[:, 0], topo.edges[:, 1]
    ie = (oref[a] >= 0) & (oref[b] >= 0)
    Wc = W.copy()
    inn = np.flatnonzero(oref >= 0)
    Wc[inn] = W[oref[inn]]
    j_new = 0.5 * np.abs(W[a] - W[b]).sum(1)[ie]
    j_old = 0.5 * np.abs(Wc[a] - Wc[b]).sum(1)[ie]
    assert j_new.max() <= j_old.max() + 1e-9 and j_new.mean() <= j_old.mean() + 1e-9


def test_G4_bleed_one_definition_layered():
    """M5: on G1's layered fixture the inner skirt rides on the outer one through outer_ref; the shared definition
    (skin_garment.bleed, used by check_overlay and metrics.garment_weights) gives 0, the old metrics rule (own piece) did not."""
    mesh, skel = fx.fixture("layered")
    doc, arr, chains, merged = _plan(mesh, skel)
    names, W, alpha, rules, rep, topo, setup, Wb, chk = _apply(mesh, skel, doc, arr, chains, merged)
    assert chk["garment_bleed_rows"] == 0
    ids = [p["id"] for p in doc["pieces"]]
    bp = {b["name"]: ids.index(c["piece"]) for c in chains["chains"] for b in c["bones"]}
    cols = setup.bones.names
    bl = sg.bleed(Wb, cols, arr["piece"], arr["outer_ref"], bp, skip=[k for k, p in enumerate(doc["pieces"]) if p["class"] == "tight"])
    assert bl["rows"] == 0
    piece = np.asarray(arr["piece"])
    old = np.zeros(len(Wb))
    for c, nm in enumerate(cols):
        k = bp.get(nm)
        if k is not None:
            other = (piece >= 0) & (piece != k)
            old[other] += Wb[other, c]
    assert int((old > 1e-4).sum()) > 0  # the review's 504-row false bleed on this fixture


def test_G4_strip_hem_ramp():
    """m8: strips blend bone n-1 into bone n down to the hem itself (no rigid plateau); other classes keep the plateau."""
    t = np.linspace(0, 1, 201)
    A = sg.along(t, 3, hem_ramp=True)
    assert np.allclose(A.sum(1), 1) and ((A > 0).sum(1) <= 2).all()
    assert (np.diff(A @ np.arange(4)) >= -1e-12).all()
    assert A[-1, 3] == 1.0 and (A[(t > 0.5) & (t < 1.0), 2] > 0).all()
    B = sg.along(t, 3)
    assert (B[t >= 5 / 6, 3] == 1.0).all()
    C = sg.along(t, 3, rigid_below=0.6, hem_ramp=True)  # a material split keeps its rigid panel
    assert np.allclose(C[t >= 0.6, 3], 1.0)


def test_G4_tails_fixture_strip_band_and_hem():
    """The G1 tails fixture through the new overlay: invariants, continuity, and strip hems not all rigid on the last bone."""
    mesh, skel = fx.fixture("tails")
    doc, arr, chains, merged = _plan(mesh, skel)
    names, W, alpha, rules, rep, topo, setup, Wb, chk = _apply(mesh, skel, doc, arr, chains, merged)
    assert chk["ok"], chk
    t = np.nan_to_num(np.asarray(arr["t"], float), nan=-1)
    for c in chains["chains"]:
        last = names.index(c["bones"][-1]["name"])
        k = [p["id"] for p in doc["pieces"]].index(c["piece"])
        hem = np.flatnonzero((np.asarray(arr["piece"]) == k) & (t >= 0.9) & (t < 0.999))
        if hem.size and len(c["bones"]) >= 2:
            assert (Wb[hem, last] < 1.0 - 1e-6).any(), c["id"]
