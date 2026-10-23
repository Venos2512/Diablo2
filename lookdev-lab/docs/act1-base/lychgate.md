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

## Vòng thay kit A01–A14 (2026-10-22)

Thay blockout và kit tạm A01–A08 bằng bộ model Act I mới (`assets/act1-kit/`, bảng `tmp/act1-base-maps/ACT1_KIT_FIT.md`); làm xong 2026-10-23.

- **Model thật (GLB, đúng cỡ, chỉ dùng `scale` của điểm đặt):** nhà sàn A01.1 (×11), lối ván A01.2 (12 khúc), tường đá lửa A01.3, rào liễu A01.4,
  giếng A01.5, giá bẫy lươn A01.6 (×0,85, thay lưới kit tạm), lychgate A02.1, lồng mộ A02.2, cụm bia A02.3, tháp hài cốt A02.4 (×0,85), tượng
  thánh không mặt A02.5, xe tay đưa tang A02.6 (cỡ thật 3,2 m, thay xe cút kít kit tạm ×1,2), liễu non A04.2, đường đắp A06.1 trên đỉnh đê ra Night Fens.
- **Lychgate:** model có một thanh ngang thấp (0,40–0,62 m) chắn ngang lối sau và không có ghế bên (QA 10-23). Thanh đó được cắt khỏi một bản
  riêng cho lab: `act1-a02-1-lychgate-open` (bảng CUT trong `scripts/prepare-act1-kit.py`; mọi GLB khác, các dòng samples.json khác và đoạn giấy phép
  không đổi byte nào). Chỉ bốn bệ đá lửa và thanh bên phía −x chặn; hai cánh cổng mở hé phía trước (lối thẳng còn 1,35 m) đi xuyên được; dưới xà còn
  2,17 m. Lychgate vẫn là lối duy nhất vào nghĩa trang (test chặn cổng thì nghĩa trang bị cắt rời; test mới: không còn mặt nào ở độ cao người trong
  lối đi của bản `-open`, bản gốc thì có).
- **Tượng thánh A02.5:** xoay 0° cho mặt rộng nhìn thẳng camera game (QA: nhìn nghiêng, hai khối ở đầu vòm thành hình chữ thập mờ). Tượng nhìn
  xuống dốc về phía làng, lychgate lệch 37° bên phải; hai nhánh lối vẫn đi cách hai đầu vòm ≈ 0,9 m; chỉ bệ (1,64 × 1,47 m) chặn.
- **Lối ván A01.2:** các khúc GLB nằm nối đuôi nhau dọc lối (engine `def.deckTop` + `deckPieces`, mặt sàn model 1,22 m trên đáy đặt đúng sàn lối 0,66 /
  0,62 m, chân cột cắm xuống bùn ao); lối ván rộng ra 1,8 m (sàn model 1,75 m) và ẩn đi (`hidden: true`, chỉ để đi); dốc ẩn ở đầu w2/w3 chỉ cao 0,13 m.
  Mặt hở (+z) của mỗi khúc quay về camera, dây thừng ở mặt sau; dây và cột không chặn như cột của blockout.
- **Đường đắp A06.1:** đặt dọc đỉnh đê (0,92 m), chìm 0,35 m nên mặt đá-ván bằng mặt đê, Play đi trên địa hình; không phần nào chặn (hai cột ở hai
  đầu mỗi khúc đã được cắt bỏ, xem mục sửa sau review bên dưới).
  Cột kè bờ kit tạm cũ vẫn ở bờ bắc của đê, nay mang id `A06.1-posts`. Engine: `runs` nhận thêm `dy` và `scale` (tỉ lệ đều).
- **Va chạm khác:** nhà sàn chặn thân nhà + sàn cột (4,4 × 3,3 m) và cái thang, mái tranh vươn ra (trên 2 m) không chặn; liễu non chỉ chặn gốc.
- **Ánh sáng (ngân sách đèn không đổi):** đèn lychgate nằm trong một chiếc đèn lồng treo dưới xà ngang phía trước (xem mục sửa sau review) vì model
  lychgate không có đèn; ánh cửa sổ ấm của
  nhà sàn là đèn engine đặt trên ô cửa có then ở tường +x của model (model không có cửa sổ sáng); đèn cửa sổ nhà Edda dời đến ô cửa đó; cành anh túc
  nằm trên mặt cửa (z +1,06, cao 1,75 m).
- **Kiểm tra:** `node --test "scripts/act1-*.test.mjs"` 101/101, `node scripts/check.mjs` đạt. Test mới: mặt sàn GLB lối ván trùng sàn lối đi ±6 cm,
  lychgate chỉ chặn bệ + lối giữa đi được, đường đắp bằng mặt đê.
- **Hiệu năng (1600 × 900, trung vị 2 lần tải trang mới sau một lần tải bỏ đi; trước = bản trước vòng này):** WebGL tổng thể GPU 1,69 → 1,94 ms,
  khung 2,40 → 2,57 ms, 1,09 → 2,93 triệu tam giác (67 module tường đá lửa ≈ 1 triệu), 88 draw call như cũ; làng GPU 1,71 → 1,97 ms; nghĩa trang
  1,54 → 1,75 ms. WebGPU GPU tổng thể 2,73 → 2,79 ms, làng 2,63 → 2,78, nghĩa trang 2,62 → 2,70 ms.
- **Bộ nhớ texture (ước tính RGBA8 + mip, chưa nén):** 711 MB → 865 MB (69 → 97 texture).
- **Ảnh:** `shots/lychgate/before-after.png` (trước = bản vòng thay model A15–A20, sau = vòng này, cùng camera), lưới cận cảnh
  `shots/lychgate/kit-closeups-webgl.png`, `kit-closeups-webgpu.png`, các khung camera WebGPU `kit-beats-webgpu.png`, ảnh lớn
  `kit-*-c-gate / c-mere / c-saint.png`.
- **Còn mở:** cửa sổ của nhà sàn chỉ có ở tường +x nên nhà quay lưng về camera không thấy ánh cửa; cánh cổng lychgate đi xuyên được (theo yêu cầu,
  để lối không còn 1,35 m); số tam giác tăng gấp ≈ 2,7 lần (GPU vẫn gần như cũ).

### Sửa sau review kit r1 (2026-10-23)

Review Opus vòng 1 cho PASS kèm vài điểm nên sửa (`tmp/act1-base-maps/REVIEW_kit_r1.md`); vòng này sửa những điểm của bản đồ này.

- **Cột giữa đường đê (mục 1):** hai cột ở hai đầu khúc đường đắp A06.1 nằm đúng trên đường giữa của nó, nên khi đặt nối đuôi dọc đường đê ra Night Fens
  cứ 4 m lại có một cặp cột cao 0,6 m giữa đường, click-to-move bị vướng. Hai cột được cắt khỏi một bản riêng cho lab, `act1-a06-1-causeway-open`
  (thêm một dòng CUT trong `scripts/prepare-act1-kit.py`; chỉ phần trên mặt đá-ván bị cắt, còn lại gốc cột cao không quá 0,15 m; mọi GLB khác và các
  dòng samples.json khác không đổi byte nào). Đường đắp không còn chặn gì (`collide: false`). Test mới đi dọc đỉnh đê từ đầu đến cuối, cứ 0,25 m một
  điểm: không vật chặn nào trong bán kính nhân vật và lưới đi bộ tới được từng ô (bản cũ còn cột thì 66/145 điểm vướng cột).
- **Đèn lychgate lơ lửng (mục 2):** model lychgate không có đèn nên trước đây chỉ thấy một quả cầu sáng giữa vòm. Nay treo một chiếc đèn lồng nhỏ:
  phần đèn lồng của cột đèn người giữ mộ A16.6 (thân kính + móc treo, không lấy cột và cánh tay cong), thu nhỏ ×0,75 (rộng 0,21 m, cao 0,41 m), móc
  chạm mặt dưới xà ngang phía trước (2,32 m), đáy đèn cao 1,91 m nên nhân vật đi lọt bên dưới. Đèn người (ấm, nhỏ, chập chờn) nằm trong lồng kính ở
  2,07 m, quầng sáng thu từ 0,55 xuống 0,3 (đêm 0,3 → 0,2). Engine bản đồ ngoài trời nhận thêm hai trường cho def GLB: `cut` (bỏ các tam giác có tâm
  nằm trong hộp, như `cut` của engine nội thất) và `pivot` (điểm của model làm gốc def), nên dùng lại một phần của model có sẵn mà không thêm file.
  Test mới đọc đúng file GLB: phần giữ lại chỉ là đèn lồng, móc chạm xà, đáy đèn cao hơn đầu nhân vật, đèn nằm trong lồng kính.
- **Ảnh cận cảnh rào liễu (mục 8):** camera `c-hurdles` cũ nằm trong mái nhà sàn c2; nay nhắm vào góc rào [38, 40] → [38, 31] → [47, 30,5] từ phía
  tây nam (yaw −40°, không vật gì che). Thêm ảnh cận `c-lamp` nhìn thẳng chiếc đèn lồng.
- **Ảnh:** chụp lại cả bản đồ trên hai backend (tải bỏ một lần sau mỗi lần đổi backend): `shots/lychgate/kit-closeups-webgl.png`,
  `kit-closeups-webgpu.png`, `kit-beats-webgpu.png`, `before-after.png` (cột sau), ảnh lớn `kit-*-c-gate / c-mere / c-saint / c-lamp / c-dike.png`.

## Vòng thay A21–A25 (2026-10-23)

Bốn chỗ giữ chỗ (chỉ có trong LD) của sân hầm Barrow và nghĩa trang nay là model A21 thật (`assets/act1-kit/`, bảng
`tmp/act1-base-maps/ACT1_KIT_FIT.md` mục "A21–A25"); kèm một điểm còn lại của review kit vòng 2 (đường đắp A06.1).

- **Cửa hầm nhà Barrow N01 → A21.1** (`act1-a21-1-barrow-door`): model lấy chiều cao 2,8 m làm chuẩn nên rộng 3,7 m, cửa ≈ 1,5 × 2,1 m (lấy chiều
  rộng 2,4 m thì chỉ cao 1,82 m, cửa 1,37 m). Đứng giữa hai đoạn tường sân, mặt đoạn tường của nó bằng mặt tường N02 (lệch dưới 5 cm); hai đoạn tường
  dừng đúng hai đầu cửa (±1,85 m). Đáy đặt trên mặt sân (`y: 'min'`; blockout cũ chìm 0,2 m). Cánh cửa soi gương ở mặt sau của model vùi trong đồi.
  Chặn tới mặt thấy được (mục "Sửa sau review a2x" bên dưới; lúc đầu chặn cả khung 3,7 × 1,07 m); giữ điểm neo `door` ở giữa mặt.
- **Tường chắn đất đá lửa N02 → A21.2** (`act1-a21-2-flint-retaining-wall`): model cao 2,16 m (def 3,2 m) nên dựng ×1,55: mỗi module 6,2 × 3,35 m,
  mỗi đoạn tường (6,1–7 m) đúng một module (8 → 4 module), giãn dọc tối đa 12 %. Mặt ngoài (đá lửa, đá góc sáng màu, lỗ thoát nước, dương xỉ) quay
  vào sân; gờ trên ≈ 3,22 m, cao hơn đất đồi phía sau 0,2 m (`parapet: 0.2`; mặc định 0,6 × chiều cao sẽ kéo model cao ×1,6); riêng đoạn phía tây trên
  dốc giãn cao thêm 10 %. Bỏ `flip` của hai đoạn sau (blockout đối xứng nên trước đây không thấy khác).
- **Mặt tường lùi sau khung bao:** mặt đá của A21.2 và A21.1 nằm ≈ 0,14 / 0,10 m trước tâm model, còn khung bao nhô ra tới gờ đá, dương xỉ và bậc
  thềm. Lần chụp đầu, đặt theo đường tâm cũ, bậc dốc ở mép sân (một ô 0,5 m lên đồi) trồi ra trước mặt tường và che mất 1,5–2 m dưới của cả tường
  lẫn cửa (chỉ còn thấy vòm cửa). Nay tường và cửa đứng với mặt lùi vào trong sân 0,18 m (`WALL_FACE`), bậc dốc nằm trong lòng tường; cánh cửa lõm vào
  vẫn đứng trước chân dốc. Test mới đo mặt thật trên file GLB và kiểm mặt đất trước mỗi mặt tường không leo lên.
- **Đống than bùn N04 → A21.3** ×12: dẹt (cao 0,66 m, đề bài 1,1 m), giữ nguyên, không kéo giãn. **Ghế canh mộ N10 → A21.4**: model cho thấy hướng
  ghế, nên ghế được xoay (−150° → 143°) để nhìn thẳng ngôi mộ trẻ con bên cạnh (trước đây lệch 67°).
- **Đường đắp A06.1 (review kit vòng 2):** mặt đá-ván của mỗi khúc chỉ dài ≈ 3,4 m (x −1,75…+1,65) nên đặt cách 4 m trông như từng mảng rời có cỏ
  xen giữa. Def nay có `module: 3.0`: các khúc chồng nhau ≈ 0,4 m, nối liền (10 → 12 khúc); test mới đi dọc từng đoạn đường, cứ 0,25 m phải có mặt
  đường đắp bên dưới. Hai test cũ (bằng mặt đê, đi suốt đỉnh đê) vẫn xanh.
- **Đi lại:** lychgate vẫn là lối duy nhất vào nghĩa trang (test chặn cổng vẫn xanh); cửa hầm tới được từ điểm xuất phát `terrace`; số ô đi được
  (lưới đầy đủ từ `hub`) 24 610 → 24 611. **Ánh sáng:** không đổi (không model nào có đèn; nến trước cửa hầm cách mặt cửa 1,1 m).
- **Kiểm tra:** `node --test "scripts/act1-*.test.mjs"` 121/121 (cả hai vòng thay chạy cùng lúc), `node scripts/check.mjs` đạt.
- **Hiệu năng (1600 × 900, trung bình 2 lần tải trang mới, mỗi lần sau một lần tải bỏ đi; trước = bản cuối vòng kit):** WebGL GPU tổng thể
  1,90 → 2,11 ms, làng 1,90 → 1,90, nghĩa trang 1,71 → 1,71; 2,92 → 3,12 triệu tam giác, draw call không đổi (89). WebGPU GPU 2,88 → 3,09 /
  2,84 → 2,72 / 2,76 → 2,73 ms. **Bộ nhớ texture** (ước tính RGBA8 + mip): 865 → 923 MB (97 → 105 texture).
- **Ảnh:** `shots/lychgate/before-after.png` (trước = cuối vòng kit, sau = vòng này, cùng camera), lưới cận cảnh `a2x-closeups-webgl.png`,
  `a2x-closeups-webgpu.png`, các khung camera `a2x-beats-webgl.png`, `a2x-beats-webgpu.png`, ảnh lớn `a2x-*-c-vault / c-terrace / c-dike.png`.
- **Còn mở:** đoạn tường của cửa hầm thấp hơn tường hai bên 0,55 m (2,8 so với 3,35 m: đúng cỡ đề bài của từng model); mặt A21.2 là các tấm rời
  trước một khung (QA), nhìn sát mép có thể thấy khe; đống than bùn vẫn dẹt.

### Sửa sau review a2x vòng 1 (2026-10-23)

- **Tường sân và cửa hầm chặn đúng mặt thấy được (F-a).** Trước đây N01 và N02 không có `blockers` nên chặn theo cả khung bao của GLB. Ở tầm
  đi, vùng chặn nhô ra trước mặt đá lửa ≈ 0,43 m dọc cả bốn đoạn tường, bậc thềm cửa hầm thêm 0,19 m: một bức tường vô hình quanh sân.
- **Đo lại trên GLB:** mặt đá lửa A21.2 ở z +0,09 (99 % điểm ở tầm đi ≤ +0,10; đá góc và khung lỗ thoát nước ≤ +0,13). Thứ nhô tới +0,25 trong
  dải đi chỉ là ba bụi dương xỉ ở chân tường (màu ô liu, cao tới ≈ 0,8 m), không phải tấm đá. Vì vậy khối chặn review đề xuất
  (`[[0, -0.06, 4.0, 0.62]]`, mặt trước +0,25) vẫn đứng cách mặt đá 0,25 m; nay mặt trước đặt ở mặt đá.
- **N02:** `blockers: [[0, -0.122, 4.0, 0.484]]` (z −0,364…+0,12; dựng ×1,55).
- **N01:** ba hình chữ nhật, mặt sau đều ở mặt sau khung bao (−0,536): đoạn tường cả bề rộng tới +0,12 (mặt đá +0,07…+0,09), khung vòm
  (x −1,2…+1,12) tới +0,21 (mặt trụ vòm +0,17…+0,19), bậc thềm cao 0,16 m (x −0,8…+0,75) tới +0,38 (mép bậc +0,30…+0,41). Dương xỉ ở chân
  tường và chân cửa đi xuyên như mọi cây thấp.
- **Kết quả (lưới 0,05 m từ điểm xuất phát `terrace`):** nhân vật dừng cách mặt A21.2 0,07–0,09 m (trước 0,42–0,44), cách đoạn tường của cửa
  0,03–0,06 m (trước 0,43–0,46), cách mép bậc thềm −0,02…+0,05 m (trước 0,13–0,20). Lychgate vẫn là lối duy nhất vào nghĩa trang, đỉnh đồi vẫn
  không tới được khi chặn cổng (test cũ xanh); số ô đi được từ `terrace` (lưới 1 m đầy đủ) không đổi: 24 611.
- **Test mới** (`act1-outdoor.test.mjs`, "review a2x F-a"): lấy mặt thấy được đo trên GLB (trung vị mặt đá ở 0,8–1,7 m, hoặc mép bậc thềm), đi ra
  theo pháp tuyến tới ô đi được đầu tiên; khoảng hở giữa thân nhân vật và mặt phải ≤ 0,12 m, không lấn vào mặt quá 0,04 m. Bỏ 1,2 m ở hai đầu mỗi
  module: ở góc hai tường, lưới sàn 0,5 m làm tròn hai lỗ chặn vào nhau thêm ≈ 0,1 m. Với khung bao cũ test này trượt (khoảng hở 0,42–0,46 m).
- **Kiểm tra:** `node --test "scripts/act1-*.test.mjs"` 124/124, `node scripts/check.mjs` đạt. Va chạm không đổi hình nên không chụp lại; ảnh
  `a2x-*-c-vault.png` vẫn đúng.

**Sáng hơn (2026-10-23):** `day`: `hemi` 1.75 → 2.3, `envI` 0.3 → 0.4, `exposure` 0.35 → 0.75; `night`: `hemi` 1.8 → 2.2, `envI` 0.1 → 0.12, `exposure` 1.25 → 1.5 — khung mặc định sáng hơn ≈ +32 % (Prologue đêm +28 %), không thêm điểm cháy; ảnh `shots/lychgate/bright-before-after.png`, số đo `tmp/act1-base-maps/BRIGHTNESS.md`.
