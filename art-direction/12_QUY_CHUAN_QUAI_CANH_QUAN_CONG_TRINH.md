# 12 — Quy chuẩn: kích thước quái, bộ quái, tạo hình quái, cảnh quan, công trình

> Đây là **quy chuẩn sản xuất** để team làm theo. Phần lớn là **[Diễn giải AD]** suy ra từ quan sát Diablo II; các dữ kiện gốc được gắn nhãn riêng. Mọi con số là mặc định của dự án — được phép đổi, nhưng phải đổi ở đây trước, không đổi ngầm trong asset.

---

## 0. Đơn vị đo chung

| Ký hiệu | Định nghĩa | Gốc |
|---|---|---|
| **H** | Chiều cao hero đứng thẳng (không mũ, không vũ khí giơ cao) trên màn hình = **75 px** ở độ phân giải mục tiêu | 75 px [Đã xác minh — postmortem] |
| **Tile** | Ô sàn isometric 2:1. Bản gốc: tile sàn **160×80 px**, chia **5×5 subtile** (mỗi subtile 32×16 px) | [Quan sát — định dạng DT1; cần đối chiếu công cụ mod] |
| **Sub** | 1 subtile = đơn vị va chạm/đứng của nhân vật | [Quan sát] |
| **fps** | Animation phát ở **25 khung/giây** | [Quan sát — engine D2] |

Quy ước: mọi kích thước dưới đây ghi theo **H** (chiều cao) và **Sub** (chiếm chỗ dưới chân). Nếu dự án đổi độ phân giải, chỉ cần đổi giá trị px của H.

---

## 1. Kích thước quái

### 1.1 Bảng cấp kích thước

| Cấp | Chiều cao | px (H = 75) | Chiếm chỗ (Sub) | Ví dụ D2 [Quan sát] | Cảm giác |
|---|---|---|---|---|---|
| **XS — Sâu bọ** | 0.25–0.45 H | 19–34 | 1×1 | Quill Rat, dơi, giòi nhỏ | Bầy, phiền, chết nhanh |
| **S — Nhỏ** | 0.5–0.75 H | 38–56 | 1×1 | Fallen, Fetish, Imp | Láu nháo, đông |
| **M — Người** | 0.85–1.15 H | 64–86 | 1×1 | Zombie, Skeleton, Corrupt Rogue, Goatman | Ngang hàng hero |
| **L — Lớn** | 1.25–1.6 H | 94–120 | 2×2 | Brute/Wendigo, Overseer, Megademon | Nặng, đe dọa |
| **XL — Khổng lồ** | 1.7–2.3 H | 128–173 | 2×2 – 3×3 | Gargantuan Beast, Oblivion Knight, quái nhiệm vụ lớn | Mini-boss |
| **Boss** | 2.0–3.5 H | 150–260 | 3×3 | Andariel, Duriel (rộng), Diablo, Baal | Biểu tượng |

Ghi chú [Quan sát]: bản gốc quy định chỗ chiếm của quái bằng cột `SizeX/SizeY` (1–3) trong MonStats2. Cần đối chiếu bảng đó khi cần số chính xác cho từng quái.

### 1.2 Quy tắc kích thước

1. **Không phóng to quái tinh nhuệ.** Champion/Unique dùng **cùng kích thước**, phân biệt bằng palette, aura, tên màu. Không có phiên bản "to hơn 20%". [Quan sát + quy định]
2. **Mỗi cấp cách nhau rõ rệt.** Hai quái khác cấp phải khác nhau ≥ 25% chiều cao hoặc khác hẳn bề rộng — người chơi phân biệt vai trò bằng khối.
3. **Boss rộng hoặc cao, không cần cả hai.** Duriel thấp-rộng, Diablo cao-gầy. Chọn một trục để phóng.
4. **Quái bay** đo chiều cao từ bóng dưới đất tới đỉnh; điểm neo (anchor) đặt ở **bóng**, không ở thân.
5. **Trần trên của quái cỡ L trở lên ≤ 2.3 H** trong khu thường, để không bị cắt ở mép trên màn hình khi hero đứng giữa.
6. **Tầm đánh khớp với khối:** quái L có tay/vũ khí với tới ~1.5 Sub; quái S đánh gần ~1 Sub. Hình phải "giải thích" được tầm đánh.

### 1.3 Diện tích đọc được tối thiểu

- Silhouette tô đen của quái S trở lên phải nhận ra ở **kích thước thật**.
- Quái XS chỉ cần đọc được dạng chung + chuyển động; không đặt chi tiết nhận diện nhỏ hơn 3 px.
- Bộ phận tấn công (vũ khí, móng, miệng, tay phép) phải chiếm ≥ 10% silhouette trong khung tấn công.

---

## 2. Bộ quái (family) và đội hình

### 2.1 Cấu trúc một bộ quái

```
Gia đình (family)
 ├── Base rig/model — 1 bộ hình, 1 bộ animation
 ├── Biến thể palette 1…5 (tên khác, chỉ số khác, màu khác)       ← rẻ
 ├── Biến thể vai trò (cung / phép / giáo…) dùng chung khung xương ← trung bình
 ├── Super Unique — palette riêng + aura/thuộc tính                ← rẻ
 └── (tùy chọn) Biến thể hình mới                                  ← đắt, cần duyệt
```

[Quan sát: D2 dùng nhiều biến thể bằng palette, ví dụ Fallen → Carver → Devilkin → Dark One; Corrupt Rogue → Archer → Spearwoman dùng chung thân.]

### 2.2 Quy tắc bộ quái

| # | Quy tắc |
|---|---|
| 1 | Mỗi gia đình có **một vai trò chính** (bầy cận chiến, bắn xa, caster, nặng, đặc biệt). Biến thể không đổi vai trò cốt lõi trừ khi đổi vũ khí/tư thế rõ ràng. |
| 2 | **Biến thể palette tăng dần đe dọa:** nhạt/đất → nâu → đỏ → tím/lam/đen. Biến thể cao hơn bão hòa và tương phản hơn một bậc. |
| 3 | **Không dùng màu gameplay làm palette quái thường:** lục độc, lam lạnh, vàng điện chỉ dùng cho quái thật sự có thuộc tính đó. |
| 4 | Mỗi gia đình có **2–4 biến thể palette** trong toàn game; nếu cần nhiều hơn, xem xét gia đình mới. |
| 5 | Biến thể vai trò (cung/phép) phải đổi **tư thế chờ và tư thế tấn công**, không chỉ đổi vũ khí trong tay. |
| 6 | Gia đình phải mang **dấu văn hóa của Act sinh ra nó**; khi xuất hiện lại ở Act khác, chỉ đổi palette. |

### 2.3 Đội hình trong một vùng

Đề xuất [Diễn giải AD; D2 thường chọn vài loại quái ngẫu nhiên cho mỗi lần tạo vùng — cần đối chiếu `levels.txt`]:

| Vị trí | Vai trò | Ví dụ Act I |
|---|---|---|
| Lõi | Bầy cận chiến S/M | Fallen, Zombie |
| Hỗ trợ | Caster/hồi sinh | Fallen Shaman |
| Áp lực xa | Bắn xa | Quill Rat, Corrupt Rogue Archer |
| Nặng | Quái L | Brute |
| Điểm nhấn | Super Unique / tổ / bẫy | Bishibosh, Blood Hawk Nest |

Quy định:
- **3–4 gia đình mỗi vùng**, không hơn — người chơi phải học được hệ sinh thái của vùng.
- Trong một cảnh không có quá **2 quái cùng cấp L trở lên** ở khu thường.
- Mỗi gia đình trong cùng vùng phải khác nhau ít nhất ở **2 trong 3**: cấp kích thước, dáng di chuyển, palette chủ.
- Bầy cận chiến: 4–8 con/nhóm; caster đi kèm 1–2 con đứng sau.

### 2.4 Bảng kiểm kê bộ quái (mẫu)

| Gia đình | Vai trò | Cấp | Sub | Biến thể palette | Biến thể vai trò | Super Unique | Act |
|---|---|---|---|---|---|---|---|
| Fallen | Bầy cận chiến | S | 1×1 | 4–5 | Shaman (caster) | Bishibosh, Rakanishu | I |
| Corrupt Rogue | Người phản bội | M | 1×1 | 3–4 | Archer, Spearwoman | Blood Raven, Coldcrow | I |
| Brute | Nặng | L | 2×2 | 3–4 | — | Treehead Woodfist | I |

---

## 3. Tạo hình quái

### 3.1 Quy trình duyệt tạo hình

1. **Brief vai trò:** cấp kích thước, vai trò, Act, văn hóa, câu chuyện 1 dòng ("Rogue bị Andariel tha hóa").
2. **Thumbnail silhouette:** ≥ 6 phương án tô đen, duyệt ở kích thước thật.
3. **Đặt cạnh hero và 2 quái cùng vùng** → kiểm tra phân biệt.
4. **Concept màu:** dùng palette Act + palette biến thể (file 04).
5. **Bảng tư thế chính:** chờ, đi, tấn công, chết — vẽ ở 3/4 isometric đúng camera.
6. **Model/render thử 8 hướng** ở kích thước thật trên nền 3 vùng (sáng, trung, tối).
7. Duyệt bằng rubric file 09.

### 3.2 Năm gốc giải phẫu

| Gốc | Đặc điểm | Biến dạng cho phép |
|---|---|---|
| **Người** | Tỷ lệ 7–7.5 đầu | Gầy hoặc phì; da tái; tư thế lệch; vũ khí thật |
| **Thú** | Dựa trên thú thật | Phóng đại một bộ phận (gai, hàm, tay); bỏ đối xứng nhẹ |
| **Côn trùng/bò sát** | Nhiều chân, vỏ | Phóng to; vỏ bóng ướt |
| **Undead** | Người chết | Khớp lệch, thịt thiếu mảng, xương lộ; cử động giật |
| **Quỷ** | Lai người-thú | Sừng, gai, cơ phình, da nứt sáng; chỉ ở Act sau hoặc khu sâu |

**Quy tắc "một điều sai"** [Diễn giải AD]: quái Act đầu chỉ có **1–2 điểm sai lệch** so với dạng tự nhiên (Arreat Summit: quái vùng Western Kingdoms là "phiên bản méo mó, hung hãn của dạng tự nhiên" [Đã xác minh]). Càng về sau, số điểm sai càng nhiều. Act IV mới được phép hoàn toàn phi tự nhiên.

### 3.3 Quy tắc hình khối

- **Tỷ lệ đầu–thân** nói lên tính cách: đầu to = nhỏ, láu (Fallen); đầu nhỏ thấp = nặng, ngu (Brute); đầu cao = trí tuệ/caster (Vampire).
- **Trọng tâm:** quái nặng có trọng tâm thấp, chân rộng; quái nhanh trọng tâm cao, chân hẹp.
- **Điểm nhận diện chính** đặt ở **nửa trên** silhouette (đầu, vai, vũ khí) vì nửa dưới hay bị quái khác che.
- **Không có chi tiết bay lơ lửng mỏng** (dải vải, lông vũ dài) dưới 2 px — sẽ nhấp nháy khi render.
- Vũ khí cầm tay **tối đa 0.8 H** cho quái M; vũ khí to hơn chỉ cho quái L+.

### 3.4 Quy tắc màu và vật liệu quái

- **3 khối giá trị:** sáng (điểm nhận diện) – trung (thân) – tối (bóng/chi dưới).
- **Màu chủ của quái tương phản với nền vùng** nó sống: vùng lục → quái nâu-đỏ/xám; vùng cát → quái tối; vùng tuyết → quái tối hoặc lam đậm.
- Vật liệu theo bảng file 05: không bóng, không sạch.
- **Mắt/miệng phát sáng** chỉ dành cho caster, undead cấp cao hoặc quỷ — không cho mọi quái.

### 3.5 Animation: mode và tiêu chuẩn

Bản gốc dùng hệ mode cho quái (ví dụ NU chờ, WL đi, RN chạy, A1/A2 tấn công, SC phép, S1–S4 kỹ năng, GH trúng đòn, BL đỡ, KB bị hất, DT chết, DD xác…) [Quan sát — định dạng COF]. Postmortem ghi **14 nhóm animation**, chỉ Diablo dùng đủ [Đã xác minh].

| Mode | Bắt buộc | Khung đề xuất @25 fps [Diễn giải AD] | Ghi chú |
|---|---|---|---|
| Chờ (NU) | ✅ | 8–16, lặp | Có "thở" |
| Đi (WL) | ✅ | 8–12, lặp | Bước khớp tốc độ di chuyển — không trượt chân |
| Chạy (RN) | Tùy | 8–10 | |
| Tấn công 1 (A1) | ✅ | 12–18 | Anticipation ≥ 30% khung đầu; impact rõ |
| Tấn công 2 / Phép (A2/SC) | Theo vai trò | 12–20 | Caster: tư thế tay rõ |
| Trúng đòn (GH) | ✅ | 4–8 | Ngắn, đọc được |
| Chết (DT) | ✅ | 16–28 | Nặng, đa dạng giữa các gia đình |
| Xác (DD) | ✅ | 1 | Giữ trên sàn |
| Đặc thù (S1–S4) | Theo cơ chế | — | Hồi sinh, đẻ quái, đào đất… |

- **Hướng:** quái **8 hướng**, hero **16 hướng** [Đã xác minh].
- Điểm neo: giữa hai chân trên mặt sàn; cố định qua mọi mode.
- Hướng sáng bake: thống nhất cho toàn dự án (file 04).

### 3.6 Danh sách "cấm" khi tạo hình quái

- Quái cartoon, mắt to dễ thương, màu kẹo.
- Thiết kế phụ thuộc vào chi tiết khuôn mặt (không đọc được ở 75 px).
- Hai gia đình trong cùng vùng có silhouette gần giống nhau.
- Quái phát sáng toàn thân không có lý do thuộc tính.
- Nội tạng cận cảnh hoặc gore mang tính khoe khoang.

---

## 4. Cảnh quan (ngoài trời)

### 4.1 Lưới và khối xây

| Thành phần | Quy định |
|---|---|
| Góc nhìn | Isometric 2:1 cố định, không xoay |
| Đơn vị | Tile sàn 160×80 px = 5×5 Sub (theo bản gốc) |
| Hướng sáng | Một hướng duy nhất cho mọi tile và prop bake |
| Biến thể sàn | Mỗi chất liệu sàn ≥ 4 biến thể + chuyển tiếp sang 2 chất liệu lân cận |
| Ghép ngẫu nhiên | Biên tile trung tính; chi tiết kể chuyện đặt bằng prop riêng [pipeline ghép phòng module — Đã xác minh] |

### 4.2 Lớp cảnh quan (từ dưới lên)

1. **Sàn nền** — cỏ, đất, đá, cát, tuyết; độ tương phản nội bộ thấp.
2. **Chuyển tiếp** — mép cỏ/đất, đường mòn, vũng.
3. **Chi tiết sàn (decal)** — đá vụn, lá, máu, xương; không cản đường.
4. **Prop thấp (≤ 0.5 H)** — bụi, đá nhỏ, mộ thấp; có thể cản hoặc không.
5. **Prop cao (0.5–3 H)** — cây, tảng đá, cọc, bia; cản đường, có bóng.
6. **Vách/mép** — vách đá, mép vực, mép nước; ranh giới vùng chơi.
7. **Landmark (≥ 2 H hoặc độc đáo)** — cây khổng lồ, đá Cairn, tháp, đền.

### 4.3 Quy tắc mật độ và nhịp

| Quy tắc | Giá trị đề xuất |
|---|---|
| Đường đi chính rộng | ≥ 3 Sub (đủ hero + lính thuê + quái đi kèm) |
| Khoảng trống chiến đấu | Mỗi 1–2 màn hình có một vùng mở ≥ 8×8 Sub |
| Landmark | 1 cái mỗi 1–2 màn hình di chuyển (bài học Act IV "trống và giống nhau" [Đã xác minh]) |
| Prop cao che tầm nhìn | ≤ 25% diện tích màn hình |
| Decal kể chuyện | Cụm 3–7 vật, không rải đều |
| Cụm prop | Theo luật 1 lớn – 2 trung – 3+ nhỏ |

### 4.4 Ranh giới và đọc đường

- Ranh giới vùng chơi phải **tự nhiên** (vách, rừng dày, nước, hàng rào) — không có tường vô hình mà không có lý do thị giác.
- **Lối ra/vào** (hang, cổng, cầu thang) phải là điểm tương phản: miệng hang tối hơn, khung đá sáng hơn, có prop đánh dấu (đuốc, cọc, xác).
- Nước và vực: mép rõ, giá trị khác sàn ≥ 15 điểm.
- Cây/tảng đá có phần thân che hero → hero luôn hiện viền/được thấy (xem 5.4).

### 4.5 Cảnh quan theo Act (tóm tắt)

| Act | Sàn chính | Prop đặc trưng | Landmark mẫu | Ranh giới |
|---|---|---|---|---|
| I | Cỏ úa, bùn, đá rêu | Hàng rào gỗ, cây trụi, mộ, cọc xác | Đá Cairn, cây Inifuss, tháp | Vách đá, rừng dày |
| II | Cát, đá sa thạch | Xương thú, cột đổ, lều | Tàn tích thành, ốc đảo | Vách núi, cồn cát |
| III | Bùn, cỏ rừng, nước | Rễ, cây to, cầu gỗ, nhà sàn | Kim tự tháp bậc, tượng | Rừng rậm, nước |
| IV | Đá đen, dung nham, xương | Gai, xác, cột lửa | Phong ấn, cổng | Vực, sông lửa |
| V | Tuyết, đá, băng | Công sự, máy bắn đá, xác lính | Tượng Ancient, cổng đá | Vách núi tuyết |

---

## 5. Công trình

### 5.1 Tỷ lệ kiến trúc

| Thành phần | Kích thước | Ghi chú |
|---|---|---|
| Cửa đơn | Cao 1.3–1.5 H, rộng ≥ 2 Sub | Hero + lính thuê đi lọt |
| Cổng lớn | Cao 2–3 H, rộng ≥ 3–4 Sub | Cổng tu viện, cổng thành |
| Tường nội thất | Cao 1.5–2 H | Thấp hơn thực tế để giữ tầm nhìn |
| Tường ngoài/thành | Cao 2–3 H | Chỉ ở phía sau (bắc/tây màn hình) |
| Hành lang | Rộng ≥ 3 Sub | Catacombs có thể 3 Sub để tạo ngột ngạt |
| Phòng thường | ≥ 8×8 Sub | |
| Phòng boss | ≥ 20×20 Sub | Khung tranh cho boss |
| Cầu thang/lối xuống | Rộng ≥ 3 Sub | Phải là điểm sáng/tối khác biệt |
| Cột | Đường kính 0.5–1 Sub | Không đặt cột che lối đi chính |

### 5.2 Quy tắc che khuất

- [Quan sát] Bản gốc ưu tiên tường cao ở phía sau (trên-trái/trên-phải màn hình); tường phía trước thường thấp hoặc ẩn để không che nhân vật.
- **Quy định:** tường/công trình phía trước hero (nam/đông màn hình) cao **≤ 0.5 H** hoặc tự mờ/ẩn khi hero ở sau.
- Mái nhà ngoài trời: hero đi sau nhà phải hiện viền hoặc mái mờ.
- Không có công trình nào che **toàn bộ** hero quá 0.5 giây khi di chuyển bình thường.

### 5.3 Bộ module công trình (kit)

Mỗi phong cách kiến trúc cần:

| Nhóm | Thành phần |
|---|---|
| Tường | Thẳng (2 hướng), góc trong, góc ngoài, đầu tường, tường vỡ, tường thấp (phía trước) |
| Lối | Cửa, cửa vòm, cổng, cửa song sắt (mở/đóng), cầu thang lên/xuống |
| Sàn | Lát đá, gỗ, thảm; ≥ 4 biến thể; chuyển tiếp |
| Cấu trúc | Cột, vòm, trụ đỡ, xà |
| Nội thất chức năng | Theo loại phòng (xem 5.5) |
| Hư hại | Đống đổ nát, tường sập, lửa cháy, máu |
| Ánh sáng | Đuốc tường, nến, lò, cửa sổ |
| Landmark | 1–3 mảnh độc nhất cho mỗi khu |

### 5.4 Quy tắc lão hóa và hư hại

Mọi công trình có **3 lớp thời gian** [Diễn giải AD]:

1. **Xây dựng gốc** — phong cách văn hóa, vật liệu tốt, chạm khắc (cho thấy công trình *từng* đẹp).
2. **Thời gian** — mòn cạnh, rêu, nứt, phai màu.
3. **Thảm họa gần đây** — cháy, máu, xác, đồ đạc đổ, biểu tượng bị phá.

Tỷ lệ lớp 3 tăng dần khi vào sâu (theo thang kinh dị file 02). Inner Cloister lớp 1 rõ nhất; Catacombs lớp 3 phủ nhiều nhất.

### 5.5 Loại phòng và đồ nội thất

| Loại | Nội thất bắt buộc | Kể chuyện |
|---|---|---|
| Doanh trại | Giường, giá vũ khí, bàn, rương | Lính đã chết khi đang ngủ |
| Nhà tù | Buồng giam, song sắt, xích, gông | Tù nhân, dụng cụ tra tấn |
| Nhà thờ | Gian giữa, hàng ghế, bàn thờ, cột, kính màu | Bàn thờ bị ô uế |
| Hầm mộ | Hốc xác, quan tài, nến | Xác bị lôi ra |
| Lò rèn | Đe, lò, ống bễ, vũ khí dở | Lửa vẫn cháy |
| Thư viện/phòng phép | Kệ sách, bàn, sách mở | Nghi lễ dở dang |

### 5.6 Ngôn ngữ kiến trúc theo Act

| Act | Phong cách | Vật liệu | Hình học | Ánh sáng |
|---|---|---|---|---|
| I | Romanesque/Gothic sớm, tu viện quân sự; gỗ dân gian | Đá xám-nâu, gỗ sẫm, sắt | Vòm tròn/nhọn thấp, tường dày | Đuốc, nến |
| II | Ba Tư/Ai Cập/Bắc Phi | Sa thạch, gạch, vải | Mái vòm, cột, cửa vòm nhọn, khối vuông | Nắng; trong mộ: đuốc |
| III | Maya/Aztec [Đã xác minh] + nhà sàn | Đá chạm, gỗ ẩm | Bậc, khối nặng, phù điêu | Đuốc vàng trong ẩm |
| IV | Pháo đài thiên thần / kiến trúc quỷ | Đá lam / đá đen, xương | Đối xứng thánh / gai hữu cơ | Trắng lam / đỏ dung nham |
| V | Bắc Âu/Celt | Đá xám, gỗ, lông thú | Khối thấp chắc, đá chạm Celt | Lò rèn, đuốc trong tuyết |

---

## 6. Quy định bàn giao (áp cho quái, cảnh quan, công trình)

| Hạng mục | Quy định |
|---|---|
| Tên file | `act{N}_{loai}_{ten}_{bienthe}_{mode}_{huong}` — ví dụ `act1_mon_fallen_v02_A1_d3` |
| Nền | Trong suốt, không viền halo màu nền |
| Điểm neo | Giữa chân trên mặt sàn; cố định qua mọi frame |
| Bóng | Tách layer bóng nếu engine hỗ trợ |
| Kiểm tra | Ảnh chụp trong cảnh thật: nền sáng, trung, tối + cạnh hero + cạnh 2 quái cùng vùng |
| Kèm theo | Bảng thông số: cấp, Sub, số hướng, số frame từng mode, palette biến thể |

## 7. Checklist duyệt nhanh

**Quái**
- [ ] Đúng cấp kích thước, đo bằng H.
- [ ] Silhouette phân biệt với mọi gia đình cùng vùng.
- [ ] Vai trò đọc được bằng khối + chuyển động.
- [ ] Biến thể palette tăng đe dọa, không lấn màu gameplay.
- [ ] Đủ mode bắt buộc, 8 hướng, neo cố định.

**Cảnh quan**
- [ ] Đường chính ≥ 3 Sub, có vùng mở chiến đấu.
- [ ] Landmark mỗi 1–2 màn hình.
- [ ] Ranh giới có lý do thị giác.
- [ ] Ghép ngẫu nhiên không lộ đường nối.

**Công trình**
- [ ] Cửa ≥ 2 Sub, hành lang ≥ 3 Sub.
- [ ] Tường phía trước thấp/ẩn, hero không bị che.
- [ ] Đủ 3 lớp thời gian, đúng mức hư hại theo độ sâu.
- [ ] Đúng phong cách văn hóa Act.
