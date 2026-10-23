"""solvers.skin_garment - S6/S7 garment overlay (owner G1, phase G; review r1 fixes G4): garments.json/.npz + chains.json + the
merged skeleton -> ``garment_overlay.npz`` (per vertex ``W`` over the runtime deform bones incl. chain bones, ``alpha`` blend
factor) and ``garment_rules.json`` (skin-rules fragment: one region per piece with ``vertex_ids`` + ``allowed``, ``rigid``
items/beads). ``apply_overlay`` blends the selected body weights with the overlay and runs the common ``skin_rules.finish``.

Spec: ``references/cloth-and-attachments.md`` §5 (and §3 "one material and one behaviour per chain"):

1. ``t`` (geodesic from the attachment line / length) and ``phi`` (skirt azimuth) come from garments.npz (S3g), computed on the
   outermost layer.
2. Along a chain: bone centres sit at ``t_k = (k + 0.5) / n``; a row blends linearly between the two bones whose centres bracket
   ``t``; from ``t = 0`` to half the first bone it blends the chain parent into bone 01 (top band). A chain ended by a material
   split (``rigid_below_t``) maps ``t / t_split`` onto the chain and the rows below the split ride 100% on the last bone (rigid
   panel on one chain bone, never inside a ramp). The expected bone index is non-decreasing in ``t`` (monotone weights). Strips
   (one chain, ``hem_ramp``) blend bone n-1 into bone n down to the hem itself, so their hem rows are not all rigid on the last
   bone (review r1 m8: ``garment_hem_stretch`` can then see the last bone bend).
3. Skirt rings: linear blend in ``phi`` between the two nearest chains. A slit cuts the blend (the row takes only the chain on its
   side) only where it really separates the cloth at the row's height (review r1 M1): slits found on fewer than
   ``slit_min_levels`` (3) section levels are dropped, and the cut strength ramps from 0 at the heights where outer edges of the
   piece cross the slit azimuth (the cloth is connected there) to 1 over ``max(slit_ramp_H x H, 2 median edges)`` below them, so
   two rows that share an edge never switch chains 100%. At most 2 chains x 2 bones = 4 influences. Strips use only their own
   chain; a 3-chain cape blends between its two nearest chains across its width.
4. Layers (review r1 M2): inner rows (``outer_ref >= 0``) interpolate the weights of the outer surface (barycentric at the
   closest point of the outermost-layer triangles of the piece they ride on), then a screened Laplacian smooth over the inner
   rows (neighbours fixed) removes the seams where neighbouring inner rows project onto distant outer rows; ``apply_overlay``
   repeats this on the finished weights (then ``enforce``) so the layers move together.
5. Regions: each piece may take only its parent, ``pelvis``/``spine_01`` (tight upper band), its own chain bones and those of the
   pieces its inner rows ride on; thigh, calf and foot weights are therefore folded away on the piece's rows where the overlay is
   complete (``alpha = 1``); no other piece's chain bones (``garment_bleed`` = 0).
6. Transition band (review r1 B1): rows within ``band_rings`` (2) edge rings of the attachment line **or of any junction with
   rows outside the piece** (body, tight cloth, other pieces; welded adjacency) get ``alpha = (hop + 1) / (band_rings + 1)``
   (body weights -> overlay), the rest of the piece 1, body rows 0. Band rows have no garment region: they keep their body bones,
   legs included. Inner rows take the smaller of their own band value and the outer surface's.
7. Rigid parts: beads (each item island on its nearest chain bone), ``rigid_hanging`` items (their parent bone, or their swing
   bone) and clusters made rigid by the budget (their parent) are 1.0 on one bone.

``check_overlay`` adds the edge-continuity check (``continuity``): the weight jump (half L1) across welded edges at the border of
chained pieces, inside them and on inner-layer edges, against the body-interior baseline (p95 / p99).

Units: metres, Blender frame. numpy + skin_common / skin_rules (rigkit-env).
"""
from __future__ import annotations

import argparse
import json
import os
import sys

import numpy as np

if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rigcore import npzio  # noqa: E402
from solvers import skin_common as sc  # noqa: E402

BAND_RINGS = 3
BAND_BONES = ("pelvis", "spine_01")  # the tight upper band may keep these (§5.5)
SLIT_MIN_LEVELS = 3  # review r1 M1: slits seen on fewer section levels (of 5) are noise
SLIT_RAMP_H = 0.05  # cut strength 0 -> 1 over this height (x H) below the last outer edge crossing the slit, at least 2 edges
INNER_MU = 0.9  # inner-layer smooth: X = (1 - mu) interpolated + mu mean(neighbours)
INNER_ITERS = 120
INNER_CAND = 16  # closest-triangle candidates per inner row (nearest outer face centroids)
JUMP_LIMIT = 0.5  # continuity check: max weight jump (half L1) on border / inner edges, at least the body-interior p99 ...
JUMP_CAP = 0.75  # ... of the smooth skin (``body_baseline``), at most this (G7: a body p99 of 1.0 made the gate vacuous)
#: G7 distance cap on transition-band rows (x H, edge-path length to the junction / attachment rows). Off by default (inf):
#: on FL the 0.05 H cap moved only 28 -> 25 far leg-weighted rows but raised deep-crouch tears 154 -> 168 and the worst stretch
#: 10.7 -> 20.3 (orchestrator decision 2026-10-23). Kept as a parameter for P5 calibration.
BAND_MAX_H = float("inf")


def along(t, n: int, rigid_below=None, hem_ramp: bool = False) -> np.ndarray:
    """Weights (m, n + 1) over [parent, bone_1 .. bone_n] for chain parameters ``t`` (m,) (§5.2). ``hem_ramp`` (strips): bone
    n - 1 blends into bone n down to t = 1 (no rigid plateau on the last bone above the hem)."""
    t = np.asarray(t, float).copy()
    out = np.zeros((t.size, n + 1))
    if rigid_below:
        below = t >= float(rigid_below)
        t = np.clip(t / float(rigid_below), 0.0, 1.0)
    else:
        below = np.zeros(t.size, bool)
    c = (np.arange(n) + 0.5) / n
    if hem_ramp and n >= 2 and not rigid_below:
        c[-1] = 1.0
    top = t <= c[0]
    f = np.clip(t / c[0], 0.0, 1.0)
    out[top, 0] = 1.0 - f[top]
    out[top, 1] = f[top]
    last = t >= c[-1]
    out[last & ~top, n] = 1.0
    mid = ~top & ~last
    if mid.any():
        k = np.clip(np.searchsorted(c, t[mid], side="right") - 1, 0, n - 2)
        u = (t[mid] - c[k]) / (c[k + 1] - c[k])
        r = np.flatnonzero(mid)
        out[r, k + 1] = 1.0 - u
        out[r, k + 2] = u
    if below.any():
        out[below] = 0.0
        out[below, n] = 1.0
    return out


def _angd(a, b):
    return (np.asarray(a, float) - b + 180.0) % 360.0 - 180.0


def _ring_pair(phi, az):
    """For row azimuths ``phi`` and chain azimuths ``az`` (sorted ascending), the bracketing chain indices (i, j) and the blend
    factor s toward j: chain i at or before phi, j the next one around the circle."""
    m = len(az)
    rel = np.mod(np.asarray(phi)[:, None] - np.asarray(az)[None, :], 360.0)
    i = rel.argmin(1)  # nearest chain at or before phi (smallest positive offset)
    j = (i + 1) % m
    span = np.mod(np.asarray(az)[j] - np.asarray(az)[i], 360.0)
    span = np.where(span <= 0, 360.0, span)
    s = np.clip(rel[np.arange(len(i)), i] / span, 0.0, 1.0)
    return i, j, s


def _crosses_slit(phi_i, phi_j, slit_phi):
    """True when the slit azimuth lies strictly inside the arc going from phi_i to phi_j (positive direction)."""
    span = np.mod(phi_j - phi_i, 360.0)
    off = np.mod(slit_phi - phi_i, 360.0)
    return (off > 1e-6) & (off < span - 1e-6)


def slit_crossings(topo, rows, phi_rows, slit_phi: float, max_arc: float = 90.0):
    """Welded edges of the piece's outer rows ``rows`` (azimuths ``phi_rows``) that cross the slit azimuth along their short arc:
    (lo, hi) z ranges (k,) of those edges. The cloth is connected across the slit at those heights (review r1 M1)."""
    loc = np.full(topo.n_w, -1, np.int64)
    loc[rows] = np.arange(rows.size)
    e = topo.edges
    m = (loc[e[:, 0]] >= 0) & (loc[e[:, 1]] >= 0)
    if not m.any():
        return np.zeros(0), np.zeros(0)
    ea, eb = e[m, 0], e[m, 1]
    pa, pb = phi_rows[loc[ea]], phi_rows[loc[eb]]
    d = _angd(pb, pa)
    off = _angd(slit_phi, pa)
    cross = (np.abs(d) < max_arc) & (np.sign(off) == np.sign(d)) & (np.abs(off) > 1e-9) & (np.abs(off) < np.abs(d) - 1e-9)
    za, zb = topo.P[ea[cross], 2], topo.P[eb[cross], 2]
    return np.minimum(za, zb), np.maximum(za, zb)


def _cut_strength(z, lo, hi, ramp: float) -> np.ndarray:
    """0 at heights inside a crossing edge's z range, rising linearly to 1 at ``ramp`` below/above the nearest one."""
    if lo.size == 0:
        return np.ones(z.size)
    d = np.maximum(np.maximum(lo[None, :] - z[:, None], z[:, None] - hi[None, :]), 0.0).min(1)
    return np.clip(d / max(ramp, 1e-9), 0.0, 1.0)


# --------------------------------------------------------------------------------------------------------------------------
# inner layers: closest point on the outer surface + screened smooth (review r1 M2)
# --------------------------------------------------------------------------------------------------------------------------


def _closest_bary(p, A, B, C):
    """Barycentric coordinates (m,3) of the closest point of triangles (A, B, C) to points p (all (m,3); Ericson 5.1.5)."""
    ab, ac, ap = B - A, C - A, p - A
    d1, d2 = (ab * ap).sum(1), (ac * ap).sum(1)
    bp = p - B
    d3, d4 = (ab * bp).sum(1), (ac * bp).sum(1)
    cp = p - C
    d5, d6 = (ab * cp).sum(1), (ac * cp).sum(1)
    va, vb, vc = d3 * d6 - d5 * d4, d5 * d2 - d1 * d6, d1 * d4 - d3 * d2
    den = va + vb + vc
    with np.errstate(divide="ignore", invalid="ignore"):
        v_in = np.where(np.abs(den) > 1e-30, vb / den, 0.0)
        w_in = np.where(np.abs(den) > 1e-30, vc / den, 0.0)
        v_ab = np.where(np.abs(d1 - d3) > 1e-30, d1 / (d1 - d3), 0.0)
        w_ac = np.where(np.abs(d2 - d6) > 1e-30, d2 / (d2 - d6), 0.0)
        q = (d4 - d3) + (d5 - d6)
        w_bc = np.where(np.abs(q) > 1e-30, (d4 - d3) / q, 0.0)
    out = np.stack([1.0 - v_in - w_in, v_in, w_in], 1)
    conds = [(d1 <= 0) & (d2 <= 0), (d3 >= 0) & (d4 <= d3), (vc <= 0) & (d1 >= 0) & (d3 <= 0), (d6 >= 0) & (d5 <= d6),
             (vb <= 0) & (d2 >= 0) & (d6 <= 0), (va <= 0) & ((d4 - d3) >= 0) & ((d5 - d6) >= 0)]
    vals = [np.array([1.0, 0, 0]), np.array([0, 1.0, 0]), None, np.array([0, 0, 1.0]), None, None]
    done = np.zeros(len(p), bool)
    for k, cnd in enumerate(conds):
        m = cnd & ~done
        if not m.any():
            continue
        if k == 2:
            out[m] = np.stack([1 - v_ab[m], v_ab[m], np.zeros(m.sum())], 1)
        elif k == 4:
            out[m] = np.stack([1 - w_ac[m], np.zeros(m.sum()), w_ac[m]], 1)
        elif k == 5:
            out[m] = np.stack([np.zeros(m.sum()), 1 - w_bc[m], w_bc[m]], 1)
        else:
            out[m] = vals[k]
        done |= m
    return np.clip(out, 0.0, 1.0) / np.maximum(np.clip(out, 0.0, 1.0).sum(1, keepdims=True), 1e-30)


def inner_map(topo, garr: dict) -> dict:
    """For every inner row (``outer_ref >= 0``): the closest outer triangle (welded ids (3,)) and barycentric weights (3,) on the
    outermost-layer faces (all three corners outer rows, ``outer_ref < 0``) of the piece its ``outer_ref`` belongs to. Rows whose
    piece has no outer face fall back to their ``outer_ref`` row. Returns {"rows", "tri" (m,3), "bary" (m,3), "dist" (m,)}."""
    from scipy.spatial import cKDTree

    piece = np.asarray(garr["piece"], np.int64)
    oref = np.asarray(garr["outer_ref"], np.int64)
    rows = np.flatnonzero((oref >= 0) & (piece >= 0))
    tri = np.repeat(oref[rows][:, None], 3, 1) if rows.size else np.zeros((0, 3), np.int64)
    bary = np.tile([1.0, 0.0, 0.0], (rows.size, 1))
    dist = np.linalg.norm(topo.P[rows] - topo.P[oref[rows]], axis=1) if rows.size else np.zeros(0)
    if rows.size == 0:
        return {"rows": rows, "tri": tri, "bary": bary, "dist": dist}
    F = topo.F
    outer = (oref < 0) & (piece >= 0)
    ride = piece[oref[rows]]
    for q in np.unique(ride):
        sel = np.flatnonzero(ride == q)
        fm = outer[F].all(1) & (piece[F] == q).all(1)
        Fq = F[fm]
        if not len(Fq):
            continue
        A, B, C = topo.P[Fq[:, 0]], topo.P[Fq[:, 1]], topo.P[Fq[:, 2]]
        k = min(INNER_CAND, len(Fq))
        _, cand = cKDTree((A + B + C) / 3.0).query(topo.P[rows[sel]], k=k)
        cand = np.asarray(cand).reshape(len(sel), k)
        p = np.repeat(topo.P[rows[sel]], k, 0)
        f = cand.reshape(-1)
        bc = _closest_bary(p, A[f], B[f], C[f])
        X = bc[:, :1] * A[f] + bc[:, 1:2] * B[f] + bc[:, 2:] * C[f]
        d = np.linalg.norm(X - p, axis=1).reshape(len(sel), k)
        best = d.argmin(1)
        pick = np.arange(len(sel)) * k + best
        tri[sel] = Fq[f[pick]]
        bary[sel] = bc[pick]
        dist[sel] = d[np.arange(len(sel)), best]
    return {"rows": rows, "tri": tri, "bary": bary, "dist": dist}


def interp_inner(X, imap) -> np.ndarray:
    """Values (m, ...) of ``X`` (n_w, ...) at the inner rows' closest outer points (barycentric)."""
    X = np.asarray(X, float)
    tri, bc = imap["tri"], imap["bary"]
    if X.ndim == 1:
        return (X[tri] * bc).sum(1)
    return (X[tri] * bc[:, :, None]).sum(1)


def fill_inner(X, imap, topo, update, valid=None, group=None, mu: float = INNER_MU, iters: int = INNER_ITERS) -> np.ndarray:
    """Inner rows in ``update`` (bool (n_w,)) <- screened Laplacian smooth of the interpolated outer weights:
    ``x = (1 - mu) interp + mu mean(neighbours)`` (Jacobi, ``iters`` passes; neighbours restricted to ``valid`` rows of the same
    ``group`` (``groups_of``; no weight crosses to another piece), the other rows fixed), then rows normalized. Returns a copy of
    ``X``."""
    X = np.array(X, float, copy=True)
    rows = imap["rows"]
    upd = np.zeros(topo.n_w, bool)
    upd[rows] = True
    upd &= np.asarray(update, bool)
    if not upd.any():
        return X
    loc = np.full(topo.n_w, -1, np.int64)
    loc[rows] = np.arange(rows.size)
    ur = np.flatnonzero(upd)
    Wi = interp_inner(X, {"tri": imap["tri"][loc[ur]], "bary": imap["bary"][loc[ur]]})
    X[ur] = Wi
    valid = np.ones(topo.n_w, bool) if valid is None else np.asarray(valid, bool) | upd
    e = topo.edges
    m = (upd[e[:, 0]] | upd[e[:, 1]]) & valid[e[:, 0]] & valid[e[:, 1]]
    if group is not None:
        m &= np.asarray(group)[e[:, 0]] == np.asarray(group)[e[:, 1]]
    ea, eb = e[m, 0], e[m, 1]
    deg = np.bincount(np.concatenate([ea, eb]), minlength=topo.n_w).astype(float)
    has = deg[ur] > 0
    for _ in range(iters):
        acc = np.zeros_like(X)
        np.add.at(acc, ea, X[eb])
        np.add.at(acc, eb, X[ea])
        avg = acc[ur] / np.maximum(deg[ur], 1.0)[:, None]
        X[ur] = np.where(has[:, None], (1.0 - mu) * Wi + mu * avg, Wi)
    s = X[ur].sum(1)
    X[ur] /= np.where(s > 0, s, 1.0)[:, None]
    return X


def groups_of(garr: dict) -> np.ndarray:
    """Piece a welded row moves with: its ``outer_ref``'s piece for inner rows, else its own (−1 = body)."""
    piece = np.asarray(garr["piece"], np.int64)
    oref = np.asarray(garr["outer_ref"], np.int64)
    return np.where(oref >= 0, piece[np.maximum(oref, 0)], piece)


def junction_rows(topo, member) -> np.ndarray:
    """Rows of ``member`` (bool (n_w,)) with at least one welded neighbour outside it (review r1 B1)."""
    e = topo.edges
    a, b = member[e[:, 0]], member[e[:, 1]]
    out = np.zeros(topo.n_w, bool)
    x = a & ~b
    out[e[x, 0]] = True
    x = b & ~a
    out[e[x, 1]] = True
    return out


def path_dist(topo, sources, eligible, limit: float) -> np.ndarray:
    """Edge-path length (geodesic along welded edges, metres) from the nearest ``sources`` row, walking only through ``eligible``
    rows (bool (n_w,)); ``inf`` beyond ``limit`` or out of reach (G7 band cap)."""
    from scipy.sparse import csr_matrix
    from scipy.sparse.csgraph import dijkstra

    src = np.flatnonzero(np.asarray(sources, bool) & eligible)
    d = np.full(topo.n_w, np.inf)
    if src.size == 0:
        return d
    e = topo.edges
    m = eligible[e[:, 0]] & eligible[e[:, 1]]
    ea, eb = e[m, 0], e[m, 1]
    L = np.maximum(np.linalg.norm(topo.P[ea] - topo.P[eb], axis=1), 1e-12)
    G = csr_matrix((np.r_[L, L], (np.r_[ea, eb], np.r_[eb, ea])), shape=(topo.n_w, topo.n_w))
    return np.asarray(dijkstra(G, directed=True, indices=src, min_only=True, limit=float(limit)), float)


def band_alpha(hop, dist, band_rings: int, cap: float) -> np.ndarray:
    """Overlay share of a row from its hop count and edge-path length to the junction / attachment rows: ``(hop + 1) / (rings +
    1)`` in the band, at least ``dist / cap`` (G7: the band ends within ``rings`` rings and within ``cap`` metres; the ramp reaches
    1 at the cap, so a coarse mesh gets a shorter band, not a step inside it), 1 beyond either."""
    hop = np.asarray(hop, float)
    dist = np.asarray(dist, float)
    a = np.maximum((hop + 1.0) / (band_rings + 1.0), np.where(np.isfinite(dist), dist / max(cap, 1e-12), 1.0))
    return np.where((hop < band_rings) & (dist < cap), np.minimum(a, 1.0), 1.0)


def band_body(B, topo, garr: dict, alpha_w, chained=None, iters: int = 30) -> tuple:
    """Body side of the transition band (review r1 B1): for band rows (0 < alpha < 1) the body weights are a harmonic fill of the
    body weights of the rows outside their group that touch them (Jacobi mean over band rows and those outside rows, the outside
    rows fixed), so the first ring steps by about 1 / (band_rings + 1) of the body/overlay difference even where the selected
    body candidate's own values on the cloth jump (FL: up to 0.69 across the robe border) or two legs meet one cloth row. Outside
    rows of other chained groups never feed it (cloth/cloth junctions blend to the parent inside the overlay). Band rows that no
    outside row reaches (a free attachment line of a separate island) keep their own body weights. Returns (X, n filled)."""
    grp = groups_of(garr)
    a = np.asarray(alpha_w, float)
    band = (a > 0) & (a < 1.0 - 1e-12) & (grp >= 0)
    X = np.array(B, float, copy=True)
    if not band.any():
        return X, 0
    ch = np.zeros(topo.n_w, bool) if chained is None else np.isin(grp, list(chained))
    e = topo.edges
    ga, gb = grp[e[:, 0]], grp[e[:, 1]]
    src_ok = ~ch  # body rows, tight cloth, unchained pieces, rigid items
    bb = band[e[:, 0]] & band[e[:, 1]] & (ga == gb)  # band - band edges of one group
    bs = (band[e[:, 0]] & src_ok[e[:, 1]] & (gb != ga)) | (band[e[:, 1]] & src_ok[e[:, 0]] & (ga != gb))  # band - source
    # band rows reached from a source through band rows of their group
    reach = np.zeros(topo.n_w, bool)
    reach[np.where(band[e[bs, 0]], e[bs, 0], e[bs, 1])] = True
    eba, ebb = e[bb, 0], e[bb, 1]
    for _ in range(topo.n_w):
        grow = (reach[eba] & ~reach[ebb]) | (reach[ebb] & ~reach[eba])
        if not grow.any():
            break
        reach[eba[grow]] = True
        reach[ebb[grow]] = True
    upd = band & reach
    # first ring (rows touching outside rows): the mean of those outside rows, fixed
    first = np.zeros(topo.n_w, bool)
    first[np.where(band[e[bs, 0]], e[bs, 0], e[bs, 1])] = True
    sa = np.where(band[e[bs, 0]], e[bs, 0], e[bs, 1])
    so = np.where(band[e[bs, 0]], e[bs, 1], e[bs, 0])
    acc = np.zeros_like(X)
    cnt = np.zeros(topo.n_w)
    np.add.at(acc, sa, B[so])
    np.add.at(cnt, sa, 1.0)
    X[first] = acc[first] / cnt[first][:, None]
    # deeper band rows: Jacobi mean over band neighbours of their group (first ring fixed)
    inner_b = upd & ~first
    use = bb & upd[e[:, 0]] & upd[e[:, 1]]
    ea, eb = e[use, 0], e[use, 1]
    cnt = np.zeros(topo.n_w)
    np.add.at(cnt, ea, 1.0)
    np.add.at(cnt, eb, 1.0)
    for _ in range(iters):
        if not inner_b.any():
            break
        acc = np.zeros_like(X)
        np.add.at(acc, ea, X[eb])
        np.add.at(acc, eb, X[ea])
        r = inner_b & (cnt > 0)
        X[r] = acc[r] / cnt[r][:, None]
    s_ = X[upd].sum(1)
    X[upd] /= np.where(s_ > 0, s_, 1.0)[:, None]
    return X, int(upd.sum())


def overlay(mesh: dict, garments: dict, garr: dict, chains: dict, skel_merged: dict, band_rings: int = BAND_RINGS,
            slit_min_levels: int = SLIT_MIN_LEVELS):
    """Welded overlay. Returns (columns list, W (n_w, k) float64, alpha (n_w,), rules fragment dict, report dict)."""
    topo = sc.weld_topo(mesh)
    bones = sc.BoneSet.from_skeleton(skel_merged)
    col = bones.index
    n_w, k = topo.n_w, bones.k
    W = np.zeros((n_w, k))
    alpha = np.zeros(n_w)
    piece = np.asarray(garr["piece"], np.int64)
    t_all = np.asarray(garr["t"], float)
    phi_all = np.asarray(garr["phi"], float)
    oref = np.asarray(garr["outer_ref"], np.int64)
    if piece.shape != (n_w,):
        raise ValueError(f"garments.npz has {piece.shape[0]} rows, the mesh has {n_w} welded ids")
    pieces = garments.get("pieces", [])
    by_piece: dict = {}
    for c in chains.get("chains", []):
        by_piece.setdefault(c["piece"], []).append(c)
    rules = {"schema": 0, "kind": "garment_rules", "asset_id": garments.get("asset_id"), "regions": {}, "rigid": {}}
    rep = {"pieces": {}}
    done = np.zeros(n_w, bool)
    rigid_rows = np.zeros(n_w, bool)
    chained = []  # pieces with an overlay from chains (band + inner layers)
    P = topo.P
    H = topo.H if np.isfinite(topo.H) else float(garments.get("H") or 1.8)
    med_edge = float(np.median(topo.edge_lengths())) if len(topo.edges) else 0.0
    for pi, pc in enumerate(pieces):
        rows = np.flatnonzero((piece == pi) & (oref < 0))
        allrows = np.flatnonzero(piece == pi)
        if allrows.size == 0:
            continue
        cls = pc["class"]
        chs = by_piece.get(pc["id"], [])
        parent = pc.get("parent") or (pc.get("attach") or {}).get("bone")
        if parent not in col:
            parent = "pelvis" if "pelvis" in col else bones.names[0]
        info = {"class": cls, "rows": int(allrows.size), "chains": [c["id"] for c in chs]}
        if cls == "tight":
            info["overlay"] = "none (body skin)"
            rep["pieces"][pc["id"]] = info
            continue
        if cls in ("rigid_hanging", "cluster") and not chs:
            W[rows] = 0.0
            W[rows, col[parent]] = 1.0
            alpha[rows] = 1.0
            done[rows] = True
            rigid_rows[rows] = True
            rules["rigid"][f"garment_{pc['id']}"] = {"vertex_ids": rows.tolist(), "bone": parent}
            info["overlay"] = f"rigid on {parent}"
            rep["pieces"][pc["id"]] = info
            continue
        if cls == "rigid_hanging":  # swing bone
            b = chs[0]["bones"][0]["name"]
            W[rows] = 0.0
            W[rows, col[b]] = 1.0
            alpha[rows] = 1.0
            done[rows] = True
            rigid_rows[rows] = True
            rules["rigid"][f"garment_{pc['id']}"] = {"vertex_ids": rows.tolist(), "bone": b}
            info["overlay"] = f"rigid on {b}"
            rep["pieces"][pc["id"]] = info
            continue
        if not chs:
            info["overlay"] = "none (no chain: inner layer rides on its outer_ref, or no chain planned)"
            rep["pieces"][pc["id"]] = info
            continue
        t = np.nan_to_num(t_all[rows], nan=0.0)
        chain_cols = []
        for c in chs:
            chain_cols.append([col[b["name"]] for b in c["bones"]])
        if cls == "skirt" and len(chs) >= 2:
            order = np.argsort([c["azimuth_deg"] for c in chs])
            chs_s = [chs[i] for i in order]
            cc_s = [chain_cols[i] for i in order]
            az = np.array([c["azimuth_deg"] for c in chs_s])
            phi = np.nan_to_num(phi_all[rows], nan=0.0)
            i, j, s = _ring_pair(phi, az)
            slit_rep = []
            ramp = max(SLIT_RAMP_H * H, 2.0 * med_edge)
            for sl in pc.get("slits", []):
                ent = {"phi_deg": sl["phi_deg"], "levels": sl.get("levels"), "z_top": sl["z_top"]}
                slit_rep.append(ent)
                if int(sl.get("levels", slit_min_levels)) < slit_min_levels:
                    ent["used"] = f"dropped: seen on {sl.get('levels')} section levels (< {slit_min_levels})"
                    continue
                cand = _crosses_slit(az[i], az[j], float(sl["phi_deg"])) & (P[rows, 2] < float(sl["z_top"]))
                if not cand.any():
                    ent["used"] = "no row blends across it"
                    continue
                lo, hi = slit_crossings(topo, rows, phi, float(sl["phi_deg"]))
                kap = _cut_strength(P[rows[cand], 2], lo, hi, ramp)
                row_side_j = _crosses_slit(np.full(cand.sum(), float(sl["phi_deg"])), az[j][cand], phi[cand]) | \
                    (np.abs(_angd(phi[cand], az[j][cand])) < 1e-6)
                side = np.where(row_side_j, 1.0, 0.0)
                s = s.copy()
                s[cand] = (1.0 - kap) * s[cand] + kap * side
                ent["used"] = (f"cut {int((kap >= 1).sum())} rows, ramp {int(((kap > 0) & (kap < 1)).sum())}, connected "
                               f"{int((kap <= 0).sum())} (outer edges crossing it: {lo.size})")
            info["slits"] = slit_rep
            for a_idx, wgt in ((i, 1.0 - s), (j, s)):
                for ci in np.unique(a_idx):
                    m = a_idx == ci
                    A = along(t[m], len(cc_s[ci]), chs_s[ci].get("rigid_below_t"))
                    par = chs_s[ci]["bones"][0]["parent"]
                    cols = [col[par]] + cc_s[ci]
                    for q, cq in enumerate(cols):
                        W[rows[m], cq] += wgt[m] * A[:, q]
        elif cls == "cape" and len(chs) >= 2:
            xs = np.array([c["bones"][0]["head"][0] for c in chs])
            order = np.argsort(xs)
            xs = xs[order]
            xr = P[rows, 0]
            jx = np.clip(np.searchsorted(xs, xr) - 1, 0, len(xs) - 2)
            s = np.clip((xr - xs[jx]) / np.maximum(xs[jx + 1] - xs[jx], 1e-9), 0, 1)
            for a_idx, wgt in ((order[jx], 1.0 - s), (order[jx + 1], s)):
                for ci in np.unique(a_idx):
                    m = a_idx == ci
                    A = along(t[m], len(chain_cols[ci]), chs[ci].get("rigid_below_t"))
                    cols = [col[chs[ci]["bones"][0]["parent"]]] + chain_cols[ci]
                    for q, cq in enumerate(cols):
                        W[rows[m], cq] += wgt[m] * A[:, q]
        elif cls == "cluster":
            c = chs[0]
            cc = chain_cols[0]
            A = along(t, len(cc), c.get("rigid_below_t"))
            cols = [col[c["bones"][0]["parent"]]] + cc
            for q, cq in enumerate(cols):
                W[rows, cq] += A[:, q]
            heads = np.array([b["head"] for b in c["bones"]])
            tails = np.array([b["tail"] for b in c["bones"]])
            isl = topo.island
            for g, item in enumerate(pc.get("items", [])):
                ir = rows[np.isin(isl[rows], item["islands"])]
                if ir.size == 0:
                    continue
                cen = P[ir].mean(0)
                d = [sc.seg_dist(cen[None], heads[b], tails[b])[0][0] for b in range(len(cc))]
                bb = cc[int(np.argmin(d))]
                W[ir] = 0.0
                W[ir, bb] = 1.0
                rigid_rows[ir] = True
                rules["rigid"][f"garment_{pc['id']}_item{g}"] = {"vertex_ids": ir.tolist(), "bone": bones.names[bb]}
        else:  # strip, sleeve, hair, single-chain cape
            c = chs[0]
            cc = chain_cols[0]
            A = along(t, len(cc), c.get("rigid_below_t"), hem_ramp=(cls == "strip"))
            cols = [col[c["bones"][0]["parent"]]] + cc
            for q, cq in enumerate(cols):
                W[rows, cq] += A[:, q]
        s_ = W[rows].sum(1)
        W[rows] /= np.where(s_ > 0, s_, 1.0)[:, None]
        done[rows] = True
        chained.append(pi)
        rep["pieces"][pc["id"]] = info
    # inner layers: interpolate the outer surface, then smooth over the inner rows (outer rows fixed)
    imap = inner_map(topo, garr)
    grp = groups_of(garr)
    inner_upd = np.zeros(n_w, bool)
    inner_upd[imap["rows"]] = np.isin(grp[imap["rows"]], chained)
    W = fill_inner(W, imap, topo, inner_upd, valid=done | inner_upd, group=grp)
    # transition band: hops from the attachment line and from every junction with rows outside the piece's group. Junctions
    # with the body (body rows, tight cloth, unchained pieces, rigid items) blend body -> overlay (alpha); junctions with another
    # chained group (cloth on cloth, e.g. robe rows riding on an apron) blend the piece's parent bone -> overlay inside the
    # overlay, so no leg weight and no other piece's chain bone enters the cloth there
    in_ch = np.isin(grp, chained)
    e = topo.edges
    for pi in chained:
        pc = pieces[pi]
        member = grp == pi
        outer_rows = np.flatnonzero((piece == pi) & (oref < 0))
        att = np.zeros(n_w, bool)
        att[_attach_ids(pc, topo, outer_rows if outer_rows.size else np.flatnonzero(member))] = True
        x = member[e[:, 0]] != member[e[:, 1]]
        ins = np.where(member[e[x, 0]], e[x, 0], e[x, 1])
        outs = np.where(member[e[x, 0]], e[x, 1], e[x, 0])
        j_body = np.zeros(n_w, bool)
        j_body[ins[~in_ch[outs]]] = True
        j_pp = np.zeros(n_w, bool)
        j_pp[ins[in_ch[outs]]] = True
        hop = sc.bfs_hops(topo, att | j_body, member, band_rings)
        dist = path_dist(topo, att | j_body, member, BAND_MAX_H * H)  # G7: large Tripo triangles took 3 rings to 0.12 H
        dist[member & (oref >= 0)] = 0.0  # inner layers keep the ring band: a cut there leaves 0.25 next to 1.0 (FL: 6 seams)
        r = np.flatnonzero(member & ~rigid_rows)
        a = band_alpha(hop[r], dist[r], band_rings, BAND_MAX_H * H)
        alpha[r] = a
        alpha[member & rigid_rows] = 1.0  # beads: rigid on their chain bone
        n_pp = 0
        if j_pp.any():
            hp = sc.bfs_hops(topo, j_pp, member, band_rings)
            rp = r[hp[r] < band_rings]
            beta = (hp[rp] + 1.0) / (band_rings + 1.0)
            par = chained_parent(pc, by_piece.get(pc["id"], []), col, bones)
            W[rp] *= beta[:, None]
            W[rp, col[par]] += 1.0 - beta
            n_pp = int(rp.size)
        info = rep["pieces"][pc["id"]]
        info["band_rows"] = int((a < 1).sum())
        info["band_rows_cut_by_distance"] = int(((hop[r] < band_rings) & ~(dist[r] < BAND_MAX_H * H)).sum())
        info["junction_rows"] = int((j_body & member).sum())
        info["cloth_junction_band_rows"] = n_pp
        info["attach_rows"] = int((att & member).sum())
    # inner rows keep their own (topological) band value: taking the outer surface's smaller value broke the hop ramp between
    # inner rows and the outer rows they touch (FL: 0.25 next to 1.0)
    # rows riding on pieces without an overlay (inner rows of unchained pieces) keep the old copy rule
    rest = np.flatnonzero((oref >= 0) & (piece >= 0) & ~inner_upd)
    W[rest] = W[oref[rest]]
    alpha[rest] = alpha[oref[rest]]
    full = alpha >= 1.0 - 1e-12
    # regions: per piece, parent + band bones + own chain bones + chain bones of the pieces its inner rows ride on; only rows
    # where the overlay is complete (alpha = 1): band rows keep their body bones (legs included, review r1 B1)
    for pi, pc in enumerate(pieces):
        allrows = np.flatnonzero(piece == pi)
        if allrows.size == 0 or pc["class"] == "tight":
            continue
        reg_rows = allrows[~rigid_rows[allrows] & full[allrows]]
        if reg_rows.size == 0:
            continue
        ride = set(piece[oref[allrows[oref[allrows] >= 0]]].tolist())
        allowed = []
        parent = pc.get("parent") or "pelvis"
        for nm in [parent, *BAND_BONES]:
            if nm in col and nm not in allowed:
                allowed.append(nm)
        for pj in sorted(ride | {pi}):
            for c in by_piece.get(pieces[pj]["id"], []):
                for b in c["bones"]:
                    if b["name"] not in allowed:
                        allowed.append(b["name"])
                    if b["parent"] in col and b["parent"] not in allowed:
                        allowed.append(b["parent"])
        if not alpha[reg_rows].any():
            continue
        rules["regions"][f"garment_{pc['id']}"] = {"vertex_ids": reg_rows.tolist(), "allowed": allowed}
    rep["rows_overlay"] = int((alpha > 0).sum())
    rep["rows_band"] = int(((alpha > 0) & (alpha < 1)).sum())
    rep["inner_rows"] = int(((oref >= 0) & (piece >= 0)).sum())
    rep["inner_interpolated"] = int(inner_upd.sum())
    return list(bones.names), W, alpha, rules, rep


def chained_groups(garr: dict, alpha_w) -> list:
    """Groups (``groups_of``) with an overlay from chains, read from ``alpha``: those with transition-band rows (rigid items are
    1.0 everywhere and have none)."""
    g_ = groups_of(garr)
    a = np.asarray(alpha_w, float)
    return sorted({int(x) for x in np.unique(g_[(a > 0) & (a < 1.0 - 1e-12) & (g_ >= 0)])})


def cloth_junction_hops(topo, garr: dict, chained, band_rings: int = BAND_RINGS) -> np.ndarray:
    """Hops (``band_rings + 1`` = none) of every chained-group row from the rows of its group that touch ANOTHER chained group
    (cloth on cloth junction, e.g. FL robe rows riding on the apron next to robe rows on the robe chains)."""
    grp = groups_of(garr)
    in_ch = np.isin(grp, list(chained))
    e = topo.edges
    out = np.full(topo.n_w, band_rings + 1, np.int64)
    for g in chained:
        member = grp == g
        x = member[e[:, 0]] != member[e[:, 1]]
        ins = np.where(member[e[x, 0]], e[x, 0], e[x, 1])
        outs = np.where(member[e[x, 0]], e[x, 1], e[x, 0])
        j = np.zeros(topo.n_w, bool)
        j[ins[in_ch[outs]]] = True
        if j.any():
            h = sc.bfs_hops(topo, j, member, band_rings)
            out[member] = np.minimum(out[member], h[member])
    return out


def chained_parent(pc, chs, col, bones) -> str:
    """Parent bone of a chained piece: its first chain's root parent, else the piece's parent, else pelvis."""
    for c in chs:
        p = c["bones"][0].get("parent")
        if p in col:
            return p
    p = pc.get("parent") or (pc.get("attach") or {}).get("bone")
    return p if p in col else ("pelvis" if "pelvis" in col else bones.names[0])


def _attach_ids(pc, topo, allrows):
    """Welded ids of the piece's attachment line: its rows nearest to the recorded attachment points (garments.json)."""
    pts = np.asarray((pc.get("attach") or {}).get("points") or [], float).reshape(-1, 3)
    if pts.size == 0:
        z = topo.P[allrows, 2]
        return allrows[z >= z.max() - 1e-9]
    ids = sc.match_positions(topo.P[allrows], pts, tol=1e9)
    return np.unique(allrows[ids[ids >= 0]])


def to_full(topo, W, alpha):
    """Welded overlay -> per original vertex (seam duplicates identical)."""
    return np.asarray(topo.scatter(W), np.float32), np.asarray(topo.scatter(alpha), np.float32)


def save(path_npz, path_rules, bones, W_full, alpha_full, rules, meta: dict) -> None:
    meta = dict(meta)
    meta.setdefault("schema", 0)
    npzio._atomic_write(path_npz, lambda f: np.savez_compressed(
        f, bones=np.array(bones), W=np.asarray(W_full, np.float32), alpha=np.asarray(alpha_full, np.float32),
        meta=np.array(json.dumps(meta, sort_keys=True))))
    npzio.write_json(path_rules, rules)


def load(path_npz) -> dict:
    with np.load(os.fspath(path_npz), allow_pickle=False) as z:
        d = {k: z[k] for k in z.files}
    d["meta"] = json.loads(str(d["meta"]))
    d["bones"] = [str(b) for b in d["bones"]]
    return d


# --------------------------------------------------------------------------------------------------------------------------
# S7: blend + finish
# --------------------------------------------------------------------------------------------------------------------------


def merge_rules(asset_rules: dict | None, garment_rules: dict | None) -> dict:
    """Asset skin rules + the garment fragment (regions and rigid entries added; asset entries win on a name clash)."""
    out = json.loads(json.dumps(asset_rules or {}))
    g = garment_rules or {}
    for key in ("regions", "rigid"):
        cur = dict(out.get(key) or {})
        for nm, spec in (g.get(key) or {}).items():
            cur.setdefault(nm, spec)
        if cur:
            out[key] = cur
    return out


def garment_setup(mesh: dict, skel_merged: dict, asset_rules: dict | None, garment_rules: dict | None):
    """``skin_rules.prepare`` on the merged skeleton with the garment fragment merged into the asset rules."""
    from solvers import skin_rules as sr

    rules = merge_rules(asset_rules, garment_rules)
    return sr.prepare(mesh, skel_merged, rules), rules


def _to_cols(X, names, cols, n_rows):
    if isinstance(X, dict):
        names, X = [str(b) for b in X["bones"]], X["W"]
    X = np.asarray(X, float)
    if names is None:
        if X.shape[1] != len(cols):
            raise ValueError("apply_overlay: weights without bone names must have one column per setup column")
        return X
    out = np.zeros((X.shape[0], len(cols)))
    idx = {n: i for i, n in enumerate(cols)}
    for j, nm in enumerate(names):
        if nm in idx:
            out[:, idx[nm]] = X[:, j]
        elif np.abs(X[:, j]).max() > 0:
            raise ValueError(f"apply_overlay: bone {nm!r} carries weight but is not a column of the setup")
    return out


def profile_rows(alpha_w) -> np.ndarray:
    """Rows whose weights the joint profiles of ``finish`` may replace: every row except the transition band (0 < alpha < 1).
    The band keeps the blend of the neighbouring body rows' finished weights; a knee profile re-splitting thigh/calf there
    (by the cloth row's own position) re-made a 0.6-0.7 step next to the leg skin on FL."""
    a = np.asarray(alpha_w, float)
    return ~((a > 0) & (a < 1.0 - 1e-12))


def inner_rows_full(garr: dict, alpha_w, topo=None, band_rings: int = BAND_RINGS) -> np.ndarray:
    """Inner rows (``outer_ref >= 0``) where the overlay is complete (alpha = 1) and that lie outside a cloth/cloth junction
    band (``cloth_junction_hops``, needs ``topo``): they follow the outer surface after finish."""
    piece = np.asarray(garr["piece"], np.int64)
    oref = np.asarray(garr["outer_ref"], np.int64)
    a = np.asarray(alpha_w, float)
    out = (oref >= 0) & (piece >= 0) & (a >= 1.0 - 1e-12)
    if topo is not None and out.any():
        g_ = groups_of(garr)
        chained = chained_groups(garr, a)
        out &= cloth_junction_hops(topo, garr, chained, band_rings) >= band_rings
    return out


def inner_step(W, topo, imap, upd, cons=None, group=None) -> np.ndarray:
    """Inner rows ``upd`` re-made from the (finished) outer surface: ``fill_inner`` (same-group neighbours) then ``enforce``
    (fold, top-k, prune, normalize; the other rows are already a fixed point of enforce)."""
    X = fill_inner(W, imap, topo, upd, group=group)
    if cons is not None:
        X, _ = sc.enforce(X, cons)
    return X


def apply_overlay(body_W, overlay_d: dict, rules: dict, setup, skel_merged: dict | None = None, garr: dict | None = None):
    """S7: W = (1 - alpha) body + alpha overlay, then ``skin_rules.finish`` (profiles + enforce to a fixed point) with the garment
    regions in ``setup`` (build it with ``garment_setup``), then the inner-layer rows with a complete overlay re-made from the
    finished outer surface (``inner_step``) and the invariants checked. ``body_W``: weights dict {bones, W} (per vertex or
    welded) or an array in setup column order; ``overlay_d``: garment_overlay.npz dict {bones, W, alpha}; ``garr``: garments.npz
    dict (for outer_ref). Returns (W welded float64, report)."""
    from solvers import skin_rules as sr

    topo = setup.topo
    cols = setup.bones.names
    bw = body_W if isinstance(body_W, dict) else {"bones": None, "W": body_W}
    B = _to_cols(bw["W"], bw["bones"], cols, None)
    if B.shape[0] == topo.n:
        B = topo.gather(B, how="first")
    O = _to_cols(overlay_d["W"], overlay_d["bones"], cols, None)
    a = np.asarray(overlay_d["alpha"], float)
    if O.shape[0] == topo.n:
        O = topo.gather(O, how="first")
        a = topo.gather(a, how="first")
    n_fill = 0
    if garr is not None:
        g_ = groups_of(garr)
        chained = chained_groups(garr, a)
        B, n_fill = band_body(B, topo, garr, a, chained)
    W = (1.0 - a)[:, None] * B + a[:, None] * O
    skel = skel_merged if skel_merged is not None else {"skin": {}}
    Wf, rep = sr.finish(W, setup, skel, rules, rows=profile_rows(a))
    rep["band_from_junction"] = n_fill
    n_inner = 0
    if garr is not None:
        upd = inner_rows_full(garr, a, topo)
        n_inner = int(upd.sum())
        if upd.any():
            Wf = inner_step(Wf, topo, inner_map(topo, garr), upd, setup.cons, groups_of(garr))
        rep["inner_copy"] = sc.check_invariants(Wf, setup.cons)
    rep["inner_rows"] = n_inner
    return Wf, rep


LEG_BASES = ("Thigh", "Calf", "Foot", "Toe")
BLEED_TOL = 1e-4  # = metrics.EXPORT_MIN_WEIGHT: the smallest weight the glTF exporter keeps
BLEED_DEFINITION = ("rows judged by the piece they move with (outer_ref's piece for inner-layer rows; tight pieces are body) "
                    "whose weight on chain bones of another piece is above 1e-4")


def bleed(W, cols, piece, outer_ref, bone_piece: dict, skip=(), tol: float = BLEED_TOL) -> dict:
    """``garment_bleed``, the one definition of ``check_overlay`` and ``metrics.garment_weights`` (review r1 M5): welded rows
    judged by the piece they move with (``groups_of``: the ``outer_ref``'s piece for inner-layer rows; pieces in ``skip``, the
    tight ones, are body) whose summed weight on the chain bones of ANOTHER piece (``bone_piece``: bone -> piece index) is above
    ``tol``. Returns {"rows", "max", "mask" (n,), "judge" (n,)}."""
    W = np.asarray(W, float)
    judge = groups_of({"piece": piece, "outer_ref": outer_ref})
    if len(skip):
        judge = np.where(np.isin(judge, list(skip)), -1, judge)
    w = np.zeros(len(W))
    for c, b in enumerate(cols):
        k = bone_piece.get(str(b))
        if k is None:
            continue
        other = (judge >= 0) & (judge != k)
        w[other] += W[other, c]
    mask = w > tol
    return {"rows": int(mask.sum()), "max": float(w.max()) if len(w) else 0.0, "mask": mask, "judge": judge}


def _jstats(J, m) -> dict:
    x = J[m]
    if not x.size:
        return {"edges": 0, "max": 0.0, "p95": 0.0, "p99": 0.0, "n_over_limit": 0}
    return {"edges": int(x.size), "max": float(x.max()), "p95": float(np.percentile(x, 95)),
            "p99": float(np.percentile(x, 99))}


def body_baseline(W, topo, body_e, rigid=None, tol: float = 1e-6) -> np.ndarray:
    """Body edges (bool over ``topo.edges``) that measure the smooth skin's own jump (G7): ``body_e`` without edges that touch a
    rigid row (``rigid``: rows locked to one bone by a rule, e.g. ``setup.cons.rigid_col >= 0``; and every row of a rigid island,
    an island whose rows all carry one and the same bone at 1.0) and without edges between two rows locked to different bones (the
    seam between two rigid parts). With a body p99 of 1.0 (G4 fixture: shoulder rows with disjoint bone sets) the limit was 1.0
    and a planted 1.0 seam showed only by float noise; ``continuity`` also caps the limit (``JUMP_CAP``)."""
    W = np.asarray(W, float)
    a, b = topo.edges[:, 0], topo.edges[:, 1]
    lock = W.max(1) >= 1.0 - tol
    lb = np.where(lock, W.argmax(1), -1)
    rig = np.zeros(topo.n_w, bool) if rigid is None else np.asarray(rigid, bool).copy()
    isl = np.asarray(topo.island, np.int64)
    n_isl = int(isl.max()) + 1 if isl.size else 0
    lo = np.full(n_isl, np.iinfo(np.int64).max)
    hi = np.full(n_isl, -2)
    np.minimum.at(lo, isl, lb)
    np.maximum.at(hi, isl, lb)
    rig |= ((lo == hi) & (lo >= 0))[isl]  # every row of the island locked to the same bone
    return body_e & ~rig[a] & ~rig[b] & ~(lock[a] & lock[b] & (lb[a] != lb[b]))


def continuity(W, topo, garr: dict, chained_pieces, imap=None, limit: float = JUMP_LIMIT, follow=None, alpha=None, rigid=None,
               cap: float = JUMP_CAP) -> dict:
    """Edge-continuity check (review r1 B1/M2): weight jump ``0.5 * |W_a - W_b|_1`` across welded edges.

    - ``body``: both ends body rows (piece -1), reported; ``body_baseline``: those of the smooth skin (``body_baseline``: no rigid
      row, island or rigid/rigid seam; ``rigid`` = rule-rigid rows), the baseline (p95, p99);
    - ``border``: one end in a chained piece's group (``groups_of``), the other outside it (body, tight cloth, unchained pieces);
      an edge counts as a seam when its jump is above the limit AND above the body's own jump at that cloth row (``body_ref``:
      the largest jump between two outside rows that touch the same cloth row; e.g. FL robe rows that touch the left and the
      right calf skin, or a thigh/calf skin seam: no cloth weight can be closer than about half of it to both);
    - ``piece_piece``: the two ends in different chained groups (reported);
    - ``garment``: both ends in the same chained group (reported); ``band``: those with both ends in the transition band
      (``alpha`` given; reported); ``inner``: those with an inner-layer end. An inner edge counts as a seam when one end is an
      inner row that follows the outer surface (``follow``, ``inner_rows_full``; all inner rows without it), its jump is above
      the limit, and the outer surface between the two closest points is not (the jump of the interpolated outer weights is
      within the limit). Band rows ramp from the body to the overlay and are not layer seams.
    The limit is ``min(max(limit, baseline p99), cap)``. ``ok``: no border seam and no inner seam edge."""
    W = np.asarray(W, float)
    grp = groups_of(garr)
    oref = np.asarray(garr["outer_ref"], np.int64)
    piece = np.asarray(garr["piece"], np.int64)
    ch = np.isin(grp, list(chained_pieces))
    a, b = topo.edges[:, 0], topo.edges[:, 1]
    J = 0.5 * np.abs(W[a] - W[b]).sum(1)
    body = (piece[a] < 0) & (piece[b] < 0)
    same = ch[a] & ch[b] & (grp[a] == grp[b])
    border = (ch[a] | ch[b]) & ~same & ~(ch[a] & ch[b])
    pp = ch[a] & ch[b] & (grp[a] != grp[b])
    inner_e = same & ((oref[a] >= 0) | (oref[b] >= 0))
    bs = _jstats(J, body)
    base = _jstats(J, body_baseline(W, topo, body, rigid))
    lim = min(max(float(limit), base["p99"]), float(cap))
    out = {"limit": lim, "body": bs, "body_baseline": base, "border": _jstats(J, border), "piece_piece": _jstats(J, pp),
           "garment": _jstats(J, same), "inner": _jstats(J, inner_e)}
    for key, m in (("border", border), ("piece_piece", pp), ("garment", same), ("inner", inner_e)):
        out[key]["n_over_limit"] = int((J[m] > lim).sum())
    # body reference per cloth row: max jump between two outside rows around it (W of the outside rows)
    gi = np.where(ch[a] & ~ch[b], a, b)[border]
    go = np.where(ch[a] & ~ch[b], b, a)[border]
    ref = np.zeros(len(J))
    if gi.size:
        order = np.argsort(gi, kind="stable")
        gi_s, go_s = gi[order], go[order]
        starts = np.flatnonzero(np.r_[True, gi_s[1:] != gi_s[:-1]])
        ends = np.r_[starts[1:], gi_s.size]
        row_ref = {}
        for s0, s1 in zip(starts, ends):
            o = go_s[s0:s1]
            if o.size > 1:
                Wo = W[o]
                row_ref[int(gi_s[s0])] = float((0.5 * np.abs(Wo[:, None, :] - Wo[None, :, :]).sum(2)).max())
        bidx = np.flatnonzero(border)
        ref[bidx] = [row_ref.get(int(r), 0.0) for r in gi]
    bseam = border & (J > lim) & (J > ref + 1e-9)
    out["border"]["seam_edges"] = int(bseam.sum())
    out["border"]["over_limit_body_ref_max"] = float(ref[border & (J > lim)].max()) if (border & (J > lim)).any() else 0.0
    fl = (oref >= 0) if follow is None else np.asarray(follow, bool)
    if alpha is not None:
        aw = np.asarray(alpha, float)
        bnd = (aw > 0) & (aw < 1.0 - 1e-12)
        out["band"] = _jstats(J, same & bnd[a] & bnd[b])
        out["band"]["n_over_limit"] = int((J[same & bnd[a] & bnd[b]] > lim).sum())
    seam = inner_e & (J > lim) & (fl[a] | fl[b])  # without the inner map every such edge above the limit counts
    if imap is not None and inner_e.any():
        loc = np.full(topo.n_w, -1, np.int64)
        loc[imap["rows"]] = np.arange(imap["rows"].size)
        # outer-surface value at each end: the row itself for outer rows, its closest outer point for inner rows
        V = np.array(W, copy=True)
        if imap["rows"].size:
            V[imap["rows"]] = interp_inner(W, imap)
        Jo = 0.5 * np.abs(V[a] - V[b]).sum(1)
        seam = inner_e & (J > lim) & (Jo <= lim) & (fl[a] | fl[b])
        out["inner"]["outer_surface_jump_p95"] = float(np.percentile(Jo[inner_e], 95)) if inner_e.any() else 0.0
    out["inner"]["seam_edges"] = int(seam.sum())
    out["ok"] = bool(out["border"]["seam_edges"] == 0 and out["inner"]["seam_edges"] == 0)
    return out


def check_overlay(W, cols, garments: dict, garr: dict, chains: dict, topo, setup=None, rules=None, skel=None, tol: float = 1e-6,
                  alpha=None):
    """Garment invariants of welded weights ``W`` (n_w, k) over ``cols``: row sums, influences, ``garment_bleed`` (weight of
    another piece's chain bones on a piece's rows; an inner row is judged against the piece of its ``outer_ref``), leg weight
    (thigh/calf/foot/toe) on hanging rows where the overlay is complete (rows of non-tight pieces with ``alpha`` = 1, welded;
    without ``alpha`` every hanging row; band rows keep their body bones and are reported separately), inner rows following the
    outer surface (``inner_step`` of ``W`` changes nothing; the old copy difference to the ``outer_ref`` row is reported), the
    edge continuity (``continuity``), and with ``setup`` the idempotency of ``finish`` + ``inner_step`` (max change). Returns a
    JSON-able dict; ``ok`` when every number is in range."""
    W = np.asarray(W, float)
    piece = np.asarray(garr["piece"], np.int64)
    oref = np.asarray(garr["outer_ref"], np.int64)
    pieces = garments.get("pieces", [])
    idx = {n: i for i, n in enumerate(cols)}
    own = {}
    for c in chains.get("chains", []):
        own.setdefault(c["piece"], set()).update(idx[b["name"]] for b in c["bones"] if b["name"] in idx)
    pid_index = {p["id"]: k for k, p in enumerate(pieces)}
    bone_piece = {b["name"]: pid_index.get(c["piece"]) for c in chains.get("chains", []) for b in c["bones"]}
    bl = bleed(W, cols, piece, oref, {b: k for b, k in bone_piece.items() if k is not None},
               skip=[k for k, p in enumerate(pieces) if p["class"] == "tight"])
    bleed_rows, bleed_max = bl["rows"], bl["max"]
    leg = [i for n, i in idx.items() if sc.limb_base(n) in LEG_BASES]
    hang = np.zeros(len(W), bool)
    for pi, pc in enumerate(pieces):
        if pc["class"] != "tight":
            hang |= piece == pi
    a_w = np.ones(len(W)) if alpha is None else np.asarray(alpha, float)
    full = a_w >= 1.0 - 1e-12
    hf = hang & full
    leg_w = float(W[np.ix_(np.flatnonzero(hf), leg)].max()) if (hf.any() and leg) else 0.0
    hb = hang & ~full & (a_w > 0)
    leg_band = float(W[np.ix_(np.flatnonzero(hb), leg)].sum(1).max()) if (hb.any() and leg) else 0.0
    inner = np.flatnonzero(oref >= 0)
    inner_diff = float(np.abs(W[inner] - W[oref[inner]]).max()) if inner.size else 0.0
    imap = inner_map(topo, garr)
    upd = inner_rows_full(garr, a_w, topo)
    cons = setup.cons if setup is not None else None
    follow = 0.0
    if upd.any():
        X = inner_step(W, topo, imap, upd, cons, groups_of(garr))
        follow = float(np.abs(X - W)[upd].max())
    loc = np.full(topo.n_w, -1, np.int64)
    loc[imap["rows"]] = np.arange(imap["rows"].size)
    interp_diff = float(np.abs(W[imap["rows"]] - interp_inner(W, imap)).sum(1).max() * 0.5) if imap["rows"].size else 0.0
    chained_idx = [k for k, p in enumerate(pieces) if p["id"] in own and own[p["id"]]]
    rig = None if (setup is None or getattr(setup.cons, "rigid_col", None) is None) else np.asarray(setup.cons.rigid_col) >= 0
    cont = continuity(W, topo, garr, chained_idx, imap, follow=upd, alpha=None if alpha is None else a_w, rigid=rig)
    nnz = (W > 0).sum(1)
    out = {"rows": int(len(W)), "sum_err_max": float(np.abs(W.sum(1) - 1).max()), "max_influences": int(nnz.max()),
           "garment_bleed_rows": bleed_rows, "garment_bleed_max": bleed_max, "hanging_rows": int(hang.sum()),
           "hanging_rows_full": int(hf.sum()), "band_rows": int(hb.sum()), "leg_weight_on_hanging_max": leg_w,
           "leg_weight_on_band_max": leg_band, "inner_rows": int(inner.size), "inner_follow_rows": int(upd.sum()),
           "inner_follow_diff_max": follow, "inner_interp_jump_max": interp_diff, "inner_outer_copy_diff_max": inner_diff,
           "continuity": cont}
    if setup is not None:
        from solvers import skin_rules as sr

        W2, _ = sr.finish(W, setup, skel or {"skin": {}}, rules, rows=profile_rows(a_w))
        if upd.any():
            W2 = inner_step(W2, topo, imap, upd, cons, groups_of(garr))
        out["idempotent_change_max"] = float(np.abs(W2 - W).max())
    out["ok"] = bool(out["sum_err_max"] <= tol and out["max_influences"] <= 4 and bleed_rows == 0 and leg_w == 0.0
                     and follow <= tol and out.get("idempotent_change_max", 0.0) <= tol and cont["ok"])
    return out


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="S6/S7 garment overlay -> garment_overlay.npz + garment_rules.json (G1)")
    ap.add_argument("--mesh", required=True)
    ap.add_argument("--garments", required=True, help="garments.json (garments.npz next to it)")
    ap.add_argument("--chains", required=True, help="chains.json")
    ap.add_argument("--skeleton", required=True, help="resolved skeleton.json (family bones; chains are merged here)")
    ap.add_argument("--weights", help="selected body weights.npz: with it, also write the blended + finished weights")
    ap.add_argument("--rules", help="asset skin_rules.json (merged with the garment fragment for --weights)")
    ap.add_argument("--out", required=True, help="output folder")
    a = ap.parse_args(argv)
    from solvers import chains as ch
    from solvers import garments as gm

    mesh = npzio.load_mesh(a.mesh)
    g = npzio.read_json(a.garments)
    garr = gm.load_npz(os.path.splitext(a.garments)[0] + ".npz")
    chs = npzio.read_json(a.chains)
    skel = ch.merge_chains(npzio.read_json(a.skeleton), chs)
    names, W, alpha, rules, rep = overlay(mesh, g, garr, chs, skel)
    topo = sc.weld_topo(mesh)
    Wf, af = to_full(topo, W, alpha)
    os.makedirs(a.out, exist_ok=True)
    save(os.path.join(a.out, "garment_overlay.npz"), os.path.join(a.out, "garment_rules.json"), names, Wf, af, rules,
         {"asset_id": g.get("asset_id"), "pieces": rep["pieces"]})
    out = {"rows_overlay": rep["rows_overlay"], "rows_band": rep["rows_band"], "inner_rows": rep["inner_rows"]}
    if a.weights:
        body = npzio.load_weights(a.weights)
        asset_rules = npzio.read_json(a.rules) if a.rules else {}
        setup, merged = garment_setup(mesh, skel, asset_rules, rules)
        Wb, frep = apply_overlay({"bones": [str(b) for b in body["bones"]], "W": body["W"]},
                                 {"bones": names, "W": Wf, "alpha": af}, merged, setup, skel, garr)
        npzio.save_weights(os.path.join(a.out, "weights_garment.npz"), setup.bones.names, sc.to_full(Wb, setup.topo),
                           meta={"candidate": "garment_overlay", "params": {"rounds": frep["rounds"]["rounds"]}})
        out["finish_rounds"] = frep["rounds"]["rounds"]
        out["converged"] = frep["rounds"]["converged"]
        chk = check_overlay(Wb, setup.bones.names, g, garr, chs, setup.topo, setup, merged, skel,
                            alpha=setup.topo.gather(np.asarray(af, float), how="first"))
        chk["seam_max_diff"] = sc.seam_max_diff(sc.to_full(Wb, setup.topo), mesh["weld"])
        chk["limb_leak"] = frep["limb_leak"]["rows"]
        npzio.write_json(os.path.join(a.out, "overlay_check.json"), chk)
        out["check"] = {k: v for k, v in chk.items() if k not in ("limb_leak", "continuity")}
        out["check"]["continuity_ok"] = chk["continuity"]["ok"]
    print(json.dumps(out))
    return 0


if __name__ == "__main__":
    sys.exit(main())
