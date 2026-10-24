# Reorg apply report (20261024-090645)

- rewrote 105 files; 0 skipped (changed meanwhile); 0 write failures
- journal: `E:\tmp_reorg_backup_b\20261024-090645\journal.json`


## Next steps

1. Run `python ashlar/pipeline/_reorg/reorg_2026-10-24b.py --verify` (must exit 0).
2. Tripo scripts now live in `ashlar/pipeline/tripo/scripts/` (ASHLAR builds); the old nature/camp scripts and outputs are in `legacy/tripo-models/` (`_tools/*.sh` write `../_shots`, `nature/` batch scripts write their GLBs beside `nature/`).
3. Run the lab prepare scripts that read ashlar/3d/monsters (`lookdev-lab/scripts/prepare-*.py`) once with their usual arguments.
4. Update the auto-memory files outside the repo: they name `ashlar/pipeline/tripo/nature`, `3d/monsters/<ID>`, `act-02/monsters/monsters`.
5. `git status` should show renames; commit when satisfied. Delete the backup folder (path in the journal) afterwards.
