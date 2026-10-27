# Rig brief — W07_shroud_spinner

Trạng thái: **G1 duyệt 2026-10-26** (người dùng trả lời "duyệt": nhận cả 5 đề xuất ở mục Câu hỏi G1); R2–R5 xong
(kết quả ở mục cuối và [`qa_report.md`](qa_report.md)); **G2 duyệt 2026-10-27**; **R8 chỉ rig đã xuất** vào `../rig_done/`
(GLB, FBX, textures, bản sao .blend; chưa clip, chưa bản lab). Chỉ rig (R0–R5, dừng ở G2); clip là phiên riêng. Quy trình:
[`Agent.md`](../../../../rig-anim/Agent.md). Chuẩn: [`SKELETON_STANDARD.md`](../../../../rig-anim/SKELETON_STANDARD.md). Khởi điểm bảng
bone: [`rig_v1/BRIEF.md`](../../../_batches/rig_v1/BRIEF.md) §2b (chưa duyệt; đã sửa theo mesh thật ở dưới). Con đầu tiên của họ **A**.

Nhãn: **[đo]** số lấy từ GLB đã scale (script `rig/scripts/w07_*.py`, kết quả `rig/_work/joints.json`, `rig/_work/landmarks.json`,
bảng bone `rig/_work/rig_spec.json`); **[đề xuất]** chờ duyệt ở G1.

Ảnh G1: [`qa/W07_shroud_spinner_G1_proposal.png`](qa/W07_shroud_spinner_G1_proposal.png) (skeleton đề xuất chồng mesh X-ray: trước, bên,
trên, 3/4 + cận đầu, gốc chân, đoạn chân rời), [`qa/W07_shroud_spinner_G1_mesh_notes.png`](qa/W07_shroud_spinner_G1_mesh_notes.png)
(chỗ mesh khác concept).

## Thông tin asset

| Mục | Giá trị |
| --- | --- |
| `asset_id` | `W07_shroud_spinner` |
| Nhóm / loại | quái, họ Warped (Act I: Flint Delvings, Garden of Hush); nhện mộ quấn xác bằng tơ: mạng làm chậm, độc, đẻ túi trứng trong xác. Cần tuỳ chọn cho người sợ nhện (LD §8.4), không ảnh hưởng rig |
| GLB gốc | `W07_shroud_spinner.glb`, 13,4 MB, 10.446 tam giác, 6.425 đỉnh (5.337 sau khi hàn theo vị trí), 1 material, 3 map 4096 (basecolor, normal, rm), sha256 `f06c1063…96b3`; không skin, không vertex group, node không transform. Chỉ đọc |
| Chiều cao thật | đỉnh bụng **0,8H = 1,44 m** (danh mục) [đề xuất, câu hỏi 2] |
| Tư thế gốc | dáng nghỉ trung tính của mẫu họ A: tám chân xoè đều, mũi chân trên một đường đất, thân nằm ngang. Dùng làm tư thế bind |
| Mảnh [đo] | 22 mảnh sau khi hàn: bụng 1.400 đỉnh, đầu ngực 565; mỗi bên: chân 1 + chân 2 **chung một mảnh** 409, chân 3 246, chân 4 318, **đoạn chân rời** 115, chân xúc giác 211, gốc chân xúc giác 222, nanh 64, u mặt 48, 2 mắt 26 + 26 |
| Đối xứng [đo] | các mảnh đối xứng gương qua x = 0; lưới đỉnh không đối xứng từng đỉnh (31 % đỉnh không có đỉnh gương trong 2 mm). Khớp đo riêng hai bên lệch ≤ 0,7 cm (chân), ≤ 0,5 cm (chân xúc giác) → dùng trung bình gương |

### Mesh khác concept / design (ảnh `G1_mesh_notes`)

1. **Hai đoạn chân rời sau bụng** (mỗi bên một, 226 tam giác mỗi đoạn, tổng 452 tam giác / 286 đỉnh): đoạn ống + mũi dài 0,94 m ở
   x ±0,53–0,93, y +0,86…+1,40, mũi chạm đất, đầu trên cắm vào đáy sau bụng, **không nối vào thân**. Nhìn bên và nhìn sau giống cặp chân
   thứ năm; nhìn trên thấy rõ là mảnh lơ lửng. Design có 8 chân. Có lẽ Tripo dựng từ góc BACK của concept (câu hỏi 1).
2. **Chân 1 và chân 2 mỗi bên dính chung một mảnh**, gặp nhau ở một cục gốc dưới mép ức (x ±0,12, y −0,41, z 0,62).
3. **Mỗi chân 4 thanh**, không phải 3 như design: đốt háng (coxa, 0,22–0,36 m, nằm gần ngang, gốc dưới ức) · vòng thắt · đùi (lên tới
   gối cao) · ống (xuống) · vòng khớp · bàn nhọn (chạm đất). Gối không có vòng, là góc gãy 55–66° giữa trục đùi và trục ống.
4. Chân xúc giác (pedipalp, hình chữ V gập trước mặt, mũi vuốt ở z 0,41) **lơ lửng cách đầu ~4 cm**, không chạm mảnh nào.
5. Quả bụng phủ lên lưng sau đầu ngực ~11 cm (mép trước bụng y −0,13, cuối mai đầu ngực y −0,02).
6. Mắt: 4 mảnh (2 mắt lớn trong + 2 mắt nhỏ ngoài); design ghi 2. Không ảnh hưởng rig (cứng theo đầu ngực).

## Kích thước thật và hệ số scale

| Mục | Giá trị |
| --- | --- |
| Cao GLB | 0,50928 (đỉnh bụng) |
| Scale đều | ×2,82754 → cao 1,440 m; GLB đã căn giữa x, y (giữ nguyên), đáy z = 0. Nạp thô (không hàn) để mesh rig khớp từng đỉnh với GLB đã scale; trọng số tính trên bản hàn theo vị trí rồi chép về |
| `k` (so với người 1,8 m) | 0,8 |
| Kích thước sau scale [đo] | sải chân x ±1,413 (2,83 m = 1,57H), y −1,395…+1,395 (2,79 m = 1,55H); bụng tròn bán kính 0,54 m, tâm (0; 0,42; 0,87), đáy bụng z 0,33; mai đầu ngực y −0,77…−0,02, z 0,52–1,09; mắt z 0,85–0,94; mũi nanh z 0,55; mũi vuốt chân xúc giác z 0,41 |
| Đối chiếu danh mục | "~0,8H, sải chân ~1,55H": cao khớp đúng; sải dọc 1,55H khớp, sải ngang 1,57H (+1,3 %) |

## Quyết định rig

| Mục | Lựa chọn | Lý do |
| --- | --- | --- |
| Họ skeleton | **A** (nhiều chân) | 8 chân, đi bằng chân; con A đầu tiên của dự án |
| Route | M: dựng bằng script riêng trong `rig/scripts/` | quái không phải người; skill `blender-character-rigging` không áp dụng (rig_v1 §2b) |
| Công cụ | Blender 5.1.1 chạy nền; `rigbatch` của `rig_v1/tools` (import để render, tô màu, đo giãn; không sửa); numpy; Python 3.11 + PIL cho ảnh | |
| Credit | **0** | không Tripo, Meshy, UniRig |
| Trọng số | khoảng cách tới đoạn xương + làm mịn Laplace trên mesh đã hàn, theo mảnh (mục Skin) | Automatic Weights hỏng trên mesh Tripo |
| Bone ngón | không | |
| Bone phụ | 2 chân xúc giác × 2 đốt; không vải (dải tơ là mặt bụng) | |
| Bone mặt | không (mắt, u mặt cứng theo `cephalothorax`) | |
| Socket vũ khí | không | không cầm vũ khí |
| Socket VFX | `ground`, `hit_origin`, `fx_head`, `fx_abdomen`, `fx_spinneret` | cắn, độc, túi trứng, tơ làm chậm |
| Vật phụ rời | không (đoạn chân rời: câu hỏi 1) | |

### Bảng bone runtime [đề xuất]: 48 bone, 41 deform

Vị trí (m, Blender: Z lên, con quái nhìn về −Y, +X là bên trái của nó) đo trên mesh đã scale [đo]; bên phải là ảnh gương (x → −x).
Khớp chân lấy từ **cụm đỉnh ở vòng khớp**: chân là lăng trụ ít đỉnh, đỉnh chỉ dồn ở vòng đầu đốt, nên cụm đỉnh lớn (≥ 30) theo khoảng
cách trắc địa từ mũi chân chính là vòng háng–đùi, gối, vòng khớp; gối tinh chỉnh bằng giao trục đùi và ống. Đốt chân: `_01` háng
(coxa), `_02` đùi (femur), `_03` ống (tibia), `_04` bàn nhọn (tarsus) — cùng nghĩa với W04.

| Bone | Cha | Đầu → đuôi | Phủ vùng |
| --- | --- | --- | --- |
| `root` | – | (0, 0, 0) ↑ | không trọng số, kéo cả skeleton |
| `cog` | `root` | tâm vùng gốc chân (0, −0,357, 0,70) ↑ | không trọng số: nâng, hạ, nghiêng, dịch cả thân |
| `cephalothorax` | `cog` | (0, −0,357, 0,70) → (0, −0,717, 0,78) | mai đầu ngực + ức, 4 mắt, 2 u mặt, 2 gốc chân xúc giác (cứng), cục gốc chung của chân 1–2 |
| `abdomen_01` | `cephalothorax` | cuối đầu ngực (0, −0,067, 0,761) → tâm bụng (0, 0,421, 0,869) | cả quả bụng và dải tơ; xoay quanh cuối đầu ngực (cuống bụng) |
| `abdomen_02` | `abdomen_01` | (0, 0,730, 0,683) → mũi núm tơ (0, 0,984, 0,531) | chỏm sau-dưới quanh núm tơ (chuyển dần từ `abdomen_01`), để chĩa núm tơ |
| `L_fang` | `cephalothorax` | gốc (0,067, −0,646, 0,785) → mũi (0,004, −0,641, 0,549) | nanh trái (mảnh rời, cứng); hai mũi nanh cách nhau 4 mm |
| `L_Palp_01` | `cephalothorax` | gốc (0,241, −0,582, 0,624) → khớp đỉnh (0,218, −0,765, 0,843) | đốt trong chân xúc giác |
| `L_Palp_02` | `L_Palp_01` | khớp đỉnh → mũi vuốt (0,163, −1,018, 0,410) | đốt ngoài + vuốt (vuốt cứng theo đốt) |
| `L_Leg1_01..04` | `cephalothorax` → chuỗi | gốc (0,120, −0,410, 0,620) → háng (0,375, −0,657, 0,661) → gối (0,594, −0,882, 0,756) → vòng (0,831, −1,172, 0,463) → mũi (0,944, −1,395, 0,007) | chân trước; dài 0,357 / 0,328 / 0,475 / 0,520 |
| `L_Leg2_01..04` | `cephalothorax` → chuỗi | gốc chung với Leg1 → háng (0,398, −0,447, 0,649) → gối (0,658, −0,491, 0,890) → vòng (1,114, −0,599, 0,684) → mũi (1,412, −0,677, 0,018) | dài 0,281 / 0,358 / 0,511 / 0,734 |
| `L_Leg3_01..04` | `cephalothorax` → chuỗi | gốc (0,145, −0,332, 0,591) → háng (0,413, −0,307, 0,675) → gối (0,916, −0,239, 0,822) → vòng (1,204, −0,157, 0,508) → mũi (1,406, −0,082, 0,024) | dài 0,282 / 0,529 / 0,434 / 0,530 |
| `L_Leg4_01..04` | `cephalothorax` → chuỗi | gốc (0,164, −0,250, 0,556) → háng (0,335, −0,168, 0,660) → gối (0,751, 0,081, 0,942) → vòng (1,107, 0,441, 0,631) → mũi (1,390, 0,717, 0,001) | chân sau; dài 0,217 / 0,560 / 0,594 / 0,743 |
| `ground` | `root` | (0, 0, 0) | socket: bóng, vòng chọn |
| `hit_origin` | `cephalothorax` | trước nanh (0, −0,968, 0,667), trỏ tới trước | socket: điểm cắn trúng |
| `fx_head` | `cephalothorax` | giữa hai mắt lớn (0, −0,674, 0,909) | socket |
| `fx_abdomen` | `abdomen_01` | tâm bụng | socket: độc, túi trứng |
| `fx_spinneret` | `abdomen_02` | mũi núm tơ, trỏ ra sau-xuống | socket: tơ làm chậm |

Roll (giống W04): chân và chân xúc giác có trục X local là trục bản lề (pháp tuyến mặt phẳng chân); xoay +X = cong chân xuống / vào
trong ở mọi khớp (gập gối, gập vòng khớp), cả hai bên (bên phải là gương X của Blender). Thân và bụng có X local ≈ trục X thế giới
(xoay X = cúi / ngửa). `root`, `cog`, `ground` hướng lên, không xoay (đơn vị trong glTF).

### Rig điều khiển [đề xuất] (armature `W07_shroud_spinner_Control`, bone `ctl_*`, chỉ ở `.blend`, không xuất)

| Control | Việc |
| --- | --- |
| `ctl_root` | dưới đất, kéo cả con |
| `ctl_cog` | **nâng hạ thân**: hạ sát đất, nhấp nhô, nghiêng, chồm; bàn chân IK đứng yên khi thân di chuyển |
| FK `ctl_<bone>` cho mọi bone deform | `ctl_cephalothorax`, `ctl_abdomen_01..02`, `ctl_L/R_fang`, `ctl_L/R_Palp_01..02`, `ctl_L/R_Leg1..4_01..04` |
| IK 8 chân | `ctl_L_Leg1_IK`: control tiếp xúc ở mũi chân (con của `ctl_root`), xoay quanh mũi chân; IK 2 đốt đùi–ống (`_02`, `_03`) nhắm vòng khớp `ctl_L_Leg1_ankle` (con của `ctl_L_Leg1_IK`, ẩn); đốt bàn `_04` Damped Track tới mũi; pole `ctl_L_Leg1_pole` trên-ngoài gối (con của `ctl_cog`); đốt háng `_01` FK để vung chân. Công tắc `ik_leg_L1` … `ik_leg_R4` (1 = IK, mặc định) |

Skeleton runtime theo rig điều khiển bằng Copy Transforms (thế giới → thế giới), như D01. Pole angle dò để tư thế nghỉ không xoay
(như D01). 67 bone điều khiển: 41 FK + `ctl_root`, `ctl_cog` + 8 IK + 8 ankle + 8 pole.

### Đặt tên dùng chung với P03 Hush-Moths và W04 Mire-Sucker

Đọc lúc viết (2026-10-26, ~22:4x): cả hai đã có `rig_brief.md`, đều chờ G1.

- **Trùng:** `root`, `cog`, `abdomen_01`, chân `L/R_Leg<n>_<đốt>` (n = cặp chân trước → sau, đốt đánh số từ thân ra), control
  `ctl_<side>_Leg<n>_IK`, `ctl_<side>_Leg<n>_pole`, socket `ground`, `hit_origin`, `fx_head`, `fx_abdomen` (W04); roll chân X = bản lề,
  +X = gập, cả hai bên (W04). Công tắc IK từng chân `ik_leg_L1` như W04 (P03 dùng một thuộc tính `leg_ik`).
- **Số đốt chân:** W07 **4 đốt, cùng nghĩa với W04** (`_01` háng, `_02` đùi, `_03` ống, `_04` bàn). **P03 đề xuất 3 đốt** (`_01` = háng +
  đùi): cùng tên `L_Leg1_02` là đùi ở W04/W07 nhưng ống chân ở P03. Clip chân không dùng chéo giữa nhện và bướm (khác số chân, tỉ lệ), nên
  không vỡ gì; chỉ cần ghi "số đốt theo loài" vào chuẩn (P03 đã đề xuất câu này). Lệch này nêu ở câu hỏi 3, không sửa phần của P03.
- **Khác:** W07 không có `thorax` / `head` riêng mà một `cephalothorax` (đầu ngực liền, giải phẫu nhện); `abdomen_02` của W07 là chỏm
  núm tơ ở giữa (W04 tách hai túi `L/R_abdomen_02..03`, P03 chuỗi `abdomen_01..03`). Thêm `L/R_fang`, `L/R_Palp_01..02`,
  `fx_spinneret`.

## Thông số animation

| Mục | Giá trị |
| --- | --- |
| Trục tiến / trục lên | Blender −Y / +Z; glTF +Z / +Y |
| Đơn vị | mét |
| fps | 24 *(đề xuất)* |
| Loop / root motion | idle, walk (run nếu làm): loop kín, in-place; death không loop |
| Sự kiện gameplay | `hit` ở khung nanh cắm (`hit_origin`, ~45 %); `fx` ở khung phun tơ (`fx_spinneret`); `footstep` tuỳ chọn (8 chân, có thể bỏ) |
| Rig điều khiển | IK chân: có (8, có pole); IK tay: không; control nâng hạ thân `ctl_cog`; control tiếp xúc: 8 mũi chân |
| Giới hạn influence | 4 (glTF) |
| Tiếp tục file của người khác? | không |

## Bộ clip họ A (`SKELETON_STANDARD.md` §5, chỉ liệt kê; làm ở phiên animation)

| State | Cần? | Nguồn dự kiến | Ghi chú |
| --- | --- | --- | --- |
| `idle` | R | keyframe tay trên rig điều khiển | thở bụng, chân xúc giác gõ nhẹ, nanh rung |
| `walk` | R | keyframe tay | dáng đi luân phiên bốn chân một nhóm (L1 R2 L3 R4 ↔ R1 L2 R3 L4), in-place, ghi `stride_m` |
| `run` | O | keyframe tay | cùng dáng, nhanh, thân hạ thấp |
| `attack` | R | keyframe tay | cắn: chồm, giương nanh, cắm; điểm trúng ~45 % |
| `attack2` | O | keyframe tay | quật hai chân trước |
| `cast` | O | keyframe tay | phun tơ làm chậm từ núm tơ (`abdomen_02` chĩa, `fx_spinneret`) |
| `hit` | R | keyframe tay | |
| `death` | R | keyframe tay | lật / co chân dưới bụng, dừng pose cuối |
| `revive` | O | ngược `death` | |
| Clip đặc thù | O | | đẻ túi trứng vào xác, quấn xác bằng tơ (nếu gameplay cần) |

## Skin [đề xuất]

Trọng số tính trên mesh đã hàn theo vị trí (đỉnh nhân đôi ở đường nối UV nhận cùng trọng số, không hở):

1. **Mảnh cứng một bone:** mai đầu ngực, 4 mắt, 2 u mặt, 2 gốc chân xúc giác → `cephalothorax`; nanh → `L/R_fang`.
2. **Chân:** mỗi mảnh chân chỉ nhận bone của chân đó (cộng `cephalothorax` ở cục gốc chung của chân 1–2). Khoảng cách tới đoạn xương,
   vòng thắt và vòng khớp cứng theo đốt phía ngoài, dải chuyển tiếp ~3 cm quanh háng–đùi, gối, vòng khớp; làm mịn Laplace trong mảnh.
   Cục gốc chung cứng theo `cephalothorax`, hai đốt háng chuyển dần sang `L_Leg1_01` / `L_Leg2_01` trong ~8 cm.
3. **Bụng:** `abdomen_01` → `abdomen_02` chuyển dần theo trục núm tơ (chỏm bán kính ~0,25 m quanh núm tơ), làm mịn điều hoà.
4. **Chân xúc giác:** `_01` → `_02` quanh khớp đỉnh (~3 cm).
5. Tối đa 4 ảnh hưởng, chuẩn hoá tổng = 1; không trọng số trên `root`, `cog`, socket.

## Vùng khó skin (soi ở G2)

1. **Gối:** góc gãy không vòng; gập thêm (hạ thân) làm đầu đùi và đầu ống ép vào nhau → đo giãn cạnh, mất thể tích ở hạ thân sát đất.
2. **Cục gốc chung chân 1–2:** chân 1 vung trước, chân 2 vung sau sẽ kéo rách cục gốc → cục gốc cứng theo thân, chuyển tiếp trên đốt háng.
3. **Gốc háng dưới ức:** nhấc đốt háng `_01` lên sẽ cắm vào ức; nhấc chân bằng đùi `_02` (ngoài thân) thì không. Đây là lý do đề xuất 4 đốt.
4. **Bụng – đầu ngực chồng nhau ~11 cm:** ngửa / lắc bụng làm mép trước bụng cắt vào lưng sau mai; đo xuyên ở tư thế lắc bụng.
5. **`abdomen_02` uốn quả bụng bọc tơ:** giữ góc nhỏ, đo giãn dải tơ.
6. **Nanh sát nhau (mũi cách 4 mm), chân xúc giác lơ lửng trước mặt:** giương nanh, giơ chân xúc giác không được xuyên mặt.
7. **Chân 4 đi gần hông bụng** khi vung chân sau ra trước.

## Tư thế thử ở R5 (QA_CHECKLIST A2 cho họ này)

Nhấc từng chân (8 tư thế, nhấc bằng control IK); dáng đi luân phiên bốn chân một nhóm (hai pha); hạ thân sát đất (`ctl_cog` −0,30 m,
bàn chân đứng yên); chồm hai chân trước (thân ngửa ~20°, cặp chân 1 giơ cao ra trước); giương nanh (nanh mở ra ngoài-trước, chân xúc giác
giơ); xoay thân ±25° với bàn chân đứng yên; lắc / ngửa bụng và chĩa núm tơ. Mỗi tư thế: độ giãn cạnh lớn nhất, số cạnh xấu, sai số mũi
chân so với control IK, xuyên (chân vào thân, bụng vào mai); ảnh ba góc.

## Rủi ro và điều cần chú ý

- Con A đầu tiên: bảng bone này thành chuẩn họ A khi G1 duyệt (chép vào `SKELETON_STANDARD.md` §3).
- Mesh lăng trụ ít đỉnh: thanh dài không có đỉnh giữa, mọi biến dạng dồn vào vòng khớp. Chuyển tiếp phải nằm trong vòng khớp, không trải
  dọc thanh.
- Không sửa GLB gốc. Nếu duyệt xoá đoạn chân rời (câu hỏi 1), mesh rig = GLB đã scale trừ 2 mảnh đó (452 tam giác, 286 đỉnh), ghi trong
  `validation.json` (A1.9 so trên phần còn lại).
- Chân xúc giác và nanh không chạm đầu: chúng chỉ treo theo bone, không có đường nối để hở.

## Câu hỏi G1 (cần người dùng chốt)

1. **Hai đoạn chân rời sau bụng:** **xoá khỏi mesh rig** (đề xuất: design 8 chân, đoạn rời không nối thân, nhìn từ trên thấy lơ lửng);
   hay giữ và rig như cặp chân thứ năm `L/R_Leg5_03..04` (ống + bàn, con của `abdomen_01`, có IK như chân khác; 52 bone). Gắn cứng vào
   bụng thì chúng trượt trên đất khi đi, nên không đề xuất.
2. **Kích thước:** cao 1,44 m (0,8H danh mục, đề xuất; sải 1,57H × 1,55H) hay số khác.
3. **Chân 4 đốt** như mesh và W04 (đề xuất; 48 bone) hay 3 đốt như rig_v1 §2b và P03 (`_01` = háng + đùi, 40 bone; đốt háng nghiêng
   theo đùi và cắm vào ức khi nhấc chân). Nếu 4 đốt: nghĩa `L_Leg<n>_02` khác P03 (đùi ở đây, ống ở P03), ghi "số đốt theo loài" vào chuẩn.
4. **Chân xúc giác:** thêm `L/R_Palp_01..02` (đề xuất; mảnh lớn trước mặt, cần cho giương nanh và cắn) hay gắn cứng vào `cephalothorax`.
5. **Bụng:** `abdomen_01` cả quả bụng + `abdomen_02` chỏm núm tơ (đề xuất) hay `abdomen_02` phủ cả nửa sau bụng (bụng uốn nhiều hơn).

## Kết quả R2–R5 (2026-10-26) — G2 duyệt 2026-10-27

Chi tiết: [`qa_report.md`](qa_report.md), [`validation.json`](validation.json), ảnh `qa/W07_shroud_spinner_G2_1..5.png`, nguồn
[`W07_shroud_spinner_rig.blend`](W07_shroud_spinner_rig.blend). Dựng lại từ GLB: `rig/scripts/w07_build.py` rồi `w07_qa.py`.

| Mục brief | Thực tế đã dựng và đo |
| --- | --- |
| Mesh rig | GLB ×2,82754, bỏ 2 đoạn chân rời → 6.139 đỉnh / 9.994 tam giác; `src_index` giữ chỉ số đỉnh GLB |
| Bone | 48 runtime (41 deform) đúng bảng G1; rig điều khiển 67 `ctl_*`, pole angle −90° cả 8 chân, rest lệch 6,4e-6 |
| Trọng số | tối đa **2** ảnh hưởng mỗi đỉnh. Chuyển tiếp qua mặt phân giác khớp, nửa rộng háng 5 cm, gối 4,5, vòng khớp 3,5, chân xúc giác 6; Laplace riêng từng khớp. Cục gốc chung chân 1+2 theo thân trong 6–16 cm. Chỏm `abdomen_02` 15°→45° (thử 32°→62°: dải tơ giãn hơn) |
| A1 | **14/14 đạt** (đo trong Blender; ma trận bind của file glTF kiểm ở R8) |
| Tư thế thử | đi pha A/B 1,62/1,46×; hạ thân −0,30 m 1,62×, mũi chân đứng yên; chồm 2,31×; giương nanh 2,69×; xoay thân ±20° ≤ 1,48×; bụng 1,40× (mức cực 1,87×); nhấc từng chân 1,52–2,68×. Mũi chân theo control lệch ≤ 0,001 mm; khe đường nối 0 |
| Còn lại | bụng chồng mai từ mesh gốc (sâu 70 mm lúc nghỉ, ngửa bụng ±10°); `abdomen_02` ở góc nhỏ (≤ ~12°); đỉnh chân xúc giác khi mở 45°; mép trong háng chân 2 khi nhấc rất cao. Xem `qa_report.md` mục 5 |

## Chỉ tiêu qua cổng

- G2: QA_CHECKLIST A1 (14 mục, `rig/validation.json`; các mục chỉ đo được trên GLB như ma trận bind trong file, reimport, byte
  texture sẽ đo trên dữ liệu Blender tương đương vì lượt này không export) + A2 (skeleton chồng mesh ba góc, bản đồ trọng số, tư thế
  thử ở trên, vùng khó, socket).
- G3: B1, B2 (phiên animation).
- G4: C.

## Duyệt

| Cổng | Ngày | Kết quả | Người duyệt | Ghi chú |
| --- | --- | --- | --- | --- |
| G1 (brief) | 2026-10-26 | **duyệt** | người dùng ("duyệt") | nhận cả 5 đề xuất: xoá 2 đoạn chân rời khỏi mesh rig; cao 1,44 m; chân 4 đốt; thêm `L/R_Palp_01..02`; `abdomen_02` chỉ chỏm núm tơ. Bảng bone chép vào `SKELETON_STANDARD.md` §3 (Họ A) |
| G2 (rig) | 2026-10-27 | **duyệt** | người dùng (xem trong Blender, rồi "done, export đi") | rig như `qa_report.md`; xuất chỉ rig (R8, chưa clip) vào `../rig_done/`, reimport GLB/FBX đạt (`rig.log`) |
| G3 (clip) | | | | |
| G4 (trong lab) | | | | |
| R9 (tích hợp engine, nếu có) | | | | |
