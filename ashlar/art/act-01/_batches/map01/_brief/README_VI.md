# Map 01 concept brief: 30 loại quái mở đầu và 4 nhóm environment

> **Trạng thái:** bộ brief để Astra tạo ảnh. **Không có ảnh nào do brief này tạo ra hay được xác nhận là đã sinh.** Mọi số đo là **đề xuất sản xuất tạm thời** (`docs/ASHLAR_QUY_CHUAN_QUAI_VI.md` đang được Opus review); danh sách 24 asset environment là **danh sách đề xuất tái dùng**, không phải bố cục cuối của Map 1.
> Chưa sửa master, board hay tài liệu nào khác. Brief này chỉ nằm trong `ashlar/art/act-01/_batches/map01/_brief/`.

## 1. Gồm những gì

| File | Nội dung |
|---|---|
| `MANIFEST.json` | 68 job (`id`, `kind`, `subjectId`, `variant`, `sourceIds`, `sizeSpec`, `designIntent`, `outputPath`, `promptPath`, `referenceImages`, `dependsOn`, `status`) |
| `README_VI.md` | File này |
| `prompts/*.txt` | 68 prompt tiếng Anh, mỗi file là một job, dán thẳng được vào bước tạo ảnh |

Tất cả đường dẫn trong manifest là tuyệt đối, dùng dấu `/`.

## 2. Con số

| Hạng mục | Số lượng |
|---|---|
| Loại quái (ID) | **30** = 25 thường + 5 boss (U01–U05, W01–W07, F01–F02, P01–P07, D01–D04, B01–B05) |
| Bản thiết kế mỗi quái | 2 (A và B) → **60 ảnh quái** |
| Nhóm environment | 4 (E01–E04), mỗi nhóm 6 asset → **24 asset** |
| Sheet environment | 2 mỗi nhóm (perspective + turnaround) → **8 ảnh** |
| Tổng ảnh dự kiến / job / prompt | **68 / 68 / 68** |

Roster đã được người dùng chốt, không đổi. L01 không nằm trong roster.

## 3. Quy tắc bố cục quái (đã đổi sau lần QA gần nhất)

- **Mỗi ảnh = một hàng ngang duy nhất:** **một** bóng người trung tính `H` ở trái + **năm** góc nhìn toàn thân của quái (3/4, LEFT, RIGHT, FRONT, BACK), cùng **một đường nền** và **một thước tỉ lệ**.
- Không có panel 3/4 phóng to, không có lưới 2x2, không có tỉ lệ riêng cho từng góc nhìn. 3/4 có cùng tỉ lệ với bốn góc còn lại.
- Chiều cao/dài/rộng của quái so với `H` đúng theo số thực của từng ID (ví dụ U01 = 0,95H, D01 = 0,25–0,30H). Prompt có ghi quy đổi pixel mẫu.
- **Ngoại lệ hai hàng:** chỉ P06 Poppy-Mound và B05 Hospice Mother (rất rộng/cao). Hàng 1: H, 3/4, LEFT, RIGHT; hàng 2: H (lặp lại), FRONT, BACK; vẫn cùng một tỉ lệ.
- Nền xám ấm trung tính, ánh sáng studio mềm, không cảnh nền. Mood chỉ là olive/than bùn/xám lạnh của Act I Diablo II.
- **Phong cách:** painterly lấy cảm hứng Diablo Immortal, **low detail nghiêm ngặt**: vài khối lớn sạch, chỉ vài dấu hao mòn **lớn** có chủ ý; cấm dải vải rách dày, rìa sờn, vết xước da, nhiễu hạt, dệt vải.
- Hai biến thể A/B của mỗi quái khác nhau thật về silhouette, cấu trúc vải/giáp và vị trí phụ kiện, nhưng giữ cùng danh tính canon, cỡ và đạo cụ/hành vi đặc trưng (ví dụ B02 Lullaby Man là y tá cao gầy với cũi cao trên lưng, còn P07 Cradle-Warden là khối thấp, rộng với cũi thấp).

## 4. Quy tắc environment

- Mỗi sheet có **6 ô đánh số 1–6 (lưới 3x2)**, mỗi ô một asset, không có vật thể thừa hay cảnh nền.
- **Perspective** (góc 3/4 nhìn từ trên nhẹ) tạo trước. **Turnaround** (4 góc trực giao LEFT/RIGHT/FRONT/BACK cho từng ô) `dependsOn` perspective cùng nhóm và dùng sheet perspective làm ảnh tham chiếu danh tính.
- **Mỗi ô có một bóng người 1H** cùng đường nền, cùng tỉ lệ cục bộ với asset (tỉ lệ có thể khác giữa các ô). Ô turnaround dạng 2x2 lặp lại H ở mỗi hàng.
- Ánh sáng ngày trung tính, vật liệu khớp bảng màu xanh D2 nhưng không tối, không bị che. Dấu vá/sửa của con người chỉ là vài mảng lớn.
- Độ phân giải: ưu tiên 3:2 và 4K-wide nếu công cụ tích hợp cho phép; **không đòi cờ API không hỗ trợ**.
- Tượng thánh không mặt (E04-5): thân tượng 1,10–1,15H (nguồn LD, không tính vòm), đá xám, **không phát sáng**.

## 5. Danh sách 30 loại quái

Cột kích thước giữ **số thực** h/V/L/W (đơn vị H), không dùng nhãn nhóm. Đường ra: `monsters/<thư mục>/vA|vB/concept.png` (riêng `U01_A` xem mục 7).

| # | ID | Quái | Thư mục | Kích thước (đề xuất) | Bố cục |
|---|---|---|---|---|---|
| 1 | U01 | Shambler | U01_shambler | h 0.90–1.00H (chọn 0.95) | 1 hàng |
| 2 | U02 | Charnel Dead | U02_charnel_dead | h 0.90–1.00H (chọn 0.95) | 1 hàng |
| 3 | U03 | Charnel Bowman | U03_charnel_bowman | h 0.90–1.00H (chọn 0.95) | 1 hàng |
| 4 | U04 | Charnel Ghoul | U04_charnel_ghoul | h_standing 0.90–1.00H (chọn 0.92); V_four_legged 0.45–0.60H (chọn 0.55); L 1.10–1.40H (chọn 1.25) | 1 hàng |
| 5 | U05 | The Swollen | U05_the_swollen | h 0.90–1.00H (chọn 0.95); W 0.80–1.00H (chọn 0.9) | 1 hàng |
| 6 | W01 | Mortar-Rat | W01_mortar_rat | L 0.25–0.35H (chọn 0.3); height_estimate ≈ 0.16H (ước lượng suy ra) | 1 hàng |
| 7 | W02 | Gibbet-Crow | W02_gibbet_crow | W_open_span 0.70–0.90H (chọn 0.8); L_body 0.40–0.50H (chọn 0.45); standing_height_estimate ≈ 0.4H (ước lượng suy ra) | 1 hàng |
| 8 | W03 | Hush-Wolf | W03_hush_wolf | h_standing 0.90–1.00H (chọn 0.95); V_four_legged 0.60–0.70H (chọn 0.65); L 1.20–1.40H (chọn 1.3) | 1 hàng |
| 9 | W04 | Mire-Sucker | W04_mire_sucker | L 0.30–0.40H (chọn 0.35); standing_height_estimate ≈ 0.2H (ước lượng suy ra) | 1 hàng |
| 10 | W05 | Corpse-Candle | W05_corpse_candle | flame_diameter 0.30–0.50H (chọn 0.4); hover_height 0.50–0.80H (chọn 0.65) | 1 hàng |
| 11 | W06 | Willow-Hulk | W06_willow_hulk | h 1.60–1.80H (chọn 1.7) | 1 hàng |
| 12 | W07 | Shroud-Spinner | W07_shroud_spinner | W_leg_span 1.00–1.30H (chọn 1.15); L_body 0.30–0.40H (chọn 0.35) | 1 hàng |
| 13 | F01 | Body-snatcher | F01_body_snatcher | h 0.95–1.05H (chọn 1) | 1 hàng |
| 14 | F02 | Poppy Nurse | F02_poppy_nurse | h 0.95–1.05H (chọn 1) | 1 hàng |
| 15 | P01 | The Soothed | P01_the_soothed | h 0.90–1.00H (chọn 0.95) | 1 hàng |
| 16 | P02 | Hush-Herald | P02_hush_herald | h 1.15–1.30H (chọn 1.22) | 1 hàng |
| 17 | P03 | Hush-Moths | P03_hush_moths | wing_each 0.10–0.15H (chọn 0.12); wingspan_estimate ≈ 0.25H (ước lượng suy ra); swarm_zone 1.00–1.50H | 1 hàng |
| 18 | P04 | Hive-Sleeper | P04_hive_sleeper | L 1.40–1.70H (chọn 1.55); h_crawling 0.50–0.70H (chọn 0.6) | 1 hàng |
| 19 | P05 | Wet-Nurse | P05_wet_nurse | h 1.00–1.05H (chọn 1.02); W 0.90–1.10H (chọn 1); swaddling_L 0.25–0.35H (chọn 0.3) | 1 hàng |
| 20 | P06 | Poppy-Mound | P06_poppy_mound | W 2.00–3.00H (chọn 2.5); h 0.80–1.20H (chọn 1) | 2 hàng |
| 21 | P07 | Cradle-Warden | P07_cradle_warden | h 2.00–2.40H (chọn 2.2); cradle_L 0.80–1.00H (chọn 0.9) | 1 hàng |
| 22 | D01 | Hodling | D01_hodling | h 0.25–0.30H (chọn 0.275) | 1 hàng |
| 23 | D02 | Kiln-Shaman | D02_kiln_shaman | h 0.30–0.40H (chọn 0.35); pot_extra 0.10–0.15H (chọn 0.12) | 1 hàng |
| 24 | D03 | Kiln-Bull | D03_kiln_bull | V 1.10–1.20H (chọn 1.15); L 2.00–2.40H (chọn 2.2) | 1 hàng |
| 25 | D04 | Tithe-Thief | D04_tithe_thief | h 0.35–0.44H (chọn 0.4) | 1 hàng |
| 26 | B01 | Sexton's Dog | B01_sextons_dog | V 0.50–0.60H (chọn 0.55); L 1.10–1.30H (chọn 1.2) | 1 hàng |
| 27 | B02 | Lullaby Man | B02_lullaby_man | h 2.00–2.40H (chọn 2.2); cradle_W 0.80–1.00H (chọn 0.9) | 1 hàng |
| 28 | B03 | Ember-Pot | B03_ember_pot | h_shaman 0.50–0.70H (chọn 0.6); pot_L 1.50–2.00H (chọn 1.75); pot_height 0.80–1.00H (chọn 0.9) | 1 hàng |
| 29 | B04 | Willow Bride | B04_willow_bride | h 0.95–1.00H (chọn 0.975); root_spread 1.00–1.50H (chọn 1.25) | 1 hàng |
| 30 | B05 | Hospice Mother | B05_hospice_mother | h 2.50–3.00H (chọn 2.75); W_hands 2.50–3.50H (chọn 3) | 2 hàng |

Thư mục của U02, U03, U04, U05, W01 đã được chốt theo batch Astra đang chạy; **không ghi vào các thư mục đó từ brief này**.

## 6. Danh sách 24 asset environment

| Nhóm | Ô | Asset | Kích thước đề xuất | Bố trí trong ô turnaround |
|---|---|---|---|---|
| E01 | 1 | Low grass clump | h 0.38H, W 0.6H | 1 hàng |
| E01 | 2 | Tall reeds clump | h 1.5H, W 0.8H | 1 hàng |
| E01 | 3 | Sedge water clump | h 0.7H, W 0.9H | 1 hàng |
| E01 | 4 | Large moss rock | h 1.1H, W 1.8H, D 1.3H | 2x2 |
| E01 | 5 | Peat bank chunk | h 0.8H, L 2H, D 1H | 2x2 |
| E01 | 6 | Waterlogged root stump | h 0.9H, W 1.5H | 1 hàng |
| E02 | 1 | Old broad weeping willow | h 7H, W 8H, trunk_dia 1H | 2x2 |
| E02 | 2 | Young willow | h 3.5H, W 3.5H | 2x2 |
| E02 | 3 | Dead angular tree | h 5H, W 3H | 1 hàng |
| E02 | 4 | Gnarled stump | h 0.8H, W 1.3H | 1 hàng |
| E02 | 5 | Fallen hollow trunk | L 4H, dia 0.9H | 2x2 |
| E02 | 6 | Exposed willow root cluster | h 1.2H, W 2.5H | 2x2 |
| E03 | 1 | Repaired thatched stilt cottage | h 3.8H, W 3.5H, D 2.8H, stilt_height 0.7H | 2x2 |
| E03 | 2 | Raised wooden walkway segment | L 3H, W 1H, deck_height 0.5H | 2x2 |
| E03 | 3 | Patched low flint wall | L 3H, h 0.75H, thick 0.45H | 2x2 |
| E03 | 4 | Willow hurdle fence | L 2.5H, h 0.95H | 2x2 |
| E03 | 5 | Village well | h 2H, W 1.4H, rim_height 1H | 1 hàng |
| E03 | 6 | Eel-trap fishing rack | h 1.7H, W 2.2H | 2x2 |
| E04 | 1 | Lychgate roofed gate | h 3.2H, W 3.4H, D 1.8H | 2x2 |
| E04 | 2 | Mortsafe grave cage | L 2.2H, W 0.9H, h 0.9H | 2x2 |
| E04 | 3 | Small mismatched headstone cluster | W 2.4H, h_max 0.9H, stones 5H | 2x2 |
| E04 | 4 | Round ossuary tower | h 4.6H, dia 2.6H | 1 hàng |
| E04 | 5 | Faceless saint statue supporting arch | statue_h 1.125H, arch_W 1.8H, total_h 2.1H | 1 hàng |
| E04 | 6 | Funeral hand cart | L 2.3H, W 1H, h 0.95H | 2x2 |

Đường ra: `environments/E01_wetland/`, `E02_trees/`, `E03_village/`, `E04_burial/`, mỗi thư mục có `perspective.png` và `turnaround.png`.

## 7. Pilot hiện có (bảo toàn, không ghi đè)

| Job | Đường dẫn | Ghi chú |
|---|---|---|
| `U01_A` | `monsters/U01_shambler/vA/concept_v3.png` | Pilot **đã được root chấp nhận** ở mức concept (style + layout). Manifest dùng đúng đường này. `concept.png`, `concept-v2.png` là bản nháp cũ, giữ nguyên. Prompt `U01_A.txt` chỉ ghi lại thiết kế để tái sinh nếu cần. |
| `U01_B` | `monsters/U01_shambler/vB/concept.png` | File đã tồn tại, root QA chưa xong. |

Cả hai job vẫn mang `status: "planned"` theo yêu cầu; trường `pilot` trong manifest ghi trạng thái thực. Các quái khác dùng `concept_v3.png` **chỉ làm tham chiếu layout và kỹ thuật vẽ**, không phải giải phẫu hay thiết kế (đã ghi rõ trong prompt; vai trò từng ảnh tham chiếu nằm trong `referenceImages`).

## 8. Tham chiếu hình ảnh (đường dẫn tuyệt đối)

- Style: `E:/Diablo2/ashlar/art/textures/terrain-dark-wood/_review_stylized2.jpg` (chỉ nét cọ và khối vật liệu)
- Mood: `E:/Diablo2/ashlar/art/textures/terrain-dark-wood/_ingame/d2_webgl.png` (chỉ khí hậu và bảng màu ẩm Act I D2, không lấy cảnh hay nhân vật giữ chỗ)
- Layout: `E:/Diablo2/ashlar/art/act-01/monsters/U01_shambler/vA/concept_v3.png` (từ quái thứ hai trở đi)

## 9. Cách chạy

1. 60 job quái độc lập, không cần chờ nhau. Job B không phụ thuộc A; nó dùng `concept_v3.png` làm tham chiếu layout, không sao chép thiết kế A.
2. Environment: chạy `Exx_perspective` trước, duyệt, rồi mới chạy `Exx_turnaround` (đính kèm perspective).
3. **Không ghi đè** ảnh đã có. Chạy lại thì đặt hậu tố mới (ví dụ `concept_v2.png`).
4. Mỗi ảnh xong thì báo đường dẫn riêng để xem ngay.
5. Brief này không gọi API hay CLI nào.

## 10. Điều chỉnh theo kết quả review nguồn

| Mục | Xử lý trong prompt |
|---|---|
| U03 "kites at range" | Hiểu là **lùi vừa bắn, giữ khoảng cách**, không phải thả diều theo nghĩa đen |
| U01, U02, W01, B01 (Prologue) | **Không có màu accent** |
| D01–D04, B03 | Giữ đỏ-cam lò **theo vật liệu**: vài vệt nứt lớn, không phát sáng |
| B05 Hospice Mother | Bàn tay màu da ngà ấm **đề xuất ≈ #D6C7AE**, mờ, không tự phát sáng; **HEX cuối chờ bên sửa tài liệu**; loại trừ trắng Seamless |
| P05 Swaddlings | Quy tắc "bọc vải và xương, **không giống em bé**" là **đề xuất sản xuất rút ra từ LD (không có gore với trẻ em)**, không phải canon nguyên văn |
| P07 và B02 | Silhouette tách hẳn: P07 thấp, rộng, cũi thấp; B02 cao, gầy, cũi cao |
| Tượng thánh E04-5 | Thân 1,10–1,15H (LD), đá, không phát sáng |

Các điểm mở của nguồn được giữ trong trường `openSourceNotes` của từng job (W03 người biến hình xếp Warped, W05 không phải động vật, W06 rễ và xương, F02 và Bible §6.3, B04 chưa có họ, B01 chưa có trong lời kể Prologue). Brief không tự giải quyết chúng.

## 11. Rủi ro đã biết

- **Quái rất nhỏ so với H** (P03 Hush-Moths sải cánh ≈ 0,25H, W01, W04, W02, D01, D02, D04): đúng tỉ lệ nên chỉ cao khoảng 60–200 px trên canvas 3:1. Nếu quá nhỏ để duyệt, nên xin duyệt thêm một sheet phóng riêng (ngoài 68 job này). Brief không tự phá quy tắc một tỉ lệ.
- **Quái dài** (D03, B03, B01, P04…): thước pixel trong prompt đã giảm để cả sáu hình vừa một hàng.
- **Asset environment rất lớn so với H** (liễu già 7H): ô turnaround dùng khối 2x2 để vừa; bóng người trong ô đó sẽ nhỏ.
- Công cụ tích hợp có thể không giữ chính xác 3:1 hay 4K. Prompt cho phép hạ độ phân giải nhưng vẫn yêu cầu giữ tỉ lệ.

## 12. Kiểm tra đã chạy

Validator tạm (đã xóa, không nằm trong repo) kiểm: 68 job; `id`, `outputPath`, `promptPath` đều duy nhất và file prompt tồn tại; 30 ID × 2 biến thể (25 thường + 5 boss); 4 nhóm × 6 asset × 2 sheet; turnaround `dependsOn` perspective cùng nhóm; U01_A giữ `concept_v3.png`; thư mục cố định của U02–U05 và W01; các ảnh tham chiếu có sẵn tồn tại trên đĩa; không còn nhãn nhóm số; không có HEX trắng Seamless; mỗi prompt quái có đúng một khối bóng người, đúng tiêu đề và nhãn. Kết quả: 0 lỗi.
