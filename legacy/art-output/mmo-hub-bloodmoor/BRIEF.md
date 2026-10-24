# Brief — Concept trại trung tâm MMO, mood Blood Moor

Bạn là concept artist. Dùng công cụ TẠO ẢNH (image generation) có sẵn của bạn để gen bộ concept art cho khu trung tâm (hub) của một game MMO dark fantasy lấy cảm hứng từ Diablo II. Thiết kế phải là bản gốc: KHÔNG dùng tên, logo, nhân vật hay asset của Blizzard.

Nếu bạn KHÔNG có công cụ tạo ảnh thật, hãy DỪNG và báo lại đúng như vậy. Không được vẽ bằng code/procedural (PIL, SVG, canvas…) để thay thế.

## Brief
Một câu: "Chiều tối mưa phùn trên đồng hoang. Sau hàng rào cọc, vài trăm người sống sót tụ quanh những đống lửa."

Trại là một tiền đồn bị vây trên đồng hoang (giống trại lính Rogue Encampment được phóng to thành thành trại MMO). Trại phải đọc là "đang chống cự", không phải "đã thua".

Mood: âm u, lạnh, ẩm, cô độc bên ngoài rào; ấm áp chỉ ở từng đốm lửa bên trong. Lạnh bao trùm, ấm từng điểm.

### Ánh sáng & màu
- Trời âm u, ánh sáng khuếch tán xám-lục, không có mặt trời rõ, không có bóng gắt, không có trời xanh.
- Palette nền: xám-lục #6F6F5C, #8A9088; đất/bùn/cỏ úa #3E4638, #4C5440; gỗ ướt #4A3A2A; vải thô #5C5246.
- Lửa #D9822B, quầng #E8A050. Máu khô #6E1414 rất ít.
- Diện tích: lạnh ~80%, vũng lửa ấm ~15%, điểm nhấn ≤5%.
- Mọi nguồn sáng ấm phải có lý do: lửa trại, lò rèn, đèn lồng, cửa lều hắt ra. Không có đèn đường đều nhau.
- Điểm màu lam duy nhất là waypoint bằng đá cổ.

### Bố cục (vòng đồng tâm)
- Hàng rào cọc gỗ, tháp gác, cổng chính.
- Khu ngoài: chuồng ngựa, xe hàng, bãi tập.
- Vòng chợ: lều vải và xe buôn.
- Trung tâm: một ĐỐNG LỬA TRẠI LỚN trên quảng trường.
- Quanh đó:
  - lò rèn ngoài trời (nguồn sáng thứ hai);
  - lều thầy thuốc, có xác phủ vải gần đó;
  - hầm đá kiên cố có cửa sắt (kho/ngân hàng);
  - doanh trại gỗ dài (hội quán guild);
  - nhà nguyện gỗ nhỏ;
  - cột gỗ dán giấy truy nã.
- Nghĩa địa nhỏ sát rào.
- Từ trong trại luôn thấy rào, và qua rào thấy đồng hoang trống trải trong sương: cỏ úa, đá rêu, cây trụi, xác lính, bóng quái nhỏ còng lưng lảng vảng xa xa.

### Mức kinh dị 1–2
Xác phủ vải, máu khô, rào vá, tên cắm trên gỗ, vết cháy. KHÔNG gore tươi, không xác phơi trần trong khu đông người.

### Phong cách
- Concept art painterly kiểu cinematic matte painting cho game.
- Chất liệu nặng và cũ: gỗ ướt, bùn, sắt gỉ, vải bạc màu.
- Trung cổ châu Âu, hiện thực u ám.
- Tránh: cartoon, màu bão hòa, neon, trời xanh, nắng, fantasy anh hùng sáng sủa, chữ/watermark trong ảnh.

## Cần gen 6 ảnh, tỷ lệ 16:9 (landscape)
1. `01_establishing_iso.png` — toàn cảnh trại nhìn từ góc cao 3/4 isometric (kiểu camera ARPG). Thấy rõ vòng đồng tâm, đống lửa trung tâm, rào, đồng hoang bao quanh trong sương mưa phùn.
2. `02_bonfire_plaza.png` — quảng trường lửa trung tâm, góc isometric gần hơn. Đông người chơi (chiến binh, pháp sư, cung thủ mặc giáp đa dạng nhưng xỉn màu). Lửa là điểm sáng nổi nhất; bùn ướt phản chiếu lửa.
3. `03_market_ring_drizzle.png` — vòng chợ dưới mưa phùn: lều vải, xe hàng, đèn lồng treo, người tụ dưới mái. Góc ngang tầm mắt hoặc hơi cao.
4. `04_palisade_edge_dusk.png` — rìa trại lúc chạng vạng, nhìn từ trong ra: lính gác trên tháp, rào vá, nghĩa địa nhỏ. Qua rào là đồng hoang trong sương với bóng quái xa. Cảm giác bị vây.
5. `05_siege_night_event.png` — sự kiện "Đêm vây hãm": ban đêm, quái tấn công rào ngoài, người chơi thủ thành, mũi tên lửa, đuốc. Bên trong trại vẫn có các vũng lửa an toàn.
6. `06_service_landmarks_sheet.png` — sheet thiết kế 4 công trình dịch vụ trên nền trung tính tối: lò rèn ngoài trời, hầm đá kho có cửa sắt, lều thầy thuốc, waypoint đá cổ phát ánh lam. Mỗi cái nhận ra được bằng hình khối và nguồn sáng.

## Bàn giao
- Lưu (copy) toàn bộ ảnh đã gen vào thư mục `legacy/art-output/mmo-hub-bloodmoor/` với đúng tên file ở trên. Không sửa file nào khác trong repo. Không commit.
- Viết `legacy/art-output/mmo-hub-bloodmoor/README.md` liệt kê từng ảnh kèm đúng prompt đã dùng.
- Tự kiểm tra từng ảnh theo checklist dưới đây. Ảnh nào trượt rõ ràng thì gen lại tối đa 2 lần:
  - Có không khí đồng hoang âm u, lục-xám, ẩm.
  - Lửa là điểm sáng nổi nhất.
  - Thấy rào và đồng hoang.
  - Không có trời xanh hay neon.
  - Không có chữ trong ảnh.
- Báo cáo cuối: danh sách đường dẫn ảnh, ảnh nào đạt hay chưa đạt theo checklist, và ghi chú điểm yếu của từng ảnh.
