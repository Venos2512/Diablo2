# Validation

The standalone build and checks cover 215 creature records across five games, 157 Diablo II item references and 8 Diablo II NPC records. Of the item records, 153 have embedded source images. The 181 cross-game enemy records have 179 embedded image references, each labeled exact, official-manual or same-family. Two remain without an image: Torchlight I Cursed Sword and Dungeon Siege Bear. The wiki-image pass adds 111 illustrated records (94 exact references and 17 explicitly labeled family references). Tree of Inifuss Bark and Horadric Malus use quest illustrations, labeled as such; Wirt’s Leg, Key, Arrows and Bolts have no verified image linked.

The item group filter, missing-image record and dark Book of Cain interface were verified in the in-app browser. See `book-of-cain-preview.png`. No production 3D models or verified animation clips are linked yet.

The expanded catalog was checked in the local browser on 2026-10-16. Titan Quest shows 33 records; searching for Talos opens its Epic/Legendary encounter condition and independent research link. Dungeon Siege shows 24 records and 23 image references; Brankar the Scavenger displays the embedded wiki image, Farmlands location, source link and editorial art notes. See `research-expansion-preview.png`. The automated check covers all five game counts, unique cross-game indices, image labels, local source files and selected difficulty/campaign conditions.

## NPC update

The NPC collection contains seven named Act I NPCs and one Rogue Scout hireling archetype, each with an embedded Blizzard GIF and provenance. The Rogue Scout is explicitly distinguished from the seven town NPCs. The GIF references are not counted as verified production animation clips.


## Wiki image completion pass (2026-10-16)

111 previously empty records now have images: 94 exact-name/category references and 17 labeled family references. All imported files decoded successfully; source URLs, MIME types and review notes are retained. Final totals: 380 catalog records, 374 illustrated records, 179/181 cross-game enemies illustrated. Browser checks confirmed four distinct Boneback variant images, the explicit Groble family caption, and Talos with its wiki source and Epic/Legendary condition. See `wiki-images-preview.png` and `wiki-images-talos-preview.png`. Cursed Sword (Torchlight I) and Bear (Dungeon Siege) remain unresolved after alternate-wiki searches; evidence is in the per-game unresolved manifests.

## D2RR concept pass (2026-10-19; counts below are before the 2026-10-21 Concept chốt update, see the section after)

`npm run check` covers the 152 concept records: set counts, 209 images, unique ids across all 532 records, WebP copies and thumbnails on disk, every source PNG present, status defaults, concept/world/group/status filters, diacritic-free Vietnamese search, inlined data URIs and legacy/D2RR.html matching dist except for the origin root. Headless Chrome on file:///E:/Diablo2/legacy/D2RR.html confirmed: the default Concept art view (152 cards), version and tile strips (Crawler v2/v1, Cold Plains dirt/mud/grass), fit and actual-size enlargement with image stepping, the Source PNG link opening the original file in a new tab, table view, the All worlds view (532 records) and an unchanged Diablo II reference record. Georgia misplaces stacked Vietnamese accents (ồ, ề), so that Unicode block is drawn from Times New Roman. See `d2rr-concepts-preview.jpg` and `d2rr-concept-record-preview.jpg`.

## ASHLAR unapproved concepts update (2026-10-25)

The concept catalogue now has 271 records (459 images, 18 sets): the 28 approved Concept chốt monsters, 166 not-yet-approved ASHLAR records in nine sets (Act I W05/D03, Act II and III monsters, heroes, NPCs, items, HUD, Act I environments, Prologue; 306 images) and 77 D2RR records; 651 records in total. Statuses: 234 In progress, 8 To do (4 D2RR sheets and the 4 failed Prologue sheets), 29 Approved. `npm run check` additionally asserts the 18 sets and their order, the world of every set, record and image counts, unique ids and unique image origins, that no new record is Approved, that the new records carry the tags `ashlar`, `chua chot` and `chưa chốt`, that no origin lies in a `_work`, `_runs`, `_brief`, `_batches` or `textures` folder or names a REJECTED file, and that the query `concept chot` still finds exactly the 28 approved records. `legacy/D2RR.html` is 79.8 MB (limit 100 MB on GitHub); the website build (`npm run build:site`) is about 65 MB (20 MB index.html + 45 MB of WebP). A headless Chrome screenshot of `file:///E:/Diablo2/legacy/D2RR.html` showed the ASHLAR world with 194 cards and the updated scope text; the interactive dialog checks were not re-run.

## ASHLAR Concept chốt update (2026-10-21)

The concept catalogue now has 105 records (153 images, 9 sets): 28 ASHLAR Concept chốt monsters (all Approved, world `ashlar`) and 77 D2RR records. The Dying Gods (6 sets) and Act I monster v1/v2 records were removed, 485 records in total. `npm run check` asserts the exact 28 source paths in order, one image each, status and world, absence of the old ids/groups/origins, the old WebP directories being gone, no WebP file on disk that no record uses, and `legacy/D2RR.html` matching `dist/index.html`. A headless Chrome screenshot of `file:///E:/Diablo2/legacy/D2RR.html` showed the ASHLAR tab selected by default with 28 Approved cards. Not re-run in this update: the interactive dialog and zoom checks of the earlier pass.
