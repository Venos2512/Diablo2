# HUD v6 phase 1 (PB, OS, BR, EX) — QA (§11), 2026-10-27

Run `run_p1.log`: 10/10 images, 137.5k tokens (13.7k/image). Per-image notes in `class_*/_work/qa_*.txt`.

Reused, not generated: common bar (HUD00), left guardian + life globe and all globe discs (B_globe, B_globe_r2), plates (G_plates), icons SPACE / Q / R / F / T (E_icons 14–17 + HUD00), socket rims and most light effects (F_fx).

Bar skills chosen from Vocation reference builds (generator on LMB, one movement skill, the main skill of each tree), same pattern as FL:

| Class | LMB | RMB | 1 | 2 | 3 | 4 | 5 / R |
|---|---|---|---|---|---|---|---|
| PB | Pall Strike | Lid Slam | Make Way | Shoulder the Fallen | Nails of the Pall | The Passing Bell | 5 = No One Alone (Vow) |
| OS | Borrow | Mortar Lance | Through the Mortar | Lend a Hand | Ossuary Wall | Return | — |
| BR | Brine Spray | Crystallize | Ebb | Undertow | Salt Circle | Scour | — |
| EX | Quarrel | Silver Bolt | Lantern-Hook | Hood the Lantern | Grave Trap | Flash | R = change wick (own icon) |

| Image | Verdict | Notes |
|---|---|---|
| class_PB/K1_vessel_v1 | PASS | A standing coffin frame (recommended) / B bier with poles (reads like a ladder). Course counts not exact. |
| class_PB/K2_counters_v1 | PASS | Vow socket 4 states, Names 6/10. Burden states drawn as horizontal biers, Heaviest Coffin looks like a treasure chest: idea only. |
| class_OS/K1_vessel_v1 | PASS | A reliquary tower (recommended) / B niche chest. Context cells have 8 niches but state cells only 6: say 8 explicitly in L1. |
| class_OS/K2_counters_v1 | PASS | Strain gauge 4 states, servants 2/3, Willing/Frightened, Promise Kept 3/5. |
| class_BR/K1_vessel_v1 | PASS | A tall flat bottle (recommended) / B salt jar. Salt too pale, needs to be grey-green and gritty in L1 (§13.9). |
| class_BR/K2_counters_v1 | PASS | Encrusted / Crystallized / Corroded nameplates, Steeped icons, brine and crust decals. |
| class_EX/K1_vessel_v1 | PASS | A hooded lantern (recommended, 5 notches, hood works) / B grave lamp (6–7 slots). No round ring. |
| class_EX/K2_counters_v1 | PASS | R wick key 3 states, Hooded, Unseen Strike, Exposed nameplate, traps 2/3. |
| dev/_sheets/E2_icons | PASS, normalise | 13 icons (PB 7, OS 6). Row 1 ~217 px, row 2 ~251 px: crop to one square. A little more sepia than E_icons. |
| dev/_sheets/E3_icons | PASS, normalise | 13 icons (BR 6, EX 6 + wick key). Row 1 ~231 px, row 2 ~214 px. Teal water pixels sit near the key colour (52 px): key with a tight tolerance. |

Next (phase 2, after the user picks A/B): L1 class HUD layer per class (edit of HUD00, like FL/PS L1) and one class sprite sheet per class (right guardian with empty vessel + vessel parts + counters, like C_fl / D_ps).

# HUD v6 phase 2 (PB, OS, BR, EX) — QA (§11), 2026-10-27

Vessel picks (user): PB A standing coffin frame, OS A reliquary tower, BR A tall bottle, EX A hooded lantern.

Runs: `run_p2a.log` (L1 v1, all FAIL: the old round stone ring stayed behind the vessel), `run_p2a_v2.log` + `run_p2a_v2_ex.log` + `run_p2b.log` (L1 v2 with FIXES line and `class_PS/L1_hud_layer_v2.png` attached as the example of a statue without the ring; EX needed 2 timeouts + a network outage before it went through), `run_p2c.log` (C_ex).

| Image | Verdict | Notes |
|---|---|---|
| class_PB/L1_hud_layer_v2 | PASS | Ring gone. Coffin frame ~2/3 mortar, socket 5 SWORN with silver rim, NAMES plate 6/10. |
| class_OS/L1_hud_layer_v2 | PASS | Ring gone. 8-niche reliquary, 4/5 souls lit, faint pilaster crack, servants on the plate. |
| class_BR/L1_hud_layer_v2 | PASS | Ring gone. Salt nearly fills the bottle, thin water band; salt grey-green. |
| class_EX/L1_hud_layer_v2 | PASS | Ring gone. Lantern with 5-notch rail (Open lit), R = wick icon, Exposed wash + pip on the target bar. Lantern shows a candle, not oil: in game use C_ex parts. |
| dev/_sheets/C_pb | FAIL el. 1 mirrored (rerun C_pb_r2); other parts usable | 9 sprites (8 elements, the 2 iron bands separate). Empty frame inside green. Coffin fill has ~6 courses, wide top, no sloped top (asked 10): slice by height % not by course. Capstone is a big slab: scale to frame width. |
| dev/_sheets/C_os | FAIL el. 1 mirrored (rerun C_os_r2); other parts usable | 10 sprites. Empty 8-niche reliquary, lit niche. The 3 crack "overlays" are whole pilasters with the crack painted in: swap the pilaster instead of overlaying. Breach drawn as a whole split reliquary: swap too. 5 greenish px only. |
| dev/_sheets/C_br | PASS, code | 11 elements (15 blobs: foam/kelp bits off the pool and crust decals, merge by row). Empty bottle inside green, bottle back OK. Water fill and salt fill drawn as whole bottles with glass: mask to the inside of element 1 by code. Salt grey-green, crooked. |
| dev/_sheets/C_ex | PASS, code | 13 sprites, guardian on the correct side (lantern left, statue right), unlit, 5 dark notches, no slider. Oil fill drawn as a whole framed glass box: mask to the reservoir. Flames have yellow-green fringes on their tips (1472 px): despill. Counter plate has 4 equal windows (asked 3 + number window). Grave trap has no warm edge. Run hit the 1200 s timeout but the image was saved. |
| dev/_sheets/C_pb_r2 | PASS | 9 sprites, 0 green px. Frame on the left, statue on the right, light upper left. Coffin fill 8 courses (asked 10) with the sloped top and the frame's outline; thin capstone the width of the frame top; slabs, plate (8 arched slots + number window), vow rim, 2 bands. Use instead of C_pb. |
| dev/_sheets/C_os_r2 | PASS, code | 10 sprites. Reliquary on the left, statue on the right, 8 niches, plain pilaster on the left side. Cracks are crack lines only, breach is the gap with broken lips only. The crack interiors were keyed green (760 px): fill them dark after keying. Use instead of C_os. |
| dev/_sheets/F2_fx | PASS, code | 8 effects on black (12 blobs: runnels and glints split). VOW RIM HALF again runs along part of the bottom: rebuild from the closed rim by code, like F_fx #6. Soul light stays white, beacon halo warm amber. |

Orientation check (all right guardians vs their HUD, where the vessel stands on the left and the statue on the right): C_fl, D_ps, C_br, C_ex correct; **C_pb and C_os mirrored** (statue on the left). A code flip would turn the light to the upper right (AD: upper left), so both were rerun as `_r2` with an ORIENTATION fix, plus the 10-course coffin / thin capstone (PB) and crack-only / gap-only overlays (OS); `dev/_sheets/_work/ref_orient_C_br.png` attached as the correct-side example. Run `run_p2d.log`: 2/2 ok, 18.2k tokens. Both r2 PASS (rows above).
