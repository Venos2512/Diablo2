r"""solvers.landmarks_geo - S3 source a: landmarks from the mesh geometry (references/joint-placement.md "a. Geometry on the mesh").

Units: metres.  Frame: Blender, Z up, character front -Y, character left +X.  Input: mesh.npz after S2 (glbmesh or rigkit.meshio).
All measures run on the seam-welded topology.

Part 1 is the geometry toolkit shared with analysis.py and unirig_bridge.py: ``MeshGeom`` (welded mesh + libigl BVH, ray hits,
chords, plane sections into loops with perimeter/area/centroid), ``fit_sphere``, ``pca_axis``.
Part 1b tracks limbs with plane sections (innermost closed loop around the predicted axis point: cuffs and sleeves are larger
concentric loops, single-sheet cloth gives open loops and is ignored) and builds the coarse body frame (feet, legs to the crotch,
arms from the hand tip to the torso). The crotch is the lowest height where one closed horizontal loop holds both leg axes.
Part 2 is the landmark solver (``solve``). Each side is measured on its own; every landmark carries a method text, a confidence
(method reliability) and ``diag`` numbers. Rules (families/H.json, joint-placement.md, review r1):
  wrist     distal end of the forearm's narrow plateau: where the whole-section perimeter rises PLATEAU_RISE above the plateau
            minimum toward the hand (the hand flare), bisected between slices
  elbow     bend of the medial curve when the arm is bent > ELBOW_BEND_MIN_DEG; else the perimeter valley after the forearm bulge,
            moved to the olecranon bump of the back surface when one is found; 10 % of the chord toward the back
  shoulder  upper-arm flare onset (bisected between slices), refined by a sphere fit to the deltoid cap (rejection reasons logged)
  hand_tip / toe_tip  section 0.5 % H inside the extreme point;  palm  hand section just before the finger split
  ankle     distal (lower) end of the ankle plateau where the foot flares, on horizontal sections every 0.25 % H; boot ankle (interim
            rule, reviews r2/r3): with a perimeter step > BOOT_EDGE_STEP in [max(ball + 0.02 H, flare - 0.03 H), flare + 0.03 H], the
            instep crease (most concave point of the front profile in the sagittal foot section between the ball and the edge, or the
            flare when the step lies below it: a foot junction below a soft flare) on the leg axis, confidence 0.45, marked
            ``interim_rule: "boot_ankle"`` for consensus
  knee      lower pole of the kneecap (front-surface bump - KNEE_BELOW_CAP_H); else the bend of the leg's medial curve; else the
            perimeter valley of the middle third; on the hinge KNEE_BACK_FRAC of the chord behind the centroid
  hip       thigh axis extrapolated to the top of the thigh (below the crotch);  ball  70 % of heel -> toe tip along the foot axis
  pelvis    hip-centre height on the spine line;  chest  armpit fillet corner (where the arm-underside outline passes 45 deg)
  spine_01/02  1/3, 2/3 of the spine line pelvis -> chest (62 % of the clean front->back torso chord)
  head      skull base from the head's own geometry: head-mass centre and radius (volume mean-shift; radius clamped to 0.6-1.5 x the
            starting radius), ear line from bilateral ear protrusions (else from the head mass), pivot behind and below the ear line
            (confidence lowered when the pivot offset leaves 0.01-0.04 H); head island = the island with the most vertices in the head
            column, re-picked when most upper-hemisphere rays from the head mass hit another one (I4: not the nearest surface, which
            was an eye on D01);  head_top  the head island's surface above the head-mass centre along the body up axis (helmets,
            hats and eyes are other islands), the head bone's angles from up and from the neck direction in ``diag.head_axis_deg``
  neck      on the chest -> head line at the top of the shoulders
  clavicle  sternoclavicular joint behind the sternal notch, x from the chest-loop half-width, taken from the torso loop at chest
            height and kept inside it; at its final height the segment from the spine/neck line must cross no surface (moved back
            inside and LOW when it does: source a is the clavicle's only position source)
Every core landmark is checked inside the mesh (winding number) and pushed inside along the nearest-surface direction when it is out
by at most INSIDE_PUSH_MAX_H. Confidences drop when a precondition fails (hidden upper arm or thigh, implausible torso depth,
segment-length ratio outside SEGMENT_RATIO, family prior band, knee at a cuff/boot/wrap edge, cloth bridging from analysis.json) so
that consensus gates them (consensus drops sources below its method-confidence floor).

CLI:  python landmarks_geo.py <mesh.npz> [--family S] [--analysis analysis.json] [--spine-depth-frac 0.62] [--out landmarks_a.json]
"""
from __future__ import annotations

import math
import os
import sys

import numpy as np

if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rigcore import mesh as rmesh  # noqa: E402

# --------------------------------------------------------------------------------------------------------------------------
# Part 1 - geometry toolkit
# --------------------------------------------------------------------------------------------------------------------------


def unit(v) -> np.ndarray:
    v = np.asarray(v, dtype=np.float64)
    n = np.linalg.norm(v, axis=-1, keepdims=True)
    return v / np.where(n == 0, 1.0, n)


def pca_axis(P, weights=None) -> tuple[np.ndarray, np.ndarray]:
    """Principal direction of points ``P`` (k,3): ``(centroid, unit axis)``; the axis sign is arbitrary."""
    P = np.asarray(P, dtype=np.float64)
    w = np.ones(len(P)) if weights is None else np.asarray(weights, dtype=np.float64)
    c = (P * w[:, None]).sum(0) / w.sum()
    X = (P - c) * np.sqrt(w)[:, None]
    _, _, vt = np.linalg.svd(X, full_matrices=False)
    return c, vt[0]


def fit_sphere(P) -> tuple[np.ndarray, float, float]:
    """Algebraic least-squares sphere through points ``P`` (k>=4,3): ``(centre, radius, rms radial residual)``."""
    P = np.asarray(P, dtype=np.float64)
    A = np.concatenate([2.0 * P, np.ones((len(P), 1))], axis=1)
    b = (P * P).sum(1)
    sol, *_ = np.linalg.lstsq(A, b, rcond=None)
    c = sol[:3]
    r = math.sqrt(max(sol[3] + c @ c, 0.0))
    res = np.linalg.norm(P - c, axis=1) - r
    return c, r, float(np.sqrt((res * res).mean()))


def plane_basis(normal) -> tuple[np.ndarray, np.ndarray]:
    """Two unit vectors spanning the plane perpendicular to ``normal`` (right-handed with it)."""
    n = unit(normal)
    a = np.array([1.0, 0.0, 0.0]) if abs(n[0]) < 0.9 else np.array([0.0, 1.0, 0.0])
    u = unit(np.cross(n, a))
    return u, np.cross(n, u)


class Loop:
    """One connected piece of a plane section: ordered points (k,3); ``closed``; ``perimeter`` (m); ``area`` (m^2, signed-free) and
    ``centroid`` (area centroid for closed loops, length-weighted mean for open ones); ``faces`` = welded face ids crossed."""

    __slots__ = ("points", "closed", "perimeter", "area", "centroid", "faces")

    def __init__(self, points, closed, faces, normal):
        self.points = points
        self.closed = closed
        self.faces = faces
        seg = np.diff(np.concatenate([points, points[:1]]) if closed else points, axis=0)
        L = np.linalg.norm(seg, axis=1)
        self.perimeter = float(L.sum())
        mids = (np.concatenate([points, points[:1]])[:-1] + np.concatenate([points, points[:1]])[1:]) / 2 if closed else \
            (points[:-1] + points[1:]) / 2
        if closed and len(points) >= 3:
            u, v = plane_basis(normal)
            o = points.mean(0)
            x, y = (points - o) @ u, (points - o) @ v
            x1, y1 = np.roll(x, -1), np.roll(y, -1)
            cr = x * y1 - x1 * y
            a2 = cr.sum()
            if abs(a2) > 1e-18:
                cx = ((x + x1) * cr).sum() / (3 * a2)
                cy = ((y + y1) * cr).sum() / (3 * a2)
                self.area = float(abs(a2) / 2)
                self.centroid = o + cx * u + cy * v
                return
        self.area = 0.0
        self.centroid = (mids * L[:, None]).sum(0) / max(L.sum(), 1e-30) if len(L) else points.mean(0)


class MeshGeom:
    """Seam-welded triangle mesh with a libigl AABB tree.

    ``V`` (n_welded,3) welded positions (first member), ``F`` (m,3) welded faces with collapsed faces dropped, ``weld`` (n,) the
    original -> welded map, ``face_orig`` index of each kept face in the original face list."""

    def __init__(self, V, F, weld=None):
        import igl

        V = np.asarray(V, dtype=np.float64)
        F = np.asarray(F)
        self.weld = rmesh.weld_map(V) if weld is None else np.asarray(weld, dtype=np.int32)
        self.V = rmesh.welded_positions(V, self.weld)
        Fw = rmesh.welded_faces(F, self.weld)
        ok = (Fw[:, 0] != Fw[:, 1]) & (Fw[:, 1] != Fw[:, 2]) & (Fw[:, 2] != Fw[:, 0])
        self.face_orig = np.flatnonzero(ok).astype(np.int64)
        self.F = np.ascontiguousarray(Fw[ok].astype(np.int64))
        self.lo, self.hi = self.V.min(0), self.V.max(0)
        self.diag = float(np.linalg.norm(self.hi - self.lo))
        self._tree = igl.AABB()
        self._tree.init(self.V, self.F)
        self._fn = None

    # ---------------------------------------------------------------- rays
    def ray_hits(self, O, D, dedupe: float = 1e-9) -> list[np.ndarray]:
        """All hits of the rays ``O + t D`` (``D`` normalized here, so t is metres, t >= 0): one sorted array of distances per ray,
        duplicates from shared edges/vertices merged."""
        O = np.atleast_2d(np.asarray(O, dtype=np.float64))
        D = unit(np.atleast_2d(np.asarray(D, dtype=np.float64)))
        res = self._tree.intersect_ray(self.V, self.F, np.ascontiguousarray(O), np.ascontiguousarray(D))
        out = []
        for hits in res:
            t = np.sort(np.array([h[1] for h in hits], dtype=np.float64)) if hits else np.zeros(0)
            if t.size > 1:
                t = t[np.concatenate([[True], np.diff(t) > dedupe * max(self.diag, 1e-12)])]
            out.append(t)
        return out

    def first_hit(self, O, D) -> tuple[np.ndarray, np.ndarray]:
        """Nearest hit per ray: ``(t (k,) metres, nan if none; points (k,3))``."""
        O = np.atleast_2d(np.asarray(O, dtype=np.float64))
        D = unit(np.atleast_2d(np.asarray(D, dtype=np.float64)))
        _, t, _ = self._tree.intersect_ray_first(self.V, self.F, np.ascontiguousarray(O), np.ascontiguousarray(D))
        t = np.where(t < 0, np.nan, t)
        return t, O + t[:, None] * D

    def first_hit_face(self, O, D) -> tuple[np.ndarray, np.ndarray]:
        """Nearest hit per ray: ``(t (k,) metres, nan if none; face id (k,) into ``F``, -1 if none)``."""
        O = np.atleast_2d(np.asarray(O, dtype=np.float64))
        D = unit(np.atleast_2d(np.asarray(D, dtype=np.float64)))
        f, t, _ = self._tree.intersect_ray_first(self.V, self.F, np.ascontiguousarray(O), np.ascontiguousarray(D))
        f = np.asarray(f, dtype=np.int64)
        miss = (t < 0) | (f < 0)
        return np.where(miss, np.nan, t), np.where(miss, -1, f)

    def chord(self, p, d) -> tuple[float, float]:
        """Distances from ``p`` to the surface along ``-d`` and ``+d`` (nearest crossings on each side; nan when the ray escapes)."""
        p = np.asarray(p, dtype=np.float64)
        d = unit(d)
        tp = self.ray_hits(p[None], d[None])[0]
        tn = self.ray_hits(p[None], -d[None])[0]
        return (float(tn[0]) if tn.size else math.nan), (float(tp[0]) if tp.size else math.nan)

    def exit_point(self, p, d) -> np.ndarray | None:
        """Last surface crossing of the ray from ``p`` along ``d`` (where a limb ends), or None."""
        t = self.ray_hits(np.asarray(p, dtype=np.float64)[None], np.asarray(d, dtype=np.float64)[None])[0]
        if not t.size:
            return None
        return np.asarray(p, dtype=np.float64) + t[-1] * unit(d)

    def closest(self, P) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Closest surface points: ``(distance (k,), face id (k,), point (k,3))``."""
        P = np.atleast_2d(np.asarray(P, dtype=np.float64))
        d2, fi, C = self._tree.squared_distance(self.V, self.F, np.ascontiguousarray(P))
        return np.sqrt(d2), fi, C

    def winding(self, P) -> np.ndarray:
        """Generalized winding number of points ``P`` (k,3); > 0.5 = inside (robust to small holes)."""
        import igl

        return igl.fast_winding_number(self.V, self.F, np.ascontiguousarray(np.atleast_2d(P), dtype=np.float64))

    def face_normals(self) -> np.ndarray:
        if self._fn is None:
            a, b, c = self.V[self.F[:, 0]], self.V[self.F[:, 1]], self.V[self.F[:, 2]]
            self._fn = unit(np.cross(b - a, c - a))
        return self._fn

    # ---------------------------------------------------------------- sections
    def section(self, origin, normal, face_mask=None) -> list[Loop]:
        """Plane section through ``origin`` with ``normal`` -> list of ``Loop`` (closed loops first, then open pieces).

        ``face_mask`` (bool over welded faces) restricts the faces that are cut (e.g. one island or one limb region)."""
        n = unit(normal)
        s = (self.V - np.asarray(origin, dtype=np.float64)) @ n
        s = np.where(s == 0.0, 1e-15, s)
        F = self.F
        sf = s[F]
        pos = sf > 0
        cut = pos.any(1) & ~pos.all(1)
        if face_mask is not None:
            cut &= np.asarray(face_mask, dtype=bool)
        fid = np.flatnonzero(cut)
        if fid.size == 0:
            return []
        Fc, sc = F[fid], sf[fid]
        # each cut face crosses exactly two of its edges (0-1, 1-2, 2-0)
        ea = np.stack([Fc[:, 0], Fc[:, 1], Fc[:, 2]], 1)
        eb = np.stack([Fc[:, 1], Fc[:, 2], Fc[:, 0]], 1)
        sa = np.stack([sc[:, 0], sc[:, 1], sc[:, 2]], 1)
        sb = np.stack([sc[:, 1], sc[:, 2], sc[:, 0]], 1)
        cross = (sa > 0) != (sb > 0)
        rows, cols = np.nonzero(cross)
        # two crossing edges per face (rows come sorted)
        a, b = ea[rows, cols], eb[rows, cols]
        lo, hi = np.minimum(a, b), np.maximum(a, b)
        nV = len(self.V)
        key = lo.astype(np.int64) * nV + hi
        t = s[lo] / (s[lo] - s[hi])
        pts = self.V[lo] + t[:, None] * (self.V[hi] - self.V[lo])
        key = key.reshape(-1, 2)
        pts = pts.reshape(-1, 2, 3)
        # graph: node = edge key, link = face segment
        uniq, inv = np.unique(key.ravel(), return_inverse=True)
        inv = inv.reshape(-1, 2)
        node_pt = np.zeros((len(uniq), 3))
        node_pt[inv.ravel()] = pts.reshape(-1, 3)
        nbr: list[list[tuple[int, int]]] = [[] for _ in range(len(uniq))]
        for si, (p, q) in enumerate(inv.tolist()):
            nbr[p].append((q, si))
            nbr[q].append((p, si))
        used = np.zeros(len(inv), dtype=bool)
        loops: list[Loop] = []
        # open chains start at nodes of degree 1 (mesh boundary or masked faces); then the closed loops
        starts = [i for i in range(len(uniq)) if len(nbr[i]) == 1] + list(range(len(uniq)))
        for st in starts:
            if all(used[si] for _, si in nbr[st]):
                continue
            chain, segs, cur = [st], [], st
            while True:
                nxt = next(((q, si) for q, si in nbr[cur] if not used[si]), None)
                if nxt is None:
                    break
                q, si = nxt
                used[si] = True
                segs.append(si)
                if q == st:
                    break
                chain.append(q)
                cur = q
            closed = len(segs) >= 3 and len(chain) == len(segs)
            loops.append(Loop(node_pt[chain], closed, fid[np.array(segs, dtype=np.int64)] if segs else np.zeros(0, np.int64), n))
        loops.sort(key=lambda lp: (not lp.closed, -lp.perimeter))
        return loops

    def section_near(self, origin, normal, seed, face_mask=None, max_dist=None) -> Loop | None:
        """The loop of ``section`` whose centroid is nearest to ``seed`` (closed loops preferred), or None."""
        loops = self.section(origin, normal, face_mask)
        if not loops:
            return None
        seed = np.asarray(seed, dtype=np.float64)
        best, bd = None, math.inf
        for lp in loops:
            d = float(np.linalg.norm(lp.centroid - seed)) + (0.0 if lp.closed else 0.25 * self.diag)
            if d < bd:
                best, bd = lp, d
        if max_dist is not None and best is not None and np.linalg.norm(best.centroid - seed) > max_dist:
            return None
        return best




# --------------------------------------------------------------------------------------------------------------------------
# Part 1b - limb tracking and the coarse body frame (feet, legs, crotch, arms, torso) shared by analysis.py and solve()
# --------------------------------------------------------------------------------------------------------------------------


class Slice:
    """One limb cross-section: plane ``origin``/``normal``, the selected ``loops`` (all loops of the plane section whose centroid lies
    within the selection radius), their combined ``centroid`` (area-weighted over closed loops), total ``perimeter`` and ``area``,
    ``n_loops`` and ``t`` (distance marched from the start)."""

    __slots__ = ("origin", "normal", "loops", "centroid", "perimeter", "area", "n_loops", "t")

    def __init__(self, origin, normal, loops, t=0.0):
        self.origin = np.asarray(origin, dtype=np.float64)
        self.normal = unit(normal)
        self.loops = loops
        self.n_loops = len(loops)
        self.t = float(t)
        closed = [lp for lp in loops if lp.closed and lp.area > 0]
        if closed:
            a = np.array([lp.area for lp in closed])
            self.centroid = (np.array([lp.centroid for lp in closed]) * a[:, None]).sum(0) / a.sum()
            self.area = float(a.sum())
        else:
            w = np.array([max(lp.perimeter, 1e-12) for lp in loops])
            self.centroid = (np.array([lp.centroid for lp in loops]) * w[:, None]).sum(0) / w.sum()
            self.area = 0.0
        self.perimeter = float(sum(lp.perimeter for lp in loops))


def loop_contains(lp: Loop, p) -> bool:
    """Is ``p`` (projected into the loop's plane) inside the closed loop ``lp``? (even-odd rule in 2D)"""
    if not lp.closed or len(lp.points) < 3:
        return False
    c = lp.points.mean(0)
    _, _, vt = np.linalg.svd(lp.points - c, full_matrices=False)
    u, v = vt[0], vt[1]
    x, y = (lp.points - c) @ u, (lp.points - c) @ v
    px, py = float((np.asarray(p) - c) @ u), float((np.asarray(p) - c) @ v)
    x1, y1 = np.roll(x, -1), np.roll(y, -1)
    cross = (y > py) != (y1 > py)
    xi = x + (py - y) * (x1 - x) / np.where(y1 - y == 0, 1e-30, y1 - y)
    return bool(np.count_nonzero(cross & (px < xi)) % 2)


def limb_section(geom: MeshGeom, origin, normal, seed, radius: float, face_mask=None, t: float = 0.0,
                 closed_only: bool = True, innermost: bool = True) -> Slice | None:
    """Limb cross-section in the plane ``origin``/``normal``.

    With ``innermost`` (default) the smallest closed loop that contains ``seed`` is the limb (a cuff, sleeve or bracelet around it is a
    larger concentric loop); when no loop contains ``seed`` (between the fingers) the union of the loops whose centroid lies within
    ``radius`` is used. With ``closed_only`` open loops are ignored: they come from single-sheet cloth (capes, skirts, flaps)."""
    seed = np.asarray(seed, dtype=np.float64)
    loops = [lp for lp in geom.section(origin, normal, face_mask) if lp.closed or not closed_only]
    if innermost:
        inside = [lp for lp in loops if lp.closed and np.linalg.norm(lp.centroid - seed) <= 2 * radius and loop_contains(lp, seed)]
        if inside:
            return Slice(origin, normal, [min(inside, key=lambda lp: lp.area)], t)
    near = [lp for lp in loops if np.linalg.norm(lp.centroid - seed) <= radius]
    return Slice(origin, normal, near, t) if near else None


def track(geom: MeshGeom, start, direction, step: float, n_max: int, radius: float, refit: int = 6, face_mask=None,
          fixed_axis: bool = False, stop_area: float = 2.5, area_window: int = 8, min_before_stop: int = 4, free_dist: float = 0.0,
          closed_only: bool = True) -> list[Slice]:
    """March plane sections from ``start`` along ``direction`` (re-fitted by PCA of the last ``refit`` centroids unless
    ``fixed_axis``), one every ``step`` metres, selecting the limb loop with ``limb_section`` around the predicted centre.

    Stops when nothing is found, after ``n_max`` slices, or - once ``free_dist`` metres are marched (the hand: fingers and palm vary a
    lot) and ``min_before_stop`` slices exist - when the selected area exceeds ``stop_area`` x the median area of the last
    ``area_window`` slices: the limb has merged into the torso / the other leg. The slice where it stopped is not returned."""
    d = unit(direction)
    p = np.asarray(start, dtype=np.float64)
    out: list[Slice] = []
    for k in range(n_max):
        s = limb_section(geom, p, d, p, radius, face_mask, t=k * step, closed_only=closed_only)
        if s is None:
            break
        if k * step >= free_dist and len(out) >= min_before_stop:
            ref = float(np.median([max(o.area, 1e-12) for o in out[-area_window:]]))
            if s.area > stop_area * ref or (s.area == 0 and s.perimeter > stop_area * np.median([o.perimeter for o in out[-area_window:]])):
                break
        out.append(s)
        if not fixed_axis and len(out) >= 3:
            _, ax = pca_axis(np.array([o.centroid for o in out[-refit:]]))
            if ax @ d < 0:
                ax = -ax
            d = unit(0.5 * d + 0.5 * ax)
        p = s.centroid + step * d
    return out


def find_feet(geom: MeshGeom, H: float, z_fracs=(0.02, 0.012, 0.03, 0.045), min_sep: float = 0.04) -> dict:
    """Sole sections: at the first height of ``z_fracs`` (x H) whose two longest loops (closed or open: soles may sit on a mesh
    boundary) are more than ``min_sep`` H apart in x, ``{"L": centroid, "R": centroid, "z": height, "n_loops": k}`` (L = larger
    x). Without such a pair only ``n_loops`` is returned (feet fused, robe on the ground)."""
    n = 0
    for zf in z_fracs:
        loops = sorted(geom.section([0.0, 0.0, zf * H], [0.0, 0.0, 1.0]), key=lambda lp: -lp.perimeter)
        n = max(n, len(loops))
        if len(loops) < 2:
            continue
        a, b = loops[0].centroid, loops[1].centroid
        if abs(a[0] - b[0]) < min_sep * H:
            continue
        L, R = (a, b) if a[0] > b[0] else (b, a)
        return {"L": L, "R": R, "z": zf * H, "n_loops": len(loops)}
    return {"n_loops": n}


def axis_xy(C, z) -> np.ndarray:
    """(x, y) of a limb axis at height ``z`` from centroids ``C`` (k,3) sorted by z: interpolated inside their z range, extrapolated
    linearly from the last third above the top (clamped to the first centroid below the bottom)."""
    if z <= C[-1, 2] or len(C) < 2:
        return np.array([np.interp(z, C[:, 2], C[:, 0]), np.interp(z, C[:, 2], C[:, 1])])
    k = max(2, len(C) // 3)
    return np.array([np.polyval(np.polyfit(C[-k:, 2], C[-k:, c], 1), z) for c in (0, 1)])


def find_crotch(geom: MeshGeom, H: float, tr_L, tr_R, z_lo: float = 0.05, step: float = 0.005, iters: int = 10) -> float | None:
    """Crotch height (m): the lowest z where ONE closed horizontal loop contains both leg axes (track centroids, interpolated or
    extrapolated with ``axis_xy``). Coarse scan every ``step`` H upward from ``z_lo`` H, then bisection (``iters`` halvings: 2.5 mm /
    1024 at D01 scale). None when a track is missing or the legs never merge below 95 % of the mesh height."""
    if not tr_L or not tr_R:
        return None
    CL = np.array(sorted((s.centroid for s in tr_L), key=lambda c: c[2]))
    CR = np.array(sorted((s.centroid for s in tr_R), key=lambda c: c[2]))

    def merged(z):
        pL = np.r_[axis_xy(CL, z), z]
        pR = np.r_[axis_xy(CR, z), z]
        return any(lp.closed and loop_contains(lp, pL) and loop_contains(lp, pR) for lp in geom.section(pL, [0.0, 0.0, 1.0]))

    z_prev = z = z_lo * H
    while z < 0.95 * geom.hi[2]:
        if merged(z):
            if z == z_prev:
                return float(z)
            a, b = z_prev, z
            for _ in range(iters):
                m = 0.5 * (a + b)
                if merged(m):
                    b = m
                else:
                    a = m
            return float(0.5 * (a + b))
        z_prev, z = z, z + step * H
    return None


def leg_tracks(geom: MeshGeom, H: float, feet: dict, z_start: float = 0.07, step: float = 0.01) -> dict:
    """Track both legs upward from ``z_start`` H (horizontal start, axis re-fitted) until they merge or vanish, then cut both tracks
    at the crotch (``find_crotch``). Returns ``{"L": [Slice], "R": [Slice], "merge_z": crotch z (m) - or, when the legs never meet in
    one loop, the higher track end -, "crotch_found": bool}``."""
    out = {"L": [], "R": [], "merge_z": None, "crotch_found": False}
    if "L" not in feet or "R" not in feet:
        return out
    gap = float(abs(feet["L"][0] - feet["R"][0]))
    radius = min(0.07 * H, 0.45 * max(gap, 1e-6))
    for side in ("L", "R"):
        f = feet[side]
        start = np.array([f[0], f[1], z_start * H])
        s0 = limb_section(geom, start, [0, 0, 1], start, radius, innermost=False)
        if s0 is None:
            continue
        start = np.array([s0.centroid[0], s0.centroid[1], z_start * H])
        out[side] = track(geom, start, [0.0, 0.0, 1.0], step * H, int(1.0 / step), radius)
    zc = find_crotch(geom, H, out["L"], out["R"])
    if zc is not None:
        for side in ("L", "R"):
            out[side] = [s for s in out[side] if s.centroid[2] <= zc - 0.002 * H]
        out["merge_z"], out["crotch_found"] = float(zc), True
    else:
        tops = [sl[-1].centroid[2] for sl in (out["L"], out["R"]) if sl]
        out["merge_z"] = float(max(tops)) if tops else None
    return out


def torso_loop(geom: MeshGeom, z: float, x_mid: float) -> Loop | None:
    """The torso in the horizontal section at height ``z``: the largest-area closed loop whose x-range contains ``x_mid``
    (straps, flaps and limbs are smaller or off the midline)."""
    loops = [lp for lp in geom.section([x_mid, 0.0, z], [0.0, 0.0, 1.0])
             if lp.closed and lp.points[:, 0].min() <= x_mid <= lp.points[:, 0].max()]
    return max(loops, key=lambda lp: lp.area) if loops else None


def arm_tracks(geom: MeshGeom, H: float, x_mid: float, step: float = 0.01, z_min_frac: float = 0.3) -> dict:
    """Track both arms inward from the lateral extreme (hand tip) of the mesh above ``z_min_frac`` H, with planes perpendicular to
    the re-fitted arm axis, until the section merges into the torso. Returns ``{"L": {"tip", "slices"}, "R": {...}}``."""
    out = {}
    V = geom.V
    up = V[:, 2] > z_min_frac * H
    for side, s in (("L", 1.0), ("R", -1.0)):
        idx = np.flatnonzero(up & (s * (V[:, 0] - x_mid) > 0))
        if idx.size == 0:
            out[side] = {"tip": None, "slices": []}
            continue
        tip = V[idx[np.argmax(s * (V[idx, 0] - x_mid))]]
        start = tip + np.array([-s * 0.006 * H, 0.0, 0.0])
        # march inward from the hand tip; no stop test over the first 40 % of the tip-to-midline distance (fingers, palm, cuffs)
        free = 0.4 * abs(float(tip[0]) - x_mid)
        sl = track(geom, start, [-s, 0.0, 0.0], step * H, int(1.0 / step), 0.07 * H, free_dist=free)
        out[side] = {"tip": tip, "slices": sl}
    return out


# --------------------------------------------------------------------------------------------------------------------------
# Part 2 - landmark solver (source a)
# --------------------------------------------------------------------------------------------------------------------------
#
# Every landmark gets ``{"pos": (x, y, z), "confidence": 0..1, "method": text, "diag": {...}}``; each side is measured on its own
# track (no mirroring). Rules follow families/H.json "landmarks.rules" and references/joint-placement.md; numbers that are proposals
# are named constants below (calibrate them on tier-1 CC0 rigs at P5, never on G2). Confidence is a method-reliability score
# (consensus multiplies it with the source weight and drops sources below its floor): 0.75-0.8 clear measured feature, 0.6 rule with
# a fitted or extrapolated part, 0.4-0.5 proportional fallback, LOW_CONF failed precondition.

SPINE_DEPTH_FRAC = 0.62  # spine line at this fraction of the clean front->back torso chord (joint-placement.md: start at 60-65 %)
ELBOW_BACK_FRAC = 0.1  # elbow: joint slightly behind the arm mid-line, fraction of the local front-back chord
KNEE_BACK_FRAC = 0.1  # knee: on the condyle hinge behind the kneecap, fraction of the local front-back chord
TIP_INSET_H = 0.005  # hand_tip / toe_tip: centroid of the section this far inside the extreme point
BALL_HEIGHT_H = 0.024  # ball: metatarsophalangeal line slightly above the sole (joint-placement.md: D01 0.012 m at 0.5 m)
BALL_FRAC = 0.70  # ball: metatarsal heads at ~70 % of the foot length from the heel (anatomical proportion)
ELBOW_BEND_MIN_DEG = 10.0  # below this the arm counts as straight (T-pose section wobble reaches ~6 deg) -> perimeter valley
THIGH_FLARE = 1.06  # hip: the thigh section starts merging with the pelvis where its perimeter exceeds the thigh plateau by 6 %
BACK_JUMP = 1.5  # spine depth: a back chord deeper than this x the reference torso depth = sack/backpack/cape fused to the back
SHOULDER_FLARE = 1.15  # shoulder: the upper-arm section starts merging into the torso where its perimeter exceeds the plateau by 15 %
TORSO_DEPTH_H = (0.06, 0.35)  # plausible front-back torso depth (fraction of H); outside it the spine line is unreliable
ARM_HIDDEN_FRAC = 0.45  # arm track ends farther out than this fraction of tip->midline: the upper arm is hidden (sleeve, cape)
LEG_HIDDEN_H = 0.12  # crotch this far (x H) below the family hip prior: the thigh is hidden (skirt, robe)
LOW_CONF = 0.2  # confidence of a landmark whose method preconditions failed (consensus drops it below its confidence floor)
# review r1 (fix round 2)
PLATEAU_RISE = 0.10  # wrist / ankle: the narrow plateau ends where the perimeter exceeds its minimum by 10 % (hand / foot flare)
REFINE_ITERS = 7  # bisection halvings between two track slices (slice step / 128)
OLECRANON_PROM = 0.15  # elbow: back-surface bump at least this x the local radius above both its sides = olecranon
OLECRANON_WINDOW = (2.0, 0.5)  # olecranon search from 2 radii distal to 0.5 radii proximal of the perimeter valley
KNEECAP_PROM_H = 0.002  # knee: front-surface bump (most forward point) at least this much (x H) in front of both its sides = kneecap
KNEE_BELOW_CAP_H = 0.01  # knee hinge this far (x H) below the kneecap's most forward point (the joint line at its lower pole)
KNEE_BEND_MIN_DEG = 5.0  # leg medial curve bent more than this (two-segment fit) -> knee at the bend
LEG_PROFILE_DZ_H = 0.0025  # horizontal leg sections every 0.25 % H (ankle, knee)
CUFF_STEP = 0.15  # perimeter step > 15 % between neighbouring leg sections = cuff, boot or wrap edge
CUFF_NEAR_H = 0.02  # a knee found by bend/valley within this (x H) of a cuff edge is unreliable
HEAD_RADIUS_H = {"H": 0.065, "S": 0.09}  # head-mass ball radius to start from (x H) by family (adult head ~0.065 H; S = big-head)
EAR_PROTRUSION_R = 0.3  # ear: lobe sticking out >= 0.3 head radii beyond the skull side, on both sides, in >= 2 coronal planes
HEAD_PIVOT_FROM_EAR = (0.27, 0.30)  # visible ears: skull base this far (x head radius) behind / below the ear base (D01: 12 / 13 mm)
HEAD_PIVOT_FROM_MASS = (0.18, 0.55)  # hidden ears: skull base this far (x head radius) behind / below the head-mass centre (human
#                                      proportions: ear canal ~0.10 R behind / 0.35 R below the head mass, skull base ~1 cm behind and
#                                      ~2 cm below the ear canal at R ~ 0.1 m)
CORNER_AGREE_H = 0.03  # chest: the two armpit corners must agree within 3 % H in z to be used (hidden arms give stray corners)
CLAV_X_FRAC = 0.2  # clavicle head: 20 % of the way chest x -> shoulder in x
CLAV_DEPTH_FRAC = 0.15  # clavicle head: this fraction of the torso chord behind the front surface at the sternal notch
CLAV_Z_FRAC = 0.75  # clavicle head: 3/4 of the way chest -> neck base in z
INSIDE_MARGIN_H = 0.005  # a landmark pushed inside the mesh ends this far (x H) inside, at most half the local chord
INSIDE_PUSH_MAX_H = 0.03  # farther outside than this (x H): not pushed, LOW confidence
SEGMENT_RATIO = {"arm": (0.5, 2.0), "leg": (0.5, 2.0)}  # upper/fore and thigh/shin length ratios outside this = gross error (the
#                                                          family bands, families/<F>.json plausibility.segment_ratio, gate in consensus)
# review r2 (fix round 3), interim rules until P5 - provisional, calibrate on tier-1 rigs, never on G2
HEAD_RADIUS_CLAMP = (0.6, 1.5)  # head offsets use the measured head radius clamped to this x the starting radius (HEAD_RADIUS_H)
HEAD_PIVOT_OFFSET_H = (0.01, 0.04)  # pivot offset (pivot - ear base, or - head-mass centre) outside this band (x H): confidence lowered
HEAD_OFFSET_CONF = 0.35  # confidence of a head pivot whose offset leaves HEAD_PIVOT_OFFSET_H
# head island and head top (I4; the I3 pipeline run put D01's head_top on an eye island, 50 mm in front of the pivot)
HEAD_COLUMN_H = 0.08  # head column: |x - x_mid| below this (x H) and above the neck base (head island, top vertex, helmet search)
HEAD_TOP_CONF = 0.7  # head top = the head island's surface above the head-mass centre
HEAD_TOP_OPEN_CONF = 0.45  # the head island is open above the head mass: head top on the first surface above it (inside of a helmet)
BOOT_EDGE_STEP = 0.10  # boot ankle: perimeter step > 10 % between neighbouring leg sections = cuff / boot edge (D01's bare ankle
#                        changes <= 6 % per section, FL's shoe collar 13 %; the knee keeps the coarser CUFF_STEP)
# boot ankle trigger window (review r3 Q2), x H: [max(ball + BOOT_BALL_CLEAR_H, flare - BOOT_EDGE_BELOW_H), flare + BOOT_EDGE_ABOVE_H].
# Wraps can make a soft false flare above the real foot junction (U01: perimeter 367 -> 305 mm at z 0.117-0.121, "flare" at 0.159).
BOOT_EDGE_ABOVE_H = 0.03
BOOT_EDGE_BELOW_H = 0.03
BOOT_BALL_CLEAR_H = 0.02
BOOT_ANKLE_CONF = 0.45  # boot ankle: confidence of the instep-crease ankle (consensus accepts it only when UniRig agrees within tau)
CREASE_MIN_DEPTH = 0.02  # instep crease: the deepest point must lie more than 2 % of the chord length behind it (FL's shoe: 14 %)
CLAV_HALF_WIDTH_FRAC = 0.17  # clavicle head x: this fraction of its side's chest-loop half-width from the chest x (D01: 15 mm, as the
#                              round-2 rule 20 % chest -> shoulder gave; no longer inherits a shoulder found out on the arm)
# a clavicle whose segment from the spine/neck line crosses a surface is moved back inside and drops to LOW_CONF whatever the move
# (review r3 F3): source a is its only position source (UniRig is sanity-only there), and the move size does not tell a good
# correction from a bad one (U01's 84 mm move ended 5 mm from the midline; a body under a coat can need a long, correct move)
CORE = ("pelvis", "spine_01", "spine_02", "chest", "neck", "head", "clavicle", "shoulder", "elbow", "wrist", "palm", "hip", "knee",
        "ankle", "ball")  # checked inside the mesh (tips, ground points and head_top are surface points)


def _j(v):
    """JSON-safe copy of a diag value (numpy scalars / arrays -> rounded floats and lists; non-finite -> None)."""
    if isinstance(v, dict):
        return {str(k): _j(x) for k, x in v.items()}
    if isinstance(v, np.ndarray):
        return _j(v.tolist())
    if isinstance(v, (list, tuple)):
        return [_j(x) for x in v]
    if isinstance(v, (bool, np.bool_)):
        return bool(v)
    if isinstance(v, (int, np.integer)):
        return int(v)
    if isinstance(v, (float, np.floating)):
        return round(float(v), 6) if math.isfinite(float(v)) else None
    return v


def _lm(pos, conf, method, /, **diag) -> dict:
    return {"pos": tuple(float(c) for c in np.asarray(pos, dtype=np.float64)), "confidence": float(conf), "method": method,
            "diag": _j(diag)}


def _lower(lms: dict, lid: str, why: str, conf: float = LOW_CONF) -> None:
    """Lower ``lid``'s confidence to at most ``conf``; the reason goes into its method text and ``diag.downgrades``."""
    e = lms.get(lid)
    if e is None:
        return
    if e["confidence"] > conf:
        e["confidence"] = float(conf)
        e["method"] += f" [{'LOW' if conf <= LOW_CONF else f'conf {conf:.2f}'}: {why}]"
    e.setdefault("diag", {}).setdefault("downgrades", []).append(why)


def _refine_min(values, k) -> float:
    """Sub-sample position of a minimum at index ``k`` (parabola through k-1, k, k+1), as a fractional index."""
    if 0 < k < len(values) - 1:
        a, b, c = values[k - 1], values[k], values[k + 1]
        den = a - 2 * b + c
        if den > 0:
            return k + float(np.clip(0.5 * (a - c) / den, -0.5, 0.5))
    return float(k)


def _interp_slices(slices, fk) -> np.ndarray:
    """Centroid at fractional slice index ``fk`` (linear between neighbours)."""
    i = int(np.clip(math.floor(fk), 0, len(slices) - 1))
    j = min(i + 1, len(slices) - 1)
    t = float(np.clip(fk - i, 0.0, 1.0))
    return (1 - t) * slices[i].centroid + t * slices[j].centroid


def _slice_frame(slices, f) -> tuple[np.ndarray, np.ndarray]:
    """Plane origin (centroid) and unit normal at fractional slice index ``f`` (linear between neighbours)."""
    i = int(np.clip(math.floor(f), 0, len(slices) - 1))
    j = min(i + 1, len(slices) - 1)
    t = float(np.clip(f - i, 0.0, 1.0))
    return (1 - t) * slices[i].centroid + t * slices[j].centroid, unit((1 - t) * slices[i].normal + t * slices[j].normal)


def _section_at(geom: MeshGeom, slices, f, radius: float, union: bool = False) -> tuple[float, np.ndarray, list]:
    """Section between track slices at fractional index ``f``: ``(perimeter, centroid, loops)`` of the innermost closed loop around
    the interpolated centroid, or with ``union`` of all closed loops whose centroid lies within ``radius`` (the whole hand)."""
    o, n = _slice_frame(slices, f)
    if union:
        loops = [lp for lp in geom.section(o, n) if lp.closed and np.linalg.norm(lp.centroid - o) < radius]
        if loops:
            a = np.array([max(lp.area, 1e-12) for lp in loops])
            return float(sum(lp.perimeter for lp in loops)), (np.array([lp.centroid for lp in loops]) * a[:, None]).sum(0) / a.sum(), loops
    s = limb_section(geom, o, n, o, radius)
    if s is None:
        return math.nan, o, []
    return s.perimeter, s.centroid, s.loops


def _bisect_crossing(fun, f_above, f_below, thr, iters: int = REFINE_ITERS) -> float:
    """Position between ``f_above`` (fun > thr) and ``f_below`` (fun <= thr) where ``fun`` crosses ``thr`` (bisection; nan counts as
    above)."""
    a, b = float(f_above), float(f_below)
    for _ in range(iters):
        m = 0.5 * (a + b)
        if fun(m) <= thr:
            b = m
        else:
            a = m
    return 0.5 * (a + b)


def _chord_y(geom: MeshGeom, p) -> tuple[float, float]:
    """Front (-Y) and back (+Y) surface y through ``p`` (nearest crossings on each side), nan when the ray escapes."""
    tn, tp = geom.chord(p, [0.0, 1.0, 0.0])
    return float(p[1] - tn), float(p[1] + tp)


def _vertex_normals(geom: MeshGeom) -> np.ndarray:
    FN = geom.face_normals()
    vn = np.zeros_like(geom.V)
    for k in range(3):
        np.add.at(vn, geom.F[:, k], FN)
    return unit(vn)


def _union_profile(geom: MeshGeom, slices, radius: float) -> tuple[np.ndarray, np.ndarray]:
    """Per track slice: total perimeter and count of ALL closed loops of the same plane within ``radius`` of the slice centroid
    (the whole hand cross-section, all fingers included; the track itself keeps only the innermost loop)."""
    per, cnt = [], []
    for s in slices:
        loops = [lp for lp in geom.section(s.origin, s.normal) if lp.closed and np.linalg.norm(lp.centroid - s.centroid) < radius]
        per.append(sum(lp.perimeter for lp in loops) if loops else s.perimeter)
        cnt.append(len(loops) if loops else s.n_loops)
    return np.array(per), np.array(cnt)


# ---------------------------------------------------------------- arms


def find_wrist(geom: MeshGeom, H: float, slices) -> dict | None:
    """Wrist on an arm track marched from the hand tip (index 0): the DISTAL END of the forearm's narrow plateau (joint-placement.md
    Wrist, review r1). The plateau minimum is the smallest whole-section perimeter in 12-55 % of the track (single-loop slices
    preferred); walking toward the hand, the wrist is where the perimeter first exceeds (1 + PLATEAU_RISE) x that minimum, bisected
    between the two slices. Returns {"index" (fractional), "k" (nearest slice), "k_min" (plateau minimum), "pos", "per_min", "thr",
    "contrast", "per", "count"}."""
    n = len(slices)
    if n < 6:
        return None
    radius = 0.07 * H
    uper, ucnt = _union_profile(geom, slices, radius)
    lo, hi = max(1, int(0.12 * n)), max(3, int(0.55 * n))
    cand = [k for k in range(lo, hi) if ucnt[k] == 1] or list(range(lo, hi))
    km = min(cand, key=lambda k: uper[k])
    pmin = float(uper[km])
    thr = (1.0 + PLATEAU_RISE) * pmin
    j = km
    while j > 0 and uper[j - 1] <= thr:
        j -= 1
    fw = 0.0 if j == 0 else _bisect_crossing(lambda f: _section_at(geom, slices, f, radius, union=True)[0], j - 1, j, thr)
    contrast = float(min(uper[:km].max(), uper[km:].max()) / max(pmin, 1e-12)) if 0 < km < n - 1 else 1.0
    return {"index": fw, "k": int(round(fw)), "k_min": km, "pos": _interp_slices(slices, fw), "per_min": pmin, "thr": thr,
            "contrast": contrast, "per": uper, "count": ucnt}


def _olecranon(geom: MeshGeom, slices, fv: float, r: float, step: float) -> tuple[float, dict]:
    """Olecranon near the elbow's perimeter valley (fractional index ``fv``, local radius ``r``, slice spacing ``step`` m): 41 sections
    from OLECRANON_WINDOW[0] radii distal (toward the hand = lower index) to [1] radii proximal. The back surface is measured against
    ONE straight axis fitted to the window's centroids: s_b = farthest loop point behind its axis point along +Y made perpendicular to
    that axis (a per-slice frame would add the arm's tilt). The olecranon is the most prominent local maximum of s_b at or distal of
    the valley that stands at least OLECRANON_PROM x r above the lowest s_b on both its sides. Returns (elbow index, info)."""
    d_lo, d_hi = OLECRANON_WINDOW[0] * r / max(step, 1e-12), OLECRANON_WINDOW[1] * r / max(step, 1e-12)
    fs = np.linspace(max(0.0, fv - d_lo), min(len(slices) - 1.0, fv + d_hi), 41)
    secs = []
    for f in fs:
        o, nrm = _slice_frame(slices, f)
        s = limb_section(geom, o, nrm, o, 3.0 * r)
        secs.append(None if s is None else (s.centroid, np.concatenate([lp.points for lp in s.loops])))
    C = np.array([q[0] for q in secs if q is not None])
    info: dict = {"window": [float(fs[0]), float(fs[-1])], "r": r}
    if len(C) < 5:
        info.update(found=False, why="too few sections around the valley")
        return fv, info
    c0, ax = pca_axis(C)
    b = unit(np.array([0.0, 1.0, 0.0]) - ax[1] * ax)
    sb = np.full(len(fs), np.nan)
    for i, q in enumerate(secs):
        if q is not None:
            a = c0 + ((q[0] - c0) @ ax) * ax
            sb[i] = float(np.max((q[1] - a) @ b))
    best = None
    for i in range(1, len(fs) - 1):
        if not (np.isfinite(sb[i]) and sb[i] >= np.nanmax(sb[i - 1:i + 2])) or fs[i] > fv + 0.25 * d_hi:
            continue
        left, right = sb[:i], sb[i + 1:]
        if not (np.isfinite(left).any() and np.isfinite(right).any()):
            continue
        prom = min(sb[i] - np.nanmin(left), sb[i] - np.nanmin(right))
        if best is None or prom > best[1]:
            best = (i, prom)
    if best is None or best[1] < OLECRANON_PROM * r:
        info.update(found=False, why="no back-surface bump" if best is None else
                    f"best bump {best[1] / max(r, 1e-12):.2f} r < {OLECRANON_PROM} r")
        return fv, info
    i = best[0]
    fo = float(fs[i])
    if 0 < i < len(fs) - 1 and np.isfinite(sb[i - 1:i + 2]).all():
        den = sb[i - 1] - 2 * sb[i] + sb[i + 1]
        if den < 0:
            fo += float(np.clip(0.5 * (sb[i - 1] - sb[i + 1]) / den, -0.5, 0.5)) * float(fs[1] - fs[0])
    info.update(found=True, index=fo, prominence_r=best[1] / max(r, 1e-12), offset_m=(fv - fo) * step)
    return fo, info


def surface_samples(V, F, n: int, seed: int = 0) -> tuple[np.ndarray, np.ndarray]:
    """``n`` area-uniform random points on the triangles ``F`` (deterministic for a seed) and the index of the triangle of each."""
    rng = np.random.default_rng(seed)
    tri = V[F]
    area = 0.5 * np.linalg.norm(np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0]), axis=1)
    k = rng.choice(len(F), size=n, p=area / area.sum())
    u, v = rng.random(n), rng.random(n)
    flip = u + v > 1
    u[flip], v[flip] = 1 - u[flip], 1 - v[flip]
    t = tri[k]
    return t[:, 0] + u[:, None] * (t[:, 1] - t[:, 0]) + v[:, None] * (t[:, 2] - t[:, 0]), k


def _shoulder_sphere(geom: MeshGeom, onset, ax, r_up: float) -> tuple[np.ndarray | None, dict]:
    """Sphere fit to the deltoid cap around the upper-arm flare ``onset``: 800 area-uniform surface samples on the triangles within
    2 r_up of it (low-poly meshes have few vertices there); kept when within 1.5 r_up of the onset, from 0.5 r_up outward to 1.5 r_up
    inward along the inward arm axis ``ax``, with the triangle normal facing up (z > 0.2) and away from the arm axis (> 0.3).
    Accepted when 0.5 r_up < r < 2 r_up, the centre lies within r_up of the onset and inside the mesh, and the rms residual is
    < 0.25 r. Returns (centre or None, info with the ``reasons`` of a rejection)."""
    V, F = geom.V, geom.F
    near = np.flatnonzero(np.linalg.norm(V[F].mean(1) - onset, axis=1) < 2.0 * r_up)
    info: dict = {"r_up": r_up, "reasons": []}
    if len(near) < 4:
        info.update(n_cap=0)
        info["reasons"].append(f"only {len(near)} triangles near the onset")
        return None, info
    P, k = surface_samples(V, F[near], 800)
    nrm = geom.face_normals()[near][k]
    rel = P - onset
    along = rel @ ax
    radial = rel - np.outer(along, ax)
    rad = np.linalg.norm(radial, axis=1)
    out_dir = radial / np.where(rad > 1e-12, rad, 1.0)[:, None]
    cap = ((np.linalg.norm(rel, axis=1) < 1.5 * r_up) & (along > -0.5 * r_up) & (along < 1.5 * r_up) & (nrm[:, 2] > 0.2)
           & ((nrm * out_dir).sum(1) > 0.3))
    info["n_cap"] = int(cap.sum())
    if cap.sum() < 30:
        info["reasons"].append(f"only {int(cap.sum())} cap samples (< 30)")
        return None, info
    c, r, rms = fit_sphere(P[cap])
    dist = float(np.linalg.norm(c - onset))
    inside = bool(geom.winding(c[None])[0] > 0.5)
    info.update(r=r, rms=rms, centre_dist=dist, centre=c, centre_inside=inside)
    if not 0.5 * r_up < r < 2.0 * r_up:
        info["reasons"].append(f"radius {r * 1000:.1f} mm outside 0.5-2 x r_up {r_up * 1000:.1f} mm")
    if dist >= r_up:
        info["reasons"].append(f"centre {dist * 1000:.1f} mm from the onset >= r_up")
    if rms >= 0.25 * r:
        info["reasons"].append(f"rms {rms * 1000:.1f} mm >= 0.25 r")
    if not inside:
        info["reasons"].append("centre outside the mesh")
    return (None if info["reasons"] else c), info


def _arm(geom: MeshGeom, H: float, side: str, tr: dict) -> dict:
    """Wrist, elbow, shoulder, hand tip and palm of one arm from its track (marched from the hand tip toward the torso)."""
    out: dict = {}
    sl = tr["slices"]
    tip = tr["tip"]
    if tip is None or len(sl) < 8:
        return out
    n = len(sl)
    step = float(np.median([np.linalg.norm(sl[k + 1].centroid - sl[k].centroid) for k in range(n - 1)]))
    per = np.array([x.perimeter for x in sl])
    radius = 0.07 * H
    wr = find_wrist(geom, H, sl)
    fw, kw, wrist = wr["index"], wr["k_min"], wr["pos"]
    out[f"wrist_{side}"] = _lm(wrist, 0.8 if wr["contrast"] > 1.3 else 0.6,
                               f"arm track: distal end of the forearm plateau (whole-section perimeter > {1 + PLATEAU_RISE:.2f} x the plateau "
                               f"minimum {wr['per_min'] * 1000:.1f} mm toward the hand; slice {fw:.2f}/{n}, contrast {wr['contrast']:.2f})",
                               slice=fw, slice_min=kw, per_min=wr["per_min"], contrast=wr["contrast"])
    # elbow: bend of the medial curve (wrist plateau .. 85 % of the track) when clearer than ELBOW_BEND_MIN_DEG, else the perimeter
    # valley right after the forearm bulge ("minimum of perimeter between the long bones"), moved to the olecranon bump when found
    seg = np.arange(kw, max(kw + 3, int(0.85 * n)))
    C = np.array([sl[min(k, n - 1)].centroid for k in seg])
    a0, b0 = C[0], C[-1]
    dvec = unit(b0 - a0)
    off = np.linalg.norm((C - a0) - np.outer((C - a0) @ dvec, dvec), axis=1)
    lo_b, hi_b = int(0.2 * len(C)), max(int(0.8 * len(C)), int(0.2 * len(C)) + 1)
    kb = lo_b + int(np.argmax(off[lo_b:hi_b]))
    bend_deg = 0.0
    if 0 < kb < len(C) - 1:
        bend_deg = math.degrees(math.acos(float(np.clip(unit(C[kb] - a0) @ unit(b0 - C[kb]), -1, 1))))
    pseg = per[kw:]
    i1 = max(int(0.75 * (n - kw)), 3)
    ediag: dict = {"bend_deg": bend_deg}
    if bend_deg > ELBOW_BEND_MIN_DEG:
        fe = kw + float(kb)
        how, conf = f"medial-curve bend {bend_deg:.1f} deg", 0.8
    else:
        j0 = int(np.argmax(pseg[:max(i1, 3)]))  # forearm bulge
        j1 = j0 + 1 + int(np.argmin(pseg[j0 + 1:max(i1, j0 + 3)])) if j0 + 1 < len(pseg) else j0
        fv = kw + _refine_min(pseg, j1)
        prom = float(pseg[j0] / max(pseg[j1], 1e-12) - 1.0)
        r_v = float(per[int(round(fv))]) / (2 * math.pi)
        fe, oc = _olecranon(geom, sl, fv, r_v, step)
        ediag.update(valley_slice=fv, bulge_over_valley=prom, olecranon=oc)
        if oc.get("found"):
            how, conf = (f"olecranon bump ({oc['prominence_r']:.2f} r) on the back surface {oc['offset_m'] * 1000:.1f} mm distal of the "
                         f"perimeter valley after the forearm bulge (straight arm, bend {bend_deg:.1f} deg)"), 0.75
        else:
            conf = 0.6 if prom >= 0.15 else (0.45 if prom >= 0.05 else 0.3)
            how = (f"perimeter valley after the forearm bulge (straight arm, bend {bend_deg:.1f} deg, bulge/valley {1 + prom:.2f}; "
                   f"olecranon: {oc.get('why')})")
    ke = int(round(fe))
    elbow = _interp_slices(sl, fe)
    fy, by = _chord_y(geom, elbow)
    if math.isfinite(fy) and math.isfinite(by):
        elbow = elbow + np.array([0.0, ELBOW_BACK_FRAC * (by - fy), 0.0])
        how += f", +{ELBOW_BACK_FRAC:.0%} of the front-back chord toward the back"
    ediag["slice"] = fe
    out[f"elbow_{side}"] = _lm(elbow, conf, "arm track: " + how, **ediag)
    # shoulder: where the upper-arm section starts merging into the torso (perimeter above SHOULDER_FLARE x the upper-arm plateau,
    # bisected between slices), refined by a sphere fit to the deltoid cap around that point
    up = per[ke:]
    plateau = float(np.median(up[:max(3, int(0.6 * len(up)))])) if len(up) else float(per[-1])
    thr = SHOULDER_FLARE * plateau
    ko = next((k for k in range(ke + max(2, int(0.3 * (n - ke))), n) if per[k] > thr), None)
    if ko is None:
        fo, onset_how = n - 1.0, "track end (no flare found)"
    else:
        fo = _bisect_crossing(lambda f: _section_at(geom, sl, f, radius)[0], ko, ko - 1, thr)
        onset_how = f"perimeter > {SHOULDER_FLARE} x the upper-arm plateau {plateau * 1000:.1f} mm, slice {fo:.2f}/{n}"
    onset = _interp_slices(sl, fo)
    r_up = plateau / (2 * math.pi)
    k_hi = min(int(math.ceil(fo)), n - 1)
    k_in = max(0, min(max(ke, int(fo) - max(3, int(0.3 * (fo - ke)))), k_hi - 2))
    _, ax = pca_axis(np.array([sl[k].centroid for k in range(k_in, k_hi + 1)] + [onset]))
    if ax @ (onset - sl[k_in].centroid) < 0:
        ax = -ax  # inward, toward the torso
    c, sinfo = _shoulder_sphere(geom, onset, ax, r_up)
    if c is not None:
        sh = _lm(c, 0.7 if sinfo["rms"] < 0.15 * sinfo["r"] else 0.6,
                 f"sphere fit to {sinfo['n_cap']} deltoid-cap surface samples around the upper-arm flare onset ({onset_how}; r "
                 f"{sinfo['r'] * 1000:.1f} mm, rms {sinfo['rms'] * 1000:.1f} mm)", onset=onset, sphere=sinfo)
    else:
        sh = _lm(onset, 0.6, f"arm axis at the upper-arm flare onset ({onset_how}); sphere fit rejected: {'; '.join(sinfo['reasons'])}",
                 onset=onset, sphere=sinfo)
    out[f"shoulder_{side}"] = sh
    # hand tip: centroid of the section TIP_INSET_H inside the extreme point, perpendicular to the hand axis
    hax = unit(tip - wrist)
    o = tip - TIP_INSET_H * H * hax
    lp = geom.section_near(o, hax, o)
    if lp is not None and np.linalg.norm(lp.centroid - o) < 0.03 * H:
        out[f"hand_tip_{side}"] = _lm(lp.centroid, 0.8, f"section {TIP_INSET_H} H inside the hand's extreme point")
    else:
        out[f"hand_tip_{side}"] = _lm(tip, 0.7, "hand's extreme point")
    # palm: centroid of the whole hand section just proximal to where the fingers split (>= 3 loops)
    length = float((tip - wrist) @ hax)
    fork = None
    for t in np.arange(0.004 * H, length, 0.004 * H):
        o = wrist + t * hax
        if len([q for q in geom.section(o, hax) if q.closed and np.linalg.norm(q.centroid - o) < 0.6 * length]) >= 3:
            fork = t
            break
    if fork is not None:
        o = wrist + (fork - 0.004 * H) * hax
        ls = limb_section(geom, o, hax, o, 0.5 * length, closed_only=False, innermost=False)
        out[f"palm_{side}"] = _lm(ls.centroid if ls is not None else o, 0.6,
                                  f"hand section just before the finger split ({fork * 1000:.1f} mm from the wrist)")
    else:
        o = wrist + 0.5 * length * hax
        ls = limb_section(geom, o, hax, o, 0.5 * length, closed_only=False, innermost=False)
        out[f"palm_{side}"] = _lm(ls.centroid if ls is not None else o, 0.4, "mid-hand section (no finger split found)")
    out["_arm_" + side] = {"onset": onset, "r_up": r_up, "axis_in": ax, "wrist": wrist, "n_slices": n, "shoulder": np.array(sh["pos"]),
                           "tip": tip, "axis": np.array([s.centroid for s in sl])}
    return out


# ---------------------------------------------------------------- legs and feet


def leg_profile(geom: MeshGeom, H: float, track: list, z0: float, z1: float, dz: float) -> dict:
    """Horizontal sections of one leg every ``dz`` m from ``z0`` to ``z1``: innermost closed loop around the leg axis (track centroids
    interpolated in z; below the track its first centroid). Returns arrays ``z``, ``per`` (m), ``cx``, ``cy`` (centroid), ``front`` /
    ``back`` (min / max y of the loop points within the middle half of the loop's width) and ``n`` (loops)."""
    C = np.array(sorted((s.centroid for s in track), key=lambda c: c[2]))
    rows = []
    for z in np.arange(z0, z1 + 1e-12, dz):
        seed = np.array([np.interp(z, C[:, 2], C[:, 0]), np.interp(z, C[:, 2], C[:, 1]), z])
        s = limb_section(geom, seed, [0.0, 0.0, 1.0], seed, 0.07 * H)
        if s is None:
            continue
        P = np.concatenate([lp.points for lp in s.loops])
        band = P[np.abs(P[:, 0] - s.centroid[0]) <= 0.25 * max(float(np.ptp(P[:, 0])), 1e-9)]
        band = band if len(band) else P
        rows.append((z, s.perimeter, s.centroid[0], s.centroid[1], band[:, 1].min(), band[:, 1].max(), s.n_loops))
    A = np.array(rows) if rows else np.zeros((0, 7))
    return {k: A[:, i] for i, k in enumerate(("z", "per", "cx", "cy", "front", "back", "n"))}


def _cuff_edges(pr: dict, z_lo: float) -> list[float]:
    """Heights (m) above ``z_lo`` where the leg perimeter jumps by more than CUFF_STEP between neighbouring sections (cuff, boot top,
    wrap edge)."""
    z, per = pr["z"], pr["per"]
    out = []
    for i in range(len(per) - 1):
        if z[i] < z_lo:
            continue
        q = per[i + 1] / max(per[i], 1e-12)
        if q > 1 + CUFF_STEP or q < 1 / (1 + CUFF_STEP):
            out.append(float(0.5 * (z[i] + z[i + 1])))
    return out


def _ankle(pr: dict, H: float, z_top: float) -> dict | None:
    """Ankle height on a leg profile: the plateau minimum (smallest perimeter between 0.03 H and half the crotch height), then down to
    where the perimeter exceeds (1 + PLATEAU_RISE) x that minimum - the foot flare (joint-placement.md Ankle), interpolated."""
    z, per = pr["z"], pr["per"]
    idx = np.flatnonzero((z >= 0.03 * H) & (z <= 0.5 * z_top) & np.isfinite(per))
    if len(idx) < 4:
        return None
    k = int(idx[np.argmin(per[idx])])
    pmin = float(per[k])
    thr = (1.0 + PLATEAU_RISE) * pmin
    j = k
    while j > 0 and per[j - 1] <= thr:
        j -= 1
    j2 = k
    while j2 < len(per) - 1 and per[j2 + 1] <= thr:
        j2 += 1
    if j == 0:
        return {"z": float(z[0]), "z_min": float(z[k]), "per_min": pmin, "plateau": [float(z[0]), float(z[j2])], "foot_flare": False}
    t = (thr - per[j]) / (per[j - 1] - per[j])
    za = float(z[j] + t * (z[j - 1] - z[j]))
    return {"z": za, "z_min": float(z[k]), "per_min": pmin, "plateau": [za, float(z[j2])], "foot_flare": True}


def _two_segment(P: np.ndarray, zbs) -> tuple | None:
    """Best two-line fit of the points ``P`` (k,3) split at heights ``zbs``: (residual, z_break, bend deg, residual of one line)."""
    c, ax = pca_axis(P)
    d = P - c
    r1 = float(((d - np.outer(d @ ax, ax)) ** 2).sum())
    best = None
    for zb in zbs:
        lo, hi = P[P[:, 2] <= zb], P[P[:, 2] >= zb]
        if len(lo) < 4 or len(hi) < 4:
            continue
        res, dirs = 0.0, []
        for Q in (lo, hi):
            cq, aq = pca_axis(Q)
            dq = Q - cq
            res += float(((dq - np.outer(dq @ aq, aq)) ** 2).sum())
            dirs.append(aq if aq[2] > 0 else -aq)
        ang = math.degrees(math.acos(float(np.clip(dirs[0] @ dirs[1], -1, 1))))
        if best is None or res < best[0]:
            best = (res, float(zb), ang, r1)
    return best


def _knee(pr: dict, H: float, z_ankle: float, z_top: float) -> dict | None:
    """Knee height on a leg profile between the ankle and the leg top:
    1. kneecap: the most forward local point of the front surface in 40-85 % of ankle -> top that stands at least KNEECAP_PROM_H in
       front of both its sides (within 0.05 H); the hinge is KNEE_BELOW_CAP_H below it (the joint line at the kneecap's lower pole);
    2. else the bend of the medial curve (two-line fit, > KNEE_BEND_MIN_DEG, residual < 0.5 x one line);
    3. else the smallest perimeter in the middle third."""
    z, per, front = pr["z"], pr["per"], pr["front"]
    span = z_top - z_ankle
    if span <= 0 or len(z) < 8:
        return None
    best = None
    for i in np.flatnonzero((z >= z_ankle + 0.4 * span) & (z <= z_ankle + 0.85 * span)):
        if i == 0 or i == len(z) - 1 or not (front[i] <= front[i - 1] and front[i] <= front[i + 1]):
            continue
        above = front[(z > z[i]) & (z <= z[i] + 0.05 * H)]
        below = front[(z < z[i]) & (z >= z[i] - 0.05 * H)]
        if not (len(above) and len(below)):
            continue
        prom = float(min(above.max(), below.max()) - front[i])
        if best is None or prom > best[1]:
            best = (int(i), prom)
    if best is not None and best[1] >= KNEECAP_PROM_H * H:
        i = best[0]
        zc = float(np.interp(_refine_min(front, i), np.arange(len(z)), z))
        return {"z": zc - KNEE_BELOW_CAP_H * H, "rule": "kneecap", "kneecap_z": zc, "prominence_H": best[1] / H, "conf": 0.75}
    sel = (z >= z_ankle + 0.1 * span) & (z <= z_top - 0.05 * span)
    P = np.c_[pr["cx"][sel], pr["cy"][sel], z[sel]]
    kc = {"kneecap_best_prominence_H": (best[1] / H) if best else None}
    if len(P) >= 10:
        b = _two_segment(P, np.arange(z_ankle + 0.25 * span, z_ankle + 0.8 * span, LEG_PROFILE_DZ_H * H))
        if b is not None and b[2] >= KNEE_BEND_MIN_DEG and b[0] <= 0.5 * b[3]:
            return {"z": b[1], "rule": "bend", "bend_deg": b[2], "residual_ratio": b[0] / max(b[3], 1e-30), "conf": 0.6, **kc}
        if b is not None:
            kc.update(bend_deg=b[2], residual_ratio=b[0] / max(b[3], 1e-30))
    sel = (z >= z_ankle + span / 3) & (z <= z_ankle + 2 * span / 3)
    if not sel.any():
        return None
    idx = np.flatnonzero(sel)
    i = int(idx[np.argmin(per[idx])])
    return {"z": float(z[i]), "rule": "valley", "conf": 0.5, **kc}


def _leg(geom: MeshGeom, H: float, side: str, track: list, z_top: float) -> dict:
    """Ankle, knee and hip joint centre of one leg: ankle and knee on horizontal sections every LEG_PROFILE_DZ_H (``leg_profile``), the
    hip from the track (marched from above the foot to the crotch ``z_top``)."""
    out: dict = {}
    if len(track) < 8:
        return out
    pr = leg_profile(geom, H, track, 0.02 * H, z_top - 0.005 * H, LEG_PROFILE_DZ_H * H)
    if len(pr["z"]) < 10:
        return out

    def at(z):
        return np.array([np.interp(z, pr["z"], pr["cx"]), np.interp(z, pr["z"], pr["cy"]), z])

    cuffs = _cuff_edges(pr, 0.06 * H)
    an = _ankle(pr, H, z_top)
    if an is None:
        return out
    ankle = at(an["z"])
    out[f"ankle_{side}"] = _lm(ankle, 0.8 if an["foot_flare"] else 0.5,
                               f"leg sections: lower end of the ankle plateau where the foot flares (perimeter > {1 + PLATEAU_RISE:.2f} x the "
                               f"minimum {an['per_min'] * 1000:.1f} mm at z {an['z_min']:.4f}; plateau z {an['plateau'][0]:.4f}-"
                               f"{an['plateau'][1]:.4f})", **an)
    kn = _knee(pr, H, an["z"], z_top)
    if kn is None:
        return out
    knee = at(kn["z"])
    fy, by = _chord_y(geom, knee)
    if math.isfinite(fy) and math.isfinite(by):
        knee = knee + np.array([0.0, KNEE_BACK_FRAC * (by - fy), 0.0])
    how = {"kneecap": f"lower pole of the kneecap (front bump {kn.get('prominence_H', 0) * 100:.2f} % H at z {kn.get('kneecap_z', 0):.4f}, "
                      f"hinge {KNEE_BELOW_CAP_H} H below)",
           "bend": f"bend of the leg's medial curve ({kn.get('bend_deg', 0):.1f} deg)",
           "valley": "smallest perimeter in the middle third of ankle -> leg top (no kneecap, no bend)"}[kn["rule"]]
    near = min((abs(c - kn["z"]) for c in cuffs), default=math.inf)
    out[f"knee_{side}"] = _lm(knee, kn["conf"], f"leg sections: {how}, +{KNEE_BACK_FRAC:.0%} of the chord toward the back",
                              cuff_edges=cuffs, nearest_cuff_H=near / H if math.isfinite(near) else None, **kn)
    if kn["rule"] != "kneecap" and near < CUFF_NEAR_H * H:
        _lower(out, f"knee_{side}", f"knee found {near / H * 100:.1f} % H from a cuff/boot/wrap edge (perimeter step > {CUFF_STEP:.0%})")
    # hip joint centre: thigh axis (knee .. flare onset) extrapolated to the top of the thigh: where the thigh section starts
    # merging with the pelvis (perimeter above THIGH_FLARE x the thigh plateau), at the latest the crotch (track end)
    per = np.array([s.perimeter for s in track])
    C = np.array([s.centroid for s in track])
    n = len(track)
    kk = int(np.argmin(np.abs(C[:, 2] - kn["z"])))
    hip = None
    if kk < n - 2:
        hi_pl = max(kk + 2, int(kk + 0.75 * (n - kk)))
        plateau = float(np.max(per[kk:hi_pl]))
        kf = next((k for k in range(int(kk + 0.5 * (n - kk)), n) if per[k] > THIGH_FLARE * plateau), n)
        top = track[max(kf - 1, kk)]
        mid = C[kk:max(kf - 1, kk + 2)]
        if len(mid) >= 2:
            c, axv = pca_axis(mid)
            if axv[2] < 0:
                axv = -axv
            hip = c + axv * ((top.centroid[2] - c[2]) / max(axv[2], 1e-6))
            out[f"hip_{side}"] = _lm(hip, 0.6, f"thigh axis extrapolated to the top of the thigh (section starts merging at z "
                                     f"{top.centroid[2]:.4f}; crotch {z_top:.4f})", thigh_top_z=top.centroid[2], crotch_z=z_top)
    out["_leg_" + side] = {"ankle": ankle, "knee": knee, "hip": hip, "profile": pr, "cuffs": cuffs, "ankle_fit": an}
    return out


def _boot_edges(pr: dict, lo: float, hi: float) -> list[dict]:
    """Cuff / boot edges for the boot-ankle rule: neighbouring leg sections whose perimeter changes by more than BOOT_EDGE_STEP, kept
    when the step interval overlaps [``lo``, ``hi``] (m). Returns ``[{"z": mid height, "z_pair": [z_i, z_i+1], "ratio": per ratio}]``."""
    z, per = pr["z"], pr["per"]
    out = []
    for i in range(len(per) - 1):
        if z[i + 1] < lo or z[i] > hi:
            continue
        q = float(per[i + 1] / max(per[i], 1e-12))
        if q > 1 + BOOT_EDGE_STEP or q < 1 / (1 + BOOT_EDGE_STEP):
            out.append({"z": float(0.5 * (z[i] + z[i + 1])), "z_pair": [float(z[i]), float(z[i + 1])], "ratio": q})
    return out


def _instep_crease(geom: MeshGeom, axis_pt, fax, z_lo: float, z_hi: float, f_ball: float, f_max: float,
                   dz: float) -> tuple[float | None, dict]:
    """Instep crease (boot-ankle rule): the most concave point of the front profile of the sagittal foot section between the ball and
    the cuff edge. The section plane passes through the leg-axis point ``axis_pt`` and holds the horizontal foot axis ``fax`` (heel ->
    toe) and Z. The front profile is the front envelope of all section pieces, closed or open (a leg tube that ends inside a shoe cuts
    open): at heights every ``dz`` from ``z_lo`` (ball height) to ``z_hi`` (cuff edge) the front-most crossing along ``fax`` in front of
    the leg axis (at most ``f_max`` ahead: the toe tip). It runs from the cuff down to where it reaches the ball's forward position
    ``f_ball`` (a toe cap or the toes ahead of the ball are not part of it). The crease is the profile point farthest behind the chord
    between the run's two ends (a straight or bulging profile has none). Returns (z of the crease or None, info)."""
    axis_pt = np.asarray(axis_pt, dtype=np.float64)
    fax = unit(np.array([fax[0], fax[1], 0.0]))
    nrm = unit(np.cross(fax, [0.0, 0.0, 1.0]))
    loops = geom.section(axis_pt, nrm)
    zs = np.arange(z_lo, z_hi + 1e-12, dz)
    env = np.full(len(zs), -np.inf)
    for lp in loops:
        Q = np.concatenate([lp.points, lp.points[:1]]) if lp.closed else lp.points
        a, b = Q[:-1], Q[1:]
        fa, fb, za, zb = (a - axis_pt) @ fax, (b - axis_pt) @ fax, a[:, 2], b[:, 2]
        for j, z in enumerate(zs):
            m = (np.minimum(za, zb) <= z) & (np.maximum(za, zb) >= z) & (za != zb)
            if m.any():
                f = fa[m] + (z - za[m]) / (zb[m] - za[m]) * (fb[m] - fa[m])
                f = f[(f > 0) & (f <= f_max)]
                if f.size:
                    env[j] = max(env[j], float(f.max()))
    idx = np.flatnonzero(np.isfinite(env))
    run: list = []
    for j in idx[::-1]:  # from the cuff down to the ball's forward position
        if env[j] > f_ball:
            if run:
                zj, fj = zs[j], env[j]
                zr, fr = run[-1][1], run[-1][0]
                run.append((f_ball, float(zj + (f_ball - fj) / (fr - fj) * (zr - zj))))
            break
        run.append((float(env[j]), float(zs[j])))
    if len(run) < 3:
        return None, {"why": f"front profile behind the ball found at {len(run)} heights between z {z_lo:.4f} and {z_hi:.4f}"}
    Q = np.array(run[::-1])
    a, b = Q[0], Q[-1]
    ch = b - a
    L = float(np.linalg.norm(ch))
    behind = (ch[0] * (Q[:, 1] - a[1]) - ch[1] * (Q[:, 0] - a[0])) / max(L, 1e-12)  # > 0: behind the chord, toward the leg (concave)
    k = int(np.argmax(behind))
    info = {"n_profile": int(len(Q)), "f_ball": float(f_ball), "chord": [a.tolist(), b.tolist()], "depth_m": float(behind[k]),
            "front_m": float(Q[k, 0]), "profile": Q.tolist()}
    if behind[k] <= CREASE_MIN_DEPTH * L:
        info["why"] = f"front profile not concave between the ball and the cuff (deepest point {behind[k] * 1000:.1f} mm behind the chord)"
        return None, info
    return float(Q[k, 1]), info


def _leg_axis_at(pr: dict, an: dict, H: float):
    """Leg axis below the ankle plateau: a line fitted (least squares in z) to the profile centroids of the plateau (at least the first
    0.06 H above the foot flare), returned as a function z -> point."""
    z = pr["z"]
    sel = (z >= an["z"]) & (z <= max(an["plateau"][1], an["z"] + 0.06 * H))
    if sel.sum() < 3:
        return lambda q: np.array([np.interp(q, z, pr["cx"]), np.interp(q, z, pr["cy"]), q])
    cx, cy = np.polyfit(z[sel], pr["cx"][sel], 1), np.polyfit(z[sel], pr["cy"][sel], 1)
    return lambda q: np.array([np.polyval(cx, q), np.polyval(cy, q), q])


def _boot_window(z_flare: float, z_ball: float, H: float) -> tuple[float, float]:
    """Boot-ankle trigger window (m) around the foot flare (review r3 Q2): [max(ball + BOOT_BALL_CLEAR_H H, flare - BOOT_EDGE_BELOW_H
    H), flare + BOOT_EDGE_ABOVE_H H]."""
    return (float(max(z_ball + BOOT_BALL_CLEAR_H * H, z_flare - BOOT_EDGE_BELOW_H * H)), float(z_flare + BOOT_EDGE_ABOVE_H * H))


def _boot_ankle(geom: MeshGeom, H: float, side: str, lms: dict, info: dict) -> None:
    """Boot-ankle interim rule (joint-placement.md "Interim rules until P5", reviews r2 and r3). Trigger: a perimeter step larger than
    BOOT_EDGE_STEP (``_boot_edges``) in ``_boot_window`` around the foot flare - the plateau end found there is a cuff or boot edge,
    or a soft flare that wraps made above the real foot junction (U01). Then the ankle is the instep crease (``_instep_crease``) on the
    leg axis (``_leg_axis_at``), searched between the ball height and the lowest edge, or between the ball and the flare when that
    edge lies below the flare (a foot junction below a soft flare: the run then includes the leg front above the junction);
    confidence BOOT_ANKLE_CONF, marked ``interim_rule = "boot_ankle"`` (+ ``interim_note`` for the junction case; consensus accepts it
    only when UniRig agrees within tau, else the vision check decides). Triggered without a crease: the plateau-end ankle drops to
    LOW_CONF. The trigger test is logged in ``diag.boot`` either way."""
    lid = f"ankle_{side}"
    an, pr = info.get("ankle_fit"), info.get("profile")
    if lid not in lms or not an or pr is None:
        return
    toe, heel, ball = (lms.get(f"{k}_{side}") for k in ("toe_tip", "heel_ground", "ball"))
    z_flare = float(an["z"])
    z_ball = float(ball["pos"][2]) if ball is not None else BALL_HEIGHT_H * H
    lo, hi = _boot_window(z_flare, z_ball, H)
    edges = _boot_edges(pr, lo, hi) if an.get("foot_flare") else []
    boot = {"window": [lo, hi], "z_flare": z_flare, "edges": edges, "triggered": bool(edges)}
    lms[lid].setdefault("diag", {})["boot"] = _j(boot)
    if not edges:
        return
    if toe is None or heel is None:
        _lower(lms, lid, "cuff/boot edge at the ankle plateau; no foot axis for the instep crease")
        return
    edge = min(edges, key=lambda q: q["z"])
    z_cuff = edge["z"]
    below = z_cuff < z_flare
    z_top = z_flare if below else z_cuff
    what = (f"foot junction below a soft flare (perimeter step x{edge['ratio']:.2f} at z {z_cuff:.4f}, flare at z {z_flare:.4f})" if below
            else f"cuff/boot edge at z {z_cuff:.4f} (perimeter step x{edge['ratio']:.2f})")
    axis = _leg_axis_at(pr, an, H)
    o = axis(z_flare)
    fax = np.array(toe["pos"]) - np.array(heel["pos"])
    fax = unit(np.array([fax[0], fax[1], 0.0]))
    f_toe = float((np.array(toe["pos"]) - o) @ fax) + 0.01 * H
    f_ball = float((np.array(ball["pos"]) - o) @ fax) if ball is not None else BALL_FRAC * f_toe
    zc, cinfo = _instep_crease(geom, o, fax, z_ball, z_top, f_ball, f_toe, 0.5 * LEG_PROFILE_DZ_H * H)
    boot.update(crease=cinfo, z_cuff=z_cuff, z_ball=z_ball, below_flare=below, z_search_top=z_top)
    if zc is None:
        lms[lid]["diag"]["boot"] = _j(boot)
        _lower(lms, lid, f"{what} in the ankle window; instep crease not found ({cinfo.get('why')})")
        return
    old = lms[lid]
    e = _lm(axis(zc), BOOT_ANKLE_CONF,
            f"boot ankle (interim rule): {what}; instep crease = most concave point of the front profile in the sagittal foot section "
            f"between the ball (z {z_ball:.4f}) and the {'flare' if below else 'edge'} (z {z_top:.4f}), on the leg axis at z {zc:.4f}; "
            f"plateau-end ankle was z {old['pos'][2]:.4f}",
            boot=dict(boot, z_crease=zc), plateau_end_ankle=list(old["pos"]), plateau_end_method=old["method"])
    e["interim_rule"] = "boot_ankle"
    if below:
        e["interim_note"] = "foot junction below a soft flare"
    lms[lid] = e


def _foot(geom: MeshGeom, H: float, side: str, ankle, x_other: float) -> dict:
    """Ball, toe tip and ground points from the foot vertices under the ankle (slab z < 0.06 H on this side). The foot axis is the
    principal direction of the sole in the ground plane, pointing forward (-Y): splayed feet keep their own axis."""
    out: dict = {}
    V = geom.V
    s = 1.0 if ankle[0] > x_other else -1.0
    mid_x = 0.5 * (ankle[0] + x_other)
    foot = V[(V[:, 2] < 0.06 * H) & (s * (V[:, 0] - mid_x) > 0)]
    if len(foot) < 20:
        return out
    sole = foot[foot[:, 2] < 0.025 * H]
    base = sole if len(sole) >= 10 else foot
    _, ax = pca_axis(np.c_[base[:, :2], np.zeros(len(base))])
    ax = unit(np.array([ax[0], ax[1], 0.0]))
    if ax[1] > 0:
        ax = -ax
    t = (foot - ankle) @ ax
    tip = foot[int(np.argmax(t))]
    o = tip - TIP_INSET_H * H * ax
    lp = geom.section_near(o, ax, o)
    if lp is not None and np.linalg.norm(lp.centroid - o) < 0.04 * H:
        toe, how = lp.centroid, f"section {TIP_INSET_H} H behind the foot's front-most point along the foot axis"
    else:
        toe, how = tip, "foot's front-most point along the foot axis"
    out[f"toe_tip_{side}"] = _lm(toe, 0.8, how)
    tb = (base - ankle) @ ax
    heel = base[int(np.argmin(tb))]
    out[f"heel_ground_{side}"] = _lm((ankle[0], heel[1], 0.0), 0.8, "back-most sole point along the foot axis, x of the ankle, z = 0")
    # ball (metatarsophalangeal line): BALL_FRAC of the way heel -> toe tip along the foot's own axis, BALL_HEIGHT_H above the sole
    # (proportional: toe forks are unreliable - splayed lateral toes split further back - and boots have none)
    hp = np.array([heel[0], heel[1], 0.0])
    b = hp + BALL_FRAC * (np.array([toe[0], toe[1], 0.0]) - hp)
    out[f"ball_{side}"] = _lm((b[0], b[1], BALL_HEIGHT_H * H), 0.5, f"{BALL_FRAC:.0%} of heel -> toe tip along the foot axis, "
                              f"{BALL_HEIGHT_H} H above the sole")
    out[f"ball_ground_{side}"] = _lm((b[0], b[1], 0.0), 0.5, "ball projected to z = 0")
    out[f"toe_ground_{side}"] = _lm((toe[0], toe[1], 0.0), 0.8, "toe tip projected to z = 0")
    return out


# ---------------------------------------------------------------- torso: pelvis, chest, spine


def _armpit_corner(geom: MeshGeom, H: float, x_mid: float, info: dict, side: str) -> dict:
    """Armpit fillet corner of one side (joint-placement.md Chest: maximum curvature of the arm-underside profile). In horizontal
    sections below the arm, the lateral extent w(z) of the torso loop within the arm's y band (onset y +- 1.5 r_up) traces the
    arm-underside outline: right under the arm it is nearly horizontal (dw/dz large), on the torso side nearly vertical (dw/dz ~ 0).
    The corner is where the outline passes 45 deg (dw/dz = 1), scanning down from the top of the arm in 0.2 % H steps."""
    s = 1.0 if side == "L" else -1.0
    yb, rb = float(info["onset"][1]), 1.5 * float(info["r_up"])
    x_arm = abs(float(info["onset"][0]) - x_mid) + 2.0 * float(info["r_up"])  # a loop reaching beyond this still holds the arm
    dz = 0.002 * H
    zs = np.arange(float(info["onset"][2]) + float(info["r_up"]), float(info["onset"][2]) - 0.15 * H, -dz)
    w = np.full(len(zs), np.nan)
    for i, z in enumerate(zs):
        lp = torso_loop(geom, z, x_mid)
        if lp is None:
            continue
        P = lp.points[np.abs(lp.points[:, 1] - yb) <= rb]
        if len(P):
            w[i] = float(np.max(s * (P[:, 0] - x_mid)))
    arm = np.flatnonzero(np.isfinite(w) & (w > x_arm))
    below = np.flatnonzero(np.isfinite(w) & (w <= x_arm) & (np.arange(len(w)) > (arm[0] if len(arm) else -1)))
    if not len(below):
        return {"found": False, "why": "the torso loop never separates from the arm within 0.15 H"}
    i0 = int(below[0])
    ww = w[i0:]
    ok = np.isfinite(ww)
    if ok.sum() < 5:
        return {"found": False, "why": "too few torso sections below the arm"}
    ww = np.interp(np.arange(len(ww)), np.flatnonzero(ok), ww[ok])
    ws = np.convolve(np.r_[ww[0], ww, ww[-1]], np.ones(3) / 3.0, mode="valid")
    slope = (ws[:-1] - ws[1:]) / dz  # dw/dz between consecutive heights (zs decreases)
    zmid = zs[i0:][:-1] - 0.5 * dz
    for k in range(len(slope)):
        if slope[k] <= 1.0:
            if k == 0:
                return {"found": True, "z": float(zmid[0]), "w": float(ws[0]), "z_arm_free": float(zs[i0]), "edge": True}
            t = (slope[k - 1] - 1.0) / max(slope[k - 1] - slope[k], 1e-12)
            zc = float(zmid[k - 1] + t * (zmid[k] - zmid[k - 1]))
            return {"found": True, "z": zc, "w": float(np.interp(-zc, -zs[i0:], ws)), "z_arm_free": float(zs[i0]), "edge": False}
    return {"found": False, "why": "no 45 deg point within 0.15 H below the arm"}


def _armpit_z(geom: MeshGeom, H: float, x_mid: float, z_lo: float, z_hi: float) -> float | None:
    """Fallback chest height: lowest height where the torso section (largest loop on the midline) reaches out to the arms - its
    x-extent jumps above 1.8 x the extent below. Coarse scan in 0.5 % H steps, then bisection to 0.05 % H."""
    zs = np.arange(z_lo, z_hi, 0.005 * H)
    widths = []
    for z in zs:
        lp = torso_loop(geom, z, x_mid)
        widths.append(np.ptp(lp.points[:, 0]) if lp is not None else np.nan)
    widths = np.array(widths)
    for k in range(3, len(zs)):
        win = widths[max(0, k - 6):k]
        if not np.isfinite(win).any():
            continue
        ref = float(np.nanmedian(win))
        if np.isfinite(widths[k]) and widths[k] > 1.8 * ref:
            a, b = zs[k - 1], zs[k]
            for _ in range(6):
                m = 0.5 * (a + b)
                lp = torso_loop(geom, m, x_mid)
                if lp is not None and np.ptp(lp.points[:, 0]) > 1.8 * ref:
                    b = m
                else:
                    a = m
            return float(0.5 * (a + b))
    return None


def _torso(geom: MeshGeom, H: float, x_mid: float, hips: dict, arms: dict, depth_frac: float = SPINE_DEPTH_FRAC) -> dict:
    """Pelvis, spine_01/02 and chest on the spine line (nearer the back) between the hip-centre height and the armpit fillet corner.
    The line's x runs from the hips' mid-x (pelvis) to the torso's own mid-x at the chest (mid of the two armpit corners): the torso
    of a Tripo T-pose need not be centred between the hand tips (FL, U01: 30-45 mm off)."""
    out: dict = {}
    if not hips or not arms:
        return out
    z_pelvis = float(np.mean([h[2] for h in hips.values()]))
    x_pelvis = float(np.mean([h[0] for h in hips.values()]))
    z_neck = float(np.mean([a["onset"][2] + a["r_up"] for a in arms.values()]))  # neck base = top of the shoulders
    corners = {s: _armpit_corner(geom, H, x_mid, a, s) for s, a in arms.items()}
    found = [c["z"] for c in corners.values() if c.get("found")]
    x_chest, x_how = None, ""
    both = all(corners.get(s, {}).get("found") for s in ("L", "R"))
    if both and abs(corners["L"]["z"] - corners["R"]["z"]) > CORNER_AGREE_H * H:
        found = []  # the two corners disagree (hidden arms, capes): neither is trusted
    elif both:
        x_chest = x_mid + 0.5 * (corners["L"]["w"] - corners["R"]["w"])
        x_how = f"x {x_chest * 1000:+.1f} mm = mid of the two armpit corners"
    if found:
        z_chest, chest_conf = float(np.mean(found)), 0.6 if len(found) == 2 else 0.5
        chest_how = (f"armpit fillet corner (arm-underside outline at 45 deg; " +
                     ", ".join(f"{s} z {c['z']:.4f}" if c.get("found") else f"{s} none: {c['why']}" for s, c in corners.items()) + ")")
    else:
        z_ap = _armpit_z(geom, H, x_mid, z_pelvis + 0.05 * H, z_neck)
        z_chest = z_ap if z_ap is not None else float(np.mean([a["onset"][2] - a["r_up"] for a in arms.values()]))
        chest_conf = 0.4
        why = "; ".join(f"{s} z {c['z']:.4f}" if c.get("found") else f"{s} {c.get('why', '')}" for s, c in corners.items())
        chest_how = (f"torso section reaches the arms (no consistent fillet corners: {why})" if z_ap is not None else
                     f"arm underside at the upper-arm flare onset (no armpit found: {why})")
    if not z_neck > z_chest > z_pelvis:
        return out
    if x_chest is None:
        lp = torso_loop(geom, z_chest, x_mid)
        x_chest = float(lp.centroid[0]) if lp is not None else x_mid
        x_how = f"x {x_chest * 1000:+.1f} mm = centroid of the chest-height torso loop"
    zs = np.linspace(z_pelvis, z_chest, 21)
    xs = np.interp(zs, [z_pelvis, z_chest], [x_pelvis, x_chest])
    fronts, backs, areas, seeds = [], [], [], []
    for x, z in zip(xs, zs):
        lp = torso_loop(geom, z, x_mid)
        areas.append(lp.area if lp is not None else 0.0)
        seeds.append(float(lp.centroid[1]) if lp is not None else np.nan)
    med_area = float(np.median([a for a in areas if a > 0])) if any(a > 0 for a in areas) else 0.0
    for k, (x, z) in enumerate(zip(xs, zs)):
        yc = seeds[k] if (areas[k] >= 0.25 * med_area and np.isfinite(seeds[k])) else np.nanmedian(seeds)
        fy, by = _chord_y(geom, np.array([x, yc, z]))
        fronts.append(fy)
        backs.append(by)
    fronts, backs = np.array(fronts), np.array(backs)
    depth = backs - fronts
    ok = np.isfinite(depth) & (depth > 0)
    notes = []
    if ok.sum() < 3:
        return out
    d_ref = float(np.percentile(depth[ok], 30))
    depth_ok = TORSO_DEPTH_H[0] * H <= d_ref <= TORSO_DEPTH_H[1] * H
    capped = ok & (depth > BACK_JUMP * d_ref)
    if capped.any():
        notes.append(f"back chord deeper than {BACK_JUMP} x the reference torso depth {d_ref * 1000:.0f} mm at "
                     f"{int(capped.sum())} heights (sack/backpack/cape fused to the back): reference depth used there")
    dep = np.where(capped, d_ref, depth)
    ys = fronts + depth_frac * dep
    good = np.isfinite(ys)
    ys = np.interp(zs, zs[good], ys[good])
    pts = np.stack([xs, ys, zs], 1)

    def at_z(z):
        return np.array([np.interp(z, zs, pts[:, c]) for c in range(3)])

    out["pelvis"] = _lm(at_z(z_pelvis), 0.6, f"hip-centre height on the spine line ({depth_frac:.0%} of the torso chord)")
    out["chest"] = _lm(at_z(z_chest), chest_conf, chest_how + f" on the spine line; {x_how}", corners=corners)
    seg = np.linalg.norm(np.diff(pts, axis=0), axis=1)
    sarc = np.concatenate([[0.0], np.cumsum(seg)]) / max(seg.sum(), 1e-12)
    for lid, f in (("spine_01", 1 / 3), ("spine_02", 2 / 3)):
        out[lid] = _lm([np.interp(f, sarc, pts[:, c]) for c in range(3)], 0.6, f"{f:.2f} of the spine curve pelvis -> chest (arc length)")
    if not depth_ok:
        notes.append(f"torso reference depth {d_ref * 1000:.0f} mm outside {TORSO_DEPTH_H[0]}-{TORSO_DEPTH_H[1]} H (cloth layers or "
                     "a hidden torso): spine line unreliable")
    out["_spine"] = {"notes": notes, "depth_ok": depth_ok, "d_ref": d_ref, "z_neck_base": z_neck, "line": pts, "x_chest": x_chest}
    return out


# ---------------------------------------------------------------- head, neck, clavicle


def upper_rays() -> np.ndarray:
    """The 60 unit directions of the upper hemisphere used around the head-mass centre: elevations 0, 20, 40, 60, 80 deg x
    azimuths every 30 deg (the neck and back attach below)."""
    return np.array([[math.cos(el) * math.cos(az), math.cos(el) * math.sin(az), math.sin(el)]
                     for el in np.radians([0, 20, 40, 60, 80]) for az in np.radians(np.arange(0, 360, 30))])


def head_island(geom: MeshGeom, H: float, x_mid: float, z_neck: float, island_w) -> tuple[int | None, dict]:
    """Provisional head island: the island with the most welded vertices in the head column (|x - x_mid| < HEAD_COLUMN_H x H,
    above the neck base). ``island_w`` = island label per welded vertex. Returns (island or None when the column holds fewer than 10
    vertices, {island: column vertices}). I3: the earlier pick, the island whose surface lay nearest to a point 0.08 H above the
    neck base, took D01's eye in the pipeline (31 vertices; head_top 50 mm in front of the pivot, S4 head bend test ambiguous) and
    a 29-vertex inner island on U01, whose real head island it then reported as a helmet."""
    V = geom.V
    col = (np.abs(V[:, 0] - x_mid) < HEAD_COLUMN_H * H) & (V[:, 2] > z_neck)
    if col.sum() < 10:
        return None, {}
    ids, cnt = np.unique(island_w[col], return_counts=True)
    return int(ids[np.argmax(cnt)]), {int(i): int(c) for i, c in zip(ids, cnt)}


def island_vote(geom: MeshGeom, island_w, c) -> tuple[int | None, dict]:
    """The island whose surface surrounds the point ``c``: island of the first face hit by most of the ``upper_rays`` from ``c``.
    Returns (island or None when no ray hits, {island: rays})."""
    D = upper_rays()
    t, f = geom.first_hit_face(np.repeat(np.asarray(c, dtype=np.float64)[None], len(D), 0), D)
    hit = f >= 0
    if not hit.any():
        return None, {}
    ids, cnt = np.unique(island_w[geom.F[f[hit], 0]], return_counts=True)
    return int(ids[np.argmax(cnt)]), {int(i): int(k) for i, k in zip(ids, cnt)}


def island_geom(geom: MeshGeom, island_w, isl: int) -> MeshGeom | None:
    """MeshGeom over the faces of island ``isl`` alone (same welded positions), None when the island has no face."""
    fm = island_w[geom.F[:, 0]] == isl
    if not fm.any():
        return None
    return MeshGeom(geom.V, geom.F[fm], weld=np.arange(len(geom.V), dtype=np.int32))


def head_top_point(geom: MeshGeom, island_w, isl: int, M, fallback) -> tuple[np.ndarray, float, str, dict]:
    """Head top from the head's own geometry (joint-placement.md Head: "tail to the top of the skull, not the helmet"): the first
    crossing of the head island's surface above the head-mass centre ``M`` along the body up axis (+Z) - helmets, hats and eyes are
    other islands and are not intersected. When the head island is open there (a helmet glued on instead of a skull top): the first
    surface of any island above ``M`` (the helmet's inside), confidence HEAD_TOP_OPEN_CONF. Without any surface above ``M``:
    ``fallback`` (the head island's highest column vertex), LOW_CONF. Returns (point, confidence, method, diag)."""
    up = np.array([0.0, 0.0, 1.0])
    O = np.asarray(M, dtype=np.float64)[None]
    ig = island_geom(geom, island_w, isl)
    t = ig.first_hit(O, up[None])[0][0] if ig is not None else math.nan
    if np.isfinite(t):
        return O[0] + t * up, HEAD_TOP_CONF, (f"head island ({isl}) surface above the head-mass centre along the body up axis "
                                             f"({t * 1000:.1f} mm; helmets, hats and eyes are other islands)"), {"top_dist_m": float(t)}
    t2, f2 = geom.first_hit_face(O, up[None])
    if np.isfinite(t2[0]):
        other = int(island_w[geom.F[int(f2[0]), 0]])
        return O[0] + t2[0] * up, HEAD_TOP_OPEN_CONF, (f"head island ({isl}) open above the head-mass centre: first surface above it "
                                                       f"(island {other}, {t2[0] * 1000:.1f} mm; e.g. the inside of a helmet)"), \
            {"top_dist_m": float(t2[0]), "top_island": other}
    return np.asarray(fallback, dtype=np.float64), LOW_CONF, (f"no surface above the head-mass centre: highest vertex of the head "
                                                              f"island ({isl})"), {}


def head_axis_deviation(pivot, top, neck=None) -> dict | None:
    """Direction of a head bone pivot -> ``top`` (joint-placement.md Head; consensus' head_top axis gate, I4): angles in degrees from
    the body up axis +Z (``up_deg``), from the neck direction neck -> pivot (``neck_deg``; None without ``neck``) and from the
    shorter great-circle arc between the two (``arc_deg``: 0 while the head bone leans between upright and the neck's lean, as
    on D01's G2 rig: 27.6 deg forward on a 34 deg neck). None when ``top`` coincides with ``pivot``."""
    P = np.asarray(pivot, dtype=np.float64)
    v = np.asarray(top, dtype=np.float64) - P
    if np.linalg.norm(v) < 1e-12:
        return None
    v = unit(v)
    up = np.array([0.0, 0.0, 1.0])

    def ang(a, b):
        return math.degrees(math.acos(float(np.clip(a @ b, -1.0, 1.0))))

    out = {"up_deg": ang(v, up), "neck_deg": None, "arc_deg": ang(v, up)}
    if neck is None:
        return out
    b = P - np.asarray(neck, dtype=np.float64)
    if np.linalg.norm(b) < 1e-12:
        return out
    b = unit(b)
    out["neck_deg"] = ang(v, b)
    ends = min(out["up_deg"], out["neck_deg"])
    n = np.cross(up, b)
    if np.linalg.norm(n) < 1e-9:  # upright neck: the arc is the up axis
        out["arc_deg"] = ends
        return out
    n = unit(n)
    p = v - (v @ n) * n
    if np.linalg.norm(p) < 1e-12:
        out["arc_deg"] = ends
        return out
    p = unit(p)
    on_arc = ang(up, p) + ang(p, b) <= ang(up, b) + 1e-6
    out["arc_deg"] = ang(v, p) if on_arc else ends
    return out


def head_mass(geom: MeshGeom, H: float, top, r0: float, iters: int = 40, n: int = 12) -> tuple[np.ndarray, float, dict]:
    """Head-mass centre and radius by a Gaussian-weighted mean-shift of the mesh volume (grid points with winding > 0.5 inside a
    ball, weights exp(-d^2 / 2 (r/2)^2)): first with 0.8 ``r0`` from 0.8 ``r0`` below the head ``top`` (a larger first ball slides
    into hoods and shoulders), then alternating with the head radius R = median distance from the centre to the surface along 60
    rays of the upper hemisphere (the neck and back attach below), at most 3 times, while R stays below 1.5 ``r0`` and the centre
    does not drop by more than R / 2. Returns (centre, R, info)."""

    def shift(c, r):
        ax = np.linspace(-r, r, 2 * n + 1)
        G = np.stack(np.meshgrid(ax, ax, ax, indexing="ij"), -1).reshape(-1, 3)
        G = G[np.linalg.norm(G, axis=1) <= r]
        w0 = np.exp(-0.5 * (np.linalg.norm(G, axis=1) / (0.5 * r)) ** 2)
        for it in range(iters):
            ins = geom.winding(G + c) > 0.5
            if not ins.any():
                return c, it, False
            cn = ((G[ins] + c) * w0[ins, None]).sum(0) / w0[ins].sum()
            if np.linalg.norm(cn - c) < 2e-4 * H:
                return cn, it, True
            c = cn
        return c, iters, False

    def radius(c):
        D = upper_rays()
        t, _ = geom.first_hit(np.repeat(c[None], len(D), 0), D)
        return float(np.nanmedian(t))

    c, it, conv = shift(np.asarray(top, dtype=np.float64) - np.array([0.0, 0.0, 0.8 * r0]), 0.8 * r0)
    R = radius(c)
    info = {"r0": r0, "passes": [{"r": 0.8 * r0, "iterations": it, "converged": conv, "R": R}]}
    for _ in range(3):
        c2, it, conv = shift(c, R)
        R2 = radius(c2)
        info["passes"].append({"r": R, "iterations": it, "converged": conv, "R": R2})
        if not conv or not R2 < 1.5 * r0 or c2[2] < c[2] - 0.5 * R:
            info["stopped"] = "kept the previous centre (pass did not converge, R > 1.5 r0 or the centre dropped > R/2)"
            break
        done = np.linalg.norm(c2 - c) < 0.002 * H
        c, R = c2, R2
        if done:
            break
    return c, R, info


def ear_line(geom: MeshGeom, M, R: float, x_mid: float) -> tuple[np.ndarray | None, dict]:
    """Ear line from bilateral ear protrusions. Coronal sections (normal Y) every 0.05 R through the head (y = M.y +- 1.2 R); in each,
    the innermost closed loop around (x_mid, y, M.z) is the head. The skull side is the loop's lateral extent in the band
    M.z + 0.3..0.6 R; an ear is the loop part in the band M.z - 0.9..+0.3 R that sticks out more than EAR_PROTRUSION_R x R beyond it.
    Ears = a run of >= 2 consecutive planes with protrusions on BOTH sides at overlapping heights, at least 2 planes away from both
    ends of the head's closed-loop range (face fronts, hoods and shoulders give protrusions at the ends). Returns ((y, z) of the run's
    mean protrusion band centre, info) or (None, info)."""
    ys = np.arange(M[1] - 1.2 * R, M[1] + 1.2 * R + 1e-12, 0.05 * R)
    planes: list = []
    for y in ys:
        seed = np.array([x_mid, y, M[2]])
        loops = [lp for lp in geom.section(seed, [0.0, 1.0, 0.0]) if lp.closed and loop_contains(lp, seed)]
        if not loops:
            planes.append(None)
            continue
        P = min(loops, key=lambda q: q.area).points
        up = P[(P[:, 2] > M[2] + 0.3 * R) & (P[:, 2] < M[2] + 0.6 * R)]
        band = P[(P[:, 2] > M[2] - 0.9 * R) & (P[:, 2] < M[2] + 0.3 * R)]
        hit = {}
        for side, s in (("L", 1.0), ("R", -1.0)):
            if len(up) == 0 or len(band) == 0:
                continue
            wsk = float(np.max(s * (up[:, 0] - x_mid)))
            pro = band[s * (band[:, 0] - x_mid) > wsk + EAR_PROTRUSION_R * R]
            if len(pro) >= 3:
                hit[side] = (float(pro[:, 2].min()), float(pro[:, 2].max()))
        planes.append(hit)
    closed = [i for i, p in enumerate(planes) if p is not None]
    if not closed:
        return None, {"why": "no closed head loop in the coronal sections"}
    i0, i1 = closed[0], closed[-1]
    both = [i for i, p in enumerate(planes) if p and "L" in p and "R" in p and min(p["L"][1], p["R"][1]) > max(p["L"][0], p["R"][0])]
    runs: list = []
    for i in both:
        if runs and i == runs[-1][-1] + 1:
            runs[-1].append(i)
        else:
            runs.append([i])
    good = [r for r in runs if len(r) >= 2 and r[0] - i0 >= 2 and i1 - r[-1] >= 2]
    info = {"closed_planes": [int(i0), int(i1)], "runs": [[int(r[0]), int(r[-1])] for r in runs], "plane_step": 0.05 * R}
    if not good:
        info["why"] = "no interior bilateral protrusion run of >= 2 planes"
        return None, info
    run = max(good, key=len)
    y = float(np.mean([ys[i] for i in run]))
    z = float(np.mean([0.5 * (max(planes[i]["L"][0], planes[i]["R"][0]) + min(planes[i]["L"][1], planes[i]["R"][1])) for i in run]))
    info.update(run=[int(run[0]), int(run[-1])], y=y, z=z)
    return np.array([y, z]), info


def _head(geom: MeshGeom, H: float, x_mid: float, z_neck: float, island_w, family: str) -> tuple[dict, dict]:
    """Head island, head-mass centre, head top and head pivot from the head's own geometry (joint-placement.md Head).

    Head island (I4): the island with the most vertices in the head column (``head_island``); its highest column vertex starts the
    head-mass search (``head_mass``: centre M, radius R); when most of the ``upper_rays`` from M first hit another column island
    (``island_vote``), that island surrounds the head mass and the search runs once more from it. Head top: the head island's
    surface above M along the body up axis (``head_top_point``; helmets, hats and eyes are other islands); the directions of the head
    bone are recorded by ``solve`` (``head_axis_deviation``) and gated by consensus. Head pivot = skull base: with visible ears
    (``ear_line``) HEAD_PIVOT_FROM_EAR behind and below the ear base, else HEAD_PIVOT_FROM_MASS behind and below M. Interim guards
    (review r2): R is clamped to HEAD_RADIUS_CLAMP x the starting radius, and a pivot offset outside HEAD_PIVOT_OFFSET_H lowers the
    confidence to HEAD_OFFSET_CONF."""
    out: dict = {}
    V = geom.V
    isl0, counts = head_island(geom, H, x_mid, z_neck, island_w)
    if isl0 is None:
        return out, {}
    in_col = (np.abs(V[:, 0] - x_mid) < HEAD_COLUMN_H * H) & (V[:, 2] > z_neck)
    r0 = HEAD_RADIUS_H.get(family, 0.07) * H

    def mass(isl):
        top = V[int(np.argmax(np.where(in_col & (island_w == isl), V[:, 2], -np.inf)))]
        return (top, *head_mass(geom, H, top, r0))

    top, M, R_meas, minfo = mass(isl0)
    isl, votes = island_vote(geom, island_w, M)
    if isl is not None and isl != isl0 and counts.get(isl, 0) >= 10:  # the head mass sits inside another island's surface
        top, M, R_meas, minfo = mass(isl)
        minfo = dict(minfo, redone_from_island=isl, first_island=isl0)
    else:
        isl = isl0
    R = float(np.clip(R_meas, HEAD_RADIUS_CLAMP[0] * r0, HEAD_RADIUS_CLAMP[1] * r0))  # offsets scale with the head, within limits
    xh = float(M[0])  # the head's own midline (Tripo heads need not sit on the hand-tip midline)
    T, tconf, thow, tdiag = head_top_point(geom, island_w, isl, M, np.array([xh, top[1], top[2]]))
    e = _lm(T, tconf, thow, head_island=isl, column_islands=counts, ray_votes=votes, top_vertex=top,
            top_vertex_dist_m=float(np.linalg.norm(top - T)), **tdiag)
    others = in_col & (V[:, 2] > T[2] + 0.01 * H) & (island_w != isl)
    if others.any():
        e["prior_exempt"] = f"helmet/hat: {len(np.unique(island_w[others]))} other island(s) up to z {V[others, 2].max():.4f} above the head top"
    out["head_top"] = e
    ears, einfo = ear_line(geom, M, R, xh)
    if ears is not None:
        E = np.array([xh, ears[0], ears[1]])
        P = E + np.array([0.0, HEAD_PIVOT_FROM_EAR[0] * R, -HEAD_PIVOT_FROM_EAR[1] * R])
        how, conf = (f"skull base {HEAD_PIVOT_FROM_EAR} R behind/below the ear base from bilateral ear protrusions (y {ears[0]:.4f}, "
                     f"z {ears[1]:.4f})"), 0.6
    else:
        E = None
        P = np.array([xh, M[1] + HEAD_PIVOT_FROM_MASS[0] * R, M[2] - HEAD_PIVOT_FROM_MASS[1] * R])
        how, conf = f"skull base {HEAD_PIVOT_FROM_MASS} R behind/below the head-mass centre (no visible ears: {einfo.get('why')})", 0.45
    off = float(np.linalg.norm(P - (E if E is not None else M)))
    clamp = "" if R == R_meas else f" (measured {R_meas * 1000:.1f} mm, clamped to {HEAD_RADIUS_CLAMP} x r0 {r0 * 1000:.1f} mm)"
    out["head"] = _lm(P, conf, f"{how}; head-mass centre ({M[0]:.4f}, {M[1]:.4f}, {M[2]:.4f}), R {R * 1000:.1f} mm{clamp}; pivot offset "
                      f"{off / H:.3f} H", head_mass=M, head_radius=R, head_radius_measured=R_meas, head_radius_r0=r0,
                      radius_clamped=R != R_meas, pivot_offset_H=off / H, ear_line=E, ears=einfo, mass=minfo)
    if not HEAD_PIVOT_OFFSET_H[0] * H <= off <= HEAD_PIVOT_OFFSET_H[1] * H:
        _lower(out, "head", f"pivot offset {off / H:.3f} H outside {HEAD_PIVOT_OFFSET_H[0]}-{HEAD_PIVOT_OFFSET_H[1]} H",
               conf=HEAD_OFFSET_CONF)
    return out, {"M": M, "R": R, "R_measured": R_meas, "ear_line": E, "ears_found": ears is not None, "island": isl}


def _neck(chest, head, z_neck: float) -> dict:
    """Neck base on the chest -> head line at the top of the shoulders (t clamped to 0.25..0.75 of the line)."""
    chest, head = np.asarray(chest, dtype=np.float64), np.asarray(head, dtype=np.float64)
    t = (z_neck - chest[2]) / (head[2] - chest[2]) if head[2] > chest[2] else 0.5
    tc = float(np.clip(t, 0.25, 0.75))
    return {"neck": _lm(chest + tc * (head - chest), 0.5, f"chest -> head line at the top of the shoulders (z {z_neck:.4f}, t {tc:.2f}"
                        + (", clamped)" if tc != t else ")"), t=t)}


def segment_crossings(geom: MeshGeom, a, b) -> np.ndarray:
    """Distances (m) from ``a`` of the surface crossings of the segment ``a`` -> ``b``, sorted (empty: it crosses no surface)."""
    a, b = np.asarray(a, dtype=np.float64), np.asarray(b, dtype=np.float64)
    L = float(np.linalg.norm(b - a))
    if L < 1e-12:
        return np.zeros(0)
    t = geom.ray_hits(a[None], (b - a)[None])[0]
    return t[t < L]


def _clavicles(geom: MeshGeom, H: float, x_mid: float, chest, neck, shoulders: dict, d_ref: float | None, spine_y=None) -> dict:
    """Sternoclavicular joints behind the sternal notch (joint-placement.md Clavicle head, review r1). The notch is the concavity
    between the chest (pecs, bust) and the chin: the most posterior front-surface point on the midline between chest and neck-base
    height (rays toward -Y from the spine line at 9 heights; a chord at clavicle height alone hits the chin on forward-jutting heads,
    one at chest height alone hits a bust). x = CLAV_HALF_WIDTH_FRAC of the side's half-width of the chest-height torso loop from the
    chest x (review r2 N3: a shoulder found out on the arm no longer drags the clavicle; without a closed loop CLAV_X_FRAC of the way
    chest x -> shoulder, and ``_downgrade`` passes a shoulder downgrade on), y = notch + CLAV_DEPTH_FRAC of the torso reference depth,
    z = CLAV_Z_FRAC of the way chest -> neck. The point must lie inside the chest-height torso loop (the nearest closed one within 2 % H;
    moved toward its centroid if not). At its final height the segment from the spine/neck line (the chest -> neck line at CLAV_Z_FRAC)
    to the point must cross no surface (review r2 N2: ray hits along the segment); when it does, the point moves back along the segment
    to INSIDE_MARGIN_H before the first crossing and its confidence drops to LOW_CONF whatever the move (review r3 F3: source a is the
    clavicle's only position source, so consensus must flag the corrected point for the vision check; ``diag.segment``). Inside the
    mesh is checked with the other core landmarks."""
    out: dict = {}
    chest, neck = np.asarray(chest, dtype=np.float64), np.asarray(neck, dtype=np.float64)
    lp, zl = None, float(chest[2])
    for k in (0, 1, -1, 2, -2, 3, -3, 4, -4):  # open Tripo surfaces may have no closed torso loop at the chest height itself
        lp = torso_loop(geom, chest[2] + k * 0.005 * H, x_mid)
        if lp is not None:
            zl = float(chest[2] + k * 0.005 * H)
            break
    fronts = []
    for z in np.linspace(chest[2], neck[2], 9):
        ys = float(spine_y(z)) if spine_y is not None else (float(lp.centroid[1]) if lp is not None else float(chest[1]))
        x = float(chest[0]) + (z - chest[2]) / max(neck[2] - chest[2], 1e-12) * (float(neck[0]) - float(chest[0]))
        fy, _ = _chord_y(geom, np.array([x, ys, z]))
        if math.isfinite(fy):
            fronts.append((fy, z))
    if not fronts:
        return out
    y_notch, z_notch = max(fronts)
    if d_ref:
        depth = float(d_ref)
    elif lp is not None:
        P = lp.points
        near = P[np.abs(P[:, 0] - x_mid) <= 0.15 * 0.5 * float(np.ptp(P[:, 0]))]
        depth = float(np.ptp((near if len(near) else P)[:, 1]))
    else:
        return out
    z = chest[2] + CLAV_Z_FRAC * (neck[2] - chest[2])
    line = chest + CLAV_Z_FRAC * (neck - chest)  # the spine/neck line at the clavicle height
    line_inside = bool(geom.winding(line[None])[0] > 0.5)
    xc = float(chest[0])
    for side, sh in shoulders.items():
        s = 1.0 if side == "L" else -1.0
        hw = float(np.max(s * (lp.points[:, 0] - xc))) if lp is not None else 0.0
        if hw > 0:
            x, x_from = xc + s * CLAV_HALF_WIDTH_FRAC * hw, "chest_loop"
            x_how = f"{CLAV_HALF_WIDTH_FRAC:.0%} of the chest-loop half-width {hw * 1000:.0f} mm"
        else:
            x, x_from, x_how = xc + CLAV_X_FRAC * (sh[0] - xc), "shoulder", f"{CLAV_X_FRAC:.0%} chest x -> shoulder"
        q = np.array([x, y_notch + CLAV_DEPTH_FRAC * depth, zl])
        moved = 0.0
        for _ in range(20):
            if lp is None or loop_contains(lp, q):
                break
            q2 = q + 0.1 * (lp.centroid - q)
            moved += float(np.linalg.norm(q2 - q))
            q = q2
        p = np.array([q[0], q[1], z])
        seg: dict = {"line_point": line, "line_inside": line_inside}
        if line_inside:
            t = segment_crossings(geom, line, p)
            if not t.size and geom.winding(p[None])[0] <= 0.5:  # a ray grazing mesh edges can miss: find the exit by the winding number
                lo_t, hi_t = 0.0, 1.0
                for _ in range(30):
                    m = 0.5 * (lo_t + hi_t)
                    if geom.winding((line + m * (p - line))[None])[0] > 0.5:
                        lo_t = m
                    else:
                        hi_t = m
                t = np.array([lo_t * float(np.linalg.norm(p - line))])
            seg.update(ok=not t.size, crossings_m=t)
            if t.size:
                p2 = line + (float(t[0]) - min(INSIDE_MARGIN_H * H, 0.5 * float(t[0]))) * unit(p - line)
                seg["moved_m"] = float(np.linalg.norm(p2 - p))
                p = p2
        else:
            seg.update(ok=None, why="the spine/neck line point is outside the mesh: no segment test")
        lid = f"clavicle_{side}"
        out[lid] = _lm(p, 0.5 if lp is not None else 0.4,
                       f"behind the sternal notch (most posterior midline front point between chest and neck base: y "
                       f"{y_notch:.4f} at z {z_notch:.4f}; +{CLAV_DEPTH_FRAC:.0%} of the torso depth {depth * 1000:.0f} mm; "
                       f"{x_how}; {CLAV_Z_FRAC:.0%} chest -> neck)"
                       + (f"; moved {moved * 1000:.1f} mm into the chest-height torso loop" if moved else "")
                       + ("" if lp is not None else "; no closed torso loop within 2 % H of the chest"),
                       notch=[y_notch, z_notch], depth=depth, loop_z=zl if lp is not None else None, x_from=x_from,
                       chest_half_width=hw if hw > 0 else None,
                       inside_chest_loop=bool(loop_contains(lp, q)) if lp is not None else None, segment=seg)
        if seg.get("ok") is False:
            _lower(out, lid, f"segment from the spine/neck line crossed a surface {seg['crossings_m'][0] * 1000:.1f} mm out: moved "
                             f"{seg['moved_m'] * 1000:.1f} mm ({seg['moved_m'] / H:.1%} H) back inside; a is the only position source")
    return out


# ---------------------------------------------------------------- checks


def push_inside(geom: MeshGeom, H: float, lms: dict, ids) -> list[str]:
    """Inside-mesh check (winding number > 0.5) for the landmarks ``ids``. A landmark outside by at most INSIDE_PUSH_MAX_H moves along
    the direction to its nearest surface point to INSIDE_MARGIN_H past it (at most half the chord there) and keeps 90 % of its
    confidence; farther out it stays and drops to LOW_CONF. Every landmark gets ``diag.winding``. Returns notes."""
    notes = []
    ids = [k for k in ids if k in lms]
    if not ids:
        return notes
    P = np.array([lms[k]["pos"] for k in ids])
    W = geom.winding(P)
    for k, p, w in zip(ids, P, W):
        lms[k].setdefault("diag", {})["winding"] = round(float(w), 3)
        if w > 0.5:
            continue
        d, _, C = geom.closest(p[None])
        dist, c = float(d[0]), C[0]
        if dist > INSIDE_PUSH_MAX_H * H:
            _lower(lms, k, f"outside the mesh by {dist * 1000:.1f} mm (winding {w:.2f}); not pushed")
            notes.append(f"{k}: outside the mesh by {dist * 1000:.1f} mm")
            continue
        n = unit(c - p) if dist > 1e-12 else -unit(geom.face_normals()[int(geom.closest(p[None])[1][0])])
        t = geom.ray_hits((c + 1e-6 * H * n)[None], n[None])[0]
        m = min(INSIDE_MARGIN_H * H, 0.5 * (float(t[0]) if t.size else math.inf))
        q = c + m * n
        if geom.winding(q[None])[0] > 0.5:
            lms[k]["pos"] = tuple(float(v) for v in q)
            lms[k]["confidence"] = float(0.9 * lms[k]["confidence"])
            lms[k]["method"] += f" [pushed {np.linalg.norm(q - p) * 1000:.1f} mm inside the mesh (winding was {w:.2f})]"
            lms[k]["diag"].update(pushed_m=float(np.linalg.norm(q - p)), winding_before=round(float(w), 3), winding=1.0)
            notes.append(f"{k}: pushed {np.linalg.norm(q - p) * 1000:.1f} mm inside the mesh")
        else:
            _lower(lms, k, f"outside the mesh (winding {w:.2f}) and the push failed")
    return notes


def segment_ratio(p0, p1, p2) -> float:
    """|p1 - p0| / |p2 - p1| (upper arm / forearm, thigh / shin)."""
    a = float(np.linalg.norm(np.asarray(p1, dtype=np.float64) - np.asarray(p0, dtype=np.float64)))
    b = float(np.linalg.norm(np.asarray(p2, dtype=np.float64) - np.asarray(p1, dtype=np.float64)))
    return a / b if b > 1e-12 else math.inf


def _downgrade(lms: dict, notes: list, H: float, x_mid: float, arms: dict, arm_info: dict, legs: dict, spine: dict, fam: dict,
               analysis: dict | None) -> None:
    """Lower the confidence of landmarks whose method preconditions failed, so that consensus gates them (review r1 finding 7):
    hidden upper arms (short arm track), thighs hidden by cloth (crotch well below the family hip prior), an implausible torso depth,
    segment-length ratios outside SEGMENT_RATIO (the less reliable joint of the chain), family prior bands, cloth bridging from
    analysis.json; dependent landmarks (pelvis/spine on the hips, neck/head/clavicles on the shoulders) inherit it."""
    hidden_arm = False
    for side, info in arm_info.items():
        tip = arms[side]["tip"]
        frac = abs(float(info["onset"][0]) - x_mid) / max(abs(float(tip[0]) - x_mid), 1e-9)
        if frac > ARM_HIDDEN_FRAC:
            hidden_arm = True
            why = f"arm track ends at {frac:.0%} of tip->midline (upper arm hidden by a sleeve/cape)"
            notes.append(f"arm {side}: " + why)
            for lid in (f"shoulder_{side}", f"elbow_{side}", f"clavicle_{side}"):
                _lower(lms, lid, why)
    hip_prior = float(fam.get("priors", {}).get("hip", {}).get("z_over_H", 0.5))
    hidden_leg = False
    zc = legs.get("merge_z")
    if zc is not None and zc < (hip_prior - LEG_HIDDEN_H) * H:
        hidden_leg = True
        why = f"legs meet at z {zc / H:.3f} H, > {LEG_HIDDEN_H} H below the hip prior {hip_prior} H (thighs hidden by cloth)"
        notes.append("legs: " + why)
        for side in ("L", "R"):
            _lower(lms, f"hip_{side}", why)
            k = lms.get(f"knee_{side}")
            if k and zc - k["pos"][2] < 0.08 * H:
                _lower(lms, f"knee_{side}", "knee found at the end of the visible leg")
    if hidden_leg:
        for lid in ("pelvis", "spine_01", "spine_02"):
            _lower(lms, lid, "pelvis height from hidden hips")
    if spine and not spine.get("depth_ok", True):
        for lid in ("pelvis", "spine_01", "spine_02", "chest", "neck", "clavicle_L", "clavicle_R"):
            _lower(lms, lid, "implausible torso depth")
    if hidden_arm:
        for lid in ("chest", "clavicle_L", "clavicle_R"):
            _lower(lms, lid, "shoulder line from hidden upper arms")
    cb = (analysis or {}).get("cloth_bridging") or {}
    if cb.get("detected") and cb.get("kind") == "cloth":
        zb = (cb.get("bridging_z_range_H") or [None, None])[1]
        notes.append(f"cloth bridges the legs (analysis.json, up to z {zb} H): hips and covered knees less reliable")
        for side in ("L", "R"):
            for lid in (f"hip_{side}", f"knee_{side}"):
                e = lms.get(lid)
                if e and (lid.startswith("hip") or (zb is not None and e["pos"][2] <= zb * H)):
                    _lower(lms, lid, "covered by cloth bridging the legs (analysis.json)", conf=min(e["confidence"], 0.6) * 0.7)
    # segment-length ratios: the less reliable joint of a failing chain (shoulder on short upper arms: covered by capes; elbow on
    # long upper arms; hip on short thighs: hidden by cloth; knee on long thighs: found at a boot top)
    for side in ("L", "R"):
        for chain, (j0, j1, j2), (lo_j, hi_j) in (("arm", ("shoulder", "elbow", "wrist"), ("shoulder", "elbow")),
                                                  ("leg", ("hip", "knee", "ankle"), ("hip", "knee"))):
            ids = [f"{j}_{side}" for j in (j0, j1, j2)]
            if not all(i in lms for i in ids):
                continue
            r = segment_ratio(*(lms[i]["pos"] for i in ids))
            lo, hi = SEGMENT_RATIO[chain]
            for i in ids:
                lms[i].setdefault("diag", {})[f"{chain}_ratio"] = round(r, 3)
            if r < lo:
                _lower(lms, f"{lo_j}_{side}", f"{chain} segment ratio {r:.2f} < {lo} ({j0}-{j1} too short)")
            elif r > hi:
                _lower(lms, f"{hi_j}_{side}", f"{chain} segment ratio {r:.2f} > {hi} ({j1}-{j2} too short)")
    # family priors (z / H): outside the band = the rule found something else
    for pid, pr in fam.get("priors", {}).items():
        for lid in (pid, f"{pid}_L", f"{pid}_R"):
            e = lms.get(lid)
            if e is None or e.get("prior_exempt"):
                continue
            z = e["pos"][2] / H
            if abs(z - pr["z_over_H"]) > pr["tol_H"]:
                _lower(lms, lid, f"z/H {z:.3f} outside the family prior {pr['z_over_H']} +- {pr['tol_H']}")
    # a clavicle whose x came from its shoulder (no closed chest loop) inherits that shoulder's downgrade (review r2 N3)
    for side in ("L", "R"):
        c, sh = lms.get(f"clavicle_{side}"), lms.get(f"shoulder_{side}")
        if c and sh and c.get("diag", {}).get("x_from") == "shoulder" and sh["confidence"] <= LOW_CONF:
            _lower(lms, f"clavicle_{side}", f"x taken from shoulder_{side}, which is downgraded")


def solve(mesh: dict, family: str = "H", x_mid: float | None = None, spine_depth_frac: float = SPINE_DEPTH_FRAC,
          analysis: dict | None = None) -> dict:
    """Source-a landmarks for the family's landmark set on a mesh dict (npzio.load_mesh).

    ``x_mid`` = midline x of the arms/torso/head (analysis.json ``symmetry.region_plane_x.arms``); default: the mid-x of the two hand
    tips (landmark mid-x, review r1 finding 8). ``spine_depth_frac`` = spine line position on the front->back torso chord (0 = front
    surface, 1 = back). ``analysis`` = analysis.json dict (cloth bridging) or None.

    Returns ``{"landmarks": {id: {pos, confidence, method, diag[, prior_exempt]}}, "missing": [...], "notes": [...], "frame": {...}}``;
    ``frame`` holds the midline, crotch, limb axes (track centroids, used by consensus' axis gate) and the head fit."""
    from rigcore import landmarks as rlm, template

    V, F, weld = mesh["V"], mesh["F"], mesh["weld"]
    H = float(mesh["meta"]["H"])
    geom = MeshGeom(V, F, weld)
    fam = template.load_family(family)
    notes: list = []
    x0 = x_mid if x_mid is not None else 0.5 * float(geom.V[:, 0].min() + geom.V[:, 0].max())
    feet = find_feet(geom, H)
    legs = leg_tracks(geom, H, feet)
    arms = arm_tracks(geom, H, x0)
    x_tips = None
    if arms["L"]["tip"] is not None and arms["R"]["tip"] is not None:
        x_tips = 0.5 * float(arms["L"]["tip"][0] + arms["R"]["tip"][0])
    if x_mid is None:
        x_mid, x_src = (x_tips, "hand-tip mid-x") if x_tips is not None else (x0, "bounding-box centre")
        if abs(x_mid - x0) > 0.002 * H:
            arms = arm_tracks(geom, H, x_mid)
    else:
        x_src = "given (analysis.json arms plane)"
        if x_tips is not None and abs(x_mid - x_tips) > 0.003 * H:
            notes.append(f"midline: given x {x_mid * 1000:.1f} mm differs from the hand-tip mid-x {x_tips * 1000:.1f} mm")
    lms: dict = {}
    arm_info, leg_info = {}, {}
    z_top = legs["merge_z"] if legs.get("merge_z") is not None else 0.5 * H
    for side in ("L", "R"):
        r = _arm(geom, H, side, arms[side])
        info = r.pop("_arm_" + side, None)
        if info:
            arm_info[side] = info
        lms.update(r)
        r = _leg(geom, H, side, legs.get(side) or [], z_top)
        info = r.pop("_leg_" + side, None)
        if info:
            leg_info[side] = info
        lms.update(r)
    for side in ("L", "R"):
        if side in leg_info:
            other = "R" if side == "L" else "L"
            xo = leg_info[other]["ankle"][0] if other in leg_info else x_mid
            lms.update(_foot(geom, H, side, leg_info[side]["ankle"], xo))
    for side in leg_info:  # boot-ankle interim rule (needs the foot axis)
        _boot_ankle(geom, H, side, lms, leg_info[side])
    hips = {s: np.array(lms[f"hip_{s}"]["pos"]) for s in ("L", "R") if f"hip_{s}" in lms}
    tor = _torso(geom, H, x_mid, hips, arm_info, spine_depth_frac)
    sp = tor.pop("_spine", None) or {}
    notes.extend(sp.get("notes", []))
    lms.update(tor)
    head_info: dict = {}
    if arm_info:
        z_neck = sp.get("z_neck_base") or float(np.mean([a["onset"][2] + a["r_up"] for a in arm_info.values()]))
        _, lab = rmesh.islands(F, weld)
        lab_w = np.zeros(len(geom.V), dtype=np.int64)
        lab_w[geom.weld] = lab
        hd, head_info = _head(geom, H, x_mid, z_neck, lab_w, family)
        lms.update(hd)
        if "chest" in lms and "head" in lms:
            lms.update(_neck(lms["chest"]["pos"], lms["head"]["pos"], z_neck))
            shoulders = {s: np.array(lms[f"shoulder_{s}"]["pos"]) for s in ("L", "R") if f"shoulder_{s}" in lms}
            line = sp.get("line")
            spine_y = (lambda z: np.interp(z, line[:, 2], line[:, 1])) if line is not None else None
            lms.update(_clavicles(geom, H, x_mid, lms["chest"]["pos"], lms["neck"]["pos"], shoulders, sp.get("d_ref"), spine_y))
    core = [k for k in lms if (k[:-2] if k.endswith(("_L", "_R")) else k) in CORE]
    notes.extend(push_inside(geom, H, lms, core))
    if "head_top" in lms and "head" in lms:  # head bone direction (consensus gates it: head_top axis)
        dev = head_axis_deviation(lms["head"]["pos"], lms["head_top"]["pos"], (lms.get("neck") or {}).get("pos"))
        lms["head_top"].setdefault("diag", {})["head_axis_deg"] = dev and {k: (None if v is None else round(v, 2))
                                                                           for k, v in dev.items()}
    _downgrade(lms, notes, H, x_mid, arms, arm_info, legs, sp, fam, analysis)
    wanted = rlm.landmark_ids(fam)
    missing = [k for k in wanted if k not in lms]
    if not legs.get("L") or not legs.get("R"):
        notes.append("legs not tracked from the soles: no leg landmarks from geometry")
    for side in ("L", "R"):
        if side in arm_info and arm_info[side]["n_slices"] < 15:
            notes.append(f"arm {side}: short track ({arm_info[side]['n_slices']} slices; limb hidden in a sleeve?) - elbow/shoulder unreliable")
    axes = {f"arm_{s}": arm_info[s]["axis"] for s in arm_info}
    axes.update({f"leg_{s}": np.c_[leg_info[s]["profile"]["cx"], leg_info[s]["profile"]["cy"], leg_info[s]["profile"]["z"]]
                 for s in leg_info})
    frame = {"x_mid": float(x_mid), "x_mid_source": x_src, "x_hand_tips": x_tips,
             "feet": {k: [float(c) for c in v] for k, v in feet.items() if k in ("L", "R")},
             "merge_z": legs["merge_z"], "crotch_found": legs.get("crotch_found", False),
             "limb_axes": {k: np.round(v, 6).tolist() for k, v in axes.items()},
             "head": _j(head_info), "spine_line": _j(sp.get("line")) if sp.get("line") is not None else None,
             "torso_d_ref": sp.get("d_ref"), "cuffs": {s: leg_info[s]["cuffs"] for s in leg_info}}
    return {"landmarks": {k: lms[k] for k in wanted if k in lms}, "missing": missing, "notes": notes, "frame": frame}


def write_landmarks_a(result: dict, out_path, asset_id: str, family: str, H: float) -> str:
    """Write source-a landmarks in the landmarks.json format (sources {"a": pos}, confidence, decision = method, diag,
    prior_exempt, interim_rule, interim_note) plus a top-level ``frame`` (limb axes, midline, crotch, head fit, spine line) for
    consensus' plausibility gates, the spine tile and the flag-tile sections."""
    from rigcore import landmarks as rlm, npzio

    lms = result["landmarks"]
    details = {}
    for k, e in lms.items():
        details[k] = {"sources": {"a": list(e["pos"])}, "confidence": e["confidence"], "decision": f"source a: {e['method']}",
                      "flagged": False, "diag": e.get("diag", {})}
        if e.get("prior_exempt"):
            details[k]["prior_exempt"] = e["prior_exempt"]
        for key in ("interim_rule", "interim_note"):
            if e.get(key):
                details[k][key] = e[key]
    doc = rlm.landmarks_doc(asset_id, family, H, {k: e["pos"] for k, e in lms.items()}, details)
    doc["frame"] = result.get("frame", {})
    doc["notes"] = result.get("notes", [])
    doc["missing"] = result.get("missing", [])
    return npzio.write_json(out_path, doc)


def main(argv=None) -> int:
    import argparse
    import json

    from rigcore import npzio

    ap = argparse.ArgumentParser(description="S3 source a: landmarks from the mesh geometry -> landmarks_a.json")
    ap.add_argument("mesh", help="mesh.npz (Blender frame after S2)")
    ap.add_argument("--family", default="H")
    ap.add_argument("--analysis", default=None, help="analysis.json (arms midline, cloth bridging); default: next to the output")
    ap.add_argument("--spine-depth-frac", type=float, default=SPINE_DEPTH_FRAC, help="spine line on the torso chord (front 0 .. back 1)")
    ap.add_argument("--out", default=None, help=r"default E:\tmp_rigkit\A2\<asset_id>\landmarks_a.json")
    a = ap.parse_args(argv)
    mesh = npzio.load_mesh(a.mesh)
    asset = mesh["meta"]["asset_id"]
    out = a.out or os.path.join(r"E:\tmp_rigkit\A2", asset, "landmarks_a.json")
    an_path = a.analysis or os.path.join(os.path.dirname(out), "analysis.json")
    an = npzio.read_json(an_path) if os.path.isfile(an_path) else None
    x_mid = (an or {}).get("symmetry", {}).get("region_plane_x", {}).get("arms")
    res = solve(mesh, a.family, x_mid, a.spine_depth_frac, an)
    write_landmarks_a(res, out, asset, a.family, float(mesh["meta"]["H"]))
    print(json.dumps({"out": out, "n": len(res["landmarks"]), "missing": res["missing"], "notes": res["notes"][:6],
                      "x_mid": res["frame"]["x_mid"]}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
