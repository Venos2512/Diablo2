# Brief — Sửa sheet texture đất nền (asset_07, bản v2)

Dùng công cụ TẠO ẢNH (image generation). Nếu không có công cụ tạo ảnh thật, DỪNG và báo lại. Không vẽ bằng code/procedural.

Chỉ gen **một ảnh**: `asset_07_ground_texture_sheet_v2.png` (16:9). **Không ghi đè** `asset_07_ground_texture_sheet.png` cũ. Không động vào file khác.

## Ảnh mẫu đính kèm
- `asset_07_ground_texture_sheet.png` (bản cũ) — giữ **bố cục**: 3 ô vuông bên trái, ô xem thử góc game có lửa trại bên phải. Ô xem thử bản cũ khá tốt.
- `ref_v3_bonfire.png`, `ref_v3_market.png` — **chuẩn mặt đất** cần đạt: cỏ đồng hoang lục tối, bùn ướt, vũng nước phản chiếu mềm, mức chi tiết thấp.
- `ref_ingame.png` — cỏ dày tối màu kiểu gameplay ARPG.

## Lỗi của bản cũ, phải sửa
1. **Tile cỏ sai loại cây:** đang là lá tròn/lá rộng như cỏ ba lá, rau, cây bụi. Sai hoàn toàn.
   → Phải là **cỏ đồng hoang lá mảnh như sợi**, mọc dày thành **mảng/lớp**, đổ rạp theo gió và bị giẫm. Lục tối ngả xám-ô liu, lẫn vệt úa vàng-xám và đất nâu lộ ra. Không lá tròn, không hoa, không bụi cây.
2. **Không liền mạch:** mép các tile còn lộ đường nối, mảng to bị cắt ở mép.
   → Mỗi tile phải **seamless 4 cạnh**:
   - không có vật thể lớn hay vệt đặc biệt nằm ở mép;
   - phân bố đều;
   - độ sáng trung bình đồng nhất khắp tile, không có góc tối hay góc sáng.
3. **Hơi stylized/hand-painted:**
   → Chất liệu bán-thực (semi-realistic) như mặt đất trong ảnh v3, nhưng vẫn **chi tiết thấp**: mảng lớn, chuyển sắc mềm, không sạn li ti.

## Nội dung sheet
**Bên trái — 3 ô vuông top-down**, ánh sáng phẳng (albedo-like, không đổ bóng định hướng):
- (a) **Bùn ướt:**
  - nâu sẫm ngả xám;
  - 2–3 vũng nước nông phản chiếu trời xám mờ, nằm gọn trong tile, không chạm mép;
  - vết bánh xe/vết chân mờ chạy chéo, liền mạch qua mép.
- (b) **Cỏ đồng hoang:** như mô tả ở mục 1. Khoảng 70% cỏ, 30% đất lộ thành vệt nhỏ.
- (c) **Chuyển tiếp bùn ↔ cỏ bị giẫm** (khu đông người qua lại):
  - cỏ rạp, dập, lẫn bùn;
  - khoảng 50/50;
  - cùng palette với (a) và (b).

**Bên phải — ô xem thử góc game** (3/4 từ trên xuống ~50–60°):
- áp 3 chất liệu lên một mảng đất;
- có lửa trại nhỏ ở giữa tạo vũng sáng cam nhỏ;
- phần còn lại lạnh, tối như đêm trong v3;
- cỏ đọc là cỏ đồng hoang.

## Palette
- Bùn #3A2E24 → #4A3A2A.
- Cỏ #3E4638 → #4C5440, vệt úa #6F6F5C.
- Nước phản chiếu xám lạnh #5E6A72.

## Quy định chung
- Nền sheet xám phẳng #3A3A3A.
- Không chữ, nhãn, số, watermark.

## Bàn giao
- Lưu `art-output/mmo-hub-bloodmoor/assets_2d/asset_07_ground_texture_sheet_v2.png`. Copy ngay khi đạt.
- Thêm một mục "asset_07 v2" vào cuối `assets_2d/README.md` kèm prompt đã dùng. Không xóa nội dung cũ.
- Tự kiểm tra theo checklist dưới đây. Trượt thì gen lại tối đa 2 lần:
  - Cỏ lá mảnh, không lá tròn.
  - Mép tile không lộ đường nối rõ.
  - Chi tiết thấp.
  - Ô xem thử lạnh-tối với vũng lửa nhỏ.
  - Không chữ.
- Báo cáo: đạt/chưa đạt, điểm yếu.
