# Chuẩn skeleton và clip — ASHLAR

Bổ sung cho [`Agent.md`](Agent.md). Mọi giá trị đánh dấu *(đề xuất)* là khởi điểm, chốt lại sau asset đầu tiên đi hết quy trình.
Tên bone dưới đây lấy từ bản thử Sorceress (`clips.py`, `build_rig.py`) và phải **xác nhận lại bằng danh sách armature thực** khi
dựng; chỗ nào chưa thấy trong file thì ghi *(xác nhận)*.

## 1. Đơn vị, trục, tư thế

- Mét. Chiều cao theo danh mục ở [`ashlar/3d/README.md`](../README.md), không để giá trị 1 m mặc định của Tripo.
- Xuất glTF: trục Y hướng lên, mặt nhìn về +Z. Trong Blender (Z lên) bật tuỳ chọn xuất "+Y Up".
- Pivot ở giữa đáy, chân chạm y = 0 ở tư thế nghỉ. Bone `root` ở gốc toạ độ, không xoay, không scale.
- Tư thế bind (rest) là T-pose hoặc A-pose của GLB Tripo. Không đổi tư thế rest sau khi skin.
- Scale mọi object về 1; không để scale âm; xoay đã áp dụng (apply) trước khi xuất.

## 2. Họ skeleton

| Mã | Họ | Số bone deform *(đề xuất)* | Ghi chú |
| --- | --- | --- | --- |
| H | Humanoid người lớn | 30–60 | tuỳ số bone ngón, áo choàng, tóc |
| S | Humanoid nhỏ | như H | cùng topology với H, khác tỉ lệ; dùng chung clip sau khi scale |
| Q | Bốn chân | 25–50 | cột sống 5+ đốt, đuôi, cổ tách, bốn chi |
| W | Có cánh | 30–60 | topology H hoặc Q + chuỗi cánh |
| A | Nhiều chân | 30–60 | thân 2–3 đốt + mỗi chân 3 đốt |
| L | Thân dài, không chân | 15–40 | chuỗi cột sống dài, đầu và đuôi |
| F | Lơ lửng | 10–30 | thân + vài bone phụ (khăn, xúc tu) |
| O | Vật thể, bẫy, tổ | 2–10 | chỉ bone cho các bộ phận chuyển động |

Họ H dùng chung bộ clip; các họ khác có bộ clip riêng (mục 5).

## 2b. Hai lớp skeleton

Theo `blender-game-animation`, mỗi asset có hai lớp trong file nguồn:

| Lớp | Có trong GLB? | Nội dung |
| --- | --- | --- |
| **Rig điều khiển** | không | IK, control tiếp xúc chân/tay, bone pole, helper, constraint. Animator làm việc ở đây. Giữ trong `.blend` |
| **Skeleton runtime** | có | chỉ bone deform và socket, tên theo mục 3. Chuyển động đã đánh giá của rig điều khiển được bake lên đây ở R8 |

Quy tắc: tên bone runtime theo chuẩn dưới đây; bone điều khiển đặt tiền tố `ctl_` (ví dụ `ctl_L_Foot_IK`) và không bao giờ xuất. Vị
trí toàn cục (`root`, `cog`) tách khỏi chuyển động cục bộ của thân. Có control tiếp xúc có thể chỉnh được ở chân (và tay nếu
chạm vật) để sửa trượt chân mà không phá clip.

## 3. Quy ước đặt tên bone

- Tiền tố bên: `L_` và `R_` (không dùng hậu tố `.L`, `_left`).
- Bone giữa không tiền tố, viết thường: `spine_01`, `head`.
- Không dấu, không khoảng trắng, không ký tự `.`.
- Tên không đổi giữa các asset cùng họ.
- Phân cấp: `root` → `cog` → `pelvis` (hoặc cột sống) → nhánh. `root` đứng đầu để engine kéo cả skeleton.

### Họ H và S (bộ bone lõi)

| Nhóm | Bone |
| --- | --- |
| Gốc | `root`, `cog` |
| Thân | `pelvis`, `spine_01`, `spine_02`, `chest`, `neck`, `head` |
| Tay (mỗi bên) | `L_Clavicle`, `L_UpperArm`, `L_UpperArm_twist`, `L_ForeArm`, `L_ForeArm_twist`, `L_Hand` *(xác nhận)*, ngón tay *(tuỳ)* |
| Chân (mỗi bên) | `L_Thigh`, `L_Calf`, `L_Foot`, `L_Toe` *(xác nhận)* |

**Clavicle và xương xoắn** (người dùng duyệt 2026-10-22, theo [`RIG_SKILL_WORKFLOW.md`](RIG_SKILL_WORKFLOW.md)). Áp dụng cho asset H
và S **rig từ nay**. D01 Hodling giữ bộ 35 bone đã qua G2 (không clavicle, không xoắn); clip của D01 retarget sang skeleton mới vẫn
được vì chỉ thiếu bone, không đổi tên.

- Phân cấp tay: `chest` → `L_Clavicle` → `L_UpperArm` → `L_ForeArm` → `L_Hand`. `L_UpperArm_twist` là con của `L_UpperArm`,
  `L_ForeArm_twist` là con của `L_ForeArm`. Cả hai đều là bone deform, chỉ có xoay quanh trục dọc của chi.
- `L_Clavicle` đi từ khớp ức–đòn tới mỏm cùng vai. Khớp `L_UpperArm` đặt ở tâm chỏm xương cánh tay, không đặt ở mỏm cùng vai.
- `L_ForeArm_twist` đặt ở 50% cẳng tay và nhận 50% góc xoắn dọc trục của `L_Hand`. `L_UpperArm_twist` đặt ở 1/3 trên của cánh tay
  và khử khoảng 50% góc xoắn của `L_UpperArm` để vai không xoắn theo *(đề xuất; chốt ở benchmark P5)*.
- Trọng số vòng xoắn tăng tuyến tính theo vị trí dọc chi. Chuyển động xoắn được bake vào clip ở R8, vì constraint không xuất được.
- Số bone lõi H/S: từ 22 lên 28 (thêm 2 clavicle, 4 xoắn), chưa tính phụ và socket.
| Socket | `R_weapon_attach`, `L_weapon_attach` (đã có trong bản thử), `fx_head`, `fx_chest`, `fx_hand_R`, `fx_hand_L` *(đề xuất)* |
| Phụ (tuỳ asset) | `helmet`, `jaw`, `main_hair_*`, `*_skirt_*`, `*_charm_*`, `*_shoulder_pad` (có trong bản thử); D01 Hodling (2026-10-21, G1): `sack` (túi/ba lô cứng, con của `chest`), `loincloth_front` (mảnh khố trước, con của `pelvis`), `L_ear`, `R_ear` (con của `head`) |

Bản thử Sorceress dùng `cog`, `anim`, `translate` phía trên `root` của D2R; `anim` và `translate` không có trọng số, **không giữ**
trong chuẩn riêng của ASHLAR trừ khi cần tương thích trực tiếp với clip D2R.

### Họ khác

Đặt khi có asset đầu tiên của họ đó. Nguyên tắc: đặt tên theo bộ phận và bên (`L_Hip`, `L_Knee`, `tail_01…`, `spine_01…`,
`L_wing_01…`), cùng quy ước tiền tố, và chép bảng vào mục này rồi ghi ngày.

#### Họ Qh — thân người đi bốn chi (U04 Charnel Ghoul, G1 duyệt 2026-10-26; P04 Hive-Sleeper dùng chung)

Bộ lõi H giữ nguyên tên và phân cấp (28 bone, bảng trên) cộng phần chung của Qh. Rest = tư thế bốn chi của mesh (không T-pose); bộ clip
theo cột Q của mục 5. Clip giữa các con Qh đi qua retarget theo tên, vì rest khác nhau (U04 đứng trên bàn chân, P04 quỳ trên gối).

| Nhóm | Bone | Ghi chú |
| --- | --- | --- |
| Lõi H | `root`, `cog`, `pelvis`, `spine_01`, `spine_02`, `chest`, `neck`, `head`, `L/R_Clavicle`, `L/R_UpperArm`, `L/R_UpperArm_twist`, `L/R_ForeArm`, `L/R_ForeArm_twist`, `L/R_Hand`, `L/R_Thigh`, `L/R_Calf`, `L/R_Foot`, `L/R_Toe` | tên và cha như H |
| Chung Qh | `neck_02` (con `neck`, cha của `head`); `L/R_Finger` (con `L/R_Hand`, đốt bàn → đầu ngón, cả bàn ngón một bone) | cổ dài; bàn tay là chân trước nên lăn ngón như `Toe` |
| Socket chung | `ground`, `hit_origin` (con `root`), `fx_chest`, `fx_head`, `fx_hand_L/R`; không `*_weapon_attach` | |
| Phụ U04 | `jaw` (con `head`), `L/R_Calf_02` (con `L/R_Calf`, cha của `L/R_Foot`; thêm 2026-10-27), `tie_01..02` (con `neck`), `smock_front_01..02` (con `chest`), `L/R_smock_shoulder_01..02` (con `L/R_Clavicle`), `L/R_smock_flank_01..02` (con `spine_01`), `smock_back_01..02` (con `pelvis`); socket `fx_mouth` (con `head`) | 55 bone, 46 deform |

Quy ước Qh:
- `pelvis → spine_01 → spine_02 → chest → neck → neck_02` chạy từ hông về phía đầu (thân nằm ngang); `head` đi từ khớp đầu lên đỉnh sọ
  như H. `cog` đặt giữa thân (giữa hông và vai), trên đường sống.
- Roll: trục X cục bộ của mọi bone, trừ `Clavicle`, là +X thế giới (bên trái con quái) chiếu lên bone, cả hai bên; mọi chuyển động trong
  mặt phẳng dọc (phi, vồ, ngẩng đầu, há hàm, gập khuỷu, gối) là xoay quanh X. `Clavicle` giữ Z hướng lên. Quy tắc trùng trục Blender sinh
  khi đối xứng.
- Twist đặt như H: `UpperArm_twist` từ vai tới giữa cánh tay, `ForeArm_twist` từ giữa cẳng tay tới cổ tay.
- Control tay chung (chỉ trong `.blend`): `ctl_<side>_Hand_IK` → `Fingertip_roll` → `Palm_roll` → `Wrist_target`, pole `Elbow_pole` sau
  khuỷu. Bảng bone của P04 nằm ở mục "Họ Qh" thứ hai bên dưới (hai thread viết song song cùng ngày, nội dung khớp; U04 đã theo P04 ở
  hướng bone `head`). Gộp hai mục: người dùng chưa quyết (U04 qua G2 2026-10-27).
- Chân sau U04 có 3 đốt (2026-10-27, người dùng thêm khớp khi xem trong editor): `L_Thigh` hông → gối (chĩa trước) → `L_Calf` gối → khuỷu
  cổ chân sau (chĩa sau) → `L_Calf_02` → gót → `L_Foot` → `L_Toe`. Tên theo kiểu `neck` / `neck_02`. Control như chân sau họ Q: IK 2 đốt
  `Thigh`–`Calf` tới khuỷu cổ chân sau, `ctl_<side>_Hock_roll` (xoay quanh cổ chân) đặt góc `Calf_02`, pole `Knee_pole` trước gối. P04 giữ
  `Calf` → `Foot`; clip chân sau dùng chung cần map thêm `Calf_02` (để ở rest) hoặc P04 cũng thêm bone này (người dùng chưa quyết; U04
  qua G2 2026-10-27 với bone này).

#### Họ O — vật thể, bẫy, tổ (P06 Poppy-Mound, G1 duyệt 2026-10-26)

Lõi chung của họ O: `root` (không deform, gốc toạ độ) → `body` (deform, vai trò `cog`: khối chính và phần neo chạm đất). Các bộ phận
đặt tên theo bộ phận (`crown`, `flank_*`, `bloom_*`; con khác có thể `lid`, `jaw`, `door`…), bên theo tiền tố `L_`/`R_`; socket `fx_*`.
Trần 10 bone deform (mục 2). Rig điều khiển `ctl_*` chỉ trong `.blend`.

Bảng của P06 (gò thịt nở hoa, spawner; 10 deform + `root` + 4 socket; rig điều khiển `ctl_breath`, `ctl_sway`):

| Bone | Cha | Loại | Vai trò |
| --- | --- | --- | --- |
| `root` | – | gốc, không deform | kéo cả con; điểm `ground` |
| `body` | `root` | deform | đế và phần neo chạm sàn; dịch cả khối |
| `crown` | `body` | deform | chỏm gò: thở (nâng), rung khi trúng đòn, sụp khi chết |
| `flank_front`, `L_flank`, `R_flank`, `flank_back` | `body` | deform | sườn trước/trái/phải/sau: phồng, xẹp; ba bone đầu mang ba mặt người ngủ |
| `bloom_center` | `crown` | deform | cụm hoa giữa |
| `bloom_main` | `bloom_center` | deform | bông lớn |
| `L_bloom`, `R_bloom` | `crown` | deform | cụm hoa trái, phải |
| `fx_spawn_main`, `fx_spawn_L`, `fx_spawn_R` | `bloom_main`, `L_bloom`, `R_bloom` | socket | điểm thả Hush-Moth |
| `fx_body` | `crown` | socket | VFX trúng đòn, nổ khi chết |

Trạng thái của P06: `idle` (R), `cast` = thả bướm (sự kiện ở 50 %), `hit`, `death`; không `attack`, `revive`.

#### Họ A — nhiều chân (W07 Shroud-Spinner, G1 duyệt 2026-10-26)

Lõi chung của họ A: `root` → `cog` (không deform; nâng, hạ, nghiêng cả thân) → thân 1–3 đốt đặt tên giải phẫu (nhện: `cephalothorax`
→ `abdomen_01..`; côn trùng: `thorax`, `head`, `abdomen_0n`). Chân `L/R_Leg<n>_<đốt>`: `n` = cặp chân đếm từ trước ra sau, đốt đánh số
từ thân ra; **số đốt theo loài, ghi trong brief**. Với 4 đốt (W07, cùng nghĩa với W04): `_01` háng (coxa), `_02` đùi (femur), `_03` ống
(tibia), `_04` bàn (tarsus). Roll: chân có trục X local là trục bản lề, xoay +X = gập thêm ở mọi khớp, cả hai bên; thân có X local ≈ X
thế giới. Rig điều khiển `ctl_*` chỉ trong `.blend`: `ctl_root`, `ctl_cog`, IK từng chân `ctl_<side>_Leg<n>_IK` (control tiếp xúc ở mũi
chân) + `ctl_<side>_Leg<n>_pole`, công tắc `ik_leg_<side><n>` (1 = IK).

Bảng của W07 (nhện, 8 chân; 48 bone: 41 deform + `root`, `cog` + 5 socket; vị trí khớp đo trên mesh ở
`act-01/monsters/W07_shroud_spinner/rig/rig_brief.md`):

| Bone | Cha | Loại | Vai trò |
| --- | --- | --- | --- |
| `root` | – | gốc, không deform | kéo cả con |
| `cog` | `root` | không deform | tâm vùng gốc chân: nâng, hạ, nghiêng thân |
| `cephalothorax` | `cog` | deform | đầu ngực (mai, ức, mắt), cứng |
| `abdomen_01` | `cephalothorax` | deform | cả quả bụng, xoay quanh cuối đầu ngực (cuống bụng) |
| `abdomen_02` | `abdomen_01` | deform | chỏm sau-dưới quanh núm tơ |
| `L_fang`, `R_fang` | `cephalothorax` | deform | nanh |
| `L_Palp_01` → `L_Palp_02` (và `R_`) | `cephalothorax` | deform | chân xúc giác: đốt trong, đốt ngoài + vuốt |
| `L_Leg1..4_01` → `_02` → `_03` → `_04` (và `R_`) | `cephalothorax` | deform | 8 chân × 4 đốt (háng, đùi, ống, bàn) |
| `ground` | `root` | socket | bóng, vòng chọn |
| `hit_origin` | `cephalothorax` | socket | điểm cắn trúng, trước nanh |
| `fx_head` | `cephalothorax` | socket | giữa hai mắt |
| `fx_abdomen` | `abdomen_01` | socket | tâm bụng (độc, túi trứng) |
| `fx_spinneret` | `abdomen_02` | socket | mũi núm tơ (tơ làm chậm) |

Bộ clip họ A theo mục 5; W07 dự kiến `attack` = cắn, `cast` = phun tơ làm chậm từ `fx_spinneret`.

#### Họ W, nhóm côn trùng bay (P03 Hush-Moths, G1 duyệt 2026-10-26)

Lõi: `root` (không deform, gốc toạ độ) → `cog` (không deform, tâm ngực) → `thorax` → `head`, `abdomen_<đốt>`, cánh, chân. Blender: mặt nhìn
−Y (= +Z glTF), trái của quái = +X. W04 Mire-Sucker (G1 duyệt 2026-10-26, bảng dưới) dùng cùng tên; chim họ W (W02) dùng `L_Wing_<đốt>`.
- **Cánh:** hai cánh mỗi bên, `L_WingF_<đốt>` (trước / trên) và `L_WingB_<đốt>` (sau / dưới), `_01` trong → `_02` ngoài, cha `thorax`.
  `WingF_01` và `WingB_01` **chung một điểm gốc** (bản lề) để vỗ cùng góc thì hai lớp cánh đi như một khối; control `ctl_<side>_Wing` là cha
  của `ctl_*_WingF_01`, `ctl_*_WingB_01`. Roll: Z local = pháp tuyến mặt lưng cánh.
- **Chân:** `L_Leg<n>_<đốt>`, n = cặp chân theo vị trí giải phẫu trước → sau (thiếu cặp thì giữ số), đốt đánh số từ thân ra; số đốt theo
  loài, ghi trong brief (P03: 3 đốt; W04 đề xuất 4). Roll: X local = trục gập, xoay +X = gập thêm, cả hai bên. IK `ctl_<side>_Leg<n>_IK`,
  pole `ctl_<side>_Leg<n>_pole`.
- Râu `L/R_antenna_<đốt>` (cha `head`). Socket: `ground`, `hit_origin`, `fx_head`, `fx_thorax` (côn trùng dùng `fx_thorax` thay `fx_chest`),
  `fx_wing_L/R`.
- **Bản bầy** (quái nhiều bản sao): tập con của bảng đầy đủ, cùng tên và cùng rest; xương bỏ dồn trọng số về cha; sinh bằng script lúc export.

Bảng của P03 (A đầy đủ: 37 xương, 35 deform, + 6 socket; B bầy: 22 xương, 20 deform, + 2 socket):

| Bone | Cha | Loại | Bản bầy B |
| --- | --- | --- | --- |
| `root` | – | gốc, không deform | giữ |
| `cog` | `root` | không deform | giữ |
| `thorax` | `cog` | deform: lông cổ, ngực, đầu trong của chân | giữ |
| `head` | `thorax` | deform: đầu + mắt (cứng) | giữ |
| `abdomen_01`, `_02`, `_03` | `thorax` → chuỗi | deform | `_03` dồn về `_02` |
| `L/R_antenna_01`, `_02` | `head` → chuỗi | deform | `_02` dồn về `_01` |
| `L/R_WingF_01`, `_02`, `L/R_WingB_01`, `_02` | `thorax` → chuỗi | deform | giữ |
| `L/R_Leg1..3_01` (háng → gối), `_02` (gối → cổ chân), `_03` (cổ chân → mũi bàn) | `thorax` → chuỗi | deform | `_02`, `_03` dồn về `_01` |
| `ground` | `root` | socket | giữ |
| `hit_origin`, `fx_thorax` | `thorax` | socket | bỏ `hit_origin`, giữ `fx_thorax` |
| `fx_head` | `head` | socket | bỏ |
| `fx_wing_L`, `fx_wing_R` | `L/R_WingF_02` | socket (tâm đốm mắt cánh trước, bụi cánh) | bỏ |

Bảng của W04 Mire-Sucker (ruồi hút máu chân cà kheo; G1 duyệt 2026-10-26; 41 bone: 34 deform + `root`, `cog` + 5 socket; vị trí khớp đo
trên mesh ở `act-01/monsters/W04_mire_sucker/rig/rig_brief.md`). Cùng lõi và quy ước với P03 ở trên; phần riêng:
- **Vòi** `proboscis_01..03` (cha `head`), **hai túi máu** tách từ `abdomen_01`: `L/R_abdomen_02` → `_03` (nối số với chuỗi `abdomen_01..03`
  của P03, nên clip bụng P03 ánh xạ `abdomen_02/03` sang cả hai túi).
- Chân **4 đốt**, cùng nghĩa với W07 (họ A): `_01` háng, `_02` đùi, `_03` ống, `_04` bàn + vuốt. Mesh chỉ có cặp trước và cặp sau:
  `Leg1`, `Leg3`; số `Leg2` để trống (thiếu cặp thì giữ số).
- Không râu, không `fx_wing_*`; thêm `fx_abdomen` (giữa hai túi, VFX nổ). `hit_origin` theo mũi vòi.

| Bone | Cha | Loại | Vai trò |
| --- | --- | --- | --- |
| `root` | – | gốc, không deform | kéo cả con |
| `cog` | `root` | không deform | tâm ngực: bay lên, hạ thân, nghiêng |
| `thorax` | `cog` | deform | ngực, tấm lưng chữ V, mào gai, đầu trong của chân và gốc cánh |
| `head` | `thorax` | deform | đầu + mắt + vương miện gai (cứng) |
| `proboscis_01` → `_02` → `_03` | `head` | deform | vòi |
| `abdomen_01` | `thorax` | deform | gốc bụng dưới tấm lưng, đỉnh khe giữa hai túi |
| `L/R_abdomen_02` → `_03` | `abdomen_01` | deform | túi máu trái, phải |
| `L/R_WingF_01` → `_02`, `L/R_WingB_01` → `_02` | `thorax` | deform | lá cánh trên (cả sống cánh) và lá dưới, bản lề chung mỗi bên |
| `L/R_Leg1_01..04`, `L/R_Leg3_01..04` | `thorax` → chuỗi | deform | chân trước, chân sau |
| `ground` | `root` | socket | bóng, vòng chọn |
| `hit_origin` | `proboscis_03` | socket | mũi vòi, điểm đâm trúng |
| `fx_head`, `fx_thorax` | `head`, `thorax` | socket | giữa hai mắt; tâm ngực |
| `fx_abdomen` | `abdomen_01` | socket | giữa hai túi |

#### Họ Qh — thân người đi bốn chi (P04 Hive-Sleeper, G1 duyệt 2026-10-26)

Thân người (vai, khuỷu, hông, gối) đi bằng bốn chi: **bộ lõi H giữ nguyên tên và phân cấp**, rest = tư thế bốn chi của mesh (không
T-pose). Bố cục dùng chung với U04 Charnel Ghoul (U04 chờ G1 ở thread của nó; người dùng chọn khác ở U04 thì cả hai theo).
- Thêm vào lõi H: `L/R_Finger` (con của `Hand`, đốt bàn → đầu ngón; bàn tay làm chân trước nên `Hand`/`Finger` như `Foot`/`Toe`) và
  `neck_02` (giữa `neck` và `head`).
- `pelvis → spine_01 → spine_02 → chest → neck → neck_02 → head` chạy từ hông về phía đầu. `cog` đặt giữa `pelvis` và `chest`.
- Roll: trục X cục bộ của mọi bone = +X thế giới chiếu lên bone, hai bên như nhau (gập, duỗi trong mặt phẳng dọc là xoay quanh X);
  `Clavicle` giữ Z lên.
- Không socket vũ khí; socket chung `ground`, `hit_origin`, `fx_head`, `fx_chest`, `fx_hand_L/R`, cộng socket riêng từng con.
- Rig điều khiển `ctl_*` chỉ trong `.blend`: tay `ctl_<side>_Hand_IK` (con của `ctl_root`) + `ctl_<side>_Fingertip_roll`,
  `ctl_<side>_Palm_roll`, pole `ctl_<side>_Elbow_pole` sau khuỷu; chân theo điểm tựa của từng con (P04: `ctl_<side>_Knee_IK` ở gối và ống
  chân); công tắc `ik_arm_<side>`, `ik_leg_<side>` (1 = IK).
- Clip theo cột Q của mục 5; dùng chung giữa các con Qh qua retarget theo tên (rest và hướng bone `head` khác nhau).

Bảng của P04 (54 bone: 46 deform + `root`, `cog` + 6 socket; vị trí khớp đo trên mesh ở
`act-01/monsters/P04_hive_sleeper/rig/rig_brief.md`):

| Bone | Cha | Loại | Vai trò |
| --- | --- | --- | --- |
| `root` | – | gốc, không deform | kéo cả con |
| `cog` | `root` | không deform | giữa thân: nâng, hạ, nghiêng cả thân |
| `pelvis` → `spine_01` → `spine_02` → `chest` | `cog` | deform (lõi H) | thân nằm ngang |
| `neck` → `neck_02` → `head` | `chest` | deform (lõi H + `neck_02`) | cổ hai đốt, đầu trong mũ trùm |
| `L/R_Clavicle` → `UpperArm` (+ `_twist`) → `ForeArm` (+ `_twist`) → `Hand` → `Finger` | `chest` | deform | tay thẳng đứng, bàn tay úp |
| `L/R_Thigh` → `Calf` → `Foot` → `Toe` | `pelvis` | deform | đùi đứng; gối, ống chân, mu bàn chân nằm trên sàn |
| `dome_01`, `dome_02`, `dome_03` | `chest`, `spine_02`, `pelvis` | deform, phụ P04 | ba vòm ấu trùng, cứng; điểm phát VFX vỡ thành bầy |
| `shirt_front_01..02` | `chest` | deform, vải | yếm áo dưới cổ |
| `L/R_shirt_shoulder_01..02` | `L/R_Clavicle` | deform, vải | vạt áo rủ từ vai |
| `L/R_shirt_flank_01..02` | `spine_01` | deform, vải | vạt sườn |
| `L/R_shirt_back_01..02` | `pelvis` | deform, vải | vạt mông |
| `ground`, `hit_origin` | `root` | socket | bóng, vòng chọn; điểm phát đòn trước mặt |
| `fx_chest`, `fx_head`, `fx_hand_L/R` | `chest`, `head`, `L/R_Hand` | socket | dưới gốc cổ phía bụng; đỉnh đầu; giữa lòng bàn tay |

#### Họ W, nhóm chim (W02 Gibbet-Crow, G1 duyệt 2026-10-26)

Lõi: `root` (gốc toạ độ, giữa hai bàn chân) → `cog` (không deform, trọng tâm thân) → `pelvis` → `spine_01` → `chest` → `neck_01..` → `head`
→ `beak`; đuôi `tail_01..` (cha `pelvis`). Blender: mặt nhìn −Y (= +Z glTF), trái của quái = +X. Côn trùng bay họ W dùng bảng P03/W04 ở trên.
- **Cánh** `L_Wing_01` (cánh tay) → `_02` (cẳng cánh) → `_03` (bàn cánh + lông chóp), cha `chest`; viết hoa như `L_Thigh` (chuẩn cũ ghi
  ví dụ `L_wing_01`). Lông cánh bám xương cánh gần nhất, không bone lông riêng. Roll: X local = trục gập trong mặt cánh (pháp tuyến cánh),
  xoay +X = gập thêm ở vai, khuỷu, cổ tay, cả hai bên (gập kiểu chữ Z: cánh tay về phía mép sau, cẳng cánh về mép trước, bàn cánh về mép sau);
  Z local nằm trong mặt cánh, xoay Z = vỗ (về phía lưng / bụng cánh); Y = xoắn mặt cánh. Khác cánh côn trùng (Z = pháp tuyến) vì cánh chim gập.
- **Chân chim** giữ tên chuẩn như chân khuỷu ngược: `L_Thigh` (xương đùi, trong thân) → `L_Calf` (cẳng đùi, khối "quần" lông) → `L_Foot`
  (giò vảy) → `L_Toe` (ngón trước; ngón sau theo `L_Foot`). Roll: X local = trục gập, +X = gập thêm, cả hai bên. IK `L_Thigh`–`L_Calf` tới
  cổ chân; control tiếp xúc `ctl_<side>_Foot_IK` ở đệm bàn chân, `ctl_<side>_Heel` (xoay giò quanh đệm bàn), `ctl_<side>_Toe`, pole
  `ctl_<side>_Knee_pole` trước gối.
- Thân, cổ, đầu, đuôi: X local = +X thế giới (xoay X = cúi/ngửa). Rig điều khiển `ctl_*` chỉ trong `.blend`: thêm thanh gập cánh
  `ctl_<side>_Wing_fold`, thanh bay `ctl_<side>_Wing_flight` (mặt cánh nằm ngang), thuộc tính `feet_follow_body` trên `ctl_root` (chân IK
  theo thân khi bay).

Bảng của W02 (32 bone: 24 deform + `root`, `cog` + 6 socket; vị trí khớp đo trên mesh ở
`act-01/monsters/W02_gibbet_crow/rig/rig_brief.md`):

| Bone | Cha | Loại | Vai trò |
| --- | --- | --- | --- |
| `root` | – | gốc, không deform | kéo cả con; giữa hai bàn chân |
| `cog` | `root` | không deform | trọng tâm thân: nhún, chồm, bật nhảy |
| `pelvis` → `spine_01` → `chest` | `cog` | deform | hông và mông; giữa lưng; ngực, vai, gốc cánh |
| `neck_01` → `neck_02` → `neck_03` → `head` → `beak` | `chest` | deform | cổ ngắn trong lông cổ; sọ, mắt, mỏ trên; hàm dưới (há mỏ) |
| `tail_01` → `tail_02` | `pelvis` | deform | gốc đuôi + lông phủ; nửa sau quạt đuôi |
| `L/R_Thigh` → `Calf` → `Foot` → `Toe` | `pelvis` | deform | đùi; "quần" lông; giò vảy + ngón sau; 3 ngón trước |
| `L/R_Wing_01` → `_02` → `_03` | `chest` | deform | cánh tay; cẳng cánh; bàn cánh + lông chóp |
| `ground` | `root` | socket | bóng, vòng chọn |
| `hit_origin`, `fx_head` | `head` | socket | chóp mỏ (điểm mổ); giữa sọ |
| `fx_chest` | `chest` | socket | trước ngực |
| `fx_wing_L`, `fx_wing_R` | `L/R_Wing_03` | socket | cổ tay cánh |

#### Họ Q — bốn chân (B01 Sexton's Dog, G1 duyệt 2026-10-26)

Lõi: `root` (gốc toạ độ) → `cog` (không deform, giữa thân, giữa bàn trước và bàn sau, trên đường sống) → `pelvis` → `spine_01` →
`spine_02` → `chest` → `neck_01` → `neck_02` → `head`, chạy từ hông về phía đầu. Blender: mặt nhìn −Y (= +Z glTF), trái của con vật = +X.
Rest = dáng đứng của mesh (không T-pose).
- **Chân trước** (mỗi bên): `L_Scapula` (bả vai, cha `chest`) → `L_UpperArm` (khớp vai → khuỷu) → `L_ForeArm` (khuỷu → cổ chân trước) →
  `L_Hand` (cổ chân → đệm bàn) → `L_Finger` (cả bàn ngón một bone). Tên đoạn kiểu H để map clip; không `Clavicle`, không xương xoắn.
- **Chân sau** (mỗi bên): `L_Thigh` (hông → gối, cha `pelvis`) → `L_Calf` (gối → khuỷu cổ chân sau) → `L_Foot` (khuỷu cổ chân → đệm bàn)
  → `L_Toe`.
- Đuôi `tail_01..<n>` (cha `pelvis`); `jaw`, `L/R_ear` (cha `head`). Bone phụ theo con ghi trong brief.
- Roll như Qh: trục X cục bộ của mọi bone = +X thế giới chiếu lên bone, cả hai bên; chuyển động trong mặt phẳng dọc (bước, vồ, cúi, ngẩng,
  há hàm, vẫy đuôi lên xuống) là xoay quanh X.
- Socket: `ground`, `hit_origin` (cha `root`), `fx_head`, `fx_mouth` (cha `head`), `fx_chest` (cha `chest`); không socket vũ khí.
- Rig điều khiển `ctl_*` chỉ trong `.blend`: `ctl_root`, `ctl_body` (ở `cog`), FK `ctl_<bone>`; chân trước IK 2 đốt (`UpperArm`–`ForeArm`)
  `ctl_<side>_Hand_IK` (đệm bàn, trên sàn) + `ctl_<side>_Hand_roll` (nhấc cổ chân quanh đệm) + `ctl_<side>_Finger_IK` + pole
  `ctl_<side>_Elbow_pole` sau khuỷu; chân sau IK 2 đốt (`Thigh`–`Calf`) `ctl_<side>_Foot_IK` + `ctl_<side>_Foot_roll` + `ctl_<side>_Toe_IK`
  + pole `ctl_<side>_Knee_pole` trước gối; công tắc `ik_arm_<side>` (chân trước), `ik_leg_<side>` (chân sau), 1 = IK.
- Khác Qh và H: cổ `neck_01`, `neck_02` (H/Qh: `neck`, `neck_02`); có `Scapula` thay `Clavicle`.
- Clip theo cột Q của mục 5; B01 dự kiến `attack` = vồ cắn, `attack2` = cắn và kéo.

Bảng của B01 (41 bone: 34 deform + `root`, `cog` + 5 socket; vị trí khớp đo trên mesh ở
`act-01/monsters/B01_sextons_dog/rig/rig_brief.md` và `rig/landmarks.json`):

| Bone | Cha | Loại | Vai trò |
| --- | --- | --- | --- |
| `root` | – | gốc, không deform | kéo cả con |
| `cog` | `root` | không deform | giữa thân: nâng, hạ, xoay cả thân |
| `pelvis` → `spine_01` → `spine_02` → `chest` | `cog` | deform | hông và mông; thắt lưng; lưng giữa; lồng ngực, ức |
| `neck_01` → `neck_02` → `head` | `chest` | deform | gốc cổ và bờm vai; cổ trong vòng cổ; sọ, mõm trên, má xệ |
| `jaw` | `head` | deform | cằm và mặt dưới hàm (miệng mesh kín: há ~15°) |
| `L/R_ear` | `head` | deform | vành tai rủ, một bone mỗi tai |
| `tail_01` → … → `tail_04` | `pelvis` | deform | đuôi |
| `L/R_Scapula` → `UpperArm` → `ForeArm` → `Hand` → `Finger` | `chest` | deform | chân trước |
| `L/R_Thigh` → `Calf` → `Foot` → `Toe` | `pelvis` | deform | chân sau |
| `collar` → `collar_ring` | `neck_01` | deform, phụ B01, cứng | vòng cổ sắt + 13 đinh tán; 2 mắt xích + vòng đồng (một bone lắc) |
| `ground`, `hit_origin` | `root` | socket | bóng, vòng chọn; điểm phát đòn dưới đầu trước ngực |
| `fx_head`, `fx_mouth` | `head` | socket | giữa sọ; trước miệng (cắn) |
| `fx_chest` | `chest` | socket | giữa ngực |

## 4. Socket và điểm bám

| Socket | Dùng cho | Vị trí |
| --- | --- | --- |
| `R_weapon_attach`, `L_weapon_attach` | vũ khí, khiên | lòng bàn tay, trục dọc theo cán |
| `fx_*` | VFX phép, máu, hào quang | không có trọng số, bám xương gần nhất |
| `hit_origin` *(đề xuất)* | điểm phát sinh đòn đánh | giữa thân, phía trước |
| `ground` *(đề xuất)* | điểm đặt bóng, ring chọn | `root`, y = 0 |

Socket là bone rỗng hoặc empty trong glTF, không có trọng số. Vũ khí là mesh riêng gắn vào socket; hero dùng vũ khí rời theo
concept (xem `ashlar/docs/ASHLAR_HERO_CONCEPT_VI.md`).

## 5. Bộ clip tối thiểu theo họ

`R` bắt buộc, `O` tuỳ chọn. Tên khớp `STATES` trong `clips.js`.

| State | H/S | Q | W | A | L | F | O |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `idle` | R | R | R | R | R | R | R (trạng thái nghỉ) |
| `walk` | R | R | R | R | R | R (bay chậm) | – |
| `run` | R | R | O | O | O | O | – |
| `attack` | R | R | R | R | R | R | O |
| `attack2` | O | O | O | O | O | O | – |
| `cast` | O | O | O | O | O | O | – |
| `block`, `blockHit` | O | – | – | – | – | – | – |
| `hit` | R | R | R | R | R | R | O |
| `death` | R | R | R | R | R | R | O (phá huỷ) |
| `revive` | O | O | O | O | O | O | O |
| `jump`, `dodge` | O (hero) | – | – | – | – | – | – |

Họ O thêm trạng thái riêng nếu cần (`open`, `close`, `trigger`) và đăng ký riêng trong lab; không ép vào bộ đi/đánh. Hero cần
thêm clip theo stance (`1h_`, `2h_`, `dual_`, `ranged1h_`, `ranged2h_`, `spell_`) cho các vũ khí được dùng, tối thiểu `idle`,
`walk`, `run`, `attack` cho mỗi stance.

Clip dùng chung giữa các asset cùng họ H/S được retarget thay vì làm lại; dòng nào dùng chung thì ghi "dùng lại" trong
inventory, đúng như ghi chú của `legacy/ACT1_MONSTER_ANIMATION_VI.md`.

## 6. Thời gian và chuyển động

- 24 fps *(đề xuất)*.
- Độ dài *(đề xuất, chỉnh theo cảm giác chơi)*: `idle` 2–4 s, `walk` 1,0–1,2 s mỗi chu kỳ đủ hai bước, `run` 0,6–0,8 s,
  `attack` 0,5–0,9 s, `hit` 0,3–0,5 s, `death` 1,0–2,5 s.
- Loop kín cho `idle`, `walk`, `run`, `block`.
- Không root motion. `walk`/`run` ghi `stride_m` (mét mỗi chu kỳ) vào `anim/clips.json`.
- Điểm trúng của `attack`, `attack2` nằm ở 40–50% độ dài; của `cast` ở 50%.
- Không dùng scale animation trên bone (trừ hiệu ứng bóp méo có chủ đích), vì glTF và đa số engine nội suy scale kém.

## 7. Ngân sách và cắt bone

*(Đề xuất, chưa đo trên game thật. Chốt sau asset đầu tiên.)*

- Mỗi đỉnh tối đa 4 ảnh hưởng (chuẩn glTF); tổng trọng số bằng 1 (sai số 1e-6).
- Chỉ **một skin** cho mỗi mesh thân.
- Bone không có trọng số và không phải socket được bỏ khỏi bản lab/game. Bản thử Sorceress có 181 bone, 68 bone có trọng số:
  bản game chỉ giữ bone có trọng số cộng socket. **Ngoại lệ bắt buộc: giữ tổ tiên cấu trúc** — `root`, `cog` và mọi bone là cha của bone có
  trọng số hoặc của socket được giữ dù trọng số bằng 0; chỉ bỏ nhánh lá không dùng (D01, G1 2026-10-21).
- Bone mặt (lông mày, mí, miệng) chỉ giữ nếu hero có cảnh cận mặt.
- Bone phụ vật lý (váy, tóc, xích) chỉ giữ nếu có clip hoặc mô phỏng dùng chúng.
- Số tam giác giữ như GLB gốc (khoảng 10k); rig không retopology (tốn credit và đổi UV).

## 8. Quy ước tên file

| File | Tên |
| --- | --- |
| GLB đã rig (4096) | `<asset_id>_rig.glb` |
| File làm việc | `rig/<asset_id>_rig.blend` |
| Bản lab/game | do script sinh, tiền tố theo nhóm (ví dụ `hero-<asset_id>.glb`), đăng ký trong `samples.json` |
| Clip riêng (nếu tách) | `rig/anim/<asset_id>_<state>.glb` |

`<asset_id>` theo quy ước của `ashlar/3d/README.md` (`FL_flagellant_vA`, `D01_hodling`).
