# QA rig — P04_hive_sleeper · R2–R5 → **dừng ở G2**

Ngày 2026-10-26 · Opus 5.5 · route M (Blender 5.1.1 chạy nền, script riêng ở `rig/scripts/`, render và số QA dùng lại
`_batches/rig_v1/tools/rigbatch.py`, không sửa) · brief: [`rig_brief.md`](rig_brief.md) (G1 duyệt 2026-10-26) · 0 credit · GLB gốc chỉ
đọc · chưa commit.

**G2 duyệt 2026-10-27** (người dùng tự xem trong Blender). Đã xuất `../rig_done/` cùng ngày (chỉ rig, chưa clip): kết quả reimport ở
`rig.log` và `../rig_done/P04_hive_sleeper_rig_info.json`.

## 0. Bàn giao

| File | Nội dung |
| --- | --- |
| `P04_hive_sleeper_rig.blend` | mesh `P04_hive_sleeper` (một mesh, một skin; 5.528 đỉnh, 8.664 tam giác, 3 texture gốc đóng gói, byte giống GLB), skeleton runtime `P04_hive_sleeper_rig` (54 bone, 46 deform), rig điều khiển `P04_hive_sleeper_ctl` (62 bone `ctl_*`), không Action. Mở ra ở object mode, xem có texture |
| `validation.json` | A1.1–A1.14, kiểm rig điều khiển, số đo 14 tư thế thử |
| `qa/P04_hive_sleeper_G2_1_skeleton.png` | skeleton runtime chồng mesh (trước, trái, sau, trên) + rig điều khiển |
| `qa/P04_hive_sleeper_G2_2_weights.png` | trọng số: bone trội (4 góc) + từng nhóm có chú thích màu |
| `qa/P04_hive_sleeper_G2_3_poses.png` | 14 tư thế thử, tạo bằng **rig điều khiển** (IK tay, gối, roll) |
| `qa/P04_hive_sleeper_G2_4_closeups.png` | cận cảnh vùng khó: texture + bản đồ giãn cạnh |
| `qa/raw/` | ảnh gốc của các tờ trên |
| `scripts/` | `p04_common` (landmark, bảng bone, roll), `p04_weights` + `p04_skinmodel` (skin), `p04_ctl` (rig điều khiển), `p10_build` (R2+R3), `p20_qa` (R4+R5), `p21_sheets` (ghép ảnh), `pyimg`; `p00`–`p02` là R0–R1 |
| `_work/` | số đo R0–R1 (`probe/`), đề xuất G1, `build_report.json`, `validation_r1..r5.json` (lịch sử sửa) |

Dựng lại từ GLB gốc (dưới một phút):

```text
blender -b --factory-startup -P rig/scripts/p10_build.py      # R2 + R3 -> rig/P04_hive_sleeper_rig.blend
blender -b --factory-startup -P rig/scripts/p20_qa.py         # R4 + R5 -> rig/validation.json, rig/qa/raw/
python -I rig/scripts/p21_sheets.py                            # -> rig/qa/P04_hive_sleeper_G2_1..4.png
```

## 1. R2 — skeleton runtime và rig điều khiển

- **Runtime:** đúng bảng bone của brief (54 = 46 deform + `root`, `cog` + 6 socket), tên H lõi + `neck_02`, `L/R_Finger`, `dome_01..03`,
  7 chuỗi áo × 2. Rest = tư thế bò của mesh, kích thước thật (đỉnh vòm 1,0801 m, S = 1,75695). Một chỉnh so với ảnh G1: đầu bone ba vòm
  dời về **tâm mặt cầu khớp trên mesh** (lượt skin đầu): vòm trước (0; −0,439; 0,848) bán kính 0,224 m, giữa (0; −0,185; 0,808) 0,167 m,
  sau (0; 0,099; 0,686) 0,167 m.
- **Roll:** trục X cục bộ = +X thế giới chiếu lên bone, hai bên như nhau; `Clavicle` giữ Z lên (chung với U04).
- **Rig điều khiển** (hai armature như D01, runtime theo control bằng Copy Transforms thế giới):
  - tay: `ctl_<S>_Hand_IK` (tại đốt bàn trên sàn, con của `ctl_root`) → `ctl_<S>_Fingertip_roll` → `ctl_<S>_Palm_roll` →
    `ctl_<S>_Wrist_target` (đích IK 2 xương); `Hand`, `Finger` chép xoay từ target; pole `ctl_<S>_Elbow_pole` sau khuỷu (góc pole
    90,38° / 89,54°, dò tới 0,005°);
  - chân: `ctl_<S>_Knee_IK` (tại gối, dọc ống chân): `Thigh` IK một xương nhắm vào gối, `Calf` chép xoay; `Foot`, `Toe` FK;
  - công tắc `ik_arm_L/R`, `ik_leg_L/R` (driver vào influence); xoắn tay bằng driver SWING_TWIST; 8 bone collection.
- **Kiểm rig điều khiển** [đo]: control ở rest đưa runtime về rest, lệch 0,022 mm ở cánh tay và cẳng tay (dung sai bộ giải IK), mesh lệch
  0,14 mm; 14 driver hợp lệ; IK tay tới đích sai 0,01 mm; xoay bàn tay 40° quanh trục đứng thì `ForeArm_twist` xoay 23,2°; xoay cánh tay
  30° thì `UpperArm_twist` bù 15,0°; đặt gối 10 cm ra trước (quá tầm đùi) thì gối hụt 1,5 cm (đúng tính chất IK một xương, xem §5).

## 2. R3 — skin

Trọng số theo vùng trên mesh đã hàn (5.431 nút; đỉnh trùng vị trí dùng chung một bộ trọng số), rồi làm mịn Laplace theo nghịch đảo
chiều dài cạnh; tối đa 4 ảnh hưởng, bỏ < 0,01, chuẩn hoá. 34 mảnh: áo lớn (áo + mũ + mặt + tóc + vòm + vạt mông), chân + bụng, hai tay, hai
tay áo ngắn, 6 mảnh vải rời, 22 mảnh ruy băng.

| Vùng | Cách gán |
| --- | --- |
| Thân áo | chuỗi dọc trục Y: `pelvis` → `spine_01` → `spine_02` → `chest` |
| Đầu, cổ, mũ | trường điều hoà trên mesh: 1 ở lõi đầu (mặt, tóc, vành mũ: phía trước mặt phẳng khớp đầu), 0 ở vòm và thân phía sau cổ; đổi ra `chest` / `neck` / `neck_02` / `head`. Nửa sau mũ là dải chuyển tiếp |
| Vai | `Clavicle` (≤ 45 %) và `UpperArm` (≤ 55 %) theo khoảng cách tới xương |
| Vạt áo | 2 xương mỗi chuỗi theo độ cao; vạt sườn trộn chuỗi vai → chuỗi sườn theo Y; vạt mông L/R; yếm. Trên đỉnh chuỗi chuyển dần về thân |
| Vải sát chi | vạt cạnh cánh tay theo `UpperArm` ≤ 50 %, cạnh cẳng tay `ForeArm` ≤ 35 %, cạnh đùi `Thigh` ≤ 40 % (thay vật lý vải) |
| Ba vòm | khớp mặt cầu; **cứng** ở chỏm (138 / 58 / 131 nút giữ cố định), rãnh giữa hai vòm và chân vòm để trộn. Loại khỏi vòm 122 nút màu vải lanh và 18 nút sát sọ (phần mũ áp vào vòm trước) |
| Tay | chuỗi theo đường tay: `UpperArm`, `ForeArm`, `Hand`, `Finger`; xoắn tăng tuyến tính (công thức của skill); ngón cái theo `Hand`; đầu tay trong áo trộn `Clavicle` |
| Chân + bụng | chuỗi theo đường chân: `Thigh`, `Calf`, `Foot`, `Toe`; `pelvis` ở khớp hông; tấm bụng theo trục Y |
| Tay áo ngắn | `UpperArm` 75 % + `UpperArm_twist` 25 %, mép trên trộn `Clavicle` / `chest` |
| Ruy băng | chép trọng số của mặt áo / vòm ngay dưới (không bám tay chân), làm mịn dọc dải; 2 nút một bộ trọng số chung |

Sức khoẻ trọng số [đo]: tối đa 4 ảnh hưởng, tổng 1 ± 4,5e-8, 0 đỉnh trống, 0 trọng số trên bone không deform, cả 46 bone deform đều được
dùng, 56 cặp đỉnh trùng vị trí hở 0 mm ở mọi tư thế.

## 3. R4 — A1 (`validation.json`)

| # | Kiểm tra | Kết quả | Số đo |
| --- | --- | --- | --- |
| A1.1 | một skin, một mesh thân | **đạt** | `P04_hive_sleeper` → `P04_hive_sleeper_rig` |
| A1.2 | tên bone đúng chuẩn, không trùng | **đạt** | 54 bone, khớp bảng đã duyệt |
| A1.3 | một cây, gốc `root` | **đạt** | |
| A1.4 | mọi đỉnh có trọng số | **đạt** | 0 đỉnh trống |
| A1.5 | tổng trọng số = 1 ± 1e-6 | **đạt** | sai lệch tối đa 4,5e-8 |
| A1.6 | ≤ 4 ảnh hưởng | **đạt** | 4 |
| A1.7 | chỉ số joint hợp lệ | **đạt** | 0 nhóm lạ, 0 trọng số trên bone không deform |
| A1.8 | bind khớp phân cấp | **đạt** | khớp nối hở 0 m; mesh ở bind lệch đầu vào 1,8e-7 m. Ma trận bind nghịch đảo do exporter ghi, kiểm lại trên GLB ở R8 |
| A1.9 | mesh = GLB đã scale | **đạt** | lệch tối đa 9,5e-8 m (so theo chỉ số đỉnh, cùng importer) |
| A1.10 | texture không đổi | **đạt** | 3/3 ảnh đóng gói trùng byte ảnh trong GLB (sha256) |
| A1.11 | chiều cao ±2 % | **đạt** | 1,0801 m / 1,08 m (0,60H) |
| A1.12 | chạm đất | **đạt** | z thấp nhất 0,0 |
| A1.13 | bone không trọng số chỉ là socket | **đạt** | `root`, `cog` (tổ tiên cấu trúc) + 6 socket |
| A1.14 | scale 1, không âm, xoay đã áp dụng | **đạt** | ma trận ba object = đơn vị |

## 4. R5 — A2 (ảnh)

| Mục A2 | Kết quả | Bằng chứng |
| --- | --- | --- |
| Skeleton chồng mesh | **đạt**: vai, khuỷu, cổ tay, hông, gối, cổ chân, cổ, đầu nằm trong khối; khuỷu gập sẵn về sau | `G2_1` |
| Bản đồ trọng số | **đạt**: không loang sang bone xa; vòm cứng, rãnh và chân vòm trộn; đầu/mũ chuyển dần qua cổ; vạt chuyển dần từ thân xuống chuỗi | `G2_2` |
| Tư thế thử | **đạt, có ghi chú** (bảng dưới; mũ ở góc đầu lớn, vải chạm tay khi vặn lớn) | `G2_3`, `G2_4` |
| Vùng khó của brief | mũ: ghi chú 1; vòm: đạt; vai và vai áo: đạt; bụng: đạt; vạt áo: ghi chú 2; bàn tay: đạt | `G2_4` |
| Socket | không có socket vũ khí (G1). `fx_head`, `fx_chest`, `fx_hand_L/R`, `hit_origin`, `ground` đặt đúng chỗ, thấy trong `G2_1` (bone xám mảnh) | `G2_1` |

Tư thế thử (tạo bằng rig điều khiển; giãn = tỉ lệ dài cạnh lớn nhất so với rest, cạnh ≥ 4 mm; "cạnh xấu" = ngoài 0,5–1,6×; "vải lọt chi"
= đỉnh vải mới nằm trong ống quanh cẳng tay, cánh tay dưới, đùi dưới, ống chân):

| Tư thế | Thử gì | Giãn tối đa | Cạnh xấu | Vải lọt chi |
| --- | --- | --- | --- | --- |
| `crawl_contact` | tay trái + gối phải ra trước, hai chi kia ra sau, thân nghiêng | 1,56× | 0 | 25 |
| `crawl_lift` | nhấc tay trái (ngón rủ), nhấc gối phải | 1,96× | 1 | 5 |
| `reach_L` | vươn tay trái ra trước 70°, cổ tay duỗi | 2,32× | 8 | 8 |
| `knee_lift_L` | nhấc gối trái 12 cm | 1,10× | 0 | 0 |
| `twist` | vặn thân 3 × 8° (tay, gối giữ trên sàn) | 2,10× | 4 | 60 |
| `side_bend` | nghiêng sườn 3 × 6° | 1,94× | 0 | 48 |
| `arch_up`, `sag_down` | cong lưng lên, võng lưng xuống | 1,86×, 1,64× | 0, 0 | 0, 2 |
| `head_up`, `head_down`, `head_turn` | ngẩng 39°, cúi 35°, quay 50° (chia cho `neck`, `neck_02`, `head`) | 4,37×, 3,50×, 3,48× | 19, 17, 23 | 0 |
| `palm_lift_L` | nhấc gót tay 35° quanh đốt bàn (ngón úp) | 1,49× | 0 | 1 |
| `pronate_L` | xoay bàn tay 35° trên sàn (xoắn cẳng tay) | 1,19× | 0 | 4 |
| `domes` | lắc ba vòm 12° | 1,92× | 1 | 0 |

Mức tham chiếu, rig U01 đã qua G2 (cùng cách đo): hạ tay 4,29×, gập khuỷu 3,67×, đi bộ 3,55×, quay đầu 1,60×.

Lịch sử sửa (lượt 1 → lượt cuối; chi tiết trong `rig.log`): bước bò 4,58 → 1,56×; ưỡn lưng 8,12 → 1,86×; lắc vòm 5,96 → 1,92×; nghiêng
sườn 5,97 → 1,94×; quay đầu 12,33 → 3,48×; ngẩng đầu 5,50 → 4,37×.

## 5. Khuyết điểm còn lại và ghi chú bàn giao

1. **Mũ trùm ở góc đầu lớn.** Ngẩng 39°, cúi 35° hoặc quay 50°: giãn cạnh 3,5–4,4× ở chỗ mũ áp vào vòm trước (vòm cứng theo `chest`). Nhìn
   ảnh: vải mũ dồn lại hoặc căng ra trên cả vùng, không rách, không lộ khe. Clip nên giữ đầu trong khoảng ±30°. Đã thử nới vòm trước gần
   mũ: ngẩng đầu tệ hơn (26,9×) nên bỏ.
2. **Vạt vai chạm tay khi vặn hoặc nghiêng thân lớn.** Tay chống cố định, vặn 24° hoặc nghiêng 18°: 48–60 đỉnh vạt vai lọt vào ống cẳng
   tay / cánh tay; nhìn ảnh không lộ rõ. Cần spring bone + collider cho chuỗi `*shirt*` ở engine, hoặc giữ biên độ vặn nhỏ hơn.
3. **Rãnh giữa hai vòm** bị ép khi ưỡn lưng hoặc lắc vòm (≈ 1,9×): đúng tính chất vòm cứng.
4. **Chân dùng gối làm điểm tựa:** `Thigh` IK một xương nhắm vào `ctl_<S>_Knee_IK`; đặt gối quá tầm đùi thì gối hụt (1,5 cm trong phép
   thử). Khi làm clip, giữ độ cao `ctl_cog` hợp với vị trí gối.
5. **Xoắn cẳng tay** lấy theo trục Z cục bộ của bàn tay, gần trùng trục cẳng tay ở tư thế này (lệch 30°): xoay tay 40° cho xoắn 23°
   thay vì 20°. Driver không xuất được, phải bake vào clip ở R8.
6. **Bàn tay to** (+48 % so với người 1,8 m) giữ nguyên như mesh. Một bone `Finger` nên bốn ngón cong cùng nhau; ngón cái theo `Hand`.
7. **Engine:** spring bone cho 7 chuỗi `*shirt*` (vạt áo), có thể thêm lắc nhẹ cho `dome_0x`; ruy băng không có bone, đi theo bề mặt.
   Rig điều khiển, IK, roll, pole, driver chỉ nằm trong `.blend`.
8. **Rig editor của skill không dùng:** nó giả định người đứng T-pose và nút tính lại trọng số sẽ ghi đè trọng số riêng của P04. Sửa khớp
   ở `scripts/p04_common.py` (`LM`) rồi chạy lại `p10_build` → `p20_qa` → `p21_sheets` (dưới một phút).
9. **Chung với U04:** tên lõi, phân cấp, `neck_02`, `L/R_Finger`, quy tắc roll, `cog` giữa thân, bỏ socket vũ khí như bố cục U04 (U04 đang
   chờ G1). Người dùng đổi gì ở G1 của U04 thì P04 dựng lại theo (vài phút, rồi chạy lại R4–R5).
10. Python phụ trợ chạy `python -I`; PIL nằm ở user site-packages (bị `-I` bỏ) nên `pyimg.py` thêm đúng đường dẫn đó.
