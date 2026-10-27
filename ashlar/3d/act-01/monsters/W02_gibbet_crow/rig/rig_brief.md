# Rig brief — W02_gibbet_crow

Trạng thái: **G1 duyệt (2026-10-26)**: câu 1 chọn **C** (đi/nhảy trên đất + bay ngắn khi bổ nhào); câu 2–4 theo đề xuất (người dùng không đổi). **R2–R5 xong, chờ G2**: [`qa_report.md`](qa_report.md), [`validation.json`](validation.json) (A1 14/14), ảnh `qa/W02_gibbet_crow_G2_1..6.png`. Quy trình: [`Agent.md`](../../../../rig-anim/Agent.md) (R0–R5, dừng ở
G2). Chuẩn: [`SKELETON_STANDARD.md`](../../../../rig-anim/SKELETON_STANDARD.md). Lô: [`rig_v1/BRIEF.md`](../../../_batches/rig_v1/BRIEF.md)
§2b (bảng bone đề xuất cho con không phải người, chưa duyệt; bảng dưới đây sửa theo mesh thật).

Nhãn: **[đo]** = số lấy từ GLB (script `rig/scripts/w02_r1_probe.py`, kết quả `rig/_work/r1/`); **[suy luận]** = đọc từ ảnh cắt lát
và ảnh phóng to, chưa kiểm bằng rig; **[đề xuất]** = chờ duyệt ở G1.

Ảnh đề xuất: [`qa/W02_gibbet_crow_G1_proposal.png`](qa/W02_gibbet_crow_G1_proposal.png) (khớp dự kiến chồng lên mesh: trước, bên,
trên xuống, phóng to cổ–đầu và chân). Toạ độ khớp: `rig/_work/r1/joints_proposal.json` (sinh bằng `rig/scripts/w02_g1_joints.py`).

## Thông tin asset

| Mục | Giá trị |
| --- | --- |
| `asset_id` | `W02_gibbet_crow` |
| Nhóm / loại | quái, họ Warped; quạ ăn xác cỡ lớn, gù kiểu kền kền, đầu trọc hồng, lông bết hắc ín |
| GLB gốc | `W02_gibbet_crow.glb`, 15,1 MB, 9.105 tam giác, 1 mesh, 1 material, 3 texture 4096 (base JPEG, normal JPEG, RM PNG), sha256 `9b659d3d…8f5b`; không skin, không vertex group **[đo, R0]** |
| Kích thước GLB | rộng 0,9995 (sải cánh) × sâu 0,5327 (mỏ → đuôi) × cao 0,4692 (chóp cánh) đơn vị Tripo **[đo]** |
| Kích thước thật (danh mục) | đứng 0,36H, sải cánh 0,89H (H = 1,8 m); chốt ở G1, câu hỏi 2 |
| Tư thế gốc | dáng trưng (display): hai cánh dang trong **một mặt phẳng đứng** ngay sau vai (y ≈ −0,175 m), mép trước dốc lên ~15° (20° ở nửa trong, 9° ở bàn cánh), lông rủ xuống; mặt dưới cánh nhìn ra trước, mặt trên nhìn ra sau. Hai chân đứng song song, ngón phẳng, mỏ khép, đuôi chĩa ra sau và xuống ~31°. Concept vẽ cánh rủ như áo choàng nửa mở: tư thế này chỉ để dựng mesh |
| Cấu trúc mesh **[đo]** | Hàn đỉnh trùng: 5.677 đỉnh, **92 mảnh**: 1 mảnh chính 2.755 đỉnh (thân + hai cánh + đầu + mỏ + "quần" lông đùi, liền một khối); 2 chân vảy (gồm ngón và móng, cắm vào trong "quần" tới z ≈ 0,20 m); 47 mảnh lông cổ (ruff); 36 mảnh lông rời đè lên nửa ngoài cánh (18 mỗi cánh, cả mặt trước lẫn sau); 3 mảnh đuôi (quạt đuôi + 2 lớp lông phủ); 2 mắt cầu; 1 mảnh lông nhỏ trên thân |
| Mỏ **[đo]** | có **khoang miệng thật**: vỏ mỏ trên rỗng, lòng miệng hồng bên trong, hàm dưới là khối riêng (lát cắt `rig/_work/r1/sec_bill.png`) → mở mỏ được, chỉ khoé miệng bị kéo |
| Lỗi đã biết của mesh | Cánh là **một tấm liền với sườn** từ vai (z ≈ 0,55 m) xuống tới z ≈ 0,30 m (không có khe giữa cánh và thân); mép trước dày 2–3 cm, lông bên dưới mỏng. Lông rời (cổ, cánh, đuôi) là tấm mỏng không độ dày. 151 cạnh non-manifold, 2.271 cạnh biên (R0) |

## Kích thước thật và hệ số scale **[đề xuất]**

Hình dựng (tpose.log) đo sải cánh / chiều cao = 2,12, tức sải cánh 0,89H cho hình cao 0,42H tính tới chóp cánh. "Đứng 0,36H" là vạch của
concept ở dáng cánh rủ (giữa đỉnh đầu 0,32H và đỉnh khối cánh choàng 0,40H), không phải chiều cao của dáng dang cánh.

| | A — theo sải cánh **[đề xuất]** | B — theo "đứng 0,36H" |
| --- | --- | --- |
| Hệ số scale | **1,6028** (sải 0,9995 → 1,602 m) | 1,3811 (cao 0,4692 → 0,648 m) |
| Sải cánh | 1,602 m (0,89H) | 1,380 m (0,77H) |
| Cao tới chóp cánh (dáng gốc) | 0,752 m (0,42H) | 0,648 m (0,36H) |
| Đỉnh đầu | 0,565 m (0,31H; concept 0,32H) | 0,487 m (0,27H) |
| Mỏ → đuôi | 0,854 m (0,47H; concept "body 0,50H") | 0,736 m (0,41H) |

Với A, kiểm A1.11 đo trên **sải cánh** (bề ngang bounds = 1,602 m ± 2 %) vì dáng gốc dang cánh; chiều cao "đứng 0,36H" đo lại ở tư thế
thử gập cánh (G2, dự kiến 0,35–0,40H tính đỉnh khối cánh).

**Gốc toạ độ** **[đề xuất]**: `root`/`ground` đặt trên đất **giữa hai bàn chân** (tâm đệm bàn chân, y ≈ −0,145 m sau scale), mesh dời
+0,145 m theo Y khi dựng (GLB gốc không sửa, phép dời ghi vào `rig.log`). Gốc bounds của Tripo nằm sau bàn chân 14 cm; xoay tại chỗ trong
game sẽ làm chân trượt vòng cung.

## Quyết định rig

| Mục | Lựa chọn | Lý do |
| --- | --- | --- |
| Họ skeleton | **W** (có cánh), bản chim đầu tiên | cánh + hai chân chim; P03, W04 (côn trùng bay) dùng `L_WingF_*`, `L_WingB_*`, chim dùng `L_Wing_*` |
| Route | **M** (dựng bằng script trong Blender 5.1 chạy nền) | lô rig_v1 §2b; skill người không áp dụng; 0 credit |
| Công cụ cụ thể | script riêng `rig/scripts/` (dựng khớp theo landmark đo ở R1, trọng số theo khoảng cách tới đoạn xương + làm mịn Laplace trên mesh đã hàn); dùng lại hàm render/màu/độ giãn của `_batches/rig_v1/tools/rigbatch.py` (import, không sửa) | Automatic Weights của Blender hỏng trên mesh Tripo |
| Ước tính credit | không tốn | không Tripo, Meshy, UniRig |
| Bone ngón | **một `L_Toe`** cho 3 ngón trước; ngón sau (hallux) theo `L_Foot` | ngón chân to nhưng con quái ~0,75 m; gập ngón chung đủ cho bám/đậu |
| Bone phụ | không (lông cánh, lông cổ, đuôi bám xương gần nhất); tuỳ chọn ở câu hỏi 4 | |
| Bone mặt | `beak` (hàm dưới) | mesh có khoang miệng thật |
| Socket vũ khí | không | quái không cầm vũ khí |
| Socket VFX | `ground`, `hit_origin` (chóp mỏ, điểm mổ), `fx_head`, `fx_chest`, `fx_wing_L`, `fx_wing_R` (cổ tay cánh: lông/bụi khi vỗ) | |
| Vật phụ rời | không | |

### Bảng bone runtime **[đề xuất]**: 32 bone = 24 deform + `root`, `cog` + 6 socket

Đề xuất của họ W là 30–60 deform; con này 24 deform (như D01 25): không thêm bone đệm. Toạ độ (m, trước khi dời gốc): `joints_proposal.json`.

| Bone | Cha | Deform | Vùng phủ (dự kiến) |
| --- | --- | --- | --- |
| `root` | – | không | trên đất, giữa hai bàn chân |
| `cog` | `root` | không | trọng tâm khối thân (0; −0,075; 0,37) |
| `pelvis` | `cog` | có | hông, mông, gốc "quần" lông phía trên, gốc đuôi; đầu bone ở trục hông (z 0,355) |
| `spine_01` | `pelvis` | có | giữa lưng và bụng |
| `chest` | `spine_01` | có | ngực, vai, phần thân ở gốc cánh, lông rời lưng trên |
| `neck_01`, `neck_02`, `neck_03` | chuỗi từ `chest` | có | cổ ngắn trong khối lông cổ (9 cm); 47 mảnh ruff bám theo điểm gốc của từng mảnh |
| `head` | `neck_03` | có | sọ hồng, gai má, mắt (cứng), mỏ trên |
| `beak` | `head` | có | hàm dưới; bản lề ở khoé miệng (0; −0,35; 0,462) |
| `tail_01` | `pelvis` | có | gốc đuôi + 2 lớp lông phủ đuôi (từ mông y +0,075) |
| `tail_02` | `tail_01` | có | nửa sau quạt đuôi (tới chóp y +0,42) |
| `L_Thigh` | `pelvis` | có | đùi (xương đùi chim, nằm trong thân) + phần trên "quần" lông; hông (±0,075; −0,035; 0,355) → gối (0,10; −0,165; 0,275) |
| `L_Calf` | `L_Thigh` | có | "quần" lông (cẳng đùi chim); gối → cổ chân ở mép dưới "quần" (0,097; −0,08; 0,155) |
| `L_Foot` | `L_Calf` | có | giò vảy, ngón sau; cổ chân → đệm bàn (0,135; −0,13; 0,032) |
| `L_Toe` | `L_Foot` | có | 3 ngón trước + móng; tới chóp ngón giữa (0,15; −0,265) |
| `L_Wing_01` | `chest` | có | cánh tay: nửa trong cánh, lông sát thân (trộn với `chest` ở dải gốc cánh); vai (0,09; −0,175; 0,505) → khuỷu (0,27; −0,18; 0,575) |
| `L_Wing_02` | `L_Wing_01` | có | cẳng cánh; khuỷu → cổ tay (0,46; −0,18; 0,64) |
| `L_Wing_03` | `L_Wing_02` | có | bàn cánh + lông chóp + 18 mảnh lông rời; cổ tay → chóp cánh (0,79; −0,175; 0,69) |
| `R_*` | | | đối xứng qua x = 0 (mesh đối xứng, LEFT/RIGHT là ảnh lật) |
| `ground` | `root` | socket | điểm đặt bóng, ring chọn |
| `hit_origin` | `head` | socket | chóp mỏ (0; −0,43; 0,425) |
| `fx_head` | `head` | socket | giữa sọ |
| `fx_chest` | `chest` | socket | trước ngực |
| `fx_wing_L`, `fx_wing_R` | `L_Wing_03`, `R_Wing_03` | socket | cổ tay cánh |

Chuẩn đặt tên: chân chim giữ tên chuẩn như chân khuỷu ngược của W01/W03 (lô rig_v1 §2a): `Thigh` = xương đùi, `Calf` = cẳng đùi
(tibiotarsus, khối "quần"), `Foot` = giò (tarsometatarsus), `Toe` = ngón. Cánh `L_Wing_01..03` viết hoa như `L_Thigh` (chuẩn §3 "Họ
khác" ghi ví dụ `L_wing_01…` chữ thường: xem câu hỏi 4).

### Rig điều khiển **[đề xuất]** (armature `W02_gibbet_crow_ctl`, bone `ctl_*`, chỉ ở `.blend`, không xuất)

Skeleton runtime `W02_gibbet_crow_rig` theo rig điều khiển bằng Copy Transforms (cùng rest), như H2_FL_hand; chuyển động bake lên runtime
ở R8.

| Control | Việc |
| --- | --- |
| `ctl_root` | kéo cả con trên mặt đất |
| `ctl_cog` | thân, cổ, đầu, cánh, đuôi (không kéo bàn chân IK): nhún, chồm, bật nhảy |
| `ctl_pelvis`, `ctl_spine_01`, `ctl_chest`, `ctl_neck_01..03`, `ctl_head`, `ctl_beak`, `ctl_tail_01..02` | FK |
| `ctl_L_Foot_IK` | control tiếp xúc ở đệm bàn chân trên đất (đặt chân, xoay, nghiêng); IK `L_Thigh`–`L_Calf` tới cổ chân |
| `ctl_L_Heel` | xoay giò quanh đệm bàn (nhấc cổ chân khi bước, nhún trước khi bật) |
| `ctl_L_Toe` | gập 3 ngón trước (bám, đậu) |
| `ctl_L_Knee_pole` | hướng gối (gối chim chĩa ra trước) |
| `ctl_L_Wing_01..03` | FK cánh |
| `ctl_L_Wing_fold` | thanh trượt 0 → 1: từ dáng trưng tới dáng gập rủ như concept; FK cộng thêm lên trên |
| tuỳ câu hỏi 1 | `ctl_L_Wing_flight` (xoay mặt cánh nằm ngang để bay) và công tắc chân IK "theo thân" (thu chân khi bay) |

## Thông số animation

| Mục | Giá trị |
| --- | --- |
| Trục tiến / trục lên | glTF: mặt nhìn +Z, Y lên (Blender: mặt nhìn −Y, Z lên; trái của quạ = +X, đã kiểm trên mesh) |
| Đơn vị | mét, kích thước thật theo câu hỏi 2 |
| fps | 24 *(đề xuất của chuẩn)* |
| Loop / root motion | `idle`, `walk` (và `fly` nếu có) vòng lặp kín, tại chỗ; `death` dừng pose cuối; không root motion |
| Sự kiện gameplay cần có | `hit` của `attack` (mổ) ở 40–50 % clip; `footstep` (đi/nhảy); `fx` vỗ cánh ở `fx_wing_*`; cất cánh/hạ cánh nếu có bay |
| Tham chiếu | concept `concept.png`; video quạ/kền kền đi, nhảy, mổ, cất cánh (tìm ở phiên animation) |
| Rig điều khiển | IK chân: có (2 xương + giò theo gót); IK cánh: không (FK + thanh gập); control tiếp xúc: đệm bàn chân |
| Giới hạn influence của engine đích | 4 (glTF), tổng 1 |
| Tiếp tục file của người khác? | không (dựng mới `rig/W02_gibbet_crow_rig.blend`) |

## Bộ clip họ W (`SKELETON_STANDARD.md` §5; chỉ liệt kê, làm ở phiên animation)

| State | Cần? | Ghi chú |
| --- | --- | --- |
| `idle` | R | đứng gù, cánh gập rủ như concept, đầu ngó, thỉnh thoảng rũ lông |
| `walk` | R | đi hoặc nhảy trên đất (theo câu hỏi 1); nếu chỉ bay thì `walk` = bay chậm |
| `run` | O | nhảy nhanh nửa vỗ cánh |
| `attack` | R | mổ (cổ + ngực chồm, mỏ há) |
| `attack2` | O | bổ nhào mổ (canon: "bổ nhào theo đàn, mổ, rút lui rồi quay lại") |
| `cast` | O | kêu (há mỏ, xoè cánh doạ) |
| `hit` | R | |
| `death` | R | |
| `revive` | O | |
| Clip đặc thù | – | `fly` (vòng lặp), `takeoff`, `land`, `wing_display` (xoè cánh doạ): chỉ khi câu hỏi 1 chọn có bay |

## Vùng khó skin (soi ở G2)

1. **Gốc cánh dính sườn**: tấm cánh liền thân từ vai xuống tới z ≈ 0,30 m; gập cánh, vỗ cánh kéo giãn dải này. Cách làm: trộn `chest` ↔
   `L_Wing_01` theo trường điều hoà trên dải gốc cánh, đo độ giãn ở mọi tư thế cánh.
2. **Gập cánh như concept**: cánh là một tấm liền, khuỷu và cổ tay gập làm tấm gấp chồng lên nhau (lông chồng chấp nhận được, rách thì không).
   Dáng gập sẽ là xoay cánh ra sau dọc sườn, rủ xuống, gập vừa ở khuỷu và cổ tay; mép trước dốc lên ~15° nên khi xoay ra sau chóp cánh có thể chìa sau đuôi.
3. **Bay với cánh nằm ngang** (nếu chọn ở câu hỏi 1): phải xoay mặt cánh ~90° quanh trục cánh ở vai; với cánh dính sườn, đây là tư thế
   giãn nặng nhất. Có thể cần thêm `L_WingRoot` (câu hỏi 4).
4. **Lông rời** (47 ruff, 36 trên cánh, lớp đuôi): mỗi mảnh nhận một bộ trọng số lấy ở điểm gốc của nó (lông đi cứng theo da), không bẻ cong
   lông; soi lông cổ xuyên sọ khi quay đầu, lông cánh rời khỏi tấm cánh khi gập.
5. **"Quần" lông** là một phần mesh thân, chân vảy cắm vào trong tới z ≈ 0,20 m: bước dài, ngồi xổm làm "quần" kéo bụng; mép dưới "quần"
   phải theo `L_Calf`, đỉnh giò không lòi ra.
6. **Mỏ**: hàm dưới theo `beak`, khoé miệng kéo giãn khi há; giới hạn há đo ở R5 (dự kiến ~25°).
7. **Ngón chân**: một `L_Toe` gập cả 3 ngón xoè rộng (x 0,06–0,24 m) quanh một trục; ngón ngoài gập lệch.
8. **Lông cánh sát đùi**: lông trong cùng của cánh rủ tới ngang đùi; bước chân hoặc gập cánh có thể đâm vào "quần".

## Rủi ro và điều cần chú ý

- Asset chim đầu tiên của dự án (Agent.md §7: phép thử); chưa có ngưỡng độ giãn cho cánh. Sẽ báo số đo từng tư thế và so với mức của rig
  người đã duyệt (U01: hạ tay 4,3×, đi 3,6×) để người dùng quyết.
- Rig editor của skill chỉ hiểu khớp người (vai, khuỷu, cổ tay, hông, gối…): không dùng được cho cánh, cổ, đuôi của quạ, nên chỉnh khớp qua
  ảnh và số.
- Tư thế bind giữ đúng dáng trưng của GLB (không đổi rest sau khi skin).

## Chỉ tiêu qua cổng

- G2: các mục A1, A2 của `QA_CHECKLIST.md` (A1.11 đo trên sải cánh, xem trên), cộng các vùng khó ở trên. Tư thế thử: gập cánh như concept,
  vỗ cánh hết biên lên/xuống, xoè doạ, mổ (há mỏ), xoay cổ ±60°, bước, nhún bật; thêm bay (cánh ngang, thu chân) nếu câu hỏi 1 chọn có bay.
- G3: các mục B1, B2. G4: các mục C.

## Quyết định G1 (2026-10-26)

1. Di chuyển: **C**, cả trên đất (đứng, đi, nhảy) lẫn bay ngắn khi bổ nhào. Thêm `ctl_L_Wing_flight` (xoay mặt cánh nằm ngang), công tắc
   chân IK theo thân, tư thế thử bay (cánh ngang vỗ lên/xuống, thu chân).
2. Kích thước: **A**, scale ×1,6028 theo sải cánh 0,89H = 1,602 m.
3. Gốc toạ độ giữa hai bàn chân (mesh dời +0,145 m theo Y).
4. Bảng bone họ W (chim) như trên, 32 bone (24 deform); tên cánh `L_Wing_01..03`. Không thêm bone tuỳ chọn.

## Câu hỏi G1 (đã trả lời, giữ để đối chiếu)

1. **Quạ di chuyển thế nào?** A) chỉ trên đất (đi/nhảy, vỗ cánh khi nhảy mổ); B) chủ yếu bay (lượn thấp, cánh ngang, thu chân); C) cả hai:
   đứng/đi/nhảy trên đất và bay ngắn khi bổ nhào **[đề xuất, theo canon]**. B và C thêm `ctl_L_Wing_flight`, công tắc chân theo thân, và tư thế
   thử bay (cánh xoay 90° là vùng rủi ro nhất, xem vùng khó 3).
2. **Kích thước**: A theo sải cánh 0,89H, ×1,6028 **[đề xuất]**; hay B theo "đứng 0,36H" là chiều cao dáng gốc, ×1,3811 (quạ nhỏ hơn 14 %).
3. **Gốc toạ độ** giữa hai bàn chân (mesh dời +0,145 m theo Y) **[đề xuất]**, hay giữ gốc bounds của GLB?
4. **Bảng bone họ W (chim)** như trên (32 bone, 24 deform), duyệt để chép vào `SKELETON_STANDARD.md` §3 "Họ khác"; tên cánh viết hoa
   `L_Wing_01` (ví dụ trong chuẩn ghi `L_wing_01`). Không thêm trừ khi được yêu cầu: `L_WingRoot` (nhún vai/khối cánh choàng, như xương
   đòn; thêm nếu gập cánh hoặc bay làm rách sườn ở G2), xương lông chóp cánh, `L_ToeBack` (ngón sau), xương xoè đuôi trái/phải.

## Duyệt

| Cổng | Ngày | Kết quả | Người duyệt | Ghi chú |
| --- | --- | --- | --- | --- |
| G1 (brief) | 2026-10-26 | duyệt | người dùng | chọn C (đất + bay ngắn); kích thước A, gốc giữa hai chân, bảng bone theo đề xuất |
| G2 (rig) | | chờ | | R2–R5 xong 2026-10-26; A1 14/14; khuyết điểm còn lại ở `qa_report.md` §6 |
| G3 (clip) | | | | phiên animation riêng |
| G4 (trong lab) | | | | |
