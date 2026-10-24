# Brief V3 — Trại trung tâm MMO, render in-game (bản sửa)

Dùng công cụ TẠO ẢNH (image generation) của bạn. Nếu không có công cụ tạo ảnh thật, DỪNG và báo lại. Không vẽ bằng code/procedural.

V3 sửa các lỗi của V2. Đọc kỹ phần **"Sửa so với V2"** — đây là ưu tiên số 1.

## Ảnh mẫu (bắt buộc bám theo)
`REFERENCE_ingame.png` (đính kèm) là ảnh chụp gameplay ARPG. Lấy từ nó: camera, khoảng cách camera, chất render, ánh sáng, độ tối. KHÔNG sao chép nhân vật, quái hay trang phục trong ảnh. Thiết kế bản gốc; không tên, logo hay asset Blizzard. Không UI, không thanh máu, không chữ.

## Sửa so với V2 — BẮT BUỘC

### 1. Camera xa hơn
- Góc nhìn từ trên xuống ~50–60°, cố định như ảnh mẫu.
- **Nhân vật người chơi chỉ cao khoảng 1/6 chiều cao khung hình** (V2 đang ~1/3–1/4, quá gần).
- Thấy nhiều mặt đất xung quanh, nhiều khoảng trống cỏ/bùn giữa các vật thể.
- Đặt nhân vật chính gần giữa khung.

### 2. Lạnh bao trùm, ấm từng điểm
V2 đang vàng cam toàn khung — sai.
- **Ánh sáng nền phải lạnh và tối:** đêm/chạng vạng xanh lục-xám tối như ảnh mẫu. Cỏ lục tối, đá xám lạnh.
- Ánh ấm CHỈ tồn tại trong bán kính nhỏ quanh từng nguồn lửa, tắt dần nhanh. Ngoài bán kính đó toàn bộ là lạnh.
- Tỷ lệ diện tích: lạnh/tối ≥ 75%, vùng ấm ≤ 20%.
- Mép khung hình tối dần (vignette) như ảnh mẫu.
- Mỗi ảnh tối đa **1 nguồn sáng lớn + 2–3 nguồn nhỏ**. Không rải đèn lồng khắp nơi.

### 3. Giảm mạnh độ chi tiết texture
V2 quá chi tiết, quá "ảnh thật", quá nhiễu.
- **Bề mặt đơn giản, mảng lớn đọc rõ.** Ít vi chi tiết (micro-detail): không vân gỗ li ti, không từng sợi vải, không từng viên sỏi.
- Texture kiểu tài sản game mức LOD trung bình: màu phẳng hơn, chuyển sắc mềm, ít gờ, ít đốm.
- Cỏ thành **cụm/mảng lớn**, không từng lá riêng; ít hoa dại.
- **Ít đồ lặt vặt (props):** giảm khoảng một nửa số thùng, hộp, giỏ, dụng cụ so với V2. Giữ lại vật thể lớn kể chuyện.
- Ít điểm phản quang (specular) nhỏ: bùn ướt phản chiếu lửa bằng vài mảng lớn mềm, không hàng trăm chấm sáng.
- Nhân vật: giáp và áo đọc bằng 2–3 mảng màu lớn, không chạm khắc chi tiết.
- Mục tiêu cảm giác: screenshot game ARPG 3D gọn, sạch, đọc nhanh — gần mức chi tiết mặt đất trong ảnh mẫu hoặc thấp hơn. KHÔNG hyper-realistic, không matte painting.

## Nội dung: trại trung tâm "Tiền đồn Đồng hoang"
- **Tinh thần:** tiền đồn bị vây trên đồng hoang; "đang chống cự", không phải "đã thua". Đêm, mưa phùn nhẹ.
- **Palette:**
  - cỏ lục tối;
  - bùn nâu sẫm;
  - gỗ cọc sẫm;
  - vải lều xám-nâu bạc màu;
  - lửa cam #D9822B.
- **Điểm lam duy nhất:** waypoint đá cổ.
- **Mức kinh dị 1–2:** xác phủ vải, rào vá, tên cắm trên gỗ. Không gore tươi.
- **Người chơi:** lớp nhân vật gốc đa dạng (chiến binh giáp nặng, pháp sư, cung thủ, kẻ triệu hồi), trang bị xỉn màu, không neon.

## Cần gen 6 ảnh, tỷ lệ 1:1
1. `v3_01_bonfire_plaza.png` — nhân vật người chơi đứng gần đống lửa trại lớn ở quảng trường, 5–7 người chơi khác quanh lửa. Lửa là nguồn sáng lớn duy nhất. Phần còn lại của quảng trường chìm trong lạnh tối.
2. `v3_02_market_ring.png` — người chơi đi qua vòng chợ: 3–4 lều vải, 1 xe hàng, chỉ 2–3 đèn lồng. Mưa phùn. Lối bùn rộng ở giữa.
3. `v3_03_forge_and_vault.png` — lò rèn ngoài trời (nguồn sáng lớn, đe, tia lửa) cạnh hầm đá kho có **cửa sắt đặc** và hai lính canh.
4. `v3_04_gate_palisade.png` — cổng chính và hàng rào cọc nhìn từ trong. Nửa dưới khung là trong trại (2 đuốc, lính gác). Nửa trên qua cổng là đồng hoang cỏ tối, có 2–3 quái nhỏ còng lưng đỏ sẫm (thiết kế gốc) lảng vảng.
5. `v3_05_healer_graveyard.png` — lều thầy thuốc (xác phủ vải, nến), nghĩa địa nhỏ sát rào, và một người chơi đứng cạnh waypoint đá cổ phát ánh lam.
6. `v3_06_siege_night.png` — "Đêm vây hãm": 2–3 người chơi chiến đấu trên đồng cỏ sát chân rào, 5–7 quái đỏ sẫm. Hiệu ứng phép (sét lam, lửa) là nguồn sáng chiếu lên cỏ như ảnh mẫu. Rào và 2 đuốc ở mép trên khung.

## Bàn giao
- Lưu ảnh vào `legacy/art-output/mmo-hub-bloodmoor/v3_ingame/` với đúng tên file. Không sửa file khác, không commit, không động vào thư mục v1/v2.
- Viết `legacy/art-output/mmo-hub-bloodmoor/v3_ingame/README.md` liệt kê ảnh kèm prompt đã dùng.
- Tự kiểm tra mỗi ảnh theo checklist dưới đây. Ảnh trượt thì gen lại tối đa 2 lần:
  - Nhân vật cao ~1/6 khung.
  - Nền lạnh-tối ≥ 75%, ấm chỉ quanh nguồn lửa.
  - Texture đơn giản, ít props, không nhiễu chi tiết.
  - Giống screenshot gameplay như ảnh mẫu.
  - Không chữ hay UI.
- Báo cáo cuối: đường dẫn ảnh, đạt/chưa đạt, điểm yếu.
