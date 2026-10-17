# 06 — Nhân vật, quái, boss

## 1. Hero — "người thường được rèn bởi nghề"

Mỗi lớp nhân vật là một **nguyên mẫu văn hóa** của Sanctuary, không phải siêu anh hùng. [Diễn giải AD dựa trên quan sát]

| Lớp | Nguồn gốc/văn hóa | Silhouette | Palette nền (trang bị cơ bản) | Từ khóa |
|---|---|---|---|---|
| Amazon | Quần đảo Skovos, chiến binh Hy Lạp | Cao, thon, chân dài, giáo/cung | Da rám, da thuộc nâu, đồng | Huntress, Spartan |
| Barbarian | Núi Arreat, bộ lạc phương bắc | Rộng vai, cơ bắp, tóc dài, vũ khí đôi | Da trần, lông thú, sắt | Berserker, Celt |
| Necromancer | Rừng Kehjistan, tu sĩ Rathma | Gầy, khom nhẹ, tóc trắng, áo ôm | Xám bạc, đen, xương ngà | Bone, ascetic |
| Paladin | Hiệp sĩ Zakarum | Đứng thẳng, khiên lớn, giáp sáng hơn | Bạc, trắng, vàng mờ, đỏ thẫm | Crusader, Templar |
| Sorceress | Hội phù thủy phương đông | Mảnh, tư thế thi triển, gậy | Lục ngọc, vàng, da sáng | Mage, Byzantine |
| Assassin (LoD) | Viz-jaq'taar | Gọn, thấp, móng vuốt | Đen, đỏ thẫm, da | Monk-killer |
| Druid (LoD) | Bộ tộc Scosglen | Đậm, áo choàng lông, biến hình | Nâu đất, lục rêu, lông | Celtic shaman |

### Hệ thống trang bị nhìn thấy
- Giáp chia module **light / medium / heavy**, ghép tự do tạo **hàng trăm biến thể** (bản gốc Diablo chỉ có 3 ngoại hình/lớp). [Đã xác minh]
- Bộ phận hiển thị [Quan sát]: đầu, thân, tay phải, tay trái (vũ khí/khiên), chân, hai vai (một số lớp).
- **Quy tắc AD:** hero luôn nhận ra lớp nhân vật kể cả khi mặc giáp nặng nhất. Silhouette cơ thể và tư thế chờ là chữ ký; giáp không được xóa nó.
- Trang bị tiến triển: cấp thấp vải/da nâu xám → cấp cao kim loại chạm khắc, màu đậm hơn — nhưng vẫn **xỉn, không lòe loẹt**.

## 2. Quái — gia đình và biến thể

### Cấu trúc gia đình
- Một **base model/sprite** → nhiều biến thể bằng **đổi palette** + đổi tên + đổi kỹ năng. [Quan sát]
- Ví dụ: Fallen → Carver → Devilkin → Dark One → Warped Fallen; Zombie → Hungry Dead → Ghoul → Drowned Carcass → Plague Dead.
- Postmortem: quái có **14 nhóm animation**; chỉ Diablo dùng đủ cả 14. [Đã xác minh] Animation chết và âm thanh chết được mở rộng vì người chơi giết cùng loại quái rất nhiều lần. [Đã xác minh]

### Quy tắc thiết kế quái [Diễn giải AD]
1. **Vai trò đọc bằng hình khối và chuyển động**, không chỉ màu: đánh gần lao tới; bắn xa giữ khoảng cách; caster đứng sau, động tác vung tay; summoner/hồi sinh có tư thế đặc biệt (Fallen Shaman giơ tay, lửa).
2. **Palette biến thể tăng dần độ "nguy hiểm"**: biến thể cao hơn đậm hơn, lạ hơn (xám → nâu → đỏ → tím/lam).
3. **Quái mang dấu văn hóa của Act**: Act I quỷ đồng hoang và kẻ phản bội; Act II xác ướp, bọ, rắn; Act III tộc lùn rừng (Fetish/Flayer), nhện, thú lai; Act IV quỷ thuần; Act V quái băng, tay sai Baal.
4. **Kẻ phản bội là con người**: Corrupt Rogue, Blood Raven, giáo sĩ Zakarum, Nihlathak — giữ ngoại hình *người* với dấu hiệu tha hóa (da tái, mắt sáng, máu).

### Quái đặc biệt
- **Champion**: cùng sprite, tên lam, mạnh hơn. **Unique/Super Unique**: tên vàng-kim, có minion và aura/hiệu ứng; nhiều Super Unique có palette riêng. [Quan sát]
- Elite cần **tín hiệu thị giác ở rìa**: hào quang, màu lạ, hiệu ứng aura dưới chân — đọc được trong đám đông.

## 3. Boss — "biểu tượng của một tội lỗi"

| Boss | Ý niệm | Silhouette | Không gian |
|---|---|---|---|
| Andariel | Thống khổ — nữ tính bị bóp méo | Thân trên người, gai sau lưng, chân cong | Catacombs, nến, máu |
| Duriel | Đau đớn — khối thịt nặng | Thấp, rộng, giòi bọ, càng | Phòng mộ chật, tối |
| Mephisto | Hận thù — trí tuệ lạnh | Lơ lửng, xương sống lộ, đuôi | Durance, tường thịt |
| Diablo | Khiếp sợ — quỷ thuần | Cao, sừng, gai lưng đỏ | Chaos Sanctuary, ngôi sao |
| Baal | Hủy diệt — dị dạng | Xúc tu, nhiều khối, không đối xứng | Throne of Destruction |

Quy tắc: **phòng boss là khung tranh cho boss**. Ánh sáng, bố cục và màu nền được thiết kế để silhouette boss nổi nhất màn hình.

## 4. NPC thị trấn
- Thực dụng, nghèo, có nghề: lính, thợ rèn, thầy thuốc, thương nhân.
- Animation chờ chậm, lặp, đời thường. NPC là "nhịp thở" — không được có tư thế anh hùng.
- Mỗi thị trấn có trang phục theo văn hóa Act.

## 5. Animation feel
- **Trọng lượng trước tốc độ.** Có anticipation rõ (lấy đà), impact dứt khoát, recovery ngắn.
- Hero: tư thế chờ thở nhẹ, vũ khí hạ thấp; đi/chạy có nhún đầu.
- Hit recovery (giật khi trúng đòn) là phản hồi chính của sát thương — phải đọc được ở 75 px.
- Death: đa dạng, dứt khoát, xác để lại nằm trên đất (xác còn là tài nguyên cho Necromancer/Barbarian). [Quan sát]
