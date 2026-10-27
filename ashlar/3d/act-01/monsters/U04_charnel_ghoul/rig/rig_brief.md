# Rig brief — U04_charnel_ghoul

Trạng thái: **G1 duyệt 2026-10-26** (người dùng trả lời "duyệt": nhận cả bốn đề xuất: Qh = lõi H + `L/R_Finger`, scale A, cổ 2 đoạn,
áo 6 chuỗi + dây). **R2–R5 xong, chờ G2**: xem mục "Kết quả R2–R5" cuối file và [`qa_report.md`](qa_report.md). 0 credit, GLB gốc không bị sửa.
Quy trình: [`Agent.md`](../../../../rig-anim/Agent.md). Chuẩn: [`SKELETON_STANDARD.md`](../../../../rig-anim/SKELETON_STANDARD.md).
Lô: [`_batches/rig_v1/BRIEF.md`](../../../_batches/rig_v1/BRIEF.md) §2b (bảng bone đề xuất, chưa duyệt). Ảnh đề xuất:
[`qa/U04_charnel_ghoul_G1_proposal.png`](qa/U04_charnel_ghoul_G1_proposal.png).

Nhãn: **[đo]** = số lấy từ GLB (script `scripts/u04_r1_probe.py`, `u04_r1_cloth.py`, `u04_r1_propose.py`; kết quả ở `_work/r1_*.json`);
**[suy luận]** = rút ra từ số đo hoặc ảnh, chưa kiểm bằng rig; **[đề xuất]** = chờ duyệt ở G1.

## Thông tin asset

| Mục | Giá trị |
| --- | --- |
| `asset_id` | `U04_charnel_ghoul` |
| Nhóm / loại | quái |
| Họ quái ASHLAR | Unlaid (ghoul gầy sống dậy từ mồ; nhanh, nhảy vồ, ăn xác hồi máu) |
| GLB gốc | `U04_charnel_ghoul.glb` [đo] 16.598.592 byte, sha256 `49f607df0428a806e5bff22fb9c30cbf2b50395911939b184b4e228397fc5c4f`; 1 mesh, 1 material, 3 map 4096 (base JPEG, normal JPEG, MR PNG); 9.932 tam giác; không skin, không vertex group |
| Mảnh rời [đo] | 18 mảnh sau khi hàn: **thân** 3.806 đỉnh (gồm đầu, hàm, khoang miệng, tay, chân), **áo liệm** 1.028, **mũ trùm** 309, **dây buộc cổ** 188, **14 răng nanh** rời (13–16 đỉnh; 6 hàm trên, 8 hàm dưới). Importer hàn còn 5.545 đỉnh; 21 cặp đỉnh trùng vị trí khác pháp tuyến (phải chung trọng số để không nứt) |
| Kích thước Tripo [đo] | cao 0,9897 (đỉnh mũ trùm), dài 0,9995 (mõm trên → gót sau), rộng 0,7505; mặt nhìn −Y (Blender), chỉ móng tay chạm z = 0 |
| Chiều cao thật (danh mục) | "đỉnh đầu 0,65H, thân dài 1,25H": mesh **không** thoả cả hai (xem mục Kích thước) |
| Tư thế gốc | đứng nghỉ bốn chi (Qh): tay thẳng đứng dưới vai, bàn tay úp, ngón xoè ra trước; chân sau: đùi chéo về sau xuống **gối chỉ về sau**, ống chân thẳng đứng, bàn chân dài ngón ra trước; cổ dài vươn trước–lên; **hàm há rất rộng** |
| Lỗi đã biết của mesh [đo] | (1) **bàn chân sau lơ lửng**: điểm thấp nhất của chân sau ở z 0,055–0,065 Tripo (≈ 7 cm ở scale A); (2) hàm há ~100° ở rest (hàm trên ngóc 39°, hàm dưới chúi 63°), đóng hết không thể không méo; (3) gối gập ngược so với người (đúng thiết kế); (4) áo liệm một lớp, có lỗ thủng, ôm sát lưng |

## Quyết định rig

| Mục | Lựa chọn [đề xuất] | Lý do |
| --- | --- | --- |
| Họ skeleton | **Qh** = bộ lõi H (28 bone, tên và phân cấp giữ nguyên) + `L/R_Finger`; rest = tư thế đứng bốn chi của mesh; bộ clip theo cột Q của `SKELETON_STANDARD.md` §5 | thân người (xương đòn, khuỷu, cổ tay, đầu gối) đi bốn chi; giữ tên H thì retarget được clip bò humanoid làm điểm xuất phát và **dùng chung skeleton với P04** (cùng tên, phân cấp, quy ước trục). Phương án Q (bộ tên của B01: `L_Scapula`, `neck_01..02`, …) không chọn: không có xương xoắn, đổi tên vô ích cho thân người |
| Route | **M** (dựng bằng script Blender nền theo landmark đo trên mesh) | skill `blender-character-rigging` chỉ cho dáng người T-pose; A tốn credit |
| Công cụ | Blender 5.1.1 nền (`--factory-startup`); trọng số = khoảng cách tới đoạn xương + làm mịn Laplace trên mesh đã hàn; phần cứng một bone; render QA bằng `rig_v1/tools/rigbatch.py` (import, không sửa) | theo rig_v1 §2b; bone heat của Blender hỏng trên mesh Tripo |
| Ước tính credit | **0** | không Tripo, Meshy, UniRig |
| Bone ngón tay | **một bone `L_Finger` mỗi tay** (cả 5 ngón) | tay là chân trước: khi chạy lòng tay nhấc lên còn ngón bám đất, như `Toe` của chân. Không bone từng ngón |
| Bone phụ | `neck_02`, `jaw`, `tie_01..02`, áo 6 chuỗi × 2 | xem bảng bone |
| Bone mặt | chỉ `jaw` | hàm há là nhận diện của con này |
| Socket vũ khí | **không** | không cầm gì; đánh bằng vuốt và cắn |
| Socket VFX | `fx_head`, `fx_mouth`, `fx_chest`, `fx_hand_L`, `fx_hand_R`, `hit_origin`, `ground` | `fx_mouth` (mới) cho đòn cắn |
| Vật phụ rời | không. Mũ trùm, áo, dây, răng là mảnh rời trong cùng mesh: **giữ một mesh, một skin** | |

### Bảng bone runtime (scale A, mét, toạ độ Blender: +X trái quái, +Y sau, +Z lên) [đề xuất]

Khớp = đầu bone. Bên phải (`R_*`) là gương của bên trái qua x = 0.

| Bone | Cha | Khớp (x; y; z) | Dài | Loại | Deform | Vùng phủ |
| --- | --- | --- | --- | --- | --- | --- |
| `root` | – | (0; 0; 0) | 0,236 | lõi H | không | gốc, sàn |
| `cog` | `root` | (0; 0,077; 0,808) | 0,177 | lõi H | không | giữa thân (giữa hông và vai): xoay, nhấc cả thân |
| `pelvis` | `cog` | (0; 0,236; 0,774) | 0,108 | lõi H | có | hông, mông, gốc đùi; mép áo trên mông |
| `spine_01` | `pelvis` | (0; 0,130; 0,794) | 0,108 | lõi H | có | bụng, thắt lưng |
| `spine_02` | `spine_01` | (0; 0,024; 0,816) | 0,110 | lõi H | có | sườn, lưng giữa |
| `chest` | `spine_02` | (0; −0,083; 0,842) | 0,116 | lõi H | có | lồng ngực, u vai giữa, áo phủ lưng trên |
| `neck` | `chest` | (0; −0,189; 0,889) | 0,120 | lõi H | có | nửa dưới cổ, vòng dây quanh gốc cổ |
| `neck_02` | `neck` | (0; −0,290; 0,955) | 0,122 | phụ U04 | có | nửa trên cổ, họng, vạt mũ trùm sau gáy |
| `head` | `neck_02` | (0; −0,390; 1,024) | 0,150 | lõi H | có | sọ, hàm trên, vòm miệng, mũ trùm, 6 răng trên. Bone đi từ khớp đầu **lên đỉnh sọ** như H (sau G1, theo P04, để xoay ngang đầu cùng trục giữa hai con) |
| `jaw` | `head` | (0; −0,426; 0,952) | 0,225 | phụ U04 | có | hàm dưới, đáy khoang miệng, 8 răng dưới; khoé miệng chia với `head` |
| `L_Clavicle` | `chest` | (0,035; −0,201; 0,845) | 0,164 | lõi H | có | u vai, nách trên |
| `L_UpperArm` | `L_Clavicle` | (0,187; −0,144; 0,816) | 0,317 | lõi H | có | cánh tay trên |
| `L_UpperArm_twist` | `L_UpperArm` | (0,187; −0,144; 0,816) | 0,159 | lõi H | có | nửa trên cánh tay (xoắn) |
| `L_ForeArm` | `L_UpperArm` | (0,266; −0,142; 0,508) | 0,366 | lõi H | có | khuỷu (chỉ về sau), cẳng tay |
| `L_ForeArm_twist` | `L_ForeArm` | (0,282; −0,170; 0,328) | 0,183 | lõi H | có | nửa dưới cẳng tay (xoắn) |
| `L_Hand` | `L_ForeArm` | (0,298; −0,199; 0,148) | 0,124 | lõi H | có | cổ tay, lòng và mu bàn tay |
| `L_Finger` | `L_Hand` | (0,310; −0,290; 0,065) | 0,110 | Qh chung | có | 5 ngón và móng |
| `L_Thigh` | `pelvis` | (0,130; 0,236; 0,721) | 0,438 | lõi H | có | đùi |
| `L_Calf` | `L_Thigh` | (0,199; 0,485; 0,366) | 0,235 | lõi H | có | gối (chỉ về sau), ống chân |
| `L_Foot` | `L_Calf` | (0,171; 0,520; 0,136) | 0,082 | lõi H | có | cổ chân, gót, mu bàn chân |
| `L_Toe` | `L_Foot` | (0,189; 0,447; 0,104) | 0,132 | lõi H | có | ngón chân, móng |
| `tie_01`, `tie_02` | `neck`, `tie_01` | (0; −0,295; 0,715) | 0,083 + 0,079 | phụ U04 | có | hai đầu dây đỏ buông trên ngực (nút theo `neck`) |
| `smock_front_01/02` | `chest` | (0; −0,242; 0,757) | 0,133 × 2 | áo | có | vạt ngực giữa hai tay |
| `L_smock_shoulder_01/02` | `L_Clavicle` | (0,254; −0,083; 0,780) | 0,148 × 2 | áo | có | vạt vai: phủ vai, rủ xuống sườn ngay sau cánh tay |
| `L_smock_flank_01/02` | `spine_01` | (0,201; 0,089; 0,709) | 0,129 × 2 | áo | có | vạt sườn sau, rủ dưới sườn và bụng |
| `smock_back_01/02` | `pelvis` | (0; 0,355; 0,757) | 0,198 × 2 | áo | có | vạt mông, rủ sau đùi |
| `ground`, `hit_origin` | `root` | (0; 0; 0), (0; −0,632; 0,851) | | socket | không | bóng, vòng chọn; điểm phát đòn trước mõm |
| `fx_chest`, `fx_head`, `fx_mouth` | `chest`, `head`, `head` | trước ngực; đỉnh mũ; trong khoang miệng | | socket | không | VFX |
| `fx_hand_L`, `fx_hand_R` | `L_Hand`, `R_Hand` | giữa lòng bàn tay | | socket | không | vệt vuốt |

**Tổng [đo trên bản dựng thử]: 53 bone runtime = 44 deform** (lõi H 26 + `L/R_Finger` 2 + `neck_02`, `jaw` + `tie` 2 + áo 12)
**+ `root`, `cog` + 7 socket.** Áo trên lưng (không treo) không có bone riêng: bám da theo trọng số của đỉnh thân gần nhất.

### Quy ước trục và roll (Qh, P04 dùng cùng)

- `pelvis → spine_01 → spine_02 → chest → neck → (neck_02)` chạy **từ hông về phía đầu** (thân nằm ngang nên các bone này chỉ về
  trước–lên, không chỉ lên như H); `head` đi từ khớp đầu lên đỉnh sọ như H (chốt sau G1, cùng P04). Tay và chân chỉ xuống theo chi;
  `Hand`, `Finger`, `Foot`, `Toe` chỉ ra trước.
- **Trục X cục bộ của mọi bone (trừ `Clavicle`) song song +X thế giới** (bên trái con quái), hai bên như nhau; vậy gập/duỗi trong mặt phẳng
  dọc (phi, vồ, ngẩng đầu, há hàm, gập gối, khuỷu) là xoay quanh X. `Clavicle` (nằm ngang theo X) giữ Z hướng lên. Quy tắc này trùng với
  trục mà Blender sinh ra khi đối xứng (symmetrize) nên clip lật trái–phải được.
- `cog` đặt giữa thân, trên đường sống; twist đặt như skill (`UpperArm_twist` từ vai tới giữa cánh tay, `ForeArm_twist` từ giữa cẳng tay
  tới cổ tay).

### Rig điều khiển (`ctl_*`, chỉ trong `.blend`, không xuất) [đề xuất]

Như D01: hai armature trong file nguồn, `U04_control` (animator) và `U04_runtime` (skeleton xuất); runtime bám control bằng Copy Transforms
(thế giới → thế giới), rest trùng tuyệt đối; mesh biến dạng theo runtime.

| Nhóm | Control |
| --- | --- |
| Gốc | `ctl_root` (sàn, kéo cả con), `ctl_cog` (cả thân quanh giữa thân) |
| FK | `ctl_<bone>` cho mọi bone deform: thân, cổ 2 đoạn, đầu, `ctl_jaw` (giới hạn: há thêm +20°, đóng tới mức răng chạm, đo ở R5), tay, chân, dây, 6 chuỗi áo |
| Chân sau | IK 2 đốt (đùi + ống chân) tới `ctl_L_Foot_IK` (con `ctl_root`), pole `ctl_L_Knee_pole` **sau gối**, gập gối một chiều; tiếp xúc: `ctl_L_Heel_roll`, `ctl_L_Ball_roll` (nhấc gót quanh gốc ngón), `ctl_L_Toe_roll` |
| Tay (chân trước) | IK 2 đốt (cánh tay + cẳng tay) tới `ctl_L_Hand_IK` (con `ctl_root`: tay là chân chạm đất), pole `ctl_L_Elbow_pole` **sau khuỷu**; tiếp xúc: `ctl_L_Palm_roll` (nhấc lòng tay quanh khớp ngón, ngón bám đất), `ctl_L_Fingertip_roll` |
| Công tắc | thuộc tính `ik_arm_L/R`, `ik_leg_L/R` trên `U04_control` (1 = IK, 0 = FK) |
| Xoắn | `*_twist` runtime nhận 50 % góc xoắn dọc trục (cổ tay → `ForeArm_twist`; khử ~50 % ở `UpperArm_twist`); bake vào clip ở R8 |

Vải (6 chuỗi áo, dây) là FK; mô phỏng lắc (spring bone) để engine làm như U01/F01, ngoài phạm vi lượt này.

## Kích thước thật và scale (chốt ở G1)

Rig ở kích thước thật ngay từ đầu (quyết định G1 lô rig_v1); scale đều quanh gốc, GLB gốc chỉ đọc. Hai lựa chọn [đo trên mesh đã scale]:

| | **A — theo danh mục (đề xuất)** | B — theo bóng H của concept |
| --- | --- | --- |
| Hệ số (m / đơn vị Tripo) | 1,1822 | 1,4550 |
| Đỉnh mũ trùm | **1,17 m = 0,65H** | 1,44 m = 0,80H |
| Đỉnh u vai (lưng) | 0,99 m = 0,55H | 1,22 m = 0,68H |
| Mõm → mông | 0,92 m = 0,51H | 1,13 m = 0,63H |
| Mõm → gót sau | 1,18 m = 0,66H | 1,45 m = 0,81H |
| Tay (vai → đầu ngón) | 0,92 m (dài hơn tay người ~0,76 m) | 1,13 m |
| Đùi / ống chân | 0,44 / 0,24 m | 0,54 / 0,29 m |

A khớp cả hai vạch "head top 0,65H" và "back 0,55H" trên concept và cột Kích thước thật của danh mục; thân cỡ người, tay rất dài như thiết kế.
B khớp hình vẽ đo theo bóng H (`brief.md`: đỉnh đầu 0,80–0,82H) và `design.txt`. **Không lựa chọn nào cho "thân dài 1,25H"**: mesh đứng
gọn (mõm → gót chỉ bằng 1,01 lần chiều cao); vạch 1,25H của concept đo dáng chạy dạng rộng. Nếu chọn B thì danh mục cần sửa (việc của người
dùng, thread này không sửa `ashlar/3d/README.md`).

## Thông số animation (theo `blender-game-animation`)

| Mục | Giá trị |
| --- | --- |
| Trục tiến / trục lên | glTF +Z tiến / +Y lên (Blender −Y tiến, xuất "+Y Up"); trái quái ở +X |
| Đơn vị | mét, scale A hoặc B ở trên |
| fps | 24 *(đề xuất)* |
| Loop / root motion | `idle`, `walk`, `run` loop kín, tại chỗ, ghi `stride_m`; `death` không loop; không root motion |
| Sự kiện gameplay | `footstep` × 4 chi (`walk`, `run`); `hit` của `attack` (hàm sập) ở 40–50 %; `fx` cắn ở `fx_mouth`; vuốt ở `fx_hand_*` (`attack2`) |
| Tham chiếu | chưa có; R6 ghi vào `rig/anim/refs/` |
| Rig điều khiển | IK chân: có · IK tay: có (tay là chân trước) · control tiếp xúc: có (gót, bóng, mũi chân; lòng tay, đầu ngón) |
| Giới hạn influence | 4 (glTF), tổng 1 |
| Tiếp tục file của người khác? | không |

## Bộ clip (chỉ liệt kê, theo cột Q của `SKELETON_STANDARD.md` §5)

| State | Cần? | Nguồn dự kiến | Dùng lại từ | Ghi chú |
| --- | --- | --- | --- | --- |
| `idle` | R | keyframe tay | – | thở, đầu lắc, hàm mấp máy |
| `walk` | R | keyframe tay (có thể khởi từ clip bò humanoid nếu thư viện CC0 có; chưa kiểm) | P04 nếu cùng skeleton | đi bốn chi, nhịp chéo |
| `run` | R | keyframe tay | – | phi bốn chi |
| `attack` | R | keyframe tay | – | vồ + cắn; điểm trúng lúc hàm sập |
| `attack2` | O | keyframe tay | – | cào một tay |
| `cast`, `block`, `blockHit`, `jump`, `dodge` | – | – | – | không thuộc họ Q |
| `hit` | R | keyframe tay | – | giật lùi, đầu hất |
| `death` | R | keyframe tay | – | đổ nghiêng, dừng pose cuối |
| `revive` | O | keyframe tay | – | bò dậy (sống lại từ mồ) |
| Clip đặc thù | O | keyframe tay | – | `eat` (cúi ăn xác hồi máu, theo canon) |

## Rủi ro và vùng khó skin

- **Hàm và khoang miệng**: khoé miệng chia `head`/`jaw`, họng sau khoang chia `head`/`jaw`/`neck_02`; răng cứng (6 trên theo `head`, 8 dưới theo
  `jaw`). Rest há ~100°: đóng 50 % thử được, đóng hết sẽ chạm răng và kéo khoé miệng; R5 đo góc đóng tối đa còn sạch và ghi vào giới hạn `ctl_jaw`.
- **Mũ trùm**: cứng theo `head`; vạt sau gáy chuyển dần sang `neck_02`; hai vạt bên má rủ ngoài hàm (x ±0,10 so với hàm ±0,05 Tripo) nên khi đóng
  hàm, hàm đi vào trong vạt [suy luận, kiểm ở R5].
- **Cổ dài 2 đoạn** (0,24 m ở A): ngẩng/cúi đầu; vòng dây quanh gốc cổ theo `neck`, nút và hai đầu dây theo `tie_*`.
- **Vai dưới áo**: khớp vai sâu trong u vai phủ áo; khi phi tay vung mạnh, vạt vai và vạt ngực dễ xuyên cánh tay.
- **Áo một lớp ôm lưng**: phần nằm trên lưng lấy đúng trọng số của da ngay dưới (không xuyên khi lưng gập); phần treo theo chuỗi. Lỗ thủng
  trên lưng không ảnh hưởng.
- **Hông dưới vạt mông**: đùi đẩy về sau khi phi va vào vạt mông.
- **Gối chỉ về sau**, ống chân ngắn: IK gối ngược, pole sau gối; đo độ giãn ở gối khi gập sâu.
- **Bàn tay to, 5 ngón xoè**: một bone ngón đủ cho nhấc lòng tay, không gập từng ngón.
- **Chân sau lơ lửng ~7 cm** ở rest: rest không đổi; clip phải hạ thân hoặc duỗi chân để bàn chân chạm đất (IK làm được).
- **Dùng chung với P04**: P04 bò trên tay và gối (rest khác), nên clip chung cần retarget theo tên; bảng bone lõi, `L/R_Finger` và quy ước trục ở
  trên phải trùng giữa hai con. Lệch tên sẽ nêu ở cổng duyệt.

## Kiểm ở R4–R5 (để G2)

- R4 `validation.json`: A1.1–A1.14 của `QA_CHECKLIST.md` (A1.9, A1.10 kiểm trên mesh trong `.blend` so với GLB đã scale vì lượt này không xuất
  GLB), cộng: rest của runtime trùng control, IK chân/tay về đúng rest khi bật, trọng số đỉnh trùng vị trí bằng nhau.
- R5 ảnh: skeleton chồng mesh ba góc, bản đồ trọng số (tổng thể và từng vùng: hàm, cổ, vai, hông, áo), tư thế thử: **phi bốn chi** (pha vươn tay
  và pha gom chân), **vồ** (thân duỗi, tay vươn trước–lên, chân đạp sau), **ngẩng đầu** và cúi đầu, **há thêm và ngậm hàm** (50 %, tối đa sạch),
  vặn thân ±30°, nhấc lòng tay / nhấc gót. Số đo: độ giãn cạnh tối đa, số đỉnh áo lọt vào thân, khe ở đường nối.

## Chỉ tiêu qua cổng

- G2: các mục A1, A2 của `QA_CHECKLIST.md`, cộng các vùng khó ở trên.
- G3: B1, B2. G4: C.

## Câu hỏi G1

1. **Họ và bộ tên**: Qh = lõi H giữ nguyên tên + `L/R_Finger` (đề xuất), dùng chung với P04. Người dùng chọn khác ở thread P04 thì U04 theo.
2. **Kích thước**: A (đỉnh đầu 0,65H = 1,17 m, theo danh mục; đề xuất) hay B (0,80H = 1,44 m).
3. **Cổ 2 đoạn** (`neck` + `neck_02`; đề xuất vì cổ dài hơn đầu) hay một `neck` như H.
4. **Áo 6 chuỗi × 2 bone + dây 1 chuỗi × 2** (đề xuất) hay ít hơn.

## Duyệt

| Cổng | Ngày | Kết quả | Người duyệt | Ghi chú |
| --- | --- | --- | --- | --- |
| G1 (brief) | 2026-10-26 | duyệt | người dùng | nhận cả bốn đề xuất (họ Qh, scale A ×1,1822, `neck_02`, áo 6 chuỗi + dây) |
| G2 (rig) | 2026-10-27 | duyệt | người dùng | "oke r, done", sau khi xem trong editor và Blender; gồm `L/R_Calf_02` (chân sau 3 đốt), spring + lớp vải (`rig/editor/U04_charnel_ghoul_springbones.json`). Bằng chứng: `qa/U04_charnel_ghoul_G2_1..4.png`, `validation.json` (16/16), `qa_report.md`. Chưa quyết: `Calf_02` với P04, gộp hai mục Qh |
| G3 (clip) | | | | |
| G4 (trong lab) | | | | |
| R9 (tích hợp engine, nếu có) | | | | |

## Kết quả R2–R5 (2026-10-26, sửa 27/10) — qua G2 2026-10-27

| Mục | Kết quả |
| --- | --- |
| File | `rig/U04_charnel_ghoul_rig.blend` (mesh + `U04_runtime` + `U04_control`, 3 map 4096 đóng gói), `rig/validation.json`, `rig/qa_report.md`, `rig/rig.log`, `rig/qa/U04_charnel_ghoul_G2_1..4.png`, script `rig/scripts/` |
| Bone | 55 runtime (46 deform, 7 socket, `root`, `cog`): bảng G1 + `L/R_Calf_02` (thêm 27/10, xem dưới); `head` khớp đầu → đỉnh sọ (theo P04); rig điều khiển 82 `ctl_*` |
| Rig điều khiển | IK 2 đốt 4 chi (chân sau: Thigh–Calf tới khuỷu cổ chân sau), pole sau khuỷu, trước gối; lăn tiếp xúc (tay `Hand_IK` → `Fingertip_roll` → `Palm_roll`; chân `Foot_IK` → `Heel_roll` → `Toe_roll` → `Ball_roll` → `Hock_roll`), công tắc IK/FK, xoắn tay 50 %, `ctl_jaw` −85…+25° |
| Spring + lớp vải (27/10) | `rig/editor/U04_charnel_ghoul_springbones.json`: áo 6 chuỗi (lớp 0), dây cổ (lớp 1), 13 collider (thân, cổ, bốn chi), 4 cặp nối vải; bone collection Body / Smock / Tie / Socket. Chi tiết `qa_report.md` mục 4b |
| A1 | 16/16 đạt (14 mục + đỉnh trùng + 16 phép thử rig điều khiển) |
| Tư thế (giãn tối đa) | phi vươn 4,87× · phi gom 3,66× · vồ 5,15× · ngẩng 1,76× · cúi 2,50× · quay đầu 2,18× · ngậm 50° 2,82× · ngậm 85° 3,49× (khe răng 1 mm) · gập gối 70° 2,44× · ngồi thụp 2,61× · nhấc gót 1,68× |
| Còn lại | nách/mặt trước vai khi vươn mạnh (4–5×, dưới áo); nếp khuỷu 8,9× ở 110°; áo lọt chi 17–53 đỉnh khi chi vung mạnh; đầu dây theo cổ khi ngẩng đầu; hàm ngậm tối đa 85° |

### Thay đổi sau G1: chân sau 3 đốt (2026-10-27, người dùng yêu cầu khi xem trong editor)

Người dùng đánh dấu thêm một khớp ở chỗ gập cuối đùi, giữa hông và khớp trước đây gọi là "gối" (khớp chỉ về sau). Bảng bone ở trên (bản G1) đổi
như sau, mét, scale A:

| Bone | Cha | Đầu (bên L) | Ghi chú |
| --- | --- | --- | --- |
| `L_Thigh` | `pelvis` | (0,130; 0,236; 0,721) | hông → **gối mới** (0,206; 0,338; 0,479), gối chĩa trước |
| `L_Calf` | `L_Thigh` | (0,206; 0,338; 0,479) | gối → **khuỷu cổ chân sau** (0,199; 0,485; 0,366) = khớp "gối" cũ, chĩa sau |
| `L_Calf_02` (mới, Extra) | `L_Calf` | (0,199; 0,485; 0,366) | khuỷu cổ chân sau → gót (0,171; 0,520; 0,136) = `Calf` cũ |
| `L_Foot` | **`L_Calf_02`** | (0,171; 0,520; 0,136) | không đổi vị trí; cha đổi |

Tên theo kiểu `neck` / `neck_02` của họ Qh. Rig điều khiển giống chân sau của họ Q (B01): IK 2 đốt Thigh–Calf tới khuỷu cổ chân sau,
`ctl_L_Hock_roll` (xoay quanh cổ chân) đặt góc `Calf_02`, pole trước gối. P04 không có bone này: clip chân sau dùng chung cần map thêm
`Calf_02` hoặc P04 cũng thêm (người dùng quyết ở G2).
