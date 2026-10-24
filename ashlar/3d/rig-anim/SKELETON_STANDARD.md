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
