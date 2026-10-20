# gametest — Lord of Ruin + terrain ASHLAR

Thư mục này (`E:\Diablo2\ashlar\gametest\`) trước đây là `E:\Diablo2\unhallowed\`; đã được chuyển vào `ashlar/` và đổi tên game thành **gametest**. Tên hiển thị (tiêu đề tab, logo màn hình chính, màn hình loading, thông báo thiết bị/lỗi) đổi ở **mọi chế độ**, kể cả `?ashlar=off`; các định danh nội bộ (khoá `localStorage unhallowed.*`, `window.__UNHALLOWED__`, tiền tố CSS `uh-`, `src/Unhallowed.html`) giữ nguyên.

`src/Unhallowed.html` là bản gốc (bundle Vite/rolldown, three.js r184, mọi thứ procedural) — **không sửa**.
Mọi chỉnh sửa nằm trong `source/` (đã bung ra thành file thường). `dist/gametest.html` là bản build một file, bấm đúp là chạy.

## Cấu trúc

```
src/Unhallowed.html            bản gốc, nguyên vẹn
source/                        NƠI SỬA
  index.html                   khung: head/meta/style, markup <main id="app">, link css + script
  css/style.css                CSS của game (đã format)
  js/manifest.json             danh sách file JS, ĐÚNG THỨ TỰ — gộp thành MỘT module khi chạy/build
  js/vendor-three.js           runtime rolldown + three.js r184 (đừng sửa; game dùng trực tiếp tên minify của nó)
  js/ashlar-terrain.js         [ASHLAR] nạp/giải mã texture từ config.json (không đụng nội bộ game)
  js/ashlar-kits.js            [ASHLAR] đọc GLB kit (Tripo, từ lookdev lab) -> mảng vertex + bitmap texture (không đụng nội bộ game)
  js/game/01..14-*.js          code game, cắt ở ranh giới statement top-level
  fonts/*.woff2                11 font (JS tham chiếu bằng URL tương đối, build mới nhúng data URI)
  assets/ashlar/terrain/       texture đã chuẩn bị (albedo/height/rough + normal map NormalMap-Online) + config.json
  assets/ashlar/kits/          10 kit .glb (copy từ lookdev lab) + config.json (mapping prop -> mảnh kit)
tools/                         unpack.py  prepare_textures.py  prepare_kits.py  nmo_normals.mjs  build.py  serve.mjs  cdp.mjs  diff.py
dist/gametest.html             bản build (~44 MB; CSS, JS, font, texture, kit đều nhúng)
shots/                         ảnh kiểm tra (orig / off / ashlar / kits / matte ...)
```

Các code do mình thêm đều có chú thích `// [ASHLAR]`:
`07-terrain-grass-materials.js` (`ashlarGrassCards`, `ashlarInstall`, specular/roughness trong `fg`, kit: `ashlarKitsInstall` / `ashlarKitNav` / `ashlarKitsBuild`, chỗ gọi grass + kit trong `mg`), `03-areas-level-generation.js` (`kp.runs` ghi lại các đoạn tường, `ashlarKitNav` cuối `Fp`), `14-boot.js` (`ashlarInstall()` + `ashlarKitsInstall()` chạy song song), và `js/ashlar-terrain.js`, `js/ashlar-kits.js`.

## Sửa cái gì ở đâu

| Muốn sửa | Chỗ |
|---|---|
| Layer terrain từng theme, kích thước lặp (m) | `assets/ashlar/terrain/config.json` (`themes`, `layers.*.meters`). Gốc: `lg`/`ug` ở `07-…` |
| Đổi texture | thay file trong `assets/ashlar/terrain/` (đúng kích thước ghi trong config; `*.albedo.webp`, `*.height.png`, `*.rough.png`). Relief yếu/mạnh → `normalStrength` của layer đó |
| Grass card (mật độ, cao/rộng, màu, alphaTest) | `config.json` → `cards.params`; code: `ashlarGrassCards` ở `07-…` |
| Grass kiểu cũ (cỏ lá) / cave | `Hh` ở `07-…` (hàm `Vh` dựng búi) — cave luôn dùng bản gốc |
| Lighting preset từng khu | `bh` ở `06-camera-lighting-presets-postfx.js` |
| Post grade (vignette, grain, saturation…) | `Rh` ở `06-…` |
| Vật phẩm, affix, kỹ năng (dữ liệu) | `02-items-affixes-stats.js` (UI kỹ năng: `11-…`) |
| Khu vực (`Ep`) / sinh level | `03-areas-level-generation.js` |
| Quái (`fm`), AI, combat | `04-monsters-ai-combat.js` |
| Độ khó (`Jm`), mô phỏng thế giới, quest (`ih`) | `05-game-world-simulation-quests.js` |
| Props/công trình, vật liệu | `12-materials-props-structures.js`; render khu vực `08-…` |
| Âm thanh | `13-audio-engine.js` |

Tên file chỉ gần đúng theo nội dung chính; game dùng tên minify (`Kh`, `sg`, `lg`, `Hh`…).

## Vòng lặp dev

```
cd E:\Diablo2\ashlar\gametest
node tools/serve.mjs 8765            # http://127.0.0.1:8765/  — sửa file trong source/, F5 là thấy, không cần build
```
Server tự ghép `js/manifest.json` thành `/js/bundle.js` (một module, giống bản build); texture nạp bằng URL.
Thêm file JS mới → thêm vào `js/manifest.json` đúng thứ tự (mọi file chung một scope).

## Lệnh

Chạy từ `E:\Diablo2\ashlar\gametest\`. `unpack.py` / `prepare_textures.py` / `prepare_kits.py` tự tìm thư mục gốc repo (tổ tiên đầu tiên chứa `lookdev-lab`) nên không phụ thuộc độ sâu thư mục.

```
python -I tools/unpack.py [--force]        # src/Unhallowed.html -> source/ (từ chối ghi đè source/ nếu --force không có; --out DIR để thử)
python -I tools/prepare_textures.py        # lookdev-lab/assets/samples/darkwood-sty-green-* -> source/assets/ashlar/terrain/ (+ config.json; --keep-config giữ config đã sửa tay)
python -I tools/prepare_kits.py             # lookdev-lab/assets/samples/kit-*.glb (những kit có trong assets/ashlar/kits/config.json) -> source/assets/ashlar/kits/
python -I tools/build.py                   # source/ -> dist/gametest.html
node tools/nmo_normals.mjs --install       # dựng lại normal map NormalMap-Online (lái trang web thật bằng Chrome headless, cần mạng) -> <layer>.normal.webp / .normal-albedo.webp
node tools/cdp.mjs --port P --url URL --out shots --suffix S --states town,active-play --freeze   # ảnh chụp headless
python -I tools/diff.py shots A B town ...  # sai khác pixel trung bình giữa hai bộ ảnh
```
`unpack.py` chỉ định dạng lại (esbuild, không minify) và tách font; không đổi tên gì. Build một `source/` không có `assets/ashlar/` (vd `unpack.py --out tmp`) cho ra đúng game gốc.

## Toggle

- mặc định / `?ashlar=all`: ground ASHLAR + grass card + kit props ở town
- `?ashlar=ground`: ground ASHLAR, cỏ lá gốc (kit vẫn bật)
- `?kits=off`: giữ terrain ASHLAR nhưng dùng lại props gốc (nav block gốc, không nạp GLB)
- `?ashlar=off`: đúng hành vi gốc (không nạp gì — không terrain, không kit, không chỉnh sáng)
- `?nmap=off`: town dùng lại normal Sobel của game (`Kh()`) thay vì normal map NormalMap-Online; `?nmap=albedo`: town dùng bản NormalMap-Online dựng từ albedo (để so sánh); mặc định: bản dựng từ height map
- Lỗi nạp/giải mã → `console.warn('[ashlar] …')` và dùng terrain / props gốc. Một kit lỗi chỉ làm các loại prop cần kit đó giữ bản gốc.
- Chỉnh thử không cần sửa file: `window.__ASHLAR_TUNE = { strengthMul: 1.3, meters: { grass: 3.2 }, card: { density: 0.6 }, surface: { specular: 0.3 } }` đặt trước khi boot.
- `window.__ASHLAR` cho biết mode / nmap / nmapThemes / ready / ms / cards / source (`url` hay `inline`); `window.__ASHLAR_KITS` cho biết mode / ready / ms / kits / failed / built (số mảnh, mesh, lửa của area vừa dựng).

## Terrain bớt bóng (matte)

Đo trên ảnh chụp ở camera mặc định (town / moor / fields): albedo ASHLAR tối (tuyến tính ≈ 0.03) nên specular F0 0.04 + env chiếm 35–65 % độ sáng mặt đất. Cách chữa nằm ở `config.json`:

```
"surface": { "specular": 0.15, "roughnessMin": 0.9 }       // nhân specular (direct + env) của đất khô; sàn roughness ngoài vũng
"cards": { "params": { "specular": 0.15, … } }               // cỏ card
```
Vũng nước mưa (`puddle`) giữ nguyên độ bóng. Cave và `?ashlar=off` không đổi (shader chỉ chèn thêm khi ASHLAR đang bật, có trong `customProgramCacheKey`). `specular: 1`, `roughnessMin: 0` = trả lại hình dạng cũ.

## Độ sáng (look) — "sáng hơn một chút"

Sau bản matte, town / moor / fields tối hơn 21–25 % so với trước đó và 16–29 % so với game gốc. Hai chỉnh sửa (chỉ khi ASHLAR bật; `?ashlar=off` giữ nguyên):

```
"surface": { …, "albedoGain": { "default": 1.35, "town": 1.75, "moor": 1.2, "fields": 1.5 } }   // nhân diffuse của ground ASHLAR (số, hoặc theo theme); cave không đổi
"look": { "exposure": 1.1 }                                                                      // toneMappingExposure của renderer (ACES), áp cho cả game kể cả cave
```
Đo luma trung bình khung hình 3D (ẩn #ui-root, 1600×900, seed 42, đóng băng): town 31.05 → **32.41** (+4.4 %), moor (active-play) 22.81 → **23.67** (+3.8 %), fields 28.96 → **30.02** (+3.7 %); bản matte trước đó là 22.24 / 18.37 / 20.15. Pixel gần trắng (max kênh ≥ 250) ở town: 0.507 % (gốc) → 0.529 % (bản matte trước: 0.492 %), tức lửa/bloom gần như không cháy thêm. Gain theo theme vì mỗi khu có tỉ lệ đất/ánh sáng khác nhau. Thử nhanh: `window.__ASHLAR_TUNE = { surface: { albedoGain: 1.5 }, look: { exposure: 1.15 } }`.

## Normal map NormalMap-Online ở town

Normal map của town (grass, dirt, mud, cobble) dựng bằng trang https://cpetry.github.io/NormalMap-Online/ (tools/nmo_normals.mjs lái chính trang đó bằng Chrome headless; không cài lại thuật toán): height map vào, Sobel, level 4, strength = 2× strength của game (`s·17/255`), blur −3, invert Height bật (khớp dấu `Kh()`: R = −∂h/∂x, G = −∂h/∂y), viền lặp 16 px để liền mạch. Xem `params.json` do tool ghi ra (`--out`, mặc định thư mục tạm).

- File: `<layer>.normal.webp` (từ height) và `<layer>.normal-albedo.webp` (từ kênh đỏ albedo, strength khớp RMS độ dốc) — WebP lossless, giống hệt PNG của trang nhưng nhỏ hơn 2.3 lần.
- `config.json`: `"nmapThemes": ["town"]` (theme nào dùng), mỗi layer có `nmap`, `nmapAlbedo`, `nmapScale` (nhân độ dốc khi giải mã, giữ nguyên ≈ 1× = 2× của Sobel gốc; mud 0.75 vì 2× hơi gắt). Chỉnh nhanh: `__ASHLAR_TUNE = { nmapMul: 0.8 }`.
- Texture normal = RGB của map + alpha = height của layer (để blend theo height như cũ); albedo dùng chung texture với moor/fields (không giải mã hai lần). Moor / fields vẫn dùng normal Sobel.
- Đã so sánh: bản từ height ≈ Sobel của game (tương quan R/G 0.998) nhưng mạnh gấp đôi và mượt hơn → viền đá cobble sắc hơn, cỏ/đất có nhấp nhô rõ hơn, không lộ ô lưới/lặp, không lấp lánh, mặt đất vẫn matte; bản từ albedo bám theo bóng vẽ sẵn chứ không theo khối nên phẳng hơn.
- Đổi height → chạy lại `node tools/nmo_normals.mjs --install` (Node ≥ 22, Chrome, Python + Pillow).

## Kit props ở town (GLB của lookdev lab)

`assets/ashlar/kits/config.json` quyết định mảnh kit nào thay prop nào; sửa file đó rồi F5 (dev) hoặc build lại. `python -I tools/prepare_kits.py` chép các `kit-*.glb` được liệt kê trong `"kits"` từ `lookdev-lab/assets/samples/` (xoá file thừa, kiểm tra mọi `piece` có tồn tại). Chỉ town dùng kit (`"themes"`).

- `"kits"`: khoá → file GLB. `piece` = `<khoá>/<tên node>`, ví dụ `tents/tent_01_ridge`.
- Mỗi entry: `fit {x|y|z|max: mét}` hoặc `scale`, `yaw` (độ), `y` (mét), `off [dx, dz]` (hệ toạ độ của prop), `fire [[x,y,z]]` (điểm lửa, mét gốc của mảnh), `size`. `kind.pick`: `sequence` (xoay vòng theo thứ tự prop) hoặc `variant`; `kind.nav`: bán kính nav block khi kit bật (không bao giờ nhỏ hơn bản gốc).
- `"walls".palisade`: tường cọc được lát bằng mảnh palisade theo từng đoạn (`kp.wall` ghi vào `layout.runs`), kéo giãn nhẹ theo chiều dọc để vừa đúng đoạn, không lấn vào cổng; `braces: "out"|"in"` chọn phía chống xiên, `zw`/`brace` của mỗi mảnh là mặt phẳng cọc và phía chống (đo từ hình học).
- Vật liệu kit: MeshStandardMaterial matte (metalness 0, roughness 0.95, specular ×0.3, bỏ metal map của Tripo), base colour + normal map (tents, palisade), anisotropy 8; GLB không có TANGENT nên three dùng tangent đạo hàm và `normalScale.y` bị đảo dấu (giống GLTFLoader); `maxTexture` thu nhỏ texture nếu cần tiết kiệm VRAM.
- Các mảnh cùng kit trong một ô 24 m gộp thành một mesh tĩnh (ít draw call); bóng đổ và nhận bóng như prop gốc.
- Giữ nguyên bản gốc: palisadeTower, gateArch, well, cart, banner (mảnh kit chỉ là cột trần), mọi object tương tác (campfire, stash, waypoint, exit) và NPC.

| Prop gốc | Mảnh kit |
|---|---|
| `tent` (6) | ridge, a_frame, sagging (wall tent), bell, lean_to, pup — xoay vòng |
| `bigTent` (lều Isolde) | tentb hospital (xoay 90°) |
| `stall` | v0 market_stall, v1 cart_awning |
| `palisade` (tường) | wall_stake, wall_crossbar, wall_end, wall_lean, wall_short — lát theo đoạn, chống xiên ra ngoài |
| `forge` | stations forge (lửa tại hố than) |
| `anvil` | training anvil |
| `weaponRack` | v0 weapon_rack, v1 shield_rack |
| `bench` | log_bench |
| `logPile` | kitchen firewood |
| `crate` | v0 strongbox, v1 crate_stack, v2 spilled_crate |
| `barrelProp` | v0/v1 barrels (v1 xoay 90°), v2 barrel_cradle |
| `sack` | sacks |
| `hayBale` | haystack |
| `bedroll` | seating bedroll |
| `torchPost` | v0 torch (lửa ở ngọn), v1 brazier |

- `"footprint": { area, maxY, skip }`: sau khi đặt, mọi ô nav có ≥ `area` m² bề mặt kit (dưới `maxY` m) bị chặn — nên anvil, rack, stall lệch, forge, cọc palisade và chống xiên không thể đi xuyên. `walls.palisade.offset` đẩy tường ra ngoài (0.4 m) để chống xiên không thò vào trại.
- `kind.extras`: mảnh phụ đặt theo offset thế giới từ prop (`at: [dx, dz]`). `bigTent` có trụ đèn lồng (`lighting_03_lantern_post`) ngay dưới ngọn lửa của đèn layout (lửa không còn lơ lửng cạnh lều chữa bệnh).
- Kế hoạch đặt (`ashlarKitPlan`) tính một lần cho mỗi layout, dùng chung cho nav (cuối `Fp`, sau khi có `regions.town`) và cho dựng mesh.

Nav: khi kit bật, bán kính block của tent 1.6→2.0, bigTent 2.6→2.9, stall 1.4→1.9, forge 1.4→2.0, logPile 0.9→1.2, crate 0.55→0.75, barrelProp 0.45→0.7, sack 0→0.5, hayBale 0.6→1.0 (áp dụng cuối `Fp`, không đổi RNG/layout; `?kits=off` giữ số gốc).

## Bảng mapping (town / moor / fields; cave giữ nguyên)

| Terrain gốc | ASHLAR (green, `darkwood-sty-green-*`) | Lặp |
|---|---|---|
| grass | grass | 2.8 m |
| grassDry (fields) | grass — ASHLAR không có biến thể cỏ khô, nên fields chuyển sang xanh | 2.8 m |
| dirt | dirt | 2.8 m |
| mud | mud (cave vẫn dùng `mud` gốc) | 2.8 m |
| cobble (town) / flagstone (moor, fields) | cobble: tile 500×1290 ghép 5×2 → 2048², đá ≈ 0.55 m | 8.3 m |

`normalStrength` được hiệu chỉnh để độ nghiêng trung bình bằng normal map của lab (grass 0.20, dirt 0.21, mud 0.41, cobble 0.30), vì `Kh()` của game dựng normal bằng Sobel không chuẩn hoá theo độ phân giải. Height cobble lấy từ độ sáng ảnh (làm mờ 1.5 px), roughness 0.80 (đá) … 0.92 (khe).
Grass card: atlas 2×2, 3 quad chéo, mật độ 0.38 búi/m² (cỏ lá gốc tới 2.4), cao 0.5–0.95 m.

## Giới hạn đã biết

- Độ sáng: xem mục "Độ sáng (look)" — chỉ `albedoGain` của ground và `look.exposure` toàn game; preset ánh sáng `bh` và post `Rh` không đổi.
- Grass card thưa hơn cỏ lá gốc (có chủ ý, tránh đè texture); tăng `cards.params.density` nếu muốn dày hơn.
- Cỏ fields không còn vàng khô (không có asset ASHLAR tương ứng).
- Card chỉ có ở theme không phải cave; cave không đổi.
- Matte làm mặt đất tối đi ~20 % luma khung hình; đã bù bằng `albedoGain` + `look.exposure` (không tăng specular, để mặt đất vẫn matte).
- Kit + normal map: dist nặng ~44 MB (10 GLB × ~1.2 MB + 2 texture 2048² mỗi kit nạp lên GPU); hạ `material.maxTexture` trong kits/config.json nếu cần. Mảnh palisade có chống xiên hai phía (07/12) thò ra trong ≤ 1 m dải đã bị chặn; `braces` đặt `out`.
- Ảnh chụp cùng một bản build vẫn lệch nhau do film grain và lửa (xem `diff.py`, so với “noise floor”).
- Nav town khi có kit hẹp hơn bản gốc ≈ 12 % số ô đi được (1184 so với 1350 ô, seed 42) vì chặn đúng theo hình mô hình; mọi NPC / object (healer, smith, sage, captain, stash, waypoint, campfire, exit) vẫn tới được.
- `?nmap=albedo` trong `dist/` cần cả hai bộ normal map nhúng (dist ≈ +12 MB so với chỉ bản height).
- `source/index.html` mở trực tiếp bằng file:// sẽ không chạy (`js/bundle.js` do serve.mjs/build tạo) — dùng dev server hoặc `dist/`.
