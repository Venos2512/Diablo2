# ASHLAR concepts (approved and not yet approved) and D2RR concept art

The Concept art collection holds the project’s own 2D concepts: 271 records with 459 images in 18 sets, split over two worlds. The **ASHLAR** world starts with the **Concept chốt** (approved concepts): the 28 ASHLAR monster sheets the project owner approved on 2026-10-21, all marked Approved. After it come nine sets of ASHLAR concepts that are **not approved yet** (166 records, 306 images), added on 2026-10-25. The older **D2RR** world keeps the other 77 records. They sit beside the reference library (380 records), so the build has 651 records in total. The file opens on the ASHLAR world’s Concept art collection.

The 28 sheets are exactly the files listed in `scripts/check.mjs` (`ashlarPaths`), under `ashlar/art/act-01/monsters/`. Where a monster had several candidates, the approved file is the one named there (for example `concept_r2b.png` reruns, or the vB variant for D01, P05, W01, W02, W04, W06). W05 Corpse-Candle and D03 Kiln-Bull have no approved sheet yet; they are in the first of the not-yet-approved sets.

The previous monster concepts (Dying Gods, six sets of 34 sheets; Act I monsters v1, 21; Act I creatures v2, 20; 75 records and 84 images in all) were removed from the book on the same date. Their original PNGs stay in `legacy/art-output/`; only the book’s records and WebP copies are gone. Non-monster concepts and the cross-game reference creatures are untouched.

| Set | World | Records | Images |
|---|---|---|---|
| Concept chốt · ASHLAR monsters | ASHLAR | 28 | 28 |
| ASHLAR · Act I monsters (not approved): W05, D03 | ASHLAR | 2 | 4 |
| ASHLAR · Act II monsters (v5, not approved) | ASHLAR | 23 | 46 |
| ASHLAR · Act III monsters (first pass, not approved) | ASHLAR | 23 | 46 |
| ASHLAR · Heroes (not approved): six classes + shared sheets | ASHLAR | 11 | 22 |
| ASHLAR · NPCs (costume proposals, not chosen) | ASHLAR | 51 | 102 |
| ASHLAR · Items & inventory icons | ASHLAR | 19 | 24 |
| ASHLAR · HUD kits & mockups | ASHLAR | 8 | 8 |
| ASHLAR · Act I environment sheets (A01–A25) | ASHLAR | 25 | 50 |
| ASHLAR · Prologue concepts | ASHLAR | 4 | 4 |
| Blood Moor outpost · key art | D2RR | 7 | 7 |
| Blood Moor outpost · in-game mockups (v3, plus v2) | D2RR | 6 | 10 |
| Camp prop sheets (assets 01–03, 05–06, 13–24) | D2RR | 17 | 17 |
| Nature prop sheets (assets 04, 08–12, 25) | D2RR | 7 | 7 |
| Procedural prop studies (bone, rock, tree) | D2RR | 14 | 15 |
| UI & screen mockups | D2RR | 8 | 8 |
| HUD sprite sheets (v2 sheet, v2 slices, v1) | D2RR | 5 | 15 |
| Terrain tiles (D2R-style moor, ten Act I biomes, outpost ground) | D2RR | 13 | 46 |

## Not-yet-approved ASHLAR sets

`python scripts/add_ashlar_unapproved.py` generates these nine sets and writes them into `assets/CONCEPT_SOURCES.json`: the groups go right after `ashlar-chot`, the records are appended at the end of `records` (so every existing id and record number stays valid) and the script can be re-run at any time; it only replaces its own groups. Sources are under `ashlar/art/`; nothing is taken from `_work/`, `_runs/`, `_brief/` or `_batches/`, from files with REJECTED in the name, or from `ashlar/art/textures/`.

- **Monsters (Act I W05 and D03, Act II, Act III):** the newest PNG of variant A and of variant B per monster, by file time (the rule of `ashlar/pipeline/index/build_index.py`). Where the QA notes of a variant name an older pass as the best, that pass is shown and its label ends in “(QA best)”: F05 A, L01 A and B, U06 A (Act II), B08 B and U14 A (Act III). Names, locations and Diablo base come from `ashlar/docs/ASHLAR_MONSTER_CHECKLIST_VI.md`; the `art` note carries the QA result of each pick (known size fails after three passes: Act II U06 A, B06 B, F04 B, F05 A, F08 B, F07 B; Act III U14 A, B08 B; open canon questions D06 kiln glow, B09 cross-like mason mark, P11 and W14 B rescaled by code).
- **Heroes:** one record per class with the A and B pick of `ashlar/art/heroes/_review/v5/README_VI.md` (v5 or v5b), plus the class-select key art, the hand showcase (newest per class: BR v2, EX v1, FL v3, OS v3, PB v3, PS v3), the Prologue line-up, the direction B top-down sheet (direction A has no PNG yet) and the v5 3/4 overview.
- **NPCs:** `ashlar/art/npcs/manifest.json`, the A and B file named for each of the 51 NPCs; the manifest caveats go into the notes.
- **Items:** the newest `sheet_d2_*` of each of the 19 sheets (the D2 inventory view is the chosen one; IT-05 shows `d2_r2`, newer than the `d2_v1` of the README table) and, where it exists, the newest older 3/4 sheet. Contents come from the sheet templates in `ashlar/art/items/_batches/`.
- **HUD:** the one PNG of each of the eight folders in `ashlar/art/hud/`.
- **Act I environments:** the newest turnaround and perspective sheet of A01–A25 (A19 keeps its selected `turnaround_v2`; the later `v2e` edit was the failed fourth try). E01–E04 are the legacy folder names of A01–A04: their turnarounds are byte-identical copies, so they have no records of their own, and the perspective sheets of A01–A04 are read from those E folders (as the batch manifest says). A05, A09, A10 and A12 have no 3D kit yet; the other A-groups were built into kits (`ashlar/INDEX.md`).
- **Prologue:** the four sheets of `ashlar/art/prologue/concepts-v1/`, marked To do because all four failed the 2026-10-21 check (`QA-2026-10-21.txt`).

## Sources and pipeline

- `assets/CONCEPT_SOURCES.json` is the curated list: worlds (`world` is the default D2RR; `worlds` lists extra ones such as ASHLAR; a set’s `world` field assigns it), sets, English names and notes, and each record’s images in display order (`origin` is relative to the repository root, `label` names the version or tile). Records with several images show them as a strip under the main image; the first image is the preferred one.
- `python scripts/import_concepts.py` encodes WebP copies into `assets/concepts/<set>/` at the source resolution (≤1920 px; terrain tiles 1024 px, quality 74) plus 480 px thumbnails, and writes `src/data/concepts.json`. `assets/concepts/encoded.json` keeps each source’s SHA-256, so unchanged PNGs are skipped. `--force` re-encodes everything.
- `npm run build` inlines the WebP files as data URIs (`scripts/concept-media.mjs`) and writes `../legacy/D2RR.html` and `dist/index.html`. `npm run build:site` also writes the website version to `../legacy/sites/book-of-cain-act1/dist`, where the images stay separate files and load lazily.
- The original PNGs are not moved: scripts in `lookdev-lab/` and `legacy/art-output/` read them in place. The record’s **Source PNG** link opens the original when `legacy/D2RR.html` sits at the repository root.

## Text and statuses

Names and notes are English. The not-yet-approved ASHLAR records carry only what the docs state: no palettes or Diablo bases are invented (heroes carry the proposed palette of the hero concept doc; monsters keep the checklist base). The approved ASHLAR records take names, roles, locations and Diablo family from `ashlar/docs/ASHLAR_MONSTER_CHECKLIST_VI.md` and palettes from `ashlar/art/act-01/_batches/map01/REVISION_2_VI.md` (proposed Revision 2 palettes, not locked); the tag “concept chốt” makes them searchable without diacritics. Blood Moor, prop-study and nature-sheet notes are translated from their Vietnamese READMEs. Camp sets 13–24, grass clumps 25, UI and HUD notes are condensed from each sheet’s English README, keeping visual QA and leaving out provenance boilerplate.

Default statuses: all 28 Concept chốt sheets are **Approved**; the 166 not-yet-approved ASHLAR records are **In progress**, except the four Prologue sheets that failed their QA, which are **To do**. Among the D2RR concepts, **To do** marks the four sheets the reviews recommend regenerating or that did not pass (v3 bonfire plaza; grass sheet 04; world map UI; outpost ground sheet). **Approved** also covers the covered handcart (asset 01), the brief’s approved layout reference. Everything else is **In progress**. Statuses changed in the UI are stored per browser like other records; notes and favourites saved for the removed records are ignored on import.

## Not included

- 3D work (Tripo GLBs and their renders in `ashlar/pipeline/tripo/`), lookdev-lab screenshots (`legacy/art-output/terrain-moor/`, `terrain-biomes/_ingame`, root `*_check.png`) and kit renders.
- Contact sheets and grids that only repeat included images (`legacy/art-output/_share/`, `_v2_grid_*`, `dying-gods-act1/_rerun/`, `v3_ingame/_drafts`, `ui-hud-assets/*_v2/` single slices).
- Diablo II sprite frames saved as palette evidence in the v2 folders, and the D2R reference screenshots in `assets_2d/_refs/`.
- The removed Dying Gods and Act I monster v1/v2 sheets (75 records, 84 images; the originals remain in `legacy/art-output/dying-gods-act1/`, `legacy/art-output/act1-monsters-20/` and `legacy/output/imagegen/`), and older passes of the ASHLAR concepts: the vB alternates and earlier passes of the 28 approved monsters, older passes of the not-yet-approved sets (only the newest pass or the QA-best pass of each variant is shown), the REJECTED files, the Act I environment E01–E04 duplicates and the terrain textures (`ashlar/art/textures/`, which are textures, not concepts).
- `legacy/art-output/dong-que.png` (an unrelated countryside illustration) and `legacy/art-output/diablo-concepts/` (deleted in the working tree on 2026-10-19).

## Adding concepts

Add a record (or an image to an existing record) in `assets/CONCEPT_SOURCES.json`, keeping ids stable because notes and favorites are keyed by id. Then run `python scripts/import_concepts.py`, `npm run build` and `npm run check`; update the expected counts in `scripts/check.mjs` when the set sizes change. The records of the not-yet-approved ASHLAR sets are regenerated by `scripts/add_ashlar_unapproved.py`; edit that script (not the generated JSON) to change them, and approve a concept by moving it into `ashlar-chot` by hand and removing it from the script.
