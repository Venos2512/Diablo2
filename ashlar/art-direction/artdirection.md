# ASHLAR — Art Direction

**Until the Last · Bản chuẩn cho mọi bước tạo ảnh · v2.0 · 21/10/2026**

> Dark fantasy vẽ tay, **stylized vừa phải, đúng mức Diablo Immortal**: hình khối rõ, bề mặt sạch, sáng tối có khối. Một thế giới được giữ lại bằng những mối nối không hoàn hảo, nơi vẻ đẹp hoàn mỹ dần trở thành lời đe doạ.

File này gồm:
- style đã chốt;
- các khối prompt bắt buộc và định dạng sheet;
- màu theo act;
- thứ tự biome theo tiến trình chơi;
- nội dung Prologue, Act I và Act II.

Số liệu chi tiết của từng quái, từng biome và từng nghề nằm ở các file chuyên đề (§15). Bản lý giải dài v1.1 vẫn là [ASHLAR_ART_DIRECTION_VI.md](ASHLAR_ART_DIRECTION_VI.md). **Khi hai file khác nhau về cách vẽ, file này thắng.**

**Nhãn dùng trong file:**

| Nhãn | Nghĩa |
|---|---|
| **Đã chốt** | Quyết định của người dùng |
| **Canon** | World Bible |
| **LD** | Level Design and Atmosphere Guide; mục LD tự gắn *Proposal* được ghi là *(đề xuất LD)* |
| **Đề xuất AD** | Quy tắc sản xuất do file này đặt, sửa được |

---

## 0. Quy tắc bắt buộc khi gen ảnh

Áp dụng cho **mọi** bước tạo hoặc chỉnh sửa ảnh:
- concept sheet hero, quái, asset;
- texture terrain, normal map vẽ bằng `image_gen`;
- ảnh T-pose cho Tripo;
- key art và ảnh cảnh.

1. **Đọc trước khi viết prompt:**
   - §1–§2 (style, mood);
   - §3 (khối prompt);
   - mục theo loại asset: §5 hero, §6 quái, §7 môi trường;
   - §8 (màu theo act);
   - §9–§10 nếu asset thuộc một area cụ thể.
2. **Dán nguyên văn** `STYLE CORE` (§3.1), `CONTENT` (§3.8) và khối theo loại asset (§3.2–§3.7) vào prompt.
   - Phần riêng của asset (thiết kế, palette, kích thước, bố cục) viết sau các khối đó.
   - Không diễn đạt lại style bằng lời khác.
3. **Số liệu lấy từ file chuyên đề, không tự đặt:**
   - kích thước và màu key quái → Quy chuẩn quái;
   - palette biome → Biome và khu vực;
   - thiết kế nghề → Concept hero (§15).
4. **QA §11 cho từng ảnh** trước khi gửi người dùng hoặc đánh dấu chọn. Ảnh trượt thì chạy lại với hậu tố mới (`_v2`, `_r2b`…); **không ghi đè** ảnh cũ.
5. **Lưu prompt cạnh ảnh** (`*.prompt.txt` hoặc trong `_brief/`) để truy lại được.
6. **Thứ tự ưu tiên khi mâu thuẫn:**
   1. quyết định mới nhất của người dùng;
   2. file này (cách vẽ);
   3. World Bible (sự thật thế giới);
   4. Cast, LD;
   5. các file chuyên đề và bản v1.1.
7. **Khi người dùng ra quyết định mới về hình ảnh:** ghi vào §12 và sửa mục liên quan của file này **trước khi** gen tiếp.
8. **Ai tạo ảnh:** Astra (`codex` / `gpt-6-astra`), theo `Agent.md`. Cách chạy ở §13.

---

## 1. Style chung (Đã chốt)

**21/10/2026, người dùng xác nhận: ASHLAR phải hơi stylized, như Diablo Immortal.**

Quyết định này nối tiếp các lần chốt trước (§12):
- terrain `stylized2` ít chi tiết;
- concept quái "bám style Diablo Immortal, đừng render nhiều detail texture";
- quái "bám Diablo hơn, họ Immortal / Diablo III";
- hero v3–v5 cách điệu hơn và giảm texture.

### 1.1 Vị trí trên thang style

| Mức | Ví dụ | ASHLAR |
|---|---|---|
| Realistic, ảnh thực | Diablo IV, PBR scan, ảnh chụp | Không dùng |
| **Stylized vừa phải** | **Diablo Immortal** (cùng họ Diablo III) | **Chuẩn** |
| Stylized mạnh, hoạt hình | WoW, Fortnite, chibi, anime, cel/toon | Không dùng |

### 1.2 "Hơi stylized" khi vẽ nghĩa là gì

Bảng dưới là cách hiểu để gen (đề xuất AD, rút từ các bản đã qua người dùng). Người dùng sửa thì cập nhật bảng.

| Hạng mục | Làm | Không làm |
|---|---|---|
| **Tỷ lệ** | Dựa trên giải phẫu thật; người trưởng thành khoảng 7 đầu. Chỉ cường điệu **đặc trưng nhận diện**: hero có bàn tay, bàn chân, đạo cụ nghề to hơn thật 10–15 %; quái được đẩy mạnh đặc trưng riêng (tay dài, lưng gù, sừng, khớp xương) theo ngôn ngữ quái Diablo. | Đầu to kiểu chibi; cơ bắp siêu anh hùng; phóng đại mọi bộ phận cùng lúc. |
| **Hình khối** | Silhouette đọc được ở thumbnail; khối lớn trước. Chi tiết gom vào đầu, thân trên, tay, vũ khí và điểm kể chuyện. | Rải chi tiết đều khắp hình. |
| **Bề mặt** | Vẽ tay: mảng phẳng rộng, chuyển sắc mềm, vài highlight sắc. Chi tiết nằm ở **hình** (mép rách lớn, mảng giáp, dây, xương, vết nứt, miếng vá), không nằm ở texture. | Micro texture: lỗ chân lông, dệt vải, vân da, xước, vết bẩn, nhiễu hạt, grunge, PBR ảnh thực. |
| **Khối sáng tối** | Form shading rõ: mặt sáng, mặt tối, bóng nếp gấp lớn, tối sâu trong khe. **Ít chi tiết nghĩa là bớt nhiễu nhỏ, không bao giờ có nghĩa là phẳng.** | Ánh sáng đều làm phẳng vải; flat shading; cel shading. |
| **Nét** | Mép sạch, rõ ở các cạnh mang thông tin. | Viền đen hoạt hình quanh mọi vật. |
| **Vật liệu** | Đá, gỗ, vải, kim loại, xương, đất nung, muối/kính/băng đọc khác nhau (§4.4). | Mọi thứ cùng độ bóng; bóng như nhựa, như đồ chơi. |
| **Màu** | Khối màu rõ: một màu chủ đạo, một màu phụ, một điểm nhấn nhỏ, cộng màu trung tính. Hero tươi và sạch hơn thế giới. Quái và môi trường theo palette act và mood map. | Cầu vồng; mọi vật đều bão hoà hoặc phát sáng. |

### 1.3 Ảnh mẫu style

Đường dẫn tính từ `ashlar/`.

| Loại | Ảnh | Dùng để |
|---|---|---|
| Terrain | `art/textures/terrain-dark-wood/_review_stylized2.jpg`; `art/textures/terrain-biomes-v2-stylized/style_ref.png` (ba tile đã duyệt: forest loam, shade grass, big-stone path) | Chuẩn mật độ nét và mảng. **Không lấy màu.** |
| Mood Map 1 | `art/textures/terrain-dark-wood/_ingame/d2_webgl.png` (scene `darkWoodD2`) | Hướng mood; chưa phải Map 1 hoàn tất. |
| Hero | `art/heroes/_review/v5/` và `overview_3q.png` | Bản hiện hành v5: mức texture, form shading, độ tươi màu. Chưa chọn A/B. |
| Quái | Sheet `concept_r2.png` / `concept_r2b.png` trong `art/act-01/monsters/`; bản chọn ghi trong `REVISION_2_VI.md` | Bản hiện hành rev 2: ngôn ngữ quái Diablo, khối màu, mép rách lớn. |
| Đã loại | `art/textures/terrain-dark-wood/stylized/` (quá chi tiết); `stylized3/path_cobble.png` (đá nhỏ, lốm đốm); hero v1 (xỉn, bụi); ánh trăng Dark Wood v1 làm mood mặc định | Đối chiếu điều cần tránh. |

**Cách gắn ảnh tham chiếu khi gen:**
- **Ảnh style:** ghi "match ONLY the painting style and level of detail; do NOT copy its colours, layout or design".
- **Bản cũ của chính asset khi vẽ lại:** gắn bản **làm mờ** (Gaussian r ≈ 2,2) và thêm một dòng "WRONG IN THE REFERENCE: …" cho từng điểm phải đổi. Nếu gắn bản sắc nét, model chép lại texture và bỏ qua lời sửa (bài học hero v5b).
- **Khung tỷ lệ:** với sheet có bóng người, gắn khung tỷ lệ làm ảnh thứ hai (§6.5).

---

## 2. Style chung và mood từng map (Đã chốt)

- **Style (§1) giống nhau toàn game. Mood thuộc từng map:** palette, ánh sáng, thời tiết, sương, tương phản, nhịp cảm xúc. Không có mood chung cho cả game; bảng màu act (§8) chỉ là khung lore.
- **Map 1 → mood Act I Diablo II:**
  - không khí: đồng hoang và rừng ẩm lạnh, hoang vắng nhưng vẫn đi được;
  - màu: xanh cỏ sẫm/ôliu, đất nâu bùn, đá xám cũ; điểm ấm nhỏ ở nơi có người (lửa, đèn, mái);
  - ánh sáng: u ám, tiết chế.
  - Mood D2 là màu và không khí, không đưa lại chi tiết kiểu ảnh thực.
  - Lookdev bắt đầu từ `stylized2_green` + scene `darkWoodD2`.
- **Phạm vi Map 1 chưa xác nhận.** Không tự đồng nhất Map 1 với cả Act I hay với Prologue.
- Ánh trăng xanh lạnh của Dark Wood v1 chỉ là mood của scene thử Immortal, không phải mood mặc định.
- **Concept sheet hero, quái, prop không mang mood map:** dùng nền studio xám ấm trung tính (§3.2). Palette quái của Map 1 vẫn nghiêng về olive, than bùn, xám lạnh của Act I D2. Mood map chỉ áp vào key art, concept cảnh và scene.

### 2.1 Thẻ mood (điền trước khi lookdev một map)

| Trường | Nội dung |
|---|---|
| Map | ID map; không suy ra từ act. |
| Mood mục tiêu | Một câu cảm xúc + tham chiếu. |
| Palette | Nền / điểm ấm / accent; swatch chỉ là điểm xuất phát. |
| Lighting và thời tiết | Nguồn sáng chính, sương, mưa, gió; giờ trong ngày nếu đã chốt. |
| Tương phản và value | Cách tách hero, địch, nền. |
| Nhịp cảm xúc | Diễn biến theo tuyến đi. |
| Style | §1, hoặc ghi rõ ngoại lệ. |
| Trạng thái | Đề xuất / đang lookdev / đã duyệt (ngày, người duyệt). |
| Chưa khoá | Camera, budget, chi tiết map. |

---

## 3. Khối prompt bắt buộc

Prompt viết bằng tiếng Anh. Dán nguyên văn các khối dưới đây; phần riêng của asset viết sau chúng. Khi một khối theo loại asset nói khác `STYLE CORE`, khối theo loại asset thắng ở đúng điểm đó.

### 3.1 STYLE CORE (mọi ảnh)

```text
STYLE CORE (ASHLAR art direction, mandatory): moderately stylized hand-painted dark fantasy in the spirit of Diablo Immortal (the Diablo III / Diablo Immortal family look). NOT photoreal, NOT Diablo IV realism, NOT cartoon, chibi, anime, cel-shaded or toy-like. Proportions follow real anatomy; exaggeration goes only to the identity features (heroes: hands, feet and class props slightly oversized; monsters: their signature features pushed further). Strong readable silhouette, clear value grouping, clean colour blocking: a dominant colour, a secondary colour and a small accent, plus neutrals. Surfaces are SIMPLE: broad painted planes with soft gradients and a few crisp highlights; detail comes from big shapes (large torn edges, plates, straps, bones, cracks, patches), never from texture. No micro texture: no pores, fabric weave, leather grain, scratches, stains, speckle noise, fine grunge or photoreal PBR. Low detail never means flat: keep clear 3D form shading with a lit side, a shadow side, big soft fold shadows and darker occlusion in deep folds. No black cartoon outlines.
```

### 3.2 CONCEPT SHEET (hero, quái, prop)

```text
SHEET RULES: flat warm mid-grey studio backdrop, no environment, minimal soft contact shadows. Neutral studio light from above and slightly in front, the same in every view, with clear form shading (never a flat, evenly lit look); no bloom, no coloured light. No VFX and no particles unless stated. Every view shows the SAME design, proportions, colours and asymmetries; one-sided details stay on the same anatomical side in every view. LEFT = the subject's anatomical left side toward the camera, facing image-left; RIGHT = the true opposite side, facing image-right, never a mirror of LEFT; BACK = the true back, never a mirrored front. Model views use an eye-level orthographic camera. Nothing cropped, nothing overlapping. Concept art only: not a sprite, not a 3D model sheet with wireframes. Text: only the exact title and labels given; no other text, no watermark.
```

### 3.3 HERO (thêm vào 3.2)

```text
HERO RULES: bold, colourful ARPG hero class art that stands out from the muted world: one rich saturated signature colour scheme per class, clean surfaces (no dust, grime or rags), exaggerated class props. At most two cloth layers; fitted leather and plate instead of layered robes, shawls, sashes, headscarves or fur cloaks. Silhouette language borrowed from the matching Diablo class archetype, never a copied Diablo costume. Class lights glow as small painted light: warm flame for lanterns, coals and pyre fire; still cold cyan-white points only for the Ossuarist's souls; no white-gold glow, no halo. A subtle cool rim light is allowed. Female heroes are attractive, confident adult women with fitted heroic silhouettes (bare shoulders or arms, a fitted bodice, a skirt slit where described), tasteful like modern ARPG class art: never nudity, lingerie, exaggerated anatomy or sexualised poses; the face plain and natural.
```

### 3.4 QUÁI (thêm vào 3.2)

```text
MONSTER RULES: read clearly as a Diablo-series monster (Diablo Immortal / Diablo III family); push its identity features (Diablo monster language), not everything. Colour blocking: PRIMARY about 60 % of the figure, SECONDARY about 30 %, ONE small saturated ACCENT from its act (Prologue monsters: no accent at all); primary and secondary differ in hue AND value at thumbnail size. Undead cloth is cut into big chunky jagged rag strips and large torn holes with clean painted edges, never micro-fraying, thread noise or grunge. No strong rim light. The plain flat dark-grey featureless human silhouette labelled H stands on the same baseline at exactly 1H; the monster's size is set only by the scale guides.
```

### 3.5 TERRAIN TILE

```text
TERRAIN TILE RULES: match ONLY the painting style and the very LOW level of detail of the attached approved tiles (a few large simple shapes with smooth, clean, softly rounded outlines, soft painterly gradients inside each shape, a handful of broad brush strokes, calm nearly flat areas between them); do NOT copy their colours or layout. ONE square 1:1 seamless tileable ground texture, continuous on all four edges; strictly orthographic top-down view of a flat walkable floor; about 3.5 metres of ground in the frame; flat even lighting, no cast shadows, no light gradient, no vignette, no glints or reflections, no perspective, no text or symbols; nothing large or special touching the edges; even average brightness; irregular non-grid placement; a quiet low-contrast floor behind combat. No frilly, fractal or cauliflower edges; no lichen dabs, sponge texture or speckle; no tiny pebbles, crumbs or scattered small bits; no crackle or hairline cracks. Stones, slabs, planks or clumps are big simple shapes with clean soft edges.
```

### 3.6 T-POSE CHO TRIPO

Dùng template của skill `.agents/skills/generate-tpose-for-tripo/`; template đó đã mang các quy tắc dưới đây. Khi viết prompt T-pose ngoài skill, dán khối này:

```text
T-POSE RULES: keep the concept's design, build and smooth painted low-detail surface; only the pose changes. Keep the concept's hand-painted form shading: every big fold and cloth layer has a lit plane and a large dark shadow plane (deep shadow in fold recesses, under capes, hoods, collars, belts and sashes, inside splits); roughly a third of each cloth surface in shadow; never one evenly lit flat colour. One neutral white light from above and slightly from the camera side, the SAME in every view; no side light, no rim light, no coloured light, no glow or bloom. Cloth is one plain clean shape (no ragged fringe, no loose strips). Hands empty; hand-held weapons and props are built separately. Perfectly flat neutral mid-grey background; no text, no human silhouette.
```

Với concept dạng người (hero, NPC, quái hình người) thêm khối dưới (bản đầy đủ theo từng sheet nằm ở `templates/humanoid.block.md` của skill):

```text
HUMANOID T-POSE RULES: upright and symmetric, weight even on both legs, no contrapposto, no hip tilt, no step, both legs identical (human legs straight with straight knees; digitigrade or hoofed legs kept exactly as in the concept), feet flat, parallel, pointing forward, about one shoulder width apart. Shoulders level, forming one straight horizontal line with both arms; a pauldron or mantle on one shoulder does not lift or drop it; arms leave the body at shoulder height. Each arm one perfectly horizontal straight line, hand at shoulder height (no sagging), arm length about 0.44 of the body height (arm span about equals height) unless the concept is stylized otherwise, hands open and flat, palms down. Crotch at about half the height, knee at about 27 percent. Skirts and robes hang straight and symmetric. Side views: legs vertical and overlapping, no stride, near arm straight at the camera at shoulder height. Same head size, shoulder height, hip height and floor line in every view.
```

Concept không phải người (bốn chân, nhiều chân, có cánh, thân dài, khối) **không dùng T-pose**: dùng dáng nghỉ trung tính của từng họ (template `*_creature.prompt.md` và `creature_pose.blocks.md` của skill). Mới viết họ bốn chân (**đề xuất AD, đang thử trên B01 Sexton's Dog 21/10, chưa được người dùng duyệt**; Tripo không có hướng dẫn tư thế cho quái nên đây là giả thuyết):

```text
QUADRUPED NEUTRAL-POSE RULES: no T-pose and nothing held out. The animal stands square, calm and symmetric on all four legs, like the rest pose of a skeleton rig: four paws flat on one ground line, the front legs vertical and parallel under the shoulders with a clear gap of background between them, the hind legs in the same relaxed standing posture with a clear gap between them, paws pointing forward. Spine straight and level: no sway, hunch, crouch, lunge or lifted leg. Head in the concept's natural carriage, pointing straight along the body axis, mouth closed, never turned or tilted. Tail hanging down and slightly back as one simple tapered shape. Thin or loose parts (tufts, chains, whiskers) become chunky shapes that hug the body. Eye-level orthographic views with no perspective; in the side views the far legs stand exactly behind the near legs.
```

### 3.7 MÔI TRƯỜNG: SHEET ASSET VÀ CẢNH

```text
ENVIRONMENT RULES: same moderately stylized hand-painted style; big readable masses, simplified surfaces, detail grouped at focal points (path edges, wall bases, story props). Human-made things show a few large, visible repairs (patched thatch, re-tied fences, re-pointed mortar, soot above candles); places a Perfection has taken are seamless and too clean. Every light belongs to a source in the world: humans = small warm flickering smoky light; a Perfection = steady, even, beautiful light, often many identical sources; the Discarded = red-orange kiln light pulsing from inside cracks; the Wall = cold white light through cracks; Mason stone never glows. Keep the playable floor quiet and low-contrast.
```

Thêm theo dạng ảnh:

- **Sheet 6 asset:**

  ```text
  SIX numbered cells 1-6 in a 3x2 grid, one asset per cell, no extra objects, no scenery; each cell has a flat dark-grey 1H human silhouette on the same baseline at the same local scale. Perspective sheet: 3/4 view from slightly above, neutral daylight. Turnaround sheet: LEFT, RIGHT, FRONT, BACK of each cell, using the perspective sheet as the identity reference.
  ```

- **Cảnh / key art:** dán khối dưới, rồi thêm palette và cột cấm của act (§8) và thẻ mood map (§2.1).

  ```text
  In dark scenes compose for ONE small distant warm point of light against a large dark mass; never two equal light sources in a frightening view. Daytime skies stay covered (fog, soot, salt haze, dusk, storm); a clear blue sky only in the Seamless. Night stars are cold white points that do not twinkle.
  ```

- **Ảnh hàng cho Tripo (`TRIPO ROW INPUT`, đã chốt 22/10):** một ảnh cho một lượt Tripo image-to-3D dựng nhiều prop cùng lúc.
  - Chỉ làm khi sheet turnaround của nhóm đã qua QA. Ô nào trượt QA thì chưa đưa vào hàng.
  - Dán `STYLE CORE` (§3.1), `ENVIRONMENT RULES` (§3.7), khối dưới đây và `CONTENT` (§3.8). **Không** dán `SHEET RULES` và khối "Sheet 6 asset": ảnh hàng không có ô, nhãn, bóng người.
  - Gắn sheet perspective và turnaround của nhóm làm tham chiếu danh tính; ghi rõ asset nào ở ô nào.
  - Sau khối, liệt kê asset từ trái sang phải: tên, ô concept, kích thước thật (m), mặt quay về phía camera.
  - Kích thước để dựng model vẫn lấy theo spec, không đo trên ảnh hàng (§7.2).
  - Lượt đầu (22/10, 22 ảnh): Astra vẽ asset to hơn yêu cầu nên khoảng trống chỉ còn 10–60 px. Khi khoảng trống hẹp hơn quy tắc, tách từng asset khỏi nền và dàn lại bằng code, chỉ cắt và dời pixel, không vẽ thêm (§13). Lưu bản dàn lại thành `input_spaced.png` cạnh ảnh gốc; Tripo dùng bản này.

  ```text
  TRIPO ROW INPUT (one image = one Tripo image-to-3D run that builds several separate props): ONE horizontal row of separate assets side by side, left to right in the listed order: 3-5 assets of a similar size class, or only two (or one) big assets such as buildings, towers, big trees or arches. Never a second row and never one asset behind another: every asset stands on the SAME baseline, its lowest point on one common floor line. Clear empty backdrop between neighbours, at least about a quarter of the neighbouring asset's width; nothing touches, overlaps or hides another asset. Every asset is drawn large and whole: the smallest at least about one sixth of the image height (a long low asset at least about one fifth of the image width), with a clear margin to every edge of the image. Relative sizes follow the listed real sizes as far as these rules allow. Camera: the same 3/4 view for every asset, only slightly from above (about 10 degrees down), mild perspective. A flat plain mid-grey studio backdrop (about #BDBDBD) that is also the flat floor: no ground base, slab, plinth, disc, turf, soil patch, water or scenery under or around any asset (a mound, bank or rock that IS the asset stays, nothing more); only a small soft contact shadow under each asset. One neutral white light from above and slightly in front, the same on every asset, with clear form shading; no coloured light, glow halo, bloom, light rays or particles (a flame or lamp is a small painted shape). Each asset keeps EXACTLY the design, proportions, materials, colours, repairs and one-sided details of its approved concept cell in the attached sheets; only the layout changes. No human silhouette or figure, no scale guides, no cell borders, no numbers, labels, captions, text or watermark.
  ```

### 3.8 CONTENT (mọi ảnh)

```text
CONTENT: no crosses, no real saints, prayers or religious symbols; ASHLAR's church sign is the Wedge (a keystone shape), only where the brief asks for it. No gore emphasis and no blood splatter (Act III blood accents are small painted stains only); heroes show no wounds and no blood. Adults only, except canon child and teenage NPC concepts explicitly allowed on 23/10/2026: preserve their canon age, fully clothed, age-appropriate and non-sexualised; no graphic injury or distress. No nudity, no anatomical detail, no sexualised poses; no likeness of any real person. Never stage hanged bodies.
```

---

## 4. Quy tắc hình ảnh chung

### 4.1 Đọc được trước khi trang trí

- **Thứ tự đọc:** đường bao → khối sáng tối → điểm màu → vật liệu → chi tiết.
- **Value trước hue:** bỏ màu đi vẫn phải tách được hero, địch, nền và cảnh báo.
- **Nền chơi** yên và ít tương phản, để telegraph, loot và xác đọc được (LD §8.1).
- **Telegraph** đọc bằng hình và nhịp trước, màu sau (LD §8.2).
- **Rim light trong scene** (không áp cho concept sheet): mọi thứ gây sát thương có rim; rim lạnh ở vùng ấm, rim ấm ở vùng lạnh (LD §8.1).

### 4.2 Năm "người làm" (LD §4.1)

Người chơi phải nhận ra ai làm ra một vật chỉ bằng một cái nhìn.

| Người làm | Hình khối | Vật liệu | Bề mặt | Ánh sáng |
|---|---|---|---|---|
| **Masons** | Góc vuông, thẳng đứng, hàng đá chính xác, không trang trí; mọi thứ hơi quá cỡ | Đá xám đẽo, áo như bê tông đổ, công cụ sắt | Dấu dụng cụ, dấu thợ, vạch dẫn | Không bao giờ tự phát sáng |
| **Con người** (the Moss) | Lệch, nghiêng, chắp vá, xây thêm | Gỗ, đá lửa, rạ, dây, sáp, len; xương và kính muối tái dùng | Vá, mạng, đinh tán, vữa trát lại, muội trên mỗi ngọn nến | Nhỏ, ấm, lập loè, có khói |
| **Perfections** | Đối xứng, đường cong liền, lặp lại, không mối nối | Vải lanh, vàng và sắt, kính muối, lọ thuỷ tinh, ánh đèn | Hoàn hảo: không xước, không bụi, không mòn; phủ phẳng lên đồ của người | Đều, đứng yên, đẹp; thường từ nhiều nguồn giống hệt nhau |
| **Discarded** | Thấp, có sừng, móc, nặn tay | Đất nung, men, muội, xỉ; đồ tuỳ táng và công cụ Mason ăn trộm | Dấu ngón tay, nứt men, vết cháy lò, mảng bùn | Ánh lò đỏ cam từ trong khe nứt, phập phồng như bễ |
| **The Wall** | Hàng sọ và xương dài; bàn tay nắm nhau qua vữa | Xương, vữa xám, bụi linh hồn | Hơi ấm và ẩm (đã "khóc" từ 999 AL) | Ánh trắng qua khe nứt, nơi linh hồn buông tay |

**Quy tắc mối nối:** mối nối, chỗ vá, chỗ sửa là dấu hiệu sự sống. Càng liền mạch, Perfection càng gần.

**Gần cult, chỗ vá biến mất**, mỗi act một kiểu:

| Act | Bề mặt thay cho chỗ vá |
|---|---|
| I | Vôi mới |
| II | Mạ vàng |
| III | Cọ trắng |
| IV | Đánh vecni, phủi bụi |
| V | Nến ở mọi cửa sổ |

**Mason khác Seamless:** Mason còn mạch xây và dấu đục. Seamless xoá mọi mối nối: không tile, không mòn.

### 4.3 Ánh sáng có chủ (LD §4.1, §5.1)

| Chủ | Chuyển động | Nhìn | Nghĩa |
|---|---|---|---|
| Con người | Lập loè, có khói | Nhỏ, ấm, không đều, có muội phía trên | An toàn, có người |
| Perfection | Đứng yên tuyệt đối | Đẹp, đều, nhiều nguồn giống nhau xếp hàng | Cult, cell, lời nói dối |
| Discarded | Phập phồng như bễ | Đỏ cam, từ trong khe | Đói, lò nung, đột kích |
| The Wall | Điểm đứng yên hoặc lung linh chậm | Trắng lạnh | Unbroken rò ra |
| Masons | — | Không phát sáng | Bị theo dõi |

- **Ánh sáng đẹp thường là nói dối:** ánh sáng ấm và đẹp thường thuộc về Perfection; an toàn thật nằm ở ánh sáng mờ, không hoàn hảo.
  - Đèn của Gentle House, Widower's Light và ngọn đèn phía trước đều không lập loè.
  - Trong ảnh tĩnh: ánh của người vẽ không đều, có khói và muội; ánh của Perfection vẽ sạch, đều, quầng tròn giống nhau.
- **Light radius là luật của thế giới (LD §5.3):**
  - ánh sáng phải có nguồn thật: nến, đèn hồn, lò, giàn thiêu;
  - ngoài vùng sáng là bóng tối đen, không phải sương xám.

### 4.4 Vật liệu (đề xuất AD)

| Vật liệu | Cách vẽ | Tránh |
|---|---|---|
| Đá | Khối phẳng lớn, cạnh vỡ chọn lọc; rêu gom thành vùng | Rêu phủ đốm đều |
| Gỗ | Thớ thành dải rộng; mối ghép và đầu gỗ rõ | Hàng trăm rãnh nhỏ |
| Vải | Nếp lớn theo trọng lực; đường may có chức năng; vải Mercy sạch và liền hơn vải người | — |
| Kim loại | Phản sáng theo mặt và cạnh chính; giữ khoảng tối giữa các mảng | Viền sáng mọi cạnh; giáp bóng như nhựa |
| Xương | Ngà hoặc xám, bất cân; cấu trúc lớn trước vết nứt | — |
| Đất nung | Thân mờ; men khác độ nhám theo mảng; vết nứt có chiều sâu; chỉ sáng khi đúng nguồn gốc | — |
| Muối, kính, băng | Phân biệt bằng độ đục, cạnh, khối và cách nhận sáng | Dùng chung một kiểu bóng xanh |

### 4.5 Motif của ASHLAR (LD §4.2–§4.10)

**Tượng không mặt (Nameless Saint):**
- Mặt nhẵn, to hơn người thật 10–15 %, tay đỡ một vòm; đá xám, không phát sáng; đặt ở ngưỡng cửa.
- Tượng chỉ đổi tư thế khi ở ngoài màn hình. Ảnh tĩnh được vẽ đầu tượng đã quay đi, như ở Prologue.
- Không vẽ tượng đang chuyển động trước cảnh Cathedral của Act II.

**Ngọn đèn phía trước:**
- Ánh đèn trắng, đứng yên, ở xa trong bóng tối.
- Chỉ xuất hiện ở Garden of Hush, Bell Catacombs và Old Salt Mine.
- Không bao giờ vẽ người cầm đèn.

**Widower's Light:** ngọn lửa trắng ở cửa sổ cao nhất Ebbmount, là "một điểm sáng xa" của ASHLAR.

**Vòm là hai vật nghiêng vào nhau** *(đề xuất LD)*. Mỗi act có một vòm tự nhiên, sau giống người hơn trước:

| Act | Vòm của act |
|---|---|
| I | Hai đá dựng trên đê Dolmoor |
| II | Hai người sám hối đông cứng trên Pilgrim Road |
| III | Hai cột buồm đổ vào nhau ở Wreck Fields |
| IV | Hai người lính Frozen Army đỡ nhau |
| V | Vòm xương cá voi dưới Ebbmount |

Cây của Willow Bride nghiêng về khoảng trống: một vòm thiếu một viên.

**Bàn tay nắm nhau:**
- Giấu hiếm hoi trong hoa văn tường xương *(đề xuất LD)*.
- Trong The Course thì có ở khắp nơi.

**Cửa sổ có đèn:**
- Mở đầu mỗi act.
- Càng về sau, nến cửa sổ càng dày *(đề xuất LD)*.

**Bầu trời:**
- Ban ngày luôn bị che: sương, muội, mù muối, chạng vạng, bão. Trời xanh trong chỉ có ở Seamless.
- Sao là điểm trắng lạnh, không nhấp nháy, xếp hơi quá đều.
- Số sao tăng theo act *(đề xuất LD)*.

**Ossuary (mặt Tường, waypoint):** luôn có ba phần:
- một mặt sọ trong vữa xám;
- một tượng không mặt;
- một đèn sexton.

Kiểu ossuary theo vùng:

| Vùng | Kiểu ossuary |
|---|---|
| Dolmoor | Tháp tròn đá lửa mái nón, sọ sau song sắt, bát sữa cho Kind Ones |
| Sepulcra | Hốc xương khoét trong đá vôi trắng, biển đồng ghi tên người hiến |
| Blanched Sea | Tủ xương trong thân tàu mắc cạn, giá sọ đóng muối |
| Hoarfast | Ossuary gỗ-đá thấp, sương giá trên mọi sọ |
| Lanternshore | Hang biển, sọ giữa đám hà, đền gỗ trôi dạt |

**Biểu tượng Giáo hội, thay cho thánh giá:**
- Wedge (hình đá khoá);
- tượng không mặt đỡ vòm;
- tro vữa trên trán;
- chuông hồn;
- xẻng sexton;
- quan tài đinh bạc của Pallbearer;
- ấn huyệt mở của Exhumer;
- Wedge có vết nứt của phái Odilian;
- giá nến hình Wedge.

### 4.6 Hai màu trắng (LD §5.4)

| Màu trắng | Chất | Không bao giờ |
|---|---|---|
| Act III | Muối và xương: mờ, bụi, có bề mặt, mép bẩn | Phát sáng |
| Seamless | Chính ánh sáng: phát sáng, bloom, không texture | — |

**Không bao giờ lẫn hai màu trắng này.**

---

## 5. Hero (sáu nghề)

**Nguồn:**
- `docs/ASHLAR_HERO_CONCEPT_VI.md` §1.3–§1.4, §2, và §4–§9 (mỗi mục một nghề);
- `art/heroes/_brief/README_VI.md` §14–§15;
- prompt `art/heroes/_brief/prompts_v5b/`.

**Sáu nghề:** PB Pallbearer, FL Flagellant, OS Ossuarist, BR Brinecaller, EX Exhumer, PS Pyre-Singer. Mỗi nghề có hai hướng A/B.

### 5.1 Định dạng sheet hiện hành (v3, đã chốt 20/10)

Một ảnh 16:9, chia ba vùng:

1. **Một phần ba bên trái:** một hình 3/4 lớn (góc trước-trái) **cầm vũ khí**.
   - Dáng anh hùng tự tin, không phải pose hành động.
   - Cao khoảng 80 % canvas; nhãn `3/4`.
2. **Hai phần ba bên phải, phía trên:** bốn góc `FRONT`, `LEFT`, `RIGHT`, `BACK`.
   - Cùng một đường nền, cùng một tỷ lệ nhỏ hơn (khoảng 55 % canvas).
   - **A-pose, tay mở, không cầm gì.** Mọi thứ mặc trên người giữ nguyên như ở hình 3/4.
3. **Dải dưới:** vũ khí và class item vẽ riêng.
   - Cùng tỷ lệ với bốn góc; vật dài đặt nằm ngang; mỗi món có nhãn.

**Tiêu đề và giới hạn:**
- Tiêu đề dạng `PB PALLBEARER — A`.
- Không khung, không inset, không cảnh nền.
- Sheet hero không có bóng người H.

### 5.2 Tạo hình (v4, đã chốt 20/10)

**Trang phục:**
- Tối đa hai lớp vải.
- Dùng da bó và giáp, thay cho áo choàng nhiều lớp, khăn choàng, khăn quấn đầu, áo lông. Nhiều lớp vải kèm lông bị đọc thành dân du mục thảo nguyên.

**Silhouette** mượn archetype class Diablo tương ứng, nhưng không chép trang phục:

| Nghề | Archetype Diablo |
|---|---|
| PB | Paladin / Crusader |
| FL | Monk |
| OS | Necromancer |
| BR | Sorceress |
| EX | Demon Hunter |
| PS | Druid |

**Thân hiển thị** (là cách trình bày, không khoá giới tính của nghề):
- FL, OS, BR, PS là nữ, gợi cảm tinh tế: áo bó, vai hoặc tay trần, xẻ váy.
  - Không khoả thân, không pose gợi dục.
  - Lưng FL luôn che kín, da không có vết.
- PB và EX là nam.

### 5.3 Bề mặt (v5, 20/10)

Giữ thiết kế v4, **giảm mạnh texture bề mặt**, vẫn giữ form shading.

**Danh tính giữ bằng hình lớn,** ví dụ:
- đinh lớn trên nắp quan tài;
- hốc thánh tích;
- giáp vai pha lê;
- nan đèn;
- ấn nút thắt.

**Không vẽ:** hoa văn khắc, hoạ tiết thêu, hàng đinh tán, đường chỉ, khoá nhỏ.

**Vẽ đơn giản hoá:**
- tóc thành vài lọn lớn;
- lông thú thành vài cụm mềm lớn;
- tinh thể muối thành vài mặt cắt lớn.

### 5.4 Màu chữ ký (v2, 20/10; palette cuối chưa khoá)

| Nghề | Màu chữ ký |
|---|---|
| PB | Tím hoàng gia + bạc |
| FL | Đỏ thẫm + than hồng |
| OS | Chàm nửa đêm + xương + ánh hồn lạnh |
| BR | Teal biển + bọt biển + muối xám xanh |
| EX | Xanh chai + đèn hổ phách + đồng thau |
| PS | Trắng tro + lửa + sương giá + chỉ đỏ |

- Mã HEX từng nghề nằm trong prompt `prompts_v5b/` và concept doc §4–§9.
- Muối luôn xám xanh, sần, lệch; không bao giờ trắng tinh hay đối xứng.
- Nước biển là teal đục có bọt; không bao giờ xanh trong.

### 5.5 Ánh sáng trên hero (từ v2)

**Được vẽ:**
- Đèn, than và lửa giàn thiêu được thắp, vẽ thành vầng sáng nhỏ.
- OS có các điểm hồn lạnh đứng yên.
- Osric's Lantern: đèn sắt nhỏ, lửa cam ấm (không xanh, không trắng), treo sau hông phải; có trên mọi sheet hero trừ EX.

**Không vẽ:**
- ánh trắng vàng, hào quang;
- tia phép;
- hạt sáng ngoài tàn lửa;
- nhẫn phát sáng (nhẫn không bao giờ phát sáng).

### 5.6 Prologue lineup

Sáu hero trong dáng cuối Prologue:
- vải liệm xám, khoác áo len than bùn dài và rộng của Gennet;
- vũ khí ứng biến;
- bụi vữa, chân trần; không bao giờ khoả thân.

Palette Act I ban đêm, **không accent**, không có Osric's Lantern.

### 5.7 Còn mở

- Chưa chọn A hay B cho nghề nào.
- Palette cuối chưa khoá.
- Mức phóng đại tỷ lệ cuối chưa khoá.

---

## 6. Quái và boss

**Nguồn:**
- `docs/ASHLAR_QUY_CHUAN_QUAI_VI.md`: kích thước, màu key, silhouette từng ID (đề xuất, đang review);
- `docs/ASHLAR_MONSTER_CHECKLIST_VI.md`: 116 ID;
- `art/act-01/_batches/map01/REVISION_2_VI.md`.

### 6.1 Định dạng sheet hiện hành (rev 2, đã chốt 20/10)

**Một hàng ngang, từ trái sang phải:**
1. **H:** bóng người xám đậm phẳng, không mặt, cao đúng 1H.
2. **3/4:** quái cầm vũ khí, trong tư thế sẵn sàng đe doạ.
3. **Ô vũ khí/đạo cụ vẽ riêng** (khi có).
4. **LEFT, RIGHT, FRONT, BACK:** T-pose, tay không. Quái không dạng người dùng tư thế đứng trung tính, chân/cánh/đuôi tách khỏi thân.

**Tỷ lệ:**
- Mọi góc cùng một tỷ lệ, cùng đường nền; không phóng to góc 3/4.
- Quái rất to hoặc rất rộng (P06, B05): dàn hai hàng, mỗi hàng lặp lại H, vẫn cùng tỷ lệ.

**Chữ:** tiêu đề dạng `U01 SHAMBLER — A`; nhãn cột đúng thứ tự.

**Hai biến thể A/B cho mỗi quái:**
- Khác thật về silhouette, cấu trúc vải/giáp và vị trí phụ kiện.
- Giữ cùng danh tính canon, cùng kích thước, cùng đạo cụ và hành vi đặc trưng.

### 6.2 Style quái

Dùng §3.1 + §3.2 + §3.4.

**Kiln-Bull D03 (23/10, người dùng):** đi bằng **hai chân**, hai tay lớn, vai/ngực và thân hình bulky. Giữ đầu bò, sừng, đất nung và lỗ mũi sáng của lò. **Chiều cao toàn thân chốt 1.40H**, từ mặt đất tới điểm cố định cao nhất của cơ thể, nhóm G4. Bóng người H phải cùng mặt đất và tỷ lệ; quái chỉ cao hơn người 40%. Số đo V/L của bản bốn chân đã được thay thế; bản r3b có bóng người quá nhỏ, không dùng làm chuẩn kích thước.

**Ngôn ngữ zombie/ghoul kiểu Diablo:**
- vai gù nặng, ngực lõm;
- tay dài, bàn tay to;
- hàm trễ, khớp xương nổi;
- đe doạ, không đáng thương.

**Unlaid rách rưới và cách điệu:**
- Mỗi lớp áo có 5–9 dải rách lớn.
- Lỗ rách lớn để lộ thịt xám, xương sườn hoặc sống lưng.
- Ở các góc T-pose, dải rách rủ sát thân để tay chân vẫn đọc được.

**Đổi so với prompt rev 2:** bỏ "soft even neutral light". Thay bằng ánh trung tính từ trên, có form shading (§3.2). Lý do: ánh đều làm phẳng vải (bài học T-pose 20/10).

### 6.3 Đọc theo họ (LD §8.1, Cast §12)

| Họ | Đọc bằng | Ghi chú khi vẽ |
|---|---|---|
| Unlaid (U) | Tư thế | Gục, lệch xương, phình, cõng quan tài; vải liệm và đồ tuỳ táng thành mảng lớn |
| Discarded (D) | Sừng/móc + dáng nghề | Đất nung đỏ, men nứt mảng lớn; lửa chỉ ở khe có nghĩa, không phủ toàn thân |
| Warped (W) | Một đặc trưng sinh học bị làm sai | Giữ nền sinh vật dễ nhận ra |
| Faithful (F) | Nghề, nghi thức | Quỳ, mang chuông, mang đèn, đeo vòng sắt; giữ đủ nét người |
| Perfection-born (P) | Vật liệu của Perfection | Xem bảng ngay dưới |
| Lodge's servants (L) | Trọng lượng đá, hình học đo đạc | **Không bao giờ tự phát sáng:** không mắt sáng, không viền sáng, không lửa |
| The Perfect (X) | Sự thiếu chi tiết | Bề mặt trống bất thường; không bù bằng hoa văn |

**Vật liệu của từng Perfection:**

| Perfection | Vật liệu |
|---|---|
| Mercy | Vải lanh, bàn tay |
| Devotion | Sắt, chuông |
| Purity | Muối, kính |
| Memory | Lọ, vật lưu giữ |
| Hope | Đèn, mồi nhử |

**Boss:**
- Một ý tưởng đủ mạnh khi nhìn ở thumbnail, cộng một đặc trưng chuyển động.
- Kích thước theo cơ chế và camera arena; không mặc định gấp một con số cố định so với hero.

### 6.4 Màu quái (Quy chuẩn quái §2.2–§2.4)

**Hai lớp màu:**
- **tint họ:** nền vật liệu chung của họ quái;
- **accent act:** một màu bão hoà theo act (LD §5.4). **Mỗi quái chỉ một accent.**

**Ngoại lệ:**
- Quái Prologue (U01, U02, W01, B01): không accent.
- Lodge (L01–L04): không accent, không phát sáng.
- Act III: đỏ `#9E1B1B` chỉ ở dạng máu (vết, giọt, vệt); không dùng cho vật liệu, mắt hay phần phát sáng.

**Không làm:**
- nhuộm cả con theo màu act nếu làm mất tương phản với nền;
- dùng màu rarity của loot làm màu quái.

**Bảng màu có sẵn:**
- 30 quái Map 1: `REVISION_2_VI.md`;
- các ID khác: Quy chuẩn quái §4.

### 6.5 Kích thước theo H

**Đơn vị:**
- **H** là chiều cao thân hero đứng trung tính.
- Ký hiệu: `h` chiều cao (quái hai chân), `V` chiều cao vai (quái bốn chân), `L` chiều dài, `W` bề ngang hoặc sải cánh.
- Số liệu theo Quy chuẩn quái (đề xuất); mô tả canon là gốc.

**Ép tỷ lệ khi gen:** chỉ ghi kích thước bằng chữ thì không đủ, vì model kéo mọi con về gần 1H. Phải làm thêm:
- **Luôn gắn khung tỷ lệ** vẽ bằng code làm ảnh thứ hai: bóng H đúng 1H, đường nền, vạch chiều cao có nhãn, thước đo chiều dài. Mẫu ở `art/act-01/_batches/map01/_brief/templates_r2/`.
- **Con nhỏ:** thêm khối định vị mờ cho từng góc.
- **Con bay hoặc đậu:** thêm đoạn PIXEL CHECK, ví dụ "human is N px; every view ≤ M px".

**QA:** đo so với bóng người, **không** so với vạch do model vẽ, vì model có thể tự dời vạch.

### 6.6 Lỗi hay gặp

- **Góc LEFT/RIGHT ở T-pose:**
  - model vẽ tay chĩa ra trước thay vì cho thấy tay theo chiều đầu tay;
  - đôi khi nhãn LEFT/RIGHT bị đảo so với hướng mặt;
  - khi tách góc cho Tripo, xác định góc theo nội dung hình, không theo nhãn.
- **Quái rất nhỏ** (P03 Hush-Moths) vẫn ra to khoảng 1,7×. Bướm, chuột, quạ cần khối định vị và PIXEL CHECK.
- **Sinh vật gầy** bị biến thành goblin cơ bắp khi đổi pose. Ghi rõ "thin, lean, same build as the concept".

---

## 7. Môi trường

### 7.1 Terrain

**Chuẩn `stylized2`:**
- vài mảng rộng; rễ và lá chỉ là nét phụ;
- bùn chuyển sắc mềm, phản sáng tiết chế;
- cỏ đọc thành cụm lá, không thành nhiễu hạt;
- đường đá dùng **viên lớn**; bản đá nhỏ `stylized3` đã bị loại;
- không viền trắng quanh từng viên đá.

**Tạo tile:**
- Prompt dùng §3.5; ảnh style là `terrain-biomes-v2-stylized/style_ref.png`.
- Palette lấy từ thẻ biome (Biome và khu vực §4) hoặc thẻ mood map; ghi HEX vào prompt.

**Chịu được lát lặp:**
- tránh vũng sáng, rễ có hình đặc biệt, cụm cỏ đặt đều;
- duyệt cả ảnh lặp 2×2 / 3×3 và ảnh ở khoảng cách chơi.

**Hậu kỳ:**
- Làm liền mép bằng phân rã tuần hoàn (periodic decomposition); không dùng cách dịch nửa ô.
- Normal map tạo bằng `image_gen` edit từ albedo (OpenGL); sửa mép trước khi dịch.

**Trong game:** blend giữa các vật liệu mềm và rộng (khoảng 1,5–3 m), không cắt gắt.

### 7.2 Sheet asset môi trường (đã chốt 20/10)

- **Bố cục:** khoảng 6 asset một ảnh, lưới 3×2 đánh số 1–6.
  - Mỗi ô một asset, có bóng người 1H cùng đường nền.
- **Thứ tự tạo:**
  1. sheet **perspective** (góc 3/4 nhìn hơi từ trên);
  2. sheet **turnaround** (bốn góc của từng ô), dùng sheet perspective làm tham chiếu.
- **Ánh sáng và chi tiết:** ánh sáng ngày trung tính; dấu vá của người chỉ là vài mảng lớn.
- **Lỗi hay gặp:** asset lớn (cây, tháp, cổng) hay bị vẽ nhỏ hơn số đo. Khi dựng model, lấy kích thước theo spec.
- **Ảnh cho Tripo (đã chốt 22/10):** sau khi turnaround qua QA, gom asset thành **ảnh hàng** theo khối `TRIPO ROW INPUT` (§3.7) để một lượt Tripo dựng nhiều asset.
  - Một hàng ngang, 3–5 asset cùng cỡ; nhà, tháp, cây lớn, vòm thì 2 cái hoặc 1 cái một ảnh.
  - Không vẽ hai hàng: Tripo bỏ các hàng dưới. Không vẽ góc camera game cao, không đế: mô hình ra đứng trên tảng bùn nghiêng. Mọi asset trên cùng một đường nền.
  - Chi phí ước tính khoảng 140–160 credit một ảnh, so với khoảng 145 credit cho mỗi asset dựng riêng.

### 7.3 Kiến trúc, cây cỏ, bố cục

**Kiến trúc:**
- Đọc công trình theo thứ tự: khối lớn → cửa/vòm → hệ chống đỡ → vật liệu → dấu sử dụng.
- Mỗi nơi chọn motif hợp với câu chuyện; không gắn mọi biểu tượng lên mọi asset.

**Cây cỏ:**
- Cỏ thành cụm lớn–vừa–nhỏ bất đều, có khoảng đất trống giữa các cụm.
- Cây lớn tạo khung; cành tiền cảnh không che vùng giao tranh.
- Phân biệt biome bằng hình thân, tán và độ dày cụm, không chỉ bằng đổi màu.
- Đá rêu và bụi cỏ không thành điểm sáng nhất nếu không mang thông tin gameplay.

**Wild:**
- Có một landmark nhìn thấy từ phần lớn khu.
- Đích của act nhìn thấy được từ ít nhất một chỗ cao (LD §7.4).

### 7.4 Concept cảnh và key art

- **Khối prompt:** §3.7, cộng palette và cột "Cấm" của act (§8) và thẻ mood map.
- **Chủ thể ưu tiên:** hình "phải nhớ" của area (§10).
- **Bố cục:** một điểm sáng xa giữa khối tối lớn.

---

## 8. Màu theo act (LD §5.4)

- Đây là swatch khởi điểm của LD, không phải màu pixel cuối.
- Mood từng map có thể dịch các màu này (§2), nhưng **cột "Cấm" vẫn giữ**.

| Chặng | Nền | Accent | Ánh sáng | Cấm |
|---|---|---|---|---|
| Prologue | Palette Act I, ban đêm | **Không có** | Đèn của Gennet là màu ấm đầu tiên của game | Như Act I |
| Act I · Dolmoor | Xanh xám ướt `#5E6B5A`, đen đầm `#1F2A24`, than bùn `#4A3526`, sương `#A9B1A6` | Đỏ anh túc `#B3262A` | Hổ phách nến `#E0A050`; đèn ngủ hồng nhạt dưới lòng đất | Ánh nắng; trắng sạch ở bất cứ đâu trừ vải lanh của Mercy |
| Act II · Sepulcra | Đen muội `#17151A`, trắng xương `#E6DFCF` | Cam giàn thiêu `#E2622B` | Vàng nến `#D9A441`; kính màu xanh đậm và đỏ thẫm, chỉ qua cửa sổ | Xanh lá; ánh ngày trong hầm mộ |
| Act III · Blanched Sea | Trắng xương `#EDEAE0`, trời sữa `#DCE3E6`, teal nước muối `#3F8C88`, gỉ `#8A4B2D` | Đỏ máu trên muối `#9E1B1B` | Chói từ trên; không có bóng lúc trưa | Mọi màu đỏ trừ máu; màu sắc bên ngoài Undercity |
| Act IV · Hoarfast | Băng xanh đen `#14202E`, xanh sương `#6F8FA8` | Màu đá quý cũ: garnet `#7A3B47`, emerald `#3F6B5A`, vàng cũ `#B59A5B` | Đèn hổ phách `#E5A44C` trong hoàng hôn bất tận | Tuyết trắng tinh (tuyết xanh trong bóng, hổ phách dưới đèn) |
| Act V · Lanternshore | Slate bão `#3B4650`, xanh biển `#2F5A52`, đá ướt đen `#121417`, bọt trắng `#E8EEEA` | Vàng đèn `#F2C14E` | Đèn hải đăng quét; ngọn lửa trắng `#F8F6EE` | Trời quang; ánh nắng trước Epilogue |
| The Course | Ochre `#A57F45`, xương `#D8CCB0`, xám ấm `#8C847A` | — | Chỉ ánh trắng qua khe | Mọi ánh ấm, trừ ánh lò Discarded nơi Spoil xuyên vào |
| The Seamless | Trắng tinh, vàng `#F4D58D`, trời xanh hoàn hảo `#8EC9F0` | — | Cháy sáng, bloom | Texture, vết mòn, mọi bóng đổ trừ bóng của hero |

- **Loot (LD §5.5):** Rubble xám, Hewn xanh dương, Dressed vàng, Graven cam, Hallowed vàng kim. Không dùng các màu này làm accent môi trường lớn.
- **Telegraph:** đọc bằng hình và nhịp trước, màu sau. Đỏ cảnh báo phải đọc được trên máu của Act III và lửa của Act II.

---

## 9. Thứ tự biome theo tiến trình chơi

- **Nguồn:** tuyến Main/Side trong LD §10, §11.1, §12.1, §13.1, §14.1, §15.1; mã biome theo file Biome và khu vực §5.
- **Ký hiệu:** ↺ là quay lại một biome đã gặp trước đó trên đường chính.

| # | Chặng | Biome | Area |
|---|---|---|---|
| 1 | Prologue | BIO-04 Hầm xương & vườn đất | The Old Face |
| 2 | Prologue | BIO-03 Làng đá lửa & sân nhà thờ | Sân nhà thờ Lychgate, đêm Vigil |
| 3 | I | BIO-03 ↺ | Lychgate (hub) → Churchyard |
| 4 | I | BIO-01 Đầm lầy & làng nước | Night Fens → Rook's Weir |
| 5 | I | BIO-02 Đồng thuốc phiện | Poppy Reach |
| 6 | I | BIO-05 Hospice vôi trắng | Gentle House |
| 7 | I | BIO-04 ↺ | Garden of Hush |
| 8 | I | BIO-27 Cell | The Cradle |
| 9 | II | BIO-09 Đèo tuyết-tro | Pilgrim Road |
| 10 | II | BIO-07 Thành bậc Sepulcra | Lowcourse (hub) → Stair of Penitence → Chancery |
| 11 | II | BIO-08 Nhà thờ & hầm chuông | Bell Catacombs → Scriptorium → Cathedral (yên, rồi cháy) |
| 12 | II | BIO-27 ↺ | Kneeling Vault |
| 13 | III | BIO-10 Biển khô | White Road |
| 14 | III | BIO-11 Hulk trắng & Namakhar | Namakhar (hub) |
| 15 | III | BIO-12 Hầm dưới Hulk | Undercity (cùng một bước với Namakhar) |
| 16 | III | BIO-11 ↺ | Lye Baths |
| 17 | III | BIO-10 ↺ | Garden of Pillars |
| 18 | III | BIO-06 Mỏ & Spoil (bản muối) | Old Salt Mine |
| 19 | III | BIO-11 ↺ | White Spire |
| 20 | III | BIO-27 ↺ | Salt Cell |
| 21 | IV | BIO-14 Băng Hoarfast | Frozen Army |
| 22 | IV | BIO-16 Vesnagrad & vườn kính | Vesnagrad (hub) → cuộc vây thành |
| 23 | IV | BIO-17 Phòng ướp & kho lọ | Stillroom |
| 24 | IV | BIO-15 Đồi tro lửa tế | Pyre-groves (giàn thiêu Gennet) |
| 25 | IV | BIO-14 ↺ | Rimewood |
| 26 | IV | BIO-17 ↺ | Archive of Faces |
| 27 | IV | BIO-27 ↺ | Unforgetting Deep |
| 28 | V | BIO-18 Wrackhaven | Hub ban ngày |
| 29 | V | BIO-19 Vách đá & hải đăng | Cliffs and lighthouses |
| 30 | V | BIO-21 Nước & tàu chìm | Sunken Chapel |
| 31 | V | BIO-18 ↺ | Wrackhaven by night |
| 32 | V | BIO-20 Lộ triều & rừng tảo | Long Sands |
| 33 | V | BIO-22 Tu viện thuỷ triều Ebbmount | Ebbmount Abbey |
| 34 | V | BIO-23 The Course | Bên trong Tường |
| 35 | V | BIO-25 The Seamless | Khu cuối |
| 36 | Ending | BIO-24 Cổng keystone | The keystone gate |

**Nhánh phụ:**

| Act | Area phụ | Biome | Vào từ |
|---|---|---|---|
| I | Edda's Dream | BIO-26 | Lychgate |
| I | Hầm gia đình Barrow (side space dưới ossuary, không phải area riêng) | — | Lychgate |
| I | Willow Mere | BIO-01 | Rẽ từ Night Fens |
| I | Flint Delvings | BIO-06 (bản đá lửa) | Rẽ từ Poppy Reach |
| III | Wreck Fields | BIO-10 | Rẽ từ White Road |
| III | Ship's Heart | BIO-13 | Tầng đáy của Hulk |
| V | Wrack-Woods | BIO-20 | Chỉ mở khi nước rút |
| V | Dawn Ship | BIO-21 | Nhánh phụ |

Side quest không có area riêng thì nằm trong area đã có và không thêm biome.

**Biome quay lại thì khác ở đâu:**

| Biome | Lần đầu | Quay lại | Lần sau khác ở chỗ |
|---|---|---|---|
| BIO-03 | Sân nhà thờ đêm Vigil | Lychgate + Churchyard | Đêm mưa không accent → ban ngày |
| BIO-04 | The Old Face | Garden of Hush | Ossuary gần như tối hẳn → hầm mộ thành vườn người ngủ, anh túc mọc từ miệng |
| BIO-27 | The Cradle (I) | Kneeling Vault (II), Salt Cell (III), Unforgetting Deep (IV) | Vật liệu theo Perfection: vải lanh → sắt → kính muối → lọ |
| BIO-10 | White Road | Garden of Pillars | Đồng muối trống trải → vườn tượng muối khép kín |
| BIO-11 | Namakhar | Lye Baths, White Spire | Boong tàu kiêm thành phố → nhà tắm kiềm → tháp trắng dựng đứng |
| BIO-14 | Frozen Army | Rimewood | Đồng băng có đội quân đóng băng → rừng băng, tuyết bay ngược |
| BIO-17 | Stillroom | Archive of Faces | Xưởng ướp người → thư viện lọ mặt người |
| BIO-18 | Hub ban ngày | Wrackhaven by night | Cùng thị trấn; ban đêm người chết về gõ cửa |

Hai biome lặp lại nhưng lần đầu nằm ở nhánh phụ:
- **BIO-06:** Flint Delvings (phụ) → Old Salt Mine (chính).
- **BIO-20:** Wrack-Woods (phụ) → Long Sands (chính).

**Ghi chú:**
- Đường chính đi qua 25/27 biome. BIO-13 và BIO-26 chỉ có ở nhánh phụ.
- **Act IV chơi khác thứ tự số mục.** Rimewood (14.3) và pyre-groves (14.4) đến **sau** Stillroom (LD §14.1). LD §14.3 cũng ghi Rimewood là đường tới Archive sau khi Gennet chết. Bảng §5 của file biome xếp theo số mục, không theo thứ tự chơi.
- **Trạng thái "after":** sau mỗi act, hub và wild chuyển sang trạng thái sau act. Biome giữ nguyên, chỉ đổi trạng thái. Khi làm asset hub hoặc wild, vẽ cả hai bản.
- **Nội dung mở thêm:**
  - **Remembrances (từ sau Act IV):** đánh lại boss trong arena có lớp "ký ức": mép kính băng, tuyết bay ngược, mất hết màu trừ accent của act.
  - **Inner Course (sau ending):** dungeon vô tận gồm BIO-23 cộng vật liệu Perfection theo Tide.
  - **Tide:** mỗi mùa phủ lớp overlay lên các khu cũ.

---

## 10. Prologue, Act I, Act II: người chơi làm gì và hình phải có

**Cách đọc:**
- Mỗi area ghi hai phần:
  - **Làm gì:** gameplay.
  - **Hình:** hình phải nhớ (mục "Remember" của LD, in đậm) cùng các chi tiết look.
- Thời gian là ước tính của LD.
- *(đề xuất LD)* là mục LD gắn Proposal.
- Act III–V chưa viết chi tiết; tạm dùng LD §13–§15 và file biome.

### 10.1 Prologue — *The Millennial Vigil* (khoảng 15 phút)

**Bối cảnh:** nửa đêm chuyển từ năm 999 sang năm 1000 AL. Đây là tutorial: hero chui ra từ Tường và chạy về phía ánh sáng đầu tiên.

**Dạy người chơi:**
- di chuyển, đánh, né;
- light radius;
- nghe trước khi thấy;
- Rite of Laying (chỉ xem Gennet làm);
- ranh giới của ánh sáng.

**Palette:** Act I ban đêm, không accent.

#### Cold open

- Dân làng hát *"Hold fast… until the last…"*, chuông vang, rồi mọi ngọn nến ở Ashlar tắt trong một hơi thở.
- Xa về phía tây, ngọn đèn ở cửa sổ một tu viện tắt rồi bùng trắng. Đây là lần đầu Widower's Light xuất hiện.
- Shot ngắn, rộng.

#### The Old Face (BIO-04, 6 phút)

**Làm gì:**
- Bò qua ossuary gần như tối hẳn. *(đề xuất LD)* Hero bò, chưa chạy được.
- Hai hoặc ba trận nhỏ: Shambler gõ trong hốc rồi xông ra; Mortar-Rat từ bức tường ấm.
- Không có pop-up; không gian tự dạy người chơi.

**Hình:**
- **Bàn tay nắm bàn tay, rồi bàn tay kia vỡ thành bụi.**
- Đi từ ánh trắng lạnh của cái lỗ phía sau sang đèn hổ phách của Gennet phía trước. Ánh sáng đầu tiên là của Tường, thứ hai là của Gennet.
- Sọ và xương dài trong vữa xám ấm, ẩm; nến Vigil đã tắt.
- Dòng chữ *BE KIND TO THEM*.
- Trước Old Face: một ghế gỗ, một tấm chăn gấp, tàn thuốc tẩu.
- Bóng hero xám có viền sáng từ lỗ trắng phía sau.

#### Lychgate churchyard (BIO-03, 9 phút)

**Làm gì:**
- Chạy dưới mưa xuống cổng lychgate cùng Gennet.
- Quái: Shambler trồi lên theo đợt (đất phồng lên trước mỗi con), Charnel Dead, Mortar-Rat.
- Mini-boss **Sexton's Dog**: dùng để dạy né, không khó.
- Xem Gennet làm Rite of Laying.
- Bước qua cổng là hết Prologue.

**Hình:**
- **Mái lychgate có đèn trong mưa, và tượng không mặt đã quay sang nhìn bạn.** Không nhấn tượng bằng camera hay âm thanh.
- Một tuyến dốc từ cửa nhà thờ xuống; cổng có đèn nhìn thấy ngay từ bậc nhà thờ.
- Mộ thấp; thuỷ tùng chỉ ở rìa.
- Mortsafe bị bẻ từ bên trong; nến hũ trên mọi ngôi mộ đều tắt.
- Cửa sổ làng màu hổ phách sau sương.
- Tháp ossuary tròn, nhà thờ đá lửa.

### 10.2 Act I — *The Gentle House* (Dolmoor, 3,5–4,5 giờ)

**Bối cảnh:**
- Ba năm nay bệnh Hush lan khắp Dolmoor: người bệnh ngủ mỉm cười rồi không dậy, được khiêng lên Gentle House.
- Người ngủ ở nhà mộng du qua đầm, hát một bài ru.

**Thông tin chung:**

| Mục | Nội dung |
|---|---|
| Perfection | Eleisa (Mercy); cám dỗ là **nghỉ ngơi** |
| Hệ thống mới | Rite of Laying, light radius, nghe trước khi thấy, ngủ/chậm |
| Mùa | Xuân mưa; sương nằm trong trũng tới trưa |
| Chuyển màu | Từ xanh ướt sang trắng lanh và đỏ anh túc khi tới gần Gentle House |
| Hình của act | Cửa sổ ấm trên đồi, nhìn qua nước đen, có tiếng ru vọng ra |

*(đề xuất LD)* Gentle House nhìn thấy được từ Churchyard, Night Fens, Rook's Weir và Poppy Reach. Đó là ánh sáng sáng nhất và đứng yên nhất của act.

#### Đường chính

1. **Lychgate (hub, BIO-03).**
   - **Làm gì:** nhận quest; gặp Gennet, Brannoc, Osric, Nell, Tamsin.
   - **Hình:** **trẻ con nhảy đếm đầu lâu bên ossuary trong mưa.**
     - Nhà sàn gỗ, tường đá lửa đẽo, mái rạ, khói than bùn, thùng nước mưa, lờ lươn; chỗ vá ở khắp nơi.
     - Cửa sổ hổ phách, lửa lò rèn, đốm tàn tẩu của Gennet.
     - Tháp ossuary, bảng tên người ngủ, chuông tang.
     - Không phải làng fantasy ấm cúng: nghèo, ướt, hơi ấm phải trả giá.
2. **Churchyard, quest *Grave Matters* (BIO-03, 20 phút).**
   - **Làm gì:** học Rite of Laying ở năm ngôi mộ: giữ nút, quỳ, hỏi *"Will you hold?"*. Gặp quái đánh xa đầu tiên (Charnel Bowman).
   - **Hình:** **quỳ bên mộ trong mưa.**
     - Mưa phùn xám, ánh sáng không có bóng.
     - Mortsafe, mộ mới, giá treo cổ tẩm hắc ín, quạ, thuỷ tùng.
     - Khi cả năm mộ đã yên: sương mỏng đi, quạ đậu lại.
3. **Night Fens, quest *The Count of the Sleepers* (BIO-01, 35 phút).**
   - **Làm gì:**
     - Theo tiếng ru qua đầm đêm, không có marker.
     - Gặp the Soothed (là nạn nhân) theo ba bước: nghe, thấy, rồi mới đánh.
     - Mid-boss **Lullaby Man**: không được đánh trúng cái nôi-lồng.
   - **Hình:** **hàng người mộng du mặc áo ngủ trắng, ngân nga băng qua nước đen về phía cửa sổ ấm trên đồi.**
     - Đê đất giữa lau sậy và nước đen; đá dựng phủ địa y; sương trên mặt nước.
     - Corpse-candle trôi lơ lửng, ánh đứng yên và đẹp vì đó là mồi nhử.
     - Nhiều sao hơn bình thường.
     - Vòm của act: hai đá dựng nghiêng vào nhau trên đê.
     - Áo ngủ của the Soothed là màu trắng sạch duy nhất ở Dolmoor.
4. **Rook's Weir (BIO-01, 18 phút).**
   - **Làm gì:** nhịp lặng, ít đánh nhau; đi trên mái nhà và cầu ván, không bơi; thấy bến thuyền của Gentle House. Có side quest *The Ferryman's Toll*.
   - **Hình:** **lái đò chết chống thuyền chở người ngủ dưới mái vải lanh trắng, hỏi xin thêm một đồng.**
     - Nước đen đứng im, phản chiếu nhà cửa.
     - Bàn ăn bày sẵn dưới nước, rèm ren trôi trong phòng ngập.
     - Tháp chuông nhô lên khỏi mặt nước.
     - Thuyền mái lanh, đèn trắng đứng yên: vải của Mercy và ánh sáng của Perfection.
5. **Poppy Reach (BIO-02, 28 phút).**
   - **Làm gì:**
     - Leo qua đồng anh túc ban ngày lên Gentle House.
     - *(đề xuất LD)* Khói ngủ là địa hình: trôi theo gió, đóng mở lối đi; đứng trong khói thì chậm dần rồi ngủ thiếp.
     - Poppy Nurse hát và hồi máu cho quái quanh nó.
     - Có cửa vào Flint Delvings.
   - **Hình:** **anh túc đỏ tới chân trời, cửa sổ ấm của Gentle House trên đỉnh dốc.**
     - Anh túc đỏ trong cỏ xám xanh: điểm accent mạnh nhất của act.
     - Ánh u ám mềm; khói có viền rõ, tint ấm nhẹ.
     - Xe bò bỏ lại, còn chăn đệm; nhà trại giường trống, mỗi giường còn một chiếc gối sạch.
     - Cánh đồng phải đẹp; Poppy Nurse không được trông độc ác.
6. **Gentle House (BIO-05, 12 phút, không chiến đấu).**
   - **Làm gì:**
     - Mother Hawise mời nghỉ và mời trà anh túc. Uống trà thì thấy vision: tu viện bên biển, đèn cửa sổ cao, giọng nói *"Come home."*
     - Đưa Tamsin ra ngoài trước khi các sơ để ý.
     - *(đề xuất LD)* Chỉ được đi bộ, ẩn UI chiến đấu; bị bắt gặp thì được dẫn ra cổng.
   - **Hình:** **chén trà anh túc trong ánh cửa sổ ấm, một người phụ nữ hiền bảo bạn có thể nghỉ rồi.**
     - Nội thất đẹp nhất Act I: vôi trắng mới không một chỗ vá (đó chính là lời cảnh báo).
     - Vải lanh sạch, bánh mì, hoa trong bình; hàng người ngủ mỉm cười.
     - Các sơ đội khăn trắng thêu anh túc đỏ; nến không lập loè.
     - *(đề xuất LD)* Mưa dừng ở cổng.
     - Không dùng nhạc dồn, đèn đỏ, góc máy nghiêng. Nếu chỉ nhìn art mà người chơi đã nghi ngờ thì cảnh này hỏng.
7. **Garden of Hush (BIO-04, 35 phút).**
   - **Làm gì:**
     - Xuống hầm mộ dưới hospice. Fen nằm ở đây, Tamsin không đánh thức được cậu.
     - *(đề xuất LD)* Như đi trong phòng bệnh ban đêm: dùng kỹ năng ồn gần người ngủ sẽ làm chuông treo trên hàng rung lên và gọi Poppy Nurse tới.
     - **Ngọn đèn phía trước** xuất hiện lần đầu, ở chỗ khó đi nhất.
   - **Hình:** **hàng người ngủ vùi trong đất tối, hoa anh túc đỏ nở ra từ mỗi miệng.**
     - Cạnh mỗi người có một đèn ngủ nhỏ đứng yên.
     - Mái vải lanh, rễ cây trên vòm, tường ẩm.
     - Kênh tưới, giá phơi, phòng thu hoạch.
     - Xa trong bóng tối có một ánh trắng không lập loè.
     - Không gore. Mỗi hàng là những người khác nhau: mặt, tuổi, quần áo, kỷ vật.
8. **The Cradle (BIO-27, 20 phút).**
   - **Làm gì:** đánh boss **Hospice Mother**.
     - Tiếng ru làm tối màn hình và làm hero chậm lại.
     - Những bàn tay mềm cố "đắp chăn" cho hero; đèn ngủ tắt dần từng cái.
     - Thắng thì ánh sáng Mercy chảy vào hero; quả cầu máu đổi từ xám sang đỏ.
   - **Hình:** **hàng chục bàn tay trắng mềm cúi xuống đắp chăn cho bạn, trong khi đèn ngủ tắt từng cái một.**
     - Nôi bằng xương, mái lanh, ánh trắng sữa đứng yên.
     - Lối vào là dãy nôi lặp lại vào sương đen.
     - Hospice Mother là một khối vải lanh che mạng khổng lồ, có hàng chục bàn tay trắng mềm, miệng luôn "suỵt".
     - Mỗi bàn tay in bóng mềm xuống sàn trước khi đập xuống: đó là telegraph tự nhiên.

#### Nhánh phụ

- **Edda's Dream (BIO-26, 6 phút, quest *The Broth*).**
  - **Làm gì:** vào giấc mơ của Edda; không có nguy hiểm nào.
  - **Hình:** **ánh nắng duy nhất ở Dolmoor.**
    - Mái rạ mới, không vá, sạch quá mức; rìa ảnh cháy sáng; mặt trời đứng yên.
    - *(đề xuất LD)* Hero là bóng đổ duy nhất.
    - Đây là ánh nắng, khác ánh nội thất ấm của Gentle House. Cảnh này là một bản nhẹ của Seamless.
- **Willow Mere (BIO-01, 12 phút, quest *The Willow Bride*).**
  - **Làm gì:** đánh boss phụ là cô dâu chết đuối.
  - **Hình:** **cây liễu lớn nghiêng về khoảng trống.**
    - Màn liễu rủ, nước đứng, hoa trắng trôi.
    - Mạng che mục mắc trong rễ; chuông cưới gỉ treo trên cành.
    - Ánh sáng xám, không có đèn.
    - Thòng lọng chỉ ở trên cao trong tán cây; không treo xác.
- **Flint Delvings (BIO-06, 30 phút, dungeon tuỳ chọn).**
  - **Làm gì:** lần đầu gặp Discarded; phải giết Kiln-Shaman trước; boss phụ Ember-Pot.
  - **Hình:** **tượng thánh không mặt bị trộm, mang một khuôn mặt đất sét do những bàn tay đỏ nhỏ ấn lên.**
    - Tầng trên: phấn trắng, đá lửa đen, cột chống gỗ, cuốc sừng.
    - Sâu hơn: ánh lò đỏ cam phập phồng, muội, vệt đất sét, chồng gạch, đồ tuỳ táng ăn trộm.
    - Tầng Spoil: khối đá Mason khổng lồ đổ lệch, còn vạch dẫn và dấu thợ.
    - Hodling vừa đáng thương vừa nguy hiểm, không phải vai hài.
- **One for the Footing** (hầm gia đình Barrow) và **The Mortsafe Thieves**: nằm trong Lychgate và Churchyard.

#### Sau Act I

- Sương tan lần đầu sau ba năm. Wild chuyển sang ánh xám trong, nhìn được xa.
- Gentle House tắt đèn.
- Ossuary đầy, các mộ mới đã yên.
- Đầm không còn đoàn người mộng du; ếch kêu lại.
- *(đề xuất LD)* Ruy băng đen thay nhành anh túc trên cửa nhà.
- *(đề xuất LD)* Anh túc khép cánh và rụng.

### 10.3 Act II — *A Kneeling Fire* (Graveteeth & Sepulcra, 3,5–4,5 giờ)

**Bối cảnh:**
- Kneelers (dòng Iron Halo) chiếm phố, thiêu bất kỳ ai ngập ngừng khi cầu nguyện.
- Cassian đã quỳ 41 năm dưới nhà thờ; lời cầu của ông vang trong đầu cả thành.

**Thông tin chung:**

| Mục | Nội dung |
|---|---|
| Perfection | Latreus (Devotion); cám dỗ là **sự chắc chắn** |
| Hệ thống mới | *Doubt*; Mason đầu tiên biết nói; người hầu của Lodge bắt đầu đi lang thang; lớp tiếng cầu nguyện nền |
| Mùa | Hè trên núi; tuyết không tan |
| Chuyển màu | Từ tuyết xám muội sang trắng xương và vàng, rồi sang lửa |
| Hình của act | Thành phố leo vách theo từng tầng, giàn thiêu cháy trên cầu thang, nhà thờ trên đỉnh với tiếng chuông không bao giờ dứt |

**Hướng đi của act:** Act I đi ngang, Act II đi **lên**. Các tầng của thành phố là các course của Tường; tầng đáy gánh tất cả.

#### Đường chính

1. **Pilgrim Road (BIO-09, 40 phút).**
   - **Làm gì:**
     - Hộ tống đoàn Pallbearer qua ba con đèo, theo nhịp đi rồi dừng giữa các trạm. Phần hộ tống phải dễ thở.
     - Gặp Ser Hamon.
     - Cinder-Clan (Discarded sừng dê) đột kích ở các chỗ hẹp.
     - Exhumer phục kích ở đèo cuối; Ignatia gọi hero là *"Deserter."*
     - Chạy qua cầu dây đang sập.
   - **Hình:** **người hành hương đông cứng, quỳ trong tuyết xám, tro giàn thiêu của Sepulcra rơi lên họ.**
     - Đỉnh núi đen; tuyết xám, sẫm hơn ở phía xuôi gió về thành.
     - Cọc gỗ hình wedge ghi tên; Pallbearer khiêng quan tài đen.
     - Nắng núi mỏng, mặt trời thấp, bóng dài.
     - Hoàng hôn ở đèo cuối: vách đá xa rực ánh giàn thiêu.
     - Vòm của act: hai người sám hối đông cứng tựa vào nhau.
     - Không phải núi tuyết chung chung: tuyết xám vì tro của người.
2. **Lowcourse (hub, BIO-07).**
   - **Làm gì:** vào thành ở tầng đáy; gặp Old Vellum dưới hầm lò bánh mì; nhận *Ash Ledger*, *The Saint in the Box*, *The Upper Course*.
   - **Hình:** **tro từ giàn thiêu trên cao rơi như tuyết xuống lò bánh, nơi kẻ dị giáo giữ sự thật.**
     - Đá vôi trắng xương, có vệt muội chảy từ trên xuống.
     - Trụ chống, giàn đỡ ở khắp nơi; dây phơi, đền nến nhỏ; lò đúc chuông lập loè.
     - Ánh vàng của nhà thờ rực, đứng yên, tít trên cao.
     - Vòm cổng lên Stair là ngưỡng của hub; nhìn qua đó thấy giàn thiêu.
     - Không biếm hoạ khu ổ chuột: cho thấy lao động, phẩm giá, người đỡ nhau.
3. **Stair of Penitence (BIO-07, 35 phút).**
   - **Làm gì:**
     - Leo phố zíc-zắc; mỗi chiếu nghỉ có một giàn thiêu và là một arena.
     - Đoàn rước Kneeler là chướng ngại: né hoặc đánh.
     - Quái mới: Kneeler, Bell-Head, Censer-Bearer, Pyre-Risen.
     - *(đề xuất LD)* Cơ chế *the Kneeling*: chuông lớn điểm thì mọi tín đồ quỳ xuống. Hero còn đứng thì bị thấy; quỳ theo thì lẫn được vào đám đông.
   - **Hình:** **cả thành phố quỳ xuống cùng lúc, chỉ mình bạn còn đứng.**
     - Phố trắng xương phủ muội; giàn thiêu cam trên các chiếu nghỉ.
     - Cờ Iron Halo, khói lư hương, đám đông quỳ, giá nến hình wedge.
     - Cửa sổ nhà nguyện sáng màu xanh đậm và đỏ thẫm.
     - Giàn thiêu chỉ thể hiện bằng silhouette và âm thanh, không cận cảnh thiêu người.
4. **Chancery, quest *The Bought Course* (BIO-07, 30 phút, heist).**
   - **Làm gì:**
     - Đột nhập để lấy sổ sách; có nhiều lối vào.
     - Tượng nhìn thấy hero thì đánh thức người hầu của Lodge. Saint-Statue, Plumb-Hound, Gargoyle Mortarer xuất hiện lần đầu.
     - Không phải màn stealth có màn thua.
     - Tìm được dòng *"Keystone's term: 1000 AL. Replacement: none found."*
   - **Hình:** **bản đồ thiên đường bằng đồng thau, mỗi course khắc một giá tiền** *(đề xuất LD)*.
     - Không gian giàu nhất act: cẩm thạch vân tối, mạ vàng, biển đồng, sổ bìa da, ánh vàng nến đứng yên.
     - Tượng quay đầu thêm một chút mỗi lần người chơi đi qua.
     - Sàn giữ tối và yên.
5. **Bell Catacombs (BIO-08, 35 phút).**
   - **Làm gì:**
     - Dungeon chính của act.
     - *(đề xuất LD)* Cơ chế *resonance*: chuông ngân làm lộ kẻ địch như sonar, nhưng cũng đánh thức Charnel Chanter.
     - Mid-boss **Choir of Nails**: làm câm từng giọng hát một.
     - Ngọn đèn phía trước xuất hiện lần hai, ở khu hố chuông.
   - **Hình:** **chuông treo thả xuống bóng tối; khi chuông ngân, có người hát trong khối đồng.**
     - Chuông đồng xanh rỉ, tên người đúc trên vành.
     - Hốc xương, gốc nến, vòm thấp.
     - Choir of Nails là chục ca viên Kneeler hợp lại thành một cây organ bằng thịt và sắt.
6. **Scriptorium (BIO-08, 12 phút).**
   - **Làm gì:** vào căn phòng niêm phong 600 năm, rất ít quái; đọc *Unedited Testament*. Gennet nói: *"It's not an attack. It's an expiry."*
   - **Hình:** **nét chữ run của một người đàn bà đánh cá, đọc dưới một ngọn nến lập loè: "I choose it anyway."**
     - Giấy da, bụi, mạng nhện, sách bị xích.
     - Không có ánh sáng cho tới khi nhóm mang đèn vào.
     - Các bản sao bị cạo mất chữ "for a thousand years", bày ra như vật chứng.
7. **Cathedral, cảnh *The Plumb* (BIO-08, không chiến đấu).**
   - **Làm gì:** tượng Nameless Saint khổng lồ quay đầu và nói *"A stone has fallen from the Course. Return it."* Bàn tay đá khép quanh hero rồi mở ra.
   - **Hình:** **tượng không mặt khổng lồ quay sang nhìn bạn, bàn tay đá khép lại rồi không khép nổi.**
     - Không gian lộng lẫy nhất Act II: vòm trắng xương, mạ vàng, kính màu, Wedge ở khắp nơi, ánh vàng nến đứng yên.
     - Tượng quá to, ngay cả với gian thờ này.
     - Đây là lần đầu người chơi thấy tượng chuyển động: chậm, khổng lồ, chỉ có tiếng đá nghiến.
8. **Cathedral, cảnh *The Iron Halo* (BIO-08, set piece).**
   - **Làm gì:** Kneeler kéo Perpetua lên giàn thiêu. Hero và Ignatia đánh ngược lên qua nhà thờ đang cháy và kéo bà khỏi cọc.
   - **Hình:**
     - Khói, kính vỡ, vàng mạ chảy, bóng đen.
     - *(đề xuất LD)* Giàn thiêu dựng trên gallery, trước cửa sổ hoa hồng.
     - *(đề xuất LD)* Lửa lột bức hoạ Bulwark mạ vàng, để lộ bức tường linh hồn nắm tay nhau bên dưới.
     - Lửa ở rìa khung; sàn giao tranh tối hơn lửa để quái thành silhouette.
9. **Kneeling Vault (BIO-27, 25 phút).**
   - **Làm gì:**
     - Đánh boss **Brother Cassian**: lệnh **"KNEEL."** ép hero quỳ, phá được bằng *Doubt*.
     - Ông chết thì tiếng cầu nguyện tắt hẳn.
     - Sàn nứt thành breach; lần đầu người chơi thấy vật liệu của Course.
   - **Hình:** **ông lão giật đôi chân đá khỏi sàn sau 41 năm, đội vòng gai hướng vào trong, ra lệnh cho bạn quỳ.**
     - Gian giữa vô tận treo xích; mọi hàng ghế đầy người chết đang quỳ, lặp vào sương đen.
     - *(đề xuất LD)* Vòm trần là cột sống và xương sườn khổng lồ của Latreus; hậu cung viền gai của vòng sắt. Kiến trúc và cơ thể là một.
     - Sắt, xích, mỡ nến, ánh vàng nến đứng yên.
     - Cassian không phải phản diện: ông chết trong nước mắt.

#### Kết act — *Her Gravity*

- Perpetua kể sự thật, rồi tự bước vào breach. Tường khép lại và giữ được.
- Ignatia bẻ ấn Exhumer và gia nhập đội.
- Ser Hamon cũng gia nhập trong Act II.

#### Side quest (đều trong area đã có)

| Quest | Nằm ở / nội dung |
|---|---|
| *The Kneeler's Daughter* | Nhà nguyện trên Stair |
| *Ash Ledger* | Một "kẻ dị giáo" Ignatia từng thiêu |
| *The Bell Without a Tongue* | Tháp chuông |
| *The Upper Course* | Mặt Tường của Sepulcra |
| *The Saint in the Box* | Đầu lâu biết nói ở chợ thánh tích; phần hài để ở vendor |

#### Sau Act II

- Tiếng cầu nguyện tắt khỏi mọi khu của Sepulcra.
- Kneeler bỏ vòng sắt; nhiều người không đứng dậy nổi.
- Giàn thiêu tắt.
- Thợ bánh đọc Testament giữa phố mà không ai bị thiêu.
- *(đề xuất LD)* Trên phố có đống vòng sắt; cọc thiêu còn bốc khói.
- *(đề xuất LD)* Tro hết rơi xuống Lowcourse.
- *(đề xuất LD)* Mái nhà thờ mở ra trời; bức tường linh hồn vẫn lộ.
- *(đề xuất LD)* Vữa mới ở breach in hình một người đàn bà chống gậy.

---

## 11. QA bắt buộc cho từng ảnh

**Checklist:**
- [ ] **Style:** đặt cạnh ảnh mẫu §1.3 ở cùng cỡ.
  - Đúng mức stylized của Immortal: không realistic, không hoạt hình.
  - Không có micro texture.
  - Còn form shading: vải có mảng tối lớn, không phẳng.
  - Không có viền đen.
- [ ] **Bố cục:**
  - Đúng số hình, thứ tự, nhãn và tiêu đề; chữ chính xác.
  - Không có chữ thừa, không watermark.
  - Không bị cắt, không chồng lên nhau.
- [ ] **Tỷ lệ:**
  - Đo theo bóng người H, không theo vạch model vẽ.
  - Con nhỏ hoặc con bay: kiểm bằng pixel.
  - Đạo cụ cao nằm trọn trong khung.
- [ ] **Nhất quán giữa các góc:**
  - Chi tiết một bên nằm cùng một bên giải phẫu ở mọi góc.
  - LEFT/RIGHT đúng hướng; BACK không phải FRONT lật lại.
  - Bộ phận quấn quanh thân (vòng cổ, đai, dây, xích) và đuôi: cùng độ cao (% chiều cao) ở mọi góc và đúng thứ tự che khuất so với góc bên; góc bên quyết định (skill T-pose, bước 4b: bảng VIEWS + `strip`).
  - Ở T-pose, góc LEFT/RIGHT thấy tay theo chiều đầu tay.
- [ ] **Màu:**
  - Khối màu chính / phụ / nhấn đọc được ở thumbnail.
  - Đúng palette act; không dùng màu bị cấm (§8).
  - Prologue không có accent; Lodge không phát sáng; đỏ ở Act III chỉ là máu.
  - Hai màu trắng không lẫn nhau.
- [ ] **Value:** chuyển sang grayscale vẫn tách được chủ thể khỏi nền.
- [ ] **Nội dung:** đạt §3.8.
- [ ] **Terrain:**
  - Lát 2×2 / 3×3 không thấy lưới, không thấy mép.
  - Không có vật lớn chạm mép; độ sáng đều.
  - Không có viền trắng quanh đá.
- [ ] **T-pose cho Tripo:**
  - Ánh sáng từ trên, giống nhau ở mọi góc.
  - Khoảng một phần ba bề mặt vải nằm trong bóng.
  - Không thêm cơ bắp, móng, răng so với concept.
  - Dạng người: vai ngang bằng, tay thẳng ngang vai (không xệ), chân thẳng và song song, góc bên chân chồng nhau không bước; cùng chiều cao đầu, vai, hông, sàn ở bốn góc (xem `views/_guides.png`).
- [ ] **Ảnh hàng cho Tripo (§3.7):**
  - Đúng số asset và thứ tự theo kế hoạch hàng; một hàng, cùng đường nền.
  - Mỗi asset khớp ô concept đã duyệt (hình, màu, chi tiết một bên, số bộ phận).
  - Khoảng trống rõ giữa các asset; không chạm, không che nhau; không bị cắt mép.
  - Không đế, tảng đất hay nước dưới asset; không bóng người, không chữ, không số, không thánh giá.

**Xử lý kết quả:**
- **Ảnh đạt:** gửi đường dẫn ảnh cho người dùng ngay.
- **Ảnh trượt:** ghi lỗi, chạy lại với hậu tố mới, giữ ảnh cũ.
- Người dùng là cổng duyệt cuối.

---

## 12. Nhật ký quyết định

| Ngày | Quyết định của người dùng | Áp vào |
|---|---|---|
| 25/10 | **Tay được chọn phải NGỬA LÒNG BÀN TAY LÊN** ("các tay cần ngửa lên khi được chọn"): khi chọn, mọi tay (kể cả PB, OS, BR đang chìa mu tay ở màn chờ) xoay thành lòng bàn tay hướng lên trời, mở như chìa ra để được nắm; dấu ở mu tay chỉ thấy ở cổ tay và mép bàn tay. Áp cho concept showcase và chuyển động trong lab | key art showcase màn chọn nghề, lab `choiceHands` |
| 25/10 | **Màn chọn nghề: chọn tay nào thì tay đó showcase chính nó** ("showcase của cái tay chứ không phải của hero"), hiện ngay khi chọn; vẽ concept ấn tượng cho từng lựa chọn để tham khảo ("vẽ concept ấn tượng cho mỗi lựa chọn"). Mỗi nghề một key art 16:9: bàn tay vươn ra khỏi tường sọ về phía người xem, khoe dấu nhận diện (Voc §3.2) và một hiệu ứng nghề nhỏ theo §5.5 (lửa ấm cho đèn/than/giàn thiêu, điểm hồn trắng-xanh tĩnh chỉ cho OS), các tay khác chìm trong bóng; thiết kế tay theo concept hero v5 hướng A. Không phải hero, không toàn thân | key art màn chọn nghề, §7.4 |
| 24/10 | **Inventory dùng lưới kiểu Diablo II, góc nhìn icon cũng như D2** ("Lưới kiểu d2 nhé, góc view cũng giống d2"). Mỗi item chiếm một footprint ô (nhẫn 1×1, giáp ngực 2×3, vũ khí cán dài 2×4…; bảng ở `docs/ASHLAR_ITEMS_VI.md` §1.3). Icon nhìn gần như thẳng, gần trực giao, vật dựng đứng (lưỡi và cán thẳng đứng, đầu ở trên, nghiêng tối đa khoảng 10°), áo giáp trải phẳng nhìn từ trước, sáng từ trên bên trái, vật lấp kín footprint. Vẽ theo style §1, không bắt chước kiểu pre-render của D2. Thay góc 3/4 chéo của sheet item v1 | concept item, §3.2 |
| 24/10 | Tổng hợp và gen concept item cho inventory và shop ("Tổng hợp và gen concept các item dùng cho inventory và shop"). Danh mục ở `docs/ASHLAR_ITEMS_VI.md`. Sheet item theo §1.3 của danh mục (**đề xuất, chờ người dùng duyệt định dạng**): 4–6 ô đánh số, mỗi ô một vật ở góc 3/4 hơi từ trên, vật dài đặt chéo, nền xám ấm phẳng, **không khung độ hiếm** (UI ghép khung theo bậc Rubble → Hallowed), vật không phát sáng | concept item, §3.2 |
| 24/10 | Gen ảnh Codex phải tiết kiệm token như Map 1 ("làm theo hướng của bạn"): mỗi phiên một ảnh, prompt dựng sẵn, Astra không đọc tài liệu, không tự QA. Cơ sở: quái Act II tốn khoảng 248k token đầu vào mỗi ảnh so với 98k ở Map 1, vì mỗi lane đọc cả file này, đọc mọi QA cũ và làm nhiều vòng trong một phiên | §13 |
| 23/10 | Kiln-Bull chỉ cao bằng **1,4 người (1.40H)**; concept r3b quá to so với người | §6.2; D03, thay kích thước bốn chân cũ |
| 23/10 | Concept NPC toàn game: mỗi NPC hai phương án. Giữ tuổi canon cho Tamsin, Fen, Wystan, Mila và các NPC trẻ; cho phép ngoại lệ concept kín đáo, đúng tuổi, mặc đầy đủ trang phục, không gợi dục, không thương tích đồ họa. Yarik và Bozhena chưa có tuổi cụ thể trong nguồn; không tự ghi tuổi thành canon. | §3.8, concept NPC |
| 23/10 | Kiln-Bull đổi sang đi bằng hai chân, tay to và thân hình bulky hơn | §6.2; D03, concept sửa dáng |
| 19–20/10 | Chọn ASHLAR làm thế giới | Toàn bộ |
| 19–20/10 | Mood theo từng map; Map 1 = mood Act I Diablo II; Dark Wood v1 không phải mood chung | §2 |
| 20/10 | Terrain painterly ít chi tiết, mảng lớn. Bản `stylized` đầu (nhiều chi tiết) và `stylized3` (đá nhỏ lốm đốm) bị loại; đường đá viên lớn `stylized2` | §1, §7.1 |
| 20/10 | Concept map đầu: bám style Diablo Immortal và art direction, ít texture, một bóng người để so kích thước, góc 3/4 + bốn góc. Môi trường khoảng 6 asset một ảnh; mỗi quái 2 phiên bản; 30 loại (25 thường + 5 boss); xong ảnh nào gửi ảnh đó | §6, §7.2, §13 |
| 20/10 | Rev 2 quái: bám Diablo hơn (Immortal / D3); màu chính, phụ, nhấn rõ; zombie rách và cách điệu hơn; 3/4 cầm vũ khí + vũ khí vẽ riêng + bốn góc T-pose tay không; đúng tỷ lệ H | §3.4, §6 |
| 20/10 | Hero qua năm vòng, xem bảng ngay dưới | §3.3, §5 |
| 20/10 | T-pose cho Tripo phải giữ khối sáng tối của vải ("mất khối sáng tối vải") | §3.6 |
| 20/10 | Brief và prompt ảnh không chạy vòng tự review Opus ("bỏ qua bước tự review"); vẫn tự QA ảnh | §13 |
| 20–21/10 | Blend terrain trong game mịn và rộng | §7.1 |
| 21/10 | T-pose cho concept dạng người phải kiểm kỹ vai, tỷ lệ tay chân, chân đứng thẳng ở cả bốn góc (hero có váy xẻ: tay xệ, vai lệch, chân dạng rộng, góc bên bước chân) | §3.6, §11 |
| 21/10 | Vòng cổ B01 ở góc BACK nằm đè lên khối vai (sai thứ tự che khuất so với góc bên), đuôi BACK dài hơn góc bên: bắt buộc đối chiếu chéo giữa các góc, chủ động, trước khi báo | §11 |
| 21/10 | **Xác nhận: hơi stylized như Diablo Immortal. Mọi bước gen ảnh phải bám file này** | §0, §1 |
| 22/10 | Gom nhiều asset vào một ảnh để Tripo dựng một loạt mỗi lượt ("gom nhiều assets vào 1 hình để tripo gen 1 loạt được nhiều cái"). Mỗi ảnh là **một hàng ngang** 3–5 asset cùng cỡ (nhà, tháp, cây lớn, vòm: 2 cái hoặc 1 cái), cùng một đường nền, khoảng trống rõ giữa các asset, sàn studio phẳng không đế, không bóng người, không chữ; giữ đúng thiết kế của ô concept đã duyệt. Cơ sở là bài học Tripo 19/10: Tripo bỏ các hàng dưới của sheet nhiều hàng, ô vẽ từ camera game cao ra mô hình đứng trên tảng bùn nghiêng, hàng bị tách trước sau. Chỉ dùng Codex (Astra) để gen ảnh | §3.7 (khối `TRIPO ROW INPUT`), §7.2, §11 |

**Các vòng hero (20/10):**

| Vòng | Quyết định |
|---|---|
| v1 | Bị loại: xỉn, bụi |
| v2 | Nổi bật, nhiều màu, cường điệu đạo cụ |
| v3 | Bố cục 3/4 + bốn góc + vũ khí vẽ riêng; cách điệu hơn |
| v4 | Tối đa hai lớp vải; archetype Diablo; nhân vật nữ gợi cảm tinh tế |
| v5 | Giảm texture, giữ khối sáng tối |

---

## 13. Cách chạy gen

**Ai tạo:** Astra (`codex` / `gpt-6-astra`), bằng công cụ `image_gen` tích hợp.
- Không dùng API key.
- Không vẽ bằng code (PIL, SVG, canvas).
- Không mở `codex` lồng nhau.
- Code chỉ dùng để dựng khung tỷ lệ, cắt ảnh và đo.

**Tiết kiệm token (bắt buộc từ 24/10):** mỗi lượt Codex gửi lại toàn bộ ngữ cảnh, nên token tăng theo số lượt nhân với độ dài ngữ cảnh.
- **Một phiên `codex exec` mới cho một ảnh.** Không giao cả lane nhiều con hay nhiều vòng sửa cho một phiên Astra; không dùng T3 `delegate_task` cho gen ảnh.
- **Claude dựng sẵn prompt hoàn chỉnh** bằng `pipeline/codex/build_prompt.py`: script dán nguyên văn các khối §3 theo loại ảnh, thêm thứ tự ảnh đầu vào, mô tả asset và danh sách sửa. Astra không đọc file này, checklist, QA cũ hay skill.
- **QA §11 do Claude làm** trên PNG trả về. Ảnh trượt thì Claude viết danh sách sửa ngắn (chỉ lỗi còn lại) và tạo job mới với hậu tố mới.
- Ảnh tham chiếu chỉ gồm ảnh mới nhất của biến thể và khung tỷ lệ, không gắn cả chuỗi bản cũ.
- Runner in số token mỗi ảnh; mức chuẩn khoảng 100k token đầu vào mỗi ảnh (Map 1). Cao hơn hẳn thì xem lại prompt và số lượt.

**Chạy loạt:**
- Runner chuẩn: `pipeline/codex/astra_batch.py --jobfile <jobs.json>` (cách dùng ở `pipeline/codex/README.md`). Mặc định 4 phiên song song; 10 phiên từng chạy ổn nhưng dễ chạm rate limit.
- `CODEX_HOME` mặc định `E:\map01-batch\home` (đổi bằng `--codex-home`). Runner in account id lúc bắt đầu: so với tài khoản muốn dùng trước khi chạy. Copy `~/.codex/auth.json` sang chỉ khi chắc đúng tài khoản.
- Đưa prompt qua stdin (`- < task.txt`) để phiên không treo chờ input.
- Ảnh ra nằm ở `<CODEX_HOME>\generated_images\<session>\`; runner tự copy về thư mục asset.
- Runner cũ ngoài repo (giữ để tham khảo):
  - `E:\map01-batch\`: quái, terrain;
  - `E:\hero-batch\`: hero.

**Khi lỗi:** gặp "model at capacity", bị từ chối an toàn nhầm (hay gặp với prompt có người ngủ, áo ngủ) hoặc phiên treo thì **mở phiên mới**. Không dừng lại để báo "blocked".

**Tham chiếu:** quy tắc gắn ảnh ở §1.3; khung tỷ lệ ở §6.5.

**Review:**
- Brief và prompt ảnh không chạy vòng Sonnet → Opus (quyết định 20/10).
- Tự QA từng ảnh theo §11.
- Code của pipeline (script, runner) vẫn theo `Agent.md`.

**Lưu và đặt tên:**
- Mỗi ảnh kèm prompt; nếu chạy batch thì kèm cả task, log, result.
- Chạy lại thì đặt hậu tố mới.
- Không xoá ảnh bị loại; chuyển vào `_work/_rejected/` (cạnh ảnh) nếu cần.

**Gửi người dùng:**
- Xong ảnh nào gửi ảnh đó, bằng đường dẫn tuyệt đối dạng ảnh Markdown; không đợi đủ bộ.
- Ghi rõ ảnh nào còn lỗi.

---

## 14. Chưa khoá

**Map và trình bày:**
- Phạm vi Map 1 (bao nhiêu area, thuộc act nào).
- Giờ trong ngày, camera và budget của Map 1.
- Mood của các map ngoài Map 1.
- Màu elite và cường độ cột sáng loot.
- Camera chung, nền tảng phát hành và budget hiệu năng.

**Hero:**
- Chọn hướng A hay B cho từng nghề.
- Palette cuối và mức phóng đại cuối.

**Số liệu chuyên đề:** số liệu Quy chuẩn quái và 27 biome vẫn là đề xuất đang review; biome chưa được duyệt.

**Lỗi canon chưa sửa** (không tự sửa bằng hình):
- Gennet nói "nine hundred years", trong khi nhà Barrow đã canh Old Face từ năm 0 AL.
- Sexton's Dog không có trong phần Prologue của Bible, và là con vật nhưng bị xếp vào Unlaid.
- Ignatia "biết" Ezra Mott.
- Hamon và Ignatia cùng vào đội ở Act II.
- Quy tắc xếp tầng của Course chưa chốt.
- Đèn của Severin vừa ở cửa sổ vừa đi theo hero.
- Động cơ của Act III mâu thuẫn với việc Ebbmount được công khai.

**Phân họ quái chưa chốt:**
- Năm quái hai họ: F02, F05, F06, F08, F13.
- Hai "Kneeler": F04 và P08.
- Họ Warped có chứa những thứ không phải động vật.

---

## 15. Tài liệu liên quan

Đường dẫn tính từ `ashlar/`.

| Cần | File |
|---|---|
| Lý giải dài, bài học Immortal, nguồn công khai | `ASHLAR_ART_DIRECTION_VI.md` (v1.1), `ASHLAR_ART_DIRECTION_BOARD.html` |
| 27 biome, 50 area, palette từng biome, hub | `docs/ASHLAR_BIOME_VA_KHU_VUC_VI.md` |
| Kích thước, màu key, silhouette từng ID quái | `docs/ASHLAR_QUY_CHUAN_QUAI_VI.md` |
| 116 ID quái, cột duyệt | `docs/ASHLAR_MONSTER_CHECKLIST_VI.md` |
| Sáu nghề hero | `docs/ASHLAR_HERO_CONCEPT_VI.md`, `art/heroes/_brief/README_VI.md` |
| Sheet quái Map 1 rev 2, bảng màu 30 quái | `art/act-01/_batches/map01/REVISION_2_VI.md`, `art/act-01/_batches/map01/_brief/` |
| Terrain stylized | `art/textures/terrain-dark-wood/README.md`, `art/textures/terrain-biomes-v2-stylized/` |
| Tripo | `../pipeline/tripo/Agent.md`, `../../.agents/skills/generate-tpose-for-tripo/` |
| Model 3D của ASHLAR (GLB, danh mục) | `3d/README.md` |
| Nguồn canon | World Bible, Bestiary and Cast, Level Design Guide (ba file trong T3 attachments, không nằm trong repo) |
