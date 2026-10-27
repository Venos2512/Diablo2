# B01 Sexton's Dog — báo cáo QA rig (R2–R5)

Ngày 2026-10-26. Họ Q (con bốn chân đầu tiên của dự án), route M, Opus 5.5, Blender 5.1.1 chạy nền. G1 người dùng duyệt cùng ngày
([`rig_brief.md`](rig_brief.md)). Credit dịch vụ: **0**. GLB gốc chỉ đọc (sha256 `cbb68b64…5c098ac4`).

**Trạng thái: G2 duyệt 2026-10-27** (người dùng xem trong Blender), rig đã xuất vào `../rig_done/` (R8 chỉ rig, mục 8). Chưa làm
clip (R6), chưa có bản lab, chưa đăng ký lab. Kiểm tự động A1 **14/14**, phép thử chức năng rig điều khiển **14/14**, ảnh G2 ở
`qa/B01_sextons_dog_G2_1..4_*.png` (render Workbench chạy nền).

## 1. Sản phẩm

| File | Nội dung |
| --- | --- |
| `B01_sextons_dog_rig.blend` | Nguồn chỉnh sửa được (17 MB, 3 ảnh 4096² đã pack, byte = GLB). Mở ra ở tư thế nghỉ, 0 Action, đang chọn `B01_control`, viewport Solid + Texture, 24 fps, mét. Gồm mesh `B01_sextons_dog` (1 mesh, 1 Armature modifier), `B01_runtime` (41 bone, ẩn trong viewport nhưng vẫn đánh giá), `B01_control` (57 bone `ctl_*`) |
| `validation.json` | A1.1–A1.14 (số đo, ngưỡng, ghi chú), 14 phép thử chức năng, số đo 13 tư thế thử, góc pole, thống kê skin |
| `qa/B01_sextons_dog_G2_1_skeleton.png` | skeleton runtime chồng mesh (bên, trước, sau, trên, cận cảnh đầu–cổ, chân trước, chân sau, đuôi) + rig điều khiển |
| `qa/B01_sextons_dog_G2_2_weights.png` | xương trội (5 góc + đầu), số ảnh hưởng, trọng số 14 xương chính |
| `qa/B01_sextons_dog_G2_3_poses.png`, `_4_poses.png` | 12 tư thế thử họ Q, mỗi tư thế 3 góc + bản đồ giãn, kèm số đo |
| `landmarks.json` | toạ độ khớp (m) và nguồn đo |
| `scripts/` | script dựng lại được (mục 7) |
| `_work/` | số đo khám phá, mặt cắt, ảnh thô của từng lượt QA (`qa_f4/` là lượt cuối) |

## 2. Quyết định kỹ thuật

- **Scale** (G1, phương án A): đều ×2,161055 = 2,16 m / 0,9995 m (dài theo Y mũi → chóp đuôi). Cao 1,2863 m (0,71H). Mặt −Y, trái = +X,
  đáy z = 0. Topology, thứ tự đa giác, UV giữ nguyên GLB (A1.9).
- **Skeleton runtime** (41 bone, 34 deform), tên và phân cấp đúng bảng họ Q ở `SKELETON_STANDARD.md` §3. Roll theo quy tắc Qh: X cục
  bộ = +X thế giới chiếu lên bone, hai bên như nhau. Sau G1 chỉnh theo số đo, không đổi tên hay phân cấp: trục tai theo vạt tai, hàm hạ
  theo đường miệng, đuôi theo đường giữa mặt cắt (đuôi dày hơn ước ở G1), đầu xích vào trong mắt xích.
- **Rig điều khiển** (57 bone): `ctl_root`, `ctl_body` (ở `cog`, giữa thân), FK `ctl_<bone>` cho mọi bone deform; mỗi chân trước IK 2 đốt
  (`UpperArm`–`ForeArm`) tới cổ chân trước, mỗi chân sau IK 2 đốt (`Thigh`–`Calf`) tới khuỷu cổ chân sau. Control tiếp xúc
  `ctl_<side>_Hand_IK` / `ctl_<side>_Foot_IK` nằm trên sàn dưới khớp bóng; `ctl_<side>_Hand_roll` / `_Foot_roll` xoay quanh khớp
  bóng (+ = nhấc đệm bàn, kiểu chó đi trên ngón; − = đặt cổ chân / bàn sau nằm xuống sàn như khi ngồi); ngón `ctl_<side>_Finger_IK` /
  `_Toe_IK` đứng yên theo control; pole `ctl_<side>_Elbow_pole` sau khuỷu, `ctl_<side>_Knee_pole` trước gối (0,45 m). Góc pole quét
  rồi tinh chỉnh golden-section: trước L 88,238°, R 91,762°; sau L −90,488°, R −89,512°; bật IK ở rest lệch tối đa 0,002 mm.
  Công tắc `ik_arm_L/R` (chân trước), `ik_leg_L/R` (chân sau), 1 = IK, cùng tên với D01 và họ Qh (brief G1 ghi `ik_front/hind`).
  Vòng cổ tự theo 50 % `neck_02` (Copy Transforms từ một bone mechanism con của `neck_02`), xích lắc bằng `ctl_collar_ring`.
  `B01_runtime` bám `B01_control` bằng Copy Transforms (thế giới → thế giới); R8 bake từ control xuống runtime.
- **Skin** (`scripts/b01_skin.py`, không dùng Automatic Weights):
  1. Hàn đỉnh theo vị trí (5.711 vị trí / 5.716 đỉnh), tách 18 mảnh. Vòng cổ + 13 đinh tán → `collar` 100 %; 2 mắt xích + vòng
     đồng → `collar_ring` 100 %.
  2. Thân chia theo các đường ranh dọc cột sống: ranh `chest`/`neck_01` chạy ra trước ở cả dưới (mũi ức giữ trên `chest`) và trên
     (bướu vai); ranh đầu/cổ lùi về y −0,73 / −0,70 ở hai bên sọ để cả chỗ bám của vạt tai thuộc `head`.
  3. Thân hay chân: so khoảng cách chuẩn hoá (khoảng cách tới đoạn xương / bán kính khối quanh xương). Có cổng theo bên, trước/sau,
     độ cao, |x| tối thiểu (đường giữa ức và háng không nhận trọng số chân); dưới z 0,28 m chỉ có chân.
  4. Mặt nạ: vạt tai (x ≥ 0,185 m và mặt trong vạt) → `L/R_ear`; cằm + mặt dưới hàm (|x| < 7,5 cm, dưới đường miệng z 0,712) →
     `jaw`; đuôi (khoảng cách tới trục đuôi, cộng mọi đỉnh sau gót chân sau y > 0,81) → `tail_01..04`.
  5. Trộn theo khoảng cách trắc địa tới ranh (Dijkstra từ trung điểm cạnh ranh): ranh luôn 50/50, độ rộng cố định theo khớp
     (cột sống 15–16 cm, vai và hông 11–15 cm, khuỷu và gối 7–8 cm, cổ chân 4–5 cm, ngón 3 cm, hàm 2,5 cm, tai 3,5 cm), không phụ thuộc
     mật độ mesh. Không trộn qua khe hở (chân với chân, tai với má) và không trộn giữa hai bên. Tai và hàm chỉ trộn với `head`; trọng số
     chân giảm dần về 0 khi tới đường giữa.
  6. Bỏ < 1 %, giữ 4 ảnh hưởng, chuẩn hoá đúng float32: tổng lệch tối đa 3e-8.
- Rig editor của skill không dùng: nó chỉ hiểu khớp người (vai/khuỷu/hông/gối của bộ H).

## 3. A1 — kiểm tự động (`validation.json`)

Lượt này không export nên các mục viết cho GLB được đo trên tương đương trong `.blend` (ghi ở cột ghi chú).

| # | Kết quả | Số đo chính | Ghi chú |
| --- | --- | --- | --- |
| A1.1 | đạt | 1 mesh object, 1 Armature modifier → `B01_runtime`; 11.184 tam giác | tương đương 1 mesh + 1 skin |
| A1.2 | đạt | 41 tên, duy nhất, đúng bảng họ Q, chỉ `[A-Za-z0-9_]`, tiền tố `L_`/`R_` | |
| A1.3 | đạt | một gốc `root` | |
| A1.4 | đạt | 5.716 đỉnh, 0 đỉnh trống | |
| A1.5 | đạt | tổng trọng số 1 ± 3,0e-8 | float32 chuẩn hoá đúng |
| A1.6 | đạt | tối đa 4; 3.088 đỉnh 1 ảnh hưởng, 2.175 đỉnh 2, 436 đỉnh 3, 17 đỉnh 4 | |
| A1.7 | đạt | 34 vertex group = 34 bone deform; không group lạ, không group trên bone không deform | tương đương chỉ số joint |
| A1.8 | đạt | armature ở REST: mesh lệch tối đa 1,4e-7 m | bind = rest |
| A1.9 | đạt | GLB nạp lại, scale cùng hệ số: cùng đa giác và thứ tự, đỉnh lệch tối đa 1,3e-7 m, UV lệch 0 | |
| A1.10 | đạt | sha256 byte ảnh pack = GLB cả 3 map (base `b6d3bf75…`, rm `97b3f40e…`, normal `71af563e…`) | |
| A1.11 | đạt | dài Y 2,1600 m (1,2H, 0 %), cao 1,2863 m (0,72H −0,75 %) | quy ước họ Q ở G1 |
| A1.12 | đạt | đỉnh thấp nhất z = 0 | |
| A1.13 | đạt | 7 bone không trọng số = 5 socket + `root`, `cog` | tổ tiên cấu trúc |
| A1.14 | đạt | 3 object transform đơn vị, `matrix_parent_inverse` đơn vị | |

## 4. Rig điều khiển — phép thử chức năng (14/14 đạt)

Kéo từng control tiếp xúc (0, −6, +5 cm): đế bàn đó đi đúng (lệch ≤ 1,2 mm), ba bàn kia và thân đứng yên (≤ 1e-4 m). `ik_arm_L` /
`ik_leg_L` = 0 thì control IK không còn tác dụng (FK). `ctl_body` hạ 8 cm: thân hạ đúng, đế bàn đứng yên. `ctl_root` kéo cả con. Dời pole
sang +X thì khuỷu, gối đi theo. `ctl_L_Foot_roll` +25°: đệm bàn nhấc 3,2 cm, mũi ngón đứng yên. Bật IK ở rest: runtime trùng bind
(1e-5 ma trận, 0,002 mm đỉnh). Runtime trùng control trong tư thế bước chéo; socket bám cha.

## 5. A2 — ảnh QA và tư thế thử

Tư thế dựng bằng rig điều khiển (`scripts/b01_poses.py`, chỉ để QA, không phải clip). Độ giãn = max(dài lúc tạo dáng / rest, nghịch
đảo) trên cạnh ≥ 4 mm; số cạnh > 1,6×; Δ = thay đổi độ dài cạnh lớn nhất. Chạm đất: chân đứng có đáy 0 ± 10 mm, không bàn nào lún quá
10 mm. Vòng cổ: số mẫu đỉnh vòng cổ (1/3 số đỉnh, 145 mẫu) nằm trong thân, so với rest (17 mẫu đã nằm trong lông ở rest).

| Tư thế | Giãn | Cạnh > 1,6× | Δ max | Chạm đất | Vòng cổ (Δ mẫu) | Nhận xét |
| --- | --- | --- | --- | --- | --- | --- |
| bước chéo | 5,27× | 196 | 96 mm | đạt | 0 | đọc được dáng đi; giãn ở cổ chân trước đang gập, khuỷu cổ chân sau, háng chân vươn |
| ngồi | 8,08× | 674 | 187 mm | đạt | −1 | **tư thế khó nhất**: đùi bị kéo phẳng, nếp háng và mặt ngoài đùi giãn mạnh khi hông gập ~90° |
| cúi ngửi đất | 3,91× | 77 | 84 mm | đạt | +15 | Δ lớn ở đỉnh cổ dưới dải trên vòng cổ (vòng cổ che); vòng cổ lún thêm vào bờm khi cúi sâu |
| ngoái đầu (~66°) | 6,20× | 37 | 60 mm | đạt | +8 | da cổ cạnh vòng cổ và gốc tai giãn; đọc tốt từ trên |
| vẫy đuôi | 2,30× | 1 | 31 mm | đạt | 0 | sạch |
| há hàm 15° | 2,44× | 33 | 30 mm | đạt | 0 | cằm hạ, môi và má xệ kéo giãn, không lòng miệng (đã chốt G1) |
| vươn chân trước | 8,22× | 197 | 62 mm | đạt | +2 | cổ chân trước gập 40° bị xẹp mặt trong (nén trên cạnh ngắn); sườn sau khuỷu giãn |
| duỗi chân sau | 3,21× | 140 | 125 mm | đạt | 0 | nếp sườn – đầu gối giãn khi đùi lùi xa 24 cm |
| uốn thân | 3,43× | 29 | 37 mm | đạt | 0 | sạch |
| cong lưng | 2,16× | 3 | 42 mm | đạt | 0 | sạch |
| vồ | 32,9× | 483 | 66 mm | đạt | −1 | số cao do nén cạnh ngắn ở mặt sau gối và cổ chân trước gập mạnh; ảnh không thấy rách |
| tai + xích lắc | 3,01× | 9 | 47 mm | đạt | 0 | tai mở 20° kéo phần vạt dính vào má |

Ảnh: skeleton chồng mesh (A2 mục 1) ở `G2_1`; khớp vai, khuỷu, cổ chân, hông, gối, cổ chân sau nằm trong khối. Bản đồ trọng số (mục 2)
ở `G2_2`: không loang chân này sang chân kia, không có trọng số thân trên bàn chân, ức và háng không nhận trọng số chân; vai và bả vai,
đùi có vùng riêng. Vùng khó của brief (mục 4) đều có ảnh ở `G2_3`, `G2_4`. Socket (mục 5): không có vũ khí; `fx_*` bám cha (phép thử).

## 6. Khuyết điểm còn lại

1. **Ngồi**: skin tuyến tính không giữ được khối đùi khi hông gập ~90°, đùi bẹt và nếp háng giãn tới 19 cm. Bộ clip bắt buộc của họ Q
   (`idle`, `walk`, `run`, `attack`, `hit`, `death`) không cần ngồi. Nếu cần (idle ngồi, chết nằm co chân) thì có hai cách:
   thêm xương phụ hông hoặc đùi nhận một nửa góc gập (+2 bone, đổi bảng họ Q), hoặc chấp nhận và giới hạn góc gập trong clip.
2. **Gập mạnh ở cổ chân trước, khuỷu, mặt sau gối** (vồ, vươn): mặt trong khớp xẹp (nén). Đây là giới hạn của skin tuyến tính, không phải
   lỗi trọng số; nhìn ảnh không thấy rách.
3. **Nếp sườn và háng** ở bước dài: da giãn 10–12 cm trên vài cạnh dài khi chân vươn hoặc lùi xa. Ở biên độ bước chéo vừa phải
   (Δ 96 mm) vẫn đọc được.
4. **Cổ dưới vòng cổ cứng**: ngoái hoặc cúi sâu làm vòng cổ lún thêm vào bờm (+8 / +15 trên 145 mẫu). Vòng cổ đã tự đi giữa hai đốt
   cổ; animator có thể chỉnh thêm.
5. **Hàm**: há ~15° như đã chốt G1, môi giãn, không lòng miệng.
6. **Tai**: vạt tai dính vào má ở phần trên. Giữ góc tai ≤ 15–20° trong clip.
7. Người dùng đã xem trong Blender (2026-10-27). Chưa kiểm trong lab hay engine.
8. Control chỉ xoay (hàm, đầu, cổ, đốt sống, đuôi, tai, chân FK) chưa khoá dịch chuyển: G trên các control này kéo xương rời khớp,
   dùng R. Chỉ ở rig điều khiển, không vào bản xuất.

Câu hỏi G2 cho người dùng:
- (a) Duyệt rig ở mức này, hay thêm xương phụ hông/đùi cho tư thế ngồi (đổi bảng họ Q đã duyệt)?
- (b) Lệch tên với họ Qh của thread khác: Q dùng `neck_01`, `neck_02`, Qh và H dùng `neck`, `neck_02`. Tôi giữ theo bảng đã duyệt;
  retarget giữa hai họ cần một dòng map.

G2 (2026-10-27): người dùng duyệt ("done r, export đi") mà không yêu cầu đổi, nên giữ (a) không xương phụ, (b) tên của bảng Q.

## 7. Chạy lại

Blender `C:/Program Files/Blender Foundation/Blender 5.1/blender.exe`, chạy từ thư mục `rig/`:

```text
blender -b --factory-startup -P scripts/b01_r2_build.py                                   # R2+R3: dựng lại B01_sextons_dog_rig.blend (GHI ĐÈ)
blender -b --factory-startup B01_sextons_dog_rig.blend -P scripts/b01_r5_qa.py -- f4 full  # R5: số đo + ảnh thô -> _work/qa_f4*
blender -b --factory-startup B01_sextons_dog_rig.blend -P scripts/b01_r4_validate.py -- f4 # R4: validation.json
python -I scripts/b01_g2_sheets.py f4                                                     # ảnh G2 -> qa/
blender -b --factory-startup -P scripts/b01_r8_export.py                                  # R8 chỉ rig -> ../rig_done/, _work/r8_export.json
blender B01_sextons_dog_rig.blend --python ../../../_batches/rig_v1/tools/gui_open.py --python scripts/b01_gui_check.py
                                                                                          # xem trong Blender, không mở cổng MCP 9876
```

Đo khám phá (R1): `b01_r1_measure.py`, `b01_r1_sections.py -- x=0 y=-0.38 …`, `b01_r1_proposal.py`, `b01_g1_sheet.py`;
chẩn đoán: `b01_diag_weights.py`, `b01_diag_edges.py -- <tư thế,…>`. Kích thước khác G1: đặt biến môi trường `B01_LENGTH_M` rồi chạy lại.

## 8. Xuất (R8 chỉ rig, 2026-10-27)

`scripts/b01_r8_export.py`, cùng cách P06: không gọi `export_core.export_package`, vì hàm đó lưu đè `.blend` và xuất cả rig điều
khiển. Script mở `.blend` chỉ đọc và đặt 13 tư thế thử trên `B01_control` để ghi ma trận skin. Sau đó, chỉ trong bộ nhớ, nó bỏ
36 Copy Transforms và `B01_control`, rồi xuất `B01_runtime` cùng mesh ở rest.

| File trong `../rig_done/` | Nội dung |
| --- | --- |
| `B01_sextons_dog_rig.glb` | 16,2 MB, +Y lên, 1 skin, 41 joint, không animation, không `ctl_*`, 3 ảnh trùng byte GLB Tripo |
| `B01_sextons_dog_rig.fbx` | 4,2 MB, trục Unity (Y lên, −Z trước), nhúng basecolor + normal (map rm chỉ ở `textures/`) |
| `textures/` | 3 map 4096 như GLB Tripo (tên theo `export_core._textures`: `*.jpg.jpg`, `*.png.png`) |
| `B01_sextons_dog_rig.blend` | bản sao nguyên byte của nguồn, còn rig điều khiển |
| `anim/clips.json` | manifest rỗng (clip ở R6) |
| `B01_sextons_dog_rig_info.json` | bone, socket, sức khoẻ trọng số, biên độ dùng được, kết quả nạp lại |

Nạp lại vào scene trống. Ngưỡng: khớp rest 0,1 mm, so tư thế 1 mm.
- **GLB**: 41 bone, tên và cha khớp, đầu bone lệch 0,0008 mm. Tối đa 4 ảnh hưởng, tổng bằng 1. Mọi đỉnh khớp nguồn (7674 đỉnh do
  tách ở đường nối UV, nguồn 5716). Cả 13 tư thế thử lệch ≤ 0,0006 mm.
- **FBX**: 1 armature, 41 bone, 1 mesh 5716 đỉnh, 0,80 × 2,16 × 1,29 m. Cả 13 tư thế thử lệch ≤ 0,0008 mm.

Số liệu: `_work/r8_export.json`. Chưa làm: bản lab 2048 và đăng ký `samples.json` (R8.3), clip (R6–R7).
