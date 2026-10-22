# D01 Hodling — báo cáo QA kỹ thuật rig (R2–R5)

Ngày 2026-10-21. Route M (skeleton riêng theo chuẩn ASHLAR), họ S. G1 người dùng đã duyệt cùng ngày ([`rig_brief.md`](rig_brief.md)).

**Trạng thái: rig dựng xong, kiểm tự động 14/14 đạt, ảnh QA đã sinh, chờ G2.** Đây là báo cáo kỹ thuật của người dựng, **không phải duyệt G2**
(G2 là duyệt thẩm mỹ của người dùng trên ảnh `qa/` hoặc mở `.blend`). Chưa làm R6 (clip), chưa tích hợp lab/game, chưa có `D01_hodling_rig.glb`
release, 0 credit dịch vụ. GLB gốc không đổi (sha256 `bf22ccea…8d5a`, kiểm lại trong `validation.json`).

## 1. Sản phẩm

| File | Nội dung |
| --- | --- |
| `D01_hodling_rig.blend` | **Nguồn chỉnh sửa được** (14,8 MB, texture 4096 đã pack, byte ảnh = GLB gốc). Mở ra ở T-pose rest trung tính, không Action, viewport Solid + Texture, đang chọn `D01_control`. Gồm: mesh `D01_hodling` (1 mesh, 1 armature modifier), `D01_runtime` (skeleton runtime, 35 bone, ẩn trong viewport nhưng vẫn đánh giá), `D01_control` (rig điều khiển, 45 bone `ctl_*`) |
| `validation.json` | R4: A1.1–A1.14 kèm số đo, ngưỡng, ghi chú; nhất quán nguồn↔runtime; 16 phép thử chức năng control; cực trị 16 tư thế; trạng thái mở lại file |
| `checks/` | `D01_hodling_runtime_check.glb` (**GLB runtime tạm chỉ để kiểm A1**, không phải `_rig.glb`), `rig_function.json`, `viewport_state.json`, `qa_pose_actions.json` |
| `qa/A2_*_v3.jpg` | Ảnh QA hiện hành (mục 3). `qa/_superseded/` = các lần chạy cũ, có lý do. `qa/_raw/<tag>/info*.json` = phép chiếu + vị trí bone của từng ảnh (ảnh raw bị xoá, tái sinh bằng script) |
| `qa/D01_hodling_qa_poses.blend` | File QA **riêng**: 16 Action tĩnh `QA_pose_*` đánh dấu `status=experiment`, **không phải clip production**. Nguồn không chứa Action |
| `tools/` | Script lặp lại được (mục 6). `landmarks.json` = landmark giải phẫu đo trên mesh |

## 2. Quyết định kỹ thuật và số đo thật

- **Scale**: đều toàn mesh, hệ số **0,679495687** (= 0,5 / Y max của GLB), tính từ hình học. Topology, UV (`max diff 0`), chỉ số đỉnh, tam giác (10.668) và 3 texture giữ nguyên (so với GLB gốc: đỉnh lệch tối đa 1,5e-8 m).
- **Trục (đã xác minh trên mesh, không chỉ suy luận)**: đỉnh có Y nhỏ nhất của mesh (mũi) nằm ở Y = −0,1558 (Blender) = +Z glTF; mũi chân cũng hướng −Y Blender; ảnh render thật (`A2_skeleton_overlay_side`) nhìn từ bên phải quái cho thấy mặt quay sang phải ảnh. Trái quái = **+X** (Blender và glTF). Xuất glTF Y lên.
- **Mesh không đối xứng, rig theo mesh thật**: hai chân/bàn chân lệch **+0,0105 m theo X** so với tâm tay/đầu (chân phải = gương của chân trái quanh x = 0,0105, `pelvis` ở x = +0,010); **tai phải cao hơn và lùi ra sau hơn tai trái** nên `R_ear` đo riêng (`landmarks.json` → `ear_R`), không lấy gương. Lần chạy `v1` đặt sai `R_ear`; phép đo "khớp trong mesh" bắt được.
- **Bone**: runtime **35** = 22 lõi + 5 phụ (`helmet`, `sack`, `loincloth_front`, `L_ear`, `R_ear`) + 8 socket. **25 bone có trọng số**; 10 bone không trọng số = 8 socket + `root`, `cog` (tổ tiên cấu trúc, ngoại lệ đã thống nhất ở G1 và ghi vào `SKELETON_STANDARD.md` mục 7). Rig điều khiển 45 = 27 FK + 18 (hand IK ×2, pole khuỷu ×2, foot IK ×2, toe/heel/ball roll ×6, ankle/toe target ×4, pole gối ×2). Không ngón, không mặt, **không clavicle** (xem 5.2).
- **Hình học khớp**: đầu của 20 bone thân/tay/chân lõi, `helmet`, `sack` đều nằm trong mesh (`joints_inside_mesh`, bỏ phiếu 3 tia). Ngoại lệ: `loincloth_front` 4,6 mm ngoài (vải mỏng), `L_ear`/`R_ear` 1,9 / 2,2 mm ngoài (gốc tai mỏng), socket nằm trên/gần bề mặt. Khuỷu cách đường vai–cổ tay +3,3 mm ra sau (pre-bend ~4°), gối giữ độ cong đo được 9° của chân: chuỗi IK không thẳng tuyệt đối ở rest nên không bị suy biến. Trục gập của khuỷu/gối = pháp tuyến thật của mặt phẳng cong; xoay local X dương = khuỷu gập ra trước / gối gập (bàn chân ra sau). Góc pole tìm bằng quét: đúng −90° cho cả 4 chuỗi, độ lệch rest = 0.
- **Rig điều khiển ↔ runtime**: runtime bám điều khiển bằng Copy Transforms (thế giới→thế giới); rest trùng tuyệt đối (`control_vs_runtime_rest_max_diff` = 0); `rest_eval_vs_stored` = 5,6e-7 m (tư thế rest không biến dạng). IK chân/tay bật/tắt bằng thuộc tính `ik_leg_L/R`, `ik_arm_L/R` trên `D01_control` (driver). Chân: `ctl_*_Foot_IK` (gót), `Toe_roll` (nhấc gót quanh mũi), `Heel_roll` (nhấc mũi quanh gót), `Ball_roll` (nhấc gót quanh khớp bóng), `Knee_pole`. Tay: `ctl_*_Hand_IK` (con của `ctl_chest`), `Elbow_pole`. `ctl_root`, `ctl_cog` tách riêng.
- **Skin** (`tools/d01_skin.py`, khởi điểm tự động rồi soi và sửa): phân vùng theo thành phần liền kề của mesh (mũ, sừng, gạch, mắt, khố đều là cụm riêng sau khi hàn đỉnh trùng ở đường nối UV: 5.389 vị trí / 6.505 đỉnh) + màu + hình học; trọng số = nghịch đảo khoảng cách tới đoạn xương (trừ bán kính) có "cổng" vùng và bên, làm mịn Laplace, chuyển tiếp khuỷu/cổ tay tính theo toạ độ dọc; mũ + sừng → `helmet` 1,0; gạch → `sack` 1,0; mắt → `head`; vải túi → `sack` pha về thân ở mép; dây đai theo cột sống/ngực; khố: thắt lưng theo `pelvis`/`spine`, mảnh trước `pelvis`→`loincloth_front` (không đùi, tránh kẹt chân), mảnh sau `pelvis`. Cắt top-4, chuẩn hoá. Điểm yếu đã soi và sửa trong quá trình: đỉnh đế bàn chân bị gán nhầm, vải túi nhận trọng số tay, tai ăn da thái dương, bàn tay còn trộn với cẳng tay 3 cm.

## 3. A1 — kiểm tự động (`validation.json`, tất cả đã đo)

| # | Kết quả | Số đo chính |
| --- | --- | --- |
| A1.1 | đạt | 1 skin, 1 mesh, 1 primitive, node mesh = node skin |
| A1.2 | đạt | 35 tên, duy nhất, đúng chuẩn mục 3 + phụ D01, không ký tự lạ / hậu tố `.L` |
| A1.3 | đạt | 1 gốc: `root` (cha là node armature `D01_runtime`) |
| A1.4 | đạt | 6.505 đỉnh, 0 đỉnh trống |
| A1.5 | đạt | tổng trọng số 1 ± 1,3e-7 (ngưỡng 1e-6) |
| A1.6 | đạt | tối đa 4; 3.006 đỉnh 1 ảnh hưởng, 1.638 đỉnh 2, 950 đỉnh 3, 911 đỉnh 4; không có `JOINTS_1` |
| A1.7 | đạt | chỉ số joint 0–32 < 35; 25 joint có trọng số |
| A1.8 | đạt | lệch ma trận bind nghịch đảo tối đa 2,5e-6 (ngưỡng 1e-5) |
| A1.9 | đạt | Blender import lại từ thư mục mới: lệch hình học 1,25e-7 m hai chiều (ngưỡng 1e-4); GLB↔nguồn trực tiếp 0; bộ ba đỉnh của 10.668 tam giác khớp; UV khớp; 35 bone, 35 nhóm đỉnh, 3 ảnh 4096² |
| A1.10 | đạt | sha256 byte ảnh nhúng = GLB gốc cả 3 map (base `9bf5cece…`, MR `8c104752…`, normal `b3502fa3…`); exporter không mã hoá lại |
| A1.11 | đạt | Y max = 0,5 m (0%) |
| A1.12 | đạt | đỉnh thấp nhất Y = 0 |
| A1.13 | đạt | 10 bone không trọng số = 8 socket + `root`, `cog` (tổ tiên cấu trúc) |
| A1.14 | đạt | object transform đơn vị, `matrix_parent_inverse` đơn vị; GLB: node armature, mesh và `root` đều TRS đơn vị; scale bone lệch tối đa 4,2e-6, không âm |

Nhất quán nguồn↔runtime: trọng số `.blend` vs GLB lệch tối đa 1,2e-7; ma trận rest bone vs nút GLB 2,5e-6; GLB không chứa `ctl_*`, không Action, không mesh phụ (37 nút = 35 bone + armature + mesh). Material: exporter bỏ `KHR_materials_volume` và `specularFactor` mặc định của GLB gốc (chỉ ảnh hưởng bản runtime tạm; cần quyết khi làm bản release).

## 4. Chức năng rig trên file đã lưu rồi mở lại (`checks/rig_function.json`)

- Mở lại: pose bone đều ở identity, 0 Action, `ik_*` = 1, shading Solid/Texture/Studio, đối tượng chọn = `D01_control`, đơn vị mét, 24 fps. **Hạn chế**: Blender chạy nền không có OpenGL nên **không chụp được ảnh viewport**; chỉ đọc lại được trạng thái UI đã lưu. Cần mở `.blend` bằng giao diện để xem.
- **16/16 phép thử control đạt**: kéo `Foot_IK` (±0,004 m mục tiêu, chân bên kia và thân đứng yên), `Hand_IK`, pole gối/khuỷu quay đúng hướng khi chi đã gập (21 mm), `Heel/Toe/Ball_roll` nhấc đúng vùng, `ctl_root` kéo cả model (lệch 1e-5), `ctl_cog` hạ thân mà đế chân đứng (≤ 3 mm), xoay `chest` / `head`, tắt IK sang FK. Sai số IK ≤ 0,02 mm tới đích khi trong tầm với.
- **Cực trị 16 tư thế**: không NaN/inf, ma trận bone sạch (định thức/scale lệch ≤ 1,7e-5). Giãn cạnh tuyệt đối tối đa theo tư thế: vai/tay ≤ 22,9 mm (cạnh gốc 7,5 mm, `hands_crossed`), đầu quay 50° 30,7 mm (vải túi sát gáy), còn lại ≤ 17,7 mm; phân vị 99 ≤ 5,8 mm. Tiếp xúc: đế chân đang đặt đứng (squat, xoay thân, đầu, tay…) có đế thấp nhất tại 0,0 mm; `long_step` chân sau nhấc gót, mũi chân cách sàn 2,9 mm. Với `hip_flex_fk`, `hip_abduct_fk` (FK, chân nhấc) không đánh giá tiếp xúc.
- **Socket**: `R/L_weapon_attach` và 5 socket khác đi theo bàn tay/đầu/ngực đúng (lệch ma trận cục bộ ≤ 1,8e-7 qua 16 tư thế). Trục Y socket vũ khí = hướng ra trước ở T-pose (thế giới `(0,−1,0)`), Z = +X (`A2_sockets`; thanh QA chỉ nằm trong bộ nhớ lúc render).

## 5. A2 — ảnh QA (người xem) và khuyết điểm còn lại

### 5.1 Ảnh theo mục A2

| Mục A2 | File | Nhận xét kỹ thuật |
| --- | --- | --- |
| Skeleton chồng mesh (trước, bên, sau) | `qa/A2_skeleton_overlay_{front,side,back}_v3.jpg` (35 nhãn), `A2_skeleton_overlay_3view_v3.jpg` (22 nhãn lõi), `A2_control_rig_overlay_{front,side}_v3.jpg` | Vai, khuỷu, cổ tay, hông, gối, cổ chân, bóng chân nằm trong khối. Trục xương theo đúng mesh nghiêng/gù |
| Bản đồ trọng số tổng thể | `A2_weights_dominant_v3`, `A2_weights_blend_v3`, `A2_weights_influences_v3` | không loang bone xa; đối xứng trái/phải rõ; tay không dính thân |
| Trọng số từng bone (vai, hông, khuỷu, gối, tay, phụ) | `A2_weights_bone_{spine,neck_head,arm_L,arm_R,leg_L,leg_R,aux}_v3`, `A2_regions_{1,2}_v3` (texture đối chiếu trọng số) | Cẳng tay/bàn tay chuyển tiếp mịn, bàn tay cứng. `spine_02`, `neck` **không có đỉnh nào trội > 0,5** (chỉ là đoạn pha trộn); `spine_01` 6 đỉnh |
| Tư thế thử (giơ tay, vắt tay, ngồi xổm, bước dài, xoay ±45°, cúi, ngửa) ba góc | `A2_pose_<tên>_v3` (ảnh sạch + ảnh có skeleton), `A2_pose_contact_sheet_v3`, cận cảnh `A2_pose_closeup_{shoulders,hips_legs,elbows,head_neck,torso_sack}_v3` (có góc 3/4) | 16 tư thế, mỗi tư thế dựng bằng control rig thật. Hình dạng giữ sạch ở hầu hết tư thế (xem 5.2) |
| Vùng khó | mũ/sừng: `…head_neck`, `A2_weights_bone_aux`; tai: `…head_neck`; túi: `…torso_sack`; khố: `…hips_legs`; ngón tay: `A2_regions_1` (tay) | xem 5.2 |
| Socket | `A2_sockets_v3.jpg` | đúng trục, quay cùng tay |

### 5.2 Khuyết điểm còn lại (không có gì bị bỏ qua im lặng)

1. **Ngón tay không có bone** (theo brief): ngón co/duỗi không được, cả bàn tay cứng theo `*_Hand`; khi giơ tay/vắt tay ngón giữ nguyên cong như T-pose. Ngón không dính thành khối ở mức đỉnh nhưng sẽ không đóng nắm đấm.
2. **Không có clavicle** (mặc định G1, "chỉ thêm nếu vai cần"): vai dùng chung `chest` và `UpperArm`. Cận cảnh vai (`closeup_shoulders`) cho thấy vai gập/giơ cao vẫn mềm và không xẹp rõ, nhưng da nối vai–cổ giãn tới 23 mm trên cạnh gốc 7,5 mm khi hai tay vắt chéo; cánh tay mảnh nên trông như "dây" khi giơ cao. **Chưa thấy lý do thêm clavicle nên chưa thêm**; nếu G2 thấy vai chưa đạt thì thêm 2 bone (37 runtime, 27 có trọng số) và làm lại skin vai.
3. **Quay đầu mạnh (50°) và cúi/ngửa**: vải túi sát gáy (phần mép nằm sát đầu) bị kéo, giãn 31 mm (50°), 18 mm (cúi), 11 mm (ngửa); nhìn thấy khe tối giữa mũ và túi ở `head_turn` (bên phải). Mũ và túi đều cứng nên có thể xuyên nhau khi đầu quay lớn (không đo xuyên bằng số, chỉ ảnh).
4. **Khố (`loincloth_front`) không có va chạm**: ở hông gập 70° (`hip_flex_fk`, góc 3/4 trước-trái) đùi nâng và mảnh khố chồng nhau, nghi xuyên (chỉ thấy trên ảnh, chưa đo bằng số); animator cần lái `ctl_loincloth_front` hoặc giới hạn góc hông. Mảnh khố sau (`flap_back`) chỉ theo `pelvis`.
5. **`long_step` giới hạn bởi chân ngắn**: tầm với hông→cổ chân 0,13 m; bước +5 / −4,5 cm là mức IK còn chạm tới. Mục tiêu xa hơn thì chân duỗi thẳng, không tới đích (đã gặp 52 mm sai khi thử 10 cm).
6. **Tai**: gốc tai mỏng; `L_ear`, `R_ear` chỉ có 42 / 31 đỉnh trội; mới thử xoay ±25° (`aux_motion`), chưa kiểm mức khác.
7. **Bản runtime tạm bỏ extension material** (nêu ở mục 3). Texture byte giữ nguyên.
8. Chưa kiểm: hiệu năng trong lab/game, retarget KayKit, clip, sự kiện gameplay (thuộc R6+).

## 6. Chạy lại

Từ thư mục này, trên máy hiện tại (Blender `E:\SteamLibrary\steamapps\common\Blender\blender.exe`, Python 3.10 có numpy + Pillow):

```text
powershell -NoProfile -File tools\run_all.ps1 -Tag v4          # build + kiểm + export tạm + validation + render + ghép ảnh + file QA pose
```

Từng bước (tham số `-- <tag>` nếu có):

```text
blender -b --factory-startup -P tools\b1_build_rig.py                # R2/R3: dựng lại từ GLB gốc -> D01_hodling_rig.blend
blender -b --factory-startup -P tools\v2_rig_function.py             # chức năng control + cực trị (checks\rig_function.json)
blender -b --factory-startup -P tools\c1_export_runtime.py           # GLB runtime tạm (checks\)
blender -b --factory-startup -P tools\v1_validate.py                 # validation.json (A1.1-A1.14)
blender -b --factory-startup -P tools\q1_render.py -- v4             # ảnh Workbench thật
blender -b --factory-startup -P tools\q4_sockets.py -- v4            # ảnh socket
python -I tools\q2_compose.py v4                                     # ghép nhãn + lớp skeleton
blender -b --factory-startup -P tools\q3_qa_pose_actions.py          # qa\D01_hodling_qa_poses.blend
```

`b1_build_rig.py` đọc `tools/landmarks.json` và ghi đè `D01_hodling_rig.blend` (ban trước chép vào `_work/prev/`). Thư mục `_work/` = số đo khám phá và ảnh chẩn đoán, không phải sản phẩm.

## 7. Dấu vết

`D01_hodling_rig.blend` sha256 `57d8aba1de5b56b18f254c07583594750ff9d414ac09a86e23546cdad8f9794c` (14.844.708 B); `checks/D01_hodling_runtime_check.glb` sha256 `328914f969ff79f26cbd13846ded5d886e016c95103a68f08d4057e7e3c0951e` (14.855.472 B); `qa/D01_hodling_qa_poses.blend` sha256 `480710c075e216dd6c4a61aeaeb77527719a37a4b97fb9cceebb42d66ebceac1`. Blender 5.2.2 LTS. Một số file bị khoá tạm thời bởi Windows khi ghi (script đã thêm thử lại); không ảnh hưởng nội dung.
