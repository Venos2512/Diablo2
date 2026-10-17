# 09 — Nên / Không nên và tiêu chí duyệt

## 1. Nên / Không nên

| Chủ đề | ✅ NÊN | ❌ KHÔNG NÊN |
|---|---|---|
| Tổng thể | Hiện thực u ám, thế giới cũ và mục | Fantasy anh hùng sáng sủa, cartoon |
| Màu | Nền khử bão hòa, điểm nhấn bão hòa có lý do | Bão hòa đều, màu kẹo, tím-hồng neon trang trí |
| Giá trị | Nền tối, nhân vật trung, hiệu ứng sáng | Nền sáng hơn nhân vật |
| Ánh sáng | Light radius + nguồn điểm, giữa là tối | Ambient phủ đều, bloom toàn màn hình, god-ray |
| Hình khối | Silhouette rõ ở 64 px | Chi tiết nhỏ gánh nhận diện |
| Tỷ lệ | Gần thực tế; vũ khí/giáp hợp lý | Vai giáp khổng lồ, vũ khí to hơn người |
| Vật liệu | Mỗi vật liệu một cấu trúc hư hại riêng | Grunge overlay chung cho mọi thứ |
| Gore | Máu đậm, xác nằm yên, kể chuyện | Gore khoe khoang, cận cảnh, máu đỏ tươi |
| Kinh dị | Tăng dần trong Act, cái thiêng bị ô uế | Jump-scare, quái dị ngay từ đầu |
| VFX | Phép là nguồn sáng, hình đọc trước màu | Màn hình phủ particle che quái |
| Loot | Nhãn màu + âm thanh + icon túi đồ đẹp | Cột sáng/hào quang lớn cho mọi đồ hiếm |
| UI | Đá, sắt, da, serif; trầm hơn gameplay | UI phẳng hiện đại, gradient, icon flat |
| Act | Mỗi Act một văn hóa, palette, khí hậu | Tái dùng tileset Act khác cho tiện |
| Thị trấn | Ấm, tạm bợ, nhịp thở | Thành phố hoành tráng sáng rực |

### Bẫy thường gặp khi "làm giống D2"
1. **Làm quá tối.** D2 tối có nguồn; nếu người chơi phải tăng gamma để thấy quái, cảnh sai.
2. **Làm quá nâu.** Mỗi Act có màu riêng; nếu 5 Act đều nâu xám, mất nhận diện.
3. **Làm quá chi tiết.** Texture đẹp ở 4K nhưng nhiễu ở kích thước chơi.
4. **Copy D3/D4 thay vì D2.** D3 sáng, bão hòa, nét vẽ tay hơn; D4 painterly. D2 là *render 3D cuối thập niên 90 trong palette giới hạn*: mềm, hơi mờ, khối nặng.
5. **Coi D2 là pixel art.** Sprite D2 là render từ 3D [Đã xác minh], không vẽ pixel tay viền cứng.

## 2. Rubric duyệt (thang 1–5)

Chấm **ở kích thước trong game**, trong cảnh thật có hero + quái + VFX + UI.

| # | Tiêu chí | 1 (hỏng) | 3 (đạt) | 5 (đúng chất D2) |
|---|---|---|---|---|
| 1 | Đọc được | Không thấy quái/hero | Thấy khi dừng lại nhìn | Đọc ngay trong hỗn chiến |
| 2 | Silhouette | Lẫn vào nền | Nhận ra loại | Nhận ra vai trò và loại chỉ bằng bóng |
| 3 | Giá trị sáng | Nền sáng hơn nhân vật | 3 tầng có nhưng yếu | 3 tầng rõ ở ảnh đen trắng |
| 4 | Palette Act | Lạc tông | Hợp tông | Nhận ra Act chỉ qua ảnh |
| 5 | Ánh sáng | Phủ đều/không nguồn | Có nguồn | Bóng tối là mối đe dọa, ánh sáng là an toàn |
| 6 | Vật liệu | Nhựa/mới/grunge chung | Đọc được chất | Cũ, có lịch sử, có câu chuyện |
| 7 | Theme | Không liên quan | Có motif | Cái thiêng bị ô uế rõ ràng |
| 8 | Feel | Nhẹ, không phản hồi | Có phản hồi | Nặng, dứt khoát, thỏa mãn |
| 9 | Kỹ thuật | Lỗi cắt, sai neo, sai hướng | Đúng spec | Ghép module không lộ, đủ hướng |

**Ngưỡng:** P0 (vertical slice) cần trung bình ≥ 3.5 và **không tiêu chí nào < 3**. Tiêu chí 1 và 3 phải ≥ 4.

## 3. Red flag — dừng ngay
- Hero không đọc được trên nền ở bất kỳ vùng nào.
- Màu gameplay (đỏ máu, lam mana, lục độc) dùng làm trang trí gây nhầm.
- Một Act có thể đổi tên thành Act khác mà không ai nhận ra.
- Boss không nổi nhất phòng boss.
- Cảnh đẹp nhưng "không có gì đã xảy ra ở đây".

## 4. Quy trình duyệt đề xuất
1. **Ảnh đen trắng** → kiểm tra giá trị.
2. **Thu 25%** → kiểm tra silhouette.
3. **Cảnh đông** (≥ 20 quái + 3 phép) → kiểm tra đọc được.
4. **So với ref board Act** → kiểm tra palette.
5. **Chạy kèm âm thanh** → kiểm tra feel.
