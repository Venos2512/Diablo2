# QA rig — P06_poppy_mound (R2–R5, G2 duyệt 2026-10-27)

Ngày 2026-10-26 · họ O · route M · Opus 5.5 · 0 credit · G1 duyệt 2026-10-26 ([`rig_brief.md`](rig_brief.md)).
Số đo: [`validation.json`](validation.json) (A1), `_work/r5_metrics.json` (tư thế thử), `_work/r3_weights.json` (trọng số).

## 1. Bàn giao

| File | Nội dung |
| --- | --- |
| `P06_poppy_mound_rig.blend` | mesh ở kích thước thật (×4,5022, rộng 4,50 m) + armature `P06_poppy_mound_Rig`: 15 bone runtime (collection `Runtime`, `Socket`) + 2 control (collection `Control`); texture gốc 4096 đóng gói; pose nghỉ, viewport Solid + texture |
| `validation.json` | A1.1–A1.14: **14/14 đạt**; kèm tóm tắt tư thế thử |
| `qa/P06_poppy_mound_G2_1_skeleton.png` | skeleton chồng mesh: trước, trái, sau, trên xuống (nhãn tên bone) |
| `qa/P06_poppy_mound_G2_2_weights.png` | bone trội bốn góc + cận cụm hoa, từng bone deform |
| `qa/P06_poppy_mound_G2_3_poses.png` | 9 tư thế × 3 góc, texture |
| `qa/P06_poppy_mound_G2_4_detail.png` | bản đồ dịch chuyển, độ giãn, cận mặt người trước, cận cụm hoa |
| `qa/raw/` | ảnh render gốc (Workbench, texture thu 1024 chỉ khi render) |
| `P06_poppy_mound_rig_P06_poppy_mound_Rig_rig.json` (+ `_rig_tex/`) | dữ liệu cho rig editor (cổng 8778) |
| `scripts/` | `p06_common.py`, `p06_r1_*.py`, `p06_r2r3_build.py`, `p06_r4_validate.py`, `p06_r5_qa.py`, `p06_r5_variants.py`, `p06_sheet.py` |

Chạy lại cả chuỗi (Blender 5.1 nền, mỗi lệnh `-b --factory-startup -P scripts/<x>.py`): `p06_r2r3_build` → `p06_r4_validate` →
`p06_r5_qa` → `p06_r4_validate` (gắn số tư thế vào validation) → ghép ảnh bằng `p06_sheet.py` (Python hệ thống, `-I`). GLB gốc chỉ
đọc (sha256 kiểm mỗi lần nạp).

## 2. R2 — skeleton

- Runtime đúng bảng G1 (SKELETON_STANDARD §3, họ O): `root` → `body` → `crown` (→ `bloom_center` → `bloom_main`, `L_bloom`,
  `R_bloom`), `flank_front`, `L_flank`, `R_flank`, `flank_back`; socket `fx_spawn_main`, `fx_spawn_L`, `fx_spawn_R`, `fx_body`.
  10 deform. Roll: bone dọc có trục Z cục bộ hướng −Y (trước); bone sườn có Z hướng lên, Y hướng ra ngoài (tịnh tiến Y = đẩy ra).
- `R_bloom` dời ~9 cm so với ảnh G1 vì mảnh 3 (một cụm lá dày) nay được xếp là lá, không còn tính vào tâm cụm hoa phải.
- Control: `ctl_breath` (trên chỏm, cao 1,95 m), `ctl_sway` (trên bông lớn). Transformation constraint, không gian cục bộ, chế độ
  **cộng** (key trực tiếp trên bone runtime vẫn có tác dụng):
  - `ctl_breath` tịnh tiến Y → `crown` Y × 1,0; bốn `flank_*` Y × 0,75. Kiểm: kéo `ctl_breath` +8 cm cho mesh trùng tư thế "phồng"
    key tay (lệch 0,000 mm).
  - `ctl_sway` tịnh tiến X/Z và xoay X/Z → `bloom_center` × 1,0, `L_bloom`, `R_bloom` × 0,9, `bloom_main` × 0,4 (cộng thêm phần
    thừa hưởng từ `bloom_center`).
  - Constraint không xuất được: bake lên bone runtime ở R8.

## 3. R3 — skin

Trên lưới đã hàn (5.463 đỉnh, hàn 0,1 mm), chép về 5.723 đỉnh thật. Không dùng Automatic Weights.

| Vùng | Cách tính |
| --- | --- |
| Đế (`body`) | neo theo độ cao: 1 dưới 3 cm, giảm về 0 ở 30 cm; đỉnh dưới 6 cm giữ nguyên (không làm mịn) |
| Chỏm (`crown`) | vòm theo độ cao 0,35 → 0,85 m (luống hoa 0,6–1,1 m gần như toàn `crown`) |
| Sườn (`flank_*`) | phần còn lại chia cho bốn bone sườn theo nhân Gauss khoảng cách tới đoạn xương (σ 0,8 m) |
| Ba mặt người | trong 0,22 m quanh điểm mặt (đuôi bone sườn) chỉ bone sườn của mặt đó, nhạt dần tới 0,55 m; không có `crown` |
| Làm mịn | 3 vòng Laplace, trọng số cạnh 1/độ dài (cạnh dài của vạt vải không kéo trọng số sườn xuống sàn) |
| Cuống, nụ, hoa | gradient tuyến tính theo khoảng cách dọc mảnh: gốc = trọng số mặt gò tại chỗ cắm, đầu = bone cụm (đầu hoa từ 60 % chiều dài, nụ 80 %) |
| Hoa xa tâm cụm | phần theo bone cụm giảm từ 1 (đầu hoa trong 0,25 m quanh gốc bone) xuống 0,45 (từ 0,70 m), áp đều cả đầu hoa nên đầu không méo; ba bông mang socket giữ 1 |
| Cụm lá | chép trọng số mặt gò ngay dưới từng đỉnh, đầu lá thêm tối đa 15 % bone cụm, làm mịn 6 vòng trong mảnh |
| Chuẩn hoá | bỏ trọng số < 0,005, tối đa 4 ảnh hưởng, tổng 1 |

Số đỉnh bị bone chi phối: `crown` 1.891, `body` 1.238, `flank_front` 511, `L_flank` 462, `R_flank` 461, `R_bloom` 254, `L_bloom` 192,
`bloom_center` 188, `flank_back` 183, `bloom_main` 83.

## 4. R4 — A1 (`validation.json`)

| # | Kiểm tra | Kết quả |
| --- | --- | --- |
| A1.1 | một skin, một mesh | đạt: 1 mesh, 1 Armature modifier, 1 armature |
| A1.2 | tên bone đúng chuẩn | đạt: 15 runtime + 2 `ctl_*` khớp bảng G1, không dấu chấm/khoảng trắng |
| A1.3 | một cây, `root` là gốc | đạt |
| A1.4 | không đỉnh trống | đạt: 0 |
| A1.5 | tổng trọng số 1 ± 1e-6 | đạt: lệch tối đa 4,5e-8 |
| A1.6 | ≤ 4 ảnh hưởng | đạt: 1 ảnh hưởng 987 đỉnh, 2: 2.139, 3: 1.625, 4: 972 |
| A1.7 | group = bone deform có thật | đạt |
| A1.8 | pose nghỉ = bind | đạt: ma trận lệch 3e-7, mesh lệch 5e-7 m |
| A1.9 | khớp GLB đã scale | đạt: 5.723/5.723 đỉnh, lệch 5e-7 m |
| A1.10 | texture không đổi | đạt: sha256 ba ảnh đóng gói = ảnh trong GLB |
| A1.11 | kích thước theo danh mục (**rộng** 2,5H) | đạt: rộng 4,500 m; sâu 4,425 m; cao 1,699 m (0,94H) |
| A1.12 | đế chạm đất | đạt: z thấp nhất 0,000 |
| A1.13 | bone runtime không trọng số chỉ là socket | đạt: `root` (tổ tiên cấu trúc) + 4 `fx_*`; 2 `ctl_*` không xuất |
| A1.14 | scale 1, xoay đã áp dụng | đạt |

## 5. R5 — tư thế thử (A2)

Độ giãn = tỉ lệ dài cạnh posed/rest, lấy max(q, 1/q), cạnh ≥ 1 cm. Mức tham chiếu: rig dáng người đã duyệt của skill có cạnh tệ nhất
3,6–4,3× ở tư thế cực. "Khe" = gốc cuống/lá rời khỏi mặt gò thêm bao nhiêu so với lúc nghỉ.

| Tư thế | Giá trị | Giãn tệ nhất (thân / hoa) | Cạnh > 1,6× | Đế dịch | Khe gốc hoa | Đầu hoa méo | Mặt người méo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| phồng | chỏm +8, sườn +6 cm | 1,21 / 1,17 | 0 | 0 | 11,6 mm (lá 22) | 0 % | ≤ 2,4 % |
| xẹp | chỏm −8, sườn −4 cm | 1,22 / 1,15 | 0 | 0 | 3,3 mm | 0 % | ≤ 2,2 % |
| lắc (`ctl_sway`) | tịnh tiến 10 cm | 1,00 / 1,33 | 0 | 0 | 1,5 mm | 0,1 % | 0 |
| hoa nghiêng X+ | cụm 30°, bông lớn 35° | 1,00 / 3,69 | 22 | 0 | 7,5 mm | 3,4 % | 0 |
| hoa nghiêng X− | −30° / −35° | 1,00 / 3,17 | 38 | 0 | 10,0 mm | 3,5 % | 0 |
| hoa nghiêng Z+ | 30° / 35° | 1,00 / 2,90 | 27 | 0 | 6,3 mm | 3,6 % | 0 |
| hoa nghiêng Z− | −30° / −35° | 1,00 / 2,14 | 31 | 0 | 4,3 mm | 3,4 % | 0 |
| trúng đòn | chỏm 6°, sườn trước −4 cm, hoa −10° | 1,26 / 1,55 | 0 | 0 | 5,5 mm | 0,7 % | ≤ 2,5 % |
| mặt cựa | ba sườn 5° (+2 cm) | 1,43 / 1,05 | 0 | 0 | 3,3 mm | 0,1 % | ≤ 1,1 % |
| mặt cựa 8° | ba sườn 8° | 1,79 / 1,09 | 2 | 0 | 6,9 mm | 0,2 % | ≤ 1,8 % |
| sụp | chỏm −40 cm, sườn +12 ra −10 xuống, hoa 30–60° | 2,73 / 3,50 | 173 | 0 | 14,7 mm | 5,0 % | ≤ 6,4 % |

Ở mọi tư thế: đế không dịch, không đỉnh nào xuống dưới sàn, socket bám đúng đầu hoa (lệch 0 mm).

**Biên độ dùng được của bone hoa** (mỗi bone xoay riêng, cả hai chiều; giãn tệ nhất trên mảnh hoa):

| Bone | ±10° | ±15° | ±20° | ±30° |
| --- | --- | --- | --- | --- |
| `bloom_center` X / Z | 1,09 / 1,23 | 1,14 / 1,37 | 1,21 / 1,51 | 1,35 / 1,72 |
| `bloom_main` X / Z | 1,10 / 1,11 | 1,16 / 1,17 | 1,21 / 1,22 | 1,33 / 1,35 |
| `L_bloom` X / Z | 1,29 / 1,19 | **1,51** / 1,31 | 1,83 / 1,47 | 3,17 / 1,90 |
| `R_bloom` X / Z | 1,32 / 1,33 | **1,58** / **1,58** | 1,97 / 1,93 | 3,69 / 2,90 |
| `ctl_sway` tịnh tiến | 5 cm: 1,20 | 10 cm: 1,50 | 15 cm: 1,98 | |

**Biến thể sụp** (`scripts/p06_r5_variants.py`, giãn tệ nhất trên thân): chỏm −25 cm: 1,97 · chỏm −25 + sườn lún 10 cm: 1,82 ·
chỏm −40 cm riêng: 4,67 · chỏm −40 + sườn lún 10 cm: **2,44** · chỏm −40 + sườn ra 12 lún 10: 2,73 (đẩy sườn ra làm giãn vòng đế).

### A2 checklist

- [x] **Skeleton chồng mesh** (G2_1): bone trong khối, đuôi ba bone sườn nằm trên ba mặt người, gốc bone hoa ở chân cụm.
- [x] **Bản đồ trọng số** (G2_2): đế, chỏm, ba vùng mặt, sườn sau, từng cụm hoa tách rõ; không loang sang bone xa.
- [x] **Tư thế thử của họ O** (G2_3, G2_4): phồng, xẹp, lắc, hoa nghiêng hết biên, trúng đòn, mặt cựa, sụp. Đạt trong biên độ dùng
  được; **không đạt ngưỡng 1,6× ở hai cực**: hoa nghiêng 30–35° của `L_bloom`/`R_bloom` và sụp 40 cm có đẩy sườn ra (mục 6).
- [x] **Vùng khó** (brief): mặt người giữ hình (méo ≤ 2,5 % ngoài pose sụp), gốc cuống và lá không hở quá 15 mm, đế không trượt,
  đầu bông lớn cứng.
- [x] **Socket**: ba `fx_spawn_*` đi cùng đầu hoa ở mọi tư thế; `fx_body` theo `crown`.

## 6. Khuyết điểm còn lại và ghi chú cho phiên clip

1. **Một bone cho cả cụm hoa** (`L_bloom` 5 hoa/nụ, `R_bloom` 7): xoay quá ±15° làm cuống của hoa xa tâm cụm giãn 2–3,7×. Đã giảm
   bằng cách cho hoa xa chỉ theo bone 45–85 % (đầu hoa không méo, chỉ đi ít hơn). Clip: lắc gió bằng tịnh tiến (`ctl_sway`, ≤ 10 cm)
   hoặc xoay ≤ 15°; héo khi chết của cụm trái/phải ≤ 20° kèm hạ chỏm. Muốn từng bông gục riêng thì cần thêm bone hoa (vượt trần 10
   deform, phải duyệt lại) hoặc morph target "héo" ở phiên clip.
2. `bloom_main` là con của `bloom_center`: góc cộng dồn (nghiêng X+ ở bảng trên là 65° cho bông lớn).
3. **Sụp**: số khuyên dùng cho `death`: chỏm −25…−40 cm kèm bốn sườn lún −10 cm, đẩy ra ngoài ≤ 5 cm (giãn ≤ 2,4×). Bone hoa là con của
   `crown` nên đi xuống trọn chỏm, trong khi mặt gò dưới hoa xa chỉ xuống 60–90 %: khi chỏm hạ sâu, hạ ít hoặc nâng nhẹ `L/R_bloom`
   để hoa không lún vào gò.
4. **Mặt cựa** xoay cả vùng sườn (mặt người đi theo bone sườn, không có bone mặt riêng — G1). Dùng ≤ 5–8° hoặc tịnh tiến 5–8 cm
   (giãn ≤ 1,25×).
5. Khe lớn nhất khi phồng: cụm lá 22 (trước-phải) hở 11,6 mm; khi sụp: lá 2 hở 14,7 mm.
6. Mesh giữ nguyên như G1: gò tròn (sâu 2,46H), ba mặt người, đáy hở, mặt sau Tripo đoán.
7. **Rig editor** đọc được skeleton này (khớp `b:<bone>.head/tail`), đang chạy ở http://127.0.0.1:8778/ qua
   `rig_editor_safe.py`. Nút Blender của editor bị chặn; sau khi bấm Lưu (`P06_poppy_mound_rig_P06_poppy_mound_Rig_joints.json`),
   chạy lại `p06_r2r3_build.py` → R4 → R5 (script đọc khớp đã lưu; nhóm hoa, vùng mặt theo đuôi bone sườn).

## 7. Kết luận cổng

```text
2026-10-27 G2 P06_poppy_mound: DUYỆT (người dùng xem trong Blender: "done"); giữ biên L/R_bloom ±15°; rig xuất vào rig_done/
Bằng chứng: rig/qa/P06_poppy_mound_G2_1..4_*.png, rig/validation.json (A1 14/14)
Mục không đạt: A2 tư thế cực — hoa nghiêng 30–35° của L/R_bloom (giãn 2,1–3,7×), sụp 40 cm có đẩy sườn ra (2,7× thân); biên độ dùng được ở mục 5
Người duyệt: (người dùng)
```
