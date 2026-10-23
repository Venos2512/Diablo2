# ASHLAR · Act I · base maps — asset report

Sinh tự động bởi `scripts/act1-assets-report.mjs` (2026-10-22) từ mọi file `src/env/act1/maps/*.js` (hợp đồng SPEC §6b). **Đừng sửa tay** — sửa file map rồi chạy lại `node scripts/act1-assets-report.mjs`.

Trạng thái: **glb** = model ASHLAR thật · **kit** = kit Blood-Moor cũ đứng thay ("kit tạm", chưa xong) · **procedural** = code tạo tạm (thẻ cỏ/lau, nước, sprig…) · **blockout** = khối thay thế đúng cỡ, model còn thiếu. "Còn thiếu" = mọi asset có trạng thái khác glb. Số lượng = số đặt trong base map (bản cắt đầu, chưa phải độ dài đầy đủ).

## Tóm tắt

| # | Map | Scene | Engine | Mã asset | Đặt | glb | kit | procedural | blockout | Quái (mã) | NPC | Texture thiếu | VFX thiếu |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Lychgate → Churchyard (`lychgate`) | `act1Lychgate` | outdoor | 50 | 1774 | 38 | 7 | 5 | **0** | 6 | 8 | 6 | 10 |
| 2 | Night Fens → Rook's Weir (`fens`) | `act1Fens` | outdoor | 49 | 2573 | 38 | 4 | 4 | **3** | 7 | 1 | 7 | 9 |
| 3 | The Poppy Reach (`poppyReach`) | `act1PoppyReach` | outdoor | 31 | 67024 | 17 | 6 | 4 | **4** | 5 | 0 | 7 | 9 |
| 4 | ASHLAR · Act I · base · Gentle House (`gentleHouse`) | `act1GentleHouse` | interior | 29 | 109 | 20 | 0 | 2 | **7** | 0 | 4 | 7 | 10 |
| 5 | ASHLAR · Act I · base · Garden of Hush (`gardenOfHush`) | `act1GardenOfHush` | interior | 31 | 740 | 24 | 0 | 3 | **4** | 6 | 2 | 6 | 11 |
| 6 | ASHLAR · Act I · base · The Cradle (`cradle`) | `act1Cradle` | interior | 11 | 110 | 9 | 0 | 1 | **1** | 5 | 0 | 5 | 10 |

## Lychgate → Churchyard — `lychgate`

Scene `act1Lychgate` · engine outdoor · BIO-03 · file `src/env/act1/maps/lychgate.js` · độ dài đề xuất: 360 m — Full game: hub crossing ≈ 40 s (≈ 220 m of lane at 5.6 m/s run) — this slice has ≈ 130 m of lane; the churchyard (20 min) would grow north and west to ≈ 180 × 140 m with two more grave terraces; keep the island-in-black-water frame and the lychgate as the only gap.

Mã asset: 50 — glb (model ASHLAR thật): **38** · kit tạm (kit cũ đứng thay): **7** · procedural (code tạo tạm): **5** · blockout (khối thay thế): **0**.

### Asset

| Mã | Tên | Loại | Cỡ (m) R × C × S | Số | Trạng thái | Nguồn | Đoạn | Ghi chú |
|---|---|---|---|---|---|---|---|---|
| `A01.1` | Repaired thatched stilt cottage | building | 5.42 × 5.2 × 5.23 | 11 | glb (`act1-a01-1-stilt-cottage`) | concept A01 cell 1 (E03 village kit) | hub | GLB 5.4 × 5.2 × 5.2 m (thatch eaves to ±2.7 m, the ladder to z +2.6): body x −2.0…+2.0, z −1.9…+1.0 on stilts, floor 0.88 m, door + ladder on +z; blocks on the body and stilts (4.4 × 3.3 m) and the ladder, the eaves overhang (over 2 m) does not; no lit window in the texture: the amber window glow is an engine light on the shuttered window of its +x wall (window anchor, 2.17 m up); the door sprig sits on the door face (z +1.06) |
| `A01.2` | Raised wooden walkway segment | structure | 4 × 2.16 × 1.99 | 12 | glb (`act1-a01-2-walkway`) | concept A01 cell 2 (E03 village kit) | hub | GLB 4 × 2.16 × 2 m, deck 1.75 m wide, deck top 1.22 m over its base (median of its deck faces): laid end to end along each walkway (deckPieces) with the deck top on the walk deck (the walkways are `hidden`, 1.8 m wide: the walk surface only), posts into the mere bed; a rope rail on its −z side (0.94 m over the deck) and two short corner posts on +z: the open +z side faces the camera; the rail and posts are out of the collision, like the blockout posts |
| `A01.3` | Patched low flint wall | structure | 3.4 × 1.37 × 0.58 | 67 | glb (`act1-a01-3-flint-wall`) | concept A01 cell 3 (E03 village kit) | both | GLB 3.4 × 1.37 × 0.58 m (cap 1.03–1.05 m), module 3.4 m; the churchyard boundary (the lychgate is its only gap) and the village west wall |
| `A01.4` | Willow hurdle fence | structure | 3.2 × 1.6 × 0.32 | 25 | glb (`act1-a01-4-hurdle-fence`) | concept A01 cell 4 (E03 village kit) | hub | GLB 3.2 × 1.6 × 0.32 m (posts 1.6 m, woven panel 1.4 m), module 3.2 m |
| `A01.5` | Village well | structure | 2.73 × 3.4 × 2.39 | 1 | glb (`act1-a01-5-village-well`) | concept A01 cell 5 (E03 village kit) | hub | GLB 2.7 × 3.4 × 2.4 m with its stone apron (rim ≈ 1.1 m), windlass along x, bucket side +z |
| `A01.6` | Eel-trap fishing rack | structure | 4.7 × 3 × 1.98 | 4 | glb (`act1-a01-6-eel-trap-rack`) | concept A01 cell 6 (E03 village kit) | hub | GLB 4.7 × 3.0 × 2.0 m (three traps on the bar, a fourth leaning at +x); placed ×0.85 (4.0 × 2.55 m, the old kit width); replaces the kit tạm fishing net |
| `A15.2` | Brannoc's forge (the Mortsmith's smithy) | building | 6 × 4.05 × 4.1 | 1 | glb (`act1-a15-2-forge`) | concept A15 cell 2 (v2 batch) | hub | GLB 6 × 4.05 × 4.1 m; its −x and −z sides are a plain panel (single-image guess): turned yaw −45 so both face away from the game camera, the open front to the square; hearth glow = a real human light (1/f flicker) on the model hearth |
| `A15.3` | Sleeper name board | story | 2.6 × 2.31 × 1.24 | 1 | glb (`act1-a15-3-name-board`) | concept A15 cell 3 (v2 batch) | hub | GLB 2.6 × 2.31 × 1.24 m (roof overhang, garlands); plain back: faces the square and the camera (yaw 0), the back to the lane side; blocks along the board |
| `A15.4` | Mourning bell frame | structure | 3.14 × 3.4 × 1.98 | 1 | glb (`act1-a15-4-bell-frame`) | concept A15 cell 4 (v2 batch) | hub | GLB 3.14 × 3.4 × 1.98 m (stone plinths, braces, leaning planks: chunkier than the 2.2 m concept) |
| `A15.5` | Nell Coppercoin's grave-goods stall | prop | 4.01 × 2.3 × 1.93 | 1 | glb (`act1-a15-5-grave-goods-stall`) | concept A15 cell 5 (v2 batch) | hub | GLB 4.0 × 2.3 × 1.93 m with the cart shafts (awning 3 m, centred on the placement point); plain back (−z) turned away from the camera |
| `A15.6` | Osric's watch post | structure | 3 × 3.89 × 3.46 | 1 | glb (`act1-a15-6-watch-post`) | concept A15 cell 6 (v2 batch) | hub | GLB 3 × 3.89 × 3.46 m; deck at 1.65 m (not walkable in the base map), fire basket = human light on the model basket |
| `N01` | Barrow family vault door (portal in the terrace wall) | story | 3.7 × 2.8 × 1.07 | 1 | glb (`act1-a21-1-barrow-door`) | concept A21 cell 1 (v3 batch) | hub | side quest One for the Footing; under the ossuary, faces the village. GLB 3.7 × 2.8 × 1.07 m (keyed on the 2.8 m height; on the 2.4 m width it would stand 1.82 m with a 1.37 m door): the portal and its own short flint wall section, door ≈1.5 × 2.1 m, face +z flush with the N02 wall face; the terrace wall runs stop at its two clean ends (x ±1.85); a mirrored door on its back is buried in the hill. Blocks only up to its visible faces (measured on the GLB, review a2x F-a), each back to the bbox back (−0.536): the wall section to +0.12 (its flint face +0.07…+0.09 over the foot ferns), the arch surround (x −1.2…+1.12) to +0.21 (jambs +0.17…+0.19), the 0.16 m threshold step (x −0.8…+0.75) to +0.38 (its front +0.30…+0.41); the fern clumps at its foot (to +0.53, the bbox front) are walk-through like all low plants |
| `N02` | Flint retaining wall (vault terrace) | structure | 4 × 2.16 × 0.73 | 4 | glb (`act1-a21-2-flint-retaining-wall`) | concept A21 cell 2 (v3 batch) | hub | keeps the hub terrace from the summit: the lychgate stays the only way into the churchyard. GLB 4 × 2.16 × 0.73 m (outer face +z, pale quoins at both ends, coping top ≈2.08 m; the face is loose panels in front of a frame): the runs stand it ×1.55 (6.2 m modules, 3.35 m tall, coping ≈3.22 m: the def is 3.2 m) with the outer face to the terrace, and a 0.2 m parapet over the uphill ground (not the default 0.6 × height, which would stretch it ×1.6). Its flint face is ≈0.14 m in front of the run line (the bbox front is the ferns at its foot): the runs stand with the face 0.18 m inside the terrace's flat edge, so the edge's ramp up to the hill lies inside the wall (outside its face the ramp hid the lower 2 m). Blocks only up to its flint face (z −0.364…+0.12 of the GLB; the face +0.09, p99 +0.10 at walking height; review a2x F-a): the fern clumps at its foot (to +0.25 in the walk band, the bbox front +0.364) are walk-through like all low plants |
| `N03` | Rain barrel | prop | 0.8 × 1 × 0.8 | 10 | **kit** (`kit:kitchen.water_barrel`) | LD only, no concept | hub | kit tạm: camp kitchen water barrel (2.1 m wide piece) |
| `N04` | Peat stack | prop | 1.6 × 0.66 × 1.14 | 12 | glb (`act1-a21-3-peat-stack`) | concept A21 cell 3 (v3 batch) | hub | GLB 1.6 × 0.66 × 1.14 m: long side with the sacking flap +z, loose turves at the foot; flat (0.66 m, spec 1.1 m: QA note, not stretched) |
| `N05` | Poppy sprig on a door (the Act I accent) | prop | 0.25 × 0.4 × 0.08 | 11 | **procedural** | LD only, no concept | hub | the only accent of the hub; hidden in the Prologue night (no accent) |
| `N06` | Washing line | prop | 4.1 × 2.1 × 0.85 | 2 | **kit** (`kit:crafts.laundry_line`) | LD only, no concept | hub | kit tạm |
| `N07` | Drying fish net | prop | 4 × 1.8 × 1.4 | 2 | **kit** (`kit:crafts.fishing_net`) | LD only, no concept | hub | kit tạm |
| `N08` | Village goods (sacks, crates) | prop | 1.9 × 1.3 × 1.8 | 3 | **kit** (`kit:storage.sacks`) | LD only, no concept | hub | kit tạm |
| `N12` | Peat barrow | prop | 1.2 × 1 × 2.4 | 1 | **kit** (`kit:animals.wheelbarrow`) | LD only, no concept | hub | kit tạm (camp wheelbarrow) |
| `N09` | Low shrubs / brambles at the edges | vegetation | 1.2 × 0.5 × 1.1 | 44 | **kit** (`kit:shrubs.shrub_05`) | LD only, no concept | both | kit tạm (Blood-Moor shrub) |
| `A04.2` | Young willow | vegetation | 4.94 × 6 × 5.22 | 7 | glb (`act1-a04-2-young-willow`) | concept A04 cell 2 (E02 willow kit) | hub | GLB 4.9 × 6 × 5.2 m; at the mere and fen edge; only the trunk blocks (its base, measured at walking height), the fronds are walk-through |
| `A03.1` | Low grass clump | vegetation | 0.6 × 0.5 × 0.6 | 900 | **procedural** | concept A03 cell 1 (E01 fen kit) | both | Dark Wood grass cards on the grass layers |
| `A03.2` | Tall reeds clump | vegetation | 0.8 × 1.8 × 0.8 | 320 | **procedural** | concept A03 cell 2 (E01 fen kit) | both | shore-plant cards (biome-shore-plants) along the fen and the mere |
| `A03.3` | Sedge water clump | vegetation | 0.7 × 0.9 × 0.7 | 220 | **procedural** | concept A03 cell 3 (E01 fen kit) | both |  |
| `glb:biome-prop-stump` | Mossy stump | vegetation | 0.8 × 0.5 × 0.8 | 3 | glb (`biome-prop-stump`) | ashlar/3d/props/clutter_v1/mossy_stump | hub |  |
| `glb:biome-prop-riverbank-stones` | Riverbank stones | rock | 1 × 0.35 × 1 | 5 | glb (`biome-prop-riverbank-stones`) | ashlar/3d/props/clutter_v1/riverbank_stones | both |  |
| `glb:dungeon-prop-flint-boulders` | Flint boulders | rock | 2 × 1 × 2 | 7 | glb (`dungeon-prop-flint-boulders`) | ashlar/3d/props/dungeon_v1/flint_boulders | churchyard | flint country: on the hill flanks |
| `glb:dungeon-prop-bone-pile` | Bone pile (skulls to count) | prop | 1.2 × 0.6 × 1.2 | 2 | glb (`dungeon-prop-bone-pile`) | ashlar/3d/props/dungeon_v1/bone_pile | hub | the children count skulls here, under the ossuary |
| `glb:dungeon-prop-candle-cluster` | Candle cluster | prop | 0.8 × 0.8 × 0.8 | 3 | glb (`dungeon-prop-candle-cluster`) | ashlar/3d/props/dungeon_v1/candle_cluster | both |  |
| `glb:biome-prop-mushrooms` | Mushroom cluster | vegetation | 0.4 × 0.3 × 0.4 | 3 | glb (`biome-prop-mushrooms`) | ashlar/3d/props/clutter_v1/mushroom_cluster | churchyard |  |
| `A02.1` | Lychgate roofed gate (with lamp) | structure | 3.51 × 3.8 × 3.3 | 1 | glb (`act1-a02-1-lychgate-open`) | concept A02 cell 1 (E04 burial kit) | both | GLB 3.5 × 3.8 × 3.3 m, the lab variant -open (prepare-act1-kit.py CUT: the knee-high rail across its back opening, 0.40–0.62 m, cut out, else every hero would wade through it). THE light threshold hub ↔ churchyard: blocks on the four flint plinths (≈ 2.3 m apart) and the −x side rail only; the two gate leaves, swung part-open at the front, narrow the straight passage to 1.35 m, so they are walk-through; 2.17 m clear under the tie beams. No lamp modelled: the lamp is the A16.6 lantern head (A16.6-lantern) hung by its link under the front tie beam (local (0, 2.32, 0.97)), its human light in the glass |
| `A16.6-lantern` | Lychgate lamp (the lantern head of the A16.6 sexton's lamp) | prop | 0.28 × 0.54 × 0.28 | 1 | glb (`act1-a16-6-sexton-lamp`) | concept A16 cell 6 (v2 batch): the lantern of the sexton's lamp | both | a part of the A16.6 GLB: only its lantern (glass body + hook link, 0.28 × 0.54 m) is drawn (outdoor.js cut, pivot = its bottom centre); hung under the lychgate front tie beam at ×0.75 (0.21 × 0.41 m, bottom 1.91 m: over the hero), the lychgate lamp light flickers in its glass (it replaced a bare glow orb, QA 10-23) |
| `A02.2` | Mortsafe grave cage | structure | 2.6 × 0.97 × 1.9 | 4 | glb (`act1-a02-2-mortsafe`) | concept A02 cell 2 (E04 burial kit) | churchyard | GLB 2.6 × 0.97 × 1.9 m (the cage on its slab) |
| `A02.3` | Small mismatched headstone cluster | rock | 3 × 1.4 × 2.09 | 3 | glb (`act1-a02-3-headstones`) | concept A02 cell 3 (E04 burial kit) | churchyard | GLB 3 × 1.4 × 2.1 m: five stones on a low grass mound (no marks on the stones) |
| `A02.4` | Round ossuary tower | building | 6.33 × 7.8 × 6.99 | 1 | glb (`act1-a02-4-ossuary-tower`) | concept A02 cell 4 (E04 burial kit) | churchyard | GLB 6.3 × 7.8 × 7.0 m: body Ø 4.3–4.9 m over a flared stone skirt 6.0 × 6.7 m at the ground; placed ×0.85 (6.6 m tall, skirt 5.1 × 5.7 m) so the summit path end and the door candles keep their room; landmark on the dry summit, door faces the church |
| `A02.5` | Faceless saint statue supporting an arch (the Nameless Saint) | story | 2.48 × 4.3 × 1.82 | 1 | glb (`act1-a02-5-saint-statue-arch`) | concept A02 cell 5 (E04 burial kit) | churchyard | GLB 2.5 × 4.3 × 1.8 m: the arch ends at x ±1.24, the stepped plinth 1.64 × 1.47 m at walking height (only it blocks); arms raised, no crossbar. Yaw 0: its broad face meets the game camera (QA 10-23: seen side-on, the end blocks of its arch make a faint cross), so it faces down the slope toward the hub with the lychgate 37° to its right (it turns only off-screen); ON the path, which parts round its plinth, each lane ≈ 0.9 m from an end of its arch |
| `A02.6` | Funeral hand cart | prop | 3.2 × 1.4 × 1.61 | 1 | glb (`act1-a02-6-hand-cart`) | concept A02 cell 6 (E04 burial kit) | churchyard | GLB 3.2 × 1.4 × 1.6 m (bed 0.88–0.92 m) at its real size: replaces the kit tạm wheelbarrow ×1.2 |
| `A15.1` | Flint parish church | building | 16 × 9.87 × 10.69 | 1 | glb (`act1-a15-1-flint-church`) | concept A15 cell 1 (v2 batch) | churchyard | GLB 16 × 9.87 × 10.69 m (walls ±3.6 m, buttresses to ±5.35 m: the collision box is the full 10.7 m depth); bell-cote 9.9 m on the west gable; door west (−x), down the slope to the lychgate |
| `A16.1` | Churchyard yew | vegetation | 9.44 × 9 × 8.22 | 9 | glb (`act1-a16-1-yew`) | concept A16 cell 1 (v2 batch) | churchyard | GLB 9.4 × 9 × 8.2 m (crown about round); only at the edges; the trunk and its root flare block (4.4 × 4 m), the crown does not |
| `A16.2` | Tarred gibbet (empty cage) | structure | 4.69 × 4.6 × 2.69 | 1 | glb (`act1-a16-2-gibbet`) | concept A16 cell 2 (v2 batch) | churchyard | GLB 4.7 × 4.6 × 2.7 m (base of stones and grass, arm 2.4 m); no body, no noose; the post (GLB (−0.91, −0.09)) stands on the placement point; only the post and its stones block; crows |
| `A16.3` | Grave with jar candles | story | 1.98 × 0.93 × 2.2 | 28 | glb (`act1-a16-3-jar-candle-grave`) | concept A16 cell 3 (v2 batch) | churchyard | GLB 2.0 × 0.93 × 2.2 m (jars and grass round the mound; the mound blocks); the model's jars are unlit with sooty rims, but the LD keeps them lit by day (Act I) and all out in the Prologue night: three small still-flicker glows sit in three of its jars (flag graveCandles) |
| `A16.4` | Fresh grave | story | 1.77 × 0.82 × 2.4 | 2 | glb (`act1-a16-4-fresh-grave`) | concept A16 cell 4 (v2 batch) | churchyard | GLB 1.77 × 0.82 × 2.4 m (planks and the rope coil on +x, the spade at the foot) |
| `A16.5` | Unquiet grave (risen, mortsafe bent outward) | story | 2.48 × 1.15 × 2.6 | 1 | glb (`act1-a16-5-unquiet-grave`) | concept A16 cell 5 (v2 batch) | churchyard | GLB 2.5 × 1.15 × 2.6 m (stone kerb and spoil) |
| `A16.6` | Sexton's lamp post (bowl of milk for the Kind Ones) | structure | 1.3 × 2.6 × 0.8 | 2 | glb (`act1-a16-6-sexton-lamp`) | concept A16 cell 6 (v2 batch) | churchyard | GLB 1.3 × 2.6 × 0.8 m; the post (GLB (−0.29, −0.02)) stands on the placement point, only it blocks; the lamp glow sits on the model lantern (0.71 m out, 1.95 m up) |
| `N10` | Vigil chair with a folded blanket | prop | 0.6 × 1.03 × 0.73 | 1 | glb (`act1-a21-4-vigil-chair`) | concept A21 cell 4 (v3 batch) | churchyard | unmarked vignette: someone still keeps watch at a small grave. GLB 0.6 × 1.03 × 0.73 m: seat front +z, ladder back −z, the folded blanket on the seat (≈0.66 m) |
| `N11` | Crow (ambient; settles after the five rites) | story | 0.45 × 0.35 × 0.25 | 6 | **procedural** | LD only, no concept | churchyard |  |
| `A06.1` | Fen causeway segment | structure | 4 × 0.97 × 1.71 | 12 | glb (`act1-a06-1-causeway-open`) | concept A06 cell 1 (Night Fens kit) | fenroad | GLB 4 × 0.97 × 1.71 m (stone-and-plank top at 0.37 m), the lab variant -open (prepare-act1-kit.py CUT: its two end posts stand on its centre line, so end to end they put a pair of 0.6 m posts every 4 m down the road; cut out over the deck, stubs ≤ 0.15 m): laid along the dike road crest at a 3 m module (its deck spans x −1.75…+1.65: at 4 m the pieces read as dashed slabs with grass between, at 3 m they meet with ≈0.4 m of overlap), sunk 0.35 m so its top is flush with the terrain (Play walks the terrain); nothing blocks; the dike road out of the village toward the Night Fens |
| `A06.1-posts` | Dike revetment posts | structure | 2.31 × 0.9 × 0.51 | 13 | **kit** (`kit:fence.run_broken`) | concept A06 cell 1 (the causeway bank) | fenroad | kit tạm (Blood-Moor broken fence run, 2.31 m modules) as the revetment posts along the dike bank (the A06.1 GLB is the crest causeway) |
| `N-GH` | The Gentle House, far silhouette (gate tower + long ward + high warm still window) | story | 46 × 20 × 30 | 1 | glb (`act1-a18-4-hospice-range`) | act1 GLBs A18.4 ward range + 11 × A18.5 wall-with-niche sections (env/act1/gentleHouseFar.js); A11.4 gate tower still a box | far | shared far silhouette of the outdoor maps: the A18.4 range's own lit window carries the brightest, stillest light of the act (glow in the VFX layer: it reads through the fog); A11.4 has no model yet (box); if a GLB fails the full compound blockout stands in |

### Còn thiếu (12)

- **procedural (code tạo tạm)** (5): `N05` Poppy sprig on a door (the Act I accent) ×11 · `A03.1` Low grass clump ×900 · `A03.2` Tall reeds clump ×320 · `A03.3` Sedge water clump ×220 · `N11` Crow (ambient; settles after the five rites) ×6
- **kit tạm (kit cũ đứng thay)** (7): `N03` Rain barrel ×10 · `N06` Washing line ×2 · `N07` Drying fish net ×2 · `N08` Village goods (sacks, crates) ×3 · `N12` Peat barrow ×1 · `N09` Low shrubs / brambles at the edges ×44 · `A06.1-posts` Dike revetment posts ×13

### Quái

| Mã | Tên | Đoạn | Số | Ghi chú |
|---|---|---|---|---|
| `U01` | Rot-Shambler (Shambler, Act I tier) | churchyard | 10 | E1 ×5, E2 ×2, E7 ×3 · stand-in `zombie` · h 0.90–1.00 H |
| `U02` | Charnel Dead | churchyard | 4 | E2 ×3, E7 ×1 · stand-in `skeleton` |
| `U03` | Charnel Bowman | churchyard | 2 | E3, a pair; the first ranged enemy — open sightlines on the west shoulder · stand-in `skeleton_archer` |
| `U04` | Charnel Ghoul | churchyard | 2 | E4 by the edge yews · stand-in `spider` (fast, leaping) |
| `W02` | Gibbet-Crow | churchyard | 5 | E5 at the gibbet · stand-in `bat` (erratic flier) |
| `F01` | Body-snatcher | churchyard | 2 | E6, side quest The Mortsafe Thieves · stand-in `imp` (flees), spawned as single named uniques |

### NPC

- **Gennet Barrow** (hub) — the sexton; pipe ember at his door by the lychgate lane. Prologue: his lantern at the church door is the first warm light
- **Brannoc (the Mortsmith)** (hub) — forge east of the square; makes the mortsafes
- **Osric** (hub) — watch post at the west gate where the dike road leaves for the Night Fens
- **Nell Coppercoin** (hub) — grave-goods stall on the square
- **Tamsin** (hub) — by the sleeper name board
- **Children (×3)** (hub) — skipping and counting skulls under the ossuary, in the rain (Remember)
- **Edda** (hub) — her stilt house across the mere; side quest The Broth → Edda's Dream
- **Barrow family vault (door)** (hub) — side quest One for the Footing; the door in the terrace wall under the ossuary

### Texture

| Texture | Có | Ghi chú |
|---|---|---|
| BIO01_peat | có | wet peat: the base of the island, the village, the fen edge |
| BIO03_flint | có | knapped flint: church platform, summit, vault terrace, lychgate threshold, steep cuts |
| DW_damp (darkwood soil-damp) | có | damp soil near water and round the cottages |
| DW_grass (darkwood grass) | có | churchyard turf |
| DW_dense (darkwood grass-dense) | có | rank grass at the edges |
| DW_dirt (darkwood dirt) | có | tracks, grave earth, yards |
| DW_mud (darkwood mud) | có | lane edges, mere banks, fresh graves, puddles |
| darkwood-sty-green-cobble | có | cobble ribbon of the village lane (a Dark Wood stand-in, not BIO-03) |
| biome-darkwood-water-n | có | ripple normal of the fen and the mere |
| biome-shore-plants · biome-darkwood-grass-cards | có | reed / sedge and grass card atlases |
| cobble road with grass verge (BIO-03 lane) | **thiếu** | A05 cell 3 concept only; needs a periodic tile + verge |
| churchyard turf and grave earth | **thiếu** | A05 cell 5 concept only; the base uses darkwood grass + dirt |
| fen shore mud → water | **thiếu** | A05 cell 2 concept only; the base uses darkwood mud + soil-damp + the water mesh |
| peat meadow floor (tile) | **thiếu** | A05 cell 1 concept only; BIO01_peat stands in |
| knapped flint wall + lime mortar (walls, church) | **thiếu** | blockouts are flat-coloured; the wall material does not exist yet |
| thatch (patched) roof | **thiếu** | stilt cottages, forge, well roof |

### VFX

| Hiệu ứng | Có | Ghi chú |
|---|---|---|
| drizzle / rain | **thiếu** | placeholder: CPU streaks round the camera (rain slider); needs the real drizzle + splashes + water ripples |
| low mist in the hollows | **thiếu** | placeholder: drifting soft sheets + the post height fog; thins after the five rites (toggle) |
| human lights (windows, forge, lamps, candles) | **thiếu** | placeholder: point lights with 1/f flicker + still glow sprites; needs flames (FlameField), forge sparks |
| peat smoke from chimneys | **thiếu** | not built |
| Gennet's pipe ember + smoke | **thiếu** | placeholder: a tiny flickering glow |
| jar candle flames on graves | **thiếu** | placeholder: tiny glows (day), out in the Prologue night |
| crows (flock, settling after the rites) | **thiếu** | placeholder: still crow blockouts; circling vs perched by the rites toggle |
| rite of laying (kneel, "Will you hold?") | **thiếu** | markers only |
| Gentle House window (still, warm, far) | **thiếu** | placeholder: a big still glow in the VFX layer (not fogged) on the far silhouette |
| unquiet grave: earth heaving before a Shambler | **thiếu** | not built |

## Night Fens → Rook's Weir — `fens`

Scene `act1Fens` · engine outdoor · BIO-01 · file `src/env/act1/maps/fens.js` · độ dài đề xuất: 520 m — Full game: the Night Fens (35 min, D4 C3) want ≈ 1.1 km of dike route through ≈ 520 × 400 m with open / choke every 40–60 s (≈ 225–335 m of route) — this slice compresses that to a beat every ≈ 15–25 s (≈ 290 m of fen route); Rook's Weir (18 min, D4 C2) wants ≈ 220 × 220 m with 2–3 times the plank network shown here (≈ 190 m of planks, 2 walkable roofs). Keep: no walkable open water, the far window across the Procession Mere, the lullaby breadcrumbs.

Mã asset: 49 — glb (model ASHLAR thật): **38** · kit tạm (kit cũ đứng thay): **4** · procedural (code tạo tạm): **4** · blockout (khối thay thế): **3**.

### Asset

| Mã | Tên | Loại | Cỡ (m) R × C × S | Số | Trạng thái | Nguồn | Đoạn | Ghi chú |
|---|---|---|---|---|---|---|---|---|
| `A06.1` | Fen causeway segment | structure | 4 × 0.97 × 1.71 | 29 | glb (`act1-a06-1-causeway-open`) | concept A06 cell 1 (Night Fens kit) | fens | GLB 4 × 0.97 × 1.71 m (stone-and-plank top at 0.37 m), the lab variant -open (prepare-act1-kit.py CUT: its two end posts stand on its centre line, so end to end they put a pair of 0.6 m posts every 4 m down each dike; cut out over the deck, stubs ≤ 0.15 m): laid along the crests of D1, D2 and D4 (2.8 m) at a 3 m module (its deck spans x −1.75…+1.65: at 4 m the pieces read as dashed slabs with grass between, at 3 m they meet with ≈0.4 m of overlap), sunk 0.35 m so its top is flush with the terrain (Play walks the terrain); nothing blocks |
| `A06.1-posts` | Dike revetment posts | structure | 2.31 × 0.9 × 0.51 | 36 | **kit** (`kit:fence.run_broken`) | concept A06 cell 1 (the causeway bank) | fens | kit tạm (Blood-Moor broken fence run, 2.31 m modules): the revetment posts along the dike banks below the crest (no collision needed); the A06.1 GLB is the crest causeway |
| `A06.2` | Lichen standing stone (upright marker stone) | rock | 2.19 × 2.6 × 1.44 | 10 | glb (`act1-a06-2-marker-stone`) | concept A06 cell 2 (Night Fens kit) | fens | GLB 2.2 × 2.6 × 1.4 m (base rubble and the lean; the stone ≈ 1.15 × 0.85 m stands at GLB x +0.24: each placement is moved −0.24 m along its x so the stone keeps its point); blocks on the stone and its rubble at walking height; a ring of five on the stone island (rite 1), singles as route markers on the dikes |
| `A06.3` | Stepping-stone ford | rock | 3.33 × 0.71 × 7 | 2 | glb (`act1-a06-3-stepping-ford`) | concept A06 cell 3 (Night Fens kit) | fens | GLB 3.3 × 0.71 × 7 m: six stones and a plank along its z, one per ford (was seven river-stone tiles each); base 0.44 m under the ford causeway (0.5 m under the water) so the stone tops stand 0.1–0.2 m above the water; the causeway 6 cm under the water stays the walk surface (the hero wades), the stones are walk-through |
| `A06.4` | Unlit bog-lure post (empty cage) | structure | 1.81 × 2.9 × 1.33 | 8 | glb (`act1-a06-4-bog-lure-post`) | concept A06 cell 4 (Night Fens kit) | fens | GLB 1.8 × 2.9 × 1.3 m: no flame, no glass (never lit: the corpse-candles are the lure); the post on its stone footing stands at GLB x −0.31 (each placement moved +0.31 m along its x so the post keeps its bank point), the arm with the empty cage reaches +x like the blockout; only the post and footing block; on the dike banks, base at the waterline; replaces the kit tạm lantern post |
| `A06.5` | Half-sunk fen punt | prop | 3.4 × 0.47 × 1.06 | 5 | glb (`act1-a06-5-fen-punt`) | concept A06 cell 5 (Night Fens kit) | fens | GLB 3.4 × 0.47 × 1.06 m (the hull only 0.47 m tall): sunk 0.15 m under the water level (the blockout sat 0.3 m down; the GLB would vanish) |
| `A06.6` | Broken bridge pier | structure | 5.96 × 5 × 4.04 | 2 | glb (`act1-a06-6-bridge-pier`) | concept A06 cell 6 (Night Fens kit) | fens | GLB 6 × 5 × 4 m (pier + arch stub springing to −x, chunkier than the concept): placed ×0.75 (4.5 × 3.75 × 3.0 m); two piers of the fallen bridge stand in the channel; the route detours over the ford |
| `A17.1` | The leaning stones (Act I arch) | story | 5.6 × 4.31 × 2.3 | 1 | glb (`act1-a21-5-leaning-stones-wide`) | concept A21 cell 5 (v3 batch, the A17.1 redraw) | fens | THE landmark of the fens: over the dike, the passage along local z (the path). GLB A21.5 -wide 5.6 × 4.31 × 2.3 m (the lab variant of prepare-act1-kit.py WARP: each stone splayed out 0.5 m below 2.2 m, tapering to 0 at the top; the plain A21.5 opens only 1.6–1.75 m): passage 2.60 / 2.70 / 2.70 m at 0.1 / 1 / 2.2 m (x −1.35…+1.25), headroom 3.54 m, the tops touch at 4.25 m; no ground disc. Blocks on the two stones only (1.55 × 2.3 m at x ±2.03, inner edges ±1.25: 2.5 m between them); 2.3 m deep along the path (the def was 1.4), standing on the 5.6 m wide ARCH footing of D2 |
| `A03.1` | Low grass clump | vegetation | 0.6 × 0.5 × 0.6 | 520 | **procedural** | concept A03 cell 1 (E01 fen kit) | both | Dark Wood grass cards on the grass layers (crests, islands) |
| `A03.2` | Tall reeds clump | vegetation | 0.8 × 1.8 × 0.8 | 1600 | **procedural** | concept A03 cell 2 (E01 fen kit) | both | shore-plant cards: fringes on every bank and dense reed shoals in the open water (sheet reads up to ≈ 2.5 m) |
| `A03.3` | Sedge water clump | vegetation | 0.7 × 0.9 × 0.7 | 185 | **procedural** | concept A03 cell 3 (E01 fen kit) | both |  |
| `A03.4` | Large moss rock | rock | 2.63 × 1.6 × 3.12 | 7 | glb (`act1-a03-4-moss-rock`) | concept A03 cell 4 (E01 fen kit) | fens | GLB 2.6 × 1.6 × 3.1 m (long axis along z), placed ×0.75–0.99; replaces the kit tạm Blood-Moor mossy rock |
| `A03.5` | Peat bank chunk | rock | 3 × 1.4 × 1.58 | 9 | glb (`act1-a03-5-peat-bank`) | concept A03 cell 5 (E01 fen kit) | fens | GLB 3 × 1.4 × 1.6 m (cut face +z, grass top at 1.05 m, roots behind) |
| `A03.6` | Waterlogged root stump | vegetation | 2.4 × 1.3 × 2.5 | 7 | glb (`act1-a03-6-root-stump`) | concept A03 cell 6 (E01 fen kit) | both | GLB 2.4 × 1.3 × 2.5 m (roots all round, the concept proportion), placed ×0.7–0.9; blocks on its stump and inner roots (1.7 m at walking height); replaces the kit tạm dead-tree stump (it was stretched to 1.4 × 1.3 × 1.4) |
| `A04.1` | Old broad weeping willow | vegetation | 6.52 × 5.4 × 6.86 | 7 | glb (`act1-a04-1-old-willow`) | concept A04 cell 1 (E02 willow kit) | fens | GLB 6.5 × 5.4 × 6.9 m; placed at ×1.0–1.25 on the islands; the trunk (off the bbox centre, GLB (+0.2, −0.3)) blocks, the hanging fronds are walk-through |
| `A04.2` | Young willow | vegetation | 4.94 × 6 × 5.22 | 3 | glb (`act1-a04-2-young-willow`) | concept A04 cell 2 (E02 willow kit) | fens | GLB 4.9 × 6 × 5.2 m; along the side dike to the Willow Mere; only the trunk blocks |
| `A04.3` | Dead angular tree | vegetation | 4.21 × 7 × 4.1 | 20 | glb (`act1-a04-3-dead-tree`) | concept A04 cell 3 (E02 willow kit) | fens | GLB 4.2 × 7 × 4.1 m (branches spread; the kit tạm Blood-Moor tree was stretched to 3 × 7 × 3); many stand in the open water (base under the water line); the trunk and its root flare block |
| `A04.5` | Fallen hollow trunk | vegetation | 5 × 1.64 × 2.34 | 5 | glb (`act1-a04-5-hollow-trunk`) | concept A04 cell 5 (E02 willow kit) | fens | GLB 5 × 1.64 × 2.34 m (branch stubs, root plate −x, hollow end +x; moss top ≈ 1.05 m) |
| `A04.6` | Exposed willow root cluster | vegetation | 5.02 × 2.2 × 4.96 | 1 | glb (`act1-a04-6-willow-roots`) | concept A04 cell 6 (E02 willow kit) | fens | GLB 5 × 2.2 × 5 m; on the side dike to the Willow Mere (its kit is the Mere's) |
| `glb:biome-prop-riverbank-stones` | Riverbank stones | rock | 1 × 0.35 × 1 | 9 | glb (`biome-prop-riverbank-stones`) | ashlar/3d/props/clutter_v1/riverbank_stones | both |  |
| `glb:biome-prop-stump` | Mossy stump | vegetation | 0.8 × 0.5 × 0.8 | 4 | glb (`biome-prop-stump`) | ashlar/3d/props/clutter_v1/mossy_stump | fens |  |
| `glb:biome-prop-mushrooms` | Mushroom cluster | vegetation | 0.4 × 0.3 × 0.4 | 5 | glb (`biome-prop-mushrooms`) | ashlar/3d/props/clutter_v1/mushroom_cluster | fens |  |
| `glb:dungeon-prop-candle-cluster` | Candle cluster (unlit) | prop | 0.8 × 0.8 × 0.8 | 2 | glb (`dungeon-prop-candle-cluster`) | ashlar/3d/props/dungeon_v1/candle_cluster | both | at the rite sites, all out: no human light in the night fens |
| `glb:dungeon-prop-fallen-bell` | Fallen bell (drowned) | prop | 1.3 × 1.25 × 1.3 | 1 | glb (`dungeon-prop-fallen-bell`) | ashlar/3d/props/dungeon_v1/fallen_bell | weir | half under the black water below the drowned bell tower |
| `A07.1` | Half-drowned flint cottage | building | 7.76 × 6.2 × 6.25 | 9 | glb (`act1-a07-1-drowned-cottage`) | concept A07 cell 1 (Rook's Weir kit) | weir | GLB 7.8 × 6.2 × 6.3 m with the eaves (door and two windows +z, chimney at −x); base 1.2 m under the water as the walls continue under it; no lit window (the village is empty) |
| `A07.2` | Timber-and-stone weir segment | structure | 4.2 × 0.99 × 0.43 | 9 | glb (`act1-a07-2-weir`) | concept A07 cell 2 (Rook's Weir kit) | weir | GLB 4.2 × 0.99 × 0.43 m (keyed on its 4.2 m length it reads low): placed ×1.5 (6.3 × 1.5 × 0.64 m, run modules 6.3 m); run along the south face of the weir dike (its crest is the walk); two broken segments stand in the water west of it |
| `A07.3` | Gable wall with door arch | building | 6.96 × 5.3 × 1.01 | 2 | glb (`act1-a07-3-gable-wall`) | concept A07 cell 3 (Rook's Weir kit) | weir | GLB 7 × 5.3 × 1 m, crow-stepped gable, door arch 1.25 × 2.33 m (x −0.53…+0.72, the concept size): the two supper-house walls (the L7 spur ends at the east one's doorway); blocks on the wall either side of the door. The wall the plank lane passes through and the rite-5 doorway keep the blockout (A07.3-door: Play needs its 2.2 m door; the GLB would need ×1.76 = 12 m wide) |
| `A07.3-door` | Gable wall with door arch (the widened Play door) | building | 5 × 5.3 × 0.7 | 2 | **blockout** | concept A07 cell 3 (Rook's Weir kit) | weir | blockout kept (kit swap 10-23): the plank lane L2 passes through this one and the other is rite 5, both with the door widened to 2.2 × 2.6 m for Play; the A07.3 GLB door is 1.25 m wide and 2.33 m clear (the deck 0.62 m up would put the hero's head through its lintel) |
| `A07.4` | Sunken roof-ridge platform | building | 6 × 3.12 × 4.29 | 2 | glb (`act1-a07-4-roof-platform`) | concept A07 cell 4 (Rook's Weir kit) | weir | GLB 6 × 3.12 × 4.3 m: a thatch roof with a plank on its ridge and a brick chimney on the ridge at +x (GLB x 1.1–2.2, top 3.1 m); the ridge rises 1.4 → 2.2 m along x; the two unwalked roofs in the water. The two that carry the plank walk keep the blockout (A07.4-walk): the chimney stands in the walk |
| `A07.4-walk` | Sunken roof-ridge platform (walked) | building | 6 × 3.2 × 4.8 | 2 | **blockout** | concept A07 cell 4 (Rook's Weir kit) | weir | blockout kept (kit swap 10-23): ridge 1.0 m above the water, it carries the plank walk (walkways `ridgeW`, `ridgeE`): "walk on roofs"; the A07.4 GLB's chimney stands on its ridge in the walk (1 m over the planks) and its ridge rises 0.8 m along its length |
| `A07.5` | Pontoon plank raft | structure | 3.6 × 1.4 × 1.8 | 3 | glb (`act1-a07-5-plank-raft`) | concept A07 cell 5 (Rook's Weir kit) | weir | GLB 3.6 × 1.4 × 1.8 m: plank deck on four barrels, deck top 0.81 m over the barrel bottoms (QA: the barrel ends are open rings, minor); placed so its deck top is the raft walkway (0.5 m, hidden: the walk surface only, 1.8 m wide like the raft); a rope rail along its −z edge (0.6 m over the deck) and a 0.3 m rope post at its −x end stay out of the collision (on the deck edge / at a lane joint) |
| `A07.6` | Rook roost (dead tree) | structure | 4.19 × 3.42 × 1.81 | 6 | **kit** (`kit:deadTrees.tall`) | concept A07 cell 6 (Rook's Weir kit) | weir | kit tạm kept (kit swap 10-23): a Blood-Moor dead tree at ×1.35 standing in the water (base 0.4 m under it, top ≈ 4.2 m above it; the concept pole is 4.75 m) — rooks nest in dead trees; they circle it and settle on its branch tips. The A07.6 GLB waits: its pole rises 0.5 m over the nest bar (a cross from the camera; the user picks it or the -trim) and the QA (10-23) found the nest bar dropped in the split (the upper nests float): a Tripo redo. Not the blockout either: its pole rises 1 m over a crossbar (the same cross) |
| `A01.2` | Raised wooden walkway segment (plank bridge) | structure | 4 × 2.16 × 1.99 | 25 | glb (`act1-a01-2-walkway`) | concept A01 cell 2 (E03 village kit) | weir | GLB 4 × 2.16 × 2 m (deck 1.75 m wide, top 1.22 m over its base): the plank bridges of Rook's Weir, laid end to end along the A01.2 walkways (deckPieces) with the deck top on the walk deck (0.62 m; the walkways are `hidden`: the walk surface only); a rope rail on its −z side and two short corner posts on +z, the open side to the camera; rail and posts out of the collision like the blockout posts |
| `A01.5` | Village well | structure | 2.73 × 3.4 × 2.39 | 1 | glb (`act1-a01-5-village-well`) | concept A01 cell 5 (E03 village kit) | weir | GLB 2.7 × 3.4 × 2.4 m with its stone apron: the drowned village well on its stone platform (WELL): the junction of the plank lanes and the one dry spawn spot |
| `A17.2` | Drowned bell tower | building | 5.74 × 10 × 7.1 | 1 | glb (`act1-a17-2-drowned-bell-tower`) | concept A17 cell 2 (v2 batch) | weir | GLB 5.7 × 10 × 7.1 m (with the rook's nest on −x), cut flat at the waterline: its base stands 0.25 m under the water (≈ 9.75 m above it), not on the bed; louvres, bell, patched slate cap |
| `A17.3` | The Gentle House boat (linen canopy, still white lamp) | story | 7 × 3.23 × 2.02 | 1 | glb (`act1-a17-3-gentle-boat`) | concept A17 cell 3 (v2 batch) | weir | GLB 7 × 3.23 × 2.02 m, keel 0.25 m under the water; moored along the dock's deck edge; the canopy is Mercy's clean linen, the bow lamp burns still and even (Perfection light, on the model lamp) |
| `A17.4` | Flooded supper table (laid for supper) | prop | 2.4 × 1.31 × 1.46 | 1 | glb (`act1-a17-4-flooded-supper-table`) | concept A17 cell 4 (v2 batch) | weir | GLB 2.4 × 1.31 × 1.46 m; in the roofless supper-house ruin: the top (0.94 m) lies 0.14 m under the water; the jug and chair backs break the surface |
| `A17.5` | Flooded window with lace curtains | building | 2.2 × 2.21 × 1.39 | 1 | glb (`act1-a17-5-flooded-lace-window`) | concept A17 cell 5 (v2 batch) | weir | GLB 2.2 × 2.21 × 1.39 m (the lace is a solid mass; its dark half-disc floor behind the wall lies under the black water); the north wall of the supper-house ruin, seen from its doorway, sill 0.15 m above the water |
| `A17.6` | Gentle House night dock | structure | 6 × 3.44 × 2.96 | 1 | glb (`act1-a17-6-gentle-dock`) | concept A17 cell 6 (v2 batch) | weir | GLB 6 × 3.44 × 2.96 m, deck 0.94 m above its base: placed so the deck top is the walkway `dock` (0.62 m; the posts end 0.3 m under the water), whose own planks are hidden (walk surface only); the still white lamp hangs from the bracket of the tall lamp post (+z side, far end) over a short post wrapped in a strip of clean linen. Walk blockers on the posts only (measured in the GLB frame: four mooring posts 0.4–0.5 m proud of the deck, the +z far one with the linen and the lamp over it, and the tall lamp post); the deck lane between them stays ≥ 1.5 m wide |
| `N-FN01` | The Soothed in procession (P01 stand-in figures, white nightgowns) | linen | 0.55 × 1.75 × 0.45 | 12 | **blockout** | LD only, no concept (P01 sheet: ashlar/art/map-01-concepts/monsters) | fens | the Remember image: a line wading waist-deep along the drowned road toward the far window; the only clean white in Dolmoor |
| `N-FN02` | Shoes left at the water's edge (unmarked vignette) | prop | 0.45 × 0.18 × 0.44 | 1 | glb (`act1-a22-1-worn-shoes`) | concept A22 cell 1 (v3 batch) | fens | GLB 0.45 × 0.18 × 0.44 m: the pair side by side, both toes +z |
| `N-FN03` | Bog grave (peat mound, willow stake, ribbons) | story | 1.34 × 1.4 × 2.4 | 1 | glb (`act1-a21-6-bog-grave`) | concept A21 cell 6 (v3 batch) | fens | rite 4. GLB 1.34 × 1.4 × 2.4 m (replaces the A16.4 fresh-grave stand-in): the peat mound ≈0.5 m, the ribboned willow stake (1.4 m) at the far end (−z), the foot end +z, a ring of stones; blocks on the stake only (0.3 × 0.3 m at GLB x 0.30…0.60, z −0.60…−0.30: it leans from (0.47, −0.43) 0.75 m up to (0.34, −0.52) at its 1.4 m top; review a2x F-c), the mound, the stones and the ribbons stay walk-through as before |
| `N-FN04` | Small stone cairn | rock | 1.73 × 0.84 × 1.36 | 1 | **kit** (`kit:rocks.low`) | LD only, no concept | fens | kit tạm (Blood-Moor low rock at its own size; the old shrine cairn was squashed ×0.5): the heart of the lichen ring, rite 1 |
| `N-FN05` | Drying eel net | prop | 4 × 1.8 × 1.4 | 1 | **kit** (`kit:crafts.fishing_net`) | LD only, no concept | fens | kit tạm: the eel-catcher's net at rite 2 |
| `A01.6` | Eel-trap fishing rack | structure | 4.7 × 3 × 1.98 | 1 | glb (`act1-a01-6-eel-trap-rack`) | concept A01 cell 6 (E03 village kit) | fens | GLB 4.7 × 3.0 × 2.0 m placed ×0.85 (4.0 × 2.55 m); rite 2: the drowned eel-catcher's rack by the broken bridge; replaces the kit tạm fishing net |
| `N-FN06` | Toll post with a coin dish (The Ferryman's Toll) | story | 0.91 × 1.3 × 0.67 | 1 | glb (`act1-a22-2-toll-post`) | concept A22 cell 2 (v3 batch) | weir | GLB 0.91 × 1.3 × 0.67 m: the post stands at x −0.11 (the coin-dish shelf juts out at +x, the dish ≈0.84 m up; the tag and rope at the front +z); placed so the post is on the toll point, the dish turned to the dock lane; blocks on the post only (0.36 m square) |
| `N-FN07` | Rook (ambient, circling the roost poles) | story | 0.45 × 0.35 × 0.25 | 8 | **procedural** | LD only, no concept | weir | they circle until the Count is done (toggle "các mộ đã yên"), then settle on the poles |
| `N-FN08` | Empty wicker cradle | story | 1 × 0.62 × 0.65 | 2 | glb (`act1-a22-3-wicker-cradle`) | concept A22 cell 3 (v3 batch) | fens | in the Lullaby Man's arena. GLB 1.0 × 0.62 × 0.65 m: long side +z, hood at −x, upright on its rockers; blocks as one box (0.9 × 0.65 m) |
| `N-GH` | The Gentle House, far silhouette (gate tower + long ward + high warm still window) | story | 46 × 20 × 30 | 1 | glb (`act1-a18-4-hospice-range`) | act1 GLBs A18.4 ward range + 11 × A18.5 wall-with-niche sections (env/act1/gentleHouseFar.js); A11.4 gate tower still a box | far | shared far silhouette of the outdoor maps: the A18.4 range's own lit window carries the brightest, stillest light of the act (glow in the VFX layer: it reads through the fog); A11.4 has no model yet (box); if a GLB fails the full compound blockout stands in |

### Còn thiếu (11)

- **blockout (khối thay thế)** (3): `A07.3-door` Gable wall with door arch (the widened Play door) ×2 · `A07.4-walk` Sunken roof-ridge platform (walked) ×2 · `N-FN01` The Soothed in procession (P01 stand-in figures, white nightgowns) ×12
- **procedural (code tạo tạm)** (4): `A03.1` Low grass clump ×520 · `A03.2` Tall reeds clump ×1600 · `A03.3` Sedge water clump ×185 · `N-FN07` Rook (ambient, circling the roost poles) ×8
- **kit tạm (kit cũ đứng thay)** (4): `A06.1-posts` Dike revetment posts ×36 · `A07.6` Rook roost (dead tree) ×6 · `N-FN04` Small stone cairn ×1 · `N-FN05` Drying eel net ×1

### Quái

| Mã | Tên | Đoạn | Số | Ghi chú |
|---|---|---|---|---|
| `P01` | The Soothed | crossing | 8 | E3 ×5 on the crossing island (hear, see, then fight: they are victims), E6 ×3 escorting the Lullaby Man · stand-in `zombie` · h 0.90–1.00 H, white nightgown #E8E1D0; the procession figures (N-FN01) are dressing, not camps |
| `W03` | Hush-Wolf | ford | 3 | E4 at the west end of the ford · stand-in `spider` (fast pack hunter) |
| `W04` | Mire-Sucker | stones | 7 | E1 ×4 off the stone island, E7 ×3 on the willow dike (water edges) · stand-in `bat` (erratic flier) |
| `W05` | Corpse-Candle | ford | 5 | E5 ×3 over the lure posts, E9 ×2 in Rook's Weir · stand-in `wraith` (mana burn ≈ "drains resources"); their still pale-blue glows (#D8E7EF) are in the light layer |
| `U05` | The Swollen | arch | 4 | E2 ×2 before the arch, E5 ×1, E10 ×1 on a Rook's Weir raft · stand-in `zombie` (slow; kept > 14 m from the P01 camps so the names stay right) |
| `B02` | The Lullaby Man (mid-boss) | arena | 1 | E6 on his island · stand-in `brute` (unique) · h 2.0–2.4 H with a cradle-cage on his back that must not be hit |
| `U01` | Mire-Shambler (Shambler, Rook's Weir tier) | weir | 3 | E8 on the weir crest · stand-in `zombie` |

### NPC

- **The dead ferryman** (dock) — side quest The Ferryman's Toll: at the stern of the Gentle House boat by the night dock, poling sleepers under the linen canopy, asking for one more coin (Remember)

### Texture

| Texture | Có | Ghi chú |
|---|---|---|
| BIO01_peat | có | wet peat: dike crests, island tops |
| DW_mud (darkwood mud) | có | banks, shores, the shallows |
| DW_damp (darkwood soil-damp) | có | damp crests |
| DW_dense / DW_sparse / DW_grass (darkwood grass set) | có | rank grass, thin grass, island meadow |
| DW_dirt (darkwood dirt) | có | the trodden strip on the dikes, the arena, the rite sites |
| biome-darkwood-water-n | có | ripple normal of the black water |
| biome-shore-plants · biome-darkwood-grass-cards | có | reed / sedge and grass card atlases |
| fen shore mud → water (A05 cell 2) | **thiếu** | concept only; the base uses darkwood mud + the water mesh |
| peat meadow floor (A05 cell 1) | **thiếu** | concept only; BIO01_peat stands in |
| dike crest: flagstones + trodden peat (A06.1 top) | **thiếu** | the causeway top of the concept; the base paints dirt on peat |
| reed-bed litter / floating mat at the shores | **thiếu** | not made |
| lichen standing stone material | **thiếu** | blockouts are flat-coloured |
| knapped flint walls + thatch (drowned cottages, gable walls) | **thiếu** | shared need with map 1 (A15) — blockouts are flat-coloured |
| still black water that mirrors the houses | **thiếu** | the water mesh has a ripple normal + env reflection only; needs planar reflection / SSR and a calm-water preset |

### VFX

| Hiệu ứng | Có | Ghi chú |
|---|---|---|
| mist lying on the water | **thiếu** | placeholder: the drifting low sheets + post height fog (mist × mood: 1.0 in the night, 0.45 still) |
| more stars than usual (cold, still, too even) | **thiếu** | placeholder: a still star dome in the far frame (mood stars); no twinkle, slightly too regular |
| corpse-candles (W05 lures) | **thiếu** | placeholder: 4 still pale-blue point lights + 14 still glows; needs a pale flame with a faint face, slow hover, still light |
| Gentle House window (still, warm, far) | **thiếu** | placeholder: a big still glow in the VFX layer on N-GH (the only warm point of the map) |
| dock lamp + boat lamp (still white, Mercy) | **thiếu** | placeholder: 1 still white point light + 2 still glows |
| the Soothed procession (wading, humming) | **thiếu** | placeholder: 12 still white figure blockouts on the drowned road; needs the walk cycle, wading ripples, the hum |
| lullaby (sound is the map) | **thiếu** | markers only (kind sound, RU1–RU7); needs positional audio of the lullaby with the falloff the markers show |
| rooks circling the roost poles | **thiếu** | placeholder: the procedural crows circling / settled by the toggle |
| water ripples / wading rings, frogs falling silent when the Soothed pass | **thiếu** | not built |

## The Poppy Reach — `poppyReach`

Scene `act1PoppyReach` · engine outdoor · BIO-02 · file `src/env/act1/maps/poppyReach.js` · độ dài đề xuất: 520 m — Full game (28 min, D3 C3): ≈ 520 m of the Reach road over a ≈ 300 × 420 m hillside (≈ 95 s of running, 4–5 open / choke cycles of 40–60 s, 6–8 smoke banks, a second farm, the Delvings mouth on a longer east flank). This slice has ≈ 300 m of road (≈ 55 s) with the cycle compressed to 5–15 s per beat; keep the climb north toward the warm window, the walls as lane makers and the fen at the foot.

Mã asset: 31 — glb (model ASHLAR thật): **17** · kit tạm (kit cũ đứng thay): **6** · procedural (code tạo tạm): **4** · blockout (khối thay thế): **4**.

### Asset

| Mã | Tên | Loại | Cỡ (m) R × C × S | Số | Trạng thái | Nguồn | Đoạn | Ghi chú |
|---|---|---|---|---|---|---|---|---|
| `A08.1` | Poppy drift clump | vegetation | 1.3 × 0.9 × 1.3 | 36000 | **procedural** | concept A08 cell 1 | all | the field: ≈ 36 000 instanced clumps (6–8 stems, cupped red #B3262A heads, buds) in drifts with breathing room, swaying with the wind; the placed items mark the drift centres. Sheet clump ≈ 0.6 H tall, field clumps 0.42–0.82 m |
| `A08.2` | Drystone wall (module) | structure | 3.2 × 0.84 × 0.96 | 299 | glb (`act1-a08-2-drystone-wall`) | concept A08 cell 2 | all | GLB 3.2 × 0.84 × 0.96 m (keyed on the 3.2 m module it reads low: top 0.53–0.84 m, 0.96 m deep with the grass at its foot; its stone ends fall 0.02–0.19 m short of the box): every wall run is placed ×1.25 (4 m pieces, 1.05 m tall) at a 2.8 m module (3.5 m apart: the ragged ends overlap, no gaps); blocks on its stone core (0.6 × 1.25 = 0.75 m deep, the blockout was 0.7), the grass foot is walk-through; field walls make the lanes; on a slope each module stands on its lowest ground (stepped walls); also the round sheepfold. Base colour greyed and darkened to ~0.7 in the prep (prepare-act1-kit.py TINT, kit fix 10-23: the pale cream stone read near-white, the brightest thing in every view) |
| `A08.2-stile` | Squeeze stile in a drystone wall | structure | 3.2 × 1.3 × 0.7 | 1 | **blockout** | concept A08 cell 2 (the stile in the wall) | farm | blockout kept (kit swap 10-23): the A08.2-stile GLB has no gap (its wall runs through, top 0.6–0.89 m with a dip to 0.61 m); the map needs a 1.8 m walkable gap with a worn sill and step stones (the walk grid passes, the wall stubs block) |
| `A08.3` | Abandoned hillside farmhouse | building | 8 × 6.4 × 5.4 | 1 | **blockout** | concept A08 cell 3 | farm | blockout kept (kit swap 10-23): walls 2.7 m, ridge 5.4 m, chimney 6.4 m; the east half of the roof has fallen in (bare rafters) so the three empty beds show from above; the door (1.8 m) is walkable (the farm route goes in to V1). The A08.3 GLB is a closed house: its door is shut on the east gable, the roof whole, the inside a hollow shell with no floor; a roofless height cut would still leave no way in (and single-sided walls seen from inside), so the beat waits for a ruined-farmhouse model |
| `A08.4` | Hay rick | prop | 2.99 × 3.2 × 3.64 | 6 | glb (`act1-a08-4-hay-rick`) | concept A08 cell 4 | all | GLB 3 × 3.2 × 3.6 m (round, a straw skirt makes it 3.6 m deep) |
| `A08.5` | Field gate between stone posts | structure | 4.4 × 1.6 × 0.7 | 4 | **blockout** | concept A08 cell 5 | all | blockout kept (kit swap 10-23): the gates stand swung open into the field, 3.2 m between the posts (the lanes run through them); the A08.5 GLB's five-bar gate is shut across its posts (fine only off the lanes) |
| `A08.6` | Poppy-drying rack | prop | 3.6 × 2.93 × 1.8 | 4 | glb (`act1-a08-6-poppy-rack`) | concept A08 cell 6 | farm | GLB 3.6 × 2.93 × 1.8 m (red poppy heads hang +z of the bar, a bench at 0.77 m), placed ×0.9 (3.2 × 2.6 m); replaces the kit tạm herb rack |
| `A18.1` | Abandoned ox cart with bedding | prop | 2.31 × 1.85 × 4 | 1 | glb (`act1-a18-1-ox-cart`) | concept A18 cell 1 (v2 batch) | landing | GLB 2.3 × 1.85 × 4 m; shafts down, quilts, a straw mattress and one clean pillow — as if someone was carried away asleep (vignette) |
| `A18.2` | Farmhouse bed with one clean pillow | prop | 1.57 × 0.98 × 2 | 4 | glb (`act1-a18-2-bed-clean-pillow`) | concept A18 cell 2 (v2 batch) | farm | GLB 1.57 × 0.98 × 2 m (drooping blanket); three in the farmhouse at ×0.85 (1.33 m wide: three fit side by side in the 3.8 m east half under the fallen roof), empty, each one clean pillow — Mercy's linen; one at ×1 dragged out into the poppies (unmarked vignette) |
| `A18.3` | Flint Delvings mine mouth (chalk-and-flint cut) | rock | 4 × 2.69 × 3.77 | 1 | glb (`act1-a18-3-delvings-mouth`) | concept A18 cell 3 (v2 batch) | mine | GLB 4 × 2.69 × 3.77 m placed ×1.34 (5.4 × 3.6 × 5.0 m, lintel ≈ 2.9 m): a rock knoll with its own timber portal (the old mine-timber GLB is dropped); the portal is a painted recess, not a tunnel, so the whole knoll blocks (two crossed rects ≈ its round footprint); the plain back is turned into the chalk knoll; the side exit to the Flint Delvings (11.8) is a trigger at the face |
| `A18.4` | Hospice ward range (exterior) | building | 30 × 13.44 × 10.54 | 1 | glb (`act1-a18-4-hospice-range`) | concept A18 cell 4 (v2 batch) | top | GLB 30 × 13.4 × 10.5 m (walls ±4.1 m, porches to ±5.3 m); brand-new whitewash, not one patch; one high window warm and still (Perfection light, on the model's own lit window, upper row): the act image, seen from the foot of the slope |
| `A18.5` | Hospice boundary wall with niche (still candle) | building | 6 × 2.95 × 0.85 | 20 | glb (`act1-a18-5-hospice-wall-niche`) | concept A18 cell 5 (v2 batch) | top | GLB 6 × 2.95 × 0.85 m (end piers let the sections run on; plain whitewash back); every section has its niche and still candle — a row of identical still lights (Perfection grammar, glows on the model candles); the terrace edge, 2 m above the approach |
| `A18.6` | Hilltop approach steps | building | 4 × 2.61 × 4.06 | 1 | glb (`act1-a18-6-hilltop-steps`) | concept A18 cell 6 (v2 batch) | top | GLB 4 × 2.61 × 4.06 m placed ×1.3 (5.2 × 3.4 × 5.3 m): seven clean treads up to a landing 1.8 m above the approach (the terrace is 0.2 m higher behind it); Play walks the hidden ramp `steps` through the step edges (STEPS_WALK), the terrain runs under every tread and the landing (STEPS_GROUND); the cheeks block, and so do the pillar bases and flower pots flanking the landing (GLB \|x\| ≥ 0.92, 0.4–1.3 m above it); potted red / cream flowers on the cheeks; the exit to the Gentle House |
| `N-PR01` | Abandoned reaping (sheaves, scythe, straw hat) | prop | 2.4 × 1.1 × 2 | 1 | **blockout** | concept A23 cell 1 (v3 batch) | landing | rite 1: beside it a body-shaped hollow pressed into the poppies (field hole). Keeps the blockout: its GLB (act1-a23-1-abandoned-reaping) is a QA redo (the scythe juts out in mid-air with the jug hanging off it, no poppies, hollow sheaves) |
| `N-PR02` | Harvester's cairn with ribbons and a name slate | story | 1.2 × 1.32 × 1.34 | 1 | glb (`act1-a22-4-harvester-cairn`) | concept A22 cell 4 (v3 batch) | farm | rite 2, under a drying rack in the farmyard. GLB 1.2 × 1.32 × 1.34 m (replaces the kit rock stand-in): the name slate leans on the front (+z), the ribbon stick on top (1.32 m); blocks as a whole |
| `N-PR03` | Shepherd's crook and folded coat | prop | 0.74 × 1.6 × 0.79 | 1 | glb (`act1-a22-5-crook-and-coat`) | concept A22 cell 5 (v3 batch) | east | rite 3, inside the empty sheepfold (a ring of A08.2). GLB 0.74 × 1.6 × 0.79 m: the 1.6 m crook, the folded coat in front of it (+z); blocks on the crook only (0.3 × 0.3 m at GLB x −0.07…+0.23, z −0.27…+0.03: its shaft leans from (0.15, −0.09) 0.55 m up to (−0.02, −0.15) at 1.2 m, the hook reaches x +0.31 at 1.3–1.6 m; review a2x F-c), the coat stays walk-through |
| `N-PR04` | Lone hawthorn with ribbons (the ribbon thorn) | vegetation | 7.87 × 5.5 × 3.99 | 1 | glb (`act1-a23-2-ribbon-thorn`) | concept A23 cell 2 (v3 batch) | top | rite 4: wind-bent, ribbons tied in it, a sleeper's shoes beneath (A22.1); a landmark of the upper field. GLB 7.87 × 5.5 × 3.99 m: the trunk foot at (+0.27, +1.39) off the pivot, the crown swept to −x and back (−z) over a twisted trunk, the ribbon-rich side +z. Placed by its trunk foot on the rite marker and turned (yaw 200) so the crown leans east-south-east, downwind of the smoke (1, −0.15) like the blockout, seen from just right of its back by the game camera; blocks on the trunk only (its foot, and where it leans back at 0.8 m); ribbons and twigs walk-through |
| `N-PR05` | Straw doll on a stile step | prop | 0.3 × 0.32 × 0.33 | 1 | glb (`act1-a22-6-straw-doll`) | concept A22 cell 6 (v3 batch) | farm | unmarked vignette. GLB 0.3 × 0.32 × 0.33 m: the doll faces +z, its legs out 0.17 m in front of the pivot |
| `A22.1` | Worn shoes at the foot of the ribbon thorn | prop | 0.45 × 0.18 × 0.44 | 1 | glb (`act1-a22-1-worn-shoes`) | concept A22 cell 1 (v3 batch) | top | rite 4: the sleeper's pair (the same model as the fens N-FN02), set beside the thorn's trunk foot, toes to the trunk |
| `N-PR06` | Water trough (farmyard) | prop | 2.5 × 1 × 1.1 | 1 | **kit** (`kit:animals.trough`) | LD only, no concept | farm | kit tạm (camp trough) |
| `N-PR07` | Seed sacks | prop | 1.9 × 1.3 × 1.8 | 1 | **kit** (`kit:storage.sacks`) | LD only, no concept | farm | kit tạm |
| `N-PR08` | Barrow | prop | 2.5 × 1 × 1.25 | 1 | **kit** (`kit:animals.wheelbarrow`) | LD only, no concept | farm | kit tạm (camp wheelbarrow) |
| `N-PR09` | Spilled straw | prop | 2.4 × 0.24 × 2.3 | 1 | **kit** (`kit:clutter.straw`) | LD only, no concept | farm | kit tạm |
| `N-PR10` | Bramble / hawthorn scrub at wall ends | vegetation | 1.8 × 1.1 × 1.35 | 14 | **kit** (`kit:shrubs.shrub_12`) | LD only, no concept | all | kit tạm (Blood-Moor shrub) |
| `N-PR11` | Landing posts at the causeway (Rook's Weir boats) | structure | 2.16 × 1.27 × 0.36 | 1 | **kit** (`kit:fence.broken_pair`) | LD only, no concept | landing | kit tạm (broken fence pair at ×1.2 = 2.6 × 1.5 m): posts in a pair at the causeway landing |
| `A04.2` | Young willow (fen foot) | vegetation | 4.94 × 6 × 5.22 | 5 | glb (`act1-a04-2-young-willow`) | concept A04 cell 2 (E02 willow kit) | landing | GLB 4.9 × 6 × 5.2 m; only at the fen shore; only the trunk blocks |
| `A03.1` | Low grass clump (meadow tufts) | vegetation | 0.6 × 0.5 × 0.6 | 30300 | **procedural** | concept A03 cell 1 (E01 fen kit) | all | grey-green meadow tufts: ≈ 30 000 instanced Dark Wood grass cards from the field + 320 scattered clumps |
| `A03.2` | Tall reeds clump | vegetation | 0.8 × 1.8 × 0.8 | 200 | **procedural** | concept A03 cell 2 (E01 fen kit) | landing | shore-plant cards along the fen at the foot |
| `A03.3` | Sedge water clump | vegetation | 0.7 × 0.9 × 0.7 | 140 | **procedural** | concept A03 cell 3 (E01 fen kit) | landing |  |
| `glb:dungeon-prop-flint-boulders` | Flint boulders | rock | 2 × 1.18 × 1.9 | 7 | glb (`dungeon-prop-flint-boulders`) | ashlar/3d/props/dungeon_v1/flint_boulders | all | the Delvings spoil and the field-clearance piles at wall corners (flint country) |
| `glb:biome-prop-riverbank-stones` | Riverbank stones | rock | 1 × 0.35 × 1 | 4 | glb (`biome-prop-riverbank-stones`) | ashlar/3d/props/clutter_v1/riverbank_stones | landing |  |

### Còn thiếu (14)

- **blockout (khối thay thế)** (4): `A08.2-stile` Squeeze stile in a drystone wall ×1 · `A08.3` Abandoned hillside farmhouse ×1 · `A08.5` Field gate between stone posts ×4 · `N-PR01` Abandoned reaping (sheaves, scythe, straw hat) ×1
- **procedural (code tạo tạm)** (4): `A08.1` Poppy drift clump ×36000 · `A03.1` Low grass clump (meadow tufts) ×30300 · `A03.2` Tall reeds clump ×200 · `A03.3` Sedge water clump ×140
- **kit tạm (kit cũ đứng thay)** (6): `N-PR06` Water trough (farmyard) ×1 · `N-PR07` Seed sacks ×1 · `N-PR08` Barrow ×1 · `N-PR09` Spilled straw ×1 · `N-PR10` Bramble / hawthorn scrub at wall ends ×14 · `N-PR11` Landing posts at the causeway (Rook's Weir boats) ×1

### Quái

| Mã | Tên | Đoạn | Số | Ghi chú |
|---|---|---|---|---|
| `P02` | Hush-Herald | middle | 2 | E4 (in the smoke), E8 (below the steps) · tall veiled censer-bearer h 1.15–1.30 H: breathes a sleep cloud (slow, drowsy), strengthens nearby Soothed · stand-in `wraith` (single, named) |
| `F02` | Poppy Nurse | farm | 3 | E3, E5, E8 · caster + healer h 0.95–1.05 H, white wimple embroidered with poppies, a long silver needle; sings and heals the pack — must NOT look evil · stand-in `imp_shaman` (single, named) |
| `P03` | Hush-Moths | all | 21 | E2 ×6, E4 ×5, E6 ×4, E8 ×6 · pale soft moths in swarms (wing dust: slow) · stand-in `bat` |
| `P04` | Hive-Sleeper | landing | 4 | E2 ×2, E6 ×2 · bloated crawler L 1.4–1.7 H, bursts into Hush-Moths (larvae reduction option, LD §8.4) · stand-in `zombie` |
| `W03` | Hush-Wolf | all | 16 | E1 ×4, E3 ×3, E5 ×4, E7 ×5 · gaunt half-man wolf, eyes shut, hunts by scent in packs; its howl is the lullaby · stand-in `spider` (fast pack beast) |

### NPC

— (không có)

### Texture

| Texture | Có | Ghi chú |
|---|---|---|
| BIO02_meadow | có | the meadow base everywhere (and on the apron beyond the bounds); stand-in for the poppy meadow soil |
| DW_sparse (darkwood grass-sparse) | có | lane verges, the thin upper slope, the approach |
| DW_dense (darkwood grass-dense) | có | rank grass at wall feet, the shore band, field patches |
| DW_dirt (darkwood dirt) | có | lanes and tracks, the farmyard, the approach |
| BIO03_flint | có | the farmyard cobbles, gate and stile thresholds |
| BIO06_flint_spoil | có | chalk-and-flint spoil at the Flint Delvings mouth |
| BIO05_lime | có | the hospice terrace (clean lime) |
| DW_mud (darkwood mud) | có | the fen shore, the causeway |
| biome-darkwood-water-n | có | fen ripple normal |
| biome-darkwood-grass-cards · biome-shore-plants | có | meadow tufts, reeds, sedge |
| poppy meadow soil (A05 cell 4) | **thiếu** | concept only; BIO02_meadow + the instanced clumps stand in |
| poppy clump card atlas (side + top views, petals) | **thiếu** | the field is procedural vertex-coloured clumps; a painted atlas would carry it at distance and up close |
| drystone wall (grey stone, moss, through-stones) | **thiếu** | walls are flat blockout colour |
| whitewash (seamless, no patch) + clean slate roof | **thiếu** | the ward range, the boundary wall, the steps |
| chalk-and-flint cut face | **thiếu** | the mine mouth (A18.3) |
| hay / straw, old slate and thatch (farm) | **thiếu** | ricks, the farmhouse roof |
| Mercy linen (clean pillow) + patched bedding | **thiếu** | beds, the ox cart bedding |

### VFX

| Hiệu ứng | Có | Ghi chú |
|---|---|---|
| sleep smoke as terrain (drifting banks that close / open lanes) | **thiếu** | placeholder: 5 zones of stacked soft-rimmed slices + a curtain, slightly warm, breathing along the wind (toggle + speed + labels); needs the real volume shader and the slow → sleep gameplay |
| poppy and grass sway | có | the lab wind effect on the instanced clumps and tufts (GPU), foot bend near the hero; petal flutter not built |
| Perfection light: the hospice window + a row of still niche candles | **thiếu** | placeholder: still glow sprites + 2 still point lights; the window pane is a warm blockout panel |
| low mist over the fen at the foot | **thiếu** | placeholder: drifting soft sheets (mist slider) + the post height fog |
| Hush-Herald censer cloud (feeds the smoke) | **thiếu** | not built |
| Hush-Moth swarms over the field | **thiếu** | not built (monster stand-ins only) |
| Poppy Nurse song and heal pulse | **thiếu** | not built |
| Hive-Sleeper burst | **thiếu** | not built |
| drifting petals; after Act I the flowers droop and fall (LD §11.13 proposal) | **thiếu** | not built |
| Discarded kiln breath deep in the Flint Delvings mouth | **thiếu** | not built (the entrance is a dark recess) |

## ASHLAR · Act I · base · Gentle House — `gentleHouse`

Scene `act1GentleHouse` · engine interior · BIO-05 · file `src/env/act1/maps/gentleHouse.js` · độ dài đề xuất: 160 m — full map: the climb from the Poppy Reach (~100 m of switchbacks between drystone walls), the forecourt, a compound ≈ 45 × 35 m with the ward's upper storey (the high window), a chapel and the sisters' dormitory; this slice is 66 × 94 m (a 40 m climb)

Mã asset: 29 — glb (model ASHLAR thật): **20** · kit tạm (kit cũ đứng thay): **0** · procedural (code tạo tạm): **2** · blockout (khối thay thế): **7**.

### Asset

| Mã | Tên | Loại | Cỡ (m) R × C × S | Số | Trạng thái | Nguồn | Đoạn | Ghi chú |
|---|---|---|---|---|---|---|---|---|
| `A11.1` | Whitewashed cloister bay (three round arches) | building | 5.4 × 3.81 × 2.82 | 12 | glb | concept A11 cell 1 | cloister | the GLB is a closed little pavilion (solid back wall, both end walls, a gable roof over a 1 m walk): its back and end walls below the roof (y < 2.42 m) are cut away so the walk behind the arches stays 1.9 m wide and runs on from bay to bay; arches 1.1 / 1.0 / 0.9 m between the four piers (the blockers); the roof covers the walk (the wall fade opens it round the focus; the exterior-only N-HS12 roofs are dropped) |
| `A11.2` | Hospice bed | prop | 1.2 × 1.07 × 2.16 | 14 | glb | concept A11 cell 2 | ward | two rows in the ward; Fen's bed (north row, east end) is empty; the GLB is keyed on the 2.16 m length; uniformly it was 1.71 m wide (concept 1.08 m) and read as a double bed with one sleeper, so the prep narrows its width alone ×0.7 to 1.2 m (prepare-act1-kit.py SQUASH, kit fix 10-23: a plain bed frame, the texture stretch is small); 1.5 m stays between beds at the 2.71 m pitch (the candle stands and windows stand there); mattress top 0.67 m (the sleepers lie at 0.70) |
| `A11.3` | Refectory table with bread (two benches) | prop | 4.32 × 2.07 × 2.58 | 3 | glb | concept A11 cell 3 | refectory | two tables + the high table; the bread is always fresh; keyed on the 4.32 m length the GLB top stands at 1.2 m: placed at scale 0.68 (2.94 × 1.41 × 1.75 m, top 0.82 m, benches 0.40–0.46 m); it brings its own jug of flowers (no A19.1 vase on it) |
| `A11.4` | Gate tower | building | 4.32 × 7.2 × 4.32 | 1 | **blockout** | concept A11 cell 4 | gate | the rain stops here (LD proposal); the passage is 2 m wide; the blockers are its side walls · kept as a blockout (kit swap 2026-10-23): the act1-a11-4-gate-tower GLB has no through passage (its front arch opens into a hall closed by a blind back wall) and no +x wall below ≈ 4 m: it needs a rebuild |
| `A11.5` | Kitchen hearth with cauldron | building | 2.33 × 2.88 × 1.96 | 1 | glb | concept A11 cell 5 | kitchen | unlit and spotless (concept): a kitchen that never seems to cook; the GLB is 2.33 m wide (concept 3.6 m), its back on the kitchen's north wall |
| `A11.6` | Steady candle stand | prop | 0.61 × 2.34 × 0.62 | 18 | glb | concept A11 cell 6 | ward · refectory · kitchen · cloister | Perfection light: the candles never flicker; many identical in rows (a real light on some, a still glow on the others); the light, its halo and the still flame (KIT globe) sit on the GLB flame (0.04, 2.24, 0.06; 2.16–2.33 m) |
| `A18.4` | Hospice ward range (exterior) | building | 30 × 11 × 9 | 0 | **blockout** | concept A18 cell 4 (v2 batch) | ward |  |
| `A18.5` | Hospice boundary wall with niche (still candle) | structure | 6 × 2.95 × 0.85 | 4 | glb | concept A18 cell 5 (v2 batch) | forecourt | the forecourt's side walls; the niche candles burn still in the rain |
| `A18.6` | Hilltop approach steps (whitewashed retaining terrace) | structure | 4 × 2 × 5 | 0 | **procedural** | concept A18 cell 6 (v2 batch) | approach |  |
| `A19.1` | Flowers in a vase | prop | 0.4 × 0.5 × 0.2 | 8 | glb | concept A19 cell 1 (v2 batch) | ward · refectory · kitchen · parlour | on the ward window sills and the tables |
| `A19.2` | Poppy tea on a tray | prop | 0.5 × 0.22 × 0.31 | 2 | glb | concept A19 cell 2 (v2 batch) | parlour · kitchen | the vision trigger (Mother Hawise offers it by the warm window) |
| `A19.3` | Mother Hawise's window chair (+ side table) | prop | 1.18 × 1.2 × 0.71 | 1 | glb | concept A19 cell 3 (v2 batch) | parlour | seat 0.53 m, side table top 0.56 m at (−0.39, 0.15) |
| `A19.4` | Linen press | prop | 1.35 × 1.9 × 0.95 | 4 | glb | concept A19 cell 4 (v2 batch) | linen room · parlour | the open doors reach 0.35 m in front of the carcass (back at local z −0.475); top 1.90 m |
| `A19.5` | Linen folding screen | linen | 2 × 1.8 × 0.96 | 2 | glb | concept A19 cell 5 (v2 batch) | ward · linen room | Tamsin hides behind one at Fen's bed; a deep zig-zag (0.96 m) |
| `A19.6` | Tall ward window (deep sill, one steady candle) | building | 2.4 × 3.29 × 0.67 | 8 | glb | concept A19 cell 6 (v2 batch) | ward · parlour | a wall section with a blind window (solid back) mounted on the inner face of an engine window opening (the opening, its pane and glow stay the engine's; the opening is 2.4 m tall so the 3.29 m section covers it); fades with its wall |
| `N-HS02` | Garth flower bed (pale flowers, two poppies) | vegetation | 3.2 × 1.27 × 3.23 | 1 | glb | concept A23 cell 3 (v3 batch) | cloister | a square limewashed kerb (soil top ≈ 0.49 m) with pale flower mounds to 1.27 m (concept 0.55 m overall) and the two poppies in the middle; blocks as a whole (3.2 m square, was a 3.2 m disc) |
| `N-HS03` | Potted flowers (clean terracotta pot) | vegetation | 0.59 × 0.75 × 0.6 | 6 | glb | concept A23 cell 4 (v3 batch) | forecourt · cloister | the six pots are identical (no placement-scale variety: Perfection keeps every plant the same); QA: no lavender spikes, many flowers grey-green instead of cream |
| `N-HS04` | Walled flower bed (herbs, white flowers) | vegetation | 4 × 1.1 × 1.24 | 4 | glb | concept A23 cell 5 (v3 batch) | Mother's garden | the walled garden under the high window (seen, not walked); kerb top 0.27 m, leaves to 1.11 m (concept 0.5 m); QA: the lavender and white flower spikes are missing (spiky leaves, a few flat flowers) |
| `N-HS05` | Linen drying line (clean sheets) | linen | 3.83 × 2.2 × 0.27 | 1 | glb | concept A23 cell 6 (v3 batch) | Mother's garden | clean sheets hanging dead still in the dry, windless garden; 3.83 m wide (concept 6 m): the GLB posts' feet are at x −1.79 and +1.80 (measured on the mesh), the sheets hang from the line (≈ 1.9 m) to 0.25–0.55 m; only the posts block (the garden is seen, not walked: the sheets would be a cloth wall where the hero could reach it) |
| `N-HS06` | Kitchen work table (bowls, bread) | prop | 2.4 × 1.11 × 1.01 | 1 | glb | concept A24 cell 1 (v3 batch) | kitchen | top 0.84 m; it brings its own three nested bowls (x −1.0…−0.5, to 1.11 m), two loaves on a board with the knife (x −0.3…+0.4) and a folded white cloth (x +0.4…+1.1, top 0.90 m): the poppy tea tray stands on the cloth, no A19.1 vase on it |
| `N-HS07` | Bread rack (fresh loaves) | prop | 1.16 × 1.8 × 0.51 | 2 | glb | concept A24 cell 2 (v3 batch) | kitchen | replaces the A19.4 linen press stand-in; 1.16 m wide (concept 1.6 m: keyed on the width it would be 2.42 m tall), shelves 0.15–1.34 m; the back 0.25 m behind the pivot (on the wall at x + 0.26) |
| `N-HS08` | Folding table with folded linen | prop | 2.4 × 1.09 × 1.03 | 1 | glb | concept A24 cell 3 (v3 batch) | linen room | trestle table, top 0.82 m, the folded linen stacks to 1.09 m (one tied with a poppy-red ribbon) |
| `N-HS09` | Night stair down to the Garden of Hush | structure | 3 × 3 × 6 | 0 | **procedural** | LD only, no concept | stair | built by the engine: 15 treads (0.1875 m) from the kitchen down to a landing whose far end sinks into the dark; final art: a stair / vault kit |
| `N-HS10` | Ward range roof (slate, exterior only) | structure | 10.4 × 4.2 × 31.6 | 1 | **blockout** | LD only (part of A18.4) | ward | shown while the focus is outdoors; the interior has no ceilings (camera) |
| `N-HS11` | East range roof (slate, exterior only) | structure | 11 × 3.6 × 32.4 | 1 | **blockout** | LD only, no concept | refectory · kitchen |  |
| `N-HS12` | Cloister lean-to roof bay (tiles, exterior only) | structure | 5.4 × 1 × 3.7 | 0 | **blockout** | part of A11.1 (its lean-to roof) | cloister | split off A11.1 so the walk reads from the camera; shown while the focus is outdoors |
| `N-HS13` | Night stair roof (exterior only) | structure | 3.8 × 1.4 × 12.4 | 1 | **blockout** | LD only, no concept | stair |  |
| `A08.1` | Poppy drift clump | vegetation | 2.7 × 1.08 × 2.7 | 9 | **blockout** | concept A08 cell 1 (shared with map 3) | approach | the last poppies of the Reach on the lower slope (walk-through) |
| `glb:dungeon-prop-flint-boulders` | Flint boulders (2 m wide) | rock | 2 × 1.1 × 1.8 | 3 | glb | lookdev-lab/assets/terrain-biomes/dungeon-prop-flint-boulders.glb (ashlar/3d/props/dungeon_v1) | approach | flint country of the Poppy Reach: the hillside |

### Còn thiếu (9)

- **blockout (khối thay thế)** (7): `A11.4` Gate tower ×1 · `A18.4` Hospice ward range (exterior) · `N-HS10` Ward range roof (slate, exterior only) ×1 · `N-HS11` East range roof (slate, exterior only) ×1 · `N-HS12` Cloister lean-to roof bay (tiles, exterior only) · `N-HS13` Night stair roof (exterior only) ×1 · `A08.1` Poppy drift clump ×9
- **procedural (code tạo tạm)** (2): `A18.6` Hilltop approach steps (whitewashed retaining terrace) · `N-HS09` Night stair down to the Garden of Hush

### Quái

— (không có)

### NPC

- **Mother Hawise** (parlour) — offers rest and poppy tea by the high warm window (the vision trigger); later the Hospice Mother (B05, map 6); blockout stand-in, no model
- **Poppy Sisters ×4** (cloister · ward · kitchen · gate) — white wimples embroidered with poppy red; three on patrol routes with sight cones (overlay), one porter at the gate; being seen = led kindly to the gate
- **Tamsin** (ward) — hides behind a linen screen at Fen's empty bed; must be got out before the sisters notice (escort path overlay); 16, thin, oiled wool hood, short bow
- **Smiling sleepers ×13** (ward) — on the ward beds under clean linen (the one allowed clean white); every face different in the final (now one blockout); Fen's bed is empty

### Texture

| Texture | Có | Ghi chú |
|---|---|---|
| BIO05_lime | partial | used for the whitewash walls (tone 1.15) and the limed floor flags, but its blotchy cells read as patches on the walls (the house must have not one patch): a seamless new-whitewash tile is still needed |
| BIO24_keystone | có | dressed stone flags: cloister walks, forecourt, steps, kitchen, linen room, the garth's paths |
| DW_grass | có | garth lawn, the Mother's garden, the hillside |
| BIO02_meadow | có | the poppy meadow at the foot of the hill (the Reach) |
| BIO03_flint | có | the flint path up the hill |
| BIO08_nave | có | the old flags of the night stair (the crypts below) |
| new whitewash wall tile (seamless, not one patch) | **thiếu** | BIO05_lime shows soft cloud patches; the Gentle House needs a too-clean, seamless whitewash + a plain lime skirting |
| scrubbed pale floorboards (ward, parlour) | **thiếu** | pale scrubbed wood, very clean (now limed flags) |
| linen with the poppy-red embroidered band | **thiếu** | sheets, wimples, screens, curtains (Mercy's linen) |
| slate roof + terracotta eave tiles | **thiếu** | the exterior roofs (A18.4 slate, A11.1 / A11.4 tiles) |
| wet chalk-and-flint hill path | **thiếu** | rain-darkened path with chalk mud between the flints (now BIO03_flint + the wet channel) |
| clipped garth lawn | **thiếu** | too even, too green (now the Dark Wood grass) |

### VFX

| Hiệu ứng | Có | Ghi chú |
|---|---|---|
| the rain stops at the gate | placeholder | rain streaks round the focus outside the dry rects (compound + gate tower) + wet ground outside; real: a visible curtain edge at the gate, dripping eaves outside only |
| still candle light (never flickers) | placeholder | still halos + floor pools, identical candles in rows (Perfection light); real: a round, even glow, no smoke |
| the high warm window (brightest still light of the act) | placeholder | an emitting pane + a big still halo outside + a warm light inside; must match N-GH far away |
| dust motes in the warm light | placeholder | GPU atmosphere motes, lit by the nearest lights |
| grey daylight in the garth | placeholder | one soft spot from above (the shadowed light) |
| poppy tea vision (seaside monastery, high window, "Come home.") | **thiếu** | the vision when the tea is drunk |
| being seen: led kindly to the gate | **thiếu** | a soft fade and the sister walking you out (now a marker) |
| sleepers breathing in unison | **thiếu** | the linen rising and falling, perfectly in sync |
| steam from the tea and the fresh bread | **thiếu** | small, still, too perfect |
| a lullaby drifting from the house | **thiếu** | audio (the act image) |

## ASHLAR · Act I · base · Garden of Hush — `gardenOfHush`

Scene `act1GardenOfHush` · engine interior · BIO-04 ↺ · file `src/env/act1/maps/gardenOfHush.js` · độ dài đề xuất: 420 m — a 35-min dungeon: ~400 m of way over 2 floors (3–4 row halls, 2 channel galleries, the harvest room, the deep rows as a pseudo-infinite cell); this slice is 190 × 82 m, ~260 m of route

Mã asset: 31 — glb (model ASHLAR thật): **24** · kit tạm (kit cũ đứng thay): **0** · procedural (code tạo tạm): **3** · blockout (khối thay thế): **4**.

### Asset

| Mã | Tên | Loại | Cỡ (m) R × C × S | Số | Trạng thái | Nguồn | Đoạn | Ghi chú |
|---|---|---|---|---|---|---|---|---|
| `A13.1` | Sleeping bed furrow | structure | 1.16 × 0.56 × 2.7 | 65 | glb | concept A13 cell 1 | furrow hall · breath room | turnaround reads ≈ 1.5H long; the prompt's 2.4H × 1H is too big for one sleeper; the GLB is keyed on the 2.7 m length: a linen-draped timber box 1.16 m wide (concept 1.4 m), linen top 0.46–0.50 m; a GLB sleeper on it lies ON_GLB_BED up at SLEEPER_ON_GLB_BED of its row scale (its 1.4–1.5 m soil mound would hang over the narrower bed) |
| `A13.2` | Cloth canopy frame | structure | 6.3 × 4.06 × 4.37 | 10 | glb | concept A13 cell 2 | furrow hall | one per three beds; the awning is walk-through (the GLB canvas sags to ≈ 2.4 m), the posts block; the GLB posts lean (not a rectangle): the blockers are their 0.35–1.7 m footprints |
| `A13.3` | Pink night-light jar | prop | 0.7 × 0.81 × 0.67 | 263 | glb | concept A13 cell 3 | every row | one beside every sleeper; still Perfection light (a real light every few, glow + floor pool elsewhere); the GLB's pink glass (r ≈ 0.31 m round (−0.01, 0.46, 0), in an iron-banded bowl on a stone slab) carries the light, its halo and the glowing globe (KIT globe); ×263: a collider prism keeps its 4.4 k triangles out of Play's collision · 78 of them drawn in the void past the floor |
| `A13.4` | Hush bell post | structure | 1.62 × 3.6 × 0.7 | 15 | **blockout** | concept A13 cell 4 | furrow hall · deep rows | the signature mechanic: noise within ~6 m rings it, it calls Poppy Nurses (overlay "Chuông ru") · kept as a blockout (kit swap 2026-10-23): the act1-a13-4-bell-post GLB's post rises 0.3 m over the bar and reads as a cross; the user picks it or its -trim variant (docs/act1-base/act1-kit-cross-check.png) |
| `A13.5` | Root-vaulted wall bay | building | 5.4 × 3.52 × 2.4 | 17 | glb | concept A13 cell 5 | furrow hall · gallery · deep rows | against the earth walls; the Poppy Nurses come out of these bays when a bell rings; the GLB is a shallow niche 3.5 m tall (concept 5.04 m) whose invented smooth mud-dome back (QA) sits ≈ 0.3 m inside the 0.7 m earth wall, out of sight; a box collider (its 15 k triangles × 17 stay out of Play's collision) |
| `A13.6` | Poppy furrow | vegetation | 4.32 × 1.76 × 1.75 | 16 | glb | concept A13 cell 6 | furrow hall · deep rows | in the spines between facing rows; the GLB poppies reach 1.76 m (concept 1.26 m); the collider covers the 1.0 m planter (foot), the leaning stems stay walk-through |
| `A20.1` | Sleeper: young woman (braid, ribbon keepsake) | story | 1.41 × 0.54 × 2.1 | 69 | glb | concept A20 cell 1 (v2 batch, perspective_v1e) | every row | buried to the chest, a poppy from the lips (no gore); rows mix the four people with their own length · 19 of them drawn in the void past the floor |
| `A20.2` | Sleeper: old man (pipe in his folded hands) | story | 1.51 × 0.69 × 2.1 | 51 | glb | concept A20 cell 2 (v2 batch, perspective_v1e) | every row | buried to the chest, a poppy from the lips (no gore); rows mix the four people with their own length · 15 of them drawn in the void past the floor |
| `A20.3` | Sleeper: fisherman (knitted cap, cork float) | story | 1.51 × 0.79 × 2.1 | 67 | glb | concept A20 cell 3 (v2 batch, perspective_v1e) | every row | buried to the chest, a poppy from the lips (no gore); rows mix the four people with their own length · 22 of them drawn in the void past the floor |
| `A20.4` | Sleeper: farm woman (apron, wooden spoon) | story | 1.5 × 0.58 × 2.1 | 67 | glb | concept A20 cell 4 (v2 batch, perspective_v1e) | every row | buried to the chest, a poppy from the lips (no gore); rows mix the four people with their own length · 22 of them drawn in the void past the floor |
| `A20.5` | Irrigation channel piece (sluice) | structure | 3 × 0.89 × 1.88 | 8 | glb | concept A20 cell 5 (v2 batch) | furrow hall · gallery · deep rows | the GLB brings its cut-out floor block (top 0.55 m): placed CH_SINK = 0.55 m down so the block is flush with the floor, its trench (floor 0.13 m under the floor) holds the engine's still water (0.1 m under the floor); the runs between the pieces are engine-built (N-GD14) |
| `A20.6` | Harvest table | prop | 2.6 × 2.17 × 1.43 | 5 | glb | concept A20 cell 6 (v2 batch) | harvest room | table top 0.84 m; 1.43 m deep with the baskets and the cloth (the collider covers it) |
| `A08.6` | Poppy-drying rack | structure | 3.6 × 2.93 × 1.8 | 6 | glb | concept A08 cell 6 (Poppy Reach kit, shared) | gallery · harvest room | the GLB at scale 1.1 (3.96 × 3.22 × 1.98 m; concept 4.32 × 3.6 m: at 1.2 its splayed A-frame would stand in the gallery wall or its channel), bench ≈ 0.85 m; its crossed A-frame ends read as an X, not a cross (QA) |
| `A11.6` | Steady candle stand | prop | 0.61 × 2.34 × 0.62 | 2 | glb | concept A11 cell 6 (Gentle House kit, shared) | landing | the hospice side of the stair: a flame that never moves (Perfection); the light, its halo and the still flame (KIT globe) on the GLB flame (0.04, 2.24, 0.06) |
| `N-GD01` | Root rib arch | vegetation | 6.5 × 4.05 × 1.94 | 3 | glb | concept A25 cell 1 (v3 batch; lab variant -slim) | root tunnel | one great root arching over a passage: the ribs of the root vault (no ceilings in the lab); the -slim GLB (root feet squeezed to 1.94 m deep), 4.05 m tall (concept 4.9 m); the feet block (x < −0.85 and > +1.45 at walking height), the 2.3 m lane between them is centred at x +0.3, off the pivot; the thin rootlets that hung into the lane (to 0.74–1.02 m at x −0.85…−0.49 and +0.75…+1.15) are cut below 2.05 m, so the lane keeps ≥ 2 m headroom |
| `N-GD04` | The lamp ahead | story | 0.6 × 1.4 × 0.6 | 1 | **blockout** | AD §4.5 motif, no concept | deep rows → exit | first appearance (AD §4.5, §10.2 item 7): a far still white light that shows the right way; no holder, not explained |
| `N-GD05` | Plank crossing | structure | 0.91 × 0.19 × 2.3 | 1 | glb | concept A25 cell 2 (v3 batch) | gallery | 0.91 m wide (concept 1.5 m), the rope loop at −z, deck top 0.14–0.17 m: laid PLANK_SINK into the earth crossing, so the deck is ≈ 0.04 m over the floor the hero walks (walk-through: no deck in Play); QA: wavy planks with gaps |
| `N-GD06` | Shroud web (W07 lair) | prop | 3 × 2.7 × 0.3 | 5 | **blockout** | LD only, no concept (W07 sheet: silk #D8CCB0) | gallery · deep rows | webs only (no wrapped bodies) |
| `N-GD07` | Root fall (collapsed vault) | rock | 4.6 × 3.21 × 4.83 | 2 | glb | concept A25 cell 3 (v3 batch) | deep rows | closes the easy ways of the hardest stretch; 3.21 m tall (concept 2.6 m), 4.83 m deep (concept 5.4 m): both ways stay shut (at Play's 0.3 m radius the shorter heap only frees a 0.25 m strip along the north fall's +z face, no way past either fall); blocks as a whole (a box collider: Play does not climb the heap) |
| `N-GD08` | Harvest basket of poppy heads | prop | 0.56 × 0.29 × 0.39 | 10 | glb | concept A25 cell 4 (v3 batch) | harvest room | keyed on the 0.56 m width: low, 0.29 m tall (concept 0.45 m); the folded white cloth over the +x end; QA: the poppies are a few red smudges |
| `N-GD09` | Poppy Nurse's tending kit (stool, watering can) | prop | 1 × 0.53 × 0.52 | 1 | glb | concept A25 cell 5 (v3 batch) | furrow hall | the stool with the book and scissors, the watering can at +x |
| `N-GD10` | Linen coverlet turned down (empty bed) | linen | 1.14 × 0.51 × 2.72 | 1 | glb | concept A24 cell 4 (v3 batch) | furrow hall | a bed made up and lit, nobody in it yet (unmarked vignette); the GLB is a thick layer (top 0.27–0.30 m, underside 0 → 0.21 m head to foot, pillow to 0.51 m at −z) that covers the A13.1 bed exactly: laid at COVER_ON_BED over the bed, its top lies ≈ 0.03 m over the bed's linen and its pillow takes in the bed's own pillow (no double pillow) |
| `N-GD11` | Shoes placed at the foot of a furrow | prop | 0.45 × 0.18 × 0.44 | 1 | glb | concept A22 cell 1 (v3 batch) | furrow hall | the fens' pair (N-FN02) placed at scale 0.7 (0.32 × 0.13 × 0.31 m), toes to +z |
| `N-GD12` | Whitewashed stair down from the Gentle House | structure | 4 × 3.6 × 10 | 0 | **procedural** | LD only, no concept | landing | built by the engine: 17 treads of 0.2 m + lime / bone-mortar walls; final art needs a stair kit |
| `N-GD13` | Crypt stair + arch down to the Cradle | structure | 4 × 1.8 × 5 | 0 | **procedural** | LD only, no concept | exit | 9 treads of 0.18 m and an arch, the mirror of the Cradle's stair (map 6) |
| `N-GD14` | Irrigation channel runs (sunk floor + still water) | structure | 1 × 0.4 × 3 | 0 | **procedural** | concept A20 cell 5 (runs between the pieces) | furrow hall · gallery · deep rows | the engine sinks the floor 0.4 m and lays an opaque still-water surface 0.1 m under the floor |
| `N-GD15` | Tamsin's lantern on a root bracket | prop | 0.71 × 1 × 0.83 | 1 | glb | concept A25 cell 6 (v3 batch) | breath room | human light: warm, flickering (the one shadowed light of the map); the GLB is a root bracket standing on a clod of earth (not the blockout's wall bracket): it stands on the floor, its arm reaching +x; the plan light `lantern` and the KIT globe sit on its glass (LANTERN_GLASS, measured on the mesh: the tin lantern spans x 0.13–0.33, y 0.35–0.75, z −0.03…0.17) |
| `N-GD16` | Fallen poppy heads and petals | vegetation | 0.35 × 0.06 × 0.3 | 46 | **blockout** | LD only, no concept | harvest room |  |
| `glb:dungeon-prop-crypt-wall` | Crypt wall module (bone niches) | structure | 4 × 2.28 × 0.7 | 0 | glb | lookdev-lab/assets/terrain-biomes/dungeon-prop-crypt-wall.glb | old crypt · exit | the old crypt's west wall and the exit landing: where the Wall shows |
| `glb:dungeon-prop-broken-column` | Broken column | rock | 1.68 × 1.5 × 1.02 | 5 | glb | lookdev-lab/assets/terrain-biomes/dungeon-prop-broken-column.glb | old crypt · breath room · exit | sparingly: the older crypt |
| `glb:dungeon-prop-candle-cluster` | Candle cluster on a stone block | prop | 0.77 × 0.8 × 0.76 | 2 | glb | lookdev-lab/assets/terrain-biomes/dungeon-prop-candle-cluster.glb | old crypt · breath room | one cold in the old crypt; the one Tamsin lit by Fen is the Garden's only warm, flickering light |

### Còn thiếu (7)

- **blockout (khối thay thế)** (4): `A13.4` Hush bell post ×15 · `N-GD04` The lamp ahead ×1 · `N-GD06` Shroud web (W07 lair) ×5 · `N-GD16` Fallen poppy heads and petals ×46
- **procedural (code tạo tạm)** (3): `N-GD12` Whitewashed stair down from the Gentle House · `N-GD13` Crypt stair + arch down to the Cradle · `N-GD14` Irrigation channel runs (sunk floor + still water)

### Quái

| Mã | Tên | Đoạn | Số | Ghi chú |
|---|---|---|---|---|
| `F02` | Poppy Nurse | hall · harvest · deep | 5 | h 0.95–1.05H, white wimple with poppy embroidery, long silver needle; caster + healer, must not look evil; called by the hush bells out of the root bays (overlay); stand-in skeleton_mage |
| `P01` | The Soothed | hall · deep · exit | 8 | white nightgowns (the only clean white besides the linen), eyes closed, slow; stand-in zombie |
| `P03` | Hush-Moths | hall · deep | 9 | pale swarm over the poppies and round the Poppy-Mound; stand-in bat |
| `P05` | Wet-Nurse (+ Swaddlings) | harvest | 1 | + 3 Swaddlings (bundles, never infant-shaped); stand-ins zombie + spider |
| `P06` | Poppy-Mound | deep (the wrong way) | 1 | stationary spawner, W 2.5H, releases Hush-Moths; the static Tripo GLB (act1-p06-poppy-mound, 4.5 × 1.7 m, no rig) stands at the spawner in every view and in Play; the stand-in brute of its camp spawns at its edge (the camp system takes lab monster types only) |
| `W07` | Shroud-Spinner | gallery · deep | 3 | pale spider, silk #D8CCB0, webs slow; webs only in the base map (no wrapped bodies); reduced-fear option (LD §8.4); stand-in spider |

### NPC

- **Fen** (breath room) — asleep in his row with a poppy like the others; Tamsin cannot wake him (stand-in N-GD02, a sleeper blockout)
- **Tamsin** (breath room) — kneels by Fen; the candles and the lantern she brought are the only warm, flickering light in the Garden (stand-in N-GD03, kneeling)

### Texture

| Texture | Có | Ghi chú |
|---|---|---|
| BIO04_garden | có | dark garden earth: the floor of the row halls and the earth walls |
| BIO04_ossuary | có | bone-mortar flags and walls of the old crypt rooms (crypt, breath room, harvest room) |
| DW_damp | có | damp soil at the foot of the weeping walls and round the channels (Dark Wood set, stand-in) |
| DW_mud | có | mud on the channel lips (Dark Wood set, stand-in) |
| BIO05_lime | có | the hospice landing (whitewash, no patch) |
| BIO08_nave | có | old crypt flags at the exit (= the Cradle's stair head) |
| DG_crypt_damp | có | damp seep on the crypt floors |
| BIO27_vault | có | wall tile of the exit landing and the stair to the Cradle |
| sleeper furrow soil | **thiếu** | raked dark garden earth with low furrow ridges and linen edges (the rows' ground) |
| root-laced earth wall | **thiếu** | packed earth with roots and old brick for vertical walls (now: the floor tile on the walls) |
| wet stone channel lining | **thiếu** | the channel lips and inner faces |
| still black water | **thiếu** | a mirror-still dark water material (now: an opaque glossy surface) |
| dull undyed linen + Mercy linen | **thiếu** | canopy cloth vs the sleepers' clean fold |
| dusty-pink glass | **thiếu** | the night-light dome (canon has no hex; #DCB0B3 proposed) |

### VFX

| Hiệu ứng | Có | Ghi chú |
|---|---|---|
| pink night-lights | placeholder | still additive halo + floor pool per jar, a real light every few (Perfection: no flicker) |
| the lamp ahead | placeholder | one big still white halo + pool + a small real light; real: a far point that moves on ahead, never explained |
| human light (Tamsin) | placeholder | 1/f flicker of the lantern spot (the one shadow) and the candle cluster |
| Wall light in the bone niches | placeholder | cold white slow shimmer |
| motes / pollen in the dark | placeholder | GPU atmosphere motes |
| still water | placeholder | opaque glossy surface, reflects the night-lights |
| hush bells ringing | **thiếu** | bells sway + ring, a ripple of sound over the rows; overlay preview only (noise ring → bell → Poppy Nurse doors) |
| sleepers breathing together | **thiếu** | hundreds of chests and linen folds rising in one slow shared rhythm |
| poppy petals / seed dust drifting | **thiếu** | slow fall over the rows |
| Hush-Moth swarm | **thiếu** | pale wing dust that makes the eyes heavy (P03), released by the Poppy-Mound |
| W07 web slow | **thiếu** | silk strands catching the hero |

## ASHLAR · Act I · base · The Cradle — `cradle`

Scene `act1Cradle` · engine interior · BIO-27 · file `src/env/act1/maps/cradle.js` · độ dài đề xuất: 160 m — the aisle as a pseudo-infinite loop of 80–120 m (the same cribs pass three times, LD §7.6) + an arena ⌀ 36–40 m with a second ring of cribs; this slice is 44 × 70 m

Mã asset: 11 — glb (model ASHLAR thật): **9** · kit tạm (kit cũ đứng thay): **0** · procedural (code tạo tạm): **1** · blockout (khối thay thế): **1**.

### Asset

| Mã | Tên | Loại | Cỡ (m) R × C × S | Số | Trạng thái | Nguồn | Đoạn | Ghi chú |
|---|---|---|---|---|---|---|---|---|
| `A14.1` | Bone-rail crib frame | prop | 6.3 × 3.7 × 4.27 | 60 | glb | concept A14 cell 1 (perspective / turnaround scale v2) | aisle · arena | arena-scale empty crib (giant: 2H tall); rows into the fog are the same model; the GLB is a closed rail box (bars ≈ 0.4 m apart, mattress floor 0.83 m) 4.27 m deep (concept 3.6 m): the aisle rows stand 0.53 m apart, the arena ring reaches 0.29 m inside the arena edge; Mercy's cradle is the same GLB at 0.8 on its rockers; a box collider (the crib blocks as a whole: its 14 k triangles × 22 stay out of Play's collision) · 39 of them drawn in the void past the floor |
| `A14.2` | Linen curtain pair | prop | 4.32 × 5.1 × 1.15 | 9 | glb | concept A14 cell 2 | arena | wooden posts + rod (block), tied-back linen drapes (walk-through cloth); the GLB posts at (−1.84, −0.17) and (1.79, −0.17): 2.95 m between them, 3.28 m clear under the drapes; a collider on the posts only (the model's drapes stay out of Play's collision) |
| `A14.3` | Milk-white night-light | prop | 0.73 × 2.16 × 0.72 | 32 | glb | concept A14 cell 3 | aisle · arena | still Perfection light; the arena ten go out one by one (slider); the light, its halo and the glowing globe (KIT globe, additive over the GLB's milk glass, Ø 0.72 m round (0, 1.77, 0)) on the model; a collider prism keeps its triangles (×64) out of Play's collision · 14 of them drawn in the void past the floor |
| `A14.4` | Bone mobile on stand | prop | 2.31 × 3.24 × 0.8 | 2 | glb | concept A14 cell 4 | arena | only the stand blocks; the hanging bones are walk-through (they hang to ≈ 0.9 m at x +0.3…+0.8: a collider on the stand only keeps the model out of Play's collision) |
| `A14.5` | Quilted floor platform | linen | 4.81 × 1.39 × 5.4 | 1 | glb | concept A14 cell 5 | arena | the bed made up for the hero (too high to step on: the GLB mattress top 0.83 m, its cushions 1.32 m; concept 0.72 m); 4.8 × 5.4 m, blocks as a whole (a box collider) |
| `A14.6` | Rocker runner pair | prop | 5.4 × 1.76 × 3.52 | 3 | glb | concept A14 cell 6 | arena | one under Mercy's cradle behind the boss (at 1.15: its curled ends rise past the cradle's ends, the cradle's floor on its bars, 1.07 m), two lying loose; the GLB runners are 1.76 m tall at the curled ends |
| `N-CR01` | Linen floor runner | linen | 2.4 × 0.03 × 36 | 1 | **blockout** | LD only, no concept | aisle | a clean linen strip down the aisle into the arena (Mercy leads you in) |
| `N-CR02` | Turned-down quilt | linen | 3 × 0.6 × 2.69 | 1 | glb | concept A24 cell 5 (v3 batch) | arena | on the platform: the bed is made for you; a thick quilt (top 0.36–0.60 m with the red-banded fold at −z; concept 0.24 m), laid ON_CUSHIONS on the A14.5 cushions |
| `N-CR03` | Linen pillow | linen | 1.5 × 0.54 × 1.3 | 1 | glb | concept A24 cell 6 (v3 batch) | arena | square: 1.5 × 1.3 m (concept 1.5 × 0.75 m), 0.54 m thick, three thin red lines near +x (QA: the brief has one band); at the head of the platform, clear of the quilt; laid ON_CUSHIONS |
| `N-CR04` | Crypt stair + arch from the Garden of Hush | structure | 3 × 1.8 × 5 | 0 | **procedural** | LD only, no concept | stair | built by the engine: 9 treads + vault-tile walls + a gothic arch; final art needs a stair / arch kit |
| `glb:dungeon-prop-crypt-wall` | Crypt wall module (bone niches) | structure | 4 × 2.28 × 0.7 | 0 | glb | lookdev-lab/assets/terrain-biomes/dungeon-prop-crypt-wall.glb | stair | the stair head = the lowest crypt of the Garden of Hush (BIO-04): one module, x-scale 0.8 |

### Còn thiếu (2)

- **blockout (khối thay thế)** (1): `N-CR01` Linen floor runner ×1
- **procedural (code tạo tạm)** (1): `N-CR04` Crypt stair + arch from the Garden of Hush

### Quái

| Mã | Tên | Đoạn | Số | Ghi chú |
|---|---|---|---|---|
| `B05` | The Hospice Mother | arena | 1 | act boss; blockout at spec size (crown 2.75H = 4.95 m, hands 3.00H = 5.4 m, vA concept_r2); Play stand-in hollow_king; no GLB |
| `P07` | Cradle-Warden | arena | 2 | h 2.00–2.40H, cradle-cage on the back (shape clash with B02 still open); stand-in brute |
| `P01` | The Soothed | arena | 4 | white nightgowns (the only clean white besides the linen); stand-in zombie |
| `P05` | Wet-Nurse (+ Swaddlings) | arena | 1 | + 3 Swaddlings (must not read as infants); stand-ins zombie + spider |
| `P03` | Hush-Moths | arena | 5 | pale swarm; stand-in bat |

### NPC

— (không có)

### Texture

| Texture | Có | Ghi chú |
|---|---|---|
| BIO27_cradle | có | the Cradle floor: chalk and pale bone |
| BIO27_vault | có | the void edge, the apron, the stair walls |
| BIO08_nave | có | stair head flags (old crypt of the Garden of Hush) |
| BIO05_lime | có | clean lime under the night-lights and in the lit middle |
| DG_crypt_dust | có | a little dust at the void edge |
| cradle quilted linen floor | **thiếu** | quilted linen as ground for the arena middle (Mercy's linen underfoot) |
| cradle void floor | **thiếu** | dark linen / soot that sinks into black: the pseudo-infinite edge (now: BIO27_vault + vertex fade) |
| bone rail + cord trim sheet | **thiếu** | bone, cord lashing and pale wood for A14.1 / A14.4 / A14.6 |
| linen drape material | **thiếu** | linen cloth with the narrow poppy-red hem (A14.2, A14.5, B05 veil) |
| milk-white glass | **thiếu** | the milky globe shade of A14.3 (canon has no hex yet; #F2ECDF proposed) |

### VFX

| Hiệu ứng | Có | Ghi chú |
|---|---|---|
| night-light glow | placeholder | still additive halo + floor pool per lamp, no flicker (Perfection light) |
| night-lights going out one by one | placeholder | slider "Đèn ngủ còn lại" + optional auto-dim in Play; real: a soft fade, a breath of darkness closing in |
| black fog / void | placeholder | height fog + apron fading to black + void rows darkened with distance |
| hand-shadow telegraph | placeholder | soft dark ellipses that grow ~1.6 s before a hand strikes (overlay preview) |
| dust motes in the milk light | placeholder | GPU atmosphere motes, lit by the nearest lights |
| lullaby: screen dims, hero slows | **thiếu** | boss mechanic (LD 11.12) |
| Mercy's light flowing into the hero | **thiếu** | after the fight: the life orb turns from grey to red |
| linen breathing / sway | **thiếu** | curtains and the veil move slowly, never in wind |
| Hush-Moth swarm | **thiếu** | pale wing dust that makes the eyes heavy (P03) |
| shush breath | **thiếu** | the boss's constant 'shh' as a visible breath of linen |

## Bảng chéo mã asset (mọi map)

| Mã | Tên | Dùng ở (trạng thái × số) |
|---|---|---|
| `A01.1` | Repaired thatched stilt cottage | `lychgate` glb ×11 |
| `A01.2` | Raised wooden walkway segment | `lychgate` glb ×12 · `fens` glb ×25 |
| `A01.3` | Patched low flint wall | `lychgate` glb ×67 |
| `A01.4` | Willow hurdle fence | `lychgate` glb ×25 |
| `A01.5` | Village well | `lychgate` glb ×1 · `fens` glb ×1 |
| `A01.6` | Eel-trap fishing rack | `lychgate` glb ×4 · `fens` glb ×1 |
| `A02.1` | Lychgate roofed gate (with lamp) | `lychgate` glb ×1 |
| `A02.2` | Mortsafe grave cage | `lychgate` glb ×4 |
| `A02.3` | Small mismatched headstone cluster | `lychgate` glb ×3 |
| `A02.4` | Round ossuary tower | `lychgate` glb ×1 |
| `A02.5` | Faceless saint statue supporting an arch (the Nameless Saint) | `lychgate` glb ×1 |
| `A02.6` | Funeral hand cart | `lychgate` glb ×1 |
| `A03.1` | Low grass clump | `lychgate` procedural ×900 · `fens` procedural ×520 · `poppyReach` procedural ×30300 |
| `A03.2` | Tall reeds clump | `lychgate` procedural ×320 · `fens` procedural ×1600 · `poppyReach` procedural ×200 |
| `A03.3` | Sedge water clump | `lychgate` procedural ×220 · `fens` procedural ×185 · `poppyReach` procedural ×140 |
| `A03.4` | Large moss rock | `fens` glb ×7 |
| `A03.5` | Peat bank chunk | `fens` glb ×9 |
| `A03.6` | Waterlogged root stump | `fens` glb ×7 |
| `A04.1` | Old broad weeping willow | `fens` glb ×7 |
| `A04.2` | Young willow | `lychgate` glb ×7 · `fens` glb ×3 · `poppyReach` glb ×5 |
| `A04.3` | Dead angular tree | `fens` glb ×20 |
| `A04.5` | Fallen hollow trunk | `fens` glb ×5 |
| `A04.6` | Exposed willow root cluster | `fens` glb ×1 |
| `A06.1` | Fen causeway segment | `lychgate` glb ×12 · `fens` glb ×29 |
| `A06.1-posts` | Dike revetment posts | `lychgate` kit ×13 · `fens` kit ×36 |
| `A06.2` | Lichen standing stone (upright marker stone) | `fens` glb ×10 |
| `A06.3` | Stepping-stone ford | `fens` glb ×2 |
| `A06.4` | Unlit bog-lure post (empty cage) | `fens` glb ×8 |
| `A06.5` | Half-sunk fen punt | `fens` glb ×5 |
| `A06.6` | Broken bridge pier | `fens` glb ×2 |
| `A07.1` | Half-drowned flint cottage | `fens` glb ×9 |
| `A07.2` | Timber-and-stone weir segment | `fens` glb ×9 |
| `A07.3` | Gable wall with door arch | `fens` glb ×2 |
| `A07.3-door` | Gable wall with door arch (the widened Play door) | `fens` blockout ×2 |
| `A07.4` | Sunken roof-ridge platform | `fens` glb ×2 |
| `A07.4-walk` | Sunken roof-ridge platform (walked) | `fens` blockout ×2 |
| `A07.5` | Pontoon plank raft | `fens` glb ×3 |
| `A07.6` | Rook roost (dead tree) | `fens` kit ×6 |
| `A08.1` | Poppy drift clump | `poppyReach` procedural ×36000 · `gentleHouse` blockout ×9 |
| `A08.2` | Drystone wall (module) | `poppyReach` glb ×299 |
| `A08.2-stile` | Squeeze stile in a drystone wall | `poppyReach` blockout ×1 |
| `A08.3` | Abandoned hillside farmhouse | `poppyReach` blockout ×1 |
| `A08.4` | Hay rick | `poppyReach` glb ×6 |
| `A08.5` | Field gate between stone posts | `poppyReach` blockout ×4 |
| `A08.6` | Poppy-drying rack | `poppyReach` glb ×4 · `gardenOfHush` glb ×6 |
| `A11.1` | Whitewashed cloister bay (three round arches) | `gentleHouse` glb ×12 |
| `A11.2` | Hospice bed | `gentleHouse` glb ×14 |
| `A11.3` | Refectory table with bread (two benches) | `gentleHouse` glb ×3 |
| `A11.4` | Gate tower | `gentleHouse` blockout ×1 |
| `A11.5` | Kitchen hearth with cauldron | `gentleHouse` glb ×1 |
| `A11.6` | Steady candle stand | `gentleHouse` glb ×18 · `gardenOfHush` glb ×2 |
| `A13.1` | Sleeping bed furrow | `gardenOfHush` glb ×65 |
| `A13.2` | Cloth canopy frame | `gardenOfHush` glb ×10 |
| `A13.3` | Pink night-light jar | `gardenOfHush` glb ×263 |
| `A13.4` | Hush bell post | `gardenOfHush` blockout ×15 |
| `A13.5` | Root-vaulted wall bay | `gardenOfHush` glb ×17 |
| `A13.6` | Poppy furrow | `gardenOfHush` glb ×16 |
| `A14.1` | Bone-rail crib frame | `cradle` glb ×60 |
| `A14.2` | Linen curtain pair | `cradle` glb ×9 |
| `A14.3` | Milk-white night-light | `cradle` glb ×32 |
| `A14.4` | Bone mobile on stand | `cradle` glb ×2 |
| `A14.5` | Quilted floor platform | `cradle` glb ×1 |
| `A14.6` | Rocker runner pair | `cradle` glb ×3 |
| `A15.1` | Flint parish church | `lychgate` glb ×1 |
| `A15.2` | Brannoc's forge (the Mortsmith's smithy) | `lychgate` glb ×1 |
| `A15.3` | Sleeper name board | `lychgate` glb ×1 |
| `A15.4` | Mourning bell frame | `lychgate` glb ×1 |
| `A15.5` | Nell Coppercoin's grave-goods stall | `lychgate` glb ×1 |
| `A15.6` | Osric's watch post | `lychgate` glb ×1 |
| `A16.1` | Churchyard yew | `lychgate` glb ×9 |
| `A16.2` | Tarred gibbet (empty cage) | `lychgate` glb ×1 |
| `A16.3` | Grave with jar candles | `lychgate` glb ×28 |
| `A16.4` | Fresh grave | `lychgate` glb ×2 |
| `A16.5` | Unquiet grave (risen, mortsafe bent outward) | `lychgate` glb ×1 |
| `A16.6` | Sexton's lamp post (bowl of milk for the Kind Ones) | `lychgate` glb ×2 |
| `A16.6-lantern` | Lychgate lamp (the lantern head of the A16.6 sexton's lamp) | `lychgate` glb ×1 |
| `A17.1` | The leaning stones (Act I arch) | `fens` glb ×1 |
| `A17.2` | Drowned bell tower | `fens` glb ×1 |
| `A17.3` | The Gentle House boat (linen canopy, still white lamp) | `fens` glb ×1 |
| `A17.4` | Flooded supper table (laid for supper) | `fens` glb ×1 |
| `A17.5` | Flooded window with lace curtains | `fens` glb ×1 |
| `A17.6` | Gentle House night dock | `fens` glb ×1 |
| `A18.1` | Abandoned ox cart with bedding | `poppyReach` glb ×1 |
| `A18.2` | Farmhouse bed with one clean pillow | `poppyReach` glb ×4 |
| `A18.3` | Flint Delvings mine mouth (chalk-and-flint cut) | `poppyReach` glb ×1 |
| `A18.4` | Hospice ward range (exterior) | `poppyReach` glb ×1 · `gentleHouse` blockout |
| `A18.5` | Hospice boundary wall with niche (still candle) | `poppyReach` glb ×20 · `gentleHouse` glb ×4 |
| `A18.6` | Hilltop approach steps | `poppyReach` glb ×1 · `gentleHouse` procedural |
| `A19.1` | Flowers in a vase | `gentleHouse` glb ×8 |
| `A19.2` | Poppy tea on a tray | `gentleHouse` glb ×2 |
| `A19.3` | Mother Hawise's window chair (+ side table) | `gentleHouse` glb ×1 |
| `A19.4` | Linen press | `gentleHouse` glb ×4 |
| `A19.5` | Linen folding screen | `gentleHouse` glb ×2 |
| `A19.6` | Tall ward window (deep sill, one steady candle) | `gentleHouse` glb ×8 |
| `A20.1` | Sleeper: young woman (braid, ribbon keepsake) | `gardenOfHush` glb ×69 |
| `A20.2` | Sleeper: old man (pipe in his folded hands) | `gardenOfHush` glb ×51 |
| `A20.3` | Sleeper: fisherman (knitted cap, cork float) | `gardenOfHush` glb ×67 |
| `A20.4` | Sleeper: farm woman (apron, wooden spoon) | `gardenOfHush` glb ×67 |
| `A20.5` | Irrigation channel piece (sluice) | `gardenOfHush` glb ×8 |
| `A20.6` | Harvest table | `gardenOfHush` glb ×5 |
| `A22.1` | Worn shoes at the foot of the ribbon thorn | `poppyReach` glb ×1 |
| `glb:biome-prop-mushrooms` | Mushroom cluster | `lychgate` glb ×3 · `fens` glb ×5 |
| `glb:biome-prop-riverbank-stones` | Riverbank stones | `lychgate` glb ×5 · `fens` glb ×9 · `poppyReach` glb ×4 |
| `glb:biome-prop-stump` | Mossy stump | `lychgate` glb ×3 · `fens` glb ×4 |
| `glb:dungeon-prop-bone-pile` | Bone pile (skulls to count) | `lychgate` glb ×2 |
| `glb:dungeon-prop-broken-column` | Broken column | `gardenOfHush` glb ×5 |
| `glb:dungeon-prop-candle-cluster` | Candle cluster | `lychgate` glb ×3 · `fens` glb ×2 · `gardenOfHush` glb ×2 |
| `glb:dungeon-prop-crypt-wall` | Crypt wall module (bone niches) | `gardenOfHush` glb · `cradle` glb |
| `glb:dungeon-prop-fallen-bell` | Fallen bell (drowned) | `fens` glb ×1 |
| `glb:dungeon-prop-flint-boulders` | Flint boulders | `lychgate` glb ×7 · `poppyReach` glb ×7 · `gentleHouse` glb ×3 |
| `N-CR01` | Linen floor runner | `cradle` blockout ×1 |
| `N-CR02` | Turned-down quilt | `cradle` glb ×1 |
| `N-CR03` | Linen pillow | `cradle` glb ×1 |
| `N-CR04` | Crypt stair + arch from the Garden of Hush | `cradle` procedural |
| `N-FN01` | The Soothed in procession (P01 stand-in figures, white nightgowns) | `fens` blockout ×12 |
| `N-FN02` | Shoes left at the water's edge (unmarked vignette) | `fens` glb ×1 |
| `N-FN03` | Bog grave (peat mound, willow stake, ribbons) | `fens` glb ×1 |
| `N-FN04` | Small stone cairn | `fens` kit ×1 |
| `N-FN05` | Drying eel net | `fens` kit ×1 |
| `N-FN06` | Toll post with a coin dish (The Ferryman's Toll) | `fens` glb ×1 |
| `N-FN07` | Rook (ambient, circling the roost poles) | `fens` procedural ×8 |
| `N-FN08` | Empty wicker cradle | `fens` glb ×2 |
| `N-GD01` | Root rib arch | `gardenOfHush` glb ×3 |
| `N-GD04` | The lamp ahead | `gardenOfHush` blockout ×1 |
| `N-GD05` | Plank crossing | `gardenOfHush` glb ×1 |
| `N-GD06` | Shroud web (W07 lair) | `gardenOfHush` blockout ×5 |
| `N-GD07` | Root fall (collapsed vault) | `gardenOfHush` glb ×2 |
| `N-GD08` | Harvest basket of poppy heads | `gardenOfHush` glb ×10 |
| `N-GD09` | Poppy Nurse's tending kit (stool, watering can) | `gardenOfHush` glb ×1 |
| `N-GD10` | Linen coverlet turned down (empty bed) | `gardenOfHush` glb ×1 |
| `N-GD11` | Shoes placed at the foot of a furrow | `gardenOfHush` glb ×1 |
| `N-GD12` | Whitewashed stair down from the Gentle House | `gardenOfHush` procedural |
| `N-GD13` | Crypt stair + arch down to the Cradle | `gardenOfHush` procedural |
| `N-GD14` | Irrigation channel runs (sunk floor + still water) | `gardenOfHush` procedural |
| `N-GD15` | Tamsin's lantern on a root bracket | `gardenOfHush` glb ×1 |
| `N-GD16` | Fallen poppy heads and petals | `gardenOfHush` blockout ×46 |
| `N-GH` | The Gentle House, far silhouette (gate tower + long ward + high warm still window) | `lychgate` glb ×1 · `fens` glb ×1 |
| `N-HS02` | Garth flower bed (pale flowers, two poppies) | `gentleHouse` glb ×1 |
| `N-HS03` | Potted flowers (clean terracotta pot) | `gentleHouse` glb ×6 |
| `N-HS04` | Walled flower bed (herbs, white flowers) | `gentleHouse` glb ×4 |
| `N-HS05` | Linen drying line (clean sheets) | `gentleHouse` glb ×1 |
| `N-HS06` | Kitchen work table (bowls, bread) | `gentleHouse` glb ×1 |
| `N-HS07` | Bread rack (fresh loaves) | `gentleHouse` glb ×2 |
| `N-HS08` | Folding table with folded linen | `gentleHouse` glb ×1 |
| `N-HS09` | Night stair down to the Garden of Hush | `gentleHouse` procedural |
| `N-HS10` | Ward range roof (slate, exterior only) | `gentleHouse` blockout ×1 |
| `N-HS11` | East range roof (slate, exterior only) | `gentleHouse` blockout ×1 |
| `N-HS12` | Cloister lean-to roof bay (tiles, exterior only) | `gentleHouse` blockout |
| `N-HS13` | Night stair roof (exterior only) | `gentleHouse` blockout ×1 |
| `N-PR01` | Abandoned reaping (sheaves, scythe, straw hat) | `poppyReach` blockout ×1 |
| `N-PR02` | Harvester's cairn with ribbons and a name slate | `poppyReach` glb ×1 |
| `N-PR03` | Shepherd's crook and folded coat | `poppyReach` glb ×1 |
| `N-PR04` | Lone hawthorn with ribbons (the ribbon thorn) | `poppyReach` glb ×1 |
| `N-PR05` | Straw doll on a stile step | `poppyReach` glb ×1 |
| `N-PR06` | Water trough (farmyard) | `poppyReach` kit ×1 |
| `N-PR07` | Seed sacks | `poppyReach` kit ×1 |
| `N-PR08` | Barrow | `poppyReach` kit ×1 |
| `N-PR09` | Spilled straw | `poppyReach` kit ×1 |
| `N-PR10` | Bramble / hawthorn scrub at wall ends | `poppyReach` kit ×14 |
| `N-PR11` | Landing posts at the causeway (Rook's Weir boats) | `poppyReach` kit ×1 |
| `N01` | Barrow family vault door (portal in the terrace wall) | `lychgate` glb ×1 |
| `N02` | Flint retaining wall (vault terrace) | `lychgate` glb ×4 |
| `N03` | Rain barrel | `lychgate` kit ×10 |
| `N04` | Peat stack | `lychgate` glb ×12 |
| `N05` | Poppy sprig on a door (the Act I accent) | `lychgate` procedural ×11 |
| `N06` | Washing line | `lychgate` kit ×2 |
| `N07` | Drying fish net | `lychgate` kit ×2 |
| `N08` | Village goods (sacks, crates) | `lychgate` kit ×3 |
| `N09` | Low shrubs / brambles at the edges | `lychgate` kit ×44 |
| `N10` | Vigil chair with a folded blanket | `lychgate` glb ×1 |
| `N11` | Crow (ambient; settles after the five rites) | `lychgate` procedural ×6 |
| `N12` | Peat barrow | `lychgate` kit ×1 |
