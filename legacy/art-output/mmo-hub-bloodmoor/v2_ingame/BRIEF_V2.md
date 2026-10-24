# Brief V2 — Trại trung tâm MMO, render như ảnh chụp trong game

Dùng công cụ TẠO ẢNH (image generation) của bạn. Nếu không có công cụ tạo ảnh thật, DỪNG và báo lại. Không vẽ bằng code/procedural.

## Ảnh mẫu (bắt buộc bám theo)
File đính kèm `REFERENCE_ingame.png` là ảnh chụp màn hình gameplay ARPG. Dùng nó làm chuẩn cho:

- **Camera:** góc nhìn từ trên xuống ~45–55°, cố định, hơi nghiêng. Không phải isometric bản đồ toàn cảnh, không phải ngang tầm mắt.
- **Khoảng cách camera:** nhân vật người chơi cao khoảng 1/5–1/6 chiều cao khung hình. Thấy được khu vực quanh nhân vật bán kính vài chục mét, không thấy toàn bộ trại.
- **Chất render:** ảnh chụp in-engine 3D hiện đại (PBR, ánh sáng thời gian thực), giống screenshot gameplay. KHÔNG phải tranh concept painterly hay matte painting cinematic.
- **Ánh sáng:** đêm/chạng vạng, nền tối, cỏ dày tối màu, viền tối dần ra mép khung hình (vignette như vùng sáng quanh nhân vật). Nhân vật và hiệu ứng là điểm sáng.
- **Mật độ chi tiết mặt đất:** cỏ dày, đá rêu, bụi cây như ảnh mẫu.
- **Cảm giác đọc:** nhân vật và quái tách rõ khỏi nền.

KHÔNG sao chép nhân vật, quái hay trang phục trong ảnh mẫu. Chỉ lấy camera, chất render và ánh sáng. Thiết kế phải là bản gốc; không dùng tên, logo hay asset Blizzard. Không có UI, thanh máu hay chữ trên màn hình.

## Nội dung: trại trung tâm "Tiền đồn Đồng hoang"
- **Một câu:** "Chiều tối mưa phùn trên đồng hoang. Sau hàng rào cọc, vài trăm người sống sót tụ quanh những đống lửa."
- **Tinh thần:** trại là tiền đồn bị vây; đọc là "đang chống cự", không phải "đã thua".
- **Mood:** lạnh bao trùm, ấm từng điểm. Mọi nguồn sáng ấm đều có lý do: lửa trại, lò rèn, đèn lồng, đuốc. Không có đèn phủ đều.
- **Palette:**
  - cỏ đồng hoang lục tối như ảnh mẫu, ngả xám-lục ở chỗ bị giẫm;
  - bùn nâu ướt;
  - gỗ cọc sẫm;
  - vải lều bạc màu;
  - lửa cam #D9822B.
- **Điểm lam duy nhất:** waypoint đá cổ.
- **Mức kinh dị 1–2:** xác phủ vải, máu khô, rào vá, tên cắm trên gỗ. Không gore tươi.
- **Người chơi:** các lớp nhân vật gốc, đa dạng (chiến binh giáp nặng, pháp sư áo choàng, cung thủ, kẻ triệu hồi), trang bị xỉn màu, không neon.

## Cần gen 6 ảnh, tỷ lệ 1:1 (vuông như ảnh mẫu)
1. `v2_01_bonfire_plaza.png` — nhân vật người chơi đứng gần đống lửa trại lớn ở quảng trường; 6–10 người chơi khác quanh lửa; mặt đất bùn và cỏ giẫm nát phản chiếu lửa.
2. `v2_02_market_ring.png` — người chơi đi qua vòng chợ: lều vải, xe hàng, đèn lồng treo, thương nhân NPC; mưa phùn nhẹ.
3. `v2_03_forge_and_vault.png` — khu lò rèn ngoài trời (nguồn sáng mạnh, đe, tia lửa) cạnh hầm đá kho có cửa sắt và hai lính canh.
4. `v2_04_gate_palisade.png` — cổng chính và hàng rào cọc nhìn từ bên trong. Một nửa khung là trong trại (đuốc, lính gác); nửa kia qua cổng là đồng hoang cỏ dày tối, có 2–3 quái nhỏ còng lưng màu đỏ sẫm lảng vảng ở xa (thiết kế gốc).
5. `v2_05_healer_graveyard.png` — lều thầy thuốc với xác phủ vải, nến, nghĩa địa nhỏ sát rào; một người chơi đứng cạnh waypoint đá cổ phát ánh lam.
6. `v2_06_siege_night.png` — "Đêm vây hãm": người chơi chiến đấu ngay trên đồng cỏ sát chân rào, quái tràn tới, hiệu ứng phép (sét lam, lửa) chiếu sáng cỏ như ảnh mẫu. Rào và đuốc ở phía trên khung hình.

## Bàn giao
- Lưu ảnh vào `legacy/art-output/mmo-hub-bloodmoor/v2_ingame/` với đúng tên file. Không sửa file nào khác, không commit, không động vào các file v1 ở thư mục cha.
- Viết `legacy/art-output/mmo-hub-bloodmoor/v2_ingame/README.md` liệt kê từng ảnh kèm prompt đã dùng.
- Tự kiểm tra từng ảnh theo checklist dưới đây. Ảnh trượt rõ thì gen lại tối đa 2 lần:
  - Camera và chất render giống ảnh mẫu (screenshot gameplay, không phải tranh).
  - Lửa/phép là điểm sáng nổi nhất.
  - Mood đồng hoang tối, ẩm.
  - Không có chữ hay UI.
  - Không có trời xanh hay neon.
- Báo cáo cuối: đường dẫn ảnh, đạt/chưa đạt, điểm yếu của từng ảnh.
