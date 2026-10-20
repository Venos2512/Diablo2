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

### 4.6 Thứ tự bố trí asset trong biome

**[Diễn giải AD] — quy tắc sản xuất của dự án, không phải thông số gốc của Diablo II.** Mục tiêu: mỗi vật có lý do nằm ở đó, cảnh có mảng nghỉ, người chơi đọc được đường và giao tranh. Các dải dưới đây là điểm bắt đầu để duyệt bằng camera gameplay, không phải quota phải lấp đầy.

1. **Khóa vùng chơi trước:** đường chính, nhánh phụ, cửa, chỗ đứng tương tác, điểm spawn, vùng chiến đấu và mép nước. Trang trí không được làm hẹp các vùng này.
2. **Đặt khối lớn:** công trình, vách, cây lớn, đá chính. Chọn một điểm nhấn cho mỗi bố cục; ưu tiên khối cao ở phía sau màn hình.
3. **Đặt cụm có chức năng:** chỗ làm việc, nghỉ, tích trữ, săn mồi, nghi lễ. Đồ phụ thuộc đặt quanh vật chủ; không bốc ngẫu nhiên từ toàn bộ thư viện.
4. **Đặt dấu dẫn đường:** đuốc, biển, cọc, khung cửa. Kiểm tra hướng nhìn khi tiến đến từng điểm rẽ trước khi thêm chi tiết nhỏ.
5. **Phủ sinh thái:** đất → thảm cỏ thấp → bụi cỏ → cây bụi; mật độ theo ẩm, dốc, giẫm đạp, bóng công trình và mức tha hóa.
6. **Thêm dấu vết:** xương, lá, đồ vỡ, bùn, vết kéo. Chừa khoảng trống giữa các cụm rồi kiểm tra lại va chạm và che khuất.

Mỗi asset cần khai báo: biome/vùng con được dùng, vai trò (nền / vật cản / tương tác / nguy hiểm / dẫn đường), footprint, khoảng trống phía sử dụng, mặt trước, khoảng scale, chất nền hợp lệ và vật chủ nếu có. **Đặt không vừa thì bỏ hoặc đổi bố cục; không ép đủ số lượng.**

### 4.7 Cỏ tự nhiên: mảng lớn → cụm → bụi lẻ

- **Mảng lớn không đều:** dùng vùng cỏ nối nhau và khoảng đất trống, không phủ cùng mật độ toàn map. Trong một mảng, tâm dày hơn, rìa đứt đoạn, có lỗ đất trống; không dùng vòng tròn có viền rõ hoặc ô bàn cờ.
- **Cụm 3–7 bụi:** chia quanh tâm lệch, tán rộng hẹp khác nhau; một vài bụi nhỏ tách khỏi cụm. Không để tất cả cụm có cùng bán kính, hướng hoặc số bụi. Chừa khoảng cách tối thiểu giữa gốc để tránh chồng mesh.
- **Chiều cao có nhịp:** cỏ nền thường 0.08–0.20 H; cỏ mép 0.20–0.35 H; cỏ cao hơn chỉ ở vùng không che combat. Bụi cùng cụm gần màu nhau; biến thiên sắc độ theo mảng ẩm/khô, không đổi màu ngẫu nhiên từng lá.
- **Mép đường:** cỏ dày ở vai đường rồi thấp, thưa dần về vệt giẫm. Đường xe có thể có dải cỏ thấp giữa hai vệt bánh, nhưng không có bụi cao mọc trong vệt bánh. Mép cỏ phải gãy, tránh hai hàng viền song song đều tăm tắp.
- **Địa hình:** giảm cỏ trên dốc, đá trơ, bùn bị giẫm và đất nhiễm huyết; không đặt cỏ đồng trên mặt nước. Bờ ẩm dùng cụm riêng, không mặc định nơi ướt nhất là nơi cỏ dày nhất.
- **Chân prop:** cỏ bám ngoài đá, chân hàng rào và góc ít người đi; không xuyên chân tường, đá hay sàn nhà. Tạo một ít đất lộ ở chân để asset có cảm giác cắm xuống đất.
- **Vùng đọc gameplay:** cửa, chỗ tương tác và spawn không có cỏ cao; arena dùng thảm ngắn, thưa. Cỏ trang trí không có collision và không dùng màu/glow giống loot.
- **Kiểm tra từng bụi:** sau khi lệch vị trí khỏi tâm cụm, phải kiểm tra lại chất nền, nước, đường và footprint tại vị trí cuối. Tâm hợp lệ không có nghĩa cả cụm hợp lệ.
- **Quy luật riêng:** ruộng có hàng do con người trồng, nhưng thiếu cây và gãy đoạn; không áp quy tắc hàng này cho đồng hoang.

### 4.8 Prop: có chỗ đứng, có hướng sử dụng

| Nhóm | Quy tắc đặt | Lỗi cần loại |
|---|---|---|
| Đá, cây | Một khối chủ + khối phụ khác cỡ; chân theo địa hình, đá chìm một phần; cụm tạo mép và khung cảnh | Các tảng bằng nhau cách đều, đá lơ lửng, cây mọc xuyên đá |
| Bàn, ghế, giá, thùng | Sắp theo người sử dụng: ghế hướng vào chỗ nghỉ; giá đồ cạnh chỗ làm; thùng sát kho/tường | Mọi mặt trước đều quay về camera; bịt cửa; ghế không có chỗ ngồi vào |
| Đồ đổ vỡ | Có nguồn: xe lật, mái sập, bao rách; vật nặng gần nguồn, mảnh nhẹ xa hơn | Mảnh vỡ không liên quan vật liệu hoặc rải khắp biome |
| Lều, hàng rào | Theo nền đất và lối ra vào; khoảng hở phải đi qua được; lều có vùng trống trước cửa | Dây/cọc cắt đường; hàng rào trông hở nhưng collision kín |
| Vật tương tác | Chừa chỗ tiếp cận và đứng dùng; silhouette riêng; dấu tương tác theo luật gameplay | Đồ phụ che rương/đền, xương trang trí sáng như vật bấm được |

Quy tắc “1 lớn – 2 trung – 3+ nhỏ” ở §4.3 là nhịp tham khảo, không phải khuôn nhân bản. Vật tự nhiên có thể xoay tự do quanh trục đứng; đồ nhân tạo bám trục công trình, chỉ lệch nhẹ nếu cũ/hỏng. Không kéo giãn skull, cửa, ghế để tạo biến thể. Sprite có ánh sáng bake chỉ dùng hướng đã xuất, không xoay/lật làm sai hướng sáng.

Footprint phải tính sau xoay và scale. Phân biệt **vùng chiếm chỗ**, **vùng thao tác** và **vùng che camera**; mesh không va chạm vẫn có thể che loot hoặc telegraph. Dời prop trong một bán kính nhỏ quanh mục tiêu; nếu dời ra khỏi câu chuyện gốc thì bỏ.

### 4.9 Đuốc chỉ đường: điểm quyết định trước, khoảng cách sau

- **Đặt nơi người chơi cần quyết định:** trước ngã rẽ, cạnh cổng, đầu cầu, chỗ đường bị khuất; đặt một dấu xác nhận sau rẽ khi dấu trước không còn nhìn được. Đuốc nằm trên vai đường, không trong lòng đường hay cửa.
- **Tuyến có nhịp sáng–tối:** đoạn thẳng dễ đọc không cần cắm thêm đuốc đều nhau. Khoảng cách xét theo tầm thấy ở camera và sương thực tế, không chỉ theo mét. Một điểm quyết định thường cần 1 nguồn; cặp đuốc dành cho cổng quan trọng.
- **Đọc được cả khi không nhìn thấy lửa:** cột, bệ, biển và hình đường cùng chỉ hướng; không dựa riêng vào màu cam. Tại ngã ba, vị trí đuốc và hướng biển phải thống nhất, không vô tình làm nhánh cụt giống tuyến chính.
- **Có người duy trì:** dùng đuốc trên đường/trại/công trình có dấu cư trú. Hang thú và đồng hoang dùng đá, cây, dấu chân, xác làm mốc; không tự sinh đuốc trong hang thú chỉ để lấp vùng tối.
- **Ý nghĩa nhất quán:** ánh đuốc là dấu có người qua lại, không tự động bảo đảm an toàn. Lửa gây sát thương cần hình dạng và telegraph riêng; lửa dẫn đường không được giả làm hazard.
- **Giữ tương phản:** quầng sáng nhỏ, còn khoảng tối giữa các mốc; không để bloom che mặt đường, quái hoặc viền đòn. Chỉ nguồn quan trọng mới cần bóng động; kiểm tra ngân sách đèn trên từng renderer.

### 4.10 Xương, xác và dấu vết: kể một sự kiện

1. **Chọn nguyên nhân trước khi chọn asset:** thú ăn mồi → xương thú, vết kéo, lông; cướp trại → đồ cá nhân, vũ khí gãy, xác; mộ bị đào → đất mới, nắp vỡ, hài cốt; nghi lễ → bố trí có chủ ý. Không trộn tất cả vào cùng cụm.
2. **Một điểm chính + 2–6 mảnh phụ:** lồng ngực hoặc sọ là điểm chính; mảnh phụ lệch về một phía, một vài mảnh xa hơn theo hướng kéo. Giữa các sự kiện phải có khoảng nền sạch. Không rải sọ như sỏi hoặc đặt mọi sọ ngửa mặt về camera.
3. **Phân bố theo vật chủ:** tập trung cạnh bàn mổ, miệng hang, xác hay mộ vỡ. Các cụm dọc đường kéo nhỏ và thưa dần khi xa nguồn; không trải xương đều toàn bộ lối thú đi.
4. **Tiếp đất:** xương nằm theo dốc nhỏ, bám đất và chìm nhẹ; có bùn/lá hoặc cỏ thấp quanh mép. Xương nhỏ không cản bước; đống lớn có collision phải đọc thành khối cản rõ.
5. **Cũ và mới phải khớp:** xương khô đi với máu cũ tối, đất bám; thịt mới/vết máu ướt cần lý do mới xảy ra. Không thêm máu tươi vào mọi xương cho nổi.
6. **Không tranh tín hiệu gameplay:** ngà bẩn, khử bão hòa, không glow. Với The Dying Gods dùng giới hạn xương trang trí **L* ≤ 65, C* ≤ 12** theo tài liệu 13; xác có thể tương tác/hồi sinh phải có dấu hiệu riêng của cơ chế.

### 4.11 Điều chỉnh theo vùng con

| Vùng | Cỏ và khoảng trống | Prop / dấu vết | Dẫn hướng |
|---|---|---|---|
| Đồng hoang | Mảng lớn thấp, cụm dày ở mép đá; giữ vùng combat thoáng | Đá, cành, hàng rào đứt; xương rất thưa, có nguồn | Hình đường và landmark; đuốc chỉ ở tuyến có người |
| Nông trại bỏ hoang | Cỏ ở góc tường; sân bị giẫm; ruộng có hàng đứt | Đồ nghề cạnh chỗ làm, đồ rơi gần cửa/xe | Đèn cửa, đuốc lối vào, khoảng sân mở |
| Trại địch | Đất trống quanh lửa, lều và chỗ tụ tập | Đồ cướp, da, xương cạnh khu xử lý; dấu nguy hiểm phân biệt decor | Đuốc cổng và lối chính, không đồng nghĩa an toàn |
| Hang thú | Cỏ thấp/gãy trên lối mòn, mép ngoài dày hơn | Xác + xương + lông tập trung ở nguồn, không có đồ nghi lễ tùy tiện | Vết kéo, hình khối cửa hang; không đuốc nhân tạo |
| Nghĩa địa | Cỏ ở khe và mép mộ, lối đi thưa | Mộ có hướng bố trí văn hóa; xương chỉ ở nơi bị xâm phạm | Cổng, nến/đèn ở mộ quan trọng |
| Bờ nước / đất nhiễm huyết | Chuyển tiếp có bề rộng, không cắt thẳng; loại cỏ trên nước/tha hóa mạnh | Đồ trôi theo mép nước; dấu tha hóa theo nguồn | Bờ và điểm vượt đọc rõ, không dùng clutter để giấu mép |

### 4.12 Triển khai và duyệt trong Lookdev Lab

Scene áp dụng đầu tiên: **Act I · Weeping Fields**. Scene dùng mét trong world; H/Sub ở tài liệu là quy ước hình ảnh và chiếm chỗ, **không quy đổi 1 Sub = 1 m**. Thông số triển khai nằm ở `lookdev-lab/src/env/biomePlacement.js` và bố cục ở `lookdev-lab/src/scenes/weepingFields.js`; thuật toán bố trí tổng quát (đúng thứ tự §4.6, kiểm tra theo §4.12) nằm ở `lookdev-lab/src/env/biomeLayout.js` — xem §4.13.

- Sinh theo seed ổn định. Mỗi nhóm (cỏ, prop, xương, đuốc) có seed riêng để sửa một nhóm không xáo cả cảnh.
- Mask loại trừ luôn thắng mật độ: đường/cửa/tương tác → footprint → nước/dốc/tha hóa → phân bố cụm. Kiểm tra tại vị trí cuối, kể cả phương án asset dự phòng.
- Giới hạn số lần thử và số instance. Không có chỗ thì ghi nhận/bỏ; không mở rộng vô hạn bán kính tìm chỗ.
- Kiểm tra ở cả **Night** và **Overcast**, camera chơi và thang xám; bật **class view** để phân biệt vật cản / trang trí / tương tác / nguy hiểm.

Checklist duyệt một tuyến từ waypoint → nông trại → đồng cỏ → hang thú:

- [ ] Đi lọt mọi cửa, vai đường và khoảng giữa prop; chỗ đứng tương tác không bị chiếm.
- [ ] Cỏ có mảng dày/thưa và khoảng đất trống; không tạo hàng ngoài ruộng, không xuyên prop/nước hoặc che telegraph.
- [ ] Từng điểm rẽ có tín hiệu đọc được từ hướng tiếp cận; đuốc không tạo đường giả vào ngõ cụt.
- [ ] Mỗi cụm xương/đồ vỡ giải thích được bằng một sự kiện và một vật chủ gần đó.
- [ ] Khi tắt VFX/glow vẫn phân biệt được tuyến đi và vật tương tác; đêm không cần tăng gamma để tìm đường.
- [ ] Tăng mật độ vẫn giữ vùng cấm; đổi seed/rebuild không làm mất hành lang; giảm mật độ về 0 không còn cỏ tương ứng.
- [ ] Kiểm tra cả bộ kit đầy đủ và fallback; không có prop lơ lửng, chồng nhau hoặc đổi vai trò collision.
- [ ] Kiểm tra frame time, số đèn và overdraw ở góc đông nhất trên WebGL2 và WebGPU trước khi duyệt hiệu năng.

### 4.13 Thuật toán bố trí asset (triển khai)

**[Diễn giải AD] — cách máy hóa §4.6–4.12; không thêm quy tắc mới.** Một engine thuần dữ liệu, không phụ thuộc renderer, nhận *plan* (đường, cửa, vùng tương tác, khối chính, vật chủ, sự kiện) và *catalog* (khai báo asset, công thức cụm, dấu vết, chính sách dẫn đường, hồ sơ vùng con) rồi trả về danh sách vật + lớp cỏ + báo cáo. Engine chỉ **đặt** và **tự kiểm tra các điều đo được**; việc duyệt bằng mắt trong §4.12 vẫn bắt buộc (xem bảng cuối mục).

| Việc | Tệp |
|---|---|
| Engine: `layoutBiome(plan, catalog, options)`, `validateLayout(plan, result, catalog)`, hình học (OBB/SAT, đoạn↔đa giác), luồng seed, `UNITS`, `LAYOUT_RULES` | `lookdev-lab/src/env/biomeLayout.js` |
| Dữ liệu: khai báo asset, cụm, dấu vết, dẫn đường, hồ sơ vùng con, `buildCatalog` | `lookdev-lab/src/env/biomeCatalog.js` |
| Kích thước đo từ GLB (bbox, chiều cao, đế thân cây) — `npm run measure:kits` | `lookdev-lab/scripts/measure-kits.mjs` → `src/env/kitSizes.json` |
| Plan mẫu 128×128 m đủ mọi vùng con và mọi quy tắc + hàm đất thuần | `lookdev-lab/src/env/biomeLayoutDemo.js` |
| Kiểm thử — `npm run test:layout` (15 hạng mục nghiệm thu + hạng mục hồi quy 8b, 16–22b, 23 + hiệu năng) | `lookdev-lab/scripts/biome-layout.test.mjs` |
| Ảnh duyệt nhìn từ trên xuống (SVG/HTML) — `npm run preview:layout` | `lookdev-lab/docs/biome-layout-preview.html` |

Scene 3D xem kết quả: lab → "Act I · Bố trí biome (thuật toán)" (`lookdev-lab/src/scenes/biomeLayout.js`), HUONG_DAN §7h.

#### 4.13.1 Đơn vị: H và Sub không phải mét

§0 và §4.12: H, Sub là quy ước hình ảnh/chiếm chỗ, **không** quy đổi 1 Sub = 1 m. Engine nói mọi thứ bằng **mét** trong world của lab; hero cao `UNITS.H = 1.8 m` (`darkWood.js`, SCALE). Cạnh nền của một subtile 32×16 px (hình thoi) là 32/√2 ≈ 22,6 px; hero 75 px trên màn hình ứng với 75 / cos 30° ≈ 86,6 px dọc trục nền, nên **1 Sub ≈ 22,6 / 86,6 ≈ 0,26 H ≈ 0,47 m** (`UNITS.SUB`). Các quy tắc ghi theo Sub trong AD (đường chính ≥ 3 Sub, cửa ≥ 2 Sub, vùng chiến đấu ≥ 8×8 Sub, khe lọt ≈ 2 Sub) được đổi một lần ở đó (≈ 1,41 / 0,94 / 3,76 m / 0,94 m) và mọi nơi khác chỉ đọc mét. Quy ước tọa độ: x hướng đông, z hướng nam; camera nhìn từ đông nam về tây bắc (`forward` = (−1, −1)/√2, pitch 30°, màn hình ortho cao 12 m → sâu 24 m, rộng 21,3 m); yaw = xoay quanh +y của three.js, mặt trước của vật là **+z cục bộ** nên `yawFacing(dx, dz) = atan2(dx, dz)`.

#### 4.13.2 Pipeline ↔ §4.6

| Bước | Luật gốc | Engine làm gì |
|---|---|---|
| 0 | §4.12 | Chuẩn hóa plan: vùng con, chỉ mục đoạn đường/nước (băm lưới, khoảng cách chính xác), băm footprint, camera, cửa sổ màn hình. |
| 1 · Khóa vùng chơi | §4.6.1, §4.3, §4.4 | Hành lang đường (tim ± nửa bề rộng), hành lang trước cửa, vùng đứng tương tác, spawn, arena, nước + bờ. Cảnh báo plan: đường chính < 3 Sub, cửa < 2 Sub, arena < 8×8 Sub. Mọi bước sau coi đây là loại trừ cứng. |
| 2 · Khối lớn | §4.6.2, §4.8, §4.3, §5.2 | Khối do plan đặt (nhà, vách — footprint+chiều cao hoặc asset) **luôn được ghi nhận, kể cả khi vi phạm** (tác giả quyết; chỉ cảnh báo `authored.conflict`) và không bị luật che camera từ chối; rồi khối tự động: điểm blue-noise, chấm điểm (phía sau màn hình · khung cảnh · nhiễu), mỗi bố cục = 1 chính + 1–3 phụ khác cỡ lệch về một phía (mảnh phụ chọn trong bộ phụ sao cho **scale kẹp trong khoảng của chính nó** vẫn nhỏ hơn khối chính; không mảnh nào đủ nhỏ thì bỏ), đá chìm ~15 % và nghiêng theo dốc, đá rêu ở chỗ ẩm. Vùng che camera của vật cao = footprint quét theo `forward` một đoạn `cao / tan(pitch)` (cây: hộp mesh đầy đủ đã scale, tính cả tán); từ chối vật có vùng che **chồng lên** cửa/vùng tương tác/spawn/arena (khoảng cách có dấu: chồng nhau là âm; ngoại lệ duy nhất: cột/đuốc của chính cửa đó dựng ở vai hành lang, được sượt qua hành lang ấy) hoặc che quá `occludePathMax` đường gần; **tỷ lệ che trong mọi cửa sổ màn hình được giữ ≤ 25 %** ngay khi đặt (khối do plan đặt vẫn tính vào tỷ lệ nhưng không bị từ chối — validator báo nếu vượt). Nhịp landmark: mỗi cửa sổ 1–2 màn hình dọc đường chính có một vật ≥ 2 H nhìn thấy từ đường — chỉ lấy mảnh có `cao × scale tối đa ≥ 2 H`, scale kẹp trong khoảng của nó, cách xa vật chủ/sự kiện đã lên kế hoạch ≥ `hostKeepOut` (thiếu thì thử đặt, không được thì cảnh báo `landmark.missing`). Một điểm nhấn lớn nhất cho mỗi màn hình. |
| 3 · Cụm chức năng | §4.6.3, §4.8, §4.3, §4.11 | Mỗi vật chủ (`plan.hosts`) đặt vật chủ rồi các thành viên **chỉ lấy từ công thức** của nó, theo ô trong khung vật chủ (trước / sau / bên / vòng / gần / điểm nghỉ), ngoài vùng sử dụng. Phương án dự phòng (`fallback`) **chỉ dùng khi mọi phương án của mục công thức đều thiếu trong scene**; mảnh không vừa thì thử vị trí khác hoặc bỏ, không đổi sang mảnh khác, và dự phòng giữ nguyên collision, vai trò, lớp. Khối do plan đặt làm vật chủ (`hosts[].mass`) là **một phần của cụm**: thành viên được sát tường (chỉ cần `clusterGap`), cụm khác thì không. **Đất trống giữa các cụm:** mảnh không phải decal của hai cụm khác nhau cách nhau ≥ `clusterClear` và không nằm trong bán kính `bare` quanh điểm nghỉ của vật chủ khác; hai vật chủ cách nhau ≥ `clusterSpacing`. Hướng: ghế quay vào điểm nghỉ, đồ nhân tạo bám trục vật chủ (k·90° ± lệch nhẹ nếu cũ), đồ tự nhiên/vụn xoay tự do. Số lượng rút theo khoảng để cụm khác nhau. Vật chủ giữ vùng tương tác (`owns`): vật cản của cụm đứng ngoài vùng ấy, vật đi xuyên (nến) được đứng trong. Mỗi cụm ghi `sizeMix` (lớn/trung/nhỏ); cụm ≥ 4 mảnh không có nhịp cỡ thì cảnh báo `cluster.sizeMix`. |
| 4 · Dẫn đường | §4.6.4, §4.9 | Điểm quyết định: do plan khai + tự nhận (cổng/lối vào, ngã ba, chỗ đường cắt nước, khúc cua khuất > ~35° trong ~8 m). Dấu theo chính sách của vùng (đuốc/biển ở nơi có người; cột/totem ở trại địch; chỉ đá–cây–xác ở đồng hoang/hang thú, **không đuốc trên lối thú**), nằm trên vai đường 2–4 m trước điểm quyết định, ở phía của tuyến đi tiếp (đuốc ngã ba không làm nhánh cụt giống tuyến chính); cặp chỉ cho cổng quan trọng; dấu xác nhận sau khúc cua khi dấu kế tiếp xa hơn một màn hình. Không có điểm quyết định thì không có dấu. |
| 5 · Sinh thái | §4.6.5, §4.7, §4.11 | Đất → thảm thấp → cụm bụi 3–7 quanh tâm lệch (+ vài bụi lẻ) → cây bụi (cao 0,3–0,5 H, dưới ngưỡng vật "cao"), theo ẩm, dốc, giẫm đạp (cỏ dày ở vai đường, thưa dần về vệt giẫm; dải thấp giữa hai vệt bánh), bóng công trình, tha hóa, hồ sơ vùng con, mảng lớn bất quy tắc (nhiễu méo, mép đứt, có lỗ). Dùng lại `grassHabitat`. **Mỗi bụi được kiểm tra lại tại vị trí cuối.** Chân prop: cỏ bám vòng ngoài + đất lộ (ground paint). Ruộng: hàng gãy đoạn, thiếu cây; chỉ ở vùng `field`. Bờ ẩm: cụm riêng (vùng `bank` đủ xác suất, mép nước ở vùng khác `bankOther`×). **Ngân sách:** mặc định tăng theo diện tích plan; khi cần cắt, engine tính trước số cụm kỳ vọng của mọi ô, giảm bằng **một hệ số chung** và duyệt các ô theo thứ tự xáo trộn theo seed, nên mức cắt không bao giờ xóa sạch phần cuối bản đồ theo thứ tự quét. |
| 6 · Dấu vết | §4.6.6, §4.10 | Mỗi sự kiện chọn nguyên nhân trước, rồi chỉ lấy mảnh từ công thức nguyên nhân đó: 1 chính + 2–6 phụ trong cung lệch về một phía (số phụ nhân với `bonesMul` của vùng con) + 0–2 mảnh nhỏ dần theo hướng kéo. **Vật chủ phải đúng loại** (`TRACES[nguyên nhân].hosts` so với loại của vật chủ: `den`, `carcass`, `camp`, `door`, `cart`, `grave`, `altar`, `shrine`, `building`…; điểm trần không có `kind` được coi là lời tác giả) và trong `hostRadius`. **Không đủ chính + 2 phụ thì bỏ cả sự kiện** (hoàn tác; một dòng trong `drops` ghi asset của mục công thức hỏng, không phải id mảnh đã hoàn tác; `events[].main` về `null`). Chừa nền sạch `eventGap` giữa các sự kiện. Sau đó gỡ cỏ/cây bụi nằm dưới dấu vết (lọc sau, không xáo phần cỏ còn lại) và yêu cầu ground paint (đất trơ + ẩm). |
| 7 · Kiểm tra | §4.12 | `validateLayout` tính lại từ kết quả (không dùng chỉ mục của thuật toán): xem bảng "tự động / cần mắt" cuối mục. |

#### 4.13.3 Khai báo asset (§4.6, đoạn cuối)

Mỗi asset trong `ASSETS` (`id` = `kit.piece`) có đủ các trường sau; footprint và cỡ lấy từ mesh đã đo, không gõ tay.

| Trường | Nghĩa |
|---|---|
| `zones` | vùng con được dùng (`moor`, `farm`, `field`, `camp`, `den`, `graveyard`, `bank`); `[]` = chỉ đặt tay, thuật toán không bao giờ lấy |
| `role` | nền (`ground`) / vật cản (`obstacle`) / tương tác (`interactive`) / nguy hiểm (`hazard`) / dẫn đường (`guide`) |
| `layer` | lớp §4.2: `decal`, `low`, `tall`, `edge`, `landmark` |
| `size` | `large` / `medium` / `small` theo **diện tích footprint ở scale giữa**: nhỏ < 3 m², lớn ≥ 8 m² (`SIZE_CLASS`, ≈ 50 % / ≈ 15 % số mảnh đã khai báo; ghi đè được). Chỉ dùng để xét nhịp cỡ của cụm, không đổi cách đặt |
| `footprint` | hộp cục bộ: bbox đầy đủ; cây dùng **đế thân** (15 % thấp nhất của mesh) — tán chỉ tính vào vùng che camera (`crown`); `shrink` cho mesh không vuông |
| `use` | vùng sử dụng/đứng `{ side, depth, width }` phải để trống (lều: 2,2 m trước cửa); `side`: `front` = +z cục bộ, `back` = −z, `left` = −x, `right` = +x, `all` = bốn phía |
| `front` | lệch yaw của mặt trước so với +z cục bộ |
| `scale` | khoảng scale; footprint tính **sau** xoay và scale, kể cả tâm lệch khỏi pivot. Engine không đặt mảnh nào ngoài khoảng này (trừ khối do plan đặt và mảnh dấu vết, xem dưới) |
| `substrates`, `maxSlope`, `maxStep` | chất nền hợp lệ (`grass dirt mud rock blood water`), độ dốc tối đa, chênh cao tối đa dưới footprint |
| `align`, `sink` | `upright` / `slope` (nghiêng theo dốc); độ chìm theo tỷ lệ chiều cao |
| `natural` | xoay tự do (đá, cây) hay bám trục công trình (đồ nhân tạo) |
| `collision`, `destructible` | quyết định lớp `obstacle` / `destructible` / `decor` của kết quả |
| `host`, `hostKinds` | công thức cụm mà nó làm vật chủ (nếu có); loại vật chủ của dấu vết mà nó đại diện (`cart`, `carcass`, `altar`, `shrine`, `grave`) |
| `occludes`, `crown` | chiều cao dùng cho vùng che camera; có `crown` thì vùng che quét **hộp mesh đầy đủ đã scale** (tán) thay vì chỉ đế thân |
| `light` | điểm sáng cục bộ [x, y, z] (đo trên đỉnh GLB, `KIT_LIGHTS` của `weepingFields.js`) |
| `fallback` | asset thay thế, chỉ dùng khi mọi phương án của mục công thức thiếu trong scene; giữ nguyên `collision`, `role` và lớp (thấp: decal/low · cao: tall/edge/landmark) — test catalog kiểm từng cặp; kiểm tra y hệt với footprint, scale và khoảng scale của chính nó |
| `feet` | cỏ bám vòng ngoài + đất lộ ở chân (đá, hàng rào, tường rào) |

Lớp trong kết quả (`class`): vật có `collision` = `obstacle` (hoặc `destructible`), không có = `decor`; vai trò `guide` / `interactive` / `hazard` ghi đè. **Mảnh dấu vết** mang khoảng scale riêng trong công thức `TRACES` (xương, ván vỡ… lệch khỏi khoảng chung của asset; mảnh kéo còn nhân `dragScale` mỗi bước); validator `scale-range` kiểm theo khoảng của công thức, mọi mảnh khác theo khoảng của asset.

#### 4.13.4 Bảng mét — mọi con số engine dùng

Tất cả nằm trong `UNITS` / `LAYOUT_RULES` (ghi đè được qua `options.rules`), cộng ba nhóm cuối bảng (ngân sách mặc định, seed mặc định, hằng số hình dạng trong code). **Test `15b` kiểm từng khóa của `LAYOUT_RULES` đều có mặt trong mục này.** "Chọn thử" = AD không cho số, đây là điểm bắt đầu để chỉnh khi duyệt bằng camera gameplay (như §4.6 đã nói). Mét, trừ khi ghi khác. Số liệu **theo từng asset / công thức / vùng con** (scale, độ chìm, vùng sử dụng, khe giữa thành viên, hệ số cỏ theo vùng, bán kính trống quanh lửa `bare`, bề rộng hàng ruộng…) là dữ liệu trong `biomeCatalog.js`, không phải luật chung; đổi ở đó và ghi lý do trong cùng commit.

| Nhóm | Số | Nguồn |
|---|---|---|
| Đơn vị | H = 1,8 · Sub ≈ 0,47 (32/√2 px ÷ 86,6 px × H) | §0, §4.12; `darkWood.js` SCALE; mục 4.13.1 |
| Camera | forward (−1,−1)/√2 · pitch 30° · màn hình 21,33 × 12 → 24 m sâu | §4.1 (iso 2:1), lab play view |
| Vùng chơi | `mainPathMin` **1,41** (3 Sub) · `doorMin` **0,94** (2 Sub) · `arenaMin` **3,76** (8 Sub) | §4.3, §5.1 |
| | `pathClear` 0,3 · `doorClear` 0,15 · `interactionClear` 0,1 · `spawnClear` 0,1 · `arenaClear` 0,05 · `waterClear` 0,5 · `doorEps` 0,05 · `edgeMargin` 0,5 | §4.6.1, §4.4 (chọn thử) |
| | `arenaDecals` bật: decal (xương, vụn) được nằm trên arena — đi xuyên, không che telegraph (lệch có chủ ý khỏi "arena trống", §4.2 lớp 3) | chọn thử |
| | `pathWidth` đường 4,2 · nhánh 2,6 · lối mòn 1,4 · lối thú 1 · `doorSize` cửa 1,4×2,6 · cổng 4×4 · lối vào 3×3 | §5.1 (chọn thử) |
| Khe & va chạm | `passGap` **0,94** (2 Sub) giữa vật cản khác nhóm · `clusterGap` 0,1 trong một cụm (khối vật chủ tính là một phần của cụm) · `agentRadius` 0,35 | §4.12, §5.1 (chọn thử) |
| Đất trống giữa cụm | `clusterClear` **2,2** (mảnh không phải decal của hai cụm khác nhau, và ngoài bán kính `bare` của vật chủ khác) · `clusterSpacing` 7 (giữa hai vật chủ; cụm bán kính 3–4 m) | §4.11 trại địch "đất trống quanh lửa, lều và chỗ tụ tập", §4.6 "cảnh có mảng nghỉ" (chọn thử 2,0–2,5) |
| Nhịp cỡ | `sizeMixMin` 4 (cụm từ 4 mảnh được xét) · nhịp đạt khi có ít nhất một mảnh nhỏ và một mảnh trung/lớn · `sizeRepair` 2 (cụm phẳng được thêm tối đa 2 thành viên thuộc cỡ còn thiếu, trong `count` của công thức) · `countRerolls` 8 (bốc lại số lượng thành viên khi trùng hệt một cụm trước của cùng công thức) · validator `size-rhythm` cho phép tối đa 25 % cụm phẳng · ngưỡng cỡ `SIZE_CLASS` nhỏ < 3 m², lớn ≥ 8 m² | §4.3 / §4.8 ("1 lớn – 2 trung – 3+ nhỏ" là nhịp tham khảo, nên chỉ cảnh báo) |
| Công sức | `maxTries` 12 · `reach` khối 2 / vật chủ 1,5 / thành viên 1,2 / dẫn đường 1 / dấu vết 1,2 / cây bụi 0,8 / landmark 3 (không bao giờ mở rộng) | §4.12; `placeKit` (reach) |
| Khối lớn | `massSpacing` 12 · `massSecondary` 1–3 · `massSecondaryScale` 0,35–0,65 (cỡ mong muốn so với khối chính) · `massSecondaryMax` 0,85 (phụ không lớn quá 85 % khối chính sau khi kẹp scale) · `massLean` ±0,7 rad · `massEdge` 4 · `hostKeepOut` 8 · `massBudgetPerArea` 16/128² · `scoreBack` 0,45 · `scoreFrame` 0,25 · `scoreNoise` 0,3 · `frameBest` 7 | §4.8, `buildOutcrops` (12; 1–3; 0,35–0,65); phần còn lại chọn thử |
| | đá chìm 0,15 chiều cao (dữ liệu `sink`) | §4.8 ("đá chìm một phần"), `buildOutcrops` |
| Landmark | `landmarkHeight` ≥ **3,6** (2 H) · `landmarkWindow` 32 (1,5 màn hình) · `landmarkSee` 18 · `landmarkDist` 9–16 · `landmarkSpread` 1,6 rad (±0,8) · `landmarkScale` ×1,03 · `landmarkTries` 4 · `landmarkSpacing` 6 · `landmarkStep` 4 · `landmarkMinTail` 0,25 | §4.2 lớp 7, §4.3 (chọn thử cho phần còn lại) |
| Che camera | `tallMin` vật "cao" ≥ **0,9** (0,5 H) · `occlusionMax` che ≤ **25 %** mỗi cửa sổ màn hình · `occludePathMax` 0,15 · `occludeNear` 12 · `occludeMinSamples` 4 · `occRaster` 0,5 · `windowStep` 8 · `pathSample` 1 | §4.2 lớp 5, §4.3, §5.2 (số còn lại chọn thử) |
| Cụm | `slotAngle` nửa góc ô trước/sau/bên 0,6/0,7/0,5 rad · `memberRadius` 0,75 · `restJitter` 0,3 · `axisTol` 0,15 rad, `faceTol` 0,1 rad (chỉ dùng khi kiểm) | §4.3 (1 lớn–2 trung–3+ nhỏ, nhịp), §4.8 (chọn thử) |
| Dẫn đường | `torchGap` **7** (= `BIOME_RULES`) · `shoulderMin` 0,3 – `shoulderMax` 1,5 (vai đường) · `guideBefore` 2–4 · `decisionRadius` 8 · `confirmAfter` 6, khi dấu kế > `confirmGap` 21,3 · `junctionSnap` 3 (đầu đường cách đường khác ≤ 3 → ngã ba) · `bendAngle` > **35°** trong `bendSpan` **8 m** · `maxLightsPerScreen` 4 (là luật đặt: mảnh có đèn bị từ chối `light-budget` nếu làm cửa sổ màn hình vượt 4; cặp đèn cổng là chủ ý, được tính trước và luôn đứng) | §4.9 (35°/8 m, "vai đường"); phần còn lại chọn thử |
| | `guideExtra` 0–0,8 · `gateFront` 0,3 / 0,5 độ sâu · `bankBefore` 0,8 · `bendKeep` 1,5 · `bendProbe` 2 · `hiddenAhead` 6 · `branchProbe` 6 · `decisionSnap` 12 | chọn thử |
| Cỏ (§4.7) | `ecoCell` 4 · `carpetCell` 1 · `clustersPerCell` 6 (cụm kỳ vọng mỗi ô ở mật độ đầy) · `tuftsPerCluster` **3–7** · `clusterAspect` 0,45–1 (trục ngắn/dài của cụm) · `clusterRadius` 0,35–1,4 · `lonerChance` 0,45, `lonerReach` 3 · `rootSpacing` **0,18** · `minDensity` 0,04 (dưới ngưỡng này không mọc) | §4.7 (3–7, `rootSpacing`); phần còn lại chọn thử |
| | `carpetH` **0,08–0,20 H** · `edgeH` **0,20–0,35 H** · `tallH` **0,35–0,55 H** chỉ cách chỗ chiến đấu ≥ `tallClear` 4 · `tallChance` 0,3 | §4.7; `tallClear`, `tallChance`: chọn thử |
| | `roadClear` 1,7 · `trailClear` 0,65 · `creekClear` 1,15 · `maxWet` 0,72 · `maxBlood` 0,35 · `maxSlope` 0,65 | `biomePlacement.js` (dùng lại nguyên) |
| | `shadowReach` 2,5 · `shadowBoost` ×1,4 (bóng sau tường) · `footRing` 0,15–0,7 · `footTufts` 3–6 · `footBare` +0,5 (đất lộ) · `bankWidth` 2,4 · `stripMax` 0,2 H (dải giữa vệt bánh) | §4.7 (chọn thử) |
| Cây bụi | `shrubH` cao **0,3–0,5 H** (§4.2 "prop thấp ≤ 0,5 H — bụi"; dưới `tallMin`, nên không bao giờ cần vùng che camera) · `shrubSpacing` 1,8 · `shrubQuiet` 2,5 | §4.2 lớp 4, §4.6.5 (chọn thử cho khoảng cách) |
| Dấu vết | `traceSecondary` **2–6** · `traceDrag` 0–2, `dragStep` 2–3,4, `dragScale` ×0,7 mỗi bước · `traceLean` ±0,8 rad · `eventGap` 4,5 · `hostRadius` 7 (tính từ viền vật chủ) · `traceRing` 0,8–2,6 | §4.10 (2–6, 0–2); phần còn lại chọn thử |
| Lớp đất | `mudWet` 0,6 · `rockMin` 0,5 · `rockSlope` 1 (≈ 45°) · `bloodMin` 0,35 · `grassMin` 0,4 · `minSink` 0,03 (độ chìm tối thiểu, m) | §4.6 (chất nền), chọn thử cho ngưỡng |
| Hình dạng — khối, dẫn đường | `slopeProbe` 0,4 (dốc = sai phân ±0,4 m) · `tiltProbe` max(0,5; 0,6 × nửa cỡ) · `damp` (đá rêu khi ẩm > 0,3, cỏ > 0,75 hoặc nước ≤ 9) · `backSide` 0,5 · `massTall` đá 0,6 / cây 0,5 · `burnedChance` 0,2 · `massSpacingTol` 0,9 · `massGap` 0,2–0,9 · `massStep` 0,4 · `massAttempts` 3 · `massPathClear` 2 · `scoreNeutral` 0,5 | `buildOutcrops` / `placeKit` / `grassSite` (0,4; 0,5/0,6; 0,3/0,75/9; 0,6) và chọn thử cho phần còn lại |
| Hình dạng — cỏ, cây bụi | `tuftEdge` 0,3 · `tuftFootClear` **0,18** · `accessClear` **0,15** · `quietMargin` 1 · `shadowMin` 0,15 · `wallReach` 1,5 · `tuftThin` 1,6 · `carpetGain` 1,15 · `rockFade` 0,3–0,5 · `bareRamp` 0,35 · `yardNear` 1 · `yardFloor` 0,2 · `toneBase` 0,2 · `toneZone` 0,5 · `edgeShoulder` 3,2 · `edgeFoot` 1 · `tallPathClear` 2,5 · `openH` 0,20–0,24 H · `openLow` 0,75 · `fieldPatch` 0,8 · `fieldTone` 0,55 ± `fieldToneJitter` 0,1 · `clusterOffset` 0,6 · `toneJitter` 0,06 / 0,04 | `grassSite` (0,18; 0,15) và `grassHabitat` (3,2); phần còn lại chọn thử |
| | dải giữa vệt bánh: `stripStep` 1,5 · `stripChance` 0,35 · `stripInset` 0,05 · `stripTone` 0,35 · `stripCarpet` 0,4 · `stripDensity` 0,35 · vệt mặc định `rutGap` 1,2 / `rutWidth` 0,3 · chân prop: `footSpread` 0,8–1,6 rad, `footStrength` 0,45 · bờ ẩm: `bankChance` 0,7 (vùng ngoài `bank`: × `bankOther` 0,5), `bankTufts` 2–5, `bankSpread` 0,9, `bankTone` 0,12–0,24 | chọn thử |
| | cây bụi: `shrubRate` 0,3 · `shrubEdge` biên ×1,7 / trống ×0,5 · `shrubGain` 1,5 + 0,2 · `shrubTall` cao 40 % / 15 % · `shrubPathClear` 0,8 · `shrubProbe` 0,7 · `shrubTries` 4 | chọn thử |
| | ngân sách theo diện tích: `tuftsPerArea` 60 000 / 128² (≈ 3,66 bụi/m²) · `shrubsPerArea` 260 / 128² (≈ 0,016/m²) · `tuftsPerClusterMean` 5,45 (ước lượng số bụi mỗi cụm để tính hệ số cắt chung) | chọn thử |
| Hình dạng — dấu vết, đất | `hostR0` 1,5 · `hostPad` 0,5 · `leanJitter` 0,5 · `mainReach` 0,85 · `secReach` 0,4 · `leanTol` 0,05 · `ringJitter` 0,15 · `stratJitter` 0,12 · `dragJitter` 0,15 · `eventOffset` 1–2,6 · `wetFresh` 1,4 · `wetOld` 0,4 · `dirtDefault` 0,6 · `paintPad` 0,35 · `wetShrink` 0,8 · `paintMin` 0,05 · `removePad` 0,45 · `removeGap` 0,1 | §4.10 (hình dáng), chọn thử cho số |
| Ngân sách mặc định (`DEFAULT_OPTIONS.budgets`) | khối: `massBudgetPerArea` × diện tích × `density.masses` · vật chủ **32** · thành viên **160** · dẫn đường **48** · bụi cỏ **60 000** và cây bụi **260** là mức *tối thiểu* — nếu người gọi không đưa số, ngân sách thực = max(mức này, diện tích × `tuftsPerArea` / `shrubsPerArea`) · sự kiện **24**; `report.budgets` ghi số thực dùng. Đủ ngân sách thì mọi khu vực đều được phủ; vật chủ/thành viên/dẫn đường/sự kiện là giới hạn theo thứ tự trong plan (cảnh báo `budget.*` một lần) | chọn thử |
| Seed mặc định (`DEFAULT_OPTIONS.seeds`) · mật độ | `mass` 11 · `cluster` 23 · `guide` 37 · `ecology` 53 · `trace` 71 · mật độ `grass` / `shrubs` / `traces` / `masses` = 1 | chọn thử |
| Hằng số hình dạng trong code | mảng cỏ lớn `patchField`: méo miền 22 m ở tần số 0,05, ba tầng nhiễu tần số 0,045 / 0,11 / 0,31 trọng số 0,55 / 0,3 / 0,15, tương phản ×1,9 quanh 0,5 (+0,55), lỗ trống nhiễu tần số 0,33 nở từ 0,7 đến 0,86 và xóa 90 % mật độ · blue-noise khối: 24 lần thử mỗi điểm · khóa seed của khối làm tròn 0,5 m · 5 điểm lấy mẫu mật độ mỗi ô sinh thái (tâm + 4 điểm 1/4) · xác suất lật 180° 50 % cho đồ bám trục | §4.7 (mảng bất quy tắc); chọn thử |

#### 4.13.5 Thứ tự kiểm tra, lý do bỏ, công sức có hạn

Tại **vị trí cuối** của mỗi ứng viên (kể cả asset dự phòng), theo thứ tự §4.12; lớp đầu tiên hỏng là lý do bỏ:

1. `play` — trong biên · hành lang đường/cửa/tương tác/spawn/arena · nước · vùng che camera (vật cao không che — khoảng cách có dấu — vùng tương tác/spawn/cửa/arena, không che quá `occludePathMax` đường gần);
2. `footprint` — chồng footprint · chồng vùng sử dụng (của người khác và của chính nó);
3. `ground` — nước · dốc · bậc · chất nền · tha hóa · vùng con của asset · độ cao không phải số hữu hạn;
4. `distribution` — khe giữa vật cản · `clusterClear` / `bare` giữa các cụm · giãn cụm/khối · `torchGap` · `eventGap` · cung lệch · vai đường · tỷ lệ che 25 %.

Thêm một lý do ngoài thứ tự: `unavailable` (kit không có và không có phương án dự phòng). Mỗi mục thử tối đa `maxTries` vị trí lệch ngẫu nhiên trong bán kính `reach` cố định quanh mục tiêu (lần đầu đúng mục tiêu), **luôn với cùng một asset** (mảnh đầu tiên còn trong scene của mục công thức); không đủ chỗ thì **bỏ và ghi** `report.drops` (`{ step, group, item, asset, reason, detail, x, z, tries }`, lý do = lớp hỏng nhiều nhất trong các lần thử), không ép. Có ngân sách theo nhóm (`options.budgets`: khối, vật chủ, thành viên, dẫn đường, bụi cỏ, cây bụi, sự kiện) và `report.tries` (đã dùng / ngân sách / tối đa mỗi mục). Với `options.logTries` mỗi mục đặt được ghi `[nhóm, id, số lần thử, maxTries]` vào `report.tries.items` (dùng cho test: mỗi mục ≤ `maxTries` của nó, tổng các mục = `tries.total`).

#### 4.13.6 Seed và luồng ngẫu nhiên

Seed luồng = `hash32(plan.seed, seed nhóm, khóa mục)` → `mulberry32` (cùng thuật toán `kit.rng`). Nhóm: `mass`, `cluster`, `guide`, `ecology`, `trace` (`options.seeds`). Khóa mục: vị trí ứng viên đã làm tròn (khối), id vật chủ + chỉ số (cụm), id điểm quyết định (dẫn đường), ô sinh thái (i, j) / hàng / id vật (sinh thái), id sự kiện + mảnh (dấu vết). Hệ quả: đổi seed một nhóm **không dịch chuyển** thứ gì đã đặt ở bước trước nó, cũng không đổi nhóm khác ngoài thứ tự bước đã khai báo (cỏ tránh đuốc đặt trước; cỏ bị gỡ dưới dấu vết). Cùng plan + options → kết quả giống hệt (có test).

#### 4.13.7 Vào / ra

Plan: `{ id, seed, bounds, camera?, ground(x, z) → { height, wet, grass, blood, rock, water }, zones, defaultZone, shade?, autoMasses?, paths (kind road|branch|trail|animal, width, inhabited, ruts), water (đường + bề rộng, hoặc đa giác), doors (door|gate|entrance, width, depth, important), interactions (kind?), spawns, arenas, masses (asset hoặc footprint+chiều cao, đặt tay; focal, label, scale, hostKinds?, `collision: false`? = khối tự dựng đi xuyên được), hosts, decisions?, events }`. `shade` = hướng bóng đổ của đèn chính ({x, z}, mặc định đông nam); `autoMasses: false` tắt khối tự động và việc chèn landmark. `hosts[]` = `{ id, recipe, at | mass, yaw | face, owns?, unspaced? }`: `mass` dùng khối do plan đặt làm vật chủ (không có `at`), `face` quay mặt trước về một điểm, `owns` = id vùng tương tác mà vật chủ giữ (thành viên đi xuyên được vào vùng ấy), `unspaced: true` bỏ luật `clusterSpacing` (dùng cho bố cục dày có chủ ý và test). `events[]` = `{ id, cause, host, at?, dir?, age }`, `host` = id vật chủ (cụm, khối, cửa, vùng tương tác, mảnh đã đặt) hoặc điểm `{ x, z, kind? }` — có `kind` thì được kiểm theo `TRACES[cause].hosts`. Kết quả: `placements[]` (`id, asset, kit, piece, group, step, role, layer, class, x, y, z, yaw, scale, tilt?, footprint, use?, occlusion?, host?, cluster?, event?, decision?, light?, label?`; khối do plan đặt làm vật chủ ghi thêm `cluster`), `ecology { tufts (mảng kiểu: x z h tone cluster kind), shrubs, carpet }`, `groundPaint[]`, `reserved[]`, `decisions[]`, `clusters[]` (thêm `sizeMix`, `pieces`, `mass`), `events[]` (thêm `hostKinds`, `hostPos.kinds`), `report { seeds, counts, drops, warnings, checks, tries, budgets, ms }`. `y` = đất thấp nhất dưới footprint trừ độ chìm (hoặc đất tại pivot trừ độ chìm kèm `tilt` cho vật nghiêng theo dốc).

#### 4.13.8 Checklist §4.12: tự động hay cần mắt

| Mục (§4.12) | Engine | Còn cần mắt |
|---|---|---|
| Đi lọt cửa, vai đường, khe prop; chỗ tương tác không bị chiếm | `play-space`, `gaps`, `cluster-clear`, `use-zones`, `passability` (BFS 0,25 m, bán kính 0,35 m từ đầu đường chính tới mọi cửa/đứng/spawn/arena) | cảm giác "chật" thực tế khi có quái |
| Cỏ có mảng/đất trống; không hàng ngoài ruộng; không xuyên prop/nước/telegraph | `ecology-exclusion` (đường, nước, footprint, vùng sử dụng, hàng chỉ trong `field`) | mảng dày/thưa có tự nhiên không, màu cụm |
| Điểm rẽ có tín hiệu từ hướng tiếp cận; đuốc không dẫn vào ngõ cụt | `guides` (có quyết định, trên vai, đúng phía tuyến đi tiếp, không đuốc ở lối thú/hang) | tín hiệu **đọc được** từ camera, trong sương |
| Mỗi cụm xương/đồ vỡ có sự kiện và vật chủ | `traces` (nguyên nhân, 1+2–6, vật chủ đúng loại, nền sạch) | câu chuyện có hợp lý, không glow |
| Tắt VFX vẫn phân biệt tuyến và vật tương tác; đêm không tăng gamma | — | hoàn toàn bằng mắt (Night + Overcast, thang xám, class view) |
| Tăng mật độ vẫn giữ vùng cấm; đổi seed không mất hành lang; mật độ 0 → hết cỏ | test `density`, `determinism`, `group independence` | — |
| Kit đầy đủ và dự phòng; không lơ lửng/chồng/đổi vai trò collision | test fallback + test catalog (mọi `fallback` giữ collision/vai trò/lớp); `clusters`/`traces` (mảnh chỉ từ công thức, dự phòng chỉ khi thiếu cả mục); `scale-range`; `overlap`; `y` theo đất | prop lơ lửng ở địa hình lạ, đổi collision của asset mới |
| Frame time, số đèn, overdraw | `lights` (đèn mỗi màn hình), `occlusion` (≤ 25 %), `occlusion-zones` (bóng vật cao không che cửa/vùng đứng/spawn/arena) | frame time/overdraw trên WebGL2 và WebGPU |
| Landmark, che khuất (§4.3, §5.2) | `landmark`, `occlusion`, `occlusion-zones`, `focal` | điểm nhấn có "đọc" được không |
| Nhịp cỡ và đất trống trong cụm (§4.3, §4.11) | `size-rhythm` (cảnh báo `cluster.sizeMix`), `cluster-clear` | cảnh có thật sự "có mảng nghỉ" ở camera gameplay |

#### 4.13.9 Giới hạn đã biết và các lệch có chủ ý

- **Khối đi xuyên (`collision: false` trên khối tự dựng, vd. xác thú):** engine ghi nhận như đồ trang trí đi xuyên — `class: 'decor'`, `role: 'ground'`, `layer: 'low'`, `blocks: false`, không có vùng che camera; không tính là vật cản cho `gaps` / `passability`, nhưng vẫn là một footprint đặc đối với `overlap` (mảnh khác không được đứng lên nó, như mảnh xác kit) và vẫn làm vật chủ của sự kiện. Scene dựng nó trong nhóm `decor` (không solid) và hero không đứng chồng lên nó.
- **Khối do plan đặt (`plan.masses`) luôn được ghi nhận và không bị luật che camera từ chối**: tác giả quyết. Vi phạm (kể cả vào hành lang, được sát mép thì không tính) chỉ cảnh báo `authored.conflict` và validator `play-space` báo; tỷ lệ che 25 % vẫn tính chúng, và `occlusion` báo nếu một cửa sổ vượt vì khối tác giả.
- **Cột/đuốc của một cửa được sượt qua hành lang của chính cửa đó** (đứng ở vai hành lang thì vùng che quét ngang qua nó); không được che cửa khác, vùng tương tác, spawn hay arena.
- **Decal được nằm trên arena và trong vùng sử dụng** (`arenaDecals`): xương, rơm, chăn trải không cản bước và không che telegraph.
- **Bán kính vật chủ của dấu vết tính từ viền vật chủ** (`hostRadius` + nửa đường chéo + vùng sử dụng), không từ tâm: nhà kho rộng hơn 7 m vẫn có dấu vết ở mái.
- **Mảnh dấu vết dùng khoảng scale của công thức `TRACES`** (không phải của asset; mảnh kéo nhỏ dần ×0,7 mỗi bước).
- Khúc cua "khuất" chỉ xét khi cua > ~35°/8 m; việc có thật sự khuất hay không (khối cao che) được ghi `hidden` nhưng không đổi vị trí dấu.
- Đèn: chỉ 4 asset có điểm sáng đo được (`torch`, `lantern_post`, `candles`, `pot_tripod`); chậu lửa/đèn hiệu chưa đo nên không tính vào ngân sách đèn. Cặp đèn cổng được giữ chỗ trước (điểm gần đúng cạnh cửa quan trọng có bảng `pair` sáng) nên cụm đặt trước không chiếm hết ngân sách của cổng.
- Vùng che camera là bao lồi của footprint quét theo `forward`; tán cây là hộp mesh đã scale (không phải hình mesh). Cây bụi dưới 0,5 H nên không có vùng che.
- Cỏ và cây bụi không đăng ký vào chỉ mục va chạm (decor); dấu vết gỡ chúng *sau* khi đặt. Engine chưa dựng hình 3D: scene đọc kết quả (lab Stage B).
- Chưa mô hình hóa: đường nhìn của quái, vùng tuần tra, địa hình nhiều tầng. `size` chỉ là nhịp tham khảo (cảnh báo, không từ chối).

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
