# act1Fens — Night Fens → Rook's Weir (Act I, map nền)

Đầm lầy ban đêm dẫn tới đập Rook (Rook's Weir): đường đắp, cọc nhử, xuồng, làng chìm; mood mặc định là đêm.

Đường dẫn tính từ gốc repo (`E:\Diablo2`), dấu `/`. Đây là **dữ liệu**: không có code, không có file asset nào được copy; GLB trỏ tới `ashlar/Art_Final/Resource_3D_Optimized/`, texture trỏ tới `ashlar/art/textures/...` (cùng ảnh) hoặc `lookdev-lab/assets/...` (khi lab đã xử lý).

## Nguồn gốc (để xuất lại sau này)

| Cái gì | Ở đâu trong `lookdev-lab/` |
| --- | --- |
| Scene (`?scene=act1Fens`) | `src/scenes/index.js` → `new Act1OutdoorScene(app, 'fens')`, `src/scenes/act1Outdoor.js` |
| PLAN của map (asset, lớp đất, nước, đường, mood, far) | `src/env/act1/maps/fens.js` |
| Đánh giá plan → vị trí, độ cao, nước, đường, mặt nạ | `src/env/act1/outdoor.js` `evaluatePlan(PLAN)` |
| Dựng 3D / mood | `src/env/act1/outdoorBuild.js`, `blockout.js` |

Script xuất: `E:\tmp_ashlarlab\extract\export-outdoor.mjs fens act1Fens` (ngoài repo): import trực tiếp các module JS thuần bằng node và ghi số đã giải (không chép tay). Chạy lại sau khi sửa map.

## Hệ toạ độ

three.js, tay phải, **Y lên**, mét. x = đông, z = nam (về phía camera mặc định, nhìn bắc), y = độ cao (mực nước chuẩn 0). Bounds: x -128…128, z -96…96.
`yawDeg` = góc quanh +Y, độ, quy ước three.js (`rotation.y = yawDeg·π/180`; mặt trước = +z cục bộ, hướng (sin yaw, cos yaw): 0 = nam, 90 = đông, 180 = bắc, −90 = tây). `rotationEulerDeg` = [x, y, z] Euler.

## File

| File | Nội dung |
| --- | --- |
| `placements.json` | `assets` (bảng asset theo id), `objects` (2.551 vật đặt), `far` (1 vật xa + đồi) |
| `scene.json` | bounds, nước, đường (điểm gốc + đã làm mượt), sàn gỗ, lớp đất + luật vẽ, scatter, đèn (y đã giải), blockers, markers, segments, spawn, views, **`lighting`** (mọi mood), HDR |
| `terrain/heightmap.json` | độ cao cuối cùng 513 × 385, ô 0.5 m (`index = j·nx + i`, `x = x0 + i·cell`, `z = z0 + j·cell`; nội suy song tuyến đúng `W.height(x, z)`) |
| `terrain/splat0.png`, `splat1.png` | mask lớp đất 1024 × 1024 phủ vuông 256 m |

### `objects[]`

`uid, asset, file, node?, name, tag, position [x, y, z] (y đã giải theo mặt đất/sàn; gốc = tâm đáy), yawDeg, rotationEulerDeg, scale [x, y, z] (scale đặt theo GLB của lab), scaleForOptimizedGlb (= scale × labFromOptimized.uniformScale), collide, scatter?`

Số lượng: **2.551 vật** trong `objects` (+ 1 vật xa trong `far`); phân loại chung của cả hai: 244 mô hình giải ra GLB optimized (gồm 44 mảnh kit legacy, 27/10) + 0 mô hình chưa có bản optimized + 16 blockout (hộp do lab vẽ, chưa có GLB) + 2.292 vật procedural (thẻ cỏ / lau / sậy / hoa: billboard của lab, không có GLB).

### `assets{}` và cách ráp với GLB optimized

- `file`: GLB **optimized** (`ashlar/Art_Final/Resource_3D_Optimized/map/...`) hoặc `null` nếu chưa có; khi `null` có `fallbackLabFile` (đường lab, chỉ tham khảo), `labOrigin`, `reason`.
- `kind`: `glb` | `kit-piece` (mảnh trong kit nhiều mesh; `node` mô tả tên mesh) | `blockout` | `procedural`. `status` của asset có GLB: `matched` | `matched-variant` | `unmatched`.
- `labFromOptimized`: GLB lab = GLB optimized × `uniformScale` (đo từ chiều cao bbox) + yaw đã nướng sẵn + đặt lại gốc ở tâm đáy. Các GLB optimized ở khung nguồn (≈ 1 m, pivot tâm đáy). Ráp: `compose(position, rotationY(yawDeg), scaleForOptimizedGlb)`, cộng yaw nướng sẵn của file lab (`horizontalExtents` cho biết xoay ¼ vòng hay không; **yaw 180° và yaw chỉnh nhỏ không suy ra được từ bbox**, nhìn bằng mắt).
- `cutBoxesLabGlbFrame` / `pivotLabGlbFrame`: phần cắt / pivot của vài asset (ở khung GLB lab; bản `...OptimizedFrameApprox` chỉ chia cho k).

Asset là biến thể của lab: `A06.1` (lab variant "open" of this asset; GLB optimized `act1_kit_v1_causeway.glb`); `A17.1` (lab variant "wide" of this asset; GLB optimized `act1_kit_v1_leaning_stones.glb`). Asset có kích thước lab lệch hơn 6 % so với hệ số k đều (biến thể được dựng lại; so bằng mắt): `A06.1` (7.8 %), `A06.6` (27.6 %), `A17.1` (21.7 %), `A17.2` (14.8 %), `N-FN02` (6.9 %), `N-FN08` (6.8 %). Asset có xoay ¼ vòng nướng sẵn: `A04.3`, `A17.6`.

Blockout (chưa có GLB, lab vẽ hộp, shape/kích thước ở `assets.<id>`): `A07.3-door` Gable wall with door arch (the widened Play door); `A07.4-walk` Sunken roof-ridge platform (walked); `N-FN01` The Soothed in procession (P01 stand-in figures, white nightgowns).

### Mảnh kit legacy (đã optimized 27/10)

Trước đây 44 vật ở đây chưa có bản optimized (kit camp / nature / palisade / fence / shrubs không thuộc ASHLAR). Ngày 27/10 từng mảnh được tách khỏi GLB kit của lab, chạy qua Xưởng Lowpoly GLB và đặt vào `ashlar/Art_Final/Resource_3D_Optimized/map/legacy/<kit>/<mảnh>/` (manifest: `act: "legacy"`, id `L_*`). Các GLB này **cùng khung toạ độ và kích thước thật như lab** (không phải khung nguồn ≈ 1 m như GLB act-01): `labFromOptimized.uniformScale = 1`, `scaleForOptimizedGlb = scale`, không có yaw nướng sẵn; `status: "matched-legacy"`. Hộp cắt và pivot (`cutBoxesLabGlbFrame`, `pivotLabGlbFrame`) dùng thẳng cho GLB optimized.

| Asset | Số vật | GLB optimized (trong `Resource_3D_Optimized/`) | Nguồn (mảnh kit lab) |
| --- | --- | --- | --- |
| `A06.1-posts` | 36 | `map/legacy/kit-wooden-fence/run_broken/legacy_wooden-fence_run_broken.glb` | `lookdev-lab/assets/samples/kit-wooden-fence.glb` |
| `A07.6` | 6 | `map/legacy/kit-dead-trees/tall/legacy_dead-trees_tall.glb` | `lookdev-lab/assets/samples/kit-dead-trees.glb` |
| `N-FN04` | 1 | `map/legacy/kit-moor-rocks/low/legacy_moor-rocks_low.glb` | `lookdev-lab/assets/samples/kit-moor-rocks.glb` |
| `N-FN05` | 1 | `map/legacy/kit-camp-crafts/fishing_net/legacy_camp-crafts_fishing_net.glb` | `lookdev-lab/assets/samples/kit-camp-crafts.glb` |

Không còn vật nào chưa có bản optimized (không tính blockout/procedural).

## Lớp đất và nước

`scene.json` → `groundLayers`: 7 lớp (lớp 0 phủ khắp nơi: `BIO01_peat`), mỗi lớp có `tile` (m) và `maps` albedo / height / normal / roughness; mỗi map có `ashlarSource` (ảnh ashlar cùng nội dung, ưu tiên) và `labFile` (bản của lab). Nếu `ashlarSource` là `null` dùng `labFile` (các lớp `DW_*` Dark Wood đã qua xử lý seam/flatten; `ashlarOriginFolder` ghi thư mục gốc). `splat0.png` R,G,B,A = lớp 1..4; `splat1.png` R,G,B = lớp 5..7, A = độ ướt; giá trị/255 = độ phủ lớp i lên các lớp dưới (thanh "Độ mịn" = 0,8 mặc định); hàng 0 = z = `originZ`; chưa blur. Luật vẽ gốc: `paintRules`. Nước: `fen` (mực 0).

## Ánh sáng (mood)

**3 mood**, mặc định (cũng là mood khi Play): **`night`**. Giá trị là bản **đã sáng hơn ngày 10-23** (hemi, mặt trời/trăng, envI, exposure; nhãn "Play moods brightened 10-23" trong file map); bản cũ ở `tmp/act1-base-maps/BRIGHTNESS.md` không dùng.

`scene.json` → `lighting`: `moods.<id>.raw` = đúng giá trị trong `PLAN.moods`; `moods.<id>.resolved` = những gì scene tính ra (hemisphere sky/ground/intensity, mặt trời: màu hex theo Kelvin, hướng đơn vị, vị trí đèn, đích; env + cường độ; nền; `skyTint`; `post` = tone mapping, exposure, fog, grade; flags, levels human/perfection/windows, mưa/sương, sao; và **`lights`**: mọi đèn điểm/lửa của map với vị trí, màu hex, cường độ, tầm (`range`, tức distance), `on` theo mood, nhấp nháy). Decay của PointLight = 2 (mặc định lab). 5 đèn thật (≤ 8), còn lại là quầng sáng (glow).

| Mood | Nhãn | hemi | env (id, cường độ) | exposure | tone mapping | fog | mặt trời / trăng (cường độ, K, elev, az) | ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `night` (**mặc định / Play**) | Night Fens · đêm | 1.9 | hdri-night 0.17 | 1.85 | aces | #18212a ρ0.014 | 0.63, 9500 K, 38°, 150° |  sương 1 sao 1 |
| `still` | Rook's Weir · đêm lặng (ít sương, nước gương) | 1.8 | hdri-night 0.22 | 1.75 | aces | #1a232c ρ0.008 | 0.8, 9000 K, 44°, 170° |  sương 0.45 sao 1.25 |
| `lookdev` | Soi texture · sáng đều | 2.4 | hdri-overcast 0.25 | 0.2 | aces | tắt | 1.1, 5600 K, 50°, -135° |  |

`lighting.sceneDefaults` = `ACT1_OUTDOOR_DEFAULTS` (tham số scene: mưa, sương, độ mịn, ...). Phần `resolved` được **port** từ `scenes/act1Outdoor.js applyTime()` và `env/act1/outdoorBuild.js applyMood()/lightOn()` (các file này cần THREE/DOM) vào script xuất; `raw` đọc thẳng bằng node.

## Seed

Map viết tay (không có generator); `PLAN.seed` = 1104. Scatter: `scene.json` → `scatters[].seed`, kết quả đã nằm trong `objects` (trường `scatter`). Thẻ cỏ procedural khi dựng: `rng(9091)` trong `outdoorBuild.js` (chỉ độ nghiêng/màu khi vẽ).

## Không xuất / chưa giải

- `deepWalls` (tường nước sâu cho nav của Play): suy ra được từ heightmap + mực nước (`W.deepWalls`).
- Thẻ billboard (cỏ, lau, sậy, hoa) có vị trí nhưng không có mô hình; texture atlas ở `scene.json` → `cards`.
- Lưới đi bộ (walk grid) của Play: dựng lại bằng `W.walkGrid`.
