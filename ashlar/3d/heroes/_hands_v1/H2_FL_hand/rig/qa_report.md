# QA rig — H2_FL_hand (tay trái Flagellant, màn chọn nghề) · R2–R5 → **dừng ở G2**

Ngày 2026-10-25 · Opus 5.5 · route M (Blender, script theo asset trong `rig/tools/`, dùng lại `solvers.skin_common`, `solvers.metrics`,
`unirig_bridge` của skill) · brief: [`rig_brief.md`](rig_brief.md) (G1 đã duyệt). Chưa commit.

## 0. Bàn giao

| File | Nội dung |
| --- | --- |
| `../H2_FL_hand_rig.glb` | mesh + skin + 22 bone runtime (19 deform + 3 socket), không clip, 3 texture 4096 **giữ nguyên byte** của GLB Tripo, 12,8 MB |
| `H2_FL_hand_rig.blend` | mesh, skeleton runtime `H2_FL_hand_rig`, rig điều khiển `H2_FL_hand_ctl` (`ctl_*` + thanh `ctl_fist`), không Action |
| `rig_recipe.json` | khung, tham số skeleton / skin / ROM, cách chọn trọng số, lệnh dựng lại từ GLB gốc |
| `landmarks.json`, `_work/vision_decisions.json` | landmark đồng thuận, nguồn từng khớp, quyết định thị giác có lý do |
| `analysis.json` | S1: đảo, biên, mật độ, lát cắt đếm ngón |
| `validation.json` | A1 trên chính file GLB + LBS kiểu three.js + reimport sạch + tóm tắt biến dạng |
| `qa/*.png` | xem §6 |

**Khung toạ độ của GLB rig (để lab nạp đúng):** đúng khung của `lookdev-lab/assets/choice-hands/choice-hand-fl.glb`, tức của
`prepare-choice-hands.py`: gốc = điểm trục tại đầu tay áo, **+z dọc cẳng tay về phía ngón, +y mu bàn tay, x ngang (ngón cái ở +x)**, mét,
dài 0,450 m. Node mesh và armature đều đơn vị (scale 1, không xoay); mesh trùng `choice-hand-fl.glb` sai lệch 1,6e-5 mm. Trong Blender:
ngón về −Y, mu tay +Z. GLB chưa có ống `sleeve_ext` (xem §7).

## 1. S1 — mesh đầu vào (không chặn rig)

- 1 mesh, 6.618 đỉnh (5.180 sau khi hàn seam), 10.006 tam giác, 21 đảo: da + tay áo da đỏ là một đảo (1.886 đỉnh hàn); 2 vòng dây bện,
  băng da + 2 viền + 4 mắt xích/đinh tán, 6 khoen + dây buộc của tay áo là đảo riêng. 520 cạnh biên, 161 cạnh non-manifold.
- **Ngón tách rõ:** lát cắt vuông góc cẳng tay cho 4 vòng riêng từ s = 0,382 m (cách kẽ ngón), ngón cái tách riêng; mỗi ngón ~199 đỉnh hàn.
  Cạnh trung bình 5,2 mm, ở ngón 3–5 mm (8–10 đỉnh một vòng): đủ cho 3 đốt nhưng nếp gấp phải trải ≥ 2 vòng cạnh (§3).
- Băng vải lòng tay, vòng vải ngón cái là texture trên da (không phải đảo riêng). Băng da cứng phủ qua khớp cổ tay (đến s = 0,288, khớp ở 0,265).

## 2. S3–S5 — landmark và skeleton

Nguồn: **a** hình học (đường trục ngón đi từ đầu ngón, khớp = điểm gãy của chuỗi ngón đang hơi cong; MCP = đỉnh u đốt bàn bằng tia dọc),
**d** UniRig (chạy được trên bàn tay lẻ: 5 chuỗi × 3 khớp, mesh khớp 1,7 mm), **c** prior giải phẫu (chỉ chặn), **e** khung lab (cổ tay 0,60).
τ = 6,75 mm.

| Khớp | Kết quả | Ghi chú |
| --- | --- | --- |
| DIP / PIP 4 ngón | ring, pinky, index PIP: trung bình a+d; index/middle DIP, middle PIP: **a** (thị giác) | UniRig lệch về phía gốc 6–14 mm ở mọi ngón; vạch tối 20–24 mm ở mu ngón là chân móng, không phải DIP |
| MCP index/middle/ring | **a** (đỉnh u đốt bàn, 15–18 mm sau kẽ ngón) | d sâu hơn 7–9 mm, cùng thiên lệch như trên |
| MCP út | **d** (độ tin 0,45) | a hỏng: mu bàn phía út không có đỉnh u → câu hỏi G2 |
| Ngón cái IP / MCP | trung bình a+d (31 / 66 mm từ đầu ngón) | vòng vải nằm trên đốt gần (52–60 mm) |
| Ngón cái CMC | **a** (gốc mô cái, đốt bàn 51 mm) | UniRig đặt CMC giữa mô cái (đốt bàn chỉ 24 mm) |
| Cổ tay | trung bình a (cuối đoạn hẹp, s 0,262) + e (lab 0,270) → s 0,265 | nằm dưới băng da |
| Trục cẳng tay | tâm tiết diện da ở s 0,095 → tâm cổ tay | để xoay sấp/ngửa quay quanh chính cẳng tay |

Bằng chứng: `qa/s3_finger_profiles.png`, `s3_medial_curves.png`, `s3_flag_tiles_fingers.png`, `s3_mcp_tiles.png`, `s3_thumb_tiles.png`,
`s3_landmarks_plot.png`.

**Skeleton runtime (22):** `hand_root` (đầu tay áo → hết cổ tay áo) → `forearm` → `wrist` → `thumb/index/middle/ring/pinky_01..03`;
`forearm` → `forearm_twist`; socket `fx_palm` (lòng tay, trỏ ra ngoài lòng), `fx_thumb`, `fx_tip_index`. Một gốc, `inherit_scale` FULL,
bbone 1. Roll: trục X cục bộ = bản lề gập, **+X gập về lòng tay** (20 phép thử tự động đều đạt). Bản lề ngón dài = 70 % mặt phẳng lòng tay +
30 % mặt phẳng hội tụ về xương thuyền (đốt xa 85/15) — xem §3 vì sao. Rig điều khiển: `ctl_*` cùng rest, runtime theo bằng Copy Transforms
(lệch rest 0), `ctl_fist` (kéo Y 0→2 cm) cộng góc nắm vào từng đốt; `forearm_twist` nhận 50 % xoay của `forearm` bằng driver
SWING_TWIST_Y (kiểm: sấp 90° → 45°).

## 3. S6 — trọng số: chọn theo vùng bằng số đo

| Ứng viên | Rách cạnh, tư thế chuẩn / cực | Thể tích khớp min | Kết luận |
| --- | --- | --- | --- |
| A — mặt phẳng nếp gấp (h 3,5/3/6 mm) | 562 / 798 | 0,80 | nếp hẹp hơn 1 vòng cạnh → mu khớp rách ngay ở tư thế nhẹ |
| A nới nếp (V2, V5) | 420 / 294 | 0,80 | vẫn rách ở ngón |
| Bone heat của Blender | — | — | **hỏng 100 %** (cả trên proxy voxel 1,5 mm): 0 đỉnh có trọng số |
| B — bone heat tự giải (Laplacian cotangent, 1/d²) | 143 / 70 (ngón 0–5) | 0,835 | tốt nhất cho bàn tay; cẳng tay không có chuỗi xoắn (cạnh giãn ×16 ở khe hở) |
| **H3 = B cho bàn tay + chuỗi cẳng tay của A (V6)** | **36 / 62** | **0,836** | **chọn** |

Luật cứng (enforce): đảo cứng 1,0 — khoen/dây buộc → `hand_root`; 2 vòng dây bện → `forearm_twist`; băng da, viền, xích, đinh → `forearm`;
cổ tay áo (s ≤ 0,092) → `hand_root`. Mỗi ngón ("lobe" sau kẽ ngón) chỉ nhận bone của chính ngón + `wrist`: **0 đỉnh rò sang ngón bên**.
Top-4, bỏ < 0,01, chuẩn hoá, đỉnh trùng seam giống hệt. Xoắn: `hand_root`→`forearm_twist` tuyến tính trên khe da hở (s 0,095–0,17,
một phần nằm dưới vòng dây 1), `forearm_twist`→`forearm` dưới vòng dây 2 (khuất).

Trước/sau: `qa/before_after.png` (tư thế lab thả lỏng 14 → 1 cạnh rách; lab grip 172 → 14; sấp 90° 34 → 3).

## 4. Tư thế nắm: giới hạn theo tiếp xúc

Bàn tay này ngón dài (MCP→đầu ngón 112–127 mm) so với lòng tay dày ~45 mm: nắm đấm sách giáo khoa (MCP 85 / PIP 100 / DIP 65°) **vùi đầu ngón
7–15 mm vào lòng tay**. Góc nắm (`fist_deg`) vì thế được dò tự động (`tools/h14b_fist_joint.py`, `h15_thumb_fist.py`): xuyên lòng tay ≤ 1 mm,
ép cạnh ngón kề ≤ 5 mm. Kết quả cộng thêm vào rest (X = gập): trỏ 71/42,5/30,5 · giữa 72/45,4/46,9 · áp út 69/48,4/42,1 · út 67/59,7/45,6 ·
cái: `thumb_01` 20° + xoay 20° ngang lòng, `thumb_02` 40, `thumb_03` 58 (ngón cái ôm trước đốt giữa ngón trỏ/giữa, trong giới hạn giải phẫu).
Gợn sóng, nắm hờ, chỉ dùng lại các góc này (gợn sóng co về tiếp xúc ≤ 1 mm).

## 5. S7 — số đo so ngưỡng (`RIG_SKILL_WORKFLOW.md` §4; Blender mô phỏng LBS, Armature only, không Preserve Volume)

| Chỉ số | Ngưỡng | Kết quả | Đèn |
| --- | --- | --- | --- |
| A1.1–A1.14 trên GLB (`validation.json`) | như `QA_CHECKLIST` | tất cả đạt; tổng trọng số lệch ≤ 1,3e-7; IBM khớp phân cấp | xanh |
| Đầu bone trong mesh | 100 % | 21/22; `hand_root` nằm ở mặt cắt đầu tay áo (gốc trong tường, cố ý) | xanh (miễn ghi rõ) |
| Rò sang ngón bên | 0 | 0 đỉnh | xanh |
| Cạnh rách (> 1,5× và > 0,9 mm) | 0 ở ROM chuẩn | thả lỏng/mở/khum/nắm hờ/xoè 1 cạnh mỗi tư thế; sấp/ngửa 3/6 (khuất dưới vòng dây); gợn sóng 1–8 | vàng |
| — tư thế cực | ghi rõ | nắm đấm 12 (lòng tay 6, kẽ ngón cái 7), chỉ 19, lab grip 14 | vàng |
| Thể tích quanh khớp | ≥ 0,85 | ROM chuẩn ≥ 0,904; nắm đấm 0,872; chỉ 0,836 (`middle_mcp`) | xanh / vàng ở "chỉ" |
| Tiết diện cẳng tay khi xoắn 90° | ≥ 0,7 (brief ~0,85) | khe da hở 0,89–0,94 (sấp và ngửa) | xanh |
| Đồ cứng méo (cạnh) | < 1 mm | ≤ 0,0001 mm mọi tư thế | xanh |
| Nứt seam | 0 | 0 | xanh |
| Xuyên — ROM chuẩn | 0 | khum, nắm hờ, gợn sóng: chỉ chạm ≤ 1,0 mm; da dưới băng da: cổ tay gập 40° 2,2 mm, ngửa 40° 3,5 mm, khum/nắm hờ ≤ 0,7 mm | **đỏ ở cổ tay ±40°** (xem G2-1) |
| Xuyên — tư thế cực | ≤ 0,5 % H = 2,25 mm | nắm đấm, chỉ: lòng tay 0, **ép cạnh ngón kề 5,5–5,7 mm** (gốc đốt gần, khuất trong nắm) | **đỏ** (xem G2-3) |
| Reimport sạch (Blender, thư mục chép) | ≤ 2,5e-5 m | 22 bone, tên khớp, ≤ 2,9e-7 m ở 6 tư thế mẫu | xanh |
| Blender ↔ LBS kiểu three.js (đọc chính GLB) | ≤ 2,5e-4 m | 2,9e-7 m ở cả 20 tư thế | xanh |

## 6. Ảnh QA (`rig/qa/`, đã mở và soi từng tấm)

`skeleton_overlay.png` (trên/dưới/hai bên/nhìn từ đầu ngón, có nhãn) · `weights_fingers.png` (mỗi ngón: đỏ `_01`, xanh lá `_02`, xanh dương
`_03`) · `weights_dominant.png` (mọi bone + số ảnh hưởng) · `rom_sheet_1.png`, `rom_sheet_2.png` (20 tư thế × 3 góc: mu 3/4, lòng 3/4, cạnh
út; có số đo từng tư thế) · `stretch_sheet.png` (heat map giãn) · `before_after.png` · **`g2_flag_sheet.png` (8 ô, xem trong ≤ 2 phút)** ·
bằng chứng S1/S3: `s1_islands_views.png`, `s3_*.png`. Ô gốc ở `qa/_tiles/` (66 MB, chỉ là bằng chứng).

## 7. Lỗi còn lại và việc cho lab (Sonnet)

1. **Băng da phủ qua khớp cổ tay.** Gập/ngửa 40°: da phía dưới băng chui vào thành băng 2,2/3,5 mm; khi ngửa 40° phía lòng tay hở ra thấy mặt
   trong băng. Dời chỗ chuyển tiếp ra mép băng thì hết xuyên nhưng cổ tay rách 20–84 cạnh và thể tích còn 0,76 (đã thử, `rig_recipe.json`
   final.selection). Màn chọn nghề chỉ gập cổ tay ~8°: ở biên độ đó không thấy lỗi.
2. **Nắm đấm: các đốt gần ép vào nhau 5–6 mm** (ngón mập, LBS không nén được mô mềm). Nhìn từ ngoài thấy các ngón áp sát (ô 4).
3. **`FINGER_POSES` của lab chưa hợp bàn tay này:** mesh rest đã cong sẵn (PIP 22–42°) mà lab cộng thêm, nên "relaxed"/"open" thành vuốt
   (ô 8) và `grip` vùi ngón 14 mm vào lòng tay (ô 5). Đề xuất grip đã dò theo tiếp xúc trên trục lab: trỏ [52,7, 64,8, 45,4], giữa
   [42,5, 52,0, 35,5], áp út [48,5, 59,0, 39,2], út [60,2, 70,1, 46,9] (ROM `lab_grip_tuned`: xuyên ≤ 1 mm); "open" nên âm (duỗi bớt khỏi rest).
4. **Trục gập ngón cái do lab tự suy lệch 72–76° so với bản lề thật** (ngón cái nằm trong mặt phẳng lòng tay, móng hướng về cổ tay) nên ngón
   cái gần như không gập được (grip dò được chỉ 7/10/7°). Đề xuất `FINGER_AXES.thumb = { curl: [-0.007, -0.954, -0.299], spread: [0.226, 0.29,
   -0.93] }` (khung tay lab, +curl = về lòng tay; `_work/lab_finger_axes_thumb.json`).
5. `prepare-choice-hands.py` chưa giữ skin (đã ghi trong script): GLB rig đã đúng khung nên lab có thể nạp thẳng `H2_FL_hand_rig.glb` (texture
   4096 → nên làm bản 2048 + gắn ống `sleeve_ext` bằng script). Slot soi gương (`scale.x = -1`) với SkinnedMesh chưa thử.
6. **Lab xoay `forearm` trực tiếp** (bản `createJointRig` đang làm ở thread lab): driver của `forearm_twist` không vào GLB, nên khi đặt roll
   θ cho `forearm` phải đặt thêm cho `forearm_twist` (con của `forearm`, trục Y cục bộ song song trục cẳng tay) một roll **−θ/2** quanh cùng
   trục đó; nếu không, khe da giữa cổ tay áo và vòng dây bện xoắn đủ 90° và rách (như ứng viên B: cạnh giãn ×16). Cổ tay (`wrist`) lái trực
   tiếp thì không cần gì thêm.
7. Chưa chạy: thử trên lab WebGL/WebGPU, phát GUI trong Blender sau khi mở lại file (đã mở lại và kiểm bằng reimport), clip `rom_test`
   (không làm: brief để tuỳ chọn).

## G2 — câu hỏi cho người dùng (ô trên `g2_flag_sheet.png`)

1. **Cổ tay vs băng da** (ô 1–2): chấp nhận bản hiện tại (đẹp ở biên độ nhỏ, xuyên khuất khi ±40°), hay đổi sang bản "gập tại mép băng"
   (không xuyên nhưng nếp cổ tay cứng, rách nhẹ)?
2. **Nắm đấm** (ô 3–4): dáng nắm này (đầu ngón chạm lòng tay, ngón cái ôm trước) có đạt chưa? Ngón ép sát nhau 5 mm có chấp nhận được?
3. **Bone thêm `forearm_twist`** (ô 6): brief không có; thêm để xoay sấp/ngửa không kẹo xoắn (tiết diện 0,89 thay vì ~0,6). Lab bỏ qua bone
   này. Giữ hay bỏ?
4. **MCP ngón út** lấy theo UniRig (hình học không có đỉnh u đốt bàn) — nhìn ô 7 / `rom_sheet_*` thấy ngón út gập có tự nhiên không?
5. Dáng "mời nắm" (ô 8) đang dùng góc của lab: cần chỉnh `FINGER_POSES` như §7.3 (việc của Sonnet) — đồng ý?
6. Thêm `palm_outer` (cong mép lòng tay phía út) sau G2 không? Hiện mép út theo `pinky_01` một phần (bone heat), nhìn ô "pinky · ulnar" của
   `weights_fingers.png`.
