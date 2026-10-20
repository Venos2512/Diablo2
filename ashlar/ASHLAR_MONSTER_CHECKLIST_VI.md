# ASHLAR — Danh sách quái để duyệt

> Quyết định ngày 2026-10-19: dùng ASHLAR làm thế giới của game. File này gom mọi loại quái và boss trong 3 tài liệu ASHLAR để duyệt từng con.

**Nguồn**
- `ASHLAR - Bestiary and Cast by Act.md` (gọi tắt **Cast**): nguồn chính cho thiết kế và hành vi.
- `ASHLAR - World Bible and Story.md` (**Bible**): họ quái ở §14, các Perfection ở §6.
- `ASHLAR - Level Design and Atmosphere Guide.md` (**LD**): ghi chú dựng cảnh, âm thanh, an toàn nội dung.

Ba file gốc mới chỉ nằm trong thư mục attachments của T3 (`C:\Users\HLC_2021\.t3\userdata\attachments\`), chưa được đưa vào repo.

**Cách duyệt**
- **ID** gồm chữ cái chỉ họ và số thứ tự: U = Unlaid, D = Discarded, W = Warped, F = Faithful, P = Perfection-born, L = Lodge's servants, X = the Perfect, B = boss. Khi góp ý, chỉ cần ghi ID (ví dụ "P07 đổi dáng").
- **Cột ✓**: đổi `[ ]` thành `[x]` khi đồng ý.
- **Cột "Cần xem"**: chỗ mình thấy lệch khi đối chiếu 3 file, hoặc ràng buộc từ LD. Ý nào LD tự gắn nhãn Proposal (không phải canon, bỏ được) thì ghi rõ "Proposal". Để trống nghĩa là không thấy vấn đề.
- **Tên** giữ tiếng Anh như canon. "Thiết kế" và "Hành vi" là bản dịch rút gọn từ Cast. "Gốc Diablo" lấy từ cột "Takes after" của Cast (D1, D2, D3, DI, D4).
- **Thứ tự trong mỗi họ** theo lần xuất hiện đầu tiên, từ Prologue tới Act V.
- **Luật chung (Cast §12):** giữ lớp silhouette, vai trò và hành vi đặc trưng của quái Diablo gốc. Đổi tên, nguồn gốc, chất liệu, bảng màu, và thêm một chi tiết chỉ ASHLAR mới có. Không tái dùng boss nào của Diablo.

---

## Tổng quan

| Họ | Quái thường | Boss | Báo trước bằng âm thanh |
|---|---|---|---|
| Unlaid (người chết không yên) | 16 | 1 | Tiếng gõ từ trong quan tài |
| Discarded ("quỷ" đất nung) | 16 | 2 | Bay thợ hồ lách cách, giọng đếm gạch bằng tiếng Mason |
| Warped (thú bị biến đổi) | 18 | 0 | Tiếng thú "hơi sai": gai lách cách, tiếng cánh, tiếng hú mang bài ru |
| Faithful (giáo phái, binh lính) | 17 | 0 | Thánh ca, chuông, lời cầu |
| Perfection-born (con đẻ của 5 Perfection) | 27 | 11 | Chữ ký âm thanh của từng Perfection |
| Lodge's servants (tay sai của Mason) | 4 | 0 | Đá nghiến, tiếng đục *tock*, nhạc tắt hẳn |
| The Perfect | 1 | 0 | Im lặng |
| Mason | — | 1 (the Chisel) | |
| Chưa có họ | — | 2 (Willow Bride, the Unbroken) | |
| **Tổng** | **99** | **17** | |

| Act | Quái thường | Boss |
|---|---|---|
| Prologue | 3 | 1 |
| I | 24 | 4 |
| II | 24 | 2 |
| III | 22 | 3 |
| IV | 21 | 4 |
| V | 22 | 3 |

Một con có thể xuất hiện ở nhiều act. Bốn con đi khắp nơi: D04 (mọi act), L01 (mọi nhà thờ), L02 và L03 (từ Act II).

---

## Việc cần chốt trước (ảnh hưởng nhiều con)

1. **Hai con cùng tên "Kneeler".** F04 là người sống quỳ ngoài phố, P08 là người chết quỳ trong Kneeling Vault. Đề xuất đổi P08 thành "the Kneeling Dead". Cast vốn đã mô tả P08 bằng chính cụm này.
2. **Năm con bị xếp hai họ.** Bible §6 coi F02, F05, F06, F08, F13 là spawn của Perfection, còn Bible §14.2 và Cast xếp chúng vào Faithful. Mỗi con cần đúng một họ, vì database Book of Cain mỗi bản ghi chỉ có một `group`.
3. **Warped được định nghĩa là "động vật" nhưng chứa cả thứ không phải động vật.**
   - W03 là người biến hình.
   - W05 là lửa ma.
   - W06 là rễ cây và xương.

   Có hai cách: chuyển các con này sang họ khác, hoặc nới định nghĩa Warped thành "sinh vật và cây cỏ bị biến đổi". Hai trường hợp ngược lại cũng cần xem: F14 là người chết nhưng xếp Faithful, B01 là động vật nhưng xếp Unlaid.
4. **Bậc tên chưa đủ.** Bible §14.1 nói mọi họ có tên theo bậc, tối dần theo độ sâu. Cast mới có đủ 4 bậc cho U01, U02 và D01. D05–D07 và D12 chỉ có hai đầu "Raider → Breaker". Khoảng 90 con còn lại mới có bậc 1.
5. **Dáng trùng nhau:**
   - P07 Cradle-Warden và B02 Lullaby Man: cả hai là người khâu bằng vải khổng lồ cõng nôi lồng.
   - P24 Lantern-Lure và B15 Lamplighter: cả hai mang đèn trên cuống như cá biển sâu.
   - D10 Gutter-Wing và L03 Gargoyle Mortarer: cả hai là gargoyle đậu trên mái.
6. **Tên dễ lẫn:**
   - U12 the Pressed và P17 the Preserved.
   - F17 Lamplighter cultist và B15 The Lamplighter.
   - F03 Exhumer (quái) trùng tên class Exhumer của người chơi.
   - Bậc "Kiln-Hod" của D01 trùng tiền tố với D02 Kiln-Shaman, D03 Kiln-Bull, D16 Kiln-Lord.
   - Gạch nối không thống nhất: Salt Reaver / Salt-Dervish, Brine Leech / Brine-Worm, Glass Wasp / Glass-Folk.
7. **L01 Saint-Statue.** Với camera iso, "chỉ di chuyển khi không ai nhìn" cần định nghĩa rõ: ngoài màn hình, ngoài light radius, hay sau lưng hero. Ngoài ra LD cấm người chơi thấy tượng cử động trước cảnh Plumb, mà Chancery lại đứng trước Cathedral trên tuyến Act II.
8. **An toàn nội dung (LD §8.4–8.5):**
   - P05 Swaddlings phải không giống trẻ sơ sinh.
   - P23 Beckoner nên không gợi dục. Brief Dying Gods mới cấm điều này cho họ Forsworn, ASHLAR chưa có luật chung.
   - P10 the Blanched trông như sáp, không gore.
   - F04 và P09 có hình ảnh tự hại.
   - W07 và P04 cần tùy chọn cho người sợ nhện và sợ ấu trùng.
9. **Boss còn thiếu:** B04 và B17 chưa có họ; B01 chưa có trong lời kể Prologue của Bible §11.2.

---

## 1. Unlaid — người chết không yên (16)

- **Lore:** từ sau Unsettling, xác có linh hồn chống lại sức kéo của Tường (the Wall) sẽ trỗi dậy. Chết kiểu nào thì sống dậy kiểu đó (Bible §14.2).
- **Báo trước:** tiếng gõ từ trong quan tài, vải liệm lê trên đất, xương lạch cạch (LD §6.5).
- **Đọc silhouette bằng:** tư thế (LD §8.1).
- **Vai (mình suy ra từ hành vi):** cận chiến U01 U02 · tầm xa U03 · phép U08 U11 · nhanh U04 · nổ U05 U07 · nặng U06 U12 U15 · hồi sinh đồng loại U14 · hút tài nguyên U10 · ăn xác rồi bắn U09 · kéo U16 · gây ngạt U13.

| ID | Quái | Act · khu | Thiết kế | Hành vi | Gốc Diablo | Cần xem | ✓ |
|---|---|---|---|---|---|---|---|
| U01 | **Shambler** · bậc: Shambler → Rot-Shambler → Mire-Shambler → Plague-Shambler | Prologue: Old Face, nghĩa trang · I: nghĩa trang (Rot-), Rook's Weir (Mire-) | Người mới chết mặc vải liệm và áo chôn, hàm buộc vải, đồng xu còn trên mắt, bùn tới gối. Bản Rook's Weir là dân làng chết đuối, rong trong tóc, nước sông trào ra miệng | Chậm, vụng nhưng túm và giữ. Gõ nắp quan tài trước khi trỗi dậy, trồi lên từng đợt quanh hero | D1 Zombie; D3 Risen Dead | | [ ] |
| U02 | **Charnel Dead** · bậc: Charnel Dead → Charnel Guard → Ossuary Guard → Elder Charnel | Prologue: nghĩa trang · I: nghĩa trang · II: Bell Catacombs (mặc áo ca đoàn mục) | Bộ xương ráp từ xương lệch trong ossuary: sọ phụ nữ trên khung đàn ông, một tay dài hơn tay kia, đồ tùy táng mục làm giáp | Kiếm và khiên. Tự ráp lại một lần, trừ khi sọ bị đập vỡ | D1 Skeleton; D2 skeletons | Cast §12: vẫn lẩm bẩm Rite of Laying | [ ] |
| U03 | **Charnel Bowman** | I: nghĩa trang | Bộ xương lệch, cung gỗ thủy tùng, ống tên chứa đinh mộ gỉ | Thả diều ở tầm xa, đi theo cặp | D1/D2 skeleton archers | | [ ] |
| U04 | **Charnel Ghoul** | I: nghĩa trang | Xác gầy, tay dài, hàm há rộng quá mức, chạy bằng bốn chân | Nhanh, nhảy vồ. Ăn xác để hồi máu, "lấp chỗ trống mà linh hồn để lại" | D3/D4 ghouls | | [ ] |
| U05 | **The Swollen** | I: Night Fens, Rook's Weir, Willow Mere | Xác chết đuối ở đầm, phình xanh trắng, da căng như mặt trống, lươn ngọ nguậy bên dưới | Lừ đừ tiến tới rồi nổ, tung ra lươn độc biết cắn | D3 Grotesques; D4 bloated corpses | | [ ] |
| U06 | **Pall-Wight** | II: Pilgrim Road | Hiệp sĩ Pallbearer đã chết, giáp đen đóng đinh bạc, vẫn cõng quan tài | Chậm, giáp dày, đập khiên. Còn nửa máu thì nắp quan tài bật mở, thả dơi hoặc xác ra | D1 Black Knight | | [ ] |
| U07 | **Pyre-Risen** | II: Stair of Penitence, Cathedral đang cháy | Bộ xương cháy đen bọc lửa, xích chảy ra từ cọc thiêu còn lủng lẳng | Đốt cháy nền, nổ lửa khi chết. Nước và muối dập tắt được | D2 Burning Dead | LD §12.8 không liệt kê ở Cathedral cháy, Cast §4.7 có | [ ] |
| U08 | **Charnel Chanter** | II: Bell Catacombs, Scriptorium | Bộ xương mặc áo chùng mục, vẫn lẩm bẩm Rite of Laying | Bắn phép băng và lửa mộ từ hàng sau | D2 skeleton mages | Proposal của LD §12.6: chuông rung sẽ đánh thức chúng | [ ] |
| U09 | **Ossuary-Glutton** | II: Bell Catacombs · V: the Course | Xác phình dính liền với đống xương, có cái miệng thứ hai ở bụng | Ăn xác rồi phun mảnh xương | D2 Regurgitators, Corpse Spitters | | [ ] |
| U10 | **Wallshade** | II: Bell Catacombs · IV: Archive of Faces · V: Sunken Chapel, the Course | Linh hồn nửa thoát khỏi Tường, trong mờ, nhỏ giọt vữa, mặt căng như ép vào kính | Xuyên tường, hút tài nguyên của hero, lúc hiện lúc ẩn | D2 ghosts, wraiths | | [ ] |
| U11 | **Scribe-Shade** | II: Scriptorium | Wallshade của thầy chép sách xưa, đen như mực, tay còn cầm bút lông | Ném mực gây mù; "viết lại" nền dưới chân hero thành bẫy | D2 ghosts (biến thể) | Không có trong bảng họ ở Bible §14.2 | [ ] |
| U12 | **The Pressed** | II: Kneeling Vault (sau boss) · V: the Course | Hình người ghép từ nhiều thân bị ép như gạch, mặt và tay lộ ra hai bên sườn | Khối chậm và nặng, bò ra từ chỗ Tường vỡ. Bị phá thì thả Wallshade ra | D3 Unburied | Tên gần P17 the Preserved | [ ] |
| U13 | **Salted Dead** | III: Wreck Fields | Thủy thủ của vùng biển đã chết, quấn vải buồm và vỏ muối, mắt muối như thủy tinh | Chậm; thở ra nước muối gây ngạt | D2 mummies | | [ ] |
| U14 | **Brine-Embalmer** | III: Wreck Fields | Tu sĩ ướp muối cao lớn, quấn vải buồm cứng đã nứt | Dựng lại Salted Dead đã ngã; phun nước muối | D2 Greater Mummies | | [ ] |
| U15 | **Frostbound Host** | IV: Frozen Army | Lính đóng băng giữa bước chạy: da xanh băng, băng trong râu, vũ khí dính chặt vào tay | Đứng dậy lại sau khi bị giết, trừ khi bị đập vỡ bằng lửa hoặc tên được viết vào Book of Laid Names | D2 Reanimated Horde | LD §14.2: phần lớn lính đóng băng chỉ là đài tưởng niệm, chỉ vài con thoát ra | [ ] |
| U16 | **Wrack-Dead** | V: Wrack-Woods, Dawn Ship, Long Sands | Thủy thủ chết đuối phủ hà và rong, giáp làm từ ván thân tàu, vung neo và cột buồm | Sương kéo tới và còi sương mù vang lên trước khi chúng đến. Kéo hero lại bằng xích neo; vết thương gây thối | D4 Drowned | Cast §12: còi sương mù thay cho chuông của bản gốc | [ ] |

---

## 2. Discarded — "quỷ" đất nung (16)

- **Lore:** đây là "quỷ" của Ashlar: thợ đất nung mà Mason nung trong lò. Khi Mason phát hiện linh hồn người làm vữa tốt hơn, chúng bị vứt xuống Spoil. Chúng không có linh hồn và luôn thèm linh hồn (Bible §4.10).
- **Báo trước:** bay thợ hồ lách cách, giọng đếm gạch bằng tiếng Mason, cửa lò, tiếng vó (Kiln-Bull).
- **Ánh sáng:** ánh lò hắt ra từ trong vết nứt, phập phồng như ống bễ (LD §5.1).
- **Đọc silhouette bằng:** sừng.
- **Vai:** bầy D01 D11 · hồi sinh đồng loại D02 · lao D03 · rơi loot D04 · toán nhiều vai D05 D06 D07 D12 · buff đồng loại D08 · công thành D09 · bổ nhào D10 · nặng D13 D14 D16 · phép D15.

| ID | Quái | Act · khu | Thiết kế | Hành vi | Gốc Diablo | Cần xem | ✓ |
|---|---|---|---|---|---|---|---|
| D01 | **Hodling** · bậc: Hodling → Ember-Hod → Slag-Hod → Kiln-Hod | I: Flint Delvings · III: Old Salt Mine (tráng muối trắng) · IV: siege (tráng sương) | Yêu tinh đất nung đỏ gạch, cao tới gối, men nứt, sừng ngắn. Vũ khí làm từ bay thợ hồ, đinh, ngói đá. Lít nhít đếm gạch bằng tiếng Mason | Đi bầy, rít. Một con vỡ thì cả bầy hoảng chạy, rồi tụ lại | D1/D2/D4 Fallen | Bậc "Kiln-Hod" trùng tiền tố với D02, D03, D16. LD §11.8: đáng thương và nguy hiểm, không làm thành trò hề | [ ] |
| D02 | **Kiln-Shaman** | I, III, IV (đi cùng D01) | Hodling mặt đen muội, cõng nồi than bốc khói trên lưng | Nung lại Hodling đã vỡ; phun than hồng | D2/D4 Fallen Shamans | LD §11.8: silhouette phải nhận ra được nhờ cái nồi trên lưng và nhịp sáng phập phồng | [ ] |
| D03 | **Kiln-Bull** | I: Flint Delvings · IV: siege (húc cổng) | Gã sừng khổng lồ bằng đất nung, lỗ mũi phát sáng, được làm ra như một cái búa phá thành biết đi | Lao ra từ bóng tối; tiếng vó nghe thấy trước | D1 Horned Demon | | [ ] |
| D04 | **Tithe-Thief** | Mọi act, hiếm (lần đầu ở Flint Delvings) | Discarded nhỏ, béo, lảo đảo dưới bao tiền và đồ tùy táng ăn cắp của người chết | Chạy trốn vào khe Tường nếu không bắt kịp; chết thì tung loot | D3 Treasure Goblin (chỉ lấy phần rượt đuổi, không lấy portal và lore "Greed") | LD §7.7: luôn đặt khe thoát trong tầm nhìn để cuộc đuổi có đích | [ ] |
| D05 | **Hornclan — Cinder-Clan** · bậc: Raider → … → Breaker | II: Pilgrim Road | Discarded cỡ người, đầu dê chân dê, đất sét đen muội với vết nứt đỏ than. Sừng móc để kéo đá, vũ khí là cuốc thợ đá, khiên là máng gạch (hod), dấu tộc vẽ bằng tro | Đánh theo toán: Raider cận chiến, Slinger ném đá nóng, Chanter dùng phép lửa. Đánh hăng hơn khi ở gần lửa | D1 goat-demon clans; D2 Goatmen; D3/D4 Khazra | Các bậc giữa chưa có tên. Cast §12: tụng số đếm thay vì hô chiến | [ ] |
| D06 | **Hornclan — Salt-Clan** | III: Old Salt Mine | Thợ mỏ đầu dê, men trắng xương, sừng mòn vì cuốc muối | Raider và Slinger như D05; Chanter ném bụi muối gây mù | Goatmen, Khazra (D1–D4) | | [ ] |
| D07 | **Hornclan — Rime-Clan** | IV: Rimewood, siege (quân chủ lực của trận vây) | Người dê men xanh sương, băng treo trên sừng | Raider và Slinger như D05; Chanter dùng phép băng | D4 Khazra (dùng phép băng ở Fractured Peaks); D2 Goatmen | | [ ] |
| D08 | **Taskmaster** | IV: siege | Đốc công Discarded cao, roi xích, sổ cái xích ở thắt lưng | Quất bầy Discarded gần đó vào cơn cuồng (đánh nhanh hơn) và gào số đếm | D2 Overseers | | [ ] |
| D09 | **Hauler** | IV: siege | Thú thồ đất sét khổng lồ đeo ách giáp, Hodling ngồi trong kiệu trên lưng, kéo đá phá cổng | Đơn vị công thành; ngã xuống thì Hodling nhảy ra tràn tới | D2 Siege Beasts | | [ ] |
| D10 | **Gutter-Wing** | IV: siege · V: the Course | Discarded có cánh giống gargoyle, men xám như đá, đậu trên mái như tượng chạm | Bổ nhào từ mái xuống | D3 Winged Assassins, Demonic Hellflyers | Dáng trùng L03 Gargoyle Mortarer | [ ] |
| D11 | **Spark** | IV: siege · V: the Course | Yêu tinh tí hon nung dở, phát sáng, kêu lách tách | Dịch chuyển chớp nhoáng quanh hero, ném than | D2 Demon Imps | | [ ] |
| D12 | **Hornclan — Slag-Clan** | V: the Course (tầng sâu chạm Spoil) | Người dê men đen, có vết nứt nóng chảy | Chanter dùng phép lửa và độc | Goatmen, Khazra | | [ ] |
| D13 | **Mallet-Hod** | V: the Course | Discarded khổng lồ cầm vồ thợ đá to như cánh cửa | Đập đất, tạo sóng xung kích | D3 Mallet Lords | | [ ] |
| D14 | **Slag-Knight** | V: the Course | Discarded mặc giáp xỉ đã nguội, khe nứt vẫn còn rực | Chiến binh giáp nặng, có aura gây bỏng | D3 Morlu | | [ ] |
| D15 | **Mocker** | V: the Course | Discarded mặc lễ phục ăn cắp (mũ mitre, khăn stole), cầm sổ cái | Tụng Rite of Laying méo mó; dùng phép lửa, sét và nguyền | D1 Counselors | | [ ] |
| D16 | **Kiln-Lord** | V: the Course | Discarded cao lớn, ngực là lò nung, cánh bằng xỉ, sừng như ống khói | Elite nặng: thở lửa, quạt cánh. Xé linh hồn ra khỏi những đoạn Tường đang hỏng | D1 Balrogs; D2 Venom Lords, Pit Lords, Megademons | Cast §12: cửa lò ở ngực mở ra trước khi phun lửa | [ ] |

---

## 3. Warped — thú bị biến đổi (18)

- **Lore:** động vật bị biến đổi bởi nhà ngục (cell) nằm dưới vùng chúng sống (Bible §14.2).
- **Báo trước:** tiếng thú "hơi sai": tiếng hú mang bài ru, gai lách cách, tiếng cánh.
- **Vai:** bầy W01 W02 W08 W12 W18 · săn theo bầy W03 W17 · hút máu W04 · dụ, phép W05 · nặng W06 W16 · làm chậm, độc W07 · phục kích dưới đất W09 W15 · nhảy ra phục kích W11 · bổ nhào W10 · siết, phép W13 · phản đòn W14.

| ID | Quái | Act · khu | Thiết kế | Hành vi | Gốc Diablo | Cần xem | ✓ |
|---|---|---|---|---|---|---|---|
| W01 | **Mortar-Rat** | Prologue: Old Face, nghĩa trang · II: Scriptorium | Chuột trụi lông màu xám, to bằng con mèo, mọc gai bằng vữa đã vôi hóa vì gặm tường ossuary ấm | Đi bầy; lắc gai rồi bắn ra thành loạt | D2 Quill Rats | Cast §11.1 ghi có ở Act I, nhưng không khu nào của Act I liệt kê | [ ] |
| W02 | **Gibbet-Crow** | I: nghĩa trang · II: Pilgrim Road, Stair of Penitence (ăn ở giàn thiêu) | Quạ ăn xác quá cỡ, đầu hói màu hồng, lông bết hắc ín từ giá treo cổ | Bổ nhào theo đàn, mổ, rút lui, rồi quay lại | D2 Carrion Birds | | [ ] |
| W03 | **Hush-Wolf** | I: Night Fens, Poppy Reach | Người mắc bệnh Hush mơ mình là sói tới khi thân xác làm theo: sói nửa người lêu khêu, mắt luôn nhắm, áo ngủ rách trên lưng | Săn theo mùi, theo bầy; tiếng hú là bài hát ru | D4 Werewolves | Là người biến hình nhưng xếp vào họ động vật | [ ] |
| W04 | **Mire-Sucker** | I: Night Fens | Ruồi hút máu phình to bằng con mèo, bụng đỏ căng | Bay vào hút máu, no thì nổ | D2 Suckers, Feeders (Act III) | | [ ] |
| W05 | **Corpse-Candle** | I: Night Fens, Rook's Weir, Willow Mere · V: Wrack-Woods | Ngọn lửa nhạt lơ lửng trên mặt nước, trong mỗi ngọn có một khuôn mặt mờ | Trôi và dụ; phóng sét, hút tài nguyên của hero | D2 Gloams, wisps | Không phải động vật. LD §11.4: ánh sáng đứng yên và đẹp, vì là mồi | [ ] |
| W06 | **Willow-Hulk** | I: Willow Mere | Khối to lớn bằng rễ liễu, than bùn và xương người chết đuối, cổ còn quấn dây thòng lọng | Đấm chậm và nặng; rễ trồi lên dưới chân hero | D2 Thorned Hulks; D3/D4 Wood Wraiths | Rễ cây và xương, không phải động vật. LD §11.7: thòng lọng treo cao, không dựng xác treo | [ ] |
| W07 | **Shroud-Spinner** | I: Flint Delvings, Garden of Hush | Nhện nhạt màu, quấn xác bằng tơ như vải liệm | Mạng nhện làm chậm; độc; đẻ túi trứng trong xác | D2 spiders (Act III); D1 Hellfire's Hive | LD §8.4: cần tùy chọn cho người sợ nhện | [ ] |
| W08 | **Bell-Bat** | II: Bell Catacombs | Dơi lớn đậu trong tháp chuông, tiếng rít vang như chuông nứt | Đi bầy; tiếng rít làm choáng ngắn | D2 bats; D1 Hellfire's Crypt bats | | [ ] |
| W09 | **Brine-Worm** | III: White Road | Giun muối khổng lồ nhạt màu, miệng tròn với nhiều vòng răng như thủy tinh. Con mẹ đẻ ổ trứng trong muối, nở ra giun con | Đào hang và phục kích; phun nước muối | D2 Sand Maggots, Maggot Queens | Có hai dạng: con mẹ và giun con | [ ] |
| W10 | **Salt-Kite** | III: White Road | Kền kền bạc màu, muối đóng trên cánh | Lượn vòng rồi bổ xuống con mồi bị thương | D2 Carrion Birds; D3 Vultures | | [ ] |
| W11 | **Pillar-Crab** | III: White Road, Garden of Pillars | Ốc mượn hồn (hermit crab) khổng lồ, dùng người bị hóa muối làm vỏ | Nhảy ra phục kích. Vỏ muối vỡ thì một brine-wraith (P12) thoát ra | D2 Sand Leapers (lấy kiểu phục kích, dáng là thiết kế mới) | LD §13.7: không có trẻ em trong các cột muối | [ ] |
| W12 | **Glass Wasp** | III: White Road, Old Salt Mine | Ong bắp cày bằng thủy tinh muối trong suốt, làm tổ trong thân tàu mắc cạn | Bay thành bầy đốt | D3 Sand Wasps | | [ ] |
| W13 | **Coilborn** (+ Coil-Seer) | III: Wreck Fields, Ship's Heart | Người-lươn còn sót lại khi biển chết: vảy trơn, vây, mắt không mí, nấp trong khoang đáy tàu. Coil-Seer cầm gậy san hô | Siết và cắn; Coil-Seer dùng phép nước muối | D2 Claw Vipers, Serpent Magi; hơi giống D4 Nangari | Cast: tránh kiểu tay chân gắn trên thân rắn của D4 | [ ] |
| W14 | **Static Scarab** | III: Wreck Fields, Ship's Heart | Bọ cánh cứng vỏ pha lê, tích điện | Phóng sét khi bị đánh | D2 Dung Soldiers, Scarab Demons | | [ ] |
| W15 | **Salt-Burrower** | III: Old Salt Mine | Thú đào hang, mù, mõm như cái xẻng | Trồi lên từ dưới chân hero | D3 Scavengers | | [ ] |
| W16 | **Rime-Brute** | IV: Frozen Army, Rimewood | Vượn khổng lồ lông trắng phương bắc, đeo xác đóng băng làm chiến lợi phẩm | Đập phá và ném khối băng | D2 Wendigo, Yeti, Sasquatch | | [ ] |
| W17 | **Grave-Wolf** | IV: Frozen Army, Rimewood | Sói gầy, lông đóng sương, béo lên nhờ ăn xác đông lạnh | Săn theo bầy | D4 wolves; D2 Jackals | | [ ] |
| W18 | **Wreck-Gull** | V: cliffs and lighthouses | Mòng biển lớn, mỏ đỏ vì ăn người chết đuối | Bổ nhào theo đàn | D2 Carrion Birds | | [ ] |

---

## 4. Faithful — giáo phái và binh lính (17)

- **Lore:** giáo phái và binh lính loài người (Bible §14.2).
- **Báo trước:** giọng người: lời cầu, thánh ca, mệnh lệnh, tín đồ ngân nga bài thánh ca của act (LD §6.5).
- **Vai:** chạy trốn F01 · phép, hồi máu F02 · tầm xa, làm mù F03 · bầy F04 · xung phong F05 · hỗ trợ F06 F17 · cuồng tín F07 · elite F08 · lính thường F09 F12 · đánh rồi chạy F10 · đòn xoay F11 · gỡ buff F13 · phép máu F14 · silence F15 · phục kích F16.
- **Đồng minh, không đánh:** Pallbearers và reformers (người của Ignatia) chiến đấu cùng hero ở Long Sands (Cast §7.7).

| ID | Quái | Act · khu | Thiết kế | Hành vi | Gốc Diablo | Cần xem | ✓ |
|---|---|---|---|---|---|---|---|
| F01 | **Body-snatcher** | I: nghĩa trang (side quest *The Mortsafe Thieves*) | Đàn ông mặc áo khoác sẫm, mang bao, dây thừng và xẻng ngắn | Chạy khi bị phát hiện; bị dồn vào góc thì đánh bẩn | Original | | [ ] |
| F02 | **Poppy Nurse** | I: Poppy Reach, Garden of Hush | Nữ tu đội khăn trùm trắng thêu hoa anh túc đỏ, cầm kim bạc dài | Caster và healer: ru hero ngủ trong chốc lát, chữa cho quái khác | Vai của dark cultist casters (D3); dáng là thiết kế mới | Bible §6.3 xếp là spawn của Eleisa (Perfection-born). LD §11.6: không được trông ác; dịu dàng, biết hát | [ ] |
| F03 | **Exhumer** (đội tuần tra thù địch) | II: Pilgrim Road | Áo khoác vải dầu xám, mũ rộng vành, đèn lồng có chụp, xẻng lưỡi dài, nỏ | Chớp đèn làm mù rồi áp sát; dùng nỏ ở tầm xa | Original (cảm giác bị một hội truy đuổi gợi D2 Corrupt Rogues) | Trùng tên với class Exhumer và hội của Ignatia | [ ] |
| F04 | **Kneeler** | II: Stair of Penitence, Cathedral đang cháy | Người sám hối mặc bao bố, đầu gối đã liền vào phiến đá họ kéo theo, hào quang sắt tán vào da đầu | Bò nhanh đáng sợ, đi thành bầy; xoay người chậm | D2 Zakarum Zealots (bầy cuồng tín); dáng là thiết kế mới | Cast ghi hai họ "Faithful / Perfection-born" và trùng tên với P08. LD §8.5: hình ảnh tự hại | [ ] |
| F05 | **Bell-Head** | II: Stair of Penitence, Cathedral đang cháy | Kẻ cuồng tín bị tán chuông nhà thờ trùm kín đầu, khe mắt cắt trên đồng | Xung phong theo hàng, chuông kêu vang; trúng đòn thì bị choáng | D1 Horned Demons (kiểu xung phong); dáng là thiết kế mới | Bible §6.4 xếp là spawn của Latreus | [ ] |
| F06 | **Censer-Bearer** | II: Stair of Penitence, Cathedral đang cháy, Kneeling Vault | Tu sĩ mặc áo lễ đen, vung lư hương sắt đốt mỡ động vật | Chữa cho Kneeler gần đó; đánh dấu hero là "kẻ nghi ngờ" để hero nhận thêm sát thương | D2 Zakarum Priests | Bible §6.4 xếp là spawn của Latreus. LD §12.8, §12.9 không liệt kê ở Cathedral cháy và Kneeling Vault | [ ] |
| F07 | **Turned Exhumer** | II: Stair of Penitence | Exhumer đã theo phe Kneeler, hào quang sắt kẹp trên mũ | Như Exhumer nhưng cuồng tín, không bao giờ rút lui | D2 Corrupt Rogues | LD §12.8 đưa vào Cathedral cháy, Cast §4.7 không có | [ ] |
| F08 | **Halo Knight** | II: Chancery, Cathedral đang cháy, Kneeling Vault | Hiệp sĩ giáp tấm quấn xích dưới áo choàng trắng, đội hào quang sắt có gai quay vào da đầu | Elite cận chiến; cú đập lan ra lửa thánh; không bao giờ nao núng | D1 Black/Blood Knights; D4 Knights Penitent | Bible §6.4 xếp là spawn của Latreus. Cast: không dùng bộ giáp gai sám hối của D4; hào quang gai hướng vào trong là dấu hiệu riêng | [ ] |
| F09 | **Chancery Guard** | II: Chancery | Lính gác cầm kích, sổ cái xích ở thắt lưng | Lính thường | Original | Không có trong bảng họ ở Bible §14.2 | [ ] |
| F10 | **Salt Reaver** | III: White Road | Cướp sa mạc quấn vải trắng đóng muối, mặt giấu sau mặt nạ thủy tinh | Đánh rồi chạy bằng dao tẩm nước muối độc | D2 Sand Raiders | | [ ] |
| F11 | **Salt-Dervish** | III: White Road | Vũ công của Salt Synod, xoay tròn với lưỡi cong giữa bão muối | Đòn xoay diện rộng; khó thấy khi ở trong bão | D3 Dune Dervishes | | [ ] |
| F12 | **White Watch soldier** (+ elite) | III: Undercity, Lye Baths · White Spire (bản elite) | Giáp sơn mài trắng không hở chút da, kính che mặt bằng thủy tinh | Hàng giáo kỷ luật; đột kích Undercity | Original | Bản elite có giáp đẹp hơn | [ ] |
| F13 | **Lye Priest** | III: Undercity, Lye Baths, White Spire | Tu sĩ mặc áo choàng, tay bỏng kiềm, đeo mặt nạ sứ trắng | Caster axit; "thanh tẩy" hero bằng cách gỡ buff | Vai của dark cultist casters (D3) | Bible §6.5 xếp là spawn của Kathara | [ ] |
| F14 | **Night-Courtier** | IV: Stillroom | Quý tộc được bảo quản trong y phục lộng lẫy đang mục, da tái, môi khô đen. Uống máu để giữ trí nhớ | Phép máu; tan thành bầy dơi | D2, D4 vampires | Là người chết được bảo quản (gần P17) nhưng lại xếp Faithful | [ ] |
| F15 | **Remembrancer** | IV: Archive of Faces | Thủ thư áo xám, đeo kính một mắt, mang lọ mẫu vật | Nhốt kỹ năng của hero vào lọ (silence) | Original | | [ ] |
| F16 | **Wrecker** | V: cliffs and lighthouses | Cướp bờ biển mặc áo tẩm hắc ín, cầm mã tấu, sào móc thuyền, cột treo đèn | Dụ tàu vào đá bằng đèn giả; phục kích theo nhóm | D4 bandits | | [ ] |
| F17 | **Lamplighter cultist** | V: Sunken Chapel | Tín đồ mặc áo choàng xám màu biển, cầm cột đèn dài | Thắp đèn làm mạnh thêm the Waiting ở gần | Vai của cultists (D4) | Tên dễ lẫn với mid-boss B15 The Lamplighter | [ ] |

---

## 5. Perfection-born — con đẻ của 5 Perfection (27)

- **Lore:** con đẻ của từng Perfection, phần lớn là thiết kế gốc của ASHLAR (Bible §14.2).
- **Báo trước bằng chữ ký âm thanh:** bài ru nhịp 3/4 (Mercy), chuông (Devotion), muối kết tinh lách tách rồi im lặng (Purity), tên thì thầm và hộp nhạc (Memory), còi sương mù (Hope).
- **Đọc silhouette bằng chất liệu của Perfection:** vải lanh, sắt, thủy tinh muối, lọ thủy tinh, đèn lồng (LD §8.1).
- **Ánh sáng** của Perfection đứng yên, không lập lòe (LD §5.1).
- **Cách giới thiệu:** mỗi act đưa họ này ra theo 3 bước: nghe thấy trước, thấy thoáng qua, rồi mới phải đánh (LD §7.7).

### Mercy — Eleisa (Act I)

| ID | Quái | Act · khu | Thiết kế | Hành vi | Gốc Diablo | Cần xem | ✓ |
|---|---|---|---|---|---|---|---|
| P01 | **The Soothed** | I: Night Fens, Garden of Hush, Cradle | Người mộng du mặc áo ngủ, mắt nhắm, miệng bị khâu thành nụ cười hiền | Đi về phía hero và ngân nga; chạm tới thì ôm và gây mê (chậm rồi choáng). Nhanh hơn khi bài ru vang lên | Original | LD §11.4: đây là nạn nhân. Proposal: chết thì ngủ thiếp đi, không có máu, tiếng ngân tắt dần từng giọng | [ ] |
| P02 | **Hush-Herald** | I: Poppy Reach | Hình người cao, trùm mạng, vung lư hương khói anh túc, áo thêu những con mắt nhắm | Tỏa mây ngủ gây chậm và buồn ngủ; tăng sức cho Soothed ở gần | D3 Heralds of Pestilence | | [ ] |
| P03 | **Hush-Moths** | I: Poppy Reach, Garden of Hush, Cradle | Bầy bướm đêm nhạt màu, cánh mềm | Bụi cánh làm mắt nặng trĩu (chậm) | Bầy côn trùng Act II của D2 (chỉ lấy hành vi) | | [ ] |
| P04 | **Hive-Sleeper** | I: Poppy Reach | Thân người đang ngủ phình lên vì ấu trùng bướm ngọ nguậy dưới da | Lê tới rồi vỡ ra thành bầy Hush-Moth | D4 Fly Hosts, Spider Hosts | LD §8.4: cần tùy chọn giảm cảnh ấu trùng bò | [ ] |
| P05 | **Wet-Nurse** (+ Swaddlings) | I: Garden of Hush, Cradle | Xác hộ lý phình to mặc tạp dề ố, ôm những bọc vải lanh | Đặt bọc xuống thì bọc bò đi: Swaddlings là những thứ nhỏ làm bằng vải lanh và xương, lao vào hero | D2 Vile Mothers, Vile Children; D3 Wretched Mothers | Swaddlings phải trông rõ là bọc vải và xương, không giống trẻ sơ sinh (LD §8.5: không gore trên trẻ em) | [ ] |
| P06 | **Poppy-Mound** | I: Garden of Hush | Gò thịt do nhiều người ngủ mọc dính vào nhau, nở đầy hoa anh túc | Spawner đứng yên; thả Hush-Moth ra cho tới khi bị phá | D2 Flesh Spawners; D3 Fleshpitters | | [ ] |
| P07 | **Cradle-Warden** | I: Cradle | Người canh khâu bằng vải, khổng lồ, cõng nôi lồng trên lưng, đầu không mặt đội mũ trẻ con | Bruiser nặng; túm lấy hero và "đu đưa" (choáng) | Original | Dáng trùng boss B02 Lullaby Man | [ ] |

### Devotion — Latreus (Act II)

| ID | Quái | Act · khu | Thiết kế | Hành vi | Gốc Diablo | Cần xem | ✓ |
|---|---|---|---|---|---|---|---|
| P08 | **Kneeler** (người chết quỳ) | II: Kneeling Vault | Người thờ phụng đã chết, đứng dậy cứng đờ khỏi hàng ghế mà vẫn quỳ gối | Như Kneeler ngoài phố (F04) | D2 Zealots (hành vi) | Trùng tên F04; đề xuất đổi thành "the Kneeling Dead" | [ ] |
| P09 | **Chain-Hung** | II: Kneeling Vault | Người sám hối treo lơ lửng trên xích của mái vòm bằng móc xuyên lưng | Rơi xuống và đu theo xích để đánh hero | Original | LD §8.5: hình ảnh tự hại | [ ] |

Hai boss của Devotion là B06 The Choir of Nails và B07 Brother Cassian.

### Purity — Kathara (Act III)

| ID | Quái | Act · khu | Thiết kế | Hành vi | Gốc Diablo | Cần xem | ✓ |
|---|---|---|---|---|---|---|---|
| P10 | **The Blanched** | III: Lye Baths, Garden of Pillars, Salt Cell | Người bị cọ rửa tới mức không còn da, tóc hay nét mặt: trắng hồng và bóng ướt | Nhanh, mỏng manh, lì lợm, nhảy vồ, không đánh tầm xa | D4 Cannibals (chỉ hành vi) | Cast tả "bóng ướt", LD §13.6 nói "nhẵn như sáp, không gore": cần chọn một | [ ] |
| P11 | **Brine Leech** | III: Lye Baths | Đỉa trong suốt sống trong các bể | Bám vào người và hòa tan giáp | Original | | [ ] |
| P12 | **Salt Pillar** (+ brine-wraith) | III: Garden of Pillars, Salt Cell | Tội nhân bị hóa cột muối. Khi cột nứt, hình người trong mờ bằng nước muối vừa than khóc vừa tràn ra | Là bẫy, nổ khi hero đi ngang; wraith đuổi theo và làm lạnh | Original; wraith gợi D2 wraiths | LD §13.7: cột sắp nứt có đường nứt màu teal phát sáng, để khỏi lẫn với vật trang trí | [ ] |
| P13 | **Halcyon Glass-Folk** | III: Ship's Heart | Tượng người dân Halcyon bằng muối-thủy tinh, đang mỉm cười | Di chuyển đồng bộ hoàn hảo; vỡ thành mảnh sắc. Là điềm báo cho the Perfect (X01) | Original | | [ ] |
| P14 | **Halcyon Sentinel** | III: Ship's Heart | Cấu trúc canh gác bằng pha lê, đứng ở bàn thờ cổ | Chậm, giáp rất dày, tấn công bằng tia | Hơi giống D4 Constructs | | [ ] |
| P15 | **Crystal-Sworn** | III: White Spire, Salt Cell | Hiệp sĩ làm bằng thủy tinh muối sáng như gương | Phản lại đạn; phải đập nứt bằng đòn nặng | Original | | [ ] |

### Memory — Mnemora (Act IV)

| ID | Quái | Act · khu | Thiết kế | Hành vi | Gốc Diablo | Cần xem | ✓ |
|---|---|---|---|---|---|---|---|
| P16 | **Ice-Mourner** | IV: Frozen Army | Hình người trùm mạng làm bằng băng, khóc ra nước mắt đóng băng ngay khi rơi | Caster chậm; nước mắt làm nền và hero đóng băng | Original | | [ ] |
| P17 | **The Preserved** | IV: Stillroom, Unforgetting Deep | Người chết được nhồi xác, mặc y phục đẹp nhất, mắt thủy tinh, cử động bằng dây treo từ trần | Bắt chước cử chỉ người sống; đánh bằng kỹ năng lúc còn sống | Original | Tên gần U12 the Pressed. Proposal của LD §14.5: trong giá lạnh người sống thở ra hơi, người được bảo quản thì không | [ ] |
| P18 | **Keepsake Doll** | IV: Stillroom | Búp bê tí hon nhồi tóc người chết, mắt là cúc áo | Chạy tới hero rồi nổ thành mảnh ký ức gây rối loạn | D2 Undead Stygian Dolls, Soul Killers | | [ ] |
| P19 | **Facewearer** | IV: Stillroom, Unforgetting Deep | Kẻ bắt chước, đeo mặt những người hero đã gặp, kể cả người đã chết | Tiếp cận như bạn rồi đánh | Original | Cần hệ thống thay mặt theo các NPC hero đã gặp, tốn chi phí sản xuất | [ ] |
| P20 | **Faceling** (+ Faceling Hag) | IV: Archive of Faces | Sinh vật tí hon đeo mặt người được bảo quản làm mặt nạ, cầm ống thổi. Faceling Hag mang lọ lửa lạnh | Đi bầy; phi tiêu "quên" đẩy kỹ năng của hero vào cooldown. Hag thở lửa băng và đeo lại mặt nạ cho Faceling đã ngã | D2 Fetishes (Flayers), Fetish Shamans | | [ ] |
| P21 | **Jar-Thing** | IV: Archive of Faces, Unforgetting Deep | Thân dựng từ các lọ mẫu vật chồng lên nhau, mỗi lọ chứa một khuôn mặt hoặc một nội tạng | Gọi Faceling ra; vỡ thành thủy tinh bay tứ tung | Original | | [ ] |
| P22 | **The Unremembered** | IV: Archive of Faces, Unforgetting Deep | Những thứ bị quên triệt để tới mức không ai nhìn thấy | Rình rập trong trạng thái tàng hình; chỉ hiện ra trong ánh lửa hoặc khi tên chúng được đọc to | D1 Hidden, Illusion Weavers | Vô hình nên cần quy ước hiển thị cho art và QA. Proposal của LD §14.8: mở lọ sẽ đánh thức chúng | [ ] |

Các boss của Memory là B11 The Glass Stag, B13 The Taxidermist và B14 The Cabinet.

### Hope — Elpis (Act V)

| ID | Quái | Act · khu | Thiết kế | Hành vi | Gốc Diablo | Cần xem | ✓ |
|---|---|---|---|---|---|---|---|
| P23 | **Beckoner** (+ Lamp-Witch) | V: cliffs, Dawn Ship, Ebbmount Abbey | Phụ nữ có cánh, đẹp nhợt nhạt và ướt át, mang mặt người mà bạn đang chờ; cánh là cánh buồm rách. Bậc trên là Lamp-Witch, cầm đèn thắp bằng máu | Mê hoặc kéo hero lại gần rồi hút; Lamp-Witch dùng phép máu | D1/D2 Succubi; D2 Blood Witches | Thuộc archetype succubus. Brief Dying Gods chỉ cấm trang phục gợi dục cho họ Forsworn; có áp dụng cho con này không? Cast §12: mang mặt người mà hero hoặc đồng hành đang chờ | [ ] |
| P24 | **Lantern-Lure** | V: cliffs, Ebbmount Abbey | Hình người có cái mồi như cá cần câu mọc ra từ trán, đầu mồi có ánh sáng dịu | Ánh sáng kéo hero lại gần, rồi hàm đớp | Original | Dáng gần boss B15 Lamplighter | [ ] |
| P25 | **Sunken Pilgrim** | V: Wrack-Woods, Sunken Chapel, Long Sands | Người hành hương chết đuối trong áo choàng ướt nặng trĩu, đá vẫn còn buộc ở cổ chân | Đi thành đoàn rước, hát thánh ca; túm hero kéo về phía nước sâu | Original | | [ ] |
| P26 | **The Waiting** | V: Wrackhaven, Sunken Chapel, Dawn Ship, Long Sands | Da bọc xương, mắt nhìn trừng trừng không chớp, đứng ở cửa sổ nhìn ra biển | Ban ngày vô hại. Ban đêm thức dậy khi có người đi qua, nhảy vồ nhanh khác thường, không đánh tầm xa. Bị ánh sáng thu hút | D4 Cannibals (chỉ hành vi) | Cần hai trạng thái: dân thị trấn ban ngày, quái ban đêm | [ ] |
| P27 | **The Promised** | V: Wrackhaven ban đêm, Long Sands, Ebbmount Abbey | Những thứ bước ra từ biển mang mặt người chết đuối: bản sao hoàn hảo cho tới khi lại gần, nói thì nước chảy ra từ miệng | Gõ cửa; giả làm dân thị trấn hoặc đồng minh rồi đánh | Original | | [ ] |

---

## 6. Lodge's servants — tay sai của Mason (4)

- **Lore:** cấu trúc do Mason làm ra. Mason không vào hẳn được thế giới nên hành động qua các bức tượng (Bible §4.3).
- **Báo trước:** đá nghiến, tiếng đục *tock*, và nhạc tắt hẳn (LD §6.4–6.5).
- **Ánh sáng:** đồ của Mason không bao giờ phát sáng.
- **Dáng:** góc vuông, đường thẳng đứng như dây dọi, không trang trí, mọi thứ hơi quá cỡ (LD §4.1).

Bản thân các Mason (Plumb, Square, Trowel, Level) là nhân vật, không phải quái. Mason duy nhất phải đánh là the Chisel (B09).

| ID | Quái | Act · khu | Thiết kế | Hành vi | Gốc Diablo | Cần xem | ✓ |
|---|---|---|---|---|---|---|---|
| L01 | **Saint-Statue** | Mọi nhà thờ, mọi act; lần đầu là quái ở Chancery (II) | Tượng Nameless Saint không mặt, to hơn người thật 10–15% (LD §4.2), tay đỡ một vòm | Chỉ di chuyển khi không ai nhìn | Original | Xem mục 7 ở phần việc cần chốt. Sau đoạn kết, mọi tượng cần biến thể mang mặt hero (LD §9.6) | [ ] |
| L02 | **Plumb-Hound** | Từ II (Chancery) trở đi, đi theo hero ở mọi act | Chó săn bằng đá xám, treo trên dây dọi kéo thẳng lên hư không, đu về phía hero | Bám theo không buông, không cắt đuôi được, gọi các tay sai khác tới | Original | | [ ] |
| L03 | **Gargoyle Mortarer** | Từ II trở đi, trên mái nhà | Gargoyle đá ngồi xổm trên mái | Phun vữa đông cứng nhanh, trói chân hero (root) | Original | Dáng trùng D10 Gutter-Wing | [ ] |
| L04 | **Course-Warden** | V: Long Sands (không đánh hero), the Course (thù địch) | Hình người bằng đá xám trùm mũ, cầm lưỡi bay thợ hồ dài như lưỡi hái | Ở Long Sands chém the Promised và bỏ qua hero. Trong the Course thì chặn mọi kẻ xâm nhập, và người sống chính là kẻ xâm nhập | D3 Reapers, Death Maidens | Cần hai trạng thái AI | [ ] |

---

## 7. The Perfect (1)

| ID | Quái | Act · khu | Thiết kế | Hành vi | Gốc Diablo | Cần xem | ✓ |
|---|---|---|---|---|---|---|---|
| X01 | **The Perfect** | V: the Seamless | Hình người trắng hoàn hảo, không mặt, di chuyển đồng bộ | Không đánh; tiến lại gần và "chữa lành" hero bằng cách hút mất cái bóng của họ | Original | Báo trước bằng im lặng | [ ] |

---

## 8. Boss (17)

Theo Cast §9. Bible §14.3 không có B04 và B11.

| ID | Boss | Act · khu | Loại · họ | Thiết kế → cơ chế | Câu thoại | Cần xem | ✓ |
|---|---|---|---|---|---|---|---|
| B01 | **The Sexton's Dog** | Prologue: nghĩa trang | Mini-boss · Unlaid | Chó ngao già của Gennet, chôn từ mùa đông trước, sống lại với vòng cổ rách và móc treo đèn vẫn quanh cổ → vồ và kéo, dùng để dạy né. Khi nó chết, Gennet làm Rite of Laying lần đầu | — | Chưa có trong lời kể Prologue (Bible §11.2). Là động vật nhưng xếp Unlaid, trong khi Tường chỉ nhận linh hồn người. LD §10.2: trận dễ, chỉ để dạy né | [ ] |
| B02 | **The Lullaby Man** | I: Night Fens | Mid-boss · Perfection-born (Mercy) | "Hộ lý" cao lớn khâu bằng vải chắp và bông nhồi, cõng nôi lồng chứa người đang ngủ → nghe thấy từ rất lâu trước khi thấy; đánh trúng cái nôi thì người ngủ bên trong chết | (ngân nga) | Dáng trùng P07. Proposal của LD §11.4: cú chạm đầu tiên vào nôi chỉ làm người ngủ kêu lên, chưa ai chết | [ ] |
| B03 | **The Ember-Pot** | I: Flint Delvings | Mini-boss tùy chọn · Discarded | Kiln-Shaman phình to, kéo theo nồi than to bằng xe bò → nung lại mọi Hodling xung quanh; phải đập nồi trước | (đếm gạch, ngày càng nhanh) | | [ ] |
| B04 | **The Willow Bride** | I: Willow Mere (side quest) | Side boss · chưa có họ | Cô dâu chết đuối trong mạng che mặt đã mục, tóc mọc vào rễ liễu → tấn công bất cứ ai đi ngang. Khi được an nghỉ, cô nói câu cuối và sau đó không còn gì tấn công nữa | "Tell him I stopped waiting." | Cast để cô ở bảng nhân vật, chưa gán họ (Unlaid?) | [ ] |
| B05 | **The Hospice Mother** | I: Cradle | Act boss · Perfection-born (Mercy) | Mother Hawise hóa thành hình trùm mạng khổng lồ bằng vải lanh với hàng chục bàn tay trắng mềm → bài ru làm màn hình tối dần và hero chậm lại; các bàn tay cố "đắp chăn" cho hero; đèn ngủ tắt dần từng ngọn | "Hush now. It was never worth the pain." | LD §8.3, §11.12: màn hình tối nhưng có mức sáng tối thiểu; giới hạn số tay đánh cùng lúc; tay đổ bóng xuống sàn để làm telegraph | [ ] |
| B06 | **The Choir of Nails** | II: Bell Catacombs | Mid-boss · Perfection-born (Devotion) | Mười hai ca viên Kneeler hợp thành một cây đàn organ biết hát, làm bằng thịt, ống và đinh sắt → phải làm im từng giọng một | "HOLD… FAST… HOLD… FAST…" | Motif gần High Council (D2), thiết kế khác hẳn | [ ] |
| B07 | **Brother Cassian, the Kneeling Saint** | II: Kneeling Vault | Act boss · Perfection-born (Devotion) | Ông già gầy, đôi chân đã thành rễ đá, đội hào quang gai sắt của Latreus → tự xé mình ra khỏi sàn; lệnh "KNEEL" khóa di chuyển, phá bằng kỹ năng Doubt | "Doubt is the only sin!" | | [ ] |
| B08 | **The Pillar-Maker** | III: Garden of Pillars | Mid-boss · Perfection-born (Purity) | Hình người cao, không mặt, mặc áo lễ đóng muối → chạm vào là hóa muối; mỗi cột nó tạo ra thành bẫy, nên arena đầy dần | "Hold still." | | [ ] |
| B09 | **The Chisel** | III: Old Salt Mine | Boss · Mason | Người khổng lồ bằng đá, cánh là trụ chống bay (flying buttress), lưỡi như cái đục thợ đá → cắt bỏ mọi thứ "lệch chuẩn", kể cả từng mảng arena. Khi vỡ, nó nói ra Luật 6 | "A forced stone does not hold." | Không thuộc 7 họ. Proposal của LD §13.8: một dây phấn bật ngang sàn trước mỗi nhát cắt làm telegraph | [ ] |
| B10 | **Kathara, the White Fire** | III: Salt Cell | Act boss · Perfection-born (Purity) | Hình khổng lồ đối xứng hoàn hảo bằng muối-thủy tinh và lửa không màu, Arsham nằm ở tim → Blemish: đòn của hero để lại vết nứt và sự hoàn hảo vỡ theo vết nứt; phải phá mà không giết người bên trong | "This is the part where you become beautiful." | Ở các act khác boss là người làm vật chứa, act này boss là chính Perfection. LD §13.11: luôn thấy bóng Arsham ở tâm | [ ] |
| B11 | **The Glass Stag** | IV: Rimewood | Elite · Perfection-born (Memory) | Hươu khổng lồ được bảo quản, lồng ngực là hộp thánh tích bằng thủy tinh đầy lọ, gạc treo những mặt dây chuyền → húc; mỗi mặt dây chuyền rơi ra thả một ký ức làm hero rối loạn | — | LD §14.3: phải đẹp trước, đáng sợ sau | [ ] |
| B12 | **The Hod-Mother** | IV: siege of Vesnagrad | Mid-boss · Discarded | Lò nung sống trên đôi chân ngắn, do Hauler kéo, cửa bụng phát sáng → bắn Hodling mới ra từ bụng; cắt dây kéo của Hauler để chặn nó | (tiếng cửa lò gầm) | | [ ] |
| B13 | **The Taxidermist** | IV: Stillroom | Mid-boss · Perfection-born (Memory) | Thứ nhiều tay làm bằng kim và mắt thủy tinh, đeo mặt các "tác phẩm" của nó → đánh cắp đòn của hero và "tạo dáng" chúng | "Hold that expression. Lovely." | Proposal của LD §14.7: đòn cuối của hero hóa thành tượng nằm lại trong arena; nếu làm thì cần giới hạn số tượng tồn tại cùng lúc | [ ] |
| B14 | **The Cabinet** | IV: Unforgetting Deep | Act boss · Perfection-born (Memory) | Radomir hợp nhất với Mnemora: thân cao ngất bằng ngăn kéo và lọ, gia đình được bảo quản của ông cử động như rối quanh nó → gọi ký ức của Hospice Mother, Cassian, Kathara và nói bằng giọng Gennet; thắng bằng cách buông bỏ từng ký ức | "Stay. Stay exactly like this." | LD §14.9: ký ức chỉ là đoạn ngắn, không biến thành boss rush | [ ] |
| B15 | **The Lamplighter** | V: Sunken Chapel | Mid-boss · Perfection-born (Hope) | Khổng lồ khom lưng, đèn treo trên cuống như cá biển sâu → ánh đèn cho mỗi người thấy thứ họ mong quay lại; hero thấy Gennet còn sống | "Look. They've come home." | Trùng tên với F17 và cả giáo phái; dáng gần P24 | [ ] |
| B16 | **Severin, the Lamp-Bearer** | V: Ebbmount, sảnh tiệc | Act boss · Perfection-born (Hope) | Severin bị Elpis chiếm xác: hình người cao vút, đầu là ngọn đèn trắng → light radius đảo ngược: nền sáng thì gây bỏng, bóng tối che chở; mỗi đòn đánh là một "hy vọng"; thắng bằng cách dập từng ngọn đèn trong sảnh tiệc | "Not yet. Not yet." | LD §15.9: phải dạy luật đảo ngược trước khi bắt người chơi dùng | [ ] |
| B17 | **The Unbroken, the Seamless Dawn** | V: the Seamless | Final boss · chưa có họ | Lúc đầu nói bằng năm giọng, rồi giọng Severin, rồi giọng chính hero. Cuối cùng hiện ra là tượng Nameless Saint mang mặt hero → 5 pha, mỗi pha một Perfection; ánh sáng giết, bóng tối che chở; đòn cuối là một lựa chọn bằng một nút bấm duy nhất | "Stay. Be whole. Be finished." | | [ ] |

---

## 9. Đội hình theo act

| Act | Quái thường | Boss |
|---|---|---|
| Prologue | U01, U02 · W01 | B01 |
| I | U01–U05 · W02–W07 · F01, F02 · P01–P07 · D01–D04 | B02, B03, B04, B05 |
| II | U02, U06–U12 · W01, W02, W08 · D05 · F03–F09 · P08, P09 · L01–L03 | B06, B07 |
| III | U13, U14 · W09–W15 · D01, D02, D06 · F10–F13 · P10–P15 | B08, B09, B10 |
| IV | U10, U15 · W16, W17 · D01–D03, D07–D11 · F14, F15 · P16–P22 | B11, B12, B13, B14 |
| V | U09, U10, U12, U16 · W05, W18 · D10–D16 · F16, F17 · P23–P27 · L04 · X01 | B15, B16, B17 |

| Act | U | D | W | F | P | L / X | Tổng |
|---|---|---|---|---|---|---|---|
| Prologue | 2 | 0 | 1 | 0 | 0 | 0 | 3 |
| I | 5 | 4 | 6 | 2 | 7 | 0 | 24 |
| II | 8 | 1 | 3 | 7 | 2 | 3 | 24 |
| III | 2 | 3 | 7 | 4 | 6 | 0 | 22 |
| IV | 2 | 8 | 2 | 2 | 7 | 0 | 21 |
| V | 4 | 7 | 2 | 2 | 5 | 2 | 22 |

Một vài điểm dễ thấy khi nhìn bảng:
- Act II chỉ có một loại Discarded (D05).
- Toàn bộ 7 loại Discarded của Act V nằm trong the Course.
- Act I chưa có tay sai của Mason. Đây là chủ ý, vì tượng chỉ bắt đầu cử động từ Act II.

---

## 10. Sheet Dying Gods dùng làm blockout được

Phần này dựa trên mô tả trong `art-output/dying-gods-act1/roster.json`; mình chưa so với ảnh. ASHLAR đòi mỗi con có chi tiết riêng của lore (gai vữa, hoa anh túc, vải lanh…), nên các sheet này chỉ dùng làm stand-in để dựng thử, không phải concept cuối. Nếu dùng lại sheet 25 Deserter, 30 Hushed Acolyte hoặc 31 Penitent Bulwark thì phải đổi tên, vì chúng trùng với từ của ASHLAR: Deserter là cách Giáo hội gọi hero, Hush là tên căn bệnh, Bulwark là tên Giáo hội.

| Sheet Dying Gods | ASHLAR | Mức gần |
|---|---|---|
| 08 Gravewalker | U01 Shambler | Gần |
| 10 Bonewatch | U03 Charnel Bowman | Gần (cầm nỏ thay vì cung) |
| 11 Bloated Dead | U05 the Swollen | Gần |
| 12 Mourning Wraith | U10 Wallshade | Gần |
| 13 Coffinbound | U06 Pall-Wight | Gần |
| 16 Carrion Crow | W02 Gibbet-Crow | Gần |
| 17 Grave Rat | W01 Mortar-Rat | Gần, thiếu gai vữa |
| 18 Grave Moth | P03 Hush-Moths | Gần |
| 23 Hollow Trunk | W06 Willow-Hulk | Gần |
| 32 Ash Cantor | F06 Censer-Bearer | Gần |
| 14 Mirewolf | W03 Hush-Wolf | Một phần (Hush-Wolf là sói nửa người, mắt nhắm) |
| 05 Crawler, 09 Shrouded | U04 Charnel Ghoul | Một phần (dáng bò, kiểu lao tới) |
| 19 Thornstag | B11 Glass Stag | Một phần (chỉ dáng hươu) |
| 30 Hushed Acolyte | P02 Hush-Herald | Một phần |
| 31 Penitent Bulwark | F08 Halo Knight | Một phần |
| 33 Sanctified Executioner | B08 Pillar-Maker | Một phần |
| 34 Hollow Confessor | F13 Lye Priest | Một phần (mặt nạ trắng) |
| 26 Blackwood Marksman | F03 Exhumer | Một phần (nỏ, bẫy) |

---

## 11. Cố ý không tái dùng (Cast §11.2)

- Mọi boss và quái có tên riêng của Diablo, như Butcher, Skeleton King, Countess, các Evil, các thiên thần, và mọi unique/super unique.
- Mọi nhân vật có tên của 5 game Diablo.
- Tên quái của Diablo: Fallen, Khazra, Lacuni, Morlu…
- Hell Bovines và màn bí mật của chúng, vì trò đùa này phá tông.
- Lacuni (người mèo) và Hollows, vì quá đặc trưng, không dùng lại được mà không thành sao chép.
- Bộ giáp gai sám hối của Knights Penitent (D4). Halo Knight dùng hào quang gai hướng vào trong thay thế.
- Portal và lore "Greed" của Treasure Goblin. Chỉ giữ phần rượt đuổi.
