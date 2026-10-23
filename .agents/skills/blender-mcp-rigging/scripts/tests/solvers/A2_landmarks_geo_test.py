"""A2 tests: solvers.landmarks_geo - toolkit (sections, sphere fit, containment), the review-r1 rules on synthetic shapes (crotch,
ankle at the distal plateau end, kneecap knee, inside push, segment ratio), the review-r2/r3 interim rules on synthetic shapes (clavicle
segment from the spine/neck line - a corrected clavicle is LOW and consensus flags it -, boot edge + instep crease, the boot window
below a soft flare, head radius clamp and pivot-offset guard) and the source-a solver on D01
(regression guards against independent section measurements of the mesh and against G2 where G2 has no erratum), plus the D01
accuracy table with errata. Outputs go under pytest's tmp (``--basetemp`` chooses the folder).

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

from rigcore import landmarks as rlm, npzio  # noqa: E402
from solvers import glbmesh  # noqa: E402
from solvers import landmarks_geo as lg  # noqa: E402

REPO = os.path.normpath(os.path.join(HERE, *[".."] * 6))
D01 = os.path.join(REPO, "ashlar", "3d", "monsters", "D01_hodling", "D01_hodling.glb")
D01_LM = os.path.join(REPO, "ashlar", "3d", "monsters", "D01_hodling", "rig", "tools", "landmarks.json")


def _cylinder(r=0.1, h=1.0, n=64, m=10, cx=0.0, cy=0.0, z0=0.0, caps=False):
    th = np.linspace(0, 2 * np.pi, n, endpoint=False)
    zs = np.linspace(z0, z0 + h, m)
    V = [[cx + r * math.cos(t), cy + r * math.sin(t), z] for z in zs for t in th]
    F = []
    for j in range(m - 1):
        for i in range(n):
            a, b = j * n + i, j * n + (i + 1) % n
            c, d = a + n, b + n
            F += [[a, b, d], [a, d, c]]
    if caps:
        V += [[cx, cy, z0], [cx, cy, z0 + h]]
        c0, c1 = len(V) - 2, len(V) - 1
        for i in range(n):
            F += [[c0, (i + 1) % n, i], [c1, (m - 1) * n + i, (m - 1) * n + (i + 1) % n]]
    return np.array(V, dtype=float), np.array(F)


def _union(*parts):
    Vs, Fs, base = [], [], 0
    for V, F in parts:
        Vs.append(V)
        Fs.append(F + base)
        base += len(V)
    return np.concatenate(Vs), np.concatenate(Fs)


def test_section_of_cylinder():
    V, F = _cylinder()
    g = lg.MeshGeom(V, F)
    loops = g.section([0, 0, 0.47], [0, 0, 1])
    assert len(loops) == 1 and loops[0].closed
    assert loops[0].perimeter == pytest.approx(2 * math.pi * 0.1, rel=2e-3)
    assert np.allclose(loops[0].centroid, [0, 0, 0.47], atol=1e-9)
    assert loops[0].area == pytest.approx(math.pi * 0.01, rel=3e-3)
    assert lg.loop_contains(loops[0], [0.02, 0.0, 0.47]) and not lg.loop_contains(loops[0], [0.2, 0.0, 0.47])
    tn, tp = g.chord([0, 0, 0.5], [1, 0, 0])
    assert tn == pytest.approx(0.1, rel=2e-3) and tp == pytest.approx(0.1, rel=2e-3)


def test_fit_sphere():
    rng = np.random.default_rng(0)
    d = rng.normal(size=(200, 3))
    P = np.array([0.1, -0.2, 0.3]) + 0.05 * d / np.linalg.norm(d, axis=1, keepdims=True)
    c, r, rms = lg.fit_sphere(P)
    assert np.allclose(c, [0.1, -0.2, 0.3], atol=1e-9) and r == pytest.approx(0.05) and rms < 1e-9


def test_crotch_is_the_lowest_loop_holding_both_leg_axes():
    """Two legs (r 0.05 at x +-0.1, up to 0.55) entering a torso cylinder (r 0.25) whose bottom is at z 0.5: crotch = 0.5."""
    legL = _cylinder(0.05, 0.55, 48, 23, cx=0.1, caps=True)
    legR = _cylinder(0.05, 0.55, 48, 23, cx=-0.1, caps=True)
    torso = _cylinder(0.25, 0.5, 64, 11, z0=0.5, caps=True)
    V, F = _union(legL, legR, torso)
    g = lg.MeshGeom(V, F)
    feet = lg.find_feet(g, 1.0)
    assert "L" in feet and "R" in feet
    legs = lg.leg_tracks(g, 1.0, feet)
    assert legs["crotch_found"] and legs["merge_z"] == pytest.approx(0.5, abs=2e-3)
    assert all(s.centroid[2] < 0.5 for s in legs["L"] + legs["R"])  # tracks cut below the crotch


def test_ankle_is_the_lower_end_of_the_plateau():
    """Perimeter profile: foot (large) -> plateau minimum 0.10 at z 0.10-0.14 -> calf; the ankle is where the perimeter first exceeds
    1.10 x the minimum below the plateau (0.11 at z = 0.095), not the minimum."""
    z = np.round(np.arange(0.02, 0.40, 0.005), 6)
    per = np.where(z < 0.095, 0.10 + 2.0 * (0.095 - z), np.where(z <= 0.14, 0.10 + 0.0005 * (z - 0.12) ** 2, 0.10 + 0.4 * (z - 0.14)))
    an = lg._ankle({"z": z, "per": per}, 1.0, 0.8)
    assert an["foot_flare"] and an["z"] == pytest.approx(0.090, abs=1e-3)  # per(z) = 0.11 at z = 0.09
    assert an["z_min"] > an["z"] and an["plateau"][0] < an["plateau"][1]


def test_knee_at_the_kneecap_lower_pole():
    z = np.round(np.arange(0.10, 0.50, 0.0025), 6)
    front = -0.05 - 0.004 * np.exp(-((z - 0.29) / 0.01) ** 2)  # a 4 mm forward bump (kneecap) at z 0.29
    pr = {"z": z, "per": np.full(len(z), 0.3), "front": front, "back": front + 0.1, "cx": np.zeros(len(z)), "cy": np.zeros(len(z))}
    kn = lg._knee(pr, 1.0, 0.05, 0.50)
    assert kn["rule"] == "kneecap" and kn["kneecap_z"] == pytest.approx(0.29, abs=2e-3)
    assert kn["z"] == pytest.approx(0.29 - lg.KNEE_BELOW_CAP_H, abs=2e-3)
    flat = dict(pr, front=np.full(len(z), -0.05))
    assert lg._knee(flat, 1.0, 0.05, 0.50)["rule"] in ("bend", "valley")


def test_push_inside_and_segment_ratio():
    V, F = _cylinder(0.1, 1.0, 48, 11, caps=True)
    g = lg.MeshGeom(V, F)
    lms = {"pelvis": lg._lm((0.0, 0.0, -0.002), 0.6, "test"), "chest": lg._lm((0.0, 0.0, -0.2), 0.6, "test"),
           "neck": lg._lm((0.0, 0.0, 0.5), 0.5, "test")}
    lg.push_inside(g, 1.0, lms, ["pelvis", "chest", "neck"])
    assert g.winding(np.array([lms["pelvis"]["pos"]]))[0] > 0.5 and lms["pelvis"]["pos"][2] == pytest.approx(lg.INSIDE_MARGIN_H, abs=1e-6)
    assert lms["pelvis"]["confidence"] == pytest.approx(0.54) and "pushed" in lms["pelvis"]["method"]
    assert lms["chest"]["confidence"] == lg.LOW_CONF  # 20 cm outside: not pushed
    assert lms["neck"]["diag"]["winding"] > 0.5
    assert lg.segment_ratio((0, 0, 0), (1, 0, 0), (3, 0, 0)) == pytest.approx(0.5)


def test_clavicle_segment_from_the_spine_neck_line():
    """Review r2 N2: at the clavicle's final height the segment from the spine/neck line must cross no surface. Torso cylinder
    (r 0.15, z 0-0.5: the closed chest loop) with a thin neck (r 0.02, z 0.45-0.8); chest z 0.40, neck z 0.60 put the clavicle at
    z 0.55 in the neck, and the half-width rule (0.17 x 0.15 = 25.5 mm) with the notch depth puts it outside the neck: moved back
    inside. Review r3 F3: the corrected clavicle is LOW whatever the move (here 2 % H, below 0.03 H), so that consensus - where
    source a is the clavicle's only position source - flags it for the vision check instead of accepting it."""
    from solvers import consensus as cs

    torso = _cylinder(0.15, 0.5, 64, 11, caps=True)
    g = lg.MeshGeom(*_union(torso, _cylinder(0.02, 0.35, 32, 8, z0=0.45, caps=True)))
    sh = {"L": np.array([0.3, 0.0, 0.45]), "R": np.array([-0.3, 0.0, 0.45])}
    # (0.401, 0.603): the ray test finds the crossing; (0.40, 0.60): z 0.55 lies on a vertex ring, the ray grazes edges and the
    # winding-number fallback finds the exit
    for zc, zn in ((0.401, 0.603), (0.40, 0.60)):
        out = lg._clavicles(g, 1.0, 0.0, (0, 0, zc), (0, 0, zn), sh, 0.3)
        zf = zc + lg.CLAV_Z_FRAC * (zn - zc)
        for s in ("L", "R"):
            c = out[f"clavicle_{s}"]
            seg = c["diag"]["segment"]
            assert seg["line_inside"] and seg["ok"] is False and seg["crossings_m"] and 0.01 < seg["moved_m"] < 0.03, (zc, s)
            assert c["confidence"] == pytest.approx(lg.LOW_CONF) and "crossed a surface" in c["method"] and "[LOW:" in c["method"]
            p = np.array(c["pos"])
            assert g.winding(p[None])[0] > 0.5 and np.linalg.norm(p[:2]) < 0.02 and p[2] == pytest.approx(zf)  # back inside the neck
            assert lg.segment_crossings(g, np.array([0.0, 0.0, zf]), p).size == 0
            assert c["diag"]["x_from"] == "chest_loop" and c["diag"]["chest_half_width"] == pytest.approx(0.15, abs=2e-3)
        # consensus: a is LOW, UniRig is sanity-only on clavicles -> flagged for the vision check, not accepted
        a = {k: {"pos": v["pos"], "confidence": v["confidence"], "method": v["method"]} for k, v in out.items()}
        d = {k: {"pos": (v["pos"][0], v["pos"][1], v["pos"][2] + 0.02), "confidence": 1.0, "method": "unirig"} for k, v in out.items()}
        f, rep = cs.fuse({"a": a, "d": d}, 1.0, {"landmarks": {}})
        for s in ("L", "R"):
            k = f[f"clavicle_{s}"]
            assert k["flagged"] and k["kind"] == "no_plausible" and k["gates"]["a"]["method"].startswith("fail"), (zc, s)
            assert k["gates"]["d"]["role"].startswith("sanity"), (zc, s)
        assert [t["key"] for t in rep["tiles"]] == ["clavicle"] and rep["n_tiles"] == 1
    g = lg.MeshGeom(*_union(torso, _cylinder(0.06, 0.35, 32, 8, z0=0.45, caps=True)))  # a neck thick enough holds it
    c = lg._clavicles(g, 1.0, 0.0, (0, 0, 0.40), (0, 0, 0.60), {"L": sh["L"]}, 0.3)["clavicle_L"]
    assert c["diag"]["segment"]["ok"] is True and c["confidence"] == pytest.approx(0.5)
    assert c["pos"][0] == pytest.approx(lg.CLAV_HALF_WIDTH_FRAC * 0.15, abs=2e-3)  # x from the chest-loop half-width, not the shoulder


def _prism(poly_yz, x0=-0.04, x1=0.04):
    """Side faces of the polygon [(y, z), ...] extruded along x (open at both ends): its x = 0 section is the polygon."""
    n = len(poly_yz)
    V = [[x, y, z] for x in (x0, x1) for (y, z) in poly_yz]
    F = []
    for i in range(n):
        j = (i + 1) % n
        F += [[i, j, n + j], [i, n + j, n + i]]
    return np.array(V, dtype=float), np.array(F)


def test_boot_edges_and_instep_crease():
    """Review r2 (c): boot edges are perimeter steps > BOOT_EDGE_STEP overlapping the ankle window; the instep crease is the most
    concave point of the front profile of the sagittal foot section between the ball (forward position) and the cuff. Boot side profile
    (foot axis +Y): toe cap to y 0.20, instep from (0.20, 0.03) to the corner (0.05, 0.10), shin front y 0.05 up to 0.30."""
    z = np.round(np.arange(0.02, 0.30, 0.0025), 6)
    per = np.where(z < 0.0925, 0.268, 0.237 + 0.1 * (z - 0.0925))  # FL-like collar: 13 % step at 0.09-0.0925
    per = np.where(z >= 0.11, per * 1.06, per)  # a 6 % step inside the window (D01's bare ankle changes <= 6 %): not an edge
    edges = lg._boot_edges({"z": z, "per": per}, 0.0906, 0.12)
    assert len(edges) == 1 and edges[0]["z"] == pytest.approx(0.09125) and edges[0]["ratio"] == pytest.approx(0.237 / 0.268, abs=1e-3)
    assert lg._boot_edges({"z": z, "per": per}, 0.10, 0.12) == []  # the window starts above the step
    g = lg.MeshGeom(*_prism([(-0.05, 0.0), (0.20, 0.0), (0.20, 0.03), (0.05, 0.10), (0.05, 0.30), (-0.05, 0.30)]))
    zc, info = lg._instep_crease(g, (0.0, 0.0, 0.2), (0.0, 1.0, 0.0), 0.024, 0.25, 0.125, 0.21, 0.0025)
    assert zc == pytest.approx(0.10, abs=0.0025) and info["front_m"] == pytest.approx(0.05, abs=0.006)
    assert info["chord"][0][0] == pytest.approx(0.125) and info["chord"][0][1] == pytest.approx(0.065, abs=1e-3)  # starts at the ball
    g = lg.MeshGeom(*_prism([(-0.05, 0.0), (0.20, 0.0), (0.05, 0.30), (-0.05, 0.30)]))  # straight instep to the shin: no crease
    zc, info = lg._instep_crease(g, (0.0, 0.0, 0.2), (0.0, 1.0, 0.0), 0.024, 0.25, 0.125, 0.21, 0.0025)
    assert zc is None and "not concave" in info["why"]


def _boot_leg(step_z):
    """Boot side profile of ``test_boot_edges_and_instep_crease`` (instep corner at z 0.10, ball at y 0.125) with a U01-like leg
    profile: a soft flare (plateau end) at z 0.12 made by wraps, perimeter 0.305 above the foot junction and 0.37 below ``step_z``
    (a x0.82 step), shrinking softly (< 1 % per section) above the flare. Returns (geom, lms, info) for ``_boot_ankle``."""
    g = lg.MeshGeom(*_prism([(-0.05, 0.0), (0.20, 0.0), (0.20, 0.03), (0.05, 0.10), (0.05, 0.30), (-0.05, 0.30)]))
    z = np.round(np.arange(0.02, 0.30, 0.0025), 6)
    per = np.where(z < step_z, 0.37, np.where(z < 0.12, 0.305, np.maximum(0.305 - 0.2 * (z - 0.12), 0.26)))
    n = len(z)
    pr = {"z": z, "per": per, "cx": np.zeros(n), "cy": np.zeros(n), "front": np.full(n, 0.05), "back": np.full(n, -0.05)}
    an = {"z": 0.12, "z_min": 0.2, "per_min": 0.26, "plateau": [0.12, 0.25], "foot_flare": True}
    lms = {"ankle_L": lg._lm((0.0, 0.0, 0.12), 0.8, "plateau end"), "toe_tip_L": lg._lm((0.0, 0.20, 0.015), 0.75, "toe"),
           "heel_ground_L": lg._lm((0.0, -0.05, 0.0), 0.75, "heel"), "ball_L": lg._lm((0.0, 0.125, 0.024), 0.6, "ball")}
    return g, lms, {"ankle_fit": an, "profile": pr}


def test_boot_window_and_foot_junction_below_a_soft_flare():
    """Review r3 Q2: the boot trigger window is [max(ball + 0.02 H, flare - 0.03 H), flare + 0.03 H] - wraps can make a soft false
    flare above the real foot junction (U01: 367 -> 305 mm at z 0.117-0.121, "flare" at 0.159). A step below the flare searches the
    instep crease between the ball and the flare, so that the run includes the leg front above the junction."""
    assert lg._boot_window(0.12, 0.024, 1.0) == pytest.approx((0.09, 0.15))
    assert lg._boot_window(0.05, 0.024, 1.0) == pytest.approx((0.044, 0.08))  # the ball clearance bounds it below
    assert lg._boot_window(0.159, 0.041, 1.71) == pytest.approx((0.159 - 0.0513, 0.159 + 0.0513))  # U01
    g, lms, info = _boot_leg(0.0985)  # junction step between z 0.0975 and 0.10, inside the window, below the flare
    lg._boot_ankle(g, 1.0, "L", lms, info)
    an = lms["ankle_L"]
    b = an["diag"]["boot"]
    assert b["triggered"] and len(b["edges"]) == 1 and b["edges"][0]["ratio"] == pytest.approx(0.305 / 0.37, abs=1e-3)
    assert b["window"] == pytest.approx([0.09, 0.15]) and b["below_flare"] is True and b["z_search_top"] == pytest.approx(0.12)
    assert an["interim_rule"] == "boot_ankle" and an["interim_note"] == "foot junction below a soft flare"
    assert an["confidence"] == pytest.approx(lg.BOOT_ANKLE_CONF) and "foot junction below a soft flare" in an["method"]
    assert an["pos"][2] == pytest.approx(0.10, abs=0.0025) and np.allclose(an["pos"][:2], 0.0)  # the instep corner, on the leg axis
    assert an["diag"]["plateau_end_ankle"] == pytest.approx([0.0, 0.0, 0.12])
    g, lms, info = _boot_leg(0.0835)  # the same step 0.035 H below the flare: outside the window, no trigger
    lg._boot_ankle(g, 1.0, "L", lms, info)
    assert lms["ankle_L"]["diag"]["boot"]["triggered"] is False and "interim_rule" not in lms["ankle_L"]
    assert lms["ankle_L"]["pos"] == pytest.approx((0.0, 0.0, 0.12)) and lms["ankle_L"]["confidence"] == pytest.approx(0.8)


def _sphere(r, c, nu=32, nv=16):
    V = [[c[0], c[1], c[2] + r]]
    for i in range(1, nv):
        th = math.pi * i / nv
        V += [[c[0] + r * math.sin(th) * math.cos(2 * math.pi * j / nu), c[1] + r * math.sin(th) * math.sin(2 * math.pi * j / nu),
               c[2] + r * math.cos(th)] for j in range(nu)]
    V.append([c[0], c[1], c[2] - r])
    F = [[0, 1 + j, 1 + (j + 1) % nu] for j in range(nu)]
    for i in range(nv - 2):
        for j in range(nu):
            a, b = 1 + i * nu + j, 1 + i * nu + (j + 1) % nu
            F += [[a, a + nu, b + nu], [a, b + nu, b]]
    last, base = len(V) - 1, 1 + (nv - 2) * nu
    F += [[base + j, last, base + (j + 1) % nu] for j in range(nu)]
    return np.array(V, dtype=float), np.array(F)


def test_head_radius_clamp_and_pivot_offset_guard(monkeypatch):
    """Review r2 (d): head offsets use the measured head radius clamped to 0.6-1.5 x the starting radius (family H: 0.065 H); a pivot
    offset outside 0.01-0.04 H lowers the confidence (no ears on a sphere: offset = |(0.18, 0.55)| R = 0.58 R)."""
    g = lg.MeshGeom(*_sphere(0.1, (0.0, 0.0, 0.9)))
    isl = np.zeros(len(g.V), dtype=np.int64)
    r0 = lg.HEAD_RADIUS_H["H"]
    for R_meas, R_used, low in ((0.30, 1.5 * r0, True), (0.01, 0.6 * r0, False), (0.06, 0.06, False)):
        monkeypatch.setattr(lg, "head_mass", lambda geom, H, top, r0, R=R_meas: (np.array([0.0, 0.0, 0.9]), R, {"passes": []}))
        h = lg._head(g, 1.0, 0.0, 0.8, isl, "H")[0]["head"]
        assert h["diag"]["head_radius"] == pytest.approx(R_used) and h["diag"]["head_radius_measured"] == pytest.approx(R_meas)
        assert h["diag"]["radius_clamped"] == (R_used != R_meas)
        assert h["diag"]["pivot_offset_H"] == pytest.approx(math.hypot(*lg.HEAD_PIVOT_FROM_MASS) * R_used, abs=2e-6)  # diag: 6 decimals
        assert (h["confidence"] <= lg.HEAD_OFFSET_CONF + 1e-12) == low and (not low or "pivot offset" in h["method"]), R_meas


@pytest.fixture(scope="module")
def d01_a():
    if not (os.path.isfile(D01) and os.path.isfile(D01_LM)):
        pytest.skip("D01 not found")
    mesh = glbmesh.glb_to_mesh(D01, "D01_hodling", 0.5)
    return lg.solve(mesh, "S"), rlm.from_d01_landmarks(D01_LM), lg.MeshGeom(mesh["V"], mesh["F"], mesh["weld"])


def _err(res, g2, lid):
    return float(np.linalg.norm(np.array(res["landmarks"][lid]["pos"]) - np.array(g2[lid])))


def test_d01_all_landmarks_present_and_inside(d01_a):
    res, _, geom = d01_a
    assert res["missing"] == [] and len(res["landmarks"]) == 35
    for e in res["landmarks"].values():
        assert 0.0 < e["confidence"] <= 1.0 and e["method"]
    core = [k for k in res["landmarks"] if (k[:-2] if k.endswith(("_L", "_R")) else k) in lg.CORE]
    W = geom.winding(np.array([res["landmarks"][k]["pos"] for k in core]))
    assert (W > 0.5).all(), [k for k, w in zip(core, W) if w <= 0.5]  # review r1 finding 6: the pelvis was outside
    assert abs(res["frame"]["x_mid"]) < 1e-3 and res["frame"]["x_mid_source"] == "hand-tip mid-x"  # finding 8


def test_d01_matches_independent_section_measurements(d01_a):
    """Review r1 section measurements of the D01 mesh (E:\\tmp_rigkit\\review_a2_r1): crotch z 0.182-0.185, ankle plateau 0.050-0.056 with
    the foot flaring below it, hand flare from |x| 0.242-0.244, elbow knob |x| 0.150-0.155 (valley 0.146-0.148), armpit fillet corner
    z 0.313-0.316. Guards with a few mm of slack; they are mesh features, not G2 values."""
    res, _, _ = d01_a
    L = res["landmarks"]
    assert 0.180 <= res["frame"]["merge_z"] <= 0.186  # finding 16
    for s, sg in (("L", 1), ("R", -1)):
        assert 0.240 <= sg * L[f"wrist_{s}"]["pos"][0] <= 0.247  # finding 10: distal plateau end, not the minimum
        assert 0.146 <= sg * L[f"elbow_{s}"]["pos"][0] <= 0.160
        assert 0.046 <= L[f"ankle_{s}"]["pos"][2] <= 0.052  # finding 10
        assert L[f"ankle_{s}"]["diag"]["boot"]["triggered"] is False and "interim_rule" not in L[f"ankle_{s}"]  # bare feet: no boot rule
        assert "sphere" in L[f"shoulder_{s}"]["diag"]  # finding 11: the fit or its rejection reasons are logged
    corners = L["chest"]["diag"]["corners"]
    assert all(0.305 <= c["z"] <= 0.318 for c in corners.values() if c.get("found"))  # finding 5


def test_d01_head_neck_clavicle(d01_a):
    """Findings 1 and 4: head pivot from the head's own geometry (ears found on D01), neck on the chest -> head line, clavicle heads
    behind the sternal notch and inside the torso (round 1 put them in the jaw, y = -0.078)."""
    res, g2, geom = d01_a
    L = res["landmarks"]
    assert "ear base from bilateral ear protrusions" in L["head"]["method"]
    assert _err(res, g2, "head") <= 0.010 and _err(res, g2, "neck") <= 0.010  # 2 % H (G2 has no erratum here)
    chest = np.array(L["chest"]["pos"])
    lp = lg.torso_loop(geom, chest[2], chest[0])
    for s in ("L", "R"):
        c = np.array(L[f"clavicle_{s}"]["pos"])
        assert c[1] > -0.03 and lg.loop_contains(lp, np.array([c[0], c[1], chest[2]])) and geom.winding(c[None])[0] > 0.5
        dg = L[f"clavicle_{s}"]["diag"]
        assert dg["x_from"] == "chest_loop" and dg["segment"]["ok"] is True  # review r2 N2/N3
    hd = L["head"]["diag"]
    assert not hd["radius_clamped"] and 0.01 <= hd["pivot_offset_H"] <= 0.04  # review r2 (d): D01 inside the guards


def test_d01_legs_match_g2(d01_a):
    """Tier-2 regression on the fixed-anatomy leg joints (G2 has no erratum there): within 1 % H (5 mm)."""
    res, g2, _ = d01_a
    for lid in ("hip_L", "hip_R", "knee_L", "knee_R", "ankle_L", "ankle_R", "heel_ground_L", "heel_ground_R", "ball_L", "ball_R"):
        assert _err(res, g2, lid) <= 0.005, (lid, _err(res, g2, lid))
    assert "kneecap" in res["landmarks"]["knee_L"]["method"]
    assert _err(res, g2, "pelvis") <= 0.010


def test_d01_accuracy_table_with_errata(tmp_path):
    """Acceptance output: the A2 pipeline for D01 (needs E:\\tmp_unirig\\out\\D01_hodling) -> accuracy table raw + errata-aware, errata
    file next to it (G2 errors + the spine-depth convention of spine_02 and chest, review r2 (e)), head_top excluded."""
    import A2_pipeline as pipe

    if not os.path.isfile(os.path.join(r"E:\tmp_unirig\out\D01_hodling", "D01_hodling_rigged.glb")):
        pytest.skip("UniRig output for D01 missing")
    out = str(tmp_path / "pipeline")
    pipe.run_asset("D01_hodling", pipe.ASSETS["D01_hodling"], out)
    doc = pipe.d01_accuracy(out)
    base = os.path.join(out, "D01_hodling")
    assert os.path.isfile(os.path.join(base, "D01_errata.json")) and os.path.isfile(os.path.join(base, "accuracy_vs_g2.md"))
    errata = npzio.read_json(os.path.join(base, "D01_errata.json"))["errata"]
    assert {"wrist_L", "wrist_R", "elbow_L", "elbow_R", "head_top", "spine_02", "chest"} <= set(errata)
    assert errata["spine_02"]["kind"] == errata["chest"]["kind"] == "convention"
    rows = {r["id"]: r for r in doc["rows"]}
    assert "head_top" not in rows and len(rows) == 32
    c = doc["counts"]["consensus"]
    assert c["errata_aware"]["n"] == 26 and c["raw"]["n"] == 32 and c["core_errata_aware"]["n"] == 14
    for lid in ("hip_L", "hip_R", "knee_L", "knee_R", "ankle_L", "ankle_R"):
        assert rows[lid]["consensus"]["err_pct_H"] <= 1.0
    assert c["core_errata_aware"]["within_tier2"] >= 14  # round 2: 14 within (14/16 with spine_02, chest counted)
    assert c["raw"]["within_tier2"] >= 24 and c["core_raw"]["within_tier2"] >= 14  # not worse than round 2 on the raw score
    assert isinstance(doc["flags"]["ready_for_user"], bool) and doc["flags"]["n_tiles"] == len(doc["flags"]["tiles"])
    lm = npzio.read_json(os.path.join(base, "landmarks.json"))
    assert lm["family"] == "S" and all("decision" in e and "gates" in e for e in lm["landmarks"].values())
