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
- **Cột phải:** 8 tab — Lookdev, Character, Lighting, Post & camera, Shaders, VFX, Environment, Performance.

**Phím tắt:** `H` ẩn/hiện giao diện · `F` căn camera vào model · `V` đổi chế độ xem · `X` false colour phơi sáng ·
`T` bàn xoay · `P` chụp ảnh PNG · `C` so sánh A/B · `Esc` bỏ chọn · `?` trợ giúp · `1–9` chọn + tung skill (khi VFX lab bật
hoặc đang Play) · **chuột phải**: tung skill đang chọn (giữ để lặp). Khi gameplay đang chạy, phím của game được ưu tiên
(chế độ *modern*: `Q E Z X` là bình thuốc nên `X` không bật false colour nữa).

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

1. Chọn model mẫu ở cột trái (Shader Ball, Lantern, **D2R Sorceress** có animation…) hoặc kéo thả model của bạn.
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

Chọn nhân vật (**D2R Sorceress** — giáp nhẹ / vừa / nặng, nhân vật mẫu duy nhất của lab — hoặc **file GLB của bạn**, một file có đủ clip),
bấm **▶ Play** (`Enter`). Nhân vật chạy trong cảnh đang mở (studio hoặc các cảnh Act I), camera bám theo.

| Điều khiển | Tác dụng |
| --- | --- |
| `W A S D` / mũi tên | Đi theo hướng camera · `Shift` đi bộ · `R` đổi chạy ↔ đi |
| Click chuột trái (giữ để đi liên tục) | Đi tới chỗ click; click hình nộm → tiến lại đánh |
| `Space` / `J`, `E` | Đánh, đánh 2 (đá / đâm) · `Shift`+click: đánh tại chỗ |
| `Q` / chuột phải (giữ để lặp) | Thi triển spell / skill đang chọn của tab VFX tại con trỏ (hình nộm dưới con trỏ thì nhắm thẳng nó, không có con trỏ thì bắn thẳng phía trước). Bấm lúc đang bận bị giữ lại 0,3 s; hết cooldown / đang cast sẽ báo trên màn hình. Không cần mở tab VFX: cast tự bật VFX lab |
| `1`–`9` | Chọn + tung spell (hoặc skill khi castbar ở chế độ skills) |
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
- **Equipment:** tay phải / tay trái — vũ khí có sẵn trong model, 14 vũ khí/khiên KayKit (thư viện trang bị),
  hoặc file GLB của bạn. **Grip:** gizmo di chuyển / xoay ngay trong khung nhìn, scale, *Copy grips JSON* để dùng trong
  game. Đổi vũ khí tự đổi tư thế (ví dụ rìu 2 tay → idle/đánh 2 tay).
- **Foot sliding:** tốc độ "tự nhiên" của clip walk/run được đo từ bàn chân chạm đất. *Animation follows speed* bật thì
  tốc độ phát clip theo tốc độ di chuyển (không trượt); tắt thì clip chạy đúng tốc độ gốc → dấu chân **xanh** (giữ chân),
  **vàng** (trượt nhẹ), **đỏ** (trượt rõ). *Set speeds = animation speeds* đặt tốc độ game bằng tốc độ của clip.
- **Scale reference:** dãy mốc cạnh nhân vật — thước 3 m, người 1,8 m, quái nhỏ (Fallen) 1,1 m, quái lớn 2,6 m, boss
  3,8 m, cửa 2,4 m, cây 6 m, lưới 1 m, nhãn chiều cao (đổi số = đổi quy chuẩn, 0 = ẩn). *Character height* chỉnh
  chiều cao nhân vật; *Model forward* nếu model không quay về +Z.

Thư viện vũ khí/khiên KayKit (CC0, Kay Lousberg, `kaykit-props.glb`) được giữ để trang bị cho Sorceress; các nhân vật KayKit, Fox, Robot và thư viện animation riêng của chúng đã được gỡ khỏi lab.

**D2R Sorceress** (nhóm *Character* ở cột trái, ô *Character* của tab này): bản export LOD 3 của `characters/player/sorceress` (D2R, bản quyền Blizzard,
chỉ để test nội bộ — không phát hành kèm file build). File gốc `sorceress.glb` (33 MB) chứa cả 3 bộ giáp chồng lên nhau, 2 kiểu mũ và 229 clip;
`scripts/prepare-sorceress.py <sorceress.glb>` tách thành `d2r-sorceress[-medium|-heavy].glb` (mỗi file 1 bộ giáp + đầu/tóc, ~1,3 MB) và **một thư viện
animation chung** `d2r-sorceress-anims.glb` (52/229 clip, 4,7 MB). Cao 1,75 m, quay về +Z (không cần *Model forward*), 181 xương, texture 256 px
(không có tint màu của game). Tên clip giữ nguyên của D2 theo dạng `<tư thế>_<hành động>`; lab ghép trạng thái → clip theo **tư thế vũ khí**:

| Tư thế (Equipment / *stance*) | Tiền tố clip D2 | Clip có |
| --- | --- | --- |
| Tay không (mặc định, không cầm gì) | `hth_` | neutral, walk, run, attack1, attack2, cast, gethit, block, kick, death, townneutral, townwalk |
| 1 tay / song kiếm | `1hs_` | neutral, walk, run, attack1, attack2, cast, gethit, block, kick |
| 2 tay | `2hs_` | như trên |
| Nỏ 2 tay (bow) / nỏ 1 tay (xbw) | `bow_` / `xbw_` | neutral, walk, run, attack1, cast, gethit, kick |
| Pháp sư (staff) | `stf_` | neutral, walk, run, attack1, attack2, cast, gethit, kick, townneutral, townwalk |

Idle = `*_neutral`, đánh = `attack1`, đánh 2 = `attack2` hoặc `kick`, phép = `cast`, trúng đòn = `gethit`. Death chỉ có bản tay không (`hth_death`); mọi
tư thế khác dùng lại clip tay không cho trạng thái thiếu. Không có clip jump / dodge / revive / block hit trong bản export nên các phím đó không làm gì.
Muốn tư thế gậy pháp sư: đặt *Stance* = Spellcaster ở tab Character (tay không là mặc định vì model không cầm vũ khí).

### Gameplay · Ashen Crown v1

Khi bật **Play uses the v1 gameplay core** (mặc định bật), nút **▶ Play (Enter)** chạy lõi gameplay của dự án
Ashen Crown v1 (`src/gameplay/`, chép từ `src/game/` của v1) trên scene và nhân vật đang preview:

- **Điều khiển như v1:** chuột trái đi theo đường A* trên lưới nav (giữ chuột để lái), bấm vào quái để đánh (giữ
  chuột để đánh liên tục), **Shift + chuột trái** đánh tại chỗ, **chuột phải** dùng kỹ năng đang chọn tại quái / điểm
  đất dưới con trỏ (**giữ** để lặp; bấm lúc đang cast được giữ lại 0,3 s; hết mana hay chưa hồi cooldown thì chữ báo hiện
  trên đầu nhân vật), **R** đi bộ / chạy, **N** sinh một pack, **Enter** hồi sinh khi chết, **Esc** thoát.
- **Phím chọn skill** (thư mục Gameplay → *Hotkeys*): *Classic* (mặc định) **F1–F8** chọn skill cho chuột phải, **1–4** là bình
  thuốc; *Modern* **1–4** chọn skill, **Q E Z X** là bình thuốc. *Quick-cast* bật thì phím chọn skill cũng tung luôn tại con trỏ.
  Gõ trong ô nhập, Ctrl/Alt/Meta + phím (Ctrl+1, Ctrl+F5…) không bao giờ tung skill.
- **Quái:** chỉ số, pack (thường, champion, unique kèm minion và modifier), AI (aggro theo tầm nhìn, cả pack cùng
  lao vào, imp bỏ chạy, cung thủ giữ khoảng cách, shaman hồi sinh đồng bọn) và công thức đánh trúng / chặn / kháng
  đều giữ nguyên của v1. Chọn loại quái, kiểu pack, số lượng và level trong thư mục **Gameplay · Ashen Crown v1**,
  hoặc bật **Endless waves** để quái tự kéo đến.
- **Kích thước:** nhân vật đang preview (Sorceress hoặc GLB của bạn) được đưa về **1,8 m**
  (*Hero height*) trong lúc chơi rồi trả lại khi thoát. Quái giữ chiều cao thật của v1 (zombie 1,72 m, skeleton
  1,85 m, imp 0,92 m, Pit Fiend 2,6 m…) nên tỉ lệ với nhân vật đúng như trong game.
- **Chỉ số nhân vật:** theo class (mặc định Sorceress; có thể đổi sang Barbarian / Necromancer trong thư mục Gameplay) và level,
  theo công thức của v1, kèm một vũ khí khởi đầu. Không có đồ, túi hay bình máu; máu và mana tự hồi chậm.
- **Kỹ năng chuột phải**: ở **WebGL2 · GLSL** dùng hệ kỹ năng three.quarks của tab VFX (đủ VFX). Ở **WebGPU** quarks không chạy
  được (nó dựng `ShaderMaterial` GLSL) nên 7 skill của Sorceress — Fireball, Frozen Orb, Chain Lightning, Meteor, Blizzard,
  Fire Wall, Teleport — chạy bằng bản dự phòng `src/gameplay/nativeSkills.js` (cùng số liệu từ `skills.js`, hiệu ứng là mesh
  phát sáng đơn giản, sát thương qua mô hình v1); các skill còn lại (Necromancer / Paladin) báo rõ "cần WebGL2 · GLSL" thay vì im lặng.
  Chuột trái vẫn đánh bình thường.
- **Lưới nav:** ô 1 m, loang từ điểm xuất phát trên collision của scene (bước cao tối đa 0,6 m, có tường hoặc đạo cụ
  thì chặn), trong vùng 128 × 128 m. Đổi scene khi đang chơi thì lưới dựng lại và trận đấu bắt đầu lại.
- Trong lúc chơi, hình nộm và castbar của tab VFX tạm tắt (để không giành chuột phải), rồi được bật lại khi thoát.

### Tương tác môi trường — dấu chân, nước, cỏ (khi Play)

Thư mục **Environment interaction** của tab Character (bật mặc định, cường độ 1.0; hoạt động ở cả hai lõi Play — controller của lab và lõi Ashen Crown v1 — và ở WebGL2 lẫn WebGPU). Khác với **Foot-slide marks (debug)** ở thư mục *Foot sliding* (chấm xanh/đỏ đo trượt chân).

- **Khi nào có bước chân:** mỗi sải chân thật (một chân/ nhịp, trái–phải xen kẽ) khi nhân vật đang đi/chạy; ưu tiên thời điểm bàn chân chạm đất đọc từ xương chân của rig khi chúng đáng tin, nếu không thì đếm theo quãng đường đã đi (có giới hạn nhịp). Đứng yên, cọ vào tường, đang đánh/trúng đòn/chết, teleport hoặc khung hình giật đều **không** sinh dấu; dấu cũ giữ nguyên chỗ cũ, không nối xuyên bản đồ.
- **Mặt đất đọc từ dữ liệu của chính scene** (`scene.surfaceAt`, `src/env/surfaces.js`), thứ tự ưu tiên: **nước > đường > bùn (ướt) > cỏ > đất**. Dấu chân hình đế giày, xoay theo hướng đi, đặt theo độ dốc, mờ dần theo thời gian: đất (24 s), bùn (34 s, đậm nhất), cát, tuyết, bụi/tro, cỏ (ép cỏ, 9 s), đất nén (mờ, 7 s). Đá và ván gỗ không để lại gì khi khô, chỉ một vết ướt vài giây khi sàn ướt hoặc ngay sau khi bước ra khỏi nước.
- **Nước thật** (không có vũng vẽ khắp nơi): hai vòng sóng nở ra đúng trên mặt nước, vài giọt bắn; không bao giờ đóng dấu xuống đáy. Bước vào nước có một đợt bắn lớn hơn, bước ra thì giày ướt (dấu đậm hơn trong ~2 s).
- **Cỏ / cây bụi / sậy:** vật liệu dùng hiệu ứng *Vertex wind* (cỏ khối, tuft, cỏ thẻ, bụi cây, sậy bờ nước) nghiêng ra khỏi thân và chân nhân vật rồi đứng dậy trong ~1,6 s (tham số **Foot bend** của hiệu ứng; cây thân gỗ để 0 nên không uốn). Tối đa 8 điểm đẩy dùng chung, shader bỏ qua khi không có điểm nào. **Lớp cỏ "shell" của terrain (cỏ phủ nền) không bị đẩy** — chỉ có dấu chân ép cỏ.
- **Giới hạn cố định:** 48 dấu, 14 sóng, 28 hạt (tái dùng cái cũ nhất), không đổ bóng, không texture, không pass phụ; tắt công tắc là không chạy gì. Đổi scene, thoát Play, tắt tính năng hoặc teleport sẽ xoá sạch.

Scene hỗ trợ: **Dark Wood (Immortal / D2)** — đất, bùn (kênh ướt của splat), cỏ (kênh cỏ), đường lát đá cuội = đá; **Bố trí biome** — như trên, đường đất nén theo bề rộng từng đường, suối + ao của plan là nước nông (ford = nước), không có tuyết/cát; **Biome mix** — theo trọng số 31 layer của từng ô (tuyết, cát ướt, tro, ván, đá, đất, bùn, cỏ…) và ao của mẫu "Đồng cỏ & bờ nước" là nước; khoảng trống giữa các ô không có gì; **Dungeon** — hầm mộ (đá, bụi, đá ẩm) và hang (bụi phấn, bùn sét, đá, ván), hồ ngầm là nước. **Studio** không có dữ liệu mặt đất nên không hiện gì.

Kiểm tra không cần trình duyệt: `npm run test:footsteps` (nhịp bước, plant, teleport, bề mặt/ưu tiên/ranh giới, pool, dọn dẹp). Đọc nhanh khi chơi: ô *Environment interaction* hiện bề mặt dưới chân, nguồn bước (cadence/plant) và số dấu/sóng/hạt đang sống; `__LAB__.app.footsteps.info()` trả cùng số liệu.

## 3b. Chỉnh texture của asset đang chọn

Có ở tab **Character** (*Textures*: nhân vật, món tay phải / trái, hoặc mesh vừa click) và tab **Lookdev** (*Selected
material → Textures*).

- **Ô texture:** ảnh thu nhỏ từng map (Base colour, Emissive, Normal, Roughness, Metalness, AO, Opacity, Height), xem lớn
  có lưới UV của mesh; **Replace…** (PNG/JPG/WebP), **+ Add map…** cho ô trống, **Export PNG**, **Reset**, **Remove**,
  **Make unique to this mesh** (tách material dùng chung giữa các mesh).
- **Adjust:** map màu — hue, saturation, brightness, contrast, gamma, tint; map dữ liệu — levels đen/trắng, invert (theo
  đúng kênh: roughness = G, metalness = B, AO = R nên map ORM không hỏng kênh khác); normal — đảo kênh G (DirectX ↔
  OpenGL), độ mạnh. **Only "…" UV area**: chỉ chỉnh vùng UV của mesh đang chọn — hợp với texture atlas (ví dụ đổi màu
  một món đồ mà không đụng phần khác).
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
  Trên WebGPU (không có three.quarks) chuột phải / `Q` tung **spell** đang chọn thay cho skill và báo một lần.
- **Play mode**: click chuột trái lên mặt đất để model đi tới, camera bám theo; click hình nộm hoặc chuột phải để tung skill.
  Model có animation (D2R Sorceress) tự đổi clip đứng / chạy / đánh.
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
  *Painted* dùng 3 ô texture cắt từ concept `legacy/art-direction/reference/moor_campfire_terrain_concept.png`
  (bùn + vũng nước, cỏ lá, đất xen cỏ) — làm lại bằng `python -I scripts/prepare-terrain-swatches.py <ảnh>` (cắt, làm seamless, phóng 512 px,
  tách heightmap, nhận diện vũng nước); normal/ORM được dựng trong trình duyệt từ heightmap. *Procedural* dùng 3 công thức forge.
  *Painted tiles* dùng 3 tile riêng trong `legacy/art-direction/reference/terrain-tiles` (transition → đất khô, mud → đất ướt, grass → cỏ),
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

Quy chuẩn đầy đủ: `legacy/art-direction/12_QUY_CHUAN_QUAI_CANH_QUAN_CONG_TRINH.md` §4.6–4.12. Xem kết quả ở map **Bố trí biome** (mục 7h): góc camera theo khu vực (trang trại, trại địch, hang sói, nghĩa địa…) và các overlay giải thích.

- **Cỏ:** mảng mật độ lớn, cụm 3–7 bụi lệch tâm, rìa thấp hơn; màu khô/ẩm gần nhau trong cụm. Mỗi bụi và grass card đều kiểm tra đường, lối thú đi, nước, dốc, đất nhiễm huyết, footprint và vùng tiếp cận. Arena chỉ có cỏ ngắn, thưa. Ruộng giữ hàng gốc rạ đứt đoạn.
- **Prop:** đồ nông trại bám trục nhà, đồ trại hướng vào chỗ sử dụng; footprint tính theo scale và bao được các góc sau xoay. Chừa cửa, lối vào trại và khoảng đứng tương tác; không đủ chỗ thì bỏ. Đá và cây giữ footprint để cỏ không xuyên chân.
- **Đuốc:** 5 vị trí dự kiến tại lối đến miếu, ngã rẽ vào trại, ngã rẽ đường thú, khúc cua đông và lối vào trại. Đặt ở vai đường; không đặt trên đường thú. Dùng ngọn lửa chung, đèn nhỏ không đổ bóng; nếu vị trí không hợp lệ thì không ép đặt.
- **Xương:** cụm ở khu xử lý thịt và cạnh xác/miệng hang; mảnh nhỏ lệch theo một hướng, không rải đều quanh giếng hay suốt lối thú đi. Thiếu kit hoặc đống xương quá lớn thì thử mảnh procedural tại cùng điểm, vẫn giữ các vùng cấm.
- **Đá, cây, xác quái (kit tự nhiên, Tripo từ sheet 08–12):** đá thành **cụm** — một tảng chính và 1–3 tảng nhỏ lệch về một phía, chìm ~15% và nghiêng theo dốc, giữa các cụm có khoảng đất trống; đá rêu ở chỗ ẩm/bờ suối, tảng cao/phiến dài ưu tiên phía bắc (phía sau màn hình). **Cây khô** có gió; cụm **cây cháy** quanh lều cháy; vài cây có gỗ đổ bên cạnh (gốc, thân đổ, cành, rễ, bụi gai). **Xác quái** đặt theo sự kiện: miệng hang sói (xác thú + quỷ lùn cũ), dốc phía bắc (2 quỷ lùn), bờ suối (quái có vỏ), mép ruộng (1 xác giơ tay) — nằm theo dốc, chìm nhẹ, đất dưới xác được tô trơ và ẩm, không có collision. Model Tripo đã bỏ đĩa bùn của concept để chân vật thể nối vào chính terrain. Kit và cách tách: `scripts/prepare-nature-kits.py` (model nguồn trong `legacy/tripo-models/nature/`; hàng dưới của sheet 10–12 được ghép thành ảnh một hàng và dựng lại vì Tripo hay bỏ các hàng dưới của sheet nhiều hàng).
- **Điều chỉnh:** `Grass density` điều khiển bụi/gốc rạ; `3D grass along edges` điều khiển grass card riêng. Đưa **cả hai** về 0 để tắt toàn bộ cỏ 3D. Rebuild cùng thiết lập giữ bố trí ổn định. Các ngưỡng theo mét nằm trong `src/env/biomePlacement.js`; điểm đặt nằm trong plan mẫu `src/env/biomeLayoutDemo.js`.

Chạy `npm run test:cast` để kiểm tra chuỗi nhập → tung skill thật (chuột phải / Q / phím chọn skill, giữ, đệm, cooldown, mana, WebGPU dự phòng; không cần trình duyệt); `npm run test:placement` để kiểm tra mask/vùng tiếp cận/khoảng cách gốc cỏ; `npm run check` để kiểm tra bundle và shader. Duyệt hình ảnh ở Night + Overcast, cả WebGL2 và WebGPU. Bộ quy tắc này do engine `biomeLayout` áp dụng (map Bố trí biome); map Dark Wood giữ bố cục riêng.

#### Thuật toán bố trí asset tổng quát (`biomeLayout`)

Cùng bộ quy tắc, nhưng viết thành **một engine dùng cho mọi biome**, không phụ thuộc three/DOM: `src/env/biomeLayout.js`. Nó nhận *plan* (đường, nước, cửa, vùng tương tác, spawn, arena, khối chính, vật chủ, sự kiện, hàm đất) và đặt asset theo đúng thứ tự §4.6 — khóa vùng chơi → khối lớn → cụm chức năng → dẫn đường → sinh thái → dấu vết → kiểm tra — rồi trả về `placements`, lớp cỏ (`ecology`), `groundPaint`, vùng cấm, điểm quyết định và `report` (số lượng, mục bị bỏ kèm lý do, cảnh báo, kết quả các kiểm tra §4.12). Mỗi mục thử tối đa 12 vị trí trong bán kính cố định; không vừa thì bỏ và ghi lại. Mỗi nhóm có seed riêng (`options.seeds`: `mass`, `cluster`, `guide`, `ecology`, `trace`) nên đổi seed một nhóm không xáo phần đã đặt trước đó. Giải thích đầy đủ, bảng mét và nguồn từng con số: `legacy/art-direction/12_QUY_CHUAN_QUAI_CANH_QUAN_CONG_TRINH.md` §4.13. Scene 3D xem kết quả có ở mục **7h** (lab → "Act I · Bố trí biome (thuật toán)"); ngoài ra có plan mẫu, kiểm thử và ảnh duyệt 2D.

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

**Mặc định TẮT** (tốn máy): khi tắt không bake khe, không patch shader, không chụp đất và không cấp texture capture; lần đầu bật
trong scene đang xem mới chạy bake + patch + biên dịch capture (giật một nhịp). Thiết lập cũ đang bật (phiên bản 2) được tắt
một lần, giữ nguyên các thông số khác; bật lại thì được nhớ. Tắt sau khi đã bật chỉ đưa cường độ về 0 (patch vẫn nằm trên
vật liệu dùng chung, xem `activate()`); tải lại trang để bỏ hẳn.

Điều khiển: Environment → Scene options → **Ground blend · asset ăn vào đất** — bật/tắt (sau lần bật đầu thì tức thì, không biên dịch lại), *Xem vùng
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

`src/scenes/biomeLayout.js` — scene id `biomeLayout`, "Act I · Bố trí biome (thuật toán)". Đây là **bản nhìn 3D của engine** `layoutBiome()` (`src/env/biomeLayout.js`, legacy/art-direction/12 §4.13): scene chạy engine trên plan mẫu `src/env/biomeLayoutDemo.js` (128 × 128 m, đủ 7 vùng con) rồi vẽ kết quả bằng kit thật, để bạn **duyệt bố cục từ camera game** và xem **vì sao** mỗi thứ nằm ở chỗ đó. Dựa trên `TerrainScene` (splat đất, ruy-băng, cỏ shell, brush, ground blend, gió, shadow fill); mở ở góc chơi D2 (isometric 2:1, cao 12 m) ban đêm, có hero đứng cạnh để đọc tỉ lệ.

**Map vẽ gì (đều từ kết quả engine, không có toạ độ đặt tay):**
- Mặt đất = hàm `ground()` của plan — chính hàm engine dùng để đặt đồ (lúc tải scene tự kiểm tra **hai chiều**: placement lệch > 2 cm so với điểm thấp nhất dưới footprint trừ độ lún — nổi hay chìm — thì báo trong console và trong báo cáo). Đường, lối mòn thú, suối, ao lấy từ `plan.paths` / `plan.water`; `groundPaint` (đất trần/ẩm dưới dấu vết, chân prop) tô vào splat; lớp cỏ của splat (và cỏ shell) theo thảm cỏ `ecology.carpet` nên cỏ dừng ở hành lang, footprint, nước.
- `placements` → đạo cụ kit gộp theo **class** (cản · phá được · trang trí đi xuyên · dẫn đường · tương tác · nguy hiểm), chia ô GPU (`cells`, mặc định 16 m); cây (`deadTrees` / `burnedTrees`) là instance có gió, solid. Khối tự dựng của plan dựng theo `kind`: `building` = Valdren `house` / `barn` (đỉnh mái đo lại rồi chỉnh đúng `p.y + height` của plan, trừ phần sàn nâng lên, để vùng che camera khớp; mảnh cửa bị xé nằm trên mặt đất trong hành lang cửa thì bỏ — lối đi plan giữ trống thì trống); `cliff` = các tảng đá **nằm trong footprint** (bán kính ≤ 0,95 nửa bề sâu, đỉnh cao nhất chạm `p.y + height`, cao thấp trôi dọc dải); `den` = `wolfDen`, `carcass` = `carcass`, co theo footprint / height và hướng miệng (+z cục bộ) theo `yaw` của khối (khối có `collision: false`, như xác trong plan mẫu, là **đồ trang trí đi xuyên**: class `decor`, nằm trong nhóm không solid, hiện màu decor ở class view); bệ waypoint (tương tác tên `waypoint`); loại chưa biết → khối giữ chỗ + cảnh báo console.
- `ecology.tufts` (vị trí, cao, tông, loại: cỏ / hàng ruộng / bờ nước / dải giữa vệt bánh / chân prop) → cỏ instance; `ecology.shrubs` → bụi kit; thẻ cỏ 3D đặt trên các tuft cao ≥ 0,2 m (nên cũng tuân thủ mọi vùng cấm).
- Mọi placement có `light` → ngọn lửa + point light nhỏ **không đổ bóng** (WebGPU chỉ có 16 sampler ở stage fragment của terrain: chỉ ánh trăng có shadow map). **Mọi point light của plan được tạo ngay lúc tải** (số đèn nằm trong khoá program của mọi vật liệu lit: thêm đèn sau là biên dịch lại tất cả); ở chế độ `modules` đèn ban đầu tắt và ngọn lửa của nó xuất hiện cùng module chứa nó.
- **Map chia thành module 16 m** (legacy/art-direction/12 §4.14, `src/env/mapModules.js`): mỗi placement, bụi, tuft, vệt đất, đèn thuộc đúng một module; chế độ tải `modules` chỉ tải **kit của vòng 0** (các module cách điểm xuất phát ≤ 20 m = màn hình đầu + 4 m chạy) trước khung hình đầu, rồi dựng phần còn lại theo khoảng cách, mỗi khung ≤ 4 ms (`src/env/mapStream.js`). Layout và splat lấy từ cache trình duyệt / file bake khi khoá khớp (`src/env/mapCache.js`, `npm run bake:map`) nên không chạy lại engine.

**Environment tab → "Bố trí biome · thuật toán":**
- **Góc camera:** *Góc chơi D2* (mặc định), *Tổng quan cả map*, rồi từng khu vực ở hai dạng — game ¾ (trang trại **gồm cả ruộng**, trại địch, hang sói, nghĩa địa, sườn đá phía bắc, suối + đường) và **góc chơi D2** (…Play: iso 2:1 trên khu đó). Toạ độ các view tính từ `plan.zones` / hosts / giao điểm đường–suối. Camera luôn nhìn vào tâm khu vực, còn **hero đứng ở chỗ trống gần nhất** (ngoài mọi footprint cản + 0,7 m, cách mảnh đi xuyên — mũi tên, mũ, xác — ≥ 0,3 m, ngoài nước; ưu tiên trong hành lang cửa gần đó — vd. cửa hang) nên không bao giờ đứng trong khối đá/nhà; đổi seed khối thì chỗ đứng tự tính lại. **Class view** tô màu theo class (như Weeping Fields) kèm chú giải.
- **Overlay giải thích** (từng cái bật/tắt, vẽ ôm theo địa hình): 1 · play space (hành lang đường + dải `pathClear`, hành lang cửa, vùng tương tác / spawn / arena, nước + bờ) · 2 · footprint OBB theo class (bụi cây mờ) · 3 · use zone (vùng thao tác phải trống) · vùng **che camera** (footprint kéo dọc hướng nhìn) · 4 · điểm quyết định (fork / gate / bridge / bend, bán kính marker, cột dựng, đường nối tới marker) · 3 · cluster (vật chủ, bán kính, đường tới từng thành viên, `đặt/yêu cầu`; nếu sửa nhịp kích cỡ thêm thành viên thì ghi `yêu cầu +N repair`) · 6 · trace (mũi tên nghiêng, nan quạt, mảnh phụ; sự kiện bị bỏ màu đỏ) · **Drops** (✕ + bước · lý do · chi tiết). Nhãn trên mặt đất tự trượt để không chồng lên nhau.
- **Nâng cao · seed nhóm & mật độ** (thư mục thu gọn; map sinh từ một seed xem "Sinh map từ một seed" ở cuối mục này): seed gốc của plan demo (`plan.seed`) và một seed cho mỗi nhóm (mass, cluster, guide, ecology, trace), mật độ cỏ / bụi / dấu vết / khối lớn; nút *Đổi cả 5 seed nhóm* và *Seed mặc định*. Đây là thông số **lúc dựng**: đổi xong map tự tải lại (đổi tại chỗ làm WebGPU vẽ đen). Thử: đổi seed ecology → khối, cụm, đuốc không nhúc nhích, chỉ cỏ/bụi đổi; đổi seed trace → chỉ dấu vết và cỏ bị gỡ dưới chúng đổi.
- **Module & tải nhanh** (thư mục con, thông số lúc dựng → đổi là tải lại trang): *Chế độ tải* — `modules` (mặc định: kit vòng 0 trước, còn lại tải dần) hoặc `all` (mọi kit + mọi module trước khung đầu, như trước đây — để so A/B); *Dùng cache map* (IndexedDB + file bake; tắt = engine và `generateSplat` chạy lại mỗi lần); nút *Xoá cache map* (xoá rồi tải lại trang để xem lần tải nguội); công tắc **Lưới module** — các ô 16 m trên địa hình kèm `id · vòng · thứ tự tải`: xanh = đã vào, xám xanh = đang chờ (mờ), **đỏ = module vi phạm một ngân sách §4.14**. Bên dưới là bảng trạng thái: nguồn layout (cache / file / engine) và ms, nguồn splat, **khung đầu** (hết `init`), kit và MB cần cho khung đầu (vòng 0) và đã tải lúc đó, số module đã vào / thời điểm vào đủ, khung hình dài nhất khi đang stream.
- **Báo cáo:** số placement theo class / bước / nhóm / vai trò, sinh thái (số tuft theo loại), cluster / trace, **ms từng bước**, seed, mật độ, kiểm tra y (nổi / chìm); **các kiểm tra §4.12 (19)** ✓/✗ (rê chuột xem chi tiết); **kiểm tra §4.14 (`module-*`)**: ngân sách kit / mảnh / đèn / tuft mỗi module, kit và MB của vòng 0 và của cả map, mỗi vật thuộc đúng một module, cỡ file bake — kèm bảng thời gian từng module (kit chờ · dựng · chờ khung); **Drops** gom theo lý do — **bấm một dòng** để camera bay tới đó và bật overlay Drops; cảnh báo của engine.
- **Lighting:** Night (ánh sáng D2, mặc định) · Overcast (ánh sáng trung tính để đọc màu) · Dusk; công tắc *Đèn của plan*. Bóng trăng đi theo tâm camera (±34 m, rộng hơn khi camera xa).
- Phần còn lại như map Dark Wood (cùng lớp cơ sở `TerrainScene`): lớp terrain, khí quyển, brush (vẽ tay lên splat; *Regenerate from the layout* tạo lại từ engine), gió, ô instancing, ground blend.

**Cách duyệt theo checklist AD 12 §4.12:**
1. **Góc chơi D2, Night rồi Overcast** (hero ở giữa): đường chính ≥ 3 Sub đọc được, không prop nào hẹp hơn lối đi; cỏ/đá không đè lên đường; đuốc chỉ ở chỗ có quyết định. Bật *Play space* để thấy hành lang và so với thứ nằm cạnh.
2. **Class view** ở từng khu: vật cản tối/chắc, phá được và tương tác phân biệt được, trang trí không bị nhầm là vật cản. Bật *Footprint* để thấy cái nào chặn.
3. **Che camera:** bật *Vùng che* ở góc chơi trại địch / trang trại — vùng hồng không được trùm lên cửa, spawn, arena hay quá 25 % màn hình (đã là kiểm tra `occlusion` trong báo cáo).
4. **Cụm & dấu vết:** *Cluster* — mỗi cụm có nhịp lớn–trung–nhỏ, thành viên đúng công thức; *Trace* — mỗi sự kiện có 1 mảnh chính + 2–6 mảnh phụ nghiêng cùng phía, sự kiện bị bỏ có lý do trong báo cáo.
5. Mọi dòng ✗ trong báo cáo và mọi drop đáng ngờ: bấm để tới tận nơi, sửa plan / catalog (xem §7b, mục "Thuật toán bố trí asset tổng quát"), chạy lại `npm run test:layout`.

Ghi chú: terrain của map này là 128 m (lớp cơ sở `TerrainScene` cố định 120 m, nên `buildTerrain()` và splat được thay bằng bản 128 m). Có kiểm tra console trên cả WebGL2 và WebGPU; map đo ở góc chơi: ~128 draw, ~1,11 triệu tam giác (phần lớn là 10 lớp cỏ shell của terrain); WebGL2 CPU 0,8 ms · GPU 4,7 ms, WebGPU CPU 3,5 ms · GPU 1,2 ms. Plan mẫu: sàn nhà / kho nằm trên nền phẳng, sườn bắc dốc ≤ ~26° (bắt đầu sau z −54, phía sau bàn tế / lò mổ của trại) (tảng đá nằm trong footprint hàng `cliff`), nước có chút ánh xanh thép để ban đêm không thành dải đen.

**Tải nhanh: bake, cache và cách đọc số đo.** `npm run bake:map -- --seed N [--plan demo] [--kits]` chạy engine một lần và ghi `assets/maps/<plan.id>/seed-<N>.json` (layout với typed array dạng base64 + manifest module + khoá + kết quả `module-*`) cùng một dòng trong `assets/maps/index.json`; `--kits` ghi lại `src/env/kitBytes.json` (cỡ GLB để kiểm tra MB của vòng 0). Khi scene mở, nguồn layout theo thứ tự: **IndexedDB** (theo khoá) → **file bake** nếu khoá khớp → **engine** (rồi tự ghi vào cache sau vài khung đầu). Khoá = băm của plan (cả giá trị của `ground()` lấy mẫu trên lưới 17 × 17), seed / mật độ / ngân sách / luật ghi đè, `LAYOUT_RULES`, `MAP_FORMAT_VERSION`, catalog (asset, kit có sẵn, công thức) **và băm mã nguồn** (`biomeLayout.js`, `biomePlacement.js`, `biomeCatalog.js`, `biomeLayoutDemo.js`; map sinh thêm `planGen.js`, `planGenZones.js`, `mapModules.js` và cỡ kit trong `kitBytes.json`): đổi bất cứ thứ gì trong đó — kể cả sửa mã engine hay bộ sinh — thì khoá đổi và bản bake / cache cũ tự bị bỏ, không cần nhớ tăng số phiên bản. `MAP_FORMAT_VERSION` (`src/env/mapModules.js`) chỉ tăng khi **hình dạng** của một bản bake đổi (mã hóa typed array, các trường mà `restoreLayout` cần). Splat được cache riêng: khoá layout + `SPLAT_VERSION` (chỉ khi hình dạng dữ liệu splat đổi) + cỡ splat + băm bộ vẽ (`scenes/biomeLayout.js`, `env/kit.js`, `env/terrain.js`); độ mờ không nằm trong dữ liệu. Băm mã nguồn được tính lúc build (`?hash` trong `scripts/esbuild-plugins.mjs`), nên sau khi sửa engine / bộ sinh hãy để dev server build lại rồi tải lại trang. Cache IndexedDB tự dọn: giữ **12 map dùng gần nhất** (layout + splat + bản ghi bộ sinh của một map là một nhóm), map cũ hơn bị xoá sau mỗi lần ghi; nút *Xoá cache map* xoá hết. **Sau khi sửa engine hoặc bộ sinh, `npm test` sẽ báo bản bake trong `assets/maps/` đã cũ — chạy lại `npm run bake:map` (demo) và `npm run bake:map -- --plan seed --seed 1` (map mặc định) rồi commit file mới;** file cũ không bị dùng nhầm (khoá không khớp) nhưng scene sẽ phải chạy engine ở lần tải đầu. Cách đọc thời gian: **khung đầu** là lúc `init` xong (ring 0 + terrain + phần toàn cục đã vào; sau đó còn bước biên dịch shader của lab trước khi hình hiện); **đủ module** là lúc module cuối cùng được gắn vào scene. Ở `modules`, module dựng ngoài scene; chỉ khi cần một lớp program hoặc texture mới thì `compileAsync` với đèn của scene + đẩy texture mỗi khung một cái rồi mới gắn (còn lại gắn ngay), nên khung hình dài nhất khi stream phản ánh chi phí thật; kit nền chỉ bắt đầu tải khi khung đầu đã hiện; trên WebGPU, vài khung dài vài giây ngay sau khung đầu là việc tạo pipeline / PMREM có sẵn của lab và cũng xảy ra ở chế độ `all`.

**Sinh map từ một seed (legacy/art-direction/12 §4.15).** Mặc định scene không còn vẽ plan làm tay mà vẽ **một map do `planGen` sinh ra từ một con số**: đường chính có khúc cua khuất, suối cắt đường một lần, ao, 3–4 vùng (trại địch, nông trại, hang sói, nghĩa địa) kèm cửa / spawn / arena / sự kiện, dải núi chắn phía sau, địa hình — rồi `layoutBiome` trang trí như mọi map. Cùng seed → cùng map, mỗi lần.
- **Thư mục *Bố trí biome → Map từ một seed* (đổi = tải lại trang):** *Nguồn plan* — `seed` (mặc định) hoặc `demo` (plan làm tay, như trước); *Seed map* (số nguyên ≥ 1, cũng là seed gốc của engine); *Cỡ map* — 128 m (mặc định), 192 hoặc 256 m (số vùng nhân theo diện tích; nặng hơn: 140 / 255 module, `generatePlan` 0,1–0,6 s; tải, terrain, splat, module đều chạy được, nhưng **Play chỉ đi được trong ô 128 m quanh điểm xuất phát** vì lưới nav của gameplay là 128 m — giới hạn có sẵn, cũng cắt nửa map ở map 128 m khi xuất phát sát mép); nút **🎲 Map mới** (seed ngẫu nhiên rồi tải lại). Seed từng nhóm (mass, cluster, guide, ecology, trace) và mật độ nằm trong thư mục thu gọn **Nâng cao**; ô *Seed gốc của plan demo* chỉ có tác dụng với plan demo.
- **Góc camera** chỉ liệt kê khu vực map có: map không có nông trại / trại / hang / nghĩa địa / suối / vách thì không có góc nhìn tương ứng; mặt nước chỉ vẽ cho nước có thật; hero xuất phát tại `plan.start`.
- **Lần đầu (nguội) và các lần sau (nóng):** lần đầu `generateMap` thử các lần 0, 1, … (tối đa 8) cho tới khi mọi kiểm tra plan + 19 kiểm tra engine đạt (thường lần 0: ~88 % số seed), rồi layout + splat + *lần thử được nhận* được ghi vào IndexedDB (khoá gồm seed, cỡ, phiên bản bộ sinh, tuỳ chọn, catalog và **băm mã nguồn** của engine / bộ sinh nên sửa code là tự bỏ cache cũ; giữ 12 map gần dùng nhất). Tải lại cùng seed: chỉ `generatePlan(seed, { attempt })` (≈ 40 ms) + layout/splat từ cache, **không chạy lại engine**. *Xoá cache map* để thấy lại lần tải nguội.
- **Báo cáo** (thư mục *Báo cáo*): mục **Map · một seed → cả map** (seed, cỡ, id plan, các vùng của map này, *Lần thử* — đạt ở lần mấy trên tổng bao nhiêu, và mã kiểm tra làm các lần bị loại hỏng —, thời gian plan), **Kiểm tra plan §4.15 (22)**, **Kiểm tra engine §4.12 (19)** và **Module §4.14 (10)** — tất cả phải ✓; thời gian layout / plan / splat / khung đầu / đủ module nằm ở *Module & tải nhanh*.
- **Bake một map:** `npm run bake:map -- --plan seed --seed N [--size 192]` sinh map, ghi `assets/maps/gen-moor-<cỡ>-s<N>/seed-<N>.json` và bản ghi lần thử vào `assets/maps/index.json`; scene dùng file đó khi cache trình duyệt chưa có (sửa code engine / bộ sinh thì khoá đổi, `npm test` báo "re-bake" và phải bake lại; hiện giữ bản bake của demo và của seed 1 = map mặc định).
- **Xem nhiều seed từ trên xuống mà không mở lab:** `npm run preview:plangen -- --seeds 1-12` (= `node scripts/plan-gen-preview.mjs --seeds 1-12 [--size 128]`) ghi `docs/plan-gen-preview.html`: contact sheet + xem lớn từng seed với lớp bật/tắt và bảng kiểm tra. Kiểm thử bộ sinh: `npm run test:plangen`.

## 7i. Map ASHLAR · Biome mix (31 texture + đất tự nhiên Dark Wood)

`src/scenes/biomeMix.js` — scene id `biomeMix`, "ASHLAR · Biome mix (31 texture + cỏ Dark Wood)". Mở bằng ô **Scene** (hoặc `?scene=biomeMix`, thêm `&renderer=webgpu` cho WebGPU). Hàng trên là **mẫu tự nhiên lớn "Đồng cỏ & bờ nước"** (30 m), dưới là lưới 5 × 3 ô nhỏ (14 m) — mỗi ô một mẫu trộn như viewer `ashlar/art/textures/terrain-biomes-v1/biome_mix`: nền · mảng · lối đi · chỗ trũng · vùng Voronoi (Cell Perfection, đủ 4 ô BIO27). Đủ 31 texture của `terrain-biomes-v1` + bộ đất Dark Wood; 3 ô nhỏ (`Đồng hoang`, `Đồng cỏ BIO02`, `Vườn xương`) dùng cỏ Dark Wood có cỏ 3D.

**Thư mục tài nguyên: `assets/terrain-biomes/` — một thư mục duy nhất** (48.4 MiB, 158 file, đăng ký trong `src/assets/samples.json`): mỗi texture BIO có `biome-<id>.webp` (albedo 1024 px), `-h.png` (height 8-bit, đá nhô = sáng), `-n.webp` (normal OpenGL +Y, **lossless**: làm tròn về mức 6-bit gần nhất khi sai số < 15 % chi tiết của map, các map mịn BIO11 / BIO13 và 4 tile mới giữ đủ 8-bit), `-r.webp` (roughness, matte ~0,9). **Bộ đất tự nhiên Dark Wood** `biome-darkwood-<tên>{,-h,-n,-r}`: bản **sao** của `dirt` (đất), `mud` (bùn, nền vũng nước), `grass` (cỏ) xanh D2 + `biome-darkwood-grass-cards.png` (thẻ cỏ 2 × 2), và 4 tile mới từ `ashlar/art/textures/terrain-dark-wood/stylized2_green_ext` (`selection.json`): `grass-dense` (cỏ dày), `grass-sparse` (cỏ thưa), `soil-damp` (đất ẩm gần nước), `water` (màu nước + normal gợn sóng), xử lý như `prepare-terrain-darkwood.py --stylized` (nạp bằng importlib, không sửa file đó). **Đồ trang trí mặt đất** (vòng 3): `biome-decals-ground.webp` (atlas 4 × 4 decal phẳng nhìn từ trên: lá khô ×3 + lá ướt, cành ×2, rễ, mảnh vụn, sỏi ×3 + đá bẹt, rêu ×2, vết nứt, bùn bắn — Codex, khử nền magenta, màu được bleed xuống vùng trong suốt) và `biome-shore-plants.webp` (atlas 2 × 2 thẻ cây bờ nước nhìn ngang: bồn bồn, sậy cao, cói, mộc tặc), cùng 3 **prop Tripo** `biome-prop-riverbank-stones.glb` (6 hòn đá sông có rêu, rộng 1,0 m), `biome-prop-mushrooms.glb` (cụm 6 nấm trên rễ rêu, cao 0,3 m), `biome-prop-stump.glb` (gốc cây có 4 rễ, cao ~0,5 m, rộng 0,8 m): kích thước thật, gốc ở đáy-giữa, texture 2048 JPEG (base color + normal), roughness 0,9. Các file `darkwood-*` cũ không bị đụng tới.

**Đổi / thêm / thay một texture hoặc prop:** sửa file nguồn trong `ashlar/art/textures/terrain-biomes-v1/` (`albedo1024`, `normal1024`, `height1024`; `manifest.json` liệt kê id) rồi chạy

```
python -I scripts/prepare-terrain-biomes-v1.py            # dựng lại cả thư mục + samples.json + THIRD_PARTY_LICENSES.md (chạy lại được nhiều lần; in ra map nào lưu 8-bit)
python -I scripts/prepare-terrain-biomes-v1.py --only BIO01_peat,BIO02_meadow   # chỉ vài id
python -I scripts/prepare-terrain-biomes-v1.py --grass-prefix darkwood-sty       # cỏ xanh xám (stylized2) thay cho cỏ xanh D2
```

### Effect terrain nhiều layer (`createTerrainLayers`)

Effect terrain cũ (`createTerrain`, 3 slot đất → ẩm → cỏ) **giữ nguyên** cho các map Dark Wood. Map này dùng effect mới `app.backend.effects.createTerrainLayers({ library, count, splats, rect })` — GLSL `src/shaders/effects/terrain_layers.glsl` + bản TSL trong `backends/webgpu/effects.js` — tới **8 layer**:
- **Texture array**: `library` = 3 `THREE.DataArrayTexture` dùng chung cho mọi ô — albedo (sRGB), normal (OpenGL xyz, **height ở alpha**), ORM (G = roughness, 256 px) — mỗi texture một lát (`src/env/terrainLayers.js: buildLayerLibrary`). Mipmap + anisotropy 8 chạy cho array trên cả hai backend (WebGL2: `LINEAR_MIPMAP_LINEAR`, 11 mức, `texStorage3D`; WebGPU: 11 mức mip cho mọi lát, sampler `maxAnisotropy 8`). Mỗi vật liệu chỉ **6 sampler** (3 array + 2 splat + env), xa dưới giới hạn 16 của WebGPU.
- **Splat 8 kênh**: `LayerSplat` (cùng file) = 2 texture RGBA8: splat 0 = layer 1..4, splat 1 = layer 5..7 + **độ ẩm (A)**; layer 0 là nền. Mỗi kênh là "mức phủ" của layer đó lên các layer **bên dưới** (layer cao hơn che layer thấp hơn).
- **Trộn N-way theo height** theo thứ tự ưu tiên, cùng bộ điều khiển với effect cũ (`softness`, `heightBlend`, `edgeNoise`) nên **"Độ mịn" vẫn điều khiển được**: mỗi layer phủ lên kết quả bên dưới bằng `labTerrainMask` (trọng số bẻ theo chênh lệch height).
- **Độ mịn (vòng 9)**: `smoothParams(v)` (`env/biomeMix.js`) — 0 là đầu sắc nét của các vòng 1–8, mặc định 0,8, trên 0,8 thanh chỉ chạy 60 % tốc độ (đầu trên rộng hơn nhưng không nhoè hết). Đầu mềm: `freq` 1 → 0,42 (đốm patch / hố to hơn, bờ tần số thấp), `detail` 1 → 0, `contrast` 2,1 → 1, `warpFreq` / `edgeAmp` / `edgeFreq` thấp, `soft` mặt nạ patch 0,07 → 0,36 (đơn vị noise), path 0,42 → 3 m, cell 0,6 → 3,3, `band` 0,4 → 1,7, **blur splat tính bằng mét** (`LayerSplat.setBlurMetres`, 0,09 → 0,95 m mỗi bên, **hai lượt box blur** = nhân chuông; kênh độ ẩm giữ blur ≤ 0,25 m, một lượt, nên trường vũng và quầng ướt không đổi theo thanh), shader `softness` 0,12 → 0,49, `heightBlend` 0,7 → 0,05, `edgeNoise` 0,5 → 0,03 (height chỉ dẫn mép nhẹ — đủ để vùng 50/50 không thành ảnh chồng). Cỏ 3D dùng `shaderMask` (cùng hàm với shader) và mờ dần theo trọng số (`smoothstep(0,2 → 0,9)`, thấp hơn ở rìa) nên không bật ra ở biên. Đo (CPU: mặt nạ → splat → mask shader; độ rộng 10–90 % trọng số cuối, mét; trung vị theo loại biên): vòng 8 mặc định 0,7 → 0,3–0,4 (patch 0,38 · lối mòn 0,30 · đất ẩm 0,44 · cell 0,72); vòng 9 mặc định 0,8 → patch 1,6 · lối mòn 1,1 · đất ẩm 1,7 · cell 1,4; tối đa 1,0 → 2,2 · 1,5 · 2,3 · 2,1. Vùng đang chuyển (cả mẫu tự nhiên) 18 % → 48 % ở mặc định (65 % ở tối đa). Kiểm tra vùng 50/50: độ chói trung bình = trung bình hai đầu (±0,1 %), độ lệch chuẩn giữ 0,89–0,96 × hai đầu với `Giữ tương phản khi trộn` (trộn tuyến tính thuần chỉ 0,70–0,76 ×).
- **Mỗi layer** (`effect.uniforms.params[i]` = Vector4): `1/tile` (m), cường độ normal, chế độ anti-tiling (**-1** tắt hẳn · **0** chỉ lệch UV · **1** + xoay 90° · **2** + xoay 180°; ván gỗ / khối đều = −1, băng BIO14 = 2, cát ướt BIO20 = 0, còn lại 1), và lát trong array. Port đầy đủ `labTerrainSample` (hai lần lấy mẫu cross-fade, xoay normal ngược).
- **Độ ẩm, độ xốp & vũng nước** (Lagarde, *Remember Me*): độ ẩm (splat 1.A) × **độ xốp của layer** (bùn / đất ẩm / than bùn 1, đất 0,9, cỏ thưa 0,75, cỏ 0,5–0,55, đá / ván / tuyết 0,2–0,3; `porosity()` trong `env/biomeMix.js`, `params2.w`) làm đất **tối phi tuyến** (mạnh nhất ở tông giữa, hơi bão hoà thêm) và **mịn hơn** (`wetDarken`, `wetRough`); `roughMin` là sàn roughness của đất. **Vũng nước**: hình dạng lấy từ một **trường thông thấp trong không gian thế giới** (noise ~0,7 / m + 1,9 / m, trộn tối đa 30 % với độ cao *mờ* của các layer — đọc ở mip thô, chỉ nơi có độ ẩm, gradient không nhỏ hơn ~0,1 m thế giới nên viền không dịch theo độ phân giải / zoom), **không** từ độ cao từng texel → vũng to 1–3 m, không lặp theo tile 3 m. Bờ vũng mềm: 0,15 đơn vị trường (~10–15 cm) và không bao giờ hẹp hơn ~2 px (`2,6 · max(|dx|,|dy|)`); quầng đất ướt quanh vũng ~30 cm (`pow(1 − smoothstep(level−0,02, level+0,45, hq), 1,5)`). Màng nước là **xám-xanh, tối hơn bùn quanh nhưng không đen**: albedo ẩm × `puddleTint` (0,86 / 0,90 / 0,90: hơi ấm hơn xám-xanh lạnh để hợp rừng), phẳng dần theo độ phủ (`smoothstep(0,1, 0,6, pud)`), **bóng chỉ khi màng đã đủ phủ** (roughness 0,08, ramp `smoothstep(0,45, 0,80, pud)`) và **specular của vật liệu bị giảm ở mép nửa ướt** (`specK = 1 − 0,95 · smoothstep(0,02, 0,25, pud) · (1 − smoothstep(0,80, 0,88, pud))` nhân vào `specularColor` / `specularF90` — lớp terrain là `MeshPhysicalMaterial`; TSL: hook `specularScale`, xem dưới): vòng trắng quanh vũng chính là thùy specular rộng của mặt trời ở roughness 0,6 → 0,2, nén màu không chữa được. (WebGPU r180: `PhysicalLightingModel.direct` cố định f90 = 1 và `MeshPhysicalNodeMaterial` không bao giờ đọc `specularIntensityNode` (chỉ đọc uniform `specularIntensity`), nên không có đầu vào vật liệu nào giảm được specular; hook `specularScale` của `addNodePatch` bọc `direct()` và `indirectSpecular()` của mô hình ánh sáng và nhân `specK` vào cả specular trực tiếp lẫn IBL — hồ sơ cạnh vũng ở env 1,0 khớp WebGL trong ±0,03. Có cảnh báo một lần nếu three không phải r180; khi lên r186 kiểm tra lại hai điều trên rồi bỏ hook. Mặt nước ao còn dùng `directF90` (`createWaterSpecular()`, chỉ WebGPU): `direct()` bỏ qua F90 = 0,1 của nước nên có lớp ánh bóng nhạt ở nửa ngược sáng — hook nhân specular trực tiếp của từng đèn với `F_Schlick(f0, f90, dotVH) / F_Schlick(f0, 1, dotVH)`, đúng chính xác; hộp ao ngược sáng WebGPU ÷ WebGL từ 1,78 xuống 0,93.) Bầu trời chỉ là một lớp **phát sáng** theo Fresnel (`0,05 + 0,95 · (1 − N·V)^4`) × `sky` (= `màu trời · hemi / π`; độ ấm của vũng nằm ở `puddleTint`, không ở màu soi) × `puddleRefl` (1,0), không bị nắng chiếu, không trộn vào albedo; **gợn vi mô luôn bật** để nắng vỡ thành lấp lánh nhỏ; màu đã chiếu sáng được **nén mềm trên một ngưỡng**: `e = max(o − 0,08, 0); o = mix(o, o − e + e / (1 + 2,2 · e), pud)` (trước fog; fog của lab là pass hậu kỳ nên cả hai twin đều nén trước fog). Đất **dưới mặt nước** (`waterY`: tâm ao) không có vũng / quầng ướt, được coi là ướt hẳn (`max(wetK, sub)`), nhám hẳn và tối dần theo độ sâu. **Mưa** (`rain`) thêm gợn sóng vòng tròn chỉ trong vũng. Kiểm tra bằng mặt nạ **chỉ-vũng** (khung với `puddleTint` ×1 so với ×0,5; vòng = 8 px quanh vũng): độ chói tâm vũng ÷ bùn quanh ~0,65–0,9 ở các góc nhìn mép ao (rim ≈ 0,66, srim ≈ 0,86), ≤ 1,0 ở góc nhìn bờ (≈ 0,8); trong dải 4 px ở mép, 1 % điểm sáng nhất ≤ ~0,2 × vòng.
- **Trộn giữ tương phản** (variance-preserving, báo cáo 2.1): mỗi lần layer phủ lên layer dưới, màu được kéo về trung bình rồi khuếch đại lại `1/sqrt((1-m)²+m²)` để vùng chuyển rộng và mềm **không bị xám / đục** ở giữa (`contrast`, thanh "Giữ tương phản khi trộn"; cần màu trung bình mỗi layer: `library.mean`, tính lúc đóng gói). **Macro màu** có giới hạn theo palette: `macroCool` ↔ `macroWarm` (±4–5 %) trôi theo noise ~45 m, mỗi mẫu có thể đặt riêng (`sample.macro`).
- **Debug** (`debug = 1`): mỗi layer một màu (nâu · đỏ · vàng · xanh nõn · xanh lá · xanh ngọc · tím · trắng), độ ẩm pha xanh dương, vũng lam nhạt.
- **Chi phí**: GLSL bỏ qua layer có trọng số ≈ 0 (`if`), TSL đọc mọi layer. Đo ở scene pass WebGL2 (cận cảnh mẫu tự nhiên, 7 layer): 0,85 ms có bỏ qua vs 1,74 ms không bỏ qua.
- TSL (three r180): trình dựng WGSL bỏ chỉ số lát của `textureSampleGrad` trên texture array, còn bản GLSL (`webgpu-gl`) đẩy chỉ số đó vào tham số offset — `backends/webgpu/index.js: patchArrayTextureGrad` vá lại cho **cả hai** (WGSL: `textureSampleGrad(tex, sampler, uv, lát, dx, dy)`, GLSL: `textureGrad(tex, vec3(uv, lát), dx, dy)`), chỉ chạy trên three r180 (khác phiên bản thì cảnh báo một lần và bỏ qua; gỡ khi nâng cấp r186). Đã kiểm tra cả ba chế độ: WebGL2, WebGPU, `webgpu-gl`.

### Thêm một layer / một mẫu

Mỗi mẫu trong `SAMPLES` (`src/env/biomeMix.js`) là **danh sách layer dưới → trên**, tối đa 8: `{ id, role, tile (m), … }` với `role`: `base` (khắp nơi) · `patch` (mảng fBm bị warp, `coverage`) · `path` (dải, `width` m) · `low` (chỗ trũng) · `cell` (vùng Voronoi; mẫu mà mọi layer đều là cell) · `shore` (chỉ theo `band`). Layer nào cũng có thể có `band: [từ, tới, độ mềm]` = chỉ ở khoảng cách đó tới ao (m, âm = trong ao). Mọi mặt nạ tính bằng **mét** trong khung tâm ô. `id` là mã BIO (`BIO01_peat` → `biome-BIO01_peat*`) hoặc `DW_dirt | DW_mud | DW_grass | DW_dense | DW_sparse | DW_damp` (bộ Dark Wood). Thêm texture mới: chạy script ở trên, thêm id vào `DW_FILES` / manifest rồi dùng trong `SAMPLES` — thư viện array tự đóng gói mọi id đang dùng (`layerIds()`). Mẫu có `pond: { x, z, rx, rz, wobble }` thì mặt đất có lòng chảo + mặt nước, `wet: { from, to, blobs }` cho độ ẩm theo khoảng cách tới ao (+ vài mảng ướt ngẫu nhiên). Nơi ghép danh sách layer với effect là `makePatchMaterial()` trong scene.

### Mẫu "Đồng cỏ & bờ nước" — 7 trạng thái

| # | Trạng thái | Làm bằng |
|---|---|---|
| 1 | **đất** | layer 0 (`biome-darkwood-dirt`) + lối mòn đất (layer 4) |
| 2 | **cỏ thưa** | layer 1 `grass-sparse` phủ phần lớn nền |
| 3 | **cỏ** | layer 2 `grass`, từ ~8 m ra ngoài ao |
| 4 | **cỏ dày** | layer 3 `grass-dense`, từ ~12 m ra ngoài ao |
| 5 | **đất ẩm gần nước** | layer 5 `soil-damp` (≤ ~5,4 m quanh ao) + độ ẩm tối màu |
| 6 | **vũng nước** | layer 6 `mud` (≤ ~2,6 m, nền vũng) + độ ẩm cao + chỗ trũng → shader tạo vũng (cả vài vũng nhỏ rải trên đất) |
| 7 | **nước** | mặt nước (mesh) của ao tại mực −0,2 m; alpha theo độ sâu thật của nước → mép mờ vào bờ; gợn sóng trượt chậm (normal của `biome-darkwood-water`), roughness thấp |

Cỏ 3D (thẻ cỏ Dark Wood): **dày** trên cỏ dày, **vừa** trên cỏ, **thưa** trên cỏ thưa, **không có** trên đất / đất ẩm / bùn / nước.

### Làm đẹp (vòng 3) — mặt nước, decal, cây bờ nước, prop

Dựa trên nghiên cứu cách game làm terrain (`tmp/terrain-research/REPORT.md`, mục 2.1 · 2.3 · 2.5 · 2.6 · 2.8 · 2.9).
- **Nước** (`buildWater`): lưới 7 cm tại mực nước, **màu theo độ sâu thật** (nước cạn xanh-nâu tối → nước sâu xanh lá rừng rất tối) trong vertex colour, alpha mờ dần vào bờ (vertex alpha); vật liệu `MeshPhysicalMaterial` roughness 0,3 với **specular intensity giới hạn 0,1** (lớp thứ hai 0,2) nên mặt ao phản chiếu tối, chỉ có vài điểm sáng gọn, không còn tấm trắng đục dù ngược nắng; **hai lớp normal trôi chậm** (mesh thứ hai chỉ có phản xạ, gợn mịn hơn gấp đôi để nắng ngược vỡ thành lấp lánh). **Không có bọt bờ**: ao rừng lặng không có bọt; bờ mềm nhờ alpha mờ theo độ sâu của nước và quầng ướt của terrain (bản thử có dải bọt marching-squares bị bỏ vì viền cứng + chấm lặp, sáng gấp ~2,5 lần).
- **Decal mặt đất** (`env/biomeMixDecor.js`): quad phẳng instanced theo từng ô atlas, xoay + co giãn ngẫu nhiên, **nằm theo mặt dốc của lòng ao** (nghiêng theo pháp tuyến mặt đất rồi mới xoay), **chroma được kéo về màu đất bên dưới** (giữ giá trị của decal; sỏi tối hơn và tint mạnh hơn), tối hơn ở chỗ ướt; luật theo mặt nạ splat: **lá** ở mép cỏ (lá ướt sẫm gần đất ẩm; **không chồng lên đá**), **cành / rễ / mảnh vụn** trên đất và cỏ thưa, **sỏi** (nhóm nhỏ, thưa) dọc mép lối mòn và bờ nước, **rêu** trên đất ẩm, **vết nứt** trên đất khô, **bùn bắn** ở vòng bùn quanh ao. Mật độ: thanh *Decal*. Áp dụng cho mọi mẫu có cỏ (mẫu tự nhiên, Đồng hoang, Đồng cỏ BIO02, Vườn xương, Đầm lầy, Hầm xương); mẫu muối / băng / sàn đá không có.
- **Cây bờ nước**: thẻ 3 mặt cắt chéo (như thẻ cỏ) của bồn bồn · sậy cao · cói · mộc tặc, dải dọc mép nước + vài bụi trong nước cạn (bồn bồn / sậy ngoài nông, cói / mộc tặc trên bờ), cụm theo noise; mỗi cụm một cỡ khác nhau, mỗi cây có chiều cao / bề rộng riêng, hơi nghiêng (ra phía ngoài ao) và không gần nhau hơn 0,3 m; gió như thẻ cỏ; mật độ: thanh *Cây bờ nước*.
- **Prop 3D** (dựng cố định, có hạt giống): **gốc cây rêu** có 2 cụm **nấm**, rễ / lá / cành quanh gốc; **hai cụm đá sông** ở bờ ao + ~20 **đá nhỏ** (bản thu nhỏ của cụm đá, rải ở bờ và dọc lối mòn, thay cho các tấm đá phẳng); một **thân cây đổ** (kit-dead-trees, texture được giảm bão hoà + tối đi bằng bản sao canvas) ở mép cỏ; vài **bụi cây** (kit-shrubs, chỉ lấy mảnh có màu xanh — đọc màu atlas theo UV của mảnh, có tính `flipY`) ở mép cỏ dày; vài **đá rêu nhỏ** (kit-mossy-rocks) dọc lối mòn. Mỗi prop có **bóng tiếp xúc** (quad tối mờ, nghiêng theo mặt dốc) và nhận **bóng nắng** (một shadow map phủ mẫu tự nhiên, bật/tắt được).
- **Cỏ 3D**: thẻ cỏ tối dần về gốc (vertex colour), tint **chroma theo màu đất ở gốc**; cao / dày theo layer (dày > vừa > thưa).
- **LOD**: decal, cây bờ nước, prop, lớp nước thứ hai chỉ hiện khi camera cách tâm nhìn < 70 m (xa hơn — toàn lưới — chúng nhỏ xíu mà tốn vài ms GPU WebGL2); chuyển ẩn/hiện không biên dịch lại gì. Đo scene pass WebGL2 (trung vị, headless): toàn lưới ~2–5 ms · mẫu tự nhiên ~4,3 ms · cận bờ ao ~2,8 ms (dao động ±1–2 ms giữa các lần đo); WebGPU ~0,8–1,5 ms tổng. (Các pass hậu kỳ của lab — bloom, SMAA — dao động nhiều giữa các lần đo.)
- Tuỳ chọn trong Scene options → *Chi tiết mặt đất*: decal / cây bờ nước (mật độ), prop 3D, bóng nắng; *Mưa*, *Giữ tương phản khi trộn*.

**Environment tab → Scene options:** *Mẫu (khung camera)* — Toàn lưới hoặc zoom một ô (nhãn ẩn khi zoom) + nút *Cận cảnh bờ ao* · **Độ mịn (blend)** 0..1 (mặc định 0,8 — vòng 9: vùng chuyển cỏ ↔ đất ↔ cỏ thưa / dày ≈ 1,6–1,8 m, mép lối mòn ≈ 1 m, đất ẩm / bùn ≈ 1,4–1,7 m, không còn đảo < 1 m²; 0 = đầu sắc nét cũ, 1 = rất mềm ≈ 2,2 m; kéo một thanh điều khiển cùng lúc độ mềm mặt nạ, tần số đốm (`freq`), dải bờ, blur splat (tính bằng mét), softness / height blend / edge noise; mặt nạ tính lại ~0,1 s sau khi thả thanh) · *Chống lặp texture* · *Debug trọng số* · *Mực vũng nước* (0 = không vũng) · *Đất ẩm tối màu* · *Mưa* · *Giữ tương phản khi trộn* · cỏ 3D (bật/tắt, mật độ, gió) · *Mặt nước* (độ đặc, tốc độ gợn) · *Nhân vật mẫu* (thước 1,8 m). **Lighting → Time of day:** *Soi texture* (ánh sáng ban ngày trung tính, mặc định, sáng từ trên-trái màn hình), *Hoàng hôn (D2)*, *Đêm (D2)*.

Ghi chú: normal của BIO09, 14, 21, 23, 26 (độ nghiêng trung bình ≈ 15° trở lên; BIO26 14,8° được kể cùng) giảm còn 0,7. Khi rời scene trên WebGL2 mọi thứ được giải phóng: thư viện array (~435 MB GPU + ~265 MB bản CPU), atlas thẻ cỏ / decal / cây bờ nước, splat, **các prop Tripo (geometry + mọi texture 2048)**, shadow map, buffer instance, PMREM của HDRI, nhãn; scene ra khỏi cache của App ngay và bản dọn dẹp chờ `renderHold` (shader đang liên kết) xong để không làm hỏng lần biên dịch đó; vào lại dựng lại ~4 s (đã đo: số texture sau khi rời ổn định ở baseline + 1 qua nhiều lần vào / ra); trên WebGPU scene vẫn nằm trong cache (dựng lần hai bị đen — lỗi chuyển scene đã biết của lab) và chỉ bỏ bản GPU của các array, tự nạp lại khi quay về. Bản build offline (`Sanctuary_Lookdev_Lab.html`) **chưa dựng lại**: thư mục này thêm ~64.5 MiB base64 (48.4 MiB × 4/3) vào file HTML (build.mjs nhúng mọi file của samples.json).

## 7j. Map ASHLAR · Hầm mộ & hang động (dungeon)

`src/scenes/dungeon.js` (+ `src/env/dungeon.js` = phần CPU: layer, mặt nạ, đường viền hang, bố trí; `src/env/dungeonDecor.js` = prop, decal, đèn, lửa, bụi, chùm sáng) — scene id `dungeon`, "ASHLAR · Hầm mộ & hang động (dungeon)". Mở bằng ô **Scene** hoặc `?scene=dungeon` (thêm `&renderer=webgpu` / `webgpu-gl`). Hai khu cạnh nhau: **Hầm mộ** (BIO-08 Bell Catacombs + BIO-04 Old Face: xương `#E6DFCF`, bồ hóng `#17151A`, ánh nến vàng, đèn tường trắng lạnh; "vang, chôn, hợp xướng") và **Hang động** (BIO-06 Flint Delvings: phấn trắng + đá lửa đen, gỗ chống hầm, lò nung đỏ cam chập chờn như ống bễ; "nóng, lầm bầm, tham"). Nghiên cứu: `tmp/dungeon-research/REPORT.md` (Top 12 + Pitfalls) — bảng đối chiếu ở cuối mục.

**Tài nguyên** (cùng thư mục `assets/terrain-biomes/`, nay 197 file, 68,5 MiB: +~20 MiB; bản HTML offline ×4/3): 7 tile sàn `dungeon-{crypt-dust,crypt-damp,crypt-rubble,cave-floor,cave-clay,cave-rubble,cave-flowstone}{,-h,-n,-r}` (albedo 1024 seam-fix, normal OpenGL 6-bit lossless, height 8-bit dựng từ normal bằng `ashlar/art/textures/terrain-biomes-v1/tools/make_heights.py --biome <thư mục>`, roughness 256), 2 atlas decal 4 × 4 RGBA `dungeon-decals-crypt` / `-cave` (khử nền magenta kiểu mới `neutral`: chỉ trừ phần magenta dư; ô 10 của hang — vết giọt vòng — bỏ, ô 14 — than — và ô 7 / 12 của hầm mộ khử hồng về màu thật của sprite) và 9 prop Tripo GLB đúng cỡ thật, gốc ở giữa đáy, ~10k tam giác, JPEG 2048 (sarcophagus 2,2 m · bone-pile 1,2 m · broken-column 1,5 m cao · candle-cluster 0,8 m · fallen-bell 1,25 m · **crypt-wall** 4 × 2,3 × 0,7 m · stalagmites 1,6 m cao · mine-timber 2,6 m cao · flint-boulders 2 m). Dựng lại: `python -I scripts/prepare-terrain-biomes-v1.py --dungeon-only` (chỉ phần dungeon; chạy cả script cũng dựng nó). **Nguồn tile là một công tắc**: `--source v1` (mặc định: `terrain-biomes-v1` + `terrain-dungeon-v1`) hoặc `--source v2` (`ashlar/art/textures/terrain-biomes-v2-stylized`: cùng id, `albedo1024/` + `normal1024/` [+ `height1024/`; thiếu thì dẫn xuất từ normal]) — tên file ra và id trong `samples.json` không đổi, nên đổi nguồn chỉ là đổi dữ liệu (cả BIO của biome mix lẫn tile dungeon). Scene không chỉnh giá trị riêng theo từng texture (tile 3–4 m, normal 1, độ xốp theo loại đất).

**Hầm mộ** (24 × 16 m + hành lang 4 × 4 m phía nam): 7 layer — nền đá phiến `BIO08_nave` → đá vault tối `BIO27_vault` dồn về chân tường / góc → bụi `crypt-dust` ở góc và dọc tường (quét sạch trên lối đi) → đổ nát `crypt-rubble` quanh hai cột gãy và chuông → vữa xương `BIO04_ossuary` trước hốc xương (tường bắc) và vòng quanh chuông → **lối đi mòn** `BIO07_limestone` (nhạt, sạch hơn, phủ 62 %) từ hành lang đến chuông → vệt thấm ẩm `crypt-damp` ở góc đông nam (+ kênh ẩm → vũng nước theo công thức vũng của biome mix, chỉ ở đó). Tường: **24 mô-đun `crypt-wall` trong một InstancedMesh** (cao 2,74 m, thang y 1,2; màu đỉnh tối dần về đen — không có trần, phòng tan vào bóng tối; `labSolid` nên chặn nhân vật). Prop: 3 quan tài (1 chính), 2 cột gãy, 5 đống xương, 6 cụm nến, chuông đồng rơi làm tiêu điểm; decal có luật (xương quanh đống xương, sáp / bồ hóng quanh nến, nứt đá, mảnh đá quanh đổ nát, vệt bụi, xích dọc tường, khăn liệm cạnh quan tài, vết nước ở chỗ ẩm).

**Hang động** (26 × 20 m, viền bất quy tắc, 2,5–3,5 m): 7 layer — nền phấn `cave-floor` → đá lửa vụn `BIO06_flint_spoil` → sỏi lửa `cave-rubble` → **đất sét ướt** `cave-clay` ở chỗ trũng và bờ hồ → flowstone `cave-flowstone` quanh hồ → **dải đá tối** `BIO19_coastal_rock` ở chân vách → **lối ván** `BIO12_dark_planks` (bắc–nam, ván nằm ngang = ván ngang lối đi, mép sắc) dọc 3 khung gỗ chống hầm (khung giữa có đuốc). Nền là lưới cực (64 × 288) có độ cao: nền lượn nhẹ, lòng hồ sâu 0,62 m, dâng lên chân vách; **hồ** = mặt nước của biome mix (vertex alpha, hai lớp normal, `waterY` chặn vũng, thêm ánh lục lam rất nhẹ tự phát). Vách = một lưới vòng quanh viền: nhiễu đẩy ra, nghiêng ra ngoài, UV theo **độ dài cung × chiều cao** (không bị kéo giãn như chiếu phẳng), màu đỉnh tối dần + nắp đen. **Lò nung**: 6 vết nứt phát sáng (ribbon HDR) dọc chân vách đông + quầng sáng cộng lên sàn + đèn cam xung nhịp như ống bễ. Prop: 5 cụm măng đá, 4 cụm đá lửa, 3 khung gỗ, decal (mảnh đá lửa, cuốc gạc, vụn phấn, vỏ khoáng, vệt thấm, lichen, than, mảnh gỗ).

**Ánh sáng** (11 đèn điểm / spot + 1 hemisphere lạnh + đèn lồng; `exposure` 0,8, ACES): hemisphere lạnh `#7a8fb0` ×1,5 là **sàn tối thiểu — không bao giờ đen**; 6 cụm nến (2400 K, `distance` 7, `decay` 2, **không đổ bóng**) + đèn tường lạnh (7800 K) + đuốc (2100 K) + lò nung (`#e2622b`) + ánh lục lam ở hồ; chập chờn **1/f** `flicker1f()` (`I = 1 + 0,12 n(0,8 t) + 0,05 n(3,1 t) + 0,02 n(11 t)`, nội suy mượt, không giật) — chung cho đèn và lò (lò nhân thêm nhịp ống bễ ~0,4 Hz). **Một** đèn đổ bóng: spot lạnh rọi chuông (shadow map theo cỡ của panel Lighting, `labBiasOverride`, cấp phát ngay từ đầu). Lửa nến = `FlameField` (đặt ở đầu bấc, tìm bằng cực đại cục bộ của lưới Tripo, trong lớp VFX). **Chùm sáng giả**: 3 mặt phẳng chéo, alpha đỉnh Gauss theo bề ngang × dốc theo chiều cao (không cắt cứng vào sàn), cộng (additive) — **đặt trong lớp VFX** vì ở pass scene một blend cộng cũng cộng vào MRT normal và AO tạo một nêm tối (webgpu-gl); **bụi lơ lửng** ~370 điểm (cùng lớp). Post (theo scene, có thể sửa ở tab Lighting): fog cao độ tối ấm `#0c0a09`, vignette 0,55, contrast 1,12, hơi lạnh (−0,02). Preset **Soi texture · sáng đều** (`lookdev`) để xem texture.

**Hai effect mới dùng chung** (cả GLSL lẫn TSL; `app.backend.effects.*`): `createWallFade()` — tường nằm giữa camera và tâm (tâm camera, hoặc nhân vật) được **dither** mờ dần trong hình trụ bán kính `0,18 × khoảng cách` (5–14 m) quanh tia nhìn, giữ phần chân 0,35 m (vạch tường mờ) và phần sau tâm; `createTerrainLayers` có thêm **đèn lồng bán kính** (uniform `lantern`, `lanternP`, `lanternColor`; mặc định `strength` 0 = tắt, biome mix không đổi: ảnh hồi quy trùng ảnh trước trong nhiễu): vầng sáng ấm 7,5 m (dải mờ 2,6 m) quanh nhân vật (Play / nhân vật mẫu) hoặc tâm camera, và tối dần mặt đất ngoài vầng; kèm một PointLight đi theo để prop / tường cũng sáng. Play dùng nhân vật `proc:hero:barbarian` (scene có `defaultSubject`); tường va chạm (`labSolid`), prop là Mesh nên chặn bước; sàn hang là lưới liền nên đi lên dốc bình thường.

**Environment tab → Scene options:** *Khu vực* (Toàn cảnh · Hầm mộ · Hang động · Chuông rơi · Hồ ngầm + lò nung) · **Độ mịn (blend)** (cùng `smoothParams` của biome mix; mặt nạ rộng 1–3 m) · *Đèn lồng* (bật, bán kính, độ sáng, tối dần ngoài vầng) · *Tường mờ dần* · *Đèn chập chờn* · *Chùm sáng* · *Bụi* · *Decal* (mật độ) · *Prop 3D* · *Mực vũng* · *Debug trọng số* · *Nhân vật mẫu*.

**Giới hạn WebGPU / bộ nhớ.** Terrain 7 sampler + 1 shadow map (spot) < 16; đèn không đổ bóng không thêm sampler; không đặt `mapSize` riêng; không dùng vertex 3 byte; mọi geometry tự dựng có `normal` + `uv` hằng (vật liệu node đọc cả hai). Rời scene trên WebGL2: giải phóng hết (mảng layer, atlas, prop, splat) và ra khỏi cache; WebGPU / webgpu-gl: giữ cache, chỉ trả mảng layer (không dispose texture đang gắn vào vật liệu cache). Đo (headless, 1038 × 848, WebGL2, scene pass trung vị): hầm mộ 3,0 ms · hang 3,1 ms · toàn cảnh 4,4 ms · chuông 2,3 ms · hồ 3,9 ms; WebGPU tổng GPU 0,7 ms (hầm mộ) – 1,2 ms (hang); bộ nhớ studio 33/31 ↔ dungeon 77/54 (geometries/textures) qua 3 lần ra vào.

**Đối chiếu Top 12 của nghiên cứu:** 1 tách ấm / lạnh + grade riêng cảnh ✓ · 2 sàn ambient không đen ✓ · 3 đèn lồng trong shader mặt đất, không sampler ✓ (tắt mặc định) · 4 đèn nến / đuốc điểm không bóng, `distance` hữu hạn ✓ · 5 ≤ 1 đèn đổ bóng ✓ · 6 chập chờn 1/f ✓ · 7 vật thể phát sáng + bloom ngưỡng cao (lò nung HDR; ngưỡng bloom mặc định 1,0) ✓ · 8 chùm sáng giả ✓ (chưa có noise cuộn) · 9 tường mờ theo khoảng cách + chiều sâu ✓ · 10 bộ kit mô-đun (tường 4 m) ✓ · 11 bụi ✓ · 12 gloom tĩnh vẽ sẵn ✗ (chưa có lightmap / vertex gloom). Pitfall "highlight trên sàn ướt dưới camera cố định": roughness sàn tối thiểu 0,7 và công thức vũng đã làm dịu specular (xem 7i).

## 7k. Map ASHLAR · Prologue · The Old Face (hầm xương)

`src/scenes/oldFace.js` (+ `src/env/oldFace.js` = phần CPU thuần, **không THREE**: phòng, trường khoảng cách tường, tường mô-đun, độ cao sàn, mặt nạ layer, đường đi, chạm trán, ánh sáng, khung camera; `src/env/oldFaceDecor.js` = prop, mảnh dựng tay, đèn, VFX, decal) — scene id `oldFace`, "ASHLAR · Prologue · The Old Face (hầm xương)". Mở bằng ô **Scene** hoặc `?scene=oldFace` (thêm `&renderer=webgpu`). Đây là khu đầu tiên của game (Level Design §10.1): **dungeon tutorial, sinh cố định (hand-authored)**, đi được trong **Play**. Cảm giác: *sinh ra trong bóng tối, từ một bức tường của người chết — lạnh, chật, mới sinh*. Người chơi đi từ **trắng lạnh** (ánh sáng của Tường, sau lưng) sang **hổ phách ấm** (đèn Gennet, phía trước).

**Tuyến đi** (≈ 58 m, 48 × 16 m, xa nhất 38,7 m cách điểm spawn; test: `npm run test:oldface`): **A · Mặt Tường** — vòng móng ngựa bán kính trong 6 m, 6 mô-đun tường hầm xương (tỉ lệ x 0,8), **lỗ hổng ở đỉnh** giữa hai mô-đun, spawn cách lỗ 1,6 m (đủ xa để bóng nhân vật đổ về phía trước); **B · Hành lang sọ** — hai dãy kệ sọ (mô-đun y × 1,0 = 2,3 m, thấp), rộng 2,6 m, **tường ấm** ở bắc; **C · Hốc sập** — mô-đun nghiêng 27° chìm 0,3 m, khe lách tự do 2,10 m, cột gãy + đá lăn + đống xương; **D1 · Hốc gõ** — phòng 7 × 6 m, 2 hốc ở tường bắc; **D2 · Bậc ngập nước** — bậc xuống 0,4 m, **bờ đá** viền không đều (± 1,1 m phía tây, ± 0,8 m phía đông) xuống dốc 0,6 m đo theo **khoảng cách thật tới đường bờ** (≈ 34° trên chính đường cong; tam giác sàn 0,25 m dốc nhất 38,9° < 53° — giới hạn "sàn" của nav, có test; đường mép nước có |dx/dz| tối đa 2,7 phía tây / 1,7 phía đông, không răng cưa) với đá viền (coping) nhỏ không chặn nav, nước mặt −0,18 (sâu ~20 cm), **nước đọc được là nước**: nền xám-lục tối + một **dải phản chiếu ấm mềm hướng về cầu thang** (sáng nhất sát bờ đông, mờ dần sang hai bên và về phía tây; vệt gợn dài ngắn bất đều, đầu mờ, không phải hạt lấp lánh), một lớp sheen lạnh yếu ở nửa tây (texture riêng) và vạch bọt mờ ở đường mép nước; **E · Cầu thang** — 10 bậc 0,18 m (≤ 3 bậc / 1 m: lưới nav 1 m giới hạn bước 0,6 m) lên sân y = 1,8, khung cửa **vòm gothic** 1,4 × 2,6 m, đèn Gennet, **tượng không mặt đầu tiên** (đầu quay về chân cầu thang). Tường đá thợ hồ (cầu thang, cửa) tách khỏi tường xương (cắt đá thẳng, không phát sáng).

**Mảnh dựng tay.** *Lỗ hổng:* nút chai vữa-xương (ExtrudeGeometry) lấp khe, khoét **vết nứt gồ ghề** (rộng ~0,6 m ở sàn, nhọn dần đến sợi tóc ở ~2,2 m) + 3 vết nứt nhỏ rò sáng, sọ và xương dài gắn quanh mép; sau nút là tấm phát sáng HDR trắng lạnh (`toneMapped: false`, ~3,0–3,9) chỉ lộ qua các vết nứt; quầng sáng additive (billboard) + vệt sáng trên sàn. *Bảng "BE KIND TO THEM":* canvas (chữ hoa có chân, giãn chữ, dấu Wedge), chữ khắc đậm vào đá xám + **normal map suy từ mặt nạ chữ đã làm mờ** (ánh sáng từ dưới bắt vào nét khắc), mép/đỉnh tối. *Vigil:* ghế gỗ lệch (chắp vá), chăn len gấp (RoundedBox xám lục), tẩu đất sét + tro (decal ô 7), bát sữa kem tối; *giá sáp:* bệ đá thấp 2,4 × 0,35 × 0,8 m, lớp sáp mỏng trên mặt + giọt sáp chảy bất đều (dài ngắn, chụm lại, ~20–30 giọt), 3 cụm nến Tripo **tắt**, 1 decal sáp (ô 5) + 1 vết tro (ô 7) dưới giá. *Giá nến sắt chết:* `kit.wallBracket` + gốc nến + vết bồ hóng (InstancedMesh). *Chấm sáng (pinpoint):* 9 chấm trắng lạnh nhỏ (emissive, **không đèn**) dán sát tường. *Đèn Gennet:* đèn lồng sắt (nắp, 6 thanh, đĩa đáy, xích + móc trên tường cửa), ngọn lửa `FlameField` bên trong, quầng ấm, một mảnh sàn nhà thờ ấm phía sau ngưỡng cửa. *Tường ấm:* vệt nước nâu đậm (canvas, bóng) + 3 hang chuột ở chân.

**Ánh sáng.** Ánh sáng đầu tiên là của Tường, ánh sáng thứ hai là đèn Gennet; **không có đèn lấp đầy** ngoài hemisphere lạnh `#4a5870` rất thấp (sàn tối thiểu). Chỉ **một** đèn đổ bóng: SpotLight trắng lạnh `#dce6f2` (đề xuất ≈ 8500 K — canon chưa chốt mã màu; ghi nhãn *đề xuất*) ở mặt phẳng vết nứt (apex + 0,3 m, **y 2,0**, trên đầu nhân vật), hướng về miệng móng ngựa, cường độ 130, `distance` 22, góc 1,0 rad, penumbra 0,9, `shadow.radius` 4 → **viền sáng + bóng dài** cho nhân vật khi đi ra; kèm 1 đèn điểm lạnh nhỏ (không bóng) nâng bảng/giá. **Nhấp nháy chậm** của Tường (không phải flicker): `1 + 0,06 sin(2πt/5,3) + 0,04 (noise(0,4 t) − 0,5)` áp cho đèn, vết nứt, quầng. Đèn Gennet: PointLight `#E0A050` pha 2400 K, `flicker1f` (1/f), `distance` 11, + 1 đèn tràn giữa cầu thang + 1 đèn dội nhẹ ở chân cầu thang (bậc quay mặt về nam, xa đèn); cầu thang có emissive ấm rất nhỏ theo mức đèn (đã đo: ghi `emissiveIntensity` đổi độ sáng bậc thang trên cả WebGL2 lẫn WebGPU). Không còn đèn "ánh lạnh trên nước": ánh phản chiếu của nước là mesh vẽ trên chính lưới nước. Tổng: 6 đèn (spot, nâng lạnh, Gennet, tràn, dội, vầng sáng nhân vật) + hemisphere (1 đổ bóng) → terrain 7 sampler + 1 shadow map < 16 sampler WebGPU. **Vầng sáng nhân vật** (cơ chế `lantern` của dungeon, bật mặc định): bán kính 4,4 m, độ sáng 0,4, tối dần ngoài vòng 0,5, màu **xám trung tính** (`lanternColor` ≈ 0,5/0,52/0,5) + PointLight 6500 K. Ở các khung camera xa (orbit, không Play) bán kính và hemisphere **tăng theo khoảng cách camera** để cả map còn đọc được. Fog đen-lục `#070908` (dày hơn dungeon), ACES, exposure 0,85, vignette 0,6, contrast 1,12, saturation 0,85 (không accent). Preset thứ hai: **"Soi texture · sáng đều"**.

**Sàn.** 1 `LayerSplat` 576² phủ 52 m (~11 px/m) + `createLayerTerrain`, 7 layer: `BIO08_nave` (nền) → `BIO27_vault` (tối, dồn về tường — phần lớn sàn) → `BIO27_cradle` (vữa-xương nhạt trước Tường; **không** dùng `BIO04_ossuary` vì nó nâu cam = màu accent mà Prologue không có) → `DG_crypt_rubble` (chỗ sập) → `DG_crypt_dust` → `DG_crypt_damp` (chân Tường, bờ nước, chân cầu thang; kênh ẩm cao) → `BIO07_limestone` (vệt mòn nhẹ). Hệ số albedo sàn 0,34 và normal 0,5 (yên tĩnh, tương phản thấp). Lưới độ cao 0,25 m cắt theo tường; cầu thang và sân là mesh riêng. Decal: atlas `dungeon-decals-crypt` **bão hòa 42 %** (không cam/gỉ), ít và nhỏ (sườn, đốt sống, sọ nhỏ; xương chéo hiếm), sáp chỉ dưới giá.

**Tường.** 1 `InstancedMesh` (`labSolid`) mô-đun `dungeon-prop-crypt-wall`, **DoubleSide** (mô-đun là vỏ rỗng có hốc: nhìn từ ngoài qua tường gần camera, các vách hốc hiện thành "lưỡi đen" nếu chỉ vẽ một mặt), gradient đỉnh tối (không trần), `createWallFade()` với strength 3 + bán kính 0,12 × khoảng cách (3,5–9 m): lõi hình trụ cắt sạch, chỉ viền và chân 0,3 m là dither. **Chỉ tường mới mờ dần**: cầu thang, sân, đá viền bờ nước, sàn và nút chai lỗ hổng không dùng wall fade (bậc thang nằm giữa camera và nhân vật không bị khoét thủng).

**Play (không pop-up).** Spawn đúng trước lỗ hổng; khi bắt đầu Play có một **làn bụi nhạt ở chân lỗ** (bàn tay vỡ vụn). **E1** (hành lang, cách tường ấm ≤ 7 m **và** đứng trong phòng `neck`/`passage`: cổng theo phòng nên không kích hoạt xuyên tường horseshoe; test `triggerHit`): bụi vữa ở 3 hang chuột, sau 1,4 s → 3 "Mortar-Rat" (**dùng mô hình `spider` thay thế**, chưa có mô hình chuột). **E2** (phòng D1, phòng `bay`): 3 tiếng gõ (bụi ở 2 hốc, cách 0,5 s), sau 1,7 s → 2 "Shambler" (**mô hình `zombie` thay thế**, có clip *rise*). **E3** (bậc ngập nước, phòng `flood`): 2 Mortar-Rat + 1 Shambler. Mlvl 1, mỗi cái kích hoạt đúng **một** lần; đặt lại khi Play khởi động lại hoặc nút **Gọi lại quái**. Play **bắt đầu với đèn Gennet tắt**; đèn **mờ dần hiện** trong 2,5 s khi nhân vật bước xuống bậc ngập nước (x > 6) hoặc cách cửa ≤ 10 m (tuỳ chọn *Luôn sáng* / *Hiện khi tới gần*); ngoài Play đèn luôn sáng. Bước chân đọc `surfaceAt` (layer splat + nước bậc ngập → "water"). Hai hàm **additive** mới ở `gameplay/host.js`: `heroWorld(out)` và `spawnAt({ type, x, z, mlvl, name, rise })` (trigger do scene lo; `spawnCamps()` giữ nguyên).

**Environment tab → Scene options:** *Khu vực* (Toàn cảnh · Mặt Tường · Hành lang sọ · Hốc sập + hốc gõ · Bậc ngập nước · Cầu thang · đèn Gennet) · **Độ mịn** · *Vầng sáng nhân vật* (bật, bán kính, độ sáng, tối dần) · *Đèn Gennet* (hiện khi tới gần / luôn sáng) · *Ánh sáng Tường lập lòe chậm* · *Đèn Gennet chập chờn (1/f)* · *Tường mờ dần* · *Bụi* · *Decal* · *Prop 3D* · *Mực vũng* · *Đất ẩm tối màu* · *Độ sáng nền đá* · *Quái (Play): bật E1–E3 · Gọi lại quái · Bụi bàn tay (xem thử)* · *Debug trọng số* · *Nhân vật mẫu*.

**Kiểm chứng (đo, Chrome headless-ish, 1600 × 900, snapshot đóng băng; scene gọi `bench.burst` 60 khung + GPU timer):** `node --test scripts/old-face.test.mjs` 11/11 (thêm: mọi tam giác sàn 0,25 m phủ lòng bậc nước (từ bờ tây tới cột cầu thang, từ tường bắc tới cách tường nam 0,25 m; mép cứng sát tường nam không tính) < 53°; mỗi trigger chỉ nổ trong phòng của nó và không điểm nào nổ hai cuộc chạm trán; id texture của mọi layer có trong `samples.json`; kết nối spawn → cửa trên lưới 0,25 m với đệm 0,35 m; bề rộng tự do tối thiểu ≥ 1,8 m, khe lách 1,8–2,2 m; mọi điểm < 60 m cách spawn; trigger/cue/spawn nằm trong vùng đi được; bước độ cao ≤ 0,45 m / 0,5 m (cầu thang ≤ 0,6 m / 1 m); mặt nạ hữu hạn ∈ [0, 1]; ≤ 8 layer; đáy bậc < mực nước < sàn khô); `npm run check` đạt; `npm test` 85/85 + 55/55. **WebGL2:** toàn cảnh 196 draw call, 1,09 M tam giác, burst 1,1 ms/khung (lần đo trước: 5,5 ms — nhiễu theo tải máy), **2,0 ms GPU**; Mặt Tường 135 call, 0,96 M tri, 1,6 ms / 1,55 ms. **WebGPU:** toàn cảnh 195 call, 3,8 ms burst, **0,7 ms GPU**; Mặt Tường 4,0 ms / 1,15 ms. Nav Play: 229 ô 1 m, **113/113 điểm mẫu đường đi đi được**. Walkthrough Play (WebGL2): đi từ spawn tới cửa, E1/E2/E3 mỗi cái kích hoạt đúng 1 lần (3 → 5 → 8 quái), E1 **không** nổ khi nhân vật đứng trong horseshoe cách tường ấm 6,5 m, đèn Gennet bắt đầu ở 0 rồi 0 → 1 từ x = 6,4, đường đi ngập nước từ x = 6,4 đến 9,9 (mẫu 0,5 m; bước chân báo `water`), leo cầu thang không bậc nào bị khoét (`play_7_climb.png`); không lỗi console. Rời sang Studio rồi quay lại **3 lần** (WebGL2, `geometries / textures`): oldFace sau lần 1, 2, 3 = 104/65, 104/65, 104/65 (ổn định, không tăng theo vòng); Studio sau mỗi lần rời = 46/41 (về đúng mức nền của Studio ⇒ scene giải phóng hết); dungeon cùng phép thử 99/77 × 3 (ổn định). Số đếm lần dựng đầu tiên thay đổi giữa các lần tải trang (89/46, 107/56) nên chênh +11 so với "trước" trước đây **không phải rò rỉ**; nguyên nhân chênh lần đầu chưa truy ra (không phải do Studio: Studio về đúng nền);  WebGPU giữ cache (geometry 105 → 140, không lỗi của scene; cảnh báo `Checker frame` của Studio xuất hiện cả khi rời từ dungeon — có sẵn từ trước). Ảnh: `docs/old-face-shots/` (6 khung × WebGL2/WebGPU + 7 ảnh Play: spawn có viền sáng và một bóng dài về phía trước, hành lang, E1, E2, đèn Gennet, đèn hiện lên nhìn từ bậc nước, leo cầu thang) và `docs/old-face-plan.png` (mặt bằng 2D, `scripts/old-face-plan.py`).

**Giới hạn / chưa làm.** Chưa có mô hình chuột và Shambler riêng (stand-in `spider`, `zombie`); không có âm thanh (audio gameplay của lab là stub — các cue là bụi, không phải tiếng); lối vào khung cửa nhà thờ chỉ có một mảnh sàn ấm, phần còn lại đen; chưa rebuild HTML offline (`npm run build` không chạy vì sẽ gói cả việc dở của thread khác); bức tường "gõ" của E2 dùng chung mô-đun, chưa có hốc nắp quan tài riêng. Mã màu ánh sáng Tường (`#DCE6F2`, ≈ 8500 K) là **đề xuất**, canon chưa có hex.

**Thẻ mood** (`ashlar/art-direction/artdirection.md` §2.1 — trạng thái *Đề xuất / đang lookdev*):

| Trường | Nội dung |
|---|---|
| Map | The Old Face (Prologue, LD §10.1, BIO-04), `?scene=oldFace` |
| Mood mục tiêu | Sinh ra trong bóng tối từ một bức tường của người chết: lạnh, chật, mới sinh. |
| Palette | Nền `#1F2A24` (đêm Prologue), than bùn `#4A3526`, vữa xám, xương ngà/xám; ánh sáng Tường trắng lạnh `#DCE6F2` (*đề xuất*), đèn Gennet `#E0A050`; **không accent**, không nắng, không trắng sạch. |
| Lighting và thời tiết | Ánh sáng đầu tiên: lỗ hổng của Tường (lạnh, nhấp nháy chậm, 1 spot đổ bóng); thứ hai: đèn Gennet (ấm, 1/f). Không đèn lấp đầy; ngoài bán kính ánh sáng là chiều sâu đen. Nến Vigil đã tắt. |
| Tương phản và value | Value trước màu; sàn tối, tương phản thấp; nhân vật xám tách khỏi sàn bằng viền sáng từ lỗ phía sau; một điểm ấm nhỏ ở xa trước một khối tối lớn. |
| Nhịp cảm xúc | Trắng lạnh sau lưng → hành lang gần như tối (vầng sáng nhỏ) → khe lách → hốc gõ → bậc nước → đèn ấm hiện ra ở đỉnh cầu thang. |
| Style | `ashlar/art-direction/artdirection.md` §1 (stylized vừa phải); mô hình Tripo + procedural đơn giản. |
| Trạng thái | Đề xuất / đang lookdev (2026-10-21, chưa duyệt) |
| Chưa khoá | Mã hex ánh sáng Tường; mô hình chuột / Shambler; âm thanh; camera và budget; chi tiết nhà thờ sau cửa. |

## 7l. Act I · base maps

Base map = bản dựng đầu đi được của một map Act I: **địa hình, cỡ, mặt đất, ánh sáng và các nhịp truyện là thật; model còn thiếu là blockout đúng cỡ** (màu theo loại, nhãn mã asset), GLB ASHLAR có sẵn chỉ dùng chỗ hợp, kit Blood-Moor cũ đứng thay là **"kit tạm"**. Spec chung: `tmp/act1-base-maps/SPEC.md`. Báo cáo asset còn thiếu của mọi map: `docs/act1-base/ASSETS.md` (sinh lại: `node scripts/act1-assets-report.mjs`). Mặt bằng 2D: `docs/act1-base/<map>-plan.png` (`node scripts/act1-plan-preview.mjs [map]`), ảnh chụp: `docs/act1-base/shots/<map>/`. Test: `npm run test:act1` (= `node --test "scripts/act1-*.test.mjs"`).

**Engine ngoài trời** (map 1–3): `src/env/act1/outdoor.js` (thuần, không THREE; **định dạng plan ghi ở đầu file**: biên, ô địa hình ≤ 1 m, các phép độ cao, nước + độ sâu, lối / đê / lối ván trên nước có dốc lên xuống, painter lớp đất vào một LayerSplat, công trình / hàng tường / rải ngẫu nhiên có seed, ánh sáng, marker, đoạn / điểm xuất phát / khung camera, kiểm tra plan, lưới đi bộ kiểu Play) → `src/env/act1/outdoorBuild.js` + `blockout.js` (THREE) → scene `src/scenes/act1Outdoor.js` (một class `Act1OutdoorScene(app, mapId)`). **Thêm một map ngoài trời:** viết `src/env/act1/maps/<mapId>.js` (export `PLAN` với `engine: 'outdoor'` + `ASSETS = withCounts(PLAN)`, `MONSTERS`, `NPCS`, `TEXTURES`, `VFX`), thêm **một dòng** vào `src/scenes/index.js` (`act1<MapId>: { label: 'ASHLAR · Act I · base · <tên>', create: (app) => new Act1OutdoorScene(app, '<mapId>') }`), chạy test + plan + báo cáo. Đổi blockout sang GLB thật = một dòng trong mục asset: `status: 'glb', model: '<sample id>'` (mọi chỗ đặt giữ nguyên mã). **Engine trong nhà** (map 4–6): `src/env/act1/interior*.js`, scene `act1Interior.js` (xem mục của map đó).

**Tab Environment → Scene options** (mọi map ngoài trời): *Khu vực (khung camera)* · **Điểm xuất phát (Play)** (lưới Play chỉ 128 m quanh điểm xuất phát; đổi điểm khi đang Play sẽ khởi động lại ở đó) · *Mood* (cũng ở tab Lighting → *Ánh sáng (mood)*) · *Độ mịn (blend)* · *Lớp phủ*: nhãn asset (mã · tên · trạng thái · cỡ), chạm trán (mã quái × số), điểm Rite, landmark + tầm nhìn, vignette (kể cả cảnh không đánh dấu), NPC (hình người 1,8 m), lối ra, chú giải (mặc định chỉ bật chú giải) · *Thời tiết & ánh sáng*: mưa / sương thấp (× mood), *Các mộ đã yên* (sương mỏng, quạ đậu), ánh sáng người chập chờn 1/f · *Chi tiết*: blockout, GLB + kit tạm, cỏ / lau sậy, vũng, đất ẩm, mặt nước · *Quái (Play)*: quái thay thế mang mã ASHLAR (zombie, skeleton, archer, spider, bat, imp), *Gọi lại quái* · debug trọng số layer · nhân vật mẫu. Ngữ pháp ánh sáng: ánh sáng người nhỏ, ấm, chập chờn (≤ 8 đèn thật, phần còn lại là quầng sáng tĩnh trong lớp VFX — không bị sương che); ánh sáng Perfection đứng yên, đều. Mưa và sương là placeholder (vệt mưa quanh camera, tắt dần khi camera xa; tấm sương thấp trôi chậm + sương cao độ hậu kỳ).

- **Map 1 · `act1Lychgate` — ASHLAR · Act I · base · Lychgate → Churchyard** (BIO-03, 216 × 160 m, `src/env/act1/maps/lychgate.js`, ghi chú `docs/act1-base/lychgate.md`): đảo than bùn và ngọn đồi khô duy nhất giữa nước đầm đen. Làng (hub) thấp trên than bùn ướt quanh quảng trường và hồ làng (nhà sàn, lối ván trên nước, giếng, lò rèn Brannoc, bảng tên người ngủ, chuông tang, sạp Nell, trạm gác Osric, hố cắt than bùn); **cổng lychgate có đèn là khe duy nhất** của tường đá lửa bao sân nhà thờ (test kiểm: chặn cổng là sân nhà thờ bị cắt rời); sân nhà thờ (wild) leo dốc tới nhà thờ đá lửa, **năm mộ chưa yên** (5 cảnh khác nhau), giá treo cổ + quạ, thủy tùng chỉ ở rìa, tượng không mặt bên lối đi; tháp ossuary trên đỉnh, sân hầm nhà Barrow (hub) bên dưới nơi trẻ con đếm sọ; đê ra Night Fens ở phía tây; Gentle House (N-GH) xa ~400 m bên kia nước đen, cửa sổ ấm đứng yên. Mood: *Act I · mưa phùn ban ngày* (mặc định), *Prologue · đêm mưa* (không accent, nến mộ tắt, đèn Gennet ở cửa nhà thờ là ánh ấm đầu tiên), *Soi texture · sáng đều*. 7 điểm xuất phát, 13 khung camera. Asset: 48 mã — glb 6 · kit tạm 6 · procedural 5 · **blockout 31** (xem ASSETS.md).
- **Map 2 · `act1Fens` — ASHLAR · Act I · base · Night Fens → Rook's Weir** (BIO-01, wild, 256 × 192 m, `src/env/act1/maps/fens.js`, ghi chú `docs/act1-base/fens.md`, mặt bằng `docs/act1-base/fens-plan.png`, ảnh `docs/act1-base/shots/fens/`): gần như toàn bộ là nước đầm đen — **đất chỉ là đê, đảo than bùn, chỗ lội**, ở Rook's Weir là **lối ván, bè, nóc mái** (nước mở không bao giờ đi được, test cả map). Night Fens (đông → tây): đê từ Lychgate, đảo đá địa y (Rite 1), **vòm đá nghiêng** trên đê (landmark), đảo bến lội nơi **đường chìm** lên bờ và hàng the Soothed áo ngủ trắng lội nước về **cửa sổ ấm xa của Gentle House** (REMEMBER, khung ngang tầm mắt + vòm sao), cầu gãy + chỗ lội đá, cột đèn mồi không thắp với corpse-candle đứng yên, nhánh đê ra Willow Mere, đảo Lullaby Man (mid-boss); 5 rite, 1 vignette không đánh dấu. Rook's Weir: đập, làng chìm (lối ván xuyên cửa vòm tường hồi, bệ giếng, hai nóc mái có lối ván, tháp chuông chìm, bàn ăn dưới nước, rèm ren, bến đêm với thuyền mái lanh + đèn trắng đứng yên, lái đò chết), đê ra Poppy Reach. **Không marker: đi theo tiếng ru** — nguồn tiếng ru `RU1–RU7` (marker loại `sound`) hiện trong lớp phủ *Landmark + tầm nhìn*. Không có ánh sáng người ở Night Fens (ấm duy nhất là cửa sổ xa); sao tĩnh theo `mood.stars`. Mood: *Night Fens · đêm* (mặc định), *Rook's Weir · đêm lặng*, *Soi texture · sáng đều*. 10 điểm xuất phát (một mạng nối liền), 16 khung camera. Asset: 46 mã — glb 5 · kit tạm 5 · procedural 4 · **blockout 32**. Engine bổ sung nhỏ: blockout `parts` (khối dữ liệu trong file map), marker `sound`, vòm sao.
- **Map 3 · `act1PoppyReach` — ASHLAR · Act I · base · Poppy Reach** (BIO-02, wild D3 C3, 200 × 256 m, `src/env/act1/maps/poppyReach.js`, ghi chú `docs/act1-base/poppyReach.md`, mặt bằng `docs/act1-base/poppyReach-plan.png`, ảnh `docs/act1-base/shots/poppyReach/`): sườn nam đồi Gentle House leo thẳng ~15 % từ bến đê trên nước đen (Rook's Weir) lên bậc hospice — ngày u ám mềm, ~35 000 cụm anh túc + ~30 000 khóm cỏ xám-xanh (instanced, lắc theo gió, lối đi để trống) theo từng đám có khoảng thở; tường đá khô làm lối (4 cổng ruộng, 1 stile, 2 hẻm tường), nhà trại mái sập nửa (3 giường trống, mỗi giường một gối sạch), xe bò còn chăn đệm, đống rơm, giá phơi anh túc, miệng mỏ Flint Delvings trên gò phấn (lối phụ), 4 rite, 2 vignette không đánh dấu, dãy ward A18.4 với một cửa sổ ấm đứng yên (thấy từ chân dốc), tường vôi có hàng hốc nến đứng yên. **Khói ngủ là địa hình**: mục *Khói ngủ (địa hình)* — bật/tắt, *Tốc độ trôi (× gió)*, *Nhãn: đứng trong → chậm dần → ngủ*; 5 vùng thở qua lại theo gió, đóng / mở lối. Đất ngoài biên chạy tiếp (apron, cùng vật liệu địa hình). Engine bổ sung: `src/env/act1/meadow.js` (thuần) + `meadowBuild.js` (THREE), test `scripts/act1-meadow.test.mjs`. Mood: *Poppy Reach · ngày u ám* (mặc định), *Soi texture · sáng đều*.
- **Map 4 · `act1GentleHouse` — ASHLAR · Act I · base · Gentle House** (BIO-05, nơi thánh không chiến đấu, 66 × 94 m, `src/env/act1/maps/gentleHouse.js`, ghi chú `docs/act1-base/gentleHouse.md`, mặt bằng `node scripts/act1-interior-preview.mjs gentleHouse`): lối lên đồi dưới mưa từ Poppy Reach → bậc thềm vôi trắng → sân trước cổng có tường hốc nến → **tháp cổng: mưa dừng ở cổng** (vệt mưa chỉ ngoài vùng khô `plan.rain.dry`, đất ngoài ướt) → cloister 12 vòm quanh sân cỏ → **phòng bệnh dài** (14 giường, 13 người ngủ mỉm cười trong vải lanh sạch, giường trống của Fen, nến bậu cửa sổ và chân nến giống hệt nhau, đứng yên) → 7 bậc lên **phòng Mẹ Hawise: cửa sổ cao ấm** (ánh sáng sáng nhất, đứng yên nhất của act, khớp `N-GH`), trà anh túc = vision trigger → nhà ăn (bánh mì, hoa), bếp (lò sạch, không lửa), phòng vải lanh → **cầu thang đêm** xuống Garden of Hush. Chỉ ánh Perfection, không ánh đỏ. Overlay mới **Tuần tra + tầm nhìn (nón) · lối đưa ra** (lộ trình các sơ, sơ gác cổng, lối đưa Tamsin ra cổng); **mái ngoại thất** chỉ hiện khi tâm camera / nhân vật ở ngoài trời (`room.outdoor`, KIT `roof`); NPC đứng thay (KIT `npc`, báo trong NPCS). Mood: *trong nhà ấm* (mặc định), *ngoài cổng · mưa xám*, *soi texture*. 7 điểm xuất phát (S1 phủ cả map), 14 khung camera thấp/gần. Asset: 29 mã — glb 1 · procedural 2 · **blockout 26**.
- **Map 5 · `act1GardenOfHush` — ASHLAR · Act I · base · Garden of Hush** (BIO-04 ↺, dungeon dưới hospice, Hybrid, 190 × 82 m, `src/env/act1/maps/gardenOfHush.js`, ghi chú `docs/act1-base/gardenOfHush.md`, mặt bằng `node scripts/act1-interior-preview.mjs gardenOfHush`): chiếu nghỉ vôi trắng của hospice → cầu thang 17 bậc xuống hầm cũ (hốc xương GLB, cột gãy, người ngủ đầu tiên) → đường hầm rễ → **vườn ngủ**: hàng người ngủ vùi tới ngực, anh túc đỏ từ mỗi miệng, **đèn ngủ hồng đứng yên** bên mỗi người (263 đèn, 9 đèn thật, còn lại quầng + vũng sáng), mái vải lanh, **cột chuông ru** (cơ chế: overlay **Chuông ru** — vùng ồn → chuông → Poppy Nurse ra từ hốc rễ, gợn sóng xem thử), mương nước tĩnh → hành lang kênh tưới (giá phơi, mạng tơ W07) + **phòng thở** (Fen ngủ trong luống, Tamsin quỳ bên, nến + đèn lồng của cô là ánh ấm lập lòe duy nhất, đèn đổ bóng duy nhất) → phòng thu hoạch → **luống sâu** (đoạn khó nhất: luống chìm vào void, dãy chuông, rễ sập chặn lối dễ, Poppy-Mound ở đường sai) nơi **ngọn đèn phía trước** hiện lần đầu → 9 bậc xuống The Cradle. Mood *Garden of Hush · hầm tối* + *Soi texture · sáng đều*; 6 điểm xuất phát, 14 khung camera; quái Play: F02 `skeleton_mage`, P01 `zombie`, P03 `bat`, P05 `zombie` + `spider`, P06 `brute`, W07 `spider`. Asset: 31 mã — glb 3 · procedural 3 · **blockout 25**.
- **Map 6 · `act1Cradle` — ASHLAR · Act I · base · The Cradle** (BIO-27, cell boss arena, 44 × 70 m, `src/env/act1/maps/cradle.js`, ghi chú `docs/act1-base/cradle.md`, mặt bằng `node scripts/act1-interior-preview.mjs cradle`): cầu thang 9 bậc từ Garden of Hush (vòm gothic, tường đá hầm + 1 mô-đun tường hầm GLB) xuống **lối 8 m giữa hai dãy cũi xương khổng lồ giống hệt nhau** chạy tiếp vào sương đen (giả vô hạn: mép `void`, sàn chìm vào đen, không tường), qua cặp màn lanh vào arena ⌀ 32 m: vòng cũi + màn lanh, **10 đèn ngủ trắng sữa đứng yên** (thanh **Đèn ngủ còn lại**: tắt dần từ sau boss về phía cửa; *Play: đèn tự tắt dần khi vào arena*), giường chăn chần dọn sẵn, chuông xương treo, nôi của Mercy, **Hospice Mother (B05)** blockout đúng sheet (cao 2.75H, tay 3H) + 8 bóng tay telegraph (overlay, *xem thử nhịp đánh*). Toàn bộ là ánh sáng Perfection (15 đèn thật + đèn nhân vật = 16, 1 đèn đổ bóng; khi đèn ngủ tắt, spot trên arena, quầng của vòng nôi ngoài và độ nâng sáng của scene tối theo — `followGroup`, nhóm đèn có `ambient`); quái Play: B05 `hollow_king`, P07 `brute`, P01 `zombie`, P05 `zombie` + `spider`, P03 `bat` (tên id ASHLAR trên HUD). 3 điểm xuất phát (S1 cầu thang phủ cả map), 8 khung camera. Asset: 11 mã — glb 1 · procedural 1 · **blockout 9**. **Engine trong nhà** (map 4–6): `src/env/act1/interior.js` (thuần; **định dạng plan ở đầu file**: phòng rect / poly / circle với mức sàn hoặc sàn dốc, mép `wall` / `void` / `none` theo cạnh, phòng kín `walled` + `openings` (gap · door · arch · window phát sáng, có thể kèm đèn), tường riêng, cầu thang / dốc, sân trong `sky`, painter lớp đất, structures / rows / rings / scatters theo mã KIT, đèn theo ngữ pháp + nhóm đèn tắt dần, marker, camps, đoạn / điểm xuất phát, route, khung camera có `yaw`, mood) → `interiorBuild.js` + `interiorBlockout.js` (THREE) → `Act1InteriorScene(app, mapId)` (`src/scenes/act1Interior.js`). **Thêm một map trong nhà:** `src/env/act1/maps/<mapId>.js` (export `PLAN` với `engine: 'interior'`, `KIT`, `ASSETS = assetList(KIT, PLAN)`, `MONSTERS`, `NPCS`, `TEXTURES`, `VFX`), một dòng trong `INTERIOR_MAPS` (`act1Interior.js`) và một dòng trong `src/scenes/index.js` (`act1<MapId>: { label: …, create: (app) => new Act1InteriorScene(app, '<mapId>') }`), chạy `node --test scripts/act1-interior.test.mjs` + mặt bằng + báo cáo. Đổi blockout sang GLB = `model: '<sample id>'` (+ `status: 'glb'`) trong KIT; mã asset chưa có concept là duy nhất theo map (`N-CR01…`).

**Vòng thay model 2026-10-22 (map 1–3, ngoài trời).** Def nào có `status: 'glb'` thì đặt model thật ở đúng cỡ của nó (`fit: 'native'`, chỉ dùng `scale` của điểm đặt, không kéo giãn từng trục) và `size` = khung bao của GLB, nên va chạm, đệm nền và nhãn theo model. Ba tùy chọn mới trong plan: `anchors` của def (điểm trên model, khung GLB: nến trong hũ, đèn, cửa sổ — ánh sáng bám vào đó khi model đứng trong map, rơi về điểm neo của blockout nếu model không tải được); lối ván `hidden: true` (vẫn đi được nhưng không vẽ ván: sàn của model là mặt nhìn thấy — bến đêm Fens); `composite` cho vật ở xa (Gentle House ở xa = dãy A18.4 + 11 đoạn tường A18.5 + khối tháp A11.4, file chung `src/env/act1/gentleHouseFar.js`). Blockout vẫn là đường lui khi một GLB lỗi. Quyết định dùng lại model cũ: `tmp/act1-base-maps/REUSE_CANDIDATES.md` mục *Decisions (outdoor)*; ảnh trước/sau: `docs/act1-base/shots/<map>/before-after.png`.

**Vòng thay kit A01–A14 (2026-10-22/23, map 1–3 ngoài trời).** Bộ model Act I mới (`assets/act1-kit/`, chuẩn bị bằng `scripts/prepare-act1-kit.py`,
bảng khớp `tmp/act1-base-maps/ACT1_KIT_FIT.md`) thay blockout và kit tạm A01–A08 trong `lychgate`, `fens`, `poppyReach` (ba map trong nhà do vòng
khác làm). Engine thêm:

- `deckTop` trong def một khúc lối ván là model (A01.2: mặt sàn cao 1,22 m trên đáy): các khúc GLB nằm nối đuôi nhau dọc lối (`deckPieces`; mỗi khúc chỉ
  giãn nhẹ theo chiều dài, mặt hở quay về camera), lối ván đặt `hidden: true` để chỉ còn là mặt đi; bè A07.5 cũng đặt mặt sàn model đúng sàn lối bè ẩn.
- `runs` nhận `dy` (đường đắp A06.1 chìm 0,35 m để mặt bằng đỉnh đê), `scale` (tỉ lệ đều: tường đá khô ×1,25, đập ×1,5) và def `module` (khoảng cách
  module ngắn hơn chiều dài model, để đầu đá lởm chởm của tường chồng lên nhau, không hở).
- Bảng `CUT` trong `prepare-act1-kit.py`: bản biến thể cắt bỏ phần hình chắn lối đi (`act1-a02-1-lychgate-open`: bỏ thanh ngang thấp 0,40–0,62 m ở lối
  sau lychgate); mọi đầu ra khác giữ nguyên từng byte.
- Id phụ khi một số chỗ phải giữ blockout còn chỗ khác đã có model: `A07.3-door`, `A07.4-walk` (fens), `A06.1-posts` (cột kè bờ kit tạm).

Giữ nguyên (lý do ghi trong note của def): A07.6 (cây chết kit tạm: model chờ dựng lại, blockout của nó cũng thành chữ thập), A08.2-stile, A08.5,
A08.3. Ghi chú từng map: mục "Vòng thay kit A01–A14" trong `docs/act1-base/<map>.md`; ảnh `shots/<map>/before-after.png` và `kit-*.png`.

**Vòng thay kit A01–A14 (2026-10-23, map 4–6 trong nhà).** Gentle House, Garden of Hush và The Cradle đã thay blockout bằng model kit: vòm
cloister, giường bệnh, bàn ăn, lò bếp, chân nến (A11); giường luống, khung mái vải, đèn ngủ hồng, hốc tường vòm rễ, luống anh túc, giá phơi
(A13, A08.6); và cả sáu model của Cradle (A14). Hai tùy chọn mới cho KIT trong nhà: `cut` (hộp trong khung GLB, bỏ các tam giác nằm trong hộp
— vòm cloister đã cắt tường lưng và tường đầu để lối đi sau dãy vòm vẫn đi được; mái của model mờ đi quanh nhân vật) và `globe` (phần phát sáng
đặt đúng lên kính đèn hoặc ngọn nến của model; đèn ngủ và nến vẫn sáng rồi tắt như trước). Còn để blockout: tháp cổng A11.4 (model không có lối
đi xuyên, cần dựng lại) và cột chuông A13.4 (trông như thập tự, chờ chọn bản gốc hay bản `-trim`). Chi tiết: mục "Vòng thay kit A01–A14" trong
`docs/act1-base/<map>.md`; ảnh `shots/<map>/before-after.png`.

**Vòng thay A21–A25 (2026-10-23, map 1–3 ngoài trời).** Các chỗ giữ chỗ `N…` (chỉ có trong LD, chưa có concept) của ba map ngoài trời nay là model
A21–A23 thật (`assets/act1-kit/`, bảng khớp `tmp/act1-base-maps/ACT1_KIT_FIT.md` mục "A21–A25"):

- `lychgate`: cửa hầm nhà Barrow N01 (A21.1), tường chắn đất đá lửa N02 (A21.2, dựng ×1,55 cho đủ cao 3,35 m), đống than bùn N04 (A21.3) và ghế
  canh mộ N10 (A21.4).
- `fens`: vòm đá nghiêng A17.1 (bản `-wide` của A21.5: hai phiến đá được kéo xoè ra để lối đi rộng 2,6 m, bản gốc chỉ hở 1,6–1,75 m), mộ đầm lầy
  N-FN03 (A21.6, thay mộ mới A16.4 đứng tạm), đôi giày N-FN02 (A22.1), cột thu tiền đò N-FN06 (A22.2) và hai nôi mây N-FN08 (A22.3).
- `poppyReach`: ụ đá người gặt N-PR02 (A22.4, thay hòn đá kit tạm), gậy chăn cừu và áo gấp N-PR03 (A22.5), búp bê rơm N-PR05 (A22.6), cây táo gai
  ruy băng N-PR04 (A23.2) và thêm đôi giày A22.1 dưới gốc nó. Ụ lúa bỏ dở N-PR01 vẫn là blockout (model A23.1 phải làm lại: lưỡi hái lơ lửng).

Cách đặt cần nhớ: mặt tường thật của một model có thể lùi sau khung bao của nó (gờ trên, dương xỉ ở chân, bậc thềm nhô ra); nếu đặt khung bao sát mép
một bậc địa hình thì sườn dốc trồi lên trước mặt tường và che mất phần dưới — tường N02 và cửa N01 nay đứng với mặt tường lùi vào trong sân 0,18 m.
Model có thân lệch khỏi tâm (cột thu tiền, cây táo gai) được dời sao cho đúng phần thân đứng lên điểm đặt cũ. Đường đắp A06.1 trên đê (lychgate,
fens) nay đặt cách nhau 3 m (def `module: 3.0`) nên các khúc nối liền nhau, không còn thành từng mảng rời có cỏ xen giữa. Test mới: mỗi def GLB mới
trỏ đúng sample có file, lối đi dưới vòm đá vẫn đi được, mặt đất không leo lên mặt tường hầm, cây táo gai đứng đúng gốc và nghiêng theo gió. Chi tiết:
mục "Vòng thay A21–A25" trong `docs/act1-base/<map>.md`; ảnh `shots/<map>/before-after.png` và `a2x-*.png`.

**Vòng thay A21–A25 (2026-10-23, map 4–6 trong nhà; theo ghi chú của vòng trong nhà, SPEC §9).** Gentle House: luống hoa vuông giữa sân (A23.3),
chậu hoa ×6 (A23.4), luống hoa có kè ×4 (A23.5), dây phơi vải (A23.6, cột đo trên mesh), bàn bếp (A24.1), giá bánh ×2 (A24.2, thay tủ ép A19.4 đứng
tạm) và bàn gấp vải (A24.3) — không còn blockout. Garden of Hush: ba vòm rễ (bản `-slim` của A25.1; KIT `cut` bỏ các rễ con thòng xuống lối đi),
cầu ván (A25.2), hai đống đổ chắn đường (A25.3), giỏ thu hoạch ×10, bộ đồ chăm luống, chăn trên giường luống (A24.4), đôi giày (A22.1 ×0,7) và chiếc
đèn của Tamsin (A25.6) đặt dưới sàn, đèn thật nằm trong lồng kính đo trên model. The Cradle: chăn A24.5 và gối A24.6 nằm trên lớp đệm của A14.5. Hai
điểm "Mercy" chờ quyết định: viền bẩn tối trên kè A23.3 và bông anh túc thêu trên A24.3 trông như vết nâu.

**Sáng hơn (2026-10-23, cả sáu map).** Người dùng thấy các map "hơi tối", nên mọi mood chơi được nâng sáng vừa phải. Sương và số đèn giữ nguyên.
Màu và grade cũng giữ nguyên, trừ Gentle House (xem đoạn dưới). Chỉ đổi `hemi`, `envI` và `exposure` (EV), thêm chút `sun.intensity` ở Night Fens (trăng)
và Poppy Reach, và `floorTone` ở ba map trong nhà. Mood *Soi texture · sáng đều* giữ nguyên.

Độ sáng trung bình trên màn hình của các khung mặc định tăng khoảng +27…+33 %. Riêng Gentle House tăng +24 % (phòng bệnh +27 %, bếp +23 %). Vùng tối
(p25) tăng nhiều hơn. Phần cháy sáng gần như không đổi: trung bình ≤ +0,02 điểm %. Cửa sổ phòng Mẹ Hawise vốn đã cháy; vũng sáng dưới cửa sổ rộng
thêm 1,0 điểm %. Night Fens và Prologue vẫn là đêm. Màu trắng Mercy / Perfection (giường, Hospice Mother, đèn bến đêm) sạch hơn mà không cháy. The
Cradle bớt bão hòa khoảng 15 %: đó là chủ ý, màu kem chuyển thành trắng sữa sạch.

**Gentle House, vòng sửa sau review.** Lần nâng đầu tăng `envI`, làm mood mặc định *trong nhà ấm* ngả màu be: ánh HDRI xám trung tính làm loãng ánh nến
vàng. Ở phòng bệnh, R/B giảm 1,65 → 1,44 và độ bão hòa giảm 20 %. Cách sửa:
- Mood `warm` giữ `envI` 0,1 và exposure 0,95 như cũ. Độ sáng lấy từ `hemi` ấm (0,85 → 3,3). `grade.saturation` tăng 0,96 → 1,03 để bù phần ACES
  làm nhạt màu khi khung sáng lên.
- Mood `rain` làm tương tự: `envI` 0,32, hemi 3,6, exposure 0,78, saturation 0,86 → 0,9.

Kết quả: R/B của phòng bệnh, bếp và phòng Mẹ Hawise lệch ≤ 2,5 % so với trước, độ bão hòa trong khoảng −3…+5 %. Khung cloister nhìn xa ấm hơn trước
(R/B +11 %). Exposure không tăng, vì nếu tăng thì vũng sáng dưới cửa sổ Hawise cháy quá giới hạn +1 điểm %.

`look` của scene Act I ngoài trời lên 2, của ba scene trong nhà lên 3 (do vòng sửa Gentle House). Lần đầu vào lại, scene xóa exposure / sương / grade
đã lưu (`scenePost` trong localStorage) để dùng giá trị mới. Nếu bật *Mood* toàn cục (tab Lighting → Mood, mặc định tắt), exposure của mood đó đè lên.

Giá trị cũ → mới và số đo từng khung nằm trong `tmp/act1-base-maps/BRIGHTNESS.md` (§5 là vòng sửa Gentle House). Ảnh:
`docs/act1-base/shots/act1-brightness-before-after.png` (mỗi map một khung) và `shots/<map>/bright-before-after.png`.

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
src/character/  preview nhân vật: điều khiển, animator, map clip, va chạm, trang bị, trượt chân, mốc tỷ lệ, khoét tường, dấu chân / sóng nước / cỏ (footsteps.js, stepper.js)
src/backends/   webgl/ (GLSL) và webgpu/ (TSL) — pipeline, hiệu ứng, VFX, compute
src/core/       thiết lập, renderer, asset, camera, grading, LUT + readability check, đăng ký shader
src/lookdev/    chế độ xem, vật tham chiếu, trình chỉnh texture
src/effects/    lược đồ hiệu ứng + bộ điều khiển phòng thí nghiệm shader
src/env/        texture forge, bộ kit Act I, lửa, terrain splat; valdren.js (bảng màu + khoá màu + kit Valdren / Redbound /
                Blightbeasts), signals.js (telegraph, vòng tương tác, bảng mẫu màu), groundBlend.js + contact.js (asset ăn vào đất),
                instancing.js (GPU instancing theo ô), atmosphere.js (hạt GPU trong không khí)
src/lighting/   rig studio, preset mood Act I (moods.js), bộ điều khiển mood (hero light, rim, mưa, chớp)
src/panels/     mỗi tab một file
src/procedural/ quái dựng bằng code cho gameplay: rig, nặn SDF, clip, dữ liệu bake
src/scenes/     studio, hai scene Dark Wood, bố trí biome, biome mix, dungeon (+ lớp cơ sở terrain.js)
src/shaders/    mọi file .glsl (sửa là nạp lại ngay)
src/vfx/        hệ hạt, đèn dùng chung, hình nộm, skill, VFX lab
```

Giấy phép tài nguyên bên thứ ba: [THIRD_PARTY_LICENSES.md](../THIRD_PARTY_LICENSES.md).
