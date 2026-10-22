# W02 Gibbet-Crow — B (họ W có cánh, mẫu thử dáng xoè cánh trung tính, 2026-10-22)

Concept: `concept.png` (chép từ `ashlar/art/map-01-concepts/monsters/W02_gibbet_crow/vB/concept_r2b.png`, 2171×724: H, 3/4, LEFT, RIGHT, FRONT, BACK).
Canon (checklist W02, `concept_r2b.prompt.txt`): quạ ăn xác quá cỡ, đầu hói hồng, lông bết hắc ín từ giá treo cổ; bổ nhào theo đàn, mổ, rút lui rồi quay lại. Act I nghĩa trang, Act II Pilgrim Road. Bản B: dáng gù kiểu kền kền, cổ ngắn, đầu thấp, đùi lông xù ("quần"), cánh như áo choàng nửa mở.

## Tỉ lệ đo trên concept (H = bóng người 498 px)
- Đỉnh đầu 0,32 H; đỉnh khối cánh choàng 0,40 H; vạch concept "standing 0.36H".
- Thân từ mũi mỏ đến chóp đuôi 0,50 H (vạch "body 0.50H"; hình vẽ 0,57 H gồm cả cánh choàng phía sau).
- Mỗi cánh dài ~0,43 H (vai đến chóp). Concept ghi "wingspan 0.80H" cho cánh nửa mở rủ xuống (vẽ 0,78 H). Xoè hẳn thì sải ~0,95 H: giữ kích thước cánh theo hình vẽ, không theo vạch.
- Ngực rộng ~0,22 H, tâm hai bàn chân cách ~0,23 H trong concept (dáng chuẩn: 0,20 H).

## Silhouette, vật liệu, màu
- Đầu hói hồng đỏ #A8686A (phụ), cổ ngắn, vòng lông xù quanh gốc cổ; mỏ móc ngắn dày màu xương #D8CCB0 (nhấn); lông đen hắc ín #17151A (chính), vẽ như concept: đen than có viền xám nâu.
- Đùi phủ lông xù, cẳng chân vảy nâu xám tối, ba ngón trước một ngón sau, móng cong tối.
- Lông là vài mảng lớn bết dính, không vẽ từng sợi; bề mặt vẽ tay ít chi tiết, khối sáng tối rõ.

## Bất đối xứng
- Không có. LEFT và RIGHT là ảnh lật của nhau.

## Phần Tripo khó dựng và cách xử lý
- Cánh choàng rủ xuống che chân (concept): đổi thành dáng xoè trưng (display) để rig được và chân lộ rõ; có khe nền giữa cánh và chân.
- Lông rời, mỏng: gom thành 5-6 nhóm lông lớn mỗi cánh, chóp tù tách rời, 4 lông "ngón" ở chóp cánh; cánh có độ dày, mép trước dày.
- Chân bước (góc bên concept): hai chân đứng cạnh nhau, góc bên chỉ thấy một chân.
- Đuôi concept bị cánh che: thêm đuôi ngắn 5 lông lớn hướng ra sau (canon "tail straight back").

## Dáng cho Tripo
Họ W, dáng xoè cánh trung tính (template `creature_pose.blocks.md` mục `W front_back` / `W sides`, bản nháp tinh chỉnh cho mẫu này): hai cánh xoè hẳn sang hai bên trong MỘT mặt phẳng đứng ngay sau vai (như đại bàng huy hiệu, cốc phơi cánh), mép trước nâng 15-20°; FRONT thấy trọn mặt dưới cánh, BACK thấy trọn mặt trên; góc bên cánh gần chĩa thẳng vào camera (thấy đầu cánh như tay T-pose nhìn ngang). Chân thẳng dưới thân, ngón phẳng, đầu nhìn thẳng, mỏ khép, đuôi chĩa ra sau. Dự phòng nếu mất nhận diện: cánh nửa mở như concept nhưng nhấc khỏi chân, có khe nền.
Rig: Tripo không có preset chim; dự kiến route M (rig tay).
