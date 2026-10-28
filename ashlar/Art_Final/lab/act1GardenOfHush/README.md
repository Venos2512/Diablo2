# act1GardenOfHush — Garden of Hush (Act I, nội thất)

Khu vườn của những người ngủ: luống hoa anh túc, người ngủ, kênh tưới, bàn thu hoạch, cổng rễ; ~740 vật đặt và ~270 đèn.

Đường dẫn tính từ gốc repo (`E:\Diablo2`), dấu `/`. Đây là **dữ liệu**: không có code, không có file asset nào được copy; GLB trỏ tới `ashlar/Art_Final/Resource_3D_Optimized/`, texture trỏ tới `ashlar/art/textures/...` (cùng ảnh) hoặc `lookdev-lab/assets/...` (khi lab đã xử lý).

## Nguồn gốc (để xuất lại sau này)

| Cái gì | Ở đâu trong `lookdev-lab/` |
| --- | --- |
| Scene (`?scene=act1GardenOfHush`) | `src/scenes/index.js` → `new Act1InteriorScene(app, 'gardenOfHush')`, `src/scenes/act1Interior.js` |
| PLAN + KIT của map (phòng, tường, asset, đèn, mood, camps) | `src/env/act1/maps/gardenOfHush.js` |
| Engine thuần JS: `compile(PLAN, KIT)` → phòng, sàn, tường, placements (`expandPlacements`), đèn, mặt nạ | `src/env/act1/interior.js` |
| Dựng 3D / blockout | `src/env/act1/interiorBuild.js`, `interiorBlockout.js` |

Script xuất: `E:\tmp_ashlarlab\extract\export-interior.mjs gardenOfHush act1GardenOfHush` (ngoài repo): chạy `compile` bằng node và ghi kết quả. Chạy lại sau khi sửa map.

## Hệ toạ độ

three.js, tay phải, **Y lên**, mét. x = đông, z = nam (về phía camera mặc định, nhìn bắc), y = độ cao sàn. Bounds: x -108…82, z -58…24 (+ vành tối `apron` 12 m quanh mép "void").
`yawDeg` = góc quanh +Y (three.js; mặt trước = +z cục bộ: 0 = nam, 90 = đông). Scale đều.

## File

| File | Nội dung |
| --- | --- |
| `placements.json` | `assets` (toàn bộ KIT), `objects` (**743** vật đặt đã giải: cấu trúc, hàng, vòng, scatter) |
| `scene.json` | bounds, sàn (lớp đất, luật vẽ, splat), texture tường, `rooms`, `wallRuns`, `openings`, `stairs`, `ramps`, `waters`, `voids`, **270 đèn** (đã giải), `lightGroups`, markers, camps, segments, route, views, atmosphere, rain, **`lighting`** (mọi mood) |
| `terrain/floor-heightmap.json` | độ cao sàn tại tâm ô 0,5 m (null = không có sàn) |
| `terrain/splat0.png`, `splat1.png` | mask lớp đất 752 × 752 phủ vuông 214 m, gốc (-120, -124) |

### `objects[]`

`index, asset, file, name, tag, source (structure|row|ring|scatter), position [x, y, z], yawDeg, rotationEulerDeg, scale, scaleForOptimizedGlb, void (vẽ trong bóng tối ngoài sàn, không đặc), solid, lightGroup?, followGroup?, light?`

743 vật = 673 giải ra GLB optimized + 1 chưa có bản optimized + 69 blockout (hộp do lab vẽ, chưa có GLB: `A13.4` Hush bell post ×15; `N-GD06` Shroud web (W07 lair) ×5; `N-GD02` Fen asleep in his row (NPC stand-in) ×1; `N-GD03` Tamsin kneeling by Fen (NPC stand-in) ×1; `N-GD04` The lamp ahead ×1; `N-GD16` Fallen poppy heads and petals ×46).

### `assets{}` (KIT) và GLB optimized

`kind`: `glb` | `kit-piece` | `blockout`; `file` = GLB optimized (`ashlar/Art_Final/Resource_3D_Optimized/map/...`) hoặc `null`; `sizeM`, `shape` (blockout), `light` (đèn gắn vào asset), `cutBoxesLabGlbFrame`, `globe`, `collider`, ... `labFromOptimized.uniformScale` = GLB lab ÷ GLB optimized (GLB optimized ở khung nguồn ≈ 1 m): ráp `compose(position, rotationY(yawDeg), scaleForOptimizedGlb)` cộng yaw nướng sẵn của file lab (xem `horizontalExtents`; yaw 180° và yaw nhỏ không suy ra được từ bbox).
Biến thể lab: `N-GD01` (lab variant "slim" of this asset). Lệch hơn 6 % so với k đều: `A20.3` (9.2 %), `A11.6` (26.6 %), `N-GD01` (60 %), `N-GD07` (32.9 %), `N-GD11` (6.9 %). Xoay ¼ vòng nướng sẵn: `A20.5`, `N-GD08`.

### Chưa có bản optimized

Vật chưa giải ra GLB optimized: `P06` ×1.

| File lab (chỉ để tham khảo) | Asset | Lý do |
| --- | --- | --- |
| `lookdev-lab/assets/act1-extras/act1-p06-poppy-mound.glb` | P06 | monster prop (ashlar/3d/act-01/monsters): not a map prop |

## Ánh sáng

**2 mood**; scene mở mood **đầu tiên** của `PLAN.moods` = **`hush`** (mặc định, cũng là Play); `lookdev` là mood "Soi texture · sáng đều". Giá trị là bản **đã sáng hơn ngày 10-23** (hemi, envI, exposure, floorTone; nhãn "Play moods brightened 10-23" trong file map); bản cũ (`tmp/act1-base-maps/BRIGHTNESS.md`) không dùng.

`scene.json` → `lighting.moods.<id>.raw` = đúng `PLAN.moods`; `.resolved` = scene tính ra: hemisphere sky/ground/intensity, `lightScale` (nhân mọi đèn), env + cường độ, nền, `skyTint`, `floorTone`, `post` (tone mapping, exposure, fog, grade), `lantern` (vòng sáng quanh hero trên shader đất). Đèn của map: `scene.json` → `lights` (270: 15 thật, còn lại là quầng sáng): `position`, `color` hex, `intensity`, `range` (distance), `kind` (perfection / human / wall), `glow`, `group`, `real`; nhóm đèn: không có. Cường độ thực = `intensity` × `lightScale` × mức nhóm × nhấp nháy (human: 1/f; perfection: đứng yên; wall: shimmer chậm). Đèn hero: PointLight 5000 K, distance 7, decay 1,6 (nếu `heroLight`).

| Mood | Nhãn | hemi | env (id, cường độ) | exposure | tone mapping | fog | lights × | floorTone | ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `hush` (**mặc định / Play**) | Garden of Hush · hầm tối (mặc định) | 1.5 | hdri-night 0.08 | 1.3 | aces | #070506 ρ0.035 | 1 | 0.66 | đèn pin hero 6 m |
| `lookdev` | Soi texture · sáng đều | 2.4 | hdri-overcast 0.25 | 0.2 | aces | tắt | 0.35 | 1 | đèn pin hero 5.2 m |

`lighting.sceneDefaults` = `defaultsFor(plan)` của `scenes/act1Interior.js`. Phần `resolved` được **port** từ `scenes/act1Interior.js` (`defaultsFor`, `applyTime`, `applyEffectSettings`) vào script xuất (file đó cần THREE/DOM); `raw` và `lights` đọc thẳng bằng node.

## Seed

`PLAN.seed` = 1111. Hàng có jitter dùng `hashSeed(id:asset:from:to)`, scatter dùng `seed` của từng mục (`env/act1/interior.js`): xác định, không có gì ngẫu nhiên lúc chạy; kết quả đã nằm trong `objects`.

## Không xuất / chưa giải

- Sàn lấy mẫu lại 0,5 m (lab dùng raster 0,25 m); hàm chính xác là `floorY` của `compile()`.
- Mô hình của lab không có hình học tường xuất sẵn: `rooms`, `wallRuns`, `openings` đủ để dựng lại tường (module GLB tường nếu có ở `wall.module`).
- Blockout: hình hộp do `interiorBlockout.js` vẽ từ `assets.<id>.shape`; chưa có GLB.
