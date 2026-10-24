# Packaging review (Opus 5.5): FL_flagellant_vA rig preview, second pass

Date 2026-10-21. This is a narrow review of the packaging and code changes made since `REVIEW_opus.md`, time-boxed to a few minutes. The reviewer only read files and ran one headless Blender check against `/tmp`. The only file written is this one.
Out of scope: production rig, IK, real clips and generic bone renames (see `REVIEW_opus.md` → "Known future production limitations").

## Verdict: **PASS**

All prior findings (1–4) are resolved, and nothing blocks the preview. G2 is still pending the user's visual check, and it is labelled that way everywhere. The three nits below are optional cleanups.

## Evidence

| Check | Result |
| --- | --- |
| Main GLB | `FL_flagellant_vA_rig.glb` SHA-256 `ec8c2173…2d3672`. This is byte-identical to the legacy `legacy/art-output/…_sorceress_rig/FL_flagellant_vA_sorceress_rig.glb`, which matches the claim of a byte-identical rebuild. |
| Packaged blend | SHA-256 `beba3b9e…158481`. Reopened headless: 181 bones, mesh with 6,755 verts, 3 packed 4096² Flagellant maps, 3 muted NLA tracks (`QA_idle`, `QA_walk`, `QA_arm_swing`), Layout viewport `color_type = TEXTURE`. The `.blend1` (pre-view copy) gives the same counts but `MATERIAL` colour, so only the view changed. |
| Inputs untouched | `rig/refs/d2r-sorceress.glb` = Sorceress attachment (`a56291e7…`). `FL_flagellant_vA.glb` = Flagellant attachment (`40642eba…`), mtime 2026-10-20. `mapping_and_validation.json.inputs` records both relative paths and both SHA-256 values. |
| Legacy folder | No file in `ashlar/3d/heroes/FL_flagellant/vA/rig_sorceress/` is newer than its `REVIEW_opus.md`, so it is untouched. |
| Script delta vs legacy | Only `build_rig.py`, `validate_rig.py` and `run_all.ps1` differ. `set_blend_view.py` is new. All other scripts are byte-identical. The attachment paths are gone, and defaults now resolve as `scripts/ → rig/ → asset`. `BASE` was renamed to `FL_flagellant_vA_rig`. The `--glb` default (`dirname(out)/BASE.glb`) is the same in build, validate and run_all, so a scratch `-RigDir` writes nothing into the package. `run_all.ps1` checks that its inputs exist and checks the exit codes of build and validate. Sources are only imported. |
| Finding 1 (68 vs 76) | Fixed: REPORT §5 now reads "68 bone có trọng số … (76 nhóm đỉnh trước khi cắt)", and `clips.json` reports `bones_with_weights: 68`. |
| Finding 2 (rebuild deps) | Fixed: the scripts take parameters and the Sorceress reference is copied into the package with its SHA-256. |
| Finding 3 (licence) | Fixed: the Blizzard / internal-lookdev / not-for-release note is in `rig.log`, `rig_brief.md`, `REPORT.md`, `clips.json` and the inventory row. |
| Finding 4 (layout, G2, experiment) | Fixed: canonical names, `rig/qa/…_qa_clips_geometry_only.glb`, `clips.json` clips marked `status: experiment`, `real_clips: []`. G2 is "chờ người dùng" in the brief gate table, `rig.log`, the README and the inventory. No document claims that G2 passed. |
| README / inventory | `ashlar/3d/README.md` (catalogue row + changelog line) and `ANIMATION_INVENTORY.md` (row + changelog line) were edited narrowly and are consistent (181 / 68, route T, G2 pending, legacy path noted). |

## Nits (optional, non-blocking)

1. **`rig/REPORT.md:21` has a literal CR byte (0x0D) instead of `\r`.** The text reads ``rig\scripts<CR>un_all.ps1``, so the command shows as `rig\scriptsun_all.ps1`. The cause is a `\r` escape that was interpreted when the file was written. Fix: replace that byte with `\r` (or write `rig/scripts/run_all.ps1`).
2. **`rig/FL_flagellant_vA_rig.blend1` is 21 MB, the backup Blender wrote when `set_blend_view.py` saved.** It is not git-ignored and duplicates the blend apart from the view. Fix: delete it, or ignore `*.blend1`.
3. **`run_all.ps1` does not call `set_blend_view.py`.** A rerun into the package rewrites the blend with the default Material viewport.
   - The QA render steps also have no `$LASTEXITCODE` checks. `$ErrorActionPreference = 'Stop'` does not catch native exit codes.
   - Fix: add one line, `& $Blender -b $blend -P "$here\set_blend_view.py"` after `validate_rig`, with an exit check. Or document it as a manual step, which rig.log line 20 partly does.

## Retained limits (consciously accepted, not reopened)

These are tracked in the brief and inventory and are for G2 to decide:
- deep-crouch skirt tear;
- fused fingers;
- unweighted face, hair and twist bones;
- no real clips and no IK;
- D2R bone names kept;
- no engine integration.
