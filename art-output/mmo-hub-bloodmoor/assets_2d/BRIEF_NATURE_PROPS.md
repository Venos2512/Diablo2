# Brief — Asset 2D cảnh quan đồng hoang: đá, đá rêu, xác quái chìm, cây khô, cây cháy (mỗi asset MỘT ảnh)

Dùng công cụ TẠO ẢNH (image generation). Nếu không có công cụ tạo ảnh thật, DỪNG và báo lại. Không vẽ bằng code/procedural.

## Nguyên tắc quan trọng nhất
**Mỗi asset = đúng 1 ảnh 16:9**, gom TẤT CẢ góc nhìn, biến thể và trạng thái vào chung một sheet. Không tách ảnh lẻ.

Không ghi đè hay sửa bất kỳ file nào đã có (asset_01 → asset_07, v1/v2/v3, rock-concepts, tree-concepts, bone-concepts).

## Ảnh mẫu (đính kèm theo thứ tự)
1. `asset_01_cart_turnaround.png` — **chuẩn bố cục sheet**: nền xám phẳng, ánh sáng studio trung tính, chi tiết thấp, silhouette người xám so tỷ lệ, các góc xếp hàng đều.
2. `asset_05_palisade_wall_sheet.png` — chuẩn sheet nhiều module/hàng, gỗ sẫm ướt.
3. `ref_v3_bonfire.png` — **chuẩn style**: chi tiết thấp, palette lạnh lục-xám, gỗ sẫm, lửa cam chỉ là điểm nhỏ.
4. `asset_07_ground_texture_sheet_v2.png` — chuẩn cỏ đồng hoang lá mảnh + bùn (dùng cho rêu/cỏ và đất chân vật thể).
5. `ref_ingame.png` — chuẩn **góc camera game**.

Thiết kế bản gốc; không tên, logo hay asset Blizzard.

## Quy định chung (giống sheet xe)
- **Nền** xám đậm phẳng #3A3A3A, không cảnh vật. Mỗi vật đặt trên một mảng đất/bùn nhỏ hình tròn dẹt ở chân (chỉ đủ để thấy tiếp xúc, chìm vào đất), không vẽ cả cảnh.
- **Ánh sáng** studio trung tính lạnh nhẹ từ trên-trái; bóng tiếp xúc mềm về dưới-phải. Không rim light, không bloom, không god-ray.
- **Chi tiết thấp**: mảng lớn, mặt cắt lớn, chuyển sắc mềm; không sạn li ti, không vân gỗ li ti, không từng lá cỏ. Đọc được bằng silhouette và 2–3 mảng sáng tối.
- **Chất liệu bán-thực** như v3, không stylized/hand-painted bóng sạch, không cartoon, không đá tròn trơn như cuội.
- **Palette Blood Moor (dùng mã HEX làm neo):**
  - Đá xám-lục: tối `#1B1F1C`, trung `#3E4638`, sáng `#6F6F5C`; đá nâu cánh đồng `#5A5040`.
  - Rêu `#505A3F` / `#454F3C`; cỏ lục tối ngả ô liu có vệt úa vàng-xám.
  - Gỗ khô/chết xám-nâu bạc `#454A40` → `#696B59`; gỗ cháy than lam-xám `#303942`, tro `#70777B`.
  - Xương ngà bẩn `#8A8370` → `#A49C86`, không trắng sạch; máu khô nâu-đỏ `#4A1A14` rất ít.
  - Cam than hồng `#D9822B` với lõi `#E7C890` **chỉ** ở cây vừa cháy, dưới 3% diện tích.
  - Độ bão hòa thấp; không màu tươi, không xanh lá tươi.
- **Silhouette người xám cao 1.8 m** ở bên trái hàng đầu tiên.
- **Không chữ, nhãn, số, watermark.** Tên từng ô ghi trong README.
- **"Góc game"** = 3/4 từ trên xuống ~50–60° như `ref_ingame.png`.
- **"4 góc"** = chính diện · cạnh bên · góc game · nhìn từ trên xuống (trái → phải).
- Mọi vật cùng tỷ lệ trên một sheet, không chồng nhau, chia hàng đều.

## 5 ảnh cần gen

1. `asset_08_rock_sheet.png` — **Đá / tảng đá đồng hoang** (đá xám-lục và nâu, khối gãy góc cạnh, vai mòn, có vết nứt lớn; chân đá chìm vào đất).
   - Hàng trên: **tảng lớn chuẩn** (~1.5–2 m) ở 4 góc.
   - Hàng giữa, góc game: họ kích thước — cụm đá vụn sát đất (decal), đá thấp ~0.5 m, tảng vừa ~1 m, tảng cao dựng đứng ~3 m, mép vách đá thấp dài.
   - Hàng dưới, góc game: 3 biến thể bố trí — cụm 3 tảng tựa nhau, đá phẳng nằm lộ trên cỏ, đá dựng nghiêng bị đất lấp một nửa.

2. `asset_09_mossy_rock_sheet.png` — **Đá có rêu và cỏ** (cùng ngôn ngữ khối với sheet 08). Rêu tụ ở mặt trên và chân phía ẩm/khuất sáng, cỏ đồng hoang lá mảnh mọc quanh chân và trong khe nứt — không phủ đều.
   - Hàng trên: một tảng rêu chuẩn ~1.5 m ở 4 góc.
   - Hàng giữa, góc game: 3 mức phủ — ít rêu (vài vệt), vừa (mặt trên + chân), nhiều (gần bị nuốt, cỏ cao che chân).
   - Hàng dưới, góc game: đá thấp nửa chìm có cỏ mọc qua khe; cụm đá nhỏ lẫn trong mảng cỏ; tảng phẳng có vũng nước mưa nông và rêu viền.

3. `asset_10_buried_corpse_sheet.png` — **Xác quái vật nhỏ chìm dưới đất** (quái nhỏ cỡ 0.6–1.1 m lúc sống: loài quỷ lùn có sừng, thú bốn chân như chó/linh cẩu méo mó, quái bò có vỏ). Kinh dị nhẹ (mức 2–3): **chủ yếu xương, da khô, giáp vỡ**, không ruột, không máu tươi. Đất/bùn và cỏ nuốt phần dưới.
   - Hàng trên: một xác chuẩn (quỷ lùn có sừng vùi nửa người, lồng ngực + sọ sừng + một tay vươn lên) ở 4 góc.
   - Hàng giữa, góc game: cùng loài quỷ lùn qua 3 giai đoạn — vừa ngã (còn da khô, giáo gãy cạnh), vùi nửa (xương lộ, bùn phủ), dấu tích cũ (chỉ còn sọ sừng và vài xương sườn nhô khỏi cỏ, có rêu).
   - Hàng dưới, góc game: xác thú bốn chân vùi nghiêng (sọ mõm dài + cột sống cong); xác quái bò có vỏ chìm úp (mảnh vỏ gãy nhô lên); cụm xương vụn rải trên bùn (decal phẳng).
   - Xương ngà bẩn ám bùn, không trắng; mọi xác đều thấp sát đất (≤0.5 m nhô lên).

4. `asset_11_dead_tree_sheet.png` — **Cây khô / cây chết** (gầy, quặp, vỏ xám-nâu bạc, cành chính thưa và gãy, không lá; rễ nổi bấu vào đất; rêu ở chân).
   - Hàng trên: một cây khô chuẩn ~4 m (thân xoắn, tán ngang quặp) ở 4 góc.
   - Hàng giữa, góc game: họ biến thể — cây non héo ~1.8 m, cây quặp ~3 m, cây cao xoắn ~5 m, cây nghiêng bật gốc, gốc cây mục thấp.
   - Hàng dưới, góc game: thân cây đổ nằm ngang, cụm cành khô rơi (decal), rễ bật khỏi đất, bụi gai khô thấp.
   - Silhouette rõ từng dáng; không mạng cành li ti.

5. `asset_12_burned_tree_sheet.png` — **Cây cháy** (cùng ngôn ngữ thân với sheet 11, cháy thành than).
   - Hàng trên: một cây cháy chuẩn ~4 m (thân than đen lam-xám, nứt vảy than lớn, cành cụt) ở 4 góc.
   - Hàng giữa, góc game: 3 trạng thái theo thời gian — **vừa cháy** (khe than hồng cam âm ỉ nhỏ, khói xám mỏng, tro quanh chân), **than nguội** (phủ tro xám, không lửa), **cháy cũ bị thiên nhiên chiếm lại** (thân đen có rêu và cỏ mọc quanh gốc).
   - Hàng dưới, góc game: gốc cây cháy cụt, thân cháy sụp gãy nằm, mảng tro/than vụn trên đất (decal phẳng).
   - Cam chỉ ở trạng thái "vừa cháy", nhỏ, không phát sáng lan rộng.

## Bàn giao
- Lưu vào `art-output/mmo-hub-bloodmoor/assets_2d/` đúng tên file. **Copy ngay khi mỗi ảnh đạt.**
- Không sửa file khác, không commit.
- Viết `assets_2d/README_NATURE_PROPS.md`: mỗi ảnh ghi prompt đã dùng và tên từng ô theo thứ tự trái → phải, trên → dưới.
- Tự kiểm tra từng ảnh, trượt thì gen lại tối đa 2 lần:
  - Đúng 1 ảnh/asset, đủ hàng và ô.
  - Khớp style sheet xe/v3: chi tiết thấp, nền xám phẳng, palette lạnh khử bão hòa.
  - Đá góc cạnh (không cuội tròn); cỏ lá mảnh (không lá tròn); xương ngà bẩn (không trắng); cam chỉ ở cây vừa cháy.
  - Cùng tỷ lệ, có silhouette người, không chữ.
- Báo cáo cuối: đường dẫn ảnh, đạt/chưa đạt, điểm yếu.
