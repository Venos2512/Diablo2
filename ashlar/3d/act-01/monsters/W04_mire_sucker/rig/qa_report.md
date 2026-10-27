# QA report — W04_mire_sucker (R2–R5, G2 duyệt 2026-10-27; xuất R8 chỉ rig ở mục 8)

2026-10-26 · Opus 5.5 · route M (script riêng trong `rig/scripts/`) · Blender 5.1.1 chạy nền · **0 credit**. Brief đã duyệt ở G1:
[`rig_brief.md`](rig_brief.md). Số đo: [`validation.json`](validation.json). Nhật ký: [`rig.log`](rig.log).

## 1. Kết quả

| Hạng mục | Kết quả |
| --- | --- |
| A1 kiểm tự động (`validation.json`) | **14/14 đạt** |
| Thử chức năng rig điều khiển | **đạt hết** (IK chân, hạ thân, master cánh, IK vòi, chuyển FK, đường nối) |
| A2 ảnh QA | 5 tờ ở `qa/` (dưới); 28 tư thế thử, độ giãn lớn nhất 2,63× (hạ thân 15 cm), các tư thế khác ≤ 2,31× |
| Còn lại | các giới hạn tầm cử động ở mục 5; không mục nào đỏ theo QA_CHECKLIST A |

## 2. File

| File | Nội dung |
| --- | --- |
| `W04_mire_sucker_rig.blend` | mesh `W04_mire_sucker_Body` (5.640 đỉnh, 10.633 mặt; 3 texture 4096 gốc, nhúng), skeleton runtime `W04_mire_sucker_Skeleton` (41 bone, ẩn), rig điều khiển `W04_mire_sucker_Control` (51 bone `ctl_*`), 24 fps, viewport có texture. Không Action |
| `validation.json` | A1.1–A1.14, thử chức năng, `A2_poses` (độ giãn, xuyên từng tư thế) |
| `qa/W04_mire_sucker_G2_1_skeleton.png` | skeleton chồng mesh X-ray: trước, bên, sau, trên |
| `qa/W04_mire_sucker_G2_2_weights.png` | màu trộn theo trọng số (5 góc) + trọng số từng bone ở vùng khó (9 ô) |
| `qa/W04_mire_sucker_G2_3_wings.png` | cánh: dang, vặn lá, vỗ lên/xuống, gập, xoè lá, bản đồ giãn, cận gốc cánh |
| `qa/W04_mire_sucker_G2_4_legs_body.png` | nhấc từng chân, bước, hạ thân, nghiêng, đâm vòi, ghim vòi, cận háng và vòi |
| `qa/W04_mire_sucker_G2_5_abdomen_head.png` | lắc bụng, hai túi ngược chiều, hạ/nâng bụng, đầu cúi/ngửa/quay, cận khe túi, tấm lưng, chân sau, cổ |
| `qa/raw/` | ảnh rời (render Workbench, texture thu về 1024 trong bộ nhớ) |
| `scripts/` | toàn bộ script dựng lại được (mục 6) |

## 3. A1 (đo, `validation.json`)

| # | Đạt | Số đo |
| --- | --- | --- |
| A1.1 một skin, một mesh | đạt | 1 skin, 1 node mesh, 1 primitive (GLB tạm) |
| A1.2 tên bone | đạt | 41 tên đúng bảng G1 (`SKELETON_STANDARD.md` §3, họ W côn trùng), không trùng, chỉ `[A-Za-z0-9_]`, tiền tố `L_`/`R_` |
| A1.3 một cây | đạt | gốc duy nhất `root` |
| A1.4 đỉnh trống | đạt | 0 / 5.640 |
| A1.5 tổng trọng số | đạt | lệch tối đa 1,3e-7 (GLB), 4,5e-8 (Blender) |
| A1.6 ≤ 4 ảnh hưởng | đạt | tối đa 4; không `JOINTS_1` |
| A1.7 chỉ số joint | đạt | 2…38 trong 41 joint; 34 joint có trọng số |
| A1.8 ma trận bind | đạt | sai tối đa 4,4e-7 |
| A1.9 reimport khớp mesh | đạt | 7,6e-7 m hai chiều (mesh nguồn = GLB ×1,56677 trừ 18 đỉnh hai dải sát đất, G1). Importer glTF tự tạo mesh `Icosphere` (hình bone) khi nạp lại, bỏ qua |
| A1.10 texture | đạt | sha256 ảnh nhúng trùng GLB gốc theo vai trò (baseColor, metallicRoughness, normal) |
| A1.11 chiều cao | đạt | 1,566 m (lệch 0,0 %) |
| A1.12 chạm đất | đạt | y thấp nhất 0,000 (vuốt trước); vuốt sau 0,047 m, giữ rest theo G1 |
| A1.13 bone không trọng số | đạt | chỉ `root`, `cog` và 5 socket |
| A1.14 transform | đạt | scale 1, xoay 0, không scale âm; bone GLB lệch scale < 1e-5 |

A1.1, A1.3, A1.5–A1.8, A1.10–A1.12, A1.14 đo trên một **GLB tạm** trong `rig/_work/check/`, xoá ngay sau khi kiểm (lượt này không
export). Mesh rig khớp từng đỉnh với GLB gốc đã scale trừ hai dải (lệch 0,0), GLB gốc không đổi (sha256 kiểm lại cuối lượt).

## 4. Thử chức năng rig điều khiển (`validation.json` → `function_tests`)

| Phép thử | Kết quả |
| --- | --- |
| rest với IK bật | runtime trùng rest: lệch xoay 0,0°, vị trí 6e-7 m (góc pole tìm tự động: −90° cả 4 chân) |
| control bàn chân nâng 10 cm | bàn chân bám control lệch 0,00–0,01 mm, gối dịch 9,2–9,4 cm |
| hạ thân 15 cm (`ctl_cog`) | bàn chân trượt 0,00–0,01 mm; gối trước gập thêm 21,9°, gối sau 82,2° |
| nâng thân 2 cm / 6 cm | chân trước bám; **chân sau trượt 7,7 mm / 42,8 mm** vì chân sau duỗi 98 % ở rest (thông tin, mục 5) |
| `ctl_L/R_Wing` xoay X ±30° | +X nâng cả hai cánh (đỉnh +17,1 cm), −X hạ (−29,3 cm), hai bên đối xứng lệch 0,0 |
| IK vòi (`ik_proboscis` = 1), thân hạ 5 cm | mũi vòi đứng yên (lệch 0,0); tắt lại thì rest trùng |
| FK (`ik_leg_*` = 0) | rest trùng; xoay `ctl_L_Leg1_02` 20° thì `L_Leg1_02` xoay đúng 20,0° |
| đường nối (đỉnh trùng vị trí ở đường UV) | hở 0,0 m ở tư thế mạnh (trọng số tính trên mesh đã hàn) |

Giới hạn gối IK (xoay +X = gập thêm): trước −87,6° … +120°, sau −25,3° … +120° (không cho duỗi quá thẳng; rest gập 89,6° và 27,3°).

## 5. A2: tư thế thử (QA_CHECKLIST A2, các tư thế của họ này)

Độ giãn = max(dài sau / dài rest, nghịch đảo) của cạnh ≥ 3,5 mm; "cạnh xấu" = ngoài 0,5–1,6×. Xuyên = đỉnh nằm sau mặt gần nhất của
vùng đích > 2 mm, chỉ đếm đỉnh **mới** so với rest và có dịch chuyển tương đối > 1 mm (mesh vỏ hở, rest đã có chồng lớp). Mức tham
chiếu: rig người U01 đã duyệt G2 có hạ tay 4,3×, gập khuỷu 3,7×, đi 3,6×.

| Tư thế | Giãn | Cạnh xấu | Xuyên mới (đỉnh, sâu nhất) |
| --- | --- | --- | --- |
| `wings_spread` dang ngang | 1,38 | 0 | gốc cánh dưới tấm vai 12 (49 mm) |
| `wings_pitch` dang + vặn lá 75° | 1,98 | 0 | gốc cánh 14 (19 mm) |
| `wings_up` vỗ lên | 1,35 | 0 | gốc cánh 11 (29 mm) |
| `wings_down_60` vỗ xuống −60° | 1,72 | 0 | gốc cánh 17 (13 mm) |
| `wings_down` vỗ xuống −75° | 2,01 | 2 | gốc cánh 18 (14 mm) |
| `wings_twist` vặn lá ±25° | 1,48 | 0 | gốc cánh 23 (18 mm) |
| `wings_fold` gập dọc thân | 1,13 | 0 | gốc cánh 9 (28 mm) |
| `wings_fan` xoè lá dưới −20°, lá trên +10° | 1,06 | 0 | 4 (22 mm) |
| `lift_L1` / `lift_R1` nhấc chân trước 12 cm | 1,36 / 1,40 | 0 | 0 |
| `lift_L3` / `lift_R3` nhấc chân sau 12 cm | 2,01 / 1,78 | 2 / 0 | 0 |
| `step_L1_fwd` chân trước ra trước 15 cm | 1,18 | 0 | 0 |
| `step_L3_back` chân sau ra sau 12 cm | 1,53 | 0 | ống chân sau vào túi 18 (14 mm) |
| `body_down` hạ thân 15 cm | 2,63 | 3 | 0 |
| `body_roll` nghiêng 12° | 1,58 | 0 | 5 (≤ 7 mm) |
| `stab` lao + chúi + cúi đầu | 1,28 | 0 | 1 |
| `suck_pin` ghim vòi IK, thân hạ 6 cm + chúi 8° | 2,31 | 6 | 3 |
| `lobes_sway` lắc cả bụng 14° | 1,37 | 0 | túi dưới tấm lưng 3 |
| `lobes_opposite_8` hai túi ngược chiều ±8° | 1,48 | 0 | 4 |
| `lobes_opposite` hai túi ngược chiều ±15° | 1,99 | 7 | túi dưới tấm lưng 7 (36 mm) |
| `lobes_down` hai túi hạ 18° | 1,35 | 0 | 9 |
| `abdomen_up` / `abdomen_down_8` | 1,31 / 1,14 | 0 | 2 / 3 |
| `abdomen_down` hạ bụng 15° | 1,31 | 0 | **ống chân sau vào túi 55 (24 mm)** |
| `head_down` / `head_up` / `head_turn` | 1,49 / 1,69 / 1,47 | 0 | 0 |

A2 từng mục:

- **Skeleton chồng mesh** (tờ 1): đạt. Khớp chân ở giữa ống (mặt cắt), gối và cổ chân ở chỗ gấp thấy được, vòi theo trục ống, túi theo
  trục dài, bản lề cánh chung ở gốc sống cánh.
- **Bản đồ trọng số** (tờ 2): đạt. Không loang sang bộ phận xa: chân sau đi sát túi (4–5 cm) nhưng không ăn túi; gai mào ngực cạnh gốc
  cánh theo ngực; mắt, gai rời, vuốt cứng theo bone của nó. Lá cánh dưới (mảnh rời) chỉ theo `WingB`.
- **Tư thế thử** (tờ 3–5): đạt ở tầm dùng được; giới hạn ở dưới.
- **Vùng khó**: gốc cánh, khe hai túi, tấm lưng phủ bụng, chân sau cạnh túi: xem dưới.
- **Socket**: `hit_origin` là con của `proboscis_03` ở mũi vòi nên đi theo mũi vòi (kể cả khi ghim IK); `fx_head`, `fx_thorax`,
  `fx_abdomen`, `ground` không trọng số. Không có vũ khí nên không thử cầm.

Giới hạn còn lại (không sửa được bằng trọng số, cần animator tránh hoặc mesh khác):

1. **Chân sau duỗi 98 % ở rest** (đùi 0,108 + ống 0,405 m, khoảng háng–cổ chân 0,503 m). Nâng thân quá ~1–2 cm với chân sau đứng yên thì
   bàn chân sau phải nhấc theo. Hạ thân thì tốt (15 cm).
2. **Chân sau lơ lửng 4,7 cm ở rest** (G1: giữ). Clip đứng phải kéo `ctl_*_Leg3_IK` xuống đất.
3. **Ống chân sau sát túi**: hạ bụng quá ~8° thì ống chân sau lọt vào túi (15°: 55 đỉnh, sâu 24 mm); đưa chân sau ra sau 12 cm: 18 đỉnh (14 mm).
4. **Gốc sống cánh luồn dưới tấm vai** khi dang, vỗ, vặn: bị che, không chọc ra ngoài (ảnh cận gốc cánh ở tờ 3). Vỗ xuống quá −75° chưa thử.
5. **Hai túi dính nhau ở khe**: khe trộn trái/phải 7–9 cm; ngược chiều ±8° sạch (1,48×), ±15° còn được (1,99×, đỉnh túi luồn dưới tấm lưng).
6. **Tấm lưng phủ bụng** theo `abdomen_01` như đốt lưng (tấm phía trước trộn dần sang ngực): nâng/hạ bụng kéo tấm lưng theo; túi lắc
   riêng thì đỉnh túi có thể luồn dưới tấm lưng vài đỉnh.
7. **Vòi 3 đoạn cứng**: ghim IK mà thân dịch nhiều thì vòi gập thành ba khúc (thấy ở ảnh cận); dùng thân dịch ít khi ghim.
8. **Mesh không có cặp chân giữa** (G1): rig 4 chân, số `Leg2` để trống.

## 6. Cách dựng lại

Mọi bước chạy lại từ GLB gốc (chỉ đọc), mỗi lệnh dưới 20 giây:

```text
blender -b --factory-startup -P scripts/w04_b1_build.py                                   R2 + R3 -> W04_mire_sucker_rig.blend
blender -b --factory-startup W04_mire_sucker_rig.blend -P scripts/w04_v1_validate.py      R4 -> validation.json (GLB tạm, tự xoá)
blender -b --factory-startup W04_mire_sucker_rig.blend -P scripts/w04_q1_qa.py            R5 -> qa/raw/*, A2_poses
python -I scripts/w04_g2_sheets.py                                                        R5 -> qa/*_G2_*.png
blender -b --factory-startup -P scripts/w04_r8_export.py                                  R8 (chỉ rig) -> ../rig_done/
```

| Script | Việc |
| --- | --- |
| `w04_common.py` | đường dẫn, sha256, chiều cao 1,566 m, k 0,87 |
| `w04_rig_def.py` | bảng bone runtime + rig điều khiển từ `_work/landmarks.json` (vị trí, cha, roll) |
| `w04_skin.py`, `w04_skin_cfg.json` | trọng số: cắt từng chi bằng mặt phẳng + ống bao + mảnh liền từ hạt giống, gán đoạn xương gần nhất, dải điều hoà quanh khớp, lõi cố định cho bone ngắn/hẹp, tấm lưng theo bụng |
| `w04_mesh.py` | hàn theo vị trí, cạnh, Dijkstra, mảnh liền |
| `w04_b1_build.py`, `w04_bkit.py` | dựng file rig |
| `w04_v1_validate.py`, `w04_glb.py` | R4 |
| `w04_q1_qa.py`, `w04_viz.py`, `w04_sheet.py`, `w04_g2_sheets.py` | R5 |
| `w04_m1..m8_*.py`, `w04_g1_proposal.py` | đo landmark và ảnh G1 (R1), soi vùng trọng số |
| `w04_r8_export.py` | R8 chỉ rig: xuất `../rig_done/` và nạp lại để kiểm (mục 8) |

Sửa khớp: chỉnh `_work/landmarks.json` (hoặc `OVERRIDE` trong `w04_rig_def.py`) rồi chạy lại bốn lệnh trên. Rig editor của skill không
dùng cho con này (công cụ tính lại trọng số của editor là cho dáng người).

## 7. Bàn giao cho phiên animation (R6)

- Làm việc trên `W04_mire_sucker_Control`; skeleton runtime ẩn, bám control bằng Copy Transforms (bake ở R8).
- Công tắc trên object control: `ik_leg_L1`, `ik_leg_R1`, `ik_leg_L3`, `ik_leg_R3` (1 = IK), `ik_proboscis` (0 = FK, mặc định).
- Bàn chân `ctl_<side>_Leg<n>_IK`: trục local Y = phía trước (−Y thế giới), Z = lên; đốt bàn `_04` theo hướng control. Pole
  `ctl_<side>_Leg<n>_pole` (con của `ctl_cog`).
- `ctl_cog`: local Y = lên, Z = phía trước, X = sang trái của con quái; xoay +X = chúi đầu xuống.
- Cánh: `ctl_<side>_Wing` ở bản lề chung, xoay **+X = nâng cánh** cả hai bên; quét ra trước là −Z bên trái, +Z bên phải. FK lá: X = vỗ,
  Y = vặn lá, Z = quét trong mặt cánh (Z local của bone cánh = pháp tuyến mặt lưng, theo chuẩn họ W côn trùng).
- Rest: chân sau lơ lửng 4,7 cm, chân sau gần duỗi thẳng (mục 5).

## 8. Xuất (R8 chỉ rig, 2026-10-27)

`scripts/w04_r8_export.py`, cùng cách B01 và P06: không gọi `export_core.export_package`, vì hàm đó lưu đè `.blend` và xuất cả rig
điều khiển. Script mở `.blend` chỉ đọc và đặt 28 tư thế thử của mục 5 trên `W04_mire_sucker_Control` để ghi ma trận skin. Sau đó,
chỉ trong bộ nhớ, nó bỏ 36 Copy Transforms và `W04_mire_sucker_Control` (51 bone), rồi xuất `W04_mire_sucker_Skeleton` cùng mesh ở
rest. Rest khi đã bỏ rig điều khiển lệch 0,0005 mm so với khi còn. Chạy 4,9 s.

| File trong `../rig_done/` | Nội dung |
| --- | --- |
| `W04_mire_sucker_rig.glb` | 21,2 MB, +Y lên, 1 skin, 41 joint, không animation, không `ctl_*`, 3 ảnh trùng byte GLB Tripo |
| `W04_mire_sucker_rig.fbx` | 4,6 MB, trục Unity (Y lên, −Z trước), nhúng basecolor + normal (map rm chỉ ở `textures/`) |
| `textures/` | 3 map 4096 như GLB Tripo (tên theo `export_core._textures`: `*.jpg.jpg`, `*.png.png`) |
| `W04_mire_sucker_rig.blend` | bản sao nguyên byte của nguồn, còn rig điều khiển |
| `anim/clips.json` | manifest rỗng (clip ở R6) |
| `W04_mire_sucker_rig_info.json` | bone, socket, công tắc rig điều khiển, sức khoẻ trọng số, biên độ dùng được, kết quả nạp lại |

Nạp lại vào scene trống. Ngưỡng: khớp rest 0,1 mm, so tư thế 1 mm.
- **GLB**: 41 bone, tên và cha khớp, đầu bone lệch 0,0004 mm. Tối đa 4 ảnh hưởng, tổng bằng 1. Mọi đỉnh khớp nguồn (7.582 đỉnh do
  tách ở đường nối UV, nguồn 5.640). Cả 28 tư thế thử lệch ≤ 0,0009 mm (các tư thế dời mesh 7–121 cm).
- **FBX**: 1 armature, 41 bone, 1 mesh 5.640 đỉnh, 1,23 × 1,36 × 1,57 m. Cả 28 tư thế thử lệch ≤ 0,001 mm.

Số liệu: `_work/r8_export.json`. Chưa làm: bản lab 2048 và đăng ký `samples.json` (R8.3), clip (R6–R7).
