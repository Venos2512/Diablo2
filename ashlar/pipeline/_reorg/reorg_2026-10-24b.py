#!/usr/bin/env python
"""Repo reorganisation, round 2 (2026-10-24, after round 1): thin wrapper around reorg_2026-10-24.py.

Loads the round-1 engine and swaps in the round-2 map (MOVES, PATCHES, ...). Same modes and options
(--dry-run default, --apply, --verify, --restore JOURNAL, --probe-locks, --force); reports and the map go to
ashlar/pipeline/_reorg/round2/, the default backup folder is <drive>:\\tmp_reorg_backup_b (not round 1's).

  1. act-02/monsters/monsters/<ID> -> act-02/monsters/<ID>        (flatten the double nesting, 23 dirs)
  2. tripo/heroes/FL_flagellant_vA_sorceress_rig -> 3d/heroes/FL_flagellant_vA/rig_sorceress
  3. tripo/nature/_tools -> tripo/scripts                          (the live ASHLAR Tripo scripts)
  4. Blood Moor era model outputs -> legacy/tripo-models/          (camp, early_kits, rock_01, _shots, _texcheck, _downloads, _tools, nature)
  5. 3d/monsters/<ID> and _review -> 3d/monsters/act-01/           (28 Act I monsters)
"""
import importlib.util
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('reorg_round1', os.path.join(HERE, 'reorg_2026-10-24.py'))
R = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(R)

OUT_DIR = os.path.join(HERE, 'round2')
T = 'ashlar/pipeline/tripo/'
L = 'legacy/tripo-models/'
# frozen lists (so --verify still knows them after the folders are gone)
ACT2_IDS = ['B06_choir_of_nails', 'B07_brother_cassian', 'D05_cinder_clan', 'F03_exhumer', 'F04_kneeler', 'F05_bell_head',
            'F06_censer_bearer', 'F07_turned_exhumer', 'F08_halo_knight', 'F09_chancery_guard', 'L01_saint_statue',
            'L02_plumb_hound', 'L03_gargoyle_mortarer', 'P08_kneeler', 'P09_chain_hung', 'U06_pall_wight', 'U07_pyre_risen',
            'U08_charnel_chanter', 'U09_ossuary_glutton', 'U10_wallshade', 'U11_scribe_shade', 'U12_the_pressed', 'W08_bell_bat']
ACT1_IDS = ['B01_sextons_dog', 'B02_lullaby_man', 'B03_ember_pot', 'B04_willow_bride', 'B05_hospice_mother', 'D01_hodling',
            'D02_kiln_shaman', 'D04_tithe_thief', 'F01_body_snatcher', 'F02_poppy_nurse', 'P01_the_soothed', 'P02_hush_herald',
            'P03_hush_moths', 'P04_hive_sleeper', 'P05_wet_nurse', 'P06_poppy_mound', 'P07_cradle_warden', 'U01_shambler',
            'U02_charnel_dead', 'U03_charnel_bowman', 'U04_charnel_ghoul', 'U05_the_swollen', 'W01_mortar_rat',
            'W02_gibbet_crow', 'W03_hush_wolf', 'W04_mire_sucker', 'W06_willow_hulk', 'W07_shroud_spinner']

MOVES = (
    [dict(src='ashlar/art/act-02/monsters/monsters/' + i, dst='ashlar/art/act-02/monsters/' + i) for i in ACT2_IDS]
    + [dict(src=T + 'heroes/FL_flagellant_vA_sorceress_rig', dst='ashlar/3d/heroes/FL_flagellant_vA/rig_sorceress'),
       dict(src=T + 'nature/_tools', dst=T + 'scripts')]
    + [dict(src=T + n, dst=L + n) for n in ['camp', 'early_kits', 'rock_01', '_shots', '_texcheck', '_downloads', '_tools']]
    + [dict(src=T + 'nature', dst=L + 'nature')]
    + [dict(src='ashlar/3d/monsters/' + i, dst='ashlar/3d/monsters/act-01/' + i) for i in ACT1_IDS + ['_review']]
)

# Edits no token rewrite can make (file = path BEFORE the moves; old = text after the path rewrites)
README, TRIPO_MD = 'ashlar/3d/README.md', 'ashlar/pipeline/tripo/Agent.md'
EXTRAS, LICENSES = 'lookdev-lab/scripts/prepare-act1-extras.py', 'lookdev-lab/THIRD_PARTY_LICENSES.md'
A2_DBL = ('ashlar/art/act-02/monsters/monsters/<ID_slug>', 'ashlar/art/act-02/monsters/<ID_slug>')
PATCHES = [
    # --- double nesting act-02/monsters/monsters: the folder token ends in the vanishing dir, so the rewrite leaves it
    *[dict(file='ashlar/art/act-02/monsters/_brief/' + f, old=A2_DBL[0], new=A2_DBL[1],
           why='placeholder path of the flattened act-02/monsters/monsters/<ID_slug>') for f in
      ('LANE_BRIEF_r3.md', 'LANE_BRIEF_r4_fast.md', 'LANE_BRIEF_v2.md')],
    # --- ashlar/3d/monsters/<ID> -> monsters/act-01/<ID>: spellings without a full <ID> path
    dict(file=README, old='├─ monsters/<asset_id>/    quái', new='├─ monsters/act-0N/<asset_id>/  quái, chia theo Act (act-01 = Act I)',
         why='tree block: monsters sit under an act folder now'),
    dict(file=README, old='1. Tạo `ashlar/3d/<nhóm>/<asset_id>/` và chép',
         new='1. Tạo `ashlar/3d/<nhóm>/<asset_id>/` (quái: `ashlar/3d/monsters/act-0N/<asset_id>/`, Act I = `act-01`) và chép',
         why='placeholder path of a new asset'),
    dict(file=TRIPO_MD, old='(nhóm `heroes`, `monsters`, `props/<lô>`)', new='(nhóm `heroes`, `monsters/act-0N`, `props/<lô>`)',
         why='asset groups: monsters sit under an act folder'),
    dict(file=TRIPO_MD, old='24 con + xe nồi B03 trong `ashlar/3d/monsters/` |', new='24 con + xe nồi B03 trong `ashlar/3d/monsters/act-01/` |',
         why='folder mention (Act I monsters), the rewrite cannot name a split dir'),
    dict(file=EXTRAS, old='static monsters from ashlar/3d/monsters the same way', new='static monsters from ashlar/3d/monsters/act-01 the same way',
         why='docstring: folder mention'),
    dict(file=EXTRAS, old="'monsters/P06_poppy_mound/P06_poppy_mound.glb'", new="'monsters/act-01/P06_poppy_mound/P06_poppy_mound.glb'",
         why='RUNTIME: source GLB spelled relative to ashlar/3d (MONSTERS table; the sample `source` is derived from it)'),
    dict(file=EXTRAS, old='models in `ashlar/3d/monsters`)', new='models in `ashlar/3d/monsters/act-01`)',
         why='licence text written into THIRD_PARTY_LICENSES.md by this script (keeps the two in step)'),
    dict(file=LICENSES, old='models in `ashlar/3d/monsters`)', new='models in `ashlar/3d/monsters/act-01`)',
         why='same licence text as prepare-act1-extras.py'),
    dict(file='.agents/skills/blender-mcp-rigging/scripts/tests/solvers/C_d01_acceptance_test.py',
         old='"ashlar", "3d", "monsters",\n', new='"ashlar", "3d", "monsters", "act-01",\n',
         why='RUNTIME: os.path.join split over two lines (the quoted-segment fixer works per line)'),
    # --- Tripo layout: scripts/, legacy/tripo-models/, rig test moved to ashlar/3d
    dict(file=README, old='Model không thuộc ASHLAR vẫn ở `ashlar/pipeline/tripo/`: đồ trại và nature Blood Moor / Act I\n(`camp/`, `nature/`), `early_kits/`, `rock_01/`.',
         new='Model không thuộc ASHLAR (Blood Moor: đồ trại, nature, early kits) nằm ở `legacy/tripo-models/`\n(`camp/`, `nature/`, `early_kits/`, `rock_01/`); `ashlar/pipeline/tripo/` chỉ còn `Agent.md` và `scripts/`.',
         why='prose: where the non-ASHLAR Tripo models are'),
    dict(file=README, old='`early_kits/`).', new='`legacy/tripo-models/early_kits/`).', why='bare folder name next to the rewritten camp/ path'),
    dict(file=README, old='Bản gốc thử vẫn ở `ashlar/3d/heroes/FL_flagellant_vA/rig_sorceress/`',
         new='Bản gốc thử nay ở `ashlar/3d/heroes/FL_flagellant_vA/rig_sorceress/`', why="prose: 'still at' the pipeline folder; it moved here"),
    dict(file=README, old='GLB không đổi; A21–A25 chưa có bản trong lab.\n',
         new='GLB không đổi; A21–A25 chưa có bản trong lab.\n'
             '- 2026-10-24 (vòng sắp xếp 2): `monsters/<ID>` và `monsters/_review` thành `monsters/act-01/<ID>`; thử rig FL từ '
             '`ashlar/pipeline/tripo/heroes/` sang `heroes/FL_flagellant_vA/rig_sorceress/`; script Tripo `nature/_tools` thành '
             '`ashlar/pipeline/tripo/scripts/`; camp, nature, early_kits, rock_01, _shots, _texcheck, _downloads, _tools sang `legacy/tripo-models/`.\n',
         why='history entry'),
    dict(file=TRIPO_MD, old='thuộc ASHLAR (đồ trại, nature Blood Moor, early kits) ở `ashlar/pipeline/tripo/<nhóm>/`.',
         new='thuộc ASHLAR (đồ trại, nature Blood Moor, early kits) ở `legacy/tripo-models/<nhóm>/` (script ASHLAR ở `scripts/`).',
         why='prose: where the non-ASHLAR models are'),
    dict(file=TRIPO_MD, old='Không ghi đè `nature/_tools/target.txt`.', new='Không ghi đè `scripts/target.txt`.',
         why='bare relative folder name: the scripts folder was renamed'),
]
STAY = []
RUNTIME_AREAS = list(R.RUNTIME_AREAS)
GENERIC_ROOTS = set()
OVERRIDE_REPO_ROOT = set()

NEXT_STEPS = [
    "Run `python ashlar/pipeline/_reorg/reorg_2026-10-24b.py --verify` (must exit 0).",
    "Tripo scripts now live in `ashlar/pipeline/tripo/scripts/` (ASHLAR builds); the old nature/camp scripts and outputs are in "
    "`legacy/tripo-models/` (`_tools/*.sh` write `../_shots`, `nature/` batch scripts write their GLBs beside `nature/`).",
    "Run the lab prepare scripts that read ashlar/3d/monsters (`lookdev-lab/scripts/prepare-*.py`) once with their usual arguments.",
    "Update the auto-memory files outside the repo: they name `ashlar/pipeline/tripo/nature`, `3d/monsters/<ID>`, `act-02/monsters/monsters`.",
    "`git status` should show renames; commit when satisfied. Delete the backup folder (path in the journal) afterwards.",
]

for _k, _v in dict(MOVES=MOVES, PATCHES=PATCHES, STAY=STAY, RUNTIME_AREAS=RUNTIME_AREAS, GENERIC_ROOTS=GENERIC_ROOTS,
                   OVERRIDE_REPO_ROOT=OVERRIDE_REPO_ROOT, NEXT_STEPS=NEXT_STEPS, BACKUP_NAME='tmp_reorg_backup_b',
                   REPORT_TITLE='reorg_2026-10-24b.py', ROUND1_NOTES=False).items():
    setattr(R, _k, _v)


def main(argv=None):
    argv = list(sys.argv[1:] if argv is None else argv)
    if not any(a == '--out-dir' or a.startswith('--out-dir=') for a in argv):
        argv += ['--out-dir', OUT_DIR]
    os.makedirs(OUT_DIR, exist_ok=True)
    return R.main(argv)


if __name__ == '__main__':
    sys.exit(main())
