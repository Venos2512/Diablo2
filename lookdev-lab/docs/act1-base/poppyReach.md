# Base map 3 · `act1PoppyReach` — The Poppy Reach (LD 11.6), BIO-02

Scene **ASHLAR · Act I · base · Poppy Reach** (`?scene=act1PoppyReach`, thêm `&renderer=webgpu`). Plan: `src/env/act1/maps/poppyReach.js` · engine ngoài trời `src/env/act1/outdoor.js` → `outdoorBuild.js` + `blockout.js`, phần đồng cỏ / khói ngủ / đất ngoài biên ở `src/env/act1/meadow.js` (thuần) + `meadowBuild.js` (THREE) → `src/scenes/act1Outdoor.js`. Mặt bằng 2D: `docs/act1-base/poppyReach-plan.png`. Ảnh: `docs/act1-base/shots/poppyReach/`. Asset còn thiếu: `docs/act1-base/ASSETS.md`. Spec: `tmp/act1-base-maps/SPEC.md` §3 map 3; artdirection §10.2 mục 5. Trạng thái: **base map / đề xuất**, chưa duyệt (2026-10-22).

## Đã dựng

- **Địa hình** 200 × 256 m, ô 0,5 m: sườn nam của đồi Gentle House, **leo thẳng ~15 %** từ nước đen dưới chân (0,6 m) lên sân hospice (32,2 m), có một lòng chảo nông ở giữa — **lõm**, nên từ chân dốc thấy cả cánh đồng dâng lên tới cửa sổ ấm (đồi lồi sẽ che đỉnh; đường nhìn chân dốc → cửa sổ cách mặt đất ≥ 1,8 m). Gò phấn của Flint Delvings ở sườn đông. Dưới chân: dải đầm đen (bậc lội rồi tụt sâu, Play không lội quá 0,6 m), **đê từ Rook's Weir** cập bờ, cọc bến, liễu non, lau sậy. **Đất ngoài biên chạy tiếp** (`far.apron`: vòng lưới dùng chính vật liệu địa hình, mép trong trùng nút biên của địa hình, normal chung): đồi đi tiếp sang hai bên và lên đỉnh, rồi chìm xuống nước đầm ở xa — map không có mép cắt.
- **Mặt đất** 8 layer (splat 896² trên 256 m): `BIO02_meadow` (nền, chạy tiếp ra ngoài biên) · `DW_sparse` (viền lối, sườn trên) · `DW_dense` (chân tường, bờ đầm) · `DW_dirt` + `BIO03_flint` (lối đất, vệt đá lửa vụn trong rãnh bánh xe — sáng hơn, vẫn "lặng") · `BIO03_flint` (sân trại, ngưỡng cổng / stile) · `BIO06_flint_spoil` (đất phấn-đá lửa ở miệng mỏ) · `BIO05_lime` (sân hospice) · `DW_mud` (bờ đầm, đê). Ra tới biên chỉ còn lớp nền (để apron nối liền).
- **Cánh đồng** (A08.1, procedural): ~**34 000 cụm anh túc** (6–8 thân, đầu hoa hình chén đỏ `#B3262A` quanh nhuỵ tối, có nụ; 3 biến thể instanced, tint từng cụm) theo **25 đám** có viền mềm lượn và **khoảng thở** (mảng fBm) — không phải nhiễu; ~11 000 cụm chạy tiếp ra ngoài biên; **~30 000 khóm cỏ xám-xanh** (thẻ cỏ Dark Wood). Lối đi, chân tường, nước, sân hospice, hõm người nằm ở Rite 1 được **để trống**. Cỏ và hoa lắc theo gió (hiệu ứng wind của lab, trên GPU), bị chân nhân vật vạch ra. Bật/tắt chung với *Cỏ / lau sậy (thẻ procedural)*.
- **Tường đá khô làm lối**: 4 tường đồng mức (W1–W4) chỉ hở ở **4 cổng ruộng giữa hai trụ đá** (A08.5, cánh cổng mở vào ruộng) và **1 stile** (A08.2-stile, khe 1,8 m), 2 **hẻm tường** (G2 → trại, G4 → ruộng trên), 2 tường chia ruộng, **chuồng cừu tròn** — 327 module A08.2 (trên dốc mỗi module đứng ở chân thấp, thành bậc).
- **Trại**: nhà trại bỏ hoang (A08.3) **mái sập nửa đông** (chỉ còn rui) nên từ trên nhìn thấy **ba giường trống, mỗi giường một gối sạch** (A18.2, vải lanh của Mercy `#E4E0D6`); cửa 1,8 m đi vào được; sân lát đá lửa, giá phơi anh túc (A08.6), đống rơm (A08.4), máng nước / bao hạt / xe cút kít / rơm vãi (kit tạm).
- **Ruộng dưới**: **xe bò bỏ lại còn chăn đệm và một gối sạch** (A18.1), đống rơm, giá phơi. **Ruộng trên**: cây táo gai buộc ruy băng, **chiếc giường kéo ra giữa đồng hoa** (không đánh dấu).
- **Miệng mỏ Flint Delvings** (A18.3 blockout: vách phấn có cục đá lửa, cửa tối đi vào được 2,1 m, đống đất đá, cuốc sừng) + **khung gỗ GLB** `dungeon-prop-mine-timber` + **đá lửa GLB** `dungeon-prop-flint-boulders` — lối phụ sang 11.8 (BIO-06).
- **Đỉnh**: **bậc lên đồi** A18.6 (8 bậc sạch, 2 m / 5 m, chậu hoa đỏ / kem) qua **tường vôi** A18.5 (liền, không vá; **mỗi đoạn một hốc nến đứng yên** — hàng nguồn sáng giống nhau xếp hàng = ánh sáng Perfection), sân vôi sạch, **dãy ward** A18.4 (30 × 9 m, vôi mới, mái đá đen, hai tầng cửa sổ giống hệt, **một cửa sổ cao ấm và đứng yên** = ảnh của act).
- **Khói ngủ là địa hình** (đề xuất LD): 5 vùng (Z1–Z5) — mỗi vùng là chồng lát ngang viền mềm + màn bao quanh nhạt dần lên trên, nghiêng theo dốc: **viền rõ, tint đều, ấm nhẹ**; **thở qua lại theo gió** (±6,5–9 m, chu kỳ 64–100 s) nên **lúc đóng lúc mở lối** (test: mỗi vùng phủ 9–15 m lối rồi trả lối trống 0 m). Tab Environment → **Khói ngủ (địa hình)**: *Hiện khói ngủ* · *Tốc độ trôi (× gió)* 0–4 · *Nhãn: đứng trong → chậm dần → ngủ* (nhãn đi theo từng vùng) + điểm đánh dấu K1 (vignette). Chậm / ngủ trong Play chưa làm (chỉ đánh dấu).
- **Ngữ pháp ánh sáng**: không có ánh sáng người (trại bỏ hoang); chỉ **ánh sáng Perfection, đứng yên**: cửa sổ ward (đèn điểm thật + quầng lớn ở lớp VFX, đọc được qua sương) và 14 hốc nến (quầng tĩnh) + 1 đèn điểm tĩnh cạnh bậc. 2 đèn thật / 8.

## Đoạn, điểm xuất phát (Play), nhịp

| Điểm xuất phát | Tuyến kiểm |
|---|---|
| Chân dốc · bến đê từ Rook's Weir | đê → cổng G1 → lối tới Rite 1 và về → ruộng dưới → cổng G2 → đầu hẻm |
| Hẻm tường đá · nhà trại | hẻm → sân trại → **vào nhà, tới giường** → stile S1 → ruộng giữa |
| Ruộng giữa · khói ngủ | stile ↔ ruộng giữa → cổng G4 → hẻm trên |
| Lối đông · chuồng cừu (cổng G3) | G3 → chuồng cừu (vào trong) → lối đông xuống hẻm |
| Miệng mỏ Flint Delvings | lối mỏ → **vào cửa mỏ** → lối đông → nhập đường chính |
| Ruộng trên · bậc lên Gentle House | **lên bậc tới sân hospice** → lối cây gai → giường giữa đồng |

Nhịp mở / hẹp dọc đường chính (marker `beat`, test kiểm xen kẽ): cổng G1 (hẹp) → ruộng dưới (mở) → hẻm tường (hẹp) → sân trại (mở nhỏ) → stile S1 (hẹp) → ruộng giữa + khói (mở) → G4 + hẻm trên (hẹp) → ruộng trên (mở) → bậc (hẹp). Lát cắt này có ~300 m đường (~55 s chạy) nên mỗi nhịp chỉ 5–15 s; bản đầy đủ đề xuất ~520 m, nhịp 40–60 s (`target` trong plan).

17 khung: toàn cảnh, **REMEMBER** (mắt người ở ruộng dưới nhìn lên cửa sổ ấm), bến đê, ruộng dưới, xe bò, hẻm, nhà trại (nhìn qua mái sập), sân trại, khói ngủ, chuồng cừu, miệng mỏ, cây gai, ruộng trên, giường giữa đồng, bậc + tường + ward, nhìn từ sân hospice xuống.

Chạm trán (quái thay thế mang tên mã ASHLAR): E1 W03 ×4 · E2 P04 ×2 + P03 ×6 · E3 F02 + W03 ×3 · E4 P02 + P03 ×5 (trong khói) · E5 W03 ×4 + F02 · E6 P04 ×2 + P03 ×4 · E7 W03 ×5 · E8 P02 + F02 + P03 ×6 (dưới bậc). Rite: R1 ruộng gặt bỏ dở (hõm hình người trong hoa) · R2 mộ đá người phơi hoa dưới giá phơi · R3 chuồng cừu bỏ trống (gậy + áo gấp) · R4 cây táo gai buộc ruy băng (đôi giày). Vignette không đánh dấu: giường giữa đồng · búp bê rơm trên bậc stile. Lối ra: ← Rook's Weir (đê) · → Flint Delvings · → Gentle House (đầu bậc).

## Thẻ mood (artdirection §2.1 — đề xuất)

| Trường | Nội dung |
|---|---|
| Map | The Poppy Reach (11.6), BIO-02, `?scene=act1PoppyReach` |
| Mood mục tiêu | *Muốn nằm xuống trong nó*: ngọt, buồn ngủ, bỏ hoang; nguy hiểm là muốn ở lại. |
| Palette | Cỏ xám-xanh `#5E6B5A`, sương `#A9B1A6`; **accent mạnh nhất act: đỏ anh túc `#B3262A`** (cả cánh đồng); trắng sạch chỉ ở vải lanh (gối) và vôi hospice; ánh nến `#E0A050` không có (trại bỏ hoang). |
| Lighting & thời tiết | **Poppy Reach · ngày u ám** (mặc định): trời phủ mây mềm, **không nắng**, không bóng, không mưa; sương độ cao dày ở chân dốc (đầm), mỏng dần lên đỉnh (đỉnh rõ); sương thấp trên đầm; khói ngủ tint ấm nhẹ. **Soi texture · sáng đều**. |
| Tương phản & value | Đồng đỏ trên nền xám-xanh trung bình; lối đất tối hơn, trống; công trình người làm nâu xám; vôi hospice sáng nhất khung trừ cửa sổ ấm. |
| Nhịp | Nước đen → cổng ruộng → biển hoa đỏ → hẻm tường + trại bỏ hoang (giường trống) → ruộng khói ngủ → hẻm trên → ruộng trên dưới tường vôi → bậc sạch, hàng nến đứng yên, cửa sổ ấm. |
| Trạng thái | Đề xuất / base map (2026-10-22). |
| Chưa khoá | Mật độ và cỡ đầu hoa cho camera thật; tint / độ đặc khói; mức sương; độ dài đầy đủ (đề xuất 520 m). |

## Kiểm chứng (2026-10-22)

- `node --test scripts/act1-outdoor.test.mjs`: 6 test của map này đều đạt (plan hợp lệ, hợp đồng §6b, mặt nạ hữu hạn + tất định, 6 điểm xuất phát + mọi tuyến đi được trên lưới kiểu Play, **không lội quá 0,7 m** trên lưới toàn map từ mọi điểm xuất phát, chạm trán chỉ ở wild, nước có nước). `node --test scripts/act1-meadow.test.mjs`: **4/4** (khói thở theo gió và lặp theo chu kỳ; apron khớp địa hình ở biên, mặt quay lên, chìm xuống nước ngoài đồi; cánh đồng tất định, theo mật độ, **≤ 0,1 % cụm hoa trong 0,3 m mép lối**, không cụm nào trong nước; brief: 4 rite khác cảnh, vignette không đánh dấu, cửa sổ ấm Perfection đứng yên thấy từ chân dốc, 3 lối ra, **mỗi vùng khói đóng (≥ 3 m) và mở (0 m) lối**, nhịp xen kẽ, lên bậc tới sân +2 m).
- **WebGL2** (Chrome, 1600 × 900): mở **không lỗi console** (chỉ `favicon.ico` 404 của server thử). Dựng scene 2,2–2,5 s (đánh giá plan 0,50–0,58 s · thư viện texture 0,31–0,50 s · splat 0,61–0,75 s · dựng 0,59–0,77 s, trong đó đồng cỏ + apron + khói 0,26–0,33 s); trang → sẵn sàng 4,1–5,5 s. Burst 2,3–2,9 ms/khung, GPU 2,3–2,8 ms, 48–73 draw call, ~3,0 M tam giác (cánh đồng ~2,3 M).
- **WebGPU** (smoke): mở được, chỉ cảnh báo chung `powerPreference` của Chrome; sẵn sàng ~6 s (lần đầu với profile mới ~15 s: biên dịch pipeline); burst 5,2–6,7 ms (CPU), GPU 3,2–4,5 ms, 55–72 draw call. Khói, cánh đồng, cửa sổ ấm giống WebGL2. Ảnh `shots/poppyReach/webgpu-01-overview.png`, `webgpu-02-remember.png`, `webgpu-03-smoke.png`.
- **WebGPU A/B cánh đồng** (một lần tải, khung *Ruộng dưới*, 1600 × 900, thời gian đứng yên, `bench.abTest`: 3 vòng xen kẽ, burst 40 khung, trung vị): **có cánh đồng 6,78 ms/khung** (GPU 3,60 ms, 55 draw call, 2,98 M tam giác) · **ẩn cánh đồng 5,82 ms/khung** (GPU 2,82 ms, 48 draw call, 0,71 M tam giác) → cánh đồng (63 217 instance: cụm anh túc + khóm cỏ, 7 mesh) tốn **+0,96 ms burst** và **+0,79 ms GPU**.
- **Play** (WebGL2, quái tắt): từ cả 6 điểm xuất phát đi hết **86/86 chặng** (+1 chặng ngoài lưới 128 m), 0 lần kẹt, 0 lần rơi; lưới nav 7,3–15,3 nghìn ô dựng trong 14–39 ms.

## Còn thiếu / rủi ro

- Model: 19 mã blockout + 4 procedural + 5 kit tạm, 3 GLB thật (danh sách `ASSETS.md`). Texture còn thiếu: đất đồng anh túc (A05.4), atlas thẻ anh túc (mặt bên + mặt trên), tường đá khô, vôi liền + mái đá đen, vách phấn-đá lửa, rơm / rạ, vải lanh + chăn vá.
- Anh túc là mesh màu đỉnh tự dựng (đầu hoa phóng to cho camera D2); ~2,3 M tam giác — nặng nhất của map; giảm bằng `grassDensity` (mật độ ×) nếu máy yếu. Ở xa đồng đỏ đọc thành chấm; một atlas thẻ / lớp "thảm hoa" sẽ đẹp hơn ở toàn cảnh.
- Khói ngủ là placeholder (lát + màn, CPU cập nhật vài chục ma trận mỗi khung); chưa có shader thể tích, chưa có hiệu ứng chậm → ngủ trong Play, chưa nối khói với lư hương của Hush-Herald.
- Lối đất dùng `DW_dirt` / `DW_sparse` theo spec — tối hơn nền đồng nhiều, nên đã thêm vệt `BIO03_flint` trong rãnh; vẫn đọc như dải tối ở toàn cảnh.
- Ngoài biên phía đông-tây gần mặt nước có vài mép bờ lởm chởm (apron chạm mực nước); sương thấp placeholder.
- Ghi chú: không có NPC trong brief này; F02 Poppy Nurse dùng mô hình thay thế `imp_shaman` (trông ác — model thật phải hiền), P02 = `wraith`, W03 = `spider`, P04 = `zombie`, P03 = `bat`.

## Vòng thay model (2026-10-22)

- **Model thật (GLB):** xe bò A18.1, giường A18.2 (ba chiếc trong nhà trại ở ×0,85 để vừa nửa phòng phía đông, một chiếc ngoài ruộng ×1), miệng mỏ Flint Delvings A18.3 (×1,34), dãy ward A18.4, tường hốc nến A18.5 (cả hàng), bậc lên đồi A18.6 (×1,3). Kit tạm: giá phơi anh túc A08.6 → giá phơi thảo dược, ụ đá N-PR02 → đá thấp, cọc bến N-PR11 → cặp cọc gãy ×1,2. Giữ blockout: đống lúa bỏ dở N-PR01.
- **Miệng mỏ:** cửa của model là hốc vẽ, không phải đường hầm, nên cả gò chặn; khung gỗ `dungeon-prop-mine-timber` cũ bỏ đi (model có khung riêng); lối ra Flint Delvings là điểm kích ở mặt gò; lộ trình đoạn `mine` dừng ở mặt gò. Mặt sau trơn quay vào gò phấn.
- **Bậc lên đồi:** dốc địa hình dưới bậc được cắt lại theo đường bậc của model rồi phẳng ở chiếu nghỉ 1,82 m (sân hospice cao hơn 0,18 m phía sau); hai má bậc chặn, giữa đi được (test mới đi từ chân bậc lên sân).
- **Ánh sáng:** ánh cửa sổ ấm đứng yên nằm trên chính ô cửa sáng của dãy A18.4 (hàng trên); đốm nến hốc tường đứng ngay trước mặt tường, nhìn từ camera rơi vào lòng hốc.
- **Hiệu năng (1600 × 900, khung tổng thể; trung vị 2–5 lần tải trang mới; trước = các id đã thay ép về blockout, sau = bản hiện tại; "khung" = 30 khung chạy liền có chờ GPU, tức CPU hoặc GPU, bên nào chậm hơn):** WebGL: khung 2,73 → 2,52 ms, GPU 2,65 → 2,14 ms (số trước dao động 2,09–3,00); WebGPU: khung 5,96 → 6,79 ms, GPU 4,02 → 4,16 ms (khung `steps` 6,09 → 6,77 ms, GPU 4,37 → 4,61 ms: WebGPU nặng hơn chút ít, chủ yếu ở phía CPU). Draw call 72 → 72 (WebGPU 71 → 71), tam giác 2,99 → 3,24 triệu (cánh đồng anh túc vẫn là phần nặng nhất).
- **Bộ nhớ texture (ước tính RGBA8 + mip, chưa nén, như nhau ở hai backend):** ≈ 208 MB → 528 MB (map 2048 px) → 432 MB sau `TEX_1024` (xe bò A18.1, giường A18.2, tường hốc nến A18.5 ×20; bớt 96 MB, vẫn hơn blockout 224 MB). Miệng mỏ, dãy ward, bậc lên đồi giữ 2048.
- **Ảnh:** `shots/poppyReach/before-after.png`, cận cảnh `shots/poppyReach/swap-webgl-c-*.png`, WebGPU `shots/poppyReach/swap-webgpu-*.png`.
