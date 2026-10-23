r"""solvers.analysis - S1 mesh analysis -> analysis.json (+ analysis.npz with per-vertex arrays for region shots).

Units: metres; relative numbers carry the suffix ``_H`` (fraction of the catalogue height H).  Frame: Blender, Z up, character front
-Y, character left +X, after S2 (mesh.npz from glbmesh or rigkit.meshio).  Measures only; the mesh is never changed.

What is measured (references/mesh-intake.md S1):
  weld            positions merged within 1e-6 x bbox diagonal (rigcore.mesh.weld_map); every topology measure uses welded ids
  islands         connected pieces of the welded topology, sizes and boxes
  edges           boundary (1 face) / non-manifold (> 2 faces) edges, boundary loops
  self_intersect  triangle pairs of the welded mesh that cross (vectorized edge-triangle test; pairs sharing a vertex are skipped)
  symmetry        mirror plane by PCA + point-to-plane mirror ICP on area-uniform surface samples; per region (legs, arms, torso, head)
                  its own plane offset (normal fixed; median Gauss-Newton step over the samples whose surface faces along the normal:
                  robust to parts without a mirror partner) and the residual RMS about that plane; the arms' plane is the landmark
                  mid-x of the hand tips and wrists (ill-posed on the surface of T-pose arms). D01: legs +10.5 mm in X, arms at 0
  axes            up = soles at the bottom; front from the toes (feet reach further forward than back from the ankles) and the
                  head's forward extreme
  pose            arm angle to horizontal (T ~ 0, A ~ 30-45 deg), arm<->torso gap and contact length, leg<->leg gap, hand<->thigh
  fingers         loops per slice across each hand (slices perpendicular to the forearm axis) -> separated / partial / mitten
  cloth_bridging  where the two leg sections merge (crotch) versus the family's hip height, and the shape of the merged section
                  (a convex loop well below the hips = skirt or robe bridging the legs)
  thin_parts      local thickness by an inward ray from every welded vertex; clusters thinner than 0.8 % H
  texture         GLB size and maps (a Tripo GLB under 1 MB or without base colour + normal + metallic-roughness lost its textures: a
                  stop for Tripo-sourced assets only; ``source`` auto = Tripo when the glTF generator or a material name says so)
  stop_flags      list of {code, severity: stop|warn|info, reason, evidence}; ``stop`` = any severity "stop"

CLI:  python analysis.py <mesh.npz> [--family S] [--glb <original.glb>] [--source auto|tripo|other] [--requires-fingers]
      [--out <analysis.json>]
"""
from __future__ import annotations

import json
import math
import os
import sys

import numpy as np

if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rigcore import mesh as rmesh, npzio, schema, template  # noqa: E402
from solvers import glbmesh  # noqa: E402
from solvers import landmarks_geo as lg  # noqa: E402

SCRATCH = r"E:\tmp_rigkit\A2"

# thresholds (fractions of H unless stated); proposals, documented in the output
THIN_H = 0.008  # thinner than this = thin part (D01 4 mm, FL 14 mm)
CONTACT_H = 0.005  # arm vertex this close to the torso counts as contact
ARM_CONTACT_STOP_H = 0.017  # contact longer than this along the arm = arm fused to the torso (3 cm at 1.8 m)
ASYM_WARN_H = 0.005  # a region's RMS about its own mirror plane above this: measure both sides separately (joint-placement.md)
PLANE_OFFSET_INFO_H = 0.005  # region mirror planes further apart than this: use a separate plane per region
SOURCES = ("auto", "tripo", "other")
T_POSE_MAX_DEG = 15.0
A_POSE_MAX_DEG = 50.0
GLB_MIN_BYTES = 1_000_000
REQUIRED_MAPS = ("baseColorTexture", "normalTexture", "metallicRoughnessTexture")
FINGER_GAP_RATIO = 0.35  # median finger gap / finger width below this = fingers touch (FL 0.22; U01 0.74, D01 0.58)


def _r(x, nd=6):
    """Round floats (and arrays) for JSON."""
    if x is None:
        return None
    if isinstance(x, (list, tuple, np.ndarray)):
        return [_r(v, nd) for v in np.asarray(x, dtype=np.float64).tolist()]
    x = float(x)
    return None if not math.isfinite(x) else round(x, nd)


# --------------------------------------------------------------------------------------------------------------------------
# topology
# --------------------------------------------------------------------------------------------------------------------------


def topology(V, F, weld) -> dict:
    """Weld, islands and edge statistics on the welded topology."""
    n_w = int(weld.max()) + 1
    Fw = rmesh.welded_faces(F, weld)
    degen = (Fw[:, 0] == Fw[:, 1]) | (Fw[:, 1] == Fw[:, 2]) | (Fw[:, 2] == Fw[:, 0])
    Fk = Fw[~degen]
    edges, cnt = rmesh.unique_edges(Fk, return_counts=True)
    bnd = edges[cnt == 1]
    nm = edges[cnt > 2]
    n_loops, loop_sizes = 0, []
    if len(bnd):
        vids, inv = np.unique(bnd.ravel(), return_inverse=True)
        n_loops, lab = rmesh.connected_components(len(vids), inv.reshape(-1, 2))
        loop_sizes = sorted(np.bincount(lab[inv.reshape(-1, 2)[:, 0]]).tolist(), reverse=True)
    n_isl, lab_v = rmesh.islands(F, weld)
    lab_w = np.zeros(n_w, dtype=np.int64)
    lab_w[weld] = lab_v
    Vw = rmesh.welded_positions(V, weld)
    isl = []
    face_isl = lab_w[Fk[:, 0]]
    for k in range(n_isl):
        sel = lab_w == k
        P = Vw[sel]
        isl.append({"id": k, "n_welded": int(sel.sum()), "n_faces": int((face_isl == k).sum()), "bbox_min": _r(P.min(0), 4),
                    "bbox_max": _r(P.max(0), 4), "centroid": _r(P.mean(0), 4)})
    isl.sort(key=lambda d: -d["n_welded"])
    groups = rmesh.seam_groups(weld)
    return {
        "weld": {"tol_rel": 1e-6, "n_vertices": int(len(V)), "n_welded": n_w, "n_seam_groups": len(groups),
                 "max_group_size": int(max((len(g) for g in groups), default=1))},
        "islands": {"n": n_isl, "sizes_welded": [d["n_welded"] for d in isl], "main_fraction": _r(isl[0]["n_welded"] / n_w, 4),
                    "list": isl},
        "edges": {"n_edges": int(len(edges)), "boundary": int(len(bnd)), "nonmanifold": int(len(nm)), "boundary_loops": int(n_loops),
                  "boundary_loop_sizes": loop_sizes[:20], "degenerate_faces": int(degen.sum())},
        "_island_of_welded": lab_w,
    }


def _edges_hit_triangles(A, B, eps: float = 1e-7) -> np.ndarray:
    """For each pair k: does an edge of triangle A[k] (3,3) cross the interior of triangle B[k]? (Moller-Trumbore, strict.)"""
    a, b, c = B[:, 0], B[:, 1], B[:, 2]
    e1, e2 = b - a, c - a
    hit = np.zeros(len(A), dtype=bool)
    for i, j in ((0, 1), (1, 2), (2, 0)):
        p, q = A[:, i], A[:, j]
        d = q - p
        h = np.cross(d, e2)
        det = (e1 * h).sum(1)
        ok = np.abs(det) > 1e-20
        f = 1.0 / np.where(ok, det, 1.0)
        s = p - a
        u = f * (s * h).sum(1)
        qv = np.cross(s, e1)
        v = f * (d * qv).sum(1)
        t = f * (e2 * qv).sum(1)
        hit |= ok & (u > eps) & (v > eps) & (u + v < 1 - eps) & (t > eps) & (t < 1 - eps)
    return hit


def self_intersections(geom: lg.MeshGeom, island_of_welded) -> dict:
    """Crossing triangle pairs of the welded mesh (pairs that share a welded vertex are adjacent by construction and skipped)."""
    from scipy.spatial import cKDTree

    V, F = geom.V, geom.F
    tri = V[F]
    c = tri.mean(1)
    r = np.linalg.norm(tri - c[:, None, :], axis=2).max(1)
    tree = cKDTree(c)
    lists = tree.query_ball_point(c, r + r.max())
    I = np.repeat(np.arange(len(F)), [len(x) for x in lists])
    J = np.concatenate([np.asarray(x, dtype=np.int64) for x in lists]) if len(lists) else np.zeros(0, np.int64)
    keep = J > I
    I, J = I[keep], J[keep]
    keep = np.linalg.norm(c[I] - c[J], axis=1) <= r[I] + r[J]
    I, J = I[keep], J[keep]
    share = (F[I][:, :, None] == F[J][:, None, :]).any(axis=(1, 2))
    I, J = I[~share], J[~share]
    hit = np.zeros(len(I), dtype=bool)
    for s in range(0, len(I), 200_000):
        sl = slice(s, s + 200_000)
        A, B = tri[I[sl]], tri[J[sl]]
        hit[sl] = _edges_hit_triangles(A, B) | _edges_hit_triangles(B, A)
    I, J = I[hit], J[hit]
    fi = island_of_welded[F[:, 0]]
    same = fi[I] == fi[J]
    pairs: dict[tuple, int] = {}
    for a, b in zip(fi[I].tolist(), fi[J].tolist()):
        key = (min(a, b), max(a, b))
        pairs[key] = pairs.get(key, 0) + 1
    top = sorted(pairs.items(), key=lambda kv: -kv[1])[:10]
    faces = np.unique(np.concatenate([I, J])) if len(I) else np.zeros(0, np.int64)
    return {"n_pairs": int(len(I)), "n_faces": int(len(faces)), "within_island_pairs": int(same.sum()),
            "between_island_pairs": int((~same).sum()),
            "island_pairs": [{"islands": list(k), "n_pairs": v} for k, v in top],
            "method": "AABB-sphere broad phase + strict edge/triangle crossing; coplanar touching not counted",
            "_faces": faces}


# --------------------------------------------------------------------------------------------------------------------------
# symmetry
# --------------------------------------------------------------------------------------------------------------------------


def surface_samples(V, F, n: int, seed: int = 0) -> np.ndarray:
    """Area-uniform random points on the triangles (deterministic for a seed)."""
    rng = np.random.default_rng(seed)
    tri = V[F]
    area = 0.5 * np.linalg.norm(np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0]), axis=1)
    k = rng.choice(len(F), size=n, p=area / area.sum())
    u, v = rng.random(n), rng.random(n)
    flip = u + v > 1
    u[flip], v[flip] = 1 - u[flip], 1 - v[flip]
    t = tri[k]
    return t[:, 0] + u[:, None] * (t[:, 1] - t[:, 0]) + v[:, None] * (t[:, 2] - t[:, 0])


def _reflect(P, n, d):
    return P - 2.0 * ((P @ n) - d)[:, None] * n


def mirror_icp(geom: lg.MeshGeom, P, n0, d0, iters: int = 20, trim: float = 0.8, fix_normal: bool = False):
    """Point-to-plane ICP for the mirror plane ``n . x = d``: reflect ``P``, find the closest surface points C (normals m), solve
    the linearized least squares for (dd, two normal tilts) on the best ``trim`` fraction. Returns ``(n, d, residual per point)``,
    residual = distance from the reflected point to the surface."""
    n = lg.unit(n0)
    d = float(d0)
    FN = geom.face_normals()
    for _ in range(iters):
        R = _reflect(P, n, d)
        dist, fi, C = geom.closest(R)
        m = FN[fi]
        r = ((R - C) * m).sum(1)
        keep = dist <= np.quantile(dist, trim)
        s = P @ n - d
        e1, e2 = lg.plane_basis(n)
        cols = [2.0 * (m @ n)]
        if not fix_normal:
            for e in (e1, e2):
                cols.append((m * (-2.0 * (P @ e)[:, None] * n[None, :] - 2.0 * s[:, None] * e[None, :])).sum(1))
        A = np.stack(cols, 1)[keep]
        sol, *_ = np.linalg.lstsq(A, -r[keep], rcond=None)
        d += float(sol[0])
        if not fix_normal:
            n = lg.unit(n + sol[1] * e1 + sol[2] * e2)
        if abs(sol[0]) < 1e-9 * geom.diag and (fix_normal or np.abs(sol[1:]).max() < 1e-8):
            break
    R = _reflect(P, n, d)
    dist, _, _ = geom.closest(R)
    return n, d, dist


def region_plane(geom: lg.MeshGeom, P, n, d0: float, H: float, iters: int = 30) -> tuple[float, np.ndarray]:
    """Mirror-plane offset of one region with the normal ``n`` fixed (plane n . x = d), by a robust median step: reflect the region
    samples ``P``, take the closest surface points and their normals m; only INFORMATIVE samples (|m . n| > 0.5: surfaces facing
    along the mirror normal - a cylinder's side, a box's end) constrain the offset, each proposing the shift that zeroes its
    point-to-plane residual, delta = -r / (2 m . n); the plane moves by the MEDIAN proposal (robust to parts without a mirror partner:
    a strap, one ear) until it moves less than 1e-6 H. Least-squares ICP with a fixed trim gave D01's arms 5.25 mm against hand tips
    symmetric about 0; T-pose arms are still ill-posed here (few informative samples), so analyse() uses landmark mid-x for them.
    Returns (d, distances from the reflected samples to the surface at d)."""
    FN = geom.face_normals()
    d = float(d0)
    for _ in range(iters):
        R = _reflect(P, n, d)
        _, fi, C = geom.closest(R)
        m = FN[fi]
        mn = m @ n
        inf = np.abs(mn) > 0.5
        if inf.sum() < 10:
            break
        r = ((R - C) * m).sum(1)
        step = float(np.median(-r[inf] / (2.0 * mn[inf])))
        d += step
        if abs(step) < 1e-6 * H:
            break
    dist, _, _ = geom.closest(_reflect(P, n, d))
    return d, dist


def symmetry_plane(geom: lg.MeshGeom, H: float, n_samples: int = 12000) -> dict:
    """Global mirror plane: start from each PCA axis of the surface samples, keep the best after a short ICP, refine."""
    P = surface_samples(geom.V, geom.F, n_samples)
    c, _ = lg.pca_axis(P)
    _, _, vt = np.linalg.svd(P - c, full_matrices=False)
    best = None
    for ax in vt:
        if ax[np.argmax(np.abs(ax))] < 0:
            ax = -ax
        n, d, res = mirror_icp(geom, P, ax, ax @ c, iters=4)
        score = float(np.median(res))
        if best is None or score < best[0]:
            best = (score, n, d)
    n, d, res = mirror_icp(geom, P, best[1], best[2], iters=25)
    if n[0] < 0:
        n, d = -n, -d
    return {"n": n, "d": float(d), "samples": P, "residual": res}


# --------------------------------------------------------------------------------------------------------------------------
# body frame
# --------------------------------------------------------------------------------------------------------------------------


def body_frame(geom: lg.MeshGeom, H: float, x_mid: float) -> dict:
    """Coarse frame from limb tracks: feet, leg tracks + merge (crotch) height, arm tracks, torso half-width below the arms."""
    feet = lg.find_feet(geom, H)
    legs = lg.leg_tracks(geom, H, feet)
    arms = lg.arm_tracks(geom, H, x_mid)
    fr = {"feet": feet, "legs": legs, "arms": arms, "x_mid": x_mid, "merge_z": legs["merge_z"]}
    # where each arm track meets the body: the innermost slice (track stopped after it)
    zj = [a["slices"][-1].centroid[2] for a in arms.values() if a["slices"]]
    fr["arm_z"] = float(np.mean(zj)) if zj else None
    # torso half-width at 60 % between the crotch and the arm junction height
    w = None
    if fr["merge_z"] is not None and fr["arm_z"] is not None and fr["arm_z"] > fr["merge_z"]:
        zc = fr["merge_z"] + 0.6 * (fr["arm_z"] - fr["merge_z"])
        lp = lg.torso_loop(geom, zc, x_mid)
        if lp is not None:
            w = float(np.abs(lp.points[:, 0] - x_mid).max())
        fr["torso_z"] = zc
    fr["torso_half_width"] = w
    return fr


def _in_track(P, slices, scale: float = 1.3) -> np.ndarray:
    """Bool mask of points ``P`` inside the slabs of the track slices (within ``scale`` x the slice radius of the centroid)."""
    mask = np.zeros(len(P), dtype=bool)
    for k, s in enumerate(slices):
        nb = [slices[j].centroid for j in (k - 1, k + 1) if 0 <= j < len(slices)]
        half = 0.5 * float(np.mean([np.linalg.norm(c - s.centroid) for c in nb])) if nb else 0.0
        along = (P - s.centroid) @ s.normal
        mask |= (np.abs(along) <= half + 1e-12) & (np.linalg.norm(P - s.centroid, axis=1) <= scale * s.perimeter / (2 * math.pi))
    return mask


def _limb_vertices(geom: lg.MeshGeom, slices, scale: float = 1.3) -> tuple[np.ndarray, np.ndarray]:
    """Welded vertices inside the slab of each track slice and within ``scale`` x the slice radius of its centroid.
    Returns (vertex ids, slice index per id)."""
    V = geom.V
    ids, which = [], []
    for k, s in enumerate(slices):
        step = 0.5 * (np.linalg.norm(slices[min(k + 1, len(slices) - 1)].centroid - s.centroid) +
                      np.linalg.norm(s.centroid - slices[max(k - 1, 0)].centroid)) or 1e-9
        rad = scale * s.perimeter / (2 * math.pi)
        along = (V - s.centroid) @ s.normal
        dist = np.linalg.norm(V - s.centroid, axis=1)
        sel = np.flatnonzero((np.abs(along) <= 0.5 * step + 1e-12) & (dist <= rad))
        ids.append(sel)
        which.append(np.full(len(sel), k))
    if not ids:
        return np.zeros(0, np.int64), np.zeros(0, np.int64)
    ids, which = np.concatenate(ids), np.concatenate(which)
    u, first = np.unique(ids, return_index=True)
    return u, which[first]


# --------------------------------------------------------------------------------------------------------------------------
# pose / fingers / cloth / thin parts
# --------------------------------------------------------------------------------------------------------------------------


def wrist_index(geom: lg.MeshGeom, H: float, slices) -> int | None:
    """Wrist slice on an arm track marched from the hand tip (landmarks_geo.find_wrist: whole-section perimeter minimum)."""
    w = lg.find_wrist(geom, H, slices)
    return None if w is None else int(w["k"])


def pose(geom: lg.MeshGeom, fr: dict, H: float) -> dict:
    from scipy.spatial import cKDTree

    out: dict = {"arms": {}, "legs": {}}
    x_mid = fr["x_mid"]
    V = geom.V
    angles = []
    torso_ids = None
    w = fr.get("torso_half_width")
    if w is not None and fr["merge_z"] is not None and fr["arm_z"] is not None:
        torso_ids = np.flatnonzero((np.abs(V[:, 0] - x_mid) <= 1.1 * w) & (V[:, 2] >= fr["merge_z"]) & (V[:, 2] <= fr["arm_z"]))
    for side, a in fr["arms"].items():
        sl = a["slices"]
        info: dict = {"n_slices": len(sl)}
        if len(sl) >= 6:
            n = len(sl)
            mid = np.array([s.centroid for s in sl[int(0.25 * n):max(int(0.75 * n), int(0.25 * n) + 2)]])
            _, ax = pca_axis_outward(mid, sl[0].centroid)
            ang = math.degrees(math.atan2(-ax[2], math.hypot(ax[0], ax[1])))
            info["angle_deg"] = _r(ang, 2)
            angles.append(ang)
            info["tip"] = _r(a["tip"], 4)
            info["junction"] = _r(sl[-1].centroid, 4)
            if torso_ids is not None and torso_ids.size:
                r_arm = np.median([s.perimeter for s in sl]) / (2 * math.pi)
                far = [s for s in sl if abs(s.centroid[0] - x_mid) > w + 1.5 * r_arm]
                ids, _ = _limb_vertices(geom, far)
                tor = np.setdiff1d(torso_ids, ids)
                if ids.size and tor.size:
                    dist, _ = cKDTree(V[tor]).query(V[ids])
                    info["arm_torso_min_dist"] = _r(dist.min(), 5)
                    info["arm_torso_min_dist_H"] = _r(dist.min() / H, 4)
                    touch = ids[dist <= CONTACT_H * H]
                    if touch.size:
                        axv = lg.unit(sl[-1].centroid - sl[0].centroid)
                        tpos = V[touch] @ axv
                        info["contact_length"] = _r(tpos.max() - tpos.min(), 5)
                    else:
                        info["contact_length"] = 0.0
                    info["contact_length_H"] = _r(info["contact_length"] / H, 4)
        out["arms"][side] = info
    if angles:
        m = float(np.mean(np.abs(angles)))
        out["arm_angle_deg_mean"] = _r(m, 2)
        out["type"] = "T" if m <= T_POSE_MAX_DEG else ("A" if m <= A_POSE_MAX_DEG else "other")
    else:
        out["type"] = "unknown"
    # legs
    lt = fr["legs"]
    if lt["L"] and lt["R"]:
        idsL, _ = _limb_vertices(geom, lt["L"], 1.25)
        idsR, _ = _limb_vertices(geom, lt["R"], 1.25)
        common = np.intersect1d(idsL, idsR)
        idsL, idsR = np.setdiff1d(idsL, common), np.setdiff1d(idsR, common)
        if idsL.size and idsR.size:
            dist, _ = cKDTree(V[idsR]).query(V[idsL])
            k = int(np.argmin(dist))
            out["legs"] = {"leg_gap_min": _r(dist[k], 5), "leg_gap_min_H": _r(dist[k] / H, 4), "at": _r(V[idsL[k]], 4),
                           "merge_z": _r(lt["merge_z"], 4), "merge_z_H": _r(lt["merge_z"] / H, 4)}
            zm = 0.5 * lt["merge_z"]
            sL = lg.limb_section(geom, [lt["L"][0].centroid[0], lt["L"][0].centroid[1], zm], [0, 0, 1],
                                 [lt["L"][0].centroid[0], lt["L"][0].centroid[1], zm], 0.1 * H)
            sR = lg.limb_section(geom, [lt["R"][0].centroid[0], lt["R"][0].centroid[1], zm], [0, 0, 1],
                                 [lt["R"][0].centroid[0], lt["R"][0].centroid[1], zm], 0.1 * H)
            if sL is not None and sR is not None:
                pl = np.concatenate([lp.points for lp in sL.loops])
                pr = np.concatenate([lp.points for lp in sR.loops])
                gm = float(cKDTree(pr).query(pl)[0].min())
                out["legs"]["leg_gap_mid_height"] = _r(gm, 5)
                out["legs"]["leg_gap_mid_height_H"] = _r(gm / H, 4)
            # hands vs thighs
            hand_d = {}
            for side, a in fr["arms"].items():
                sl = a["slices"]
                wi = wrist_index(geom, H, sl)
                if wi is None:
                    continue
                hid, _ = _limb_vertices(geom, sl[:wi + 1])
                thighs = np.concatenate([idsL[V[idsL, 2] > 0.6 * lt["merge_z"]], idsR[V[idsR, 2] > 0.6 * lt["merge_z"]]])
                if hid.size and thighs.size:
                    dd, _ = cKDTree(V[thighs]).query(V[hid])
                    hand_d[side] = _r(dd.min(), 5)
            out["hand_thigh_min_dist"] = hand_d
    return out


def pca_axis_outward(P, outer_point):
    """PCA axis of ``P`` oriented toward ``outer_point`` (the hand tip)."""
    c, ax = lg.pca_axis(P)
    if (outer_point - c) @ ax < 0:
        ax = -ax
    return c, ax


def fingers(geom: lg.MeshGeom, fr: dict, H: float, step_H: float = 0.004) -> dict:
    """Loops per slice across each hand, slices perpendicular to the forearm axis from the wrist to the tip.

    Verdict: ``mitten`` (<= 2 loops, or >= 3 loops on < 15 % of the slices), ``paddle`` (fingers split only by slits: median gap
    between neighbouring finger loops < FINGER_GAP_RATIO x the finger width; FL "one paddle per hand"), ``separated`` (>= 4 loops),
    else ``partial``. Only ``separated`` supports finger bones."""
    from scipy.spatial import cKDTree

    out = {}
    for side, a in fr["arms"].items():
        sl = a["slices"]
        wi = wrist_index(geom, H, sl)
        if wi is None or a["tip"] is None:
            out[side] = {"verdict": "unknown", "reason": "no arm track"}
            continue
        fore = np.array([s.centroid for s in sl[wi:wi + max(4, int(0.25 * len(sl)))]])
        _, ax = lg.pca_axis(fore)
        if (a["tip"] - sl[wi].centroid) @ ax < 0:
            ax = -ax
        w0 = sl[wi].centroid
        length = float((a["tip"] - w0) @ ax)
        radius = 0.6 * max(length, 1e-6) + 2 * sl[wi].perimeter / (2 * math.pi)
        counts, gaps, widths = [], [], []
        ts = np.arange(step_H * H, length - 0.25 * step_H * H, step_H * H)
        for t in ts:
            o = w0 + t * ax
            loops = [lp for lp in geom.section(o, ax) if np.linalg.norm(lp.centroid - o) <= radius]
            counts.append(len(loops))
            if len(loops) >= 3:  # finger slices: nearest gap of every loop to the others, finger width = perimeter / pi
                g = []
                for i, lp in enumerate(loops):
                    other = np.concatenate([q.points for j, q in enumerate(loops) if j != i])
                    g.append(float(cKDTree(other).query(lp.points)[0].min()))
                    widths.append(lp.perimeter / math.pi)
                gaps.append(float(np.median(g)))
        counts = np.array(counts, dtype=int)
        if counts.size == 0:
            out[side] = {"verdict": "unknown", "reason": "hand too short"}
            continue
        f_sep = float((counts >= 3).mean())
        f_mitten = float((counts <= 2).mean())
        multi = np.flatnonzero(counts >= 2)
        gap = float(np.median(gaps)) if gaps else None
        width = float(np.median(widths)) if widths else None
        ratio = gap / width if gaps and width else None
        if counts.max() <= 2 or f_sep < 0.15:
            verdict = "mitten"
        elif ratio is not None and ratio < FINGER_GAP_RATIO:
            verdict = "paddle"  # split only by slits: the fingers touch and move as one block
        elif counts.max() >= 4:
            verdict = "separated"
        else:
            verdict = "partial"
        out[side] = {"verdict": verdict, "max_loops": int(counts.max()), "frac_slices_ge3": _r(f_sep, 3),
                     "frac_slices_le2": _r(f_mitten, 3), "n_slices": int(counts.size), "hand_length": _r(length, 4),
                     "separated_length": _r(len(np.flatnonzero(counts >= 3)) * step_H * H, 4),
                     "finger_gap_median": _r(gap, 5), "finger_width_median": _r(width, 5), "gap_over_width": _r(ratio, 3),
                     "first_multi_loop_t": _r(ts[multi[0]] if multi.size else None, 4), "loops_per_slice": counts.tolist(),
                     "wrist": _r(w0, 4), "axis": _r(ax, 4)}
    return out


def _solidity(points) -> float:
    """Area of a closed planar loop over the area of its 2D convex hull (1 = convex)."""
    from scipy.spatial import ConvexHull

    c = points.mean(0)
    _, _, vt = np.linalg.svd(points - c, full_matrices=False)
    xy = (points - c) @ vt[:2].T
    x, y = xy[:, 0], xy[:, 1]
    a = 0.5 * abs(np.dot(x, np.roll(y, -1)) - np.dot(y, np.roll(x, -1)))
    try:
        hull = ConvexHull(xy).volume
    except Exception:
        return float("nan")
    return float(a / hull) if hull > 0 else float("nan")


def cloth_bridging(geom: lg.MeshGeom, fr: dict, H: float, hip_prior_H: float) -> dict:
    """Merged leg sections below the family's hip height: a convex loop spanning both leg axes well below the hips = cloth bridging
    the legs (skirt, robe); a waisted (two-lobed) loop = legs fused."""
    lt = fr["legs"]
    out: dict = {"hip_prior_H": hip_prior_H}
    if not (lt["L"] and lt["R"]):
        out.update({"detected": None, "reason": "legs not tracked from the soles (feet fused or covered)"})
        return out
    mz = lt["merge_z"]
    out["merge_z"] = _r(mz, 4)
    out["merge_z_H"] = _r(mz / H, 4)

    def axis_x(track, z):
        zs = np.array([s.centroid[2] for s in track])
        xs = np.array([s.centroid[0] for s in track])
        if z <= zs[-1]:
            return float(np.interp(z, zs, xs))
        k = max(2, len(zs) // 3)
        p = np.polyfit(zs[-k:], xs[-k:], 1)
        return float(np.polyval(p, z))

    rows, faces = [], []
    z_top = max(hip_prior_H * H, mz)
    for z in np.arange(0.03 * H, z_top, 0.01 * H):
        xl, xr = axis_x(lt["L"], z), axis_x(lt["R"], z)
        span = [lp for lp in geom.section([0, 0, z], [0, 0, 1])
                if lp.points[:, 0].min() < xr and lp.points[:, 0].max() > xl and len(lp.points) >= 3]
        if not span:
            continue
        lp = max(span, key=lambda q: q.perimeter)
        rows.append({"z_H": _r(z / H, 3), "closed": bool(lp.closed),
                     "width_over_leg_gap": _r((lp.points[:, 0].max() - lp.points[:, 0].min()) / max(xl - xr, 1e-9), 3),
                     "solidity": _r(_solidity(lp.points), 3) if lp.closed else None})
        faces.append(lp.faces)
    out["merged_sections"] = rows[:80]
    # bridging = a section piece spanning both leg axes more than 0.10 H below the family hip height: an OPEN piece is single-sheet
    # cloth wherever it is (FL's skirt panels span the legs from 0.27 H up), a CLOSED piece counts only below the crotch (above it the
    # closed loop is the pelvis); closed ones are judged by solidity (waisted = fused legs)
    limit = hip_prior_H * H - 0.10 * H
    low = [r for r in rows if r["z_H"] * H < limit and (not r["closed"] or r["z_H"] * H < mz)]
    out["merge_below_hip_prior_H"] = _r((hip_prior_H * H - mz) / H, 4)
    out["bridging_z_range_H"] = [low[0]["z_H"], low[-1]["z_H"]] if low else None
    out["n_bridging_sections"] = len(low)
    sol_low = [r["solidity"] for r in low if r["solidity"] is not None]
    n_open = sum(1 for r in low if not r["closed"])
    out["median_solidity_bridging"] = _r(np.median(sol_low), 3) if sol_low else None
    out["n_open_bridging"] = n_open
    detected = len(low) >= 3
    kind = None
    if detected:
        kind = "cloth" if (n_open >= len(low) / 2 or (np.median(sol_low) if sol_low else 1.0) >= 0.9) else "fused_legs"
    out["detected"] = bool(detected)
    out["kind"] = kind
    nz = [f for f in faces if f.size]
    out["n_faces_crossed"] = int(np.unique(np.concatenate(nz)).size) if nz else 0
    out["method"] = ("legs tracked up from the soles on closed sections (cloth sheets ignored) to their crotch (lowest closed loop "
                     "holding both leg axes); a section piece spanning both leg axes > 0.10 H below the family hip height - open "
                     "anywhere, closed only below the crotch - at >= 3 heights is bridging: open sheet or convex loop (solidity >= 0.9) = "
                     "cloth, waisted closed loop = fused legs")
    return out


def thin_parts(geom: lg.MeshGeom, H: float, thr_H: float = THIN_H, island_of_welded=None) -> dict:
    """Local thickness = distance along the inward normal to the next surface crossing, per welded vertex."""
    V, F = geom.V, geom.F
    fn = np.cross(V[F[:, 1]] - V[F[:, 0]], V[F[:, 2]] - V[F[:, 0]])  # area-weighted
    vn = np.zeros_like(V)
    for k in range(3):
        np.add.at(vn, F[:, k], fn)
    vn = lg.unit(vn)
    eps = 1e-4 * H
    t, _ = geom.first_hit(V - eps * vn, -vn)
    thick = t + eps
    thin = np.isfinite(thick) & (thick < thr_H * H)
    edges = rmesh.unique_edges(F)
    e = edges[thin[edges[:, 0]] & thin[edges[:, 1]]]
    clusters = []
    if thin.any():
        ids = np.flatnonzero(thin)
        remap = -np.ones(len(V), dtype=np.int64)
        remap[ids] = np.arange(len(ids))
        nc, lab = rmesh.connected_components(len(ids), remap[e])
        for k in range(nc):
            sel = ids[lab == k]
            if len(sel) < 8:
                continue
            clusters.append({"n_vertices": int(len(sel)), "centroid_H": _r(V[sel].mean(0) / H, 3),
                             "mean_thickness": _r(np.mean(thick[sel]), 5),
                             "island": int(np.bincount(island_of_welded[sel]).argmax()) if island_of_welded is not None else None})
        clusters.sort(key=lambda c: -c["n_vertices"])
    return {"threshold_H": thr_H, "n_thin": int(thin.sum()), "frac_thin": _r(thin.mean(), 4),
            "n_no_hit": int((~np.isfinite(thick)).sum()), "clusters": clusters[:15],
            "thickness_percentiles_H": _r(np.nanpercentile(thick[np.isfinite(thick)], [1, 5, 25, 50]) / H, 4)
            if np.isfinite(thick).any() else None,
            "_thickness": thick, "_thin": thin}


def axes_check(geom: lg.MeshGeom, fr: dict, H: float) -> dict:
    """Up from the soles; front from the toes (and the head's forward extreme as a second vote)."""
    V = geom.V
    out: dict = {"up": "+Z" if ("L" in fr["feet"] and "R" in fr["feet"]) else "unclear (no two sole sections)"}
    votes = []
    for side in ("L", "R"):
        tr = fr["legs"].get(side) or []
        if not tr:
            continue
        ank = tr[0].centroid
        foot = V[(V[:, 2] < 0.05 * H) & (np.abs(V[:, 0] - ank[0]) < 0.06 * H)]
        if len(foot) < 10:
            continue
        fwd = float(ank[1] - foot[:, 1].min())  # extent toward -Y
        back = float(foot[:, 1].max() - ank[1])
        out[f"foot_{side}"] = {"toward_minus_y": _r(fwd, 4), "toward_plus_y": _r(back, 4)}
        votes.append(-1 if fwd > back else 1)
    if votes:
        out["front_from_toes"] = "-Y" if sum(votes) < 0 else "+Y"
    xm = fr["x_mid"]
    head = V[(V[:, 2] > 0.85 * H) & (np.abs(V[:, 0] - xm) < 0.08 * H)]
    if len(head):
        c = head.mean(0)
        out["head_extent_minus_y"] = _r(c[1] - head[:, 1].min(), 4)
        out["head_extent_plus_y"] = _r(head[:, 1].max() - c[1], 4)
    out["front"] = out.get("front_from_toes", "unclear")
    return out


# --------------------------------------------------------------------------------------------------------------------------
# driver
# --------------------------------------------------------------------------------------------------------------------------


def _family_hip_prior(family: str | None) -> float:
    try:
        fam = template.load_family(family or "H")
        return float(fam.get("priors", {}).get("hip", {}).get("z_over_H", 0.5))
    except Exception:
        return 0.5


def glb_source(glb) -> tuple[str, str]:
    """("tripo" | "other", evidence) from the glTF ``asset.generator`` and the material names of a GLB."""
    js, _ = glbmesh.read_glb(glb)
    gen = str(js.get("asset", {}).get("generator", ""))
    if "tripo" in gen.lower():
        return "tripo", f"asset.generator {gen!r}"
    mats = [str(m.get("name", "")) for m in js.get("materials", [])]
    if any("tripo" in m.lower() for m in mats):
        return "tripo", f"material name {next(m for m in mats if 'tripo' in m.lower())!r}"
    return "other", f"asset.generator {gen!r}, no Tripo material names"


def texture_flag(tex: dict | None, source_kind: str) -> tuple | None:
    """Stop flag of the texture sanity check: (code, severity, reason, evidence) when ``tex`` (``glbmesh.texture_info`` + ``ok``) is
    not ok - severity "stop" only for a Tripo-sourced asset (lost textures = back to the Tripo pipeline), "warn" otherwise (tier-1 CC0
    characters may ship without textures); None when the textures are fine or unknown."""
    if tex is None or tex.get("ok", True):
        return None
    ev = {"glb_bytes": tex.get("glb_bytes"), "maps": tex.get("maps_present"), "source": source_kind}
    if source_kind == "tripo":
        return ("texture_missing", "stop", "Tripo GLB under 1 MB or missing base colour / normal / metallic-roughness maps: back to the "
                "Tripo pipeline", ev)
    return "texture_missing", "warn", "GLB under 1 MB or missing PBR maps (not a Tripo asset: no stop)", ev


def analyse(mesh: dict, family: str = "H", glb=None, requires_fingers: bool = False, source: str = "auto") -> tuple[dict, dict]:
    """Run every S1 measure on a validated mesh dict (npzio.load_mesh). ``source`` = "tripo" | "other" | "auto" (from the GLB): only
    Tripo-sourced assets stop on a missing texture (tier-1 CC0 characters may ship untextured). Returns ``(analysis doc, per-vertex
    arrays)``."""
    if source not in SOURCES:
        raise ValueError(f"source must be one of {SOURCES}, got {source!r}")
    V, F, weld = mesh["V"], mesh["F"], mesh["weld"]
    meta = mesh["meta"]
    H = float(meta["H"])
    geom = lg.MeshGeom(V, F, weld)
    topo = topology(V, F, weld)
    isl_w = topo.pop("_island_of_welded")
    si = self_intersections(geom, isl_w)
    si_faces = si.pop("_faces")
    sym = symmetry_plane(geom, H)
    n, d = sym["n"], sym["d"]
    x_mid = float(d / n[0]) if abs(n[0]) > 0.5 else float(np.median(geom.V[:, 0]))
    fr = body_frame(geom, H, x_mid)
    # symmetry by region: legs / arms = samples inside the limb tracks (arms only beyond the torso side), head = above the arms
    P, res = sym["samples"], sym["residual"]
    regions = np.full(len(P), "torso", dtype=object)
    w = fr.get("torso_half_width")
    for side in ("L", "R"):
        if fr["legs"].get(side):
            regions[_in_track(P, fr["legs"][side], 1.3)] = "legs"
        sl = fr["arms"][side]["slices"]
        if sl:
            r_arm = float(np.median([x.perimeter for x in sl])) / (2 * math.pi)
            far = [x for x in sl if w is None or abs(x.centroid[0] - x_mid) > w + r_arm]
            if far:
                regions[_in_track(P, far, 1.3)] = "arms"
    if fr["arm_z"] is not None:
        top_arm = max(max(s.centroid[2] + s.perimeter / (2 * math.pi) for s in a["slices"]) for a in fr["arms"].values() if a["slices"])
        regions[(P[:, 2] > top_arm) & (regions == "torso")] = "head"
    by_region, offsets = {}, {}
    for rname in ("legs", "arms", "torso", "head"):
        sel = regions == rname
        if sel.sum() < 50:
            continue
        rr = res[sel]
        dr, own = region_plane(geom, P[sel], n, d, H)
        offsets[rname] = float(dr / n[0]) if abs(n[0]) > 0.5 else float(dr)
        k = int(np.argmax(own))
        by_region[rname] = {"n": int(sel.sum()), "plane_x": _r(offsets[rname], 5),
                            "rms": _r(np.sqrt((own ** 2).mean()), 5), "rms_H": _r(np.sqrt((own ** 2).mean()) / H, 5),
                            "median": _r(np.median(own), 5), "p95": _r(np.percentile(own, 95), 5), "max": _r(own.max(), 5),
                            "worst_point": _r(P[sel][k], 4), "rms_about_global_plane": _r(np.sqrt((rr ** 2).mean()), 5)}
    rms = float(np.sqrt((res ** 2).mean()))
    symmetry = {
        "normal": _r(n, 5), "d": _r(d, 6), "x_mid": _r(x_mid, 5),
        "normal_angle_to_x_deg": _r(math.degrees(math.acos(min(1.0, abs(n[0])))), 3),
        "rms": _r(rms, 5), "rms_H": _r(rms / H, 5), "p95": _r(np.percentile(res, 95), 5), "max": _r(res.max(), 5),
        "regions": by_region, "region_plane_x": {k: _r(v, 5) for k, v in offsets.items()},
        "method": "PCA axes -> point-to-plane mirror ICP on 12k area-uniform samples (trim 20 %); residual = reflected sample to surface. "
                  "Per region: its own plane offset (median step over the samples facing along the normal, normal fixed) and the "
                  "residuals about it; arms: landmark mid-x (hand tips, wrists)",
    }
    tips = [fr["arms"][s_]["tip"] for s_ in ("L", "R") if fr["arms"][s_]["tip"] is not None]
    if len(tips) == 2:
        hx = 0.5 * float(tips[0][0] + tips[1][0])
        symmetry["hand_tip_mid_x"] = _r(hx, 5)
        # arms: the surface plane is ill-posed along x (T-pose arms are cylinders along x: sliding the plane barely changes the
        # residual; D01 12.5 mm vs symmetric hand tips at 0); use the landmark mid-x of the hand tips and the wrists instead
        mids = [hx]
        wr = [lg.find_wrist(geom, H, fr["arms"][s_]["slices"]) for s_ in ("L", "R")]
        if all(w is not None for w in wr):
            mids.append(0.5 * float(wr[0]["pos"][0] + wr[1]["pos"][0]))
            symmetry["wrist_mid_x"] = _r(mids[-1], 5)
        if "arms" in offsets:
            symmetry["arms_surface_plane_x"] = _r(offsets["arms"], 5)
        offsets["arms"] = float(np.median(mids))
        symmetry["region_plane_x"]["arms"] = _r(offsets["arms"], 5)
        if "arms" in by_region:
            by_region["arms"]["plane_x"] = _r(offsets["arms"], 5)
            by_region["arms"]["plane_note"] = "landmark mid-x (hand tips, wrists); rms/median about the surface plane arms_surface_plane_x"
        if "legs" in offsets:
            symmetry["leg_vs_hand_tip_x_offset"] = _r(offsets["legs"] - hx, 5)
    if "legs" in offsets and "arms" in offsets:
        symmetry["leg_vs_arm_x_offset"] = _r(offsets["legs"] - offsets["arms"], 5)
        symmetry["leg_vs_arm_x_offset_H"] = _r((offsets["legs"] - offsets["arms"]) / H, 4)
    ps = pose(geom, fr, H)
    fing = fingers(geom, fr, H)
    hip_prior = _family_hip_prior(family)
    cloth = cloth_bridging(geom, fr, H, hip_prior)
    thin = thin_parts(geom, H, island_of_welded=isl_w)
    thick, thin_mask = thin.pop("_thickness"), thin.pop("_thin")
    axes = axes_check(geom, fr, H)
    tex = None
    glb = glb or meta.get("source_glb")
    src_kind, src_why = (source, "given") if source != "auto" else ("other", "no GLB to inspect")
    if source == "auto" and glb and os.path.isfile(glb):
        src_kind, src_why = glb_source(glb)
    if glb and os.path.isfile(glb):
        tex = glbmesh.texture_info(glb)
        maps = set().union(*[set(m["maps"]) for m in tex["materials"]]) if tex["materials"] else set()
        tex["maps_present"] = sorted(maps)
        tex["ok"] = bool(tex["glb_bytes"] >= GLB_MIN_BYTES and all(k in maps for k in REQUIRED_MAPS))
    flags = []

    def flag(code, severity, reason, **ev):
        flags.append({"code": code, "severity": severity, "reason": reason, "evidence": ev})

    for side, a in ps["arms"].items():
        cl = a.get("contact_length")
        if cl is not None and cl > ARM_CONTACT_STOP_H * H:
            flag("arm_fused_torso", "stop", f"arm {side} touches the torso along {cl * 100:.1f} cm (> {ARM_CONTACT_STOP_H} H): propose a new T-pose",
                 side=side, contact_length=cl)
    if cloth.get("detected") and cloth.get("kind") == "fused_legs":
        flag("legs_fused", "stop", "the leg sections merge into a waisted loop well below the hips: legs fused, propose a new T-pose",
             merge_z_H=cloth.get("merge_z_H"))
    if cloth.get("detected") is None:
        flag("legs_untracked", "warn", cloth.get("reason", "legs could not be tracked"))
    if cloth.get("detected") and cloth.get("kind") == "cloth":
        flag("cloth_bridging", "warn", "skirt/robe bridges the legs below the hips: aesthetic risk in deep crouches and wide strides; "
             "propose skirt chains (S6), the user decides", merge_z_H=cloth.get("merge_z_H"), hip_prior_H=hip_prior)
    fused = [s for s, f in fing.items() if f.get("verdict") in ("mitten", "paddle", "partial")]
    if fused:
        flag("fingers_fused", "stop" if requires_fingers else "warn",
             f"fingers not separated on {', '.join(fused)} ({', '.join(fing[s]['verdict'] for s in fused)}): mitten hand (one hand bone, no "
             "fingers) unless the brief needs finger bones", sides=fused, requires_fingers=requires_fingers)
    tf = texture_flag(tex, src_kind)
    if tf is not None:
        flag(*tf[:3], **tf[3])
    asym = {k: v["rms"] for k, v in by_region.items() if v["rms"] is not None and v["rms"] > ASYM_WARN_H * H}
    if asym:
        flag("asymmetric", "warn", "mirror RMS about the region's own plane > " + f"{ASYM_WARN_H} H in " +
             ", ".join(f"{k} {v * 1000:.1f} mm" for k, v in asym.items()) + ": measure each side separately, mirror only where a side's "
             "asymmetry is <= 0.5 % H", regions=asym, global_rms=rms)
    off = symmetry.get("leg_vs_arm_x_offset")
    if off is not None and abs(off) > PLANE_OFFSET_INFO_H * H:
        flag("leg_plane_offset", "info", f"legs mirror about x = {offsets['legs'] * 1000:.1f} mm, arms about {offsets['arms'] * 1000:.1f} mm: "
             "use a separate leg mirror plane", offset=off)
    ref = symmetry.get("hand_tip_mid_x")
    far = {k: v for k, v in offsets.items() if k in ("torso", "head") and ref is not None and abs(v - ref) > PLANE_OFFSET_INFO_H * H}
    if far:
        flag("region_plane_offset", "info", "torso/head mirror plane off the hand-tip midline (" + ", ".join(
            f"{k} {v * 1000:+.1f} mm" for k, v in far.items()) + f" vs {ref * 1000:+.1f} mm): centre landmarks use the region's own "
             "midline", offsets={k: _r(v, 5) for k, v in far.items()}, hand_tip_mid_x=ref)
    if topo["edges"]["nonmanifold"] > 0:
        flag("non_manifold", "warn", "non-manifold edges: bone heat / Pinocchio need the watertight proxy", n=topo["edges"]["nonmanifold"])
    if topo["edges"]["boundary"] > 0:
        flag("open_boundary", "info", "open boundary edges: use the watertight proxy for heat/geodesic weights", n=topo["edges"]["boundary"])
    if ps.get("type") == "other":
        flag("pose_not_T_or_A", "warn", f"arm angle {ps.get('arm_angle_deg_mean')} deg: neither T nor A pose")
    if axes.get("front") == "+Y":
        flag("faces_plus_y", "stop", "toes point to +Y: the character faces +Y, not -Y (S2 must rotate it 180 deg about Z)")
    doc = {
        "schema": 0,
        "asset_id": meta["asset_id"],
        "H": H,
        "family": family,
        "source": {"mesh_sha_note": "mesh.npz from glbmesh/rigkit", "source_glb": glb, "source_sha256": meta.get("source_sha256"),
                   "scale_factor": meta.get("scale_factor"), "z_offset": meta.get("z_offset"), "kind": src_kind, "kind_evidence": src_why},
        "n_vertices": int(len(V)),
        "n_welded": topo["weld"]["n_welded"],
        "n_triangles": int(len(F)),
        "n_islands": topo["islands"]["n"],
        **topo,
        "self_intersections": si,
        "symmetry": symmetry,
        "axes": axes,
        "frame": {"feet": {k: _r(v, 4) for k, v in fr["feet"].items() if k in ("L", "R")}, "merge_z": _r(fr["merge_z"], 4),
                  "arm_z": _r(fr["arm_z"], 4), "torso_half_width": _r(fr.get("torso_half_width"), 4), "x_mid": _r(x_mid, 5)},
        "pose": ps,
        "fingers": fing,
        "cloth_bridging": cloth,
        "thin_parts": thin,
        "texture": tex,
        "stop_flags": flags,
        "stop": any(f["severity"] == "stop" for f in flags),
        "thresholds": {"finger_gap_ratio": FINGER_GAP_RATIO, "thin_H": THIN_H, "contact_H": CONTACT_H, "arm_contact_stop_H": ARM_CONTACT_STOP_H, "asym_warn_H": ASYM_WARN_H,
                       "plane_offset_info_H": PLANE_OFFSET_INFO_H,
                       "t_pose_max_deg": T_POSE_MAX_DEG, "a_pose_max_deg": A_POSE_MAX_DEG, "glb_min_bytes": GLB_MIN_BYTES},
    }
    schema.validate_analysis(doc)
    sf = np.zeros(len(geom.F), dtype=bool)
    sf[si_faces] = True
    arrays = {"island_welded": isl_w.astype(np.int32), "thickness_welded": thick, "thin_welded": thin_mask,
              "self_intersect_face_welded": sf, "sym_samples": P, "sym_residual": res}
    return doc, arrays


def write(doc: dict, arrays: dict, out_json) -> str:
    npzio.write_json(out_json, doc)
    out_npz = os.path.splitext(os.fspath(out_json))[0] + ".npz"
    tmp = f"{out_npz}.tmp{os.getpid()}"
    with open(tmp, "wb") as fh:
        np.savez_compressed(fh, **arrays)
    os.replace(tmp, out_npz)
    return out_json


def main(argv=None) -> int:
    import argparse

    ap = argparse.ArgumentParser(description="S1 mesh analysis -> analysis.json")
    ap.add_argument("mesh", help="mesh.npz (Blender frame after S2)")
    ap.add_argument("--family", default="H")
    ap.add_argument("--glb", default=None, help="original GLB for the texture check (default: mesh meta source_glb)")
    ap.add_argument("--requires-fingers", action="store_true", help="the brief needs finger bones (fused fingers become a stop)")
    ap.add_argument("--source", choices=SOURCES, default="auto", help="tripo | other | auto (from the GLB): only Tripo stops on a missing texture")
    ap.add_argument("--out", default=None, help=r"default E:\tmp_rigkit\A2\<asset_id>\analysis.json")
    a = ap.parse_args(argv)
    mesh = npzio.load_mesh(a.mesh)
    doc, arrays = analyse(mesh, a.family, a.glb, a.requires_fingers, a.source)
    out = a.out or os.path.join(SCRATCH, doc["asset_id"], "analysis.json")
    write(doc, arrays, out)
    short = {k: doc[k] for k in ("asset_id", "n_vertices", "n_welded", "n_triangles", "n_islands")}
    short["boundary"] = doc["edges"]["boundary"]
    short["stop"] = doc["stop"]
    short["flags"] = [f"{f['severity']}:{f['code']}" for f in doc["stop_flags"]]
    short["out"] = out
    print(json.dumps(short))
    return 0


if __name__ == "__main__":
    sys.exit(main())
