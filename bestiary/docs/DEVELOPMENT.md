# Development notes

## Architecture

The catalog is independent of rendering. registry.js defines collection names and aggregates records; databook.js filters shared fields and handles local workspace data. main.js coordinates the grid, table and record dialog. model.js owns the Three.js scene and its resource lifecycle.

Collection counters and summary metrics derive from records. Additional categories can be registered without rewriting the card/table renderer. Creature family filters are hidden for non-creature collections. Missing optional data has explicit empty states.

## Build

Esbuild bundles modules and Three.js into an inline IIFE. The template embeds CSS and reference data URIs; the `concept-media` plugin (scripts/concept-media.mjs) inlines the WebP files listed in src/data/concepts.json. Output: dist/index.html and ../D2RR.html; each gets an `origin-root` meta tag with the repository root relative to its folder, used by the concept Source PNG links. `--site <dir>` (npm run build:site) adds a website build: the plugin maps concept images to `concepts/…` URLs, the WebP files are copied next to index.html, and `origin-root` is `none`, which hides the Source PNG links because the site has no originals. No runtime CDN or module fetch is needed.

Concept records are produced by scripts/import_concepts.py from assets/CONCEPT_SOURCES.json (see docs/CONCEPTS.md). Concept images carry `file`/`thumb` paths and `src`/`thumbSrc` data URIs; catalog export drops the data URIs.

## Model viewer lifecycle

Only created when a GLB is selected. GLTFLoader parses the chosen ArrayBuffer. A LoadingManager rejects external URLs; embedded data/blob resources remain local. A sequence token prevents stale file loads from replacing a newer selection. Closing or changing a record disposes the renderer, geometries, materials and textures, stops the render loop and disconnects ResizeObserver.

Clips are read from gltf.animations. AnimationMixer drives playback; clip selection, pause, speed and timeline operate on the actual loaded clip. Zero-clip models hide playback controls. Files are not persisted or added to catalog counts.

## Persistence and migration

Workspace key: sanctuary-databook-v2. Legacy notes are read from act1-bestiary-notes-v1 and merged with v2 notes. Work statuses are user annotations, not source verification claims. Backup import accepts schemaVersion 1 or 2, ignores unknown IDs, accepts only string notes and known status values, and unions favorite IDs.

## Accessibility and responsive layout

Native controls have labels, visible focus states and keyboard operation. Dialogs provide modal focus management and Escape dismissal. Media tabs support left/right arrows. `/` focuses library search outside dialogs and form fields. Mobile uses horizontally scrollable collection navigation and vertically stacked record media/details. Reduced motion disables decorative transitions.

## Verification

Run npm run build and npm run check after changing source. Browser checks should cover: grid/table parity, all collection empty states, filters combined with favorites, record navigation, status persistence, notes migration, valid/invalid backup import, image enlargement, model loading, no-clip model, multi-clip playback, failed model load, and responsive layout.
