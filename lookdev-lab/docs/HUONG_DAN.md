# Sanctuary Lookdev Lab — Hướng dẫn sử dụng

Lookdev Lab là một "phòng thí nghiệm" three.js (r180) để thử **shader, ánh sáng, VFX, lookdev model 3D và môi
trường** cho game chạy trên three.js. Mọi cảnh, hiệu ứng và bước hậu kỳ đều có cho **cả hai renderer**:

- **WebGL2 · GLSL** — `WebGLRenderer`, shader viết bằng GLSL.
- **WebGPU · TSL** — `WebGPURenderer`, shader viết bằng TSL (biên dịch ra WGSL).
- **WebGPU renderer · WebGL2 backend** — cùng code TSL nhưng chạy trên WebGL2 (người chơi không có WebGPU sẽ thấy
  đúng cái này).

Nhờ vậy bạn so sánh được **cùng một khung hình** giữa hai công nghệ: nhìn có giống không, tốn bao nhiêu ms.

---

## 1. Mở chương trình

**Cách nhanh nhất (không cần cài gì):** mở file `Sanctuary_Lookdev_Lab.html` bằng Chrome hoặc Edge (bản mới).
File này chứa toàn bộ code, model mẫu, HDRI và bộ giải nén Draco/KTX2 — chạy offline được.

**Chế độ phát triển (khi muốn sửa code):**

```bash
cd lookdev-lab
npm install
npm run dev          # mở http://127.0.0.1:4174
```

- Sửa file `.js` / `.css` → trang tự tải lại (CSS đổi tại chỗ, không reload).
- Sửa file `.glsl` trong `src/shaders/` → shader **biên dịch lại ngay, không reload trang** (camera, model giữ nguyên).
- `npm run build` → tạo lại `Sanctuary_Lookdev_Lab.html`. `npm run check` → kiểm tra lỗi tĩnh (xem mục 9).

**Chọn renderer:** menu *Renderer* trên thanh trên cùng, hoặc thêm `?renderer=webgl`, `?renderer=webgpu`,
`?renderer=webgpu-gl` vào URL. Đổi renderer sẽ tải lại trang nhưng **giữ camera, mọi thiết lập và ảnh A/B**.

**Chia sẻ online từ máy bạn (Cloudflare Tunnel):**

1. Cài một lần: [Node.js](https://nodejs.org) và `cloudflared` — mở PowerShell/CMD, chạy
   `winget install --id Cloudflare.cloudflared` (xong thì mở cửa sổ mới).
2. Bấm đúp **`share-lab.bat`** trong thư mục `lookdev-lab` (hoặc `npm run share`). Cửa sổ in ra một link dạng
   `https://….trycloudflare.com` — gửi link đó cho người cần xem. Có HTTPS nên WebGPU chạy được ở máy người xem.
3. Link chỉ sống khi cửa sổ còn mở; `Ctrl+C` hoặc đóng cửa sổ là ngừng chia sẻ. Mỗi lần chạy ra link mới.

Server chỉ trả đúng một trang (bản build trong `dist/`, hoặc `../Sanctuary_Lookdev_Lab.html` nếu chưa build) — không
liệt kê thư mục, không đọc được file nào khác trên máy. Trang được nén gzip (~24 MB → ~13 MB) và lần sau trình duyệt
chỉ hỏi lại (ETag) nên tải nhanh hơn. **`share-lan.bat`** chia sẻ trong mạng LAN (`http://<IP máy>:4175`); qua http
thường trình duyệt tắt WebGPU nên người xem trong LAN chạy bản WebGL2.

---

## 2. Bố cục màn hình

- **Cột trái:** model mẫu, HDRI, đối tượng đang xem.
- **Giữa:** khung nhìn 3D. Góc trên trái là các nhãn (renderer, cảnh, chế độ xem). Góc trên phải là **HUD hiệu năng**
  (FPS, CPU, GPU, draw call, tam giác, texture, số hạt…) và biểu đồ thời gian khung hình.
- **Cột phải:** 9 tab — Lookdev, Character, Procedural, Lighting, Post & camera, Shaders, VFX, Environment, Performance.

**Phím tắt:** `H` ẩn/hiện giao diện · `F` căn camera vào model · `V` đổi chế độ xem · `X` false colour phơi sáng ·
`T` bàn xoay · `P` chụp ảnh PNG · `C` so sánh A/B · `Esc` bỏ chọn · `?` trợ giúp · `1–9` tung skill (khi VFX lab bật) ·
**chuột phải**: tung skill đang chọn.

**Kéo thả vào khung nhìn:**

| File | Kết quả |
| --- | --- |
| `.glb .gltf .fbx .obj` | Thay model đang xem (texture nạp cho FBX/OBJ tự lật trục Y) |
| `.hdr .exr` | Môi trường HDRI cho studio |
| Bộ texture Substance (nhiều ảnh cùng lúc) | Tự nối vào material đang chọn theo tên: BaseColor, Normal (tự nhận DirectX), Roughness, Metallic, ORM, AO, Emissive, Height, Opacity |
| `.cube` | LUT màu 3D (tab Post) |
| `.json` | Preset thiết lập (xuất từ tab Performance) |

---

## 3. Tab Lookdev — soi model

1. Chọn model mẫu ở cột trái (Shader Ball, Lantern, Fox có animation, Robot Expressive…) hoặc kéo thả model của bạn.
2. **View mode** (`V`): Lit, Base colour (albedo), World normal, Roughness, Metalness, Material AO (chỉ WebGL2), Emissive,
   **PBR validation** (tô đỏ/xanh/cam/tím các vùng albedo quá tối/quá sáng hoặc metalness lơ lửng), SSAO buffer,
   Clay (chỉ xem ánh sáng), UV checker, Wireframe.
3. **False colour (`X`)**: tô màu theo EV so với xám 18% — kiểm tra phơi sáng như màn hình trên phim trường.
4. **Click vào một mesh** để mở *Selected material*: chỉnh màu, roughness, metalness, normal (có công tắc DirectX),
   emissive, các thuộc tính Physical (clearcoat, transmission, sheen…). Mục **Textures** là trình chỉnh texture
   (xem mục 3b).
5. **Studio environment**: đổi HDRI, xoay môi trường, nền mờ/sắc nét, sàn tối/xám 18%/trắng, bệ, bóng xám + bóng chrome,
   bảng màu ColorChecker.
6. **A/B compare (`C`)**: lần bấm đầu chụp ảnh A. Sau đó đổi bất cứ thứ gì — kể cả **đổi renderer** — rồi kéo thanh chia để so.

---

## 3a. Tab Character — preview nhân vật như trong game

Chọn nhân vật (KayKit Knight / Barbarian / Mage / Rogue, Robot, Fox, hoặc **file GLB của bạn** — một file có đủ clip),
bấm **▶ Play** (`Enter`). Nhân vật chạy trong cảnh đang mở (studio hoặc các cảnh Act I), camera bám theo.

| Điều khiển | Tác dụng |
| --- | --- |
| `W A S D` / mũi tên | Đi theo hướng camera · `Shift` đi bộ · `R` đổi chạy ↔ đi |
| Click chuột trái (giữ để đi liên tục) | Đi tới chỗ click; click hình nộm → tiến lại đánh |
| `Space` / `J`, `E` | Đánh, đánh 2 (đá / đâm) · `Shift`+click: đánh tại chỗ |
| `Q` / chuột phải | Thi triển phép (dùng spell đang chọn của tab VFX) |
| `B` (giữ), `G`, `K` | Đỡ đòn, trúng đòn, chết / đứng dậy |
| Tay cầm | Cần trái di chuyển, A/Y đánh, X phép, B đỡ, RB chạy/đi, Start chết/đứng dậy |

- **Camera:** Diablo ¾ (góc cố định), Isometric 2:1, Third person (chuột phải xoay, tự xoay ra sau lưng khi chạy),
  Free orbit. Tường che nhân vật được **khoét tròn có dither** quanh nhân vật (như D2/D3) — tắt ở *Movement*.
- **Va chạm:** đi theo mặt đất (dốc, bậc ≤ 0,55 m), trượt dọc tường, hình nộm là vật cản. Lưới tam giác của cảnh được
  chia ô 1 m nên kiểm tra rất nhẹ.
- **Animation states:** mỗi trạng thái (idle, walk, run, attack, attack 2, cast, block, block hit, hit, death, revive,
  jump, dodge) tự tìm clip theo tên — theo **tư thế vũ khí** (tay không, 1 tay + khiên, 2 tay, song kiếm, nỏ 1 tay /
  2 tay, pháp sư). Chọn clip khác để ghi đè (lưu theo model). Walk và run chạy cùng pha và trộn theo tốc độ; các đòn
  trộn chồng lên (crossfade). Đòn đánh trúng hình nộm đúng frame va chạm (máu, tia lửa như spell "Hit").
  *Add clips from a file*: thêm clip từ file khác cùng bộ xương.
- **Equipment:** tay phải / tay trái — vũ khí có sẵn trong model (KayKit treo ở xương `handslot`), 14 vũ khí/khiên KayKit,
  hoặc file GLB của bạn. **Grip:** gizmo di chuyển / xoay ngay trong khung nhìn, scale, *Copy grips JSON* để dùng trong
  game. Đổi vũ khí tự đổi tư thế (ví dụ rìu 2 tay → idle/đánh 2 tay).
- **Foot sliding:** tốc độ "tự nhiên" của clip walk/run được đo từ bàn chân chạm đất. *Animation follows speed* bật thì
  tốc độ phát clip theo tốc độ di chuyển (không trượt); tắt thì clip chạy đúng tốc độ gốc → dấu chân **xanh** (giữ chân),
  **vàng** (trượt nhẹ), **đỏ** (trượt rõ). *Set speeds = animation speeds* đặt tốc độ game bằng tốc độ của clip.
- **Scale reference:** dãy mốc cạnh nhân vật — thước 3 m, người 1,8 m, quái nhỏ (Fallen) 1,1 m, quái lớn 2,6 m, boss
  3,8 m, cửa 2,4 m, cây 6 m, lưới 1 m, nhãn chiều cao (đổi số = đổi quy chuẩn, 0 = ẩn). *Character height* chỉnh
  chiều cao nhân vật; *Model forward* nếu model không quay về +Z.

KayKit Adventurers (CC0, Kay Lousberg) được tách bằng `scripts/prepare-kaykit.py`: model riêng, **một thư viện animation
dùng chung cho mỗi bộ xương** (Knight, Barbarian, Mage giống hệt nhau) đã lược bỏ kênh của xương điều khiển IK và
kênh đứng yên → 17,6 MB còn 3,5 MB.

### Gameplay · Ashen Crown v1

Khi bật **Play uses the v1 gameplay core** (mặc định bật), nút **▶ Play (Enter)** chạy lõi gameplay của dự án
Ashen Crown v1 (`src/gameplay/`, chép từ `src/game/` của v1) trên scene và nhân vật đang preview:

- **Điều khiển như v1:** chuột trái đi theo đường A* trên lưới nav (giữ chuột để lái), bấm vào quái để đánh (giữ
  chuột để đánh liên tục), **Shift + chuột trái** đánh tại chỗ, **chuột phải** dùng kỹ năng đang chọn (**F1–F8**),
  **R** đi bộ / chạy, **N** sinh một pack, **Enter** hồi sinh khi chết, **Esc** thoát.
- **Quái:** chỉ số, pack (thường, champion, unique kèm minion và modifier), AI (aggro theo tầm nhìn, cả pack cùng
  lao vào, imp bỏ chạy, cung thủ giữ khoảng cách, shaman hồi sinh đồng bọn) và công thức đánh trúng / chặn / kháng
  đều giữ nguyên của v1. Chọn loại quái, kiểu pack, số lượng và level trong thư mục **Gameplay · Ashen Crown v1**,
  hoặc bật **Endless waves** để quái tự kéo đến.
- **Kích thước:** nhân vật đang preview (GLB như KayKit, Fox, Robot, hay hero procedural) được đưa về **1,8 m**
  (*Hero height*) trong lúc chơi rồi trả lại khi thoát. Quái giữ chiều cao thật của v1 (zombie 1,72 m, skeleton
  1,85 m, imp 0,92 m, Pit Fiend 2,6 m…) nên tỉ lệ với nhân vật đúng như trong game.
- **Chỉ số nhân vật:** theo class (Barbarian / Sorceress / Necromancer, hero procedural tự lấy class của nó) và level,
  theo công thức của v1, kèm một vũ khí khởi đầu. Không có đồ, túi hay bình máu; máu và mana tự hồi chậm.
- **Kỹ năng chuột phải** dùng hệ kỹ năng three.quarks của tab VFX nên **chỉ chạy ở WebGL2 · GLSL**. Ở WebGPU,
  chuột trái vẫn đánh bình thường.
- **Lưới nav:** ô 1 m, loang từ điểm xuất phát trên collision của scene (bước cao tối đa 0,6 m, có tường hoặc đạo cụ
  thì chặn), trong vùng 128 × 128 m. Đổi scene khi đang chơi thì lưới dựng lại và trận đấu bắt đầu lại.
- Trong lúc chơi, hình nộm và castbar của tab VFX tạm tắt (để không giành chuột phải), rồi được bật lại khi thoát.

## 3a'. Tab Procedural — nhân vật dựng bằng code

Các nhóm **Procedural · heroes / monsters / NPCs** ở cột trái (hoặc dropdown *Character* trong tab **Procedural**) nạp
nhân vật được tạo hoàn toàn bằng code trong `src/procedural/`: 3 hero (barbarian, sorceress, necromancer), 13 quái
(zombie, skeleton ×3, imp ×2, spider, wraith, brute, bat, bone golem, ancestor, Hollow King) và 6 NPC. Thân được "nặn"
bằng SDF và đã bake sẵn trong `baked_data.js`; animation là keyframe tính mỗi frame (không dùng AnimationMixer).

- **Build options:** giáp + tier cho hero (biến thể giáp chưa bake nên lần đầu sẽ nặn trực tiếp, mất vài giây), variant /
  element / ally / champion / unique cho quái, variant cho villager, seed.
- **Animation:** chọn clip và *Play clip* (clip một lần xong tự về idle), *Playing*, tốc độ, *Pose at* để dừng ở một
  thời điểm, *Locomotion speed* để model tự chọn idle / walk / run (đứng tại chỗ).
- **Shader effects:** flash, tint, frozen, highlight, rim, emissive, opacity; *Lava cracks* chỉ có ở WebGL2.
- **Cape wind:** gió cho áo choàng verlet của barbarian / necromancer.

WebGL2 dùng nguyên shader GLSL của game (patch `onBeforeCompile` được giữ lại làm patch đầu tiên của lab). WebGPU dùng
bản TSL (`src/procedural/nodeMaterial.js`), chưa có hiệu ứng lava cracks. Tab Character (WASD, trang bị) chỉ dành cho
model GLB có clip, chưa điều khiển được nhân vật procedural.

## 3b. Chỉnh texture của asset đang chọn

Có ở tab **Character** (*Textures*: nhân vật, món tay phải / trái, hoặc mesh vừa click) và tab **Lookdev** (*Selected
material → Textures*).

- **Ô texture:** ảnh thu nhỏ từng map (Base colour, Emissive, Normal, Roughness, Metalness, AO, Opacity, Height), xem lớn
  có lưới UV của mesh; **Replace…** (PNG/JPG/WebP), **+ Add map…** cho ô trống, **Export PNG**, **Reset**, **Remove**,
  **Make unique to this mesh** (tách material dùng chung — các phần của KayKit dùng chung một material).
- **Adjust:** map màu — hue, saturation, brightness, contrast, gamma, tint; map dữ liệu — levels đen/trắng, invert (theo
  đúng kênh: roughness = G, metalness = B, AO = R nên map ORM không hỏng kênh khác); normal — đảo kênh G (DirectX ↔
  OpenGL), độ mạnh. **Only "…" UV area**: chỉ chỉnh vùng UV của mesh đang chọn — hợp với texture atlas (ví dụ đổi màu
  áo choàng KayKit mà không đụng phần khác).
- **UV & filtering:** repeat, offset, xoay, wrap, *Pixelated (nearest)* / mượt, anisotropy. **Material factors:** màu nhân,
  roughness, metalness, emissive, env intensity.

Chỉnh sửa được "nướng" vào texture trên CPU (canvas), nên WebGL2 và WebGPU thấy đúng cùng một ảnh. Export PNG để
mang ảnh đã chỉnh vào game.

---

## 4. Tab Lighting và Post & camera

- **Lighting**: **Mood Act I** (mục 4a), các rig studio (softbox, ba điểm, nắng, rim, nến, chỉ HDRI), nhiệt độ màu Kelvin,
  cường độ đơn vị vật lý, shadow (Basic/PCF/PCF soft/VSM, kích thước map, bias). Ở cảnh Act I, tab này điều khiển giờ
  trong ngày và đuốc.
- **Post & camera**:
  - Camera: Orbit tự do, Game ¾ (góc nhìn kiểu ARPG), **Isometric 2:1** (orthographic, như camera sprite cổ điển), Play.
  - AA: FXAA, SMAA, MSAA, **TRAA** (chỉ WebGPU).
  - Bloom, GTAO, sương mù theo độ cao, grade (cân bằng trắng, contrast, lift/gamma/gain, vignette, grain, quang sai).
  - **Nhớ theo từng cảnh**: tone mapping, exposure, sương mù và phần grade của khung hình (vignette, contrast, saturation,
    lift, nhiệt độ màu) được lưu riêng cho mỗi cảnh. Cảnh chưa chỉnh dùng AgX; Dark Wood (D2 mood) và Bố trí biome dùng ACES ở preset Night.
  - **Dither**: pass cuối cộng nhiễu nửa bậc màu, nên vùng tối, vignette và sương không bị sọc màu (banding).
  - **3D LUT**: chọn look có sẵn (Teal & orange, Bleach bypass, Sanctuary gloom, ba look Act I của các mood) hoặc nạp file `.cube` từ Resolve/Photoshop.
    LUT áp sau tone mapping + sRGB (đúng cách các LUT sáng tạo được xuất ra).
  - **Retro preview**: xem ở 480p/600p với số mức màu giới hạn + dither — kiểm tra silhouette, đồ rơi và hiệu ứng còn đọc
    được ở độ phân giải thấp không.
  - **Readability check · value & colour vision**: *Value* (thang xám theo độ sáng tương đối) và mô phỏng mù màu
    *Deuteranopia / Protanopia / Tritanopia* (Machado 2009, mức nặng nhất) — "nướng" chồng lên LUT đang dùng nên không
    thêm pass nào, chạy ở mọi scene và cả hai renderer. Dùng để duyệt checklist "không dùng màu làm tín hiệu duy nhất".

---

## 4a. Mood ánh sáng kiểu Diablo III Act I

Tab **Lighting → Mood · Diablo III Act I** (chọn nhanh cũng được ở tab Character, dòng *Lighting mood*). Có ba mood:

| Mood | Không khí |
| --- | --- |
| **New Tristram · rainy night** | Đêm mưa: trăng lạnh xanh-teal, đèn lồng và lửa ấm, mưa rơi + giọt bắn, nền đất ướt có vũng nước gợn sóng, thỉnh thoảng có chớp. |
| **Weeping Hollow · fog** | Chiều u ám xám-xanh lá, sương mù dày sát mặt đất, màu xỉn, vùng sáng hơi vàng úa. |
| **Cathedral · crypt** | Đá gần như đen, bóng tối lạnh, các vùng sáng đuốc màu cam, bụi lơ lửng. Ngoài trời thì thành đêm không trăng chỉ có đuốc. |

Mỗi mood gồm:

- **Đèn của cảnh** (trăng/nắng, ánh sáng trời, HDRI, màu và độ sáng đuốc), **exposure và sương mù** riêng cho từng cảnh.
- **Grade**: tone mapping ACES, bloom, LUT tách tông (bóng tối ngả lạnh, vùng sáng ngả ấm), vignette, grain. Bỏ tick
  *Grade, bloom & tone mapping* nếu muốn giữ grade của bạn.
- **Hero light**: vùng sáng mềm đi theo nhân vật như trong game (suy giảm tuyến tính kiểu đèn game, không đổ bóng nên rẻ).
  Chỉnh cường độ, bán kính, độ cao, độ lệch về phía camera, nhiệt độ màu.
- **Viền sáng nhân vật (rim)**: fresnel trên nhân vật và vũ khí đang cầm, mạnh hơn ở mép trên như ánh trăng; chỉnh màu,
  cường độ, độ mảnh.
- **Thời tiết** (ngoài trời và studio): mưa, gió, giọt bắn, vũng nước, chớp (tự động sau mỗi ~N giây, hoặc bấm
  *⚡ Strike now*).
- **Không khí**: bụi lơ lửng trong vùng sáng quanh nhân vật, sương mù trôi sát đất.

Mood dùng được ở **studio** (một rig riêng của mood thay cho rig studio) và các cảnh Act I ngoài trời (**Dark Wood**,
**Bố trí biome**). Chuyển cảnh thì mood tự áp lại cho cảnh mới. Mọi tinh chỉnh được nhớ riêng cho từng mood;
*Reset this mood's tweaks* trả về mặc định. Chọn **Off** thì mọi cảnh và grade cũ của bạn được khôi phục.

Mẹo: bật hero light, rim và đèn chớp không làm biên dịch lại shader (đèn luôn nằm trong cảnh, chỉ đổi cường độ). Bật/tắt
vũng nước thì có biên dịch lại một lần.

---

## 5. Tab Shaders — phòng thí nghiệm shader (GLSL ↔ TSL)

Mỗi hiệu ứng được viết **hai lần** với cùng một bộ tham số: GLSL (`src/backends/webgl/effects.js` + `src/shaders/effects/*.glsl`)
và TSL (`src/backends/webgpu/effects.js`).

| Hiệu ứng | Loại | Dùng để |
| --- | --- | --- |
| Vertex wind | bề mặt | cỏ, cây, cờ lay theo gió (bóng đổ cũng lay) |
| Flame billboard | VFX | lửa đuốc/nến, đèn nhấp nháy theo |
| Dissolve | bề mặt | quái chết / triệu hồi, viền cháy HDR, bóng đổ tan theo |
| Status overlay | bề mặt | Frozen / Burning / Poisoned / Hit flash |
| Fresnel rim | bề mặt | viền sáng khi chọn, aura quái tinh anh |
| Puddle | bề mặt | vũng nước/máu, gợn mưa bằng normal giải tích |
| Town portal | VFX | cổng dịch chuyển xoáy |
| Waypoint runes | VFX | vòng rune dưới đất có hiệu ứng kích hoạt |

**Cách dùng:**

1. Chọn **Effect**, tick **Enabled**.
2. **Apply to**: model đang xem, hoặc *probe* (cầu, nút xoắn, đĩa sàn lát đá). Vũng nước mặc định dùng đĩa sàn.
3. Kéo tham số. Hiệu ứng có hoạt ảnh (dissolve, status, runes) có ô **Animate**.
4. Bật nhiều hiệu ứng cùng lúc để **xếp chồng** (ví dụ Status + Rim + Dissolve). Thứ tự kết hợp giống nhau ở cả hai ngôn ngữ:
   gió → vũng nước → status → rim → dissolve.
5. **Source** mở trình xem mã với các tab:
   - file `.glsl` của hiệu ứng — **sửa được**: bấm *Apply* (Ctrl+Enter) là biên dịch lại ngay; *Revert to file* để trả về;
     *Download* để lưu bản sửa vào dự án. Bản sửa được nhớ trong trình duyệt (kể cả khi đổi renderer).
   - *GLSL glue*: đoạn JS chèn GLSL vào shader có sẵn của three.js (`onBeforeCompile`).
   - *TSL*: cùng hiệu ứng bằng node TSL.
   - *Compiled fragment / vertex*: shader **cuối cùng** GPU thật sự chạy (GLSL của WebGLRenderer, hoặc WGSL do TSL sinh ra).
6. **Cost · A/B benchmark**: đo khung hình khi hiệu ứng tắt và bật (xen kẽ nhiều vòng, lấy trung vị). Đưa camera lại gần để
   hiệu ứng phủ nhiều pixel. Kết quả được lưu theo renderer — đổi renderer, đo lại, bảng sẽ so sánh hai bên.

---

## 6. Tab VFX — skill, hình nộm, chế độ chơi

Bật **VFX lab active** (tự bật khi mở tab). Ba hình nộm tập luyện xuất hiện; thanh skill hiện ở dưới khung nhìn.

| Phím | Skill | Thành phần |
| --- | --- | --- |
| 1 | Fire Bolt | đầu đạn flare, vệt lửa bay lên, khói, đèn di chuyển; va chạm: tia lửa, chớp sáng, vết cháy trên đất; làm hình nộm bốc cháy |
| 2 | Frost Nova | vòng sóng xung kích trên đất, mảnh băng kéo dài theo vận tốc, sương lạnh; đóng băng hình nộm |
| 3 | Poison Nova | vòng mây độc (nửa cộng sáng, nửa alpha — trộn hai kiểu blend trong một draw call), bong bóng; gây độc theo thời gian |
| 4 | Charged Bolt | năm tia điện lang thang, mỗi tia phóng sét xuống đất |
| 5 | Hit: sparks & blood | tia lửa, giọt máu có trọng lực, vết máu loang, bụi |
| 6 | Dissolve death | giết hình nộm bằng shader dissolve, rồi triệu hồi lại bằng dissolve ngược |
| 7 | Town Portal | mở cổng tại con trỏ (dùng lại material portal của tab Shaders) |
| 8 | Waypoint | kích hoạt vòng rune tại con trỏ |
| 9 | Campfire | bật/tắt lửa trại: lửa billboard, tàn lửa nhiễu loạn, khói, đèn chập chờn |

- **Chuột phải** tung skill đang chọn vào con trỏ; trỏ vào hình nộm để nhắm thẳng nó. Số sát thương bay lên theo màu nguyên tố.
- **Play mode**: click chuột trái lên mặt đất để model đi tới, camera bám theo; click hình nộm hoặc chuột phải để tung skill.
  Model có animation (Robot Expressive, Fox) tự đổi clip đứng / chạy / đánh.
- **Simulation**: *Time scale* để xem chậm, **Overdraw heat view** để thấy chỗ hạt chồng nhiều lớp (tốn fill-rate).
- **GPU compute particles** (chỉ WebGPU): "soul storm" mô phỏng hoàn toàn trên GPU bằng compute shader TSL — 10k đến 1 triệu hạt.
  So thời gian GPU với hệ hạt CPU của các skill.
- **Skills (three.quarks)** — hệ skill VFX (chỉ chạy với renderer **WebGL2 · GLSL**, vì quarks dùng `ShaderMaterial` GLSL).
  Bật *Castbar shows skills*: thanh skill đổi sang 12 skill, phím `1`–`9` `0` `-` `=`, chuột phải / `Q` tung skill đang chọn,
  nút hiện cooldown.

  | Phím | Skill | Lớp | Nguyên tố | Kiểu |
  | --- | --- | --- | --- | --- |
  | 1 | Fireball | Sorceress | lửa | đạn bay, nổ lan 2 m |
  | 2 | Frozen Orb | Sorceress | lạnh | quả cầu chậm phun mảnh băng xoắn ốc, cuối đường nổ vòng băng |
  | 3 | Chain Lightning | Sorceress | điện | tia sét gấp khúc nhảy tối đa 5 mục tiêu |
  | 4 | Meteor | Sorceress | lửa | vòng rune báo trước 0.9 s → thiên thạch rơi → nổ, rung màn hình, đất cháy 3 s |
  | 5 | Blizzard | Sorceress | lạnh | mưa mảnh băng 4 s, mỗi mảnh vỡ thành sương khi chạm đất |
  | 6 | Fire Wall | Sorceress | lửa | tường lửa 4.5 m vuông góc hướng cast, 5 s |
  | 7 | Bone Spear | Necromancer | ma thuật | giáo xương xuyên mọi mục tiêu trên đường |
  | 8 | Bone Spirit | Necromancer | ma thuật | linh hồn bay lượn rồi tự tìm mục tiêu, kéo vệt ribbon |
  | 9 | Poison Nova | Necromancer | độc | vòng khí độc lan 7 m, gây độc theo thời gian |
  | 0 | Blessed Hammer | Paladin | ma thuật | búa vàng xoắn ốc ra ngoài từ người cast |
  | - | Holy Freeze | Paladin | lạnh | aura bật/tắt: vòng rune dưới chân, mỗi giây một xung lạnh |
  | = | Teleport | Sorceress | ma thuật | dịch chuyển nhân vật tới con trỏ (tối đa 12 m) |

  Mỗi lần cast: hiệu ứng tụ lực ở tay trong thời gian cast → skill chạy → impact → quái chết theo nguyên tố (lửa: tro và tàn;
  lạnh: vỡ vụn; điện: tia lửa; độc: bong bóng; xương: mảnh xương). *Skill level* nhân sát thương và phóng to hiệu ứng theo
  √level (cùng ngôn ngữ, quy mô lớn hơn). *Soft particles* dùng depth của scene để hạt mờ khi chạm hình khối và bị tường che.
  Hiệu ứng làm trong [quarks editor](https://quarks.art) → export `.json` → kéo thả vào khung nhìn là chạy tại con trỏ.
  Code: `src/skills/` — `fx.js` (thư viện hiệu ứng, mỗi hệ hạt một dòng, có pool), `skills.js` (12 skill: số liệu + `run`),
  `runtime.js` (luồng cast, chuyển động, sát thương; nói chuyện với thế giới qua một *host* nhỏ nên game dùng lại được).
- Bốn đèn point được đặt sẵn khi VFX lab bật (cường độ 0 khi rảnh) để tung skill không làm thay đổi số đèn
  — thay đổi số đèn sẽ khiến mọi material biên dịch lại.

---

## 7. Tab Environment

- **Studio · lookdev**: môi trường trung tính — sân khấu của tab Lookdev (thẻ HDRI, thả file `.hdr`).
- **Act I · Dark Wood (Immortal ref)** và **Act I · Dark Wood (D2 mood)**: khu rừng Dark Wood — cùng một map
  (`src/scenes/darkWood.js`; biến thể D2 ở `darkWoodD2.js`), khác bộ texture, preset giờ và ánh sáng. *Immortal*: góc ba phần tư cao,
  đêm, ánh trăng xanh xám gần như không bão hoà, sương, đất mùn xanh xám với cỏ thưa, đường lát đá cuội chạy chéo màn hình, thân và rễ
  cây xoắn lớn bên trái, đá rêu, một vùng sáng lạnh quanh nhân vật (texture set *Dark Wood stylized*; time of day *Moonlit* / *Deep
  night*). *D2 mood*: cùng địa hình, đường, rừng và đá nhưng chiếu sáng và tô màu theo look Diablo II — camera isometric 2:1 trên hero, đêm,
  ACES, light radius hơi ấm quanh hero, xanh rêu / ô liu / nâu, sương mỏng, không shadow fill (texture set *Dark Wood green*; time of day *Night ·
  light radius* / *Dusk*). Tone mapping, exposure, sương và grade được lưu riêng cho từng scene.
- **Act I · Bố trí biome (thuật toán)**: bản nhìn 3D của engine bố trí asset — xem mục 7h (engine và quy tắc ở 7b).
- **Chung cho các map terrain (Dark Wood, Bố trí biome)** — lớp `TerrainScene` (`src/scenes/terrain.js`). Mặt đất là **3 lớp
  chồng nhau: đất khô (nền) → đất ướt → cỏ**, trộn theo độ cao của từng lớp (nước đọng vào chỗ trũng của đất trước, sỏi nhô
  qua bùn, đất lộ ra giữa các sợi cỏ ở mép). Splat map (R = đất ướt, G = cỏ) sinh từ địa hình và **vẽ được bằng cọ**:
  Environment → *Brush* → bật *Paint*, kéo chuột trái trong khung nhìn (chuột phải vẫn pan, cuộn để zoom), Ctrl+Z để hoàn tác;
  cỏ 3D tự mọc lại theo lớp cỏ sau mỗi nét. Xuất/nhập splat dạng PNG. *Show layer weights* tô màu từng lớp (nâu/xanh dương/xanh lá).
  Shader: `src/shaders/effects/terrain.glsl` + bản TSL trong `backends/webgpu/effects.js` (`createTerrain`).
  **Texture set**: mặc định của Dark Wood là *Act I · Dark Wood (stylized)* (bản Immortal) và *Act I · Dark Wood (stylized, green)* (bản D2 mood);
  *Painted* dùng 3 ô texture cắt từ concept `art-direction/reference/moor_campfire_terrain_concept.png`
  (bùn + vũng nước, cỏ lá, đất xen cỏ) — làm lại bằng `python -I scripts/prepare-terrain-swatches.py <ảnh>` (cắt, làm seamless, phóng 512 px,
  tách heightmap, nhận diện vũng nước); normal/ORM được dựng trong trình duyệt từ heightmap. *Procedural* dùng 3 công thức forge.
  *Painted tiles* dùng 3 tile riêng trong `art-direction/reference/terrain-tiles` (transition → đất khô, mud → đất ướt, grass → cỏ),
  tạo lại bằng `python -I scripts/prepare-terrain-swatches.py --tiles dirt.png,mud.png,grass.png --prefix terrain2`.
  **Shadow fill** (Atmosphere → *Shadow fill on assets*): shader gắn vào terrain, props, cây, cỏ — sau khi tính ánh sáng, chỗ nào còn
  tối hơn ngưỡng thì cộng thêm một phần albedo (đã giảm bão hoà một nửa) nhân màu fill, nên vùng bóng giữ màu vật liệu thay vì đen
  xỉn; chỗ đã sáng không đổi. *Cast shadow strength* (mặc định 0.55) giảm độ đậm của bóng đổ từ trăng (`LightShadow.intensity`:
  1 = bóng đen hẳn, 0 = không bóng) — dùng khi bóng trên mặt đất quá đậm. `src/shaders/effects/shadow_fill.glsl` + `createShadowFill` (TSL, slot `output` mới của node patch). Contrast/saturation/lift/
  temperature/tint/vignette giờ lưu theo scene cùng exposure và fog.
  Preset giờ nằm ở Lighting → *Time of day* (mỗi scene một bộ).
  Chỉnh tại Environment → *Atmosphere · fog & vignette* (cùng giá trị với tab Post & camera). Exposure, fog và vignette giờ
  được lưu **riêng theo từng scene**; khi bật Act I mood thì mood quyết định grade/vignette.
  **Anti-tiling & transitions**: *Tiling breakup* (mỗi lớp đọc 2 lần với độ lệch UV đổi theo vùng ~10 m, trộn chéo — kỹ thuật
  "texture repetition" của Inigo Quilez, dùng textureGrad nên không lộ đường nối mipmap), *Large-scale variation* (độ sáng thay đổi
  theo noise thế giới), *Edge noise* (mép giữa các lớp loang không đều), *Splat smoothing* (splat được box-blur khi upload, dữ liệu vẽ
  gốc giữ nguyên). Script cắt texture còn làm phẳng gradient ánh sáng lớn của ô vẽ để không thành sọc khi lặp.
  **Prop kit**: hàng rào gỗ (15 mảnh), palisade (15 mảnh, PBR), lều (8 cái, PBR) và cây bụi (18 bụi) tách từ prop sheet của dự án bằng
  `python -I scripts/prepare-prop-kit.py <sheet.glb> <out.glb> --prefix fence --preview pieces.png`: tách khối liền, chia hàng/cột,
  bỏ hình người tham chiếu (dùng nó quy ra mét, cao 1.8 m; các hình xám khác cũng bị bỏ), bỏ tam giác lạc kéo dài ngang sheet,
  xoay mỗi mảnh theo trục +x, pivot ở đáy-giữa, texture 1024 px. Sheet có normal map và metallic-roughness map thì giữ nguyên PBR.
  Mảnh chạm nhau trong sheet thì tách tay bằng `--cuts "hàng:x1,x2"`; sheet xếp lưới nhìn từ trên (cây bụi) dùng `--layout top`.
  Lệnh đã dùng: palisade `--prefix palisade --cuts "0:-0.31,-0.15,0.31"`, lều `--prefix tent --cuts "0:-0.385,-0.025"`,
  cây bụi `--prefix shrub --layout top`. Trong Dark Wood, cây bụi (instanced, lay theo gió) dày ở rìa rừng quanh các thân cây, thưa dọc hai bên đường (`buildShrubs`); các kit
  còn lại do engine bố trí đặt (mục 7b, 7h).
- **Texture forge**: các bộ texture PBR lát gạch (gạch đá, đá cuội, đất, cỏ, gỗ, sắt, đá phong hoá, và 3 lớp terrain: đất khô, đất ướt, cỏ nhìn từ trên) được *nướng* từ công thức GLSL
  trong `src/shaders/forge/`. Sửa công thức khi đang chạy `npm run dev` → texture nướng lại ngay.

---

## 7b. Quy tắc bố trí asset theo biome

Quy chuẩn đầy đủ: `art-direction/12_QUY_CHUAN_QUAI_CANH_QUAN_CONG_TRINH.md` §4.6–4.12. Xem kết quả ở map **Bố trí biome** (mục 7h): góc camera theo khu vực (trang trại, trại địch, hang sói, nghĩa địa…) và các overlay giải thích.

- **Cỏ:** mảng mật độ lớn, cụm 3–7 bụi lệch tâm, rìa thấp hơn; màu khô/ẩm gần nhau trong cụm. Mỗi bụi và grass card đều kiểm tra đường, lối thú đi, nước, dốc, đất nhiễm huyết, footprint và vùng tiếp cận. Arena chỉ có cỏ ngắn, thưa. Ruộng giữ hàng gốc rạ đứt đoạn.
- **Prop:** đồ nông trại bám trục nhà, đồ trại hướng vào chỗ sử dụng; footprint tính theo scale và bao được các góc sau xoay. Chừa cửa, lối vào trại và khoảng đứng tương tác; không đủ chỗ thì bỏ. Đá và cây giữ footprint để cỏ không xuyên chân.
- **Đuốc:** 5 vị trí dự kiến tại lối đến miếu, ngã rẽ vào trại, ngã rẽ đường thú, khúc cua đông và lối vào trại. Đặt ở vai đường; không đặt trên đường thú. Dùng ngọn lửa chung, đèn nhỏ không đổ bóng; nếu vị trí không hợp lệ thì không ép đặt.
- **Xương:** cụm ở khu xử lý thịt và cạnh xác/miệng hang; mảnh nhỏ lệch theo một hướng, không rải đều quanh giếng hay suốt lối thú đi. Thiếu kit hoặc đống xương quá lớn thì thử mảnh procedural tại cùng điểm, vẫn giữ các vùng cấm.
- **Đá, cây, xác quái (kit tự nhiên, Tripo từ sheet 08–12):** đá thành **cụm** — một tảng chính và 1–3 tảng nhỏ lệch về một phía, chìm ~15% và nghiêng theo dốc, giữa các cụm có khoảng đất trống; đá rêu ở chỗ ẩm/bờ suối, tảng cao/phiến dài ưu tiên phía bắc (phía sau màn hình). **Cây khô** có gió; cụm **cây cháy** quanh lều cháy; vài cây có gỗ đổ bên cạnh (gốc, thân đổ, cành, rễ, bụi gai). **Xác quái** đặt theo sự kiện: miệng hang sói (xác thú + quỷ lùn cũ), dốc phía bắc (2 quỷ lùn), bờ suối (quái có vỏ), mép ruộng (1 xác giơ tay) — nằm theo dốc, chìm nhẹ, đất dưới xác được tô trơ và ẩm, không có collision. Model Tripo đã bỏ đĩa bùn của concept để chân vật thể nối vào chính terrain. Kit và cách tách: `scripts/prepare-nature-kits.py` (model nguồn trong `art-output/tripo-models/nature/`; hàng dưới của sheet 10–12 được ghép thành ảnh một hàng và dựng lại vì Tripo hay bỏ các hàng dưới của sheet nhiều hàng).
- **Điều chỉnh:** `Grass density` điều khiển bụi/gốc rạ; `3D grass along edges` điều khiển grass card riêng. Đưa **cả hai** về 0 để tắt toàn bộ cỏ 3D. Rebuild cùng thiết lập giữ bố trí ổn định. Các ngưỡng theo mét nằm trong `src/env/biomePlacement.js`; điểm đặt nằm trong plan mẫu `src/env/biomeLayoutDemo.js`.

Chạy `npm run test:placement` để kiểm tra mask/vùng tiếp cận/khoảng cách gốc cỏ; `npm run check` để kiểm tra bundle và shader. Duyệt hình ảnh ở Night + Overcast, cả WebGL2 và WebGPU. Bộ quy tắc này do engine `biomeLayout` áp dụng (map Bố trí biome); map Dark Wood giữ bố cục riêng.

#### Thuật toán bố trí asset tổng quát (`biomeLayout`)

Cùng bộ quy tắc, nhưng viết thành **một engine dùng cho mọi biome**, không phụ thuộc three/DOM: `src/env/biomeLayout.js`. Nó nhận *plan* (đường, nước, cửa, vùng tương tác, spawn, arena, khối chính, vật chủ, sự kiện, hàm đất) và đặt asset theo đúng thứ tự §4.6 — khóa vùng chơi → khối lớn → cụm chức năng → dẫn đường → sinh thái → dấu vết → kiểm tra — rồi trả về `placements`, lớp cỏ (`ecology`), `groundPaint`, vùng cấm, điểm quyết định và `report` (số lượng, mục bị bỏ kèm lý do, cảnh báo, kết quả các kiểm tra §4.12). Mỗi mục thử tối đa 12 vị trí trong bán kính cố định; không vừa thì bỏ và ghi lại. Mỗi nhóm có seed riêng (`options.seeds`: `mass`, `cluster`, `guide`, `ecology`, `trace`) nên đổi seed một nhóm không xáo phần đã đặt trước đó. Giải thích đầy đủ, bảng mét và nguồn từng con số: `art-direction/12_QUY_CHUAN_QUAI_CANH_QUAN_CONG_TRINH.md` §4.13. Scene 3D xem kết quả có ở mục **7h** (lab → "Act I · Bố trí biome (thuật toán)"); ngoài ra có plan mẫu, kiểm thử và ảnh duyệt 2D.

- `npm run test:layout` — 15 hạng mục nghiệm thu trên plan mẫu (`src/env/biomeLayoutDemo.js`, 128×128 m, đủ 7 vùng con) với 3 bộ seed: tính tất định, độc lập giữa các nhóm, vùng chơi không bị thu hẹp, không chồng footprint, khe lọt, vùng sử dụng, đi lọt (BFS), dẫn đường, dấu vết (mỗi sự kiện của plan mẫu đều để lại mảnh trên seed mặc định, hầu hết seed và mọi thứ tự `hosts` — 8a), cụm, mật độ 0/2, giới hạn công sức (mỗi mục ≤ `maxTries` của nó), che camera ≤ 25 % (engine tự từ chối, không chỉ validator báo), kit thiếu/dự phòng, đơn vị hình học; cộng các hạng mục hồi quy: bóng vật cao không che cửa/arena (16), dự phòng chỉ khi thiếu cả mục công thức (17), landmark không chiếm chỗ cụm (18), ngân sách cỏ/cây bụi theo diện tích plan, bản đồ 512×512 không bị cắt cụt (19), đất trống giữa các cụm (20), khoảng scale (21), khối vật chủ là một phần của cụm (22), khối sát mép hành lang không lệch giữa engine và validator (22b2), khối đi xuyên `collision: false` là decor (22d), NaN/validator không rỗng (23), và bảng mét trong AD 12 nêu đủ mọi khóa `LAYOUT_RULES` (15b). Cả bộ chạy ~1 phút. `npm test` chạy cả bộ này lẫn `test:placement`.
- `npm run preview:layout` — ghi `docs/biome-layout-preview.html` (một tệp, không URL ngoài): bản đồ nhìn từ trên xuống, bật/tắt từng lớp (nền, vùng cấm, footprint theo lớp, vùng sử dụng, vùng che camera, bụi cỏ, quyết định, mục bị bỏ) và bảng báo cáo; cuộn để zoom, kéo để di chuyển. Mở bằng trình duyệt thường. Thêm `-- --seed 123` để xem bộ seed khác.
- `npm run measure:kits` — đọc 21 kit trong bảng `KITS` của `scripts/measure-kits.mjs` (`kit-wooden-fence`, `kit-palisade`, các `kit-camp-*`, `kit-moor-rocks`, `kit-dead-trees`…; **không** đọc `kit-rocks` — tảng đá đơn cũ) và ghi bbox hình học, chiều cao, đế thân cây vào `src/env/kitSizes.json`; chạy lại mỗi khi đổi mesh của kit hoặc thêm kit vào `KITS`.
- **Dữ liệu** nằm ở `src/env/biomeCatalog.js`: `ASSETS` (khai báo từng mảnh: vùng con, vai trò, lớp, vùng sử dụng — `side` `left`/`right` là −x/+x cục bộ —, scale, chất nền, dự phòng, `hostKinds`…), `CLUSTERS` (công thức cụm, `bare` = bán kính đất trống quanh vật chủ, `hostKinds`), `TRACES` (nguyên nhân → mảnh + loại vật chủ chấp nhận được), `GUIDES` (chính sách dẫn đường), `ZONE_PROFILES` (hồ sơ 7 vùng con của §4.11; `bonesMul` nhân số mảnh dấu vết, `bank` tăng cụm cỏ bờ nước), `MASS_SETS` (landmark chỉ gồm mảnh tự đạt 2 H trong khoảng scale của nó).
  - *Thêm một biome / vùng con:* thêm mục vào `ZONE_PROFILES` (độ phủ cỏ, cây bụi, trọng số đá–cây, chính sách dẫn đường, có đuốc hay không…) và tên vào `ZONE_KINDS`; khai báo vùng đó trong `plan.zones`; thêm tên vùng vào `zones` của các asset được phép xuất hiện ở đó.
  - *Thêm một asset:* thêm tên mảnh vào khối kit của nó trong `DECLS` (chỉ ghi chỗ khác mặc định của kit), chạy `npm run measure:kits` nếu là mảnh mới, rồi `npm run test:layout` (nó báo mảnh chưa đo hoặc id sai trong công thức). Thêm `fallback` nếu có mảnh thay thế: nó chỉ được dùng khi **mọi** phương án của mục công thức thiếu trong scene, và phải giữ `collision`, `role` và lớp (thấp/cao) của mảnh gốc — `catalogProblems` và test catalog báo nếu không.
  - *Khối đi xuyên:* một khối tự dựng của `plan.masses` (footprint + chiều cao) mà đặt `collision: false` (xác thú, vệt xương) được ghi như đồ trang trí: `class: 'decor'`, `role: 'ground'`, `layer: 'low'`, `blocks: false`, không bóng che camera, không tính vào `gaps` / `passability`; mảnh khác vẫn không được đứng đè lên footprint của nó và nó vẫn làm vật chủ sự kiện.
  - *Thêm cụm / dấu vết:* thêm công thức vào `CLUSTERS` / `TRACES` (chỉ liệt kê asset thuộc công thức) rồi khai `hosts` / `events` tương ứng trong plan. Sự kiện phải có vật chủ đúng loại (`TRACES[nguyên nhân].hosts`: cụm/khối/cửa/mảnh có `hostKinds` tương ứng; điểm trần `{ x, z, kind }`). Nếu một cụm cần đất trống rộng quanh nó, tăng `bare` của công thức.
  - *Đọc kết quả:* `report.drops` ghi mục bị bỏ (kèm số lần thử); `report.warnings` gồm `cluster.sizeMix` (cụm không có nhịp lớn–trung–nhỏ), `landmark.missing`, `event.hostKind`, `budget.*`; `options.logTries: true` ghi thêm `report.tries.items` (dùng cho test).
- Cách gọi: `layoutBiome(plan, buildCatalog({ sizes, available }), { seeds, density: { grass, shrubs, traces, masses }, budgets, rules })`; `available` = tập kit/asset thật sự đã tải, kit thiếu sẽ chuyển sang `fallback` hoặc bị bỏ có ghi lý do.

## 7c. Ground blend — asset ăn vào đất (Dark Wood, Bố trí biome)

Mục tiêu: đá, cây, cọc, thùng, móng nhà, xác quái… nằm **trong** đất thay vì đặt lên trên với một đường cắt cứng; đá chạm đá,
cây chạm đá thì khe được lấp. Một patch shader dùng chung cho mọi asset (GLSL + TSL, cả WebGL2 lẫn WebGPU), gồm:

1. **Capture mặt đất** (kiểu *runtime virtual texture*): chính vật liệu của terrain (albedo + độ nhám, normal + độ cao) được
   render từ trên xuống vào 2 texture quanh camera (2048², ~1–3 cm/texel ở góc chơi). Chỉ chụp lại khi camera ra khỏi vùng đã
   chụp, khi đổi thông số/bộ texture terrain hay vẽ splat; lưới texel cố định nên vệt đất không "bơi" khi camera đi theo nhân vật.
2. **Vệt đất ở chân** (màu đỏ trong chế độ xem vùng trộn): gần mặt đất, albedo / độ nhám / normal của asset chuyển dần sang
   **đúng vật liệu đất tại điểm đó** — cùng texture, cùng chỗ nên đường nối biến mất và ánh sáng liền mạch. Mép có nhiễu, rãnh tối
   trong texture asset được lấp trước, viền đất hơi ẩm tối. Vệt cao theo độ dốc của mặt (mặt đứng ăn cả vệt, mép bùn thoai thoải
   chỉ một sợi, decal nằm trên đất giữ nguyên) và không quá 30% độ cao cục bộ của asset (sỏi, rễ, xương nhỏ giữ hình). Lên cao
   trong vệt, texture đất được "trải" theo hướng mặt thay vì kéo sọc.
3. **Mặt trên** (lục): mặt hướng lên của đá phủ một lớp đất/rêu của chính nền (các tảng đứng cạnh nhau có chung lớp phủ).
4. **Khe tiếp xúc** (lam): khoảng cách từ mỗi đỉnh tới asset khác được bake một lần trên CPU (`src/env/contact.js`, 0,5–1 s lúc
   mở map) → khe đá–đá, đá–thân cây được lấp đất và tối đi, mờ dần trên 1,2 m.

Mỗi loại asset một *profile* (`GROUND_PROFILES` trong `src/env/groundBlend.js`): **đá** đủ 3 lớp, **cây** vệt bằng nửa và không
phủ cành, **xác quái**, **đồ dựng** (chỉ vệt chân, không lấp khe giữa các đoạn hàng rào). Scene nhận ra kit tự nhiên
qua atlas texture của kit (đá, đá rêu, cây khô, cây cháy, xác).

Điều khiển: Environment → Scene options → **Ground blend · asset ăn vào đất** — bật/tắt (tức thì, không biên dịch lại), *Xem vùng
trộn*, chiều cao vệt, bề rộng chuyển tiếp, tối đa × chiều cao asset, nhiễu/độ mềm mép, trộn normal, trải texture, phủ mặt trên,
lấp khe, tối khe, độ cao khe, bán kính dò khe (bake lại), độ phân giải capture. **Cụm thử** dựng một cụm đá chồng đá + cây mọc
giữa đá cạnh tâm camera (tạm, không lưu) để soi các trường hợp tiếp xúc.

Chi phí đo trên RTX 4070, khung ~1022×853, góc chơi D2 (đo ở map Weeping Fields cũ): patch +~0,07 ms GPU (WebGPU 2,16 → 2,23 ms; trên WebGL2
chênh lệch nằm trong nhiễu đo); mỗi lần chụp lại capture ~2,3 ms GPU (WebGPU) + ~3 ms CPU, chỉ khi camera ra khỏi vùng; mỗi vật
liệu thêm 2 sampler (WebGPU giới hạn 16 sampler/fragment — terrain không mang patch này).

Gắn vào scene mới:

```js
this.groundBlend = new GroundBlend(app, { ground: this.ground, terrain: this.terrain, heightAt: (x, z) => this.height(x, z), splat: this.splat });
this.groundBlend.setAssets(meshes, (mesh) => GROUND_PROFILES.rock); // tree / remains / built, hoặc null = bỏ qua
// activate() / deactivate() trong activate/deactivate của scene, update() mỗi frame, buildControls(folder) trong panel
```

Giới hạn: chỉ hoà với terrain splat (vệt bánh xe, suối dạng ribbon chưa vào capture); asset di chuyển (nhân vật, quái) không
dùng; asset rất xa camera (ngoài vùng capture) giữ nguyên; khe tính theo đỉnh nên mesh ít đỉnh (đá procedural) cho khe mờ hơn.
Shader: `src/shaders/effects/ground_blend.glsl` + `createGroundBlend` trong `backends/webgl/effects.js` và
`backends/webgpu/effects.js`.

## 7e. GPU instancing theo ô (Dark Wood, Bố trí biome)

Vật thể lặp lại (búi cỏ, thẻ cỏ viền, bụi cây, cây kit Tripo) vẽ bằng `InstancedMesh`, nhưng **chia theo ô** của lưới xz:
một mesh cho mỗi hình × vật liệu × ô (`src/env/instancing.js`). Đạo cụ tĩnh vẫn gộp theo vật liệu (`StaticBatch`) nhưng
cũng theo ô (`build(true, { cell })`).

- Vì sao chia ô: một InstancedMesh cả map có hộp bao cả map nên **không bao giờ bị cull** — trước đây làng vẽ đủ 6 876
  búi cỏ mỗi khung dù góc isometric chỉ thấy ~1/10, và bóng của lửa trại (6 mặt cube) vẽ lại mọi đạo cụ của cả map 6 lần.
  Mỗi ô có hộp bao riêng nên camera và mọi camera bóng (6 mặt bóng lửa, đèn hero, trăng) chỉ vẽ ô chúng thấy.
- Cây kit giờ là instance (trước: mỗi cây một mesh). Hình mỗi loại cây được scale về mét một lần nên gió vẫn lắc như cũ;
  `userData.labSolid` giữ va chạm và vòng nhìn xuyên (see-through) cho từng instance. Ground blend nhận mesh instanced
  (độ cao cục bộ tính theo hình, không có khe tiếp xúc giữa các instance).
- Bụi cây lắc vài cm nên được nướng vào bóng trăng tĩnh.
- Environment → Scene options → **GPU instancing · chia ô**: cỡ ô Tắt (cả map một khối, như cũ) / 16 m (mặc định) / 24 /
  32 m; thẻ cỏ và cây dùng ô gấp đôi. Đổi cỡ ô **tải lại trang** (dựng lại map tại chỗ làm WebGPU ra khung đen — cùng lỗi
  đổi scene đã biết). Bảng dưới liệt kê số instance / mesh từng bộ.

**Đo (map Làng cũ, góc chơi D2, RTX 4070, GPU dùng chung với các phiên lab khác nên thời gian GPU nhiễu ±1 ms):**

| | Tắt (cả map) | Ô 16 m |
|---|---|---|
| Draw call WebGL2 / WebGPU | 544 / 489 | 365 / 302 |
| Tam giác mỗi khung | 4,42 triệu | 1,25 triệu (−72 %) |
| CPU luồng chính / khung, WebGL2 | 6,5 ms | 6,8 ms (+0,3) |
| CPU luồng chính / khung, WebGPU | 12,1 ms | 11,5 ms (−0,6) |
| Thời gian GPU | không đổi đo được (khung nghẽn ở fragment) | |

Map Weeping Fields cũ: 564 → 397 draw, 3,34 → 0,94 triệu tam giác. Trên RTX 4070 lợi ích chính là CPU của WebGPU (ít draw hơn)
và bớt 3 triệu tam giác — phần sau đáng kể trên iGPU / laptop yếu, không thấy được trên card rời mạnh. WebGL2 tốn thêm
~0,3 ms CPU vì three.js kiểm tra frustum / buffer cho từng object trong từng pass bóng (nhiều ô hơn = nhiều object hơn);
mesh tĩnh đặt `matrixAutoUpdate = false` để khỏi tính lại ma trận mỗi khung.

## 7f. Bầu không khí — hạt GPU (atmosphere)

`src/env/atmosphere.js` + shader `src/shaders/vfx/atmosphere.vert.glsl` / `.frag.glsl` (GLSL) và bản TSL trong
`backends/webgpu/vfx.js` (`#region atmosphere`). Một scene dùng nó khi có preset trong `SCENE_ATMOSPHERE` (mã scene → lớp hạt, vùng, số lượng); hiện
bảng này trống nên Studio, Dark Wood và Bố trí biome chưa bật lớp nào — thêm một mục là scene đó có panel và hạt.

- **Cách làm:** mỗi lớp hạt là **một draw instanced**; mỗi hạt chỉ là một seed ngẫu nhiên (vec4). Vị trí, trôi theo gió,
  lượn, xoay lật, nhấp nháy và ánh sáng đều tính trong vertex shader theo thời gian — CPU không mô phỏng hạt nào, mỗi khung
  chỉ gửi vài uniform (hộp quanh camera, gió, 8 đèn gần nhất, đèn cho bướm). Hạt nằm trong một hộp đi theo camera (x, z),
  bám mặt đất bằng height map nướng một lần từ `scene.height(x, z)` (đọc bằng `texelFetch` / `textureLoad`, không tốn
  sampler), mờ dần ở mép hộp và trong 1,5–3,5 m trước camera phối cảnh. Soft particle theo depth của scene như mọi VFX.
- **Ánh sáng:** hạt "có màu" nhận ánh sáng như bề mặt (falloff của point/spot light của three, 8 đèn ảnh hưởng nhất ở
  tâm view + ambient trời) — bụi chỉ hiện trong vùng sáng của hero và quanh lửa, ngoài đó tối (đúng cảm giác đêm D2).
- **Các lớp:** bụi lơ lửng (lấp lánh khi xoay), tro bay + tàn lửa (một phần nhỏ hạt phát sáng), lá khô theo gió (lướt sát
  đất, gió giật thì bay lên), đom đóm (bờ suối, rừng), hồn ma lập lòe (mộ), bào tử máu bốc lên (đất nhiễm huyết), bướm
  đêm quanh đèn / đuốc nhỏ, sương thấp trôi. Mỗi map có preset riêng: vùng sống (vòng tròn), số
  lượng; gió lấy theo gió của cỏ (cùng hướng, cùng độ mạnh); lớp "đêm" tắt ban ngày; mood mưa làm bụi / tro / lá / đom đóm
  / bướm lắng xuống.
- Environment → Scene options → **Bầu không khí · hạt GPU**: bật/tắt, mật độ ×, bật/tắt và lượng × từng lớp (lưu theo
  scene), dòng thống kê (số lớp, số hạt, draw, CPU/khung).
- **Chi phí đo (map Làng cũ, RTX 4070):** 8 lớp ≈ 3 700–4 600 hạt, 8 draw; CPU ~0,04 ms/khung; GPU không đo được khác biệt trên
  WebGL2, ~+0,2 ms trên WebGPU. GLSL và TSL cho cùng một hình (cùng thời điểm → cùng vị trí hạt).
- Hạt có vòng đời (lửa, khói, phép) vẫn dùng hệ hạt CPU (`vfx/particles.js`); mưa của mood cũng vậy.

## 7h. Map Bố trí biome (thuật toán)

`src/scenes/biomeLayout.js` — scene id `biomeLayout`, "Act I · Bố trí biome (thuật toán)". Đây là **bản nhìn 3D của engine** `layoutBiome()` (`src/env/biomeLayout.js`, art-direction/12 §4.13): scene chạy engine trên plan mẫu `src/env/biomeLayoutDemo.js` (128 × 128 m, đủ 7 vùng con) rồi vẽ kết quả bằng kit thật, để bạn **duyệt bố cục từ camera game** và xem **vì sao** mỗi thứ nằm ở chỗ đó. Dựa trên `TerrainScene` (splat đất, ruy-băng, cỏ shell, brush, ground blend, gió, shadow fill); mở ở góc chơi D2 (isometric 2:1, cao 12 m) ban đêm, có hero đứng cạnh để đọc tỉ lệ.

**Map vẽ gì (đều từ kết quả engine, không có toạ độ đặt tay):**
- Mặt đất = hàm `ground()` của plan — chính hàm engine dùng để đặt đồ (lúc tải scene tự kiểm tra **hai chiều**: placement lệch > 2 cm so với điểm thấp nhất dưới footprint trừ độ lún — nổi hay chìm — thì báo trong console và trong báo cáo). Đường, lối mòn thú, suối, ao lấy từ `plan.paths` / `plan.water`; `groundPaint` (đất trần/ẩm dưới dấu vết, chân prop) tô vào splat; lớp cỏ của splat (và cỏ shell) theo thảm cỏ `ecology.carpet` nên cỏ dừng ở hành lang, footprint, nước.
- `placements` → đạo cụ kit gộp theo **class** (cản · phá được · trang trí đi xuyên · dẫn đường · tương tác · nguy hiểm), chia ô GPU (`cells`, mặc định 16 m); cây (`deadTrees` / `burnedTrees`) là instance có gió, solid. Khối tự dựng của plan dựng theo `kind`: `building` = Valdren `house` / `barn` (đỉnh mái đo lại rồi chỉnh đúng `p.y + height` của plan, trừ phần sàn nâng lên, để vùng che camera khớp; mảnh cửa bị xé nằm trên mặt đất trong hành lang cửa thì bỏ — lối đi plan giữ trống thì trống); `cliff` = các tảng đá **nằm trong footprint** (bán kính ≤ 0,95 nửa bề sâu, đỉnh cao nhất chạm `p.y + height`, cao thấp trôi dọc dải); `den` = `wolfDen`, `carcass` = `carcass`, co theo footprint / height và hướng miệng (+z cục bộ) theo `yaw` của khối (khối có `collision: false`, như xác trong plan mẫu, là **đồ trang trí đi xuyên**: class `decor`, nằm trong nhóm không solid, hiện màu decor ở class view); bệ waypoint (tương tác tên `waypoint`); loại chưa biết → khối giữ chỗ + cảnh báo console.
- `ecology.tufts` (vị trí, cao, tông, loại: cỏ / hàng ruộng / bờ nước / dải giữa vệt bánh / chân prop) → cỏ instance; `ecology.shrubs` → bụi kit; thẻ cỏ 3D đặt trên các tuft cao ≥ 0,2 m (nên cũng tuân thủ mọi vùng cấm).
- Mọi placement có `light` → ngọn lửa + point light nhỏ **không đổ bóng** (WebGPU chỉ có 16 sampler ở stage fragment của terrain: chỉ ánh trăng có shadow map).

**Environment tab → "Bố trí biome · thuật toán":**
- **Góc camera:** *Góc chơi D2* (mặc định), *Tổng quan cả map*, rồi từng khu vực ở hai dạng — game ¾ (trang trại **gồm cả ruộng**, trại địch, hang sói, nghĩa địa, sườn đá phía bắc, suối + đường) và **góc chơi D2** (…Play: iso 2:1 trên khu đó). Toạ độ các view tính từ `plan.zones` / hosts / giao điểm đường–suối. Camera luôn nhìn vào tâm khu vực, còn **hero đứng ở chỗ trống gần nhất** (ngoài mọi footprint cản + 0,7 m, cách mảnh đi xuyên — mũi tên, mũ, xác — ≥ 0,3 m, ngoài nước; ưu tiên trong hành lang cửa gần đó — vd. cửa hang) nên không bao giờ đứng trong khối đá/nhà; đổi seed khối thì chỗ đứng tự tính lại. **Class view** tô màu theo class (như Weeping Fields) kèm chú giải.
- **Overlay giải thích** (từng cái bật/tắt, vẽ ôm theo địa hình): 1 · play space (hành lang đường + dải `pathClear`, hành lang cửa, vùng tương tác / spawn / arena, nước + bờ) · 2 · footprint OBB theo class (bụi cây mờ) · 3 · use zone (vùng thao tác phải trống) · vùng **che camera** (footprint kéo dọc hướng nhìn) · 4 · điểm quyết định (fork / gate / bridge / bend, bán kính marker, cột dựng, đường nối tới marker) · 3 · cluster (vật chủ, bán kính, đường tới từng thành viên, `đặt/yêu cầu`; nếu sửa nhịp kích cỡ thêm thành viên thì ghi `yêu cầu +N repair`) · 6 · trace (mũi tên nghiêng, nan quạt, mảnh phụ; sự kiện bị bỏ màu đỏ) · **Drops** (✕ + bước · lý do · chi tiết). Nhãn trên mặt đất tự trượt để không chồng lên nhau.
- **Seed & mật độ:** seed gốc (`plan.seed`) và một seed cho mỗi nhóm (mass, cluster, guide, ecology, trace), mật độ cỏ / bụi / dấu vết / khối lớn; nút *Đổi cả 5 seed nhóm* và *Seed mặc định*. Đây là thông số **lúc dựng**: đổi xong map tự tải lại (đổi tại chỗ làm WebGPU vẽ đen). Thử: đổi seed ecology → khối, cụm, đuốc không nhúc nhích, chỉ cỏ/bụi đổi; đổi seed trace → chỉ dấu vết và cỏ bị gỡ dưới chúng đổi.
- **Báo cáo:** số placement theo class / bước / nhóm / vai trò, sinh thái (số tuft theo loại), cluster / trace, **ms từng bước**, seed, mật độ, kiểm tra y (nổi / chìm); **các kiểm tra §4.12 (19)** ✓/✗ (rê chuột xem chi tiết); **Drops** gom theo lý do — **bấm một dòng** để camera bay tới đó và bật overlay Drops; cảnh báo của engine.
- **Lighting:** Night (ánh sáng D2, mặc định) · Overcast (ánh sáng trung tính để đọc màu) · Dusk; công tắc *Đèn của plan*. Bóng trăng đi theo tâm camera (±34 m, rộng hơn khi camera xa).
- Phần còn lại như map Dark Wood (cùng lớp cơ sở `TerrainScene`): lớp terrain, khí quyển, brush (vẽ tay lên splat; *Regenerate from the layout* tạo lại từ engine), gió, ô instancing, ground blend.

**Cách duyệt theo checklist AD 12 §4.12:**
1. **Góc chơi D2, Night rồi Overcast** (hero ở giữa): đường chính ≥ 3 Sub đọc được, không prop nào hẹp hơn lối đi; cỏ/đá không đè lên đường; đuốc chỉ ở chỗ có quyết định. Bật *Play space* để thấy hành lang và so với thứ nằm cạnh.
2. **Class view** ở từng khu: vật cản tối/chắc, phá được và tương tác phân biệt được, trang trí không bị nhầm là vật cản. Bật *Footprint* để thấy cái nào chặn.
3. **Che camera:** bật *Vùng che* ở góc chơi trại địch / trang trại — vùng hồng không được trùm lên cửa, spawn, arena hay quá 25 % màn hình (đã là kiểm tra `occlusion` trong báo cáo).
4. **Cụm & dấu vết:** *Cluster* — mỗi cụm có nhịp lớn–trung–nhỏ, thành viên đúng công thức; *Trace* — mỗi sự kiện có 1 mảnh chính + 2–6 mảnh phụ nghiêng cùng phía, sự kiện bị bỏ có lý do trong báo cáo.
5. Mọi dòng ✗ trong báo cáo và mọi drop đáng ngờ: bấm để tới tận nơi, sửa plan / catalog (xem §7b, mục "Thuật toán bố trí asset tổng quát"), chạy lại `npm run test:layout`.

Ghi chú: terrain của map này là 128 m (lớp cơ sở `TerrainScene` cố định 120 m, nên `buildTerrain()` và splat được thay bằng bản 128 m). Có kiểm tra console trên cả WebGL2 và WebGPU; map đo ở góc chơi: ~128 draw, ~1,11 triệu tam giác (phần lớn là 10 lớp cỏ shell của terrain); WebGL2 CPU 0,8 ms · GPU 4,7 ms, WebGPU CPU 3,5 ms · GPU 1,2 ms. Plan mẫu: sàn nhà / kho nằm trên nền phẳng, sườn bắc dốc ≤ ~26° (bắt đầu sau z −54, phía sau bàn tế / lò mổ của trại) (tảng đá nằm trong footprint hàng `cliff`), nước có chút ánh xanh thép để ban đêm không thành dải đen.

## 8. Tab Performance — đo, stress test, quay video

- **Renderer**: thông tin GPU, có timer query không, có compute không; đổi renderer.
- **Quality**: Low / Medium / High / Ultra; *Render scale* để tìm xem đang nghẽn ở GPU hay không.
- **Benchmark · compare renderers**:
  - *Run scene benchmark*: đo từng cảnh từ góc camera mặc định.
  - *Measure feature costs*: AO, bloom, SMAA, sương mù, bóng đổ — mỗi tính năng tốn bao nhiêu ms ở cảnh hiện tại.
  - Kết quả lưu theo renderer → chạy ở WebGL2, đổi sang WebGPU, chạy lại → bảng so sánh hai cột.
- **Stress tests**: nhân bản model (đám đông, có animation), 4–64 đèn point di chuyển, 4–40 cụm lửa + khói.
- **Capture & presentation**: chụp PNG, quay video WebM (24/30/60 fps), quay đúng một vòng bàn xoay,
  **Presentation mode** (ẩn giao diện, camera tự xoay, có thể tự đổi cảnh; `H` hoặc `Esc` để thoát).
- **Settings presets**: xuất toàn bộ thiết lập ra `.json`, nạp lại (hoặc kéo thả file vào khung nhìn), đặt lại mặc định.

**Cách đọc số đo:** *frame cost* là thời gian một khung hình khi render liên tục không chờ vsync rồi đồng bộ GPU — tức là
CPU + GPU, cái nào chậm hơn quyết định. *GPU* là số từ timer query (nếu trình duyệt hỗ trợ): HUD hiện giá trị làm mượt,
còn benchmark lấy trung vị của số đo từng khung hình để hai phía A/B không lẫn vào nhau; ở WebGPU số này gồm cả compute pass
(hạt GPU). Luôn so sánh cùng độ phân giải và cùng preset chất lượng. Số đo trên GPU giả lập bằng phần mềm (SwiftShader,
máy ảo không có card đồ hoạ) không có ý nghĩa.

---

## 9. Thêm một hiệu ứng mới (GLSL + TSL)

1. Khai báo trong `src/effects/registry.js`: tên, loại (`surface` hoặc `vfx`), tham số (số, màu, lựa chọn).
2. **GLSL**: viết `src/shaders/effects/<ten>.glsl`; thêm builder trong `src/backends/webgl/effects.js` giữa
   `// #region <ten>` và `// #endregion`:
   - hiệu ứng bề mặt = một *patch* `{ id, order, needs, shadow, apply(shader) }` chèn code sau các chunk của three.js
     (`#include <map_fragment>`, `#include <emissivemap_fragment>`…); `needs` xin các varying dùng chung
     (`objectPos`, `worldPos`, `worldNormal`); `shadow: true` để bóng đổ cũng chạy patch.
   - hiệu ứng VFX = một `ShaderMaterial` dùng `lab_vfx` (fade theo độ sâu cảnh, overdraw).
3. **TSL**: thêm bản song sinh trong `src/backends/webgpu/effects.js` (cùng tên region): một *node patch* cộng dồn vào
   `position / color / roughness / metalness / emissive / normal / mask`, hoặc một node material.
4. Chạy `npm run check`: kiểm tra hiệu ứng có đủ cả GLSL lẫn TSL, không dùng từ khoá cấm của GLSL (ví dụ `active`),
   không có `smoothstep` ngược cạnh, không có callback `If` dạng biểu thức trong TSL.
5. Mở tab Shaders — hiệu ứng mới tự có bảng điều khiển, trình xem mã và benchmark.

**Bẫy TSL đã gặp (three r180):**

- Callback của `If(...)` phải là khối `() => { ... }`. Viết `() => out.assign(x)` sẽ trả về node → TSL hiểu là `return`
  và bỏ mất phép gán.
- Giá trị dựng sẵn (normal, hướng nhìn, mẫu texture) **lần đầu dùng bên trong một nhánh `If`** chỉ được gán trong nhánh đó
  → nhánh khác thấy giá trị 0 → NaN → cả khung hình đen. Tính trước bằng `.toVar()` rồi mới rẽ nhánh.
- `normalNode` được dựng trong một "sub-build" riêng, nên biến dùng chung với màu/roughness bị tính hai lần.
- Khung hình render ngoài vòng `requestAnimationFrame` của three phải tự gọi `nodeFrame.update()`, nếu không các node
  cập nhật theo frame (nền của transmission, lịch sử TRAA) bị "đứng hình".
- Material trong suốt dùng `colorNode` sẽ **tự `discard` pixel có alpha ≤ 0**. Hạt cộng sáng thuần (alpha = 0, như
  "soul storm" compute) phải viết bằng `fragmentNode`, nếu không sẽ vô hình dù vẫn tốn draw call.
- Texture 3D trên WebGPU: three tải `Data3DTexture` từng lát một; có trình duyệt (Dawn + SwiftShader) không khởi tạo được
  phần còn lại và bỏ cả khung hình (màn đen). Vì vậy đường TSL đọc LUT từ một **dải 2D** (các lát xanh dương xếp cạnh nhau,
  tự nội suy giữa hai lát) — kết quả trùng với `sampler3D` của GLSL.

---

## 10. Xử lý sự cố

| Hiện tượng | Cách xử lý |
| --- | --- |
| Nhãn "WebGPU → fell back to WebGL2" | Trình duyệt không có WebGPU. Dùng Chrome/Edge mới; trên Linux có thể cần bật cờ `chrome://flags/#enable-unsafe-webgpu`. |
| Khung đỏ "Shader compile error" | Đọc dòng lỗi (có số dòng và đoạn mã). Với bản sửa trong trình duyệt: mở Source → *Revert to file*. |
| Lần đầu bật hiệu ứng / đổi số đèn bị khựng | Bình thường: shader đang biên dịch. Benchmark đã có bước khởi động để loại bỏ phần này. |
| Không có số GPU trong HUD | Trình duyệt không cho timer query (Firefox, một số Safari). Dùng số *frame cost*. |
| Compute particles bị khoá | Cần renderer WebGPU · TSL trên trình duyệt có WebGPU. |
| Model quá nhỏ/quá to | Model được tự chuẩn hoá khi lớn hơn 6 m hoặc nhỏ hơn 0,3 m (xem *import scale* trong tab Lookdev). |

---

## 11. Cấu trúc thư mục

```
src/app/        khung ứng dụng, model, benchmark, stress test, quay video
src/character/  preview nhân vật: điều khiển, animator, map clip, va chạm, trang bị, trượt chân, mốc tỷ lệ, khoét tường
src/backends/   webgl/ (GLSL) và webgpu/ (TSL) — pipeline, hiệu ứng, VFX, compute
src/core/       thiết lập, renderer, asset, camera, grading, LUT + readability check, đăng ký shader
src/lookdev/    chế độ xem, vật tham chiếu, trình chỉnh texture
src/effects/    lược đồ hiệu ứng + bộ điều khiển phòng thí nghiệm shader
src/env/        texture forge, bộ kit Act I, lửa, terrain splat; valdren.js (bảng màu + khoá màu + kit Valdren / Redbound /
                Blightbeasts), signals.js (telegraph, vòng tương tác, bảng mẫu màu), groundBlend.js + contact.js (asset ăn vào đất),
                instancing.js (GPU instancing theo ô), atmosphere.js (hạt GPU trong không khí)
src/lighting/   rig studio, preset mood Act I (moods.js), bộ điều khiển mood (hero light, rim, mưa, chớp)
src/panels/     mỗi tab một file
src/procedural/ nhân vật dựng bằng code (hero, quái, NPC): rig, nặn SDF, clip, dữ liệu bake, catalog cho lab
src/scenes/     studio, hai scene Dark Wood, bố trí biome (+ lớp cơ sở terrain.js)
src/shaders/    mọi file .glsl (sửa là nạp lại ngay)
src/vfx/        hệ hạt, đèn dùng chung, hình nộm, skill, VFX lab
```

Giấy phép tài nguyên bên thứ ba: [THIRD_PARTY_LICENSES.md](../THIRD_PARTY_LICENSES.md).
