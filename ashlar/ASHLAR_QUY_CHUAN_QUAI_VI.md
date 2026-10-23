# ASHLAR — Quy chuẩn quái (đề xuất sản xuất v1)

> **Trạng thái:** đề xuất sản xuất để art, animation và level design dùng làm blockout. **Không phải canon, chưa duyệt.** Mọi số đo và mã HEX trong file này là **đề xuất**, trừ khi dòng đó ghi rõ **[Canon]** hoặc **[LD]**. Không thay thế `ASHLAR_MONSTER_CHECKLIST_VI.md`: 116 ID và cột ✓ của checklist giữ nguyên.

**Đọc file này cùng:**
- `ASHLAR_MONSTER_CHECKLIST_VI.md`: danh sách 116 ID, cột "Cần xem" và ✓.
- `ASHLAR_ART_DIRECTION_VI.md`: style chung `stylized2`, mood theo từng map.

**Nguồn (đọc trực tiếp):**
- **Cast** = `ASHLAR - Bestiary and Cast by Act.md` (attachment `…-11f650a9-…-md.md`). Nguồn chính cho hành vi, thiết kế và "Takes after". Dẫn là `Cast §x`.
- **Bible** = `ASHLAR - World Bible and Story.md` (attachment `…-908fb3ec-…-md.md`). Dẫn là `Bible §x`.
- **LD** = `ASHLAR - Level Design and Atmosphere Guide.md` (attachment `…-930b780a-…-md.md`). Dẫn là `LD §x`.

**Nhãn dùng trong file:**
- **[Canon]**: số hoặc mô tả nằm trong Bible/Cast/LD và không phải gợi ý.
- **[LD]**: số hoặc mô tả lấy trực tiếp từ LD (cùng mức với [Canon], nêu rõ nguồn là LD). **[LD-P]** là phần LD tự ghi là Proposal.
- **[Quyết định người dùng]**: điều người dùng đã chốt trong phiên làm việc, không nằm trong tài liệu nguồn.
- **[LD-gợi ý]**: LD tự ghi là "starting swatches" hoặc tương tự, không phải mã cuối.
- **[Đề xuất]**: số đo, HEX hoặc quy đổi do tôi đề xuất để sản xuất. Có thể đổi.
- **[Conflict]**: nguồn mâu thuẫn hoặc checklist đã ghi "Cần xem". Không tự giải quyết.

---

## 0. Ba nguyên tắc đọc bảng

1. **Mô tả canon vẫn là gốc.** Ví dụ D01 "cao tới gối" (Cast §3.7) và W01 "to bằng con mèo" (Cast §2.1) là mô tả canon. Số trong bảng là **quy đổi đề xuất** từ mô tả đó, không thay mô tả.
2. **Số có sẵn trong nguồn thì dùng nguồn.** L01 Saint-Statue có tỷ lệ canon trong LD §4.2 ("ten to fifteen per cent larger than life") nên ghi `h 1.10–1.15H [LD]`, không thay bằng số "giant".
3. **Không ép mọi tham số là số mới.** Chỉ điền số đề xuất khi nguồn không cho tỷ lệ cụ thể.

---

## 1. Quy ước kích thước

### 1.1 Các đơn vị

| Ký hiệu | Nghĩa | Dùng cho |
|---|---|---|
| **H** | Chiều cao thân hero đứng trung tính, chưa tính mũ và vũ khí. Đây là **đơn vị chung**, không đổi sang mét hay pixel. | Mọi tỷ lệ |
| **h** | Chiều cao đứng từ gót đến đỉnh đầu (hoặc đỉnh phần cố định). | Quái hai chân |
| **V** | Độ cao vai (hoặc lưng cao nhất) khi đứng bốn chân. | Quái bốn chân (Cast: "vai") |
| **L** | Dài thân (không tính đuôi, trừ khi ghi rõ). Với rắn, giun và người-lươn chỉ dùng **L**, không dùng h. | Thân dài, quái bò, giun, rắn |
| **W** | Sải cánh, hoặc bề rộng ngang lớn nhất. | Quái bay, quái rộng |

**Quy tắc đo:**
- `h` tính thêm **phần cố định của cơ thể** như chuông (Bell-Head), vành hào quang (Halo Knight), mũ cao cố định.
- `h` **không tính** vũ khí cầm tay, lồng đèn cầm trên tay, cần đẩy, sào và xích, trừ khi nguồn bảo là phần cơ thể.
- Mũ rộng vành (Exhumer) tính vào W, không tính vào h.
- Với giáp và đồ tùy táng gắn cố định, tính vào h nếu thật sự cao thêm.

### 1.2 Mỏ neo canon đã có

| Quái | Mô tả canon | Nguồn | Quy đổi đề xuất |
|---|---|---|---|
| L01 Saint-Statue | "Ten to fifteen per cent larger than life" | [LD] §4.2; Cast §2.2: "slightly too large" | h 1.10–1.15H [LD] |
| D01 Hodling | "Knee-high" | [Canon] Cast §3.7 | h 0.25–0.30H [Đề xuất]: đỉnh đầu ở ngang gối |
| W01 Mortar-Rat | "The size of cats" | [Canon] Cast §2.1 | L 0.25–0.35H [Đề xuất] (thân, không tính đuôi) |
| W04 Mire-Sucker | "The size of cats", bụng căng | [Canon] Cast §3.3 | L 0.30–0.40H [Đề xuất] (phồng vì no máu) |
| D09 Hauler | "Colossal clay beasts" | [Canon] Cast §6.5 | V 1.50–2.00H [Đề xuất] |
| B05 Hospice Mother | "Colossal veiled figure"; "dozens of soft white hands" | [Canon] Cast §3.10 | h 2.50–3.00H [Đề xuất], có điều kiện camera |
| B07 Cassian | "A gaunt old man" | [Canon] Cast §4.8 | h gần người: 0.95–1.05H [Đề xuất]. Quy mô người được chấp nhận. |

### 1.3 Bảng nhóm chiều cao (không chồng, không hở)

Cả dải của nhóm lẫn dải số đo ghi cho từng quái đều là nửa mở `[a, b)`: giá trị đúng bằng `b` thuộc nhóm trên, và một dải ghi `a–b` của quái được đọc là `[a, b)`. Vì vậy dải chỉ chạm biên (ví dụ `1.60–2.00` hoặc `3.00–4.00`) nằm trọn trong **một** nhóm; chỉ khi dải thật sự vượt biên mới ghi nhiều nhóm (ví dụ `G3/G4`). **Ngoại lệ duy nhất:** cận trên của G6 (4.00) và của Ld5 (6.00) là đóng, vì không còn nhóm trên. Cùng một thang cho `h` và `V`.

| Nhóm | Dải (× H) | Ví dụ trong ASHLAR (đề xuất) |
|---|---|---|
| **G1 Tí hon** | [0.20, 0.45) | Hodling, Spark, Faceling, Keepsake Doll |
| **G2 Thấp / gù / bò** | [0.45, 0.80) | Kneeler (cúi), Grave-Wolf (V), Faceling Hag |
| **G3 Người** | [0.80, 1.10) | Shambler, Charnel Dead, hầu hết Faithful và Perfection-born |
| **G4 Cao** | [1.10, 1.60) | Halo Knight, Crystal-Sworn, Hush-Herald, Pall-Wight, Saint-Statue |
| **G5 Khổng lồ** | [1.60, 2.50) | Willow-Hulk, Mallet-Hod, Cradle-Warden, Rime-Brute |
| **G6 Quá khổ (boss)** | [2.50, 4.00] | Chỉ boss, chỉ cho `h` và `V`. Cận trên 4.00 đóng. Phải có điều kiện camera (xem 1.5) |

**Bảng dải chiều dài** (áp cho L và W):

| Nhóm | Dải (× H) | Ví dụ |
|---|---|---|
| **Ld1** | [0.20, 0.50) | Mortar-Rat, Mire-Sucker, Glass Wasp, Brine Leech, Corpse-Candle (đường kính ngọn) |
| **Ld2** | [0.50, 1.00) | Gibbet-Crow (W), Static Scarab (L), Bell-Bat (W) |
| **Ld3** | [1.00, 2.00) | Grave-Wolf (L), Plumb-Hound (L), Pillar-Crab (L) |
| **Ld4** | [2.00, 4.00) | Glass Stag (L), Hauler (L) |
| **Ld5** | [4.00, 6.00] | Chỉ giun khổng lồ (Brine-Worm mẹ, W09). Cận trên 6.00 đóng |

### 1.4 Quy ước theo loại quái

- **Hai chân:** dùng `h` và nhóm G.
- **Bốn chân:** dùng `V` theo cùng thang G, và `L` theo thang Ld.
- **Bay:** dùng `W` theo thang Ld, và `h` khi đứng.
- **Rắn, giun, người-lươn:** dùng `L` theo thang Ld. Không dùng h làm cỡ quái.
- **Tổ hợp (Pillar-Crab):** ghi cả hai, và đo phần chính. `V` luôn đo bằng thang G, `L` và `W` bằng thang Ld; không gắn nhãn G cho `W`/`L` hay nhãn Ld cho `h`/`V`. Kiln-Bull đã chuyển sang hai chân, dùng `h` theo quyết định 23/10/2026.

### 1.5 Boss theo camera arena (Proposal)

Cast và Bible không cho số cho boss to. Đề xuất sau, theo yêu cầu không ép to chỉ vì là boss:

- **Điều kiện 1:** dải G6 chỉ dùng khi toàn thân nằm được trong khung combat của camera iso, không cần cắt. Nếu thân che **hơn khoảng 40%** khung combat, dùng **cận dưới** của dải.
- **Điều kiện 2:** boss khổng lồ nên có "tay" hoặc "đuôi" (telegraph và đòn) là phần đo riêng. Phần thân có thể nhỏ hơn.
- **Điều kiện 3:** nếu một boss cần to hơn để đọc được cơ chế (ví dụ Cabinet), ghi lý do ngay trong bảng.
- Boss chỉ cần to hơn quái thường khi có lý do cơ chế. Không tự tăng vì "boss phải to".

---

## 2. Quy chuẩn chung cho toàn bộ quái

### 2.1 Style và mood

- **Style:** painterly, stylized, ít chi tiết, khối rõ. Dùng chuẩn mật độ `stylized2` (ASHLAR_ART_DIRECTION_VI.md) cho cả quái lẫn terrain [Quyết định người dùng].
- **Mood là riêng từng map.** Bảng palette theo act của LD §5.4 là **khung gợi ý**, không phải mood bắt buộc. Quái không mang mood của cả game. [Quyết định người dùng; art direction §7]
- **Map 1 hướng tới mood Act I của Diablo II.** Đây không tự động là toàn bộ Act I hay Prologue của ASHLAR. Phạm vi Map 1 chưa được xác nhận. [Quyết định người dùng]

### 2.2 Palette họ và palette act: hai lớp khác nhau

Mỗi quái có hai lớp màu, không được gộp:

1. **Tint họ** (quy chuẩn ở mục 3): nền vật liệu của họ. Đề xuất, không lấy từ LD.
2. **Accent act** (LD §5.4 [LD-gợi ý]): một màu bão hòa theo act (Act I đỏ poppy, Act II cam lò, v.v.). **Mỗi quái một accent** (LD §8.1).

Không dùng uniform color để "thắng" map. Một quái không được nhuộm toàn bộ theo màu act nếu làm mất tương phản với nền.

### 2.3 Đọc được trong combat

- **Giá trị trước màu.** Test mọi khu vực ở grayscale với mật độ combat đầy đủ. Nếu hero, quái và telegraph không tách nhau bằng độ sáng, sửa độ sáng trước khi sửa màu. [LD §8.1]
- **Rim light cho mọi thứ có thể gây sát thương.** Rim lạnh ở khu ấm, rim ấm ở khu lạnh. [LD §8.1]
- **Silhouette trước.** Quái phải nhận được bằng bóng ở khoảng cách chơi. Discarded đọc bằng sừng, Unlaid đọc bằng tư thế, Perfection-born đọc bằng chất liệu của Perfection. [LD §8.1; Cast §12]
- **Telegraph đọc được không cần màu.** Hình dạng và thời gian trước; màu sau. Vòng cho vùng, đường cho lao, nón cho quét, xung cho nhịp. [LD §8.2]
- **Elite và cảnh báo:** kết hợp nhiều tín hiệu không màu (hình dạng, âm thanh trước, nhịp animation, rim light, vị trí). Không khóa màu rarity mới. Các màu rarity của Bible §16 (Rubble xám, Hewn xanh, Dressed vàng, Graven cam, Hallowed vàng kim) giữ nguyên, và LD §5.5 đã cảnh báo chúng đụng act palette.

### 2.4 Màu không được đụng nhau

- **Trắng muối (Act III) và trắng Seamless (X01, Seamless):** hai trắng phải khác nhau. Trắng muối là **matte, bụi, mép dơ, không phát sáng**. Trắng Seamless là **phát sáng, bloom, không texture** (LD §5.4). [Yêu cầu khi làm asset: LD §5.4 đã phân biệt rõ hai trắng; chỉ cần giữ đúng chất trắng khi làm X01.]
- **Lodge không bao giờ tự phát sáng.** Mason-work không glow, chỉ được chiếu bởi nguồn khác. [LD §4.1, §5.1] Không tự gán lửa, mắt sáng hay viền phát sáng cho L01–L04. Đây là ràng buộc cứng.
- **Đỏ chỉ là máu** trong Act III ([LD §5.4], "any red except blood") nên quái Act III không dùng đỏ làm tint họ. Accent `#9E1B1B` (U13, D06, F10, F11, F13, P10, B10) **chỉ dùng ở dạng máu** (vết, giọt, vệt), không dùng cho vật liệu, mắt hay phần phát sáng.

---

## 3. Quy chuẩn theo họ

Mỗi họ có: vật liệu, tint đề xuất, accent theo act, silhouette, mood, feel, motion/behavior. **Hành vi dùng Cast và checklist làm chuẩn; phần "motion" là đề xuất animation, không phải hành vi canon.**

### 3.1 Unlaid (16 thường; boss B01 ở mục 3.9)

- **Vật liệu:** vải liệm, xương ngả vàng, bùn, rong, đất khô.
- **Tint (đề xuất):** vải liệm `#8C8577`; bùn `#4A3526`; rong ẩm `#5E6B5A`; xương `#D8CCB0` chỉ cho xương lộ.
- **Accent theo act:** Act I `#B3262A` (hoa anh túc; **Prologue không có accent**: palette Prologue là palette Act I ban đêm, điểm ấm đầu tiên là đèn của Gennet, LD §10); Act II `#E2622B` (lửa, Pyre-Risen); Act III `#9E1B1B` (máu trên muối); Act IV `#7A3B47`; Act V `#F2C14E` (lồng đèn, chỉ dùng ở vài điểm).
- **Silhouette:** tư thế. Gập gối, vai rũ, hàm buộc vải, tay dài bất thường. Charnel Dead có một tay dài hơn một tay.
- **Mood:** thân quen, ẩm, mục nát. Âm thanh báo trước là gõ từ trong quan tài.
- **Feel:** chết không yên, bị kéo về phía sống.
- **Motion (đề xuất):** trồi lên từng đợt, bước nặng. Pyre-Risen bốc lửa, không nhảy.

### 3.2 Discarded (16 thường; boss B03, B12 dùng trong 3.9)

- **Vật liệu:** đất nung, men nứt, muội, xỉ, dụng cụ thợ Mason cướp được.
- **Tint (đề xuất):** đất nung `#9C4A2C`; men nứt `#5A2A1E`; muội `#17151A`.
- **Đèn [LD §5.1, §14.6]:** ánh **đỏ cam phập phồng như ống bễ**, từ trong vết nứt (LD §14.6: "Discarded kiln-light pulses red-orange against blue snow"). Khe nứt dùng `#E2622B` (cam lò) ở mọi act, kể cả Act IV; không đổi sang hổ phách. [Đề xuất HEX]
- **Silhouette:** sừng, chân dê, bụng vuông, mũ hoặc khung không đối xứng.
- **Mood:** đáng thương và nguy hiểm, không hài. [LD §11.8, ghi chú D01]
- **Feel:** đám đông đất nung đang đếm gạch bằng tiếng Mason.
- **Motion (đề xuất):** bầy rít và nhảy; khi một con vỡ thì cả bầy hoảng rồi tụ lại (Cast §3.7).

### 3.3 Warped (18 thường)

- **Vật liệu:** lông, da, vảy, cánh, muối, thủy tinh (Glass Wasp), vỏ và tơ (Shroud-Spinner).
- **Tint (đề xuất):** lông và da `#6B5D4B`; xám vữa `#A39F93` (Mortar-Rat); xám lông `#8E8A80`; đầu hói hồng `#A8686A` chỉ ở Gibbet-Crow. Tránh đỏ rộng để không nhầm với máu (Act III).
- **Silhouette:** theo loài, đọc được bằng tỷ lệ. Mortar-Rat không lông, gai vữa. Hush-Wolf nửa người nửa sói. Pillar-Crab mang vỏ người.
- **Mood:** thú "hơi sai". Âm thanh báo trước theo loài (Cast §12; checklist mục 3).
- **Feel:** động vật bị nhà ngục bên dưới biến đổi. Không phải sinh vật có người.

### 3.4 Faithful (17 thường)

- **Vật liệu:** vải bố, vải dầu, áo lễ đen, sắt, halo sắt, kính, mặt nạ.
- **Tint (đề xuất):** vải bố `#6B5F4E`; áo lễ đen `#1F1D22`; sắt `#5A5F66`.
- **Accent theo act:** Act II `#D9A441` (nến vàng) hoặc `#E2622B` (lửa thánh); Act III `#9E1B1B` (máu) cho Lye Priest; Act V `#F2C14E` cho Lamplighter.
- **Silhouette:** trang phục và mũ. Kneeler (cúi, đầu gối dính phiến đá). Bell-Head (chuông trên đầu). Halo Knight (hào quang gai hướng vào trong, Cast §4.4 "signature").
- **Mood:** người thật và đáng sợ vì tin. Âm thanh báo trước là thánh ca, chuông, lời cầu.
- **Feel:** giáo phái và lính, không phải quái.

### 3.5 Perfection-born (27 thường; boss ở 3.9)

Mỗi Perfection có chất liệu và âm thanh riêng. **Đọc silhouette bằng chất liệu** (LD §8.1).

| Perfection | Chất liệu | Tint (đề xuất) | Accent theo act | Âm thanh báo trước |
|---|---|---|---|---|
| **Mercy (Eleisa)** | Vải lanh, bông, bọc ngủ | Linen `#E8E1D0` | Poppy `#B3262A` | Bài ru nhịp 3/4 (Cast; checklist §5) |
| **Devotion (Latreus)** | Sắt, xích, chuông, nến | Sắt `#4B4F55` | Vàng nến `#D9A441` hoặc cam lò `#E2622B` | Chuông (checklist §5) |
| **Purity (Kathara)** | Thủy tinh muối, lửa không màu | Salt-glass `#CFE3E2`; teal `#3F8C88` | Đỏ máu `#9E1B1B` | Muối kết tinh lách tách, rồi im lặng |
| **Memory (Mnemora)** | Lọ thủy tinh, dây, kim, ngăn kéo | Lọ `#B9C7C2`; gỗ bảo quản `#8A6A4A` | Garnet `#7A3B47`, vàng cũ `#B59A5B`, lục `#3F6B5A` | Tên thì thầm, hộp nhạc |
| **Hope (Elpis)** | Đèn lồng, buồm rách, nước | Biển xanh `#2F5A52`; đen ướt `#121417` | Vàng đèn `#F2C14E` | Còi sương mù |

**Quy tắc theo Perfection:**
- **Ánh sáng của Perfection đứng yên, không lập lòe.** LD §5.1. Đây là quy tắc sáng, không phải màu.
- **Mercy linen và trắng muối (Purity):** không dùng cùng một tint. Linen mềm, mờ; muối có ánh thủy tinh. Bốn "trắng" phải có HEX khác nhau: linen `#E8E1D0` (Mercy), muối `#EDEAE0`, hồng-trắng `#E8C9CC` (Blanched P10), Seamless `#F4F1E8` (X01, B17).
- **Memory:** mỗi Preserved có một accent jewel khác nhau, để không thành đàn đồng màu.

### 3.6 Lodge's servants (4 thường)

- **Vật liệu:** đá xám đã đẽo, vữa, sắt dụng cụ.
- **Tint (đề xuất):** đá xám `#7F7F7A`; đá xám lạnh `#5C6063`.
- **Accent:** **không có**. Lodge không phát sáng (LD §4.1). Đây là ngoại lệ có chủ ý cho quy tắc "mỗi quái một accent" (LD §8.1, mục 2.2 và tiêu chí #6); Lodge đọc bằng silhouette đá và rim light.
- **Silhouette:** góc vuông, đường thẳng đứng như dây dọi, không trang trí, quá cỡ một chút (LD §4.1).
- **Mood:** phán xét và lạnh. Âm thanh báo trước: đá nghiến, tiếng đục *tock*, nhạc tắt hẳn (LD §6.4–6.5).

### 3.7 The Perfect (1)

- **Vật liệu:** trắng hoàn hảo, không mặt, không texture (LD §5.4 "Seamless").
- **Tint (đề xuất):** trắng `#F4F1E8`; vàng `#F4D58D`; xanh trời `#8EC9F0`, có điều kiện (xem 2.4).
- **Silhouette:** người không mặt, di chuyển đồng bộ.
- **Mood:** im lặng. Âm thanh báo trước là im lặng hoàn toàn (Bible §14.2).

### 3.8 Mason và chưa có họ

- **Mason boss (B09 The Chisel):** cùng tint Lodge `#7F7F7A`. Không glow. Telegraph là dây phấn ngang sàn (LD §13.8, Proposal). Đây là boss, không phải Lodge's servant.
- **Chưa có họ (B04 The Willow Bride, B17 The Unbroken):** xem mục 3.9. Không gán họ trong file này.

### 3.9 Boss (17)

Mục này gom boss theo họ. Số đo và palette ở bảng chi tiết mục 4.

- **Unlaid:** B01 Sexton's Dog (mini-boss).
- **Discarded:** B03 Ember-Pot (tùy chọn), B12 Hod-Mother.
- **Perfection-born:** B02 Lullaby Man (Mercy), B05 Hospice Mother (Mercy), B06 Choir of Nails (Devotion), B07 Brother Cassian (Devotion), B08 Pillar-Maker (Purity), B10 Kathara (Purity), B11 Glass Stag (Memory), B13 Taxidermist (Memory), B14 Cabinet (Memory), B15 Lamplighter (Hope), B16 Severin (Hope).
- **Mason:** B09 The Chisel.
- **Chưa có họ:** B04 The Willow Bride, B17 The Unbroken.

---

## 4. Bảng chi tiết 116 ID

**Cách đọc cột:**
- **Kích thước:** số đề xuất theo mục 1 (h, V, L, W), kèm nhóm. Ghi `[LD]` hoặc `[Canon]` nếu nguồn có số.
- **Màu key:** tint họ + accent theo act. Mã HEX là đề xuất.
- **Silhouette · feel:** đọc được bằng bóng và cảm xúc.
- **Hành vi (canon rút gọn):** lấy từ Cast và checklist. Không phải đề xuất animation.
- **Nguồn:** Cast §, LD §, Bible §.

### 4.1 Unlaid (U01–U16)

| ID | Quái (bậc) | Act · khu | Kích thước đề xuất | Màu key | Silhouette · feel | Hành vi (canon) | Nguồn |
|---|---|---|---|---|---|---|---|
| U01 | Shambler (→ Rot- → Mire- → Plague-) | Prologue · I (Rook's Weir cho Mire-) | h 0.90–1.00H (G3). Bậc cao bulk +10% | Vải `#8C8577`, bùn `#4A3526`; accent Act I `#B3262A` (Prologue: không accent, LD §10) | Hàm buộc vải, đồng xu trên mắt; **thảm, gần** | Chậm, vụng, nhưng túm và giữ. Gõ nắp quan tài trước khi trỗi dậy | Cast §2.1, §3.2, §3.4 |
| U02 | Charnel Dead (→ Guard → Ossuary Guard → Elder Charnel) | Prologue · I · II (Bell Catacombs) | h 0.90–1.00H (G3). Tay dài hơn tay kia | Xương `#D8CCB0`, áo mục `#4A3526`; accent act (Prologue: không accent, LD §10) | Sọ phụ nữ trên khung đàn ông; **lệch, ghép** | Kiếm và khiên. Tự ráp lại một lần, trừ khi sọ bị đập vỡ. Vẫn lẩm bẩm Rite of Laying | Cast §2.2; Bible §14.2 |
| U03 | Charnel Bowman | I (nghĩa trang) | h 0.90–1.00H (G3) | Xương, cung gỗ thủy tùng `#5A4A36` | Cung và ống tên; **nhỏ, đều** | Kite ở tầm xa (vừa lùi vừa bắn để giữ khoảng cách), đi theo cặp | Cast §3.2 |
| U04 | Charnel Ghoul | I (nghĩa trang) | h 0.90–1.00H đứng; V 0.45–0.60H bốn chân; L 1.10–1.40H | Xác `#6E6A5C`; accent Act I | Tay dài, hàm há rộng; **bò, nhọn** | Nhanh, nhảy vồ. Ăn xác để hồi máu, lấp chỗ linh hồn đã mất | Cast §3.2 |
| U05 | The Swollen | I (Night Fens, Rook's Weir, Willow Mere) | h 0.90–1.00H; W 0.80–1.00H khi phình | Xác xanh trắng `#5E6B5A`; accent Act I | Bụng căng, da như mặt trống; **tròn, nặng** | Lừ đừ tiến tới rồi nổ, tung ra lươn độc biết cắn | Cast §3.3, §3.4 |
| U06 | Pall-Wight | II (Pilgrim Road) | h 1.10–1.20H (G4, do giáp cao); quan tài L 0.80–1.00H | Giáp đen `#1F1D22`, đinh bạc `#A8A9AD`; accent Act II `#E2622B` | Giáp đen đóng đinh bạc, **cõng quan tài** | Chậm, giáp dày, đập khiên. Còn nửa máu thì nắp quan tài bật mở, thả dơi hoặc xác | Cast §4.1 |
| U07 | Pyre-Risen | II (Stair of Penitence, Cathedral đang cháy) | h 0.90–1.00H (G3). Lửa không tính vào h | Xương đen `#17151A`; lửa accent Act II `#E2622B` | Xương cháy đen, xích chảy lủng lẳng; **bốc lửa, sáng** | Đốt cháy nền, nổ lửa khi chết. Nước và muối dập được | Cast §4.3; [Conflict: LD §12.8 không liệt kê ở Cathedral cháy] |
| U08 | Charnel Chanter | II (Bell Catacombs, Scriptorium) | h 0.90–1.00H (G3). Áo chùng mục | Áo `#4A3526`, xương `#D8CCB0`; accent Act II `#D9A441` | Áo chùng dài; **đứng sau, nhỏ** | Bắn phép băng và lửa mộ từ hàng sau. Lẩm bẩm Rite of Laying | Cast §4.5; [Proposal của LD §12.6: chuông làm thức dậy] |
| U09 | Ossuary-Glutton | II (Bell Catacombs) · V (the Course) | h 0.95–1.05H (G3). Dính với đống xương | Xác `#6E6A5C`, xương `#D8CCB0` | Bụng có miệng thứ hai; **phình, dính** | Ăn xác rồi phun mảnh xương | Cast §4.5, §7.9 |
| U10 | Wallshade | II (Bell Catacombs) · IV (Archive of Faces) · V (Sunken Chapel, the Course) | h 0.90–1.00H; **trong mờ**, alpha thấp | Vữa `#A39F93`; accent act | Nửa trong, nhỏ giọt vữa; **mặt ép kính** | Xuyên tường, hút tài nguyên của hero, lúc hiện lúc ẩn | Cast §4.5, §6.7, §7.9 |
| U11 | Scribe-Shade | II (Scriptorium) | h 0.90–1.00H (G3). Cúi như đang viết | Mực `#17151A`; accent Act II `#D9A441` | Đen như mực, cầm bút lông; **cúi, hẹp** | Ném mực gây mù; "viết lại" nền dưới chân hero thành bẫy | Cast §4.6; [Conflict: không có trong bảng họ Bible §14.2] |
| U12 | The Pressed | II (Kneeling Vault, sau boss) · V (the Course) | h 1.20–1.50H (G4); W 1.00–1.30H | Thịt ép `#8A6A5A`, xương `#D8CCB0` | Khối nhiều thân ép như gạch; **mặt và tay lộ hai sườn** | Chậm và nặng, bò ra từ chỗ Tường vỡ. Bị phá thì thả Wallshade ra | Cast §4.8, §7.9; [Tên gần P17] |
| U13 | Salted Dead | III (Wreck Fields) | h 0.95–1.05H (G3) | Vải buồm `#B8AF9A`, muối `#EDEAE0`; accent Act III `#9E1B1B` (máu) | Vải buồm, vỏ muối, mắt muối thủy tinh; **cứng, trắng xỉn** | Chậm; thở ra nước muối gây ngạt | Cast §5.2 |
| U14 | Brine-Embalmer | III (Wreck Fields) | h 1.10–1.20H (G4), tu sĩ cao | Vải buồm nứt `#B8AF9A`, muối `#EDEAE0` | Vải cứng đã nứt; **cao, thẳng** | Dựng lại Salted Dead đã ngã; phun nước muối | Cast §5.2 |
| U15 | Frostbound Host | IV (Frozen Army) | h 0.95–1.00H (G3). Đứng giữa bước chạy | Băng `#6F8FA8`, da xanh băng; accent Act IV `#7A3B47` | Đóng băng giữa bước; **vũ khí dính tay** | Đứng dậy lại sau khi bị giết, trừ khi bị đập vỡ bằng lửa hoặc tên được ghi vào Book of Laid Names | Cast §6.1; [LD §14.2: chỉ vài con thoát ra] |
| U16 | Wrack-Dead | V (Wrack-Woods, Dawn Ship, Long Sands) | h 0.95–1.05H (G3); W 1.00–1.20H (giáp ván thân tàu) | Rong `#5E6B5A`, hà xám `#8E8A80`; accent Act V `#F2C14E` (chỉ đèn) | Giáp ván tàu, neo, cột buồm; **rộng, đọng nước** | Sương kéo tới và còi sương mù vang trước khi chúng đến. Kéo hero bằng xích neo; vết thương gây thối | Cast §7.3; [còi thay chuông, Cast §12] |

### 4.2 Discarded (D01–D16)

| ID | Quái (bậc) | Act · khu | Kích thước đề xuất | Màu key | Silhouette · feel | Hành vi (canon) | Nguồn |
|---|---|---|---|---|---|---|---|
| D01 | Hodling (→ Ember-Hod → Slag-Hod → Kiln-Hod) | I (Flint Delvings) · III (Old Salt Mine, muối trắng) · IV (siege, sương) | h 0.25–0.30H [Đề xuất từ "knee-high" Canon] (G1). Bậc cao +5% | Đất nung `#9C4A2C`, men nứt `#5A2A1E`; khe `#E2622B` | Cao tới gối, sừng ngắn, vũ khí bay thợ hồ; **đông, lách cách** | Đi bầy, rít. Một con vỡ thì cả bầy hoảng, rồi tụ lại | Cast §3.7; LD §11.8 |
| D02 | Kiln-Shaman | I · III · IV (đi cùng D01) | h 0.30–0.40H (G1) có nồi; nồi cõng lên thêm 0.10–0.15H | Mặt muội `#17151A`, nồi `#5A2A1E`; khe `#E2622B` | Nồi than khói trên lưng; **nhịp sáng phập phồng** | Nung lại Hodling đã vỡ; phun than hồng | Cast §3.7; LD §11.8 |
| D03 | Kiln-Bull | I (Flint Delvings) · IV (siege, húc cổng) | **h 1.40H (G4), hai chân — người dùng chốt 23/10/2026**, thay V/L cũ | Đất nung `#9C4A2C`; mũi phát sáng `#E2622B` | Hai chân, tay lớn, thân bulky; sừng, lỗ mũi sáng, **tiếng vó trước hình** | Lao ra từ bóng tối; tiếng vó nghe thấy trước | Cast §3.7, §6.5; quyết định người dùng 23/10/2026 |
| D04 | Tithe-Thief | Mọi act, hiếm (Flint Delvings lần đầu) | h 0.35–0.44H (G1, phần cao). Có túi | Đất nung `#9C4A2C`, túi vải `#6B5F4E`; accent Act nào cũng được | Béo, lảo đảo, bao tiền; **tròn, nhỏ** | Chạy trốn vào khe Tường nếu không bắt kịp; chết thì tung loot | Cast §3.7, §8.1; LD §7.7 |
| D05 | Hornclan Cinder-Clan (Raider → Slinger → Chanter → Breaker) | II (Pilgrim Road) | h 0.90–1.09H (G3); Breaker 1.10–1.20H (G4) | Đất đen muội `#17151A`, vết nứt đỏ than `#E2622B` | Đầu dê, chân dê, sừng móc, cuốc và máng; **cỡ người, dáng dê** | Đánh theo toán: Raider cận chiến, Slinger ném đá nóng, Chanter dùng phép lửa. Hăng hơn gần lửa. Chanting số đếm, không hô chiến | Cast §4.1, §12; [Conflict: bậc giữa chưa có tên] |
| D06 | Hornclan Salt-Clan | III (Old Salt Mine) | h 0.95–1.05H (G3) | Men trắng xương `#EDEAE0`; sừng mòn; accent Act III `#9E1B1B` | Sừng mòn vì cuốc muối; **trắng, khô** | Raider và Slinger như D05. Chanter ném bụi muối gây mù | Cast §5.7 |
| D07 | Hornclan Rime-Clan | IV (Rimewood, siege) | h 0.95–1.05H (G3). Băng trên sừng | Men xanh sương `#6F8FA8`; băng `#D8E7EF`; accent Act IV `#7A3B47` | Băng treo trên sừng; **xanh lạnh** | Raider và Slinger như D05. Chanter dùng phép băng | Cast §6.2 |
| D08 | Taskmaster | IV (siege) | h 1.10–1.25H (G4) | Đen `#1F1D22`, xích `#5A5F66` | Đốc công cao, roi xích, **sổ cái xích ở thắt lưng** | Quất bầy gần đó vào cơn cuồng (đánh nhanh hơn), gào số đếm | Cast §6.5 |
| D09 | Hauler | IV (siege) | V 1.50–2.00H (G4/G5); L 3.00–4.00H (Ld4). Kiệu tính riêng | Đất sét `#9C4A2C`, ách sắt `#5A5F66` | Thú thồ khổng lồ, ách giáp, **kiệu Hodling trên lưng** | Đơn vị công thành; ngã thì Hodling nhảy ra tràn tới | Cast §6.5; [Canon "colossal"] |
| D10 | Gutter-Wing | IV (siege) · V (the Course) | h 0.90–1.10H đứng; W 1.40–1.80H (Ld3) | Xám đá `#7F7F7A`, men xám; khe `#E2622B` (ở V: trắng ngà của Course) | Cánh gargoyle, đậu trên mái như tượng; **đứng im, tượng** | Bổ nhào từ mái xuống | Cast §6.5; [Conflict: dáng trùng L03] |
| D11 | Spark | IV (siege) · V (the Course) | h 0.20–0.30H (G1) | Đất nung `#9C4A2C`; sáng `#E2622B` | Tí hon, phát sáng, **lách tách** | Dịch chuyển chớp nhoáng quanh hero, ném than | Cast §6.5, §7.9 |
| D12 | Hornclan Slag-Clan | V (the Course, tầng sâu chạm Spoil) | h 1.00–1.10H (G3) | Men đen `#17151A`; vết nứt nóng chảy `#E2622B` | Men đen, vết nứt nóng chảy; **đen, sáng ở vết** | Chanter dùng phép lửa và độc | Cast §7.9 |
| D13 | Mallet-Hod | V (the Course) | h 1.80–2.20H (G5). Vồ làm riêng, không tính vào h | Đất nung `#9C4A2C`; vồ đá `#7F7F7A` | Vồ to như cánh cửa; **nặng, thấp** | Đập đất, tạo sóng xung kích | Cast §7.9 |
| D14 | Slag-Knight | V (the Course) | h 1.10–1.20H (G4) | Giáp xỉ `#5A2A1E`; khe `#E2622B` | Giáp xỉ đã nguội, khe rực; **giáp dày, dẹt** | Chiến binh giáp nặng, có aura gây bỏng | Cast §7.9 |
| D15 | Mocker | V (the Course) | h 0.95–1.05H (G3). Mũ mitre cao +0.05H cố định | Lễ phục ăn cắp `#1F1D22`, stole `#B59A5B` | Mũ mitre, khăn stole, **sổ cái** | Tụng Rite of Laying méo mó; phép lửa, sét và nguyền | Cast §7.9 |
| D16 | Kiln-Lord | V (the Course) | h 2.00–2.40H (G5); W 2.50–3.00H cánh xỉ (Ld4) | Đất nung `#9C4A2C`; ngực lò `#E2622B`; xỉ `#5A2A1E` | Ngực là lò, cánh xỉ, sừng như ống khói; **cửa lò mở trước khi phun** | Elite nặng: thở lửa, quạt cánh. Xé linh hồn khỏi các đoạn Tường đang hỏng | Cast §7.9, §12; [Canon: "towering"] |

### 4.3 Warped (W01–W18)

| ID | Quái | Act · khu | Kích thước đề xuất | Màu key | Silhouette · feel | Hành vi (canon) | Nguồn |
|---|---|---|---|---|---|---|---|
| W01 | Mortar-Rat | Prologue · II (Scriptorium) · [Cast §11.1 ghi có ở I] | L 0.25–0.35H [Đề xuất từ "size of cats", Canon] (Ld1). Gai vữa không tính | Xám vữa `#A39F93`, gai vôi `#D8CCB0` | Chuột trụi lông, gai vữa; **đàn, nhỏ** | Đi bầy; lắc gai rồi bắn ra thành loạt | Cast §2.1, §4.6; [Conflict: Cast §11.1 ghi Act I] |
| W02 | Gibbet-Crow | I (nghĩa trang) · II (Pilgrim Road, Stair; ăn ở giàn thiêu) | W 0.70–0.90H (Ld2); L thân 0.40–0.50H (Ld1) [Đề xuất, "oversized"] | Lông hắc ín `#17151A`; đầu hói hồng `#A8686A` | Quạ quá cỡ, đầu hói hồng, lông bết; **đen, đàn** | Bổ nhào theo đàn, mổ, rút lui, quay lại | Cast §3.2, §4.1, §4.3 |
| W03 | Hush-Wolf | I (Night Fens, Poppy Reach) | h 0.90–1.00H đứng (G3); V 0.60–0.70H bốn chân; L 1.20–1.40H | Lông `#6B5D4B`, áo ngủ rách `#A9B1A6` | Sói nửa người, lêu khêu, mắt nhắm; **người-sói** | Săn theo mùi, theo bầy; tiếng hú là bài ru | Cast §3.3, §3.5; [Conflict: người biến hình, xếp Warped] |
| W04 | Mire-Sucker | I (Night Fens) | L 0.30–0.40H (Ld1), bụng phình khi no | Thân `#4A3526`, bụng đỏ `#B3262A` | Ruồi phình, bụng đỏ căng; **tròn, bay** | Bay vào hút máu, no thì nổ | Cast §3.3 |
| W05 | Corpse-Candle | I (Night Fens, Rook's Weir, Willow Mere) · V (Wrack-Woods) | Đường kính ngọn 0.30–0.50H (Ld1); lơ lửng h 0.50–0.80H trên nước | Xanh nhạt `#D8E7EF` (không dùng trắng ngọn Widower's Light `#F8F6EE`); mặt mờ `#A9B1A6` | Ngọn lửa nhạt, khuôn mặt mờ trong; **đứng yên, đẹp** | Trôi và dụ; phóng sét, hút tài nguyên | Cast §3.3, §7.3; LD §11.4; [Conflict: không phải động vật] |
| W06 | Willow-Hulk | I (Willow Mere) | h 1.60–1.80H (G5); rễ trồi, không tính h | Rễ `#4A3526`, than bùn `#17151A`, xương `#D8CCB0` | Khối rễ liễu, thòng lọng cổ; **to, rối** | Đấm chậm và nặng; rễ trồi lên dưới chân hero | Cast §3.6; [Conflict: rễ và xương, không phải động vật] |
| W07 | Shroud-Spinner | I (Flint Delvings, Garden of Hush) | W (sải chân) 1.00–1.30H; thân L 0.30–0.40H | Nhện nhạt `#A39F93`; tơ `#D8CCB0` | Nhện nhạt quấn xác như vải liệm; **nhiều chân, mạng** | Mạng nhện làm chậm; độc; đẻ túi trứng trong xác | Cast §3.7, §3.9; LD §8.4 (tùy chọn) |
| W08 | Bell-Bat | II (Bell Catacombs) | W 0.80–1.00H; thân L 0.25–0.30H | Lông `#17151A`; mắt `#B59A5B` | Dơi lớn đậu tháp chuông; **rít như chuông nứt** | Đi bầy; tiếng rít làm choáng ngắn | Cast §4.5 |
| W09 | Brine-Worm (mẹ và giun con) | III (White Road) | Mẹ L 5.00–6.00H (Ld5), đường kính miệng 0.40–0.50H; con L 0.80–1.20H (Ld2/Ld3) | Muối `#EDEAE0`, thân xám `#8E8A80`; răng thủy tinh | Giun muối nhạt, miệng tròn nhiều vòng răng; **dài, nhiều đốt** | Đào hang và phục kích; phun nước muối. Mẹ đẻ ổ trứng trong muối | Cast §5.1; [Canon có hai dạng] |
| W10 | Salt-Kite | III (White Road) | W 1.40–1.80H (Ld3); L 0.60–0.80H | Muối `#EDEAE0` trên cánh, lông `#8E8A80` | Kền kền bạc, muối đóng cánh; **trắng, lượn** | Lượn vòng rồi bổ xuống con mồi bị thương | Cast §5.1 |
| W11 | Pillar-Crab | III (White Road, Garden of Pillars) | L 1.60–2.00H (Ld3); vỏ muối cao 0.80–1.00H | Vỏ muối `#EDEAE0`; chân `#8E8A80`; người trong vỏ `#CFE3E2` | Ốc mượn hồn khổng lồ, mang người hóa muối làm vỏ; **dày, bò** | Nhảy ra phục kích. Vỏ vỡ thì brine-wraith (P12) thoát ra | Cast §5.1, §12; LD §13.7 (không có trẻ em trong cột muối) |
| W12 | Glass Wasp | III (White Road, Old Salt Mine) | L 0.30–0.40H; W 0.40–0.50H | Thủy tinh muối `#CFE3E2`; viền `#3F8C88` | Ong bắp cày trong suốt; **bầy, nhọn** | Bay thành bầy đốt | Cast §5.1, §5.7 |
| W13 | Coilborn (+ Coil-Seer) | III (Wreck Fields, Ship's Heart) | L 2.50–3.50H (Ld4, gồm đuôi); thân người h 0.90–1.00H; Coil-Seer h 1.00–1.10H + gậy | Vảy `#3F8C88`, vây `#2F5A52`; gậy san hô `#B59A5B` | Người-lươn: vảy trơn, vây, mắt không mí; **đuôi, cuộn** | Siết và cắn. Coil-Seer dùng phép nước muối | Cast §5.2, §12; [Cast: tránh tay chân gắn trên thân rắn như D4 Nangari] |
| W14 | Static Scarab | III (Wreck Fields, Ship's Heart) | L 0.50–0.70H (Ld2) | Vỏ pha lê `#CFE3E2`; sáng `#F2C14E` khi tích điện | Bọ cánh cứng pha lê; **sáng khi bị đánh** | Phóng sét khi bị đánh | Cast §5.2 |
| W15 | Salt-Burrower | III (Old Salt Mine) | V 0.60–0.80H; L 1.40–1.80H (Ld3); mõm xẻng | Lông xám `#8E8A80`; mõm `#A39F93` | Thú đào hang mù, mõm như xẻng; **thấp, dài** | Trồi lên từ dưới chân hero | Cast §5.7 |
| W16 | Rime-Brute | IV (Frozen Army, Rimewood) | h 1.70–2.10H (G5); W 1.20–1.50H khi dang tay | Lông trắng `#D8E7EF`, băng `#6F8FA8` | Vượn trắng lông dày, đeo xác băng; **to, đứng thẳng** | Đập phá và ném khối băng | Cast §6.1, §6.2 |
| W17 | Grave-Wolf | IV (Frozen Army, Rimewood) | V 0.55–0.65H (G2); L 1.10–1.30H (Ld3) | Lông `#6F8FA8`, sương `#D8E7EF` | Sói gầy đóng sương, béo nhờ ăn xác; **gầy, xám** | Săn theo bầy | Cast §6.1 |
| W18 | Wreck-Gull | V (cliffs and lighthouses) | W 1.30–1.60H (Ld3); L 0.60–0.80H; mỏ đỏ | Lông `#E8EEEA`; mỏ `#9E1B1B` | Mòng biển lớn, mỏ đỏ; **trắng, đàn** | Bổ nhào theo đàn | Cast §7.2 |

### 4.4 Faithful (F01–F17)

| ID | Quái | Act · khu | Kích thước đề xuất | Màu key | Silhouette · feel | Hành vi (canon) | Nguồn |
|---|---|---|---|---|---|---|---|
| F01 | Body-snatcher | I (nghĩa trang; side quest *The Mortsafe Thieves*) | h 0.95–1.05H (G3) | Áo khoác `#1F1D22`; bao `#6B5F4E`; accent Act I `#B3262A` (dây) | Bao, dây, xẻng ngắn; **nhanh, lén** | Chạy khi bị phát hiện; bị dồn vào góc thì đánh bẩn | Cast §3.2 |
| F02 | Poppy Nurse | I (Poppy Reach, Garden of Hush) | h 0.95–1.05H (G3). Khăn trùm không tính | Khăn trắng `#E8E1D0`, thêu hoa `#B3262A`; kim `#D8D8DC` | Khăn trùm thêu hoa anh túc, **kim bạc dài**; dịu | Caster và healer: ru hero ngủ chốc lát, chữa quái khác | Cast §3.5, §3.9; LD §11.6 (không ác; biết hát). [Conflict: Bible §6.3 xếp spawn Mercy] |
| F03 | Exhumer (đội tuần tra) | II (Pilgrim Road) | h 1.00–1.05H (G3). W (mũ rộng vành) 0.40–0.50H | Vải dầu `#6B5F4E`; đèn chụp `#B59A5B`; **không accent** | Mũ rộng vành, đèn lồng có chụp, xẻng lưỡi dài, nỏ; **xám, rộng** | Chớp đèn làm mù rồi áp sát; nỏ ở tầm xa | Cast §4.1; [Trùng tên class Exhumer và hội Ignatia] |
| F04 | Kneeler | II (Stair of Penitence, Cathedral đang cháy) | h 0.65–0.78H (G2, người cúi, đầu gối dính phiến). Phiến L 0.90–1.10H | Bao bố `#6B5F4E`; halo sắt `#5A5F66` | Đầu gối dính phiến đá; **thấp, nhanh** | Bò nhanh đáng sợ, đi thành bầy; xoay người chậm | Cast §4.3; [Trùng tên P08. Đề xuất mở rộng từ LD §8.5 (LD chỉ nêu Flagellants và Lye Baths): coi là gần hình ảnh tự hại. Cast §4.3 ghi "Faithful / Perfection-born (Devotion)"; Bible §14.2 liệt kê Kneelers ở cả hai họ] |
| F05 | Bell-Head | II (Stair of Penitence, Cathedral đang cháy) | h 1.10–1.15H (G4, gồm chuông cố định) | Đồng chuông `#B59A5B`, áo `#6B5F4E`; khe mắt `#17151A` | Chuông trùm đầu, khe mắt; **tròn, to** | Xung phong theo hàng, chuông kêu vang; trúng đòn thì choáng | Cast §4.3; [Conflict: Bible §6.4 xếp spawn Latreus] |
| F06 | Censer-Bearer | II (Stair, Cathedral đang cháy, Kneeling Vault) | h 0.95–1.05H (G3). Lư hương không tính | Áo lễ đen `#1F1D22`; lư sắt `#5A5F66`; khói `#A9B1A6` | Áo lễ đen, lư sắt đốt mỡ; **khói bay** | Chữa Kneeler gần đó; đánh dấu hero "nghi ngờ" để nhận sát thương thêm | Cast §4.3; [Conflict: Bible §6.4 xếp spawn Latreus] |
| F07 | Turned Exhumer | II (Stair of Penitence) | h 1.00–1.05H (G3). Halo sắt kẹp mũ | Vải dầu `#6B5F4E`; halo `#5A5F66`; accent Act II `#E2622B` | Như Exhumer, thêm halo; **cuồng, không lùi** | Như Exhumer nhưng cuồng tín, không bao giờ rút lui | Cast §4.3; [LD §12.8 đưa vào Cathedral; Cast §4.7 không có] |
| F08 | Halo Knight | II (Chancery, Cathedral đang cháy, Kneeling Vault) | h 1.10–1.20H (G4, gồm halo gai hướng vào trong) | Giáp `#5A5F66`, xích `#B59A5B`, áo trắng `#E8E1D0`; halo `#D9A441`; accent Act II | Giáp tấm quấn xích dưới áo trắng; **halo gai quay vào trong** | Elite cận chiến; cú đập lan ra lửa thánh; không bao giờ nao núng | Cast §4.4, §12; [Conflict: Bible §6.4 xếp spawn Latreus] |
| F09 | Chancery Guard | II (Chancery) | h 1.00–1.05H (G3). Kích không tính | Áo `#1F1D22`, sổ cái `#B59A5B` | Kích, sổ xích thắt lưng; **thẳng, lính** | Lính thường | Cast §4.4; [Conflict: không có trong Bible §14.2] |
| F10 | Salt Reaver | III (White Road) | h 0.95–1.00H (G3) | Vải trắng `#E8E1D0`, muối `#EDEAE0`; mặt nạ thủy tinh `#CFE3E2`; accent `#9E1B1B` | Vải trắng đóng muối, mặt nạ thủy tinh; **khéo, nhanh** | Đánh rồi chạy bằng dao tẩm nước muối độc | Cast §5.1 |
| F11 | Salt-Dervish | III (White Road) | h 1.00–1.05H (G3). Lưỡi cong, vòng quay W 1.20–1.50H | Vải trắng `#E8E1D0`; lưỡi `#D8D8DC`; accent `#9E1B1B` | Xoay tròn với lưỡi cong; **vòng xoáy** | Đòn xoay diện rộng; khó thấy khi ở trong bão | Cast §5.1 |
| F12 | White Watch soldier (+ elite) | III (Undercity, Lye Baths · White Spire) | h 1.00–1.05H (G3); elite 1.05–1.09H (G3) | Giáp sơn mài `#EDEAE0`, kính `#CFE3E2`; không lộ da | Giáp trắng không hở da; **hàng ngũ** | Hàng giáo kỷ luật; đột kích Undercity | Cast §5.4, §5.9; [Cast: bản elite giáp đẹp hơn] |
| F13 | Lye Priest | III (Undercity, Lye Baths, White Spire) | h 0.95–1.05H (G3). Mặt nạ sứ | Áo `#1F1D22`; mặt sứ `#EDEAE0`; accent `#9E1B1B` | Áo choàng, tay bỏng kiềm, mặt nạ sứ; **trắng và đen** | Caster axit; "thanh tẩy" hero bằng cách gỡ buff | Cast §5.4; [Conflict: Bible §6.5 xếp spawn Kathara] |
| F14 | Night-Courtier | IV (Stillroom) | h 1.00–1.05H (G3) | Lụa `#7A3B47`, da tái `#D8CCB0`, môi đen | Y phục lộng lẫy đang mục; **tái, mục** | Phép máu; tan thành bầy dơi | Cast §6.6; [Người chết bảo quản, xếp Faithful] |
| F15 | Remembrancer | IV (Archive of Faces) | h 0.95–1.00H (G3). Lọ không tính | Áo xám `#8E8A80`; kính `#B59A5B` | Áo xám, kính một mắt, lọ mẫu; **gầy, thư lại** | Nhốt kỹ năng của hero vào lọ (silence) | Cast §6.7 |
| F16 | Wrecker | V (cliffs and lighthouses) | h 1.00–1.05H (G3). Sào không tính | Áo hắc ín `#17151A`; mã tấu `#D8D8DC` | Áo tẩm hắc ín, sào, cột đèn; **nhóm, phục** | Dụ tàu vào đá bằng đèn giả; phục kích theo nhóm | Cast §7.2 |
| F17 | Lamplighter cultist | V (Sunken Chapel) | h 1.00–1.05H (G3). Cột đèn không tính | Áo xám biển `#5C6063`; đèn `#F2C14E` | Áo choàng xám biển, cột đèn dài; **đèn thắp** | Thắp đèn làm mạnh thêm the Waiting ở gần | Cast §7.4; [Tên dễ lẫn B15] |

### 4.5 Perfection-born (P01–P27)

#### Mercy (Eleisa) · P01–P07

| ID | Quái | Act · khu | Kích thước đề xuất | Màu key | Silhouette · feel | Hành vi (canon) | Nguồn |
|---|---|---|---|---|---|---|---|
| P01 | The Soothed | I (Night Fens, Garden of Hush, Cradle) | h 0.90–1.00H (G3) | Áo ngủ `#E8E1D0`; mắt nhắm; accent Mercy `#B3262A` (chỉ miệng khâu) | Áo ngủ, mắt nhắm, miệng khâu cười; **hiền, chậm** | Đi tới hero và ngân nga; chạm tới thì ôm và gây mê. Nhanh hơn khi bài ru vang | Cast §3.3, §3.9; [LD §11.4: đây là nạn nhân. Proposal: chết thì ngủ thiếp] |
| P02 | Hush-Herald | I (Poppy Reach) | h 1.15–1.30H (G4) | Mạng `#E8E1D0`, áo thêu mắt nhắm `#B3262A`; lư khói `#B59A5B` | Cao, trùm mạng, lư khói anh túc; **có mắt thêu** | Tỏa mây ngủ gây chậm và buồn ngủ; tăng sức Soothed ở gần | Cast §3.5 |
| P03 | Hush-Moths | I (Poppy Reach, Garden of Hush, Cradle) | W (bầy) 0.10–0.15H mỗi cánh; vùng bầy 1.00–1.50H | Cánh `#E8E1D0`, phấn `#A9B1A6` | Bướm đêm nhạt, cánh mềm; **bầy trắng mờ** | Bụi cánh làm mắt nặng trĩu (chậm) | Cast §3.5, §3.9 |
| P04 | Hive-Sleeper | I (Poppy Reach) | L 1.40–1.70H (Ld3); h 0.50–0.70H khi nằm bò | Da `#D8CCB0`, ấu trùng `#A9B1A6`; accent poppy `#B3262A` | Thân phình lên vì ấu trùng ngọ nguậy dưới da; **phình, bò** | Lê tới rồi vỡ ra thành bầy Hush-Moth | Cast §3.5; [LD §8.4: tùy chọn cho ấu trùng] |
| P05 | Wet-Nurse (+ Swaddlings) | I (Garden of Hush, Cradle) | Wet-Nurse h 1.00–1.05H (G3), W 0.90–1.10H. Swaddlings L 0.25–0.35H (Ld1) | Tạp dề ố `#8E8A80`; bọc vải lanh `#E8E1D0`, xương `#D8CCB0` | Hộ lý phình, tạp dề ố; bọc bò đi như gói; **bọc không tạo hình trẻ sơ sinh** [Đề xuất] | Đặt bọc xuống thì bọc bò đi: Swaddlings lao vào hero | Cast §3.9; [LD §8.5: không gore trên trẻ em. Đề xuất từ LD §8.5: Swaddlings không giống trẻ sơ sinh] |
| P06 | Poppy-Mound | I (Garden of Hush) | W 2.00–3.00H (Ld4); h 0.80–1.20H (G3/G4, gò đứng yên) | Thịt `#8A6A5A`; hoa poppy `#B3262A` | Gò thịt nhiều người dính vào nhau, nở hoa; **đứng yên, tròn** | Spawner đứng yên; thả Hush-Moth cho tới khi bị phá | Cast §3.9 |
| P07 | Cradle-Warden | I (Cradle) | h 2.00–2.40H (G5); nôi L 0.80–1.00H cõng sau | Vải khâu `#E8E1D0`, nôi xương `#D8CCB0`; accent Mercy `#B3262A` | Khổng lồ khâu vải, nôi lồng trên lưng; **mũ trẻ con, không mặt** | Bruiser nặng; túm hero và "đu đưa" (choáng) | Cast §3.10; [Conflict: dáng trùng B02] |

#### Devotion (Latreus) · P08–P09

| ID | Quái | Act · khu | Kích thước đề xuất | Màu key | Silhouette · feel | Hành vi (canon) | Nguồn |
|---|---|---|---|---|---|---|---|
| P08 | Kneeler (đề xuất đổi: **the Kneeling Dead**) | II (Kneeling Vault) | h 0.60–0.75H (G2, quỳ) | Áo lễ `#6B5F4E`; halo `#5A5F66`; accent Act II `#D9A441` | Đứng dậy cứng khỏi ghế mà vẫn quỳ; **chết, cứng** | Như Kneeler ngoài phố (F04) | Cast §4.8; [Conflict tên trùng F04] |
| P09 | Chain-Hung | II (Kneeling Vault) | h 0.90–1.00H (G3) treo; xích không tính | Áo sám `#6B5F4E`; xích `#5A5F66`; móc `#D8D8DC` | Treo bằng móc xuyên lưng; **treo, đong đưa** | Rơi xuống và đu theo xích để đánh hero | Cast §4.8; [Đề xuất mở rộng từ LD §8.5 (LD chỉ nêu Flagellants và Lye Baths): coi là gần hình ảnh tự hại] |

#### Purity (Kathara) · P10–P15

| ID | Quái | Act · khu | Kích thước đề xuất | Màu key | Silhouette · feel | Hành vi (canon) | Nguồn |
|---|---|---|---|---|---|---|---|
| P10 | The Blanched | III (Lye Baths, Garden of Pillars, Salt Cell) | h 0.95–1.00H (G3), gầy | Hồng trắng `#E8C9CC` [Đề xuất], nhẵn như sáp có bóng ướt nhẹ; accent `#9E1B1B` (chỉ ở dạng vết máu) | Không da, không tóc, không nét; **trơn như sáp** | Nhanh, mỏng manh, lì lợm, nhảy vồ, không đánh tầm xa | Cast §5.5, §5.6; [Gộp hai mô tả, không phải mâu thuẫn: Cast §5.5 "pink-white and glistening" + LD §13.6 "smooth and waxen, not gory"] |
| P11 | Brine Leech | III (Lye Baths) | L 0.30–0.50H (Ld1) | Trong suốt `#CFE3E2`, viền `#3F8C88` | Đỉa trong suốt, **đọng sáng ở viền** | Bám vào người và hòa tan giáp | Cast §5.5 |
| P12 | Salt Pillar (+ brine-wraith) | III (Garden of Pillars, Salt Cell) | Pillar h 1.00–1.05H (G3); brine-wraith h 0.90–1.00H trong mờ | Muối `#EDEAE0`; wraith `#3F8C88` trong suốt; vết nứt teal phát sáng | Tượng người muối, nứt; **trong mờ, than khóc** | Bẫy, nổ khi hero đi ngang; wraith đuổi và làm lạnh | Cast §5.6, §5.10; LD §13.7 (vết nứt teal) |
| P13 | Halcyon Glass-Folk | III (Ship's Heart) | h 0.95–1.00H (G3) | Thủy tinh `#CFE3E2`; mỉm cười | Tượng người Halcyon, **đồng bộ hoàn hảo** | Di chuyển đồng bộ; vỡ thành mảnh sắc. Báo điềm cho the Perfect | Cast §5.8 |
| P14 | Halcyon Sentinel | III (Ship's Heart) | h 1.60–1.80H (G5) | Pha lê `#CFE3E2`, khung `#3F8C88` | Cấu trúc gác pha lê, **giáp dày, cột tia** | Chậm, giáp rất dày, tấn công bằng tia | Cast §5.8 |
| P15 | Crystal-Sworn | III (White Spire, Salt Cell) | h 1.10–1.20H (G4) | Pha lê gương `#CFE3E2`; phản chiếu | Hiệp sĩ thủy tinh sáng như gương; **phản chiếu, nhọn** | Phản lại đạn; phải đập nứt bằng đòn nặng | Cast §5.9, §5.10 |

#### Memory (Mnemora) · P16–P22

| ID | Quái | Act · khu | Kích thước đề xuất | Màu key | Silhouette · feel | Hành vi (canon) | Nguồn |
|---|---|---|---|---|---|---|---|
| P16 | Ice-Mourner | IV (Frozen Army) | h 1.00–1.10H (G3) | Băng `#6F8FA8`, mạng `#D8E7EF`; nước mắt `#D8E7EF` | Trùm mạng bằng băng, **khóc đóng băng** | Caster chậm; nước mắt làm đất và hero đóng băng | Cast §6.1 |
| P17 | The Preserved | IV (Stillroom, Unforgetting Deep) | h 0.95–1.00H (G3); treo dây từ trần | Y phục đẹp `#7A3B47`/`#3F6B5A`; mắt thủy tinh `#CFE3E2`; accent `#B59A5B` | Nhồi xác, mắt thủy tinh; **cử động như rối** | Bắt chước cử chỉ người sống; đánh bằng kỹ năng lúc còn sống | Cast §6.6; [Tên gần U12. Proposal LD §14.5: không thở ra hơi] |
| P18 | Keepsake Doll | IV (Stillroom) | h 0.20–0.25H (G1) | Tóc người `#17151A`, mắt cúc `#B59A5B`; vải `#E8E1D0` | Búp bê tí hon nhồi tóc, **mắt cúc** | Chạy tới hero rồi nổ thành mảnh ký ức gây rối loạn | Cast §6.6 |
| P19 | Facewearer | IV (Stillroom, Unforgetting Deep) | h 0.95–1.00H (G3). Cùng kích thước hero, khác bằng chất liệu | Da mặt mượn; viền `#7A3B47` | Đeo mặt người hero đã gặp; **giống hero, lệch vật liệu** | Tiếp cận như bạn rồi đánh | Cast §6.6, §6.8; [Cần hệ thống thay mặt, tốn chi phí] |
| P20 | Faceling (+ Faceling Hag) | IV (Archive of Faces) | Faceling h 0.25–0.35H (G1); Hag h 0.45–0.60H (G2) | Mặt nạ da `#D8CCB0`; ống thổi `#8E8A80`; lọ lạnh `#6F8FA8` | Tí hon đeo mặt người làm mặt nạ; **bầy, ống thổi** | Đi bầy; phi tiêu đẩy kỹ năng hero vào cooldown. Hag thở lửa băng và đeo lại mặt nạ | Cast §6.7 |
| P21 | Jar-Thing | IV (Archive of Faces, Unforgetting Deep) | h 1.20–1.60H (G4); W 0.80–1.00H | Lọ `#B9C7C2`; mẫu bên trong `#D8CCB0`, `#7A3B47` | Thân chồng lọ, mỗi lọ một khuôn mặt; **trong, nặng** | Gọi Faceling ra; vỡ thành thủy tinh bay | Cast §6.7, §6.8 |
| P22 | The Unremembered | IV (Archive of Faces, Unforgetting Deep) | h 0.95–1.00H khi hiện; ẩn khi không sáng | Chỉ hiện trong ánh lửa; viền `#D8E7EF` | Bị quên đến mức không ai thấy; **chỉ lộ trong lửa** | Rình rập tàng hình; hiện khi ánh lửa hoặc khi tên bị đọc to | Cast §6.7, §6.8; [Vô hình: cần quy ước hiển thị. Proposal LD §14.8] |

#### Hope (Elpis) · P23–P27

| ID | Quái | Act · khu | Kích thước đề xuất | Màu key | Silhouette · feel | Hành vi (canon) | Nguồn |
|---|---|---|---|---|---|---|---|
| P23 | Beckoner (+ Lamp-Witch) | V (cliffs, Dawn Ship, Ebbmount Abbey) | Beckoner h 1.00–1.05H (G3); cánh W 1.40–1.80H; Lamp-Witch h 1.05–1.10H | Cánh buồm rách `#E8EEEA`, da ướt `#D8CCB0`; đèn máu `#9E1B1B` | Phụ nữ có cánh buồm rách, **mặt người bạn đang chờ** | Mê hoặc kéo hero lại rồi hút; Lamp-Witch dùng phép máu | Cast §7.2, §12; [Conflict: trang phục gợi dục, cần chốt] |
| P24 | Lantern-Lure | V (cliffs, Ebbmount Abbey) | h 1.00–1.05H (G3); mồi cao 0.30–0.40H trên trán | Da `#D8CCB0`; mồi `#F2C14E` | Mồi như cá cần câu, **đầu mồi sáng dịu** | Ánh sáng kéo hero lại gần, rồi hàm đớp | Cast §7.2; [Conflict: dáng gần B15] |
| P25 | Sunken Pilgrim | V (Wrack-Woods, Sunken Chapel, Long Sands) | h 0.95–1.00H (G3); áo ướt nặng | Áo `#4A3526`, đá buộc `#8E8A80` | Áo choàng ướt, đá buộc cổ chân; **đoàn rước, nặng** | Đi thành đoàn rước, hát thánh ca; túm hero kéo về nước sâu | Cast §7.3, §7.4 |
| P26 | The Waiting | V (Wrackhaven, Sunken Chapel, Dawn Ship, Long Sands) | h 0.95–1.00H (G3); gầy | Da bọc xương `#D8CCB0`, mắt `#F2C14E` | Da bọc xương, mắt trừng; **ban ngày dân, ban đêm quái** | Ban ngày vô hại. Ban đêm thức dậy khi có người đi qua, nhảy nhanh, không đánh tầm xa | Cast §7.4, §7.6; [Cần hai trạng thái] |
| P27 | The Promised | V (Wrackhaven ban đêm, Long Sands, Ebbmount Abbey) | h 0.95–1.00H (G3) bằng người chết đuối | Da `#5C6063`, nước `#2F5A52` | Bản sao hoàn hảo, đến gần thì nước chảy từ miệng; **giống, ướt** | Gõ cửa; giả dân thị trấn hoặc đồng minh rồi đánh | Cast §7.6, §7.7 |

### 4.6 Lodge's servants (L01–L04)

| ID | Quái | Act · khu | Kích thước đề xuất | Màu key | Silhouette · feel | Hành vi (canon) | Nguồn |
|---|---|---|---|---|---|---|---|
| L01 | Saint-Statue | Mọi nhà thờ, mọi act; lần đầu quái ở Chancery (II) | **h 1.10–1.15H [LD]** (10–15% lớn hơn người thật) | Đá xám `#7F7F7A`; không accent | Tượng không mặt, tay đỡ vòm; **quá cỡ, đứng** | Chỉ di chuyển khi không ai nhìn (điều kiện chưa rõ, xem checklist mục 7) | Cast §2.2, §4.4, §8.1; LD §4.2 |
| L02 | Plumb-Hound | Từ II (Chancery) trở đi | V 0.60–0.80H; L 1.20–1.50H (Ld3). Dây dọi không tính | Đá xám `#7F7F7A`; dây `#5C6063` | Chó đá treo trên dây dọi kéo lên hư không; **đu, không chạm đất** | Bám theo không buông, không cắt đuôi được, gọi tay sai khác | Cast §4.4, §8.1 |
| L03 | Gargoyle Mortarer | Từ II trở đi, trên mái nhà | h 0.80–1.00H (G3, ngồi xổm); W 1.00–1.20H | Đá xám `#7F7F7A`; vữa `#A39F93` | Gargoyle ngồi trên mái; **thấp, vuông** | Phun vữa đông cứng nhanh, trói chân hero (root) | Cast §4.4, §8.1; [Conflict: dáng trùng D10] |
| L04 | Course-Warden | V (Long Sands: không đánh hero; the Course: thù địch) | h 1.20–1.30H (G4); lưỡi bay thợ hồ L 1.20–1.50H (không tính h) | Đá xám `#7F7F7A`; lưỡi `#D8D8DC` | Hình người trùm mũ, lưỡi như lưỡi hái; **thẳng, lạnh** | Long Sands: chém the Promised, bỏ qua hero. The Course: chặn mọi kẻ xâm nhập | Cast §7.7, §7.9; [Cần hai trạng thái AI] |

### 4.7 The Perfect (X01)

| ID | Quái | Act · khu | Kích thước đề xuất | Màu key | Silhouette · feel | Hành vi (canon) | Nguồn |
|---|---|---|---|---|---|---|---|
| X01 | The Perfect | V (the Seamless) | h 1.00–1.05H (G3) | Trắng `#F4F1E8`, vàng `#F4D58D`; không texture (xem 2.4) | Không mặt, **đồng bộ hoàn hảo** | Không đánh; tiến tới và "chữa lành" bằng cách hút bóng hero | Cast §7.10; LD §5.4 |

### 4.8 Boss (B01–B17)

Boss theo camera arena (mục 1.5). Hành vi canon là tóm tắt từ Cast §9, §3–§7 và checklist; câu thoại lấy từ checklist.

| ID | Boss | Act · khu | Kích thước đề xuất | Màu key | Silhouette · feel | Hành vi (canon) | Nguồn |
|---|---|---|---|---|---|---|---|
| B01 | The Sexton's Dog | Prologue · nghĩa trang (mini-boss) | V 0.50–0.60H (G2); L 1.10–1.30H (Ld3). Vòng cổ rách | Lông `#4A3526`, vòng cổ `#5A5F66`, móc đèn đồng `#B59A5B` (Prologue: không accent, móc không sáng; điểm ấm đầu tiên là đèn Gennet, LD §10) | Chó ngao già, móc đèn quanh cổ; **thấp, dài** | Vồ và kéo, dùng để dạy né. Khi chết, Gennet làm Rite of Laying | Cast §2.2; LD §10.2; [Chưa có trong lời kể Bible §11.2] |
| B02 | The Lullaby Man | I (Night Fens) (mid-boss) | h 2.00–2.40H (G5, theo điều kiện 1.5); cũi nôi W 0.80–1.00H | Vải chắp `#E8E1D0`; bông `#D8CCB0`; người ngủ trong cũi `#B9C7C2`; accent Mercy `#B3262A` | Nurse khổng lồ khâu vải, **cũi trên lưng**; nghe thấy trước khi thấy | Cũi trên lưng không được đánh, nếu không người ngủ trong đó chết | Cast §3.3; LD §11.4 (proposal: cú đầu chỉ làm người ngủ kêu); [Dáng trùng P07] |
| B03 | The Ember-Pot (tùy chọn) | I (Flint Delvings) (mini-boss) | Kiln-Shaman phình h 0.50–0.70H (G2); nồi cỡ xe đẩy L 1.50–2.00H, cao 0.80–1.00H | Nồi `#5A2A1E`; khe `#E2622B` | Kiln-Shaman béo, **nồi to kéo theo** | Liên tục nung lại Hodling xung quanh cho tới khi nồi bị đập | Cast §3.7; checklist: đếm gạch nhanh dần |
| B04 | The Willow Bride (side boss) | I (Willow Mere) | h 0.95–1.00H (G3); rễ liễu tỏa ra tới 1.00–1.50H | Váy `#8E8A80`, mạng mục `#A9B1A6`, rễ `#4A3526`; accent `#B3262A` (hoa) | Cô dâu chết đuối, mạng mục, **tóc mọc vào rễ** | Tấn công bất cứ ai đi ngang. An nghỉ, nói câu cuối rồi không tấn công nữa | Cast §3.6; [Chưa có họ: Cast để ở bảng nhân vật] |
| B05 | The Hospice Mother | I (Cradle) (act boss) | h 2.50–3.00H (G6, điều kiện 1.5); W (tay) 2.50–3.50H | Vải lanh `#E8E1D0`; tay `#EBD6C4` (sắc da nhợt mềm, [Đề xuất], khác trắng Seamless `#F4F1E8` của X01); đèn ngủ `#E0A050` | Trùm mạng khổng lồ, **nhiều tay mềm**; bóng đổ xuống sàn làm telegraph | Bài ru làm màn hình tối dần và hero chậm lại; tay cố đắp chăn; đèn tắt dần | Cast §3.10; LD §8.3, §11.12 (có mức sáng tối thiểu, giới hạn tay đánh cùng lúc) |
| B06 | The Choir of Nails (mid-boss) | II (Bell Catacombs) | h 2.00–2.40H (G5); W (organ) 2.50–3.50H (Ld4) | Thịt `#6E6A5C`, ống `#5A5F66`, đinh `#D8D8DC`; accent Act II `#D9A441` | Organ biết hát: mười hai ca viên ghép; **ống và đinh** | Hát "HOLD… FAST…"; phải làm im từng giọng một | Cast §4.5; [Motif gần High Council] |
| B07 | Brother Cassian, the Kneeling Saint (act boss) | II (Kneeling Vault) | **h 0.95–1.05H** (G3, quy mô người được chấp nhận); rễ đá dưới chân | Áo `#6B5F4E`; rễ đá `#7F7F7A`; halo `#D9A441`; accent Act II `#E2622B` | Ông già gầy, chân thành rễ đá, **halo gai hướng vào** | Tự xé mình khỏi sàn; lệnh "KNEEL" khóa di chuyển, phá bằng Doubt | Cast §4.8; Bible §15.1 (Iron Halo: "Latreus's crown of inward spikes, worn by Cassian"); LD §12.9; câu: "Doubt is the only sin!" |
| B08 | The Pillar-Maker (mid-boss) | III (Garden of Pillars) | h 1.80–2.20H (G5) | Vải lễ đóng muối `#EDEAE0`; mặt không `#D8D8DC`; cột `#CFE3E2` | Cao, không mặt, **đóng muối**; mỗi cột là bẫy | Chạm vào là hóa muối; mỗi cột thành bẫy; arena đầy dần | Cast §5.6; câu: "Hold still." |
| B09 | The Chisel (Mason) | III (Old Salt Mine) (boss) | h 2.50–2.80H (G6, điều kiện 1.5); cánh trụ chống W 3.00–3.60H | Đá xám `#7F7F7A`; lưỡi `#D8D8DC`; **không glow** | Người đá khổng lồ, **cánh là trụ chống, lưỡi đục** | Cắt bỏ mọi thứ "lệch chuẩn", kể cả arena. Vỡ thì nói ra Luật 6 | Cast §5.7, §12; LD §13.8 (proposal: dây phấn ngang sàn) |
| B10 | Kathara, the White Fire (act boss) | III (Salt Cell) | h 2.50–3.50H (G6, điều kiện 1.5); W (đối xứng) 2.00–2.50H | Muối `#CFE3E2`, lửa không màu; Arsham ở tim `#9E1B1B` (vết máu) | Đối xứng hoàn hảo, **bóng Arsham ở tâm** | Blemish: đòn hero để lại vết, sự hoàn hảo vỡ theo vết; phải phá mà không giết người bên trong | Cast §5.10; LD §13.11, §8.3 |
| B11 | The Glass Stag (elite) | IV (Rimewood) | V 1.80–2.20H (G5, elite nên không vào G6); L 2.80–3.20H (Ld4); gạc thêm | Lồng ngực `#B9C7C2`; gạc `#8A6A4A`; mặt dây `#B59A5B`, `#7A3B47` | Hươu bảo quản, **lồng ngực thủy tinh đầy lọ** | Húc; mỗi mặt dây rơi ra thả một ký ức làm hero rối loạn | Cast §6.2; LD §14.3 (phải đẹp trước, đáng sợ sau) |
| B12 | The Hod-Mother (mid-boss) | IV (outer walls of Vesnagrad) | h 1.30–1.60H (G4); L 2.00–2.50H (Ld4). Chân ngắn | Đất nung `#9C4A2C`; cửa bụng `#E2622B` đỏ cam phập phồng như bễ (LD §14.6, §5.1); accent Act IV | Lò sống trên chân ngắn, **cửa bụng sáng**, kéo bằng Hauler | Bắn Hodling mới ra từ bụng; cắt dây kéo Hauler để chặn | Cast §6.5; LD §14.6 |
| B13 | The Taxidermist (mid-boss) | IV (Stillroom) | h 1.30–1.60H (G4); W (tay) 2.00–2.50H | Kim `#D8D8DC`, mắt thủy tinh `#CFE3E2`; mặt `#D8CCB0`; accent `#7A3B47` | Nhiều tay kim, **đeo mặt các "tác phẩm"** | Đánh cắp đòn của hero và "tạo dáng" chúng. Câu: "Hold that expression. Lovely." | Cast §6.6; [Proposal LD §14.7: tượng nằm lại, giới hạn số lượng] |
| B14 | The Cabinet (Radomir + Mnemora) (act boss) | IV (Unforgetting Deep) | h 2.50–3.50H (G6, điều kiện 1.5); W 2.00–3.00H | Gỗ bảo quản `#8A6A4A`, ngăn kéo; lọ `#B9C7C2`; accent `#B59A5B` | Thân ngăn kéo và lọ cao ngất; **gia đình như rối quanh** | Gọi ký ức Hospice Mother, Cassian, Kathara; nói bằng giọng Gennet; thắng bằng buông từng ký ức | Cast §6.8; LD §14.9 (ký ức là đoạn ngắn) |
| B15 | The Lamplighter (mid-boss) | V (Sunken Chapel) | h 2.00–2.40H (G5); đèn trên cuống cao 0.50–0.80H thêm | Lưng `#4A3526`; đèn `#F2C14E`; cuống `#2F5A52` | Khom lưng, **đèn trên cuống như cá biển sâu** | Ánh đèn cho mỗi người thấy thứ họ mong quay lại. Hero thấy Gennet còn sống | Cast §7.4; [Trùng tên F17, dáng gần P24] |
| B16 | Severin, the Lamp-Bearer (act boss) | V (Ebbmount, sảnh tiệc) | h 2.00–2.40H (G5, đầu là đèn 0.30–0.40H) | Đèn trắng `#F8F6EE`; áo xanh đen `#2F5A52`; accent Act V `#F2C14E` | Người cao vút, **đầu là ngọn đèn trắng** | Light radius đảo: nền sáng gây bỏng, bóng tối che chở. Thắng bằng dập từng ngọn đèn | Cast §7.8; LD §15.9; câu: "Not yet. Not yet." |
| B17 | The Unbroken, the Seamless Dawn (final boss) | V (the Seamless) | Pha 1 (năm giọng): h 1.50–2.00H; Pha 2 (Severin): 1.00–1.10H; Pha 3 (hero): 1.00H; **cuối là tượng Nameless Saint h 1.10–1.15H [LD]** | Trắng `#F4F1E8`, vàng `#F4D58D`; mặt hero trên tượng | Năm giọng, rồi Severin, rồi hero; **tượng mang mặt hero** | Năm pha, mỗi pha một Perfection; ánh sáng giết, bóng tối che; đòn cuối là một lựa chọn | Cast §7.10; [Chưa có họ] |

---

## 5. Xung đột và việc còn mở (giữ nguyên, không tự giải quyết)

| Mục | Nội dung | Nguồn | Trạng thái |
|---|---|---|---|
| **F02** | Poppy Nurse: Bible §6.3 xếp spawn Eleisa (Mercy) nhưng Cast xếp Faithful | Bible §6.3; Cast §3.5 | Mở. Checklist ghi "Cần xem" |
| **F04** | Kneeler: Cast §4.3 ghi "Faithful / Perfection-born (Devotion)"; Bible §14.2 liệt kê Kneelers ở cả hai họ | Cast §4.3; Bible §14.2 | Mở. Giữ F04 là Faithful theo checklist |
| **F05** | Bell-Head: Bible §6.4 xếp spawn Latreus | Bible §6.4 | Mở |
| **F06** | Censer-Bearer: Bible §6.4 xếp spawn Latreus | Bible §6.4 | Mở |
| **F08** | Halo Knight: Bible §6.4 xếp spawn Latreus | Bible §6.4 | Mở |
| **F13** | Lye Priest: Bible §6.5 xếp spawn Kathara | Bible §6.5 | Mở |
| **W03** | Hush-Wolf là người biến hình nhưng xếp Warped | Checklist mục 1 | Mở, 2 hướng: chuyển họ hoặc nới định nghĩa |
| **W05** | Corpse-Candle không phải động vật | Checklist | Mở |
| **W06** | Willow-Hulk là rễ và xương | Checklist | Mở |
| **B01** | Sexton's Dog là động vật nhưng xếp Unlaid. Chưa có trong lời kể Bible §11.2 | Checklist; Cast §2.2 | Mở |
| **B04** | The Willow Bride chưa có họ (Unlaid?) | Cast §3.6; checklist | Mở |
| **B17** | The Unbroken chưa có họ | Cast §7.10; checklist | Mở |
| **Trùng dáng 1** | P07 Cradle-Warden và B02 Lullaby Man | Checklist mục 5 | Mở |
| **Trùng dáng 2** | P24 Lantern-Lure và B15 Lamplighter | Checklist mục 5 | Mở |
| **Trùng dáng 3** | D10 Gutter-Wing và L03 Gargoyle Mortarer | Checklist mục 5 | Mở |
| **Trùng tên** | F04 Kneeler và P08 Kneeler (đề xuất: the Kneeling Dead) | Checklist mục 1 | Mở |
| **Trắng** | Trắng muối (Act III) và trắng Seamless (X01, B17) | LD §5.4 | Không phải mâu thuẫn (LD §5.4 đã phân biệt). Yêu cầu khi làm asset, xem 2.4 |
| **Rarity** | Màu rarity Bible §16 có thể đụng act palette | LD §5.5 | Không khóa màu mới, đã ghi ở 2.3 |
| **Map 1** | Phạm vi "Map 1" chưa xác nhận | Art direction §7.1 | Mở |

---

## 6. Acceptance: tiêu chí nghiệm thu cho quái

Mỗi quái được xem là đạt khi đủ các mục sau. Đây là tiêu chí đề xuất.

1. **Kích thước có đơn vị.** Số đo dùng H, h, V, L hoặc W đúng quy ước mục 1. Không có số bằng mét hoặc pixel.
2. **Nguồn số.** Số có sẵn trong nguồn (ví dụ L01 [LD]) được dùng nguyên. Số đề xuất ghi rõ [Đề xuất].
3. **Không chồng, không hở nhóm.** Cả nhóm lẫn dải số đo của quái đều nửa mở `[a, b)` (mục 1.3; ngoại lệ duy nhất là cận trên đóng của G6 và Ld5). Dải chỉ chạm biên thuộc đúng một nhóm; dải thật sự vượt biên phải ghi đủ các nhóm (ví dụ `G3/G4`). `h` và `V` dùng nhãn G, `L` và `W` dùng nhãn Ld. G6 chỉ cho boss.
4. **Silhouette grayscale ở camera combat.** Quái đọc được hình dạng khi chuyển sang đen trắng, ở camera iso combat, với mật độ combat đầy đủ (LD §8.1). Đây là tiêu chí cứng.
5. **Telegraph đọc được không cần màu.** Hình dạng và thời gian đủ để nhận ra, màu chỉ là phụ (LD §8.2).
6. **Một accent cho mỗi quái,** theo act (LD §8.1), trừ các hàng ghi rõ "không accent": Lodge's servants (L01–L04, mục 3.6), quái và boss Prologue (LD §10) và F03 [Đề xuất: đội tuần tra, lính thường].
7. **Không glow** cho Lodge (mục 2.4).
8. **Mood và feel theo map,** không lấy một mood chung cho cả game (art direction §7).
9. **Hành vi theo Cast và checklist.** Nếu animation đề xuất khác hành vi canon thì ghi rõ là đề xuất animation.
10. **Không ép boss to chỉ vì boss.** Boss có điều kiện camera (mục 1.5).
11. **Tiêu chí riêng cho trẻ em và hình ảnh tự hại (LD §8.5):** LD §8.5 yêu cầu không gore trên trẻ em, và xử lý hình ảnh tự hại (LD nêu Flagellants và Lye Baths) bằng hơi nước, bóng và âm thanh, không cận cảnh vết thương. Ta **đề xuất mở rộng** cùng sự thận trọng đó cho P05 (Swaddlings không giống trẻ sơ sinh), F04, P08 và P09 (Kneelers gắn phiến đá, Chain-Hung) và P10, F13 (Lye Baths).
12. **Tùy chọn cho người sợ:** W07 (nhện) và P04 (ấu trùng) có tùy chọn giảm (LD §8.4).

**Kết quả kiểm tra ID (chạy sau khi viết):**
- Checklist có 116 ID duy nhất. Bảng chi tiết mục 4 có 116 ID duy nhất, **khớp hoàn toàn** (diff rỗng).
- Phân bố: U 16, D 16, W 18, F 17, P 27, L 4, X 1 (= 99 quái thường) và B 17 (= 17 boss).
- Không có ID bị bỏ hoặc thêm. Mục 1.2 có nhắc lại vài ID làm mỏ neo số đo, không tạo hàng trùng trong bảng chi tiết.

---

## 7. Nguồn

- `ASHLAR_MONSTER_CHECKLIST_VI.md` (danh sách 116 ID, mục 1–9)
- `ASHLAR_ART_DIRECTION_VI.md` (style `stylized2`, mood theo map, §7.1 Map 1)
- Attachment Cast: `C:\Users\HLC_2021\.t3\userdata\attachments\7670a661-7ba0-40ea-b351-3842f095abfb-11f650a9-13c9-410c-8bb8-c5413666dee4-md.md`
- Attachment Bible: `…\7670a661-7ba0-40ea-b351-3842f095abfb-908fb3ec-1ff8-4256-acea-601b319a788a-md.md`
- Attachment LD: `…\7670a661-7ba0-40ea-b351-3842f095abfb-930b780a-5575-4cac-b195-22a6199669f2-md.md`
