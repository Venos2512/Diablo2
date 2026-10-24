# Kiểm kê rig và animation — ASHLAR

Theo dõi từng asset đi qua [`Agent.md`](Agent.md). Cập nhật sau mỗi cổng duyệt. Số liệu chỉ ghi khi đã đo; ô chưa đo để "–".

Trạng thái: `chưa rig` · `brief` (qua G1) · `rig` (qua G2) · `clip` (qua G3) · `xong` (qua G4).

## 1. Asset đã có model

| Asset | Họ | Route | Bone / bone có trọng số | Trạng thái | Clip thật | Clip QA tổng hợp | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [FL Flagellant A](../heroes/FL_flagellant/vA/) | H | T: template retarget (Sorceress D2R), theo yêu cầu người dùng; **nội bộ lookdev, không phát hành** | 181 / 68 | thử rig đã đóng gói ([`rig/`](../heroes/FL_flagellant/vA/rig/rig_brief.md)), **G2 chờ người dùng xem**; G3/G4/R9 `null` | chưa (nguồn Sorceress không có animation) | `QA_idle`, `QA_walk`, `QA_arm_swing` (experiment, chỉ chứng minh biến dạng; [`clips.json`](../heroes/FL_flagellant/vA/rig/anim/clips.json)) | `FL_flagellant_vA_rig.glb` + `rig/` (bản gốc thử nay ở `ashlar/3d/heroes/FL_flagellant/vA/rig_sorceress/`). Giữ đủ 181 bone tên D2R theo chủ ý; chưa chuẩn hoá tên. Opus review kỹ thuật PASS (không phải G2). Còn: váy rách khi ngồi sâu, ngón dính khối, chưa có rig điều khiển/clip thật, roi xích và sắt nung chưa dựng, chốt skeleton chuẩn riêng trước khi phát hành |
| [D01 Hodling B](../act-01/monsters/D01_hodling/) | S | M + retarget clip KayKit CC0 (**G1 duyệt 2026-10-21**) | 35 runtime / 25 có trọng số (đo, `rig/validation.json`); rig điều khiển 45 | brief (qua G1), rig (qua G2); 6 Action R6–R7 xong, chờ Opus + **G3 (chưa duyệt)** | `idle`, `walk`, `run`, `attack`, `hit`, `death` (Action trong `rig/D01_hodling_rig_anim.blend`, `status experiment`, KayKit CC0; chưa bake R8) | – | ~0,5 m (0,27H). G1 người dùng duyệt 2026-10-21: [`rig/rig_brief.md`](../act-01/monsters/D01_hodling/rig/rig_brief.md). **G2 người dùng duyệt 2026-10-21.** R2–R5 (A1 14/14), ảnh QA ở `rig/qa/`, báo cáo `rig/qa_report.md`. R6–R7 2026-10-21: 6 Action, manifest `rig/anim/clips.json`, báo cáo `rig/anim/R7_report.md` (walk 0,358 m/s stride 0,388 m, run 1,627 m/s stride 1,221 m; attack hit offset 8 = 0,333 s; chưa R8, chưa bản trong lab, 0 credit). Không clavicle, không ngón. Khuyết điểm còn lại: xem `qa_report.md` 5.2 |

## 2. Quái ASHLAR theo họ quái (chưa có model, phân họ skeleton dự kiến)

Nguồn: [`docs/ASHLAR_MONSTER_CHECKLIST_VI.md`](../../docs/ASHLAR_MONSTER_CHECKLIST_VI.md): 99 quái thường + 17 boss. Họ skeleton ở đây
là **dự kiến theo họ quái**, quyết từng con khi lập rig brief (R1).

| Họ quái | Quái thường / boss | Họ skeleton dự kiến |
| --- | --- | --- |
| Unlaid (người chết không yên) | 16 / 1 | chủ yếu H, S |
| Discarded (quỷ đất nung) | 16 / 2 | H, S; một số con có thể F hoặc O |
| Warped (thú bị biến đổi) | 18 / 0 | Q, W, A, L |
| Faithful (giáo phái, binh lính) | 17 / 0 | H |
| Perfection-born | 27 / 11 | hỗn hợp; xét từng con |
| Lodge's servants | 4 / 0 | H hoặc O |
| The Perfect | 1 / 0 | xét riêng |
| Mason (the Chisel), Willow Bride, the Unbroken | – / 3 | xét riêng, boss thường cần clip riêng |

Quy tắc phân họ: con nào có silhouette, số chi hoặc cách di chuyển khác họ H thì tách họ riêng. Họ mới → thêm vào bảng ở
`SKELETON_STANDARD.md` mục 2 và 3 trước khi rig con đầu tiên.

## 3. Ngân sách clip theo họ (nhìn tổng thể, điền khi biết số asset mỗi họ)

| Họ | Số asset | Bộ clip bắt buộc | Clip dùng chung | Clip làm riêng | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| H | – | 6 (`idle`, `walk`, `run`, `attack`, `hit`, `death`) | – | – | |
| S | – | như H | dùng lại từ H sau scale | – | |
| Q | – | 6 | – | – | |
| W | – | 5 (không `run`) | – | – | |
| A | – | 5 (không `run`) | – | – | |
| L | – | 5 | – | – | |
| F | – | 5 | – | – | |
| O | – | trạng thái riêng | – | – | |

Đơn vị đếm phải ghi rõ khi báo con số: **một clip** (một chuỗi chuyển động trong GLB) khác với **một animation nhìn 8 hướng** hay
**số chuỗi ảnh khi xuất sprite**. Game ASHLAR là 3D nên đơn vị mặc định ở đây là *một clip trong GLB*.

## 4. Chi tiết clip một asset

Mỗi asset đã vào bước R6 có bảng này, lấy từ `rig/anim/clips.json` (đầy đủ trường ở mục 5 của `Agent.md`). Ba mức duyệt tách
nhau: **nguồn** (G3), **xuất** (R8 reimport sạch), **engine** (R9); ghi ngày ở từng cột.

| State | Tên clip | Trạng thái | Nguồn | Giấy phép | Frame / fps / `duration_s` | Dùng lại / làm riêng | `stride_m` | Điểm trúng (giây) | Trượt chân (lab) | Duyệt nguồn | Duyệt xuất | Tích hợp engine |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `idle` | | | | | | | – | – | – | | | |
| `walk` | | | | | | | | – | | | | |
| `run` | | | | | | | | – | | | | |
| `attack` | | | | | | | – | | – | | | |
| `hit` | | | | | | | – | – | – | | | |
| `death` | | | | | | | – | – | – | | | |

## 5. Lịch sử

- 2026-10-21: tạo bảng. Thêm FL Flagellant A (bản thử rig có sẵn) và D01 Hodling B.
- 2026-10-21: đóng gói bản thử rig FL Flagellant A vào `ashlar/3d/heroes/FL_flagellant/vA/` (route T, Sorceress D2R, G2 chờ).
