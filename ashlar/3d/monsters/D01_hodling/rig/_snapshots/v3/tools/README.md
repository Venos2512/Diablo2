# tools/ — script rig D01_hodling (Blender 5.2.2 + Python 3.10 numpy/Pillow)

Chạy cả chuỗi: `powershell -NoProfile -File run_all.ps1 -Tag <tag>`. Chi tiết và lệnh từng bước: [`../qa_report.md`](../qa_report.md) mục 6.

| Script | Việc |
| --- | --- |
| `landmarks.json`, `d01_rig_def.py` | landmark giải phẫu đo trên mesh đã scale; định nghĩa 35 bone runtime + 45 bone điều khiển (tên, cha, vị trí, trục gập) |
| `d01_skin.py` | trọng số skin (numpy thuần) |
| `b1_build_rig.py` | **dựng toàn bộ** từ GLB gốc → `../D01_hodling_rig.blend` |
| `d01_common.py`, `d01_rigkit.py`, `d01_poses.py`, `d01_render.py`, `d01_wviz.py`, `d01_glb.py` | hàm dùng chung (đường dẫn/hash, helper Blender, tư thế QA qua control rig, render Workbench trực giao, màu trọng số, đọc GLB) |
| `v2_rig_function.py`, `c1_export_runtime.py`, `v1_validate.py`, `v3_viewport_shot.py` | R4: chức năng control + cực trị, export GLB runtime tạm, `validation.json`, trạng thái viewport |
| `q1_render.py`, `q4_sockets.py`, `q2_compose.py`, `q3_qa_pose_actions.py`, `qa_cleanup.py` | R5: render thật, socket, ghép nhãn/lớp skeleton, file Action QA, dọn |
| `a0_dump_mesh.py`, `a1_render_raw.py`, `grid_crop.py`, `proto_skin_run.py`, `proto_weights_view.py`, `t0_smoke.py`, `t2_pose_diag.py`, `t3_zoom_diag.py`, `t4_stretch.py` | chẩn đoán trong lúc dựng (đo landmark, xem trọng số, giãn cạnh theo tư thế); không cần cho chuỗi chính. Ghi vào `../_work/` (tạo khi cần; chạy `a0_dump_mesh.py` trước các script `proto_*`) |
| `blender_import_probe.py`, `preflight_glb.py` | R1 (đo GLB gốc, có từ trước) |
