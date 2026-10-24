# 07 — Combat feel và VFX

> Postmortem: combat được thiết kế để "ngoạn mục", quái "chết kịch tính" và có "dòng phần thưởng liên tục". [Đã xác minh]

## 1. Vòng lặp một cú click [Diễn giải AD]

```
Click → anticipation (lấy đà) → impact (máu/tia lửa + âm thanh) → hit recovery của quái
     → chết (animation + âm thanh) → xác nằm lại → đồ rơi (âm thanh rơi + nhãn màu) → nhặt
```

Mỗi bước phải có **phản hồi hình + tiếng**. Thiếu một bước, cảm giác "click thỏa mãn" sụp đổ.

## 2. Impact
- **Máu là phản hồi chính** của đòn vật lý: vài hạt đỏ đậm, bắn ngắn, rơi xuống đất. Không bắn tóe kiểu anime.
- Quái bị trúng giật lùi (hit recovery) — ngắn, rõ.
- Đòn chí mạng/đòn mạnh có thể đẩy lùi (knockback) — quái bị hất khỏi vị trí là một phần thưởng thị giác.
- **Không screen shake liên tục.** Rung màn hình chỉ dành cho sự kiện lớn (boss, nổ lớn). [Diễn giải AD]

## 3. Chết — art quan trọng nhất của quái
- Mỗi gia đình quái có animation chết riêng; chết phải **dứt khoát và nặng**.
- **Chết theo nguyên tố** [Quan sát]: quái bị đóng băng chết có thể vỡ vụn (shatter); quái chết do lửa/điện/độc có tông màu và hiệu ứng riêng.
- Xác để lại trên đất là **tài nguyên gameplay** (Corpse Explosion, Raise Skeleton, Find Item…), nên xác phải đọc được là xác, không biến mất ngay.
- Một số quái để lại hậu quả khi chết (nổ, sinh quái nhỏ) — cần "tell" thị giác trước đó.

## 4. Ngôn ngữ phép theo nguyên tố

| Nguyên tố | Màu | Hình | Cảm giác | Ví dụ |
|---|---|---|---|---|
| Lửa | Cam → vàng lõi trắng, khói đen | Cuộn, liếm, tàn bay | Nóng, phá hủy | Fireball, Inferno, Fire Wall |
| Lạnh | Lam nhạt → trắng | Tinh thể, mảnh nhọn, sương | Sắc, tĩnh, chậm | Frozen Orb, Blizzard, Glacial Spike |
| Điện | Trắng-lam/vàng | Gấp khúc, nhánh, chớp tắt | Nhanh, giật | Chain Lightning, Nova, Charged Bolt |
| Độc | Lục vàng bẩn | Mây, bong bóng, nhỏ giọt | Bệnh, chậm, thối | Poison Nova, Poison Dagger |
| Ma thuật | Tím/lam/trắng | Vòng, rune, tia | Siêu nhiên | Teleport, Bone Spirit |
| Thánh (Paladin) | Vàng-trắng | Vòng aura dưới chân, ánh sáng hướng lên | Trang nghiêm | Holy Fire/Freeze/Shock aura, Fist of the Heavens |
| Xương/chết (Necro) | Ngà, xám, lục mờ | Gai, lồng, tường | Lạnh, nghi lễ | Bone Spear, Bone Prison, Curses |

### Quy tắc VFX [Diễn giải AD]
1. **Phép là nguồn sáng** — VFX soi sáng môi trường (colored lights là nâng cấp được xác minh của D2).
2. **Alpha/additive tiết chế.** Trong suốt thật được dùng [Đã xác minh], nhưng một màn hình đầy phép vẫn phải thấy quái. Giới hạn diện tích additive.
3. **Hình dạng đọc được trước màu.** Người mù màu phải phân biệt lửa và lạnh qua hình (cuộn vs nhọn).
4. **Kỹ năng cao cấp = cùng ngôn ngữ, quy mô lớn hơn**, không đổi phong cách.
5. **Aura/curse dưới chân** dùng biểu tượng hình tròn/rune quay chậm; curse trên đầu quái dùng icon nhỏ.

## 5. Máu, gore, kiểm duyệt
- Mức gore D2: máu và xác rõ, không cận cảnh. Camera xa là bộ lọc tự nhiên.
- Có tùy chọn giảm máu nếu thị trường yêu cầu: máu → bụi/tia lửa, giữ nguyên nhịp phản hồi.

## 6. Feedback trạng thái trên nhân vật
- Độc: tint lục.
- Lạnh/chậm: tint lam.
- Curse: icon trên đầu.
- Aura: vòng dưới chân + màu.
- Nhận sát thương: hero giật (nếu hit recovery), cầu máu thay đổi; tránh flash đỏ toàn màn hình.
