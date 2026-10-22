# Base map 1 · `act1Lychgate` — Lychgate (hub, LD 11.2) → Churchyard, *Grave Matters* (LD 11.3), BIO-03

Scene **ASHLAR · Act I · base · Lychgate → Churchyard** (`?scene=act1Lychgate`, thêm `&renderer=webgpu`). Plan: `src/env/act1/maps/lychgate.js` · engine ngoài trời: `src/env/act1/outdoor.js` (định dạng plan ở đầu file) → `outdoorBuild.js` + `blockout.js` → `src/scenes/act1Outdoor.js`. Mặt bằng 2D: `docs/act1-base/lychgate-plan.png`. Ảnh: `docs/act1-base/shots/lychgate/`. Asset còn thiếu: `docs/act1-base/ASSETS.md`. Spec: `tmp/act1-base-maps/SPEC.md` §3 map 1. Trạng thái: **base map / đề xuất**, chưa duyệt (2026-10-21).

## Đã dựng

- **Địa hình** 216 × 160 m, ô 0,5 m (433 × 321 đỉnh): đảo than bùn và **ngọn đồi khô duy nhất** (đỉnh 12,7 m) giữa nước đầm đen; mép đảo chìm xuống −1,8 m dưới mặt nước xa (khung nước đen 2,4 km quanh map, đáy tối dưới đảo để sương hậu kỳ không thấy "trời" qua mép). Nước: đầm đen ba phía (bậc lội ~2 m sâu ≤ 0,32 m rồi tụt sâu 1,5 m — dốc hơn bước 0,6 m của Play nên nhân vật không đi vào nước sâu), hồ làng, 3 hố cắt than bùn đọng nước. Mặt nước ghi depth (sương đo tới mặt nước, liền với nước xa).
- **Mặt đất** 7 layer (một LayerSplat 864² phủ 216 m): `BIO01_peat` (nền) · `DW_damp` · `DW_grass` (cỏ sân nhà thờ trong tường) · `DW_dense` (rìa, sườn) · `DW_dirt` (lối mòn, đất mộ, sân nhà) · `BIO03_flint` (nền nhà thờ, đỉnh đồi, sân hầm, ngưỡng lychgate, vách dốc) · `DW_mud` (mép lối, bờ hồ, mộ mới) + độ ẩm (mưa phùn, đất thấp, bờ nước). Blend 1,5–3 m theo thanh *Độ mịn*. Lối làng lát cuội = dải `darkwood-sty-green-cobble` (thay tạm).
- **Hub (an toàn)**: 11 nhà sàn (A01.1, cửa sổ hổ phách, nhánh poppy trên cửa là accent duy nhất), 3 lối ván trên nước (A01.2: qua hồ tới nhà Edda, tới giá lờ lươn, cầu câu phía tây; mặt ván là sàn đi được, có dốc ở đầu chạm đất), giếng, lò rèn Brannoc (đèn lò chập chờn), bảng tên người ngủ, chuông tang, sạp Nell, trạm gác Osric (giỏ lửa), tường đá lửa vá + rào liễu, thùng nước mưa / bao hàng / dây phơi / lưới (kit tạm), đống than bùn, hố cắt than bùn phía đông, liễu non ven nước. **Sân hầm nhà Barrow** dưới tháp ossuary (cửa hầm trong tường chắn, đống sọ cho trẻ con đếm, nến) — thuộc hub, bị tường chắn đất bịt khỏi đỉnh đồi.
- **Ngưỡng ánh sáng**: **cổng lychgate có đèn là khe duy nhất** của tường đá lửa bao sân nhà thờ (test kiểm: chặn lối qua cổng thì sân nhà thờ, đỉnh đồi bị cắt rời cả từ làng lẫn từ sân hầm).
- **Churchyard (wild)**: dốc từ cửa nhà thờ đá lửa (A15.1, cửa tây, chuông trên đầu hồi, Wedge thay thánh giá) xuống cổng; 28 mộ thấp có nến hũ (A16.3), cụm bia lệch, mortsafe, mộ mới, xe tang, giá treo cổ hắc ín (lồng rỗng, quạ), **thủy tùng chỉ ở rìa**, tượng không mặt bên lối đi (quay về cổng), đèn cột người đào mộ + bát sữa, **tháp ossuary tròn trên đỉnh khô**. **Năm mộ chưa yên** (R1 mộ trỗi dậy, mortsafe bẻ ra ngoài · R2 mộ mới + xe tang + đèn cột · R3 mộ trẻ con + nến hũ, ghế canh bên cạnh (vignette **không đánh dấu**) · R4 mộ dưới giá treo cổ · R5 lô mộ gia đình sau tường đá). Toggle *Các mộ đã yên*: sương mỏng đi, quạ đậu lại.
- **Xa**: Gentle House (N-GH: tháp cổng + dãy ward dài + một cửa sổ cao ấm, đứng yên) trên đồi cách ~420 m về phía tây-tây bắc, thấy qua nước đen từ đỉnh đồi và từ làng / đê (khung *Từ đỉnh đồi nhìn Gentle House*, *Từ làng nhìn qua nước đen*). Quầng cửa sổ ở lớp VFX nên đọc được qua sương.
- **Lối ra**: đê ra Night Fens (tây), cửa hầm Barrow (*One for the Footing*), cửa nhà Edda (*The Broth* → Edda's Dream).
- **Ngữ pháp ánh sáng**: 7 đèn điểm thật (đèn lychgate, lò rèn, cửa sổ quảng trường, cửa sổ Edda, nến cửa hầm, cửa nhà thờ / đèn Gennet, giỏ lửa Osric) — ánh sáng người: nhỏ, ấm `#E0A050`, chập chờn 1/f; ~160 quầng tĩnh (cửa sổ, nến hũ, đèn cột, tẩu Gennet); ánh sáng Perfection (cửa sổ N-GH) **đứng yên**, ấm, sáng nhất.

## Đoạn, điểm xuất phát (Play), khung camera

| Điểm xuất phát | Loại | Tuyến kiểm (route) |
|---|---|---|
| Làng · quảng trường | hub | quảng trường → cổng tây → đê |
| Làng · bờ hồ, nhà Edda | hub | lối ván qua hồ → cửa nhà Edda |
| Cổng lychgate (ngưỡng) | hub | qua cổng → tượng → cửa nhà thờ |
| Sân nhà thờ · giữa dốc | wild | lối mộ phía tây → R2 → giá treo cổ |
| Đỉnh đồi · tháp ossuary | wild | đỉnh → vòng sau nhà thờ → cửa nhà thờ |
| Sân hầm Barrow | hub | sân hầm → dốc xuống → lối làng |
| Đê ra Night Fens | wild | đê → cổng tây → làng |

13 khung: toàn cảnh, làng, bờ hồ, cổng lychgate, sân nhà thờ, năm mộ, nhà thờ + tượng, đỉnh đồi, sân hầm, giá treo cổ, đê, hai khung nhìn Gentle House.

## Thẻ mood (artdirection §2.1 / AD §7.2 — đề xuất)

| Trường | Nội dung |
|---|---|
| Map | Lychgate (hub, 11.2) → Churchyard (11.3), BIO-03, `?scene=act1Lychgate` |
| Mood mục tiêu | Hub: "ấm nhỏ biết giá của nó" — nghèo, ướt; churchyard: quỳ bên mộ trong mưa. |
| Palette | Xám-lục ướt `#5E6B5A`, than bùn `#4A3526`, sương `#A9B1A6`, đầm đen `#1F2A24`; ánh nến `#E0A050`; accent duy nhất: nhánh poppy `#B3262A` trên cửa (tắt trong Prologue). |
| Lighting & thời tiết | **Act I · mưa phùn ban ngày** (mặc định): trời xám không bóng, mưa phùn, sương thấp. **Prologue · đêm mưa**: đêm xanh xám có trăng, mưa, không accent, nến mộ tắt, đèn Gennet ở cửa nhà thờ là ánh ấm đầu tiên, đèn lychgate là đích, cửa sổ làng mờ sau sương, N-GH tắt. **Soi texture · sáng đều**. |
| Tương phản & value | Blockout màu xám-nâu tối theo loại; ánh sáng người là điểm ấm nhỏ; đầm đen tối nhất khung. |
| Nhịp | Làng ấm thấp → cổng có đèn → dốc mộ xám → nhà thờ → đỉnh đồi nhìn về cửa sổ ấm xa. |
| Trạng thái | Đề xuất / base map (2026-10-21). |
| Chưa khoá | Giờ và mức sáng của Prologue (đề xuất hiện tại: mục *Vòng sửa 1*); camera / budget; độ dài đầy đủ (đề xuất 360 m). N-GH **tắt** trong Prologue: đã khoá ở vòng sửa 1. |

## Kiểm chứng (2026-10-21)

- `node --test scripts/act1-outdoor.test.mjs`: **13/13** (engine trên plan tổng hợp; plan hợp lệ — không NaN, trong biên, ≤ 8 layer, mọi asset có đặt hoặc khai báo thiếu kèm lý do, ≤ 8 đèn thật; model glb có trong samples.json, mảnh kit có trong kitSizes.json; mặt nạ hữu hạn ∈ [0,1]; tất định; 7 điểm xuất phát đứng được và mọi tuyến đi được trên lưới kiểu Play 1 m / bước 0,6 m / bán kính 0,3 m; chạm trán chỉ ở wild; nước có nước; **cổng là lối duy nhất**; 5 rite, 1 vignette không đánh dấu, đường nhìn tới N-GH từ đỉnh). `npm run test:act1`: 28/28. `npm run check`: đạt.
- **WebGL2** (Chrome, 1600 × 900): mở không lỗi console. Dựng scene ~1,8–2,6 s (đánh giá plan 0,45–0,6 s · thư viện texture 0,3–0,45 s · splat 0,6–0,8 s · dựng 0,45–0,7 s); từ lúc mở trang tới sẵn sàng ~4,5 s. Burst 2,7–3,0 ms/khung, GPU 1,7–1,9 ms, 70–112 draw call, 0,6–0,73 M tam giác. Rời sang Studio rồi quay lại 2 lần: geometry 85 → 52 → 93 → 52 → 93, texture 56 → 50 → 64 → 50 → 64, không lỗi.
- **WebGPU** (smoke): mở không lỗi (chỉ cảnh báo chung `powerPreference` của Chrome); sẵn sàng ~10 s lần đầu (biên dịch pipeline); burst 8,6–10 ms (CPU), GPU 1,4–2,6 ms.
- **Play**: từ cả 7 điểm xuất phát, đi hết 36 chặng của các tuyến, 0 lần kẹt, 0 lần rơi (nhân vật luôn ở mặt đất / mặt ván); lưới nav 10–16 nghìn ô dựng trong 17–43 ms. Quái thay thế: 25 con trong 10 trại, mang tên mã ASHLAR (U01 ×10, U02 ×4, U03 ×2, U04 ×2, W02 ×5, F01 ×2). Bước chân: ván = `wood`, lối cuội = `stone`, hồ / đầm = `water` + độ sâu.

## Vòng sửa 1 (2026-10-22)

- **Không bao giờ bơi, trong Play thật**: Play đi trên một **sàn đi** riêng, là terrain có lỗ (`W.floorField`; `outdoorBuild.buildWalkFloor` tạo mesh va chạm ẩn, mỗi ô 64 m). Không có sàn ở nơi nước sâu hơn 0,6 m (hồ, đầm, nước xa), dưới ván cầu (ván là sàn duy nhất ở đó) và trong bán kính 0,3 m quanh công trình chắn; terrain nhìn thấy ra khỏi va chạm. Công trình (blockout, kit, glb) cũng ra khỏi va chạm, vì mặt trên của chúng từng là sàn cho nav: nav trèo lên tường đá lửa thấp ở đoạn dốc rồi vào sân nhà thờ. Thay vào đó là hộp chỉ có vách (không nắp) đúng theo `W.blockers`. Tường nước sâu (`W.deepWalls`) giữ lại cho đi bộ tự do. `walkGrid` đọc cùng sàn (`W.walkY`) nên test và Play khớp nhau. Thứ tự độ cao mới: ops → mép bản đồ → lòng nước → đê → bệ, nên đê giữ đỉnh tới tận biên (ảnh `fenedge-01-fenroad.png`).
- **Đo trong Play** (lưới nav 128 m quanh 7 điểm xuất phát):
  - Ô đi được sâu nhất **0,60 m** (trước: 1,79 m ở (52,5, −83,5)).
  - Đi về phía nước sâu từ đê, đỉnh đồi, hub và bờ hồ: dừng ở bờ, lội sâu nhất 0,52 m.
  - 0 / 2 639 điểm nước sâu có sàn.
  - Chặn cổng trên lưới nav thật: sân nhà thờ bị cắt khỏi hub, bờ hồ, cổng và đê (trước đó lọt qua đỉnh tường).
  - 42 / 42 chặng tuyến vẫn đi hết, 0 lần kẹt, 0 lần rơi; 25 quái trong 10 trại.
- **Đêm Prologue**:
  - Đèn Gennet ở cửa nhà thờ là ánh ấm đọc đầu tiên (cường độ 14, tầm 13 m, quầng 1,15); đèn lychgate dịu xuống (3,2, quầng 0,3); cửa sổ làng ở mức 0,2.
  - Tắt: cửa sổ Edda, nến cửa hầm, giỏ lửa Osric, hai đèn người đào mộ, nến mộ, lò rèn, accent poppy.
  - **Cửa sổ Gentle House tắt trong Prologue** (đã khoá). Ảnh `night-02-lychgate.png`.
- **Tượng Nameless Saint** đứng trên lối: lối tách thành hai làn chạy dưới hai đầu vòm, chỉ bệ tượng chặn (1,45 × 1,2 m).
- **WebGPU CPU** (A/B trong cùng một lần tải, 3 vòng × 40 khung, trung vị; CPU = thời gian `app.frame()` sau khi đã đồng bộ GPU): ~2,5–2,9 ms/khung ở overview và hub. Tắt mưa, nhấp nháy, sương, 7 đèn điểm hay bật nhãn đều nằm trong nhiễu ±0,4 ms, nên mưa không chuyển sang Atmosphere. 26 tấm sương đã gộp thành 1 InstancedMesh (bớt 25 draw call khi cả 26 tấm nằm trong khung).
- **Test**: `npm run test:act1` **61/61**. Gồm: sàn đi không có trong nước > 0,6 m, dưới ván, hay trong bán kính công trình; không ô nào sâu > 0,7 m trên lưới toàn bản đồ từ mọi điểm xuất phát; cổng là lối duy nhất trên lưới toàn bản đồ từ mọi điểm phía hub; map import lỗi thành một test fail riêng. `npm run check`: đạt.

## Còn thiếu / rủi ro

- Model: 31 mã blockout + 5 procedural + 6 kit tạm (danh sách: `ASSETS.md`). Texture còn thiếu: lối cuội BIO-03 có viền cỏ (A05.3), cỏ sân nhà thờ + đất mộ (A05.5), bờ bùn → nước (A05.2), sàn than bùn (A05.1), tường đá lửa + vữa vôi, mái rạ vá.
- Mưa / sương là placeholder tự viết (vệt mưa quanh camera, tấm sương thấp, sương cao độ hậu kỳ); hệ hạt Atmosphere của lab cần một dòng trong `env/atmosphere.js` (file dùng chung, ngoài phạm vi). Chưa có khói than bùn, tia lò rèn, ngọn lửa nến (FlameField), âm thanh.
- WebGPU: đo lại ở vòng sửa 1, CPU ~2,5–2,9 ms/khung, burst 4,6–6,2 ms; chưa công tắc nào giảm CPU vượt mức nhiễu. 7 đèn điểm là chi phí GPU (hub, khi tắt: wall giảm 0,2–1,4 ms, hai lần đo chưa khớp).
- Play và mô hình đi bộ trong test dùng chung sàn đi và hộp công trình (chân móng hoặc `blockers` của def), nên va chạm theo hình chữ nhật chứ không theo hình model. Công trình có đỉnh thấp hơn 0,35 m so với mặt đất ngay đó không chặn. Mặt nước đầm có mép chữ nhật thấy rõ trên nền nước xa ở đê (có từ vòng 0). Tường trên sườn dốc cao lên tới đất phía dốc trên + 0,84 m (không bị chôn) nên nhìn bậc thang ở sườn.
- Dàn cảnh là lát cắt đầu: hub ~130 m lối (cần ~220 m cho 40 s chạy), sân nhà thờ nên mở rộng về bắc / tây; độ dài đề xuất ghi trong plan (`target`).

## Vòng thay model (2026-10-22)

- **Model thật (GLB, đúng cỡ, không kéo giãn):** nhà thờ A15.1, lò rèn A15.2, bảng tên A15.3, chuông tang A15.4, sạp Nell A15.5, trạm gác A15.6, thủy tùng A16.1 (×9), giá treo cổ A16.2, mộ hũ nến A16.3 (×28), mộ mới A16.4 (×2), mộ chưa yên A16.5, đèn sexton A16.6 (×2). Kit tạm: giá lờ lươn A01.6 → lưới đánh cá, xe tang A02.6 → xe cút kít ×1,2, cọc kè đê A06.1 → hàng rào gãy. Giữ blockout: cửa hầm N01, đống than bùn N04, cụm bia A02.3 (lý do ở `tmp/act1-base-maps/REUSE_CANDIDATES.md`, mục *Decisions (outdoor)*).
- **Mặt sau trơn được giấu:** lò rèn xoay −45° (mặt mở nhìn ra quảng trường, hai mặt trơn quay về hướng camera không thấy), bảng tên xoay 0°, sạp Nell xoay 30°. Cột giá treo cổ và cột đèn đứng đúng chỗ cũ (model có trụ lệch tâm).
- **Va chạm:** khung chặn theo khối thật (nhà thờ sâu 10,7 m vì trụ tường; thủy tùng chỉ chặn gốc và rễ; mộ hũ chặn phần gò; giá treo cổ và đèn chỉ chặn trụ). Lychgate vẫn là lối duy nhất vào sân nhà thờ; test lối đi mới qua cửa nhà thờ, lối mộ phía tây, mặt trước lò rèn đều đi được.
- **Ánh sáng:** lửa lò đặt trên bếp lò của model, giỏ lửa Osric trên giỏ của model, đèn sexton trên lồng đèn. Nến hũ: model không có lửa (miệng hũ ám khói) nhưng LD giữ nến sáng ban ngày ở Act I và tắt hết trong đêm Prologue, nên đặt ba đốm sáng nhỏ trong ba hũ của mỗi mộ (cờ `graveCandles`). Gentle House ở xa giờ là dãy A18.4 + 11 đoạn tường A18.5 + khối tháp A11.4 (chưa có model); ánh cửa sổ ấm đứng yên nằm trên chính ô cửa sáng của model.
- **Hiệu năng (1600 × 900, khung tổng thể; trung vị 2–5 lần tải trang mới; trước = các id đã thay ép về blockout, sau = bản hiện tại; "khung" = 30 khung chạy liền có chờ GPU, tức CPU hoặc GPU, bên nào chậm hơn):** WebGL: khung 2,12 → 2,09 ms, GPU 1,74 → 1,70 ms; WebGPU: khung 5,08 → 5,23 ms, GPU 2,81 → 2,83 ms (khung WebGPU dao động 4,4–5,8 ms giữa các lần tải). Draw call 88 → 88 (WebGPU 87 → 87), tam giác 0,73 → 1,09 triệu. GPU không đổi (trong nhiễu) ở cả hai backend.
- **Bộ nhớ texture (ước tính RGBA8 + mip, chưa nén, như nhau ở hai backend):** blockout ≈ 412 MB → thay model với map 2048 px ≈ 1 030 MB → sau khi hạ 1024 px cho đạo cụ cỡ ≤ 3–4 m (`TEX_1024`: bảng tên, chuông tang, sạp, trạm gác, giá treo cổ, ba loại mộ, đèn sexton, và đoạn tường A18.5 của Gentle House ở xa) ≈ 711 MB (bớt 320 MB, vẫn hơn blockout 299 MB). Nhà thờ, lò rèn, thủy tùng giữ 2048. Nếu cần bớt nữa: nén KTX2.
- **Ảnh:** `shots/lychgate/before-after.png`, cận cảnh `shots/lychgate/swap-webgl-c-*.png`, WebGPU `shots/lychgate/swap-webgpu-*.png`.
