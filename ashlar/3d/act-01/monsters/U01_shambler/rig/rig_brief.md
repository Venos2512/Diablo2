# Rig brief — U01_shambler

Trạng thái: **G1 duyệt theo lô, G2 duyệt (2026-10-26)**. Chưa làm clip (R6, phiên riêng). Đợt thử của lô `rig_v1`
([`BRIEF.md`](../../../_batches/rig_v1/BRIEF.md)). Quy trình: [`Agent.md`](../../../../rig-anim/Agent.md). Chuẩn:
[`SKELETON_STANDARD.md`](../../../../rig-anim/SKELETON_STANDARD.md). Số đo: [`validation.json`](validation.json), nhật ký:
[`rig.log`](rig.log).

## Thông tin asset

| Mục | Giá trị |
| --- | --- |
| `asset_id` | `U01_shambler` |
| Nhóm / loại | quái, họ Unlaid (Prologue) |
| GLB gốc | `U01_shambler.glb`, 9.629 tam giác, base color 8192², normal + rm 4096², sha256 `f17a4800…badbf9`; không skin, không vertex group |
| Chiều cao thật | 0,95H = **1,71 m** (rig ở chiều cao này, k = 0,95) |
| Tư thế gốc | T-pose, tay ngang ở 0,87H (vai nhô cao hơn chân cổ, theo thiết kế) |
| Lỗi mesh đã gặp | tay trái ngắn hơn tay phải 5 cm tính từ trục thân (đã sửa); đầu lệch trái 2,3 cm (giữ, khớp theo đầu); thân, khăn, ống tay, tunic, áo choàng là **một mảnh** (cắt theo mặt); cạnh dài 29–36 cm chạy từ gáy sang vai sau |

## Quyết định rig

| Mục | Lựa chọn | Lý do |
| --- | --- | --- |
| Họ skeleton | H | dáng người, đi hai chân |
| Route | M (dựng trong Blender) bằng skill `blender-character-rigging` | G1 lô; 0 credit |
| Bone | 36 bone của skill (bộ lõi H 28 + socket `root`, `cog`, `ground`, `hit_origin`, `fx_*`, `*_weapon_attach`) + 35 bone vải/phụ kiện = 71 (61 deform) | |
| Bone ngón tay | không (một `Hand` mỗi bên) | |
| Bone phụ | `robe_tunic_FL/FR/L/R/BL/BR_01–03` (tunic, cha `pelvis`), `robe_cape_B/L/R_01–03` (áo choàng, cha `chest`), `sleeve_L/R_01–02` (vạt tay áo, cha `UpperArm`), `flap_rope_L/R_01–02` (đầu thừng, cha `spine_01`) | tách part theo duyệt 2026-10-26 |
| Bone mặt | không | |
| Socket | `L/R_weapon_attach`, `fx_head`, `fx_chest`, `fx_hand_L/R`, `hit_origin`, `ground` | quái không cầm vũ khí |
| Part | Body, Head, Accessory, Cloth_Robe, Cloth_Cape (cùng một armature, không gộp) | chuẩn của skill; nhóm Cloth (vạt vai) trống |

## Khi đưa vào game (ghi chú bàn giao)

- **Spring bone** cho: `robe_tunic_*`, `robe_cape_*`, `sleeve_*`, `flap_rope_*`. Không có spring bone thì áo choàng chìa ra sau khi cúi
  (xoay cứng theo ngực) và vạt tay áo xoay theo tay. Ảnh QA đã mô phỏng vạt tay áo rủ theo trọng lực.
- **Đẩy váy khi chân chạm**: dữ liệu `skirt_push_data.json` và collider `leg_colliders` lưu trên rig. Dùng `SkirtPusher.cs` của skill với bộ
  giải `iters 6, smooth 0.7, rounds 6`. Trong Blender: F3 → "Skirt Push: Update" (cần cho phép chạy script của file khi mở).
- **Xương xoắn**: Unity Humanoid không tự quay `*_twist`; cần Rotation Constraint/script (xoắn cẳng tay ≈ 50 % xoay bàn tay) hoặc
  bake vào clip.
- **Sửa khớp bằng rig editor**: `reweight_after_edit` của skill chỉ hiểu mask tay nhị phân và không có các chỉnh riêng của U01
  (trường trộn vai, neck theo khoảng cách, vạt tay áo, cửa sổ gối). Sau khi sửa khớp, chạy lại `tools/run_stage.py` s3→s6 của lô
  với khớp mới thay vì dùng nút tính lại weight của editor.

## Duyệt

| Cổng | Ngày | Kết quả | Ghi chú |
| --- | --- | --- | --- |
| G1 (brief) | 2026-10-26 | duyệt theo lô | chiều cao thật; part U01 duyệt kèm yêu cầu tách áo choàng + thêm chuỗi vạt tay áo |
| G2 (rig) | 2026-10-26 | duyệt | sau 11 lượt sửa (khớp người dùng chỉnh trong rig editor, vai theo tay khi hạ); `qa/U01_shambler_G2_1..3.png` |
| G3 (clip) | | | phiên animation riêng |
| G4 (trong lab) | | | |
