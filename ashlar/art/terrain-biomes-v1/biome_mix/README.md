# biome_mix – mẫu biome nhỏ, xem texture trộn vào nhau

Viewer WebGL2 (three r180, không cần build) cho 31 texture của `terrain-biomes-v1`. Mỗi ô (~12 × 12 m) trộn 2–4 layer
theo **height** (albedo + normal + height), góc nhìn ARPG (fov 30°, pitch 55°).

## Chạy

```
cd E:\Diablo2\ashlar\art\terrain-biomes-v1\biome_mix
python -I serve.py            # http://127.0.0.1:8791/biome_mix/   (--port N để đổi cổng)
```

Height map (`../height1024/`) sinh từ normal map: `python -I ../tools/make_heights.py` (không đụng input; `--force` để ghi lại).
Test: `python -I ../tools/test_make_heights.py -v`.

## Điều khiển

- **Overview** (mặc định): lưới 4 × 3 ô, nhãn tên + id layer. Chuột trái kéo = xoay, phải/Shift = pan, lăn = zoom.
- **Click một ô** (hoặc chọn trong GUI "Mẫu") → focus: mẫu đó thành một ô lớn ~32 m. Nút **◀ Overview** để quay lại.
- GUI: blend depth (độ nét), priority suppress, height influence, noise scale, domain warp (áp dụng cho mẫu đang sửa, hoặc tất
  cả nếu bật "áp dụng cho mọi mẫu"); thư mục Layers: visible / tile (m) / normalScale / height bias / anti-tiling offset+turns / coverage hoặc width / soft;
  Hiển thị: normal maps, **debug: weights** (mỗi layer một màu: đỏ-xanh lá-xanh dương-vàng theo thứ tự layer),
  albedo only (unlit); Ánh sáng: azimuth (−45° = trên-trái màn hình), elevation, sun, hemisphere.
- URL: `?sample=<id>` mở focus, `?debug=weights`, `?normals=0`, `?unlit=1`. `window.__BIOME_MIX` = `{ ready, frames, samples, loaded, errors, frameMs }`.

## Mẫu được định nghĩa thế nào (`samples.js`)

Mỗi mẫu = `{ id, name, layers[], depth, over, hi, noise, warp, seed }`, layer xếp từ dưới lên trên:
`{ id: 'BIO01_peat', role, tile (m), ns (normalScale), coverage, width, soft, hBias, variation, rotate, visible }`.

- `role: base` – weight 1 khắp nơi; `patch` – mảng noise fBm bị warp, ngưỡng theo `coverage`; `path` – dải quanh đường cong sin,
  rộng `width` (mét), mép nhiễu; `low` – chỗ trũng của noise tần số thấp (băng/nước/tro đọng); `cell` – vùng kiểu
  Voronoi (mẫu BIO27, 4 vật liệu gặp nhau).
- Trộn (độ mịn 0 = kiểu height-blend): layer bị giảm `over` ở nơi có layer phía trên;
  `score = w + ((height + hBias) × hi + bias) × smoothstep(0, 0.1, w)` (hBias nhân theo `hi`);
  `m = max(score) − depth`; `weight = max(score − m, 0)` rồi chuẩn hoá. Layer có `w = 0` không bao giờ hiện.
  Giảm `depth` = mép gắt hơn (đá nhô lên khỏi bùn rõ hơn), tăng = mềm hơn.
- **Độ mịn (smoothness) 0..1** (mặc định 0.7, `?smooth=`): trộn kết quả trên với một *composite mềm* (layer trên cùng phủ lên
  trước, rampa của mask là vùng chuyển, độ cao đá chỉ đẩy nhẹ mép) theo tỉ lệ = độ mịn; đồng thời nới `soft` của patch/low/path/cell,
  giảm octave cao của noise mask (detail), giảm contrast mask, hạ tần số warp, giảm nhiễu mép path, và hạ `depth`/`hi`.
  0 = kiểu cũ (gắt), 1 = rất mềm. Các thanh trong "Advanced" sửa giá trị hiệu dụng và bị ghi đè khi kéo lại thanh độ mịn.
  Giá trị gốc (độ mịn 0) của soft/depth/hi/warp nằm trong `samples.js`; mục tiêu độ mịn 1 nằm ở `SOFT_TARGET`/`applySmooth` (main.js).
- Mọi mask (patch/path/low/cell, độ rộng, soft, noise, warp) và UV texture tính bằng **mét** trong hệ toạ độ tâm ô: overview là
  vùng 12 m ở giữa, focus là cửa sổ 32 m của **cùng** một trường (overview = cắt giữa của focus, độ rộng mép không đổi).
  `noise` = tần số (1/m), `warp` = mét, `width`/`soft` của path và cell = mét, `soft` của patch/low = ngưỡng noise.
- Anti-tiling (như lab: Inigo Quilez technique 3): mỗi layer có `variation` (0..1 độ lệch UV) và `rotate` (xoay 90°); một noise vùng
  chọn 1 trong 8 offset ảo, 2 lần lấy mẫu được cross-fade (textureGrad, normal xoay ngược). Cùng một biến đổi UV cho albedo+height
  và normal. Mặc định: texture hữu cơ = offset + xoay; BIO20 wet sand = chỉ offset; BIO14 blue ice = offset + nửa vòng xoay (giữ hướng khe nứt chéo); ván gỗ và đá khối có hướng
  (BIO12/16/17/07/08/24/22) = tắt. GUI "Anti-tiling": on/off để so A/B, variation scale (areas/m, mặc định 0.15), macro brightness.
  Mẫu có kết cấu lưới đều bên trong tile (vd. BIO14 blue ice) vẫn còn thấy một phần lưới vì chỉ đổi pha, không xoay.
- `hBias` (−0.3..0.3) mỗi layer: cộng vào height khi trộn. Height map đã chuẩn hoá về median chung (0.5).
- Ẩn layer base: vùng không còn layer nào có weight hiện màu nền trung tính, mép mềm. Chế độ unlit/debug không áp fog.
- URL thêm cho automation: `?smooth=0..1`, `?hi=` `?depth=` `?over=` `?noise=` `?warp=` (mọi mẫu), `?at=0` (tắt anti-tiling), `?varscale=` `?macro=`.
  Lỗi compile shader được đẩy vào `window.__BIOME_MIX.errors` (ready không bật khi có lỗi).
- normalScale mặc định 1.0, riêng BIO09/14/21/23/26 (độ nghiêng trung bình > 15°) là 0.7.

## Kỹ thuật

Một `MeshStandardMaterial` / mẫu + `onBeforeCompile` (giữ nguyên PBR + fog). Mỗi layer = 2 texture: albedo (sRGB) với height
nhét vào alpha (DataTexture dựng lúc load, lật hàng thủ công) + normal (NoColorSpace) → ≤ 8 texture layer + không shadow,
dưới giới hạn 16 sampler. Repeat, mipmap, anisotropy = min(max, 8).

`tools/shoot.mjs` chụp ảnh headless qua CDP (xem comment đầu file); ảnh mẫu nằm trong `shots/`.
`vendor/` = three r180 (MIT, xem `vendor/LICENSE`).
