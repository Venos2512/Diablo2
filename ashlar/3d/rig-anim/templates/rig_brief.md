# Rig brief — <asset_id>

Chép file này vào `<asset_dir>/rig/rig_brief.md`, điền và đưa người dùng duyệt (cổng G1) **trước khi** tiêu credit hoặc dựng rig.
Quy trình: [`Agent.md`](../Agent.md). Chuẩn: [`SKELETON_STANDARD.md`](../SKELETON_STANDARD.md).

## Thông tin asset

| Mục | Giá trị |
| --- | --- |
| `asset_id` | |
| Nhóm / loại | hero · quái · NPC |
| Họ quái ASHLAR (nếu quái) | Unlaid · Discarded · Warped · Faithful · Perfection-born · … |
| GLB gốc | `<asset_id>.glb` (kích thước, số tam giác) |
| Chiều cao thật (danh mục) | |
| Tư thế gốc | T-pose · A-pose · khác |
| Lỗi đã biết của mesh | (ngón dính khối, tay mảnh, góc nhọn…) |

## Quyết định rig

| Mục | Lựa chọn | Lý do |
| --- | --- | --- |
| Họ skeleton | H · S · Q · W · A · L · F · O | |
| Route | T (skeleton mẫu) · A (auto-rig) · M (tay) | |
| Công cụ cụ thể | (UniRig · Tripo · Meshy · Blender · skeleton mẫu nào) | |
| Ước tính credit | (số hoặc "không tốn") | chưa đo thì ghi "chưa đo" |
| Bone ngón tay | có · gom khối · không | |
| Bone phụ cần giữ | (áo choàng, tóc, váy, xích, tai, đuôi…) | |
| Bone mặt | có · không | |
| Socket vũ khí | `R_weapon_attach` · `L_weapon_attach` · khác | |
| Socket VFX | | |
| Vật phụ rời | (vũ khí, khiên, roi xích, đèn…) | mesh riêng hay một phần thân |

## Thông số animation (theo `blender-game-animation`)

| Mục | Giá trị |
| --- | --- |
| Trục tiến / trục lên | +Z / +Y (glTF) · khác: |
| Đơn vị | mét |
| fps | 24 *(đề xuất)* |
| Loop / root motion | walk, run, idle: loop kín, in-place · death: không loop |
| Sự kiện gameplay cần có | `hit`, `footstep`, `fx`… (kèm khung dự kiến) |
| Tham chiếu | video / ảnh / clip nguồn: đường dẫn trong `rig/anim/refs/` |
| Rig điều khiển | IK chân (có / không) · IK tay (có / không) · control tiếp xúc |
| Giới hạn influence của engine đích | 4 *(chuẩn glTF)* · khác: |
| Tiếp tục file của người khác? | có (đã kiểm kê rig, Action, slot, constraint, cài đặt xuất) · không |

## Bộ clip

| State | Cần? | Nguồn dự kiến | Dùng lại từ | Ghi chú |
| --- | --- | --- | --- | --- |
| `idle` | R | | | |
| `walk` | R | | | |
| `run` | R/O | | | |
| `attack` | R | | | |
| `attack2` | O | | | |
| `cast` | O | | | |
| `block`, `blockHit` | O | | | |
| `hit` | R | | | |
| `death` | R | | | |
| `revive` | O | | | |
| `jump`, `dodge` | O | | | |
| Clip đặc thù | | | | (ví dụ roi xích, cắm đất, nổ tung) |

Stance áp dụng (hero): `unarmed` · `1h` · `2h` · `dual` · `ranged1h` · `ranged2h` · `spell`.

## Rủi ro và điều cần chú ý

- (vùng khó skin, phụ thuộc skeleton mẫu, giấy phép nguồn clip, mesh cần sửa…)

## Chỉ tiêu qua cổng

- G2: các mục A1, A2 của `QA_CHECKLIST.md`, cộng các vùng khó ở trên.
- G3: các mục B1, B2.
- G4: các mục C.

## Duyệt

| Cổng | Ngày | Kết quả | Người duyệt | Ghi chú |
| --- | --- | --- | --- | --- |
| G1 (brief) | | | | |
| G2 (rig) | | | | |
| G3 (clip) | | | | |
| G4 (trong lab) | | | | |
| R9 (tích hợp engine, nếu có) | | | | |
