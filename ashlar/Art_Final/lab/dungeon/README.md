# dungeon — Hầm mộ & hang động

Hai khu cạnh nhau trong một scene: **hầm mộ** (Bell Catacombs + Old Face, tâm (−17, 0), chuông rơi, 3 quan tài, cột gãy, giá nến, ngách xương) và **hang động** (Flint Delvings, tâm (18, 0), hồ ngầm, lò nung đỏ cam, khung gỗ mỏ, nhũ đá). **Bố cục cố định, viết tay** (không sinh theo lượt chơi): không có seed bản đồ; seed chỉ cho phần rải chi tiết.

Đường dẫn tính từ gốc repo (`E:\Diablo2`), dấu `/`. Đây là **dữ liệu**: không có code, không có file asset nào được copy; GLB trỏ tới `ashlar/Art_Final/Resource_3D_Optimized/`, texture trỏ tới `ashlar/art/textures/...` (cùng ảnh) hoặc `lookdev-lab/assets/...` (khi lab đã xử lý).

## Nguồn gốc (để xuất lại sau này)

| Cái gì | Ở đâu trong `lookdev-lab/` |
| --- | --- |
| Scene (`?scene=dungeon`) | `src/scenes/dungeon.js` (`TIMES` = mood, `DUNGEON_DEFAULTS`, `VIEWS`) |
| Bố cục thuần JS (lớp đất, mặt nạ, tường hầm mộ, viền hang, ao, độ cao, danh sách prop) | `src/env/dungeon.js` |
| Dressing (mô-đun tường, prop, lửa, đèn, decal, bóng chuông) | `src/env/dungeonDecor.js` (class `DungeonDecor`) |

Script xuất: `E:\tmp_ashlarlab\extract\export-dungeon.mjs` (ngoài repo): chạy thật `DungeonDecor.load()/build()` bằng node với stub cho phần cần trình duyệt (canvas, loader, FlameField), nạp geometry thật của GLB prop, rồi đọc cây THREE ra số. Chạy lại sau khi sửa `dungeon.js` / `dungeonDecor.js`.

## Hệ toạ độ

three.js, **Y lên**, mét, toạ độ **thế giới**: x = đông, z = nam. Hầm mộ tâm (−17, 0), hang tâm (18, 0); toạ độ cục bộ của `env/dungeon.js` = thế giới − tâm khu. `rotationEulerDeg` thứ tự `YXZ`; `yawDeg` quanh +Y.

## File

| File | Nội dung |
| --- | --- |
| `placements.json` | `assets` (9 loại prop GLB), `objects` (**29** prop: 17 hầm mộ + 12 hang), `instanced` (mô-đun tường hầm mộ 24), `procedural` (1: vết nứt lò nung), `decals` (362) |
| `scene.json` | `areas` (lớp đất + texture), `crypt` (kích thước, chuông, cột, ngách, lối đi, tường `cryptWalls()`), `cave` (ao, lò, lối đi, prop, khung gỗ, viền 480 mẫu), `lights` (11), `flames` (31), `moods`, `views`, HDR |
| `terrain/crypt-splat{0,1}.png`, `cave-splat{0,1}.png` | mask lớp đất (320 px / 28 m; 360 px / 30 m) |
| `terrain/cave-heightmap.json` | độ cao hang, ô 0,5 m, toạ độ cục bộ |

Hầm mộ: sàn gồm 2 mặt phẳng (24,9 × 16,9 m tại tâm; hành lang 4,9 × 4,9 m dịch 10,2 m về nam); tường: mô-đun GLB `crypt_wall` (`instanced`). Hang: sàn là lưới cực dựng từ `caveHeight` (heightmap), tường là vòng nhiễu theo `outline` (bán kính + chiều cao tường mỗi 0,75°).

## GLB

Các prop và mô-đun tường dùng 9 loại GLB trong `ashlar/Art_Final/Resource_3D_Optimized/map/common/dungeon_v1/` (`bone_pile`, `broken_column`, `candle_cluster`, `crypt_wall`, `fallen_bell`, `flint_boulders`, `mine_timber`, `sarcophagus`, `stalagmites`): **29 giải ra GLB optimized, 0 chưa có**. GLB lab = GLB optimized × `labFromOptimized.uniformScale` (pivot đáy tâm; không xoay ¼ vòng), dùng `scaleForOptimizedGlb` khi ráp GLB optimized. Mô-đun tường: `compose(position, Euler YXZ, (sx, sy, 1))` × `crypt_wall` (rộng 4 m); với GLB optimized nhân thêm k = 4.028.

## Ánh sáng (mood)

**2 mood**, mặc định (cũng là Play): **`atmo`** (`lookdev` = soi texture). Dungeon không có đợt tăng sáng 10-23 (không thuộc Act I base maps); giá trị là hiện tại trong `scenes/dungeon.js`.

| Mood | Nhãn | hemi | env | exposure | tone mapping | fog | lights × |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `atmo` (**mặc định / Play**) | Hầm tối · khí quyển (mặc định) | 1.5 | hdri-night 0.05 | 0.8 | aces | #0c0a09 ρ0.05 | 1 |
| `lookdev` | Soi texture · sáng đều | 2.4 | hdri-overcast 0.25 | 0.2 | aces | tắt | 0.35 |

`scene.json` → `moods.<id>.raw` = `TIMES` (đọc từ nguồn scene), `.resolved` = `applyTime()` đã port (hemisphere, lightScale, env, nền `#050404`, skyTint, post: tone mapping, exposure, fog, grade). `lights` = đèn thật đã dựng (11: nến, đuốc, lò nung, ao, tường, một spot đổ bóng "bell shaft"), `flames` = ngọn lửa billboard (31), `lightSources` = cường độ gốc. Cường độ thực = giá trị × `lights` của mood × nhấp nháy 1/f. Đèn hero "Player lantern": 2600 K, distance 9, decay 1,6.

## Seed

Không có seed bản đồ. Dressing: `kit.rng(7301)` (prop hầm mộ), decal và không khí cũng seed cố định; `CAVE.seed` = 3.7 (nhiễu của ao). Kết quả đã nằm trong `placements.json`.

## Không xuất / chưa giải

- **Decal** (362): rải bởi `scatterDecals()` từ mặt nạ thật nhưng chạy trong stub node, chưa đối chiếu với trình duyệt; màu tint từng instance không xuất.
- Mesh gộp (sàn, tường hang, nước) chỉ có tham số/heightmap, hình học sinh ra từ code.
- Phần đèn/lửa ghi cường độ lúc dựng (xem trên), không ghi chuỗi nhấp nháy.
