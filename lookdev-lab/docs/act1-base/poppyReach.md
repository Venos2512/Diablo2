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
- **Bậc lên đồi (sửa sau review r2):** model có bảy bậc sâu ≈ 0,52 m, cao 0,2–0,3 m, rồi chiếu nghỉ cao 1,8 m (sân hospice cao hơn 0,2 m phía sau). Trước đây dốc địa hình là một đường thẳng đi qua mép các bậc, nên nằm cao hơn mặt mỗi bậc ở khoảng giữa hai mép: cỏ trùm lên bậc, chỉ còn thấy vệt mép bậc, chiếu nghỉ thành cỏ. Nay:
  - **Địa hình** hạ xuống dưới model: thấp hơn mặt mọi bậc ≥ 0,12 m (kể cả hai bên bậc, vốn lùi vào và thấp hơn giữa bậc), thấp hơn chiếu nghỉ ≥ 0,25 m, ≥ 6 cm ở hai góc sau chiếu nghỉ, nơi đất lên lại mặt sân. Trước bậc đầu, đất vẫn phẳng như cũ.
  - **Dốc ẩn để đi:** người chơi đi trên hai lối ẩn (`hidden: true`, giống lối ván dưới sàn bến ở fens): `steps` là một dốc chạy qua mép các bậc, `stepsLanding` là sàn phẳng trên chiếu nghỉ. Dốc bắt đầu từ mặt đất 0,35 m trước bậc đầu, thấp hơn mép bậc tối đa 0,1 m, cao hơn mặt bậc tối đa một bậc (0,27 m ở cuối bậc). Hai lối có đầu vuông (`caps: false`, tùy chọn mới của engine): lối ván thường có hai đầu tròn, và đầu tròn ở chân dốc sẽ khoét một lỗ trên sàn đi của Play ngay trước bậc đầu. Mỗi lối chỉ rộng bằng phần lối còn trống: 2,96 m giữa hai má bậc, 2,4 m giữa hai chân trụ. Lý do: Play chỉ nhận ra khối chặn qua các mặt tường của nó, nên nếu có sàn chạy vào trong khối chặn thì ô ở đó bị coi là đi được. Sàn dốc ẩn được cắt thành từng khúc ≤ 0,4 m, để mặt bên của nó không thành tường vô hình dọc mép dốc. Bước chân trên dốc kêu tiếng đá, không phải tiếng gỗ.
  - **Chặn thêm** chân trụ và chậu hoa hai bên chiếu nghỉ (cao 0,4–1,3 m trên chiếu nghỉ, trước đây đi xuyên được). Lối giữa trên chiếu nghỉ còn rộng ≈ 2,4 m; hai má bậc vẫn chặn.
  - **Test mới:** bắn tia vào GLB ở ≈ 1900 điểm trên mặt bậc và chiếu nghỉ. Địa hình luôn thấp hơn mặt bậc. Ở mọi điểm không bị chặn, mặt đi nằm trong khoảng −0,15…+0,32 m so với mặt bậc. Không ô 1 m nào có sàn ẩn nằm trong khối chặn. Test cũ đi từ chân bậc lên sân vẫn đạt.
  - **Kiểm trong trình duyệt** (WebGL, va chạm thật của Play, loang ô như `buildNav`): đi được từ chân bậc lên sân; độ cao mặt đi trên bậc khớp lưới test trong 1 cm; 110/110 ô quanh bậc giống hệt lưới test.
- **Ánh sáng:** ánh cửa sổ ấm đứng yên nằm trên chính ô cửa sáng của dãy A18.4 (hàng trên). Đốm nến hốc tường đứng ngay trước mặt tường, nhìn từ camera rơi vào lòng hốc. Sau review r2, đốm nến nằm đúng độ cao cây nến của từng đoạn tường: đáy đoạn + 1,5 m × hệ số kéo cao của đoạn (`yOn`). Bốn đoạn cạnh bậc đứng trên đất thấp nhất của chúng và được kéo cao ×1,17 để tường vẫn che sân. Trước đây độ cao đốm đo từ mặt đất trước tường, nên hai hốc sát bậc thấp 0,45 m, nằm dưới bậu hốc. Đèn thật `nicheReal` cũng lên đúng độ cao nến.
- **Hiệu năng (1600 × 900, khung tổng thể; trung vị 2–5 lần tải trang mới; trước = các id đã thay ép về blockout, sau = bản hiện tại; "khung" = 30 khung chạy liền có chờ GPU, tức CPU hoặc GPU, bên nào chậm hơn):** WebGL: khung 2,73 → 2,52 ms, GPU 2,65 → 2,14 ms (số trước dao động 2,09–3,00); WebGPU: khung 5,96 → 6,79 ms, GPU 4,02 → 4,16 ms (khung `steps` 6,09 → 6,77 ms, GPU 4,37 → 4,61 ms: WebGPU nặng hơn chút ít, chủ yếu ở phía CPU). Draw call 72 → 72 (WebGPU 71 → 71), tam giác 2,99 → 3,24 triệu (cánh đồng anh túc vẫn là phần nặng nhất).
- **Bộ nhớ texture (ước tính RGBA8 + mip, chưa nén, như nhau ở hai backend):** ≈ 208 MB → 528 MB (map 2048 px) → 432 MB sau `TEX_1024` (xe bò A18.1, giường A18.2, tường hốc nến A18.5 ×20; bớt 96 MB, vẫn hơn blockout 224 MB). Miệng mỏ, dãy ward, bậc lên đồi giữ 2048.
- **Ảnh:** `shots/poppyReach/before-after.png`, cận cảnh `shots/poppyReach/swap-webgl-c-*.png`, WebGPU `shots/poppyReach/swap-webgpu-*.png`. Sau review r2 chụp lại (cả WebGL và WebGPU): `swap-*-c-steps.png`, `swap-webgpu-steps.png`, thêm `swap-*-c-stepsfront.png` (nhìn thẳng bậc); dựng lại `before-after.png` với khung `steps` mới (bậc → tường hốc nến → cửa sổ ấm).

## Vòng thay kit A01–A14 (2026-10-22)

Thay blockout và kit tạm A01–A08 bằng bộ model Act I mới (`assets/act1-kit/`, bảng `tmp/act1-base-maps/ACT1_KIT_FIT.md`); làm xong 2026-10-23.

- **Model thật (GLB, đúng cỡ, chỉ dùng `scale` của điểm đặt):** tường đá khô A08.2 (299 module), đống rơm A08.4 (×6), giá phơi anh túc A08.6 (×4, ×0,9,
  đầu anh túc đỏ; thay giá phơi thảo dược kit tạm), liễu non A04.2 (×5, chỉ gốc chặn).
- **Tường đá khô:** model dài 3,2 m nhưng chỉ cao 0,84 m (đọc quá thấp cho hẻm tường), nên mọi đường tường đặt ×1,25 (dài 4 m, cao 1,05 m). Đầu đá
  của model hụt 0,02–0,19 m so với khung, nên module cách nhau 3,5 m (def `module: 2,8`) cho đầu đá chồng lên nhau, không hở (ảnh đầu tiên bị hở
  từng khúc). Chỉ lõi đá chặn (sâu 0,75 m, blockout cũ 0,7 m); chân cỏ đi xuyên. Trên dốc vẫn như cũ: module đứng trên chỗ thấp nhất và cao tới
  đất phía trên + 0,63 m.
- **Giữ blockout (lý do ghi trong def):**
  - Bậc trèo A08.2-stile: model không có khe, tường chạy liền (đỉnh 0,6–0,89 m). Map cần khe 1,8 m đi qua được; model có thể dùng làm module tường thứ hai sau này.
  - Cổng ruộng A08.5: cánh cổng của model đóng kín. Các cổng của map mở ra ruộng, 3,2 m giữa hai trụ, và lối chạy qua đó.
  - Nhà trại A08.3: model là nhà kín, cửa đóng ở đầu hồi phía đông, mái nguyên, bên trong là vỏ rỗng không có sàn.
    - Nhịp "giường trống nhìn từ trên xuống" cần mái sập, và lối của đoạn farm đi vào nhà tới V1.
    - Một bản cắt mái theo độ cao vẫn không có cửa vào, và tường một mặt sẽ lộ ra từ bên trong.
    - Nên giữ blockout cho tới khi có model nhà trại đổ nát (đề xuất: hàng Tripo mới, mái đông sập, cửa mở ở mặt dài).
- **Đi lại:** mọi lối của các đoạn vẫn đi được (test lối Play); khe bậc trèo và các cổng mở vẫn đi qua được (test mới); bậc A18.6 không đổi.
- **Ánh sáng:** không đổi (các model mới không có đèn).
- **Kiểm tra:** `node --test "scripts/act1-*.test.mjs"` 101/101, `node scripts/check.mjs` đạt.
- **Hiệu năng (1600 × 900, trung vị 2 lần tải trang mới sau một lần tải bỏ đi; trước = bản trước vòng này):**
  - Số tam giác: 3,24 → 5,83 triệu ở khung tổng thể. Riêng 299 module tường ≈ 2,6 triệu (8 606 tam giác mỗi module 3,2 m).
  - WebGL: GPU 2,82 → 2,62 ms ở khung tổng thể, 2,35 → 2,70 ms ở remember, 2,73 → 2,75 ms ở bậc; khung tổng thể 3,66 → 3,20 ms.
  - WebGPU: GPU gần như cũ (tổng thể 3,94 → 3,87 ms; bậc 4,47 → 4,93 ms), nhưng thời gian khung tăng (tổng thể 6,1 → 8,5 ms; bậc 6,8 → 8,4 ms).
    Rất có thể do bóng đổ của tường, phần không nằm trong đồng hồ GPU.
  - Cần một bản tường giảm lưới (≈ 2 000 tam giác) trước khi làm bản game.
- **Bộ nhớ texture (ước tính RGBA8 + mip, chưa nén):** 432 MB → 445 MB (45 → 52 texture; tường dùng chung một GLB 1024 px).
- **Ảnh:**
  - `shots/poppyReach/before-after.png`: trước = bản vòng thay model A15–A20, sau = vòng này, cùng camera.
  - Lưới cận cảnh: `kit-closeups-webgl.png`, `kit-closeups-webgpu.png`.
  - Các khung camera WebGPU: `kit-beats-webgpu.png`.
  - Ảnh lớn: `kit-*-c-walls / c-racks / c-ricks.png`.
- **Còn mở:** tam giác của tường (ở trên); ba blockout ở trên chờ model mới. (Màu tường quá sáng đã sửa, xem mục dưới.)

### Sửa sau review kit r1 (2026-10-23)

- **Tường gần như trắng (review mục 3):** mặt trên của đá tường A08.2 màu kem nhạt có địa y, dưới nắng đọc gần như trắng và là thứ sáng nhất trong
  mọi khung hình, trái luật art direction "không có màu trắng sạch, trừ vải lanh của Mercy" (đồ người làm phải trông cũ). Màu nền của model được
  chỉnh ngay lúc chuẩn bị: kéo 30 % về xám rồi nhân khoảng 0,7 (R 0,68, G 0,71, B 0,69: hơi ngả xám xanh), thành đá vôi xám cũ, địa y vẫn còn.
  Làm bằng bảng TINT mới trong `scripts/prepare-act1-kit.py`, chỉ cho A08.2 và bậc trèo A08.2-stile (cùng loại đá, bản đồ chưa dùng); mọi GLB
  khác, samples.json và giấy phép không đổi byte nào.
- **Ảnh:** chụp lại cả bản đồ trên hai backend: `before-after.png` (cột sau: lane, upper, fold …), `kit-closeups-webgl.png`,
  `kit-closeups-webgpu.png`, `kit-beats-webgpu.png`, ảnh lớn `kit-*-c-walls / c-racks / c-ricks.png`; so sánh trước / sau của riêng màu tường:
  `kit-fix-walls.png`.

## Vòng thay A21–A25 (2026-10-23)

Bốn chỗ giữ chỗ (chỉ có trong LD) của Poppy Reach nay là model A22–A23 thật (`assets/act1-kit/`, bảng `tmp/act1-base-maps/ACT1_KIT_FIT.md` mục
"A21–A25"); thêm đôi giày A22.1 dưới gốc cây táo gai.

- **Ụ đá người gặt N-PR02 → A22.4** (thay hòn đá kit tạm): ụ đá tròn, phiến đá tên tựa ở mặt trước, que buộc ruy băng trên đỉnh (1,32 m); vẫn dưới
  giá phơi, chặn cả khối (1,2 × 1,34 m).
- **Gậy chăn cừu và áo gấp N-PR03 → A22.5** trong chuồng cừu bỏ trống. Sau review chỉ cây gậy chặn, áo gấp vẫn đi xuyên (mục "Sửa sau
  review a2x" bên dưới).
- **Búp bê rơm N-PR05 → A22.6** trên bậc của lối qua tường (vẫn +0,24 m); chân búp bê duỗi ra trước 0,17 m.
- **Cây táo gai ruy băng N-PR04 → A23.2:** gốc cây lệch 1,4 m khỏi tâm model và cây dựng ra nghiêng về phía tây (blockout nghiêng về phía đông).
  Cây được đặt sao cho gốc đứng đúng điểm rite 4 và xoay 200°: tán nghiêng về đông-đông nam, xuôi theo gió của khói ngủ (1, −0,15) như blockout, camera
  game nhìn từ sau-phải nên thấy rõ thân, dáng nghiêng và ruy băng. Đã thử −135° (nghiêng đúng hướng đông) nhưng từ camera game cây chỉ còn là một chồng
  tán. Trên dốc cây đứng cao hơn đất ở tâm 0,15 m: không đầu rễ nào lơ lửng, gốc vùi 0,10 m. Chỉ thân cây chặn (ô 0,6 m ở gốc + ô 1,0 m chỗ thân ngả
  ra ở 0,8 m); cành và ruy băng dưới 2 m đi xuyên được.
- **Đôi giày A22.1 (def mới, cùng model với N-FN02 của fens):** đặt 1,6 m về phía đông của gốc, dưới tán (không có phần nào của cây thấp hơn 2,2 m
  ở đó), mũi giày quay vào gốc; camera ở góc 30–55° vẫn nhìn thấy.
- **Giữ blockout:** ụ lúa bỏ dở N-PR01 (model A23.1 phải làm lại: lưỡi hái lơ lửng, cái bình treo trên cán, không còn hoa anh túc).
- **Đi lại:** mọi route xanh; số ô đi được từ `landing` không đổi (39 589). **Ánh sáng:** không đổi.
- **Kiểm tra:** `node --test "scripts/act1-*.test.mjs"` 121/121, `node scripts/check.mjs` đạt. Test mới: mọi def GLB mới trỏ đúng sample có file,
  N-PR01 vẫn là blockout; cây táo gai: gốc đúng điểm rite (±5 cm), đỉnh tán nghiêng xuôi gió (trong 40°), đầu rễ không lơ lửng, chỉ thân chặn, giày
  không nằm dưới rễ hay cành thấp, lối mòn tới được giày.
- **Hiệu năng (1600 × 900, trung bình 2 lần tải trang mới sau một lần tải bỏ đi):** WebGL GPU tổng thể 2,67 → 2,49 ms, `remember` 2,27 → 2,50,
  bậc thang 2,81 → 2,73 ms; 5,83 → 5,88 triệu tam giác. WebGPU GPU 4,33 → 4,29 / 3,19 → 3,11 / 4,87 → 4,80 ms. **Bộ nhớ texture:** 445 → 494 MB
  (52 → 61 texture).
- **Ảnh:** `shots/poppyReach/before-after.png`, `a2x-closeups-webgl.png`, `a2x-closeups-webgpu.png`, `a2x-beats-webgl.png`, `a2x-beats-webgpu.png`,
  ảnh lớn `a2x-*-c-thorn / c-thornE / c-shoesE.png`.
- **Còn mở:** tán A23.2 là các khối mượt, mặt sau ít ruy băng (QA); cây nghiêng lệch hướng gió ≈ 35° (chọn để cây đọc rõ từ camera game); ụ lúa A23.1
  chờ model mới.

### Sửa sau review a2x vòng 1 (2026-10-23)

- **Gậy chăn cừu N-PR03 chặn (F-c).** Trước đây đi xuyên được (`collide: false`), nên nhân vật đi xuyên qua cây gậy cao 1,6 m. Nay def có
  `blockers: [[0.08, -0.12, 0.3, 0.3]]`: một ô 0,3 × 0,3 m quanh thân gậy (GLB x −0,07…+0,23, z −0,27…+0,03; thân nghiêng từ (0,15; −0,09) ở
  0,55 m lên (−0,02; −0,15) ở 1,2 m, móc gậy vươn tới x +0,31 ở 1,3–1,6 m). Áo gấp vẫn đi xuyên.
- **Test mới** ("review a2x F-c"): đúng một khối chặn 0,3 × 0,3 m; 85 % vertex của gậy ở 0,55–1,7 m nằm trong khối, mọi vertex cách khối
  ≤ 0,1 m; rite 3 vẫn tới được từ điểm xuất phát `east`. Mọi lối khác vẫn xanh.
- **Kiểm tra:** `node --test "scripts/act1-*.test.mjs"` 124/124, `node scripts/check.mjs` đạt.

**Sáng hơn (2026-10-23):** `day`: `hemi` 2.0 → 2.6, `sun.intensity` 0.32 → 0.36, `envI` 0.34 → 0.48, `exposure` 0.52 → 0.8 — sáng hơn ≈ +30 %, tường vôi hospice trắng sạch hơn (cháy sáng ở khung `steps` +0,08 điểm %); ảnh `shots/poppyReach/bright-before-after.png`, số đo `tmp/act1-base-maps/BRIGHTNESS.md`.
