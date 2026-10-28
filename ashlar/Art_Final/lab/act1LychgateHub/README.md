# act1LychgateHub — hub Lychgate có tường (seed 21)

Làng nhỏ có hàng rào cọc gỗ 47,9 × 46,5 m trên nền 64 × 64 m, bao quanh là nước fen đen: cổng chính ở tường S (đường đắp từ mép S), lychgate ở tường N, cửa hầm Barrow ở tường W giữa hai cánh tường đá lửa, nhà sàn Edda trên ao trong, quảng trường (giếng, chuông, sạp Nell, bảng tên), lò rèn Brannoc, ba nhà nữa. Layout do generator `hub-gen/2` sinh, người dùng chọn **seed 21** và đã đóng băng.

Đường dẫn tính từ gốc repo (`E:\Diablo2`), dấu `/`. Đây là **dữ liệu**: không có code, không có file asset nào được copy; GLB trỏ tới `ashlar/Art_Final/Resource_3D_Optimized/`, texture trỏ tới `ashlar/art/textures/...` (cùng ảnh) hoặc `lookdev-lab/assets/...` (khi lab đã xử lý).

## Nguồn gốc (để xuất lại sau này)

| Cái gì | Ở đâu trong `lookdev-lab/` |
| --- | --- |
| Scene (`?scene=act1LychgateHub`) | `src/scenes/index.js` → `new Act1OutdoorScene(app, 'lychgateHub')`, `src/scenes/act1Outdoor.js` |
| PLAN của map (asset, lớp đất, nước, đường, mood, far) | `src/env/act1/maps/lychgateHub.js` |
| Đánh giá plan → vị trí, độ cao, nước, đường, mặt nạ | `src/env/act1/outdoor.js` `evaluatePlan(PLAN)` |
| Dựng 3D / mood | `src/env/act1/outdoorBuild.js`, `blockout.js` |
| Plan hub đóng băng (seed 21, hub-gen/2) | `lookdev-lab/src/env/hubPlans/lychgate-s21.json` (**tham chiếu, không copy**), `src/env/hubOutdoor.js` |

Script xuất: `E:\tmp_ashlarlab\extract\export-outdoor.mjs lychgateHub act1LychgateHub` (ngoài repo): import trực tiếp các module JS thuần bằng node và ghi số đã giải (không chép tay). Chạy lại sau khi sửa map.

## Hệ toạ độ

three.js, tay phải, **Y lên**, mét. x = đông, z = nam (về phía camera mặc định, nhìn bắc), y = độ cao (mực nước chuẩn 0). Bounds: x -32…32, z -32…32.
`yawDeg` = góc quanh +Y, độ, quy ước three.js (`rotation.y = yawDeg·π/180`; mặt trước = +z cục bộ, hướng (sin yaw, cos yaw): 0 = nam, 90 = đông, 180 = bắc, −90 = tây). `rotationEulerDeg` = [x, y, z] Euler.

## File

| File | Nội dung |
| --- | --- |
| `placements.json` | `assets` (bảng asset theo id), `objects` (594 vật đặt), `far` (3 vật xa + đồi) |
| `scene.json` | bounds, nước, đường (điểm gốc + đã làm mượt), sàn gỗ, lớp đất + luật vẽ, scatter, đèn (y đã giải), blockers, markers, segments, spawn, views, **`lighting`** (mọi mood), HDR |
| `terrain/heightmap.json` | độ cao cuối cùng 129 × 129, ô 0.5 m (`index = j·nx + i`, `x = x0 + i·cell`, `z = z0 + j·cell`; nội suy song tuyến đúng `W.height(x, z)`) |
| `terrain/splat0.png`, `splat1.png` | mask lớp đất 640 × 640 phủ vuông 64 m |

### `objects[]`

`uid, asset, file, node?, name, tag, position [x, y, z] (y đã giải theo mặt đất/sàn; gốc = tâm đáy), yawDeg, rotationEulerDeg, scale [x, y, z] (scale đặt theo GLB của lab), scaleForOptimizedGlb (= scale × labFromOptimized.uniformScale), collide, scatter?`

Số lượng: **594 vật** trong `objects` (+ 3 vật xa trong `far`); phân loại chung của cả hai: 93 mô hình giải ra GLB optimized (gồm 58 mảnh kit legacy, 27/10) + 0 mô hình chưa có bản optimized + 0 blockout (hộp do lab vẽ, chưa có GLB) + 504 vật procedural (thẻ cỏ / lau / sậy / hoa: billboard của lab, không có GLB).

### `assets{}` và cách ráp với GLB optimized

- `file`: GLB **optimized** (`ashlar/Art_Final/Resource_3D_Optimized/map/...`) hoặc `null` nếu chưa có; khi `null` có `fallbackLabFile` (đường lab, chỉ tham khảo), `labOrigin`, `reason`.
- `kind`: `glb` | `kit-piece` (mảnh trong kit nhiều mesh; `node` mô tả tên mesh) | `blockout` | `procedural`. `status` của asset có GLB: `matched` | `matched-variant` | `unmatched`.
- `labFromOptimized`: GLB lab = GLB optimized × `uniformScale` (đo từ chiều cao bbox) + yaw đã nướng sẵn + đặt lại gốc ở tâm đáy. Các GLB optimized ở khung nguồn (≈ 1 m, pivot tâm đáy). Ráp: `compose(position, rotationY(yawDeg), scaleForOptimizedGlb)`, cộng yaw nướng sẵn của file lab (`horizontalExtents` cho biết xoay ¼ vòng hay không; **yaw 180° và yaw chỉnh nhỏ không suy ra được từ bbox**, nhìn bằng mắt).
- `cutBoxesLabGlbFrame` / `pivotLabGlbFrame`: phần cắt / pivot của vài asset (ở khung GLB lab; bản `...OptimizedFrameApprox` chỉ chia cho k).

Asset là biến thể của lab: `A02.1` (lab variant "open" of this asset; GLB optimized `act1_kit_v1_lychgate.glb`); `A06.1` (lab variant "open" of this asset; GLB optimized `act1_kit_v1_causeway.glb`). Asset có kích thước lab lệch hơn 6 % so với hệ số k đều (biến thể được dựng lại; so bằng mắt): `A06.1` (7.8 %). Asset có xoay ¼ vòng nướng sẵn: `A15.1`.

### Mảnh kit legacy (đã optimized 27/10)

Trước đây 58 vật ở đây chưa có bản optimized (kit camp / nature / palisade / fence / shrubs không thuộc ASHLAR). Ngày 27/10 từng mảnh được tách khỏi GLB kit của lab, chạy qua Xưởng Lowpoly GLB và đặt vào `ashlar/Art_Final/Resource_3D_Optimized/map/legacy/<kit>/<mảnh>/` (manifest: `act: "legacy"`, id `L_*`). Các GLB này **cùng khung toạ độ và kích thước thật như lab** (không phải khung nguồn ≈ 1 m như GLB act-01): `labFromOptimized.uniformScale = 1`, `scaleForOptimizedGlb = scale`, không có yaw nướng sẵn; `status: "matched-legacy"`. Hộp cắt và pivot (`cutBoxesLabGlbFrame`, `pivotLabGlbFrame`) dùng thẳng cho GLB optimized.

| Asset | Số vật | GLB optimized (trong `Resource_3D_Optimized/`) | Nguồn (mảnh kit lab) |
| --- | --- | --- | --- |
| `PAL.wall_a` | 49 | `map/legacy/kit-palisade/wall_a/legacy_palisade_wall_a.glb` | `lookdev-lab/assets/samples/kit-palisade.glb` |
| `PAL.log2` | 4 | `map/legacy/kit-palisade/wall_a/legacy_palisade_wall_a.glb` | `lookdev-lab/assets/samples/kit-palisade.glb` |
| `N03` | 2 | `map/legacy/kit-camp-kitchen/water_barrel/legacy_camp-kitchen_water_barrel.glb` | `lookdev-lab/assets/samples/kit-camp-kitchen.glb` |
| `N12` | 1 | `map/legacy/kit-camp-animals/wheelbarrow/legacy_camp-animals_wheelbarrow.glb` | `lookdev-lab/assets/samples/kit-camp-animals.glb` |
| `N06` | 1 | `map/legacy/kit-camp-crafts/laundry_line/legacy_camp-crafts_laundry_line.glb` | `lookdev-lab/assets/samples/kit-camp-crafts.glb` |
| `N07` | 1 | `map/legacy/kit-camp-crafts/fishing_net/legacy_camp-crafts_fishing_net.glb` | `lookdev-lab/assets/samples/kit-camp-crafts.glb` |

Không còn vật nào chưa có bản optimized (không tính blockout/procedural).

## Lớp đất và nước

`scene.json` → `groundLayers`: 7 lớp (lớp 0 phủ khắp nơi: `BIO01_peat`), mỗi lớp có `tile` (m) và `maps` albedo / height / normal / roughness; mỗi map có `ashlarSource` (ảnh ashlar cùng nội dung, ưu tiên) và `labFile` (bản của lab). Nếu `ashlarSource` là `null` dùng `labFile` (các lớp `DW_*` Dark Wood đã qua xử lý seam/flatten; `ashlarOriginFolder` ghi thư mục gốc). `splat0.png` R,G,B,A = lớp 1..4; `splat1.png` R,G,B = lớp 5..7, A = độ ướt; giá trị/255 = độ phủ lớp i lên các lớp dưới (thanh "Độ mịn" = 0,8 mặc định); hàng 0 = z = `originZ`; chưa blur. Luật vẽ gốc: `paintRules`. Nước: `fen` (mực 0), `pond` (mực 0.2), `pond-stilts` (mực 0.2).

## Ánh sáng (mood)

**3 mood**, mặc định (cũng là mood khi Play): **`day`**. Giá trị là bản **đã sáng hơn ngày 10-23** (hemi, mặt trời/trăng, envI, exposure; nhãn "Play moods brightened 10-23" trong file map); bản cũ ở `tmp/act1-base-maps/BRIGHTNESS.md` không dùng.

`scene.json` → `lighting`: `moods.<id>.raw` = đúng giá trị trong `PLAN.moods`; `moods.<id>.resolved` = những gì scene tính ra (hemisphere sky/ground/intensity, mặt trời: màu hex theo Kelvin, hướng đơn vị, vị trí đèn, đích; env + cường độ; nền; `skyTint`; `post` = tone mapping, exposure, fog, grade; flags, levels human/perfection/windows, mưa/sương, sao; và **`lights`**: mọi đèn điểm/lửa của map với vị trí, màu hex, cường độ, tầm (`range`, tức distance), `on` theo mood, nhấp nháy). Decay của PointLight = 2 (mặc định lab). 7 đèn thật (≤ 8), còn lại là quầng sáng (glow).

| Mood | Nhãn | hemi | env (id, cường độ) | exposure | tone mapping | fog | mặt trời / trăng (cường độ, K, elev, az) | ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `day` (**mặc định / Play**) | Act I · mưa phùn ban ngày | 2.3 | hdri-overcast 0.4 | 0.75 | aces | #8c958a ρ0.016 | 0.5, 7000 K, 62°, -150° | mưa 0.4 sương 0.55 |
| `night` | Prologue · đêm mưa | 2.2 | hdri-night 0.12 | 1.5 | aces | #1a2228 ρ0.016 | 0.8, 9000 K, 44°, 160° | mưa 1 sương 0.75 |
| `lookdev` | Soi texture · sáng đều | 2.4 | hdri-overcast 0.25 | 0.2 | aces | tắt | 1.1, 5600 K, 50°, -135° |  |

`lighting.sceneDefaults` = `ACT1_OUTDOOR_DEFAULTS` (tham số scene: mưa, sương, độ mịn, ...). Phần `resolved` được **port** từ `scenes/act1Outdoor.js applyTime()` và `env/act1/outdoorBuild.js applyMood()/lightOn()` (các file này cần THREE/DOM) vào script xuất; `raw` đọc thẳng bằng node.

## Seed

Hub: **seed 21**, generator **hub-gen/2**, lần thử 3; layout đóng băng ở `lookdev-lab/src/env/hubPlans/lychgate-s21.json`. Scatter: `scene.json` → `scatters[].seed`, kết quả đã nằm trong `objects` (trường `scatter`). Thẻ cỏ procedural khi dựng: `rng(9091)` trong `outdoorBuild.js` (chỉ độ nghiêng/màu khi vẽ).

## Không xuất / chưa giải

- `deepWalls` (tường nước sâu cho nav của Play): suy ra được từ heightmap + mực nước (`W.deepWalls`).
- Thẻ billboard (cỏ, lau, sậy, hoa) có vị trí nhưng không có mô hình; texture atlas ở `scene.json` → `cards`.
- Lưới đi bộ (walk grid) của Play: dựng lại bằng `W.walkGrid`.
