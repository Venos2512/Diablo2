# ASHLAR — Biome, khu vực và quy chuẩn môi trường

> Trạng thái: **nghiên cứu / tổng hợp nguồn**, chưa phải quyết định thiết kế đã duyệt. Ngày: 2026-10-20.
> Phạm vi: tổng hợp từ LD (Level Design and Atmosphere Guide) và Bible, đối chiếu với checklist quái. Không sửa master MD nào khác.

---

## 0. Cách đọc và kiểm đếm

**Ba lớp không được gộp:**

| Lớp | Là gì | Nguồn quyết định | Ví dụ |
|---|---|---|---|
| **Region / Act** | Vùng địa lý và chương truyện | Bible §7, LD §11–15 | Dolmoor (Act I), Sepulcra (Act II) |
| **Biome (BIO-xx)** | Nhóm môi trường do **ta hệ thống hoá** để dùng palette, vật liệu và silhouette chung. LD không có bảng biome. | Tài liệu này | BIO-01 Đầm lầy & làng nước |
| **Area** | Khu cụ thể trong master table LD §17 | LD §17 | Night Fens, Rook's Weir |

- Một **dungeon không phải biome tự nhiên**. Ví dụ Old Salt Mine thuộc BIO-06 (mỏ & Spoil) nhưng vật liệu là muối, nên chính biome cũng có biến thể.
- Một **area không phải map gameplay đã khóa**. Các map sẽ được quyết định sau. "Map 1" của AD §7.1 **chưa được gán** vào area nào trong file này (xem §6).

**Kiểm đếm (đã kiểm tự động, xem §10):**

- LD §17 master table có **50 hàng**: Prologue 2, Act I 11, Act II 8, Act III 10, Act IV 8, Act V 10, Ending 1 (16.1).
- **49** = tổng trước ending. Đây là con số LD §9.8 ghi "Total 49" (không gồm 16.1). Khi nói "49" phải ghi rõ "trước ending". Với ending, tổng là **50**.
- Act I 11 hàng = 10 khu + 1 Dream space (11.10 Edda's Dream), khớp dòng "10, plus one dream space" trong LD §9.8.
- Biome: **27 biome** (BIO-01 → BIO-27). Mỗi area được gán đúng **một** biome chính; 50/50 area, không trùng.

---

## 1. Nguồn và nhãn

| Ký hiệu | Nguồn | Ghi chú |
|---|---|---|
| **LD §x.y** | `7670a661-…-930b780a-…-md.md` (Level Design and Atmosphere Guide, "Cast" trong yêu cầu là file khác, xem dưới) | Nguồn chính cho area, palette, quy tắc dựng cảnh. Đã đọc toàn bộ §1–§17 và §18.1–18.6. |
| **Bible §x.y** | `7670a661-…-908fb3ec-…-md.md` (World Bible) | Canon thế giới, §7 vùng, §17.3 palette act. |
| **Cast §x.y** | `7670a661-…-11f650a9-…-md.md` (Bestiary and Cast) | Đã đọc trực tiếp để đối chiếu danh sách quái theo area (Cast §2–§7); dùng cho nhãn † ở §5. Checklist vẫn là nguồn cột "Act · khu". |
| **Checklist** | `ashlar/ASHLAR_MONSTER_CHECKLIST_VI.md` | Mã ID quái (U/D/W/F/P/L/X/B) và cột "Act · khu". Dùng để tra đầy đủ. |
| **AD §x** | `ashlar/ASHLAR_ART_DIRECTION_VI.md` | Đề xuất art direction v1, quyết định mới của người dùng về style và Map 1. |

**Nhãn trong bảng:**

- **[CANON]**: Bible nói rõ.
- **[LD]**: LD mô tả trực tiếp (không đánh dấu Proposal).
- **[LD-P]**: LD gắn nhãn **Proposal** (có thể bỏ, không ảnh hưởng truyện).
- **[AD]**: đề xuất art direction v1.
- **[TA]**: ta hệ thống hoá (biome, nhóm, nhãn). Không phải nguồn gốc.
- **THIẾU HEX**: LD không có mã HEX cho vật liệu này. Không tự đặt mã canon; nếu cần, đề xuất riêng.

**Quy ước HEX:** mọi HEX là **HEX gốc của LD §5.4** hoặc **AD §7** trừ khi ghi "[TA đề xuất]". Đây là swatch khởi điểm, không phải màu pixel cuối (AD §7 đã nêu rõ).

---

## 2. Quy chuẩn chung

### 2.1 Kích thước và nhịp không gian

| Đối tượng | Quy chuẩn | Nguồn |
|---|---|---|
| **Hub** | Đi qua khoảng **40 giây**. Là phòng nghỉ, không phải thành phố. | LD §7.3 [LD] |
| **Hub: thời gian chơi** | 15–25 phút qua nhiều lần ghé (xem cột D·C·phút ở §5). | LD §17 [LD] |
| **Hub: ngưỡng ánh sáng** | Có một **ranh giới vật lý** của ánh sáng (cổng, cầu, cửa). Vào hub là một quyết định. | LD §6.1, §7.3 [LD] |
| **Wild** | Đường đi xen kẽ **khoảng trống và điểm nghẽn** cứ 40–60 giây di chuyển. | LD §7.4 [LD] |
| **Wild: landmark** | Có 1 landmark nhìn thấy từ phần lớn khu. Điểm đến của act nhìn thấy được từ ít nhất 1 chỗ cao. | LD §7.4 [LD] |
| **Wild: vị trí Rite** | **3–6 unquiet sites** mỗi wild zone, mỗi chỗ có một cảnh khác nhau. | LD §7.8 [LD] |
| **Wild: vignette** | Ít nhất 1 vignette **không được đánh dấu trên map**. | LD §7.4, §20.1 [LD] |
| **Dungeon: phòng nghỉ** | 1 **breath room** nhỏ, sáng bằng ánh sáng người, mỗi tầng dungeon. | LD §7.5 [LD] |
| **Dungeon: cấu trúc** | Ít nhất **3 room grammar** khác nhau, 1 cơ chế đặc trưng, ít nhất 3 vignette dựng tay. | LD §7.1 [LD] |
| **Cell / boss arena** | Đọc được ở **full mật độ hiệu ứng**. Boss có đúng 1 câu thoại. | LD §7.6 [LD] |
| **Waypoint corridor** | Đi bộ 2–4 giây trong hành lang Course. | LD §9.2 [LD-P] |
| **Nhịp act** | **Act I:** đổi **cảnh và động từ** chơi mỗi 20–40 phút; mid-boss đầu tiên trong khoảng 45 phút sau khi rời Lychgate. Khuôn nhịp chung cho mọi act: LD §7.10. | LD §11.1 (riêng Act I); LD §7.10 (khuôn chung) [LD] |
| **Light radius** | Suy giảm theo **5–8 bậc** nhìn thấy, không gradient mượt. | LD §5.3 [LD-P] |
| **Thời gian ước tính (first pass)** | Prologue ~0.25 h; Act I 3.5–4.5 h; II 3.5–4.5 h; III 4–5 h; IV 3.5–4.5 h; V 4–5 h. Tổng 19–24 h. | LD §9.8 [LD] (ước tính, không phải mục tiêu) |
| **Thang điểm** | Dread (D) và Combat (C): 0–5. Thời gian: phút. | LD §1.4, §17 [LD] |

### 2.2 Màu key và quy tắc màu

- **Mỗi act có một bảng màu nghiêm**: nền, một accent duy nhất, ánh sáng, và danh sách màu bị cấm. Bảng gốc: LD §5.4 (xem biome §4 để biết HEX từng nhóm).
- **Prologue** [LD §10]: dùng palette Act I ban đêm, **không có accent**. Điểm ấm đầu tiên của game là đèn của Gennet.
- **Hai màu trắng** [LD §5.4]: trắng Act III là trắng muối và xương (mờ, có bụi, không phát sáng). Trắng Seamless là trắng ánh sáng (phát sáng, bloom). **Không được lẫn.**
- **Màu rarity** [LD §5.5]: Rubble xám, Hewn xanh dương, Dressed vàng, Graven cam, Hallowed vàng kim. Các màu này đụng màu act. Mỗi rarity phải có thêm **âm thanh rơi** và **hình tia**, không chỉ màu. Không dùng màu rarity cho accent môi trường lớn.
- **Telegraph** [LD §8.2, §5.5]: hình và thời gian trước, màu sau. Hình không đổi giữa các act; chỉ tint đổi theo palette. Đỏ cảnh báo phải đọc được trên máu Act III và lửa Act II.
- **Quy tắc "accent duy nhất cho mỗi quái"** [LD §8.1]: mỗi quái có một accent bão hoà thuộc về act của nó.

### 2.3 Silhouette

- **Value trước hue** [LD §8.1]: nền, nhân vật, quái và dấu hiệu gameplay phải tách được khi bỏ màu. Test grayscale ở mật độ combat cao nhất.
- **Rim light** cho mọi thứ có thể gây sát thương [LD §8.1]. Rim lạnh ở vùng ấm, rim ấm ở vùng lạnh.
- **Quiet floors** [LD §8.1]: nền có độ tương phản và chi tiết thấp, để báo đòn, loot và xác đọc được.
- **Silhouette quái** [LD §8.1]: Discarded đọc theo sừng; Unlaid theo tư thế; Perfection-born theo vật liệu của Perfection (vải lanh, sắt, thủy tinh muối, lọ, đèn).

### 2.4 Mood và feel

- **Ba cảm giác**: Dread (sợ), Tenderness (thương), Weight (nặng). **Mỗi area phải đạt ít nhất hai** [LD §2.1].
- **Một dấu hiệu nhớ** (Remember) cho mỗi area. Nếu playtester không tả được, area chưa xong [LD §1.3].
- **Mood là ngữ pháp ánh sáng**: ánh sáng do người thắp nhấp nháy, ánh sáng Perfection đứng yên và đều [LD §4.1]. Quy tắc "đọc chủ sở hữu ánh sáng qua cách nó chuyển động" là đề xuất của LD [LD-P §5.1]. Cả hai đều có thể ấm, nhưng khác về nhịp.
- **Mood quyết định theo từng map, có thể khác ngay trong cùng act** (xem §6). Bảng màu act (LD §5.4) vẫn là khung lore [AD §7].

### 2.5 Hành vi môi trường

| Hành vi | Quy tắc | Nguồn |
|---|---|---|
| **Chủ sở hữu ánh sáng** | Người: nhỏ, ấm, nhấp, khói. Perfection: đứng yên, đều, đẹp. Discarded: ánh lò từ trong khe nứt, nhịp như bễ [LD §4.1], màu đỏ-cam [LD §14.6]. Wall: ánh trắng qua khe nứt. Mason: không phát sáng. | LD §4.1 [LD] |
| **Đọc chủ sở hữu qua chuyển động** | Quy tắc đề xuất: nhận ra ai sở hữu ánh sáng từ cách nó chuyển động. Chi tiết Wall: "still pinpoints" hoặc "slow shimmer", trắng lạnh. | LD §5.1 [LD-P] |
| **Light wakes monsters** | Radius rộng hơn → thấy nhiều, bị chú ý nhiều. Dungeon đáng sợ nhất: quái thấy ánh sáng trước khi hero thấy quái. | LD §5.3 [LD] |
| **Sound before sight** | Mọi họ quái báo trước bằng âm thanh; boss nghe thấy trước khi thấy. Phải có phụ đề hướng. | LD §6.5, §8.4 [LD] |
| **Đảo ngược ánh sáng** | Ebbmount (feast hall) và Seamless: ánh sáng gây hại, bóng bảo vệ. Hệ thống radius phải đảo giá trị được. | LD §5.3, §8.3 [LD] |
| **Thủy triều** | Overlay theo mùa (Tide). Long Sands chỉ đi được vào ngày Ebb; Wrack-Woods mở khi nước rút. | LD §9.4, §15.4 [LD-P] |
| **Tuyết** | Tuyết Hoarfast bay lên gần Archive; Rimewood đổi hướng tuyết theo khu. Tuyết xanh trong bóng, hổ phách dưới đèn. | LD §14.3, §5.4 [LD-P] |
| **Tro** | Tro giàn thiêu rơi xuống Lowcourse; ở đèo tro nằm dày phía đối diện thành. | LD §12.3, §12.2 [LD-P] |
| **Sương** | Dolmoor: sương hốc đến trưa. Khói ngủ ở Poppy Reach: vùng có viền rõ, tăng buồn ngủ. | LD §11.1, §11.6 [LD-P] |
| **Âm thanh bề mặt** | Bước chân đổi theo mặt: đá lát, than bùn, muối, băng, cát ướt, vữa. | LD §6.8 [LD] |
| **Im lặng** | Hoang mạc trắng: không có âm nền; nhiều nhất 1 lần mỗi act. Tháp Spire: im lặng toàn phần (một khoảnh khắc). | LD §6.6, §13.10 [LD] |
| **Quy tắc đỉnh cao** | Chỉ **một cảnh** mỗi act được phép phá quy tắc. | LD §6.6 [LD] |
| **Rite** | Khu đã yên: sương mỏng, tiếng chuông sạch, chim trở lại. | LD §7.8 [LD] |

---

## 3. Phân cấp: act → hub → area → biome

```
Region / Act  (Bible §7)
  └── Hub (LD §7.3)                  ← safe mặc định, ngoại lệ story (§7 file này)
  └── Area (LD §17 master table)     ← 50 hàng, mỗi hàng có Type, Generation
        └── Biome (BIO-xx)           ← nhóm môi trường TA hệ thống hoá, 1 area = 1 biome chính
```

- Một act có thể có **nhiều biome** (Act I: BIO-01 đến BIO-05, BIO-26, BIO-27 …).
- Một biome có thể có **nhiều act** (BIO-06 Mỏ & Spoil: Act I và III; BIO-27 Cell: cả 4 act có cell).

---

## 4. Bảng biome (27 nhóm)

**Cột:** ID · Biome và act · Môi trường & vật liệu · Palette (base / accent / light, HEX + nguồn) · Silhouette cảnh quan · Mood · Feel người chơi · Ánh sáng / khí hậu / hành vi.

### BIO-01 — Đầm lầy & làng nước (Dolmoor, Act I)

- **Môi trường & vật liệu:** than bùn, sậy, nước đen, cầu đường, cọc đá đứng, liễu, nhà sàn, nhà chìm nước.
- **Palette:** base `#5E6B5A` (LD §5.4) · đen đầm `#1F2A24` (LD §5.4) · than bùn `#4A3526` (LD §5.4) · sương `#A9B1A6` (LD §5.4). Accent `#B3262A` (poppy, LD Act I). Light `#E0A050` (LD Act I, nến).
- **Silhouette:** mặt nước phẳng, trụ đá đứng, cầu đường hẹp, liễu rũ, sậy đứng. Không có núi cao; đường chân trời thấp.
- **Mood:** ẩm, lạnh, hoang, bất an nhưng vẫn đi được [LD §11.4, §11.5].
- **Feel người chơi:** Night Fens: *theo tiếng ru qua nước đen* [LD]. Rook's Weir: *làng chìm nhưng vẫn giữ nhà* [LD]. Willow Mere: *đám cưới chờ quá lâu* [LD].
- **Ánh sáng & hành vi:** sương đến trưa; đèn ma (Corpse-Candle) đứng yên và đẹp vì là mồi [LD §11.4]. Ếch im khi Soothed đi qua [LD §11.4]. Bờ đê và sậy là giới hạn zone [LD §7.4].

### BIO-02 — Đồng thuốc phiện (Dolmoor, Act I)

- **Môi trường & vật liệu:** đồng cỏ bỏ hoang, hàng rào đá khô, nông trại, hoa anh túc, khói ngủ.
- **Palette:** base `#5E6B5A` / `#A9B1A6` (LD Act I) · accent `#B3262A` (poppy, **mạnh nhất** ở đây, LD §11.6) · light: ánh sáng xám overcast, khói ấm nhẹ [LD §11.6].
- **Silhouette:** đồng rộng, hàng rào tạo lối đi, mái nông trại lưng đồi, nhà Gentle House trên đỉnh [LD §11.6].
- **Mood:** ngọt, buồn ngủ, bỏ hoang [LD §11.6 Feel].
- **Feel:** *muốn nằm xuống trong nó*. Nguy hiểm là ở chỗ muốn ở lại [LD §11.6].
- **Hành vi:** khói ngủ có viền rõ và tint đều, là **địa hình** chứ không phải lọc sương [LD §11.6 Developer notes]. Sau Act I, hoa cụp và rụng (Proposal) [LD §11.13].

### BIO-03 — Làng đá lửa & sân nhà thờ (Lychgate, Prologue & Act I)

- **Môi trường & vật liệu:** đá lửa (knapped flint), tranh lợp, than bùn, mortsafe, lychgate, yew, nghĩa địa dốc, nhà sàn.
- **Palette:** base `#5E6B5A` và `#4A3526` (LD Act I) · accent `#B3262A` (chỉ là nhánh poppy trên cửa, Act I hub, LD-P §11.2) · light `#E0A050` (lò rèn, nến, cửa sổ, LD §5.4). **Prologue (10.2): palette Act I ban đêm, không accent; điểm ấm đầu tiên là đèn Gennet** [LD §10].
- **Silhouette:** tháp tròn ossuary trên đỉnh duy nhất khô ráo; mái lychgate là đường viền; nhà sàn thấp.
- **Mood:** ấm, ẩm, tang thương; "nhỏ, ấm, phải trả giá" [LD §7.3].
- **Feel:** Lychgate hub: *ấm nhỏ biết giá của nó* [LD §11.2]. Churchyard Vigil: *chạy trong mưa về ánh sáng duy nhất*. Grave Matters: *học đưa người chết yên, từng nấm mộ* [LD §10.2, §11.3].
- **Hành vi:** hub: giá ấm hiện trên quảng trường [LD §7.3]. Lychgate: thời gian chơi 15 phút qua nhiều lần [LD §17]. Grave Matters: khi 5 mộ được yên, sương mỏng đi và quạ đậu lại [LD §11.3]. Sau Act I: ribbon đen thay sprig poppy [LD-P §11.13].

### BIO-04 — Hầm xương & vườn đất (Old Face, Garden of Hush, Act I và Prologue)

- **Môi trường & vật liệu:** xương và vữa ấm ướt (Old Face), đất tối với hàng giường ngủ (Garden of Hush), tường vòm, rễ cây.
- **Palette:** **Prologue (Old Face, 10.1): palette Act I ban đêm, không accent** [LD §10] · base `#1F2A24` (Prologue đêm, LD §5.4) · đất/than bùn `#4A3526` · accent `#B3262A` (hoa poppy mọc từ miệng ngủ, chỉ ở Garden of Hush, LD §11.11) · light: ánh cold white của Wall (THIẾU HEX, LD §5.1), đèn ngủ hồng dưới đất (LD §5.4, "pinkish night-lights", THIẾU HEX), đèn ấm Gennet `#E0A050`.
- **Silhouette:** vòm và hành lang chật (Old Face); hàng luống đất dài có mái vải (Garden of Hush).
- **Mood:** Old Face: *sinh ra từ trong tường, lạnh, gần* [LD §10.1]. Garden of Hush: *yên, màu mỡ, nhân đạo* [LD §11.11].
- **Hành vi:** Old Face: tiếng Wall thì thầm lớn nhất ở đây [LD §6.6]. Garden of Hush: hàng trăm người ngủ thở chung một nhịp chậm; đèn ngủ bên mỗi người; mỗi lần tiếng ồn gần giấc ngủ làm chuông treo rung [LD-P §11.11].

### BIO-05 — Hospice vôi trắng (Gentle House, Act I)

- **Môi trường & vật liệu:** vôi trắng mới không có chỗ sửa, vải lanh, tu viện (cloister, phòng bệnh, refectory), bếp, bánh mì, hoa trong bình.
- **Palette:** base **trắng vôi và lanh: THIẾU HEX** (LD §5.4 chỉ cho phép trắng sạch trên lanh của Mercy). Accent `#B3262A` (thêu poppy trên wimple) [LD §11.9]. Light: nến **không nhấp**, ấm (THIẾU HEX cho nến không nhấp; dùng `#E0A050` làm ánh nến Act I [LD §5.4]).
- **Silhouette:** tu viện trên đồi, cổng tháp, cloister vuông, hàng giường dài [LD §11.9].
- **Mood:** đẹp, sạch, mỉm cười. Đây là **lời nói dối ấm áp nhất** [CANON Bible §11.3 / LD §11.9].
- **Feel:** *nơi tốt đẹp nhất bạn từng đến và muốn ở lại* [LD §11.9].
- **Hành vi:** mưa dừng ở cổng [LD-P §11.9]. Không có chiến đấu; đi bộ, camera thấp và gần [LD-P §11.9]. Nếu bị thấy, một nữ tu tử tế dẫn ra cổng [LD-P §11.9].

### BIO-06 — Mỏ & Spoil (Flint Delvings, Old Salt Mine)

- **Môi trường & vật liệu:** hai biến thể. (a) **Phấn và đá lửa**, giếng, gỗ chống, cuốc sừng (Flint Delvings, Act I). (b) **Muối**, nhà nguyện đục trong muối, đường hầm thô (Old Salt Mine, Act III). Cả hai đều thông xuống **Spoil** (đá vỡ của Mason, LD §7.6 Bible).
- **Palette:**
  - (a) Phấn trắng và đá lửa đen: **THIẾU HEX** (LD §11.8 chỉ mô tả). Đỏ-cam lò nung: `#E2622B` [TA đề xuất, lấy từ pyre orange Act II LD §5.4, vì LD §5.1 không đưa HEX cho đèn Discarded].
  - (b) Muối khắc: base `#EDEAE0` (LD Act III). Teal `#3F8C88` (nước muối, LD Act III). Đá muối có vân xám-xanh-hồng: THIẾU HEX (LD §13.8).
- **Silhouette:** giếng và bậc gỗ (a); khối Mason vuông cắt xuyên đường hầm đổ nát (b).
- **Mood:** (a) *nóng, lẩm bẩm, tham* [LD §11.8]. (b) *lấp lánh, sâu, không ngừng* [LD §13.8].
- **Hành vi:** (a) ánh lò **nhấp như bễ** từ trong khe nứt [LD §4.1], màu đỏ-cam [LD-P §5.1; §14.6]; nhận biết đợt tấn công bằng nhịp [LD §11.8]. (b) tiếng *tock* lại gần qua đá [LD §13.8]; đường vuông hiện ra không báo trước [LD-P §13.8]. Light radius của Act III quay lại khi xuống mỏ [LD §13.8].

### BIO-07 — Thành bậc đá vôi Sepulcra (Lowcourse, Stair of Penitence, Chancery, Act II)

- **Môi trường & vật liệu:** đá vôi xương trắng, bậc và cầu nối bậc, bệ giàn thiêu, gian hàng chợ, gian kho vàng. Thành phố xây theo các "course" của Wall (Bible §7.3).
- **Palette:** base `#17151A` (muội) và `#E6DFCF` (xương) · accent `#E2622B` (cam giàn thiêu) · light `#D9A441` (vàng nến). Kính màu xanh-đỏ **chỉ qua cửa sổ** [LD §5.4]. Chancery: vàng và cẩm thạch, sáng dễ tràn sàn [LD §12.5].
- **Silhouette:** bậc dốc thẳng đứng; cầu và cổng ngăn các course; tầng cao chỉ là nền [LD §12.3 Developer notes].
- **Mood:** đông, nhọ, phản kháng (Lowcourse); *cuồng nhiệt, thẳng đứng, cháy* (Stair); *cẩm thạch, quan liêu, bị theo dõi* (Chancery) [LD §12.3–12.5].
- **Hành vi:** tro từ tầng trên rơi xuống như tuyết [LD §12.3]. Bệ giàn thiêu ở mỗi landing; khi chuông đổ, mọi người quỳ — cơ chế *the Kneeling* [LD §12.4 Proposal]. Tượng quay đầu đều theo nhịp đi của player [LD §12.5, §4.2].

### BIO-08 — Nhà thờ & hầm chuông (Cathedral, Bell Catacombs, Scriptorium, Act II)

- **Môi trường & vật liệu:** gothic nave, rose window, chuông đồng xanh gỉ, bệ chuông, hầm xương, phòng sách có đèn nến duy nhất.
- **Palette:** base xương `#E6DFCF` và muội `#17151A` · light vàng `#D9A441` · kính màu xanh/đỏ qua cửa sổ · khi cháy: `#E2622B` (lửa, LD §12.8 Proposal). Nhà nguyện có sách: nến duy nhất.
- **Silhouette:** nave dài, gallery, khu có nhiều chuông treo xuống tối (bell pits).
- **Mood:** Cathedral *tôn nghiêm, rồi cháy*. Bell Catacombs *vang, chôn, hợp xướng* [LD §12.6, §12.8]. Scriptorium *bụi, thiêng, lộ ra sự thật* [LD §12.7].
- **Hành vi:** tượng quay đầu, dàn organ tắt khi tượng di chuyển [LD §12.8]. Chuông vang làm lộ kẻ thù (sonar), đánh thức Charnel Chanter [LD-P §12.6]. Scriptorium: chỉ một nến; cả khu yên lặng [LD §12.7].

### BIO-09 — Đèo tuyết-tro (Pilgrim Road, Act II)

- **Môi trường & vật liệu:** đỉnh đen như răng, tuyết xám tro, lối đi quanh co, cầu dây, bãi hy sinh, bia gỗ tên người chết.
- **Palette:** base `#17151A` và `#E6DFCF` (Act II) · accent `#E2622B` (tro giàn thiêu, rơi về phía thành) · ánh sáng: nắng cao, bóng dài [LD §12.2].
- **Silhouette:** đèo xoắn ốc; người quỳ đông cứng dọc đường; đỉnh cao mờ.
- **Mood:** lạnh, đạo, bị săn [LD §12.2 Feel].
- **Feel:** *cuộc hành hương lạnh qua nghĩa địa của người tin* [LD §12.2].
- **Hành vi:** tiếng chuông thành phố lớn dần theo mỗi đèo [LD §12.2]. Tro dày hơn ở phía thành [LD-P §12.2]. Cầu dây ngắn, đọc được, không rơi chết ngay [LD §12.2 Watch].

### BIO-10 — Biển khô: đất muối, xác tàu, vườn muối (White Road, Wreck Fields, Garden of Pillars, Act III)

- **Môi trường & vật liệu:** đa giác muối nứt, áp lực gờ đá, tàu nghiêng trong muối, xương cá voi, hồ nước đọng teal, vườn muối có lối sỏi trắng.
- **Palette:**
  - Base: `#EDEAE0` (muối/xương, LD Act III) · trời sữa `#DCE3E6` (LD Act III) · teal nước `#3F8C88` · gỉ `#8A4B2D` (rust, LD Act III).
  - Accent: `#9E1B1B` **chỉ máu trên muối** (LD Act III). Không dùng đỏ nào khác.
- **Silhouette:** phẳng và rộng, bị chặn bởi xác tàu và xương; tàu nghiêng là đường viền chính [LD §13.2–13.3].
- **Mood:** White Road: *chói, phơi, bị rình* [LD §13.2]. Wreck Fields: *nghiêng, rỗng, nước mặn* [LD §13.3]. Garden of Pillars: *tượng là người, một số vẫn khóc* [LD §13.7].
- **Hành vi:** chói và không bóng lúc trưa; bóng dài đầu tiên của act đến từ Mason xa trên đường [LD-P §13.2]. Gió muối: giảm tầm nhìn; trong mắt bão gió ngừng, chỉ còn tiếng *tock* [LD-P §13.2]. Đứng yên lâu trên muối: bị phủ muối [LD-P §13.2]. Hình tượng muối không được bóng bẩy: không dùng bloom cho màu [LD §13.2 Watch].

### BIO-11 — Hulk trắng & Namakhar (Namakhar, Lye Baths, White Spire, Act III)

- **Môi trường & vật liệu:** con tàu Halcyon cổ dựng đứng; vòm sườn tàu; kính muối (salt-glass); cầu dây giữa các tầng; plaster trắng; bồn lye trắng; tháp trắng hẹp dần.
- **Palette:** base `#EDEAE0` (trắng vôi/plaster, LD Act III) · `#DCE3E6` (sáng sữa qua kính) · **không màu nào khác** trên tầng trên [LD §13.4]. Màu duy nhất trên tầng trên là hàng tịch thu và máu [LD-P §13.4]; accent `#9E1B1B` chỉ cho máu.
- **Silhouette:** tầng dọc (như Sepulcra nhưng trong tàu); mast-tower cao nhất; cổng có cột muối [LD §13.4].
- **Mood:** Namakhar: *trắng, dọc, bị canh* [LD §13.4]. Lye Baths: *đẹp, và đó là kinh dị* [LD §13.6]. White Spire: *chói đến đau, lên để gặp một thần* [LD §13.10].
- **Feel:** hub: *thành phố người sạch trong xương tàu, phải giấu bản chất* [LD §13.4]. Spire: *phòng càng lên càng trắng, không có ai* [LD §13.10].
- **Hành vi:** màu biến mất dần khi lên cao (Spire) [LD §13.10]. Hub có nguy hiểm: cột muối thấy từ mọi tầng [LD §13.4]. Nhạc: duduk chỉ ở dưới; tầng trên chỉ có glass harmonica mờ [LD-P §13.4]. Im lặng toàn phần ở phòng đỉnh [LD §13.10].

### BIO-12 — Hầm dưới Hulk (Undercity of the Flawed, Act III)

- **Môi trường & vật liệu:** hành lang cong, võng, kênh đáy tàu, cửa ẩn, quán rượu, quán xăm.
- **Palette:** base gỗ tối (THIẾU HEX). Màu bị cấm trên tầng trên **được phép** ở đây: vải nhuộm, mực, rượu, ochre và xanh dương (LD §13.5, THIẾU HEX). Ánh đèn người: nhấp nháy, ấm (LD §5.1).
- **Silhouette:** tầng thấp, chật, nhiều lối; khác biệt rõ với Namakhar.
- **Mood:** ấm, bí mật, có màu lại [LD §13.5].
- **Feel:** *nơi duy nhất trong thành phố trắng còn có mặt người* [LD §13.5].
- **Hành vi:** tuần tra xuất hiện theo chu kỳ; người chơi có thể bảo vệ hoặc giúp họ trốn [LD-P §13.5]. Im lặng khi lính đi qua trên đầu [LD §13.5]. Gương được che bằng vải, trừ một gương muối cũ dùng cho cảnh cuối [LD-P §13.5].

### BIO-13 — Di tích Halcyon (Ship's Heart, Act III)

- **Môi trường & vật liệu:** kính muối không mối nối, đối xứng hoàn hảo, không bụi, không mòn, bàn thờ.
- **Palette:** base trắng kính muối (THIẾU HEX, LD §13.9 chỉ "white"). Ánh sáng trắng không nguồn, giữ thấp để trắng vẫn đọc được [LD §13.9].
- **Silhouette:** hành lang đối xứng dẫn tới một phòng thờ; tượng thủy tinh cười đứng yên.
- **Mood:** kỳ quái ở chỗ không có gì hỏng. *Hoàn thiện, cổ, im* [LD §13.9].
- **Feel:** *đáy một con tàu do nền văn minh đạt hoàn hảo rồi biến mất xây* [LD §13.9].
- **Hành vi:** thì thầm-pha lê phát lại câu cuối của người nghe gần [LD §13.9]. Bát gỗ của người ăn xin là dấu vết người duy nhất; chiếu sáng như thánh tích [LD-P §13.9]. Không dùng vẻ khoa học viễn tưởng [LD §13.9 Avoid].

### BIO-14 — Băng Hoarfast: đồng băng & rừng băng (Frozen Army, Rimewood, Act IV)

- **Môi trường & vật liệu:** sông băng khoá; ngựa đông trong băng; thông đen bọc băng; băng và tuyết; tượng lính đông cứng.
- **Palette:** base `#14202E` (băng xanh đen) và `#6F8FA8` (xanh sương) · accent (màu trang sức): garnet `#7A3B47`, emerald `#3F6B5A`, old gold `#B59A5B` · light: hổ phách `#E5A44C` [LD §5.4 Act IV].
- **Silhouette:** cánh đồng phẳng với đống quân; rừng thông trong vỏ băng; cột tuyết đi lên ở Rimewood.
- **Mood:** đứng yên, tinh thể, uy lạnh (Rimewood) [LD §14.3]. Đông cứng, rì rầm, thương tiếc (Frozen Army) [LD §14.2].
- **Feel:** Frozen Army: *cả một đội quân đông cứng giữa trận và vẫn thì thầm tên mình* [LD §14.2]. Rimewood: *thời gian dừng và tuyết bay ngược lên trời* [LD §14.3].
- **Hành vi:** tuyết xanh trong bóng, hổ phách dưới lửa; không bao giờ trắng tinh [LD §5.4]. Hơi thở đông cứng chỉ với nhân vật sống [LD §18.4 VFX]. Tuyết bay lên đổi hướng theo khu; tốc độ chậm để thoải mái và tiết kiệm [LD §14.3 Watch]. Mỗi tên được ghi thì một giọng tắt [LD §14.2].

### BIO-15 — Đồi tro lửa tế (pyre-groves, Act IV)

- **Môi trường & vật liệu:** vòng đá đứng, tro cũ phủ nhiều thế kỷ, bệ giàn thiêu bằng tay.
- **Palette:** base `#14202E` · lửa thật: màu lửa Act II `#E2622B` [TA đề xuất] · tro xám. Đây là **nguồn lửa thật duy nhất** của act (LD §14.4).
- **Silhouette:** vòng tròn đá; bệ giàn thiêu; khói bay lên thẳng.
- **Mood:** ấm, tro, thánh [LD §14.4].
- **Feel:** *nơi người chết được hát vào bóng tối không sợ hãi* [LD §14.4].
- **Hành vi:** khu an toàn, không chiến đấu, không menu bán hàng trong lúc thiêu [LD §14.4 Avoid]. Gió dừng khi vào vòng đá [LD §14.4]. Ngọn lửa là ánh sáng thật, trái với hổ phách Hall of Tables [LD §14.4 Must].

### BIO-16 — Vesnagrad & vườn kính (hub và siege, Act IV)

- **Môi trường & vật liệu:** gỗ đen chạm khắc, palisade, nhà ống khói, vườn kính trong và vỡ, lò Hod-Mother.
- **Palette:** base gỗ đen (THIẾU HEX) và đêm `#14202E` · light hổ phách `#E5A44C` (đèn không nhấp, LD §14.5) · accent đồ trang sức: garnet `#7A3B47`, emerald `#3F6B5A`, old gold `#B59A5B` · lò đêm siege: đỏ-cam nhấp như bễ, LD §14.6 chỉ "red-orange" → `#E2622B` [TA đề xuất].
- **Silhouette:** mái chạm khắc; palisade; cổng; lò Hod-Mother là khối lửa cao có ống khói [LD §14.5–14.6].
- **Mood:** Vesnagrad: *ấm màu, được mời ăn tối bằng người chết* [LD §14.5]. Siege: *sấm, tuyệt vọng, lửa* [LD §14.6].
- **Feel:** hub: *thành phố ấm nhất trong game, nơi người chết luôn được mời* [LD §14.5]. Siege: *giữ tường trong tuyết chống một đám đông, cho một thành phố đầy người chết* [LD §14.6].
- **Hành vi:** đèn không có tiếng xèo xèo (Proposal) [LD-P §14.5]. Người sống thở ra hơi trong lạnh; người ướp thì không [LD-P §14.5]. Thành tuyết rơi xuống sau act [LD §14.10 Proposal].

### BIO-17 — Phòng ướp & kho lọ (Stillroom, Archive of Faces, Act IV)

- **Môi trường & vật liệu:** vecni, dây thép, lọ thủy tinh có mặt người, kệ thẻ, thang, bàn ướp; kho lọ vô tận.
- **Palette:** base `#14202E` · jewel ngả màu trên vải nhung (garnet, emerald, old gold) · light hổ phách `#E5A44C` đứng yên [LD §14.7] · tuyết bay lên ngoài cửa sổ [LD §14.8].
- **Silhouette:** Stillroom: bàn tư thế, khung tranh sống, phòng nhỏ. Archive: khối kệ dài dọc, nhiều tầng, thang [LD §14.8].
- **Mood:** Stillroom: *tư thế, vecni, thân mật, kinh dị đẹp* [LD §14.7]. Archive: *được mục lục hoá, thì thầm, rộng* [LD §14.8].
- **Feel:** Stillroom: *khoảnh khắc hạnh phúc nhất của con người, giữ mãi* [LD §14.7]. Archive: *thư viện mà mỗi cuốn là một khuôn mặt trong lọ* [LD §14.8].
- **Hành vi:** mở lọ phát lại ký ức dạng echo pha lê băng [LD-P §14.8]. Mở lọ cũng đánh thức Unremembered [LD-P §14.8]. Tuyết bay ngược trong cell [LD §14.9]. Lọ *Barrow, Gennet* không được nhạc nhấn [LD §14.8 Must].

### BIO-18 — Thị trấn cảng Wrackhaven (hub và set piece ban đêm, Act V)

- **Môi trường & vật liệu:** mái đá phiến, vôi cũ, lưới và lồng đánh cá, nhà cầu cảng, chapel, bến dưới tường.
- **Palette:** base `#3B4650` (slate) và `#2F5A52` (xanh biển) · accent `#F2C14E` (vàng đèn) · đá ướt `#121417` · light: nến ở mọi cửa sổ [LD §15.2], chủ sở hữu ánh sáng là **điểm mở** (xem Hành vi). Ngọn trắng `#F8F6EE` từ hải đăng xa.
- **Silhouette:** lối dốc từ cảng; cửa sổ có nến; hải đăng và Masons trên vách.
- **Mood:** ngày: *bão, đạo, canh chừng* [LD §15.2]. Đêm: *tiếng gõ, dịu dàng, không chịu nổi* [LD §15.7].
- **Feel:** hub: *thị trấn đánh cá mà mỗi cửa sổ đang chờ* [LD §15.2]. Đêm: *đêm người chết trở về và gõ cửa* [LD §15.7].
- **Hành vi:** Waiting đứng yên đến khi có người đi qua [LD §15.2]. Ban ngày người dân; ban đêm đe doạ [LD §15.2]. Chỉ có nút đi cùng Maelys, không có nút chọn thay cô [LD §15.7]. Cửa sổ duy nhất tối là lựa chọn của cô [LD §15.7]. **Điểm mở:** LD §4.1 coi "candle-lit at every window (Act V)" là dấu hiệu giáo phái đã lan tới, và LD §15.2 ghi nến cửa sổ giờ gợi cảm giác sợ; chưa nguồn nào cho nhịp (nhấp hay đứng yên) của nến cửa sổ, nên chưa gán chủ sở hữu ánh sáng. Dùng emissive cards [LD §15.2 Watch].

### BIO-19 — Vách đá & hải đăng (cliffs and lighthouses, Act V)

- **Môi trường & vật liệu:** vách đá đen, cửa hang, hải đăng có thân dọc, lối thuyền nhỏ, mảng bọt trắng, đá dựng đứng.
- **Palette:** base `#121417` (đá đen) và `#3B4650` (trời slate) · foam `#E8EEEA` · hải đăng `#F8F6EE` (ngọn trắng) · accent `#F2C14E` [LD §5.4 Act V].
- **Silhouette:** vách cao, cột đèn, bọt; đường nhìn quét qua vách.
- **Mood:** *gió, phản bội, sáng* [LD §15.3 Feel].
- **Feel:** *đi theo ánh đèn dọc bờ biển mà mỗi ánh có thể đang nói dối* [LD §15.3].
- **Hành vi:** tia hải đăng quét theo chu kỳ chậm; ai bị quét thấy được với toàn bờ và kéo Beckoner và Lantern-Lure; khoảng tối giữa các lần quét là an toàn [LD-P §15.3]. Tiếng gọi tên từ xa (Beckoner) [LD §15.3]. Trừ tia quét, không dùng nắng [LD §15.3 Avoid].

### BIO-20 — Lộ triều & rừng tảo (Wrack-Woods, Long Sands, Act V)

- **Môi trường & vật liệu:** rừng tảo treo từ cọc đá, tàu đắm lộ, hố triều, cầu cung, sóng đang rút.
- **Palette:** base `#2F5A52` và `#121417` (đá ướt) · tảo nâu xanh (THIẾU HEX, LD §15.4) · cát ướt như gương phản bầu trời bão `#3B4650` (LD §15.8 Look) · ánh đèn của Sunken Pilgrim: `#F2C14E` · ánh sáng sau bão: sáng xuyên mây.
- **Silhouette:** Wrack-Woods: màn tảo treo dày. Long Sands: mặt cát phẳng vô tận, đường cổ có cọc, tường đá tàn của Hollin (LD §15.8).
- **Mood:** Wrack-Woods: *nhỏ giọt, phơi, mượn thời gian* [LD §15.4]. Long Sands: *rộng, sử thi, về nhà* [LD §15.8].
- **Feel:** *đi trên đáy biển khi biển đã rút đi* [LD §15.4]; *đi bộ về nhà qua một trận đánh về phía ánh sáng lớn dần* [LD §15.8].
- **Hành vi:** triều là đồng hồ, không phải thất bại; nước trở lại từ mép xa [LD-P §15.4]. Không có đá để ấn cổng — portal không hoạt động [LD §9.1, §15.8]. Ánh sáng lớn dần theo khoảng cách tới núi [LD §15.8 Must]. Long Sands chỉ đi được một ngày rút lớn [LD §9.4, §15.1].

### BIO-21 — Nước & tàu chìm (Sunken Chapel, Dawn Ship, Act V)

- **Môi trường & vật liệu:** nhà nguyện nửa ngập (ghế dài có hàu, nến trong bình), tàu neo trong sương.
- **Palette:** Sunken Chapel: nước xanh lá (THIẾU HEX; LD §15.5 chỉ "green water"), **vàng đèn `#F2C14E` và không gì khác** (LD §15.5). Dawn Ship: buồm trắng ánh sáng đứng yên `#F8F6EE` [LD-P §15.6]; biển phẳng như kính.
- **Silhouette:** nhà nguyện chỉ nổi tháp chuông, đường đi qua ghế dài nổi trên mặt nước; tàu lớn đậu trong sương.
- **Mood:** Sunken Chapel: *chìm, phát sáng, khao khát* [LD §15.5]. Dawn Ship: *linh thiêng, êm, sai* [LD §15.6].
- **Feel:** Sunken: *nhà nguyện nửa chìm, nơi ngọn đèn cho thấy người bạn muốn đưa về* [LD §15.5]. Dawn: *con tàu ma hứa đưa người sùng đạo tới bình minh* [LD §15.6].
- **Hành vi:** chuông chìm rung theo mỗi con sóng [LD §15.5]. Nhật ký lặp "Dawn expected tomorrow" [LD-P §15.6]. Trong ánh đèn lure, người chơi thấy người đã mất [LD-P §15.5] — hấp dẫn và kéo boss [LD-P §15.5].

### BIO-22 — Tu viện thuỷ triều Ebbmount (Act V)

- **Môi trường & vật liệu:** bậc núi, tường tu viện được vá qua nghìn năm, pear tree, tháp chữ, hội trường tiệc, nến sáp dày như nhũ đá.
- **Palette:** base `#3B4650` và `#121417` (Act V) · ngọn trắng `#F8F6EE` ở cửa sổ cao nhất · accent `#F2C14E` · tiệc: nến không bao giờ cháy hết [LD-P §15.9] — màu nến THIẾU HEX.
- **Silhouette:** bậc xoắn lên núi; cloister; hội trường tiệc dưới cửa sổ cao.
- **Mood:** *quên lãng, dịu, nến* [LD §15.9].
- **Feel:** *leo tới một đám cưới đã chờ một nghìn năm* [LD §15.9].
- **Hành vi:** đảo ngược ánh sáng: ánh sáng làm cháy, bóng bảo vệ [LD §15.9 Must]. Tháp chữ có ~360.000 lá thư xếp như gạch [LD-P §15.9]. Hộp nhạc gọi "Hold fast" đợi câu trả lời [LD §6.3]. Cảnh tình yêu, không phải độc thoại [LD §15.9 Must].

### BIO-23 — The Course (inside the Wall, Act V)

- **Môi trường & vật liệu:** hành lang tường mặt người và tay nắm, cầu thang người bị ép, vữa ấm như da, hố ánh sáng trắng, kênh Spoil.
- **Palette:** base ochre `#A57F45`, xương `#D8CCB0`, xám ấm `#8C847A` (LD §5.4) · ánh sáng: chỉ trắng qua khe · ngoại lệ: ánh lò Discarded đỏ-cam [LD §5.4]. HEX của ánh lò: `#E2622B` [TA đề xuất].
- **Silhouette:** tường tay và mặt; cầu thang chồng; hố sáng trắng là hiểm hoạ.
- **Mood:** *ấm, bị ép, đoàn tụ* [LD §15.10]. Ban đầu áp lực, dần thành ôm [LD §15.10 Must].
- **Feel:** *địa ngục làm bằng người, hoá ra là người đang giữ nhau* [LD §15.10].
- **Hành vi:** mỗi đoàn tụ là một breath room, không ai tấn công trong lúc đó [LD-P §15.10]. Sửa một lỗ hổng bằng Rite, hỏi đá *"Will you hold?"* [LD-P §15.10]. Âm thanh đi từ thì thầm sang giọng người [LD §15.10 Must]. Đây là tile set chủ lực, mặt và tay là phần đẹp nhất [LD §15.10 Watch].

### BIO-24 — Cổng keystone (ending, 16.1)

- **Môi trường & vật liệu:** vòng tròn đá Mason cắt trong chân núi, rãnh dẫn triều, cổng đá hoàn hảo ở phía xa.
- **Palette:** đá Mason xám (THIẾU HEX, LD §16.1). Ánh sáng: mưa bão tan, nắng đầu tiên của game chạm sàn giếng [LD-P §16.1]. Màu đá gần `#8C847A` (xám ấm, LD §5.4 Course) là **[TA đề xuất]**.
- **Silhouette:** giếng tròn lộ trời; Masons quanh miệng giếng; khi quỳ, đầu xuống miệng giếng [LD-P §16.1].
- **Mood:** *trang nghiêm, tự nguyện* [LD §16.1 Feel].
- **Feel:** *bước cuối: hai người đi vào một bức tường, bằng lựa chọn* [LD §16.1].
- **Hành vi:** bước đi phải được chơi, không chỉ xem [LD-P §16.1]. Masons quỳ là hình ảnh cuối cùng của họ [LD §16.1]. Không fanfare [LD §16.1 Avoid].

### BIO-25 — The Seamless (Act V, final)

- **Môi trường & vật liệu:** không có vật liệu: trắng không chiều sâu, làng Hollin hoàn hảo, biển như kính, mặt trời đứng yên.
- **Palette:** trắng ánh sáng (LD §5.4, không HEX), vàng `#F4D58D`, trời xanh hoàn hảo `#8EC9F0` [LD §5.4, AD §7].
- **Silhouette:** không có bóng ngoài bóng hero [LD §15.11 Look].
- **Mood:** *rạng rỡ, bất động, không chịu nổi* [LD §15.11].
- **Feel:** *mùa hè hoàn hảo trong làng biển đã chìm gần bảy trăm năm* [LD §15.11 Remember].
- **Hành vi:** ánh sáng giết; bóng hero là vũ khí [LD §15.11]. Không nhấp nháy, bloom xây dần [LD §15.11 Must]. Camera "vật lộn" có chủ đích, không che telegraph [LD §15.11 Watch].

### BIO-26 — Mộng Edda (dream space, Act I)

- **Môi trường & vật liệu:** nhà tranh mới, sân, cổng vườn lặp lại, ánh nắng duy nhất của Act I.
- **Palette:** vàng `#F4D58D` và xanh `#8EC9F0` (mức nhẹ hơn Seamless) [TA đề xuất từ LD §11.10 "mild version of the Seamless's treatment"].
- **Silhouette:** cottage nhỏ; vòng lặp đường đi.
- **Mood:** *vàng, tĩnh, đau* [LD §11.10].
- **Feel:** *ký ức hoàn hảo mà bạn không được giữ* [LD §11.10].
- **Hành vi:** bóng hero là bóng duy nhất [LD §11.10 Must]. Không có đe doạ [LD §11.10 Avoid]. Không giống Gentle House: nắng khác với ánh ấm trong nhà [LD §11.10 Watch].

### BIO-27 — Cell Perfection (bốn cell, mỗi act một Perfection)

Các cell có chung quy tắc *interior giả vô hạn* [LD §7.6], nhưng palette khác theo act:

| Cell | Act / Perfection | Palette (base / accent / light) | Ghi chú môi trường | Nguồn |
|---|---|---|---|---|
| **The Cradle** (11.12) | I · Mercy | Lanh trắng THIẾU HEX; night-light trắng sữa THIẾU HEX; poppy `#B3262A` (từ Act I) | Cũi xương, màn lanh, đèn ngủ đứng yên | LD §11.12, §5.1 |
| **The Kneeling Vault** (12.9) | II · Devotion | Muội `#17151A` · xương `#E6DFCF` · vàng nến `#D9A441` · cam `#E2622B` | Xương sống và sườn làm vòm; xích, tallow | LD §12.9 |
| **The Salt Cell** (13.11) | III · Purity | Muối `#EDEAE0` · teal `#3F8C88` · **đỏ máu `#9E1B1B` chỉ trên vết nứt** | Gương vô tận; Arsham hiện là bóng tối trong tinh thể | LD §13.11, §8.3 |
| **The Unforgetting Deep** (14.9) | IV · Memory | `#14202E` · `#6F8FA8` · hổ phách `#E5A44C` | Ngăn kéo vô tận; tuyết bay ngược; echo kính băng | LD §14.9, §9.5 |

Quy tắc chung cho cell:

- Boss arena phải đọc được ở mật độ đầy đủ [LD §7.6].
- Mỗi cell có một cơ chế boss gắn môi trường: đèn tắt (Cradle); quỳ (Vault); gương và crystal nứt (Salt Cell); ngăn kéo (Unforgetting Deep) [LD §7.6].
- Mỗi arena có thể tải riêng cho Remembrance [LD §9.5].

---

## 5. Danh mục area đầy đủ (50 hàng)

**Cột:** § (LD §17) · Area (tên gốc) · Loại (LD) · Gen (Fixed / Fixed+dressing / Hybrid / Procedural) · **Biome** · Feel tóm tắt (theo LD) · Quái tiêu biểu (ID checklist; **†** = không có trong text LD card của area đó; nguồn là Cast, xem bảng "Nguồn của dấu †" sau §5) · D·C·phút (LD §17).

**Lưu ý quái:** liệt kê rút gọn. Danh sách đầy đủ phân bố theo khu: `ashlar/ASHLAR_MONSTER_CHECKLIST_VI.md`, cột "Act · khu" của từng ID và mục §9 "Đội hình theo act". Boss in đậm.

### Prologue

| § | Area | Loại | Gen | Biome | Feel tóm tắt | Quái tiêu biểu | D·C·phút |
|---|---|---|---|---|---|---|---|
| 10.1 | The Old Face | Dungeon (tutorial) | Fixed | BIO-04 | Sinh ra từ trong tường, lạnh, gần | U01 Shambler, W01 Mortar-Rat | 4·1·6 |
| 10.2 | Lychgate churchyard, the Vigil | Wild + set piece | Fixed | BIO-03 | Chạy trong mưa về ánh sáng duy nhất | U01, U02 Charnel Dead, W01, **B01 The Sexton's Dog** | 3·2·9 |

### Act I — Dolmoor

| § | Area | Loại | Gen | Biome | Feel tóm tắt | Quái tiêu biểu | D·C·phút |
|---|---|---|---|---|---|---|---|
| 11.2 | Lychgate | Hub | Fixed | BIO-03 | Ấm nhỏ biết giá của nó | — (hub) | 2·0·15 |
| 11.3 | Churchyard, *Grave Matters* | Wild | Fixed + dressing | BIO-03 | Học đưa người chết yên | U01, U02, U03 Charnel Bowman, U04 Charnel Ghoul, W02 Gibbet-Crow, F01 Body-snatcher | 2·2·20 |
| 11.4 | The Night Fens | Wild | Fixed + dressing | BIO-01 | Theo tiếng ru qua nước đen | P01 The Soothed, W03 Hush-Wolf, W04 Mire-Sucker, W05 Corpse-Candle, U05 The Swollen, **B02 The Lullaby Man** | 4·3·35 |
| 11.5 | Rook's Weir | Wild | Fixed + dressing | BIO-01 | Làng chìm nhưng vẫn giữ nhà | U01 (Mire-), U05, W05 | 4·2·18 |
| 11.6 | The Poppy Reach | Wild | Fixed + dressing | BIO-02 | Muốn nằm xuống trong nó | P02 Hush-Herald, F02 Poppy Nurse, P03 Hush-Moth, P04 Hive-Sleeper, W03 | 3·3·28 |
| 11.7 | The Willow Mere | Wild (side) | Fixed | BIO-01 | Đám cưới chờ quá lâu | W06 Willow-Hulk, W05, U05, **B04 The Willow Bride** | 3·2·12 |
| 11.8 | The Flint Delvings | Dungeon (optional) | Hybrid | BIO-06 | Đào vào cơn đói của người khác | D01 Hodling, D02 Kiln-Shaman, D03 Kiln-Bull, W07 Shroud-Spinner, D04 Tithe-Thief, **B03 The Ember-Pot** | 3·4·30 |
| 11.9 | The Gentle House | Holy place | Fixed | BIO-05 | Nơi tử tế nhất, bạn muốn ở lại | — (không chiến đấu) | 4·0·12 |
| 11.10 | Edda's Dream | Dream space | Fixed | BIO-26 | Ký ức hoàn hảo bạn không được giữ | — | 2·0·6 |
| 11.11 | The Garden of Hush | Dungeon (under-place) | Hybrid | BIO-04 | Cánh đồng người ngủ, hoa trong miệng | F02 Poppy Nurse, P01, P05 Wet-Nurse, P06 Poppy-Mound, W07, P03 | 5·3·35 |
| 11.12 | The Cradle | Cell | Fixed | BIO-27 | Được ôm bởi thứ khổng lồ yêu bạn | P07 Cradle-Warden, P01, P05, P03, **B05 The Hospice Mother** | 5·4·20 |

### Act II — Graveteeth & Sepulcra

| § | Area | Loại | Gen | Biome | Feel tóm tắt | Quái tiêu biểu | D·C·phút |
|---|---|---|---|---|---|---|---|
| 12.2 | The Pilgrim Road | Road | Fixed + dressing | BIO-09 | Hành hương lạnh qua nghĩa địa | D05 Cinder-Clan, U06 Pall-Wight, W02, F03 Exhumer | 3·4·40 |
| 12.3 | The Lowcourse | Hub | Fixed | BIO-07 | Sống dưới sức nặng của mọi người | — (hub) | 2·0·15 |
| 12.4 | The Stair of Penitence | Wild (urban) | Fixed + dressing | BIO-07 | Leo thành phố thánh qua lửa của nó | F04 Kneeler, F05 Bell-Head, F06 Censer-Bearer, F07 Turned Exhumer, U07 Pyre-Risen, W02 | 3·4·35 |
| 12.5 | The Chancery of Courses | Dungeon (heist) | Fixed | BIO-07 | Phá ngân hàng bán thiên đường | F08 Halo Knight, F09 Chancery Guard, L01 Saint-Statue, L02 Plumb-Hound, L03 Gargoyle Mortarer | 3·3·30 |
| 12.6 | The Bell Catacombs | Dungeon | Hybrid | BIO-08 | Đi dưới chuông hát bằng giọng người chết | W08 Bell-Bat, U02, U08 Charnel Chanter, U09 Ossuary-Glutton, U10 Wallshade, **B06 The Choir of Nails** | 4·4·35 |
| 12.7 | The Scriptorium Under the Bells | Dungeon (story) | Fixed | BIO-08 | Sự thật trong phòng không ai thở 600 năm | U11 Scribe-Shade, U08, W01 | 2·2·12 |
| 12.8 | The Cathedral of the First Course | Holy place → set piece | Fixed | BIO-08 | Nơi thánh nhất quay đầu, rồi cháy | F04, F05, F06†, F07, F08, U07† (+ Ignatia đồng minh) | 4·4·22 |
| 12.9 | The Kneeling Vault | Cell | Fixed | BIO-27 | Nhà thờ vô tận mà ai cũng đã quỳ thành nền | P08 Kneeler (Kneeling Dead), P09 Chain-Hung, F06†, F08, U12 The Pressed, **B07 Brother Cassian** | 5·5·25 |

*Ghi chú 12.8:* LD 12.8 chỉ liệt kê Kneelers, Bell-Heads, Halo Knights, Turned Exhumers. F06 Censer-Bearer và U07 Pyre-Risen lấy từ Cast §4.7 ("Kneelers, Bell-Heads, Censer-Bearers, Halo Knights and Pyre-Risen"), nên đánh †. F07 Turned Exhumer chỉ có trong LD, Cast §4.7 không liệt kê (F07 vẫn có ở Stair, Cast §4.3).

*Ghi chú 12.9:* LD 12.9 liệt kê Kneelers (= P08), Chain-Hung, Halo Knights, the Pressed. F06 Censer-Bearer chỉ có trong Cast §4.8, nên đánh †.

### Act III — Blanched Sea

| § | Area | Loại | Gen | Biome | Feel tóm tắt | Quái tiêu biểu | D·C·phút |
|---|---|---|---|---|---|---|---|
| 13.2 | The White Road | Road | Fixed + dressing | BIO-10 | Đi qua biển chết như đoàn xe của tội lỗi | W09 Brine-Worm, W10 Salt-Kite, W11 Pillar-Crab, F10 Salt Reaver, F11 Salt-Dervish, W12 Glass Wasp; **B09 The Chisel** chỉ thấy từ xa, không giao chiến [LD §13.2 Must, §17; Cast §5.1] | 3·3·35 |
| 13.3 | The Wreck Fields | Wild (side) | Hybrid | BIO-10 | Nghĩa địa tàu có biển còn bị nhốt | U13 Salted Dead, U14 Brine-Embalmer, W13 Coilborn, W14 Static Scarab | 3·3·30 |
| 13.4 | Namakhar | Hub | Fixed | BIO-11 | Thành phố người sạch trong xương tàu | — (hub; cảnh sát là F12 không chiến đấu) | 3·0·20 |
| 13.5 | The Undercity of the Flawed | Friendly zone | Fixed + dressing | BIO-12 | Nơi duy nhất còn thấy mặt người | F12 White Watch soldier, F13 Lye Priest (khi đột kích) | 2·2·18 |
| 13.6 | The Lye Baths | Dungeon | Fixed | BIO-11 | Nhà tắm nơi người ta trả tiền để cọ xát đi | P10 The Blanched, P11 Brine Leech, F13 Lye Priest | 4·3·22 |
| 13.7 | The Garden of Pillars | Wild (enclosed) | Fixed + dressing | BIO-10 | Vườn tượng, mỗi tượng là một người | P12 Salt Pillar, W11 Pillar-Crab, P10 The Blanched, **B08 The Pillar-Maker** | 4·3·28 |
| 13.8 | The Old Salt Mine | Dungeon | Hybrid | BIO-06 | Bị thợ đá của thần săn trong nhà thờ muối | D06 Salt-Clan, D01 Hodling, W15 Salt-Burrower, W12 Glass Wasp, **B09 The Chisel** | 4·5·40 |
| 13.9 | The Ship's Heart | Dungeon (side) | Hybrid | BIO-13 | Đáy tàu của nền văn minh đã hoàn hảo rồi biến mất | P13 Halcyon Glass-Folk, P14 Halcyon Sentinel, W14 Static Scarab | 4·3·25 |
| 13.10 | The White Spire | Holy place (vertical) | Fixed | BIO-11 | Phòng trắng đến đau, tìm một thần biết ngáy | P15 Crystal-Sworn, F12 elite; không có boss | 5·3·22 |
| 13.11 | The Salt Cell | Cell | Fixed | BIO-27 | Chiến đấu trong tinh thể nơi mọi mặt thấy chính mình | P15 Crystal-Sworn, P12†, P10†, **B10 Kathara, the White Fire** | 5·5·22 |

### Act IV — Hoarfast

| § | Area | Loại | Gen | Biome | Feel tóm tắt | Quái tiêu biểu | D·C·phút |
|---|---|---|---|---|---|---|---|
| 14.2 | The Frozen Army | Road | Fixed + dressing | BIO-14 | Đội quân đông giữa trận, thì thầm tên mình | U15 Frostbound Host, W16 Rime-Brute, W17 Grave-Wolf, P16 Ice-Mourner | 3·3·35 |
| 14.3 | The Rimewood | Wild | Fixed + dressing | BIO-14 | Thời gian dừng, tuyết bay ngược | D07 Rime-Clan, W16, **B11 The Glass Stag** | 3·3·32 |
| 14.4 | The Frostwives' pyre-groves | Safe zone | Fixed | BIO-15 | Vòng đá, người chết được hát vào bóng tối | — (an toàn) | 1·0·8 |
| 14.5 | Vesnagrad (Hall of Tables) | Hub + holy place | Fixed | BIO-16 | Thành phố ấm nhất, người chết luôn được mời | — (không chiến đấu; bữa tiệc là set piece) | 4·0·25 |
| 14.6 | The siege of Vesnagrad | Set piece | Fixed | BIO-16 | Giữ tường trong tuyết cho thành phố người chết | D07, D01, D08 Taskmaster, D09 Hauler, D03 Kiln-Bull, D10 Gutter-Wing, D11 Spark, **B12 The Hod-Mother** | 2·5·35 |
| 14.7 | The Stillroom | Dungeon | Fixed | BIO-17 | Khoảnh khắc hạnh phúc nhất, giữ đứng yên | P17 The Preserved, P18 Keepsake Doll, P19 Facewearer, F14 Night-Courtier, **B13 The Taxidermist** | 5·3·28 |
| 14.8 | The Archive of Faces | Dungeon (under-place) | Hybrid | BIO-17 | Thư viện mà mỗi cuốn là một khuôn mặt trong lọ | P20 Faceling, P21 Jar-Thing, P22 The Unremembered, F15 Remembrancer, U10 Wallshade | 5·4·40 |
| 14.9 | The Unforgetting Deep | Cell | Fixed | BIO-27 | Thư viện các khoảnh khắc đáng ra đã kết thúc | P17, P19†, P21†, P22†, **B14 The Cabinet** | 5·5·28 |

### Act V — Lanternshore, Course, Seamless

| § | Area | Loại | Gen | Biome | Feel tóm tắt | Quái tiêu biểu | D·C·phút |
|---|---|---|---|---|---|---|---|
| 15.2 | Wrackhaven | Hub | Fixed | BIO-18 | Thị trấn mà mỗi cửa sổ đang chờ | P26 The Waiting (ban ngày vô hại, không chiến đấu) | 4·0·15 |
| 15.3 | The cliffs and lighthouses | Wild | Fixed + dressing | BIO-19 | Đi theo ánh đèn có thể đang nói dối | F16 Wrecker, W18 Wreck-Gull, P23 Beckoner, P24 Lantern-Lure | 3·3·32 |
| 15.4 | The Wrack-Woods | Wild (side, tidal) | Fixed + dressing, theo triều | BIO-20 | Đi trên đáy biển khi biển đã rút | U16 Wrack-Dead, W05 Corpse-Candle, P25 Sunken Pilgrim | 4·3·30 |
| 15.5 | The Sunken Chapel | Dungeon | Fixed | BIO-21 | Nhà nguyện nửa chìm, đèn cho thấy điều bạn khao khát | F17 Lamplighter cultist, P25, U10†, **B15 The Lamplighter** | 4·4·28 |
| 15.6 | The Dawn Ship | Set piece (side) | Fixed | BIO-21 | Tàu ma hứa đưa người tới bình minh | U16†, P23†, P26† | 3·2·18 |
| 15.7 | Wrackhaven by night | Set piece (hub ban đêm) | Fixed | BIO-18 | Đêm người chết trở về và gõ cửa | P26, P27 The Promised (một ít) — "không phải trận đánh" | 5·2·12 |
| 15.8 | The Long Sands | Set piece | Fixed | BIO-20 | Đi về nhà qua trận đánh, về phía ánh sáng lớn dần | P27, P26, P25†, U16†, L04 Course-Warden (trung lập/đồng minh ở đây: chém the Promised, bỏ qua hero; chỉ thù địch trong the Course), Masons (đồng minh) [Cast §7.7, LD §15.8] | 3·5·30 |
| 15.9 | Ebbmount Abbey | Holy place → cell | Fixed | BIO-22 | Leo tới đám cưới đã chờ một nghìn năm | P23 Beckoner, P24†, P27†, **B16 Severin, the Lamp-Bearer** | 4·4·35 |
| 15.10 | The Course (inside the Wall) | Otherworld | Fixed (story) / Procedural (endless) | BIO-23 | Địa ngục bằng người, hoá ra là người đang giữ nhau | U12 The Pressed, L04, D12 Slag-Clan, D13 Mallet-Hod, D14 Slag-Knight, D15 Mocker, D16 Kiln-Lord, D11 Spark, U09†, U10†, D10† | 4·4·40 |
| 15.11 | The Seamless | Otherworld (final) | Fixed | BIO-25 | Hoàn hảo nhất, và là kết thúc của mọi thứ | X01 The Perfect, **B17 The Unbroken, the Seamless Dawn** | 5·4·22 |

### Ending

| § | Area | Loại | Gen | Biome | Feel tóm tắt | Quái tiêu biểu | D·C·phút |
|---|---|---|---|---|---|---|---|
| 16.1 | The keystone gate | Ending space | Fixed | BIO-24 | Bước đi cuối cùng, bằng lựa chọn | — (Masons quỳ, không chiến đấu) | 2·0·5 |

### Nguồn của dấu †

† nghĩa là ID **không có trong text LD card** của area đó. Nguồn đối chiếu là Cast (đã đọc trực tiếp):

| § | ID † | Nguồn Cast |
|---|---|---|
| 12.8 | F06, U07 | Cast §4.7 |
| 12.9 | F06 | Cast §4.8 |
| 13.11 | P10, P12 | Cast §5.10 |
| 14.9 | P19, P21, P22 | Cast §6.8 |
| 15.5 | U10 | Cast §7.4 |
| 15.6 | U16, P23, P26 | Cast §7.5 (LD 15.6 không có mục Encounters) |
| 15.8 | P25, U16 | Cast §7.7 |
| 15.9 | P24, P27 | Cast §7.8 |
| 15.10 | U09, U10, D10 | Cast §7.9 |

---

## 6. Mood theo map trong cùng act (có thể đổi)

**Nguyên tắc:** mood quyết định theo từng **map** và có thể khác ngay trong cùng act [AD §7]. Trong cùng Act I, Night Fens, Poppy Reach và Gentle House có mood khác nhau. Bảng màu act (LD §5.4) vẫn là khung lore.

**Map 1 — mood Act I Diablo II** (AD §7.1, quyết định người dùng):

- **Quyết định:** map 1 hướng tới mood Act I của Diablo II.
- **Không đồng nhất** map 1 với toàn Act I hay Prologue. AD §7.1 ghi "chưa đồng nhất"; phạm vi map 1 **chưa xác nhận**.
- **Không có mapping chính thức** từ Map 1 sang area nào trong master table. File này **không gán** Map 1 vào area nào.
- **Điểm xuất phát lookdev** (AD §7.1, chưa dựng): `stylized2_green` + scene `darkWoodD2`.
- **Mô tả mood** (AD §7.1, đề xuất triển khai): không khí đồng hoang/rừng ẩm lạnh, hoang vắng nhưng đi được; xanh cỏ sẫm, đất nâu bùn, đá xám cũ, điểm ấm ở nơi có người; ánh sáng u ám tiết chế.
- **Style:** `stylized2` (AD §7, §4). Mood D2 là về màu và không khí, không đưa lại chi tiết ảnh thực.
- **Chưa khóa:** giờ trong ngày, góc camera, budget, số màu, chi tiết map.

**Thẻ mood cho mỗi map (AD §7.2)** — điền trước khi lookdev:

| Trường | Ghi chú |
|---|---|
| Map / vùng | Ghi ID map, không suy từ act |
| Mood mục tiêu | Một câu cảm xúc + tham chiếu |
| Palette | nền / điểm ấm / accent (HEX đề xuất, không phải canon) |
| Lighting & thời tiết | nguồn sáng chính, sương, mưa, gió |
| Tương phản & value | cách tách hero – địch – nền |
| Nhịp cảm xúc | diễn biến theo tuyến đi |
| Style kế thừa | `stylized2` hoặc ghi ngoại lệ |
| Trạng thái | đề xuất / lookdev / đã duyệt |
| Chưa khóa | camera, budget, chi tiết map |

**Ví dụ trong cùng Act I, không phải mapping chính thức:** Night Fens (tiếng ru, đêm, nước đen) và Poppy Reach (ban ngày, khói ngủ, poppy đỏ nhất) và Gentle House (ấm, sạch, không nhấp) là ba mood khác nhau trong cùng act [LD §11.1 "act đổi look và verb mỗi 20–40 phút"].

---

## 7. Hub: an toàn mặc định và ngoại lệ story

Định nghĩa hub [LD §1.4]: vendor và quest-giver, **không chiến đấu trừ raid có kịch bản**.

| Hub | Mặc định | Ngoại lệ story (nguồn) |
|---|---|---|
| Lychgate (11.2) | An toàn | Không có chiến đấu trong bảng LD. Epilogue: Tamsin làm sexton [LD §16.2]. |
| The Lowcourse (12.3) | An toàn | Không chiến đấu trong LD. |
| Namakhar (13.4) | Combat ○○○○○ nhưng LD gọi là "a hostile hub" và "the least safe hub in the game" (Must); cột muối ở cổng thấy từ mọi tầng [LD §13.4]. Hệ thống ngụy trang mềm là Proposal [LD-P §13.4]. | Không có đột kích ở hub. Đột kích diễn ra ở 13.5 Undercity ("friendly zone with raids") [LD §13.5]. |
| Vesnagrad (14.5) | An toàn; bữa tiệc là set piece không chiến đấu. | Siege (14.6) là set piece có chiến đấu theo kịch bản [LD §14.6]. |
| Wrackhaven (15.2) | An toàn ban ngày. | Wrackhaven by night (15.7) là set piece có kịch bản; "không phải trận đánh" [LD §15.7]. |

**Khu an toàn ngoài hub:** pyre-groves (14.4), breath room mọi dungeon [LD §7.5], Gentle House (11.9, không chiến đấu [LD §11.9]), các đoàn tụ trong Course [LD-P §15.10].

---

## 8. Quái: tiêu biểu theo biome

Danh sách trên là rút gọn. Bảng sau tổng hợp theo biome để tra nhanh; **không phải roster đầy đủ**.

| Biome | Quái tiêu biểu (ID) | Boss liên quan |
|---|---|---|
| BIO-01 Đầm lầy | P01, W03, W04, W05, U05, W06, U01 (Mire-) | B02, B04 |
| BIO-02 Đồng thuốc phiện | P02, P03, P04, F02 | — |
| BIO-03 Làng & sân | U01, U02, U03, U04, W01, W02, F01 | B01 |
| BIO-04 Hầm xương & vườn | P01, P05, P06, P03, F02, W07, U01, W01 | — |
| BIO-05 Hospice | — | — |
| BIO-06 Mỏ & Spoil | D01, D02, D03, D04, W07, D06, W15, W12 | B03, B09 |
| BIO-07 Thành bậc | F04, F05, F06, F07, F08, F09, U07, L01, L02, L03, W02 | — |
| BIO-08 Nhà thờ & chuông | W08, U02, U08, U09, U10, U11, W01, F04, F05, F07, F08 | B06 |
| BIO-09 Đèo | D05, U06, W02, F03, F04 (Pilgrim Road) | — |
| BIO-10 Biển khô | W09, W10, W11, W12, F10, F11, U13, U14, W13, W14, P10, P12 | B08 |
| BIO-11 Hulk trắng | P10, P11, F12, F13, P15 | B10 (Salt Cell) |
| BIO-12 Undercity | F12, F13 | — |
| BIO-13 Halcyon | P13, P14, W14 | — |
| BIO-14 Băng | U15, W16, W17, P16, D07 | B11 |
| BIO-15 Đồi tro | — (an toàn) | — |
| BIO-16 Vesnagrad & vườn kính | D01, D03, D07, D08, D09, D10, D11 | B12 |
| BIO-17 Phòng ướp & kho | P17, P18, P19, P20, P21, P22, F14, F15, U10 | B13, B14 |
| BIO-18 Wrackhaven | P26, P27 | — |
| BIO-19 Vách đá | F16, W18, P23, P24 | — |
| BIO-20 Lộ triều & Long Sands | U16, W05, P25, P26, P27, L04 | — |
| BIO-21 Nước & tàu | F17, P25, U10, U16, P23, P26 | B15 |
| BIO-22 Ebbmount | P23, P24, P27 | B16 |
| BIO-23 Course | U09, U10, U12, D10, D11, D12, D13, D14, D15, D16, L04 | — |
| BIO-24 Keystone | — | — |
| BIO-25 Seamless | X01 | B17 |
| BIO-26 Mộng Edda | — | — |
| BIO-27 Cell | P01, P03, P05, P07, P08, P09, P10†, P12†, P15, P17, P19†, P21†, P22†, F06†, F08, U12 | B05, B07, B10, B14 |

**Quái thường đi khắp nơi** [checklist]: D04 Tithe-Thief (mọi act, hiếm), L01 Saint-Statue (mọi nhà thờ), L02 Plumb-Hound và L03 Gargoyle Mortarer (từ Act II).

---

## 9. Nguồn, bất nhất và chưa khóa

### 9.1 Bất nhất giữa các nguồn (không tự giải quyết)

1. **Năm quái hai họ** (checklist mục "Việc cần chốt"): F02, F05, F06, F08, F13 — Bible §6 xếp là spawn Perfection; Bible §14.2 và Cast xếp Faithful. Chưa khóa.
2. **Hai "Kneeler"** — F04 (người sống) và P08 (người chết trong Vault). Checklist đề xuất đổi P08 thành "the Kneeling Dead". Chưa khóa. Cast §4.3 ghi F04 là "Faithful / Perfection-born (Devotion)"; Bible §14.2 liệt kê Kneelers ở cả hai họ.
3. **Warped chứa thứ không phải động vật.** W03 là người biến hình, W05 lửa ma, W06 rễ và xương (checklist). Chưa khóa.
4. **Màu rarity va chạm với palette act** [LD §5.5]. LD đã nêu, chưa có giải pháp chốt.

### 9.1b Ghi chú (không phải mâu thuẫn nguồn)

- **Số area "49" và "50".** LD §9.8 ghi "Total 49" (không gồm ending); LD §17 có 50 hàng vì có 16.1. Tài liệu này dùng: **49 trước ending**, **50 kể cả ending**.
- **Hub Namakhar.** LD §13.4 gọi thẳng là hub thù địch ("a hostile hub", "the least safe hub in the game") với Combat ○○○○○; xem §7.
- **Trắng Act III và trắng Seamless.** LD §5.4 khẳng định là hai màu khác. Không gộp.

### 9.2 Chưa có HEX gốc (THIẾU HEX)

Không đặt HEX canon cho các vật liệu sau. Cần đề xuất riêng nếu cần:

- Trắng vôi, lanh (Gentle House, Cradle); trắng kính muối (Halcyon); trắng plaster (Hulk).
- Chalk và đá lửa (Flint Delvings); đá Mason xám (Keystone).
- Đèn night-light, ánh nến không nhấp, ánh cold white của Wall.
- Gỗ đen Vesnagrad, tảo nâu xanh, nước xanh lá Sunken Chapel, vải và mực trong undercity.

### 9.3 Chưa khóa (theo AD và LD)

- Phạm vi map 1 (AD §7.1).
- Chủ sở hữu ánh sáng của nến cửa sổ Wrackhaven (BIO-18): nhấp hay đứng yên chưa có nguồn.
- Giờ trong ngày, góc camera, budget, số màu cuối (AD §7.1, §7.2).
- Lộ trình chi tiết các biome trong hub (LD §7.3: "Plan the after state from the start").
- Roster quái đầy đủ theo khu: xem checklist. Bảng này chỉ tiêu biểu.

### 9.4 Nguồn đã đọc trực tiếp

- **Cast** đã được đọc trực tiếp ở vòng sửa này để đối chiếu danh sách quái theo area (Cast §2–§7), phục vụ nhãn † (xem bảng "Nguồn của dấu †" sau §5). Cột "Act · khu" vẫn lấy từ checklist.

---

## 10. Kiểm đếm tự động

Đã kiểm bằng script trên bảng §5 và §4 (xem kết quả tóm tắt bên dưới):

- Tổng hàng area trong §5: **50** (49 trước ending + 16.1).
- Mỗi § của LD §17 xuất hiện **đúng một lần** trong §5.
- Mỗi area được gán **một** biome.
- Biome có area: **27** ID (BIO-01 → BIO-27), không có ID nào không có area.
- Phân bổ theo act: Prologue 2, Act I 11, Act II 8, Act III 10, Act IV 8, Act V 10, Ending 1. Cộng 50.

**Kết quả đã chạy (2026-10-20):** 50 hàng §5; 50 § duy nhất, khớp đúng với LD §17, không thừa, không thiếu; 49 trước ending + 16.1; 27 heading biome trong §4, 27 biome được dùng, không có biome mồ côi; mọi hàng có D·C·phút hợp lệ; 9 hàng có quái đánh dấu † (19 lượt †; không có trong LD card, nguồn Cast, xem bảng "Nguồn của dấu †").
