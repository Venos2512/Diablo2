# Rig brief — FL_flagellant_vA

Theo [`templates/rig_brief.md`](../../../rig-anim/templates/rig_brief.md). Quy trình: [`Agent.md`](../../../rig-anim/Agent.md).

> **Bản xem trước chuyển skeleton theo yêu cầu, không phải rig sản xuất đã qua mọi cổng.** Người dùng yêu cầu ngày 2026-10-21:
> "dùng blender mapping xương từ sorceress d2r-sorceress.glb sang flagellant FL_flagellant_vA.glb". Giữ nguyên tên bone
> Sorceress là chủ ý; chưa chuyển sang tên chuẩn của `SKELETON_STANDARD.md`. **Nội bộ lookdev, không phát hành** (skeleton D2R là
> tài sản Blizzard, `Agent.md` §6 và §9.1). Chưa có clip thật, chưa tích hợp game.

## Thông tin asset

| Mục | Giá trị |
| --- | --- |
| `asset_id` | `FL_flagellant_vA` |
| Nhóm / loại | hero |
| Họ quái ASHLAR (nếu quái) | – |
| GLB gốc | `../FL_flagellant_vA.glb` (20,7 MB, 10.488 tam giác, SHA-256 `40642eba…09b10ad`, không bị sửa) |
| Chiều cao thật (danh mục) | ~1,8 m (H); mesh nhân 1,8 từ chuẩn hoá 1 m của Tripo. Đo sau rig: 1,799 m |
| Tư thế gốc | T-pose |
| Lỗi đã biết của mesh | ngón tay dính thành khối (bàn tay cong như găng, xương ngón có trọng số nhưng không cử động từng ngón); góc RIGHT có 9/10 nút; roi xích và sắt nung chưa dựng |

## Quyết định rig

| Mục | Lựa chọn | Lý do |
| --- | --- | --- |
| Họ skeleton | **H** (humanoid người lớn) | hero FL |
| Route | **T** (chuyển từ skeleton mẫu): *template retarget (Sorceress D2R)* | người dùng yêu cầu rõ route này trong yêu cầu gốc (G1 ngầm định là đã cho phép; không tốn credit) |
| Công cụ cụ thể | Blender 5.2.2 chạy nền; mẫu `rig/refs/d2r-sorceress.glb` (181 bone, 14 mesh skin, không có animation); script ở `rig/scripts/` (`rig_fit.py` đặt khớp, `skin.py` trọng số, `build_rig.py` xuất) | |
| Ước tính credit | không tốn (không dùng dịch vụ trả phí) | |
| Bone ngón tay | **có** (giữ toàn bộ bone ngón của mẫu) | giữ đủ 181 bone là chủ ý; vì mesh dính ngón nên bàn tay cử động như một khối |
| Bone phụ cần giữ | váy (front 6, back L/R 5, side L/R 4), charm dọc dây mười nút, tóc, đệm vai, xương xoắn cẳng tay | giữ nguyên bộ mẫu để tương thích clip D2R |
| Bone mặt | **có** (mặt, mi, môi, hàm), nhưng không có trọng số: mặt Flagellant chỉ là texture | giữ cho tương thích tên |
| Socket vũ khí | `R_weapon_attach`, `L_weapon_attach`, `shield_attach`, `two_hand_weapon_main/attach/pivot` (tên D2R; đặt theo mẫu) | |
| Socket VFX | chưa đặt | |
| Vật phụ rời | roi xích (tay phải) và sắt nung (tay trái) **chưa dựng** | nằm ngoài phạm vi bản xem trước |

Tổng: **181 bone** (tên, cha-con và trục cục bộ trùng Sorceress), **68 bone có trọng số** (76 nhóm đỉnh trước khi cắt trọng số < 0,01),
113 bone không trọng số vẫn nằm trong skin để retarget/gắn đồ.

## Thông số animation (theo `blender-game-animation`)

| Mục | Giá trị |
| --- | --- |
| Trục tiến / trục lên | nhân vật nhìn −Y trong Blender, +Z lên; GLB: +Y lên (đổi trục bởi exporter). Trái của nhân vật = +X (Blender), giống Sorceress |
| Đơn vị | mét (translation cục bộ trong GLB là mét; Sorceress dùng đơn vị nút × root scale 1,15 → clip D2R phải nhân hệ số khi retarget) |
| fps | 24 |
| Loop / root motion | chưa có clip thật |
| Sự kiện gameplay cần có | chưa xác định |
| Tham chiếu | không có video/clip tham chiếu; Sorceress GLB không chứa animation |
| Rig điều khiển | chưa có (không IK chân/tay, không control tiếp xúc). Skeleton ở đây là skeleton runtime duy nhất; **không dựng thêm rig điều khiển** trong lượt đóng gói này |
| Giới hạn influence của engine đích | 4 (chuẩn glTF) — đã tuân thủ, tổng trọng số = 1 |
| Tiếp tục file của người khác? | không; kiểm kê ở `rig.log` |

## Bộ clip

Chưa có clip thật. Ba clip tổng hợp bằng code (`idle`, `walk`, `arm_swing`, tên `QA_*`) chỉ để chứng minh rig biến dạng
đúng; trạng thái `experiment`, không dùng làm clip game. Chi tiết ở [`anim/clips.json`](anim/clips.json).

| State | Cần? | Nguồn dự kiến | Dùng lại từ | Ghi chú |
| --- | --- | --- | --- | --- |
| `idle`, `walk`, `run`, `attack`, `hit`, `death` | R (bộ tối thiểu họ H) | chưa chốt (thư viện CC0 retarget, hoặc làm tay) | – | không bắt đầu trong lượt này |

Stance áp dụng: chưa chọn.

## Rủi ro và điều cần chú ý

- **Giấy phép:** skeleton D2R (tên bone, thứ bậc, trục) là tài sản Blizzard. Chỉ dùng nội bộ để dựng lookdev; `FL_flagellant_vA_rig.glb`
  mang skeleton đó nên **không đưa vào bản phát hành** khi chưa xử lý giấy phép hoặc thay bằng bộ bone riêng.
- **Váy dài:** skin tĩnh một lớp. Ngồi sâu (đùi 60°, gối 95°) làm tạp dề và lớp trong rách (114 cạnh giãn > 1,5×), mảnh áo tách
  rời. Bước chân và ngồi vừa chấp nhận được (xuyên nhẹ). Muốn đẹp cần xương phụ cho váy hoặc mô phỏng vải; quyết ở G2.
- **Ngón dính khối:** cần sửa mesh hoặc chấp nhận bàn tay găng.
- **Không có trọng số:** mặt, tóc, xương xoắn cẳng tay, đệm vai, `heavy_side_skirt`, charm, điểm gắn vũ khí. Trọng số xoắn cẳng
  tay sẽ giúp khi xoay cổ tay mạnh.
- **Chiều cao:** Flagellant 1,8 m, Sorceress cao hơn ~0,1 m → clip dùng chung cần chỉnh biên độ `cog`/root.
- **Cánh tay mesh bất đối xứng** 5–6 cm (đúng mesh gốc); khớp L/R đặt theo thực tế đó.
- **Chưa tiến hành:** IK, clip thật, sửa mesh váy khi ngồi sâu, chuẩn hoá tên bone, tích hợp game.

## Chỉ tiêu qua cổng

- G2: các mục A1, A2 của `QA_CHECKLIST.md`, cộng các vùng khó ở trên. Bằng chứng: `validation.json`, `qa/SHEET_*.png`, `REVIEW_opus.md`.
  Chưa đủ toàn bộ mục `QA_CHECKLIST.md` (chưa dò từng mục theo checklist mới, chưa có rig điều khiển).
- G3: các mục B1, B2 — **không phê duyệt**, chưa có clip thật.
- G4: các mục C — **không phê duyệt**.

## Duyệt

| Cổng | Ngày | Kết quả | Người duyệt | Ghi chú |
| --- | --- | --- | --- | --- |
| G1 (brief) | 2026-10-21 | cho phép route T Sorceress D2R trong yêu cầu gốc của người dùng | người dùng (ngầm định, không duyệt riêng brief này) | không tốn credit; brief này viết hồi tố khi đóng gói |
| G2 (rig) | – | **chờ người dùng xem ảnh `qa/SHEET_*.png` hoặc mở `.blend`** | – | Opus đã review kỹ thuật bản xem trước: PASS (`REVIEW_opus.md`); đó không phải duyệt thẩm mỹ G2 |
| G3 (clip) | – | không áp dụng, chưa có clip thật | – | `null` |
| G4 (trong lab) | – | chưa đăng ký trong lab | – | `null` |
| R9 (tích hợp engine) | – | không thực hiện | – | `null` |
