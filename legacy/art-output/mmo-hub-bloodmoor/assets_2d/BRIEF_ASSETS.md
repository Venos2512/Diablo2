# Brief — Asset 2D cho trại "Tiền đồn Đồng hoang" (mỗi asset MỘT ảnh duy nhất)

Dùng công cụ TẠO ẢNH (image generation) của bạn. Nếu không có công cụ tạo ảnh thật, DỪNG và báo lại. Không vẽ bằng code/procedural.

## Nguyên tắc quan trọng nhất
**Mỗi asset = đúng 1 ảnh**, gom TẤT CẢ góc nhìn, biến thể, module và trạng thái của asset đó vào chung một sheet. Không tách thành nhiều ảnh lẻ.

`asset_01_cart_turnaround.png` ĐÃ XONG và ĐẠT — không gen lại. Dùng nó làm **chuẩn bố cục và style** cho các sheet còn lại: nền xám phẳng, ánh sáng studio trung tính, mức chi tiết thấp, silhouette người xám để so tỷ lệ, các góc xếp hàng đều.

## Ảnh mẫu (đính kèm, nằm trong `_refs/` và thư mục này)
- `asset_01_cart_turnaround.png` — chuẩn bố cục sheet.
- `ref_v3_bonfire.png`, `ref_v3_market.png` — chuẩn style trại: chi tiết thấp, palette lạnh lục-xám, gỗ sẫm, vải xám-nâu bạc màu, lửa cam.
- `ref_ingame.png` — chuẩn góc camera game.

Thiết kế bản gốc; không tên, logo hay asset Blizzard.

## Quy định chung
- **Nền** trung tính phẳng xám đậm #3A3A3A, không cảnh vật.
- **Ánh sáng** studio trung tính lạnh nhẹ từ trên-trái, đồng nhất; chỉ bóng tiếp xúc mềm. Lửa được tự phát sáng.
- **Mức chi tiết thấp** như sheet xe:
  - mảng lớn, màu phẳng, chuyển sắc mềm;
  - không vân gỗ li ti, không từng sợi vải, không từng lá cỏ.
- **Vật liệu:** gỗ ướt nâu-xám sẫm, sắt gỉ xỉn, vải thô xám-nâu có vá, bùn nâu sẫm, cỏ lục tối ngả xám.
- **Silhouette người xám cao 1.8 m** đặt ở bên trái hàng đầu tiên (trừ sheet texture).
- **Không chữ, nhãn, số, watermark.** Tên các góc ghi trong README.
- **Tỷ lệ 16:9.** Sheet có nhiều hàng thì chia hàng đều, các vật cùng tỷ lệ, không chồng nhau.
- **"Góc game"** = 3/4 từ trên xuống ~50–60° như `ref_ingame.png`.
- **"5 góc chuẩn"** = chính diện · cạnh bên · mặt sau · góc game · nhìn từ trên xuống (trái → phải).

## 6 ảnh cần gen (mỗi cái 1 ảnh)

1. `asset_02_tent_sheet.png` — **Lều vải**, tất cả trong một ảnh:
   - Hàng trên: lều lính tiêu chuẩn (khung cọc gỗ, vải vá, dây chằng xuống cọc đất, cửa mở một bên) ở 5 góc chuẩn.
   - Hàng dưới: 3 biến thể ở góc game — lều nhỏ một người, lều chợ mái che hở ba mặt có quầy, lều chỉ huy lớn có cờ rách.
2. `asset_03_campfire_sheet.png` — **Lửa trại lớn trung tâm** (vòng đá to, củi xếp chóp, tro quanh chân), một ảnh:
   - Hàng trên: đang cháy ở 5 góc chuẩn.
   - Hàng dưới, ở góc game: 3 trạng thái — chưa đốt, đang cháy, tàn (than hồng âm ỉ + khói).
3. `asset_04_grass_sheet.png` — **Cụm cỏ đồng hoang**, một ảnh. 6 biến thể: thấp, cao, úa vàng-xám, bị giẫm rạp, lẫn đá rêu nhỏ, bụi thấp có ít hoa dại trắng.
   - Hàng trên: nhìn ngang.
   - Hàng giữa: góc game.
   - Hàng dưới: nhìn từ trên xuống.

   Cỏ thành cụm khối, không từng lá.
4. `asset_05_palisade_wall_sheet.png` — **Tường cọc gỗ cao** ~3–4 m (cọc tròn vót nhọn, buộc dây, đai ngang, chống chéo phía trong), một ảnh. 6 module: đoạn thẳng, góc trong, góc ngoài, đầu tường, đoạn vá (cọc mới sáng màu hơn), đoạn có tên cắm.
   - Hàng trên: chính diện 6 module.
   - Hàng giữa: cùng 6 module ở góc game.
   - Hàng dưới: cạnh bên và mặt sau của đoạn thẳng (thấy thanh chống), cùng một khung nhìn từ trên xuống.
5. `asset_06_wooden_fence_sheet.png` — **Rào gỗ thấp** ~1–1.2 m (cọc đứng + 2 thanh ngang, gỗ thô), một ảnh. 4 module: đoạn thẳng, góc, cổng nhỏ mở, đoạn gãy đổ.
   - Hàng trên: chính diện.
   - Hàng giữa: cạnh bên.
   - Hàng dưới: góc game.
6. `asset_07_ground_texture_sheet.png` — **Texture đất nền**, một ảnh 16:9:
   - Bên trái: 3 ô vuông texture top-down, ánh sáng phẳng (albedo-like), chi tiết thấp, mảng lớn, cố gắng liền mạch 4 cạnh:
     - (a) bùn ướt nâu sẫm có vài vũng nông và vết bánh xe mềm;
     - (b) nền cỏ đồng hoang lục tối ngả xám lẫn đất;
     - (c) chuyển tiếp bùn ↔ cỏ bị giẫm.
   - Bên phải: một ô lớn ở góc game, áp 3 chất liệu đó lên một mảng đất có lửa trại nhỏ chiếu sáng, để thấy texture đọc thế nào trong game.

## Bàn giao
- Lưu ảnh vào `legacy/art-output/mmo-hub-bloodmoor/assets_2d/` với đúng tên file. **Copy ngay sau khi mỗi ảnh đạt**, đừng đợi đến cuối.
- Không sửa file khác, không commit, không động vào `asset_01_cart_turnaround.png` hay thư mục v1/v2/v3.
- Viết `assets_2d/README.md`: mỗi ảnh (gồm cả asset_01) ghi prompt và tên từng góc/module theo thứ tự trái → phải, trên → dưới.
- Tự kiểm tra theo checklist dưới đây. Ảnh trượt thì gen lại tối đa 2 lần:
  - Đúng 1 ảnh/asset, đủ góc/module.
  - Khớp style sheet xe: chi tiết thấp, nền xám phẳng.
  - Cùng tỷ lệ.
  - Không chữ.
- Báo cáo cuối: đường dẫn ảnh, đạt/chưa đạt, điểm yếu.
