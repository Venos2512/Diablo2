# Rig brief — H2_FL_hand (tay màn chọn nghề, bản thử rig ngón)

Quy trình: [`ashlar/3d/rig-anim/Agent.md`](../../../../rig-anim/Agent.md). Trạng thái: **G1 đã duyệt 2026-10-25** ("Duyệt, rig tay FL"); chỉ FL, chưa thêm `palm_outer` (tuỳ chọn để sau G2).
Yêu cầu người dùng: "tôi cần test rig bàn tay và ngón tay để nó cử động được tự nhiên trước" (trước khi dựng PB/EX/PS và rig các tay còn lại).

## Thông tin asset

| Mục | Giá trị |
| --- | --- |
| `asset_id` | `H2_FL_hand` (tay trái của Flagellant, màn chọn nghề) |
| Nhóm / loại | prop hero (chỉ cẳng tay + bàn tay) |
| GLB gốc | `choice_hands_H2_FL_hand.glb` (12,7 MB, 10.006 tam giác, 1 mesh, 4096 base/MR/normal; cạnh dài chuẩn hoá 1 m) |
| Kích thước thật | cẳng + bàn tay ~45 cm (scale đều 0,45 trước khi dựng xương) |
| Tư thế gốc | lòng tay ngửa, ngón thả lỏng hơi xoè, có khe giữa các ngón (đã soi `_shots/final_views.png`) |
| Lỗi đã biết của mesh | chưa đo: mật độ đỉnh ở khớp ngón (Tripo, quad 5.180 đỉnh); vòng dây bện, băng da có xích, băng vải ở lòng tay |
| Vì sao chọn tay này | ngón tách rõ nhất trong ba GLB; tư thế ngửa giống tư thế mời nắm mới |

## Quyết định rig

| Mục | Lựa chọn | Lý do |
| --- | --- | --- |
| Họ skeleton | **Hand** (họ mới, nhỏ; ghi vào `SKELETON_STANDARD.md` sau G2) | không thuộc H/S (không có thân) |
| Route | **M** (dựng trong Blender qua MCP, theo skill `blender-mcp-rigging`) | bàn tay lẻ; landmark lấy từ hình học mesh (đầu ngón, kẽ ngón, khớp) + UniRig làm ý kiến thứ hai |
| Ước tính credit | không tốn | Blender + máy |
| Bone | `hand_root` (đầu tay áo, trong tường) → `forearm` → `wrist` → mỗi ngón 3 đốt: `thumb_01..03` (01 = xương bàn ngón cái, để ngón cái gập chéo vào lòng tay), `index/middle/ring/pinky_01..03`; tuỳ chọn `palm_outer` (cong lòng tay phía ngón áp út/út) | khớp bảng `FINGER_BONES` mà lab đã chờ sẵn (`lookdev-lab/src/env/choiceHands.js`) |
| Phần cứng | băng da + xích, vòng dây bện, cổ tay áo: 100 % theo `forearm`/`wrist`, không méo | đồ cứng không được co giãn |
| Băng vải ở lòng tay | theo bàn tay, không theo ngón | |
| Socket | `fx_palm` (giữa lòng tay), `fx_thumb`, `fx_tip_index` | hiệu ứng nghề đang neo theo các điểm này |
| Rig điều khiển | `ctl_*` cho cổ tay và ngón (gập từng đốt + một thanh "nắm" chung) chỉ trong `.blend`; runtime chỉ bone deform + socket | theo skill |
| Giới hạn | 4 influence/đỉnh (glTF), trọng số cộng 1, QA mô phỏng LBS của three.js | |

## Kiểm "cử động tự nhiên" (R4–R5, bằng chứng cho G2)

- **Tư thế thử (ROM):** thả lỏng · mở mời nắm (lòng ngửa, ngón hơi khum) · khum chén · nắm đấm · nắm hờ như cầm tay người khác · chỉ (ngón trỏ duỗi) · xoè hết · gợn sóng ngón (út → trỏ) · cổ tay gập/ngửa ±40° · xoay cẳng tay (sấp ↔ ngửa) ±90°.
- **Đo:** đốt ngón không xẹp ở khớp (thể tích quanh khớp giữ ≥ ~85 %), không "kẹo xoắn" khi xoay cẳng tay, ngón không xuyên qua nhau và qua lòng tay khi nắm, đồ cứng không méo (sai lệch cạnh < 1 mm), không đỉnh rời / trọng số sang ngón bên cạnh.
- **Ảnh QA** trong `rig/qa/`: skeleton chồng mesh (trên, dưới, bên), bản đồ trọng số từng ngón, bảng ROM ba góc, ảnh trước/sau mỗi lần sửa.
- **Trong lab:** GLB rig đặt vào slot FL của `?scene=choiceHands`; ngón điều khiển thủ tục theo tên bone (đã có code): idle thả lỏng → showcase → mời nắm (khum) → nắm (khép). Thêm một chế độ thử tay riêng (thanh trượt từng ngón, các preset ROM ở trên, vòng lặp tự chạy) để duyệt chuyển động. Code lab do Sonnet viết, Opus review.

## Thông số

| Mục | Giá trị |
| --- | --- |
| Trục | +Z dọc cẳng tay về phía ngón, +Y mu tay (đúng quy ước `prepare-choice-hands.py`) |
| Đơn vị | mét |
| fps | 24 (nếu xuất clip thử) |
| Clip | không cần clip: lab điều khiển ngón bằng code. Có thể xuất 1 clip `rom_test` chỉ để xem |
| Tiếp tục file của người khác? | không |

## Bàn giao

`rig/H2_FL_hand_rig.blend`, `rig/rig_recipe.json`, `rig/validation.json`, `rig/qa/*.png`, `H2_FL_hand_rig.glb` (cạnh GLB gốc; GLB gốc không sửa).
Sau G2: áp cùng cách cho OS, BR rồi PB/EX/PS khi có GLB.
