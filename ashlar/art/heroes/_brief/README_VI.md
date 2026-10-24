# Hero concept brief: sáu nghề × hai hướng, Prologue lineup, key art chọn nghề và sheet camera game

> **Trạng thái (20/10/2026, cập nhật sau v3):** bộ brief (vòng 3, v1) để Astra tạo ảnh **đã chạy**; trên đĩa có **36 ảnh**: 9 sheet hero v1, 12 sheet v2, 12 sheet v3, pilot bố cục `PB_A` (`concept_pilot.png`, đã duyệt về bố cục, xem §9), `PROLOGUE_LINEUP` và `CHOICE_HANDS` (palette v1). **Trình bày hero hiện hành là v3 (§15);** v2 là nguồn palette và đạo cụ (§14); v1 là lịch sử. `TOPDOWN_A/B`: v1 không chạy; v3 chưa có ảnh (§15.1). Chưa có hướng A hay B nào được chọn. Mọi kích thước, màu và hướng thiết kế đều là **đề xuất** hoặc **Voc** lấy từ `ashlar/docs/ASHLAR_HERO_CONCEPT_VI.md` (chưa khóa); danh tính nghề là Canon theo các mục nguồn mà concept doc dẫn.
> Brief này chỉ nằm trong `ashlar/art/heroes/_brief/`; không sửa master, board hay tài liệu nào khác.
> Vòng 3 áp dụng thêm toàn bộ phản hồi review vòng 2 (thước pilot, màu khung PB-B, nắp Prologue, các khối value, miếng vá mũ EX, tay màn chọn, lọ, tên Severin, Smoke-Shape, độ khả thi của sheet; xem concept doc §0, §2, §12).

> **Cập nhật 20/10/2026 (v3, hiện hành):** theo quyết định mới của người dùng, sheet hero được chạy lại thành **một hình 3/4 lớn + bốn góc FRONT/LEFT/RIGHT/BACK + vũ khí vẽ riêng, cách điệu hơn, quần áo giảm chi tiết** (`concept_v3.png`, đủ 12 sheet); xem §15 ở cuối file, concept doc §1.4 và trường `v3` trong `MANIFEST.json`.
>
> **Trước đó (v2):** sheet hero v2 (`concept_v2.png`) theo quyết định "hero nổi bật"; xem §14, concept doc §1.3 và trường `v2`. **v2 nay còn là nguồn palette và đạo cụ cường điệu; về trình bày nó bị v3 thay thế.** Các phần §1 đến §13 mô tả bộ brief v1 (vòng 3) và chỉ còn đúng cho v1 (bảy hình một hàng, không glow, đèn chưa thắp).

## 1. Gồm những gì

| File | Nội dung |
|---|---|
| `MANIFEST.json` | 16 job (`id`, `kind`, `vocation`, `direction`, `directionName`, `displayBody`, `altBody`, `sourceIds`, `sizeSpec`, `layout`, `designIntent`, `palette` có cột `lStar`, `valueRule`, `outputPath`, `promptPath`, `referenceImages`, `dependsOn`, `status`, `openNotes`; `PB_A` có thêm trường `pilot`; mỗi job hero có thêm `v2` và `v3`, `TOPDOWN_A/B` có thêm `v3`; cấp trên cùng có thêm `v2` và `v3`; `status` đã cập nhật theo ảnh trên đĩa sau v3 và là trạng thái của đầu ra v1) |
| `README_VI.md` | File này |
| `prompts/*.txt` | 16 prompt tiếng Anh (v1), mỗi file là một job, dán thẳng được vào bước tạo ảnh |
| `prompts_v2/*.txt` | 12 prompt v2 (hero push), mỗi file một job hero; sinh bằng `E:/hero-batch/build_v2.py` (§14) |
| `prompts_v3/*.txt` | 14 prompt v3: 12 job hero (một hình 3/4 + bốn góc + vũ khí riêng) và `TOPDOWN_A/B`; sinh bằng `E:/hero-batch/build_v3.py` và `build_topdown_v3.py` (§15) |

Tất cả đường dẫn trong manifest là tuyệt đối, dùng dấu `/`. Concept doc: `E:/Diablo2/ashlar/docs/ASHLAR_HERO_CONCEPT_VI.md`.

## 2. Con số

| Hạng mục | Số lượng |
|---|---|
| Nghề | **6** (PB Pallbearer, FL Flagellant, OS Ossuarist, BR Brinecaller, EX Exhumer, PS Pyre-Singer) |
| Hướng thiết kế mỗi nghề | 2 (A và B) → **12 sheet hero** |
| Job dùng chung | 2 (`PROLOGUE_LINEUP`, `CHOICE_HANDS`) |
| Sheet camera game | 2 (`TOPDOWN_A`, `TOPDOWN_B`) |
| Tổng ảnh dự kiến / job / prompt (v1) | **16 / 16 / 16** |
| Prompt v2 (`prompts_v2/`) | 12 (12 sheet hero) |
| Prompt v3 (`prompts_v3/`) | 14 (12 sheet hero + `TOPDOWN_A/B`) |

## 3. Quy tắc bố cục sheet hero (BẢY hình)

> **Áp cho v1 và v2.** v3 đổi bố cục (một hình 3/4 lớn + bốn góc + vũ khí riêng, không H, không ALT): xem §15.

- **Mỗi ảnh = một hàng ngang duy nhất, đúng bảy hình toàn thân:** `H` (bóng người trung tính, phẳng, xám đậm, không mặt, không quần áo) + hero ở góc 3/4 (trước-trái), LEFT, RIGHT, FRONT, BACK **trên thân hiển thị**, rồi **ALT**: cùng bộ đồ, cùng đạo cụ, cùng màu, góc 3/4 trước-trái, **trên thân gốc còn lại**.
- Một đường nền, một thước. Canvas tham chiếu **2172×724**: đường nền `y=640`, **1H = 400 px**, đỉnh đầu mọi hero (không tính mũ, mũ sắt, mũ trùm, khung mạng, đạo cụ) = **1,0H = 400 px** (đỉnh đầu ở `y=240`). Mỗi prompt ghi quy đổi pixel cho các đạo cụ chính (ví dụ khung kiệu PB đỉnh 1,22H = 488 px, `y=152`; đòn khiêng PB-B và gậy PS-A 1,3H = 520 px, `y=120`). **Đạo cụ cao** (PB-A/B, BR-A, PS-A/B, EX-B) phải nằm trong canvas và dưới dải tiêu đề; nếu không vừa thì thu nhỏ **cả bảy hình** đều nhau, không rút ngắn, bẻ cong hay cắt đạo cụ.
- Không đóng khung, không inset, không phóng to hình 3/4, không lưới 2×2, không cảnh nền. Nhãn dưới từng hình đúng thứ tự: `H, 3/4, LEFT, RIGHT, FRONT, BACK, ALT`. Tiêu đề có dạng `PB PALLBEARER — A`.
- LEFT là mặt trái giải phẫu của hero, nhìn sang trái ảnh; RIGHT là mặt phải thật, nhìn sang phải ảnh, **không phải bản lật gương** của LEFT.
- **Vì sao có ALT:** mọi bộ nghề phải mặc được trên cả hai thân gốc mà không đổi silhouette chính (concept doc §2.1). Pilot đã chứng minh bảy hình chạy được.
- **Hai thân gốc (đề xuất):** thân 1 vai rộng, hông hẹp; thân 2 vai hẹp, hông rộng; cả hai cao đúng 1,0H, khoảng 7 đầu, không phóng đại kiểu siêu anh hùng; bàn tay, bàn chân, đạo cụ to hơn thật 10–15%.
- **Quy ước hai bàn tay (§2.2):** dấu bàn tay luôn ở tay trái; class item ở bên trái khi bộ đồ cho phép (ngoại lệ BR-A và PS). Tay phải: nhẫn bạc xỉn nhỏ khi tay trần, **che và không vẽ** khi đeo găng (PB, EX). Nhẫn không bao giờ phát sáng.

## 4. Quy tắc thân hiển thị

Presentation only, **không phải khóa giới tính** (concept doc §2.1, §12 mục 9). Hình ALT luôn là thân còn lại.

| Nghề | Người lạ | Thân hiển thị | ALT |
|---|---|---|---|
| PB | Ser Aldwin Rook | thân 1 | thân 2 |
| EX | Ezra Mott | thân 1 | thân 2 |
| FL | Sister Agathe of the Nails | thân 2 | thân 1 |
| OS | Mother Grist | thân 2 | thân 1 |
| BR | Hasmik of the Brine | thân 2 | thân 1 |
| PS | Velimira of the Last Fire | thân 2 | thân 1 |

## 5. Quy tắc trạng thái thiết kế (concept doc §11.1) — chỉ áp cho v1

> **Chỉ áp cho v1.** v2 và v3 bỏ các quy tắc "không VFX, không glow, đèn và đuốc chưa thắp, hốc hòm trống" ở mục này cho sheet hero: đèn, than và lửa giàn thiêu được **thắp** (vầng sáng nhỏ cục bộ) và hốc hòm OS có điểm linh hồn lạnh đứng yên (§14, §15; concept doc §1.3). Vẫn giữ ở v2 và v3: không trắng vàng, không hào quang, không tia phép, không hạt ngoài tàn lửa và tro bay; các cấm của FL (không vết thương, không máu, không thứ nóng áp vào thân); khung kiệu PB là khung hở hình quan tài dựng đứng, không bao giờ là cái thang. Quy tắc value L\* chưa chạy trên màu v2 (concept doc §1.3).

- **Không VFX, không glow, không hạt, không hiệu ứng phép.** Đèn lồng và đuốc **chưa thắp**: đèn EX mở chụp nửa để thấy cơ cấu năm nan; đầu gậy PS là gỗ chưa đốt có muội.
- Hốc hòm thánh tích của OS **để trống và tối** (không điểm trắng linh hồn).
- Khung kiệu PB ở khoảng **50 Burden**: nửa dưới khung xây vữa xám theo hàng như xây gạch (tới 0,82H), nửa trên rỗng; khung là **viền quan tài dựng đứng, hẹp, nằm trong đường vai** (đầu hẹp ở trên, rộng nhất khoảng một phần tư từ trên xuống, chân hẹp ở dưới), **không bao giờ là cái thang** (nửa trên để hở, không nấc hay thanh ngang) và không bao giờ là quan tài đóng kín. Khung A là thanh sồi nhạt phong hóa; khung B là thanh sồi nhạt phong hóa **bó đai sắt uốn** (sồi vẫn là khối sáng ở cả hai hướng).
- Bình BR chứa nước biển đục kèm muối xám xanh mọc từ miệng bình xuống (vật lý, không phát sáng).
- Nồi hoặc hộp than của FL đóng nắp; sắt nung là sắt nguội; xích cổ tay nguội. Không vết thương, không máu, không lưng trần, không thứ nóng áp vào thân, không hào quang dưới mọi dạng trên trang bị.
- **Osric's Lantern** (concept doc §2.4): đèn xách sắt đơn giản cao 0,12H (48 px), **một** nắp chụp bản lề, **không nan, không khấc**, không thắp, treo xích ngắn **sau hông phải** (PB: từ góc dưới phải của khung kiệu). Vẽ trên mọi sheet hero **trừ EX** (gộp vào đèn class). Không có ở Prologue.
- **Quy tắc value** (concept doc §2.5): mỗi thiết kế giữ một khối sáng (L\* ≥ 65) và một khối tối (L\* ≤ 30); mỗi mục `palette` trong manifest có `lStar`. Ngoại lệ ghi nhận: mũ EX `#A8957A` chỉ L\* 63, khối sáng là khăn lanh (71) và miếng vá kem trên chỏm mũ `#D9CDB4` (83). Swatch mới của PB-B: đai sắt `#4A4B4E` (32) và áo giáp vải len nâu xám sẫm `#4D4540` (30); mũ len BR-B xám biển `#8F9790`, muối cũng phủ cuộn dây thừng vai phải.
- Màu chỉ-là-ánh-sáng (than đỏ `#D0532A`, trắng linh hồn `#EEF3F6`, hổ phách đèn `#E7A04A`, cam than lửa `#E27A36`) và hiệu ứng sương `#BCD0EA` **không dùng** trên sheet; manifest ghi `usedOnSheet: false`.
- Sheet hero dùng ánh sáng studio trung tính và palette riêng của nghề; **không** gắn ảnh mood Act I vào job hero.
- Style: nhắc lại khối style nghiêm ngặt của sheet quái (low detail, hai đến bốn khối lớn mỗi hình, cấm rìa sờn / lỗ nhỏ / vân da / nhiễu hạt), bỏ dòng mood Act I.

## 6. Danh sách 16 job

| Job | Nghề | Tên hướng (en / vi) | Thân hiển thị / ALT | Đường ra (`ashlar/art/heroes/…`) | Phụ thuộc |
|---|---|---|---|---|---|
| `PB_A` | PB Pallbearer | Coffin-lid Knight / Hiệp sĩ nắp quan tài | thân 1 / ALT thân 2 | `PB_pallbearer/vA/concept.png` | — |
| `PB_B` | PB Pallbearer | Bier-Bearer / Người khiêng đòn | thân 1 / ALT thân 2 | `PB_pallbearer/vB/concept.png` | — |
| `FL_A` | FL Flagellant | Wayfaring Penitent / Kẻ sám hối đường trường | thân 2 / ALT thân 1 | `FL_flagellant/vA/concept.png` | — |
| `FL_B` | FL Flagellant | Chain-Bearer / Kẻ mang xích | thân 2 / ALT thân 1 | `FL_flagellant/vB/concept.png` | — |
| `OS_A` | OS Ossuarist | Midwife of the Wall / Bà đỡ của Tường | thân 2 / ALT thân 1 | `OS_ossuarist/vA/concept.png` | — |
| `OS_B` | OS Ossuarist | Keeper of Debts / Người giữ nợ | thân 2 / ALT thân 1 | `OS_ossuarist/vB/concept.png` | — |
| `BR_A` | BR Brinecaller | Dead-Sea Witch / Phù thủy biển chết | thân 2 / ALT thân 1 | `BR_brinecaller/vA/concept.png` | — |
| `BR_B` | BR Brinecaller | Tide-flat Wader / Người lội bãi triều | thân 2 / ALT thân 1 | `BR_brinecaller/vB/concept.png` | — |
| `EX_A` | EX Exhumer | Hook-Lantern Hunter / Thợ săn đèn móc | thân 1 / ALT thân 2 | `EX_exhumer/vA/concept.png` | — |
| `EX_B` | EX Exhumer | Hip-Lantern Gravedigger / Người đào mộ đèn hông | thân 1 / ALT thân 2 | `EX_exhumer/vB/concept.png` | — |
| `PS_A` | PS Pyre-Singer | Pyre Songstress / Ca nữ giàn thiêu | thân 2 / ALT thân 1 | `PS_pyre_singer/vA/concept.png` | — |
| `PS_B` | PS Pyre-Singer | Farewell-Road Singer / Người hát tiễn đường xa | thân 2 / ALT thân 1 | `PS_pyre_singer/vB/concept.png` | — |
| `PROLOGUE_LINEUP` | cả sáu nghề | dáng cuối Prologue (vải liệm + áo Gennet + vũ khí ứng biến) | PB 1, FL 2, OS 2, BR 2, EX 1, PS 2 / không ALT | `_shared/prologue_lineup/concept.png` | — |
| `CHOICE_HANDS` | cả sáu nghề | key art màn chọn nghề (16:9) | không áp dụng | `_shared/choice_hands/keyart.png` | — |
| `TOPDOWN_A` | cả sáu nghề, hướng A | camera game: hàng màu + hàng silhouette đen (3:1) | không áp dụng | `_shared/topdown_A/concept.png` | `PB_A`, `FL_A`, `OS_A`, `BR_A`, `EX_A`, `PS_A` |
| `TOPDOWN_B` | cả sáu nghề, hướng B | camera game: hàng màu + hàng silhouette đen (3:1) | không áp dụng | `_shared/topdown_B/concept.png` | `PB_B`, `FL_B`, `OS_B`, `BR_B`, `EX_B`, `PS_B` |

> Cột "Đường ra" là của v1. v2 ghi `concept_v2.png` và v3 ghi `concept_v3.png` cùng thư mục (§14, §15); `TOPDOWN_A/B` v1 không chạy, v3 có prompt riêng ở `prompts_v3/`.

Prologue lineup: một hàng, `H` + sáu hero ở góc 3/4 trước-trái, thứ tự PB, FL, OS, BR, EX, PS, mỗi hero trên thân hiển thị của mình, cùng dáng cuối Prologue (vải liệm xám + áo len than bùn **dài và rộng** của Gennet + vũ khí ứng biến theo Voc §3.4, bụi vữa, chân trần, không bao giờ khỏa thân). PB có thêm bier-board buộc sau lưng với hai hàng vữa. Đèn EX và đuốc PS tìm thấy tắt, thắp từ đèn Gennet: được có một ngọn lửa phẳng nhỏ, không quầng sáng. Palette Act I về đêm, **không accent**, không Osric's Lantern. Nhãn: `H, PB, FL, OS, BR, EX, PS`; tiêu đề `HEROES — PROLOGUE`.

Key art: 16:9 (PB, OS, BR chìa **mu bàn tay** vì dấu của họ nằm ở mu tay; FL, EX, PS có thể ngửa; dấu tay BR là bụi muối xám trắng ngả xanh nhạt, **Đề xuất** khác Voc §3.2 "cracked white"), sáu bàn tay mở từ tường đầu lâu trong vữa xám, gần tối hẳn, chỉ một ngọn nến của Gennet ở thấp trong khung; sáu tay xếp trên **một cung tròn quanh ngọn nến**; thứ tự trái sang phải theo thứ tự chuẩn **PB, FL, OS, BR, EX, PS**; không chữ.

`TOPDOWN_A/B`: 3:1, hai hàng sáu hình theo cột PB, FL, OS, BR, EX, PS. Hàng trên: sáu hero của chữ cái ấy từ camera game (góc cao 3/4, nhìn xuống 50–60°, gần trực giao), nhỏ, trên nền xám trung bình phẳng, không môi trường. Hàng dưới: sáu hero ấy thành silhouette đen đặc từ cùng camera. Tiêu đề `HEROES — A · GAME CAMERA` / `HEROES — B · GAME CAMERA`; nhãn `PB FL OS BR EX PS` một lần dưới hàng silhouette. Tham chiếu: ảnh style + sáu sheet đã tạo của chữ cái ấy (chỉ danh tính, không thiết kế lại).

## 7. Cách chạy

> Mục này là cách chạy **v1** (lịch sử). Cách chạy v2 ở §14, v3 ở §15; runner `E:/hero-batch/hero_batch.py` nhận job qua `--jobs <JOB…>`.

1. **Pilot đã chạy.** `PB_A` đã được tạo một lần ở `PB_pallbearer/vA/concept_pilot.png` và đã duyệt về bố cục (§9). Vì vậy 11 sheet hero khác **không còn phụ thuộc `PB_A`**.
2. **Đợt chạy thứ nhất: 12 sheet hero (`PB_A` ngay, hoặc song song với 11 sheet còn lại) cùng `PROLOGUE_LINEUP` và `CHOICE_HANDS`**; tất cả chỉ cần pilot và hai ảnh style/layout đã có. Thứ tự sản xuất của concept doc §3 (Voc §9.3) là PB → EX → BR → PS → FL → OS; thứ tự này chỉ để ưu tiên xem.
   - `PB_A` được tạo lại từ prompt đã sửa, **không gắn pilot**, để khung kiệu và nắp mới thay thiết kế pilot; ra file `concept.png` (pilot giữ nguyên tên `concept_pilot.png`).
   - 11 sheet hero khác gắn pilot làm tham chiếu thứ ba, **chỉ bố cục**: "accepted 7-figure layout pilot; copy ONLY the row order, the baseline position and the label placement; do NOT copy its figure size (its figures are about 480 px tall; here 1H = 400 px); never its design, colours, props or the Pallbearer itself".
3. **`TOPDOWN_A/B` là đợt chạy thứ hai, thứ tự do người chạy giữ.** `TOPDOWN_A` chỉ chạy sau khi sáu sheet hướng A (`PB_A`, `FL_A`, `OS_A`, `BR_A`, `EX_A`, `PS_A`) đã qua QA; `TOPDOWN_B` sau sáu sheet hướng B. Manifest ghi `dependsOn` và `availableAfter`, nhưng runner `E:/hero-batch/hero_batch.py` **bỏ qua `dependsOn` và lặng lẽ bỏ qua tham chiếu không tồn tại**. Tham chiếu của TOPDOWN cố định là `concept.png`; nếu một sheet phải chạy lại thành `concept_v2.png` và đã được duyệt, truyền cho runner `--ref-map <đường dẫn concept.png cũ>=<đường dẫn concept_v2.png mới>`.
4. **Nếu bảy hình không ổn ở một sheet nào:** rút về sáu hình (bỏ ALT) và chuyển ALT sang đợt 2 (concept doc §11.1). Pilot cho thấy bảy hình chạy được, nên đây chỉ là phương án dự phòng.
5. **Không ghi đè** ảnh đã có. Chạy lại thì đặt hậu tố mới (ví dụ `concept_v2.png`).
6. Mỗi ảnh xong thì báo đường dẫn riêng để xem ngay.
7. **QA đỉnh đạo cụ:** ở mỗi sheet có đạo cụ cao (PB khung 1,22H và đòn 1,3H, BR-A 1,25H, PS-A 1,3H, PS-B 1,2H, EX-B xẻng 1,15H), đo đỉnh đạo cụ so với đỉnh đầu H: đỉnh phải nằm trong canvas, dưới tiêu đề, và đạo cụ không bị rút ngắn, bẻ cong hay cắt. Nếu sheet thu nhỏ thì cả bảy hình phải thu nhỏ đều nhau.
8. Brief này không gọi API hay CLI nào.

## 8. Tham chiếu hình ảnh (đường dẫn tuyệt đối)

| Ảnh | Vai trò | Dùng cho |
|---|---|---|
| `E:/Diablo2/ashlar/art/textures/terrain-dark-wood/_review_stylized2.jpg` | style **chỉ** nét cọ và khối vật liệu (không lấy địa hình, panel, magenta) | cả 16 job |
| `E:/Diablo2/ashlar/art/act-01/monsters/U01_shambler/vA/concept_v3.png` | layout và cách vẽ **chỉ** (H người + hình trên một đường nền, khối phẳng ít chi tiết); không sao chép giải phẫu, quần áo, màu hay thiết kế; sheet hero có **bảy** hình, không phải sáu | 12 sheet hero + `PROLOGUE_LINEUP` |
| `E:/Diablo2/ashlar/art/heroes/PB_pallbearer/vA/concept_pilot.png` | pilot bố cục đã duyệt: **chỉ** thứ tự hàng, vị trí đường nền, vị trí nhãn; **không** lấy cỡ hình (hình pilot cao khoảng 480 px, ở đây 1H = 400 px); không lấy thiết kế, màu, đạo cụ, càng không lấy Pallbearer | 11 sheet hero (**trừ `PB_A`**) |
| sáu `concept.png` của chữ cái tương ứng (`<NGHỀ>/v<A\|B>/concept.png`) | **chỉ danh tính** của từng hero; không thiết kế lại, không trộn, không lấy layout | `TOPDOWN_A`, `TOPDOWN_B` |

`CHOICE_HANDS` chỉ dùng ảnh style. Ảnh mood Act I **không** dùng trong brief này.

## 9. Pilot `PB_A` (đã chạy)

- **File:** `E:/Diablo2/ashlar/art/heroes/PB_pallbearer/vA/concept_pilot.png`, 2172×724 (kèm `.prompt.txt`, `.result.txt`, `.task.txt`, `.generation.log`). Không được sửa hay ghi đè.
- **Trạng thái:** được main agent QA và duyệt **về bố cục** ngày 20/10/2026 (người dùng yêu cầu tạo toàn bộ concept sau vòng review); **chưa duyệt về thiết kế**.
- **Ghi chú QA:** bảy hình và nhãn đúng; đỉnh đầu hero bằng đỉnh đầu H; model dùng khoảng 480 px mỗi H thay vì 400 (tỷ lệ tương đối mới là điều quan trọng); khung kiệu cao khoảng 1,08H (mô hình co khung 1,2H lại để tránh tiêu đề; tiêu đề ở `y` 23–56, đỉnh H ở `y` 143, đường nền khoảng `y` 628) và đọc như cái thang. Vì cỡ ấy, đạo cụ 1,3H sẽ chạm mép trên nếu sao chép cỡ pilot. Bản sửa: khung 0,80H dạng quan tài hẹp từ 0,42H tới 1,22H, nắp 0,72H × 0,28H.
- **Ghi vào manifest:** trường `pilot` của job `PB_A` (đường dẫn, kích thước, ghi chú QA).

## 10. Đợt 2 (concept doc §11.2, chưa có prompt)

| Job (dự kiến) | Nội dung |
|---|---|
| `<nghề>_STATES` × 6 | Ba trạng thái tài nguyên trên thân (§2.8) và **ba** pose đặc trưng; PB có *Shoulder the Fallen* vác trước ngực và *Bier of Many*; trạng thái chung (§2.11) |
| `<nghề>_GEAR` × 6 | Ba bậc vũ khí và class item (§2.6) |
| `HERO_GLOW` | **Brinecaller** (lộ da) qua năm bậc Glow, thêm bản thể hoàn hảo; không dùng Pallbearer |
| `HERO_LINEUP` | Sáu thiết kế đã chọn cạnh nhau, một hàng silhouette đen, một hàng cỡ nhỏ như ở camera chơi |
| Lab | **Cả sáu hero** ở camera chơi trên năm nền act + nền Course + một cảnh Seamless đơn giản, thêm clip ngắn xem ánh sáng chập chờn (AD §7, §13) |

## 11. Rủi ro đã biết

- **Bảy hình trên canvas 3:1 vẫn chật.** Mỗi hình chỉ có khoảng 300 px chiều ngang ở 2172 px. Các điểm rộng nhất: nắp PB-A (0,28H), đòn khiêng PB-B cùng nắp cất bên sườn khung (nắp nhô ra sau lưng vì rộng 0,28H còn khung dày 0,10H), xẻng EX-B dựng thẳng (đã chọn để khỏi tràn ngang), áo choàng tròn PS-B, mũ EX. Không tự giảm thước của từng hình.
- **Khung kiệu có thể lại đọc thành cái thang** (pilot đã vẽ vậy). Kiểm `PB_A` đầu tiên: đầu hẹp ở trên, rộng nhất khoảng một phần tư từ trên xuống, chân hẹp ở dưới.
- **Thước lệch của pilot:** pilot dùng khoảng 480 px mỗi H thay vì 400. Prompt chỉ cho sao chép thứ tự hàng, vị trí đường nền và vị trí nhãn, **không** sao chép cỡ hình. Đạo cụ cao 1,2H–1,3H phải nằm dưới tiêu đề; nếu không vừa thì thu nhỏ cả bảy hình đều nhau, không rút ngắn đạo cụ. Khi QA, đo đỉnh từng đạo cụ cao so với đỉnh đầu H.
- **Đạo cụ cao gần tiêu đề:** đòn khiêng PB-B và gậy PS-A 1,3H đỉnh ở `y=120` (cách vùng tiêu đề khoảng 20 px); gậy BR-A 1,25H ở `y=140`; khung kiệu PB 1,22H ở `y=152`; gậy PS-B 1,2H ở `y=160`. Prompt yêu cầu tiêu đề nằm sát mép trên (trên `y=100`).
- **Value:** mũ EX `#A8957A` chỉ L\* 63 (dưới ngưỡng 65 của quy tắc khối sáng), nên độ đọc của EX từ trên dựa vào khăn lanh `#B8AE98` (EX-A có khăn cổ trên sheet) và miếng vá kem `#D9CDB4` trên chỏm mũ; áo FL cùng value với than bùn Act I. Sau khi có ảnh nên kiểm lại ở grayscale (concept doc §2.5) và trên nền Course.
- **Màu gần nhau, dễ lẫn:** PB giáp thiếc `#6E7276` với sắt đen FL `#45464A` và EX `#4A4B4E`; xám biển BR `#8F9790`, tạp dề OS `#A79F8E` và mạng PS `#B4AEA5`; muối BR `#B4BCA9` không được thành trắng; hai cặp phải giữ tách là OS-A với BR-B và FL-B với EX-B.
- **Vật rất nhỏ:** Osric's Lantern 0,12H = 48 px; hũ muối gốm BR-B 0,07H = 28 px; túi tro PS-B 0,08H = 32 px; chuông PB 0,08H = 32 px; đinh bạc PB, vỏ sò BR. Ở sheet chỉ đọc được như chấm hoặc mảng; nhẫn tay phải đã bỏ khỏi sheet khi tay đeo găng, còn lại không đọc rõ ở thước này.
- **Thiết kế tay trái / phải gây nhầm:** model có thể lật gương RIGHT từ LEFT; prompt đã nhắc RIGHT không phải bản lật. Các bố trí bất đối xứng quan trọng: muối BR luôn ở bên phải, nồi/hộp than FL luôn ở bên trái, đèn EX luôn ở bên trái.
- **Theo dõi ở đợt 2:** Osric's Lantern của PB treo từ chân khung, gần đùi, có thể va vào chân khi bước (cân nhắc xích ngắn hơn hoặc móc cao hơn); nắp đứng mép của PB-B có thể biến mất trong TOPDOWN_B.
- **TOPDOWN có mười hai hình nhỏ trên một ảnh 3:1:** nếu công cụ không giữ rõ, tách thành hai ảnh (hàng màu, hàng silhouette) mà không đổi camera và thước.
- Công cụ tích hợp có thể không giữ chính xác 3:1 hay 4K; prompt cho phép hạ độ phân giải nhưng vẫn yêu cầu một hàng.

## 12. Điểm mở và quyết định của brief

Điểm mở của nguồn được giữ nguyên (concept doc §12). Brief không tự giải quyết chúng, trừ các quyết định đã được art direction chốt cho vòng 2 (bier-board của PB trong Prologue, Osric's Lantern, tên hướng mới, yêu cầu F03 và NPC Frostwife); người dùng vẫn có thể đổi.

Những chỗ doc chưa nói rõ và brief chọn phương án trung tính nhất (đầy đủ hơn trong `openNotes` của từng job):

| Chỗ | Lựa chọn |
|---|---|
| Tên hướng tiếng Anh | Doc chỉ có tên tiếng Việt; tên tiếng Anh trong manifest là bản dịch của brief. Ba tên đổi theo thiết kế mới: EX-A "Hook-Lantern Hunter" (không còn sào), OS-B "Keeper of Debts", BR-B "Tide-flat Wader" |
| PB `#5A4332` "Da thuộc, dây đai" | Hiểu là **da thuộc và dây đai**, không phải màu da người |
| PB tay phải | Găng da trơn (để PB theo quy tắc nhẫn bị che dưới găng); nhẫn không vẽ |
| PB-B: nắp cất, đòn, dây thừng, chuông | Nắp cất **dựng mép trên ba móc dọc sườn trái khung** (độ cao móc để họa sĩ quyết); đòn dựng cạnh chân **phải**, **một mình tay phải** cầm, tay trái buông thõng, đòn bị thân che một phần ở LEFT (bỏ vòng, chỗ cầm, đường tán đinh); dây thừng đeo chéo ngực từ vai trái xuống sườn phải (doc §4.6); chuông ở hông phải; khung sồi nhạt phong hóa bó đai sắt `#4A4B4E`, áo giáp vải `#4D4540` |
| PB-B: vết vá đọc được | Doc §4.6 ghi: một miếng vá lớn trên áo trùm-vai (mối nối đọc được duy nhất của B) |
| FL-A | Đầu sắt nung hình nút thắt một vòng; nồi than ở hông **trái**; đầu dây mười nút buông ở phía trước bên phải |
| FL-B | Áo ghi-lê không tay mặc ngoài áo lanh dài tay (để không hở tay); hộp than ở bên trái thắt lưng, cán sắt nhô lên qua khe trên nắp đóng; không mũ trùm |
| OS-A | Liềm móc sau thắt lưng ở lưng trái, bó que đếm ở hông trái (nhường chỗ sau hông phải cho Osric's Lantern) |
| OS-B hòm thánh tích | Trống xương bọc đai bạc, tám hốc tròn quanh thân, nắp vòm có vòng: thân cao 0,18H × đường kính 0,15H, cả nắp 0,22H, xích 0,10H (kích thước là lựa chọn của brief) |
| BR-A | Muối đóng ở vai **phải** và tay áo phải; gậy cầm tay **phải**; ba bình trên đai chéo ngực là ngoại lệ của quy ước tay trái; khăn là nút ngắn không đuôi |
| BR-B | Muối ở **chân phải** và cuộn dây thừng vai phải, mũ len xám biển, bình lớn cầm tay trái, đũa tay phải, hũ muối gốm 0,07H ở bên trái thắt lưng (kích thước là lựa chọn của brief); không lọ thủy tinh |
| EX-A | Xẻng nghiêng khoảng 20° sau lưng; khăn cổ lanh; miếng vá kem trên chỏm; nỏ cầm tay **phải**; đèn ở ngực (khoảng 0,70H, số suy ra) trên cánh tay móc 0,2H; hộp tên bạc chuyển xuống thắt lưng để ngực trống cho đèn |
| EX-B | Xẻng dựng thẳng cạnh chân phải, một mình tay phải cầm, bị thân che một phần ở LEFT; nỏ đeo chéo lưng; túi bẫy ở hông phải |
| PS | Áo len A và áo ngắn B nhuộm muội (khối tối, doc §9.4); dải gấu kem; PS-A không vẽ đường chỉ đỏ ở mép mạng; PS-B túi tro 0,08H (kích thước là lựa chọn của brief); áo choàng B cài khuy ở cổ họng, hở từ ngực xuống |
| Giày dép | PB ủng nặng; FL cẳng chân quấn và ủng thấp; OS ủng mềm; BR-A chân quấn, BR-B quấn lội nước; EX ủng cao tẩm dầu; PS ủng bọc lông; chỉ Prologue chân trần |
| Prologue | Kích thước vũ khí ứng biến là lựa chọn của brief (trừ đèn 0,16H); nắp quan tài PB 0,72H (cao và hẹp, không bao giờ là quan tài trẻ con); bier-board 0,5H × 0,14H với hai hàng vữa; hũ muối BR bằng đất nung; không hex nào cho palette Prologue |
| Key art | PB, OS, BR chìa mu bàn tay, FL, EX, PS có thể ngửa; tay BR là bụi muối xám trắng ngả xanh nhạt (Đề xuất, xem concept doc §12 mục 19); hex của tay lấy từ palette từng nghề; tường dùng `#7E796F` (vữa xám của bảng PB); nến của Gennet đặt thấp, giữa tay thứ ba và thứ tư |
| TOPDOWN | Nhãn `PB FL OS BR EX PS` đặt một lần dưới hàng silhouette; không có hình H; nếu 12 hình quá nhỏ thì tách hai ảnh |

## 13. Kiểm tra đã chạy

Validator tạm (đặt ngoài repo, chạy bằng `python -I`, đã xóa) kiểm lại toàn bộ các mục của vòng 2 (16 job; id, `outputPath`, `promptPath` duy nhất và file prompt tồn tại; thư mục brief chỉ có ba mục; 14 mục house theo thứ tự, tiêu đề, bảy nhãn, một khối H, thân hiển thị/ALT; `dependsOn` và nối tham chiếu; ảnh tham chiếu có trên đĩa; hex trong prompt có trong doc, hàng bảng doc khớp cột L\*, `lStar` khớp CIE; kích thước H đổi đúng 400 px/H; Osric's Lantern; không hào quang; FL, PB, BR, PS, EX, OS, Prologue, key art) và thêm các mục của vòng 3: vai trò pilot mới ở mọi nơi nhắc pilot và không còn "thước" chép từ pilot; câu "thu nhỏ cả bảy hình đều nhau, không rút ngắn, bẻ cong hay cắt đạo cụ" ở PB_A, PB_B, BR_A, PS_A, PS_B, EX_B; PB-B có sồi + đai sắt + áo giáp vải, không mâu thuẫn; không còn tên cũ của sồi; nắp Prologue 0,72H, "không bao giờ là quan tài trẻ con"; khăn cổ EX-A; miếng vá kem `#D9CDB4`; BR-B "no GLASS jars" mà vẫn giữ hũ gốm; hũ muối Prologue bằng đất nung; quy tắc mu bàn tay ở key art; không prompt nào gọi Severin là Lamplighter; xẻng EX-A nghiêng khoảng 20°; câu chữ Smoke-Shape ở doc §9.9, §9.10.

Kết quả thực tế của lần chạy cuối:

```
ok   jobs=16, unique ids/outputPaths/promptPaths, 16 non-empty prompt files
ok   brief dir has exactly 3 entries; prompts/ has 16 files
ok   12 hero jobs = 6 vocations x A/B + PROLOGUE_LINEUP, CHOICE_HANDS, TOPDOWN_A, TOPDOWN_B
ok   12 hero prompts: 14 house lines in order, exact title, seven labels in order, one H block, display/alt bodies per rule
ok   PB_A has style + U01 only and records the pilot; the 11 others carry the pilot with the NEW role text (prompt line 2 and manifest); reference images exist on disk; no mood reference
ok   no "the ruler" copied from the pilot anywhere (prompts line 2, manifest, README, doc)
ok   new pilot role text present in doc §11.1, README (§7, §8, §11), manifest pilotRule and 11 job roles
ok   prop clause ("shrink ALL seven figures equally; never shorten, bend or crop the prop") in the SCALE line of PB_A, PB_B, BR_A, PS_A, PS_B, EX_B only
ok   README QA step measures each tall prop top against the H crown
ok   none of the retired phrases appear in the doc, README (outside §13), manifest or any prompt (old oak name, pilot ruler, Severin naming, 0.5H lid, hook heights, stale notes, old cross-refs)
ok   stale "the doc gives no side/shoulder/garment" notes removed (remaining: ['Coal pot on the LEFT hip so the iron in the left hand does n', 'Stoneware salt-crock 0.07H at the left of the belt is a brie'])
ok   prompt hexes all in doc; palette hexes in doc with matching L* column row; manifest lStar matches computed CIE L*
ok   each hero COLOUR line lists exactly the manifest palette swatches used on the sheet and none of the light-only ones
ok   6 doc palette tables have the L* column
ok   every size in H has the right px at 400 px/H in manifest and prompt, appears in the prompt and in the doc
ok   PROLOGUE_LINEUP has no Osric lantern (only the "not yet obtained" remark)
ok   every hero prompt except EX_A/EX_B draws Osric's Lantern (0.12H, one hinged hood flap, no slats/notches); EX prompts merge it into the class lantern
ok   no prompt asks for a halo, nimbus, disc or aureole (only negations / Iron Halo references)
ok   PB prompts: lid 0.72H x 0.28H, frame 0.80H (0.42H-1.22H) x 0.24H/0.16H, upright coffin outline, no rungs/crossbars, pale weathered oak; PB_B: pole in the RIGHT hand alone, left arm hangs, partly hidden in LEFT, lid on three hooks on the left flank, no grips/rings/hook heights/riveted seam
ok   PB_B colour/value lines name oak rails + iron bands + brigandine swatch with no contradiction (prompt, manifest, doc §2.5, §4.4, §4.6)
info PB_B design line 2933 chars (was 3243), PB_A 2723; PB_B file 14483 bytes, PB_A 13959 bytes
ok   PB_B design line shrank toward PB_A (difference 210 chars)
ok   Prologue: PB lid 0.72H (288 px) tall and narrow, "never a child's coffin" in CONTENT, BR grave-salt jar earthenware (prompt, manifest sizeSpec, doc §2.9)
ok   EX_A: linen neck scarf in the design line and swatch, spade about 20 degrees; EX_A/EX_B: cream hat-crown patch #D9CDB4 (L* 83) with big dark stitches; Severin = Widower's Lantern / Lamp-Bearer; B15 Lamplighter kept; EX_B: right hand alone, partly hidden in LEFT; no prompt names Severin as the Lamplighter
ok   doc §8: cream patch row (D9CDB4, L* 83), scarf + 20 degree spade in 8.6, right hand alone in 8.7, Severin names with Bible §15.1 and Cast §7.8 in 8.11
ok   BR_B: "no GLASS jars" with the stoneware crock kept, salt crust also on the right-shoulder rope coil, close knitted cap in sea-grey #8F9790
ok   PS_B: fur cloak toggled at the throat only, open from the chest down so the soot tunic shows (prompt + doc §9.6); no animal tokens
ok   CHOICE_HANDS: back-of-hand rule for PB/OS/BR (FL/EX/PS may be palm up), arc around Gennet's candle, order PB FL OS BR EX PS; BR marker labelled Đề xuất with the Voc §3.2 reason (doc §2.2, §12 item 19, manifest)
ok   FL prompts: irons stand up through slots in the closed lid, coal pot/box on the LEFT, nothing on the back; TOPDOWN_A: EX_B/PB_B props dropped from line 4, "chain-mace hanging from the right hand"
ok   dependsOn: 12 hero sheets + 2 shared are [], TOPDOWN_A/B = exactly their six sheets; TOPDOWN refs = style + six sheets
ok   r2 identity checks: BR_A right-side salt/staff/no tail; BR_B no apron; EX_A no pole; OS_B drum with eight niches; PS_A circlet; PS_B ash pouch; Prologue bier-board and long loose coat
ok   doc: three source labels, §9.9/§9.10 Smoke-Shape wording (animals made of smoke; avoid totems worn on the hero and hero animal transformation), §2.5/§2.4/§2.3/§2.6 nits, §11.1 run order, §11.2 watch items, §12 item 19, §13 sources, 14 sections, line endings kept
ok   README: run order (12 sheets + Prologue + Choice first; TOPDOWN second batch with --ref-map), QA step, watch items, stale notes replaced
files: prompts=16 hexes known in concept doc: 53
checks passed: 32
ERRORS: 0
```

> Kết quả trên là của vòng 3 (v1), lúc thư mục brief chỉ có `MANIFEST.json`, `README_VI.md` và `prompts/`. Sau đó thêm `prompts_v2/` và `prompts_v3/`, và `status` cùng trường `v2`, `v3` của manifest được cập nhật, nên validator ấy không còn chạy nguyên trạng.

## 14. v2 — hero push (20/10/2026)

> **v2 nay bị v3 thay thế về trình bày (§15);** v2 vẫn là **nguồn palette và đạo cụ cường điệu** của v3 (concept doc §1.3, `build_v2.py`).

**Vì sao:** sau khi xem các sheet v1, người dùng nói: *"vì đây là các hero, tôi cần nó ngầu hơn, nhiều màu sắc hơn chút, bụi bặm thế này không được nổi bật, cường điệu các chi tiết là đặc điểm riêng của class"*. Đây là quyết định art direction mới nhất cho trình bày hero và **thắng** palette v1 trầm cùng quy tắc "low detail / không glow" **cho sheet hero** (xem concept doc §1.3). Palette v1, kích thước v1 và prompt v1 (`prompts/`) được giữ nguyên làm nền value và lịch sử; **ảnh v1 của hero bị v2 thay thế**.

**Gì thay đổi so với v1:**

| Mặt | v1 | v2 |
|---|---|---|
| Màu | Trầm, khóa theo L\* và nền Act I | Mỗi nghề một màu đặc trưng bão hòa rải quanh vòng màu: PB tím tang lễ + bạc; FL đỏ thẫm + than cam; OS chàm đêm + xương + linh hồn lạnh; BR xanh biển ngọc + bọt sóng; EX xanh chai + đèn hổ phách + đồng thau; PS tro trắng + lửa cam + sương băng + chỉ đỏ |
| Bề mặt | Painterly ít chi tiết, vải sờn, bụi vữa | Sạch, nét gọn, không bụi, không bẩn, không giẻ rách, tối đa một miếng vá gọn |
| Ánh sáng | Không glow, đèn và đuốc tắt, hốc OS trống | Viền sáng lạnh; đèn, than, lửa giàn thiêu **thắp** (vầng nhỏ cục bộ); OS có điểm linh hồn trắng xanh lạnh đứng yên; không trắng vàng, không hào quang |
| Đạo cụ | Kích thước đề xuất của §4.7–§9.7 | Cường điệu theo hướng (concept doc §1.3, bảng đạo cụ; kích thước H lấy từ `PUSH` của `build_v2.py`) |
| Layout | Bảy hình, một thước, nhãn | **Giữ nguyên** |

**Nơi để file:**

- Prompt v2: `E:/Diablo2/ashlar/art/heroes/_brief/prompts_v2/<JOB>.txt` (12 file: `PB_A`…`PS_B`). Mỗi prompt là prompt v1 thêm các khối `SIGNATURE PUSH`, `PALETTE V2` và `STYLE (version 2, hero push)`; sinh bằng script phiên làm việc `E:/hero-batch/build_v2.py` (không nằm trong repo; dict `PALETTE`, `PUSH`, chuỗi `STYLE`).
- Ảnh v2: `E:/Diablo2/ashlar/art/heroes/<NGHỀ>/vA|vB/concept_v2.png`, cạnh `concept.png` của v1 (không ghi đè).
- Nhật ký chạy: `E:/hero-batch/run_v2_<JOB>.out` (mỗi dòng JSON; `"status":"ok"` là ảnh đã có) và `E:/Diablo2/ashlar/art/heroes/_runs/batch_2026-10-20.jsonl`.
- Manifest: trường `v2` ở cấp trên cùng và trường `v2` của từng job hero trong `MANIFEST.json`.

**Cách chạy:** runner `E:/hero-batch/hero_batch.py`, mỗi job một phiên `codex exec` mới (`gpt-6-astra`, `image_gen` có sẵn), chạy song song:

```
python E:/hero-batch/hero_batch.py --jobs <JOB> --suffix _v2 --prompt E:/Diablo2/ashlar/art/heroes/_brief/prompts_v2/<JOB>.txt --refs <sheet v1 cùng job | none>
```

- `--suffix _v2` ghi `concept_v2.png`, không ghi đè; `--prompt` thay prompt của manifest (một job mỗi lần chạy); `--refs` **thay** toàn bộ danh sách tham chiếu của manifest (nên ảnh style và ảnh pilot không còn gắn).
- **Tham chiếu = sheet v1 của chính job đó khi có** (`PB_A`, `PB_B`, `FL_B`, `OS_B`, `BR_B`, `EX_A`, `EX_B`, `PS_A`, `PS_B`): làm nền danh tính (giữ cấu trúc, đạo cụ, bố cục, bảy hình, nhãn; **không** chép màu trầm và độ bẩn). **Không tham chiếu** (`--refs none`) cho `FL_A`, `OS_A`, `BR_A`, vì v1 của ba job này đã dừng khi hướng đổi và không có sheet; prompt v2 của chúng ghi "REFERENCE IMAGES: none attached".
- Theo ý người dùng, bước review thêm trước khi tạo ảnh được bỏ qua.

**Việc còn lại:** khóa palette v2 sau khi thử trong scene (năm nền act, nền Course, Seamless) và chạy lại quy tắc value (L\* ≥ 65 một khối sáng, ≤ 30 một khối tối; BR hiện chưa có swatch ≤ 30); quyết định Prologue lineup và key art theo v2 hay giữ v1; QA v2 (đỉnh đạo cụ cao, bảy hình, nhãn). Lưu ý §5 ở trên ("không glow, đèn chưa thắp") chỉ còn đúng cho v1.

### 14.1 Kết quả sau v2: ảnh đã có trên đĩa (20/10/2026)

| Job | Loại | Đường dẫn (`art/heroes/…`) | Trạng thái |
|---|---|---|---|
| `PB_A` | v1 | `PB_pallbearer/vA/concept.png` | generated; **superseded by v2** |
| `PB_A` | v2 | `PB_pallbearer/vA/concept_v2.png` | generated (ref: v1); trình bày bị v3 thay thế |
| `PB_A` | pilot | `PB_pallbearer/vA/concept_pilot.png` | generated; accepted for LAYOUT only |
| `PB_B` | v1 | `PB_pallbearer/vB/concept.png` | generated; **superseded by v2** |
| `PB_B` | v2 | `PB_pallbearer/vB/concept_v2.png` | generated (ref: v1); trình bày bị v3 thay thế |
| `FL_A` | v1 | `FL_flagellant/vA/concept.png` | **not generated** (stopped when direction changed) |
| `FL_A` | v2 | `FL_flagellant/vA/concept_v2.png` | generated (no ref); trình bày bị v3 thay thế |
| `FL_B` | v1 | `FL_flagellant/vB/concept.png` | generated; **superseded by v2** |
| `FL_B` | v2 | `FL_flagellant/vB/concept_v2.png` | generated (ref: v1); trình bày bị v3 thay thế |
| `OS_A` | v1 | `OS_ossuarist/vA/concept.png` | **not generated** (stopped when direction changed) |
| `OS_A` | v2 | `OS_ossuarist/vA/concept_v2.png` | generated (no ref); trình bày bị v3 thay thế |
| `OS_B` | v1 | `OS_ossuarist/vB/concept.png` | generated; **superseded by v2** |
| `OS_B` | v2 | `OS_ossuarist/vB/concept_v2.png` | generated (ref: v1); trình bày bị v3 thay thế |
| `BR_A` | v1 | `BR_brinecaller/vA/concept.png` | **not generated** (stopped when direction changed) |
| `BR_A` | v2 | `BR_brinecaller/vA/concept_v2.png` | generated (no ref); trình bày bị v3 thay thế |
| `BR_B` | v1 | `BR_brinecaller/vB/concept.png` | generated; **superseded by v2** |
| `BR_B` | v2 | `BR_brinecaller/vB/concept_v2.png` | generated (ref: v1); trình bày bị v3 thay thế |
| `EX_A` | v1 | `EX_exhumer/vA/concept.png` | generated; **superseded by v2** |
| `EX_A` | v2 | `EX_exhumer/vA/concept_v2.png` | generated (ref: v1); trình bày bị v3 thay thế |
| `EX_B` | v1 | `EX_exhumer/vB/concept.png` | generated; **superseded by v2** |
| `EX_B` | v2 | `EX_exhumer/vB/concept_v2.png` | generated (ref: v1); trình bày bị v3 thay thế |
| `PS_A` | v1 | `PS_pyre_singer/vA/concept.png` | generated; **superseded by v2** |
| `PS_A` | v2 | `PS_pyre_singer/vA/concept_v2.png` | generated (ref: v1); trình bày bị v3 thay thế |
| `PS_B` | v1 | `PS_pyre_singer/vB/concept.png` | generated; **superseded by v2** |
| `PS_B` | v2 | `PS_pyre_singer/vB/concept_v2.png` | generated (ref: v1); trình bày bị v3 thay thế |
| `PROLOGUE_LINEUP` | shared | `_shared/prologue_lineup/concept.png` | generated (v1 palette; no v2 run) |
| `CHOICE_HANDS` | shared | `_shared/choice_hands/keyart.png` | generated (v1 palette; no v2 run) |
| `TOPDOWN_A` | shared | `_shared/topdown_A/concept.png` | **not generated** (v1 không chạy; chạy ở v3, xem §15.1) |
| `TOPDOWN_B` | shared | `_shared/topdown_B/concept.png` | **not generated** (v1 không chạy; chạy ở v3, xem §15.1) |

Sau đợt v2 có **24 ảnh** trên đĩa: 9 sheet v1 (FL_A, OS_A, BR_A v1 không có), 12 sheet v2, 1 pilot, 2 job dùng chung; sau đợt v3 là **36 ảnh** (thêm 12 sheet v3, §15.1). Mỗi sheet có thêm `.prompt.txt`, `.result.txt`, `.task.txt` và `.generation.log` cạnh ảnh.

## 15. v3 — 3/4 + 4 góc + vũ khí tách riêng (20/10/2026)

**Vì sao:** sau khi xem các sheet v2, người dùng nói: *"gen thành 1 góc 3/4. 4 góc các hướng, vũ khí tách riêng, cách điệu hơn nữa để tạo ấn tượng, giảm detail quần áo đi"* (một hình 3/4, bốn góc theo hướng nhìn, vũ khí vẽ riêng, cách điệu hơn nữa, giảm chi tiết quần áo). Đây là quyết định mới nhất cho trình bày hero (concept doc §1.4): **v3 là cách trình bày hiện hành**; v2 còn là nguồn palette và đạo cụ cường điệu (§14); v1 là lịch sử.

**Bố cục:** một sheet 16:9 (xin 2048×1152 hoặc lớn hơn; công cụ ảnh trả 1672×941, riêng EX_B và FL_A 1672×940).

- **Phần trái (khoảng một phần ba):** **một** hình toàn thân góc 3/4 trước-trái, cỡ lớn (cao khoảng 80% khung), dáng đứng oai nhưng không phải pose hành động, **cầm vũ khí**; nhãn `3/4`.
- **Phần phải, hàng trên:** bốn hình trực giao toàn thân `FRONT`, `LEFT`, `RIGHT`, `BACK` trên **một** đường nền, **một** cỡ chung nhỏ hơn (khoảng 55% chiều cao khung); LEFT là mặt trái giải phẫu nhìn sang trái ảnh, RIGHT là mặt phải thật nhìn sang phải ảnh (không phải bản lật gương). Dáng A-pose thả lỏng, hai tay mở và **trống**; **đồ mặc và đeo vẫn ở trên thân** như hình 3/4.
- **Phần phải, dải đáy:** vũ khí và class item cầm tay vẽ **riêng**, cạnh nhau, **cùng cỡ** với bốn hình, vật dài nằm ngang, mỗi vật một nhãn ngắn.
- Tiêu đề `<MÃ> <TÊN NGHỀ VIẾT HOA> — <A|B>` (ví dụ `PS PYRE-SINGER — B`); không khung, không inset, không hình thừa, không cảnh nền. **Không còn hình H, không còn hình ALT, không còn dòng `BODIES`** (Thân 1 hay Thân 2 không bị ép). Mọi quy tắc bảy hình của §3 (canvas 2172×724, 1H = 400 px) **không áp** cho v3.

**Phong cách:** **cách điệu hơn** để gây ấn tượng (tinh thần class art của Diablo Immortal): hình khối to, dày, đọc ngay; bàn tay, bàn chân, vai và đạo cụ đặc trưng hơi quá cỡ; **quần áo đơn giản hóa thành vài mảng màu lớn** (không hàng đinh tán, không thêu, không đường may, không khóa nhỏ, không miếng vá, không rìa sờn); chi tiết tỉ mỉ chỉ dành cho đạo cụ và vũ khí. Giữ từ v2: palette và đạo cụ cường điệu, ánh sáng nghề **thắp**, viền sáng lạnh, không bụi, không bẩn, không trắng vàng, không hào quang. Ngoại lệ: miếng vá kem trên chỏm mũ EX là dấu nhận diện và vẫn có ở EX_A, EX_B.

**Nơi để file:**

- Prompt v3: `E:/Diablo2/ashlar/art/heroes/_brief/prompts_v3/<JOB>.txt` (12 file hero) cùng `TOPDOWN_A.txt` và `TOPDOWN_B.txt`. Sinh bằng script phiên làm việc `E:/hero-batch/build_v3.py` (dict `IDENTITY`, `KIT` = đồ mặc và vũ khí vẽ riêng của từng job, chuỗi `STYLE`; `PALETTE` và `PUSH` lấy từ `build_v2.py`) và `E:/hero-batch/build_topdown_v3.py`; không nằm trong repo.
- Ảnh v3: `E:/Diablo2/ashlar/art/heroes/<NGHỀ>/vA|vB/concept_v3.png` cạnh `concept.png` và `concept_v2.png`, không ghi đè; TOPDOWN: `_shared/topdown_A/concept_v3.png` và `_shared/topdown_B/concept_v3.png`. Mỗi sheet có thêm `.prompt.txt`, `.result.txt`, `.task.txt` và `.generation.log` cạnh ảnh.
- Nhật ký chạy: `E:/hero-batch/run_v3_<JOB>.out` (mỗi dòng JSON; `"status":"ok"` là ảnh đã có) và `E:/Diablo2/ashlar/art/heroes/_runs/batch_2026-10-20.jsonl`.
- Manifest: trường `v3` ở cấp trên cùng (quyết định, bố cục, phong cách, ghi chú QA, điểm mở) và trường `v3` của từng job hero (`promptPath`, `outputPath`, `references`, `status`, thêm `size`, `kit`, `qaNotes`) và của `TOPDOWN_A/B`. Bảng đồ mặc và vũ khí riêng từng job: concept doc §1.4.

**Cách chạy:** runner `E:/hero-batch/hero_batch.py`, mỗi job một phiên `codex exec` mới (`gpt-6-astra`, `image_gen` có sẵn):

```
python E:/hero-batch/hero_batch.py --jobs <JOB> --suffix _v3 --prompt E:/Diablo2/ashlar/art/heroes/_brief/prompts_v3/<JOB>.txt --refs E:/Diablo2/ashlar/art/heroes/<NGHỀ>/v<A|B>/concept_v2.png
```

- `--suffix _v3` ghi `concept_v3.png`, không ghi đè; `--prompt` thay prompt của manifest (một job mỗi lần chạy); `--refs` **thay** toàn bộ danh sách tham chiếu của manifest.
- **Tham chiếu của sheet hero = `concept_v2.png` của chính job đó** (cả 12 đều có, kể cả `FL_A`, `OS_A`, `BR_A`): giữ danh tính, silhouette, đạo cụ, palette; **không** chép bố cục bảy hình nhỏ và **không** chép chi tiết quần áo dày của v2.
- **Tham chiếu của `TOPDOWN_A/B` = sáu `concept_v3.png` của chữ cái ấy** (PB, FL, OS, BR, EX, PS; chỉ danh tính), không còn ảnh style. Prompt v3 của TOPDOWN lấy lại prompt v1 (camera game, hai hàng sáu hình: màu và silhouette đen), đổi khối tham chiếu, STYLE và COLOUR sang v3 và để đèn, than, lửa **thắp** như trên sheet.
- Theo ý người dùng, bước review thêm trước khi tạo ảnh được bỏ qua.

### 15.1 Kết quả (kiểm trên đĩa 20/10/2026, 12:55)

| Job | Đường dẫn (`art/heroes/…`) | Kích thước | Vũ khí vẽ riêng (nhãn trên sheet) | Trạng thái |
|---|---|---|---|---|
| `PB_A` | `PB_pallbearer/vA/concept_v3.png` | 1672×941 | COFFIN-LID SHIELD, MACE | generated (ref: `concept_v2.png`) |
| `PB_B` | `PB_pallbearer/vB/concept_v3.png` | 1672×941 | BIER-POLE | generated (ref: `concept_v2.png`) |
| `FL_A` | `FL_flagellant/vA/concept_v3.png` | 1672×940 | CHAIN-FLAIL, BRANDING IRON | generated (ref: `concept_v2.png`) |
| `FL_B` | `FL_flagellant/vB/concept_v3.png` | 1672×941 | CHAIN SCOURGE, BRANDING IRON | generated (ref: `concept_v2.png`) |
| `OS_A` | `OS_ossuarist/vA/concept_v3.png` | 1672×941 | RELIQUARY, BONE-WAND, SICKLE | generated (ref: `concept_v2.png`) |
| `OS_B` | `OS_ossuarist/vB/concept_v3.png` | 1672×941 | DRUM RELIQUARY, BONE-WAND, SICKLE | generated (ref: `concept_v2.png`) |
| `BR_A` | `BR_brinecaller/vA/concept_v3.png` | 1672×941 | DRIFTWOOD STAFF | generated (ref: `concept_v2.png`) |
| `BR_B` | `BR_brinecaller/vB/concept_v3.png` | 1672×941 | BRINE FLASK, WHALEBONE WAND | generated (ref: `concept_v2.png`) |
| `EX_A` | `EX_exhumer/vA/concept_v3.png` | 1672×941 | CROSSBOW, GRAVE-SPADE | generated (ref: `concept_v2.png`) |
| `EX_B` | `EX_exhumer/vB/concept_v3.png` | 1672×940 | GRAVE-SPADE, CROSSBOW | generated (ref: `concept_v2.png`) |
| `PS_A` | `PS_pyre_singer/vA/concept_v3.png` | 1672×941 | PYRE-STAFF | generated (ref: `concept_v2.png`) |
| `PS_B` | `PS_pyre_singer/vB/concept_v3.png` | 1672×941 | TORCH-STAFF | generated (ref: `concept_v2.png`) |
| `TOPDOWN_A` | `_shared/topdown_A/concept_v3.png` | — | — | **running** (lượt 2; lượt 1 lỗi `referenced_image_paths` must contain at most 5 paths, runner ghi `capacity` vì cuối log có dòng "stream disconnected"; ref: sáu `concept_v3.png` hướng A) |
| `TOPDOWN_B` | `_shared/topdown_B/concept_v3.png` | — | — | **failed, chưa có ảnh** (cả hai lượt lỗi `referenced_image_paths` must contain at most 5 paths, runner ghi `no-image`; ref: sáu `concept_v3.png` hướng B) |

Kích thước đo bằng Pillow trên file thật; trạng thái của 12 sheet hero là `"status":"ok"` trong `run_v3_<JOB>.out` **và** file có trên đĩa. Hai TOPDOWN kiểm theo file trên đĩa (chưa có) và `run_v3_TOPDOWN_<A|B>.out`.

### 15.2 Ghi chú QA và việc còn lại

- **QA của main agent (20/10/2026):** bố cục đúng ở cả 12 sheet.
- **Đồ mặc bị vẽ lặp ở bốn góc** dù cũng vẽ riêng ở dải đáy: EX_A xẻng trên lưng, EX_B nỏ trên lưng, OS_A và OS_B liềm ở thắt lưng. Khi dựng 3D: mô hình thành prop riêng và gỡ khỏi thân.
- **PS_B:** đầu đuốc vẫn hơi giống những ngón tay xòe.
- **BR (A và B):** palette v2/v3 chưa có khối tối L\* ≤ 30 (tối nhất là rong `#3E5A36`, L\* 35).
- **Cỡ ảnh:** 1672×941 (EX_B và FL_A 1672×940), nhỏ hơn 2048×1152 đã xin; công cụ ảnh tích hợp là giới hạn, không phải prompt.
- **Không có H, ALT, `BODIES`:** thân 1 hay thân 2 và thước 1,0H không còn trên sheet; kiểm ở bước T-pose và model (concept doc §12 mục 24).
- **TOPDOWN v3 bị chặn:** công cụ `image_gen` chỉ nhận tối đa **5** `referenced_image_paths`, mà prompt gắn **6** ảnh (một sheet mỗi nghề). Lỗi nằm ở `_shared/topdown_<A|B>/concept_v3.result*.txt`. Runner `hero_batch.py` còn phân loại nhầm lượt 1 của A là `capacity` vì cuối log có dòng "stream disconnected" (khớp `CAPACITY_RE`). Cần đổi cách gắn tham chiếu (ví dụ ghép các sheet để gắn tối đa 5 ảnh, hoặc chia hai lượt) trước khi chạy lại; chưa chọn cách.
- **Việc tiếp theo:** người dùng chọn hướng A hay B cho từng nghề (concept doc §12 mục 21); sau đó T-pose cho Tripo theo `ashlar/pipeline/tripo/Agent.md` (concept → T-pose → tách ảnh từng góc → Tripo Studio trên trình duyệt → GLB), gỡ đồ mặc bị vẽ lặp khỏi thân và dựng vũ khí riêng. `PROLOGUE_LINEUP`, `CHOICE_HANDS` và ảnh pilot không chạy lại ở v3.
