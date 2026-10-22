# W07 Shroud-Spinner — A (họ A nhiều chân, mẫu thử dáng nghỉ trung tính, 2026-10-22)

Concept: `concept.png` (chép từ `ashlar/art/map-01-concepts/monsters/W07_shroud_spinner/vA/concept_r2.png`, 1536×1024: H, 3/4, LEFT, RIGHT / H, FRONT, BACK).
Canon (checklist W07, prompt `concept_r2.prompt.txt`): nhện nhạt màu quấn xác bằng tơ như vải liệm; mạng làm chậm, độc, đẻ túi trứng trong xác. Act I (Flint Delvings, Garden of Hush). Có tùy chọn cho người sợ nhện (LD §8.4): thiết kế giữ trơn, không lông, ít chi tiết.

## Tỉ lệ đo trên concept (H = bóng người, 347–353 px)
- Cao toàn thân 0,78 H (đỉnh bụng đến mũi chân). Bụng gần tròn, ngang ~0,58 H, là điểm cao nhất; đáy bụng cách đất ~0,19 H.
- Góc bên: dài 1,12 H từ mũi chân trước đến mũi chân sau (canon "leg span 1.15H").
- Góc FRONT/BACK: mũi chân trái ngoài cùng đến phải ngoài cùng ~1,55 H, rộng hơn vạch "leg span 1.15H" mà chính concept vẽ (vạch dài 1,3 H). Giữ dáng xoè thấp của concept (dấu hiệu của bản A); kích thước trong game đặt lúc import theo canon.
- Đầu ngực nhỏ gọn ~0,25 H, nằm trước và thấp hơn bụng.

## Silhouette, vật liệu, màu
- Ba khối: bụng tròn to quấn hai dải tơ rộng, đầu ngực nhỏ, tám chân dài ba đốt (đốt trên lên gối cao, đốt giữa xuống khớp vòng, đốt bàn thon nhọn chạm đất).
- Chitin xám tro #6F6A62 (chính), tơ liệm ngà #D8CCB0 (phụ), hai mắt vàng sữa #C9B458 (nhấn). Chân nâu xám ấm hơn, tối hơn (#65574B đo trên concept).
- Bề mặt vẽ tay mảng lớn, ít chi tiết; có khối sáng tối rõ.

## Bất đối xứng
- Không có. Concept vẽ dải tơ xoắn không khớp giữa các góc (tranh 2D). Chốt một cách quấn đối xứng: hai vòng tơ quanh bụng chéo nhau thành chữ X ở mỗi bên hông, nên RIGHT là ảnh lật của LEFT.

## Phần Tripo khó dựng và cách xử lý
- Chân mờ, nhạt, trong suốt ở concept (cách vẽ chân xa): bỏ; chân nào thấy thì đặc, cùng màu.
- Mũi chân nhọn như kim: giữ đầu tù, chân dày (đốt trên khoảng 1/5 bề ngang bụng).
- Gai nhỏ trên sống bụng: vài u thấp, tù.
- Dải tơ: dán sát bụng, không đuôi tơ, không sợi, không mạng nhện.
- Chân chồng lên nhau ở góc FRONT/BACK là không tránh được: vẽ đặc, chân gần che chân xa. Góc bên chỉ thấy bốn chân gần, chân xa nằm đúng sau chân gần.

## Dáng cho Tripo
Họ A, dáng nghỉ trung tính (template `creature_pose.blocks.md` mục `A front_back` / `A sides`, bản nháp viết cho mẫu này): tám mũi chân trên một đường đất, chân xoè đều và đối xứng, thân nằm ngang, đầu nhìn thẳng, nhìn ngang trực giao. Rig dự kiến: Tripo `octopod` (model v2.5) hoặc rig tay route M.
