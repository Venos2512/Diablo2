# Ảnh QA của các lần chạy bị thay thế (giữ để đối chiếu)

JPEG q80, đã thu nhỏ ≤ 1800 px ngang. Bản hiện hành là `../A2_*_v4.jpg`.

| Tag | Lý do bị thay |
| --- | --- |
| `v1` | Lần đầu. Phép đo "khớp nằm trong mesh" (`checks/rig_function.json`, `joints_inside_mesh`) phát hiện bone `R_ear` đặt sai: tai phải của mesh Tripo **không đối xứng** với tai trái (cao hơn, lùi ra sau hơn), nên không được lấy gương từ tai trái. Khung ảnh chưa cắt theo chiều cao, chưa có góc 3/4, chưa có ảnh socket |
| `v2` | Đã sửa tai phải và thêm khung cắt, 3/4, socket. Lỗi còn lại: lớp tai (`ear`) ăn cả da thái dương (trọng số `R_ear`/`L_ear` lan lên má); ảnh rig điều khiển bị tô một màu; khung ảnh socket cắt mất đầu thanh QA |
| `v3` | Review kỹ thuật Opus: NEEDS_CHANGES (chưa tới G2 người dùng). Lỗi: **trọng số `head`/`neck` rò vào vải túi** (`d01_skin.py`, pha túi→thân theo đỉnh thân gần nhất, giới hạn head mặc định tắt) nên viền túi phía sau phồng/kéo theo đầu khi cúi, ngửa, quay (túi dịch tới 70–95 mm khi chỉ quay đầu), lộ cục gạch đỏ ở `head_down`. Khố (`hip_flex_fk`) chưa có tư thế lái `ctl_loincloth_front` nên chưa đo xuyên. Bản nguồn v3 giữ ở `../../_snapshots/v3/` |
