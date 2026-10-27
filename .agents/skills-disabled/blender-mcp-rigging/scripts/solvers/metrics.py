r"""solvers.metrics - S7 deformation metrics -> metrics.json, regions.npz, region_scores.json (+ region_scores_detail.json),
vertex_fields.npz (runs in rigkit-env).

Inputs (rigcore formats):
    mesh.npz     V (n,3) object space after S2, F (m,3), weld (n,)
    poses.npz    P (p,n,3) vertex positions evaluated under runtime emulation (rigkit.poses), bone heads/tails; optional extras
                 ``pose_mats`` (p,b,4,4) / ``rest_mats`` (b,4,4) world bone matrices, ``parents`` (b,), ``deform`` (b,) and meta
                 ``tags`` {pose: [tag, ...]}, ``rest_index``
    weights.npz  the weights that produced P (the emulated exporter weights); W (n,k), bones (k,)
    optional     regions.npz (explicit masks), --region-map {bone: region}, candidate weights (``--candidate NAME=weights.npz``)
Numbers that are proposals (bands, epsilons) come from thresholds.json (rows quoted below); the module constants are fallbacks.

Units: metres; keys ending in ``_mm`` are millimetres. Frame: Blender, Z up, front -Y, character left +X. ``H`` (catalogue height)
comes from mesh meta. Positions of poses.npz are world space; S2 applies object transforms, so world = object space of mesh.npz.

Definitions (all on the WELDED topology: duplicates at UV seams share one welded id; a welded vertex takes the position of its
first original vertex, so seam cracks are measured separately; references/deformation-qa.md, review r1):

* regions: every welded vertex gets the region of its dominant bone (largest weight of its first original vertex); bones map to
  regions through the region map (default: ``<bone>_twist`` folds into ``<bone>``, every other bone is its own region; vertices
  without weight are ``_unweighted``). Two regions are adjacent when one holds the parent bone of the other (walking up through
  bones without vertices) or they share a welded edge. An edge or face "touches" a region when any of its vertices is in it and
  counts for every region it touches; a face's own region (penetration targets) = argmax of the mean region weights.
* edge stretch: posed / rest length of every welded edge with rest length > ``2e-5 H``. TORN edge = ratio > 1.5 AND growth >
  0.2 % H (``deform_torn_edges_*``). Per region: ``n_torn``, ``torn_fraction`` (of the region's edges); max / p99 / counts > 1.25 /
  1.5 and growth in mm are diagnostics.
* area change: faces with rest area > (1e-5 H)^2 whose smallest rest angle is >= 10 deg (slivers skipped). ``area_fraction_beyond``
  = area-weighted (rest area) fraction of the region's faces with |posed / rest area - 1| > 0.15; ``area_change_max`` = largest
  |ratio - 1| of those faces (diagnostic; a single face does not decide the light).
* seam crack: max distance between the members of a weld group and its first member (m).
* new penetrations: triangle pairs that intersect in the pose but not at rest, among pairs that share no welded vertex and either
  lie on different welded islands (cloth on body) or belong to non-adjacent regions (exact segment/triangle tests after an AABB grid
  broad phase; coplanar pairs are not counted). For each direction of a new pair, the intruding face's vertices are tested against
  the other side's surface by the generalized winding number (igl; inside = w > 0.5): the other face's whole island when the
  islands differ, else that island without the faces of the intruding region and of its adjacent regions (a "cut" target). The
  target surface is CLOSED first: every connected component of its boundary edges (the cut borders and any open border of the
  mesh) gets a fan cap to the mean of its vertices, so the winding number is 0 or 1 away from it (review r2: on the open cut
  surface the deepest hands_crossed vertex sat at w = 0.52). Only vertices inside now and NOT inside the same closed surface at
  rest count ("newly inside"); depth = distance to that closed surface (caps included: a vertex just past a cut border is barely
  inside the non-adjacent part), read on the whole connected piece of newly-inside vertices that the pair's vertices belong to
  (flood fill over welded edges), so a deep intrusion is not measured on the crossing faces only. A pair is a PENETRATION when a
  newly-inside vertex is deeper than eps = 0.05 % H, plus - when the intruding face lies (rest positions) within 2 % H of a rest
  pair of the same two regions - the depth of that rest overlap: an overlap present at rest that only slides (D01: belt in the
  belly, eyes in the skull, sack on the chest) stays below that bound, an intrusion elsewhere does not. Every other
  new pair is a CONTACT (listed under ``contacts``, not in the lights). ``penetration.n_tris`` = faces of the region in
  penetrating pairs, ``max_depth`` = deepest counted vertex (m), ``pair`` = the deepest penetrating pair touching the region:
  ``{intruder, into, target ("island" | "cut"), depth, hot (deepest intruding vertex, m), w (its winding number)}``; the margin
  of the inside test (smallest w - 0.5 of the counted vertices, w of the deepest one) is in ``summary.penetration_margin``.
* joint volume (ball occupancy): for every region whose bone has a parent region (elbow = ForeArm/UpperArm, ...): limb radius =
  median distance to the child bone axis of the child-region vertices (region weight >= 0.5) within 0.6 x child bone length of
  the joint; ball radius r = min(``ball_factor`` x limb radius, 0.6 x child bone length), ``ball_factor`` 0.8 by default
  (``deform_joint_volume.ball_factor``); a fixed cubic lattice of points in that ball (spacing r / BALL_N, symmetric under every
  axis flip, so mirrored joints use mirrored points) is centred on the child bone head and turns with the child bone (skinning
  rotation of pose_mats; world-aligned without them); occupancy = fraction of the points inside the child region's welded island
  (winding number). ratio = posed occupancy / rest occupancy. "Not measurable" (with the reason) when the rest pose, the bones or
  the child vertices are missing, or the rest occupancy is below half of what a centred limb-sized cylinder fills of the ball
  (0.5 for ball_factor <= 1; 0.5 x (1 - (1 - 1/f^2)^1.5) above): the joint centre is not inside the limb. A larger ball (the
  review r1 probe used about 2 x limb radius) also counts neighbouring parts that move into it (D01 elbow in arms_crossed: 2.6),
  so the light keeps the core of the joint. Mirror check: L/R rest occupancy and radius, and |ratio_L - ratio_R| over pose pairs
  whose names differ only by the side token. The largest ratio is reported next to the smallest (``max_ratio``: neighbouring
  parts moving into the ball).
* joint exercise: per pose and region, the largest rotation (deg) of a JOINT at the region's bones: each bone carrying weight
  (primary weights) against its nearest ancestor that carries weight (bones without weight in between are walked over); the
  angle counts for both bones' regions, so a region is exercised by its own joint and by the joints of its children (pelvis by
  the hips, chest by the shoulders and neck). From the skinning rotations of pose_mats / rest_mats; None without them.
* candy wrapper: section area of the forearm/hand faces of a side, posed / rest, on planes at 0.5, 0.75 and 0.9 of the forearm
  (head = elbow; normal = forearm direction) and on the WRIST BAND plane (through the hand head; normal = bisector of the forearm
  and hand directions, references/skinning.md "Wrist crease"); of the slice's connected pieces the one nearest the plane point.
  ``min`` = smallest of the four. The light uses the tagged side of the ``forearm_twist_<side>`` poses. A side without weighted
  forearm twist bones is never green: the light is capped at yellow with "no twist bones" (still measured).
* ground contact: lowest z (mm) of the sole vertices (weight > 0.5 on ``<side>_Foot`` / ``<side>_Toe``) of each foot tagged
  ``planted_L`` / ``planted_R`` in the pose.
* joint drift: every deform bone head of the pose tested inside the deformed mesh (winding number of all faces, > 0.5) and its
  distance to the surface; the light value is the largest distance of a core head OUTSIDE the mesh (0 = all inside): yellow up to
  0.2 % H, red beyond. Exempt bones (thin parts) are listed, not hidden.
* limb leak (``weights_limb_leak``, pose-independent; references/deformation-qa.md "Limb leak", review B r3): on the welded rest
  positions and the exporter-rule weights, ``solvers.skin_common.limb_leak`` with the rest segments of the weight columns
  (poses.npz rest pose) and the parameters of the thresholds row: welded rows whose nearest deform segment is not a limb bone
  and that carry >= 0.1 of the upper-arm unit farther than 0.75 x upper-arm length from it, or of the thigh more than 0.3 thigh
  lengths above the hip joint. ``summary.weights_limb_leak`` = rows (union, the light value), per side and limb, per region;
  every candidate's rows per region are in ``region_scores_detail.json``. Not measured without a rest pose.

Lights (thresholds.json rows with evaluated_by "metrics"; exempt regions left out but listed in ``summary.exempt``):
``deform_torn_edges_standard`` (any torn edge in a standard pose = red), ``deform_torn_edges_extreme`` (largest torn fraction of a
region in an extreme pose: yellow above 0, red above 0.5 %), ``deform_area_change`` (largest area fraction in an extreme pose:
green <= 1 %, red > 5 %), ``deform_joint_volume``, ``deform_candy_wrapper``, ``deform_penetration_standard`` (faces in
penetrating pairs in standard poses), ``deform_penetration_extreme_depth``, ``deform_seam_crack``, ``deform_ground_contact``,
``joint_core_heads_inside``, ``weights_limb_leak`` (leaking rows of the primary weights). Poses tagged ``standard`` are standard;
poses tagged ``extreme`` are extreme (when no pose carries the tag, every pose but the rest pose is extreme).

Region score for skin selection (``region_scores.json`` = {region: {candidate: score}}, lower is better; per region and candidate,
over all poses, in this order - references/deformation-qa.md "Region score"; numbers from thresholds.json ``skin_region_score``):
  0. exercise: a region whose joints (see "joint exercise") all turn less than 3 deg (``not_exercised_deg``) in every pose is NOT
     EXERCISED: the poses cannot tell the candidates apart there (D01 legacy QA: the toes never flex; generic ROM before r3: toes,
     ears, helmet, sack, loincloth never move). Every candidate gets the same score ``NOT_EXERCISED_SCORE`` (0.0), the decision
     says ``decided_by`` "not_exercised", ``winner`` null, and the region is flagged for G2 (``summary.not_exercised``). For
     B's selector: equal scores carry NO preference - keep such a region on the default / rule-based candidate (or the user's
     choice at G2) and do not read the candidate order as a decision. Without pose_mats every region counts as exercised;
  1. seam cracks must be 0 (max crack <= 1e-6 m, ``deform_seam_crack.tolerance``);
  1b. limb-leak gate (I2 after review B r3): in a GATE region (``weights_limb_leak.gate_regions``: torso, neck, clavicle, upper
     arm and thigh regions; ``{S}`` = L and R) a candidate whose leaking rows (see "limb leak") inside the region exceed the row's
     green bound (3) is DROPPED there: it ranks after every candidate that is not (``decision.leak_gate``: rows per candidate,
     ``dropped``) - unless every candidate exceeds it: then nobody is dropped and the region is flagged for G2
     (``leak_gate.all_leak``). Other regions and weights without a rest pose are not gated;
  2. less tearing: the TEAR LENGTH (sum over the region's torn edges of posed length - 1.5 x rest length, in integer units of
     1e-4 H) of the worst pose, then its sum over poses. Deviation from "fewer torn edges" (count), recorded for review r2: on
     D01 the count lets a rigid cut win both wrists (hands_crossed: G2 spreads the bend over 49 torn edges at <= 2.6x, the rigid
     cut tears 40 edges at up to 7.5x); the tear length weighs that (G2 3406 vs rigid 14453 units). Counts stay in the lights.
     Tear lengths within about 5 % are EQUAL (review r2): candidates sorted by the value form tie classes - a class starts at its
     smallest value v0 and holds every value <= v0 + max(``tear_tie_rel`` x v0, ``tear_tie_abs_units``) (5 %, 2 units) - so
     near-equal tearing falls through to steps 3-5; ``decision.tear_tie`` lists the candidates tied with the winner whose raw
     tear lengths differ from its own;
  3. penetration-depth tier: 0 (no penetrating pair), 1 (deepest < 0.5 % H), 2 (deeper);
  4. soft score = PM4(edge excess) + PM4_area(area excess) + max(0, 0.85 - smallest joint volume ratio of the region), where PM4 is
     the power mean with p = 4 over every (pose, edge) / (pose, non-sliver face; rest-area weighted) sample of the region (never a
     plain mean: a rigid cut hides its few torn edges in a mean), edge excess = max(0, |ln r| - ln 1.25) / (ln 1.5 - ln 1.25)
     (0 inside [0.8, 1.25], 1 at 1.5), area excess = max(0, |ln a| - ln 1.15) / ln 1.15;
  5. near tie: candidates (of the best steps 1-3) whose soft score is within 5 % of the best (at least 0.05 x 0.01 absolute) are
     ranked by weight roughness (mean over the region's welded edges of sum_bones (w_i - w_j)^2 of the exporter-rule weights; lower
     = smoother) and the region is flagged for G2 - unless the tied candidates are equivalent there (same soft score and
     roughness, e.g. identical weights): ``decided_by`` "equivalent", no flag.
Scalar encoding (keeps that order; JSON number): score = 2e14 x seam_fail + 1e14 x leak_drop + 1e8 x tw + 10 x ts + tier +
s / (1 + s), where leak_drop = 1 for a candidate the limb-leak gate drops (I2; seam was 1e14 before, it must stay above the leak
term plus the largest tear term), tw / ts are the tie-class minima of tear_worst / tear_sum (r3; the raw values before, so
candidates in one tie class carry the same tear terms; the classes are formed inside each (seam, leak_drop) group), s = soft
score, inside a near tie s = s_best + band x k / |tie| for the k-th smoothest (k = 0 wins). Bounds (checked): tear_sum < 1e7,
tear_worst < 1e6 units; above about 1e10 the fraction loses resolution (only when tearing differs anyway).
``region_scores_detail.json`` holds every step's value, the decision and the G2 flags. Regions
are fixed by the primary weights so the candidates are scored on the same masks; candidate positions come from numpy LBS
(pose_mats, exporter rule: drop <= 1e-4, top 4, renormalize). Candidates are named on the command line (``--candidate
NAME=weights.npz``) or by their own ``meta.candidate`` (``--candidate-file weights.npz``: the key B's skin_select maps by).

Files written with ``numpy.savez_compressed`` (no pickles; ``<path>.tmp<pid>`` then rename): ``regions.npz`` = ``names`` (r,)
unicode, ``masks`` (r, n_welded) bool over rigcore.mesh.weld_map ids, ``meta`` 0-d unicode JSON; ``vertex_fields.npz`` = ``names``
(p,) unicode, per original vertex and pose: ``stretch`` / ``compress`` float32 (largest / smallest incident welded edge ratio),
``area`` float32 (largest |area ratio - 1| of the incident non-sliver faces), ``penetration`` float32 (-1 none, 0 vertex of a
penetrating face, > 0 depth m of a counted intruding vertex), ``contact`` uint8 (vertex of a contact face), ``torn`` uint8 (vertex
of a torn edge), ``region_of_vertex`` int16 (n,), ``region_names`` (r,) unicode, ``meta`` JSON.

Run:  python -I metrics.py --mesh mesh.npz --poses poses.npz --weights weights.npz --out-dir DIR [options]   (prints one JSON line)
      skin selection: ... --candidate rigid=rigid.npz --candidate-file A.npz --candidate-file B.npz   (keys = meta.candidate)
"""
from __future__ import annotations

import argparse
import json
import math
import os
import sys
import time

import numpy as np

if __name__ == "__main__":  # bootstrap: scripts/ on sys.path so this runs with python -I
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import igl  # noqa: E402

from rigcore import mesh as rmesh  # noqa: E402
from rigcore import npzio, schema  # noqa: E402
from solvers import skin_common  # noqa: E402  (limb_leak: numpy + rigcore only)

SCHEMA = 0
HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_THRESHOLDS = os.path.join(HERE, "thresholds.json")
UNWEIGHTED = "_unweighted"
MESH_REGION = "_mesh"  # pseudo-region holding whole-mesh values in metrics.json
GARMENT_REGION = "_garments"  # phase G scoring pass (--garment-rows): garment rows, never scored (the garment overlay owns them)
EXPORT_MIN_WEIGHT = 1e-4  # glTF exporter: weights <= this are dropped
EXPORT_MAX_INFLUENCES = 4
SIDES = ("L", "R")
JOINT_LABELS = {"UpperArm": "shoulder", "ForeArm": "elbow", "Hand": "wrist", "Thigh": "hip", "Calf": "knee", "Foot": "ankle",
                "Toe": "ball", "Clavicle": "clavicle", "neck": "neck", "head": "head", "spine_01": "spine_01",
                "spine_02": "spine_02", "chest": "chest"}
VOLUME_LIGHT_JOINTS = ("shoulder", "elbow", "hip", "knee")
# fallbacks; the values in use come from thresholds.json (Params)
BALL_FACTOR = 0.8
BALL_N = 14  # lattice points per ball radius (about 11.5k points)
BALL_MIN_REST = 0.5
CANDY_T = (0.5, 0.75, 0.9)
NEAR_TIE = 0.05
SOFT_FLOOR = 0.01
SCORE_POWER = 4
TEAR_UNIT_H = 1e-4  # tear length unit of the region score, fraction of H
TEAR_TIE_REL = 0.05  # tear lengths within 5 % (of the smaller) are equal ...
TEAR_TIE_ABS_UNITS = 2.0  # ... or within 2 units (2e-4 H)
NOT_EXERCISED_DEG = 3.0  # a region whose joints all turn less than this in every pose is not exercised
NOT_EXERCISED_SCORE = 0.0  # the same score for every candidate of a region that is not exercised (no preference)
LEAK_BAND = 3  # limb-leak rows a candidate may have in a gate region (thresholds.json weights_limb_leak green bound)
LEAK_GATE_REGIONS = ("pelvis", "spine_01", "spine_02", "spine_03", "chest", "neck", "{S}_Clavicle", "{S}_UpperArm", "{S}_Thigh")
ENC = {"seam": 2e14, "leak": 1e14, "tear_worst": 1e8, "tear_sum": 10.0, "tier": 1.0}
ENC_LIMITS = {"tear_worst": 1e6, "tear_sum": 1e7}

# --------------------------------------------------------------------------------------------------------------------------
# small helpers
# --------------------------------------------------------------------------------------------------------------------------


def exporter_rule(W, min_weight: float = EXPORT_MIN_WEIGHT, max_influences: int = EXPORT_MAX_INFLUENCES) -> np.ndarray:
    """Weights as the Blender 5.2 glTF exporter writes them (primitive_extract + primitive_attributes): drop w <= min_weight,
    keep the ``max_influences`` largest, renormalize in float32. Rows left empty stay 0 (the exporter binds them to an added
    neutral joint). Returns float32 (n,k). Same rule as rigkit.poses.exporter_rule.

    Exact ties at the cut: the exporter sorts each vertex's (joint, weight) list by weight with a stable sort, so ties keep the
    vertex's group-membership order (its MDeformVert order = the order in which the weights were assigned to that vertex); this
    function keeps the COLUMN order of ``W``. The two agree when the columns follow the group order of the exported object, which
    is how rigkit.poses builds the emulation (columns = the source's groups in group order, written in that order by
    rigkit.skin_io); for other column orders an exact tie between the 4th and 5th weight may pick a different bone."""
    W = np.asarray(W, dtype=np.float32)
    out = np.where(W > min_weight, W, np.float32(0.0)).astype(np.float32)
    if out.shape[1] > max_influences:
        order = np.argsort(-out, axis=1, kind="stable")
        drop = order[:, max_influences:]
        np.put_along_axis(out, drop, np.float32(0.0), axis=1)
    s = out.sum(axis=1, dtype=np.float32)
    nz = s > 0
    out[nz] = out[nz] / s[nz, None]
    return out


def side_of(name: str):
    """'L' / 'R' / None from a bone or region name (``L_x``, ``x_L``, ``fx_hand_L``)."""
    if name.startswith("L_") or name.endswith("_L"):
        return "L"
    if name.startswith("R_") or name.endswith("_R"):
        return "R"
    return None


def base_name(name: str) -> str:
    """Bone name without the side prefix/suffix (``L_ForeArm`` -> ``ForeArm``)."""
    if name[:2] in ("L_", "R_"):
        return name[2:]
    if name[-2:] in ("_L", "_R"):
        return name[:-2]
    return name


def mirror_name(name: str) -> str | None:
    """Name with its side tokens swapped (``knee_flexion_L_p140`` -> ``knee_flexion_R_p140``); None without a side token."""
    toks = name.split("_")
    swap = {"L": "R", "R": "L"}
    if not any(t in swap for t in toks):
        return None
    return "_".join(swap.get(t, t) for t in toks)


def tri_areas(P, F) -> np.ndarray:
    """Triangle areas (m^2) of faces ``F`` over positions ``P``."""
    a, b, c = P[F[:, 0]], P[F[:, 1]], P[F[:, 2]]
    return 0.5 * np.linalg.norm(np.cross(b - a, c - a), axis=1)


def tri_min_angles(P, F) -> np.ndarray:
    """Smallest interior angle (deg) of each triangle (0 for degenerate ones)."""
    a, b, c = P[F[:, 0]], P[F[:, 1]], P[F[:, 2]]
    out = np.full(len(F), 180.0)
    for p, q, r in ((a, b, c), (b, c, a), (c, a, b)):
        u, v = q - p, r - p
        nu, nv = np.linalg.norm(u, axis=1), np.linalg.norm(v, axis=1)
        ok = (nu > 0) & (nv > 0)
        cosang = np.where(ok, np.einsum("ij,ij->i", u, v) / np.where(ok, nu * nv, 1.0), 1.0)
        ang = np.degrees(np.arccos(np.clip(cosang, -1.0, 1.0)))
        out = np.minimum(out, np.where(ok, ang, 0.0))
    return out


def _f64(a):
    return np.ascontiguousarray(a, dtype=np.float64)


def _i64(a):
    return np.ascontiguousarray(a, dtype=np.int64)


def save_npz(path, arrays: dict, retries: int = 12) -> str:
    """``numpy.savez_compressed`` of ``arrays`` (no pickles) to ``<path>.tmp<pid>``, then renamed over ``path`` (retries on Windows
    file locks). Returns ``path``."""
    path = os.fspath(path)
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    tmp = f"{path}.tmp{os.getpid()}"
    last = None
    for attempt in range(retries):
        try:
            with open(tmp, "wb") as f:
                np.savez_compressed(f, **arrays)
            os.replace(tmp, path)
            return path
        except OSError as e:
            last = e
            time.sleep(min(0.1 * (attempt + 1), 1.0))
    try:
        os.remove(tmp)
    except OSError:
        pass
    raise last


def ball_lattice(n: int = BALL_N) -> np.ndarray:
    """Unit-ball points of the cubic lattice with spacing 1/n (symmetric under every axis flip), (k,3)."""
    g = np.arange(-n, n + 1, dtype=np.float64) / n
    L = np.stack(np.meshgrid(g, g, g, indexing="ij"), -1).reshape(-1, 3)
    return L[np.linalg.norm(L, axis=1) <= 1.0]


# --------------------------------------------------------------------------------------------------------------------------
# geometry kernels
# --------------------------------------------------------------------------------------------------------------------------


def aabb_pairs(lo_a, hi_a, lo_b=None, hi_b=None, cell: float | None = None):
    """Index pairs ``(i, j)`` of overlapping closed boxes A[i], B[j] (uniform-grid broad phase, exact box test after). With B
    omitted the pairs are taken within A with ``i < j``. Boxes are (k,3) min/max corners in metres. Returns two int64 arrays,
    sorted by (i, j).

    Two boxes that share grid cells share a block of them; the candidate pair is kept only in the block's first cell (per axis the
    larger of the two first cells), so no pair needs a dedupe pass, and within A only the cell entries i < j are generated (I4:
    the earlier ``np.unique`` of every candidate pair was 60 % of the time of this function; output identical, checked on random
    boxes and on every pose of D01 and FL; S7 scoring of D01 about 1.6 x faster here)."""
    same = lo_b is None
    if same:
        lo_b, hi_b = lo_a, hi_a
    na, nb = len(lo_a), len(lo_b)
    if na == 0 or nb == 0:
        return np.zeros(0, np.int64), np.zeros(0, np.int64)
    origin = np.minimum(lo_a.min(0), lo_b.min(0))
    ext = np.concatenate([(hi_a - lo_a).max(1), (hi_b - lo_b).max(1)])
    if cell is None:
        cell = float(np.percentile(ext, 90))
    cell = max(cell, 1e-9)

    def expand(lo, hi):
        i0 = np.floor((lo - origin) / cell).astype(np.int64)
        i1 = np.floor((hi - origin) / cell).astype(np.int64)
        span = i1 - i0 + 1
        cnt = span.prod(1)
        idx = np.repeat(np.arange(len(lo), dtype=np.int64), cnt)
        k = np.arange(int(cnt.sum()), dtype=np.int64) - np.repeat(np.cumsum(cnt) - cnt, cnt)
        sx, sy = span[idx, 0], span[idx, 1]
        cx = i0[idx, 0] + k % sx
        cy = i0[idx, 1] + (k // sx) % sy
        cz = i0[idx, 2] + k // (sx * sy)
        return cx, cy, cz, idx, i0

    def runs(k):  # == np.unique(k, return_index=True, return_counts=True) for a sorted k
        st = np.flatnonzero(np.concatenate([[True], k[1:] != k[:-1]]))
        return k[st], st, np.diff(np.concatenate([st, [len(k)]]))

    ax, ay, az, ia, i0a = expand(lo_a, hi_a)
    if same:
        bx, by, bz, ib, i0b = ax, ay, az, ia, i0a
    else:
        bx, by, bz, ib, i0b = expand(lo_b, hi_b)
    dy = int(max(ay.max(), by.max())) + 1
    dz = int(max(az.max(), bz.max())) + 1
    ka = (ax * dy + ay) * dz + az
    kb = ka if same else (bx * dy + by) * dz + bz
    oa = np.argsort(ka, kind="stable")  # stable: inside a cell the box ids stay ascending
    ka, ia = ka[oa], ia[oa]
    if same:
        kb, ib = ka, ia
    else:
        ob = np.argsort(kb, kind="stable")
        kb, ib = kb[ob], ib[ob]
    ua, sa, ca = runs(ka)
    ub, sb, cb = (ua, sa, ca) if same else runs(kb)
    cells, xa, xb = np.intersect1d(ua, ub, assume_unique=True, return_indices=True)
    na_, nb_, sa_, sb_ = ca[xa], cb[xb], sa[xa], sb[xb]
    if same:  # entries s < t of each cell (ascending ids, so i < j): one row per s, then its t
        nr = np.maximum(na_ - 1, 0)
        if nr.sum() == 0:
            return np.zeros(0, np.int64), np.zeros(0, np.int64)
        rg = np.repeat(np.arange(len(nr)), nr)
        s = np.arange(int(nr.sum()), dtype=np.int64) - np.repeat(np.cumsum(nr) - nr, nr)
        rl = na_[rg] - 1 - s
        rr = np.repeat(np.arange(len(rl)), rl)
        g = rg[rr]
        s_ = s[rr]
        t_ = s_ + 1 + np.arange(int(rl.sum()), dtype=np.int64) - np.repeat(np.cumsum(rl) - rl, rl)
        pa, pb = ia[sa_[g] + s_], ia[sa_[g] + t_]
    else:
        rep = na_ * nb_
        if rep.sum() == 0:
            return np.zeros(0, np.int64), np.zeros(0, np.int64)
        g = np.repeat(np.arange(len(rep)), rep)
        t = np.arange(int(rep.sum()), dtype=np.int64) - np.repeat(np.cumsum(rep) - rep, rep)
        pa = ia[sa_[g] + t // nb_[g]]
        pb = ib[sb_[g] + t % nb_[g]]
    r = np.maximum(i0a[pa], i0b[pb])  # the first cell the two boxes share
    keep = cells[g] == (r[:, 0] * dy + r[:, 1]) * dz + r[:, 2]
    key = np.sort(pa[keep] * nb + pb[keep])
    pa, pb = key // nb, key % nb
    ov = np.all(lo_a[pa] <= hi_b[pb], axis=1) & np.all(lo_b[pb] <= hi_a[pa], axis=1)
    return pa[ov], pb[ov]


def _orient(a, b, c, d):
    """det(b-a, c-a, d-a) per row: > 0 when d is on the side of the normal (b-a) x (c-a)."""
    return np.einsum("ij,ij->i", np.cross(b - a, c - a), d - a)


def _seg_cross_tri(p, q, a, b, c):
    """Closed segment pq crosses closed triangle abc (rows are pairs). A segment lying in the triangle's plane returns False."""
    sp, sq = _orient(a, b, c, p), _orient(a, b, c, q)
    plane = (sp * sq <= 0.0) & ~((sp == 0.0) & (sq == 0.0))
    o1, o2, o3 = _orient(p, q, a, b), _orient(p, q, b, c), _orient(p, q, c, a)
    inside = ((o1 >= 0) & (o2 >= 0) & (o3 >= 0)) | ((o1 <= 0) & (o2 <= 0) & (o3 <= 0))
    return plane & inside


def tri_tri_intersect(A, B, chunk: int = 200_000) -> np.ndarray:
    """Exact intersection test of triangle pairs ``A[i]`` / ``B[i]`` ((k,3,3) float64). Two non-coplanar triangles intersect iff an
    edge of one crosses the other. Touching counts as intersecting; coplanar pairs return False (not counted, documented)."""
    A = np.asarray(A, dtype=np.float64)
    B = np.asarray(B, dtype=np.float64)
    out = np.zeros(len(A), dtype=bool)
    for s in range(0, len(A), chunk):
        a, b = A[s:s + chunk], B[s:s + chunk]
        na = np.cross(a[:, 1] - a[:, 0], a[:, 2] - a[:, 0])
        nb = np.cross(b[:, 1] - b[:, 0], b[:, 2] - b[:, 0])
        db = np.einsum("ikj,ij->ik", b - a[:, :1], na)  # B's vertices against A's plane
        da = np.einsum("ikj,ij->ik", a - b[:, :1], nb)
        sep = (db > 0).all(1) | (db < 0).all(1) | (da > 0).all(1) | (da < 0).all(1)
        cand = np.nonzero(~sep)[0]
        if cand.size == 0:
            continue
        a, b = a[cand], b[cand]
        hit = np.zeros(len(cand), dtype=bool)
        for (t1, t2) in ((a, b), (b, a)):
            for i, j in ((0, 1), (1, 2), (2, 0)):
                todo = ~hit
                if not todo.any():
                    break
                hit[todo] |= _seg_cross_tri(t1[todo, i], t1[todo, j], t2[todo, 0], t2[todo, 1], t2[todo, 2])
        out[s + cand] = hit
    return out


def intersecting_pairs(P, Fa, Fb=None, exclude_shared: bool = True):
    """Intersecting face pairs between face lists ``Fa`` and ``Fb`` (or within ``Fa`` when Fb is None, i < j) over positions ``P``.
    Pairs sharing a vertex id are skipped when ``exclude_shared``. Returns (ia, ib) int64 indices into Fa / Fb."""
    Ta = P[Fa]
    lo_a, hi_a = Ta.min(1), Ta.max(1)
    if Fb is None:
        ia, ib = aabb_pairs(lo_a, hi_a)
        Fb_, Tb = Fa, Ta
    else:
        Tb = P[Fb]
        ia, ib = aabb_pairs(lo_a, hi_a, Tb.min(1), Tb.max(1))
        Fb_ = Fb
    if exclude_shared and ia.size:
        shared = (Fa[ia][:, :, None] == Fb_[ib][:, None, :]).any(axis=(1, 2))
        ia, ib = ia[~shared], ib[~shared]
    if ia.size == 0:
        return ia, ib
    hit = tri_tri_intersect(Ta[ia], Tb[ib])
    return ia[hit], ib[hit]


def winding_inside(P, F, Q, exact_limit: float = 2e8) -> np.ndarray:
    """Generalized winding number of the surface (P, F) at the points Q; inside = w > 0.5. Exact (igl.winding_number) while
    queries x faces <= ``exact_limit``, else igl.fast_winding_number (exact near the surface, approximate far away)."""
    Q = _f64(Q).reshape(-1, 3)
    if len(Q) == 0 or len(F) == 0:
        return np.zeros(len(Q))
    if len(Q) * len(F) <= exact_limit:
        return np.asarray(igl.winding_number(_f64(P), _i64(F), Q), dtype=np.float64).reshape(-1)
    return np.asarray(igl.fast_winding_number(_f64(P), _i64(F), Q), dtype=np.float64).reshape(-1)


def surface_distance(P, F, Q):
    """Unsigned distance (m) from points Q to the faces F over P, plus the index of the nearest face (into F)."""
    Q = _f64(Q).reshape(-1, 3)
    if len(Q) == 0 or len(F) == 0:
        return np.zeros(len(Q)), np.zeros(len(Q), dtype=np.int64)
    d2, idx, _ = igl.point_mesh_squared_distance(Q, _f64(P), _i64(F))
    return np.sqrt(np.maximum(np.asarray(d2, dtype=np.float64), 0.0)).reshape(-1), np.asarray(idx, dtype=np.int64).reshape(-1)


def slice_area(P, F, center, normal) -> float | None:
    """Area (m^2) enclosed by the cut of the oriented face set F with the plane (center, normal), by Green's theorem over the
    slice segments oriented by (plane normal x face normal). None when the plane misses the faces."""
    n = np.asarray(normal, dtype=np.float64)
    n = n / max(np.linalg.norm(n), 1e-30)
    c = np.asarray(center, dtype=np.float64)
    T = P[F] - c  # (m,3,3) relative to the center
    d = T @ n  # signed distances (m,3)
    sgn = d > 0
    cross_f = sgn.any(1) & ~sgn.all(1)
    if not cross_f.any():
        return None
    T, d = T[cross_f], d[cross_f]
    pts = []
    for i, j in ((0, 1), (1, 2), (2, 0)):
        di, dj = d[:, i], d[:, j]
        m = (di > 0) != (dj > 0)
        t = np.where(m, di / np.where(m, di - dj, 1.0), 0.0)
        pts.append((m, T[:, i] + t[:, None] * (T[:, j] - T[:, i])))
    # every crossing face has exactly two crossing edges
    ms = np.stack([p[0] for p in pts], 1)
    xs = np.stack([p[1] for p in pts], 1)
    first = np.argmax(ms, axis=1)
    last = 2 - np.argmax(ms[:, ::-1], axis=1)
    rows = np.arange(len(T))
    p0, p1 = xs[rows, first], xs[rows, last]
    nf = np.cross(T[:, 1] - T[:, 0], T[:, 2] - T[:, 0])
    flip = np.einsum("ij,ij->i", p1 - p0, np.cross(n, nf)) < 0
    p0, p1 = np.where(flip[:, None], p1, p0), np.where(flip[:, None], p0, p1)
    return float(abs(0.5 * np.einsum("ij,j->i", np.cross(p0, p1), n).sum()))


def lbs(V_rest, W, bone_idx, pose_mats, rest_mats) -> np.ndarray:
    """Linear blend skinning (three.js / Blender Armature without Preserve Volume): positions (p,n,3) from world rest positions
    ``V_rest`` (n,3), weights ``W`` (n,k) whose column c drives bone ``bone_idx[c]`` of ``pose_mats`` (p,b,4,4) / ``rest_mats``
    (b,4,4). Rows of W must already follow the exporter rule (top 4, normalized); empty rows stay at rest."""
    W = np.asarray(W, dtype=np.float64)
    k = min(EXPORT_MAX_INFLUENCES, W.shape[1])
    order = np.argsort(-W, axis=1, kind="stable")[:, :k]
    w = np.take_along_axis(W, order, axis=1)
    bi = np.asarray(bone_idx, dtype=np.int64)[order]
    S = pose_mats @ np.linalg.inv(rest_mats)[None]  # (p,b,4,4) skinning matrices
    Vh = np.concatenate([V_rest, np.ones((len(V_rest), 1))], axis=1)
    empty = w.sum(1) <= 0
    out = np.empty((len(pose_mats), len(V_rest), 3))
    for p in range(len(pose_mats)):
        acc = np.zeros((len(V_rest), 3))
        for j in range(k):
            M = S[p][bi[:, j]]  # (n,4,4)
            acc += w[:, j:j + 1] * np.einsum("nij,nj->ni", M[:, :3, :], Vh)
        acc[empty] = V_rest[empty]
        out[p] = acc
    return out


# --------------------------------------------------------------------------------------------------------------------------
# thresholds
# --------------------------------------------------------------------------------------------------------------------------


def load_thresholds(path=DEFAULT_THRESHOLDS) -> dict:
    """{row id: row} of thresholds.json: ``rows`` (the RIG_SKILL_WORKFLOW.md §4 copy) + ``garment_rows`` (phase G)."""
    with open(path, "rb") as f:
        doc = json.loads(f.read().decode("utf-8"))
    return {r["id"]: r for r in doc["rows"] + doc.get("garment_rows", [])}


class Params:
    """Numbers of the metrics in metres for one H, read from thresholds.json rows (fallbacks = the module constants)."""

    def __init__(self, th: dict, H: float, ball_factor: float | None = None):
        def row(k):
            return th.get(k, {})

        band = row("deform_edge_ratio").get("green") or [0.8, 1.25]
        self.ln_green = math.log(float(band[1]))
        self.ln_red = math.log(float((row("deform_edge_ratio").get("red") or [None, 1.5])[1]))
        ts = row("deform_torn_edges_standard")
        self.torn_ratio = float(ts.get("torn_ratio", 1.5))
        self.torn_growth = float(ts.get("torn_growth_rel_H", 0.002)) * H
        self.torn_extreme_red = float((row("deform_torn_edges_extreme").get("red") or [None, 0.005])[1])
        ar = row("deform_area_change")
        self.area_band = float(ar.get("band", 0.15))
        self.ln_area = math.log(1.0 + self.area_band)
        self.sliver_deg = float(ar.get("sliver_min_angle_deg", 10.0))
        jv = row("deform_joint_volume")
        self.volume_min = float((jv.get("green") or [0.85])[0])
        self.ball_factor = float(ball_factor if ball_factor is not None else jv.get("ball_factor", BALL_FACTOR))
        # half of what a centred limb-sized cylinder (radius = limb radius) fills of the ball: 1 for f <= 1, 1 - (1 - 1/f^2)^1.5 above
        f = self.ball_factor
        full = 1.0 if f <= 1.0 else 1.0 - (1.0 - 1.0 / (f * f)) ** 1.5
        self.ball_min_rest = float(jv.get("min_rest_occupancy", BALL_MIN_REST)) * full
        cw = row("deform_candy_wrapper")
        self.candy_t = tuple(float(t) for t in cw.get("slices", CANDY_T))
        self.pen_eps = float(row("deform_penetration_standard").get("eps_rel_H", 0.0005)) * H
        self.slide_radius = float(row("deform_penetration_standard").get("slide_radius_rel_H", 0.02)) * H
        self.pen_tier = float((row("deform_penetration_extreme_depth").get("red") or [None, 0.005])[1]) * H
        self.heads_band = float((row("joint_core_heads_inside").get("red") or [None, 0.002])[1]) * H
        self.seam_tol = float(row("deform_seam_crack").get("tolerance", 1e-6))
        rs = row("skin_region_score")
        self.not_exercised_deg = float(rs.get("not_exercised_deg", NOT_EXERCISED_DEG))
        self.tear_tie_rel = float(rs.get("tear_tie_rel", TEAR_TIE_REL))
        self.tear_tie_abs = float(rs.get("tear_tie_abs_units", TEAR_TIE_ABS_UNITS))  # units of TEAR_UNIT_H x H
        self.near_tie = float(rs.get("near_tie", NEAR_TIE))
        self.soft_floor = float(rs.get("soft_floor", SOFT_FLOOR))
        lk = row("weights_limb_leak")
        self.leak_band = float((lk.get("green") or [None, LEAK_BAND])[1])
        self.leak_params = {k: float(lk.get(k, v)) for k, v in skin_common.LEAK_PARAMS.items()}
        gate = lk.get("gate_regions", LEAK_GATE_REGIONS)
        self.leak_gate_regions = sorted({g.replace("{S}", s) for g in gate for s in ("L", "R")})
        self.H = H

    def as_dict(self):
        return {k: v for k, v in vars(self).items()}


# --------------------------------------------------------------------------------------------------------------------------
# context: topology, regions, joints
# --------------------------------------------------------------------------------------------------------------------------


class Context:
    """Static data of one asset: welded topology, regions, adjacency, per-region edge/face masks, joint balls, soles. Positions are
    per original vertex (n,3) and converted with ``welded()``."""

    def __init__(self, mesh: dict, poses: dict, weights: dict, region_map: dict | None = None, regions: dict | None = None,
                 exempt_regions=(), exempt_heads=(), th: dict | None = None, ball_factor: float | None = None, garment_rows=None):
        self.meta = dict(mesh["meta"])
        self.H = float(self.meta.get("H") or poses["meta"].get("H") or 0.0)
        if not self.H > 0:
            raise ValueError("H (catalogue height) is missing from mesh meta and poses meta")
        self.th = th if th is not None else load_thresholds()
        self.pr = Params(self.th, self.H, ball_factor)
        self.asset_id = str(self.meta.get("asset_id") or poses["meta"].get("asset_id") or "asset")
        self.F = np.asarray(mesh["F"], dtype=np.int64)
        self.weld = np.asarray(mesh["weld"], dtype=np.int64)
        self.n = len(self.weld)
        if poses["P"].shape[1] != self.n or weights["W"].shape[0] != self.n:
            raise ValueError(f"vertex counts differ: mesh {self.n}, poses {poses['P'].shape[1]}, weights {weights['W'].shape[0]}")
        self.n_w = int(self.weld.max()) + 1
        first = np.full(self.n_w, -1, np.int64)
        idx = np.arange(self.n)[::-1]
        first[self.weld[idx]] = idx
        self.first = first
        Fw = self.weld[self.F]
        self.face_ok = (Fw[:, 0] != Fw[:, 1]) & (Fw[:, 1] != Fw[:, 2]) & (Fw[:, 2] != Fw[:, 0])
        self.face_ids = np.nonzero(self.face_ok)[0]  # welded faces keep the original face index
        self.Fw = Fw[self.face_ok]
        self.edges = rmesh.unique_edges(self.Fw).astype(np.int64)
        self.n_islands, lab = rmesh.connected_components(self.n_w, self.edges)
        self.island_w = lab.astype(np.int64)
        self.face_island = self.island_w[self.Fw[:, 0]]
        groups = rmesh.seam_groups(self.weld)
        self.seam_v = np.concatenate(groups).astype(np.int64) if groups else np.zeros(0, np.int64)
        self.seam_first = np.concatenate([np.full(len(g), g[0]) for g in groups]).astype(np.int64) if groups else self.seam_v

        # pose bookkeeping
        self.pose_names = [str(x) for x in poses["names"]]
        pm = poses["meta"]
        self.tags = {k: list(v) for k, v in (pm.get("tags") or {}).items()}
        ri = pm.get("rest_index")
        if ri is None and "rest" in self.pose_names:
            ri = self.pose_names.index("rest")
        self.rest_index = ri
        self.rest = np.asarray(poses["P"][ri], dtype=np.float64) if ri is not None else np.asarray(mesh["V"], dtype=np.float64)
        self.rest_w = self.rest[self.first]
        self.bone_names = [str(b) for b in poses["bone_names"]]
        ex = poses["extra"]
        self.parents = np.asarray(ex["parents"], dtype=np.int64) if "parents" in ex else None
        self.deform = np.asarray(ex["deform"], dtype=bool) if "deform" in ex else None
        self.pose_mats = np.asarray(ex["pose_mats"], dtype=np.float64) if "pose_mats" in ex else None
        self.rest_mats = np.asarray(ex["rest_mats"], dtype=np.float64) if "rest_mats" in ex else None
        self.pose_heads = np.asarray(poses["heads"], dtype=np.float64)  # (p,b,3) world; the same for every weight candidate
        self.pose_tails = np.asarray(poses["tails"], dtype=np.float64)
        self.rest_heads = self.pose_heads[ri] if ri is not None else None
        self.rest_tails = self.pose_tails[ri] if ri is not None else None

        # weights / regions
        self.w_bones = [str(b) for b in weights["bones"]]
        self.W = np.asarray(weights["W"], dtype=np.float64)
        self.region_map = self._region_map(region_map)
        self._build_regions(regions)
        self._garment_region(garment_rows)
        self.exempt_regions = sorted(set(exempt_regions) & set(self.region_names))
        self.exempt_heads = sorted(set(exempt_heads))
        self._build_adjacency()
        self.face_region = self._face_regions()
        # edges / faces used by the metrics, and their region masks (an edge / face counts for every region it touches)
        L0 = np.linalg.norm(self.rest_w[self.edges[:, 0]] - self.rest_w[self.edges[:, 1]], axis=1)
        self.edge_ok = L0 > 2e-5 * self.H
        self.e = self.edges[self.edge_ok]
        self.L0 = L0[self.edge_ok]
        self.area0 = tri_areas(self.rest_w, self.Fw)
        self.face_area_ok = self.area0 > (1e-5 * self.H) ** 2
        self.nonsliver = self.face_area_ok & (tri_min_angles(self.rest_w, self.Fw) >= self.pr.sliver_deg)
        R = len(self.region_names)
        ra, rb = self.region_of[self.e[:, 0]], self.region_of[self.e[:, 1]]
        self.em = np.stack([(ra == r) | (rb == r) for r in range(R)]) if R else np.zeros((0, len(self.e)), bool)
        fr = self.region_of[self.Fw]
        self.fm = np.stack([(fr == r).any(1) for r in range(R)]) if R else np.zeros((0, len(self.Fw)), bool)
        self.soles = self._build_soles()
        self.twist = self._build_twist()
        self.ball_unit = ball_lattice()
        self.joints = self._build_joints()
        self.region_turn, self.region_joints, self.exercise_note = self._build_exercise()
        self._rest_pairs = None
        self._tfaces, self._rest_in, self._rest_ovl = {}, {}, {}
        self._csr, self._tverts = None, {}
        self._tcap, self._rest_surf = {}, {}

    # ---------------------------------------------------------------- regions
    def _region_map(self, given):
        names = set(self.w_bones) | set(self.bone_names)
        m = {}
        for b in names:
            if b.endswith("_twist") and b[: -len("_twist")] in names:
                m[b] = b[: -len("_twist")]
            else:
                m[b] = b
        if given:
            m.update({str(k): str(v) for k, v in given.items()})
        return m

    def _build_regions(self, regions):
        if regions:
            self.region_names = list(regions.keys())
            masks = np.stack([np.asarray(regions[k], dtype=bool) for k in self.region_names])
            if masks.shape[1] != self.n_w:
                raise ValueError(f"regions.npz masks have {masks.shape[1]} welded ids, mesh has {self.n_w}")
            self.region_of = np.full(self.n_w, -1, np.int64)
            for i in range(len(self.region_names)):  # first region wins where masks overlap
                self.region_of[(self.region_of < 0) & masks[i]] = i
            if (self.region_of < 0).any():
                self.region_names.append(UNWEIGHTED)
                self.region_of[self.region_of < 0] = len(self.region_names) - 1
            self.region_source = "regions.npz"
        else:
            reg_of_bone = [self.region_map.get(b, b) for b in self.w_bones]
            names = []
            for r in reg_of_bone:
                if r not in names:
                    names.append(r)
            Ww = self.W[self.first]
            dom = np.argmax(Ww, axis=1)
            empty = Ww.max(1) <= 0
            self.region_names = names + ([UNWEIGHTED] if empty.any() else [])
            col_region = np.array([names.index(r) for r in reg_of_bone], dtype=np.int64)
            self.region_of = col_region[dom]
            if empty.any():
                self.region_of[empty] = len(self.region_names) - 1
            self.region_source = "dominant bone"
        R = len(self.region_names)
        # region weight matrix (n_w, R): bone weights summed per region (explicit regions: one-hot)
        if self.region_source == "dominant bone":
            Wr = np.zeros((self.n_w, R))
            Ww = self.W[self.first]
            for c, b in enumerate(self.w_bones):
                Wr[:, self.region_names.index(self.region_map.get(b, b))] += Ww[:, c]
            if UNWEIGHTED in self.region_names:
                Wr[Ww.max(1) <= 0, self.region_names.index(UNWEIGHTED)] = 1.0
        else:
            Wr = np.zeros((self.n_w, R))
            Wr[np.arange(self.n_w), self.region_of] = 1.0
        self.Wr = Wr
        self.masks = np.stack([self.region_of == i for i in range(R)])

    def _garment_region(self, garment_rows):
        """Phase G (S7 scoring pass, ``--garment-rows``): the welded rows of garment pieces (garments.npz ``piece >= 0``) leave their
        dominant-bone region for one region ``GARMENT_REGION``, which gets no region score, decision or exercise test: the body
        candidates are chosen on body rows only, because the garment overlay replaces their values on garment rows. Without the
        option nothing changes."""
        self.garment_rows = None
        if garment_rows is None:
            return
        m = np.asarray(garment_rows, dtype=bool)
        if m.shape != (self.n_w,):
            raise ValueError(f"garment rows: {m.shape} values, the mesh has {self.n_w} welded ids")
        self.garment_rows = m
        if not m.any():
            return
        self.region_names.append(GARMENT_REGION)
        gi = len(self.region_names) - 1
        self.region_of[m] = gi
        Wr = np.zeros((self.n_w, len(self.region_names)))
        Wr[:, :gi] = self.Wr
        Wr[m] = 0.0
        Wr[m, gi] = 1.0
        self.Wr = Wr  # a bone region left without rows stays listed, like a bone that dominates no row in the plain path
        self.masks = np.stack([self.region_of == i for i in range(len(self.region_names))])

    def regions_npz(self, path):
        meta = {"schema": SCHEMA, "asset_id": self.asset_id, "source": self.region_source, "n_welded": self.n_w,
                "region_map": self.region_map, "note": "masks over welded ids (rigcore.mesh.weld_map order)"}
        return save_npz(path, {"names": np.array(self.region_names), "masks": self.masks,
                               "meta": np.array(json.dumps(meta, sort_keys=True))})

    def _build_adjacency(self):
        """Region adjacency = the skeleton (parent region, walking up through bones whose region is absent or EMPTY, e.g. a neck
        bone that dominates no vertex) OR the regions share a welded edge at rest (neighbouring skin: their contact is a crease,
        measured by stretch and volume, not a penetration). ``region_parent`` keeps the skeleton parent of non-empty regions."""
        R = len(self.region_names)
        adj = np.eye(R, dtype=bool)
        self.region_parent = {}
        sizes = self.masks.sum(1)
        ridx = {r: i for i, r in enumerate(self.region_names)}
        if self.parents is not None:
            for bi, b in enumerate(self.bone_names):
                rb = self.region_map.get(b)
                if rb not in ridx or sizes[ridx[rb]] == 0:
                    continue
                p = self.parents[bi]
                while p >= 0 and (self.region_map.get(self.bone_names[p]) not in ridx
                                  or sizes[ridx[self.region_map[self.bone_names[p]]]] == 0):
                    p = self.parents[p]
                if p < 0:
                    continue
                rp = self.region_map[self.bone_names[p]]
                if rp == rb:
                    continue
                adj[ridx[rb], ridx[rp]] = adj[ridx[rp], ridx[rb]] = True
                self.region_parent.setdefault(rb, rp)
        ra, rb_ = self.region_of[self.edges[:, 0]], self.region_of[self.edges[:, 1]]
        touch = ra != rb_
        adj[ra[touch], rb_[touch]] = True
        adj[rb_[touch], ra[touch]] = True
        self.adjacent = adj

    def _face_regions(self):
        mean = (self.Wr[self.Fw[:, 0]] + self.Wr[self.Fw[:, 1]] + self.Wr[self.Fw[:, 2]]) / 3.0
        return np.argmax(mean, axis=1).astype(np.int64)

    # ---------------------------------------------------------------- joints, soles, twist
    def _bone_len(self, bone):
        if self.rest_heads is None or bone not in self.bone_names:
            return None
        i = self.bone_names.index(bone)
        return float(np.linalg.norm(self.rest_tails[i] - self.rest_heads[i]))

    def _build_joints(self):
        """Ball-occupancy joints (see the module docstring): every child region with a parent region gets an entry; entries that
        cannot be measured carry ``measurable`` False and the reason."""
        out = {}
        ridx = {r: i for i, r in enumerate(self.region_names)}
        for child, parent in self.region_parent.items():
            b = base_name(child)
            label = JOINT_LABELS.get(b, b)
            s = side_of(child)
            key = f"{label}_{s}" if s else label
            ent = {"child": child, "parent": parent, "label": label, "side": s, "measurable": False, "reason": None,
                   "ball_factor": self.pr.ball_factor}
            out[key] = ent
            if self.rest_heads is None:
                ent["reason"] = "poses.npz has no rest pose"
                continue
            if child not in self.bone_names or parent not in self.bone_names:
                ent["reason"] = "child or parent region is not a bone"
                continue
            lc = self._bone_len(child)
            if not lc:
                ent["reason"] = "zero child bone length"
                continue
            ci = self.bone_names.index(child)
            center = self.rest_heads[ci]
            axis = (self.rest_tails[ci] - center) / lc
            d = self.rest_w - center
            near_c = (self.Wr[:, ridx[child]] >= 0.5) & (np.linalg.norm(d, axis=1) <= 0.6 * lc)
            if near_c.sum() < 8:
                ent["reason"] = f"only {int(near_c.sum())} child-region vertices within 0.6 x bone length: limb radius undefined"
                continue
            r_limb = float(np.median(np.linalg.norm(d[near_c] - np.outer(d[near_c] @ axis, axis), axis=1)))
            radius = min(self.pr.ball_factor * r_limb, 0.6 * lc)
            island = int(np.bincount(self.island_w[self.region_of == ridx[child]], minlength=self.n_islands).argmax())
            Fi = self.Fw[self.face_island == island]
            occ0 = float((winding_inside(self.rest_w, Fi, center + radius * self.ball_unit) > 0.5).mean())
            ent.update({"bone_index": ci, "radius": radius, "r_limb": r_limb, "island": island, "faces": Fi, "rest_occupancy": occ0,
                        "n_points": int(len(self.ball_unit))})
            if occ0 < self.pr.ball_min_rest:
                ent["reason"] = (f"rest occupancy {occ0:.3f} < {self.pr.ball_min_rest:.3f}: the joint centre is not inside the limb "
                                 "(check the joint position)")
                continue
            ent["measurable"] = True
        return out

    def _build_exercise(self):
        """Joint exercise (module docstring): ((p, R) largest joint rotation in deg per pose and region, {region: [joint names]},
        None) or (None, {}, reason) without pose_mats / rest_mats / parents."""
        if self.pose_mats is None or self.rest_mats is None or self.parents is None:
            return None, {}, "poses.npz has no pose_mats / rest_mats / parents: not measured (every region counts as exercised)"
        bidx = {b: i for i, b in enumerate(self.bone_names)}
        weighted = np.zeros(len(self.bone_names), bool)
        carried = self.W.max(0) > EXPORT_MIN_WEIGHT
        for c, b in enumerate(self.w_bones):
            if carried[c] and b in bidx:
                weighted[bidx[b]] = True
        S = self.pose_mats[:, :, :3, :3] @ np.linalg.inv(self.rest_mats[:, :3, :3])[None]  # (p,b,3,3) skinning rotations
        ridx = {r: i for i, r in enumerate(self.region_names)}
        turn = np.zeros((len(S), len(self.region_names)))
        joints = {}
        for bi in np.nonzero(weighted)[0]:
            p = int(self.parents[bi])
            while p >= 0 and not weighted[p]:  # walk over bones without weight (D01: cog between root and pelvis)
                p = int(self.parents[p])
            if p < 0:
                continue
            rel = np.linalg.inv(S[:, p]) @ S[:, bi]
            ang = np.degrees(np.arccos(np.clip((np.trace(rel, axis1=1, axis2=2) - 1.0) / 2.0, -1.0, 1.0)))
            for b in (self.bone_names[bi], self.bone_names[p]):
                r = self.region_map.get(b, b)
                if r in ridx:
                    turn[:, ridx[r]] = np.maximum(turn[:, ridx[r]], ang)
                    joints.setdefault(r, []).append(f"{self.bone_names[bi]}/{self.bone_names[p]}")
        return turn, joints, None

    def _build_soles(self):
        out = {}
        for s in SIDES:
            cols = [c for c, b in enumerate(self.w_bones) if side_of(b) == s and base_name(b) in ("Foot", "Toe")]
            if cols:
                out[s] = np.nonzero((self.W[:, cols] > 0.5).any(1))[0]
        return out

    def _build_twist(self):
        """Per side: forearm twist bones of the armature and whether they carry weight (> 0.01 on at least 8 vertices)."""
        out = {}
        for s in SIDES:
            bones = [b for b in self.bone_names if side_of(b) == s and base_name(b) == "ForeArm_twist"]
            cols = [self.w_bones.index(b) for b in bones if b in self.w_bones]
            weighted = bool(cols) and int((self.W[:, cols] > 0.01).any(1).sum()) >= 8
            note = None if weighted else ("no twist bones" if not bones else "twist bones carry no weight")
            out[s] = {"bones": bones, "weighted": weighted, "note": note}
        return out

    # ---------------------------------------------------------------- helpers
    def welded(self, P):
        return np.asarray(P, dtype=np.float64)[self.first]

    def tagged(self, pose, tag):
        return tag in self.tags.get(pose, [])

    def eligible_pairs(self, fa, fb):
        """Pairs that may count as penetrations: different islands, or non-adjacent regions."""
        diff_island = self.face_island[fa] != self.face_island[fb]
        nonadj = ~self.adjacent[self.face_region[fa], self.face_region[fb]]
        return diff_island | nonadj

    def skin_rotation(self, pi, bi):
        """3x3 rotation of bone ``bi``'s skinning matrix in pose ``pi`` (identity without pose_mats)."""
        if self.pose_mats is None or self.rest_mats is None:
            return np.eye(3)
        S = self.pose_mats[pi, bi] @ np.linalg.inv(self.rest_mats[bi])
        return S[:3, :3]

    def limb_leak(self, W, names) -> dict:
        """``weights_limb_leak`` (module docstring) of weights ``W`` (n,k) over the columns ``names``: exporter-rule weights of the
        welded rows at their rest positions, rest segments of the columns, rows per region (``region_names``). Returns the
        ``skin_common.limb_leak`` dict (+ ``mask`` over welded ids), or {"measured": False, "reason"} without a rest pose or when a
        column is not a bone of poses.npz."""
        names = [str(b) for b in names]
        if self.rest_heads is None:
            return {"measured": False, "reason": "poses.npz has no rest pose (bone segments at rest)"}
        missing = [b for b in names if b not in self.bone_names]
        if missing:
            return {"measured": False, "reason": f"weight columns without a bone in poses.npz: {missing}"}
        bi = [self.bone_names.index(b) for b in names]
        par = None
        if self.parents is not None:
            par = {b: (self.bone_names[int(p)] if p >= 0 else None) for b, p in zip(self.bone_names, self.parents)}
        Ww = exporter_rule(W).astype(np.float64)[self.first]
        out = skin_common.limb_leak(self.rest_w, Ww, names, self.rest_heads[bi], self.rest_tails[bi], par,
                                    regions={r: self.masks[i] for i, r in enumerate(self.region_names)}, with_mask=True,
                                    **self.pr.leak_params)
        out["measured"] = True
        return out


# --------------------------------------------------------------------------------------------------------------------------
# penetrations
# --------------------------------------------------------------------------------------------------------------------------


def penetration_pairs(cx: Context, Pw):
    """Eligible intersecting welded-face pairs at positions Pw (n_w,3): int64 keys ``i * m + j`` (i < j) and the index arrays."""
    ia, ib = intersecting_pairs(Pw, cx.Fw)
    if ia.size:
        keep = cx.eligible_pairs(ia, ib)
        ia, ib = ia[keep], ib[keep]
    m = len(cx.Fw)
    return ia * m + ib, ia, ib


def _rest_pairs(cx: Context):
    if cx._rest_pairs is None:
        keys, ia, ib = penetration_pairs(cx, cx.rest_w)
        cx._rest_pairs = (np.sort(keys), ia, ib)
    return cx._rest_pairs


def _target_key(cx: Context, f, g):
    """Surface that face ``f``'s vertices are tested against for the pair (f, g): g's island, or (same island) that island without
    f's region and its adjacent regions."""
    isl_f, isl_g = int(cx.face_island[f]), int(cx.face_island[g])
    return ("island", isl_g, -1) if isl_f != isl_g else ("cut", isl_g, int(cx.face_region[f]))


def _target_faces(cx: Context, tkey):
    """The real (welded) faces of target surface ``tkey`` (cached; open where faces were cut away)."""
    Ft = cx._tfaces.get(tkey)
    if Ft is None:
        kind, isl, reg = tkey
        sel = cx.face_island == isl
        if kind == "cut":
            sel &= ~cx.adjacent[reg][cx.face_region]
        Ft = cx.Fw[sel]
        cx._tfaces[tkey] = Ft
    return Ft


def _target_caps(cx: Context, tkey):
    """Boundary of target ``tkey`` (cached): directed boundary edges (k,2) in the direction they run in their face, the boundary
    component of each edge, and the welded vertices of each component."""
    cap = cx._tcap.get(tkey)
    if cap is None:
        Ft = _target_faces(cx, tkey)
        e = np.concatenate([Ft[:, [0, 1]], Ft[:, [1, 2]], Ft[:, [2, 0]]])
        _, inv, cnt = np.unique(np.sort(e, axis=1), axis=0, return_inverse=True, return_counts=True)
        b = e[cnt[np.asarray(inv).reshape(-1)] == 1]
        if len(b):
            vs, loc = np.unique(b, return_inverse=True)
            loc = np.asarray(loc).reshape(-1, 2)
            n_c, lab = rmesh.connected_components(len(vs), loc)
            lab = np.asarray(lab)
            cap = (b, lab[loc[:, 0]], [vs[lab == k] for k in range(int(n_c))])
        else:
            cap = (b, np.zeros(0, np.int64), [])
        cx._tcap[tkey] = cap
    return cap


def _target_surface(cx: Context, tkey, Pw):
    """CLOSED target surface at welded positions ``Pw``: (V, F) = Pw + one apex per boundary component (the mean of its vertices),
    the target faces + a fan cap per component (cap triangle (b, a, apex) for each boundary edge a -> b, so every edge is used
    once in each direction and the winding number is 0 / 1 away from the surface, also where a cut removed whole regions)."""
    Ft = _target_faces(cx, tkey)
    b, comp, members = _target_caps(cx, tkey)
    if not len(b):
        return Pw, Ft
    apex = np.stack([Pw[m].mean(0) for m in members])
    caps = np.stack([b[:, 1], b[:, 0], len(Pw) + comp], 1)
    return np.concatenate([Pw, apex]), np.concatenate([Ft, caps])


def _rest_surface(cx: Context, tkey):
    s = cx._rest_surf.get(tkey)
    if s is None:
        s = cx._rest_surf[tkey] = _target_surface(cx, tkey, cx.rest_w)
    return s


def _inside_rest(cx: Context, tkey, verts) -> np.ndarray:
    """Winding-number inside test at REST of welded vertices ``verts`` against the closed target surface ``tkey`` (cached)."""
    cache = cx._rest_in.setdefault(tkey, {})
    need = [v for v in verts.tolist() if v not in cache]
    if need:
        V, F = _rest_surface(cx, tkey)
        w = winding_inside(V, F, cx.rest_w[need])
        cache.update(zip(need, (w > 0.5).tolist()))
    return np.array([cache[v] for v in verts.tolist()], dtype=bool)


def _rest_overlap(cx: Context, rf: int, rg: int):
    """Overlap regions ``rf`` (intruder) and ``rg`` already have at rest: (depth m of the deepest rf vertex of a rest pair with an
    rg face that lies inside the corresponding target surface at rest, rest centroids (k,3) of those rf faces). (0, empty) without
    such a pair. Cached."""
    key = (int(rf), int(rg))
    if key in cx._rest_ovl:
        return cx._rest_ovl[key]
    _, ia, ib = _rest_pairs(cx)
    jobs, faces = {}, set()
    for a, b in ((ia, ib), (ib, ia)):
        sel = (cx.face_region[a] == rf) & (cx.face_region[b] == rg)
        for f, g in zip(a[sel].tolist(), b[sel].tolist()):
            jobs.setdefault(_target_key(cx, f, g), set()).update(cx.Fw[f].tolist())
            faces.add(f)
    d0 = 0.0
    for tkey, vs in jobs.items():
        verts = np.array(sorted(vs), dtype=np.int64)
        ins = _inside_rest(cx, tkey, verts)
        if ins.any():
            V, F = _rest_surface(cx, tkey)
            d, _ = surface_distance(V, F, cx.rest_w[verts[ins]])
            d0 = max(d0, float(d.max()))
    cen = cx.rest_w[cx.Fw[sorted(faces)]].mean(1) if faces else np.zeros((0, 3))
    cx._rest_ovl[key] = (d0, cen)
    return cx._rest_ovl[key]


def _slide_allowance(cx: Context, f: int, g: int) -> float:
    """Depth (m) a new pair (intruding face ``f``, other face ``g``) may reach as a SLIDING rest overlap: the rest overlap depth of
    the two regions when f lies (rest positions) within ``slide_radius`` of one of their rest-pair faces, else 0."""
    d0, cen = _rest_overlap(cx, cx.face_region[f], cx.face_region[g])
    if d0 <= 0 or not len(cen):
        return 0.0
    c = cx.rest_w[cx.Fw[f]].mean(0)
    return d0 if float(np.min(np.linalg.norm(cen - c, axis=1))) <= cx.pr.slide_radius else 0.0


def _intrusion_depths(cx: Context, Pw, tkey, Ft, verts, info: dict | None = None, surf=None) -> dict:
    """Newly-inside depth of the intrusions that the vertices ``verts`` (of faces in new pairs) belong to, against target surface
    ``tkey`` (closed by ``_target_surface``; ``Ft`` = its real faces, whose vertices are never crossed; ``surf`` = the closed
    surface at Pw when the caller has it): starting from the vertices of ``verts`` that are inside now and were not at rest,
    flood-fill over the welded edges through vertices that are also newly inside; every connected piece gets the depth of its
    deepest vertex (distance to the closed target surface), so a deep intrusion is not read on the crossing faces only.
    Returns ({vertex of ``verts``: depth of its piece (0 = not newly inside)}, {vertex of ``verts``: members of its piece},
    {member: its own depth}) for this pose only (the last two feed the penetration field). ``info`` (a dict) receives
    ``w`` = {member: winding number} (the margin of the inside test)."""
    if cx._csr is None:
        cx._csr = rmesh.adjacency_csr(cx.n_w, cx.edges)
    ptr, idx = cx._csr
    tmask = cx._tverts.get(tkey)
    if tmask is None:
        tmask = np.zeros(cx.n_w, bool)
        tmask[np.unique(Ft)] = True
        cx._tverts[tkey] = tmask
    V, F = surf if surf is not None else _target_surface(cx, tkey, Pw)
    checked = np.zeros(cx.n_w, bool)
    inside = np.zeros(cx.n_w, bool)
    wv = np.zeros(cx.n_w)
    checked[verts] = True
    w = winding_inside(V, F, Pw[verts])
    wv[verts] = w
    ok = (w > 0.5) & ~_inside_rest(cx, tkey, verts)
    inside[verts[ok]] = True
    frontier = verts[ok]
    while frontier.size:
        nb = np.unique(np.concatenate([idx[ptr[v]:ptr[v + 1]] for v in frontier.tolist()])).astype(np.int64)
        nb = nb[~checked[nb] & ~tmask[nb]]
        if not nb.size:
            break
        checked[nb] = True
        w = winding_inside(V, F, Pw[nb])
        wv[nb] = w
        ok = (w > 0.5) & ~_inside_rest(cx, tkey, nb)
        inside[nb[ok]] = True
        frontier = nb[ok]
    ins = np.nonzero(inside)[0]
    out, piece_of, own = {v: 0.0 for v in verts.tolist()}, {}, {}
    if info is not None:
        info["w"] = {int(v): float(wv[v]) for v in ins.tolist()}
    if not ins.size:
        return out, piece_of, own
    d, _ = surface_distance(V, F, Pw[ins])
    e = cx.edges[inside[cx.edges[:, 0]] & inside[cx.edges[:, 1]]]
    loc = np.full(cx.n_w, -1, np.int64)
    loc[ins] = np.arange(len(ins))
    _, lab = rmesh.connected_components(len(ins), loc[e]) if len(e) else (len(ins), np.arange(len(ins)))
    lab = np.asarray(lab)
    piece_max = np.zeros(int(lab.max()) + 1)
    np.maximum.at(piece_max, lab, d)
    for i, v in enumerate(ins.tolist()):
        own[v] = float(d[i])
    members = {}
    for i, v in enumerate(ins.tolist()):
        members.setdefault(int(lab[i]), []).append(v)
    for v in verts.tolist():
        if inside[v]:
            i = int(loc[v])
            out[v] = float(piece_max[lab[i]])
            piece_of[v] = members[int(lab[i])]
    return out, piece_of, own


def new_penetrations(cx: Context, Pw) -> dict:
    """New intersecting pairs (not present at rest) split into penetrations and contacts (see the module docstring).

    Returns dict: ``pairs`` (k,2) penetrating welded-face pairs, ``pair_depth`` (k,), ``pair_info`` (k dicts: ``intruder`` /
    ``target_face`` = the welded faces of the deepest counted direction, ``target`` "island" | "cut", ``vertex`` = deepest
    intruding welded vertex, ``w`` = its winding number), ``contacts`` (c,2), ``contact_depth`` (c,), ``face_depth`` (m,) deepest
    penetrating pair per face (-1 = none), ``contact_face`` (m,) bool, ``vertex_depth`` (n_w,) depth of counted intruding
    vertices (-1 = none), ``vertex_w`` {counted vertex: winding number}, ``n_pairs``, ``n_contacts``."""
    keys, ia, ib = penetration_pairs(cx, Pw)
    rest_keys = _rest_pairs(cx)[0]
    new = ~np.isin(keys, rest_keys, assume_unique=False) if keys.size else np.zeros(0, bool)
    ia, ib = ia[new], ib[new]
    m = len(cx.Fw)
    eps = cx.pr.pen_eps
    face_depth = np.full(m, -1.0)
    contact_face = np.zeros(m, bool)
    vdepth = np.full(cx.n_w, -1.0)
    empty = {"pairs": np.zeros((0, 2), np.int64), "pair_depth": np.zeros(0), "pair_info": [], "contacts": np.zeros((0, 2), np.int64),
             "contact_depth": np.zeros(0), "face_depth": face_depth, "contact_face": contact_face, "vertex_depth": vdepth,
             "vertex_w": {}, "n_pairs": 0, "n_contacts": 0}
    if ia.size == 0:
        return empty
    cdepth = np.zeros(len(ia))  # deepest counted vertex per pair
    xdepth = np.zeros(len(ia))  # deepest newly-inside vertex of the directions that did not count (contacts)
    counted = np.zeros(len(ia), bool)
    cinfo = [None] * len(ia)
    vw = {}
    jobs = {}
    for k in range(len(ia)):
        for f, g in ((int(ia[k]), int(ib[k])), (int(ib[k]), int(ia[k]))):
            jobs.setdefault(_target_key(cx, f, g), []).append((k, f, g))
    for tkey, items in jobs.items():
        Ft = _target_faces(cx, tkey)
        verts = np.unique(np.concatenate([cx.Fw[f] for _, f, _ in items]))
        info = {}
        dmap, piece_of, own = _intrusion_depths(cx, Pw, tkey, Ft, verts, info)
        for k, f, g in items:
            fv = cx.Fw[f].tolist()
            dv = [dmap.get(v, 0.0) for v in fv]
            thr = eps + _slide_allowance(cx, f, g)
            if max(dv) > thr:
                counted[k] = True
                if max(dv) > cdepth[k]:
                    cdepth[k] = max(dv)
                    u = max(piece_of[fv[int(np.argmax(dv))]], key=own.get)  # deepest vertex of the deepest piece
                    cinfo[k] = {"intruder": f, "target_face": g, "target": tkey[0], "vertex": int(u), "w": info["w"].get(u)}
                for v in fv:
                    for u in piece_of.get(v, ()):
                        vdepth[u] = max(vdepth[u], own[u])
                        vw[u] = info["w"].get(u)
            else:
                xdepth[k] = max(xdepth[k], max(dv))
    depth = np.where(counted, cdepth, xdepth)
    for k in np.nonzero(counted)[0]:
        for f in (ia[k], ib[k]):
            face_depth[f] = max(face_depth[f], depth[k])
    cont = ~counted
    contact_face[ia[cont]] = True
    contact_face[ib[cont]] = True
    return {"pairs": np.stack([ia[counted], ib[counted]], 1), "pair_depth": depth[counted],
            "pair_info": [cinfo[k] for k in np.nonzero(counted)[0]],
            "contacts": np.stack([ia[cont], ib[cont]], 1), "contact_depth": depth[cont], "face_depth": face_depth,
            "contact_face": contact_face, "vertex_depth": vdepth, "vertex_w": vw, "n_pairs": int(counted.sum()),
            "n_contacts": int(cont.sum())}


# --------------------------------------------------------------------------------------------------------------------------
# joints, candy wrapper, heads
# --------------------------------------------------------------------------------------------------------------------------


def joint_ratios(cx: Context, Pw, pi) -> dict:
    """Ball-occupancy ratio (posed / rest) of every measurable joint in pose ``pi`` at welded positions Pw; None otherwise. One
    winding-number call per island."""
    out = {k: None for k in cx.joints}
    by_island = {}
    for k, j in cx.joints.items():
        if j["measurable"]:
            by_island.setdefault(j["island"], []).append(k)
    for isl, keys in by_island.items():
        Q = []
        for k in keys:
            j = cx.joints[k]
            R = cx.skin_rotation(pi, j["bone_index"])
            Q.append(cx.pose_heads[pi, j["bone_index"]] + (j["radius"] * cx.ball_unit) @ R.T)
        ins = winding_inside(Pw, cx.joints[keys[0]]["faces"], np.concatenate(Q)) > 0.5
        nq = len(cx.ball_unit)
        for i, k in enumerate(keys):
            out[k] = float(ins[i * nq:(i + 1) * nq].mean() / cx.joints[k]["rest_occupancy"])
    return out


def heads_inside(cx: Context, P, heads) -> dict:
    """Joint drift: each deform bone head inside the deformed mesh (all faces, winding number) + distance to the surface (mm)."""
    names = [b for i, b in enumerate(cx.bone_names) if cx.deform is None or cx.deform[i]]
    idx = [cx.bone_names.index(b) for b in names]
    Q = np.asarray(heads, dtype=np.float64)[idx]
    Pw = cx.welded(P)
    w = winding_inside(Pw, cx.Fw, Q)
    d, _ = surface_distance(Pw, cx.Fw, Q)
    return {b: {"inside": bool(w[i] > 0.5), "dist_mm": round(float(d[i] * 1000), 3)} for i, b in enumerate(names)}


def candy_wrapper(cx: Context, Pw, pi) -> dict:
    """Forearm section ratios (posed / rest) per side: ``{side: {"slices": {"0.5", "0.75", "0.9", "wrist": ratio | None},
    "min", "at", "twist": twist info}}`` (see the module docstring)."""
    out = {}
    if cx.rest_heads is None:
        return out
    for s in SIDES:
        fa = next((b for b in cx.bone_names if side_of(b) == s and base_name(b) == "ForeArm"), None)
        if fa is None:
            continue
        hand = next((b for b in cx.bone_names if side_of(b) == s and base_name(b) == "Hand"), None)
        regs = [i for i, r in enumerate(cx.region_names) if side_of(r) == s and base_name(r) in ("ForeArm", "Hand")]
        if not regs:
            continue
        fmask = np.isin(cx.face_region, regs)
        bi = cx.bone_names.index(fa)
        hi = cx.bone_names.index(hand) if hand else None

        def planes(heads, tails):
            h, t = heads[bi], tails[bi]
            n = t - h
            L = float(np.linalg.norm(n))
            u = n / max(L, 1e-12)
            pl = {f"{x:g}": (h + x * n, u) for x in cx.pr.candy_t}
            if hi is not None:
                v = tails[hi] - heads[hi]
                v = v / max(float(np.linalg.norm(v)), 1e-12)
                b = u + v
                pl["wrist"] = (heads[hi], b / max(float(np.linalg.norm(b)), 1e-12))
            else:
                pl["wrist"] = (t, u)
            return pl, L

        def area_at(P, c, n, L):
            near = (np.linalg.norm(P[cx.Fw] - c, axis=2) <= 0.5 * L).all(1)
            Fs = cx.Fw[fmask & near]
            dd = (P[Fs] - c) @ n
            Fc = Fs[(dd > 0).any(1) & ~(dd > 0).all(1)]
            if len(Fc) == 0:
                return None
            _, lab = rmesh.connected_components(cx.n_w, rmesh.unique_edges(Fc))
            fl = lab[Fc[:, 0]]
            best = min(np.unique(fl), key=lambda k: np.linalg.norm(P[np.unique(Fc[fl == k])].mean(0) - c))
            return slice_area(P, Fc[fl == best], c, n)

        pl0, L0 = planes(cx.rest_heads, cx.rest_tails)
        pl1, L1 = planes(cx.pose_heads[pi], cx.pose_tails[pi])
        sl = {}
        for k in pl0:
            a0 = area_at(cx.rest_w, *pl0[k], L0)
            a1 = area_at(Pw, *pl1[k], L1)
            sl[k] = float(a1 / a0) if (a0 and a1 is not None and a0 > 0) else None
        vals = {k: v for k, v in sl.items() if v is not None}
        at = min(vals, key=vals.get) if vals else None
        out[s] = {"slices": sl, "min": vals[at] if at else None, "at": at, "twist": cx.twist[s]}
    return out


# --------------------------------------------------------------------------------------------------------------------------
# per-pose metrics
# --------------------------------------------------------------------------------------------------------------------------


def pose_metrics(cx: Context, P, pi: int, with_penetration: bool = True, fields: bool = False, keep_pen: bool = False) -> dict:
    """All per-region metrics of pose index ``pi`` from original-vertex positions ``P`` (n,3). Returns {"regions": {name:
    metrics}, "joints": {key: ratio}, "ground", "candy", "fields" | None, "score_parts": {region: sums for the score},
    "penetration_pairs", "contact_pairs"} (+ "pen" = the ``new_penetrations`` dict and "Pw" with ``keep_pen``, for the garment
    metrics)."""
    pr = cx.pr
    pose = cx.pose_names[pi]
    P = np.asarray(P, dtype=np.float64)
    Pw = cx.welded(P)
    R = len(cx.region_names)
    e = cx.e
    L1 = np.linalg.norm(Pw[e[:, 0]] - Pw[e[:, 1]], axis=1)
    ratio = L1 / cx.L0
    growth = L1 - cx.L0
    torn = (ratio > pr.torn_ratio) & (growth > pr.torn_growth)
    tear = np.where(torn, L1 - pr.torn_ratio * cx.L0, 0.0) / (TEAR_UNIT_H * cx.H)
    lr = np.abs(np.log(np.maximum(ratio, 1e-12)))
    ex4 = (np.maximum(lr - pr.ln_green, 0.0) / (pr.ln_red - pr.ln_green)) ** 4
    area = np.ones(len(cx.Fw))
    area[cx.face_area_ok] = tri_areas(Pw, cx.Fw[cx.face_area_ok]) / cx.area0[cx.face_area_ok]
    adev = np.abs(area - 1.0)
    fgood = cx.nonsliver
    beyond = fgood & (adev > pr.area_band)
    ax4 = np.where(fgood, (np.maximum(np.abs(np.log(np.maximum(area, 1e-12))) - pr.ln_area, 0.0) / pr.ln_area) ** 4, 0.0)
    A0 = np.where(fgood, cx.area0, 0.0)
    # seam crack per welded id: distance of every duplicate to the first member of its weld group
    crack = np.zeros(cx.n_w)
    if cx.seam_v.size:
        np.maximum.at(crack, cx.weld[cx.seam_v], np.linalg.norm(P[cx.seam_v] - P[cx.seam_first], axis=1))
    pen = new_penetrations(cx, Pw) if with_penetration else None
    jv = joint_ratios(cx, Pw, pi)
    regions, parts = {}, {}
    for r in range(R + 1):
        if r < R:
            name = cx.region_names[r]
            em, fm, vm = cx.em[r], cx.fm[r], cx.region_of == r
        else:
            name = MESH_REGION
            em, fm, vm = np.ones(len(e), bool), np.ones(len(cx.Fw), bool), np.ones(cx.n_w, bool)
        rr, gg = ratio[em], growth[em]
        fa = fm & fgood
        aa = area[fa]
        wsum = float(A0[fm].sum())
        nt = int(torn[em].sum())
        ent = {
            "stretch_max": float(rr.max()) if rr.size else None,
            "stretch_p99": float(np.percentile(rr, 99)) if rr.size else None,
            "n_over_1_25": int((rr > 1.25).sum()),
            "n_over_1_5": int((rr > 1.5).sum()),
            "area_change_max": float(adev[fa].max()) if fa.any() else None,
            "volume_ratio": None,
            "penetration": {"n_tris": None, "max_depth": None},
            "seam_crack_max": float(crack[vm].max()) if vm.any() else 0.0,
            "n_torn": nt,
            "torn_fraction": (nt / int(em.sum())) if em.any() else 0.0,
            "area_fraction_beyond": float(A0[fm & beyond].sum() / wsum) if wsum > 0 else None,
            "contacts": {"n_tris": None, "max_depth": None},
            "stretch_min": float(rr.min()) if rr.size else None,
            "n_under_0_8": int((rr < 0.8).sum()),
            "edge_growth_max_mm": float(gg.max() * 1000) if gg.size else None,
            "edge_growth_p99_mm": float(np.percentile(gg, 99) * 1000) if gg.size else None,
            "area_ratio_min": float(aa.min()) if aa.size else None,
            "area_ratio_max": float(aa.max()) if aa.size else None,
            "n_edges": int(em.sum()),
            "n_faces": int(fm.sum()),
        }
        pen_depth = 0.0
        if pen is not None:
            inv = fm & (pen["face_depth"] >= 0)
            pen_depth = float(pen["face_depth"][inv].max()) if inv.any() else 0.0
            ent["penetration"] = {"n_tris": int(inv.sum()), "max_depth": pen_depth}
            if pen["n_pairs"]:
                touch = fm[pen["pairs"][:, 0]] | fm[pen["pairs"][:, 1]]
                if touch.any():
                    k = int(np.flatnonzero(touch)[np.argmax(pen["pair_depth"][touch])])
                    ent["penetration"]["pair"] = _pair_entry(cx, Pw, pen, k)
            ci = fm & pen["contact_face"]
            cd = 0.0
            if ci.any() and pen["n_contacts"]:
                cfaces = set(np.nonzero(ci)[0].tolist())
                cd = max((float(pen["contact_depth"][k]) for k, (a, b) in enumerate(pen["contacts"].tolist())
                          if a in cfaces or b in cfaces), default=0.0)
            ent["contacts"] = {"n_tris": int(ci.sum()), "max_depth": cd}
        if name != MESH_REGION:
            vols = [v for k, v in jv.items() if cx.joints[k]["child"] == name and v is not None]
            ent["volume_ratio"] = float(min(vols)) if vols else None
        regions[name] = ent
        if rr.size:
            parts[name] = {"seam": ent["seam_crack_max"], "torn": nt, "tear": float(tear[em].sum()), "pen_depth": pen_depth,
                           "ex4": float(ex4[em].sum()),
                           "n_e": int(em.sum()), "ax4w": float((A0 * ax4)[fm].sum()), "w_a": wsum,
                           "volume": ent["volume_ratio"]}
    out = {"regions": regions, "joints": jv, "score_parts": parts}
    g = {}
    for s, idx in cx.soles.items():
        g[s] = float(P[idx, 2].min() * 1000) if cx.tagged(pose, f"planted_{s}") and idx.size else None
    out["ground"] = g
    out["candy"] = candy_wrapper(cx, Pw, pi)
    if fields:
        stretch_v = np.ones(cx.n_w)
        compress_v = np.ones(cx.n_w)
        np.maximum.at(stretch_v, e[:, 0], ratio)
        np.maximum.at(stretch_v, e[:, 1], ratio)
        np.minimum.at(compress_v, e[:, 0], ratio)
        np.minimum.at(compress_v, e[:, 1], ratio)
        area_v = np.zeros(cx.n_w)
        for c in range(3):
            np.maximum.at(area_v, cx.Fw[fgood, c], adev[fgood])
        torn_v = np.zeros(cx.n_w, np.uint8)
        torn_v[e[torn].ravel()] = 1
        pen_v = np.full(cx.n_w, -1.0)
        cont_v = np.zeros(cx.n_w, np.uint8)
        if pen is not None:
            hit = np.unique(cx.Fw[pen["face_depth"] >= 0].ravel())
            pen_v[hit] = 0.0
            pen_v = np.maximum(pen_v, pen["vertex_depth"])
            cont_v[np.unique(cx.Fw[pen["contact_face"]].ravel())] = 1
        out["fields"] = {"stretch": stretch_v[cx.weld], "compress": compress_v[cx.weld], "area": area_v[cx.weld],
                         "penetration": pen_v[cx.weld], "contact": cont_v[cx.weld], "torn": torn_v[cx.weld]}
    else:
        out["fields"] = None
    out["penetration_pairs"] = pen["n_pairs"] if pen is not None else None
    out["contact_pairs"] = pen["n_contacts"] if pen is not None else None
    out["penetration_margin"] = None
    if pen is not None and pen["n_pairs"]:
        # vertices ON the target surface (depth ~0, e.g. coplanar contact) always sit at w ~ 0.5: the margin is read on the
        # counted vertices deeper than eps, the ones that decide
        ws = [w for v, w in pen["vertex_w"].items() if w is not None and pen["vertex_depth"][v] > pr.pen_eps]
        k = int(np.argmax(pen["pair_depth"]))
        out["penetration_margin"] = {"min_margin": float(min(ws) - 0.5) if ws else None, "n_vertices_deeper_than_eps": len(ws),
                                     "deepest": _pair_entry(cx, Pw, pen, k)}
    if keep_pen:
        out["pen"], out["Pw"] = pen, Pw
    return out


def _pair_entry(cx: Context, Pw, pen: dict, k: int) -> dict:
    """JSON entry of counted pair ``k`` of ``new_penetrations``: regions of the intruding / other face, target kind, depth (m), the
    deepest intruding vertex (welded position, m) and its winding number against the closed target surface."""
    p = pen["pair_info"][k]
    return {"intruder": cx.region_names[cx.face_region[p["intruder"]]], "into": cx.region_names[cx.face_region[p["target_face"]]],
            "target": p["target"], "depth": float(pen["pair_depth"][k]), "hot": [float(x) for x in Pw[p["vertex"]]],
            "w": None if p["w"] is None else float(p["w"])}


# --------------------------------------------------------------------------------------------------------------------------
# lights
# --------------------------------------------------------------------------------------------------------------------------


def light(row: dict, value, H: float) -> str | None:
    """Traffic light of one value against a thresholds.json row (None when the row has no bounds or the value is None)."""
    if value is None or row.get("green") is None:
        return None
    v = float(value) / H if row.get("relative_to_H") else float(value)
    tol = float(row.get("tolerance", 0.0))
    if row.get("relative_to_H"):
        tol = tol / H
    glo, ghi = row["green"]
    rlo, rhi = row.get("red") or [None, None]
    if (glo is None or v >= glo - tol) and (ghi is None or v <= ghi + tol):
        return "green"
    if (rlo is not None and v < rlo - tol) or (rhi is not None and v > rhi + tol):
        return "red"
    if row.get("red") == row.get("green"):
        return "red"
    return "yellow"


def worst_light(*colors):
    order = {"green": 0, "yellow": 1, "red": 2}
    cs = [c for c in colors if c is not None]
    return max(cs, key=order.get) if cs else None


# --------------------------------------------------------------------------------------------------------------------------
# region score (ordered decision, see the module docstring)
# --------------------------------------------------------------------------------------------------------------------------


def score_summary(parts: list, pose_names: list, pr: Params) -> dict:
    """Per-step values of one region for one candidate from its per-pose ``score_parts`` (same order as ``pose_names``)."""
    torn = [p["torn"] for p in parts]
    tear = [p["tear"] for p in parts]
    k = int(np.argmax(tear)) if tear else 0
    n_e = sum(p["n_e"] for p in parts)
    w_a = sum(p["w_a"] for p in parts)
    vols = [p["volume"] for p in parts if p["volume"] is not None]
    vmin = min(vols) if vols else None
    edge = (sum(p["ex4"] for p in parts) / n_e) ** (1.0 / SCORE_POWER) if n_e else 0.0
    area = (sum(p["ax4w"] for p in parts) / w_a) ** (1.0 / SCORE_POWER) if w_a > 0 else 0.0
    vdef = max(0.0, pr.volume_min - vmin) if vmin is not None else 0.0
    pen = max((p["pen_depth"] for p in parts), default=0.0)
    seam = max((p["seam"] for p in parts), default=0.0)
    return {"seam_crack_max_m": seam, "seam_fail": bool(seam > pr.seam_tol),
            "tear_worst": int(round(max(tear, default=0.0))), "tear_sum": int(round(sum(tear))),
            "tear_worst_pose": pose_names[k] if tear and max(tear) > 0 else None, "tear_unit_m": TEAR_UNIT_H * pr.H,
            "torn_worst": int(max(torn, default=0)), "torn_sum": int(sum(torn)),
            "pen_depth_m": pen, "pen_tier": 0 if pen <= 0 else (1 if pen < pr.pen_tier else 2),
            "soft": {"edge_pm4": edge, "area_pm4": area, "volume_min": vmin, "volume_deficit": vdef, "total": edge + area + vdef}}


def roughness(cx: Context, W) -> np.ndarray:
    """Per region: mean over the region's welded edges of sum_bones (w_i - w_j)^2 of the exporter-rule weights (lower = smoother)."""
    Ww = exporter_rule(W).astype(np.float64)[cx.first]
    d2 = ((Ww[cx.e[:, 0]] - Ww[cx.e[:, 1]]) ** 2).sum(1)
    return np.array([float(d2[m].mean()) if m.any() else 0.0 for m in cx.em])


def tie_classes(values: dict, rel: float, floor: float) -> dict:
    """Tie-class representative of every key of ``values`` (numbers): sorted ascending, a class starts at its smallest value v0
    and holds every value <= v0 + max(rel x v0, floor); the representative is v0 (so the classes keep the order of the values)."""
    out, v0 = {}, None
    for c in sorted(values, key=lambda c: values[c]):
        v = values[c]
        if v0 is None or v > v0 + max(rel * v0, floor):
            v0 = v
        out[c] = v0
    return out


def region_exercise(cx: Context, threshold_deg: float | None = None) -> dict:
    """{region: {"exercised": True | False | None, "max_deg", "pose", "joints"}} (module docstring "joint exercise"); None = not
    measured (no pose_mats, or no joint at the region's bones): the region then counts as exercised."""
    thr = cx.pr.not_exercised_deg if threshold_deg is None else float(threshold_deg)
    out = {}
    for ri, r in enumerate(cx.region_names):
        if cx.region_turn is None or r not in cx.region_joints:
            out[r] = {"exercised": None, "max_deg": None, "pose": None, "joints": cx.region_joints.get(r, []),
                      "reason": cx.exercise_note or "no joint at the region's bones"}
            continue
        t = cx.region_turn[:, ri]
        k = int(np.argmax(t))
        out[r] = {"exercised": bool(t[k] >= thr), "max_deg": float(t[k]), "pose": cx.pose_names[k], "joints": cx.region_joints[r],
                  "threshold_deg": thr}
    return out


def leak_gate(leak: dict | None, cands: list, band: float) -> dict:
    """Step 1b of the region score (module docstring): ``leak`` = {candidate: leaking rows in the region} for a gate region (None:
    not gated). Returns {"applies", "band", "rows", "over", "dropped", "all_leak"}: candidates over ``band`` are dropped unless
    every candidate is over it (then none is, and ``all_leak`` flags the region for G2)."""
    if leak is None:
        return {"applies": False, "band": band, "rows": {}, "over": [], "dropped": [], "all_leak": False}
    rows = {c: int(leak.get(c, 0)) for c in cands}
    over = [c for c in cands if rows[c] > band]
    every = bool(cands) and len(over) == len(cands)
    return {"applies": True, "band": band, "rows": rows, "over": over, "dropped": [] if every else over, "all_leak": every}


def decide_region(summ: dict, rough: dict, order: list, pr: Params | None = None, exercised: bool = True,
                  leak: dict | None = None) -> tuple[dict, dict]:
    """Scalar scores + decision for one region (module docstring "Region score"). ``summ`` = {candidate: score_summary},
    ``rough`` = {candidate: roughness}, ``order`` = candidate order (ties), ``pr`` = Params (tie tolerances, leak band; module
    constants without), ``exercised`` False = the region's joints never turn (step 0), ``leak`` = {candidate: leaking rows in the
    region} when the region is a limb-leak gate region (step 1b; None = not gated). Returns ({candidate: score}, decision)."""
    rel = pr.tear_tie_rel if pr is not None else TEAR_TIE_REL
    floor = pr.tear_tie_abs if pr is not None else TEAR_TIE_ABS_UNITS
    near, soft_floor = (pr.near_tie, pr.soft_floor) if pr is not None else (NEAR_TIE, SOFT_FLOOR)
    cands = [c for c in order if c in summ]
    gate = leak_gate(leak, cands, pr.leak_band if pr is not None else LEAK_BAND)
    if not exercised:
        return {c: NOT_EXERCISED_SCORE for c in cands}, {
            "winner": None, "ranking": cands, "decided_by": "not_exercised", "near_tie": [], "tear_tie": [], "flag_g2": True,
            "equivalent": False, "not_exercised": True, "soft_eff": {c: summ[c]["soft"]["total"] for c in cands}, "band": None,
            "leak_gate": gate}
    for c in cands:
        s = summ[c]
        if s["tear_worst"] >= ENC_LIMITS["tear_worst"] or s["tear_sum"] >= ENC_LIMITS["tear_sum"]:
            raise ValueError(f"candidate {c}: tear lengths {s['tear_worst']}/{s['tear_sum']} units exceed the score encoding")
    seam = {c: int(summ[c]["seam_fail"]) for c in cands}
    drop = {c: int(c in gate["dropped"]) for c in cands}
    grp = {c: (seam[c], drop[c]) for c in cands}
    tw, ts = {}, {}
    for g_ in set(grp.values()):  # tear tie classes inside each (seam, leak) group, then the sum inside each worst-pose class
        tw.update(tie_classes({c: summ[c]["tear_worst"] for c in cands if grp[c] == g_}, rel, floor))
    for g_ in {(grp[c], tw[c]) for c in cands}:
        ts.update(tie_classes({c: summ[c]["tear_sum"] for c in cands if (grp[c], tw[c]) == g_}, rel, floor))

    def key(c):
        return (seam[c], drop[c], tw[c], ts[c], summ[c]["pen_tier"])

    kmin = min(key(c) for c in cands)
    G = [c for c in cands if key(c) == kmin]
    s_best = min(summ[c]["soft"]["total"] for c in G)
    band = near * max(s_best, soft_floor)
    tie = [c for c in G if summ[c]["soft"]["total"] <= s_best + band]
    soft_eff = {c: summ[c]["soft"]["total"] for c in cands}
    if len(tie) > 1:
        tie = sorted(tie, key=lambda c: (rough[c], summ[c]["soft"]["total"], cands.index(c)))
        for k_, c in enumerate(tie):
            soft_eff[c] = s_best + band * k_ / len(tie)
    scores = {}
    for c in cands:
        x = soft_eff[c]
        scores[c] = (ENC["seam"] * seam[c] + ENC["leak"] * drop[c] + ENC["tear_worst"] * tw[c] + ENC["tear_sum"] * ts[c]
                     + ENC["tier"] * summ[c]["pen_tier"] + x / (1.0 + x))
    ranked = sorted(cands, key=lambda c: (scores[c], cands.index(c)))
    win = ranked[0]
    # candidates that behave identically in the region (same soft score and roughness, e.g. the same weights) leave nothing to choose
    same = len(tie) > 1 and all(abs(summ[c]["soft"]["total"] - summ[tie[0]]["soft"]["total"])
                                <= 1e-6 * max(1.0, summ[tie[0]]["soft"]["total"]) and abs(rough[c] - rough[tie[0]]) <= 1e-9
                                for c in tie)
    by = None
    if len(ranked) > 1:
        r2 = ranked[1]
        for name, ka, kb in (("seam crack", seam[win], seam[r2]), ("limb leak", drop[win], drop[r2]),
                             ("tear length (worst pose)", tw[win], tw[r2]),
                             ("tear length (sum over poses)", ts[win], ts[r2]),
                             ("penetration tier", summ[win]["pen_tier"], summ[r2]["pen_tier"])):
            if ka != kb:
                by = name
                break
        if by is None:
            by = ("equivalent" if same else "near tie: smoother weights") if (len(tie) > 1 and r2 in tie) else "soft score"
    raw = (summ[win]["tear_worst"], summ[win]["tear_sum"])
    tear_tie = [c for c in cands if c != win and (grp[c], tw[c], ts[c]) == (grp[win], tw[win], ts[win])
                and (summ[c]["tear_worst"], summ[c]["tear_sum"]) != raw]
    dec = {"winner": win, "ranking": ranked, "decided_by": by, "near_tie": tie if len(tie) > 1 else [], "tear_tie": tear_tie,
           "flag_g2": (len(tie) > 1 and not same) or gate["all_leak"], "equivalent": bool(same), "not_exercised": False,
           "soft_eff": soft_eff, "band": band, "tear_class": {c: [tw[c], ts[c]] for c in cands}, "leak_gate": gate}
    return scores, dec


# --------------------------------------------------------------------------------------------------------------------------
# garments (phase G, references/cloth-and-attachments.md §6; only with --garments)
# --------------------------------------------------------------------------------------------------------------------------

LIMB_BASES = ("UpperArm", "UpperArm_twist", "ForeArm", "ForeArm_twist", "Hand", "Thigh", "Calf", "Foot", "Toe")
GARMENT_LIGHTS = ("garment_limb_penetration", "garment_layer_penetration", "garment_hem_stretch", "garment_torn_edges",
                  "garment_bleed", "garment_chain_coverage")
HEM_T_FALLBACK = 0.95  # without a hem loop in garments.json: the piece's rows with t >= this
GARMENT_NEAR_RINGS = 3  # review r1 M4 (G5): a limb face and a garment face whose closest rows are at most this many welded edges
#                         apart meet at a fused junction (the crease of the skin_garment band, BAND_RINGS = 3): not a penetration


def piece_index(pid, ids=()) -> int | None:
    """garments.npz index of piece id ``pid``: an int as is, ``"auto:<n>"`` -> n, else its position in ``ids`` (garments.json
    piece order); None when unknown."""
    if pid is None:
        return None
    if isinstance(pid, (int, np.integer)):
        return int(pid)
    t = str(pid)
    if t.startswith("auto:") and t[5:].lstrip("-").isdigit():
        return int(t[5:])
    return list(ids).index(t) if t in list(ids) else None


def load_garments(path, json_path=None, skeleton_path=None, chains_path=None) -> dict:
    """Garment inputs of the metrics: garments.npz arrays (per welded id), garments.json pieces (ids, classes, confidence, hem
    loops), and the chain bone -> piece map from skeleton.json bones (``chain`` / ``piece`` keys) or chains.json. Returns
    {"piece", "t", "layer", "outer_ref", "ids", "pieces", "bone_piece", "sources"}."""
    with np.load(os.fspath(path), allow_pickle=False) as z:
        arr = {k: z[k] for k in z.files}
    gj = npzio.read_json(json_path) if json_path else None
    pieces = list((gj or {}).get("pieces", []))
    ids = [str(p["id"]) for p in pieces]
    bone_piece, src = {}, None
    if skeleton_path:
        for b in npzio.read_json(skeleton_path).get("bones", []):
            if b.get("chain") is not None:
                bone_piece[b["name"]] = piece_index(b.get("piece"), ids)
        src = os.path.abspath(skeleton_path)
    elif chains_path:
        for c in npzio.read_json(chains_path).get("chains", []):
            for b in c.get("bones", []):
                bone_piece[b["name"]] = piece_index(c.get("piece"), ids)
        src = os.path.abspath(chains_path)
    n = len(arr["piece"])
    return {"piece": np.asarray(arr["piece"], dtype=np.int64), "t": np.asarray(arr["t"], dtype=np.float64),
            "layer": np.asarray(arr.get("layer", np.zeros(n)), dtype=np.int64),
            "outer_ref": np.asarray(arr.get("outer_ref", np.full(n, -1)), dtype=np.int64), "ids": ids, "pieces": pieces,
            "bone_piece": bone_piece, "sources": {"garments": os.path.abspath(path),
                                                   "garments_json": os.path.abspath(json_path) if json_path else None,
                                                   "bones": src}}


class GarmentContext:
    """Static garment data over the welded topology of ``cx``: piece per welded id / face / edge, limb faces, hem edges.
    Pieces of class ``tight`` (garments.json) are body skin by definition (no chains, no overlay): their rows count as body
    rows here and the per-piece metrics skip them (G4; D01's hem-stretch red came only from tight piece g04)."""

    def __init__(self, cx: Context, g: dict):
        if len(g["piece"]) != cx.n_w:
            raise ValueError(f"garments.npz has {len(g['piece'])} welded rows, the mesh {cx.n_w}")
        self.g = g
        raw = np.asarray(g["piece"], np.int64)
        self.n_pieces = int(max(raw.max() + 1, len(g["ids"]))) if len(raw) else 0
        self.names = [g["ids"][i] if i < len(g["ids"]) else f"auto:{i}" for i in range(self.n_pieces)]
        self.tight = sorted(k for k, p in enumerate(g.get("pieces") or []) if p.get("class") == "tight")
        self.live = [k for k in range(self.n_pieces) if k not in self.tight]
        self.live_names = [self.names[k] for k in self.live]
        self.piece = np.where(np.isin(raw, self.tight), -1, raw) if self.tight else raw
        fp = self.piece[cx.Fw]  # (m,3)
        # a face belongs to a piece when at least two of its vertices do (else body, -1)
        self.face_piece = np.full(len(cx.Fw), -1, np.int64)
        for c in range(3):
            same = (fp[:, c] >= 0) & ((fp[:, c] == fp[:, (c + 1) % 3]) | (fp[:, c] == fp[:, (c + 2) % 3]))
            self.face_piece[same] = fp[same, c]
        limb_regions = [i for i, r in enumerate(cx.region_names) if side_of(r) and base_name(r) in LIMB_BASES]
        self.limb_face = (self.face_piece < 0) & np.isin(cx.face_region, limb_regions)
        ep = self.piece[cx.e]
        self.edge_piece = [(ep[:, 0] == k) | (ep[:, 1] == k) for k in range(self.n_pieces)]
        self.hem, self.hem_source = [], []
        for k in range(self.n_pieces):
            loop = (g["pieces"][k].get("hem_loop") if k < len(g["pieces"]) else None) or []
            if len(loop):
                hv = np.zeros(cx.n_w, bool)
                hv[np.asarray(loop, dtype=np.int64)] = True
                self.hem_source.append("garments.json hem_loop")
            else:
                hv = (self.piece == k) & (np.nan_to_num(g["t"], nan=-1.0) >= HEM_T_FALLBACK)
                self.hem_source.append(f"rows with t >= {HEM_T_FALLBACK}")
            self.hem.append(hv[cx.e[:, 0]] & hv[cx.e[:, 1]])
        # review r1 M4 (G5): limb x garment pairs on ONE island whose regions are adjacent are never eligible body pairs (the
        # body rule drops whole adjacent regions: FL's thigh next to the skirt panels it borders); fused_limb_penetration
        # measures them, excluding only pairs within GARMENT_NEAR_RINGS of each other
        self.limb_ids = np.nonzero(self.limb_face)[0]
        self.cloth_ids = np.nonzero(self.face_piece >= 0)[0]
        self._ring = {}
        self._rest_fused = None

    def _rings(self, cx: Context, f: int) -> set:
        """Welded rows within GARMENT_NEAR_RINGS edges of face ``f``'s rows (BFS over the welded edges; cached)."""
        s = self._ring.get(f)
        if s is None:
            if cx._csr is None:
                cx._csr = rmesh.adjacency_csr(cx.n_w, cx.edges)
            ptr, idx = cx._csr
            s = set(cx.Fw[f].tolist())
            front = list(s)
            for _ in range(GARMENT_NEAR_RINGS):
                nxt = set()
                for v in front:
                    nxt.update(idx[ptr[v]:ptr[v + 1]].tolist())
                nxt -= s
                s |= nxt
                front = list(nxt)
            self._ring[f] = s
        return s

    def near(self, cx: Context, fa, fb) -> np.ndarray:
        """Per face pair (fa[i], fb[i]): the closest rows of the two faces are at most GARMENT_NEAR_RINGS welded edges apart."""
        return np.array([not self._rings(cx, f).isdisjoint(cx.Fw[g].tolist())
                         for f, g in zip(np.asarray(fa).tolist(), np.asarray(fb).tolist())], dtype=bool)


def fused_limb_pairs(gx: GarmentContext, cx: Context, Pw):
    """Intersecting (limb face, garment face) pairs at welded positions ``Pw`` that the body rule never sees (``eligible_pairs``
    False: one island, adjacent regions), without the pairs whose closest rows are within GARMENT_NEAR_RINGS welded edges (the
    fused junction). Returns (fa, fb): limb / garment face indices into ``cx.Fw``."""
    z = np.zeros(0, np.int64)
    if not len(gx.limb_ids) or not len(gx.cloth_ids):
        return z, z
    ia, ib = intersecting_pairs(Pw, cx.Fw[gx.limb_ids], cx.Fw[gx.cloth_ids])
    fa, fb = gx.limb_ids[ia], gx.cloth_ids[ib]
    if fa.size:
        keep = ~cx.eligible_pairs(fa, fb)
        fa, fb = fa[keep], fb[keep]
    if fa.size:
        keep = ~gx.near(cx, fa, fb)
        fa, fb = fa[keep], fb[keep]
    return fa, fb


def fused_limb_penetration(gx: GarmentContext, cx: Context, Pw) -> dict:
    """Review r1 M4 (G5): limb penetration through garment faces the body rule cannot see (``fused_limb_pairs``) in one pose.
    Pairs present at rest do not count. Depth: the garment face's rows newly inside the BODY surface of the island (its faces
    without garment faces, closed by fan caps like every target), flood-filled over newly-inside rows (``_intrusion_depths``);
    a pair counts when that depth > eps (0.05 % H). The garment side is not a target: an open sheet closed by a fan cap has no
    useful inside (an open skirt cone holds the legs at rest). No sliding rest-overlap allowance (rows inside the body at rest
    never count). Returns {"pairs" (k,2) limb / garment faces, "pair_depth" (k,), "candidates": new pairs before the depth test}."""
    m = len(cx.Fw)
    if gx._rest_fused is None:
        a, b = fused_limb_pairs(gx, cx, cx.rest_w)
        gx._rest_fused = np.sort(a * m + b)
    fa, fb = fused_limb_pairs(gx, cx, Pw)
    if fa.size:
        new = ~np.isin(fa * m + fb, gx._rest_fused)
        fa, fb = fa[new], fb[new]
    depth = np.zeros(len(fa))
    jobs = {}
    for k, g in enumerate(fb.tolist()):
        jobs.setdefault(("garment_body", int(cx.face_island[g]), -1), []).append(k)
    for tkey, ks in jobs.items():
        Ft = cx._tfaces.get(tkey)
        if Ft is None:
            Ft = cx._tfaces[tkey] = cx.Fw[(cx.face_island == tkey[1]) & (gx.face_piece < 0)]
        dmap, _, _ = _intrusion_depths(cx, Pw, tkey, Ft, np.unique(cx.Fw[fb[ks]]))
        for k in ks:
            depth[k] = max(dmap.get(v, 0.0) for v in cx.Fw[fb[k]].tolist())
    hit = depth > cx.pr.pen_eps
    return {"pairs": np.stack([fa[hit], fb[hit]], 1), "pair_depth": depth[hit], "candidates": int(len(fa))}


def garment_pose(gx: GarmentContext, cx: Context, Pw, pen) -> dict:
    """Per piece in one pose: hem stretch (sum of posed / rest lengths of the hem edges), torn edges touching the piece (the
    body rule: ratio > 1.5 and growth > 0.2 % H), and, from the penetrating pairs of ``new_penetrations`` (flood-filled depth
    > 0.05 % H), limb penetration (pairs of a limb face and a face of the piece: limb faces and depth) and layer penetration
    (pairs of faces of two different pieces: the piece's faces and depth). Limb penetration also takes the pairs of
    ``fused_limb_penetration`` (fused garments, review r1 M4; ``limb_fused_pairs`` = their count); the body metrics never do."""
    pr = cx.pr
    L1 = np.linalg.norm(Pw[cx.e[:, 0]] - Pw[cx.e[:, 1]], axis=1)
    torn = (L1 / cx.L0 > pr.torn_ratio) & (L1 - cx.L0 > pr.torn_growth)
    pairs = pen["pairs"] if pen is not None and pen["n_pairs"] else np.zeros((0, 2), np.int64)
    depth = pen["pair_depth"] if pen is not None and pen["n_pairs"] else np.zeros(0)
    fa, fb = (pairs[:, 0], pairs[:, 1]) if len(pairs) else (np.zeros(0, np.int64), np.zeros(0, np.int64))
    pa, pb = gx.face_piece[fa], gx.face_piece[fb]
    fz = fused_limb_penetration(gx, cx, Pw)
    zp = gx.face_piece[fz["pairs"][:, 1]]
    out = {}
    for k in gx.live:
        hm = gx.hem[k]
        r0 = float(cx.L0[hm].sum())
        lim = (gx.limb_face[fa] & (pb == k)) | (gx.limb_face[fb] & (pa == k))
        zk = zp == k
        limb_faces = (set(fa[lim & gx.limb_face[fa]].tolist()) | set(fb[lim & gx.limb_face[fb]].tolist())
                      | set(fz["pairs"][zk, 0].tolist()))
        ldepth = max(float(depth[lim].max()) if lim.any() else 0.0, float(fz["pair_depth"][zk].max()) if zk.any() else 0.0)
        lay = (pa >= 0) & (pb >= 0) & (pa != pb) & ((pa == k) | (pb == k))
        lay_faces = set(fa[lay & (pa == k)].tolist()) | set(fb[lay & (pb == k)].tolist())
        out[gx.names[k]] = {"hem_stretch": float(L1[hm].sum() / r0) if r0 > 0 else None, "hem_edges": int(hm.sum()),
                            "torn_edges": int((torn & gx.edge_piece[k]).sum()),
                            "limb_penetration": len(limb_faces), "limb_depth": ldepth, "limb_fused_pairs": int(zk.sum()),
                            "layer_penetration": len(lay_faces), "layer_depth": float(depth[lay].max()) if lay.any() else 0.0}
    return out


def garment_weights(gx: GarmentContext, cx: Context, W, names) -> dict:
    """Pose-independent garment weight checks on the exporter-rule weights ``W`` (n,k) over columns ``names``: bleed =
    ``skin_garment.bleed`` (rows judged by the piece they move with: the ``outer_ref``'s piece for inner-layer rows, as
    ``check_overlay`` does; tight pieces are body; more than 1e-4 of chain bones of ANOTHER piece; per piece and the union;
    review r1 M5), coverage = welded rows where each chain bone (bone -> piece map) is the dominant weight."""
    from solvers import skin_garment  # the one bleed definition (also check_overlay's)

    names = [str(b) for b in names]
    Ww = exporter_rule(W).astype(np.float64)[cx.first]
    bp = gx.g["bone_piece"]
    bl = skin_garment.bleed(Ww, names, gx.g["piece"], gx.g["outer_ref"], bp, skip=gx.tight)
    rows, judge = bl["mask"], bl["judge"]
    dom = np.argmax(Ww, axis=1)
    has = Ww.max(1) > 0
    cov = {b: int(((dom == names.index(b)) & has).sum()) if b in names else 0 for b in bp}
    per = {gx.names[k]: int((rows & (judge == k)).sum()) for k in gx.live}
    return {"bleed_rows": bl["rows"], "bleed_rows_by_piece": per, "bleed_max": bl["max"],
            "bleed_definition": skin_garment.BLEED_DEFINITION,
            "chain_coverage": cov, "chain_bones_without_weights": sorted(b for b in bp if b not in names)}


def garment_summary(gx: GarmentContext, cx: Context, per_pose: dict, wchk: dict, th: dict) -> tuple:
    """metrics.json ``summary.garments`` (CONTRACT "Phase G") and the ``garment_*`` lights + details. Standard poses decide the
    penetration, torn-edge and hem-stretch lights; the extremes (every other pose but rest: extreme ROM, the chain weight tests)
    are reported beside them (``*_extreme*`` keys, ``lights_detail[...]["extreme"]``). Hem stretch took every pose until G5."""
    names = cx.pose_names
    standard = _poses_with(cx, "standard", names)
    ext = [nm for nm in names if nm not in standard and nm != (names[cx.rest_index] if cx.rest_index is not None else None)]
    pieces = {}
    for pid in gx.live_names:
        rows = {nm: per_pose[nm][pid] for nm in names}

        def mx(key, sel):
            vals = [(rows[nm][key], nm) for nm in sel]
            return max(vals) if vals else (0, None)

        def hem(sel):  # ((min, pose), (max, pose)) of the hem stretch over the poses ``sel``
            hs = [(rows[nm]["hem_stretch"], nm) for nm in sel if rows[nm]["hem_stretch"] is not None]
            return (min(hs), max(hs)) if hs else ((None, None), (None, None))

        lp, lpp = mx("limb_penetration", standard)
        lpx, lpxp = mx("limb_penetration", ext)
        ly, lyp = mx("layer_penetration", standard)
        lyx, lyxp = mx("layer_penetration", ext)
        te, tep = mx("torn_edges", standard)
        tex, texp = mx("torn_edges", ext)
        (hn, hnp), (hx, hxp) = hem(standard)
        (hnx, hnxp), (hxx, hxxp) = hem(ext)
        pieces[pid] = {"hem_stretch_min": hn, "hem_stretch_min_pose": hnp, "hem_stretch_max": hx, "hem_stretch_max_pose": hxp,
                       "hem_stretch_extreme_min": hnx, "hem_stretch_extreme_min_pose": hnxp,
                       "hem_stretch_extreme_max": hxx, "hem_stretch_extreme_max_pose": hxxp,
                       "hem_edges": rows[names[0]]["hem_edges"], "hem_source": gx.hem_source[gx.names.index(pid)],
                       "torn_edges": te, "torn_edges_pose": tep, "torn_edges_extreme": tex, "torn_edges_extreme_pose": texp,
                       "limb_penetration": lp, "limb_penetration_pose": lpp, "limb_penetration_extreme": lpx,
                       "limb_penetration_extreme_pose": lpxp,
                       "limb_depth_max": max(v["limb_depth"] for v in rows.values()),
                       "layer_penetration": ly, "layer_penetration_pose": lyp, "layer_penetration_extreme": lyx,
                       "layer_penetration_extreme_pose": lyxp,
                       "layer_depth_max": max(v["layer_depth"] for v in rows.values())}
    H = cx.H
    lights, detail = {}, {}

    def worst(key):
        best = max(((v[key], k) for k, v in pieces.items() if v[key] is not None), default=(None, None))
        return best

    if standard:
        for lid, key in (("garment_limb_penetration", "limb_penetration"), ("garment_layer_penetration", "layer_penetration"),
                         ("garment_torn_edges", "torn_edges")):
            v, k = worst(key)
            if lid in th:
                lights[lid] = light(th[lid], v, H)
            vx, kx = worst(key + "_extreme")
            detail[lid] = {"value": v, "piece": k, "pose": pieces[k][key + "_pose"] if k else None, "poses": "standard",
                           "extreme": {"value": vx, "piece": kx, "pose": pieces[kx][key + "_extreme_pose"] if kx else None}}

    def hem_ends(sfx):  # smallest / largest hem stretch over the pieces: (value, piece, pose) each
        lo = min(((v[f"hem_stretch{sfx}_min"], k) for k, v in pieces.items() if v[f"hem_stretch{sfx}_min"] is not None),
                 default=(None, None))
        hi = max(((v[f"hem_stretch{sfx}_max"], k) for k, v in pieces.items() if v[f"hem_stretch{sfx}_max"] is not None),
                 default=(None, None))
        return {"min": lo[0], "min_piece": lo[1], "min_pose": pieces[lo[1]][f"hem_stretch{sfx}_min_pose"] if lo[1] else None,
                "max": hi[0], "max_piece": hi[1], "max_pose": pieces[hi[1]][f"hem_stretch{sfx}_max_pose"] if hi[1] else None}

    hs, hx = hem_ends(""), hem_ends("_extreme")
    if hs["min"] is not None and "garment_hem_stretch" in th:  # G5: standard poses only (none -> not lit), extremes reported
        lights["garment_hem_stretch"] = worst_light(light(th["garment_hem_stretch"], hs["min"], H),
                                                    light(th["garment_hem_stretch"], hs["max"], H))
    if hs["min"] is not None or hx["min"] is not None:
        detail["garment_hem_stretch"] = {**hs, "poses": "standard", "extreme": hx}
    if "garment_bleed" in th:
        lights["garment_bleed"] = light(th["garment_bleed"], wchk["bleed_rows"], H)
        detail["garment_bleed"] = {"rows": wchk["bleed_rows"], "by_piece": wchk["bleed_rows_by_piece"], "max": wchk["bleed_max"]}
    if wchk["chain_coverage"] and "garment_chain_coverage" in th:
        b, v = min(wchk["chain_coverage"].items(), key=lambda kv: kv[1])
        lights["garment_chain_coverage"] = light(th["garment_chain_coverage"], v, H)
        detail["garment_chain_coverage"] = {"min_rows": v, "bone": b,
                                            "below_8": sorted(k for k, n in wchk["chain_coverage"].items() if n < 8)}
    summ = {"pieces": pieces, "bleed_rows": wchk["bleed_rows"], "chain_coverage": wchk["chain_coverage"],
            "bleed_rows_by_piece": wchk["bleed_rows_by_piece"], "chain_bones_without_weights": wchk["chain_bones_without_weights"],
            "piece_ids": gx.live_names, "tight_skipped": [gx.names[k] for k in gx.tight], "limb_near_rings": GARMENT_NEAR_RINGS,
            "n_garment_rows": int((gx.piece >= 0).sum()), "n_limb_faces": int(gx.limb_face.sum()),
            "classes": {p.get("id"): p.get("class") for p in gx.g["pieces"]},
            "confidence": {p.get("id"): p.get("confidence") for p in gx.g["pieces"]},
            "by_pose": per_pose, "sources": gx.g["sources"], "lights_detail": detail}
    return summ, {k: v for k, v in lights.items() if v is not None}


# --------------------------------------------------------------------------------------------------------------------------
# driver
# --------------------------------------------------------------------------------------------------------------------------


def load_regions_npz(path) -> dict:
    with np.load(os.fspath(path), allow_pickle=False) as z:
        if "names" in z.files and "masks" in z.files:
            return {str(k): z["masks"][i] for i, k in enumerate(z["names"])}
        return {k: z[k] for k in z.files if k != "meta"}


def _poses_with(cx: Context, tag: str, names: list) -> list:
    return [nm for nm in names if cx.tagged(nm, tag)]


def volume_mirror(cx: Context, joints_vol: dict, names: list, tol: float = 0.05) -> dict:
    """L/R consistency of the ball-occupancy volumes: rest occupancy, radius and |ratio_L(pose) - ratio_R(mirrored pose)| over
    the pose pairs whose names differ only by the side token (and the rest pose)."""
    out = {}
    for kl, jl in cx.joints.items():
        if jl["side"] != "L":
            continue
        kr = kl[:-2] + "_R"
        jr = cx.joints.get(kr)
        if jr is None or not (jl["measurable"] and jr["measurable"]):
            continue
        diffs = []
        for nm in names:
            mn = nm if nm == "rest" else mirror_name(nm)
            if mn is None or mn not in names:
                continue
            a, b = joints_vol[kl].get(nm), joints_vol[kr].get(mn)
            if a is not None and b is not None:
                diffs.append((abs(a - b), nm, mn, a, b))
        worst = max(diffs) if diffs else None
        out[jl["label"]] = {"rest_occupancy": [jl["rest_occupancy"], jr["rest_occupancy"]], "radius_m": [jl["radius"], jr["radius"]],
                            "n_pose_pairs": len(diffs),
                            "max_ratio_diff": ({"diff": worst[0], "pose_L": worst[1], "pose_R": worst[2], "ratio_L": worst[3],
                                                "ratio_R": worst[4]} if worst else None),
                            "consistent": bool((worst is None or worst[0] <= tol)
                                               and abs(jl["rest_occupancy"] - jr["rest_occupancy"]) <= tol)}
    return out


def compute_lights(cx: Context, per_pose: dict, joints_vol: dict, candy: dict, ground: dict, heads: dict,
                   with_penetration: bool) -> tuple[dict, dict, list]:
    """Lights from the primary candidate's per-pose values. Returns (lights, detail, not_evaluated)."""
    th, H, pr = cx.th, cx.H, cx.pr
    names = cx.pose_names
    lights, detail, not_eval = {}, {}, []
    keep = [r for r in cx.region_names if r not in cx.exempt_regions]
    standard = _poses_with(cx, "standard", names)
    extreme = _poses_with(cx, "extreme", names) or [nm for nm in names if nm != (names[cx.rest_index] if cx.rest_index is not None
                                                                                else None)]

    def worst(get, poses_sel, fn=max):
        best, where = None, None
        for nm in poses_sel:
            for r in keep:
                v = get(per_pose[nm][r])
                if v is None:
                    continue
                if best is None or (v != best and fn(v, best) == v):
                    best, where = v, {"pose": nm, "region": r}
        return best, where

    # torn edges
    if standard:
        v, w = worst(lambda m: m["n_torn"], standard)
        lights["deform_torn_edges_standard"] = light(th["deform_torn_edges_standard"], v, H)
        detail["deform_torn_edges_standard"] = {"max_torn_edges": v, "at": w, "poses": "standard"}
    else:
        not_eval.append("deform_torn_edges_standard")
    v, w = worst(lambda m: m["torn_fraction"], extreme)
    lights["deform_torn_edges_extreme"] = light(th["deform_torn_edges_extreme"], v, H)
    nt = per_pose[w["pose"]][w["region"]]["n_torn"] if w else 0
    detail["deform_torn_edges_extreme"] = {"max_region_fraction": v, "n_torn": nt, "at": w, "poses": "extreme",
                                           "definition": f"edge ratio > {pr.torn_ratio} and growth > {pr.torn_growth * 1000:.3f} mm"}
    smax, ws = worst(lambda m: m["stretch_max"], names)
    smin, ws2 = worst(lambda m: m["stretch_min"], names, fn=min)
    detail["deform_edge_ratio"] = {"diagnostic": True, "max": smax, "max_at": ws, "min": smin, "min_at": ws2,
                                   "note": "edge-ratio band [0.8, 1.25] / 1.5 enters the region score; the light counts torn edges"}
    # area
    v, w = worst(lambda m: m["area_fraction_beyond"], extreme)
    lights["deform_area_change"] = light(th["deform_area_change"], v, H)
    amax, wa = worst(lambda m: m["area_change_max"], extreme)
    detail["deform_area_change"] = {"max_area_fraction": v, "at": w, "poses": "extreme", "worst_face_dev": amax, "worst_face_at": wa}
    # joint volume
    vols = [(v, k, nm) for k, j in cx.joints.items() if j["label"] in VOLUME_LIGHT_JOINTS
            for nm, v in joints_vol[k].items() if v is not None]
    unmeasured = {k: j["reason"] for k, j in cx.joints.items() if j["label"] in VOLUME_LIGHT_JOINTS and not j["measurable"]}
    if vols:
        v, k, nm = min(vols)
        vx, kx, nmx = max(vols)
        lights["deform_joint_volume"] = light(th["deform_joint_volume"], v, H)
        detail["deform_joint_volume"] = {"min_ratio": v, "joint": k, "pose": nm, "max_ratio": vx, "max_joint": kx, "max_pose": nmx,
                                         "not_measurable": unmeasured,
                                         "method": f"ball occupancy, r = {pr.ball_factor} x limb radius",
                                         "note": "max_ratio > 1: neighbouring parts moved into the ball (not a volume gain)"}
    else:
        not_eval.append("deform_joint_volume")
        detail["deform_joint_volume"] = {"not_measurable": unmeasured}
    # candy wrapper
    tw = []
    for nm in names:
        for t in cx.tags.get(nm, []):
            if t.startswith("forearm_twist_"):
                s = t[len("forearm_twist_"):]
                c = candy[nm].get(s)
                if c and c["min"] is not None:
                    tw.append((c["min"], s, nm, c["at"]))
    if tw:
        v, s, nm, at = min(tw)
        col = light(th["deform_candy_wrapper"], v, H)
        caps = {sd: cx.twist[sd]["note"] for sd in SIDES if cx.twist[sd]["note"]}
        if caps and col == "green":
            col = "yellow"
        lights["deform_candy_wrapper"] = col
        detail["deform_candy_wrapper"] = {"min_ratio": v, "side": s, "pose": nm, "slice": at, "slices": list(cx.pr.candy_t) + ["wrist"],
                                          "twist": {sd: cx.twist[sd] for sd in SIDES},
                                          "capped_at_yellow": caps or None}
    else:
        not_eval.append("deform_candy_wrapper")
    # penetrations
    if with_penetration:
        def pair_at(w):
            return per_pose[w["pose"]][w["region"]]["penetration"].get("pair") if w else None

        if standard:
            v, w = worst(lambda m: m["penetration"]["n_tris"], standard)
            lights["deform_penetration_standard"] = light(th["deform_penetration_standard"], v, H)
            detail["deform_penetration_standard"] = {"max_faces": v, "at": w, "pair": pair_at(w), "eps_m": pr.pen_eps}
        else:
            not_eval.append("deform_penetration_standard")
        v, w = worst(lambda m: m["penetration"]["max_depth"], extreme)
        lights["deform_penetration_extreme_depth"] = light(th["deform_penetration_extreme_depth"], v, H)
        cv, cw = worst(lambda m: m["contacts"]["max_depth"], names)
        detail["deform_penetration_extreme_depth"] = {"max_depth_m": v, "at": w, "pair": pair_at(w), "eps_m": pr.pen_eps,
                                                      "deepest_contact_m": cv, "deepest_contact_at": cw}
    else:
        not_eval += ["deform_penetration_standard", "deform_penetration_extreme_depth"]
    v, w = worst(lambda m: m["seam_crack_max"], names)
    lights["deform_seam_crack"] = light(th["deform_seam_crack"], v, H)
    detail["deform_seam_crack"] = {"max_m": v, "at": w}
    gvals = [(abs(z), z, s, nm) for nm, g in ground.items() for s, z in g.items() if z is not None]
    if gvals:
        _, z, s, nm = max(gvals)
        lights["deform_ground_contact"] = light(th["deform_ground_contact"], z / 1000.0, H)
        detail["deform_ground_contact"] = {"worst_mm": z, "side": s, "pose": nm}
    else:
        not_eval.append("deform_ground_contact")
    core = [b for i, b in enumerate(cx.bone_names) if (cx.deform is None or cx.deform[i]) and b not in cx.exempt_heads]
    out_d, out_at = 0.0, None
    outside_by_pose = {}
    for nm in names:
        o = {b: heads[nm][b]["dist_mm"] for b in core if b in heads[nm] and not heads[nm][b]["inside"]}
        if o:
            outside_by_pose[nm] = o
            b = max(o, key=o.get)
            if o[b] / 1000.0 > out_d:
                out_d, out_at = o[b] / 1000.0, {"pose": nm, "bone": b}
    lights["joint_core_heads_inside"] = light(th["joint_core_heads_inside"], out_d, H)
    detail["joint_core_heads_inside"] = {"max_outside_m": out_d, "at": out_at, "yellow_band_m": pr.heads_band,
                                         "outside_by_pose_mm": outside_by_pose, "exempt": cx.exempt_heads}
    return {k: v for k, v in lights.items() if v is not None}, detail, not_eval


def _leak_doc(lk: dict, pr: Params, regions: bool = True) -> dict:
    """JSON part of a ``Context.limb_leak`` result (no mask) with the band and the gate regions; ``regions`` False drops the
    per-region table."""
    out = {k: v for k, v in lk.items() if k != "mask" and (regions or k != "by_region")}
    if lk.get("measured"):
        out.update(band=pr.leak_band, gate_regions=pr.leak_gate_regions)
    return out


def _region_leak(lk: dict, region: str) -> dict | None:
    """One region's leaking rows of a ``Context.limb_leak`` result ({"rows": 0} when it has none; None when not measured)."""
    if not lk.get("measured"):
        return None
    return dict(lk["by_region"].get(region) or {"rows": 0})


def run(mesh_path, poses_path, weights_path, out_dir, regions_path=None, region_map=None, candidates=None,
        thresholds_path=DEFAULT_THRESHOLDS, exempt_regions=(), exempt_heads=(), legacy_d01=False, with_penetration=True,
        write_fields=True, ball_factor=None, garments=None, garments_json=None, skeleton=None, chains=None,
        garment_rows=None) -> dict:
    """Compute everything and write metrics.json, regions.npz, region_scores.json, region_scores_detail.json (+ vertex_fields.npz).
    ``garments`` (garments.npz; + ``garments_json``, and ``skeleton`` or ``chains`` for the chain bone -> piece map) adds the
    garment metrics (``summary.garments`` and the ``garment_*`` lights; chain-bone regions are never "not exercised"); without it
    nothing else changes. ``garment_rows`` (garments.npz of S3g, the S7 scoring pass) moves the garment rows into one region that
    gets no score (``Context._garment_region``). Returns a summary."""
    t0 = time.time()
    os.makedirs(out_dir, exist_ok=True)
    mesh = npzio.load_mesh(mesh_path)
    poses = npzio.load_poses(poses_path)
    weights = npzio.load_weights(weights_path)
    regions = load_regions_npz(regions_path) if regions_path else None
    th = load_thresholds(thresholds_path)
    grows = None
    if garment_rows:
        with np.load(garment_rows, allow_pickle=False) as z:
            grows = np.asarray(z["piece"]) >= 0
    cx = Context(mesh, poses, weights, region_map=region_map, regions=regions, exempt_regions=exempt_regions,
                 exempt_heads=exempt_heads, th=th, ball_factor=ball_factor, garment_rows=grows)
    names = cx.pose_names
    P_all = np.asarray(poses["P"], dtype=np.float64)
    gx = GarmentContext(cx, load_garments(garments, garments_json, skeleton, chains)) if garments else None
    g_pose = {}

    per_pose, ground, candy, heads, parts = {}, {}, {}, {}, {}
    fields = {k: [] for k in ("stretch", "compress", "area", "penetration", "contact", "torn")}
    joints_vol = {k: {} for k in cx.joints}
    n_pen, n_cont, margin = {}, {}, {}
    for pi, nm in enumerate(names):
        pm = pose_metrics(cx, P_all[pi], pi, with_penetration=with_penetration, fields=write_fields, keep_pen=gx is not None)
        if gx is not None:
            g_pose[nm] = garment_pose(gx, cx, pm.pop("Pw"), pm.pop("pen"))
        per_pose[nm] = pm["regions"]
        for k, v in pm["joints"].items():
            joints_vol[k][nm] = v
        ground[nm] = pm["ground"]
        candy[nm] = pm["candy"]
        heads[nm] = heads_inside(cx, P_all[pi], cx.pose_heads[pi])
        n_pen[nm], n_cont[nm] = pm["penetration_pairs"], pm["contact_pairs"]
        if pm["penetration_margin"] is not None:
            margin[nm] = pm["penetration_margin"]
        for r, p in pm["score_parts"].items():
            parts.setdefault(r, []).append(p)
        if write_fields:
            for k in fields:
                fields[k].append(pm["fields"][k])

    # ---------------------------------------------------------------- region scores
    primary = str(weights["meta"].get("candidate") or "primary")
    summ = {r: {primary: score_summary(v, names, cx.pr)} for r, v in parts.items() if r not in (MESH_REGION, GARMENT_REGION)}
    rough = {primary: roughness(cx, cx.W)}
    leaks = {primary: cx.limb_leak(cx.W, cx.w_bones)}
    order = [primary]
    cand_info = {}
    lbs_check = None
    if cx.pose_mats is not None and cx.rest_mats is not None:
        bidx = [cx.bone_names.index(b) if b in cx.bone_names else -1 for b in cx.w_bones]
        if min(bidx) >= 0:
            P_lbs = lbs(cx.rest, exporter_rule(cx.W), bidx, cx.pose_mats, cx.rest_mats)
            lbs_check = float(np.abs(P_lbs - P_all).max())
    for cname, cpath in (candidates or {}).items():
        if cname in order:
            raise ValueError(f"candidate name {cname!r} is used twice (the primary candidate is {primary!r})")
        cw = npzio.load_weights(cpath)
        if cx.pose_mats is None:
            raise ValueError("candidate scoring needs pose_mats/rest_mats in poses.npz")
        cb = [str(b) for b in cw["bones"]]
        missing = [b for b in cb if b not in cx.bone_names]
        if missing:
            raise ValueError(f"candidate {cname}: bones not in poses.npz: {missing}")
        Pc = lbs(cx.rest, exporter_rule(cw["W"]), [cx.bone_names.index(b) for b in cb], cx.pose_mats, cx.rest_mats)
        cparts = {}
        for pi, nm in enumerate(names):
            pm = pose_metrics(cx, Pc[pi], pi, with_penetration=with_penetration, fields=False)
            for r, p in pm["score_parts"].items():
                cparts.setdefault(r, []).append(p)
        for r, v in cparts.items():
            if r not in (MESH_REGION, GARMENT_REGION):
                summ.setdefault(r, {})[cname] = score_summary(v, names, cx.pr)
        rough[cname] = roughness(cx, cw["W"])
        leaks[cname] = cx.limb_leak(cw["W"], cb)
        order.append(cname)
        cand_info[cname] = {"weights": os.path.abspath(cpath), "candidate_meta": cw["meta"]}
    scores, detail_regions, flag_g2 = {}, {}, []
    exercise = region_exercise(cx)
    not_exercised = [r for r in summ if exercise.get(r, {}).get("exercised") is False]
    chain_ne = []
    if gx is not None:  # phase G: chain-bone regions move with the chain poses / leg push, not with the body joints: never a
        chain_regions = {cx.region_map.get(b, b) for b in (gx.g.get("bone_piece") or {})}  # "not exercised" G2 question
        chain_ne = [r for r in not_exercised if r in chain_regions]
        not_exercised = [r for r in not_exercised if r not in chain_regions]
    for r, sm in summ.items():
        ri = cx.region_names.index(r)
        rr = {c: float(rough[c][ri]) for c in sm}
        lk = None
        if r in cx.pr.leak_gate_regions and all(leaks[c].get("measured") for c in sm):
            lk = {c: int((leaks[c]["mask"] & cx.masks[ri]).sum()) for c in sm}
        sc, dec = decide_region(sm, rr, order, cx.pr, exercised=r not in not_exercised, leak=lk)
        scores[r] = sc
        detail_regions[r] = {"candidates": {c: {**sm[c], "roughness": rr[c], "limb_leak": _region_leak(leaks[c], r), "score": sc[c],
                                                "rank": dec["ranking"].index(c)} for c in sm},
                             "decision": {k: v for k, v in dec.items() if k != "soft_eff"},
                             "soft_eff": dec["soft_eff"], "exercise": exercise.get(r)}
        if dec["flag_g2"] and (len(sm) > 1 or dec["not_exercised"]):
            flag_g2.append(r)

    lights, ldetail, not_eval = compute_lights(cx, per_pose, joints_vol, candy, ground, heads, with_penetration)
    leak0 = _leak_doc(leaks[primary], cx.pr)
    if leak0.get("measured") and "weights_limb_leak" in th:
        lights["weights_limb_leak"] = light(th["weights_limb_leak"], leak0["rows"], cx.H)
        worst = max(leak0["by_region"].items(), key=lambda kv: kv[1]["rows"]) if leak0["by_region"] else None
        ldetail["weights_limb_leak"] = {"rows": leak0["rows"], "w_max": leak0["w_max"],
                                        "by_limb": {k: v["rows"] for k, v in leak0["by_limb"].items()},
                                        "worst_region": {"region": worst[0], **worst[1]} if worst else None,
                                        "definition": "welded rows nearest a non-limb bone with >= w_min of the upper-arm unit "
                                                      "beyond arm_rel x its length, or of the thigh above thigh_rel thigh lengths"}
    else:
        not_eval.append("weights_limb_leak")
    mirror = volume_mirror(cx, joints_vol, names)
    g_summary = None
    if gx is not None:
        g_summary, g_lights = garment_summary(gx, cx, g_pose, garment_weights(gx, cx, cx.W, cx.w_bones), th)
        g_summary["chain_regions_not_exercised"] = chain_ne
        lights.update(g_lights)
        ldetail.update(g_summary.pop("lights_detail"))
        not_eval += [k for k in GARMENT_LIGHTS if k not in g_lights]

    def jentry(k, j):
        ent = {kk: j.get(kk) for kk in ("child", "parent", "label", "side", "measurable", "reason", "ball_factor", "r_limb",
                                         "rest_occupancy", "n_points", "island")}
        ent["radius_m"] = j.get("radius")
        vals = {nm: v for nm, v in joints_vol[k].items() if v is not None}
        ent["ratio"] = joints_vol[k] if j["measurable"] else {}
        ent["min_ratio"] = min(vals.values()) if vals else None
        ent["min_pose"] = min(vals, key=vals.get) if vals else None
        ent["max_ratio"] = max(vals.values()) if vals else None
        ent["max_pose"] = max(vals, key=vals.get) if vals else None
        return ent

    doc = {
        "schema": SCHEMA,
        "asset_id": cx.asset_id,
        "H": cx.H,
        "poses": per_pose,
        "joints": {
            "volume": {k: jentry(k, j) for k, j in cx.joints.items()},
            "volume_mirror": mirror,
            "heads_inside": {"exempt": cx.exempt_heads, "tested": [b for i, b in enumerate(cx.bone_names)
                                                                   if cx.deform is None or cx.deform[i]], "per_pose": heads},
        },
        "ground_contact_mm": ground,
        "candy_wrapper": candy,
        "twist": cx.twist,
        "summary": {
            "n_poses": len(names), "pose_names": names, "regions": cx.region_names, "region_source": cx.region_source,
            "exempt": {"regions": cx.exempt_regions, "heads": cx.exempt_heads}, "n_vertices": cx.n, "n_welded": cx.n_w,
            "n_faces": int(len(cx.Fw)), "n_islands": cx.n_islands, "n_edges": int(len(cx.e)),
            "n_sliver_faces_skipped": int((cx.face_area_ok & ~cx.nonsliver).sum()),
            "rest_reference": "poses.npz pose " + names[cx.rest_index] if cx.rest_index is not None else "mesh.npz V",
            "lights_detail": ldetail, "lights_not_evaluated": not_eval, "lbs_vs_eval_max_m": lbs_check,
            "params": cx.pr.as_dict(), "penetration": bool(with_penetration),
            "penetration_pairs": n_pen, "contact_pairs": n_cont,
            "penetration_margin": {"note": "inside test = winding number vs the closed target surface; min_margin = smallest "
                                           "w - 0.5 of the counted vertices of the pose, deepest = the deepest counted pair",
                                   "per_pose": margin},
            "primary_candidate": primary, "region_scores_flag_g2": flag_g2, "weights_limb_leak": leak0,
            "not_exercised": not_exercised, "region_exercise": exercise,
            "per_pose_mesh": {nm: {k: per_pose[nm][MESH_REGION][k] for k in ("stretch_max", "stretch_min", "edge_growth_max_mm",
                                                                            "edge_growth_p99_mm", "n_torn", "penetration",
                                                                            "contacts")} for nm in names},
        },
        "lights": lights,
        "candidates": cand_info,
        "inputs": {"mesh": os.path.abspath(mesh_path), "poses": os.path.abspath(poses_path), "weights": os.path.abspath(weights_path),
                   "regions": os.path.abspath(regions_path) if regions_path else None, "thresholds": os.path.abspath(thresholds_path)},
    }
    if g_summary is not None:
        doc["summary"]["garments"] = g_summary
        doc["inputs"]["garments"] = g_summary["sources"]
    if legacy_d01:
        from solvers import legacy_d01

        doc["legacy_d01"] = legacy_d01.report(cx, P_all, names)
    schema.validate_metrics(doc)
    npzio.write_json(os.path.join(out_dir, "metrics.json"), doc)
    cx.regions_npz(os.path.join(out_dir, "regions.npz"))
    npzio.write_json(os.path.join(out_dir, "region_scores.json"), scores)
    pr = cx.pr
    npzio.write_json(os.path.join(out_dir, "region_scores_detail.json"), {
        "schema": SCHEMA, "asset_id": cx.asset_id, "candidates": order, "primary": primary,
        "definition": f"per region and candidate, in order: 0 not exercised (every joint at the region's bones turns < "
                      f"{pr.not_exercised_deg:g} deg in every pose): same score {NOT_EXERCISED_SCORE} for every candidate, no winner, "
                      "flagged for G2; 1 seam cracks must be 0; 1b limb-leak gate: in the gate regions (limb_leak.gate_regions) a "
                      f"candidate with more than {pr.leak_band:g} leaking rows in the region is dropped (ranks after the others) "
                      "unless every candidate has (then the region is flagged for G2); 2 less tearing: tear length = sum over torn "
                      "edges of (posed length - 1.5 x rest), units of 1e-4 H (worst pose, then sum over poses), values within "
                      f"max({100 * pr.tear_tie_rel:g}% of the smaller, {pr.tear_tie_abs:g} units) are equal (tie classes); "
                      "3 penetration-depth tier 0 / < 0.5% H / deeper; 4 soft = PM4(edge excess) + PM4_area(area excess) + "
                      f"max(0, 0.85 - joint volume); 5 within {100 * pr.near_tie:g}% of the best soft score: smoother weights win, "
                      "region flagged for G2 (decided_by 'equivalent', no flag, when the tied candidates behave identically)",
        "encoding": "score = 2e14*seam_fail + 1e14*leak_drop + 1e8*tw + 10*ts + tier + s/(1+s), tw / ts = tie-class minima of "
                    "tear_worst / tear_sum; near tie: s = s_best + band*k/|tie| for the k-th smoothest; lower is better; not "
                    f"exercised: {NOT_EXERCISED_SCORE} for every candidate",
        "for_skin_select": "regions in not_exercised carry equal scores: no preference - keep them on the default / rule-based "
                           "candidate or let G2 decide; do not read the candidate order as a choice",
        "not_exercised": not_exercised, "flag_g2": flag_g2,
        "limb_leak": {"band": pr.leak_band, "gate_regions": pr.leak_gate_regions, "params": pr.leak_params,
                      "candidates": {c: _leak_doc(leaks[c], pr, regions=False) for c in order},
                      "leak_flagged": sorted(r for r, d in detail_regions.items() if d["decision"]["leak_gate"]["all_leak"]),
                      "dropped": {r: d["decision"]["leak_gate"]["dropped"] for r, d in detail_regions.items()
                                  if d["decision"]["leak_gate"]["dropped"]}},
        "regions": detail_regions})
    if write_fields:
        save_npz(os.path.join(out_dir, "vertex_fields.npz"), {
            "names": np.array(names),
            **{k: np.array(fields[k], dtype=np.float32) for k in ("stretch", "compress", "area", "penetration")},
            **{k: np.array(fields[k], dtype=np.uint8) for k in ("contact", "torn")},
            "region_of_vertex": cx.region_of[cx.weld].astype(np.int16), "region_names": np.array(cx.region_names),
            "meta": np.array(json.dumps({"schema": SCHEMA, "note": "per original vertex and pose; see solvers/metrics.py"}))})
    return {"ok": True, "out_dir": os.path.abspath(out_dir), "n_poses": len(names), "lights": lights,
            "lbs_vs_eval_max_m": lbs_check, "flag_g2": flag_g2, "not_exercised": not_exercised, "candidates": order,
            "seconds": round(time.time() - t0, 2)}


def _parse_candidates(items, files=()):
    """{name: path} from ``--candidate NAME=weights.npz`` items and ``--candidate-file weights.npz`` paths (named by their
    ``meta.candidate``, the key B's skin_select maps by)."""
    out = {}
    for it in items or []:
        if "=" not in it:
            raise ValueError(f"--candidate expects NAME=weights.npz, got {it!r}")
        k, v = it.split("=", 1)
        out[k] = v
    for p in files or []:
        k = npzio.load_weights(p)["meta"].get("candidate")
        if not k:
            raise ValueError(f"--candidate-file {p}: weights meta has no 'candidate' name")
        if k in out:
            raise ValueError(f"--candidate-file {p}: candidate name {k!r} is used twice")
        out[str(k)] = p
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description="S7 deformation metrics (rigkit-env)")
    ap.add_argument("--mesh", required=True)
    ap.add_argument("--poses", required=True)
    ap.add_argument("--weights", required=True, help="weights that produced poses.npz P (emulated exporter weights)")
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("--regions", help="explicit regions.npz (names + masks over welded ids)")
    ap.add_argument("--region-map", help="JSON {bone: region}")
    ap.add_argument("--candidate", action="append", help="NAME=weights.npz, scored with the same regions (repeatable)")
    ap.add_argument("--candidate-file", action="append",
                    help="weights.npz scored under its own meta.candidate (repeatable; the keys B's skin_select maps by)")
    ap.add_argument("--thresholds", default=DEFAULT_THRESHOLDS)
    ap.add_argument("--exempt-regions", default="", help="comma list: left out of the lights, still reported")
    ap.add_argument("--exempt-heads", default="", help="comma list of bones exempt from the heads-inside test (thin parts)")
    ap.add_argument("--ball-factor", type=float, help="joint-volume ball radius / limb radius (default: thresholds.json, 0.8)")
    ap.add_argument("--legacy-d01", action="store_true", help="also compute the D01 v4 definitions (solvers/legacy_d01.py)")
    ap.add_argument("--no-penetration", action="store_true")
    ap.add_argument("--no-fields", action="store_true")
    ap.add_argument("--garments", help="garments.npz of S3g (phase G): garment metrics and garment_* lights")
    ap.add_argument("--garments-json", help="garments.json (piece ids, classes, hem loops)")
    ap.add_argument("--skeleton", help="skeleton.json with the chain bones (bone -> piece map for garment_bleed / coverage)")
    ap.add_argument("--chains", help="chains.json (bone -> piece map) when no --skeleton is given")
    ap.add_argument("--garment-rows", help="garments.npz of S3g: garment rows leave the scored regions (S7 scoring pass, phase G)")
    a = ap.parse_args(argv)
    try:
        rmap = None
        if a.region_map:
            with open(a.region_map, "rb") as f:
                rmap = json.loads(f.read().decode("utf-8"))
        res = run(a.mesh, a.poses, a.weights, a.out_dir, regions_path=a.regions, region_map=rmap,
                  candidates=_parse_candidates(a.candidate, a.candidate_file), thresholds_path=a.thresholds,
                  exempt_regions=[x for x in a.exempt_regions.split(",") if x],
                  exempt_heads=[x for x in a.exempt_heads.split(",") if x], legacy_d01=a.legacy_d01,
                  with_penetration=not a.no_penetration, write_fields=not a.no_fields, ball_factor=a.ball_factor,
                  garments=a.garments, garments_json=a.garments_json, skeleton=a.skeleton, chains=a.chains,
                  garment_rows=a.garment_rows)
    except Exception as e:  # one JSON line, non-zero exit
        print(json.dumps({"ok": False, "error": f"{type(e).__name__}: {e}"}))
        return 1
    print(json.dumps(res, default=schema.json_default))
    return 0


if __name__ == "__main__":
    sys.exit(main())
