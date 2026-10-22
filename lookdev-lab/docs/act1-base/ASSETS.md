# ASHLAR · Act I · base maps — asset report

Sinh tự động bởi `scripts/act1-assets-report.mjs` (2026-10-22) từ mọi file `src/env/act1/maps/*.js` (hợp đồng SPEC §6b). **Đừng sửa tay** — sửa file map rồi chạy lại `node scripts/act1-assets-report.mjs`.

Trạng thái: **glb** = model ASHLAR thật · **kit** = kit Blood-Moor cũ đứng thay ("kit tạm", chưa xong) · **procedural** = code tạo tạm (thẻ cỏ/lau, nước, sprig…) · **blockout** = khối thay thế đúng cỡ, model còn thiếu. "Còn thiếu" = mọi asset có trạng thái khác glb. Số lượng = số đặt trong base map (bản cắt đầu, chưa phải độ dài đầy đủ).

## Tóm tắt

| # | Map | Scene | Engine | Mã asset | Đặt | glb | kit | procedural | blockout | Quái (mã) | NPC | Texture thiếu | VFX thiếu |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Lychgate → Churchyard (`lychgate`) | `act1Lychgate` | outdoor | 48 | 1761 | 19 | 9 | 5 | **15** | 6 | 8 | 6 | 10 |
| 2 | Night Fens → Rook's Weir (`fens`) | `act1Fens` | outdoor | 46 | 2548 | 13 | 9 | 4 | **20** | 7 | 1 | 7 | 9 |
| 3 | The Poppy Reach (`poppyReach`) | `act1PoppyReach` | outdoor | 30 | 67051 | 8 | 8 | 4 | **10** | 5 | 0 | 7 | 9 |
| 4 | ASHLAR · Act I · base · Gentle House (`gentleHouse`) | `act1GentleHouse` | interior | 29 | 127 | 8 | 1 | 2 | **18** | 0 | 4 | 7 | 10 |
| 5 | ASHLAR · Act I · base · Garden of Hush (`gardenOfHush`) | `act1GardenOfHush` | interior | 31 | 740 | 9 | 0 | 3 | **19** | 6 | 2 | 6 | 11 |
| 6 | ASHLAR · Act I · base · The Cradle (`cradle`) | `act1Cradle` | interior | 11 | 110 | 1 | 0 | 1 | **9** | 5 | 0 | 5 | 10 |

## Lychgate → Churchyard — `lychgate`

Scene `act1Lychgate` · engine outdoor · BIO-03 · file `src/env/act1/maps/lychgate.js` · độ dài đề xuất: 360 m — Full game: hub crossing ≈ 40 s (≈ 220 m of lane at 5.6 m/s run) — this slice has ≈ 130 m of lane; the churchyard (20 min) would grow north and west to ≈ 180 × 140 m with two more grave terraces; keep the island-in-black-water frame and the lychgate as the only gap.

Mã asset: 48 — glb (model ASHLAR thật): **19** · kit tạm (kit cũ đứng thay): **9** · procedural (code tạo tạm): **5** · blockout (khối thay thế): **15**.

### Asset

| Mã | Tên | Loại | Cỡ (m) R × C × S | Số | Trạng thái | Nguồn | Đoạn | Ghi chú |
|---|---|---|---|---|---|---|---|---|
| `A01.1` | Repaired thatched stilt cottage | building | 4.6 × 5.2 × 4 | 11 | **blockout** | concept A01 cell 1 (E03 village kit) | hub | body 4.6 × 4.0 m on 0.7 m stilts, ridge 5.2 m (sheet ≈ 3.4–5.3 m tall); amber window, a poppy sprig on the door |
| `A01.2` | Raised wooden walkway segment | structure | 4 × 1.2 × 1.4 | 8 | **blockout** | concept A01 cell 2 (E03 village kit) | hub | built per deck segment from the walkway paths (deck mesh = walk surface); 4 m pieces, posts every corner |
| `A01.3` | Patched low flint wall | structure | 3.4 × 1.4 × 0.7 | 67 | **blockout** | concept A01 cell 3 (E03 village kit) | both | module 3.4 m; the churchyard boundary (the lychgate is its only gap) and the village west wall |
| `A01.4` | Willow hurdle fence | structure | 3.2 × 1.4 × 0.18 | 25 | **blockout** | concept A01 cell 4 (E03 village kit) | hub |  |
| `A01.5` | Village well | structure | 2.2 × 3.4 × 2 | 1 | **blockout** | concept A01 cell 5 (E03 village kit) | hub |  |
| `A01.6` | Eel-trap fishing rack | structure | 3.96 × 1.8 × 1.38 | 4 | **kit** (`kit:crafts.fishing_net`) | concept A01 cell 6 (E03 village kit) | hub | kit tạm (camp fishing net between poles, native 3.96 × 1.8 × 1.38 m; concept rack 3.4 × 3.0 × 1.6): same class of object, lower; REUSE_CANDIDATES.md |
| `A15.2` | Brannoc's forge (the Mortsmith's smithy) | building | 6 × 4.05 × 4.1 | 1 | glb (`act1-a15-2-forge`) | concept A15 cell 2 (v2 batch) | hub | GLB 6 × 4.05 × 4.1 m; its −x and −z sides are a plain panel (single-image guess): turned yaw −45 so both face away from the game camera, the open front to the square; hearth glow = a real human light (1/f flicker) on the model hearth |
| `A15.3` | Sleeper name board | story | 2.6 × 2.31 × 1.24 | 1 | glb (`act1-a15-3-name-board`) | concept A15 cell 3 (v2 batch) | hub | GLB 2.6 × 2.31 × 1.24 m (roof overhang, garlands); plain back: faces the square and the camera (yaw 0), the back to the lane side; blocks along the board |
| `A15.4` | Mourning bell frame | structure | 3.14 × 3.4 × 1.98 | 1 | glb (`act1-a15-4-bell-frame`) | concept A15 cell 4 (v2 batch) | hub | GLB 3.14 × 3.4 × 1.98 m (stone plinths, braces, leaning planks: chunkier than the 2.2 m concept) |
| `A15.5` | Nell Coppercoin's grave-goods stall | prop | 4.01 × 2.3 × 1.93 | 1 | glb (`act1-a15-5-grave-goods-stall`) | concept A15 cell 5 (v2 batch) | hub | GLB 4.0 × 2.3 × 1.93 m with the cart shafts (awning 3 m, centred on the placement point); plain back (−z) turned away from the camera |
| `A15.6` | Osric's watch post | structure | 3 × 3.89 × 3.46 | 1 | glb (`act1-a15-6-watch-post`) | concept A15 cell 6 (v2 batch) | hub | GLB 3 × 3.89 × 3.46 m; deck at 1.65 m (not walkable in the base map), fire basket = human light on the model basket |
| `N01` | Barrow family vault door (portal in the terrace wall) | story | 2.4 × 2.8 × 0.8 | 1 | **blockout** | LD only, no concept | hub | side quest One for the Footing; under the ossuary, faces the village |
| `N02` | Flint retaining wall (vault terrace) | structure | 4 × 3.2 × 0.9 | 8 | **blockout** | LD only, no concept | hub | keeps the hub terrace from the summit: the lychgate stays the only way into the churchyard |
| `N03` | Rain barrel | prop | 0.8 × 1 × 0.8 | 10 | **kit** (`kit:kitchen.water_barrel`) | LD only, no concept | hub | kit tạm: camp kitchen water barrel (2.1 m wide piece) |
| `N04` | Peat stack | prop | 1.6 × 1.1 × 1 | 12 | **blockout** | LD only, no concept | hub |  |
| `N05` | Poppy sprig on a door (the Act I accent) | prop | 0.25 × 0.4 × 0.08 | 11 | **procedural** | LD only, no concept | hub | the only accent of the hub; hidden in the Prologue night (no accent) |
| `N06` | Washing line | prop | 4.1 × 2.1 × 0.85 | 2 | **kit** (`kit:crafts.laundry_line`) | LD only, no concept | hub | kit tạm |
| `N07` | Drying fish net | prop | 4 × 1.8 × 1.4 | 2 | **kit** (`kit:crafts.fishing_net`) | LD only, no concept | hub | kit tạm |
| `N08` | Village goods (sacks, crates) | prop | 1.9 × 1.3 × 1.8 | 3 | **kit** (`kit:storage.sacks`) | LD only, no concept | hub | kit tạm |
| `N12` | Peat barrow | prop | 1.2 × 1 × 2.4 | 1 | **kit** (`kit:animals.wheelbarrow`) | LD only, no concept | hub | kit tạm (camp wheelbarrow) |
| `N09` | Low shrubs / brambles at the edges | vegetation | 1.2 × 0.5 × 1.1 | 44 | **kit** (`kit:shrubs.shrub_05`) | LD only, no concept | both | kit tạm (Blood-Moor shrub) |
| `A04.2` | Young willow | vegetation | 4 × 6 × 4 | 7 | **blockout** | concept A04 cell 2 (E02 willow kit) | hub | at the mere and fen edge |
| `A03.1` | Low grass clump | vegetation | 0.6 × 0.5 × 0.6 | 900 | **procedural** | concept A03 cell 1 (E01 fen kit) | both | Dark Wood grass cards on the grass layers |
| `A03.2` | Tall reeds clump | vegetation | 0.8 × 1.8 × 0.8 | 320 | **procedural** | concept A03 cell 2 (E01 fen kit) | both | shore-plant cards (biome-shore-plants) along the fen and the mere |
| `A03.3` | Sedge water clump | vegetation | 0.7 × 0.9 × 0.7 | 220 | **procedural** | concept A03 cell 3 (E01 fen kit) | both |  |
| `glb:biome-prop-stump` | Mossy stump | vegetation | 0.8 × 0.5 × 0.8 | 3 | glb (`biome-prop-stump`) | ashlar/3d/props/clutter_v1/mossy_stump | hub |  |
| `glb:biome-prop-riverbank-stones` | Riverbank stones | rock | 1 × 0.35 × 1 | 5 | glb (`biome-prop-riverbank-stones`) | ashlar/3d/props/clutter_v1/riverbank_stones | both |  |
| `glb:dungeon-prop-flint-boulders` | Flint boulders | rock | 2 × 1 × 2 | 7 | glb (`dungeon-prop-flint-boulders`) | ashlar/3d/props/dungeon_v1/flint_boulders | churchyard | flint country: on the hill flanks |
| `glb:dungeon-prop-bone-pile` | Bone pile (skulls to count) | prop | 1.2 × 0.6 × 1.2 | 2 | glb (`dungeon-prop-bone-pile`) | ashlar/3d/props/dungeon_v1/bone_pile | hub | the children count skulls here, under the ossuary |
| `glb:dungeon-prop-candle-cluster` | Candle cluster | prop | 0.8 × 0.8 × 0.8 | 3 | glb (`dungeon-prop-candle-cluster`) | ashlar/3d/props/dungeon_v1/candle_cluster | both |  |
| `glb:biome-prop-mushrooms` | Mushroom cluster | vegetation | 0.4 × 0.3 × 0.4 | 3 | glb (`biome-prop-mushrooms`) | ashlar/3d/props/clutter_v1/mushroom_cluster | churchyard |  |
| `A02.1` | Lychgate roofed gate (with lamp) | structure | 3.4 × 3.8 × 2.6 | 1 | **blockout** | concept A02 cell 1 (E04 burial kit) | both | THE light threshold hub ↔ churchyard; passage 2.3 m between the flint plinths; lamp under the roof = human light |
| `A02.2` | Mortsafe grave cage | structure | 2.6 × 1.2 × 1.4 | 4 | **blockout** | concept A02 cell 2 (E04 burial kit) | churchyard |  |
| `A02.3` | Small mismatched headstone cluster | rock | 3 × 1.6 × 2 | 3 | **blockout** | concept A02 cell 3 (E04 burial kit) | churchyard |  |
| `A02.4` | Round ossuary tower | building | 4.8 × 7.8 × 4.8 | 1 | **blockout** | concept A02 cell 4 (E04 burial kit) | churchyard | landmark on the dry summit (sheet reads 4.6–9 m tall); door faces the church |
| `A02.5` | Faceless saint statue supporting an arch (the Nameless Saint) | story | 2.4 × 4.3 × 1.2 | 1 | **blockout** | concept A02 cell 5 (E04 burial kit) | churchyard | ON the path, faces down toward the lychgate (it turns only off-screen); the path parts round its plinth, both lanes under the ends of its arch (only the plinth blocks the hero) |
| `A02.6` | Funeral hand cart | prop | 2.48 × 0.97 × 1.25 | 1 | **kit** (`kit:animals.wheelbarrow`) | concept A02 cell 6 (E04 burial kit) | churchyard | kit tạm (camp wheelbarrow at ×1.2 = 3.0 × 1.16 × 1.5 m; concept hand cart 3.2 × 1.2 × 1.4): the nearest hand cart, worn wood |
| `A15.1` | Flint parish church | building | 16 × 9.87 × 10.69 | 1 | glb (`act1-a15-1-flint-church`) | concept A15 cell 1 (v2 batch) | churchyard | GLB 16 × 9.87 × 10.69 m (walls ±3.6 m, buttresses to ±5.35 m: the collision box is the full 10.7 m depth); bell-cote 9.9 m on the west gable; door west (−x), down the slope to the lychgate |
| `A16.1` | Churchyard yew | vegetation | 9.44 × 9 × 8.22 | 9 | glb (`act1-a16-1-yew`) | concept A16 cell 1 (v2 batch) | churchyard | GLB 9.4 × 9 × 8.2 m (crown about round); only at the edges; the trunk and its root flare block (4.4 × 4 m), the crown does not |
| `A16.2` | Tarred gibbet (empty cage) | structure | 4.69 × 4.6 × 2.69 | 1 | glb (`act1-a16-2-gibbet`) | concept A16 cell 2 (v2 batch) | churchyard | GLB 4.7 × 4.6 × 2.7 m (base of stones and grass, arm 2.4 m); no body, no noose; the post (GLB (−0.91, −0.09)) stands on the placement point; only the post and its stones block; crows |
| `A16.3` | Grave with jar candles | story | 1.98 × 0.93 × 2.2 | 28 | glb (`act1-a16-3-jar-candle-grave`) | concept A16 cell 3 (v2 batch) | churchyard | GLB 2.0 × 0.93 × 2.2 m (jars and grass round the mound; the mound blocks); the model's jars are unlit with sooty rims, but the LD keeps them lit by day (Act I) and all out in the Prologue night: three small still-flicker glows sit in three of its jars (flag graveCandles) |
| `A16.4` | Fresh grave | story | 1.77 × 0.82 × 2.4 | 2 | glb (`act1-a16-4-fresh-grave`) | concept A16 cell 4 (v2 batch) | churchyard | GLB 1.77 × 0.82 × 2.4 m (planks and the rope coil on +x, the spade at the foot) |
| `A16.5` | Unquiet grave (risen, mortsafe bent outward) | story | 2.48 × 1.15 × 2.6 | 1 | glb (`act1-a16-5-unquiet-grave`) | concept A16 cell 5 (v2 batch) | churchyard | GLB 2.5 × 1.15 × 2.6 m (stone kerb and spoil) |
| `A16.6` | Sexton's lamp post (bowl of milk for the Kind Ones) | structure | 1.3 × 2.6 × 0.8 | 2 | glb (`act1-a16-6-sexton-lamp`) | concept A16 cell 6 (v2 batch) | churchyard | GLB 1.3 × 2.6 × 0.8 m; the post (GLB (−0.29, −0.02)) stands on the placement point, only it blocks; the lamp glow sits on the model lantern (0.71 m out, 1.95 m up) |
| `N10` | Vigil chair with a folded blanket | prop | 0.6 × 0.95 × 0.6 | 1 | **blockout** | LD only, no concept | churchyard | unmarked vignette: someone still keeps watch at a small grave |
| `N11` | Crow (ambient; settles after the five rites) | story | 0.45 × 0.35 × 0.25 | 6 | **procedural** | LD only, no concept | churchyard |  |
| `A06.1` | Fen causeway segment (dike revetment posts) | structure | 2.31 × 0.9 × 0.51 | 13 | **kit** (`kit:fence.run_broken`) | concept A06 cell 1 (Night Fens kit) | fenroad | kit tạm (Blood-Moor broken fence run, 2.31 m modules) as the dike revetment posts; the dike road out of the village toward the Night Fens |
| `N-GH` | The Gentle House, far silhouette (gate tower + long ward + high warm still window) | story | 46 × 20 × 30 | 1 | glb (`act1-a18-4-hospice-range`) | act1 GLBs A18.4 ward range + 11 × A18.5 wall-with-niche sections (env/act1/gentleHouseFar.js); A11.4 gate tower still a box | far | shared far silhouette of the outdoor maps: the A18.4 range's own lit window carries the brightest, stillest light of the act (glow in the VFX layer: it reads through the fog); A11.4 has no model yet (box); if a GLB fails the full compound blockout stands in |

### Còn thiếu (29)

- **blockout (khối thay thế)** (15): `A01.1` Repaired thatched stilt cottage ×11 · `A01.2` Raised wooden walkway segment ×8 · `A01.3` Patched low flint wall ×67 · `A01.4` Willow hurdle fence ×25 · `A01.5` Village well ×1 · `N01` Barrow family vault door (portal in the terrace wall) ×1 · `N02` Flint retaining wall (vault terrace) ×8 · `N04` Peat stack ×12 · `A04.2` Young willow ×7 · `A02.1` Lychgate roofed gate (with lamp) ×1 · `A02.2` Mortsafe grave cage ×4 · `A02.3` Small mismatched headstone cluster ×3 · `A02.4` Round ossuary tower ×1 · `A02.5` Faceless saint statue supporting an arch (the Nameless Saint) ×1 · `N10` Vigil chair with a folded blanket ×1
- **procedural (code tạo tạm)** (5): `N05` Poppy sprig on a door (the Act I accent) ×11 · `A03.1` Low grass clump ×900 · `A03.2` Tall reeds clump ×320 · `A03.3` Sedge water clump ×220 · `N11` Crow (ambient; settles after the five rites) ×6
- **kit tạm (kit cũ đứng thay)** (9): `A01.6` Eel-trap fishing rack ×4 · `N03` Rain barrel ×10 · `N06` Washing line ×2 · `N07` Drying fish net ×2 · `N08` Village goods (sacks, crates) ×3 · `N12` Peat barrow ×1 · `N09` Low shrubs / brambles at the edges ×44 · `A02.6` Funeral hand cart ×1 · `A06.1` Fen causeway segment (dike revetment posts) ×13

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

Mã asset: 46 — glb (model ASHLAR thật): **13** · kit tạm (kit cũ đứng thay): **9** · procedural (code tạo tạm): **4** · blockout (khối thay thế): **20**.

### Asset

| Mã | Tên | Loại | Cỡ (m) R × C × S | Số | Trạng thái | Nguồn | Đoạn | Ghi chú |
|---|---|---|---|---|---|---|---|---|
| `A06.1` | Fen causeway segment (dike revetment posts) | structure | 2.31 × 0.9 × 0.51 | 36 | **kit** (`kit:fence.run_broken`) | concept A06 cell 1 (Night Fens kit) | fens | kit tạm (Blood-Moor broken fence run, 2.31 m modules); the causeway is the dike terrain itself; these are its revetment posts, run along the dike banks below the crest (no collision needed) |
| `A06.2` | Lichen standing stone (upright marker stone) | rock | 0.9 × 2.6 × 0.7 | 10 | **blockout** | concept A06 cell 2 (Night Fens kit) | fens | sheet reads ≈ 2–3 m; a ring of five on the stone island (rite 1), singles as route markers on the dikes |
| `A06.3` | Stepping-stone ford (one tile of river stones) | rock | 1 × 0.46 × 0.93 | 14 | glb (`biome-prop-riverbank-stones`) | concept A06 cell 3 (Night Fens kit) | fens | glb tạm: the ASHLAR riverbank stones tiled seven to a 7 m ford (the concept ford is 2.4 × 0.5 × 7 m) along a causeway 6 cm under the water (the walk surface); the stones are walk-through |
| `A06.4` | Unlit bog-lure post (empty cage) | structure | 1.47 × 2.82 × 0.84 | 8 | **kit** (`kit:lighting.lantern_post`) | concept A06 cell 4 (Night Fens kit) | fens | kit tạm (camp lantern post: an empty dark cage on an arm, no flame, no emissive, no light); never lit: the corpse-candles are the lure; on the dike banks, base at the waterline |
| `A06.5` | Half-sunk fen punt | prop | 3.4 × 0.7 × 1.2 | 5 | **blockout** | concept A06 cell 5 (Night Fens kit) | fens | at the water level − 0.3 m |
| `A06.6` | Broken bridge pier | structure | 3.8 × 5 × 2.2 | 2 | **blockout** | concept A06 cell 6 (Night Fens kit) | fens | two piers of the fallen bridge stand in the channel; the route detours over the ford |
| `A17.1` | The leaning stones (Act I arch) | story | 4.6 × 4.6 × 1.4 | 1 | **blockout** | concept A17 cell 1 (v2 batch) | fens | THE landmark of the fens: over the dike, 4.6 m; passage 2.44 m (concept 1.6 m, widened for the 1 m Play grid). Stays a blockout: the A17.1 GLB opens only 0.9–1.1 m (2.44 m needed; ×2.2 would make it 10 m tall) and stands on a 5.9 m ground disc that would cover the dike |
| `A03.1` | Low grass clump | vegetation | 0.6 × 0.5 × 0.6 | 520 | **procedural** | concept A03 cell 1 (E01 fen kit) | both | Dark Wood grass cards on the grass layers (crests, islands) |
| `A03.2` | Tall reeds clump | vegetation | 0.8 × 1.8 × 0.8 | 1600 | **procedural** | concept A03 cell 2 (E01 fen kit) | both | shore-plant cards: fringes on every bank and dense reed shoals in the open water (sheet reads up to ≈ 2.5 m) |
| `A03.3` | Sedge water clump | vegetation | 0.7 × 0.9 × 0.7 | 185 | **procedural** | concept A03 cell 3 (E01 fen kit) | both |  |
| `A03.4` | Large moss rock | rock | 3.15 × 1.8 × 2.01 | 7 | **kit** (`kit:mossy.standard_side`) | concept A03 cell 4 (E01 fen kit) | fens | kit tạm: Blood-Moor mossy rock, the side piece at its own size (placed ×0.64–0.88 ≈ the 2.3 × 1.6 × 2.0 m sheet; no per-axis stretch) |
| `A03.5` | Peat bank chunk | rock | 2.9 × 1.4 × 1.2 | 9 | **blockout** | concept A03 cell 5 (E01 fen kit) | fens |  |
| `A03.6` | Waterlogged root stump | vegetation | 1.4 × 1.3 × 1.4 | 7 | **kit** (`kit:deadTrees.stump`) | concept A03 cell 6 (E01 fen kit) | both | kit tạm (Blood-Moor dead-tree stump) |
| `A04.1` | Old broad weeping willow | vegetation | 6 × 5.4 × 6 | 7 | **blockout** | concept A04 cell 1 (E02 willow kit) | fens | sheet reads ≈ 5 m tall, 5.5 m wide; placed at ×1.0–1.25 on the islands, the trunk blocks |
| `A04.2` | Young willow | vegetation | 4 × 6 × 4 | 3 | **blockout** | concept A04 cell 2 (E02 willow kit) | fens | along the side dike to the Willow Mere |
| `A04.3` | Dead angular tree | vegetation | 3 × 7 × 3 | 20 | **kit** (`kit:deadTrees.tall`) | concept A04 cell 3 (E02 willow kit) | fens | kit tạm (Blood-Moor dead tree stretched to the sheet size ≈ 3.8H); many stand in the open water |
| `A04.5` | Fallen hollow trunk | vegetation | 5 × 1.3 × 1.6 | 5 | **blockout** | concept A04 cell 5 (E02 willow kit) | fens |  |
| `A04.6` | Exposed willow root cluster | vegetation | 4.6 × 2.2 × 4 | 1 | **blockout** | concept A04 cell 6 (E02 willow kit) | fens | on the side dike to the Willow Mere (its kit is the Mere's) |
| `glb:biome-prop-riverbank-stones` | Riverbank stones | rock | 1 × 0.35 × 1 | 9 | glb (`biome-prop-riverbank-stones`) | ashlar/3d/props/clutter_v1/riverbank_stones | both |  |
| `glb:biome-prop-stump` | Mossy stump | vegetation | 0.8 × 0.5 × 0.8 | 4 | glb (`biome-prop-stump`) | ashlar/3d/props/clutter_v1/mossy_stump | fens |  |
| `glb:biome-prop-mushrooms` | Mushroom cluster | vegetation | 0.4 × 0.3 × 0.4 | 5 | glb (`biome-prop-mushrooms`) | ashlar/3d/props/clutter_v1/mushroom_cluster | fens |  |
| `glb:dungeon-prop-candle-cluster` | Candle cluster (unlit) | prop | 0.8 × 0.8 × 0.8 | 2 | glb (`dungeon-prop-candle-cluster`) | ashlar/3d/props/dungeon_v1/candle_cluster | both | at the rite sites, all out: no human light in the night fens |
| `glb:dungeon-prop-fallen-bell` | Fallen bell (drowned) | prop | 1.3 × 1.25 × 1.3 | 1 | glb (`dungeon-prop-fallen-bell`) | ashlar/3d/props/dungeon_v1/fallen_bell | weir | half under the black water below the drowned bell tower |
| `A07.1` | Half-drowned flint cottage | building | 7 × 6.2 × 5 | 9 | **blockout** | concept A07 cell 1 (Rook's Weir kit) | weir | base 1.2 m under the water: 1.7 m of wall shows, ridge +4.2 m; no lit window (the village is empty) |
| `A07.2` | Timber-and-stone weir segment | structure | 4.2 × 1.9 × 1 | 12 | **blockout** | concept A07 cell 2 (Rook's Weir kit) | weir | run along the south face of the weir dike (its crest is the walk); two broken segments stand in the water west of it |
| `A07.3` | Gable wall with door arch | building | 5 × 5.3 × 0.7 | 4 | **blockout** | concept A07 cell 3 (Rook's Weir kit) | weir | the plank lane passes through one; two make the supper-house ruin; one is rite 5 (door 2.2 × 2.6 m, concept ≈ 1.3 × 2.3, widened for Play) |
| `A07.4` | Sunken roof-ridge platform | building | 6 × 3.2 × 4.8 | 4 | **blockout** | concept A07 cell 4 (Rook's Weir kit) | weir | ridge 1.0 m above the water; two carry the plank walk (walkways `ridgeW`, `ridgeE`): "walk on roofs" |
| `A07.5` | Pontoon plank raft | structure | 3.6 × 1.7 × 2.4 | 3 | **blockout** | concept A07 cell 5 (Rook's Weir kit) | weir | deck +0.48 m; the walk surface is its raft walkway (deck 0.5 m), the junctions of the plank lanes |
| `A07.6` | Rook roost (dead tree) | structure | 4.19 × 3.42 × 1.81 | 6 | **kit** (`kit:deadTrees.tall`) | concept A07 cell 6 (Rook's Weir kit) | weir | kit tạm: a Blood-Moor dead tree at ×1.35 standing in the water (base 0.4 m under it, top ≈ 4.2 m above it; the concept pole is 4.75 m) — rooks nest in dead trees; they circle it and settle on its branch tips |
| `A01.2` | Raised wooden walkway segment (plank bridge) | structure | 4 × 1.2 × 1.4 | 14 | **blockout** | concept A01 cell 2 (E03 village kit) | weir | the plank bridges of Rook's Weir (deck 0.62 m, 1.8 m wide): built per deck segment from the walkway paths (the deck mesh is the walk surface) |
| `A01.5` | Village well | structure | 2.2 × 3.4 × 2 | 1 | **blockout** | concept A01 cell 5 (E03 village kit) | weir | the drowned village well on its stone platform (WELL): the junction of the plank lanes and the one dry spawn spot |
| `A17.2` | Drowned bell tower | building | 5.74 × 10 × 7.1 | 1 | glb (`act1-a17-2-drowned-bell-tower`) | concept A17 cell 2 (v2 batch) | weir | GLB 5.7 × 10 × 7.1 m (with the rook's nest on −x), cut flat at the waterline: its base stands 0.25 m under the water (≈ 9.75 m above it), not on the bed; louvres, bell, patched slate cap |
| `A17.3` | The Gentle House boat (linen canopy, still white lamp) | story | 7 × 3.23 × 2.02 | 1 | glb (`act1-a17-3-gentle-boat`) | concept A17 cell 3 (v2 batch) | weir | GLB 7 × 3.23 × 2.02 m, keel 0.25 m under the water; moored along the dock's deck edge; the canopy is Mercy's clean linen, the bow lamp burns still and even (Perfection light, on the model lamp) |
| `A17.4` | Flooded supper table (laid for supper) | prop | 2.4 × 1.31 × 1.46 | 1 | glb (`act1-a17-4-flooded-supper-table`) | concept A17 cell 4 (v2 batch) | weir | GLB 2.4 × 1.31 × 1.46 m; in the roofless supper-house ruin: the top (0.94 m) lies 0.14 m under the water; the jug and chair backs break the surface |
| `A17.5` | Flooded window with lace curtains | building | 2.2 × 2.21 × 1.39 | 1 | glb (`act1-a17-5-flooded-lace-window`) | concept A17 cell 5 (v2 batch) | weir | GLB 2.2 × 2.21 × 1.39 m (the lace is a solid mass; its dark half-disc floor behind the wall lies under the black water); the north wall of the supper-house ruin, seen from its doorway, sill 0.15 m above the water |
| `A17.6` | Gentle House night dock | structure | 6 × 3.44 × 2.96 | 1 | glb (`act1-a17-6-gentle-dock`) | concept A17 cell 6 (v2 batch) | weir | GLB 6 × 3.44 × 2.96 m, deck 0.94 m above its base: placed so the deck top is the walkway `dock` (0.62 m; the posts end 0.3 m under the water), whose own planks are hidden (walk surface only); the still white lamp on its lamp post (+z side), a strip of clean linen |
| `N-FN01` | The Soothed in procession (P01 stand-in figures, white nightgowns) | linen | 0.55 × 1.75 × 0.45 | 12 | **blockout** | LD only, no concept (P01 sheet: ashlar/art/map-01-concepts/monsters) | fens | the Remember image: a line wading waist-deep along the drowned road toward the far window; the only clean white in Dolmoor |
| `N-FN02` | Shoes left at the water's edge (unmarked vignette) | prop | 0.45 × 0.16 × 0.45 | 1 | **blockout** | LD only, no concept | fens |  |
| `N-FN03` | Bog grave (peat mound, willow stake, ribbons) | story | 1.77 × 0.82 × 2.4 | 1 | glb (`act1-a16-4-fresh-grave`) | LD only, no concept | fens | glb tạm: the churchyard fresh grave A16.4 (heaped earth, marker post, spade) in the same form; the willow stake and ribbons are still missing; rite 4 |
| `N-FN04` | Small stone cairn | rock | 1.73 × 0.84 × 1.36 | 1 | **kit** (`kit:rocks.low`) | LD only, no concept | fens | kit tạm (Blood-Moor low rock at its own size; the old shrine cairn was squashed ×0.5): the heart of the lichen ring, rite 1 |
| `N-FN05` | Drying eel net | prop | 4 × 1.8 × 1.4 | 1 | **kit** (`kit:crafts.fishing_net`) | LD only, no concept | fens | kit tạm: the eel-catcher's net at rite 2 |
| `A01.6` | Eel-trap fishing rack | structure | 3.96 × 1.8 × 1.38 | 1 | **kit** (`kit:crafts.fishing_net`) | concept A01 cell 6 (E03 village kit) | fens | kit tạm (camp fishing net between poles); rite 2: the drowned eel-catcher's rack by the broken bridge |
| `N-FN06` | Toll post with a coin dish (The Ferryman's Toll) | story | 0.5 × 1.3 × 0.5 | 1 | **blockout** | LD only, no concept | weir |  |
| `N-FN07` | Rook (ambient, circling the roost poles) | story | 0.45 × 0.35 × 0.25 | 8 | **procedural** | LD only, no concept | weir | they circle until the Count is done (toggle "các mộ đã yên"), then settle on the poles |
| `N-FN08` | Empty wicker cradle | story | 1 × 0.75 × 0.6 | 2 | **blockout** | LD only, no concept | fens | in the Lullaby Man's arena |
| `N-GH` | The Gentle House, far silhouette (gate tower + long ward + high warm still window) | story | 46 × 20 × 30 | 1 | glb (`act1-a18-4-hospice-range`) | act1 GLBs A18.4 ward range + 11 × A18.5 wall-with-niche sections (env/act1/gentleHouseFar.js); A11.4 gate tower still a box | far | shared far silhouette of the outdoor maps: the A18.4 range's own lit window carries the brightest, stillest light of the act (glow in the VFX layer: it reads through the fog); A11.4 has no model yet (box); if a GLB fails the full compound blockout stands in |

### Còn thiếu (33)

- **blockout (khối thay thế)** (20): `A06.2` Lichen standing stone (upright marker stone) ×10 · `A06.5` Half-sunk fen punt ×5 · `A06.6` Broken bridge pier ×2 · `A17.1` The leaning stones (Act I arch) ×1 · `A03.5` Peat bank chunk ×9 · `A04.1` Old broad weeping willow ×7 · `A04.2` Young willow ×3 · `A04.5` Fallen hollow trunk ×5 · `A04.6` Exposed willow root cluster ×1 · `A07.1` Half-drowned flint cottage ×9 · `A07.2` Timber-and-stone weir segment ×12 · `A07.3` Gable wall with door arch ×4 · `A07.4` Sunken roof-ridge platform ×4 · `A07.5` Pontoon plank raft ×3 · `A01.2` Raised wooden walkway segment (plank bridge) ×14 · `A01.5` Village well ×1 · `N-FN01` The Soothed in procession (P01 stand-in figures, white nightgowns) ×12 · `N-FN02` Shoes left at the water's edge (unmarked vignette) ×1 · `N-FN06` Toll post with a coin dish (The Ferryman's Toll) ×1 · `N-FN08` Empty wicker cradle ×2
- **procedural (code tạo tạm)** (4): `A03.1` Low grass clump ×520 · `A03.2` Tall reeds clump ×1600 · `A03.3` Sedge water clump ×185 · `N-FN07` Rook (ambient, circling the roost poles) ×8
- **kit tạm (kit cũ đứng thay)** (9): `A06.1` Fen causeway segment (dike revetment posts) ×36 · `A06.4` Unlit bog-lure post (empty cage) ×8 · `A03.4` Large moss rock ×7 · `A03.6` Waterlogged root stump ×7 · `A04.3` Dead angular tree ×20 · `A07.6` Rook roost (dead tree) ×6 · `N-FN04` Small stone cairn ×1 · `N-FN05` Drying eel net ×1 · `A01.6` Eel-trap fishing rack ×1

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

Mã asset: 30 — glb (model ASHLAR thật): **8** · kit tạm (kit cũ đứng thay): **8** · procedural (code tạo tạm): **4** · blockout (khối thay thế): **10**.

### Asset

| Mã | Tên | Loại | Cỡ (m) R × C × S | Số | Trạng thái | Nguồn | Đoạn | Ghi chú |
|---|---|---|---|---|---|---|---|---|
| `A08.1` | Poppy drift clump | vegetation | 1.3 × 0.9 × 1.3 | 36000 | **procedural** | concept A08 cell 1 | all | the field: ≈ 36 000 instanced clumps (6–8 stems, cupped red #B3262A heads, buds) in drifts with breathing room, swaying with the wind; the placed items mark the drift centres. Sheet clump ≈ 0.6 H tall, field clumps 0.42–0.82 m |
| `A08.2` | Drystone wall (module) | structure | 3.2 × 1.3 × 0.7 | 327 | **blockout** | concept A08 cell 2 | all | field walls make the lanes; on a slope each module stands on its lowest ground (stepped walls); also the round sheepfold |
| `A08.2-stile` | Squeeze stile in a drystone wall | structure | 3.2 × 1.3 × 0.7 | 1 | **blockout** | concept A08 cell 2 (the stile in the wall) | farm | a 1.8 m gap with a worn sill and step stones (the walk grid passes, the wall stubs block) |
| `A08.3` | Abandoned hillside farmhouse | building | 8 × 6.4 × 5.4 | 1 | **blockout** | concept A08 cell 3 | farm | walls 2.7 m, ridge 5.4 m, chimney 6.4 m; the east half of the roof has fallen in (bare rafters) so the three empty beds show from above; the door (1.8 m) is walkable |
| `A08.4` | Hay rick | prop | 3 × 3.2 × 3 | 6 | **blockout** | concept A08 cell 4 | all | sheet ≈ 1.35 H + pole |
| `A08.5` | Field gate between stone posts | structure | 4.4 × 1.6 × 0.7 | 4 | **blockout** | concept A08 cell 5 | all | gate swung open into the field; 3.2 m between the posts |
| `A08.6` | Poppy-drying rack | prop | 2.82 × 2.07 × 1.4 | 4 | **kit** (`kit:crafts.herb_rack`) | concept A08 cell 6 | farm | kit tạm (camp herb rack, native 2.82 × 2.07 × 1.4 m; concept 3.6 × 2.3 × 1.4): dark bunches hung on a frame, a basket beneath (no red heads yet) |
| `A18.1` | Abandoned ox cart with bedding | prop | 2.31 × 1.85 × 4 | 1 | glb (`act1-a18-1-ox-cart`) | concept A18 cell 1 (v2 batch) | landing | GLB 2.3 × 1.85 × 4 m; shafts down, quilts, a straw mattress and one clean pillow — as if someone was carried away asleep (vignette) |
| `A18.2` | Farmhouse bed with one clean pillow | prop | 1.57 × 0.98 × 2 | 4 | glb (`act1-a18-2-bed-clean-pillow`) | concept A18 cell 2 (v2 batch) | farm | GLB 1.57 × 0.98 × 2 m (drooping blanket); three in the farmhouse at ×0.85 (1.33 m wide: three fit side by side in the 3.8 m east half under the fallen roof), empty, each one clean pillow — Mercy's linen; one at ×1 dragged out into the poppies (unmarked vignette) |
| `A18.3` | Flint Delvings mine mouth (chalk-and-flint cut) | rock | 4 × 2.69 × 3.77 | 1 | glb (`act1-a18-3-delvings-mouth`) | concept A18 cell 3 (v2 batch) | mine | GLB 4 × 2.69 × 3.77 m placed ×1.34 (5.4 × 3.6 × 5.0 m, lintel ≈ 2.9 m): a rock knoll with its own timber portal (the old mine-timber GLB is dropped); the portal is a painted recess, not a tunnel, so the whole knoll blocks (two crossed rects ≈ its round footprint); the plain back is turned into the chalk knoll; the side exit to the Flint Delvings (11.8) is a trigger at the face |
| `A18.4` | Hospice ward range (exterior) | building | 30 × 13.44 × 10.54 | 1 | glb (`act1-a18-4-hospice-range`) | concept A18 cell 4 (v2 batch) | top | GLB 30 × 13.4 × 10.5 m (walls ±4.1 m, porches to ±5.3 m); brand-new whitewash, not one patch; one high window warm and still (Perfection light, on the model's own lit window, upper row): the act image, seen from the foot of the slope |
| `A18.5` | Hospice boundary wall with niche (still candle) | building | 6 × 2.95 × 0.85 | 20 | glb (`act1-a18-5-hospice-wall-niche`) | concept A18 cell 5 (v2 batch) | top | GLB 6 × 2.95 × 0.85 m (end piers let the sections run on; plain whitewash back); every section has its niche and still candle — a row of identical still lights (Perfection grammar, glows on the model candles); the terrace edge, 2 m above the approach |
| `A18.6` | Hilltop approach steps | building | 4 × 2.61 × 4.06 | 1 | glb (`act1-a18-6-hilltop-steps`) | concept A18 cell 6 (v2 batch) | top | GLB 4 × 2.61 × 4.06 m placed ×1.3 (5.2 × 3.4 × 5.3 m): clean treads up to a landing 1.82 m above the approach (the terrace is 0.18 m higher behind it); the terrain ramp under the treads is the walk surface (re-cut to the model's tread line); the cheeks block; potted red / cream flowers on the cheeks; the exit to the Gentle House |
| `N-PR01` | Abandoned reaping (sheaves, scythe, straw hat) | prop | 2.4 × 1.1 × 2 | 1 | **blockout** | LD only, no concept | landing | rite 1: beside it a body-shaped hollow pressed into the poppies (field hole) |
| `N-PR02` | Harvester's cairn with ribbons and a name slate | story | 1.73 × 0.84 × 1.36 | 1 | **kit** (`kit:rocks.low`) | LD only, no concept | farm | kit tạm (Blood-Moor low rock at its own size; the ribbons and the name slate are still missing); rite 2, under a drying rack in the farmyard |
| `N-PR03` | Shepherd's crook and folded coat | prop | 0.9 × 1.6 × 0.5 | 1 | **blockout** | LD only, no concept | east | rite 3, inside the empty sheepfold (a ring of A08.2) |
| `N-PR04` | Lone hawthorn with ribbons (the ribbon thorn) | vegetation | 6 × 5.5 × 6 | 1 | **blockout** | LD only, no concept | top | rite 4: wind-bent, ribbons tied in it, a sleeper's shoes beneath; a landmark of the upper field |
| `N-PR05` | Straw doll on a stile step | prop | 0.3 × 0.35 × 0.2 | 1 | **blockout** | LD only, no concept | farm | unmarked vignette |
| `N-PR06` | Water trough (farmyard) | prop | 2.5 × 1 × 1.1 | 1 | **kit** (`kit:animals.trough`) | LD only, no concept | farm | kit tạm (camp trough) |
| `N-PR07` | Seed sacks | prop | 1.9 × 1.3 × 1.8 | 1 | **kit** (`kit:storage.sacks`) | LD only, no concept | farm | kit tạm |
| `N-PR08` | Barrow | prop | 2.5 × 1 × 1.25 | 1 | **kit** (`kit:animals.wheelbarrow`) | LD only, no concept | farm | kit tạm (camp wheelbarrow) |
| `N-PR09` | Spilled straw | prop | 2.4 × 0.24 × 2.3 | 1 | **kit** (`kit:clutter.straw`) | LD only, no concept | farm | kit tạm |
| `N-PR10` | Bramble / hawthorn scrub at wall ends | vegetation | 1.8 × 1.1 × 1.35 | 14 | **kit** (`kit:shrubs.shrub_12`) | LD only, no concept | all | kit tạm (Blood-Moor shrub) |
| `N-PR11` | Landing posts at the causeway (Rook's Weir boats) | structure | 2.16 × 1.27 × 0.36 | 1 | **kit** (`kit:fence.broken_pair`) | LD only, no concept | landing | kit tạm (broken fence pair at ×1.2 = 2.6 × 1.5 m): posts in a pair at the causeway landing |
| `A04.2` | Young willow (fen foot) | vegetation | 4 × 6 × 4 | 5 | **blockout** | concept A04 cell 2 (E02 willow kit) | landing | only at the fen shore |
| `A03.1` | Low grass clump (meadow tufts) | vegetation | 0.6 × 0.5 × 0.6 | 30300 | **procedural** | concept A03 cell 1 (E01 fen kit) | all | grey-green meadow tufts: ≈ 30 000 instanced Dark Wood grass cards from the field + 320 scattered clumps |
| `A03.2` | Tall reeds clump | vegetation | 0.8 × 1.8 × 0.8 | 200 | **procedural** | concept A03 cell 2 (E01 fen kit) | landing | shore-plant cards along the fen at the foot |
| `A03.3` | Sedge water clump | vegetation | 0.7 × 0.9 × 0.7 | 140 | **procedural** | concept A03 cell 3 (E01 fen kit) | landing |  |
| `glb:dungeon-prop-flint-boulders` | Flint boulders | rock | 2 × 1.18 × 1.9 | 7 | glb (`dungeon-prop-flint-boulders`) | ashlar/3d/props/dungeon_v1/flint_boulders | all | the Delvings spoil and the field-clearance piles at wall corners (flint country) |
| `glb:biome-prop-riverbank-stones` | Riverbank stones | rock | 1 × 0.35 × 1 | 4 | glb (`biome-prop-riverbank-stones`) | ashlar/3d/props/clutter_v1/riverbank_stones | landing |  |

### Còn thiếu (22)

- **blockout (khối thay thế)** (10): `A08.2` Drystone wall (module) ×327 · `A08.2-stile` Squeeze stile in a drystone wall ×1 · `A08.3` Abandoned hillside farmhouse ×1 · `A08.4` Hay rick ×6 · `A08.5` Field gate between stone posts ×4 · `N-PR01` Abandoned reaping (sheaves, scythe, straw hat) ×1 · `N-PR03` Shepherd's crook and folded coat ×1 · `N-PR04` Lone hawthorn with ribbons (the ribbon thorn) ×1 · `N-PR05` Straw doll on a stile step ×1 · `A04.2` Young willow (fen foot) ×5
- **procedural (code tạo tạm)** (4): `A08.1` Poppy drift clump ×36000 · `A03.1` Low grass clump (meadow tufts) ×30300 · `A03.2` Tall reeds clump ×200 · `A03.3` Sedge water clump ×140
- **kit tạm (kit cũ đứng thay)** (8): `A08.6` Poppy-drying rack ×4 · `N-PR02` Harvester's cairn with ribbons and a name slate ×1 · `N-PR06` Water trough (farmyard) ×1 · `N-PR07` Seed sacks ×1 · `N-PR08` Barrow ×1 · `N-PR09` Spilled straw ×1 · `N-PR10` Bramble / hawthorn scrub at wall ends ×14 · `N-PR11` Landing posts at the causeway (Rook's Weir boats) ×1

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

Mã asset: 29 — glb (model ASHLAR thật): **8** · kit tạm (kit cũ đứng thay): **1** · procedural (code tạo tạm): **2** · blockout (khối thay thế): **18**.

### Asset

| Mã | Tên | Loại | Cỡ (m) R × C × S | Số | Trạng thái | Nguồn | Đoạn | Ghi chú |
|---|---|---|---|---|---|---|---|---|
| `A11.1` | Whitewashed cloister bay (three round arches) | building | 5.4 × 4.32 × 2.16 | 12 | **blockout** | concept A11 cell 1 | cloister | the lean-to roof over the walk is split off as N-HS12 (exterior only) so the walk stays visible; only the piers block |
| `A11.2` | Hospice bed | prop | 1.08 × 0.72 × 2.16 | 14 | **blockout** | concept A11 cell 2 | ward | two rows in the ward; Fen's bed (north row, east end) is empty: clean pillow, folded blanket |
| `A11.3` | Refectory table with bread (two benches) | prop | 4.32 × 0.81 × 1.44 | 3 | **blockout** | concept A11 cell 3 | refectory | two tables + the high table; the bread is always fresh |
| `A11.4` | Gate tower | building | 4.32 × 7.2 × 4.32 | 1 | **blockout** | concept A11 cell 4 | gate | the rain stops here (LD proposal); the passage is 2 m wide; the blockers are its side walls |
| `A11.5` | Kitchen hearth with cauldron | building | 3.6 × 2.88 × 1.8 | 1 | **blockout** | concept A11 cell 5 | kitchen | unlit and spotless (concept): a kitchen that never seems to cook |
| `A11.6` | Steady candle stand | prop | 0.9 × 2.34 × 0.9 | 18 | **blockout** | concept A11 cell 6 | ward · refectory · kitchen · cloister | Perfection light: the candles never flicker; many identical in rows (a real light on some, a still glow on the others) |
| `A18.4` | Hospice ward range (exterior) | building | 30 × 11 × 9 | 0 | **blockout** | concept A18 cell 4 (v2 batch) | ward |  |
| `A18.5` | Hospice boundary wall with niche (still candle) | structure | 6 × 2.95 × 0.85 | 4 | glb | concept A18 cell 5 (v2 batch) | forecourt | the forecourt's side walls; the niche candles burn still in the rain |
| `A18.6` | Hilltop approach steps (whitewashed retaining terrace) | structure | 4 × 2 × 5 | 0 | **procedural** | concept A18 cell 6 (v2 batch) | approach |  |
| `A19.1` | Flowers in a vase | prop | 0.4 × 0.5 × 0.2 | 12 | glb | concept A19 cell 1 (v2 batch) | ward · refectory · kitchen · parlour | on the ward window sills and the tables |
| `A19.2` | Poppy tea on a tray | prop | 0.5 × 0.22 × 0.31 | 2 | glb | concept A19 cell 2 (v2 batch) | parlour · kitchen | the vision trigger (Mother Hawise offers it by the warm window) |
| `A19.3` | Mother Hawise's window chair (+ side table) | prop | 1.18 × 1.2 × 0.71 | 1 | glb | concept A19 cell 3 (v2 batch) | parlour | seat 0.53 m, side table top 0.56 m at (−0.39, 0.15) |
| `A19.4` | Linen press | prop | 1.35 × 1.9 × 0.95 | 4 | glb | concept A19 cell 4 (v2 batch) | linen room · parlour | the open doors reach 0.35 m in front of the carcass (back at local z −0.475); top 1.90 m |
| `A19.5` | Linen folding screen | linen | 2 × 1.8 × 0.96 | 2 | glb | concept A19 cell 5 (v2 batch) | ward · linen room | Tamsin hides behind one at Fen's bed; a deep zig-zag (0.96 m) |
| `A19.6` | Tall ward window (deep sill, one steady candle) | building | 2.4 × 3.29 × 0.67 | 8 | glb | concept A19 cell 6 (v2 batch) | ward · parlour | a wall section with a blind window (solid back) mounted on the inner face of an engine window opening (the opening, its pane and glow stay the engine's; the opening is 2.4 m tall so the 3.29 m section covers it); fades with its wall |
| `N-HS02` | Garth flower bed (pale flowers, two poppies) | vegetation | 3.2 × 0.55 × 3.2 | 1 | **blockout** | LD only, no concept | cloister |  |
| `N-HS03` | Potted flowers (clean terracotta pot) | vegetation | 0.6 × 0.75 × 0.6 | 6 | **blockout** | LD only, no concept (A18.6 shows two at the top of the steps) | forecourt · cloister |  |
| `N-HS04` | Walled flower bed (herbs, white flowers) | vegetation | 4 × 0.5 × 1.4 | 4 | **blockout** | LD only, no concept | Mother's garden | the walled garden under the high window (seen, not walked) |
| `N-HS05` | Linen drying line (clean sheets) | linen | 6 × 2.2 × 0.3 | 1 | **blockout** | LD only, no concept | Mother's garden | clean sheets hanging dead still in the dry, windless garden |
| `N-HS06` | Kitchen work table (bowls, bread) | prop | 2.4 × 0.9 × 1 | 1 | **blockout** | LD only, no concept | kitchen |  |
| `N-HS07` | Bread rack (fresh loaves) | prop | 1.6 × 1.8 × 0.5 | 2 | **kit** | LD only, no concept | kitchen | kit tạm: the A19.4 linen press GLB stands in (reuse: clean open shelving reads as kitchen storage); a bread rack model is still missing |
| `N-HS08` | Folding table with folded linen | prop | 2.4 × 0.9 × 1 | 1 | **blockout** | LD only, no concept | linen room |  |
| `N-HS09` | Night stair down to the Garden of Hush | structure | 3 × 3 × 6 | 0 | **procedural** | LD only, no concept | stair | built by the engine: 15 treads (0.1875 m) from the kitchen down to a landing whose far end sinks into the dark; final art: a stair / vault kit |
| `N-HS10` | Ward range roof (slate, exterior only) | structure | 10.4 × 4.2 × 31.6 | 1 | **blockout** | LD only (part of A18.4) | ward | shown while the focus is outdoors; the interior has no ceilings (camera) |
| `N-HS11` | East range roof (slate, exterior only) | structure | 11 × 3.6 × 32.4 | 1 | **blockout** | LD only, no concept | refectory · kitchen |  |
| `N-HS12` | Cloister lean-to roof bay (tiles, exterior only) | structure | 5.4 × 1 × 3.7 | 14 | **blockout** | part of A11.1 (its lean-to roof) | cloister | split off A11.1 so the walk reads from the camera; shown while the focus is outdoors |
| `N-HS13` | Night stair roof (exterior only) | structure | 3.8 × 1.4 × 12.4 | 1 | **blockout** | LD only, no concept | stair |  |
| `A08.1` | Poppy drift clump | vegetation | 2.7 × 1.08 × 2.7 | 9 | **blockout** | concept A08 cell 1 (shared with map 3) | approach | the last poppies of the Reach on the lower slope (walk-through) |
| `glb:dungeon-prop-flint-boulders` | Flint boulders (2 m wide) | rock | 2 × 1.1 × 1.8 | 3 | glb | lookdev-lab/assets/terrain-biomes/dungeon-prop-flint-boulders.glb (ashlar/3d/props/dungeon_v1) | approach | flint country of the Poppy Reach: the hillside |

### Còn thiếu (21)

- **blockout (khối thay thế)** (18): `A11.1` Whitewashed cloister bay (three round arches) ×12 · `A11.2` Hospice bed ×14 · `A11.3` Refectory table with bread (two benches) ×3 · `A11.4` Gate tower ×1 · `A11.5` Kitchen hearth with cauldron ×1 · `A11.6` Steady candle stand ×18 · `A18.4` Hospice ward range (exterior) · `N-HS02` Garth flower bed (pale flowers, two poppies) ×1 · `N-HS03` Potted flowers (clean terracotta pot) ×6 · `N-HS04` Walled flower bed (herbs, white flowers) ×4 · `N-HS05` Linen drying line (clean sheets) ×1 · `N-HS06` Kitchen work table (bowls, bread) ×1 · `N-HS08` Folding table with folded linen ×1 · `N-HS10` Ward range roof (slate, exterior only) ×1 · `N-HS11` East range roof (slate, exterior only) ×1 · `N-HS12` Cloister lean-to roof bay (tiles, exterior only) ×14 · `N-HS13` Night stair roof (exterior only) ×1 · `A08.1` Poppy drift clump ×9
- **procedural (code tạo tạm)** (2): `A18.6` Hilltop approach steps (whitewashed retaining terrace) · `N-HS09` Night stair down to the Garden of Hush
- **kit tạm (kit cũ đứng thay)** (1): `N-HS07` Bread rack (fresh loaves) ×2

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

Mã asset: 31 — glb (model ASHLAR thật): **9** · kit tạm (kit cũ đứng thay): **0** · procedural (code tạo tạm): **3** · blockout (khối thay thế): **19**.

### Asset

| Mã | Tên | Loại | Cỡ (m) R × C × S | Số | Trạng thái | Nguồn | Đoạn | Ghi chú |
|---|---|---|---|---|---|---|---|---|
| `A13.1` | Sleeping bed furrow | structure | 1.4 × 0.5 × 2.7 | 65 | **blockout** | concept A13 cell 1 | furrow hall · breath room | turnaround reads ≈ 1.5H long; the prompt's 2.4H × 1H is too big for one sleeper |
| `A13.2` | Cloth canopy frame | structure | 6.3 × 4.32 × 4.32 | 10 | **blockout** | concept A13 cell 2 | furrow hall | one per three beds; the awning is walk-through, the posts block |
| `A13.3` | Pink night-light jar | prop | 0.63 × 0.81 × 0.63 | 263 | **blockout** | concept A13 cell 3 | every row | one beside every sleeper; still Perfection light (a real light every few, glow + floor pool elsewhere) · 78 of them drawn in the void past the floor |
| `A13.4` | Hush bell post | structure | 1.62 × 3.6 × 0.7 | 15 | **blockout** | concept A13 cell 4 | furrow hall · deep rows | the signature mechanic: noise within ~6 m rings it, it calls Poppy Nurses (overlay "Chuông ru") |
| `A13.5` | Root-vaulted wall bay | building | 5.4 × 5.04 × 1.8 | 17 | **blockout** | concept A13 cell 5 | furrow hall · gallery · deep rows | against the earth walls; the Poppy Nurses come out of these bays when a bell rings |
| `A13.6` | Poppy furrow | vegetation | 4.32 × 1.26 × 1.62 | 16 | **blockout** | concept A13 cell 6 | furrow hall · deep rows | in the spines between facing rows |
| `A20.1` | Sleeper: young woman (braid, ribbon keepsake) | story | 1.41 × 0.54 × 2.1 | 69 | glb | concept A20 cell 1 (v2 batch, perspective_v1e) | every row | buried to the chest, a poppy from the lips (no gore); rows mix the four people with their own length · 19 of them drawn in the void past the floor |
| `A20.2` | Sleeper: old man (pipe in his folded hands) | story | 1.51 × 0.69 × 2.1 | 51 | glb | concept A20 cell 2 (v2 batch, perspective_v1e) | every row | buried to the chest, a poppy from the lips (no gore); rows mix the four people with their own length · 15 of them drawn in the void past the floor |
| `A20.3` | Sleeper: fisherman (knitted cap, cork float) | story | 1.51 × 0.79 × 2.1 | 67 | glb | concept A20 cell 3 (v2 batch, perspective_v1e) | every row | buried to the chest, a poppy from the lips (no gore); rows mix the four people with their own length · 22 of them drawn in the void past the floor |
| `A20.4` | Sleeper: farm woman (apron, wooden spoon) | story | 1.5 × 0.58 × 2.1 | 67 | glb | concept A20 cell 4 (v2 batch, perspective_v1e) | every row | buried to the chest, a poppy from the lips (no gore); rows mix the four people with their own length · 22 of them drawn in the void past the floor |
| `A20.5` | Irrigation channel piece (sluice) | structure | 3 × 0.89 × 1.88 | 8 | glb | concept A20 cell 5 (v2 batch) | furrow hall · gallery · deep rows | the GLB brings its cut-out floor block (top 0.55 m): placed CH_SINK = 0.55 m down so the block is flush with the floor, its trench (floor 0.13 m under the floor) holds the engine's still water (0.1 m under the floor); the runs between the pieces are engine-built (N-GD14) |
| `A20.6` | Harvest table | prop | 2.6 × 2.17 × 1.43 | 5 | glb | concept A20 cell 6 (v2 batch) | harvest room | table top 0.84 m; 1.43 m deep with the baskets and the cloth (the collider covers it) |
| `A08.6` | Poppy-drying rack | structure | 4.32 × 3.6 × 1.3 | 6 | **blockout** | concept A08 cell 6 (Poppy Reach kit, shared) | gallery · harvest room |  |
| `A11.6` | Steady candle stand | prop | 0.9 × 2.34 × 0.9 | 2 | **blockout** | concept A11 cell 6 (Gentle House kit, shared) | landing | the hospice side of the stair: a flame that never moves (Perfection) |
| `N-GD01` | Root rib arch | vegetation | 6.5 × 4.9 × 0.5 | 3 | **blockout** | LD only, no concept | root tunnel | one great root arching over a passage: the ribs of the root vault (no ceilings in the lab) |
| `N-GD04` | The lamp ahead | story | 0.6 × 1.4 × 0.6 | 1 | **blockout** | AD §4.5 motif, no concept | deep rows → exit | first appearance (AD §4.5, §10.2 item 7): a far still white light that shows the right way; no holder, not explained |
| `N-GD05` | Plank crossing | structure | 1.5 × 0.1 × 2.3 | 1 | **blockout** | LD only, no concept | gallery |  |
| `N-GD06` | Shroud web (W07 lair) | prop | 3 × 2.7 × 0.3 | 5 | **blockout** | LD only, no concept (W07 sheet: silk #D8CCB0) | gallery · deep rows | webs only (no wrapped bodies) |
| `N-GD07` | Root fall (collapsed vault) | rock | 4.6 × 2.6 × 5.4 | 2 | **blockout** | LD only, no concept | deep rows | closes the easy ways of the hardest stretch |
| `N-GD08` | Harvest basket of poppy heads | prop | 0.56 × 0.45 × 0.5 | 10 | **blockout** | LD only, no concept | harvest room |  |
| `N-GD09` | Poppy Nurse's tending kit (stool, watering can) | prop | 1 × 0.5 × 0.45 | 1 | **blockout** | LD only, no concept | furrow hall |  |
| `N-GD10` | Linen coverlet turned down (empty bed) | linen | 1.14 × 0.12 × 1.9 | 1 | **blockout** | LD only, no concept | furrow hall | a bed made up and lit, nobody in it yet (unmarked vignette) |
| `N-GD11` | Shoes placed at the foot of a furrow | prop | 0.32 × 0.1 × 0.3 | 1 | **blockout** | LD only, no concept | furrow hall |  |
| `N-GD12` | Whitewashed stair down from the Gentle House | structure | 4 × 3.6 × 10 | 0 | **procedural** | LD only, no concept | landing | built by the engine: 17 treads of 0.2 m + lime / bone-mortar walls; final art needs a stair kit |
| `N-GD13` | Crypt stair + arch down to the Cradle | structure | 4 × 1.8 × 5 | 0 | **procedural** | LD only, no concept | exit | 9 treads of 0.18 m and an arch, the mirror of the Cradle's stair (map 6) |
| `N-GD14` | Irrigation channel runs (sunk floor + still water) | structure | 1 × 0.4 × 3 | 0 | **procedural** | concept A20 cell 5 (runs between the pieces) | furrow hall · gallery · deep rows | the engine sinks the floor 0.4 m and lays an opaque still-water surface 0.1 m under the floor |
| `N-GD15` | Tamsin's lantern on a root bracket | prop | 0.3 × 1 × 0.6 | 1 | **blockout** | LD only, no concept | breath room | human light: warm, flickering (the one shadowed light of the map) |
| `N-GD16` | Fallen poppy heads and petals | vegetation | 0.35 × 0.06 × 0.3 | 46 | **blockout** | LD only, no concept | harvest room |  |
| `glb:dungeon-prop-crypt-wall` | Crypt wall module (bone niches) | structure | 4 × 2.28 × 0.7 | 0 | glb | lookdev-lab/assets/terrain-biomes/dungeon-prop-crypt-wall.glb | old crypt · exit | the old crypt's west wall and the exit landing: where the Wall shows |
| `glb:dungeon-prop-broken-column` | Broken column | rock | 1.68 × 1.5 × 1.02 | 5 | glb | lookdev-lab/assets/terrain-biomes/dungeon-prop-broken-column.glb | old crypt · breath room · exit | sparingly: the older crypt |
| `glb:dungeon-prop-candle-cluster` | Candle cluster on a stone block | prop | 0.77 × 0.8 × 0.76 | 2 | glb | lookdev-lab/assets/terrain-biomes/dungeon-prop-candle-cluster.glb | old crypt · breath room | one cold in the old crypt; the one Tamsin lit by Fen is the Garden's only warm, flickering light |

### Còn thiếu (22)

- **blockout (khối thay thế)** (19): `A13.1` Sleeping bed furrow ×65 · `A13.2` Cloth canopy frame ×10 · `A13.3` Pink night-light jar ×263 · `A13.4` Hush bell post ×15 · `A13.5` Root-vaulted wall bay ×17 · `A13.6` Poppy furrow ×16 · `A08.6` Poppy-drying rack ×6 · `A11.6` Steady candle stand ×2 · `N-GD01` Root rib arch ×3 · `N-GD04` The lamp ahead ×1 · `N-GD05` Plank crossing ×1 · `N-GD06` Shroud web (W07 lair) ×5 · `N-GD07` Root fall (collapsed vault) ×2 · `N-GD08` Harvest basket of poppy heads ×10 · `N-GD09` Poppy Nurse's tending kit (stool, watering can) ×1 · `N-GD10` Linen coverlet turned down (empty bed) ×1 · `N-GD11` Shoes placed at the foot of a furrow ×1 · `N-GD15` Tamsin's lantern on a root bracket ×1 · `N-GD16` Fallen poppy heads and petals ×46
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

Mã asset: 11 — glb (model ASHLAR thật): **1** · kit tạm (kit cũ đứng thay): **0** · procedural (code tạo tạm): **1** · blockout (khối thay thế): **9**.

### Asset

| Mã | Tên | Loại | Cỡ (m) R × C × S | Số | Trạng thái | Nguồn | Đoạn | Ghi chú |
|---|---|---|---|---|---|---|---|---|
| `A14.1` | Bone-rail crib frame | prop | 6.3 × 3.6 × 3.6 | 60 | **blockout** | concept A14 cell 1 (perspective / turnaround scale v2) | aisle · arena | arena-scale empty crib (giant: 2H tall); rows into the fog are the same model · 39 of them drawn in the void past the floor |
| `A14.2` | Linen curtain pair | prop | 4.32 × 5.4 × 0.7 | 9 | **blockout** | concept A14 cell 2 | arena | wooden posts + rod (block), tied-back linen drapes (walk-through cloth) |
| `A14.3` | Milk-white night-light | prop | 1.08 × 2.16 × 1.08 | 32 | **blockout** | concept A14 cell 3 | aisle · arena | still Perfection light; the arena ten go out one by one (slider) · 14 of them drawn in the void past the floor |
| `A14.4` | Bone mobile on stand | prop | 2.52 × 3.24 × 0.9 | 2 | **blockout** | concept A14 cell 4 | arena | only the stand blocks; the hanging bones are walk-through |
| `A14.5` | Quilted floor platform | linen | 5.4 × 0.72 × 5.4 | 1 | **blockout** | concept A14 cell 5 | arena | the bed made up for the hero (0.72 m: too high to step on) |
| `A14.6` | Rocker runner pair | prop | 5.4 × 1.44 × 2.88 | 3 | **blockout** | concept A14 cell 6 | arena | one under Mercy's cradle behind the boss, two lying loose |
| `N-CR01` | Linen floor runner | linen | 2.4 × 0.03 × 36 | 1 | **blockout** | LD only, no concept | aisle | a clean linen strip down the aisle into the arena (Mercy leads you in) |
| `N-CR02` | Turned-down quilt | linen | 3 × 0.24 × 2.6 | 1 | **blockout** | LD only, no concept | arena | on the platform: the bed is made for you |
| `N-CR03` | Linen pillow | linen | 1.5 × 0.32 × 0.75 | 1 | **blockout** | LD only, no concept | arena |  |
| `N-CR04` | Crypt stair + arch from the Garden of Hush | structure | 3 × 1.8 × 5 | 0 | **procedural** | LD only, no concept | stair | built by the engine: 9 treads + vault-tile walls + a gothic arch; final art needs a stair / arch kit |
| `glb:dungeon-prop-crypt-wall` | Crypt wall module (bone niches) | structure | 4 × 2.28 × 0.7 | 0 | glb | lookdev-lab/assets/terrain-biomes/dungeon-prop-crypt-wall.glb | stair | the stair head = the lowest crypt of the Garden of Hush (BIO-04): one module, x-scale 0.8 |

### Còn thiếu (10)

- **blockout (khối thay thế)** (9): `A14.1` Bone-rail crib frame ×60 · `A14.2` Linen curtain pair ×9 · `A14.3` Milk-white night-light ×32 · `A14.4` Bone mobile on stand ×2 · `A14.5` Quilted floor platform ×1 · `A14.6` Rocker runner pair ×3 · `N-CR01` Linen floor runner ×1 · `N-CR02` Turned-down quilt ×1 · `N-CR03` Linen pillow ×1
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
| `A01.1` | Repaired thatched stilt cottage | `lychgate` blockout ×11 |
| `A01.2` | Raised wooden walkway segment | `lychgate` blockout ×8 · `fens` blockout ×14 |
| `A01.3` | Patched low flint wall | `lychgate` blockout ×67 |
| `A01.4` | Willow hurdle fence | `lychgate` blockout ×25 |
| `A01.5` | Village well | `lychgate` blockout ×1 · `fens` blockout ×1 |
| `A01.6` | Eel-trap fishing rack | `lychgate` kit ×4 · `fens` kit ×1 |
| `A02.1` | Lychgate roofed gate (with lamp) | `lychgate` blockout ×1 |
| `A02.2` | Mortsafe grave cage | `lychgate` blockout ×4 |
| `A02.3` | Small mismatched headstone cluster | `lychgate` blockout ×3 |
| `A02.4` | Round ossuary tower | `lychgate` blockout ×1 |
| `A02.5` | Faceless saint statue supporting an arch (the Nameless Saint) | `lychgate` blockout ×1 |
| `A02.6` | Funeral hand cart | `lychgate` kit ×1 |
| `A03.1` | Low grass clump | `lychgate` procedural ×900 · `fens` procedural ×520 · `poppyReach` procedural ×30300 |
| `A03.2` | Tall reeds clump | `lychgate` procedural ×320 · `fens` procedural ×1600 · `poppyReach` procedural ×200 |
| `A03.3` | Sedge water clump | `lychgate` procedural ×220 · `fens` procedural ×185 · `poppyReach` procedural ×140 |
| `A03.4` | Large moss rock | `fens` kit ×7 |
| `A03.5` | Peat bank chunk | `fens` blockout ×9 |
| `A03.6` | Waterlogged root stump | `fens` kit ×7 |
| `A04.1` | Old broad weeping willow | `fens` blockout ×7 |
| `A04.2` | Young willow | `lychgate` blockout ×7 · `fens` blockout ×3 · `poppyReach` blockout ×5 |
| `A04.3` | Dead angular tree | `fens` kit ×20 |
| `A04.5` | Fallen hollow trunk | `fens` blockout ×5 |
| `A04.6` | Exposed willow root cluster | `fens` blockout ×1 |
| `A06.1` | Fen causeway segment (dike revetment posts) | `lychgate` kit ×13 · `fens` kit ×36 |
| `A06.2` | Lichen standing stone (upright marker stone) | `fens` blockout ×10 |
| `A06.3` | Stepping-stone ford (one tile of river stones) | `fens` glb ×14 |
| `A06.4` | Unlit bog-lure post (empty cage) | `fens` kit ×8 |
| `A06.5` | Half-sunk fen punt | `fens` blockout ×5 |
| `A06.6` | Broken bridge pier | `fens` blockout ×2 |
| `A07.1` | Half-drowned flint cottage | `fens` blockout ×9 |
| `A07.2` | Timber-and-stone weir segment | `fens` blockout ×12 |
| `A07.3` | Gable wall with door arch | `fens` blockout ×4 |
| `A07.4` | Sunken roof-ridge platform | `fens` blockout ×4 |
| `A07.5` | Pontoon plank raft | `fens` blockout ×3 |
| `A07.6` | Rook roost (dead tree) | `fens` kit ×6 |
| `A08.1` | Poppy drift clump | `poppyReach` procedural ×36000 · `gentleHouse` blockout ×9 |
| `A08.2` | Drystone wall (module) | `poppyReach` blockout ×327 |
| `A08.2-stile` | Squeeze stile in a drystone wall | `poppyReach` blockout ×1 |
| `A08.3` | Abandoned hillside farmhouse | `poppyReach` blockout ×1 |
| `A08.4` | Hay rick | `poppyReach` blockout ×6 |
| `A08.5` | Field gate between stone posts | `poppyReach` blockout ×4 |
| `A08.6` | Poppy-drying rack | `poppyReach` kit ×4 · `gardenOfHush` blockout ×6 |
| `A11.1` | Whitewashed cloister bay (three round arches) | `gentleHouse` blockout ×12 |
| `A11.2` | Hospice bed | `gentleHouse` blockout ×14 |
| `A11.3` | Refectory table with bread (two benches) | `gentleHouse` blockout ×3 |
| `A11.4` | Gate tower | `gentleHouse` blockout ×1 |
| `A11.5` | Kitchen hearth with cauldron | `gentleHouse` blockout ×1 |
| `A11.6` | Steady candle stand | `gentleHouse` blockout ×18 · `gardenOfHush` blockout ×2 |
| `A13.1` | Sleeping bed furrow | `gardenOfHush` blockout ×65 |
| `A13.2` | Cloth canopy frame | `gardenOfHush` blockout ×10 |
| `A13.3` | Pink night-light jar | `gardenOfHush` blockout ×263 |
| `A13.4` | Hush bell post | `gardenOfHush` blockout ×15 |
| `A13.5` | Root-vaulted wall bay | `gardenOfHush` blockout ×17 |
| `A13.6` | Poppy furrow | `gardenOfHush` blockout ×16 |
| `A14.1` | Bone-rail crib frame | `cradle` blockout ×60 |
| `A14.2` | Linen curtain pair | `cradle` blockout ×9 |
| `A14.3` | Milk-white night-light | `cradle` blockout ×32 |
| `A14.4` | Bone mobile on stand | `cradle` blockout ×2 |
| `A14.5` | Quilted floor platform | `cradle` blockout ×1 |
| `A14.6` | Rocker runner pair | `cradle` blockout ×3 |
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
| `A17.1` | The leaning stones (Act I arch) | `fens` blockout ×1 |
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
| `A19.1` | Flowers in a vase | `gentleHouse` glb ×12 |
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
| `N-CR02` | Turned-down quilt | `cradle` blockout ×1 |
| `N-CR03` | Linen pillow | `cradle` blockout ×1 |
| `N-CR04` | Crypt stair + arch from the Garden of Hush | `cradle` procedural |
| `N-FN01` | The Soothed in procession (P01 stand-in figures, white nightgowns) | `fens` blockout ×12 |
| `N-FN02` | Shoes left at the water's edge (unmarked vignette) | `fens` blockout ×1 |
| `N-FN03` | Bog grave (peat mound, willow stake, ribbons) | `fens` glb ×1 |
| `N-FN04` | Small stone cairn | `fens` kit ×1 |
| `N-FN05` | Drying eel net | `fens` kit ×1 |
| `N-FN06` | Toll post with a coin dish (The Ferryman's Toll) | `fens` blockout ×1 |
| `N-FN07` | Rook (ambient, circling the roost poles) | `fens` procedural ×8 |
| `N-FN08` | Empty wicker cradle | `fens` blockout ×2 |
| `N-GD01` | Root rib arch | `gardenOfHush` blockout ×3 |
| `N-GD04` | The lamp ahead | `gardenOfHush` blockout ×1 |
| `N-GD05` | Plank crossing | `gardenOfHush` blockout ×1 |
| `N-GD06` | Shroud web (W07 lair) | `gardenOfHush` blockout ×5 |
| `N-GD07` | Root fall (collapsed vault) | `gardenOfHush` blockout ×2 |
| `N-GD08` | Harvest basket of poppy heads | `gardenOfHush` blockout ×10 |
| `N-GD09` | Poppy Nurse's tending kit (stool, watering can) | `gardenOfHush` blockout ×1 |
| `N-GD10` | Linen coverlet turned down (empty bed) | `gardenOfHush` blockout ×1 |
| `N-GD11` | Shoes placed at the foot of a furrow | `gardenOfHush` blockout ×1 |
| `N-GD12` | Whitewashed stair down from the Gentle House | `gardenOfHush` procedural |
| `N-GD13` | Crypt stair + arch down to the Cradle | `gardenOfHush` procedural |
| `N-GD14` | Irrigation channel runs (sunk floor + still water) | `gardenOfHush` procedural |
| `N-GD15` | Tamsin's lantern on a root bracket | `gardenOfHush` blockout ×1 |
| `N-GD16` | Fallen poppy heads and petals | `gardenOfHush` blockout ×46 |
| `N-GH` | The Gentle House, far silhouette (gate tower + long ward + high warm still window) | `lychgate` glb ×1 · `fens` glb ×1 |
| `N-HS02` | Garth flower bed (pale flowers, two poppies) | `gentleHouse` blockout ×1 |
| `N-HS03` | Potted flowers (clean terracotta pot) | `gentleHouse` blockout ×6 |
| `N-HS04` | Walled flower bed (herbs, white flowers) | `gentleHouse` blockout ×4 |
| `N-HS05` | Linen drying line (clean sheets) | `gentleHouse` blockout ×1 |
| `N-HS06` | Kitchen work table (bowls, bread) | `gentleHouse` blockout ×1 |
| `N-HS07` | Bread rack (fresh loaves) | `gentleHouse` kit ×2 |
| `N-HS08` | Folding table with folded linen | `gentleHouse` blockout ×1 |
| `N-HS09` | Night stair down to the Garden of Hush | `gentleHouse` procedural |
| `N-HS10` | Ward range roof (slate, exterior only) | `gentleHouse` blockout ×1 |
| `N-HS11` | East range roof (slate, exterior only) | `gentleHouse` blockout ×1 |
| `N-HS12` | Cloister lean-to roof bay (tiles, exterior only) | `gentleHouse` blockout ×14 |
| `N-HS13` | Night stair roof (exterior only) | `gentleHouse` blockout ×1 |
| `N-PR01` | Abandoned reaping (sheaves, scythe, straw hat) | `poppyReach` blockout ×1 |
| `N-PR02` | Harvester's cairn with ribbons and a name slate | `poppyReach` kit ×1 |
| `N-PR03` | Shepherd's crook and folded coat | `poppyReach` blockout ×1 |
| `N-PR04` | Lone hawthorn with ribbons (the ribbon thorn) | `poppyReach` blockout ×1 |
| `N-PR05` | Straw doll on a stile step | `poppyReach` blockout ×1 |
| `N-PR06` | Water trough (farmyard) | `poppyReach` kit ×1 |
| `N-PR07` | Seed sacks | `poppyReach` kit ×1 |
| `N-PR08` | Barrow | `poppyReach` kit ×1 |
| `N-PR09` | Spilled straw | `poppyReach` kit ×1 |
| `N-PR10` | Bramble / hawthorn scrub at wall ends | `poppyReach` kit ×14 |
| `N-PR11` | Landing posts at the causeway (Rook's Weir boats) | `poppyReach` kit ×1 |
| `N01` | Barrow family vault door (portal in the terrace wall) | `lychgate` blockout ×1 |
| `N02` | Flint retaining wall (vault terrace) | `lychgate` blockout ×8 |
| `N03` | Rain barrel | `lychgate` kit ×10 |
| `N04` | Peat stack | `lychgate` blockout ×12 |
| `N05` | Poppy sprig on a door (the Act I accent) | `lychgate` procedural ×11 |
| `N06` | Washing line | `lychgate` kit ×2 |
| `N07` | Drying fish net | `lychgate` kit ×2 |
| `N08` | Village goods (sacks, crates) | `lychgate` kit ×3 |
| `N09` | Low shrubs / brambles at the edges | `lychgate` kit ×44 |
| `N10` | Vigil chair with a folded blanket | `lychgate` blockout ×1 |
| `N11` | Crow (ambient; settles after the five rites) | `lychgate` procedural ×6 |
| `N12` | Peat barrow | `lychgate` kit ×1 |
