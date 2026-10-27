"""rigcore.mesh - welding and topology helpers on plain numpy arrays (no scipy: this module is imported inside Blender too).

Units: metres.  Frame: Blender, Z up (the functions are frame-independent).

Terms: ``V`` float (n,3) positions, ``F`` int (m,3) triangles over original vertex ids, ``weld`` int32 (n,) welded id per vertex.
Welded ids are contiguous 0..n_welded-1 and numbered in first-occurrence order (the vertex that comes first in V names the id),
so the result is deterministic and independent of hash order.
"""
from __future__ import annotations

import itertools

import numpy as np

# --------------------------------------------------------------------------------------------------------------------------
# connected components
# --------------------------------------------------------------------------------------------------------------------------


def connected_components(n: int, edges) -> tuple[int, np.ndarray]:
    """Connected components of the undirected graph with ``n`` nodes and ``edges`` (E,2).

    Returns ``(n_components, labels)``; ``labels`` int32 (n,) numbered 0.. in first-occurrence order (node 0 is always in component
    0, the next unlabeled node starts component 1, ...). Union by minimum-id hooking with pointer jumping, vectorized: O((n+E) log n)
    typically, no Python loop over edges. Isolated nodes are components of their own. Self loops and duplicate edges are fine.
    """
    n = int(n)
    if n < 0:
        raise ValueError("connected_components: n must be >= 0")
    parent = np.arange(n, dtype=np.int64)
    e = np.asarray(edges, dtype=np.int64).reshape(-1, 2)
    if e.size:
        if e.min() < 0 or e.max() >= n:
            raise ValueError(f"connected_components: edge ids outside [0, {n})")
        a, b = e[:, 0], e[:, 1]
        keep = a != b
        a, b = a[keep], b[keep]
        while a.size:
            ra, rb = parent[a], parent[b]  # parent is fully compressed here: these are roots
            lo, hi = np.minimum(ra, rb), np.maximum(ra, rb)
            cross = lo != hi
            if not cross.any():
                break
            a, b, lo, hi = a[cross], b[cross], lo[cross], hi[cross]  # edges inside one component are done
            np.minimum.at(parent, hi, lo)  # hook the larger root under the smallest neighbouring root
            while True:  # pointer jumping until every node points at its root
                pp = parent[parent]
                if np.array_equal(pp, parent):
                    break
                parent = pp
    # the root of a component is its smallest node id, so sorted roots = first-occurrence order
    uniq, labels = np.unique(parent, return_inverse=True)
    return int(uniq.size), labels.astype(np.int32).reshape(-1)


# --------------------------------------------------------------------------------------------------------------------------
# weld
# --------------------------------------------------------------------------------------------------------------------------

_HALF_SHIFTS = tuple(itertools.product((0.0, 0.5), repeat=3))


def weld_map(V, tol_rel: float = 1e-6) -> np.ndarray:
    """Welded id per vertex: positions closer than ``tol_rel`` x (bounding-box diagonal) share an id.

    Returns int32 (n,), ids contiguous in first-occurrence order. Method: the points are hashed into grid cells of side
    ``2 r`` (``r = tol_rel * diagonal``) on 8 grids shifted by half a cell per axis; two points with every coordinate within ``r``
    always share a cell in at least one grid (a half-open interval of length <= r holds at most one multiple of r). All
    cell-mates are linked and the links closed transitively (``connected_components``). So points within ``r`` are always merged;
    merged points are at most ``2 r sqrt(3)`` apart (chains can be longer). With ``tol_rel == 0`` only bit-identical positions
    merge. O(n log n). D01: 6,505 vertices -> 5,389 positions.
    """
    V = np.asarray(V, dtype=np.float64)
    if V.ndim != 2 or V.shape[1] != 3:
        raise ValueError(f"weld_map: V must have shape (n, 3), got {tuple(V.shape)}")
    if tol_rel < 0:
        raise ValueError("weld_map: tol_rel must be >= 0")
    n = V.shape[0]
    if n == 0:
        return np.zeros(0, dtype=np.int32)
    if not np.isfinite(V).all():
        raise ValueError("weld_map: V contains NaN or inf")
    vmin = V.min(axis=0)
    diag = float(np.linalg.norm(V.max(axis=0) - vmin))
    if diag == 0.0:
        return np.zeros(n, dtype=np.int32)  # all vertices at one position
    edges = []
    if tol_rel == 0:
        passes = [np.zeros(3)]
        scaled = None
    else:
        passes = list(_HALF_SHIFTS)
        scaled = (V - vmin) / (2.0 * tol_rel * diag)
    for shift in passes:
        if scaled is None:
            cells = np.ascontiguousarray(V + 0.0).view(np.int64)  # exact bit pattern; "+ 0.0" turns -0.0 into +0.0
        else:
            cells = np.floor(scaled - np.asarray(shift)).astype(np.int64)
        order = np.lexsort((cells[:, 2], cells[:, 1], cells[:, 0]))
        c = cells[order]
        same = (c[1:] == c[:-1]).all(axis=1)
        edges.append(np.stack([order[:-1][same], order[1:][same]], axis=1))
    _, labels = connected_components(n, np.concatenate(edges, axis=0))
    return labels.astype(np.int32)


def welded_faces(F, weld, drop_degenerate: bool = False) -> np.ndarray:
    """Triangles over welded ids: ``weld[F]`` int32 (m,3). With ``drop_degenerate`` the faces that collapse to < 3 distinct welded
    vertices are removed."""
    F = np.asarray(F)
    weld = np.asarray(weld)
    if F.size == 0:
        return np.zeros((0, 3), dtype=np.int32)
    if F.min() < 0 or F.max() >= weld.shape[0]:
        raise ValueError(f"welded_faces: F has vertex ids outside [0, {weld.shape[0]})")
    Fw = weld[F].astype(np.int32)
    if drop_degenerate:
        ok = (Fw[:, 0] != Fw[:, 1]) & (Fw[:, 1] != Fw[:, 2]) & (Fw[:, 2] != Fw[:, 0])
        Fw = Fw[ok]
    return Fw


def welded_positions(V, weld, mode: str = "first") -> np.ndarray:
    """Position per welded id, float64 (n_welded,3): the first vertex of each id (``mode="first"``) or the mean of its members
    (``mode="mean"``)."""
    V = np.asarray(V, dtype=np.float64)
    weld = np.asarray(weld)
    if weld.shape != (V.shape[0],):
        raise ValueError(f"welded_positions: weld has shape {tuple(weld.shape)}, expected ({V.shape[0]},)")
    if V.shape[0] == 0:
        return np.zeros((0, 3))
    n_w = int(weld.max()) + 1
    if mode == "first":
        first = np.full(n_w, -1, dtype=np.int64)
        idx = np.arange(V.shape[0])[::-1]  # assign in reverse so the smallest index wins
        first[weld[idx]] = idx
        if (first < 0).any():
            raise ValueError("welded_positions: weld ids are not contiguous")
        return V[first]
    if mode == "mean":
        cnt = np.bincount(weld, minlength=n_w).astype(np.float64)
        out = np.zeros((n_w, 3))
        for k in range(3):
            out[:, k] = np.bincount(weld, weights=V[:, k], minlength=n_w) / np.maximum(cnt, 1)
        return out
    raise ValueError(f"welded_positions: mode must be 'first' or 'mean', got {mode!r}")


# --------------------------------------------------------------------------------------------------------------------------
# edges / adjacency / islands / seams
# --------------------------------------------------------------------------------------------------------------------------


def unique_edges(F, return_counts: bool = False):
    """Unique undirected edges of the triangles ``F`` (m,3): int32 (E,2) with ``lo < hi``, sorted lexicographically (self edges of
    collapsed faces are dropped). With ``return_counts`` also the number of triangle sides per edge (1 = boundary, >2 = non-manifold)
    as int32 (E,)."""
    F = np.asarray(F, dtype=np.int64).reshape(-1, 3)
    if F.shape[0] == 0:
        e0 = np.zeros((0, 2), dtype=np.int32)
        return (e0, np.zeros(0, dtype=np.int32)) if return_counts else e0
    if F.min() < 0:
        raise ValueError("unique_edges: negative vertex id")
    e = np.concatenate([F[:, [0, 1]], F[:, [1, 2]], F[:, [2, 0]]], axis=0)
    e.sort(axis=1)
    e = e[e[:, 0] != e[:, 1]]
    N = int(F.max()) + 1
    key, counts = np.unique(e[:, 0] * N + e[:, 1], return_counts=True)
    edges = np.stack([key // N, key % N], axis=1).astype(np.int32)
    return (edges, counts.astype(np.int32)) if return_counts else edges


def adjacency_csr(n: int, edges) -> tuple[np.ndarray, np.ndarray]:
    """Symmetric vertex adjacency in CSR form from undirected ``edges`` (E,2): ``(indptr int64 (n+1,), indices int32)``. Neighbours
    of vertex v are ``indices[indptr[v]:indptr[v+1]]`` (sorted ascending, no duplicates, no self loops). Works with
    ``scipy.sparse.csr_matrix((ones, indices, indptr))`` on the solver side."""
    n = int(n)
    e = np.asarray(edges, dtype=np.int64).reshape(-1, 2)
    if e.size and (e.min() < 0 or e.max() >= n):
        raise ValueError(f"adjacency_csr: edge ids outside [0, {n})")
    e = e[e[:, 0] != e[:, 1]]
    both = np.concatenate([e, e[:, ::-1]], axis=0)
    key = np.unique(both[:, 0] * max(n, 1) + both[:, 1])
    rows, cols = key // max(n, 1), key % max(n, 1)
    indptr = np.zeros(n + 1, dtype=np.int64)
    np.cumsum(np.bincount(rows, minlength=n), out=indptr[1:])
    return indptr, cols.astype(np.int32)


def islands(F, weld) -> tuple[int, np.ndarray]:
    """Connected pieces of the WELDED topology. Returns ``(n_islands, labels)`` with ``labels`` int32 (n,) per ORIGINAL vertex, in
    first-occurrence order. Vertices that belong to no triangle form their own islands."""
    weld = np.asarray(weld)
    n_w = int(weld.max()) + 1 if weld.size else 0
    edges = unique_edges(welded_faces(F, weld))
    _, lab_w = connected_components(n_w, edges)
    # renumber by first original vertex so labels are per-original-vertex first-occurrence ordered
    lab_v = lab_w[weld]
    uniq, first = np.unique(lab_v, return_index=True)
    rank = np.empty(int(lab_v.max()) + 1 if lab_v.size else 0, dtype=np.int32)
    rank[uniq[np.argsort(first)]] = np.arange(uniq.size, dtype=np.int32)
    return int(uniq.size), (rank[lab_v] if lab_v.size else lab_v.astype(np.int32))


def seam_groups(weld) -> list[np.ndarray]:
    """Groups of duplicate vertices: one int32 array of ascending original vertex ids per welded id that has >= 2 members, ordered by
    welded id."""
    weld = np.asarray(weld)
    if weld.size == 0:
        return []
    order = np.argsort(weld, kind="stable")
    counts = np.bincount(weld)
    order = order[counts[weld[order]] > 1]
    if order.size == 0:
        return []
    cut = np.flatnonzero(np.diff(weld[order])) + 1
    return [g.astype(np.int32) for g in np.split(order, cut)]
