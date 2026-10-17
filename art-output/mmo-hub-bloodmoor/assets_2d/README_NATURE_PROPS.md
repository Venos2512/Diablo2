# Nature props — Blood Moor, sheet 08–12

Bộ concept prop bán thực, palette lạnh khử bão hòa, nền xám đậm, ánh sáng studio trên-trái. Mỗi asset là một ảnh landscape ba hàng. Tất cả file hiện có kích thước gốc **1672 × 941 px**, gần 16:9 (sai lệch làm tròn khoảng 0,05%); không resize/crop hậu kỳ.

08–10 là bản đã được người dùng duyệt, giữ nguyên, không tạo lại. 11–12 được tạo bằng công cụ **image_gen tích hợp**, truyền ảnh mẫu trực tiếp qua `referenced_image_paths`, và copy ngay sau khi kiểm tra. Không commit.

## Cách đọc

Thứ tự ô: trái → phải, hàng trên → hàng giữa → hàng dưới. Silhouette người xám 1,8 m ở trái hàng đầu không tính là ô. “Góc game” nhắm camera 3/4 nhìn xuống 50–60°. Các góc và kích thước là chỉ dẫn concept, không phải bản vẽ đo kỹ thuật hay turnaround 3D khóa hình học.

| File | Số ô theo hàng | Trạng thái |
| --- | --- | --- |
| [asset_08_rock_sheet.png](asset_08_rock_sheet.png) | 4–5–3 = 12 | Đã duyệt từ trước, giữ nguyên |
| [asset_09_mossy_rock_sheet.png](asset_09_mossy_rock_sheet.png) | 4–3–3 = 10 | Đã duyệt từ trước, giữ nguyên |
| [asset_10_buried_corpse_sheet.png](asset_10_buried_corpse_sheet.png) | 4–3–3 = 10 | Đã duyệt từ trước, giữ nguyên |
| [asset_11_dead_tree_sheet.png](asset_11_dead_tree_sheet.png) | 4–5–4 = 13 | Đạt bố cục/nội dung; đã kiểm tra và lưu |
| [asset_12_burned_tree_sheet.png](asset_12_burned_tree_sheet.png) | 4–3–3 = 10 | Đạt bố cục/nội dung; đã kiểm tra và lưu |

## Prompt chung gốc của 08–10

Khôi phục từ các lệnh tạo ảnh trong phiên `01a14a42-94ea-7823-b37b-3af737a5dfa2`. Prompt đầy đủ của mỗi sheet = đoạn chung dưới đây + một ký tự xuống dòng + đoạn riêng của sheet. Ký tự “�” được giữ nguyên theo bản lưu lệnh gốc.

Thứ tự ảnh reference: `asset_01_cart_turnaround.png`; `asset_05_palisade_wall_sheet.png`; `_refs/ref_v3_bonfire.png`; `asset_07_ground_texture_sheet_v2.png`; `_refs/ref_ingame.png`.

```text
Use case: stylized-concept. Create ONE original production game-prop reference sheet, landscape EXACT 16:9, preferably 1536x864 or higher exact 16:9. All requested views and variants together in this one image. Input images are REFERENCES ONLY, never edit targets: image 1 cart = sheet layout, neutral studio light, gray human scale; image 2 palisade = multiple well-spaced rows; image 3 bonfire scene = restrained semi-real materials, broad low-detail masses and cold desaturated palette (do not reproduce scene or fire); image 4 = olive narrow-bladed moor grass and mud; image 5 = game camera, elevated three-quarter looking down 50�60 degrees. Original designs, no existing franchise assets.
BACKGROUND: uniform solid dark gray #3A3A3A, no environment, no horizon or panels. Each object has its own small flattened oval mud footing, only enough for ground contact/burial. Three clearly separated evenly spaced horizontal rows, no overlaps or cropping, no grid lines. Place ONE flat gray 1.8m human silhouette at far left of TOP ROW as a scale guide, distinct from the asset cells. Maintain a single world scale across all cells and rows, including tiny variants; do not enlarge small objects to fill cells. Four views in top row are of EXACTLY THE SAME object: front elevation, side elevation, game view 50�60deg downward, true directly-overhead view, left to right. All remaining cells use game view.
LIGHT: soft cool-neutral studio light from upper left, soft contact shadows lower right; no rim lighting, bloom, god rays or dramatic lighting.
LOW DETAIL: broad angular facets, large readable cracks, soft transitions, silhouette and 2�3 tonal masses. Semi-real weathered materials like references, no tiny surface noise, no microscopic grain, no tiny woodgrain, grass in simplified narrow-blade clumps rather than individual finely rendered blades. Not cartoon, not glossy clean hand-painted stylization.
PALETTE: very desaturated. Rock shadows #1B1F1C, midtone #3E4638, highlights #6F6F5C, some brown #5A5040. Moss #505A3F/#454F3C. Grass dark olive with withered yellow-gray streaks, never fresh bright green. Dead wood silver gray-brown #454A40 to #696B59; charcoal blue-gray #303942, ash #70777B. Dirty bone #8A8370 to #A49C86, never clean white. No orange except small embers in the recently burned-tree state when explicitly requested. NO text, labels, numbers, logos, watermark or caption anywhere.
```

## 08 — Đá đồng hoang

- Hàng trên: tảng chuẩn chính diện; cạnh bên; góc game; nhìn từ trên xuống.
- Hàng giữa: cụm đá vụn sát đất; đá thấp ~0,5 m; tảng vừa ~1 m; tảng cao dựng đứng ~3 m; mép vách đá thấp dài.
- Hàng dưới: cụm ba tảng tựa nhau; đá phẳng nằm lộ trên cỏ; đá dựng nghiêng bị đất lấp một nửa.

Prompt riêng đã dùng:

```text
ASSET 08: angular moor boulders, worn shoulders, large fractures, bottom buried in mud. EXACTLY 12 asset cells plus the human silhouette, arranged 4 / 5 / 3 in three rows.
TOP ROW 4 cells: same standard 1.5�2m boulder in front, side, game, overhead views.
MIDDLE ROW 5 cells left to right: low ground-hugging rubble decal; low 0.5m rock; medium 1m boulder; tall upright 3m boulder; long LOW cliff-edge rock ledge. Tall boulder must read taller than standard top-row object at same world scale, with ample reserved vertical room.
BOTTOM ROW 3 cells: cluster of exactly three boulders leaning together; flat exposed slab lying in sparse moor grass; tilted upright rock half buried in soil.
Bare rock dominates, angular fractured shapes, no smooth rounded river pebbles. No moss coating (reserved for separate sheet).
```

## 09 — Đá rêu và cỏ

- Hàng trên: tảng rêu chuẩn chính diện; cạnh bên; góc game; nhìn từ trên xuống.
- Hàng giữa: ít rêu; rêu vừa ở mặt trên và chân; nhiều rêu với cỏ cao che chân.
- Hàng dưới: đá thấp nửa chìm có cỏ qua khe; cụm đá nhỏ lẫn cỏ; tảng phẳng có vũng nước mưa nông và rêu viền.

Prompt riêng đã dùng:

```text
ASSET 09: mossy moor boulders with angular fractured masses matching the bare-rock family. EXACTLY 10 asset cells plus scale human, in 4 / 3 / 3 rows. Moss grows asymmetrically on upper surfaces and damp shaded footings, NOT uniform coverage; dark olive narrow-bladed grass clumps grow at base and cracks.
TOP ROW 4 cells: SAME standard 1.5m mossy rock, front, side, game, true overhead.
MIDDLE ROW 3 cells at game angle, all same rock size: LIGHT moss with just a few patches; MEDIUM moss covering top and parts of footing; HEAVY moss almost swallowing the rock, taller moor grass masking footing.
BOTTOM ROW 3 cells at game angle: low half-buried rock with narrow grass growing through its big crack; small-rock cluster mixed into a modest small grass patch; flat boulder with a shallow rainwater puddle on its TOP, moss rim around puddle.
Use large simple stone faces and broad soft moss masses, very restrained texture, minimal tiny cracks, NO micro-detail. Grass must read as thin-bladed olive tufts, no round leaves, no lush bright greenery. No fire or orange. Objects isolated on tiny oval mud contact patches, no scenic dioramas.
```

## 10 — Xác quái chìm dưới đất

- Hàng trên: xác quỷ lùn có sừng chuẩn chính diện; cạnh bên; góc game; nhìn từ trên xuống.
- Hàng giữa: vừa ngã, còn da khô và giáo gãy; vùi nửa, lộ xương ám bùn; dấu tích cũ, sọ sừng và xương sườn trong cỏ.
- Hàng dưới: xác thú bốn chân vùi nghiêng; xác quái bò có vỏ chìm úp; cụm xương vụn rải trên bùn.

Prompt riêng của bản đã lưu (bản tạo đầu tiên; không phải các prompt sửa thử sau đó):

```text
ASSET 10: mild-horror buried SMALL fantasy creature remains, environmental props, mostly dirty bones, dried leathery skin and broken armor, no exposed flesh, no organs, no fresh blood. Original small horned imp species, deformed dog/hyena-like quadruped, crawling shelled creature. Creatures measured only 0.6�1.1m alive; ALL remains lie flat or slumped low, maximum protrusion above mud 0.5m. Mud and grass swallow the lower body. IMPORTANT scale: human silhouette is 1.8m, so even raised arm of corpse is under one third its height, and corpse length is around half human height. Do not enlarge corpses for presentation.
EXACTLY 10 asset cells plus human, arranged 4 / 3 / 3 rows with generous negative space. 
TOP ROW four views of SAME standard half-buried horned imp corpse: front, side, 50�60deg elevated game angle, true overhead. Visible low slumped rib cage, SMALL horned skull, ONE bony arm reaching upward but only 0.5m above ground. Not upright skeleton, not human skull, squat tiny demonic proportions. 
MIDDLE ROW 3 game-angle stages of SAME imp species, left to right: recently fallen, still dry leathery skin and broken armor, broken spear lying beside; half buried with exposed muddy bones; old trace only horned skull and a few ribs barely emerging from grass, some moss.
BOTTOM ROW 3 game-angle species/variants: quadruped remains buried on its side with long-muzzled skull and curved spine; face-down buried crawling shelled monster with a few broken carapace plates protruding; FLAT decal of scattered tiny bone fragments over mud.
Dirty ivory #8A8370 to #A49C86, substantially mud-stained, no bright white bone. Little or no dried brown-red blood #4A1A14. Grass simplified narrow olive blades. Broad low-detail forms, no intricate anatomical microdetail. Dark gray neutral sheet background, small isolated flattened oval mud patches only, no scene.
```

Đã đối chiếu SHA-256 của file hiện có với ảnh nguồn `exec-0ef5b6a2-78bc-4932-98a1-4b57ffe32fd1.png`: `CD25F3D08010C5889D0F761262CFE8B10066FA8EAFBD539E7271656E125008F8`. Các prompt sửa thử sau đó không áp dụng cho file này.

## 11 — Cây khô / cây chết

- Hàng trên: cây chuẩn ~4 m chính diện; cạnh bên; góc game; nhìn từ trên xuống.
- Hàng giữa: cây non héo ~1,8 m; cây quặp ~3 m; cây cao xoắn ~5 m; cây nghiêng bật gốc; gốc cây mục thấp.
- Hàng dưới: thân cây đổ nằm ngang; cụm cành khô rơi; rễ bật khỏi đất; bụi gai khô thấp.

Reference theo thứ tự: xe; đá rêu 09; xác quái 10; bonfire; ingame. Tất cả là ảnh mẫu, không phải ảnh bị sửa.

Prompt đầy đủ đã dùng:

```text
Use case: stylized-concept. Create ONE new 16:9 landscape production reference sheet, asset_11_dead_tree_sheet.png. All attached images are REFERENCES, not edit targets. Reference 1 cart: clean spacing, gray background, neutral studio presentation and human silhouette shape. References 2 mossy rocks and 3 buried corpses: APPROVED same-set rendering style, muted materials, ground contact patches and gray human silhouette appearance. Reference 4 bonfire: dark desaturated semi-realistic material language, NOT its dramatic lighting or scene. Reference 5 gameplay: 50–60 degree downward three-quarter game camera.

Subject: dead leafless wilderness trees, slender contorted trunks, sparse hooked major limbs, broken branches, silver gray-brown bark #454A40 to #696B59, exposed gripping roots and muted olive moss at feet. Readable broad forms, 2–3 light-dark masses, restrained low detail, rough semi-realistic materials matching approved sheets. No networks of tiny twigs, no fine bark grain, no polished cartoon style.

EXACT layout: THREE horizontal rows, clearly separated, no overlapping cells or cropped branches. Top row FOUR tree views plus ONE plain gray 1.8 m adult human silhouette at far left. Left to right: identical standard approximately 4 m tree in front view, side view, downward 50–60° three-quarter game view, true overhead view. Standard tree has twisted trunk and hooked horizontally spreading crown; its front and side silhouettes must be about 2.2 TIMES the human's head-to-foot height. SCALE IS CRITICAL: human is small beside tree, not tree-sized. Keep same physical scale across the entire sheet, allowing perspective foreshortening. Fit generous top-row height with all tree tips inside canvas.

Middle row exactly FIVE separate variations, all at downward game angle, left to right: wilted slender sapling 1.8 m; hooked tree 3 m; tallest twisted tree 5 m (visibly taller than standard, 2.8 times the reference person's physical height); leaning uprooted tree with exposed root ball; low rotten stump. Accommodate tall 5 m tree with sufficient row height; do not miniaturize it to the sapling size.
Bottom row exactly FOUR separate props, all at downward game angle, left to right: fallen trunk lying horizontally; flat scattered dry branch cluster decal; exposed uprooted roots; low dead thorn bush with sparse thick thorny branches.

Backdrop flat charcoal gray #3A3A3A matching approved sheets, no scenery. Each prop rests on only a compact flattened oval of dark mud with a few thin olive grass tufts, subtle moss around tree feet. Cool neutral upper-left studio light, soft lower-right contact shadow. Low saturation, no vivid green, no flames, no glow, no rim lighting. No letters, numbers, captions, panel borders, watermark, logos. Original design. Produce exactly one finished sheet.
```

Kiểm tra: đủ 13 ô và silhouette, không chữ/cắt mất vật thể; cây chuẩn chính diện cao xấp xỉ 2,2 lần người. Dáng cây thưa, có rễ và rêu chân, màu bạc xám-nâu. Điểm yếu: vỏ cây và cỏ còn nhiều chi tiết hơn mức tối giản trong brief; cây cao ~5 m ở góc game bị rút ngắn theo phối cảnh; các góc không khóa chính xác cùng một cấu trúc cành.

Nguồn đã copy: `~/.codex/generated_images/01a14a4a-1c45-70c0-bb96-c8aed2c9d383/exec-f83ffd58-e348-4b2c-8503-0a2e9ad29bf6.png`.

## 12 — Cây cháy

- Hàng trên: cây cháy chuẩn ~4 m chính diện; cạnh bên; góc game; nhìn từ trên xuống.
- Hàng giữa: vừa cháy, khe than hồng nhỏ và khói mỏng; than nguội phủ tro; cháy cũ được rêu và cỏ chiếm lại.
- Hàng dưới: gốc cây cháy cụt; thân cháy sụp gãy nằm; mảng tro và than vụn trên đất.

Reference theo thứ tự: xe; đá rêu 09; xác quái 10; ingame; cây khô 11. Công cụ nhận tối đa năm ảnh reference; sheet 11 truyền tiếp ngôn ngữ chất liệu đã tham chiếu bonfire.

Prompt đầy đủ đã dùng:

```text
Use case: stylized-concept. Create ONE new 16:9 landscape production reference sheet: asset_12_burned_tree_sheet.png. All input images are style/composition REFERENCES, not edit targets. References 1 cart = sheet layout, flat gray background, plain gray human silhouette. References 2 mossy rocks and 3 buried corpses = approved same-set semi-realistic muted material rendering, thin olive grass, compact mud patches. Reference 4 gameplay = 50–60 degree downward game camera. Reference 5 dead tree sheet = directly match trunk family, branching language, silhouette scale and rendering; now render these trees burned into charcoal with stubby broken limbs.

EXACTLY three distinct horizontal rows with 4 / 3 / 3 prop cells. No overlaps, clipping, labels, dividers or text.
TOP ROW: a single standard approximately 4 m burned tree shown in FOUR views, left to right front, side, downward 50–60 degree three-quarter game view, true overhead view. Same underlying contorted narrow trunk, few crooked major boughs and cut-off branches, no leaves. Charcoal blue-black gray #303942, LARGE scaly charcoal cracks, restrained pale ash #70777B. These top-row trees are COLD, absolutely no embers. At far left add ONE plain gray 1.8 m adult human silhouette, same shape as approved sheets. CRITICAL tree-to-human scale: front and side 4 m trees stand about 2.2 times human head-to-foot height. Do not enlarge the human to tree height. Human must be fully visible, with breathing room. Keep all props in same physical scale throughout sheet, accounting for perspective.

MIDDLE ROW: exactly THREE states of the same approximately 4 m burned tree at downward game angle, left to right:
1. Recently burned: a FEW TINY dim orange ember fissures #D9822B with minute warm pale cores #E7C890 deep inside the base or trunk, a faint thin wisp of gray smoke, ash at base. Orange area less than 3%, no flames, no broad illumination or bloom.
2. Cold charcoal: ash-gray coating, absolutely no fire, no orange, no smoke.
3. Old burned tree reclaimed by nature: blackened trunk, patchy olive moss #505A3F / #454F3C, dark narrow-blade olive grass growing around roots. No fresh leaves in crown, no fire.
BOTTOM ROW: exactly THREE separate smaller props at downward game angle, left to right: short burned stump; collapsed broken charred trunk lying horizontally; flat patch of ash and scattered charcoal fragments on dark soil, a ground decal. All cold, no embers.

Backdrop flat #3A3A3A charcoal gray, same as approved sheets. Only a small flattened oval of dark soil beneath each tree/prop, soft contact shadows lower-right, cool neutral upper-left studio lighting. Desaturated gray-brown and blue-gray, broad readable 2–3 value masses, restrained detail, rough semi-realistic surfaces matching attached approved sheets, no tiny bark grain or intricate twig webs. No scenery, dramatic night lighting, rim light, glow, bright greens, cartoon rendering, lettering, numbers, watermark, logos. Original design. Preserve clearly readable distinct silhouettes and adequate spacing. Exactly one complete sheet.
```

Kiểm tra: đủ 10 ô và silhouette, không chữ; thân than lam-xám với vảy nứt lớn; phân biệt ba trạng thái. Cam chỉ xuất hiện trong các khe nhỏ của ô vừa cháy, không có vùng sáng lan hoặc lửa lớn; các ô còn lại nguội. Sau một lượt chỉnh silhouette, cây chính diện cao khoảng 2,1–2,2 lần người, sát tỷ lệ mục tiêu. Điểm yếu: chi tiết vảy than và nền chân vẫn khá dày. Góc nhìn và cấu trúc cành giữa các ô là xấp xỉ concept.

Prompt chỉnh cuối (reference duy nhất: bản sheet 12 vừa tạo ở trên):

```text
Edit this existing burned-tree sheet with ONE LOCAL CHANGE ONLY: make the flat gray human silhouette at far left 10 percent shorter and proportionally narrower, keeping its feet at exactly the same ground baseline. Its head should move downward as it scales about its feet. This corrects the standard front tree / human height ratio from about 2.0 to about 2.2 (4 m tree versus 1.8 m person). Preserve EVERYTHING ELSE: exact canvas dimensions and framing, all 10 prop cells in 4/3/3 rows, all trees, branch shapes, materials, colors, gray background, patches, shadows, smoke and the small orange embers only in middle-left cell. No added text. Do not change or move any tree or other prop. Keep the original semi-realistic rendering and plain gray silhouette shape.
```

Nguồn cuối đã copy: `~/.codex/generated_images/01a14a4a-1c45-70c0-bb96-c8aed2c9d383/exec-e2b05bb4-7285-40c9-91ef-fccb4ba1b488.png`.

