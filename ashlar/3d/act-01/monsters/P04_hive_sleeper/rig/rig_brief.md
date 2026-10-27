# Rig brief — P04_hive_sleeper

Trạng thái: **G1 duyệt (2026-10-26); G2 duyệt (2026-10-27); đã xuất `../rig_done/` (chỉ rig, chưa clip, reimport PASS).** 0 credit,
GLB gốc không bị sửa. Phạm vi ban đầu R0–R5; sau G2 người dùng yêu cầu xuất ("done, export đi"). Chưa clip (R6+), chưa đăng ký
lab. Kết quả: [`qa_report.md`](qa_report.md), [`validation.json`](validation.json)
(A1 đạt 14/14), ảnh `qa/P04_hive_sleeper_G2_1..4.png`, file nguồn `P04_hive_sleeper_rig.blend`. Quy trình: [`Agent.md`](../../../../rig-anim/Agent.md). Chuẩn:
[`SKELETON_STANDARD.md`](../../../../rig-anim/SKELETON_STANDARD.md). Lô: [`rig_v1/BRIEF.md`](../../../_batches/rig_v1/BRIEF.md) §2b.

Nhãn: **[đo]** = số lấy từ GLB thật (script `rig/scripts/p00_probe.py`, `p01_regions.py`, số thô ở `rig/_work/probe/`);
**[suy luận]** = rút ra từ số đo hoặc ảnh, chưa kiểm bằng rig; **[đề xuất]** = chờ duyệt ở G1.

Ảnh đề xuất: [`qa/P04_G1_proposal.png`](qa/P04_G1_proposal.png) (khớp dự kiến chồng lên mesh: bên trái, trước, trên, 3/4).
Bảng bone đầy đủ kèm toạ độ: `rig/_work/proposal_bones.json`.

## Thông tin asset

| Mục | Giá trị |
| --- | --- |
| `asset_id` | `P04_hive_sleeper` |
| Nhóm / loại | quái |
| Họ quái ASHLAR | Perfection-born, nhánh Mercy (Eleisa), Act I Poppy Reach. Canon: thân người ngủ phình lên vì ấu trùng bướm; lê tới rồi vỡ thành bầy Hush-Moth. LD §8.4: cần tuỳ chọn giảm cảnh ấu trùng (texture/biến thể, không phải việc rig) |
| GLB gốc | `P04_hive_sleeper.glb` **[đo]** 21.922.500 byte, sha256 `ada3c70a71919f4f9f9498c3e8ca2b2a424722e2e5c5a4083f06f047249344f5`; 1 mesh, 1 material, 8.664 tam giác, 6.176 đỉnh (5.528 sau khi importer hàn đường nối UV); base color JPEG, normal JPEG, roughness-metal PNG, đều 4096²; không skin, không vertex group, 1 UV |
| Kích thước GLB | **[đo]** rộng 0,473 × dài 0,9995 × cao 0,6147 (đơn vị Tripo, cạnh dài nhất = 1). Mặt nhìn −Y trong Blender (+Z glTF), trái của quái ở +X |
| Chiều cao thật | danh mục: "lưng 0,60H, thân dài 1,55H"; `design.txt`: cao 0,66H, dài 1,10H. **Đề xuất 0,60H = 1,08 m** (xem mục dưới) |
| Tư thế gốc | **Qh, không T-pose:** bò trên tay và gối. Tay thẳng đứng dưới vai, bàn tay úp, ngón hướng trước; đùi thẳng đứng dưới hông; gối, ống chân và mu bàn chân nằm trên sàn, gan bàn chân ngửa lên; đầu đưa ra trước vai, mặt nhìn trước và hơi xuống (mặt phẳng mặt nghiêng 19°) |
| Cấu trúc mesh | **[đo]** 34 mảnh sau hàn (113 mảnh thô). Mảnh 0 (2.468 đỉnh) = áo ngủ + mũ trùm + **mặt + tóc + ba vòm** dính liền. Mảnh 1 (793) = hai chân + tấm bụng. Mảnh 2, 3 (438/437) = hai tay đủ từ vai tới ngón (đầu trên hở, nằm trong áo). Mảnh 4, 5 = tay áo ngắn (vạt ngoài cánh tay). Mảnh 6, 7 = hai vạt mông. ~25 mảnh nhỏ = ruy băng, nút, đầu ruy băng thả trước vai và hai sườn |
| Lỗi đã biết của mesh | **[đo]** Mặt là một lớp vỏ trong mũ, không có hộp sọ; lưng dưới các vòm không được dựng (vòm cắm thẳng vào áo); bụng là một tấm cong riêng, thấp tới 0,16 m; bàn tay to (cổ tay → đầu ngón 0,29 m, người 1,8 m khoảng 0,19 m); khuỷu thấp (cánh tay 0,28 m, cẳng tay 0,34 m); 36 cạnh non-manifold, 2.207 cạnh biên. Không có mảnh hỏng chặn rig |

### Chiều cao: vì sao đề xuất 0,60H

Tỉ lệ dài/cao của mesh cố định là 1,626, nên hai số của danh mục không cùng đúng được: 0,60H cao cho dài 0,98H; dài 1,55H cho cao 0,95H.
So các đoạn chi **[đo]** sau khi scale với người lớn 1,8 m (tỉ lệ Drillis–Contini):

| Đoạn | Tripo | × 1,757 (m) | Người 1,8 m (m) | Lệch |
| --- | --- | --- | --- | --- |
| vai → cổ tay (tay thẳng) | 0,344 | 0,605 | 0,598 | +1 % |
| hông → gối | 0,245 | 0,430 | 0,441 | −2 % |
| gối → cổ chân | 0,250 | 0,439 | 0,443 | −1 % |
| bàn chân (gót → ngón) | 0,155 | 0,272 | 0,274 | −1 % |
| đầu (cằm → đỉnh) | ~0,135 | 0,237 | 0,234 | +1 % |
| bàn tay (cổ tay → đầu ngón) | 0,164 | 0,288 | 0,194 | +48 % (Tripo làm tay to) |

**Đề xuất:** đỉnh vòm trước = **1,08 m = 0,60H** (khớp số đầu của danh mục), hệ số **S = 1,75695 m mỗi đơn vị Tripo**; khi đó dài
1,756 m (0,98H), rộng 0,83 m, vai (khớp) 0,71 m, hông 0,55 m, và tay chân đúng cỡ người lớn. Phương án khác: 0,66H của `design.txt`
(cao 1,19 m, chi to như người 1,98 m); dài 1,55H của danh mục (cao 1,71 m, chi như người 2,85 m) không hợp mesh này.
Rig ở kích thước thật ngay từ đầu (G1 lô rig_v1). Thân người cỡ chuẩn nên hệ số của lớp bọc skill `k = 1,0` (ghi trên rig).

## Quyết định rig [đề xuất]

| Mục | Lựa chọn | Lý do |
| --- | --- | --- |
| Họ skeleton | **H lõi, rest = tư thế bò của mesh (Qh)**, cùng bố cục với U04 Charnel Ghoul | thân người thật (vai, khuỷu, hông, gối, cổ chân) nên tên H khớp 1:1 theo giải phẫu; dùng lại được clip bò của thư viện humanoid và clip H khác (hit, death) qua retarget; U04 dùng cùng tên và phân cấp. Phương án khác: họ Q riêng (`Scapula`, `Hip`…), phải tự làm toàn bộ clip |
| Route | **M** (dựng bằng code, Blender 5.1 chạy nền) | 0 credit. Route A cần Tripo/Meshy (credit) hoặc UniRig (không có trên máy) |
| Công cụ | script riêng ở `rig/scripts/` (`p04_common.py` giữ landmark và bảng bone); render và số QA dùng lại `_batches/rig_v1/tools/rigbatch.py` (import, không sửa). Skill `blender-character-rigging` giả định người đứng T-pose nên không dùng phần đo/dựng/weight của nó | |
| Ước tính credit | **0** | |
| Bone ngón tay | một bone `L/R_Finger` mỗi bên (đốt bàn → đầu ngón), không bone từng ngón | bàn tay làm chân trước: `Hand` = cổ tay → đốt bàn, `Finger` = đốt bàn → đầu ngón, giống `Foot`/`Toe`, để lăn bàn tay khi nhấc. Bố cục Qh của U04 cũng có |
| Bone phụ | `dome_01..03` (vòm cứng), `neck_02`, 7 chuỗi áo × 2 bone | xem bảng dưới |
| Bone mặt | không | mắt nhắm, miệng ngậm. U04 có `jaw`, P04 không |
| Socket vũ khí | **không** | không cầm gì; bố cục Qh của U04 cũng bỏ `*_weapon_attach` |
| Socket VFX | `fx_head`, `fx_chest`, `fx_hand_L`, `fx_hand_R`, `hit_origin`, `ground` | ba bone `dome_0x` làm luôn điểm phát VFX "vỡ thành bầy Hush-Moth", không cần socket riêng |
| Vật phụ rời | không | |
| Mesh | **một mesh, một skin** (không tách part thành object) | vùng (mặt, mũ, vòm, áo, vạt, ruy băng) là mặt nạ đỉnh lưu trong file; đạt A1.1 |

### Bảng bone runtime: 54 bone (46 deform, 6 socket, `root`, `cog`)

Toạ độ đầy đủ ở `rig/_work/proposal_bones.json` (m, đã scale). Phía R là gương của L.

| Bone | Cha | Vị trí (bên trái, m) | Vùng phủ |
| --- | --- | --- | --- |
| `root` | – | gốc toạ độ | không trọng số |
| `cog` | `root` | giữa `pelvis` và `chest` (y −0,08, z 0,64) | không trọng số; dời và xoay cả thân quanh giữa thân |
| `pelvis` | `cog` | giữa hai khớp hông, cao 0,59 | mông, hông, lớp lót ô liu, vạt áo trên mông, bụng sau |
| `spine_01` | `pelvis` | y 0,04, z 0,62 | lưng dưới, bụng giữa |
| `spine_02` | `spine_01` | y −0,12, z 0,65 | lưng giữa, bụng trước, áo hai sườn |
| `chest` | `spine_02` | y −0,33 → −0,55, z 0,69–0,75 | ngực, vai, áo vai, cổ áo |
| `neck` | `chest` | gốc cổ (C7) ngang khớp vai | cổ, phần sau mũ trùm |
| `neck_02` | `neck` | giữa cổ | cổ trên, mũ trùm (chia xoay đầu cho hai đốt cổ) |
| `head` | `neck_02` | khớp đầu (dưới tâm sọ, sau mặt ~6 cm) → đỉnh đầu | mặt, tóc, mũ trùm trước |
| `L_Clavicle` | `chest` | khớp ức-đòn (x 0,05) → khớp vai | vai trên, áo vai |
| `L_UpperArm`, `L_UpperArm_twist` | `L_Clavicle` / `L_UpperArm` | khớp vai (x 0,24, z 0,71) → khuỷu (z 0,43) | cánh tay (trong áo), tay áo ngắn |
| `L_ForeArm`, `L_ForeArm_twist` | `L_UpperArm` / `L_ForeArm` | khuỷu → cổ tay (z 0,09); khuỷu gập sẵn 2,8 cm về sau (+Y) cho IK | cẳng tay |
| `L_Hand` | `L_ForeArm` | cổ tay → đốt bàn ngón giữa | lòng bàn tay, ngón cái |
| `L_Finger` | `L_Hand` | đốt bàn → đầu ngón giữa | bốn ngón |
| `L_Thigh` | `pelvis` | khớp hông (x 0,17, z 0,55) → gối (z 0,12), thẳng đứng | đùi |
| `L_Calf` | `L_Thigh` | gối → cổ chân, nằm trên sàn | ống chân |
| `L_Foot`, `L_Toe` | `L_Calf` / `L_Foot` | cổ chân → bóng chân → đầu ngón (mu bàn chân úp) | bàn chân, ngón chân |
| `dome_01` | `chest` | tâm cầu vòm trước → đỉnh (1,08 m) | vòm trước, **cứng** (100 %), chân vòm chuyển dần sang lưng |
| `dome_02` | `spine_02` | tâm cầu vòm giữa → đỉnh | vòm giữa, cứng |
| `dome_03` | `pelvis` | tâm cầu vòm sau → đỉnh | vòm sau, cứng |
| `shirt_front_01..02` | `chest` | yếm áo dưới cổ, giữa hai tay | vạt ngực |
| `L_shirt_shoulder_01..02` | `L_Clavicle` | vạt sườn trước, ngoài cánh tay | vạt áo rủ từ vai |
| `L_shirt_flank_01..02` | `spine_01` | vạt sườn sau, cạnh bụng và hông | vạt áo rủ hai sườn |
| `L_shirt_back_01..02` | `pelvis` | vạt mông trên mặt sau đùi | vạt mông (mảnh 6, 7) |
| `hit_origin` | `root` | trước mặt, cao ngang đầu (y −0,91, z 0,72) | socket |
| `fx_chest`, `fx_head`, `fx_hand_L/R`, `ground` | `chest`, `head`, `L/R_Hand`, `root` | dưới gốc cổ phía bụng; đỉnh đầu; giữa lòng bàn tay; gốc | socket |

**Roll (chung với U04):** trục X cục bộ của mọi bone = +X thế giới chiếu lên bone (cả hai bên), nên mọi chuyển động trong mặt phẳng dọc
(đưa tay chân, gập khuỷu và gối, ngẩng và cúi đầu, cong lưng) là xoay quanh X cục bộ; xương đòn (nằm dọc X) giữ Z lên. Hướng bone
`head`: khớp đầu → đỉnh đầu như họ H (U04 đặt `head` dọc hộp sọ ra trước; xoay ngang đầu khác trục, nên clip giữa hai con vẫn đi qua
retarget theo tên).

### Rig điều khiển (`ctl_*`, chỉ trong `.blend`, không xuất)

Hai armature như D01: `P04_hive_sleeper_rig` (runtime, mesh skin vào đây) và `P04_hive_sleeper_ctl` (điều khiển). Bone runtime theo
`ctl_` cùng tên bằng Copy Transforms (thế giới); lệch ở rest = 0.

- **FK:** `ctl_<bone>` cho mọi bone runtime không phải socket, cùng rest. `ctl_root`, `ctl_cog`.
- **Tay (bàn tay là điểm tựa):** `ctl_L_Hand_IK` (con của `ctl_root`, đặt tại đốt bàn trên sàn) → `ctl_L_Finger_roll` (xoay quanh đầu
  ngón: nhón cả bàn tay) → `ctl_L_Palm_roll` (xoay quanh đốt bàn: nhấc gót tay, ngón vẫn úp) → `ctl_L_Wrist_target` (đích IK 2 xương
  `UpperArm`–`ForeArm`, `Hand` chép xoay). `ctl_L_Finger_target` dưới `Finger_roll` cho `Finger`. Pole `ctl_L_Elbow_pole` sau khuỷu (+Y).
- **Chân (gối và ống chân là điểm tựa):** `ctl_L_Knee_IK` (con của `ctl_root`, tại gối trên sàn, trục Y dọc ống chân): `Thigh` IK một
  xương nhắm vào gối, `Calf` chép xoay của control (ống chân nằm theo control), `Foot`, `Toe` FK.
- **Công tắc IK/FK:** thuộc tính `ik_arm_L/R`, `ik_leg_L/R` trên armature điều khiển (driver vào influence), như D01.
- **Xoắn:** `UpperArm_twist` khử 50 % xoắn quanh trục dọc của `UpperArm`; `ForeArm_twist` nhận 50 % xoắn của `Hand` (driver
  SWING_TWIST_Y); bake vào clip ở R8.
- **Vòm và vải:** `ctl_dome_0x` FK (lắc, nảy; scale chỉ dùng khi cố ý phập phồng), `ctl_*shirt*` FK (trong engine thay bằng spring bone).
- Bone collection: Root/COG, Spine/Head, Arms, Legs, Contacts (IK, roll), Poles, Domes, Cloth.

## Thông số animation (theo `blender-game-animation`)

| Mục | Giá trị |
| --- | --- |
| Trục tiến / trục lên | Blender: tiến −Y, lên +Z. glTF: tiến +Z, lên +Y (xuất "+Y Up") |
| Đơn vị | mét, kích thước thật 1,08 m cao |
| fps | 24 *(đề xuất)* |
| Loop / root motion | `idle`, `walk`, `run`: loop kín, tại chỗ; `death` không loop |
| Sự kiện gameplay cần có | `footstep` cho bốn tiếp xúc (2 tay, 2 gối) mỗi chu kỳ bò; `hit` của `attack` ở 40–50 %; `fx` "vỡ thành bầy" trong `death` (ở `dome_0x`) |
| Tham chiếu | chưa có; `rig/anim/refs/` tạo ở R6 |
| Rig điều khiển | IK tay: có (bàn tay chạm sàn + lăn bàn tay). IK chân: có (gối/ống chân chạm sàn). Control tiếp xúc: tay, gối |
| Giới hạn influence | 4 (chuẩn glTF) |
| Tiếp tục file của người khác? | không (dựng mới `rig/P04_hive_sleeper_rig.blend`) |

## Bộ clip (chỉ liệt kê; R6 là phiên riêng)

Theo `SKELETON_STANDARD.md` §5, cột H (bộ bắt buộc trùng cột Q). Nguồn từng clip quyết ở R6.

| State | Cần? | Nguồn dự kiến | Dùng lại từ | Ghi chú |
| --- | --- | --- | --- | --- |
| `idle` | R | keyframe tay | – | thở, vòm phập phồng, đầu gật nhẹ như ngủ |
| `walk` | R | retarget clip bò người (Mixamo "Crawling": điều khoản Adobe, chỉ prototype) hoặc keyframe tay | U04 (retarget theo tên) | "lê tới": tay và gối luân phiên |
| `run` | R | như `walk`, nhanh hơn | U04 | bò nhanh |
| `attack` | R | keyframe tay | – | vồ một tay hoặc chồm tới |
| `attack2`, `cast`, `revive` | O | – | – | |
| `block`, `blockHit`, `jump`, `dodge` | – | – | – | không áp dụng |
| `hit` | R | retarget H rồi chỉnh | – | |
| `death` | R | keyframe tay | – | sụp xuống, vòm vỡ, bầy Hush-Moth bay ra (VFX ở `dome_0x`) |

## Rủi ro và vùng khó skin

1. **Mảnh dính liền lớn:** áo, mũ trùm, mặt, tóc và ba vòm là một mảnh. Chia vùng bằng mặt nạ đỉnh (màu texture cho ruy băng, hình cầu
   cho vòm, khoảng cách cho mặt và mũ), không cắt mesh.
2. **Vòm cứng trên lưng uốn:** vòm 100 % xương vòm, chân vòm (2–4 cm) chuyển dần sang cột sống; rãnh giữa hai vòm (có ruy băng vòng) bị
   ép hoặc giãn khi cong/vặn lưng. Ruy băng sống lưng chạy qua đỉnh cả ba vòm: theo trọng số bề mặt bên dưới.
3. **Đầu trong mũ:** mặt là vỏ mỏng; mũ trùm chuyển dần `head` → `neck_02` → `neck` → `chest` để quay đầu không xé mũ.
4. **Vai:** đầu tay hở nằm trong áo; áo vai và tay áo ngắn phải theo `UpperArm`/`Clavicle` mà không kéo lưng.
5. **Bụng phình** (tấm riêng, thấp tới 0,16 m): theo `spine_01`/`spine_02`/`pelvis`; gối đưa ra trước có thể chạm bụng.
6. **Vạt áo:** vạt sườn rủ ngoài tay và đùi; vạt mông nằm trên mặt sau đùi, đùi duỗi ra sau dễ xuyên vạt mông.
7. **Bàn tay to, ngón tách** nhưng chỉ một bone `Finger`: bốn ngón cứng cùng nhau; ngón cái theo `Hand`.
8. Automatic Weights của Blender hỏng trên mesh Tripo: dùng trọng số theo khoảng cách tới đoạn xương + làm mịn Laplace trên mesh đã
   hàn, phần cứng một xương, tối đa 4 ảnh hưởng, tổng bằng 1.
9. **Clip chung với U04:** cùng tên và phân cấp nhưng khác rest (U04 đứng trên bàn chân, P04 quỳ gối) và khác hướng bone `head`, nên clip
   đi qua retarget theo tên, không chép thẳng.

Tư thế thử ở R5: bước bò (tay trái + gối phải ra trước, hai chi kia ra sau), ngẩng đầu, cúi đầu, quay đầu, vươn một tay ra trước, vặn thân
±20°, cong và ưỡn lưng, nhấc gối, nhấc gót tay, lắc vòm. Đo: độ giãn cạnh, khe ở đường nối, số đỉnh vạt áo bị đùi/tay xuyên.

## Điều cần chốt ở G1

1. **Họ:** H lõi với rest bò (đề xuất), hay họ Q riêng.
2. **Kích thước:** 0,60H = 1,08 m (đề xuất), hay 0,66H của `design.txt`. "Thân dài 1,55H" của danh mục không hợp mesh này.
3. **Bố cục Qh chung với U04:** `neck_02`, `L/R_Finger`, `cog` giữa thân, quy tắc roll X = +X, bỏ socket vũ khí. Lấy theo bản đang dựng ở
   thread U04 (`U04_charnel_ghoul/rig/scripts/u04_layout.py`, đọc lúc 22:26; U04 chưa có `rig_brief.md`). Người dùng chọn khác ở U04 thì
   P04 theo.
4. **Vải:** 7 chuỗi × 2 bone (yếm, vai L/R, sườn L/R, mông L/R). Bản gọn hơn: chỉ hai chuỗi mông, vạt sườn và yếm theo thân.
5. **Rig điều khiển:** IK tay có lăn bàn tay; gối/ống chân là điểm tựa của chân (thay cho IK bàn chân).

## Khi đưa vào game (ghi chú bàn giao, sau R5)

- Ba bone vòm dựng ở **tâm mặt cầu khớp trên mesh** (chỉnh nhỏ so với ảnh G1): vòm trước (0; −0,439; 0,848) r 0,224 m, giữa
  (0; −0,185; 0,808) r 0,167 m, sau (0; 0,099; 0,686) r 0,167 m.
- **Spring bone** cho 7 chuỗi `*shirt*`; có thể thêm lắc nhẹ cho `dome_0x`. Không spring thì vạt áo xoay cứng theo thân, chạm tay khi vặn
  thân lớn (xem `qa_report.md` §5).
- **Xoắn tay:** driver SWING_TWIST chỉ có trong `.blend`; bake vào clip ở R8 (Unity Humanoid không tự quay `*_twist`).
- **Điểm tựa:** bàn tay (`ctl_<S>_Hand_IK` + `Palm_roll`, `Fingertip_roll`) và gối (`ctl_<S>_Knee_IK`) là control của rig điều khiển, không
  xuất. Đầu nên trong khoảng ±30° (mũ áp vào vòm trước).
- **Sửa khớp:** không qua rig editor của skill; sửa `rig/scripts/p04_common.py` (`LM`) rồi chạy `p10_build` → `p20_qa` → `p21_sheets`.

## Chỉ tiêu qua cổng

- G2: các mục A1, A2 của `QA_CHECKLIST.md`, cộng các vùng khó ở trên.
- G3: B1, B2. G4: C (ngoài phạm vi lượt này).

## Duyệt

| Cổng | Ngày | Kết quả | Người duyệt | Ghi chú |
| --- | --- | --- | --- | --- |
| G1 (brief) | 2026-10-26 | **duyệt** | người dùng ("duyệt") | duyệt cả 5 điểm như đề xuất: lõi H rest bò, 0,60H = 1,08 m, bố cục Qh chung với U04, 7 chuỗi áo × 2, gối làm điểm tựa |
| G2 (rig) | 2026-10-27 | **duyệt** | người dùng (tự xem trong Blender, "done, export đi") | R2–R5 xong 2026-10-26: A1 14/14, `qa/P04_hive_sleeper_G2_1..4.png`, `qa_report.md`. Xuất `../rig_done/` 2026-10-27 (chỉ rig, FBX + GLB + textures; reimport PASS, xem `rig.log`) |
| G3 (clip) | | | | phiên animation riêng |
| G4 (trong lab) | | | | |
| R9 (tích hợp engine, nếu có) | | | | |
