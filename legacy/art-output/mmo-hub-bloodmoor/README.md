# Bộ concept trại trung tâm MMO

Tạo bằng công cụ image_gen tích hợp, ngày 2026-10-17. Thiết kế gốc theo BRIEF.md. Ảnh PNG được copy từ thư mục Codex, giữ nguyên ảnh nguồn, không vẽ hoặc chỉnh ảnh bằng code. Không commit.

## Prompt chính xác

Mỗi prompt gửi đến công cụ gồm nguyên văn phần chung dưới đây, tiếp theo một ký tự xuống dòng, chuỗi `Scene: ` và nguyên văn phần cảnh tương ứng. `transparent_background: false`; không dùng ảnh tham chiếu.

### Phần chung

```text
Use case: stylized-concept. Asset type: original dark fantasy MMO environment concept art. Create one landscape image, exact 16:9 aspect ratio, ideally 1536x864 or 2048x1152. Painterly cinematic matte painting, grounded medieval European realism, heavy weathered materials: soaked timber, mud, rusty iron, faded coarse canvas. An embattled but functioning refuge for several hundred survivors on a desolate moor, actively holding out, not defeated. Cold diffuse overcast grey-green light, drizzle and mist, no sun, no hard shadows. Palette: #6F6F5C #8A9088 grey-green, #3E4638 #4C5440 mud and dead grass, #4A3A2A wet timber, #5C5246 canvas. Roughly 80% cold muted surface, 15% localized warm fire pools, <=5% accents. Fire #D9822B with #E8A050 halos is the brightest focal light; warm lights must visibly originate from bonfires, forge, lanterns or tent openings, never evenly spaced streetlights. Blue only allowed on an ancient stone waypoint, never blue sky or blue ambient light. Horror level 1-2: patched defenses, arrows in wood, scorch marks, tiny traces of dried blood, fully shrouded bodies only; no fresh gore, no exposed corpses among crowds. Entirely original designs, no existing franchise names, logos, characters or assets. No readable text, letters, numerals, symbols resembling typography, captions, UI, watermark or signature. No cartoon, neon, saturated heroic fantasy, sunny weather or blue sky.
```

## Kiểm tra trực quan từng ảnh

Đã mở và quan sát đủ sáu PNG. Các đánh giá màu/độ sáng dưới đây là quan sát thị giác, không phải đo diện tích màu hoặc lux. Không thấy chữ hay watermark hiển thị; hoa văn/trang trí không được xem là chữ. Không thấy gore tươi hoặc asset/logo nhận diện của thương hiệu khác.

| Ảnh | Lục-xám, ẩm/âm u | Lửa sáng nhất | Rào + đồng hoang | Không trời xanh/neon | Không chữ | Kết quả |
|---|---|---|---|---|---|---|
| [01_establishing_iso.png](01_establishing_iso.png) | Đạt | Đạt | Đạt | Đạt | Đạt | Đạt |
| [02_bonfire_plaza.png](02_bonfire_plaza.png) | Đạt | Đạt | Đạt | Đạt | Đạt | Đạt |
| [03_market_ring_drizzle.png](03_market_ring_drizzle.png) | Đạt | Đạt | Đạt | Đạt | Đạt | Đạt |
| [04_palisade_edge_dusk.png](04_palisade_edge_dusk.png) | Đạt | Đạt | Đạt | Đạt | Đạt | Đạt |
| [05_siege_night_event.png](05_siege_night_event.png) | Đạt | Đạt | Đạt | Đạt | Đạt | Đạt |
| [06_service_landmarks_sheet.png](06_service_landmarks_sheet.png) | Đạt chất liệu; nền tối theo sheet | Đạt | Không áp dụng (sheet) | Đạt | Đạt | Đạt theo phạm vi sheet |

### Điểm yếu và giới hạn

- **01_establishing_iso.png** — Đạt. Vòng trại, lửa trung tâm và đồng hoang đọc rõ. Điểm yếu: nhiều đèn phụ làm vùng ấm phân tán; chi tiết lều thầy thuốc và giấy truy nã nhỏ, khó xác nhận; nhà nguyện thiên về đá hơn gỗ.
- **02_bonfire_plaza.png** — Đạt. Lửa trung tâm sáng nhất, đông người, bùn phản chiếu, rào và đồng hoang rõ. Điểm yếu: góc máy thấp và có phối cảnh hơn isometric ARPG; chiến binh/pháp sư/cung thủ chưa tách lớp thật rõ; nhà nguyện bằng đá.
- **03_market_ring_drizzle.png** — Đạt. Mưa và bùn rõ, lửa ở lò than và cuối phố, rào và đồng hoang hiện diện. Điểm yếu: đèn lồng hơi nhiều; quan hệ không gian trong/ngoài rào chưa hoàn toàn rõ, đường chợ ít thể hiện độ cong.
- **04_palisade_edge_dusk.png** — Đạt. Rào vá, người sửa rào, lính trên tháp, mộ và quái trong sương đều đọc được. Điểm yếu: bóng quái khá rõ, giảm cảm giác xa xăm; lửa tiền cảnh hơi lớn so với một chốt gác nhỏ.
- **05_siege_night_event.png** — Đạt. Quái bên ngoài, người thủ rào, tên lửa và lửa an toàn bên trong; cổng còn vững. Điểm yếu: nền trời vẫn khá sáng cho đêm sâu; ánh ấm trải rộng hơn mục tiêu khoảng 15%; nhiều bóng quái tương tự nhau.
- **06_service_landmarks_sheet.png** — Đạt các tiêu chí áp dụng cho sheet: bốn công trình rõ, chất liệu ẩm cũ, lò rèn sáng nhất, lam chỉ ở waypoint, không chữ/neon. Rào và toàn cảnh đồng hoang: không áp dụng do yêu cầu nền trung tính tối. Điểm yếu: đầu ống khói bị chạm/cắt mép trên; tỷ lệ bốn vignette chưa hoàn toàn đồng nhất.

**Tỷ lệ/kích thước:** cả sáu ảnh nguồn là 1672 × 941 px, tỷ lệ 1.77683:1, xấp xỉ 16:9 (1.77778:1), lệch khoảng 0.053%. Yêu cầu 16:9 tuyệt đối theo pixel chưa đạt. Prompt đã yêu cầu exact 16:9 nhưng công cụ trả kích thước này. Giữ nguyên PNG nguồn, không crop/resize/vẽ bằng code.

**Số lần tạo:** mỗi cảnh một lần, không tạo lại vì không có lỗi rõ ở năm tiêu chí checklist áp dụng. Không có biến thể bị loại.

## Nguồn copy

- `01_establishing_iso.png` ← `C:\Users\HLC_2021\.codex\generated_images\01a148ed-d2ff-70c1-80a9-2fa4443637a9\exec-069b209b-09dd-4bf2-8cdd-4d45ed10365f.png`
- `02_bonfire_plaza.png` ← `C:\Users\HLC_2021\.codex\generated_images\01a148ed-d2ff-70c1-80a9-2fa4443637a9\exec-daa50f85-3256-4eb2-8077-99add8ff0674.png`
- `03_market_ring_drizzle.png` ← `C:\Users\HLC_2021\.codex\generated_images\01a148ed-d2ff-70c1-80a9-2fa4443637a9\exec-f50e0ac0-f4c0-4e26-b86b-f91e784fee03.png`
- `04_palisade_edge_dusk.png` ← `C:\Users\HLC_2021\.codex\generated_images\01a148ed-d2ff-70c1-80a9-2fa4443637a9\exec-2f897e5f-cf89-4722-8dc0-a35b020a2ee4.png`
- `05_siege_night_event.png` ← `C:\Users\HLC_2021\.codex\generated_images\01a148ed-d2ff-70c1-80a9-2fa4443637a9\exec-4dc9d8ad-221e-4a61-aa6b-c837fb5e92fa.png`
- `06_service_landmarks_sheet.png` ← `C:\Users\HLC_2021\.codex\generated_images\01a148ed-d2ff-70c1-80a9-2fa4443637a9\exec-55bd1a7f-7d24-456e-8d09-a86b2040209e.png`

### 01_establishing_iso.png

```text
Scene: High three-quarter isometric ARPG camera, wide establishing view of the ENTIRE large camp and surrounding empty foggy moor. Very legible concentric layout: patched sharpened timber palisade perimeter with watchtowers and main gate; outer service band with horse pens, supply wagons and training yard; inner market ring of canvas tents and merchant carts; an open central plaza with ONE dominant large bonfire, brightest in the image. Around plaza include an open-air forge as secondary fire source, healer tent with a fully cloth-covered body nearby, robust low stone storage bunker with iron door, long timber guild barracks, small wooden chapel and notice post with blank scraps of paper. Small graveyard beside perimeter. Many tiny survivors make this read as a few-hundred-person MMO hub. Clearly reveal empty wet dead-grass moor around the entire enclosure, mossy rocks, bare trees, shrouded fallen soldiers and tiny distant hunched monster silhouettes. Readable planning and organic concentric paths, practical rough-built settlement, no grand castle.
```

### 02_bonfire_plaza.png

```text
Scene: Closer high three-quarter isometric view of central bonfire plaza, densely populated with dozens of distinct MMO adventurers: warriors, robed mages and archers wearing varied but dull practical armor and cloaks, gathering, trading and resting in small social groups. ONE big central bonfire is unmistakably the brightest focal point; wet churned mud and puddles reflect its orange light. Frame with merchant tents, a secondary dimmer open-air forge, healer tent and low stone bunker; wooden guild barracks and small chapel farther back. Keep an unobstructed view to the perimeter palisade and watchtower in the upper background and beyond it a broad foggy desolate moor with bare trees. No glowing magic on characters or weapons. Warmth stays local around fire, crowd edges recede into grey-green drizzle.
```

### 03_market_ring_drizzle.png

```text
Scene: Eye-level or slightly elevated view along the curved market ring in drizzle. Weathered coarse-canvas awnings, low tents, merchant wagons, piles of sacks and covered trade goods. People huddle beneath sagging wet canopies. A few irregular hanging lanterns with visible small amber flames, and a visible small brazier or campfire in the foreground that is the brightest local light; central plaza bonfire glimpsed at the far end of the curved lane. All warm pools strictly localized. Deep muddy cart ruts and puddles. Compose a deliberate open gap between stalls revealing a substantial section of patched timber palisade, a guarded tower, and open dead-grass moor vanishing into grey-green mist beyond. Cold humid spacious atmosphere, working survivors, never a cozy festive market.
```

### 04_palisade_edge_dusk.png

```text
Scene: View from INSIDE the camp toward its edge at grey-green dusk. Strong foreground small sheltered watch fire with visible flames, the brightest focal light, illuminating muddy footprints and a few simple rough wooden grave markers of a tiny cemetery beside the wall. Patched sharpened palisade with fresh timber braces, arrows embedded in old wet wood and scorch marks. Two alert sentries on a crude timber watchtower; one repairing guard below. Use a low stretch of palisade and an elevated viewpoint to clearly see a broad empty misty moor beyond: dead grass, mossy rocks, bare trees and several SMALL distant hunched monster silhouettes scattered in fog. No large monster in foreground. Defensive preparedness, isolation, a siege held at bay, no collapsed or abandoned settlement. No text on grave markers.
```

### 05_siege_night_event.png

```text
Scene: Night siege event, high three-quarter panoramic camera straddling a defended timber palisade so interior and exterior are both legible. Outside the still-standing perimeter, dark hunched nonhuman monsters rush across a grey-green foggy wet moor toward the wall. Inside and on elevated wooden fighting platforms, player warriors and archers hold their positions, brace shields and shoot a few flaming arrows outward. Visible torches, a reinforced closed gate, sentries on watchtowers. Interior central large bonfire and secondary small safe fire pools remain intact with survivors gathering under shelter; the central bonfire is the brightest sustained focal light, arrows and torches subordinate. Night illuminated by diffused charcoal grey-green overcast ambience, not blue moonlight, and localized amber fires. No enormous burning buildings, no breached wall, no victory parade, no magical neon, no excessive orange wash; this is an organized defense by a camp still resisting.
```

### 06_service_landmarks_sheet.png

```text
Scene: A professional environment design sheet, one 16:9 landscape canvas with FOUR distinct equally readable isolated service building vignettes, arranged in a clean spacious 2 by 2 grid without drawn borders or labels, on a uniform dark neutral charcoal-grey background. Each vignette has a small irregular wet muddy ground footprint, consistent three-quarter isometric camera, consistent scale and painterly realism. Top left: OPEN-AIR FORGE under a rough timber lean-to, furnace and visible orange fire are the brightest light in the entire sheet, anvil, tools, soot, rust. Top right: squat reinforced STONE STORAGE BUNKER with a heavy closed iron door and tiny dim amber lantern, no fantasy castle. Bottom left: HEALER'S coarse canvas TENT with muted warm glow through an opening, bandages, herb bundles and a completely cloth-covered stretcher nearby, no red cross logos. Bottom right: ANCIENT STONE WAYPOINT, a low worn circular stone platform and irregular old standing stones emitting restrained pale blue from narrow fissures, the ONLY blue element, not neon, weaker brightness than forge. Read each function immediately from silhouette and practical contents. No environment panorama, no sky, no fence, no text, no annotations, no runic writing. Keep material palette grey-green, mud brown and faded canvas consistent with the camp.
```

