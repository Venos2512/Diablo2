# tools/ — script rig D01_hodling (Blender 5.2.2 + Python 3.10 numpy/Pillow)

Chạy cả chuỗi: `powershell -NoProfile -File run_all.ps1 -Tag <tag>` (**`-Tag` bắt buộc**, vd `v5`). Chi tiết và lệnh từng bước: [`../qa_report.md`](../qa_report.md) mục 6.

Lưu ý khi chạy lại:
- Bước build **ghi đè** `../D01_hodling_rig.blend` (bản trước chép vào `../_work/prev/`, bản v3 giữ ở `../_snapshots/v3/` cùng bản sao tools và sha256). Chuỗi cũng ghi đè `../validation.json` và `../checks/*`.
- `run_all.ps1` **dừng** nếu `qa/A2_*_<tag>.*` hoặc `qa/_superseded/<tag>/` đã có (chống ghi đè bằng chứng cũ); chỉ thêm `-Overwrite` khi chủ ý. Mọi bước kiểm mã thoát; `qa_cleanup.py` thoát khác 0 khi lỗi, chỉ làm việc trong `rig/qa` đã kiểm tra, chỉ xoá `qa/_raw/<tag>/*.png` (không đệ quy).
- Tag mới nhất giữ ở `qa/`; tag cũ được `qa_cleanup.py` chuyển vào `qa/_superseded/<tag>/` (lý do ghi ở `qa/_superseded/README.md`).

| Script | Việc |
| --- | --- |
| `landmarks.json`, `d01_rig_def.py` | landmark giải phẫu đo trên mesh đã scale; định nghĩa 35 bone runtime + 45 bone điều khiển (tên, cha, vị trí, trục gập) |
| `d01_skin.py` | trọng số skin (numpy thuần). Vai túi chỉ nhận `sack`/`chest`/`spine_02`/`spine_01` (hằng số `SACK_BONES`, không có biến môi trường), cộng dải chuyển tiếp 3 vòng ở phía da quanh viền túi (`sack_skin_band`: phần theo đầu → `chest`, phần theo hông/đùi → `spine_01`, giảm dần về viền) |
| `b1_build_rig.py` | **dựng toàn bộ** từ GLB gốc → `../D01_hodling_rig.blend` |
| `d01_common.py`, `d01_rigkit.py`, `d01_poses.py`, `d01_render.py`, `d01_wviz.py`, `d01_glb.py` | hàm dùng chung (đường dẫn/hash, helper Blender, tư thế QA qua control rig, render Workbench trực giao, màu trọng số, đọc GLB) |
| `v2_rig_function.py`, `v5_sack_flap.py`, `d01_measure.py`, `c1_export_runtime.py`, `v1_validate.py`, `v3_viewport_shot.py` | R4: chức năng control + cực trị (gồm 4 phép thử vai túi độc lập với đầu), đo vai túi + khố↔đùi (`checks/sack_flap.json`, `checks/loin_sweep.json`; `--blend <file> --out <json>` để đo bản cũ), export GLB runtime tạm (**khác GLB gốc ở material**: bỏ `KHR_materials_volume`), `validation.json`, trạng thái viewport |
| `q1_render.py`, `q4_sockets.py`, `q5_sack_compare.py`, `q2_compose.py`, `q3_qa_pose_actions.py`, `qa_cleanup.py` | R5: render thật (gồm bản đồ xuyên khố), socket, đối chiếu vai túi v3↔hiện hành, ghép nhãn/lớp skeleton, file Action QA, dọn |
| `a0_dump_mesh.py`, `a1_render_raw.py`, `grid_crop.py`, `proto_skin_run.py`, `proto_weights_view.py`, `t0_smoke.py`, `t2_pose_diag.py`, `t3_zoom_diag.py`, `t4_stretch.py` | chẩn đoán trong lúc dựng (đo landmark, xem trọng số, giãn cạnh theo tư thế); không cần cho chuỗi chính. Ghi vào `../_work/` (tạo khi cần; chạy `a0_dump_mesh.py` trước các script `proto_*`) |
| `blender_import_probe.py`, `preflight_glb.py` | R1 (đo GLB gốc, có từ trước) |
