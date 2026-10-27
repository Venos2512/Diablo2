# Rig brief — P06_poppy_mound

Trạng thái: **G1 duyệt (2026-10-26)**; R2–R5 xong, **G2 duyệt (2026-10-27)** (A1 14/14; báo cáo [`qa_report.md`](qa_report.md));
rig đã xuất (chưa clip) vào [`../rig_done/`](../rig_done/) bằng `scripts/p06_r8_export.py`. Quy trình: [`Agent.md`](../../../../rig-anim/Agent.md). Chuẩn:
[`SKELETON_STANDARD.md`](../../../../rig-anim/SKELETON_STANDARD.md). Ảnh đề xuất: [`qa/P06_poppy_mound_G1_joints.png`](qa/P06_poppy_mound_G1_joints.png).
Số đo R0–R1: [`_work/r1_inspect.json`](_work/r1_inspect.json), [`_work/g1_joints.json`](_work/g1_joints.json) (script ở `scripts/`, GLB chỉ đọc).

Yêu cầu của người dùng (2026-10-26): rig con này dù danh mục (`ashlar/3d/README.md`) và `rig_v1/BRIEF.md` §2c ghi "tĩnh, không rig".
Phạm vi lượt này: R0–R5, dừng ở G2. Không làm clip, không xuất GLB/FBX, không đăng ký lab. 2026-10-27, sau G2, người dùng
yêu cầu xuất rig vào đúng thư mục (`rig_done/`, bố cục `export_core` của skill); vẫn chưa làm clip, chưa đăng ký lab.

## Thông tin asset

| Mục | Giá trị |
| --- | --- |
| `asset_id` | `P06_poppy_mound` |
| Nhóm / loại | quái, họ Perfection-born (P); spawner đứng yên, thả Hush-Moth (P03) cho tới khi bị phá |
| GLB gốc | `P06_poppy_mound.glb`, 14,1 MB, 8.948 tam giác, 6.525 đỉnh (5.463 sau khi hàn), 1 mesh, 1 material; base color + normal (jpg) + rm (png) đều 4096²; không skin, không vertex group; sha256 `76737dd9…f55b75b` |
| Nguồn mesh | nhánh prop: **một ảnh** Astra 3/4 + Smart Mesh một ảnh. Mặt sau do Tripo đoán (không có mặt người, nếp vải thô) |
| Kích thước thật | rộng **4,50 m** (danh mục và concept ghi "width 2,50H"; H = 1,8 m). Scale đều từ GLB: **× 4,5022** |
| Kích thước sau scale [đo] | rộng 4,50 m (2,50H) · sâu 4,43 m (2,46H) · cao 1,70 m tới đỉnh bông lớn (0,94H; concept ~0,90H) · đỉnh gò 1,12 m (0,62H; concept ~0,65H) |
| Tư thế gốc | khối nghỉ trên sàn, đế phẳng ở z = 0; không có tư thế T/A (vật thể) |
| Cấu trúc mesh [đo] | 32 mảnh hình học: **thân gò một mảnh liền** (3.306 đỉnh hàn: vải liệm, khối thịt, mặt người, tay khoanh, mép vải chạm đất) + **31 mảnh hoa rời** (9 hoa có cuống, 9 nụ cuống dài, 13 cụm lá; cắm hoặc nằm trên chỏm, không hàn vào thân). Đáy hở (không có mặt đáy). 95 cạnh non-manifold, 2.095 cạnh biên (vải một lớp) |
| Khác concept | **ba** mặt người ngủ (giữa mặt trước, hông trái +X, hông phải −X; concept có hai); gò **tròn** (sâu 2,46H, concept 1,58H) |

## Quyết định rig

| Mục | Lựa chọn | Lý do |
| --- | --- | --- |
| Họ skeleton | **O** (vật thể, tổ) | không đi, không đánh; chỉ thở, lắc hoa, thả bướm, sụp |
| Route | **M** (dựng bằng code trong Blender nền theo landmark đo trên mesh) | route A tốn credit và auto-rig không hiểu vật thể này |
| Công cụ | Blender 5.1 nền + script trong `rig/scripts/`; helper render của `rig_v1/tools/rigbatch.py` (import, không sửa) | |
| Ước tính credit | **0** | không Tripo, Meshy, UniRig |
| Bone | 15 runtime: `root` + **10 bone deform** + 4 socket (bảng dưới) | trần 10 deform của họ O (SKELETON_STANDARD §2) |
| Bone ngón tay, bone mặt | không | ba mặt người đi theo bone sườn chứa nó (`flank_front`, `L_flank`, `R_flank`) |
| Bone phụ | các bone `bloom_*` (hoa) | |
| Socket | `fx_spawn_main`, `fx_spawn_L`, `fx_spawn_R` (thả bướm), `fx_body` (VFX trúng đòn, nổ khi chết) | không vũ khí |
| Vật phụ rời | không | 31 mảnh hoa thuộc mesh gốc, skin chung một mesh |

### Skeleton runtime (đề xuất; toạ độ Blender, mét, quái nhìn −Y, `L_` = +X)

| Bone | Cha | Deform | Đầu → đuôi | Vùng phủ | Dùng cho |
| --- | --- | --- | --- | --- | --- |
| `root` | – | không | (0, 0, 0) → +Y 0,4 | – | gốc engine kéo cả con; điểm `ground` (bóng, vòng chọn) |
| `body` | `root` | có | (0,02; −0,10; 0) → cao 0,42 | đế gò: mép vải chạm đất, phần thấp quanh đế; neo cứng xuống sàn | vai trò `cog`: dịch cả khối (lún khi chết); không xoay khi nghỉ |
| `crown` | `body` | có | trục giữa 0,42 → 1,06 (bề mặt chỏm) | chỏm gò từ ~0,45 m trở lên, nhạt dần xuống hông | thở (nâng theo trục bone), rung khi trúng đòn (xoay quanh gốc trong khối), sụp khi chết (hạ) |
| `flank_front` | `body` | có | trong khối 0,5 m → mặt người trước (0,16; −1,62; 0,56) | sườn trước quanh mặt người và tay khoanh | phồng/xẹp (đẩy ra theo trục bone), mặt "cựa" (xoay vài độ) |
| `L_flank` | `body` | có | → mặt người hông trái (+1,80; 0,29; 0,47) | sườn trái quanh mặt | như trên |
| `R_flank` | `body` | có | → mặt người hông phải (−1,80; 0,31; 0,50) | sườn phải quanh mặt | như trên |
| `flank_back` | `body` | có | → sườn sau (0,02; 1,75; 0,45) | sườn sau (không có mặt) | phồng/xẹp |
| `bloom_center` | `crown` | có | gốc cụm giữa (0,05; 0,55; 0,98) → 1,34 | 4 hoa/nụ giữa (mảnh 1, 4, 23, 31) | lắc gió, run khi thả bướm |
| `bloom_main` | `bloom_center` | có | gốc cuống (0,09; 0,55; 0,93) → tâm bông lớn (0,26; 0,31; 1,53) | bông anh túc lớn (mảnh 5): đầu hoa cứng, chỉ cuống uốn | gật, ngóc lên khi thả bướm, gục khi chết |
| `L_bloom` | `crown` | có | gốc cụm trái (0,67; 0,57; 0,75) → (0,86; 0,63; 1,07) | 5 hoa/nụ trái (11, 24, 25, 29, 30) | lắc, héo |
| `R_bloom` | `crown` | có | gốc cụm phải (−0,85; 0,22; 0,78) → (−0,94; 0,10; 1,10) | 7 hoa/nụ phải (6, 9, 13, 16, 26, 27, 28); R2: mảnh 3 là cụm lá dày, xếp vào lá, gốc bone dời ~9 cm so với ảnh G1 | lắc, héo |
| `fx_spawn_main` | `bloom_main` | socket | tâm bông lớn | – | điểm thả Hush-Moth chính |
| `fx_spawn_L` | `L_bloom` | socket | đầu hoa lớn nhất cụm trái (mảnh 11) | – | điểm thả phụ |
| `fx_spawn_R` | `R_bloom` | socket | đầu hoa cao nhất cụm phải (mảnh 9) | – | điểm thả phụ |
| `fx_body` | `crown` | socket | tâm khối, cao 0,6 | – | VFX trúng đòn, nổ khi chết |

Ba bone `bloom_*` của cụm đặt song song (cùng cha `crown`), không lồng nhau: xoay một cụm không kéo gốc cụm khác lên khỏi chỏm. Bone
cụm hoa chỉ uốn phần trên của cuống; gốc cuống đi theo bề mặt gò ngay dưới nó. Cụm lá nằm trên chỏm đi theo bề mặt gò (cộng một ít
bone cụm ở đầu lá).

Quy ước họ O đề xuất ghi vào `SKELETON_STANDARD.md` §3 khi G1 duyệt: lõi `root` (không deform) → `body` (deform, vai trò `cog`),
các bộ phận đặt tên theo bộ phận (`crown`, `flank_*`, `bloom_*`; con khác: `lid`, `jaw`, `door`…), socket `fx_*`.

### Rig điều khiển (chỉ trong `.blend`, không xuất)

| Control | Cha | Tác dụng |
| --- | --- | --- |
| `ctl_breath` | `root` | kéo lên/xuống = phồng/xẹp: cộng vào vị trí `crown` (nâng) và bốn `flank_*` (đẩy ra) qua Transformation constraint chế độ cộng; vẫn key được từng bone riêng |
| `ctl_sway` | `root` | xoay = lắc gió cho bốn `bloom_*`, mỗi bone một hệ số |

Không IK (không có chi). Constraint được bake lên skeleton runtime ở R8.

## Kích thước, trục, đơn vị

| Mục | Giá trị |
| --- | --- |
| Rig ở kích thước thật | có, ngay từ đầu (rộng 4,50 m, scale đều × 4,5022, ghi trên object và trong `rig.log`) |
| Trục tiến / trục lên | Blender −Y / +Z → glTF +Z / +Y |
| Đơn vị | mét |
| Pivot | giữa đế, đế ở z = 0 |
| A1.11 | danh mục cho **chiều rộng**, nên kiểm rộng 4,50 m ± 2 % thay cho chiều cao |

## Thông số animation

| Mục | Giá trị |
| --- | --- |
| fps | 24 |
| Loop / root motion | `idle` loop kín; không root motion (con này đứng yên); `death` dừng ở pose cuối |
| Sự kiện gameplay | `cast`: `fx` thả bướm ở 50 % (khớp `hitAt` 0,5 của lab) tại `fx_spawn_*`; `death`: `fx` nổ ở đầu clip (tuỳ chọn) |
| Tham chiếu | concept `concept.png`, `prop_input.png`; chưa có video |
| Rig điều khiển | IK chân: không · IK tay: không · control: `ctl_breath`, `ctl_sway` |
| Giới hạn influence | 4 (glTF), tổng trọng số 1 |
| Tiếp tục file của người khác? | không |

## Bộ trạng thái (SKELETON_STANDARD §5 cột O; chỉ liệt kê, lượt này không làm clip)

| State | Cần? | Nội dung dự kiến | Ghi chú |
| --- | --- | --- | --- |
| `idle` | R | thở chậm (chỏm nâng, sườn phồng), hoa lắc nhẹ, thỉnh thoảng một mặt người cựa; 3–4 s | loop kín |
| `cast` | O → **nên có** | thả bướm: khối co rồi phồng mạnh, bông lớn ngóc lên và rung, bướm ra ở 50 %; ~1,2–1,6 s | tên `cast` để lab tự gán (`clips.js` đã có state này); nếu muốn tên riêng `spawn` thì phải đăng ký riêng trong lab |
| `hit` | O → **nên có** | chỏm giật lệch khỏi hướng đòn, sườn lõm, hoa quất; 0,3–0,5 s | |
| `death` | O → **nên có** (phá huỷ) | gò sụp (chỏm hạ ~35 %, sườn bè ra), hoa héo gục; 1,5–2,5 s | không loop |
| `attack`, `revive` | O → không cần | con này không đánh cận chiến, bị phá là hết | |
| `walk`, `run`, `attack2`, `block`, `jump`, `dodge` | – | | họ O không có |

## Cách skin (R3) và kiểm (R4–R5)

- Trọng số trên **lưới đã hàn** (5.463 đỉnh): mỗi bone động một nhân theo khoảng cách tới đoạn xương; `body` nhận phần neo theo độ
  cao (đế chạm đất = 1); chuẩn hoá, làm mịn Laplace, cắt còn tối đa 4 ảnh hưởng, chuẩn hoá lại; chép về mesh thật. Không dùng
  Automatic Weights.
- Mảnh hoa: cuống và nụ nhận gradient theo khoảng cách dọc mảnh từ chỗ cắm vào gò (trọng số của bề mặt gò tại đó) tới đầu hoa (bone
  cụm); đầu bông lớn gán cứng `bloom_main`. Cụm lá chép trọng số bề mặt gò bên dưới.
- Tư thế thử (R5): phồng (chỏm +8 cm, sườn +6 cm), xẹp (chỏm −8 cm, sườn −4 cm), hoa nghiêng hết biên (±30° mỗi trục, bông lớn
  ±35°), rung trúng đòn (chỏm 6°), mặt cựa (sườn ±8°), sụp (chỏm −40 cm, sườn bè và lún, hoa gục ~70°). Ba góc mỗi tư thế.
- Số đo: weight health (A1.4–A1.7), độ giãn cạnh từng tư thế, đế lệch khỏi sàn (z thấp nhất, trượt ngang), khe giữa gốc cuống/lá và
  mặt gò, độ méo đầu bông lớn.

## Rủi ro và vùng khó skin

- **Ba mặt người và tay khoanh** (phù điêu trên thân liền): đi gần như cứng theo bone sườn; viền chuyển tiếp quanh mặt phải mịn để
  mặt không trượt khỏi vải liệm. Tay của mặt trước chạm sàn: phần chạm đất neo theo `body`, nên tay giãn nhẹ khi sườn phồng.
- **31 mảnh hoa không hàn vào gò**: gốc cuống và lá phải theo đúng bề mặt bên dưới, nếu không sẽ hở hoặc chìm khi chỏm nâng hay sụp.
- **Mép vải chạm đất và đáy hở**: neo vào `body` để đế không nhấc khỏi sàn hay trượt khi thở, trúng đòn.
- **Sụp khi chết** là biến dạng lớn (chỏm hạ ~35 % chiều cao gò): các nếp vải trên chỏm có thể đâm vào nhau; chỉ đánh giá như pose
  chết.
- **Bông lớn rộng ~0,6 m**: cánh hoa không được giãn; chỉ cuống uốn.
- **Giữa hai bone sườn** (góc 45°) độ phồng còn ~70 % nếu nhân hẹp; chỉnh độ rộng nhân ở R3 cho khối phồng đều.
- **Mặt sau do Tripo đoán**: nếp thô, không ảnh hưởng rig.

## Chỉ tiêu qua cổng

- G2: các mục A1, A2 của `QA_CHECKLIST.md` (A1.11 theo chiều rộng), cộng các vùng khó ở trên.
- G3, G4: phiên clip riêng.

## Câu hỏi G1 (đã duyệt 2026-10-26, cả bốn theo đề xuất)

1. Duyệt **bảng bone** (10 deform, tên, cha, socket) và hai control `ctl_breath`, `ctl_sway`?
2. Clip thả bướm đặt tên **`cast`** (lab tự gán, sự kiện ở 50 %) hay state riêng `spawn`?
3. Giữ **kích thước 4,50 m** (danh mục, concept ghi "width 2,50H") và giữ mesh tròn như Tripo dựng (sâu 2,46H thay vì 1,58H)?
4. Ba mặt người đi theo bone sườn, không thêm bone mặt riêng (giữ trần 10 deform)?

## Duyệt

| Cổng | Ngày | Kết quả | Người duyệt | Ghi chú |
| --- | --- | --- | --- | --- |
| G1 (brief) | 2026-10-26 | **duyệt** | người dùng | duyệt cả bốn câu hỏi theo đề xuất: bảng bone + `ctl_breath`, `ctl_sway`; clip thả bướm tên `cast`; rộng 4,50 m, giữ gò tròn; ba mặt theo bone sườn, không bone mặt riêng |
| G2 (rig) | 2026-10-27 | **duyệt** | người dùng | xem trong Blender rồi "done": giữ một bone cho mỗi cụm hoa, biên `L/R_bloom` ±15°; xuất `rig_done/`. R2–R5 2026-10-26: A1 14/14; A2 đạt trong biên độ dùng được, không đạt ngưỡng 1,6× ở hoa nghiêng 30–35° (`L/R_bloom`) và sụp 40 cm có đẩy sườn ra; `qa/P06_poppy_mound_G2_1..4_*.png` |
| G3 (clip) | | | | phiên animation riêng |
| G4 (trong lab) | | | | |
| R9 (tích hợp engine, nếu có) | | | | |
