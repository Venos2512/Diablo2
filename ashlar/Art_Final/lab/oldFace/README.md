# oldFace — Prologue · The Old Face (hầm xương dưới nhà thờ Lychgate)

Hầm tutorial viết tay, cố định: vòng móng ngựa 6 mô-đun xương (bán kính 6 m) với **lỗ hổng** phát sáng trắng lạnh ở đỉnh, hành lang sọ, hốc sập, hốc gõ, bậc thang ngập nước, cầu thang 10 bậc lên cửa nhà thờ với đèn Gennet, ghế canh + bảng "BE KIND TO THEM", giá sáp, tượng không mặt. Không có seed sinh bản đồ: toàn bộ là dữ liệu viết tay; các seed chỉ dùng cho rải chi tiết (xem dưới).

Đây là **dữ liệu**, không có code và không có file asset nào được copy. Đường dẫn tính từ gốc repo (`E:\Diablo2`), dấu `/`.

## Nguồn gốc (để xuất lại sau này)

| Cái gì | Ở đâu trong `lookdev-lab/` |
| --- | --- |
| Scene (`?scene=oldFace`) | `src/scenes/oldFace.js` (mood `TIMES`, mặc định `OLD_FACE_DEFAULTS`) |
| Layout thuần JS (phòng, tường, cầu thang, nước, prop, đèn, view, encounter) | `src/env/oldFace.js` |
| Dressing (sàn, tường, tượng, ghế, sconce, decal, đèn…) | `src/env/oldFaceDecor.js` (class `OldFaceDecor`) |
| Prop GLB / decal / texture | `src/env/dungeon.js` `PROP_IDS`, `src/assets/samples.json` |

Script xuất: `E:\tmp_ashlarlab\extract\export-oldface.mjs` (+ `oldface-stub.mjs`, ngoài repo). Nó chạy **thật** `OldFaceDecor.load()/build()` bằng node với stub cho phần cần trình duyệt (canvas, loader, FlameField), nạp geometry thật của các GLB prop, rồi đọc cây THREE ra số. Chạy lại sau khi sửa `oldFace.js` / `oldFaceDecor.js`.

## Hệ toạ độ

three.js, tay phải, **Y lên**, mét. x = đông, z = nam (về phía camera mặc định, nhìn bắc). Sàn khô y = 0, đáy bể −0,4, mặt nước −0,18, chiếu nghỉ cầu thang +1,8. Khuôn viên khoảng x −34…20, z −13…9.

`rotationEulerDeg` = Euler độ, thứ tự ghi rõ (`YXZ`: yaw quanh +Y trước, rồi nghiêng quanh X). `yawDeg` = quanh +Y (mặt trước = +z cục bộ hướng (sin yaw, cos yaw)). Quaternion là [x, y, z, w].

## File

| File | Nội dung |
| --- | --- |
| `placements.json` | `assets`, `objects` (53 vật có GLB: 36 mô-đun tường xương + 17 prop), `authoredProps` (bảng PROPS gốc), `procedural` (82 mesh dựng bằng code: ghế, chăn, tẩu, bát sữa, giá sáp, tượng, lỗ hổng + sọ + xương, bảng chữ, đèn Gennet, sàn, cầu thang, tường đá Mason, nước…), `instanced` (sconce 14 + que nến 14 + vết muội 14 + 9 điểm sáng), `decals` (52 decal mặt đất) |
| `scene.json` | `layout` (số liệu gốc của `oldFace.js`: FACE, HOLE, DOOR, FLOOD, LEVEL, STAIR, ROOMS, BONE_RUNS, STONE_RUNS, vị trí ghế/giá/tượng/đèn, KNOCK, RAT_HOLES, PATH…), `water`, `terrain` (lớp đất + splat), `lights`, `lightSources`, `flames`, `moods` (`night` mặc định, `lookdev`), `hemisphere`, `environmentMaps`, `textures`, `views` (kèm camera đã tính cho fov 35, 16:9), `segments` (điểm vào A…E), `encounters` (E1–E3), `seeds` |
| `terrain/floor-heightmap.json` | độ cao sàn tại tâm ô 0,25 m (lưới 216 × 88 từ x −34, z −13); `null` = không có sàn |
| `terrain/splat0.png`, `splat1.png` | mask lớp đất 576 × 576 phủ vuông 52 m quanh (−7, −2) |

### Mô-đun tường

`objects[]` với `asset: "wall"`: `position`, `rotationEulerDeg {order: YXZ, x: tilt, y: yaw, z: 0}`, `scale [sx, sy, 1]`, `quaternionXYZW`, `run` (id đoạn tường trong `BONE_RUNS`), `tag` (`collapse`, `warm`, `niches`). Ma trận: `compose(position, quaternion(Euler YXZ(tilt, yaw, 0)), scale(sx, sy, 1))` · GLB `crypt_wall` (rộng 4 m, cao 2,283 m, sâu 0,697 m, mặt trước +z, pivot tâm đáy). `tilt` ≠ 0 chỉ ở mô-đun sập (27°).

### Prop

`asset`: `bonePile` | `candles` | `boulders` | `column`; `position.y` = độ cao sàn − 0,02 (chìm nhẹ), tỉ lệ đều. Mỗi vật có `labSampleId` và `scaleForOptimizedGlb`.

### GLB optimized và hệ số scale

`assets.<kind>.file` trỏ vào `ashlar/Art_Final/Resource_3D_Optimized/map/common/dungeon_v1/...` (`crypt_wall`, `bone_pile`, `candle_cluster`, `flint_boulders`, `broken_column`). GLB của lab = GLB optimized × `labFromOptimized.uniformScale` (đo từ bbox: tường 4,028; bone pile 1,231; candle cluster 0,827; boulders 2,002; column 1,683). Để đặt GLB optimized như lab, dùng `scaleForOptimizedGlb` thay cho `scale` (với tường: `[sx·k, sy·k, k]`). Cả hai đều dùng pivot đáy tâm; yaw chỉnh nhỏ không suy ra được từ bbox.

Cả 53 vật đều đã giải ra GLB optimized; **không có vật nào thiếu bản optimized**.

### Lớp đất

`scene.json` → `terrain.layers` (7 lớp, lớp 0 `BIO08_nave` phủ khắp): `BIO08_nave`, `BIO27_vault`, `BIO27_cradle`, `DG_crypt_rubble`, `DG_crypt_dust`, `DG_crypt_damp`, `BIO07_limestone`; mỗi map có `ashlarSource` (ảnh ashlar cùng nội dung, ưu tiên) và `labFile` (bản WebP của lab). `splat0.png` R,G,B,A = lớp 1..4, `splat1.png` R,G = lớp 5,6 (B không dùng), A = độ ướt; giá trị/255 = độ phủ lớp i lên các lớp dưới; chưa blur (blur `blurMetres` khi upload). Hàng 0 = z = `originZ`.

### Đèn, mood

`scene.json` → `lights` (đèn đã dựng: spot đổ bóng ở lỗ hổng, đèn "cold lift", đèn Gennet + bounce + spill), `lightSources` (cường độ gốc, `steady`/`shimmer`, kelvin), `flames` (ngọn lửa billboard của đèn Gennet), `moods` (hemi, sky/ground, fog, grade, tone mapping, HDR) và `sceneDefaults`. Cường độ thực = giá trị này × `moods[...].lights`, nhấp nháy 1/f (hole: "shimmer" chậm 1 ± 0,06 sin theo chu kỳ 5,3 s).

### Seed

Không có seed bản đồ. Seed rải chi tiết (`scene.json` → `seeds`): decal 9917, coping 6606, sheen nước 4747, lỗ hổng 5521, bảng 9001, giá sáp 2207, tường ấm 3303, prop 7301, không khí 6011, điểm sáng 4417 (mulberry32 của `env/kit.js` / `oldFace.js`). Kết quả đã nằm trong `placements.json`.

## Lưu ý / chưa giải

- **Decal** (`decals.items`, 52 cái): được rải bởi `scatterDecals()` từ mask đất thật nhưng chạy trong stub node, chưa đối chiếu với bản chạy trong trình duyệt; màu tint từng instance (theo màu trung bình texture đất) **không** xuất. Atlas `dungeon-decals-crypt` 4 × 4, ô tính theo hàng từ trên xuống.
- **Mesh procedural**: các mesh gộp (sàn, tường đá Mason, cầu thang, nước, sọ trong lỗ hổng…) chỉ xuất bbox, số đỉnh và transform; hình học sinh ra từ code (`oldFaceDecor.js`) và hàm `floorY`, `STONE_RUNS`, `STAIR`… trong `scene.json.layout`. Hình học đơn giản (box, cylinder…) có `parameters`.
- Các blob bóng tiếp xúc dưới prop không xuất (tính từ bbox prop).
- Vị trí/độ mịn của nước và ngưỡng nav của Play không xuất (suy ra từ `floor-heightmap.json`, `FLOOD`, `LEVEL`).
- `lightSources` bỏ seed nhấp nháy (lab dùng `Math.random()` cho phần lớn).
