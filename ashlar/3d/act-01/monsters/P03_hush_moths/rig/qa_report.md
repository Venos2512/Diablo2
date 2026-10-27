# QA rig — P03_hush_moths · R2–R5 → **G2 duyệt 2026-10-27** → xuất `rig_done/` (chưa clip, §8)

Ngày 2026-10-26 · Opus 5.5 · route M (Blender 5.1.1 chạy nền, script riêng trong `rig/scripts/`, dùng lại `rigbatch.py` và `compose.py`
của `_batches/rig_v1/tools/` bằng import, không sửa) · brief: [`rig_brief.md`](rig_brief.md) (G1 duyệt 2026-10-26) · 0 credit · GLB gốc
không sửa · chưa commit.

## 0. Bàn giao

| File | Nội dung |
| --- | --- |
| `P03_hush_moths_rig.blend` | mesh `P03_hush_moths` (1 mesh, 1 skin) + skeleton runtime `P03_hush_moths_rig` (43 bone) + rig điều khiển `P03_hush_moths_ctl` (53 bone `ctl_*`), tư thế nghỉ, không Action; khối text `README_P03_rig` hướng dẫn control |
| `landmarks.json` | khớp đo trên mesh (bên L, soi gương sang R), quy tắc đặt từng khớp |
| `validation.json` | R4: QA_CHECKLIST A1 (14 mục), đối xứng trọng số, phương án B, số đo 22 tư thế thử |
| `qa/P03_hush_moths_G2_1_skeleton.png` | skeleton runtime chồng mesh X-ray (trước, bên, sau, trên), rig điều khiển, vai cánh ở hai biên vỗ, socket |
| `qa/P03_hush_moths_G2_2_weights.png` | trọng số: màu trộn theo bone 5 góc, cận chân / đầu–râu / bụng / cánh, từng chuỗi (chân, thân–bụng, cánh, râu) |
| `qa/P03_hush_moths_G2_3a_poses.png`, `_3b_poses.png` | tư thế thử: cánh, râu, đầu · bụng, chân, phương án B; bản đồ giãn (đỏ ≥ 1,6×) |
| `qa/P03_hush_moths_G2_4_wing_layers.png` | hai lớp cánh: mặt cắt vuông góc sải ở 3 trạm, trong khung xương `L_WingF_01`, 10 tư thế |
| `qa/raw/` | ảnh gốc từng góc, sidecar camera, nhãn |
| `scripts/` | dựng lại toàn bộ từ GLB (lệnh ở §7) |
| `rig.log` | nhật ký |

## 1. Skeleton runtime (phương án A) và rig điều khiển

- **Runtime 43 bone** đúng bảng G1 (`SKELETON_STANDARD.md` §3, họ W nhóm côn trùng bay): 35 deform (`thorax`, `head`, `abdomen_01..03`,
  râu 2 × 2, cánh 4 × 2, chân 6 × 3), `root`, `cog` (không trọng số, tổ tiên cấu trúc), 6 socket (`ground`, `hit_origin`, `fx_thorax`,
  `fx_head`, `fx_wing_L/R`). Một cây, gốc `root`. Bone cánh: Z local = pháp tuyến mặt lưng cánh; bone chân: X local = trục gập (+X = gập
  thêm, cả hai bên); L/R như Symmetrize của Blender.
- **Cao 0,594 m**, hệ số 1,2983 m / đơn vị GLB, chân chạm z = 0. Khớp bên R = gương bên L.
- **Rig điều khiển** (`P03_hush_moths_ctl`, armature riêng, không xuất): bản `ctl_` của mọi bone runtime + `ctl_L/R_Wing` (vỗ ở bản lề
  chung, +X = cánh lên, là cha của `ctl_*_WingF_01` và `ctl_*_WingB_01`), `ctl_wings` (vỗ cả hai bên), `ctl_abdomen_curl` (cộng cùng góc
  vào 3 đốt bụng), IK 6 chân `ctl_<side>_Leg<n>_IK` (đặt ở cổ chân, đuôi = bàn) + `ctl_<side>_Leg<n>_pole`, công tắc `ik_leg_L1..R3`
  (1 IK, 0 FK; driver AVERAGE, không cần Python). Runtime theo rig điều khiển bằng Copy Transforms; tư thế nghỉ lệch 8,9e-8 m. IK: pole
  −90°, bật IK ở tư thế nghỉ lệch ≤ 1e-4 mm.
- **Phương án B** (bầy) chưa là file riêng: theo G1 sinh bằng script lúc export (R8) từ `rig['variant_B_collapse']` (đã ghi trong file).
  Ở R4/R5 B được dựng tạm để kiểm (§3, §5).

## 2. Skin (R3)

Mọi phần trừ thân là mảnh rời, nên trọng số gán theo mảnh (`scripts/p03_skin.py`):

| Phần | Cách gán |
| --- | --- |
| Đầu + 2 mắt | `head` 100 % (cứng) |
| Râu (cuống, phiến, 10–11 răng lược rời mỗi bên) | tham số dọc trục râu (rachis), chuyển `_01` → `_02` ±3 cm quanh khớp; răng lược dính cuống giữ cùng trọng số ở đỉnh trùng |
| Cánh | chỉ 2 xương của chính cánh (không `thorax`), tham số dọc sải, chuyển ±11 % sải quanh khớp giữa; vỗ ở bản lề chung nên cánh là khối cứng |
| Chân | khoảng cách có dấu tới **mặt phân giác** ở háng / gối / cổ chân (liên tục ở mặt trong góc gập), chuyển ±13 mm ở gối, ±10 mm ở cổ chân; đầu trong thân (mid, hind) theo `thorax`, hết hẳn 12 mm trước háng |
| Thân (lông cổ, ngực, bụng: một mảnh hàn) | tham số theo trục dọc y, eo ±28 mm (thorax cứng tới gốc chân sau), hai khớp bụng ±22 / ±18 mm; làm mịn Laplace 6 lượt |
| Chung | đỉnh trùng trong cùng mảnh (và giữa các mảnh của cùng một râu) cùng trọng số; đỉnh chân chạm lông thân **không** dán (tránh gai lông theo chân); đối xứng L/R; tối đa 4, bỏ < 0,005, tổng 1 |

Ba lượt sửa trong R3 (số trước → sau): (1) bụng chiếu lên trục cong làm bụng dưới nhận nhầm `abdomen_02/03`: giãn 9,5× → 2,5× (đổi sang
tham số theo trục dọc, giảm biên độ thử từ 90° xuống 45° ở chóp); (2) gối dải chuyển hẹp ±8 mm và tham số nhảy ở mặt trong góc gối: co
chân 8,9× → giãn 2,1× (mặt phân giác, ±13 mm); (3) một đỉnh chân trước phải trùng đỉnh lông yếm bị dán: lông bị kéo thành gai khi chân
cử động → bỏ dán giữa chân và thân.

## 3. A1 — kiểm tự động (`validation.json`): **14/14 đạt**

| # | Kết quả | Giá trị |
| --- | --- | --- |
| A1.1 một skin, một mesh | đạt | 1 mesh, 1 Armature modifier |
| A1.2 tên bone | đạt | 43 bone đúng bảng G1, không thiếu / thừa / trùng (socket `fx_wing_L/R` theo kiểu `fx_hand_L` của chuẩn §4) |
| A1.3 một cây, gốc `root` | đạt | |
| A1.4 đỉnh trống | đạt | 0 / 5.348 |
| A1.5 tổng trọng số | đạt | lệch tối đa 4,1e-8 |
| A1.6 ≤ 4 ảnh hưởng | đạt | số đỉnh 1/2/3/4 ảnh hưởng: 4.137 / 942 / 204 / 65 |
| A1.7 group ↔ bone deform | đạt | 35 group, 0 lạ |
| A1.8 bind theo phân cấp | đạt (kiểm trong Blender) | rest con / cha cứng, sai số 2,2e-6; **kiểm lại trên GLB ở R8** (lượt này không export) |
| A1.9 mesh khớp GLB đã scale | đạt | GLB import lại × 1,2983: lệch 0 m, 5.348 đỉnh |
| A1.10 texture không đổi | đạt | 3 ảnh trong `.blend` trùng sha256 ảnh trong GLB |
| A1.11 chiều cao | đạt | 0,594 m = danh mục (0,33H) |
| A1.12 chạm đất | đạt | z thấp nhất 0,0 |
| A1.13 bone không trọng số | đạt | chỉ `root`, `cog` (tổ tiên cấu trúc) và 6 socket |
| A1.14 transform | đạt | mesh, runtime, ctl: ma trận đơn vị |

Thêm: đối xứng trọng số L/R lệch tối đa 0,028 (TB 1e-5); phương án B: 24 bone, 20 deform, tối đa 3 ảnh hưởng, tổng lệch 4e-8.

## 4. A2 — ảnh QA

| Mục | Kết quả | Bằng chứng |
| --- | --- | --- |
| Skeleton chồng mesh | **đạt**: khớp háng / gối / cổ chân ở u khớp, khớp râu trên cuống, bản lề cánh trong lông ngực, trục bụng giữa thân. `Leg_01` là đoạn thẳng háng → gối nên nằm trên chỗ võng của đốt chậu ~2 cm (khối cứng, không ảnh hưởng biến dạng) | G2_1 |
| Bản đồ trọng số | **đạt**: không loang (cánh chỉ theo cánh, chân không dính thân ngoài đầu cắm trong thân, đầu cứng) | G2_2 |
| Tư thế thử của họ W | **đạt có ghi chú** (§5): cánh cứng 1,0×; bụng giãn 2,5–2,7× ở 30–45°; chân nén mặt trong u khớp khi gập mạnh | G2_3a, G2_3b |
| Vùng khó: hai lớp cánh | **đạt** khi vỗ cùng góc (lên 65°, xuống 45°, xoắn, quét: mặt cắt trùng hệt tư thế nghỉ, 0 đỉnh xuyên mới); trễ / sớm 10° hoặc uốn `_02` 30° thì tách 5–6 cm (hướng dẫn cho clip ở §6) | G2_4 |
| Vùng khó: gốc cánh trong lông | **đạt**: vỗ lên 65° có 4 đỉnh gốc ló khỏi lông nhưng không thấy trên ảnh cận vai; vỗ xuống, gốc lún vào lông (khuất) | G2_1 (ba ô vai cánh) |
| Vùng khó: đầu trong lông cổ | **đạt** ở ±15° (đầu cứng, không thêm đỉnh vào lông) | G2_3a |
| Vùng khó: râu răng lược | **đạt**: giãn ≤ 1,21× gập trước / sau; uốn trong mặt phẳng phiến nén 0,34× ở răng lược | G2_3a |
| Socket | **đạt**: `fx_wing_L/R` theo đốm mắt cánh khi vỗ; `hit_origin`, `fx_head`, `fx_thorax`, `ground` đúng chỗ | G2_1 |

## 5. Tư thế thử (qua rig điều khiển; giãn / nén = tỉ lệ cạnh ≥ 1,3 mm so với nghỉ)

| Tư thế | Giãn max | Nén min | Hai lớp cánh: xuyên mới L/R, hở thêm | Chạm khác (so với nghỉ) | B (bầy) giãn / nén |
| --- | --- | --- | --- | --- | --- |
| nghỉ (`rest`) | 1,00× | 1,00× | 0/0, 0 mm | – | 1,00 / 1,00 |
| vỗ lên 65° (`wings_up_65`) | 1,00× | 1,00× | 0/0, 0 mm | gốc cánh ló khỏi lông 4 đỉnh (không thấy) | 1,00 / 1,00 |
| vỗ 30° (`wings_mid_30`) | 1,00× | 1,00× | 0/0, 0 mm | như trên | 1,00 / 1,00 |
| vỗ xuống 45° (`wings_down_45`) | 1,00× | 1,00× | 0/0, 0 mm | **chân lọt vào cánh sau 20 đỉnh**; gốc cánh lún vào lông 36 (khuất) | 1,00 / 1,00 |
| cánh sau trễ 10° (thử tải) | 1,00× | 1,00× | **4/3, 57 mm** | – | 1,00 / 1,00 |
| cánh sau sớm 10° (thử tải) | 1,00× | 1,00× | 0/0, **50 mm** | – | 1,00 / 1,00 |
| uốn ngoài cánh `_02` 30° | 1,06× | 0,91× | 0/0, **46 mm** | – | 1,06 / 0,91 |
| xoắn cánh 25° | 1,00× | 1,00× | 0/0, 0 mm | – | 1,00 / 1,00 |
| quét cánh 20° | 1,00× | 1,00× | 0/0, 0 mm | gốc cánh lún vào lông 14 (khuất) | 1,00 / 1,00 |
| cong bụng xuống 45° | 2,53× (2,8 → 7,2 mm) | 0,37× (16,1 → 5,9 mm) | 0/0 | – | 2,42 / 0,38 |
| cong bụng lên 30° | 2,69× (2,8 → 7,6 mm) | 0,77× | 0/0 | bụng cách cánh sau ≥ 7 cm | 2,62 / 0,77 |
| cong bụng sang bên 36° | 2,08× | 0,56× | 0/0 | bụng đẩy chân sau vào thân 22 đỉnh | 2,05 / 0,56 |
| râu gập trước / sau 25° + 25° | 1,19× / 1,21× | 0,92× | – | – | 1,00 |
| râu sang bên 15° + 10° | 1,05× | 0,34× (11,5 → 3,9 mm, răng lược) | – | – | 1,00 |
| ngửa / cúi / quay đầu 15° | 1,00× | 1,00× | – | đầu không vào thêm lông cổ | 1,00 |
| co chân khi bay (FK: háng −30°, gối +65°, cổ chân +45°) | 2,09× (7,0 → 14,6 mm) | **0,14× (4,7 → 0,6 mm)** | – | chân vào lông thân 161 đỉnh (chân co sát bụng) | 1,25 / 0,51 |
| nhấc 3 chân (IK) | 1,81× | **0,06× (6,0 → 0,3 mm)** ở cổ chân trước | – | bàn chân đứng yên: 0,0 mm | 1,20 / 0,62 |
| hạ thân 3,5 cm (IK) | 1,32× | 0,65× | – | mọi bàn dịch 0,0 mm; gối vào lông 81 đỉnh | 1,18 / 0,65 |
| tư thế bay (cánh 55°, co chân, bụng 24°) | 2,53× | 0,14× | 0/0, 0 mm | – | 2,42 / 0,38 |

Râu và bụng không chạm cánh ở mọi tư thế (khoảng cách nhỏ nhất 2,4 cm). Ghi chú: các con số nén nhỏ (0,06×, 0,14×) là mặt trong của u
khớp chân khi gập mạnh; đó là giới hạn của skin tuyến tính (LBS) với chân thanh cứng khớp u, khoanh vùng trong u khớp (đỏ trên bản đồ G2_3b).

## 6. Khuyết điểm còn lại và hướng dẫn cho phiên animation

1. **Hai lớp cánh chỉ đi như một khối khi vỗ cùng góc.** Clip vỗ bằng `ctl_L/R_Wing` hoặc `ctl_wings`; lệch riêng `ctl_*_WingB_01` ≤ 2–3°;
   uốn `_02` ≤ 10° và cánh sau uốn không nhiều hơn cánh trước (khớp `_02` của cánh sau nằm trong vùng chồng). Trễ 10° đã tách 5–6 cm.
2. **Vỗ xuống quá ~30° khi đang đứng** làm cánh sau chạm chân giữa / sau (20 đỉnh lọt ở 45°). Khi bay, chân co nên không gặp.
3. **Chân gập mạnh** (co khi bay 65°, nhấc chân bằng IK) nén mặt trong u gối / cổ chân. Ở camera ARPG khó thấy; nếu cần sạch hơn thì giảm
   góc gập hoặc thêm bone phụ u khớp (không đề xuất cho quái bầy).
4. **Bụng cong 30–45°** giãn 2,5–2,7× ở bụng dưới gần eo (vùng lông xám, khối mềm). Cong ≤ 30° nhìn ổn trên ảnh.
5. **IK chân**: control đặt ở cổ chân, hướng bàn theo control (bàn giữ nguyên hướng khi nhấc). Muốn xoay quanh mũi bàn thì thêm control
   tiếp xúc ở mũi (việc của phiên animation nếu cần đậu / bò).
6. **Phương án B** đã sinh lúc xuất (§8): `rig_done/P03_hush_moths_B_rig.glb / .fbx`; chân và râu thành khối cứng, bụng 2 đốt.
7. A1.8 (ma trận bind) đã kiểm trên GLB xuất ở §8: lệch 3,3e-7 (A và B).

## 7. Dựng lại

```text
blender -b --factory-startup -P rig/scripts/p03_build_rig.py -- 0.594     # R2 + R3 -> P03_hush_moths_rig.blend, landmarks.json
blender -b --factory-startup -P rig/scripts/p03_r4_validate.py           # R4 -> validation.json
blender -b --factory-startup -P rig/scripts/p03_r5_render.py             # R5 -> qa/raw/
python -I rig/scripts/run_pil.py rig/scripts/p03_g2_sheets.py <rig_dir>  # tờ G2 (PIL ở user site, run_pil chỉ thêm thư mục đó)
blender -b --factory-startup -P rig/scripts/p03_r8_export.py             # R8 (chỉ rig) -> rig_done/ + reimport, ~8 s
blender -b --factory-startup rig/P03_hush_moths_rig.blend -P rig/scripts/p03_gui_check.py   # bản sao kiểm _work/..._check.blend
blender rig/_work/P03_hush_moths_rig_check.blend --python rig/scripts/p03_gui_check.py      # cửa sổ kiểm (gui_open.py, không 9876)
```

Blender: `C:/Program Files/Blender Foundation/Blender 5.1/blender.exe`. Không dùng MCP, không dùng cổng 9876. Mỗi bước dưới 1 phút.

## G2 — câu hỏi cho người dùng

1. **Hai lớp cánh**: chấp nhận quy ước "vỗ cùng góc, lệch riêng cánh sau ≤ 2–3°, uốn `_02` ≤ 10°" cho phiên animation? Phương án khác: dời
   vùng uốn của cánh sau ra ngoài vùng chồng (khớp giữ nguyên, chỉ đổi trọng số) để uốn tự do hơn.
2. **Chân**: mức nén ở u khớp khi co chân / nhấc chân (G2_3b) có chấp nhận được cho quái bầy?
3. **Bụng**: biên độ cong 30–45° như ảnh có đủ không, hay cần mềm hơn (dải chuyển ở eo rộng hơn, đổi lại phần ngực sau sẽ võng theo bụng)?
4. **Tên chân** so với anh em: W07 (G1 đã duyệt) và W04 dùng 4 đốt (`_01` háng, `_02` đùi, `_03` ống, `_04` bàn); P03 3 đốt theo G1 nên
   `L_Leg<n>_02` của P03 là ống chân, của W04 / W07 là đùi. Giữ như vậy (số đốt theo loài, chuẩn §3 cho phép) hay đổi P03 sang 4 đốt?

**Kết luận G2 (2026-10-27): PASS.** Người dùng xem trong Blender (bản sao có 21 tư thế thử trên timeline) rồi trả lời "done, export đi".
Bốn câu trên giữ như đề xuất: quy ước cánh cho phiên animation, nén u khớp chân chấp nhận, bụng như ảnh, chân 3 đốt.

## 8. Xuất (R8, chỉ rig, chưa clip) — 2026-10-27

`rig/scripts/p03_r8_export.py`, cách của B01 / P06: không gọi `export_core.export_package` (hàm đó lưu đè `.blend` và xuất cả `ctl_*`).
Script mở `.blend` nguồn chỉ đọc, ghi ma trận skin của 22 tư thế thử khi còn rig điều khiển, rồi trong bộ nhớ bỏ 37 constraint và
`P03_hush_moths_ctl`. Rest không đổi (1,8e-7 m), 22 tư thế dựng lại trên skeleton trần lệch ≤ 0,0002 mm. B sinh từ A trong bộ nhớ: cộng
trọng số các bone bỏ vào bone đích theo `rig['variant_B_collapse']`, xoá bone và 4 socket bỏ. Bind của bone giữ lại không đổi (lệch 0),
không bone deform nào thiếu trọng số.

| File trong `rig_done/` | Nội dung |
| --- | --- |
| `P03_hush_moths_rig.glb` (11,4 MB) · `.fbx` (4,4 MB) | A: 43 bone (35 deform), skin, tư thế nghỉ, không animation, không `ctl_*`. GLB +Y lên, 3 ảnh 4096 trùng byte GLB Tripo; FBX trục Unity, nhúng basecolor + normal |
| `P03_hush_moths_B_rig.glb` (11,4 MB) · `.fbx` (4,4 MB) | B cho bầy: 24 bone (20 deform + root, cog, `ground`, `fx_thorax`), ≤ 3 ảnh hưởng mỗi đỉnh |
| `textures/` | 3 map Tripo, byte gốc (`_rm` chỉ có ở đây và trong GLB) |
| `anim/clips.json` | manifest rỗng; clip làm trên A chạy được trên B |
| `P03_hush_moths_rig_info.json` | bone, phương án B, sức khoẻ trọng số, biên độ dùng được, kết quả reimport |
| `P03_hush_moths_rig.blend` | bản chép nguồn đã duyệt (có rig điều khiển) |

Reimport từng file vào scene trống (Agent.md R8.4): đủ 1 armature + 1 mesh; tên, cha, đầu bone khớp (≤ 0,0003 mm); A1.8 trên GLB lệch
3,3e-7 (ngưỡng 1e-5); ≤ 4 ảnh hưởng, tổng 1; mọi đỉnh khớp nguồn theo vị trí nghỉ (GLB tách đỉnh ở đường nối UV: 6.547 so với 5.348);
22 tư thế thử lệch ≤ 0,0005 mm (ngưỡng 1 mm). **PASS cả 4 file.** Số liệu: `_work/r8_export.json`. Chưa làm bản lab (texture 2048,
`samples.json`) và G4.
