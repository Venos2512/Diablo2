r"""rigkit.render - S7 QA sheets: headless Workbench renders in Blender + composition with Pillow in rigkit-env (port of D01
q1_render.py / q2_compose.py, generalized).

Three parts in one module plus the S3 flag tiles (``bpy`` and ``PIL`` are imported lazily):

* ``plan_shots`` (pure numpy; Blender or rigkit-env): the list of shots ("jobs") from poses.npz (+ the emulated weights,
  vertex_fields.npz and metrics.json). Every job is JSON: ``{name, pose (None = rest), shade texture|flat|lit, color (None |
  ["dominant"|"blend"|"influences"] | ["bone", name] | ["stretch"|"pen"|"area", pose]), view, box [[lo], [hi]] (world, framed by
  its bounding box), res, margin, xray}``. Pose boxes come from the evaluated positions stored in poses.npz, so a plan needs no
  Blender state. Shots:
    skel_<view>              rest, texture, front / side / back (the skeleton overlay is drawn at compose time)
    w_<kind>_<view>          weight maps at rest: dominant bone, blend (sum w x bone colour), influence count (1..4)
    b_<bone>_<view>          per-bone weight heat (0 -> 1), zoomed on the bone's weighted vertices
    p_<pose>_<view>          every pose at front, side, fl (3/4 front-left) and arpg
    s_<pose>_<view>          stretch heat map (vertex_fields.npz): blue = compressed, red = stretched (log scale)
    x_<pose>_<view>          penetration map: orange = vertex of a penetrating face, red = vertex newly inside another part
    cut_/cux_<pose>__c<k>_<view>  close-ups (texture / penetration map) of hot-spot CLUSTER k of the worst penetration poses:
                             the hot vertices (newly inside, else of penetrating faces) are clustered greedily (radius 6 % H,
                             deepest first, up to 2 clusters per pose); one close-up per cluster, centred on it
    flag_<k>[c|x]_<view>     tiles of the one-page flag sheet (below); ``c`` = cutaway tile, ``x`` = X-ray tile
  Views (camera offset direction from the target, character front = -Y): front (0,-1,0); side (-1,0,0) = from the character's
  right; left (1,0,0); back (0,1,0); fl (1,-1,0) = 3/4 front-left; fr (-1,-1,0); bl (1,1,0) = 3/4 back-left; br (-1,1,0); arpg
  (0,-1,1.2) = in front and about 50 deg above the horizon (ortho stand-in for the game camera); ``hinge`` = a job's own
  ``view_dir`` (joint-volume tiles: along the posed hinge). A job's ``cut`` (m) clips everything closer to the camera than the
  plane ``cut`` metres from the box centre along the view direction (camera near clip): a CUTAWAY.
* Blender execution, always inside ``rigkit.poses.emulation`` (the file is restored exactly, also on errors): the EMULATED COPY
  is rendered (the source mesh is hidden from the render) with an orthographic camera, square images, Workbench (STUDIO light +
  texture for clean shots; vertex colours for maps; X-ray alpha 0.35 for X-ray tiles). ``info.json`` stores the world->pixel
  projection of every shot.
    - one shot:  ``render`` (opens the file) / ``render_current`` (file already open, e.g. MCP): plan + all jobs in one context;
    - chunked, for MCP calls of <= 20 s each: ``plan_current`` writes ``render_plan.json``; ``render_chunk(out_dir, i0, i1)`` runs
      jobs i0..i1 in its own emulation context and writes ``info_parts/views_<i0>.json``; ``finish_chunks`` merges info.json.
      ``chunk_ranges`` splits a plan by an estimated cost (D01: about 0.1 s per 900 px shot).
* ``compose`` (rigkit-env, Pillow): sheets ``qa_*.jpg`` from info.json + poses.npz + metrics.json: skeleton overlay with labels,
  weight maps (+ legend), per-bone weights grouped (spine, neck/head, arms, legs, aux), one sheet per pose (clean row + skeleton
  row, 4 views, numbers), contact sheet, stretch/penetration sheets, hot-spot close-ups, and the ONE-PAGE FLAG SHEET
  ``qa_flag_sheet.jpg`` for G2: the worst pose per red metric (then yellow; inside a colour in ``FLAG_PRIORITY`` order), at most
  8 tiles, each zoomed on the hot spot and captioned with metric, light, value (word-wrapped), pose and region. Penetration
  tiles are CUTAWAYS captioned "<intruder> into <region>" (metrics' deepest pair): seen from the side the hot spot faces from
  the local body centre (an intrusion behind the head gets a back view), everything in front of the deepest intruding vertex
  clipped away, penetration colours, the intruding piece as dots (hidden intrusions such as a rim inside a closed part); the
  deepest one gets an uncut textured context tile turned 90 deg (wider box) when a slot is left; the standard-pose penetration
  joins it when both point at the same region. A joint-volume tile looks along the posed hinge from outside (the crease in
  profile) and gives the largest ratio next to the smallest; a joint-drift tile (X-ray) marks the outside bone head through the
  mesh. Captions and values are word-wrapped. The header lists the skin-selection G2 flags of metrics.json (regions not
  exercised by any pose, near ties). The full sheets stay as evidence.
* S3 mode ``flag_tiles`` (I2): the vision-check tiles of A2's ``flags.json`` (references/joint-placement.md "Consensus rule"
  step 4). Per tile and landmark: two CONTEXT shots (front, side; solid; a box that also holds the landmark's chain neighbours
  from landmarks.json, e.g. hip and ankle around a knee) and the landmark's own crop (``crops[id]``, widened to a cube when a
  source lies outside A2's crop) from front / side (the landmark's own side) / top (front down), each solid (whole mesh) and
  x-ray (alpha 0.25, clipped to the crop slab along the view). The mesh is flags.json ``inputs.mesh`` (A2's pipeline mesh.npz,
  the frame of the landmark positions); Blender renders it in a TEMPORARY scene that is removed again, so a file open over MCP
  keeps its state. Overlays at compose time through each shot's projection: markers a green, b orange, d blue (hollow when
  sanity-only), provisional red ring, the 0.01 H grid, the section polylines of the tile (yellow), the crop square and the
  other landmarks (grey) in the context shots. Output: ``flag_tile_<k>_<key>.png`` per tile + ``flag_tiles_contact.png``.
    - one shot: ``flag_tiles_render`` (plan + all shots + finish in one Blender call);
    - chunked, for MCP calls of <= 20 s each: ``flag_tiles_plan`` (any Python) -> ``flag_tiles_chunk(out_dir, i0, i1)`` per
      range (Blender) -> ``flag_tiles_finish``; then ``compose_flag_tiles`` (rigkit-env).

Units: metres, Blender frame (Z up, front -Y, left +X). Raw PNGs go to ``<out>/raw``; nothing is written into the rig file.

Run:
  blender -b --factory-startup -P render.py -- render --blend RIG.blend --poses DIR/poses.npz --fields DIR/metrics/vertex_fields.npz
        --metrics DIR/metrics/metrics.json --out-dir DIR/render [--what skel,weights,bones,poses,stretch,pen,closeups,flags]
  blender ... -- plan  --blend RIG.blend --poses ... --out-dir DIR/render [...]      (then, per chunk:)
  blender ... -- chunk --blend RIG.blend --out-dir DIR/render --i0 0 --i1 60         (over MCP: render_chunk on the open file)
  python -I render.py finish --out-dir DIR/render
  python -I render.py compose --out-dir DIR/render --poses DIR/poses.npz --metrics DIR/metrics/metrics.json
  blender ... -- flag_tiles --flags A2DIR/flags.json --out-dir DIR/tiles [--mesh mesh.npz] [--res 560]   (S3 one shot)
  python -I render.py flag_plan --flags A2DIR/flags.json --out-dir DIR/tiles [--max-seconds 15]          (S3 chunked:)
  blender ... -- flag_chunk --out-dir DIR/tiles --i0 0 --i1 43        (over MCP: flag_tiles_chunk on the open file)
  python -I render.py flag_finish --out-dir DIR/tiles
  python -I render.py flag_compose --out-dir DIR/tiles
Each prints one JSON line; exit code 1 on failure.
"""
from __future__ import annotations

import argparse
import colorsys
import glob
import json
import math
import os
import sys
import textwrap
import time

import numpy as np

if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import bpy
    from mathutils import Matrix, Vector
except ImportError:  # plan / finish / compose run in rigkit-env
    bpy = None

from rigcore import npzio  # noqa: E402

VIEW_DIRS = {
    "front": (0.0, -1.0, 0.0),
    "side": (-1.0, 0.0, 0.0),
    "back": (0.0, 1.0, 0.0),
    "fl": (1.0, -1.0, 0.0),
    "fr": (-1.0, -1.0, 0.0),
    "arpg": (0.0, -1.0, 1.2),
    "left": (1.0, 0.0, 0.0),
    "bl": (1.0, 1.0, 0.0),
    "br": (-1.0, 1.0, 0.0),
    "top": (0.0, 0.0, 1.0),
}
VIEW_LABEL = {"front": "front", "side": "side (from the character's right)", "back": "back", "fl": "3/4 front-left",
              "fr": "3/4 front-right", "arpg": "ARPG camera (front, ~50 deg down)", "left": "side (from the character's left)",
              "bl": "3/4 back-left", "br": "3/4 back-right", "top": "top (from above, front down)"}
FACING_VIEWS = ("front", "back", "side", "left", "fl", "fr", "bl", "br")  # horizontal views a flag tile may face a hot spot from
CUT_IN_FRONT_H = 0.002  # cutaway plane this far (fraction of H) in front of the hot spot, toward the camera
POSE_VIEWS = ("front", "side", "fl", "arpg")
CLOSE_VIEWS = ("front", "fl", "side", "fr")
CORE_BASES = {"root", "cog", "pelvis", "spine_01", "spine_02", "chest", "neck", "head", "Clavicle", "UpperArm", "UpperArm_twist",
              "ForeArm", "ForeArm_twist", "Hand", "Thigh", "Calf", "Foot", "Toe"}
WHAT_ALL = ("skel", "weights", "bones", "poses", "stretch", "pen", "closeups", "flags")
WHAT_GARMENT = ("garments", "cloth")  # phase G (not in WHAT_ALL: asked for explicitly, with --garments)
CHAIN_WORDS = ("skirt", "tail", "cape", "charm", "main_hair")
PIECE_RGB = ((0.95, 0.35, 0.25), (0.25, 0.65, 0.95), (0.35, 0.85, 0.35), (0.95, 0.80, 0.20), (0.75, 0.40, 0.90),
             (0.20, 0.85, 0.80), (0.95, 0.55, 0.75), (0.60, 0.75, 0.25), (0.95, 0.60, 0.15), (0.45, 0.50, 0.95))
BODY_RGB = (0.55, 0.55, 0.58)
CLUSTER_RADIUS_H = 0.06
MAX_FLAG_TILES = 8
FLAG_MIN_SPAN_H = 0.22  # smallest flag-tile box (fraction of H): enough body around the hot spot to read it
#: flag-sheet order inside each light colour (red first, then yellow): hidden intrusions first, then tearing, volume, ...
FLAG_PRIORITY = ("deform_penetration_extreme_depth", "deform_penetration_standard", "deform_torn_edges_standard",
                 "deform_torn_edges_extreme", "deform_joint_volume", "deform_candy_wrapper", "deform_area_change",
                 "joint_core_heads_inside", "deform_ground_contact", "deform_seam_crack")
XRAY_ALPHA = 0.35
SHOT_SECONDS_900 = 0.12  # measured on D01 (Workbench, 900 px); chunk_ranges scales it by pixels
CAM_DISTANCE = 10.0  # m: ortho camera distance from the framed box centre

# ============================================================================================================== shared helpers


def side_of(name: str):
    if name.startswith("L_") or name.endswith("_L"):
        return "L"
    if name.startswith("R_") or name.endswith("_R"):
        return "R"
    return None


def base_name(name: str) -> str:
    if name[:2] in ("L_", "R_"):
        return name[2:]
    if name[-2:] in ("_L", "_R"):
        return name[:-2]
    return name


def bone_kind(name: str, deform: bool) -> str:
    """core / aux / socket for colouring: non-deform leaves are sockets (root and cog are core), deform bones outside the
    standard core names are aux."""
    if name in ("root", "cog"):
        return "core"
    if not deform:
        return "socket"
    return "core" if base_name(name) in CORE_BASES else "aux"


def palette(names):
    """Stable high-contrast bone colours: left = cool hues, right = warm hues, centre/aux = greens/yellows (D01 d01_wviz)."""
    out = {}
    ci = wi = mi = 0
    for n in names:
        s = side_of(n)
        if s == "L":
            h = (0.55 + 0.045 * ci) % 1
            ci += 1
            sat, val = 0.85, 0.95 - 0.12 * (ci % 2)
        elif s == "R":
            h = (0.0 + 0.05 * wi) % 1
            wi += 1
            sat, val = 0.9, 0.95 - 0.12 * (wi % 2)
        else:
            h = (0.25 + 0.083 * mi) % 1
            mi += 1
            sat, val = 0.75, 0.9 - 0.1 * (mi % 2)
        out[n] = colorsys.hsv_to_rgb(h, sat, val)
    return out


def is_chain_bone(name: str) -> bool:
    """Chain bone of phase G by the standard chain names (skirt, tail, cape, charm, main_hair, ``<item>_swing``)."""
    n = name[2:] if name[:2] in ("L_", "R_") else name
    return n.endswith("_swing") or any(n.startswith(w + "_") for w in CHAIN_WORDS)


def piece_rgb(k: int):
    return BODY_RGB if k < 0 else PIECE_RGB[k % len(PIECE_RGB)]


def piece_colors(piece_v):
    """(n,3) colours of the per-vertex piece ids (-1 = body, grey)."""
    pv = np.asarray(piece_v, dtype=np.int64)
    return np.array([piece_rgb(int(k)) for k in pv]) if len(pv) else np.zeros((0, 3))


def garment_vertex_pieces(garments_path, mesh_npz):
    """Piece id per ORIGINAL vertex: garments.npz ``piece`` (per welded id) through mesh.npz ``weld``."""
    with np.load(garments_path, allow_pickle=False) as z:
        piece = np.asarray(z["piece"])
    weld = np.asarray(npzio.load_mesh(mesh_npz)["weld"])
    if int(weld.max()) + 1 != len(piece):
        raise ValueError(f"garments.npz has {len(piece)} welded rows, mesh.npz {int(weld.max()) + 1}")
    return piece[weld]


def cloth_poses(poses: dict) -> list:
    """Poses tagged ``garment`` or ``chain`` (rigkit.poses phase G), in poses.npz order."""
    tags = poses["meta"].get("tags", {})
    return [str(n) for n in poses["names"] if {"garment", "chain"} & set(tags.get(str(n), []))]


def heat(t):
    """0..1 -> blue -> green -> yellow -> red (D01 weight heat), array (n,3)."""
    t = np.clip(np.asarray(t, dtype=np.float64), 0, 1)
    r = np.clip(2 * t - 0.5, 0, 1)
    g = np.where(t < 0.5, 2 * t, 2 - 2 * t)
    b = np.clip(1 - 2 * t, 0, 1)
    return np.stack([r, g, b], 1)


def stretch_color(stretch, compress):
    """Diverging colour of the edge ratio deviating most from 1 (log scale, saturates at 0.5x / 2x): blue compressed, light grey
    unchanged, red stretched."""
    s = np.log(np.maximum(stretch, 1e-6))
    c = np.log(np.maximum(compress, 1e-6))
    v = np.where(np.abs(s) >= np.abs(c), s, c) / math.log(2.0)
    v = np.clip(v, -1, 1)
    grey = np.array([0.82, 0.82, 0.84])
    red = np.array([0.9, 0.08, 0.06])
    blue = np.array([0.1, 0.25, 0.95])
    w = np.abs(v)[:, None]
    return np.where(v[:, None] >= 0, grey * (1 - w) + red * w, grey * (1 - w) + blue * w)


def penetration_color(pen, H):
    """-1 none (grey), 0 face of a penetration (orange), > 0 newly inside: red, darker with depth (saturates at 0.5% H)."""
    col = np.tile([0.78, 0.78, 0.80], (len(pen), 1))
    col[pen >= 0] = [1.0, 0.6, 0.05]
    d = np.clip(pen / (0.005 * H), 0, 1)
    ins = pen > 0
    col[ins] = np.stack([1.0 - 0.45 * d[ins], 0.05 * (1 - d[ins]), 0.05 * (1 - d[ins])], 1)
    return col


def area_color(area_dev, band=0.15):
    """|area ratio - 1| of the incident non-sliver faces: grey inside the band, yellow -> red beyond (red at 4 x band)."""
    col = np.tile([0.80, 0.80, 0.82], (len(area_dev), 1))
    t = np.clip((np.asarray(area_dev) - band) / (3 * band), 0, 1)
    out = area_dev > band
    col[out] = np.stack([np.full(out.sum(), 0.95), 0.85 * (1 - t[out]), np.full(out.sum(), 0.05)], 1)
    return col


def bone_groups(names):
    """Sheet groups for per-bone weight maps: spine, neck_head, arm_L/R, leg_L/R, aux (anything else)."""
    g = {"spine": [], "neck_head": [], "arm_L": [], "arm_R": [], "leg_L": [], "leg_R": [], "aux": []}
    for n in names:
        b, s = base_name(n), side_of(n)
        if b in ("pelvis", "spine_01", "spine_02", "chest"):
            g["spine"].append(n)
        elif b in ("neck", "head"):
            g["neck_head"].append(n)
        elif s and b in ("Clavicle", "UpperArm", "UpperArm_twist", "ForeArm", "ForeArm_twist", "Hand"):
            g[f"arm_{s}"].append(n)
        elif s and b in ("Thigh", "Calf", "Foot", "Toe"):
            g[f"leg_{s}"].append(n)
        else:
            g["aux"].append(n)
    return {k: v for k, v in g.items() if v}


def clusters(points, radius: float, weights=None, max_k: int = 2) -> list:
    """Greedy hot-spot clusters of ``points`` (k,3): seed = the heaviest unassigned point (``weights``, default all equal), members
    = unassigned points within ``radius`` of the members' centre (two refinements). Returns up to ``max_k`` index arrays, biggest
    weight first; points in no returned cluster are dropped."""
    P = np.asarray(points, dtype=np.float64).reshape(-1, 3)
    if not len(P):
        return []
    w = np.ones(len(P)) if weights is None else np.asarray(weights, dtype=np.float64)
    free = np.ones(len(P), bool)
    out = []
    while free.any() and len(out) < max_k:
        seed = np.nonzero(free)[0][np.argmax(w[free])]
        c = P[seed]
        for _ in range(3):
            m = free & (np.linalg.norm(P - c, axis=1) <= radius)
            c = P[m].mean(0)
        m = free & (np.linalg.norm(P - c, axis=1) <= radius)
        m[seed] = True
        out.append(np.nonzero(m)[0])
        free &= ~m
    return out


def _box(center, span):
    c = np.asarray(center, dtype=np.float64)
    return [(c - span / 2).tolist(), (c + span / 2).tolist()]


def _bbox(P):
    P = np.asarray(P, dtype=np.float64)
    return [P.min(0).tolist(), P.max(0).tolist()]


def _side_view(name):
    s = side_of(name or "")
    return "fl" if s == "L" else "fr" if s == "R" else "front"


def facing_view(P, hot, H, fallback="front"):
    """The horizontal view (``FACING_VIEWS``) whose camera side faces the hot spot's horizontal offset from the local body centre
    (mean of the posed vertices within +-6 % H of the hot spot's height; all vertices when that slab is empty): a hot spot
    behind the head gets a back view. ``fallback`` when the offset is under 2 % H (a hot spot on the body axis)."""
    P = np.asarray(P, dtype=np.float64)
    h = np.asarray(hot, dtype=np.float64)
    slab = np.abs(P[:, 2] - h[2]) <= 0.06 * H
    c = P[slab].mean(0) if slab.any() else P.mean(0)
    o = (h - c)[:2]
    if float(np.linalg.norm(o)) < 0.02 * H:
        return fallback
    o = o / np.linalg.norm(o)
    return max(FACING_VIEWS, key=lambda v: float(np.dot(np.asarray(VIEW_DIRS[v][:2]) / np.linalg.norm(VIEW_DIRS[v][:2]), o)))


def context_view(view, hot, P):
    """The horizontal view at 90 deg to ``view`` on the side of the hot spot's x/y offset from the body centre (the first one
    without a hot spot): a cutaway from behind gets a side view, where the intruding part and the part it enters lie side by
    side."""
    d = np.asarray(VIEW_DIRS[view][:2], dtype=np.float64)
    perp = [np.array([-d[1], d[0]]), np.array([d[1], -d[0]])]
    if hot is not None:
        o = (np.asarray(hot, dtype=np.float64) - np.asarray(P, dtype=np.float64).mean(0))[:2]
        perp.sort(key=lambda p: -float(np.dot(p, o)))
    p = perp[0] / max(float(np.linalg.norm(perp[0])), 1e-12)
    return max(FACING_VIEWS, key=lambda v: float(np.dot(np.asarray(VIEW_DIRS[v][:2]) / np.linalg.norm(VIEW_DIRS[v][:2]), p)))


def hinge_view(poses: dict, pose: str, bone: str, P):
    """Camera direction along the posed hinge (local X) of ``bone`` (pose_mats of poses.npz), on the side away from the body
    centre so the crease is seen in profile from the outside; None without pose_mats."""
    pm = poses.get("extra", {}).get("pose_mats")
    if pm is None:
        return None
    names = [str(n) for n in poses["names"]]
    bones = [str(b) for b in poses["bone_names"]]
    M = np.asarray(pm[names.index(pose)][bones.index(bone)], dtype=np.float64)
    x = M[:3, 0] / max(float(np.linalg.norm(M[:3, 0])), 1e-12)
    head = M[:3, 3]
    c = np.asarray(P, dtype=np.float64).mean(0)
    return (x if float(np.dot(x, head - c)) >= 0 else -x).tolist()


# ============================================================================================================== planning (numpy)


def plan_flags(poses: dict, fields: dict, metrics: dict, H: float, max_tiles: int = MAX_FLAG_TILES) -> list:
    """Flag-sheet tiles (see the module docstring): red metrics first, then yellow, each colour in ``FLAG_PRIORITY`` order, one
    tile per metric at its worst pose, at most ``max_tiles``. A penetration tile is a CUTAWAY: captioned "<intruder> into
    <region>" from metrics' deepest pair, the camera on the side the hot spot (deepest intruding vertex) faces from the local
    body centre (``facing_view``: a back view for an intrusion behind the head), everything in front of the hot spot clipped
    away (``cut``: the near-clip plane sits ``CUT_IN_FRONT_H`` x H in front of it) and the intruding piece drawn as dots; the
    deepest one gets an uncut textured context tile when a slot is left, turned 90 deg (``context_view``) with a 1.6x wider box
    so both parts are in view. The standard-pose penetration joins the extreme one when both
    point at the same region. A joint-volume tile looks along the posed hinge of the child bone (``hinge_view``) so the crease is
    seen in profile, with the largest ratio next to the smallest. Pure numpy; uses metrics.json ``lights`` /
    ``summary.lights_detail``."""
    names = [str(n) for n in poses["names"]]
    bones = [str(b) for b in poses["bone_names"]]
    fnames = [str(n) for n in fields["names"]] if fields is not None else []
    rnames = [str(r) for r in fields["region_names"]] if fields is not None else []
    rov = np.asarray(fields["region_of_vertex"]) if fields is not None else None
    lights = metrics.get("lights", {})
    det = metrics.get("summary", {}).get("lights_detail", {})
    rank = {k: i for i, k in enumerate(FLAG_PRIORITY)}
    order = [k for col in ("red", "yellow") for k in sorted((k for k, v in lights.items() if v == col),
                                                             key=lambda k: rank.get(k, len(rank)))]
    tiles = []
    cut_done = False

    def P_of(pose):
        return np.asarray(poses["P"][names.index(pose)], dtype=np.float64)

    def head_of(pose, bone):
        return np.asarray(poses["heads"][names.index(pose)][bones.index(bone)], dtype=np.float64)

    def field(kind, pose):
        return np.asarray(fields[kind][fnames.index(pose)]) if fields is not None and pose in fnames else None

    def hot_box(P, mask, weights=None, min_span=FLAG_MIN_SPAN_H * H):
        idx = np.nonzero(mask)[0]
        if not idx.size:
            return None, None
        cl = clusters(P[idx], CLUSTER_RADIUS_H * H, None if weights is None else weights[idx], max_k=1)[0]
        pts = P[idx[cl]]
        c = (pts.min(0) + pts.max(0)) / 2
        return _box(c, max(float(np.ptp(pts, axis=0).max()) * 1.6, min_span)), pts

    for mid in order:
        if len(tiles) >= max_tiles:
            break
        d = det.get(mid, {})
        at = d.get("at") or {}
        pose, region = at.get("pose") or d.get("pose"), at.get("region")
        if pose not in names:
            continue
        P = P_of(pose)
        tile = {"metric": mid, "light": lights[mid], "pose": pose, "region": region, "xray": False, "dots": [], "view": "front",
                "color": None, "shade": "texture", "cut": None, "view_dir": None, "view_label": None, "caption": None}
        in_reg = (rov == rnames.index(region)) if (rov is not None and region in rnames) else np.ones(len(P), bool)
        if mid.startswith("deform_torn_edges"):
            torn = field("torn", pose)
            box, _ = hot_box(P, (torn > 0) & in_reg if torn is not None else in_reg)
            v = d.get("max_torn_edges", d.get("n_torn"))
            tile.update(value=f"{v} torn edges" + (f" ({100 * d['max_region_fraction']:.1f}% of the region)"
                                                   if d.get("max_region_fraction") is not None else ""),
                        color=["stretch", pose], shade="lit", view=_side_view(region))
        elif mid == "deform_area_change":
            ar = field("area", pose)
            box, _ = hot_box(P, (ar > 0.15) & in_reg if ar is not None else in_reg)
            tile.update(value=f"{100 * (d.get('max_area_fraction') or 0):.1f}% of the region's area beyond +-15%",
                        color=["area", pose], shade="lit", view=_side_view(region))
        elif mid == "deform_joint_volume":
            j = metrics.get("joints", {}).get("volume", {}).get(d.get("joint"), {})
            child = j.get("child")
            if child not in bones:
                continue
            r = float(j.get("radius_m") or 0.02 * H)
            box = _box(head_of(pose, child), max(12 * r, FLAG_MIN_SPAN_H * H))
            mx = (f"; largest {d['max_ratio']:.2f} x ({d.get('max_joint')}, {d.get('max_pose')})"
                  if d.get("max_ratio") is not None else "")
            tile.update(region=child, value=f"joint volume {d.get('min_ratio', 0):.2f} x rest ({d.get('joint')}){mx}",
                        color=["stretch", pose], shade="lit", view=_side_view(child))
            vd = hinge_view(poses, pose, child, P)
            if vd is not None:  # along the hinge: the crease in profile, from the outside
                tile.update(view="hinge", view_dir=vd, view_label="along the hinge")
        elif mid == "deform_candy_wrapper":
            hand = next((b for b in bones if side_of(b) == d.get("side") and base_name(b) == "Hand"), None)
            fa = next((b for b in bones if side_of(b) == d.get("side") and base_name(b) == "ForeArm"), None)
            if fa is None:
                continue
            box = _box(head_of(pose, hand or fa), FLAG_MIN_SPAN_H * H)
            cap = d.get("capped_at_yellow")
            tile.update(region=fa, value=f"section {d.get('min_ratio', 0):.2f} x rest at {d.get('slice')}" + (
                f" ({', '.join(sorted(set(cap.values())))})" if cap else ""), color=["stretch", pose], shade="lit",
                view=_side_view(fa))
        elif mid.startswith("deform_penetration"):
            pen = field("penetration", pose)
            if pen is None:
                continue
            pair = d.get("pair") or {}
            twin = next((t for t in tiles if t["metric"].startswith("deform_penetration") and t.get("region") == region), None)
            if twin is not None:  # same intrusion seen by both penetration rows: one tile, both values
                twin["value"] += f"; also {lights[mid]} {mid.replace('deform_', '')}: " + (
                    f"{d.get('max_faces')} faces in {pose}" if d.get("max_faces") is not None else f"{pose}")
                twin["also"] = twin.get("also", []) + [mid]
                continue
            mask = (pen > 0) & in_reg
            if not mask.any():
                mask = pen > 0 if (pen > 0).any() else (pen >= 0)
            box, pts = hot_box(P, mask, np.maximum(pen, 0))
            if box is None:
                continue
            hot = np.asarray(pair["hot"], dtype=np.float64) if pair.get("hot") else P[np.nonzero(mask)[0][np.argmax(pen[mask])]]
            view = facing_view(P, hot, H, _side_view(region))
            dv = np.asarray(VIEW_DIRS[view], dtype=np.float64)
            dv /= np.linalg.norm(dv)
            c = (np.asarray(box[0]) + np.asarray(box[1])) / 2
            depth = d.get("max_depth_m")
            into = f"{pair['intruder']} into {pair['into']}" if pair.get("intruder") else (region or "")
            val = f"{1000 * depth:.2f} mm deep" if depth is not None else f"{d.get('max_faces')} faces"
            if pair.get("intruder") and depth is None and pair.get("depth") is not None:
                val += f", deepest {1000 * pair['depth']:.2f} mm"
            sel = pts if pts is not None else P[mask]
            tile.update(value=f"{val}: {into}", caption=into, color=["pen", pose], shade="lit", view=view,
                        cut=float(np.dot(hot - c, dv) + CUT_IN_FRONT_H * H), hot=hot.tolist(),
                        dots=(sel[np.linspace(0, len(sel) - 1, min(len(sel), 200)).astype(int)].tolist() if len(sel) else []))
            if not cut_done:
                cut_done = True
                tile["deepest"] = True
            tile["box"] = box
            tiles.append(tile)
            continue
        elif mid == "deform_ground_contact":
            foot = next((b for b in bones if side_of(b) == d.get("side") and base_name(b) == "Foot"), None)
            if foot is None:
                continue
            box = _box(head_of(pose, foot), FLAG_MIN_SPAN_H * H)
            tile.update(region=foot, value=f"lowest sole vertex {d.get('worst_mm', 0):+.2f} mm", view="side")
        elif mid == "joint_core_heads_inside":
            b = (d.get("at") or {}).get("bone")
            if b not in bones:
                continue
            h = head_of(pose, b)
            box = _box(h, FLAG_MIN_SPAN_H * H)
            tile.update(region=b, value=f"{b} head {1000 * d.get('max_outside_m', 0):.2f} mm outside the mesh", xray=True,
                        dots=[h.tolist()], shade="lit", color=["stretch", pose], view=_side_view(b))
        elif mid == "deform_seam_crack":
            box = _bbox(P)
            tile.update(value=f"seam crack {1000 * (d.get('max_m') or 0):.3f} mm")
        else:
            continue
        if box is None:
            continue
        tile["box"] = box
        tiles.append(tile)
    if len(tiles) < max_tiles:  # a slot left: an uncut textured context view of the deepest penetration next to its cutaway,
        k = next((i for i, t in enumerate(tiles) if t.get("deepest")), None)  # turned 90 deg and wider: both parts in view
        if k is not None:
            t = tiles[k]
            lo, hi = np.asarray(t["box"][0]), np.asarray(t["box"][1])
            c, half = (lo + hi) / 2, (hi - lo) / 2 * 1.6
            tiles.insert(k, dict(t, cut=None, dots=[], shade="texture", color=None, deepest=False, context=True,
                                 view=context_view(t["view"], t.get("hot"), P_of(t["pose"])),
                                 box=[(c - half).tolist(), (c + half).tolist()]))
    for k, t in enumerate(tiles):
        t["name"] = f"flag_{k}{'c' if t.get('cut') is not None else 'x' if t['xray'] else ''}_{t['view']}"
    return tiles


def plan_shots(poses: dict, W=None, w_names=(), what=WHAT_ALL, fields: dict | None = None, metrics: dict | None = None,
               only=None, res_main=1400, res_pose=900, res_bone=640, garment_v=None) -> dict:
    """Shot list + static info (see the module docstring). ``W`` (n,k) / ``w_names`` = the emulated (exporter-rule) weights, needed
    for the per-bone shots; ``only`` = pose names to shoot (default all). Pure numpy. Returns {"jobs": [...], "info": {...}}."""
    pm = poses["meta"]
    names = [str(n) for n in poses["names"]]
    H = float(pm.get("H") or 1.0)
    ri = pm.get("rest_index", names.index("rest") if "rest" in names else 0)
    rest = np.asarray(poses["P"][ri], dtype=np.float64)
    sel = [nm for nm in names if only is None or nm in only]
    jobs = []
    info = {"schema": 0, "asset_id": pm.get("asset_id"), "H": H, "weights_names": list(w_names), "poses": names,
            "palette": {k: list(v) for k, v in palette(list(w_names)).items()}, "pose_frames": {}, "bone_stats": {},
            "closeups": {}, "flags": []}

    def job(name, pose, shade, color, view, box, res, margin=1.12, xray=False, view_dir=None, cut=None):
        jb = {"name": name, "pose": pose, "shade": shade, "color": color, "view": view, "box": box, "res": res, "margin": margin,
              "xray": xray}
        if view_dir is not None:
            jb["view_dir"] = list(view_dir)
        if cut is not None:
            jb["cut"] = float(cut)
        jobs.append(jb)

    rbox = _bbox(rest)
    if "skel" in what:
        for v in ("front", "side", "back"):
            job(f"skel_{v}", None, "texture", None, v, rbox, res_main)
    if "weights" in what and len(w_names):
        for kind in ("dominant", "blend", "influences"):
            for v in ("front", "side", "back"):
                job(f"w_{kind}_{v}", None, "flat", [kind], v, rbox, 1100)
    if "bones" in what and W is not None:
        for j, nm in enumerate(w_names):
            w = np.asarray(W[:, j])
            s = w > 0.02
            if not s.any():
                continue
            pts = rest[s]
            span = max(float(np.ptp(pts, axis=0).max()), 0.18 * H)
            box = _box((pts.min(0) + pts.max(0)) / 2, span)
            for v in ("front", "side", "back"):
                job(f"b_{nm}_{v}", None, "flat", ["bone", nm], v, box, res_bone, 1.25)
            info["bone_stats"][nm] = {"verts_gt_0.02": int(s.sum()), "verts_gt_0.5": int((w > 0.5).sum()), "max": float(w.max())}
    fnames = [str(n) for n in fields["names"]] if fields is not None else []
    pen_rank = []
    for nm in sel:
        P = np.asarray(poses["P"][names.index(nm)], dtype=np.float64)
        box = _bbox(P)
        info["pose_frames"][nm] = {"bbox_min": box[0], "bbox_max": box[1]}
        if "poses" in what:
            for v in POSE_VIEWS:
                job(f"p_{nm}_{v}", nm, "texture", None, v, box, res_pose)
        if fields is not None and nm in fnames:
            k = fnames.index(nm)
            if "stretch" in what:
                for v in POSE_VIEWS:
                    job(f"s_{nm}_{v}", nm, "lit", ["stretch", nm], v, box, 700)
            pen = np.asarray(fields["penetration"][k])
            if (pen >= 0).any():
                if "pen" in what:
                    for v in POSE_VIEWS:
                        job(f"x_{nm}_{v}", nm, "lit", ["pen", nm], v, box, 700)
                pen_rank.append((float(pen.max()), int((pen >= 0).sum()), nm))
    if "closeups" in what and fields is not None:
        for depth, cnt, nm in sorted(pen_rank, reverse=True)[:4]:
            pen = np.asarray(fields["penetration"][fnames.index(nm)])
            P = np.asarray(poses["P"][names.index(nm)], dtype=np.float64)
            hot = np.nonzero(pen > 0)[0] if (pen > 0).any() else np.nonzero(pen >= 0)[0]
            for ci, members in enumerate(clusters(P[hot], CLUSTER_RADIUS_H * H, np.maximum(pen[hot], 0), max_k=2)):
                pts = P[hot[members]]
                c = (pts.min(0) + pts.max(0)) / 2
                span = max(float(np.ptp(pts, axis=0).max()) * 1.2, 0.12 * H)
                key = f"{nm}__c{ci}"
                info["closeups"][key] = {"pose": nm, "cluster": ci, "center": c.tolist(), "span": span,
                                         "max_depth_m": float(max(pen[hot[members]].max(), 0.0)), "n_vertices": int(len(members))}
                for v in CLOSE_VIEWS:
                    job(f"cut_{key}_{v}", nm, "texture", None, v, _box(c, span), 600, 1.0)
                    job(f"cux_{key}_{v}", nm, "lit", ["pen", nm], v, _box(c, span), 600, 1.0)
    if "flags" in what and metrics is not None:
        tiles = plan_flags(poses, fields, metrics, H)
        for t in tiles:
            job(t["name"], t["pose"], t["shade"], t["color"], t["view"], t["box"], 640, 1.0, t["xray"], t.get("view_dir"), t.get("cut"))
        info["flags"] = tiles
        info["region_flags"] = {"not_exercised": metrics.get("summary", {}).get("not_exercised", []),
                                "flag_g2": metrics.get("summary", {}).get("region_scores_flag_g2", [])}
    if "garments" in what and garment_v is not None:  # phase G: pieces coloured at rest
        for v in POSE_VIEWS:
            job(f"g_piece_{v}", None, "flat", ["piece"], v, rbox, res_pose)
        gv = np.asarray(garment_v)
        info["garments"] = {"pieces": sorted(int(k) for k in np.unique(gv) if k >= 0),
                            "vertices": {str(int(k)): int((gv == k).sum()) for k in np.unique(gv) if k >= 0}}
    if "cloth" in what:  # phase G: cloth poses (garment compounds + chain poses), 4 views each
        have = {j["name"] for j in jobs}
        info["cloth_poses"] = [nm for nm in cloth_poses(poses) if only is None or nm in only]
        for nm in info["cloth_poses"]:
            P = np.asarray(poses["P"][names.index(nm)], dtype=np.float64)
            for v in POSE_VIEWS:
                if f"p_{nm}_{v}" not in have:
                    job(f"p_{nm}_{v}", nm, "texture", None, v, _bbox(P), res_pose)
    return {"jobs": jobs, "info": info}


def chunk_ranges(jobs, max_seconds: float = 15.0, setup_seconds: float = 2.0) -> list:
    """[(i0, i1)] slices of ``jobs`` whose estimated time (SHOT_SECONDS_900 per 900 px shot, scaled by pixels, + setup) stays under
    ``max_seconds``."""
    out, i0, t = [], 0, setup_seconds
    for i, j in enumerate(jobs):
        c = SHOT_SECONDS_900 * (j["res"] / 900.0) ** 2
        if i > i0 and t + c > max_seconds:
            out.append((i0, i))
            i0, t = i, setup_seconds
        t += c
    if i0 < len(jobs):
        out.append((i0, len(jobs)))
    return out


# ============================================================================================================== Blender side


def _scene_setup(res, sc=None):
    sc = bpy.context.scene if sc is None else sc
    sc.render.engine = "BLENDER_WORKBENCH"
    sc.render.resolution_x = sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = "PNG"
    sc.render.film_transparent = False
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
    if sc.world is None:
        sc.world = bpy.data.worlds.new("QA_world")
    sc.world.color = (0.30, 0.30, 0.32)
    sh = sc.display.shading
    sh.light = "STUDIO"
    sh.color_type = "TEXTURE"
    sh.show_shadows = False
    sh.show_cavity = False
    sh.show_object_outline = False
    sh.show_specular_highlight = True
    sh.show_xray = False
    return sc


def _camera(sc):
    cam = bpy.data.objects.get("QA_cam")
    if cam is None:
        cd = bpy.data.cameras.new("QA_cam")
        cd.type = "ORTHO"
        cd.clip_start = 0.01
        cd.clip_end = 50.0
        cam = bpy.data.objects.new("QA_cam", cd)
        sc.collection.objects.link(cam)
    sc.camera = cam
    return cam


class Shooter:
    """Camera framing, colour attributes and render-to-PNG for the emulated copy; keeps the projection of every shot."""

    def __init__(self, copy_ob, raw_dir):
        self.ob = copy_ob
        self.me = copy_ob.data
        self.n = len(self.me.vertices)
        self.raw = raw_dir
        self.sc = _scene_setup(1000)
        self.cam = _camera(self.sc)
        self.views = {}

    def mode(self, kind, xray=False):
        sh = self.sc.display.shading
        if kind == "texture":
            sh.color_type, sh.light = "TEXTURE", "STUDIO"
        elif kind == "flat":
            sh.color_type, sh.light = "VERTEX", "FLAT"
        elif kind == "lit":
            sh.color_type, sh.light = "VERTEX", "STUDIO"
        else:
            raise ValueError(kind)
        sh.show_xray = bool(xray)
        if xray:
            sh.xray_alpha = XRAY_ALPHA

    def colors(self, col):
        ca = self.me.color_attributes.get("qa") or self.me.color_attributes.new("qa", "FLOAT_COLOR", "POINT")
        rgba = np.ones((self.n, 4), dtype=np.float32)
        rgba[:, :3] = col
        ca.data.foreach_set("color", rgba.ravel())
        self.me.color_attributes.active_color = ca
        self.me.color_attributes.render_color_index = list(self.me.color_attributes.keys()).index("qa")
        self.me.update()

    def frame(self, view, box, margin=1.15, view_dir=None, cut=None, up=None, depth=None):
        """Point the camera from ``view`` (or the direction ``view_dir``) at ``box`` ([lo], [hi]) and set the ortho scale to fit
        it. ``cut`` (m) = CUTAWAY: geometry closer to the camera than the plane ``cut`` metres from the box centre along the view
        direction is clipped (near clip plane); None = nothing clipped. ``up`` = the world direction that points up in the image
        (default: as close to +Z as the view allows; needed for the top view); ``depth`` (m) = far clip plane that far behind the
        box centre (None = left as it is)."""
        lo, hi = np.asarray(box[0], dtype=float), np.asarray(box[1], dtype=float)
        d = Vector(view_dir if view_dir is not None else VIEW_DIRS[view]).normalized()
        c = Vector(((lo + hi) / 2).tolist())
        if up is None:
            q = (-d).to_track_quat("-Z", "Y")
        else:  # camera X = forward x up, Y = up (orthogonalized), Z = d (the camera looks along -Z)
            u = Vector(up)
            u = (u - d * u.dot(d)).normalized()
            q = Matrix(((-d).cross(u), u, d)).transposed().to_quaternion()
        R = q.to_matrix()
        right, up = R @ Vector((1, 0, 0)), R @ Vector((0, 1, 0))
        corners = np.array([[x, y, z] for x in (lo[0], hi[0]) for y in (lo[1], hi[1]) for z in (lo[2], hi[2])])
        ext = max(np.ptp(corners @ np.array(right)), np.ptp(corners @ np.array(up)))
        self.cam.location = c + d * CAM_DISTANCE
        self.cam.rotation_mode = "QUATERNION"
        self.cam.rotation_quaternion = q
        self.cam.data.ortho_scale = max(ext * margin, 1e-3)
        self.cam.data.clip_start = 0.01 if cut is None else max(0.01, CAM_DISTANCE - float(cut))
        if depth is not None:
            self.cam.data.clip_end = CAM_DISTANCE + float(depth)
        (bpy.context.view_layer if self.sc == bpy.context.scene else self.sc.view_layers[0]).update()
        return {"center": list(c), "ortho_scale": self.cam.data.ortho_scale, "cut": cut,
                "view_dir": [float(v) for v in d]}

    def projection(self, res):
        """3x4 world -> pixel rows (origin top-left, y down) of the ortho camera at square resolution ``res``."""
        mi = self.cam.matrix_world.inverted()
        m, t, s = mi.to_3x3(), mi.translation, self.cam.data.ortho_scale
        px = [res / s * m[0][k] for k in range(3)] + [res / 2 + res / s * t[0]]
        py = [-res / s * m[1][k] for k in range(3)] + [res / 2 - res / s * t[1]]
        return {"px": px, "py": py, "res": res}

    def shoot(self, name, view, box, res, margin=1.15, view_dir=None, cut=None, up=None, depth=None):
        fr = self.frame(view, box, margin, view_dir, cut, up, depth)
        self.sc.render.resolution_x = self.sc.render.resolution_y = res
        path = os.path.join(self.raw, name + ".png")
        self.sc.render.filepath = path
        bpy.ops.render.render(write_still=True, scene=self.sc.name)
        info = self.projection(res)
        info.update(fr, view=view, file=os.path.basename(path))
        self.views[name] = info
        return info


def _job_colors(color, W, w_names, fields, fnames, H, garment_v=None):
    kind = color[0]
    if kind == "piece":
        if garment_v is None:
            raise ValueError("shot colour 'piece' needs garments.npz + mesh.npz (garment_v)")
        return piece_colors(garment_v)
    if kind in ("dominant", "blend", "influences"):
        pal = palette(w_names)
        Cn = np.array([pal[n] for n in w_names])
        if kind == "dominant":
            return Cn[W.argmax(1)]
        if kind == "blend":
            return W @ Cn
        inf_pal = np.array([[0.5, 0.5, 0.5], [0.25, 0.25, 0.9], [0.2, 0.8, 0.3], [0.95, 0.8, 0.1], [0.95, 0.2, 0.2]])
        return inf_pal[np.clip((W > 1e-6).sum(1), 0, 4)]
    if kind == "bone":
        w = W[:, w_names.index(color[1])]
        col = heat(w)
        col[w <= 1e-6] = (0.12, 0.12, 0.14)
        return col
    if fields is None or color[1] not in fnames:
        raise ValueError(f"shot colour {color} needs vertex_fields.npz with pose {color[1]!r}")
    k = fnames.index(color[1])
    if kind == "stretch":
        return stretch_color(fields["stretch"][k], fields["compress"][k])
    if kind == "pen":
        return penetration_color(fields["penetration"][k], H)
    if kind == "area":
        return area_color(fields["area"][k])
    raise ValueError(f"unknown shot colour {color}")


def _objects(po, mesh=None, runtime=None, control=None):
    from rigkit import bl

    pm = po["meta"]
    me = bpy.data.objects[mesh or pm.get("mesh_object") or bl.find("mesh").name]
    rt = bpy.data.objects[runtime or pm.get("runtime_object") or bl.find("runtime").name]
    ct = bpy.data.objects[control or pm.get("control_object") or bl.find("control").name]
    return me, rt, ct


def render_jobs(jobs, out_dir, po: dict, fields_path=None, mesh=None, runtime=None, control=None, method="gn",
                garment_v=None) -> dict:
    """Run ``jobs`` on the file that is open now, inside ``rigkit.poses.emulation`` (file restored on exit, also on errors).
    Returns {"views": {name: projection}, "seconds", "W_names"}."""
    if bpy is None:
        raise RuntimeError("render_jobs() runs inside Blender")
    t0 = time.time()
    from rigkit import poses as RP

    raw = os.path.join(out_dir, "raw")
    os.makedirs(raw, exist_ok=True)
    pm = po["meta"]
    me, rt, ct = _objects(po, mesh, runtime, control)
    specs = pm.get("specs", {})
    H = float(pm.get("H") or 1.0)
    fields = np.load(fields_path) if fields_path and os.path.exists(fields_path) else None
    fnames = [str(n) for n in fields["names"]] if fields is not None else []
    with RP.emulation(me.name, rt.name, method=method, actions_blend=pm.get("actions_blend")) as emu:
        cp = bpy.data.objects[emu["copy"]]
        pc = RP.PoseContext(ct.name, rt.name, cp.name)
        for o in bpy.data.objects:  # render only the emulated copy
            if o.type == "MESH":
                o.hide_render = o is not cp
        cp.hide_set(False)
        cp.hide_render = False
        rt.hide_render = ct.hide_render = True
        sh = Shooter(cp, raw)
        used = emu["groups_used"]
        W = RP.read_groups_loop(cp, used)
        current = "<none>"
        for jb in jobs:
            if jb["pose"] != current:
                if jb["pose"] is None:
                    pc.reset()
                else:
                    if jb["pose"] not in specs:
                        raise KeyError(f"pose {jb['pose']!r} has no spec in poses.npz meta")
                    pc.apply(specs[jb["pose"]])
                current = jb["pose"]
            if jb["shade"] == "texture":
                sh.mode("texture", jb.get("xray", False))
            else:
                sh.mode(jb["shade"], jb.get("xray", False))
                sh.colors(_job_colors(jb["color"], W, used, fields, fnames, H, garment_v))
            sh.shoot(jb["name"], jb["view"], jb["box"], jb["res"], jb.get("margin", 1.12), jb.get("view_dir"), jb.get("cut"))
        pc.reset()
    return {"views": sh.views, "seconds": round(time.time() - t0, 2), "W_names": used}


def _emulated_weights(po: dict, mesh=None, runtime=None, control=None, method="gn"):
    """(W, names) of the emulated copy (inside an emulation context, file restored)."""
    from rigkit import poses as RP

    me, rt, _ = _objects(po, mesh, runtime, control)
    with RP.emulation(me.name, rt.name, method=method) as emu:
        used = emu["groups_used"]
        W = RP.read_groups_loop(bpy.data.objects[emu["copy"]], used)
    return W, used


def _load_json(path):
    if path and os.path.exists(path):
        with open(path, "rb") as f:
            return json.loads(f.read().decode("utf-8"))
    return None


def render_current(poses_path, out_dir, fields_path=None, metrics_path=None, what=WHAT_ALL, mesh=None, runtime=None, control=None,
                   only=None, method="gn", garments_path=None, mesh_npz=None) -> dict:
    """One shot on the file that is open now: plan + every job in one emulation context; writes raw PNGs and info.json.
    ``garments_path`` + ``mesh_npz`` (phase G) colour the pieces of the ``garments`` shots."""
    if bpy is None:
        raise RuntimeError("render_current() runs inside Blender")
    t0 = time.time()
    po = npzio.load_poses(poses_path)
    fields = np.load(fields_path) if fields_path and os.path.exists(fields_path) else None
    W, names = _emulated_weights(po, mesh, runtime, control, method)
    gv = garment_vertex_pieces(garments_path, mesh_npz) if garments_path and mesh_npz else None
    plan = plan_shots(po, W, names, what, fields, _load_json(metrics_path), only, garment_v=gv)
    res = render_jobs(plan["jobs"], out_dir, po, fields_path, mesh, runtime, control, method, garment_v=gv)
    info = dict(plan["info"], views=res["views"], fields=os.path.abspath(fields_path) if fields_path else None,
                metrics_summary=((_load_json(metrics_path) or {}).get("summary", {}).get("per_pose_mesh")))
    npzio.write_json(os.path.join(out_dir, "info.json"), info)
    counts = {}
    for jb in plan["jobs"]:
        k = jb["name"].split("_")[0]
        counts[k] = counts.get(k, 0) + 1
    return {"ok": True, "out_dir": os.path.abspath(out_dir), "renders": counts, "n_images": len(plan["jobs"]),
            "seconds": round(time.time() - t0, 1)}


def render(blend, poses_path, out_dir, fields_path=None, metrics_path=None, what=WHAT_ALL, mesh=None, runtime=None, control=None,
           only=None, method="gn") -> dict:
    """Headless one-shot path: open ``blend``, then ``render_current``."""
    if bpy is None:
        raise RuntimeError("render() runs inside Blender")
    bpy.ops.wm.open_mainfile(filepath=blend)
    return render_current(poses_path, out_dir, fields_path, metrics_path, what, mesh, runtime, control, only, method)


def plan_current(poses_path, out_dir, fields_path=None, metrics_path=None, what=WHAT_ALL, mesh=None, runtime=None, control=None,
                 only=None, method="gn", max_seconds: float = 15.0, garments_path=None, mesh_npz=None) -> dict:
    """Chunked path, step 1 (Blender, file open): write ``render_plan.json`` (jobs, info, inputs, chunk ranges)."""
    t0 = time.time()
    po = npzio.load_poses(poses_path)
    fields = np.load(fields_path) if fields_path and os.path.exists(fields_path) else None
    W, names = _emulated_weights(po, mesh, runtime, control, method)
    gv = garment_vertex_pieces(garments_path, mesh_npz) if garments_path and mesh_npz else None
    plan = plan_shots(po, W, names, what, fields, _load_json(metrics_path), only, garment_v=gv)
    plan["inputs"] = {"poses": os.path.abspath(poses_path), "fields": os.path.abspath(fields_path) if fields_path else None,
                      "metrics": os.path.abspath(metrics_path) if metrics_path else None, "mesh": mesh, "runtime": runtime,
                      "control": control, "method": method}
    if gv is not None:
        plan["inputs"].update(garments=os.path.abspath(garments_path), mesh_npz=os.path.abspath(mesh_npz))
    plan["chunks"] = chunk_ranges(plan["jobs"], max_seconds)
    os.makedirs(out_dir, exist_ok=True)
    for old in glob.glob(os.path.join(out_dir, "info_parts", "views_*.json")):
        os.remove(old)
    npzio.write_json(os.path.join(out_dir, "render_plan.json"), plan)
    return {"ok": True, "plan": os.path.join(out_dir, "render_plan.json"), "n_jobs": len(plan["jobs"]), "chunks": plan["chunks"],
            "seconds": round(time.time() - t0, 2)}


def render_chunk(out_dir, i0: int, i1: int) -> dict:
    """Chunked path, step 2 (Blender, file open): jobs[i0:i1] of render_plan.json in their own emulation context."""
    plan = _load_json(os.path.join(out_dir, "render_plan.json"))
    if plan is None:
        raise FileNotFoundError(f"no render_plan.json in {out_dir}: run plan_current first")
    inp = plan["inputs"]
    po = npzio.load_poses(inp["poses"])
    gv = garment_vertex_pieces(inp["garments"], inp["mesh_npz"]) if inp.get("garments") else None
    res = render_jobs(plan["jobs"][i0:i1], out_dir, po, inp["fields"], inp["mesh"], inp["runtime"], inp["control"], inp["method"],
                      garment_v=gv)
    npzio.write_json(os.path.join(out_dir, "info_parts", f"views_{i0:05d}.json"), res["views"])
    return {"ok": True, "i0": i0, "i1": i1, "n_images": i1 - i0, "seconds": res["seconds"]}


def finish_chunks(out_dir) -> dict:
    """Chunked path, step 3 (any Python): merge the chunk projections into info.json; fails when a planned shot is missing."""
    plan = _load_json(os.path.join(out_dir, "render_plan.json"))
    views = {}
    for p in sorted(glob.glob(os.path.join(out_dir, "info_parts", "views_*.json"))):
        views.update(_load_json(p))
    missing = [j["name"] for j in plan["jobs"] if j["name"] not in views]
    if missing:
        raise ValueError(f"{len(missing)} planned shots were not rendered, e.g. {missing[:5]}")
    inp = plan["inputs"]
    info = dict(plan["info"], views=views, fields=inp["fields"],
                metrics_summary=((_load_json(inp["metrics"]) or {}).get("summary", {}).get("per_pose_mesh")))
    npzio.write_json(os.path.join(out_dir, "info.json"), info)
    return {"ok": True, "info": os.path.join(out_dir, "info.json"), "n_images": len(views)}


# ============================================================================================================== compose (Pillow)

BG = (38, 38, 42)
FONT = ["C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf"]
FONT_B = ["C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf"]
LIGHT_RGB = {"red": (230, 60, 50), "yellow": (240, 200, 40), "green": (70, 190, 90)}


def _font(sz, bold=False):
    from PIL import ImageFont

    for p in (FONT_B if bold else FONT):
        if os.path.exists(p):
            return ImageFont.truetype(p, sz)
    return ImageFont.load_default()


def wrap_text(text, font, width) -> list:
    """``text`` split into lines no wider than ``width`` pixels in ``font`` (by words; a single longer word gets its own line)."""
    from PIL import Image, ImageDraw

    d = ImageDraw.Draw(Image.new("RGB", (8, 8)))
    rows, cur = [], ""
    for word in str(text).split():
        cand = f"{cur} {word}" if cur else word
        if cur and d.textlength(cand, font=font) > width:
            rows.append(cur)
            cur = word
        else:
            cur = cand
    return rows + [cur] if cur else rows or [""]


class Composer:
    """Sheet helpers (D01 q2_compose port): projections, bone overlay, labels, headers, stacks, legends, save."""

    def __init__(self, out_dir, poses, metrics=None):
        from PIL import Image

        self.Image = Image
        self.out = out_dir
        self.raw = os.path.join(out_dir, "raw")
        with open(os.path.join(out_dir, "info.json"), "rb") as f:
            self.info = json.loads(f.read().decode("utf-8"))
        self.po = poses
        self.metrics = metrics
        self.asset = self.info.get("asset_id") or "asset"
        bn = [str(b) for b in poses["bone_names"]]
        deform = poses["extra"].get("deform")
        parents = poses["extra"].get("parents")
        self.bones = bn
        self.kind = {b: bone_kind(b, bool(deform[i]) if deform is not None else True) for i, b in enumerate(bn)}
        self.parent = {b: (bn[int(parents[i])] if parents is not None and parents[i] >= 0 else None) for i, b in enumerate(bn)}
        self.names = [str(n) for n in poses["names"]]
        self.written = []

    def load(self, name):
        return self.Image.open(os.path.join(self.raw, name + ".png")).convert("RGB")

    def proj(self, name, scale=1.0):
        p = self.info["views"][name]
        px, py = p["px"], p["py"]
        return lambda P: ((px[0] * P[0] + px[1] * P[1] + px[2] * P[2] + px[3]) * scale,
                          (py[0] * P[0] + py[1] * P[1] + py[2] * P[2] + py[3]) * scale)

    def bone_data(self, pose):
        i = self.names.index(pose)
        H, T = self.po["heads"][i], self.po["tails"][i]
        return {b: {"head": H[j].tolist(), "tail": T[j].tolist(), "kind": self.kind[b]} for j, b in enumerate(self.bones)}

    @staticmethod
    def bone_color(name, kind):
        if kind == "socket":
            return (255, 255, 255)
        if kind == "aux":
            return (255, 90, 230)
        s = side_of(name)
        return (40, 220, 255) if s == "L" else (255, 150, 30) if s == "R" else (140, 255, 90)

    def overlay(self, img, pf, bones, width, joints=True):
        from PIL import ImageDraw

        d = ImageDraw.Draw(img, "RGBA")
        pts = {}
        for nm, b in bones.items():
            col = self.bone_color(nm, b["kind"])
            h, t = pf(b["head"]), pf(b["tail"])
            pts[nm] = (h, t, col)
            if b["kind"] == "socket":
                continue
            d.line([h, t], fill=(0, 0, 0, 230), width=width + 4)
            d.line([h, t], fill=col + (255,), width=width)
        r = width * 1.8
        for nm, (h, t, col) in pts.items():
            if bones[nm]["kind"] == "socket":
                q = r * 1.4
                d.polygon([(h[0], h[1] - q), (h[0] + q, h[1]), (h[0], h[1] + q), (h[0] - q, h[1])], fill=(255, 255, 255, 255),
                          outline=(0, 0, 0, 255))
            elif joints:
                d.ellipse([h[0] - r, h[1] - r, h[0] + r, h[1] + r], fill=col + (255,), outline=(0, 0, 0, 255), width=2)
        return pts

    def labels(self, img, pts, fnt, only=None, margin=24):
        """Labels in two side columns with leader lines, pushed apart vertically (D01 place_labels)."""
        from PIL import ImageDraw

        d = ImageDraw.Draw(img, "RGBA")
        W, Hh = img.size
        items = [[nm, h, col, "L" if h[0] < W / 2 else "R"] for nm, (h, t, col) in pts.items() if only is None or nm in only]
        lh = fnt.size + 10
        for side in ("L", "R"):
            col_items = sorted([it for it in items if it[3] == side], key=lambda it: it[1][1])
            ys = [it[1][1] for it in col_items]
            for i in range(1, len(ys)):
                ys[i] = max(ys[i], ys[i - 1] + lh)
            over = (ys[-1] + lh / 2 - (Hh - margin)) if ys else 0
            if over > 0:
                ys[-1] -= over
                for i in range(len(ys) - 2, -1, -1):
                    ys[i] = min(ys[i], ys[i + 1] - lh)
            for it, y in zip(col_items, ys):
                nm, h, col, _ = it
                tw = d.textlength(nm, font=fnt)
                x = margin if side == "L" else W - margin - tw
                box = [x - 6, y - lh / 2 + 2, x + tw + 6, y + lh / 2 - 2]
                ex = box[2] if side == "L" else box[0]
                d.line([(ex, y), h], fill=(0, 0, 0, 200), width=4)
                d.line([(ex, y), h], fill=col + (255,), width=2)
                d.rectangle(box, fill=(20, 20, 24, 215), outline=col + (255,), width=2)
                d.text((x, y - fnt.size / 2 - 1), nm, font=fnt, fill=(255, 255, 255, 255))

    def header(self, img, title, sub=None, h=None):
        from PIL import ImageDraw

        lines = [] if not sub else textwrap.wrap(sub, 175)
        h = h or (60 + 30 * len(lines))
        out = self.Image.new("RGB", (img.width, img.height + h), BG)
        out.paste(img, (0, h))
        d = ImageDraw.Draw(out)
        d.text((24, 10), title, font=_font(30, True), fill=(255, 255, 255))
        for k, ln in enumerate(lines):
            d.text((24, 52 + 30 * k), ln, font=_font(20), fill=(200, 200, 210))
        return out

    def footer(self, img, lines, fs=20, margin=24):
        """``img`` with the text ``lines`` below it, each wrapped by word to the image width (nothing is cut off)."""
        from PIL import ImageDraw

        fnt = _font(fs)
        rows = [r for ln in lines for r in wrap_text(ln, fnt, img.width - 2 * margin)]
        h = (fs + 8) * len(rows) + 20
        out = self.Image.new("RGB", (img.width, img.height + h), BG)
        out.paste(img, (0, 0))
        d = ImageDraw.Draw(out)
        y = img.height + 10
        for ln in rows:
            d.text((margin, y), ln, font=fnt, fill=(215, 215, 225))
            y += fs + 8
        return out

    def titled(self, img, text, fs=22, color=(255, 255, 255), wrap=False):
        """``img`` with ``text`` above it (bold); ``wrap`` = word-wrap to the image width instead of one (clipped) line."""
        from PIL import ImageDraw

        fnt = _font(fs, True)
        rows = wrap_text(text, fnt, img.width - 16) if wrap else [text]
        h = (fs + 6) * len(rows) + 8
        out = self.Image.new("RGB", (img.width, img.height + h), BG)
        out.paste(img, (0, h))
        d = ImageDraw.Draw(out)
        for k, ln in enumerate(rows):
            d.text((8, 4 + (fs + 6) * k), ln, font=fnt, fill=color)
        return out

    def hstack(self, imgs, gap=8):
        out = self.Image.new("RGB", (sum(i.width for i in imgs) + gap * (len(imgs) - 1), max(i.height for i in imgs)), BG)
        x = 0
        for i in imgs:
            out.paste(i, (x, 0))
            x += i.width + gap
        return out

    def vstack(self, imgs, gap=8):
        out = self.Image.new("RGB", (max(i.width for i in imgs), sum(i.height for i in imgs) + gap * (len(imgs) - 1)), BG)
        y = 0
        for i in imgs:
            out.paste(i, (0, y))
            y += i.height + gap
        return out

    def legend(self, items, width, fs=20):
        from PIL import ImageDraw

        probe = self.Image.new("RGB", (10, 10))
        rows, cur = [[]], 24
        for lb, c in items:
            w = ImageDraw.Draw(probe).textlength(lb, font=_font(fs)) + fs + 30
            if cur + w > width - 24:
                rows.append([])
                cur = 24
            rows[-1].append((lb, c, cur))
            cur += w
        img = self.Image.new("RGB", (width, len(rows) * (fs + 14) + 12), BG)
        d = ImageDraw.Draw(img)
        for ri, row in enumerate(rows):
            for lb, c, x in row:
                yy = 8 + ri * (fs + 14)
                d.rectangle([x, yy, x + fs, yy + fs], fill=tuple(int(v) for v in c), outline=(255, 255, 255))
                d.text((x + fs + 8, yy - 3), lb, font=_font(fs), fill=(235, 235, 240))
        return img

    def colorbar(self, width, kind="weight"):
        from PIL import ImageDraw

        im = self.Image.new("RGB", (width, 58), BG)
        d = ImageDraw.Draw(im)
        n = width - 420
        for x in range(n):
            t = x / max(n - 1, 1)
            if kind == "weight":
                c = heat([t])[0]
            else:  # stretch: t 0..1 -> ratio 0.5..2 (log)
                r = 2 ** (2 * t - 1)
                c = stretch_color(np.array([max(r, 1.0)]), np.array([min(r, 1.0)]))[0]
            d.line([(200 + x, 8), (200 + x, 34)], fill=tuple(int(v * 255) for v in c))
        f = _font(20)
        if kind == "weight":
            d.text((24, 8), "weight:", font=f, fill=(255, 255, 255))
            d.text((196, 34), "0", font=_font(18), fill=(230, 230, 230))
            d.text((200 + n - 30, 34), "1.0", font=_font(18), fill=(230, 230, 230))
            d.text((24, 34), "dark = 0", font=_font(18), fill=(170, 170, 170))
        else:
            d.text((24, 8), "edge ratio:", font=f, fill=(255, 255, 255))
            for r in (0.5, 0.8, 1.0, 1.25, 1.5, 2.0):
                x = 200 + (math.log2(r) + 1) / 2 * (n - 1)
                d.line([(x, 30), (x, 38)], fill=(255, 255, 255))
                d.text((x - 14, 36), f"{r:g}", font=_font(16), fill=(230, 230, 230))
        return im

    def save(self, img, name):
        p = os.path.join(self.out, name + ".jpg")
        for _ in range(12):
            try:
                img.save(p, quality=90, subsampling=0)
                break
            except OSError:
                time.sleep(1.0)
        self.written.append(os.path.basename(p))
        return p

    def has(self, name):
        return name in self.info["views"]

    # ---------------------------------------------------------------- sheets
    def skeleton_sheets(self):
        if not self.has("skel_front"):
            return
        rest = self.po["meta"].get("rest_index", 0)
        bones = self.bone_data(self.names[rest])
        leg = [("left (L_*)", (40, 220, 255)), ("right (R_*)", (255, 150, 30)), ("centre", (140, 255, 90)), ("aux", (255, 90, 230)),
               ("white diamond = socket (no weights)", (255, 255, 255))]
        small = []
        key = {b for b in bones if bones[b]["kind"] == "core"}
        for v in ("front", "side", "back"):
            img = self.load(f"skel_{v}")
            pad = 260  # label columns outside the render so they never cover the model
            im = self.Image.new("RGB", (img.width + 2 * pad, img.height), BG)
            im.paste(img, (pad, 0))
            pf0 = self.proj(f"skel_{v}")
            pf = lambda P, pf0=pf0, pad=pad: (pf0(P)[0] + pad, pf0(P)[1])
            pts = self.overlay(im, pf, bones, 5)
            self.labels(im, pts, _font(24, True))
            out = self.header(im, f"{self.asset} - runtime skeleton over the emulated mesh - {VIEW_LABEL[v]}",
                              f"Rest pose, {len(self.bones)} bones; dot = bone head (joint), line = bone. Blender Workbench, ortho camera, "
                              "overlay drawn with the exact projection.")
            self.save(self.vstack([out, self.legend(leg, out.width)], 0), f"qa_skeleton_overlay_{v}")
            im2 = img.resize((img.width // 2, img.height // 2), self.Image.LANCZOS)
            pf2 = self.proj(f"skel_{v}", 0.5)
            pts2 = self.overlay(im2, pf2, bones, 3)
            self.labels(im2, pts2, _font(15, True), only=key)
            small.append(self.titled(im2, VIEW_LABEL[v]))
        three = self.header(self.hstack(small), f"{self.asset} - runtime skeleton, 3 views (labels: core bones)")
        self.save(self.vstack([three, self.legend(leg, three.width)], 0), "qa_skeleton_overlay_3view")

    def weight_sheets(self):
        pal = self.info.get("palette", {})
        if not self.has("w_dominant_front"):
            return
        items = [(n, tuple(int(c * 255) for c in pal[n])) for n in self.info["weights_names"]]
        for kind, title, note in (("dominant", "dominant bone", "Each vertex in the colour of its largest weight (runtime weights)."),
                                  ("blend", "blend", "Colour = sum of w_i x bone colour_i: smooth gradients = interpolated joints."),
                                  ("influences", "influence count", "grey 0, blue 1, green 2, yellow 3, red 4 (glTF maximum).")):
            ims = [self.titled(self.load(f"w_{kind}_{v}").resize((800, 800), self.Image.LANCZOS), VIEW_LABEL[v])
                   for v in ("front", "side", "back")]
            row = self.header(self.hstack(ims), f"{self.asset} - weight map: {title}", note)
            leg = self.legend([("0", (128, 128, 128)), ("1", (64, 64, 230)), ("2", (51, 204, 77)), ("3", (242, 204, 26)),
                               ("4", (242, 51, 51))], row.width) if kind == "influences" else self.legend(items, row.width, 18)
            self.save(self.vstack([row, leg], 0), f"qa_weights_{kind}")
        for gname, bl in bone_groups([b for b in self.info["weights_names"] if b in self.info["bone_stats"]]).items():
            rows = []
            for nm in bl:
                if not self.has(f"b_{nm}_front"):
                    continue
                pans = [self.titled(self.load(f"b_{nm}_{v}").resize((520, 520), self.Image.LANCZOS), f"{nm} - {VIEW_LABEL[v]}", 18)
                        for v in ("front", "side", "back")]
                st = self.info["bone_stats"][nm]
                rows.append(self.titled(self.hstack(pans), f"{nm}: {st['verts_gt_0.02']} vertices > 0.02, {st['verts_gt_0.5']} > 0.5, "
                                                           f"max {st['max']:.2f}", 20))
            if not rows:
                continue
            sheet = self.header(self.vstack(rows, 6), f"{self.asset} - per-bone weights: {gname}",
                                "Heat 0 -> 1 (blue -> red); dark = 0. Each row is zoomed on the bone's weighted vertices.")
            self.save(self.vstack([sheet, self.colorbar(sheet.width)], 0), f"qa_weights_bone_{gname}")

    def _pose_numbers(self, nm):
        if not self.metrics:
            return ""
        m = self.metrics["poses"].get(nm, {}).get("_mesh")
        if not m:
            return ""
        pen = m["penetration"]
        con = m.get("contacts") or {}
        return (f"edge ratio {m['stretch_min']:.2f}..{m['stretch_max']:.2f}, torn edges {m.get('n_torn', '?')}, max growth "
                f"{m['edge_growth_max_mm']:.1f} mm (p99 {m['edge_growth_p99_mm']:.1f}), penetrating faces {pen['n_tris']} "
                f"(depth {1000 * (pen['max_depth'] or 0):.2f} mm), contacts {con.get('n_tris', '?')}")

    def pose_sheets(self):
        specs = self.po["meta"].get("specs", {})
        cells = []
        for nm in self.names:
            if not self.has(f"p_{nm}_front"):
                continue
            bones = self.bone_data(nm)
            clean, skel = [], []
            for v in POSE_VIEWS:
                key = f"p_{nm}_{v}"
                img = self.load(key)
                k = 640 / img.width
                img = img.resize((640, 640), self.Image.LANCZOS)
                pf = self.proj(key, k)
                clean.append(self.titled(img, VIEW_LABEL[v], 18))
                sk = img.copy()
                self.overlay(sk, pf, bones, 2)
                skel.append(self.titled(sk, VIEW_LABEL[v] + " + runtime skeleton", 18))
            sheet = self.vstack([self.hstack(clean), self.hstack(skel)], 6)
            sp = specs.get(nm, {})
            desc = "; ".join(_op_text(op) for op in sp.get("ops", [])) or "rest"
            sheet = self.header(sheet, f"{self.asset} - QA pose: {nm}  [{', '.join(sp.get('tags', []))}]", desc)
            sheet = self.footer(sheet, [self._pose_numbers(nm),
                                        "Static QA pose through the control rig, evaluated under runtime emulation (LBS, top-4 "
                                        "weights). Workbench render."])
            self.save(sheet, f"qa_pose_{nm}")
            a = self.load(f"p_{nm}_front").resize((300, 300), self.Image.LANCZOS)
            b = self.load(f"p_{nm}_arpg").resize((300, 300), self.Image.LANCZOS)
            cells.append(self.titled(self.hstack([a, b], 2), nm, 18))
        if cells:
            per = 6
            rows = [self.hstack(cells[i:i + per], 8) for i in range(0, len(cells), per)]
            self.save(self.header(self.vstack(rows, 8), f"{self.asset} - QA poses (front | ARPG camera)",
                                  f"{len(cells)} poses; one sheet per pose: qa_pose_<name>.jpg"), "qa_pose_contact_sheet")

    def map_sheets(self):
        for prefix, title, note, kind in (("s", "stretch heat map", "Edge ratio around each vertex (largest deviation from 1, log scale)."
                                           " Blue = compressed, red = stretched; torn = > 1.5 and growth > 0.2% H.", "stretch"),
                                          ("x", "penetration map", "Orange = vertex of a face in a NEW penetrating pair (not at rest);"
                                           " red = vertex newly inside another part (darker = deeper, saturates at 0.5% H).", "pen")):
            rows = []
            for nm in self.names:
                if not self.has(f"{prefix}_{nm}_front"):
                    continue
                pans = [self.load(f"{prefix}_{nm}_{v}").resize((420, 420), self.Image.LANCZOS) for v in POSE_VIEWS]
                rows.append(self.titled(self.hstack(pans, 4), f"{nm}: {self._pose_numbers(nm)}", 18))
            if not rows:
                continue
            for part in range(0, len(rows), 6):
                sheet = self.header(self.vstack(rows[part:part + 6], 6), f"{self.asset} - {title} ({part // 6 + 1})",
                                    note + "  Columns: " + " | ".join(VIEW_LABEL[v] for v in POSE_VIEWS))
                if kind == "stretch":
                    sheet = self.vstack([sheet, self.colorbar(sheet.width, "stretch")], 0)
                self.save(sheet, f"qa_{'stretch' if kind == 'stretch' else 'penetration'}_{part // 6 + 1}")
        cu = self.info.get("closeups", {})
        rows = []
        for key, c in cu.items():
            if not self.has(f"cut_{key}_front"):
                continue
            t = self.hstack([self.load(f"cut_{key}_{v}").resize((460, 460), self.Image.LANCZOS) for v in CLOSE_VIEWS], 4)
            x = self.hstack([self.load(f"cux_{key}_{v}").resize((460, 460), self.Image.LANCZOS) for v in CLOSE_VIEWS], 4)
            rows.append(self.titled(self.vstack([t, x], 4), f"{c['pose']} - hot spot {c['cluster'] + 1}: deepest {1000 * c['max_depth_m']:.2f} mm, "
                                                           f"{c['n_vertices']} vertices (texture | map)", 20))
        if rows:
            self.save(self.header(self.vstack(rows, 8), f"{self.asset} - close-ups of the worst penetrations, one per hot-spot cluster",
                                  "front | 3/4 front-left | side (right) | 3/4 front-right; top row texture, bottom row penetration map."),
                      "qa_penetration_closeups")

    def flag_sheet(self):
        """One page for G2: the flag tiles of info.json (worst pose per red, then yellow, metric; X-ray tiles with dots)."""
        from PIL import ImageDraw

        tiles = [t for t in self.info.get("flags", []) if self.has(t["name"])]
        lights = (self.metrics or {}).get("lights", {})
        cells = []
        for t in tiles:
            img = self.load(t["name"])
            k = 470 / img.width
            img = img.resize((470, 470), self.Image.LANCZOS)
            if t.get("dots"):
                pf = self.proj(t["name"], k)
                d = ImageDraw.Draw(img, "RGBA")
                r = 7 if t["metric"] == "joint_core_heads_inside" else 3
                for p in t["dots"]:
                    x, y = pf(p)
                    d.ellipse([x - r, y - r, x + r, y + r], outline=(255, 30, 30, 255), fill=(255, 30, 30, 120), width=2)
            mode = (" - cutaway" if t.get("cut") is not None else " - X-ray" if t["xray"] else
                    " - context (uncut)" if t.get("context") else "")
            cap = f"{t['metric'].replace('deform_', '')}{mode}"
            view = t.get("view_label") or VIEW_LABEL.get(t["view"], t["view"])
            sub = f"{t['pose']}  {t.get('caption') or t.get('region') or ''}  ({view})"
            cell = self.titled(img, sub, 17, (220, 220, 230), wrap=True)
            cell = self.titled(cell, cap, 19, LIGHT_RGB.get(t["light"], (255, 255, 255)), wrap=True)
            cells.append((cell, self.footer(self.Image.new("RGB", (cell.width, 0), BG), [t.get("value", "")], 17, margin=12)))
        if cells:  # captions and footers wrap to different heights: pad both so the images and the rows line up
            top = max(c.height for c, _ in cells)
            bot = max(f.height for _, f in cells)
            cells = [self.vstack([self.Image.new("RGB", (c.width, top - c.height), BG), c, f,
                                  self.Image.new("RGB", (c.width, bot - f.height), BG)], 0) for c, f in cells]
        summary = "  ".join(f"{k.replace('deform_', '')}: {v}" for k, v in sorted(lights.items()))
        if not cells:
            from PIL import Image as _I

            body = _I.new("RGB", (1500, 120), BG)
            ImageDraw.Draw(body).text((24, 40), "No red or yellow metric: nothing to flag.", font=_font(26, True), fill=(120, 230, 120))
        else:
            rows = [self.hstack(cells[i:i + 4], 10) for i in range(0, len(cells), 4)]
            body = self.vstack(rows, 10)
        rf = self.info.get("region_flags") or {}
        ne = rf.get("not_exercised") or []
        tie = [r for r in rf.get("flag_g2") or [] if r not in ne]
        skin = ""
        if ne or tie:
            skin = (" Skin selection for G2: " + (f"not exercised by any pose (no winner): {', '.join(ne)}" if ne else "")
                    + ("; " if ne and tie else "") + (f"near ties: {', '.join(tie)}" if tie else "") + ".")
        sheet = self.header(body, f"{self.asset} - G2 flag sheet: worst pose per red / yellow metric ({len(cells)} tiles)",
                            f"Lights: {summary}. Red caption = red metric, yellow = yellow. Cutaway tiles clip everything in front "
                            "of the deepest intruding vertex, seen from the side it faces (red = vertices newly inside another "
                            "part, orange = faces in penetrating pairs, red dots = the intruding piece); X-ray tiles show a bone "
                            "head outside the mesh." + skin + " Full evidence: qa_pose_*, qa_stretch_*, qa_penetration_*, "
                            "qa_penetration_closeups.")
        self.save(sheet, "qa_flag_sheet")


def _chain_overlay(c, img, pf, bones, width):
    """Draw only the chain bones (thick, magenta outline) of ``bones`` over ``img``; returns their projected heads."""
    from PIL import ImageDraw

    d = ImageDraw.Draw(img, "RGBA")
    pts = {}
    for nm, b in bones.items():
        if not is_chain_bone(nm):
            continue
        h, t = pf(b["head"]), pf(b["tail"])
        d.line([h, t], fill=(0, 0, 0, 255), width=width + 4)
        d.line([h, t], fill=(255, 60, 220, 255), width=width)
        r = width * 1.6
        d.ellipse([h[0] - r, h[1] - r, h[0] + r, h[1] + r], fill=(255, 255, 255, 255), outline=(0, 0, 0, 255), width=2)
        pts[nm] = (h, t, (255, 60, 220))
    return pts


def garment_sheet(c, garments_json=None):
    """Garment sheet (phase G): the rest pose with every piece in its colour (body grey), chain bones drawn, four views; legend =
    piece id, class, confidence (pieces below 0.6 flagged) and vertex count."""
    if not c.has("g_piece_front"):
        return None
    gj = _load_json(garments_json) or {}
    meta = {i: p for i, p in enumerate(gj.get("pieces", []))}
    rest = c.names[c.po["meta"].get("rest_index", 0)]
    bones = c.bone_data(rest)
    cells = []
    for v in POSE_VIEWS:
        key = f"g_piece_{v}"
        img = c.load(key)
        k = 700 / img.width
        img = img.resize((700, 700), c.Image.LANCZOS)
        _chain_overlay(c, img, c.proj(key, k), bones, 3)
        cells.append(c.titled(img, VIEW_LABEL[v], 18))
    items, low = [], []
    counts = (c.info.get("garments") or {}).get("vertices", {})
    for k in (c.info.get("garments") or {}).get("pieces", []):
        p = meta.get(k, {})
        conf = p.get("confidence")
        lab = f"{p.get('id', f'auto:{k}')} {p.get('class', '?')} conf {conf if conf is not None else 'n/a'} ({counts.get(str(k), '?')} v)"
        if conf is not None and conf < 0.6:
            lab += " FLAG"
            low.append(str(p.get("id")))
        items.append((lab, tuple(int(255 * x) for x in piece_rgb(k))))
    items.append(("body", tuple(int(255 * x) for x in BODY_RGB)))
    items.append(("chain bones (white dot = head)", (255, 60, 220)))
    row = c.header(c.hstack(cells), f"{c.asset} - garment sheet: pieces by colour, chain bones",
                   "Rest pose under runtime emulation; colours = garments.npz pieces (per welded id through mesh.npz weld), grey = "
                   "body; magenta = chain bones. Confidence per piece from garments.json; pieces below 0.6 are flagged for G2."
                   + (f" Flagged: {', '.join(low)}." if low else ""))
    return c.save(c.vstack([row, c.legend(items, row.width, 18)], 0), "qa_garment_sheet")


def cloth_pose_sheets(c, per_sheet: int = 6):
    """Cloth pose sheets (phase G): one row per cloth pose (garment compounds, chain poses), four views, chain bones drawn."""
    poses = [nm for nm in (c.info.get("cloth_poses") or []) if c.has(f"p_{nm}_front")]
    specs = c.po["meta"].get("specs", {})
    rows = []
    for nm in poses:
        bones = c.bone_data(nm)
        cells = []
        for v in POSE_VIEWS:
            key = f"p_{nm}_{v}"
            img = c.load(key)
            k = 420 / img.width
            img = img.resize((420, 420), c.Image.LANCZOS)
            _chain_overlay(c, img, c.proj(key, k), bones, 2)
            cells.append(img)
        sp = specs.get(nm, {})
        desc = "; ".join(_op_text(op) for op in sp.get("ops", []))
        rows.append(c.titled(c.hstack(cells, 4), f"{nm} [{', '.join(sp.get('tags', []))}]: {desc}", 17, wrap=True))
    out = []
    for i in range(0, len(rows), per_sheet):
        sheet = c.header(c.vstack(rows[i:i + per_sheet], 6), f"{c.asset} - cloth poses ({i // per_sheet + 1})",
                         "Garment compounds (through the control rig: the leg-push drivers act) and chain poses (FK chain controls); "
                         "runtime emulation. Columns: " + " | ".join(VIEW_LABEL[v] for v in POSE_VIEWS) + ". Magenta = chain bones.")
        out.append(c.save(sheet, f"qa_cloth_poses_{i // per_sheet + 1}"))
    return out


def _op_text(op):
    k = op.get("op")
    if k == "action":
        return f"Action {op['action']}"
    if k == "local_rot":
        pos = f" (positive: {op['positive']})" if op.get("positive") else ""
        return f"{'+'.join(op['bones'])} local {op['axis']} {op['deg']:+g} deg" + pos
    if k == "world_rot":
        return f"{op['bone']} world {op['axis']} {op['deg']:+g} deg"
    if k == "hinge_rot":
        return f"{op['bone']} hinge {op['deg']:+g} deg"
    if k == "move":
        return f"{op['bone']} move {[round(v, 3) for v in op['delta']]} m"
    if k == "place":
        return f"{op['bone']} at {[round(v, 3) for v in op['pos']]} m"
    return str(op)


def compose(out_dir, poses_path, metrics_path=None, garments_json=None) -> dict:
    """rigkit-env half: sheets from the raw shots of ``render`` / the chunks (+ the phase-G garment and cloth pose sheets when
    those shots exist)."""
    t0 = time.time()
    poses = npzio.load_poses(poses_path)
    metrics = _load_json(metrics_path)
    c = Composer(out_dir, poses, metrics)
    c.skeleton_sheets()
    c.weight_sheets()
    c.pose_sheets()
    c.map_sheets()
    if c.info.get("flags") is not None and metrics is not None:
        c.flag_sheet()
    garment_sheet(c, garments_json)
    cloth_pose_sheets(c)
    return {"ok": True, "out_dir": os.path.abspath(out_dir), "sheets": c.written, "n_sheets": len(c.written),
            "seconds": round(time.time() - t0, 1)}


# ============================================================================================================== S3 flag tiles

FT_VIEWS = ("front", "side", "top")  # "side" = from the landmark's own side ("left" for _L ids), from the right for centre ids
FT_MODES = ("solid", "xray")
FT_CONTEXT = ("front", "side")  # context shots (solid): a wider box around the crop, the crop square outlined
FT_CONTEXT_FACTOR = 2.5  # context half size = max(this x the crop half size, the tile's crop), at most FT_CONTEXT_MAX_H x H
FT_CONTEXT_MAX_H = 0.6
FT_RES = 560
FT_XRAY_ALPHA = 0.25
FT_SOLID_RGB = (0.80, 0.80, 0.82)
FT_FAR = 40.0  # m behind the crop centre: the solid shots clip nothing
FT_MARKERS = {"a": (70, 215, 90), "b": (255, 150, 30), "d": (60, 140, 255)}  # source a green, b orange, d blue
FT_PROVISIONAL = (235, 40, 40)  # provisional position: red ring
FT_SECTION = (255, 230, 40)
FT_REFERENCE = (215, 215, 225)  # the other landmarks (landmarks.json) in the context shots
#: chain neighbours a context shot also frames (base ids; a sided id takes neighbours of its own side, unsided ones as they are)
FT_NEIGHBOURS = {"shoulder": ("clavicle", "elbow"), "elbow": ("shoulder", "wrist"), "wrist": ("elbow", "hand_tip"),
                 "palm": ("wrist", "hand_tip"), "hand_tip": ("wrist",), "clavicle": ("chest", "shoulder"),
                 "hip": ("pelvis", "knee"), "knee": ("hip", "ankle"), "ankle": ("knee", "ball"), "ball": ("ankle", "toe_tip"),
                 "toe_tip": ("ball",), "heel_ground": ("ankle",), "pelvis": ("spine_01", "hip"), "spine_01": ("pelvis", "spine_02"),
                 "spine_02": ("spine_01", "chest"), "chest": ("spine_02", "neck"), "neck": ("chest", "head"),
                 "head": ("neck", "head_top")}
FT_GRID = (25, 25, 32)
FT_PLAN = "flag_tiles_plan.json"
FT_INFO = "flag_tiles_info.json"


def _ft_view(kind: str, lid: str) -> str:
    """View name of a flag-tile shot: "side" looks from the landmark's own side (``left`` for ``_L`` ids)."""
    if kind == "side":
        return "left" if side_of(lid) == "L" else "side"
    return kind


def _ft_neighbours(lid: str, reference: dict | None) -> list:
    """Positions of the chain neighbours of landmark ``lid`` (``FT_NEIGHBOURS``) found in ``reference`` ({id: [x, y, z]}): a sided
    ``lid`` looks for ``<neighbour>_<its side>``, then the unsided name (hip_L -> pelvis); an unsided ``lid`` for ``_L``, then
    ``_R``, then the unsided name (pelvis -> hip_L, spine_01)."""
    side = lid[-2:] if lid[-2:] in ("_L", "_R") else ""
    base = lid[:-2] if side else lid
    out = []
    for nb in FT_NEIGHBOURS.get(base, ()):
        for cand in ((nb + side,) if side else (nb + "_L", nb + "_R")) + (nb,):
            if cand in (reference or {}):
                out.append(reference[cand])
                break
    return out


def flag_tile_boxes(tile: dict, lid: str, H: float, reference: dict | None = None) -> dict:
    """Render boxes of one landmark of a flags.json tile: ``crop`` = its own crop (``crops[id]``, the tile's ``crop`` when
    missing), widened to a cube that holds every source position and the provisional one with a margin (max(0.1 x half size,
    0.02 H)) when one lies outside: A2's crop centre is the mean of the candidates and the provisional point, so a far source
    can fall outside it (FL hip_L: source a 38 mm below the crop; U01 elbow_L: a 14 mm beside it); ``context`` = a cube around
    the crop with half size >= max(``FT_CONTEXT_FACTOR`` x crop half size, the tile's crop half size) that also holds the
    landmark's chain neighbours of ``reference`` (``FT_NEIGHBOURS``: hip and ankle around a knee, ...; + 0.03 H) so the
    proportions can be judged, at most ``FT_CONTEXT_MAX_H`` x H. Returns {"crop": [lo, hi], "half", "a2_crop": [lo, hi],
    "widened" (m added to the half size, 0 = A2's crop), "context", "context_neighbours"}."""
    cr = (tile.get("crops") or {}).get(lid) or tile["crop"]
    lo, hi = np.asarray(cr["box_min"], dtype=float), np.asarray(cr["box_max"], dtype=float)
    hs = float(cr.get("half_size") or 0.5 * float(np.max(hi - lo)))
    a2 = [lo.tolist(), hi.tolist()]
    pts = [p for p in ((tile.get("candidates") or {}).get(lid) or {}).values() if p is not None]
    if (tile.get("provisional") or {}).get(lid) is not None:
        pts.append(tile["provisional"][lid])
    widened = 0.0
    if pts:
        P = np.asarray(pts, dtype=float)
        pad = max(0.1 * hs, 0.02 * H)
        if (P.min(0) < lo).any() or (P.max(0) > hi).any():
            nlo, nhi = np.minimum(lo, P.min(0) - pad), np.maximum(hi, P.max(0) + pad)
            c, h = (nlo + nhi) / 2, float(np.max(nhi - nlo)) / 2
            widened, hs, lo, hi = h - hs, h, c - h, c + h
    c = (lo + hi) / 2
    hc = max(FT_CONTEXT_FACTOR * hs, float((tile.get("crop") or {}).get("half_size") or 0.0))
    nbs = _ft_neighbours(lid, reference)
    cc = c.copy()
    if nbs:  # a cube holding the crop and the neighbours (+ margin), centred between them
        Q = np.vstack([np.asarray(nbs, dtype=float), lo[None], hi[None]])
        qlo, qhi = Q.min(0) - 0.03 * H, Q.max(0) + 0.03 * H
        cc, hc = (qlo + qhi) / 2, max(hc, float(np.max(qhi - qlo)) / 2)
    hc = max(min(hc, FT_CONTEXT_MAX_H * H), hs)
    cc = np.clip(cc, hi - hc, lo + hc)  # the cube still holds the crop when the half size was capped
    return {"crop": [lo.tolist(), hi.tolist()], "half": hs, "a2_crop": a2, "widened": widened,
            "context": [(cc - hc).tolist(), (cc + hc).tolist()], "context_neighbours": len(nbs)}


def plan_flag_tiles(flags: dict, res: int = FT_RES, flags_path=None, mesh_path=None, landmarks: dict | None = None) -> dict:
    """Shot list of the S3 vision tiles of A2's ``flags.json`` (pure Python): for every tile and every landmark id two context
    shots (``FT_CONTEXT``: front and side, solid, the wider ``context`` box of ``flag_tile_boxes``) and its crop (A2's
    ``crops[id]``, widened when a source lies outside it) from ``FT_VIEWS`` (ortho; "side" from the landmark's side, "top" with
    the character's front down) in ``FT_MODES``: ``solid`` (whole mesh, STUDIO light) and ``xray`` (alpha ``FT_XRAY_ALPHA``,
    clipped to the crop box along the view: the slab of the mesh inside the crop). Markers, the 0.01 H grid, the crop square of
    the context shots, the other landmarks (``landmarks`` = landmarks.json ``landmarks``: grey reference dots in the context
    shots, e.g. shoulder and wrist around an elbow) and the section polylines are drawn at compose time (``compose_flag_tiles``)
    through each shot's projection. Returns {"jobs", "info"}."""
    jobs, tiles = [], []
    H = float(flags.get("H") or 1.0)
    for t in flags.get("tiles", []):
        k = int(t.get("tile", len(tiles) + 1))
        boxes = {}
        ref = {k: v["pos"] for k, v in (landmarks or {}).items() if isinstance(v, dict) and v.get("pos")}
        for lid in t["ids"]:
            bx = boxes[lid] = flag_tile_boxes(t, lid, H, ref)
            hs = bx["half"]
            base = {"tile": k, "key": t["key"], "id": lid, "res": int(res), "margin": 1.0, "crop_box": bx["crop"]}
            for kind in FT_CONTEXT:
                jobs.append(dict(base, name=f"ft{k:02d}_{lid}_ctx{kind}_solid", view=_ft_view(kind, lid), kind=f"ctx{kind}",
                                 mode="solid", box=bx["context"], up=None, cut=None, depth=FT_FAR))
            for kind in FT_VIEWS:
                for mode in FT_MODES:
                    jobs.append(dict(base, name=f"ft{k:02d}_{lid}_{kind}_{mode}", view=_ft_view(kind, lid), kind=kind, mode=mode,
                                     box=bx["crop"], up=[0.0, 1.0, 0.0] if kind == "top" else None,
                                     cut=hs if mode == "xray" else None, depth=hs if mode == "xray" else FT_FAR))
        tiles.append({**{kk: t.get(kk) for kk in ("tile", "key", "ids", "class", "flag", "status", "status_by_id", "impact", "tau_H",
                                                  "grid_m", "reasons", "candidates", "sanity_only", "provisional",
                                                  "provisional_source", "gates_failed", "crops", "crop", "sections")},
                      "render_boxes": boxes})
    info = {"schema": 0, "asset_id": flags.get("asset_id"), "family": flags.get("family"), "H": H,
            "grid_m": 0.01 * H, "flags": os.path.abspath(flags_path) if flags_path else None,
            "mesh": os.path.abspath(mesh_path) if mesh_path else None,
            "flags_sha256": _sha256(flags_path) if flags_path else None, "mesh_sha256": _sha256(mesh_path) if mesh_path else None,
            "mesh_sha256_in_flags": (flags.get("inputs_sha256") or {}).get("mesh"),
            "n_tiles": len(tiles), "views": list(FT_VIEWS), "modes": list(FT_MODES), "xray_alpha": FT_XRAY_ALPHA, "tiles": tiles,
            "reference_landmarks": {k: v["pos"] for k, v in (landmarks or {}).items() if isinstance(v, dict) and v.get("pos")}}
    return {"jobs": jobs, "info": info}


def _sha256(path) -> str | None:
    import hashlib

    if not path or not os.path.exists(path):
        return None
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for c in iter(lambda: f.read(1 << 20), b""):
            h.update(c)
    return h.hexdigest()


def flag_tiles_plan(flags_path, out_dir, mesh_path=None, res: int = FT_RES, max_seconds: float = 15.0) -> dict:
    """Chunked path, step 1 (any Python, also inside Blender): write ``flag_tiles_plan.json`` (jobs, info, chunk ranges). The
    mesh defaults to the ``inputs.mesh`` of flags.json (A2's pipeline mesh.npz, the frame the landmark positions are in)."""
    t0 = time.time()
    flags = _load_json(flags_path)
    if flags is None:
        raise FileNotFoundError(f"no flags.json at {flags_path}")
    mesh_path = mesh_path or (flags.get("inputs") or {}).get("mesh")
    if not mesh_path or not os.path.exists(mesh_path):
        raise FileNotFoundError(f"mesh.npz of the flags not found: {mesh_path!r} (give --mesh)")
    lm = _load_json(os.path.join(os.path.dirname(os.path.abspath(flags_path)), "landmarks.json"))  # consensus writes both
    plan = plan_flag_tiles(flags, res, flags_path, mesh_path, (lm or {}).get("landmarks"))
    plan["chunks"] = chunk_ranges(plan["jobs"], max_seconds)
    os.makedirs(out_dir, exist_ok=True)
    for old in glob.glob(os.path.join(out_dir, "ft_parts", "views_*.json")):
        os.remove(old)
    npzio.write_json(os.path.join(out_dir, FT_PLAN), plan)
    w = [] if plan["info"]["mesh_sha256"] == plan["info"]["mesh_sha256_in_flags"] else [
        "mesh.npz differs from the one flags.json was made on (inputs_sha256.mesh)"]
    return {"ok": True, "plan": os.path.join(out_dir, FT_PLAN), "n_jobs": len(plan["jobs"]), "n_tiles": plan["info"]["n_tiles"],
            "chunks": plan["chunks"], "warnings": w, "seconds": round(time.time() - t0, 2)}


class FlagTileScene:
    """Blender side of the flag tiles: a TEMPORARY scene holding the mesh.npz mesh, an ortho camera and a world, removed again on
    exit (also on errors), so a file open over MCP keeps its state (its scenes and objects are never touched). ``shoot`` renders
    one job through ``Shooter`` (Workbench; solid = single colour, STUDIO light; xray = X-ray alpha ``FT_XRAY_ALPHA``)."""

    def __init__(self, mesh_path, raw_dir):
        self.mesh_path, self.raw = mesh_path, raw_dir

    def __enter__(self):
        m = npzio.load_mesh(self.mesh_path)
        self.sc = bpy.data.scenes.new("FT_flag_tiles")
        self.me = bpy.data.meshes.new("FT_mesh")
        self.me.from_pydata(np.asarray(m["V"], dtype=np.float64).tolist(), [], np.asarray(m["F"], dtype=np.int64).tolist())
        self.me.update()
        self.ob = bpy.data.objects.new("FT_mesh", self.me)
        self.sc.collection.objects.link(self.ob)
        self.cd = bpy.data.cameras.new("FT_cam")
        self.cd.type = "ORTHO"
        self.cd.clip_start, self.cd.clip_end = 0.01, CAM_DISTANCE + FT_FAR
        self.cam = bpy.data.objects.new("FT_cam", self.cd)
        self.sc.collection.objects.link(self.cam)
        self.sc.camera = self.cam
        self.world = bpy.data.worlds.new("FT_world")
        self.sc.world = self.world
        _scene_setup(FT_RES, self.sc)
        sh = self.sc.display.shading
        sh.color_type, sh.single_color = "SINGLE", FT_SOLID_RGB
        os.makedirs(self.raw, exist_ok=True)
        self.shooter = Shooter.__new__(Shooter)  # the QA shooter's framing / projection, on this scene and camera
        self.shooter.ob, self.shooter.me, self.shooter.n, self.shooter.raw = self.ob, self.me, len(self.me.vertices), self.raw
        self.shooter.sc, self.shooter.cam, self.shooter.views = self.sc, self.cam, {}
        return self

    def shoot(self, jb) -> dict:
        sh = self.sc.display.shading
        sh.color_type, sh.light = "SINGLE", "STUDIO"
        sh.show_xray = jb["mode"] == "xray"
        if sh.show_xray:
            sh.xray_alpha = FT_XRAY_ALPHA
        info = self.shooter.shoot(jb["name"], jb["view"], jb["box"], jb["res"], jb.get("margin", 1.0), None, jb.get("cut"),
                                  jb.get("up"), jb.get("depth"))
        info.update(tile=jb["tile"], id=jb["id"], kind=jb["kind"], mode=jb["mode"], box=jb["box"], crop_box=jb.get("crop_box"))
        return info

    def __exit__(self, *exc):
        for ob in (self.ob, self.cam):
            bpy.data.objects.remove(ob, do_unlink=True)
        bpy.data.meshes.remove(self.me)
        bpy.data.cameras.remove(self.cd)
        bpy.data.scenes.remove(self.sc)
        bpy.data.worlds.remove(self.world)
        return False


def flag_tiles_chunk(out_dir, i0: int, i1: int) -> dict:
    """Chunked path, step 2 (Blender; the MCP call, <= 20 s): jobs[i0:i1] of flag_tiles_plan.json in their own temporary scene;
    writes ``ft_parts/views_<i0>.json``."""
    if bpy is None:
        raise RuntimeError("flag_tiles_chunk() runs inside Blender")
    t0 = time.time()
    plan = _load_json(os.path.join(out_dir, FT_PLAN))
    if plan is None:
        raise FileNotFoundError(f"no {FT_PLAN} in {out_dir}: run flag_tiles_plan first")
    views = {}
    with FlagTileScene(plan["info"]["mesh"], os.path.join(out_dir, "raw")) as fs:
        for jb in plan["jobs"][i0:i1]:
            views[jb["name"]] = fs.shoot(jb)
    npzio.write_json(os.path.join(out_dir, "ft_parts", f"views_{i0:05d}.json"), views)
    return {"ok": True, "i0": i0, "i1": i1, "n_images": len(views), "seconds": round(time.time() - t0, 2)}


def flag_tiles_finish(out_dir) -> dict:
    """Chunked path, step 3 (any Python): merge the chunk projections into ``flag_tiles_info.json``; fails when a planned shot
    is missing."""
    plan = _load_json(os.path.join(out_dir, FT_PLAN))
    views = {}
    for p in sorted(glob.glob(os.path.join(out_dir, "ft_parts", "views_*.json"))):
        views.update(_load_json(p))
    missing = [j["name"] for j in plan["jobs"] if j["name"] not in views]
    if missing:
        raise ValueError(f"{len(missing)} planned flag-tile shots were not rendered, e.g. {missing[:5]}")
    npzio.write_json(os.path.join(out_dir, FT_INFO), dict(plan["info"], views=views, jobs=plan["jobs"]))
    return {"ok": True, "info": os.path.join(out_dir, FT_INFO), "n_images": len(views)}


def flag_tiles_render(flags_path, out_dir, mesh_path=None, res: int = FT_RES) -> dict:
    """Headless one-shot path (Blender): plan + every job in one temporary scene + finish. Compose in rigkit-env afterwards."""
    if bpy is None:
        raise RuntimeError("flag_tiles_render() runs inside Blender")
    t0 = time.time()
    pl = flag_tiles_plan(flags_path, out_dir, mesh_path, res)
    n = flag_tiles_chunk(out_dir, 0, pl["n_jobs"])
    flag_tiles_finish(out_dir)
    return {"ok": True, "out_dir": os.path.abspath(out_dir), "n_images": n["n_images"], "n_tiles": pl["n_tiles"],
            "warnings": pl["warnings"], "seconds": round(time.time() - t0, 1)}


def _ft_proj(view: dict, scale: float = 1.0):
    px, py = view["px"], view["py"]
    return lambda P: ((px[0] * P[0] + px[1] * P[1] + px[2] * P[2] + px[3]) * scale,
                      (py[0] * P[0] + py[1] * P[1] + py[2] * P[2] + py[3]) * scale)


def _ft_cell(img, view: dict, tile: dict, lid: str, grid_m: float, scale: float = 1.0, reference: dict | None = None):
    """One raw shot with the overlays: 0.01 H grid (every 5th line stronger; context shots: only every 5th, and the crop square
    in white), the mesh section polylines (yellow), the source markers (a green, b orange, d blue; a sanity-only d hollow) and the
    provisional position (red ring), letters next to them."""
    from PIL import ImageDraw

    d = ImageDraw.Draw(img, "RGBA")
    pf = _ft_proj(view, scale)
    lo, hi = np.asarray(view["box"][0], dtype=float), np.asarray(view["box"][1], dtype=float)
    c = (lo + hi) / 2
    context = str(view.get("kind", "")).startswith("ctx")
    # in-plane world axes of this view: the ones that move the pixel most along the image x / y
    ia = int(np.argmax(np.abs(view["px"][:3])))
    ja = int(np.argmax(np.abs(view["py"][:3])))
    step = 5 if context else 1
    for ax, other in ((ia, ja), (ja, ia)):
        k0, k1 = int(math.floor(lo[ax] / grid_m)), int(math.ceil(hi[ax] / grid_m))
        for k in range(k0, k1 + 1):
            if k % step:
                continue
            a, b = c.copy(), c.copy()
            a[ax] = b[ax] = k * grid_m
            a[other], b[other] = lo[other] - grid_m, hi[other] + grid_m
            d.line([pf(a), pf(b)], fill=FT_GRID + ((150,) if k % 5 == 0 else (70,)), width=2 if k % 5 == 0 else 1)
    if context and view.get("crop_box"):
        cl, ch = np.asarray(view["crop_box"][0], dtype=float), np.asarray(view["crop_box"][1], dtype=float)
        corners = []
        for u, v_ in ((0, 0), (1, 0), (1, 1), (0, 1)):
            p_ = (cl + ch) / 2
            p_[ia] = (cl, ch)[u][ia]
            p_[ja] = (cl, ch)[v_][ja]
            corners.append(pf(p_))
        d.line(corners + corners[:1], fill=(0, 0, 0, 220), width=5)
        d.line(corners + corners[:1], fill=(255, 255, 255, 255), width=2)
        fr = _font(max(11, int(13 * scale ** 0.5)))
        for nm, pos in sorted((reference or {}).items()):
            if nm in tile.get("ids", []) or not np.all((np.asarray(pos) >= lo) & (np.asarray(pos) <= hi)):
                continue
            x, y = pf(pos)
            d.ellipse([x - 3, y - 3, x + 3, y + 3], fill=FT_REFERENCE + (255,), outline=(0, 0, 0, 255), width=1)
            d.text((x + 5, y - 7), nm, font=fr, fill=FT_REFERENCE + (255,), stroke_width=2, stroke_fill=(0, 0, 0, 255))
    sec = (tile.get("sections") or {}).get(lid) or {}
    for pl in sec.get("polylines") or []:
        pts = [pf(p) for p in pl["points"]]
        if pl.get("closed") and len(pts) > 2:
            pts.append(pts[0])
        if len(pts) > 1:
            d.line(pts, fill=(0, 0, 0, 200), width=4)
            d.line(pts, fill=FT_SECTION + (255,), width=2)
    fnt = _font(max(12, int(16 * scale ** 0.5)), True)
    r = max(4.0, 7.0 * scale ** 0.5)
    cand = (tile.get("candidates") or {}).get(lid) or {}
    sanity = bool((tile.get("sanity_only") or {}).get(lid))
    for src, pos in sorted(cand.items()):
        if pos is None:
            continue
        x, y = pf(pos)
        col = FT_MARKERS.get(src, (200, 200, 200))
        if src == "d" and sanity:
            d.ellipse([x - r, y - r, x + r, y + r], outline=col + (255,), width=3)
        else:
            d.ellipse([x - r, y - r, x + r, y + r], fill=col + (235,), outline=(0, 0, 0, 255), width=2)
        d.text((x + r + 2, y - r - 4), src, font=fnt, fill=col + (255,), stroke_width=2, stroke_fill=(0, 0, 0, 255))
    prov = (tile.get("provisional") or {}).get(lid)
    if prov is not None:
        x, y = pf(prov)
        q = r * 1.9
        d.ellipse([x - q, y - q, x + q, y + q], outline=FT_PROVISIONAL + (255,), width=3)
    return img


def _ft_text(tile: dict, lid: str, H: float) -> list:
    """Caption lines of one landmark row: reason, positions (mm) per source, pairwise distances (mm, % H) vs tau, failed gates."""
    cand = {k: v for k, v in ((tile.get("candidates") or {}).get(lid) or {}).items() if v is not None}
    tau = tile.get("tau_H")
    rows = [f"{lid}: {(tile.get('reasons') or {}).get(lid, '')}"]
    bx = (tile.get("render_boxes") or {}).get(lid) or {}
    if bx.get("widened"):
        rows.append(f"crop widened by {1000 * bx['widened']:.1f} mm (half size) so that every source is in view: a source lies "
                    "outside A2's crop")
    pos = "; ".join(f"{s} ({'green' if s == 'a' else 'orange' if s == 'b' else 'blue' if s == 'd' else '?'})"
                    f" {[round(1000 * float(v), 1) for v in p]} mm" for s, p in sorted(cand.items()))
    prov = (tile.get("provisional") or {}).get(lid)
    src = (tile.get("provisional_source") or {}).get(lid)
    rows.append(f"{pos}; provisional (red ring) = {src}" + (f" {[round(1000 * float(v), 1) for v in prov]} mm" if prov else ""))
    ks = sorted(cand)
    dist = [f"|{a}-{b}| {1000 * float(np.linalg.norm(np.subtract(cand[a], cand[b]))):.1f} mm = "
            f"{100 * float(np.linalg.norm(np.subtract(cand[a], cand[b]))) / H:.2f} % H"
            for i, a in enumerate(ks) for b in ks[i + 1:]]
    gates = {s: g for s, g in ((tile.get("gates_failed") or {}).get(lid) or {}).items() if g}
    sanity = bool((tile.get("sanity_only") or {}).get(lid))
    rows.append((", ".join(dist) + "; " if dist else "") + (f"tau {100 * float(tau):.2f} % H" if tau else "")
                + (f"; failed gates {gates}" if gates else "") + ("; d is sanity-only (hollow)" if sanity else ""))
    return rows


def compose_flag_tiles(out_dir, cell_px: int = 400, thumb_px: int = 240) -> dict:
    """rigkit-env half: one PNG per tile (``flag_tile_<k>_<key>.png``: a row per landmark of the tile, columns context front /
    context side, then front / side / top x solid / x-ray of the crop, overlays of ``_ft_cell``, captions of ``_ft_text``) and the
    contact sheet ``flag_tiles_contact.png`` (per landmark the three x-ray views as thumbnails). Returns the files."""
    from PIL import Image

    t0 = time.time()
    info = _load_json(os.path.join(out_dir, FT_INFO))
    if info is None:
        raise FileNotFoundError(f"no {FT_INFO} in {out_dir}: run flag_tiles_finish first")
    cm = Composer.__new__(Composer)  # sheet helpers (header, titled, footer, stacks) without the QA info.json
    cm.Image, cm.out, cm.written = Image, out_dir, []
    H, grid = float(info["H"]), float(info["grid_m"])
    views = info["views"]
    written, contact = [], []
    legend = (f"Markers: source a (geometry) green, b (proxy) orange, d (UniRig) blue - hollow when sanity-only - and the "
              f"provisional position as a red ring; yellow = mesh section through the provisional point (A2 sections); grid "
              f"0.01 H = {1000 * grid:.1f} mm (every 5th line darker; context shots: 0.05 H lines, the crop as a white square, the "
              "other landmarks as grey dots)."
              f" Solid = whole mesh; X-ray (alpha {FT_XRAY_ALPHA}) = only the slab of the mesh inside the crop box along the "
              "view. Side = from the landmark's own side; top = from above with the character's front down.")
    for t in info["tiles"]:
        rows, thumbs = [], []
        for lid in t["ids"]:
            cells, th = [], []
            for kind in FT_CONTEXT:
                v = views[f"ft{int(t['tile']):02d}_{lid}_ctx{kind}_solid"]
                raw = Image.open(os.path.join(out_dir, "raw", v["file"])).convert("RGB")
                img = _ft_cell(raw.resize((cell_px, cell_px), Image.LANCZOS), v, t, lid, grid, cell_px / raw.width,
                               info.get("reference_landmarks"))
                cells.append(cm.titled(img, f"context: {VIEW_LABEL.get(v['view'], v['view'])}", 16))
            for kind in FT_VIEWS:
                for mode in FT_MODES:
                    nm = f"ft{int(t['tile']):02d}_{lid}_{kind}_{mode}"
                    v = views[nm]
                    raw = Image.open(os.path.join(out_dir, "raw", v["file"])).convert("RGB")
                    k = cell_px / raw.width
                    img = _ft_cell(raw.resize((cell_px, cell_px), Image.LANCZOS), v, t, lid, grid, k)
                    cells.append(cm.titled(img, f"{VIEW_LABEL.get(v['view'], v['view'])} | {mode}", 16))
                    if mode == "xray":
                        k2 = thumb_px / raw.width
                        th.append(_ft_cell(raw.resize((thumb_px, thumb_px), Image.LANCZOS), v, t, lid, grid, k2))
            row = cm.titled(cm.hstack(cells, 6), lid, 20)
            rows.append(cm.footer(row, _ft_text(t, lid, H), 16, margin=12))
            thumbs.append(cm.titled(cm.hstack(th, 3), lid, 15))
        body = cm.vstack(rows, 10)
        title = (f"{info['asset_id']} - S3 vision tile {t['tile']}: {t['key']}  [{t.get('flag')}, {t.get('status')}, impact "
                 f"{t.get('impact')}]")
        sheet = cm.header(body, title, legend)
        p = os.path.join(out_dir, f"flag_tile_{int(t['tile']):02d}_{t['key']}.png")
        sheet.save(p)
        written.append(os.path.basename(p))
        contact.append(cm.titled(cm.hstack(thumbs, 8), f"tile {t['tile']}: {t['key']} ({t.get('flag')})", 17))
    if contact:
        per = 2
        grid_rows = [cm.hstack(contact[i:i + per], 16) for i in range(0, len(contact), per)]
        sheet = cm.header(cm.vstack(grid_rows, 10), f"{info['asset_id']} - S3 vision tiles ({len(info['tiles'])}), x-ray views",
                          "front | side | top per landmark; " + legend)
        p = os.path.join(out_dir, "flag_tiles_contact.png")
        sheet.save(p)
        written.append(os.path.basename(p))
    return {"ok": True, "out_dir": os.path.abspath(out_dir), "files": written, "n_tiles": len(info["tiles"]),
            "seconds": round(time.time() - t0, 1)}


def main(argv=None):
    if argv is None:
        argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    ap = argparse.ArgumentParser(description="S7 QA sheets: render / plan / chunk (Blender), finish / compose (rigkit-env); "
                                             "S3 flag tiles: flag_tiles / flag_chunk (Blender), flag_plan / flag_finish (any), "
                                             "flag_compose (rigkit-env)")
    ap.add_argument("cmd", choices=("render", "plan", "chunk", "finish", "compose", "flag_tiles", "flag_plan", "flag_chunk",
                                    "flag_finish", "flag_compose"))
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("--poses")
    ap.add_argument("--metrics")
    ap.add_argument("--fields")
    ap.add_argument("--blend")
    ap.add_argument("--what", default=",".join(WHAT_ALL))
    ap.add_argument("--only", default="", help="comma list of pose names to shoot (default all)")
    ap.add_argument("--i0", type=int, default=0)
    ap.add_argument("--i1", type=int, default=-1)
    ap.add_argument("--max-seconds", type=float, default=15.0, help="plan: estimated seconds per chunk")
    ap.add_argument("--flags", help="flag tiles: A2's flags.json")
    ap.add_argument("--mesh", help="flag tiles: mesh.npz (default: flags.json inputs.mesh)")
    ap.add_argument("--res", type=int, default=FT_RES, help=f"flag tiles: pixels per shot (default {FT_RES})")
    ap.add_argument("--garments", help="phase G: garments.npz (with --mesh-npz) for the garment shots ('garments' in --what)")
    ap.add_argument("--mesh-npz", help="phase G: mesh.npz whose weld maps garments.npz rows to vertices")
    ap.add_argument("--garments-json", help="phase G compose: garments.json (piece ids, classes, confidence)")
    ap.add_argument("--skeleton", help="accepted for symmetry with the pipeline (chain bones are found by name)")
    a = ap.parse_args(argv)
    what = tuple(x for x in a.what.split(",") if x)
    only = [x for x in a.only.split(",") if x] or None
    try:
        if a.cmd in ("render", "plan", "chunk") and a.blend:
            bpy.ops.wm.open_mainfile(filepath=a.blend)
        if a.cmd == "render":
            res = render_current(a.poses, a.out_dir, a.fields, a.metrics, what, only=only, garments_path=a.garments,
                                 mesh_npz=a.mesh_npz)
        elif a.cmd == "plan":
            res = plan_current(a.poses, a.out_dir, a.fields, a.metrics, what, only=only, max_seconds=a.max_seconds,
                               garments_path=a.garments, mesh_npz=a.mesh_npz)
        elif a.cmd == "chunk":
            plan = _load_json(os.path.join(a.out_dir, "render_plan.json"))
            res = render_chunk(a.out_dir, a.i0, len(plan["jobs"]) if a.i1 < 0 else a.i1)
        elif a.cmd == "finish":
            res = finish_chunks(a.out_dir)
        elif a.cmd == "compose":
            res = compose(a.out_dir, a.poses, a.metrics, a.garments_json)
        elif a.cmd == "flag_tiles":
            res = flag_tiles_render(a.flags, a.out_dir, a.mesh, a.res)
        elif a.cmd == "flag_plan":
            res = flag_tiles_plan(a.flags, a.out_dir, a.mesh, a.res, a.max_seconds)
        elif a.cmd == "flag_chunk":
            plan = _load_json(os.path.join(a.out_dir, FT_PLAN))
            res = flag_tiles_chunk(a.out_dir, a.i0, len(plan["jobs"]) if a.i1 < 0 else a.i1)
        elif a.cmd == "flag_finish":
            res = flag_tiles_finish(a.out_dir)
        else:
            res = compose_flag_tiles(a.out_dir)
        print(json.dumps(res))
        return 0
    except Exception as e:
        import traceback

        traceback.print_exc()
        print(json.dumps({"ok": False, "error": f"{type(e).__name__}: {e}"}))
        return 1


if __name__ == "__main__":
    code = main()
    if bpy is not None and bpy.app.background:
        from rigkit import bl

        bl.exit_now(code)  # os._exit without Blender's teardown, after removing the session temp folder Blender would remove
    sys.exit(code)
