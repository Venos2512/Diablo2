r"""solvers.legacy_d01 - D01-only reproduction of the D01 v4 measurements (d01_measure.py, v2_rig_function.py, v5_sack_flap.py),
next to the generic metrics of solvers.metrics (runs in rigkit-env). Nothing here is used for another asset.

* ``classes``: D01 vertex classes from geometry only (d01_skin.compute): ``body`` = the largest welded island (main/ear/strap/sack
  are all inside it), ``flap_front`` = the loin island(s) (> 300 welded vertices, centroid z < 0.25 m) with mean welded position
  z < 0.205 and y <= 0.02. D01 coordinates (metres, H = 0.5) are hard-coded on purpose.
* ``Loin``: the loincloth-front vs body test of d01_measure.flap_vs_body over ORIGINAL vertices and faces: flap vertices inside the
  body (winding number instead of D01's 3-ray parity; validated by the planted overlaps), depth to the nearest body face, body
  region of the nearest face by its dominant bone (region_of_tri), flap/body triangle intersections, vertices covered by the thigh
  within 8 cm along -Y; ``delta`` = values minus rest (d01_measure.flap_delta); ``planted_validation`` = D01 B2 method check
  (flap moved back 0/4/8/12 mm at rest: the counts must grow).
* ``raw_edge_growth``: v2_rig_function pose_extremes: growth over the RAW (unwelded) edges with rest length > 1e-5 m, sole minima.

Units: metres (keys ending in ``_mm`` are millimetres). Frame: Blender, Z up, front -Y, character left +X.
Use: ``report(cx, P_all, names)`` with a ``solvers.metrics.Context`` (``metrics.py --legacy-d01`` calls it).
"""
from __future__ import annotations

import numpy as np

from solvers import metrics as M

THIGH = ("Thigh", "Calf", "Foot", "Toe")


def classes(cx) -> dict:
    """D01 ``body`` / ``flap_front`` welded masks from geometry only (see the module docstring)."""
    sizes = np.bincount(cx.island_w)
    main = int(sizes.argmax())
    cnt = np.bincount(cx.weld, minlength=cx.n_w).astype(np.float64)
    Pm = np.zeros((cx.n_w, 3))
    for k in range(3):
        Pm[:, k] = np.bincount(cx.weld, weights=cx.rest[:, k], minlength=cx.n_w) / cnt
    flap = np.zeros(cx.n_w, bool)
    loin_islands = []
    for isl in range(cx.n_islands):
        if isl == main:
            continue
        m = cx.island_w == isl
        if m.sum() > 300 and Pm[m].mean(0)[2] < 0.25:
            loin_islands.append(isl)
            flap |= m & (Pm[:, 2] < 0.205) & (Pm[:, 1] <= 0.02)
    return {"body_w": cx.island_w == main, "flap_w": flap, "loin_islands": loin_islands, "main_island": main}


def ray_first_hit(P, F, origins, direction, max_dist):
    """First hit (face index into F, or -1) of rays origins + t*direction, 0 < t <= max_dist (Moller-Trumbore, all faces)."""
    d = np.asarray(direction, dtype=np.float64)
    a, b, c = P[F[:, 0]], P[F[:, 1]], P[F[:, 2]]
    e1, e2 = b - a, c - a
    pv = np.cross(d, e2)
    det = np.einsum("ij,ij->i", e1, pv)
    ok = np.abs(det) > 1e-18
    inv = np.where(ok, 1.0 / np.where(ok, det, 1.0), 0.0)
    out = np.full(len(origins), -1, np.int64)
    for i, o in enumerate(origins):
        tv = o - a
        u = np.einsum("ij,ij->i", tv, pv) * inv
        qv = np.cross(tv, e1)
        v = (qv @ d) * inv
        t = np.einsum("ij,ij->i", e2, qv) * inv
        hit = ok & (u >= 0) & (v >= 0) & (u + v <= 1) & (t > 0) & (t <= max_dist)
        if hit.any():
            j = np.nonzero(hit)[0]
            out[i] = j[np.argmin(t[j])]
    return out


class Loin:
    """D01 loincloth-front vs body test (d01_measure.flap_vs_body) over ORIGINAL vertices and faces, as D01 counted them."""

    def __init__(self, cx):
        self.cx = cx
        cl = classes(cx)
        self.classes = cl
        body_v = cl["body_w"][cx.weld]
        flap_v = cl["flap_w"][cx.weld]
        F = cx.F
        self.body_f = np.nonzero(body_v[F].all(1))[0]
        self.flap_f = np.nonzero(flap_v[F].all(1))[0]
        self.flap_v = np.unique(F[self.flap_f].ravel())
        # body face region class by the dominant bone of the mean weights of its 3 vertices (region_of_tri)
        Wm = (cx.W[F[self.body_f, 0]] + cx.W[F[self.body_f, 1]] + cx.W[F[self.body_f, 2]]) / 3.0
        dom = np.array(cx.w_bones)[np.argmax(Wm, axis=1)]
        self.body_thigh = np.array([M.base_name(b) in THIGH for b in dom])
        self.body_bone = dom

    def measure(self, P) -> dict:
        P = np.asarray(P, dtype=np.float64)
        F = self.cx.F
        Fb = F[self.body_f]
        w = M.winding_inside(P, Fb, P[self.flap_v])
        ins = self.flap_v[w > 0.5]
        d, fi = M.surface_distance(P, Fb, P[ins])
        thigh = self.body_thigh[fi] if ins.size else np.zeros(0, bool)
        ia, ib = M.intersecting_pairs(P, F[self.flap_f], Fb, exclude_shared=True)
        hit_thigh = set(ia[self.body_thigh[ib]].tolist())
        hit_other = set(ia[~self.body_thigh[ib]].tolist())
        hits = ray_first_hit(P, Fb, P[self.flap_v] + np.array([0.0, -1e-4, 0.0]), (0.0, -1.0, 0.0), 0.08)
        cov = self.flap_v[(hits >= 0) & self.body_thigh[np.maximum(hits, 0)]]
        return {"flap_vertices": int(len(self.flap_v)), "flap_triangles": int(len(self.flap_f)),
                "inside_vertices_thigh": int(thigh.sum()), "inside_vertices_other": int((~thigh).sum()),
                "max_depth_thigh_mm": float(d[thigh].max() * 1000) if thigh.any() else 0.0,
                "max_depth_other_mm": float(d[~thigh].max() * 1000) if (~thigh).any() else 0.0,
                "intersecting_flap_triangles_thigh": len(hit_thigh), "intersecting_flap_triangles_other": len(hit_other),
                "covered_by_thigh_vertices": int(len(cov)),
                "inside_thigh_vertex_ids": sorted(ins[thigh].tolist()), "inside_other_vertex_ids": sorted(ins[~thigh].tolist()),
                "covered_by_thigh_vertex_ids": sorted(cov.tolist()),
                "inside_thigh_regions": sorted(set(self.body_bone[fi[thigh]].tolist())) if thigh.any() else []}

    @staticmethod
    def delta(cur: dict, rest: dict) -> dict:
        """d01_measure.flap_delta: new inside vertices (set difference), new intersecting triangles (count difference)."""
        return {"new_inside_vertices_thigh": len(set(cur["inside_thigh_vertex_ids"]) - set(rest["inside_thigh_vertex_ids"])),
                "new_inside_vertices_other": len(set(cur["inside_other_vertex_ids"]) - set(rest["inside_other_vertex_ids"])),
                "new_intersecting_triangles_thigh": max(0, cur["intersecting_flap_triangles_thigh"]
                                                        - rest["intersecting_flap_triangles_thigh"]),
                "new_covered_by_thigh_vertices": len(set(cur["covered_by_thigh_vertex_ids"])
                                                     - set(rest["covered_by_thigh_vertex_ids"])),
                "max_depth_thigh_mm": cur["max_depth_thigh_mm"]}

    def planted_validation(self, P_rest, shifts_mm=(0, 4, 8, 12)) -> list:
        """D01 B2 method check: move the flap_front vertices back (+Y) at rest; inside / intersecting counts must grow."""
        out = []
        idx = np.nonzero(self.classes["flap_w"][self.cx.weld])[0]
        for mm in shifts_mm:
            pp = np.array(P_rest, dtype=np.float64)
            pp[idx, 1] += mm / 1000.0
            r = self.measure(pp)
            out.append({"flap_shift_back_mm": mm, "inside_vertices_total": r["inside_vertices_thigh"] + r["inside_vertices_other"],
                        "inside_vertices_other_region": r["inside_vertices_other"],
                        "intersecting_triangles_total": r["intersecting_flap_triangles_thigh"] + r["intersecting_flap_triangles_other"],
                        "max_depth_other_mm": r["max_depth_other_mm"]})
        return out


def raw_edge_growth(cx, P) -> dict:
    """v2_rig_function pose_extremes: growth over the raw (unwelded) edges with rest length > 1e-5 m, plus sole minima (mm)."""
    F = cx.F
    e = np.concatenate([F[:, [0, 1]], F[:, [1, 2]], F[:, [2, 0]]])
    e.sort(axis=1)
    E = np.unique(e, axis=0)
    L0 = np.linalg.norm(cx.rest[E[:, 0]] - cx.rest[E[:, 1]], axis=1)
    L1 = np.linalg.norm(P[E[:, 0]] - P[E[:, 1]], axis=1)
    ok = L0 > 1e-5
    g = (L1 - L0)[ok]
    out = {"max_vertex_move_m": float(np.linalg.norm(P - cx.rest, axis=1).max()), "max_edge_growth_mm": float(g.max() * 1000),
           "p99_edge_growth_mm": float(np.percentile(g, 99) * 1000)}
    for s, idx in cx.soles.items():
        out[f"sole_min_z_{s}_mm"] = float(P[idx, 2].min() * 1000)
    return out


def report(cx, P_all, names) -> dict:
    """D01 v4 definitions for every pose (see the module docstring): ``pose_extremes``, ``flap_front`` (+ ids), ``classes``,
    ``planted_validation``."""
    P_all = np.asarray(P_all, dtype=np.float64)
    rep = {"pose_extremes": {nm: raw_edge_growth(cx, P_all[i]) for i, nm in enumerate(names)}}
    lo = Loin(cx)
    rest = lo.measure(cx.rest)
    flap = {"rest": rest}
    for nm in names:
        if nm == "rest":
            continue
        cur = lo.measure(P_all[names.index(nm)])
        cur["vs_rest"] = Loin.delta(cur, rest)
        flap[nm] = cur
    rep["flap_front"] = {k: {kk: vv for kk, vv in v.items() if not kk.endswith("_ids")} for k, v in flap.items()}
    rep["flap_front_ids"] = {k: {kk: vv for kk, vv in v.items() if kk.endswith("_ids")} for k, v in flap.items()}
    rep["classes"] = {"body_welded": int(lo.classes["body_w"].sum()), "flap_front_welded": int(lo.classes["flap_w"].sum()),
                      "loin_islands": lo.classes["loin_islands"], "main_island": lo.classes["main_island"],
                      "body_faces": int(len(lo.body_f)), "flap_faces": int(len(lo.flap_f)), "flap_vertices": int(len(lo.flap_v))}
    synth = lo.planted_validation(cx.rest)
    rep["planted_validation"] = {
        "synthetic_shift": synth,
        "synthetic_monotonic": all(synth[i + 1]["inside_vertices_total"] >= synth[i]["inside_vertices_total"]
                                   and synth[i + 1]["intersecting_triangles_total"] >= synth[i]["intersecting_triangles_total"]
                                   for i in range(len(synth) - 1)),
    }
    return rep
