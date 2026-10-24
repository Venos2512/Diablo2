# Quy trình rigging và animation — hero, quái, NPC của ASHLAR

Áp dụng cho model 3D trong [`ashlar/3d/`](../README.md) (`heroes/`, `monsters/`, sau này `npcs/`). Điểm vào là GLB gốc từ Tripo
([`ashlar/pipeline/tripo/Agent.md`](../../pipeline/tripo/Agent.md)); điểm ra là GLB có skeleton, skin và clip dùng
được trong lab ([`lookdev-lab/src/character/`](../../../lookdev-lab/src/character/)) và game.

Tài liệu đi kèm:

| File | Dùng khi |
| --- | --- |
| [`SKELETON_STANDARD.md`](SKELETON_STANDARD.md) | đặt tên bone, đơn vị, trục, socket, bộ clip tối thiểu theo họ skeleton |
| [`QA_CHECKLIST.md`](QA_CHECKLIST.md) | kiểm tra rig và clip trước mỗi điểm duyệt |
| [`ANIMATION_INVENTORY.md`](ANIMATION_INVENTORY.md) | bảng kiểm kê từng asset: họ skeleton, route, clip đã có, trạng thái |
| [`templates/rig_brief.md`](templates/rig_brief.md) | mẫu brief, chép vào `<asset_dir>/rig/` cho mỗi asset |
| [`.agents/skills/blender-game-animation/`](../../../.agents/skills/blender-game-animation/SKILL.md) | skill của dự án: cách làm trong Blender (rig, skin, chuyển động, bake, xuất, reimport). **Bắt buộc đọc** trước R2 |
| [`.agents/skills/game-animation-integration/`](../../../.agents/skills/game-animation-integration/SKILL.md) | skill nối clip đã duyệt vào hệ di chuyển và chiến đấu của game (bước R9) |

**Vai trò của skill.** `blender-game-animation` quy định *cách làm* trong Blender; tài liệu này quy định *khuôn khổ dự án*: họ
skeleton, tên bone, cổng duyệt, đường dẫn file, kiểm kê. Khi hai bên cùng nói một việc, làm theo cả hai; nếu mâu thuẫn thì
dừng và báo người dùng. Skill này nằm trong `.agents/skills/` của repo nên đọc trực tiếp file `SKILL.md` (và
`references/engine-handoff.md`); không gọi được bằng công cụ Skill của phiên.

Trạng thái: **đã duyệt khung quy trình (2026-10-21)**. Chưa chạy thử theo quy trình này; các con số, tên bone và ngưỡng đánh dấu
*(đề xuất)* là giá trị khởi điểm, chốt lại sau asset đầu tiên đi hết quy trình. Các điểm mở còn lại ở mục 9.

## 0. Nguyên tắc

1. **Rig và animation là việc riêng, hỏi trước.** Theo `../../pipeline/tripo/Agent.md`, không tự thêm bước tốn credit (rig, animate trên
   Tripo) khi người dùng chưa yêu cầu cho asset đó. Trước khi tiêu credit phải nêu ước tính (xem mục 3, cổng G1).
2. **GLB gốc của Tripo không bị sửa.** Mọi thứ của rig nằm trong `<asset_dir>/rig/`. Bản cho lab hoặc game do script sinh ra.
3. **Một họ skeleton cho nhiều asset**, không rig riêng từng con. Có 99 quái thường và 17 boss trong danh sách ASHLAR
   ([`docs/ASHLAR_MONSTER_CHECKLIST_VI.md`](../../docs/ASHLAR_MONSTER_CHECKLIST_VI.md)); rig từng con riêng là không khả thi. Quái cùng họ dùng
   chung tên bone và bộ clip, khác nhau ở mesh, màu, VFX.
4. **Rig đúng kích thước thật.** Tripo chuẩn hoá cạnh dài nhất về 1 m. Scale về chiều cao trong danh mục
   ([`ashlar/3d/README.md`](../README.md): FL ~1,8 m, D01 ~0,5 m) *trước* khi dựng xương.
5. **Tên clip trùng tên state của code.** `lookdev-lab/src/character/clips.js` định nghĩa 13 state (`idle`, `walk`, `run`,
   `attack`, `attack2`, `cast`, `block`, `blockHit`, `hit`, `death`, `revive`, `jump`, `dodge`) và tự gán clip theo tên. Đặt đúng tên
   thì không cần cấu hình tay.
6. **Clip tổng hợp bằng code chỉ để QA, không phải clip để dùng** (như `clips.py` của bản thử Sorceress). Clip thật đến từ
   thư viện retarget, mocap, keyframe tay, hoặc AI sinh rồi chỉnh (mục 6).
7. **Không retarget bằng mắt.** Mọi rig và clip phải qua `QA_CHECKLIST.md` và có ảnh bằng chứng trong `rig/qa/`.
8. **Tách rig điều khiển khỏi skeleton runtime** (theo `blender-game-animation`). Animator làm việc trên rig điều khiển (IK,
   control tiếp xúc, helper); chuyển động được **bake** lên một skeleton runtime riêng, và chỉ skeleton runtime đi vào GLB. Rig
   điều khiển luôn được giữ trong file nguồn `.blend`.
9. **Giữ nguồn có thể sửa và phân biệt trạng thái clip.** Clip đã duyệt không bị ghi đè khi làm bản sửa: bản sửa là Action mới.
   Clip thử nghiệm đánh dấu riêng. Ba loại duyệt tách bạch: duyệt nguồn (G3), kiểm xuất (R8), tích hợp thật trong engine (R9).
   Một FBX/GLB hợp lệ không có nghĩa là sự kiện gameplay hay Animator đã được nối.
10. **Đo bằng giây, không chỉ bằng frame.** `duration = (frame_cuối − frame_đầu) / fps`. Ghi cả frame lẫn giây cho độ dài và
    thời điểm tiếp xúc, trúng đòn. Đổi fps đơn thuần là đổi tốc độ; muốn đổi fps phải resample theo thời gian.

## 1. Phân công

Theo [`Agent.md`](../../../Agent.md) gốc:

**Rule riêng cho rig và animation** (quyết định của người dùng, ghi đè bảng mặc định trong `Agent.md` gốc cho các bước này):

| Việc | Model | Provider T3 | Model ID |
| --- | --- | --- | --- |
| **Rigging**: R2 dựng skeleton, R3 skin, R4 kiểm tự động, R5 ảnh QA | Opus 5.5 | `claudeAgent` | `claude-opus-5-5` |
| **Animation**: R6 làm clip, R7 kiểm clip, R8 bake / xuất / reimport | Opus 5.5 | `claudeAgent` | `claude-opus-5-5` |

Các việc còn lại giữ như `Agent.md` gốc:

| Việc | Model |
| --- | --- |
| Viết và sửa script Blender / Python dùng chung của quy trình (công cụ, không phải việc rig hay clip của một asset) | Sonnet 5.5 |
| Research công cụ, nguồn clip, giấy phép | Haiku 5.5 |
| Ảnh (T-pose, bổ sung góc nhìn để upload Tripo) | Astra |

Cách áp dụng:
- Phân việc theo bước, không theo asset: rig (R2–R5) và animation (R6–R8) là hai phiên Opus riêng; phiên animation nhận bàn giao
  ở R6. Mỗi lần bàn giao kèm `rig_brief.md`, file `.blend` hiện tại, `validation.json` và ảnh QA, để phiên sau không phải dựng lại
  ngữ cảnh.
- Phiên rig không sửa clip; phiên animation không sửa skeleton hay skin. Nếu phiên animation phát hiện lỗi rig khi làm clip (khớp
  gập xấu, trọng số lệch, IK sụp do skin), nó ghi findings (vị trí, vấn đề, tác động) và trả về phiên rig sửa, rồi chạy lại R4–R5.
  Rig đã qua G2 mà phải sửa thì báo người dùng, vì clip đã làm có thể phải làm lại.
- Cổng duyệt G1–G4 vẫn là người dùng duyệt. Model không tự qua cổng.
- Kiểm tra model/provider khả dụng bằng `orchestrator_capabilities` trước khi giao việc; nếu Opus 5.5 không khả dụng thì báo và
  xin lựa chọn thay thế, không âm thầm đổi model. Không giao rig, clip hay script cho Codex: Codex chỉ làm ảnh.

Vì Opus 5.5 làm cả rig lẫn animation, vòng review bắt buộc của `Agent.md` gốc (Opus review sau Sonnet) không còn là một lượt độc
lập cho phần Opus làm. Đã chốt (mục 9 điểm 7): script dùng chung do Sonnet viết đi qua vòng review Opus của `Agent.md` gốc; rig của
Opus do người dùng duyệt ở G2, clip ở G3, kèm kiểm tự động.

Review tuân thủ ghi chú của người dùng: bản dựng cho xem trước, review hẹp và có giới hạn thời gian, không để review chặn người
dùng. Duyệt rig và clip về mặt thẩm mỹ là việc của người dùng (cổng G2, G3).

## 2. Phân loại asset (R0)

Mỗi asset thuộc đúng một **họ skeleton** (chi tiết ở `SKELETON_STANDARD.md`):

| Mã | Họ | Ví dụ |
| --- | --- | --- |
| H | Humanoid người lớn | hero FL, người, xác sống dáng người |
| S | Humanoid nhỏ | D01 Hodling (~0,5 m) |
| Q | Bốn chân | thú, sói, nai |
| W | Có cánh | chim, dơi, quái bay |
| A | Nhiều chân | nhện, bọ |
| L | Không chân, thân dài | rắn, giun |
| F | Lơ lửng | ma, hồn, quái không chạm đất |
| O | Vật thể / bẫy / tổ | tổ, bẫy, cửa quái |
| N | Không rig | prop tĩnh, đồ rải nền |

Họ H và S có cùng topology bone (S là tỉ lệ khác), dùng chung bộ clip sau khi scale. Họ O chỉ cần vài bone và trạng thái
riêng (đóng/mở/kích hoạt), không phải bộ đi/đánh.

Điều kiện đầu vào của GLB gốc, kiểm trước khi lên kế hoạch:
- 1 mesh, texture đủ (GLB dưới 1 MB là chưa có texture: quay lại Agent.md của Tripo).
- T-pose hoặc A-pose; tay không dính thân, chân tách nhau. Hero FL còn lỗi "ngón tay dính thành khối", ghi vào brief để quyết
  định có gom bone ngón không.
- Số tam giác và chiều cao thật lấy từ danh mục.

## 3. Các bước và cổng duyệt

```text
R0 phân loại → R1 rig brief ──G1──▶ R2 dựng rig → R3 skin → R4 kiểm tự động → R5 ảnh QA ──G2──▶
R6 clip (rig điều khiển) → R7 kiểm clip ──G3──▶ R8 bake + xuất + reimport sạch, đăng ký ──G4 (xem trong lab)
                                                  └─▶ R9 tích hợp vào game (chỉ khi được yêu cầu)
```

Giữa G1 và G2, và giữa G2 và G3, chạy liền không hỏi lại trừ khi script lỗi hoặc mesh hỏng.

### R1 — Rig brief  →  cổng G1

Chép `templates/rig_brief.md` vào `<asset_dir>/rig/rig_brief.md`, điền: họ skeleton, route (mục 4), danh sách clip theo bộ tối
thiểu của họ, nguồn từng clip, bone phụ cần giữ (áo choàng, tóc, váy, xích), socket vũ khí, vật phụ kèm theo. Nêu **ước tính
credit** nếu route dùng dịch vụ trả phí (đo trên asset đầu tiên rồi ghi vào đây; hiện chưa có số liệu).

**G1: người dùng duyệt brief** trước khi tiêu credit hoặc thời gian dựng.

### R2 — Dựng skeleton

Trước khi sửa bất cứ gì, nếu đang tiếp tục file của người khác (như bản thử Sorceress), **kiểm kê** rig, Action, slot, constraint,
media tham chiếu và cài đặt xuất; giữ một bản sao nguồn (`skill`: *Build an editable animation project… inspect existing work
before changing it*).

Theo route đã chọn (mục 4). Kết quả:
- armature gắn vào mesh đã scale đúng chiều cao, tên bone đúng `SKELETON_STANDARD.md`;
- đặt khớp theo giải phẫu, có roll và hướng gập ổn định; vị trí toàn cục (`root`, `cog`) tách khỏi chuyển động cục bộ của thân;
- **hai lớp**: *rig điều khiển* (IK, control tiếp xúc chân và tay, helper) và *skeleton runtime* (chỉ bone deform và socket) mà
  clip sẽ được bake lên ở R8. Với route T/A, skeleton do route sinh ra có thể là chính skeleton runtime; rig điều khiển dựng
  chồng lên.

Khi khai báo hướng và đơn vị, ghi rõ trong brief: trục tiến, mét, fps, loop/root-motion, sự kiện gameplay cần có.

### R3 — Skin

Trọng số bằng thuật toán (heat map, khoảng cách, hoặc chuyển từ template) chỉ là điểm xuất phát. Soi: đảo rời, ảnh hưởng của bên
đối diện, vai và hông, các món cứng (giáp, mũ, xích). Chuẩn hoá lại sau khi cắt bớt. Giới hạn tối đa 4 ảnh hưởng mỗi đỉnh (chuẩn
glTF; tuân theo giới hạn của engine đích), tổng trọng số bằng 1. Vùng cần soi kỹ: vai, nách, hông, khuỷu, đầu gối, bàn tay, vùng
áo choàng và váy dính vào chân.

**Thử cực trị khớp trước khi làm bộ clip.** Nếu IK sụp, trước hết xem lại mục tiêu và tầm với; đó có thể không phải lỗi trọng số.
Việc cắt hoặc chuẩn hoá trọng số cho giới hạn engine làm trên *bản runtime*, không sửa âm thầm skin nguồn đã duyệt.

### R4 — Kiểm tự động

Chạy script kiểm tra (mục 7) và ghi `rig/validation.json`. Các phép kiểm bắt buộc nằm ở `QA_CHECKLIST.md` mục A. Có lỗi thì sửa,
không sang R5.

### R5 — Ảnh QA  →  cổng G2

Sinh bộ ảnh ghép trong `rig/qa/`: skeleton chồng lên mesh (trước, bên, sau), bản đồ trọng số, các tư thế thử (tay giơ, ngồi xổm,
bước dài, xoay thân), xem ở ba góc. **G2: người dùng duyệt rig** trên ảnh và, nếu muốn, trong lab. Duyệt xong mới làm clip, vì
đổi rig sau khi có clip là làm lại.

### R6 — Clip

Nguồn clip theo thứ tự ưu tiên (ghi vào brief từng clip):

1. **Retarget từ thư viện** (CC0 hoặc giấy phép dùng được): Quaternius Universal Animation Library, KayKit (đã dùng trong
   lab, xem `prepare-kaykit.py`). Dùng cho họ H và S. Cần khớp bộ bone chuẩn.
2. **Retarget từ bộ clip của một asset đã làm xong** cùng họ (hero → quái người) sau khi scale.
3. **Keyframe tay** trong Blender hoặc Cascadeur (tùy chọn) cho động tác đặc thù: đánh, phép, chết.
4. **AI sinh chuyển động** (MDM và tương tự): chỉ thử nghiệm. Kết quả phải qua bước chỉnh tay, kiểm trượt chân và khớp tỉ lệ
   trước khi vào bộ clip chính. Chưa có pipeline đã kiểm chứng (xem mục 9).

Thứ tự dựng một clip (theo skill): **khoá trước** thay đổi điểm tựa, tiếp xúc, thời điểm trúng đòn và hồi phục; sau đó mới thêm
chuyển động phụ (nén thân, phản ứng đầu, follow-through, đuôi, áo choàng). Khi một khung trông hỏng, kiểm khung lân cận, nội suy,
constraint và phạm vi phát trước khi thêm key. Tiếp xúc chân với sàn đánh giá bằng **hình học đế giày sau biến dạng**, không chỉ
bằng vị trí bone. Đọc được từ camera game và hồi phục nhanh quan trọng hơn một đoạn anticipation dài trang trí. Giữ nguyên thời
điểm sự kiện gameplay đã duyệt khi làm bản sửa.

Nếu clip dựng từ video tham chiếu: so cùng một sự kiện giữa video và Blender, soi cả các góc video không có. Chuyển động dựng lại
từ camera đơn là *suy ra*, không phải mocap đo được; ghi như vậy trong `clips.json`.

Quy tắc cho mọi clip:
- Mỗi Action có **phạm vi và fps tường minh**, gắn đúng Action và slot với đúng rig. Khoảng phát của scene, preview và NLA kiểm
  riêng; nếu nhiều rig chung scene, quyền sở hữu khoảng phát gồm rig, Action, slot và metadata clip. Tắt tự đổi khoảng phát khi
  người dùng đang tạo pose.
- Tên clip là id state (`walk`, `attack`...) hoặc `<stance>_<state>` (`2h_attack`, `spell_cast`), stance lấy từ `STANCES` trong
  `clips.js`.
- Walk, run, idle là **vòng lặp kín**: frame đầu và cuối cùng pose, không giật khi quay vòng.
- Walk và run **tại chỗ (in-place)**, không root motion. Ghi độ dài sải (`stride_m`) vào inventory để lab đặt tốc độ và đo trượt
  chân. Tốc độ tự nhiên của clip là số đo của bàn chân, không phải con số thiết kế.
- Đòn đánh có điểm trúng ở khoảng 40–50% độ dài clip (lab đặt `hitAt` 0,45 cho attack/attack2, 0,5 cho cast). Chỉnh clip cho
  khớp, hoặc ghi giá trị khác vào inventory để đặt lại trong lab.
- Death dừng ở pose cuối (không loop). Revive là chiều ngược lại hoặc clip riêng.
- 24 fps *(đề xuất, khớp bản thử đã có)*. Cắt keyframe thừa, không bake mọi frame nếu không cần.
- Vũ khí là mesh riêng gắn vào socket (`R_weapon_attach`, `L_weapon_attach`), không phải một phần mesh thân. Clip không được
  phụ thuộc vào vũ khí cụ thể cho cùng một stance.

### R7 — Kiểm clip  →  cổng G3

Mỗi clip ra dải ảnh (strip) theo `QA_CHECKLIST.md` mục B và được thử trong lab (tab Character): đúng state, vòng lặp kín, trượt
chân ở mức xanh hoặc vàng, điểm trúng khớp. Kiểm thêm theo skill: **mở lại file sau khi lưu**, chuyển Action và bấm Play thường (cảnh
review không thay thế bước này); file nguồn lưu một viewport có texture đọc được. **G3: người dùng duyệt chuyển động**
(duyệt nguồn, chưa phải duyệt bản xuất).

### R8 — Bake, xuất, reimport sạch  →  G4

1. **Bake** chuyển động đã đánh giá từ rig điều khiển lên skeleton runtime. Giữ nguyên rig điều khiển trong `.blend`.
2. **Xuất** mesh, bone runtime và clip; loại helper, cảnh không liên quan và Action thư viện đang tắt. Bản gốc rig:
   `<asset_dir>/<asset_id>_rig.glb` (cùng 3 map 4096 như GLB Tripo, khoảng 20 MB). Nếu model và clip là file riêng: các
   skeleton phải **cùng bind basis**; clip xuất từ rig đang bị posed có thể import không lỗi mà điều khiển model sai. So pose đã
   đánh giá trên model thật, gồm khung đầu và các tiếp xúc; nếu exporter cần hình học bind thì mỗi file clip kèm cùng mesh skin bind.
3. **Bản lab/game** do script sinh: texture 2048, đúng kích thước thật, bỏ bone không có trọng số nếu họ cho phép (mục 7 của
   `SKELETON_STANDARD.md`), đăng ký trong `lookdev-lab/src/assets/samples.json` (trường `source` trỏ về `ashlar/3d/`). Không chép
   GLB gốc vào lab. Đường dẫn texture tương đối, một bộ texture được tài liệu hoá.
4. **Reimport sạch:** chép toàn bộ bản giao sang thư mục mới, import vào scene trống, kiểm số bone, skin, texture, độ dài và các
   pose lấy mẫu trong cùng một hệ toạ độ. So hình học nguồn và bản reimport với ngưỡng phù hợp tỉ lệ đích (ghi ngưỡng); bỏ qua
   các đỉnh nhân đôi ở đường nối UV/normal, và đừng so theo chỉ số đỉnh thô. Sửa mesh vĩnh viễn phải kiểm trên *mọi* Action bị
   ảnh hưởng, không chỉ một pose.
5. Ghi **manifest** `rig/anim/clips.json` (mục 5) và cập nhật cột "Bản trong lab" ở `ashlar/3d/README.md` cùng dòng của asset trong
   `ANIMATION_INVENTORY.md`.
6. **G4**: người dùng xem asset trong lab và xác nhận. Đây là duyệt *bản xuất*; chưa phải tích hợp engine.

### R9 — Tích hợp vào game (chỉ khi người dùng yêu cầu)

Chuyển manifest và bằng chứng cho `game-animation-integration`: hệ nào sở hữu dịch chuyển và yaw, chuyển tiếp pose, thời điểm sự
kiện, ngắt giữa chừng. Tôn trọng tốc độ xoay, thời điểm sự kiện và luật điều khiển thật của dự án; giá trị chưa biết ghi là *chưa
giải quyết*, không bịa mặc định chung. Giữ tách biệt hướng điều hướng, yaw của clip và chỉnh hướng trước của model để không áp dụng
một phép xoay hai lần.

## 4. Ba route dựng skeleton

Chọn một cho mỗi asset, ghi trong brief. Có thể đổi route nếu route đầu không qua G2.

| Route | Cách làm | Hợp với | Điểm yếu |
| --- | --- | --- | --- |
| **T — chuyển từ skeleton mẫu** | Lấy một skeleton đã có (tên bone, phân cấp, trục), đặt khớp lên mesh theo landmark, skin lại | Họ H, S khi cần bộ bone phong phú và tương thích clip có sẵn | Phụ thuộc skeleton mẫu và giấy phép của nó; nhiều bone không dùng |
| **A — auto-rig** | Dịch vụ hoặc model tự rig: Tripo (`rig_model`, `animate_prerigcheck`, `retarget_animation`), UniRig chạy máy, Meshy Animate | Quái lạ (họ Q, W, A, L) cần ra rig nhanh | Tốn credit (Tripo, Meshy), cần kiểm tra kỹ skin, tên bone không chuẩn nên phải đặt lại tên |
| **M — rig tay trong Blender** | Dựng armature, đặt bone, gán trọng số bằng heat map rồi chỉnh | Họ O, F, L, và bất cứ thứ gì route T/A cho kết quả xấu | Chậm, cần người rành |

**Route T đã có bản thử** trong repo: `ashlar/3d/heroes/FL_flagellant/vA/rig_sorceress/` (một thread khác dựng
ngày 2026-10-21). Đây là cách làm tham chiếu, chưa phải kết quả đã duyệt:
- Lấy skeleton D2R Sorceress (181 bone) làm mẫu, đặt lên mesh FL bằng `rig_fit.py`, skin bằng `skin.py`, xuất GLB bằng
  `build_rig.py`.
- `validate_rig.py` kiểm GLB đầu ra (tên và phân cấp bone khớp mẫu, 4 ảnh hưởng tối đa, trọng số cộng bằng 1, ma trận bind khớp
  phân cấp, texture không đổi). Bốn script `qa_*.py` sinh ảnh QA.
- Chỉ 68 trong 181 bone có trọng số (phần còn lại là mặt, tóc, váy, helper); đó là lý do mục 7 của skeleton standard cho phép
  loại bone trong bản game.
- `clips.py` là clip tổng hợp để chứng minh rig biến dạng đúng, không phải clip dùng được.
- `run_all.ps1` chạy cả chuỗi bằng Blender tại `E:\SteamLibrary\steamapps\common\Blender\blender.exe`.
- Đường dẫn đầu vào trong script trỏ vào thư mục attachments của T3, phải đổi thành tham số hoặc đường dẫn repo trước khi dùng
  làm công cụ chung.

Đề xuất sau khi duyệt tài liệu này: gom phần dùng chung (`rig_fit`, `skin`, `validate_rig`, `qa_*`) sang
`ashlar/3d/rig-anim/tools/` và tham số hoá đầu vào. Việc này sẽ động vào thư mục của thread khác nên cần người dùng cho phép
và kiểm `git status` trước.

## 5. Cấu trúc thư mục một asset sau khi rig

```text
ashlar/3d/<act>/<loại>/<ID>/      (hero: ashlar/3d/heroes/<ID>/vA/)
├─ <asset_id>.glb              GLB gốc Tripo (không sửa)
├─ <asset_id>_rig.glb          GLB có skeleton + skin (4096)
├─ rig/
│  ├─ rig_brief.md             brief đã duyệt ở G1
│  ├─ <asset_id>_rig.blend     file nguồn: mesh + rig điều khiển + skeleton runtime + Action (đã duyệt / thử nghiệm)
│  ├─ validation.json          kết quả R4
│  ├─ rig.log                  route, công cụ, credit (nếu có), ngày, ai duyệt
│  ├─ qa/                      ảnh ghép R5 và R7
│  └─ anim/
│     ├─ clips.json            manifest (xem dưới)
│     ├─ refs/                 video / ảnh tham chiếu và đường dẫn nguồn
│     └─ <state>.glb           (tuỳ chọn) từng clip riêng nếu tách file
└─ _work/                     file phụ: _tasks/, _rejected/, _v*/ (bản trước, giữ để đối chiếu), tripo.log, tpose.log
```

**Manifest `clips.json`** (mỗi clip), theo `blender-game-animation` và `references/engine-handoff.md`:

| Trường | Ý nghĩa |
| --- | --- |
| `name`, `state`, `stance` | tên clip và state/stance của `clips.js` |
| `status` | `approved` · `experiment` · `revision_of:<tên>` |
| `source`, `license` | thư viện / tự làm / AI; giấy phép |
| `derived_from` | video hoặc clip gốc; ghi "suy ra từ camera đơn" nếu dựng từ video |
| `frame_start`, `frame_end`, `fps`, `sample_count` | phạm vi nguồn và phạm vi xuất; không suy `sample_count` từ độ dài đã làm tròn |
| `duration_s` | `(frame_end − frame_start) / fps` |
| `loop` | true/false; kiểm đường nối |
| `root_displacement` | dịch chuyển gốc (m), `stride_m` cho walk/run |
| `contacts_s` | thời điểm tiếp xúc chân (giây và frame) |
| `events` | `hit`, `footstep`, `fx`…: giây và frame; giữ nguyên thời điểm đã duyệt khi sửa bản |
| `bone_mapping` | ánh xạ từ nguồn/retarget sang skeleton runtime |
| `textures` | một bộ texture, đường dẫn tương đối |
| `tolerance` | ngưỡng so hình học khi reimport |
| `approved` | `{source: G3, export: R8, engine: R9}`: ngày và người duyệt; chưa duyệt để `null` |

## 6. Nguồn clip và giấy phép

| Nguồn | Giấy phép | Ghi chú |
| --- | --- | --- |
| Quaternius Universal Animation Library | CC0 | một rig humanoid chung cho Unity, Unreal, Godot |
| KayKit Adventurers | CC0 | đã dùng trong lab |
| Mixamo | điều khoản Adobe, chỉ humanoid, đang ở chế độ bảo trì | dùng được cho prototype; kiểm điều khoản trước khi phát hành |
| Skeleton và clip của D2R | tài sản của Blizzard | chỉ dùng nội bộ để dựng lookdev; **không đưa vào bản phát hành** khi chưa xử lý giấy phép (xem mục 9) |
| Clip AI sinh | tuỳ model và dữ liệu huấn luyện | ghi rõ model, bản và điều khoản vào `rig.log` |

Mọi clip dùng phải có dòng nguồn và giấy phép trong `anim/clips.json`.

## 7. Công cụ và cách chạy

- Skill `blender-game-animation` (`.agents/skills/`): đọc trước khi dựng hay sửa file Blender. Skill nói rõ đây là quy trình sản
  xuất, không phải script rig một lần bấm; mọi bước vẫn cần kiểm chứng như các cổng ở trên.
- Blender chạy nền: `blender -b --factory-startup -P <script>.py -- <tham số>`. Đường dẫn trên máy này:
  `E:\SteamLibrary\steamapps\common\Blender\blender.exe`.
- Python phụ trợ chạy với `python -I`, và script đặt ở thư mục khác thư mục chứa dữ liệu đầu vào.
- Tripo MCP (`rig_model`, `animate_prerigcheck`, `retarget_animation`): server đã khai báo nhưng phiên 2026-10-21 báo lỗi kết nối
  (timeout). Cần kiểm lại trước khi dùng route A với Tripo.
- Không có công cụ nào ở đây được kiểm chứng cho quái không phải người. Asset đầu tiên của mỗi họ Q/W/A/L là phép thử, ghi kết
  quả vào mục "Ghi chú từng lần chạy" cuối file này.

## 8. Điều không làm

- Không rig asset mà người dùng chưa yêu cầu rig, kể cả khi đã có T-pose đẹp.
- Không sửa GLB gốc Tripo, không chép GLB 4096 vào lab.
- Không dùng clip tổng hợp bằng code làm clip thật.
- Không ghi đè Action đã duyệt khi làm bản sửa; không sửa âm thầm skin nguồn đã duyệt để qua một bài kiểm xuất.
- Không tuyên bố một clip "đã tích hợp" chỉ vì GLB/FBX hợp lệ; sự kiện gameplay và Animator phải được nối và thử thật (R9).
- Không đổi fps bằng cách đặt lại số, phải resample theo thời gian.
- Không đổi tên bone chuẩn giữa chừng. Cần đổi thì cập nhật `SKELETON_STANDARD.md` và làm lại các asset cùng họ.
- Không tuyên bố hoàn thành khi chưa qua G2, G3, G4 hoặc khi `QA_CHECKLIST.md` còn mục đỏ.

## 9. Điểm mở

Người dùng đã duyệt khung quy trình ngày 2026-10-21, kèm các đề xuất ở điểm 1, 5, 6, 7, 8 (được hiểu là chấp nhận). Điểm 2, 3, 4
chưa có đề xuất cụ thể nên **chưa chốt**; chốt ở cổng G1 của asset đầu tiên.

1. **Skeleton mẫu của route T.** *(Đề xuất đã duyệt.)* D2R Sorceress là tài sản của Blizzard. Dùng nội bộ để dựng lookdev thì thuận tiện (tên bone và
   clip D2R khớp `clips.js`), nhưng bản phát hành cần skeleton riêng hoặc xử lý giấy phép. Đề nghị: dùng cho giai đoạn lookdev,
   song song chuẩn hoá một bộ bone riêng (`SKELETON_STANDARD.md`) để chuyển sang khi cần.
2. **Công cụ mặc định cho route A** *(chưa chốt)*: Tripo, UniRig hay Meshy. UniRig miễn credit và chạy máy, nhưng theo trang Hugging Face bản
   công bố ban đầu chỉ có dự đoán skeleton, phần skinning phát hành sau (cần kiểm trạng thái hiện tại).
3. **Nguồn clip cho họ H/S** *(chưa chốt)*: thư viện CC0, hay làm riêng cho từng hero.
4. **AI sinh chuyển động** *(chưa chốt)*: có thử không, và nếu có thì trên asset nào.
5. **Phạm vi đầu tiên** *(đã duyệt)*: chỉ hero FL (họ H, đã có bản thử) và D01 Hodling (họ S) để kiểm quy trình trước khi làm 99
   quái.
6. **Số bone và ngưỡng** trong `SKELETON_STANDARD.md` mục 7, **fps 24**, **điểm trúng 40–50%**. *(Đã duyệt làm giá trị khởi điểm,
   chốt lại sau asset đầu tiên.)*
7. **Review chéo** *(đã duyệt, sửa 2026-10-21)*: Sonnet 5.5 viết script dùng chung, Opus 5.5 review theo vòng của `Agent.md` gốc
   (trước đây là Astra; người dùng đã quyết định Codex chỉ làm ảnh). Rig của Opus do người dùng duyệt ở G2; clip ở G3, kèm kiểm tự
   động `QA_CHECKLIST.md` mục B1.
8. **R8 (bake, xuất, reimport)** *(đã duyệt)*: Opus làm, vì gắn trực tiếp với clip.

## Ghi chú từng lần chạy

*(Trống. Ghi sau mỗi asset: ngày, asset, route, kết quả từng cổng, thời gian, credit, vấn đề gặp và cách xử lý.)*

## Lịch sử

- 2026-10-21: tạo bản đề xuất.
- 2026-10-21: thêm skill `blender-game-animation`, rule phân công (Astra rig, Opus animation).
- 2026-10-21: người dùng duyệt khung quy trình. Còn mở: công cụ auto-rig, nguồn clip, AI sinh chuyển động.
- 2026-10-21: người dùng chuyển rigging từ Astra sang Claude (Opus 5.5, phiên riêng với animation) và quyết định Codex chỉ làm ảnh;
  script dùng chung nay do Opus review thay cho Astra.
