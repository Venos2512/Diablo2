# Rig brief — B01_sextons_dog

Trạng thái: **G1 duyệt (2026-10-26); G2 duyệt (2026-10-27); rig đã xuất vào `../rig_done/` (chưa clip)** ([`qa_report.md`](qa_report.md), [`validation.json`](validation.json): A1 14/14, thử chức năng 14/14). Credit dịch vụ: **0**. GLB gốc chỉ đọc. Người dùng duyệt các đề xuất: kích thước A (×2,1611), bảng bone họ Q (chép vào `SKELETON_STANDARD.md` §3), hàm giữ mesh kín (há ~15°), tai một xương, không xương má xệ, không socket đèn.
Quy trình: [`Agent.md`](../../../../rig-anim/Agent.md). Chuẩn: [`SKELETON_STANDARD.md`](../../../../rig-anim/SKELETON_STANDARD.md).
Lô: [`_batches/rig_v1/BRIEF.md`](../../../_batches/rig_v1/BRIEF.md) §2b (bảng bone đề xuất cho con không phải người, chưa duyệt; brief
này sửa nó theo mesh thật). Đây là **con họ Q đầu tiên** của dự án: bảng bone dưới đây sẽ thành chuẩn họ Q sau khi duyệt.

Ảnh đề xuất: [`qa/B01_sextons_dog_G1_joints.png`](qa/B01_sextons_dog_G1_joints.png) (bên, trước, sau, trên) và
[`qa/B01_sextons_dog_G1_closeups.png`](qa/B01_sextons_dog_G1_closeups.png) (đầu–cổ, chân trước, chân sau). Số khớp:
[`landmarks.json`](landmarks.json). Script: [`scripts/`](scripts/) (`b01_r1_measure.py`, `b01_r1_sections.py`, `b01_r1_proposal.py`,
`b01_skel.py`, `b01_g1_sheet.py`).

Nhãn: **[đo]** = số lấy từ mesh (Blender 5.1.1 nền); **[suy luận]** = rút ra từ số đo hoặc giải phẫu chó, chưa kiểm bằng rig;
**[đề xuất]** = chờ duyệt ở G1.

## Thông tin asset

| Mục | Giá trị |
| --- | --- |
| `asset_id` | `B01_sextons_dog` |
| Nhóm / loại | quái, mini-boss Prologue (nghĩa trang). Họ quái ASHLAR: Unlaid |
| Dạng | chó ngao già sống dậy từ mộ, dáng Saint-Bernard: đầu to, má xệ, tai dài rủ, bờm lông vai, vòng cổ sắt có đinh tán, xích ngắn + vòng đồng trước ngực, đuôi dày rủ |
| GLB gốc | `B01_sextons_dog.glb` **[đo]** 16.889.880 B, sha256 `cbb68b64…5c098ac4`. 1 mesh, 1 material, **11.184 tam giác**, 7.674 đỉnh glTF (5.716 sau khi importer hàn đường nối UV; 5.711 khi hàn theo vị trí). 1 UV, 0 vertex group, 0 skin. 3 map 4096² (base JPEG, normal JPEG, roughness-metal PNG) |
| Mảnh rời **[đo]** | 18 mảnh sau khi hàn: thân 4.841 đỉnh (gồm đầu, tai, chân, đuôi, lông); vòng cổ 181; mắt xích trên 144 (mặt phẳng XZ); mắt xích dưới 150 (mặt phẳng YZ); vòng đồng 142; 13 đinh tán (12 × 19 + 1 × 25). Mesh thân: 1 cạnh non-manifold, 259 cạnh biên (mép túm lông) |
| Tư thế gốc | **dáng đứng nghỉ**, không T-pose: bốn chân thẳng cột, tách nhau (bàn trước x ±0,27, bàn sau x ±0,24); đầu thấp, cổ gần nằm ngang; đuôi rủ 45°; miệng **khép kín** (mặt liền, không khe môi, không lòng miệng) |
| Đối xứng **[đo]** | gương qua x = 0: lệch trung bình 1,04 mm, p99 16,1 mm, lớn nhất 32 mm (xích, vòng đồng). Rig dựng đối xứng, bên R là gương bên L |
| Lỗi đã biết của mesh | miệng kín (hạn chế há hàm); túm lông nhọn khắp thân (dễ chọc ra ở tư thế cực); tai rủ sát má; đùi sau dính bụng bằng nếp háng; gốc đuôi dày dính mông và đáy chậu |

## Kích thước thật và hệ số scale

| Nguồn | Ghi | Trên mesh này |
| --- | --- | --- |
| Danh mục `ashlar/3d/README.md` | vai ~0,55H (~1 m), dài ~1,2H | – |
| `ASHLAR_QUY_CHUAN_QUAI_VI.md` | V 0,50–0,60H, L 1,10–1,30H; "thấp, dài" | – |
| `design.txt` | cao ~0,72H tính cả lông vai; dài 1,4H tính cả đuôi; thân (mũi → mông) ≈ 1,7 × chiều cao vai; chóp đuôi ngang khuỷu cổ chân sau | tỉ lệ dài/cao của mesh 1,68 (concept 1,96: mesh mập hơn, `tpose.log` đã ghi) |

GLB Tripo dài 0,9995 m theo Y (mũi → chóp đuôi), cao 0,5952 m. **Phương án A [đề xuất]**: dài = 1,2H = **2,16 m**, scale đều
**×2,1611** **[đo]**: cao **1,286 m** (0,71H, khớp 0,72H của `design.txt`, lệch −0,8 %), rộng 0,80 m. Các mốc ở scale này **[đo]**:
bướu lông vai 1,27 m; lưng thấp nhất 1,03 m; mông 1,09 m; đáy ngực 0,31 m; đỉnh sọ 1,11 m; mũi cao 0,82 m; chóp đuôi 0,37 m (ngang
khuỷu cổ chân sau 0,30–0,33 m, đúng `design.txt`). Vai xương (mép trên bả vai) **[suy luận]** ~1,07 m = 0,59H; thân mũi → mông 1,82 m
= 1,70 × vai, đúng `design.txt`.

Lệch duy nhất là chữ "vai ~0,55H (~1 m)" của danh mục: ở A vai xương ~0,59H (vẫn trong khoảng 0,50–0,60H của quy chuẩn).
**Phương án B**: lấy vai xương = 0,55H → scale ×2,00 (A × 0,925): dài 2,00 m (1,11H, sát đáy khoảng L), cao 1,19 m (0,66H). Mesh mập hơn
concept nên không thoả cả hai số chọn của danh mục cùng lúc. Đề xuất A vì khớp cả `design.txt` lẫn chiều dài danh mục và con
mini-boss to hơn. A1.11 cho họ Q kiểm **chiều dài theo Y (2,16 m ± 2 %) và chiều cao (0,72H ± 2 %)** thay cho chiều cao đơn thuần.

## Quyết định rig

| Mục | Lựa chọn | Lý do |
| --- | --- | --- |
| Họ skeleton | **Q** (bốn chân) | chó, đi bốn chân |
| Route | **M** (dựng trong Blender bằng script riêng ở `rig/scripts/`) | skill `blender-character-rigging` chỉ cho người; UniRig không có trên máy; Tripo/Meshy tốn credit |
| Công cụ | Blender 5.1.1 nền (`-b --factory-startup`); helper ảnh/đo của `_batches/rig_v1/tools/` (`rigbatch.py`, `compose.py`) import nguyên, không sửa | 8 thread chạy song song, không dùng Blender ở cổng 9876, không MCP |
| Ước tính credit | **0** | route M chạy máy |
| Skin | trọng số theo khoảng cách tới đoạn xương + làm mịn Laplace trên mesh đã hàn, có "cổng" vùng (bên L/R, chân trước/sau, đầu/hàm/tai, đuôi); phần cứng một xương; tối đa 4 ảnh hưởng, tổng 1. **Không** dùng Automatic Weights (bone heat hỏng trên mesh Tripo) | cách của lô rig_v1 §2b, H2_FL_hand |
| Bone ngón | gom khối: một `Finger` (chân trước) / `Toe` (chân sau) mỗi bàn | móng và ngón nhỏ ở camera ARPG |
| Bone mặt | chỉ `jaw`; không môi, không má xệ, không mí | quái, không cảnh cận mặt |
| Bone phụ | `jaw`, `L/R_ear` (1 xương/tai), `tail_01..04`, `collar` (cứng), `collar_ring` (xích + vòng đồng, 1 xương lắc) | theo §2b, chỉnh theo mesh |
| Socket vũ khí | không | không vũ khí (`design.txt`: REMOVE nothing) |
| Socket VFX | `fx_head`, `fx_mouth` (mới, VFX/máu khi cắn), `fx_chest`, `hit_origin`, `ground` | `fx_hand_*` của họ H không dùng |
| Vật phụ rời | không. Vòng cổ, xích, vòng đồng, đinh tán là mảnh riêng **trong cùng mesh**, không tách object | giữ 1 mesh, 1 skin |

### Bảng bone runtime **[đề xuất]**: 41 bone, 34 deform

Phân cấp: `root` → `cog` → `pelvis` → `spine_01` → `spine_02` → `chest` → `neck_01` → `neck_02` → `head`. Hông, đuôi và chân sau con
của `pelvis`; bả vai và vòng cổ con của `chest`/`neck_01`; hàm và tai con của `head`. Toạ độ (m) là đầu khớp, bên L (bên R: x → −x).

| Bone | Cha | Deform | Đầu khớp (x, y, z) | Dài | Vùng phủ |
| --- | --- | --- | --- | --- | --- |
| `root` | – | – | 0, 0, 0 | 0,25 | gốc, dưới đất |
| `ground` | `root` | – | 0, 0, 0 | 0,12 | socket bóng, vòng chọn |
| `hit_origin` | `root` | – | 0, −0,80, 0,80 | 0,10 | socket điểm phát đòn, dưới đầu trước ngực (đứng yên theo `root`) |
| `cog` | `root` | – | 0, 0,00, 0,86 | 0,25 | trọng tâm giữa thân (giữa bàn trước y −0,40 và bàn sau y +0,66) |
| `pelvis` | `cog` | có | 0, 0,58, 0,88 | 0,22 | hông, mông, gốc đùi |
| `spine_01` | `pelvis` | có | 0, 0,36, 0,91 | 0,26 | thắt lưng, bụng sau |
| `spine_02` | `spine_01` | có | 0, 0,10, 0,90 | 0,28 | lưng giữa, sườn sau |
| `chest` | `spine_02` | có | 0, −0,18, 0,92 | 0,32 | lồng ngực, ức, vai sau |
| `neck_01` | `chest` | có | 0, −0,50, 0,95 | 0,15 | gốc cổ, bờm lông vai |
| `neck_02` | `neck_01` | có | 0, −0,65, 0,96 | 0,14 | cổ trong vòng cổ |
| `head` | `neck_02` | có | 0, −0,79, 0,97 | 0,27 | sọ, mõm trên, má, mắt, gốc tai |
| `jaw` | `head` | có | 0, −0,88, 0,83 | 0,18 | hàm dưới, cằm, phần má xệ dưới đường miệng |
| `L_ear` | `head` | có | 0,14, −0,80, 1,03 | 0,26 | vành tai rủ (gốc ở đỉnh sọ, chóp z 0,72) |
| `tail_01..04` | `pelvis`, nối tiếp | có | 0, 0,69, 0,90 → 0, 1,05, 0,39 | 0,13–0,17 | đuôi (gốc ở mông, chóp ngang khuỷu cổ chân sau) |
| `L_Scapula` | `chest` | có | 0,13, −0,38, 1,07 | 0,39 | bả vai, mạn trên chân trước dưới bờm |
| `L_UpperArm` | `L_Scapula` | có | 0,22, −0,52, 0,72 | 0,29 | cánh tay trên (khớp vai → khuỷu) |
| `L_ForeArm` | `L_UpperArm` | có | 0,24, −0,33, 0,50 | 0,36 | cẳng chân trước, túm lông sau khuỷu |
| `L_Hand` | `L_ForeArm` | có | 0,22, −0,39, 0,15 | 0,13 | bàn chân trước (cổ chân trước → đệm bàn), đệm cổ chân |
| `L_Finger` | `L_Hand` | có | 0,26, −0,47, 0,05 | 0,14 | ngón và móng chân trước |
| `L_Thigh` | `pelvis` | có | 0,15, 0,58, 0,77 | 0,27 | đùi (khớp hông → gối) |
| `L_Calf` | `L_Thigh` | có | 0,17, 0,49, 0,52 | 0,30 | cẳng chân sau (gối → khuỷu cổ chân sau) |
| `L_Foot` | `L_Calf` | có | 0,175, 0,70, 0,30 | 0,25 | bàn chân sau (khuỷu cổ chân → đệm bàn) |
| `L_Toe` | `L_Foot` | có | 0,21, 0,67, 0,05 | 0,14 | ngón và móng chân sau |
| `collar` | `neck_01` | có, cứng | 0, −0,69, 0,90 | 0,23 | vòng cổ + 13 đinh tán (100 % một xương) |
| `collar_ring` | `collar` | có, cứng | 0, −0,685, 0,68 | 0,31 | 2 mắt xích + vòng đồng (100 % một xương) |
| `fx_head` | `head` | – | 0, −0,90, 0,95 | 0,10 | socket |
| `fx_mouth` | `head` | – | 0, −1,06, 0,76 | 0,10 | socket, trước miệng |
| `fx_chest` | `chest` | – | 0, −0,45, 0,75 | 0,10 | socket |

Đếm: 4 gốc/socket dưới `root` + 8 thân–cổ–đầu–hàm + 2 tai + 4 đuôi + 10 chân trước + 8 chân sau + 2 vòng cổ + 3 socket = 41; deform 34
(trong khoảng 25–50 của họ Q). Cột sống 4 đốt thân + 2 đốt cổ (chuẩn: "cột sống 5+ đốt").

Ghi chú đặt khớp **[đo]** (mặt cắt phẳng của mesh, `rig/_work/sec_*.png`): cột sống nằm ở 20–35 % bề dày thân tính từ lưng (sâu hơn ở
vai vì bờm lông); khớp vai cách mặt trước ngực ~6 cm; khuỷu trước đỉnh khuỷu (y −0,26) ~7 cm; cổ chân trước ở tâm cột chân (x 0,22,
y −0,39) ngang đệm cổ chân; gối cách mép trước chân ~7 cm; khuỷu cổ chân sau trước đỉnh gót (y 0,77, z 0,33). Mọi đầu khớp deform nằm
trong mesh (33/34; đầu `collar_ring` ở đỉnh mắt xích mảnh, cách mặt 3 mm). Chân có độ gập sẵn: khuỷu sau đường vai–cổ chân 14 cm, gối
trước đường hông–khuỷu cổ chân 15 cm, nên IK không suy biến. Trục cuộn: chân, tai, xích lấy Z hướng −Y (trục X là trục gập trong mặt
phẳng dọc, giống nhau hai bên); thân, cổ, đầu, đuôi lấy Z hướng lên.

Khác §2b của lô: thêm `fx_mouth`; `cog` đặt **giữa thân** (khác họ H, nơi `cog` trùng `pelvis`) để xoay cả thân quanh trọng tâm; vòng
cổ con của `neck_01`.

### Rig điều khiển **[đề xuất]** (armature `B01_control`, bone `ctl_*`, chỉ ở `.blend`, không xuất)

Hai armature như D01: `B01_runtime` (41 bone ở trên, mesh gắn vào) bám `B01_control` bằng Copy Transforms (thế giới → thế giới);
rest hai lớp trùng nhau. R8 bake từ control xuống runtime.

| Control | Vai trò |
| --- | --- |
| `ctl_root` | dưới đất, kéo cả con |
| `ctl_body` | ở trọng tâm (`cog`): nâng, hạ, xoay cả thân, cổ, đầu, đuôi; bàn chân IK đứng yên |
| FK `ctl_<bone>` cho mọi bone deform | `ctl_pelvis`, `ctl_spine_01/02`, `ctl_chest`, `ctl_neck_01/02`, `ctl_head`, `ctl_jaw`, `ctl_L/R_ear`, `ctl_tail_01..04`, `ctl_L/R_Scapula`, `ctl_collar_ring`, ngón `ctl_L/R_Finger`, `ctl_L/R_Toe` |
| IK chân trước ×2 | `ctl_L_Hand_IK`: control tiếp xúc ở đệm bàn chân trước, trên mặt đất; xoay quanh đệm để nhấc cổ chân. IK 2 đốt `UpperArm`–`ForeArm` nhắm cổ chân; `Hand` theo hướng control. Pole `ctl_L_Elbow_pole` sau khuỷu |
| IK chân sau ×2 | `ctl_L_Foot_IK`: control tiếp xúc ở đệm bàn chân sau; xoay = nâng, hạ khuỷu cổ chân. IK 2 đốt `Thigh`–`Calf` nhắm khuỷu cổ chân; `Foot` theo control. Pole `ctl_L_Knee_pole` trước gối |
| Công tắc IK/FK | thuộc tính `ik_front_L/R`, `ik_hind_L/R` trên `B01_control` |
| Vòng cổ | `collar` tự theo trung bình xoay `neck_01`/`neck_02` (constraint, bake ở R8) để không cắm vào bờm khi cổ gập |

Khoảng 55 bone control. Góc pole tìm bằng quét sao cho bật IK không đổi tư thế rest (như D01).

## Thông số animation

| Mục | Giá trị |
| --- | --- |
| Trục tiến / trục lên | glTF +Z tiến, +Y lên (Blender: mặt −Y, Z lên). Trái con chó = +X |
| Đơn vị | mét, rig ở kích thước thật (phương án A: scale ×2,1611) |
| fps | 24 |
| Loop / root motion | `idle`, `walk`, `run` loop kín, tại chỗ; không root motion; `death` dừng pose cuối |
| Sự kiện gameplay | `footstep` 4 bàn (`walk`, `run`); `hit` của `attack` (vồ cắn) ở 40–50 %; `death` xong → Gennet làm Rite of Laying |
| Tham chiếu | chưa có (phiên animation) |
| Rig điều khiển | IK 4 chân có pole + control tiếp xúc ở đệm bàn; control thân; FK cổ, đầu, hàm, tai, đuôi, xích |
| Giới hạn influence | 4 (glTF) |
| Tiếp tục file của người khác? | không, dựng mới |

## Bộ clip họ Q (`SKELETON_STANDARD.md` §5, chỉ liệt kê; làm ở phiên animation)

| State | Cần? | Ghi chú |
| --- | --- | --- |
| `idle` | R | thở nặng, tai, đuôi khẽ lắc |
| `walk` | R | dáng đi chó to: bước chéo |
| `run` | R | phi nước kiệu / nước đại nặng |
| `attack` | R | **vồ** (lao tới, cắn): canon "vồ và kéo, dùng để dạy né" |
| `attack2` | O | **cắn và kéo** (giật đầu sang bên, lùi) |
| `cast` | O | không có trong canon |
| `hit` | R | |
| `death` | R | ngã nằm nghiêng, dừng pose cuối |
| `revive` | O | |
| `block`, `blockHit`, `jump`, `dodge` | – | không thuộc họ Q |

## Vùng khó skin (soi ở G2)

1. **Bả vai dưới bờm lông dày**: `Scapula` trượt trên sườn; bờm phải theo `chest`/`neck_01`, không theo chân.
2. **Khuỷu trước** có túm lông chìa sau khuỷu: theo `ForeArm`/`UpperArm`, không rơi vào thân.
3. **Cổ dưới vòng cổ cứng**: cổ gập, ngoái đầu thì vòng cổ có thể cắm vào bờm; đo khe/xuyên ở tư thế ngoái và cúi.
4. **Hàm**: miệng kín nên há hàm chỉ kéo giãn môi và má xệ, không lộ lòng miệng. Đề xuất giới hạn há ~15° (xem câu hỏi 3).
5. **Tai dài rủ sát má**: quay đầu, cúi đầu thì tai đè vào má, vòng cổ.
6. **Gốc đuôi** dày, dính mông và đáy chậu: vẫy đuôi không kéo mông.
7. **Đùi sau dính bụng** (nếp háng): tư thế ngồi là khó nhất; bụng không theo đùi.
8. **Bàn chân to**: ngón, móng, đệm gan, đệm cổ chân trước; đế phẳng khi IK.
9. **Túm lông nhọn** khắp thân: theo xương gần nhất, có thể chọc ra ở tư thế cực.

Tư thế thử ở R5 (A2, theo họ Q): đứng nghỉ, **bước chéo** (trước trái + sau phải lên trước), **ngồi**, **cúi đầu ngửi đất**, **ngoái đầu**
(~70°), **vẫy đuôi** (±35°), **há hàm**, vươn chân trước, duỗi chân sau, xoay thân ±25°, cong/võng lưng, tư thế vồ. Kèm số đo: độ giãn
cạnh, health trọng số, khe vòng cổ ↔ cổ, đế chân chạm đất.

## Rủi ro và điều cần chú ý

- Con Q đầu tiên: chưa có rig mẫu để so độ giãn; mức tham chiếu là các con dáng người của lô (U01: bước 3,6×, gập khuỷu 4,1×).
- Rig editor của skill (`rig_editor_safe.py`) chỉ hiểu khớp người (vai/khuỷu/hông/gối của bộ H), không đọc được skeleton Q: không dùng. Chỉnh khớp
  bằng ghi chú lên ảnh hoặc số trong `landmarks.json`, rồi chạy lại script.
- Không sửa GLB gốc; mesh trong rig = GLB đã scale, giữ topology, UV, texture.
- 8 thread cùng máy: render QA ở texture 1024, không để Blender nền treo.

## Câu hỏi G1 (cần người dùng chốt)

1. **Kích thước**: A (dài 1,2H = 2,16 m, cao 1,29 m, vai ~0,59H) **[đề xuất]** hay B (vai 0,55H, dài 2,00 m, cao 1,19 m)?
2. **Bảng bone họ Q** (41 bone, 34 deform, tên như bảng trên): duyệt để chép vào `SKELETON_STANDARD.md` §3 "Họ khác". Chú ý: chân trước dùng
   tên kiểu H (`Scapula`, `UpperArm`, `ForeArm`, `Hand`, `Finger`) để dễ map; `cog` giữa thân; socket mới `fx_mouth`.
3. **Hàm**: giữ mesh nguyên, há ~15°, môi kéo giãn, không lòng miệng **[đề xuất]**; hay cho phép cắt khe miệng + thêm lòng miệng (đổi topology
   mesh trong rig, A1.9 so theo vị trí thay vì topology)?
4. **Tai**: 1 xương mỗi tai **[đề xuất]** hay 2 xương (`L_ear_01/02`, vành tai uốn được, +2 bone)?
5. Không thêm trừ khi được yêu cầu: xương má xệ (`L/R_jowl`), socket treo đèn ở vòng đồng.

## Chỉ tiêu qua cổng

- G2: `QA_CHECKLIST.md` A1 (A1.11 như mục kích thước), A2 (skeleton chồng mesh ba góc, bản đồ trọng số, tư thế thử họ Q ở trên), các vùng khó ở trên.
- G3, G4: phiên animation.

## Duyệt

| Cổng | Ngày | Kết quả | Người duyệt | Ghi chú |
| --- | --- | --- | --- | --- |
| G1 (brief) | 2026-10-26 | duyệt | người dùng | đề xuất A; bảng bone Q; hàm kín ~15°; tai 1 xương. Sau G1 (R2): trục tai dời theo vạt tai đo được (gốc 0,175/−0,80/1,00 → 0,222/−0,848/0,745), hàm 0/−0,875/0,82 → 0/−1,00/0,665; roll theo quy tắc Qh (X cục bộ = +X thế giới) |
| G2 (rig) | 2026-10-27 | duyệt | người dùng | xem trong Blender (cửa sổ `gui_open.py` + tab B01) và `qa/B01_sextons_dog_G2_1..4_*.png`; không yêu cầu đổi (không xương phụ hông/đùi, giữ `neck_01`/`neck_02`); giới hạn ở `qa_report.md` mục 6. Xuất rig (R8, chưa clip): `../rig_done/` |
| G3 (clip) | | | | |
| G4 (trong lab) | | | | |
| R9 (tích hợp engine, nếu có) | | | | |
