# act1PoppyReach — Poppy Reach (Act I, map nền)

Triền đồi hoa anh túc đỏ trong cỏ xám xanh, trang trại bỏ hoang, tường đá khô; "khói ngủ là địa hình". Cánh đồng và đất xa sinh bằng `env/act1/meadow.js` từ seed + tham số.

Đường dẫn tính từ gốc repo (`E:\Diablo2`), dấu `/`. Đây là **dữ liệu**: không có code, không có file asset nào được copy; GLB trỏ tới `ashlar/Art_Final/Resource_3D_Optimized/`, texture trỏ tới `ashlar/art/textures/...` (cùng ảnh) hoặc `lookdev-lab/assets/...` (khi lab đã xử lý).

## Nguồn gốc (để xuất lại sau này)

| Cái gì | Ở đâu trong `lookdev-lab/` |
| --- | --- |
| Scene (`?scene=act1PoppyReach`) | `src/scenes/index.js` → `new Act1OutdoorScene(app, 'poppyReach')`, `src/scenes/act1Outdoor.js` |
| PLAN của map (asset, lớp đất, nước, đường, mood, far) | `src/env/act1/maps/poppyReach.js` |
| Đánh giá plan → vị trí, độ cao, nước, đường, mặt nạ | `src/env/act1/outdoor.js` `evaluatePlan(PLAN)` |
| Dựng 3D / mood | `src/env/act1/outdoorBuild.js`, `blockout.js` |
| Cánh đồng, khói ngủ, đất xa | `src/env/act1/meadow.js` (thuần JS) |

Script xuất: `E:\tmp_ashlarlab\extract\export-outdoor.mjs poppyReach act1PoppyReach` (ngoài repo): import trực tiếp các module JS thuần bằng node và ghi số đã giải (không chép tay). Chạy lại sau khi sửa map.

## Hệ toạ độ

three.js, tay phải, **Y lên**, mét. x = đông, z = nam (về phía camera mặc định, nhìn bắc), y = độ cao (mực nước chuẩn 0). Bounds: x -100…100, z -128…128.
`yawDeg` = góc quanh +Y, độ, quy ước three.js (`rotation.y = yawDeg·π/180`; mặt trước = +z cục bộ, hướng (sin yaw, cos yaw): 0 = nam, 90 = đông, 180 = bắc, −90 = tây). `rotationEulerDeg` = [x, y, z] Euler.

## File

| File | Nội dung |
| --- | --- |
| `placements.json` | `assets` (bảng asset theo id), `objects` (1.050 vật đặt), `far` (0 vật xa + đồi), `meadow` (cánh đồng/khói/đất xa) |
| `scene.json` | bounds, nước, đường (điểm gốc + đã làm mượt), sàn gỗ, lớp đất + luật vẽ, scatter, đèn (y đã giải), blockers, markers, segments, spawn, views, **`lighting`** (mọi mood), HDR |
| `terrain/heightmap.json` | độ cao cuối cùng 401 × 513, ô 0.5 m (`index = j·nx + i`, `x = x0 + i·cell`, `z = z0 + j·cell`; nội suy song tuyến đúng `W.height(x, z)`) |
| `terrain/splat0.png`, `splat1.png` | mask lớp đất 896 × 896 phủ vuông 256 m |

### `objects[]`

`uid, asset, file, node?, name, tag, position [x, y, z] (y đã giải theo mặt đất/sàn; gốc = tâm đáy), yawDeg, rotationEulerDeg, scale [x, y, z] (scale đặt theo GLB của lab), scaleForOptimizedGlb (= scale × labFromOptimized.uniformScale), collide, scatter?`

Số lượng: **1.050 vật** trong `objects` (+ 0 vật xa trong `far`); phân loại chung của cả hai: 377 mô hình giải ra GLB optimized (gồm 19 mảnh kit legacy, 27/10) + 0 mô hình chưa có bản optimized + 7 blockout (hộp do lab vẽ, chưa có GLB) + 666 vật procedural (thẻ cỏ / lau / sậy / hoa: billboard của lab, không có GLB).

### `assets{}` và cách ráp với GLB optimized

- `file`: GLB **optimized** (`ashlar/Art_Final/Resource_3D_Optimized/map/...`) hoặc `null` nếu chưa có; khi `null` có `fallbackLabFile` (đường lab, chỉ tham khảo), `labOrigin`, `reason`.
- `kind`: `glb` | `kit-piece` (mảnh trong kit nhiều mesh; `node` mô tả tên mesh) | `blockout` | `procedural`. `status` của asset có GLB: `matched` | `matched-variant` | `unmatched`.
- `labFromOptimized`: GLB lab = GLB optimized × `uniformScale` (đo từ chiều cao bbox) + yaw đã nướng sẵn + đặt lại gốc ở tâm đáy. Các GLB optimized ở khung nguồn (≈ 1 m, pivot tâm đáy). Ráp: `compose(position, rotationY(yawDeg), scaleForOptimizedGlb)`, cộng yaw nướng sẵn của file lab (`horizontalExtents` cho biết xoay ¼ vòng hay không; **yaw 180° và yaw chỉnh nhỏ không suy ra được từ bbox**, nhìn bằng mắt).
- `cutBoxesLabGlbFrame` / `pivotLabGlbFrame`: phần cắt / pivot của vài asset (ở khung GLB lab; bản `...OptimizedFrameApprox` chỉ chia cho k).

Asset là biến thể của lab: không có. Asset có kích thước lab lệch hơn 6 % so với hệ số k đều (biến thể được dựng lại; so bằng mắt): `N-PR03` (12.7 %), `N-PR05` (6.5 %), `A22.1` (6.9 %). Asset có xoay ¼ vòng nướng sẵn: không có.

Blockout (chưa có GLB, lab vẽ hộp, shape/kích thước ở `assets.<id>`): `A08.2-stile` Squeeze stile in a drystone wall; `A08.3` Abandoned hillside farmhouse; `A08.5` Field gate between stone posts; `N-PR01` Abandoned reaping (sheaves, scythe, straw hat).

### Mảnh kit legacy (đã optimized 27/10)

Trước đây 19 vật ở đây chưa có bản optimized (kit camp / nature / palisade / fence / shrubs không thuộc ASHLAR). Ngày 27/10 từng mảnh được tách khỏi GLB kit của lab, chạy qua Xưởng Lowpoly GLB và đặt vào `ashlar/Art_Final/Resource_3D_Optimized/map/legacy/<kit>/<mảnh>/` (manifest: `act: "legacy"`, id `L_*`). Các GLB này **cùng khung toạ độ và kích thước thật như lab** (không phải khung nguồn ≈ 1 m như GLB act-01): `labFromOptimized.uniformScale = 1`, `scaleForOptimizedGlb = scale`, không có yaw nướng sẵn; `status: "matched-legacy"`. Hộp cắt và pivot (`cutBoxesLabGlbFrame`, `pivotLabGlbFrame`) dùng thẳng cho GLB optimized.

| Asset | Số vật | GLB optimized (trong `Resource_3D_Optimized/`) | Nguồn (mảnh kit lab) |
| --- | --- | --- | --- |
| `N-PR06` | 1 | `map/legacy/kit-camp-animals/trough/legacy_camp-animals_trough.glb` | `lookdev-lab/assets/samples/kit-camp-animals.glb` |
| `N-PR07` | 1 | `map/legacy/kit-camp-storage/sacks/legacy_camp-storage_sacks.glb` | `lookdev-lab/assets/samples/kit-camp-storage.glb` |
| `N-PR08` | 1 | `map/legacy/kit-camp-animals/wheelbarrow/legacy_camp-animals_wheelbarrow.glb` | `lookdev-lab/assets/samples/kit-camp-animals.glb` |
| `N-PR09` | 1 | `map/legacy/kit-camp-clutter/straw/legacy_camp-clutter_straw.glb` | `lookdev-lab/assets/samples/kit-camp-clutter.glb` |
| `N-PR10` | 14 | `map/legacy/kit-shrubs/shrub_12/legacy_shrubs_shrub_12.glb` | `lookdev-lab/assets/samples/kit-shrubs.glb` |
| `N-PR11` | 1 | `map/legacy/kit-wooden-fence/broken_pair/legacy_wooden-fence_broken_pair.glb` | `lookdev-lab/assets/samples/kit-wooden-fence.glb` |

Không còn vật nào chưa có bản optimized (không tính blockout/procedural).

## Lớp đất và nước

`scene.json` → `groundLayers`: 8 lớp (lớp 0 phủ khắp nơi: `BIO02_meadow`), mỗi lớp có `tile` (m) và `maps` albedo / height / normal / roughness; mỗi map có `ashlarSource` (ảnh ashlar cùng nội dung, ưu tiên) và `labFile` (bản của lab). Nếu `ashlarSource` là `null` dùng `labFile` (các lớp `DW_*` Dark Wood đã qua xử lý seam/flatten; `ashlarOriginFolder` ghi thư mục gốc). `splat0.png` R,G,B,A = lớp 1..4; `splat1.png` R,G,B = lớp 5..7, A = độ ướt; giá trị/255 = độ phủ lớp i lên các lớp dưới (thanh "Độ mịn" = 0,8 mặc định); hàng 0 = z = `originZ`; chưa blur. Luật vẽ gốc: `paintRules`. Nước: `fen` (mực 0).

## Ánh sáng (mood)

**2 mood**, mặc định (cũng là mood khi Play): **`day`**. Giá trị là bản **đã sáng hơn ngày 10-23** (hemi, mặt trời/trăng, envI, exposure; nhãn "Play moods brightened 10-23" trong file map); bản cũ ở `tmp/act1-base-maps/BRIGHTNESS.md` không dùng.

`scene.json` → `lighting`: `moods.<id>.raw` = đúng giá trị trong `PLAN.moods`; `moods.<id>.resolved` = những gì scene tính ra (hemisphere sky/ground/intensity, mặt trời: màu hex theo Kelvin, hướng đơn vị, vị trí đèn, đích; env + cường độ; nền; `skyTint`; `post` = tone mapping, exposure, fog, grade; flags, levels human/perfection/windows, mưa/sương, sao; và **`lights`**: mọi đèn điểm/lửa của map với vị trí, màu hex, cường độ, tầm (`range`, tức distance), `on` theo mood, nhấp nháy). Decay của PointLight = 2 (mặc định lab). 2 đèn thật (≤ 8), còn lại là quầng sáng (glow).

| Mood | Nhãn | hemi | env (id, cường độ) | exposure | tone mapping | fog | mặt trời / trăng (cường độ, K, elev, az) | ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `day` (**mặc định / Play**) | Poppy Reach · ngày u ám | 2.6 | hdri-overcast 0.48 | 0.8 | aces | #a2a99f ρ0.0072 | 0.36, 6600 K, 66°, -160° |  sương 0.35 |
| `lookdev` | Soi texture · sáng đều | 2.4 | hdri-overcast 0.25 | 0.2 | aces | tắt | 1.1, 5600 K, 50°, -135° |  |

`lighting.sceneDefaults` = `ACT1_OUTDOOR_DEFAULTS` (tham số scene: mưa, sương, độ mịn, ...). Phần `resolved` được **port** từ `scenes/act1Outdoor.js applyTime()` và `env/act1/outdoorBuild.js applyMood()/lightOn()` (các file này cần THREE/DOM) vào script xuất; `raw` đọc thẳng bằng node.

## Seed

Map viết tay (không có generator); `PLAN.seed` = 1106. Scatter: `scene.json` → `scatters[].seed`, kết quả đã nằm trong `objects` (trường `scatter`). Thẻ cỏ procedural khi dựng: `rng(9091)` trong `outdoorBuild.js` (chỉ độ nghiêng/màu khi vẽ).

### Cánh đồng, khói, đất xa (`placements.json` → `meadow`)

- `meadow.field`: tham số cánh đồng (seed, mật độ, drifts, rank, breathe, clear, apron).
- Đếm: 34.077 cụm hoa (trong đó 11.103 trên đất xa ngoài bounds) + 28.597 nhúm cỏ: **quá nhiều cho JSON nên KHÔNG xuất từng instance** mà xuất **seed + tham số** (`field.seed`, `rng(seed·7919 + 17)`, lưới jitter `field.cell` m): chạy lại `fieldInstances(world, { density: 1, apronY })` trong `lookdev-lab/src/env/act1/meadow.js` (thuần JS, xác định) cho đúng các instance; ghi chú stride ở `meadow.instancesNote` (hoa: x, y, z, yaw, cao, tint, biến thể; cỏ: x, y, z, yaw, cao, rộng, ô atlas·10 + tone).
- `meadow.smoke`: vùng khói ngủ (zones: tâm, bán kính, xoay, chu kỳ, làn đường bị che) và `meadow.apron`: đất xa (`apronHeight(world)`, chỉ xuất tham số).

## Không xuất / chưa giải

- `deepWalls` (tường nước sâu cho nav của Play): suy ra được từ heightmap + mực nước (`W.deepWalls`).
- Thẻ billboard (cỏ, lau, sậy, hoa) có vị trí nhưng không có mô hình; texture atlas ở `scene.json` → `cards`.
- Lưới đi bộ (walk grid) của Play: dựng lại bằng `W.walkGrid`.
