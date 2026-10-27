"""solvers.garments - S3g: classify long clothing and hanging accessories (owner G1, phase G) -> garments.json + garments.npz.

Spec: ``references/cloth-and-attachments.md`` §2 (classes), §3 (attachment, length), §5.1 (t, phi), §5.4 (layers), §7 (overrides).
Runs on the WELDED topology after S3 (needs the resolved skeleton for the leg, torso and arm segments).

Tripo meshes fuse clothing into the main island, so islands alone do not separate cloth from the body. The classifier combines:

* **compact islands** (largest extent < ``item_extent_H``) that do not enclose a bone (generalized winding number of the island at
  bone sample points): a line of >= 3 similar small islands = ``cluster`` (beads, charms); an island whose centroid hangs below
  the point where it touches the rest of the mesh = ``rigid_hanging`` (lantern, flask, pouch); tiny islands touching a bigger item
  join it; everything else (helmet, eyes, horns, bricks, ornaments) stays body skin;
* **free rows** (``free_rows``): below the hip-joint height, rows outside the leg capsules (thigh, calf, foot; radius measured on
  the calf) whose probe point 1.5% H toward the nearest bone is not inside flesh (generalized winding number); above it, thin
  rows (S1 thickness) whose inward horizontal ray meets the next surface only beyond 1.5% H (capes, sleeves, hair). Connected
  free rows form the candidate pieces;
* **per piece**: attachment line (rows next to the body, at the top), geodesic ``t`` from it, length (p98 geodesic), width,
  azimuth coverage around the pelvis axis, slits (gaps between the open loops of horizontal sections), hem loop, side, layer
  (outward horizontal rays: a row with another cloth sheet outside it is an inner layer, ``outer_ref`` = nearest welded id of that
  sheet) -> class + confidence + reasons. Pieces below ``conf_flag`` go to ``flags``.

Classes: ``skirt`` (covers >= ``skirt_cover_deg`` around the pelvis axis and reaches below the crotch), ``cape`` (attached at
the shoulder/neck line behind the torso, hangs below mid-back), ``hair`` (attached at the head), ``sleeve`` (attached to an arm),
``strip`` (any other piece hanging from the waist: tails, flaps, apron, loincloth), ``tight`` (free rows that do not hang:
hoods, collars; body skin, no chains), ``cluster``, ``rigid_hanging``.

garments.npz (per welded id): ``piece`` int32 (-1 = body), ``t`` float32 (NaN off garments), ``phi`` float32 (degrees, 0 = front
-Y, 90 = character's left +X; skirt pieces only, else NaN), ``layer`` int8 (0 = outermost; -1 = body rows), ``outer_ref`` int32
(outermost-layer welded id copied by an inner-layer row, -1 if none), ``meta`` JSON. Inner-layer rows carry the ``t``/``phi`` of
their ``outer_ref``.

Overrides (``--garments``, §7): ``{schema, aux_budget, pieces: {<id>: {class, chains, bones, merge_with, parent, disable, rigid,
swing}}, chain_names, spring_hints}``. Legacy families (``S_legacy_D01``) exit early with an empty plan.

Units: metres, Blender frame (Z up, front -Y, character's left +X), object space after S2. numpy + scipy + libigl (rigkit-env).
"""
from __future__ import annotations

import argparse
import json
import math
import os
import sys
import time

import numpy as np

if __name__ == "__main__":  # bootstrap: run as a script with -I
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rigcore import mesh as rmesh  # noqa: E402
from rigcore import npzio  # noqa: E402
from solvers import skin_common as sc  # noqa: E402

LEGACY_FAMILIES = ("S_legacy_D01",)
CLASSES = ("tight", "skirt", "strip", "cape", "cluster", "sleeve", "hair", "rigid_hanging")
CLOTH_CLASSES = ("skirt", "strip", "cape", "sleeve", "hair")  # sheets that can be an outer layer

#: every number is an inference (cloth-and-attachments.md "Labels"); P5 calibrates them. Lengths are fractions of H.
PARAMS = {
    "tight_H": 0.015,  # cloth within this of the body surface is tight (§2)
    "inside_wn": 0.8,  # winding number above this = the probe is inside flesh
    "inside_frac_max": 0.5,  # a lower component with more probes inside flesh than this is body
    "thin_H": 0.008,  # S1 thin-part threshold (mesh-intake.md)
    "leg_r_pct": 20.0,  # percentile of calf-row distances = calf skin radius
    "leg_r_scale": 1.5,  # leg capsule = scale x calf radius (thigh x thigh_r_scale more)
    "thigh_r_scale": 1.25,
    "leg_r_min_H": 0.02,
    "leg_r_max_H": 0.07,
    "foot_r_frac": 0.6,  # foot capsule radius = frac x (foot + toe length)
    "item_extent_H": 0.15,  # compact island: largest bbox extent below this
    "item_touch_H": 0.01,  # a tiny island within this of a bigger item joins it
    "hang_drop_H": 0.02,  # rigid_hanging: centroid below its contact point by more than this
    "contact_H": 0.01,  # item rows this close to the rest of the mesh touch it; the highest one is the attachment
    "hug_H": 0.06,  # an island around a bone is a body part when its rows lie closer than this to the bones (median)
    "touch_frac_max": 0.5,  # an item touching the rest with more of its rows is embedded (eyes, studs), not hanging
    "cluster_min_items": 3,
    "cluster_item_H": 0.06,
    "cluster_link": 2.5,  # items link when centroids are closer than link x item size
    "min_piece_rows": 8,
    "attach_band_H": 0.03,  # attachment rows: boundary rows within this of the piece's top
    "skirt_cover_deg": 180.0,  # ring coverage below the crotch when S1 cloth_bridging is detected
    "skirt_ring_deg": 240.0,  # ring coverage below the crotch without S1 cloth_bridging
    "sector_deg": 30.0,  # skirt t is normalized per azimuth sector
    "floor_H": 0.05,  # hem below ankle + this = floor length
    "strip_rows_per_bone": 8,  # §3.2 (G3): a strip keeps its chain with >= 8 welded rows per planned bone (was 40 rows)
    "strip_min_width_H": 0.02,
    "strip_merge_H": 0.05,
    "free_on_body_frac": 0.5,  # §3 free length (G3): a t bin with at least this share of rows on the body still lies on it
    "mat_min_frac": 0.15,  # a material holding at least this share of a chain's rows below another one splits the chain
    "slit_min_deg": 6.0,
    "slit_merge_deg": 12.0,
    "layer_range_H": 0.2,  # outward rays look this far for an outer sheet
    "inner_frac": 0.6,  # a piece is an inner layer when this fraction of its rows are
    "hang_min_H": 0.04,  # a free piece hanging less than this below its attachment is tight
    "conf_flag": 0.6,
    "own_rings": 2,  # M3 (G4): an OPEN lower component is flesh-tested without its own faces (+ this many rings), fused or not
    "sheet_probe_H": 0.004,  # M3 (G4): upper rows: probe this far behind the row (toward the body axis) for air vs flesh
    "sheet_max_H": 0.02,  # M3 (G4): a closed shell thinner than this (inward ray to its exit) is a slab sheet (thick cape, cloak)
    "slab_min_rows": 20,  # M3 (G4): a closed group of new sheet rows counts with at least this many slab rows
    "closed_rim_frac": 0.05,  # M3 (G4): a piece with fewer of its rows on a mesh boundary than this is a closed surface
    "closed_flat_max": 0.35,  # M3 (G4): a closed strip/cape whose section is rounder than this (sv3 / sv2) is a tube or blob
    "sleeve_big_H": 0.25,  # M3 (G4): a "sleeve" wider or longer than this is flagged (wing membrane, cape on the arm?)
    "sleeve_attach_H": 0.06,  # M3 wings (G5): a sleeve's attachment rows lie within this of its arm bones (it hangs FROM the arm)
    "sleeve_torso_frac": 0.25,  # M3 wings (G5): a sleeve touching torso rows for more than this share of its body contact is a membrane
    "cape_reach_H": 0.15,  # M3 wings (G5): a cape reaching sideways past the shoulder joints + this is a wing or membrane
}

ARM_BASES = ("Clavicle", "UpperArm", "ForeArm", "Hand")
LEG_BASES = ("Thigh", "Calf", "Foot", "Toe")
TORSO = ("pelvis", "spine_01", "spine_02", "spine_03", "chest", "neck", "head")


def _r(x, nd=4):
    if isinstance(x, (list, tuple, np.ndarray)):
        return [_r(v, nd) for v in np.asarray(x).tolist()]
    return None if x is None or (isinstance(x, float) and not math.isfinite(x)) else round(float(x), nd)


# --------------------------------------------------------------------------------------------------------------------------
# body model from the skeleton
# --------------------------------------------------------------------------------------------------------------------------


def _bones(skel) -> dict:
    return {b["name"]: b for b in skel["bones"]}


def _seg(b):
    return np.asarray(b["head"], float), np.asarray(b["tail"], float)


def body_model(P, skel, H: float, params: dict) -> dict:
    """Leg/torso/arm segments and radii (m) from the resolved skeleton + the mesh: ``z_hip`` (pelvis head), ``axis`` (x, y of the
    pelvis head), ``x_mid`` (torso plane), leg capsules {name: (a, b, r)}, ``r_calf`` per side, knee/ankle heights, ``z_midback``."""
    B = _bones(skel)
    pel = np.asarray(B["pelvis"]["head"], float)
    out = {"z_hip": float(pel[2]), "axis": pel[:2].copy(), "pelvis": pel}
    core = [b for b in skel["bones"] if b.get("kind") == "core" and b.get("deform") and sc.bone_side(b["name"]) is None]
    out["x_mid"] = float(np.median([p[0] for b in core for p in (b["head"], b["tail"])])) if core else float(pel[0])
    caps, rc = {}, {}
    for s in ("L", "R"):
        th, ca, fo, to = (B.get(f"{s}_{n}") for n in LEG_BASES)
        if th is None or ca is None:
            continue
        a, b = _seg(ca)
        d, t = sc.seg_dist(P, a, b)
        sel = (t > 0.15) & (t < 0.85) & (d < 0.12 * H)
        r = float(np.percentile(d[sel], params["leg_r_pct"])) if sel.sum() >= 8 else 0.03 * H
        r = float(np.clip(params["leg_r_scale"] * r, params["leg_r_min_H"] * H, params["leg_r_max_H"] * H))
        rc[s] = r
        caps[f"{s}_Thigh"] = (*_seg(th), r * params["thigh_r_scale"])
        caps[f"{s}_Calf"] = (a, b, r)
        flen = sum(float(np.linalg.norm(np.subtract(x["tail"], x["head"]))) for x in (fo, to) if x is not None)
        for x in (fo, to):
            if x is not None:
                caps[x["name"]] = (*_seg(x), max(r, params["foot_r_frac"] * flen))
        out[f"knee_z_{s}"] = float(a[2])
        out[f"ankle_z_{s}"] = float(b[2])
        out[f"leg_x_{s}"] = float(0.5 * (a[0] + b[0]))
    out["leg_caps"] = caps
    out["r_calf"] = rc
    ks = [out[k] for k in ("knee_z_L", "knee_z_R") if k in out]
    an = [out[k] for k in ("ankle_z_L", "ankle_z_R") if k in out]
    out["knee_z"] = float(np.mean(ks)) if ks else 0.3 * H
    out["ankle_z"] = float(np.mean(an)) if an else 0.06 * H
    th = [B[f"{s}_Thigh"] for s in ("L", "R") if f"{s}_Thigh" in B]
    out["crotch_z"] = float(np.mean([b["head"][2] - 0.15 * (b["head"][2] - b["tail"][2]) for b in th])) if th else out["z_hip"]
    chest = B.get("chest")
    out["chest_z"] = float(chest["head"][2]) if chest else out["z_hip"] + 0.2 * H
    out["neck_z"] = float(B["neck"]["head"][2]) if "neck" in B else out["chest_z"] + 0.07 * H
    out["z_midback"] = 0.5 * (out["chest_z"] + out["z_hip"])
    sp2 = B.get("spine_02")
    out["waist_top_z"] = float(sp2["head"][2]) if sp2 else out["z_hip"] + 0.12 * H  # strips hang from below this
    th2 = [B.get(f"{s}_Thigh") for s in ("L", "R")]
    out["hip_width"] = float(abs(th2[0]["head"][0] - th2[1]["head"][0])) if all(th2) else 0.2 * H
    out["spine_y"] = float(np.median([b["head"][1] for b in core])) if core else float(pel[1])
    return out


def leg_clearance(P, body) -> np.ndarray:
    """Signed distance (m) outside the leg capsules: min over capsules of (distance to segment - radius); > 0 = outside all."""
    out = np.full(len(P), np.inf)
    for a, b, r in body["leg_caps"].values():
        out = np.minimum(out, sc.seg_dist(P, a, b)[0] - r)
    return out


def nearest_bone(points, skel, names=None) -> list:
    """Name of the nearest deform bone segment per point (restricted to ``names`` when given)."""
    bones = [b for b in skel["bones"] if b.get("deform") and (names is None or b["name"] in names)]
    pts = np.atleast_2d(np.asarray(points, float))
    D = np.stack([sc.seg_dist(pts, *_seg(b))[0] for b in bones], axis=1)
    return [bones[i]["name"] for i in D.argmin(1)]


# --------------------------------------------------------------------------------------------------------------------------
# islands: items and clusters
# --------------------------------------------------------------------------------------------------------------------------


def bone_samples(skel, n: int = 9) -> np.ndarray:
    pts = []
    for b in skel["bones"]:
        if b.get("deform"):
            a, c = _seg(b)
            for t in np.linspace(0.1, 0.9, n):
                pts.append(a + t * (c - a))
    return np.asarray(pts)


def island_items(topo, geom, skel, H: float, params: dict, neck_z: float = np.inf) -> tuple[list, dict]:
    """Compact islands that are items (``rigid_hanging``) or bead lines (``cluster``). Returns (items, info) with items =
    [{class, islands, rows, centroid, contact, attach_bone, reasons, confidence}]; info = per-island verdicts."""
    import igl

    isl, n_isl = topo.island, topo.n_islands
    sizes = np.bincount(isl, minlength=n_isl)
    main = body_island(topo, skel, H)
    P = topo.P
    samples = bone_samples(skel)
    lo = np.full((n_isl, 3), np.inf)
    hi = np.full((n_isl, 3), -np.inf)
    for k in range(3):
        np.minimum.at(lo[:, k], isl, P[:, k])
        np.maximum.at(hi[:, k], isl, P[:, k])
    ext = (hi - lo).max(1)
    fisl = isl[geom.F[:, 0]]
    info = {}
    compact = []
    for i in range(n_isl):
        if i == main:
            continue
        Fi = geom.F[fisl == i]
        enc = False
        if len(Fi):
            near = np.all((samples >= lo[i] - 1e-9) & (samples <= hi[i] + 1e-9), axis=1)
            if near.any():
                wn = igl.fast_winding_number(geom.V, Fi, np.ascontiguousarray(samples[near]))
                enc = bool((np.abs(wn) > 0.5).any())
        if enc:  # a body part also hugs its bones (boots, hands, head); an open skirt cone "encloses" the thighs from afar
            r_i = np.flatnonzero(isl == i)
            dmin = np.min(np.stack([sc.seg_dist(P[r_i], *_seg(b))[0] for b in skel["bones"] if b.get("deform")], 1), 1)
            enc = bool(np.median(dmin) < params["hug_H"] * H)
        info[i] = {"rows": int(sizes[i]), "extent_H": _r(ext[i] / H), "encloses_bone": enc}
        if not enc and ext[i] < params["item_extent_H"] * H:
            compact.append(i)
    # tiny islands touching a bigger compact island join it (lantern hook, chain links on a flask)
    from scipy.spatial import cKDTree

    owner = {i: i for i in compact}
    by_size = sorted(compact, key=lambda i: -sizes[i])
    trees = {i: cKDTree(P[isl == i]) for i in compact}
    for i in sorted(compact, key=lambda i: sizes[i]):
        for j in by_size:
            if j == i or sizes[j] <= 2 * sizes[i] or owner[j] != j:
                continue
            d, _ = trees[j].query(P[isl == i], k=1)
            if float(d.min()) < params["item_touch_H"] * H:
                owner[i] = j
                break
    groups: dict = {}
    for i in compact:
        groups.setdefault(owner[i], []).append(i)
    # the rest of the mesh (body + cloth) for contact points
    rest = ~np.isin(isl, compact)
    rest_tree = cKDTree(P[rest])
    rest_ids = np.flatnonzero(rest)
    items = []
    gl = list(groups.items())
    cent = {g: P[np.isin(isl, mem)].mean(0) for g, mem in gl}
    size_g = {g: float((hi[mem].max(0) - lo[mem].min(0)).max()) for g, mem in gl}
    # clusters: >= 3 similar small groups linked by centroid distance
    small = [g for g, mem in gl if size_g[g] < params["cluster_item_H"] * H]
    link = []
    for a in range(len(small)):
        for b in range(a + 1, len(small)):
            ga, gb = small[a], small[b]
            if np.linalg.norm(cent[ga] - cent[gb]) < params["cluster_link"] * max(size_g[ga], size_g[gb]):
                link.append((a, b))
    nc, lab = rmesh.connected_components(len(small), np.asarray(link, int).reshape(-1, 2))
    in_cluster = set()
    for c in range(nc):
        mem = [small[k] for k in np.flatnonzero(lab == c)]
        if len(mem) < params["cluster_min_items"]:
            continue
        rows_n = np.array([sizes[groups[g]].sum() for g in mem], float)
        if rows_n.max() > 3 * np.median(rows_n):
            continue
        C = np.array([cent[g] for g in mem])
        ev = np.linalg.svd(C - C.mean(0), compute_uv=False)
        lin = float(ev[0] / max(ev.sum(), 1e-12))
        if lin < 0.6:
            continue
        rows = np.flatnonzero(np.isin(isl, sum((groups[g] for g in mem), [])))
        d, j = rest_tree.query(P[rows], k=1)
        top = rows[np.argmax(P[rows, 2])]
        items.append({"class": "cluster", "groups": mem, "islands": sorted(sum((groups[g] for g in mem), [])), "rows": rows,
                      "n_items": len(mem), "linearity": lin, "item_centroids": C, "contact": P[top],
                      "confidence": 0.9 if lin > 0.8 else 0.7,
                      "reasons": [f"{len(mem)} similar small islands in a line (linearity {lin:.2f})"]})
        in_cluster.update(mem)
    for g, mem in gl:
        if g in in_cluster:
            continue
        rows = np.flatnonzero(np.isin(isl, mem))
        d, j = rest_tree.query(P[rows], k=1)
        touch = np.flatnonzero(d < params["contact_H"] * H)
        k = int(touch[np.argmax(P[rows[touch], 2])]) if touch.size else int(np.argmin(d))
        contact = P[rows[k]]
        c = P[rows].mean(0)
        drop = float(contact[2] - c[2])
        touch_frac = float(touch.size / max(rows.size, 1))
        hangs = drop > params["hang_drop_H"] * H and contact[2] < neck_z and touch_frac < params["touch_frac_max"]
        info_g = {"islands": mem, "rows": int(rows.size), "contact": _r(contact), "contact_gap_H": _r(d[k] / H),
                  "touch_frac": _r(touch_frac, 3),
                  "drop_H": _r(drop / H), "hangs": bool(hangs)}
        for i in mem:
            info.setdefault(i, {}).update({"group": g})
        info[g].update(info_g)
        if not hangs:
            continue
        conf = 0.85 if d[k] < 0.03 * H else 0.55
        items.append({"class": "rigid_hanging", "groups": [g], "islands": sorted(mem), "rows": rows, "contact": contact,
                      "drop": drop, "confidence": conf,
                      "reasons": [f"compact island(s) {sorted(mem)} hang {drop / H:.3f} H below their contact point",
                                  f"contact gap {d[k] / H:.4f} H"]})
    return items, info


# --------------------------------------------------------------------------------------------------------------------------
# free rows, pieces
# --------------------------------------------------------------------------------------------------------------------------


def free_rows(topo, geom, body, skel, H: float, thick, exclude, params: dict) -> tuple[np.ndarray, dict]:
    """bool (n_w,): rows of cloth hanging free of the body (``exclude`` = item and compact body islands).

    * below the hip-joint height: outside the leg capsules; then per connected component of those rows, a probe point
      ``tight_H`` (1.5% H) from each row toward its nearest deform bone is tested against the mesh volume (generalized winding
      number > ``inside_wn`` = inside flesh): a component with more than ``inside_frac_max`` of its probes inside is body (hips,
      buttocks) or cloth lying within 1.5% H of it (§2 ``tight``) and is dropped. Per component, because single probes behind open
      sheets or near other closed shells are noisy (FL's robe);
    * above it: thin rows (S1 thickness < ``thin_H``) whose inward horizontal ray, past the row's own shell, meets the next
      surface only beyond ``tight_H`` (capes, sleeves, hair)."""
    import igl

    P = topo.P
    clear = leg_clearance(P, body)
    lowc = (P[:, 2] < body["z_hip"]) & (clear > 0) & ~exclude
    ids = np.flatnonzero(lowc)
    low = np.zeros(topo.n_w, bool)
    if ids.size:
        bones = [b for b in skel["bones"] if b.get("deform") and b.get("kind") in ("core", "twist")]
        best = np.full(ids.size, np.inf)
        foot = np.zeros((ids.size, 3))
        for b in bones:
            a, c = _seg(b)
            d, t = sc.seg_dist(P[ids], a, c)
            m = d < best
            best[m] = d[m]
            foot[m] = a + t[m, None] * (c - a)
        dirv = foot - P[ids]
        n = np.linalg.norm(dirv, axis=1)
        dirv[n > 1e-9] /= n[n > 1e-9, None]
        probe = np.zeros((topo.n_w, 3))
        probe[ids] = P[ids] + params["tight_H"] * H * dirv
        # flesh = the main island + closed islands; a separate open island (a cloth sheet) is never flesh, and a component
        # is never tested against its own separate island (an open cone looks "inside" from within)
        isl = topo.island
        main = body_island(topo, skel, H)
        fisl = isl[geom.F[:, 0]]
        flesh_isl = np.zeros(topo.n_islands, bool)
        flesh_isl[main] = True
        flesh_isl[~island_open(topo)] = True
        nc, comp = _components(topo, lowc)
        bnd = boundary_rows(topo)
        cache: dict = {}
        for c in range(nc):
            r = np.flatnonzero(comp == c)
            own = tuple(sorted(set(isl[r].tolist()) - {main}))
            if bnd[r].any():  # M3 (G4): an open component (a cloth sheet, fused or not) never encloses its own probes
                m = np.zeros(topo.n_w, bool)
                m[r] = True
                near = sc.bfs_hops(topo, m, np.ones(topo.n_w, bool), params["own_rings"]) <= params["own_rings"]
                keep = flesh_isl[fisl] & ~np.isin(fisl, own) & ~near[geom.F].any(1)
                Fk = np.ascontiguousarray(geom.F[keep])
            else:
                if own not in cache:
                    keep = flesh_isl[fisl] & ~np.isin(fisl, own)
                    cache[own] = np.ascontiguousarray(geom.F[keep])
                Fk = cache[own]
            wn = igl.fast_winding_number(geom.V, Fk, np.ascontiguousarray(probe[r])) if len(Fk) else np.zeros(r.size)
            if (np.abs(wn) > params["inside_wn"]).mean() <= params["inside_frac_max"]:
                low[r] = True
    up = np.zeros(topo.n_w, bool)
    isl = topo.island
    main = body_island(topo, skel, H)
    sheet = (isl != main) & island_open(topo)[isl]  # rows of separate open islands are sheets (no S1 thickness)
    thin_s1 = np.isfinite(thick) & (thick < params["thin_H"] * H)
    # M3 (G4): every upper row not on a hand / head / neck bone is a candidate; S1 thickness < thin_H is no longer required
    nb = nearest_bone(P, skel)
    not_part = np.array([sc.base_name(x).split("_twist")[0] not in ("Hand", "head", "neck") and "finger" not in x.lower()
                         and not any(k in x for k in ("Thumb", "Index", "Middle", "Ring", "Pinky")) for x in nb])
    # the new rules (single-sided / slab) look only behind the torso, off the arms: capes and cloaks (review r1 M3); sleeves,
    # capelets and front panels keep G1's thin / separate-island rule (FL's capelet stays as planned)
    back = (P[:, 1] > body["spine_y"]) & np.array([sc.base_name(x).split("_twist")[0] not in ("ForeArm", "Hand") for x in nb])
    cand = (P[:, 2] >= body["z_hip"]) & ~exclude & (thin_s1 | sheet | (not_part & back))
    ids = np.flatnonzero(cand)
    kinds = {"single": 0, "slab": 0, "s1_thin": 0}
    new_rows = np.zeros(topo.n_w, bool)
    if ids.size:
        ax = body["axis"]
        d = np.zeros((ids.size, 3))
        d[:, :2] = ax[None, :] - P[ids, :2]
        nrm = np.linalg.norm(d, axis=1)
        ok = nrm > 1e-9
        d[ok] /= nrm[ok, None]
        ids, d = ids[ok], d[ok]
        hits = geom.ray_hits(P[ids] + 1e-5 * H * d, d)
        thin = params["thin_H"] * H
        tight = params["tight_H"] * H
        smax = params["sheet_max_H"] * H
        dp = params["sheet_probe_H"] * H
        # what lies behind the row (toward the body axis), from the normal of the surface the inward ray meets (body normals point
        # outward): entering a surface first = air behind the row (a single-sided sheet over the body); exiting a surface within
        # sheet_max_H and then entering the next one = a closed slab (thick cape, cloak); exiting farther = flesh (skin). The
        # winding number is not used here: open cloth around the body (a skirt cone) shifts it by about 0.5
        FN = np.cross(geom.V[geom.F[:, 1]] - geom.V[geom.F[:, 0]], geom.V[geom.F[:, 2]] - geom.V[geom.F[:, 0]])
        t0, f0 = geom.first_hit_face(P[ids] + 1e-5 * H * d, d)
        ent0 = np.zeros(ids.size, bool)
        okh = f0 >= 0
        ent0[okh] = (FN[f0[okh]] * d[okh]).sum(1) < 0
        sec = okh & ~ent0 & (t0 < smax)
        t1 = np.full(ids.size, np.nan)
        ent1 = np.zeros(ids.size, bool)
        if sec.any():
            tt, ff = geom.first_hit_face(P[ids[sec]] + (np.nan_to_num(t0[sec]) + 1e-5 * H)[:, None] * d[sec], d[sec])
            t1[sec] = tt
            ok1 = ff >= 0
            e1 = np.zeros(sec.sum(), bool)
            e1[ok1] = (FN[ff[ok1]] * d[sec][ok1]).sum(1) < 0
            ent1[sec] = e1
        new_kind = np.zeros(topo.n_w, np.int8)  # 1 single-sided, 2 slab (rows found by the M3 rules only)
        for i, h in enumerate(hits):
            v = ids[i]
            if thin_s1[v] or sheet[v]:  # G1's rule: past the row's own (thin) shell
                gap = h[h > thin][0] if (h > thin).any() else np.inf
                kinds["s1_thin"] += int(gap > tight)
                up[v] = gap > tight
            elif not okh[i]:  # nothing behind the row: an open sheet edge facing out, or a stray part; not a sheet
                continue
            elif ent0[i] and t0[i] > dp and t0[i] > tight:  # single-sided sheet: air behind the row
                new_kind[v] = 1
            elif sec[i] and ent1[i] and t1[i] > tight:  # closed slab: exits its own shell within sheet_max_H, then air
                new_kind[v] = 2
        # Tripo bodies interpenetrate (arm in torso, accessories inside): single rows there look like sheets. A new row counts
        # only inside a connected group (with the rows found above) that reaches a mesh rim (an open sheet: cape, cloak, flap)
        # or holds at least slab_min_rows slab rows (a closed slab cloak)
        cand2 = up | (new_kind > 0)
        nc2, comp2 = _components(topo, cand2)
        rim = boundary_rows(topo)
        for c in range(nc2):
            r = np.flatnonzero(comp2 == c)
            nk = new_kind[r]
            if not (nk > 0).any():
                continue
            if rim[r].any() or int((nk == 2).sum()) >= params["slab_min_rows"]:
                up[r[nk > 0]] = True
                new_rows[r[nk > 0]] = True
                kinds["single"] += int((nk == 1).sum())
                kinds["slab"] += int((nk == 2).sum())
    return low | up, {"lower": int(low.sum()), "upper": int(up.sum()), "lower_candidates": int(lowc.sum()), "upper_kinds": kinds,
                      "_new_rows": new_rows}


def boundary_rows(topo) -> np.ndarray:
    """bool (n_w,): welded rows on a mesh boundary edge (an open sheet's rim or hem)."""
    e, c = rmesh.unique_edges(topo.F, return_counts=True)
    out = np.zeros(topo.n_w, bool)
    out[e[c == 1].ravel()] = True
    return out


def body_island(topo, skel, H: float) -> int:
    """The body's island: the one with the most rows within 0.12 H of the spine segments (pelvis head to chest tail); the largest
    island when no row is that close. (The largest island is not always the body: a separate skirt can be bigger.)"""
    B = _bones(skel)
    segs = [_seg(B[n]) for n in ("pelvis", "spine_01", "spine_02", "spine_03", "chest") if n in B]
    if segs:
        d = np.min(np.stack([sc.seg_dist(topo.P, a, b)[0] for a, b in segs], axis=1), axis=1)
        near = d < 0.12 * H
        if near.any():
            return int(np.argmax(np.bincount(topo.island[near], minlength=topo.n_islands)))
    return int(np.argmax(np.bincount(topo.island, minlength=topo.n_islands)))


def island_open(topo) -> np.ndarray:
    """bool (n_islands,): islands with boundary edges (open sheets)."""
    e, c = rmesh.unique_edges(topo.F, return_counts=True)
    bv = np.zeros(topo.n_w, bool)
    bv[e[c == 1].ravel()] = True
    out = np.zeros(topo.n_islands, bool)
    out[np.unique(topo.island[bv])] = True
    return out


def thickness(geom, H: float) -> np.ndarray:
    """Local thickness per welded id (m): distance along the inward normal to the next surface crossing (as S1 thin_parts)."""
    from solvers import landmarks_geo as lg

    V, F = geom.V, geom.F
    fn = np.cross(V[F[:, 1]] - V[F[:, 0]], V[F[:, 2]] - V[F[:, 0]])
    vn = np.zeros_like(V)
    for k in range(3):
        np.add.at(vn, F[:, k], fn)
    vn = lg.unit(vn)
    eps = 1e-4 * H
    t, _ = geom.first_hit(V - eps * vn, -vn)
    # review r1 m7 (G4): a ray through an exact vertex or edge of a regular mesh can miss (NaN on 240/280 rows of a closed slab);
    # retry the misses with deterministic tilts of the direction (about 0.6 deg) and a tiny origin shift
    miss = ~np.isfinite(t)
    for k, tilt in enumerate(((1.0, 0.37, 0.0), (-0.41, 1.0, 0.23), (0.29, -0.53, 1.0))):
        if not miss.any():
            break
        idx = np.flatnonzero(miss)
        j = np.cross(vn[idx], np.asarray(tilt, float))
        jn = np.linalg.norm(j, axis=1)
        j[jn > 1e-12] /= jn[jn > 1e-12, None]
        dirs = lg.unit(-vn[idx] + 0.01 * j)
        tk, _ = geom.first_hit(V[idx] - eps * vn[idx] + 1e-6 * H * (k + 1) * j, dirs)
        t[idx] = tk
        miss = ~np.isfinite(t)
    return t + eps


def _components(topo, mask) -> tuple[int, np.ndarray]:
    idx = np.flatnonzero(mask)
    remap = -np.ones(topo.n_w, np.int64)
    remap[idx] = np.arange(idx.size)
    e = topo.edges
    ke = mask[e[:, 0]] & mask[e[:, 1]]
    nc, lab = rmesh.connected_components(idx.size, remap[e[ke]])
    full = np.full(topo.n_w, -1, np.int64)
    full[idx] = lab
    return nc, full


def geodesic_from(topo, rows, sources) -> np.ndarray:
    """Dijkstra distance (m) inside ``rows`` (index array) from ``sources`` (subset of rows); inf if unreachable."""
    from scipy.sparse import csr_matrix
    from scipy.sparse.csgraph import dijkstra

    rows = np.asarray(rows, np.int64)
    loc = -np.ones(topo.n_w, np.int64)
    loc[rows] = np.arange(rows.size)
    e = topo.edges
    ke = (loc[e[:, 0]] >= 0) & (loc[e[:, 1]] >= 0)
    a, b = loc[e[ke, 0]], loc[e[ke, 1]]
    w = np.linalg.norm(topo.P[e[ke, 0]] - topo.P[e[ke, 1]], axis=1) + 1e-12
    G = csr_matrix((np.concatenate([w, w]), (np.concatenate([a, b]), np.concatenate([b, a]))), shape=(rows.size, rows.size))
    src = loc[np.asarray(sources, np.int64)]
    d = dijkstra(G, directed=False, indices=src, min_only=True)
    return np.asarray(d, float)


def _wrap(a):
    """Angles (deg) to [0, 360)."""
    return np.mod(a, 360.0)


def sector_t(d, phi, L, sector_deg: float) -> np.ndarray:
    """t per azimuth sector: geodesic distance over the sector's own hem distance (p95 of the sector, at least 0.25 L), smoothed
    by blending each sector with its two neighbours, so each tail of a skirt reaches t = 1 at its own hem."""
    n = int(round(360.0 / sector_deg))
    k = np.floor(_wrap(phi + 180.0) / sector_deg).astype(int) % n
    hem = np.full(n, L)
    for i in range(n):
        m = k == i
        if m.sum() >= 3:
            hem[i] = max(float(np.percentile(d[m], 95)), 0.25 * L)
    hs = (np.roll(hem, 1) + 2 * hem + np.roll(hem, -1)) / 4.0
    return np.clip(d / np.maximum(hs[k], 1e-9), 0.0, 1.0)


def sector_length(d, phi, L, sector_deg: float) -> float:
    """Median of the per-sector hem distances (m): the length of a ring of tails (the p98 geodesic follows inner layers)."""
    n = int(round(360.0 / sector_deg))
    k = np.floor(_wrap(phi + 180.0) / sector_deg).astype(int) % n
    hems = [float(np.percentile(d[k == i], 95)) for i in range(n) if (k == i).sum() >= 3]
    return float(np.median(hems)) if hems else L


def azimuth(P, axis) -> np.ndarray:
    """Degrees around the vertical axis through ``axis`` (x, y): 0 = front (-Y), 90 = character's left (+X), (-180, 180]."""
    return np.degrees(np.arctan2(P[:, 0] - axis[0], -(P[:, 1] - axis[1])))


def coverage_deg(phi, bin_deg: float = 10.0) -> float:
    h = np.histogram(phi, bins=int(360 / bin_deg), range=(-180, 180))[0]
    return float(bin_deg * (h > 0).sum())


def _arc_gaps(arcs, min_deg):
    """Gaps (centre, width) between angular arcs [(lo, hi)] on the circle (degrees, lo <= hi, unwrapped per arc)."""
    if not arcs:
        return []
    cov = np.zeros(720, bool)  # half-degree cells
    for lo, hi in arcs:
        a = np.arange(int(np.floor((lo + 180) * 2)), int(np.ceil((hi + 180) * 2)) + 1) % 720
        cov[a] = True
    if cov.all() or not cov.any():
        return []
    start = int(np.argmax(cov))  # roll so the sequence starts covered
    c = np.roll(cov, -start)
    gaps, i = [], 0
    while i < 720:
        if not c[i]:
            j = i
            while j < 720 and not c[j]:
                j += 1
            w = (j - i) / 2.0
            if w >= min_deg:
                centre = ((start + (i + j) / 2.0) / 2.0) % 360 - 180
                gaps.append((float(centre), float(w)))
            i = j
        else:
            i += 1
    return gaps


def slits_of(geom, rows_mask, P, axis, z_top, z_min, params: dict) -> list:
    """Slits of a piece: gaps between the open loops of horizontal sections through the piece's faces at 5 heights, merged across
    heights within ``slit_merge_deg``. [{phi_deg, width_deg, z_top, levels}] sorted by phi."""
    fm = rows_mask[geom.F].all(1)
    found = []
    for f in (0.35, 0.5, 0.65, 0.8, 0.92):
        z = z_top - f * (z_top - z_min)
        arcs = []
        for lp in geom.section([0, 0, z], [0, 0, 1], face_mask=fm):
            ph = azimuth(lp.points, axis)
            ph = np.degrees(np.unwrap(np.radians(ph)))
            arcs.append((float(ph.min()), float(ph.max())))
        arcs2 = []
        for lo, hi in arcs:  # bring into [-180, 180) start
            sh = 360.0 * np.floor((lo + 180) / 360.0)
            arcs2.append((lo - sh, hi - sh))
        for c, w in _arc_gaps(arcs2, params["slit_min_deg"]):
            found.append((c, w, z))
    out: list = []
    for c, w, z in sorted(found):
        for s in out:
            if abs(((c - s["phi_deg"]) + 180) % 360 - 180) < params["slit_merge_deg"]:
                s["_c"].append(c)
                s["_w"].append(w)
                s["z_top"] = max(s["z_top"], z)
                s["levels"] += 1
                break
        else:
            out.append({"phi_deg": c, "_c": [c], "_w": [w], "z_top": z, "levels": 1})
    res = []
    for s in out:
        ang = np.radians(s["_c"])
        res.append({"phi_deg": _r(math.degrees(math.atan2(np.sin(ang).mean(), np.cos(ang).mean())), 2),
                    "width_deg": _r(float(np.median(s["_w"])), 2), "z_top": _r(s["z_top"]), "levels": s["levels"]})
    return sorted(res, key=lambda s: s["phi_deg"])


def ray_layers(geom, topo, rows, cloth_mask, axis, H: float, params: dict):
    """Outward horizontal rays from ``rows``: count the cloth sheets (rows in ``cloth_mask``) met beyond the row's own shell within
    ``layer_range_H``. Returns (layer int (len,), ref int (len,) = nearest welded id of the outermost sheet's hit face, -1)."""
    P = topo.P
    d = np.zeros((rows.size, 3))
    d[:, :2] = P[rows, :2] - axis[None, :]
    nrm = np.linalg.norm(d, axis=1)
    ok = nrm > 1e-9
    d[ok] /= nrm[ok, None]
    d[~ok] = [0.0, 1.0, 0.0]
    thin = params["thin_H"] * H
    rng = params["layer_range_H"] * H
    O = P[rows] + 1e-5 * H * d
    layer = np.zeros(rows.size, np.int64)
    ref = np.full(rows.size, -1, np.int64)
    hits = geom.ray_hits(O, d)
    # face ids of each hit: re-query by stepping to each hit with intersect_ray_first from just before it
    for i, h in enumerate(hits):
        h = h[(h > thin) & (h < rng)]
        if not h.size:
            continue
        sheets, last = 0, -np.inf
        ref_i = -1
        for t in h:
            q = O[i] + t * d[i]
            dd, fi, _ = geom.closest(q[None])
            f = geom.F[int(fi[0])]
            vid = f[np.argmin(np.linalg.norm(geom.V[f] - q, axis=1))]
            if not cloth_mask[vid]:
                continue
            if t - last > thin:
                sheets += 1
            last = t
            ref_i = int(vid)
        layer[i] = min(sheets, 2)
        ref[i] = ref_i if sheets else -1
    return layer, ref


# --------------------------------------------------------------------------------------------------------------------------
# main entry
# --------------------------------------------------------------------------------------------------------------------------


def _empty(asset_id, H, family, params, aux_budget, why) -> tuple[dict, dict]:
    doc = {"schema": 0, "asset_id": asset_id, "H": H, "family": family, "params": params, "pieces": [], "flags": [],
           "budget": {"aux_budget": aux_budget, "used": 0, "trims": []}, "note": why}
    return doc, {}


def classify(mesh: dict, skel: dict, analysis: dict | None = None, analysis_arrays: dict | None = None, family: str | None = None,
             overrides: dict | None = None, aux_budget: int = 32, params: dict | None = None) -> tuple[dict, dict]:
    """S3g. Returns (garments.json doc, garments.npz arrays {piece, t, phi, layer, outer_ref}) per the contract."""
    from solvers import landmarks_geo as lg

    prm = dict(PARAMS)
    prm.update(params or {})
    ov = dict(overrides or {})
    if ov.get("aux_budget") is not None:
        aux_budget = int(ov["aux_budget"])
    meta = mesh["meta"]
    asset_id = str(meta.get("asset_id", "?"))
    H = float(meta["H"])
    family = family or skel.get("family")
    if family in LEGACY_FAMILIES:
        return _empty(asset_id, H, family, prm, aux_budget, f"legacy family {family}: garment planner off")
    t0 = time.time()
    topo = sc.weld_topo(mesh)
    geom = lg.MeshGeom(mesh["V"], mesh["F"], mesh["weld"])
    P = topo.P
    n_w = topo.n_w
    body = body_model(P, skel, H, prm)
    items, isl_info = island_items(topo, geom, skel, H, prm, body["neck_z"])
    item_rows = np.zeros(n_w, bool)
    for it in items:
        item_rows[it["rows"]] = True
    # compact non-item islands (helmet, eyes, bricks) are body: never cloth
    compact_body = np.zeros(n_w, bool)  # compact non-item islands (helmet, eyes, bricks) and islands around a bone (boots, hands)
    for i, inf in isl_info.items():
        if any(i in it["islands"] for it in items):
            continue
        if inf.get("encloses_bone") or inf["extent_H"] < prm["item_extent_H"]:
            compact_body |= topo.island == i
    thick = None
    if analysis_arrays is not None and "thickness_welded" in analysis_arrays:
        thick = np.asarray(analysis_arrays["thickness_welded"], float)
        if thick.shape != (n_w,):
            thick = None
    if thick is None:
        thick = thickness(geom, H)
    free, free_info = free_rows(topo, geom, body, skel, H, thick, item_rows | compact_body, prm)
    newm = free_info.pop("_new_rows")
    bridging = bool(((analysis or {}).get("cloth_bridging") or {}).get("detected"))
    if newm.any():  # M3 (G4): rows found only by the new sheet rules stay free only inside pieces that classify as capes
        nc0, comp0 = _components(topo, free)
        keep = np.zeros(n_w, bool)
        for c in range(nc0):
            rows = np.flatnonzero(comp0 == c)
            if rows.size < prm["min_piece_rows"] or not newm[rows].any():
                continue
            pc = _piece(topo, geom, rows, free, body, skel, H, prm, bridging)
            if pc["class"] == "cape" or pc["_cape_spread"]:  # G5: a cape-like wing keeps its rows, so its flag names all of it
                keep[rows] = True
        free_info["upper_new_kept"] = int((newm & keep).sum())
        free_info["upper_new_dropped"] = int((newm & ~keep).sum())
        free = free & ~(newm & ~keep)
        free_info["upper"] = int(free_info["upper"]) - free_info["upper_new_dropped"]
    nc, comp = _components(topo, free)
    piece = np.full(n_w, -1, np.int32)
    t_arr = np.full(n_w, np.nan, np.float32)
    phi_arr = np.full(n_w, np.nan, np.float32)
    layer = np.full(n_w, -1, np.int8)
    outer_ref = np.full(n_w, -1, np.int32)
    pieces: list = []
    flags: list = []
    bridging = bool(((analysis or {}).get("cloth_bridging") or {}).get("detected"))
    # ---- cloth pieces from free components
    order = sorted(range(nc), key=lambda c: (-(comp == c).sum(), int(np.flatnonzero(comp == c)[0])))
    ctr = 0
    cloth_mask = np.zeros(n_w, bool)
    raw = []
    for c in order:
        rows = np.flatnonzero(comp == c)
        if rows.size < prm["min_piece_rows"]:
            continue
        raw.append(rows)
        cloth_mask[rows] = True
    for rows in raw:
        pc = _piece(topo, geom, rows, free, body, skel, H, prm, bridging)
        pc["id"] = f"g{ctr:02d}"
        ctr += 1
        pieces.append(pc)
    _merge_small_strips(pieces, P, H, prm, topo.island)
    mat_w = _welded_material(mesh, topo)
    for pc in pieces:
        if pc["class"] in CLOTH_CLASSES and mat_w is not None:
            sp = material_split(pc["_rows"], pc["_t"], mat_w, prm["mat_min_frac"])
            if sp is not None:
                pc["material_split"] = sp
                pc["reasons"].append(f"material change along the piece: chain ends at t = {sp['t']:.2f} (material {sp['above']} "
                                     f"-> {sp['below']}); the rows below ride rigid on the last chain bone (one material and "
                                     f"one behaviour per chain)")
    # ---- layers (outward rays) on cloth rows of hanging classes
    hang_mask = np.zeros(n_w, bool)
    for pc in pieces:
        if pc["class"] in CLOTH_CLASSES:
            hang_mask[pc["_rows"]] = True
    rows_all = np.flatnonzero(hang_mask)
    lay = np.zeros(n_w, np.int64)
    ref = np.full(n_w, -1, np.int64)
    if rows_all.size:
        l_, r_ = ray_layers(geom, topo, rows_all, hang_mask, body["axis"], H, prm)
        lay[rows_all], ref[rows_all] = l_, r_
    # follow refs to the outermost row (a ref may itself be an inner row)
    for _ in range(3):
        nxt = np.where(ref >= 0, ref, -1)
        inner_ref = (nxt >= 0) & (ref[np.maximum(nxt, 0)] >= 0)
        ref = np.where(inner_ref, ref[np.maximum(nxt, 0)], ref)
    for pc in pieces:
        rows = pc["_rows"]
        if pc["class"] not in CLOTH_CLASSES:
            continue
        inner = lay[rows] >= 1
        frac = float(inner.mean())
        pc["inner_frac"] = _r(frac, 3)
        if frac >= prm["inner_frac"]:
            pc["layer"] = 1
            # every row of an inner piece rides on the outer layer: nearest outer-layer cloth row where no ray found one
            outer_rows = np.flatnonzero(hang_mask & (lay == 0) & ~np.isin(np.arange(n_w), rows))
            miss = rows[ref[rows] < 0]
            if miss.size and outer_rows.size:
                from scipy.spatial import cKDTree

                _, j = cKDTree(P[outer_rows]).query(P[miss], k=1)
                ref[miss] = outer_rows[j]
                lay[miss] = 1
            pc["reasons"].append(f"inner layer: {frac:.0%} of its rows have another cloth sheet outside them (ray depth)")
    # ---- write per-row arrays
    ids = {pc["id"]: k for k, pc in enumerate(pieces)}
    for k, pc in enumerate(pieces):
        rows = pc["_rows"]
        tgt = ids.get(pc.get("merged_into"), k) if pc.get("merged_into") else k
        piece[rows] = tgt
        t_arr[rows] = pc["_t"]
        if pieces[tgt]["class"] == "skirt":
            phi_arr[rows] = azimuth(P[rows], body["axis"])
        lr = lay[rows]
        layer[rows] = np.clip(lr, 0, 2) if pc["class"] in CLOTH_CLASSES else 0
        if pc["class"] in CLOTH_CLASSES:
            outer_ref[rows] = np.where(lr >= 1, ref[rows], -1)
    inner = (outer_ref >= 0)
    t_arr[inner] = t_arr[outer_ref[inner]]
    phi_arr[inner] = phi_arr[outer_ref[inner]]
    # ---- items: clusters and rigid hanging
    for it in items:
        k = len(pieces)
        rows = it["rows"]
        pc = _item_piece(it, topo, skel, body, H, prm)
        pc["id"] = f"g{ctr:02d}"
        ctr += 1
        pieces.append(pc)
        piece[rows] = k
        layer[rows] = 0
        t_arr[rows] = pc["_t"]
    # ---- overrides (§7)
    _apply_overrides(pieces, ov, flags)
    for pc in pieces:
        if pc["confidence"] < prm["conf_flag"] and not pc.get("disable"):
            flags.append({"piece": pc["id"], "why": f"confidence {pc['confidence']:.2f} < {prm['conf_flag']}: "
                                                    + "; ".join(pc["reasons"][:2])})
    from solvers import chains as ch

    plan = ch.count_plan(pieces, H, aux_budget, body)
    for pc in pieces:
        cp = plan["pieces"].get(pc["id"], {})
        pc["chains_planned"] = cp.get("chains", 0)
        pc["bones_planned"] = cp.get("bones", 0)
    # acceptance measure: free rows below the crotch that belong to a chained piece (directly, merged, or riding an outer layer)
    chained = np.array([pc["chains_planned"] > 0 for pc in pieces] + [False])
    pidx = np.where(piece >= 0, piece, len(pieces))
    ride = np.where(outer_ref >= 0, pidx[np.maximum(outer_ref, 0)], pidx)
    below = free & (P[:, 2] < body["crotch_z"])
    cov_ok = below & (chained[pidx] | chained[ride])
    coverage = {"free_below_crotch": int(below.sum()), "in_chained_piece": int(cov_ok.sum()),
                "frac": _r(cov_ok.sum() / max(below.sum(), 1), 4)}
    doc = {"schema": 0, "asset_id": asset_id, "H": H, "family": family, "params": prm,
           "body": {"z_hip": _r(body["z_hip"]), "axis": _r(body["axis"]), "x_mid": _r(body["x_mid"]),
                    "crotch_z": _r(body["crotch_z"]), "knee_z": _r(body["knee_z"]), "ankle_z": _r(body["ankle_z"]),
                    "chest_z": _r(body["chest_z"]), "z_midback": _r(body["z_midback"]),
                    "leg_capsules": {k: {"head": _r(a), "tail": _r(b), "radius": _r(r)} for k, (a, b, r) in body["leg_caps"].items()}},
           "free_rows": free_info, "coverage": coverage, "islands": {str(k): v for k, v in isl_info.items()},
           "pieces": [_public(pc) for pc in pieces], "flags": flags,
           "budget": {"aux_budget": aux_budget, "used": plan["used"], "trims": plan["trims"]},
           "time_s": _r(time.time() - t0, 2)}
    arrays = {"piece": piece, "t": t_arr, "phi": phi_arr, "layer": layer, "outer_ref": outer_ref}
    return doc, arrays


def _attach_rows(topo, rows, free, H, prm):
    """Rows of the piece next to non-free rows (the body or the belt), within ``attach_band_H`` of the highest such row; a piece
    with no body neighbour (a separate hanging island) uses its top rows."""
    inside = np.zeros(topo.n_w, bool)
    inside[rows] = True
    own, nb = sc._csr_gather(topo, rows)
    edge_out = ~inside[nb] & ~free[nb]
    bnd = np.unique(own[edge_out])
    P = topo.P
    if bnd.size:
        ztop = P[bnd, 2].max()
        sel = bnd[P[bnd, 2] >= ztop - prm["attach_band_H"] * H]
        return sel, "body boundary"
    ztop = P[rows, 2].max()
    return rows[P[rows, 2] >= ztop - 0.02 * H], "top rows (no body neighbour)"


def _arm_segs(skel, side=None) -> list:
    """(head, tail) of the arm bones (UpperArm, ForeArm, Hand and their twist bones) of ``side`` (None: both sides)."""
    return [_seg(b) for b in skel["bones"] if sc.base_name(b["name"]).split("_twist")[0] in ("UpperArm", "ForeArm", "Hand")
            and (side is None or (b.get("side") or sc.bone_side(b["name"])) == side)]


def _not_a_sleeve(topo, rows, att, free, skel, att_bone, H, prm):
    """M3 wings (G5): why a ``sleeve`` candidate is not a sleeve, else None. A sleeve hangs FROM its arm: its attachment rows lie
    within ``sleeve_attach_H`` of the arm bones of its side (G4's wing piece hung 0.37 H below the arm, attached only to the rest
    of the wing), and the body rows it touches are not mostly torso rows (a membrane from the arm to the torso)."""
    P = topo.P
    side = sc.bone_side(att_bone)
    segs = _arm_segs(skel, side) or _arm_segs(skel)
    if not segs or not len(att):
        return None
    d_att = float(np.median(np.min(np.stack([sc.seg_dist(P[att], a, b)[0] for a, b in segs], axis=1), axis=1)))
    if d_att > prm["sleeve_attach_H"] * H:
        return (f"sleeve attached {d_att / H:.3f} H from the arm bones (> {prm['sleeve_attach_H']} H): it does not hang from the "
                f"arm (wing membrane?), not a sleeve")
    inside = np.zeros(topo.n_w, bool)
    inside[rows] = True
    _, nb = sc._csr_gather(topo, rows)
    touch = np.unique(nb[~inside[nb] & ~free[nb]])
    if touch.size:
        frac = float(np.mean([sc.base_name(x) in TORSO for x in nearest_bone(P[touch], skel)]))
        if frac > prm["sleeve_torso_frac"]:
            return (f"{frac:.0%} of the body rows the sleeve touches lie on the torso (> {prm['sleeve_torso_frac']:.0%}): a "
                    f"membrane from the arm to the torso, not a sleeve")
    return None


def _not_a_cape(P, rows, body, skel, H, prm):
    """M3 wings (G5): why a ``cape`` candidate is not a cape, else None. A cape hangs behind the torso; one reaching sideways past
    the shoulder joints (UpperArm heads; unlike the elbows they do not move between A and T pose) + ``cape_reach_H`` spreads like
    a wing or a membrane (G4's fused wing classified as a cape with a 5-bone chain)."""
    sh = [abs(float(b["head"][0]) - body["x_mid"]) for b in skel["bones"] if sc.base_name(b["name"]) == "UpperArm"]
    if not sh:
        return None
    reach = float(np.max(np.abs(P[rows, 0] - body["x_mid"])))
    lim = float(np.mean(sh)) + prm["cape_reach_H"] * H
    if reach > lim:
        return (f"cape reaches {reach / H:.2f} H sideways, past the shoulder joints + {prm['cape_reach_H']} H ({lim / H:.2f} H): "
                f"a wing or a membrane, not a cape")
    return None


def _piece(topo, geom, rows, free, body, skel, H, prm, bridging) -> dict:
    P = topo.P
    att, how = _attach_rows(topo, rows, free, H, prm)
    d = geodesic_from(topo, rows, att)
    fin = np.isfinite(d)
    if not fin.all():
        d[~fin] = np.nanmax(np.where(fin, d, np.nan)) if fin.any() else 0.0
    L = float(np.percentile(d, 98)) if d.size else 0.0
    t = np.clip(d / max(L, 1e-9), 0.0, 1.0)
    phi_r = azimuth(P[rows], body["axis"])
    ap = P[att].mean(0)
    z_top, z_min = float(P[att, 2].mean()), float(P[rows, 2].min())
    phi = azimuth(P[rows], body["axis"])
    cov = coverage_deg(phi)
    mid = rows[(t > 0.35) & (t < 0.65)]
    if mid.size < 3:
        mid = rows
    Q = P[mid, :2] - P[mid, :2].mean(0)
    width = float(np.ptp(Q @ np.linalg.svd(Q, full_matrices=False)[2][0])) if len(Q) >= 2 else 0.0
    xm = float(P[rows, 0].mean()) - body["x_mid"]
    side = "L" if xm > 0.01 * H else ("R" if xm < -0.01 * H else None)
    hang = z_top - z_min
    reasons = [f"{rows.size} welded rows, attachment from {how} at z {z_top:.3f} m, hangs {hang / H:.3f} H, length {L / H:.3f} H",
               f"azimuth coverage {cov:.0f} deg, width {width / H:.3f} H"]
    att_bone = nearest_bone(ap[None], skel)[0]
    nb = nearest_bone(P[rows], skel)
    arm_frac = float(np.mean([sc.base_name(x).split("_twist")[0] in ARM_BASES for x in nb]))
    X = P[rows] - P[rows].mean(0)
    sv = np.linalg.svd(X, compute_uv=False) if len(rows) >= 3 else np.ones(3)
    sheet = float(sv[2] / max(sv[0], 1e-12))
    base = sc.base_name(att_bone)
    low = P[rows, 2] < body["crotch_z"]
    below_crotch = bool(low.any())
    cov_low = coverage_deg(phi[low]) if low.any() else 0.0
    ring_ok = below_crotch and bool((np.abs(phi[low]) < 60).any()) and bool((np.abs(phi[low]) > 120).any()) and (
        cov_low >= prm["skirt_ring_deg"] or (bridging and cov_low >= prm["skirt_cover_deg"]))
    if hang < prm["hang_min_H"] * H:
        cls, conf = "tight", 0.7
        reasons.append(f"hangs less than {prm['hang_min_H']} H below its attachment: tight, body skin")
    elif base in ("head",) or (base == "neck" and z_min > body["chest_z"]):
        if z_min < body["neck_z"] - 0.05 * H and L >= 2.0 * max(width, 1e-9):
            cls, conf = "hair", 0.6
            reasons.append("attached at the head and hangs below the neck line")
        else:
            cls, conf = "tight", 0.75
            reasons.append("head piece that is not long hair below the neck line (hood, bag, ear): tight")
    elif base in ARM_BASES and arm_frac >= 0.5:
        cls, conf = "sleeve", 0.7
        reasons.append(f"attached to {att_bone}; {arm_frac:.0%} of its rows are nearest to an arm bone")
    elif z_top > body["chest_z"] - 0.05 * H and float(P[rows, 1].mean()) > body["spine_y"]:
        if z_min < body["z_midback"] and sheet < 0.35:
            cls, conf = "cape", 0.8
            reasons.append("hangs behind the torso from the shoulder/neck line below mid-back")
        else:
            cls, conf = "tight", 0.65
            reasons.append(f"behind the shoulders but ends above mid-back or is not a sheet (depth ratio {sheet:.2f}): tight")
    elif ring_ok:
        cls = "skirt"
        conf = 0.9 if bridging else 0.7
        reasons.append(f"covers {cov_low:.0f} deg around the pelvis axis below the crotch, front and back"
                       + ("; S1 cloth_bridging detected" if bridging else "; S1 cloth_bridging not detected"))
    elif z_top > body["waist_top_z"]:
        cls, conf = "tight", 0.6
        reasons.append("attached above the waist and not a cape, sleeve or hair: tight (strap, bag, collar)")
    else:
        cls = "strip"
        aspect = L / max(width, 1e-9)
        conf = 0.85 if (aspect >= 1.5 or cov < 120) else 0.65
        reasons.append(f"hangs from the waist line; length/width {aspect:.2f}")
    # M3 (G4): a strip or cape whose rows form a CLOSED surface that is not flat (tail, belly, limb, horn) is a body part or an
    # unknown appendage: never chained as cloth; a sleeve bigger than sleeve_big_H (wing membrane?) is not chained either.
    # Both go to flags with confidence < conf_flag, as tight (body skin) until the user or Opus confirms (--garments)
    flag_why = None
    if cls in ("strip", "cape"):
        closed = float(boundary_rows(topo)[rows].mean()) < prm["closed_rim_frac"]  # a fusing seam may leave a few rim rows
        flat = float(sv[2] / max(sv[1], 1e-12)) if len(sv) >= 3 else 0.0
        if closed and flat > prm["closed_flat_max"]:
            flag_why = (f"closed {('tube' if sv[1] / max(sv[0], 1e-12) < 0.5 else 'blob')} (section ratio {flat:.2f} > "
                        f"{prm['closed_flat_max']}): a body part (tail, belly, limb) or appendage, not cloth")
    elif cls == "sleeve" and max(width, L) > prm["sleeve_big_H"] * H:
        flag_why = (f"sleeve {max(width, L) / H:.2f} H wide/long (> {prm['sleeve_big_H']} H): wing membrane or cape on the arm, "
                    f"not a sleeve")
    # M3 wings (G5): a sleeve hangs from its arm; a cape stays behind the torso. Wings / membranes go to flags like the above
    spread = False
    if flag_why is None and cls == "sleeve":
        flag_why = _not_a_sleeve(topo, rows, att, free, skel, att_bone, H, prm)
    elif flag_why is None and cls == "cape":
        flag_why = _not_a_cape(P, rows, body, skel, H, prm)
        spread = flag_why is not None
    if flag_why:
        reasons.append(flag_why + f"; was {cls}: flagged, tight (body skin) until confirmed")
        cls, conf = "tight", 0.5
    slits = []
    if cls == "skirt":
        t = sector_t(d, phi_r, L, prm["sector_deg"])
        L = sector_length(d, phi_r, L, prm["sector_deg"])
        m = np.zeros(topo.n_w, bool)
        m[rows] = True
        slits = slits_of(geom, m, P, body["axis"], z_top, z_min, prm)
    free_len, t_free, n_off = L, 0.0, int(rows.size)
    if cls in ("skirt", "strip"):  # §3 (G3): bones per chain from the FREE length, from where the cloth leaves the body
        t_free, on_frac, n_off = free_line(P, rows, t, free, H, prm)
        free_len = L * (1.0 - t_free)
        reasons.append(f"free length {free_len / H:.3f} H (leaves the body at t = {t_free:.1f}; on-body share per t bin "
                       f"{[round(x, 2) for x in on_frac]})")
        if free_len < prm["hang_min_H"] * H:
            cls, conf = "tight", 0.7
            reasons.append(f"lies on the body (free length < {prm['hang_min_H']} H): tight, body skin")
    # hem loop: rows within the last 3% of t, ordered by azimuth
    hem = rows[t >= 0.97]
    hem_circ = 0.0
    if hem.size:
        hem = hem[np.argsort(azimuth(P[hem], body["axis"]))]
        if hem.size >= 3:
            from scipy.spatial import ConvexHull

            try:
                hem_circ = float(ConvexHull(P[hem, :2]).area)  # 2D hull perimeter
            except Exception:
                hem_circ = 0.0
    parent = cloth_parent(cls, z_top, att_bone, skel, body)
    return {"class": cls, "confidence": float(conf), "n_welded": int(rows.size), "layer": 0, "side": side, "panel": None,
            "parent": parent, "attach": {"bone": parent, "nearest_bone": att_bone, "points": P[att]}, "length": L, "width": width,
            "free_length": free_len, "t_free": t_free, "n_free_rows": n_off,
            "hem_loop": hem,
            "slits": slits, "merged_into": None, "reasons": reasons, "coverage_deg": cov, "z_top": z_top, "z_min": z_min,
            "hem_circumference": hem_circ, "hip_width": body["hip_width"],
            "floor_length": bool(z_min < body["ankle_z"] + prm["floor_H"] * H),
            "_rows": rows, "_t": t.astype(np.float32), "_att": att, "_cape_spread": spread}


def free_line(P, rows, t, free, H, prm) -> tuple:
    """§3 free length (G3): where the cloth leaves the body. A row lies on the body when a non-free row (body, belt, tight cloth)
    is within ``tight_H``; scanning 10 equal ``t`` bins down from the attachment line, the free line is the start of the first bin
    where fewer than ``free_on_body_frac`` of the rows lie on the body (1.0 when the whole piece lies on it). Returns
    ``(t_free, on-body share per bin, number of rows off the body)``."""
    from scipy.spatial import cKDTree

    body_rows = np.flatnonzero(~free)
    if body_rows.size == 0 or rows.size == 0:
        return 0.0, [], int(rows.size)
    dist, _ = cKDTree(P[body_rows]).query(P[rows], k=1)
    on = dist < prm["tight_H"] * H
    edges = np.linspace(0.0, 1.0, 11)
    frac = []
    for i in range(10):
        m = (t >= edges[i]) & ((t < edges[i + 1]) if i < 9 else (t <= 1.0))
        frac.append(float(on[m].mean()) if m.any() else 0.0)
    n_off = int((~on).sum())
    for i, f in enumerate(frac):
        if f < prm["free_on_body_frac"]:
            return float(edges[i]), frac, n_off
    return 1.0, frac, n_off


def _merge_small_strips(pieces, P, H, prm, island=None):
    """§3.2: strips narrower than 2% H or with fewer than ``strip_rows_per_bone`` (8) welded rows OFF THE BODY per planned bone
    (bones from the free length) join the nearest bigger strip (or skirt) of the same island within ``strip_merge_H`` (their rows ride on its
    chains), else become tight (body skin)."""
    from scipy.spatial import cKDTree

    def rows_ok(pc):  # rows lying on the body ride on it, not on the chain: only rows off the body count (G3)
        return pc.get("n_free_rows", pc["n_welded"]) >= prm["strip_rows_per_bone"] * _bones_for(pc.get("free_length", pc["length"]), H)

    big = [pc for pc in pieces if pc["class"] == "skirt" or (
        pc["class"] == "strip" and pc["width"] >= prm["strip_min_width_H"] * H and rows_ok(pc))]
    for pc in pieces:
        if pc["class"] != "strip" or pc in big:
            continue
        best, bd = None, np.inf
        for q in big:
            if island is not None and not set(island[pc["_rows"]].tolist()) & set(island[q["_rows"]].tolist()):
                continue
            d = float(cKDTree(P[q["_rows"]]).query(P[pc["_rows"]], k=1)[0].min())
            if d < bd:
                best, bd = q, d
        why = (f"{pc.get('n_free_rows', pc['n_welded'])} rows off the body (of {pc['n_welded']}) / width {pc['width'] / H:.3f} H is below the strip minimum ({prm['strip_rows_per_bone']} rows "
               f"per planned bone = {prm['strip_rows_per_bone'] * _bones_for(pc.get('free_length', pc['length']), H)}, 2% H wide)")
        if best is not None and bd < prm["strip_merge_H"] * H:
            pc["merged_into"] = best["id"]
            pc["reasons"].append(why + f": merged into {best['id']} (gap {bd / H:.3f} H)")
        else:
            pc["class"] = "tight"
            pc["reasons"].append(why + ": no strip of the same island nearby, tight (body skin)")


def _bones_for(L, H):
    return int(min(6, max(1, round(L / (0.09 * H)))))


def _welded_material(mesh, topo):
    """Material index per welded id (the most frequent material of the faces around it), or None without ``mat``."""
    mat = mesh.get("mat")
    if mat is None:
        return None
    mat = np.asarray(mat).astype(np.int64)
    if mat.size == 0 or np.unique(mat).size < 2:
        return np.zeros(topo.n_w, np.int64) if mat.size else None
    Fw = topo.weld[np.asarray(mesh["F"], np.int64)]
    nm = int(mat.max()) + 1
    cnt = np.zeros((topo.n_w, nm))
    for k in range(3):
        np.add.at(cnt, (Fw[:, k], mat), 1.0)
    return cnt.argmax(1)


def material_split(rows, t, mat_w, min_frac: float):
    """First t where the dominant material along a piece changes for good (one material per chain): the piece's rows are binned
    by t (10 bins); a split needs the lower material to hold >= ``min_frac`` of the rows. Returns {t, above, below} or None."""
    m = mat_w[rows]
    if np.unique(m).size < 2:
        return None
    top = np.bincount(m[t <= 0.2]).argmax() if (t <= 0.2).any() else np.bincount(m).argmax()
    other = m != top
    if other.mean() < min_frac:
        return None
    edges = np.linspace(0, 1, 11)
    for i in range(10):
        sel = (t >= edges[i]) & (t <= edges[i + 1])
        if sel.any() and other[sel].mean() > 0.5 and other[t >= edges[i]].mean() > 0.5:
            below = int(np.bincount(m[sel & other]).argmax())
            return {"t": float(edges[i]), "above": int(top), "below": below}
    return None


def cloth_parent(cls, z_top, att_bone, skel, body):
    """§3 parents: skirt/strip/cluster roots on the belt -> pelvis (spine_01 when the belt sits above the pelvis box); cape ->
    chest (neck when tied at the neck); hair -> head; sleeve -> the arm bone it hangs from; tight -> the nearest bone."""
    names = {b["name"] for b in skel["bones"]}
    if cls in ("skirt", "strip"):
        sp = next((b for b in skel["bones"] if b["name"] == "spine_01"), None)
        return "spine_01" if (sp is not None and z_top > float(sp["tail"][2])) else "pelvis"
    if cls == "cape":
        return "neck" if ("neck" in names and z_top > body["neck_z"]) else "chest"
    if cls == "hair":
        return "head" if "head" in names else att_bone
    return att_bone


def _item_piece(it, topo, skel, body, H, prm) -> dict:
    P = topo.P
    rows = it["rows"]
    contact = np.asarray(it["contact"], float)
    names = None if contact[2] < body["z_hip"] else [n for n in TORSO + tuple(f"{s}_{a}" for s in "LR" for a in ARM_BASES)]
    bone = nearest_bone(contact[None], skel, names)[0]
    z_top, z_min = float(P[rows, 2].max()), float(P[rows, 2].min())
    if it["class"] == "cluster":
        C = it["item_centroids"]
        ax = C - C.mean(0)
        u = np.linalg.svd(ax, full_matrices=False)[2][0]
        if u[2] > 0:
            u = -u
        s = (P[rows] - contact) @ u
        L = float(np.ptp((C - contact) @ u) + 1e-9)
        t = np.clip(s / max(float(s.max()), 1e-9), 0, 1)
        width = float(np.ptp(P[rows, 0]))
    else:
        L = float(contact[2] - z_min)
        t = np.clip((contact[2] - P[rows, 2]) / max(L, 1e-9), 0, 1)
        width = float(np.ptp(P[rows, 0]))
    xm = float(P[rows, 0].mean()) - body["x_mid"]
    side = "L" if xm > 0.01 * H else ("R" if xm < -0.01 * H else None)
    pc = {"class": it["class"], "confidence": float(it["confidence"]), "n_welded": int(rows.size), "layer": 0, "side": side,
          "panel": None, "parent": bone, "attach": {"bone": bone, "points": contact[None]}, "length": L, "width": width,
          "hem_loop": np.zeros(0, np.int64), "slits": [], "merged_into": None, "reasons": list(it["reasons"]),
          "islands": it["islands"], "z_top": z_top, "z_min": z_min, "_rows": rows, "_t": t.astype(np.float32)}
    if it["class"] == "cluster":
        pc["n_items"] = it["n_items"]
        pc["items"] = [{"islands": [int(i) for i in sorted(g if isinstance(g, list) else [g])]} for g in it["groups"]]
        pc["_groups"] = it["groups"]
    else:
        pc["drop"] = it["drop"]
    return pc


def _apply_overrides(pieces, ov, flags):
    spec = ov.get("pieces") or {}
    for key, o in spec.items():
        tgt = [pc for pc in pieces if pc["id"] == key]
        if key.startswith("auto:"):
            k = int(key.split(":", 1)[1])
            tgt = pieces[k:k + 1]
        if not tgt:
            flags.append({"piece": key, "why": "override names no piece"})
            continue
        pc = tgt[0]
        for f in ("class", "chains", "bones", "parent", "disable", "rigid", "swing"):
            if f in o:
                if f == "class" and o[f] not in CLASSES:
                    raise ValueError(f"--garments: piece {key}: unknown class {o[f]!r} (one of {CLASSES})")
                pc[f if f != "chains" and f != "bones" else f"override_{f}"] = o[f]
        if "merge_with" in o:
            pc["merged_into"] = o["merge_with"]
        pc["reasons"].append(f"override: {sorted(o)}")
        pc["confidence"] = max(pc["confidence"], 0.95)


def _public(pc) -> dict:
    out = {}
    for k, v in pc.items():
        if k.startswith("_"):
            continue
        if isinstance(v, np.ndarray):
            v = v.tolist() if v.dtype.kind in "iu" else _r(v)
        elif isinstance(v, float):
            v = _r(v)
        out[k] = v
    out["attach"] = {"bone": pc["attach"]["bone"], "points": _r(np.asarray(pc["attach"]["points"]))}
    return out


def save(doc: dict, arrays: dict, out_json, out_npz) -> None:
    npzio.write_json(out_json, doc)
    if not arrays:
        n = 0
        arrays = {"piece": np.zeros(n, np.int32), "t": np.zeros(n, np.float32), "phi": np.zeros(n, np.float32),
                  "layer": np.zeros(n, np.int8), "outer_ref": np.zeros(n, np.int32)}
    meta = {"schema": 0, "asset_id": doc["asset_id"], "H": doc["H"], "family": doc["family"],
            "pieces": [pc["id"] for pc in doc["pieces"]]}
    npzio._atomic_write(out_npz, lambda f: np.savez_compressed(
        f, piece=np.asarray(arrays["piece"], np.int32), t=np.asarray(arrays["t"], np.float32),
        phi=np.asarray(arrays["phi"], np.float32), layer=np.asarray(arrays["layer"], np.int8),
        outer_ref=np.asarray(arrays["outer_ref"], np.int32), meta=np.array(json.dumps(meta, sort_keys=True))))


def load_npz(path) -> dict:
    with np.load(os.fspath(path), allow_pickle=False) as z:
        d = {k: z[k] for k in z.files}
    d["meta"] = json.loads(str(d["meta"]))
    return d


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="S3g garment classification -> garments.json + garments.npz (G1)")
    ap.add_argument("--mesh", required=True, help="mesh.npz after S2")
    ap.add_argument("--skeleton", required=True, help="resolved skeleton.json")
    ap.add_argument("--analysis", help="analysis.json (S1); analysis.npz next to it is used for thickness")
    ap.add_argument("--landmarks", help="landmarks.json (recorded only; the skeleton carries the joints)")
    ap.add_argument("--family", help="family name (default: the skeleton's)")
    ap.add_argument("--garments", help="override JSON (cloth-and-attachments.md §7)")
    ap.add_argument("--aux-budget", type=int, default=32)
    ap.add_argument("--out", required=True, help="output folder")
    a = ap.parse_args(argv)
    mesh = npzio.load_mesh(a.mesh)
    skel = npzio.read_json(a.skeleton)
    an, arr = None, None
    if a.analysis:
        an = npzio.read_json(a.analysis)
        p = os.path.splitext(a.analysis)[0] + ".npz"
        if os.path.isfile(p):
            with np.load(p, allow_pickle=False) as z:
                arr = {k: z[k] for k in z.files if k in ("thickness_welded", "island_welded")}
    ov = npzio.read_json(a.garments) if a.garments else None
    doc, arrays = classify(mesh, skel, an, arr, a.family, ov, a.aux_budget)
    if a.landmarks:
        doc["landmarks"] = os.path.abspath(a.landmarks)
    if arrays and len(arrays["piece"]) == 0:
        arrays = {}
    save(doc, arrays, os.path.join(a.out, "garments.json"), os.path.join(a.out, "garments.npz"))
    print(json.dumps({"pieces": [(p["id"], p["class"], p["confidence"], p["n_welded"], p.get("chains_planned"),
                                  p.get("bones_planned")) for p in doc["pieces"]], "budget": doc["budget"],
                      "flags": len(doc["flags"]), "time_s": doc.get("time_s")}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
