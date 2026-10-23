---
name: blender-mcp-rigging
description: Rig a supplied character mesh (body only, no face) in a live Blender through the Blender MCP server. Joints are placed by consensus of several sources, the runtime and control skeletons are built from a family template, and skin weights are chosen by measurement. Deformation QA emulates the glTF/three.js runtime (LBS, 4 influences), and every build is reproducible from a recipe. Stops at the user's G2 review.
---

# Blender MCP rigging (body, no face)

Use this for R2–R5 of `ashlar/3d/rig-anim/Agent.md`: skeleton, skin, automatic checks and QA images for a hero, monster or NPC
whose rig brief passed G1.

Not for:
- facial rigs;
- clips, bake or export of animation: use `.agents/skills/blender-game-animation`;
- engine wiring: use `.agents/skills/game-animation-integration`.

The project frame lives in `ashlar/3d/rig-anim/`:
- `Agent.md`: gates G1–G4, paths, roles;
- `SKELETON_STANDARD.md`: families, bone names, sockets;
- `QA_CHECKLIST.md`: A1/A2;
- `RIG_SKILL_WORKFLOW.md`: the spec of this skill and the threshold table in §4.

This skill says *how* to work in Blender. If it contradicts those files, stop and ask the user. Rigging runs in an Opus 5.5 session.
Shared scripts are written by Sonnet and reviewed by Opus (`Agent.md` at the repo root).

## Non-negotiables

1. **QA emulates the runtime.**
   - Measure on a mesh evaluated with the Armature modifier only: Preserve Volume off, `bbone_segments = 1`, no corrective
     modifiers.
   - Cut weights to the top 4, then normalize, exactly as the glTF exporter does.
   - DQS, B-Bones, constraints and drivers never reach the game.
2. **Fix bad input, do not rig around it.** Arms fused to the torso, legs fused together, or fingers fused when the brief needs
   fingers: stop at S1 and propose a new T-pose.
3. **Automatic results are starting points.** Each landmark needs two or more sources. Each weight set needs two or more candidates
   compared on measurements.
4. **MCP inspects; scripts change.**
   - Every edit goes through a versioned function with parameters logged in `rig_recipe.json`.
   - Inline `execute_blender_code` is for reading only.
   - Calls must stay under 20 s. Dense math runs in `E:\tools\rigkit-env`, never in Blender's numpy (references/mcp-operations.md).
5. **Re-assert constraints after every smoothing pass**: side gate, per-region bone lists, top-4, normalize, identical weights on
   co-located vertices.
6. **Compute weights on seam-welded topology** and copy them to every duplicate vertex.
7. **Measure symmetry before mirroring.** Mirror by position (KD-tree), never by topology.
8. **Keep two skeleton layers.** The runtime layer holds deform bones and sockets only, with standard names. The control layer
   holds `ctl_*` bones. The runtime follows the control layer through Copy Transforms.
9. **Every fix records numbers before and after, plus a snapshot.** Never overwrite earlier evidence.
10. **Never pass a gate yourself.** Produce the evidence for G2; the user decides.

## Tools

| Tool | Use |
| --- | --- |
| Blender MCP (`blender` in `.mcp.json`, blender-mcp 2.0.0, addon protocol 14) | `get_addon_status`, `get_scene_info`, `execute_blender_code`, `look`, `viewport_capture`, `viewport_pick` |
| `blender -b --factory-startup -P <script> -- <args>` | long Blender jobs: render sheets, ROM export, rebuilds |
| `E:\tools\rigkit-env\Scripts\python.exe -I` | numpy, scipy, libigl, trimesh: solvers and metrics. Data goes through `.npz` files |
| `E:\tools\unirig` | UniRig skeleton and skin, about 90 s per mesh: a second opinion, never the final answer. See `E:\tools\unirig\INSTALL_NOTES.md` |
| `families/<F>.json` | bone template per skeleton family (schema in `families/README.md`) |

Blender: `E:\SteamLibrary\steamapps\common\Blender\blender.exe` (5.2.2 LTS). Start it minimized. Commands are in
references/mcp-operations.md.

**Scripts (built in P3, 2026-10-23).** One driver runs the whole procedure. Every step is resumable and logged in
`rig_recipe.json`:

```text
E:\tools\rigkit-env\Scripts\python.exe -I -B scripts\pipeline.py --asset <id> --glb <glb> --family H|S --height <m> --out <dir>
    [--from Sx] [--until Sy] [--vision-decisions <json>] [--skin-rules <json>] [--garments <json>]
```

Exit codes:
- 0 done;
- 1 step failed (the step name and log path are printed), or the resume was refused because a done step's inputs changed since it
  ran (arguments, input files such as skin rules or vision decisions, or the scripts it runs): the stale steps and the `--from` to
  use are printed; nothing is rebuilt on its own;
- 2 usage;
- 3 **vision checkpoint**: render and inspect the tiles, write `vision_decisions.json`, re-run with `--vision-decisions`;
- 4 UniRig output missing: run `solvers/unirig_bridge.py run`, one at a time;
- 5 the input blocks the rig (S1 stop).

`--test-auto-vision` and `--keep-going` are TEST ONLY and mark every output as such, on every later run of the folder too, until
the steps that used them re-run without them. `--keep-going` continues past failed S4/S5 checks only, never past a crash. Never
hand a TEST ONLY rig to G2.

Modules by layer:
- `scripts/rigcore`: shared formats and templates.
- `scripts/rigkit`: inside Blender (intake, skeleton, control, functest, export, state, skin_io, poses, render incl. `flag_tiles`,
  parity).
- `scripts/solvers`: rigkit-env (analysis, landmarks, UniRig bridge, consensus, skin candidates and selection, metrics,
  thresholds).

Data formats and ownership are in `scripts/CONTRACT.md`.

**The Opus session still does by hand:**
- the S3 vision decisions;
- the asset's skin rules (rigid islands, region lists) passed with `--skin-rules`;
- the brief's extra bones that S3g does not plan (mitten hands, special aux). Check the S3g garment plan on its sheet
  (`qa_garment_sheet.jpg`, flagged pieces in `qa_report.md`) and correct it with `--garments`; rules in
  references/cloth-and-attachments.md;
- targeted fixes of red lights, with before/after numbers;
- the final `qa_report.md` and the G2 hand-off.

D01's `ashlar/3d/monsters/D01_hodling/rig/tools/` stays the reference for the legacy profile (`S_legacy_D01`).

## Procedure

```text
S0 open → S1 analyse mesh → S2 normalize → S3 landmarks (consensus) → S3g garments + chain plan → S4 runtime skeleton
→ S5 control rig → S6 skin (candidates A/B/C + garment overlay) → S7 ROM + metrics ⟲ back to S6 or S3 → S8 test export
+ runtime parity → S9 package ──G2
```

Run from G1 straight to G2. Stop only at the stop points marked below.

| Step | Do | Read |
| --- | --- | --- |
| S0 | Check `git status`; `get_addon_status`; open the source file, or import the original GLB read-only and check its sha256; inventory existing rigs, Actions and constraints; write `session.json` | mcp-operations |
| S1 | Measure on a copy: islands after seam weld, non-manifold edges, symmetry plane, T/A angle, limb gaps, finger separation, rigid islands, cloth bridging the legs, facing direction from geometry. Write `analysis.json` and colored region shots. **Stop** if the input blocks the rig | mesh-intake |
| S2 | Scale uniformly to the catalogue height, feet at z = 0, apply transforms, parent the mesh to the armature; log the factor | mesh-intake |
| S3 | Landmarks from (a) geometry, (b) a watertight proxy, (c) anatomical priors, (d) UniRig, (e) the user. Fuse sources that agree within 1% H; flag the rest with ortho shots and decide with reasons; queue anything still unclear for the round's flag sheet. Write `landmarks.json` | joint-placement |
| S3g | Classify long clothing and hanging items: skirt, strip, cape, cluster, sleeve, hair, rigid_hanging. Plan the chain bones within the aux budget (names, parents, joints on each piece's medial curve) and write `garments.json` and `chains.json`. Low-confidence pieces go to the G2 sheet; `--garments` overrides the plan | cloth-and-attachments |
| S4 | Build the runtime skeleton from `families/<F>.json` plus the planned chains: rolls from hinge normals with a positive-X bend test, elbow/knee pre-bend 4–10°, twist bones, sockets. Check heads inside the mesh, one `root` at the origin, unit scale, `inherit_scale = FULL` | joint-placement, blender-5.2-api |
| S5 | Build the control rig (`ctl_*`, IK/FK, poles found by sweep, foot roll, `ctl_root`/`ctl_cog`); the runtime follows by Copy Transforms; run the function tests | joint-placement |
| S6 | Rigid islands get 1.0. Generate candidates A (region + distance), B (proxy + transfer + inpaint) and C (UniRig, remapped). Enforce constraints, apply the profiles per joint, choose per region by S7 numbers, then apply the user override layer | skinning |
| S7 | ROM poses per family, metrics in rigkit-env, viewport shots via MCP (front, side, 3/4, ARPG top-down), weight and stretch maps. Red → fix with targeted changes and log before/after | deformation-qa |
| S8 | Test GLB with fixed exporter args; A1.1–A1.14; check for orphan groups and leaf bones; clean reimport from a fresh folder; compare sampled ROM poses; optionally check three.js parity in the lab | export-runtime |
| S9 | Write `rig_recipe.json`, `landmarks.json`, `analysis.json`, `validation.json`, `qa/`, `qa_report.md` (numbers, remaining defects, aesthetic questions for G2) and `rig.log`, plus a snapshot. Hand over to the user for G2 | — |

## Outputs (inside `<asset_dir>/rig/`, per `Agent.md` §5)

| File | Content |
| --- | --- |
| `<asset_id>_rig.blend` | mesh, control rig, runtime skeleton; no Actions |
| `rig_recipe.json` | input hash; family template and script versions; landmark sources; parameters; override layers. The `.blend` must be rebuildable from GLB + recipe |
| `weights_override.json`, `landmarks_override.json` | the user's GUI edits, keyed by welded vertex position or by landmark id |
| `validation.json`, `checks/`, `qa/`, `qa_report.md`, `rig.log`, `_snapshots/` | evidence |

## Reporting

- State the measured numbers against the thresholds in `RIG_SKILL_WORKFLOW.md` §4.
- List every remaining defect, and say which ones are aesthetic questions for G2.
- Say what was not checked, for example WebGPU parity or GUI playback.
- After each asset, append new failure modes to references/failure-catalog.md and a line to "Ghi chú từng lần chạy" in `Agent.md`.
