# choiceHands — màn chọn nghề (sáu bàn tay)

Sáu bàn tay thò ra từ bức tường sọ và xương quanh ngọn nến của Gennet, gần như tối đen, chỉ một ngọn nến chiếu sáng. Rê chuột vào một tay thì nó nhích ra, chọn thì nó đưa ra phía người xem, năm tay kia chìm vào bóng tối; nắm vào thì tay vỡ thành bụi. Thứ tự (Hero Concept §3.2 / §9.1): **PB FL OS BR EX PS**. Ảnh key art đối chiếu: `ashlar/art/heroes/_shared/choice_hands/keyart.png`.

Đây là **dữ liệu**, không có code và không có file asset nào được copy. Đường dẫn tính từ gốc repo (`E:\Diablo2`), dấu `/`.

## Nguồn gốc (để xuất lại sau này)

| Cái gì | Ở đâu trong `lookdev-lab/` |
| --- | --- |
| Scene (`?scene=choiceHands`) | `src/scenes/choiceHands.js` (đèn, tường, ledge, nến, dựng tay, `CHOICE_HANDS_DEFAULTS`) |
| Bảng slot, hình học cánh tay, camera, showcase từng nghề, rig ngón | `src/env/choiceHands.js` (thuần JS; `SLOTS`, `armGeometry`, `FRAME`, `KEYART`, `SHOWCASE`, `ARM`, `WALL`…) |
| Chuẩn bị GLB tay + texture tường | `scripts/prepare-choice-hands.py` |
| Tay (GLB nguồn) | `ashlar/3d/heroes/_hands_v1/` |

Script xuất: `E:\tmp_ashlarlab\extract\export-choicehands.mjs` (ngoài repo): import `src/env/choiceHands.js` bằng node, gọi `armGeometry()` cho 6 slot (tỉ lệ tay 1,6 như mặc định) và ghi các số đã giải. Chạy lại sau khi sửa `choiceHands.js`.

## Hệ toạ độ

three.js, tay phải, **Y lên**, mét. x = phải, y = lên, z = về phía người xem. Bức tường nằm ở mặt phẳng z = 0 (đỉnh sọ z = 0, hốc −0,05); mặt trên ledge ở y = 0 (ledge nằm dưới), ngọn nến đứng trên đó. Khung của model tay (đã "prepared"): gốc ở tâm đầu tay áo, **+z dọc cẳng tay về phía đầu ngón**, **+y mu bàn tay**, x ngang.

Quaternion [x, y, z, w]; Euler thứ tự `YXZ`, độ.

## File

| File | Nội dung |
| --- | --- |
| `placements.json` | `assets` (3 model tay + nguồn + khung prepared), `hands` (6 slot đã giải), `wall`, `ledge`, `candle`, `dustMotes` |
| `scene.json` | camera, key art (`KEYART`), nền, môi trường, tường (tile A/B + cách trộn + mask), đèn, `settingsDefaults`, `arm`, thời gian, `showcase` (camera/đèn/hiệu ứng từng nghề), `fxPresets`, `fingerRig` |
| `wall/wall-blend.png` | mask xám 380 × 230 trên tường 3,8 × 2,3 m: tỉ lệ tile B (giá trị/255); hàng 0 = ĐỈNH tường |
| `wall/wall-tone.png` | mask xám 381 × 231 (mỗi đỉnh của plane): độ sáng đỉnh = 0,76 + 0,32 · giá trị/255; hàng 0 = đỉnh |

### `hands[]`

Mỗi tay: `id`, `name`, `quote` (canon, giữ tiếng Anh), `file` (GLB nguồn, hoặc `null` nếu là stand-in), `riggedFile` (chỉ FL), `standInOf`, `pose` (`back` = mu bàn tay hướng người xem, `palm` = ngửa), `mirrorX`, `tint`, `rings`, `authored` (số gốc từ bảng `SLOTS`: lỗ trên tường `entryXY`, góc trong mặt phẳng, độ nghiêng, roll, đoạn nhìn thấy, hệ số `slotScaleK`).

- `atRest`: tay lúc nghỉ. `rootPosition` = lỗ trên tường (vai), `rootQuaternionXYZW`, `rootScale` (= 1,6 × k), `slideLocalZ`, `wristPivotLocalZ`, và **`modelWorldMatrixColumnMajor`** = ma trận thế giới 4 × 4 (cột-chính, như `Matrix4.elements`) của gốc model tay (đầu tay áo) đã gồm cả lật `mirrorX`. Cây nhóm của lab: `root > slide(z = −back) > wrist(z = wristZ) > arm(z = −wristZ, scale.x = mirror ? −1 : 1) > model`.
- `offered`: tư thế khi được chọn: `rootQuaternionXYZW` (qReach), hướng cánh tay, trượt `slideM` = 0,26 m dọc +z cục bộ, cổ tay gập `wristPitchDeg`, vị trí đầu ngón/tâm bàn tay, pháp tuyến lòng bàn tay.
- Phần còn lại (hover, showcase xoay quanh cẳng tay, grip) nằm ở `scene.json` → `arm`, `showcase`, `timesSeconds`.

### Model tay: cẩn thận khung "prepared"

Lab **không** dùng GLB nguồn nguyên bản. `prepare-choice-hands.py` xoay nó cho cẳng tay dọc +z, lật mu bàn tay lên +y, scale đều để dài 0,45 m, đặt gốc ở tâm đầu tay áo và thêm đoạn **tay áo kéo dài 0,6 m** (primitive thứ hai `sleeve_ext`, màu theo vertex, để tay chui vào tường). Mọi số trong thư mục này là ở khung đó. Vì vậy `file` (nguồn thô: dài ≈ 1 m, cẳng tay nghiêng) **không đặt trực tiếp được** bằng các ma trận trên; `assets.<fl|os|br>.preparedLabFile` là GLB lab đúng khung (chỉ làm tham chiếu dự phòng), `preparedFrame` mô tả khung và bbox của nó, `sourceBbox` là bbox của GLB nguồn. Muốn ráp từ GLB nguồn phải chạy lại bước chuẩn bị (hoặc xuất bản prepared vào `ashlar/3d/heroes/_hands_v1/`).

| Slot | GLB nguồn (trong ashlar) | Ghi chú |
| --- | --- | --- |
| FL | `ashlar/3d/heroes/_hands_v1/H2_FL_hand/choice_hands_H2_FL_hand.glb` | tay tĩnh; bản rig `ashlar/3d/heroes/_hands_v1/H2_FL_hand/H2_FL_hand_rig.glb` (lab dùng bản đã nén lại + gắn tay áo từ tay tĩnh) |
| OS | `ashlar/3d/heroes/_hands_v1/H3_OS_hand/choice_hands_H3_OS_hand.glb` | |
| BR | `ashlar/3d/heroes/_hands_v1/H4_BR_hand/choice_hands_H4_BR_hand.glb` | |
| PB, EX, PS | chưa có GLB, chỉ có concept: `.../H1_PB_gauntlet/concept.png`, `.../H5_EX_glove/concept.png`, `.../H6_PS_hand/concept.png` | lab vẽ **stand-in** = bản sao có tint của tay donor (PB ← OS, EX ← FL, PS ← FL) cùng tư thế (`standInOf`) |

### Tường, ledge, nến, đèn

- **Tường**: plane 3,8 × 2,3 m (380 × 230 ô), tâm (0, 1,05, 0), tile sọ A (giữa sáng) và B (vòng tối) trộn bằng `wall-blend.png`. Cách lấy mẫu: `uv = (x / 0,92 + offset[0], y / 0,92 + offset[1])` cho từng tile (`scene.json` → `wall.offsets`, tile tuần hoàn, ảnh hàng 0 = đỉnh), trộn albedo/height, trộn normal theo vector rồi chuẩn hoá; displacement = height × 0,05 (bias −0,05); albedo nhân `[0.8, 0.64, 0.4]`, roughness 0,92, `normalScale` 1,1, vertex tone từ `wall-tone.png`. Lab nướng thành một texture 2304 × 1408 mỗi loại (hàm `composeWallRows`), **chưa xuất ảnh nướng**.
- **Texture tile**: `scene.json` → `wall.tiles.{a,b}.{albedo,normal,height}`: `ashlarSource` = `ashlar/art/textures/wall-ossuary-v1/{albedo1024|normal1024|height1024}/W_skull_wall_{a|b}.png` (cùng ảnh, ưu tiên), `labFile` = bản WebP của lab.
- **Ledge**: box 4,4 × 0,5 × 0,18, `placements.json` → `ledge` (texture đá procedural 256 px sinh bằng noise).
- **Nến**: `placements.json` → `candle` (dish, quai, thân, sáp, 2 giọt sáp, bấc, ngọn lửa billboard, quầng sáng, muội), đặt ở (0, 0, 0,06) tỉ lệ 1,12.
- **Đèn**: `scene.json` → `lights`: hemisphere, spot đổ bóng của nến (góc 1,22 rad, decay 1,05), point "near", fill directional lạnh, class light (điều khiển theo `showcase`). Cường độ thực = `baseIntensity` × `settingsDefaults.candle` × nhấp nháy `candleLevel(t, 3.1)` × lean.
- **Camera** (`scene.json` → `camera`): `fovDeg` 16, vị trí (0; 0,486; 3,6), nhìn (0; 0,392; 0); fov tăng khi khung hẹp hơn key art (công thức ghi ngay đó).
- **Môi trường**: HDR `hdri-night` (Poly Haven, không có trong ashlar; dùng `labFile`) cường độ 0,035; nền `#020202`.

### Seed

Không có generator: cảnh viết tay. `hash01(i, seed)` của `env/choiceHands.js` điều khiển bụi bay (40 hạt đã xuất ở `dustMotes`), mask tường dùng seed noise 11, 12, 21, 22.

## Chưa có bản optimized

`Resource_3D_Optimized` chỉ có `map/`, không có tay. Các GLB tay (FL, OS, BR, bản rig FL) **không có bản optimized**; hướng dẫn dùng nguồn ở bảng trên; file lab chỉ là đường dẫn tham khảo (`lookdev-lab/assets/choice-hands/choice-hand-{fl,os,br,fl-rig}.glb`). Không có placement nào của cảnh này giải ra GLB optimized (0/6).

## Lưu ý / chưa giải

- Texture tile bức tường, key art: link tới `ashlar/...png` cùng ảnh; riêng `hdri-night` chỉ có ở lab.
- Dòng chảy thời gian (hover, reach, showcase, dissolve thành bụi, FX) chỉ xuất bảng tham số, không xuất keyframe.
- Chưa xuất ảnh tường đã nướng 2304 × 1408 (tái tạo bằng `composeWallRows` hoặc theo mô tả ở trên).
