"""solvers.chains - S3g chain plan (owner G1, phase G): garments.json + garments.npz -> chains.json, and ``merge_chains`` (resolved
skeleton + chains -> skeleton with the chain bones, used by S4 rigkit/skeleton.py (G2) and S6/S7 (G3)).

Spec: ``references/cloth-and-attachments.md`` §3 (placement, names, parents, ring, strips, cape, clusters, budget), §4 (leg push),
§1.3 (spring hints, colliders). Every number is an inference that P5 calibrates.

* **Counts** (``count_plan``): bones per chain ``n = clamp(round(L / (0.09 H)), 1, 6)``; a strip shorter than 6% H gets one bone;
  skirt rings get 4 / 6 / 8 chains for a hem above the knee / down to mid-calf / lower; a cape narrower than 25% H one chain, else
  three; clusters one chain with at most one bone per two items; sleeves a 1-2 bone chain only when they hang > 8% H below the arm;
  hair 3-5 bones; ``rigid_hanging`` items an ``<item>_swing`` bone only when the overrides keep it (``swing: true``) and it hangs
  > 5% H. Inner layers, tight pieces and disabled pieces get none. Over ``aux_budget`` the planner trims in the spec order: merge
  strips into fans, cut bones per chain to 3, drop diagonal skirt chains (8 -> 6 -> 4), make clusters rigid, drop swing items.
* **Coverage** (``plan``, G6): every pass is checked with the overlay S7 builds (``overlay_coverage``, skin_garment read only) under
  the ``garment_chain_coverage`` rule; weak ring chains are dropped and bones cut until every chain bone dominates 8+ rows.
* **Leg-push inheritance** (G6, ``_inherit_leg_push``): clusters, strips and swing items lying over a pushed panel take its push.
* **Placement** (``plan``): joints on the medial curve (centroids of horizontal cross-sections of the layer-0 rows of the
  chain's part of the piece, i.e. mid-thickness of the cloth; a cluster follows its item centroids), resampled to equal arc
  length from the attachment line to the hem; ring chains at even
  azimuth, snapped to a slit or panel centre within 15 deg; hinge = local X along the hem tangent so that a positive X rotation
  swings the cloth outward (local Z = outward horizontal direction from the pelvis axis); names and parents per §3; ``L_``/``R_``
  partners symmetrized when they mirror within ``sym_tol_H`` (else the asymmetry is reported); leg push for skirt chains and
  strips in front of or behind the legs (``w_L = 0.5 + 0.35 sin phi``, ``w_R = 0.5 - 0.35 sin phi``, ``max_deg`` 60); spring
  hints (VRMC_springBone field names; ``gravityDir`` in the Blender frame) and capsule colliders on the legs and torso.

Units: metres, Blender frame (Z up, front -Y, character's left +X). numpy only (+ rigcore).
"""
from __future__ import annotations

import argparse
import copy
import json
import math
import os
import sys

import numpy as np

if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rigcore import npzio  # noqa: E402

BONE_STEP_H = 0.09
MAX_BONES = 6
SHORT_FLAP_H = 0.06
CAPE_WIDE_H = 0.25
SLEEVE_HANG_H = 0.08
SWING_DROP_H = 0.05
SNAP_DEG = 15.0
MULTI_LAYER_FRAC = 0.05  # a skirt with at least this share of inner-layer rows is multi-layer
WIDE_HEM = 2.5  # hem circumference over this x hip-to-hip width = very wide skirt
SYM_TOL_H = 0.03  # pairs closer than this to a mirror image are symmetrized (then they mirror exactly); else asymmetric
MIRROR_H = 0.01  # contract: L_/R_ pairs mirror within 1% H
LEG_PUSH_MAX_DEG = 60.0
LEG_PUSH_ROOT_H = 0.1  # review m1: a strip root at most this x H above the hip joint hangs from the belt (FL 0.04-0.07 H, D01 0.06 H)
RING_MIN, RING_MAX = 2, 8  # review m3: skirt ring overrides
LEG_PUSH_FACING_DEG = 80.0  # G3b (spec §4 drape): max push of a chain facing a leg (front/back, |cos phi| >= FACING_COS)
LEG_PUSH_SIDE_DEG = 60.0  # side chains
FACING_COS = 0.7
DRAPE = 0.75  # spec §4: the bone after a pushed root counter-rotates by -DRAPE x the push angle
COVER_MIN_ROWS = 8  # spec §6 garment_chain_coverage: welded rows per chain bone
COVER_CLASSES = ("skirt", "strip", "cape", "hair", "sleeve")  # clusters and rigid items are not t ramps
FAN_GAP_H = 0.06  # strips whose attachment centres are closer than this may merge into a fan (budget trim 1)
COVER_ITERS = 16  # G6: passes of the overlay coverage check (one cut per piece and pass)
INHERIT_GAP_H = 0.06  # G6: a cluster / strip / swing item whose rows lie within this x H of a pushed chain's panel ...
INHERIT_SHARE = 0.5  # ... for at least this share of its rows inherits that chain's leg push (FL beads: 0.03 H median, 98 %)
INHERIT_CLASSES = ("cluster", "strip", "rigid_hanging")

RING = {  # azimuth (deg, 0 = front, 90 = character's left) -> chain key
    8: [(0, "F"), (45, "L_FS"), (90, "L_S"), (135, "L_BS"), (180, "B"), (-135, "R_BS"), (-90, "R_S"), (-45, "R_FS")],
    6: [(0, "F"), (45, "L_FS"), (90, "L_S"), (180, "B"), (-90, "R_S"), (-45, "R_FS")],
    "6b": [(0, "F"), (90, "L_S"), (135, "L_BS"), (180, "B"), (-135, "R_BS"), (-90, "R_S")],
    4: [(0, "F"), (90, "L_S"), (180, "B"), (-90, "R_S")],
}

def ring_layout(key) -> list:
    """[(azimuth deg, chain key)] of a skirt ring: the named layouts of ``RING`` (4, 6, "6b", 8), else (review m3: an override of
    any count n = 2..8) n chains at even azimuth from the front, keyed by sector: F (|a| < 22.5), FS, S, BS, B (|a| >= 157.5), with
    the L_/R_ side prefix off the midline (``plan`` numbers repeats)."""
    if key in RING:
        return RING[key]
    n = int(key)
    if not RING_MIN <= n <= RING_MAX:
        raise ValueError(f"skirt ring of {n} chains: supported {RING_MIN}-{RING_MAX}")
    out = []
    for k in range(n):
        a = ((k * 360.0 / n + 180.0) % 360.0) - 180.0
        sec = "F" if abs(a) < 22.5 else "FS" if abs(a) < 67.5 else "S" if abs(a) < 112.5 else "BS" if abs(a) < 157.5 else "B"
        side = "" if sec in ("F", "B") else ("L_" if a > 0 else "R_")
        out.append((round(a, 4), side + sec))
    return out


#: spring hint starting values (§1.3, spec update 2026-10-23: VRM tool defaults, forum-level; calibrate at P5, never copy across
#: engines). VRMC_springBone field names; gravityDir in the Blender frame; hitRadius = 0.02 x H / 1.8 m
SPRING = {"stiffness": 1.0, "dragForce": 0.2, "gravityPower": 0.2, "gravityDir": [0.0, 0.0, -1.0]}
HIT_RADIUS = 0.02  # m at H = 1.8 m


def bones_for_length(L: float, H: float) -> int:
    return int(min(MAX_BONES, max(1, round(L / (BONE_STEP_H * H)))))


def _ring_n(pc, body) -> int:
    """§3.1 (spec update 2026-10-23): 4 by default; 6 for a full robe from the knee down (hem at or below the knee); 8 only for a
    floor-length skirt that is multi-layer or very wide (hem circumference > 2.5 x the hip-to-hip width)."""
    z = float(pc.get("z_min", 0.0))
    knee = float(body["knee_z"]) if body else 0.3
    if z > knee:
        return 4
    multi = float(pc.get("inner_frac") or 0.0) >= MULTI_LAYER_FRAC
    wide = float(pc.get("hem_circumference") or 0.0) > WIDE_HEM * float(pc.get("hip_width") or np.inf)
    if pc.get("floor_length") and (multi or wide):
        return 8
    return 6


def count_plan(pieces, H: float, aux_budget: int, body=None) -> dict:
    """Chains and bones per piece before placement, with the budget trims (§3.5). ``pieces`` = garments.json pieces (dicts with
    id, class, layer, length, width, z_min, z_top, n_items, drop, disable, rigid, swing, override_chains, override_bones,
    merged_into). Returns {"pieces": {id: {chains, bones, ring, fan_with}}, "used", "trims", "over_budget"}."""
    out = {}
    for pc in pieces:
        pid, cls = pc["id"], pc["class"]
        L = float(pc.get("length") or 0.0)
        if cls in ("skirt", "strip") and pc.get("free_length") is not None:  # §3 (G3): bones from the free length
            L = float(pc["free_length"])
        e = {"chains": 0, "bones": 0, "ring": None, "fan_with": None, "why": ""}
        if pc.get("disable") or pc.get("merged_into") or int(pc.get("layer") or 0) >= 1 or cls == "tight" or pc.get("rigid"):
            e["why"] = "disabled" if pc.get("disable") else ("merged" if pc.get("merged_into") else
                                                            ("inner layer" if int(pc.get("layer") or 0) >= 1 else
                                                             ("rigid (override)" if pc.get("rigid") else "tight")))
        elif cls == "skirt":
            e["ring"] = _ring_n(pc, body)
            e["chains"], e["bones"] = e["ring"], bones_for_length(L, H)
        elif cls == "strip":
            e["chains"], e["bones"] = 1, (1 if L < SHORT_FLAP_H * H else bones_for_length(L, H))
            if L < SHORT_FLAP_H * H:
                e["why"] = "short flap: one bone with an animator control"
        elif cls == "cape":
            e["chains"], e["bones"] = (1 if float(pc.get("width") or 0) < CAPE_WIDE_H * H else 3), bones_for_length(L, H)
        elif cls == "cluster":
            e["chains"] = 1
            e["bones"] = max(1, min(bones_for_length(L, H), int(pc.get("n_items") or 2) // 2))
        elif cls == "sleeve":
            hang = float(pc.get("z_top", 0) - pc.get("z_min", 0))
            if hang > SLEEVE_HANG_H * H:
                e["chains"], e["bones"] = 1, int(min(2, max(1, round(hang / (BONE_STEP_H * H)))))
            else:
                e["why"] = f"hangs {hang / H:.3f} H <= {SLEEVE_HANG_H} H below the arm: arm skin"
        elif cls == "hair":
            e["chains"], e["bones"] = 1, int(min(5, max(3, round(L / (BONE_STEP_H * H)))))
        elif cls == "rigid_hanging":
            if pc.get("swing") and float(pc.get("drop") or 0) > SWING_DROP_H * H:
                e["chains"], e["bones"] = 1, 1
            else:
                e["why"] = "rigid to its parent (no swing bone unless the brief keeps it)"
        if pc.get("override_chains") is not None and e["chains"]:
            e["chains"] = int(pc["override_chains"])
            if cls == "skirt":  # review m3: any ring of RING_MIN..RING_MAX chains (ring_layout), clamped and reported
                n = int(min(RING_MAX, max(RING_MIN, e["chains"])))
                if n != e["chains"]:
                    e["why"] = f"override of {e['chains']} skirt chains clamped to {n} ({RING_MIN}-{RING_MAX})"
                e["ring"] = e["chains"] = n
        if pc.get("override_bones") is not None and e["chains"]:
            e["bones"] = int(pc["override_bones"])
        out[pid] = e

    def used():
        tot = 0
        for pid, e in out.items():
            n = e["chains"] * e["bones"]
            if e["fan_with"] is not None:
                n -= 1  # a fan shares the root bone of its leader
            tot += n
        return tot

    trims = []
    by_id = {pc["id"]: pc for pc in pieces}
    if used() > aux_budget:  # 1. merge strips into fans (attachment centres within FAN_GAP_H)
        strips = [pid for pid, e in out.items() if by_id[pid]["class"] == "strip" and e["chains"] == 1 and e["bones"] >= 2]
        for i, a in enumerate(strips):
            if out[a]["fan_with"] is not None:
                continue
            pa = np.asarray(by_id[a]["attach"]["points"], float).mean(0)
            for b in strips[i + 1:]:
                if out[b]["fan_with"] is not None or used() <= aux_budget:
                    continue
                pb = np.asarray(by_id[b]["attach"]["points"], float).mean(0)
                if np.linalg.norm(pa - pb) < FAN_GAP_H * H and by_id[a].get("side") == by_id[b].get("side"):
                    out[b]["fan_with"] = a
                    trims.append({"trim": "merge_strips", "piece": b, "fan_root": a})
    if used() > aux_budget:  # 2. bones per chain down to 3
        for pid, e in out.items():
            if e["bones"] > 3:
                trims.append({"trim": "bones_to_3", "piece": pid, "from": e["bones"]})
                e["bones"] = 3
    for frm, to in ((8, 6), (6, 4)):  # 3. drop diagonal skirt chains
        if used() <= aux_budget:
            break
        for pid, e in out.items():
            if e["ring"] == frm:
                e["ring"] = e["chains"] = to
                trims.append({"trim": f"skirt_{frm}_to_{to}", "piece": pid})
    if used() > aux_budget:  # 4. clusters rigid
        for pid, e in out.items():
            if by_id[pid]["class"] == "cluster" and e["chains"]:
                e["chains"] = e["bones"] = 0
                e["why"] = "made rigid by the budget"
                trims.append({"trim": "cluster_rigid", "piece": pid})
    if used() > aux_budget:  # 5. drop swing items
        for pid, e in out.items():
            if by_id[pid]["class"] == "rigid_hanging" and e["chains"]:
                e["chains"] = e["bones"] = 0
                trims.append({"trim": "drop_swing", "piece": pid})
    return {"pieces": out, "used": used(), "trims": trims, "over_budget": used() > aux_budget}


# --------------------------------------------------------------------------------------------------------------------------
# geometry helpers
# --------------------------------------------------------------------------------------------------------------------------


def _unit(v):
    v = np.asarray(v, float)
    n = float(np.linalg.norm(v))
    return v / n if n > 0 else v


def resample(poly, n: int) -> np.ndarray:
    """``n + 1`` points at equal arc length along the polyline ``poly`` (k,3)."""
    poly = np.asarray(poly, float)
    seg = np.linalg.norm(np.diff(poly, axis=0), axis=1)
    s = np.concatenate([[0.0], np.cumsum(seg)])
    if s[-1] <= 0:
        return np.repeat(poly[:1], n + 1, axis=0)
    q = np.linspace(0, s[-1], n + 1)
    return np.stack([np.interp(q, s, poly[:, k]) for k in range(3)], axis=1)


def medial_curve(P, t, att_point, n_bins: int = 10, min_rows: int = 2) -> np.ndarray:
    """Polyline from ``att_point`` through the centroids of the rows ``P`` binned by ``t`` (equal-width bins in [0, 1])."""
    pts = [np.asarray(att_point, float)]
    edges = np.linspace(0, 1, n_bins + 1)
    for i in range(n_bins):
        m = (t >= edges[i]) & (t <= edges[i + 1]) if i == n_bins - 1 else (t >= edges[i]) & (t < edges[i + 1])
        if m.sum() >= min_rows:
            c = P[m].mean(0)
            if np.linalg.norm(c - pts[-1]) > 1e-6:
                pts.append(c)
    if len(pts) == 1:
        pts.append(pts[0] + np.array([0.0, 0.0, -1e-3]))
    return np.asarray(pts)


def medial_curve_z(P, att_point, n_bins: int = 10, min_rows: int = 2) -> np.ndarray:
    """Medial curve of hanging cloth (§3): centroids of horizontal cross-sections (perpendicular to the hanging direction -Z) of
    the rows ``P`` in ``n_bins`` equal z bands from the attachment point down to the hem (2nd percentile of z), starting at
    ``att_point`` and ending at the hem height under the last centroid. Centroids of both cloth faces = mid-thickness."""
    P = np.asarray(P, float)
    z0 = float(att_point[2])
    z1 = float(np.percentile(P[:, 2], 2)) if len(P) else z0 - 1e-3
    pts = [np.asarray(att_point, float)]
    if z1 >= z0 - 1e-6:
        pts.append(pts[0] + np.array([0.0, 0.0, -1e-3]))
        return np.asarray(pts)
    edges = np.linspace(z0, z1, n_bins + 1)
    for i in range(n_bins):
        m = (P[:, 2] <= edges[i]) & (P[:, 2] >= edges[i + 1])
        if m.sum() >= min_rows:
            c = P[m].mean(0)
            if c[2] < pts[-1][2] - 1e-6:
                pts.append(c)
    last = pts[-1].copy()
    if last[2] > z1 + 1e-6:
        last[2] = z1
        pts.append(last)
    return np.asarray(pts)


def hinge_for(head, tail, outward) -> list:
    """Local X for a chain bone: Y = head->tail, Z = ``outward`` made perpendicular to Y, X = Y x Z (a positive X rotation swings
    the tail toward Z, i.e. outward). Falls back to world X when outward is parallel to the bone."""
    y = _unit(np.subtract(tail, head))
    o = np.asarray(outward, float)
    z = o - (o @ y) * y
    if np.linalg.norm(z) < 1e-6:
        z = np.array([0.0, -1.0, 0.0]) - (np.array([0.0, -1.0, 0.0]) @ y) * y
    z = _unit(z)
    x = _unit(np.cross(y, z))
    return [float(c) for c in x]


def _outward(point, axis) -> np.ndarray:
    d = np.array([point[0] - axis[0], point[1] - axis[1], 0.0])
    n = np.linalg.norm(d)
    return d / n if n > 1e-9 else np.array([0.0, -1.0, 0.0])


def _angdiff(a, b):
    return (np.asarray(a, float) - b + 180.0) % 360.0 - 180.0


# --------------------------------------------------------------------------------------------------------------------------
# plan
# --------------------------------------------------------------------------------------------------------------------------


def plan(garments: dict, arrays: dict, mesh: dict, skel: dict, aux_budget: int | None = None, coverage: str = "overlay") -> dict:
    """chains.json document (contract "Phase G"). ``arrays`` = garments.npz dict; ``mesh`` = mesh.npz dict (welded positions are
    the means of the members); ``skel`` = the resolved skeleton (family bones; chain names must not collide with them).

    ``coverage`` (spec §6 ``garment_chain_coverage``: at least ``COVER_MIN_ROWS`` welded rows per chain bone):

    * ``"overlay"`` (G6, default): every pass is checked with the overlay S7 will build (``overlay_coverage``: solvers/
      skin_garment.py ``overlay``, read only) under the metric's dominance rule, on the metric's rows. One cut per piece and pass
      (``_cover_step``): a ring chain whose bones together dominate fewer rows than the minimum is dropped (its neighbours take its
      rows by the azimuth blend), else every chain with a short bone loses one bone (spec §6 "else merge the bone": per chain, so
      the chains that hold their rows keep their bones and their drape; a ring may then mix bone counts); until every bone passes
      or nothing can be cut (explicit ``override_chains`` / ``override_bones`` are never cut). The t / azimuth estimate
      (``_fit_coverage``) missed the transition band (FL: 28 of ``L_skirt_FS``'s 33 rows), the azimuth blend and the inner rows
      riding on other pieces, and said 8+ rows where the metric found 0. Result in ``doc["coverage_check"]`` and
      ``doc["coverage"]``, cuts in the budget trims.
    * ``"estimate"``: G3b's ``_fit_coverage`` only (no overlay; for data without ``outer_ref`` / ``phi``)."""
    if coverage not in ("overlay", "estimate"):
        raise ValueError(f"coverage {coverage!r}: 'overlay' or 'estimate'")
    if coverage == "estimate":
        doc = _plan_pass(garments, arrays, mesh, skel, aux_budget)
        doc["coverage_check"] = {"method": "estimate (t / azimuth bins, _fit_coverage)", "min_rows": COVER_MIN_ROWS}
        return doc
    cover, cuts, n_pass = {}, [], 0
    while True:
        doc = _plan_pass(garments, arrays, mesh, skel, aux_budget, cover, estimate=False)
        n_pass += 1
        missing = sorted({"piece", "t", "phi", "layer", "outer_ref"} - set(arrays or {})) if doc["chains"] else []
        if missing:
            raise ValueError(f"coverage 'overlay' needs garments.npz {missing}; use coverage='estimate'")
        rows = overlay_coverage(garments, arrays, mesh, skel, doc) if doc["chains"] else {}
        step = _cover_step(doc, rows, cover, garments) if n_pass <= COVER_ITERS else []
        if not step:
            break
        cuts += step
    below = sorted(b for b, n in rows.items() if n < COVER_MIN_ROWS and _chain_of(doc, b)["class"] in COVER_CLASSES)
    doc["coverage_check"] = {"method": "overlay (solvers/skin_garment.py overlay, read only; dominant column of alpha x overlay and "
                                       "the body share 1 - alpha as one column, as metrics.garment_weights after the exporter rule)",
                             "min_rows": COVER_MIN_ROWS, "passes": n_pass, "cuts": cuts, "rows_per_bone": rows, "below_min": below,
                             "ok": not below}
    doc["coverage"] = _coverage_records(doc, rows, cuts, garments)
    doc["budget"]["trims"] = list(doc["budget"]["trims"]) + cuts
    if below:
        doc["notes"].append(f"coverage: {len(below)} chain bone(s) below {COVER_MIN_ROWS} rows after every allowed cut: "
                            + ", ".join(f"{b} ({rows[b]})" for b in below))
    return doc


def _spec_id(sp) -> str:
    """Chain id of a placement spec (key, side, ...): ``<side>_<key>`` or ``<key>`` (= the chain id ``plan`` writes)."""
    return sp[0] if not sp[1] else f"{sp[1]}_{sp[0]}"


def _chain_of(doc, bone: str) -> dict:
    return next(c for c in doc["chains"] if any(b["name"] == bone for b in c["bones"]))


def overlay_coverage(garments: dict, arrays: dict, mesh: dict, skel: dict, doc: dict) -> dict:
    """{chain bone: welded rows where it is the dominant weight} for the chains of ``doc``, computed as
    ``metrics.garment_weights`` counts ``garment_chain_coverage`` on the final weights: the overlay of solvers/skin_garment.py
    (``overlay``, called read only on the merged skeleton) times ``alpha``, plus the body share ``1 - alpha`` of the transition
    band as ONE competitor column (the body weights do not exist at S3g and are spread over pelvis / thigh later, so this errs on
    the low side), argmax per welded row (the exporter's top-4 + renormalize keeps the argmax). Rows with no weight do not count.
    On FL's final run this gives the measured coverage within 4 rows per bone (G6)."""
    from solvers import skin_garment  # lazy: rigkit-env only (scipy); Blender imports merge_chains from this module

    skm = merge_chains(skel, doc)
    cols, W, alpha, _, _ = skin_garment.overlay(mesh, garments, arrays, doc, skm)
    a = np.clip(np.asarray(alpha, float), 0.0, 1.0)
    X = np.concatenate([a[:, None] * np.asarray(W, float), (1.0 - a)[:, None]], axis=1)
    dom = X.argmax(1)
    has = X.max(1) > 0
    idx = {str(b): i for i, b in enumerate(cols)}
    return {b["name"]: int(((dom == idx[b["name"]]) & has).sum()) if b["name"] in idx else 0
            for c in doc["chains"] for b in c["bones"]}


def _cover_step(doc: dict, rows: dict, cover: dict, garments: dict) -> list:
    """Cuts for the pieces whose chain bones (classes ``COVER_CLASSES``) dominate fewer than ``COVER_MIN_ROWS`` rows (``rows``):
    a skirt ring above ``RING_MIN`` chains drops its weakest chain when that chain's bones together stay below the minimum (it
    cannot hold even one bone; its neighbours take its rows; one drop per piece and pass, since the neighbours change); else every
    chain with a short bone loses one bone, down to 1 (spec §6 "merge the bone"; equal bone lengths within the chain). Explicit
    overrides (``override_chains`` / ``override_bones``) are never cut. ``L_``/``R_`` partners are cut together (the pair keeps
    mirroring, spec §3 "Names") unless the plan reports their geometry as asymmetric (``doc["asymmetry"]`` with ``max_dev_H``).
    Updates ``cover`` and returns the cuts as budget trims (empty: nothing left to cut)."""
    by_id = {p["id"]: p for p in garments.get("pieces", [])}
    asym = {a["chain"] for a in doc.get("asymmetry", []) if "max_dev_H" in a}
    asym |= {"R_" + x[2:] for x in asym}

    def partner(cid, chs):
        if cid[:2] not in ("L_", "R_") or cid in asym:
            return None
        other = ("R_" if cid[:2] == "L_" else "L_") + cid[2:]
        return next((c for c in chs if c["id"] == other), None)

    groups: dict = {}
    for c in doc["chains"]:
        if c["class"] in COVER_CLASSES:
            groups.setdefault(c["piece"], []).append(c)
    out = []
    for pid, chs in groups.items():
        low = [b["name"] for c in chs for b in c["bones"] if rows.get(b["name"], 0) < COVER_MIN_ROWS]
        if not low:
            continue
        pc = by_id.get(pid, {})
        cv = cover.setdefault(pid, {"drop": [], "bones": {}})
        tot = {c["id"]: sum(rows.get(b["name"], 0) for b in c["bones"]) for c in chs}
        nb = max(len(c["bones"]) for c in chs)
        weak = sorted((c for c in chs if tot[c["id"]] < COVER_MIN_ROWS and c["id"] not in cv["drop"]), key=lambda c: tot[c["id"]])
        pw = partner(weak[0]["id"], chs) if weak else None
        if chs[0]["class"] == "skirt" and weak and len(chs) - (2 if pw else 1) >= RING_MIN and pc.get("override_chains") is None:
            for c in [weak[0]] + ([pw] if pw else []):
                cv["drop"].append(c["id"])
                out.append({"trim": "coverage_drop_chain", "piece": pid, "chain": c["id"], "rows": tot[c["id"]], "bones": nb,
                            "method": "overlay" + (" (mirror partner)" if c is pw else "")})
        elif pc.get("override_bones") is None:
            cut = set()
            for c in chs:
                if any(rows.get(b["name"], 0) < COVER_MIN_ROWS for b in c["bones"]):
                    cut.add(c["id"])
                    pw = partner(c["id"], chs)
                    if pw is not None:
                        cut.add(pw["id"])
            for c in chs:
                n = len(c["bones"])
                if c["id"] in cut and n > 1:
                    cv["bones"][c["id"]] = n - 1
                    out.append({"trim": "coverage_bones", "piece": pid, "chain": c["id"], "from": n, "to": n - 1, "method": "overlay",
                                "below": [b["name"] for b in c["bones"] if rows.get(b["name"], 0) < COVER_MIN_ROWS]})
    return out


def _coverage_records(doc: dict, rows: dict, cuts: list, garments: dict) -> list:
    """``doc["coverage"]`` in G3b's shape (one record per piece of the classes ``COVER_CLASSES``) from the overlay check."""
    out = []
    for pc in garments.get("pieces", []):
        chs = [c for c in doc["chains"] if c["piece"] == pc["id"] and c["class"] in COVER_CLASSES]
        mine = [x for x in cuts if x["piece"] == pc["id"]]
        if not chs and not mine:
            continue
        drops = [x for x in mine if x["trim"] == "coverage_drop_chain"]
        nb = max((len(c["bones"]) for c in chs), default=0)
        bfrom = max([x["from"] for x in mine if x["trim"] == "coverage_bones"] + [nb])
        rpb = {c["id"]: [rows.get(b["name"], 0) for b in c["bones"]] for c in chs}
        out.append({"piece": pc["id"], "class": pc["class"], "bones_from": bfrom, "bones": nb,
                    "bones_per_chain": {c["id"]: len(c["bones"]) for c in chs},
                    "chains_from": len(chs) + len(drops), "chains": len(chs), "rows_per_bone": rpb,
                    "dropped_chains": [{"chain": x["chain"], "rows": x["rows"]} for x in drops], "min_rows": COVER_MIN_ROWS,
                    "ok": all(n >= COVER_MIN_ROWS for v in rpb.values() for n in v), "method": "overlay"})
    return out


def _plan_pass(garments: dict, arrays: dict, mesh: dict, skel: dict, aux_budget: int | None = None, cover: dict | None = None,
               estimate: bool = True) -> dict:
    """One planning pass (``plan``): the chains.json document for the coverage cuts ``cover`` = {piece id: {"drop": [chain ids],
    "bones": {chain id: n}}} of the overlay check (G6). ``estimate``: run the t / azimuth coverage estimate ``_fit_coverage``
    (G3b); the overlay check replaces it (``plan(coverage="overlay")``)."""
    from rigcore import mesh as rmesh

    H = float(garments["H"])
    aux_budget = int(aux_budget if aux_budget is not None else garments.get("budget", {}).get("aux_budget", 32))
    pieces = garments["pieces"]
    doc = {"schema": 0, "asset_id": garments["asset_id"], "H": H, "chains": [], "colliders": [],
           "budget": {"aux_budget": aux_budget, "used": 0, "trims": []}, "asymmetry": [], "notes": [], "crossing": []}
    if not pieces:
        doc["notes"].append(garments.get("note", "no garment pieces"))
        return doc
    body = garments["body"]
    bodyc = {"knee_z": body["knee_z"], "ankle_z": body["ankle_z"]}
    cnt = count_plan(pieces, H, aux_budget, bodyc)
    P = rmesh.welded_positions(np.asarray(mesh["V"], float), np.asarray(mesh["weld"]), mode="mean")
    piece = np.asarray(arrays["piece"])
    t_all = np.asarray(arrays["t"], float)
    layer = np.asarray(arrays["layer"])
    axis = np.asarray(body["axis"], float)
    x_mid = float(body["x_mid"])
    family_names = {b["name"] for b in skel["bones"]}
    used_names = set(family_names)
    chains = []
    strip_no = {"L": 0, "R": 0, None: 0}
    charm_no = hair_no = item_no = 0
    for k, pc in enumerate(pieces):
        e = cnt["pieces"][pc["id"]]
        if not e["chains"]:
            continue
        rows = np.flatnonzero((piece == k) & (layer <= 0))
        if rows.size == 0:
            continue
        Pr, tr = P[rows], t_all[rows]
        att = np.asarray(pc["attach"]["points"], float)
        parent = pc.get("parent") or _parent_for(pc, body, skel)
        if parent not in family_names:
            parent = "pelvis" if "pelvis" in family_names else skel["bones"][0]["name"]
        cls = pc["class"]
        specs = []  # (key, side, azimuth, rows mask, attach point)
        if cls == "skirt":
            ring = e["ring"]
            key = ring
            if ring == 6:  # diagonals where the cloth is fuller
                phi = np.asarray(arrays["phi"], float)[rows]
                front = (np.abs(_angdiff(np.abs(phi), 45)) < 22.5).sum()
                back = (np.abs(_angdiff(np.abs(phi), 135)) < 22.5).sum()
                key = 6 if front >= back else "6b"
            phi = np.asarray(arrays["phi"], float)[rows]
            slits = [s["phi_deg"] for s in pc.get("slits", [])]
            centres = _panel_centres(slits)
            spacing = 360.0 / ring
            for az, ck in ring_layout(key):
                snap = None
                for cand in slits + centres:
                    if abs(_angdiff(cand, az)) <= SNAP_DEG and (snap is None or abs(_angdiff(cand, az)) < abs(_angdiff(snap, az))):
                        snap = cand
                a = float(snap if snap is not None else az)
                win = np.abs(_angdiff(phi, a)) < min(22.5, spacing / 2)
                if win.sum() < 6:
                    win = np.abs(_angdiff(phi, a)) < spacing
                if win.sum() < 3:
                    continue
                aphi = np.degrees(np.arctan2(att[:, 0] - axis[0], -(att[:, 1] - axis[1])))
                dphi = np.abs(_angdiff(aphi, a))
                aw = dphi < spacing / 2
                if not aw.any():  # no attachment row in the window (an opening in the belt line): the nearest ones by azimuth
                    aw = dphi <= np.sort(dphi)[min(2, len(dphi) - 1)]
                ap = att[aw].mean(0)
                side = ck[:1] if ck[:2] in ("L_", "R_") else None
                specs.append((f"skirt_{ck[2:] if side else ck}", side, a, win, ap, snap is not None))
        elif cls == "cape" and e["chains"] == 3:
            x = Pr[:, 0] - x_mid
            lo, hi = np.percentile(x, [33.3, 66.7])
            for key, m in (("C", (x >= lo) & (x <= hi)), ("L", x > hi), ("R", x < lo)):
                aw = (att[:, 0] - x_mid >= lo) & (att[:, 0] - x_mid <= hi) if key == "C" else \
                    ((att[:, 0] - x_mid > hi) if key == "L" else (att[:, 0] - x_mid < lo))
                ap = att[aw].mean(0) if aw.any() else Pr[m][np.argmax(Pr[m, 2])]
                specs.append(("cape_C" if key == "C" else "cape", None if key == "C" else key, None, m, ap, False))
        else:
            ap = att.mean(0)
            side = pc.get("side")
            if ap[0] - x_mid > MIRROR_H * H:
                side = "L"
            elif ap[0] - x_mid < -MIRROR_H * H:
                side = "R"
            else:
                side = None
            if cls == "strip":
                strip_no[side] += 1
                base = f"tail_{strip_no[side]}"
            elif cls == "cape":
                base = "cape_C"
                side = None
            elif cls == "cluster":
                charm_no += 1
                base = f"charm_{charm_no}"
            elif cls == "hair":
                hair_no += 1
                base = f"main_hair_{hair_no}"
            elif cls == "sleeve":
                base = "sleeve"
            else:
                item_no += 1
                base = f"item{item_no}"
            specs.append((base, side, None, np.ones(rows.size, bool), ap, False))
        nb = e["bones"]
        cv = (cover or {}).get(pc["id"]) or {}  # G6: cuts of the overlay coverage check (plan)
        if cv.get("drop"):
            specs = [sp for sp in specs if _spec_id(sp) not in cv["drop"]]
        if cls in COVER_CLASSES and specs:  # G3b: at least COVER_MIN_ROWS rows per bone (spec §6 garment_chain_coverage)
            if estimate:
                specs, nb = _fit_coverage(cls, pc, k, specs, nb, rows, piece, t_all, arrays, cnt, doc)
            nb_of = {_spec_id(sp): min(nb, int((cv.get("bones") or {}).get(_spec_id(sp), nb))) for sp in specs}
            e["bones"] = max(nb_of.values()) if nb_of else nb
            e["chains"] = len(specs)
            if cls == "skirt":
                e["ring"] = len(specs)
        for base, side, az, m, ap, snapped in specs:
            nbs = min(nb, int((cv.get("bones") or {}).get(_spec_id((base, side)), nb)))  # G6: per-chain coverage cut
            if cls == "rigid_hanging":
                cen = Pr.mean(0)
                joints = np.stack([ap, cen])
                names = [_unique(f"{base}_swing", used_names)]
            elif cls == "cluster":
                order = np.argsort(tr)
                poly = medial_curve(Pr[order], tr[order], ap, n_bins=max(4, int(pc.get("n_items") or 4)), min_rows=1)
                joints = resample(poly, nbs)
                names = [_unique(f"{base}_{i + 1:02d}", used_names) for i in range(nbs)]
            else:
                ms = m.copy()
                t_end = (pc.get("material_split") or {}).get("t")
                if t_end:
                    ms &= tr <= t_end
                poly = medial_curve_z(Pr[ms] if ms.sum() >= 2 else Pr[m], ap)
                joints = resample(poly, nbs)
                pre = f"{side}_" if side else ""
                names = [_unique(f"{pre}{base}_{i + 1:02d}", used_names) for i in range(nbs)]
            out_dir = _outward(joints[0], axis) if az is None else np.array([math.sin(math.radians(az)),
                                                                             -math.cos(math.radians(az)), 0.0])
            bones = []
            par = parent
            for i, nm in enumerate(names):
                h, tl = joints[i], joints[i + 1]
                if np.linalg.norm(tl - h) < 1e-5:
                    tl = h + np.array([0.0, 0.0, -1e-3])
                bones.append({"name": nm, "parent": par, "head": [float(c) for c in h], "tail": [float(c) for c in tl],
                              "hinge": hinge_for(h, tl, out_dir)})
                par = nm
            phi0 = float(np.degrees(np.arctan2(joints[0][0] - axis[0], -(joints[0][1] - axis[1])))) if az is None else float(az)
            lp = _leg_push(cls, phi0, joints[0], body, out_dir, H, hem=joints[-1])
            chains.append({"id": names[0].rsplit("_", 1)[0] if cls != "rigid_hanging" else names[0], "piece": pc["id"],
                           "class": cls, "side": side, "parent": parent, "panel": _panel_of(phi0, pc) if cls == "skirt" else None,
                           "azimuth_deg": round(phi0, 2), "snapped": bool(snapped), "fan_root": e.get("fan_with"),
                           "bones": bones, "leg_push": lp,
                           "spring": dict(SPRING, hitRadius=round(HIT_RADIUS * H / 1.8, 5),  # review m2: per the contract
                                          min_leg_distance=_min_leg_distance(joints[0], garments)),
                           "min_leg_distance": _min_leg_distance(joints[0], garments),  # alias of spring's (older readers)
                           "rigid_below_t": (pc.get("material_split") or {}).get("t"),
                           "length": round(float(np.linalg.norm(np.diff(joints, axis=0), axis=1).sum()), 4)})
    _fans(chains, cnt, used_names)
    _symmetrize(chains, x_mid, H, doc)
    _uncross_rings(chains, axis, H, doc)
    _uncross_lateral(chains, H, doc)  # G3b: capes and fans
    _inherit_leg_push(chains, P, arrays, pieces, axis, H, doc)  # G6: clusters, strips and swing items riding on a pushed panel
    doc["chains"] = chains
    doc["colliders"] = colliders(skel, garments)
    doc["budget"] = {"aux_budget": aux_budget, "used": int(sum(len(c["bones"]) for c in chains)), "trims": cnt["trims"],
                     "over_budget": bool(sum(len(c["bones"]) for c in chains) > aux_budget)}
    doc["counts"] = {pid: {k: v for k, v in e.items()} for pid, e in cnt["pieces"].items()}
    return doc


def _joints(ch) -> np.ndarray:
    return np.array([b["head"] for b in ch["bones"]] + [ch["bones"][-1]["tail"]], float)


def _polyline_gap(A, B, n: int = 8) -> float:
    """Smallest distance between two joint polylines (points sampled along every segment of each)."""
    def samp(J):
        u = np.linspace(0.0, 1.0, n)[:, None]
        return np.concatenate([J[i] + u * (J[i + 1] - J[i]) for i in range(len(J) - 1)]) if len(J) > 1 else J
    a, b = samp(A), samp(B)
    return float(np.sqrt(((a[:, None, :] - b[None, :, :]) ** 2).sum(-1)).min())


def _uncross_rings(chains, axis, H, doc, min_gap_frac: float = 0.25, passes: int = 6):
    """§3.2 no-crossing rule (G3): the chains of one ring keep their azimuth order at every joint level. A joint whose azimuth
    passes its neighbour's, or comes closer than ``min_gap_frac`` x their root gap, is turned back about the pelvis axis (radius
    and height kept) to the pair's mid azimuth +- half that gap; bones, hinges and lengths follow. Every fix is listed in
    ``doc["crossing"]`` (the piece is flagged for G2), with the smallest polyline gap of each neighbour pair after the fix."""
    by_piece: dict = {}
    for c in chains:
        if c["class"] == "skirt" and c.get("azimuth_deg") is not None and not c.get("fan_root"):
            by_piece.setdefault(c["piece"], []).append(c)
    ax = np.asarray(axis, float)
    for pid, ring in by_piece.items():
        if len(ring) < 3:
            continue
        ring = sorted(ring, key=lambda c: c["azimuth_deg"])
        J = [_joints(c) for c in ring]
        k = len(ring)
        root = np.array([c["azimuth_deg"] for c in ring], float)
        # joint index per chain and level: every level of a regular ring; roots and hems of a ring of mixed bone counts (G6)
        levels = [[lv] * k for lv in range(J[0].shape[0])] if len({len(j) for j in J}) == 1 else \
            [[0] * k, [len(j) - 1 for j in J]]
        fixes = []
        for _ in range(passes):
            changed = False
            for lev, li in enumerate(levels):
                phi = np.array([math.degrees(math.atan2(j[q, 0] - ax[0], -(j[q, 1] - ax[1]))) for j, q in zip(J, li)])
                for i in range(k):
                    n_ = (i + 1) % k
                    want = (root[n_] - root[i]) % 360.0
                    gap = (phi[n_] - phi[i]) % 360.0
                    gap = gap if gap <= 180.0 + want / 2 else gap - 360.0
                    if gap >= min_gap_frac * want:
                        continue
                    if lev == 0:  # roots on the attachment line: back to their own chain azimuths (the window mean drifted)
                        moves = ((i, root[i]), (n_, root[n_]))
                    else:
                        mid = phi[i] + gap / 2.0
                        moves = ((i, mid - min_gap_frac * want / 2.0), (n_, mid + min_gap_frac * want / 2.0))
                    for idx, a in moves:
                        p = J[idx][li[idx]]
                        r = math.hypot(p[0] - ax[0], p[1] - ax[1])
                        J[idx][li[idx]] = [ax[0] + r * math.sin(math.radians(a)), ax[1] - r * math.cos(math.radians(a)), p[2]]
                        phi[idx] = a
                    fixes.append({"chains": [ring[i]["id"], ring[n_]["id"]], "level": lev, "gap_before_deg": round(float(gap), 2),
                                  "min_gap_deg": round(float(min_gap_frac * want), 2)})
                    changed = True
            if not changed:
                break
        if not fixes:
            continue
        for c, j in zip(ring, J):
            out_dir = np.array([math.sin(math.radians(c["azimuth_deg"])), -math.cos(math.radians(c["azimuth_deg"])), 0.0])
            for i, b in enumerate(c["bones"]):
                b["head"], b["tail"] = [float(v) for v in j[i]], [float(v) for v in j[i + 1]]
                b["hinge"] = hinge_for(j[i], j[i + 1], out_dir)
            c["length"] = round(float(np.linalg.norm(np.diff(j, axis=0), axis=1).sum()), 4)
        gaps = {f"{ring[i]['id']}|{ring[(i + 1) % k]['id']}": round(_polyline_gap(J[i], J[(i + 1) % k]) / H, 4) for i in range(k)}
        seen, uniq = set(), []
        for f in fixes:
            key = (tuple(f["chains"]), f["level"])
            if key not in seen:
                seen.add(key)
                uniq.append(f)
        doc["crossing"].append({"piece": pid, "fixed": uniq, "min_polyline_gap_H": gaps,
                                "why": "chains of one piece crossed (azimuth order changed at a joint level): reordered by turning "
                                       "the joints back into their sectors; check the chain sheet (G2)"})


def bone_rows(t, n: int) -> np.ndarray:
    """Rows each of ``n`` chain bones dominates for chain parameters ``t`` under the overlay's ``along`` rule
    (solvers/skin_garment.py): bone centres at (k + 0.5) / n, a linear blend between neighbours, the parent over the top band, so
    bone k dominates t in [k / n, (k + 1) / n) and the parent t < 1 / (4 n). On FL this reproduces the measured
    ``garment_chain_coverage`` of every robe bone (G3b)."""
    t = np.asarray(t, float)
    t = np.clip(t[np.isfinite(t)], 0.0, 1.0)
    edges = np.arange(n + 1, dtype=float) / n
    edges[0] = 1.0 / (4 * n)
    return np.histogram(t, bins=edges)[0]


def _chain_t(t, pc):
    """``t`` as the chain sees it: a material split maps t / t_split onto the chain (rows below ride on the last bone)."""
    ts = (pc.get("material_split") or {}).get("t")
    return np.clip(np.asarray(t, float) / float(ts), 0.0, 1.0) if ts else np.asarray(t, float)


def _fit_coverage(cls, pc, k, specs, nb, rows, piece, t_all, arrays, cnt, doc):
    """G3b, spec §6 ``garment_chain_coverage``: every chain bone must dominate at least ``COVER_MIN_ROWS`` welded rows (inner-layer
    rows count, they copy their outer row). Rows per bone are estimated from the piece's ``t`` (``bone_rows``); a ring row belongs
    to the chain of the nearest azimuth, a 3-chain cape row to its third. The bones per chain drop (one count per piece, so a ring
    stays regular) until every bone passes; when one chain of a ring cannot hold even one bone, it is merged into its neighbours
    (dropped) and the fit restarts. Every change goes to ``cnt["trims"]`` and ``doc["coverage"]``. Returns (specs, bones)."""
    nb0, specs0 = nb, list(specs)
    rows_all = np.flatnonzero(piece == k)  # outer and inner-layer rows of the piece
    t_c = _chain_t(np.asarray(t_all, float)[rows_all], pc)
    phi_c = np.asarray(arrays.get("phi"), float)[rows_all] if cls == "skirt" and "phi" in arrays else None
    dropped = []

    def groups(sp):
        if cls == "skirt" and phi_c is not None:
            az = np.array([s[2] for s in sp], float)
            ok = np.isfinite(phi_c)
            own = np.abs(_angdiff(phi_c[ok][:, None], az[None, :])).argmin(1)
            return [t_c[ok][own == j] for j in range(len(sp))]
        if len(sp) > 1:  # 3-chain cape: the masks are over the layer-0 rows
            tt = _chain_t(np.asarray(t_all, float)[rows], pc)
            return [tt[s[3]] for s in sp]
        return [t_c]

    while True:
        G = groups(specs)
        fit = next((n for n in range(nb0, 0, -1) if all(bone_rows(g, n).min() >= COVER_MIN_ROWS for g in G)), 0)
        if fit or cls != "skirt" or len(specs) <= RING_MIN:
            break
        weak = int(np.argmin([bone_rows(g, 1).sum() for g in G]))
        dropped.append({"chain": specs[weak][0] if not specs[weak][1] else f"{specs[weak][1]}_{specs[weak][0]}",
                        "rows": int(bone_rows(G[weak], 1).sum())})
        specs = specs[:weak] + specs[weak + 1:]
    nb = fit or 1
    G = groups(specs)
    rec = {"piece": pc["id"], "class": cls, "bones_from": nb0, "bones": nb, "chains_from": len(specs0), "chains": len(specs),
           "rows_per_bone": {(s[0] if not s[1] else f"{s[1]}_{s[0]}"): bone_rows(g, nb).tolist() for s, g in zip(specs, G)},
           "dropped_chains": dropped, "min_rows": COVER_MIN_ROWS, "ok": bool(fit)}
    doc.setdefault("coverage", []).append(rec)
    for d in dropped:
        cnt["trims"].append({"trim": "coverage_merge_chain", "piece": pc["id"], "chain": d["chain"], "rows": d["rows"]})
    if nb != nb0:
        cnt["trims"].append({"trim": "coverage_bones", "piece": pc["id"], "from": nb0, "to": nb})
    if not fit:
        doc["notes"].append(f"{pc['id']}: fewer than {COVER_MIN_ROWS} rows per bone even with one bone per chain (kept 1)")
    return specs, nb


def _uncross_lateral(chains, H, doc, min_gap_frac: float = 0.25, passes: int = 6):
    """G3b, §3.2 no-crossing rule for capes (2-3 chains of one piece, ordered by x) and fans (a leader chain and the sub-chains that
    hang from its root): along the group's lateral axis (x for a cape; for a fan the horizontal axis across the leader's outward
    direction) the chains keep the order of their first common joint level at every level below. A joint that passes its
    neighbour, or comes closer than ``min_gap_frac`` x their first-level gap, is moved along that axis to the pair's midpoint +-
    half that gap (height and depth kept). Fixes go to ``doc["crossing"]`` like the ring fixes."""
    groups = []
    by_piece: dict = {}
    for c in chains:
        if c["class"] == "cape" and not c.get("fan_root"):
            by_piece.setdefault(c["piece"], []).append(c)
    for pid, g in by_piece.items():
        if len(g) >= 2:
            groups.append((pid, "cape", [(c, 0) for c in g], np.array([1.0, 0.0, 0.0])))
    roots = {c["bones"][0]["name"]: c for c in chains}
    fans: dict = {}
    for c in chains:
        fr = c.get("fan_root")
        if fr and fr in roots and c["bones"] and c["bones"][0]["parent"] == fr:
            fans.setdefault(fr, []).append(c)
    for fr, members in fans.items():
        lead = roots[fr]
        o = np.asarray((lead.get("leg_push") or {}).get("dir") or [0.0, -1.0, 0.0], float)
        u = np.array([-o[1], o[0], 0.0])
        u = u / (np.linalg.norm(u) or 1.0)
        nl = len(lead["bones"]) + 1
        groups.append((lead["piece"], "fan", [(lead, 0)] + [(m, nl - (len(m["bones"]) + 1)) for m in members], u))
    for pid, kind, grp, u in groups:
        J = [_joints(c) for c, _ in grp]
        off = [o for _, o in grp]
        nlev = max(o + len(j) for o, j in zip(off, J))
        first = max(off)  # the first level every chain has a joint on
        if any(o + len(j) <= first for o, j in zip(off, J)):
            continue
        ref = [float(J[i][first - off[i]] @ u) for i in range(len(J))]
        order = list(np.argsort(ref))
        gaps0 = [ref[order[i + 1]] - ref[order[i]] for i in range(len(order) - 1)]
        fixes = []
        for _ in range(passes):
            changed = False
            for lev in range(first, nlev):
                live = [i for i in order if 0 <= lev - off[i] < len(J[i])]
                for a_, b_ in zip(live, live[1:]):
                    want = gaps0[order.index(b_) - 1] if order.index(b_) == order.index(a_) + 1 else max(gaps0)
                    pa, pb = J[a_][lev - off[a_]], J[b_][lev - off[b_]]
                    gap = float((pb - pa) @ u)
                    if gap >= min_gap_frac * want:
                        continue
                    mid = 0.5 * float((pa + pb) @ u)
                    for idx, target in ((a_, mid - min_gap_frac * want / 2.0), (b_, mid + min_gap_frac * want / 2.0)):
                        p = J[idx][lev - off[idx]]
                        J[idx][lev - off[idx]] = p + (target - float(p @ u)) * u
                    fixes.append({"chains": [grp[a_][0]["id"], grp[b_][0]["id"]], "level": lev, "gap_before_m": round(gap, 4),
                                  "min_gap_m": round(min_gap_frac * want, 4)})
                    changed = True
            if not changed:
                break
        if not fixes:
            continue
        for (c, _), j in zip(grp, J):
            out_dir = np.asarray((c.get("leg_push") or {}).get("dir") or [0.0, -1.0, 0.0], float)
            for i, b in enumerate(c["bones"]):
                b["head"], b["tail"] = [float(v) for v in j[i]], [float(v) for v in j[i + 1]]
                b["hinge"] = hinge_for(j[i], j[i + 1], out_dir)
            c["length"] = round(float(np.linalg.norm(np.diff(j, axis=0), axis=1).sum()), 4)
        seen, uniq = set(), []
        for f in fixes:
            key = (tuple(f["chains"]), f["level"])
            if key not in seen:
                seen.add(key)
                uniq.append(f)
        doc["crossing"].append({"piece": pid, "group": kind, "fixed": uniq,
                                "why": f"{kind} chains crossed (lateral order changed at a joint level): reordered; check the chain "
                                       "sheet (G2)"})


def _unique(name, used):
    nm, k = name, 2
    while nm in used:
        nm = f"{name}_{k}"
        k += 1
    used.add(nm)
    return nm


def _panel_centres(slits):
    if len(slits) < 2:
        return []
    s = sorted(slits)
    out = []
    for i, a in enumerate(s):
        b = s[(i + 1) % len(s)] + (360.0 if i == len(s) - 1 else 0.0)
        c = 0.5 * (a + b)
        out.append(((c + 180.0) % 360.0) - 180.0)
    return out


def _panel_of(phi, pc):
    """Index of the panel (interval between consecutive slits, sorted by azimuth) that holds ``phi``; 0 without slits."""
    s = sorted(x["phi_deg"] for x in pc.get("slits", []))
    if len(s) < 2:
        return 0
    for i, a in enumerate(s):
        b = s[(i + 1) % len(s)]
        span = (b - a) % 360.0
        if (phi - a) % 360.0 <= span:
            return i
    return 0


def _parent_for(pc, body, skel):
    names = {b["name"] for b in skel["bones"]}
    cls = pc["class"]
    zt = float(pc.get("z_top", 0))
    if cls == "cape":
        return "neck" if ("neck" in names and zt > float(body.get("chest_z", 0)) + 0.5 * (zt - float(body.get("chest_z", 0)))
                          and zt > float(body.get("chest_z", 0)) + 0.06 * float(pc.get("length", 0) or 0)) else "chest"
    if cls == "hair":
        return "head"
    if cls in ("sleeve", "rigid_hanging"):
        return pc["attach"]["bone"]
    sp = next((b for b in skel["bones"] if b["name"] == "spine_01"), None)
    if sp is not None and zt > float(sp["head"][2]):
        return "spine_01"
    return "pelvis"


def _leg_push(cls, phi, root, body, out_dir, H: float, hem=None) -> dict:
    """§4 leg push of a chain root: every skirt chain; a strip in front of or behind the legs (|phi| < 60 or > 120 deg) whose root
    hangs from the belt (at most ``LEG_PUSH_ROOT_H`` x H above the hip joint; review m1: a fraction of H, not 5 cm) and whose hem
    reaches below the hip joint (it actually hangs over the legs)."""
    s = math.sin(math.radians(phi))
    front_back = abs(phi) < 60 or abs(phi) > 120
    z_hip = float(body["z_hip"])
    low = float(root[2]) <= z_hip + LEG_PUSH_ROOT_H * H and (hem is None or float(hem[2]) < z_hip)
    enabled = cls == "skirt" or (cls == "strip" and front_back and low)
    facing = abs(math.cos(math.radians(phi))) >= FACING_COS  # G3b: 80 deg facing a leg, 60 deg at the side; drape below the root
    return {"enabled": bool(enabled), "w_L": round(0.5 + 0.35 * s, 4), "w_R": round(0.5 - 0.35 * s, 4),
            "dir": [round(float(c), 5) for c in out_dir], "max_deg": LEG_PUSH_FACING_DEG if facing else LEG_PUSH_SIDE_DEG,
            "drape": DRAPE}


def _nearest(A, B, pairs: int = 2_000_000):
    """Distance (m) and index of the nearest row of ``B`` (m,3) for every row of ``A`` (k,3); brute force in chunks of about
    ``pairs`` point pairs (numpy only)."""
    A, B = np.asarray(A, float), np.asarray(B, float)
    d, j = np.empty(len(A)), np.empty(len(A), np.int64)
    step = max(1, pairs // max(len(B), 1))
    for i in range(0, len(A), step):
        D = ((A[i:i + step, None, :] - B[None, :, :]) ** 2).sum(-1)
        j[i:i + step] = D.argmin(1)
        d[i:i + step] = np.sqrt(D[np.arange(len(D)), j[i:i + step]])
    return d, j


PANEL_SHARE_K = 6  # panel rows nearest an inherited drape bone's head whose median fold share scales the item's drape


def _panel_fold_share(s_ch, panel_rows, P, arrays, head) -> float | None:
    """Fold share of the panel beside ``head`` (review G r4 F1): for the ``PANEL_SHARE_K`` rows of ``panel_rows`` (welded ids of the
    source chain's layer-0 rows) nearest ``head``, the share of their along-chain weight (solvers/skin_garment.py ``along`` on the
    row's ``t``, the overlay's own rule) on the panel's bones 02 .. n over bones 01 .. n; the median. None when it cannot be measured
    (no rows, no ``t``, a one-bone panel)."""
    from solvers.skin_garment import along  # lazy: rigkit-env only; Blender imports merge_chains from this module

    nb = len(s_ch["bones"])
    t_all = arrays.get("t")
    if nb < 2 or t_all is None or panel_rows.size == 0:
        return None
    d = np.linalg.norm(P[panel_rows] - head[None, :], axis=1)
    near = panel_rows[np.argsort(d)[:PANEL_SHARE_K]]
    t = np.asarray(t_all, float)[near]
    t = t[np.isfinite(t)]
    if t.size == 0:
        return None
    A = along(t, nb, s_ch.get("rigid_below_t"), hem_ramp=(s_ch.get("class") == "strip"))
    chain = A[:, 1:].sum(1)
    ok = chain > 1e-9
    if not ok.any():
        return None
    return float(np.median(A[ok, 2:].sum(1) / chain[ok]))


def _inherit_leg_push(chains, P, arrays, pieces, axis, H: float, doc) -> None:
    """G6 (spec §4): a cluster, strip or ``rigid_hanging`` swing chain whose own leg push is off, but whose layer-0 rows lie over a
    pushed chain's panel (at least ``INHERIT_SHARE`` of them within ``INHERIT_GAP_H`` x H of the panel's rows, in front of or behind
    it), inherits that chain's leg push: same ``dir``, ``w_L`` / ``w_R``, ``max_deg`` and ``drape``. It then moves with the panel
    instead of through it (FL: the bead string g08 hangs 0.03 H in front of the robe, whose front chains the legs push: 180 faces of
    layer penetration at hip_flexion_R_m60). The source is the pushed chain owning most of the nearby panel rows (ring rows by the
    nearest chain azimuth, a strip's rows by its chain, a fan member's rows by the fan's leader, which carries the push). The
    chain's hinges follow the inherited direction (S5 pivots its push helper on the panel root's control, so both turn about the
    same axis). ``drape_bone`` (G7: an inherited push inherits the drape too): among the item's bones below its root whose head is
    at or below the panel's fold (the head of the panel's bone 02, + 1% H; none: the lowest bone), the nearest to the fold gets the
    drape counter-rotation ``-drape x fold_share x push`` about the panel's fold axis (S5 copies the panel's bone-02 control), so the
    item hangs with the panel instead of standing off it as a rigid rod (FL G6, no drape: at ``sit`` the beads turned 71 deg while
    the robe's bone 02 turned 18 deg, 10-24 cm off the robe). ``fold_share`` (``_panel_fold_share``, review G r4 F1): the overlay's
    bone-02-and-below share of the panel rows beside the drape bone's head, so the item never folds more than the panel next to it
    (the full drape sank FL's beads into the robe). Same rule inside or outside the panel. None = no drape (the source has one bone
    or no drape, the item has one bone, or the share is 0 / not measurable). Recorded in ``leg_push.inherited``
    (``panel_fold_head``; ``drape_offset_H``: the drape bone's head to that fold, x H; ``panel_fold_z``: the middles of the panel's
    bones 01 and 02, kept for reference; ``fold_share``; ``panel_drape``) and ``doc["leg_push_inherited"]``; S5
    (rigkit/control.py) builds the push and drape helpers from it."""
    doc["leg_push_inherited"] = []
    if "piece" not in arrays or "layer" not in arrays:
        return
    piece, layer = np.asarray(arrays["piece"]), np.asarray(arrays["layer"])
    phi_all = arrays.get("phi")
    idx = {p["id"]: k for k, p in enumerate(pieces)}
    by_root = {c["bones"][0]["name"]: c for c in chains if c["bones"]}

    def source(c):  # the chain whose push moves this chain's rows (a fan member: the leader, which owns the shared root)
        return by_root.get(c.get("fan_root"), c) if c.get("fan_root") else c

    pushed: dict = {}
    for c in chains:
        if (source(c).get("leg_push") or {}).get("enabled") and c["piece"] in idx:
            pushed.setdefault(c["piece"], []).append(c)
    R, O, src = [], [], []
    for pid, lst in pushed.items():
        rows = np.flatnonzero((piece == idx[pid]) & (layer <= 0))
        if rows.size == 0:
            continue
        if len(lst) > 1 and phi_all is not None and lst[0]["class"] == "skirt":
            az = np.array([c["azimuth_deg"] for c in lst], float)
            ph = np.nan_to_num(np.asarray(phi_all, float)[rows], nan=0.0)
            own = np.abs(_angdiff(ph[:, None], az[None, :])).argmin(1)
        else:
            own = np.zeros(rows.size, np.int64)
        for j, c in enumerate(lst):
            m = own == j
            if m.any():
                R.append(rows[m])
                O.append(np.full(int(m.sum()), len(src)))
                src.append(source(c))
    if not R:
        return
    R, O = np.concatenate(R), np.concatenate(O)
    ax = np.asarray(axis, float)
    for c in chains:
        lp = c.get("leg_push") or {}
        if c["class"] not in INHERIT_CLASSES or lp.get("enabled") or c.get("fan_root") or c["piece"] not in idx:
            continue
        rows = np.flatnonzero((piece == idx[c["piece"]]) & (layer <= 0))
        other = piece[R] != idx[c["piece"]]
        if rows.size == 0 or not other.any():
            continue
        Rp, Op = R[other], O[other]
        d, j = _nearest(P[rows], P[Rp])
        near = d <= INHERIT_GAP_H * H
        share = float(near.mean())
        if share < INHERIT_SHARE:
            continue
        votes: dict = {}
        for k in Op[j[near]].tolist():
            votes[src[k]["id"]] = votes.get(src[k]["id"], 0) + 1
        s_id = max(votes, key=lambda k: (votes[k], k))
        s_ch = next(x for x in src if x["id"] == s_id)
        slp = s_ch["leg_push"]
        rad_i = np.hypot(P[rows[near], 0] - ax[0], P[rows[near], 1] - ax[1])
        rad_p = np.hypot(P[Rp[j[near]], 0] - ax[0], P[Rp[j[near]], 1] - ax[1])
        outside = bool(np.median(rad_i - rad_p) >= 0.0)
        fold = None  # z of the middle of the panel's bone 01 (fold starts) and bone 02 (fully folded)
        fold_head = None  # the panel's fold: the head of its bone 02, where its drape helper pivots
        if len(s_ch["bones"]) >= 2 and float(slp.get("drape") or 0.0) > 0:
            fold = [0.5 * (float(s_ch["bones"][q]["head"][2]) + float(s_ch["bones"][q]["tail"][2])) for q in (0, 1)]
            fold_head = np.asarray(s_ch["bones"][1]["head"], float)
        db, db_off = None, None
        if fold_head is not None and len(c["bones"]) >= 2:
            # G7 + orchestrator: among the bones whose head is at or below the panel's fold (+ 1% H) the nearest to the fold takes
            # the drape; no such bone: the lowest bone. Its drape is scaled below by the panel's fold share at that height.
            cand = [(1 + q, b) for q, b in enumerate(c["bones"][1:]) if float(b["head"][2]) <= float(fold_head[2]) + 0.01 * H]
            if not cand:
                cand = [(len(c["bones"]) - 1, c["bones"][-1])]
            dist = [float(np.linalg.norm(np.asarray(b["head"], float) - fold_head)) for _, b in cand]
            q = int(np.argmin(dist))
            db, db_off = cand[q][1]["name"], dist[q]
        new = {k: copy.deepcopy(v) for k, v in slp.items() if k not in ("inherited", "drape_bone")}
        new["enabled"] = True
        new["drape_bone"] = db
        fold_share = None
        if db is not None:
            # Review G r3 N1 / r4 F1: the panel row beside the drape bone's head is only partly folded. Its fold share is the share
            # of its chain weight on bone 02 and below, under the overlay's own along-chain rule (skin_garment.along on the row's t,
            # median of the PANEL_SHARE_K panel rows nearest the head). Down the panel the share only grows, so an item that folds by
            # that share of the panel's drape never folds more than the panel row beside it (outside: it stands off a little lower
            # down instead of sinking in). FL: z-ramp 0.62 vs overlay 0.21; the full drape sank the beads up to 3.5 cm (71-98 faces
            # at the five deep leg-push poses). No measurable share or a share of 0: no drape bone.
            fold_share = _panel_fold_share(s_ch, R[np.array([src[o] is s_ch for o in O], bool)], P, arrays,
                                           np.asarray(next(b for b in c["bones"] if b["name"] == db)["head"], float))
            if fold_share is None or fold_share <= 0.0:
                new["drape_bone"] = None
                new["drape"] = 0.0
            else:
                new["drape"] = round(float(slp.get("drape") or 0.0) * fold_share, 4)
        new["inherited"] = {"from": s_id, "from_piece": s_ch["piece"], "rows": int(rows.size), "rows_over": int(near.sum()),
                            "share": round(share, 3), "gap_p50_H": round(float(np.median(d[near])) / H, 4),
                            "position": "outside" if outside else "inside", "votes": votes,
                            "panel_fold_z": None if fold is None else [round(z, 5) for z in fold],
                            "panel_fold_head": None if fold_head is None else [round(float(x), 5) for x in fold_head],
                            "drape_offset_H": None if db_off is None else round(db_off / H, 4),
                            "fold_share": None if fold_share is None else round(fold_share, 4),
                            "panel_drape": slp.get("drape"),
                            "own": {k: lp.get(k) for k in ("enabled", "w_L", "w_R", "dir", "max_deg")}}
        c["leg_push"] = new
        for b in c["bones"]:
            b["hinge"] = hinge_for(b["head"], b["tail"], new["dir"])
        doc["leg_push_inherited"].append({"chain": c["id"], "class": c["class"], "piece": c["piece"], "drape_bone": new["drape_bone"],
                                          **new["inherited"]})
        doc["notes"].append(f"{c['id']}: rides on the pushed panel of {s_id} ({int(near.sum())}/{rows.size} rows within "
                            f"{INHERIT_GAP_H} H, {'outside' if outside else 'inside'}): inherits its leg push (drape on "
                            f"{new['drape_bone'] or 'no bone'}, x {new.get('drape')})")


def _fans(chains, cnt, used_names):
    """Budget trim 1: a strip merged into a fan reuses the leader's root bone (its sub-chain starts at bone 02)."""
    lead = {c["piece"]: c for c in chains}
    for c in chains:
        e = cnt["pieces"].get(c["piece"], {})
        fw = e.get("fan_with")
        if fw and fw in lead and len(c["bones"]) >= 2:
            root = lead[fw]["bones"][0]["name"]
            used_names.discard(c["bones"][0]["name"])
            c["bones"] = c["bones"][1:]
            c["bones"][0]["parent"] = root
            c["fan_root"] = root


def _symmetrize(chains, x_mid, H, doc):
    """Pair ``L_x`` / ``R_x`` chains; when every joint mirrors within ``SYM_TOL_H`` the pair is averaged so it mirrors exactly
    (well within the 1% H contract); otherwise the asymmetry is reported in ``doc["asymmetry"]``."""
    by = {c["id"]: c for c in chains}
    for c in chains:
        if not c["id"].startswith("L_"):
            continue
        r = by.get("R_" + c["id"][2:])
        if r is None:
            doc["asymmetry"].append({"chain": c["id"], "why": "no R_ partner (asymmetric garment)"})
            continue
        if len(r["bones"]) != len(c["bones"]):
            doc["asymmetry"].append({"chain": c["id"], "why": f"bone counts differ ({len(c['bones'])} vs {len(r['bones'])})"})
            continue
        JL = np.array([b["head"] for b in c["bones"]] + [c["bones"][-1]["tail"]])
        JR = np.array([b["head"] for b in r["bones"]] + [r["bones"][-1]["tail"]])
        JRm = JR.copy()
        JRm[:, 0] = 2 * x_mid - JRm[:, 0]
        dev = float(np.linalg.norm(JL - JRm, axis=1).max())
        if dev <= SYM_TOL_H * H:
            A = 0.5 * (JL + JRm)
            B = A.copy()
            B[:, 0] = 2 * x_mid - B[:, 0]
            for ch, J in ((c, A), (r, B)):
                for i, b in enumerate(ch["bones"]):
                    b["head"], b["tail"] = [float(v) for v in J[i]], [float(v) for v in J[i + 1]]
            for bl, br in zip(c["bones"], r["bones"]):
                br["hinge"] = _mirror_hinge(bl["hinge"])
            doc["notes"].append(f"{c['id']}/{r['id']}: mirrored (max deviation before {dev / H:.4f} H)")
        else:
            doc["asymmetry"].append({"chain": c["id"], "partner": r["id"], "max_dev_H": round(dev / H, 4),
                                     "why": "garment asymmetric beyond the symmetrize tolerance"})


def _mirror_hinge(h):
    """Hinge of the mirrored bone: mirror the axis vector about the YZ plane (x -> -x) and flip it (a mirror reverses the
    handedness, so the rotation sense is kept by negating), i.e. (x, y, z) -> (x, -y, -z)."""
    return [float(h[0]), float(-h[1]), float(-h[2])]


def colliders(skel, garments) -> list:
    """Capsule colliders (§1.3; Kawaii-style hints for a spring runtime or a bake): thighs and calves with the S3g leg-capsule
    radii, and the pelvis with a radius of 0.08 H (inference). ``offset`` / ``tail`` = capsule end points in metres (Blender
    frame, rest pose)."""
    H = float(garments["H"])
    caps = (garments.get("body") or {}).get("leg_capsules") or {}
    out = []
    for nm, c in caps.items():
        if nm.split("_", 1)[-1] in ("Thigh", "Calf"):
            out.append({"bone": nm, "shape": "capsule", "offset": c["head"], "tail": c["tail"], "radius": c["radius"]})
    for b in skel["bones"]:
        if b["name"] == "pelvis":
            out.append({"bone": "pelvis", "shape": "capsule", "offset": b["head"], "tail": b["tail"], "radius": round(0.08 * H, 4)})
    return out


def _min_leg_distance(root, garments) -> float | None:
    """Rest distance (m) from a chain root to the nearest leg-capsule surface (thigh or calf): the Kawaii BoneConstraint-style
    minimum skirt-to-leg distance (§1.2). None without leg capsules."""
    caps = (garments.get("body") or {}).get("leg_capsules") or {}
    best = None
    r0 = np.asarray(root, float)
    for nm, c in caps.items():
        if nm.split("_", 1)[-1] not in ("Thigh", "Calf"):
            continue
        a, b = np.asarray(c["head"], float), np.asarray(c["tail"], float)
        ab = b - a
        t = float(np.clip((r0 - a) @ ab / max(float(ab @ ab), 1e-12), 0, 1))
        d = float(np.linalg.norm(r0 - (a + t * ab))) - float(c["radius"])
        best = d if best is None else min(best, d)
    return None if best is None else round(best, 5)


def axis_token(v) -> str:
    """Dominant world axis of ``v`` as a bend-test token: ``"+X"``, ``"-Y"`` ... (ties: X before Y before Z)."""
    v = np.asarray(v, float)
    i = int(np.argmax(np.abs(v)))
    return ("-" if v[i] < 0 else "+") + "XYZ"[i]


def chain_outward(chain) -> list:
    """Unit outward (horizontal) direction of a chain: its ``leg_push.dir`` (written for every chain by ``plan``)."""
    d = np.asarray((chain.get("leg_push") or {}).get("dir") or [0.0, -1.0, 0.0], float)
    n = float(np.linalg.norm(d))
    return [float(c) for c in (d / n if n > 0 else np.array([0.0, -1.0, 0.0]))]


def merge_chains(skel: dict, chains: dict) -> dict:
    """Resolved skeleton + chains.json -> a new skeleton dict with every chain bone appended (parent before child) as an ordinary
    bone: ``kind "aux"``, ``deform true``, ``side`` from the ``L_``/``R_`` prefix, ``twist null``, plus ``chain`` (chain id) and
    ``piece`` (piece id). Each chain root gets the family bend-test syntax with an explicit world direction,
    ``"swings outward (<axis>)"`` (<axis> = the dominant axis of the chain's outward direction, parsed by
    ``rigkit/skeleton.py`` ``parse_bend_test``: a positive local-X rotation moves the tail that way), and ``outward`` = the exact
    unit vector. Raises ``ValueError`` on a name collision or an unknown parent. The input is not modified."""
    out = copy.deepcopy(skel)
    names = {b["name"] for b in out["bones"]}
    for c in (chains or {}).get("chains", []):
        for i, b in enumerate(c["bones"]):
            if b["name"] in names:
                raise ValueError(f"merge_chains: chain bone {b['name']!r} collides with an existing bone")
            if b["parent"] not in names:
                raise ValueError(f"merge_chains: chain bone {b['name']!r}: parent {b['parent']!r} is not in the skeleton")
            side = b["name"][0] if b["name"][:2] in ("L_", "R_") else None
            nb = {"name": b["name"], "parent": b["parent"], "side": side, "kind": "aux", "deform": True,
                  "head": list(map(float, b["head"])), "tail": list(map(float, b["tail"])), "hinge": list(map(float, b["hinge"])),
                  "bend_test": None, "twist": None, "chain": c["id"], "piece": c["piece"]}
            if i == 0:
                o = chain_outward(c)
                nb["bend_test"] = f"swings outward ({axis_token(o)})"
                nb["outward"] = o
            out["bones"].append(nb)
            names.add(b["name"])
    return out


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="S3g chain plan: garments.json/.npz -> chains.json (G1)")
    ap.add_argument("--garments", required=True, help="garments.json (garments.npz next to it)")
    ap.add_argument("--mesh", required=True, help="mesh.npz after S2")
    ap.add_argument("--skeleton", required=True, help="resolved skeleton.json")
    ap.add_argument("--aux-budget", type=int, default=None)
    ap.add_argument("--out", required=True, help="chains.json path")
    ap.add_argument("--merged", help="optional: write the skeleton with the chains merged here")
    a = ap.parse_args(argv)
    g = npzio.read_json(a.garments)
    gz = os.path.splitext(a.garments)[0] + ".npz"
    arrays = {}
    if os.path.isfile(gz):
        with np.load(gz, allow_pickle=False) as z:
            arrays = {k: z[k] for k in z.files}
    mesh = npzio.load_mesh(a.mesh)
    skel = npzio.read_json(a.skeleton)
    doc = plan(g, arrays, mesh, skel, a.aux_budget)
    npzio.write_json(a.out, doc)
    if a.merged:
        npzio.write_json(a.merged, merge_chains(skel, doc))
    print(json.dumps({"chains": [(c["id"], c["class"], len(c["bones"])) for c in doc["chains"]], "budget": doc["budget"],
                      "asymmetry": len(doc["asymmetry"]), "crossing": len(doc.get("crossing") or [])}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
