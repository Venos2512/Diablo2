# ASHLAR · Act I · base · The Cradle (map 6, `act1Cradle`)

LD 11.12 · BIO-27 (cell Perfection của Mercy) · boss arena · D5 C4 · 20 phút. Mở bằng ô **Scene** → *ASHLAR · Act I · base · The Cradle* hoặc `?scene=act1Cradle` (thêm `&renderer=webgpu`).

Base map = bố cục, tỉ lệ, sàn, ánh sáng và các beat là thật; mọi model còn thiếu là **blockout đúng cỡ** (màu theo nhóm, SPEC §6b), quái trong Play là mô hình thay thế mang tên id ASHLAR.

## Bố cục (lát 44 × 70 m; độ dài đề xuất cho bản đầy đủ: ~160 m)

| Đoạn | Nội dung | Cỡ |
|---|---|---|
| **S1 · Cầu thang từ Garden of Hush** | Lối vào từ map 5: chiếu nghỉ y = 1.8 m, **9 bậc** (cao 0.18 m, sâu 0.56 m) xuống phía tây, tường đá hầm (tile `BIO27_vault`), **vòm gothic** 2.2 × 2.8 m mở ra lối đi, 1 mô-đun tường hầm GLB (`dungeon-prop-crypt-wall`) ở đầu cầu thang (đáy Garden of Hush), một đèn trắng sữa treo ở vòm | phòng 9 × 3 m |
| **S2 · Lối vào · dãy nôi** | Lối 8 m giữa hai dãy **cũi xương khổng lồ giống hệt nhau** (A14.1, cao 2H, cách 4.8 m, chân cũi quay ra lối), thảm lanh dẫn vào arena, đèn ngủ trắng sữa ở mép lối. Hai đầu lối là **void**: sàn chìm dần vào đen, dãy cũi (và một dãy ngoài) chạy tiếp vào sương đen — *giả vô hạn* (LD §7.6) | 8 × 38 m |
| **S3 · Arena · Hospice Mother** | Vòng ⌀ 32 m, viền void: 8 cũi + 8 cặp màn lanh quanh vòng, **10 đèn ngủ** (vòng r 12.5 m) là cơ chế boss, **bục chăn chần** (A14.5) dọn sẵn chăn lật + gối ở giữa, chuông xương treo (A14.4) trên bục, **nôi của Mercy** (cũi trên đế bập bênh A14.6) sau boss, 2 đế bập bênh nằm rời, cặp màn lanh ở cửa arena (đi xuyên qua vải). Ngoài vòng: vòng cũi thứ hai và đèn chỉ còn quầng, chìm vào đen | r 16 m |

**Hospice Mother (B05)**: blockout đúng sheet `B05_hospice_mother/vA/concept_r2.png` — khối vải lanh che mạng, đỉnh **2.75H = 4.95 m** (trong dải 2.50–3.00H của Quy chuẩn quái), **10 cánh tay** mềm, sải tay **3.00H = 5.4 m**, viền áo trong xám tím, một đèn ngủ hổ phách nhỏ ở hông (theo sheet). Đứng ở (0, −26.5), mặt về cửa arena. **8 bóng tay telegraph** trên sàn trước mặt boss (overlay; *xem thử nhịp đánh*: bóng mềm lớn và đậm dần ~1.6 s rồi một chớp trắng sữa = tay đập).

## Ánh sáng (ngữ pháp ánh sáng)

Toàn bộ là **ánh sáng Perfection**: đứng yên tuyệt đối, đều, nhiều nguồn giống hệt nhau xếp hàng; **không có ánh người** (ấm, lập lòe) nào trong Cradle. 15 đèn điểm / spot thật + đèn nhân vật = **16** (ngân sách forward shading: 10 đèn ngủ arena + 3 đèn lối + đèn vòm + 1 spot mềm từ trên cao là đèn đổ bóng duy nhất), đèn còn lại chỉ có quầng (sprite cộng trong lớp VFX, độ mờ thấp vì lớp VFX ghép theo alpha) + vũng sáng trên sàn. Màu trắng sữa `#F2ECDF` là **đề xuất** (canon chưa có hex; Quy chuẩn quái ghi đèn ngủ của B05 là `#E0A050` — mâu thuẫn còn mở, xem dưới). Hemisphere rất thấp là sàn tối thiểu; sương đen theo chiều cao + nền đen.

**Đèn ngủ còn lại** (tab Environment → *Ánh sáng Perfection*): thanh 0–10; đèn tắt dần (0.6 s) **từ phía sau boss về phía cửa** (cái gần cửa tắt sau cùng). Cùng với chúng, **bóng tối khép lại cả phòng**: spot mềm trên arena (`followGroup`, còn tối thiểu 6 %), quầng đèn của vòng nôi bên ngoài (`followGroup`, 8 %) và độ nâng sáng của chính scene (sàn ambient + vầng sáng ở khung camera xa, `ambient` 35 %) đi theo số đèn còn lại; đèn của lối vào thì không (đó không phải đèn của boss). Đo ở khung Arena (độ sáng trung bình vùng giữa, 0–255): 10/10 → 157 · 3/10 → 89 · 1/10 → 60. Quả cầu đèn đã tắt là một mảng kính đục xỉn phẳng; quầng và vũng sáng của nó biến mất hẳn. *Play: đèn tự tắt dần khi vào arena* (mỗi N giây một đèn, giữ lại tối thiểu 1 — LD: có mức sáng tối thiểu); khi dừng Play thanh trở về giá trị trước khi Play. *Thắp lại tất cả*.

## Play

*Điểm xuất phát (Play)*: S1 cầu thang (mặc định; lưới Play 128 m quanh S1 phủ cả map), S2 lối vào, S3 cửa arena. Quái (bật mặc định, tắt được): **B05** = `hollow_king` (boss, blockout ẩn khi Play), **P07** Cradle-Warden ×2 = `brute`, **P01** The Soothed ×4 = `zombie`, **P05** Wet-Nurse = `zombie` + Swaddling ×3 = `spider`, **P03** Hush-Moths ×5 = `bat`; tên trên HUD là id ASHLAR. Cấp quái thấp (3–7) để đi thử được với hero cấp 5. Bước chân: `surfaceAt` đọc splat (đá).

**Va chạm trong Play và vật cản của plan.** Play không đọc vật cản của engine: nó đi trên mesh sàn và va vào tam giác của mesh rắn (dải 0.35–1.7 m trên mặt đất; bậc tối đa 0.6 m). Hai thứ được giữ khớp nhau: (1) ở mép void sàn đi được **dừng đúng ở mép** (phần quá mép là apron, không đi được), nên cũi đứng ngoài mép không cần chặn; (2) cột màn lanh và chân chuông xương là phần rắn (màu gỗ), còn vải màn và xương treo thì đi xuyên qua (`openCats`, phần `open: true`) — đúng như vật cản đĩa của plan. Đã kiểm trong trình duyệt: cột màn chặn, khe giữa hai tấm màn trống, dưới xương treo trống, chân chuông chặn, sàn hết ở x = 4.0 (mép lối). Vật thấp hơn bậc 0.6 m của Play (đế bập bênh: giữa đế 0.58 m) mang KIT `collider: 1.0` — vách va chạm vô hình 1 m quanh vật cản của plan — nên Play cũng không bước lên được (kiểm: 12/12 điểm dò sát mép bị chặn); bục chăn chần 0.72 m chặn sẵn (4/4).

## Sàn và tường

1 `LayerSplat` 608² phủ 102 m (≈ 6 px/m) + `createLayerTerrain`, 5 layer: `BIO27_cradle` (nền phấn + xương nhạt) → `BIO27_vault` (void + mép) → `BIO08_nave` (đá hầm cũ ở cầu thang) → `BIO05_lime` (vôi sạch dưới đèn ngủ và giữa arena) → `DG_crypt_dust` (chút bụi ở mép void). Blend rộng, mịn (thanh *Độ mịn*). Sàn đi được và **apron** (sàn tối dần ra void, không đi được) là hai mesh; dãy cũi trong void tối dần theo khoảng cách. Không có trần; tường và vật cao mờ dần giữa camera và tâm (`createWallFade`).

## Overlay (tab Environment → *Overlay*, tắt mặc định trừ chú giải nhỏ)

Nhãn asset (id + tên + cỡ, nhãn giữ cỡ trên màn hình) · Chạm trán (vòng quái + boss, tên id) · Bóng tay telegraph (+ xem thử nhịp) · Mốc, tầm nhìn, vignette, vùng ru (nôi của Mercy, giường dọn sẵn — vignette không đánh dấu trên bản đồ —, chân cầu thang → vòng đèn, vùng bài ru r 13 m) · Lối ra (↑ Garden of Hush) · NPC (không có NPC trong Cradle).

## Khung camera (beat)

Toàn cảnh (camera từ phía đông: cầu thang → lối vào → arena đọc trái → phải; pitch 55°) · Toàn cảnh (bắc lên trên) · Cầu thang từ Garden of Hush · Lối vào · dãy nôi · Dãy nôi chìm vào sương đen (nhìn về nam) · Cửa arena · màn lanh · Arena · vòng đèn ngủ · Hospice Mother · bàn tay & bóng tay.

## Asset (báo cáo đầy đủ: [ASSETS.md](./ASSETS.md))

11 id: **1 glb** (`glb:dungeon-prop-crypt-wall`, mô-đun tường đầu cầu thang) · **1 procedural** (`N-CR04` cầu thang + vòm, engine dựng) · **9 blockout**: A14.1 cũi xương ×60 (39 vẽ trong void) · A14.2 màn lanh ×9 · A14.3 đèn ngủ ×32 (14 trong void, chỉ quầng) · A14.4 chuông xương treo ×2 · A14.5 bục chăn chần ×1 · A14.6 đế bập bênh ×3 · N-CR01 thảm lanh lối đi · N-CR02 chăn lật · N-CR03 gối lanh. Quái: B05, P07, P01, P05 (+ Swaddlings), P03 — **không có GLB**. Texture còn thiếu: sàn lanh chần, sàn void, trim xương + dây, vải lanh có viền đỏ, kính trắng sữa. VFX còn thiếu: bài ru (màn hình tối + hero chậm), ánh Mercy chảy vào hero, vải thở, bầy Hush-Moth, hơi "suỵt" của boss (đang dùng thay: quầng tĩnh, vũng sáng, sương đen, bóng tay, bụi GPU).

## Thẻ mood (`ashlar/art-direction/artdirection.md` §2.1)

| Trường | Nội dung |
|---|---|
| Map | The Cradle (Act I, LD 11.12, BIO-27), `?scene=act1Cradle` |
| Mood mục tiêu | Được ôm bởi thứ khổng lồ yêu bạn: một phòng trẻ không có trẻ, đẹp, im, sạch quá mức. |
| Palette | Vải lanh Mercy (trắng sạch duy nhất được phép), ánh trắng sữa đứng yên `#F2ECDF` (*đề xuất*), xương nhạt, đỏ anh túc `#B3262A` chỉ ở viền vải rất nhỏ, đen void. Không nắng, không ánh ấm lập lòe. |
| Lighting và thời tiết | Trong nhà, đêm vĩnh viễn; chỉ ánh Perfection: 10 đèn ngủ quanh arena + đèn lối; 1 spot mềm từ trên; ngoài bán kính đèn là đen, không phải sương xám. Không mưa. |
| Tương phản và value | Sàn và vải sáng giữa vòng đèn, mọi thứ ngoài vòng chìm vào đen; boss là khối trắng lớn nhất; hero tách khỏi sàn sáng bằng bóng của nó. Khi đèn tắt, value của arena sụp dần về đen từ phía sau boss. |
| Nhịp cảm xúc | Cầu thang tối của Garden of Hush → ánh trắng sữa hiện dọc dãy nôi vô tận → màn lanh mở → arena sáng, đẹp, giường dọn sẵn → đèn tắt từng cái, hàng chục bàn tay cúi xuống. |
| Style | §1 (stylized vừa phải); base map: blockout + procedural, chưa có model cuối. |
| Trạng thái | Đề xuất / đang lookdev (2026-10-21, chưa duyệt) |
| Chưa khoá | Hex trắng lanh và trắng sữa (canon thiếu); màu đèn ngủ (artdirection: trắng sữa ↔ Quy chuẩn quái B05: `#E0A050`); P07 trùng dáng B02; camera và budget; số tay của boss ("hàng chục"; blockout có 10). |

## Kiểm chứng (2026-10-21, sau vòng sửa 1)

- `node --test scripts/act1-interior.test.mjs` — 18/18 (plan hợp lệ, không NaN, spawn đi được và nối nhau, tuyến chính trống ≥ 0.35 m và rộng ≥ 1.8 m, bậc ≤ 0.3 m / 0.5 m (cầu thang ≤ 0.4), lưới Play 128 m phủ tuyến, tường / lỗ mở nhất quán, xuất SPEC §6b đầy đủ, tất định, kit A14 đúng cỡ concept, B05 đúng sheet, chỉ ánh Perfection + ngân sách 16 đèn kể cả đèn nhân vật, bóng tối khép lại theo thanh đèn ngủ, cột màn rắn / vải đi xuyên, dãy cũi void, quái + telegraph trong arena; cộng hai test engine trên một toà nhà tổng hợp: phòng kín + cửa + cửa sổ + vòm + sân trong + dốc, và kiểm tra plan bắt dốc quá dốc / đèn theo nhóm không có). `npm run test:act1` (cả engine ngoài trời) 33/33.
- Va chạm Play (WebGL2, CollisionWorld của lab): cột màn chặn, khe giữa màn trống, dưới xương treo trống, chân chuông chặn, không có sàn quá mép void (x = 4.05 → không có mặt đất).
- WebGL2: mở không lỗi console; dựng scene ~1.2–2 s; 56–67 draw call, ~0.23 M tam giác, 2.0–3.5 ms/khung (burst 40), GPU 1.5–1.7 ms (1600 × 900). Rời sang Studio rồi quay lại: giải phóng và dựng lại, không lỗi.
- WebGPU: mở được (smoke), GPU 1.7–2.1 ms; chỉ có cảnh báo có sẵn của trình duyệt (`powerPreference`) và của Studio (`Checker frame`) khi chuyển scene.
- Play (WebGL2): từ S1 đi xuống 9 bậc → lối vào → qua màn lanh → arena tới trước boss: 9/9 điểm tới được, độ cao hero = sàn của plan (sai số 0), không rơi, không tường vô hình trên tuyến; từ S2: 6/6. 16 quái thay thế xuất hiện với tên id ASHLAR; blockout boss ẩn khi Play.
- Mặt bằng 2D: [cradle-plan.png](./cradle-plan.png) (`node scripts/act1-interior-preview.mjs cradle`). Ảnh: [shots/cradle/](./shots/cradle/) (01–12 và 15 WebGL2, 13 · 14 · 16 WebGPU; 07 / 09 / 15 = 10 · 3 · 1 đèn ngủ còn lại, 10 = boss khi còn 1).

## Giới hạn / chưa làm

Mọi model là blockout (không model ASHLAR nào cho Cradle); quái là mô hình lab thay thế; không âm thanh (bài ru); chưa có hiệu ứng bài ru (tối màn hình, chậm hero) và ánh Mercy sau trận; đèn trong void chỉ là quầng (không chiếu sáng); bóng tay là overlay xem thử, chưa gắn với đòn đánh thật; cầu thang + vòm là hình procedural tạm. Chưa rebuild bản HTML offline.

## Vòng thay model (2026-10-22)

Không đổi. The Cradle không có asset nào trong lô A15–A20, và các ứng viên dùng lại (đèn lồng trại, cột bùa có dải đỏ, tảng đá) đều sai phong cách Mercy (xem `tmp/act1-base-maps/REUSE_CANDIDATES.md` → *Decisions (interior)*). Engine có hai thay đổi chung (tấm kính cửa sổ mờ cùng tường, model gom theo ô) nhưng Cradle không có cửa sổ hay model nên ảnh và số đo giữ nguyên: `shots/cradle/before-after.png`, tam giác 236 nghìn, 71–73 draw call như trước.

## Vòng thay kit A01–A14 (2026-10-23)

Cả sáu model A14 nay là model Tripo của bộ kit (`lookdev-lab/assets/act1-kit/`).

- **A14.1** nôi xương ×60. Model là hộp song kín (song cách nhau ≈ 0.4 m, sàn nôi 0.83 m), sâu 4.27 m (concept 3.6 m).
  - Ở lối vào, các nôi chỉ còn cách nhau 0.53 m, không đủ chỗ đặt đèn giữa hai nôi. Vì vậy 8 đèn ngủ của lối vào và 4 đèn trong sương dời từ x ±4.7 ra mép lối đi (x ±3.5), trước đầu nôi 0.5 m.
  - Vòng nôi quanh arena lấn vào mép arena 0.29 m.
  - Collider hộp: nôi chắn trọn khối, và các tam giác của model không vào lưới va chạm.
- **Nôi của Mercy:** cùng model nôi ở scale 0.8, sàn nôi đặt trên các thanh ngang của đế bập bênh A14.6 (scale 1.15, thanh ngang cao 1.07 m). Hai đầu cong của đế vươn ra ngoài hai đầu nôi.
- **A14.2** màn lanh ×9. Blocker dời về hai cột của model ở (−1.84, −0.17) và (1.79, −0.17), bán kính 0.2 m. Giữa hai cột còn 2.95 m. Collider chỉ trên hai cột, nên rèm vải đi xuyên được trong Play như trước.
- **A14.3** đèn ngủ trắng sữa ×64.
  - Đèn, quầng sáng và quả cầu phát sáng đặt ở tâm cầu sữa của model (0, 1.77, 0), Ø 0.72 m. Quả cầu (trường KIT `globe`) vẽ cộng sáng đè lên kính của model.
  - Khi đèn sáng, cầu bloom trắng như trước. Khi tắt (cơ chế "đèn ngủ tắt dần" của boss), chỉ còn kính trắng của model, không còn phát sáng.
  - Collider 2.0 m.
- **A14.4** chuông xương ×2. Chỉ chân đế chắn (collider trên blocker); chùm xương treo tới ≈ 0.9 m vẫn đi xuyên được.
- **A14.5** bục chăn ×1: mặt nệm 0.83 m, gối tới 1.32 m, nên không bước lên được và chắn trọn khối (collider).
- **A14.6** đế bập bênh ×3: một dưới nôi Mercy, hai nằm rời. Collider 1.0 m.

**Đi lại:** con đường chính (cầu thang → lối vào → màn lanh → arena) và mọi điểm xuất phát vẫn đi được. Test mới kiểm:
- không đèn nào đứng trong nôi;
- sàn nôi Mercy nằm trên thanh ngang của đế (lệch < 4 cm);
- vòng nôi lấn vào arena ≤ 0.35 m;
- chỉ cột màn và chân chuông xương va chạm.

Kiểm bằng lưới nav thật của Play: mọi điểm của con đường chính đến được; giữa hai cột màn ở cửa arena trống; arena còn 653/716 ô 1 m đi được trong bán kính 15 m.

**Ánh sáng:** không đổi: mọi đèn Perfection tĩnh; mười đèn arena tắt dần theo thanh trượt; một bóng đổ; đèn thật + đèn nhân vật ≤ 16; ánh tối khép dần vẫn theo nhóm đèn ngủ.

**Ảnh** (`shots/cradle/`):
- so sánh `before-after.png`, "trước" chụp cùng góc camera ngay trước vòng này;
- WebGL: `kit-<view>-webgl.png` cho các view `overview`, `aisle`, `fog`, `mouth`, `arena`, `boss`, `stair`, `cu-crib-row`, `cu-mercy-cradle`, `cu-platform-mobile`, `cu-night-light`, `cu-curtains`, cùng các ảnh soi texture `cu-lk-*`;
- WebGPU: `kit-arena`, `kit-aisle`, `kit-cu-lk-mercy`, `kit-cu-lk-platform`, `kit-cu-night-light`, `kit-cu-lk-crib-row`.

**Hiệu năng** (1600 × 900, máy test): tam giác 0.23–0.24 triệu → 0.98–1.42 triệu (nôi A14.1 chiếm 0.54–0.87 triệu); draw call 61–73 → 73–97. GPU WebGL không tăng (overview 1.91 → 1.77, aisle 2.25 → 1.78, arena 1.90 → 1.73 ms). GPU WebGPU +0.15–0.2 ms (1.57–1.82 → 1.77–1.96 ms). Bộ nhớ texture 64 → 201 MB (sáu model 2048 + 1024 px). Lưới va chạm của Play: 21 nghìn tam giác, 21 ms (nôi và bục có collider hộp; không có collider thì 87 nghìn tam giác).

**Còn tồn tại:**
- Nôi của model sâu hơn concept nên lối vào chật hơn.
- Một chân nôi Mercy không chạm đế (khuất dưới nôi).
- Hospice Mother và quái vẫn là blockout hoặc mô hình thay thế.

## Vòng thay A21–A25 (2026-10-23)

Chăn và gối trên bục chăn của arena nay dùng model Tripo nhóm A24 (`assets/act1-kit/`, kích thước thật). Số liệu từng model:
`tmp/act1-base-maps/ACT1_KIT_FIT.md` mục A21–A25.

- **N-CR02 → A24.5** chăn lật sẵn: 3.00 × 2.69 m, dày tới 0.60 m tính cả nếp gấp (concept 0.24 m). Nếp gấp có các đường đỏ, quay về phía gối.
- **N-CR03 → A24.6** gối lanh: vuông 1.5 × 1.3 m (concept 1.5 × 0.75 m), dày 0.54 m, ba đường đỏ mảnh gần một đầu (QA: brief chỉ có một
  dải). Giữ scale 1: gối cách nếp chăn 0.3 m, bục không chật.
- **Cao độ:** bảng fit gợi ý đặt ở mặt đệm 0.83 m. Nhưng mặt trên của bục A14.5 là chín cái đệm chần cao 1.24–1.39 m, nên ở 0.83 m chăn và
  gối sẽ chìm trong đệm (bản giữ chỗ cũ ở 0.72 m cũng đang chìm hẳn). Vì vậy cả hai nằm trên mặt đệm (`ON_CUSHIONS`):
  - chăn ở 1.24 m, gối ở 1.15 m: đây là độ cao thấp nhất mà không chỗ nào của đệm xuyên qua mặt chăn / gối (cộng 0.02 m), đo trên mesh;
  - đáy phẳng của chúng lún vào đỉnh đệm mềm tối đa 0.13 m (chăn) / 0.17 m (gối); phần lớn đáy nằm sát mặt đệm (lệch ≤ 0.1 m), chỉ mép cong
    hở cao hơn (tới 0.42 / 0.27 m).
- Chăn và gối không chặn (đi xuyên). Bục vẫn chặn cả khối bằng collider 1.5 m như trước.

**Đi lại:** không đổi. Lưới nav thật của Play cho kết quả giống hệt trước vòng này: 10/10 điểm của con đường chính đến được, 653/716 ô
arena đi được, khe giữa hai cột màn ở cửa arena trống.

**Ánh sáng:** không đổi (15 đèn thật + đèn nhân vật = 16), một đèn đổ bóng; nhóm đèn arena và thanh trượt không đổi.

**Kiểm Mercy / Perfection:** chăn và gối trắng sữa, sạch; các đường đỏ là dải đỏ của bộ Cradle. Gối có ba đường đỏ thay vì một (QA).

**Ảnh** (`shots/cradle/`):
- so sánh `before-after.png`, với "trước" là bản ngay trước vòng này và cùng góc camera;
- WebGL: `a2x-<view>-webgl.png` cho `arena`, `boss`, `mouth`, `cu-platform-mobile`, `cu-bed`, `cu-bed-side`, `cu-lk-platform`, `cu-lk-bed`,
  `cu-lk-bed-side` (ảnh `cu-bed*` có hình người 1.8 m đứng cạnh bục để so tỉ lệ);
- WebGPU: `a2x-arena`, `a2x-boss`, `a2x-cu-bed`, `a2x-cu-bed-side`, `a2x-cu-lk-bed`.

**Hiệu năng** (1600 × 900, một lần đo mỗi bản):
- tam giác (WebGL, theo view) 0.98–1.42 triệu → 1.00–1.46 triệu; draw call không đổi (73–97);
- GPU WebGL: overview 1.98 → 1.85, aisle 1.92 → 1.81, arena 1.81 → 1.63 ms; GPU WebGPU không đổi (1.77 → 1.77, 1.92 → 1.92, 1.94 → 1.96 ms);
- bộ nhớ texture (RGBA8 + mip, ước tính) 200 → 214 MB.

**Còn tồn tại:**
- Chăn dày hơn concept (0.6 m so với 0.24 m), nên giường cao tới ≈ 1.85 m.
- Mép chăn hở nhẹ trên khe giữa các đệm.
- Khi camera nhìn xuyên qua giường về phía nhân vật, lớp mờ tường (wall fade) làm phần trước của bục, chăn và gối lấm tấm như trước.

**Sáng hơn (2026-10-23):** `cradle`: `hemi` 0.55 → 1.1, `envI` 0.04 → 0.06, `exposure` 0.85 → 1.3, `floorTone` 0.55 → 0.65 — sáng hơn ≈ +30 %, giường, chăn và Hospice Mother từ trắng xám thành trắng sữa sạch, không cháy (cháy sáng +0.02 điểm %), void vẫn đen; ảnh `shots/cradle/bright-before-after.png`, số đo `tmp/act1-base-maps/BRIGHTNESS.md`.
