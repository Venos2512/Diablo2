# rigkit contract (P3, schema 0)

Read this before writing any code under `scripts/`. It fixes the package layout, file ownership, data formats and test rules, so
that several writers can work in parallel. Change it only through the orchestrator. If you need a change, write it in your final
report; do not edit another owner's file.

The spec is in `ashlar/3d/rig-anim/RIG_SKILL_WORKFLOW.md` and the skill text in `../SKILL.md` + `../references/*.md`. The reference
implementation is D01's `ashlar/3d/act-01/monsters/D01_hodling/rig/tools/` (read its README and `qa_report.md`).

## Hard rules for every writer

- **Read-only:** everything under `ashlar/` (D01 G2 files, GLBs, rig folders) and `E:\tools\unirig\`. Never write into an asset folder.
- **Write only:**
  - your owned files below;
  - your tests under `scripts/tests/<package>/`;
  - scratch output under `E:\tmp_rigkit\<your-tag>\`.

  Other threads share this checkout: before you finish, check `git status` on your paths only. Do not commit.
- **Blender:** headless only, `E:\SteamLibrary\steamapps\common\Blender\blender.exe -b --factory-startup -P <module>.py -- <args>`.
  Do not use the Blender MCP tools or a GUI Blender; the orchestrator owns those.
- **Solver Python:** `E:\tools\rigkit-env\Scripts\python.exe -I` (Python 3.11: numpy 2.4, scipy 1.17, libigl 2.6.3, trimesh 5.1,
  pytest, Pillow). Do not install packages into Blender's Python.
- **Never do dense linear algebra in Blender.** Its numpy has no fast BLAS (1000² matmul = 2.2 s). Blender exports arrays to `.npz`,
  the solvers compute, and Blender loads the result.
- **GPU:** only the A2 writer runs UniRig (one run at a time, about 10 GiB VRAM). Others read the existing outputs in
  `E:\tmp_unirig\out\<asset>\`.
- **Temp files and caches go on E:.** C: is nearly full.
- **Style:** match the surrounding code. Small modules, docstrings that state units and frames, no hidden env-var switches (D01's
  sack bug came from one). Every runnable module has `if __name__ == "__main__":` with `argparse` and a 3-line bootstrap that puts
  `scripts/` on `sys.path`, so it runs with `-I`:

  ```python
  import os, sys
  sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
  ```

## Packages and ownership

```text
scripts/
├─ CONTRACT.md                 orchestrator
├─ rigcore/                    pure Python + numpy only (no bpy, no scipy). Imported by BOTH Blender and rigkit-env
│  ├─ __init__.py              R0
│  ├─ schema.py                R0  npz/json key names, dtypes, validators, schema versions
│  ├─ npzio.py                 R0  save/load mesh.npz, weights.npz, poses.npz with validation
│  ├─ mesh.py                  R0  weld map, welded faces, unique edges, CSR adjacency (numpy), connected components
│  ├─ geom.py                  R0  lerp, on_line, bend_normal, roll_z_vector (as d01_rig_def.roll_z), angle helpers
│  ├─ template.py              R0  load family JSON (+extends), expand {S}, evaluate point/hinge expressions → resolved skeleton dict
│  └─ recipe.py                R0  rig_recipe.json load/save/validate, step log, script version stamp (git HEAD + dirty flag)
├─ rigkit/                     runs INSIDE Blender 5.2 (bpy, mathutils, bmesh, numpy light use)
│  ├─ __init__.py              A1
│  ├─ bl.py                    A1  shared Blender helpers: mode switching, temp_override, object lookup, snapshot save, PID-free helpers
│  ├─ meshio.py                A1  mesh.npz export (V, F, UV, mat, weld via rigcore.mesh), evaluated-vertex export helpers
│  ├─ intake.py                A1  S0/S2: import GLB read-only, sha256, uniform scale to H, ground, apply transforms, parent
│  ├─ skeleton.py              A1  S4: build runtime armature from a resolved skeleton dict; rolls; bend tests + flip; checks
│  ├─ control.py               A1  S5: control kit `humanoid_v1` (D01 kit + ctl_{S}_Clavicle + twist drivers + skirt-chain hook)
│  ├─ functest.py              A1  S5: function tests (port of D01 v2_rig_function), extremes
│  ├─ export.py                A1  S8: test GLB export with fixed args; A1.1–A1.14 validation (port of D01 v1_validate)
│  ├─ state.py                 A1  snapshot/diff of lm_* empties, vertex-group hashes, pose; override files
│  ├─ skin_io.py               B   weights.npz ↔ vertex groups (batched writes), runtime-copy prune/normalize
│  ├─ poses.py                 C   S7: apply ROM/compound poses through the control rig; export poses.npz under runtime emulation
│  ├─ render.py                C   S7: headless Workbench QA sheets (overlay, weight maps, pose sheets incl. ARPG camera, flag sheet);
│  │                               S3: mode `flag_tiles` draws A2's `flags.json` tiles (crops, source markers, section polylines)
│  └─ parity.py                C   S8: clean reimport of the test GLB in a fresh folder; posed comparison data
├─ solvers/                    runs in E:\tools\rigkit-env
│  ├─ __init__.py              A2
│  ├─ glbmesh.py               A2  GLB → mesh.npz without Blender (trimesh; glTF Y-up → Blender Z-up). For development and analysis only
│  ├─ analysis.py              A2  S1 → analysis.json (weld, islands, boundary/non-manifold, symmetry, pose, fingers, bridging cloth, thin parts)
│  ├─ landmarks_geo.py         A2  S3 source a: slicing, perimeter minima, ray depth, shoulder sphere fit, spine line
│  ├─ unirig_bridge.py         A2  run UniRig or read its output; joints → standard names by hierarchy/position; source d
│  ├─ consensus.py             A2  fuse sources → landmarks.json; flags; flag-sheet data
│  ├─ proxy.py                 B   watertight voxel proxy (+ map back to the original vertices)
│  ├─ skin_common.py           B   topology, bones, fold/enforce/invariants, exporter rule, overrides (numpy + rigcore only: skin_io loads it inside Blender)
│  ├─ skin_profiles.py         B   twist ramps, creases incl. wrist, influence caps, hip measurement (added in fix round 2)
│  ├─ skin_rules.py            B   skin_rules.json expressions, classify, constraints (added in fix round 2)
│  ├─ skin_region.py           B   candidate A (generalized D01 d01_skin.py)
│  ├─ skin_transfer.py         B   candidate B (heat/geodesic on proxy → RSWT closest-point transfer → Laplacian inpaint)
│  ├─ skin_unirig.py           B   candidate C (UniRig weights remapped; uses unirig_bridge mapping)
│  ├─ skin_select.py           B   per-region choice between candidates from metrics region scores; blend bands
│  ├─ metrics.py               C   S7 metrics → metrics.json + region scores + traffic lights vs thresholds.json
│  ├─ parity_cmp.py            C   S8 geometry comparison by welded position
│  └─ thresholds.json          C   copy of RIG_SKILL_WORKFLOW.md §4 as data (proposal values)
├─ tests/
│  ├─ rigcore/ (R0)  rigkit/ (A1, B, C: prefix files with owner tag)  solvers/ (A2, B, C: prefix files with owner tag)
└─ ../families/S_legacy_D01.json   A1  exact replica of D01's 35-bone runtime (regression target)
```

Owners: **R0** = rigcore writer (runs first). **A1** = Blender core. **A2** = analysis/landmarks/UniRig. **B** = skin. **C** = QA
(poses, metrics, render, parity).

## Conventions

- **Units:** metres. **Blender frame:** Z up, character front = −Y, character left = +X. glTF export: +Y up, front +Z.
- **H:** catalogue height of the asset (D01 0.5 m). Relative thresholds are fractions of H.
- **Names:**
  - runtime bones follow `SKELETON_STANDARD.md` (`L_`/`R_` prefixes);
  - control bones start with `ctl_`;
  - landmark empties are `lm_<id>`;
  - sided landmark ids end in `_L`/`_R` (`shoulder_L`).
- **Objects in a rig `.blend`:**
  - mesh `<asset_id>`;
  - runtime armature `<asset_id>_runtime`;
  - control armature `<asset_id>_control`.

  D01 used `D01_hodling`, `D01_runtime`, `D01_control`; accept those for the legacy regression.

## Data formats (rigcore/schema.py is the single source of truth; schema version 0)

| File | Keys / shape |
| --- | --- |
| `mesh.npz` | `V` float64 (n,3) object space after S2; `F` int32 (m,3) triangles; `weld` int32 (n,) welded id; `UV` float32 (n,2) optional; `mat` int16 (m,) optional; `meta` str (JSON: asset_id, H, scale_factor, source sha256, schema) |
| `weights.npz` | `bones` str (k,); `W` float32 (n,k) dense, rows sum to 1 for deforming vertices; `locked` bool (n,) optional (rigid/override); `meta` str (JSON: candidate, params) |
| `poses.npz` | `names` str (p,); `P` float32 (p,n,3) evaluated positions under runtime emulation; `bone_names` str (b,); `heads`, `tails` float32 (p,b,3); `meta` str |
| `landmarks.json` | `{schema, asset_id, family, H, landmarks: {id: {pos:[x,y,z], sources:{a|b|c|d|e: [x,y,z]}, spread, decision, confidence, flagged}}}` |
| resolved skeleton (dict / `skeleton.json`) | `{schema, family, template_version, template:{path, version, sha256}, builder:{...}, control_kit, warnings, H, bones:[{name, parent, side, kind, deform, head, tail, hinge:[x,y,z], bend_test, twist|null, roll_flipped (after S4; hinge is then the effective local X)}], ik:[...], rom:[...], rom_compound:[...], skin:{...}}` (sides expanded) |
| `analysis.json` | per `references/mesh-intake.md` |
| `metrics.json` | `{schema, asset_id, poses:{name:{region:{stretch_max, stretch_p99, n_over_1_25, n_over_1_5, area_change_max, volume_ratio, penetration:{n_tris, max_depth}, seam_crack_max}}}, joints:{...}, summary:{...}, lights:{metric: green|yellow|red}}` |
| `rig_recipe.json` | `{schema, asset_id, input:{glb, sha256}, family, template:{path, version, sha256}, scale:{factor, H}, landmarks:{file, overrides}, skin:{candidates, choice, params, overrides}, scripts:{git_head, dirty}, steps:[{step, time, params, outputs}]}` |

Region masks are data: `regions` = dict name → bool mask over welded ids, derived from the dominant bones of the chosen weights. They
are stored next to `metrics.json` as `regions.npz`.

## Runtime emulation (used by C, checked by A1/B)

Armature modifier only, `use_deform_preserve_volume=False`, `bbone_segments=1` on every bone, no other deforming modifiers. Weights
go through the exporter rule: drop ≤ 1e-4, keep the top 4, renormalize. Do this on a **copy**, never on the source groups.

## Tests

- rigkit-env: `E:\tools\rigkit-env\Scripts\python.exe -I -B -m pytest scripts/tests/<package> -q`. Use `-B` on every rigkit-env launch.
  Blender modules end through `rigkit.bl.exit_now`, which removes Blender's session temp folder, and save without `.blend1` files. Run it from the `scripts/` folder, or
  give the bootstrap in `conftest.py` (R0 writes `scripts/tests/conftest.py`).
- Blender tests: `scripts/tests/rigkit/<owner>_test_*.py`, run headless. They print a JSON summary line and exit non-zero on
  failure.
- Every acceptance check in your task brief must exist as an automated test or script with its output saved under
  `E:\tmp_rigkit\<tag>\`.

## Phase G (2026-10-23): long clothing and hanging accessories

The spec is `../references/cloth-and-attachments.md`. Read it first. Phase G adds pipeline step **S3g** (between S3 and S4) and a
garment overlay to S6/S7.

### Ownership

| Owner | Files |
| --- | --- |
| **G1** (solvers) | new `solvers/garments.py` (S3g classification), new `solvers/chains.py` (chain plan), new `solvers/skin_garment.py` (overlay weights + garment region rules); may extend `solvers/skin_common.py` and `solvers/skin_rules.py` without changing existing behaviour; tests `tests/solvers/G1_*` |
| **G2** (rigkit + QA) | `rigkit/skeleton.py` (merge `chains.json`, chain root bend tests), `rigkit/control.py` (leg-push drivers, fans; `add_skirt_chain` kept for the legacy path), `rigkit/poses.py` (garment compounds + generated chain poses), `rigkit/render.py` (garment sheet, cloth pose sheet), `solvers/metrics.py` (garment metrics), `solvers/thresholds.json` (garment rows), `families/H.json` and `S.json` (`rom_compound` garment poses only); tests `tests/rigkit/G2_*`, `tests/solvers/G2_*` |
| **G3** (integration, after G1 and G2) | `pipeline.py`, `pipeline_steps/*`: S3g step, `--garments`, overlay in S6/S7, selection ignores garment rows, S9 report and sheets, fingerprints in `inputs.py`; end-to-end runs |

Everything else is read-only for phase G writers. Body skin results must not change on assets without garments. D01 legacy
(`S_legacy_D01`) must stay bit-identical: the garment planner is off for legacy families.

### Data formats (schema 0; add validators to `rigcore/schema.py` only through G1, listing the keys below)

| File | Keys |
| --- | --- |
| `garments.json` (S3g) | `{schema, asset_id, H, family, params, pieces:[{id, class, confidence, n_welded, layer, side, panel, parent, attach:{bone, points:[[x,y,z]...]}, length, width, hem_loop:[welded ids], slits:[...], merged_into, reasons:[...]}], flags:[{piece, why}], budget:{aux_budget, used, trims:[...]}}` |
| `garments.npz` (S3g, per **welded** id; map to vertices with `mesh.npz` `weld`) | `piece` int32 (−1 = body), `t` float32 (0 at the attachment line, 1 at the hem; NaN off garments), `phi` float32 (azimuth in degrees, rings only, else NaN), `layer` int8 (0 = outermost), `outer_ref` int32 (closest outermost-layer welded id, −1 if none), `meta` str |
| `chains.json` (S3g) | `{schema, asset_id, H, chains:[{id, piece, class, side, parent, panel, azimuth_deg, fan_root, bones:[{name, parent, head:[x,y,z], tail:[x,y,z], hinge:[x,y,z]}], leg_push:{enabled, w_L, w_R, dir:[x,y,z], max_deg}, spring:{stiffness, gravityPower, gravityDir, dragForce, hitRadius, min_leg_distance}}], colliders:[{bone, shape:"capsule", offset, tail, radius}], budget:{aux_budget, used, trims}}` |
| resolved skeleton | chain bones are ordinary bone dicts with `kind: "aux"`, `deform: true`, plus optional keys `chain` (chain id) and `piece` (piece id) |
| `garment_overlay.npz` (S6/S7) | `bones` str (k,) = the runtime deform bones, `W` float32 (n, k) per vertex, `alpha` float32 (n,) blend factor (0 = body weights, 1 = overlay; transition band in between), `meta` str |
| `garment_rules.json` (S6/S7) | a skin-rules fragment (`regions` with `vertex_ids` and `allowed` per piece, `rigid` for beads and rigid items) merged into the asset's skin rules before `finish` |
| `metrics.json` additions | `summary.garments:{pieces:{id:{hem_stretch_min, hem_stretch_max, torn_edges, limb_penetration, layer_penetration}}, bleed_rows, chain_coverage:{bone: rows}}`; lights `garment_*` |

Coordinates are in metres, Blender frame and object space after S2, like the rest of this contract.

## Final report of every writer

List:
- files written;
- commands to run the tests and their results;
- acceptance numbers;
- deviations from this contract;
- open problems.

Be honest: unmet criteria are reported as unmet.
