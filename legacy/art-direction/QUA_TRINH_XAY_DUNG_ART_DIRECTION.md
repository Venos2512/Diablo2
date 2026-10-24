# Quá trình xây dựng Art Direction

> Nhật ký từ phân tích Diablo II cổ điển → art direction cho game MMO cùng chủ đề → concept trại trung tâm → asset 2D.
> Cập nhật: 2026-10-17. Ghi lại *đã làm gì, quyết định gì, vì sao, và file nằm ở đâu*.

---

## Tổng quan các giai đoạn

| # | Giai đoạn | Kết quả chính | Thư mục |
|---|---|---|---|
| 1 | Nghiên cứu Diablo II | Dữ kiện đã xác minh từ nguồn Blizzard | — |
| 2 | Bộ art direction D2 | 11 chương + bảng màu | `legacy/art-direction/` |
| 3 | Đào sâu Act I | Chương 11 + color script | `legacy/art-direction/` |
| 4 | Quy chuẩn sản xuất | Chương 12 + bảng tỷ lệ | `legacy/art-direction/` |
| 5 | Tổng hợp | Tóm tắt một trang + bản gộp | `legacy/art-direction/` |
| 6 | Chuyển sang MMO | Danh sách giữ/đổi/thêm (trong hội thoại) | — |
| 7 | Trại trung tâm mood Blood Moor | Brief trại (trong hội thoại + BRIEF) | `legacy/art-output/mmo-hub-bloodmoor/` |
| 8 | Concept trại v1 → v3 | 3 lượt ảnh, chốt style v3 | `legacy/art-output/mmo-hub-bloodmoor/` |
| 9 | Asset 2D nhiều góc | Sheet turnaround cho từng asset | `legacy/art-output/mmo-hub-bloodmoor/assets_2d/` |

---

## Giai đoạn 1 — Nghiên cứu

**Yêu cầu:** "Research và tạo bộ tài liệu art director về visual, theme, mood, feel game Diablo 2."

**Nguồn chính đã đọc:**
- Postmortem Diablo II của Erich Schaefer (Game Developer, 10/2000), nguồn quan trọng nhất. Dữ kiện lấy được:
  - hero cao ~75 px;
  - render 3D → sprite, hero 16 hướng, quái 8 hướng;
  - 14 nhóm animation;
  - giáp ghép module tạo hàng trăm biến thể;
  - colored light và true transparency;
  - Act III tham chiếu Maya/Aztec;
  - Act IV phải làm lại vì "trống và giống nhau";
  - âm thanh "đóng góp rất lớn vào không khí".
- Phỏng vấn Matt Uelmen (Dread Central, Shacknews): guitar, folk-rock, bộ gõ, thu âm thật.
- Bài về D2R (Dexerto, Red Bull) và D4 (PCGamesN, câu "Darkness does not mean bleakness").
- Arreat Summit cho dữ liệu Act I (nhiệm vụ, quái, Super Unique); Diablo Wiki cho area level; Wikipedia cho soundtrack.

**Quyết định phương pháp:** gắn nhãn độ tin cậy cho mọi nhận định:
- **[Đã xác minh]** — có nguồn Blizzard;
- **[Quan sát]** — kiểm tra được khi chơi;
- **[Diễn giải AD]** — đề xuất của tài liệu.

Mọi mã HEX đều ghi rõ là màu xấp xỉ.

---

## Giai đoạn 2 — Bộ art direction Diablo II

**Kết quả:** `legacy/art-direction/00_README.md` → `10_NGUON_THAM_KHAO.md` và `palette_board.html`.

| Chương | Nội dung |
|---|---|
| 01 | Tầm nhìn một câu, 5 tính từ cảm giác, 6 trụ cột, thứ tự ưu tiên khi xung đột |
| 02 | Theme tha hóa, giọng kể Marius, 8 motif, thang kinh dị 1–5 |
| 03 | Mood từng Act, đường cong cảm xúc |
| 04 | Palette, cấu trúc 3 tầng giá trị sáng, light radius |
| 05 | Camera, shape language, vật liệu |
| 06 | Hero, gia đình quái, boss, animation |
| 07 | Vòng lặp một cú click, ngôn ngữ phép theo nguyên tố |
| 08 | UI, màu chữ loot, âm thanh |
| 09 | Nên/không nên, rubric 9 tiêu chí, red flag, 5 bẫy |
| 10 | Nguồn và độ tin cậy |

**Câu chốt của cả bộ:** *"Diablo II không tối, nó thiếu sáng."*

---

## Giai đoạn 3 — Đào sâu Act I

**Yêu cầu:** "Phân tích rõ Act 1 hơn."

**Kết quả:** `11_ACT1_PHAN_TICH_CHI_TIET.md` và `act1_color_script.html`.

**Điểm phân tích chính:**
- Act I chia ba chương: vùng quê bị bỏ rơi → vùng hoang sâu → tu viện bị ô uế. Tristram là nhịp *buồn* ở giữa.
- Tu viện đi "từ công cộng → linh thiêng → cái chết", tối dần và đỏ dần. Inner Cloister phải đẹp nhất.
- Blood Raven là hình ảnh tóm tắt theme.
- Quái Act I là "phiên bản méo mó của dạng tự nhiên".
- Bảng 15 vùng, 13 Super Unique, NPC trại, track nhạc, 9 tileset.
- 7 khoảnh khắc "10 phút đầu" ở Blood Moor.

---

## Giai đoạn 4 — Quy chuẩn sản xuất

**Yêu cầu:** "Thêm quy định về kích thước quái, bộ quái, tạo hình quái, cảnh quan, công trình."

**Kết quả:** `12_QUY_CHUAN_QUAI_CANH_QUAN_CONG_TRINH.md` và `scale_chart.html`.

**Quyết định chính:**
- Đơn vị đo **H** = chiều cao hero = 75 px, và **Sub** = ô chiếm chỗ.
- 6 cấp kích thước quái (XS → Boss). **Không phóng to quái tinh nhuệ.**
- Bộ quái = 1 bộ hình gốc + 2–4 biến thể palette + biến thể vai trò + Super Unique. Mỗi vùng 3–4 gia đình.
- Quy tắc "một điều sai" khi tạo hình quái.
- Cảnh quan 7 lớp; đường ≥ 3 Sub; landmark mỗi 1–2 màn hình.
- Công trình: cửa ≥ 2 Sub, tường phía trước ≤ 0.5 H, 3 lớp thời gian.

---

## Giai đoạn 5 — Tổng hợp

**Yêu cầu:** "Tổng hợp lại toàn bộ art direction."

**Kết quả:**
- `00_TOM_TAT_ART_DIRECTION.md`: tóm tắt một trang gồm 13 mục.
- `DIABLO_II_ART_DIRECTION_TONG_HOP.md` và `Diablo_II_Art_Direction.html`: bản gộp, sinh tự động bằng `tools/build_bible.py`.

**Phản hồi người dùng:** *"Tổng hợp lại trên này thôi, chưa cần đẩy thành html."*
→ Bài học: ưu tiên trình bày trong hội thoại; chỉ xuất file khi được yêu cầu. File HTML và script vẫn còn trong thư mục, có thể xóa.

---

## Giai đoạn 6 — Chuyển sang MMO

**Yêu cầu:** "Tạo art direction cho game MMO multiplayer cùng chủ đề — cần thay đổi gì?"

**Nguyên tắc:** *Giữ linh hồn* (theme, cảm giác, ánh sáng là tài nguyên); *đổi những gì phục vụ quy mô*.

**Thay đổi lớn:**
1. **Đọc được ở quy mô lớn:**
   - thứ bậc ưu tiên: cảnh báo đòn → bản thân → boss → đồng đội → quái → người lạ → môi trường;
   - VFX của người khác giảm còn 30–50%;
   - mã màu cảnh báo đòn riêng.
2. **Tối có nhịp:** thế giới mở có sàn độ sáng; chỉ dungeon mới tối kiểu D2. Bắt buộc có tùy chọn trợ năng.
3. **Thể hiện bản thân:** thang sức mạnh thị giác 5 bậc; cosmetic phải "tồn tại được trong thế giới"; sự kiện lễ hội lọc qua "lăng kính u ám".
4. **Thế giới liền mạch:** landmark để định hướng; thế giới thay đổi (tha hóa / giải phóng).
5. **Boss mới:** World Boss 5–10 H, Raid Boss 8–20 H, cảnh báo đòn bắt buộc.
6. Ngân sách hiệu năng, UI MMO, ưu tiên âm thanh, quy trình live service.

**Viết lại trụ cột:** thêm trụ cột 7 *"Người sống sót cùng nhau"*.

**4 quyết định còn chờ chốt:** camera (isometric hay góc thứ ba) · nền tảng · PvP · kiếm tiền bằng cosmetic.

---

## Giai đoạn 7 — Trại trung tâm mang mood Blood Moor

**Yêu cầu:** *"Ở phần trung tâm, tôi vẫn muốn có cái mood của Blood Moor."*

**Điều chỉnh:** bỏ đề xuất trước đó "thành phố sáng, ấm", thay bằng **tiền đồn bị vây trên đồng hoang**.

> *"Chiều tối mưa phùn trên đồng hoang. Sau hàng rào cọc, vài trăm người sống sót tụ quanh những đống lửa."*

**Quy tắc chốt:**
- **Lạnh bao trùm, ấm từng điểm:** lạnh ~80%, vũng lửa ~15%, điểm nhấn ≤ 5%. Mọi nguồn ấm phải có lý do.
- Sàn độ sáng giữ bằng ánh sáng trời xám, không bằng màu ấm.
- **Bố cục vòng đồng tâm:** rào → khu ngoài → vòng chợ → lửa trung tâm. Nghĩa địa nhỏ sát rào.
- Từ mọi điểm trong trại đều thấy rào, và qua rào thấy đồng hoang.
- Mỗi dịch vụ MMO "đội lốt" tiền đồn: chợ = lều và xe; ngân hàng = hầm đá cửa sắt; guild = doanh trại; dịch chuyển = waypoint đá lam (điểm lam duy nhất).
- **Mối đe dọa ở rìa:** thấy và nghe được nhưng không chạm tới. Sự kiện "Đêm vây hãm".
- Mức kinh dị 1–2. Trại đọc là **"đang chống cự", không phải "đã thua"**.
- Không người chơi nào được sáng hơn lửa trại.
- Thời tiết (âm u / mưa phùn / sương / mưa lớn) là công cụ chống nhàm thay cho việc đổi palette.

---

## Giai đoạn 8 — Concept trại (3 lượt)

**Công cụ:**
- Task con của Codex trong T3 **không có** công cụ tạo ảnh, nên đã dừng đúng như dặn, không vẽ bằng code.
- Chuyển sang gọi trực tiếp **Codex CLI** trên máy (`codex exec --enable image_generation`), đăng nhập bằng ChatGPT.
- Mỗi lượt có một file BRIEF riêng; ảnh mẫu đính kèm bằng `-i`.

### v1 — Painterly matte painting (`legacy/art-output/mmo-hub-bloodmoor/`)
6 ảnh 16:9: toàn cảnh isometric, quảng trường lửa, vòng chợ dưới mưa, rìa trại lúc chạng vạng, đêm vây hãm, sheet 4 công trình dịch vụ.

**Nhận xét:**
- Bắt đúng "lạnh bao trùm, ấm từng điểm".
- Ảnh 01, 04, 05, 06 đạt.
- Ảnh 02 có góc máy thấp; ảnh 03 quá nhiều đèn lồng.

### v2 — Theo ảnh ref in-game (`v2_ingame/`)
**Phản hồi:** người dùng gửi screenshot gameplay D2R (Amazon đánh Fallen trên đồng cỏ đêm): *"Sử dụng ảnh này làm mẫu."*

**Lấy từ ref:** camera chéo ~45–55°, chất render screenshot 3D trong engine, đêm, cỏ dày tối, vignette. **Không** lấy nhân vật hay quái.

**Nhận xét:**
- Camera quá gần: nhân vật ~1/3–1/4 khung.
- Quá ấm: vàng cam toàn khung.
- Quá nhiều đèn.

Lượt này dừng giữa chừng khi có 4 ảnh.

### v3 — Bản sửa (`v3_ingame/`), **STYLE ĐÃ CHỐT**
**Phản hồi:** *"Sửa mấy phần còn lệch, và detail texture đang quá cao, tôi muốn giảm detail texture."*

**Sửa:**
- Camera xa hơn: nhân vật ~1/6 khung.
- Nền lạnh-tối ≥ 75%; mỗi ảnh tối đa 1 nguồn sáng lớn và 2–3 nguồn nhỏ.
- **Giảm chi tiết texture:** mảng lớn, màu phẳng, cỏ thành cụm, bớt khoảng một nửa đồ lặt vặt, bùn phản chiếu bằng vài mảng mềm.
- Cửa hầm kho thành cửa sắt đặc.

**Kết quả:** đủ 6 ảnh. Nháp lưu ở `v3_ingame/_drafts/`.

**Điểm yếu còn lại:**
- Vài cảnh hơi trống và tối; nhân vật nhỏ khó đọc.
- Cổng chính thiếu cảm giác bị vây.

---

## Giai đoạn 9 — Asset 2D nhiều góc

**Yêu cầu:** "Tạo bản 2D các góc của asset xe, lều, cỏ, lửa trại, texture đất nền, tường gỗ, rào gỗ."

**Phản hồi giữa chừng:** *"Mỗi thứ gen 1 ảnh có đầy đủ các góc luôn, không cần gen lẻ."*
→ Gom brief từ 11 ảnh lẻ còn **7 sheet, mỗi asset một ảnh**.

**Quy cách sheet:**
- Nền xám phẳng #3A3A3A, ánh sáng studio trung tính.
- Mức chi tiết thấp theo style v3.
- Silhouette người cao 1.8 m để so tỷ lệ; không chữ.
- **5 góc chuẩn:** chính diện · cạnh bên · mặt sau · góc game (3/4 ~50–60°) · nhìn từ trên.

| Sheet | Nội dung | Trạng thái |
|---|---|---|
| `asset_01_cart_turnaround` | Xe hàng 5 góc; dùng làm chuẩn bố cục cho các sheet sau | ✅ Đạt |
| `asset_02_tent_sheet` | Lều 5 góc + 3 biến thể | ✅ Đạt |
| `asset_03_campfire_sheet` | Lửa trại 5 góc + 3 trạng thái | ⚠️ Đủ nội dung; đá tròn bóng, hơi stylized so với v3 |
| `asset_04_grass_sheet` | 6 cụm cỏ × 3 góc | ❌ Lá to bản như cây lá rộng, không phải cỏ đồng hoang |
| `asset_05_palisade_wall_sheet` | Tường cọc 6 module | ✅ Đạt; gỗ hơi sạch |
| `asset_06_wooden_fence_sheet` | Rào thấp 4 module × 3 góc | ✅ Đạt |
| `asset_07_ground_texture_sheet` | 3 texture nền + ô xem thử ở góc game | ⚠️ v1: tile cỏ là lá tròn, chưa liền mạch → **v2** (`_v2.png`): cỏ đồng hoang lá mảnh ✅. Tile được cắt ra và xử lý liền mạch bằng wrap blend → `ground_tiles_v2/` (512 px, độ phân giải nguồn thấp) |

**Nhận xét chung:** các sheet có xu hướng trôi về phong cách stylized/hand-painted, sạch hơn v3. Cỏ và texture cỏ cần gen lại theo hướng cỏ đồng hoang lá mảnh, thành mảng, úa xám.

---

## Bài học về cách làm việc

1. **Gắn nhãn độ tin cậy** ngay từ đầu giúp tài liệu dùng được cho sản xuất mà không lẫn suy đoán với sự thật.
2. **Ảnh mẫu in-game hiệu quả hơn mô tả bằng chữ.** Lượt v2 bám camera và chất render tốt hơn hẳn v1.
3. **Concept AI có xu hướng quá ấm và quá chi tiết.** Brief phải nêu con số cụ thể: tỷ lệ diện tích lạnh/ấm, số nguồn sáng, kích thước nhân vật trên khung, "bớt một nửa đồ phụ".
4. **Mỗi lượt gen cần copy ảnh ngay khi đạt.** Phiên làm việc có thể bị ngắt, và ảnh chỉ nằm trong `~/.codex/generated_images` cho tới khi được copy.
5. **Giữ một bản đạt làm chuẩn** (style v3, sheet xe) rồi đính kèm cho mọi lượt sau để style nhất quán.
6. Người dùng ưu tiên **xem kết quả trong hội thoại** và **gom gọn** (một ảnh mỗi asset, tóm tắt trong chat) hơn là nhiều file lẻ.

---

## Việc còn mở

- **Chốt 4 quyết định MMO:** camera · nền tảng · PvP · kiếm tiền. Camera ảnh hưởng nhiều nhất tới phần ánh sáng và trại.
- **Viết bộ art direction MMO thành thư mục riêng.** Gồm cả chương "Trung tâm — Tiền đồn Blood Moor", cập nhật theo style v3.
- **v3:** gen lại cảnh chợ (quá trống) và cổng (thiếu cảm giác bị vây).
- **Asset 2D:** duyệt 6 sheet còn lại; kiểm tra texture có thực sự liền mạch không.
- **Xác minh số liệu D2:** palette gốc (`pal.dat`), tile 160×80, 25 fps, `SizeX/SizeY`, area level các khu chưa có.
- **Dọn dẹp:** quyết định giữ hay xóa `Diablo_II_Art_Direction.html`, `DIABLO_II_ART_DIRECTION_TONG_HOP.md`, `tools/build_bible.py`.
- **Chưa commit git** toàn bộ thư mục `legacy/art-direction/` và `legacy/art-output/mmo-hub-bloodmoor/`.

## Bản đồ file

```
legacy/art-direction/
├── 00_README.md, 00_TOM_TAT_ART_DIRECTION.md
├── 01 … 12 (các chương)
├── QUA_TRINH_XAY_DUNG_ART_DIRECTION.md   ← file này
├── palette_board.html, act1_color_script.html, scale_chart.html
└── (bản gộp tự động) DIABLO_II_ART_DIRECTION_TONG_HOP.md, Diablo_II_Art_Direction.html, tools/

legacy/art-output/mmo-hub-bloodmoor/
├── BRIEF.md, README.md, 01–06 *.png            ← v1 painterly
├── v2_ingame/  BRIEF_V2.md, REFERENCE_ingame.png, v2_*.png
├── v3_ingame/  BRIEF_V3.md, v3_01–06 *.png, _drafts/   ← style đã chốt
└── assets_2d/  BRIEF_ASSETS.md, _refs/, asset_01–07 *.png
```
