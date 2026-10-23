"""Owner G2: garment metrics of solvers.metrics (phase G, references/cloth-and-attachments.md §6) on synthetic meshes with known
answers - planted limb penetration through a garment piece (depth, contact below eps), layer penetration between two pieces, hem
stretch per piece with its lights, bleed rows and chain coverage from the weights - plus: no garments -> no garment keys; the
D01 bit-identity check against the baseline written before the change (E:\\tmp_rigkit\\G2\\baseline vs ...\\after; skipped when
missing) and the FL fixture numbers (E:\\tmp_rigkit\\G2\\fl, skipped when missing). rigkit-env:

    E:\\tools\\rigkit-env\\Scripts\\python.exe -I -B -m pytest scripts/tests/solvers/G2_garment_metrics_test.py -q -p no:cacheprovider
"""
import json
import os
import sys

import numpy as np
import pytest

from rigcore import npzio
from solvers import metrics as M

H = 0.5
G2 = r"E:\tmp_rigkit\G2"


def box(center, size, k=3):
    """Closed box with every face split into a k x k grid, outward triangles (duplicates on the box edges welded by save_mesh)."""
    c = np.asarray(center, float)
    s = np.asarray(size, float) / 2
    Vs, Fs, base = [], [], 0
    for axis in range(3):
        for sign in (-1, 1):
            u, v = [a for a in range(3) if a != axis]
            g = np.linspace(-1, 1, k + 1)
            for i in range(k + 1):
                for j in range(k + 1):
                    p = np.zeros(3)
                    p[axis], p[u], p[v] = sign, g[i], g[j]
                    Vs.append(p * s + c)
            for i in range(k):
                for j in range(k):
                    a = base + i * (k + 1) + j
                    Fs += [[a, a + k + 1, a + k + 2], [a, a + k + 2, a + 1]]
            base += (k + 1) ** 2
    V, F = np.array(Vs), np.array(Fs)
    for i, f in enumerate(F):
        if np.dot(np.cross(V[f[1]] - V[f[0]], V[f[2]] - V[f[0]]), V[f].mean(0) - c) < 0:
            F[i] = f[[0, 2, 1]]
    return V, F


def write_case(tmp, parts, poses, tags, garment_of_part, chains, hem=None):
    """``parts`` = [(V, F, bone)] (one bone per part, all weight 1 unless changed later); ``garment_of_part`` = piece index or -1
    per part. Writes mesh/poses/weights.npz, garments.npz, garments.json, chains.json. Returns (paths, mesh, part_of_vertex)."""
    V = np.concatenate([p[0] for p in parts])
    F, off = [], 0
    for p in parts:
        F.append(p[1] + off)
        off += len(p[0])
    F = np.concatenate(F)
    bones = [p[2] for p in parts]
    part = np.concatenate([np.full(len(p[0]), i) for i, p in enumerate(parts)])
    W = np.zeros((len(V), len(bones)), np.float32)
    W[np.arange(len(V)), part] = 1.0
    names = list(poses)
    P = np.stack([poses[k](V.copy()) for k in names]).astype(np.float32)
    npzio.save_mesh(os.path.join(tmp, "mesh.npz"), V, F, meta={"asset_id": "synthetic", "H": H})
    b = len(bones)
    heads = np.zeros((len(names), b, 3), np.float32)
    tails = heads.copy()
    tails[..., 2] = 0.1
    npzio.save_poses(os.path.join(tmp, "poses.npz"), names, P, bones, heads, tails,
                     meta={"tags": tags, "rest_index": 0}, extra={"parents": np.full(b, -1, np.int32), "deform": np.ones(b, bool)})
    npzio.save_weights(os.path.join(tmp, "weights.npz"), bones, W, meta={"candidate": "A"})
    mesh = npzio.load_mesh(os.path.join(tmp, "mesh.npz"))
    weld = np.asarray(mesh["weld"])
    nw = int(weld.max()) + 1
    piece = np.full(nw, -1, np.int32)
    piece[weld] = np.asarray(garment_of_part)[part]
    n_pieces = int(piece.max()) + 1
    np.savez_compressed(os.path.join(tmp, "garments.npz"), piece=piece, t=np.where(piece >= 0, 0.5, np.nan).astype(np.float32),
                        phi=np.full(nw, np.nan, np.float32), layer=np.where(piece >= 0, 0, -1).astype(np.int8),
                        outer_ref=np.full(nw, -1, np.int32), meta=np.array("{}"))
    pieces = [{"id": f"auto:{k}", "class": "strip", "confidence": 0.9, "hem_loop": (hem or {}).get(k, [])} for k in range(n_pieces)]
    npzio.write_json(os.path.join(tmp, "garments.json"), {"schema": 0, "pieces": pieces})
    npzio.write_json(os.path.join(tmp, "chains.json"), {"schema": 0, "chains": chains})
    return [os.path.join(tmp, f) for f in ("mesh.npz", "poses.npz", "weights.npz")], mesh, part


def run(tmp, paths, **kw):
    out = os.path.join(tmp, "out")
    M.run(*paths, out, garments=os.path.join(tmp, "garments.npz"), garments_json=os.path.join(tmp, "garments.json"),
          chains=os.path.join(tmp, "chains.json"), **kw)
    with open(os.path.join(out, "metrics.json"), "rb") as f:
        return json.loads(f.read().decode("utf-8"))


def chain(cid, piece, bone):
    return {"id": cid, "piece": piece, "bones": [{"name": bone}]}


def test_G2_piece_index():
    assert M.piece_index(3) == 3 and M.piece_index("auto:2") == 2 and M.piece_index("robe", ["x", "robe"]) == 1
    assert M.piece_index("nope", ["x"]) is None and M.piece_index(None) is None


def test_G2_limb_and_layer_penetration_planted(tmp_path):
    """Leg box (L_Thigh) with a cloth slab (piece 0) 1 mm in front and a second slab (piece 1) 1 mm in front of that one. Push the
    cloth 4 mm into the leg: limb penetration of piece 0, depth 4 mm (flood-filled, the body rule); 0.1 mm: a contact, nothing
    counted; push piece 1 4 mm into piece 0: layer penetration of both pieces, no limb penetration."""
    Vl, Fl = box((0, 0, 0), (0.1, 0.1, 0.2))
    Vc, Fc = box((0, -0.05 - 0.001 - 0.01, 0), (0.08, 0.02, 0.15))
    Vd, Fd = box((0, -0.05 - 0.001 - 0.02 - 0.001 - 0.01, 0), (0.06, 0.02, 0.12))
    n0, n1 = len(Vl), len(Vl) + len(Vc)

    def push_cloth(mm):
        def f(V):
            V[n0:] += (0, (1.0 + mm) / 1000.0, 0)
            return V
        return f

    def push_layer(V):
        V[n1:] += (0, (1.0 + 4.0) / 1000.0, 0)
        return V

    poses = {"rest": lambda V: V, "cloth_in_4mm": push_cloth(4.0), "cloth_in_0.1mm": push_cloth(0.1), "layer_in_4mm": push_layer}
    tags = {"rest": ["rest"], "cloth_in_4mm": ["standard"], "cloth_in_0.1mm": ["standard"], "layer_in_4mm": ["extreme"]}
    chains = [chain("tail_F", "auto:0", "tail_F_01"), chain("tail_F2", "auto:1", "tail_F2_01")]
    paths, _, _ = write_case(str(tmp_path), [(Vl, Fl, "L_Thigh"), (Vc, Fc, "tail_F_01"), (Vd, Fd, "tail_F2_01")], poses, tags,
                             [-1, 0, 1], chains)
    doc = run(str(tmp_path), paths)
    g = doc["summary"]["garments"]
    bp = g["by_pose"]
    assert bp["cloth_in_4mm"]["auto:0"]["limb_penetration"] > 0
    assert bp["cloth_in_4mm"]["auto:0"]["limb_depth"] == pytest.approx(0.004, abs=3e-5)
    assert bp["cloth_in_0.1mm"]["auto:0"]["limb_penetration"] == 0
    assert bp["rest"]["auto:0"]["limb_penetration"] == 0
    assert bp["layer_in_4mm"]["auto:0"]["layer_penetration"] > 0 and bp["layer_in_4mm"]["auto:1"]["layer_penetration"] > 0
    assert bp["layer_in_4mm"]["auto:1"]["layer_depth"] == pytest.approx(0.004, abs=3e-5)
    assert bp["layer_in_4mm"]["auto:0"]["limb_penetration"] == 0
    assert g["pieces"]["auto:0"]["limb_penetration_pose"] == "cloth_in_4mm"
    assert doc["lights"]["garment_limb_penetration"] == "red"
    assert doc["lights"]["garment_layer_penetration"] == "green"  # the layer push is an extreme pose: reported, not lit
    det = doc["summary"]["lights_detail"]["garment_layer_penetration"]["extreme"]
    assert det["pose"] == "layer_in_4mm" and det["value"] > 0


def test_G2_hem_stretch_known_ratios(tmp_path):
    """A cloth slab whose bottom ring (the hem: every vertex at the lowest z) is scaled in x by 1.03 / 1.07 / 1.2 about the slab
    centre: the hem ratio is the x scale of the bottom ring's edges, exactly; lights green / yellow / red."""
    V, F = box((0, 0, 0), (0.2, 0.02, 0.3), k=4)
    zmin = V[:, 2].min()

    def scale(k):
        def f(P):
            b = np.abs(P[:, 2] - zmin) < 1e-9
            P[b, 0] *= k
            return P
        return f

    for k, col in ((1.03, "green"), (1.07, "yellow"), (1.2, "red")):
        tmp = os.path.join(str(tmp_path), f"k{k:g}")
        os.makedirs(tmp)
        poses = {"rest": lambda P: P, "flare": scale(k)}
        paths, mesh, _ = write_case(tmp, [(V, F, "tail_F_01")], poses, {"rest": ["rest"], "flare": ["standard"]}, [0],
                                    [chain("tail_F", "auto:0", "tail_F_01")])
        weld = np.asarray(mesh["weld"])
        hem_w = sorted(set(weld[np.abs(V[:, 2] - zmin) < 1e-9].tolist()))
        gj = npzio.read_json(os.path.join(tmp, "garments.json"))
        gj["pieces"][0]["hem_loop"] = hem_w
        npzio.write_json(os.path.join(tmp, "garments.json"), gj)
        doc = run(tmp, paths, with_penetration=False)
        p = doc["summary"]["garments"]["pieces"]["auto:0"]
        # bottom-face edges along x scale by k; edges along y (slab thickness) do not: compute the reference from the mesh
        Vw = np.asarray(npzio.load_poses(paths[1])["P"][1], float)
        assert p["hem_stretch_max"] == pytest.approx(doc["summary"]["garments"]["by_pose"]["flare"]["auto:0"]["hem_stretch"])
        assert 1.0 < p["hem_stretch_max"] <= k + 1e-6
        assert doc["summary"]["garments"]["by_pose"]["rest"]["auto:0"]["hem_stretch"] == pytest.approx(1.0)
        assert p["hem_source"] == "garments.json hem_loop" and Vw.shape[0] == len(V)
        assert doc["lights"]["garment_hem_stretch"] == col, (k, p["hem_stretch_max"])


def test_G2_hem_stretch_exact_on_a_line_hem(tmp_path):
    """Hem = the 5 bottom vertices along x of one face of the slab (4 collinear edges): ratio = the x scale exactly."""
    V, F = box((0, 0, 0), (0.2, 0.02, 0.3), k=4)
    zmin, ymin = V[:, 2].min(), V[:, 1].min()
    line = (np.abs(V[:, 2] - zmin) < 1e-9) & (np.abs(V[:, 1] - ymin) < 1e-9)

    def f(P):
        P[np.abs(P[:, 2] - zmin) < 1e-9, 0] *= 1.25
        return P

    paths, mesh, _ = write_case(str(tmp_path), [(V, F, "tail_F_01")], {"rest": lambda P: P, "flare": f},
                                {"rest": ["rest"], "flare": ["standard"]}, [0], [chain("tail_F", "auto:0", "tail_F_01")])
    weld = np.asarray(mesh["weld"])
    gj = npzio.read_json(os.path.join(str(tmp_path), "garments.json"))
    gj["pieces"][0]["hem_loop"] = sorted(set(weld[line].tolist()))
    npzio.write_json(os.path.join(str(tmp_path), "garments.json"), gj)
    doc = run(str(tmp_path), paths, with_penetration=False)
    assert doc["summary"]["garments"]["pieces"]["auto:0"]["hem_edges"] == 4
    assert doc["summary"]["garments"]["pieces"]["auto:0"]["hem_stretch_max"] == pytest.approx(1.25, abs=1e-6)


def test_G2_bleed_rows_and_chain_coverage(tmp_path):
    """Two slabs (pieces 0, 1) with chain bones tail_F_01 / tail_B_01 and a body box. 3 rows of piece 0 carry 0.3 of tail_B_01
    (another piece's bone): bleed_rows = 3 (light red); a body row with 0.5 of tail_F_01 is not bleed (not a garment row).
    Coverage = welded rows where each chain bone dominates."""
    Vb, Fb = box((0, 0.3, 0), (0.1, 0.1, 0.1))
    Va, Fa = box((0, 0, 0), (0.1, 0.02, 0.2))
    Vc, Fc = box((0.3, 0, 0), (0.1, 0.02, 0.2))
    paths, mesh, part = write_case(str(tmp_path), [(Vb, Fb, "pelvis"), (Va, Fa, "tail_F_01"), (Vc, Fc, "tail_B_01")],
                                   {"rest": lambda P: P}, {"rest": ["rest", "standard"]}, [-1, 0, 1],
                                   [chain("tail_F", "auto:0", "tail_F_01"), chain("tail_B", "auto:1", "tail_B_01")])
    w = npzio.load_weights(paths[2])
    W = np.array(w["W"])
    weld = np.asarray(mesh["weld"])
    a_rows = np.nonzero(part == 1)[0]
    bleed_w = sorted(set(weld[a_rows].tolist()))[:3]
    for rw in bleed_w:
        v = np.nonzero(weld == rw)[0]
        W[v] = 0.0
        W[v, 1], W[v, 2] = 0.7, 0.3
    body_v = np.nonzero(part == 0)[0][0]
    W[weld == weld[body_v]] = 0.0
    W[weld == weld[body_v], 0], W[weld == weld[body_v], 1] = 0.5, 0.5
    npzio.save_weights(paths[2], w["bones"], W, meta={"candidate": "A"})
    doc = run(str(tmp_path), paths, with_penetration=False)
    g = doc["summary"]["garments"]
    assert g["bleed_rows"] == 3 and g["bleed_rows_by_piece"] == {"auto:0": 3, "auto:1": 0}
    assert doc["lights"]["garment_bleed"] == "red"
    nw_a = len(set(weld[part == 1].tolist()))
    nw_c = len(set(weld[part == 2].tolist()))
    # argmax ties (0.5 / 0.5 on the body row) go to the first column (pelvis)
    assert g["chain_coverage"] == {"tail_F_01": nw_a, "tail_B_01": nw_c}
    assert doc["lights"]["garment_chain_coverage"] == "green"


def test_G2_no_garments_no_garment_keys(tmp_path):
    V, F = box((0, 0, 0), (0.1, 0.1, 0.1))
    paths, _, _ = write_case(str(tmp_path), [(V, F, "pelvis")], {"rest": lambda P: P}, {"rest": ["rest"]}, [-1], [])
    out = os.path.join(str(tmp_path), "plain")
    M.run(*paths, out)
    with open(os.path.join(out, "metrics.json"), "rb") as f:
        doc = json.loads(f.read().decode("utf-8"))
    assert "garments" not in doc["summary"] and not any(k.startswith("garment_") for k in doc["lights"])
    assert "garments" not in doc["inputs"]


def _same_outputs(a, b):
    names = sorted(os.listdir(a))
    assert names == sorted(os.listdir(b))
    for nm in names:
        with open(os.path.join(a, nm), "rb") as fa, open(os.path.join(b, nm), "rb") as fb:
            if nm.endswith(".npz"):  # compressed zip members carry timestamps: compare the arrays bit for bit
                za, zb = np.load(os.path.join(a, nm)), np.load(os.path.join(b, nm))
                assert sorted(za.files) == sorted(zb.files), nm
                for k in za.files:
                    assert za[k].dtype == zb[k].dtype and np.array_equal(za[k], zb[k]), (nm, k)
            else:
                assert fa.read() == fb.read(), nm


D01_S_FINAL = r"E:\tmp_rigkit\I5\D01_S\_work\s7_final"


def test_G2_d01_metrics_bit_identical_rerun(tmp_path):
    """Review r1 m5 (G4): RE-RUN the current metrics.py on D01 S final (no garment options, about 70 s) and compare every output
    with the baseline G2 wrote before any phase G edit (E:\\tmp_rigkit\\G2\\baseline\\d01_s_final): byte-identical JSON, bit-identical
    arrays. The old test compared two stored folders and could not see a regression."""
    base = os.path.join(G2, "baseline", "d01_s_final")
    if not (os.path.exists(os.path.join(base, "metrics.json")) and os.path.isdir(D01_S_FINAL)):
        pytest.skip(f"needs the stored baseline {base} and the I5 inputs {D01_S_FINAL}")
    import subprocess

    out = str(tmp_path / "d01_s_final")
    # the CLI in its own process, as the baseline and the pipeline ran it (in-process, igl's winding numbers can differ in the last
    # bit: 1.0000000000000002 vs 1.0)
    script = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "solvers", "metrics.py")
    r = subprocess.run([sys.executable, "-I", "-B", script, "--mesh", os.path.join(D01_S_FINAL, "mesh.npz"), "--poses",
                        os.path.join(D01_S_FINAL, "poses.npz"), "--weights", os.path.join(D01_S_FINAL, "weights.npz"), "--out-dir", out],
                       capture_output=True, text=True, timeout=1800)
    assert r.returncode == 0, r.stderr[-2000:]
    _same_outputs(base, out)


@pytest.mark.parametrize("case", ["d01_legacy", "d01_s_final"])
def test_G2_d01_metrics_bit_identical_stored(case):
    """Artefact check only: the stored baseline / after folders of G2's run are identical (the re-run test above is the real
    regression test)."""
    a, b = os.path.join(G2, "baseline", case), os.path.join(G2, "after", case)
    if not (os.path.exists(os.path.join(a, "metrics.json")) and os.path.exists(os.path.join(b, "metrics.json"))):
        pytest.skip(f"run the baseline / after metrics into {a} and {b} first (see REPORT.md)")
    _same_outputs(a, b)


def test_G2_fl_fixture_garment_numbers():
    p = os.path.join(G2, "fl", "s7", "metrics", "metrics.json")
    if not os.path.exists(p):
        pytest.skip("run tests/rigkit/G2_run_fl_fixture.py first")
    with open(p, "rb") as f:
        doc = json.loads(f.read().decode("utf-8"))
    g = doc["summary"]["garments"]
    assert set(g["pieces"]) == {f"auto:{k}" for k in range(6)}
    assert set(g["chain_coverage"]) and all(isinstance(v, int) for v in g["chain_coverage"].values())
    assert {k for k in doc["lights"] if k.startswith("garment_")} == set(M.GARMENT_LIGHTS)
    # review r1 m5 (G4): the values of G2's fixture run (REPORT.md "FL fixture metrics"), not only the keys
    assert g["bleed_rows"] == 0 and doc["lights"]["garment_bleed"] == "green"
    assert min(g["chain_coverage"].values()) == 10 and doc["lights"]["garment_chain_coverage"] == "green"
    for pid in ("auto:0", "auto:1", "auto:2", "auto:3"):  # strips: hem rows ride on one bone in that fixture overlay
        assert abs(g["pieces"][pid]["hem_stretch_min"] - 1.0) < 1e-6 and abs(g["pieces"][pid]["hem_stretch_max"] - 1.0) < 1e-6
    assert g["pieces"]["auto:0"]["torn_edges"] == 40 and g["pieces"]["auto:3"]["torn_edges"] == 46
    assert g["pieces"]["auto:4"]["torn_edges"] == 0 and g["pieces"]["auto:4"]["layer_penetration"] == 220
    for lid in ("garment_limb_penetration", "garment_layer_penetration", "garment_torn_edges"):
        assert doc["lights"][lid] == "red", lid
