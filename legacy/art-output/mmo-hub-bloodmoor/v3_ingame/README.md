# V3 — Tiền đồn Đồng hoang

Tạo bằng công cụ image_gen tích hợp (không dùng CLI, không vẽ bằng code). Ảnh nguồn được giữ trong ~/.codex/generated_images và **copy** vào thư mục này. Cả sáu PNG đều 1254 × 1254 pixel (1:1), đã kiểm tra kích thước file sau khi copy.

Ảnh reference bắt buộc: [REFERENCE_ingame.png](REFERENCE_ingame.png), truyền trực tiếp qua referenced_image_paths cho cả sáu lượt tạo đầu và lượt tạo lại đầu tiên của ảnh 01. Các lượt sửa sau dùng ảnh đã sinh làm edit target; ảnh mẫu chỉ hướng dẫn camera, chất render và ánh sáng, không dùng làm nền ghép.

## Tự kiểm tra

Đánh giá trực quan trên từng ảnh; tỷ lệ chiều cao đo ước lượng đầu–chân, không tính vũ khí; tỷ lệ vùng lạnh/ấm là ước lượng thị giác, không phải phép đo phân vùng chính xác. Tất cả ảnh không thấy chữ, UI, con trỏ, logo hay gore tươi. Camera cao nhìn xuống, không có đường chân trời, có nhiều khoảng mặt đất trống. Không cam kết góc camera chính xác từ ảnh phẳng.

| Ảnh | Kết quả | Cao nhân vật / khung | Vùng lạnh–tối ước lượng | Điểm yếu / ghi chú |
|---|---|---|---|---|
| [v3_01_bonfire_plaza.png](v3_01_bonfire_plaza.png) | Chưa đạt hoàn toàn | ~12% | ~80–85% | Bề mặt đã gọn hơn sau 2 lần tạo lại; nhân vật vẫn nhỏ hơn mục tiêu 1/6. Còn phản chiếu ấm phụ ở lều trái và vài vệt sáng bùn. |
| [v3_02_market_ring.png](v3_02_market_ring.png) | Đạt, có điểm yếu | ~16% | ~80–85% | Đúng 4 lều, 1 xe, 3 đèn; lối bùn rộng. Bùn vẫn hơi nhiều gợn nhỏ, mưa phùn khá nhẹ. |
| [v3_03_forge_and_vault.png](v3_03_forge_and_vault.png) | Đạt, có điểm yếu | ~17% | ~80% | Cửa sắt đặc đóng, 2 lính canh, lò rèn và đe rõ. Mặt bùn còn gợn, tia lửa nhỏ; một số dụng cụ lò rèn vẫn tương đối chi tiết. |
| [v3_04_gate_palisade.png](v3_04_gate_palisade.png) | Đạt, có điểm yếu | ~15% | ~80% | Đúng 2 đuốc, 2 lính, 3 quái ngoài cổng. Người chơi hơi thấp hơn tâm khung; mặt bùn vẫn có một số đốm phản quang. |
| [v3_05_healer_graveyard.png](v3_05_healer_graveyard.png) | Đạt, có điểm yếu | ~15% | ~90% | Có xác phủ vải, 2 nến, nghĩa địa, waypoint lam. Mặt đá và cỏ còn chi tiết nhẹ; mưa phùn khó thấy. |
| [v3_06_siege_night.png](v3_06_siege_night.png) | Đạt, có điểm yếu | ~14–15% | ~85–90% | Đúng 3 người chơi, 6 quái, 2 đuốc, sét lam và lửa nhỏ. Nhân vật hơi nhỏ so với 1/6; cỏ còn thấy lá ở tiền cảnh. |

Ánh sáng ấm chủ yếu khu trú và dưới khoảng 20% mỗi khung. Texture, props đã giảm qua lượt sửa nhưng một số vùng bùn vẫn có micro-detail. Ảnh 01 chưa đạt tỷ lệ nhân vật dù đã dùng đủ 2 lần tạo lại, giữ bản cuối và báo rõ. Các ảnh còn lại đã qua 1 lần tạo lại; các sai lệch nhẹ còn lại được ghi ở bảng. Cảnh 06 dùng sét lam theo yêu cầu riêng của cảnh, ngoại lệ đối với quy tắc “điểm lam duy nhất là waypoint”.

## Prompt nguyên văn đã dùng

### Prompt chung cho các lượt tạo ban đầu

Mỗi prompt tạo ảnh = **prompt chung** + **SCENE tương ứng** + **phần bổ sung** được nêu dưới đây, ghép đúng thứ tự. transparent_background=false trong mọi lượt.

```text
Use case: stylized-concept. Asset: one square 1:1 original 3D ARPG gameplay screenshot, no interface.
Image 1 is REFERENCE ONLY for fixed high-angle camera, grounded real-time game rendering, low-key darkness and lighting. Do not copy its characters, monsters, clothing or assets. New original besieged wilderness outpost that is actively resisting, at night in slight drizzle.
TOP PRIORITY: pull camera BACK, fixed 55-degree downward view, no horizon. Main full-body player near frame center occupies about ONE SIXTH (16-17 percent) of image HEIGHT, never one quarter or one third. Broad open ground separates the major objects.
At least 75-80 percent of image is cold DARK green-gray shade, dark green grass, dark brown mud, cold gray stone, dark stake wood, faded gray-brown canvas. Warm orange #D9822B only in tight pools close to flames, rapid falloff, warm area under 20 percent. Dark edge vignette. Maximum one major light and 2-3 small lights; no scattered lanterns. No general orange grade, no bright cyan ambient.
Medium-LOD game assets, SIMPLE broad readable surfaces, restrained smooth color blocks, simplified clumped grass patches, less ground detail than reference. No individual fine grass blades, wood grain, fabric fibers, pebbles, ornate armor, speckled highlights, noisy textures or prop clutter. Wet mud has a few broad soft reflections. Characters have 2-3 large muted color blocks, varied original heavy warrior, mage, archer and summoner classes. Clear gameplay silhouettes and consistent grounded scale, not toy miniatures.
Looks like actual modest-detail 3D gameplay, not photorealistic, not cinematic concept art, not a painting. Mild horror only, patched defenses, covered bodies where specified, no fresh gore. No text, UI, HUD, health bars, cursor, logos, watermark or recognizable Blizzard designs.
SCENE: 
```

### Phần bổ sung giảm texture

```text
 CRITICAL TEXTURE OVERRIDE: Render deliberately simplified medium-LOD realtime game graphics, broad almost flat albedo patches. Ground must be smooth dark mud and large soft grass clumps, with NO gravel, NO tiny stones, NO hundreds of wet glints. All tents and wooden structures are plain large surfaces with no fine damage texture. Sparse major props ONLY. Camera player screen height target 16 percent. Restrained soft ambient visibility, not crushed black. Do not turn this into a high-detail realistic environment render.
```

### 1. v3_01_bonfire_plaza.png

SCENE:

```text
Bonfire plaza: one main armored player stands close to a large camp bonfire near center, SIX other adventurer players loosely around the fire (seven people total), varied muted original class silhouettes. The bonfire is the ONLY major light, its orange pool occupies at most 15-20 percent of frame. Most of the spacious muddy plaza and grass is dark and cool. A few major camp silhouettes at distant edges, minimal props. No additional lights.
```

Lượt 1: prompt chung + SCENE, chưa có phần bổ sung giảm texture. Không chọn vì mặt đất nhiều sỏi/đốm sáng.

Tạo lại lần 1: prompt chung + SCENE + phần bổ sung giảm texture. Không chọn làm bản cuối vì nhân vật nhỏ và texture còn dày.

Tạo lại lần 2 (edit target: ảnh của lượt trước, không có chỉnh sửa procedural):

```text
Edit this generated ARPG gameplay scene, retaining its square crop, camera angle, dark cold green-gray night palette, vignette, main scene content and arrangement. MAIN REQUIRED CHANGE: reduce environment texture complexity dramatically, about 70 percent. Replace gravelly speckled ground with broad smooth dark mud patches; replace individually resolved grass blades and little plants with large simple smooth grass clumps. Replace hundreds of wet highlights with 2-3 broad soft muted reflection patches. Plain medium-LOD game surfaces, little wood grain, no tiny fabric damage or armor engravings. Remove half the small boxes/barrels/tools, retain large storytelling objects. This must read as a clean playable 3D game screenshot, not a detailed photorealistic diorama. Do not blur the image; simplify the asset surfaces. Keep 80 percent cool dark and at most 20 percent warm local lighting. No text, UI or cursor.
SECOND REQUIRED CHANGE: main player projected head-to-feet height about 16.7 percent of frame, visibly about one sixth. Full body near center. Keep exactly seven adventurers around ONE bonfire. Remove any extra offscreen warm lamp lighting on tents. Main player is front-center armored warrior. Keep all characters proportional after enlarging them slightly.
```

Nguồn bản chọn: `C:\Users\HLC_2021\.codex\generated_images\01a1490f-deb5-7401-8956-045ed64418fd\exec-49b5f2c6-8938-4626-8b58-d1b435a5c749.png`.

### 2. v3_02_market_ring.png

SCENE:

```text
Market ring: one full-body archer player walking near center along a BROAD empty muddy central lane. FOUR faded gray-brown canvas market tents around the sides form a loose ring and ONE cargo wagon. Exactly THREE small lanterns total with tiny localized warm pools, no major light. Sparse wares, no piles of small props. Fine light drizzle visible sparingly against dark ground. Most of lane is cold dark mud with large soft muted reflection patches.
```

Lượt 1: prompt chung + SCENE + phần bổ sung giảm texture + đoạn sau:

```text
 Main centered player must measure 170 pixels tall in a 1024-pixel-tall image, about 1/6 canvas. Simplified game ground with broad smooth patches.
```

Tạo lại lần 1 (edit target: ảnh của lượt trước, không có chỉnh sửa procedural):

```text
Edit this generated ARPG gameplay scene, retaining its square crop, camera angle, dark cold green-gray night palette, vignette, main scene content and arrangement. MAIN REQUIRED CHANGE: reduce environment texture complexity dramatically, about 70 percent. Replace gravelly speckled ground with broad smooth dark mud patches; replace individually resolved grass blades and little plants with large simple smooth grass clumps. Replace hundreds of wet highlights with 2-3 broad soft muted reflection patches. Plain medium-LOD game surfaces, little wood grain, no tiny fabric damage or armor engravings. Remove half the small boxes/barrels/tools, retain large storytelling objects. This must read as a clean playable 3D game screenshot, not a detailed photorealistic diorama. Do not blur the image; simplify the asset surfaces. Keep 80 percent cool dark and at most 20 percent warm local lighting. No text, UI or cursor.
SECOND REQUIRED CHANGE: main player projected head-to-feet height about 16.7 percent of frame, visibly about one sixth. Full body near center. Fix lantern count: ONLY THREE lit lanterns in entire scene: one at upper left tent, one beside upper right wagon, one lower right tent. REMOVE the table lantern at upper left and REMOVE the lower left tent lantern and their warm light. FOUR tents and ONE wagon stay. Enlarge centered archer BODY by 30 percent keeping center so head-to-foot height is 1/6 canvas. No extra lanterns or hidden light pools.
```

Nguồn bản chọn: `C:\Users\HLC_2021\.codex\generated_images\01a1490f-deb5-7401-8956-045ed64418fd\exec-28288419-9e67-4b83-af5d-83c75ee917bb.png`.

### 3. v3_03_forge_and_vault.png

SCENE:

```text
Outdoor forge and vault: one main full-body heavy warrior player near center in a broad muddy clearing. An outdoor forge on one side is the only major warm light, with one clearly readable anvil and a blacksmith striking a few sparse sparks. Next to it a low cold gray stone storage bunker with a clearly CLOSED SOLID IRON DOOR, an opaque metal slab, not bars or a portcullis. Exactly TWO guards flank the solid door. Only major functional objects, ample cold empty ground.
```

Lượt 1: prompt chung + SCENE + phần bổ sung giảm texture + đoạn sau:

```text
 Main player screen-space body height exactly about 1/6 image. Ground is large smooth matte patches, strongly suppress small wet highlights.
```

Tạo lại lần 1 (edit target: ảnh của lượt trước, không có chỉnh sửa procedural):

```text
Edit this generated ARPG gameplay scene, retaining its square crop, camera angle, dark cold green-gray night palette, vignette, main scene content and arrangement. MAIN REQUIRED CHANGE: reduce environment texture complexity dramatically, about 70 percent. Replace gravelly speckled ground with broad smooth dark mud patches; replace individually resolved grass blades and little plants with large simple smooth grass clumps. Replace hundreds of wet highlights with 2-3 broad soft muted reflection patches. Plain medium-LOD game surfaces, little wood grain, no tiny fabric damage or armor engravings. Remove half the small boxes/barrels/tools, retain large storytelling objects. This must read as a clean playable 3D game screenshot, not a detailed photorealistic diorama. Do not blur the image; simplify the asset surfaces. Keep 80 percent cool dark and at most 20 percent warm local lighting. No text, UI or cursor.
SECOND REQUIRED CHANGE: main player projected head-to-feet height about 16.7 percent of frame, visibly about one sixth. Full body near center. Keep the outdoor forge, blacksmith, anvil and a few sparks, CLOSED SOLID iron door and TWO guards. Enlarge centered heavy warrior BODY by 25 percent. Remove outer foreground tents and extra crates, leave a broad open muddy clearing. Forge single major warm light with two SMALL dim torches. Strongly simplify the grass and remove granular wet ground bump.
```

Nguồn bản chọn: `C:\Users\HLC_2021\.codex\generated_images\01a1490f-deb5-7401-8956-045ed64418fd\exec-2d7bd74a-08c8-4550-abbe-94c32fe5d379.png`.

### 4. v3_04_gate_palisade.png

SCENE:

```text
Main gate and palisade viewed from INSIDE camp. Main full-body player close to center on inner approach. LOWER HALF is inside the defended camp, with exactly TWO small burning torches and two watchful guards. Patched tall wooden stake fence crosses the middle and has a wide OPEN main gate. UPPER HALF beyond gate is dark grassy wilderness with exactly THREE small hunched dark-red original creatures wandering apart. Clear inside/outside geography; alert defenders, not a ruined camp. No other light sources.
```

Lượt 1: prompt chung + SCENE + phần bổ sung giảm texture.

Tạo lại lần 1 (edit target: ảnh của lượt trước, không có chỉnh sửa procedural):

```text
Edit this generated ARPG gameplay scene, retaining its square crop, camera angle, dark cold green-gray night palette, vignette, main scene content and arrangement. MAIN REQUIRED CHANGE: reduce environment texture complexity dramatically, about 70 percent. Replace gravelly speckled ground with broad smooth dark mud patches; replace individually resolved grass blades and little plants with large simple smooth grass clumps. Replace hundreds of wet highlights with 2-3 broad soft muted reflection patches. Plain medium-LOD game surfaces, little wood grain, no tiny fabric damage or armor engravings. Remove half the small boxes/barrels/tools, retain large storytelling objects. This must read as a clean playable 3D game screenshot, not a detailed photorealistic diorama. Do not blur the image; simplify the asset surfaces. Keep 80 percent cool dark and at most 20 percent warm local lighting. No text, UI or cursor.
SECOND REQUIRED CHANGE: main player projected head-to-feet height about 16.7 percent of frame, visibly about one sixth. Full body near center. Keep lower half inside, upper half outside, wide open gate, TWO small torches and TWO guards. Keep THREE dark-red hunched creatures beyond gate; make them original long-armed squat creatures without horns, shields or weapons. Enlarge main centered player's BODY by 25 percent. REMOVE foreground boxes, barrels and side tents; keep simple palisade and broad muddy path. Strongly simplify wet ground bump and grass.
```

Nguồn bản chọn: `C:\Users\HLC_2021\.codex\generated_images\01a1490f-deb5-7401-8956-045ed64418fd\exec-195b338b-e140-411e-a1a7-fd70bd2c4eda.png`.

### 5. v3_05_healer_graveyard.png

SCENE:

```text
Healer and graveyard: a healer's faded gray-brown canvas tent, one body fully covered with plain cloth on a cot, exactly TWO small candles. A small graveyard of a few simple irregular unlettered stones lies against the patched palisade. One main full-body muted summoner player near center stands immediately beside an ancient stone waypoint. Waypoint gives a restrained localized BLUE glow, the ONLY blue accent; it is the single major light but dim, not a neon portal. Ample cold dark grass and mud between tent, graves, and waypoint.
```

Lượt 1: prompt chung + SCENE + phần bổ sung giảm texture.

Tạo lại lần 1 (edit target: ảnh của lượt trước, không có chỉnh sửa procedural):

```text
Edit this generated ARPG gameplay scene, retaining its square crop, camera angle, dark cold green-gray night palette, vignette, main scene content and arrangement. MAIN REQUIRED CHANGE: reduce environment texture complexity dramatically, about 70 percent. Replace gravelly speckled ground with broad smooth dark mud patches; replace individually resolved grass blades and little plants with large simple smooth grass clumps. Replace hundreds of wet highlights with 2-3 broad soft muted reflection patches. Plain medium-LOD game surfaces, little wood grain, no tiny fabric damage or armor engravings. Remove half the small boxes/barrels/tools, retain large storytelling objects. This must read as a clean playable 3D game screenshot, not a detailed photorealistic diorama. Do not blur the image; simplify the asset surfaces. Keep 80 percent cool dark and at most 20 percent warm local lighting. No text, UI or cursor.
SECOND REQUIRED CHANGE: main player projected head-to-feet height about 16.7 percent of frame, visibly about one sixth. Full body near center. Keep healer tent, ONE fully cloth-covered body on cot, TWO candles only, small unlettered graveyard by fence, ancient stone waypoint emitting the only blue accent, player immediately beside it. Enlarge the central summoner BODY by 35 percent to one-sixth image height, preserve grounded proportions. Waypoint light subdued and localized. Remove extra top-right torch AND its orange light completely, so only two candles plus waypoint remain. Remove foreground bushes and small boxes, use smooth grass clumps.
```

Nguồn bản chọn: `C:\Users\HLC_2021\.codex\generated_images\01a1490f-deb5-7401-8956-045ed64418fd\exec-369aba99-9083-4ba6-ab17-a7ad4dd9c1cc.png`.

### 6. v3_06_siege_night.png

SCENE:

```text
Siege night: exactly THREE original adventurer players battle exactly SIX hunched dark-red original monsters on grassy ground directly outside the palisade. Main full-body mage player near center at one-sixth image height; two other players a heavy warrior and an archer spaced apart. One short branching BLUE LIGHTNING spell hits ground and a nearby foe, with one small compact fire spell; their localized lighting illuminates grass like reference, no huge blast. This scene specifically permits blue lightning as an exception to waypoint-only blue. Palisade and exactly TWO small torches along TOP EDGE. Battle remains readable with lots of dark grass between figures. At least 75 percent cold dark area, warm under 20 percent, no blood spray. Original monsters unlike reference, different silhouettes and equipment.
```

Lượt 1: prompt chung + SCENE + phần bổ sung giảm texture.

Tạo lại lần 1 (edit target: ảnh của lượt trước, không có chỉnh sửa procedural):

```text
Edit this generated ARPG gameplay scene, retaining its square crop, camera angle, dark cold green-gray night palette, vignette, main scene content and arrangement. MAIN REQUIRED CHANGE: reduce environment texture complexity dramatically, about 70 percent. Replace gravelly speckled ground with broad smooth dark mud patches; replace individually resolved grass blades and little plants with large simple smooth grass clumps. Replace hundreds of wet highlights with 2-3 broad soft muted reflection patches. Plain medium-LOD game surfaces, little wood grain, no tiny fabric damage or armor engravings. Remove half the small boxes/barrels/tools, retain large storytelling objects. This must read as a clean playable 3D game screenshot, not a detailed photorealistic diorama. Do not blur the image; simplify the asset surfaces. Keep 80 percent cool dark and at most 20 percent warm local lighting. No text, UI or cursor.
SECOND REQUIRED CHANGE: main player projected head-to-feet height about 16.7 percent of frame, visibly about one sixth. Full body near center. Keep THREE adventurers and SIX monsters in combat; central mage 1/6 image height, enlarge BODY about 20 percent. Keep short blue lightning and tiny fire attack illuminating grass locally. Palisade with exactly TWO small torches at top edge. CHANGE ALL SIX MONSTER DESIGNS to original squat hunched dark-maroon beasts with long forearms, rounded armored backs, blunt faces, NO horns, NO shields, NO weapons, NO loincloths, no resemblance to reference demons. Remove wagon, boxes, barrels and scattered debris. Broad grass patches should be very simple. Cold dark green-gray ground at least 75 percent, warm light under 20 percent.
```

Nguồn bản chọn: `C:\Users\HLC_2021\.codex\generated_images\01a1490f-deb5-7401-8956-045ed64418fd\exec-ecf57559-c96d-4a50-ac39-deab08281604.png`.

