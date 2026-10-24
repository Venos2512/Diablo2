# QA — THE DYING GODS Act I (34 concept sheets)

Kiểm tra ngày 2026-10-18 trên ảnh mới nhất của mỗi thư mục. Đối chiếu với BRIEF.md và roster.json.

**Cách kiểm tra:**
- **Đo tự động** (`_rerun/qa_measure.py` → `_rerun/qa_measure.json`): kích thước, khung 16:9, vật chạm mép, tỷ lệ pixel đỏ trên hình.
  - Tỷ lệ đỏ đo trên toàn bộ hình, gồm cả xương, nên chỉ để so sánh tương đối. Đây không phải số đo diện tích vật liệu.
- **Xem từng ảnh** (`_rerun/grid_01..09.png`): đúng giải phẫu, đặc điểm nhận diện, màu, đồng nhất giữa các góc, không có chữ.

**Chung:**
- Cả 34 ảnh đều 1672×941 (riêng 31 là 1672×940), khung 16:9.
- Nền xám phẳng, không có chữ hay watermark.
- Đủ góc 3/4 và chính diện, cạnh, sau.

| # | Quái | Kết quả | Ghi chú |
|---|---|---|---|
| 01 | Scavenger | Đạt | Gù, tay dài, liềm gỉ; đỏ gạch là chủ đạo. |
| 02 | Piercer | Đạt | Chân dài, một tay là ống phóng gai xương; giữ đúng một bên ở cả 4 góc. Đỏ 47% vì ống xương lớn. |
| 03 | Brute | Đạt | Vai rộng, hai cẳng tay bọc giáp xương. Bố cục góc nhỏ hơi lộn xộn. |
| 04 | Bellwether | Đạt | Cổ dài, ngực có vòng xương. Ngả hồng thịt hơi nhiều. |
| 05 | Crawler | Đạt | Lưng gập ngược, bò bốn chi. |
| 06 | Vessel | Đạt | Bụng phình; đỏ 80%, hơi quá dải 65–75% nhưng vẫn đúng ý nhận diện. |
| 07 | Herald | Đạt, cần sửa bố cục | Đúng vòng xương cong sau lưng; 3 góc nhỏ quá bé (khoảng 1/4 chiều cao). |
| 08 | Gravewalker | Yếu | Đúng xác nông dân; vai lệch và chân kéo lê chưa rõ; 3 góc nhỏ quá bé. |
| 09 | Shrouded | Đạt | Vải liệm, tư thế lao tới. |
| 10 | Bonewatch | Đạt | Xương vàng, giáp gỉ, nỏ; dây nỏ hơi lệch giữa các góc. |
| 11 | Bloated Dead | Đạt | Da căng, khí độc khu trú; góc nhỏ hơi bé. |
| 12 | Mourning Wraith | Đạt, cần sửa bố cục | Thân dưới tan thành sương; 3 góc nhỏ rất bé, khó đọc. |
| 13 | Coffinbound | Đạt | Quan tài trên lưng, quấn xích. |
| 14 | Mirewolf | Đạt | Hàm dài, lông rụng mảng. |
| 15 | Rotboar | Đạt | Mõm hóa xương, nanh lệch. |
| 16 | Carrion Crow | Đạt | Cánh rách, mỏ dài. |
| 17 | Grave Rat | Đạt | Răng cửa phình, lông thưa, da hồng. |
| 18 | Grave Moth | Đạt | Xám tro / tím xám / be, có bụi cánh. |
| 19 | Thornstag | Đạt | Cao gầy, sừng nhiều gai. |
| 20 | Thornling | Đạt, lưu ý | Rêu hơi tươi; nhiều hơn 4 chân rễ. Không có ánh đỏ, đúng brief. |
| 21 | Rootwhip | Đạt | Roi rễ gai móc, nhựa đỏ khu trú. |
| 22 | Bloodbloom | Đạt | Cánh đỏ sắc, miệng phễu. |
| 23 | Hollow Trunk | Đạt, lưu ý | Ngực rỗng có lõi huyết; gỗ nâu sáng hơn "gỗ đen" của gia đình. |
| 24 | Veinroot Elder | Đạt | Thân đen, rễ lớn, mạch đỏ mảnh. |
| 25 | Deserter | Đạt | Giáp da rách, kiếm và khiên cũ. |
| 26 | Blackwood Marksman | Đạt | Mũ trùm, nỏ lớn, bẫy treo hông. |
| 27 | Plague Brewer | Đạt, lưu ý | Mặt nạ, bình hóa chất; áo vàng mù tạt hơi nổi so với "vàng ô liu". |
| 28 | Chainkeeper | Đạt | Giáp sắt, xích móc. |
| 29 | Oathbreaker Captain | Đạt | Giáp nặng, trường binh, cờ rách đỏ rượu. |
| 30 | Hushed Acolyte | Đạt | Áo ngà, mặt không miệng (đã phóng to kiểm tra). |
| 31 | Penitent Bulwark | Đạt, lỗi khung | Sáp trắng ở khe giáp, khiên lớn; góc 3/4 chạm mép dưới và mép trái. |
| 32 | Ash Cantor | Đạt | Đầu phủ sáp, lư hương có khói cam. |
| 33 | Sanctified Executioner | Đạt, lưu ý | Trường đao khổng lồ; mũ góc 3/4 sát mép trên. |
| 34 | Hollow Confessor | Đạt | Mặt nạ trắng, vòng xương sau đầu, đen và ngà tương phản mạnh. |

**Tổng:** không có ảnh nào sai loài hay sai gia đình màu.
- **Đề xuất gen lại để sửa:** 08 (vai, chân kéo lê, góc nhỏ), 07 và 12 (bố cục), 31 (bị cắt mép).
- **Có thể giữ:** 20, 23, 27, 33, chỉ chỉnh khi lên 3D hoặc paint-over.
