# 05 — Hình khối, vật liệu, camera

## 1. Camera và tỷ lệ

| Thông số | Bản gốc | Ghi chú |
|---|---|---|
| Góc nhìn | Isometric/top-down cố định, không xoay | Có tùy chọn phối cảnh bán-3D [Đã xác minh] |
| Độ phân giải | 640×480 (D2), thêm 800×600 (LoD) | [Quan sát] |
| Chiều cao hero trên màn | ~75 px | [Đã xác minh — postmortem] |
| Hướng render | Hero 16 hướng, quái 8 hướng | [Đã xác minh] |
| Pipeline | Model 3D Studio Max → render sprite; texture/UI bằng Photoshop | [Đã xác minh] |
| Nền | Render nền → cắt tile → ghép phòng module, engine ráp ngẫu nhiên | [Đã xác minh] |

**Hệ quả AD:**
- Duyệt mọi asset ở **đúng kích thước hiển thị** trên màn hình mục tiêu. Render lớn đẹp không có nghĩa là sprite đẹp.
- Hero chiếm khoảng 1/6 chiều cao màn hình → **tỷ lệ cảnh rộng, nhân vật nhỏ**: cảm giác lạc lõng trong thế giới.
- Tỷ lệ tham chiếu đề xuất [Diễn giải AD]: Fallen ≈ 0.6 hero; người ≈ 1.0; Zombie ≈ 1.0; Overseer/Megademon ≈ 1.4–1.6; boss Act ≈ 2–3; cửa ≈ 1.3; tường ≈ 1.5–2.

## 2. Shape language

| Nhóm | Hình khối chủ đạo | Cảm giác |
|---|---|---|
| Hero | Cân đối, đứng thẳng, khối rõ đầu–vai–vũ khí | Kiên định, con người |
| Quái nhỏ (Fallen, Imp) | Còng lưng, đầu to, chân ngắn, hình tam giác lộn | Bầy đàn, láu nháo |
| Undead | Thẳng đứng nhưng gãy khúc, khớp lệch | Cứng, giật |
| Quái lớn | Khối lưng/vai nặng, đầu thấp, tay dài | Trọng lượng, đe dọa |
| Quỷ (Act IV) | Gai, sừng, góc nhọn, bất đối xứng | Thù địch, không con người |
| Boss | Silhouette độc nhất, nhận ra chỉ bằng bóng | Biểu tượng |
| Kiến trúc thiêng | Vòm nhọn, trụ thẳng, đối xứng | Trật tự (đã bị phá vỡ) |
| Kiến trúc quỷ | Gai, xương, cong như sừng | Hữu cơ, sai lệch |

Quy tắc: **silhouette trước, chi tiết sau**. Mỗi quái phải phân biệt được khi tô đen hoàn toàn ở kích thước 64 px. [Diễn giải AD]

## 3. Vật liệu

Mỗi vật liệu phải có **cấu trúc riêng**, không phủ một lớp grunge chung. [Diễn giải AD]

| Vật liệu | Đặc tính D2 | Tránh |
|---|---|---|
| Đá | Mòn cạnh, vết nứt lớn, rêu ở chân tường, khối to | Đá bóng, cạnh sắc như mới |
| Gỗ | Sẫm, ẩm, vân rõ, đầu mục, đinh sắt | Gỗ vàng tươi sạch sẽ |
| Kim loại | Sắt xỉn, gỉ ở mép, phản xạ hẹp và tối | Chrome, kim loại sáng bóng |
| Vàng/đồng | Mờ, cũ, chỉ sáng ở cạnh | Vàng kim lấp lánh khắp nơi |
| Vải/da | Thô, rách mép, phai màu, bám bẩn ở gấu | Vải lụa sạch, màu tươi |
| Xương | Ngà-vàng bẩn, vết nứt, khớp đen | Trắng tinh |
| Thịt/quỷ | Đỏ-nâu ướt, phản xạ nhờn | Đỏ hồng cartoon |
| Máu | Đỏ đậm gần nâu, đọng thành vũng, mép sẫm | Đỏ tươi bão hòa, bắn tóe kiểu hoạt hình |
| Cát | Ấm, hạt mịn, gợn nhẹ | Vàng chanh |
| Tuyết/băng | Lam xám, giẫm bẩn gần đường đi | Trắng tinh không bóng đổ |

### Độ chi tiết theo khoảng cách
- **Kích thước lớn (>1 tile):** thông tin hình khối + 1–2 vết hư hại lớn kể chuyện.
- **Kích thước trung:** chất liệu đọc được qua 2–3 giá trị sáng.
- **Kích thước nhỏ:** chỉ cần màu và silhouette; bỏ texture nhỏ hơn 2 px trên màn hình.

## 4. Môi trường module

- Bộ tile phải ghép ngẫu nhiên mà không lộ đường nối → biên tile trung tính, chi tiết kể chuyện đặt bằng prop riêng. [Đã xác minh pipeline; Diễn giải AD về cách làm]
- Mỗi tileset cần: sàn cơ bản + 3–5 biến thể, tường thẳng/góc/đầu tường, cửa, ngưỡng chuyển vùng, mép vực, prop lớn landmark, prop nhỏ phá lặp.
- **Landmark mỗi 1–2 màn hình**: tượng, xác lớn, cây khổng lồ, đền nhỏ. Bài học Act IV: thiếu landmark = "trống và giống nhau".
- **Tường che nhân vật** phải có quy tắc mờ/ẩn rõ ràng; hero không bao giờ bị khuất hoàn toàn.

## 5. Bóng đổ
- Sprite có bóng tiếp xúc đậm ở chân; bóng đổ dài hơn ở ngoài trời.
- Một hướng sáng thống nhất cho mọi sprite render sẵn; nếu engine có ánh sáng động, chỉ bổ sung, không mâu thuẫn hướng bake.
