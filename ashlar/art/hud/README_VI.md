# ASHLAR HUD — concept v1 (PC và mobile)

> **Trạng thái:** concept **đề xuất** theo art direction v1, **chưa duyệt**. Ảnh do Astra (`gpt-6-astra`) tạo qua Codex CLI ngày 20/10/2026, mỗi ảnh một phiên riêng.
> Cảnh nền chỉ để minh họa HUD trong lúc chơi; **không phải Map 1 đã dựng hay đã duyệt**. Quái dùng hướng A của batch concept Map 1, hướng này chưa được chốt. Chưa sửa master art direction, board hay tài liệu nào khác.

## 1. Căn cứ (canon, không tự đặt)

| Thành phần HUD | Nguồn |
|---|---|
| Khung giao diện bằng **đá đẽo và vữa xám**; chữ serif có nét **đục như khắc đá** | World Bible §17.7 |
| **Globe máu đổi màu theo cốt truyện**: vữa xám (Prologue) → đỏ khi tim đập lại (Act I) → đỏ có **sợi trắng-vàng** khi các Perfection tụ lại (Act III–V) | Bible §16; Vocation §18.3 |
| Mỗi nghề một **bình tài nguyên đọc bằng hình dạng, không bằng màu** (chạy được ở grayscale, cho người mù màu) | Vocation §18.3, §18.7 |
| PB: khung kiệu, quan tài vữa xây dần từng hàng · FL: chuỗi mắt xích nóng dần, **Wound** là vết nứt trên globe · OS: hòm thánh tích 8 hốc, vết nứt Strain bò lên · BR: bình thủy tinh, muối kết từ trên xuống · EX: đèn lồng, mức dầu và khấc bấc (5 nấc) · PS: làn hơi thở, sáng như than khi đang hát Hymn | Vocation §18.3, §14.2 |
| Thanh skill: LMB, RMB, 1–4, thêm **ô duy trì 5** chỉ cho Pallbearer và Pyre-Singer; Space = Dodge (2 lượt), Q = **Doubt** (học ở A2-Q3), F = **Draught** (4 lượt), R = phím đèn Osric, T = **Open a Face** | Vocation §8.8, §8.9, §17.6 |
| Độ hiếm: **Rubble** xám → **Hewn** xanh → **Dressed** vàng → **Graven** cam → **Hallowed** vàng kim; viền độ hiếm vẽ như **các hàng xây**, từ đá hộc tới đá chạm mạ vàng | Bible §16, §17.7 |
| **Không map marker trong dungeon**; ở Night Fens "tiếng ru là bản đồ", không quest marker, có caption chỉ hướng | Bible §17.8; LD §11.4, §8.4 |
| Nền tối yên, chữ dễ đọc, motif mạch xây và nghi lễ **tiết chế**; UI không cạnh tranh bằng mọi vùng vàng, đỏ, phát sáng | AD v1 §11 |
| Light radius là luật của thế giới, có falloff theo bậc, không phải vòng giao diện | LD §5.3; Vocation §17.4 |

## 2. Đề xuất riêng của bộ này (chưa phải canon)

- **Doubt nằm ở đá đỉnh (keystone).** Bible §16 gọi Doubt là "tín điều của Keystone thành một nút bấm". Trước Act II, ô này là ô **trám vữa phẳng**, không icon, như một chỗ đang chờ.
- **Thanh XP là một mạch vữa được trát dần** từ trái sang phải; level nằm trong một keystone nhỏ.
- **Minimap kiểu bản vẽ khảo sát:** nét mực xám trên da thuộc tối, viền đá đẽo, hướng bắc đánh dấu bằng hình nêm.
- **Con trỏ PC hình đinh quan tài.**
- **Motif "đường may là sự sống":** mỗi thành phần có tối đa một vết sửa (vết nứt kẹp đinh đỉa sắt hoặc miếng vữa mới), đinh quan tài làm đinh tán.
- **Ô skill chưa học** là khối đá thô chưa đẽo (mượn từ màn cây kỹ năng, Vocation §18.1).

## 3. Tám ảnh

Mỗi mockup dùng một nghề khác nhau để sáu bình tài nguyên đều xuất hiện trong bối cảnh chơi.

| ID | Nền tảng | Hướng HUD | Nghề | Cảnh | Globe | File |
|---|---|---|---|---|---|---|
| PC-A | PC 16:9 | **Footing Course / Bệ tường**: một bức tường đá full chiều ngang ở đáy màn hình, kế thừa bố cục ARPG cổ điển | Pallbearer | Lychgate churchyard, mưa phùn | Act I đỏ | `PC_A_footing_course/mockup.png` |
| PC-B | PC 16:9 | **Keystone Arch / Vòm đá đỉnh**: một vòm đá ở giữa đáy; globe và bình là hai chân vòm, skill là các viên vòm, Doubt ở đá đỉnh | Exhumer | The Night Fens, ban đêm, light radius | Act I đỏ | `PC_B_keystone_arch/mockup.png` |
| PC-C | PC 16:9 | **Quiet Stones / Đá lặng**: tối giản, các tấm đá nhỏ rời bám góc, không có thanh; thử trên nền sáng nhất game | Brinecaller | The White Road (Act III), nắng trưa | Act III–V đỏ + sợi trắng-vàng | `PC_C_quiet_stones/mockup.png` |
| M-A | Mobile 19,5:9 | **Thumb Arch / Vòm ngón cái**: bố cục mobile ARPG phổ thông (joystick trái, nút đánh + vòng skill phải) dựng thành vòm đá quanh ngón cái | Pyre-Singer | Rook's Weir, mưa phùn | Act I đỏ | `M_A_thumb_arch/mockup.png` |
| M-B | Mobile 19,5:9 | **Crest / Huy hiệu**: globe và bình gom vào huy hiệu góc trên trái, hai ngón cái chỉ còn thao tác; nút ngữ cảnh Rite of Laying | Flagellant | Sườn dưới Lychgate churchyard | Act I đỏ + Wound | `M_B_crest/mockup.png` |
| M-C | Mobile 19,5:9 | **Low Profile / Thấp gọn**: nhỏ hơn 20%, bán trong suốt, cho dungeon tối; minimap không marker | Ossuarist | Hầm ossuary dưới nhà thờ Lychgate | Act I đỏ | `M_C_low_profile/mockup.png` |
| KIT-1 | Sheet | Globe máu 4 trạng thái + 6 bình tài nguyên + hàng kiểm grayscale | cả sáu | nền phẳng | cả 4 trạng thái | `KIT_1_globe_vessels/sheet.png` |
| KIT-2 | Sheet | Trạng thái ô skill PC, nút mobile, khung độ hiếm theo hàng xây, nameplate thường/elite/boss | — | nền phẳng | — | `KIT_2_sockets_rarity/sheet.png` |

Cạnh mỗi ảnh có `*.prompt.txt` (prompt đã gửi), `*.task.txt` (prompt kèm khung harness), `*.generation.log` và `*.result.txt`.

## 4. Brief và cách chạy lại

- `_brief/MANIFEST.json`: 8 job, đường ra, ảnh tham chiếu theo đúng thứ tự đính kèm và vai trò từng ảnh.
- `_brief/prompts/*.txt`: prompt tiếng Anh hoàn chỉnh. Mỗi prompt = phần riêng của job + khối dùng chung `_brief/shared_hud_language.txt` (vật liệu, motif, màu, chữ, globe, bình, phím). Sửa khối dùng chung thì phải ghép lại cả tám prompt.
- `_runs/batch_2026-10-20.jsonl`: nhật ký từng lượt chạy.
- Harness là công cụ tạm ngoài repo: `E:\hud-batch\hud_batch.py` (bản sao của harness hero, chỉ đổi đường dẫn; `CODEX_HOME=E:\hud-batch\home` vì ổ C: gần đầy). Chạy lại một job thành bản mới: `python hud_batch.py --jobs PC_A --suffix _v2` (không ghi đè bản cũ).

## 5. QA và điểm còn mở

_(điền sau khi xem ảnh)_
