# Art_Final — Quy định bố trí asset trong biome và ánh sáng

> Ngày 2026-10-26. Áp dụng khi dựng hoặc sửa một map (lab hay game) từ asset trong `ashlar/Art_Final/`.
> Asset nào được đặt ở biome nào: [`ASSET_THEO_BIOME.md`](ASSET_THEO_BIOME.md).
>
> Nguồn: nhịp không gian từ [`ashlar/docs/ASHLAR_BIOME_VA_KHU_VUC_VI.md`](../docs/ASHLAR_BIOME_VA_KHU_VUC_VI.md) §2 (tổng hợp LD);
> thứ tự bố trí, mật độ, che khuất từ `legacy/art-direction/12_QUY_CHUAN_QUAI_CANH_QUAN_CONG_TRINH.md` (AD 12) §4–§5, số mét lấy từ
> `LAYOUT_RULES` trong `lookdev-lab/src/env/biomeLayout.js`; ánh sáng có chủ và màu từ [`ashlar/art-direction/artdirection.md`](../art-direction/artdirection.md)
> §4.3, §7, §8; giá trị đèn Act I từ khối `moods` của `lookdev-lab/src/env/act1/maps/*.js` (đã nâng sáng 23/10, `tmp/act1-base-maps/BRIGHTNESS.md`).
> Quy tắc ghi **[mới]** là quy tắc do file này đặt ra.

---

## 0. Đơn vị và camera

| Ký hiệu | Giá trị | Ghi chú |
|---|---|---|
| **H** | 1,8 m | Chiều cao hero đứng thẳng |
| **Sub** | ≈ 0,47 m (0,26 H) | Ô chiếm chỗ dưới chân, quy đổi từ subtile D2. **Không** phải 1 m |
| Camera chơi | Ortho isometric, cao khung 12 m, 16:9, nghiêng 30° | Một màn hình ≈ 21,3 × 24 m mặt đất |
| Tốc độ chạy (Play) | 5,6 m/s | Dùng để quy thời gian đi bộ ra mét |
| Module map | 16 m | Đơn vị tải và ngân sách (§8) |

Mọi kích thước asset dùng **kích thước thật** (danh mục `ashlar/3d/README.md` và bảng fit `tmp/act1-base-maps/ACT1_KIT_FIT.md`), không dùng cỡ chuẩn hoá 1 m của GLB.

---

## 1. Nhịp không gian theo loại area

| Loại | Quy chuẩn | Nguồn |
|---|---|---|
| **Hub** | Đi qua ≈ 40 giây (≈ 220 m đường đi ở 5,6 m/s). Là phòng nghỉ, không phải thành phố. Có **một ngưỡng ánh sáng vật lý** (cổng, cầu, cửa): vào hub là một quyết định. Không chiến đấu trừ cảnh có kịch bản | LD §7.3 |
| **Wild** | Xen kẽ khoảng mở và điểm nghẽn mỗi 40–60 giây di chuyển. 1 landmark thấy từ phần lớn khu; đích của act thấy được từ ít nhất 1 chỗ cao. 3–6 chỗ làm Rite, mỗi chỗ một cảnh khác nhau. Ít nhất 1 vignette không đánh dấu trên bản đồ | LD §7.4, §7.8 |
| **Dungeon** | ≥ 3 kiểu phòng (room grammar), 1 cơ chế đặc trưng, ≥ 3 vignette dựng tay, 1 phòng nghỉ (breath room) sáng bằng ánh sáng người mỗi tầng | LD §7.1, §7.5 |
| **Cell / boss arena** | Đọc được ở mật độ hiệu ứng tối đa. Nội thất giả vô hạn. Một cơ chế boss gắn môi trường | LD §7.6 |
| **Holy place** | Không chiến đấu (Gentle House): ẩn UI chiến đấu, camera thấp và gần hơn | LD §11.9 |
| **Map lab (lát cắt đầu)** | Cạnh dài ≤ 256 m, độ phân giải terrain ≤ 1 m | SPEC Act I base maps |

Mỗi area phải đạt ít nhất hai trong ba cảm giác Dread, Tenderness, Weight, và có **một hình phải nhớ** (Remember) đặt thành vignette có đánh dấu
trong file map.

---

## 2. Thứ tự bố trí (AD 12 §4.6)

Bố trí theo đúng sáu bước; bước sau không được làm hẹp những gì bước trước đã khoá.

1. **Khoá vùng chơi:** đường chính, nhánh phụ, cửa, chỗ đứng tương tác, điểm spawn, vùng chiến đấu, mép nước.
2. **Khối lớn:** công trình, vách, cây lớn, đá chính. Mỗi bố cục một điểm nhấn; khối cao đặt về phía sau màn hình (trên-trái, trên-phải).
3. **Cụm có chức năng:** chỗ làm việc, nghỉ, tích trữ, nghi lễ. Đồ phụ đặt quanh vật chủ của nó, không bốc ngẫu nhiên từ cả thư viện.
4. **Dấu dẫn đường:** đèn, biển, cọc, khung cửa. Kiểm hướng nhìn ở từng điểm rẽ trước khi thêm chi tiết nhỏ.
5. **Sinh thái:** đất → thảm cỏ thấp → bụi cỏ → cây bụi; mật độ theo độ ẩm, dốc, giẫm đạp, bóng công trình, mức tha hoá.
6. **Dấu vết:** xương, lá, đồ vỡ, bùn, vết kéo. Chừa nền sạch giữa các cụm, rồi kiểm lại va chạm và che khuất.

Mỗi asset khi đưa vào catalog phải khai báo: biome và vùng con, vai trò (nền / vật cản / tương tác / nguy hiểm / dẫn đường), footprint sau xoay
và scale, khoảng trống phía sử dụng, mặt trước, khoảng scale, chất nền hợp lệ, vật chủ nếu có. **Đặt không vừa thì bỏ hoặc đổi bố cục, không ép
đủ số lượng.** Engine `biomeLayout.js` làm đúng thứ tự này; map dựng tay cũng theo thứ tự này.

### 2.1 Bảy lớp cảnh quan (từ dưới lên)

| Lớp | Nội dung | Va chạm |
|---|---|---|
| 1 Sàn nền | Cỏ, đất, đá, bùn; tương phản nội bộ thấp ("quiet floor") | — |
| 2 Chuyển tiếp | Mép cỏ/đất, đường mòn, vũng | — |
| 3 Decal | Đá vụn, lá, xương nhỏ | Không cản đường |
| 4 Prop thấp ≤ 0,5 H (≤ 0,9 m) | Bụi, đá nhỏ, mộ thấp | Tuỳ |
| 5 Prop cao 0,5–3 H (0,9–5,4 m) | Cây, tảng đá, cọc, bia | Cản, có bóng |
| 6 Vách / mép | Vách, mép nước, bờ đê, hàng rào | Ranh giới vùng chơi |
| 7 Landmark ≥ 2 H (≥ 3,6 m) hoặc độc nhất | Tháp ossuary, đá nghiêng trên đê, Gentle House trên đồi | Cản |

---

## 3. Khoảng trống, mật độ, nhịp

| Quy tắc | Giá trị | Nguồn |
|---|---|---|
| Đường chính rộng | ≥ 3 Sub (≈ 1,4 m); mặc định đường lớn 4,2 m, nhánh 2,6 m, lối mòn 1,4 m | AD 12 §4.3, `LAYOUT_RULES.pathWidth` |
| Cửa | ≥ 2 Sub rộng; cửa đơn cao 1,3–1,5 H; cổng lớn 2–3 H cao, ≥ 3–4 Sub rộng. Cửa đi được trong Play cần cao ≥ 2,2 m | AD 12 §5.1, Act I base maps |
| Vùng chiến đấu | Mỗi 1–2 màn hình một vùng mở ≥ 8 × 8 Sub (≈ 3,8 × 3,8 m; đây là mức tối thiểu, trận đông cần rộng hơn) | AD 12 §4.3 |
| Khe giữa hai vật cản khác nhóm | ≥ 2 Sub (≈ 0,95 m) để đi lọt | `passGap` |
| Footprint cách mép đường | ≥ 0,3 m; cách mép nước ≥ 0,5 m; cách biên map ≥ 0,5 m | `pathClear`, `waterClear`, `edgeMargin` |
| Khoảng cách giữa hai cụm | ≥ 2,2 m nền sạch | `clusterClear` |
| Khối lớn tự sinh | Tâm cách nhau ≥ 12 m; 1 khối chính + 1–3 khối phụ cỡ 35–65 % khối chính | `massSpacing`, `massSecondary*` |
| Landmark | 1 cái mỗi 1–2 màn hình (cửa sổ 32 m), cao ≥ 2 H, thấy được trong ≈ 18 m từ đường | `landmark*` |
| Prop cao che màn hình | ≤ 25 % diện tích một màn hình | AD 12 §4.3, `occlusionMax` |
| Cụm prop | Nhịp 1 lớn – 2 trung – 3+ nhỏ (tham khảo, không phải khuôn) | AD 12 §4.3, §4.8 |
| Cụm decal kể chuyện | 3–7 vật; 1 điểm chính + 2–6 mảnh phụ lệch về một phía | AD 12 §4.3, §4.10 |
| Mép nước, mép vực | Value khác sàn ≥ 15 điểm, mép rõ | AD 12 §4.4 |
| Blend terrain | Mềm, rộng 1,5–3 m, không cắt gắt | AD §7.1 |

### 3.1 Cỏ và sinh thái (AD 12 §4.7)

- Mảng lớn không đều, tâm dày, rìa đứt, có lỗ đất trống; không vòng tròn viền rõ, không ô bàn cờ.
- Cụm 3–7 bụi quanh tâm lệch, khác bán kính và số bụi; vài bụi lẻ tách khỏi cụm.
- Chiều cao: cỏ nền 0,08–0,20 H; cỏ mép 0,20–0,35 H; cỏ cao hơn chỉ nơi không che vùng đánh.
- Mép đường: dày ở vai đường, thưa dần vào vệt giẫm; mép gãy, không hai hàng viền song song.
- Ít cỏ trên dốc, đá trơ, bùn giẫm; không cỏ đồng trên mặt nước; bờ ẩm dùng cụm riêng.
- Chân prop có một ít đất lộ; cỏ không xuyên chân tường, đá, sàn.
- Cửa, chỗ tương tác, spawn không có cỏ cao; arena dùng thảm ngắn, thưa. Cỏ không có collision và không mang màu hoặc glow giống loot.
- Hàng lối chỉ có ở ruộng người trồng (và luống người ngủ ở Garden of Hush); đồng hoang không có hàng.

### 3.2 Prop theo người dùng (AD 12 §4.8)

- Đá, cây: một khối chủ + khối phụ khác cỡ; chân theo địa hình, đá chìm một phần. Không có các tảng bằng nhau cách đều, đá lơ lửng, cây xuyên đá.
- Bàn, ghế, giá, thùng: sắp theo người dùng (ghế hướng vào chỗ nghỉ, giá cạnh chỗ làm, thùng sát tường). Không quay mọi mặt trước về camera.
- Đồ đổ vỡ có nguồn: vật nặng gần nguồn, mảnh nhẹ xa hơn.
- Hàng rào, tường: khoảng hở trông đi được thì collision phải mở. Không để dây hay cọc cắt đường.
- Vật tương tác: chừa chỗ đứng dùng; đồ phụ không che rương, đền; xương trang trí không sáng như vật bấm được.
- Phân biệt ba vùng: **chiếm chỗ**, **thao tác**, **che camera**. Mesh không có collision vẫn có thể che loot hay telegraph.

### 3.3 Dấu vết (AD 12 §4.10)

Chọn nguyên nhân trước khi chọn asset (mộ bị đào → đất mới, nắp vỡ, hài cốt; người ngủ bỏ đi → giày, nôi, chăn). Không trộn mọi thứ vào cùng
cụm. Xương bám đất, chìm nhẹ, ngà bẩn, không glow. Đồ cũ đi với dấu cũ; không thêm máu tươi cho nổi. Act I không có gore ở Garden of Hush.

### 3.4 Điều chỉnh theo vùng con Act I

| Vùng con (biome) | Cỏ và khoảng trống | Prop và dấu vết | Dẫn hướng |
|---|---|---|---|
| Làng hub (BIO-03) | Đất giẫm quanh quảng trường, cỏ ở chân tường | Đồ nghề cạnh lò rèn, sạp, giếng; thùng sát nhà | Cửa sổ ấm, giỏ lửa ở cổng, lò rèn |
| Sân nhà thờ (BIO-03) | Cỏ ở khe và mép mộ, lối thưa | Mộ có hướng văn hoá; thuỷ tùng chỉ ở mép; xương chỉ ở chỗ mộ bị xâm phạm | Cổng lychgate, nến ở mộ quan trọng, tháp ossuary |
| Đầm, đê (BIO-01) | Sậy và cói thành dải dọc mép nước; đê là lối đi | Đồ trôi theo mép nước; thuyền, bè, cọc | Đê, đá đứng, cửa sổ Gentle House xa; đèn ma (W05) là **mồi**, không phải dẫn đường |
| Làng chìm (BIO-01) | Ít cỏ; mặt nước phẳng như gương | Đi trên mái và cầu ván, **không bơi**; vignette dưới nước | Tháp chuông nhô khỏi nước, đèn trắng của bến |
| Đồng anh túc (BIO-02) | Anh túc tới chân trời trên cỏ xanh xám; lối giữa tường đá khô | Đồ gặt bỏ dở, giường trống trong trại; khói ngủ là địa hình có viền rõ | Dốc lên Gentle House, cửa sổ ấm trên đỉnh |
| Hospice (BIO-05) | Cỏ sân trong cắt gọn | Đối xứng, hàng lối, không một chỗ vá; không đồ con người | Cửa sổ cao ấm; không nhạc dồn, không ánh đỏ |
| Vườn ngủ (BIO-04) | Luống đất thẳng hàng | Mỗi hàng là người khác nhau; đèn ngủ cạnh mỗi người | Đèn phía trước (lần đầu xuất hiện), cột chuông |
| Cell Cradle (BIO-27) | — | Hàng nôi giống hệt chạy vào sương đen | Đèn ngủ trắng sữa, tắt dần |

---

## 4. Công trình và che khuất (AD 12 §5)

| Thành phần | Kích thước |
|---|---|
| Tường nội thất | Cao 1,5–2 H |
| Tường ngoài, tường thành | Cao 2–3 H, chỉ ở phía sau màn hình |
| Hành lang, cầu thang | Rộng ≥ 3 Sub; cầu thang là điểm sáng hoặc tối khác biệt |
| Phòng thường / phòng boss | ≥ 8 × 8 Sub / ≥ 20 × 20 Sub |
| Cột | Đường kính 0,5–1 Sub, không đặt chắn lối chính |

- Tường hoặc công trình phía trước hero (nam, đông màn hình) cao ≤ 0,5 H, hoặc tự mờ / ẩn khi hero ở sau.
- Không công trình nào che toàn bộ hero quá 0,5 giây khi đi bình thường.
- Không làm mờ tường khi hero đi trên cầu thang (bài học Old Face).
- Mặt công trình đặt ở bậc terrain phải nằm trong pad; đo mặt thật, không đo bbox (bài học A21.2, A21.1).
- Công trình có ba lớp thời gian: xây gốc → thời gian → thảm hoạ gần đây; lớp thứ ba dày dần khi vào sâu. Không gian Perfection không có lớp
  thời gian (đó là dấu hiệu cảnh báo).

---

## 5. Ánh sáng

### 5.1 Nguyên tắc

- **Ánh sáng có chủ** (AD §4.3). Người xem phải biết ai sở hữu ánh sáng qua cách nó chuyển động:

| Chủ | Chuyển động | Màu, hình | Nghĩa |
|---|---|---|---|
| Con người | Lập loè, có khói | Nhỏ, ấm, không đều, muội phía trên | Có người, an toàn tương đối |
| Perfection | Đứng yên tuyệt đối | Đẹp, đều, nhiều nguồn giống nhau xếp hàng | Cult, cell, lời nói dối |
| Discarded | Phập phồng như bễ | Đỏ cam, từ trong khe | Đói, lò, đột kích |
| The Wall | Điểm đứng yên hoặc lung linh chậm | Trắng lạnh | Unbroken rò ra |
| Masons | — | Không phát sáng | Bị theo dõi |

- **Ánh sáng đẹp thường là nói dối:** đèn Gentle House, đèn ngủ, ngọn đèn phía trước đều không lập loè.
- **Ánh sáng phải có nguồn thật** (nến, đèn, lò, giàn thiêu). Ngoài vùng sáng là bóng tối đen, không phải sương xám. Light radius giảm theo 5–8
  bậc nhìn thấy, không gradient mượt (LD-P §5.3).
- **Value trước hue:** bỏ màu đi vẫn tách được hero, quái, nền, telegraph. Thử ảnh xám ở mật độ combat cao nhất.
- **Rim light** cho mọi thứ gây sát thương: rim lạnh ở vùng ấm, rim ấm ở vùng lạnh (LD §8.1). Không áp cho concept sheet.
- **Một hướng sáng chính** cho mọi tile và prop bake trong một map (AD 12 §4.1).
- **Màu cấm của act** (AD §8) áp cho cả ánh sáng: Act I cấm nắng và trắng sạch ngoài vải Mercy; Prologue không có accent.

### 5.2 Bộ đèn của một map

Mỗi map khai báo các mood trong khối `moods` của file map. Một mood gồm:

| Nút | Ý nghĩa | Ghi chú |
|---|---|---|
| `sky`, `ground`, `hemi` | Ánh sáng nền trời/đất | Nút chính để nâng sáng mà không đổi tông |
| `sun` (`elev`, `az`, `intensity`, `kelvin`) | Mặt trời hoặc trăng | Act I ban ngày là u ám: cường độ thấp (≤ 0,5), không có bóng nắng gắt |
| `env`, `envI` | HDRI phản chiếu | `envI` cao làm nhạt phòng ấm (bài học Gentle House 23/10): giữ thấp trong nhà |
| `toneMapping`, `exposure` | ACES, EV | Exposure đẩy vùng sáng tới clip trước; giới hạn bởi điểm sáng nhất của map |
| `fog` | Sương mũ theo chiều cao | Ban đêm màu gần đen; ban ngày xám xanh của palette |
| `grade` | vignette, contrast, saturation, temperature | `saturation` là nút duy nhất giữ màu ấm khi nâng sáng |
| `human`, `perfection`, `windows` | Hệ số theo chủ ánh sáng | Prologue: `perfection: 0` (cửa sổ Gentle House tắt) |
| `flags` | Bật tắt theo cốt truyện | accent, nến mộ, đèn Gennet, đèn mồi, đèn bến |
| `lights`, `floorTone`, `lantern` | Nội thất | Hệ số đèn, tông sàn, bán kính đèn hero |

Mỗi map giữ thêm một mood **"Soi texture · sáng đều"** để soi asset; mood này không phải mood chơi và không chỉnh theo bảng dưới.

### 5.3 Giá trị tham chiếu Act I (mood chơi, sau nâng sáng 23/10)

| Map · mood | Biome | sky / ground | hemi | sun / moon | env · envI | exposure | fog (màu · mật độ) |
|---|---|---|---|---|---|---|---|
| lychgate · `day` (mưa phùn ban ngày) | BIO-03 | `#a9b1a6` / `#4a3526` | 2,3 | 0,5 · 7000 K · elev 62° | overcast · 0,4 | 0,75 | `#8c958a` · 0,016 |
| lychgate · `night` (Prologue, đêm mưa) | BIO-03 | `#4e5f7a` / `#1c241f` | 2,2 | 0,8 · 9000 K | night · 0,12 | 1,5 | `#1a2228` · 0,016 |
| fens · `night` (Night Fens) | BIO-01 | `#3a4a64` / `#121816` | 1,9 | 0,63 · 9500 K | night · 0,17 | 1,85 | `#18212a` · 0,014 |
| fens · `still` (Rook's Weir) | BIO-01 | `#40506a` / `#141a18` | 1,8 | 0,8 · 9000 K | night · 0,22 | 1,75 | `#1a232c` · 0,008 |
| poppyReach · `day` (u ám) | BIO-02 | `#b2b9ae` / `#4d4232` | 2,6 | 0,36 · 6600 K | overcast · 0,48 | 0,8 | `#a2a99f` · 0,0072 |
| gentleHouse · `warm` (trong nhà) | BIO-05 | `#7a6d5f` / `#1d1813` | 3,3 | — | overcast · 0,1 | 0,95 | `#2a2e2b` · 0,004 |
| gentleHouse · `rain` (ngoài cổng) | BIO-05 | `#a9b1a6` / `#4a3526` | 3,6 | — | overcast · 0,32 | 0,78 | `#7f877e` · 0,008 |
| gardenOfHush · `hush` | BIO-04 | `#4c4548` / `#140f0f` | 1,5 | — | night · 0,08 | 1,3 | `#070506` · 0,035 |
| cradle · `cradle` (trắng sữa đứng yên) | BIO-27 | `#4c4a48` / `#0b0a0b` | 1,1 | — | night · 0,06 | 1,3 | `#030304` · 0,06 |

Grade chi tiết và các flag nằm trong file map. Khi tạo map mới cùng biome, bắt đầu từ dòng của biome đó rồi chỉnh theo thẻ mood của map
(AD §2.1). Map mới của act khác bắt đầu từ palette act (AD §8), không chép số Act I.

### 5.4 Đèn điểm theo chủ

Giá trị đang dùng ở `lychgate` và `fens` (định nghĩa `lights` trong file map):

| Loại (`kind`) | Màu | Cường độ · tầm | `flicker` | Ví dụ |
|---|---|---|---|---|
| `human` | `#e0a050` (nến Act I), `#e8a858`, giỏ lửa `#e8903a` | 3–6 · 6–9 m | 0,6–1,4 | Cửa sổ Edda, nến cửa hầm, đèn Gennet, giỏ lửa Osric |
| `human` chỉ glow | Như trên | 0 · 0 (không chiếu sáng) | 1–1,4 | Tàn tẩu Gennet, đèn người đào mộ |
| `perfection` | `#f6b468` (cửa sổ Gentle House) | Glow lớn, không chiếu | **0** | Cửa sổ xa trên đồi: sáng nhất và đứng yên nhất act |

- Đèn Perfection luôn `flicker: 0`. Đèn người luôn `flicker > 0`. Không dùng chung một kiểu đèn cho hai chủ.
- Đèn mồi đầm (A06.4) luôn tắt. Đèn ma W05 là quái, đứng yên và đẹp vì là mồi.
- Mỗi đèn dẫn đường đặt ở chỗ người chơi cần quyết định (trước ngã rẽ, cạnh cổng, đầu cầu), trên vai đường; cặp đèn chỉ cho cổng quan trọng.
  Đèn chỉ ở nơi có người duy trì; hang thú và đồng hoang dùng đá, cây, dấu chân làm mốc (AD 12 §4.9).

### 5.5 Ngân sách đèn

| Quy tắc | Giá trị | Nguồn |
|---|---|---|
| Đèn thật (point light chiếu sáng) mỗi màn hình | ≤ 4 | AD 12 §4.9 |
| Đèn thật mỗi module 16 m | ≤ 5 | AD 12 §4.14.3 |
| Tạo đèn | **Mọi point light tạo lúc tải**, ban đầu tắt, bật khi module của nó hiện | Số đèn nằm trong khoá shader: thêm đèn sau là biên dịch lại mọi vật liệu (AD 12 §4.14.5) |
| Bóng động | Chỉ nguồn quan trọng | AD 12 §4.9 |
| Shadow map phụ | Không thêm trên WebGPU | WebGPU hết 16 sampler, terrain hỏng (bài học lab) |
| Đèn còn lại | Dùng glow / emissive (`real: false`), không chiếu sáng | Như tàn tẩu, đèn người đào mộ |

### 5.6 Kiểm độ sáng

- Map đêm vẫn đọc là đêm; không cần tăng gamma mới tìm được đường (AD 12 §4.12).
- Nâng sáng ưu tiên `hemi` và `exposure`; giữ màu ấm bằng `grade.saturation`; không nâng `envI` trong phòng ấm.
- Trắng của Mercy và Perfection phải sạch: không xám, không cháy. Ngưỡng đã dùng: vùng clip tăng ≤ +1 điểm phần trăm ở điểm sáng nhất.
- Đo trước và sau trên cùng camera; mục tiêu nâng sáng 23/10 là +25–35 % độ sáng trung bình màn hình.
- Kiểm cả WebGL2 và WebGPU, camera chơi, ảnh xám, và bản tắt VFX/glow.

---

## 6. Màu theo biome Act I (rút từ AD §8 và file Biome §4)

| Biome | Nền | Accent | Ánh sáng | Ghi chú |
|---|---|---|---|---|
| BIO-03 (Prologue) | Palette Act I ban đêm | **Không** | Đèn Gennet là ấm đầu tiên | Tắt nến mộ, cửa sổ Gentle House |
| BIO-03 (Act I) | `#5E6B5A`, `#4A3526` | `#B3262A` chỉ là nhánh anh túc trên cửa | `#E0A050` lò rèn, nến, cửa sổ | Mưa phùn, ánh xám không bóng |
| BIO-01 | `#5E6B5A`, `#1F2A24`, `#4A3526`, sương `#A9B1A6` | `#B3262A` | `#E0A050` | Sương trên nước, nhiều sao, đèn ma đứng yên |
| BIO-02 | `#5E6B5A` / `#A9B1A6` | `#B3262A` **mạnh nhất act** | Xám u ám, khói ấm nhẹ | Cánh đồng phải đẹp |
| BIO-05 | Trắng vôi, lanh (chưa có HEX) | `#B3262A` thêu trên khăn | Nến không lập loè, ấm | Mưa dừng ở cổng |
| BIO-04 Garden | Đất tối `#4A3526` | `#B3262A` hoa mọc từ miệng | Đèn ngủ hồng nhạt đứng yên (chưa có HEX) | Không gore |
| BIO-27 Cradle | Lanh trắng, hư không đen | Đỏ anh túc rất nhỏ | Trắng sữa đứng yên | Trắng sạch được phép (vải Mercy) |

Màu loot (Rubble xám, Hewn xanh dương, Dressed vàng, Graven cam, Hallowed vàng kim) không dùng làm accent môi trường lớn.

---

## 7. Hai màu trắng

Trắng Act III là muối và xương: mờ, bụi, không phát sáng. Trắng Seamless là ánh sáng: phát sáng, bloom, không texture. Không bao giờ lẫn hai
màu này, kể cả khi dùng lại asset.

---

## 8. Ngân sách hiệu năng

| Kiểm tra | Ngân sách | Nguồn |
|---|---|---|
| Kit mỗi module 16 m | ≤ 9 | AD 12 §4.14.3 |
| Mảnh (placement + bụi) mỗi module | ≤ 18 | AD 12 §4.14.3 |
| Tuft cỏ mỗi module | ≤ 410 | AD 12 §4.14.3 |
| Kit cả map | ≤ 25 kit, ≤ 35 MB | AD 12 §4.14.3 |
| Khung đầu (vòng tải 0) | ≤ 12 kit, ≤ 18 MB | AD 12 §4.14.3 (mục tiêu) |
| Texture trong lab | 2048 cho landmark, 1024 cho prop; bật anisotropy | Bảng fit A21–A25, bài học lab |
| Vật lặp nhiều | Instancing + LOD (đèn ngủ, cọc đê, cỏ) | §1.4 file Asset theo biome |
| Mỗi vật thuộc đúng một module | Luật | AD 12 §4.14.3 |

Map vượt ngân sách thì sinh lại hoặc làm thưa (bớt tuft, mảnh, đèn trong module đó), không tải khác đi.

---

## 9. Checklist duyệt một map

- [ ] Đi lọt mọi cửa, vai đường, khe giữa prop; chỗ đứng tương tác không bị chiếm (chạy Play và kiểm `navcheck`).
- [ ] Hub có ngưỡng ánh sáng; wild có landmark, điểm thấy đích của act, 3–6 rite, 1 vignette không đánh dấu; dungeon có breath room.
- [ ] Mọi asset đúng biome và đúng mức dùng lại trong `ASSET_THEO_BIOME.md`; không có đồ con người trong không gian Perfection.
- [ ] Không lặp landmark hoặc vật R0; không hai bản cùng mesh cùng hướng đứng cạnh nhau.
- [ ] Cỏ có mảng dày thưa và đất trống; không hàng lối ngoài ruộng; không xuyên prop, nước; không che telegraph.
- [ ] Mỗi cụm dấu vết giải thích được bằng một sự kiện và một vật chủ gần đó.
- [ ] Mọi đèn có chủ đúng (người lập loè, Perfection đứng yên); ≤ 4 đèn thật mỗi màn hình; đèn tạo lúc tải.
- [ ] Mood chơi đúng bảng §5.3 hoặc có thẻ mood riêng; đêm vẫn là đêm; trắng Mercy sạch.
- [ ] Ảnh xám: tách được hero, quái, nền, telegraph.
- [ ] Không prop lơ lửng hay chìm sai; mặt công trình ở bậc terrain nằm trong pad.
- [ ] Trong ngân sách §8; kiểm frame time ở góc đông nhất trên WebGL2 và WebGPU.
