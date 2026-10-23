# Base map 2 · `act1Fens` — The Night Fens (LD 11.4, *The Count of the Sleepers*) → Rook's Weir (LD 11.5), BIO-01

Scene **ASHLAR · Act I · base · Night Fens → Rook's Weir** (`?scene=act1Fens`, thêm `&renderer=webgpu` / `&renderer=webgl`). Plan: `src/env/act1/maps/fens.js` · engine ngoài trời `src/env/act1/outdoor.js` → `outdoorBuild.js` + `blockout.js` → `src/scenes/act1Outdoor.js`. Mặt bằng 2D: `docs/act1-base/fens-plan.png`. Ảnh: `docs/act1-base/shots/fens/`. Asset còn thiếu: `docs/act1-base/ASSETS.md`. Spec: `tmp/act1-base-maps/SPEC.md` §3 map 2. Trạng thái: **base map / đề xuất**, chưa duyệt (2026-10-22).

## Đã dựng

- **Địa hình** 256 × 192 m, ô 0,5 m (513 × 385 đỉnh), một LayerSplat 1024² (4 px/m). **Gần như toàn bộ là nước đầm đen** (một khối nước phủ cả map, mức 0, đáy −1,45 m): đất duy nhất là **đê** (đỉnh +0,5, rộng 2,8 m, bờ dốc 1,4 m), **đảo than bùn** (+0,4–0,45, là "đê béo"), **chỗ lội** (đê chìm −0,06 m: nước ngập mắt cá), và ở Rook's Weir là **lối ván, bè, nóc mái**. Nước mở **không bao giờ đi được**: mọi bờ hụt sâu, sàn đi của Play có lỗ ở nước sâu > 0,6 m (engine) — test cả map từ mọi điểm xuất phát: ô đi được sâu nhất 0,10 m. 23 bãi lau sậy (đáy −0,5 m, cô lập bằng nước sâu) + viền lau trên mọi bờ dốc; **đường chìm** (−0,75 m, ngang hông) dưới Procession Mere là lối của the Soothed, người chơi không xuống được.
- **Mặt đất** 7 layer: `BIO01_peat` (nền: đỉnh đê, mặt đảo) · `DW_mud` (bờ, mép nước, đáy chỗ nông) · `DW_damp` · `DW_dense` (viền đảo) · `DW_sparse` (vai đê) · `DW_grass` (lòng đảo) · `DW_dirt` (dải mòn giữa đê, đảo Lullaby Man, chỗ rite, chỗ lội) + độ ẩm (sương đêm, bờ ướt).
- **Night Fens (wild)**, đi từ đông sang tây: đê từ Lychgate (mép đông) → **đảo đá địa y** (Rite 1: vòng 5 đá dựng quanh ụ đá, nến tắt) → đê qua **vòm đá nghiêng** (A17.1, landmark của act; hai đá đứng thẳng tới 2,2 m rồi nghiêng chạm đỉnh 4,6 m, lối qua 2,44 m) → **đảo bến lội**: đường chìm lên bờ, **đôi giày để bên mép nước** (vignette không đánh dấu), hàng 12 người áo ngủ trắng (N-FN01) lội ngang hông về phía **cửa sổ ấm xa của Gentle House** (REMEMBER) → đê tới **cầu gãy** (2 trụ A06.6, Rite 2: thuyền chìm, giá lờ, lưới người bắt lươn) → vòng xuống **chỗ lội đá** (A06.3) → **cột đèn mồi không thắp** (A06.4, Rite 3) với corpse-candle đứng yên → nhánh đê nam ra **Willow Mere** (liễu non, rễ liễu, Rite 4: mộ than bùn) → **đảo Lullaby Man** (mid-boss, nôi mây rỗng, cây chết). Mở / hẹp xen kẽ: đê (hẹp) · đảo đá (mở) · vòm (hẹp nhất) · đảo bến lội (mở) · cầu gãy + chỗ lội (hẹp) · đảo Lullaby Man (mở) · đê bắc + đập (hẹp).
- **Rook's Weir (wild, nhịp lặng)**: đập (A07.2 mặt nam) dẫn vào làng chìm — **chỉ đi trên ván, bè, nóc mái**: lối ván xuyên **cửa vòm của một tường hồi** (A07.3), **bệ giếng** khô là ngã tư (A01.5), **hai nóc mái chìm có lối ván dọc nóc** (A07.4: "đi trên mái nhà"), 3 bè (A07.5), 9 nhà đá lửa ngập tới mái (A07.1, cửa sổ tối — làng bỏ trống), 6 cột tổ quạ (A07.6) với quạ bay vòng, **tháp chuông chìm** (A17.2, landmark, cao 10,8 m trên mặt nước) và **chuông rơi** nửa chìm (GLB), **nhà ăn đổ mái**: bàn ăn bày dưới nước (A17.4, chỉ lưng ghế và bình nhô lên) + **cửa sổ rèm ren** (A17.5), Rite 5: **ô cửa đứng một mình** cuối lối ván, **bến đêm Gentle House** (A17.6) với **thuyền mái lanh trắng và đèn trắng đứng yên** (A17.3), lái đò chết (NPC, *The Ferryman's Toll*, REMEMBER) và cột thu tiền đò, đê bắc ra **Poppy Reach** (góc tây bắc).
- **Không marker nhiệm vụ: đi theo tiếng ru** — 7 nguồn tiếng ru `RU1–RU7` (marker loại `sound`, vòng = tầm nghe) trong lớp phủ *Landmark + tầm nhìn*: đê vào → vòm → đoàn người → bên kia chỗ lội → Lullaby Man (to nhất) → qua ô cửa → bến đêm.
- **Ngữ pháp ánh sáng**: **không có ánh sáng người nào ở Night Fens** — điểm ấm duy nhất là cửa sổ Gentle House ở xa (quầng tĩnh trong lớp VFX, đọc được qua sương). Corpse-candle (W05) là mồi: **đứng yên, đều, đẹp** (4 đèn thật xanh nhạt + 10 quầng); đèn bến và đèn thuyền là ánh Mercy: trắng, đứng yên (1 đèn thật + 2 quầng). 5 đèn thật / 8. **Nhiều sao hơn bình thường**: vòm sao tĩnh (lạnh, không nhấp nháy, xếp hơi quá đều), chỉ thấy ở các khung nhìn ngang tầm mắt.
- **Xa**: Gentle House (N-GH, dùng chung với map 1) trên đồi cách ~430 m về phía bắc–tây bắc; thấy qua nước đen từ đảo bến lội (khung *REMEMBER: đoàn người mộng du*) và từ bến đêm (*Từ bến đêm nhìn Gentle House*); vài đồi thấp xa, nước đen 2,4 km quanh map.

## Đoạn, điểm xuất phát (Play), khung camera

| Điểm xuất phát | Tuyến kiểm (route) |
|---|---|
| Đê vào từ Lychgate | đê → đảo đá |
| Đảo đá địa y (Rite 1) | đảo → đầu đê vòm |
| Vòm đá nghiêng | qua vòm → đảo bến lội |
| Đảo bến lội | mép nước (giày) → cầu gãy → bờ kênh tới chỗ lội |
| Cầu gãy + chỗ lội + cột đèn mồi | chỗ lội → cột đèn mồi → mố tây cầu gãy |
| Đê nhánh ra Willow Mere (Rite 4) | ngã ba → đảo mộ than bùn → lối ra |
| Đảo Lullaby Man | đảo → đê bắc → đập |
| Đập Rook's Weir | đập → nhà ăn đổ mái → qua cửa vòm |
| Làng chìm · mái nhà, ô cửa | ô cửa (Rite 5) → bệ giếng → nóc mái tây → bè 3 → nóc mái đông → tháp chuông |
| Bến đêm (xuất phát trên đê bắc) | bè 3 → lối ván → bến → đê bắc ra Poppy Reach |

Mọi phần đi được nằm trong cửa sổ 128 m của ít nhất một điểm xuất phát; cả 10 điểm nối liền nhau (một mạng đi bộ, 3 431 ô 1 m). 16 khung camera: toàn cảnh, đê vào, đảo đá, vòm, đảo bến lội, REMEMBER đoàn người (ngang tầm mắt, cửa sổ ấm xa), cầu gãy + chỗ lội, cột đèn mồi, đảo Lullaby Man, nhánh Willow Mere, đập, làng chìm, bàn ăn dưới nước, tháp chuông, bến đêm (REMEMBER), từ bến nhìn Gentle House.

## Thẻ mood (artdirection §2.1 / AD §7.2 — đề xuất)

| Trường | Nội dung |
|---|---|
| Map | The Night Fens (11.4) → Rook's Weir (11.5), BIO-01, `?scene=act1Fens` |
| Mood mục tiêu | Night Fens: theo tiếng ru qua nước đen — lạnh, hoang, đẹp mà dối. Rook's Weir: làng chìm nhưng vẫn giữ nhà — lặng. |
| Palette | Đầm đen `#1F2A24` chiếm gần hết khung; than bùn `#4A3526`; xám-lục ướt `#5E6B5A`; sương `#A9B1A6`; trắng sạch **chỉ** ở áo ngủ the Soothed, mái lanh thuyền, dải lanh ở bến (vải Mercy); corpse-candle xanh nhạt `#D8E7EF`; không accent đỏ. |
| Lighting & thời tiết | **Night Fens · đêm** (mặc định): đêm xanh lạnh, trăng thấp, sương nằm trên nước, nhiều sao, không mưa; ánh ấm duy nhất là cửa sổ Gentle House xa. **Rook's Weir · đêm lặng**: ít sương, sáng trăng hơn, nhiều sao hơn — nước đứng như gương (placeholder: chưa có phản chiếu thật). **Soi texture · sáng đều**. |
| Tương phản & value | Nước đen tối nhất khung; đê / đảo là dải trung tính; điểm sáng nhất: cửa sổ xa (ấm), đèn bến (trắng), corpse-candle (lạnh) — tất cả đứng yên. |
| Nhịp | Đê hẹp → đảo mở → vòm → đoàn người về cửa sổ → cầu gãy, chỗ lội → đèn mồi → Lullaby Man → đập → làng chìm lặng → bến đêm nhìn cửa sổ. |
| Trạng thái | Đề xuất / base map (2026-10-22). |
| Chưa khoá | Độ sáng đêm cho gameplay (light radius của hero chỉ bật khi `hemi` < 1 — mood hiện để 1,35); số sao theo act; độ dài đầy đủ (đề xuất 520 m cạnh dài, ≈ 1,1 km đê cho Night Fens). |

## Kiểm chứng (2026-10-22)

- `node --test scripts/act1-outdoor.test.mjs`: **29/29** (engine + lychgate + fens: plan hợp lệ, hợp đồng §6b, mặt nạ hữu hạn, tất định, 10 điểm xuất phát đứng được và mọi tuyến đi được trên lưới Play, **không bao giờ bơi** (cả map, mọi điểm: ô sâu nhất 0,10 m), đê giữ đỉnh tới mép map, chạm trán chỉ ở wild).
- **WebGL2** (Chrome, 1600 × 900): mở **không lỗi console**. Dựng scene 2,1–2,8 s (đánh giá plan 0,56–0,83 s · thư viện texture 0,33–0,50 s · splat 0,52–0,82 s · dựng 0,53–0,61 s, 2 492 vật); từ lúc mở trang tới sẵn sàng 3,6–5,2 s.
- **WebGPU** (smoke): mở không lỗi (chỉ cảnh báo chung `powerPreference` của Chrome); dựng scene 2,2 s, trang → sẵn sàng 5,7 s; ảnh `shots/fens/webgpu-01-village.png`.
- **Play** (WebGL2, quái tắt): từ cả 10 điểm xuất phát đi hết các tuyến — **87/87 chặng tới nơi**, 0 lần kẹt, 0 lần rơi, không ô nào trong nước sâu (nhân vật luôn trên đê / đảo / chỗ lội / ván); lưới nav 459–2 214 ô dựng trong 1–7 ms. (Lần đầu 86/87: một điểm tuyến nằm trong khối đá rêu — đã dời.)
- **Hiệu năng** (WebGL2, 1600 × 900, mood đêm): burst 1,76–1,83 ms/khung, GPU 1,5–2,0 ms, 53–67 draw call, 1,17–1,19 M tam giác (mặt nước phủ cả map + địa hình 0,4 M). Lưu ý: cùng lúc có trang WebGPU của agent khác chạy trong cùng Chrome, số đo có thể hơi cao.

## Còn thiếu / rủi ro

- Model: 32 mã blockout + 4 procedural + 5 kit tạm (danh sách đầy đủ: `ASSETS.md`); A17 đang dựng Tripo song song. Texture còn thiếu: bờ bùn → nước (A05.2), sàn than bùn (A05.1), mặt đê lát đá (A06.1), thảm lau mục ven bờ, chất liệu đá dựng địa y, tường đá lửa + mái rạ (chung với map 1), **nước đen đứng phản chiếu nhà** (cần planar reflection / SSR).
- VFX là placeholder: tấm sương thấp, vòm sao tĩnh, quầng corpse-candle (chưa có ngọn lửa mờ có mặt người, chưa lơ lửng), đoàn người là tượng đứng (chưa đi, chưa gợn nước, chưa ngân nga), tiếng ru chỉ là marker (cần âm thanh định vị), quạ bay vòng procedural.
- Cỡ cho Play đã nới so với concept: lối qua vòm đá 2,44 m (concept 1,6 m), cửa vòm tường hồi 2,2 × 2,6 m (concept ≈ 1,3 × 2,3 m) — lưới Play 1 m cần ≥ 1,4 m thông thủy.
- Hai điểm xuất phát ở Rook's Weir đứng trên đất khô (bệ giếng, đê bắc) vì test hiện coi điểm xuất phát trên ván là "trong nước sâu".
- Đây là lát cắt đầu: Night Fens nén một nhịp mở/hẹp mỗi ≈ 15–25 s (bản đầy đủ: 40–60 s, ≈ 1,1 km đê); Rook's Weir cần mạng ván gấp 2–3 lần.

## Vòng thay model (2026-10-22)

- **Model thật (GLB):** tháp chuông ngập A17.2, thuyền Gentle House A17.3, bàn ăn dưới nước A17.4, cửa sổ ren A17.5, bến đêm A17.6; mộ đầm N-FN03 dùng mộ mới A16.4; lối lội A06.3 = 7 cụm đá sông mỗi lối. Kit tạm: lờ lươn A01.6 → lưới, đá rêu A03.4 → mảnh `standard_side` đúng cỡ, cọc kè A06.1 → hàng rào gãy, cột đèn mồi A06.4 → cột đèn lồng trống (không lửa, không phát sáng), cột quạ A07.6 → cây chết ×1,35 đứng trong nước, ụ đá N-FN04 → đá thấp. Giữ blockout: vòm đá nghiêng A17.1 (khe của model chỉ 0,9–1,1 m, cần 2,44 m), trụ cầu gãy A06.6, tảng than bùn A03.5.
- **Bến và tháp:** mặt sàn model (cao 0,94 m trên đáy) đặt khớp lối ván `dock` ở 0,62 m; ván riêng của lối ván ẩn đi (`hidden: true`) nên chỉ thấy sàn model, vẫn đi được. Thuyền neo cách trục bến 2,6 m, không chạm mép sàn. Đáy cắt của tháp nằm 0,25 m dưới mặt nước (≈ 9,75 m nhô lên). Quạ đậu trên ngọn cây chết và trên tổ quạ của tháp.
- **Ánh sáng:** đèn trắng đứng yên của bến đặt ở quả đèn trên cột của model, đèn mũi thuyền ở quả đèn của thuyền (ánh Perfection: tròn, không nhấp nháy). Ánh cửa sổ Gentle House ở xa nằm trên ô cửa sáng của dãy A18.4.
- **Hiệu năng (1600 × 900, khung tổng thể; trung vị 2–5 lần tải trang mới; trước = các id đã thay ép về blockout, sau = bản hiện tại; "khung" = 30 khung chạy liền có chờ GPU, tức CPU hoặc GPU, bên nào chậm hơn):** WebGL: khung 2,17 → 2,06 ms, GPU 2,20 → 1,87 ms (số trước dao động 1,87–2,56); WebGPU: khung 5,23 → 5,72 ms, GPU 3,09 → 3,09 ms. Draw call 81 → 81 (WebGPU 80 → 80), tam giác 1,20 → 1,44 triệu. GPU không đổi ở cả hai backend.
- **Bộ nhớ texture (ước tính RGBA8 + mip, chưa nén, như nhau ở hai backend):** ≈ 355 MB → 739 MB (map 2048 px) → 611 MB sau `TEX_1024` (bàn ăn A17.4, cửa sổ ren A17.5, mộ đầm N-FN03 = A16.4, đoạn tường A18.5 của Gentle House ở xa; bớt 128 MB, vẫn hơn blockout 256 MB). Tháp chuông, thuyền, bến giữ 2048.
- **Ảnh:** `shots/fens/before-after.png`, cận cảnh `shots/fens/swap-webgl-c-*.png`, WebGPU `shots/fens/swap-webgpu-*.png`. Còn lại: đá lối lội nhỏ và tối, đọc kém hơn các bậc đá sáng của blockout.
- **Sửa sau review r2 — cột trên bến:** trên sàn bến A17.6 có bốn cột buộc thuyền thấp (cao 0,4–0,5 m trên sàn; cột ở đầu xa phía +z quấn dải vải lanh trắng, đèn treo ngay trên nó) và một cột đèn cao (2,5 m trên sàn, đèn treo ở cần của nó). Trước đây cả bến là `collide: false` nên người chơi đi xuyên qua mọi cột. Nay A17.6 chỉ chặn ở 5 hình chữ nhật đo từ GLB (`blockers`: ba cột buộc, cột quấn vải kèm đèn treo, cột đèn); phần sàn giữa các cột vẫn là lối đi rộng ≥ 1,5 m. Trên lưới Play 1 m bến vẫn đi được từ đầu bến tới đầu xa: tới RU7, L3 ở giữa bến và tới mép cuối sàn. Test mới: không ô đi được nào cách cột dưới 0,3 m, cả đường giữa bến lẫn đầu xa đều tới được, và nếu bỏ các khối chặn thì có ô đi được nằm trong cột (tức các khối chặn thật sự có tác dụng). Không cần ghi cột nào là "đi xuyên được" như vòm A17.1. Kiểm trong trình duyệt (WebGL, va chạm thật của Play, loang ô như `buildNav`): 0 ô đi được cách cột dưới 0,3 m, giữa bến và đầu xa đều tới được.
- **Đầu lối `dock` (sửa sau review r3):** lối ván mặc định có hai đầu tròn. Lưới test coi phần đầu tròn là sàn, còn Play chỉ có sàn hình hộp, nên trước đây quanh bến có 3 ô lưới test đi được mà Play không đi được: 2 ô qua khỏi mép cuối sàn (trên mặt nước) và 1 ô ở chỗ nối bến với lối ván L4. Nay lối `dock` có đầu vuông (`caps: false`), 3 ô đó bỏ khỏi lưới test, lưới test khớp Play. Mọi tuyến của fens vẫn đạt, kể cả điểm cuối tuyến `[-106, -60.6]`, RU7, L3 và đầu xa của bến.
- **Dốc nhìn thấy (sửa sau review r3):** mọi sàn dốc và đoạn dốc (L1, L5, ridgeW…) nay được dựng thành từng khúc ≤ 0,4 m như dốc ẩn ở poppyReach. Trông không đổi, nhưng khi đi tự do người chơi không còn bị đẩy khỏi mép thấp của L5 và ridgeW.

## Vòng thay kit A01–A14 (2026-10-22)

Thay blockout và kit tạm A01–A08 bằng bộ model Act I mới (`assets/act1-kit/`, bảng `tmp/act1-base-maps/ACT1_KIT_FIT.md`); làm xong 2026-10-23.

- **Model thật (GLB, đúng cỡ, chỉ dùng `scale` của điểm đặt):** cầu ván A01.2 (25 khúc), giếng A01.5, giá bẫy lươn A01.6 (×0,85), đá rêu A03.4
  (×0,75–0,99), tảng than bùn A03.5, gốc cây ngập A03.6 (×0,7–0,9), liễu già A04.1 (×0,92 để tán vẫn ≈ 6 m như đảo đã tính), liễu non A04.2,
  cây chết A04.3 (×20, hết kéo giãn), thân cây rỗng A04.5, rễ liễu A04.6, đường đắp A06.1 trên đỉnh đê D1, D2, D4, đá mốc A06.2, lối lội đá A06.3
  (một model cho mỗi chỗ lội, thay 7 viên đá ven sông), cột đèn mồi A06.4, thuyền đáy bằng A06.5, trụ cầu gãy A06.6 (×0,75), nhà ngập A07.1,
  đập A07.2 (×1,5), tường hồi A07.3 (hai bức của nhà ăn), mái chìm A07.4 (hai mái không ai đi), bè ván A07.5.
- **Giữ blockout (có ghi lý do trong def):** tường hồi ở chỗ lối ván xuyên qua và ở rite 5 (id mới `A07.3-door`: cửa model chỉ rộng 1,25 m, cao
  2,33 m; Play cần cửa 2,2 m), hai mái có lối ván chạy dọc nóc (id mới `A07.4-walk`: ống khói của model đứng ngay trên nóc, cao hơn ván 1 m, và nóc
  dốc 0,8 m dọc mái). Tổ quạ A07.6 vẫn là cây chết kit tạm: model có cột nhô qua thanh ngang (đọc thành chữ thập, chờ người dùng chọn bản `-trim`),
  và QA 10-23 thấy thanh ngang bị mất khi tách nên tổ trên cùng lơ lửng (phải dựng lại); blockout của nó cũng là cột nhô qua thanh ngang nên không quay
  về blockout.
- **Đi lại:**
  - Lối ván A01.2: các khúc GLB nằm nối đuôi nhau dọc lối (engine mới `def.deckTop` + `deckPieces`, mặt sàn model 1,22 m trên đáy đặt đúng 0,62 m của lối),
    lối ván riêng ẩn đi (`hidden: true`, chỉ để đi). Dây thừng và cột góc không chặn, như cột của blockout trước đây.
  - Bè A07.5: mặt sàn model (0,81 m trên đáy thùng) đặt đúng sàn lối bè 0,5 m; lối bè ẩn đi và hẹp lại còn 1,8 m cho khớp bè. Lan can sau và cọc
    dây 0,3 m ở đầu −x không chặn (nằm ở mép sàn / chỗ nối lối).
  - Lối lội A06.3: đáy model thấp hơn mặt nước 0,5 m nên mặt đá nhô 0,1–0,2 m; người chơi vẫn lội trên đường đắp ngập 6 cm, đá đi xuyên được.
  - Đường đắp A06.1: chìm 0,35 m cho mặt đá-ván bằng mặt đê, Play đi trên địa hình; không phần nào chặn (hai cột ở hai đầu mỗi khúc, cao 0,4–0,6 m
    và nằm giữa đê, đã được cắt bỏ: xem mục sửa sau review bên dưới); bỏ trống dưới vòm đá nghiêng trên D2 (lối qua vòm). Cột kè bờ kit tạm vẫn ở
    chân đê, nay mang id `A06.1-posts`.
  - Đá mốc A06.2 và cột đèn mồi A06.4: dời điểm đặt để chính hòn đá / chính cột đứng đúng điểm cũ (model lệch tâm 0,24 / 0,31 m); chỉ đá và chân cột chặn.
  - Cỏ lác (A03.3) được mọc sát công trình hơn (cách 0,15 m thay vì 0,3 m) vì khung model mới gồm cả tán, rễ, đá vụn.
- **Ánh sáng:** không đổi. Các model mới không có đèn hay cửa sổ sáng (đúng: làng đã bỏ hoang, cột đèn mồi không bao giờ thắp).
- **Kiểm tra:** `node --test "scripts/act1-*.test.mjs"` 100/100, `node scripts/check.mjs` đạt. Test mới: mặt sàn GLB của lối ván và của bè trùng sàn lối
  đi (±6 cm, đo bằng tia bắn vào model), mặt đá lối lội cao hơn nước 0,05–0,3 m, tường hồi GLB chỉ ở nhà ăn, L2/L7 đi tới cuối.
- **Hiệu năng (1600 × 900, trung vị 2 lần tải trang mới sau một lần tải bỏ đi; trước = bản trước vòng này):**
  WebGL khung tổng thể 2,21 → 2,66 ms, GPU 1,76 → 1,91 ms, 1,44 → 2,80 triệu tam giác, 81 → 85 draw call; làng: GPU 2,09 → 1,77 ms;
  bến: 1,74 → 1,96 ms. WebGPU GPU tổng thể 2,88 → 3,19 ms, làng 2,61 → 2,62, bến 3,02 → 3,09 ms (thời gian khung WebGPU dao động mạnh giữa các lần tải).
- **Bộ nhớ texture (ước tính RGBA8 + mip, chưa nén):** 611 MB → 986 MB (53 → 95 texture). Đây là cái giá đã biết của JPEG chưa nén (SPEC §9 20:14);
  trước khi làm bản game cần KTX2/Basis.
- **Ảnh:** `shots/fens/before-after.png` (trước = bản vòng thay model A15–A20, sau = vòng này, cùng camera), lưới cận cảnh
  `shots/fens/kit-closeups-webgl.png`, `kit-closeups-webgpu.png`, các khung camera WebGPU `kit-beats-webgpu.png`, ảnh lớn `kit-*-c-lanes / c-raft / c-ford.png`.
- **Còn mở:** tán liễu A04.1 / A04.2 sáng (vàng xanh) giữa đêm tối, nổi hơn mọi thứ khác; đá lối lội màu xám sáng; lối L5 qua mái phía đông và lối dọc
  nóc ridgeW vẫn là ván blockout (dốc, model chỉ xoay theo phương ngang); thùng của bè hở đầu (QA, nhỏ).

### Sửa sau review kit r1 (2026-10-23)

- **Cột giữa đường đê (review mục 1):** hai cột ở hai đầu khúc đường đắp A06.1 nằm đúng trên đường giữa của nó; nối đuôi nhau dọc D1, D2 và D4 thì
  cứ 4 m lại có một cặp cột cao 0,6 m giữa đường, click-to-move vướng hoặc phải đi zig-zag. Bản đồ nay dùng bản lab `act1-a06-1-causeway-open`
  (dòng CUT mới trong `scripts/prepare-act1-kit.py`: cắt hai cột phía trên mặt đá-ván, gốc còn lại không quá 0,15 m; mọi GLB khác không đổi byte nào)
  và đường đắp không còn chặn gì (`collide: false`). Test mới đi dọc cả ba đê từ đầu đến cuối, cứ 0,25 m một điểm (391 điểm): không vật chặn nào
  trong bán kính nhân vật và lưới đi bộ từ cửa vào `fenroad` tới được từng ô (bản cũ còn cột thì 147/391 điểm vướng cột).
- **Ảnh:** chụp lại cả bản đồ trên hai backend: `shots/fens/kit-closeups-webgl.png` (ô `c-dike` cho thấy đường đắp D1 không còn cột),
  `kit-closeups-webgpu.png`, `kit-beats-webgpu.png`, `before-after.png` (cột sau), ảnh lớn `kit-*-c-lanes / c-raft / c-ford / c-dike.png`.

## Vòng thay A21–A25 (2026-10-23)

Vòm đá của act và bốn chỗ giữ chỗ (chỉ có trong LD) nay là model A21–A22 thật (`assets/act1-kit/`, bảng `tmp/act1-base-maps/ACT1_KIT_FIT.md`
mục "A21–A25").

- **Vòm đá nghiêng A17.1 → A21.5 bản `-wide`** (`act1-a21-5-leaning-stones-wide`): bản vẽ lại của vòm, nhưng model gốc chỉ hở 1,6–1,75 m. Bản
  `-wide` của lab kéo xoè mỗi phiến ra 0,5 m dưới độ cao 2,2 m (nhỏ dần về 0 ở đỉnh, hai đỉnh vẫn chạm nhau): lối đi 2,60 / 2,70 / 2,70 m ở độ cao
  0,1 / 1 / 2,2 m, trần 3,54 m ở giữa. Rộng 5,6 m, sâu 2,3 m dọc đường (def cũ 1,4 m). Hai khối chặn dời theo hai phiến đá: 1,55 × 2,3 m ở ±2,03 m
  (cũ 1,0 × 1,3 m ở ±1,72), giữa hai khối còn 2,5 m (cũ 2,44 m). Chân ngoài của hai phiến chạm mép nền đắp rộng 5,6 m (ARCH) nơi đất thấp hơn tới
  8 cm, nên vòm cắm xuống đất 0,1 m. Đường đê D2 vẫn đi xuyên vòm (test route `arch` và test mới), đoạn đường đắp vẫn ngắt dưới vòm như cũ.
- **Mộ đầm lầy N-FN03 → A21.6** (thay mộ mới A16.4 đứng tạm): ụ than bùn ≈ 0,5 m, cọc liễu buộc ruy băng 1,4 m ở đầu xa, vòng đá quanh chân (rite 4). Sau review
  chỉ cọc liễu chặn (mục "Sửa sau review a2x" bên dưới); ụ, đá và ruy băng vẫn đi xuyên được như trước.
- **Đôi giày N-FN02 → A22.1** ở mép nước, mũi giày quay ra nước như cũ; đi xuyên được.
- **Cột thu tiền đò N-FN06 → A22.2:** thân cột lệch 0,11 m khỏi tâm model (giá để đĩa tiền nhô ra một bên), nên điểm đặt dời 0,11 m để thân cột đứng
  đúng điểm cũ trên cầu tàu; đĩa tiền quay vào lối đi trên cầu tàu, thẻ gỗ hướng ra thuyền. Cột nay chặn (một ô 0,36 m quanh thân cột; trước đây đi
  xuyên được) — lối trên cầu tàu vẫn rộng ≥ 1,5 m (test cầu tàu vẫn xanh).
- **Nôi mây N-FN08 → A22.3** ×2 trong bãi của Lullaby Man: mỗi nôi chặn một hộp 0,9 × 0,65 m (trước đây đi xuyên được).
- **Đường đắp A06.1** trên D1, D2, D4: `module: 3.0` như lychgate (23 → 29 khúc), các khúc nối liền, không còn cỏ xen giữa.
- **Đi lại:** mọi route và test cũ xanh; số ô đi được từ `fenroad` (lưới đầy đủ) 3 369 → 3 357 (hai phiến đá to hơn lấp hai bên nền vòm).
  **Ánh sáng:** không đổi (đồng xu trên cột thu tiền là màu texture, không phải đèn).
- **Kiểm tra:** `node --test "scripts/act1-*.test.mjs"` 121/121, `node scripts/check.mjs` đạt. Test mới: mọi def GLB mới trỏ đúng sample có file và
  giữ cỡ thật; lối dưới vòm: tia dọc trong lối không chạm mặt đá nào dưới 2,2 m (x −1,2…+1,1), trần ở giữa ≥ 3,4 m, mọi đỉnh của đá ở độ cao người
  nằm trong khối chặn, chân đá không lơ lửng, lưới Play đi qua lối từ điểm xuất phát `arch`.
- **Hiệu năng (1600 × 900, trung bình 2 lần tải trang mới sau một lần tải bỏ đi):** WebGL GPU tổng thể 1,81 → 1,85 ms, làng 1,67 → 1,83, cầu tàu
  1,73 → 2,04 ms (CPU cầu tàu 2,32 → 3,09 ms: một lần đo 3,7 ms, lần kia 2,5 ms, nhiễu); 2,77 → 2,92 triệu tam giác, draw call không đổi. WebGPU GPU
  3,08 → 3,05 / 2,62 → 2,70 / 2,97 → 2,98 ms. **Bộ nhớ texture:** 986 → 1 039 MB (95 → 103 texture).
- **Ảnh:** `shots/fens/before-after.png`, `a2x-closeups-webgl.png`, `a2x-closeups-webgpu.png`, `a2x-beats-webgl.png`, `a2x-beats-webgpu.png`,
  ảnh lớn `a2x-*-c-arch / c-archS / c-toll.png`.
- **Còn mở:** vòm A21.5 ít đa giác (840 tam giác, bốn mảnh) và sâu 2,3 m (đề bài 1,4 m); mặt ngoài có một chỗ gãy nhẹ ở 2,2 m do phép kéo xoè.

### Sửa sau review a2x vòng 1 (2026-10-23)

- **Cọc liễu của mộ đầm lầy N-FN03 chặn (F-c).** Trước đây cả mộ đi xuyên được (`collide: false`), nên nhân vật đi xuyên qua cọc liễu cao 1,4 m.
  Nay def có `blockers: [[0.45, -0.45, 0.3, 0.3]]`: một ô 0,3 × 0,3 m quanh cọc (GLB x 0,30…0,60, z −0,60…−0,30; cọc nghiêng từ (0,47; −0,43)
  ở 0,75 m lên (0,34; −0,52) ở đỉnh 1,4 m). Ụ than bùn, vòng đá và ruy băng vẫn đi xuyên.
- **Test mới** ("review a2x F-c"): đúng một khối chặn 0,3 × 0,3 m; 90 % vertex của cọc ở độ cao người (0,75–1,7 m) nằm trong khối, 99 % cách
  khối ≤ 0,1 m (ruy băng thòng ra tới x 0,67); rite 4 vẫn tới được từ điểm xuất phát `willow`. Mọi lối khác vẫn xanh.
- **Kiểm tra:** `node --test "scripts/act1-*.test.mjs"` 124/124, `node scripts/check.mjs` đạt.

**Sáng hơn (2026-10-23):** `night`: `hemi` 1.35 → 1.9, trăng (`sun.intensity`) 0.55 → 0.63, `envI` 0.12 → 0.17, `exposure` 1.7 → 1.85; `still`: `hemi` 1.3 → 1.8, trăng 0.7 → 0.8, `envI` 0.16 → 0.22, `exposure` 1.6 → 1.75 — sáng hơn ≈ +30 % (Rook's Weir +32 %), trời và nước vẫn đen, vẫn là đêm; ảnh `shots/fens/bright-before-after.png`, số đo `tmp/act1-base-maps/BRIGHTNESS.md`.
