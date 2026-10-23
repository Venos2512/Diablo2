# ASHLAR · Act I · base · Garden of Hush (map 5, `act1GardenOfHush`)

LD 11.11 · BIO-04 ↺ (hầm xương & vườn đất) · dungeon dưới hospice · Hybrid · D5 C3 · 35 phút. Mở bằng ô **Scene** → *ASHLAR · Act I · base · Garden of Hush* hoặc `?scene=act1GardenOfHush` (thêm `&renderer=webgpu`).

Base map = bố cục, tỉ lệ, sàn, ánh sáng và các beat là thật; mọi model còn thiếu là **blockout đúng cỡ** (màu theo nhóm, SPEC §6b; quần áo người ngủ, rễ, gạch có tông riêng, vẫn trầm), quái trong Play là mô hình thay thế mang tên id ASHLAR. Không gore: anh túc mọc từ miệng là một cái cây, không phải vết thương.

## Bố cục (lát 190 × 82 m; độ dài đề xuất cho bản đầy đủ: ~420 m đường đi qua 2 tầng)

Đường đi từ tây sang đông và luôn đi xuống: y +3.6 (hospice) → 0 (hầm cũ) → −0.6 (vườn) → −2.4 (luống sâu) → −4.2 (chân cầu thang Cradle).

| Đoạn | Nội dung | Ngữ pháp phòng |
|---|---|---|
| **S1 · Cầu thang từ Gentle House** | Chiếu nghỉ vôi trắng của hospice (2 chân nến A11.6 đứng yên, cửa ↑ Gentle House), **17 bậc** 0.2 m xuống | cầu thang (làm tay) |
| **Hầm cũ (ossuary)** | Đá vữa xương (BIO04_ossuary), tường tây là **mô-đun tường hầm GLB** (hốc xương: nơi Tường lộ ra, ánh trắng lạnh lung linh), 3 cột gãy GLB, cụm nến GLB nguội; **người ngủ đầu tiên** nơi đất vườn tràn lên nền đá | hầm cũ (làm tay) |
| Đường hầm rễ | Dốc xuống 0.6 m dưới 3 vòm sườn rễ (N-GD01) | hành lang |
| **S2 · Vườn ngủ · luống đầu** | Sảnh 48 × 38 m, tường đất ẩm, 10 hốc tường vòm rễ (A13.5: cửa của Poppy Nurse). **Bốn hàng giường** (A13.1) × 15 người ngủ, đối đầu nhau qua hai "sống luống" có luống anh túc (A13.6) và **cột chuông ru** (A13.4); hai hàng ngoài dưới **mái vải lanh** (A13.2), hai hàng dọc lối giữa để trống (hình Remember); mương nước tĩnh phía nam | **sảnh luống** (procedural được) |
| **S3 · Hành lang kênh tưới** | 32 × 12 m: hai **mương nước tĩnh** chìm 0.4 m dưới sàn (mặt nước đen bóng), 4 cửa cống A20.5, 3 giá phơi anh túc A08.6, ván qua mương, mạng tơ W07 ở đầu đông | **hành lang kênh** (procedural được) |
| **Phòng thở · Fen & Tamsin** | Phòng đá cũ cạnh hành lang: hàng giường của người Lychgate, **Fen** ngủ trong luống (anh túc như mọi người), **Tamsin** quỳ bên cậu; **nến + đèn lồng cô mang theo là ánh ấm lập lòe duy nhất** của Garden (và là đèn đổ bóng duy nhất) — nhìn từ hành lang thấy ánh ấm qua cửa | phòng thở (làm tay) |
| **S4 · Phòng thu hoạch** | 5 bàn thu hoạch A20.6 (giỏ đầu anh túc, cối giã, vò đất, bó hoa treo), 3 giá phơi, giỏ rải (scatter), đầu anh túc rơi (scatter), đèn ngủ hồng làm đèn làm việc | **phòng làm việc** (làm tay) |
| **S5 · Luống sâu · đoạn khó nhất** | 64 × 38 m, mép nam là **void**: luống đất trần (không giường, không mái) chạy tiếp vào bóng tối (78 người ngủ vẽ trong void). Rễ sập chặn lối bắc ngay cửa vào, rễ sập thứ hai chặn lối giữa; **dãy chuông** hai bên lối giữa; khe phía bắc là đường đúng — từ đó **ngọn đèn phía trước** hiện lần đầu ở hành lang ra (trắng, đứng yên, xa, không ai cầm, không giải thích). Khe phía nam dẫn ra đường sai: lối ngập nước, **Poppy-Mound** + Hush-Moth, ngõ cụt có mạng tơ | **luống sâu / cell giả vô hạn** (procedural được) |
| **S6 · Hầm thấp nhất** | Đá BIO27_vault + mô-đun tường hầm GLB, đèn trắng sữa đứng yên của Cradle ở đầu cầu thang, **9 bậc** 0.18 m xuống vòm; ngưỡng phía tây chìm vào void: ↓ The Cradle (map 6, khớp cầu thang 9 bậc của Cradle) | cầu thang (làm tay) |

**Hybrid (LD)**: base map dựng bố cục cố định. Phần có thể sinh procedural sau: sảnh luống (`ward()` / `canopies()` / `spine()` trong file map: số hàng, độ dài, hỗn hợp người, khe, vị trí chuông là tham số), hành lang kênh (mô-đun mương 3 m + giá phơi), luống sâu (luống seed + khe đúng / sai + void giả vô hạn; đèn phía trước đặt ở lối ra thật). Phần làm tay: hai cầu thang, hầm cũ, phòng thở, phòng thu hoạch.

**Mỗi hàng là những người khác nhau**: 4 người của sheet A20 (cô gái tết tóc + ruy băng, ông lão + tẩu, ngư phủ + mũ len + phao bấc, bà nông dân + tạp dề + thìa gỗ), mỗi hàng một hỗn hợp và độ dài riêng (scale 0.92–1.06); 255 người ngủ ở 14 hàng (test kiểm: không hàng nào trùng hỗn hợp, ai cũng có đèn ngủ cạnh đầu). Cỡ: A20 dài 2.1 m, mặt cao 0.34 m (0.19H), hoa anh túc cao 0.81 m.

## Cơ chế chữ ký: chuông ru

15 cột chuông A13.4 trên các sống luống. Overlay **Chuông ru (cơ chế)** (tab Environment → *Overlay*): vòng nét đứt = bán kính tiếng ồn 6 m quanh mỗi chuông, nét đứt đỏ = chuông gọi Poppy Nurse ra từ 2 hốc rễ gần nhất (vòng đỏ ở cửa hốc), dòng phụ *xem thử: tiếng ồn lan ra từ chuông* chạy một gợn sóng từ chuông ra tới bán kính. Test kiểm: mỗi chuông có ≥ 4 người ngủ trong bán kính, cửa gọi nằm trên sàn.

## Ánh sáng (ngữ pháp ánh sáng)

- **Đèn ngủ hồng** (A13.3, Perfection: đứng yên, giống hệt nhau, rất nhiều): 263 đèn, **9 đèn thật**, còn lại chỉ có quầng + vũng sáng trên sàn (instanced). Màu `#DCB0B3` hồng bụi nhạt là **đề xuất** (canon chưa có hex).
- **Ánh người**: chỉ ở phòng thở — đèn lồng của Tamsin (spot ấm `#E0A050`, lập lòe 1/f, **đèn đổ bóng duy nhất**) + cụm nến cô thắp.
- **Ánh Tường**: trắng lạnh lung linh chậm ở hốc xương hầm cũ.
- **Ngọn đèn phía trước**: trắng `#F4F6F8`, đứng yên (loại riêng `ahead` — không phải Perfection, không lập lòe), quầng lớn đọc được từ xa.
- Đầu cầu thang Cradle: đèn trắng sữa đứng yên của Cradle; chiếu nghỉ hospice: nến đứng yên A11.6.
- Ngân sách: 15 đèn thật + đèn nhân vật = 16. Ngoài vùng sáng là bóng tối, không phải sương xám (AD §4.3).

## Play

*Điểm xuất phát (Play)*: S1 cầu thang hospice (mặc định), S2 vườn ngủ, S3 hành lang kênh, S4 phòng thu hoạch, S5 luống sâu, S6 hầm thấp nhất (lưới Play 128 m quanh mỗi điểm; map dài 190 m nên mỗi đoạn một điểm). Quái (bật mặc định): **F02** Poppy Nurse ×5 = `skeleton_mage`, **P01** The Soothed ×8 = `zombie`, **P03** Hush-Moths ×9 = `bat`, **P05** Wet-Nurse = `zombie` + Swaddling ×3 = `spider`, **P06** Poppy-Mound = `brute` (blockout đúng cỡ ẩn khi Play), **W07** Shroud-Spinner ×3 = `spider`; tên trên HUD là id ASHLAR. Giường, người ngủ, luống anh túc, mương có khối va chạm vô hình (không đi đè lên người ngủ). Nước mương có độ sâu (`surfaceAt`: bước chân lội nước); bước chân đọc splat (đá / đất).

## Sàn và tường

1 `LayerSplat` 752² phủ 214 m (3.5 px/m) + `createLayerTerrain`, 7 layer: `BIO04_garden` (đất vườn, nền) → `BIO04_ossuary` (đá vữa xương: hầm cũ, phòng thở, phòng thu hoạch, cầu thang) → `DW_damp` (đất ẩm chân tường khóc và quanh mương) → `DW_mud` (bùn mép mương) → `BIO05_lime` (chiếu nghỉ hospice) → `BIO08_nave` (đá lối ra = đầu cầu thang Cradle) → `DG_crypt_damp` (vệt thấm). Blend rộng, mịn. Tường: đất (`BIO04_garden`) ở vườn, vữa xương ở phòng cũ, vôi ở hospice, `BIO27_vault` ở lối ra; mô-đun tường hầm GLB ở 2 đoạn. Bậc chênh sàn (mép mương, cầu thang) dùng vật liệu tường. Không có trần; tường và vật cao mờ dần giữa camera và tâm.

## Overlay và khung camera

Overlay (tắt mặc định trừ chú giải nhỏ): nhãn asset · chạm trán · mốc, tầm nhìn, vignette (người ngủ đầu tiên, xương cũ người ngủ mới, đôi giày, **giường trống đã thắp đèn — không đánh dấu trên map**, Tamsin bên Fen, bàn thu hoạch), ghi chú Hybrid · chỗ NPC (Fen, Tamsin) · lối ra (↑ Gentle House, ↓ The Cradle) · **Chuông ru**.

Khung camera (14): Toàn cảnh · Toàn cảnh (bắc lên trên) · Chiếu nghỉ hospice · Hầm cũ · Người ngủ đầu tiên (cận) · Vườn ngủ (hình Remember) · Hàng người ngủ (cận) · Cột chuông ru · Hành lang kênh tưới · Phòng thở · Phòng thu hoạch · Luống sâu · Ngọn đèn phía trước · Hầm thấp nhất.

## Asset (báo cáo đầy đủ: [ASSETS.md](./ASSETS.md))

31 mã: **3 glb** (`glb:dungeon-prop-crypt-wall` mô-đun tường, `glb:dungeon-prop-broken-column` ×5, `glb:dungeon-prop-candle-cluster` ×2) · **3 procedural** (N-GD12 cầu thang hospice, N-GD13 cầu thang xuống Cradle, N-GD14 mương nước tĩnh) · **25 blockout**: A13.1–A13.6, A20.1–A20.6, A08.6, A11.6 và N-GD01, 04–11, 15, 16. Fen (N-GD02) và Tamsin (N-GD03) là hình NPC đứng thay (trong NPCS, không tính asset); P06 là blockout quái (trong MONSTERS). Texture còn thiếu: đất luống, tường đất có rễ, lòng mương đá ướt, nước đen tĩnh, vải lanh mộc vs lanh Mercy, kính hồng bụi. VFX còn thiếu: chuông rung + tiếng, người ngủ thở chung một nhịp, cánh anh túc rơi, bầy Hush-Moth, tơ W07 làm chậm (đang thay: quầng/vũng sáng tĩnh, lập lòe 1/f, ánh Tường lung linh, bụi GPU, mặt nước bóng).

## Thẻ mood (`ashlar/artdirection.md` §2.1)

| Trường | Nội dung |
|---|---|
| Map | Garden of Hush (Act I, LD 11.11, BIO-04 ↺), `?scene=act1GardenOfHush` |
| Mood mục tiêu | Yên, màu mỡ, nhân đạo — như đi trong phòng bệnh ban đêm; hàng trăm người ngủ, một bài ru không thành tiếng. |
| Palette | Đất `#4A3526`, đen xanh `#1F2A24`, vải lanh mộc (mái) và lanh sạch Mercy (nếp đắp người ngủ), đỏ anh túc `#B3262A` (hoa từ miệng, luống), hồng bụi của đèn ngủ (*đề xuất* `#DCB0B3`), một đốm ấm `#E0A050` duy nhất ở phòng thở, trắng của đèn phía trước. Không nắng. |
| Lighting và thời tiết | Dưới đất, đêm vĩnh viễn; đèn ngủ hồng đứng yên bên mỗi người; ánh lạnh của Tường ở hốc xương; ánh người duy nhất là của Tamsin; đèn phía trước ở chỗ khó nhất. Ẩm, sương thấp sát sàn. |
| Tương phản và value | Hàng đèn hồng vẽ nhịp luống trên nền đất tối; mái lanh là mảng sáng lớn nhất của vườn; phòng thở là đốm ấm duy nhất; luống sâu tối hơn, chỉ còn quầng, đèn phía trước là điểm trắng sáng nhất ở đó. |
| Nhịp cảm xúc | Vôi trắng hospice → hầm xương cũ, người ngủ đầu tiên → vườn ngủ rộng, im → kênh nước tối → ánh ấm của Tamsin bên Fen → bàn thu hoạch (vườn để làm gì) → luống chìm vào bóng tối, chuông khắp nơi → một ánh trắng ở xa chỉ đường → xuống Cradle. |
| Style | §1 (stylized vừa phải); base map: blockout + procedural, chưa có model cuối. |
| Trạng thái | Đề xuất / đang lookdev (2026-10-22, chưa duyệt) |
| Chưa khoá | Hex đèn ngủ hồng; cỡ A13.1 (prompt 2.4H × 1H quá lớn cho một người, turnaround đọc ~1.5H — đang dùng 2.7 × 1.4 m); số biến thể người ngủ (4 trên sheet, bản cuối cần bộ đầu / áo / kỷ vật thay được); Poppy Nurse thuộc Faithful hay Mercy (errata F02); P06 chưa có sheet. |

## Kiểm chứng (2026-10-22)

- `node --test scripts/act1-interior.test.mjs` — 44/44 (engine + 3 map; riêng Garden: 8 test chung + 5 luật riêng: kit A13/A20/A08.6 đúng cỡ, người ngủ nào cũng có đèn cạnh đầu, 14 hàng 14 hỗn hợp, ngữ pháp ánh sáng + 1 bóng + ngân sách 16, chuông có người ngủ trong bán kính và cửa gọi trên sàn, đủ F02 · P01 · P03 · P05 · P06 · W07, Fen + Tamsin trong phòng thở, ≥ 3 vignette có 1 không đánh dấu, vào từ Gentle House ra xuống Cradle, mương có nước).
- WebGL2: mở không lỗi console (chỉ favicon 404 của dev server); dựng scene 1.6–1.9 s; 187–283 draw call, 0.83–0.94 M tam giác; 3.2–4.5 ms/khung (burst 60 khung, vòng lặp dừng, 1600 × 900).
- WebGPU: mở được (smoke), dựng 1.6–1.8 s, 5.5–8.8 ms/khung; chỉ có cảnh báo `powerPreference` của trình duyệt.
- Play (WebGL2), từng điểm xuất phát đi tuyến chính trong lưới 128 m của nó: S1 6/6 chặng (xuống 17 bậc, hầm cũ, đường hầm, vườn), S2 2/2, S3 8/8 (qua phòng thu hoạch, xuống cầu thang luống sâu), S5 9/9 (luống sâu → khe bắc → đèn phía trước → hầm thấp nhất → 9 bậc), S6 4/4; độ cao hero = sàn plan (sai số < 1e-6 m), không rơi, không tường vô hình. 22–26 quái thay thế mỗi lần, tên id ASHLAR; blockout P06 ẩn khi Play; bước chân: đá / đất.
- Mặt bằng 2D: [gardenOfHush-plan.png](./gardenOfHush-plan.png). Ảnh: [shots/gardenOfHush/](./shots/gardenOfHush/) (01–17 WebGL2, 18–20 WebGPU).

## Sửa engine trong lượt này (bổ sung, tương thích ngược)

`interior.js`: mặt nạ đất nhanh hơn (không cấp phát mỗi texel, bỏ qua phòng xa theo bbox — kết quả giống hệt, splat map 5 7.4 s → 1.0 s, Gentle House 4.7 → 1.2 s), tra nước kiểm bbox trước. `interiorBlockout.js`: phần blockout có `cat: '#rrggbb'` dùng màu đó; màu marker `bell`. `interiorBuild.js`: mặt nước tĩnh cho `plan.water`; `KIT.collider` (khối va chạm vô hình cho blockout thấp); overlay `bell`; tên đèn theo `kindLabel`; **sửa sàn**: pháp tuyến 0 → hướng lên, bậc chênh sàn tách thành mesh riêng dùng vật liệu tường (vật liệu terrain cho NaN trên mặt đứng → bloom loang thành mảng đen lớn; lỗi này cũng che mất nửa khung hình của Cradle). `act1Interior.js`: công tắc overlay Chuông ru. `scripts/act1-interior-preview.mjs`: vẽ marker `bell`.

## Giới hạn / chưa làm

Mọi model mới là blockout; quái là mô hình lab thay thế; chuông chỉ là overlay xem thử (chưa nghe tiếng ồn của kỹ năng, chưa gọi quái thật); đèn phía trước đứng một chỗ (bản cuối: hiện ra xa hơn khi tới gần); người ngủ chưa thở; nước tĩnh là mặt phẳng bóng mờ đục; mái lanh từ camera cao che giường bên dưới (nên hai hàng dọc lối giữa để trống). Chưa rebuild bản HTML offline.

## Vòng thay model (2026-10-22)

Thay blockout bằng model Tripo đã chuẩn bị (`lookdev-lab/assets/act1-extras/`):

- **A20.1–A20.4** bốn người ngủ (×254: 69 / 51 / 67 / 67): trên giường luống A13.1 model nâng 0.2 m để đáy phẳng nằm trong đất của giường (đất cao 0.32 m), mặt người và bông anh túc nổi trên gờ gỗ; ở hàng sâu (không giường) nằm thẳng trên sàn. Ba hàng chìm vào bóng tối được tô tối dần như blockout.
- **A20.5** kênh tưới ×8: model hạ 0.55 m để khối đất cắt của nó bằng mặt sàn; đáy rãnh thấp hơn mặt nước tĩnh 3 cm nên nước của engine nằm trong rãnh; collider 1.55 m (đỉnh vẫn 1.0 m trên sàn).
- **A20.6** bàn thu hoạch ×5: mặt bàn 0.84 m, sâu 1.43 m (collider theo đúng chiều sâu).
- **P06 Poppy-Mound**: model tĩnh `act1-p06-poppy-mound` (4.5 × 1.7 × 4.4 m, không cần rig) thay blockout quái, quay hai khuôn mặt về camera game; đứng yên cả khi Play, có collider 1.3 m. Camp vẫn giữ quái thay thế "brute" (hệ camp chỉ nhận loại quái của lab); brute sinh ra ở mép gò. Không ẩn brute vì nó vẫn đi lại và đánh — ẩn đi sẽ thành quái tàng hình.
- Không dùng lại model khác (xem `tmp/act1-base-maps/REUSE_CANDIDATES.md` → *Decisions (interior)*).

**Kiểm tra bằng mắt:** ở camera game bông anh túc đọc như chấm đỏ ở miệng; cận cảnh (cô gái A20.1) bông hơi cao hơn môi, có thể thấy như lơ lửng — ghi nhận, không sửa mesh. Rãnh kênh đọc như rãnh tối (nước đen, đứng yên). Bàn thu hoạch đẹp, đúng mood.

**Ảnh:** `shots/gardenOfHush/before-after.png`; WebGL `swap-hall`, `swap-rows`, `swap-firstSleeper`, `swap-gallery`, `swap-harvest`, `swap-deep`, cận cảnh `swap-cu-sleepers-game-cam`, `swap-cu-sleeper-poppy`, `swap-cu-channel-gallery`, `swap-cu-harvest-table`, `swap-cu-p06`, `swap-cu-p06-game-cam`; WebGPU `swap-hall`, `swap-harvest`, `swap-cu-p06`.

**Hiệu năng:** model gom theo ô 32 m để camera loại bỏ phần ngoài khung hình. Draw call giảm (hall 187 → 119, overview 283 → 221); tam giác hall 0.83 → 1.17 triệu, toàn cảnh 0.94 → 2.9 triệu; GPU gần như không đổi (±0.2 ms); bộ nhớ texture 198 → 433 MB (A20.5, A20.6 dùng texture 1024 px; trước đó 497 MB). Người ngủ có collider nên tam giác model không vào lưới va chạm của Play.

**Còn tồn tại:** bộ nhớ texture lớn (254 người ngủ dùng chung 4 bộ texture 2048, vẫn là 179 MB; nên dùng 1024 px); bông anh túc lơ lửng nhẹ ở cận cảnh; gò P06 chồng mép lên kênh sâu (như blockout cũ).

## Vòng thay kit A01–A14 (2026-10-23)

Thay blockout A13, A08.6 và A11.6 bằng model Tripo của bộ kit (`lookdev-lab/assets/act1-kit/`). Ghi chú QA của từng model đọc trong `ashlar/3d/props/act1_kit_v1/manifest.json`.

- **A13.1** giường luống ×65. Model là hộp gỗ phủ vải lanh, dài 2.7 m, rộng 1.16 m (concept 1.4 m); mặt vải cao 0.46–0.50 m.
  - Người ngủ GLB (A20.1–A20.4) nằm trên vải: đáy phẳng ở 0.42 m.
  - Họ được thu về 0.85 lần scale của hàng, vì lớp đất của họ rộng 1.4–1.5 m. Sau khi thu, lớp đất chỉ tràn ra ngoài giường ≤ 0.1 m mỗi bên.
  - Fen (NPC thay thế) và tấm chăn giường trống nâng theo mặt vải (+0.14 m).
  - Collider 1.0 m giữ nguyên.
- **A13.2** khung mái vải ×10. Bốn cột của model nghiêng, không thành hình chữ nhật, nên blocker là bốn hình chữ nhật đo đúng chân cột ở dải 0.35–1.7 m. Mái vải võng tới ≈ 2.4 m và vẫn đi dưới được.
- **A13.3** đèn ngủ hồng ×263.
  - Đèn và quầng sáng đặt ở tâm khối kính hồng (y 0.47 m).
  - Quả cầu phát sáng (trường KIT `globe`) vẽ cộng sáng đè lên kính của model: khi sáng, kính phát hồng nhạt (globeGain 0.42, dưới ngưỡng bloom, như trước); vân kính và đai sắt vẫn thấy.
  - Collider 1.0 m giữ các tam giác của 263 cái đèn ra khỏi lưới va chạm của Play.
- **A13.5** hốc tường vòm rễ ×17. Model chỉ cao 3.5 m (concept 5.04 m). Mặt lưng là vòm bùn trơn tự nghĩ ra (ghi chú QA): mặt lưng nằm trong bức tường đất dày 0.7 m, cách mặt tường ≈ 0.3 m, nên không thấy từ camera. Collider hộp 3.0 m.
- **A13.6** luống anh túc ×16: hoa cao tới 1.76 m. Collider 1.0 m trên chậu 1.0 m; thân hoa nghiêng ra ngoài vẫn đi xuyên được.
- **A08.6** giá phơi anh túc ×6, scale 1.1 (3.96 × 3.22 × 1.98 m). Với scale 1.2 như bảng fit gợi ý, chân chữ A sẽ cắm vào tường hành lang hoặc rơi xuống kênh nước. Các giá lùi 0.2–0.3 m khỏi tường.
- **A11.6** chân nến ×2 ở chiếu nghỉ: như ở Gentle House, ngọn lửa phát sáng đặt đúng ngọn lửa của model.
- **Giữ blockout:**
  - **A13.4** cột chuông ru: cột nhô 0.3 m trên thanh ngang nên trông như thập tự. Người dùng sẽ chọn giữa model gốc và bản `-trim` (`docs/act1-base/act1-kit-cross-check.png`).

**Đi lại:** con đường chính và mọi điểm xuất phát vẫn đi được. Test mới kiểm:
- cột mái vải chắn;
- dưới mái vải (đầu và chân giường) có ≥ 0.3 m trống;
- giá phơi không cắm vào tường hay kênh;
- lưng hốc tường nằm trong tường.

Kiểm bằng lưới nav thật của Play: mọi điểm của con đường chính đến được từ một điểm xuất phát; 60/60 điểm dưới mái vải trống.

**Ánh sáng:** không đổi (15 đèn thật + đèn nhân vật ≤ 16), đèn ngủ vẫn tĩnh, phòng thở vẫn là chỗ duy nhất có ánh lửa người.

**Ảnh** (`shots/gardenOfHush/`):
- so sánh `before-after.png`, "trước" chụp cùng góc camera ngay trước vòng này;
- WebGL: `kit-<view>-webgl.png` cho các view `hall`, `rows`, `bells`, `gallery`, `harvest`, `deep`, `landing`, `firstSleeper`, `cu-canopy-game-cam`, `cu-root-bay`, `cu-jar`, `cu-drying-rack`, `cu-spine-furrow`, cùng các ảnh soi texture `cu-lk-*`;
- WebGPU: `kit-hall`, `kit-rows`, `kit-cu-lk-canopy-row`, `kit-cu-lk-jar`, `kit-cu-lk-root-bay`, `kit-cu-lk-rack`.

**Hiệu năng** (1600 × 900, máy test): tam giác 0.74–2.90 triệu → 0.99–5.06 triệu (riêng đèn A13.3 là 1.2 triệu ở toàn cảnh: 263 × 4 376 tam giác, chia ô 32 m nên view gần chỉ vẽ 0.07–0.3 triệu); draw call giảm hoặc giữ (91–232). GPU WebGPU gần như không đổi (overview 1.44 → 1.57, hall 3.44 → 2.41, rows 2.10 → 2.26, harvest 2.27 → 2.26, deep 2.58 → 2.62 ms). GPU WebGL dao động hơn (hall 1.75 → 2.33, rows 1.84 → 2.83, deep 2.07 → 3.70 ms). Đo riêng đèn A13.3 (bật / tắt xen kẽ 4 lượt, cùng view): ở camera game thêm +0.01–0.09 ms GPU (WebGPU / WebGL); ở hai view toàn cảnh xa vẽ cả 263 đèn (+1.0–1.4 triệu tam giác) thêm +0.1–0.3 ms; texture 1024 px của nó chỉ ≈ 1 MB, nên chưa cần bản ít chi tiết cho hàng xa. Bộ nhớ texture 433 → 528 MB. Lưới va chạm của Play: 290 nghìn tam giác, 101 ms (đèn, hốc, giường, luống, giá có collider nên tam giác model không vào lưới).

**Còn tồn tại:** cột chuông A13.4 chờ người dùng chọn; giường model hẹp hơn concept, người ngủ hơi nhỏ đi.

## Vòng thay A21–A25 (2026-10-23)

Tám chỗ giữ chỗ của map này nay dùng model Tripo nhóm A22 / A24 / A25 (`assets/act1-kit/`, kích thước thật). Số liệu từng model:
`tmp/act1-base-maps/ACT1_KIT_FIT.md` mục A21–A25.

- **N-GD01 → A25.1 bản `-slim`** vòm sườn rễ ×3 trong đường hầm rễ. Bản này đã ép chân rễ lại, chỉ còn sâu 1.94 m.
  - Lối đi giữa hai chân rộng 2.3 m, nhưng tâm lối lệch +0.3 m so với gốc model. Vì vậy gốc mỗi vòm dời 0.3 m về phía nam, để lối đi nằm
    đúng trên con đường chính (z −34).
  - Rễ con treo xuống lối đi (thấp tới 0.74–1.02 m) được cắt bằng `cut` ở dưới 2.05 m. Phần cắt chỉ gồm 983 trên 18 973 tam giác, đều là
    mảnh nhỏ của rễ con; hai chân giữ nguyên. Khoảng trống trên đầu ở giữa lối đi ≥ 2.0 m.
  - Blocker là hai hình chữ nhật ở chân (x < −0.85 và x > +1.45), collider 2.5 m.
  - Sửa cao độ: công thức cũ đặt hai vòm ở đoạn dốc thấp hơn nền 0.6 m. Nay mỗi vòm đứng trên nền tại mép thấp của nó: chân phía cao lún
    ≤ 0.27 m, không chỗ nào lơ lửng.
- **N-GD05 → A25.2** ván qua kênh: rộng 0.91 m (concept 1.5 m), mặt ván cao 0.14–0.17 m.
  - Ván nằm trên dải đất 2 m giữa hai đoạn kênh phía nam và dẫn tới cửa phòng thở.
  - Ván được hạ 0.12 m vào đất, nên mặt ván chỉ cao hơn nền ≈ 0.04 m. Nhân vật đi trên nền, xuyên qua ván; ván không chặn và Play không có
    sàn ván.
- **N-GD07 → A25.3** rễ sập ×2: cao 3.21 m, sâu 4.83 m (bản giữ chỗ 5.4 m). Đã kiểm với bán kính nhân vật của Play (0.3 m): đống ngắn hơn
  chỉ mở thêm một dải 0.25 m dọc mặt nam của đống phía bắc, không có lối nào vòng qua hai đống. Vì vậy giữ scale 1 (thử scale 1.12 thì đống
  cao 3.6 m và đổi lưới đi lại nhiều hơn). Collider 3.0 m: Play không leo lên đống.
- **N-GD08 → A25.4** giỏ thu hoạch ×10, rải ngẫu nhiên như cũ. Giỏ thấp, cao 0.29 m (concept 0.45 m). Collider 0.9 m.
- **N-GD09 → A25.5** bộ đồ chăm sóc: ghế ba chân và bình tưới ở +x. Collider 0.9 m.
- **N-GD10 → A24.4** chăn lanh lật sẵn trên giường trống. Model là một lớp dày: mặt chăn cao 0.27–0.30 m, gối cao tới 0.51 m.
  - Đặt cao hơn giường 0.25 m (`COVER_ON_BED`). Mặt chăn cao hơn vải giường ≈ 0.03 m.
  - Gối của chăn trùm lên gối của giường, nên chỉ thấy một gối. Trước đây đặt cao +0.47 m thì chăn lơ lửng và có hai gối chồng nhau.
- **N-GD11 → A22.1** đôi giày (dùng chung với fens), scale 0.7.
- **N-GD15 → A25.6** đèn lồng của Tamsin. Model là giá rễ đứng trên cục đất, không phải giá treo tường như bản giữ chỗ.
  - Đặt trên nền phòng thở, cạnh gối của Fen, giữa Tamsin và giường. Đèn đứng ở phía đông Tamsin để camera game nhìn từ phía nam vẫn thấy.
  - Đèn người (ấm, chập chờn, đèn duy nhất đổ bóng của map) và quả cầu sáng KIT `globe` đặt đúng kính đèn ở (0.23, 0.50, 0.07), đo trên
    mesh. Vì vậy đèn hạ từ 1.88 m xuống 0.5 m.

**Đi lại:** con đường chính và mọi điểm xuất phát vẫn đi được. Test mới kiểm:
- sau khi cắt, trong lối đi dưới 1.95 m không còn điểm nào của vòm, và mọi điểm của vòm ở dải 0.35–1.7 m nằm trong blocker chân;
- vòm không lơ lửng trên dốc;
- mặt ván cách nền ≤ 0.08 m, và từ hành lang kênh đi tới hai đầu ván và cửa phòng thở;
- hai đống rễ sập vẫn chặn đúng những lối như bản 5.4 m;
- chăn không xuyên vải giường, gối của giường nằm dưới gối của chăn;
- đèn và quả cầu sáng nằm trong kính đèn.

Kiểm bằng lưới nav thật của Play (WebGL): mọi điểm của con đường chính đến được; 45/45 điểm trong lối đi dưới vòm trống, 18/18 điểm sát mép
trong của chân vòm bị chặn; đường hầm, hai đầu ván và cửa phòng thở đến được; rễ sập, giỏ, bộ đồ chăm sóc và đèn lồng đều chặn.

**Ánh sáng:** không thêm đèn (15 đèn thật + đèn nhân vật = 16), vẫn một đèn đổ bóng (đèn lồng). Đèn ngủ vẫn tĩnh; phòng thở vẫn là chỗ duy
nhất có ánh lửa người.

**Kiểm Mercy / Perfection:** chăn lanh, khăn trên giỏ và giường trống đều trắng sạch. Đôi giày cũ là cố ý (giày của người mộng du). Ván qua
kênh hơi gợn, có khe hở giữa các tấm ván (QA).

**Ảnh** (`shots/gardenOfHush/`):
- so sánh `before-after.png`, với "trước" là bản ngay trước vòng này và cùng góc camera;
- WebGL: `a2x-<view>-webgl.png` cho `breath`, `gallery`, `harvest`, `deep`, `cu-root-tunnel`, `cu-root-tunnel-hero`, `cu-root-tunnel-game`,
  `cu-plank-crossing`, `cu-lantern`, `cu-coverlet`, `cu-tending-kit`, `cu-shoes`, `cu-baskets`, `cu-root-fall-mid`, `cu-root-fall-north`, cùng các
  ảnh soi texture `cu-lk-*`;
- WebGPU: `a2x-breath`, `a2x-gallery`, `a2x-deep`, `a2x-cu-root-tunnel`, `a2x-cu-root-tunnel-hero`, `a2x-cu-plank-crossing`, `a2x-cu-lantern`,
  `a2x-cu-coverlet`, `a2x-cu-root-fall-mid`.

**Hiệu năng** (1600 × 900, một lần đo mỗi bản):
- tam giác (WebGL, theo view) 0.99–5.06 triệu → 0.88–5.08 triệu (các blockout cũ nhiều mặt hơn một số model); draw call giảm 11–15 mỗi view;
- GPU WebGL gần như không đổi: overview 2.62 → 2.49, hall 1.76 → 1.95, rows 1.94 → 1.99, harvest 1.40 → 1.49, deep 1.93 → 2.03 ms;
- GPU WebGPU gần như không đổi: overview 1.57 → 1.61, hall 2.62 → 2.40, rows 2.28 → 2.19, harvest 2.27 → 2.26, deep 2.86 → 2.64 ms;
- bộ nhớ texture (RGBA8 + mip, ước tính) 528 → 646 MB: vòm rễ và rễ sập dùng texture 2048 px.

**Còn tồn tại:**
- Rễ sập ngắn hơn concept 0.57 m.
- Giỏ thấp hơn concept; vết đỏ của hoa anh túc trong giỏ chỉ là vài chấm (QA).
- Chân xa của vòm `-slim` bị ép thành mẩu ngắn (nhìn từ trên).
- Ánh đèn lồng ở thấp (0.5 m) nên vũng sáng nhỏ hơn và bóng đổ dài hơn bản treo tường cũ.

**Sáng hơn (2026-10-23):** `hush`: `hemi` 0.95 → 1.5, `envI` 0.05 → 0.08, `exposure` 0.95 → 1.3, `floorTone` 0.62 → 0.66 — sáng hơn ≈ +33 % (phần không phải void: +30 %, vùng tối p25 +69 %), void vẫn đen, đèn ngủ hồng vẫn là chỗ sáng nhất; ảnh `shots/gardenOfHush/bright-before-after.png`, số đo `tmp/act1-base-maps/BRIGHTNESS.md`.
