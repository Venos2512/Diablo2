# Sanctuary Databook

An English-language asset reference library for Diablo II Classic, starting with Act I. Includes 34 creature records and a shared structure for environments, NPCs, items, 3D models, animation clips and VFX.

## Open

Open `../Sanctuary_Databook.html` in a modern browser. The file embeds application code, Three.js and all reference images. It works without a server or network; source links require Internet access. `dist/index.html` and the legacy `../Diablo_II_Act1_Bestiary.html` contain the same build.

## Features

- Collection navigation, searchable metadata, family/kind/status filters and sorting.
- Image grid and compact data table.
- Record dialog with large reference image, source link, art notes and proposed motion checklist.
- Favorites, editable work statuses and per-record notes stored on your device.
- Workspace JSON export/import, including legacy bestiary note backups.
- Metadata catalog export for planning and future integrations.
- Three.js GLB inspector: orbit, zoom, fit, embedded clip selection, play/pause, speed and timeline.
- Empty future collections clearly labeled; no fabricated production assets or clip counts.

## Develop

Requires Node.js 20+.

```sh
npm ci
npm run build
npm run check
npm start
```

Preview at http://127.0.0.1:4173. Build updates all HTML entry points. Dependencies are locked in package-lock.json.

## Modules

```text
src/data/catalog.js       Existing creature records and family definitions
src/data/collections.js   Future collection arrays
src/data/registry.js      Collection registry and unified asset lookup
src/data/images.json      Embedded reference images with source metadata
src/lib/databook.js       Generic querying, workspace persistence, JSON export
src/lib/state.js          Text normalization and legacy note compatibility
src/viewer/model.js       Three.js self-contained GLB and animation inspector
src/main.js               Library, record dialogs and interaction wiring
src/template.html         Semantic English UI and built-in guide
src/styles.css            Responsive light databook design
assets/references/        Original reference images
assets/SOURCES.json       Per-image provenance
scripts/                  Asset retrieval, build, preview and checks
docs/SCHEMA.md            Shared data contract and extension example
docs/DEVELOPMENT.md       Implementation and lifecycle notes
docs/CONTENT.md           Content boundaries and source interpretation
docs/VALIDATION.md        Verification evidence and remaining limits
```

## Workspace data

Favorites, statuses and notes are stored in `sanctuary-databook-v2`. Notes from `act1-bestiary-notes-v1` are merged on startup, with new notes taking precedence. Export workspace before moving the HTML, changing browsers or clearing browser storage. JSON imports merge favorites and replace matching notes/statuses. Unknown record IDs are ignored.

## 3D preview

Open a record, select **3D & animation**, then **Open GLB**. Choose a self-contained GLB smaller than 100 MB. Nothing is uploaded. Files remain in the current dialog session and are released on closing or changing records. External texture/buffer files and decoder-dependent extensions are not supported. The current catalog has no production models or verified animation clips. Previewing a file does not add it to the catalog.

## Attribution

Diablo II reference images belong to Blizzard Entertainment and originate from The Arreat Summit. They are research references, not a grant to redistribute them in a commercial game. See `assets/SOURCES.json`. Three.js uses the MIT license; see `THIRD_PARTY_LICENSES.txt`. Production descriptions and checklist notes are original project annotations.
