# QA rig và animation

Dùng trước các cổng G2, G3, G4 của [`Agent.md`](Agent.md). Ngưỡng *(đề xuất)* là khởi điểm.
Mỗi mục ghi **đạt / không đạt** và đường dẫn bằng chứng trong `rig/qa/`. Còn mục đỏ thì không qua cổng.

## A. Rig (trước G2)

### A1. Kiểm tự động (`rig/validation.json`)

| # | Kiểm tra | Ngưỡng |
| --- | --- | --- |
| A1.1 | Một skin, một mesh thân | đúng |
| A1.2 | Tên bone đúng `SKELETON_STANDARD.md`, không trùng tên | đúng |
| A1.3 | Phân cấp một cây, `root` là gốc duy nhất | đúng |
| A1.4 | Mọi đỉnh có ít nhất một trọng số | 0 đỉnh trống |
| A1.5 | Tổng trọng số mỗi đỉnh | 1 ± 1e-6 |
| A1.6 | Số ảnh hưởng mỗi đỉnh | ≤ 4 |
| A1.7 | Chỉ số joint nằm trong khoảng | đúng |
| A1.8 | Ma trận bind nghịch đảo khớp phân cấp | sai số ≤ 1e-5 |
| A1.9 | Mesh khi import lại khớp mesh đầu vào đã scale | khoảng cách đỉnh ≤ 1e-4 m |
| A1.10 | Texture không đổi so với GLB gốc | byte giống nhau |
| A1.11 | Chiều cao bounds | trong ±2% chiều cao danh mục |
| A1.12 | Chân chạm đất | y thấp nhất = 0 ± 0,01 m |
| A1.13 | Bone không trọng số còn lại | chỉ socket (bản game) |
| A1.14 | Scale object = 1, không scale âm, xoay đã áp dụng | đúng |

Bản thử Sorceress đã tự động hoá phần lớn các mục này (`validate_rig.py`); mục A1.11–A1.14 là bổ sung cho quy trình chung.

### A2. Ảnh QA (người xem)

Các ảnh trong `rig/qa/`, mỗi ảnh ghép ba góc (trước, bên, sau hoặc 3/4):

- [ ] **Skeleton chồng mesh**: khớp vai, khuỷu, cổ tay, hông, gối, cổ chân nằm trong thân, không lệch khỏi khối.
- [ ] **Bản đồ trọng số** (tổng thể và theo từng bone chính): không có vùng "loang" qua bone xa (tay dính thân, váy dính chân).
- [ ] **Tư thế thử**: tay giơ cao, tay vắt ngang, ngồi xổm, bước dài, xoay thân ±45°, cúi, ngửa đầu. Soi: vai bị gập,
      nách bị xẹp, khuỷu và gối bị "ống nước", hông bị lòi, áo choàng xuyên chân.
- [ ] **Vùng khó của asset** (ghi trong brief): ngón tay dính khối, mũ nhọn, tai to, tay mảnh, xích, váy.
- [ ] **Socket**: vũ khí đặt vào tay đúng trục, quay cùng tay.

## B. Clip (trước G3)

### B1. Kiểm tự động

| # | Kiểm tra | Ngưỡng |
| --- | --- | --- |
| B1.1 | Mỗi state bắt buộc của họ có clip | đủ theo bảng ở `SKELETON_STANDARD.md` mục 5 |
| B1.2 | `autoClip` trong lab chọn đúng clip cho từng state | đúng |
| B1.3 | Loop kín (`idle`, `walk`, `run`, `block`): frame đầu và cuối | sai lệch xoay ≤ 1° mỗi bone chính *(đề xuất)* |
| B1.4 | Clip không root motion | `root` không đổi vị trí; dịch chuyển cho `cog` nằm trong thân |
| B1.5 | Clip dùng đúng bone, không key bone không tồn tại | đúng |
| B1.6 | Không có scale bone ngoài chủ ý | đúng |
| B1.7 | `stride_m` ghi trong `clips.json` cho `walk`, `run` | có |
| B1.8 | Clip xuất lại từ GLB chuyển động trùng clip gốc trong Blender | sai lệch đỉnh ≤ 1e-3 m |
| B1.9 | Nguồn và giấy phép từng clip ghi trong `clips.json` | đủ |
| B1.10 | `duration_s` = `(frame_end − frame_start) / fps`; `fps`, phạm vi và `sample_count` ghi tường minh | đúng |
| B1.11 | Mỗi Action có phạm vi riêng; khoảng phát của scene, preview và NLA khớp từng rig/Action/slot | đúng |
| B1.12 | Clip đã duyệt không bị ghi đè; bản sửa là Action mới, `status` ghi rõ | đúng |
| B1.13 | Thời điểm sự kiện gameplay đã duyệt giữ nguyên qua bản sửa | đúng |
| B1.14 | Sau khi lưu và **mở lại** file: chuyển Action và Play thường chạy đúng, viewport có texture đọc được | đúng |

### B2. Ảnh dải (strip) và trong lab

- [ ] **Dải ảnh mỗi clip** (khoảng 8–12 khung, hai góc): đọc được chuyển động, không có khung nhảy, không có biến dạng giữa chu kỳ.
- [ ] **Trượt chân** trong lab (tab Character, đo chân chạm đất): `walk`, `run` ở mức xanh hoặc vàng, không đỏ. Nếu đỏ: sửa
      `stride_m` hoặc clip.
- [ ] **Điểm trúng**: sự kiện `hit` của lab (`hitAt`) rơi vào khung chạm đòn; sai thì chỉnh clip hoặc ghi giá trị khác trong inventory.
- [ ] **Death** dừng ở pose cuối, không bật lại; **revive** về lại idle mượt.
- [ ] **Chuyển tiếp** idle ↔ walk ↔ run ↔ attack không bật giật khi crossfade.
- [ ] **Xuyên mesh**: tay xuyên thân, vũ khí xuyên chân, áo choàng xuyên chân trong các pose cực của từng clip.
- [ ] **Tiếp xúc chân với sàn** đo bằng hình học đế giày sau biến dạng, không chỉ vị trí bone; không lún, không lơ lửng ngoài chủ ý.
- [ ] **Nhìn khung lân cận** của mọi khung trông hỏng: nội suy, constraint, phạm vi phát, trước khi thêm key.
- [ ] **Đường nối vòng lặp** (khung cuối → khung đầu) của `idle`, `walk`, `run`: không đổi tốc độ, không giật bàn chân.
- [ ] **Góc không có trong tham chiếu** (nếu clip dựng từ video): soi các góc video không thấy.
- [ ] **Silhouette**: pose chính của `attack` và `cast` đọc được ở góc nhìn trên xuống của game (camera ARPG), không chỉ góc chính diện.

## C. Bản xuất, bản lab/game (trước G4)

### C1. Reimport sạch (theo `blender-game-animation`)

- [ ] Chép toàn bộ bản giao sang **thư mục mới**, import vào scene trống (không để đường dẫn trỏ về máy tác giả).
- [ ] Số bone runtime khớp bản nguồn; không có helper, cảnh lạ, Action thư viện đang tắt.
- [ ] Skin còn đủ, tổng trọng số = 1, tối đa 4 ảnh hưởng (bản runtime).
- [ ] Texture đủ, đường dẫn tương đối, một bộ texture.
- [ ] Độ dài và `sample_count` từng clip khớp manifest (không suy từ độ dài làm tròn).
- [ ] Pose lấy mẫu (khung đầu, tiếp xúc, trúng đòn, khung cuối) khớp bản nguồn trong cùng hệ toạ độ, trong ngưỡng đã ghi. Bỏ qua
      đỉnh nhân đôi ở đường nối UV/normal; không so theo chỉ số đỉnh thô.
- [ ] Nếu sửa mesh vĩnh viễn: đã kiểm trên mọi Action bị ảnh hưởng.
- [ ] Nếu model và clip là file riêng: cùng bind basis, pose đánh giá trên model thật khớp (kể cả khung đầu).

### C2. Lab/game

- [ ] GLB bản lab nhẹ (texture 2048), kích thước thật, đăng ký trong `samples.json`, mở được trong lab.
- [ ] Số bone, số tam giác, dung lượng ghi vào `ANIMATION_INVENTORY.md`.
- [ ] Chạy cả bộ state trong lab: không state nào im lặng (thiếu clip) trừ các state tuỳ chọn.
- [ ] Hiệu năng: nhân bản nhiều bản (đám đông) không tụt khung bất thường. Dùng bài stress test của lab.
- [ ] Cột "Bản trong lab" ở `ashlar/3d/README.md` và dòng inventory đã cập nhật.

## D. Kết luận mỗi cổng

Ghi vào `rig/rig.log`:

```text
<ngày> <cổng G2|G3|G4> <asset_id>: PASS | NEEDS_CHANGES
Bằng chứng: rig/qa/...
Mục không đạt: ...
Người duyệt: ...
```
