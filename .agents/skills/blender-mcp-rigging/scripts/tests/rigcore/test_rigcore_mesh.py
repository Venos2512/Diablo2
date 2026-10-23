"""rigcore.mesh: weld_map (synthetic + real D01 GLB), welded_faces, unique_edges, adjacency_csr, connected_components, seam_groups."""
import json
import os

import numpy as np
import pytest

from rigcore import mesh


# --------------------------------------------------------------------------------------------------------------------------
# connected_components vs a plain union-find reference
# --------------------------------------------------------------------------------------------------------------------------

def _uf_labels(n, edges):
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for a, b in edges:
        ra, rb = find(int(a)), find(int(b))
        if ra != rb:
            parent[max(ra, rb)] = min(ra, rb)
    roots = [find(i) for i in range(n)]
    ids, out = {}, []
    for r in roots:
        out.append(ids.setdefault(r, len(ids)))  # first-occurrence order
    return len(ids), np.array(out, dtype=np.int32)


@pytest.mark.parametrize("n, m, seed", [(1, 0, 0), (10, 4, 1), (200, 150, 2), (2000, 1500, 3), (5000, 9000, 4), (3000, 2999, 5)])
def test_connected_components_matches_union_find(n, m, seed):
    rng = np.random.default_rng(seed)
    edges = rng.integers(0, n, size=(m, 2))
    k, lab = mesh.connected_components(n, edges)
    k_ref, lab_ref = _uf_labels(n, edges)
    assert k == k_ref
    np.testing.assert_array_equal(lab, lab_ref)
    assert lab.dtype == np.int32


def test_connected_components_edge_cases():
    assert mesh.connected_components(0, np.zeros((0, 2), int))[0] == 0
    k, lab = mesh.connected_components(5, np.zeros((0, 2), int))
    assert k == 5 and lab.tolist() == [0, 1, 2, 3, 4]
    path = np.stack([np.arange(999), np.arange(1, 1000)], 1)[::-1]  # a long path given in reverse order
    k, lab = mesh.connected_components(1000, path)
    assert k == 1 and (lab == 0).all()
    star = np.stack([np.zeros(99, int), np.arange(1, 100)], 1)
    assert mesh.connected_components(100, star)[0] == 1
    k, lab = mesh.connected_components(6, [[3, 3], [4, 5], [5, 4]])  # self loops and duplicates
    assert k == 5 and lab.tolist() == [0, 1, 2, 3, 4, 4]
    with pytest.raises(ValueError, match="outside"):
        mesh.connected_components(3, [[0, 3]])


# --------------------------------------------------------------------------------------------------------------------------
# weld_map: synthetic
# --------------------------------------------------------------------------------------------------------------------------

def test_weld_map_basic_and_order():
    V = np.array([[0, 0, 0], [1, 1, 1], [0, 0, 0], [0.5, 0.5, 0.5], [1, 1, 1], [0.5, 0.5, 0.5 + 1e-9], [2, 0, 0]], float)
    w = mesh.weld_map(V)
    assert w.dtype == np.int32
    assert w.tolist() == [0, 1, 0, 2, 1, 2, 3]  # ids in first-occurrence order
    assert mesh.weld_map(np.zeros((0, 3))).shape == (0,)
    assert mesh.weld_map(np.ones((1, 3))).tolist() == [0]
    assert mesh.weld_map(np.ones((4, 3))).tolist() == [0, 0, 0, 0]  # zero-size bounding box
    with pytest.raises(ValueError, match="shape"):
        mesh.weld_map(np.zeros((4, 2)))
    with pytest.raises(ValueError, match="NaN"):
        mesh.weld_map(np.array([[0, 0, np.nan], [1, 1, 1]]))


def test_weld_map_exact_mode():
    V = np.array([[0.0, 0, 0], [-0.0, 0, 0], [1e-9, 0, 0], [1, 1, 1]])
    assert mesh.weld_map(V, tol_rel=0).tolist() == [0, 0, 1, 2]  # -0.0 == 0.0; 1e-9 apart stays separate
    assert mesh.weld_map(V, tol_rel=1e-6).tolist() == [0, 0, 0, 1]


def test_weld_map_tolerance_is_relative_to_bbox_diagonal():
    V = np.array([[0, 0, 0], [10, 0, 0], [0, 0.4e-5, 0], [0, 3e-5, 0]], float)  # diagonal 10 -> r = 1e-5
    w = mesh.weld_map(V, tol_rel=1e-6)
    assert w[0] == w[2] and w[0] != w[3]
    V2 = V / 1000.0  # same shape scaled: same answer
    assert mesh.weld_map(V2, tol_rel=1e-6).tolist() == w.tolist()


def test_weld_map_grid_boundaries_never_split_close_points():
    """Pairs closer than r on every axis must merge even when they straddle cell boundaries of the plain or the half-shifted grids,
    in any combination of axes."""
    tol = 1e-3
    base_pts = [np.zeros(3), np.ones(3)]  # fixes vmin = 0 and diag = sqrt(3)
    r = tol * np.sqrt(3.0)
    s = 2 * r
    V = list(base_pts)
    pairs = []
    i = 0
    # coordinates at a whole boundary (k s) and at a half boundary ((k + 0.5) s), each axis independently; every pair gets its own
    # far-away cell triple (20 s apart) so that different pairs cannot merge
    for bx in (10.0, 10.5):
        for by in (7.0, 7.5):
            for bz in (13.0, 13.5):
                for sign in (np.array([1, 1, 1]), np.array([1, -1, 1]), np.array([-1, 1, -1])):
                    c = np.array([bx + 20 * (i % 4), by + 20 * ((i // 4) % 3), bz + 20 * (i // 12)]) * s
                    d = 0.45 * r
                    pairs.append((len(V), len(V) + 1))
                    V.extend([c - sign * d, c + sign * d])  # Chebyshev distance 0.9 r
                    i += 1
    V = np.array(V)
    w = mesh.weld_map(V, tol_rel=tol)
    for a, b in pairs:
        assert w[a] == w[b], (a, b, V[a], V[b])
    assert w.max() + 1 == 2 + len(pairs)  # nothing else merged


def test_weld_map_random_cloud_matches_brute_force_requirements():
    rng = np.random.default_rng(11)
    base = rng.random((400, 3))
    tol = 1e-4
    r = tol * np.linalg.norm(base.max(0) - base.min(0))
    jit = (rng.random((400, 3)) * 2 - 1) * 0.9 * r  # every axis within 0.9 r
    V = np.concatenate([base, base + jit])
    w = mesh.weld_map(V, tol_rel=tol)
    # required: all Chebyshev-close pairs share an id (brute force on this size)
    d = np.abs(V[:, None, :] - V[None, :, :]).max(axis=2)
    ii, jj = np.nonzero(d <= r)
    assert (w[ii] == w[jj]).all()
    # base points are > 10 r apart (checked), so the result must be exactly the 400 originals
    dd = np.linalg.norm(base[:, None] - base[None], axis=2) + np.eye(400)
    assert dd.min() > 10 * r
    assert w.max() + 1 == 400
    assert (w[:400] == np.arange(400)).all() and (w[400:] == np.arange(400)).all()


# --------------------------------------------------------------------------------------------------------------------------
# topology helpers
# --------------------------------------------------------------------------------------------------------------------------

def test_welded_faces_unique_edges_adjacency():
    # two quads sharing an edge, vertices duplicated along the seam (4, 5 duplicate 1, 2)
    V = np.array([[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [1, 0, 0], [1, 1, 0], [2, 0, 0], [2, 1, 0]], float)
    F = np.array([[0, 1, 2], [0, 2, 3], [4, 6, 7], [4, 7, 5]])
    w = mesh.weld_map(V)
    assert w.tolist() == [0, 1, 2, 3, 1, 2, 4, 5]
    Fw = mesh.welded_faces(F, w)
    assert Fw.dtype == np.int32 and Fw.tolist() == [[0, 1, 2], [0, 2, 3], [1, 4, 5], [1, 5, 2]]
    E, cnt = mesh.unique_edges(Fw, return_counts=True)
    assert E.dtype == np.int32 and (E[:, 0] < E[:, 1]).all()
    assert len(E) == 9 and cnt.max() == 2 and int((cnt == 2).sum()) == 3  # edges 0-2, 1-2 and 1-5 are shared
    assert E.tolist() == sorted(E.tolist())
    assert mesh.unique_edges(Fw).shape == (9, 2)
    indptr, idx = mesh.adjacency_csr(6, E)
    assert indptr.shape == (7,) and idx.dtype == np.int32 and indptr[-1] == 18
    nbr = {v: idx[indptr[v]:indptr[v + 1]].tolist() for v in range(6)}
    assert nbr[0] == [1, 2, 3] and nbr[2] == [0, 1, 3, 5] and nbr[4] == [1, 5]
    for a, b in E:  # symmetric
        assert b in nbr[a] and a in nbr[b]
    # degenerate faces
    Fd = np.array([[0, 1, 2], [3, 3, 1]])
    assert mesh.welded_faces(Fd, np.arange(4), drop_degenerate=True).tolist() == [[0, 1, 2]]
    assert mesh.unique_edges(Fd).tolist() == [[0, 1], [0, 2], [1, 2], [1, 3]]
    with pytest.raises(ValueError):
        mesh.welded_faces([[0, 1, 9]], np.arange(4))
    assert mesh.unique_edges(np.zeros((0, 3), int)).shape == (0, 2)
    ip, ix = mesh.adjacency_csr(3, np.zeros((0, 2), int))
    assert ip.tolist() == [0, 0, 0, 0] and ix.size == 0


def test_islands_and_seam_groups_and_positions():
    V = np.array([[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 0, 0],  # tri A (0,1,2) and tri B (3,4,5) share the vertex position 1/3
                  [1, 1, 0], [0, 1, 0],
                  [5, 5, 5], [6, 5, 5], [5, 6, 5], [9, 9, 9]], float)  # island C + an isolated vertex 9
    F = np.array([[0, 1, 2], [3, 4, 5], [6, 7, 8]])
    w = mesh.weld_map(V)
    n, lab = mesh.islands(F, w)
    assert n == 3 and lab.dtype == np.int32 and lab.shape == (10,)
    assert lab[:6].tolist() == [0] * 6 and lab[6:9].tolist() == [1] * 3 and lab[9] == 2  # A and B joined through the seam
    groups = mesh.seam_groups(w)
    assert [g.tolist() for g in groups] == [[1, 3], [2, 5]]
    assert all(g.dtype == np.int32 for g in groups)
    assert mesh.seam_groups(np.arange(5)) == [] and mesh.seam_groups(np.zeros(0, int)) == []
    P = mesh.welded_positions(V, w)
    assert P.shape == (w.max() + 1, 3) and (P[w] == V).all()
    Pm = mesh.welded_positions(V, w, mode="mean")
    np.testing.assert_allclose(Pm, P)


# --------------------------------------------------------------------------------------------------------------------------
# the real D01 GLB
# --------------------------------------------------------------------------------------------------------------------------

def _load_d01_mesh(path):
    import trimesh

    sc = trimesh.load(path, process=False)  # process=False keeps the duplicate (seam) vertices
    geoms = list(sc.geometry.values())
    V = np.concatenate([g.vertices for g in geoms]).astype(np.float64)
    off, F = 0, []
    for g in geoms:
        F.append(np.asarray(g.faces) + off)
        off += len(g.vertices)
    return V, np.concatenate(F)


def test_weld_map_d01_glb(d01_glb_path, scratch_root):
    V, F = _load_d01_mesh(d01_glb_path)
    assert V.shape == (6505, 3)
    w = mesh.weld_map(V)  # tol_rel 1e-6 of the bbox diagonal (mesh-intake.md S1)
    assert w.dtype == np.int32 and w.shape == (6505,)
    n_w = int(w.max()) + 1
    assert n_w == 5389, f"D01 tools reported 5,389 welded positions, got {n_w}"
    # same answer as the exact float32 position identity
    assert n_w == len(np.unique(V.astype(np.float32), axis=0))
    # first-occurrence numbering: ids appear in increasing order of first use
    first = np.array([np.argmax(w == k) for k in range(0, n_w, 97)])
    assert (np.diff(first) > 0).all()
    # tolerance sensitivity: 100x tighter or looser gives the same partition on this mesh
    assert int(mesh.weld_map(V, 1e-8).max()) + 1 == n_w and int(mesh.weld_map(V, 1e-4).max()) + 1 == n_w
    groups = mesh.seam_groups(w)
    assert sum(len(g) for g in groups) - len(groups) == 6505 - n_w
    Fw = mesh.welded_faces(F, w)
    assert Fw.max() == n_w - 1 and len(Fw) == len(F)
    E, cnt = mesh.unique_edges(Fw, return_counts=True)
    n_isl, lab = mesh.islands(F, w)
    # connected components on the welded topology (no fixed expectation; reported)
    comp_n, comp_lab = mesh.connected_components(n_w, E)
    assert comp_n == n_isl
    sizes = np.bincount(comp_lab)
    report = {
        "vertices": int(V.shape[0]), "welded": n_w, "triangles": int(len(F)), "seam_groups": len(groups),
        "unique_edges": int(len(E)), "boundary_edges": int((cnt == 1).sum()), "non_manifold_edges": int((cnt > 2).sum()),
        "connected_components": int(comp_n), "component_sizes_welded_vertices": sorted(sizes.tolist(), reverse=True),
    }
    print("\nD01 weld report:", json.dumps(report))
    out = os.path.join(scratch_root, "R0")
    os.makedirs(out, exist_ok=True)
    with open(os.path.join(out, "d01_weld_report.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    assert comp_n >= 1 and sizes.sum() == n_w
    indptr, idx = mesh.adjacency_csr(n_w, E)
    assert indptr[-1] == 2 * len(E) and len(idx) == 2 * len(E)
