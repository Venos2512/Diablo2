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
bấm **▶ Play** (`Enter`). Nhân vật chạy trong cảnh đang mở (studio hoặc hai cảnh Act I), camera bám theo.

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
- **Thời tiết** (chỉ ngoài trời và studio): mưa, gió, giọt bắn, vũng nước, chớp (tự động sau mỗi ~N giây, hoặc bấm
  *⚡ Strike now*).
- **Không khí**: bụi lơ lửng trong vùng sáng quanh nhân vật, sương mù trôi sát đất.

Mood dùng được ở **studio** (một rig riêng của mood thay cho rig studio), **nghĩa địa** và **hầm mộ** (trong nhà thì
không mưa, không chớp). Chuyển cảnh thì mood tự áp lại cho cảnh mới. Mọi tinh chỉnh được nhớ riêng cho từng mood;
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

- **Studio · lookdev**: môi trường trung tính.
- **Act I · Burial grounds**: nghĩa địa ngoài trời — giờ trong ngày (đêm/hoàng hôn/u ám), gió cho cỏ và cây chết, mật độ cỏ, đuốc.
- **Act I · Catacombs**: hầm mộ — đuốc tường, chậu than, trần, bóng đổ của đuốc.
- **Act I · Moor terrain**: đồng hoang kiểu Blood Moor — đường xe bò có vệt bánh ướt, suối cạn, bãi lội. Mặt đất là **3 lớp
  chồng nhau: đất khô (nền) → đất ướt → cỏ**, trộn theo độ cao của từng lớp (nước đọng vào chỗ trũng của đất trước, sỏi nhô
  qua bùn, đất lộ ra giữa các sợi cỏ ở mép). Splat map (R = đất ướt, G = cỏ) sinh từ địa hình và **vẽ được bằng cọ**:
  Environment → *Brush* → bật *Paint*, kéo chuột trái trong khung nhìn (chuột phải vẫn pan, cuộn để zoom), Ctrl+Z để hoàn tác;
  cỏ 3D tự mọc lại theo lớp cỏ sau mỗi nét. Xuất/nhập splat dạng PNG. *Show layer weights* tô màu từng lớp (nâu/xanh dương/xanh lá).
  Shader: `src/shaders/effects/terrain.glsl` + bản TSL trong `backends/webgpu/effects.js` (`createTerrain`).
  **Texture set**: *Painted* (mặc định) dùng 3 ô texture cắt từ concept `art-direction/reference/moor_campfire_terrain_concept.png`
  (bùn + vũng nước, cỏ lá, đất xen cỏ) — làm lại bằng `python -I scripts/prepare-terrain-swatches.py <ảnh>` (cắt, làm seamless, phóng 512 px,
  tách heightmap, nhận diện vũng nước); normal/ORM được dựng trong trình duyệt từ heightmap. *Procedural* dùng 3 công thức forge.
  *Painted tiles* dùng 3 tile riêng trong `art-direction/reference/terrain-tiles` (transition → đất khô, mud → đất ướt, grass → cỏ),
  tạo lại bằng `python -I scripts/prepare-terrain-swatches.py --tiles dirt.png,mud.png,grass.png --prefix terrain2`.
  Lighting → Time of day → **Night camp · D2R look** (mặc định, theo Rogue Encampment ban đêm của D2R): trăng lạnh hơi lục
  làm key, bóng mềm đổ về trái màn hình; ambient rất thấp; **light radius** của nhân vật (point light lạnh bám theo nhân vật);
  4 đuốc giá ba chân quầng ấm hẹp; sương tối mỏng; grade ngả lục-lạnh, vignette 0.7. Giá trị được dò bằng số so với ảnh
  D2R: độ sáng trung vị ~0.12, rìa/tâm ~0.6, màu trung bình trung tính-lục (R ≈ G).
  **Shadow fill** (Atmosphere → *Shadow fill on assets*): shader gắn vào terrain, props, cây, cỏ — sau khi tính ánh sáng, chỗ nào còn
  tối hơn ngưỡng thì cộng thêm một phần albedo (đã giảm bão hoà một nửa) nhân màu fill, nên vùng bóng giữ màu vật liệu thay vì đen
  xỉn; chỗ đã sáng không đổi. *Cast shadow strength* (mặc định 0.55) giảm độ đậm của bóng đổ từ trăng và lửa trại (`LightShadow.intensity`:
  1 = bóng đen hẳn, 0 = không bóng) — dùng khi bóng của palisade/hàng rào trên mặt đất quá đậm. `src/shaders/effects/shadow_fill.glsl` + `createShadowFill` (TSL, slot `output` mới của node patch). Contrast/saturation/lift/
  temperature/tint/vignette giờ lưu theo scene cùng exposure và fog.
  Lighting → Time of day → **Campfire dusk · concept look**: ambient trung tính dịu, phản xạ thấp, lửa trại là điểm sáng ấm chính.
  Preset này có **sương thấp** (dày sát mặt đất, mỏng dần theo độ cao: vùng chơi vẫn rõ, phía xa chìm vào bóng tối ấm) và **vignette 0.7**.
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
  cây bụi `--prefix shrub --layout top`. Trong scene: lều nhỏ trong vòng palisade quay về lửa trại, lều lớn thành trại hai bên
  khung camera; cây bụi (instanced, lay theo gió) dày ở bờ suối, dọc hàng rào và chân lều. Hàng rào nối dọc đường (xen đoạn gãy/đổ, khoảng hở),
  vòng palisade kiểu trại Rogue sau lửa trại, cọc lẻ và khúc gỗ chắn đường; tất cả gộp chung draw call với props khác.
- **Texture forge**: các bộ texture PBR lát gạch (gạch đá, đá cuội, đất, cỏ, gỗ, sắt, đá phong hoá, và 3 lớp terrain: đất khô, đất ướt, cỏ nhìn từ trên) được *nướng* từ công thức GLSL
  trong `src/shaders/forge/`. Sửa công thức khi đang chạy `npm run dev` → texture nướng lại ngay.
- **Act I · Weeping Fields (colour rules)**: map kiểm tra bộ quy tắc màu gameplay & môi trường của The Dying Gods — xem mục 7b.

---

## 7b. Map Weeping Fields — kiểm tra bộ quy tắc màu

Scene **Act I · Weeping Fields (colour rules)** dựng khu Weeping Fields đúng như bộ quy tắc ghép: *Valdren Core Kit*
làm nền, *Redbound* + *Blightbeasts* ở những chỗ có lý do sinh thái. Báo cáo số liệu: `art-direction/13_KIEM_TRA_QUY_TAC_MAU_GAMEPLAY.md`.

**Bố cục** (camera game nhìn từ đông-nam, nên công trình cao đứng ở phía bắc/tây):

| Khu | Nội dung | Quy tắc minh hoạ |
| --- | --- | --- |
| Trang trại (giữa-bắc) | Hai nhà cùng một bản dựng: nhà thường (tây) và nhà bị thần huyết xâm thực (đông) — mái trước sập, cửa bị giật, sàn thủng, mạch huyết đi từ giếng → dưới móng → trồi qua sàn → leo theo vết nứt tường | II.2: giữ màu vật liệu gốc, khác biệt đến từ biến dạng có hướng |
| Giếng thần huyết + tổ Redbound nhỏ | Lều da chắp vá, lán ghép từ ván hàng rào, cọc xương có sọ thú và vòng xương, cờ vải đỏ rách (lay theo gió), xương, liềm gỉ, xe kéo cháy; dấu tay đỏ, vết cào; trống xương báo động, cột cộng hưởng (tim đập theo nhịp Bellwether), túi huyết, ổ phục kích | III.1, VI |
| Chuồng (bắc) | Chuồng gia súc bị chiếm, rào gãy, một cánh cửa bị giật | III.1 |
| Đồng ruộng (tây) | Luống đất, gốc rạ, tường đá khô, đống rơm, bù nhìn | Valdren core |
| Đồng cỏ (đông) | Bãi rêu phẳng cho bài test "12 Redbound" | VII |
| Hang sói, xác bò, quạ (đông-bắc) | Đá, hốc tối, khúc gỗ đổ, xương mồi, lông rụng, đường thú chạy, chỗ lợn rừng ủi đất — không cọc xương, không bàn thờ | III.3 |
| Đường chính + ven đường | Đường sáng hơn nền (không phát sáng), hàng rào gỗ xám, miếu ven đường, waypoint, cột đèn, biển chỉ đường | II.2, VI |

**Bảng màu Valdren**: mỗi vật liệu được *khoá màu* — texture giữ chi tiết, màu trung bình được dời về đúng swatch
(`src/env/valdren.js` → `VALDREN`, `DECOR`). Lớp terrain (đất, bùn, cỏ) cũng được khoá; tắt *Palette lock* trong
*Terrain layers* để so với texture gốc. Đất nhiễm huyết là kênh **B** của splat (đỏ-nâu tối, giữ độ sáng của nền, có
vân mạch), vẽ thêm bằng cọ *Blood-soaked (Remnant)*.

**Environment → Rules · màu & khả năng đọc**:

- Bảng swatch Valdren, 6 màu chức năng, thang nổi bật I.3.
- **Góc kiểm tra (checklist)**: tổng quan, *đồng cỏ + 12 Redbound*, *Redbound trên nền nhiễm huyết*, *nhà thường ↔ nhà
  bị xâm thực*, *tổ Redbound*, *Blightbeasts*, *điểm tương tác*, *bảng mẫu màu*. Camera đặt đúng góc ¾ của game.
- **Readability check view**: cùng lựa chọn với tab Post & camera (thang xám, deutan, protan, tritan).
- **Class view (VI)**: phủ màu theo loại vật thể — vật cản (xám), phá huỷ được (xanh ngọc), tương tác (ngà), nguy hiểm
  (cam). Ổ phục kích (nguy hiểm) tách hẳn khỏi đống rơm (vật cản).
- **Telegraph demo (I.5)**: Brute slam (đồng cỏ), Vessel burst (giếng, làm nổ túi huyết bên cạnh), Piercer volley (đường
  thẳng ra phía đường), Disease cloud (hang sói). Ranh giới vùng đòn luôn là màu *Nguy hiểm* + vạch chỉ vào tâm (đọc được
  không cần màu), phần lấp đầy mang màu chức năng của kỹ năng và lan dần theo thời gian chuẩn bị, độ phủ ≤ 45%.
- **Bảng mẫu 6 màu** trên cỏ: chip đặc ở giữa (đúng hex trên màn hình), vùng phủ mờ (một vùng đòn trông ra sao trên cỏ),
  viền highlight, nhãn tên + mã.
- **Interact glint**: miếu, waypoint, rương ở nhà thường lóe viền ngà và hiện vòng dưới đất khi nhân vật lại gần.
- **Màu tín hiệu = đúng hex trên màn hình**: decal tín hiệu được bù qua exposure / grade / tone mapping hiện tại
  (`src/core/displayMatch.js`) để màn hình hiện đúng hex; bảng *Tín hiệu qua tone mapping* bên dưới cho biết hex đó nếu
  vẽ thẳng sẽ thành màu gì (ΔE). Với AgX, Nguy hiểm `#E66A39`/`#FFB16B` nằm ngoài gam — chỉ đạt gần đúng.
- **Stand-in Redbound**: 12 con trên đồng cỏ, 6 con trên nền nhiễm huyết — Groveling (đỏ gạch, nhỏ, gù) ≈ Scavenger,
  Shaman ≈ Bellwether, Pit Fiend tắt vết nứt dung nham và nhuộm đỏ đô ≈ Brute; mỗi con thứ tư đi vòng (chuyển động đọc
  trước màu). Chỉ để kiểm tra **màu/độ sáng trên nền**, không phải silhouette thật của Redbound.

**Remnant corruption**: độ đậm đất nhiễm huyết, màu nhuộm, màu vân mạch, mạch 3D, nhịp sáng của giếng (môi trường:
rất nhẹ). **Lighting** (khi không bật mood): *Overcast · neutral palette check* (mặc định, duyệt màu dưới ánh sáng trung
tính), *Dusk · weeping fog*, *Night · light radius (D2R)*; *Burning cart* (lửa xe kéo — ca "quái đỏ dưới ánh lửa"),
*Lanterns ×*. Mood Act I của tab Lighting cũng dùng được.

**Chơi thử**: tab Character → ▶ Play với lõi gameplay v1 — điểm xuất phát ở đường cạnh waypoint, nhà và vật cản chặn
lưới nav, phím **N** sinh bầy quái gần nhân vật.

---

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
src/core/       thiết lập, renderer, asset, camera, grading, LUT + readability check, khớp màu hiển thị, đăng ký shader
src/lookdev/    chế độ xem, vật tham chiếu, trình chỉnh texture
src/effects/    lược đồ hiệu ứng + bộ điều khiển phòng thí nghiệm shader
src/env/        texture forge, bộ kit Act I, lửa, terrain splat; valdren.js (bảng màu + khoá màu + kit Valdren / Redbound /
                Blightbeasts), signals.js (telegraph, vòng tương tác, bảng mẫu màu)
src/lighting/   rig studio, preset mood Act I (moods.js), bộ điều khiển mood (hero light, rim, mưa, chớp)
src/panels/     mỗi tab một file
src/procedural/ nhân vật dựng bằng code (hero, quái, NPC): rig, nặn SDF, clip, dữ liệu bake, catalog cho lab
src/scenes/     studio, nghĩa địa, hầm mộ, đồng hoang, Weeping Fields (map quy tắc màu)
src/shaders/    mọi file .glsl (sửa là nạp lại ngay)
src/vfx/        hệ hạt, đèn dùng chung, hình nộm, skill, VFX lab
```

Giấy phép tài nguyên bên thứ ba: [THIRD_PARTY_LICENSES.md](../THIRD_PARTY_LICENSES.md).
