# ASHLAR — Concept sáu hero (Vocation)

**Until the Last · Concept nhân vật người chơi v3 · 20/10/2026**

> **Mỗi hero là một hòn đá rơi khỏi Tường, tay còn nắm tay một người lạ đã chết.** Đồ nghề của người lạ là đồ người làm: có mối nối, có vết vá, ánh sáng lập lòe. Hero càng nhận Perfection càng mất dần mối nối và sáng đều. Chính sự hoàn hảo ấy mới đáng sợ.

---

## 0. Trạng thái và cách đọc

- Đây là **concept viết** cho sáu nghề, dùng để duyệt hướng. **Ảnh đã có trên đĩa (20/10/2026, tổng 36 ảnh):** 12 sheet hero **v3** (`concept_v3.png`, **cách trình bày hiện hành**, §1.4), 12 sheet v2 (`concept_v2.png`, nguồn palette và đạo cụ cường điệu, §1.3), 9 sheet v1 (`concept.png`; v1 của `FL_A`, `OS_A`, `BR_A` đã dừng khi đổi hướng nên không có), ảnh pilot bố cục `PB_A` (`concept_pilot.png`, đã duyệt về bố cục, chưa duyệt về thiết kế; xem §11.1), `PROLOGUE_LINEUP` và `CHOICE_HANDS` (palette v1). Hai sheet camera game `TOPDOWN_A/B` v3 **chưa có ảnh** (lúc kiểm 12:55: B lỗi cả hai lượt, A lỗi lượt 1 và đang chạy lượt 2, cùng nguyên nhân là công cụ ảnh chỉ nhận tối đa 5 ảnh tham chiếu mà TOPDOWN cần 6; xem §11.1c). **Chưa có hướng A hay B nào được người dùng chọn** (§12 mục 21). Kế hoạch ảnh ở §11; brief cho Astra nằm ở `art/heroes/_brief/` (README, MANIFEST, `prompts/` = v1, `prompts_v2/`, `prompts_v3/`).
- Không sửa master art direction, board hay tài liệu nào khác. Nếu được duyệt, chỉ cần thêm một dòng dẫn từ `ashlar/art-direction/ASHLAR_ART_DIRECTION_VI.md` §8 sang file này, kèm erratum Brinecaller ở §12 mục 14.
- **Ba nhãn nguồn** (dùng nhất quán trong cả tài liệu, giống QCQ và AD §1):
  - **Canon**: điều World Bible, Cast, LD hoặc ledger ghi rõ, hoặc một dòng của Voc tự dẫn các nguồn ấy.
  - **Voc**: thiết kế riêng của Vocation System. Theo Voc §0.2 đó là *Proposal*, nhưng là thiết kế nguồn và được giữ nguyên trừ khi người dùng đổi.
  - **Đề xuất**: quyết định của tài liệu này, có thể thay mà không phá truyện. Mọi mã màu, kích thước, hướng A/B, quy ước hai bàn tay và cách hiện tài nguyên trên thân (trừ khung kiệu của Pallbearer, vốn là Voc) đều là **Đề xuất**.
- Viết tắt nguồn:

| Viết tắt | Tài liệu |
|---|---|
| **Voc** | *ASHLAR - Vocation System (Classes, Skills and Stats)* |
| **Bible** | *ASHLAR - World Bible and Story* |
| **Cast** | *ASHLAR - Bestiary and Cast by Act* |
| **LD** | *ASHLAR - Level Design and Atmosphere Guide* |
| **AD** | `ashlar/art-direction/ASHLAR_ART_DIRECTION_VI.md` (art direction v1.1) |
| **QCQ** | `ASHLAR_QUY_CHUAN_QUAI_VI.md` (quy chuẩn quái, đang review) |

- Mã nghề lấy theo mã thread của ledger (V-PB…): **PB** Pallbearer, **FL** Flagellant, **OS** Ossuarist, **BR** Brinecaller, **EX** Exhumer, **PS** Pyre-Singer. Mã quái (U06, F03…) theo checklist quái.
- Đơn vị **H** theo QCQ §1.1: chiều cao thân hero đứng trung tính, chưa tính mũ và vũ khí.
- **L\*** là độ sáng CIE (0 đen, 100 trắng) tính từ mã sRGB, dùng để kiểm value ở §2.5.
- Tên nghề, kỹ năng và vật phẩm giữ nguyên tiếng Anh như nguồn.

---

## 1. Ý tưởng chung

### 1.1 Hero là ai (Canon)

- **The Loosed:** một hình người xám, trần truồng, phủ bụi vữa, rơi ra khỏi tường ossuary ở Lychgate trong đêm Unsettling. Trên ngón tay có chiếc nhẫn bạc xỉn không tháo ra được (Bible §10.1; Cast §2.1).
- **Dấu hiệu:** da lạnh; lúc đầu chảy "máu" bằng vữa xám; nghe người chết thì thầm sau tường; tượng quay đầu nhìn theo; bóng trong gương chậm nửa nhịp (Bible §10.1).
- **Không có mặt trong sử sách:** tên, mặt và giới tính của Keystone bị xóa theo ý chính họ (Bible §4.7). Vì thế người chơi tạo thân, mặt và giới tính **sau** khi chọn nghề (Voc §3.2).
- **Nghề là bàn tay đã nắm:** class là nghề của người lạ mà hero đang nắm tay khi rơi khỏi Tường. Bàn tay ấy vỡ thành bụi, còn kỹ năng, thói quen và đôi khi giọng nói thì ở lại (Bible §13.1; Voc §3.1). Kỹ năng không rời đi khi giọng nói đã chào từ biệt (Voc §3.5).

### 1.2 Hai sức mạnh, hai kiểu hình

Voc §1.1 đặt hai sức mạnh kéo ngược nhau suốt game. Concept biến chúng thành hai ngôn ngữ hình:

| | Nghề của người lạ | Perfection bên trong hero |
|---|---|---|
| Nguồn | Người chết của một dòng tu có thật ở Ashlar | Vị thần đang biến hero thành kẻ kết thúc thế giới |
| Bề mặt | Làm bằng tay, chắp nối, bất đối xứng, có dấu sửa | Liền mạch, đối xứng, không dấu tay |
| Ánh sáng | Lập lòe, có khói, không đều (LD §5.1) | Đều, không bao giờ chớp (Voc §16.8) |
| Trên concept | Toàn bộ thiết kế sáu bộ nghề | Lớp Glow phủ lên trên (§2.7) |

**Hệ quả thiết kế (Đề xuất):** mỗi bộ nghề có **ít nhất một mối nối hoặc vết vá đủ lớn** để đọc được ở camera chơi, theo trụ cột "Đường may là sự sống" (AD §3). Glow là thứ xóa dần những dấu ấy.

### 1.3 Hướng hình v2 — hero nổi bật (quyết định của người dùng, 20/10/2026)

Sau khi xem các sheet v1, người dùng nói: *"vì đây là các hero, tôi cần nó ngầu hơn, nhiều màu sắc hơn chút, bụi bặm thế này không được nổi bật, cường điệu các chi tiết là đặc điểm riêng của class"*. Đây là quyết định art direction mới nhất cho **cách trình bày hero** và **thắng** palette v1 trầm và quy tắc "low detail / không glow" cho **sheet hero**.

**Quy tắc v2 cho sheet hero (Đề xuất, theo quyết định trên):**

- **Mỗi nghề một màu đặc trưng bão hòa**, rải đều quanh vòng màu để sáu hero tách nhau ngay cả khi xếp cạnh: PB tím tang lễ + bạc; FL đỏ thẫm + than cam; OS chàm đêm + xương + linh hồn lạnh; BR xanh biển ngọc + bọt sóng; EX xanh chai + đèn hổ phách + đồng thau; PS tro trắng + lửa cam + sương băng + chỉ đỏ. Màu đậm nhưng không neon.
- **Bề mặt sạch, nét gọn:** không bụi, không bẩn, không giẻ rách, không tua sờn, không vết ố; tối đa **một** miếng vá may gọn làm mối nối người. Chi tiết tập trung vào đạo cụ đặc trưng và được phép tỉ mỉ ở đó; phần còn lại vẫn đơn giản.
- **Ánh sáng:** viền sáng lạnh quanh hình để tách khỏi nền, giá trị tương phản mạnh. **Nguồn sáng người của nghề được thắp** như ánh sáng vẽ có vầng nhỏ cục bộ: đèn (EX, Osric's Lantern của các nghề khác), than (FL), lửa giàn thiêu (PS), còn Ossuarist chỉ có các **điểm linh hồn trắng xanh lạnh đứng yên**. **Không bao giờ trắng vàng**, không hào quang, không quầng, không tia phép, không hạt (trừ vài tàn lửa hoặc tro bay ở nơi đã ghi).
- **Cường điệu đạo cụ đặc trưng:** to hơn, đậm hơn, đọc được ngay ở silhouette. Kích thước v2 (đơn vị H) nằm ở bảng dưới và **thắng** kích thước trong §4.7–§9.7 khi hai bên khác nhau.
- Layout sheet (bảy hình, một thước, nhãn) và thân hiển thị/ALT giữ nguyên như v1 **trong các sheet v2**; từ v3 bố cục đổi (một hình 3/4 lớn + bốn góc + vũ khí tách riêng, không H, không ALT), xem §1.4.

**Swatch v2 (nguồn: `E:/hero-batch/build_v2.py`, dict `PALETTE`; L\* tính từ sRGB):**

| Nghề | Màu đặc trưng | Swatch chính (HEX, L\*) |
|---|---|---|
| **PB** | Tím tang lễ + bạc | tím pall `#4B2A6B` (24); viền bạc `#C9CED6` (83); thép đánh bóng `#AEB6BF` (74), bóng thép `#4E5660` (36); sồi vàng nhạt `#D6BC8C` (77); đồng thau `#B8863B` (59); vữa sáng `#A39E94` (65); đinh bạc `#EEF1F4` (95); da `#4A3020` (23) |
| **FL** | Đỏ thẫm + than cam | áo đỏ thẫm `#8E1F24` (31); vải lanh trắng `#EFE6D2` (92); sắt đen `#2B2B30` (18); cổ tay áo `#141214` (6); cam than `#FF7A2A` (66) **chỉ** ở nồi hoặc hộp than và đầu sắt nung; tro `#9A968F` (62) |
| **OS** | Chàm đêm + xương + linh hồn lạnh | chàm đêm `#1F2547` (16); đen mực `#121320` (6); xương ngà `#EDE3CB` (90); bạc xỉn `#A8AAB0` (70); lanh nhạt `#D9D2C2` (84); điểm linh hồn `#BFF4FF` (93), nhỏ và đứng yên |
| **BR** | Xanh biển ngọc + bọt sóng | teal biển sâu `#11606A` (37) → ngọc `#2FA3A0` (61); bọt `#CFEDE6` (91); muối xám xanh `#CFDCC8` (86), không bao giờ trắng thuần, luôn lởm chởm; rong `#3E5A36` (35); thừng `#C9A55C` (70); vỏ sò `#EFE3C8` (91); hạt san hô `#D9574A` (54) |
| **EX** | Xanh chai + đèn hổ phách + đồng thau | áo vải dầu xanh chai `#1E4A3A` (28); da sẫm `#4A2E1E` (22); đồng thau `#C08A3E` (61); bạc (bu lông, lưỡi xẻng) `#E1E6EA` (91); khăn lanh `#E3D9C4` (87); mũ dạ `#3A2A1E` (19); miếng vá kem `#E6DCC2` (88); đèn hổ phách `#FFB347` (78) |
| **PS** | Tro trắng + lửa cam + sương băng + chỉ đỏ | mạng tro `#DAD4CA` (85); áo muội `#2A2420` (15); chỉ đỏ thêu `#B3332B` (41); lông nâu ấm `#7A5A40` (41); sương băng `#BFE3F5` (88) chỉ ở **một** bên (vai trái và gấu); lửa cam `#FF8A2A` (69) |

**Đạo cụ cường điệu theo hướng (nguồn: `PUSH` trong `build_v2.py`; kích thước là Đề xuất):**

| Job | Cường điệu |
|---|---|
| `PB_A` | Khiên nắp quan tài **0,9H × 0,34H**, viền sắt dày, đinh bạc to như đinh tán, chốt đinh ở giữa; khung kiệu cao tới **1,45H**, nửa trên hở, nửa dưới vữa sạch; chùy cánh **0,55H**; chuông sắt **0,12H** ở hông phải; giáp vai to viền bạc, nửa áo choàng tím trên vai trái; Osric's Lantern **thắp** ở góc dưới phải khung |
| `PB_B` | Đòn khiêng **1,5H** dựng ở tay phải, đầu bịt bạc hình đầu đinh quan tài; khung kiệu **1,45H** bó đai sắt; nắp **0,9H** treo dọc sườn trái khung; giáp brigandine tím đinh tán bạc; chuông ở hông phải; Osric's Lantern thắp |
| `FL_A` | Roi xích tay phải, hai xích dài đầu bi gai lớn; sắt nung tay trái, đầu nút thắt **nung cam**; nồi than hông trái hé lửa qua nắp; dây mười nút buông dài; vạt áo đỏ thẫm xòe rộng |
| `FL_B` | Bao tay xích **to** quấn hai cẳng tay, xích dài gỡ ra từ tay phải đầu quả cân gai, vòng xích ngang ngực; hộp than bên trái thắt lưng hé lửa, hai cán sắt nung nhô ra; dải thắt lưng đỏ mười nút |
| `OS_A` | Hòm thánh tích nhà nhỏ **0,28H**, tám hốc mỗi hốc một điểm linh hồn lạnh đứng yên, một sợi hồn xám trắng cuộn lên; đũa xương tay phải đội quạt xương ngón bó dây bạc; nhẫn xương ngón to; liềm sau thắt lưng, bó que đếm ở hông trái |
| `OS_B` | Hòm thánh tích trống **0,28H** đai bạc khắc vạch đếm, tám hốc, mỗi hốc một điểm linh hồn lạnh; đũa xương **0,55H** đội quạt xương ngón rộng; áo khoác chàm dài; áo choàng nỉ nhạt; liềm bên hông trái |
| `BR_A` | Cụm tinh thể muối xám xanh góc cạnh trên vai phải như giáp vai, chảy xuống tay áo phải; gậy trôi dạt **1,35H** đội cụm muối, vỏ sò, phao thủy tinh xanh; đai chéo ba bình nước teal đục; gấu áo uốn sóng có vệt triều |
| `BR_B` | Bình tròn **0,35H** trong lưới thừng ở tay trái, nước teal xoáy, muối mọc từ cổ bình; đũa xương cá voi đầu vỏ xoắn; muối đóng dày trên quấn chân phải và cuộn thừng vai phải; hũ muối gốm ở thắt lưng, không lọ thủy tinh |
| `EX_A` | Vành mũ rộng, một bên ghim lên, miếng vá kem trên chỏm; áo vải dầu xanh chai dài tà xòe; đèn năm nan **0,22H** **thắp** hổ phách treo trước ngực trái; nỏ nặng cung thép, quay bên hông, bao tên bu lông bạc; xẻng lưỡi dài viền bạc khắc đeo lưng nghiêng khoảng 20° |
| `EX_B` | Mũ rộng trùm mũ áo; áo chần xanh chai tạp dề da; đèn năm nan **0,22H** thắp hổ phách ở hông trái; xẻng **1,2H** lưỡi bạc khắc dựng ở tay phải; nỏ đeo lưng; túi dây và cọc ở hông phải |
| `PS_A` | Gậy giàn thiêu **1,4H**, đầu lồng sắt khúc củi **cháy** lửa cam, tro bay lên; mạng tro dài hất ra sau vòng sắt đen; cổ lông dày có sương băng vai trái; áo muội dài thêu chỉ đỏ đậm ở gấu và cổ tay; bím chỉ đỏ cổ tay trái hai đuôi dài |
| `PS_B` | Gậy bạch dương cong **1,3H** đầu **búi nón** cành và nhựa **cháy**, tro bay (búi chặt như đuốc, không xòe như bàn tay); áo choàng lông trùm đầu dài tới gối, cài ở cổ họng, sương băng bên trái; mạng tro rủ sau vành mũ; túi tro ở thắt lưng; bím chỉ đỏ cổ tay trái |

**Phạm vi áp dụng và việc còn lại:**

- Các bảng palette v1 (§4.4–§9.4), kích thước (§4.7–§9.7) và phong cách "ít chi tiết, không glow" ở §2.5, §4–§9 **vẫn giữ làm nền value và lịch sử** (giá trị trong game, nền tối trung tính để thử scene), nhưng **sheet hero từ nay theo §1.3** (màu, đạo cụ, ánh sáng) **và §1.4** (bố cục và độ cách điệu của v3). Ảnh v1 (`concept.png`) được xem là **bị v2 thay thế**; về trình bày, cả v1 lẫn v2 đều **bị v3 thay thế** (§1.4).
- **Quy tắc value của §2.5** (một khối sáng L\* ≥ 65, một khối tối L\* ≤ 30) và **các bài thử act ở §11.2** (năm nền act, nền Course, cảnh Seamless) **chưa chạy trên màu v2** và phải chạy lại. Đọc sơ bộ từ cột L\* ở trên: cả sáu nghề đều có khối sáng ≥ 65; khối tối ≤ 30 có ở PB (pall `#4B2A6B`, 24), FL (sắt `#2B2B30`, 18; áo đỏ thẫm `#8E1F24` chỉ L\* 31), OS, EX và PS, nhưng **BR không có swatch nào ≤ 30** (tối nhất là rong `#3E5A36`, L\* 35), nên BR cần một khối tối hơn hoặc phải ghi nhận ngoại lệ. Teal BR và đèn hổ phách EX giờ là màu **chính**, cần thử lại trên nền Act III và nền Course. Màu cam than, hổ phách và linh hồn là **ánh sáng vẽ** trên sheet v2, không còn là `usedOnSheet: false`.

### 1.4 Bố cục sheet v3 (quyết định của người dùng, 20/10/2026)

Sau khi xem các sheet v2, người dùng nói: *"gen thành 1 góc 3/4. 4 góc các hướng, vũ khí tách riêng, cách điệu hơn nữa để tạo ấn tượng, giảm detail quần áo đi"*. Nghĩa là: **một** hình 3/4, **bốn** góc theo hướng nhìn, **vũ khí vẽ riêng**, **cách điệu hơn nữa** để gây ấn tượng, **giảm chi tiết quần áo**. Đây là quyết định art direction mới nhất cho **cách trình bày hero** và **thắng** bố cục "bảy hình một hàng" của v1 và v2 (§1.3, §11.1) cùng mức chi tiết quần áo của v2. **v3 là cách trình bày hero hiện hành.** v2 còn là **nguồn palette và đạo cụ cường điệu** (các bảng ở §1.3); v1 chỉ còn là lịch sử và nền value.

**Bố cục v3 (Đề xuất, theo quyết định trên; nguồn: `E:/hero-batch/build_v3.py`, dòng `LAYOUT`):**

- **Một sheet 16:9.** Prompt xin 2048×1152 hoặc lớn hơn; công cụ ảnh tích hợp chỉ trả 1672×941 (EX_B và FL_A: 1672×940).
- **Phần trái (khoảng một phần ba):** MỘT hình toàn thân góc 3/4 trước-trái, cỡ lớn (cao khoảng 80% khung), dáng đứng oai nhưng không phải pose hành động, **cầm vũ khí**; nhãn `3/4`.
- **Phần phải, hàng trên:** bốn hình trực giao toàn thân trên **một** đường nền, **một** cỡ chung nhỏ hơn (khoảng 55% chiều cao khung): `FRONT`, `LEFT` (mặt trái giải phẫu của hero, nhìn sang trái ảnh), `RIGHT` (mặt phải thật, nhìn sang phải ảnh, không phải bản lật gương), `BACK`. Dáng A-pose thả lỏng, hai tay mở và **trống**; mọi đồ **mặc và đeo** vẫn ở trên thân đúng như hình 3/4.
- **Phần phải, dải đáy:** vũ khí và class item cầm tay vẽ **riêng**, cạnh nhau có khoảng cách, **cùng cỡ** với bốn hình, vật dài nằm ngang, mỗi vật một nhãn ngắn.
- Tiêu đề ở trên cùng (ví dụ `PB PALLBEARER — A`); không khung, không inset, không hình thừa, không cảnh nền, không cắt hay chồng hình. **Không còn hình H** (người thước) **và không còn hình ALT** (thân còn lại): hai thân gốc (§2.1) và thước 1,0H không còn được thử trên sheet (§12 mục 24).
- **Danh tính, palette và đạo cụ cường điệu giữ từ v2** (các bảng ở §1.3). Tham chiếu của mỗi job là `concept_v2.png` của chính job đó: giữ danh tính, silhouette, đạo cụ và màu; **không** chép bố cục bảy hình nhỏ và **không** chép chi tiết quần áo dày của v2.

**Phong cách v3 (Đề xuất; nguồn: `build_v3.py`, chuỗi `STYLE`):** **cách điệu hơn** để gây ấn tượng, theo tinh thần class art của Diablo Immortal: hình khối to, dày, đọc ngay; tỷ lệ anh hùng, bàn tay, bàn chân, vai và đạo cụ đặc trưng hơi quá cỡ. **Quần áo đơn giản hóa thành vài mảng màu lớn, sạch, ít nếp**: không hàng đinh tán, không thêu, không đường may, không khóa nhỏ, không miếng vá, không rìa sờn hay rách. **Mọi chi tiết tỉ mỉ dồn vào đạo cụ đặc trưng và vũ khí.** Giữ từ v2: màu đặc trưng bão hòa, tương phản value mạnh, viền sáng lạnh tách khỏi nền, ánh sáng người của nghề **thắp** như ánh sáng vẽ (đèn, than, lửa giàn thiêu; OS chỉ có điểm linh hồn lạnh đứng yên), không bụi, không bẩn, không giẻ rách, không trắng vàng, không hào quang, không tia phép; nền xám ấm phẳng, không môi trường. **Ngoại lệ có chủ đích:** miếng vá kem khâu trên chỏm mũ EX là dấu nhận diện của nghề (§8), nên `KIT` của EX_A và EX_B vẫn ghi nó dù `STYLE` v3 cấm miếng vá nói chung (cả hai sheet đều vẽ nó).

**Bộ đồ theo job (nguồn: dict `KIT` trong `build_v3.py`).** Cột giữa là thứ **mặc/đeo**: ở trên thân trong hình 3/4 và cả bốn góc. Cột phải là thứ **vẽ riêng** ở dải đáy (hình 3/4 cầm chúng). Palette và kích thước đạo cụ: §1.3.

| Job | Mặc/đeo trên thân (3/4 và bốn góc) | Vẽ riêng (dải đáy) |
|---|---|---|
| `PB_A` | khung kiệu quan tài có các hàng vữa trên lưng; nửa áo choàng tím; găng sắt TRÁI đóng đinh bạc; chuông ở hông phải; Osric's Lantern ở góc dưới phải khung | **khiên nắp quan tài** (~0,9H, viền sắt dày, đinh bạc to, chốt đinh ở giữa); **chùy cánh** (~0,55H) |
| `PB_B` | khung kiệu có các hàng vữa **và nắp quan tài lớn cất trên móc dọc sườn trái khung**; áo choàng tím có mũ; dây thừng chéo ngực; chuông ở hông phải; Osric's Lantern ở góc dưới phải khung | **đòn khiêng** (~1,5H, hai đầu bịt bạc hình đầu đinh quan tài, nằm ngang) |
| `FL_A` | nồi than đang cháy ở hông trái; dây mười nút ở thắt lưng; áo scapular đỏ thẫm; vải lanh quấn tay chân; mũ vải lanh ôm đầu; Osric's Lantern sau hông phải | **roi xích** (cán ngắn, hai xích dài đầu bi sắt gai lớn); **sắt nung** (thanh sắt dài, đầu nút thắt một vòng nung cam) |
| `FL_B` | bao tay xích to ở hai cẳng tay; vòng xích nặng ngang ngực; hộp than sắt đang cháy ở bên trái thắt lưng (cán sắt nung nhô ra từ nắp đóng); dải đỏ thắt lưng kết bằng dây mười nút; mũ vải lanh; Osric's Lantern sau hông phải | **xích quất** (xích dài nặng đầu cân sắt gai, cuộn và trải ngang); **sắt nung** |
| `OS_A` | khăn choàng-mũ trùm chàm đêm có khuy xương; tạp dề lanh nhạt; nhẫn xương ngón to ở tay trái; bó que đếm khắc vạch ở hông trái; Osric's Lantern sau hông phải | **hòm thánh tích** (hộp nhà nhỏ bằng tấm xương chạm góc bạc, xích ngắn, ~0,28H, tám hốc mỗi hốc một điểm linh hồn lạnh); **đũa xương** (xương ngón bó dây, đội quạt xương ngón); **liềm** (liềm sậy nhỏ) |
| `OS_B` | áo khoác chàm dài có mũ trùm; áo choàng nỉ nhạt chưa nhuộm; nhẫn xương ngón to ở tay trái; Osric's Lantern sau hông phải | **hòm thánh tích dạng trống** (tấm xương, đai bạc khắc vạch đếm, nắp vòm có vòng, ~0,28H, tám hốc điểm linh hồn); **đũa xương** (~0,55H, quạt rộng); **liềm** |
| `BR_A` | cụm tinh thể muối xám xanh góc cạnh lớn trên vai và tay áo phải; đai chéo ba bình nước biển; khăn choàng lưới đánh cá có phao thủy tinh và vỏ sò; khăn đội đầu nút ngắn không đuôi; vòng vỏ sò cổ tay trái; Osric's Lantern sau hông phải | **gậy trôi dạt** (~1,35H, đội cụm muối lớn, thừng, vỏ sò, phao thủy tinh xanh treo; nằm ngang) |
| `BR_B` | áo chần xanh ngọc; cuộn thừng đóng muối trên vai phải; quấn lội nước chân phải đóng muối; mũ len xám biển; hũ muối gốm nhỏ ở thắt lưng; Osric's Lantern sau hông phải | **bình nước biển** (bình thủy tinh tròn ~0,35H trong lưới thừng có quai, nước teal đục xoáy, muối mọc từ cổ bình xuống); **đũa xương cá voi** (ngắn, đầu vỏ xoắn) |
| `EX_A` | mũ rộng vành (bên trái ghim lên) với miếng vá kem khâu trên chỏm; áo dài xanh chai tà xẻ và áo choàng vai ngắn; **đèn class thắp hổ phách** treo ở ngực trái trên tay móc sắt ngắn; bao tên bu lông bạc ở thắt lưng; đai chéo khóa đồng thau; khăn cổ lanh | **nỏ** (nỏ nặng cung thép lớn, tay quay bên, vài mũi tên bạc); **xẻng đào mộ** (lưỡi dài viền bạc khắc; nằm ngang) |
| `EX_B` | mũ rộng mềm trùm lên mũ áo và áo choàng vai, miếng vá kem trên chỏm; áo khoác chần xanh chai và tạp dề da đào; **đèn class thắp hổ phách** ở hông trái trên xích móc; túi dây thép và cọc ở hông phải; khăn lanh | **xẻng đào mộ** (~1,2H, lưỡi bạc khắc; nằm ngang); **nỏ** (gọn, cung thép) |
| `PS_A` | mạng tro trắng hất ra sau từ vòng sắt đen; cổ lông dày có sương băng xanh ở vai trái; áo muội than có dải đỏ đậm ở gấu và cổ tay; bím chỉ đỏ hai đuôi ở cổ tay trái; Osric's Lantern sau hông phải | **gậy giàn thiêu** (~1,4H, đầu lồng sắt khúc củi cháy lửa cam, tro bay; nằm ngang) |
| `PS_B` | áo choàng lông trùm đầu dài tới gối, cài ở cổ họng, hở từ ngực xuống, sương băng bên trái; mạng tro rủ từ vành mũ ra sau; áo tunic muội viền đỏ; túi tro muội ở thắt lưng; bím chỉ đỏ cổ tay trái; Osric's Lantern sau hông phải | **gậy đuốc** (~1,3H, gậy bạch dương cong, đầu búi nón cành và nhựa bó chặt cháy lửa cam, không xòe như bàn tay; nằm ngang) |

**Ghi chú QA v3 (main agent, 20/10/2026):**

- Bố cục đúng ở cả 12 sheet (một hình 3/4 lớn, bốn góc, dải vũ khí riêng).
- Đồ mà thiết kế **mặc** vẫn hiện ở bốn góc dù cũng được vẽ riêng ở dải đáy: **EX_A** xẻng trên lưng, **EX_B** nỏ trên lưng, **OS_A và OS_B** liềm ở thắt lưng. Khi dựng 3D: mô hình thành **prop riêng** và **gỡ khỏi thân** (khớp `ashlar/pipeline/tripo/Agent.md`: vũ khí và đạo cụ cầm tay không nằm trên nhân vật trong T-pose, cần thì dựng riêng).
- **PS_B:** đầu đuốc vẫn hơi giống những ngón tay xòe.
- **BR (A và B):** palette v2/v3 chưa có khối tối L\* ≤ 30 (xem §1.3, đoạn cuối).
- Prompt v3 không còn dòng `BODIES` của v1 và v2, nên thân hiển thị (Thân 1 hay Thân 2) không bị ép; v3 cũng bỏ H và ALT (§12 mục 24).

---

## 2. Quy tắc chung cho sáu hero

### 2.1 Thân hero và creator

- **Hai thân gốc (Đề xuất):** **Thân 1** vai rộng, hông hẹp; **Thân 2** vai hẹp, hông rộng. Cả hai cao đúng **1,0H** để hitbox và độ đọc như nhau. Mặt, tóc, màu da do creator quyết.
- Mọi bộ nghề phải mặc được trên cả hai thân **mà không đổi silhouette chính**. Giáp, vải và đạo cụ co giãn theo vai và hông, không vẽ lại.
- **Tỷ lệ (Đề xuất):** khoảng 7 đầu, không phóng đại kiểu siêu anh hùng. Bàn tay, bàn chân và đạo cụ to hơn thật 10–15% để đọc ở camera cao. AD §14 còn để mở "độ phóng đại tỷ lệ của sáu nghề"; đây là điểm khởi đầu.
- **Da (Đề xuất):** tông hơi lạnh, không xám chết: dấu "da lạnh" của canon. Ở Prologue phủ bụi vữa xám. Sau A1-Q4, khi tim bắt đầu đập đỏ (Bible §16), bụi chỉ còn ở kẽ móng.
- **Mặt luôn lộ** trên concept để creator có chỗ thể hiện. Mũ, mạng, nón là trang bị tùy chọn. Sau kết thúc, tượng Nameless Saint mang **mặt** hero chứ không mang đồ (Voc §17.12; LD §9.6).
- **Thân hiển thị trên sheet (Đề xuất trình bày):** theo giới của người lạ, để gợi "bàn tay đã nắm": Aldwin và Ezra → Thân 1; Agathe, Grist, Hasmik, Velimira → Thân 2. Mỗi sheet v1 và v2 có thêm hình **ALT** trên thân còn lại; **v3 không có ALT và không ép thân** (§1.4, §12 mục 24). Đây **không** phải khóa giới tính cho nghề.
- **Giày dép (Đề xuất):** PB ủng nặng; FL cẳng chân quấn vải và ủng thấp; OS ủng mềm; BR-A chân quấn vải, BR-B quấn vải lội nước tới gối; EX ủng cao tẩm dầu; PS ủng bọc lông. Prologue đi chân trần.

### 2.2 Hai bàn tay (Đề xuất)

- **Dấu bàn tay của người lạ luôn ở tay trái; class item ở bên trái khi bộ đồ cho phép.** Tay trái mang dấu như ở màn chọn nghề (Voc §3.2). Đồ nghề của người chết nằm đúng ở bàn tay đã nắm họ. Dấu tay chỉ cần đọc ở cận cảnh, cinematic và paper-doll, không cần đọc ở camera chơi.
- **Ngoại lệ có chủ đích:** BR-A đeo ba bình trên đai chéo ngực (tay trái chỉ mang vòng vỏ sò và vệt triều); với PS class item là **mũ** (mạng tro), nên không ở tay nào.
- **Tay phải mang chiếc nhẫn.** Nhẫn bạc xỉn (Canon) đeo ở ngón áp út tay phải: tay của người còn sống đã chờ (Severin), đối diện tay của người chết đã nắm. Nhẫn **không phát sáng**. Theo đề xuất của nguồn, nhẫn đeo ở "ngón riêng của nó", ngoài hai ô nhẫn (Voc §17.6).
- **Quy tắc hiện nhẫn:** thấy được khi tay phải trần (FL, OS, BR, PS). Khi tay phải đeo găng (PB, EX) nhẫn bị che trên model game; chỉ hiện ở cận cảnh và paper-doll, và không vẽ trên sheet.

| Nghề | Dấu ở tay trái (từ Voc §3.2) | Cách thể hiện trong style ít chi tiết |
|---|---|---|
| PB | Găng sắt rộng, đinh quan tài bạc gắn trên tấm khớp ngón; vết dây hằn trong lòng bàn tay | Hàng đinh bạc to trên khớp găng. Vết dây chỉ thấy ở cận cảnh khi tháo găng |
| FL | Dây thắt nút quấn hai vòng cổ tay; cổ tay áo đen của nữ tu | Hai vòng dây nút to, cổ tay áo đen một mảng; vài mắt xích **nguội** |
| OS | Bàn tay già, mực và vữa trong nếp tay; nhẫn đốt xương ngón | Hai, ba nhẫn xương ngà to; một mảng vết vữa xám trên mu bàn tay |
| BR | Tay nứt trắng vì muối, tay áo ố vệt triều, vòng tay vỏ sò | Một mảng bụi muối xám trắng ngả xanh nhạt trên mu bàn tay (**Đề xuất:** Voc §3.2 ghi "cracked white with salt"; doc vẽ thành bụi xám trắng có ánh xanh vì muối của hero xám xanh, Voc §13.2, §13.9; không vẽ vết nứt nhỏ), một vệt triều to trên tay áo, vòng vỏ sò |
| EX | Găng tẩm dầu đèn; chai ở ngón cái vì lên dây nỏ | Găng da dầu sẫm. Chai tay chỉ ở cận cảnh |
| PS | Tay sẹo bỏng, tro dưới móng, bím chỉ đỏ | Bím chỉ đỏ ở cổ tay là accent nhỏ nhất của nghề. Sẹo chỉ ở cận cảnh, thành một mảng mịn |

### 2.3 Ba dấu nhận diện và dấu đọc từ camera cao

AD §8 đề xuất mỗi nghề có **một khối nhận diện chính, một đạo cụ đặc trưng, một nhịp chuyển động**. Tài liệu này thêm **dấu đọc từ trên (Đề xuất)**: thứ camera chéo trên cao thấy đầu tiên, tức đỉnh đầu, vai và mặt lưng.

Bảng dưới chỉ ghi những gì **đúng cho cả hướng A và B** (bất biến). Chỗ A và B khác nhau nằm ở §4–§9 và bảng so sánh ở §3.

| Nghề | Khối nhận diện (A và B) | Đạo cụ đặc trưng | Nhịp chuyển động | Dấu đọc từ trên |
|---|---|---|---|---|
| **PB** | Khối thấp, nặng; khung kiệu hình quan tài hẹp dựng sau lưng; nắp quan tài đọc được | Nắp quan tài đóng đinh bạc (A: trên tay; B: treo bên sườn khung); đòn khiêng ở B | Dồn – gánh – đặt xuống | Ô khung hình quan tài hẹp nhô trên đầu, lấp vữa theo Burden |
| **FL** | Thân hẹp, nhanh; vòng cung xích; nồi hoặc hộp than ở bên trái thắt lưng; dây nút mười nút | Roi xích hoặc chùy xích, kèm sắt nung | Co – quất – duỗi; quỳ – đứng dậy | Vòng xích quét quanh thân, một chấm than ở hông trái |
| **OS** | Một khối tối ở vai hoặc đầu (khăn hay mũ trùm chàm) cộng một khối sáng (tạp dề A, áo choàng nỉ B); hòm thánh tích ở tay trái | Hòm thánh tích tám hốc | Kéo lên – giữ – trả về | Vòm tối, khối hòm màu xương, vết nứt bò quanh chân |
| **BR** | Muối xám xanh đóng **lệch một bên (phải)** trên nền rong tối; không đối xứng | Gậy hoặc đũa gỗ trôi dạt, bình nước biển | Tưới – rắc – vỡ | Vai hoặc chân muối lệch, đầu gậy hoặc đũa cong |
| **EX** | Mũ rộng vành, đèn có chụp ở bên trái trong tầm tay, xẻng lưỡi dài | Đèn có chụp, nỏ, xẻng | Che – rình – bắn | Đĩa mũ rộng với miếng vá kem may trên chỏm, chấm đèn ấm, lưỡi xẻng dài (A: nghiêng sau lưng; B: dựng đứng ở tay) |
| **PS** | Mạng tro hất ra sau, mặt để trống; gậy giàn thiêu | Gậy giàn thiêu | Hít – mở ngực – ngân | Vệt mạng sáng dài sau lưng (chỉ PS có đuôi vải dài), đầu gậy lửa |

### 2.4 Ánh sáng của hero

- **Ánh sáng nghề là ánh sáng người** (LD §5.1; Voc §18.4): lập lòe, có khói, không đều. Không nghề nào mang vật phát sáng đều thường trực.
- **Ngoại lệ có chủ đích:** linh hồn mượn của Ossuarist mang ánh của Tường: điểm trắng lạnh đứng yên, không chớp, không ấm (Voc §12.9; LD §5.1). Nó phải khác hẳn Glow trắng vàng.
- **Glow là ánh Perfection:** trắng vàng, đều, không bao giờ chớp (Voc §16.5, §16.8).
- **Thứ bậc hiệu ứng:** generator không bao giờ là thứ sáng nhất trên màn hình; kỹ năng tier 30 có thể là thứ sáng nhất (Voc §18.4).
- **Không dùng tint cảnh báo của địch** và không vẽ đè lên telegraph của địch. Trong co-op, hiệu ứng của đồng đội giảm độ đục. Hiệu ứng nằm trên mặt đất (brine, crust, lửa, bẫy, grave-light) giữ tương phản thấp (Voc §18.4).
- **Không có nhịp đập đều.** Mọi ánh sáng người (than của FL, đầu gậy của PS, đèn của EX) thay đổi **cường độ chập chờn bất quy tắc** theo bài hát hoặc tài nguyên, không theo nhịp. "Phập phồng như ống thổi" là của Discarded (LD §5.1).

**Osric's Lantern: quy tắc chung (Đề xuất).** Từ A1-Q2 mọi hero mang Osric's Lantern và bóp chụp được bằng phím đèn (Voc §2.3, §8.9, §17.4, §17.6; ledger §7.3). LD §5.3 đòi mọi nguồn sáng của hero có chỗ nhìn thấy được. Vì vậy:

- **Hình:** đèn xách cũ bằng sắt, đơn giản, cao **0,12H**, **một** nắp chụp có bản lề, **không nan, không khấc** (không bao giờ giống đèn năm nan của Exhumer), **không thắp** trên sheet concept.
- **Chỗ treo:** trên một sợi xích ngắn **sau hông phải**. Pallbearer: treo từ góc dưới bên phải của khung kiệu. Exhumer: **gộp vào đèn class** (Voc §17.6: với Exhumer nó mở nấc Beacon), nên không có đèn thứ hai.
- Vẽ trên mọi sheet hero (trừ EX). Không có ở Prologue (đến A1-Q2 mới nhận). Ở bậc Glow cao nó vẫn là đèn người, chớp.
- **Ghi chú engine:** vầng sáng bán kính nằm trên hero; chiếc đèn là lý do trong thế giới cho vầng sáng đó.

| Nghề | Ánh sáng và màu hiệu ứng của nghề | Nguồn |
|---|---|---|
| PB | Lóe bạc của đinh, tia lửa sắt. Không có gì sáng đều | Voc §10.9 |
| FL | Đỏ than, luôn chớp; **chỉ ở nồi hoặc hộp than và các cây sắt nung trong đó**, không bao giờ trên da | Voc §11.9 |
| OS | Điểm trắng lạnh đứng yên (linh hồn); vữa xám; lạnh của Tường (Frost) | Voc §12.4 (Frost), §12.9 |
| BR | Nước teal đục có bọt và rong; muối xám xanh sạn; tia sét chớp | Voc §13.9 |
| EX | Đèn lồng thật trong engine, ấm, chớp, suy giảm thành bậc | Voc §14.9; LD §5.3 |
| PS | Lửa tang cam có khói, tro bay lên; sương giá trắng xanh tinh thể lệch; Smoke-Shape xám khói, mắt than | Voc §15.9 |

### 2.5 Màu và value

- Palette từng nghề ở §4–§9 là **swatch khởi điểm**, mỗi bảng có cột **L\***. AD §8 yêu cầu khóa palette cuối **sau khi thử trong scene**.
- **Quy tắc cho mảng lớn (Đề xuất):** không dùng màu rarity (vàng Dressed, cam Graven, vàng kim Hallowed, xanh Hewn; LD §5.5); không dùng tint cảnh báo của địch; không trắng phát sáng Seamless; không đè lên accent của act (poppy, máu trên muối).
- **Quy tắc value (Đề xuất):** mỗi nghề, ở **cả hai hướng**, giữ **một khối sáng (L\* ≥ 65)** và **một khối tối (L\* ≤ 30)**, để ít nhất một khối tách khỏi mọi nền. Các khối trung bình (L\* 40–60) dễ chìm vào nền Course (xám ấm `#8C847A`, L\* 56; LD §5.4) và vào Remembrancer F15 (`#8E8A80`, L\* 58). Trong game thêm **một viền sáng mảnh quanh hero** (tương tự LD §8.1) thay cho việc làm sáng các khối.
- **Mẫu sáng tối khi xem grayscale** (đúng cho cả A và B):

| Nghề | Khối tối (L\* ≤ 30) | Khối sáng (L\* ≥ 65) | Trung gian |
|---|---|---|---|
| PB | Vải phủ pall (21); áo giáp vải của B (30) | Khung kiệu và nắp sồi nhạt phong hóa (72) nhô trên đầu: đúng cho **cả A và B** (B bó đai sắt mảnh) | Giáp tấm của A (48), vữa (51), đai sắt của B (32) |
| FL | Áo hoặc áo giáp nâu đỏ sẫm (24) | Vải lanh quấn tay chân (78): chuyển động tay chân nổi lên | Sắt (30), tro (62) |
| OS | Khăn hoặc mũ trùm chàm (21), áo xám mực (25) | Tạp dề A (66) hoặc áo choàng nỉ B (74), xương ngà (82) | Bạc xỉn (64) |
| BR | Rong (28) | Muối xám xanh lệch một bên (75): A vai phải và tay áo phải; B chân phải và cuộn dây thừng vai phải | Lanh xám biển (62) |
| EX | Áo vải dầu nâu sẫm (26) | Khăn cổ lanh (71); miếng vá kem trên chỏm mũ (83) | Mũ dạ (63) |
| PS | Muội (14) | Mạng tro (71), len mộc (77) | Lông (39) |

- **Cảnh báo value đã biết (Đề xuất):** FL áo nâu đỏ sẫm cùng value với than bùn Act I (`#4A3526`, L\* 24), nên FL tách nhờ vải quấn sáng và viền sáng; OS mũ chàm gần value với đen của Night Fens và nền băng Act IV (tương phản chỉ 1,15–1,28), nên OS tách nhờ khối sáng và viền sáng; teal của BR chỉ là viền nhỏ vì teal đục là màu brine Act III và là màu vũng nước mà hero đứng trong (Voc §13.9); mạng PS tách khỏi mạng băng P16 `#D8E7EF` (L\* 91) bằng độ đục ấm, và PS dùng chỉ đỏ cam `#A84B30` để không lẫn máu Act III `#9E1B1B`; sương VFX của PS `#BCD0EA` xanh hơn salt-glass `#CFE3E2` của Purity (QCQ), nhưng **hình dạng** (tinh thể lông vũ lệch) vẫn là khác biệt chính (Voc §15.9).
- **Thử trong lab (Đề xuất):** năm nền act **và** nền Course (xám ấm `#8C847A`, nơi Inner Course diễn ra) **và** một cảnh Seamless đơn giản (AD §13). Xem §11.2.

**Tách khỏi người cùng dòng ở phe khác.** Một nghề có thể trùng đồ với kẻ địch hoặc đồng đội cùng dòng. AD §8 yêu cầu tách bằng hành vi, dấu mục tiêu và bố trí mảng, không chỉ bằng màu áo.

| Hero | Dễ lẫn với | Mẫu đối chiếu (QCQ hoặc Cast) | Cách tách (Đề xuất) |
|---|---|---|---|
| PB | U06 Pall-Wight; Ser Hamon; Pallbearer đồng minh ở Act V | Giáp đen `#1F1D22`, đinh bạc, **quan tài đóng kín** 0,80–1,00H trên lưng | Hero mang **khung hở hình quan tài hẹp**, quan tài vữa xám đắp dần; giáp thiếc (A) hoặc áo giáp vải nâu xám sẫm (B), không đen toàn thân. Nắp 0,72H × 0,28H là nắp tạo hình (stylised) cao và hẹp, đọc là khiên nắp quan tài, không bao giờ là quan tài trẻ con (LD §8.5) |
| FL | F04 Kneeler; F06 Censer-Bearer; F08 Halo Knight; P09 Chain-Hung; D02 Kiln-Shaman | Bao bố, hào quang sắt, áo lễ đen, áo choàng trắng, móc treo; nồi than khói **trên lưng** | **Không hào quang** trên trang bị của FL; áo nâu đỏ sẫm, không đen, không bao bố; nồi hoặc hộp than ở **hông trái**, không bao giờ trên lưng; dáng đứng thẳng, linh hoạt |
| OS | U10 Wallshade; U11 Scribe-Shade; F15 Remembrancer; Gennet | Hồn trong mờ mặt ép kính; U11 mực đen, bút lông (Cast §4.6); thủ thư áo xám, kính một mắt, lọ mẫu; Gennet cầm **sổ dưới tay** (Cast §3.1) | Hero đặc, ấm; hòm thánh tích là hộp (A nhà nhỏ, B trống xương tám hốc), **không phải lọ, không phải sổ**: không sổ cái, không thẻ số; không đầu lâu trên quần áo |
| BR | F13 Lye Priest; D06 Salt-Clan; P12 Salt Pillar; Kathara; U13 Salted Dead; U14 Brine-Embalmer | Mặt nạ sứ trắng, men trắng xương, muối `#EDEAE0`, teal trong suốt; U13/U14: sailcloth `#B8AF9A` + vỏ muối (Cast §5.2) | Muối của hero **xám xanh, sạn, lệch**; nước teal **đục**; không trắng, không đối xứng, không mặt nạ; **không sailcloth, không tạp dề**; **không lọ thủy tinh** (chất liệu của Memory, LD §8.1; QCQ §3.5) |
| EX | F03 tuần tra; F07 Turned Exhumer; F16 Wrecker; F17 Lamplighter cultist; B15/P24; Ignatia; Tamsin | Xem bảng ở §8.3 | Áo nâu sẫm, mũ rộng với miếng vá kem trên chỏm, đèn bên trái trong tầm tay, **không cột đèn**; §8.3 |
| PS | P16 Ice-Mourner; U07 Pyre-Risen; P02 Hush-Herald; Zorya và Frostwives | Mạng băng `#D8E7EF`; xương cháy; mạng và lư hương; Zorya và Frostwives: áo lông, mạng xám tro, đuốc (Cast §6.1) | Mạng **vải tro đục, ấm**; không lư hương; mạng của hero **luôn hất ra sau, để hở mặt**, áo choàng tối đa dài tới gối; cần yêu cầu tương ứng cho brief NPC (§9.2, §12 mục 16) |

**Tách hero khỏi hero (Đề xuất).** Đuôi vải dài từ đầu **chỉ thuộc PS**: khăn BR-A là nút ngắn, FL-B đội mũ vải ôm đầu, không đuôi. Các cặp phải giữ tách khi chọn A/B: OS-A với BR-B, FL-B với EX-B (xem §3).

### 2.6 Tiến triển trang bị

AD §8: trang bị lên cấp bằng **cấu trúc, vật liệu, kỹ nghệ, dấu lịch sử và điểm nhấn có nghĩa**, không bắt buộc thêm glow, cánh, sừng hay chi tiết dày. Voc §21.2 cho mỗi class item ba bậc, như normal, exceptional và elite của Diablo II. Đề xuất ba bậc hình:

| Bậc | Ý | Dấu hình |
|---|---|---|
| **1 · Chắp nhặt** | Đồ tận dụng, làm vội | Dây buộc, gỗ thô, ít đinh, kim loại không đồng bộ |
| **2 · Đồ nghề** | Đúng nghề, do thợ làm | Mối ghép sạch, kim loại rèn, **dấu theo từng nghề** (bảng dưới) |
| **3 · Cổ vật** | Lâu đời, có lịch sử | Khắc tên người chết, khảm bạc, vết sửa cũ được giữ lại bằng chất độn **xám vữa, hắc ín hoặc chì, mờ, không bao giờ vàng** (để không đọc thành Glow; vết sửa vẫn nhìn thấy, là chất độn mờ, không vàng, nhất quán với đề xuất vết sửa hiện rõ của LD §4.1). Dịch vụ **Graving** khắc tên lấy từ Book of Laid Names (ledger §4.3, qua Voc §17.1) |

**Dấu bậc 2 theo nghề (Đề xuất):**

| Nghề | Dấu | Lý do |
|---|---|---|
| PB | Wedge và đinh bạc | Dòng tu của Giáo hội (LD §4.10) |
| FL | Nút thắt một vòng của kỷ luật cũ của Agathe | Không bao giờ là dấu Iron Halo |
| OS | Dấu in bàn tay vữa | Dị giáo, không có dấu Giáo hội |
| BR | Nút vệt triều và dấu vỏ sò | Phép dân gian, không có dấu Giáo hội |
| EX | Miếng vá chỗ dấu mộ mở bị cắt | Dấu bị gỡ **chính là** dấu của nghề |
| PS | Xám tro và chỉ đỏ | Frostwife, không có dấu Giáo hội |

- Không bậc nào tự phát sáng đều. Graven và Hallowed đọc bằng khung loot, âm thanh và beam (AD §11), không bằng vật liệu phát sáng.
- Đạo cụ nhận diện nghề vẫn đọc được ở mọi bậc (AD §8).
- **Nguồn đồ theo hub** (Voc §17.14) gợi vật liệu cho bậc 2–3: Brannoc ở Lychgate (nắp quan tài, đòn khiêng, chùy); Ansel Crane ở Sepulcra (roi xích, sắt nung, nỏ và xẻng từ kho của Exhumer); Old Hovik ở Namakhar (bình nước biển, gậy, đũa); Ilya và Mother Dragana ở Vesnagrad (gậy giàn thiêu, mạng tro, đồ lông); Goulven ở Wrackhaven (hòm thánh tích làm từ đồ vớt, đèn có chụp).

### 2.7 Glow trên thân hero

Glow là tổng điểm hero đổ vào các cây Perfection (Voc §16.5). Năm bậc là **Voc** (một Proposal theo Voc §0.2):

| Glow | Bậc | Trên thân hero (Voc) | Cách vẽ (Đề xuất) |
|---|---|---|---|
| 0–9 | **Unlit** | Không có gì | — |
| 10–24 | **Kindled** | Gân trắng vàng mờ ở cổ tay | Với nghề che tay (PB, EX, FL: cổ tay FL phủ cuff, dây hoặc xích), gân hiện ở cổ và quai hàm |
| 25–44 | **Lit** | Đường nối trắng vàng trên da; phát sáng đều trong tối | Ánh sáng chỉ hiện **trên da**; đường may của đồ và khe giáp **vẫn tối** (không có đường may phát sáng) |
| 45–69 | **Radiant** | Quầng sáng đều; bóng nhạt đi | Ánh sáng **đều, không viền, phủ cả thân**, kèm bóng nhạt đi (Voc §16.5). **Không đĩa, không vòng sau đầu**: đó là hào quang thánh của đời thật (LD §4.10) |
| 70+ | **Seamless** | Hero trông như tượng được thắp sáng từ bên trong | Da đều màu như đá sáng; mọi vết vá trên đồ vẫn còn nhưng mất tương phản |

- **Glow lấp mối nối chứ không tô viền chúng (Đề xuất).** Nó bắt đầu ở nếp da, chạy như mạch vữa sáng, rồi phủ đều. Cần tránh đọc thành kintsugi: kintsugi dùng vàng để tôn vết vỡ, còn ở ASHLAR vàng trắng **xóa** vết vỡ. Vì thế vết sửa của đồ (bậc 3 ở §2.6) dùng chất độn xám mờ, không vàng.
- **Quy tắc "không hào quang" của FL (§5.3) chỉ áp cho trang bị của FL.** Quầng của Glow thuộc về vị thần, không thuộc về đồ của hero, và vẫn không bao giờ là vòng vật thể.
- Hiệu ứng nghề có thêm **viền mảnh trắng vàng đều** khi Glow tăng: thần đang len vào nghề (Voc §16.8).
- Mỗi bậc Glow trên Unlit làm bóng bảo vệ của hero nhỏ đi 10%, tối đa 40% (Voc §16.6). Bóng an toàn luôn phải được hiển thị rõ (LD §8.3).
- **Bản thể hoàn hảo.** Pha cuối của The Unbroken là chính hero, chiến đấu bằng nghề của hero "không tì vết": ánh sáng đều, không mối nối (Voc §17.8). Mỗi nghề ở §4–§9 có một dòng "Bản thể hoàn hảo" mô tả bộ đồ khi mọi mối nối bị xóa. Đây cũng là định nghĩa ngược: những gì hero **không** được có lúc bình thường.

### 2.8 Tài nguyên hiện trên thân

Voc §18.3 cho mỗi nghề một **bình chứa tài nguyên trên UI**, đọc bằng hình dạng chứ không bằng màu. Chỉ Pallbearer có bản trên thân trong Voc (§10.2). Đề xuất cho năm nghề còn lại một **bản vọng trên thân** cùng hình với UI. UI vẫn là nguồn chính; bản trên thân chỉ hỗ trợ, và phải đọc được trong grayscale.

| Nghề | UI (Voc §18.3) | Trên thân |
|---|---|---|
| PB | Khung kiệu, quan tài vữa đắp dần theo từng hàng | **Voc (§10.2):** khung kiệu rỗng trên lưng; quan tài vữa xám xây lên từng hàng như xây gạch; đủ 100 thì nguyên vẹn |
| FL | Chuỗi mắt xích nóng dần theo Contrition; Wound là vết nứt trên quả cầu máu | **Đề xuất:** nóng chỉ hiện ở **nồi hoặc hộp than và các cây sắt nung trong đó**, xa da, thay đổi như chập chờn bất quy tắc, không nhịp. Xích quanh cổ tay hero **luôn nguội**; nó chỉ dùng cho chế độ "Reduce self-harm imagery", khi xích **siết** thay mọi điểm nhấn trả máu (Voc §11.9) |
| OS | Hòm thánh tích tám hốc, mỗi hốc một đốm trắng; vết nứt bò lên theo Strain | **Đề xuất:** hòm trên tay hiện tối đa 8 hốc như UI (đốm trắng lạnh trong hốc); sức chứa Soul có thể vượt 8 (§12 mục 17). Strain hiện trên thế giới quanh hero (Voc §12.9) |
| BR | Bình thủy tinh, nước ở dưới, muối kết từ trên xuống theo Salinity | **Đề xuất:** bình nước biển của hero kết muối từ miệng bình xuống |
| EX | Đèn lồng: mức dầu và khấc bấc | **Voc (§14.9):** đèn là nguồn sáng thật; bán kính sáng chính là mức bấc. **Đề xuất:** chụp đèn mở theo năm nấc (§8.9), bầu dầu bằng kính thấy mức dầu |
| PS | Làn hơi thở trong khí lạnh, đầy lên rồi tan; sáng như than khi đang hát Hymn | **Đề xuất:** hơi thở thấy được khi hát; viền than (Pyre Hymn) hoặc viền sương (Frost Psalm); đầu gậy sáng lên với cường độ chập chờn theo bài hát, **không theo nhịp** |

### 2.9 Prologue: dáng khởi đầu chung

**Voc (§3.4):** trong đoạn bò qua ossuary, hero trần truồng và tay không. Vật đầu tiên bàn tay chộp được là thứ người lạ sẽ với tới, ứng biến từ đồ trong ossuary (Voc §3.4). Đến stage 2, Gennet đưa áo khoác của bà (giáp ngực khởi đầu), mặc ngoài vải liệm (Voc §3.4). Prologue dùng palette Act I về đêm, **không accent** (AD §7). Theo LD §10, màu ấm đầu tiên trong game là đèn của Gennet (Bible §11.2: bà đến với xẻng một tay, đèn một tay).

**Đề xuất trình bày:** concept không vẽ khỏa thân. Stage 1 dùng bóng tối, bụi vữa và vải liệm quấn. Áo của Gennet là một áo choàng len dày màu than bùn, **dài và rộng** (Gennet gầy gò, Bible §10.3), túi sâu, cổ dựng, hai miếng vá lớn ở khuỷu, thắt dây thừng. Cả sáu hero mặc giống nhau, chân trần; chỉ vũ khí ứng biến là khác. Chưa có Osric's Lantern (nhận ở A1-Q2).

| Nghề | Vũ khí ứng biến (Voc §3.4) | Bài học đầu tiên |
|---|---|---|
| PB | Nắp quan tài giật ra từ hốc tường (**Đề xuất:** cao 0,72H, cao và hẹp như nắp class, không bao giờ là quan tài trẻ con, LD §8.5); giá nến sắt làm chùy. **Đề xuất:** thêm một tấm thang khiêng xương ngắn của ossuary (bier-board) buộc dây sau lưng làm khung kiệu ứng biến đầu tiên; vữa xây dần trong đó | Chịu đòn thì sinh Burden |
| FL | Dây kéo chuông, đầu buộc một đoạn xích | Trả máu thì sinh Contrition |
| OS | Móc xương của người giữ mộ | Người chết giúp một tay, và tường nứt một chút |
| BR | Một hũ muối mộ bằng đất nung (không thủy tinh: thủy tinh là chất liệu của Memory, LD §4.1, §8.1) lấy trên kệ ossuary | Làm ướt đất, rồi rắc muối |
| EX | Chiếc đèn có chụp của chính người giữ mộ; xẻng đào mộ gỉ | Sáng hơn thì thấy nhiều hơn, và bị chú ý nhiều hơn |
| PS | Đuốc lễ lấy ở giá nến ossuary | Một câu hát tốn hơi; hơi rồi sẽ về |

- **Vì sao PB có bier-board (Đề xuất):** bài học đầu của PB là "chịu đòn thì sinh Burden" (Voc §3.4) và vertical slice gồm cả Prologue phải chứng minh **Burden đọc được trên thân** (Voc §21.1). Cần một khung ứng biến để vữa có chỗ xây. Phương án khác là nhận khung đầu tiên từ Brannoc ở A1: ghi ở §12 mục 11 để người dùng quyết.
- **Thứ tự ánh sáng (Đề xuất):** đèn của người giữ mộ (EX) và đuốc lễ (PS) được tìm thấy **tắt** ở stage 1 và được thắp từ đèn của Gennet ở stage 2 (LD §10). Trong PROLOGUE_LINEUP (dáng cuối Prologue) chúng có thể có một ngọn lửa nhỏ vẽ phẳng, không quầng sáng.

### 2.10 Chăm sóc nội dung

Theo Voc §18.7–18.8 và LD §8.4–8.5:

- **Tự hại:** quy tắc riêng của Flagellant (§5). Cái giá hiện trên UI, không trên da.
- **Giàn thiêu:** chỉ là lửa tang. Không bao giờ có người sống trên giàn (§9).
- **Người chết:** được đối xử trang nghiêm. *Shoulder the Fallen* là bổn phận, không phải trò đùa. *Pickle* chỉ hài nhẹ, không dùng với người có tên hay trong cảnh tang (Voc §18.8).
- **Trẻ em:** không kỹ năng nào của người chơi chạm vào trẻ em; không trẻ em nào là kẻ địch. Nắp quan tài của PB phải đọc là khiên của hiệp sĩ, không bao giờ là quan tài trẻ con.
- **Tôn giáo thật:** không thánh giá, kinh thật hay thánh thật. Dấu của Giáo hội là **Wedge**, tro vữa trên trán, đinh quan tài bạc và dấu mộ mở của Exhumer (LD §4.10). Không đĩa hay vòng hào quang sau đầu hero.
- **Văn hóa thật:** trộn nhiều nguồn trang trí; không sao chép trang phục thiêng hay nghi lễ của một nền văn hóa thật. Hoarfast là xứ **bịa**, đặc biệt với Pyre-Singer.
- **Quang nhạy cảm:** *Flash*, *The Whole Light*, *Thundersnow*, *Squall* và pyre flare phải có chế độ giảm chớp (Voc §18.7; LD §8.4).
- **Đầu lâu và xương** vẽ thành vài khối lớn trơn, không có gore.

### 2.11 Trạng thái chung của hero (Đề xuất, trừ khi có dẫn nguồn)

Mọi nghề dùng chung các trạng thái sau; cần model và animation riêng cho từng nghề:

| Trạng thái | Cách thể hiện | Nguồn |
|---|---|---|
| Chết | Hero **chìm chậm vào đá** | Voc §18.5 |
| Imprint | Một đường viền vữa xám nơi hero ngã | Voc §5.5 |
| Holding On | Đường viền xám chìm vào phiến đá gần nhất trong 8 s; đồng đội nắm tay hero | Voc §17.9 |
| Rite kneel | Quỳ nghi lễ khi đặt người chết nằm xuống | Voc §8.9, §18.5 |
| Cử chỉ Doubt | Hero trỗi dậy khỏi thứ đang giữ mình | Voc §18.5 |
| Open a Face | Ấn lòng bàn tay lên đá, 2,5 s | Voc §8.9 |
| Memory echo | Bóng hero bằng thủy tinh băng; kiểu viền **khác** ký ức của boss | LD §8.3 |

---

## 3. Bảng so sánh nhanh

| | **PB** Pallbearer | **FL** Flagellant | **OS** Ossuarist | **BR** Brinecaller | **EX** Exhumer | **PS** Pyre-Singer |
|---|---|---|---|---|---|---|
| Vai trò (Voc §9.1) | Cận chiến nặng, phòng thủ | Đấu sĩ cận chiến, rủi ro và hồi phục | Triệu hồi và nguyền | Caster nguyên tố, khống chế | Thợ săn tầm xa, bẫy, ánh sáng | Caster bằng bài hát, hỗ trợ, hình khói |
| Người lạ | Ser Aldwin Rook, ~700 AL | Sister Agathe of the Nails, 880 AL | Mother Grist, 360 AL | Hasmik of the Brine, 840 AL | Ezra Mott, 960 AL (Voc §23 mục 1) | Velimira of the Last Fire, 980 AL |
| Câu hỏi của nghề | Mang bao lâu? | Bỏ ra bao nhiêu của mình? | Mượn người chết bao nhiêu? | Xin muối điều gì? | Để lộ bao nhiêu? | Hát cho ai? |
| Vũ khí | Chùy, búa, rìu, kiếm + khiên; đòn khiêng (2 tay) | Roi xích (chùy xích, xích); dao găm | Đũa xương, liềm, dao găm | Gậy, đũa | Nỏ, xẻng đào mộ | Gậy giàn thiêu, gậy |
| Class item | Nắp quan tài (khiên) | Sắt nung | Hòm thánh tích | Bình nước biển | Đèn có chụp | Mạng tro (mũ) |
| Giáp | Nặng | Nhẹ đến vừa | Nhẹ | Nhẹ | Vừa: áo vải dầu, mũ rộng vành | Nhẹ đến vừa: lông, len |
| **Bất biến A và B** | Khối thấp nặng + khung kiệu quan tài hẹp sau lưng + nắp quan tài đọc được | Thân hẹp nhanh + vòng xích + nồi/hộp than ở trái thắt lưng + dây mười nút | Khối tối ở vai/đầu + một khối sáng + hòm thánh tích ở tay trái | Muối xám xanh lệch phải trên nền rong tối | Mũ rộng vành + đèn có chụp bên trái + xẻng lưỡi dài | Mạng tro hất ra sau + gậy giàn thiêu |
| Màu chủ (Đề xuất) | Thiếc, sồi nhạt phong hóa, xám vữa | Nâu đỏ sẫm, vải lanh | Chàm sẫm, xám mực, tạp dề hoặc nỉ sáng | Rong, muối xám xanh, xám biển | Nâu sẫm vải dầu, mũ dạ, khăn lanh | Mạng tro, muội, lông nâu |
| Hướng A | Hiệp sĩ nắp quan tài | Kẻ sám hối đường trường | Bà đỡ của Tường | Phù thủy biển chết | Thợ săn đèn móc | Ca nữ giàn thiêu |
| Hướng B | Người khiêng đòn | Kẻ mang xích | Người giữ nợ (Keeper of Debts) | Người lội bãi triều (Tide-flat Wader) | Người đào mộ đèn hông | Người hát tiễn đường xa |
| Thân trên sheet (v1, v2; v3 xem §1.4) | Thân 1 (ALT Thân 2) | Thân 2 (ALT Thân 1) | Thân 2 (ALT Thân 1) | Thân 2 (ALT Thân 1) | Thân 1 (ALT Thân 2) | Thân 2 (ALT Thân 1) |

**Thứ tự sản xuất** theo Voc §9.3: PB (vertical slice) → EX → BR → PS → FL → OS. Concept đi theo cùng thứ tự.

**Ghi chú ghép A/B (Đề xuất).** Một số cặp đã được tách và **phải giữ tách** khi người dùng chọn hướng; nếu chọn cả hai cùng lúc thì cần xem lại:

- **OS-A với BR-B:** cả hai từng cùng là Thân 2 với tạp dề dài nhiều túi, khối dưới rộng hình chuông, mũ trùm, vật chứa ở tay trái và đũa ngắn ở tay phải. Nay OS-A giữ tạp dề dài và thân dưới chuông; BR-B là áo chần ngắn, quần xắn và quấn lội nước, không tạp dề.
- **FL-B với EX-B:** cả hai từng cùng một nền (áo chần tới giữa đùi, mũ trùm, quấn cẳng chân, đồ đeo lưng). Nay FL-B là áo ghi-lê chần sát hông, **không mũ trùm**, sắt nung ở hộp bên trái thắt lưng; EX-B vẫn là áo vải dầu chần tới giữa đùi, mũ rộng trùm mũ trùm đầu, nỏ đeo lưng.
- **Đuôi vải dài từ đầu** chỉ còn ở PS (A và B); BR-A và FL-B không có.
- Trong **cùng một nhóm lab** (TOPDOWN_A/B, §11.1) nên so cả sáu hero của một chữ cái cạnh nhau trước khi trộn A với B.

---

## 4. PB · Pallbearer — "Lift with the legs. And with the heart."

### 4.1 Tinh thần

Lời thề của Order of the Pall biến thành một cách đánh: hiệp sĩ nặng mang khiên nắp quan tài, càng gánh nặng càng mạnh (Voc §10.1). Câu hỏi của nghề là câu Ser Hamon trả lời trên Long Sands: *"It's never the weight. It's the not putting it down."* Hình phải kể được **sức nặng**, và **việc đặt nó xuống**.

### 4.2 Neo nguồn

- **Dòng tu (Canon, Bible §8.3):** lập năm 240 AL để mang người chết từ hoang dã về ossuary. Hiệp sĩ cõng quan tài trên lưng; khiên là nắp quan tài đóng đinh bạc; mỗi hiệp sĩ được chôn trong chiếc quan tài mình mang. Lời thề: *"No one is laid alone."* Đến năm 1000 AL dòng tu nghèo, cổ lỗ, và là phần duy nhất của Giáo hội mà nông dân còn thương.
- **Người lạ:** Ser Aldwin Rook, ~700 AL (Canon: tên, niên đại). Phần đời ngắn là **Voc** (Voc §3.3: "the short lives are Proposals"): hiệp sĩ trên Pilgrim Road, đã mang 211 người chết về nhà, được chôn trong chiếc quan tài cuối cùng ông mang.
- **Đồ nghề (Voc §10.1, §17.6):** giáp nặng; nắp quan tài là khiên chặn cao nhất game; chùy, búa, rìu, kiếm một tay; hoặc **đòn khiêng** hai tay, cây đòn dài dòng tu dùng để khiêng người chết. Đinh quan tài bạc nhận ở A5-Q5 được **đóng lên nắp** (Voc §17.6).
- **Trên thân (Voc §10.2):** khung kiệu rỗng trên lưng; Burden tăng thì quan tài vữa xám xây dần trong khung, từng hàng; đủ 100 thì nguyên vẹn. Bible §8.3 chỉ nói hiệp sĩ "cõng quan tài trên lưng"; khung kiệu và quan tài vữa là thiết kế của **Voc**. Đồng đội đọc được trạng thái chỉ bằng một cái nhìn.
- **Kỹ năng gợi hình:** chuông tang cầm tay (*The Passing Bell*); tấm vải khâu sắt của dòng tu (*Iron Pall*); lồng sắt chắn mộ (*Mortsafe*, Habit); cổng có mái (*Lychgate*, đặt nắp xuống đất); *Nails of the Pall* (nhổ năm đinh bạc khỏi nắp); *Homeward Lid*; *Shoulder the Fallen*; *Bier of Many* (Voc §10.4).
- **Trình bày (Voc §10.9):** mọi chuyển động mang sức nặng; Burden càng cao càng ngả người vào từng bước; ném bằng cả thân. Ánh sáng chỉ là lóe bạc và tia lửa sắt. Âm thanh: khung kiệu kẽo kẹt, trầm dần khi quan tài vữa đầy lên; đinh ngân; chuông tang lên dây xa hẳn chuông của Devotion.

### 4.3 Hình khối và motif (Đề xuất)

- **Motif "lục giác quan tài":** đường viền quan tài sáu cạnh là hình gốc của nắp, khung kiệu, khóa thắt lưng và tấm che mặt. **Đường viền phải đọc là một quan tài dựng đứng:** đầu hẹp ở **trên**, rộng nhất khoảng một phần tư từ trên xuống, thu dần về chân hẹp ở **dưới**. Không được đọc thành cái thang (pilot đã vẽ thành thang; xem §11.1).
- **Motif Wedge:** đinh bạc trên nắp xếp thành hình nêm chìa khóa vòm, dấu hợp lệ của Giáo hội (LD §4.10).
- **Silhouette:** tam giác thấp và rộng, trọng tâm dưới thấp. Khung kiệu **hẹp, nằm trong đường vai**, nhô khoảng **0,22H** trên đỉnh đầu. Vai **không** được phóng to quá mức (AD §8).
- **Nắp quan tài là nắp tạo hình (stylised):** cao 0,72H, rộng 0,28H (tỷ lệ ~0,39), lục giác quan tài. Không bao giờ được đọc như khiên diều hay quan tài trẻ con (LD §8.5).
- **Burden đọc như xây tường:** hàng vữa trong khung xếp lệch mạch như gạch, khớp với ngôn ngữ bức tường của cây kỹ năng (Voc §18.1).

### 4.4 Bảng màu (Đề xuất)

| Vai trò | Màu | L\* | Ghi chú |
|---|---|---|---|
| Giáp tấm (A) | Thiếc bạc màu `#6E7276` | 48 | Trung tính, sáng hơn hẳn giáp đen của Pall-Wight |
| Khung kiệu (A: thanh sồi; B: thanh sồi bó đai sắt), nắp quan tài | Sồi nhạt phong hóa `#C2AE88` | 72 | **Khối sáng** của silhouette ở cả A và B, tách khỏi vữa 21 L\* |
| Quan tài vữa | Xám vữa `#7E796F` | 51 | Vữa xám ấm (Bible §4.6), tối hơn khung |
| Vải phủ (pall) | Nâu đất sẫm `#3B302A` | 21 | **Khối tối**; không đen tuyền |
| Đai sắt bó khung (B), găng sắt | Sắt `#4A4B4E` | 32 | Dùng lại swatch sắt của EX; chỉ là đai mảnh bó thanh sồi, không phải khối sáng |
| Áo giáp vải tán đinh (B) | Len nâu xám sẫm `#4D4540` | 30 | Khối tối thứ hai của B (cùng vải phủ pall 21); không đen tuyền, sáng hơn giáp đen `#1F1D22` của Pall-Wight |
| Đinh bạc | `#C8CBCB` | 81 | Chỉ là điểm nhỏ |
| Da thuộc, dây đai | `#5A4332` | 30 | Da thuộc (leather), không phải màu da người |

### 4.5 Hướng A — Hiệp sĩ nắp quan tài

- **Ý:** hiệp sĩ đúng nghĩa của dòng tu; khiên nắp quan tài và chùy một tay.
- **Silhouette:** tam giác thấp, chân mở rộng. Nắp quan tài cao **0,72H**, rộng **0,28H** ở tay trái. Khung kiệu gỗ sồi dựng thẳng trên lưng: cao **0,80H**, từ **0,42H** lên tới **1,22H**; rộng **0,24H** chỗ rộng nhất (khoảng một phần tư từ trên xuống), **0,16H** ở chân; dày 0,10H.
- **Giáp:** giáp ngực và giáp vai vừa phải, váy xích; khoác ngoài là **áo phủ dài khâu sắt**, có một dải vòng sắt to khâu ngang gấu áo. Mũ sắt hở mặt hoặc mũ xích trùm; mặt lộ. Ủng nặng.
- **Đạo cụ:** chùy có cánh ở tay phải, dài 0,42H. Chuông tang sắt nhỏ treo hông phải. Nắp làm bằng gỗ sồi viền sắt, hàng đinh bạc quanh mép, ở giữa có một hình Wedge bằng đinh. **Osric's Lantern** (§2.4) treo từ góc dưới bên phải của khung kiệu.
- **Khung kiệu:** các thanh gỗ sồi đẽo vuông, chốt sắt, dựng thành viền quan tài hẹp; buộc vào người bằng hai dây da to qua vai. Nửa trên để hở, **không nấc hay thanh ngang** (thanh ngang làm pilot đọc thành thang). Trên sheet: **vữa xây tới nửa khung** (khoảng 50 Burden, tới 0,82H), sáu hàng.
- **Tay:** trái găng sắt rộng, đinh bạc trên tấm khớp ngón; phải găng da trơn (nhẫn bị che, §2.2).
- **Mối nối đọc được:** một mảng vá lớn bằng vải khác màu trên áo phủ; một thanh khung được nẹp bằng dây sắt.

### 4.6 Hướng B — Người khiêng đòn

- **Ý:** người khiêng tang trên đường hành hương; đòn khiêng hai tay và khung sắt kiểu lồng chắn mộ, nhưng **vẫn mang nắp quan tài** (Bible §8.3; AD §8: nắp phải đọc được trong silhouette).
- **Silhouette:** nhiều đường ngang và chéo hơn A. Đòn khiêng dài **1,3H**, đầu bịt sắt (chỗ cầm và vòng sắt để họa sĩ quyết, không vẽ chi tiết trên sheet). Trên sheet, đòn được **dựng đứng chống đất cạnh chân phải**, **một mình tay phải** cầm; tay trái buông thõng; ở góc nhìn LEFT đòn bị thân che một phần. Khung kiệu là **thanh sồi nhạt phong hóa bó đai sắt uốn** giống lồng mortsafe, đầu hẹp như quan tài cổ, **cùng cỡ với A** (0,80H từ 0,42H lên 1,22H; rộng 0,24H ở chỗ rộng nhất, 0,16H ở chân).
- **Nắp quan tài:** 0,72H × 0,28H, **cất trên ba móc sắt dọc sườn TRÁI của khung** (dựng đứng, đứng mép, trong chiều cao khung), tháo xuống khi dùng kỹ năng nắp (*Nails of the Pall*, *Homeward Lid*, *Lychgate*). Đinh bạc quanh mép, Wedge ở mặt nắp.
- **Giáp:** áo giáp vải tán đinh bằng len nâu xám sẫm `#4D4540` (tấm thép giấu dưới vải) ngoài áo chần bông; dây đeo da to; **cuộn dây thừng đeo chéo ngực như đai đạn** (vết dây hằn của Aldwin), từ vai trái xuống sườn phải. Mũ trùm bằng vải pall nối thành khăn vai. Ủng nặng.
- **Đạo cụ:** chuông tang (0,08H) ở **hông phải**, cầm tay rung được. **Osric's Lantern** từ góc dưới bên phải của khung.
- **Khung kiệu:** vữa xây tới nửa khung (0,82H), nhìn thấy giữa các thanh sồi và đai sắt.
- **Tay:** trái găng sắt rộng, đinh bạc, buông thõng; phải găng da trơn, một mình cầm đòn.
- **Mối nối đọc được:** một miếng vá lớn trên áo trùm-vai (mối nối đọc được duy nhất của B).
- **Khác A ở:** đòn khiêng (hai tay khi dùng, trên sheet dựng cạnh chân phải bằng một tay) thay chùy; nắp cất bên sườn khung thay vì trên tay; khung sồi bó đai sắt thay khung gỗ thuần; áo giáp vải thay áo phủ; dây thừng đeo chéo ngực.

### 4.7 Đạo cụ và kích thước (Đề xuất)

| Vật | Kích thước | Ghi chú |
|---|---|---|
| Khung kiệu (A và B) | Cao 0,80H (0,42H → 1,22H); rộng 0,24H chỗ rộng nhất, 0,16H ở chân; dày 0,10H | Nằm trong đường vai; viền quan tài dựng đứng, đầu hẹp ở trên |
| Nắp quan tài (A và B) | Cao 0,72H; rộng 0,28H | Lục giác quan tài, tạo hình. B: cất ở sườn trái khung, đứng mép |
| Chùy (A) | 0,42H | — |
| Đòn khiêng (B) | 1,3H | Đầu dưới chạm đất cạnh chân phải |
| Chuông tang | 0,08H | A hông phải; B hông phải |
| Osric's Lantern | 0,12H | Góc dưới bên phải khung |

### 4.8 Trạng thái và pose

- **Burden 0 / 50 / 100:** khung rỗng thấy xuyên qua / nửa khung là hàng vữa / quan tài vữa nguyên vẹn. Thân ngả dần về trước theo Burden (Voc §10.9).
- **Pose đặc trưng** (cũng là pose cho The Taxidermist, Voc §17.8). Mỗi nghề có **ba** pose ở đợt 2 (§11.2):
  1. *Lid Slam*: nắp đập xuống đất, gối khuỵu.
  2. *Shoulder the Fallen*: xác kẻ địch được vác lên **vai phải** và vắt **ra phía trước ngực**, tay phải giữ, **không bao giờ buông xuống sau lưng**, để khung kiệu hẹp không bị va chạm (Voc §10.4). Bổn phận, không phải trò đùa.
  3. *Set It Down*: thả hết gánh nặng, thân bật thẳng lại.
- **Pose bổ sung (Đề xuất):** *Bier of Many* (Habit): tới ba thân nằm **ngang trên đỉnh khung**, như một cái kiệu (Voc §10.4); *Holding On*: Pallbearer nâng người ngã **ở phía trước** (Voc §17.9).
- **Animation riêng** (Voc §18.5): cõng một thân người.

### 4.9 Hiệu ứng, âm thanh, tiến triển

- **VFX:** lóe bạc ở đinh, tia lửa sắt, bụi vữa. Đòn Grave dùng bụi vữa xám và lạnh, không phát sáng đều.
- **Tiến triển nắp:** bậc 1 là nắp gỡ từ hốc tường, mép gãy; bậc 2 là nắp gỗ sồi viền sắt của Brannoc, đinh xếp hình Wedge; bậc 3 là nắp cổ của dòng tu, **khắc tên những người đã được mang về** (Đề xuất, nối với passive *Two Hundred and Eleven*), khảm bạc. Đinh bạc của A5-Q5 luôn hiện trên nắp.
- **Bản thể hoàn hảo:** khung chứa một quan tài trắng liền khối, không có hàng gạch; nắp phẳng không đầu đinh; giáp không đinh tán; mọi vết vá biến mất.

### 4.10 Tránh

- Giáp đen toàn thân, quan tài đóng kín trên lưng: đó là Pall-Wight (U06) và Hamon.
- Che hình quan tài bằng trang trí; dùng vai khổng lồ để tạo cảm giác nặng (AD §8).
- Khung đọc thành cái thang; nắp đọc thành quan tài trẻ con hay khiên diều.
- Vàng thánh, thập tự, khiên tròn kiểu hiệp sĩ thánh của Diablo.

---

## 5. FL · Flagellant — "Pain is the only prayer that never lies."

### 5.1 Tinh thần

Đấu sĩ dùng roi xích, chùy xích và sắt nung, biến vết thương của chính mình thành sức mạnh: kỷ luật của Kneeler nhưng **tự chọn và không bao giờ chắc chắn** (Voc §11.1). Cung bậc của nghề đi từ đau đớn như lời cầu, sang gánh nỗi đau của người khác, đến đặt roi xuống bàn thờ. **Hình phải diễn sự lựa chọn và con người, không diễn vết thương.**

### 5.2 Neo nguồn

- **Người lạ:** Sister Agathe of the Nails, 880 AL (Canon: tên, niên đại). Phần đời ngắn là **Voc** (Voc §3.3): nữ tu của một kỷ luật cổ, đi khắp các nẻo đường tự đánh mình vì tội của người khác. Dòng của bà về sau cứng lại thành Order of the Iron Halo: đây là **Voc** (Voc §23 mục 15, Proposal); Canon chỉ nói bà kinh hoàng khi thấy dòng của mình biến thành thứ gì (Bible §13.3; Voc §11.8).
- **Đồ nghề** (Voc §11.1): roi xích là vũ khí riêng của nghề, có hai loại: **chùy xích** (Heft) và **xích** (Deftness); thêm dao găm. Class item là **sắt nung**, cầm tay trái, giữ nóng trong **một nồi than nhỏ ở thắt lưng**. Giáp nhẹ đến vừa.
- **Kỹ năng gợi hình:** *Chainwhirl* (xoay xích), *Martyr's Step* (lướt qua đám đông), *Kneel and Rise* (quỳ **tự nguyện** rồi đứng dậy), *Ash on the Brow* (quệt tro xám lên trán như ngày Mortar Day), *The Vigil* (quỳ canh), *The Open Hand* (đặt roi xuống).
- **Quy tắc nội dung** (Voc §11.9; LD §8.5): cái giá hiện **trên UI, không trên da**: vết nứt lan trên quả cầu máu và tia lửa nơi xích bật lại. **Không máu của hero, không decal vết thương, không cận cảnh, và không có thứ nóng áp vào thân hero** (xích nóng quanh cổ tay hay sắt nung trên lưng đều là hình tự hại). Dấu sắt nung chỉ hiện trên **kẻ địch**, thành ký hiệu phát sáng, không bao giờ áp lên da hero trước camera. Chế độ "Reduce self-harm imagery" thay mọi điểm nhấn trả máu bằng xích **siết** quanh cổ tay.
- **Trình bày:** âm thanh là mắt xích, hơi thở, tiếng xèo của sắt nóng. Ánh sáng người của nghề là đỏ than, luôn chớp, **chập chờn bất quy tắc** chứ không phập phồng theo nhịp (LD §5.1 dành nhịp đó cho Discarded).

### 5.3 Hình khối và motif (Đề xuất)

- **Motif nút thắt và vòng xích:** dây thắt nút (cổ tay, thắt lưng), vòng xích; đường cong chữ S của xích khi vung.
- **Dây mười nút (bất biến A và B):** đầu dây thắt lưng buông dài có **mười nút**, gợi passive *Counting Knots* và bài đồng dao đếm của Act I. A: dây thắt lưng; B: đuôi dải sash dài.
- **Ký hiệu dấu sắt nung:** một **nút thắt một vòng**. Không dùng Wedge của Giáo hội, không dùng hình hào quang.
- **Silhouette:** thân hẹp, đứng thẳng. Vạt áo và xích văng rộng ra khi xoay (*Chainwhirl* đọc thành vòng). **Không hào quang dưới mọi dạng trên trang bị của FL** (đĩa, vòng, quầng sau đầu).
- **Nồi hoặc hộp than ở BÊN TRÁI thắt lưng**, tay trái rút sắt từ đó. Không bao giờ trên lưng: nồi than khói trên lưng là Kiln-Shaman D02.
- **"Dấu chịu đựng" thành mảng** (AD §8): dây quấn, vải băng, nút thắt, chỗ vá. **Không** vết thương, **không** lưng trần.

### 5.4 Bảng màu (Đề xuất)

| Vai trò | Màu | L\* | Ghi chú |
|---|---|---|---|
| Áo, áo giáp chần | Nâu đỏ sẫm `#5B2B24` | 24 | **Khối tối**. Không đen như F06/F13, không bao bố như F04. Cùng value với than bùn Act I: tách nhờ vải quấn sáng và viền sáng |
| Vải quấn tay, cẳng chân, mũ vải | Lanh mộc `#CBBFA6` | 78 | **Khối sáng**; làm tay chân nổi lên khi chuyển động |
| Cổ tay áo | Đen `#1E1B1C` | 10 | Chỉ một mảng nhỏ |
| Sắt | Sắt đen `#45464A` | 30 | Xích, nồi, hộp than |
| Tro | Xám tro `#9A968F` | 62 | Quệt trán (tùy chọn) |
| Than | `#D0532A` | 52 | **Chỉ là ánh sáng**, luôn chớp; chỉ ở nồi/hộp than và sắt trong đó |

### 5.5 Hướng A — Kẻ sám hối đường trường

- **Ý:** nữ tu đi đường của kỷ luật cổ; chùy xích và sắt nung.
- **Silhouette:** cột hẹp. Áo dài xẻ thành vạt trước và vạt sau để bước dài; vạt văng rộng khi xoay. Áo choàng vai ngắn, mũ trùm hạ xuống. Khăn trùm đầu bằng lanh ngắn; mặt lộ.
- **Lớp giáp:** áo yếm da dày ngoài áo dài (giáp nhẹ đến vừa); tay và cẳng chân quấn vải lanh **gọn, to bản**, là băng đi đường chứ không phải băng vết thương. Cẳng chân quấn vải và ủng thấp.
- **Đạo cụ:** **chùy xích** tay phải (cán gỗ dài 0,28H, hai sợi xích dài 0,22H, đầu sắt có nút). Sắt nung tay trái. **Nồi than nhỏ có nắp ở hông TRÁI** (sắt nung trong tay trái không phải vắt ngang người), hai cán sắt nung nhô lên qua khe trên nắp đóng. Osric's Lantern sau hông phải.
- **Tay trái:** cổ tay áo đen, dây nút quấn hai vòng, thêm vài mắt xích — tất cả **nguội**.
- **Thắt lưng:** dây thắt nút, đầu buông dài với mười nút to.
- **Mối nối đọc được:** một mảng vá lớn trên vạt áo; vải quấn thắt nút rõ.

### 5.6 Hướng B — Kẻ mang xích

- **Ý:** người sám hối kiểu đấu sĩ; xích dài (Deftness), gọn và nhanh.
- **Silhouette:** gọn, vai rõ hơn A. **Áo ghi-lê chần sát hông, không tay** (giáp vừa) mặc ngoài áo lanh dài tay; **dải sash vải dài** thắt lưng, đuôi sash là dây **mười nút**; quần rộng quấn vải ở cẳng chân, ủng thấp. **Không mũ trùm**: chỉ một mũ vải lanh ôm đầu, **không đuôi**. Tránh dáng áo tu kèm hạt.
- **Đạo cụ:** **xích dài** quấn quanh hai cẳng tay như bao tay (đầu xích tháo ra từ tay phải để quất), thêm một vòng xích chéo ngực; xích **nguội**. **Hộp than sắt có nắp ở BÊN TRÁI thắt lưng**, các cây sắt nung nhô **cán hướng lên** qua khe trên nắp đóng; tay trái rút sắt từ đó. Không sắt trên lưng, không hộp sau lưng. Osric's Lantern sau hông phải.
- **Tay trái:** cổ tay áo đen dưới xích bao, dây nút quanh cổ tay.
- **Mối nối đọc được:** một mảng vá lớn trên áo ghi-lê; vải quấn cẳng chân thắt nút rõ.
- **Tránh lẫn:** xích chỉ quấn **cẳng tay** và một vòng chéo ngực, không quấn quanh giáp như Halo Knight (F08); không lư hương đung đưa như Censer-Bearer (F06); không đồ trên lưng như D02; không mũ trùm, áo chần dài, mũ rộng như EX-B.
- **Khác A ở:** ghi-lê sát hông thay áo dài; xích quấn tay thay chùy cầm tay; hộp than thay nồi than, cán sắt hướng lên; mũ vải ôm đầu thay khăn lanh; sash mười nút thay dây thắt lưng.

### 5.7 Đạo cụ và kích thước (Đề xuất)

| Vật | Kích thước |
|---|---|
| Chùy xích A | Cán 0,28H + xích 0,22H |
| Xích B | Khoảng 0,9H khi tháo hết |
| Sắt nung | 0,35H |
| Nồi than A (hông trái) | Cao 0,12H |
| Hộp than B (bên trái thắt lưng) | 0,16H × 0,10H |
| Đầu dây mười nút | Buông 0,35H |
| Osric's Lantern | 0,12H |

### 5.8 Trạng thái và pose

- **Contrition thấp / vừa / cao:** nồi hoặc hộp than và các cây sắt trong đó chuyển từ sắt xỉn sang đỏ than, **chập chờn bất quy tắc** (Đề xuất). Xích quanh cổ tay luôn nguội và chỉ siết trong chế độ giảm tự hại. Không có thay đổi nào trên da.
- **Pose đặc trưng** (ba pose ở đợt 2):
  1. *Chainwhirl*: xích thành vòng quanh người, vạt áo bung.
  2. *Kneel and Rise*: **tự nguyện** = **một gối** chạm đất, cây chùy/xích cắm xuống làm trụ, **cằm ngẩng**, đứng dậy nhanh. Khác hẳn quỳ cưỡng ép (KNEEL của Cassian, Voc §7.3; rite kneel; F04 Kneeler): **hai gối**, đầu bị ép cúi, ánh sáng Perfection đều và không chớp.
  3. *Brand of Contrition*: đẩy sắt nung về **phía kẻ địch**.
- **Animation riêng** (Voc §18.5): quỳ và đứng dậy.

### 5.9 Hiệu ứng, âm thanh, tiến triển

- **VFX:** đỏ than chớp bất quy tắc; tia lửa ở chỗ xích bật lại; dấu nút thắt phát sáng trên kẻ địch.
- **Tiến triển sắt nung:** bậc 1 là thanh sắt cời lò uốn đầu; bậc 2 là sắt rèn ở Sepulcra có cán bọc da; bậc 3 là sắt cổ của kỷ luật Agathe, cán quấn dây nút cũ.
- **Bản thể hoàn hảo:** xích thành **một vòng liền không mắt**; nồi than cháy một ngọn trắng đứng yên; dây thắt nút trơn, không còn nút; áo không vá.

### 5.10 Tránh

- Hào quang sắt, áo bao bố, áo choàng trắng, lư hương, móc xuyên thân (F04, F08, F06, P09); nồi than khói sau lưng (D02).
- Gore, lưng trần có vết roi, decal máu, cận cảnh vết thương; xích hay sắt nóng áp vào da (Voc §11.9).
- Áo cà sa, tràng hạt kiểu võ tăng; bộ giáp gai sám hối.

---

## 6. OS · Ossuarist — "Only borrowing, love. We'll put them back."

### 6.1 Tinh thần

Phù thủy xương mượn linh hồn từ Tường để chiến đấu: bị cấm, và mạnh (Voc §12.1). **"Class mà câu chuyện tranh luận cùng."** Nghề phải "có cảm giác bị cấm mà không có cảm giác bị phạt" (Bible §21.4 qua Voc §12.1). Hình phải đọc ra **một người cho vay cẩn thận**: mượn có sổ sách, và luôn định trả.

### 6.2 Neo nguồn

- **Người lạ:** Mother Grist, 360 AL, phù thủy xương dị giáo, một trong số ít người biết sự thật về Tường (Canon, Bible §13.2). Phần đời ngắn là **Voc** (Voc §3.3, §12.6): ở Dolmoor, mượn người chết để bảo vệ người sống và luôn định trả lại; có một linh hồn bà mượn mà chưa bao giờ trả.
- **Đồ nghề** (Voc §12.1): **đũa xương** (đốt xương ngón kết bằng dây thành một cây đũa), liềm, dao găm. Class item là **hòm thánh tích**: hộp cầm tay trái bằng xương và bạc, giữ các linh hồn mượn. Giáp nhẹ.
- **Linh hồn mượn** (Voc §12.9): hình xám trắng mờ, giữa ngực có một **điểm trắng đứng yên**: ánh của Tường, lạnh, không chớp, không ấm. Servant mang cùng điểm ấy trong ngực. Khi *Return*, điểm ấy chìm vào đất cùng một hơi thở ra.
- **Strain** hiện trên thế giới: vết nứt bò trên sàn và tường quanh hero; tới 60 thì tường rỉ vữa; tiếng thì thầm của Tường to dần. **Breach** là một mặt Tường rách ra, đầu lâu và bàn tay tách sang hai bên như tấm màn, giống cổng về thị trấn nhưng sai (Voc §12.9).
- **Kỹ năng gợi hình:** *Borrow* (kéo hồn lên từ đất dưới chân kẻ địch), *Ossuary Wall* (hàng rào đầu lâu), *Mortar Lance* (giáo vữa ướt và xương vụn), *Hands Through the Mortar*, *A Face of the Wall*; cây *The Ledger* với các lời nguyền mang tên món nợ (Voc §12.5).
- **Trong truyện:** Masons nghi ngờ; Gennet coi hero như đồng nghiệp và đề nghị ghi các linh hồn mượn vào Book of Laid Names "để có người nhớ mà trả lại" (Voc §12.8).

### 6.3 Hình khối và motif (Đề xuất)

- **Motif hốc và vạch đếm:** hốc vòm (hòm thánh tích, ossuary) và vạch khắc đếm nợ (que đếm, vạch khắc). Nghề này là **kế toán của người chết**.
- **Silhouette:** một khối tối tròn hoặc cao ở vai và đầu, một khối sáng lớn ở thân. Dáng hơi nghiêng về trước, lòng bàn tay úp xuống: dáng nghi lễ, gắn với thao tác cụ thể (AD §8).
- **Xương có chọn lọc:** xương chỉ ở **đũa, nhẫn và hòm**. Không giáp xương, không đầu lâu trên quần áo (AD §8 tránh "necromancer chung chung").
- **Hòm thánh tích không bao giờ giống sổ hay lọ:** không sổ cái, không thẻ số (Gennet cầm sổ, U11 Scribe-Shade cầm bút), không lọ (F15).
- **Không xanh lá phát sáng.** Ánh duy nhất là điểm trắng lạnh của linh hồn.

### 6.4 Bảng màu (Đề xuất)

| Vai trò | Màu | L\* | Ghi chú |
|---|---|---|---|
| Khăn vai, mũ trùm | Chàm sẫm như mực `#2E3140` | 21 | **Khối tối**. Mực trong nếp tay của Grist. Không ô liu: ô liu chìm vào nền Dolmoor |
| Áo dài, áo khoác | Xám mực `#3B3B42` | 25 | Thay cho tông than bùn: tông than bùn trùng với áo của EX |
| Tạp dề (A) | Lanh xám `#A79F8E` | 66 | **Khối sáng** của A, dải sáng giữa thân |
| Áo choàng vai nỉ (B) | Nỉ mộc chưa nhuộm `#BDB4A2` | 74 | **Khối sáng** của B |
| Xương | Ngà `#D6CBB2` | 82 | Đũa, nhẫn, mặt hòm |
| Bạc | Bạc xỉn `#9C9C94` | 64 | Góc hòm, dây đũa, đai hòm |
| Vết vữa | `#8C877D` | 56 | Vài mảng nhỏ ở tay và gấu áo |
| Linh hồn | Trắng lạnh `#EEF3F6` | 96 | **Chỉ là điểm sáng**, đứng yên |

### 6.5 Hướng A — Bà đỡ của Tường

- **Ý:** bà mụ làng quê, người đỡ cả sinh lẫn tử; cho vay nhẹ nhàng.
- **Silhouette:** khăn len chàm dày quấn vai, trùm lên đầu thành mũ trùm; khối trên tròn như vòm. Tạp dề lanh dài nhiều túi sâu ngoài áo dài xám mực; thân dưới hình chuông. Ủng mềm.
- **Đạo cụ:** **hòm thánh tích hình ngôi nhà nhỏ** (mái dốc), ghép từ các tấm xương, bọc góc bạc, mặt trước có **tám hốc tròn chia hai hàng bốn**, treo bằng xích ngắn ở tay trái. **Đũa xương** tay phải, dài 0,32H, các đốt xương buộc dây bạc. **Liềm** móc sau thắt lưng bên trái. Một **bó que đếm** (que gỗ khắc vạch) buộc ở hông trái: các món nợ của *The Ledger*. Osric's Lantern sau hông phải.
- **Tay trái:** nhẫn xương ngón; một mảng vết vữa trên mu bàn tay.
- **Trên sheet:** tám hốc **để trống và tối**. Đốm sáng linh hồn là VFX, xem ở sheet trạng thái.
- **Mối nối đọc được:** một miếng vá lớn trên khăn; tạp dề có một vệt vữa to.

### 6.6 Hướng B — Người giữ nợ (Keeper of Debts)

- **Ý:** người giữ nợ của Tường; hòm thánh tích là một cái trống xương mang món nợ khắc trên đai bạc.
- **Silhouette:** cao và hẹp. **Áo khoác dài xám mực** tới mắt cá, cổ đứng cao, mũ trùm chàm ôm đầu; một **áo choàng vai ngắn bằng nỉ mộc chưa nhuộm** (khối sáng). Thân dưới thẳng như cột, không loe như A, không tạp dề.
- **Đạo cụ:** **hòm thánh tích là một cái TRỐNG tròn** ghép từ các tấm xương, siết bằng các đai bạc, **tám hốc tròn quanh thân trống** (từ một phía thấy khoảng bốn), nắp vòm có vòng ở đỉnh; treo bằng xích ngắn từ tay trái. Trên các đai bạc có **vạch đếm khắc** (món nợ). Không có hình sổ, không bìa, không thẻ số. **Đũa xương dài** 0,42H, đầu xòe như nan quạt các đốt ngón. **Liềm đeo hông trái dưới áo.** Osric's Lantern sau hông phải.
- **Mối nối đọc được:** một mảng vữa xám to trên áo choàng nỉ; một miếng vá lớn ở vạt áo khoác.
- **Khác A ở:** cột thẳng thay chuông tròn; hòm hình trống thay hòm hình nhà; đũa dài xòe thay đũa ngắn; không tạp dề; áo choàng nỉ sáng thay tạp dề sáng.
- **Tránh lẫn:** không kính một mắt, không lọ mẫu vật (F15 Remembrancer); không sổ, không bút lông, không mực đen toàn thân (Gennet, U11); không xẻng, không tẩu (Gennet); không tạp dề, không thân dưới loe (BR-B/OS-A).

### 6.7 Đạo cụ và kích thước (Đề xuất)

| Vật | Kích thước |
|---|---|
| Hòm A | Cao 0,16H × rộng 0,12H; xích 0,12H |
| Hòm B (trống) | Thân cao 0,18H × đường kính 0,15H; cả nắp vòm và vòng 0,22H; xích 0,10H |
| Đũa A / B | 0,32H / 0,42H |
| Liềm | 0,28H |
| Bó que đếm (A) | 0,15H |
| Osric's Lantern | 0,12H |

### 6.8 Trạng thái và pose

- **Soul 0 / 4 / 8:** số hốc có điểm trắng lạnh (Đề xuất; hòm hiển thị tối đa 8 hốc như UI, sức chứa thật có thể vượt 8). **Strain 30 / 60 / 90:** vết nứt quanh chân lan rộng; tới 60 thì tường gần đó rỉ vữa (Voc §12.9).
- **Willing và Frightened** (Voc §12.2 chỉ đặt quy tắc hai trạng thái): servant Willing đứng thẳng, bình thản; servant Frightened co rúm. **Hai dáng này là Đề xuất.** Cả hai mang điểm trắng trong ngực.
- **Pose đặc trưng** (ba pose ở đợt 2):
  1. *Borrow*: lòng bàn tay úp, kéo một hình xám lên từ đất, hòm mở.
  2. *Return*: ấn điểm sáng xuống đất, hơi thở ra.
  3. *Ossuary Wall*: hai tay nâng một hàng rào đầu lâu lên từ đất.
- **Animation riêng** (Voc §18.5): rút linh hồn từ sàn.

### 6.9 Hiệu ứng, âm thanh, tiến triển

- **VFX:** linh hồn xám trắng mờ có điểm trắng đứng yên; vữa ướt; lạnh của Tường (Frost; Voc §12.4) màu xanh sương. Breach là mặt tường rách như tấm màn.
- **Âm thanh:** tiếng thì thầm to dần theo Strain (Voc §18.6).
- **Tiến triển hòm:** bậc 1 là hộp gỗ đựng xương của nhà xác, khoét hốc vụng; bậc 2 là hòm xương và bạc đúng nghề, dấu in bàn tay vữa; bậc 3 là hòm cổ ghép từ đồ vớt ở Wrackhaven (gỗ tàu, đồng thau), khắc tên những người đã được trả về (Đề xuất).
- **Bản thể hoàn hảo:** hòm **liền khối, không hốc**; xương trơn như sứ; không vết vữa; không còn vay hay trả.

### 6.10 Tránh

- Đầu lâu khắp người, giáp xương, hơi xanh phát sáng, liềm to như lưỡi hái thần chết (AD §8).
- Hồn trong mờ mặt bị ép như Wallshade (U10); áo xám, kính một mắt, lọ mẫu (F15); hòm giống sổ cái (Gennet, U11).
- Bay trôi, áo choàng rách tả tơi.

---

## 7. BR · Brinecaller — "Salt keeps. Salt cleans. Salt kills. Mind which you ask for."

### 7.1 Tinh thần

Pháp sư muối và thủy triều: kết tinh, ướp, tẩy rửa, nhấn chìm. Phép của một biển nội địa đã chết trong một thế hệ, năm 850 AL (Voc §13.1). Ba cây kỹ năng là ba lời cảnh báo của Hasmik: muối giữ (**Salt**), muối rửa (**Lye**), muối giết (**Tide**). Hình phải là **người của một biển đã khô**: mang theo những giọt nước cuối cùng và lớp muối nó để lại.

### 7.2 Neo nguồn

- **Người lạ:** Hasmik of the Brine, phù thủy muối của biển nội địa, 840 AL, mười năm trước khi biển chết (Canon, Bible §13.2). Phần đời ngắn là **Voc** (Voc §3.3): đọc thủy triều và "ướp" bão.
- **Đồ nghề** (Voc §13.1): **gậy** (gỗ trôi dạt buộc dây thừng và vỏ sò), đũa. Class item là **bình nước biển**: bình thủy tinh cầm tay trái, chứa nước biển từ trước Great Ebb. Giáp nhẹ.
- **Muối của hero không phải muối của Kathara** (Voc §13.2, §13.9): muối của hero **xám xanh**, sạn, lởm chởm, lẫn cát và rong, tinh thể mọc lệch góc, không bao giờ thành hình hoàn hảo, luôn đi kèm tiếng sóng. Muối của Purity trắng tinh, đối xứng, im lặng.
- **Nước** đục, teal, có bọt và rong, **không bao giờ xanh trong**. Tia sét lập lòe như mọi ánh sáng của thế giới con người.
- **Kỹ năng gợi hình:** *Crystallize*, *Pickle* (ướp xác kẻ địch thành servant tạm, trò đùa nhẹ xuyên suốt), *Salt Circle* (vòng muối, phép dân gian cổ hơn Giáo hội), *Undertow*, *Ebb* (trượt trên một lớp nước), *Kept in Salt*, *The Old Sea*.
- **Trong truyện (Voc §13.8):** phép của nghề là bất hợp pháp ở Namakhar, và là thứ hữu ích nhất thành phố; hệ thống ngụy trang (ledger §7.5) có một câu thoại về đôi tay nứt muối. Sau mỗi Rite of Laying có nghi thức rắc một nhúm muối lên mộ (Voc §13.8).

### 7.3 Hình khối và motif (Đề xuất)

- **Motif vệt triều:** những vòng muối khô đồng tâm, méo, trên vải: vết nước triều rút. Đây là "hoa văn" duy nhất của nghề.
- **Đối thoại cong và gãy** (AD §8): vạt áo và khăn cong như sóng; muối là những cụm góc cạnh, lệch.
- **Silhouette:** không đối xứng. **Muối đóng ở bên PHẢI** (A: vai và tay áo phải; B: chân phải và cuộn dây thừng vai phải), bên trái trơn.
- **Không đối xứng ở bất kỳ đâu**, kể cả tinh thể.
- **Không đuôi khăn dài:** đuôi vải dài từ đầu dành cho PS (§2.5).

### 7.4 Bảng màu (Đề xuất)

| Vai trò | Màu | L\* | Ghi chú |
|---|---|---|---|
| Áo chính | Rong nâu xanh `#3F4434` | 28 | **Khối tối**, để tách trên muối trắng của Act III |
| Muối kết | Xám xanh `#B4BCA9` | 75 | **Khối sáng**; **không bao giờ trắng** |
| Vải lanh biển | Xám biển `#8F9790` | 62 | Khăn lưới, lớp trong, mũ len (B) |
| Teal đục | `#3B6E68` | 43 | **Chỉ viền nhỏ** (dải thắt lưng, mép khăn hoặc mũ). Không bao giờ là mảng chính: teal là màu brine Act III và vũng nước hero đứng trong |
| Dây thừng | Vàng đất `#94784A` | 52 | — |
| Vỏ sò | Kem `#D9CDB4` | 83 | Chỉ điểm nhỏ |

### 7.5 Hướng A — Phù thủy biển chết

- **Ý:** phù thủy thủy triều; gậy dài và lưới.
- **Silhouette:** đường gậy cao; áo quấn nhiều lớp, gấu nặng và cong. **Khăn lưới đánh cá** quàng vai, có phao bần và vài vỏ sò. **Muối xám xanh** đóng thành cụm góc cạnh trên **vai phải** và chạy xuống tay áo phải. **Khăn trùm đầu là một nút quấn ngắn, không đuôi.** Chân quấn vải.
- **Đạo cụ:** **gậy gỗ trôi dạt** cong queo, cao 1,25H, **tay phải**, buộc dây thừng ở hai chỗ, ba bốn vỏ sò, một quả phao thủy tinh treo gần đầu gậy. **Đai ba bình nước biển** chéo ngực, bình thủy tinh nút bần bọc lưới dây; một bình đã kết muối từ miệng xuống. Osric's Lantern sau hông phải.
- **Tay trái:** vòng vỏ sò; tay áo có một vệt triều lớn.
- **Gấu váy:** hai, ba vệt triều to, méo.
- **Ghi chú:** khi cầm gậy, bình nước biển (off-hand) được **đeo trên người**; đây là ngoại lệ của quy ước tay trái (§2.2). Nguồn chưa nói gậy dùng một tay hay hai tay (§12 mục 4).

### 7.6 Hướng B — Người lội bãi triều (Tide-flat Wader)

- **Ý:** người lội bãi triều nhặt muối; gọn, thực dụng, đũa và bình lớn.
- **Silhouette:** khối thấp, bám đất. **Áo chần len ngắn** (rong) tới hông, **quần xắn gấu**, **quấn vải lội nước tới gối**, **muối xám xanh đóng dày trên MỘT chân (phải)**. Cuộn dây thừng trên vai phải, **cũng đóng muối xám xanh** (khối sáng thứ hai, đọc được từ camera cao). **Mũ len dệt ôm đầu màu xám biển `#8F9790`**, không đuôi. **Không tạp dề, không sailcloth, không lọ thủy tinh** (U13/U14 dùng sailcloth và vỏ muối; lọ thủy tinh là chất liệu của Memory).
- **Đạo cụ:** **bình nước biển lớn**: bình thủy tinh tròn cao 0,28H trong lưới dây, **cầm tay trái**; là hình tròn lớn đặc trưng của hướng này. **Đũa** gỗ trôi dạt hoặc xương cá voi, dài 0,33H, đầu là một vỏ ốc, **cầm tay phải**. Một **hũ muối nhỏ bằng gốm tráng muối** (stoneware, 0,07H) ở thắt lưng bên trái: nhúm muối cho nghi thức (Voc §13.8). Osric's Lantern sau hông phải.
- **Mối nối đọc được:** một miếng vá lớn trên áo chần; vệt muối trên chân phải.
- **Khác A ở:** khối thấp thay dáng dài; áo ngắn thay áo quấn nhiều lớp; bình lớn cầm tay thay đai bình; đũa thay gậy; muối ở chân phải thay vai phải; mũ len thay khăn nút; quấn lội nước thay chân quấn.
- **Tránh lẫn:** không áo dầu như Maelys (Act V), không mũ rộng vành (của Exhumer); không tạp dề hay sailcloth (U13, U14); không lọ thủy tinh (hũ gốm nhỏ ở thắt lưng thì được); không thân dưới hình chuông (OS-A).

### 7.7 Đạo cụ và kích thước (Đề xuất)

| Vật | Kích thước |
|---|---|
| Gậy A | 1,25H |
| Bình nhỏ A | 0,10H mỗi bình, ba bình |
| Bình lớn B | 0,28H |
| Đũa B | 0,33H |
| Hũ muối gốm B | 0,07H |
| Osric's Lantern | 0,12H |

### 7.8 Trạng thái và pose

- **Salinity thấp / vừa / đầy:** muối trong bình kết từ miệng xuống (Đề xuất).
- **Pose đặc trưng** (ba pose ở đợt 2):
  1. *Brine Spray*: vung một đường cong, nước bắn thành vòng cung.
  2. *Crystallize*: bàn tay nắm lại, muối bùng thành cụm gãy góc.
  3. *Undertow*: gậy hoặc đũa cắm xuống đất, dòng nước xoáy.
- **Animation riêng** (Voc §18.5): rót và trượt.

### 7.9 Hiệu ứng, âm thanh, tiến triển

- **VFX:** nước teal đục, bọt, rong; muối xám xanh sạn mọc lệch; tia sét chớp. Âm thanh đến trước hình: tiếng xèo của vũng nước đến trước vũng nước (Voc §13.9).
- **Kiểm tra bắt buộc** (Voc §13.9): đặt mọi hiệu ứng Salt cạnh hiệu ứng của Salt Cell để so.
- **Tiến triển bình:** bậc 1 là hũ muối mộ của ossuary; bậc 2 là bình thủy tinh thổi tay bọc lưới dây của Old Hovik; bậc 3 là bình cổ từ thời biển còn sống, thủy tinh xanh rêu, nút bạc.
- **Bản thể hoàn hảo:** muối thành **tinh thể trắng đối xứng** của Kathara; nước trong veo, không bọt, không rong; im lặng, không sóng. Phiên bản này chứng minh quy tắc: muối của hero không bao giờ được trông như vậy.

### 7.10 Tránh

- Băng xanh trong, quả cầu phát sáng, tinh thể đối xứng: pháp sư băng (AD §8).
- Mặt nạ sứ trắng, áo đen trắng (F13 Lye Priest); men trắng xương (D06 Salt-Clan); người muối trắng (P12); sailcloth cùng vỏ muối (U13, U14).
- Nước xanh trong vắt; lọ thủy tinh làm đạo cụ hài (chất liệu của Memory).

---

## 8. EX · Exhumer — "Keep your light low. The things worth killing see better than you."

### 8.1 Tinh thần

Thợ săn quái vật với đèn lồng, nỏ, xẻng và bẫy; tự điều khiển bán kính ánh sáng của mình (Voc §14.1). **Class chơi với luật của Diablo I: ánh sáng đánh thức quái vật.** Hình phải là **người biết khi nào tắt đèn**: kiên nhẫn, ít động, rồi ra tay một lần.

### 8.2 Neo nguồn

- **Dòng săn (Canon, Bible §8.4):** lập năm 700 AL; săn mọi thứ không chịu nằm yên: Unlaid, linh hồn trốn (Giáo hội gọi là **Deserter**), kẻ trộm xác, kẻ dị giáo. Đồ nghề: **đèn có chụp, nỏ bắn tên bạc, xẻng Exhumer lưỡi dài**. Dấu của dòng: **một ngôi mộ mở**.
- **Người lạ:** Ezra Mott, thợ săn mộ, 960 AL (Canon: tên, niên đại; Voc §23 mục 1 đề xuất đổi thành 990). Phần đời ngắn là **Voc** (Voc §3.3, §14.6): thợ dò giỏi nhất thời của ông, người viết các quy tắc thực địa về ánh sáng; hồ sơ kết thúc bằng cuộc săn cuối ông từ chối hoàn thành.
- **Đồ nghề** (Voc §14.1): **nỏ** và **xẻng đào mộ**, cả hai dùng Deftness. Hero mang **cả hai** và đổi theo kỹ năng, không qua menu. Class item là **đèn có chụp**, đeo **ở hông hoặc trên một cây sào ngắn**. Giáp vừa: **áo vải dầu và mũ rộng vành**. Concept này chọn **không dùng sào** (xem §8.3, lý do tách F16 và F17).
- **Bấc đèn năm nấc** (Voc §14.2): Hooded 2 m, Low 4 m, Open 6 m, Blaze 9 m, Beacon 11 m. Beacon chỉ có với Osric's Lantern hoặc đèn có affix Beacon (Voc §14.2).
- **Trình bày** (Voc §14.9): đèn là **nguồn sáng thật trong engine**, suy giảm thành dải theo LD §5.3; đổi bấc thì ai cũng thấy; đèn chớp vì là ánh sáng người. Âm thanh: tiếng chụp đèn tách, tiếng tời nỏ, tiếng xẻng cạo, tiếng xèo của dầu. Trong co-op có một đường viền mờ trên mặt đất đánh dấu rìa vùng sáng.
- **Kỹ năng gợi hình:** *Hood the Lantern* (tay trùm chụp đèn), *Flash*, *Lantern-Hook* (ném móc của đèn để tự kéo mình tới; Voc §14.3), *Lamp-Beam*, *Silver Bolt*, *Pinning Bolt*, *Grave Trap*, *Exhume* (cắm xẻng lôi kẻ địch lên để tra hỏi), *Mortsafe*, *Lych-Wire* (Habit có chuông nhỏ), *Dig In*.
- **Osric's Lantern** của Exhumer **gộp vào đèn class** (§2.4): nó mở nấc Beacon thay vì thêm một chiếc đèn.

### 8.3 Tách khỏi người giống ở phe khác (Đề xuất)

AD §8 cảnh báo nguy cơ lẫn với tuần tra Exhumer đối địch (F03); checklist cũng ghi trùng tên. Nguồn chỉ cho F03 **áo vải dầu xám nâu `#6B5F4E`, mũ rộng vành W 0,40–0,50H, đèn có chụp, xẻng lưỡi dài, nỏ** (QCQ F03; Cast §4.1). Cột "yêu cầu đề xuất cho brief F03" dưới đây là điều tài liệu này **đề xuất đưa vào brief của F03**, chưa phải sự thật nguồn.

| Tín hiệu | F03 (nguồn QCQ) | Yêu cầu đề xuất cho brief F03 | Hero Exhumer |
|---|---|---|---|
| Màu áo | Vải dầu xám nâu `#6B5F4E` (L\* 41), đồng phục | Giữ xám nâu đồng phục | **Nâu sẫm thấm dầu** `#4A3B2D` (L\* 26): tối hơn F03 15 L\*, sáng hơn F16 `#17151A` (L\* 7) 19 L\*; khăn cổ sáng |
| Dấu dòng | Dấu mộ mở (Canon: dấu của dòng) | Dấu mộ mở **nguyên vẹn**, ở ngực hoặc mũ | Dấu **bị cắt bỏ khỏi chỏm mũ**, để lại một **miếng vá kem `#D9CDB4` may chỉ sẫm to trên chỏm** (đọc được từ camera cao); A thêm một miếng vá sẫm trên ngực |
| Mũ | Mũ rộng vành, W 0,40–0,50H | Mũ rộng **tròn đều**, đồng phục | Vành **lệch** (A: vành phẳng, ghim hất bên trái; B: mũ mềm rủ trùm ngoài mũ trùm đầu) |
| Đèn | Đèn có chụp, chớp làm mù | Đèn **ở hông** | Luôn ở **bên trái trong tầm tay** (A: móc vai tại ngực; B: hông trái, móc xích) |

Dấu hiệu của hero ở mọi hướng: **mũ rộng**, áo nâu sẫm, miếng vá kem trên chỏm mũ, đèn bên trái trong tầm tay.

Ngoài F03 còn năm đối tượng dễ lẫn:

| Đối tượng | Mẫu (nguồn) | Cách tách |
|---|---|---|
| F16 Wrecker | Áo hắc ín `#17151A`; sào, móc thuyền, cột đèn; đi nhóm (Cast §7.2; QCQ F16) | Hero **không cầm cột hay sào nào**; áo nâu sẫm sáng hơn 19 L\*; có mũ rộng, xẻng, nỏ |
| F17 Lamplighter cultist | Áo choàng xám biển `#5C6063`, **cột đèn dài** (Cast §7.4; QCQ F17) | Đèn của hero luôn ở trong tầm tay, không treo trên cột dài |
| B15 Lamplighter / P24 Lantern-Lure | Đèn trên cuống như cá biển sâu (Cast §7.2, §7.4; QCQ) | Cánh tay móc của A chỉ dài 0,2H, đèn ở ngực; đèn B ở hông; không cuống |
| Ignatia | Tóc cắt ngắn, **không mũ**, áo Exhumer xám, tay sẹo bỏng, đèn chụp, xẻng dài (Cast §4.1). Trong solo play đồng hành với đèn 4 m không gây Exposed (Voc §17.10) | Hero luôn đội mũ rộng, áo nâu thay vì xám, miếng vá kem trên chỏm |
| Tamsin | Mũ trùm len dầu, cung ngắn, bẫy ở thắt lưng (Cast §3.1); 16 tuổi, gầy | EX-B có mũ trùm dưới mũ rộng và bộ bẫy, nên cần mũ rộng, nỏ (không phải cung), xẻng 1,15H và áo vải dầu chần |

Nếu Ezra được đổi sang 990 AL, bộ đồ của ông càng gần mẫu Giáo hội hiện thời, nên các tín hiệu trên càng cần thiết.

### 8.4 Hình khối và motif (Đề xuất)

- **Motif chụp đèn:** các nan chụp đèn mở theo **năm nấc**, khớp năm mức bấc; đường bậc thang gợi dải suy giảm của ánh sáng.
- **Silhouette:** áo vải dầu dài hoặc vừa, mũ rộng. Lưỡi xẻng dài tạo **một đường dọc hoặc nghiêng** rõ (A: nghiêng khoảng 20° trên lưng; B: dựng đứng ở tay).
- **Tối mà không mất:** áo tối hợp với lối chơi ẩn, nhưng hero phải luôn đọc được: vành mũ và khăn cổ sáng hơn áo; đèn của chính hero luôn chiếu tối thiểu 2 m.

### 8.5 Bảng màu (Đề xuất)

| Vai trò | Màu | L\* | Ghi chú |
|---|---|---|---|
| Áo vải dầu | Nâu sẫm thấm dầu `#4A3B2D` | 26 | **Khối tối**; không rơi vào dải gần đen của F16 |
| Mũ dạ | Nâu vàng bụi `#A8957A` | 63 | Đĩa mũ đọc từ trên, tách khỏi nền Act I |
| Da dầu | `#5B4130` | 30 | Găng, đai |
| Khăn cổ, khăn vai | Lanh `#B8AE98` | 71 | **Khối sáng**; khung khuôn mặt |
| Miếng vá chỏm mũ | Kem `#D9CDB4` | 83 | Chỗ dấu mộ mở bị cắt; may chỉ sẫm to. ΔL\* ≈ 20 so với mũ dạ (63): đủ để đọc từ camera cao |
| Bạc xỉn | `#A9ABA7` | 70 | Tên bạc, mép xẻng |
| Sắt | `#4A4B4E` | 32 | — |
| Lửa đèn | Hổ phách `#E7A04A` | 71 | **Chỉ là ánh sáng**, luôn chớp |

### 8.6 Hướng A — Thợ săn đèn móc (Hook-Lantern Hunter)

- **Ý:** thợ dò kiên nhẫn; đèn trong tầm tay trái, nỏ trong tay phải.
- **Silhouette:** mũ vành phẳng rộng 0,38H, **vành trái ghim hất lên**. Áo vải dầu dài xẻ sau tới thắt lưng (hai vạt), khoác vai ngắn, **khăn cổ lanh** (khối sáng). Ủng cao tẩm dầu.
- **Đạo cụ:** **không có sào trên lưng.** Đèn có chụp (0,16H) treo ngang **ngực (xương ức, khoảng 0,70H so với đường nền)** từ một **cánh tay móc sắt ngắn 0,2H tán đinh vào dây đai vai TRÁI**, trong tầm tay trái (*Hood the Lantern*, đóng chụp, *Lantern-Hook* tháo cánh tay móc ra). **Xẻng lưỡi dài** đeo sau lưng, nghiêng khoảng **20°** so với phương thẳng đứng (**lưỡi thấp bên trái, cán ló qua vai phải**). **Nỏ** bọc sắt có tay quay bên hông, **cầm tay phải**. Hộp tên bạc ở thắt lưng phía trước bên phải. Cuộn dây *Lych-Wire* có chuông nhỏ ở hông phải. Không Osric's Lantern riêng (gộp vào đèn class).
- **Dấu dòng:** miếng vá kem may chỉ sẫm trên chỏm mũ; trên ngực là miếng vá sẫm chỗ dấu mộ mở bị cắt.
- **Tay:** trái găng tẩm dầu; phải găng da (nhẫn bị che).
- **Trên sheet:** đèn **không thắp**, chụp mở nửa để thấy cơ cấu năm nan.

### 8.7 Hướng B — Người đào mộ đèn hông

- **Ý:** người đào mộ thiên bẫy; xẻng trong tay, đèn bên hông.
- **Silhouette:** **áo khoác chần vải dầu** tới giữa đùi; **tạp dề da và xà cạp** của người đào đất. **Mũ mềm vành rủ trùm ngoài mũ trùm đầu và khăn vai lanh sáng**: hai lớp đầu, khác hẳn mũ tròn của F03.
- **Đạo cụ:** **đèn ở hông trái** trên móc xích; sợi xích của *Lantern-Hook* cuộn ở thắt lưng. **Xẻng lưỡi dài** 1,15H, có bàn đạp chân và cổ sắt, **một mình tay phải cầm và DỰNG ĐỨNG cạnh chân phải trên sheet**; tay trái buông; ở góc nhìn LEFT xẻng bị thân che một phần. **Nỏ** gọn **đeo chéo sau lưng**, báng chĩa lên. **Bộ bẫy là một túi da ở hông phải**, trong có cuộn dây thép và vài cọc sắt: **không có cọc hay cuộn dây trên lưng.**
- **Dấu dòng:** dấu mộ mở cắt khỏi chỏm mũ, để lại miếng vá kem may chỉ sẫm to trên chỏm.
- **Tay:** trái găng tẩm dầu; phải găng da (nhẫn bị che).
- **Khác A ở:** áo khoác chần ngắn thay áo dài; đèn hông thay đèn móc vai; xẻng dựng ở tay thay xẻng đeo lưng; nỏ trên lưng thay nỏ trong tay; mũ hai lớp thay mũ vành ghim.

### 8.8 Đạo cụ và kích thước (Đề xuất)

| Vật | Kích thước |
|---|---|
| Mũ A / B | Rộng 0,38H / 0,40H (F03: 0,40–0,50H; tách bằng hình, không bằng cỡ) |
| Đèn | Cao 0,16H; chụp năm nan |
| Cánh tay móc A | 0,2H |
| Xẻng | 1,15H; lưỡi 0,35H × 0,12H |
| Nỏ | Dài 0,45H; sải cánh 0,42H |

### 8.9 Trạng thái và pose

- **Năm trạng thái bấc** (Đề xuất; bán kính sáng là đèn thật, Voc §14.2): **Hooded** (chụp đóng, chỉ một khe sáng nhỏ) / **Low** (hé một nan) / **Open** (mở nửa) / **Blaze** (mở hết) / **Beacon** (mở hết, bấc nâng cao, chụp gập ra sau bản lề; chỉ khi có Osric's Lantern hoặc affix Beacon). Oil hiện ở bầu kính.
- **Pose đặc trưng** (ba pose ở đợt 2):
  1. *Hood the Lantern*: tay trùm chụp đèn, người hạ thấp.
  2. *Silver Bolt*: quỳ một gối, nỏ ngắm.
  3. *Exhume*: xẻng cắm sâu, kéo ngược về sau.
- **Animation riêng** (Voc §18.5): đóng chụp đèn, ném móc.

### 8.10 Hiệu ứng, âm thanh, tiến triển

- **VFX:** lửa đèn chớp; dải sáng bậc thang trên đất; tên bạc lóe; dầu cháy cam.
- **Phụ đề âm thanh:** *[shutter, close]* khi hero che đèn, để đồng đội co-op biết (Voc §14.9).
- **Tiến triển đèn:** bậc 1 là đèn của người giữ mộ, chụp méo; bậc 2 là đèn chụp mua ở Goulven (Wrackhaven; Voc §17.14), đã gỡ dấu, còn nỏ và xẻng lấy từ kho Exhumer của Ansel Crane ở Sepulcra; bậc 3 là đèn cổ thời Ezra, chụp đồng khắc quy tắc ánh sáng (Đề xuất). Osric's Lantern là relic chung cho mọi nghề; với Exhumer nó mở nấc Beacon (Voc §17.6).
- **Bản thể hoàn hảo:** đèn **không có chụp**, cháy một ngọn trắng đứng yên; vành mũ tròn hoàn hảo; áo không vá, không vết cắt.

### 8.11 Tránh

- Ánh sáng trang trí thường trực trên người (AD §8): mọi ánh sáng của nghề đều đến từ đèn.
- Áo xám đồng phục, mũ tròn đều, dấu mộ mở còn nguyên (F03); hào quang trên mũ (F07).
- Ngọn lửa trắng đứng yên (Widower's Lantern của Severin, Bible §15.1; Severin dạng Lamp-Bearer, Cast §7.8); đèn trên cuống như cá biển sâu (P24, B15 Lamplighter); cột đèn, sào hay móc thuyền (F16, F17); hai nỏ, mặt nạ, áo choàng phồng kiểu thợ săn quỷ.

---

## 9. PS · Pyre-Singer — "Sing, so they don't go frightened."

### 9.1 Tinh thần

Pháp sư phương bắc của lửa và băng, phép là bài hát: **lửa cho người chết, băng cho người sống** (Voc §15.1). Nghề kế thừa tay nghề của Frostwives mà Giáo hội đã thiêu vì Ash Heresy, dù người chết của Frostwives là những viên gạch vững nhất trong Tường. Quyền năng của nghề là giữ cho người ta **không sợ hãi**, và đốt những gì không chịu nằm xuống. Hình phải là **người hát tang**: thở, mở lòng, ngân.

### 9.2 Neo nguồn

- **Dòng tu** (Canon, Bible §8.5): các nữ tư tế xưa ở Hoarfast thiêu người chết trên giàn và hát khi lửa cháy, "để không ai đi vào bóng tối mà sợ". Giáo hội gọi đó là Ash Heresy và đánh hai cuộc Pyre War để dập tắt.
- **Người lạ:** Velimira of the Last Fire, Frostwife, 980 AL, chị em của Zorya (Canon, Bible §13.2–13.3). Phần đời ngắn là **Voc** (Voc §3.3, §15.8): hát tiễn những người hấp hối trong Last Pyre War và bị Exhumer thiêu trong chính cuộc chiến ấy.
- **Đồ nghề** (Voc §15.1): **gậy giàn thiêu**, gậy có đầu là đuốc giàn thiêu như của Zorya; gậy thường. Class item là **mạng tro**, mạng xám tro của Frostwives, dùng làm mũ. Giáp nhẹ đến vừa: **lông thú và len**.
- **Trình bày** (Voc §15.9): hero hát bằng tiếng nói bịa của Frostwives, những câu ngắn lặp lại theo lối hợp xướng nữ đa âm của Hoarfast; Hymn là một bè trầm dưới nhạc nền, **không bao giờ to hơn nhạc** (*never louder than the music*) và không bao giờ trích "seed" (*Hold fast / Until the last*). Lửa là **lửa tang**: cam, có khói, chớp, tro bay lên; không bao giờ là hình phạt, không bao giờ có người sống trên giàn. Băng là sương giá trắng xanh, tinh thể lông vũ lệch, không bao giờ đối xứng như Purity. **Smoke-Shape** là khói xám, mắt than, nét lỏng, luôn tan ở mép; "bài hát có hình, không phải linh hồn" (Voc §15.5, §24.3); hình là thú bằng khói (sói; Habit đổi thành nai hoặc cú).
- **Zorya** (Cast §6.1): ngoài bảy mươi (in her seventies), tóc bím trắng, tay sẹo bỏng, gậy đầu đuốc giàn thiêu, đồ lông, mạng xám tro. **Frostwives** (Cast §6.1): áo lông, mạng xám tro, đuốc.
- **Yêu cầu cho brief NPC (Đề xuất, xem §12 mục 16):** để tách hero khỏi Zorya và Frostwives, NPC Frostwives mặc mạng **kéo tới trước, che trán hoặc mặt** và áo choàng lông **dài chấm đất**; mạng của hero luôn hất ra sau với mặt để hở, và áo choàng của hero tối đa dài tới gối (A không có).

### 9.3 Hình khối và motif (Đề xuất)

- **Motif hơi thở và giàn củi:** vòng xoắn hơi thở; củi xếp chéo của giàn thiêu (đầu gậy là một giàn thiêu thu nhỏ).
- **Lửa và băng chung một ngôn ngữ** (AD §8): cả hai đều là **hơi thở hiện hình**. Bài lửa thở ra than và khói; bài băng thở ra hơi lạnh và sương. Cùng một động tác lấy hơi, hai kết quả.
- **Silhouette:** mạng tro sáng **hất ra sau**, mặt để hở; gậy giàn thiêu.
- **Gậy là gậy của người xướng ca, không phải gậy phù thủy:** cắm đất giữ nhịp, giơ lên khi kết câu; **không vung** như Brinecaller. Đầu gậy và hơi thở sáng lên với cường độ chập chờn theo bài hát, không theo nhịp.
- **Trang trí lấy từ nhiều nguồn, không từ một nền văn hóa thật** (§2.10): vòng sắt hun muội, đường chéo dệt giản dị, khuy sừng trơn; **không** vỏ bạch dương hun ở vòng đầu, **không** khuy gạc, **không** hoa văn hình học dày.
- **Chỉ đỏ:** accent duy nhất, rất nhỏ: bím chỉ đỏ ở cổ tay trái, có thể thêm một đường khâu đỏ ở mép áo choàng.

### 9.4 Bảng màu (Đề xuất)

| Vai trò | Màu | L\* | Ghi chú |
|---|---|---|---|
| Mạng | Xám tro `#B4AEA5` | 71 | **Khối sáng**; vải đục, ấm, mờ (matte); khác mạng băng `#D8E7EF` của P16 (L\* 91) |
| Màu muội | `#26221F` | 14 | **Khối tối**: áo len A và áo ngắn B nhuộm muội, gậy, ủng |
| Lông | Nâu `#6B5745` | 39 | Cổ lông A, áo choàng lông B |
| Len mộc | Kem `#C8BEAE` | 77 | Dải gấu, tay áo trong, sash |
| Chỉ đỏ | Cam gạch `#A84B30` | 44 | Accent nhỏ; xa máu Act III `#9E1B1B` |
| Than lửa | `#E27A36` | 62 | **Chỉ là ánh sáng** |
| Sương | `#BCD0EA` | 83 | **Chỉ VFX**, hoặc sương đọng trên lông khi hát Frost Psalm. Xanh hơn salt-glass `#CFE3E2` của Purity; hình lông vũ lệch vẫn là khác biệt chính |

### 9.5 Hướng A — Ca nữ giàn thiêu

- **Ý:** người xướng ca của giàn thiêu; đứng thẳng như cột khói.
- **Silhouette:** cao, thẳng. **Mạng tro dài** buông từ một **vòng đầu sắt hun muội trơn** (không vỏ bạch dương), **hất ra sau**, dài 0,35H quá bả vai, mặt để hở. **Cổ lông dày** làm từ hai tấm da quàng vai. **Áo len dài thắt đai** nhuộm muội, gấu có **một dải ngang rộng gạch chéo giản dị** màu kem. **Không có áo choàng.** Ủng bọc lông.
- **Đạo cụ:** **gậy giàn thiêu** 1,3H, **tay phải**, đầu là **lồng sắt nhỏ đựng củi chẻ** (một giàn thiêu thu nhỏ). Trên sheet, củi **chưa đốt**, có muội. Osric's Lantern sau hông phải.
- **Tay trái:** bím chỉ đỏ.
- **Mối nối đọc được:** mạng có một đường khâu nối lớn; cổ lông ghép hai tấm da.

### 9.6 Hướng B — Người hát tiễn đường xa

- **Ý:** người hát tang lang thang; nặng nề và ấm hơn A.
- **Silhouette:** to, tròn. **Áo choàng lông có mũ trùm**, mặt lông quay ra ngoài, **dài tới gối**, cài **khuy sừng trơn chỉ ở cổ họng**, hở từ ngực xuống để lộ áo len nhuộm muội (khối tối); mạng tro chỉ buông **sau lưng**, từ viền mũ trùm; mặt để hở. Áo len ngắn hơn A nhuộm muội, xà cạp dạ, ủng bọc lông.
- **Đạo cụ:** **gậy bạch dương cong**, cao 1,2H, đầu là **bó cành bạch dương buộc, tẩm nhựa** (đuốc chổi). Ở thắt lưng bên trái một **túi tro đen muội**. Chỉ đỏ ở cổ tay trái và một đường khâu đỏ ở mép áo choàng. Osric's Lantern sau hông phải.
- **Mối nối đọc được:** một miếng da vá lớn sau áo choàng.
- **Khác A ở:** khối tròn thay cột thẳng; áo choàng lông có mũ thay cổ lông và vòng đầu; đuốc chổi thay lồng giàn thiêu; mạng từ viền mũ thay mạng từ vòng sắt; túi tro thay dải gấu.
- **Tránh lẫn:** không lư hương (P02 Hush-Herald); không nồi lửa đất (Discarded: D02, B03); mặt luôn lộ; không mạng kéo trước mặt, không áo choàng dài chấm đất (Frostwives, Zorya); không vật hình thú.

### 9.7 Đạo cụ và kích thước (Đề xuất)

| Vật | Kích thước |
|---|---|
| Gậy A | 1,3H; lồng 0,14H |
| Gậy B | 1,2H; bó cành 0,16H |
| Mạng A | Dài 0,35H từ vòng đầu |
| Túi tro B | 0,08H |
| Osric's Lantern | 0,12H |

### 9.8 Trạng thái và pose

- **Không hát / Pyre Hymn / Frost Psalm:** hơi thở trong / hơi thở viền than, đầu gậy sáng chập chờn / hơi thở viền sương, sương đọng trên lông (Đề xuất). Chập chờn thay đổi theo bài hát, không theo nhịp.
- **Pose đặc trưng** (ba pose ở đợt 2):
  1. *Pyre Hymn*: gậy cắm đất, ngực mở, đầu hơi ngẩng, đang ngân.
  2. *Lament*: hai tay mở về phía trước, lòng bàn tay ngửa.
  3. *Last Verse*: một tay đưa về phía đồng đội đã ngã.
- **Animation riêng** (Voc §18.5): hát.

### 9.9 Hiệu ứng, âm thanh, tiến triển

- **VFX:** lửa tang cam, khói, tro bay **lên**; sương giá lông vũ lệch; Smoke-Shape là **thú làm bằng khói** (sói; Habit đổi thành nai hoặc cú; Voc §15.5), khói xám mắt than, tan ở mép, là bài hát có hình chứ không phải linh hồn. *Sisters* là những phụ nữ đội mạng bằng khói cùng hát, vẫn là khói, không phải linh hồn.
- **Tiến triển gậy:** bậc 1 là đuốc lễ của ossuary; bậc 2 là gậy giàn thiêu của Vesnagrad; bậc 3 là gậy cổ của Frostwives, cán khắc tên những người đã được hát tiễn (Đề xuất).
- **Bản thể hoàn hảo:** mạng **trắng, đứng yên**; lửa ở đầu gậy **trắng vàng, đều, không khói**; tiếng hát đúng quãng hoàn hảo, không nghịch âm (LD §6.4 qua Voc §18.6).

### 9.10 Tránh

- Hai bộ hiệu ứng lửa và băng rời rạc; vung gậy như Brinecaller (AD §8).
- Mạng trong mờ như băng (P16); bộ xương bọc lửa và xích cọc thiêu (U07); bất kỳ hình người sống trên giàn.
- Biến hình thú của chính hero; vật tượng trưng thú đeo trên hero (thẻ, bùa hay totem hình sói, nai, cú); dây leo, lá cây. Smoke-Shape thì **chính là thú làm bằng khói** (sói, nai, cú; Voc §15.5): bài hát được cho hình, không phải linh hồn hay linh thú (Voc §15.5, §24.3). Cái cần tránh là totem mang trên người và việc hero hóa thú.

---

## 10. Key art màn chọn nghề

**Voc (§3.2):** màn chọn class là hình đầu tiên của game, trước cả cold open: **sáu bàn tay vươn ra từ một bức tường đầu lâu trong vữa xám**, gần như tối hẳn, được thắp bằng **một ngọn nến của người giữ mộ**. Người chơi chọn nắm bàn tay nào.

**Đề xuất bố cục:**

- Một đoạn tường Course nằm ngang: đầu lâu và xương dài vẽ thành **khối lớn trơn**, không gore, trong vữa xám ấm (Bible §4.6).
- Ngọn nến là **nến của chính Gennet** (người giữ mộ; LD §10: màu ấm đầu tiên của game là ánh của Gennet).
- Sáu bàn tay xếp trên **một cung tròn quanh ngọn nến thấp**, để mỗi tay đều hứng được chút sáng (hai tay giữa thấp và gần nến, hai tay ngoài cao và xa hơn), từ trái sang phải theo **thứ tự chuẩn** của Voc (§3.2, §9.1): **PB, FL, OS, BR, EX, PS**. Bàn tay **mời** chứ không vồ: PB, OS, BR chìa **mu bàn tay** về phía người xem (dấu của họ nằm ở mu tay: đinh bạc, vết vữa, mảng muối); FL, EX, PS có thể ngửa lòng bàn tay.
- Ngọn nến đặt dưới thấp, giữa tay thứ ba và thứ tư, lửa nhỏ chớp, có muội. Ánh nến chạm mỗi bàn tay một chút; phần còn lại chìm trong đen sâu (LD §5.2: một điểm sáng xa, một khối tối lớn).
- Không chữ trên ảnh. Câu thoại hiện khi rê chuột (Voc §3.2) là việc của UI.
- **Gợi ý cho UI (Đề xuất):** khi rê chuột lên một bàn tay, tay ấy hơi chuyển động và ánh nến nghiêng về phía nó.

---

## 11. Kế hoạch tạo ảnh

Brief cho Astra nằm ở `art/heroes/_brief/` (README, MANIFEST, prompt từng job: `prompts/` là v1, `prompts_v2/`, `prompts_v3/`). **Cách trình bày hero hiện hành là v3 (§1.4, §11.1c)**; §11.1 và §11.1b là lịch sử của v1 và v2. Tóm tắt:

### 11.1 Đợt 1 (v1, lịch sử): chọn hướng (16 ảnh)

| Job | Nội dung |
|---|---|
| `PB_A`, `PB_B`, `FL_A`, `FL_B`, `OS_A`, `OS_B`, `BR_A`, `BR_B`, `EX_A`, `EX_B`, `PS_A`, `PS_B` | Mỗi hướng một sheet, **một hàng**: H, 3/4, LEFT, RIGHT, FRONT, BACK, ALT (3/4 trên thân còn lại). Chung một đường nền, một thước. Đồ ở trạng thái thiết kế: không VFX, đèn và đuốc chưa thắp, hốc hòm trống, Burden nửa khung. Mọi sheet trừ EX có Osric's Lantern |
| `PROLOGUE_LINEUP` | Sáu hero ở dáng cuối Prologue (vải liệm, áo của Gennet, vũ khí ứng biến; PB có bier-board; đèn EX và đuốc PS có thể có ngọn lửa phẳng nhỏ) cùng một thước với H |
| `CHOICE_HANDS` | Key art màn chọn nghề (§10) |
| `TOPDOWN_A`, `TOPDOWN_B` | **Mới.** Mỗi ảnh một tấm 3:1, hai hàng: hàng trên là sáu hero của chữ cái ấy (PB, FL, OS, BR, EX, PS) nhìn từ camera game (góc cao 3/4, nhìn xuống khoảng 50–60°, gần trực giao), nhỏ, trên nền xám trung bình phẳng; hàng dưới là sáu hero ấy thành silhouette đen đặc từ cùng camera. Kiểm các tuyên bố đọc được của §2.3 và §2.5 và yêu cầu "silhouette đen, hình màu ở kích thước chơi" của AD §13 **trước khi chọn A/B**. Chỉ chạy sau sáu sheet cùng chữ cái, dùng sáu sheet đó làm tham chiếu **danh tính** (không thiết kế lại). **Thứ tự chạy (thủ công):** 12 sheet hero, `PROLOGUE_LINEUP` và `CHOICE_HANDS` chạy trước; `TOPDOWN_A/B` là đợt chạy thứ hai, chỉ sau khi sáu sheet của chúng qua QA, truyền sheet `_v2` đã duyệt bằng `--ref-map CŨ=MỚI` (runner `E:/hero-batch/hero_batch.py` bỏ qua `dependsOn` và bỏ qua tham chiếu thiếu) |

- **Pilot (đã chạy):** `PB_A` được tạo tại `art/heroes/PB_pallbearer/vA/concept_pilot.png` (2172×724) và **được duyệt về bố cục** ngày 20/10/2026 (người dùng yêu cầu tạo tất cả concept sau vòng review). QA: bảy hình và nhãn đúng; đỉnh đầu hero bằng đỉnh đầu H; model dùng khoảng 480 px mỗi H thay vì 400 (tỷ lệ tương đối mới là điều quan trọng); khung kiệu cao khoảng 1,08H (mô hình co khung 1,2H lại để tránh tiêu đề, và ở cỡ ấy đạo cụ 1,3H sẽ chạm mép trên) và đọc như cái thang, nên đã sửa ở §4 (khung 0,80H dạng quan tài hẹp, nắp 0,72H × 0,28H). Bảy hình **không** phải rút về sáu.
- **Nối tham chiếu:** 11 sheet hero còn lại không còn phụ thuộc `PB_A`; mỗi sheet gắn ảnh pilot làm tham chiếu **chỉ bố cục** (chỉ thứ tự hàng, vị trí đường nền và vị trí nhãn; **không** lấy cỡ hình, vì hình trong pilot cao khoảng 480 px còn ở đây 1H = 400 px; không lấy thiết kế, màu, đạo cụ, càng không lấy Pallbearer). `PB_A` được tạo lại từ prompt đã sửa, **không** gắn pilot, để khung và nắp mới thay thiết kế pilot. **Đạo cụ cao** (khung kiệu PB 1,22H, đòn PB-B 1,3H, gậy BR-A 1,25H, gậy PS-A 1,3H và PS-B 1,2H, xẻng EX-B 1,15H) phải nằm trong canvas, dưới dải tiêu đề; nếu không vừa thì thu nhỏ **cả bảy hình** đều nhau, không rút ngắn, bẻ cong hay cắt đạo cụ. Khi QA, đo đỉnh từng đạo cụ cao so với đỉnh đầu H.
- Style và layout theo chuẩn sheet quái đã được chấp nhận (`U01_A concept_v3.png`): painterly ít chi tiết theo tinh thần Diablo Immortal, nền xám ấm, ánh sáng studio mềm.
- Sheet hero dùng ánh sáng studio trung tính, **không** áp mood Act I; màu áo theo palette đề xuất của từng nghề.

### 11.1b Đợt v2: hero push (20/10/2026, theo §1.3)

- **12 job hero** `PB_A`…`PS_B` được chạy lại với prompt mới ở `art/heroes/_brief/prompts_v2/<JOB>.txt`; ảnh ra cạnh ảnh v1 với tên **`concept_v2.png`** (`art/heroes/<NGHỀ>/vA|vB/concept_v2.png`), không ghi đè `concept.png`. Cả 12 ảnh đã có trên đĩa.
- **Tham chiếu:** sheet v1 cùng job khi có (PB_A, PB_B, FL_B, OS_B, BR_B, EX_A, EX_B, PS_A, PS_B) làm **nền danh tính** (giữ cấu trúc, đạo cụ, bố cục, nhãn; không chép màu và độ bẩn); `FL_A`, `OS_A`, `BR_A` không có v1 (đã dừng vì đổi hướng) nên chạy **không tham chiếu**.
- `PROLOGUE_LINEUP`, `CHOICE_HANDS` và ảnh pilot `concept_pilot.png` không chạy lại v2 (Prologue và màn chọn nghề vẫn theo palette v1, Act I về đêm). `TOPDOWN_A/B` không chạy ở v2; chuyển sang v3 (§11.1c).

### 11.1c Đợt v3: một góc 3/4 + bốn góc + vũ khí tách riêng (20/10/2026, theo §1.4)

- **12 job hero** `PB_A`…`PS_B` được chạy lại với prompt mới ở `art/heroes/_brief/prompts_v3/<JOB>.txt`, sinh bằng script phiên làm việc `E:/hero-batch/build_v3.py` (không nằm trong repo: dict `IDENTITY`, `KIT`, chuỗi `STYLE`; palette và đạo cụ cường điệu lấy từ `build_v2.py`). Ảnh ra cạnh `concept.png` và `concept_v2.png` với tên **`concept_v3.png`** (`art/heroes/<NGHỀ>/vA|vB/concept_v3.png`; `<NGHỀ>` = `PB_pallbearer`, `FL_flagellant`, `OS_ossuarist`, `BR_brinecaller`, `EX_exhumer`, `PS_pyre_singer`), không ghi đè. **Cả 12 ảnh đã có trên đĩa** (1672×941, riêng EX_B và FL_A 1672×940; nhỏ hơn 2048×1152 đã xin).
- **Tham chiếu:** `concept_v2.png` của **chính job đó** (cả 12 đều có, kể cả `FL_A`, `OS_A`, `BR_A`): giữ danh tính, silhouette, đạo cụ, palette; không chép bố cục bảy hình nhỏ và không chép chi tiết quần áo.
- **Cách chạy:** `python E:/hero-batch/hero_batch.py --jobs <JOB> --suffix _v3 --prompt E:/Diablo2/ashlar/art/heroes/_brief/prompts_v3/<JOB>.txt --refs <đường dẫn concept_v2.png của job>`; mỗi job một phiên `codex exec` mới (`gpt-6-astra`, `image_gen`). Nhật ký: `E:/hero-batch/run_v3_<JOB>.out` (`"status":"ok"` là đã có ảnh) và `art/heroes/_runs/batch_2026-10-20.jsonl`. Theo ý người dùng, bước review thêm được bỏ qua.
- **`TOPDOWN_A/B` v3:** `prompts_v3/TOPDOWN_A.txt` và `TOPDOWN_B.txt` (sinh bằng `E:/hero-batch/build_topdown_v3.py`), tham chiếu là **sáu sheet `concept_v3.png`** của chữ cái ấy (chỉ danh tính, không còn ảnh style); ảnh ra `_shared/topdown_A/concept_v3.png` và `_shared/topdown_B/concept_v3.png`. **Trạng thái lúc kiểm 12:55: chưa có ảnh nào.** `TOPDOWN_B` đã chạy hai lượt và `TOPDOWN_A` đã chạy lượt 1, tất cả không ra ảnh vì công cụ `image_gen` chỉ nhận tối đa **5** `referenced_image_paths` mà prompt gắn **6** (lượt 1 của A runner ghi nhầm là `capacity` vì cuối log có dòng "stream disconnected"; nguyên nhân thật nằm ở `concept_v3.result.txt`). `TOPDOWN_A` lượt 2 đang chạy với cùng prompt nên nhiều khả năng lỗi như vậy. Cần đổi cách gắn tham chiếu trước khi chạy lại (§12 mục 26).
- `PROLOGUE_LINEUP`, `CHOICE_HANDS` và ảnh pilot không chạy lại ở v3 (vẫn palette v1).

### 11.2 Đợt 2: sau khi chọn hướng (chưa viết prompt)

| Job (dự kiến) | Nội dung |
|---|---|
| `<nghề>_STATES` × 6 | Ba trạng thái tài nguyên trên thân (§2.8) và **ba** pose đặc trưng (mỗi chương định nghĩa ba); PB gồm *Shoulder the Fallen* kiểu vác trước ngực và *Bier of Many* (§4.8); thêm trạng thái chung (§2.11) |
| `<nghề>_GEAR` × 6 | Ba bậc vũ khí và class item (§2.6) |
| `HERO_GLOW` | **Brinecaller** (lộ da) qua năm bậc Glow, thêm bản thể hoàn hảo; không dùng Pallbearer vì da bị che |
| `HERO_LINEUP` | Sáu thiết kế đã chọn cạnh nhau, một hàng silhouette đen, một hàng cỡ nhỏ như ở camera chơi (bản thử sơ bộ là TOPDOWN_A/B v3, §11.1c; chưa có ảnh) |

**Theo dõi ở đợt 2:** Osric's Lantern của PB treo từ chân khung, gần đùi, có thể va vào chân khi bước (cân nhắc xích ngắn hơn hoặc móc cao hơn); nắp đứng mép của PB-B có thể biến mất trong TOPDOWN_B.

Sau đợt 2, đưa **cả sáu hero** vào lab ở camera chơi trên **năm nền act** (rêu Act I, muội Act II, muối trắng Act III, băng xanh Act IV, đá xám Act V) **cộng nền Course (xám ấm) và một cảnh Seamless đơn giản**, để thử value theo chuỗi kiểm chứng của AD §13; thêm các clip ngắn để xem ánh sáng chập chờn của ánh sáng người, vì chập chờn là điều tách ánh sáng người khỏi ánh sáng Perfection (AD §7).

---

## 12. Điểm mở, cần người dùng quyết

| # | Điểm | Đề xuất của tài liệu |
|---|---|---|
| 1 | Hai thân gốc cao bằng nhau (1,0H) | Có, để độ đọc và hitbox như nhau |
| 2 | Quy ước hai tay: dấu bàn tay luôn ở trái, class item ở trái khi bộ đồ cho phép; nhẫn hiện khi tay phải trần, che khi đeo găng (PB, EX) | Ngoại lệ BR-A (bình trên đai chéo ngực) và PS (class item là mũ); PB đeo găng da tay phải để khớp quy tắc nhẫn. Dùng cho cận cảnh, paper-doll và cinematic |
| 3 | Bản vọng tài nguyên trên thân cho FL, OS, BR, EX, PS | Làm, nhưng UI vẫn là nguồn chính. FL: nóng chỉ ở nồi/hộp than, xích cổ tay luôn nguội |
| 4 | Gậy của BR và PS dùng một tay hay hai tay | Chưa rõ trong nguồn. Concept cho BR-A đeo bình trên người khi cầm gậy |
| 5 | Yêu cầu đề xuất cho **brief F03** (mũ tròn đều, dấu mộ mở nguyên vẹn, đèn ở hông) và các lookalike F16, F17, B15/P24, Ignatia, Tamsin | Các tín hiệu ở §8.3; cần chốt cùng thiết kế F03 và các quái liên quan |
| 6 | Ký hiệu dấu sắt nung của FL | Nút thắt một vòng |
| 7 | Palette cuối của sáu nghề | Khóa sau khi thử trong scene ở năm act, nền Course và Seamless (AD §8, §13) |
| 8 | Ezra 960 hay 990 AL (Voc §23 mục 1) | Không đổi hình; nếu 990 thì càng cần các tín hiệu ở §8.3 |
| 9 | Thân hiển thị trên sheet theo giới của người lạ | Giữ (v1, v2: kèm hình ALT; v3 không có ALT, xem mục 24); không phải khóa giới tính |
| 10 | Glow trên mặt do creator tạo | Thử với các cực của creator, như LD §9.6 yêu cầu cho tượng |
| 11 | **PB trong Prologue:** có khung ứng biến (bier-board) buộc sau lưng để Burden đọc được trên thân, hay nhận khung đầu tiên từ Brannoc ở A1 | Có bier-board (§2.9), vì vertical slice phải chứng minh Burden đọc được trên thân (Voc §21.1) |
| 12 | Áo của Gennet | Áo choàng len than bùn **dài và rộng** (§2.9), vì Gennet gầy gò (Bible §10.3) |
| 13 | Tên *Scourge* cần kiểm trước khi khóa (Voc §23 mục 2) | Không ảnh hưởng hình |
| 14 | **Erratum AD §8:** AD ghi chất liệu Brinecaller là "chất trắng đục", mâu thuẫn Voc §13.2 và §13.9 (xám xanh, không bao giờ trắng) | Sửa AD §8 thay vì chỉ thêm một dòng dẫn; hero theo Voc |
| 15 | **Osric's Lantern:** đèn xách sắt đơn giản 0,12H, một nắp chụp, không nan; xích ngắn sau hông phải; PB từ góc dưới phải khung kiệu; EX gộp vào đèn class; không có ở Prologue | Chọn chỗ treo này; xem §2.4 |
| 16 | **Yêu cầu cho brief NPC Frostwife:** mạng kéo tới trước che trán/mặt, áo choàng lông dài chấm đất; Zorya "ngoài bảy mươi", bím trắng | Cần để PS khác hẳn NPC (§9.2) |
| 17 | Sức chứa Soul có thể vượt 8 (Voc §12.2, §12.5, passive *Accounts*) trong khi hòm chỉ có 8 hốc | Hòm hiển thị tối đa 8 hốc; UI phải quyết cách thể hiện phần vượt |
| 18 | Tên hướng đổi: EX-A "Thợ săn đèn móc" (không còn sào), OS-B "Người giữ nợ", BR-B "Người lội bãi triều" | Đổi theo thiết kế mới |
| 19 | **Dấu tay BR ở màn chọn nghề:** Voc §3.2 ghi "tay nứt trắng vì muối"; muối của hero xám xanh (Voc §13.2, §13.9) | Vẽ bụi muối xám trắng ngả xanh nhạt trên mu bàn tay, không trắng thuần; người dùng có thể đổi về trắng nứt như Voc |
| 20 | **Palette v2 của hero (§1.3):** màu đặc trưng bão hòa mỗi nghề, bề mặt sạch, ánh sáng nghề thắp, đạo cụ cường điệu | Khóa palette v2 **sau khi thử trong scene** (năm nền act, nền Course, Seamless) và chạy lại quy tắc value §2.5 trên màu v2; riêng BR chưa có khối tối ≤ 30; còn phải quyết Prologue lineup và key art màn chọn nghề theo v2 hay giữ v1; v3 dùng lại đúng palette này (§1.4) |
| 21 | **Chọn hướng A hay B cho từng nghề** sau khi xem sheet v3 (và `TOPDOWN_A/B` v3 khi có ảnh) | Người dùng chọn từng nghề; giữ các cặp phải tách ở §3 (OS-A với BR-B, FL-B với EX-B) |
| 22 | **Đồ mặc bị vẽ lặp ở bốn góc v3** dù cũng vẽ riêng ở dải đáy: EX_A xẻng trên lưng, EX_B nỏ trên lưng, OS_A và OS_B liềm ở thắt lưng (§1.4, ghi chú QA) | Khi dựng 3D: mô hình thành **prop riêng** và **gỡ khỏi thân**; nếu muốn giữ chúng trên người thì phải quyết riêng chỗ đeo |
| 23 | **Bước sau khi chọn hướng:** T-pose cho Tripo | Theo `ashlar/pipeline/tripo/Agent.md` (concept → T-pose → tách ảnh từng góc → Tripo Studio trên trình duyệt → GLB); vũ khí cầm tay không nằm trên nhân vật trong T-pose, dựng riêng |
| 24 | **v3 bỏ hình H, hình ALT và dòng `BODIES`** của prompt: thân hiển thị (Thân 1 hay Thân 2, §2.1) không bị ép và thước 1,0H không còn trên sheet | Kiểm Thân 1 và Thân 2 cùng thước H ở bước T-pose và model, không còn ở sheet |
| 25 | **Theo dõi từ QA v3:** PS_B đầu đuốc vẫn hơi giống ngón tay xòe; BR chưa có khối tối L\* ≤ 30 (mục 20); ảnh 1672×941 nhỏ hơn 2048×1152 đã xin | Theo dõi; **Đề xuất:** sửa đầu đuốc PS_B ở prompt hoặc ở bước T-pose nếu người dùng chọn B |
| 26 | **TOPDOWN v3 cần sáu ảnh tham chiếu, công cụ `image_gen` chỉ nhận tối đa 5** (`TOPDOWN_B` đã lỗi hai lượt, không ra ảnh) | Đổi cách gắn tham chiếu (ví dụ ghép các sheet để gắn tối đa 5 ảnh, hoặc chia hai lượt) rồi chạy lại; chưa chọn cách |

---

## 13. Nguồn

- **Voc:** §0.2, §1.1–1.2, §2.3, §3.1–3.6, §5.5, §7.3, §8.9, §9.1–9.3, §10–§15 (mỗi chương: Identity, The trade, In the story, Presentation; riêng §10.4, §12.2, §12.4–12.5, §13.8, §14.2–14.3, §15.5, §15.9), §16.5–16.8, §17.1, §17.4, §17.6, §17.8–17.10, §17.12, §17.14, §18.1–18.8, §21.1–21.2, §23 (mục 1, 2, 15), §24.3.
- **Bible:** §4.6–4.7, §8.1–8.5, §10.1, §10.3, §11.2, §12.2–12.3, §13.1–13.3, §15.1, §16, §17.2–17.3, §21.4.
- **Cast:** §2.1 (The Loosed), §3.1 (Gennet, Tamsin), §3.5 (Hush-Herald), §3.7 (Kiln-Shaman), §4.1 (Pall-Wight, Exhumer tuần tra, Ser Hamon, Ignatia), §4.3 (Kneeler, Censer-Bearer, Turned Exhumer, Pyre-Risen), §4.4 (Halo Knight), §4.5–4.8 (Wallshade, Scribe-Shade, Chain-Hung), §5.2 (Salted Dead, Brine-Embalmer), §5.4 (Lye Priest), §5.6–5.7 (Salt Pillar, Salt-Clan), §6.1 (Zorya, Frostwives, Ice-Mourner), §6.7 (Remembrancer), §7.2–7.4 (Wrecker, Lantern-Lure, Lamplighter cultist, Lamplighter), §7.8 (Severin, Lamp-Bearer), §8.3.
- **LD:** §4.1, §4.10, §5.1–5.5, §6.4, §8.1–8.5, §9.6, §10.
- **AD:** §1, §3, §5, §7, §8, §11, §13, §14.
- **QCQ:** §1.1, §3.5 và các hàng U06, U07, U10, U11, U13, U14, F03, F04, F06, F08, F13, F15, F16, F17, P02, P09, P12, P16, P24, B15, D02, D06.
- Ledger được dẫn qua Voc: §4.3, §7.3, §7.5.
- Tài liệu nguồn tiếng Anh (Voc, Bible, Cast, LD) **không nằm trong repo**; chúng ở thư mục đính kèm của T3.
