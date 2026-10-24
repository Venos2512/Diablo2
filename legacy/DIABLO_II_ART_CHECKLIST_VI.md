# Diablo II cổ điển — phân tích và checklist sản xuất art

## 1. Phạm vi và cách đọc

Tài liệu phân tích hình ảnh Diablo II bản cổ điển, không phải Resurrected. Phần cốt lõi lấy Diablo II gốc làm mốc: 5 lớp nhân vật, 4 Act. Lord of Destruction (LoD) được tách thành phạm vi mở rộng: Assassin, Druid, Act V và các nội dung liên quan.

Đây là breakdown để lập kế hoạch sản xuất, không phải danh mục trích xuất đầy đủ từng asset của Blizzard. Các khối lượng cho bản thử nghiệm bên dưới là đề xuất, không phải số asset của game gốc. Thư mục làm việc hiện chưa có tài nguyên để kiểm kê.

## 2. Vì sao art Diablo II hiệu quả?

- **Không khí:** thế giới suy tàn, tôn giáo Gothic, kinh dị và dấu vết bạo lực. Cảnh vật kể chuyện qua nhà đổ, mộ, xác, bàn thờ, dụng cụ tra tấn và kiến trúc bị xâm thực.
- **Tương phản:** nền thường trầm; lửa, phép, cổng dịch chuyển và vật thể quan trọng tạo điểm sáng. Cần giữ nhân vật và đòn đánh đọc được khi cảnh đông.
- **Vật liệu:** đá mòn, gỗ mục, sắt gỉ, da và xương có cảm giác nặng, cũ, bẩn. Không phủ một lớp nhiễu đồng đều lên mọi thứ; mỗi vật liệu cần cấu trúc riêng.
- **Hình khối:** quái được nhận diện bằng dáng đứng, tỷ lệ và cách di chuyển trước khi người chơi thấy chi tiết nhỏ.
- **Nhịp cảnh:** thị trấn tạo chỗ nghỉ; vùng hoang dã tạo khám phá; dungeon tạo áp lực; khu boss có bố cục nhận diện riêng.
- **Phần thưởng:** hình vật phẩm trong túi đồ có độ nổi khối và sức hấp dẫn riêng. Art loot là một phần quan trọng của vòng lặp chơi.
- **Kỹ thuật hình ảnh:** game gốc dùng sprite 2D, nhiều nội dung được dựng/render sẵn từ 3D. Vì vậy không nên mặc định đây là phong cách pixel art vẽ tay với viền rõ.

Hệ quả sản xuất: chốt camera, kích thước hiển thị, ánh sáng và cách xuất sprite trước khi làm hàng loạt. Chất lượng phải được duyệt ở kích thước trong game, không chỉ ở bản render lớn.

## 3. Những thứ cần làm art

### A. Bộ quy chuẩn hình ảnh — làm đầu tiên

- [ ] Bảng tham chiếu: không khí, kiến trúc, trang phục, vật liệu, mức độ kinh dị.
- [ ] Quy chuẩn camera, góc nhìn, tỷ lệ người–quái–cửa–cây.
- [ ] Bảng màu cho từng vùng; quy tắc độ sáng nền, nhân vật và phép.
- [ ] Bộ vật liệu mẫu: đá, đất, cỏ, gỗ, kim loại, da, xương, máu, nước.
- [ ] Quy chuẩn bóng, cạnh sprite, nền trong suốt, điểm neo ở chân và thứ tự che khuất.
- [ ] Một cảnh mẫu có nhân vật, quái, đồ rơi, môi trường, hiệu ứng và HUD để duyệt chung.

### B. Nhân vật người chơi

Game gốc có Amazon, Barbarian, Necromancer, Paladin và Sorceress. LoD thêm Assassin, Druid.

Mỗi lớp cần:

- [ ] Concept: hình dáng tổng thể, mặt, tóc, trang phục nền, bảng màu.
- [ ] Model/render nguồn hoặc bộ sprite theo pipeline đã chốt.
- [ ] Chờ, đi, chạy, đánh, thi triển phép, trúng đòn, chết; chặn đòn và động tác đặc thù khi phù hợp.
- [ ] Các tư thế tương ứng nhóm vũ khí: tay không, một tay, hai tay, cung, lao, vũ khí đôi… tùy lớp và thiết kế.
- [ ] Các lớp ngoại hình nhìn thấy: đầu/mũ, thân/giáp, tay, chân, vũ khí, khiên; chốt cách chia theo engine.
- [ ] Biến thể màu/vật liệu và mức trang bị; kiểm tra xuyên hình khi chuyển động.
- [ ] Ngoại hình lúc chọn nhân vật; hình UI bổ sung nếu thiết kế sử dụng.

Điểm tốn công: không phải mỗi món trang bị đều chỉ cần một icon. Một món còn có thể cần hình khi cầm/mặc, hình dưới đất và tương thích nhiều chuyển động. Cũng không mặc định mỗi chỉ số item cần một bộ hình mới.

### C. Quái, boss, đồng minh và triệu hồi

- [ ] Nhóm quái nhỏ đánh gần: ví dụ Fallen, xác sống, bộ xương.
- [ ] Nhóm bắn xa: cung thủ, quái phóng đạn.
- [ ] Nhóm thi triển phép/hồi sinh: ví dụ Shaman; phải nhận diện được giữa đám đông.
- [ ] Nhóm lớn, nặng: hình khối, bước chân và đòn đánh khác nhóm nhỏ.
- [ ] Nhóm đặc thù: bay, đào đất, sinh thêm quái, biến hình hoặc nhiều giai đoạn.
- [ ] Boss cuối Act: Andariel, Duriel, Mephisto, Diablo; thêm Baal nếu làm LoD.
- [ ] Boss nhiệm vụ và quái đặc biệt; tách loại cần hình riêng với loại chỉ cần màu/hiệu ứng khác.
- [ ] Lính thuê, sinh vật triệu hồi, golem, bộ xương và các đơn vị thuộc kỹ năng đã chọn.
- [ ] Mỗi loại: chờ/di chuyển/tấn công/trúng đòn/chết, xác hoặc dấu vết sau chết nếu cần; động tác riêng cho cơ chế đặc thù.

Phải thử cảnh nhiều quái cùng lúc. Quái có vai trò khác nhau cần phân biệt được bằng hình khối và chuyển động, không chỉ màu.

### D. Môi trường theo Act

| Vùng | Ngôn ngữ hình ảnh | Bộ art cần chuẩn bị |
|---|---|---|
| Act I — Rogue Encampment và vùng lân cận | Đồng hoang, nghĩa địa, tu viện Gothic | Trại, cỏ/đất/đường, hàng rào, cây, hang, hầm mộ, tường/cửa/cột tu viện, nhà tù, nhà thờ |
| Act II — Lut Gholein | Sa mạc, lăng mộ, kiến trúc thành phố khô nóng | Cát/đá, vách, nhà và chợ, cống ngầm, cung điện, mộ, quan tài, biểu tượng, bộ Arcane Sanctuary riêng |
| Act III — Kurast | Rừng ẩm, kiến trúc đổ nát, đền bị tha hóa | Cây/rễ, bùn/nước, cầu gỗ, làng, tường đền, cống, nội thất nghi lễ, bộ Durance of Hate |
| Act IV — Pandemonium Fortress và địa ngục | Đá tối, tro, dung nham, xương, công trình quỷ | Pháo đài, đất cháy, vực, dung nham, tường/cột địa ngục, bộ Chaos Sanctuary và phong ấn |
| Act V — LoD | Thành lũy, chiến trường tuyết, núi và hang băng | Harrogath, công sự, tuyết/băng, vách núi, hang, kiến trúc Worldstone và khu boss |

Mỗi bộ môi trường cần:

- [ ] Nền cơ bản, biến thể nền và mảnh chuyển giữa các vật liệu.
- [ ] Tường thẳng, góc trong/ngoài, đầu tường, cửa, cửa vòm, cầu thang, cầu và mép vực theo nhu cầu vùng.
- [ ] Mảnh kiến trúc lớn để tạo điểm nhận diện; mảnh nhỏ để phá lặp.
- [ ] Phần tiền cảnh có thể che nhân vật; quy tắc ẩn/mờ nếu engine hỗ trợ.
- [ ] Bóng tiếp xúc, nguồn sáng và vật thể phát sáng.
- [ ] Trang trí kể chuyện: xác, xương, đồ bỏ lại, dấu nghi lễ, đồ sinh hoạt.
- [ ] Khu vực nhiệm vụ và boss có bố cục được thiết kế riêng.

Một ảnh nền đẹp chưa đủ cho bản đồ ghép: cần kiểm tra mép nối, tính liên tục của đường đi, va chạm và che khuất ở nhiều bố cục.

### E. Vật thể tương tác và NPC

- [ ] Rương thường/rương đặc biệt: đóng, mở, trống; hiệu ứng bẫy nếu có.
- [ ] Thùng, chum, vật phá được: nguyên vẹn, vỡ, mảnh vụn.
- [ ] Cửa, cổng, cần gạt, phong ấn, bàn thờ và thiết bị nhiệm vụ: đủ trạng thái.
- [ ] Waypoint: nền kiến trúc, trạng thái và hiệu ứng kích hoạt.
- [ ] Town Portal và cổng nhiệm vụ: mở, lặp, đóng nếu thiết kế cần.
- [ ] Giếng, shrine, stash, lửa trại, đuốc và vật dụng thị trấn.
- [ ] NPC bán hàng, sửa đồ, giao nhiệm vụ, đồng hành: hình dáng riêng, chờ và động tác cần thiết.
- [ ] Dấu phản hồi khi rê chuột, chọn hoặc tương tác nếu có.

### F. Vật phẩm và loot

- [ ] Vũ khí: kiếm, rìu, chùy, dao, thương, polearm, cung/nỏ, gậy, đũa và nhóm cần thiết khác.
- [ ] Giáp, mũ, khiên, găng, giày, đai; nhẫn và dây chuyền.
- [ ] Potion, cuộn giấy, sách, chìa khóa, vàng, đạn và vật phẩm nhiệm vụ.
- [ ] Gem và Horadric Cube; với LoD bổ sung rune, jewel, charm và đồ dành riêng cho lớp khi nằm trong phạm vi.
- [ ] Với mỗi món, đánh dấu rõ: icon túi đồ / hình dưới đất / hình cầm-mặc / hiệu ứng riêng.
- [ ] Quy chuẩn kích thước ô túi đồ, nền trong suốt, góc chiếu và ánh sáng của icon.
- [ ] Quy chuẩn màu chữ và trạng thái chọn, chưa xác định, không dùng được, hỏng hoặc có socket khi cần.

Phân biệt tên item, chỉ số item và hình item. Nhiều dữ liệu có thể dùng chung một hình; một hình trang bị có thể cần áp dụng cho nhiều lớp nhân vật. Chốt bảng ánh xạ này trước khi đặt khối lượng.

### G. Kỹ năng và hiệu ứng

- [ ] Projectile: mũi tên, lao, đạn phép, quả cầu lửa, đạn băng và các loại đã chọn.
- [ ] Hiệu ứng lúc thi triển, lúc bay, lúc chạm và lúc kết thúc.
- [ ] Phép diện rộng, vụ nổ, tường lửa, tia sét, nova và vùng tác động.
- [ ] Aura, buff, curse, triệu hồi và biến hình khi có.
- [ ] Phản hồi trạng thái: độc, lạnh/đóng băng, cháy và các trạng thái gameplay cần đọc được.
- [ ] Máu, tia lửa, bụi, mảnh đá và phản hồi đánh trúng theo vật liệu.
- [ ] VFX môi trường: mưa, lửa, khói, nước, dung nham; tuyết ở phạm vi LoD.
- [ ] Icon kỹ năng và biểu tượng trạng thái mà UI thực sự hiển thị.

Một kỹ năng không đồng nghĩa một asset: có thể gồm animation nhân vật, vật thể phóng, va chạm, vùng tác động, trạng thái trên mục tiêu và icon. Cần phân biệt tín hiệu gameplay với phần trang trí.

### H. UI/UX art

- [ ] HUD: khung đá/kim loại, bình máu/mana, stamina, kinh nghiệm, đai potion, ô kỹ năng.
- [ ] Túi đồ và ô trang bị; nhân vật và chỉ số; cây kỹ năng.
- [ ] Stash, cửa hàng, sửa đồ, mua bán, giao dịch; Horadric Cube.
- [ ] Nhật ký nhiệm vụ, hội thoại, danh sách waypoint, tùy chọn và menu tạm dừng.
- [ ] Automap: ký hiệu cửa, cầu thang, điểm đến và các yếu tố cần hiển thị.
- [ ] Tooltip item, tên đồ dưới đất, tên/thanh máu quái và phản hồi tương tác.
- [ ] Màn hình chính, chọn/tạo nhân vật, loading, chết và kết thúc theo phạm vi.
- [ ] Font, dấu tiếng Việt nếu bản làm có Việt hóa, số và ký hiệu.
- [ ] Nút thường/rê/nhấn/khóa; con trỏ thường/tấn công/tương tác/trạng thái không hợp lệ theo thiết kế.

Chất Gothic không được làm chữ khó đọc. Thử tooltip dài, tên vật phẩm dài, giao diện ở kích thước thực và độ tương phản khi cảnh sáng/tối.

### I. Cinematic và art quảng bá — ngân sách riêng

- [ ] Logo, key art, hình cửa hàng, ảnh chụp quảng bá.
- [ ] Nếu tái tạo trải nghiệm đầy đủ: storyboard, nhân vật/bối cảnh cinematic, animation, ánh sáng, dựng và hậu kỳ.

Không gộp cinematic vào chi phí sprite gameplay. Đây là một nhánh sản xuất lớn, có thể hoãn ở bản thử nghiệm.

## 4. Thông số bàn giao phải chốt

| Nhóm | Thông số cần có |
|---|---|
| Sprite chuyển động | Số hướng theo từng loại, danh sách động tác, số frame/thời lượng, điểm neo, bóng, sự kiện đánh trúng |
| Nhân vật/trang bị | Điểm gắn, lớp trước/sau, tư thế vũ khí, bộ chuyển động dùng chung, biến thể màu |
| Môi trường | Kích thước mảnh, tỷ lệ camera, mép ghép, độ cao, vùng va chạm, thứ tự che khuất |
| VFX | Thời lượng, loop, vùng tác động, blend mode, mức sáng, điểm xuất hiện và kết thúc |
| UI/icon | Kích thước, vùng an toàn, trạng thái, font, màu chữ và cách co giãn |
| Mọi asset | Mã định danh, tên file, nguồn chỉnh sửa, định dạng xuất, nơi dùng và người duyệt |

Không áp một số hướng cố định cho toàn bộ game khi chưa kiểm tra loại asset và engine đích. Nếu làm mod trực tiếp, phải kiểm tra thêm yêu cầu định dạng và bảng dữ liệu của phiên bản game cụ thể.

## 5. Cách tính khối lượng để không bị thiếu

Ước lượng sơ bộ một bộ sprite: tổng theo từng động tác của (số hướng × số frame × số biến thể hình ảnh thực sự phải xuất). Ví dụ giả định: 8 hướng × 8 động tác × 12 frame = 768 frame trước khi xét trang bị. Đây chỉ là ví dụ tính toán, không phải thông số Diablo II.

Với nhân vật chia lớp, không nhân mọi tổ hợp trang bị một cách máy móc: cần tính phần tái sử dụng, số phần phải render và công kiểm tra tổ hợp. Với 3D thời gian thực, không dùng công thức frame sprite để tính ngân sách model/rig/animation.

Những phần thường bị bỏ sót: xác chết, ảnh đồ rơi, animation mở/vỡ, chuyển tiếp nền, góc tường, bóng, icon kỹ năng, con trỏ, trạng thái nút và cảnh có nhiều hiệu ứng chồng nhau.

## 6. Thứ tự làm đề xuất

### P0 — Chứng minh phong cách và cảm giác chiến đấu

- [ ] Một cảnh hoàn chỉnh theo tinh thần Act I.
- [ ] Một nhân vật với một nhóm vũ khí và đủ động tác chiến đấu cơ bản.
- [ ] Ba quái có vai trò khác nhau: cận chiến, đánh xa, thi triển phép.
- [ ] Một bộ nền/tường ghép nhỏ, đủ tạo vài bố cục khác nhau.
- [ ] Một rương, một cửa, một vật phá được, một portal.
- [ ] Một đòn vật lý và hai kỹ năng có hiệu ứng khác nhau.
- [ ] Khoảng 12–20 icon item, có đại diện vũ khí/giáp/potion/đồ nhiệm vụ.
- [ ] HUD, túi đồ và tooltip đủ dùng.

### P1 — Hoàn thành một khu chơi ngắn

- [ ] Một hub nhỏ, một vùng ngoài trời, một dungeon và một boss.
- [ ] NPC và đồ nhiệm vụ vừa đủ cho một chuỗi nhiệm vụ.
- [ ] Thêm biến thể môi trường, trang bị và quái để kiểm chứng khả năng tái sử dụng.
- [ ] Kiểm tra toàn bộ art trong một vòng chơi: đi khám phá → đánh → nhặt đồ → trang bị → trở về hub.

### P2 — Mở rộng nội dung

- [ ] Nhân rộng sang lớp nhân vật, bộ môi trường, boss và kỹ năng khác sau khi pipeline đã ổn.
- [ ] Chốt riêng phạm vi LoD; không đưa toàn bộ phần mở rộng vào ngân sách game gốc.
- [ ] Làm cinematic và quảng bá theo mục tiêu phát hành.

## 7. Tiêu chí duyệt art

- Nhìn nhỏ vẫn nhận ra nhân vật, loại quái, cửa và đồ tương tác.
- Đọc được hướng đánh và thời điểm va chạm; chân không trượt, hiệu ứng không lệch sự kiện gameplay.
- Mảnh map ghép nhiều cách không hở, không tạo lối đi giả hoặc che khuất khó hiểu.
- Trang bị đổi đúng ngoại hình, không xuyên cơ thể hoặc sai thứ tự lớp khi quay hướng.
- Nền đủ chi tiết nhưng không cạnh tranh với đòn đánh, quái và loot.
- Cảnh đông không bị trắng màn hình vì phép; hình độc/lạnh/aura vẫn phân biệt được.
- UI đọc được tiếng Việt, tên dài và tooltip dài ở độ phân giải mục tiêu.
- File nguồn, bản xuất và mã asset khớp nhau; asset được thử trong engine trước khi duyệt hoàn tất.

## 8. Mẫu dòng quản lý công việc

| ID | Nhóm | Asset | Trạng thái/động tác | Hướng | Biến thể | Phụ thuộc | Ưu tiên | Tình trạng |
|---|---|---|---|---|---|---|---|---|
| CHR_001 | Nhân vật | Nhân vật thử nghiệm | Chờ/đi/chạy/đánh/trúng/chết | Chốt theo pipeline | Một bộ đồ, một vũ khí | Camera, rig | P0 | Chưa làm |
| ENV_001 | Môi trường | Bộ dungeon thử nghiệm | Nền/tường/góc/cửa | Theo camera | Biến thể phá lặp | Lưới map | P0 | Chưa làm |
| FX_001 | Hiệu ứng | Đạn lửa | Thi triển/bay/chạm | Theo kỹ năng | Một mức ban đầu | Sự kiện chiến đấu | P0 | Chưa làm |

## 9. Nguồn tham khảo

- Blizzard, The Arreat Summit — Classes: https://classic.battle.net/diablo2exp/classes/
- Blizzard, The Arreat Summit — Monsters và bestiary theo Act: https://classic.battle.net/diablo2exp/monsters/
- Blizzard, The Arreat Summit — Items: https://classic.battle.net/diablo2exp/items/
- Blizzard, The Arreat Summit — Bosses: https://classic.battle.net/diablo2exp/monsters/bosses.shtml
- Diablo II postmortem, Game Developer tháng 10/2000: https://media.gdcvault.com/GD_Mag_Archives/GDM_October_2000.pdf
- Bài trình bày kỹ thuật GDC về đồ họa gốc và Resurrected: https://media.gdcvault.com/GDC%2B2022/Speaker%2BSlides/Resurrecting%2Ba%2BClassic_Todisco_Kevin.pdf

Arreat Summit bao gồm nội dung LoD. Khi lập danh mục chính xác cho Classic, cần lọc theo phiên bản, không lấy toàn bộ mục trên trang làm phạm vi game gốc. Các khuyến nghị về pipeline, ưu tiên và bản thử nghiệm trong tài liệu là phân tích sản xuất đề xuất.

## 10. Thống kê quái và animation — mức đã xác minh

Đếm trực tiếp số mục trong bốn trang Bestiary Act I–IV của Blizzard:

| Trang | Số mục nhóm quái/vật thể thù địch |
|---|---:|
| Act I | 21 |
| Act II | 19 |
| Act III | 10 |
| Act IV | 6 |
| Tổng | 56 |

Đây là số mục Bestiary, KHÔNG phải tổng số quái trong Classic, số model riêng hay số bộ animation. Danh mục gồm cả bẫy, tổ, trứng và vật sinh quái; không cộng lại những nhóm xuất hiện ở nhiều Act. Các boss cuối Act nằm ở mục riêng: Andariel, Duriel, Mephisto, Diablo. Ngoài ra còn boss nhiệm vụ, Super Unique và nội dung đặc biệt như bò ở Secret Cow Level; chưa được kiểm kê đầy đủ trong con số 56.

Ví dụ một mục Fallen bao gồm nhiều biến thể. Biến thể tên/màu không mặc nhiên cần model hoặc animation mới. Ngược lại, các mục Skeleton, Skeleton Archer và Skeleton Mage cũng không mặc nhiên là ba bộ hình hoàn toàn độc lập.

Chưa xác minh được tổng clip animation hoặc tổng frame của toàn bộ quái. Để có số chính xác cần kiểm kê dữ liệu đúng phiên bản, ghép MonStats/MonStats2 với COF/DCC và dữ liệu animation. Tách số quái gameplay, số token hình ảnh, số bộ động tác, số hướng, số thành phần và số frame. Trạng thái xác chết hoặc chuỗi động tác không được mặc định tính như một clip chuyển động mới.

Ví dụ lập ngân sách giả định: một quái có 6 động tác × 8 hướng = 48 chuỗi theo hướng; nếu mỗi chuỗi 12 frame thì có 576 frame hình cho một ngoại hình ghép hoàn chỉnh. Đây là minh họa tính khối lượng, không phải thống kê Diablo II. Không nhân 56 nhóm với một số animation trung bình rồi gọi kết quả là tổng thật.

Nguồn đếm: bốn trang https://classic.battle.net/diablo2exp/monsters/act1.shtml đến act4.shtml. Nguồn phương pháp: Extracting Diablo II Animations, Paul Siramy (đường dẫn trong phần nguồn).
