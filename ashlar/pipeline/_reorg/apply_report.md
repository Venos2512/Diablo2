# Reorg apply report (20261024-064626)

- rewrote 709 files; 0 skipped (changed meanwhile); 0 write failures
- journal: `E:\tmp_reorg_backup\20261024-064626\journal.json`


## Next steps

1. Run `python ashlar/pipeline/_reorg/reorg_2026-10-24.py --verify` (must exit 0).
2. Rebuild legacy/bestiary: `cd legacy/bestiary && node scripts/build.mjs && node scripts/check.mjs`. Its build and check now expect origin-root `../` for D2RR.html; `legacy/D2RR.html`, `legacy/bestiary/dist/index.html` and `src/data/multiverse-images.json` (all > 5 MB) keep the old paths until rebuilt.
3. Rebuild the lab if needed (`cd lookdev-lab && npm run build`), start it and open the scenes; run each `lookdev-lab/scripts/prepare-*.py` once in dry mode or with its usual arguments, and `node lookdev-lab/scripts/biome-layout.test.mjs`.
4. Run the moved tools' own tests: `python -m pytest ashlar/pipeline/codex/tests`, `ashlar/art/textures/terrain-biomes-v1/tools/test_*.py`.
5. Check the tripo pipeline (`ashlar/pipeline/tripo/`): `_tools/*.sh`, `nature/_tools/compose_rows.py`, `tripo_batch.log` stay beside `nature/`.
6. Update the auto-memory files outside the repo (C:\Users\HLC_2021\.claude\projects\E--Diablo2\memory\*.md): they name the old paths (ashlar/art/_codex, art-output/..., bestiary/, map-01-concepts, ...).
7. tmp/ was not touched on purpose: scripts there that point at old paths need a manual look when they are used again.
8. `git status` should show renames; commit when satisfied. Delete the backup folder (path in the journal) afterwards.
