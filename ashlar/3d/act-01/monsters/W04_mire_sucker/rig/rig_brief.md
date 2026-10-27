# Rig brief — W04_mire_sucker

Trạng thái: **G1 duyệt (2026-10-26)**, cả 7 đề xuất (họ W, 1,566 m, 4 chân `Leg1`/`Leg3`, 2 chuỗi cánh mỗi bên, `L/R_abdomen_02..03`,
xoá 2 dải sát đất khỏi mesh rig, giữ chân sau lơ lửng). R2–R5 xong 2026-10-26: A1 14/14, ảnh
`qa/W04_mire_sucker_G2_1..5_*.png`, báo cáo [`qa_report.md`](qa_report.md). **G2 duyệt (2026-10-27)**; xuất rig vào `../rig_done/`
2026-10-27 (FBX + GLB + textures, chưa clip, rig điều khiển không xuất; reimport PASS). Clip là phiên riêng. Quy trình:
[`Agent.md`](../../../../rig-anim/Agent.md). Chuẩn: [`SKELETON_STANDARD.md`](../../../../rig-anim/SKELETON_STANDARD.md). Khởi điểm bảng
bone: [`rig_v1/BRIEF.md`](../../../_batches/rig_v1/BRIEF.md) §2b (chưa duyệt, đã sửa theo mesh thật ở dưới).

Nhãn: **[đo]** số lấy từ GLB đã scale (script `rig/scripts/w04_m1..m6_*.py`, kết quả `rig/_work/landmarks.json`);
**[đề xuất]** chờ duyệt ở G1.

Ảnh G1: [`qa/W04_mire_sucker_G1_proposal.png`](qa/W04_mire_sucker_G1_proposal.png) (khớp dự kiến chồng lên mesh X-ray: trước, bên,
trên, sau + 4 ô cận), [`qa/W04_mire_sucker_G1_mesh_notes.png`](qa/W04_mire_sucker_G1_mesh_notes.png) (chỗ mesh khác concept).

## Thông tin asset

| Mục | Giá trị |
| --- | --- |
| `asset_id` | `W04_mire_sucker` |
| Nhóm / loại | quái, họ Warped (Act I, Night Fens); ruồi hút máu khổng lồ: bay vào hút máu, no thì nổ |
| GLB gốc | `W04_mire_sucker.glb`, 22,1 MB, 10.647 tam giác, 7.602 đỉnh (5.373 sau khi hàn theo vị trí), 1 material, 3 map 4096 (basecolor, normal, rm), sha256 `4f0305c6…5c890a`; không skin, không vertex group. Chỉ đọc |
| Chiều cao thật | đỉnh cánh 0,87H = **1,566 m** (danh mục) [đề xuất, câu hỏi 2] |
| Tư thế gốc | dáng đứng nghỉ của concept (không T-pose): cánh quét ra sau và lên, vòi chĩa trước-xuống 46°, đứng trên chân |
| Mảnh [đo] | 9 mảnh sau khi hàn: thân 5.043 đỉnh (gồm cả sống cánh, các lá cánh trên, chân), 2 mắt (86), 2 lá cánh dưới (61, cách gốc cánh 6 mm), 2 gai rời ở ống chân trước **trái** (10 + 8, bên phải không có), 2 dải phẳng sát đất (9 + 9) |
| Đối xứng [đo] | trái/phải tuyệt đối: khoảng cách tới mesh của landmark và ảnh gương lệch 0,0 mm. Dựng bên trái, soi gương sang phải |

### Mesh khác concept/design (ảnh `G1_mesh_notes`)

1. **Chỉ có 4 chân**: cặp trước (bàn chân ở y −0,38 m, dưới đầu) và cặp sau (y +0,33 m, dưới đầu túi máu). Design và concept có 6;
   cặp giữa (dưới ngực) không có trong mesh, không phải bị dính vào chân khác (mặt cắt ngang từ z 0,05 tới 0,70 chỉ thấy 2 ống
   chân mỗi bên).
2. **Hai dải phẳng sát đất** (z 1,2 cm, mỗi dải 9 đỉnh, dài 1,07 m, hình chữ "<" ở x ±0,40–0,55): có lẽ Tripo dựng từ bóng đổ dưới
   chân trong concept. Không thuộc con quái.
3. **Chân sau lơ lửng**: vuốt sau thấp nhất ở z 4,7 cm; chỉ vuốt trước chạm đất (z 0).
4. **Ống chân trước tách hai thanh song song** ở z 0,28–0,48 (khe ~2 cm), chập lại ở hai đầu. Cùng một đốt, rig như một ống.
5. **Cánh nhiều lớp**: mỗi bên một sống cánh nâu dày + 3–4 lá chồng xoè từ một gốc (2 đỉnh lá trên ở z 1,57 và 1,45; lá dưới là mảnh
   rời; một lá ngắn dưới cùng). Design ghi "hai lá mỗi bên: lá trên dài, lá dưới ngắn".

## Kích thước thật và hệ số scale

| Mục | Giá trị |
| --- | --- |
| Cao GLB | 0,99951 (đỉnh cánh) |
| Scale đều | ×1,56677 → cao 1,566 m, tâm hộp bao ở x = y = 0, đáy z = 0 (`rigbatch.intake`, importer hàn đỉnh trùng) |
| `k` (so với người 1,8 m) | 0,87 |
| Kích thước sau scale [đo] | sải cánh 1,23 m (đỉnh cánh x ±0,614); thân dài 1,34 m (mũi vòi y −0,680 → đuôi túi y +0,66), hộp bao sâu 1,36 m tính đỉnh cánh; bàn chân trước x ±0,47; mắt z 0,98; ngực z 0,72–1,25 |
| Canon "cỡ con mèo" | không khớp hình vẽ (design.txt: giữ tỉ lệ hình vẽ, kích thước trong game đặt khi import). Rig ở 1,566 m trừ khi người dùng chọn khác ở G1 |

## Quyết định rig

| Mục | Lựa chọn | Lý do |
| --- | --- | --- |
| Họ skeleton | **W** (côn trùng bay, cùng nhóm với P03) [đề xuất] | design.txt ghi W; canon: bay vào hút máu, nên di chuyển chính là bay (cánh là chuỗi chính, chân thả hoặc đáp); bộ bone là của P03 cộng vòi, hai túi, đốt chân thứ 4. Một asset chỉ một họ: "A + W" không phải mã của chuẩn. Bộ clip bắt buộc của W và A như nhau (§5), nên chọn W không bớt clip nào. Tên chân dùng kiểu họ A (`L_Leg<n>_<đốt>`, như W07) |
| Route | M: dựng bằng script riêng trong `rig/scripts/` | quái không phải người; skill `blender-character-rigging` không áp dụng (rig_v1 §2b) |
| Công cụ | Blender 5.1.1 chạy nền; `rigbatch` của `rig_v1/tools` (import để nạp mesh, render, đo, không sửa); numpy | |
| Credit | **0** | không Tripo, Meshy, UniRig |
| Trọng số | khoảng cách tới đoạn xương + làm mịn Laplace trên mesh đã hàn, theo vùng (mục Skin) | Automatic Weights hỏng trên mesh Tripo |
| Bone ngón | không (vuốt cứng theo đốt `_04`) | |
| Bone phụ | không có vải, xích; vòi và túi máu là chuỗi chính | |
| Bone mặt | không (mắt cứng theo `head`) | |
| Socket vũ khí | không | không cầm vũ khí |
| Socket VFX | `hit_origin` (mũi vòi), `fx_head`, `fx_thorax`, `fx_abdomen` (giữa hai túi, cho VFX nổ), `ground` | |
| Vật phụ rời | không | |

### Bảng bone runtime [đề xuất]: 41 bone, 34 deform

Vị trí (m, Blender: Z lên, con quái nhìn về −Y, +X là bên trái của nó) đo trên mesh đã scale; bên phải là ảnh gương (x → −x). Đốt
chân: `_01` đốt háng (coxa), `_02` đùi (femur), `_03` ống (tibia), `_04` bàn + vuốt (tarsus).

| Bone | Cha | Đầu → đuôi | Phủ vùng |
| --- | --- | --- | --- |
| `root` | – | (0, 0, 0) ↑ | không trọng số, kéo cả skeleton |
| `cog` | `root` | tâm ngực (0, −0,03, 0,96) ↑ | không trọng số: nâng, hạ, nghiêng cả thân |
| `thorax` | `cog` | (0, −0,03, 0,96) → cổ (0, −0,245, 1,00) | khối ngực, tấm lưng chữ V, mào ~5 gai, tấm lưng chồng lên đầu túi |
| `head` | `thorax` | cổ → mặt (0, −0,43, 0,965) | đầu, 2 mắt (mảnh rời), vương miện 3 gai |
| `proboscis_01..03` | `head` → chuỗi | gốc ở mặt (0, −0,418, 0,898) → mũi (0, −0,679, 0,626), 3 đoạn 0,126 | vòi (dài 0,377 m, chĩa xuống 46°) |
| `abdomen_01` | `thorax` | sau ngực (0, 0,12, 0,925) → chỗ tách túi (0, 0,328, 0,786) | gốc bụng dưới tấm lưng, đỉnh khe giữa hai túi |
| `L_abdomen_02`, `L_abdomen_03` | `abdomen_01` → chuỗi | (0,107, 0,328, 0,786) → (0,095, 0,477, 0,593) → đuôi túi (0,081, 0,648, 0,372) | túi máu trái (dọc trục dài 0,70 m); `R_` gương |
| `L_WingF_01`, `L_WingF_02` | `thorax` → chuỗi | gốc cánh (0,15, 0, 1,11) → (0,359, 0,28, 1,315) → đỉnh lá trên (0,614, 0,623, 1,566) | sống cánh + hai lá trên; trục Z bone = pháp tuyến mặt cánh |
| `L_WingB_01`, `L_WingB_02` | `thorax` → chuỗi | gốc cánh → (0,316, 0,246, 1,203) → đỉnh lá dưới (0,519, 0,546, 1,317) | lá dưới (mảnh rời) + lá ngắn dưới cùng |
| `L_Leg1_01..04` | `thorax` → chuỗi | háng (0,07, −0,03, 0,83) → (0,121, −0,001, 0,712) → gối (0,258, −0,225, 0,779) → cổ chân (0,413, −0,282, 0,285) → gốc vuốt (0,472, −0,298, 0,035) | chân trước; dài 0,131 / 0,271 / 0,521 / 0,257; đùi chĩa ra trước gần nằm ngang, ống chân gần thẳng đứng |
| `L_Leg3_01..04` | `thorax` → chuỗi | háng (0,06, 0,095, 0,84) → (0,096, 0,127, 0,75) → gối (0,15, 0,142, 0,658) → cổ chân (0,23, 0,348, 0,318) → gốc vuốt (0,291, 0,365, 0,075) | chân sau; dài 0,102 / 0,108 / 0,405 / 0,251 |
| `ground` | `root` | (0, 0, 0) | socket: bóng, vòng chọn |
| `hit_origin` | `proboscis_03` | mũi vòi, dọc vòi | socket: điểm trúng đòn đâm |
| `fx_head` | `head` | giữa hai mắt (0, −0,339, 0,998) | socket |
| `fx_thorax` | `thorax` | tâm ngực | socket |
| `fx_abdomen` | `abdomen_01` | giữa hai túi (0, 0,468, 0,604) | socket: VFX nổ khi no |

Không có `L_Leg2_*` vì mesh không có chân giữa; số `Leg1`/`Leg3` giữ nghĩa giải phẫu (trước/sau) để nếu dựng lại GLB 6 chân thì chỉ
thêm `Leg2`, không đổi tên (câu hỏi 3). Roll: chân và vòi có trục X local là trục bản lề (xoay +X = gập thêm, cả hai bên); thân, đầu,
bụng có X local ≈ trục X thế giới (xoay X = cúi/ngửa); cánh có Z local = pháp tuyến mặt cánh hướng ra ngoài, nên xoay quanh X local là
vỗ lên/xuống, quanh Y là vặn lá (pitch), quanh Z là quét trước/sau.

### Rig điều khiển [đề xuất] (armature `W04_mire_sucker_Control`, bone `ctl_*`, chỉ ở `.blend`, không xuất)

| Control | Việc |
| --- | --- |
| `ctl_root` | dưới đất, kéo cả con |
| `ctl_cog` | trọng tâm: bay lên, hạ thân, nghiêng; bàn chân IK đứng yên khi hạ thân |
| FK `ctl_<bone>` cho mọi bone deform | `ctl_thorax`, `ctl_head`, `ctl_proboscis_01..03`, `ctl_abdomen_01`, `ctl_L/R_abdomen_02..03`, cánh, chân |
| `ctl_L_Wing`, `ctl_R_Wing` | master ở gốc cánh: vỗ, dang, gập cả hai lá; FK `ctl_L_WingF_*`, `ctl_L_WingB_*` là con của nó để xoè lá riêng |
| IK 4 chân | `ctl_L_Leg1_IK` (control tiếp xúc ở gốc vuốt, con của `ctl_root`); IK 2 đốt đùi–ống nhắm cổ chân; đốt bàn `_04` theo hướng control (`ctl_L_Leg1_tarsus`); pole `ctl_L_Leg1_pole` ngoài gối (con của `ctl_cog`); đốt háng `_01` FK để vung chân. Công tắc `ik_leg_L1`, `ik_leg_R1`, `ik_leg_L3`, `ik_leg_R3` (1 = IK, mặc định) |
| `ctl_proboscis_IK` | đích IK 3 đốt ở mũi vòi (con của `ctl_root`): ghim mũi vòi vào nạn nhân khi hút, thân bơm lên xuống. Công tắc `ik_proboscis` mặc định 0 (FK) |

Skeleton runtime theo rig điều khiển bằng Copy Transforms (thế giới → thế giới), như D01. 51 bone điều khiển: 36 FK, 2 master cánh,
5 IK (4 chân + vòi), 4 đích bàn chân, 4 pole.

### Đặt tên dùng chung với P03 Hush-Moths và W07 Shroud-Spinner

Lúc viết R1 (22:3x) P03 và W07 chưa có `rig_brief.md`; sau G1 đã đối chiếu với `SKELETON_STANDARD.md` §3 (mục "Họ W, nhóm côn trùng bay"
do P03 viết và mục "Họ A" do W07 viết): tên khớp hết. Sửa theo chuẩn đó: trục Z local của bone cánh là pháp tuyến **mặt lưng** cánh
(với W04 là phía trong-sau-lên, ngược dấu với bản R1), `ctl_<side>_Wing` có X local dọc thân, xoay +X = cánh lên (như P03).

- Chung với P03 (côn trùng bay, họ W): `root`, `cog`, `thorax`, `head`, `abdomen_01`, `L/R_WingF_01..02`, `L/R_WingB_01..02`,
  `L/R_Leg<n>_<đốt>`. W04 = lá trên/dưới, P03 = cánh trước/sau; cùng tên để clip vỗ cánh và bay lơ lửng dùng lại được.
- W04 thêm: `proboscis_01..03`, `L/R_abdomen_02..03` (hai túi tách từ `abdomen_01`, nối số với chuỗi `abdomen_01..03` của P03 nên
  clip bụng của P03 ánh xạ `abdomen_02` → cả `L_` và `R_abdomen_02`), đốt chân thứ 4. W04 không có râu (`antenna`) và chân giữa.
- Chung với W07 (họ A): kiểu tên chân `L_Leg<n>_<đốt>`, đếm từ trước ra sau. W07 dùng `cephalothorax` thay `thorax` (giải phẫu nhện).
- Với W02 Gibbet-Crow (họ W, chim; brief đã có, chờ G1): W02 ghi sẵn "P03, W04 dùng `L_WingF_*`, `L_WingB_*`, chim dùng `L_Wing_*`",
  khớp đề xuất này. Cánh viết hoa như W02 (`L_Wing…`; ví dụ trong chuẩn §3 ghi `L_wing_01` chữ thường, W02 đã hỏi ở G1 của nó).
- Nghĩa từng đốt của W04 ghi ở trên (`_01` háng … `_04` bàn). P03, W07 đề xuất 3 đốt; khi brief của hai con đó có, đối chiếu nghĩa
  `_01..03` và báo lệch ở cổng duyệt, không sửa phần của thread kia.

## Thông số animation

| Mục | Giá trị |
| --- | --- |
| Trục tiến / trục lên | Blender −Y / +Z; glTF +Z / +Y |
| Đơn vị | mét |
| fps | 24 *(đề xuất)* |
| Loop / root motion | idle (đứng hoặc lơ lửng), walk (bay chậm): loop kín, in-place; death không loop |
| Sự kiện gameplay | `hit` ở khung vòi đâm trúng (`hit_origin`); `fx` ở khung nổ (`fx_abdomen`); `footstep` khi đáp (nếu có clip đáp) |
| Rig điều khiển | IK chân: có (4); IK vòi: có (tắt mặc định); master cánh; control tiếp xúc: 4 bàn chân + mũi vòi |
| Giới hạn influence | 4 (glTF) |
| Tiếp tục file của người khác? | không |

## Bộ clip họ W (`SKELETON_STANDARD.md` §5, chỉ liệt kê; làm ở phiên animation)

| State | Cần? | Ghi chú |
| --- | --- | --- |
| `idle` | R | bay lơ lửng tại chỗ (cánh vỗ nhanh, chân thả) hoặc đứng trên chân; chốt ở R6 |
| `walk` | R | §5 cho F ghi "bay chậm"; với W04 là bay chậm tới, in-place |
| `run` | O | lao tới |
| `attack` | R | đâm vòi, điểm trúng ~45 % |
| `attack2` | O | hút máu (ghim vòi bằng `ctl_proboscis_IK`, túi phình là VFX/shape, không scale bone) |
| `cast` | O | – |
| `hit` | R | |
| `death` | R | rơi xuống, hoặc nổ túi (VFX ở `fx_abdomen`) |
| `revive` | O | |
| Clip đặc thù | O | `burst` (no thì nổ), `land` / `takeoff` (đáp đất ↔ bay) nếu gameplay cần |

## Skin [đề xuất]

Trọng số tính trên mesh đã hàn theo vị trí (đỉnh nhân đôi ở đường nối UV nhận cùng trọng số, không hở):

1. **Mảnh cứng một bone**: mắt → `head`; gai rời chân trước trái → `L_Leg1_03`; lá cánh dưới → chuỗi `WingB` (theo dọc sải);
   vuốt → `_04`.
2. **Chia vùng** trên mảnh thân bằng Voronoi trắc địa (lan theo bề mặt) từ hạt giống quanh từng đoạn xương, mỗi bone chỉ nhận hạt
   giống trong vùng của bộ phận nó (chân, cánh, vòi, túi, đầu, ngực). Lan theo bề mặt nên gai trên ngực ở cạnh gốc cánh vẫn theo
   ngực, chân sau đi sát túi máu không ăn sang túi.
3. **Chuyển tiếp** chỉ giữa bone cha–con (và giữa hai túi ở khe), bằng nội suy điều hoà (Laplace) trong dải trắc địa quanh khớp: khớp
   chân ~3 cm, háng ~3 cm, gốc cánh ~4 cm, giữa sải cánh ~8 cm, cổ ~4 cm, vòi ~3 cm, gốc bụng ~5 cm, giữa túi ~10 cm.
4. Tối đa 4 ảnh hưởng, chuẩn hoá tổng = 1; không trọng số trên `root`, `cog`, socket.

## Vùng khó skin (soi ở G2)

1. **Gốc cánh**: cánh đang quét ra sau-lên; dang và vỗ phải xoay 60–90° quanh gốc → giãn ở dải nối cánh với ngực, lá cánh có thể
   xuyên tấm lưng và mào gai. Đo độ giãn cạnh và số đỉnh lá lọt vào ngực ở tư thế dang, vỗ lên, vỗ xuống.
2. **Lá cánh chồng nhau**: lá trên (F) và lá dưới (B) chung gốc; xoè riêng sẽ kéo nhau ở gốc.
3. **Hai túi máu**: dính nhau ở khe giữa (z > 0,5); lắc ngược chiều làm giãn khe; tấm lưng ngực chồng lên đỉnh túi nên túi lắc lên
   sẽ xuyên tấm lưng.
4. **Chân**: bốn đốt háng sát nhau dưới ngực; femur chân trước nằm ngang sát sau đầu; ống chân sau đi sát túi máu (khe 4–5 cm).
5. **Vòi**: ống mảnh, gần như cứng; gốc vòi sát mắt và sát femur chân trước khi cúi đầu.
6. **Dải phẳng sát đất** (câu hỏi 6) và **ống chân trước hai thanh** (cùng đốt, không tách).

## Tư thế thử ở R5 (QA_CHECKLIST A2 cho họ này)

Dang cánh ngang + vỗ lên/xuống (±45°) + vặn lá; xoè lá F/B; nhấc từng chân (4 tư thế) và vung chân ra trước/sau; hạ thân 15 cm với
bàn chân IK đứng yên; đâm vòi (cúi đầu + vòi ra trước) và ghim vòi bằng IK; lắc túi (cùng chiều, ngược chiều, lên/xuống); cúi, ngửa,
quay đầu; nghiêng thân. Mỗi tư thế: độ giãn cạnh lớn nhất, số cạnh xấu, xuyên ở gốc cánh và túi/tấm lưng; ảnh ba góc.

## Rủi ro và điều cần chú ý

- Asset đầu tiên của nhóm côn trùng bay đi hết quy trình cùng lúc với P03: tên chung có thể phải chỉnh khi hai brief gặp nhau.
- Chân sau lơ lửng ở rest: control IK đặt tại vị trí rest (vuốt sau ở z 4,7 cm), clip đứng phải hạ xuống đất.
- Cách skin theo vùng chưa kiểm chứng trên cánh nhiều lớp; nếu gốc cánh giãn quá ngưỡng thì nới dải chuyển tiếp hoặc thêm bone gốc
  cánh, báo ở G2.
- Không sửa GLB gốc. Nếu duyệt xoá hai dải sát đất (câu hỏi 6), mesh rig khác GLB đúng 18 đỉnh của hai dải đó, ghi trong
  `validation.json` (A1.9 so trên phần còn lại).

## Câu hỏi G1 (cần người dùng chốt)

1. **Họ skeleton**: W (đề xuất, lý do ở bảng) hay A.
2. **Kích thước**: 1,566 m tới đỉnh cánh (0,87H danh mục, đề xuất) hay cỡ con mèo theo canon (cho số).
3. **Chân**: rig 4 chân như mesh, tên `Leg1` (trước) và `Leg3` (sau), chừa `Leg2` (đề xuất); hay dựng lại GLB 6 chân trước khi rig
   (tốn credit Tripo, ngoài phạm vi thread này).
4. **Cánh**: 2 chuỗi mỗi bên `WingF` + `WingB` như P03, có master `ctl_*_Wing` (đề xuất); hay 1 chuỗi `L_Wing_01..02` cho cả cụm lá.
5. **Túi máu**: tên `L/R_abdomen_02..03` (đề xuất; theo luật tiền tố `L_`/`R_`, vì `abdomen_L/R` của rig_v1 §2b dùng hậu tố) và
   2 bone mỗi túi.
6. **Hai dải phẳng sát đất**: xoá khỏi mesh rig (đề xuất); hay giữ và gán vào bàn chân gần nhất (dải dài 1,07 m nối chân trước với
   chân sau, sẽ giãn khi bước).
7. **Chân sau lơ lửng 4,7 cm**: giữ rest như mesh (đề xuất); hay hạ bàn chân sau xuống đất ngay trong rest (sửa hình mesh).

## Chỉ tiêu qua cổng

- G2: QA_CHECKLIST A1 (14 mục, `rig/validation.json`) + A2 (skeleton chồng mesh ba góc, bản đồ trọng số, tư thế thử ở trên, vùng khó,
  socket).
- G3: B1, B2 (phiên animation).
- G4: C.

## Duyệt

| Cổng | Ngày | Kết quả | Người duyệt | Ghi chú |
| --- | --- | --- | --- | --- |
| G1 (brief) | 2026-10-26 | **duyệt** | người dùng | cả 7 đề xuất ở mục Câu hỏi G1 |
| G2 (rig) | 2026-10-27 | **duyệt** | người dùng | xem trong Blender (cửa sổ riêng qua `gui_open.py`), "done, export đi"; A1 14/14; `qa_report.md`. Xuất `rig_done/` 2026-10-27 (R8 chỉ rig, `qa_report.md` mục 8) |
| G3 (clip) | | | | |
| G4 (trong lab) | | | | |
| R9 (tích hợp engine, nếu có) | | | | |
