# Rig brief — D01_hodling

Trạng thái: **G1 và G2 đã được người dùng duyệt (2026-10-21, trả lời "duyệt"); R6–R7 đã dựng (6 Action, bản thử trong lab), chờ review kỹ thuật Opus rồi G3.** Chưa R8, chưa R9, 0 credit, GLB gốc không bị sửa. G3 và G4 **chưa** duyệt. Xem [`anim/R7_report.md`](anim/R7_report.md) và [`anim/clips.json`](anim/clips.json).
Quy trình: [`Agent.md`](../../../rig-anim/Agent.md). Chuẩn: [`SKELETON_STANDARD.md`](../../../rig-anim/SKELETON_STANDARD.md). Số đo thô:
[`preflight.json`](preflight.json) (script [`tools/preflight_glb.py`](tools/preflight_glb.py), chạy bằng `python -I`) và
[`preflight_blender.json`](preflight_blender.json) (import chỉ-đọc bằng [`tools/blender_import_probe.py`](tools/blender_import_probe.py)).

Ba nhãn dùng trong brief: **[đo]** = số lấy từ GLB thật; **[suy luận]** = rút ra từ số đo hoặc từ ảnh tham chiếu, chưa xác minh bằng
ảnh dựng; **[dự kiến]** = chưa có bằng chứng, ghi để quyết ở G1 hoặc cập nhật sau.

## Thông tin asset

| Mục | Giá trị |
| --- | --- |
| `asset_id` | `D01_hodling` |
| Nhóm / loại | quái |
| Họ quái ASHLAR | Discarded (quỷ đất nung). Bậc tên: Hodling → Ember-Hod → Slag-Hod → Kiln-Hod (chỉ Hodling có model) |
| GLB gốc | `D01_hodling.glb` **[đo]** 14.778.932 byte, sha256 `bf22ccea25b72a879048fe3d0bf4ecf92b551984b85081ae97e3bea56f3d8c5a`. Generator "Tripo", glTF 2.0. 1 scene, 2 node (`RootNode` → 1 node mesh, cả hai transform đơn vị), 1 mesh, 1 primitive (mode 4), **10.668 tam giác**, 6.505 đỉnh, index uint32, 0 tam giác suy biến, 0 đỉnh thừa. Thuộc tính: `POSITION`, `NORMAL`, `TEXCOORD_0` (UV trong 0–1). Không có skin, animation, morph target, vertex color. Extension: `KHR_materials_specular`, `KHR_materials_volume`, `FB_ngon_encoding` (không bắt buộc) |
| Texture | **[đo]** 3 map, mỗi map 4096×4096: base color JPEG 2.008.101 B, metallicRoughness PNG 11.397.198 B, normal JPEG 1.034.927 B (1 material, 3 sampler mặc định) |
| Bounds gốc | **[đo]** X −0,499756…0,499756 (1,0 m, sải tay); Y 0…0,73584 (chân chạm y = 0, đỉnh mũ/sừng); Z −0,229248…0,229248 (0,4585 m). Tâm XZ (0, 0). Accessor min/max khai báo khớp tính lại từ dữ liệu |
| Chiều cao thật (danh mục) | ~0,5 m (0,27H × 1,8 m = 0,49 m; canon "cao tới gối", quy chuẩn quái 0,25–0,30H). Họ S |
| Tư thế gốc | T-pose (tay dang ngang, chân hơi tách, thân khom nhẹ) |
| Lỗi đã biết của mesh | Từ `README.md` và ảnh: góc mũ nhọn, tai hơi to, tay mảnh. Từ ảnh `_shots/final_views.png`: ngón tay nhìn thấy tách nhưng **chưa soi ở mức đỉnh**; loincloth phía trước là mảnh vải mỏng sát đùi (cần kiểm skin) |

Concept (`concept.png`, `design.txt`, `brief.md`) cho thấy: gầy, gù, tay quá dài, bàn tay to ngón ngắn cùn, chân ngắn quặp, bàn chân bẹt to
không móng; mũ = một mảnh đá phiến đội lệch về bên trái quái, hai sừng ngà cụt hai bên; **một khối túi vải đầy gạch** trên lưng (một
vệt nứt cam chạy dọc sống lưng); dây đai túi vắt chéo ngực; một mảnh khố nâu phía trước. **Giáo (đinh dài) cầm hai tay bị loại khỏi
model theo `design.txt`**: tay trống, mở. Giáo là vật rời, chưa dựng, brief này không dựng giáo.

## Bằng chứng đo cho các quyết định (từ `preflight.json`)

| Điều | Số đo | Ghi chú |
| --- | --- | --- |
| Quy đổi kích thước | Tripo chuẩn hoá cạnh dài nhất = **sải tay 1,0 m**, không phải chiều cao. Chiều cao Y = 0,73584 m. Nếu đỉnh mũ → 0,5 m thì hệ số **0,679496**; sải tay sau scale 0,679 m, bề dày Z 0,3115 m | **Mặc định đề xuất**: điểm cao nhất của toàn bộ mesh (bounds Y, tính cả mũ, sừng, túi) = 0,5 m, hệ số 0,679496. T-pose khom nhẹ nên có thể lệch so với chiều cao khom của concept. Xem "Mặc định đề xuất cho G1" |
| Độ cao tay | Dải y 0,4783–0,5151 là dải rộng nhất theo X (span 0,9996 m): tay ngang ở **0,675 × chiều cao Y**; sau scale cao khoảng 0,325–0,350 m | Dải y 0,4415–0,4783 cũng đã rộng 0,9976 m; từ dải y 0,5151 trở lên x thu về −0,2834…0,1824 m (chỉ thân/đầu/túi, không còn tay) |
| Bàn chân | Dải y < 0,12H: chân hai bên rộng như nhau 0,1157 m mỗi bàn (x −0,1501…−0,0344 và 0,0642…0,1799), khe giữa hai chân 0,0986 m, z −0,0969…0,0706 (dài bàn 0,1675 m trước scale, ~0,114 m sau scale) | Bounds X-width và thống kê Z của hai bàn chân trùng nhau; tâm cặp chân lệch +0,0149 m theo X so với tâm bounds. **Chưa kiểm khớp từng đỉnh** (chưa biết là bản sao lật, bản dịch hay chỉ hai bàn giống nhau). Ghi để đặt `pelvis` và `root` |
| Mũi chân hướng | Mặt đế (y < 0,05H): z trung bình +0,0132; ống chân (y 0,10–0,20H): z trung bình −0,0599. Hai chân cho cùng số liệu nên **chỉ tính là một bằng chứng**, không phải hai lần xác nhận độc lập | **[suy luận]** mũi chân hướng +Z, tức mặt nhìn về +Z khớp chuẩn glTF của dự án. **Chưa xác minh bằng ảnh** |
| Khom thân | Thân trên (y > 0,55H, x gần giữa): z trung bình +0,0477, lệch +0,0502 so với bàn chân | **[suy luận]** thân nghiêng về +Z (hướng mặt), phù hợp dáng gù; khối túi nằm phía −Z. Xác nhận bằng ảnh ở R2 |
| Tay đầu mút | dải y 0,4415–0,5151: x ±0,4998 (bàn tay chạm giới hạn bounds); dải 0,4047–0,4415 có x max 0,4294 | chỉ phía +X có phần chúc xuống (x max 0,4294 ở dải thấp hơn; phía −X không có dữ liệu ở dải đó, x min −0,1106) |
| Blender 5.2.2 LTS import | 1 mesh + 1 empty, 0 armature, 0 action, 6.505 đỉnh, 10.668 đa giác (đều tam giác), 1 UV layer, 0 vertex group, 3 image 4096². Importer đặt chiều sâu lên Y (bbox Y −0,229…0,229, Z 0…0,736) | glTF +Z → Blender −Y. Chỉ xác nhận importer chuyển trục đúng; **không** xác nhận mặt nhìn về đâu |

## Quyết định rig

| Mục | Lựa chọn | Lý do |
| --- | --- | --- |
| Họ skeleton | **S** (humanoid nhỏ, topology H) | hai tay hai chân thẳng đứng, có thân, đầu; D01 là họ S theo `Agent.md` mục 2. Dùng chung tên bone lõi với H |
| Route | **M (rig tay trong Blender) + retarget clip CC0 từ KayKit** | xem bên dưới |
| Công cụ cụ thể | Blender 5.2.2 LTS (`E:\SteamLibrary\steamapps\common\Blender\blender.exe`); skeleton riêng theo `SKELETON_STANDARD.md`, đặt khớp theo landmark trên mesh đã scale; skin heat-map rồi chỉnh tay; clip retarget từ KayKit Adventurers (CC0) | không dùng D2R |
| Ước tính credit | **0** (không dùng Tripo, không dịch vụ trả phí). Chưa đo thời gian dựng | route M chạy cục bộ. Tripo đã tiêu 145 credit cho model, theo `tripo.log` (8795 → 8650) |
| Bone ngón tay | **không** (một bone `*_Hand` mỗi bên) | bàn tay to ngón ngắn cùn nhìn từ camera ARPG ~0,5 m; grip cầm giáo làm bằng xoay bàn tay. Phương án thay: gom khối (1 bone `*_Fingers` mỗi bên). Chưa soi ngón có dính hay tách ở mức đỉnh |
| Bone phụ cần giữ | `helmet` (mũ đá phiến + 2 sừng, rigid, có thể "lách cách"), `sack` (khối túi gạch trên lưng, con của `chest`, weights cứng có mép mềm ở vai), `loincloth_front` (mảnh khố trước), `L_ear`, `R_ear` (tai nhọn, tuỳ chọn, một bone mỗi tai). Dây đai túi không có bone (theo `chest`/`sack`). Không đuôi, không áo choàng, không váy | từ concept và `design.txt`. Tên `sack`, `loincloth_front`, `L_ear`, `R_ear` **chưa có trong `SKELETON_STANDARD.md`** (chỉ `helmet` có): thêm vào mục 3 sau khi G1 duyệt |
| Bone mặt | **không** | quái, "mặt nhăn", không có cảnh cận mặt (theo mục 7 chuẩn). Không `jaw` |
| Socket vũ khí | `R_weapon_attach`, `L_weapon_attach` (hai socket rỗng, giữ cho đủ chuẩn) | giáo (đinh dài) hai tay là vật rời, **không dựng trong lượt này**. Socket giáo dùng khi dựng giáo; concept đặt tay phải của quái phía trước trên cán, `R_weapon_attach` là ứng viên, quyết lúc đó |
| Socket VFX | `fx_head`, `fx_chest`, `fx_hand_R`, `fx_hand_L`, `hit_origin`, `ground` | khe nứt chỉ là dải màu, không phát sáng, nên không cần socket lửa ngoài chuẩn; bụi/mảnh vỡ khi chết đặt ở `ground`/`fx_chest` |
| Vật phụ rời | giáo/đinh dài (chưa dựng). Mũ, túi, đai, khố, sừng là một phần mesh thân, **không** tách | mesh Tripo chỉ có 1 mesh; tách vật phụ sẽ sửa mesh (ngoài phạm vi) |

### Route: vì sao chọn M + retarget KayKit, không chọn T hay A

- **T (skeleton mẫu CC0) không chọn làm skeleton chính.** Template CC0 khả dụng duy nhất là skin KayKit trong git (`kaykit-knight.glb`, xem
  dưới): đo được **41 joint, trong đó 18 là IK/control** (`kneeIK`, `elbowIK`, `handIK`, `heelIK`, `IK-*`, `control-*`), phần deform là
  `root`, `hips`, `spine`, `chest`, `upperarm/lowerarm/wrist/hand/handslot` mỗi bên, `head`, `upperleg/lowerleg/foot/toes` mỗi bên. **Không có `cog`,
  `pelvis` riêng, `neck`; không có `spine_01/02`** và tên đặt hậu tố `.l/.r`, trái chuẩn `L_`/`R_`. Đổi tên và thêm bone vẫn phải
  dựng lại phân cấp; tỉ lệ người trưởng thành, không hợp tay dài chân ngắn gù của Hodling. Quyết: **không** lấy làm skeleton, chỉ làm nguồn clip.
- **A (auto-rig Tripo/UniRig/Meshy) không chọn.** Tốn credit hoặc chưa kiểm chứng (Tripo MCP báo timeout ngày 2026-10-21;
  UniRig skinning chưa kiểm trạng thái); bone không chuẩn tên; quái này rất nhỏ, ít bone, dựng tay nhanh hơn kiểm một auto-rig.
- **M có cơ sở khả thi:** 1 mesh sạch (0 tam giác suy biến, UV 0–1), T-pose tay chân tách (xem ảnh), ~25 bone có trọng số, không cần bone vật lý phức tạp.
  Skeleton riêng theo chuẩn ASHLAR còn là điều kiện để dùng chung với các quái họ H/S về sau.
- Rủi ro của M: chậm hơn T/A, cần soi skin tay, mũ, tai, túi. Nếu M không qua G2 thì đổi route (cho phép theo `Agent.md` mục 4).

Số bone (**[dự kiến]**, chưa dựng): lõi 22 (`root`, `cog`, `pelvis`, `spine_01`, `spine_02`, `chest`, `neck`, `head`, mỗi
bên `UpperArm`/`ForeArm`/`Hand` + `Thigh`/`Calf`/`Foot`/`Toe`) + 5 bone phụ (`helmet`, `sack`, `loincloth_front`, `L_ear`, `R_ear`) = 27, cộng 8 socket
(`R_weapon_attach`, `L_weapon_attach`, `fx_head`, `fx_chest`, `fx_hand_R`, `fx_hand_L`, `hit_origin`, `ground`) = **35 bone runtime**; bone có trọng số
**~25** (27 trừ `root`, `cog` không gán trọng số). Nếu G2 cho thấy vai/nách cần `L_Clavicle`/`R_Clavicle` thì thêm 2: 37 runtime, ~27 có trọng số;
mặc định là không có.

Ngưỡng 30–60 deform bone ở mục 2 của `SKELETON_STANDARD.md` là *đề xuất*, không phải bắt buộc. ~25–27 deform bone là đủ cho quái ~0,5 m không ngón, không
mặt; **không thêm bone ngón hoặc bone đệm chỉ để đạt ngưỡng**.

**Dọn bone chưa dùng giữ lại tổ tiên cấu trúc.** Khi cắt bone không có trọng số và không phải socket (`SKELETON_STANDARD.md` mục 7) trên bản runtime, phải giữ
`root`, `cog` và mọi bone là cha của bone có trọng số hoặc của socket; chỉ bỏ nhánh lá không dùng. (Chuẩn mục 7 chưa ghi rõ điều này; thêm một ghi chú vào đó
là việc riêng, ngoài phạm vi brief này.)

## Thông số animation (theo `blender-game-animation`)

| Mục | Giá trị |
| --- | --- |
| Trục tiến / trục lên | glTF Y lên, mặt nhìn +Z (chuẩn dự án). **Chưa xác minh**: chỉ suy luận từ bàn chân (+Z) và dáng khom; phải xác nhận bằng ảnh tại R2 trước khi xuất, và kiểm trái/phải (nhìn +Z thì tay trái quái ở +X). Blender: xuất "+Y Up" |
| Đơn vị | mét. Scale mesh về 0,5 m trước khi dựng xương: **điểm cao nhất của toàn bộ mesh** (Y max của bounds, tính cả mũ, sừng, túi) = 0,5 m, hệ số **0,679496** (mặc định, xem G1) |
| fps | **24** *(mặc định đề xuất)*. Clip KayKit bản lab **có vẻ là 30 fps**: mọi thời lượng đo được là bội của 1/30 (0,6667 = 20/30; 0,8 = 24/30; 0,8667 = 26/30; 1,0667 = 32/30; 1,4667 = 44/30; 1,6 = 48/30; 2,6333 = 79/30). Đây là suy luận từ bản đã nén, chưa đối chiếu gói gốc |
| Retime và lấy mẫu (hai bước riêng) | (a) **retime/trim**: đổi thời lượng nguồn → thời lượng đích bằng cách co/giãn thời gian key (hoặc cắt đoạn), ghi **cả hai thời lượng** vào `clips.json`; thời điểm sự kiện (điểm trúng ở 40–50%, tiếp xúc chân) co giãn theo cùng hệ số rồi làm tròn về khung 24 fps. (b) **lấy mẫu ở 24 fps trên trục thời gian** (theo `Agent.md` mục 10, lấy mẫu giữ nguyên thời lượng). Thời lượng đích chọn là số nguyên khung ở 24 fps (N/24 s). Cột "nguồn" trong bảng clip là **số đo** từ bản lab; cột "đích" là **đề xuất**, chưa đo trên clip đã dựng |
| Loop / root motion | `idle`, `walk`, `run`: vòng lặp kín, tại chỗ. `death`: không loop, dừng pose cuối. `hit`, `attack`: không loop. Không root motion |
| Sự kiện gameplay cần có | `footstep` (hai chân, `walk`/`run`); `hit` của `attack` ở 40–50% độ dài clip (đề xuất khung 8/18 ≈ 0,333 s, 44%); `death` kết thúc (bụi/vỡ đất nung ở `ground`). Thời điểm tiếp xúc chân đo trên clip sau retime + retarget, không lấy của KayKit; khung chốt ở R6 |
| Tham chiếu | `rig/anim/refs/` — đã tạo 2026-10-21 (KayKit `kaykit-anims-medium.glb` + skin tham chiếu + `prepare-kaykit.py`, băm đúng blob ghim). Clip KayKit nguồn lấy theo blob git ghim ở bảng nguồn bên dưới |
| Rig điều khiển | IK chân: **có** (`ctl_L_Foot_IK`, `ctl_R_Foot_IK`, pole gối; bàn chân bẹt to cần control tiếp xúc gót/mũi). IK tay: **có**, vì tay quá dài chạm sàn khi khom (giáo hai tay hoãn, không phải lý do trong lượt này). Control tiếp xúc: có. Rig điều khiển chỉ ở `.blend`, tiền tố `ctl_`, không xuất |
| Giới hạn influence của engine đích | 4 (chuẩn glTF); cắt và chuẩn hoá trên bản runtime |
| Tiếp tục file của người khác? | không (dựng mới trong `rig/D01_hodling_rig.blend`) |

## Bộ clip

Bộ bắt buộc của họ S giống H: `idle`, `walk`, `run`, `attack`, `hit`, `death` (6). Hodling **không** có `attack2`, `cast`, `block`,
`blockHit`, `jump`, `dodge`; không cần stance (quái, `unarmed` tạm).

**Nguồn dự kiến (chưa retarget, chưa mở từng clip trong Blender):** KayKit Adventurers 1.0 (Kay Lousberg;
[repo chính thức](https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0)). **Giấy phép CC0 đã kiểm trên README của repo chính thức**
(link trên); chưa ghi đường dẫn tới file `LICENSE` riêng. CC0 không bắt buộc ghi công; vẫn ghi nguồn trong `clips.json`.
Bản trong repo là thư viện clip đã qua `lookdev-lab/scripts/prepare-kaykit.py` (bỏ kênh IK, bỏ key thừa, rotation 16-bit) nên
**thời lượng "nguồn" dưới đây là số đo của bản lab đó; fps và thời lượng của gói gốc chưa đối chiếu**:

- file `lookdev-lab/assets/samples/kaykit-anims-medium.glb` **chỉ còn trong git, đã bị gỡ khỏi working tree có chủ ý** — không `git restore`/`checkout`
  vào đường dẫn cũ. Pin: commit `12ee5abe75ada7356f45916f73feaf1cffa21994`, blob `27fd96a347189b135b0facd83fab7527b301a950`, 936.632 B, sha256 `35a136f28c9f9d219ead9e47ddad241fff937063a5578532f2fbde4b80dbe5cf`, 76 Action, 24 node, 0 skin.
- skin tham chiếu (cùng pin): `kaykit-knight.glb`, blob `fe302a0e62c83a34b98a7cb7a76b03bf1af4f9e2`, 380.280 B, sha256 `d781e192f2ea2d55fe6358d168d25c83ec63194d9f9356f6c36eecd6d7e6485a`, 41 joint.
- Cần dùng thì **sau G1** trích blob bằng `subprocess` nhị phân vào `rig/anim/refs/` (không đảo thay đổi của thread khác). Tôi chỉ đọc bằng `git show` ra thư mục tạm
  ngoài repo rồi đã xoá; chưa có file KayKit nào trong `rig/`.

Cột "Nguồn" là **số đo** (bản lab, 30 fps có vẻ); cột "Đích" là **đề xuất** (N khung ở 24 fps, hệ số retime = đích / nguồn), chưa dựng.

| State | Cần? | Nguồn dự kiến (số đo) | Đích (đề xuất) | Dùng lại từ | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| `idle` | R | KayKit `Unarmed_Idle` (1,0667 s) hoặc `Idle` (1,0667 s), retarget; thêm lớp khom thân và nhịp "đếm gạch"/co vai làm tay | 2 chu kỳ × 24 khung = 48/24 = **2,0 s** (mỗi chu kỳ 1,0667 → 1,0 s, ×0,9375) | – | Chuẩn đề xuất 2–4 s; nguồn chỉ 1,07 s nên ghép 2 chu kỳ (mặc định) và chỉnh để chu kỳ sau khác chu kỳ trước một chút |
| `walk` | R | KayKit `Walking_A` (1,0667 s, 33 key; B 1,0667 s, C 1,6 s là phương án) | 26/24 = **1,0833 s** (×1,0156, gần như giữ nguyên) | – | Hợp 1,0–1,2 s. Chân Hodling ngắn: `stride_m` phải đo lại trên hình học đế sau retarget, không lấy của KayKit |
| `run` | R | KayKit `Running_A` (0,8 s, 25 key; B 1,0667 s) | 18/24 = **0,75 s** (×0,9375) | – | Hợp 0,6–0,8 s |
| `attack` | R | **Tạm không có vũ khí, đấm tay không:** KayKit `Unarmed_Melee_Attack_Punch_A` (1,4667 s). Phương án dự phòng `1H_Melee_Attack_Chop` (1,0667 s). Sửa tay vung vuốt thành động tác Hodling | 18/24 = **0,75 s** (từ Punch_A ×0,5114, tức nén gần một nửa; từ Chop ×0,703). Điểm trúng khung 8 (0,333 s, 44%) | – | Giáo không dựng (xem mặc định G1); đòn đâm hai tay là clip riêng stance `2h`, làm khi dựng giáo. Nếu nén ×0,51 làm mất đọc được đòn, đổi sang Chop. Điểm trúng gốc của nguồn **chưa đo**; điểm trúng đích là sau retime |
| `attack2` | – | – | – | – | không làm |
| `cast` | – | – | – | – | không làm |
| `block`, `blockHit` | – | – | – | – | không làm |
| `hit` | R | KayKit `Hit_A` (0,6667 s, 21 key; `Hit_B` 0,8667 s) | 11/24 = **0,458333 s** (từ Hit_A ×0,6875) | – | Nguồn dài hơn 0,3–0,5 s nên phải retime (không phải lấy mẫu lại) |
| `death` | R | KayKit `Death_A` (0,8 s, 23 key; `Death_B` 2,6333 s, 69 key; kèm `Death_A_Pose`/`Death_B_Pose` làm pose cuối) | mặc định `Death_A` 30/24 = **1,25 s** (×1,5625, kéo chậm). Phương án `Death_B` 60/24 = 2,5 s (×0,9494) | – | Nguồn 0,8 s ngắn, 2,63 s dài so với 1,0–2,5 s; chốt phương án ở R6. Dừng pose cuối, không loop |
| `revive` | – | – | – | – | hoãn (canon D02 Kiln-Shaman "nung lại Hodling đã vỡ" nên có thể cần sau); không làm trong lượt này |
| `jump`, `dodge` | – | – | – | – | không làm |
| Clip đặc thù | – | `panic` (cả bầy hoảng chạy khi một con vỡ: canon cast §3.7) — **[dự kiến]** từ `run` + chỉnh tay; vỡ tan khi chết là VFX/mesh, không phải bone | – | – | Hoãn, không làm trong lượt này |

Mọi clip dùng phải có dòng nguồn, giấy phép, **thời lượng nguồn và đích** trong `rig/anim/clips.json` (chưa tạo). Không còn việc tìm nguồn clip ngoài
KayKit trong brief này.

## Rủi ro và điều cần chú ý

- **Chiều cao 0,5 m**: cơ sở hệ số = điểm cao nhất toàn mesh (Y 0,73584 m → 0,5 m); T-pose ít khom hơn concept nên chiều cao thật còn mơ hồ. Scale đều là bước rẻ, đổi được trước khi skin.
- **Dáng gù trong clip**: clip nguồn là người đứng thẳng; bản retarget phải giữ một độ lệch khom (lớp offset trên `spine_01/02`, `chest`, `neck`) và độ lệch tay dài.
  Chân Hodling ngắn so với tay nên IK chân và tay cần kiểm tầm với: nếu IK sụp, trước hết xem mục tiêu và tầm với, không phải lỗi trọng số.
- **Skin**: tay mảnh (vai, nách, khuỷu); mũ đá phiến rộng đè lên đầu và có thể xuyên khối túi khi cúi, quay đầu (chưa đo, soi bằng ảnh); túi gạch dính vào vai và dây đai;
  khố trước mỏng sát đùi (xẻ khi bước dài); tai nhọn hơi to; bàn chân bẹt to đế phải phẳng khi IK. Vùng soi kỹ ở G2.
- **Ngón tay**: không bone; nếu bàn tay dính khối thì không sao, nếu ngón tách mà không có bone thì ngón bị cứng theo bàn tay (chấp nhận được ở cỡ 0,5 m).
- **Tên bone phụ mới** cần cập nhật chuẩn sau G1.
- **Giấy phép**: KayKit CC0 (đã kiểm trên README repo chính thức, link ở mục clip); D2R không dùng.
- **Số bone (~25–27 deform) thấp hơn đề xuất 30–60** của họ S: chấp nhận, nêu ở trên; không thêm bone đệm.
- Tripo MCP chưa dùng; route A không phụ thuộc.

## Chưa xác minh (tổng hợp)

1. Mặt nhìn +Z, trái/phải: mới suy luận từ hình học bàn chân và dáng khom. Cần ảnh dựng/Blender ở R2.
2. Cơ sở chiều cao 0,5 m (đỉnh mũ hay đỉnh đầu, T-pose hay dáng khom).
3. Ngón tay dính hay tách ở mức đỉnh; hình học tai và mũ so với đầu.
4. Thời lượng/fps gốc của từng clip KayKit (số đo ở trên là bản lab đã nén; 30 fps là suy luận từ bội của 1/30); độ phủ bone của retarget.
5. Điểm trúng, `stride_m`, thời điểm tiếp xúc: chưa có clip nên chưa đo.
6. Thời gian dựng, hiệu năng.

## Mặc định đề xuất cho G1 (một lần duyệt)

Duyệt G1 = chấp nhận các mặc định sau; chỉ cần nêu mục muốn đổi.

| Mục | Mặc định |
| --- | --- |
| Chiều cao | Điểm cao nhất của toàn bộ mesh (mũ, sừng, túi, theo Y max của bounds) = 0,5 m, hệ số 0,679496 |
| Route | M (skeleton riêng theo chuẩn ASHLAR) + retarget clip KayKit CC0; không route T/A |
| Ngón tay | Không bone ngón (một `*_Hand` mỗi bên) |
| Bone phụ | `helmet`, `sack`, `loincloth_front`, `L_ear`, `R_ear`; không `Clavicle` (thêm 2 nếu QA biến dạng vai/nách ở G2 cần) |
| Vũ khí | `attack` tay không (đấm); **không dựng giáo**; hai socket vũ khí giữ rỗng |
| Clip hoãn | `panic`, `revive` |
| fps / thời lượng | 24 fps; thời lượng đích là số nguyên khung (bảng clip); `idle` ghép 2 chu kỳ |

Hai điểm đánh đổi thật sự, nếu muốn đổi:

- **Cơ sở 0,5 m**: nếu muốn quái cao hơn/thấp hơn trong cảnh, đổi hệ số trước khi skin (rẻ); tính theo đỉnh đầu không mũ hay dáng khom của concept sẽ cho hệ số khác.
- **`attack` tay không**: giáo là vật rời nên đòn đâm hai tay phải làm clip riêng sau; tạm dùng đấm để Hodling có đủ bộ 6 clip bắt buộc.

## Kết quả R2–R5 (2026-10-21, sau G1) — chờ G2

Chi tiết và bằng chứng: [`qa_report.md`](qa_report.md), [`validation.json`](validation.json), ảnh [`qa/`](qa/) (`A2_*_v4.jpg`), nguồn [`D01_hodling_rig.blend`](D01_hodling_rig.blend). **Opus review kỹ thuật vòng 2 PASS; G2 chưa duyệt.** Bản v4 đã sửa trọng số đầu/cổ rò vào túi và kiểm chứng điều khiển khố tránh đùi; bản v3 giữ để đối chiếu.

| Mục brief | Thực tế đã dựng và đo |
| --- | --- |
| Hệ số scale | 0,679495687 (đúng mặc định G1); chiều cao = 0,5 m (lệch 0%) |
| Bone | 35 runtime (22 lõi + 5 phụ + 8 socket), **25 có trọng số**, 10 không trọng số = 8 socket + `root`, `cog`; rig điều khiển riêng 45 bone `ctl_*` |
| Clavicle | **không thêm** (vai đạt ở mức xem ảnh; còn giãn da vai tới 23 mm ở hai tay vắt chéo, xem `qa_report.md` 5.2) |
| Trục | đã xác minh trên mesh: mặt −Y Blender (= +Z glTF), trái quái = +X |
| Khác với suy đoán ban đầu | hai chân lệch +0,0105 m theo X so với tâm thân; tai phải không đối xứng với tai trái (cao hơn, lùi ra sau hơn) nên đo riêng |
| Ngón | không bone, ngón cứng theo bàn tay |
| IK | chân + tay dùng được, có pole và control gót/mũi/bóng; bản v4 kiểm 20/20 phép thử chức năng, A1 14/14 và hai kiểm tra sửa lỗi đạt |

Bone phụ `sack`, `loincloth_front`, `L_ear`, `R_ear` đã thêm vào `SKELETON_STANDARD.md` mục 3; ngoại lệ giữ tổ tiên cấu trúc ở mục 7.

## Chỉ tiêu qua cổng

- G2: các mục A1, A2 của `QA_CHECKLIST.md`, cộng các vùng khó ở trên (mũ, tai, túi, khố, tay, bàn chân).
- G3: các mục B1, B2.
- G4: các mục C.

## Duyệt

| Cổng | Ngày | Kết quả | Người duyệt | Ghi chú |
| --- | --- | --- | --- | --- |
| G1 (brief) | 2026-10-21 | **PASS (người dùng duyệt)** | người dùng (trả lời "duyệt" sau khi xem brief) | Duyệt toàn bộ mặc định ở mục "Mặc định đề xuất cho G1" (0,5 m = điểm cao nhất mesh, route M + KayKit, không ngón, helmet/sack/loincloth_front/L_ear/R_ear, không clavicle mặc định, attack tay không, 24 fps). Opus review kỹ thuật round 2 PASS trước đó (không phải duyệt người dùng). Cho phép chạy liền R2–R5 tới G2; không R6 trước G2 |
| G2 (rig) | 2026-10-21 | **PASS (người dùng duyệt)** | người dùng (trả lời "duyệt") | rig v4 (`rig/D01_hodling_rig.blend` sha256 `bf6c53dc…0bcb`), bản chụp trước khi làm clip ở `rig/_snapshots/g2_approved/`. Cho phép R6–R7; không cho phép R8 trở đi |
| G3 (clip) | | **chờ** | | R6–R7 xong 2026-10-21 (Sonnet), `rig/anim/R7_report.md`; sáu Action `experiment`, chưa Opus review, chưa duyệt |
| G4 (trong lab) | | | | |
| R9 (tích hợp engine, nếu có) | | | | |

## Kết quả R6–R7 (2026-10-21) — chờ G3

Sáu Action trên rig G2 (không đổi): `rig/D01_hodling_rig_anim.blend`. Khác kế hoạch ở bảng clip: `idle` dùng KayKit `Idle` (không phải `Unarmed_Idle`, tư thế đấm bốc), 48 khoảng (2,0 s); `walk` 26 khoảng (1,0833 s), `run` 18, `attack` 18 (hit offset 8), `hit` 11, `death` 30 (Death_A kéo 1,5625×). Trượt/tiếp xúc/hit/khố đo thật: xem `anim/R7_report.md`. Điều chỉnh khác nguồn (biên độ idle/hit ×1,8, nâng chân walk ×0,65, chậu attack/hit ×0,45), điều còn tồn tại (khố xuyên đùi ở death, walk nhấc gót vàng, R8 chưa làm, GUI/lab chưa thời gian thực bởi người) đều ở đó.
