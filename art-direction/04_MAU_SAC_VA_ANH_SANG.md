# 04 — Màu sắc và ánh sáng

## 1. Dữ kiện kỹ thuật của bản gốc

- Diablo II dùng **màu chỉ mục 8-bit (256 màu)**, mỗi Act có palette riêng (thư mục `data/global/palette/ACT1…ACT5`). [Quan sát — cấu trúc file game]
- Nhiều biến thể quái dùng **cùng sprite, khác bảng ánh xạ màu** (palette shift/colormap) — ví dụ các dòng Fallen, Zombie, Skeleton. [Quan sát]
- Postmortem nêu các nâng cấp đồ họa: **trong suốt thật, nguồn sáng có màu, chế độ phối cảnh bán-3D**. [Đã xác minh]
- Vùng ngoài trời có **chu kỳ ngày/đêm**; người chơi có **light radius** (chỉ số tầm sáng). [Quan sát]

Hệ quả: palette bị giới hạn khiến mỗi Act **tự động thống nhất màu**. Một dự án hiện đại (true-color) phải *tự áp đặt* giới hạn này, nếu không sẽ mất chất D2. [Diễn giải AD]

## 2. Quy tắc palette tổng [Diễn giải AD]

1. **Nền khử bão hòa, điểm nhấn bão hòa.** Môi trường có độ bão hòa thấp (S ≈ 10–35%). Chỉ lửa, phép, cổng, item hiếm và máu tươi được vượt ngưỡng.
2. **Một Act — một nhóm màu nền chủ đạo + một màu "kẻ lạ".** Ví dụ Act II: vàng cát chủ đạo, tím Arcane là kẻ lạ.
3. **Tối không bằng đen.** Bóng đổ ngả về màu bổ sung của Act (Act I bóng xanh-xám, Act II bóng nâu-tím, Act IV bóng đỏ-nâu). Đen tuyền chỉ dành cho rìa ngoài light radius và hư vô.
4. **Ấm = an toàn/sự sống, Lạnh = cái chết/siêu nhiên** — trừ Act IV đảo ngược: lam lạnh là Thiên đường, đỏ ấm là Địa ngục.
5. **Màu là thông tin.** Đỏ máu = sát thương; xanh lam = mana/lạnh/town portal; xanh lục = độc; vàng = điện/hiếm; cam-đỏ = lửa. Không dùng các màu này làm trang trí môi trường nếu nó gây nhầm với gameplay.

## 3. Cấu trúc giá trị sáng (value structure)

Đây là phần quan trọng hơn màu. Đo bằng ảnh chuyển đen trắng.

| Lớp | Giá trị (0 = đen, 100 = trắng) | Ghi chú |
|---|---|---|
| Rìa tối ngoài light radius | 0–8 | Gần đen, có thể còn chút màu bóng |
| Nền đất/sàn | 15–35 | Thấp, ít tương phản nội bộ |
| Tường, vật thể lớn | 20–45 | Mặt hướng sáng có thể lên 50 |
| Nhân vật người chơi | 35–65 | **Phải có rim/edge sáng hơn nền ≥ 15 điểm** |
| Quái | 25–60 | Quái thường tối hơn hero nhẹ; elite có viền sáng/màu |
| Lửa, phép, item rơi | 70–100 | Điểm sáng nhất màn hình |
| UI | Khung 10–30, chữ 70–95 | UI tối để không cạnh tranh với gameplay |

**Luật 3 tầng:** nền tối → nhân vật trung bình → hiệu ứng sáng. Không bao giờ để nền sáng hơn nhân vật trong vùng chơi chính. (Ngoại lệ có kiểm soát: sa mạc Act II và tuyết Act V — khi đó nhân vật phải *tối hơn* nền rõ rệt và đổ bóng đậm.)

## 4. Palette đề xuất theo Act [Diễn giải AD — màu xấp xỉ]

Xem trực quan ở `palette_board.html`.

| Act | Nền tối | Nền trung | Nền sáng | Nguồn sáng | Màu kẻ lạ |
|---|---|---|---|---|---|
| I — Moor & Monastery | `#1B1F1C` | `#3E4638` | `#6F6F5C` | Lửa `#D9822B` | Máu `#6E1414` |
| II — Desert & Tomb | `#2A1E14` | `#8A6A42` | `#CDB07A` | Nắng `#F2D59A` | Arcane `#5B3C8C` |
| III — Jungle & Zakarum | `#141C14` | `#34452A` | `#6A7A4C` | Đuốc `#E0A040` | Độc/bệnh `#7FA04A` + Durance `#7A1E2A` |
| IV — Hell | `#120808` | `#3A1A12` | `#6A3A22` | Dung nham `#FF6A1A` | Thiên đường `#8FB4D9` |
| V — Snow & Siege | `#1C2228` | `#5E6A72` | `#C8D2D8` | Lò rèn `#E8913A` | Worldstone `#6FD0C8` |

Cách dùng: nền 3 tông chiếm ~85% diện tích; nguồn sáng ~10%; màu kẻ lạ ≤ 5% và chỉ ở khu đặc biệt.

## 5. Ánh sáng

### Nguyên tắc
- **Light radius quanh người chơi là nguồn sáng chính trong dungeon.** Vòng sáng mềm, rìa mờ dần vào đen; tầm nhìn ≈ một nửa màn hình. [Diễn giải AD dựa trên quan sát]
- **Nguồn sáng môi trường là điểm, không phải phủ.** Đuốc, nến, lửa, cửa sổ — mỗi cái tạo một vũng sáng riêng; giữa các vũng là tối.
- **Ánh sáng màu kể chuyện:** lửa ấm cam ở chỗ người từng sống; lam lạnh ở chỗ ma thuật; đỏ ở chỗ quỷ; lục ở chỗ bệnh.
- **Phép là nguồn sáng.** Fireball, Lightning, Frozen Orb soi sáng tường và quái khi bay qua — đây là một phần cảm giác "mạnh".
- **Không có ánh sáng toàn cục đẹp như tranh.** Không god-ray, không bloom diện rộng, không fog màu kẹo.

### Ngoài trời
- Ánh sáng chính từ trên-trái (theo hướng đổ bóng nhất quán cho sprite) [Diễn giải AD — chốt một hướng duy nhất cho cả dự án].
- Ngày: tương phản thấp ở Act I, cao ở Act II/V.
- Đêm: giảm sáng toàn cục, palette dịch về lam; light radius quan trọng hơn.

### Trong nhà/dungeon
- Ambient gần như bằng 0. Sáng = light radius + đèn đặt tay.
- Phòng boss có ánh sáng thiết kế riêng (nến quanh Andariel, dung nham quanh Diablo).

## 6. Màu trong các hệ thống

| Hệ thống | Màu | Ghi chú |
|---|---|---|
| Máu (HP) | Cầu đỏ | Trái màn hình |
| Mana | Cầu lam | Phải màn hình |
| Độc | Xanh lục | Quái bị độc/hero bị độc ngả lục |
| Lạnh | Lam nhạt | Quái bị đóng băng/chậm ngả lam; chết lạnh có thể vỡ vụn |
| Town Portal | Cột sáng lam | Đặc trưng nhận diện "lối thoát" |
| Red Portal | Đỏ | Lối vào khu đặc biệt (Cow Level, Uber, Nihlathak...) |
| Tên quái Champion | Lam | |
| Tên quái Unique/Super Unique | Vàng-kim | |
| Tên minion | Trắng/xám | |

Màu chữ vật phẩm: xem file 08.
