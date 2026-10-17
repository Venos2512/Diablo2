# 08 — UI, loot và âm thanh

## 1. UI — "đá, sắt và da"

| Thành phần | Đặc tính [Quan sát] | Quy tắc AD |
|---|---|---|
| Thanh dưới | Khung đá/kim loại tối, hai cầu Máu (đỏ, trái) và Mana (lam, phải), ô kỹ năng, belt thuốc | UI phải là *vật thể trong thế giới*, không phẳng/hiện đại |
| Cầu máu/mana | Chất lỏng trong cầu thủy tinh, rút dần | Đọc được bằng mắt ngoại vi |
| Túi đồ | Lưới ô, mỗi item chiếm kích thước hình học thật (1×1 → 2×4) | Tetris túi đồ là một phần feel |
| Panel | Nền da/đá tối, viền kim loại, chữ serif khắc | Không gradient sặc, không icon phẳng |
| Bản đồ | Automap đường nét đơn giản phủ trong suốt | Tối giản để không che gameplay |
| Font | Serif cổ (kiểu khắc), chữ trắng/xám trên nền tối | Ưu tiên đọc được hơn trang trí |

UI tối và trầm hơn gameplay — **khung tranh**, không phải tranh.

## 2. Loot — art cốt lõi

### Màu chữ vật phẩm [Quan sát]

| Loại | Màu chữ | HEX đề xuất [Diễn giải AD] |
|---|---|---|
| Thường (Normal) | Trắng | `#E0E0E0` |
| Có lỗ / Ethereal / Low quality | Xám | `#8A8A8A` |
| Magic | Lam | `#6969FF` |
| Rare | Vàng | `#FFFF64` |
| Set | Xanh lục | `#00C400` |
| Unique | Vàng-kim/nâu | `#C7B377` |
| Crafted | Cam | `#FFA800` |
| Rune / Runeword | Cam (rune) / vàng-kim (runeword) | — |
| Không đủ yêu cầu | Đỏ | `#FF4D4D` |

### Đồ hoạ vật phẩm
- Icon túi đồ (inventory art) **render nổi khối, ánh sáng mạnh từ trên**, đẹp hơn sprite trong game — đây là "khoảnh khắc trưng bày" phần thưởng.
- Item rơi có **animation lật (flippy)** và **âm thanh rơi riêng** theo loại (vàng, nhẫn, bùa, rune, giáp, vũ khí). [Quan sát]
- Unique/Set có thể có icon riêng; vật phẩm hiếm khác dùng icon cơ bản → **màu chữ** và **âm thanh** gánh cảm xúc.
- Vật phẩm ethereal có tông trong suốt/nhạt.
- Item trên người hero hiện bằng hệ thống component — món đồ càng hiếm, hình trên người càng khác (một phần).

### Quy tắc AD
1. Vàng tiền rơi: cụm xu lấp lánh nhỏ — quá phổ biến nên phải khiêm tốn.
2. Rune, charm, jewel: nhỏ nhưng **có âm thanh nhận diện cực mạnh** — người chơi ngoảnh lại vì tiếng, không vì hình.
3. Đồ hiếm không được phát hào quang chói khắp màn hình (đó là phong cách hậu D2). Nhãn màu khi nhấn Alt là đủ.

## 3. Âm thanh — nửa kia của hình ảnh

> Postmortem: âm nhạc và hiệu ứng âm thanh "đóng góp rất lớn vào không khí của game". [Đã xác minh] Kỹ sư âm thanh làm video AVI từ animation để đồng bộ tiếng với chuyển động. [Đã xác minh]

### Âm nhạc (Matt Uelmen)
- Chủ đề Tristram: guitar 12 dây, ảnh hưởng folk-rock đầu thập niên 70 và chất "trung cổ" [Đã xác minh — phỏng vấn Uelmen].
- Nhạc dungeon: bộ gõ lớn, tiếng guitar dày, không đi theo "fantasy dàn nhạc" truyền thống [Đã xác minh — phỏng vấn].
- Mỗi Act có màu nhạc theo văn hóa (Act II nhạc cụ Trung Đông, Act III bộ gõ rừng) [Quan sát].
- Thu âm thật, nhạc cụ chiết trung thay vì âm thanh "Hollywood" [Đã xác minh — Shacknews].

### Âm thanh môi trường
- Hoang dã: gió, côn trùng, tiếng xa; **khoảng lặng nhiều**.
- Dungeon: nước nhỏ giọt, tiếng vọng, tiếng rên xa — âm thanh của thứ *không thấy*.
- Thị trấn: tiếng người, lửa, búa rèn — ấm, có sự sống.

### Phối hợp hình–tiếng [Diễn giải AD]
- Mỗi gia đình quái có tiếng "tell" khi phát hiện người chơi; người chơi nghe trước khi thấy.
- Tiếng chết đa dạng như animation chết.
- Âm thanh rơi item là UI quan trọng nhất của loot.
- Khi duyệt animation, **luôn duyệt kèm âm thanh** — đúng cách Blizzard North làm.
