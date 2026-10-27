# QA rig — U04_charnel_ghoul (R2–R5, qua G2 2026-10-27)

Ngày 2026-10-26, cập nhật 2026-10-27 (chân sau 3 đốt theo người dùng) · Opus 5.5 · route M, họ Qh · Blender 5.1.1 chạy nền · 0 credit ·
GLB gốc chỉ đọc (sha256 kiểm mỗi lần dựng). Brief đã duyệt G1: [`rig_brief.md`](rig_brief.md). Số đo thô: [`validation.json`](validation.json),
[`_work/poses.json`](_work/poses.json), [`_work/build.json`](_work/build.json).

## 1. Tóm tắt

- **A1 (kiểm tự động): 16/16 đạt** (14 mục của `QA_CHECKLIST.md` + 2 kiểm thêm: đỉnh trùng vị trí chung trọng số, 16/16 phép thử rig điều khiển).
- **A2 (ảnh)**: bốn tờ trong `qa/`, ảnh gốc ở `qa/raw/` (113 ảnh).
- **2026-10-27**: người dùng xem trong editor và đánh dấu thêm một khớp ở chân sau. Chân sau thành 3 đốt: `Thigh` (hông → gối, gối chĩa
  trước), `Calf` (gối → khuỷu cổ chân sau, chĩa sau), `L/R_Calf_02` (khuỷu cổ chân sau → gót, bone mới). Các tư thế cũ giữ số đo hoặc tốt hơn
  (nhấc gót 3,53× → 1,68×).
- **Spring + lớp vải** (27/10, mục 4b): 7 chuỗi (áo lớp 0, dây cổ lớp 1), 13 collider, 4 cặp nối vải; bone collection theo áo (Body, Smock,
  Tie, Socket).

| Tờ | Nội dung |
| --- | --- |
| [`U04_charnel_ghoul_G2_1_skeleton.png`](qa/U04_charnel_ghoul_G2_1_skeleton.png) | skeleton runtime chồng mesh X-ray (trước, bên, sau, trên), đầu–cổ–hàm, rig điều khiển |
| [`U04_charnel_ghoul_G2_2_weights.png`](qa/U04_charnel_ghoul_G2_2_weights.png) | trọng số tổng thể 4 góc + 11 vùng (đầu/hàm, vai trước và bên, thân, hông, chân sau 3 đốt, khuỷu, bàn tay, bàn chân, áo, dây + mũ) |
| [`U04_charnel_ghoul_G2_3_poses.png`](qa/U04_charnel_ghoul_G2_3_poses.png) | tư thế thử chính: phi (vươn, gom), vồ, ngẩng, cúi, há thêm, ngậm 50° và 85° |
| [`U04_charnel_ghoul_G2_4_extremes.png`](qa/U04_charnel_ghoul_G2_4_extremes.png) | khớp cực trị: quay đầu, vặn, nghiêng, tay trước/sau, gập khuỷu 110°, đùi trước/sau, gập gối, gập và đẩy khuỷu cổ chân sau, ngồi thụp, nhún vai, lăn lòng tay, nhấc gót, lắc vải |

- Khuyết điểm còn lại (mục 6): nách và mặt trước vai giãn 4–5× một cạnh khi tay vươn mạnh (dưới áo); nếp khuỷu ép 8,9× ở 110°;
  vạt sườn và vạt mông lọt chi vài chục đỉnh khi chi vung mạnh; hai đầu dây cổ xoay theo cổ khi ngẩng đầu; hàm ngậm tối đa 85°.

## 2. Đã dựng

| Phần | Nội dung |
| --- | --- |
| File nguồn | `rig/U04_charnel_ghoul_rig.blend` (16,6 MB, 3 map 4096 đóng gói, byte giống GLB). Collection `U04_Rig`: mesh `U04_charnel_ghoul` (1 mesh, 1 Armature modifier → `U04_runtime`), `U04_runtime` (ẩn trong viewport, vẫn đánh giá), `U04_control` (đang chọn). Mở ra ở rest, không Action, viewport Solid + Texture, 24 fps |
| Scale | ×1,1822 (G1, phương án A): cao 1,1701 m = 0,65H; GLB không sửa, scale áp vào dữ liệu mesh của file nguồn |
| Skeleton runtime | 55 bone: 46 deform (lõi H 26 + `L/R_Finger` + `neck_02`, `jaw`, `L/R_Calf_02` + `tie_01..02` + áo 12) + `root`, `cog` + 7 socket (`ground`, `hit_origin`, `fx_chest`, `fx_head`, `fx_mouth`, `fx_hand_L/R`). Bone collection như `spring_layers.py` của lô (PS Pyre Singer): Body (deform), Smock, Tie, Socket (ẩn) |
| Chân sau (27/10) | `L_Thigh` hông → gối (khớp người dùng đánh dấu trong editor, x giữa mặt cắt chân) → `L_Calf` gối → khuỷu cổ chân sau (khớp "gối" cũ, chĩa sau) → `L_Calf_02` → gót (cổ chân cũ) → `L_Foot` → `L_Toe`. `Foot` nay là con của `Calf_02` |
| Trục | X cục bộ = +X thế giới (trừ `Clavicle`: Z lên) cho mọi bone, hai bên như nhau; `head` từ khớp đầu lên đỉnh sọ như H (sau G1, theo P04) |
| Rig điều khiển | 82 bone `ctl_*`: FK cho mọi bone deform; tay `ctl_X_Hand_IK` → `Fingertip_roll` → `Palm_roll` → `Wrist_target` + `Finger_target`, pole `Elbow_pole` sau khuỷu (con `ctl_chest`); chân `ctl_X_Foot_IK` → `Heel_roll` → `Toe_roll` → `Ball_roll` → `Ankle_target` (Foot chép) + `Hock_roll` (xoay quanh cổ chân) → `Hock_target` (đích IK, Calf_02 chép) + `Toe_target`, pole `Knee_pole` trước gối (con `ctl_pelvis`); IK 2 đốt khoá trục X (tay UpperArm–ForeArm, khuỷu −150…+10°; chân Thigh–Calf tới khuỷu cổ chân sau, gối −25…+130°); công tắc `ik_arm_L/R`, `ik_leg_L/R`; xoắn: `*_twist` theo Locked Track 50 % (bake ở R8); `ctl_jaw` giới hạn −85…+25° quanh X, ±8° hai trục kia. Runtime theo control bằng Copy Transforms (thế giới). Bone collection: Root/COG, Spine/Head, Arms FK, Legs FK, Jaw, Smock, Tie, IK + contact, Poles, Twist (auto, ẩn) |
| Spring + lớp vải (27/10) | `rig/editor/U04_charnel_ghoul_springbones.json` (định dạng `spring-bone.js` của editor, như F01/P02), xem mục 4b |
| Pole | góc dò cho rest không đổi: tay trái 85,875°, phải 94,035°; chân trái −81,29°, phải −98,775° |
| Trọng số thân | hạt giống theo vùng (đầu và hàm theo cung quanh khớp hàm; tay, chân theo dải dọc chi chừa khoảng blend ở khớp, chân sau 3 đoạn; bàn tay, bàn chân theo vùng; xương đòn ở đỉnh vai; lõi thân theo hàm nón dọc cột sống) rồi giải điều hoà trên mesh hàn (2285 đỉnh cố định, 1521 tự do, Laplace trọng số 1/độ dài cạnh). Nách và mỏm vai, gốc đùi để tự do. Xoắn tay theo tỉ lệ của skill (50 % ở vai giảm về 0 ở khuỷu; 0 ở khuỷu tăng tới 60 % ở cổ tay). Top 4, chuẩn hoá |
| Mũ trùm | bám da gần nhất, bỏ hàm (vạt má không theo hàm); làm mịn 4 lượt |
| Dây cổ | vòng + nút: một bộ trọng số chung (đi như một khối, không giãn khi quay cổ); hai đầu dây chuyển dần sang `tie_01..02` |
| Áo liệm | phần nằm trên lưng bám thân (chi chỉ giữ 25 % ở cánh tay trên, đùi và cẳng gối, cổ 30 %, còn lại 0), vạt treo chuyển dần sang 6 chuỗi 2 bone (thành viên vùng làm mịn trên áo để chuỗi kề nhau trộn) |
| Răng | 14 mảnh cứng: 6 trên = `head`, 8 dưới = `jaw` |

## 3. A1 — kiểm tự động (`validation.json`)

| # | Kiểm tra | Kết quả |
| --- | --- | --- |
| A1.1 | Một skin, một mesh | đạt: `U04_charnel_ghoul`, 1 Armature modifier |
| A1.2 | Tên bone đúng chuẩn, không trùng | đạt: 55 tên, đủ lõi H + Qh, không `.`/khoảng trắng/hậu tố bên (`fx_hand_L/R` là tên socket chuẩn) |
| A1.3 | Một cây, gốc `root` | đạt |
| A1.4 | Mọi đỉnh có trọng số | đạt: 0 đỉnh trống |
| A1.5 | Tổng trọng số 1 ± 1e-6 | đạt: sai lớn nhất 4,5e-8 |
| A1.6 | ≤ 4 ảnh hưởng | đạt: tối đa 4 |
| A1.7 | Nhóm đỉnh = bone deform | đạt |
| A1.8 | Bind / rest | đạt: ma trận rest trực chuẩn (5e-7), đầu bone nối trùng đuôi cha (0), control = runtime ở rest (0), mesh ở rest khi IK tắt lệch 1,2e-7 m. IK bật ở rest lệch 0,068 mm (dung sai hội tụ của bộ giải IK; ngưỡng ghi 0,2 mm) |
| A1.9 | Mesh = GLB đã scale | đạt: lệch đỉnh lớn nhất 1,1e-7 m (5545 đỉnh, so với GLB nhập lại). Lượt này không xuất GLB nên so trên mesh trong `.blend` |
| A1.10 | Texture không đổi | đạt: 3/3 map đóng gói có sha256 bằng ảnh trong GLB |
| A1.11 | Chiều cao | đạt: 1,1701 m so với 1,17 m danh mục |
| A1.12 | Chạm đất | đạt: z thấp nhất 0 (móng tay). Chân sau thấp nhất 0,069 m (lơ lửng, lỗi mesh đã ghi ở brief) |
| A1.13 | Bone không trọng số | đạt: mọi bone deform có trọng số; không deform = 7 socket + `root`, `cog` (tổ tiên cấu trúc) |
| A1.14 | Transform object | đạt: scale 1, không xoay, ở gốc (mesh, runtime, control) |
| X1 | Đỉnh trùng vị trí chung trọng số | đạt: 0 cặp khác (21 cặp đường nối của importer) |
| X2 | Rig điều khiển | đạt 16/16: Foot_IK lên 5,9 cm → cổ chân theo 5,9 cm, chân kia và thân đứng yên; Hand_IK lên 7,1 cm → cổ tay theo 7,1 cm, ngực yên; Palm_roll +30° → đầu ngón lệch 0,01 mm, cổ tay nhấc 3,4 cm; Ball_roll +30° → mũi chân 0, cổ chân nhấc 3,2 cm; dời pole gối 11,8 cm → gối quay 1,9–2,2 cm, cổ chân yên; Hock_roll +20° → khuỷu cổ chân sau tiến 7,7 cm (dời 8,2 cm), cổ chân yên; `ctl_root` kéo cả con; hạ `ctl_cog` 5,9 cm → chân, tay đứng yên (≤ 0,01 mm), hông hạ đúng 5,9 cm; công tắc FK chân (gối dời 14 cm khi đùi xoay 30°); xoắn cẳng tay nhận 22° khi bàn tay xoay 60° quanh trục bàn |

## 4. A2 — ảnh và vùng khó

- **Skeleton chồng mesh** (G2 1/4): khớp vai nằm trong u vai dưới áo, khuỷu ở núm xương (chỉ về sau), gối chân sau ở chỗ gập cuối đùi (chĩa
  trước), khuỷu cổ chân sau ở núm xương (chỉ về sau), cổ tay trên gót bàn tay, cổ chân trên gót, khớp hàm sau khoé miệng, cổ 2 đoạn dọc giữa
  cổ. Không khớp nào lệch khỏi khối.
- **Trọng số** (G2 2/4): không loang sang bone xa. Hàm chỉ ở hàm dưới và khoé miệng; mũ trùm không theo hàm; áo không theo cẳng tay/ống chân;
  cột sống chuyển mượt pelvis → spine_01 → spine_02 → chest; bên thân và u vai do `Clavicle` giữ (vùng xương bả vai); chân sau chia ba dải
  đùi / cẳng gối / `Calf_02`, chuyển mượt ở gối và khuỷu cổ chân sau.
- **Vùng khó trong brief**:

| Vùng | Kết quả |
| --- | --- |
| Hàm, khoang miệng | ngậm 50° giãn 2,8×, 70° 4,4× (khoé miệng), 85° 3,5×; khe răng 47 / 6 / 1 mm. Răng chạm gần 90° nên `ctl_jaw` giới hạn −85° |
| Mũ trùm | không rách khi ngẩng/cúi/quay đầu (mũ giãn ≤ 2,0×); vạt má đứng yên khi hàm đóng, hàm đi vào trong vạt |
| Cổ dài 2 đoạn | ngẩng 1,76×, cúi 2,50×, quay đầu 57° 2,18× |
| Vai dưới áo | xem mục 6.1 |
| Áo một lớp | không rách theo chi; vạt sườn/mông lọt chi khi chi vung mạnh (mục 6.4) |
| Hông dưới vạt mông | đùi trước 60° + khuỷu cổ chân sau 70°: 3,13×; đùi sau 45°: 2,12× |
| Chân sau 3 đốt | gập gối 70°: 2,44×; gập khuỷu cổ chân sau 50°: 1,91×; đẩy khuỷu cổ chân sau 20° (IK): 1,35×; ngồi thụp hạ cog 14 cm (IK): 2,61×; IK dùng pole trước gối, khoá trục X |
| Bàn tay 5 ngón | lăn lòng tay 40°: 3,51× ở gót bàn tay, ngón đứng yên |
| Chân sau lơ lửng | rest giữ nguyên; IK hạ chân xuống được (Foot_IK, cog) |

- **Socket**: không có socket vũ khí (đã duyệt G1). `fx_mouth` trong khoang miệng (con `head`), `hit_origin` trước mõm (con `root`),
  `fx_hand_L/R` giữa lòng bàn tay, `fx_head` đỉnh sọ, `fx_chest` trước ngực, `ground` ở gốc.

## 4b. Spring bone và lớp vải (`rig/editor/U04_charnel_ghoul_springbones.json`, 27/10)

`scripts/u04_spring.py` đọc rig đã lưu (không sửa `.blend`), cùng định dạng và preset với `rig_v1/tools/spring_layers.py`. Editor mở file này
ở chế độ Spring; engine đọc cùng file.

| Chain | Lớp | stiffness / drag / gravity / gió | hitRadius | endLength (= dài đốt cuối) |
| --- | --- | --- | --- | --- |
| `smock_back_01` | 0 | 1,7 / 0,45 / 0,4 / 1,0 | 0,045 | 0,198 |
| `L/R_smock_flank_01` | 0 | 1,6 / 0,45 / 0,4 / 1,0 | 0,045 | 0,129 |
| `L/R_smock_shoulder_01` | 0 | 1,6 / 0,45 / 0,4 / 1,0 | 0,045 | 0,148 |
| `smock_front_01` | 0 | 1,5 / 0,45 / 0,4 / 1,0 | 0,045 | 0,133 |
| `tie_01` | 1 | 0,8 / 0,3 / 0,8 / 0,3 | 0,02 | 0,079 |

- **Lớp**: 0 = áo (6 chuỗi), 1 = dây cổ (nằm trên áo ở ngực). `smock_back_01` đứng đầu danh sách, vì trục của một lớp là trục +Y của bone cha
  của chuỗi đầu tiên: ở đây là `pelvis`, chạy dọc sống lưng (thân U04 nằm ngang).
- **Collider** (13; bán kính = phân vị 55 khoảng cách từ các đỉnh thân thuộc chủ yếu bone đó, như "Auto bán kính" của editor): `pelvis` cầu
  0,158; capsule `spine_01` 0,175, `spine_02` 0,170, `chest` 0,156, `neck` 0,094, cánh tay trên 0,053–0,055, cẳng tay 0,054–0,055, đùi
  0,057–0,058, cẳng gối (gối → khuỷu cổ chân sau) 0,049. Mọi capsule ghi sẵn điểm cuối (`tail`), vì con đầu tiên của `UpperArm`/`ForeArm`
  là bone xoắn.
- **Nối vải** (4 cặp): `smock_back`–`L/R_smock_flank` (cung vòng qua mông lấn 6 mm vào cầu `pelvis`, lúc nghỉ được đẩy ra đúng bán kính) và
  `L/R_smock_flank`–`L/R_smock_shoulder` (cách cánh tay 6,7–6,9 cm). Không nối `smock_front`–`L/R_smock_shoulder`: cánh tay trên nằm giữa hai
  vạt, cung giữa chúng xuyên qua tay 1,7–1,9 cm, nối vào thì vạt sẽ bị tay kéo theo.
- **Lúc nghỉ**: không điểm nào bị đẩy lệch (`spring-bone.js` giữ khoảng cách lúc bind cho điểm nằm sát collider). Gió bật: sức 0,3, giật 1,
  tần số 0,4.
- **Thử trong editor** (chế độ Spring, vòng `00_gallop_cycle`): vải lắc theo nhịp phi, không văng.

## 5. Số đo các tư thế (`_work/poses.json`)

Giãn = tỉ số dài cạnh tư thế/rest (lấy chiều lớn hơn) trên mesh thân, cạnh > 1 mm; p99,5 = phân vị 99,5. Vải = giãn lớn nhất trên áo / mũ / dây.
Áo lọt = số đỉnh áo nằm trong thân (sâu > 3 mm) thêm so với rest. Tư thế đặt qua rig điều khiển (chi FK, IK tắt; trừ `hand_roll`, `heel_lift`,
`hock_roll`, `crouch` qua control với IK bật). Tư thế viết trước 27/10 giữ giá trị cũ của `Calf` trên `Calf_02` (gối ở rest), nên số so được.

| Tư thế | Giãn tối đa | p99,5 | Bone tại cạnh xấu nhất | Vải áo / mũ / dây | Áo lọt | Khe răng |
| --- | --- | --- | --- | --- | --- | --- |
| `gallop_reach` | 4,87× | 1,69× | `L_Clavicle` | 3,44 / 1,00 / 1,39 | 25 | – |
| `gallop_gather` | 3,66× | 1,67× | `R_UpperArm` | 2,02 / 1,00 / 1,74 | 53 | – |
| `pounce` | 5,15× | 2,01× | `spine_02` | 4,14 / 1,38 / 3,29 | 42 | – |
| `head_up` | 1,76× | 1,25× | `neck_02` | 1,36 / 1,72 / 3,48 | 0 | – |
| `head_down` | 2,50× | 1,19× | `neck_02` | 1,41 / 2,01 / 2,22 | 0 | – |
| `head_turn` | 2,18× | 1,23× | `jaw` | 1,80 / 1,33 / 1,35 | 0 | – |
| `jaw_open` (+20°) | 1,64× | 1,02× | `neck_02` | 1,00 / 1,00 / 1,00 | 0 | 115 mm |
| `jaw_close_50` | 2,82× | 1,09× | `jaw` | 1,00 / 1,00 / 1,00 | 0 | 47 mm |
| `jaw_close_70` | 4,36× | 1,11× | `jaw` | 1,00 / 1,00 / 1,00 | 0 | 6 mm |
| `jaw_close_max` (−85°) | 3,49× | 1,11× | `neck_02` | 1,00 / 1,00 / 1,00 | 0 | 1 mm |
| `twist` (30°) | 1,96× | 1,29× | `spine_02` | 2,58 / 1,00 / 1,00 | 23 | – |
| `side_bend` (40°) | 2,54× | 1,27× | `spine_01` | 3,60 / 1,00 / 1,14 | 0 | – |
| `arm_forward` (85°) | 4,35× | 1,89× | `spine_02` | 3,39 / 1,00 / 1,00 | 22 | – |
| `arm_back` | 3,41× | 1,55× | `spine_02` | 2,44 / 1,00 / 1,00 | 18 | – |
| `arm_out` (45°) | 2,41× | 1,28× | `spine_02` | 2,04 / 1,00 / 1,00 | 0 | – |
| `elbow_flex` (110°) | 8,93× | 1,69× | `L_UpperArm` | 1,72 / 1,00 / 1,00 | 0 | – |
| `leg_forward` | 3,13× | 1,39× | `pelvis` | 1,63 / 1,00 / 1,00 | 27 | – |
| `leg_back` | 2,12× | 1,30× | `pelvis` | 1,51 / 1,00 / 1,00 | 26 | – |
| `knee_flex` (gối 70°) | 2,44× | 1,30× | `R_Thigh` | 1,29 / 1,00 / 1,00 | 17 | – |
| `hock_flex` (50°) | 1,91× | 1,24× | `R_Calf_02` | 1,00 / 1,00 / 1,00 | 0 | – |
| `hock_roll` (20°, IK) | 1,35× | 1,17× | `R_Calf_02` | 1,15 / 1,00 / 1,00 | 0 | – |
| `crouch` (cog −14 cm, IK) | 2,61× | 1,64× | `R_UpperArm` | 1,86 / 1,00 / 1,00 | 44 | – |
| `shrug` (25°) | 2,71× | 1,43× | `chest` | 4,06 / 1,00 / 2,47 | 0 | – |
| `wrist_twist` (60°) | 1,65× | 1,28× | `R_ForeArm_twist` | 1,00 / 1,00 / 1,00 | 0 | – |
| `hand_roll` (40°) | 3,51× | 1,54× | `L_Hand` | 1,14 / 1,00 / 1,00 | 0 | – |
| `heel_lift` (40°) | 1,68× | 1,34× | `R_Calf_02` | 1,29 / 1,00 / 1,00 | 24 | – |
| `cloth_swing` | 1,00× | 1,00× | – | 1,40 / 1,00 / 1,38 | 0 | – |

Trước khi thêm gối (26/10): `leg_forward` 3,24×/32, `leg_back` 2,16×/28, `heel_lift` 3,53×/0, `gallop_gather` lọt 60, `pounce` lọt 44; các tư thế
khác không đổi. Mức tham chiếu (rig dáng người của skill, U01): hạ tay 3,9–4,3×, gập khuỷu 3,5–4,1×, bước 3,6×.

## 6. Khuyết điểm còn lại và giới hạn

1. **Nách và mặt trước vai** (dưới áo): một cạnh giãn 4–5× khi tay vươn ≥ 45° (`gallop_reach` 4,87×, `pounce` 5,15×, `arm_forward` 4,35×);
   p99,5 vẫn ≤ 2,0×. Đỡ hơn khi xương đòn đi cùng (pha vươn có xương đòn đưa trước 15°). Animator nên phối hợp `ctl_X_Clavicle` khi phi.
2. **Nếp khuỷu**: gập 110° ép 8,9× ở mặt trong khuỷu (giới hạn của skin tuyến tính). Clip giữ gập ≤ 90°, hoặc thêm corrective sau G2.
3. **Hàm**: rest há ~100°; ngậm tối đa 85° (`ctl_jaw`), khoé miệng ép 4,4× quanh 70°. Đóng kín hẳn không làm được nếu không sửa mesh.
4. **Áo lọt chi**: vạt sườn và vạt mông là chuỗi FK; khi chi vung mạnh có 17–53 đỉnh lọt vào cánh tay/đùi (`gallop_gather` 53, `crouch` 44,
   `heel_lift` 24). Số này đo trên skin không có spring. Từ 27/10 đã có spring + collider chi + nối vải (mục 4b) để engine đẩy vạt ra khỏi
   chi; cần xem lại trong engine khi có clip. Animator vẫn có thể dời `ctl_*smock*`.
5. **Dây cổ**: chuỗi `tie_01..02` là con của `neck`, nên khi ngẩng đầu mạnh hai đầu dây xoay theo cổ (dây giãn 3,5× ở chỗ nối vòng). Từ 27/10
   `tie_01` có spring (lớp 1, mục 4b) cho hai đầu dây rủ theo trọng lực; chỗ nối vòng vẫn giãn như cũ.
6. **Chân sau lơ lửng ~7 cm** ở rest (lỗi mesh). Rest giữ nguyên; clip đặt bàn chân xuống sàn bằng IK.
7. **IK ở rest** lệch 0,07 mm (dung sai bộ giải); tắt IK thì 0.
8. **`SKELETON_STANDARD.md` có hai mục "Họ Qh"** (U04 và P04 viết song song cùng ngày). Nội dung khớp nhau (lõi H, `neck_02`, `L/R_Finger`,
   roll X = +X, `cog` giữa thân, tên control tay `Hand_IK`/`Fingertip_roll`/`Palm_roll`); mục của P04 còn ghi hướng bone `head` khác U04, nay
   U04 đã theo P04. Đề nghị gộp thành một mục (người dùng quyết, thread này không sửa phần của P04).
9. **Chân sau khác P04** (27/10): U04 có `L/R_Calf_02` giữa `Calf` và `Foot`, nên `Foot` của U04 là con của `Calf_02`. Clip chân sau dùng chung
   với P04 cần map thêm đoạn này (để `Calf_02` ở rest khi phát clip của P04), hoặc P04 cũng thêm. Người dùng quyết.
10. **Rig editor của skill**: chỉ dùng để xem (`scripts/u04_editor.py` xuất `rig/editor/`, server `rig_editor_safe.py --port 8777`). Các nút gửi
    sang Blender trỏ vào cổng không dùng, vì nút tính lại trọng số gọi skill gốc sẽ ghi đè trọng số của U04. Khớp chỉnh trong editor được lưu
    vào `rig/editor/U04_charnel_ghoul_joints.json`, rồi chép vào `scripts/u04_joints.py` và chạy lại `u04_build.py`. Editor vẽ theo khuôn người
    nên `neck` và `Calf` hiện kéo thẳng tới khớp đầu và cổ chân, đè lên `neck_02` và `Calf_02`. Đây chỉ là cách vẽ; tư thế phát trong editor dùng
    ma trận bone thật.

## 7. Chạy lại

```text
blender -b --factory-startup -P rig/scripts/u04_build.py                                         R2 + R3, ghi rig/U04_charnel_ghoul_rig.blend
blender -b --factory-startup rig/U04_charnel_ghoul_rig.blend -P rig/scripts/u04_qa.py -- validate      R4, rig/validation.json
blender -b --factory-startup rig/U04_charnel_ghoul_rig.blend -P rig/scripts/u04_r5_renders.py -- r5    R5 ảnh skeleton, control, trọng số
blender -b --factory-startup rig/U04_charnel_ghoul_rig.blend -P rig/scripts/u04_qa.py -- poses render  R5 tư thế, _work/poses.json
python -I rig/scripts/u04_sheets.py                                                                 ghép 4 tờ G2
blender -b --factory-startup rig/U04_charnel_ghoul_rig.blend -P rig/scripts/u04_editor.py -- editor    file cho editor (rig/editor/)
blender -b --factory-startup rig/U04_charnel_ghoul_rig.blend -P rig/scripts/u04_spring.py -- spring    spring + lớp vải (rig/editor/)
python -I ashlar/3d/act-01/_batches/rig_v1/tools/rig_editor_safe.py rig/editor/U04_charnel_ghoul_rig.json --port 8777
```

Blender: `C:/Program Files/Blender Foundation/Blender 5.1/blender.exe`. Dựng lại mất khoảng 4 giây, kiểm và ảnh dưới một phút.
