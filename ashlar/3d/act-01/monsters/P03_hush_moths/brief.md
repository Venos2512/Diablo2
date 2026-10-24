# P03 Hush-Moths — A (họ W có cánh, một con bướm; bầy dựng bằng bản sao, 2026-10-22)

Concept: `concept.png` (chép từ `ashlar/art/act-01/monsters/P03_hush_moths/vA/concept_r2b.png`, 2172×724: H, 3/4, LEFT, RIGHT, FRONT, BACK).
Canon (checklist P03, `concept_r2b.prompt.txt`): bầy bướm đêm nhạt màu, cánh mềm; bụi cánh làm mắt nặng trĩu (làm chậm). Act I Poppy Reach, Garden of Hush, Cradle. Concept định nghĩa MỘT con bướm; bầy là các bản sao, vùng bầy không vẽ.

## Tỉ lệ đo trên concept (H = bóng người 506 px)
- Điểm cao nhất là chóp râu 0,33 H; chóp cánh trước 0,29 H; sải cánh ~0,75 H; đỉnh lông cổ 0,21 H; mắt 0,16 H; thân từ mặt đến chóp bụng ~0,24 H.
- Vạch concept "top 0.14H" (đánh dấu đỉnh thân, không phải cánh) và "wingspan 0.25H" (vạch vẽ dài 0,58 H) không khớp hình vẽ: giữ tỉ lệ hình vẽ; kích thước trong game (sải 0,25 H) đặt lúc import.

## Silhouette, vật liệu, màu
- Cánh trắng vải lanh #E8E1D0 (chính), phấn xám tím #8F8796 ở gốc cánh và viền ngoài; mỗi cánh một đốm mắt đỏ anh túc #B3262A (nhấn), cánh trước đốm lớn, cánh sau đốm nhỏ, hai mặt cánh như nhau.
- Thân mập lông xù: cổ lông trắng và yếm nhọn trước ngực; bụng xám tím (#8F8796, phụ) vài đốt lớn thon về chóp tù.
- Đầu nhỏ tròn lún trong lông, hai mắt to đỏ nâu sẫm; hai râu lông chim dẹt hình lá; sáu chân mảnh xám tím sẫm.

## Bất đối xứng
- Không có. LEFT và RIGHT là ảnh lật của nhau.

## Phần Tripo khó dựng và cách xử lý
- Cánh mỏng: cánh đặc, có độ dày và viền dày, gân vẽ thành vài nét lớn.
- Râu lông chim: mỗi râu một mảng dẹt hình lá, có độ dày, không sợi.
- Lông xù: vài búi lớn mép gọn, không sợi.
- Chân mảnh: thanh dày vừa đủ dựng, khớp tròn, đầu tù; góc bên chỉ thấy ba chân gần.
- Concept vẽ cánh ở góc bên như mặt cánh giơ lên sau lưng và thấy chân xa: bỏ, theo dáng trưng cánh.

## Dáng cho Tripo
Họ W (template `creature_pose.blocks.md` mục `W front_back` / `W sides`, đã chạy thử trên W02): bốn cánh xoè trong một mặt phẳng đứng ngay sau ngực, mép trước cánh trước nâng ~17°; FRONT thấy trọn mặt dưới, BACK trọn mặt trên, cùng bốn đốm mắt; góc bên cánh gần chĩa thẳng vào camera thành một cột hẹp. Sáu chân đứng đều, thân nằm, đầu nhìn thẳng.
Rig: dự kiến route M (rig tay; cánh hai xương mỗi bên).
