# Development notes

## Architecture

The catalog is independent of rendering. registry.js defines collection names and aggregates records; databook.js filters shared fields and handles local workspace data. main.js coordinates the grid, table and record dialog. model.js owns the Three.js scene and its resource lifecycle.

Collection counters and summary metrics derive from records. Additional categories can be registered without rewriting the card/table renderer. Creature family filters are hidden for non-creature collections. Missing optional data has explicit empty states.

## Build

Esbuild bundles modules and Three.js into an inline IIFE. The template embeds CSS and reference data URIs. Output: dist/index.html, Sanctuary_Databook.html and the legacy Bestiary HTML alias. No runtime CDN or module fetch is needed.

## Model viewer lifecycle

Only created when a GLB is selected. GLTFLoader parses the chosen ArrayBuffer. A LoadingManager rejects external URLs; embedded data/blob resources remain local. A sequence token prevents stale file loads from replacing a newer selection. Closing or changing a record disposes the renderer, geometries, materials and textures, stops the render loop and disconnects ResizeObserver.

Clips are read from gltf.animations. AnimationMixer drives playback; clip selection, pause, speed and timeline operate on the actual loaded clip. Zero-clip models hide playback controls. Files are not persisted or added to catalog counts.

## Persistence and migration

Workspace key: sanctuary-databook-v2. Legacy notes are read from act1-bestiary-notes-v1 and merged with v2 notes. Work statuses are user annotations, not source verification claims. Backup import accepts schemaVersion 1 or 2, ignores unknown IDs, accepts only string notes and known status values, and unions favorite IDs.

## Accessibility and responsive layout

Native controls have labels, visible focus states and keyboard operation. Dialogs provide modal focus management and Escape dismissal. Media tabs support left/right arrows. `/` focuses library search outside dialogs and form fields. Mobile uses horizontally scrollable collection navigation and vertically stacked record media/details. Reduced motion disables decorative transitions.

## Verification

Run npm run build and npm run check after changing source. Browser checks should cover: grid/table parity, all collection empty states, filters combined with favorites, record navigation, status persistence, notes migration, valid/invalid backup import, image enlargement, model loading, no-clip model, multi-clip playback, failed model load, and responsive layout.
