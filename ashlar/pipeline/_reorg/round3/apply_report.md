# Reorg apply report (20261024-100533)

- rewrote 349 files; 0 skipped (changed meanwhile); 0 write failures
- journal: `E:\tmp_reorg_backup_c\20261024-100533\journal.json`


## Next steps

1. Run `python ashlar/pipeline/_reorg/reorg_2026-10-24c.py --verify` (must exit 0).
2. Run `python ashlar/pipeline/index/build_index.py` to write `ashlar/INDEX.md` (one row per asset: concept folder, newest concept, 3D folder, GLBs). It is not run by the reorg: it reads the NEW layout, so it only makes sense after the apply.
3. Regenerate the NPC review page (it names `<npc>/QA.txt` and `<npc>/*.prompt.txt`, now in `_work/`): `python ashlar/art/npcs/_brief/build_npc_review_index.py` (rewrites ashlar/art/npcs/index.html and manifest.json).
4. Run the tests: `python -m pytest ashlar/pipeline/codex/tests ashlar/pipeline/index ashlar/pipeline/_reorg`.
5. Lab: `python lookdev-lab/scripts/prepare-act1-extras.py --only A15.1,P06 --no-register` and `python lookdev-lab/scripts/prepare-act1-kit.py --only A01.1,A21.1 --no-register` once (pieces are found by glob in `ashlar/3d/act-01/environments/*/`); `python ashlar/art/act-01/_batches/env_A01-A14/act01_batch.py --check` (and the same for env_A15-A20 / env_A21-A25 via their manifest).
6. Rig tools / tests: `python -m pytest .agents/skills/blender-mcp-rigging/scripts/tests/rigkit -k 'not blender' -q` (they join `act-01/monsters/D01_hodling` now).
7. Tripo flow: new assets go to `ashlar/3d/<act>/<kind>/<ID>/` (same path as `ashlar/art/...`), sidecars to `<asset>/_work/` (scripts and skill patched).
8. Records keep their old paths on purpose: *.log, *.jsonl, _runs/, task/result/prompt texts, brief.md mentions of `_tasks/` and `_rejected/`.
9. Update the auto-memory files outside the repo: they name `ashlar/3d/monsters/<ID>`, `3d/weapons`, `3d/props/act1_kit_v1`, `art/act-01/environments/A01-A14/groups`, `_map01`.
10. `git status` should show renames; commit when satisfied. Delete the backup folder (path in the journal) afterwards.
