# Art_Final — Asset theo biome và quy tắc dùng lại

> Ngày 2026-10-26. Áp dụng cho mọi asset trong `ashlar/Art_Final/` (concept, item, Resource_3D) và khi đặt asset vào map.
> Đọc cùng [`BO_TRI_BIOME.md`](BO_TRI_BIOME.md) (cách bố trí trong biome, ánh sáng, ngân sách).
>
> Nguồn: biome và area lấy từ [`ashlar/docs/ASHLAR_BIOME_VA_KHU_VUC_VI.md`](../docs/ASHLAR_BIOME_VA_KHU_VUC_VI.md) (§4, §5, §8);
> "người làm" và màu cấm lấy từ [`ashlar/art-direction/artdirection.md`](../art-direction/artdirection.md) (§4.2, §4.3, §8, §9);
> map nào đang dùng asset nào đo bằng cách grep sample id trong `lookdev-lab/src/env/act1/maps/*.js` ngày 26/10;
> quyết định thay hoặc từ chối asset lấy từ `tmp/act1-base-maps/REUSE_CANDIDATES.md` và `ACT1_KIT_FIT.md`.
> Quy tắc ghi **[mới]** là quy tắc do file này đặt ra; các quy tắc khác có nguồn ghi bên cạnh.

---

## 0. Cách đọc

- **Biome** là mã BIO-xx của file Biome và khu vực (27 biome). Một area thuộc đúng một biome. Một biome có thể trải qua nhiều act.
- **Map** là map lab Act I: `lychgate` (Lychgate hub → Churchyard), `lychgateHub` (hub có tường, seed 21), `fens` (Night Fens → Rook's Weir),
  `poppyReach`, `gentleHouse`, `gardenOfHush`, `cradle`. File: `lookdev-lab/src/env/act1/maps/<map>.js`.
- **Mức dùng lại:**

| Mức | Nghĩa | Được làm gì |
|---|---|---|
| **R0 · Duy nhất** | Landmark, vật gắn cốt truyện hoặc vật gắn một NPC. | Chỉ một bản ở đúng chỗ của nó. Không lặp, không mang sang map khác (trừ bản nhìn từ xa, xem A18.4). |
| **R1 · Trong biome** | Đồ đặc trưng của một biome. | Lặp tự do trong biome đó, theo quy tắc lặp ở §1.4. |
| **R2 · Trong act** | Đồ cùng "người làm" và cùng palette act. | Dùng ở các biome khác của **cùng act** có cùng người làm (bảng cột "Dùng lại ở"). Duyệt mắt ở mood của map đích. |
| **R3 · Chung** | Đồ trung tính về vật liệu (đá, xương, nến). | Dùng ở mọi biome không cấm vật liệu hoặc màu của nó (§1.2). |
| **✗ · Không dùng** | GLB lỗi QA hoặc bị thay bằng bản khác. | Giữ để so sánh hoặc dựng lại; không đặt vào map. |

- **3D:** ✓ có GLB trong `Resource_3D/` (bản texture 2048; GLB gốc 4096 ở `ashlar/3d/`). **–** chưa có model, map đang dùng blockout hoặc mesh sinh bằng code.

---

## 1. Quy tắc dùng lại (bắt buộc)

### 1.1 Người làm quyết định asset đi đâu (AD §4.2, §4.3)

| Người làm | Nhận ra qua | Được đặt ở | Không được đặt ở |
|---|---|---|---|
| **Con người** (the Moss) | Lệch, chắp vá, gỗ, đá lửa, rạ, muội; ánh sáng lập loè | Làng, sân nhà thờ, đầm, đồng, nông trại: BIO-01, 02, 03; mép ngoài BIO-04 Old Face; BIO-06 (đồ thợ mỏ) | Không gian Perfection: BIO-05 Gentle House, phần vườn ngủ của BIO-04 Garden of Hush, BIO-27 Cradle. Quyết định 22/10: đồ trại cũ, gỗ mòn không thuộc về nơi của Mercy |
| **Perfection** (Mercy ở Act I) | Đối xứng, vải lanh sạch, vôi mới không một chỗ vá, đèn đứng yên | BIO-05, BIO-04 Garden, BIO-27 Cradle; bản nhìn xa của Gentle House trên các map ngoài trời | Làng và đầm, trừ vật cốt truyện của Gentle House đặt ở đó: thuyền và bến đón người ngủ (A17.3, A17.6) |
| **Discarded** | Đất nung, men, xỉ, ánh lò phập phồng | BIO-06 Flint Delvings, BIO-16 cuộc vây thành, BIO-23 Course | Nơi khác (ánh lò là dấu hiệu đột kích, không dùng làm đèn trang trí) |
| **The Wall** | Xương và vữa, ánh trắng lạnh qua khe | BIO-04 Old Face, hầm mộ BIO-08, BIO-23 | Bề mặt ngoài trời bình thường |
| **Masons** | Góc vuông, đá đẽo quá cỡ, không phát sáng | Theo cốt truyện từng act (Act II trở đi) | Không gắn đèn lên đồ Mason |

**Quy tắc mối nối:** càng gần cult thì chỗ vá càng biến mất (Act I: vôi mới). Đồ con người mang vết vá vào không gian Perfection là sai cốt truyện,
kể cả khi kích thước vừa.

### 1.2 Màu cấm của act chặn việc dùng chéo act (AD §8)

Mỗi GLB mang sẵn màu trong texture, nên dùng chéo act phải qua cột "Cấm":

| Act đích | Cấm | Hệ quả với asset Act I |
|---|---|---|
| Prologue | Như Act I, không accent | Dùng được mọi asset BIO-03/BIO-04 Act I; **tắt mọi điểm đỏ anh túc** (cờ `accent: false`) và nến mộ |
| II · Sepulcra | Xanh lá; ánh ngày trong hầm mộ | Không dùng đá rêu, liễu, cỏ, sậy, gỗ rêu (A03, A04, phần lớn A06). Đá xám, xương, nến (R3) dùng được sau khi duyệt mắt |
| III · Blanched Sea | Mọi màu đỏ trừ máu; màu sắc ngoài Undercity | Không dùng asset có đỏ anh túc hoặc gỗ ấm ngoài BIO-12 Undercity |
| IV · Hoarfast | Tuyết trắng tinh | Đồ gỗ, đá có thể dùng nếu phủ băng/tuyết đúng tông; cần duyệt từng món |
| V · Lanternshore | Trời quang, nắng | Đồ cảng, lưới, đá ướt: chưa có asset Act V |
| Course / Seamless | Ánh ấm / texture, vết mòn | Không dùng asset Act I nào |

**[mới]** Asset dùng chéo act phải có một dòng trong bảng §5 của file này (asset, act đích, lý do, ảnh duyệt) trước khi đặt vào map.

### 1.3 Landmark và vật cốt truyện không lặp (R0)

- Mỗi wild area có một landmark nhìn thấy từ phần lớn khu (LD §7.4). Landmark của area này không được xuất hiện lại ở area khác, vì người chơi
  dùng nó để biết mình đang ở đâu.
- Vật gắn NPC (lò rèn của Brannoc, sạp của Nell, trạm gác của Osric, cọc thu tiền của người lái đò) chỉ đứng cạnh NPC đó.
- Vignette "phải nhớ" của area (bàn ăn dưới nước, ghế canh mộ trẻ con) là một bản duy nhất.
- Ngoại lệ có chủ ý: **bản nhìn xa của Gentle House** (`N-GH`, dựng từ A18.4 + A18.5 + hộp A11.4 trong `env/act1/gentleHouseFar.js`) xuất hiện trên
  `lychgate` và `fens`, vì LD muốn cửa sổ ấm trên đồi thấy được từ nhiều khu. Bản xa không có collision và không đặt gần hơn khoảng nhìn xa.

### 1.4 Lặp một asset R1/R2/R3

- Scale đều trong **0,8–1,25** (luật fit của REUSE_CANDIDATES). Không kéo giãn theo từng trục để tạo biến thể (AD 12 §4.8).
- Đồ tự nhiên (đá, cây, gốc) xoay tự do quanh trục đứng. Đồ nhân tạo bám trục công trình hoặc lối đi, chỉ lệch nhẹ khi cũ hoặc hỏng.
- **[mới]** Trong một cụm, hai bản của cùng một mesh không đứng cạnh nhau với cùng hướng xoay. Asset có nhiều biến thể (người ngủ A20.1–A20.4,
  liễu A04.1/A04.2) thì xoay vòng biến thể theo hàng, không đặt hai bản giống nhau liền kề (LD: "mỗi hàng là người khác nhau").
- Vật lặp số lượng lớn (đèn ngủ A13.3 khoảng 260 bản, cọc đê A06.1) phải dùng instancing; GLB ~10k tam giác không đặt rời từng bản.
- Khi một model không vừa chỗ: bỏ hoặc đổi bố cục, không ép (AD 12 §4.6). Ghi lý do vào def của map.

### 1.5 Trạng thái sau act

Hub và wild có trạng thái "sau act" (AD §9). Asset mang dấu hiệu theo thời gian phải có cả hai bản trước khi chốt:
Lychgate sau Act I đổi nhánh anh túc trên cửa thành ruy băng đen; hoa ở Poppy Reach cụp và rụng. Hiện chưa có GLB bản "sau act" nào.

### 1.6 Quái, hero, NPC, item

- **Quái** dùng lại theo roster của checklist quái (§4 dưới). Cùng GLB có thể làm nhiều tier (U01 Shambler = Rot-Shambler ở Churchyard và
  Mire-Shambler ở Night Fens). Quái chỉ chạy trong game sau khi qua rig và animation (cổng G1–G4, `ashlar/3d/rig-anim/Agent.md`). Đến 26/10
  chỉ **P06 Poppy-Mound** dùng được ngay, dạng tĩnh.
- **Hero** dùng ở mọi biome. Ánh sáng trên hero theo `BO_TRI_BIOME.md` §5.
- **NPC** đứng ở hub của act mình; NPC đi theo (Tamsin, Ignatia, Hamon) xuất hiện trên nhiều map. Chưa có GLB NPC nào.
- **Item** là loot, không đặt theo biome. Ngoại lệ là vật nhiệm vụ gắn một area (sheet IT-10, IT-15, IT-18) và đồ bán của vendor ở hub.

---

## 2. Biome → asset (bảng tra nhanh)

Act I có model; các act sau mới có concept quái (xem §4). Env group = nhóm concept môi trường `A##` (`Concept_Art/environments/act-01/`).

| Biome | Area (map lab) | Env group có 3D | Prop chung dùng ở đây | Quái (ID) | NPC |
|---|---|---|---|---|---|
| **BIO-03** Làng đá lửa & sân nhà thờ | Lychgate hub, Churchyard, Vigil Prologue (`lychgate`, `lychgateHub`) | A01, A02, A15, A16, A21 (A21.1–A21.4); dùng thêm A04.2, A06.1 | bone_pile, candle_cluster, flint_boulders, riverbank_stones, mossy_stump, mushroom_cluster | U01, U02, U03, U04, W01, W02, F01, B01 | N01–N09 (hub Act I) |
| **BIO-01** Đầm lầy & làng nước | Night Fens, Rook's Weir (`fens`); Willow Mere (chưa có map) | A03, A04, A06, A07, A17, A21.5, A21.6, A22.1–A22.3; dùng thêm A01.2, A01.5, A01.6 | riverbank_stones, mossy_stump, mushroom_cluster, candle_cluster, fallen_bell | P01, W03, W04, W05, U05, U01 (Mire), W06, B02, B04 | N10 người lái đò |
| **BIO-02** Đồng thuốc phiện | Poppy Reach (`poppyReach`) | A08, A18, A22.1, A22.4–A22.6, A23.2; dùng thêm A04.2 | flint_boulders, riverbank_stones | P02, F02, P03, P04, W03 | — |
| **BIO-05** Hospice vôi trắng | Gentle House (`gentleHouse`) | A11, A18.5, A19, A23.3–A23.6, A24.1–A24.3 | flint_boulders | — (không chiến đấu) | N11 Mother Hawise, N12 Poppy Sister, N06 Tamsin |
| **BIO-04** Hầm xương & vườn đất | Old Face (Prologue; lab scene `oldFace`), Garden of Hush (`gardenOfHush`) | A13, A20, A24.4, A25; dùng thêm A08.6, A11.6, A22.1 | crypt_wall, broken_column, candle_cluster | Old Face: U01, W01. Garden: F02, P01, P05, P06, W07, P03 | N06 Tamsin, N07 Fen |
| **BIO-27** Cell (Act I: The Cradle) | The Cradle (`cradle`) | A14, A24.5, A24.6 | crypt_wall (đầu cầu thang) | P07, P01, P05, P03, B05 | — |
| **BIO-06a** Mỏ đá lửa | Flint Delvings (chưa có map) | Chỉ có miệng mỏ A18.3 (trên Poppy Reach); nhóm A10 có concept, chưa có 3D | mine_timber, flint_boulders, stalagmites | D01, D02, D03, W07, D04, B03 | — |
| **BIO-26** Mộng Edda | Edda's Dream (chưa có map) | Nhóm A12 có concept, chưa có 3D | — | — | N03 Edda |

---

## 3. Danh mục asset môi trường Act I (A01–A25)

Cột "Map đang dùng" là sample `act1-a##-#-*` có trong file map ngày 26/10. A03.1–A03.3 (sậy, cói, cụm cỏ) và A08.1 (thảm anh túc) là mesh
sinh bằng code, không có GLB. Nhóm A05 (mặt nền yên), A09 (Willow Mere), A10 (Flint Delvings), A12 (Edda's Dream) có concept, chưa có 3D.

### A01 — Làng Lychgate · BIO-03 · con người

| ID | Asset | 3D | Map đang dùng | Mức | Dùng lại ở | Ghi chú |
|---|---|---|---|---|---|---|
| A01.1 | Nhà sàn | ✓ | lychgate | R2 | BIO-01 (làng đầm) | Nhà Edda là một bản A01.1 có đèn ở cửa sổ |
| A01.2 | Lối ván | ✓ | lychgate, fens | R2 | BIO-01 | Mặt đi được |
| A01.3 | Tường đá lửa thấp vá | ✓ | lychgate | R2 | BIO-02 sân trại | Module 4 m |
| A01.4 | Rào liễu đan | ✓ | lychgate | R2 | BIO-01, BIO-02 | |
| A01.5 | Giếng làng | ✓ | lychgate, fens | R2 | BIO-01 | Một giếng mỗi làng |
| A01.6 | Giá bẫy lươn | ✓ | lychgate, fens | R2 | Chỉ cạnh nước BIO-01/03 | Đặt ×0,85 bằng bề rộng kit cũ |

### A02 — Sân nhà thờ · BIO-03 · con người

| ID | Asset | 3D | Map đang dùng | Mức | Dùng lại ở | Ghi chú |
|---|---|---|---|---|---|---|
| A02.1 | Cổng lychgate | ✓ | lychgate (bản lab `-open`) | R0 | — | Ngưỡng ánh sáng của hub. Bản lab bỏ thanh ngang mặt sau để đi qua |
| A02.2 | Lồng mortsafe | ✓ | lychgate | R1 | — | Mortsafe bị bẻ ra ngoài là A16.5, không dùng thay |
| A02.3 | Cụm bia lệch | ✓ | lychgate | R1 | Lô mộ gia đình (rite 5) | Không thay bằng đá rêu |
| A02.4 | Tháp ossuary tròn | ✓ | lychgate | R0 | — | Landmark L1 của map |
| A02.5 | Tượng thánh không mặt | ✓ | lychgate | R0 | — | Trên lối đi Churchyard |
| A02.6 | Xe tang đẩy tay | ✓ | lychgate | R1 | — | Rite 2, kích thước thật 3,2 m |

### A03, A04 — Đầm và liễu · BIO-01 · tự nhiên

| ID | Asset | 3D | Map đang dùng | Mức | Dùng lại ở | Ghi chú |
|---|---|---|---|---|---|---|
| A03.4 | Đá rêu lớn | ✓ | fens | R2 | BIO-03 mép đầm, BIO-02 | ×0,75–0,99. Act II cấm (rêu xanh) |
| A03.5 | Bờ than bùn | ✓ | fens | R2 | BIO-03 mép đầm | |
| A03.6 | Gốc ngập nước | ✓ | fens | R2 | BIO-03 mép đầm | ×0,7–0,9 |
| A04.1 | Liễu già rủ | ✓ | fens | R2 | BIO-01 Willow Mere | Cây lớn làm khung, không che vùng đánh |
| A04.2 | Liễu non | ✓ | lychgate, fens, poppyReach | R2 | Mọi biome ngoài trời Act I | Asset dùng lại nhiều nhất |
| A04.3 | Cây chết góc cạnh | ✓ | fens | R2 | BIO-02, BIO-03 mép | |
| A04.5 | Thân rỗng đổ | ✓ | fens | R2 | BIO-03 mép rừng | |
| A04.6 | Cụm rễ liễu lộ | ✓ | fens | R1 | — | |

### A06 — Night Fens · BIO-01

| ID | Asset | 3D | Map đang dùng | Mức | Dùng lại ở | Ghi chú |
|---|---|---|---|---|---|---|
| A06.1 | Đoạn đê, cọc kè | ✓ | lychgate, fens (bản lab `-open`) | R2 | BIO-03 đường ra đầm | Trên đỉnh đê, lún 0,35 m; dùng instancing |
| A06.2 | Đá đứng địa y | ✓ | fens | R1 | — | |
| A06.3 | Bậc đá qua suối | ✓ | fens | R1 | — | Chân lún 0,5 m dưới nước |
| A06.4 | Cột đèn mồi tắt | ✓ | fens | R1 | — | Luôn tắt: không emissive, không thêm đèn |
| A06.5 | Thuyền đáy bằng chìm | ✓ | fens | R1 | Rook's Weir | |
| A06.6 | Trụ cầu gãy | ✓ | fens | R1 | — | |

### A07 — Rook's Weir · BIO-01

| ID | Asset | 3D | Map đang dùng | Mức | Dùng lại ở | Ghi chú |
|---|---|---|---|---|---|---|
| A07.1 | Nhà đá lửa ngập | ✓ | fens | R1 | — | |
| A07.2 | Đập gỗ và đá | ✓ | fens | R1 | — | |
| A07.3 | Tường đầu hồi có cửa vòm | ✓ | fens | R1 | — | Ở cửa đi của lane và rite 5 vẫn là blockout (cửa Play cần 2,2 m) |
| A07.4 | Bệ nóc nhà chìm | ✓ | fens | R1 | — | Hai nóc người chơi đi trên vẫn là blockout (ống khói chắn lối) |
| A07.5 | Bè ván | ✓ | fens | R1 | — | |
| A07.6 | Cọc đậu quạ | ✓ | — | ✗ | — | Hình chữ thập, xà đậu bị mất khi tách hàng; map dùng cây chết kit tạm. Cần dựng lại |

### A08 — Poppy Reach · BIO-02

| ID | Asset | 3D | Map đang dùng | Mức | Dùng lại ở | Ghi chú |
|---|---|---|---|---|---|---|
| A08.2 | Tường đá khô | ✓ | poppyReach | R2 | BIO-03 | Tạo lối đi giữa đồng |
| A08.2s | Lối lách qua tường | ✓ | — | R1 | — | Chưa dùng: model không có khe đi qua |
| A08.3 | Nhà trại bỏ hoang | ✓ | — | R1 | — | Chưa dùng: model đóng kín, tuyến đi phải vào trong |
| A08.4 | Đống rơm | ✓ | poppyReach | R2 | BIO-03 | |
| A08.5 | Cổng ruộng | ✓ | — | R2 | BIO-03 | Chưa dùng: cổng đóng |
| A08.6 | Giá phơi anh túc | ✓ | poppyReach, gardenOfHush | R2 | BIO-02, phòng thu hoạch BIO-04 | Đầu hoa đỏ là accent, giữ ít |

### A11 — Gentle House · BIO-05 · Perfection

| ID | Asset | 3D | Map đang dùng | Mức | Dùng lại ở | Ghi chú |
|---|---|---|---|---|---|---|
| A11.1 | Gian hành lang cloister | ✓ | gentleHouse | R1 | — | |
| A11.2 | Giường hospice | ✓ | gentleHouse | R1 | — | Hàng giường dài |
| A11.3 | Bàn refectory có bánh | ✓ | gentleHouse | R1 | — | |
| A11.4 | Tháp cổng | ✓ | gentleHouse | R0 | Hộp xa trong `N-GH` | Nơi mưa dừng |
| A11.5 | Bếp lò và vạc | ✓ | gentleHouse | R1 | — | Sạch, không lửa |
| A11.6 | Giá nến đứng yên | ✓ | gentleHouse, gardenOfHush | R2 | BIO-05, BIO-04 Garden, BIO-27 | Nến không lập loè |

### A13 — Garden of Hush · BIO-04 (vườn) · Perfection

| ID | Asset | 3D | Map đang dùng | Mức | Dùng lại ở | Ghi chú |
|---|---|---|---|---|---|---|
| A13.1 | Luống giường ngủ | ✓ | gardenOfHush | R1 | — | Phủ bằng A24.4 |
| A13.2 | Khung mái vải | ✓ | gardenOfHush | R1 | — | Đi xuyên qua được |
| A13.3 | Lọ đèn ngủ hồng | ✓ | gardenOfHush | R1 | — | Khoảng 260 bản: instancing + LOD |
| A13.4 | Cột chuông hush | ✓ | gardenOfHush | R1 | — | Cơ chế đặc trưng của dungeon |
| A13.5 | Hốc tường vòm rễ | ✓ | gardenOfHush | R1 | — | |
| A13.6 | Luống anh túc | ✓ | gardenOfHush | R1 | — | |

### A14 — The Cradle · BIO-27 (cell Act I)

| ID | Asset | 3D | Map đang dùng | Mức | Dùng lại ở | Ghi chú |
|---|---|---|---|---|---|---|
| A14.1 | Khung nôi rào xương | ✓ | cradle | R1 | — | Hàng nôi giống hệt chạy vào sương đen |
| A14.2 | Cặp rèm lanh | ✓ | cradle | R1 | — | |
| A14.3 | Đèn ngủ trắng sữa | ✓ | cradle | R1 | — | Tắt dần theo cơ chế boss |
| A14.4 | Chuông gió xương | ✓ | cradle | R1 | — | |
| A14.5 | Bệ chăn bông | ✓ | cradle | R0 | — | Sàn arena |
| A14.6 | Chân nôi cong | ✓ | cradle | R1 | — | |

Cell Act II–IV (BIO-27) **không** dùng lại asset Cradle: mỗi cell có vật liệu Perfection riêng (lanh → sắt → kính muối → lọ).

### A15, A16 — Lychgate và Churchyard (bổ sung) · BIO-03

| ID | Asset | 3D | Map đang dùng | Mức | Dùng lại ở | Ghi chú |
|---|---|---|---|---|---|---|
| A15.1 | Nhà thờ đá lửa | ✓ | lychgate | R0 | — | Landmark L3 |
| A15.2 | Lò rèn | ✓ | lychgate | R0 | — | Của Brannoc |
| A15.3 | Bảng tên người ngủ | ✓ | lychgate | R0 | — | Chỗ của Tamsin |
| A15.4 | Khung chuông tang | ✓ | lychgate | R0 | — | Không thay cho cột chuông hush A13.4 (lệch kích thước ×0,77) |
| A15.5 | Sạp đồ tuỳ táng | ✓ | lychgate | R0 | — | Của Nell |
| A15.6 | Trạm gác | ✓ | lychgate | R0 | — | Của Osric, có giỏ lửa |
| A16.1 | Cây thuỷ tùng | ✓ | lychgate | R1 | — | Chỉ ở mép sân nhà thờ |
| A16.2 | Giá treo cổ hắc ín | ✓ | lychgate | R1 | — | Rite 4, quạ đậu |
| A16.3 | Mộ có nến hũ | ✓ | lychgate | R1 | — | Nến tắt ở bản Prologue |
| A16.4 | Mộ mới đắp | ✓ | lychgate | R2 | BIO-01 | Ở fens đã thay bằng mộ đầm A21.6 |
| A16.5 | Mộ trỗi dậy (mortsafe bẻ ra) | ✓ | lychgate | R1 | — | Chỉ ở rite; không dùng làm mortsafe thường |
| A16.6 | Đèn cột người đào mộ | ✓ | lychgate | R1 | — | Hai bản (nhà thờ, mộ mới) |

### A17 — Làng chìm Night Fens (bổ sung) · BIO-01

| ID | Asset | 3D | Map đang dùng | Mức | Dùng lại ở | Ghi chú |
|---|---|---|---|---|---|---|
| A17.1 | Cặp đá nghiêng | ✓ | — | ✗ | — | Khe đi 0,9–1,1 m (cần 2,6); thay bằng A21.5 `-wide` |
| A17.2 | Tháp chuông chìm | ✓ | fens | R0 | — | |
| A17.3 | Thuyền Gentle House | ✓ | fens | R0 | — | Vật Perfection đặt trong BIO-01 theo cốt truyện |
| A17.4 | Bàn ăn dưới nước | ✓ | fens | R0 | — | Vignette; không dùng làm bàn refectory (ngắn 2,4 m so với 4,3 m) |
| A17.5 | Cửa sổ rèm ren ngập | ✓ | fens | R0 | — | Vignette |
| A17.6 | Bến Gentle House | ✓ | fens | R0 | — | Đèn trắng đứng yên |

### A18 — Poppy Reach và mặt ngoài Gentle House · BIO-02 / BIO-05

| ID | Asset | 3D | Map đang dùng | Mức | Dùng lại ở | Ghi chú |
|---|---|---|---|---|---|---|
| A18.1 | Xe bò bỏ lại | ✓ | poppyReach | R0 | — | Còn chở chăn gối |
| A18.2 | Giường gối sạch | ✓ | poppyReach | R1 | — | Giường trống trong nhà trại, mỗi giường một gối sạch |
| A18.3 | Miệng mỏ Delvings | ✓ | poppyReach | R0 | Lối vào BIO-06a | |
| A18.4 | Dãy nhà hospice | ✓ | poppyReach | R0 | Bản xa `N-GH` trên lychgate, fens | |
| A18.5 | Đoạn tường hốc | ✓ | poppyReach, gentleHouse | R1 | Bản xa `N-GH` | Module tường bao |
| A18.6 | Bậc lên đồi | ✓ | poppyReach | R1 | BIO-05 (bậc dựng bằng code) | |

### A19 — Nội thất Gentle House · BIO-05

| ID | Asset | 3D | Map đang dùng | Mức | Dùng lại ở | Ghi chú |
|---|---|---|---|---|---|---|
| A19.1 | Bình hoa | ✓ | gentleHouse | R1 | — | |
| A19.2 | Khay trà anh túc | ✓ | gentleHouse | R0 | — | Cảnh Mother Hawise mời trà |
| A19.3 | Ghế bên cửa sổ | ✓ | gentleHouse | R1 | — | |
| A19.4 | Tủ lanh | ✓ | gentleHouse | R1 | — | Từng làm giá bánh tạm; nay giá bánh là A24.2 |
| A19.5 | Bình phong lanh | ✓ | gentleHouse | R2 | BIO-04 Garden, BIO-27 | |
| A19.6 | Cửa sổ cao phòng bệnh | ✓ | gentleHouse | R1 | — | Cửa sổ cao ấm là ánh sáng đứng yên sáng nhất act |

### A20 — Người ngủ và phòng thu hoạch · BIO-04 Garden

| ID | Asset | 3D | Map đang dùng | Mức | Dùng lại ở | Ghi chú |
|---|---|---|---|---|---|---|
| A20.1 | Người ngủ: thiếu nữ | ✓ | gardenOfHush | R1 | — | Xoay vòng A20.1–A20.4; không hai bản giống nhau liền kề |
| A20.2 | Người ngủ: ông già | ✓ | gardenOfHush | R1 | — | |
| A20.3 | Người ngủ: ngư dân | ✓ | gardenOfHush | R1 | — | |
| A20.4 | Người ngủ: nông phụ | ✓ | gardenOfHush | R1 | — | |
| A20.5 | Mương tưới | ✓ | gardenOfHush | R1 | — | |
| A20.6 | Bàn thu hoạch | ✓ | gardenOfHush | R0 | — | Phòng thu hoạch |

### A21–A25 — Đồ thay blockout `N…` (23/10)

| ID | Asset | 3D | Map đang dùng | Mức | Dùng lại ở | Ghi chú |
|---|---|---|---|---|---|---|
| A21.1 | Cửa hầm Barrow | ✓ | lychgate, lychgateHub | R0 | — | Cửa hầm gia đình, side quest *One for the Footing* |
| A21.2 | Tường chắn đá lửa | ✓ | lychgate, lychgateHub | R2 | BIO-03, BIO-02 | Module 4 m; trên hub dùng ×1,3 cao |
| A21.3 | Đống than bùn | ✓ | lychgate | R2 | BIO-01 | Thấp hơn spec (0,66 m) |
| A21.4 | Ghế canh mộ | ✓ | lychgate | R0 | — | Vignette không đánh dấu V1 |
| A21.5 | Đá nghiêng (`-wide`) | ✓ | fens | R0 | — | Cổng vòm của act trên đê. Chỉ dùng bản lab `-wide` (khe 2,6 m) |
| A21.6 | Mộ đầm | ✓ | fens | R2 | BIO-01 Willow Mere | |
| A22.1 | Đôi giày bỏ lại | ✓ | fens, poppyReach, gardenOfHush | R2 | Dọc tuyến người ngủ đi qua, mọi map Act I | Dấu vết, đặt thưa |
| A22.2 | Cọc thu tiền đò | ✓ | fens | R0 | — | Người lái đò |
| A22.3 | Nôi đan | ✓ | fens | R1 | — | Hai bản |
| A22.4 | Mộ đá người gặt | ✓ | poppyReach | R0 | — | Rite |
| A22.5 | Gậy và áo khoác | ✓ | poppyReach | R1 | — | |
| A22.6 | Búp bê rơm | ✓ | poppyReach | R0 | — | Trên bậc lối lách |
| A23.1 | Lúa gặt bỏ dở | ✓ | — | ✗ | — | QA: lưỡi hái lơ lửng, không có anh túc; giữ blockout |
| A23.2 | Cây gai buộc ruy băng | ✓ | poppyReach | R0 | — | |
| A23.3 | Luống hoa sân trong | ✓ | gentleHouse | R1 | — | |
| A23.4 | Chậu hoa | ✓ | gentleHouse | R1 | — | Scale 0,9–1,1 cho đa dạng |
| A23.5 | Bồn hoa có tường | ✓ | gentleHouse | R1 | — | |
| A23.6 | Dây phơi lanh | ✓ | gentleHouse | R1 | — | Vải lanh sạch; dây phơi ở làng dùng kit khác |
| A24.1 | Bàn bếp | ✓ | gentleHouse | R1 | — | |
| A24.2 | Giá bánh mì | ✓ | gentleHouse | R1 | — | |
| A24.3 | Bàn gấp lanh | ✓ | gentleHouse | R1 | — | |
| A24.4 | Chăn lật góc | ✓ | gardenOfHush | R2 | BIO-05 phòng bệnh | Phủ khít luống A13.1 |
| A24.5 | Chăn bông lật góc | ✓ | cradle | R1 | — | |
| A24.6 | Gối lanh | ✓ | cradle | R2 | BIO-05 | |
| A25.1 | Vòm sườn rễ (`-slim`) | ✓ | gardenOfHush | R1 | — | Chỉ dùng bản lab `-slim` |
| A25.2 | Cầu ván | ✓ | gardenOfHush | R1 | — | |
| A25.3 | Đống rễ sập | ✓ | gardenOfHush | R1 | — | Chặn lối |
| A25.4 | Giỏ thu hoạch | ✓ | gardenOfHush | R1 | — | Khoảng 10 bản rải theo cụm |
| A25.5 | Đồ chăm sóc | ✓ | gardenOfHush | R1 | — | |
| A25.6 | Đèn của Tamsin | ✓ | gardenOfHush | R0 | — | Nguồn sáng người duy nhất trong vườn |

---

## 4. Quái theo biome

Lấy từ file Biome và khu vực §5 (roster tiêu biểu, không đầy đủ; đủ ở checklist quái). Cột 3D: GLB trong `Resource_3D/monster/act-01/`.

### 4.1 Quái dùng lại qua nhiều biome

| ID | Quái | Biome | 3D | Ghi chú |
|---|---|---|---|---|
| U01 | Shambler | BIO-04 (Old Face), BIO-03, BIO-01 (Mire-Shambler) | ✓ | Một GLB cho các tier |
| U02 | Charnel Dead | BIO-03, BIO-08 | ✓ | Kiếm, khiên riêng |
| W01 | Mortar-Rat | BIO-04, BIO-03, BIO-08 (Scriptorium) | ✓ | |
| W02 | Gibbet-Crow | BIO-03, BIO-09, BIO-07 | ✓ | |
| W03 | Hush-Wolf | BIO-01, BIO-02 | ✓ | |
| W05 | Corpse-Candle | BIO-01, BIO-20 | – | Concept vC chốt 26/10 |
| W07 | Shroud-Spinner | BIO-06a, BIO-04 Garden | ✓ | |
| F02 | Poppy Nurse | BIO-02, BIO-04 Garden | ✓ | Kim riêng |
| P01 | The Soothed | BIO-01, BIO-04 Garden, BIO-27 | ✓ | Áo ngủ trắng: trắng sạch duy nhất ngoài vải Mercy |
| P03 | Hush-Moths | BIO-02, BIO-04 Garden, BIO-27 | ✓ | Một con của đàn |
| P05 | Wet-Nurse | BIO-04 Garden, BIO-27 | ✓ | Bọc vải riêng |
| D01 | Hodling | BIO-06a, BIO-06b (Salt Mine), BIO-16 | ✓ | GLB dựng từ biến thể B, khác concept đã chốt: đối chiếu trước khi dùng |
| D03 | Kiln-Bull | BIO-06a, BIO-16 | – | Concept vC/r6b chốt 26/10 |
| D04 | Tithe-Thief | Mọi act (hiếm) | ✓ | |
| D10, D11 | Gutter-Wing, Spark | BIO-16, BIO-23 | – | |
| U09, U10, U12 | Ossuary-Glutton, Wallshade, The Pressed | BIO-08 / BIO-17 / BIO-21 / BIO-23 / BIO-27 | – | |
| L01 | Saint-Statue | Mọi nhà thờ | – | L02, L03 từ Act II, chưa chốt concept |
| P10, P12 | The Blanched, Salt Pillar | BIO-10, BIO-11, BIO-27 | – | |
| F04–F08 | Kneeler … Halo Knight | BIO-07, BIO-08, BIO-27 (F04 thêm BIO-09) | – | |

### 4.2 Quái chỉ ở một biome

- **BIO-03:** U03 Charnel Bowman (cung riêng), U04 Charnel Ghoul, F01 Body-Snatcher (xẻng, bao riêng), B01 Sexton's Dog.
- **BIO-01:** W04 Mire-Sucker, U05 The Swollen, W06 Willow-Hulk, B02 Lullaby Man, B04 Willow Bride.
- **BIO-02:** P02 Hush-Herald (lư hương riêng), P04 Hive-Sleeper.
- **BIO-04 Garden:** P06 Poppy-Mound (tĩnh, dùng được ngay).
- **BIO-27 Cradle:** P07 Cradle-Warden, B05 Hospice Mother.
- **BIO-06a:** D02 Kiln-Shaman (muôi riêng), B03 Ember-Pot (xe nồi riêng).
- Act II–III: concept đã chốt ở `Concept_Art/monsters/act-02/` (21) và `act-03/` (23), biome theo bảng §5 của file Biome và khu vực. Chưa có GLB.

---

## 5. Prop chung, hero, NPC, item

### 5.1 Prop chung (`Resource_3D/map/common/`)

| Prop | Lô | Mức | Map đang dùng | Biome hợp | Không dùng ở |
|---|---|---|---|---|---|
| bone_pile | dungeon_v1 | R3 | lychgate | BIO-03 ossuary, BIO-04, BIO-08 | BIO-05, BIO-27 (Perfection không có xương lộ) |
| broken_column | dungeon_v1 | R3 | gardenOfHush | Hầm mộ cũ BIO-04, BIO-08 | |
| candle_cluster | dungeon_v1 | R3 | lychgate, fens, gardenOfHush | Nhà thờ, mộ, ossuary, hầm | BIO-05, BIO-27 (nến người lập loè); không làm đèn ngủ A13.3 |
| crypt_wall | dungeon_v1 | R3 | gardenOfHush, cradle | Phần hầm cũ, đầu cầu thang | Không làm tường đá lửa hay đập |
| fallen_bell | dungeon_v1 | R3 | fens | BIO-01 Rook's Weir, BIO-08 | |
| flint_boulders | dungeon_v1 | R2 | lychgate, poppyReach, gentleHouse | Xứ đá lửa: BIO-02, BIO-03, BIO-06a | Act III–V |
| mine_timber | dungeon_v1 | R1 | — | BIO-06 | Không làm khung cửa hầm (đã thử, thủng hình) |
| sarcophagus | dungeon_v1 | R3 | — | Hầm Barrow, hầm mộ BIO-04, BIO-08 | Không làm mortsafe |
| stalagmites | dungeon_v1 | R1 | — | BIO-06 | |
| mossy_stump | clutter_v1 | R2 | lychgate, fens | BIO-01, BIO-03 | Act II (rêu) |
| mushroom_cluster | clutter_v1 | R2 | lychgate, fens | BIO-01, BIO-03 | Act II |
| riverbank_stones | clutter_v1 | R3 | lychgate, fens, poppyReach | Bờ nước mọi biome có đá xám | |

Kit cũ không thuộc ASHLAR (`kit:*` trong lab) chỉ là đồ tạm. Tránh cây cháy, xác chôn, lều, palisade (sai cốt truyện; REUSE_CANDIDATES §4).

### 5.2 Hero, NPC, item

- **Hero** (`Concept_Art/heroes/`, 6 nghề): mọi biome. GLB có PS Pyre Singer A (khớp concept chốt) và FL Flagellant A (dựng từ concept cũ hơn
  bản v5b đã chốt: dựng lại hoặc đối chiếu trước khi dùng). Tay màn chọn nghề (`hero/_hands_v1/`) chỉ dùng ở scene chọn nghề.
- **NPC** (`Concept_Art/npcs/`, 51): theo act ghi trong `ashlar/art/npcs/manifest.json`. Act I đứng ở BIO-03 hub, trừ N10 (BIO-01 Rook's Weir),
  N11 và N12 (BIO-05), N07 Fen (BIO-04 Garden). `Resource_3D/npc/` còn trống.
- **Item** (`Item/`, 19 sheet theo lưới D2): loot dùng chung mọi biome. Vật nhiệm vụ: IT-10 (Act I), IT-15 (Act II), IT-18 (Act III), IT-19
  (Act IV–V, epilogue) gắn với area của nhiệm vụ.

### 5.3 Dùng chéo act đã duyệt

| Asset | Act đích | Lý do | Ảnh duyệt |
|---|---|---|---|
| — | — | Chưa có | — |

---

## 6. Còn thiếu hoặc cần chú ý

- **Chưa có 3D:** môi trường A05, A09, A10, A12; toàn bộ môi trường Act II (G01–G14 chưa chốt nên chưa vào Art_Final); quái D03, W05 Act I và
  mọi quái Act II–III; NPC; HUD.
- **Model cần dựng lại:** A07.6 (xà đậu), A23.1 (lưỡi hái lơ lửng). Model dùng được nhưng có ghi chú: A21.2 mặt tường là các tấm rời, A21.3 thấp,
  A23.4 và A23.5 thiếu bông oải hương, A25.2 có khe giữa ván.
- **Lệch concept:** D01 và hero FL dựng từ bản concept khác bản đã chốt trong `Concept_Art/`.
- **Bản lab khác bản gốc:** A02.1 `-open`, A06.1 `-open`, A21.5 `-wide`, A25.1 `-slim` chỉ có trong `lookdev-lab/assets/act1-kit/`
  (sinh bằng `lookdev-lab/scripts/prepare-act1-kit.py`). `Resource_3D/` giữ bản gốc chưa sửa hình.
- **Chưa có bản "sau act"** cho asset hub và wild nào.
