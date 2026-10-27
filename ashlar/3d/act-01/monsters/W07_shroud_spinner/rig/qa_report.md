# QA rig — W07_shroud_spinner (R2–R5, G2 duyệt 2026-10-27)

Ngày 2026-10-26. Opus 5.5, route M, họ A. Brief đã duyệt ở G1: [`rig_brief.md`](rig_brief.md). Số đo đầy đủ:
[`validation.json`](validation.json). Nhật ký: [`rig.log`](rig.log). **G2 duyệt 2026-10-27** (người dùng xem trong Blender).

| Mục | Giá trị |
| --- | --- |
| File nguồn | `rig/W07_shroud_spinner_rig.blend` (13,6 MB, texture đóng gói), sha256 `57a013ad5b57…` (ghi đủ trong `validation.json`) |
| GLB gốc | `W07_shroud_spinner.glb` sha256 `f06c1063…96b3`, không sửa |
| Công cụ | Blender 5.1.1 chạy nền; script `rig/scripts/w07_build.py` (R2 + R3), `w07_qa.py` (R4 + R5), `w07_g2_sheets.py` (ảnh); bảng bone `rig/_work/rig_spec.json` |
| Credit | 0 |

## 1. Đã dựng

- **Mesh rig** `W07_shroud_spinner`: GLB scale đều ×2,82754 (cao 1,44 m), bỏ 2 đoạn chân rời theo G1 → 6.139 đỉnh, 9.994 tam giác
  (GLB 6.425 / 10.446). Mỗi đỉnh giữ chỉ số GLB trong thuộc tính `src_index`.
- **Skeleton runtime** `W07_shroud_spinner_Rig`: 48 bone, 41 deform, đúng bảng G1 (`SKELETON_STANDARD.md` §3 Họ A). Bone collection
  Root, Body, Head, Legs_L, Legs_R, Sockets. Ẩn trong viewport; theo rig điều khiển bằng Copy Transforms (thế giới → thế giới).
- **Rig điều khiển** `W07_shroud_spinner_Control`: 67 bone `ctl_*`.
  - 41 bone FK cho mọi bone deform, cộng `ctl_root` và `ctl_cog` để nâng, hạ, nghiêng thân.
  - Mỗi chân: control tiếp xúc `ctl_<S>_Leg<n>_IK` ở mũi chân (con của `ctl_root`). IK 2 đốt đùi–ống nhắm `ctl_<S>_Leg<n>_ankle`
    (vòng khớp, con của control IK). Đốt bàn Damped Track tới mũi chân. Pole `ctl_<S>_Leg<n>_pole` trên-ngoài gối (con của `ctl_cog`),
    pole angle −90° cả 8 chân. Đốt háng FK.
  - Công tắc `ik_leg_L1` … `ik_leg_R4` (1 = IK), lái influence của IK và Damped Track bằng driver.
  - Collection: Root/COG, Body FK, Head FK, Legs FK L/R, IK feet, Poles; IK mechanics ẩn.
- **Trọng số**, tính trên mesh hàn theo vị trí, theo mảnh:
  - **Mảnh cứng:** mai, mắt, u mặt, gốc chân xúc giác theo `cephalothorax`; nanh theo `L/R_fang`.
  - **Chân và chân xúc giác:** mỗi đỉnh cứng theo đoạn xương gần nhất. Trong dải khớp thì chuyển tiếp qua mặt phân giác khớp, với
    nửa rộng: háng 5 cm, gối 4,5 cm, vòng khớp 3,5 cm, chân xúc giác 6 cm. Sau đó làm mịn Laplace riêng từng khớp, chỉ qua cạnh
    < 6 cm và chỉ giữa hai xương của khớp đó.
  - **Cục gốc chung chân 1+2:** cứng theo thân trong bán kính 6 cm, chuyển hẳn sang chân ở 16 cm.
  - **Bụng:** `abdomen_02` chiếm trọn trong 15° quanh trục núm tơ, giảm về 0 ở 45°, làm mịn Laplace qua cạnh ngắn.
  - Tối đa **2** ảnh hưởng mỗi đỉnh (4.256 đỉnh một bone, 1.883 đỉnh hai bone).

## 2. A1 — kiểm tự động (14/14 đạt)

Lượt này không export GLB (phạm vi R0–R5). Các mục vốn đo trên GLB được đo trên dữ liệu Blender tương đương; ghi chú ở cột cuối.

| # | Kiểm tra | Đo | Ngưỡng | Kết quả |
| --- | --- | --- | --- | --- |
| A1.1 | Một skin, một mesh | 1 mesh, 1 Armature modifier → `W07_shroud_spinner_Rig` | đúng | **đạt** |
| A1.2 | Tên bone đúng chuẩn, không trùng | 48/48 đúng bảng G1, không trùng, chỉ `[A-Za-z0-9_]`, tiền tố `L_`/`R_` | đúng | **đạt** |
| A1.3 | Một cây, gốc `root` | gốc duy nhất `root` | đúng | **đạt** |
| A1.4 | Đỉnh trống | 0 / 6.139 | 0 | **đạt** |
| A1.5 | Tổng trọng số | lệch tối đa 3,0e-8 | 1 ± 1e-6 | **đạt** |
| A1.6 | Ảnh hưởng mỗi đỉnh | tối đa 2 | ≤ 4 | **đạt** |
| A1.7 | Chỉ số joint hợp lệ | 41 vertex group = 41 bone deform, không group lạ | đúng | **đạt** (tương đương trong Blender) |
| A1.8 | Bind khớp phân cấp | rest qua rig điều khiển = bind (lệch 6,4e-6), mesh rest biến dạng lệch 2,1e-6 m, phân cấp 1,2e-7 | ≤ 1e-5 | **đạt**; ma trận bind nghịch đảo trong file glTF kiểm ở R8 |
| A1.9 | Mesh khớp đầu vào đã scale | lệch tối đa 1,2e-7 m (so từng đỉnh qua `src_index` với POSITION của GLB) | ≤ 1e-4 m | **đạt**; 286 đỉnh đoạn chân rời bỏ theo G1 |
| A1.10 | Texture không đổi | sha256 ba ảnh đóng gói = ba ảnh nhúng trong GLB | byte giống | **đạt** |
| A1.11 | Chiều cao | 1,440 m | 1,44 ± 2 % | **đạt** |
| A1.12 | Chạm đất | z thấp nhất 0,000 | 0 ± 0,01 | **đạt** |
| A1.13 | Bone không trọng số | `root`, `cog` (tổ tiên cấu trúc, §7) + 5 socket | chỉ socket | **đạt** |
| A1.14 | Transform object | mesh, runtime, control: scale 1, không xoay, không âm | đúng | **đạt** |

Thêm: 929 nhóm đỉnh trùng ở đường nối UV có trọng số giống hệt nhau (lệch 0), nên khe ở mọi tư thế là **0,0 mm**. Không có trọng số
trên `root`, `cog`, socket.

## 3. Rig điều khiển — kiểm chức năng

| Phép thử | Kết quả |
| --- | --- |
| Tư thế nghỉ với IK bật | runtime lệch rest 6,4e-6 |
| Kéo từng control IK (vào thân 0,12 m, tới trước 0,08, lên 0,20) | mũi chân theo control lệch ≤ 0,001 mm cả 8 chân |
| Hạ thân `ctl_cog` −0,30 m | mũi chân đứng yên (lệch 0,001 mm); gối chỉ hạ 0,12–0,26 m, tức nhô lên 0,04–0,18 m so với thân |
| Công tắc `ik_leg_L1` = 0 rồi hạ thân 0,10 m | chân L1 đi theo thân (mũi chân rời control 0,10 m), đúng chế độ FK |
| Mọi tư thế thử bên dưới | mũi chân lệch control ≤ 0,001 mm (không tư thế nào vượt tầm với) |

## 4. A2 — ảnh QA và tư thế thử

Độ giãn = tỉ lệ dài cạnh posed/rest, lấy max(q, 1/q), xét cạnh ≥ 3,2 mm; cạnh xấu khi q > 1,6 hoặc < 0,5. Xuyên đếm bằng winding
number trên mesh đã biến dạng. Mốc ở tư thế nghỉ: 58 đỉnh gốc háng nằm dưới ức, trong khối đầu ngực (dáng của mesh gốc); 21 đỉnh bụng
nằm trong lưng sau mai, sâu 70 mm (bụng chồng lên đầu ngực từ mesh gốc).

| Tư thế | Giãn | Cạnh xấu | Mũi chân lệch | Chân trong thân / bụng | Bụng trong mai | Ảnh |
| --- | --- | --- | --- | --- | --- | --- |
| Đi, pha A (L1 R2 L3 R4 nhấc 0,22 m, tới 0,15 m) | 1,62× | 0 | 0 | 58 / 0 | 21 | G2_3 |
| Đi, pha B | 1,46× | 0 | 0 | 58 / 0 | 21 | G2_3 |
| Hạ thân sát đất (−0,30 m) | 1,62× | 0 | 0 | 58 / 0 | 21 | G2_3 |
| Chồm, hai chân trước vươn ra (thân ngửa 15°, chân 1 nhấc 0,42 m, đốt bàn chĩa tới) | 2,31× | 2 (vòng khớp chân 1) | 0 | 58 / 0 | 21 | G2_3 |
| Giương nanh + giơ chân xúc giác (nanh mở 30°, chân xúc giác mở 45°) | 2,69× | 3 (đỉnh chân xúc giác) | – | 58 / 0 | 21 | G2_4 |
| Xoay thân +20° / −20°, chân đứng yên | 1,43× / 1,48× | 0 / 0 | 0 | 58 / 0 | 21 | G2_4 |
| Bụng ngửa 10°, lắc 10°, núm tơ −12° | 1,40× | 0 | – | 58 / 0 | 39 (sâu 88 mm) | G2_4 |
| Bụng mức cực: ngửa 15°, lắc 12°, núm tơ −20° | 1,87× | 0 | – | 58 / 0 | 58 (sâu 96 mm) | G2_4 |
| Nhấc từng chân 0,35 m (8 tư thế) | 1,52–2,68× | 0–3 | 0 | – | – | G2_5 |

| A2 | Kết quả | Bằng chứng |
| --- | --- | --- |
| Skeleton chồng mesh (trước, bên, sau, trên) | **đạt**: khớp háng ở mép ức, gối ở đỉnh vòm chân, vòng khớp ở cổ thắt, mũi chân ở mũi mesh; nanh, chân xúc giác, bụng, núm tơ trong khối | `qa/W07_shroud_spinner_G2_1_skeleton.png` |
| Bản đồ trọng số | **đạt**: mỗi chân chỉ ăn bone của nó, không loang sang chân bên cạnh hay sang thân (trừ cục gốc chung chân 1+2, cố ý theo thân); chỏm núm tơ gọn | `qa/W07_shroud_spinner_G2_2_weights.png` |
| Tư thế thử của họ A (nhấc từng chân, đi luân phiên, hạ thân, chồm, giương nanh, xoay thân, bụng) | **đạt**, còn ba chỗ giãn khu trú ở mục 5 | `qa/W07_shroud_spinner_G2_3_poses.png`, `_G2_4_head_turn_abdomen.png`, `_G2_5_lifts.png` |
| Vùng khó trong brief | gối, cục gốc chung, gốc háng, bụng–mai, chỏm núm tơ, nanh, chân xúc giác: xem mục 5 | như trên |
| Socket | đặt đúng chỗ, không trọng số: `ground`, `hit_origin` (trước nanh), `fx_head` (giữa hai mắt), `fx_abdomen` (tâm bụng), `fx_spinneret` (mũi núm tơ, trỏ ra sau-xuống). Không có socket vũ khí | `G2_1` (bone xám mảnh), `validation.json` A1.13 |

## 5. Còn lại (không chặn G2, ghi cho phiên animation)

1. **Bụng chồng lên mai.** Ở tư thế nghỉ, mép trước bụng đã nằm sâu 70 mm trong lưng sau mai (dáng của mesh). Ngửa bụng 10° làm sâu
   thêm 17 mm, ngửa 15° thêm 26 mm; chỗ đó khuất dưới bụng. Bụng nên ngửa hoặc lắc trong khoảng ±10°; bụng chúc xuống thì tách ra.
2. **`abdomen_02` uốn dải tơ dưới-sau.** Dải tơ là mặt lớn ít đỉnh (cạnh dài tới 26 cm), nên uốn núm tơ sẽ kéo dải đó: −12° giãn
   1,40× (ổn), −20° giãn 1,87×. Dùng `abdomen_02` để chĩa núm tơ ở góc nhỏ (≤ ~12°); cú quất bụng lớn làm bằng `abdomen_01`.
3. **Mở chân xúc giác 45°:** đỉnh chữ V giãn 2,69× (3 cạnh); texture vẫn liền (`G2_4`, ô đỉnh chân xúc giác).
4. **Nhấc chân 2 thật cao (0,35 m) và kéo sát thân:** mép trong khớp háng–đùi giãn 2,68×, nhưng chỉ ở cạnh ngắn ~2 mm dài thêm 4 mm,
   vòng thắt che bớt. Bước đi thường (0,22 m) chỉ giãn 1,46–1,62×.
5. **Đốt háng `_01` là FK.** Nhấc chân bằng control IK (đùi xoay ở khớp háng–đùi, nằm ngoài thân). Xoay đốt háng lên nhiều sẽ cắm vào ức.
6. **Chồm với đốt bàn chĩa tới:** vòng khớp ống–bàn gập mạnh, giãn 2,31× (2 cạnh), khu trú ở vòng khớp.
7. Hai đoạn chân rời đã bỏ khỏi mesh rig theo G1; GLB gốc còn nguyên. Khi export ở R8, bản rig khác GLB đúng 2 mảnh đó.
8. Rig editor của skill (`rig_editor_safe.py`) chỉ đọc khớp theo bảng xương người nên không dùng được cho skeleton nhện; muốn chỉnh
   khớp thì sửa `rig/_work/joints.json` hoặc `rig_spec.json` rồi chạy lại `w07_build.py` và `w07_qa.py` (khoảng 2 phút).

## 6. Các lượt sửa (số trước → sau)

1. **Trọng số rò dọc thanh chân.** Laplace chung làm khớp háng–đùi chân 1 nhận cả trọng số ống (0,34), có đỉnh 4–5 bone; 366 đỉnh
   phải cắt về 4. Sửa: Laplace riêng từng khớp, chỉ qua cạnh < 6 cm. Kết quả: tối đa 2 bone mỗi đỉnh. Cùng tư thế: nhấc L1
   3,04× → 1,83×, nhấc R1 4,37× → 1,72× (17 → 2 cạnh xấu).
2. **Tư thế thử vượt tầm với** (mũi chân lệch 7–30 mm ở đi, chồm, xoay): chỉnh bước và góc về trong tầm (chân không duỗi thẳng được
   quá tổng đùi + ống). Lệch → 0.
3. **Chỏm núm tơ.** Vùng chuyển tiếp 32°→62° cắt qua dải tơ dưới-sau: uốn −12° giãn 1,54×, −20° có 13 cạnh xấu. Đổi sang 15°→45°: 1,40×,
   0 cạnh xấu. Đã thử 20°→70°: 1,44×, 3 cạnh xấu.
4. **Dải khớp.** Nửa rộng 3,5 / 4 / 3 cm, chân xúc giác 3 cm cho giương nanh 4,73×, nhấc L2 3,41×. Nới lên 5 / 4,5 / 3,5 cm, chân xúc
   giác 6 cm: 2,69× và 2,68×; đi bộ 1,70× → 1,62×.
5. **Phép đếm xuyên:** thay phép thử pháp tuyến mặt gần nhất (nhảy số khi xoay thân cứng) bằng winding number (không đổi khi chuyển
   động cứng).

## 7. Kết luận

A1 14/14 đạt; A2 đủ ảnh, không còn mục đỏ chặn. **G2 duyệt 2026-10-27** (người dùng xem trong Blender). Đã xuất chỉ rig (R8,
chưa clip) vào `../rig_done/`: GLB, FBX, textures, bản sao .blend; reimport đạt (`rig.log`, `_work/r8_export.json`). Chưa làm
clip (R6+), chưa làm bản lab 2048, chưa đăng ký lab.
