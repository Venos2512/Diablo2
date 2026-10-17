# Concept xương quái chìm trong đất

Bộ concept môi trường nguyên bản theo AD của dự án, tạo bằng **Python / Pillow / NumPy**. Không tải ảnh ngoài, không dùng asset Blizzard. Chỉ ghi file trong thư mục này; không chỉnh thư mục rock-concepts hoặc tree-concepts, không commit.

## Các sheet

| File | Nội dung | Quy mô và sử dụng |
|---|---|---|
| [01_scattered_bone_decals.png](01_scattered_bone_decals.png) | Sáu cụm: sườn rời, chuỗi đốt sống, mảnh sọ, móng/răng, mảnh vỏ xương, hỗn hợp. Bùn che chân, rêu và vũng nước. Có mẫu thu về tỷ lệ game. | **Decal không cản đường**. Độ nhô khoảng 0,03–0,2 H; kích thước thấy được ghi trên từng ô. |
| [02_halfburied_monster_skeletons.png](02_halfburied_monster_skeletons.png) | Ba giải phẫu × ba giai đoạn: vừa ngã → vùi nửa → dấu tích cũ. | Quái nguồn **S 0,65 H**, **M 1,10 H**, **M 1,00 H**. Đây là chiều cao lúc sống; xác nằm có thể dài hơn chiều cao ấy. |
| [03_giant_carcass_landmark.png](03_giant_carcass_landmark.png) | Lồng ngực cổ thành vòm, sọ mất hàm, đất nuốt phần dưới, rễ xuyên sườn, giáo gỉ và cán tên cũ. | Landmark đỉnh lộ **xấp xỉ 2,65 H**. Chặn tại chân sườn/bờ đất; lối chính đi **vòng quanh**. Kinh dị 2–3. |
| [04_act_variants.png](04_act_variants.png) | Cùng lồng ngực, góc nhìn và độ chìm cho Act I–V. | Đổi bùn/rêu, cát, nước/dây leo, tro/than, tuyết/sương giá; giữ hình khối. |
| [05_readability_check.png](05_readability_check.png) | Bốn ô: màu + lưới đi, grayscale, silhouette đen, cảnh màu sạch. | Render **1:1**, hero 75 px, quái S/M. Hành lang dành riêng rộng **3 Sub**. |

Năm sheet đều **1920×1280 RGB PNG**. [readability_native_880x480.png](readability_native_880x480.png) là ảnh cảnh sạch 880×480 để xem đúng pixel và đo lại, không cần cắt từ sheet.

## Đơn vị, lớp prop và va chạm

- **1 H = 75 px** chiều cao hero ở tỷ lệ game. Các ô nghiên cứu chất liệu được phóng lớn; không lấy pixel của ô nghiên cứu làm kích thước game.
- **1 Sub** có hình thoi **32×16 px**. Một bước theo một trục mặt sàn chiếu thành vector **16×8 px**; vì vậy bề rộng 3 Sub dọc trục ngang lối đi chiếu thành vector **48×24 px**, không phải 96×48 px.
- Xương vụn, móng, răng và chuỗi đốt sống: lớp **decal**, collision = none, kể cả khi nằm trên lối đi.
- Xác S/M: xương nhô chủ yếu ≤0,5 H, thuộc **prop thấp**. Bản vừa ngã có thể chặn một vùng nhỏ ở lề; bản vùi sâu là decal hoặc prop thấp không chặn. Không suy va chạm từ một đốm highlight.
- Landmark: **prop cao / landmark ≥2 H**. Chỉ chân sườn và bờ đất có va chạm. Cảnh kiểm tra dùng lối đi vòng, không phụ thuộc chức năng đi dưới vòm.
- Nếu triển khai đi dưới vòm sau này: cần collision riêng và cơ chế ẩn/mờ sườn phía trước khi che hero. Concept này chưa phải kiểm thử che khuất trong engine.
- Sheet 05 dành vùng `abs(y/Sub) <= 1.5` cho lối đi; toàn bộ mesh của các xác có thể cản đường nằm ngoài vùng ấy. Phần dư được đo trong `verification.json`. Lưới là overlay kiểm tra, không phải hiệu ứng trong game.

## Palette HEX và value

Các mã xương là **màu vật liệu trước chiếu sáng**. Pixel cuối có thể tối hơn do bóng, đất và khớp. Palette dùng các họ màu trong AD; không tuyên bố là trích xuất từ palette gốc.

| Act | Đất trung | Bóng / khớp | Xương trước chiếu sáng | Vật liệu đi kèm |
|---|---|---|---|---|
| I | `#343A30` | `#1B1F1C` | `#817D6A` | Rêu `#4A5140`, nước `#303B3B` |
| II | `#80705A` | `#302A25` | `#999080` | Cát khô, xương ngả ngà, không trắng |
| III | `#303C30` | `#141C19` | `#717868` | Rêu `#46593F`, nước `#263C38` |
| IV | `#352D2A` | `#201919` | `#6D6258` | Tro, xương ám than, khe than `#9F562F` rất nhỏ |
| V | `#727E84` | `#28333B` | `#8C8D80` | Sương giá `#8F999A`, bóng lam-xám |

Màu tham chiếu máu AD là **`#6E1414`**; chỉ có một dấu khô rất nhỏ trong sheet 02, tối thành `#461917`. Diện tích nhỏ hơn nhiều so với trần **5%**. Không nội tạng, không văng máu trang trí. Act IV có một khe than nhỏ, không bloom hay quầng sáng.

Act I giữ vỏ xương trong dải **20–45/100**; khớp đen, mặt dưới và dải bùn ướt được phép xuống dưới 20. Shader chặn đỉnh luma vỏ xương tại 45. Hero ở mức khoảng 63,4; chênh lệch tối thiểu với pixel xương sáng nhất phải **≥15 điểm**. Số đo cuối cùng ở [verification.json](verification.json), lấy từ ảnh sạch, loại chữ sheet và pixel nhân vật khỏi mask xương.

Phép đo là luma **Rec.709 trên RGB sRGB mã hóa**, quy về 0–100: `0.2126 R + 0.7152 G + 0.0722 B`. Đây là kiểm tra value phục vụ AD, không phải CIELAB L*. Phần lớn môi trường khử bão hòa; khớp và bóng gần trung tính, màu máu/than nhỏ là ngoại lệ có chủ ý. Act II/V có nền sáng hơn: khi tích hợp cần hero tối và bóng chân đậm theo ngoại lệ của AD.

**Kết quả đã kiểm tra:** hero tối thiểu **63,41**, xương sáng nhất **44,84**, xương trung bình **31,79**, khoảng cách **18,57 điểm**. Không có đỉnh mesh blocking nào trong hành lang; khoảng dư từ biên hành lang tới mesh gần nhất **0,766 Sub**. Cả sáu PNG đều giải mã đầy đủ và đã được xem trực quan; năm sheet đúng 1920×1280.

## Quy tắc AD đã áp dụng

**Đọc trước, chi tiết sau.** Phân biệt sườn rời / đốt sống / mảnh sọ bằng hình lớn. Xác không có trắng tinh, viền lấp lánh, màu rarity, nhãn đồ hay bố cục giống vật phẩm đang chờ nhặt. Ở cảnh 75 px chỉ giữ mảng vật liệu lớn, khe xương và cỏ thành cụm; không rắc hạt nhiễu li ti lên sprite.

**Chìm thật vào đất.** Mesh xương được cắt theo mặt đất gợn nhẹ, không chỉ giảm opacity. Chỗ giao có dải đất ẩm tối, vành bùn và rêu; cỏ chồng ở phần tiếp xúc. Phần thấp mất dần trước, để lại sống lưng, sườn trên hoặc sừng. Bóng tiếp xúc và bóng đổ cùng hướng ngăn cảm giác đồ nổi trên sàn.

**Camera và ánh sáng.** Isometric mặt sàn 2:1 cố định, không phối cảnh, một nguồn sáng trên-trái cho mọi Act. Mặt xương hướng sáng ngà xỉn; mặt dưới nâu-xám, khớp tối. Bóng đổ xuống-phải. Không bloom, god-ray hay đèn viền trang trí.

**Một điều sai.** Sọ thú nhỏ có cặp sừng ngắn; thú bốn chân giữ trục sống, cặp sườn và chi; xác dáng người nằm úp để mất mặt. Landmark chỉ phóng đại ngực, không ghép thêm chi hay gai kiểu Act IV. Thiết kế mới dựa trên logic giải phẫu, không sao chép model quái cụ thể.

**Ba lớp thời gian.** Sheet 02 là ba trạng thái vùi của cùng một xác. Đồng thời, landmark diễn đạt ba lớp của AD: (1) cấu trúc sinh vật ban đầu; (2) xói mòn, đất bồi và rễ chiếm lại; (3) dấu bạo lực của con người qua giáo và cán tên. Hai khái niệm này liên quan nhưng không đồng nhất. Câu chuyện là “một cuộc săn đã xảy ra, người chơi đến muộn”; kinh dị bằng trọng lượng và sự im lặng.

**Act I theo địa điểm.** Decal nhẹ hợp Blood Moor; hốc bùn và lồng ngực hợp đường đến Den of Evil; xác úp và dấu vùi lâu hợp lề Burial Grounds. Không đặt landmark dày đặc trên cánh đồng đầu game; chỉ dùng ở một ngưỡng hay đường vòng đáng nhớ.

## Chạy lại và kiểm tra

Từ repo:

```powershell
python art-output/bone-concepts/generate_bones.py
python art-output/bone-concepts/verify_bones.py
```

Cần Python 3, Pillow và NumPy đã có trong môi trường. Seed cố định; font Georgia/Arial trên Windows, DejaVu làm fallback. Script chỉ ghi các PNG và JSON bên cạnh chính nó. Ground lấy biến thiên thấp từ reference local `art-direction/reference/terrain-moor/mud_wet.png`, chuyển xám và giảm chi tiết rồi tint lại; nếu thiếu reference sẽ dùng noise nhiều tầng. Không truy cập mạng.

`verify_bones.py` kiểm tra giải mã đầy đủ mọi PNG, kích thước, chênh value ≥15 và không có đỉnh mesh blocking trong hành lang. Đây là kiểm tra concept; chưa có navmesh, frame animation, ánh sáng động hoặc kiểm tra chiến đấu đông trong game.

## Tự phê bình theo rubric AD

| Tiêu chí | Tự chấm /5 | Nhận xét |
|---|---:|---|
| Đọc được | 4 | Rõ thứ bậc hero–xác–nền ở 75 px; decal nhỏ cố ý hòa nền. Chưa thử 20 quái + 3 phép. |
| Silhouette | 4 | Sọ sừng, lồng ngực, xác úp phân biệt được; các sườn landmark vẫn hơi đều nhịp. |
| Giá trị sáng | 4 | Có số đo pixel sạch, giữ khoảng cách ≥15; đất ẩm và khớp tối là ngoại lệ được giải thích. |
| Palette Act | 4 | Khác được năm khí hậu; Act III nên kiểm tra tiếp trong cảnh rừng có tán che, Act V trên terrain tuyết thực tế. |
| Ánh sáng | 4 | Một hướng bake, không bloom, bóng chân hiện rõ; cần khớp light radius khi tích hợp dungeon. |
| Vật liệu | 3 | Ngà bẩn, bùn, rêu và sương giá đã có; bề mặt procedural vẫn khá mượt, mép bùn/vũng còn mang tính minh họa. |
| Theme | 4 | Xác thành kiến trúc, thiên nhiên chiếm lại và dấu cuộc săn; gore tiết chế. |

Đây là **concept sheet để chốt hình khối, mức vùi và value**, chưa phải sprite production có alpha, pivot, collision và tám hướng. Không đánh đồng điểm tự chấm với duyệt chính thức của art lead.

## Tài liệu đã đọc / house style

- `art-direction/00_TOM_TAT_ART_DIRECTION.md`
- `art-direction/02_THEME_VA_CAU_CHUYEN.md`
- `art-direction/04_MAU_SAC_VA_ANH_SANG.md`
- `art-direction/05_HINH_KHOI_VAT_LIEU_CAMERA.md`
- `art-direction/06_NHAN_VAT_VA_QUAI.md`
- `art-direction/11_ACT1_PHAN_TICH_CHI_TIET.md`
- `art-direction/12_QUY_CHUAN_QUAI_CANH_QUAN_CONG_TRINH.md`
- Đọc `art-output/diablo-concepts/concepts_a.py`, `concepts_b.py`; xem `09-blood-raven.png` để đối chiếu nền than, chữ serif nhỏ và vật liệu khử bão hòa.
- Xem `art-output/mmo-hub-bloodmoor/01_establishing_iso.png` và reference bùn terrain để đối chiếu môi trường ẩm, xám-lục.
