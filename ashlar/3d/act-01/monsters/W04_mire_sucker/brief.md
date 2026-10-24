# W04 Mire-Sucker — B (họ W có cánh, côn trùng sáu chân, 2026-10-22)

Concept: `concept.png` (chép từ `ashlar/art/act-01/monsters/W04_mire_sucker/vB/concept_r2.png`, 2172×724: H, 3/4, LEFT, RIGHT, FRONT, BACK).
Canon (checklist W04, `concept_r2.prompt.txt`): ruồi hút máu phình to bằng con mèo, bụng đỏ căng; bay vào hút máu, no thì nổ. Act I Night Fens. Bản B: chân cà kheo, ngực cao, bụng dài hai thuỳ hướng ra sau xuống dưới, cánh nửa nâng chữ V, vòi dài chĩa trước.

## Tỉ lệ đo trên concept (H = bóng người 497 px)
- Chóp cánh 0,87 H (điểm cao nhất); đỉnh mào gai ngực 0,69 H; mắt 0,55 H; chân rời ngực 0,52 H; khớp chân 0,40–0,46 H; thuỳ bụng 0,50 → 0,21 H.
- Góc bên: mũi vòi đến chóp bụng 0,69 H; vòi chĩa xuống ~40°, mũi ở 0,35 H. FRONT concept vẽ mũi vòi 0,24 H: giữ số góc bên.
- FRONT/BACK: hai chóp cánh cách 0,65 H, mũi chân ngoài cùng cách 0,56 H, hai thuỳ rộng 0,24 H.
- Vạch "body 0.38H" và canon "bằng con mèo" không khớp hình vẽ: giữ tỉ lệ hình vẽ; kích thước trong game đặt lúc import.

## Silhouette, vật liệu, màu
- Chitin nâu than bùn #4A3526 (chính) vẽ có sáng nâu vàng; hai thuỳ bụng đỏ máu #B3262A (phụ), trơn, không bóng; cánh xám khói #A9B1A6 (nhấn).
- Đầu nhỏ, hai mắt kép lồi đỏ nâu, vương miện ba gai; một vòi dày thuôn, mũi tù.
- Ngực gù bằng các tấm chữ V, mào ~5 gai tù.
- Mỗi bên hai lá cánh hẹp (trên dài, dưới ngắn), sống cánh trước nâu dày có vài gai tù.
- Sáu chân cà kheo ba cặp đối xứng, khớp u, vài cựa gai tù.

## Bất đối xứng
- Không có. LEFT và RIGHT là ảnh lật của nhau.

## Phần Tripo khó dựng và cách xử lý
- Cánh trong suốt: đổi thành cánh đặc màu #A9B1A6, sống dày, gân vẽ thành nét lớn.
- Vòi kim: một gai dày thuôn, mũi tù.
- Chân mảnh, gai nhỏ: thanh dày đủ dựng, gai ít và tù; luật chân họ A: không chân mờ, mọi mũi chân trên một đường đất, góc bên chỉ ba chân gần.
- Concept vẽ cánh quét ra sau ở góc bên và thấy chân xa: bỏ.

## Dáng cho Tripo
Họ W (template `creature_pose.blocks.md` mục `W front_back` / `W sides`, đã chạy thử trên W02 và Tripo dựng sạch): bốn lá cánh trong một mặt phẳng đứng ngang ngực, nâng chữ V ~45° như concept; FRONT thấy trọn mặt dưới, BACK trọn mặt trên; góc bên cánh gần chĩa thẳng vào camera thành một cột hẹp trên ngực. Sáu chân đứng đều, thân giữ dáng concept, vòi chĩa trước xuống.
Rig: hexapod (nếu có preset) hoặc route M.
