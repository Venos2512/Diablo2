r"""pipeline_steps.report - text outputs of ``scripts/pipeline.py``: the step table, ``VISION_CHECKPOINT.md`` (S3 stop) and the
``qa_report.md`` DRAFT (S9): numbers against ``solvers/thresholds.json``, remaining defects, open questions for G2, what was not
checked. The report is a draft for the Opus rig session; it never passes a gate (SKILL.md non-negotiable 10).

Units: metres unless a key says mm; relative values are fractions of H (catalogue height).
"""
from __future__ import annotations

import json
import os

from pipeline_steps.runner import SCRIPTS, STEPS, TITLES, Ctx, read_json

THRESHOLDS = os.path.join(SCRIPTS, "solvers", "thresholds.json")
#: S1 warnings that are brief decisions for the user (references/mesh-intake.md stop conditions and skinning.md clothing)
S1_QUESTIONS = {
    "cloth_bridging": "a skirt or robe bridges the legs: check the S3g garment plan (section Garments, garment sheet) and correct "
                      "it with --garments if needed (references/cloth-and-attachments.md; failure-catalog #6)",
    "fingers_fused": "fingers are fused: mitten hand (one Hand bone, recorded in the brief) or a new T-pose with separated fingers?",
    "asymmetric": "the mesh is asymmetric beyond 0.5 % H in places: landmarks were measured per side (no mirroring); check the L/R "
                  "pairs on the sheets.",
    "non_manifold": "non-manifold edges: fine for LBS, but the inside tests and candidate B's proxy work around them; check the "
                    "flagged regions.",
}
LIGHT_ORDER = {"red": 0, "yellow": 1, "green": 2}


def _fmt(v, nd=4):
    if v is None:
        return "-"
    if isinstance(v, bool):
        return "yes" if v else "no"
    if isinstance(v, float):
        if v == 0:
            return "0"
        return f"{v:.{nd}g}"
    return str(v)


BANNER_TAG = "<!-- rigkit-pipeline: TEST ONLY -->"


def _accepted(c: Ctx) -> dict:
    tav = (((c.state["steps"].get("S3") or {}).get("summary") or {}).get("test_auto_vision")) or {}
    return tav.get("accepted_provisional") or {}


def test_only_marker(path: str, c: Ctx, accepted: dict | None = None) -> str:
    """``TEST_ONLY.md`` next to TEST outputs (the rig folder; the QA sheets): images and npz files cannot carry the label
    themselves. Lists both TEST flags from the state: ``--test-auto-vision`` (``accepted`` = the flagged landmarks kept at their
    provisional positions; default: S3's summary) and the ``--keep-going`` bypasses (review M1)."""
    kg = c.state.get("test_keep_going") or {}
    L = ["# TEST ONLY - not a G2 candidate", ""]
    if c.state.get("test_auto_vision") or accepted:
        acc = _accepted(c) if accepted is None else accepted
        L += [f"`{c.asset}` was built with `scripts/pipeline.py --test-auto-vision`: no Opus vision check ran at S3, and these flagged "
              "landmarks kept their provisional consensus positions (source in brackets):", ""]
        L += [f"- {k} ({(v or {}).get('provisional_source')})" for k, v in sorted(acc.items())] or ["- (none)"]
        L += ["", "Every skeleton, weight, metric, sheet and report in this folder depends on them. Re-run from S3 with a real "
                  "vision check (`--vision-decisions`) before any G2 review.", ""]
    if kg:
        L += [f"`--keep-going` continued past failed checks in {', '.join(kg)}; every later step was built on those outputs:", ""]
        L += [f"- {s}: {m}" for s, ms in kg.items() for m in ms]
        L += ["", f"This stays TEST ONLY until {', '.join(kg)} re-run and pass without `--keep-going` (`--from {next(iter(kg))}`).", ""]
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(L).rstrip("\n") + "\n")
    return path


def sync_test_markers(c: Ctx) -> list:
    """Write ``TEST_ONLY.md`` in the rig folder and in ``qa/`` (when it exists) while the state carries a TEST flag; remove a marker
    the state no longer backs (the steps that used the flag re-ran without it). Returns the markers written."""
    test = c.state.get("test_auto_vision") or c.state.get("test_keep_going")
    out = []
    for path in (c.p("TEST_ONLY.md"), c.p("qa", "TEST_ONLY.md")):
        if test and os.path.isdir(os.path.dirname(path)):
            out.append(test_only_marker(path, c))
        elif not test and os.path.isfile(path):
            os.remove(path)
            c.log(f"removed {path}: no TEST flag left in the state")
    return out


def test_banner(c: Ctx) -> list:
    """The TEST ONLY lines at the top of ``qa_report.md`` (empty when the state carries no TEST flag)."""
    L = []
    if c.state.get("test_auto_vision"):
        L += ["> **TEST ONLY - not a G2 candidate.** This run used `--test-auto-vision`: the flagged landmarks kept their provisional "
              "consensus positions without the Opus vision check. Every number below describes that provisional skeleton.", ""]
    kg = c.state.get("test_keep_going") or {}
    if kg:
        L += [f"> **TEST ONLY - not a G2 candidate.** `--keep-going` continued past failed checks in {', '.join(kg)} (listed under "
              f"remaining defects); later steps were built on those outputs. Re-run from {next(iter(kg))} without `--keep-going`.", ""]
    return ([BANNER_TAG] + L) if L else []


def ensure_report_banner(c: Ctx) -> bool:
    """Put the TEST banner into an existing ``qa_report.md`` that lacks it (a later run of a TEST folder that does not rewrite the
    report). Only inserts lines after the title; returns True when it changed the file."""
    path = c.p("qa_report.md")
    ban = test_banner(c)
    if not ban or not os.path.isfile(path):
        return False
    with open(path, encoding="utf-8") as f:
        lines = f.read().split("\n")
    if BANNER_TAG in lines and all(b in lines for b in ban if b):
        return False
    lines = [ln for ln in lines if ln != BANNER_TAG]
    at = 1 if lines and lines[0].startswith("# ") else 0
    lines[at:at] = [""] + ban if at else ban
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lines))
    return True


def step_table(state: dict) -> str:
    rows = ["| step | what | status | seconds | calls |", "|---|---|---|---|---|"]
    for s in STEPS:
        r = state["steps"].get(s, {})
        if r.get("status") == "running":  # the report is written inside S9: its final table comes from the rewrite after S9
            r = dict(r, status="running (this report)")
        calls = ", ".join(f"{x['name']} {_fmt(x.get('seconds'), 3)} s" + ("" if x.get("exit") == 0 else f" (exit {x.get('exit')})")
                          for x in r.get("calls", []))
        rows.append(f"| {s} | {TITLES[s]} | {r.get('status', 'pending')} | {_fmt(r.get('seconds'), 4)} | {calls or '-'} |")
    return "\n".join(rows)


# ==========================================================================================================================
# vision checkpoint (S3)
# ==========================================================================================================================


def vision_checkpoint(c: Ctx, flags: dict, tiles_info: dict) -> str:
    """Write ``VISION_CHECKPOINT.md``: what the Opus session must do before S4 (references/joint-placement.md step 4)."""
    path = c.p("VISION_CHECKPOINT.md")
    sha = flags.get("inputs_sha256") or {}
    L = [f"# {c.asset}: vision checkpoint (S3)", "",
         f"`flags.json` says `ready_for_user: false`: {flags.get('n_pending')} landmark(s) wait for the Opus vision check "
         f"(tiles before the check: {flags.get('n_tiles')}, vision-only: {flags.get('n_vision_only_tiles')}). The pipeline stopped "
         f"with exit code 3 before S4. Nothing after S3 was built.", "",
         "## What the rig session must do", "",
         "1. Render the crops of every pending tile (front, side and top ortho at the `flags.json` crop, x-ray about 0.25 and solid; "
         "markers a green, b orange, d blue, provisional red; 0.01 H grid; the section polyline through the provisional point):"]
    if tiles_info.get("rendered"):
        L.append(f"   - done by the pipeline with rigkit/render.py's flag modes ({tiles_info.get('path')}): raw shots in "
                 f"`{tiles_info.get('out_dir')}`; sheets:")
        L += [f"     - `{s}`" for s in tiles_info.get("sheets") or []] or ["     - (no composed sheet: `flag_compose` missing or failed)"]
    elif (tiles_info.get("cli") or {}).get("available"):
        L.append(f"   - `rigkit/render.py flag_tiles` exists but failed here ({tiles_info.get('why')}; log `{tiles_info.get('log')}`): "
                 "render the tiles over MCP (`look`, ortho views framed on `tiles[].crop`) or fix the call.")
    else:
        L.append(f"   - `rigkit/render.py` has no `flag_tiles` mode yet ({tiles_info.get('why')}). Render the crops over MCP with "
                 "`look` (mode `angles`, views front / right / top, framed on each tile's `crop.box_min`/`box_max`), or run the "
                 "mode once it exists: `blender -b --factory-startup -P scripts/rigkit/render.py -- flag_tiles --blend "
                 f"{c.blend} --flags {c.p('flags.json')} --out-dir {c.p('_work', 'flag_tiles')}`.")
    L += ["2. Open every crop. Per pending landmark decide `choice` in {a, b, d, mean, escalate} (never a free position), using the "
          "anatomy row of `references/joint-placement.md` and what the crop shows.",
          "3. Write `vision_decisions.json` (`{\"decisions\": {id: record}}`), one full record per landmark:",
          "   - `choice`, `reason` (anatomy row + what the crop shows);",
          "   - `evidence`: `[{path, view, sha256}]` of the crops you opened;",
          f"   - `inputs`: `landmarks_a` = `{sha.get('landmarks_a')}`, `landmarks_d` = `{sha.get('landmarks_d')}`, `mesh` = "
          f"`{sha.get('mesh')}`, and `chosen_pos` = the tile's `choices[id][choice]`;",
          "   - `gates_overridden`: every name in the tile's `required_overrides[id][choice]` (\"a.ratio\" for a ratio_disagree "
          "tile, \"sanity\" to take a sanity-only UniRig position);",
          "   - `reviewer`: `{model: \"claude-opus-5-5\", date, confidence}`.",
          "   Escalate (choice `escalate`) only what the crops cannot settle; escalated tiles go to the user's flag sheet "
          "(at most 6 tiles).",
          "4. Re-run the same pipeline command with `--vision-decisions <path to vision_decisions.json>`; it resumes at S3 "
          "(earlier S3 outputs move to `_superseded/`).", "",
          "## Pending tiles", "",
          "| # | tile | flag | ids | why (auto) | impact | provisional | choices | required overrides |",
          "|---|---|---|---|---|---|---|---|---|"]
    for t in flags.get("tiles", []):
        if t.get("status") != "pending":
            continue
        why = "; ".join(f"{k}: {str(v)[:160]}" for k, v in (t.get("reasons") or {}).items())
        prov = ", ".join(f"{k}={v}" for k, v in (t.get("provisional_source") or {}).items())
        ch = "; ".join(f"{k}: {', '.join(sorted(v))}" for k, v in (t.get("choices") or {}).items())
        ro = "; ".join(f"{k}: " + ", ".join(f"{cc}={'+'.join(g) or '-'}" for cc, g in v.items())
                       for k, v in (t.get("required_overrides") or {}).items())
        L.append(f"| {t.get('tile')} | {t.get('key')} | {t.get('flag')} | {', '.join(t.get('ids', []))} | {why} | "
                 f"{_fmt(t.get('impact'), 3)} | {prov} | {ch} | {ro or '-'} |")
    rej = (flags.get("vision") or {}).get("rejected") or {}
    stale = (flags.get("vision") or {}).get("stale") or {}
    if rej or stale:
        L += ["", "## Decisions not applied", ""]
        L += [f"- rejected `{k}`: {'; '.join(v)}" for k, v in rej.items()]
        L += [f"- stale `{k}`: {json.dumps(v)[:300]}" for k, v in stale.items()]
    L += ["", f"Files: `{c.p('flags.json')}`, `{c.p('landmarks.json')}`, sources `{c.p('_work', 'landmarks', 'landmarks_a.json')}` (a) "
              f"and `{c.p('_work', 'unirig', 'landmarks_d.json')}` (d).",
          "", "TEST runs only: `--test-auto-vision` skips this checkpoint and keeps the provisional positions (never for G2)."]
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(L) + "\n")
    return path


# ==========================================================================================================================
# qa_report.md (S9)
# ==========================================================================================================================


def _thresholds() -> dict:
    doc = read_json(THRESHOLDS) or {}
    rows = (doc.get("rows") or []) + (doc.get("garment_rows") or [])  # phase G rows live in their own list (G2)
    return {r["id"]: r for r in rows if isinstance(r, dict) and "id" in r}


def _band(row: dict | None) -> str:
    if not row:
        return "-"
    g, r = row.get("green"), row.get("red")
    unit = row.get("unit", "")
    rel = " x H" if row.get("relative_to_H") else ""

    def rng(b):
        if not b:
            return "-"
        lo, hi = b
        if lo is None:
            return f"<= {_fmt(hi)}"
        if hi is None:
            return f">= {_fmt(lo)}"
        return f"{_fmt(lo)}..{_fmt(hi)}"

    if g == r:
        return f"pass/fail: {rng(g)} ({unit}{rel})"
    return f"green {rng(g)}, red outside {rng(r)} ({unit}{rel})"


def _at(d: dict) -> str:
    at = d.get("at") or {}
    bits = [str(at.get(k)) for k in ("pose", "region", "bone") if at.get(k)]
    return " / ".join(bits)


def light_value(key: str, d: dict, H: float) -> str:
    """Main number(s) of a light from metrics.json ``summary.lights_detail[key]``."""
    if not isinstance(d, dict):
        return "-"
    if key == "deform_torn_edges_standard":
        return f"{d.get('max_torn_edges')} torn edges @ {_at(d)}"
    if key == "deform_torn_edges_extreme":
        return f"{_fmt(d.get('max_region_fraction'))} of a region ({d.get('n_torn')} edges) @ {_at(d)}"
    if key == "deform_area_change":
        return f"{_fmt(d.get('max_area_fraction'))} area fraction @ {_at(d)}"
    if key == "deform_joint_volume":
        nm = f"; not measurable: {list(d['not_measurable'])}" if d.get("not_measurable") else ""
        return (f"min ratio {_fmt(d.get('min_ratio'))} ({d.get('joint')}, {d.get('pose')}); max {_fmt(d.get('max_ratio'))} "
                f"({d.get('max_joint')}, {d.get('max_pose')})" + nm)
    if key == "deform_candy_wrapper":
        cap = d.get("capped_at_yellow")
        return (f"min section ratio {_fmt(d.get('min_ratio'))} ({d.get('side')}, {d.get('pose')}, slice {d.get('slice')})"
                + (f"; capped at yellow: {cap}" if cap else ""))
    if key == "deform_penetration_standard":
        p = d.get("pair") or {}
        return (f"{d.get('max_faces')} faces @ {_at(d)}" + (f"; {p.get('intruder')} into {p.get('into')} "
                                                            f"{_fmt((p.get('depth') or 0) * 1000, 3)} mm" if p else ""))
    if key == "deform_penetration_extreme_depth":
        dep = d.get("max_depth_m") or 0.0
        p = d.get("pair") or {}
        return (f"{_fmt(dep * 1000, 3)} mm ({_fmt(dep / H * 100, 3)} % H) @ {_at(d)}"
                + (f"; {p.get('intruder')} into {p.get('into')}" if p else ""))
    if key == "deform_seam_crack":
        return f"{_fmt(d.get('max_m'))} m"
    if key == "deform_ground_contact":
        return f"worst {_fmt(d.get('worst_mm'), 3)} mm ({d.get('side')}, {d.get('pose')})"
    if key == "joint_core_heads_inside":
        return f"{_fmt((d.get('max_outside_m') or 0) * 1000, 3)} mm outside @ {_at(d)}"
    if key == "weights_limb_leak":
        rows = d.get("rows", d.get("value"))
        return f"{rows} rows" + (f" (by region {json.dumps(d.get('by_region'))[:160]})" if d.get("by_region") else "")
    return json.dumps(d)[:220]


GARMENT_LIGHT_KEYS = ("garment_limb_penetration", "garment_layer_penetration", "garment_hem_stretch", "garment_torn_edges",
                      "garment_bleed", "garment_chain_coverage")


def garment_light_value(key: str, d: dict) -> str:
    """Main number(s) of a ``garment_*`` light (metrics.json ``summary.lights_detail``)."""
    if not isinstance(d, dict):
        return "-"
    if key == "garment_hem_stretch":
        return f"min {_fmt(d.get('min'))} ({d.get('min_piece')}), max {_fmt(d.get('max'))} ({d.get('max_piece')})"
    if key == "garment_bleed":
        return f"{d.get('rows')} rows"
    if key == "garment_chain_coverage":
        return f"min {d.get('min_rows')} rows ({d.get('bone')})"
    bits = [f"{k} {v}" for k, v in d.items() if isinstance(v, (int, float, str)) and k != "definition"]
    return "; ".join(bits)[:220] or json.dumps(d)[:220]


def garment_section(c: Ctx, sm: dict, lights: dict, det: dict, th: dict, met: dict, s9: dict) -> tuple:
    """``## Garments (S3g)`` of qa_report.md (phase G) and the G2 questions it raises: pieces, classes, confidence, chains and bones
    vs the aux budget, flagged pieces, crossings, the ``garment_*`` lights, the overlay checks and where the spring hints are."""
    s3g = sm.get("S3g") or {}
    if not s3g or s3g.get("skipped"):
        why = s3g.get("why") if s3g else "S3g did not run"
        return ["## Garments (S3g)", "", f"- {why}", ""], []
    q = []
    cov = s3g.get("coverage") or {}
    L = ["## Garments (S3g)", "",
         f"- Plan: `{s3g.get('garments')}` + `{s3g.get('chains_json')}`; override `--garments`: {s3g.get('override') or 'none'}",
         f"- Spring hints (VRMC_springBone field names, leg/torso colliders, min skirt-to-leg distance per chain): "
         f"`{s3g.get('spring_hints')}` (never in the GLB in this phase)",
         f"- Free rows below the crotch on chained pieces: {cov.get('in_chained_piece')}/{cov.get('free_below_crotch')}", "",
         "| piece | class | confidence | welded rows | layer | side | parent | length m | free length m | chains | bones |",
         "|---|---|---|---|---|---|---|---|---|---|---|"]
    for p in s3g.get("pieces") or []:
        L.append(f"| {p['id']} | {p.get('class')} | {_fmt(p.get('confidence'), 2)} | {p.get('n_welded')} | {p.get('layer')} | "
                 f"{p.get('side') or '-'} | {p.get('parent')} | {_fmt(p.get('length_m'), 3)} | {_fmt(p.get('free_length_m'), 3)} | "
                 f"{', '.join(p.get('chains') or []) or '-'} | {p.get('bones')} |")
    b = s3g.get("budget") or {}
    trims = ", ".join(f"{t.get('trim')} {t.get('piece')}" + (f" (from {t.get('from')})" if t.get("from") else "")
                      for t in b.get("trims") or [])
    L += ["", f"- Chain bones: {b.get('used')} / aux budget {b.get('aux_budget')}; trims: {trims or 'none'}"]
    L.append("- Chains: " + (", ".join(f"`{x['id']}` ({x['class']}, {x['bones']} bones, parent {x.get('parent')}"
                                       + (", leg push" if x.get("leg_push") else "") + ")" for x in s3g.get("chains") or []) or "none"))
    for f in s3g.get("flags") or []:
        q.append(f"garment piece `{f.get('piece')}`: {f.get('why')} (garment sheet; correct with --garments)")
    for x in s3g.get("crossing") or []:
        q.append(f"garment piece `{x.get('piece')}`: chains crossed and were reordered ({len(x.get('fixed') or [])} joint fix(es)); "
                 "check the chain lines on the garment sheet")
    for a in s3g.get("asymmetry") or []:
        L.append(f"- Asymmetry (reported, not mirrored): `{a.get('chain')}`" + (f" vs `{a.get('partner')}`" if a.get("partner") else "")
                 + f": {a.get('why')}" + (f" ({_fmt(a.get('max_dev_H'), 3)} H)" if a.get("max_dev_H") is not None else ""))
    s4, s5, s7 = sm.get("S4") or {}, sm.get("S5") or {}, sm.get("S7") or {}
    if s4.get("chains"):
        L.append(f"- S4: {s4['chains'].get('n_bones')} chain bones in {s4['chains'].get('n_chains')} chains; root bend tests "
                 f"{s4['chains'].get('root_bend_tests')}; core bend tests {s4.get('core_bend_tests')}")
    if s5.get("chains"):
        L.append(f"- S5: leg push on {s5['chains'].get('pushed')} chain root(s), {s5['chains'].get('skipped')} without; drape helpers "
                 f"{s5['chains'].get('draped')}")
    g7 = s7.get("garment") or {}
    if g7:
        chk = g7.get("check") or {}
        L.append(f"- Overlay (S7, after the body selection): {g7.get('rows_overlay')} rows, transition band {g7.get('rows_band')} rows; "
                 f"row sums {_fmt(chk.get('sum_err_max'))}, max influences {chk.get('max_influences')}, bleed rows "
                 f"{chk.get('garment_bleed_rows')}, leg weight on hanging rows {_fmt(chk.get('leg_weight_on_hanging_max'))}, inner = outer "
                 f"{_fmt(chk.get('inner_outer_diff_max'))}, limb-leak rows {g7.get('limb_leak_rows')}")
    gs = (met.get("summary") or {}).get("garments") or {}
    if gs.get("chain_regions_not_exercised"):
        L.append("- Chain regions the body poses never turn (left out of 'not exercised'; the chain poses test them): "
                 + ", ".join(gs["chain_regions_not_exercised"]))
    L += ["", "| garment metric | light | value | band |", "|---|---|---|---|"]
    for k in GARMENT_LIGHT_KEYS:
        if k in lights:
            L.append(f"| {k} | **{lights[k]}** | {garment_light_value(k, det.get(k))} | {_band(th.get(k))} |")
        else:
            L.append(f"| {k} | not measured | - | {_band(th.get(k))} |")
    pieces = gs.get("pieces") or {}
    if pieces:
        L += ["", "| piece | garment metrics (metrics.json summary.garments.pieces) |", "|---|---|"]
        for pid, v in pieces.items():
            L.append(f"| {pid} | {json.dumps(v)[:300]} |")
    r9 = (s9 or {}).get("render") or {}
    L += ["", f"- Garment sheet: `{r9.get('garment_sheet')}`; cloth pose sheets: "
              + (", ".join(f"`{x}`" for x in r9.get("cloth_sheets") or []) or "none"), ""]
    bad = [k for k in GARMENT_LIGHT_KEYS if lights.get(k) in ("red", "yellow")]
    if bad:
        q.append("garment lights " + ", ".join(f"`{k}` {lights[k]}" for k in bad) + ": accept as the pre-bake state (the R8 cloth "
                 "bake or a spring runtime moves the chains), or fix the plan (--garments) or the overlay?")
    return L, q


def qa_report(c: Ctx, s9: dict) -> str:
    """Write ``qa_report.md`` (draft) from the state summaries and the files of S1-S9. Returns its path."""
    st = c.state["steps"]
    sm = {s: (st.get(s) or {}).get("summary") or {} for s in STEPS}
    th = _thresholds()
    met = read_json(c.p("checks", "metrics", "metrics.json")) or {}
    lights = met.get("lights") or {}
    det = (met.get("summary") or {}).get("lights_detail") or {}
    test = bool(c.state.get("test_auto_vision"))
    sess = read_json(c.p("session.json")) or {}
    rec = read_json(c.p("rig_recipe.json")) or {}
    kg = c.state.get("test_keep_going") or {}
    L = [f"# {c.asset} - rig QA report (DRAFT, scripts/pipeline.py)", ""] + test_banner(c)
    if c.args.keep_going and not kg:
        L += ["> `--keep-going` was given, but no check failed: nothing was continued past a failure.", ""]
    L += [f"- Asset `{c.asset}`, family `{c.family}` (template {((rec.get('template') or {}).get('version'))}), H = {c.H} m, "
          f"scale factor {_fmt((rec.get('scale') or {}).get('factor'), 9)}",
          f"- Source GLB `{c.glb}` sha256 `{sess.get('glb', {}).get('sha256')}`",
          f"- Scripts: git HEAD `{(rec.get('scripts') or {}).get('git_head')}`, dirty {(rec.get('scripts') or {}).get('dirty')} "
          "(the skill folder is untracked during P3); per step the sha256 of every script it ran, its arguments and input files "
          "are in `rig_recipe.json` (`pipeline.steps.<Sx>.inputs`, every run's argv in `pipeline.runs`)",
          f"- Rig: `{c.blend}`; recipe `{c.recipe_path}`; final weights `{c.p('weights.npz')}`", "",
          "## Steps", "", step_table(c.state), ""]
    # ---- S1 / S3 / S4 / S5
    s1, s3, s4, s5 = sm["S1"], sm["S3"], sm["S4"], sm["S5"]
    L += ["## Input and skeleton", "",
          f"- S1 analysis: {s1.get('n_vertices')} vertices ({s1.get('n_welded')} welded), {s1.get('n_islands')} islands, "
          f"boundary edges {s1.get('boundary_edges')}, pose {s1.get('pose_kind')} (arm angles {s1.get('arm_angle_deg')} deg, "
          f"fingers {s1.get('fingers')}), flags: {', '.join(s1.get('flags') or []) or 'none'}",
          f"- S3 landmarks: {s3.get('n_landmarks')} landmarks; tiles before the vision check {s3.get('n_tiles')} "
          f"(+{s3.get('n_vision_only_tiles')} vision-only); pending {s3.get('n_pending')}, escalated {s3.get('n_escalated')}, "
          f"ready_for_user {s3.get('ready_for_user')}; vision decisions applied: "
          f"{', '.join((s3.get('vision') or {}).get('applied') or []) or 'none'}"]
    if s3.get("test_auto_vision"):
        acc = s3["test_auto_vision"].get("accepted_provisional") or {}
        L.append(f"- **TEST:** provisional positions accepted for {len(acc)} landmark(s): " +
                 ", ".join(f"{k} ({v.get('provisional_source')})" for k, v in sorted(acc.items())))
    ch = s4.get("prebend") or []
    ft = s5.get("functest") or {}
    poles = ", ".join(f"{k} {_fmt(v.get('angle_deg'), 4)} deg" for k, v in (s5.get("pole_angles") or {}).items())
    L += [f"- S4 skeleton: {s4.get('bones')} bones, bend tests {s4.get('bend_tests')}, roll flips {s4.get('flipped')}, "
          f"core heads outside the mesh: {s4.get('core_outside_not_exempt') or 'none'}; pre-bend (row `joint_prebend_elbow_knee`, "
          f"{_band(th.get('joint_prebend_elbow_knee'))}): " +
          ", ".join(f"{x['chain']} {_fmt(x.get('after_deg'), 3)} deg ({x.get('action')})" for x in ch),
          f"- S5 control rig: pole angles {poles}; function tests {ft.get('passed')}/{ft.get('total')} (extra "
          f"{ft.get('extra_passed')}/{ft.get('extra_total')}, mode {ft.get('mode')}); failed: "
          f"{(ft.get('failed') or []) + (ft.get('extra_failed') or []) or 'none'}",
          ""]
    # ---- skin
    s6, s7 = sm["S6"], sm["S7"]
    L += ["## Skin", "", f"- Rules: {((s6.get('rules') or {}).get('kind'))}", "",
          "| candidate | seconds | limb-leak rows (finish) | sum err | max infl. |", "|---|---|---|---|---|"]
    for k, v in (s6.get("candidates") or {}).items():
        inv = v.get("invariants") or {}
        L.append(f"| {k} | {_fmt(v.get('seconds'), 3)} | {v.get('limb_leak_rows')} | {_fmt(inv.get('sum_err_max'))} | "
                 f"{inv.get('max_influences')} |")
    sel = s7.get("selection") or {}
    dec = s7.get("region_decisions") or {}
    L += ["", f"Selection (S7, scored on {(s7.get('scoring') or {}).get('poses')} ROM poses; keys scored: "
              f"{', '.join((s7.get('scoring') or {}).get('candidates_scored') or [])}; default {sel.get('default')}; "
              f"vertices per candidate {sel.get('vertices_per_candidate')}):", "",
          "| region | chosen | decided by (metrics) | winner (metrics) | flag G2 |", "|---|---|---|---|---|"]
    regions = sorted(set(sel.get("choice") or {}) | set(dec))
    flagged_regions = {f.get("region"): f.get("reason") for f in (sel.get("flag_g2") or [])}
    for r in regions:
        d = dec.get(r) or {}
        L.append(f"| {r} | {(sel.get('choice') or {}).get(r, sel.get('default'))} | {d.get('decided_by', '-')} | {d.get('winner', '-')} | "
                 f"{flagged_regions.get(r, '') or ('metrics' if d.get('flag_g2') else '')} |")
    fin = s7.get("finish") or {}
    L += ["", f"- Finish (profiles + enforce to a fixed point on every row): change {_fmt(fin.get('change_max'))} "
              f"(fixed point {fin.get('fixed_point')}), rounds {fin.get('rounds')}, invariants {fin.get('invariants')}, "
              f"limb-leak rows {fin.get('limb_leak_rows')}",
          f"- Limb-leak gate dropped: {sel.get('leak_dropped') or 'none'}; unmatched score keys: {sel.get('unmatched_score_keys')}", ""]
    # ---- lights
    L += ["## Deformation (final weights, runtime emulation)", "",
          f"{met.get('summary', {}).get('n_poses')} poses; thresholds are proposals from `solvers/thresholds.json` "
          "(RIG_SKILL_WORKFLOW.md §4) until P5 calibrates them.", "",
          "| metric | light | value | band |", "|---|---|---|---|"]
    for k in sorted(lights, key=lambda x: (LIGHT_ORDER.get(lights[x], 3), x)):
        L.append(f"| {k} | **{lights[k]}** | {light_value(k, det.get(k), c.H)} | {_band(th.get(k))} |")
    ne = (met.get("summary") or {}).get("not_exercised") or []
    L += ["", f"- Regions not exercised by any pose: {ne or 'none'}", ""]
    gL, gq = garment_section(c, sm, lights, det, th, met, s9)  # phase G
    L += gL
    # ---- S8
    s8 = sm["S8"]
    par = s8.get("parity") or {}
    L += ["## Export and runtime parity (S8)", "",
          f"- Validation A1: {(s8.get('A1') or {}).get('passed')}/{(s8.get('A1') or {}).get('checks')} passed; failed "
          f"{(s8.get('A1') or {}).get('failed') or 'none'}; extras {(s8.get('extra') or {}).get('passed')}/"
          f"{(s8.get('extra') or {}).get('checks')} (failed {(s8.get('extra') or {}).get('failed') or 'none'}); errors "
          f"{s8.get('errors') or 'none'}",
          f"- Test GLB `{s8.get('test_glb')}` sha256 `{s8.get('test_glb_sha256')}`",
          f"- Clean-reimport parity: max {_fmt(par.get('max_m'))} m vs tolerance {_fmt(par.get('tolerance_m'))} m "
          f"(row `runtime_reimport_parity`) over {par.get('n_poses')} poses: pass {par.get('pass')}; unmatched GLB vertices "
          f"{par.get('unmatched_glb_vertices')}; welded ids covered {par.get('welded_covered')}; emulated weights = exporter rule: "
          f"{par.get('weights_check_ok')}", ""]
    # ---- S9
    r9 = (s9 or {}).get("render") or {}
    L += ["## QA sheets (S9)", "",
          f"- {len(r9.get('sheets') or [])} sheets in `{c.p('qa')}` ({r9.get('n_jobs')} shots in {r9.get('chunks')} chunks, longest "
          f"chunk {_fmt(r9.get('max_chunk_seconds'), 3)} s); pose sheets for {len(r9.get('pose_subset') or [])} poses (rest, compound, "
          "left/centre extremes); flag sheet: " + f"`{r9.get('flag_sheet')}`", ""]
    # ---- defects / questions / not checked
    L += ["## Remaining defects (measured)", ""]
    bad = [k for k in lights if lights[k] in ("red", "yellow")]
    for k in sorted(bad, key=lambda x: (LIGHT_ORDER.get(lights[x], 3), x)):
        L.append(f"- {lights[k]}: `{k}` - {light_value(k, det.get(k), c.H)}")
    for s in STEPS:
        for w in (sm[s].get("warnings") or []):
            L.append(f"- {s}: {w}")
    if not bad:
        L.append("- none red or yellow")
    L += ["", "## Open questions for G2 (the user decides)", ""]
    q = []
    if test:
        q.append("TEST run: landmarks were not vision-checked; re-run S3 with a real vision check before any G2 review.")
    if kg:
        q.append(f"TEST run: `--keep-going` continued past failed checks in {', '.join(kg)}; fix them and re-run from "
                 f"{next(iter(kg))} without `--keep-going` before any G2 review.")
    for t in s3.get("user_tiles") or []:
        q.append(f"escalated landmark tile `{t}` (user flag sheet).")
    for r, why in flagged_regions.items():
        q.append(f"skin region `{r}`: {why}")
    if ne:
        q.append(f"regions not exercised by the ROM poses (kept on the rule-based candidate): {', '.join(ne)}")
    if bad:
        q.append("red / yellow lights (see the flag sheet): " + ", ".join(f"`{k}` {lights[k]}" for k in
                 sorted(bad, key=lambda x: (LIGHT_ORDER.get(lights[x], 3), x))) + " - acceptable at game distance, or a targeted fix "
                 "(joint position -> S3/S4, weights -> S6, pole or reach -> S5) with before/after numbers?")
    q += gq
    for f in (s1.get("flags") or []):
        code = f.split(":", 1)[-1]
        if f.startswith("warn:") and code in S1_QUESTIONS:
            q.append(f"S1 `{code}`: {S1_QUESTIONS[code]}")
    L += [f"{i + 1}. {x}" for i, x in enumerate(q)] or ["- none"]
    L += ["", "## Not checked", "",
          "- three.js parity on WebGL and WebGPU (row `runtime_threejs_parity`, optional);",
          "- GUI playback and any user edit (no `weights_override.json` / `landmarks_override.json` unless listed above);",
          "- clips, bake and release export (R8, `blender-game-animation`);",
          "- the brief's aux bones that S3g does not plan (mitten hands, sacks, special aux); garment chains come from S3g "
          "(section Garments), their motion from the R8 cloth bake or a runtime spring;",
          "- UniRig bias calibration and every threshold (P5)." + (" The vision check of the landmarks (TEST run)." if test else ""),
          "", f"Evidence: `{c.p('checks')}`, `{c.p('qa')}`, `{c.p('pipeline_state.json')}`, `{c.p('rig.log')}`.", ""]
    path = c.p("qa_report.md")
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(L) + "\n")
    return path
