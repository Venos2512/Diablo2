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
- **Ảnh:** `shots/fens/before-after.png`, cận cảnh `shots/fens/swap-webgl-c-*.png`, WebGPU `shots/fens/swap-webgpu-*.png`. Còn lại: đá lối lội nhỏ và tối, đọc kém hơn các bậc đá sáng của blockout; người chơi có thể lướt qua hai cột buộc thuyền ở mép bến.
