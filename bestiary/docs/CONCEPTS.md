# ASHLAR Concept chốt and D2RR concept art

The Concept art collection holds the project’s own 2D concepts: 105 records with 153 images in 9 sets, split over two worlds. The **ASHLAR** world is the **Concept chốt** (approved concepts): the 28 ASHLAR monster sheets the project owner approved on 2026-10-21, all marked Approved. The older **D2RR** world keeps the other 77 records. They sit beside the reference library (380 records), so the build has 485 records in total. The file opens on the ASHLAR world’s Concept art collection.

The 28 sheets are exactly the files listed in `scripts/check.mjs` (`ashlarPaths`), under `ashlar/art/map-01-concepts/monsters/`. Where a monster had several candidates, the approved file is the one named there (for example `concept_r2b.png` reruns, or the vB variant for D01, P05, W01, W02, W04, W06). W05 Corpse-Candle and D03 Kiln-Bull have no approved sheet yet and are not in the book.

The previous monster concepts (Dying Gods, six sets of 34 sheets; Act I monsters v1, 21; Act I creatures v2, 20; 75 records and 84 images in all) were removed from the book on the same date. Their original PNGs stay in `art-output/`; only the book’s records and WebP copies are gone. Non-monster concepts and the cross-game reference creatures are untouched.

| Set | World | Records | Images |
|---|---|---|---|
| Concept chốt · ASHLAR monsters | ASHLAR | 28 | 28 |
| Blood Moor outpost · key art | D2RR | 7 | 7 |
| Blood Moor outpost · in-game mockups (v3, plus v2) | D2RR | 6 | 10 |
| Camp prop sheets (assets 01–03, 05–06, 13–24) | D2RR | 17 | 17 |
| Nature prop sheets (assets 04, 08–12, 25) | D2RR | 7 | 7 |
| Procedural prop studies (bone, rock, tree) | D2RR | 14 | 15 |
| UI & screen mockups | D2RR | 8 | 8 |
| HUD sprite sheets (v2 sheet, v2 slices, v1) | D2RR | 5 | 15 |
| Terrain tiles (D2R-style moor, ten Act I biomes, outpost ground) | D2RR | 13 | 46 |

## Sources and pipeline

- `assets/CONCEPT_SOURCES.json` is the curated list: worlds (`world` is the default D2RR; `worlds` lists extra ones such as ASHLAR; a set’s `world` field assigns it), sets, English names and notes, and each record’s images in display order (`origin` is relative to the repository root, `label` names the version or tile). Records with several images show them as a strip under the main image; the first image is the preferred one.
- `python scripts/import_concepts.py` encodes WebP copies into `assets/concepts/<set>/` at the source resolution (≤1920 px; terrain tiles 1024 px, quality 74) plus 480 px thumbnails, and writes `src/data/concepts.json`. `assets/concepts/encoded.json` keeps each source’s SHA-256, so unchanged PNGs are skipped. `--force` re-encodes everything.
- `npm run build` inlines the WebP files as data URIs (`scripts/concept-media.mjs`) and writes `../D2RR.html` and `dist/index.html`. `npm run build:site` also writes the website version to `../sites/book-of-cain-act1/dist`, where the images stay separate files and load lazily.
- The original PNGs are not moved: scripts in `lookdev-lab/` and `art-output/` read them in place. The record’s **Source PNG** link opens the original when `D2RR.html` sits at the repository root.

## Text and statuses

Names and notes are English. The ASHLAR records take names, roles, locations and Diablo family from `ashlar/ASHLAR_MONSTER_CHECKLIST_VI.md` and palettes from `ashlar/art/map-01-concepts/REVISION_2_VI.md` (proposed Revision 2 palettes, not locked); the tag “concept chốt” makes them searchable without diacritics. Blood Moor, prop-study and nature-sheet notes are translated from their Vietnamese READMEs. Camp sets 13–24, grass clumps 25, UI and HUD notes are condensed from each sheet’s English README, keeping visual QA and leaving out provenance boilerplate.

Default statuses: all 28 ASHLAR sheets are **Approved**. Among the D2RR concepts, **To do** marks the four sheets the reviews recommend regenerating or that did not pass (v3 bonfire plaza; grass sheet 04; world map UI; outpost ground sheet). **Approved** also covers the covered handcart (asset 01), the brief’s approved layout reference. Everything else is **In progress**. Statuses changed in the UI are stored per browser like other records; notes and favourites saved for the removed records are ignored on import.

## Not included

- 3D work (Tripo GLBs and their renders in `art-output/tripo-models/`), lookdev-lab screenshots (`art-output/terrain-moor/`, `terrain-biomes/_ingame`, root `*_check.png`) and kit renders.
- Contact sheets and grids that only repeat included images (`art-output/_share/`, `_v2_grid_*`, `dying-gods-act1/_rerun/`, `v3_ingame/_drafts`, `ui-hud-assets/*_v2/` single slices).
- Diablo II sprite frames saved as palette evidence in the v2 folders, and the D2R reference screenshots in `assets_2d/_refs/`.
- The removed Dying Gods and Act I monster v1/v2 sheets (75 records, 84 images; the originals remain in `art-output/dying-gods-act1/`, `art-output/act1-monsters-20/` and `output/imagegen/`), and ASHLAR candidates other than the 28 approved sheets (vB alternates, earlier passes, the unapproved W05 and D03).
- `art-output/dong-que.png` (an unrelated countryside illustration) and `art-output/diablo-concepts/` (deleted in the working tree on 2026-10-19).

## Adding concepts

Add a record (or an image to an existing record) in `assets/CONCEPT_SOURCES.json`, keeping ids stable because notes and favorites are keyed by id. Then run `python scripts/import_concepts.py`, `npm run build` and `npm run check`; update the expected counts in `scripts/check.mjs` when the set sizes change.
