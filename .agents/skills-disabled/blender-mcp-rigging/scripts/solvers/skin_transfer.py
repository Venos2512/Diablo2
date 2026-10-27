"""solvers.skin_transfer - skin candidate B "proxy + transfer + inpaint" (owner B, P3). Runs in rigkit-env (numpy, scipy, libigl).

1. **Proxy**: watertight one-component voxel proxy of the welded mesh (``proxy.build_proxy``).
2. **Heat weights on the proxy** (Pinocchio, Baran & Popovic 2007; what Blender's bone heat solves): for every bone j solve
   ``(-L + M Hd) w_j = M Hd p_j`` with L the cotangent Laplacian and M the lumped (Voronoi) mass matrix of the proxy,
   ``p_ij = 1/c_i`` for the c_i bones nearest to proxy vertex i among those *visible* from it (straight segment to the closest point
   of the bone stays inside the voxel solid, ``proxy.segment_visible``) and *allowed* for it, and ``Hd_ii = c_i / d_i^2`` with d_i
   that distance (0 when no bone qualifies). "Allowed" = the hard constraints (side gate, region lists, rigid islands) of the
   original welded vertex nearest to the proxy vertex, so the heat sources already respect what ``enforce`` would fold later
   (Blender's bone heat has no such notion: aux bones inside the head/sack would otherwise win whole body regions; D01 dominant
   agreement with G2 rose from 83.7 % to 85.5 %). Coordinates are divided by H first and the distance floor is 1e-4 H, so there is
   no absolute epsilon and no x10 rescaling for small assets (research/01 Q4; skinning.md asks for x10 scaling below about 1 m:
   working in units of H is the same fix for every size, a deviation in form only). The system is symmetric positive definite; one
   sparse LU factorization solves all bones. The rows sum to 1 by construction (L 1 = 0); tiny negatives from obtuse triangles
   are clamped.

   Why heat and not geodesic voxel binding: the proxy is closed and manifold by construction, which is exactly what bone heat
   needs; heat gives smooth partition-of-unity weights with natural joint blends and no falloff parameter, whereas geodesic voxel
   binding needs a tuned distance falloff and is only as smooth as the voxel grid. Visibility, the usual weak point of bone heat,
   is an O(1) voxel lookup here.
2b. **Limb envelope** (skinning.md "Candidate B limb envelope", review B r3): where the voxel proxy fuses a limb with the torso
   (sleeves and arms against a robe, legs inside a robe) the heat of a limb root diffuses into the torso: FL had upper-arm weight
   up to 0.59 on the chest and belly and thigh weight on the belly (limb leak 677 welded rows), D01 96 rows. The raw heat of
   each limb root's unit is multiplied by a smooth factor before the rows are clamped and normalized
   (``skin_profiles.apply_limb_envelope``, shared with candidate A's generic path; ``heat_weights``); the removed mass goes to the
   row's other bones in proportion:

       e(X) = (1 - S((d/L - d0) / (d1 - d0))) x (1 - S((h/L - h0) / (h1 - h0))),   S = smoothstep 3x^2 - 2x^3 on [0, 1]

   d = distance from X to the root's segment, h = height of X above the root's head joint along the bone axis
   ((X - head) . (head - tail) / L), L = segment length. ``ENVELOPE`` (``params["envelope"]``, rules ``candidate_b.envelope``;
   {} or None = off): UpperArm (+ its twist bones) d in [0.5, 0.75] L - the arm's own surface lies within 0.5 L on D01 and
   FL, and the falloff ends at the 0.75 L of the leak metric; Thigh d in [0.75, 1.25] L (robes keep their thigh weight) and
   h in [0.1, 0.3] L: FL's thigh leak sits 0.31-0.71 L from the thigh segment but 0.3-0.62 L above the hip joint, where no
   distance term reaches it, and G2 / FL candidate C keep thigh weight only up to 0.28 L above the joint. Other bones (forearm,
   hand, calf, foot, toes, aux) are untouched: approved rigs carry legitimate long-range weight there (mitten hands, toes,
   robes). The factor is C1 in position, so it adds no weight step; it is not a gate in ``enforce``.
3. **Robust Skin Weights Transfer** (Abdrashitov et al. 2023): every original welded vertex whose closest proxy point lies within
   ``dist_H`` x H and whose normal is within ``max_angle_deg`` (35 deg) of the proxy normal there (vertex normals interpolated at
   the closest point, so a closest point on an edge does not depend on which face the query returns: ``proxy.map_points``)
   copies the barycentric interpolation of the proxy weights; the rest is **inpainted** by minimizing ``w^T (-L + L M^-1 L) w``
   per bone with the copied rows fixed (cotangent L, lumped M of the welded original mesh, sparse LU). Sum = 1 holds by
   construction (Q 1 = 0); w >= 0 is restored by clamping and renormalizing. This is a deviation from RSWT and skinning.md, which
   minimize with w >= 0 as a constraint (a quadratic program): the clamp is one sparse solve instead of a QP per bone, and what
   it discards is reported (``inpaint.min_before_clamp``, ``inpaint.negative_mass``). Islands without any copied vertex fall back
   to the raw closest-point transfer.
3b. The limb envelope again on the welded rows (``mesh_envelope``): the inpaint fills the rows it did not copy from their copied
   neighbours and can carry limb weight past the envelope (FL: 4 inpainted belly rows kept 0.10-0.12 thigh / upper-arm weight
   after the proxy stage alone). Same factors at the welded positions, rows renormalized; reported as ``envelope_mesh``.
4. Joint profiles and ``enforce`` with the asset's rules (side gate from the skeleton's planes, region lists, rigid islands,
   top-4, prune, normalize, influence caps; ``skin_rules.finish``).

CLI::

    python -I solvers/skin_transfer.py --mesh mesh.npz --skeleton skeleton.json [--rules skin_rules.json] --out weights.npz

Units: metres (solver internals in units of H). Frame: Blender, Z up, front -Y, left +X.
"""
from __future__ import annotations

import argparse
import os
import sys
import time

if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
import igl
import scipy.sparse as sp
import scipy.sparse.linalg as spla
from scipy.spatial import cKDTree

from rigcore import npzio, template

from solvers import proxy as px
from solvers import skin_common as sc
from solvers import skin_profiles as prof
from solvers import skin_rules

CANDIDATE = "B_transfer"
#: limb envelope of steps 2b / 3b: ``skin_profiles.LIMB_ENVELOPE``, shared with candidate A's generic path (I4). The names
#: ``ENVELOPE``, ``limb_envelope`` and ``normalize_heat`` stay here for the callers and tests of candidate B.
ENVELOPE = prof.LIMB_ENVELOPE
limb_envelope = prof.limb_envelope
normalize_heat = prof.normalize_rows
DEFAULTS = {"res": 128, "dist_H": 0.02, "max_angle_deg": 35.0, "heat_eps_H": 1e-4, "tie_rel": 1e-3, "constrained_sources": True,
            "envelope": ENVELOPE}


# --------------------------------------------------------------------------------------------------------------------------
# operators
# --------------------------------------------------------------------------------------------------------------------------


def laplacian_mass(X, F):
    """Cotangent Laplacian L (negative semi-definite, rows sum to 0) and lumped Voronoi mass M of (X, F) with non-finite entries
    from degenerate triangles removed. Returns (L csr, m (n,) diagonal of M)."""
    X = np.asarray(X, dtype=np.float64)
    F = np.asarray(F, dtype=np.int64)
    L = sp.csr_matrix(igl.cotmatrix(X, F))
    L.data[~np.isfinite(L.data)] = 0.0
    L.setdiag(0.0)
    L.eliminate_zeros()
    L = L - sp.diags(np.asarray(L.sum(axis=1)).ravel())
    m = np.asarray(igl.massmatrix(X, F, igl.MASSMATRIX_TYPE_VORONOI).diagonal()).ravel()
    bad = ~np.isfinite(m) | (m <= 0)
    if bad.any():
        pos = m[~bad]
        m[bad] = pos.min() if pos.size else 1.0
    return sp.csr_matrix(L), m


def bone_segments(bones: sc.BoneSet, scale: float):
    return bones.head / scale, bones.tail / scale


def closest_on_segments(Q, A, B):
    """Q (n,3), segments A,B (k,3) -> distances (n,k) and closest points (n,k,3)."""
    AB = B - A
    den = np.maximum((AB * AB).sum(1), 1e-30)
    t = np.clip(np.einsum("nkd,kd->nk", Q[:, None, :] - A[None, :, :], AB) / den[None, :], 0.0, 1.0)
    C = A[None, :, :] + t[:, :, None] * AB[None, :, :]
    return np.linalg.norm(Q[:, None, :] - C, axis=2), C


def mesh_envelope(topo: sc.WeldTopo, bones: sc.BoneSet, W, spec=None):
    """The limb envelope on welded mesh rows ``W`` (n_w,k) after transfer + inpaint (module docstring step 3b):
    ``skin_profiles.apply_limb_envelope`` at the welded positions (a row the envelope would empty keeps its weights). Returns (W,
    info: rows changed, largest / mean moved mass, rows kept)."""
    return prof.apply_limb_envelope(W, topo.P, bones, spec)


def heat_solve(proxy: px.Proxy, bones: sc.BoneSet, H: float, eps_H: float = 1e-4, tie_rel: float = 1e-3, chunk: int = 20000,
               allowed=None):
    """The bone heat solve on the proxy (module docstring step 2) before any clamping or normalization: (W (p,k), info). Rows
    sum to 1 up to the solver's precision (``info["sum_err_raw"]``)."""
    t0 = time.time()
    X = proxy.V / H
    A, B = bone_segments(bones, H)
    p, k = len(X), bones.k
    nearest = np.zeros((p, k))
    dstar = np.full(p, np.nan)
    for i0 in range(0, p, chunk):
        sl = slice(i0, i0 + chunk)
        D, C = closest_on_segments(X[sl], A, B)
        if allowed is not None:
            D = np.where(allowed[sl], D, np.inf)
        order = np.argsort(D, axis=1, kind="stable")
        resolved = np.zeros(D.shape[0], bool)
        best = np.full(D.shape[0], np.inf)
        for r in range(k):
            todo = np.flatnonzero(~resolved & np.isfinite(D[np.arange(D.shape[0]), order[:, r]]))
            if todo.size == 0:
                break
            j = order[todo, r]
            vis = px.segment_visible(proxy, X[sl][todo] * H, C[todo, j] * H)
            hit = todo[vis]
            resolved[hit] = True
            best[hit] = D[hit, order[hit, r]]
        # all visible bones within the tie tolerance of the nearest visible one
        tie = (D <= best[:, None] * (1.0 + tie_rel) + 1e-12) & np.isfinite(best)[:, None]
        cand = np.argwhere(tie)
        if cand.size:
            vis = px.segment_visible(proxy, X[sl][cand[:, 0]] * H, C[cand[:, 0], cand[:, 1]] * H)
            cand = cand[vis]
            nearest[sl][cand[:, 0], cand[:, 1]] = 1.0
        dstar[sl] = np.where(np.isfinite(best), best, np.nan)
    cnt = nearest.sum(1)
    ok = cnt > 0
    Pm = np.zeros_like(nearest)
    Pm[ok] = nearest[ok] / cnt[ok, None]
    Hd = np.zeros(p)
    Hd[ok] = cnt[ok] / np.maximum(dstar[ok], eps_H) ** 2
    L, m = laplacian_mass(X, proxy.F)
    Amat = (-L + sp.diags(m * Hd)).tocsc()
    rhs = (m * Hd)[:, None] * Pm
    t1 = time.time()
    lu = spla.splu(Amat)
    W = lu.solve(rhs)
    info = {"proxy_vertices": int(p), "no_visible_bone": int((~ok).sum()), "ties": int((cnt > 1).sum()),
            "min_raw": float(W.min()), "max_raw": float(W.max()), "sum_err_raw": float(np.abs(W.sum(1) - 1).max()),
            "solve_s": round(time.time() - t1, 2), "seconds": round(time.time() - t0, 2)}
    return W, info


def heat_weights(proxy: px.Proxy, bones: sc.BoneSet, H: float, eps_H: float = 1e-4, tie_rel: float = 1e-3, chunk: int = 20000,
                 allowed=None, envelope=None):
    """Bone heat on the proxy (module docstring steps 2 and 2b): ``heat_solve``, then the limb envelope (``envelope`` = an
    ``ENVELOPE``-like spec; None or {} = off) on the raw heat, then clamp and row-normalize (rows the envelope would empty keep the
    plain heat). ``allowed`` (p,k) bool restricts the heat sources per proxy vertex. Returns (W (p,k), info)."""
    t0 = time.time()
    raw, info = heat_solve(proxy, bones, H, eps_H, tie_rel, chunk, allowed)
    if envelope:
        Wn, info["envelope"] = prof.apply_limb_envelope(raw, proxy.V, bones, envelope)
    else:
        Wn, _ = normalize_heat(raw)
        info["envelope"] = None
    info["seconds"] = round(time.time() - t0, 2)
    return Wn, info


# --------------------------------------------------------------------------------------------------------------------------
# inpainting
# --------------------------------------------------------------------------------------------------------------------------


def inpaint(topo: sc.WeldTopo, W, known, H: float, energy: str = "rswt"):
    """Fill the rows of ``W`` (n_w,k) where ``known`` is False by minimizing sum_j w_j^T Q w_j with the known rows fixed (welded
    topology of ``topo``, coordinates / H). ``energy``: "rswt" Q = -L + L M^-1 L (Robust Skin Weights Transfer: Dirichlet +
    Laplacian energy, smooth but may overshoot next to abrupt known values) or "harmonic" Q = -L (maximum principle: no overshoot
    on a Delaunay-like mesh). Components of the welded graph without any known row are left as they are (reported). Then
    w = max(w, 0) and rows renormalized. Returns (W, info)."""
    t0 = time.time()
    W = np.array(W, dtype=np.float64, copy=True)
    known = np.asarray(known, bool).copy()
    L, m = laplacian_mass(topo.P / H, topo.F)
    if energy == "rswt":
        Q = (-L + L @ sp.diags(1.0 / m) @ L).tocsr()
    elif energy == "harmonic":
        Q = (-L).tocsr()
    else:
        raise ValueError(f"inpaint: energy must be 'rswt' or 'harmonic', got {energy!r}")
    # components with nothing known stay as given
    comp = topo.island
    has_known = np.bincount(comp, weights=known.astype(float), minlength=topo.n_islands) > 0
    free = ~known & has_known[comp]
    info = {"energy": energy, "known": int(known.sum()), "unknown": int((~known).sum()), "solved": int(free.sum()),
            "islands_without_known": int((~has_known).sum())}
    if free.any():
        U = np.flatnonzero(free)
        K = np.flatnonzero(~free)
        Quu = Q[U][:, U].tocsc()
        Quk = Q[U][:, K]
        rhs = -(Quk @ W[K])
        try:
            lu = spla.splu(Quu)
        except RuntimeError:  # singular: tiny Tikhonov term on the free rows
            lu = spla.splu((Quu + 1e-10 * sp.diags(m[U])).tocsc())
            info["regularized"] = True
        X = lu.solve(rhs)
        info["sum_err_before_clamp"] = float(np.abs(X.sum(1) - 1.0).max())
        info["min_before_clamp"] = float(X.min())
        info["negative_mass"] = float(-X[X < 0].sum())
        W[U] = X
    W = np.clip(W, 0.0, None)
    s = W.sum(1)
    W = np.where(s[:, None] > 0, W / np.where(s > 0, s, 1.0)[:, None], 0.0)
    info["seconds"] = round(time.time() - t0, 2)
    return W, info


# --------------------------------------------------------------------------------------------------------------------------
# candidate B
# --------------------------------------------------------------------------------------------------------------------------


def transfer_known(topo: sc.WeldTopo, proxy: px.Proxy, Wp, H: float, dist_H: float, max_angle_deg: float):
    """RSWT matching: (W_copy (n_w,k) for every welded vertex, known mask, info)."""
    mp = px.map_points(proxy, topo.P, topo.normals)
    Wc = px.interpolate(proxy, Wp, mp)
    cos_min = float(np.cos(np.radians(max_angle_deg)))
    ok_d = mp["dist"] <= dist_H * H
    ok_a = np.nan_to_num(mp["cos"], nan=-1.0) >= cos_min
    known = ok_d & ok_a
    info = {"dist_m_p50": float(np.median(mp["dist"])), "dist_m_p95": float(np.quantile(mp["dist"], 0.95)),
            "dist_m_max": float(mp["dist"].max()), "rejected_distance": int((~ok_d).sum()), "rejected_angle": int((ok_d & ~ok_a).sum()),
            "copied": int(known.sum()), "copied_fraction": float(known.mean()), "dist_limit_m": dist_H * H,
            "max_angle_deg": max_angle_deg}
    return Wc, known, info


class TransferSkin:
    """Candidate B on one mesh + skeleton + rules. ``run()`` returns welded weights after profiles and enforce."""

    def __init__(self, mesh, skel, rules=None, columns=None, params=None):
        self.rules = dict(rules or {})
        self.params = {**DEFAULTS, **dict(self.rules.get("candidate_b", {})), **dict(params or {})}
        self.skel = skel
        self.setup = skin_rules.prepare(mesh, skel, self.rules, columns)
        self.topo, self.bones, self.labels, self.cons = self.setup.topo, self.setup.bones, self.setup.labels, self.setup.cons
        self.report: dict = {"params": self.params}

    def raw(self):
        """Weights after heat + transfer + inpaint, before profiles/enforce: (W, known mask)."""
        H = self.bones.H
        prm = self.params
        self.proxy = px.build_proxy(self.topo.P, self.topo.F, H, res=int(prm["res"]))
        self.report["proxy"] = {k: v for k, v in self.proxy.info.items() if not k.startswith("_")}
        if not self.proxy.info["watertight"]:
            raise RuntimeError(f"proxy is not watertight: {self.report['proxy']}")
        nn = cKDTree(self.topo.P).query(self.proxy.V)[1]  # heat sources of a proxy vertex = what its nearest vertex allows
        allowed_p = self.cons.allowed[nn] if prm.get("constrained_sources", True) else None
        Wp, hinfo = heat_weights(self.proxy, self.bones, H, float(prm["heat_eps_H"]), float(prm["tie_rel"]), allowed=allowed_p,
                                 envelope=prm.get("envelope"))
        hinfo["constrained_sources"] = allowed_p is not None
        self.report["heat"] = hinfo
        self.W_proxy = Wp
        W, known = self.transfer(Wp)
        if prm.get("envelope"):  # step 2b again on the mesh rows: the inpaint can carry limb weight past the envelope
            W, self.report["envelope_mesh"] = mesh_envelope(self.topo, self.bones, W, prm["envelope"])
        return W, known

    def transfer(self, Wp):
        """Steps 3 of the module docstring on proxy weights ``Wp`` (after ``raw`` built the proxy): RSWT copy + inpaint, the
        islands without a copied row by closest point. Returns (W (n_w,k), known mask); reports ``transfer`` and ``inpaint``."""
        H = self.bones.H
        prm = self.params
        Wc, known, tinfo = transfer_known(self.topo, self.proxy, Wp, H, float(prm["dist_H"]), float(prm["max_angle_deg"]))
        self.report["transfer"] = tinfo
        W, iinfo = inpaint(self.topo, np.where(known[:, None], Wc, 0.0), known, H)
        # islands with nothing copied: raw closest-point transfer
        none = W.sum(1) == 0
        W[none] = Wc[none]
        iinfo["raw_closest_rows"] = int(none.sum())
        self.report["inpaint"] = iinfo
        self.known = known
        return W, known

    def run(self):
        W, _ = self.raw()
        W, fin = skin_rules.finish(W, self.setup, self.skel, self.rules)
        self.report.update(fin)
        return W


def run(mesh, skel, rules=None, columns=None, params=None):
    """Candidate B -> (welded W (n_w,k), TransferSkin with .report/.topo/.bones/.labels/.proxy)."""
    ts = TransferSkin(mesh, skel, rules, columns, params)
    return ts.run(), ts


def main(argv=None):
    ap = argparse.ArgumentParser(description="skin candidate B (proxy heat + robust transfer + inpaint)")
    ap.add_argument("--mesh", required=True)
    ap.add_argument("--skeleton", required=True)
    ap.add_argument("--rules", default=None)
    ap.add_argument("--out", required=True)
    ap.add_argument("--res", type=int, default=None, help=f"proxy voxels per H (default {DEFAULTS['res']})")
    ap.add_argument("--dist-H", type=float, default=None, help=f"transfer distance limit in H (default {DEFAULTS['dist_H']})")
    ap.add_argument("--no-envelope", action="store_true", help="skip the limb envelope (steps 2b / 3b; for comparisons)")
    ap.add_argument("--report", default=None)
    a = ap.parse_args(argv)
    mesh = npzio.load_mesh(a.mesh)
    skel = template.load_skeleton(a.skeleton)
    rules = skin_rules.load_rules(a.rules) if a.rules else {}
    params = {k: v for k, v in (("res", a.res), ("dist_H", a.dist_H), ("envelope", {} if a.no_envelope else None))
              if v is not None}
    t0 = time.time()
    Ww, ts = run(mesh, skel, rules, params=params)
    W = sc.to_full(Ww, ts.topo)
    npzio.save_weights(a.out, ts.bones.names, W, locked=ts.topo.scatter(ts.cons.rigid_col >= 0),
                       meta={"candidate": CANDIDATE, "params": dict(ts.params, rules=a.rules)}, check_sums=True)
    rep = dict(ts.report, seconds=round(time.time() - t0, 2), out=a.out)
    npzio.write_json(a.report or (os.path.splitext(a.out)[0] + ".json"), rep)
    print(f"candidate B: {W.shape[0]} vertices, {len(ts.bones.names)} bones, {rep['seconds']} s -> {a.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
