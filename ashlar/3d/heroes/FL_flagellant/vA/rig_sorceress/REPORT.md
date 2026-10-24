# FL Flagellant vA → khung xương Sorceress (D2R) — báo cáo

Ngày 2026-10-21. Blender 5.2.2 (`E:\SteamLibrary\steamapps\common\Blender\blender.exe`), chạy nền bằng bpy (Blender MCP không kết nối được).
Đầu vào chỉ đọc, không sửa: Sorceress `…8ac7bb44…glb` (1,2 MB), Flagellant `…df4f46f7…glb` (Tripo, 20,7 MB, 6.755 đỉnh / 10.488 tam giác).

## File giao

| File | Nội dung |
| --- | --- |
| `FL_flagellant_vA_sorceress_rig.glb` | **GLB đã rig**, 20,8 MB: 1 skin 181 joint, 1 mesh, 3 texture giống từng byte với bản Tripo, không animation |
| `FL_flagellant_vA_sorceress_rig.blend` | project chỉnh được (ảnh đã pack; 3 clip QA nằm trong NLA, đang mute nên mở ra ở tư thế rest) |
| `mapping_and_validation.json` | bảng 181 bone (cha, quy tắc đặt khớp, toạ độ Sorceress → Flagellant, số đỉnh có trọng số) + kết quả kiểm + chỉ số méo theo tư thế |
| `build_report.json`, `validation.json` | hai nửa của file trên |
| `qa/SHEET_*.png` | ảnh render Blender: khung xương, tư thế (thân trên, toàn thân, chân/váy), heat map trọng số, dải clip đi bộ / vung tay |
| `qa/…_qa_clips_geometry_only.glb` | 3 clip thử (idle 48f, walk 32f, arm_swing 36f, 24 fps), không texture |
| `run_all.ps1`, `build_rig.py`, `rig_fit.py`, `skin.py`, `clips.py`, `posing.py`, `validate_rig.py`, `qa_*.py`, `make_sheets.py` | tái tạo toàn bộ: `powershell -File run_all.ps1` (dùng `-KeepRaw` để giữ ảnh lẻ) |

## Phương pháp

1. **Đọc trước khi chọn cách.** Sorceress: 181 bone, 14 mesh skin, cao 1,77 m (đỉnh khớp `head`), root node scale 1,15, T-pose tay ngang, **không có animation clip nào**. Flagellant: một mesh tĩnh (111 đảo rời), 1 m, T-pose, mặt hướng -Y, nhân vật trái = +X (cùng quy ước Sorceress).
2. **Giữ hợp đồng của Sorceress**: tên bone, thứ bậc cha-con, và hướng trục cục bộ từng bone. Blender xuất/nhập giữ nguyên quay cục bộ (đã thử vòng tròn trên chính file Sorceress). Chỉ dời **vị trí khớp**.
3. **Mesh**: nhân 1,8 (chiều cao thiết kế trong `brief.md`), dời trục thân về gốc; ảnh/UV/vật liệu giữ nguyên.
4. **Đặt khớp theo cơ thể Flagellant**, không chép toạ độ: 28 khớp chính (cột sống, vai, khuỷu, cổ tay, hông, gối, cổ chân, bàn chân…) đo từ lát cắt mesh và ảnh ortho có lưới 0,1; các bone phụ suy ra từ khớp cha: mặt/hàm/mắt (k=0,8, canh mắt), ngón tay (tỉ lệ bàn tay), xương xoắn cẳng tay, điểm gắn vũ khí. Chuỗi váy (front 6, back L/R 5, side L/R 4) đặt dọc các vạt áo dài; chuỗi charm đặt dọc dây mười nút.
5. **Skin tự viết** (`skin.py`): auto-weight của Blender không dùng được vì trục bone theo Sorceress không chạy dọc chi. Mỗi bone có đoạn "khớp → khớp kế" với bán kính thon; trọng số = soft-min khoảng cách, làm mượt theo đảo + theo không gian trong vùng váy, buộc cứng các đảo nhỏ (đèn lồng, túi, nút dây, khăn…), cắt còn 4 ảnh hưởng, chuẩn hoá. 76 bone có nhóm đỉnh.

## Kiểm tra (đều chạy trên GLB nhập lại vào Blender)

| Hạng mục | Kết quả |
| --- | --- |
| Tên joint | trùng đủ 181 (tập hợp); thứ tự joint **khác** Sorceress |
| Thứ bậc cha-con | 0 sai khác |
| Quay cục bộ so với Sorceress | lệch tối đa **0,056°** |
| Inverse bind matrix so với cây node | lệch ≤ 3,3e-6 |
| Trọng số | 0 đỉnh không trọng số; tổng 1,0000 ± 1e-7; tối đa 4 ảnh hưởng; mọi id joint hợp lệ |
| Chiều cao / chân | 1,799 m, chân chạm y=0 |
| Mesh rest so với bản Tripo đã scale | lệch tối đa 2,3e-6 m (6.755 → 6.757 đỉnh do exporter tách theo seam; 10.488 tam giác không đổi) |
| Texture | 3 ảnh trùng SHA-256 với đầu vào |
| Clip thử: dựng so với tư thế mong muốn | lệch ≤ 7,2e-7 m |
| Clip thử: GLB nhập lại so với bản dựng | lệch ≤ 1,0e-6 m (cả 3 clip) |
| Trọng số GLB nhập lại so với bản dựng | L1 tối đa 1,4e-7 |

Đã render thật bằng Blender (Workbench có texture) 11 tư thế × nhiều góc + 3 clip, xem `qa/SHEET_*.png`. Chỉ số cạnh co/giãn (p1–p99) nằm trong `qa/pose_metrics.json`: dang tay xuống 0,86–1,15, giơ tay 0,89–1,09, gập khuỷu 0,82–1,04, bước 0,86–1,21, ngồi vừa 0,85–1,18.

## Giới hạn (nói thẳng)

- **Không chuyển animation nào vì file Sorceress không có clip.** Ba clip trong `qa/` là chuyển động tổng hợp để thử biến dạng, không phải animation của Sorceress.
- **Váy dài** là skin tĩnh một lớp: bước chân và ngồi vừa chấp nhận được (còn xuyên nhẹ, vài mảnh lớp trong lộ ra), nhưng **ngồi sâu** (đùi 60°, gối 95°; tư thế `crouch`, 114 cạnh giãn >1,5×) làm tạp dề/lớp trong rách và mảnh áo tách rời. Muốn đẹp cần mô phỏng vải hoặc xương phụ cho váy lúc chạy game.
- **Ngón tay dính khối** trong mesh Tripo: các xương ngón có trọng số nhưng bàn tay cong như một khối găng, không cử động từng ngón.
- **Không có trọng số** (113 bone): mặt, mi, môi, tóc, xương xoắn cẳng tay, đệm vai, điểm gắn vũ khí/khiên, `heavy_side_skirt`, charm, `root/translate/anim/cog`. Vẫn nằm trong skin và đặt đúng vị trí để retarget/gắn đồ; mặt Flagellant chỉ là texture nên không có biểu cảm.
- **Đơn vị**: translation cục bộ trong GLB là mét; Sorceress dùng đơn vị nút × root scale 1,15. Quay tương thích trực tiếp, translation cần nhân hệ số. Root scale 1,15 không còn (đã gộp vào vị trí).
- Cánh tay Tripo đối xứng quanh x=0 còn thân lệch +1,5 cm nên cánh tay hai bên dài 0,926 và 0,872 m tính từ trục thân (đúng mesh gốc).
- Trục bone hiển thị lạ trong viewport Blender (chỉ chỗ lạ khi xem bone dạng octahedral): trục theo Sorceress, không theo hướng chi; armature để dạng STICK.
- Tỉ lệ chiều cao 1,8 m lấy từ `brief.md`; Sorceress cao hơn ~0,1 m, nên animation dùng chung cần chỉnh biên độ gốc (`cog`).
- Chưa tạo/đổi texture hay concept; chưa review Opus (do agent chính điều phối).
