r"""solvers.skin_select - per-region choice between skin candidates, blended across a transition band, then the user override
layer and ``enforce`` (owner B, P3). Runs in rigkit-env.

Inputs:

* candidates: ``NAME=weights.npz`` (same mesh; columns matched by bone name, missing columns are 0);
* regions: writer C's ``regions.npz`` (``names`` (r,) + ``masks`` (r, n_welded) bool over rigcore.mesh.weld_map ids, or one bool
  array per region) - a partition is expected; on overlap the first region in file order wins. Without a file the regions are
  derived from the dominant bone of the ``--reference`` candidate (``<bone>_twist`` folds into ``<bone>``, as metrics.py does);
* choice: either scores or a manual ``{region: candidate}`` file.

Scores = writer C's ``region_scores.json`` from ``solvers/metrics.py``: ``{region: {key: score}}``, lower is better. C names the
weights it scored: the primary ``--weights`` file by its ``meta.candidate`` (our candidates write ``A_region``, ``B_transfer``,
``C_unirig``, ``selected``; C's emulated runtime weights are ``emulated:<asset>``) and every ``--candidate NAME=weights.npz`` by
NAME. A score key belongs to one of our candidates by, in this order: an explicit mapping ``{score_key: candidate}``
(``--score-key KEY=NAME``, repeatable), the candidate's own NAME, the ``meta.candidate`` stored in the candidate's weights.npz
(when unique). Example: C run as ``metrics.py --weights wA.npz --candidate B=wB.npz --candidate C=wC.npz`` gives the keys
``A_region``, ``B``, ``C``, which match ``--candidate A=wA.npz --candidate B=wB.npz --candidate C=wC.npz`` without a mapping.
Keys that match no candidate are reported (``unmatched_score_keys``); when no region has a usable score the selector raises
``ValueError`` (D01's ``region_scores.json`` of writer C scores ``emulated:D01_hodling``, ``D01_source`` and ``rigid_onehot``,
none of which is a candidate). Ties go to the candidate order on the command line; regions without a usable score, and
vertices outside every region, take ``--default`` (default: the candidate with the best mean score).

Before the scores decide (references/deformation-qa.md "Region score": before the tear step), two rules (score choice only; a
manual choice is the user's and is kept, its leak reported):

* **Limb-leak gate** (I2, review B r3): ``skin_common.limb_leak`` of every candidate on the welded rows, rows counted per region;
  in a gate region (thresholds.json ``weights_limb_leak.gate_regions``: torso, neck, clavicle, upper-arm and thigh regions) a
  candidate with more leaking rows than the row's green bound (3) is dropped for that region, unless every candidate exceeds it
  (then none is dropped and the region is flagged for G2). Computed here from the weights, so it holds for score files written
  before metrics.py had the gate (writer C round 3) and agrees with metrics' own gate. A dropped candidate stays out of that
  region everywhere (I5, review m3): the blend band cannot bring it back (``blend_alpha(forbid=...)``); where every scored
  candidate is dropped an unscored one that passes is kept, and a not-exercised region whose rule candidate is dropped keeps
  another one - both flagged for G2, as is a region without a score whose default the gate drops.
* **Not exercised** (writer C's ``region_scores_detail.json``: ``not_exercised``, ``for_skin_select``; ``--detail``): the poses
  cannot tell the candidates apart there and every candidate carries the same score, so the region keeps the rule-based
  candidate A (``--rule-candidate``; default: the candidate whose meta.candidate is ``A_region``, else the one named ``A``, else
  the default) and is flagged for G2. Without a detail file a region whose usable scores are all equal is treated the same way.

``report["flag_g2"]`` lists every flagged region with its reason (not exercised, every candidate leaks, writer C's own G2 flags
such as near ties).

Blend: per welded vertex the chosen candidate's indicator; the ``band`` rings on each side of a label border (ring 1 = the
vertices on a border edge) get the indicator smoothed by ``band`` Jacobi passes (lambda 0.5) restricted to them, so rows change
over 2 x band rings instead of at a hard cut (default band 2: 2 rings per side); then W = sum_c alpha_c W_c (alpha normalized).
Joint profiles are re-applied only on the rows that mix candidates (each candidate's own rows are already profiled and the
profiles are idempotent, so a candidate chosen everywhere comes back unchanged), overrides are applied (locked entries) and
``enforce`` runs with the asset rules.

CLI::

    python -I solvers/skin_select.py --mesh mesh.npz --skeleton skeleton.json [--rules skin_rules.json]
        --candidate A=wA.npz --candidate B=wB.npz [--candidate C=wC.npz]
        (--scores region_scores.json [--score-key KEY=NAME ...] --regions regions.npz | --choice choice.json [--regions ...])
        [--detail region_scores_detail.json] [--rule-candidate A] [--no-leak-gate]
        [--band 2] [--default A] [--overrides weights_override.json] --out weights.npz

Units: metres. Frame: Blender, Z up, front -Y, left +X.
"""
from __future__ import annotations

import argparse
import os
import sys
import time

if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np

from rigcore import npzio, template

from solvers import skin_common as sc
from solvers import skin_rules

CANDIDATE = "selected"
RULE_META = "A_region"  # skin_region.CANDIDATE: the rule-based candidate that keeps the regions no pose exercises


def load_regions(path) -> dict:
    """regions.npz -> {name: bool mask (n_w,)} in file order (C's ``names`` + ``masks`` layout, or one bool array per region)."""
    with np.load(os.fspath(path), allow_pickle=False) as z:
        if "names" in z.files and "masks" in z.files:
            return {str(k): np.asarray(z["masks"][i], bool) for i, k in enumerate(z["names"])}
        return {k: np.asarray(z[k], bool) for k in z.files if k != "meta" and z[k].dtype == bool}


def derive_regions(W, bones: sc.BoneSet) -> dict:
    """Regions from the dominant bone of welded weights ``W`` (twist bones fold into their parent), as metrics.py derives them."""
    dom = np.asarray(W).argmax(1)
    out: dict = {}
    for j, n in enumerate(bones.names):
        r = bones.parent[j] if (bones.kind[j] == "twist" and bones.parent[j]) else n
        out.setdefault(r, np.zeros(len(dom), bool))
        out[r] |= dom == j
    return {r: m for r, m in out.items() if m.any()}


def score_keys(candidates: list, metas: dict | None = None, key_map: dict | None = None) -> dict:
    """{score key: candidate}: explicit ``key_map`` first, then each candidate's NAME, then its weights' ``meta.candidate`` when no
    other candidate has the same one (module docstring)."""
    out: dict = {}
    seen: dict = {}
    for c, m in (metas or {}).items():
        if m:
            seen.setdefault(m, []).append(c)
    for m, cs in seen.items():
        if len(cs) == 1:
            out[m] = cs[0]
    for c in candidates:
        out[c] = c
    for k, c in (key_map or {}).items():
        if c not in candidates:
            raise ValueError(f"score key map: {k!r} -> {c!r} is not a candidate (have {candidates})")
        out[k] = c
    return out


def choose(scores: dict | None, manual: dict | None, candidates: list, default: str | None = None, keys: dict | None = None,
           drop: dict | None = None, keep: dict | None = None):
    """{region: candidate} from scores (lower better; ties -> candidate order) or a manual choice. ``keys`` = ``score_keys``
    (default: the candidate names only). Score choice only: ``drop`` = {region: [candidates]} the limb-leak gate removes from
    that region's choice (``leak_gates``); ``keep`` = {region: candidate} for regions without a preference (not exercised: the
    rule-based candidate). Returns (choice, default, info) with the score keys that match no candidate, the regions without a
    usable score, ``decided`` = {region: "scores" | "kept: no preference" | ...}; raises ``ValueError`` when scores are given but
    no region has a usable one."""
    choice: dict = {}
    keys = dict(keys) if keys is not None else {c: c for c in candidates}
    info: dict = {"score_keys": {k: c for k, c in keys.items()}, "decided": {}}
    drop, keep = dict(drop or {}), dict(keep or {})
    if manual:
        for r, c in manual.items():
            if c not in candidates:
                raise ValueError(f"choice: region {r!r} asks for unknown candidate {c!r} (have {candidates})")
            choice[r] = c
            info["decided"][r] = "manual"
    elif scores is not None:
        all_keys = sorted({k for s in scores.values() for k in (s or {})})
        info["unmatched_score_keys"] = [k for k in all_keys if k not in keys]
        dup = {}
        for r, s in scores.items():
            usable = {}
            for k, v in (s or {}).items():
                if k in keys and v is not None and np.isfinite(float(v)):
                    c = keys[k]
                    if c in usable:
                        dup.setdefault(r, []).append(k)
                    usable[c] = min(float(v), usable.get(c, np.inf))
            if not usable:
                continue
            gone = set(drop.get(r, ()))
            if r in keep:
                ok = [c for c in candidates if c not in gone]
                if keep[r] in gone and ok:  # review m3: the rule candidate leaks here; scores carry no preference -> order
                    pick = min((c for c in ok if c in usable), key=lambda c: (usable[c], candidates.index(c)), default=ok[0])
                    choice[r] = pick
                    info["decided"][r] = (f"not exercised; rule candidate {keep[r]} dropped by the limb-leak gate: kept {pick}")
                    info.setdefault("leak_gate_overrides", {})[r] = {"path": "not exercised", "dropped": keep[r], "chosen": pick}
                    continue
                choice[r] = keep[r]
                info["decided"][r] = "kept: no preference (not exercised)"
                continue
            left = {c: v for c, v in usable.items() if c not in gone}
            if left and len(left) < len(usable):
                info["decided"][r] = f"scores after the limb-leak gate (dropped {sorted(set(usable) - set(left))})"
            elif not left and gone:  # review m3: every scored candidate leaks here; never let one of them win silently
                unscored = [c for c in candidates if c not in usable and c not in gone]
                if unscored:
                    choice[r] = unscored[0]
                    info["decided"][r] = (f"limb-leak gate dropped every scored candidate {sorted(usable)}: kept {unscored[0]}, "
                                          "which has no score here")
                    info.setdefault("leak_gate_overrides", {})[r] = {"path": "only unscored left", "dropped": sorted(usable),
                                                                     "chosen": unscored[0]}
                    continue
                left = usable  # (not reachable with leak_gates, which drops nobody where every candidate leaks): flagged
                info["decided"][r] = "scores (every candidate dropped by the limb-leak gate: the best score kept)"
                info.setdefault("leak_gate_overrides", {})[r] = {"path": "every candidate dropped", "dropped": sorted(gone),
                                                                 "chosen": min(left, key=lambda c: (left[c], candidates.index(c)))}
            else:
                left = usable
                info["decided"][r] = "scores"
            choice[r] = min(left, key=lambda c: (left[c], candidates.index(c)))
        if not choice:
            raise ValueError(f"region scores: no region has a usable score for the candidates {candidates}; the score keys "
                             f"{all_keys} match none of them (known keys {sorted(keys)}). Map them with "
                             f"--score-key KEY=NAME (score_keys(key_map=...)) or score the candidates' weights files")
        info["regions_without_score"] = sorted(r for r in scores if r not in choice)
        if dup:
            info["duplicate_keys"] = dup
    if default is None:
        means = []
        for c in candidates:
            vals = [float(v) for s in (scores or {}).values() for k, v in (s or {}).items()
                    if keys.get(k) == c and v is not None and np.isfinite(float(v))]
            means.append((np.mean(vals) if vals else np.inf, candidates.index(c)))
        default = candidates[min(means)[1]] if any(np.isfinite(m) for m, _ in means) else candidates[0]
    if default not in candidates:
        raise ValueError(f"default candidate {default!r} not in {candidates}")
    return choice, default, info


def leak_gates(topo: sc.WeldTopo, bones: sc.BoneSet, Ws: dict, regions: dict, cfg: dict | None = None) -> dict:
    """The limb-leak gate (module docstring) for welded candidate weights ``Ws`` = {candidate: (n_w,k)} and ``regions``: per
    candidate the ``skin_common.limb_leak`` numbers, per gate region {"rows": {candidate: rows}, "over": [...], "dropped": [...],
    "all_leak"}. ``cfg`` = ``skin_common.leak_config()``."""
    cfg = cfg or sc.leak_config()
    par = {n: x["parent"] for n, x in bones.all_bones.items()}
    lk = {c: sc.limb_leak(topo.P, W, bones.names, bones.head, bones.tail, par, regions=regions, **cfg["params"])
          for c, W in Ws.items()}
    names = list(Ws)
    gates = {}
    for r in regions:
        if r not in cfg["gate_regions"]:
            continue
        rows = {c: int((lk[c]["by_region"].get(r) or {}).get("rows", 0)) for c in names}
        over = [c for c in names if rows[c] > cfg["band"]]
        every = bool(names) and len(over) == len(names)
        gates[r] = {"rows": rows, "over": over, "dropped": [] if every else over, "all_leak": every}
    cand = {c: {"rows": v["rows"], "w_max": v["w_max"], "by_limb": {k: e["rows"] for k, e in v["by_limb"].items()},
                "by_region": {r: e["rows"] for r, e in v["by_region"].items()}} for c, v in lk.items()}
    return {"band": cfg["band"], "gate_regions": cfg["gate_regions"], "params": cfg["params"], "candidates": cand,
            "regions": gates}


def no_preference(scores: dict | None, detail: dict | None, keys: dict) -> dict:
    """{region: why} for the regions whose scores carry no preference: listed ``not_exercised`` in writer C's detail (top level or
    the region's decision), or - without a detail file - every usable score of the region equal (C gives them all the same
    score)."""
    out = {}
    if detail:
        for r in detail.get("not_exercised") or []:
            out[r] = "not exercised (region_scores_detail.json)"
        for r, d in (detail.get("regions") or {}).items():
            if (d.get("decision") or {}).get("not_exercised"):
                out[r] = "not exercised (region_scores_detail.json)"
    elif scores:
        for r, s in scores.items():
            vals = {float(v) for k, v in (s or {}).items() if k in keys and v is not None and np.isfinite(float(v))}
            if len({keys[k] for k in (s or {}) if k in keys}) > 1 and len(vals) == 1:
                out[r] = "equal scores for every candidate (no preference)"
    return out


def rule_candidate(names: list, metas: dict, given: str | None = None, default: str | None = None) -> str:
    """The rule-based candidate A: ``given``, else the candidate whose meta.candidate is ``RULE_META``, else one named "A", else
    ``default`` (else the first)."""
    if given is not None:
        if given not in names:
            raise ValueError(f"rule candidate {given!r} not in {names}")
        return given
    by_meta = [c for c in names if metas.get(c) == RULE_META]
    if len(by_meta) == 1:
        return by_meta[0]
    if "A" in names:
        return "A"
    return default if default in names else names[0]


def label_vertices(regions: dict, choice: dict, candidates: list, default: str, n_w: int):
    """Candidate index per welded vertex (first region in order wins) and region index (-1 = none)."""
    lab = np.full(n_w, candidates.index(default), dtype=np.int64)
    reg = np.full(n_w, -1, dtype=np.int64)
    for i, (r, m) in enumerate(regions.items()):
        if m.shape != (n_w,):
            raise ValueError(f"region {r!r} has {m.shape[0]} entries, the mesh has {n_w} welded vertices")
        new = m & (reg < 0)
        reg[new] = i
        if r in choice:
            lab[new] = candidates.index(choice[r])
    return lab, reg


def blend_alpha(topo: sc.WeldTopo, lab, n_c: int, band: int, lam: float = 0.5, forbid=None):
    """(n_w, n_c) blend factors: one-hot of ``lab``, smoothed by ``band`` Jacobi passes on the ``band`` rings on each side of a
    label border (others stay one-hot). ``forbid`` (n_w, n_c) bool: factors held at 0 after every pass (the limb-leak gate's
    dropped candidates inside their gate regions, review m3; a row's own label is never forbidden). Rows sum to 1. Returns
    (alpha, in_band mask)."""
    A = np.zeros((topo.n_w, n_c))
    A[np.arange(topo.n_w), lab] = 1.0
    if band <= 0:
        return A, np.zeros(topo.n_w, bool)
    if forbid is not None:
        forbid = np.array(forbid, bool, copy=True)
        forbid[np.arange(topo.n_w), lab] = False
    e = topo.edges
    diff = lab[e[:, 0]] != lab[e[:, 1]]
    border = np.zeros(topo.n_w, bool)
    border[e[diff, 0]] = True
    border[e[diff, 1]] = True
    hop = sc.bfs_hops(topo, border, np.ones(topo.n_w, bool), band - 1) if band > 1 else np.where(border, 0, 1)
    in_band = hop <= band - 1
    for _ in range(int(band)):
        A = sc.smooth_pass(A, e, in_band, lam)
        if forbid is not None:
            A[forbid] = 0.0
    A /= A.sum(1, keepdims=True)
    return A, in_band


def leak_forbid(regions: dict, reg, drop: dict, choice: dict, names: list, n_w: int):
    """(n_w, n_c) bool: in every gate region the candidates the limb-leak gate dropped there (except a candidate the choice kept
    there on purpose) may not enter the blend (``blend_alpha(forbid=...)``, review m3). None when nothing is dropped."""
    if not drop:
        return None
    F = np.zeros((n_w, len(names)), bool)
    for i, r in enumerate(regions):
        for c in drop.get(r, ()):
            if c in names and c != choice.get(r):
                F[reg == i, names.index(c)] = True
    return F


def select(mesh, skel, cand: dict, rules=None, regions=None, scores=None, manual=None, default=None, band: int = 2,
           overrides=None, reference=None, key_map=None, detail=None, leak_gate: bool = True, rule: str | None = None):
    """Combine candidates -> (welded W (n_w,k), report, topo, bones, cons). ``cand`` = {name: weights dict
    (rigcore.npzio.load_weights)}; ``key_map`` = {score key: candidate}; ``detail`` = writer C's region_scores_detail.json
    (not exercised regions, C's G2 flags); ``leak_gate`` = the limb-leak gate of the score choice; ``rule`` = the rule-based
    candidate (``rule_candidate``). See the module docstring."""
    rules = dict(rules or {})
    setup = skin_rules.prepare(mesh, skel, rules)
    topo, bones, cons = setup.topo, setup.bones, setup.cons
    names = list(cand)
    Ws = []
    for c in names:
        d = cand[c]
        cols = d["bones"].tolist()
        Wf = np.zeros((topo.n, bones.k))
        for j, n in enumerate(bones.names):
            if n in cols:
                Wf[:, j] = d["W"][:, cols.index(n)]
        Ws.append(topo.gather(Wf))
    if regions is None:
        ref = names.index(reference) if reference else 0
        regions = derive_regions(Ws[ref], bones)
        region_source = f"derived from the dominant bones of {names[ref]!r}"
    else:
        region_source = "regions file"
    metas = {c: str((cand[c].get("meta") or {}).get("candidate") or "") for c in names}
    keys = score_keys(names, metas, key_map)
    gates = leak_gates(topo, bones, dict(zip(names, Ws)), regions)
    drop = {r: g["dropped"] for r, g in gates["regions"].items() if g["dropped"]} if (leak_gate and scores is not None) else {}
    rule_c = rule_candidate(names, metas, rule, default)
    nopref = no_preference(scores, detail, keys) if (scores is not None and not manual) else {}
    choice, default, cinfo = choose(scores, manual, names, default, keys, drop=drop, keep={r: rule_c for r in nopref})
    flags = []
    over = cinfo.get("leak_gate_overrides") or {}
    for r in sorted(regions):
        if r in nopref and r in choice:
            flags.append({"region": r, "reason": f"{nopref[r]}: kept on the rule-based candidate {rule_c}" if r not in over else
                          f"{nopref[r]}: the rule-based candidate {rule_c} leaks there (limb-leak gate): kept {choice[r]}"})
        g = gates["regions"].get(r)
        if g and g["all_leak"] and scores is not None and not manual:
            flags.append({"region": r, "reason": f"limb leak: every candidate leaks there (rows {g['rows']}, band "
                                                  f"{gates['band']:g})"})
        if r in over and r not in nopref:  # review m3: no silent fallback onto a dropped candidate
            flags.append({"region": r, "reason": f"limb leak: {over[r]['path']} (dropped {over[r]['dropped']}): kept "
                                                  f"{over[r]['chosen']} (rows {(g or {}).get('rows')})"})
        if r in drop and r not in choice and default in drop[r]:
            flags.append({"region": r, "reason": f"no usable score: the default {default} kept although the limb-leak gate drops "
                                                  f"it there (rows {(g or {}).get('rows')})"})
        if detail and r in (detail.get("flag_g2") or []) and r not in nopref:
            dec = ((detail.get("regions") or {}).get(r) or {}).get("decision") or {}
            flags.append({"region": r, "reason": f"writer C: {dec.get('decided_by') or 'flagged'}"})
    lab, reg = label_vertices(regions, choice, names, default, topo.n_w)
    forbid = leak_forbid(regions, reg, drop, choice, names, topo.n_w)
    A, in_band = blend_alpha(topo, lab, len(names), int(band), forbid=forbid)
    W = sum(A[:, i:i + 1] * Ws[i] for i in range(len(names)))
    mixed = A.max(1) < 1.0 - 1e-12
    orep = None
    if overrides is not None:
        locked, vals, orep = sc.overrides_apply(overrides, topo.P, bones)
        cons.locked, cons.locked_val = locked, vals
    W, fin = skin_rules.finish(W, setup, skel, rules, rows=mixed)
    rep = {"candidates": names, "candidate_meta": metas, "default": default, "choice": choice, **cinfo,
           "region_source": region_source, "rule_candidate": rule_c, "not_exercised": sorted(nopref),
           "c_for_skin_select": (detail or {}).get("for_skin_select"),
           "leak_gate": dict(gates, applied=bool(drop), dropped=drop, overrides=over,
                             blend_forbidden_rows=int(forbid[in_band].any(1).sum()) if forbid is not None else 0),
           "flag_g2": flags,
           "regions": {r: {"vertices": int(m.sum()), "candidate": choice.get(r, default),
                           "scores": (scores or {}).get(r), "decided": cinfo["decided"].get(r),
                           "leak_rows": {c: gates["candidates"][c]["by_region"].get(r, 0) for c in names}}
                       for r, m in regions.items()},
           "unassigned_vertices": int((reg < 0).sum()), "band_rings": int(band), "band_vertices": int(in_band.sum()),
           "mixed_rows": int(mixed.sum()),
           "vertices_per_candidate": {c: int((lab == i).sum()) for i, c in enumerate(names)}, "overrides": orep, **fin}
    return W, rep, topo, bones, cons


def _pairs(items, what):
    out = {}
    for spec in items or []:
        k, sep, v = spec.partition("=")
        if not sep or not k or not v:
            raise ValueError(f"{what} needs KEY=VALUE, got {spec!r}")
        out[k] = v
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description="per-region choice between skin candidates")
    ap.add_argument("--mesh", required=True)
    ap.add_argument("--skeleton", required=True)
    ap.add_argument("--rules", default=None)
    ap.add_argument("--candidate", action="append", required=True, help="NAME=weights.npz (repeatable, order = tie order)")
    ap.add_argument("--regions", default=None, help="regions.npz (writer C); default: derived from --reference")
    ap.add_argument("--scores", default=None, help="region_scores.json {region: {key: score}} (lower is better)")
    ap.add_argument("--score-key", action="append", default=None,
                    help="KEY=NAME: the score key KEY belongs to candidate NAME (repeatable; see the module docstring)")
    ap.add_argument("--choice", default=None, help="manual {region: candidate}")
    ap.add_argument("--detail", default=None, help="writer C's region_scores_detail.json (not exercised regions, C's G2 flags)")
    ap.add_argument("--rule-candidate", default=None, help="candidate kept where no pose exercises a region (default: A_region)")
    ap.add_argument("--no-leak-gate", action="store_true", help="choose by the scores alone (no limb-leak gate; comparisons)")
    ap.add_argument("--default", default=None)
    ap.add_argument("--reference", default=None, help="candidate whose dominant bones define the regions when --regions is absent")
    ap.add_argument("--band", type=int, default=2, help="transition rings on each side of a region border")
    ap.add_argument("--overrides", default=None, help="weights_override.json (applied before enforce)")
    ap.add_argument("--out", required=True)
    ap.add_argument("--report", default=None)
    a = ap.parse_args(argv)
    if bool(a.scores) == bool(a.choice):
        ap.error("give exactly one of --scores or --choice")
    mesh = npzio.load_mesh(a.mesh)
    skel = template.load_skeleton(a.skeleton)
    try:
        paths = _pairs(a.candidate, "--candidate")
        key_map = _pairs(a.score_key, "--score-key")
    except ValueError as e:
        ap.error(str(e))
    cand = {name: npzio.load_weights(path) for name, path in paths.items()}
    rules = skin_rules.load_rules(a.rules) if a.rules else {}
    regions = load_regions(a.regions) if a.regions else None
    scores = npzio.read_json(a.scores) if a.scores else None
    manual = npzio.read_json(a.choice) if a.choice else None
    detail = npzio.read_json(a.detail) if a.detail else None
    overrides = npzio.read_json(a.overrides) if a.overrides else None
    t0 = time.time()
    Ww, rep, topo, bones, cons = select(mesh, skel, cand, rules, regions, scores, manual, a.default, a.band, overrides,
                                        a.reference, key_map, detail, not a.no_leak_gate, a.rule_candidate)
    W = sc.to_full(Ww, topo)
    npzio.save_weights(a.out, bones.names, W, locked=topo.scatter(cons.rigid_col >= 0),
                       meta={"candidate": CANDIDATE, "params": {"choice": rep["choice"], "default": rep["default"],
                                                                "band": a.band, "candidates": paths, "score_keys": key_map,
                                                                "scores": a.scores, "regions": a.regions, "detail": a.detail,
                                                                "leak_gate": not a.no_leak_gate,
                                                                "leak_dropped": rep["leak_gate"]["dropped"],
                                                                "flag_g2": rep["flag_g2"], "overrides": a.overrides}},
                       check_sums=True)
    rep.update(seconds=round(time.time() - t0, 2), out=a.out)
    npzio.write_json(a.report or (os.path.splitext(a.out)[0] + ".json"), rep)
    if rep.get("unmatched_score_keys"):
        print(f"note: score keys without a candidate: {rep['unmatched_score_keys']}")
    if rep["flag_g2"]:
        print(f"G2 flags: {[f['region'] for f in rep['flag_g2']]}")
    print(f"selected: {rep['vertices_per_candidate']} (band {rep['band_vertices']} vertices) -> {a.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
