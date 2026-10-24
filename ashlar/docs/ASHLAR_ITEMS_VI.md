# ASHLAR — Danh mục item cho inventory và shop

> **Trạng thái:** bản nháp 24/10/2026, **chưa duyệt**. Viết để làm brief cho concept icon item ("Tổng hợp và gen concept các item dùng cho inventory và shop").
> **Cách đọc nhãn:** **Canon** = có trong tài liệu nguồn (ghi mục). **Đề xuất** = chưa có trong nguồn, chỉ là gợi ý của file này. Nguồn tự ghi "Proposal" cũng ghi là đề xuất, kèm mục của nguồn.
> **Viết tắt nguồn:** Bible = World Bible; Cast = Bestiary and Cast; LD = Level Design and Atmosphere Guide; Voc = Vocation System; AD = `art-direction/artdirection.md`; HC = `docs/ASHLAR_HERO_CONCEPT_VI.md`; HUD = `art/hud/README_VI.md`. Quest Ledger không có trong bộ nguồn, nên chỉ trích lại qua Voc.
> **Khi gen ảnh:** làm theo AD §0. Dán nguyên văn `STYLE CORE` (§3.1), `SHEET RULES` (§3.2) và `CONTENT` (§3.8), rồi mới viết phần riêng. QA từng ảnh theo AD §11.

---

## 1. Phạm vi và quy tắc chung

### 1.1 Thế nào là item

Item là mọi vật nằm trong ô inventory, ô trang bị hoặc quầy shop:
- đồ tiêu hao;
- tiền và hàng bán;
- vũ khí, class item, giáp;
- trang sức;
- vật liệu;
- quest item và relic;
- chìa khoá.

Một số hệ thống **không có item** (canon):
- **Không có bình mana.** Tài nguyên của mỗi nghề tự sinh khi chơi: Burden, Contrition, Souls, Salinity, dầu đèn, Breath (Bible §13.2; Voc §8–15).
- **Không có cuộn town portal.** *Open a Face* là thao tác chung: áp lòng bàn tay vào đá (Bible §16; Voc §8.9).
- **Không có cuộn waypoint.** Hero đi xuyên Tường từ ossuary này sang ossuary khác (Bible §16).
- **Identify:** canon chỉ cho biết có đồ "không thể identify" (Severin's Promise, Bible §15.1). *Đề xuất:* identify là dịch vụ trả coin ở keeper of lore của mỗi hub, không có cuộn, cùng chỗ với *Lifting a stone* (Voc §5.6).

### 1.2 Độ hiếm (Canon, Bible §16; LD §5.5)

| Bậc | Tương đương Diablo | Màu |
|---|---|---|
| **Rubble** | normal | xám |
| **Hewn** | magic | xanh dương |
| **Dressed** | rare | vàng |
| **Graven** | legendary; mỗi món mang một **Carving** (Voc §17.6) | cam |
| **Hallowed** | unique | vàng kim |

**Độ hiếm hiện trên icon thế nào:**
- **Viền ô và chữ tên** mang độ hiếm. Bible §17.7: "Item rarity borders are drawn as masonry courses, from rough rubble to carved, gilded stone." Bộ khung đã có bản nháp ở HUD KIT-2.
- **Bản thân vật không phát sáng theo độ hiếm.** HC §2.6: Graven và Hallowed đọc bằng khung loot, âm thanh và beam, không bằng vật liệu phát sáng. AD v1 §11: beam là tín hiệu gameplay, không biến item thành emissive.
- **Không dùng màu độ hiếm** cho vật liệu chính của item. Lý do: tránh đọc nhầm bậc, theo cùng tinh thần LD §5.5.
- Bậc lên bằng **cấu trúc, vật liệu, kỹ nghệ và dấu lịch sử** (HC §2.6, *đề xuất*): chắp nhặt → đồ nghề → cổ vật. Ở bậc cổ vật, vết sửa dùng chất độn vữa xám, hắc ín hoặc chì, **không bao giờ vàng**.

### 1.3 Định dạng ảnh icon (lưới và góc nhìn đã chốt 24/10, AD §12)

- **Lưới inventory kiểu Diablo II (đã chốt):** mỗi item chiếm một footprint ô. Bảng footprint (theo quy ước D2, chỉnh khi thiết kế UI):

  | Loại | Footprint |
  |---|---|
  | nhẫn, amulet, coin, Draught, muối, nến, vật liệu nhỏ, chìa nhỏ | 1×1 |
  | đũa, đèn relic nhỏ, bó hoa, chìa dài, cuộn giấy | 1×2 |
  | vũ khí một tay cán ngắn, đuốc, móc, sắt nung | 1×3 |
  | chùy, roi xích, rìu, vũ khí ứng biến to | 2×3 |
  | gậy, đòn khiêng, xẻng, giáo, nỏ | 2×4 |
  | mũ, găng, ủng, hòm, bình to, sách to, bọc đồ | 2×2 |
  | thắt lưng | 2×1 |
  | giáp ngực, áo, vải liệm | 2×3 |
  | khiên nắp quan tài, khiên to | 2×4 (khiên nhỏ 2×2, 2×3) |

- **Góc nhìn như D2 (đã chốt):** gần như nhìn thẳng, gần trực giao, không phối cảnh mạnh. Vật dựng đứng: lưỡi và cán thẳng đứng, đầu ở trên, nghiêng tối đa khoảng 10°. Áo giáp trải phẳng nhìn từ trước. Sáng từ trên bên trái. Vật lấp kín footprint của nó. Style vẽ theo AD §1, không bắt chước kiểu pre-render của D2.
- **Sheet:** một hàng footprint có lưới ô mờ (khung dựng bằng `ashlar/pipeline/codex/make_item_templates.py`), nhãn dưới mỗi item, nền xám ấm phẳng, không khung độ hiếm. Khung do UI ghép sau.
- **Ánh sáng:** đèn người là ngọn lửa ấm nhỏ, vẽ như hình. Đèn tắt khi item nằm trong túi; chỉ Osric's Lantern và đèn Exhumer có thể vẽ thắp ở bản showcase.
- **Biểu tượng:** dùng **Wedge** (hình đá khoá, hình thang rộng ở trên) **chỉ ở đồ của Giáo hội** và dòng tu Pall. Phái Odilian dùng Wedge nứt (AD §4.5). Đồ dị giáo, dân gian và Frostwife không mang dấu Giáo hội (HC §2.6). Không thập tự, không biểu tượng tôn giáo thật.

---

## 2. Danh mục

### 2.1 Đồ tiêu hao (C)

| ID | Tên | Act / nơi | Nguồn | Mô tả hình (EN) | Shop |
|---|---|---|---|---|---|
| C01 | **Draught** — ngụm hồi máu | mọi act | Đề xuất của Voc §17.6 (4 lượt, nạp lại ở ossuary và hub); phím F (Voc §8.8) | Squat grey stoneware flask with a wax-sealed cork, a small Wedge stamped in the clay, dark red liquid visible at a chipped lip; twine loop handle. | Không bán. Nạp miễn phí ở ossuary và hub; icon dùng cho ô HUD |
| C02 | **Waking Salts** — muối tỉnh ngủ | Act I | Đề xuất | Small horn snuff-box with a hinged brass lid, coarse white crystals inside, a sprig of dried rosemary tied on; cures Sleep and Slow (Hush). | Nell Coppercoin |
| C03 | **Mortar-Ash Pouch** — túi tro vữa | mọi act | Đề xuất. Tro vữa trên trán vào Mortar Day là canon (Bible §8.2) | Small grey linen pouch tied with black cord, a smear of pale grey ash on the cloth; brief fear/charm resist. | Verger Odo Pell / Pardoner Quint |
| C04 | **Votive Candle** — nến khấn | mọi act | Đề xuất. Nến và giá nến hình Wedge là motif canon (AD §4.5) | Thick tallow candle stub fused to a tin saucer, wick blackened, wax drips down one side; brief +light radius. | Nell, Quint, Morvan |
| C05 | **Lamp Oil Flask** — bình dầu đèn | mọi act | Đề xuất. Dầu đèn là tài nguyên Exhumer (Bible §13.2) | Flat dented tin flask with a screw spout and leather strap, oily amber sheen at the spout; Exhumer: instant oil refill. | Brannoc, Ansel Crane |

### 2.2 Tiền và hàng bán (G)

| ID | Tên | Act / nơi | Nguồn | Mô tả hình (EN) | Shop |
|---|---|---|---|---|---|
| G01 | **Coin** — tiền | mọi act | Canon: tiền tệ tên là "coin" (Voc §5.6, §17.14). Hình đồng xu là đề xuất | Small stack of worn copper and silver coins, each stamped with a Wedge on one face and a mason's square on the other; one coin on its edge. | Tiền chung |
| G02 | **Eye-Coins** — đồng xu đặt mắt người chết | Act I | Canon-gốc: Shambler còn "coins on their eyes" (Cast §2.1). Làm thành hàng bán: đề xuất | Pair of thin, bent copper coins, green-tarnished, threaded on a frayed black ribbon. | Drop; Nell mua |
| G03 | **Grave-Goods Bundle** — gói đồ tuỳ táng | mọi act | Canon: grave-goods (Bible §10.9; Cast §3.1, §8.1 Tithe-Thief) | Bundle tied in a scrap of shroud linen: a tarnished brooch, a clay bead string and a bent spoon poking out. | Drop; Nell mua và bán |
| G04 | **Funeral Ring** — nhẫn tang (đồ vặt) | Act I | Đề xuất. Nell "rings on every finger" (Cast §3.1) | Plain thin pewter band with a scratched name, a tiny loop of black thread knotted through it. | Drop; Nell |
| G05 | **Deed of the Upper Course** — giấy mua tầng trên | Act II | Đề xuất. Sale of Courses là canon (Bible §8.2) | Folded vellum certificate with a heavy grey wax seal in a Wedge shape, gilt edge flaking; "nearer the light". | Drop ở Chancery; bán cho Quint |
| G06 | **Salvage Brass** — đồ đồng vớt biển | Act V | Đề xuất (Morvan "sells what the sea gives up", Cast §7.1) | Barnacled brass ship's fitting and a green-crusted spoon, wet sheen, a strand of kelp. | Morvan mua và bán |

### 2.3 Vũ khí theo nghề (W)

Loại vũ khí nào nghề nào dùng là canon (Voc §17.6). Món khởi đầu Prologue là canon (Voc §3.4). Hình chi tiết lấy theo HC v3 (§1.4, §4–9); phần thiết kế ở đó là *đề xuất*.

| ID | Tên | Nghề | Nguồn | Mô tả hình (EN) | Shop |
|---|---|---|---|---|---|
| W01 | **Iron Candle-Stand** — giá nến sắt làm chùy | PB | Canon Voc §3.4 (Rubble, Prologue) | Tall black iron pricket candle-stand, three-footed base used as the striking head, wax crusted on the spikes. | Drop, Prologue |
| W02 | **Winged Mace** — chùy cánh | PB | Loại canon (Voc §17.6); thiết kế HC PB_A | Short oak-hafted mace with a forged iron head of six flanges, silver coffin-nail studs at the collar, leather grip. | Brannoc |
| W03 | **Bier-Pole** — đòn khiêng | PB | Canon (Voc §17.6, 2H) | Long dark oak pole, both ends capped in silver shaped like coffin-nail heads, two iron rings along the shaft, rope wrapping. | Brannoc |
| W04 | **Bell-Rope Chain** — dây chuông buộc xích | FL | Canon Voc §3.4 (Rubble) | Thick frayed red-brown bell-rope with a knotted length of rusty iron chain tied to its end, tassel still on the rope. | Drop, Prologue |
| W05 | **Knotted Scourge** — roi xích | FL | Loại canon (Voc §17.6); thiết kế HC FL_A | Short wooden handle bound in linen, two heavy chains ending in spiked iron balls, a single loop-knot iron charm at the pommel. | Ansel Crane (đề xuất Voc §17.14); một món ở mọi hub |
| W06 | **Sexton's Bone-Hook** — móc xương của người giữ mộ | OS | Canon Voc §3.4 (Rubble) | Iron hook on a long bone handle, used to pull skulls from niches; grey mortar dust in the crook. | Drop, Prologue |
| W07 | **Bone-Wand** — đũa xương | OS | Loại canon (Voc §17.6); thiết kế HC OS_A | Bundle of finger bones bound with waxed cord, topped by a small fan of splayed finger bones, a mortar handprint on the grip. | Goulven / mọi hub (đề xuất) |
| W08 | **Reed Sickle** — liềm cắt sậy | OS, FL | Loại canon (daggers, sickles; Voc §17.6) | Small crescent iron sickle with a worn ash-wood handle, a fen reed tied to the tang. | Brannoc |
| W09 | **Jar of Grave-Salt** — hũ muối mộ | BR | Canon Voc §3.4 (Rubble) | Squat unglazed clay jar with a cloth-tied mouth, coarse grey-white salt spilling from a crack in its side. | Drop, Prologue |
| W10 | **Driftwood Staff** — gậy gỗ trôi dạt | BR | Loại canon (staves); thiết kế HC BR_A | Crooked bleached driftwood staff crowned with a cluster of blue-grey salt crystals, rope bindings, two shells and a hanging green glass float. | Old Hovik (đề xuất Voc §17.14) |
| W11 | **Rusted Grave-Spade** — xẻng mộ gỉ | EX | Canon Voc §3.4 (Rubble) | Old long-bladed grave-spade, rust-brown blade with a nicked edge, split wooden T-grip mended with wire. | Drop, Prologue |
| W12 | **Exhumer's Spade** — xẻng Exhumer | EX | Canon (Bible §15.1, vũ khí của Ignatia; loại grave-spade Voc §17.6) | Long narrow spade, silver-edged blade engraved with a cut-out open-grave seal, black iron socket, oiled ash shaft. | Ansel Crane (đề xuất) |
| W13 | **Exhumer's Crossbow** — nỏ Exhumer | EX | Loại canon (Voc §17.6); thiết kế HC EX_A | Heavy crossbow with a steel prod, side crank winder, dark oiled stock, three silver-tipped bolts clipped under the tiller. | Ansel Crane (đề xuất) |
| W14 | **Votive Torch** — đuốc lễ | PS | Canon Voc §3.4 (Rubble) | Short iron-banded wooden torch from an ossuary stand, pitch-soaked rag head, unlit, soot on the bands. | Drop, Prologue |
| W15 | **Pyre-Staff** — gậy giàn thiêu | PS | Loại canon (Voc §17.6); thiết kế HC PS_A | Tall black birch staff topped by a small iron cage holding a burning log, red thread braided under the cage, ash flakes. | Ilya / Mother Dragana (đề xuất) |
| W16 | **Flint Hand-Axe** — rìu lửa đá | PB, FL | Đề xuất (rìu là loại canon; đá lửa là vật liệu Dolmoor, LD §18.1) | One-handed axe with a forged iron head, knapped black flint inlay along the cheek, hide-wrapped haft. | Brannoc |

### 2.4 Class item và tay phụ (O)

| ID | Tên | Nghề | Nguồn | Mô tả hình (EN) | Shop |
|---|---|---|---|---|---|
| O01 | **Torn Coffin-Lid** — nắp quan tài giật từ hốc | PB | Canon Voc §3.4 (Rubble). Hình: HC §2.9 | Tall narrow hexagonal coffin lid of grey weathered planks, splintered hinge side, a rope handle knotted through two holes; never child-sized. | Drop, Prologue |
| O02 | **Pall Coffin-Lid** — khiên nắp quan tài | PB | Canon (Bible §8.3; Voc §17.6) | Tall hexagonal oak lid, thick iron rim, a row of large silver coffin-nails round the edge, a Wedge of nails at the centre. | Brannoc (đề xuất Voc §17.14) |
| O03 | **Branding Iron** — sắt nung | FL | Canon (Voc §17.6) | Long iron rod with a wrapped wooden grip and a single loop-knot brand at the tip, the tip painted glowing orange. | Ansel Crane (đề xuất) |
| O04 | **Reliquary** — hòm thánh tích | OS | Canon (Voc §17.6); thiết kế HC OS_A | Small house-shaped box of carved bone panels with silver corners on a short chain, eight round sockets in two rows on the front, empty. | Goulven (đề xuất) |
| O05 | **Brine-Flask** — bình nước biển | BR | Canon (Voc §17.6); thiết kế HC BR_B | Round glass flask in a rope net with a carry loop, cloudy swirling teal brine inside, salt crust growing down from the neck. | Old Hovik (đề xuất) |
| O06 | **Hooded Lantern** — đèn có chụp | EX | Canon (Voc §17.6; 5 wick Voc §14.2) | Brass five-slat lantern with a hinged iron hood half closed, glass oil well showing the oil level, short hook chain. | Goulven (đề xuất) |
| O07 | **Mortsafe-Grille Shield** — khiên song sắt chắn mộ | PB | Đề xuất. Mortsafe là canon (Bible §10.9, §15.1) | Rectangular shield of black wrought-iron grave-cage bars riveted to an oak back, one bent bar re-welded, a plain iron boss. | Brannoc |

### 2.5 Giáp theo ô (A)

Phân loại giáp nặng / vừa / nhẹ là canon (Voc §17.6). Từng món dưới đây là đề xuất, trừ khi ghi khác.

| ID | Tên | Ô | Nguồn | Mô tả hình (EN) | Shop |
|---|---|---|---|---|---|
| A01 | **Burial Shroud** — vải liệm | Ngực | Canon: hero tỉnh dậy trong vải liệm Nell đã mua (Bible §11.3, *Mortsafe Thieves*; Voc §3.4) | Folded off-white linen shroud with grey mortar dust in the folds, frayed hem, a strip of jaw-binding cloth. | Không bán (đồ khởi đầu) |
| A02 | **Gennet's Coat** — áo khoác của Gennet | Ngực | Canon (Voc §3.4: starting chest armour). Hình: HC §2.9 | Long, wide peat-brown wool coat, deep pockets, high collar, two big patches, a pipe-burn hole near one pocket. | Không bán (quest, Prologue) |
| A03 | **Patched Brigandine** — áo brigandine vá | Ngực (vừa) | Đề xuất (theo áo của Osric, Cast §3.1) | Faded oxblood canvas brigandine with rows of iron rivet heads, two mismatched patches, buckled side straps. | Brannoc |
| A04 | **Oilskin Coat** — áo vải dầu | Ngực (vừa) | Đề xuất (fen, ngư dân lươn; LD §11.2) | Stiff dark green oilskin coat with a short shoulder cape, horn toggles, a salt-white tide line at the hem. | Nell |
| A05 | **Pall Cuirass** — giáp ngực dòng Pall | Ngực (nặng) | Đề xuất (dòng tu Pall, Bible §8.3) | Black steel breastplate with a silver Wedge of nail-heads at the sternum, purple cloth at the collar, iron coffin-nail rivets. | Mọi hub từ Act II |
| A06 | **Sexton's Cowl** — mũ trùm người giữ mộ | Mũ (nhẹ) | Đề xuất | Grey wool hood with a short shoulder cape, darned at the crown, a sprig of dried poppy tucked at the edge. | Nell |
| A07 | **Wide-Brim Hat** — mũ rộng vành | Mũ (vừa) | Đề xuất (từ hình Exhumer, HC §2.3) | Brown felt wide-brimmed hat, one side pinned up, a cream cloth patch stitched over the crown where a seal was cut off. | Ansel Crane |
| A08 | **Ash-Veil** — mạng tro | Mũ (class PS) | Canon (Voc §17.6) | Black iron circlet with a long veil of pale ash-white gauze trailing back, red thread knots at the temples. | Ilya / Mother Dragana (đề xuất) |
| A09 | **Pall Great-Helm** — mũ trụ dòng Pall | Mũ (nặng) | Đề xuất | Flat-topped dark steel helm with a narrow T visor, silver nail studs in a ring, a small iron bell tied at the nape. | Mọi hub từ Act II |
| A10 | **Gravedigger's Gloves** — găng đào mộ | Găng | Đề xuất | Pair of thick oiled leather work gloves, worn through at one thumb, a strip of mortar-grey cloth wrapped at the cuff. | Nell, Brannoc |
| A11 | **Nailed Gauntlet** — găng sắt đóng đinh | Găng (nặng) | Đề xuất (HC §2.2: đinh bạc ở khớp tay PB) | Broad iron gauntlet with silver coffin-nails set in the knuckle plates, rope-burned leather palm. | Brannoc |
| A12 | **Peat-Cutter's Boots** — ủng thợ cắt than bùn | Ủng | Đề xuất | Knee-high muddy brown leather boots, wrapped in twine below the knee, a patched toe, dried peat on the soles. | Nell |
| A13 | **Iron-Shod Sabatons** — giày sắt | Ủng (nặng) | Đề xuất | Heavy black iron-plated boots with riveted toe caps and silver nail heads along the instep. | Brannoc |
| A14 | **Sexton's Tool Belt** — thắt lưng đồ nghề | Thắt lưng | Đề xuất | Wide leather belt with an iron buckle, a hanging ring of three old keys, a chalk pouch and a small trowel loop. | Brannoc |
| A15 | **Ten-Knot Cord** — dây mười nút | Thắt lưng (FL) | Đề xuất (HC FL_A) | Thick red waist cord with ten evenly spaced knots, the tail end bound in linen and a single iron loop-knot charm. | Ansel Crane |

### 2.6 Trang sức (J)

Ô nhẫn và amulet là canon: hai ô nhẫn, Severin's Promise đeo ở ngón riêng, amulet có affix (Voc §17.6). Charm không có trong nguồn.

| ID | Tên | Act | Nguồn | Mô tả hình (EN) | Shop |
|---|---|---|---|---|---|
| J01 | **Severin's Promise** — Lời hứa của Severin | mọi act | **Canon relic** (Bible §15.1; Voc §17.6). Không tháo, không identify; khắc *"Wait for me."* | Plain tarnished silver band, slightly worn thin on one side, faint engraving hidden on the inner face; no gem, no glow. | Không bán |
| J02 | **Bone Ring** — nhẫn xương | mọi act | Đề xuất (HC OS: nhẫn xương ngón to) | Thick ring carved from a single knuckle bone, yellowed ivory, a hairline crack filled with grey mortar. | Nell |
| J03 | **Mason's-Mark Signet** — nhẫn ấn dấu thợ đá | Act I+ | Đề xuất (mason's marks trên đá Spoil, LD §11.8) | Heavy grey iron signet with a flat face cut with an angular mason's mark, rough chisel facets. | Drop (Flint Delvings, Spoil) |
| J04 | **Wedge Pendant** — mặt dây Wedge | mọi act | Đề xuất (Wedge là canon, Bible §8.2) | Small grey stone keystone-shaped pendant on a dark cord, a tiny iron bail, edges polished by thumbs. | Odo Pell, Pardoner Quint |
| J05 | **Cracked Wedge** — Wedge nứt Odilian | Act II | Đề xuất (dấu Odilian, AD §4.5) | Keystone-shaped bronze amulet split by a deliberate crack down the middle, wrapped together with black thread. | Old Vellum (đề xuất) |
| J06 | **Bell-Bronze Pendant** — mặt đồng chuông | Act II | Đề xuất (soul-bells, Bible §8.2) | Small cast-bronze disc with a verdigris edge and a cast name around the rim, hung on a leather thong. | Ansel Crane |
| J07 | **Salt-Glass Ring** — nhẫn kính muối | Act III | Đề xuất (salt-glass, LD §18.3) | Milky translucent salt-glass band, flawless outside, one deliberate chip at the rim. | Nareh |

### 2.7 Vật liệu chế tác (M)

Socket, gem và rune **không có** trong nguồn (chữ "socket" ở HUD là ô skill). Canon có **Carving** (năng lực khắc trên đồ Graven, Voc §17.6) và dịch vụ **Graving**: khắc tên từ Book of Laid Names (ledger §4.3 qua Voc §17.1, HC §2.6). Toàn bộ vật liệu dưới đây là **đề xuất**, dùng cho chế tác hoặc Graving nếu team mở hệ đó.

| ID | Tên | Act | Mô tả hình (EN) | Nguồn vật | Shop |
|---|---|---|---|---|---|
| M01 | **Grey Mortar** — vữa xám | mọi act | Fist-sized lump of grey mortar with a few bone chips set in it, a handprint pressed in one side. | Mặt Tường, ossuary (Bible §4.6) | Drop |
| M02 | **Mason-Stone Chip** — mảnh đá Mason | Act I+ | Sharp-edged pale grey stone fragment with a scribed guide line and part of an angular mason's mark; never glows. | Spoil (LD §11.8) | Drop |
| M03 | **Kiln-Glaze Shard** — mảnh men lò | Act I+ | Curved brick-red fired-clay shard with a crackled dark glaze and a clear thumbprint, soot at the edge. | Discarded (LD §4.1) | Drop |
| M04 | **Silver Coffin-Nails** — đinh quan tài bạc | mọi act | Small bundle of five long square-shanked silver nails with domed heads, tied with black cord. | Pall (Bible §8.3) | Brannoc |
| M05 | **Hush-Poppy** — anh túc Hush | Act I | Bunch of three red poppies with long pale stems and seed heads, a few petals already dropping. | Canon vật (Bible §15.1); dùng làm vật liệu: đề xuất | Drop (Poppy Reach) |
| M06 | **Bell-Bronze Scrap** — mảnh đồng chuông | Act II | Jagged curved bronze fragment of a bell rim, green verdigris, a few cast letters of a name. | Soul-bells (Bible §8.2) | Ansel Crane |
| M07 | **Salt-Glass** — kính muối | Act III | Rough block of milky salt-glass, crisp faceted breaks on one end, smooth polished on the other. | LD §18.3 | Old Hovik |
| M08 | **Frost-Tempered Steel** — thép tôi băng | Act IV | Short dark blue-grey steel ingot rimed with white frost at the edges, a smith's stamp. | Ilya the icesmith (Cast §6.4) | Ilya |

### 2.8 Relic (R)

Relic là đồ gắn chặt, không chiếm ô, luôn có hiệu lực (Voc §17.6, ledger §16.1). Hiện trong màn trang bị như một hàng riêng.

| ID | Tên | Act nhận | Nguồn | Mô tả hình (EN) |
|---|---|---|---|---|
| R01 | **Osric's Lantern** — đèn của Osric | A1-Q2 | Canon (Voc §8.9, §17.6) | Simple old iron hand lantern, about 0.12H, ONE hinged hood, no slats and no notches (never like the Exhumer's lantern), unlit (HC §2.4). |
| R02 | **The Tongueless Bell** — Chuông không lưỡi | A2-Q6 | Canon (Voc §17.6; side quest Bible §11.4) | Small cathedral hand-bell of old green bronze with no clapper inside, names cast round the rim, a cracked leather strap. |
| R03 | **The Inkman's Mark** — dấu của Inkman | A3-Q6 | Canon (Voc §17.6) | Icon: a forearm-sized patch of skin-coloured vellum with a dense spiral of small dark tattooed script, a bone needle beside it. |
| R04 | **Silver Coffin-Nail** — đinh quan tài bạc | A5-Q5 | Canon (Voc §17.6) | One long silver coffin-nail with a domed Wedge-stamped head, slightly bent, a thread of black ribbon tied below the head. |

### 2.9 Quest item và vật kể chuyện theo act (Q)

Mọi item trong bảng là vật canon. Riêng việc chúng là **vật nhặt vào inventory** là đề xuất, trừ khi ghi khác. Không bán.

| ID | Tên | Act / quest | Nguồn | Mô tả hình (EN) |
|---|---|---|---|---|
| Q01 | **The Book of Laid Names** — Sổ Tên Người Nằm | Act I–IV (của Gennet, rồi của hero) | Canon relic (Bible §15.1) | Huge thick ledger bound in cracked black leather with iron corners, many ribbon markers, pages of mixed old handwriting at the edges. |
| Q02 | **Oldest Volume of the Book** — tập cổ nhất | A1 *One for the Footing* | Canon (Bible §11.3) | Smaller, crumbling ledger with wooden boards and a rusted clasp, faded brown ink, a counting-rhyme verse scratched on the inside board. |
| Q03 | **Edda's Broth Bowl** — bát nước dùng của Edda | A1 *The Broth* | Đề xuất (Brannoc đút nước dùng mỗi sáng, Bible §10.9) | Plain wooden bowl with a horn spoon resting in it, still warm broth, a faint steam curl. |
| Q04 | **The Ferryman's Tin** — hộp xu của người lái đò | A1 *The Ferryman's Toll* | Canon (Cast §3.4) | Dented rusty tobacco tin full of mismatched coins, water dripping from the lid, a lock of a girl's hair tied to the hinge. |
| Q05 | **Cup of Poppy Tea** — chén trà anh túc | A1 *The Gentle House* | Canon cảnh (Bible §11.3; LD §11.9) | Clean white glazed cup on a saucer, pale red tea, a single poppy petal floating; too perfect next to human things. |
| Q06 | **Shroud Bill of Sale** — biên lai mua vải liệm | A1 *The Mortsafe Thieves* | Đề xuất (Nell đã mua vải liệm của hero, Bible §11.3) | Torn scrap of paper with a smudged tally, a coin-stain ring and a doodled smiling face signature. |
| Q07 | **The Willow Bride's Veil** — mạng cưới của cô dâu cây liễu | A1 *The Willow Bride* | Đề xuất | Long waterlogged lace veil tangled with willow leaves and pond weed, a small tarnished pin. |
| Q08 | **The Unedited Testament** — Kinh văn chưa sửa | A2-Q4 | Canon relic (Bible §15.1) | Small, plain, hand-sewn book of yellowed vellum with Saint Odile's neat handwriting, an old grey wax seal broken open. |
| Q09 | ***On the Term*** — báo cáo về kỳ hạn | A2 *The Bought Course* | Canon relic (Bible §15.1) | Thin folded report in a black wax-sealed sleeve marked with the Quiet Chapter's plain square seal, one line underlined. |
| Q10 | **The Iron Halo** — Vương miện sắt | A2-Q7 | Canon relic (Bible §15.1) | Heavy black iron crown with short spikes pointing INWARD, rust at the points; no blood. |
| Q11 | **Ignatia's Broken Seal** — ấn Exhumer bẻ đôi | A2, kết act | Canon (Bible §11.4) | Iron badge of an open grave, snapped cleanly in two, both halves on a frayed cord. |
| Q12 | **Nareh's Contraband** — "tội lỗi" lậu | A3 *Contraband of Sin* | Canon (Bible §11.5) | Small crate of "sin": a bottle of red wine, an ink pot, a pair of bone dice, a roll of dyed cloth, a tin of scar-salve. |
| Q13 | **The Chipped Cup** — chén mẻ của Nareh | A3 *A Cup With a Chip* | Canon (Bible §11.5) | Simple greenish clay drinking cup, a clear chip in the rim, a thumb-worn glaze. |
| Q14 | **Whispering-Crystal** — đá thì thầm | A3 *The Ship's Heart* | Canon (Bible §15.1) | Palm-sized cloudy Halcyon crystal, geometric and flawless, with faint concentric rings inside like sound. |
| Q15 | **The Salt Crown** — vương miện muối | A3, sau act | Canon relic (Bible §15.1) | Delicate crown of perfect white salt-glass spires, one spire snapped off and salt-crusted fish scales stuck at the base. |
| Q16 | **Mila's Music Box** — hộp nhạc của Mila | A4 | Canon hero prop (LD §18.4) | Small lacquered wooden box with a tiny brass crank, faded painted spring flowers on the lid, lid slightly open. |
| Q17 | **The Living Flower** — bông hoa sống | A4 *Spring Under Glass* | Canon (Bible §11.6) | One small pale-yellow flower in soil under a thick glass bell jar, a faint fog of breath on the glass. |
| Q18 | **Severin's Letter** — thư của Severin | A5 (sưu tập) | Canon (Bible §15.1, §18) | Folded letter on old paper sealed with a plain drop of white wax, faded ink showing through, salt-stained corner. |
| Q19 | **Maelys's Candle Stub** — mẩu nến của Maelys | A5 | Canon (Cast §7.1) | Short stub of beeswax candle, wick blackened, a loop of twine tied round it, wax fused to the twine. |
| Q20 | **The Pear** — quả lê | Epilogue | Canon relic (Bible §15.1) | One ripe pear with a short stem and a single leaf, golden-green, slightly bruised on one side. |

### 2.10 Chìa khoá (K)

Nguồn không nói gì về chìa khoá. Toàn bộ bảng là **đề xuất**, gắn vào những địa điểm canon có cửa khoá.

| ID | Tên | Act / nơi | Mô tả hình (EN) | Shop |
|---|---|---|---|---|
| K01 | **Ossuary Grille Key** — chìa song sắt ossuary | Prologue, Old Face | Long black iron key with a round bow shaped like a skull-niche arch, flint-grey rust. | Drop |
| K02 | **Barrow Vault Key** — chìa hầm nhà Barrow | A1 *One for the Footing* | Old bronze key with five notches in its bit (the rhyme's count), a knot of faded ribbon. | Drop (Gennet's hut) |
| K03 | **Gentle House Gate Key** — chìa cổng Gentle House | A1 | Clean pale iron key, untarnished and too smooth, a poppy-shaped bow, on a white linen loop. | Drop (Poppy Sister) |
| K04 | **Chancery Ledger Key** — chìa phòng sổ Chancery | A2 *The Bought Course* | Ornate gilt brass key with a Wedge-shaped bow and a tiny numbered tag. | Drop |
| K05 | **Bell-Pit Key** — chìa hầm chuông | A2, Bell Catacombs | Heavy bronze key with a bell-shaped bow, verdigris, cast name letters on the shank. | Drop |

---

## 3. Shop theo hub

Vai trò NPC ở từng hub là canon (Bible §7.9; Cast §10). Hàng bày bán là **đề xuất**, trừ khi ghi nguồn. Voc §17.14 tự ghi phần class item ở hub là "Proposal".

| Hub | NPC (vai trò canon) | Bán / dịch vụ |
|---|---|---|
| **Lychgate** (Prologue, Act I) | **Brannoc the Mortsmith** (thợ rèn) | Nắp quan tài, đòn khiêng, chùy (Voc §17.14, đề xuất) · W02 W03 W08 W16 · O02 O07 · A03 A10 A11 A13 A14 · M04 · C05. Sửa đồ. |
| | **Nell Coppercoin** (thương nhân, kiêm "gambler" như Gheed, Cast §3.1) | Thu mua grave-goods (canon: "things the dead don't need") · G02 G03 G04 · C02 C04 · A04 A06 A10 A12 · J02. Đổ xúc xắc mua đồ chưa identify: đề xuất. |
| | **Gennet Barrow** (keeper of lore) | *Lifting a stone*, trả coin (Voc §5.6); identify (đề xuất); Graving (đề xuất). |
| | **Verger Odo Pell** (lãnh đạo tinh thần) | C03 · J04; thùng thuế ở cửa nhà thờ (LD §11.2). Đề xuất. |
| **Lowcourse, Sepulcra** (Act II) | **Ansel Crane** (thợ đúc chuông) | Roi xích, sắt nung, nỏ và xẻng từ kho Exhumer (Voc §17.14, đề xuất) · W05 W12 W13 · O03 · A07 A15 · J06 · M06. |
| | **Pardoner Quint** và **Saint in the Box** | Ban phước từ cái sọ (canon, Bible §11.4) · khay thánh tích · C03 C04 · J04 · mua G05. |
| | **Old Vellum** (keeper of lore) | Dịch vụ như Gennet · J05 (đề xuất). |
| **Namakhar** (Act III) | **Old Hovik** (thợ muối) | Bình nước biển, gậy, đũa (Voc §17.14, đề xuất) · W10 · O05 · M07. |
| | **Nareh** (buôn lậu) | "Tội lỗi" lậu: rượu, mực, xúc xắc, vải nhuộm, thuốc mỡ sẹo (canon, Bible §10.7) · J07. |
| | **The Inkman** (keeper of lore) | Dịch vụ lore; xăm R03 (canon quest). |
| **Vesnagrad** (Act IV) | **Ilya the icesmith** | Gậy giàn thiêu (đề xuất) · W15 · M08. |
| | **Mother Dragana** (thương nhân bán lông thú) | Đồ lông, mạng tro (Voc §17.14, đề xuất) · A08. |
| | **Brother Miron** (keeper of lore) | Dịch vụ lore. |
| **Wrackhaven** (Act V) | **Goulven** (thợ rèn neo) | Hòm thánh tích làm từ đồ vớt, đèn có chụp (Voc §17.14, đề xuất) · O04 O06 · W07. |
| | **Morvan** (người cướp tàu đắm, bán đồ vớt) | "Bán những gì biển trả lại" (canon, Cast §7.1) · G06 · C04. |
| **Mọi hub** | — | Mỗi hub bán ít nhất một món của mỗi nghề (Voc §17.14, đề xuất). Draught nạp miễn phí ở ossuary (đề xuất). |

---

## 4. Batch concept đầu tiên (đề xuất): 24 item, 5 sheet

Ưu tiên Prologue và Act I, đồ canon trước. Mỗi sheet là một ảnh, một phiên Codex (skill `concept-art`). Định dạng theo §1.3: ô đánh số, nền xám phẳng, không khung độ hiếm.

| Sheet | Tên sheet | Số ô | Item |
|---|---|---|---|
| **IT-01** | Prologue: vũ khí ứng biến | 6 | W01, W04, W06, W09, W11, W14 |
| **IT-02** | Class item tay phụ | 5 | O01, O03, O04, O05, O06 |
| **IT-03** | Giáp khởi đầu và đồ Lychgate | 4 | A01, A02, A10, A12 |
| **IT-04** | Relic và quest Act I | 5 | J01, R01, Q01, Q04, M05 |
| **IT-05** | Tiêu hao và tiền | 4 | C01, C02, G01, G03 |

Ghi chú khi dựng prompt:
- **IT-01:** đồ Rubble, nhặt từ ossuary. Có bụi vữa xám và kim loại không đồng bộ (HC §2.6, bậc 1). W14 vẽ tắt; HC §2.9 nói đuốc được thắp từ đèn Gennet ở stage 2.
- **IT-02:**
  - O01 dùng dáng nắp quan tài lục giác hẹp; không bao giờ là quan tài trẻ con (LD §8.5).
  - Lỗ hốc của O04 vẽ trống; điểm linh hồn là hiệu ứng.
  - O06 khác hẳn R01: đèn năm nan so với một chụp (HC §2.4).
- **IT-04:**
  - J01 không gem, không sáng.
  - R01 đúng hình ở HC §2.4.
  - Q01 là sổ to nặng, có thể đặt trên giá.
- **IT-05:** C01 là đồ đề xuất của Voc. Gen để thử icon ô HUD phím F, không phải để bán.
- **Act I còn lại cho batch 2:** O02, W02, W03, W08, O07, A06, A14, C04, G02, Q02, Q03, Q05, Q07, K01–K03.

---

## 5. Câu hỏi mở

1. **Draught:** giữ hệ lượt sạc (Voc) hay có thêm bình hồi máu bán ở shop như D2?
2. **Socket và chế tác:** có mở không? Nếu không, bỏ M01–M08 hoặc giữ làm nguyên liệu Graving.
3. ~~Lưới inventory~~ — **đã chốt 24/10:** lưới D2 có footprint, góc nhìn icon như D2 (§1.3).
4. **Định dạng icon §1.3** là đề xuất. Người dùng duyệt thì ghi vào AD §12 trước khi gen tiếp (AD §0, mục 7).
