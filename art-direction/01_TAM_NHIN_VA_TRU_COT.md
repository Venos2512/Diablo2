# 01 — Tầm nhìn và trụ cột hình ảnh

## Tầm nhìn một câu

> **"Một thế giới trung cổ đang mục rữa từ bên trong, nơi ánh sáng là thứ xa xỉ — người chơi là ngọn đuốc nhỏ đi xuyên bóng tối, và mỗi con quái gục xuống là một phần thưởng."** [Diễn giải AD]

Nếu chỉ nhớ một điều: **Diablo II không "tối" — nó *thiếu sáng*.** Bóng tối có chủ ý, có nguồn, có giới hạn. Người chơi luôn thấy rõ thứ cần thấy.

## Cảm giác cốt lõi (feel) — 5 tính từ

| Tính từ | Nghĩa trong game | Không phải là |
|---|---|---|
| **Nặng (Heavy)** | Giáp sắt, đá mòn, bước chân, đòn đánh có trọng lượng | Chậm chạp, ì |
| **Cũ (Aged)** | Mọi thứ đã tồn tại lâu trước người chơi và đang hỏng dần | Bẩn ngẫu nhiên, nhiễu đều |
| **Cô độc (Lonely)** | Hoang dã rộng, ít người, âm thanh xa | Trống rỗng, nhàm |
| **Bị đe dọa (Threatened)** | Mép màn hình là bóng tối; luôn có thứ gì ngoài kia | Jump-scare, kinh dị rẻ |
| **Thỏa mãn (Rewarding)** | Quái chết dứt khoát, đồ rơi lấp lánh, âm thanh rơi đồ | Pháo hoa lòe loẹt, rối mắt |

## Sáu trụ cột hình ảnh

### Trụ cột 1 — Hiện thực u ám, không phải fantasy anh hùng
Tỷ lệ người gần thật, trang phục có logic chế tác, kiến trúc có công năng. Phép thuật và quỷ dữ nổi bật *vì* nền đời thường đáng tin. [Diễn giải AD, dựa trên quan sát]

- Có: giáp xích, da thuộc, vải thô, tóc rối, sẹo.
- Không: vai giáp khổng lồ kiểu cartoon, màu bão hòa, vũ khí to gấp đôi người.

### Trụ cột 2 — Ánh sáng là tài nguyên
Người chơi mang theo vùng sáng quanh mình (light radius là chỉ số thật trong game, item có thể tăng/giảm). Dungeon tối thật sự; mép màn hình chìm vào đen. **Bóng tối là cơ chế gameplay, không chỉ thẩm mỹ.** [Quan sát]

### Trụ cột 3 — Tha hóa của cái thiêng
Nhà thờ, tu viện, đền, lăng mộ, giáo hội — mọi biểu tượng thiêng đều đã bị chiếm, vấy máu, hoặc phản bội. Hình ảnh mạnh nhất là *cái đẹp bị làm ô uế*, không phải cái xấu thuần túy. [Diễn giải AD]

### Trụ cột 4 — Đọc được trong hỗn loạn
Nhân vật người chơi chỉ cao khoảng **75 pixel** trên màn hình [Đã xác minh — postmortem]. Engine phải hiện cùng lúc 8 nhân vật, 30+ quái, 100+ đạn/phép [Đã xác minh]. Vì vậy silhouette, chuyển động và độ tương phản giá trị phải gánh việc nhận diện — không phải chi tiết.

### Trụ cột 5 — Mỗi vùng một "văn hóa"
Kiến trúc Diablo "kết hợp nhiều nền văn hóa khác nhau"; Act III lấy tham chiếu Maya và Aztec [Đã xác minh — postmortem]. Mỗi Act là một chuyến đi tới vùng đất mới với vật liệu, khí hậu và palette riêng. Người chơi phải nhận ra Act chỉ qua một ảnh chụp màn hình.

### Trụ cột 6 — Vòng lặp phần thưởng phải đẹp
Quái "chết một cách kịch tính" và có "dòng phần thưởng liên tục" [Đã xác minh — postmortem]. Animation chết, âm thanh rơi đồ, icon vật phẩm trong túi đồ là art cốt lõi, không phải phụ.

## Thứ tự ưu tiên khi các trụ cột xung đột

1. **Đọc được (4)** thắng tất cả. Một cảnh đẹp mà không thấy quái là cảnh hỏng.
2. **Ánh sáng (2)** thắng chi tiết bề mặt.
3. **Hiện thực u ám (1)** thắng "cool factor".
4. **Văn hóa vùng (5)** thắng tái sử dụng asset cho tiện.

## Câu hỏi kiểm tra nhanh (dùng trong mọi buổi duyệt)

1. Thu nhỏ còn 25%: còn nhận ra đây là gì, ở Act nào không?
2. Chuyển sang đen trắng: nhân vật và quái có tách khỏi nền không?
3. Thứ này *cũ bao nhiêu năm*, *ai đã dùng nó*, *chuyện gì đã xảy ra với nó*?
4. Nếu bỏ hết đèn trừ light radius của người chơi, cảnh còn đáng sợ không?
