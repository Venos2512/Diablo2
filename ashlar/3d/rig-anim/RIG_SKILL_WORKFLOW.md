# Workflow tạo skill rig qua Blender MCP (`blender-mcp-rigging`)

Trạng thái:
- **P0 đã chốt 2026-10-22.** Người dùng duyệt 5 quyết định ở mục 8; ground truth thiết kế lại để gần như không tốn thời gian người dùng.
- **P1 đã chạy một phần:** đã nối MCP và đo thật (mục 2). Còn bước khởi động lại phiên để nạp tool `blender`.

Phạm vi:
- Skeleton thân, skin, kiểm tự động và ảnh QA, tức R2–R5 của [`Agent.md`](Agent.md), kết thúc ở cổng G2.
- **Không rig mặt.**
- Không làm clip. R6 trở đi thuộc phiên animation và skill
  [`blender-game-animation`](../../../.agents/skills/blender-game-animation/SKILL.md).

Nguồn, đã chép vào [`research/`](research/):

| File | Nội dung |
| --- | --- |
| `00a_tai-lieu-rigging-3d.md`, `00b_tai-lieu-rigging-game-chuyen-sau.md` | hai tài liệu người dùng gửi 2026-10-22 |
| `01_blender_gltf_facts.md` | Blender 5.2.2 và exporter glTF 5.2.40, đối chiếu thẳng mã nguồn; three.js r186 |
| `02_autorig_skinning_methods.md` | đặt khớp và tính trọng số: Pinocchio, UniRig, MagicArticulate, Puppeteer, SkinTokens, Robust Weight Transfer… |
| `03_game_rig_standards_lbs.md` | chuẩn rig game chỉ có LBS: xương xoắn, bone phụ, giải phẫu khớp, ROM |

Bài học thực tế: D01 Hodling ([`qa_report.md`](../act-01/monsters/D01_hodling/rig/qa_report.md) v4, `anim/R7_opus_review.md`) và FL
Flagellant ([`REPORT.md`](../heroes/FL_flagellant/vA/rig/REPORT.md), `REVIEW_opus.md`).

Nhãn số liệu:
- **[đo]** đã đo trong dự án;
- **[nguồn]** tài liệu chính thức hoặc mã nguồn;
- **[đề xuất]** chưa kiểm, chốt ở benchmark (P5).

## 0. "Chất lượng cao nhất, chính xác nhất" nghĩa là gì

Cả ba nhánh nghiên cứu đều **không tìm thấy ngưỡng nghiệm thu nào được công bố**, dù từ studio, GDC hay paper. Vì vậy skill phải tự
định nghĩa chất lượng bằng số, rồi hiệu chỉnh trên bộ benchmark. Một rig đạt khi có đủ bốn điều:

1. **Khớp đúng.** So với ground truth, sai số khớp lõi nằm trong ngưỡng ở mục 4.
2. **Biến dạng đúng trên runtime thật.** QA trong Blender dùng đúng mô hình skinning của three.js, rồi đối chiếu với bản reimport.
3. **Dựng lại được.** Mọi thứ sinh ra từ GLB gốc cộng một công thức (`rig_recipe.json`). Chỉnh tay của người dùng được ghi thành lớp
   ghi đè, chạy lại được.
4. **Người dùng duyệt thẩm mỹ ở G2** trên ảnh viewport thật. Skill không tự qua cổng.

## 1. Mười nguyên tắc

1. **QA phải mô phỏng runtime.** Runtime chỉ có linear blend skinning với 4 ảnh hưởng mỗi đỉnh:
   - three.js r186 chỉ đọc `JOINTS_0`/`WEIGHTS_0` và tự chuẩn hoá lại [nguồn].
   - Exporter bỏ trọng số ≤ 0,0001, giữ 4 trọng số lớn nhất rồi chuẩn hoá lại [nguồn].
   - Preserve Volume (DQS), B-Bone, Corrective Smooth, constraint và driver đều không ra file [nguồn].

   Vì vậy bản QA trong Blender phải: tắt Preserve Volume; đặt `bbone_segments = 1`; không có modifier sửa; cắt top-4 rồi chuẩn hoá
   giống exporter. Đo trên bản khác runtime là đo sai.
2. **Mesh và tư thế đầu vào quyết định nhiều nhất** (tài liệu 00a §7). Tay dính thân, chân dính nhau hay ngón dính khối thì sửa đầu
   vào trước: T-pose mới qua Astra, rồi dựng lại bằng Tripo. Không rig vòng qua lỗi.
3. **Auto chỉ là điểm xuất phát.**
   - Mô hình học sâu tốt nhất vẫn sai khoảng 0,5–1,5% kích thước trên humanoid, kém hơn nhiều với đuôi, cánh, dáng lạ [nguồn].
   - Bone heat của Blender hỏng trên mesh hở. Khi hỏng, nó dừng ở bone lỗi đầu tiên và các bone sau không có trọng số [nguồn].
   - Với FL, auto-weight không dùng được vì trục bone mẫu lệch khỏi chi [đo].

   Vì vậy khớp đặt bằng đồng thuận nhiều phương pháp, còn trọng số chọn theo số đo.
4. **MCP để nhìn, kiểm và nhận chỉnh tay; script để làm.**
   - Mọi thay đổi đi qua hàm trong `scripts/rigkit`, tham số ghi vào recipe. Code viết tay qua `execute_blender_code` chỉ để đọc.
   - Toán nặng chạy ngoài Blender (mục 2.3).
5. **Kiểm ràng buộc sau mọi bước làm mịn.** Ở D01 v3, làm mịn Laplace kéo head/neck vào vai túi (384/538 đỉnh rò). Sửa bằng cách ép
   lại danh sách bone sau mỗi vòng làm mịn, có `assert` [đo].
6. **Trọng số tính trên topology đã hàn đường nối UV**, rồi chép cho mọi đỉnh trùng vị trí. Nếu không, mesh nứt ở seam khi biến
   dạng. D01 hàn 6.505 đỉnh còn 5.389 vị trí [đo].
7. **Không tin đối xứng khi chưa đo.**
   - D01 có hai chân lệch 10,5 mm, tai phải khác tai trái [đo].
   - Mirror trọng số theo vị trí (KD-tree), không theo topology. `vertex_group_mirror(use_topology=True)` chỉ đúng khi topology khớp
     đôi, mà mesh Tripo thì không [nguồn].
8. **Hai lớp skeleton.**
   - Runtime: bone deform và socket, tên chuẩn.
   - Điều khiển: bone `ctl_*` cho IK/FK, pole, foot roll.
   - Runtime bám điều khiển bằng Copy Transforms; D01 lệch 0 ở rest [đo]. Theo [`SKELETON_STANDARD.md`](SKELETON_STANDARD.md) mục 2b.
9. **Mỗi lần sửa có số trước/sau và snapshot.** Không ghi đè bằng chứng cũ (D01 dùng `_snapshots/` và `-Tag` bắt buộc).
10. **Không tự qua cổng.** Skill tạo bằng chứng cho G2; người dùng duyệt. Nếu skill mâu thuẫn với `Agent.md`,
    `SKELETON_STANDARD.md` hay `QA_CHECKLIST.md` thì dừng và hỏi.

## 2. Blender MCP trong skill

### 2.1 Đã làm và đã đo [đo 2026-10-22]

**Đã cài đặt:**
- Blender 5.2.2 LTS tại `E:\SteamLibrary\steamapps\common\Blender\blender.exe`.
- Server MCP: `blender-mcp` **2.0.0**, khai báo trong [`.mcp.json`](../../../.mcp.json) của repo: lệnh `uvx blender-mcp@2.0.0`, cổng
  9876, telemetry tắt bằng biến môi trường, cache của uv ở `E:\uv-cache`. Tắt telemetry thì phần ghi "trajectory" của server lên mạng
  cũng tắt theo [nguồn].
- Addon trong `%APPDATA%\Blender Foundation\Blender\5.2\scripts\addons\blender_mcp.py`: đã nâng từ bản 1.8 protocol 13 lên bản đi kèm
  server (protocol 14), vì server 2.0.0 đòi protocol 14. Bản cũ giữ ở `blender_mcp.py.bak-v1.8-protocol13`.
- **Tool `blender` chỉ có sau khi khởi động lại phiên Claude Code/T3** và duyệt server của project.

**Số đo bằng phép thử socket** (cùng giao thức server dùng; `E:\tmp_rig_research\probe\probe.json`), với Blender mở ở dạng thu nhỏ
(`--factory-startup --addons blender_mcp`):

| Phép đo | Kết quả |
| --- | --- |
| Cổng sẵn sàng sau khi mở | ~2 s |
| `get_scene_info`, `execute_code` lệnh nhẹ | 9–43 ms |
| Import GLB của D01 | 0,24 s |
| Ảnh viewport offscreen khi cửa sổ đang thu nhỏ | **chạy được**, có texture; 0,1 s ở Solid; lần đầu ở Material mất 17 s (biên dịch shader) |
| Lệnh nặng (6 phép nhân ma trận 3000×3000) | client hết hạn ở **180 s**, Blender vẫn bận ("Not Responding"), mọi lệnh sau cũng hết hạn; chỉ cách **tắt Blender** mới gỡ được |
| numpy đi kèm Blender (2.3.4) | nhân ma trận 1000×1000 mất 2,2 s, 3000×3000 mất 157 s: không có BLAS nhanh |
| `E:\tools\rigkit-env` (Python 3.11, numpy 2.4.6, scipy 1.17.1, libigl 2.6.3, trimesh 5.1.1; đã dựng) | 1000×1000 mất 0,0085 s, 3000×3000 mất 0,17 s (nhanh hơn ~250–900 lần); cotangent Laplacian + ma trận khối lượng trên 10k đỉnh 0,03 s; giải hệ thưa 10k ẩn 0,3 s; `fast_winding_number` (kiểm điểm trong mesh) chạy đúng |

GPU RTX 4070, 12 GB VRAM: không chạy được SkinTokens (cần từ 14 GB) [nguồn].

**UniRig đã cài và chạy được** [đo 2026-10-22]. Ghi chú cài ở `E:\tools\unirig\INSTALL_NOTES.md`.
- **Phiên bản:** commit `6793c66` cộng một bản vá nhỏ ở nhánh `win-local-patches`. Python 3.11, torch 2.9 cu128, flash-attn wheel cộng
  đồng khớp đúng phiên bản. Không cần WSL hay CUDA toolkit.
- **Checkpoint:** skeleton 1,44 GB và **skin** 4,38 GB đều có. Code và weights giấy phép MIT. Dữ liệu huấn luyện lấy từ Objaverse-XL,
  giấy phép từng asset khác nhau, cần lưu ý khi dùng thương mại.
- **Hiệu năng:** mỗi model chạy skeleton + skin + merge mất khoảng 90 s; VRAM đỉnh khoảng 10 GiB trên card 12 GiB.
- **Kết quả trên D01 và FL:** 52 bone dạng Mixamo có ngón, tên chung `bone_0…51`, nằm đúng trong thân. Mọi đỉnh đều có trọng số, tối đa
  4 ảnh hưởng.
- **Nhược điểm thấy trên ảnh:** khuỷu và gối **thẳng tuyệt đối** (không gập sẵn); váy FL gán vào xương chân, không có bone váy.

Vì vậy UniRig chỉ làm nguồn d của S3 và ứng viên C của S6, không dùng thẳng.

### 2.2 Tool của server 2.0.0 và việc dùng trong skill

| Tool | Dùng để |
| --- | --- |
| `get_addon_status` | kiểm addon, protocol, kết nối ở đầu phiên |
| `get_scene_info` | kiểm kê đầu phiên; xác nhận trạng thái trước mỗi bước có ghi |
| `execute_blender_code` | gọi hàm của `rigkit` (import + reload), in JSON ngắn; đọc số đo. Lỗi trả về kèm traceback |
| `look`, `viewport_capture`, `viewport_latest`, `viewport_pick` | ảnh viewport thật cho Opus soi và cho người dùng; xác định vật thể tại một điểm trên ảnh |
| `generate_3d`, `search_assets`, `import_asset`, `record_trajectory_feedback`, `disable_telemetry` | không dùng |

Hai lệnh của addon **không có tool tương ứng**, nên skill tự làm thay:
- `drain_human_activity` chỉ dùng cho telemetry. Thay bằng **chụp trạng thái rồi so khác**: trước khi trao quyền cho người dùng, ghi vị
  trí các empty `lm_*` và hash các nhóm đỉnh. Sau đó đọc lại và ghi phần khác vào lớp ghi đè.
- `bpy_api_lookup`: tra API bằng `bpy.types.<X>.bl_rna.properties` và `bpy.ops.<m>.<op>.get_rna_type()` qua `execute_blender_code`.

### 2.3 Luật vận hành

- **Một phiên rig, một Blender, một cổng, một asset.** Phiên song song cần cổng khác (`BLENDER_PORT`), tức cấu hình MCP riêng. Không
  dùng chung Blender giữa các thread.
- Mở Blender thu nhỏ: `Start-Process … -WindowStyle Minimized`. Ảnh offscreen vẫn chụp được, không che màn hình người dùng. Chỉ bật
  cửa sổ khi người dùng cần tự chỉnh.
- **Mỗi lệnh `execute_blender_code` phải xong trong vài giây** (đặt trần 20 s). Lệnh chạy quá 180 s sẽ treo Blender và không huỷ được.
- **Toán nặng không chạy trong Blender.** Gồm giải hệ Laplace, inpaint trọng số, đo xuyên trên nhiều tư thế, proxy voxel. Những việc
  này chạy ở venv riêng `E:\tools\rigkit-env` (numpy, scipy, libigl, trimesh). Trao đổi dữ liệu bằng file `.npz`:
  - Blender xuất đỉnh, tam giác, trọng số;
  - solver tính;
  - Blender nạp kết quả.
- Việc dài trong Blender (render bộ ảnh, quét ROM) chạy `blender -b --factory-startup -P …` ở nền, rồi mở lại file trong GUI.
- Trước mỗi bước có ghi: lưu một snapshot `.blend` (save copy) và so trạng thái với lần chụp trước. Nếu có chỉnh tay chưa ghi, ghi vào
  lớp ghi đè trước, không chạy đè.
- Ảnh Material lần đầu chậm: chụp Solid hoặc Workbench cho QA hàng loạt; Material chỉ dùng cho ảnh trình người dùng.
- Mỗi lệnh trả về JSON nhỏ; dữ liệu lớn ghi ra file.

## 3. Quy trình rig mà skill mã hoá (S0–S9)

```text
S0 mở phiên → S1 phân tích mesh → S2 chuẩn hoá → S3 landmark (đồng thuận) → S4 skeleton runtime → S5 rig điều khiển
→ S6 skin (ứng viên A/B/C) → S7 ROM + số đo ⟲ quay về S6 hoặc S3 → S8 xuất kiểm + đối chiếu runtime → S9 đóng gói ──G2
```

Ánh xạ sang `Agent.md`: S0–S5 là R2, S6 là R3, S7–S8 là R4, S9 là R5. Bắt đầu sau G1 và chạy liền tới G2; chỉ dừng ở các điểm dừng ghi
rõ dưới đây.

### S0 — Mở phiên

- Brief đã qua G1.
- Kiểm `git status` (thread song song).
- `get_addon_status`: protocol 14, Blender 5.2.2.
- Mở file nguồn, hoặc import GLB gốc chỉ đọc (sha256 phải khớp).
- Nếu tiếp tục file của người khác, kiểm kê rig, Action, slot, constraint trước khi sửa.

Ra: `session.json` (cổng, phiên bản, hash, kiểm kê).

### S1 — Phân tích mesh (trên bản sao, không sửa mesh)

- **Hình học:** số tam giác, số đỉnh, số đảo sau khi hàn seam; cạnh biên, cạnh non-manifold, mặt bên trong, tự giao.
- **Đối xứng:** tìm mặt phẳng đối xứng (PCA rồi mirror ICP), đo độ lệch theo vùng.
- **Tư thế:**
  - góc tay so với phương ngang (T hay A);
  - khe tay–thân, khe hai chân;
  - ngón tách hay dính (đếm thành phần của tiết diện quanh bàn tay).
- **Phân vùng:** đảo cứng (mũ, giáp, gạch), vải nối hai chân (váy, áo dài), phụ kiện.
- **Trục:** hướng mặt và hướng mũi chân xác định từ hình học, không suy đoán. D01 dùng đỉnh mũi [đo].

Ra: `analysis.json` và ảnh tô màu đảo, vùng.

**Điểm dừng:** gặp lỗi chặn (tay dính thân, chân dính nhau, ngón dính khi brief cần ngón) thì báo người dùng và đề xuất làm lại
T-pose. Không tự sửa mesh.

### S2 — Chuẩn hoá

- Scale đều về chiều cao danh mục; chân ở y = 0; áp dụng transform; armature làm cha của mesh. Nếu không có quan hệ cha, exporter phải
  tìm theo tên [nguồn].
- Ghi hệ số scale.
- Kiểm: chia lại hệ số thì hình học lệch GLB gốc ≤ 1e-6 m.

### S3 — Landmark bằng đồng thuận

Mỗi landmark (tập theo họ, không có mặt) phải có **ít nhất hai nguồn**:

| Nguồn | Cách làm | Mạnh ở |
| --- | --- | --- |
| a. Hình học trên mesh | Cắt lát vuông góc trục chi: tâm tiết diện cho đường trục. Khớp ở cực tiểu chu vi hoặc ở điểm gập. Bắn tia trước–sau để đặt độ sâu. Fit cầu cho chỏm vai | chi, cột sống |
| b. Proxy kín + embedding | Voxel remesh thành một khối kín, chạy skeleton kiểu Pinocchio hoặc medial axis (ở `rigkit-env`), rồi chiếu về mesh gốc. Pinocchio đúng 13/16 model, nhưng chỉ khi mesh kín [nguồn] | mesh hở, nhiều đảo |
| c. Prior giải phẫu | Tỉ lệ theo chiều cao, độ rộng. Số Drillis–Contini **chưa xác minh**, chỉ dùng để kiểm độ hợp lý | khởi tạo, bắt lỗi thô |
| d. UniRig (đã cài) | Chạy trên máy, ra skeleton 52 bone. Ánh xạ sang tên chuẩn theo phân cấp và vị trí, không theo chỉ số bone. Tripo `rig_model` là phương án tốn credit, hỏi trước; có loại octopod/avian/serpentine [nguồn] | ý kiến thứ hai, quái lạ |
| e. Người dùng | Kéo empty `lm_*` trong GUI; skill đọc lại bằng chụp trạng thái rồi so khác (mục 2.2) | chỉ khi a–d bất đồng |

**Luật đồng thuận** [đề xuất]:
- Các nguồn lệch nhau ≤ 1% H: lấy trung bình có trọng số theo độ tin.
- Lệch hơn: gắn cờ, chụp ảnh ortho trước, bên, trên, có lưới và điểm đánh dấu của từng ứng viên. Opus xem ảnh, chọn và ghi lý do.
- Vẫn mơ hồ: gom vào tờ hỏi chung (mục 7). Không dừng riêng cho từng khớp.

**Luật giải phẫu** (đầy đủ trong `references/joint-placement.md`; nguồn `research/03` mục 4):
- **Vai:** `UpperArm` đặt ở tâm chỏm xương cánh tay (fit cầu), không đặt ở mỏm cùng vai. `Clavicle` đi từ khớp ức–đòn tới mỏm cùng vai.
- **Khuỷu, gối:** trục bản lề qua hai lồi cầu, khớp hơi lùi về sau. Pre-bend 5–10° trong mặt phẳng gập [nguồn: hướng dẫn rig]. D01 đo
  khuỷu khoảng 4°, gối 9° [đo]. Không để chuỗi IK thẳng tuyệt đối.
- **Hông:** tâm khớp háng tính theo độ rộng chậu. Hồi quy Bell/Harrington (sai số 3–11 mm theo trục [nguồn]) chỉ dùng khi đã lấy hệ
  số từ bản gốc.
- **Chân:** cổ chân ở giữa hai mắt cá; bóng chân ở đường khớp ngón.
- **Cột sống, đầu:** cột sống gần lưng hơn bụng, cong chữ S. Đầu xoay ở đáy sọ, sau ống tai.
- **Mesh không đối xứng:** đo từng bên riêng. Chỉ đặt gương khi độ lệch ≤ 0,5% H.

Ra: `landmarks.json` (vị trí, nguồn, độ tin, độ lệch giữa các nguồn) và ảnh đối chiếu.

### S4 — Skeleton runtime

- **Template của họ** (`families/<họ>.json`): tên, cha, cờ deform, socket, luật roll, cặp đối xứng, chuỗi IK, biên độ ROM. Họ H/S theo
  bộ 28 bone lõi đã duyệt 2026-10-22 ([`SKELETON_STANDARD.md`](SKELETON_STANDARD.md) mục 3: thêm clavicle và xương xoắn).
- **Roll:**
  - đặt bằng `EditBone.align_roll(trục)`: local X là trục gập, trái/phải đối gương;
  - phép thử tự động: xoay +X thì khuỷu gập ra trước;
  - glTF không có trường roll, roll chỉ còn trong rotation rest của joint [nguồn].
- **Xương xoắn:**
  - `ForeArm_twist` ở 50% cẳng tay, nhận 50% xoắn của bàn tay;
  - `UpperArm_twist` ở 1/3 trên cánh tay, khử khoảng 50% xoắn của cánh tay;
  - trọng số tăng tuyến tính theo vị trí dọc chi [nguồn: toán LBS];
  - FL có bone xoắn nhưng không gán trọng số [đo].
- **Socket** là bone không trọng số. Khi bật `export_def_bones=True`, exporter **xoá** bone non-deform không có con là vật thể khác
  bone [nguồn]. Hai cách:
  - armature runtime chỉ chứa bone sẽ xuất, và tắt tuỳ chọn này;
  - hoặc để socket là deform với trọng số 0.
- **Kiểm:**
  - đầu bone lõi nằm trong mesh (bỏ phiếu 3 tia như D01, hoặc winding number ở `rigkit-env`);
  - không bone dài 0;
  - một gốc `root` ở gốc toạ độ, scale 1;
  - `inherit_scale = FULL`; chế độ khác có thể sinh shear, glTF không lưu được [nguồn];
  - chiều dài hai bên đối xứng.

### S5 — Rig điều khiển

- **Kit theo họ.** D01 là mẫu cho H/S: IK tay/chân có pole, roll gót/mũi/bóng, `ctl_root`, `ctl_cog`, bật/tắt IK bằng thuộc tính.
  Thêm `ctl_Clavicle` cho họ H/S mới.
- **Góc pole** tìm bằng quét. D01: −90°, lệch rest 0 [đo].
- **Xoắn** lái bằng Copy Rotation trục Y local, hoặc phân tách swing–twist khi bake. **Váy** lái bằng Copy Rotation 0,5 từ mỗi đùi.
  Tất cả bake ở R8, vì constraint không ra file.
- **Phép thử chức năng tự động** (D01 có 20 phép): kéo mục tiêu IK, chân kia và thân đứng yên; pole đúng chiều; roll chân; `ctl_root`
  kéo cả model; `ctl_cog` hạ thân mà đế chân đứng yên.

**Rigify** không dùng làm skeleton runtime: cây bone `DEF-` có thể nhiều gốc và bám vào bone `ORG-` [nguồn]. Chỉ cân nhắc làm rig điều
khiển nếu animator cần giao diện Rigify.

### S6 — Skin

1. **Phần cứng:** mỗi đảo cứng (mũ, giáp, gạch, khoá) gán 1 bone với trọng số 1,0.
2. **Sinh ít nhất hai ứng viên:**
   - **A — vùng + khoảng cách** (cách của D01/FL, đã chạy thật): nghịch đảo khoảng cách tới đoạn xương, có cổng vùng và cổng bên, làm
     mịn Laplace trên topology đã hàn.
   - **B — proxy + chuyển + tô** (ở `rigkit-env`):
     - tính bone heat hoặc geodesic voxel trên proxy kín;
     - với asset nhỏ, phóng proxy ×10 vì solver của Blender dùng ngưỡng tuyệt đối 1e-4 [nguồn];
     - chuyển về mesh gốc theo Robust Skin Weights Transfer [nguồn]: chỉ chép ở đỉnh gần, góc pháp tuyến ≤ 35°;
     - phần còn lại tô bằng tối ưu Laplace (scipy) có ràng buộc tổng = 1, không âm.

     Cách này hợp với mesh hở và quần áo dính thân.
   - **C — UniRig skin** (checkpoint đã có, đã chạy):
     - UniRig sinh trọng số cho skeleton của chính nó;
     - chuyển sang skeleton chuẩn theo bảng ánh xạ bone;
     - bone chuẩn không có cặp (xoắn, clavicle, phụ) được tô lại bằng bước inpaint của ứng viên B.
3. **Ép ràng buộc** cho mọi ứng viên, sau mọi bước làm mịn:
   - không có trọng số sang bên đối diện ngoài dải giữa;
   - vùng có danh sách bone chỉ nhận bone trong danh sách (vai túi D01);
   - top-4, cắt trọng số < 0,01, chuẩn hoá;
   - đỉnh trùng vị trí cùng trọng số.
4. **Hồ sơ khớp** [nguồn: research 03 mục 5]:
   - vai pha ba bên chest/clavicle/upperarm;
   - khuỷu, gối: 2–3 vòng đỉnh, 50/50 ở nếp;
   - háng tối đa 3 ảnh hưởng;
   - cổ tay qua vòng xoắn;
   - vùng không cần thì ≤ 2 ảnh hưởng.
5. **Quần áo:**
   - đồ ôm sát lấy trọng số của thân;
   - váy hoặc áo dài nối hai chân: chuỗi bone váy (trước, sau, hai bên) do hai đùi lái. FL rách khi ngồi sâu vì váy chỉ là skin tĩnh
     (114 cạnh giãn > 1,5×) [đo];
   - áo choàng: chuỗi 3–5 bone. Chuyển động phụ và mô phỏng vải bake xuống xương thuộc phiên animation.
6. **Chọn ứng viên theo số đo của S7**, theo từng vùng; ghép có dải chuyển tiếp; ép ràng buộc lại.
7. **Chỉnh tay của người dùng** (vẽ trọng số trong GUI) ghi thành `weights_override.json` theo vị trí đã hàn. Lớp này áp lại sau mỗi lần
   dựng lại, rồi mới ép ràng buộc.

### S7 — ROM và số đo biến dạng

- **Bộ tư thế ROM theo họ:**
  - từng khớp đi neutral → + → neutral → − → neutral (cách của defQA [nguồn]);
  - thêm tư thế tổ hợp: ngồi xổm, bước dài, khoanh tay, xoay thân, giơ tay cao.
- **Biên độ họ H** [đề xuất, từ số lâm sàng]: dang vai 170°, gập khuỷu 150°, gập gối 140°, gập háng 120°, xoay thân ±45°, sấp/ngửa
  cẳng tay ±80°, cổ tay ±60°, xoay cổ ±60°, cổ chân +20/−40°.
- **Số đo** trên mesh đã đánh giá (bản mô phỏng runtime). Blender xuất đỉnh từng tư thế; `rigkit-env` tính:
  - tỉ lệ dài cạnh;
  - thay đổi diện tích tam giác;
  - thể tích vùng khớp;
  - tiết diện cẳng tay khi xoắn 90° (candy wrapper);
  - xuyên giữa các vùng bằng BVH: tay–thân, váy–đùi, khố–đùi (phương pháp D01 B2 đã kiểm chứng);
  - nứt seam;
  - đế chân chạm sàn.
- **Ảnh:**
  - viewport thật qua MCP ở bốn góc: trước, bên, 3/4, camera ARPG nhìn từ trên xuống;
  - bản đồ trọng số từng bone, bản đồ giãn, dải ảnh ghép.

  Opus soi từng ảnh. Lỗi nhỏ có thể chỉ thấy ở cận cảnh: khố D01 xuyên đùi 17,5 mm ở clip death mà góc game không thấy [đo].
- **Lỗi** thì quay về S6 (hoặc S3/S4 nếu do khớp), sửa có mục tiêu, ghi số trước/sau.

### S8 — Xuất kiểm và đối chiếu runtime

- **GLB kiểm** (không phải bản release), tham số cố định:
  - `export_skins=True`, `export_all_influences=False`, `export_influence_nb=4`;
  - `export_yup=True`, `export_rest_position_armature=True`, `export_leaf_bone=False`;
  - không apply modifier [nguồn].
- **A1.1–A1.14** của [`QA_CHECKLIST.md`](QA_CHECKLIST.md), thêm hai mục:
  - không có nhóm đỉnh mồ côi; đỉnh mất hết trọng số sẽ bị gán vào một bone trung tính mới [nguồn];
  - không có bone lá thừa.
- **Reimport sạch** ở thư mục mới. So các tư thế ROM lấy mẫu giữa Blender (bản mô phỏng runtime) và bản reimport.
- **Tuỳ chọn:** mở GLB trong lab qua `chrome-devtools`, đặt cùng tư thế, so đỉnh. Kiểm cả WebGL và WebGPU, vì skinning WebGPU **chưa
  xác minh**.

### S9 — Đóng gói cho G2

Theo cấu trúc ở `Agent.md` mục 5, thêm:
- `rig_recipe.json`: hash đầu vào, phiên bản template và script, nguồn của từng landmark, tham số, lớp ghi đè;
- `landmarks.json`, `analysis.json`;
- `qa_report.md`: số đo, khuyết điểm còn lại, câu hỏi thẩm mỹ cho G2.

Ghi `rig.log`, lưu snapshot. **G2: người dùng duyệt.**

## 4. Ngưỡng khởi điểm [đề xuất; hiệu chỉnh ở P5, rồi ghi vào `QA_CHECKLIST.md` mục A3 mới]

Bản dữ liệu chính thức nằm ở `scripts/solvers/thresholds.json`. Sau các vòng review, định nghĩa đèn ở đó (cạnh rách, tỉ lệ diện
tích, thể tích quả cầu…) mới hơn bảng dưới; khi hai bên lệch nhau thì theo `thresholds.json`.

H là chiều cao danh mục. Ngưỡng tính theo tỉ lệ, để dùng chung cho FL (1,8 m) và D01 (0,5 m).

| Nhóm | Chỉ số | Ngưỡng | Căn cứ |
| --- | --- | --- | --- |
| Khớp | Đầu bone lõi nằm trong mesh | 100%; phần mỏng (tai, khố) ghi miễn | D01 [đo] |
| Khớp | Lệch so với ground truth | lõi ≤ 1% H; ngọn chi, bone phụ ≤ 1,5% H | [đề xuất]; học sâu tốt nhất ~0,5–1,5% kích thước |
| Khớp | Lệch đối xứng trái/phải khi mesh đối xứng | ≤ 0,5% H | [đề xuất] |
| Khớp | Pre-bend khuỷu, gối | 4–10° | [nguồn] 5–10°; D01 4° và 9° [đo] |
| Trọng số | A1.4–A1.7 (không đỉnh trống, tổng = 1, ≤ 4, chỉ số hợp lệ) | như `QA_CHECKLIST` | |
| Trọng số | Đỉnh trùng vị trí lệch trọng số | ≤ 1e-6 | nguyên tắc 6 |
| Trọng số | Rò sang bên đối diện ngoài dải giữa | 0 đỉnh > 0,01 | [đề xuất] |
| Trọng số | Vùng có danh sách bone | 0 đỉnh ngoài danh sách | D01 B1 [đo] |
| Trọng số | Sai số so với trọng số tác giả (chỉ GT tầng 1) | L1 trung bình ≤ 0,1 *(theo đỉnh)* | [đề xuất] |
| Biến dạng | Tỉ lệ dài cạnh trong ROM (ngoài vùng miễn) | vàng ngoài [0,8; 1,25]; đỏ > 1,5 | [đề xuất]; FL rách ở > 1,5× [đo] |
| Biến dạng | Thay đổi diện tích tam giác ở tư thế cực | ≤ ±15% | [đề xuất] |
| Biến dạng | Thể tích vùng khớp | ≥ 0,85 lần rest | [đề xuất] |
| Biến dạng | Tiết diện cẳng tay khi xoắn 90° | ≥ 0,7 lần rest | [đề xuất] |
| Biến dạng | Xuyên mới giữa các vùng | 0 trong ROM chuẩn; tư thế cực ≤ 0,5% H và ghi rõ | [đề xuất] (~1 cm ở 1,8 m) |
| Biến dạng | Nứt seam | 0 | |
| Trọng số | Rò chi: hàng thân mang ≥ 0,1 trọng số gốc chi ở xa chi (`weights_limb_leak`) | xanh ≤ 3, đỏ > 10 hàng đã hàn | [đề xuất] review r3; G2 D01 = 2 |
| Runtime | Blender (mô phỏng) ↔ reimport glTF | ≤ 1e-4 m × H/1,8 | A1.9 |
| Runtime | Blender ↔ three.js (tuỳ chọn) | ≤ 1 mm × H/1,8 | [đề xuất] |
| Quy trình | Thời gian người dùng cho benchmark | ≤ 2 phút mỗi vòng, 0 nếu không có cờ | quyết định P0 |

## 5. Cấu trúc skill

```text
.agents/skills/blender-mcp-rigging/          (tên và chỗ đã duyệt 2026-10-22)
├─ SKILL.md                    ≤ 300 dòng: khi nào dùng, S0–S9, mười nguyên tắc, đọc reference nào khi nào
├─ references/
│  ├─ mcp-operations.md        nối MCP, tool, số đo mục 2.1, mẫu gọi, chụp–so trạng thái, xử lý treo
│  ├─ mesh-intake.md           S1–S2
│  ├─ joint-placement.md       luật giải phẫu, luật đồng thuận, landmark từng họ
│  ├─ skinning.md              ứng viên A/B/C, ép ràng buộc, hồ sơ khớp, quần áo
│  ├─ deformation-qa.md        ROM, số đo, ngưỡng, ảnh
│  ├─ export-runtime.md        tham số glTF, những gì không xuất, đối chiếu runtime
│  ├─ blender-5.2-api.md       slotted actions (key ở channelbag), bone collections, bake, roll, tên L_/R_
│  └─ failure-catalog.md       lỗi đã gặp + cách xử lý (D01, FL, probe MCP; thêm sau mỗi asset)
├─ families/                   H.json, S.json trước; Q/W/A/L/F/O khi có asset đầu tiên của họ
├─ scripts/rigkit/             phần chạy trong Blender: intake, skeleton, control, skin_io, rom_export, render,
│                              export, validate, recipe, rebuild, state_diff
├─ scripts/solvers/            phần chạy ở E:\tools\rigkit-env: proxy, landmarks_geo, skin_candidates, inpaint,
│                              metrics, consensus, unirig_bridge
├─ scripts/tests/              mesh tổng hợp có đáp án (trụ gập, chữ T, hai trụ chồng) + hồi quy D01
└─ evals/                      benchmarks.json, gt/, score.py, kết quả từng vòng
```

`SKILL.md` ghi rõ phân vai:
- khuôn khổ (cổng, đường dẫn, tên bone) theo `Agent.md`, `SKELETON_STANDARD.md`, `QA_CHECKLIST.md`;
- animation theo `blender-game-animation`;
- skill này lo *cách làm* R2–R5 trong Blender qua MCP.

Skill đặt trong `.agents/skills/` như hai skill hiện có, nên đọc trực tiếp file, không gọi bằng công cụ Skill.

Sự thật kỹ thuật phải có trong references (chi tiết ở `research/01`):
- **Bake:** `bpy.ops.nla.bake` gọi từ script phải truyền `frame_start`/`frame_end`, nếu không sẽ bake 1–250. `only_selected` mặc định
  True. Bake constraint cần `visual_keying=True`. Chạy nền dùng `bpy_extras.anim_utils.bake_action_objects`.
- **Slotted actions (4.4+):** key nằm ở `action.layers[i].strips[j].channelbag(slot).fcurves`; không dùng `action.fcurves`.
- **Lật tên:** nhận cả tiền tố `L_`/`R_` (`L_Thigh` ↔ `R_Thigh`), nên quy ước tên hiện tại dùng được với công cụ mirror.
- **Bone heat:** lỗi chỉ là cảnh báo, không dừng thao tác; phải tự đếm đỉnh trống.

## 6. Workflow tạo skill (P0–P7)

| Pha | Việc | Ai làm | Ra | Điều kiện qua | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| P0 | Chốt 5 quyết định | người dùng | mục 8 | đã trả lời | **xong 2026-10-22** |
| P1 | Nối MCP, đo giới hạn thật; dựng `E:\tools\rigkit-env`; cài UniRig | Opus; Sonnet cài UniRig | `.mcp.json`, `probe.json`, `references/mcp-operations.md`, ghi chú cài | tool `blender` chạy trong phiên mới; ảnh không đen; biết ngưỡng; UniRig chạy hoặc có báo cáo vì sao không | **xong 2026-10-23**: tool `blender` chạy trong phiên mới (`get_addon_status` protocol 14, `look` nhiều góc tự căn khung) |
| P2 | Chưng cất kiến thức (5 file `research/`, D01, FL, probe) thành references và `families/H.json`, `S.json`; mỗi luật có nhãn nguồn, độ tin | Opus | `references/*.md`, `families/` | Opus soát | **bản nháp xong 2026-10-22**: `SKILL.md`, 8 file references, `families/H.json`, `S.json`, `README.md` (schema 0) |
| P3 | Tổng quát hoá `D01_hodling/rig/tools/` thành `rigkit` + `solvers`: tham số hoá, bỏ đường dẫn cứng, tách toán nặng ra `rigkit-env`, thêm ứng viên skin B, đồng thuận landmark, số đo ROM, đối chiếu runtime, recipe, rebuild, chụp–so trạng thái | Opus 5.5 max + fast mode viết (người dùng chọn 2026-10-23 để nhanh, thay Sonnet), Opus review theo vòng ở `Agent.md` gốc | `scripts/` + `tests/` | test tổng hợp đạt; dựng lại D01 từ GLB gốc cho số đo bằng hoặc tốt hơn v4 | **xong 2026-10-23** (review cuối vòng 2 PASS).
- Test: 21 bộ đều đạt.
- `pipeline.py` chạy trọn S0–S9:
  - D01 khoảng 8 phút: exit 0, S4 22/22, A1 14/14, parity 1.4e-6 m.
  - FL: exit 0, A1 14/14.
- D01 dựng lại theo profile legacy khớp v4: L1 7e-5, GLB thử giống từng byte.
- D01 chạy luật chung, không có luật riêng của asset: màu đèn giống G2, riêng candy wrapper đỏ → xanh.
- So số từng chỉ số để vào P5.

`CONTRACT.md` chốt bố cục và định dạng. Review tới vòng 3: R0, A1, B, C PASS; A2 sửa vòng 4 (I1). Vòng tích hợp:
- I1: sửa nốt A2;
- I2: số đo rò chi, đường bao chi cho cách B, cổng chọn theo vùng, `flag_tiles`;
- I3: `scripts/pipeline.py` chạy trọn S0–S9 trên D01 (S) và FL (H), mỗi model 10–14 phút;
- I4 (xong): sửa 6 lỗi giao tiếp.
  - `head_top`: lấy nhầm đảo con mắt. D01 qua S4 22/22 mà không cần `--keep-going`.
  - Dung sai A1.14 là 5e-5. FL đạt 14/14.
  - `z_offset` ghi ngay từ intake.
  - Cách A dùng chung đường bao chi: số hàng rò D01 1269 → 0, FL 428 → 0.
  - Không còn sinh `.blend1` hay thư mục tạm.
  - Pha lọc thô của phép đo xuyên nhanh hơn, kết quả giữ y hệt.
- Review cuối (I1–I4): **FAIL**, 3 lỗi major trong driver.
  - `--keep-going` không đánh dấu TEST ONLY tới cuối.
  - S8 crash vẫn được tính là xong.
  - Chạy tiếp (resume) dùng lại kết quả cũ mà không báo.
- I5 (xong): sửa ba lỗi đó.
  - Cờ TEST ONLY lưu trong state.
  - Crash và kiểm tra trượt dùng hai mã khác nhau.
  - Mỗi bước có dấu vân tay gồm tham số, hash input và hash script. Khi chạy tiếp mà vân tay khác thì từ chối và chỉ rõ `--from` cần chạy lại.
  - argv của mọi lần chạy ghi vào recipe.
  - Ứng viên bị loại vì rò không quay lại qua dải chuyển tiếp: D01 L1 vs G2 0.2142 → 0.2076.
- Review vòng 2: **PASS**. Lỗi nhỏ n1 (CRLF) đã xử lý bằng `.gitattributes` `eol=lf` trong thư mục skill.

Việc còn mở, chuyển sang P5:
- **Bộ chọn ứng viên:** sau khi cách A hết rò, vùng hông rách nhiều hơn (D01 38 → 46, FL 63 → 94). Phải hiệu chỉnh bằng GT tầng 1.
- **Ngưỡng `head_top`:** 25° và 60°.
- **Clavicle_L của U01** dời 83 mm, chưa ai xem.
- **Vân tay chưa có phiên bản Blender** (n3). JSON thoát sớm thiếu trường TEST (n2).
- **Recipe ghi `exit: null`** cho lần chạy tự ghi nó.
- **Danh sách script của từng bước** trong `pipeline_steps/inputs.py` phải sửa tay.

Mọi phán quyết đã ghi vào `references/` |
| P3G | Đồ dài và phụ kiện treo (người dùng yêu cầu 2026-10-23, làm bước 1–3): váy và áo dài phủ chân, tà áo, áo choàng, chuỗi hạt và tua, tay áo rộng, tóc, đồ treo cứng | Opus 5.5 max + fast viết; Opus review | `references/cloth-and-attachments.md`; bước S3g (`garments.py`, `chains.py`); lớp trọng số vải (`skin_garment.py`); leg-push trong control rig; tư thế và số đo QA cho vải | review PASS; FL có chuỗi xương và trọng số vải, chạy trọn pipeline | **xong 2026-10-23** (review vòng 5 PASS; vòng 1–4 FAIL đều đã sửa).
- Tra cứu: `research/04`, `05a` (ngành game, engine), `05b` (bài báo, mã nguồn mở).
- Người viết: G1–G7, thêm phần sửa của orchestrator.
- Test: 489 đạt.
- FL chạy trọn S0–S9 (`E:\tmp_rigkit\G_final5\FL_H`):
  - 8 chuỗi, 14 xương phụ, A1 14/14;
  - không lan trọng số sang mảnh khác, xương nào cũng phủ ≥ 11 đỉnh.
- D01: khố trước và sau mỗi bên 1 xương, A1 14/14.

Còn mở cho P5/G2:
- Các đèn vải đỏ đều báo trung thực: chân xuyên vải, viền giãn 0,91–1,15, cạnh rách ở dải chuyển tiếp khi ngồi xổm, đèn lồng chạm áo khi ngả.
- Chuỗi hạt đứng cách áo gần như kiểu "que" ở tư thế cực hạn: đánh đổi để không cắt vào áo, R8 sẽ bake.
- Vạt trước FL không còn chuỗi riêng, vì vải dính vào chân.
- Đồ treo ở thắt lưng chưa có xương lắc.
- Mọi con số đều là suy luận, cần hiệu chỉnh bằng Dem Bones / GT.

Bước 4 (so với rig tay FL) chưa làm theo yêu cầu |
| P4 | Bộ benchmark và ground truth theo ba tầng (mục 7). Người dùng không phải dành phiên riêng | Opus; Haiku tra giấy phép nguồn CC0 | `evals/benchmarks.json`, `evals/gt/` | GT tầng 1 và 2 sẵn sàng | chưa |
| P5 | Vòng đánh giá: mỗi benchmark chạy bằng **một phiên Opus mới chỉ có skill**, không mang ngữ cảnh cũ. `score.py` chấm. So với khi không có skill và với UniRig thuần. Sửa skill rồi lặp. Review hẹp, có giới hạn thời gian | Opus chạy; một phiên Opus khác chấm | `evals/run_<n>/` | mọi benchmark đạt mục 4; tờ hỏi người dùng ≤ 2 phút | chưa |
| P6 | Thử thật: một asset H mới đi qua G1 → G2 cùng người dùng | Opus + người dùng | rig thật | G2 PASS | chưa |
| P7 | Chốt chuẩn: ngưỡng vào `QA_CHECKLIST.md` (mục A3); nối link ở `Agent.md` và `AGENTS.md`; ghi "Ghi chú từng lần chạy" | Opus viết; người dùng duyệt | | người dùng duyệt | chưa |
| Duy trì | Mỗi asset thêm lỗi vào `failure-catalog.md`; mỗi lần sửa `rigkit` chạy lại benchmark; mỗi asset qua G2 tự vào benchmark tầng 2 | | | | |

P1 và P2 chạy song song. P3 cần `families/` của P2. P4 chuẩn bị song song với P3.

## 7. Bộ benchmark và ground truth (đã tối ưu thời gian người dùng)

Yêu cầu của người dùng: 10–15 phút mỗi asset là quá nhiều. Thiết kế mới tách hai việc:
- **Chấm biến dạng và runtime không cần ground truth.** ROM, giãn cạnh, xuyên, nứt seam, đối chiếu reimport đều đo được trên mọi asset.
- **Chấm vị trí khớp và trọng số** thì cần ground truth. Phần này lấy từ ba tầng, hai tầng đầu tốn **0 phút** của người dùng:

| Tầng | Nguồn ground truth | Thời gian người dùng | Dùng cho |
| --- | --- | --- | --- |
| 1. Rig của tác giả | Nhân vật và thú **CC0 đã rig sẵn** (dự kiến: Quaternius, KayKit; giấy phép kiểm ở P4). Gỡ rig rồi "làm hỏng" cho giống mesh Tripo: voxel remesh, giảm còn ~10k tam giác, hàn, tuỳ chọn dính ngón. Skeleton và trọng số gốc của tác giả là đáp án chính xác | 0 | sai số khớp **và** trọng số; số lượng không giới hạn; có cả bốn chân, chim nếu gói có |
| 2. Rig đã qua G2 | D01 hiện có; từ nay mọi asset qua G2 tự vào benchmark | 0 (G2 vốn là việc thường lệ) | hồi quy trên mesh Tripo thật |
| 3. Asset ASHLAR chưa có rig (FL, U01…) | Đồng thuận nhiều nguồn + Opus soi ảnh. Chỉ khớp còn bất đồng mới gom vào **một tờ ảnh cho cả vòng**: mỗi khớp một ô nhỏ có mã. Người dùng trả lời một dòng ("ok", hoặc "U01 L_Knee thấp") | ≤ 2 phút mỗi vòng, 0 nếu không có cờ | mesh Tripo thật chưa có rig |

Danh sách benchmark vòng đầu (họ H/S, khớp phạm vi đầu tiên ở `Agent.md` mục 9.5):

| Asset | Họ | Tầng | Vì sao chọn |
| --- | --- | --- | --- |
| 2–3 nhân vật CC0 đã rig (chọn ở P4) | H | 1 | đáp án chính xác cho khớp và trọng số |
| D01 Hodling | S | 2 | mesh lệch, tai không đối xứng, vai túi, khố |
| FL Flagellant A | H | 3 | váy dài, ngón dính |
| U01 Shambler | H | 3 | humanoid quái, dáng khác chuẩn |

Vòng 2 (khi có template họ khác): B01 Sexton's Dog và W03 Hush-Wolf (Q, W03 chân khuỷu ngược), W07 Shroud-Spinner (A, 8 chân),
W02 Gibbet-Crow (W). Kèm thú CC0 đã rig làm tầng 1.

`score.py` chấm:
- sai số khớp (% H);
- sai số trọng số (tầng 1);
- tỉ lệ số đo ROM đạt;
- độ lệch runtime;
- số khớp phải hỏi người dùng;
- thời gian chạy;
- số lệnh MCP lỗi hoặc treo.

## 8. Quyết định P0 (người dùng duyệt 2026-10-22)

1. Skill đặt ở `.agents/skills/blender-mcp-rigging/`. **Được.**
2. Thêm server `blender` vào `.mcp.json` và mở Blender GUI trên máy khi rig. **Có.** Đã làm (mục 2.1).
3. Họ H thêm clavicle và xương xoắn tay. **Có.** Đã ghi vào `SKELETON_STANDARD.md` mục 3 cho asset H/S mới; D01 giữ nguyên.
4. Cài UniRig chạy trên máy. **Có.** Đã cài và chạy được ở `E:\tools\unirig` (mục 2.1); ghi chú ở `E:\tools\unirig\INSTALL_NOTES.md`.
5. 10–15 phút mỗi benchmark để duyệt ground truth. **Không, tối ưu lại.** Đã thay bằng ba tầng ground truth ở mục 7 (≤ 2 phút mỗi vòng).

## 9. Rủi ro đã biết

- **Lệnh MCP dài treo Blender và không huỷ được** [đo]. Cách tránh: trần 20 s mỗi lệnh; toán nặng chạy ở `rigkit-env`; việc dài chạy
  `blender -b`.
- **numpy của Blender chậm khoảng 100 lần với đại số tuyến tính** [đo]: không giải hệ lớn trong Blender.
- **Bone heat** lỗi với mesh nhỏ, hở hoặc có đảo rời; các bone sau không có trọng số mà không báo dừng [nguồn]. Cách tránh: proxy,
  phóng ×10, đếm đỉnh trống.
- **UniRig** chạy được nhưng dựa vào wheel cộng đồng (flash-attn) và một bản vá nhỏ. Nâng torch hay CUDA có thể làm hỏng, nên giữ
  nguyên các phiên bản đã ghi. VRAM đỉnh khoảng 10 GiB: không chạy UniRig cùng lúc với việc nặng GPU khác. SkinTokens không chạy được
  với 12 GB VRAM. Puppeteer cần `bpy==4.2`, không chung môi trường với Blender 5.2 [nguồn].
- **Skinning WebGPU** của three.js chưa xác minh; S8 phải đối chiếu cả hai backend.
- **Chưa có ngưỡng công bố nào:** mọi số ở mục 4 là khởi điểm, có thể đổi sau P5.
- **Mesh Tripo dính ngón hoặc dính váy với chân** thì rig không sửa được. Phải quyết ở S1, không để tới G2 mới phát hiện.
- **Một `.mcp.json` chỉ trỏ một cổng.** Rig song song nhiều asset cần cấu hình MCP riêng cho từng phiên.

## Lịch sử

- 2026-10-22: tạo bản đề xuất từ hai tài liệu của người dùng, ba báo cáo nghiên cứu bổ sung và bài học D01/FL.
- 2026-10-22: người dùng duyệt P0 (1–4 đồng ý; 5 yêu cầu tối ưu). Thêm `.mcp.json` (blender-mcp 2.0.0, tắt telemetry); nâng addon
  lên protocol 14; đo MCP thật; thêm `rigkit-env` cho toán nặng; ground truth ba tầng; H/S thêm clavicle và xương xoắn; cài
  UniRig, chạy được trên D01 và FL.
