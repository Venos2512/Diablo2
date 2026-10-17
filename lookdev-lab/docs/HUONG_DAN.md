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

---

## 2. Bố cục màn hình

- **Cột trái:** model mẫu, HDRI, đối tượng đang xem.
- **Giữa:** khung nhìn 3D. Góc trên trái là các nhãn (renderer, cảnh, chế độ xem). Góc trên phải là **HUD hiệu năng**
  (FPS, CPU, GPU, draw call, tam giác, texture, số hạt…) và biểu đồ thời gian khung hình.
- **Cột phải:** 7 tab — Lookdev, Lighting, Post & camera, Shaders, VFX, Environment, Performance.

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
   emissive, các thuộc tính Physical (clearcoat, transmission, sheen…).
5. **Studio environment**: đổi HDRI, xoay môi trường, nền mờ/sắc nét, sàn tối/xám 18%/trắng, bệ, bóng xám + bóng chrome,
   bảng màu ColorChecker.
6. **A/B compare (`C`)**: lần bấm đầu chụp ảnh A. Sau đó đổi bất cứ thứ gì — kể cả **đổi renderer** — rồi kéo thanh chia để so.

---

## 4. Tab Lighting và Post & camera

- **Lighting**: các rig studio (softbox, ba điểm, nắng, rim, nến, chỉ HDRI), nhiệt độ màu Kelvin, cường độ đơn vị vật lý,
  shadow (Basic/PCF/PCF soft/VSM, kích thước map, bias). Ở cảnh Act I, tab này điều khiển giờ trong ngày và đuốc.
- **Post & camera**:
  - Camera: Orbit tự do, Game ¾ (góc nhìn kiểu ARPG), **Isometric 2:1** (orthographic, như camera sprite cổ điển), Play.
  - AA: FXAA, SMAA, MSAA, **TRAA** (chỉ WebGPU).
  - Bloom, GTAO, sương mù theo độ cao, grade (cân bằng trắng, contrast, lift/gamma/gain, vignette, grain, quang sai).
  - **3D LUT**: chọn look có sẵn (Teal & orange, Bleach bypass, Sanctuary gloom) hoặc nạp file `.cube` từ Resolve/Photoshop.
    LUT áp sau tone mapping + sRGB (đúng cách các LUT sáng tạo được xuất ra).
  - **Retro preview**: xem ở 480p/600p với số mức màu giới hạn + dither — kiểm tra silhouette, đồ rơi và hiệu ứng còn đọc
    được ở độ phân giải thấp không.

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
- Bốn đèn point được đặt sẵn khi VFX lab bật (cường độ 0 khi rảnh) để tung skill không làm thay đổi số đèn
  — thay đổi số đèn sẽ khiến mọi material biên dịch lại.

---

## 7. Tab Environment

- **Studio · lookdev**: môi trường trung tính.
- **Act I · Burial grounds**: nghĩa địa ngoài trời — giờ trong ngày (đêm/hoàng hôn/u ám), gió cho cỏ và cây chết, mật độ cỏ, đuốc.
- **Act I · Catacombs**: hầm mộ — đuốc tường, chậu than, trần, bóng đổ của đuốc.
- **Texture forge**: các bộ texture PBR lát gạch (gạch đá, đá cuội, đất, cỏ, gỗ, sắt, đá phong hoá) được *nướng* từ công thức GLSL
  trong `src/shaders/forge/`. Sửa công thức khi đang chạy `npm run dev` → texture nướng lại ngay.

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
src/backends/   webgl/ (GLSL) và webgpu/ (TSL) — pipeline, hiệu ứng, VFX, compute
src/core/       thiết lập, renderer, asset, camera, grading, LUT, đăng ký shader
src/effects/    lược đồ hiệu ứng + bộ điều khiển phòng thí nghiệm shader
src/env/        texture forge, bộ kit Act I, lửa
src/panels/     mỗi tab một file
src/scenes/     studio, nghĩa địa, hầm mộ
src/shaders/    mọi file .glsl (sửa là nạp lại ngay)
src/vfx/        hệ hạt, đèn dùng chung, hình nộm, skill, VFX lab
```

Giấy phép tài nguyên bên thứ ba: [THIRD_PARTY_LICENSES.md](../THIRD_PARTY_LICENSES.md).
