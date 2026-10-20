# D2RR concept art

The D2RR world and the Concept art collection hold the project’s own 2D concepts: 152 records with 209 images in 16 sets. They sit beside the reference library (380 records), so the build has 532 records in total. The file opens on the D2RR world’s Concept art collection.

| Set | Records | Images |
|---|---|---|
| Dying Gods · Redbound | 7 | 9 |
| Dying Gods · Restless | 6 | 9 |
| Dying Gods · Blightbeasts | 6 | 7 |
| Dying Gods · Rootborn | 5 | 6 |
| Dying Gods · Forsworn | 5 | 7 |
| Dying Gods · Consecrated | 5 | 5 |
| Act I monsters · v1 (20 + Fallen Bell Thief test) | 21 | 21 |
| Act I creatures · v2 | 20 | 20 |
| Blood Moor outpost · key art | 7 | 7 |
| Blood Moor outpost · in-game mockups (v3, plus v2) | 6 | 10 |
| Camp prop sheets (assets 01–03, 05–06, 13–24) | 17 | 17 |
| Nature prop sheets (assets 04, 08–12, 25) | 7 | 7 |
| Procedural prop studies (bone, rock, tree) | 14 | 15 |
| UI & screen mockups | 8 | 8 |
| HUD sprite sheets (v2 sheet, v2 slices, v1) | 5 | 15 |
| Terrain tiles (D2R-style moor, ten Act I biomes, outpost ground) | 13 | 46 |

## Sources and pipeline

- `assets/CONCEPT_SOURCES.json` is the curated list: sets, English names and notes, and each record’s images in display order (`origin` is relative to the repository root, `label` names the version or tile). Records with several images show them as a strip under the main image; the first image is the preferred one.
- `python scripts/import_concepts.py` encodes WebP copies into `assets/concepts/<set>/` at the source resolution (≤1920 px; terrain tiles 1024 px, quality 74) plus 480 px thumbnails, and writes `src/data/concepts.json`. `assets/concepts/encoded.json` keeps each source’s SHA-256, so unchanged PNGs are skipped. `--force` re-encodes everything.
- `npm run build` inlines the WebP files as data URIs (`scripts/concept-media.mjs`) and writes `../D2RR.html` and `dist/index.html`. `npm run build:site` also writes the website version to `../sites/book-of-cain-act1/dist`, where the images stay separate files and load lazily.
- The original PNGs are not moved: scripts in `lookdev-lab/` and `art-output/` read them in place. The record’s **Source PNG** link opens the original when `D2RR.html` sits at the repository root.

## Text and statuses

Names and notes are English. Dying Gods descriptions, palettes and QA are translated from `art-output/dying-gods-act1/roster.json` and `QA.md`; the Vietnamese family names and roster lines are kept as search tags (search ignores diacritics). Blood Moor, prop-study and nature-sheet notes are translated from their Vietnamese READMEs. Act I v1/v2, camp sets 13–24, grass clumps 25, UI and HUD notes are condensed from each sheet’s English README, keeping visual QA and leaving out provenance boilerplate.

Default statuses follow the reviews: **To do** marks the eight sheets the reviews recommend regenerating or that did not pass (Dying Gods 07 Herald, 08 Gravewalker, 12 Mourning Wraith, 31 Penitent Bulwark; v3 bonfire plaza; grass sheet 04; world map UI; outpost ground sheet). **Approved** is the covered handcart (asset 01), the brief’s approved layout reference. Everything else is **In progress**. Statuses changed in the UI are stored per browser like other records.

## Not included

- 3D work (Tripo GLBs and their renders in `art-output/tripo-models/`), lookdev-lab screenshots (`art-output/terrain-moor/`, `terrain-biomes/_ingame`, root `*_check.png`) and kit renders.
- Contact sheets and grids that only repeat included images (`art-output/_share/`, `_v2_grid_*`, `dying-gods-act1/_rerun/`, `v3_ingame/_drafts`, `ui-hud-assets/*_v2/` single slices).
- Diablo II sprite frames saved as palette evidence in the v2 folders, and the D2R reference screenshots in `assets_2d/_refs/`.
- `art-output/dong-que.png` (an unrelated countryside illustration) and `art-output/diablo-concepts/` (deleted in the working tree on 2026-10-19).

## Adding concepts

Add a record (or an image to an existing record) in `assets/CONCEPT_SOURCES.json`, keeping ids stable because notes and favorites are keyed by id. Then run `python scripts/import_concepts.py`, `npm run build` and `npm run check`; update the expected counts in `scripts/check.mjs` when the set sizes change.
