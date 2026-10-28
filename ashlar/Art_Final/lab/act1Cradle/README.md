# act1Cradle — The Cradle (Act I, nội thất)

Đấu trường hình tròn của Cradle: ánh trắng sữa đứng yên của Mercy, đèn ngủ (nightlights) tắt dần từng cái, tấm chăn, nôi, màn vải; không có tường ngoài (các ô "void" tan vào bóng tối).

Đường dẫn tính từ gốc repo (`E:\Diablo2`), dấu `/`. Đây là **dữ liệu**: không có code, không có file asset nào được copy; GLB trỏ tới `ashlar/Art_Final/Resource_3D_Optimized/`, texture trỏ tới `ashlar/art/textures/...` (cùng ảnh) hoặc `lookdev-lab/assets/...` (khi lab đã xử lý).

## Nguồn gốc (để xuất lại sau này)

| Cái gì | Ở đâu trong `lookdev-lab/` |
| --- | --- |
| Scene (`?scene=act1Cradle`) | `src/scenes/index.js` → `new Act1InteriorScene(app, 'cradle')`, `src/scenes/act1Interior.js` |
| PLAN + KIT của map (phòng, tường, asset, đèn, mood, camps) | `src/env/act1/maps/cradle.js` |
| Engine thuần JS: `compile(PLAN, KIT)` → phòng, sàn, tường, placements (`expandPlacements`), đèn, mặt nạ | `src/env/act1/interior.js` |
| Dựng 3D / blockout | `src/env/act1/interiorBuild.js`, `interiorBlockout.js` |

Script xuất: `E:\tmp_ashlarlab\extract\export-interior.mjs cradle act1Cradle` (ngoài repo): chạy `compile` bằng node và ghi kết quả. Chạy lại sau khi sửa map.

## Hệ toạ độ

three.js, tay phải, **Y lên**, mét. x = đông, z = nam (về phía camera mặc định, nhìn bắc), y = độ cao sàn. Bounds: x -22…22, z -36…34 (+ vành tối `apron` 16 m quanh mép "void").
`yawDeg` = góc quanh +Y (three.js; mặt trước = +z cục bộ: 0 = nam, 90 = đông). Scale đều.

## File

| File | Nội dung |
| --- | --- |
| `placements.json` | `assets` (toàn bộ KIT), `objects` (**111** vật đặt đã giải: cấu trúc, hàng, vòng, scatter) |
| `scene.json` | bounds, sàn (lớp đất, luật vẽ, splat), texture tường, `rooms`, `wallRuns`, `openings`, `stairs`, `ramps`, `waters`, `voids`, **34 đèn** (đã giải), `lightGroups`, markers, camps, segments, route, views, atmosphere, rain, **`lighting`** (mọi mood) |
| `terrain/floor-heightmap.json` | độ cao sàn tại tâm ô 0,5 m (null = không có sàn) |
| `terrain/splat0.png`, `splat1.png` | mask lớp đất 608 × 608 phủ vuông 102 m, gốc (-51, -52) |

### `objects[]`

`index, asset, file, name, tag, source (structure|row|ring|scatter), position [x, y, z], yawDeg, rotationEulerDeg, scale, scaleForOptimizedGlb, void (vẽ trong bóng tối ngoài sàn, không đặc), solid, lightGroup?, followGroup?, light?`

111 vật = 109 giải ra GLB optimized + 0 chưa có bản optimized + 2 blockout (hộp do lab vẽ, chưa có GLB: `B05` The Hospice Mother (boss blockout) ×1; `N-CR01` Linen floor runner ×1).

### `assets{}` (KIT) và GLB optimized

`kind`: `glb` | `kit-piece` | `blockout`; `file` = GLB optimized (`ashlar/Art_Final/Resource_3D_Optimized/map/...`) hoặc `null`; `sizeM`, `shape` (blockout), `light` (đèn gắn vào asset), `cutBoxesLabGlbFrame`, `globe`, `collider`, ... `labFromOptimized.uniformScale` = GLB lab ÷ GLB optimized (GLB optimized ở khung nguồn ≈ 1 m): ráp `compose(position, rotationY(yawDeg), scaleForOptimizedGlb)` cộng yaw nướng sẵn của file lab (xem `horizontalExtents`; yaw 180° và yaw nhỏ không suy ra được từ bbox).
Biến thể lab: không có. Lệch hơn 6 % so với k đều: `A14.1` (8.8 %), `A14.5` (28.7 %). Xoay ¼ vòng nướng sẵn: không có.

### Chưa có bản optimized

Vật chưa giải ra GLB optimized: không có.

| File lab (chỉ để tham khảo) | Asset | Lý do |
| --- | --- | --- |
| (không có) | | |

## Ánh sáng

**2 mood**; scene mở mood **đầu tiên** của `PLAN.moods` = **`cradle`** (mặc định, cũng là Play); `lookdev` là mood "Soi texture · sáng đều". Giá trị là bản **đã sáng hơn ngày 10-23** (hemi, envI, exposure, floorTone; nhãn "Play moods brightened 10-23" trong file map); bản cũ (`tmp/act1-base-maps/BRIGHTNESS.md`) không dùng.

`scene.json` → `lighting.moods.<id>.raw` = đúng `PLAN.moods`; `.resolved` = scene tính ra: hemisphere sky/ground/intensity, `lightScale` (nhân mọi đèn), env + cường độ, nền, `skyTint`, `floorTone`, `post` (tone mapping, exposure, fog, grade), `lantern` (vòng sáng quanh hero trên shader đất). Đèn của map: `scene.json` → `lights` (34: 15 thật, còn lại là quầng sáng): `position`, `color` hex, `intensity`, `range` (distance), `kind` (perfection / human / wall), `glow`, `group`, `real`; nhóm đèn: `nightlight` (Đèn ngủ (arena), 10 đèn). Cường độ thực = `intensity` × `lightScale` × mức nhóm × nhấp nháy (human: 1/f; perfection: đứng yên; wall: shimmer chậm). Đèn hero: PointLight 5000 K, distance 7, decay 1,6 (nếu `heroLight`).

| Mood | Nhãn | hemi | env (id, cường độ) | exposure | tone mapping | fog | lights × | floorTone | ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `cradle` (**mặc định / Play**) | Cradle · ánh trắng sữa đứng yên (mặc định) | 1.1 | hdri-night 0.06 | 1.3 | aces | #030304 ρ0.06 | 1 | 0.65 | đèn pin hero 5.2 m |
| `lookdev` | Soi texture · sáng đều | 2.4 | hdri-overcast 0.25 | 0.2 | aces | tắt | 0.35 | 1 | đèn pin hero 5.2 m |

`lighting.sceneDefaults` = `defaultsFor(plan)` của `scenes/act1Interior.js`. Phần `resolved` được **port** từ `scenes/act1Interior.js` (`defaultsFor`, `applyTime`, `applyEffectSettings`) vào script xuất (file đó cần THREE/DOM); `raw` và `lights` đọc thẳng bằng node.

## Seed

`PLAN.seed` = 1112. Hàng có jitter dùng `hashSeed(id:asset:from:to)`, scatter dùng `seed` của từng mục (`env/act1/interior.js`): xác định, không có gì ngẫu nhiên lúc chạy; kết quả đã nằm trong `objects`.

## Không xuất / chưa giải

- Sàn lấy mẫu lại 0,5 m (lab dùng raster 0,25 m); hàm chính xác là `floorY` của `compile()`.
- Mô hình của lab không có hình học tường xuất sẵn: `rooms`, `wallRuns`, `openings` đủ để dựng lại tường (module GLB tường nếu có ở `wall.module`).
- Blockout: hình hộp do `interiorBlockout.js` vẽ từ `assets.<id>.shape`; chưa có GLB.
