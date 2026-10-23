r"""A2 acceptance driver: runs the solvers chain for the benchmark assets and writes every output under ``--out`` (default
E:\tmp_rigkit\I1\pipe, P3 integration of the review-r3 fixes; round 1 wrote E:\tmp_rigkit\A2\, which B and C read, and fix round 3
E:\tmp_rigkit\A2_r3\pipe - both left untouched).

    GLB -> glbmesh (mesh.npz) -> analysis (analysis.json/.npz) -> landmarks_geo (landmarks_a.json, midline = hand-tip mid-x)
        -> unirig_bridge read (unirig\<asset>\bone_map.json, landmarks_d.json, ...) -> consensus (landmarks.json, flags.json)
        -> plausibility.json/.md (core joints inside the mesh, knees vs prior, segment ratios vs the family band - with a warning
           below the band even when a joint of the chain is flagged -, clavicles inside the torso and reachable from the spine/neck
           line without crossing a surface, flag tiles before and after the vision check)

For D01 also the regression table against the G2-approved landmarks (tier 2, references/joint-placement.md "Ground truth policy"):
accuracy_vs_g2.json/.md with errors in % H for (i) geometry alone (a), (ii) UniRig alone (d), (iii) consensus, RAW (every landmark
of the table) and ERRATA-AWARE (without the landmarks listed in D01_errata.json, written next to the table: G2 errors and the
spine-depth convention difference); head_top is excluded from the table (G2's head bone tail sits inside the helmet). Tier-2 class
tolerances: 2 % H fixed-anatomy joints, 3.5 % H convention landmarks, 2 % H tips. Never tune constants to these numbers (tier 2 is
regression only).

Run (rigkit-env):  python -I A2_pipeline.py [--assets D01_hodling FL_flagellant_vA U01_shambler] [--out E:\tmp_rigkit\I1\pipe]
UniRig is not re-run here (outputs in E:\tmp_unirig\out\<asset>\ are read); use solvers/unirig_bridge.py run for a new asset.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import json  # noqa: E402

import numpy as np  # noqa: E402

from rigcore import geom as rgeom, landmarks as rlm, npzio, template  # noqa: E402
from solvers import analysis, consensus, glbmesh, landmarks_geo, unirig_bridge  # noqa: E402

REPO = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "..", ".."))
OUT = r"E:\tmp_rigkit\I1\pipe"
ASSETS = {
    "D01_hodling": {"glb": r"ashlar\3d\monsters\D01_hodling\D01_hodling.glb", "H": 0.5, "family": "S"},
    "FL_flagellant_vA": {"glb": r"ashlar\3d\heroes\FL_flagellant_vA\FL_flagellant_vA.glb", "H": 1.8, "family": "H"},
    "U01_shambler": {"glb": r"ashlar\3d\monsters\U01_shambler\U01_shambler.glb", "H": 0.95 * 1.8, "family": "H"},
}
D01_G2 = r"ashlar\3d\monsters\D01_hodling\rig\tools\landmarks.json"
ELBOW_PREBEND = 0.0033  # d01_rig_def.ELBOW_PREBEND (m, toward +Y)
FIXED = ("shoulder", "elbow", "wrist", "hip", "knee", "ankle", "ball")
CONVENTION = ("pelvis", "spine_01", "spine_02", "chest", "neck", "head", "clavicle")
TIER2_TOL_H = {"fixed": 0.02, "convention": 0.035, "tip": 0.02}
TABLE_EXCLUDED = ("head_top",)

#: D01 errata of the G2 landmarks (review r1, reviewer section measurements in E:\tmp_rigkit\review_a2_r1\); used to EXCLUDE landmarks
#: from the errata-aware score, never as targets
D01_ERRATA = {
    "wrist_L": {"why": "G2 wrist (x 0.268) sits 24-26 mm inside the hand: the forearm narrows to 67 mm perimeter at x 0.222-0.240 and "
                       "the hand flares from x 0.242-0.244", "observed_x": [0.242, 0.244]},
    "wrist_R": {"why": "mirror of wrist_L (G2 mirrored the left arm)", "observed_x": [-0.244, -0.242]},
    "elbow_L": {"why": "G2 elbow (x 0.172) sits in the forearm bulge; the elbow knob is at x 0.150-0.155 (perimeter valley 0.146-0.148)",
                "observed_x": [0.150, 0.155]},
    "elbow_R": {"why": "mirror of elbow_L", "observed_x": [-0.155, -0.150]},
    "head_top": {"why": "G2 head_top is the head bone's tail inside the helmet (z 0.435), not the skull top", "excluded_from_table": True},
    "spine_02": {"why": "spine-depth convention, not a regression (joint-placement.md interim rules, review r2): the geometry source puts "
                        "the spine line at 62-65 % of the torso depth from the front, D01 G2 sits at 35-48 %; decided at P5 by S7 belly "
                        "and back deformation on tier-1 rigs, not by distance to G2", "kind": "convention"},
    "chest": {"why": "spine-depth convention, not a regression (as spine_02): the chest sits on the same spine line, 62 % of the torso "
                     "depth from the front vs G2's 35-48 %", "kind": "convention"},
}
D01_ATTRIBUTION = {
    "neck": "round-1 miss (5.99 % H) was a source-a error: the spine line continued to the shoulder top; G2 is fine",
    "head": "round-1 miss (8.19 % H) was a source-a error: proportional pivot on the torso spine line, 45-55 mm behind the ear base; "
            "G2's pivot is 10-15 mm behind the ear base",
    "chest": "round-1 miss (5.06 % H) was a source-a error: armpit taken where the torso section reaches the arm underside (z 0.3245) "
             "instead of the fillet corner (z 0.313-0.316)",
}


def tier2_class(lid: str) -> str:
    base = lid[:-2] if lid.endswith(("_L", "_R")) else lid
    return "fixed" if base in FIXED else ("convention" if base in CONVENTION else "tip")


def run_asset(asset: str, spec: dict, out: str = OUT) -> dict:
    glb = os.path.join(REPO, spec["glb"])
    d = os.path.join(out, asset)
    mesh_path = os.path.join(d, "mesh.npz")
    m = glbmesh.write_mesh_npz(glb, mesh_path, asset, spec["H"])
    mesh = npzio.load_mesh(mesh_path)
    doc, arrays = analysis.analyse(mesh, spec["family"], glb)
    analysis.write(doc, arrays, os.path.join(d, "analysis.json"))
    res = landmarks_geo.solve(mesh, spec["family"], None, analysis=doc)
    landmarks_geo.write_landmarks_a(res, os.path.join(d, "landmarks_a.json"), asset, spec["family"], spec["H"])
    rigged = os.path.join(unirig_bridge.UNIRIG_OUT, asset, f"{asset}_rigged.glb")
    ur, d_path = None, ""
    if os.path.isfile(rigged):
        ur = unirig_bridge.process(asset, rigged, mesh_path, spec["family"], os.path.join(out, "unirig", asset))
        d_path = os.path.join(out, "unirig", asset, "landmarks_d.json")
    cs = consensus.run(asset, spec["family"], a=os.path.join(d, "landmarks_a.json"), d=d_path, out_dir=d, mesh=mesh_path)
    pl = plausibility(asset, spec, out)
    return {"asset": asset, "n_vertices": int(len(m["V"])), "analysis_stop": doc["stop"],
            "flags": [f"{f['severity']}:{f['code']}" for f in doc["stop_flags"]], "landmarks_a": len(res["landmarks"]),
            "missing_a": res["missing"], "notes_a": res["notes"], "x_mid_a": res["frame"]["x_mid"], "unirig": ur, "consensus": cs,
            "plausibility": pl["summary"]}


# --------------------------------------------------------------------------------------------------------------------------
# plausibility (review r1 finding 13: core joints inside, knees vs prior, segment ratios, clavicles inside the torso)
# --------------------------------------------------------------------------------------------------------------------------


def chest_loop(geom, chest, H: float):
    """The closed torso loop nearest to the chest height (within +-2 % H in 0.5 % H steps; open Tripo surfaces may have none at the
    chest itself): (loop, its z) or (None, None)."""
    for k in (0, 1, -1, 2, -2, 3, -3, 4, -4):
        z = float(chest[2]) + k * 0.005 * H
        lp = landmarks_geo.torso_loop(geom, z, float(chest[0]))
        if lp is not None:
            return lp, z
    return None, None


def clavicle_segment(geom, lms: dict, side: str) -> dict | None:
    """Review r2 N2: the segment from the spine/neck line (chest -> neck, at the clavicle's height) to the clavicle must cross no
    surface. Returns {line_point, line_inside, crossings, first_crossing_m} or None without chest/neck/clavicle."""
    if not all(k in lms for k in ("chest", "neck", f"clavicle_{side}")):
        return None
    chest, neck, c = (np.array(lms[k]["pos"], dtype=float) for k in ("chest", "neck", f"clavicle_{side}"))
    t = float(np.clip((c[2] - chest[2]) / (neck[2] - chest[2]), 0.0, 1.0)) if neck[2] > chest[2] else 0.0
    o = chest + t * (neck - chest)
    hits = landmarks_geo.segment_crossings(geom, o, c)
    return {"line_point": [round(float(v), 5) for v in o], "line_inside": bool(geom.winding(o[None])[0] > 0.5),
            "crossings": int(hits.size), "first_crossing_m": round(float(hits[0]), 5) if hits.size else None}


def plausibility(asset: str, spec: dict, out: str = OUT) -> dict:
    """Checks on the consensus landmarks and on source a of one asset; writes plausibility.json/.md. Every check has ``ok``."""
    H, fam_name = spec["H"], spec["family"]
    d = os.path.join(out, asset)
    mesh = npzio.load_mesh(os.path.join(d, "mesh.npz"))
    geom = landmarks_geo.MeshGeom(mesh["V"], mesh["F"], mesh["weld"])
    fam = template.load_family(fam_name)
    bands = consensus.segment_ratio_bands(fam)
    cons = npzio.read_json(os.path.join(d, "landmarks.json"))["landmarks"]
    srca = npzio.read_json(os.path.join(d, "landmarks_a.json"))["landmarks"]
    checks = []

    def add(name, ok, warn=None, **ev):
        checks.append({"check": name, "ok": bool(ok), **({"warn": warn} if warn else {}), **ev})

    for who, lms in (("consensus", cons), ("a", srca)):
        core = [k for k in lms if (k[:-2] if k.endswith(("_L", "_R")) else k) in landmarks_geo.CORE]
        W = geom.winding(np.array([lms[k]["pos"] for k in core]))
        for k, w in zip(core, W):
            flagged = bool(lms[k].get("flagged"))
            add(f"{who}: {k} inside the mesh", w > 0.5 or (who == "consensus" and flagged), winding=round(float(w), 3), flagged=flagged)
        kp = fam["priors"]["knee"]
        for s in ("L", "R"):
            k = lms.get(f"knee_{s}")
            if k is None:
                continue
            z = k["pos"][2] / H
            inside = abs(z - kp["z_over_H"]) <= kp["tol_H"]
            low = float(k.get("confidence", 1.0)) <= landmarks_geo.LOW_CONF + 1e-9
            add(f"{who}: knee_{s} z/H within the prior or LOW/flagged", inside or low or bool(k.get("flagged")), z_over_H=round(z, 4),
                prior=[kp["z_over_H"], kp["tol_H"]], confidence=k.get("confidence"), flagged=k.get("flagged"))
        for s in ("L", "R"):
            for chain, joints in (("arm", ("shoulder", "elbow", "wrist")), ("leg", ("hip", "knee", "ankle"))):
                ids = [f"{j}_{s}" for j in joints]
                if not all(i in lms for i in ids):
                    continue
                r = landmarks_geo.segment_ratio(*(lms[i]["pos"] for i in ids))
                lo, hi = bands[chain]
                low = [i for i in ids if float(lms[i].get("confidence", 1.0)) <= landmarks_geo.LOW_CONF + 1e-9]
                fl = [i for i in ids if lms[i].get("flagged")]
                inside = lo <= r <= hi
                warn = None if inside else (f"{who}: {chain}_{s} ratio {r:.2f} {'below' if r < lo else 'above'} the family band {lo}-{hi}"
                                            + (f" (excused: {', '.join(sorted(set(low + fl)))} LOW/flagged)" if low or fl else ""))
                add(f"{who}: {chain} ratio {s} within {lo}-{hi} or a joint LOW/flagged", inside or bool(low) or bool(fl), warn=warn,
                    ratio=round(r, 3), band=[lo, hi], low=low, flagged=fl)
        if "chest" in lms:
            chest = np.array(lms["chest"]["pos"])
            lp, zl = chest_loop(geom, chest, H)
            for s in ("L", "R"):
                c = lms.get(f"clavicle_{s}")
                if c is None:
                    continue
                p = np.array(c["pos"])
                in_loop = landmarks_geo.loop_contains(lp, np.array([p[0], p[1], zl])) if lp is not None else None
                w = float(geom.winding(p[None])[0])
                ok = (in_loop is not False and w > 0.5) or (who == "consensus" and bool(c.get("flagged")))
                add(f"{who}: clavicle_{s} inside the torso", ok, inside_chest_loop=in_loop, loop_z=zl, winding=round(w, 3),
                    flagged=c.get("flagged"), note=None if lp is not None else "no closed torso loop within 2 % H of the chest: inside-mesh test only")
                seg = clavicle_segment(geom, lms, s)
                if seg is not None:
                    ok = seg["crossings"] == 0 or seg["line_inside"] is False or (who == "consensus" and bool(c.get("flagged")))
                    add(f"{who}: clavicle_{s} reached from the spine/neck line without crossing a surface", ok, flagged=c.get("flagged"),
                        **seg)
    flags = npzio.read_json(os.path.join(d, "flags.json"))
    summary = {"n_checks": len(checks), "n_failed": sum(1 for c in checks if not c["ok"]),
               "failed": [c["check"] for c in checks if not c["ok"]], "warnings": [c["warn"] for c in checks if c.get("warn")],
               "ready_for_user": flags["ready_for_user"], "n_tiles": flags["n_tiles"],
               "n_vision_only_tiles": flags["n_vision_only_tiles"], "n_pending": flags["n_pending"], "n_escalated": flags["n_escalated"],
               "tiles": [t["key"] for t in flags["tiles"] if t["flag"] == "vision"],
               "vision_only_tiles": [t["key"] for t in flags["tiles"] if t["flag"] == "vision_only"], "user_tiles": flags["user_tiles"],
               "reasons": flags["reasons"], "segment_ratio_band": {k: (list(v) if isinstance(v, tuple) else v) for k, v in bands.items()}}
    doc = {"schema": 0, "asset_id": asset, "H": H, "summary": summary, "checks": checks}
    npzio.write_json(os.path.join(d, "plausibility.json"), doc)
    lines = [f"# {asset}: plausibility (H {H} m)", "", f"- checks: {summary['n_checks']}, failed: {summary['n_failed']}, "
             f"warnings: {len(summary['warnings'])}",
             f"- flag tiles before the vision check: {summary['n_tiles']} ({', '.join(summary['tiles'])}); vision-only: "
             f"{summary['n_vision_only_tiles']} ({', '.join(summary['vision_only_tiles'])}); pending: {summary['n_pending']}; "
             f"escalated (user): {summary['n_escalated']}; ready_for_user: {summary['ready_for_user']}",
             f"- segment-ratio band: arm {bands['arm']}, leg {bands['leg']} ({bands['source']})", ""]
    lines += [f"- WARN {w}" for w in summary["warnings"]] + ([""] if summary["warnings"] else [])
    for c in checks:
        ev = {k: v for k, v in c.items() if k not in ("check", "ok", "warn")}
        tag = "FAIL" if not c["ok"] else ("WARN" if c.get("warn") else "ok  ")
        lines.append(f"- {tag} {c['check']}: {json.dumps(ev)}")
    with open(os.path.join(d, "plausibility.md"), "w", encoding="utf-8", newline="\n") as fh:
        fh.write("\n".join(lines) + "\n")
    return doc


# --------------------------------------------------------------------------------------------------------------------------
# D01 regression vs G2 (tier 2)
# --------------------------------------------------------------------------------------------------------------------------


def d01_accuracy(out: str = OUT) -> dict:
    """Errors vs the G2 landmarks (D01, H = 0.5) for a, d and consensus: raw and errata-aware counts within the tier-2 class
    tolerances (and within 1 % H for continuity with round 1). Writes D01_errata.json, accuracy_vs_g2.json/.md."""
    H = 0.5
    base = os.path.join(out, "D01_hodling")
    g2 = rlm.from_d01_landmarks(os.path.join(REPO, D01_G2))
    g2_fit = dict(g2)  # builder's elbow (d01_rig_def.fitted_landmarks): projected on shoulder-wrist, + 3.3 mm toward +Y
    for s in ("L", "R"):
        e = rgeom.on_line(g2[f"shoulder_{s}"], g2[f"elbow_{s}"], g2[f"wrist_{s}"])
        g2_fit[f"elbow_{s}"] = (e[0], e[1] + ELBOW_PREBEND, e[2])
    errata = {"schema": 0, "asset_id": "D01_hodling", "ground_truth": D01_G2.replace("\\", "/"),
              "policy": "references/joint-placement.md 'Ground truth policy': G2 rigs are tier 2 = regression only ('not worse than the "
                        "approved rig'); landmarks listed here are excluded from the errata-aware score and never used as targets",
              "evidence": r"E:\tmp_rigkit\review_a2_r1 (reviewer section measurements, renders); spine-depth convention: "
                          r"references/joint-placement.md interim rules (review r2)", "errata": D01_ERRATA,
              "attribution_of_round1_misses": D01_ATTRIBUTION, "excluded_from_table": list(TABLE_EXCLUDED),
              "tier2_tolerance_H": TIER2_TOL_H}
    npzio.write_json(os.path.join(base, "D01_errata.json"), errata)
    srcs = {"a": os.path.join(base, "landmarks_a.json"), "d": os.path.join(out, "unirig", "D01_hodling", "landmarks_d.json"),
            "consensus": os.path.join(base, "landmarks.json")}
    data = {k: npzio.read_json(p)["landmarks"] for k, p in srcs.items() if os.path.isfile(p)}
    fam = {"landmarks": {"center": ["pelvis", "spine_01", "spine_02", "chest", "neck", "head", "head_top"],
                         "sided": ["clavicle", "shoulder", "elbow", "wrist", "hand_tip", "palm", "hip", "knee", "ankle", "ball", "toe_tip",
                                   "heel_ground", "ball_ground", "toe_ground"]}}
    ids = [lid for lid in rlm.landmark_ids(fam) if lid in g2 and lid not in TABLE_EXCLUDED]
    rows = []
    counts = {k: {"raw": {"n": 0, "within_tier2": 0, "le_1pct": 0}, "errata_aware": {"n": 0, "within_tier2": 0, "le_1pct": 0},
                  "core_raw": {"n": 0, "within_tier2": 0}, "core_errata_aware": {"n": 0, "within_tier2": 0}} for k in data}
    for lid in ids:
        cls = tier2_class(lid)
        tol = TIER2_TOL_H[cls] * 100
        row = {"id": lid, "class": cls, "tier2_tol_pct_H": tol, "erratum": D01_ERRATA.get(lid, {}).get("why"), "g2": list(g2[lid])}
        for k, lm in data.items():
            if lid not in lm:
                row[k] = None
                continue
            p = np.array(lm[lid]["pos"])
            e = p - np.array(g2[lid])
            err = float(np.linalg.norm(e) / H * 100)
            row[k] = {"err_pct_H": round(err, 3), "dxyz_mm": [round(float(c) * 1000, 1) for c in e], "within_tier2": err <= tol}
            if lid.startswith("elbow"):
                row[k]["err_pct_H_vs_prebent"] = round(float(np.linalg.norm(p - np.array(g2_fit[lid])) / H * 100), 3)
            groups = ["raw"] + ([] if lid in D01_ERRATA else ["errata_aware"])
            if cls != "tip":
                groups += ["core_raw"] + ([] if lid in D01_ERRATA else ["core_errata_aware"])
            for gname in groups:
                c = counts[k][gname]
                c["n"] += 1
                c["within_tier2"] += err <= tol
                if "le_1pct" in c:
                    c["le_1pct"] += err <= 1.0
        if "consensus" in data and lid in data["consensus"]:
            row["consensus_kind"] = data["consensus"][lid].get("kind")
            row["consensus_flagged"] = data["consensus"][lid].get("flagged")
            row["consensus_decision"] = data["consensus"][lid].get("decision")
        rows.append(row)
    flags = npzio.read_json(os.path.join(base, "flags.json"))
    doc = {"schema": 0, "asset_id": "D01_hodling", "H": H, "ground_truth": D01_G2, "errata_file": os.path.join(base, "D01_errata.json"),
           "note": "G2 landmarks via rigcore.landmarks.from_d01_landmarks (raw measured values; no clavicle in D01); head_top excluded "
                   "(erratum). raw = every row; errata_aware = without wrist/elbow (G2 errata) and spine_02/chest (spine-depth "
                   "convention, D01_errata.json). Tier-2 tolerances: "
                   f"{TIER2_TOL_H} (fractions of H). Elbow rows also give the error against the builder's pre-bent elbow.",
           "counts": counts, "flags": {"ready_for_user": flags["ready_for_user"], "n_tiles": flags["n_tiles"],
                                       "n_vision_only_tiles": flags["n_vision_only_tiles"],
                                       "tiles": [t["key"] for t in flags["tiles"] if t["flag"] == "vision"],
                                       "vision_only_tiles": [t["key"] for t in flags["tiles"] if t["flag"] == "vision_only"],
                                       "n_flagged": flags["summary"]["n_flagged"]},
           "rows": rows}
    npzio.write_json(os.path.join(base, "accuracy_vs_g2.json"), doc)

    def f(r, k):
        v = r.get(k)
        if not v:
            return "-"
        s = f"{v['err_pct_H']:.2f}{'' if v['within_tier2'] else ' !'}"
        if "err_pct_H_vs_prebent" in v:
            s += f" ({v['err_pct_H_vs_prebent']:.2f} pre-bent)"
        return s

    lines = ["# D01 vs G2 (tier 2, regression only)", "",
             f"Errata: `D01_errata.json` (wrists, elbows: G2 errors; spine_02, chest: spine-depth convention, not regressions - all "
             f"excluded from the errata-aware score; head_top excluded from the table). "
             f"Tier-2 tolerance per class: fixed-anatomy {TIER2_TOL_H['fixed']:.0%} H, convention {TIER2_TOL_H['convention']:.1%} H, "
             f"tips {TIER2_TOL_H['tip']:.0%} H; `!` = outside it.", "",
             "| landmark | class | tol % H | a % H | d % H | consensus % H | kind | flagged | erratum |", "|---|---|---|---|---|---|---|---|---|"]
    for r in rows:
        lines.append(f"| {r['id']} | {r['class']} | {r['tier2_tol_pct_H']:.1f} | {f(r, 'a')} | {f(r, 'd')} | {f(r, 'consensus')} | "
                     f"{r.get('consensus_kind') or ''} | {'yes' if r.get('consensus_flagged') else ''} | {'yes' if r['erratum'] else ''} |")
    lines.append("")
    for k, c in counts.items():
        lines.append(f"- **{k}**: raw {c['raw']['within_tier2']}/{c['raw']['n']} within tier 2 ({c['raw']['le_1pct']} <= 1 % H); "
                     f"errata-aware {c['errata_aware']['within_tier2']}/{c['errata_aware']['n']} ({c['errata_aware']['le_1pct']} <= 1 % H); "
                     f"core raw {c['core_raw']['within_tier2']}/{c['core_raw']['n']}, core errata-aware "
                     f"{c['core_errata_aware']['within_tier2']}/{c['core_errata_aware']['n']}")
    lines += ["", f"Flags: {flags['n_tiles']} tiles before the vision check "
                  f"({', '.join(t['key'] for t in flags['tiles'] if t['flag'] == 'vision')}), {flags['n_vision_only_tiles']} vision-only "
                  f"({', '.join(t['key'] for t in flags['tiles'] if t['flag'] == 'vision_only')}); ready_for_user: "
                  f"{flags['ready_for_user']}" + (f" - {flags['reasons'][0]}" if flags["reasons"] else ""), "",
              "Attribution of the round-1 misses:"] + [f"- {k}: {v}" for k, v in D01_ATTRIBUTION.items()]
    with open(os.path.join(base, "accuracy_vs_g2.md"), "w", encoding="utf-8", newline="\n") as fh:
        fh.write("\n".join(lines) + "\n")
    return doc


def main(argv=None) -> int:
    import argparse

    ap = argparse.ArgumentParser(description="A2 acceptance pipeline")
    ap.add_argument("--assets", nargs="*", default=list(ASSETS))
    ap.add_argument("--out", default=OUT)
    a = ap.parse_args(argv)
    summary = {}
    for asset in a.assets:
        summary[asset] = run_asset(asset, ASSETS[asset], a.out)
    if "D01_hodling" in a.assets:
        acc = d01_accuracy(a.out)
        summary["D01_accuracy_counts"] = acc["counts"]
    npzio.write_json(os.path.join(a.out, "pipeline_summary.json"), summary)
    print(json.dumps({k: (v.get("consensus", {}).get("tiles"), v.get("plausibility")) if isinstance(v, dict) and "asset" in v else v
                      for k, v in summary.items()}, default=str)[:6000])
    return 0


if __name__ == "__main__":
    sys.exit(main())
