# D01 Hodling — báo cáo QA kỹ thuật rig (R2–R5, bản v4)

Ngày 2026-10-21. Route M (skeleton riêng theo chuẩn ASHLAR), họ S. G1 người dùng đã duyệt cùng ngày ([`rig_brief.md`](rig_brief.md)).

**Trạng thái: rig v4 đã qua review kỹ thuật Opus vòng 2 `PASS` (B1 vai túi, B2 khố đã sửa); kiểm tự động 14/14 + 20/20 phép thử chức năng + 2 phép đo sửa lỗi đạt; ảnh QA `*_v4.jpg` đã sinh; chờ người dùng duyệt G2.**
Đây là báo cáo kỹ thuật của người dựng, **không phải duyệt G2** (G2 là duyệt thẩm mỹ của người dùng trên ảnh `qa/` hoặc mở `.blend`). Chưa làm R6 (clip), chưa tích hợp lab/game,
chưa có `D01_hodling_rig.glb` release, 0 credit dịch vụ. GLB gốc không đổi (sha256 `bf22ccea…8d5a`, kiểm lại trong `validation.json`). **Chưa có kiểm tra bằng giao diện Blender**
(chỉ render nền Workbench + đọc lại trạng thái UI đã lưu; xem mục 4): không khẳng định gì về viewport thật.

## 0. Sửa v3 → v4 (B1, B2) — số đo trước / sau

Số "trước" đo bằng chính `v5_sack_flap.py` trên snapshot v3 (`_snapshots/v3/sack_flap_v3.json`), số "sau" trên `.blend` hiện hành (`checks/sack_flap.json`). Phép đo định nghĩa ở `tools/d01_measure.py`.

### B1 — trọng số `head`/`neck` rò vào vải túi

- **Nguyên nhân (đã xác nhận trên số)**: `d01_skin.py` pha mỗi đỉnh túi về trọng số thân của đỉnh thân gần nhất (BFS) mà cột `head`/`neck` còn nguyên; giới hạn `sack_head_cap` mặc định = 1,0 (tắt) và đọc từ biến môi trường; bước làm mịn Laplace sau đó kéo head/neck lại từ da lân cận. Ở v3, **384/538 đỉnh vải túi** có trọng số ngoài `{sack, chest, spine_02, spine_01}` (head tối đa 0,915, pelvis 0,467).
- **Sửa**: hằng số trong code `SACK_BONES = (sack, chest, spine_02, spine_01)`, **không còn biến môi trường**; mọi trọng số khác của đỉnh túi được gộp lại (head/neck → chest, pelvis → spine_01, còn lại → chest) trước khi pha **và sau mỗi vòng làm mịn**; `compute()` có `assert` sau cắt top-4/chuẩn hoá rằng đỉnh túi không còn trọng số ngoài danh sách; `v2_rig_function.py` thêm phép thử tương ứng. Gạch (`brick`) vẫn `sack` 1,0.
- **Đường biên túi ↔ da (phát hiện khi kiểm rách, không bỏ qua)**: tách cứng khỏi đầu làm các cạnh dán giữa mép túi và da đầu/tai (cạnh dài 3–12 mm) bị kéo giãn **55 mm** ở `head_turn` (v3: 30,7 mm; bản trung gian chưa có dải chuyển tiếp: 36,8 / 27,0 / 55,5 mm cho cúi / ngửa / quay). Tương tự, gộp pelvis → spine_01 làm viền dưới túi giãn hơn (squat 16,4, twist 18,7, hip_flex 12,4 mm, v3: 7,3 / 11,7 / 8,3). Cách xử lý: **dải chuyển tiếp 3 vòng phía da** (`sack_skin_band`): da trong tầm 3 vòng quanh viền túi có phần theo đầu (head, neck, tai) → chest và phần theo hông/đùi (pelvis, thigh) → spine_01, giảm dần về viền (hệ số smoothstep 0,16 / 0,5 / 0,84). Túi và gạch không nhận thêm gì; tay và chân xa viền không đổi.
- **Kết quả**:

| Chỉ số | v3 | v4 |
| --- | --- | --- |
| Đỉnh vải túi có trọng số ngoài danh sách cho phép | 384 / 538 | **0 / 538** |
| Dịch chuyển tối đa của vải túi (538 đỉnh, không tính gạch) khi chỉ quay đầu/cổ, so với rest — `head_down` / `head_up` / `head_turn` | 77,3 / 70,4 / **95,1 mm** | **0,0 / 0,0 / 0,0 mm** (ngưỡng ≤ 3 mm; ngực đứng yên) |
| Giãn tối đa của cạnh biên túi↔da (194 cạnh) — cúi / ngửa / quay | 17,7 / 11,1 / 30,7 mm | **5,6 / 3,5 / 7,8 mm** |
| Giãn cạnh tối đa của cả mesh — `head_down` / `head_up` / `head_turn` | 17,7 / 11,1 / 30,7 mm | **13,5 / 7,8 / 15,8 mm** |
| Giãn cạnh tối đa `squat` / `twist_p45` / `twist_m45` / `hip_flex_fk` | 7,3 / 11,7 / 10,5 / 8,3 mm | 11,0 / 10,8 / 7,5 / 8,6 mm |

  Mức tăng nhẹ ở `squat` (7,3 → 11,0 mm) là cái giá của việc túi không còn nhận trọng số chân/hông; ảnh `A2_pose_closeup_hips_legs_v4`, `A2_pose_squat_v4` không thấy rách. Các tư thế khác không đổi so với v3 (`hands_crossed` vẫn 22,9 mm, xem 5.2 #2).
- **Ảnh**: `qa/A2_compare_sack_head_v4.jpg` (v3 | v4, cùng camera: v3 viền túi phồng/kéo theo đầu, cục gạch đỏ lộ ra ở `head_down`; v4 viền túi đứng yên, không còn cục đỏ), `A2_pose_closeup_head_neck_v4`, `A2_weights_bone_neck_head_v4` (mặt sau không còn trọng số head/neck), `A2_weights_bone_aux_v4`.

### B2 — khố trước (`flap_front`) và đùi

- Thêm tư thế `hip_flex_fk_loin` = `hip_flex_fk` + `ctl_loincloth_front` xoay **−30°** quanh X thế giới (hằng số `LOIN_CORR_DEG` ở `d01_poses.py`). `hip_flex_fk` **giữ nguyên** làm bản đối chứng chưa sửa.
- **Phương pháp đo** (hình học sau biến dạng, trừ giá trị ở rest): (a) đỉnh khố nằm trong khối than — bỏ phiếu 3 tia chẵn/lẻ trên mesh thân, sâu = khoảng cách tới bề mặt thân gần nhất; (b) số tam giác khố giao tam giác thân (BVH overlap); (c) số đỉnh khố bị đùi che (tia ra trước 8 cm trúng đùi). Vùng thân lấy theo nhóm trọng số trội của bề mặt thân gần nhất ("đùi" = Thigh/Calf/Foot/Toe), **không dùng khoảng cách đỉnh không dấu**, không đếm cả thân.
- **Kiểm chứng phương pháp**: (1) mesh thân có 14 cạnh biên (9 đỉnh ở vai phải/gáy sau, 5 đỉnh dưới bàn chân trái), cách khố ≥ 140 mm nên bỏ phiếu quanh khố không bị ảnh hưởng; (2) điểm có đáp án: trung điểm xương đùi trái → "trong" (đúng), điểm cách 5 cm ra trước đùi → "ngoài" (đúng); (3) chồng chéo có chủ đích: dịch khố ra sau 0 / 4 / 8 / 12 mm ở rest → đỉnh trong thân 3 / 11 / 33 / 53, tam giác giao 5 / 30 / 38 / 54, đơn điệu tăng; (4) quét góc `ctl_loincloth_front` 0…−90° (bước 5°, `checks/loin_sweep.json`): xuyên đùi mới biến mất từ **−15°** (0, −5, −10° còn 4, 2, 2 đỉnh và 9, 7, 6 tam giác); chọn −30° (dư 15°, nằm trong khoảng đề xuất −30…−45°).

| Tư thế | Đỉnh khố trong đùi | Sâu tối đa | Tam giác giao đùi | Đỉnh bị đùi che | Đỉnh trong thân vùng khác |
| --- | --- | --- | --- | --- | --- |
| `rest` | 0 | — | 0 | 0 | 3 (≤ 1,9 mm, có sẵn) |
| `hip_flex_fk` (**chưa sửa**) | **4** (`L_Thigh`) | **0,76 mm** | **9** | **4** | 2 (không mới) |
| `hip_flex_fk_loin` (**đã lái −30°**) | **0** | 0 | **0** | **0** | 2 (không mới, ≤ 0,60 mm) |

- **Nhận xét thật**: xuyên đùi ở bản chưa sửa có thật nhưng **rất nhỏ (4 đỉnh, 0,76 mm)**, nên ô "đỏ" trong bản đồ xuyên chỉ lấm tấm; hình ảnh nhìn thấy rõ hơn là mũi khố nằm sau đùi nhấc lên ở góc 3/4 trước-trái. Điều khiển `ctl_loincloth_front` xử lý được (0 / 0 / 0), nhưng đây là **hiệu chỉnh bằng tay của animator hoặc pose rig, không phải tự động** (không có va chạm, không có shape key sửa). Giới hạn: chỉ đo khố ↔ thân (không đo khố ↔ tay / khố sau), không mô phỏng vải; xuyên đo theo đỉnh/tam giác nên vải mỏng có thể xuyên giữa các đỉnh.
- **Ảnh**: `qa/A2_loincloth_clearance_v4.jpg` (rest, hip_flex_fk, hip_flex_fk_loin: hàng texture + hàng bản đồ xuyên, 4 góc, kèm số đo), `A2_pose_hip_flex_fk_loin_v4`, `A2_pose_closeup_hips_legs_v4`.

## 1. Sản phẩm

| File | Nội dung |
| --- | --- |
| `D01_hodling_rig.blend` | **Nguồn chỉnh sửa được** (14,8 MB, texture 4096 đã pack, byte ảnh = GLB gốc). Mở ra ở T-pose rest trung tính, không Action, viewport Solid + Texture, đang chọn `D01_control`. Gồm: mesh `D01_hodling` (1 mesh, 1 armature modifier), `D01_runtime` (skeleton runtime, 35 bone, ẩn trong viewport nhưng vẫn đánh giá), `D01_control` (rig điều khiển, 45 bone `ctl_*`). **`run_all.ps1` ghi đè file này mỗi lần chạy** |
| `validation.json` | R4: A1.1–A1.14 kèm số đo, ngưỡng, ghi chú; nhất quán nguồn↔runtime; 20 phép thử chức năng control (gồm vai túi độc lập đầu); cực trị 17 tư thế; trạng thái mở lại file; `fix_checks_v4` (B1, B2) |
| `checks/` | `D01_hodling_runtime_check.glb` (**GLB runtime tạm chỉ để kiểm A1**, không phải `_rig.glb`; khác GLB gốc ở material, xem mục 3), `rig_function.json`, `sack_flap.json` (số đo B1/B2), `loin_sweep.json` (quét góc khố), `viewport_state.json`, `qa_pose_actions.json` |
| `qa/A2_*_v4.jpg` | Ảnh QA hiện hành (mục 5). `qa/_superseded/<tag>/` = các lần chạy cũ kèm lý do (`README.md`); v3 nằm ở `_superseded/v3/` (lý do: rò trọng số head vào vai túi). `qa/_raw/<tag>/info*.json` = phép chiếu + vị trí bone của từng ảnh (ảnh raw bị xoá, tái sinh bằng script) |
| `qa/D01_hodling_qa_poses.blend` | File QA **riêng**: 17 Action tĩnh `QA_pose_*` đánh dấu `status=experiment`, **không phải clip production**. Nguồn không chứa Action |
| `_snapshots/v3/` | **Bản nguồn trước sửa**: `.blend` v3, `validation.json`, `qa_report.md`, `rig.log`, tools lúc đó, `sack_flap_v3.json`, `SHA256.txt`. Chỉ để đối chiếu (xem `_snapshots/README.md`) |
| `tools/` | Script lặp lại được (mục 6). `landmarks.json` = landmark giải phẫu đo trên mesh |

## 2. Quyết định kỹ thuật và số đo thật

- **Scale**: đều toàn mesh, hệ số **0,679495687** (= 0,5 / Y max của GLB), tính từ hình học. Topology, UV (`max diff 0`), chỉ số đỉnh, tam giác (10.668) và 3 texture giữ nguyên (so với GLB gốc: đỉnh lệch tối đa 1,5e-8 m).
- **Trục (đã xác minh trên mesh, không chỉ suy luận)**: đỉnh có Y nhỏ nhất của mesh (mũi) nằm ở Y = −0,1558 (Blender) = +Z glTF; mũi chân cũng hướng −Y Blender; ảnh render thật (`A2_skeleton_overlay_side`) nhìn từ bên phải quái cho thấy mặt quay sang phải ảnh. Trái quái = **+X** (Blender và glTF). Xuất glTF Y lên.
- **Mesh không đối xứng, rig theo mesh thật**: hai chân/bàn chân lệch **+0,0105 m theo X** so với tâm tay/đầu (chân phải = gương của chân trái quanh x = 0,0105, `pelvis` ở x = +0,010); **tai phải cao hơn và lùi ra sau hơn tai trái** nên `R_ear` đo riêng (`landmarks.json` → `ear_R`), không lấy gương. Lần chạy `v1` đặt sai `R_ear`; phép đo "khớp trong mesh" bắt được.
- **Bone**: runtime **35** = 22 lõi + 5 phụ (`helmet`, `sack`, `loincloth_front`, `L_ear`, `R_ear`) + 8 socket. **25 bone có trọng số**; 10 bone không trọng số = 8 socket + `root`, `cog` (tổ tiên cấu trúc, ngoại lệ đã thống nhất ở G1 và ghi vào `SKELETON_STANDARD.md` mục 7). Rig điều khiển 45 = 27 FK + 18 (hand IK ×2, pole khuỷu ×2, foot IK ×2, toe/heel/ball roll ×6, ankle/toe target ×4, pole gối ×2). Không ngón, không mặt, **không clavicle** (xem 5.2).
- **Hình học khớp**: đầu của 20 bone thân/tay/chân lõi, `helmet`, `sack` đều nằm trong mesh (`joints_inside_mesh`, bỏ phiếu 3 tia). Ngoại lệ: `loincloth_front` 4,6 mm ngoài (vải mỏng), `L_ear`/`R_ear` 1,9 / 2,2 mm ngoài (gốc tai mỏng), socket nằm trên/gần bề mặt. Khuỷu cách đường vai–cổ tay +3,3 mm ra sau (pre-bend ~4°), gối giữ độ cong đo được 9° của chân: chuỗi IK không thẳng tuyệt đối ở rest nên không bị suy biến. Trục gập của khuỷu/gối = pháp tuyến thật của mặt phẳng cong; xoay local X dương = khuỷu gập ra trước / gối gập (bàn chân ra sau). Góc pole tìm bằng quét: đúng −90° cho cả 4 chuỗi, độ lệch rest = 0.
- **Rig điều khiển ↔ runtime**: runtime bám điều khiển bằng Copy Transforms (thế giới→thế giới); rest trùng tuyệt đối (`control_vs_runtime_rest_max_diff` = 0); `rest_eval_vs_stored` = 5,6e-7 m (tư thế rest không biến dạng). IK chân/tay bật/tắt bằng thuộc tính `ik_leg_L/R`, `ik_arm_L/R` trên `D01_control` (driver). Chân: `ctl_*_Foot_IK` (gót), `Toe_roll` (nhấc gót quanh mũi), `Heel_roll` (nhấc mũi quanh gót), `Ball_roll` (nhấc gót quanh khớp bóng), `Knee_pole`. Tay: `ctl_*_Hand_IK` (con của `ctl_chest`), `Elbow_pole`. `ctl_root`, `ctl_cog` tách riêng.
- **Skin** (`tools/d01_skin.py`, khởi điểm tự động rồi soi và sửa): phân vùng theo thành phần liền kề của mesh (mũ, sừng, gạch, mắt, khố đều là cụm riêng sau khi hàn đỉnh trùng ở đường nối UV: 5.389 vị trí / 6.505 đỉnh) + màu + hình học; trọng số = nghịch đảo khoảng cách tới đoạn xương (trừ bán kính) có "cổng" vùng và bên, làm mịn Laplace, chuyển tiếp khuỷu/cổ tay tính theo toạ độ dọc; mũ + sừng → `helmet` 1,0; gạch → `sack` 1,0; mắt → `head`; **vải túi chỉ nhận `sack`/`chest`/`spine_02`/`spine_01` (mục 0)** + dải chuyển tiếp phía da quanh viền túi; dây đai theo cột sống/ngực; khố: thắt lưng theo `pelvis`/`spine`, mảnh trước `pelvis`→`loincloth_front` (không đùi, tránh kẹt chân), mảnh sau `pelvis`. Cắt top-4, chuẩn hoá.

## 3. A1 — kiểm tự động (`validation.json`, tất cả đã đo trên bản v4)

| # | Kết quả | Số đo chính |
| --- | --- | --- |
| A1.1 | đạt | 1 skin, 1 mesh, 1 primitive, node mesh = node skin |
| A1.2 | đạt | 35 tên, duy nhất, đúng chuẩn mục 3 + phụ D01, không ký tự lạ / hậu tố `.L` |
| A1.3 | đạt | 1 gốc: `root` (cha là node armature `D01_runtime`) |
| A1.4 | đạt | 6.505 đỉnh, 0 đỉnh trống |
| A1.5 | đạt | tổng trọng số 1 ± 1,3e-7 (ngưỡng 1e-6) |
| A1.6 | đạt | tối đa 4; 2.979 đỉnh 1 ảnh hưởng, 1.822 đỉnh 2, 905 đỉnh 3, 799 đỉnh 4; không có `JOINTS_1` |
| A1.7 | đạt | chỉ số joint 0–32 < 35; 25 joint có trọng số |
| A1.8 | đạt | lệch ma trận bind nghịch đảo tối đa 2,5e-6 (ngưỡng 1e-5) |
| A1.9 | đạt | Blender import lại từ thư mục mới: lệch hình học 1,25e-7 m hai chiều (ngưỡng 1e-4); GLB↔nguồn trực tiếp 0; bộ ba đỉnh của 10.668 tam giác khớp; UV khớp; 35 bone, 35 nhóm đỉnh, 3 ảnh 4096² |
| A1.10 | đạt | sha256 byte ảnh nhúng = GLB gốc cả 3 map (base `9bf5cece…`, MR `8c104752…`, normal `b3502fa3…`); exporter không mã hoá lại, không cần vá byte |
| A1.11 | đạt | Y max = 0,5 m (0%) |
| A1.12 | đạt | đỉnh thấp nhất Y = 0 |
| A1.13 | đạt | 10 bone không trọng số = 8 socket + `root`, `cog` (tổ tiên cấu trúc) |
| A1.14 | đạt | object transform đơn vị, `matrix_parent_inverse` đơn vị; GLB: node armature, mesh và `root` đều TRS đơn vị; scale bone lệch tối đa 4,2e-6, không âm |

Nhất quán nguồn↔runtime: trọng số `.blend` vs GLB lệch tối đa 1,2e-7; ma trận rest bone vs nút GLB 2,5e-6; GLB không chứa `ctl_*`, không Action, không mesh phụ (37 nút = 35 bone + armature + mesh).
**Khác biệt material so với GLB gốc (không phải "giữ nguyên")**: GLB runtime tạm do exporter của Blender xuất ra **bỏ extension `KHR_materials_volume` và `specularFactor` mặc định** của GLB gốc. Byte texture giữ nguyên (A1.10) và mesh/UV giữ nguyên, nhưng material của file kiểm tra khác nguồn. Đây chỉ là file kiểm, quyết định giữ/chuyển extension khi làm bản release để R7.
`fix_checks_v4` (mục 0): B1 đạt (vai túi 0,0 mm ≤ 3 mm, 0 trọng số ngoài danh sách), B2 đạt (phương pháp hợp lệ, hiệu chỉnh 0 xuyên mới).

## 4. Chức năng rig trên file đã lưu rồi mở lại (`checks/rig_function.json`)

- Mở lại: pose bone đều ở identity, 0 Action, `ik_*` = 1, shading Solid/Texture/Studio, đối tượng chọn = `D01_control`, đơn vị mét, 24 fps. **Hạn chế (không đổi)**: Blender chạy nền không có OpenGL nên **không chụp được ảnh viewport**; chỉ đọc lại được trạng thái UI đã lưu. Kết nối Blender MCP của parent cũng không dùng được, nên **không có kiểm tra bằng giao diện**; ảnh QA là render Workbench nền, đã được xem bằng mắt qua ảnh. Cần mở `.blend` bằng giao diện để xem viewport thật.
- **20/20 phép thử control đạt**: 16 phép cũ (kéo `Foot_IK` ±0,004 m mục tiêu, chân bên kia và thân đứng yên, `Hand_IK`, pole gối/khuỷu quay đúng hướng khi chi đã gập, `Heel/Toe/Ball_roll`, `ctl_root` kéo cả model, `ctl_cog` hạ thân mà đế chân đứng ≤ 3 mm, xoay `chest`/`head`, tắt IK sang FK) + 4 phép mới: vai túi chỉ có trọng số cho phép; vai túi đứng yên (< 3 mm, đo 0,0) khi `head_turn`, `head_up`, `head_down` với ngực không chuyển động.
- **Cực trị 17 tư thế**: không NaN/inf, ma trận bone sạch. Giãn cạnh tuyệt đối tối đa theo tư thế: vai/tay ≤ 22,9 mm (cạnh gốc 7,5 mm, `hands_crossed`), `head_turn` 15,8 mm, `twist_p45` 10,8, `squat` 11,0 (bảng đầy đủ ở mục 0 và `validation.json`); phân vị 99 ≤ 5,4 mm. Tiếp xúc: đế chân đang đặt đứng có đế thấp nhất tại 0,0 mm; `long_step` chân sau nhấc gót, mũi chân cách sàn 2,9 mm. Với `hip_flex_fk`, `hip_flex_fk_loin`, `hip_abduct_fk` (FK, chân nhấc) không đánh giá tiếp xúc.
- **Socket**: `R/L_weapon_attach` và 5 socket khác đi theo bàn tay/đầu/ngực đúng (lệch ma trận cục bộ ≤ 1,8e-7 qua 17 tư thế). Trục Y socket vũ khí = hướng ra trước ở T-pose (thế giới `(0,−1,0)`), Z = +X (`A2_sockets`; thanh QA chỉ nằm trong bộ nhớ lúc render).
- File QA riêng `qa/D01_hodling_qa_poses.blend`: mở lại, gán từng Action, đỉnh trùng tư thế trực tiếp (`checks/qa_pose_actions.json`, 17/17).

## 5. A2 — ảnh QA (người xem) và khuyết điểm còn lại

### 5.1 Ảnh theo mục A2 (tất cả `qa/*_v4.jpg`)

| Mục A2 | File | Nhận xét kỹ thuật |
| --- | --- | --- |
| Skeleton chồng mesh (trước, bên, sau) | `A2_skeleton_overlay_{front,side,back}_v4.jpg` (35 nhãn), `A2_skeleton_overlay_3view_v4.jpg` (22 nhãn lõi), `A2_control_rig_overlay_{front,side}_v4.jpg` | Vai, khuỷu, cổ tay, hông, gối, cổ chân, bóng chân nằm trong khối. Trục xương theo đúng mesh nghiêng/gù |
| Bản đồ trọng số tổng thể | `A2_weights_dominant_v4`, `A2_weights_blend_v4`, `A2_weights_influences_v4` | không loang bone xa; đối xứng trái/phải rõ; tay không dính thân |
| Trọng số từng bone | `A2_weights_bone_{spine,neck_head,arm_L,arm_R,leg_L,leg_R,aux}_v4`, `A2_regions_{1,2}_v4` | Cẳng tay/bàn tay chuyển tiếp mịn, bàn tay cứng; mặt sau túi không còn head/neck. `spine_02`, `neck` vẫn **không có đỉnh nào trội > 0,5** (chỉ là đoạn pha trộn); `spine_01` nay có 96 đỉnh trội (v3: 6) vì vải túi gộp pelvis vào `spine_01` |
| Tư thế thử (ba góc) | `A2_pose_<tên>_v4` (17 tư thế, ảnh sạch + ảnh có skeleton), `A2_pose_contact_sheet_v4`, cận cảnh `A2_pose_closeup_{shoulders,hips_legs,elbows,head_neck,torso_sack}_v4` (có góc 3/4) | mỗi tư thế dựng bằng control rig thật. `hip_flex_fk_loin` là bản đã lái khố; `hip_flex_fk` là bản đối chứng. Hình dạng giữ sạch ở hầu hết tư thế (xem 5.2) |
| Vùng khó: túi, đầu | `A2_compare_sack_head_v4` (v3 | v4), `A2_pose_closeup_head_neck_v4`, `A2_pose_closeup_torso_sack_v4` | xem mục 0 và 5.2 |
| Vùng khó: khố | `A2_loincloth_clearance_v4`, `A2_pose_closeup_hips_legs_v4` | xem mục 0 |
| Socket | `A2_sockets_v4.jpg` | đúng trục, quay cùng tay |

### 5.2 Khuyết điểm còn lại (không có gì bị bỏ qua im lặng)

1. **Ngón tay không có bone** (theo brief đã duyệt): ngón co/duỗi không được, cả bàn tay cứng theo `*_Hand`; khi giơ tay/vắt tay ngón giữ nguyên cong như T-pose.
2. **Không có clavicle** (mặc định G1, "chỉ thêm nếu vai cần"): vai dùng chung `chest` và `UpperArm`. Cận cảnh vai cho thấy vai gập/giơ cao vẫn mềm và không xẹp rõ trong ảnh, nhưng da nối vai–cổ giãn tới **22,9 mm** trên cạnh gốc 7,5 mm khi hai tay vắt chéo; cánh tay mảnh nên trông như "dây" khi giơ cao. **Lựa chọn thẩm mỹ cho G2**: nếu chưa đạt thì thêm 2 bone (37 runtime, 27 có trọng số) và làm lại skin vai; không bắt buộc.
3. **Quay/cúi/ngửa đầu**: vải túi đã độc lập hoàn toàn với đầu (0,0 mm); phần giãn còn lại nằm ở da đầu/tai sát mép túi (cạnh biên ≤ 7,8 mm; giãn cạnh lớn nhất của mesh khi quay 50° là 15,8 mm, ở gốc tai). Mũ và túi đều cứng, khe tối giữa mũ và túi ở `head_turn` (góc bên phải) còn thấy: **câu hỏi thẩm mỹ cho G2**, không đo xuyên bằng số giữa mũ và túi.
4. **Khố (`loincloth_front`)**: đã đo và có tư thế hiệu chỉnh (mục 0). Không có va chạm tự động: animator phải lái `ctl_loincloth_front` (≥ −15°, khuyến nghị −30° khi hông gập 70°) hoặc giới hạn góc hông. Mảnh khố sau (`flap_back`) chỉ theo `pelvis` (chưa đo). Không đo khố ↔ tay.
5. **`long_step` giới hạn bởi chân ngắn** (brief đã chốt tỉ lệ): tầm với hông→cổ chân 0,13 m; bước +5 / −4,5 cm là mức IK còn chạm tới. Mục tiêu xa hơn thì chân duỗi thẳng, không tới đích.
6. **Tai**: gốc tai mỏng; `L_ear`, `R_ear` chỉ có 42 / 25 đỉnh trội (v3: 42 / 31; `R_ear` giảm do dải chuyển tiếp quanh viền túi kéo bớt trọng số tai về `chest`); mới thử xoay ±25° (`aux_motion`), chưa kiểm mức khác.
7. **Bản runtime tạm khác GLB gốc ở material** (`KHR_materials_volume`, mục 3). Texture byte giữ nguyên.
8. **Chưa có kiểm tra bằng giao diện Blender** (mục 4). Chưa kiểm: hiệu năng trong lab/game, retarget KayKit, clip, sự kiện gameplay (thuộc R6+).

## 6. Chạy lại

Từ thư mục này, trên máy hiện tại (Blender `E:\SteamLibrary\steamapps\common\Blender\blender.exe`, Python 3.10 có numpy + Pillow):

```text
powershell -NoProfile -File tools\run_all.ps1 -Tag v5          # -Tag BẮT BUỘC; dừng nếu tag đã có ảnh trong qa/ (trừ khi -Overwrite)
```

`run_all.ps1` **ghi đè** `D01_hodling_rig.blend`, `validation.json`, `checks/*`; bản v3 giữ ở `_snapshots/v3/`. Từng bước (tham số `-- <tag>` nếu có):

```text
blender -b --factory-startup -P tools\b1_build_rig.py                # R2/R3: dựng lại từ GLB gốc -> D01_hodling_rig.blend (GHI ĐÈ)
blender -b --factory-startup -P tools\v2_rig_function.py             # chức năng control + cực trị + vai túi (checks\rig_function.json)
blender -b --factory-startup -P tools\v5_sack_flap.py -- --sweep    # đo vai túi và khố<->đùi (checks\sack_flap.json, loin_sweep.json)
blender -b --factory-startup -P tools\c1_export_runtime.py           # GLB runtime tạm (checks\)
blender -b --factory-startup -P tools\v1_validate.py                 # validation.json (A1.1-A1.14 + fix_checks_v4)
blender -b --factory-startup -P tools\q1_render.py -- v4             # ảnh Workbench thật (gồm bản đồ xuyên khố)
blender -b --factory-startup -P tools\q4_sockets.py -- v4            # ảnh socket
blender -b --factory-startup -P tools\q5_sack_compare.py -- v4       # đối chiếu vai túi v3 | hiện hành
python -I tools\q2_compose.py v4                                     # ghép nhãn + lớp skeleton
blender -b --factory-startup -P tools\q3_qa_pose_actions.py          # qa\D01_hodling_qa_poses.blend
python -I tools\qa_cleanup.py v4                                     # tag cũ -> qa\_superseded\, xoá raw (chỉ trong rig\qa)
```

Đo bản cũ: `blender -b --factory-startup -P tools\v5_sack_flap.py -- --blend _snapshots\v3\D01_hodling_rig.blend --out _snapshots\v3\sack_flap_v3.json`. Thư mục `_work/` = số đo khám phá, ảnh chẩn đoán và log chạy, không phải sản phẩm.

## 7. Dấu vết

Sinh từ lần chạy `run_all.ps1 -Tag v4 -Overwrite` cuối cùng (thoát 0). Blender 5.2.2 LTS.

| File | sha256 | Kích thước |
| --- | --- | --- |
| `D01_hodling_rig.blend` | `bf6c53dc783842774b6c75b2f35eb708bbbbe47cee0139e560c97efa97bc0bcb` | 14.843.252 B |
| `checks/D01_hodling_runtime_check.glb` | `e671555dcfc55155031b707bf6e3cf6d30bba9a5b6c4325460ac7c7a18540072` | 14.855.472 B |
| `qa/D01_hodling_qa_poses.blend` | `8eb8b26694c7d5c6ad4a276bc8db26a4fa5aa3cb2a9b06a3fc5f18c8445cd3c6` | 15.000.226 B |
| `validation.json` | `f902e001f2910240b2cb0ee94fe5abd7be893a2f6aba9652b9fe80df41452ded` | |
| `checks/rig_function.json` | `f5c285dd2369e581873d14ee71cf5877382ebd86ad012e903e5baf0e29c5d058` | |
| `checks/sack_flap.json` | `3eb5f6e314241187cd03a38b7bede8fea16587c3827d934187c4170a3acb83fe` | |
| GLB gốc `../D01_hodling.glb` | `bf22ccea25b72a879048fe3d0bf4ecf92b551984b85081ae97e3bea56f3d8c5a` (không đổi) | 14.778.932 B |

Bản v3 đã thay (giữ ở `_snapshots/v3/`): `.blend` `57d8aba1de5b56b18f254c07583594750ff9d414ac09a86e23546cdad8f9794c`, runtime GLB `328914f969ff79f26cbd13846ded5d886e016c95103a68f08d4057e7e3c0951e`, QA poses `480710c075e216dd6c4a61aeaeb77527719a37a4b97fb9cceebb42d66ebceac1`. Mỗi lần dựng lại `.blend` có sha khác nhau ngay cả khi đầu vào giống nhau (metadata Blender); hash trong `validation.json` và `checks/sack_flap.json` luôn là của `.blend` hiện hành. Một số file bị khoá tạm thời bởi Windows khi ghi (script đã thêm thử lại); không ảnh hưởng nội dung.
