# Concept đá / tảng đá

Thiết kế nguyên bản bằng Pillow/NumPy; không tải ảnh ngoài, không dùng asset Blizzard. Bốn PNG **1800 × 1260 px**, có nhãn tiếng Việt. Sheet 01–03 phóng lớn để duyệt hình; sheet 04 giữ **1 H = 75 px thật trong file**, xem ở zoom 100%.

| Sheet | Nội dung và cấp kích thước |
|---|---|
| [01_act1_rock_family.png](01_act1_rock_family.png) | Đá vụn decal khoảng 0.08–0.15 H; đá thấp 0.40 H; tảng vừa 1 H; tảng cao mẫu 2.20 H, thuộc họ 1.5–3 H; mép vách 2.40 H. |
| [02_cairn_landmark.png](02_cairn_landmark.png) | “Vòng đá lời thề gãy”: sáu trụ khắc cổ, cao 2.1–2.8 H, vòng rộng khoảng 7 H; có thumbnail nhìn xa. Số trụ, hình khối và ký tự tự thiết kế. |
| [03_act_variants.png](03_act_variants.png) | Một khối gốc 1.20 H với năm vật liệu: Moor rêu, sa thạch, đá rừng ẩm/dây leo, basalt/dung nham, granite/tuyết/sương giá. Alpha của năm biến thể giống hệt nhau. |
| [04_readability_check.png](04_readability_check.png) | Cùng một bố trí ở màu, silhouette đen và grayscale; hero đúng 75 px. Số đo value được ghi ngay trên sheet và trong `verification.json`. |

## Palette

Mỗi hàng: tối / trung / sáng / nguồn sáng / kẻ lạ, theo Ch.04. Swatch giữ HEX gốc; màu vật liệu là kết quả nhận sáng và khử bão hòa, không phải fill phẳng bằng swatch.

| Act | HEX |
|---|---|
| I | `#1B1F1C` / `#3E4638` / `#6F6F5C` / `#D9822B` / `#6E1414` |
| II | `#2A1E14` / `#8A6A42` / `#CDB07A` / `#F2D59A` / `#5B3C8C` |
| III | `#141C14` / `#34452A` / `#6A7A4C` / `#E0A040` / `#7FA04A`; Durance `#7A1E2A` là màu tham chiếu riêng trong AD. |
| IV | `#120808` / `#3A1A12` / `#6A3A22` / `#FF6A1A` / `#8FB4D9` |
| V | `#1C2228` / `#5E6A72` / `#C8D2D8` / `#E8913A` / `#6FD0C8` |

Bổ sung Act I: **Stony Field `#5A5040`**, Tamoe `#555248` ở swatch; rêu `#505A3F`; nứt xám-lục `#333B35`. Máu dùng pigment `#6E1414` pha màu đá, rune dùng đỏ trầm `#762B25`. Đỏ chiếm dưới 5% diện tích vật liệu; tỷ lệ được kiểm tra trong generator. Các màu nguồn sáng/kẻ lạ trên bảng palette không tự động được vẽ vào đá thường.

## Áp dụng AD

- **Ch.00 — đọc được trước:** chia decal, thấp, vừa, cao, vách và landmark; khoảng trống giữa khối giữ silhouette rõ. Hero sáng hơn đá ít nhất 15 điểm.
- **Ch.04 — value/màu:** vật liệu Act I nằm trong V20–45; đo bằng Pillow L (0.299R + 0.587G + 0.114B), chuẩn hóa 0–100. Đo pixel đặc, bỏ nền, bóng, chữ và biên alpha. Giới hạn lại sau nội suy để không có viền sáng giả. Đá thường S ≤35%; máu, rune đỏ và dung nham là ngoại lệ nhỏ; tuyết có thể gần trung tính.
- **Ch.05 — khối/vật liệu/camera:** chiếu trực giao, azimuth 45° / góc nâng 30° tạo sàn iso 2:1 chính xác; sáng trên-trái, bóng về dưới-phải và bóng tiếp xúc ở chân. Khối bị cắt bởi mặt gãy lớn rồi mòn vai; rêu theo vùng ẩm thấp, không phủ đều. Không specular, bloom hay god-ray. Đá nhỏ chỉ giữ khối/màu; chi tiết nhận diện ưu tiên từ 2 px ở game scale.
- **Ch.12 — lớp prop:** decal là cụm năm viên không cản đường; thấp ≤0.5 H; vừa/cao có bóng và vai trò cản đường; vách là ranh giới tự nhiên; trụ ≥2 H là landmark. Ba lớp thời gian ở vòng đá: chạm khắc gốc → mòn/nứt/rêu → vài rãnh đỏ bị tha hóa.
- **Ch.11 — Act I:** nâu đá Stony Field hòa với Moor rêu-xám; Tamoe là swatch chuyển vùng. Landmark dùng đỏ tiết chế làm “kẻ lạ”. Quy tắc Crypt lạnh xanh-xám được giữ như định hướng cho biến thể dungeon tiếp theo.

## Tái tạo và kiểm tra

```powershell
python legacy/art-output/rock-concepts/generate_rocks.py
```

Cần Python 3.10+, Pillow, NumPy; font Times New Roman và Segoe UI trên Windows. Script chỉ ghi vào thư mục này; tạo lại bốn PNG và `verification.json`, kiểm tra alpha năm Act, tỷ lệ đỏ, value và mở/giải nén từng PNG. `gallery.html` là trang xem bốn sheet.

**Tự duyệt (1–5):** đọc được 4; silhouette 4; value 4; palette Act 4; vật liệu 3. Khối và phân tầng sáng rõ; chất đá thủ tục còn đơn giản, một số đường nứt vẫn mang tính minh họa. Cần paint-over vật liệu và kiểm tra trong cảnh đông ở engine trước khi duyệt asset sản xuất. Đây là concept sheet, chưa phải bộ sprite đa hướng/tách bóng.
