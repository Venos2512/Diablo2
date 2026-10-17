# Diablo II — Bộ tài liệu Art Direction (Visual · Theme · Mood · Feel)

Bộ tài liệu này là "kinh thánh hình ảnh" (art bible) cho bất kỳ dự án nào muốn **tái tạo hoặc lấy cảm hứng** từ cảm giác Diablo II cổ điển (2000, kèm Lord of Destruction 2001). Nó trả lời câu hỏi *"vì sao nhìn vào là biết Diablo II"* và biến câu trả lời đó thành quy tắc duyệt art.

Bổ sung cho `../DIABLO_II_ART_CHECKLIST_VI.md` (danh sách *cần làm gì*). Bộ này trả lời *làm ra sao cho đúng chất*.

## Bản tổng hợp

- **`Diablo_II_Art_Direction.html`** — toàn bộ art direction trong một file HTML độc lập: mục lục cố định, 13 chương, 3 biểu đồ nhúng sẵn, in được ra PDF (Ctrl+P). **Gửi file này cho team.**
- **`DIABLO_II_ART_DIRECTION_TONG_HOP.md`** — cùng nội dung dạng Markdown một file.
- Hai file trên được **sinh tự động** — không sửa trực tiếp. Sửa các chương rồi chạy lại:
  `python art-direction/tools/build_bible.py` (cần `pip install markdown`).

## Cấu trúc

| File | Nội dung | Ai đọc trước |
|---|---|---|
| `00_TOM_TAT_ART_DIRECTION.md` | **Tóm tắt một trang**: mọi quyết định cốt lõi, thứ tự sản xuất, việc còn phải xác minh | Lead, người mới |
| `01_TAM_NHIN_VA_TRU_COT.md` | Một câu tầm nhìn, 6 trụ cột, cảm giác cốt lõi | Toàn team |
| `02_THEME_VA_CAU_CHUYEN.md` | Chủ đề, motif, giọng kể, mức độ kinh dị | AD, writer, concept |
| `03_MOOD_THEO_ACT.md` | Đường cong cảm xúc, mood board bằng chữ cho 5 Act | Concept, env, lighting |
| `04_MAU_SAC_VA_ANH_SANG.md` | Chiến lược palette, cấu trúc giá trị sáng, ánh sáng | Toàn bộ art |
| `05_HINH_KHOI_VAT_LIEU_CAMERA.md` | Shape language, vật liệu, camera, tỷ lệ | Character, env, tech art |
| `06_NHAN_VAT_VA_QUAI.md` | Ngôn ngữ thiết kế hero, quái, boss | Character, animation |
| `07_COMBAT_FEEL_VFX.md` | Cảm giác đánh, chết, phép, máu | VFX, animation, design |
| `08_UI_LOOT_AM_THANH.md` | UI, vật phẩm, màu chữ loot, âm thanh như nửa kia của hình | UI, audio, design |
| `09_DO_DONT_VA_TIEU_CHI_DUYET.md` | Quy tắc nên/không nên, rubric chấm điểm, red flag | AD, lead |
| `10_NGUON_THAM_KHAO.md` | Nguồn, mức độ tin cậy | Mọi người |
| `11_ACT1_PHAN_TICH_CHI_TIET.md` | Act I sâu: cấu trúc vùng, tu viện, quái, boss, NPC, âm thanh, color script, tileset, 10 phút đầu | Team làm Act I |
| `12_QUY_CHUAN_QUAI_CANH_QUAN_CONG_TRINH.md` | Quy chuẩn kích thước quái, bộ quái, tạo hình quái, cảnh quan, công trình, bàn giao | Character, env, level art |
| `scale_chart.html` | Bảng tỷ lệ quái và công trình theo đơn vị H | Mở bằng trình duyệt |
| `palette_board.html` | Bảng màu và value board trực quan cho từng Act | Mở bằng trình duyệt |
| `act1_color_script.html` | Color script 15 khung cho hành trình Act I | Mở bằng trình duyệt |

## Quy ước độ tin cậy

- **[Đã xác minh]** — có trong nguồn công khai của Blizzard/Blizzard North (postmortem, phỏng vấn).
- **[Quan sát]** — đọc trực tiếp từ game, cộng đồng biết rộng rãi, kiểm tra được khi chơi.
- **[Diễn giải AD]** — đề xuất/diễn giải của tài liệu này để sản xuất. Không phải tuyên bố của Blizzard.

Mã màu HEX trong tài liệu là **[Diễn giải AD]**: màu xấp xỉ để làm việc, không phải màu trích từ file palette gốc.

## Cách dùng trong sản xuất

1. Kick-off: cả team đọc file 01 và 09 (≈15 phút).
2. Trước mỗi vùng/Act mới: concept + env + lighting đọc file 03 và 04, dựng mood board ảnh theo mục "Từ khóa tìm ref".
3. Mỗi buổi duyệt: dùng rubric ở file 09, chấm ở **kích thước trong game**, không chấm trên render lớn.
