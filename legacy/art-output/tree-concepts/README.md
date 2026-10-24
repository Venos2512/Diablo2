# Concept cây — Act I

Bộ thiết kế nguyên bản theo art direction của dự án, vẽ procedural bằng **Python + Pillow + NumPy**. Không tải ảnh ngoài, không dùng asset Blizzard. Chỉ ghi trong `legacy/art-output/tree-concepts/`; không commit.

## Các sheet

Tất cả PNG: **1800 × 1200, RGB**. Chữ tiếng Việt dùng Times/Segoe UI, đồng bộ bộ đá và cách trình bày concept hiện có: nền xanh đen, chữ ngà, nhãn nhỏ, khối chính ít màu. Các sheet 01–04 phóng lớn để duyệt vật liệu; **sheet 05 là tỷ lệ thật**, phải mở PNG ở 100%.

| File | Nội dung và kích thước |
|---|---|
| [01_act1_dead_trees.png](01_act1_dead_trees.png) | Chồi héo **1 H**; cây quặp **1.8 H**; cây xoắn **2.8 H**; cây nghiêng/bật gốc **1.6 H**; gốc mục **0.3 H**. Dáng phân biệt bằng trục, bề rộng và khoảng trống giữa cành. |
| [02_dry_branches_debris.png](02_dry_branches_debris.png) | Thân đổ **0.35 H**; cụm cành **0.25 H**; cành vụn **0 H**; cành gãy **0.2 H**; rễ bật **0.45 H**; bụi gai **0.5 H**. Ghi rõ **decal không cản** và **prop cản** trên từng mẫu. |
| [03_burned_trees.png](03_burned_trees.png) | Cây **2.2 H**: vừa cháy → than nguội phủ tro → cháy cũ được rêu/cỏ chiếm lại. Có gốc than **0.35 H**, thân sụp **0.4 H** và decal tro/than. Chỉ cây vừa cháy có khe âm ỉ. |
| [04_landmark_tree.png](04_landmark_tree.png) | **Cây Giữ Lời — 3.25 H**, footprint dự kiến **3×3 Sub**. Hai thân ôm hốc rỗng, dấu khắc mòn, dây lễ và thẻ gỗ rách, cành bị chặt; ba ô cận vật liệu/kể chuyện. Hero tham chiếu **1 H**. |
| [05_readability_check.png](05_readability_check.png) | Cây màu và silhouette đen cạnh hero **75 px**; cảnh grayscale; thang sáng ba tầng; hero ở sau cây với viền dự phòng và cây mờ **28% opacity**. |

**H = 75 px**, đo từ mặt đất ở điểm neo đến đỉnh cây; rễ nhô trên mặt sàn có thể đi xuống dưới điểm neo. Với deadwood nằm ngang, H ghi **chiều cao nhô khỏi đất**; bề rộng trong ảnh còn chứa chiều dài và độ sâu chiếu isometric. Kích thước Sub là đề xuất vùng va chạm ở thân/gỗ đặc, không lấy toàn bộ tán và cành mảnh làm vật cản.

## Palette neo

Shader tạo sắc độ trung gian bằng nội suy và loang vật liệu; bảng dưới là các màu neo, không phải palette indexed 256 màu.

| Vai trò | HEX |
|---|---|
| Moor tối / trung / sáng | `#1B1F1C` / `#3E4638` / `#6F6F5C` |
| Gỗ sẫm / mặt vân bắt sáng | `#454A40` / `#696B59` |
| Rêu chính / rêu trong ẩm | `#515B43` / `#454F3C` / `#59634A` |
| Bóng gỗ / lòng mục | `#333A34` / `#222B25` |
| Than lạnh / khe than sâu | `#303942` / `#171C22` |
| Tro / gỗ cháy phủ tro | `#70777B` / `#4C5255` |
| Vỏ than hồng / lõi than hồng | `#D9822B` / `#E7C890` |
| Đất kiểm tra / hero kiểm tra | `#343C32` / `#929586` |
| Dây / thẻ lễ cũ | `#69644D` / `#86816C` |
| Chữ / ghi chú | `#C6BEA8` / `#808B7D` |

Độ bão hòa gỗ/rêu chủ yếu trong dải xấp xỉ **10–35%**; tro có thể gần trung tính. Than ngả lam–xám. Đen tuyệt đối chỉ dùng trong bài **silhouette đen**, không dùng làm toàn bộ vật liệu cây.

## Áp dụng art direction

- **Camera, tỷ lệ, đọc hình:** góc nhìn isometric cố định; chân/rễ và sàn theo lưới 2:1. Bốn cây thường có dáng gầy, tán ngang, trục xoắn cao và nghiêng. Landmark có hốc hai thân và tán khuyết riêng. Cành chính thưa, tránh mạng twig nhiễu.
- **Lớp cảnh quan:** cành vụn, tro và than vụn là decal không cản. Deadwood, gốc và bụi gai ≤0.5 H là prop thấp; cây 1–2.8 H là prop cao có bóng; cây nghi lễ 3.25 H là landmark. Giữ lối chính ≥3 Sub, prop cao che ≤25% màn hình, cụm decal 3–7 mảnh. Các con số bố trí là hướng dẫn cho level art, chưa phải layout đã đo trong engine.
- **Giá trị sáng:** ba tầng đất 15–35 → nhân vật 35–65 → hiệu ứng 70–100. Mặt gỗ chủ yếu V20–45; vết mục/hốc và khe than có thể tối hơn. Sheet 05 dùng đất **V22.14**, hero **V57.41**, chênh **+35.27**. Đo bằng luma RGB mã hóa Rec.601 `(0.299R + 0.587G + 0.114B) / 255 × 100`, cùng quy ước chuyển grayscale trong Pillow, không phải luminance ánh sáng tuyến tính hay HSV-V.
- **Than hồng:** cam `#D9822B` riêng nó chỉ đạt **V57.29**, nên khe mới cháy có lõi `#E7C890` **V79.56** để đúng tầng hiệu ứng 70+. Phần màu ấm dưới **2% diện tích sprite cây mới cháy** trong phép đo hiện tại; không glow/bloom diện rộng. Các swatch và chữ chú thích không thuộc diện tích asset đo.
- **Ánh sáng:** mặt trên–trái sáng, dưới–phải tối; bóng chiếu về dưới–phải, bóng tiếp xúc đậm tại gốc. Đây là ánh sáng bake trong concept, không có god-ray.
- **Vật liệu:** vân lớn chạy theo thớ, mảng vỏ bị tách với độ dài không đều, đầu gãy xám bẩn, hốc mục sâu; rêu tụ ở chân ẩm. Gỗ không vàng sạch. Than có nứt co theo mảng, tro lạnh phủ lên. Ở tỷ lệ game bỏ thông tin vân quá nhỏ; chỉ giữ khối, rãnh lớn và 1–2 dấu hư hại chính.
- **Theme:** thiên nhiên chiếm lại và tàn tích sau chiến tranh. Bộ cháy kể thời gian **mới cháy → nguội → rêu/cỏ trở lại**. Landmark có lớp nguyên thủy (dấu thề), lớp thời gian (rêu, dây phai), lớp thảm họa gần đây (cành chặt, thẻ rách, vết than). Kinh dị 2–3 được gợi qua nghi lễ bị bỏ lại, không cần gore.
- **Không che hero:** khi cây nằm trước hero, engine cần chuyển tán/thân về opacity thấp hoặc ẩn phần che, đồng thời giữ viền hero. Sheet 05 minh họa mức 28% và viền trung tính; không để mất toàn bộ hero quá 0.5 giây. Quy tắc che khuất nằm ở Ch.12 §4.4/§5.2; §5.4 mô tả ba lớp lão hóa. Đây là minh họa concept, chưa phải mã runtime.

## Tái tạo và kiểm tra

```powershell
python legacy/art-output/tree-concepts/generate_trees.py
```

Cần Python 3, Pillow và NumPy; dùng font Windows có sẵn. Seed cố định. Script chỉ tạo lại 5 PNG và [qa_report.json](qa_report.json) ngay cạnh nó. Không mạng, không thư viện mô hình/ảnh bên ngoài.

[generate_trees.py](generate_trees.py) chứa thiết kế skeleton riêng cho từng cây, vỏ thân có tiết diện sáng/tối, mảng vỏ và vân gãy, dấu mục, rêu, nứt than, chi tiết lễ, bố cục sheet và phép kiểm tra. `qa_report.json` lưu kết quả mở/giải mã PNG, kích thước, dải value, diện tích than hồng và chiều cao hero. Script kiểm tra sprite nguồn không bị cắt ở biên canvas.

Đã mở và xem từng PNG, đồng thời giải mã lại bằng Pillow. Đã sửa font thiếu dấu tiếng Việt, khung silhouette bị chật, canvas nguồn landmark và vân gỗ quá đều trong lượt duyệt hình.

## Tự phê bình theo rubric AD

| Tiêu chí | Tự chấm /5 | Nhận xét |
|---|---:|---|
| Đọc được | 4 | Hero 75 px tách nền rõ; lớp decal/prop có nhãn; cần duyệt tiếp trong cảnh chiến đấu đông. |
| Silhouette | 4 | Gầy, quặp, cao, nghiêng và hai thân phân biệt được bằng bóng đen; một số chạc vẫn còn nhịp cong procedural. |
| Giá trị sáng | 4 | Giữ ba tầng, hero +35.27 so với đất; lõi than V79.56. Hốc mục/than sâu là ngoại lệ có chủ ý. |
| Palette Act | 4 | Lục xám Moor, gỗ rêu ẩm, tro lam xám; cam chỉ ở biến thể vừa cháy. |
| Ánh sáng | 3.5 | Hướng chính và bóng gốc nhất quán; model 3D cần duyệt lại occlusion ở chạc giao nhau. |
| Vật liệu | 3.5 | Đọc được vân, đầu mục, mảng than; độ ướt và hình học vỏ chưa phong phú như render 3D sản xuất. |
| Theme | 4 | Có nghi lễ thất lạc, chiến tranh và thiên nhiên chiếm lại; landmark nguyên bản, không sao chép Inifuss. |

Đây là **concept sheet**, chưa phải sprite alpha, collider hay cây mờ thực thi trong game. Bước sản xuất tiếp theo là dựng 3D, render đúng camera và thử trên 3 nền cùng cảnh có quái/VFX theo rubric dự án. Không coi tự chấm này là kết quả duyệt gameplay cuối cùng.

## Nguồn đã đọc

- `legacy/art-direction/00_TOM_TAT_ART_DIRECTION.md`
- `legacy/art-direction/04_MAU_SAC_VA_ANH_SANG.md`
- `legacy/art-direction/05_HINH_KHOI_VAT_LIEU_CAMERA.md`
- `legacy/art-direction/12_QUY_CHUAN_QUAI_CANH_QUAN_CONG_TRINH.md`
- `legacy/art-direction/02_THEME_VA_CAU_CHUYEN.md`
- `legacy/art-direction/11_ACT1_PHAN_TICH_CHI_TIET.md`
- `legacy/art-output/diablo-concepts/concepts_a.py`, `concepts_b.py`, PNG Druid.
- `legacy/art-direction/reference/moor_campfire_terrain_concept.png`
- `legacy/art-output/mmo-hub-bloodmoor/01_establishing_iso.png`
- Chỉ đọc để đồng bộ: `legacy/art-output/rock-concepts/generate_rocks.py` và `01_act1_rock_family.png`; không ghi vào thư mục đá.
