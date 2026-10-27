# QA rig — W02_gibbet_crow · R2–R5 → **dừng ở G2**

Ngày 2026-10-26 · Opus 5.5 · route M (script riêng `rig/scripts/`, Blender 5.1.1 chạy nền, không MCP, không cổng 9876) · 0 credit ·
brief: [`rig_brief.md`](rig_brief.md) (G1 duyệt: di chuyển C, scale A, gốc giữa hai chân, bảng bone họ W chim). Chưa làm clip, chưa
export GLB/FBX (ngoài phạm vi lượt này). Chưa commit.

## 0. Bàn giao

| File | Nội dung |
| --- | --- |
| `W02_gibbet_crow_rig.blend` | mesh `W02_gibbet_crow` (1 mesh, 1 skin, 6.076 đỉnh, 9.105 tam giác, 3 texture 4096 đóng gói đúng byte GLB), skeleton runtime `W02_gibbet_crow_rig` (32 bone), rig điều khiển `W02_gibbet_crow_ctl` (38 bone `ctl_*`), 24 fps, không Action |
| `validation.json` | A1 (14/14), kiểm roll, số đo mọi tư thế thử, báo cáo dựng (`build`) |
| `qa/W02_gibbet_crow_G2_1_skeleton.png` | skeleton chồng mesh: trước, bên, sau, trên xuống, cận cổ–đầu–mỏ, cận chân |
| `qa/W02_gibbet_crow_G2_2_weights.png` | màu bone trội 4 góc + 12 bản đồ trọng số từng bone |
| `qa/W02_gibbet_crow_G2_3_poses_ground.png` | 10 tư thế trên đất, 3 góc mỗi tư thế, có số đo |
| `qa/W02_gibbet_crow_G2_4_wings_flight.png` | vỗ cánh lên/xuống, bay vỗ lên/xuống (thu chân), cận cảnh mỏ, quay đầu, bước |
| `qa/W02_gibbet_crow_G2_5_stretch.png` | bản đồ độ giãn của các tư thế nặng nhất |
| `qa/W02_gibbet_crow_G2_6_fold_closeups.png` | cận cảnh cánh gập (áo choàng, sát thân) và bước khi cánh gập: lông cánh so với "quần" và giò |
| `qa/raw/` | ảnh gốc (`poses/`, `extra/`, `cu/`, X-ray, trọng số) và `poses_metrics.json` |
| `scripts/` | `w02_build.py` (R2–R3), `w02_validate.py` (R4 + ảnh tĩnh R5), `w02_pose.py` (tư thế thử), `w02_g2_sheets.py` (tờ G2), `w02_presets.json` (preset gập/bay, độ rộng chuyển trọng số), `w02_qa_poses*.json`, `w02_diag_edges.py`; R1: `w02_r1_*.py`, `w02_g1_*.py` |

Dựng lại từ GLB gốc (khoảng 1 phút):

```text
blender -b --factory-startup -P rig/scripts/w02_build.py -- <GLB> <rig_dir> rig/scripts/w02_presets.json
blender -b --factory-startup rig/W02_gibbet_crow_rig.blend -P rig/scripts/w02_validate.py -- <rig_dir> <GLB>
blender -b --factory-startup rig/W02_gibbet_crow_rig.blend -P rig/scripts/w02_pose.py -- rig/qa/raw/poses rig/scripts/w02_qa_poses.json 720 front,left,three_quarter,top "" 1
python -I rig/scripts/w02_g2_sheets.py rig
```

## 1. Đầu vào

- GLB chỉ đọc (sha256 `9b659d3d…8f5b`), importer hàn đỉnh trùng (6.076 đỉnh; hàn khoảng cách: 5.677 đỉnh, 92 mảnh).
- Scale ×1,6028 (sải cánh 1,602 m = 0,89H), dời +0,145 m theo Y để `root` nằm giữa hai bàn chân; chân chạm z = 0. Đỉnh đầu 0,566 m
  (0,314H), cao tới chóp cánh 0,752 m (dáng trưng), dài mỏ → đuôi 0,854 m.

## 2. Skeleton runtime và rig điều khiển (R2)

- **32 bone runtime**, đúng bảng G1 và `SKELETON_STANDARD.md` §3 "Họ W, nhóm chim": 24 deform + `root`, `cog` + 6 socket. Khớp lấy đúng
  toạ độ G1 (`_work/r1/joints_proposal.json`), không chỉnh thêm.
- **Roll** (kiểm tự động, `validation.json` → `roll_test`, 19/19 đạt): chân X = trục gập (pháp tuyến mặt phẳng hông–gối–cổ chân), +X gập
  thêm ở mọi khớp, hai bên; cánh X = pháp tuyến cánh, +X gập (vai và cổ tay về mép sau, khuỷu về mép trước); thân, cổ, đầu, mỏ, đuôi X = +X
  thế giới (+X cúi, há mỏ, nhấc đuôi). Tư thế đối xứng: X giữ dấu, Y và Z đổi dấu.
- **Rig điều khiển** `W02_gibbet_crow_ctl` (38 bone, chỉ trong `.blend`): runtime theo bằng Copy Transforms, rest trùng (lệch 1,8e-7).
  - Thân/cổ/đầu/đuôi: FK `ctl_cog`, `ctl_pelvis`, `ctl_spine_01`, `ctl_chest`, `ctl_neck_01..03`, `ctl_head`, `ctl_beak`, `ctl_tail_01..02`.
  - Chân: `ctl_L_Foot_IK` (control tiếp xúc ở đệm bàn chân trên đất), `ctl_L_Heel` (xoay giò quanh đệm bàn), `ctl_L_Toe` (gập 3 ngón, đứng
    yên trên đất khi nhấc gót), `ctl_L_Knee_pole` (trước gối); IK 2 xương đùi–cẳng tới cổ chân (góc pole dò số, rest lệch < 0,001 mm), giò
    hướng về đệm bàn bằng Damped Track.
  - Cánh: FK `ctl_L_Wing_01..03`; thanh `ctl_L_Wing_fold` (kéo theo trục Y 0 → 10 cm = gập 0 → 1, dáng rủ như concept) và
    `ctl_L_Wing_flight` (0 → 1 = xoay mặt cánh 90° quanh trục cánh ở vai, lông kéo ra sau để bay). Preset cộng *trước* FK (như cha), nên FK
    vẫn chỉnh thêm được; preset ở `scripts/w02_presets.json`.
  - `ctl_root["feet_follow_body"]` 0 → 1: chân IK theo `ctl_cog` (thu chân khi bay; dùng khi `ctl_root` đứng yên).
  - Bone collection: Body, Neck_Head, Tail, Wings_FK, Wing_Sliders, Legs_IK (Legs, MCH ẩn). Màu: trái đỏ, phải xanh, giữa vàng.

## 3. Trọng số (R3)

Theo cách của lô rig_v1 §2b (không dùng bone heat của Blender), mọi số ở `validation.json` → `build`:

- **Thân**: tham số dọc chuỗi `pelvis`–`spine_01`–`chest` (chuyển ±5 cm); vùng mông lùi dần sang `tail_01` theo trục đuôi.
- **Cổ**: trường điều hoà trên mesh (ngực, lưng = 0; sọ + mỏ = 1) chia `chest` → `neck_01..03` → `head` quanh cả chu vi cổ. Cách này thay
  cho khoảng cách tới xương vì chuỗi cổ nằm sát gáy: họng gắn cứng vào `head` làm mổ giãn 9,2×, nay 2,7×.
- **"Quần" lông**: `L/R_Thigh`, `Calf` theo khoảng cách, chỉ trong khối quần (dưới hông, giữa ngực và hậu môn, lùi xa hơn ở hai bên).
- **Cánh**: trường điều hoà (dải giữa thân |x| < 0,07 m = 0, cánh |x| > 0,20 m = 1) trộn `chest`/`spine_01`/`neck_01` với chuỗi cánh; trong
  cánh, tham số dọc chuỗi vai–khuỷu–cổ tay–chóp, chuyển ±7 cm ở khuỷu, ±8 cm ở cổ tay.
- **Mỏ**: cắt vùng mỏ ở khoé miệng, mảnh không chứa sống mỏ trên = hàm dưới (48 đỉnh) → `beak` 100 %.
- **Mảnh rời**: 47 lông cổ cứng theo trọng số ở gốc từng mảnh; 36 lông rời trên cánh dán theo tấm cánh bên dưới; 3 mảnh đuôi theo chuỗi
  `pelvis` → `tail_01` → `tail_02`; 2 mắt theo `head`; chân vảy theo chuỗi `Calf`–`Foot`–`Toe`, ngón sau theo `Foot`.
- Làm mịn Laplace 16 lượt trên mảnh chính, tối đa 4 ảnh hưởng, bỏ < 0,01, chuẩn hoá; đỉnh trùng ở đường nối UV cùng trọng số.

## 4. A1 — kiểm tự động (R4): **14/14 đạt**

Kiểm trên file nguồn `.blend` vì lượt này không export; A1.1, A1.7, A1.8 kiểm lại trên glTF ở R8.

| # | Kết quả | Đo |
| --- | --- | --- |
| A1.1 | đạt | 1 mesh có skin, 1 Armature modifier tới `W02_gibbet_crow_rig`, 1 material |
| A1.2 | đạt | 32 tên đúng bảng, không trùng, chỉ `[A-Za-z0-9_]` |
| A1.3 | đạt | một cây, gốc `root` |
| A1.4 | đạt | 0 đỉnh trống / 6.076 |
| A1.5 | đạt | sai tổng tối đa 4,4e-8 |
| A1.6 | đạt | tối đa 4 (1: 1.959 đỉnh, 2: 1.947, 3: 748, 4: 1.422) |
| A1.7 | đạt | 24 vertex group = 24 bone deform |
| A1.8 | đạt | phân cấp rest 1,2e-7; runtime theo rig điều khiển ở rest 1,8e-7 |
| A1.9 | đạt | nhập lại GLB + scale + dời: lệch 0 m (cùng thứ tự đỉnh) |
| A1.10 | đạt | sha256 3 ảnh đóng gói = ảnh nhúng trong GLB |
| A1.11 | đạt | sải cánh 1,602 m (0,89H, lệch 0,001 %); quyết định G1: đo bằng sải vì rest dang cánh |
| A1.12 | đạt | z thấp nhất 0 |
| A1.13 | đạt | bone không trọng số: 6 socket + `root`, `cog` (tổ tiên cấu trúc) |
| A1.14 | đạt | mesh, rig, rig điều khiển: scale 1, không xoay, gốc 0 |

## 5. A2 — ảnh QA (R5)

**Skeleton chồng mesh** (`G2_1`): khớp nằm trong khối; vai ở chân cánh cạnh lông cổ; khuỷu và cổ tay dọc mép trước dày của cánh; gối trong
"quần" phía trước, cổ chân ở mép dưới "quần", đệm bàn ở gốc ngón; chuỗi cổ sát gáy, đầu từ đáy sọ tới gốc mỏ; hàm dưới dọc mỏ dưới.

**Bản đồ trọng số** (`G2_2`): không loang sang bone xa. Cánh không dính chân; "quần" không lên ngực; hàm dưới không lan lên mỏ trên.

**Tư thế thử** (`G2_3`, `G2_4`, bản đồ giãn `G2_5`). Độ giãn = tỉ lệ dài cạnh (cạnh ≥ 3 mm) so với rest, max(q, 1/q); cạnh lỗi = ngoài
[0,5; 1,6]. Mức tham chiếu rig người đã duyệt: U01 hạ tay 4,3×, đi 3,6×.

| Tư thế | Dựng bằng | Giãn tối đa | Cạnh lỗi | Không gập cánh |
| --- | --- | --- | --- | --- |
| gập cánh như concept (áo choàng rủ tới đất) | `fold` = 1 | 3,01× | 45 | – |
| gập sát thân | FK vai (50; 0; −85), khuỷu 30, cổ tay 40 | 4,62× | 49 | – |
| xoè doạ | FK cánh nâng + chìa trước, đuôi, há mỏ | 1,58× | 0 | – |
| mổ (thân chồm 25°, cổ + đầu cúi, há mỏ 25°) | FK, cánh gập 0,6 | 3,26× | 12 | 2,72×, 6 |
| xoay cổ + đầu 60° | FK, cánh gập | 3,01× | 54 | 3,35×, 8 |
| há mỏ 30° | `ctl_beak` | 3,01× | 45 | 1,23×, 0 |
| bước (chân trái lên trước 13 cm, nhấc 5 cm) | IK | 3,01× | 55 | 2,42×, 10 |
| nhún bật (thân hạ 9 cm, chồm 12°) | IK | 3,38× | 68 | 3,38×, 23 |
| nhấc đuôi 37° | FK | 3,01× | 45 | 1,40×, 0 |
| vỗ lên hết biên (mặt cánh đứng) | FK vai −45° | 1,40× | 0 | – |
| vỗ xuống hết biên | FK vai +60° | 1,91× | 0 | – |
| chỉ xoay cánh ngang để bay | `flight` = 1 | 3,05× | 4 | – |
| bay vỗ lên, thu chân 6/5 cm | `flight` + FK Z −50° + IK theo thân | 2,73× | 34 | – |
| bay vỗ xuống, thu chân 6/5 cm | `flight` + FK Z +45° | 2,73× | 30 | – |
| thu chân mạnh 10/10 cm (để so) | IK theo thân | 10,58× | 86 | – |

Các tư thế trên đất giữ cánh gập (dáng đứng của idle/walk), nên số đo của chúng gồm cả 45 cạnh lỗi của nếp cổ tay cánh khi gập.

**Vùng khó của brief:**

| Vùng | Kết quả |
| --- | --- |
| Gốc cánh dính sườn | vỗ lên/xuống ≤ 1,9×, 0 cạnh lỗi; xoay cánh 90° để bay 3,05×, 4 cạnh: chịu được, không cần `L_WingRoot` |
| Gập cánh như concept | đọc giống concept (trước và sau: cánh rủ như áo choàng tới đất). Nếp cổ tay cánh giãn tới 3,0× (45 cạnh, tấm cánh liền gập 50°). Gập sát thân 4,6× và lộ mặt dưới cánh màu xám nhạt (xem mục 6) |
| Lông rời | lông cổ đi cứng theo gốc, không xuyên sọ khi quay đầu 60° ở góc nhìn đã chụp; lông rời trên cánh đi theo tấm cánh |
| "Quần" lông | bước 2,4×, nhún 3,4× (mép trong và sau "quần"); thu chân mạnh khi bay rách mép sau (10,6×) |
| Mỏ | há 30° sạch (1,23×), chỉ hàm dưới mở |
| Ngón chân | một `L_Toe` gập cả 3 ngón trước; ngón sau đứng yên theo giò |
| Lông cánh sát đùi | khi gập (áo choàng, sát thân) và khi bước với cánh gập, lông cánh nằm ngoài "quần", không thấy xuyên ở 4 góc cận (`G2_6`) |

**Socket**: không có vũ khí; 6 socket hiện trên `G2_1` (xám mảnh), đặt đúng chỗ của brief.

## 6. Khuyết điểm còn lại (người duyệt chọn chấp nhận hay sửa)

1. **Nếp cổ tay cánh khi gập** (3,0×, 45 cạnh): tấm cánh liền một mảnh, gập cổ tay 50° thì lông bàn cánh chồng lên lông cẳng cánh và dải
   giữa bị kéo. Ở các góc đã chụp không thấy rách. Dải chuyển rộng (±7/±8 cm thay ±4,5 cm) giảm cạnh lỗi của dáng gập 62 → 45 nhưng
   tăng giãn tối đa của gập sát thân (3,6 → 4,6×); giữ dải rộng vì dáng gập concept là dáng dùng nhiều.
2. **Thu chân khi bay**: chỉ thu vừa (≤ 6 cm ra sau, 5 cm lên) là sạch (2,7×); thu mạnh hơn làm rách mép sau "quần" (tới 10,6×). Phiên
   animation nên giữ chân thả nhẹ khi bay, hoặc thêm bone phụ ở mép sau "quần" nếu cần thu hẳn.
3. **Gập sát thân** (4,6×): lộ mặt dưới cánh (texture xám nhạt của góc FRONT) ra ngoài vì cánh xoay ra sau mà không lật; muốn mặt lưng cánh
   ra ngoài phải thêm xoay 90° như khi bay (gập kiểu chim thật). Dáng concept (áo choàng) không bị vì lông vẫn rủ xuống.
4. **Nhún sâu** (thân hạ 9 cm): mép trong và sau "quần" giãn tới 3,4×.
5. **Quay đầu 60°**: gáy sát gốc cánh giãn tới 3,35× (8 cạnh).
6. Kiểm A1.1, A1.7, A1.8 mới trên `.blend`; kiểm lại trên GLB khi export (R8, phiên animation).

## 7. Câu hỏi ở G2

1. Dáng gập (thanh `fold`) như ảnh `G2_3` có đúng ý "gập cánh như concept" không, hay muốn sát thân hơn (chấp nhận khuyết điểm 3)?
2. Mức giãn hiện tại (2,4–3,4× ở tư thế thường, 4,6× ở gập sát thân) có chấp nhận được không?
3. Khi bay có cần thu hẳn chân không (khuyết điểm 2)?
