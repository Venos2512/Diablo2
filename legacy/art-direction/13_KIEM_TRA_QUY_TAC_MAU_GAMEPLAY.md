# 13 — Kiểm tra bộ quy tắc màu gameplay & môi trường (The Dying Gods · Act I)

> Đánh giá bộ "Quy tắc sử dụng màu cho gameplay / công trình và môi trường" (I–VIII) bằng số đo, kiểm chứng trong
> Lookdev Lab — scene **Act I · Weeping Fields (colour rules)** (`lookdev-lab/src/scenes/weepingFields.js`).
>
> Cách đo: **ΔE2000** = khác biệt màu cảm nhận (< 10: dễ lẫn ở kích thước game, < 5: gần như trùng) · **tương phản
> độ sáng** kiểu WCAG · **L\*** (0 đen – 100 trắng) · mô phỏng mù màu **Machado 2009, mức nặng nhất** (P = protan,
> D = deutan ~5% nam giới, T = tritan) · tone mapping đúng code three.js r180 mà lab dùng.

## 1. Kết luận nhanh

Khung tư duy **đúng và nên giữ nguyên**: ba hệ màu tách vai (thế giới = bối cảnh, sinh vật = danh tính, hiệu ứng =
thông tin), bốn tầng thị giác, cảnh báo "không dùng đỏ làm tín hiệu duy nhất", bốn loại vật thể ở mục VI, checklist
kiểm tra trong engine và thứ tự sản xuất. Nhưng bảng màu hiện tại có **7 va chạm đo được**, **5 chỗ thiếu định nghĩa**
và **2 xung đột** với tài liệu/code đang có. Ba việc nên làm trước:

1. **Thêm ngôn ngữ hình dạng bắt buộc cho từng màu chức năng** — Nguy hiểm và Độc gần như trùng nhau với người mù
   màu đỏ-lục (ΔE 3.9 và 1.2), không sửa được bằng cách đổi hue.
2. **Tách Thần thánh khỏi Điểm tương tác** (ΔE 8.6 / 6.2) — đề xuất vàng cổ trầm `#B8913F · #DDB86A`.
3. **Quy định màu tín hiệu là màu hiển thị** (sau tone mapping) — với AgX của lab, hex vẽ thẳng lệch ΔE 6–13.

## 2. Va chạm đo được (nặng → nhẹ)

| # | Cặp màu | ΔE thường | Mù màu (P / D / T) | Hậu quả | Đề xuất |
|---|---|---|---|---|---|
| 1 | Nguy hiểm `#E66A39` ↔ Độc `#90AF48`; highlight `#FFB16B` ↔ `#C2D76B` | 46.6 · 29.8 | 13.7 / **3.9** / 42 · 6.6 / **1.2** / 29 | Người deutan thấy cảnh báo đòn và vùng độc cùng màu mù tạt | Không sửa bằng hue (đẩy Độc tối đi thì deutan khá lên nhưng protan tụt còn 3.5). Dùng **hình dạng**: Nguy hiểm = viền + vạch chỉ vào tâm + lấp đầy theo thời gian; Độc = mây/bong bóng, không viền cứng |
| 2 | Thần thánh `#D7B46B` ↔ Tương tác `#E2CF9B`; `#F0DEAB` ↔ `#FFF0CF` | **8.6** · **6.2** | 8.5 / 7.6 / 8.5 · 6.4 / 6.0 / 6.4 | Saint Veyr: phong ấn, chuông nghi lễ, quái Consecrated ngà-vàng, nến sáp và vật kích hoạt cùng một họ màu | Ritual → vàng cổ trầm `#B8913F · #DDB86A`: ΔE 18.0 / 16.6 với Tương tác (deutan 16.7 / 16.0), L\* 62 vs 84 |
| 3 | Thần huyết FX `#B7353E` ↔ thân Redbound (`#B93B38`, `#AA3F47`, `#A23D48`, `#A33E32`) | **3.3 – 6.2** | — | Phép huyết trên/quanh bầy Redbound mất hình | Phần nhìn thấy của blood FX dùng `#EA7180` (ΔE 20–34 với mọi đỏ Redbound, L\* 62 vs 27–44); `#B7353E` chỉ cho vệt/decal; luôn có viền tối |
| 4 | Redbound tông tối ↔ nền rêu (độ sáng) | Brute `#7A2432` · Herald `#702637` · Piercer `#78302F` vs rêu `#3B4333`: ΔE 32–35 | tương phản **1.0–1.1 : 1**; deutan ΔE **2.4 – 8.3** | "Đỏ nổi trên xanh" chỉ đúng nhờ hue — đúng điều quy tắc dặn tránh. Ở chế độ thang xám, Brute gần như chìm | Mid-tone Redbound **L\* ≥ 40** (như Scavenger `#A33E32`, Bellwether `#AA3F47`) hoặc ΔL\* ≥ 12 so với nền; xương sáng ở nửa trên silhouette; nền rêu Weeping Fields L\* ≤ 27 |
| 5 | Xương Redbound (`#D1C4A5`, `#DDD6C2`, `#C6B99B`) ↔ Tương tác `#E2CF9B` | **6.1 – 8.0** | — | Cọc xương, vòng xương, trống xương đọc như vật bấm được | Xương trang trí **L\* ≤ 65, C\* ≤ 12** (lab dùng `#857D6B`: ΔE 26 với Tương tác); Tương tác giữ L\* ≥ 80 + lóe khi lại gần |
| 6 | Loot (tài liệu 08) ↔ màu chức năng | Unique `#C7B377` ↔ Ritual **4.9**, ↔ Interact 7.4 · Crafted `#FFA800` ↔ Nguy hiểm hi 10.2 · Magic ↔ Linh hồn 13.5 · Set ↔ Độc 13.4 | — | "Tầng 4 — phần thưởng" nằm trong tài liệu nhưng không có màu | Đưa palette loot vào cùng bộ quy tắc; nếu loot có glow/beam trong world thì ΔE ≥ 15 với 6 màu chức năng; nếu chỉ là chữ UI thì ghi rõ |
| 7 | Lửa ↔ Nguy hiểm | lửa Act I `#D9822B` ↔ `#E66A39` 12.5 · đuốc 1850K ↔ `#FFB16B` 10.1 | — | Telegraph trong vùng lửa (trại, thánh đường) chìm | Checklist đã có ca này; thêm: ở vùng có lửa, viền cam phải có viền tối bên ngoài |

Tương phản độ sáng của màu chức năng trên nền Act I (`#3E4638`): Thần huyết `#B7353E` chỉ **1.7 : 1** (trên nền sáng
`#6F6F5C`: 1.1 : 1), Nguy hiểm 3.0 : 1, Độc 3.9 : 1, Linh hồn 2.9 : 1, Thần thánh 5.0 : 1, Tương tác 6.4 : 1.

## 3. Tone mapping: hex trên giấy ≠ hex trên màn hình

Màu tín hiệu đi qua exposure + grade + tone mapping như mọi thứ khác nếu engine vẽ nó trong cảnh. Đo bằng chính
công thức của three.js r180 (exposure 1):

| Tone mapper | Hex vẽ thẳng 1× lệch (ΔE2000) | Ví dụ | Hex nào không đạt được |
|---|---|---|---|
| **AgX** (mặc định của lab) | 5.5 – **12.6** | `#FFB16B` → `#CEA985` (cam thành be) · `#FFF0CF` → `#CAC4B9` | Nguy hiểm `#E66A39`, `#FFB16B`, Độc hi `#C2D76B` (tốt nhất còn ΔE 3.9–4.9) |
| ACES (mood Act I, look mặc định của Weeping Fields) | 3.0 – 9.5 | `#FFB16B` → `#E8C085` | không |
| Khronos Neutral | 1.6 – 5.3 | `#E66A39` → `#E25F1A` | gần như không (Thần thánh hi `#F0DEAB` còn 2.4) |

Đề xuất thêm vào I.2: *màu tín hiệu là màu hiển thị*; engine vẽ telegraph/marker **sau tone mapping** (lớp overlay)
hoặc bù theo tone mapper đang dùng, và khóa tone mapper của dự án trước khi chốt hex. Trong lab: Environment → Rules →
*Màu tín hiệu = đúng hex trên màn hình* (bù tự động) và bảng *Tín hiệu qua tone mapping* đọc ΔE trực tiếp.

## 4. Chỗ thiếu định nghĩa

1. **Thang nổi bật (I.3) không có Tầng 4** (tương tác / phần thưởng). Và thang chỉ là tương đối nên không duyệt được
   bằng số. Đề xuất đi kèm dải đo (L\* đo trên ảnh chụp ở camera game, ánh sáng trung tính):

   | Tầng | Thang | Dải đề xuất |
   |---|---|---|
   | Môi trường nền | 25 | L\* 15–30, C\* ≤ 15 |
   | Công trình, vật cản | 40 | L\* 20–45 (mặt hướng sáng ≤ 50), C\* ≤ 18 |
   | Quái thường | 60 | ΔL\* ≥ 12 so với nền (hoặc rim), C\* 25–45 |
   | Quái tinh anh / Boss | 75 | như quái thường + khác biệt hình thể, không thêm màu |
   | **Tương tác / phần thưởng** | **80** | L\* ≥ 80 khi lóe, lóe theo khoảng cách |
   | Hiệu ứng gameplay quan trọng | 90 | L\* ≥ 60, C\* ≥ 40, có hình dạng riêng |
   | Cảnh báo nguy hiểm | 100 | viền L\* ≥ 75 + viền tối, vạch chỉ vào tâm, thời gian chuẩn bị |

2. **Bảng màu Valdren (II.1) và màu theo khu vực (II.3) không có mã màu** trong bản gửi → chưa khóa được. Lab đề xuất
   bộ swatch (Environment → Rules) và khóa mọi vật liệu về đúng màu trung bình của swatch:
   đất `#4A4234` · bùn `#2F2A23` · đường `#5C5242` · rêu `#3B4333` · rêu tối `#2A3125` · rơm `#615B48` ·
   đá tường `#5C5F5A` · đá vôi `#6E6B61` · đá tảng `#55554E` · vữa trát `#5D5A52` · gỗ ướt `#4B4135` · khung gỗ `#382C22` ·
   mái `#2D2A27` · gỗ xám (hàng rào) `#69655B` · sắt `#2D2C2A` · gỉ `#694A35` · lanh `#7D7666` · vải thô `#5F5646` · da `#56412F`.
3. **Màu tha hóa trong môi trường chưa có trần**. Đề xuất: mạch huyết L\* ≤ 30, C\* ≤ 25, không phát sáng trừ nguồn
   (giếng, emissive ≤ 0.2); đất nhiễm huyết giữ trong dải độ sáng của nền, chỉ đổi hue. Đây cũng là ca khó nhất của
   checklist: Redbound đứng trên nền đỏ phải tách bằng độ sáng và viền, không bằng hue.
4. **Kỹ năng người chơi**: checklist chỉ có "kỹ năng đỏ", nhưng kỹ năng lạnh (lam) ↔ Linh hồn, Poison Nova ↔ Độc,
   Blessed Hammer (vàng) ↔ Thần thánh, lửa ↔ Nguy hiểm. Đề xuất một câu luật: *màu chức năng là nguyên tố, dùng chung
   cho người chơi và quái; ngôn ngữ "vùng đòn trên mặt đất" (viền + vạch + đếm ngược) chỉ dành cho đòn của địch.*
5. **Tín hiệu hoạt động của vật nguy hiểm (VI)**: nên ghi rõ là chuyển động/nhịp (phồng, thở, nhỏ giọt), không chỉ
   đổi màu — để còn đọc được với người mù màu và trong thang xám.

## 5. Xung đột với tài liệu và code hiện có

- `12_QUY_CHUAN…` §1.2.1 nói tinh anh *"cùng kích thước, phân biệt bằng palette, aura, tên màu"*; quy tắc mới I.4 nói
  tinh anh là *biến thể hình thể, phụ kiện, hiệu ứng riêng; không quy định vàng/tím*. Cần chọn một và sửa file còn lại.
  (Màu tên Champion/Unique trong `04` §6 là chữ UI — giữ được nếu ghi rõ không áp lên thân quái.)
- Lõi gameplay v1 trong lab tô viền quái tinh anh: champion `#6080FF` (ΔE 7.8 với Linh hồn), unique `#FFC060`
  (ΔE 8.1 với Nguy hiểm hi, 8.4 với Thần thánh) — `lookdev-lab/src/procedural/rig.js`. Khi đưa quái The Dying Gods vào
  lõi này cần bỏ.

## 6. Checklist VII trên map Weeping Fields

| Mục | Trong lab | Kết quả |
|---|---|---|
| Đồng cỏ + 12 Redbound | Có (stand-in: Groveling ≈ Scavenger, Shaman ≈ Bellwether, Pit Fiend nhuộm đỏ đô ≈ Brute) | Đạt về hue; **không đạt về độ sáng** với Redbound tông tối (xem §2.4) |
| Redbound trên nền nhiễm huyết (giếng) | Có | Quái còn đọc được nhờ độ sáng; khi telegraph Thần huyết phủ lên, viền Nguy hiểm là thứ giữ ranh giới |
| Người chơi dùng kỹ năng đỏ | Chạy được (Play → lõi gameplay, chuột phải Fireball/Meteor/Fire Wall, chỉ WebGL2) | Cần luật §4.4 |
| Boss + nhiều hiệu ứng | Telegraph giữ lớp phủ ≤ 45%, viền + vạch | Chưa có boss Act I |
| Nghĩa địa + Restless · Rừng + Rootborn · Ngã tư + Forsworn · Thánh đường + Consecrated | Chưa có map | Dự báo từ số liệu: Thánh đường là ca rủi ro nhất (§2.2) |
| Màn hình tối/sáng, mù màu | Post & camera → *Readability check* (thang xám, deutan, protan, tritan) | Deutan: Nguy hiểm, Thần huyết, Độc, Thần thánh, Tương tác dồn về vàng-ô liu; chỉ Linh hồn tách |

## 7. Sửa thẳng vào bộ quy tắc (bản ngắn)

- **I.2**: thêm cột *hình dạng bắt buộc* cho mỗi màu chức năng (Nguy hiểm: viền + vạch + lấp đầy theo thời gian ·
  Thần huyết: chảy/nhỏ giọt · Độc: mây/bong bóng · Linh hồn: vệt mờ, lóe · Thần thánh: vòng rune đối xứng · Tương tác:
  vòng mảnh + lóe khi lại gần); đổi Thần thánh sang `#B8913F · #DDB86A`; ghi *màu hiển thị sau tone mapping*.
- **I.3**: thêm Tầng 4 = 80 và dải đo ở §4.1.
- **I.4**: thêm "mid-tone quái tách nền ≥ 12 L\*"; bỏ viền màu tinh anh ở lõi gameplay.
- **I.5**: thêm "lớp phủ vùng đòn ≤ 45% độ đục; viền và vạch luôn trên cùng".
- **II.1 / II.3**: điền mã màu (bảng §4.2 hoặc bản duyệt lại).
- **II.2**: thêm trần cho màu tha hóa (§4.3); xương trang trí L\* ≤ 65.
- **III.1**: xương/cọc xương Redbound không dùng ngà sáng; ổ phục kích làm bằng rơm mục tối, khác hẳn đống rơm sạch.
- **VII**: thêm ba lượt kiểm tra — thang xám, mù màu (deutan/protan), đổi tone mapper.

## Phụ lục — số liệu

**12 màu chức năng** (L\* / C\* / hue°): Nguy hiểm `#E66A39` 59/67/48 · `#FFB16B` 78/52/65 — Thần huyết `#B7353E` 43/58/26 ·
`#EA7180` 62/50/17 — Độc `#90AF48` 67/55/119 · `#C2D76B` 82/55/114 — Linh hồn `#658FC0` 58/30/268 · `#A2C4E2` 78/19/256 —
Thần thánh `#D7B46B` 75/42/85 · `#F0DEAB` 89/27/93 — Tương tác `#E2CF9B` 84/28/92 · `#FFF0CF` 95/18/90.

**ΔE2000 từng cặp** (màu nền · highlight; thường / P / D / T): Nguy hiểm–Độc 46.6/13.7/3.9/42.1 · 29.8/6.6/1.2/29.4 —
Độc–Thần thánh 19.3/5.7/7.0/33.1 · 14.5/10.4/8.9/19.4 — Thần thánh–Tương tác 8.6/8.5/7.6/8.5 · 6.2/6.4/6.0/6.4 —
Nguy hiểm–Thần thánh 27.2/17.1/10.6/19.5 · 17.5/11.1/9.7/14.8 — Nguy hiểm–Thần huyết 21.7/20.4/17.4/16.4 ·
30.0/23.9/16.0/13.1 — Độc–Tương tác 19.3/14.1/14.0/29.3 · 18.9/16.3/14.7/15.8 — Độc–Linh hồn (tritan) 17.2 · 17.3.
Các cặp còn lại ≥ 15.5 ở mọi dạng.

**Cách tái tạo trong lab**: `npm run dev` → Scene *Act I · Weeping Fields (colour rules)*. Map mở bằng look Diablo II
(isometric, đêm, ACES). Để đo như báo cáo này: Lighting → *Overcast · neutral palette check* (AgX), bật *Palette lock*
trong *Terrain layers*. Sau đó vào Environment → *Rules · màu & khả năng đọc*: góc kiểm tra theo checklist, class view
(VI), telegraph demo, bảng mẫu 6 màu trên cỏ, stand-in Redbound, bảng tín hiệu qua tone mapping. Post & camera →
*Readability check*.
