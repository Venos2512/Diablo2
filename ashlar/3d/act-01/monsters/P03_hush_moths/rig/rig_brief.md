# Rig brief — P03_hush_moths

Quy trình: [`Agent.md`](../../../../rig-anim/Agent.md). Chuẩn: [`SKELETON_STANDARD.md`](../../../../rig-anim/SKELETON_STANDARD.md).
Lô: [`_batches/rig_v1/BRIEF.md`](../../../_batches/rig_v1/BRIEF.md) §2b (bảng bone đề xuất, chưa duyệt). Yêu cầu người dùng 2026-10-26: rig 8 con
không phải dạng người, mỗi con một thread; thread này chỉ làm P03, R0–R5, dừng ở G2, không clip, không export.

Trạng thái: **G1 duyệt 2026-10-26** (người dùng trả lời "duyệt": nhận mọi đề xuất ở mục Câu hỏi G1). R2–R5 xong; **G2 duyệt 2026-10-27**
(người dùng xem trong Blender, trả lời "done, export đi"; bốn câu hỏi G2 giữ như đề xuất). **Xuất `rig_done/` 2026-10-27** (A + B, FBX +
GLB + textures, chưa clip; reimport PASS). Chi tiết ở [`qa_report.md`](qa_report.md) §8. 0 credit. GLB gốc chỉ đọc.

Quyết định G1: (1) cao **0,594 m** (chóp râu 0,33H), hệ số 1,2983; (2) **A trong file nguồn, B sinh bằng script lúc export** (kiểm cả B ở R4);
(3) **bản lề chung** cho cánh trước và sau mỗi bên; (4) **chân 3 đốt**; (5) socket như bảng A / B; (6) lông cổ theo `thorax`, đầu cử động
nhỏ (±15°); (7) giữ vị trí khớp như ảnh đề xuất. Bảng bone đã chép vào `SKELETON_STANDARD.md` §3 (Họ W, nhóm côn trùng bay).

Nhãn: **[đo]** số lấy từ GLB (script `scripts/p03_r1_analyze.py`, `p03_g1_proposal.py`; số liệu ở `_work/r1/r1_analysis.json`,
`_work/g1/landmarks_auto.json`, `_work/g1/bones_A.json`, `bones_B.json`) · **[suy luận]** rút ra từ số đo hoặc ảnh · **[đề xuất]** chờ G1.

Ảnh đề xuất: [`qa/P03_hush_moths_G1_proposal.png`](qa/P03_hush_moths_G1_proposal.png) (khớp dự kiến chồng mesh X-ray: phương án A trước /
bên / trên, phương án B trước / bên / trên, cận chân bên, cận chân giữa trước, cận đầu–râu–bản lề cánh).

## Thông tin asset

| Mục | Giá trị |
| --- | --- |
| `asset_id` | `P03_hush_moths` |
| Nhóm / loại | quái (một con của đàn; đàn = nhiều bản sao cùng model, nhiều con cùng lúc trên màn hình) |
| Họ quái ASHLAR | Perfection-born (Act I Poppy Reach, Garden of Hush, Cradle) |
| GLB gốc | `P03_hush_moths.glb` **[đo]** 11.833.300 B, sha256 `816144b3…9298`, 10.378 tam giác, 6.547 đỉnh glTF; importer hàn → 5.348 đỉnh, **37 mảnh**. 1 mesh, 1 material, 1 UV, 3 map 4096 (basecolor JPG, normal JPG, RM PNG). Không skin, không vertex group. 11 cạnh non-manifold, 184 cạnh biên (R0) |
| Mảnh **[đo]** | thân 1.498 đỉnh (lông cổ, yếm, ngực, bụng là một mảnh) · đầu 236 · 2 mắt 58 · 6 chân (cặp trước 434, giữa 400, sau 300 đỉnh mỗi chân) · cánh trước 168 ×2 · cánh sau 109 ×2 · râu 11–12 mảnh mỗi bên (cuống + phiến 136 đỉnh, các răng lược 3–34 đỉnh). **Mọi phần trừ thân đều là mảnh rời** cắm vào thân |
| Đối xứng **[đo]** | lệch gương trung bình 0,22 mm, p95 0,63 mm, max 4,9 mm (ở kích thước thật). Khớp bên R lấy bằng soi gương bên L |
| Chiều cao thật (danh mục) | `ashlar/3d/README.md`: chóp râu 0,33H, sải cánh ~0,75H. Chốt ở G1 (câu hỏi 1) |
| Tư thế gốc | đứng trên 6 chân, 4 cánh xoè trưng (mặt cánh quét ra sau ~25°, mép trước cánh trước nâng 19°, cánh sau chúc 18°), râu hình chữ V |
| Lỗi đã biết của mesh | dựng từ **hai góc trước + sau** (không có góc bên); cánh trước và sau hơi lệch thành **hai lớp sát nhau** (khe nhỏ nhất 0,07 mm); cánh rất thưa (168 / 109 đỉnh cho sải 0,64 / 0,42 m, cạnh dài tới 48 mm); đoạn bàn chân mảnh (bán kính 3–7 mm) |

## Kích thước và scale [đo + đề xuất]

| Mục | Giá trị |
| --- | --- |
| Bounds GLB (rộng × sâu × cao) | 0,9995 × 0,4019 × 0,4575 (Tripo chuẩn hoá sải cánh = 1) |
| **Đề xuất: cao 0,594 m** (chóp râu 0,33H × 1,8 m) | hệ số **1,2983** → 1,298 × 0,522 × 0,594 m; sải cánh 1,298 m = **0,72H** (danh mục ~0,75H, hụt 4 %) |
| Phương án: theo sải 0,75H | hệ số 1,3507 → cao 0,618 m (0,343H, dư 4 % so với 0,33H) |
| Phương án: theo vạch concept "wingspan 0.25H" | hệ số 0,450 → sải 0,45 m, cao 0,206 m (design.txt ghi kích thước trong game đặt lúc import) |
| Pivot | giữa đáy, mũi chân thấp nhất z = 0; mặt nhìn −Y Blender (= +Z glTF); **trái của quái = +X** |

Rig dựng ngay ở kích thước đã chốt (quyết định G1 lô rig_v1). Mọi script nhận chiều cao làm tham số; landmark đo lại từ mesh nên đổi
chiều cao chỉ là chạy lại.

## Quyết định rig

| Mục | Lựa chọn | Lý do |
| --- | --- | --- |
| Họ skeleton | **W** (côn trùng bay) | 4 cánh, 6 chân, bay là chính |
| Route | **M** (dựng bằng script trong Blender 5.1 chạy nền) | skill người không áp dụng (lô rig_v1 §2b); 0 credit; mesh sạch, mảnh rời rõ |
| Công cụ cụ thể | Blender 5.1.1 `-b --factory-startup`; script riêng ở `rig/scripts/` (`p03_common.py`, `p03_skeleton.py`…); dùng lại `rigbatch.py` (intake, render Workbench, proxy xương) và `compose.py` của `_batches/rig_v1/tools/` bằng import, không sửa | |
| Ước tính credit | **0** | không Tripo / Meshy / UniRig |
| Bone ngón | không (không có bàn tay) | |
| Bone phụ cần giữ | râu 2 đốt mỗi bên; cánh 2 đốt mỗi cánh | râu và cánh là chuyển động chính |
| Bone mặt | không | đầu nhỏ, lún trong lông |
| Socket vũ khí | không | |
| Socket VFX | `ground`, `hit_origin`, `fx_thorax`, `fx_head`, `fx_wing_L`, `fx_wing_R` (A); `ground`, `fx_thorax` (B) | `fx_wing_*` ở tâm đốm mắt cánh trước (đo từ texture) cho bụi cánh làm chậm; `fx_thorax` theo cách đặt tên của W04 (chuẩn ghi `fx_chest`) |
| Vật phụ rời | không | |

### Bảng bone runtime — phương án A (đầy đủ) [đề xuất]

37 xương (35 deform; `root`, `cog` không trọng số) + 6 socket = **43**. Vị trí khớp [đo] trong `_work/g1/bones_A.json`.

| Bone | Cha | Phủ (vùng mesh) | Khớp đặt ở đâu |
| --- | --- | --- | --- |
| `root` | – | – | gốc toạ độ, trỏ lên |
| `cog` | `root` | – | tâm ngực (0; 0,009; 0,214), trỏ lên |
| `thorax` | `cog` | phần trước của mảnh thân: lông cổ, yếm, ngực; đầu trong của 6 chân | tâm ngực → gáy |
| `head` | `thorax` | mảnh đầu + 2 mắt (cứng) | gáy (sau đầu, trong lông cổ) → chóp mỏ |
| `abdomen_01..03` | `thorax` → chuỗi | bụng, 3 đoạn bằng nhau theo đường tâm mặt cắt | eo (sau háng chân sau) → chóp bụng |
| `L/R_antenna_01` | `head` | cuống + nửa dưới phiến râu (kèm răng lược) | chỗ cuống ló khỏi đầu → 45 % dọc trục râu |
| `L/R_antenna_02` | `antenna_01` | nửa trên phiến râu | → chóp râu |
| `L/R_WingF_01` | `thorax` | cánh trước, phần trong | **bản lề chung** → giữa cánh (45 % sải) |
| `L/R_WingF_02` | `WingF_01` | cánh trước, phần ngoài | → gần chóp cánh |
| `L/R_WingB_01` | `thorax` | cánh sau, phần trong | **bản lề chung** (cùng điểm với `WingF_01`) → giữa cánh |
| `L/R_WingB_02` | `WingB_01` | cánh sau, phần ngoài | → gần chóp cánh |
| `L/R_Leg1..3_01` | `thorax` | đốt chậu + đùi (một khối cứng) | háng (chỗ chân ló khỏi thân) → gối (u cao nhất của vòm chân) |
| `L/R_Leg1..3_02` | `Leg_01` | ống chân | gối → cổ chân (u khớp trước đoạn bàn mảnh) |
| `L/R_Leg1..3_03` | `Leg_02` | đoạn bàn mảnh + bàn có vuốt | cổ chân → mũi bàn |
| `ground` | `root` | socket | gốc toạ độ |
| `hit_origin` | `thorax` | socket | trước chóp mỏ 2 cm, trỏ tới trước |
| `fx_thorax` | `thorax` | socket | tâm ngực |
| `fx_head` | `head` | socket | tâm đầu |
| `fx_wing_L/R` | `WingF_02` | socket | tâm đốm mắt đỏ cánh trước, trỏ theo pháp tuyến mặt lưng cánh |

Chân 1 = cặp trước, 2 = giữa, 3 = sau (theo vị trí mũi bàn trước → sau). Bản lề cánh: gốc cánh trước (0,022; −0,034; 0,305) và gốc
cánh sau (0,046; −0,008; 0,298) cách nhau 3,6 cm; bản lề chung đặt ở giữa (±0,034; −0,021; 0,302), nằm trong lông ngực. Roll: bone cánh
local Z = pháp tuyến mặt lưng cánh; bone chân local X = trục gập (pháp tuyến mặt phẳng háng–gối–cổ chân); đối xứng L/R như Symmetrize
của Blender (xoay quanh X cùng dấu hai bên).

### Phương án B (bầy, ít bone) [đề xuất]

22 xương (20 deform) + 2 socket = **24**. **Là tập con của A**: cùng tên, cùng tư thế nghỉ; xương bị bỏ dồn trọng số về cha. Clip làm
trên A chạy được trên B (kênh của xương thiếu bị bỏ qua).

| Bỏ | Trọng số dồn về |
| --- | --- |
| `abdomen_03` | `abdomen_02` (bụng 2 đốt) |
| `L/R_antenna_02` | `L/R_antenna_01` (râu một khối) |
| `L/R_Leg1..3_02`, `_03` | `L/R_Leg1..3_01` (mỗi chân một khối, xoay ở háng) |
| `hit_origin`, `fx_head`, `fx_wing_L/R` | socket bỏ; VFX bám `fx_thorax` |

Giữ nguyên 8 xương cánh (cánh là chuyển động chính). Nếu cần ít hơn nữa: bỏ `Wing*_02` → 18 xương (cánh cứng).
**Khuyến nghị:** dựng A trong file nguồn (có rig điều khiển), B sinh bằng script lúc export R8 (gộp trọng số, cùng bind) và kiểm cả hai ở
R4. Người dùng chọn ở câu hỏi 2.

### Rig điều khiển (`ctl_*`, armature riêng `P03_hush_moths_ctl` trong `.blend`, không xuất) [đề xuất]

| Control | Việc |
| --- | --- |
| `ctl_root`, `ctl_cog` | đặt chỗ; thân bay (nhấp nhô, nghiêng, chúc) |
| `ctl_thorax`, `ctl_head`, `ctl_L/R_antenna_01..02`, `ctl_abdomen_01..03` | FK |
| `ctl_abdomen_curl` | một control cong cả bụng (cộng cùng góc vào 3 đốt) |
| `ctl_L/R_Wing` | **vỗ cánh**: đặt ở bản lề chung, local X = trục dọc thân; xoay X dương = cánh lên. Là cha của `ctl_*_WingF_01` và `ctl_*_WingB_01` nên hai lớp cánh đi cùng nhau (W04 đặt cùng kiểu) |
| `ctl_L/R_WingF_01`, `ctl_L/R_WingB_01` | lệch riêng từng cánh (xoắn, quét, trễ nhịp) |
| `ctl_L/R_WingF_02`, `ctl_L/R_WingB_02` | uốn phần ngoài cánh |
| `ctl_wings` | vỗ đối xứng cả hai bên (cộng vào `ctl_L/R_Wing`, bên R lật dấu Y/Z) |
| `ctl_L/R_Leg1..3_01..03` | FK (bay: chân co / thả) |
| `ctl_L/R_Leg1..3_IK`, `ctl_L/R_Leg1..3_pole` | IK 2 đốt (`_01`, `_02`) tới cổ chân, `_03` theo hướng control bàn; pole gối. Thuộc tính `leg_ik` (0 = FK, 1 = IK) để chuyển khi đậu / bò |

Skeleton runtime theo rig điều khiển bằng Copy Transforms (lệch rest 0); bake ở R8.

## Thông số animation (theo `blender-game-animation`)

| Mục | Giá trị |
| --- | --- |
| Trục tiến / trục lên | +Z / +Y (glTF); Blender −Y / +Z |
| Đơn vị | mét |
| fps | 24 *(đề xuất)* |
| Loop / root motion | `idle` (bay tại chỗ), `walk` (bay chậm), `run`: loop kín, in-place; `death`: không loop. Độ cao bay đặt ở game hay trong clip (`cog`) — quyết ở phiên animation |
| Sự kiện gameplay cần có | `hit` của `attack` (40–50 %), `fx` bụi cánh của `cast`/`attack`; không có `footstep` |
| Tham chiếu | chưa có (`rig/anim/refs/` tạo ở R6) |
| Rig điều khiển | IK chân: **có** (6, có công tắc FK/IK) · IK tay: không · control tiếp xúc: mũi bàn khi đậu |
| Giới hạn influence của engine đích | 4 (glTF) |
| Tiếp tục file của người khác? | không (dựng mới trong `rig/P03_hush_moths_rig.blend`) |

## Bộ clip (chỉ liệt kê, theo `SKELETON_STANDARD.md` §5, họ W)

| State | Cần? | Nguồn dự kiến | Dùng lại từ | Ghi chú |
| --- | --- | --- | --- | --- |
| `idle` | R | keyframe tay | – | bay tại chỗ, vỗ cánh, loop |
| `walk` | R | keyframe tay | – | bay chậm tới trước, in-place |
| `run` | O | keyframe tay | `walk` nhịp nhanh | |
| `attack` | R | keyframe tay | – | lao / quạt cánh tung bụi; `hit` 40–50 % |
| `attack2` | O | – | – | |
| `cast` | O | keyframe tay | – | rắc bụi làm chậm (`fx`) |
| `block`, `blockHit` | – | – | – | không có ở họ W |
| `hit` | R | keyframe tay | – | |
| `death` | R | keyframe tay | – | rơi, cụp cánh, co chân; dừng pose cuối |
| `revive` | O | – | – | |
| `jump`, `dodge` | – | – | – | |
| Clip đặc thù | O | keyframe tay | – | `land`, `takeoff`, `idle_ground` (đậu, cánh xoè như mesh) |

## Cách skin dự kiến (R3)

Theo lô rig_v1 §2b: trọng số theo khoảng cách tới đoạn xương + làm mịn Laplace trên mesh đã hàn; phần cứng một xương; tối đa 4 ảnh hưởng,
tổng 1. Vì mọi phần trừ thân là mảnh rời, phần lớn trọng số gán theo mảnh:
- Đầu + 2 mắt → `head` 100 %.
- Râu: chiếu lên trục râu, `_01` → `_02` chuyển dần quanh khớp giữa; mỗi răng lược lấy trọng số của điểm trục gần nhất (cả răng một bộ, không méo).
- Cánh: chiếu lên trục sải, `_01` → `_02` chuyển dần quanh 45 % sải (rộng ≥ 2 vòng cạnh vì cánh thưa); không có trọng số `thorax`.
- Chân: theo khoảng cách trắc địa dọc chân, chuyển dần quanh gối và cổ chân; đầu trong (nằm trong thân) chuyển sang `thorax`; đỉnh trùng
  giữa chân và thân (chân trước trái chạm thân) lấy cùng trọng số.
- Thân: `thorax` ↔ `abdomen_01..03` (và có thể một dải lông cổ trước theo `head`) theo khoảng cách + Laplace.

## Rủi ro và vùng khó skin

1. **Hai lớp cánh** (trọng tâm QA): cánh sau nằm sát sau cánh trước (24 đỉnh trong 5 mm, vùng sát nhau ở 2/3 trong của cánh sau). Hai bản lề
   riêng cách 3,6 cm thì vỗ 60° làm cánh sau trượt ~2,5 cm so với cánh trước → xuyên hoặc tách lớp; vì thế đề xuất bản lề chung. Uốn
   `_02` hoặc trễ nhịp giữa hai cánh vẫn có thể xuyên: đo khoảng cách có dấu ở mọi tư thế thử.
2. Gốc cánh cắm trong lông ngực: vỗ hết biên có thể làm mép gốc cánh ló ra khỏi lông hoặc cánh chạm râu / chân (cánh sau khi vỗ xuống).
3. Cánh thưa: uốn `_02` sẽ gãy góc theo cạnh dài (48 mm); giữ biên độ uốn nhỏ.
4. Chân là mảnh rời cắm vào thân; đoạn bàn rất mảnh; dáng `_01` hình chữ V (đốt chậu xuống, đùi lên) nên xương `_01` thẳng nằm trên u đốt
   chậu ~2 cm (khối cứng, không ảnh hưởng biến dạng).
5. Đầu lún trong lông cổ (mảnh rời): gật / quay đầu lớn sẽ cắt vào lông cổ; dự kiến giới hạn ±15° hoặc cho viền lông trước theo `head` một phần.
6. Bụng nằm dưới cánh sau: cong bụng lên sẽ chạm cánh sau.
7. Mesh dựng từ hai góc: mặt bên (lông, bụng) là suy ra của Tripo; chỉ soi được bằng ảnh render.

## Điểm đặt tên dùng chung với W04 Mire-Sucker và W07 Shroud-Spinner

Đọc lúc viết brief (2026-10-26 22:3x): W04 có [`rig_brief.md`](../../W04_mire_sucker/rig/rig_brief.md) (chờ G1) và
`rig/scripts/w04_rig_def.py`; W07 chưa có brief (mới có script đo khớp chân, dùng `Leg1..4`). W02 Gibbet-Crow (họ W, chim, chờ G1) đã ghi
"P03, W04 dùng `L_WingF_*`, `L_WingB_*`, chim dùng `L_Wing_*`". Đối chiếu với W04:
- **Trùng:** `root`, `cog`, `thorax`, `head`, `abdomen_0n`; cánh `L/R_WingF_0n` (cánh trước / trên), `L/R_WingB_0n` (cánh sau / dưới), `_01`
  trong, `_02` ngoài; **`WingF_01` và `WingB_01` chung một điểm gốc**; control vỗ `ctl_<side>_Wing` là cha của `ctl_*_WingF_01`,
  `ctl_*_WingB_01`; chân `L/R_Leg<n>_<đốt>` (n = cặp chân theo vị trí giải phẫu trước → sau, đốt đánh số từ thân ra), IK
  `ctl_<side>_Leg<n>_IK`, `ctl_<side>_Leg<n>_pole`; socket `ground`, `hit_origin`, `fx_head`, `fx_thorax`; roll: bone cánh Z = pháp tuyến
  mặt cánh, bone chân X = trục gập (xoay +X = gập thêm, cả hai bên). Với W02: `fx_wing_L/R` trùng tên (chim gắn ở cổ tay cánh, P03 ở đốm
  mắt cánh trước); chim dùng `fx_chest`, côn trùng `fx_thorax`.
- **Khác:** số đốt chân tuỳ loài — W04 4 đốt (`_01` đốt chậu riêng, `_02` đùi, `_03` ống, `_04` bàn), P03 3 đốt (`_01` = đốt chậu + đùi vì
  u đốt chậu nằm sát thân), W07 3 đốt. Cùng tên `L_Leg1_02` là đùi ở W04 nhưng ống chân ở P03: clip chân không dùng chéo giữa hai loài
  (vốn khác số chân, tỉ lệ). W04 không có râu, có `proboscis_0n` và bụng hai thuỳ `L/R_abdomen_02..03`; P03 có `L/R_antenna_0n`.
- Đề xuất ghi vào `SKELETON_STANDARD.md` §3 Họ khác (sau G1): quy tắc trên + "số đốt chân theo loài, ghi trong brief".

## Chỉ tiêu qua cổng

- G2: `QA_CHECKLIST.md` A1 (A1.8–A1.10 cần file xuất; lượt này không export nên kiểm tương đương trong Blender hoặc ghi "chưa áp dụng",
  nói rõ ở G2), A2 (skeleton chồng mesh ba góc, bản đồ trọng số, tư thế thử), cộng các tư thế riêng của họ W: **vỗ cánh hết biên**
  lên ~+65° và xuống ~−45° (soi khe / xuyên hai lớp cánh, gốc cánh, cánh chạm râu và chân), cánh sau trễ ±10°, uốn cánh `_02`, xoắn cánh,
  **cong bụng** (xuống / lên / sang bên), **rung râu**, gật / quay đầu, co chân khi bay, bước một chân bằng IK, hạ thân giữ bàn. Số đo: giãn
  cạnh, khoảng cách có dấu giữa hai lớp cánh, đỉnh lọt vào thân. Kiểm cả B nếu chọn.
- G3, G4: ngoài phạm vi lượt này.

Rig editor của skill chỉ đọc khớp người (`MID_JOINTS`/`SIDE_JOINTS`), không dùng cho con này; chỉnh khớp bằng cách nêu trong phản hồi G1.

## Câu hỏi G1

1. **Kích thước:** cao 0,594 m (0,33H, sải 0,72H) — đề xuất; hay theo sải 0,75H (cao 0,618 m); hay theo vạch concept sải 0,25H?
2. **Phương án bone:** A (43) · B (24) · **A trong nguồn + B sinh lúc export** (đề xuất).
3. **Bản lề cánh chung** cho cánh trước và sau mỗi bên (đề xuất, giống W04) hay bản lề riêng ở gốc từng cánh?
4. **Chân 3 đốt** (đề xuất) hay 4 đốt như W04 (tách đốt chậu, +6 xương)?
5. **Socket:** bộ A ở trên (có `fx_wing_L/R` cho bụi cánh, `fx_thorax` thay `fx_chest`) có đủ không?
6. **Lông cổ:** giữ theo `thorax` (đầu cử động nhỏ, ±15°) hay cho viền lông trước theo `head` một phần?
7. Vị trí khớp trên ảnh đề xuất có chỗ nào cần dời không?

## Duyệt

| Cổng | Ngày | Kết quả | Người duyệt | Ghi chú |
| --- | --- | --- | --- | --- |
| G1 (brief) | 2026-10-26 | duyệt | người dùng | nhận mọi đề xuất (câu 1–7) |
| G2 (rig) | 2026-10-27 | duyệt | người dùng | xem trong Blender, "done, export đi"; A1 14/14, tờ `qa/P03_hush_moths_G2_1..4`; 4 câu hỏi G2 giữ đề xuất; xuất `rig_done/` |
| G3 (clip) | | | | |
| G4 (trong lab) | | | | |
| R9 (tích hợp engine, nếu có) | | | | |
