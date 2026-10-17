# Tóm tắt Art Direction — Diablo II

> Bản một trang cho lead và người mới. Mỗi mục chỉ về chương chi tiết. Nhãn: **[XM]** đã xác minh từ nguồn Blizzard · **[QS]** quan sát trong game · còn lại là quy định/đề xuất AD.

## 1. Tầm nhìn

> **"Một thế giới trung cổ đang mục rữa từ bên trong, nơi ánh sáng là thứ xa xỉ — người chơi là ngọn đuốc nhỏ đi xuyên bóng tối, và mỗi con quái gục xuống là một phần thưởng."**

- **Diablo II không "tối" — nó *thiếu sáng*.** Bóng tối có nguồn, có giới hạn; thứ cần thấy luôn thấy được.
- **Cảm giác:** Nặng · Cũ · Cô độc · Bị đe dọa · Thỏa mãn.
- **Không phải:** fantasy anh hùng, cartoon, bão hòa, jump-scare, pháo hoa loot.

## 2. Sáu trụ cột và thứ tự ưu tiên → Ch.01

| Ưu tiên | Trụ cột | Một dòng |
|---|---|---|
| 1 | **Đọc được trong hỗn loạn** | Hero 75 px; 8 nhân vật + 30 quái + 100 đạn cùng lúc [XM] → silhouette và giá trị sáng gánh nhận diện |
| 2 | **Ánh sáng là tài nguyên** | Light radius là cơ chế; dungeon tối thật |
| 3 | **Hiện thực u ám** | Tỷ lệ gần thật, đồ có logic chế tác |
| 4 | **Mỗi vùng một văn hóa** | Nhận ra Act qua một ảnh chụp; Act III tham chiếu Maya/Aztec [XM] |
| — | **Tha hóa của cái thiêng** | Mọi biểu tượng thiêng đều bị chiếm, vấy máu, phản bội |
| — | **Vòng lặp phần thưởng đẹp** | Quái "chết kịch tính", "dòng phần thưởng liên tục" [XM] |

## 3. Theme, giọng kể, mức kinh dị → Ch.02

- Chủ đề: **sa ngã và tha hóa**, kẻ lang thang bị chiếm hữu, hành trình về phía đông, con người nhỏ bé, hy vọng mong manh.
- Giọng kể: lời thú tội của Marius; kể bằng môi trường hơn bằng chữ; **hiện thực trước, siêu nhiên sau**.
- 8 motif: xác như kiến trúc · lửa đơn lẻ · máu như sơn · cổng và ngưỡng · đá cổ khắc chữ · song sắt và xích · thiên nhiên chiếm lại · đổ nát sau chiến tranh.
- Thang kinh dị 1–5 (u buồn → bạo lực đã xảy ra → nghi lễ → thân xác biến dạng → địa ngục). **Mỗi Act leo từ thấp lên cao.** Gore có trọng lượng, không khoe khoang.

## 4. Năm Act → Ch.03, Ch.11

| | Act I | Act II | Act III | Act IV | Act V |
|---|---|---|---|---|---|
| Một câu | Chiều mưa ở vùng quê bị bỏ rơi | Trưa chói chang — lạnh dưới mộ | Mọi thứ rỉ nước và đang mục | Rơi vào bụng sinh vật đang cháy | Tuyết trên chiến trường còn khói |
| Văn hóa | Gothic châu Âu | Ba Tư/Ai Cập | Maya/Aztec | Quỷ dữ | Bắc Âu/Celt |
| Màu chữ ký | Xanh rêu xám | Vàng cát | Lục đầm lầy | Đỏ-đen dung nham | Trắng-lam băng |
| Màu kẻ lạ | Máu | Tím Arcane | Đỏ thịt Durance | Lam thiên đường | Lam ngọc Worldstone |

Nhịp mỗi Act: **thị trấn (thở) → hoang dã (khám phá) → dungeon (áp lực) → boss (đỉnh)**; đỉnh sau cao hơn đỉnh trước.

**Act I** (Ch.11): ba chương *vùng quê bị bỏ rơi → vùng hoang sâu → tu viện bị ô uế*; Tristram là nhịp buồn ở giữa; tu viện đi từ công cộng → linh thiêng → cái chết, tối dần và đỏ dần; Inner Cloister phải đẹp nhất; Blood Raven là hình ảnh tóm tắt theme.

## 5. Màu và ánh sáng → Ch.04

1. **Nền khử bão hòa, điểm nhấn bão hòa có lý do.** Diện tích: nền ~85%, nguồn sáng ~10%, màu kẻ lạ ≤ 5%.
2. **Ba tầng giá trị:** nền 15–35 · nhân vật 35–65 (sáng hơn nền ≥ 15) · lửa/phép/loot 70–100. Ngoại lệ sa mạc/tuyết: nhân vật tối hơn nền.
3. **Tối không bằng đen** — bóng ngả màu bổ sung của Act; đen tuyền chỉ ở rìa light radius.
4. **Màu là thông tin:** đỏ máu, lam mana/lạnh/portal, lục độc, vàng điện/hiếm. Không dùng làm trang trí gây nhầm.
5. **Ánh sáng là điểm, không phải phủ.** Phép là nguồn sáng (colored lights [XM]). Không god-ray, không bloom diện rộng.
6. Bản gốc: 256 màu, palette riêng mỗi Act [QS] → dự án true-color phải *tự áp* giới hạn này.

## 6. Hình khối, vật liệu, camera → Ch.05, Ch.12

- Isometric cố định; hero **75 px = 1 H**; hero 16 hướng, quái 8 hướng; pipeline 3D → render sprite [XM].
- **Silhouette trước, chi tiết sau** — mỗi quái phải nhận ra khi tô đen ở kích thước thật.
- Vật liệu: mỗi chất liệu một kiểu hư hại riêng; không chrome, không grunge phủ chung, máu đỏ đậm gần nâu.
- Duyệt **ở kích thước trong game**, không duyệt trên render lớn.

## 7. Nhân vật và quái → Ch.06, Ch.12

- Hero là **nguyên mẫu văn hóa**, không phải siêu anh hùng; giáp module light/medium/heavy, hàng trăm biến thể [XM]; giáp không được xóa silhouette lớp nhân vật.
- **Cấp kích thước:** XS 0.25–0.45 H · S 0.5–0.75 H · M 0.85–1.15 H · L 1.25–1.6 H · XL 1.7–2.3 H · Boss 2–3.5 H.
- **Không phóng to quái tinh nhuệ** — phân biệt bằng palette, aura, tên màu.
- **Bộ quái:** 1 bộ hình gốc → 2–4 biến thể palette (đe dọa tăng dần) + biến thể vai trò + Super Unique. Mỗi vùng **3–4 gia đình**, khác nhau ở ≥ 2/3: cấp, dáng di chuyển, palette.
- **Quy tắc "một điều sai":** quái Act đầu chỉ lệch 1–2 điểm so với tự nhiên; Act IV mới hoàn toàn phi tự nhiên.
- Boss: một ý niệm tội lỗi, silhouette độc nhất, phòng boss là khung tranh.
- Animation: trọng lượng trước tốc độ; anticipation rõ; hit recovery đọc được ở 75 px; chết đa dạng, xác ở lại.

## 8. Combat feel và VFX → Ch.07

- Vòng lặp: **click → lấy đà → impact → giật → chết → xác → đồ rơi (tiếng + nhãn màu)**. Thiếu một bước là hỏng cảm giác.
- Phép theo nguyên tố: **hình đọc được trước màu** (lửa cuộn, lạnh nhọn, điện gấp khúc, độc mây).
- Additive tiết chế; màn hình đầy phép vẫn phải thấy quái. Không rung màn hình liên tục.

## 9. UI, loot, âm thanh → Ch.08

- UI là **đá, sắt, da**, trầm hơn gameplay — khung tranh, không phải tranh.
- Loot: icon túi đồ nổi khối đẹp; **màu chữ + âm thanh rơi** gánh cảm xúc; không cột sáng cho mọi đồ hiếm.
- Âm thanh "đóng góp rất lớn vào không khí" [XM]; nhạc Uelmen: guitar, bộ gõ, thu âm thật, ambient công nghiệp [XM]. **Luôn duyệt animation kèm âm thanh.**

## 10. Cảnh quan và công trình → Ch.12

| Quy định | Giá trị |
|---|---|
| Đường đi chính | ≥ 3 Sub |
| Vùng mở chiến đấu | ≥ 8×8 Sub mỗi 1–2 màn hình |
| Landmark | 1 cái mỗi 1–2 màn hình (bài học Act IV [XM]) |
| Cửa / cổng | 1.3–1.5 H, ≥ 2 Sub / 2–3 H, ≥ 3–4 Sub |
| Tường trong / tường trước hero | 1.5–2 H / ≤ 0.5 H hoặc ẩn |
| Phòng boss | ≥ 20×20 Sub |
| 3 lớp thời gian | Xây gốc → thời gian → thảm họa gần đây (tăng dần khi vào sâu) |

## 11. Duyệt → Ch.09

**Quy trình 5 bước:** ảnh đen trắng → thu 25% → cảnh đông (≥ 20 quái + 3 phép) → so ref board Act → chạy kèm âm thanh.

**Rubric 9 tiêu chí (1–5):** đọc được · silhouette · giá trị sáng · palette Act · ánh sáng · vật liệu · theme · feel · kỹ thuật. Vertical slice cần trung bình ≥ 3.5, không tiêu chí nào < 3, *đọc được* và *giá trị sáng* ≥ 4.

**Red flag — dừng ngay:** hero lẫn vào nền · màu gameplay dùng làm trang trí · Act đổi tên được mà không ai nhận ra · boss không nổi nhất phòng · cảnh đẹp mà "không có gì đã xảy ra ở đây".

**5 bẫy khi làm giống D2:** quá tối · quá nâu · quá chi tiết · copy D3/D4 · coi D2 là pixel art.

## 12. Thứ tự sản xuất đề xuất

1. **Chốt quy chuẩn:** H, Sub, hướng sáng, palette Act I, rubric (Ch.04, 12).
2. **Vertical slice Act I:** Rogue Encampment + Blood Moor + Den of Evil + 1 tầng Catacombs; Fallen, Shaman, Zombie, Corrupt Rogue; 1 hero; UI + loot + âm thanh. Đạt 7 khoảnh khắc "10 phút đầu" (Ch.11 §12).
3. **Hoàn thiện Act I** theo color script 15 khung.
4. Mở rộng các Act theo bảng Ch.03, mỗi Act bắt đầu bằng ref board + palette + kit kiến trúc.

## 13. Việc còn phải xác minh

- Mã HEX: đều là xấp xỉ — trích từ `pal.dat` ACT1–5 nếu cần màu gốc.
- Tile 160×80 / 5×5 Sub, 25 fps, mode animation, `SizeX/SizeY`: đối chiếu công cụ mod / `MonStats2` / `levels.txt`.
- Area level của Crypt, Mausoleum, Forgotten Tower và chuỗi tu viện.
- Phân bố quái theo từng vùng và track nhạc theo vùng (ngoài "Rogue").
- Oral history USgamer chưa đọc được (503).
