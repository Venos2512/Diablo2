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
