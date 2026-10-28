# ashlar/Art_Final/lab: mỗi map một file JSON

Mỗi map là **một file** `<sceneId>.json` (định dạng `ashlar-map/1`), đủ để dựng lại map bằng three.js trên máy khác chỉ với ba thứ: thư mục `Art_Final`, file JSON của map và một file code loader. Mọi đường dẫn trong JSON (GLB, texture, HDR) **tính từ gốc `Art_Final`** và chỉ trỏ vào `Resource_3D_Optimized/` hoặc `Texture/`, không có đường dẫn ra ngoài. Loader chỉ cần một base URL.

Đặc tả từng trường (hệ toạ độ, ma trận, mã hoá base64, cách ghép world matrix, splat → trọng số layer, ý nghĩa đèn / mood theo three.js) nằm ở `lookdev-lab/scripts/export-map/FORMAT.md`.

## Nội dung một file

- `meta` (id scene của lab, seed / generator, hash code, thời điểm xuất), `units`, `coordinateSystem`, `bounds`.
- `terrain`: heightfield (Float32 base64), splat (hai PNG base64), danh sách layer kèm đường dẫn texture. Map trong nhà dùng sàn thay cho địa hình; `dungeon` có hai khu (`areas`).
- `assets`: bảng asset. Mỗi asset có `glb` (đường dẫn GLB đã optimized, hoặc `null` + `reason`), `matrix` (column-major, thứ tự `Matrix4.elements` của three.js) và `collide`, `category`, `defSize`. **World matrix của một vật = ma trận đặt (position, yaw, scale) × `asset.matrix`.** `matrix` đã gồm phép đưa GLB optimized (khung nguồn, ~1 m) về khung GLB của lab (đúng kích thước, đã xoay yaw); phép này suy ra chính xác từ script tạo GLB của lab, không dò theo bbox.
- `objects`: các vật đã đặt (kết quả scatter đã chốt, không còn ngẫu nhiên khi nạp): `a` asset, `p` vị trí, `r` yaw (độ) hoặc `q` quaternion, `s` scale. `far` là các vật xa ngoài biên.
- `lighting` (mọi mood, mood mặc định có đánh dấu), `lights`, `environment` (HDR), `water`, `paths`, `decks`, `walk` (blockers, marker, spawn, segment), `views`.

## Các map

| Map (id) | Nhãn | Loại | Dung lượng | Vật đặt | Asset (GLB / không GLB) | Mood (mặc định) |
| --- | --- | --- | ---: | ---: | --- | --- |
| [`oldFace.json`](./oldFace.json) | ASHLAR · Prologue · The Old Face (hầm xương) | oldFace | 0,46 MB | 53 | 5 GLB, 0 không (0 procedural, 0 blockout, 0 thiếu model) | 2 (`night`) |
| [`choiceHands.json`](./choiceHands.json) | ASHLAR · Màn chọn nghề (sáu bàn tay) | choiceHands | 0,10 MB | 6 | 0 GLB, 3 không (0 procedural, 0 blockout, 3 thiếu model) | ánh sáng riêng cố định |
| [`act1LychgateHub.json`](./act1LychgateHub.json) | Lychgate hub · walled (seed 21) | outdoor | 1,07 MB | 594 + 3 xa | 28 GLB, 4 không (4 procedural, 0 blockout, 0 thiếu model) | 3 (`day`) |
| [`act1Lychgate.json`](./act1Lychgate.json) | Lychgate → Churchyard | outdoor | 2,90 MB | 1773 + 1 xa | 45 GLB, 5 không (5 procedural, 0 blockout, 0 thiếu model) | 3 (`day`) |
| [`act1Fens.json`](./act1Fens.json) | Night Fens → Rook's Weir | outdoor | 1,89 MB | 2551 + 1 xa | 42 GLB, 7 không (4 procedural, 3 blockout, 0 thiếu model) | 3 (`night`) |
| [`act1PoppyReach.json`](./act1PoppyReach.json) | The Poppy Reach | outdoor | 4,09 MB | 1050 | 23 GLB, 8 không (4 procedural, 4 blockout, 0 thiếu model) | 2 (`day`) |
| [`act1Cradle.json`](./act1Cradle.json) | ASHLAR · Act I · base · The Cradle | interior | 0,28 MB | 111 | 8 GLB, 4 không (1 procedural, 3 blockout, 0 thiếu model) | 2 (`cradle`) |
| [`act1GentleHouse.json`](./act1GentleHouse.json) | ASHLAR · Act I · base · Gentle House | interior | 0,41 MB | 128 | 20 GLB, 13 không (2 procedural, 11 blockout, 0 thiếu model) | 3 (`warm`) |
| [`act1GardenOfHush.json`](./act1GardenOfHush.json) | ASHLAR · Act I · base · Garden of Hush | interior | 0,70 MB | 743 | 23 GLB, 11 không (3 procedural, 7 blockout, 1 thiếu model) | 2 (`hush`) |
| [`dungeon.json`](./dungeon.json) | ASHLAR · Hầm mộ & hang động (dungeon) | dungeon | 0,84 MB | 53 | 9 GLB, 0 không (0 procedural, 0 blockout, 0 thiếu model) | 2 (`atmo`) |

## Asset không có GLB trong Art_Final

Ghi rõ `glb: null` và `reason` trong bảng `assets` của từng map; loader phải bỏ qua hoặc vẽ thay thế:

- `choice-hand-fl` (choiceHands)
- `choice-hand-os` (choiceHands)
- `choice-hand-br` (choiceHands)
- `act1-p06-poppy-mound` (act1GardenOfHush)

- Asset `procedural` (cỏ, sậy, quạ...) và `blockout` (hộp thay model chưa có) cũng không có GLB: lab vẽ chúng bằng code / hộp; đặc tả nói cách vẽ.

## Texture

Mọi texture và HDR mà các JSON nhắc tới đã được copy vào `Art_Final/Texture/` (giữ đường dẫn con dưới thư mục nguồn; `Texture/lab/...` là file lab đang nạp), danh sách + sha256 ở `Texture/manifest.json`. Bản gốc không bị sửa.

## Kiểm chứng ma trận

`TRANSFORM_REPORT.md` (và `.json`) là bảng kiểm từng asset: GLB optimized đẩy qua `fromOptimized` rồi so từng điểm với GLB của lab (sai số bbox, khoảng cách gần nhất p50 / p90, thử thêm các góc xoay sai 90 / 180 / 270 độ). Biến thể không affine (`-open`, `-trim`, `-wide`, `-slim`) dùng ma trận của asset gốc, có cờ `approx` và liệt kê riêng trong báo cáo.

## Xuất lại

```text
cd lookdev-lab
npm run export:maps                       # mọi map
node scripts/export-map/index.mjs act1Cradle   # một hay vài map
npm run test:export-map                     # kiểm tra các JSON
```

Cần python có numpy, scipy, trimesh, Pillow (ma trận lấy từ `prepare-act1-kit.py --transforms-only` và hai script cùng loại). Các thư mục cũ trong `lab/` (`<sceneId>/scene.json`, `placements.json`, `terrain/`) là bản xuất trước đây theo nhiều file; chúng được giữ nguyên và sẽ được dọn khi người dùng quyết định.
