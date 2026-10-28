# ASHLAR — model 3D

Mọi model 3D của game ASHLAR nằm ở đây: hero, quái, prop. Mỗi asset một thư mục, gồm GLB gốc từ Tripo và các file làm ra nó
(concept, T-pose, log). Model không thuộc ASHLAR (Blood Moor: đồ trại, nature, early kits) nằm ở `legacy/tripo-models/`
(`camp/`, `nature/`, `early_kits/`, `rock_01/`); `ashlar/pipeline/tripo/` chỉ còn `Agent.md` và `scripts/`.

Quy trình dựng bằng Tripo: [`ashlar/pipeline/tripo/Agent.md`](../pipeline/tripo/Agent.md). Ảnh đầu vào theo
[`ashlar/art-direction/artdirection.md`](../art-direction/artdirection.md). Rig và animation (skeleton, clip, QA, kiểm kê):
[`rig-anim/Agent.md`](rig-anim/Agent.md).

## Cấu trúc

```text
ashlar/3d/                        cùng đường dẫn với ashlar/art/ (một asset: art/<act>/<loại>/<ID> <-> 3d/<act>/<loại>/<ID>)
├─ README.md                      quy ước và danh mục (file này)
├─ act-01/                        Act I (act-02, ... thêm khi có model)
│  ├─ monsters/<ID>/              quái; vũ khí của quái ở monsters/<ID>/weapons/<món>/; monsters/_review/ ảnh duyệt cả lô
│  ├─ environments/<nhóm>/<vật>/  prop môi trường; <nhóm> là thư mục nhóm concept 2D (A01_lychgate_village, ...)
│  └─ _batches/<lô>/              hạ tầng một lô dựng: kit_v1, extras_v1 (manifest, prompts, textures, logs, rows, _review)
├─ heroes/<ID>/<vX>/              hero chơi được (vA, vB); vũ khí ở <vX>/weapons/<món>/; heroes/_hands_v1/ = tay màn chọn nghề
├─ common/<lô>/<vật>/             prop dùng chung, không thuộc act nào (dungeon_v1, clutter_v1)
└─ rig-anim/                      quy trình rig và animation, chuẩn skeleton, QA, kiểm kê clip
```

Bảng tra 2D và 3D cạnh nhau: `ashlar/INDEX.md` (sinh bằng `ashlar/pipeline/index/build_index.py`).
Nhóm mới (`npcs/`) tạo khi có model đầu tiên, cùng đường dẫn với `ashlar/art/npcs/<ID>/`.

## Trong thư mục một asset

Hero và quái (Tripo multi-view, bốn góc T-pose):

| File | Nội dung |
| --- | --- |
| `concept.png` | concept gốc |
| `brief.md`, `design.txt` | ghi chú đọc concept; `design.txt` là bản canon cho skill T-pose |
| `tpose_front_back.png`, `tpose_sides.png`, `views/` | ảnh T-pose của Astra và bốn góc đã tách để upload |
| `<asset_id>.glb` | GLB gốc xuất từ Tripo |
| `_shots/` | `variants.png`, `variants.txt`, `final_views.png` (ảnh duyệt cuối) |
| `_work/` | mọi file phụ: `tripo.log`, `tpose.log`, `*.prompt.txt`, `*.log`, `_tasks/` (log phiên Astra), `_rejected/` (ảnh bị loại), `_v*/` (các lượt trước, giữ để đối chiếu). Thư mục asset chỉ giữ thành phẩm |
| `weapons/<món>/` | vũ khí hoặc đồ cầm tay của asset, cùng cấu trúc thư mục này |

Lô prop (Tripo một ảnh mỗi vật):

| File | Nội dung |
| --- | --- |
| `build_manifest.py`, `manifest.json`, `prompts/` | prompt ảnh đầu vào (lô dungeon/clutter ở `common/<lô>/`; lô kit và extras ở `act-01/_batches/<lô>/`, còn từng vật ở `act-01/environments/<nhóm>/<vật>/`) |
| `textures/` | ảnh đầu vào của Astra, hai phương án a/b mỗi vật |
| `logs/`, `run.out` | log tạo ảnh |
| `<vật>/concept.png` | phương án đã chọn |
| `<vật>/<lô>_<vật>.glb` | GLB gốc (tiền tố `dungeon_`, `clutter_`) |
| `<vật>/_shots/`, `<vật>/_work/tripo.log` | ảnh mesh, ảnh bốn góc, credit |

## Quy ước GLB gốc

- Tripo xuất 1 mesh, khoảng 10k tam giác, 3 map 4096² (base color JPEG, metallicRoughness PNG, normal JPEG).
- Tripo chuẩn hoá cạnh dài nhất về 1 m, pivot ở giữa đáy (y thấp nhất = 0), trục Y hướng lên. Kích thước thật ghi ở danh mục;
  bản cho lab hoặc game phải scale lại.
- GLB dưới 1 MB là chưa có texture (lỗi ô ảnh tham chiếu trống, xem mục C của Agent.md).
- Không sửa tay GLB gốc. Bản cho lab hoặc game do script sinh ra: texture 2048, đúng kích thước thật.

## Danh mục

Đo từ JSON chunk của GLB ngày 2026-10-21. Tất cả: 1 mesh, base color + metallicRoughness + normal 4096².

### Hero

| Asset | GLB | Tam giác | Kích thước thật | Bản trong lab | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| [PS Pyre Singer A](heroes/PS_pyre_singer/vA/) | `PS_pyre_singer_vA.glb`, 19,9 MB | 9.858 | chưa chốt; GLB nguồn cao ~1 m | chưa | Concept v5b, Tripo 2026-10-26 (dựng lại từ cùng T-pose `_v2_fix`), variant 2, 3 map 4096²; bản 2026-10-21 ở `_work/_v3_prev_2026-10-21/`. Mesh chưa rig; gậy tách riêng. Lông/gấu áo nhọn và ngón tay còn thô ở cự ly gần; chưa kiểm biến dạng. `_shots/final_views.png`, `glb_validation.json` |
| [FL Flagellant A (cũ)](heroes/FL_flagellant/vA/) | `FL_flagellant_vA.glb`, 20,7 MB | 10.488 | cao ~1,8 m (H) | chưa | **Dựng từ concept cũ (áo dòng), không phải bản v5b đã chốt; bản đúng ở `vA_v5b/`.** GLB 2026-10-20, variant 0. Còn tồn tại: ngón tay dính thành khối, góc RIGHT có 9/10 nút; roi xích và sắt nung chưa dựng. Bản thử rig (skeleton Sorceress D2R, 181 bone, **chờ duyệt G2**, nội bộ không phát hành): `FL_flagellant_vA_rig.glb` 20,8 MB và `rig/` (blend, validation, qa, scripts). Bản gốc thử nay ở `ashlar/3d/heroes/FL_flagellant/vA/rig_sorceress/` |
| [BR Brinecaller B](heroes/BR_brinecaller/vB/) | `BR_brinecaller_vB.glb`, 25,5 MB | 10.152 | chưa chốt; GLB nguồn cao 1 m | chưa | Concept v5b đã chốt, Tripo 2026-10-27, multi-view 4 góc, variant 1 (5900 faces). Thừng vai phải, muối chân phải, bình lưới sau hông phải đều đúng bên. Dải tảo và mép váy hơi nhọn. Chưa rig. `_shots/final_views.png` (render Blender) |
| [EX Exhumer A](heroes/EX_exhumer/vA/) | `EX_exhumer_vA.glb`, 21,4 MB | 10.886 | chưa chốt; GLB nguồn sải tay 1 m, cao 0,96 m | chưa | Concept v5 đã chốt, Tripo 2026-10-27, variant 2 (6313 faces). Đèn ngực trái, ống tên hông trái, đai chéo X sau lưng. Chưa rig. `_shots/final_views.png` |
| [OS Ossuarist A](heroes/OS_ossuarist/vA/) | `OS_ossuarist_vA.glb`, 24,0 MB | 10.212 | chưa chốt; GLB nguồn cao 1 m | chưa | Concept v5 đã chốt, Tripo 2026-10-27, variant 1 (5859 faces). Giáp vai xương trái, đèn hòm hông phải, bó xương hông trái, váy xẻ phải. Chưa rig. `_shots/final_views.png` |
| [PB Pallbearer A](heroes/PB_pallbearer/vA/) | `PB_pallbearer_vA.glb`, 33,7 MB | 11.008 | chưa chốt; GLB nguồn sải tay 1 m, cao 0,95 m (tính cả khung) | chưa | Concept v5b đã chốt, Tripo 2026-10-27, variant 1 (6417 faces). Khung quan tài đeo lưng dựng liền thân (nửa dưới gạch, nửa trên hở), chuông hông phải, đèn và áo choàng bên trái. Khung thấp hơn concept một chút. Chưa rig. `_shots/final_views.png` |
| [FL Flagellant A (v5b)](heroes/FL_flagellant/vA_v5b/) | `FL_flagellant_vA.glb`, 21,0 MB | 10.175 | chưa chốt; GLB nguồn cao 1 m | chưa | **Bản khớp concept v5b đã chốt** (áo choàng ngắn có mũ, corset đỏ, khăn thừng), Tripo 2026-10-27, variant 0 (5840 faces). Dây đỏ cổ tay trái, đèn hai bên hông. Thay cho bản `vA/` cũ dựng từ concept áo dòng. Chưa rig. `_shots/final_views.png` |

### Vũ khí

| Asset | GLB | Tam giác | Kích thước thật | Bản trong lab | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| [PS Pyre Staff A](heroes/PS_pyre_singer/vA/weapons/pyre_staff/) | `PS_pyre_staff_vA.glb`, 18,2 MB | 10.284 | mục tiêu ~1,4H; GLB nguồn cao ~1 m | chưa | Tripo 2026-10-21, variant 0, 3 map 4096²; riêng với hero, chưa rig/socket. Không có hiệu ứng lửa/khói; lồng than và đai quấn hơi thô. `_shots/final_views.png`, `glb_validation.json` |
| [BR brine flask B](heroes/BR_brinecaller/vB/weapons/brine_flask/) | `BR_brine_flask_vB.glb`, 17,5 MB | 10.125 | theo sheet; GLB nguồn 1 m | chưa | 2026-10-27, nhánh một ảnh cắt từ dải vũ khí concept v5b, variant 1 (5603 faces). Bình thủy tinh lưới thừng, quai thừng vòng; lá tảo hơi nhọn. Chưa socket/rig. `_shots/final_views.png` |
| [BR whalebone wand B](heroes/BR_brinecaller/vB/weapons/whalebone_wand/) | `BR_whalebone_wand_vB.glb`, 9,9 MB | 10.593 | theo sheet; GLB nguồn 1 m | chưa | 2026-10-27, một ảnh, variant 0 (6548 faces). Đũa xương cá voi đầu vỏ ốc; Tripo nhân đôi vỏ ốc ở mặt sau (nhìn từ đầu thấy hai vỏ). Chưa socket/rig. `_shots/final_views.png` |
| [EX crossbow A](heroes/EX_exhumer/vA/weapons/crossbow/) | `EX_crossbow_vA.glb`, 22,7 MB | 9.192 | theo sheet; GLB nguồn 1 m | chưa | 2026-10-27, một ảnh (bỏ hai mũi tên rời), variant 0 (5366 faces). Nỏ lên dây bánh răng; dây cung mảnh. Chưa socket/rig. `_shots/final_views.png` |
| [EX grave-spade A](heroes/EX_exhumer/vA/weapons/grave_spade/) | `EX_grave_spade_vA.glb`, 24,1 MB | 9.437 | theo sheet; GLB nguồn 1 m | chưa | 2026-10-27, một ảnh, variant 0 (5076 faces). Xẻng mộ cán dài, lưỡi thép viền đồng. Chưa socket/rig. `_shots/final_views.png` |
| [OS reliquary A](heroes/OS_ossuarist/vA/weapons/reliquary/) | `OS_reliquary_vA.glb`, 27,5 MB | 10.293 | theo sheet; GLB nguồn 1 m | chưa | 2026-10-27, một ảnh, variant 0 (6465 faces). Hòm thánh tích cầm tay, 6 ô linh hồn xanh vẽ màu (không phát sáng); mặt sau là tấm phẳng tối. Chưa socket/rig. `_shots/final_views.png` |
| [OS bone-wand A](heroes/OS_ossuarist/vA/weapons/bone_wand/) | `OS_bone_wand_vA.glb`, 22,5 MB | 10.325 | theo sheet; GLB nguồn 1 m | chưa | 2026-10-27, một ảnh, variant 0 (6211 faces). Gậy xương đầu bàn tay xương; ngón còn thô. Chưa socket/rig. `_shots/final_views.png` |
| [OS sickle A](heroes/OS_ossuarist/vA/weapons/sickle/) | `OS_sickle_vA.glb`, 20,7 MB | 9.942 | theo sheet; GLB nguồn 1 m | chưa | 2026-10-27, một ảnh, variant 0 (5445 faces). Liềm xương, chuôi đen vòng sắt. Chưa socket/rig. `_shots/final_views.png` |
| [PB coffin-lid shield A](heroes/PB_pallbearer/vA/weapons/coffin_shield/) | `PB_coffin_shield_vA.glb`, 24,8 MB | 9.715 | theo sheet; GLB nguồn 1 m | chưa | 2026-10-27, một ảnh, variant 0 (5395 faces). Khiên nắp quan tài gỗ viền sắt, đinh kim cương; mặt sau Tripo tự dựng khung và quai cầm. Chưa socket/rig. `_shots/final_views.png` |
| [PB mace A](heroes/PB_pallbearer/vA/weapons/mace/) | `PB_mace_vA.glb`, 14,8 MB | 10.489 | theo sheet; GLB nguồn 1 m | chưa | 2026-10-27, một ảnh, variant 0 (5829 faces). Chùy đầu khối gai. Chưa socket/rig. `_shots/final_views.png` |
| [FL chain-flail A](heroes/FL_flagellant/vA_v5b/weapons/chain_flail/) | `FL_chain_flail_vA.glb`, 20,5 MB | 10.108 | theo sheet; GLB nguồn 1 m | chưa | 2026-10-27, một ảnh, variant 2 (5546 faces). Hai xích, hai quả gai, dựng cứng nằm ngang như concept; xích treo cần cắt/rig trong engine. Chưa socket/rig. `_shots/final_views.png` |
| [FL branding iron A](heroes/FL_flagellant/vA_v5b/weapons/branding_iron/) | `FL_branding_iron_vA.glb`, 13,9 MB | 10.220 | theo sheet; GLB nguồn 1 m | chưa | 2026-10-27, một ảnh, variant 0 (5420 faces). Sắt nung đầu nút ba vòng; màu cam nung là màu vẽ, lửa/phát sáng làm bằng hiệu ứng. Chưa socket/rig. `_shots/final_views.png` |
| [D02 Kiln-Shaman ladle](act-01/monsters/D02_kiln_shaman/weapons/ladle/) | `D02_kiln_shaman_ladle.glb`, 11,7 MB | 11.180 | gậy ~0,75H (sheet); GLB nguồn 1 m | chưa | 2026-10-22, nhánh một ảnh: ảnh cắt từ cột WEAPON/PROP của concept (không có ảnh Astra), v1 (6400 faces). Muôi đất nung nứt trên cán gỗ quấn dây; không lửa. Chưa socket/rig. `brief.md`, `_shots/final_views.png` |
| [D03 Kiln-Bull glaive](act-01/monsters/D03_kiln_bull/weapons/glaive/) | `D03_kiln_bull_glaive.glb`, 10,3 MB | 10.390 | ~1,5H (sheet); GLB nguồn 1 m | chưa | 2026-10-26, nhánh một ảnh: ảnh cắt từ cột WEAPON của concept vE r3, v1 (5752 faces). Glaive sắt lưỡi cong; mép lưỡi trên hơi có khía. Chưa socket/rig. `brief.md`, `_shots/final_views.png` |
| [F01 Body-Snatcher spade](act-01/monsters/F01_body_snatcher/weapons/spade/) | `F01_body_snatcher_spade.glb`, 16,4 MB | 10.807 | cán ~0,5H (sheet); GLB nguồn 1 m | chưa | 2026-10-22, nhánh một ảnh: ảnh cắt từ cột WEAPON/PROP của concept (không có ảnh Astra), v1 (5787 faces). Xẻng cán chữ D, lưỡi sắt mòn. Chưa socket/rig. `brief.md`, `_shots/final_views.png` |
| [F01 Body-Snatcher sack](act-01/monsters/F01_body_snatcher/weapons/sack/) | `F01_body_snatcher_sack.glb`, 8,8 MB | 9.937 | rộng ~0,5H (sheet); GLB nguồn 1 m | chưa | 2026-10-22, nhánh một ảnh: ảnh cắt từ cột WEAPON/PROP của concept (không có ảnh Astra), v1 (5839 faces). Bao xác buộc ruy băng đỏ; đáy phẳng. Chưa socket/rig. `brief.md`, `_shots/final_views.png` |
| [F02 Poppy Nurse needle](act-01/monsters/F02_poppy_nurse/weapons/needle/) | `F02_poppy_nurse_needle.glb`, 12,6 MB | 10.193 | dài ~1,05H (sheet); GLB nguồn 1 m | chưa | 2026-10-22, nhánh một ảnh: ảnh cắt từ cột WEAPON/PROP của concept (không có ảnh Astra), v2 (5525 faces). Kim bạc rất mảnh; nhìn ngang Tripo thêm vây nhỏ dưới mũi, thân hơi lượn. Chưa socket/rig. `brief.md`, `_shots/final_views.png` |
| [P02 Hush-Herald censer](act-01/monsters/P02_hush_herald/weapons/censer/) | `P02_hush_herald_censer.glb`, 26,4 MB | 10.622 | quả cầu ~0,25H (sheet); GLB nguồn 1 m | chưa | 2026-10-22, nhánh một ảnh: ảnh cắt từ cột WEAPON/PROP của concept (không có ảnh Astra), v0 (6041 faces). Lư hương đồng + xích mắt to nằm trên đất như concept; xích treo tay cần cắt/rig trong engine. Chưa socket/rig. `brief.md`, `_shots/final_views.png` |
| [P05 Wet-Nurse bundle](act-01/monsters/P05_wet_nurse/weapons/bundle/) | `P05_wet_nurse_bundle.glb`, 11,7 MB | 10.104 | ~0,35H (sheet); GLB nguồn 1 m | chưa | 2026-10-22, nhánh một ảnh: ảnh cắt từ cột WEAPON/PROP của concept (không có ảnh Astra), v1 (5288 faces). Bọc vải buộc vải đỏ, hai đầu xương; một mảng vá phẳng bên hông. Chưa socket/rig. `brief.md`, `_shots/final_views.png` |
| [U02 Charnel Dead sword](act-01/monsters/U02_charnel_dead/weapons/sword/) | `U02_charnel_dead_sword.glb`, 22,2 MB | 10.840 | ~0,4H (sheet); GLB nguồn 1 m | chưa | 2026-10-22, nhánh một ảnh: ảnh cắt từ cột WEAPON/PROP của concept (không có ảnh Astra), v2 (5775 faces). Kiếm ngắn bản rộng. Chưa socket/rig. `brief.md`, `_shots/final_views.png` |
| [U02 Charnel Dead shield](act-01/monsters/U02_charnel_dead/weapons/shield/) | `U02_charnel_dead_shield.glb`, 25,3 MB | 9.967 | đường kính ~0,28H (sheet); GLB nguồn 1 m | chưa | 2026-10-22, nhánh một ảnh: ảnh cắt từ cột WEAPON/PROP của concept (không có ảnh Astra), v0 (5532 faces). Khiên ván nắp quan tài, viền và núm sắt; mặt sau Tripo tự dựng (có quai). Chưa socket/rig. `brief.md`, `_shots/final_views.png` |
| [U03 Charnel Bowman bow](act-01/monsters/U03_charnel_bowman/weapons/bow/) | `U03_charnel_bowman_bow.glb`, 12,1 MB | 8.727 | cao ~0,9H (sheet); GLB nguồn 1 m | chưa | 2026-10-22, nhánh một ảnh: ảnh cắt từ cột WEAPON/PROP của concept (không có ảnh Astra), v0 (4602 faces). Cung gỗ thủy tùng; dây cung rất mảnh, đứt quãng vài đoạn. Chưa socket/rig. `brief.md`, `_shots/final_views.png` |

### Quái

| Asset | GLB | Tam giác | Kích thước thật | Bản trong lab | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| [D01 Hodling B](act-01/monsters/D01_hodling/) | `D01_hodling.glb`, 14,8 MB | 10.668 | cao ~0,5 m (0,27H) | chưa | GLB 2026-10-20, variant 2. Còn tồn tại: góc mũ nhọn, tai hơi to, tay mảnh |
| [B02 Lullaby Man A](act-01/monsters/B02_lullaby_man/) | `B02_lullaby_man.glb`, 17,5 MB | 9.863 | mũ 2,2H, đỉnh lồng nôi 2,55H | chưa | 2026-10-22, variant 2 (5709 faces). Lồng nôi 3 bọc trên đầu/lưng dựng đặc; đường khâu mặt 4 mũi thay vì 3 |
| [B03 Ember-Pot A](act-01/monsters/B03_ember_pot/) | `B03_ember_pot.glb`, 24,4 MB; xe nồi `cart/B03_ember_pot_cart.glb` | 10.336 | hình người ~1H (thẳng lưng; concept gù) | chưa | 2026-10-22, variant 1 (6199 faces). Tách hai asset: hình người multi-view T-pose, xe nồi một ảnh (prop). Xích kéo chưa dựng |
| [B04 Willow Bride A](act-01/monsters/B04_willow_bride/) | `B04_willow_bride.glb`, 17,2 MB | 10.005 | ~1H, đuôi rễ rộng ~1H | chưa | 2026-10-22, variant 1 (5506 faces). Phần dưới là khối rễ thay chân (như váy dài) |
| [B05 Hospice Mother A](act-01/monsters/B05_hospice_mother/) | `B05_hospice_mother.glb`, 16,7 MB | 8.357 | ~3H (canon 2,75H) | chưa | 2026-10-22, variant 0 (5313 faces). 8 tay (4 cặp) dang ngang. Dựng từ **hai góc trước + sau** (góc bên của Astra vẽ tay vươn ra trước, chưa sửa được vì Codex hết hạn mức); độ dày áo do Tripo đoán. Đèn đêm xích dựng riêng (chưa làm, cần ảnh Astra) |
| [D02 Kiln-Shaman A](act-01/monsters/D02_kiln_shaman/) | `D02_kiln_shaman.glb`, 20,0 MB | 10.647 | canon đỉnh nồi 0,47H (sheet vẽ 0,77H) | chưa | 2026-10-22, variant 0 (6201 faces). Gậy muôi dựng riêng: [`weapons/D02_kiln_shaman_ladle`](act-01/monsters/D02_kiln_shaman/weapons/ladle/) |
| [D03 Kiln-Bull E](act-01/monsters/D03_kiln_bull/) | `D03_kiln_bull.glb`, 17,0 MB | 10.807 | 1,40H (đỉnh sừng) | chưa | 2026-10-26, concept vE/concept_r3_kiln (bò Hell Bovine D2 + lò nung sau lưng), variant 2 (6276 faces); bỏ variant 1 (mảng phẳng thừa). T-pose: tay xệ 5–8°, đuôi/vạt sau lệch nhẹ giữa các góc; cửa lò sau lưng texture thành hai vòm. Glaive dựng riêng: [`weapons/glaive`](act-01/monsters/D03_kiln_bull/weapons/glaive/) |
| [D04 Tithe-Thief A](act-01/monsters/D04_tithe_thief/) | `D04_tithe_thief.glb`, 27,4 MB | 9.791 | canon 0,50H (sheet 0,68H) | chưa | 2026-10-22, variant 1 (5881 faces). **Base color 8192²** (tài khoản đổi mặc định sang 8K, 30 credit); thân hơi nghiêng dưới bao |
| [F01 Body-Snatcher A](act-01/monsters/F01_body_snatcher/) | `F01_body_snatcher.glb`, 14,3 MB | 9.909 | ~1H | chưa | 2026-10-22, variant 0 (5734 faces), dựng lại cùng ngày: variant 2 cũ hỏng bàn tay trái (ngón xoắn dính cục), GLB cũ ở `_work/_rejected/`, so tay ở `_shots/hand_fix_before_after.png`. Xẻng và bao xác dựng riêng: [`F01_body_snatcher_spade`](act-01/monsters/F01_body_snatcher/weapons/spade/), [`F01_body_snatcher_sack`](act-01/monsters/F01_body_snatcher/weapons/sack/) |
| [F02 Poppy Nurse A](act-01/monsters/F02_poppy_nurse/) | `F02_poppy_nurse.glb`, 15,8 MB | 9.978 | khăn trùm 1,08H | chưa | 2026-10-22, variant 2 (5438 faces). Kim dài bạc dựng riêng: [`F02_poppy_nurse_needle`](act-01/monsters/F02_poppy_nurse/weapons/needle/) |
| [P01 The Soothed A](act-01/monsters/P01_the_soothed/) | `P01_the_soothed.glb`, 30,7 MB | 10.216 | 0,95H | chưa | 2026-10-22, variant 1 (6274 faces). **Base color 8192²** (như D04) |
| [P02 Hush-Herald A](act-01/monsters/P02_hush_herald/) | `P02_hush_herald.glb`, 12,4 MB | 10.510 | đỉnh mũ chóp 1,22H | chưa | 2026-10-22, variant 1 (6307 faces). Lư hương xích dựng riêng: [`P02_hush_herald_censer`](act-01/monsters/P02_hush_herald/weapons/censer/); dải mắt 5 thay vì 4 |
| [P03 Hush-Moths A](act-01/monsters/P03_hush_moths/) | `P03_hush_moths.glb`, 11,8 MB | 10.378 | râu 0,33H, sải cánh ~0,75H | chưa | 2026-10-22, variant 2 (6188 faces). Một con của đàn; cánh dang một mặt phẳng đứng. Dựng từ **hai góc trước + sau** (sheet góc bên chưa gen); cánh trước/sau hơi lệch thành hai lớp |
| [P04 Hive-Sleeper A](act-01/monsters/P04_hive_sleeper/) | `P04_hive_sleeper.glb`, 21,9 MB | 8.664 | lưng 0,60H, thân dài 1,55H | chưa | 2026-10-22, variant 1 (5235 faces). Bò bằng tay và gối (pose `Qh`), ba vòm ấu trùng |
| [P05 Wet-Nurse B](act-01/monsters/P05_wet_nurse/) | `P05_wet_nurse.glb`, 18,0 MB | 10.713 | mũ 1,04H | chưa | 2026-10-22, variant 3 (6764 faces), dựng lại cùng ngày: variant 0 cũ có ngón cái trái gập xuống 90°, GLB cũ ở `_work/_rejected/`, so tay ở `_shots/hand_fix_before_after.png`. T-pose chưa đạt hẳn (tay xệ 6–9°, tay ngắn hơn concept, chân hơi rộng), vẫn dựng được; lệnh sửa ảnh soạn sẵn ở `E:\tmp_tripo_all\P05_wet_nurse\jobs_fix_prepared.json` nếu cần dựng lại. Bọc vải cầm tay dựng riêng: [`P05_wet_nurse_bundle`](act-01/monsters/P05_wet_nurse/weapons/bundle/) |
| [P06 Poppy-Mound A](act-01/monsters/P06_poppy_mound/) | `P06_poppy_mound.glb`, 14,1 MB | 8.948 | rộng 2,5H | chưa | 2026-10-22, nhánh prop: một ảnh Astra 3/4 + Smart Mesh một ảnh, variant 1 (6053 faces). Tĩnh, không rig |
| [P07 Cradle-Warden A](act-01/monsters/P07_cradle_warden/) | `P07_cradle_warden.glb`, 19,2 MB | 10.941 | canon 2,2H (sheet 1,5H) | chưa | 2026-10-22, variant 0 (6554 faces). Lồng nôi trên lưng dựng đặc |
| [U01 Shambler A](act-01/monsters/U01_shambler/) | `U01_shambler.glb`, 24,5 MB | 9.629 | 0,95H | chưa | 2026-10-22, variant 0 (5784 faces). **Base color 8192²** (như D04) |
| [U02 Charnel Dead A](act-01/monsters/U02_charnel_dead/) | `U02_charnel_dead.glb`, 24,7 MB | 11.125 | 0,95H | chưa | 2026-10-22, variant 1 (6403 faces). Tay ngắn hơn concept ~10 % (span 1,22 so với 1,35); kiếm và khiên dựng riêng: [`U02_charnel_dead_sword`](act-01/monsters/U02_charnel_dead/weapons/sword/), [`U02_charnel_dead_shield`](act-01/monsters/U02_charnel_dead/weapons/shield/) |
| [U03 Charnel Bowman A](act-01/monsters/U03_charnel_bowman/) | `U03_charnel_bowman.glb`, 25,8 MB | 10.489 | 0,95H | chưa | 2026-10-22, variant 1 (6224 faces). Ống tên giữ trên lưng; cung dựng riêng: [`U03_charnel_bowman_bow`](act-01/monsters/U03_charnel_bowman/weapons/bow/) |
| [U04 Charnel Ghoul A](act-01/monsters/U04_charnel_ghoul/) | `U04_charnel_ghoul.glb`, 16,6 MB | 9.932 | đỉnh đầu 0,65H, thân dài 1,25H | chưa | 2026-10-22, variant 1 (6055 faces). Đứng nghỉ bốn chi (pose `Qh`); Tripo giữ được khoang hàm há |
| [U05 The Swollen A](act-01/monsters/U05_the_swollen/) | `U05_the_swollen.glb`, 18,4 MB | 8.902 | 0,95H, bụng 0,90H | chưa | 2026-10-22, variant 0 (5247 faces). Tay ngắn hơn concept (span 1,28 so với ~1,55) |
| [W01 Mortar-Rat B](act-01/monsters/W01_mortar_rat/) | `W01_mortar_rat.glb`, 27,7 MB | 10.590 | đỉnh đầu 0,22H | chưa | 2026-10-22, variant 1 (6006 faces). Chuột đứng, T-pose chân khuỷu ngược; mỗi cụm gai 5 nón thay vì 4 |
| [W02 Gibbet-Crow B](act-01/monsters/W02_gibbet_crow/) | `W02_gibbet_crow.glb`, 15,1 MB | 9.105 | đứng 0,36H, sải cánh 0,89H | chưa | 2026-10-22, mẫu họ W: cánh dang một mặt phẳng đứng, variant 0 (5615 faces). Concept vẽ cánh rủ; tư thế dang là để dựng mesh |
| [W03 Hush-Wolf A](act-01/monsters/W03_hush_wolf/) | `W03_hush_wolf.glb`, 16,3 MB | 9.999 | 0,95H | chưa | 2026-10-22, variant 1 (6108 faces). Chân khuỷu ngược; không có đuôi (concept không vẽ) |
| [W04 Mire-Sucker B](act-01/monsters/W04_mire_sucker/) | `W04_mire_sucker.glb`, 22,1 MB | 10.647 | đỉnh cánh 0,87H | chưa | 2026-10-22, variant 2 (6598 faces). **Bốn góc cắt thẳng từ concept** (concept đã vẽ dáng đứng nghỉ sạch; không có ảnh Astra): cánh xếp ra sau, màu xám trong như concept; hai túi máu tách rõ, sáu chân cà kheo |
| [W06 Willow-Hulk B](act-01/monsters/W06_willow_hulk/) | `W06_willow_hulk.glb`, 22,5 MB | 9.082 | canon 1,75H (sheet 1,22H) | chưa | 2026-10-22, variant 1 (5593 faces). Mảnh hơn concept, tay rễ dài |
| [W07 Shroud-Spinner A](act-01/monsters/W07_shroud_spinner/) | `W07_shroud_spinner.glb`, 13,4 MB | 10.446 | ~0,8H, sải chân ~1,55H | chưa | 2026-10-22, mẫu họ A (nhiều chân): variant 2 (6267 faces), đủ 8 chân tách rời |
| [B01 Sexton's Dog A](act-01/monsters/B01_sextons_dog/) | `B01_sextons_dog.glb`, 16,9 MB | 11.184 | vai ~0,55H (~1 m), dài ~1,2H; GLB nguồn dài 1 m | chưa | Họ Q, lượt Tripo đầu tiên của nhánh CREATURE (2026-10-22): multi-view bốn góc dáng đứng nghỉ, variant 0 (7044 faces), 3 map 4096². Bốn chân tách rời, vòng cổ, khoá và đuôi đúng chỗ. Texture phải upload lại bốn góc ở trang Texture. `_shots/final_views.png` |

### Prop: `common/dungeon_v1/` (hầm mộ và hang động, 2026-10-21)

Phương án a/b đã chọn ghi trong `ashlar/art/textures/terrain-dungeon-v1/selection.json`. `crypt_wall` là module phẳng để ghép tường.

| Vật | GLB | Tam giác | Kích thước thật | Bản trong lab |
| --- | --- | --- | --- | --- |
| [sarcophagus](common/dungeon_v1/sarcophagus/) | 19,5 MB | 10.300 | dài 2,2 m | `dungeon-prop-sarcophagus.glb` |
| [bone_pile](common/dungeon_v1/bone_pile/) | 20,3 MB | 10.080 | rộng 1,2 m | `dungeon-prop-bone-pile.glb` |
| [broken_column](common/dungeon_v1/broken_column/) | 18,8 MB | 10.754 | cao 1,5 m | `dungeon-prop-broken-column.glb` |
| [candle_cluster](common/dungeon_v1/candle_cluster/) | 12,6 MB | 10.245 | 0,8 m | `dungeon-prop-candle-cluster.glb` |
| [fallen_bell](common/dungeon_v1/fallen_bell/) | 24,5 MB | 10.012 | 1,25 m | `dungeon-prop-fallen-bell.glb` |
| [crypt_wall](common/dungeon_v1/crypt_wall/) | 24,7 MB | 10.787 | rộng 4 m, cao 2,3 m | `dungeon-prop-crypt-wall.glb` |
| [stalagmites](common/dungeon_v1/stalagmites/) | 15,3 MB | 9.754 | cao 1,6 m | `dungeon-prop-stalagmites.glb` |
| [mine_timber](common/dungeon_v1/mine_timber/) | 14,6 MB | 9.902 | cao 2,6 m | `dungeon-prop-mine-timber.glb` |
| [flint_boulders](common/dungeon_v1/flint_boulders/) | 21,3 MB | 10.236 | rộng 2 m | `dungeon-prop-flint-boulders.glb` |

### Prop: `common/clutter_v1/` (đồ rải nền rừng, 2026-10-21)

| Vật | GLB | Tam giác | Kích thước thật | Bản trong lab |
| --- | --- | --- | --- | --- |
| [riverbank_stones](common/clutter_v1/riverbank_stones/) | 15,5 MB | 10.073 | rộng 1 m | `biome-prop-riverbank-stones.glb` |
| [mushroom_cluster](common/clutter_v1/mushroom_cluster/) | 16,6 MB | 8.902 | cao 0,3 m | `biome-prop-mushrooms.glb` |
| [mossy_stump](common/clutter_v1/mossy_stump/) | 11,7 MB | 10.540 | rộng 0,8 m, cao ~0,5 m | `biome-prop-stump.glb` |

### Prop: `heroes/_hands_v1/` (tay màn chọn nghề, 2026-10-23)

Từ key art `art/heroes/_shared/choice_hands/keyart.png`; FL/OS/BR vẽ lại theo concept hero v5 hướng A. Nhánh một ảnh (Astra → Smart Mesh), 145 credit mỗi tay. Tường sọ là texture, không phải model: `art/textures/wall-ossuary-v1/` (albedo, normal, height 1024). PB, EX, PS mới có ảnh đầu vào (`textures/H1/H5/H6_*_a.png`, bản key art cũ), chưa dựng: scene lab `choiceHands` (`?scene=choiceHands`, `lookdev-lab/docs/HUONG_DAN.md` §7m) dùng **stand-in** — PB ← bản sao tinted thép của OS (mu tay), EX ← FL lật + tinted da nâu, PS ← FL lật + tinted da + vòng chỉ đỏ; thả GLB thật vào `HAND_MODELS` / `SLOTS` ở `lookdev-lab/src/env/choiceHands.js` và đặt `standIn: false`. Script chuẩn bị: `lookdev-lab/scripts/prepare-choice-hands.py`.

| Vật | GLB | Tam giác | Kích thước thật | Bản trong lab |
| --- | --- | --- | --- | --- |
| [H2 FL Flagellant](heroes/_hands_v1/H2_FL_hand/) | 12,7 MB | 10.006 | cẳng + bàn tay ~45 cm; GLB nguồn dài 1 m | `lookdev-lab/assets/choice-hands/choice-hand-fl.glb` (0,45 m, mu tay +y, gốc ở đầu tay áo, kèm ống tay áo kéo dài; scene `choiceHands`) |
| [H3 OS Ossuarist](heroes/_hands_v1/H3_OS_hand/) | 20,1 MB | 9.880 | như trên | `choice-hand-os.glb` (như trên); lớp vữa trên mu tay mỏng hơn ảnh đầu vào. PB đang dùng bản sao tinted của tay này làm stand-in |
| [H4 BR Brinecaller](heroes/_hands_v1/H4_BR_hand/) | 12,6 MB | 10.273 | như trên | `choice-hand-br.glb` (như trên) |

### Prop: `act-01/environments/A15_* ... A20_*/<vật>/` (36 asset; lô dựng ở `act-01/_batches/extras_v1/` môi trường Act I A15–A20, 2026-10-22)

Concept: `ashlar/art/act-01/environments/A15_…A20_*/`; hạ tầng lô ở `ashlar/art/act-01/_batches/env_A15-A20/` (id, kích thước đề xuất, FRONT ở `README_VI.md`). Mỗi vật một ảnh Astra (`textures/<vật>_a.png`), Smart Mesh một ảnh, variant đã chọn ghi trong `<vật>/_work/tripo.log`. Kích thước thật là đề xuất AD (W × D, cao); GLB Tripo chuẩn hoá cạnh dài 1 m.

| Vật | GLB | Tam giác | Kích thước thật | Bản trong lab |
| --- | --- | --- | --- | --- |
| [A15.1 Flint parish church](act-01/environments/A15_lychgate_village_extras/A15_1_flint_church/) | 25,5 MB | 9.311 | 8 m × 16 m, cao 11 m | `act1-a15-1-flint-church.glb` |
| [A15.2 Brannoc's forge](act-01/environments/A15_lychgate_village_extras/A15_2_forge/) | 14,6 MB | 9.782 | 6 m × 4,5 m, cao 4 m | `act1-a15-2-forge.glb` |
| [A15.3 Sleeper name board](act-01/environments/A15_lychgate_village_extras/A15_3_name_board/) | 16,0 MB | 9.224 | 2,6 m × 0,6 m, cao 2,4 m | `act1-a15-3-name-board.glb` |
| [A15.4 Mourning bell frame](act-01/environments/A15_lychgate_village_extras/A15_4_bell_frame/) | 21,1 MB | 9.973 | 2,2 m × 1,2 m, cao 3,4 m | `act1-a15-4-bell-frame.glb` |
| [A15.5 Grave-goods stall](act-01/environments/A15_lychgate_village_extras/A15_5_grave_goods_stall/) | 20,9 MB | 8.536 | 3 m × 1,8 m, cao 2,6 m | `act1-a15-5-grave-goods-stall.glb` |
| [A15.6 Osric's watch post](act-01/environments/A15_lychgate_village_extras/A15_6_watch_post/) | 17,6 MB | 8.836 | 3 m × 3 m, cao 4,2 m | `act1-a15-6-watch-post.glb` |
| [A16.1 Churchyard yew](act-01/environments/A16_churchyard_extras/A16_1_yew/) | 15,0 MB | 7.208 | 8 m × 8 m, cao 9 m | `act1-a16-1-yew.glb` |
| [A16.2 Empty tarred gibbet](act-01/environments/A16_churchyard_extras/A16_2_gibbet/) | 24,1 MB | 8.537 | 2 m × 0,8 m, cao 4,6 m | `act1-a16-2-gibbet.glb` |
| [A16.3 Grave with jar candles](act-01/environments/A16_churchyard_extras/A16_3_jar_candle_grave/) | 24,3 MB | 6.653 | 0,9 m × 2,2 m, cao 0,8 m | `act1-a16-3-jar-candle-grave.glb` |
| [A16.4 Fresh grave](act-01/environments/A16_churchyard_extras/A16_4_fresh_grave/) | 18,2 MB | 8.323 | 1 m × 2,4 m, cao 1,2 m | `act1-a16-4-fresh-grave.glb` |
| [A16.5 Unquiet grave](act-01/environments/A16_churchyard_extras/A16_5_unquiet_grave/) | 21,6 MB | 7.761 | 1,2 m × 2,6 m, cao 1,3 m | `act1-a16-5-unquiet-grave.glb` |
| [A16.6 Sexton's lamp post](act-01/environments/A16_churchyard_extras/A16_6_sexton_lamp/) | 10,9 MB | 9.910 | 0,9 m × 0,4 m, cao 2,6 m | `act1-a16-6-sexton-lamp.glb` |
| [A17.1 The leaning stones](act-01/environments/A17_fens_drowned_village_extras/A17_1_leaning_stones/) | 29,9 MB | 9.434 | 3,5 m × 1 m, cao 4,6 m | `act1-a17-1-leaning-stones.glb` |
| [A17.2 Drowned bell tower](act-01/environments/A17_fens_drowned_village_extras/A17_2_drowned_bell_tower/) | 32,4 MB | 9.114 | 4 m × 4 m, cao 10 m | `act1-a17-2-drowned-bell-tower.glb` |
| [A17.3 Gentle House boat](act-01/environments/A17_fens_drowned_village_extras/A17_3_gentle_boat/) | 19,5 MB | 9.360 | 1,6 m × 7 m, cao 2,6 m | `act1-a17-3-gentle-boat.glb` |
| [A17.4 Flooded supper table](act-01/environments/A17_fens_drowned_village_extras/A17_4_flooded_supper_table/) | 18,4 MB | 9.907 | 2,4 m × 1,5 m, cao 1 m | `act1-a17-4-flooded-supper-table.glb` |
| [A17.5 Flooded lace window](act-01/environments/A17_fens_drowned_village_extras/A17_5_flooded_lace_window/) | 24,5 MB | 9.947 | 2,2 m × 0,5 m, cao 2,6 m | `act1-a17-5-flooded-lace-window.glb` |
| [A17.6 Gentle House dock](act-01/environments/A17_fens_drowned_village_extras/A17_6_gentle_dock/) | 20,5 MB | 9.876 | 2 m × 6 m, cao 3 m | `act1-a17-6-gentle-dock.glb` |
| [A18.1 Abandoned ox cart](act-01/environments/A18_poppy_reach_gentle_house_exterior/A18_1_ox_cart/) | 23,6 MB | 9.413 | 1,8 m × 4 m, cao 1,6 m | `act1-a18-1-ox-cart.glb` |
| [A18.2 Bed with clean pillow](act-01/environments/A18_poppy_reach_gentle_house_exterior/A18_2_bed_clean_pillow/) | 17,6 MB | 7.781 | 1,2 m × 2 m, cao 1,1 m | `act1-a18-2-bed-clean-pillow.glb` |
| [A18.3 Flint Delvings mouth](act-01/environments/A18_poppy_reach_gentle_house_exterior/A18_3_delvings_mouth/) | 24,7 MB | 7.847 | 4 m × 2,5 m, cao 3,6 m | `act1-a18-3-delvings-mouth.glb` |
| [A18.4 Hospice ward range](act-01/environments/A18_poppy_reach_gentle_house_exterior/A18_4_hospice_range/) | 26,7 MB | 8.950 | 30 m × 9 m, cao 11 m | `act1-a18-4-hospice-range.glb` |
| [A18.5 Hospice wall niche](act-01/environments/A18_poppy_reach_gentle_house_exterior/A18_5_hospice_wall_niche/) | 16,7 MB | 9.127 | 6 m × 0,7 m, cao 3,2 m | `act1-a18-5-hospice-wall-niche.glb` |
| [A18.6 Hilltop steps](act-01/environments/A18_poppy_reach_gentle_house_exterior/A18_6_hilltop_steps/) | 15,8 MB | 8.209 | 4 m × 5 m, cao 2,5 m | `act1-a18-6-hilltop-steps.glb` |
| [A19.1 Flowers in a vase](act-01/environments/A19_gentle_house_interior_props/A19_1_vase_flowers/) | 16,5 MB | 7.862 | 0,2 m × 0,2 m, cao 0,5 m | `act1-a19-1-vase-flowers.glb` |
| [A19.2 Poppy tea tray](act-01/environments/A19_gentle_house_interior_props/A19_2_poppy_tea_tray/) | 17,3 MB | 10.430 | 0,5 m × 0,3 m, cao 0,2 m | `act1-a19-2-poppy-tea-tray.glb` |
| [A19.3 Window chair](act-01/environments/A19_gentle_house_interior_props/A19_3_window_chair/) | 21,4 MB | 9.440 | 1,1 m × 0,6 m, cao 1,2 m | `act1-a19-3-window-chair.glb` |
| [A19.4 Linen press](act-01/environments/A19_gentle_house_interior_props/A19_4_linen_press/) | 22,0 MB | 9.940 | 1,2 m × 0,5 m, cao 1,9 m | `act1-a19-4-linen-press.glb` |
| [A19.5 Linen screen](act-01/environments/A19_gentle_house_interior_props/A19_5_linen_screen/) | 23,6 MB | 9.914 | 2,4 m × 0,4 m, cao 1,8 m | `act1-a19-5-linen-screen.glb` |
| [A19.6 Tall ward window](act-01/environments/A19_gentle_house_interior_props/A19_6_tall_ward_window/) | 18,4 MB | 10.361 | 2,4 m × 0,6 m, cao 3,6 m | `act1-a19-6-tall-ward-window.glb` |
| [A20.1 Sleeper: young woman](act-01/environments/A20_garden_of_hush_sleepers_harvest/A20_1_sleeper_young_woman/) | 17,1 MB | 7.305 | 0,8 m × 2,1 m, cao 0,3 m | `act1-a20-1-sleeper-young-woman.glb` |
| [A20.2 Sleeper: old man](act-01/environments/A20_garden_of_hush_sleepers_harvest/A20_2_sleeper_old_man/) | 19,4 MB | 8.357 | 0,8 m × 2,1 m, cao 0,3 m | `act1-a20-2-sleeper-old-man.glb` |
| [A20.3 Sleeper: fisherman](act-01/environments/A20_garden_of_hush_sleepers_harvest/A20_3_sleeper_fisherman/) | 20,9 MB | 8.083 | 0,8 m × 2,1 m, cao 0,3 m | `act1-a20-3-sleeper-fisherman.glb` |
| [A20.4 Sleeper: farm woman](act-01/environments/A20_garden_of_hush_sleepers_harvest/A20_4_sleeper_farm_woman/) | 20,9 MB | 7.857 | 0,8 m × 2,1 m, cao 0,3 m | `act1-a20-4-sleeper-farm-woman.glb` |
| [A20.5 Irrigation channel](act-01/environments/A20_garden_of_hush_sleepers_harvest/A20_5_irrigation_channel/) | 29,6 MB | 8.296 | 1,4 m × 3 m, cao 1,2 m | `act1-a20-5-irrigation-channel.glb` |
| [A20.6 Harvest table](act-01/environments/A20_garden_of_hush_sleepers_harvest/A20_6_harvest_table/) | 22,5 MB | 9.512 | 2,6 m × 0,9 m, cao 2,2 m | `act1-a20-6-harvest-table.glb` |

### Prop: `act-01/environments/<nhóm>/<vật>/` kit v1 (86 asset; lô dựng ở `act-01/_batches/kit_v1/` môi trường Act I A01–A14, A21–A25, 22–23/10)

Concept: nhóm A01–A14 (`tmp/act1-base-maps/TRIPO_ROWS.md` §2) và A21–A25 (`ashlar/art/act-01/_batches/env_A21-A25/`, §3). Mỗi ảnh "hàng" gom 1–4 vật (`rows/R##_<slug>/input_spaced.png`; R24 dùng `input_r2.png`); Tripo Studio dựng cả hàng một lượt (Smart Mesh một ảnh, 4 variant, Smart UV, texture, PBR), rồi `_tools/split_rows.py` tách mỗi vật thành một GLB: dựng thẳng, mặt trước quay +z, pivot giữa đáy, cạnh dài nhất 1, bỏ mảnh vụn, texture riêng cắt từ atlas của hàng. Tham số từng vật ở `_tools/rows.json`, số đo ở `rows/<hàng>/_split/split.json`. Kệ bánh A24.2 dựng riêng ở hàng `R31r`.

Tất cả gom trong `manifest.json` (số tam giác, dung lượng, texture, kích thước chuẩn hoá, kích thước thật, ghi chú, đánh giá QA). Kích thước thật lấy từ kế hoạch: rộng mặt trước × sâu, cao; khi đưa vào game hay lab thì scale theo số này. Mỗi thư mục có `concept.png` (phần ảnh hàng của vật đó) và `_shots/final_views.png` (trước, 45°, bên, sau). Ảnh tổng: `_review/act1_kit_v1_all.png` (A01–A14) và `_review/act1_kit_v1_A21-A25.png`. Tiến độ, variant và credit: `tmp/act1-base-maps/TRIPO_PROGRESS.md`; bản trong lab và cách đặt: `tmp/act1-base-maps/ACT1_KIT_FIT.md`.

QA nhanh 23/10 (so `final_views.png` với `concept.png`): 38 ổn, 44 có ghi chú, 4 cần làm lại (ghi **Làm lại** ở cột ghi chú). Bản `-trim` của A13.4 và A07.6 (cắt cột cho khỏi giống thánh giá) chờ người dùng chọn.

| Vật | GLB | Tam giác | Kích thước thật | Hàng | Bản trong lab | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| [A01.1 Repaired thatched stilt cottage](act-01/environments/A01_lychgate_village/A01_1_stilt_cottage/) | 9,6 MB | 11.333 | 4,6 m × 4 m, cao 5,2 m | R01 v0, 4K | `act1-a01-1-stilt-cottage.glb` | Mái tranh chìa và thang làm chân rộng 5,4 × 5,2 m (thân 4,6 × 4,0); texture không có cửa sổ sáng. |
| [A01.2 Raised wooden walkway segment](act-01/environments/A01_lychgate_village/A01_2_walkway/) | 6,5 MB | 7.854 | 4 m × 1,4 m, cao 1,2 m | R03 v0, 8K | `act1-a01-2-walkway.glb` | Mặt sàn cao 1,22 m (sàn ở fens 0,62 m); cột lan can dây cao hơn spec 1,2 m; giữa hai lan can chỉ còn 1,05 m. Xác nhận: cột lan can dây cao hơn spec. |
| [A01.3 Patched low flint wall](act-01/environments/A01_lychgate_village/A01_3_flint_wall/) | 7,2 MB | 15.659 | 3,4 m × 0,7 m, cao 1,4 m | R03 v0, 8K | `act1-a01-3-flint-wall.glb` | — |
| [A01.4 Willow hurdle fence](act-01/environments/A01_lychgate_village/A01_4_hurdle_fence/) | 4,4 MB | 9.172 | 3,2 m × 0,18 m, cao 1,4 m | R03 v0, 8K | `act1-a01-4-hurdle-fence.glb` | — |
| [A01.5 Village well](act-01/environments/A01_lychgate_village/A01_5_village_well/) | 8,9 MB | 19.252 | 2,2 m × 2 m, cao 3,4 m | R02 v2, 8K | `act1-a01-5-village-well.glb` | Có nền đá quanh giếng nên rộng 2,7 × 2,4 m (spec 2,2 × 2,0). |
| [A01.6 Eel-trap fishing rack](act-01/environments/A01_lychgate_village/A01_6_eel_trap_rack/) | 9,2 MB | 8.778 | 3,4 m × 1,6 m, cao 3 m | R15 v1, 4K | `act1-a01-6-eel-trap-rack.glb` | Lờ thứ tư dựng nghiêng bên +x: rộng 4,7 m khi cao 3 m (spec 3,4). Có thêm một cọc ngắn cạnh chân lờ nghiêng. |
| [A02.1 Lychgate roofed gate](act-01/environments/A02_churchyard_burial/A02_1_lychgate/) | 9,7 MB | 8.288 | 3,4 m × 2,6 m, cao 3,8 m | R02 v2, 8K | `act1-a02-1-lychgate.glb`, `act1-a02-1-lychgate-open.glb` | Hai cánh cổng mở hé làm lối đi chỉ còn 1,35 m (hai bệ cách 2,25 m); không có đèn. Mất ghế dài bên hông trong concept (chỉ còn thanh ngang trơn); có thanh ngưỡng thấp chắn ngang lối ra phía sau, sát đất. |
| [A02.2 Mortsafe grave cage](act-01/environments/A02_churchyard_burial/A02_2_mortsafe/) | 5,6 MB | 5.731 | 2,6 m × 1,4 m, cao 1,2 m | R04 v2, 8K | `act1-a02-2-mortsafe.glb` | Lồng chỉ cao 0,97 m (spec 1,2); GLB gốc lệch 6,5° (bản lab đã chỉnh). |
| [A02.3 Small mismatched headstone cluster](act-01/environments/A02_churchyard_burial/A02_3_headstones/) | 8,3 MB | 13.819 | 3 m × 2 m, cao 1,6 m | R04 v2, 8K | `act1-a02-3-headstones.glb` | Bia không có chữ khắc. |
| [A02.4 Round ossuary tower](act-01/environments/A02_churchyard_burial/A02_4_ossuary_tower/) | 7,0 MB | 7.231 | 4,8 m × 4,8 m, cao 7,8 m | R01 v0, 4K | `act1-a02-4-ossuary-tower.glb` | Chân tháp loe thành vạt đá 6,0 × 6,7 m (thân 4,3–4,9 m, spec 4,8). Mặt sau không có cửa (hợp lý). |
| [A02.5 Faceless saint statue supporting an arch](act-01/environments/A02_churchyard_burial/A02_5_saint_statue_arch/) | 4,2 MB | 3.681 | 2,4 m × 1,2 m, cao 4,3 m | R02 v2, 8K | `act1-a02-5-saint-statue-arch.glb` | Bệ bậc rộng khoảng 2,0 × 1,85 m (blockout 1,4 × 1,15); nhìn thẳng thì vòm trên đầu giống vòng trên cột nhưng không có thanh ngang: để ý khi chụp map. Nhìn ngang: vòm thành một vạch, hai khối chân vòm chìa ra gần đỉnh, hơi giống thánh giá; mặt trước ổn. |
| [A02.6 Funeral hand cart](act-01/environments/A02_churchyard_burial/A02_6_hand_cart/) | 6,3 MB | 5.652 | 3,2 m × 1,4 m, cao 1,2 m | R04 v2, 8K | `act1-a02-6-hand-cart.glb` | — |
| [A03.4 Large moss rock](act-01/environments/A03_fen_wetland/A03_4_moss_rock/) | 5,5 MB | 261 | 2,3 m × 2 m, cao 1,6 m | R07 v2, 8K | `act1-a03-4-moss-rock.glb` | — |
| [A03.5 Peat bank chunk](act-01/environments/A03_fen_wetland/A03_5_peat_bank/) | 7,5 MB | 22.603 | 2,9 m × 1,2 m, cao 1,4 m | R07 v2, 8K | `act1-a03-5-peat-bank.glb` | — |
| [A03.6 Waterlogged root stump](act-01/environments/A03_fen_wetland/A03_6_root_stump/) | 4,8 MB | 6.609 | 1,4 m × 1,4 m, cao 1,3 m | R07 v2, 8K | `act1-a03-6-root-stump.glb` | Rễ toả 2,4 × 2,5 m khi cao 1,3 m (đúng tỉ lệ concept). |
| [A04.1 Old broad weeping willow](act-01/environments/A04_willow_trees/A04_1_old_willow/) | 20,2 MB | 11.817 | 6 m × 6 m, cao 5,4 m | R05 v1, 4K | `act1-a04-1-old-willow.glb` | — |
| [A04.2 Young willow](act-01/environments/A04_willow_trees/A04_2_young_willow/) | 3,5 MB | 4.035 | 4 m × 4 m, cao 6 m | R05 v1, 4K | `act1-a04-2-young-willow.glb` | — |
| [A04.3 Dead angular tree](act-01/environments/A04_willow_trees/A04_3_dead_tree/) | 4,8 MB | 6.833 | 3 m × 3 m, cao 7 m | R06 v3, 4K | `act1-a04-3-dead-tree.glb` | — |
| [A04.5 Fallen hollow trunk](act-01/environments/A04_willow_trees/A04_5_hollow_trunk/) | 5,3 MB | 16.800 | 5 m × 1,6 m, cao 1,3 m | R12 v2, 4K | `act1-a04-5-hollow-trunk.glb` | — |
| [A04.6 Exposed willow root cluster](act-01/environments/A04_willow_trees/A04_6_willow_roots/) | 19,4 MB | 12.793 | 4,6 m × 4 m, cao 2,2 m | R06 v3, 4K | `act1-a04-6-willow-roots.glb` | — |
| [A06.1 Fen causeway segment](act-01/environments/A06_night_fens/A06_1_causeway/) | 8,8 MB | 19.154 | 4 m × 0,4 m, cao 0,9 m | R09 v0, 8K | `act1-a06-1-causeway.glb` | Là cả một đoạn đường đắp, mặt gồ ghề có cỏ và cột ở hai đầu, không phải hàng cọc kè mà map đặt dưới id này. |
| [A06.2 Upright marker stone](act-01/environments/A06_night_fens/A06_2_marker_stone/) | 3,4 MB | 2.674 | 0,9 m × 0,7 m, cao 2,6 m | R08 v3, 8K | `act1-a06-2-marker-stone.glb` | Đá vụn ở chân và dáng nghiêng làm khối rộng 2,2 × 1,4 m; tảng đá lệch 0,24 m theo x so với tâm. |
| [A06.3 Stepping-stone ford](act-01/environments/A06_night_fens/A06_3_stepping_ford/) | 2,6 MB | 896 | 2,4 m × 7 m, cao 0,5 m | R09 v0, 8K | `act1-a06-3-stepping-ford.glb` | Bảy mảnh rời (sáu tảng đá và một tấm ván) trong một model, rộng 3,3 m (concept 2,4). Tấm ván nằm trên đá (không lơ lửng). |
| [A06.4 Unlit bog-lure post](act-01/environments/A06_night_fens/A06_4_bog_lure_post/) | 4,0 MB | 14.551 | 1,3 m × 0,9 m, cao 2,9 m | R08 v3, 8K | `act1-a06-4-bog-lure-post.glb` | Cột lệch 0,31 m về phía −x so với tâm. |
| [A06.5 Half-sunk fen punt](act-01/environments/A06_night_fens/A06_5_fen_punt/) | 4,9 MB | 3.366 | 3,4 m × 1,2 m, cao 0,7 m | R12 v2, 4K | `act1-a06-5-fen-punt.glb` | Thân thuyền chỉ cao 0,47 m (spec 0,7); nước trong lòng thuyền là một mặt phẳng tối. |
| [A06.6 Broken bridge pier](act-01/environments/A06_night_fens/A06_6_bridge_pier/) | 31,3 MB | 9.897 | 3,8 m × 2,2 m, cao 5 m | R08 v3, 8K | `act1-a06-6-bridge-pier.glb` | Đồ sộ hơn concept: 6,0 × 4,0 m khi cao 5 m (spec 3,8 × 2,2). |
| [A07.1 Half-drowned flint cottage](act-01/environments/A07_rooks_weir/A07_1_drowned_cottage/) | 10,8 MB | 11.303 | 7 m × 5 m, cao 6,2 m | R10 v0, 4K | `act1-a07-1-drowned-cottage.glb` | Ống khói ở −x (blockout ở +x); tường kéo dài 1,2 m dưới mặt nước. |
| [A07.2 Timber-and-stone weir segment](act-01/environments/A07_rooks_weir/A07_2_weir/) | 4,8 MB | 1.427 | 4,2 m × 1 m, cao 1,9 m | R11 v1, 8K | `act1-a07-2-weir.glb` | Dài 4,2 m thì chỉ cao 0,99 m, dày 0,43 m (spec 1,9 × 1,0). |
| [A07.3 Gable wall with door arch](act-01/environments/A07_rooks_weir/A07_3_gable_wall/) | 13,0 MB | 9.354 | 5 m × 0,7 m, cao 5,3 m | R11 v1, 8K | `act1-a07-3-gable-wall.glb` | Cửa 1,25 × 2,33 m (đúng concept), chỗ map cho đi qua cần 2,2 × 2,6 m; rộng 7 m (spec 5). Cửa sổ và vòm cửa xuyên ra mặt sau đúng. |
| [A07.4 Sunken roof-ridge platform](act-01/environments/A07_rooks_weir/A07_4_roof_platform/) | 6,6 MB | 10.550 | 6 m × 4,8 m, cao 3,2 m | R10 v0, 4K | `act1-a07-4-roof-platform.glb` | Nóc rạ lượn lên xuống 1,4–1,9 m (blockout 2,5 m) và lệch sang hai bên. |
| [A07.5 Pontoon plank raft](act-01/environments/A07_rooks_weir/A07_5_plank_raft/) | 9,3 MB | 8.173 | 3,6 m × 2,4 m, cao 1,7 m | R09 v0, 8K | `act1-a07-5-plank-raft.glb` | Sàn bè sâu 1,8 m (spec 2,4); có cột ở góc và cột buộc dây trên sàn. Đầu thùng hở, rỗng như vòng tròn khi nhìn ngang (concept: thùng kín). |
| [A07.6 Rook roost pole](act-01/environments/A07_rooks_weir/A07_6_roost_pole/) | 4,2 MB | 13.160 | 2,8 m × 1,4 m, cao 6,2 m | R11 v1, 8K | `act1-a07-6-roost-pole.glb`, `act1-a07-6-roost-pole-trim.glb` | **Làm lại.** Cột nhô 0,5 m trên thanh treo tổ, nhìn từ camera có thể giống thánh giá: đã có bản -trim, chờ người dùng chọn. Bước tách đã bỏ object 2 (3.554 mặt) vì coi là mảnh vụn, gần như chắc là thanh ngang đỡ tổ: hai tổ trên lơ lửng cạnh cột (mọi góc) và có một mảng mờ bán trong suốt nối tổ phải với tổ giữa. Bản thân thanh ngang trong concept tạo hình thánh giá, nên dựng lại cần đổi cách gắn tổ (vd. tay đỡ lệch độ cao), không chỉ trả thanh ngang về. |
| [A08.2 Drystone wall module](act-01/environments/A08_poppy_reach/A08_2_drystone_wall/) | 5,7 MB | 8.606 | 3,2 m × 0,7 m, cao 1,3 m | R14 v0, 8K | `act1-a08-2-drystone-wall.glb` | Module dài 3,2 m thì tường chỉ cao 0,84 m (spec 1,3). Mặt sau là tường đá đúng. |
| [A08.2-stile Squeeze stile in a drystone wall](act-01/environments/A08_poppy_reach/A08_2_squeeze_stile/) | 6,4 MB | 9.730 | 3,2 m × 0,7 m, cao 1,3 m | R14 v0, 8K | `act1-a08-2-squeeze-stile.glb` | **Làm lại.** Không có khe: tường liền một dải (cao 0,6–0,89 m), map cần khe đi qua 1,8 m. Dùng được làm module tường đá thứ hai. Chỉ có đá bậc nhô ra phía trước. |
| [A08.3 Abandoned hillside farmhouse](act-01/environments/A08_poppy_reach/A08_3_farmhouse/) | 25,0 MB | 13.584 | 8 m × 5,4 m, cao 6,4 m | R13 v3, 4K | `act1-a08-3-farmhouse.glb` | Nhà kín: cửa ván đóng ở đầu hồi +x, mái còn nguyên (không sập mái đông, không thấy giường từ trên); sâu 7,2 m (spec 5,4). Mặt sau có cửa sổ vỡ nhỏ và mép mái võng (chấp nhận được). |
| [A08.4 Hay rick](act-01/environments/A08_poppy_reach/A08_4_hay_rick/) | 3,0 MB | 3.774 | 3 m × 3 m, cao 3,2 m | R13 v3, 4K | `act1-a08-4-hay-rick.glb` | — |
| [A08.5 Field gate between stone posts](act-01/environments/A08_poppy_reach/A08_5_field_gate/) | 6,1 MB | 10.027 | 4,4 m × 0,7 m, cao 1,6 m | R14 v0, 8K | `act1-a08-5-field-gate.glb` | Cổng năm thanh đóng kín, map cần cổng mở. |
| [A08.6 Poppy-drying rack](act-01/environments/A08_poppy_reach/A08_6_poppy_rack/) | 6,8 MB | 10.860 | 3,6 m × 1,4 m, cao 2,3 m | R15 v1, 4K | `act1-a08-6-poppy-rack.glb` | Cao khoảng 2,9 m khi rộng 3,6 m (spec 2,3 m); hai đầu khung chữ A bắt chéo thành chữ X, không phải thánh giá. |
| [A11.1 Whitewashed cloister bay](act-01/environments/A11_gentle_house/A11_1_cloister_bay/) | 7,0 MB | 6.571 | 5,4 m × 2,16 m, cao 4,32 m | R16 v1, 4K | `act1-a11-1-cloister-bay.glb` | Vòm rộng 1,05–1,2 m; mái chái dính vào model (map tách riêng mái này). Mặt sau là tường trơn (hợp lý). |
| [A11.2 Hospice bed](act-01/environments/A11_gentle_house/A11_2_hospice_bed/) | 3,1 MB | 2.194 | 1,08 m × 2,16 m, cao 0,72 m | R17 v0, 8K | `act1-a11-2-hospice-bed.glb` | Giường rộng 1,71 m (spec 1,08), đầu giường cao 1,07 m, mặt nệm 0,65 m; GLB gốc lệch 9,7° (bản lab đã chỉnh). |
| [A11.3 Refectory table with bread](act-01/environments/A11_gentle_house/A11_3_refectory_table/) | 5,0 MB | 9.167 | 4,32 m × 1,44 m, cao 0,81 m | R18 v1, 4K | `act1-a11-3-refectory-table.glb` | Dài 4,32 m thì mặt bàn cao 1,2 m (spec 0,81); bình và hoa cao tới 2,07 m. Ghế dài là mảnh riêng, đúng. |
| [A11.4 Gate tower](act-01/environments/A11_gentle_house/A11_4_gate_tower/) | 21,9 MB | 14.477 | 4,32 m × 4,32 m, cao 7,2 m | R16 v1, 4K | `act1-a11-4-gate-tower.glb` | **Làm lại.** Không có lối xuyên: vòm trước dẫn vào sảnh bịt tường sau, mặt +x hở dưới khoảng 4 m. Cần dựng lại. Đáy sâu khoảng gấp 1,5 lần bề rộng (concept vuông). |
| [A11.5 Kitchen hearth with cauldron](act-01/environments/A11_gentle_house/A11_5_kitchen_hearth/) | 11,7 MB | 26.348 | 3,6 m × 1,8 m, cao 2,88 m | R17 v0, 8K | `act1-a11-5-kitchen-hearth.glb` | Rộng 2,3 m (spec 3,6). |
| [A11.6 Steady candle stand](act-01/environments/A11_gentle_house/A11_6_candle_stand/) | 1,0 MB | 4.102 | 0,9 m × 0,9 m, cao 2,34 m | R17 v0, 8K | `act1-a11-6-candle-stand.glb` | Thân cột nghiêng 11,9° trong GLB gốc (bản lab đã dựng thẳng). Thấy rõ thân nghiêng ở góc bên và góc sau của GLB gốc. |
| [A13.1 Sleeping bed furrow](act-01/environments/A13_garden_of_hush/A13_1_bed_furrow/) | 4,6 MB | 4.567 | 1,4 m × 2,7 m, cao 0,5 m | R20 v2, 8K | `act1-a13-1-bed-furrow.glb` | — |
| [A13.2 Cloth canopy frame](act-01/environments/A13_garden_of_hush/A13_2_canopy_frame/) | 2,5 MB | 5.333 | 6,3 m × 4,32 m, cao 4,32 m | R19 v2, 4K | `act1-a13-2-canopy-frame.glb` | Bốn cột nghiêng, không thành hình chữ nhật; tấm vải võng xuống còn khoảng 2,4 m. |
| [A13.3 Pink night-light jar](act-01/environments/A13_garden_of_hush/A13_3_night_light_jar/) | 2,1 MB | 4.376 | 0,63 m × 0,63 m, cao 0,81 m | R20 v2, 8K | `act1-a13-3-night-light-jar.glb` | — |
| [A13.4 Hush bell post](act-01/environments/A13_garden_of_hush/A13_4_bell_post/) | 4,3 MB | 13.991 | 1,62 m × 0,7 m, cao 3,6 m | R20 v2, 8K | `act1-a13-4-bell-post.glb`, `act1-a13-4-bell-post-trim.glb` | Cột nhô 0,3 m trên thanh ngang, có thể giống thánh giá: đã có bản -trim, chờ người dùng chọn; GLB gốc để thanh chéo (bản lab xoay −62,7°). Trông như thánh giá ở góc trước và 45°; nhìn từ sau các chuông dồn thành một cục. |
| [A13.5 Root-vaulted wall bay](act-01/environments/A13_garden_of_hush/A13_5_root_wall_bay/) | 16,8 MB | 15.233 | 5,4 m × 1,8 m, cao 5,04 m | R19 v2, 4K | `act1-a13-5-root-wall-bay.glb` | Rộng 5,4 m thì chỉ cao 3,5 m (spec 5,04); hốc nông, không đi xuyên được. Mặt sau là vòm đất trơn tự bịa, không có gạch. |
| [A13.6 Poppy furrow](act-01/environments/A13_garden_of_hush/A13_6_poppy_furrow/) | 5,7 MB | 10.676 | 4,32 m × 1,62 m, cao 1,26 m | R20 v2, 8K | `act1-a13-6-poppy-furrow.glb` | — |
| [A14.1 Bone-rail crib frame](act-01/environments/A14_the_cradle/A14_1_crib_frame/) | 22,0 MB | 14.455 | 6,3 m × 3,6 m, cao 3,6 m | R21 v2, 4K | `act1-a14-1-crib-frame.glb` | GLB gốc lệch 11,5° (bản lab đã chỉnh). |
| [A14.2 Linen curtain pair](act-01/environments/A14_the_cradle/A14_2_curtain_pair/) | 3,4 MB | 5.362 | 4,32 m × 0,7 m, cao 5,4 m | R21 v2, 4K | `act1-a14-2-curtain-pair.glb` | — |
| [A14.3 Milk-white night-light](act-01/environments/A14_the_cradle/A14_3_milk_night_light/) | 2,6 MB | 3.399 | 1,08 m × 1,08 m, cao 2,16 m | R22 v0, 8K | `act1-a14-3-milk-night-light.glb` | — |
| [A14.4 Bone mobile on stand](act-01/environments/A14_the_cradle/A14_4_bone_mobile/) | 7,0 MB | 26.294 | 2,52 m × 0,9 m, cao 3,24 m | R22 v0, 8K | `act1-a14-4-bone-mobile.glb` | — |
| [A14.5 Quilted floor platform](act-01/environments/A14_the_cradle/A14_5_quilted_platform/) | 5,2 MB | 8.343 | 5,4 m × 5,4 m, cao 0,72 m | R18 v1, 4K | `act1-a14-5-quilted-platform.glb` | Gối nệm cao tới 1,32 m (spec 0,72); GLB gốc xoay 29° (bản lab đã chỉnh). |
| [A14.6 Rocker runner pair](act-01/environments/A14_the_cradle/A14_6_rocker_runners/) | 5,4 MB | 1.664 | 5,4 m × 2,88 m, cao 1,44 m | R22 v0, 8K | `act1-a14-6-rocker-runners.glb` | — |
| [A21.1 Barrow vault door](act-01/environments/A21_barrow_terrace_fen_stones/A21_1_barrow_door/) | 7,2 MB | 8.956 | 2,4 m × 0,8 m, cao 2,8 m | R25 v2, 4K | `act1-a21-1-barrow-door.glb` | Mặt sau có bản sao cánh cửa lật ngược (tự bịa); lùn hơn concept: cao khoảng 1,8 m khi rộng 2,4 m (spec 2,8 m). |
| [A21.2 Flint retaining wall](act-01/environments/A21_barrow_terrace_fen_stones/A21_2_flint_retaining_wall/) | 8,1 MB | 6.760 | 4 m × 0,9 m, cao 3,2 m | R25 v2, 4K | `act1-a21-2-flint-retaining-wall.glb` | Mặt tường là mấy tấm rời trước khung (giữ cả); 3 variant còn lại chỉ có khung rỗng. Mặt sau là đá lửa trơn (ổn). |
| [A21.3 Peat stack](act-01/environments/A21_barrow_terrace_fen_stones/A21_3_peat_stack/) | 6,8 MB | 10.856 | 1,6 m × 1 m, cao 1,1 m | R27 v1, 8K | `act1-a21-3-peat-stack.glb` | Dẹt hơn concept: cao khoảng 0,66 m khi rộng 1,6 m (spec 1,1 m). |
| [A21.4 Vigil chair](act-01/environments/A21_barrow_terrace_fen_stones/A21_4_vigil_chair/) | 2,2 MB | 3.278 | 0,6 m × 0,6 m, cao 0,95 m | R27 v1, 8K | `act1-a21-4-vigil-chair.glb` | Hai mảnh, giữ cả. |
| [A21.5 The leaning stones (A17.1 v2)](act-01/environments/A21_barrow_terrace_fen_stones/A21_5_leaning_stones/) | 4,6 MB | 840 | 4,6 m × 1,4 m, cao 4,6 m | R23 v1, 4K | `act1-a21-5-leaning-stones.glb`, `act1-a21-5-leaning-stones-wide.glb` | Bản v2 của A17.1 (id bản đồ vẫn là A17.1). Lối đi đo được 1,78 m ở độ cao 2,2 m (1,65 m sát đất) khi rộng 4,6 m; spec 2,6 m nên trong lab kéo ngang khoảng ×1,46. Khối dựng ra 4,6 × 4,30 × 2,30 m (spec 4,6 × 4,6 × 1,4). Ít đa giác (840 tam giác). |
| [A21.6 Bog grave](act-01/environments/A21_barrow_terrace_fen_stones/A21_6_bog_grave/) | 9,8 MB | 12.746 | 1,3 m × 2,4 m, cao 1,6 m | R27 v1, 8K | `act1-a21-6-bog-grave.glb` | Cọc và dải vải là mảnh rời cắm trên mộ (giữ cả). |
| [A22.1 Worn shoes (pair)](act-01/environments/A22_things_left_behind/A22_1_worn_shoes/) | 2,3 MB | 4.957 | 0,45 m × 0,45 m, cao 0,16 m | R29 v2, 8K | `act1-a22-1-worn-shoes.glb` | Đôi giày dính thành một khối, giữ thẳng. Dùng cho cả N-FN02 và N-GD11. |
| [A22.2 Toll post with coin dish](act-01/environments/A22_things_left_behind/A22_2_toll_post/) | 4,3 MB | 5.021 | 0,5 m × 0,5 m, cao 1,3 m | R28 v2, 8K | `act1-a22-2-toll-post.glb` | Ba mảnh chồng nhau (chân có cuộn thừng, cột, đĩa), giữ cả. Không giống thánh giá: kệ đĩa chỉ chìa một bên; có đuôi thừng và thẻ gỗ. |
| [A22.3 Empty wicker cradle](act-01/environments/A22_things_left_behind/A22_3_wicker_cradle/) | 26,8 MB | 18.318 | 1 m × 0,6 m, cao 0,75 m | R29 v2, 8K | `act1-a22-3-wicker-cradle.glb` | Giữ thẳng (chân đu cong). |
| [A22.4 Harvester's cairn](act-01/environments/A22_things_left_behind/A22_4_harvester_cairn/) | 9,3 MB | 18.906 | 1,2 m × 1,2 m, cao 1,1 m | R28 v2, 8K | `act1-a22-4-harvester-cairn.glb` | — |
| [A22.5 Crook and folded coat](act-01/environments/A22_things_left_behind/A22_5_crook_and_coat/) | 3,8 MB | 5.294 | 0,9 m × 0,5 m, cao 1,6 m | R28 v2, 8K | `act1-a22-5-crook-and-coat.glb` | — |
| [A22.6 Straw doll](act-01/environments/A22_things_left_behind/A22_6_straw_doll/) | 3,3 MB | 7.564 | 0,3 m × 0,2 m, cao 0,35 m | R29 v2, 8K | `act1-a22-6-straw-doll.glb` | Quay mặt về phía camera như trong ảnh. |
| [A23.1 Abandoned reaping](act-01/environments/A23_poppy_reach_to_the_garth/A23_1_abandoned_reaping/) | 6,8 MB | 13.941 | 2,4 m × 2 m, cao 1,1 m | R30 v1, 8K | `act1-a23-1-abandoned-reaping.glb` | **Làm lại.** Hai mảnh, giữ cả. Lưỡi hái chìa ra giữa không trung từ bó lúa đội mũ, bình treo lủng lẳng trên cán (concept: lưỡi hái nằm trên đất, bình đứng cạnh); nhìn từ sau cả hai lơ lửng khỏi nền. Mất hoa anh túc đỏ, bó lúa trông như gốc cây rỗng. Sửa trong Blender (đặt lưỡi hái và bình xuống đất) hoặc dựng lại. |
| [A23.2 Ribbon thorn](act-01/environments/A23_poppy_reach_to_the_garth/A23_2_ribbon_thorn/) | 19,7 MB | 12.828 | 6 m × 5 m, cao 5,5 m | R24 v2, 4K | `act1-a23-2-ribbon-thorn.glb` | Giữ thẳng như Tripo dựng. Tán là mấy khối mịn có ngọn cành. Mặt sau ít dải vải hơn, gần như chỉ còn màu đỏ. |
| [A23.3 Garth flower bed](act-01/environments/A23_poppy_reach_to_the_garth/A23_3_garth_flower_bed/) | 8,1 MB | 12.071 | 3,2 m × 3,2 m, cao 0,55 m | R30 v1, 8K | `act1-a23-3-garth-flower-bed.glb` | — |
| [A23.4 Potted flowers](act-01/environments/A23_poppy_reach_to_the_garth/A23_4_potted_flowers/) | 2,3 MB | 7.262 | 0,6 m × 0,6 m, cao 0,75 m | R30 v1, 8K | `act1-a23-4-potted-flowers.glb` | Thiếu cành oải hương; nhiều hoa xám xanh xỉn thay vì màu kem; ít hoa hơn concept. |
| [A23.5 Walled flower bed](act-01/environments/A23_poppy_reach_to_the_garth/A23_5_walled_flower_bed/) | 5,3 MB | 8.682 | 4 m × 1,4 m, cao 0,5 m | R30 v1, 8K | `act1-a23-5-walled-flower-bed.glb` | Thiếu cành oải hương và hoa trắng; bồn gần như chỉ có lá nhọn kiểu cây thùa và vài bông hoa dẹt. |
| [A23.6 Linen drying line](act-01/environments/A23_poppy_reach_to_the_garth/A23_6_drying_line/) | 1,4 MB | 914 | 6 m × 0,3 m, cao 2,2 m | R26 v3, 4K | `act1-a23-6-drying-line.glb` | Ít đa giác (914 tam giác). |
| [A24.1 Kitchen work table](act-01/environments/A24_mercy_linen_and_bread/A24_1_kitchen_table/) | 3,4 MB | 3.540 | 2,4 m × 1 m, cao 0,9 m | R31 v1, 8K | `act1-a24-1-kitchen-table.glb` | Nhiều mảnh rời, giữ cả. |
| [A24.2 Bread rack](act-01/environments/A24_mercy_linen_and_bread/A24_2_bread_rack/) | 18,3 MB | 11.010 | 1,6 m × 0,5 m, cao 1,8 m | R31r v3, 4K | `act1-a24-2-bread-rack.glb` | Dựng riêng (hàng R31r) từ ảnh cắt bằng code của R31: cả 4 variant của R31 dính một tấm ván lớn lên kệ trên cùng (bản bị loại để ở rows/R31_*/_split/). |
| [A24.3 Linen folding table](act-01/environments/A24_mercy_linen_and_bread/A24_3_linen_folding_table/) | 5,7 MB | 12.296 | 2,4 m × 1 m, cao 0,9 m | R31 v1, 8K | `act1-a24-3-linen-folding-table.glb` | Nhiều mảnh rời, giữ cả. |
| [A24.4 Turned-down coverlet](act-01/environments/A24_mercy_linen_and_bread/A24_4_turned_down_coverlet/) | 7,3 MB | 11.742 | 1,14 m × 1,9 m, cao 0,12 m | R32 v1, 8K | `act1-a24-4-turned-down-coverlet.glb` | Giữ thẳng. Đặt trên luống A13.1. |
| [A24.5 Turned-down quilt](act-01/environments/A24_mercy_linen_and_bread/A24_5_turned_down_quilt/) | 8,6 MB | 16.500 | 3 m × 2,6 m, cao 0,24 m | R32 v1, 8K | `act1-a24-5-turned-down-quilt.glb` | Giữ thẳng. Đặt trên A14.5. |
| [A24.6 Linen pillow](act-01/environments/A24_mercy_linen_and_bread/A24_6_linen_pillow/) | 3,2 MB | 5.951 | 1,5 m × 0,75 m, cao 0,32 m | R32 v1, 8K | `act1-a24-6-linen-pillow.glb` | Giữ thẳng. Ba sọc đỏ mảnh như concept (brief: một dải). |
| [A25.1 Root rib arch](act-01/environments/A25_garden_roots_and_tending/A25_1_root_rib_arch/) | 20,8 MB | 18.973 | 6,5 m × 0,5 m, cao 4,9 m | R23 v1, 4K | `act1-a25-1-root-rib-arch.glb`, `act1-a25-1-root-rib-arch-slim.glb` | Chân rễ toả sâu khoảng 5 m khi rộng 6,5 m (spec dày 0,5 m). Thấy rõ ở góc bên; vòm và mặt sau ổn. |
| [A25.2 Plank crossing](act-01/environments/A25_garden_roots_and_tending/A25_2_plank_crossing/) | 6,4 MB | 1.444 | 1,5 m × 2,3 m, cao 0,1 m | R33 v0, 8K | `act1-a25-2-plank-crossing.glb` | Hai mảnh, giữ cả. Ván cong vênh, ít đa giác (1.444 tam giác), có khe hở nhìn xuyên; concept ván khít nhau. |
| [A25.3 Root fall](act-01/environments/A25_garden_roots_and_tending/A25_3_root_fall/) | 17,8 MB | 18.177 | 4,6 m × 5,4 m, cao 2,6 m | R26 v3, 4K | `act1-a25-3-root-fall.glb` | Giữ thẳng (bộ cân bằng tự động lật nó 23°). |
| [A25.4 Harvest basket](act-01/environments/A25_garden_roots_and_tending/A25_4_harvest_basket/) | 6,5 MB | 15.208 | 0,56 m × 0,56 m, cao 0,45 m | R33 v0, 8K | `act1-a25-4-harvest-basket.glb` | Đã cắt mấy cánh hoa đỏ dưới sàn cạnh giỏ (3 mảnh, 360 mặt); quả rơi giữ lại. Hoa anh túc đỏ giữa các quả chỉ còn vệt đỏ nhỏ. |
| [A25.5 Tending kit](act-01/environments/A25_garden_roots_and_tending/A25_5_tending_kit/) | 3,5 MB | 2.444 | 1 m × 0,45 m, cao 0,5 m | R33 v0, 8K | `act1-a25-5-tending-kit.glb` | Ghế, sách và bình tưới; hoa sen vòi là mảnh rời, giữ lại. |
| [A25.6 Tamsin's lantern](act-01/environments/A25_garden_roots_and_tending/A25_6_tamsin_lantern/) | 3,5 MB | 24.145 | 0,3 m × 0,6 m, cao 1 m | R33 v0, 8K | `act1-a25-6-tamsin-lantern.glb` | Quay về phía camera như trong ảnh; đèn treo bằng móc trên cành. |

Credit: 5.115 cho 34 lần dựng (R01–R33 và R31r), tính theo log từng bước.

### Prop: `act-01/environments/<nhóm>/<vật>/` kit v2 (nhóm bổ sung A26–A33; lô dựng ở `act-01/_batches/kit_v2/`, 27/10)

Concept: sheet perspective của A26–A32 và concept A33 (không có turnaround). 22 ảnh hàng cho 60 asset (A26–A33 và G15–G17), duyệt ở `act-01/_batches/kit_v2/ROWS_QA.md`. Cách dựng giống kit v1: Tripo Studio dựng cả hàng một lượt (Smart Mesh một ảnh, 4 variant, Smart UV, texture, PBR), rồi `_tools/split_rows.py` (bản sao của kit v1, chạy được cho cả hai act) tách mỗi vật thành một GLB: mặt trước quay +z, pivot giữa đáy, cạnh dài nhất 1, texture riêng cắt từ atlas của hàng. Tham số ở `_tools/rows.json`, số đo ở `rows/<hàng>/_split/split.json`. Hàng R34 gom cả ba waypoint, nên G15.1 nằm ở cây Act II (mục kế tiếp).

Dừng giữa chừng vì hết credit (27/10): mới xong hàng R34 và GR01. R35, GR02, GR03 đã có mesh nhưng chưa texture; 17 hàng còn lại chưa dựng. Tiến độ, variant, credit và cách làm tiếp: `act-01/_batches/kit_v2/TRIPO_PROGRESS.md`. Ảnh tổng: `act-01/_batches/kit_v2/_review/act1_kit_v2_gapfill.png`. Chưa có bản trong lab.

| Vật | GLB | Tam giác | Kích thước thật | Hàng | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| [A31.6 Wayside ossuary (waypoint)](act-01/environments/A31_old_face_and_ossuaries/A31_6_wayside_ossuary/) | 5,4 MB | 5.703 | 1,8 m × 1,8 m, cao 2,8 m | R34 v0, 8K | Ổn. Mặt sau là tường đá trơn (Tripo tự đoán). |
| [A33.1 Waypoint altar](act-01/environments/A33_waypoint_altar/A33_1_waypoint_altar/) | 8,2 MB | 9.586 | 4,2 m × 4,2 m, cao 3,05 m | R34 v0, 8K | Tượng, cột đèn và bệ là mảnh rời (giữ cả). Bệ không vuông: sâu hơn rộng khoảng 1,25 lần, một cạnh hơi vát. |

### Prop: `act-02/environments/<nhóm>/<vật>/` kit v1 (nhóm bổ sung G15–G17, đủ 18/18; lô dựng ở `act-02/_batches/kit_v1/`, 27–28/10)

Cùng lô và cùng công cụ với kit v2 Act I ở trên (ảnh hàng GR01–GR07 trong `act-02/_batches/kit_v1/rows/`, công cụ tách ở `act-01/_batches/kit_v2/_tools/`). Ảnh tổng: `act-02/_batches/kit_v1/_review/act2_kit_v1_gapfill.png`. Chưa có bản trong lab.

| Vật | GLB | Tam giác | Kích thước thật | Hàng | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| [G15.1 Sepulcra ossuary (waypoint)](act-02/environments/G15_lowcourse_ossuary_and_wall/G15_1_sepulcra_ossuary/) | 7,9 MB | 15.800 | 3 m × 1,5 m, cao 4 m | R34 v0, 8K | Dày hơn spec: sâu khoảng 2,6 m khi cao 4 m. Mặt sau lặp lại hốc sọ của mặt trước. Giá đèn và đèn là mảnh rời (giữ cả). |
| [G15.2 Exhumer watch post](act-02/environments/G15_lowcourse_ossuary_and_wall/G15_2_exhumer_watch_post/) | 4,6 MB | 8.646 | 3 m × 2 m, cao 2,8 m | GR05 v0, 4K | Ổn, giống concept. |
| [G15.3 Old Vellum's star table](act-02/environments/G15_lowcourse_ossuary_and_wall/G15_3_old_vellum_star_table/) | 2,4 MB | 8.415 | 2 m × 1,2 m, cao 1,8 m | GR05 v0, 4K | Bàn và ghế đẩu là hai mảnh rời (giữ cả). |
| [G15.4 Archsexton's street pulpit](act-02/environments/G15_lowcourse_ossuary_and_wall/G15_4_archsexton_street_pulpit/) | 3,2 MB | 3.937 | 2,4 m × 2 m, cao 3,2 m | GR05 v0, 4K | Ổn, giống concept. |
| [G15.5 Wall face of Sepulcra](act-02/environments/G15_lowcourse_ossuary_and_wall/G15_5_sepulcra_wall_face/) | 25,5 MB | 26.526 | 6 m × 2 m, cao 8 m | GR04 v0, 4K | Ổn, giống concept. |
| [G15.6 Ash drift and soot gutter](act-02/environments/G15_lowcourse_ossuary_and_wall/G15_6_ash_drift_soot_gutter/) | 1,2 MB | 10.682 | 3 m × 2 m, cao 0,5 m | GR05 v0, 4K | Mảng tro mỏng sát nền. |
| [G16.1 The Nameless Saint colossus](act-02/environments/G16_cathedral_colossus_and_after/G16_1_nameless_saint_colossus/) | 24,6 MB | 16.747 | 10 m × 9 m, cao 14 m | GR01 v2, 4K | Giống concept. Thanh đá trên vai là hai mảnh rời (giữ cả). Thấp hơn spec: cao khoảng 9,1 m khi rộng 10 m. |
| [G16.2 Cathedral organ](act-02/environments/G16_cathedral_colossus_and_after/G16_2_cathedral_organ/) | 10,1 MB | 22.651 | 6 m × 2,5 m, cao 9 m | GR02 v2, 4K | Nhiều chóp nhọn như concept. |
| [G16.3 Cathedral west portal](act-02/environments/G16_cathedral_colossus_and_after/G16_3_cathedral_west_portal/) | 5 MB | 7.145 | 7 m × 2,5 m, cao 10 m | GR02 v2, 4K | Bước tách tự xoay 22,3°: kiểm hướng mặt trước khi đặt. |
| [G16.4 Choir screen](act-02/environments/G16_cathedral_colossus_and_after/G16_4_choir_screen/) | 3,6 MB | 13.307 | 6 m × 1 m, cao 5 m | GR03 v3, 4K | Ổn, giống concept. |
| [G16.5 Open-roof vault bay](act-02/environments/G16_cathedral_colossus_and_after/G16_5_open_roof_vault_bay/) | 18,1 MB | 18.901 | 8 m × 4 m, cao 12 m | GR03 v3, 4K | Đống đổ nát và dầm gỗ là mảnh rời (giữ cả). |
| [G16.6 Fresh mortar patch](act-02/environments/G16_cathedral_colossus_and_after/G16_6_fresh_mortar_patch/) | 2,5 MB | 3.871 | 3 m × 0,6 m, cao 3 m | GR04 v0, 4K | Ổn, giống concept. |
| [G17.1 Cinder-Clan barricade](act-02/environments/G17_pilgrim_road_and_stair_extras/G17_1_cinder_clan_barricade/) | 4,7 MB | 18.163 | 4 m × 1,5 m, cao 1,8 m | GR06 v1, 4K | Ổn, giống concept. |
| [G17.2 Cinder-Clan fire pot](act-02/environments/G17_pilgrim_road_and_stair_extras/G17_2_cinder_clan_fire_pot/) | 1,9 MB | 2.710 | 1,6 m × 1,6 m, cao 1,3 m | GR06 v1, 4K | Ổn, giống concept. |
| [G17.3 Collapsing rope bridge](act-02/environments/G17_pilgrim_road_and_stair_extras/G17_3_collapsing_rope_bridge/) | 7,9 MB | 21.262 | 1,4 m × 6 m, cao 1,6 m | GR07 v1, 4K | Nghiêng 7,4° sau bước cân bằng (cầu võng). |
| [G17.4 Kneeler procession litter](act-02/environments/G17_pilgrim_road_and_stair_extras/G17_4_kneeler_procession_litter/) | 5,1 MB | 9.290 | 1,4 m × 3 m, cao 2,2 m | GR07 v1, 4K | Ổn, giống concept. |
| [G17.5 Snowbound pilgrim cart](act-02/environments/G17_pilgrim_road_and_stair_extras/G17_5_snowbound_pilgrim_cart/) | 3,2 MB | 5.964 | 2,4 m × 1,4 m, cao 1,4 m | GR06 v1, 4K | Ổn, giống concept. |
| [G17.6 Sepulcra street goods](act-02/environments/G17_pilgrim_road_and_stair_extras/G17_6_sepulcra_street_goods/) | 2,5 MB | 4.790 | 2 m × 1,2 m, cao 1,3 m | GR06 v1, 4K | Ổn, giống concept. |

Credit lô 27/10: 600 (5 lượt Generate, hoàn thiện R34 và GR01); số dư 2.423 → 833 vì một thread khác tiêu song song khoảng 990.

28/10: GR02–GR07 dựng lại từ đầu trên tài khoản artprojecthorus (Chrome profile riêng `tripo-cdp-horus`, cổng 9334; mesh GR02/GR03 của lượt 27/10 nằm ở tài khoản cũ nên bỏ). Polycount 15.000, texture 4K. 630 credit cho 6 hàng (25.200 → 24.570). Tripo lỗi máy chủ khoảng 15 phút giữa lô; các bước lỡ được chạy lại, không trả tiền hai lần.

## Bản dùng ở nơi khác

- **Lab:** `lookdev-lab/scripts/prepare-terrain-biomes-v1.py` đọc `common/clutter_v1/` và `common/dungeon_v1/`, scale về kích thước
  thật, texture 2048 JPEG, ghi vào `lookdev-lab/assets/terrain-biomes/` và đăng ký trong `lookdev-lab/src/assets/samples.json`
  (trường `source` trỏ về đây). Hai scene dùng chúng: "ASHLAR · Biome mix" và "Dungeon". Scene "ASHLAR · Prologue · The Old Face"
  (`?scene=oldFace`) cũng dùng các prop `common/dungeon_v1` (tường hầm xương, đống xương, cột gãy, cụm nến, đá lăn).
- **Lab, Act I:** `lookdev-lab/scripts/prepare-act1-extras.py` đọc 36 GLB trong `act-01/environments/A15_*...A20_*/` (tìm theo tên vật, không gắn cứng thư mục nhóm): dựng thẳng lại bản bị
  nghiêng (chỉ A20.3), xoay cho mặt trước khớp blockout Act I (mặt trước là +z, vài vật như nhà thờ, thuyền, bến, kênh tưới theo hướng
  của blockout, ghi trong script), scale đều về kích thước thật theo số đo concept nêu đầu tiên, pivot ở giữa đáy, texture 2048 JPEG
  (1024 cho A19.1–A19.3). Bản sao ở `lookdev-lab/assets/act1-extras/`, đăng ký trong `samples.json`. Bảng khớp kích thước với sáu base
  map: `tmp/act1-base-maps/ACT1_EXTRAS_FIT.md`.
- Hero và quái chưa vào lab. Khi được yêu cầu: texture 2048, đăng ký trong `samples.json` (mục D của Agent.md).
- gametest (từ 10-24 ở `E:/Horus/diablo222/ashlar/gametest`, ngoài repo) hiện chỉ dùng kit đồ trại, lều và hàng rào (không thuộc ASHLAR, nguồn ở `legacy/tripo-models/camp/` và
  `legacy/tripo-models/early_kits/`).
- Không chép thẳng GLB gốc (12–25 MB mỗi file, texture 4096) vào lab hay game.

## Thêm model mới

1. Tạo `ashlar/3d/<act>/<loại>/<ID>/` (cùng đường dẫn với concept 2D `ashlar/art/<act>/<loại>/<ID>/`: quái `act-01/monsters/<ID>`, prop `act-01/environments/<nhóm>/<vật>`, hero `heroes/<ID>/vA`, vũ khí `<chủ>/weapons/<món>`) và chép concept vào `concept.png`; file phụ vào `_work/`. `<asset_id>` gồm mã canon, tên và hướng thiết kế
   (`FL_flagellant_vA`, `D01_hodling`); GLB đặt cùng tên với thư mục.
2. Dựng theo `ashlar/pipeline/tripo/Agent.md`, lấy thư mục này làm `<asset_dir>`. Script Tripo vẫn ở
   `ashlar/pipeline/tripo/scripts/`.
3. Kiểm GLB theo mục D của Agent.md, rồi thêm một dòng vào danh mục ở trên.
4. Khi đưa vào lab hoặc game, ghi tên bản sao vào cột "Bản trong lab".

## Lịch sử

- 2026-10-21: tạo thư mục. Chuyển từ `art-output/tripo-models/`: `heroes/FL_flagellant_vA`, `monsters/D01_hodling`,
  `dungeon_v1` (thành `props/dungeon_v1`), `nature/clutter_v1` (thành `props/clutter_v1`). Script lab và `samples.json` đã trỏ
  sang đây. Các log viết trước ngày này (`tripo.log`, `tpose.log`, `_tasks/`, `logs/`, `run.out`) vẫn ghi đường dẫn cũ.
- 2026-10-21: thêm bản thử rig `heroes/FL_flagellant_vA/FL_flagellant_vA_rig.glb` và `rig/` (xem `rig-anim/ANIMATION_INVENTORY.md`).
- 2026-10-22: dựng lô quái đã chốt (nhóm `ashlar-chot` trong `legacy/bestiary/assets/CONCEPT_SOURCES.json`): 24 quái mới (B01–B04, D02,
  D04, F01, F02, P01, P02, P04–P07, U01–U05, W01–W03, W06, W07), 25 GLB tính cả xe nồi B03. Chưa dựng, ảnh đầu vào dừng vì Codex hết hạn
  mức (mở lại 2026-10-27 15:40): **B05** Hospice Mother (góc bên tay vươn ra trước, lệnh sửa soạn sẵn ở
  `E:\tmp_tripo_all\B05\jobs_edit1.json`), **P03** Hush-Moths (sheet trước/sau đạt, chưa có góc bên: `_tasks\jobs_sides1.json`),
  **W04** Mire-Sucker (chưa gen: `_tasks\jobs_fb1.json`). Vũ khí và đồ cầm tay ghi trong
  `brief.md` mỗi con (REMOVE) chưa dựng. D04, P01, U01 có base color 8192² do tài khoản đổi mặc định texture sang 8K giữa lô.
- 2026-10-22 (sáng, "làm nốt"): Codex vẫn khoá đến 2026-10-27, nên dựng nốt không cần ảnh Astra mới: **B05** và **P03** từ hai góc trước + sau (Tripo multi-view nhận 2 slot, vẫn 100 credit), **W04** từ bốn góc cắt thẳng trên concept. Thêm 9 vũ khí/đồ cầm tay vào `weapons/` (muôi D02, xẻng + bao F01, kim F02, lư hương P02, bọc P05, kiếm + khiên U02, cung U03), mỗi món một ảnh cắt từ cột WEAPON/PROP của concept. Đủ 28/28 quái đã chốt. Chưa dựng: đèn đêm B05 và xích kéo B03 (chỉ vẽ dính trên thân, cần ảnh Astra riêng). Tổng lượt này 12 asset × 145 = 1.740 credit.
- 2026-10-22 (tối): người dùng báo F01 và P05 lỗi tay. Xuất mesh trơn ba variant còn lại của mỗi con (miễn phí), soi tay cận cảnh trong Blender, chọn F01 variant 0 và P05 variant 3 (năm ngón sạch cả hai tay), chạy lại UV + texture 4K + PBR: 2 × 45 = 90 credit, không Generate mới. P05 variant 1 bị loại vì bàn tay trái thành một lưỡi phẳng.
- 2026-10-23: lập danh mục kit Act I `props/act1_kit_v1/` (86 asset: A01–A14 từ hàng R01–R22, A21–A25 từ R23–R33 và R31r): `manifest.json` cho cả 86 vật và mục danh mục ở trên. QA nhanh so với concept: 38 ổn, 44 có ghi chú, 4 cần làm lại (A07.6, A08.2-stile, A11.4, A23.1). GLB không đổi; A21–A25 chưa có bản trong lab.
- 2026-10-24 (vòng sắp xếp 3): cây 3D soi gương cây 2D (`art/<act>/<loại>/<ID>` <-> `3d/<act>/<loại>/<ID>`): `monsters/act-01/<ID>` thành `act-01/monsters/<ID>`; vũ khí `weapons/<chủ>_<món>` vào `<chủ>/weapons/<món>` (gậy PS vào `heroes/PS_pyre_singer/vA/weapons/pyre_staff`); `heroes/XX_name_vA` thành `heroes/XX_name/vA`; kit và extras Act I thành `act-01/environments/<nhóm>/<vật>` (hạ tầng lô ở `act-01/_batches/`); `dungeon_v1`, `clutter_v1` vào `common/`; `choice_hands_v1` thành `heroes/_hands_v1`. Mọi file phụ (`tripo.log`, `tpose.log`, `*.prompt.txt`, `_tasks/`, `_rejected/`, `_v*/`) vào `_work/` của từng asset. Log viết trước ngày này vẫn ghi đường dẫn cũ.
- 2026-10-24 (vòng sắp xếp 2): `monsters/<ID>` và `monsters/_review` thành `monsters/act-01/<ID>`; thử rig FL từ `ashlar/pipeline/tripo/heroes/` sang `heroes/FL_flagellant_vA/rig_sorceress/`; script Tripo `nature/_tools` thành `ashlar/pipeline/tripo/scripts/`; camp, nature, early_kits, rock_01, _shots, _texcheck, _downloads, _tools sang `legacy/tripo-models/`.
- 2026-10-27: dựng nốt hero đã chốt (BR vB/v5b, EX vA/v5, OS vA/v5, PB vA/v5b, FL vA/v5b) và 11 vũ khí tách riêng. T-pose Astra, người dùng duyệt; thân multi-view 4 góc, vũ khí một ảnh cắt từ dải vũ khí concept. FL dựng lại ở `heroes/FL_flagellant/vA_v5b/` (bản `vA/` cũ giữ nguyên vì có rig thử). Chrome không còn lưu file khi bấm Export trong trang: xuất bằng download cấp trình duyệt (`E:/tmp_hero_tripo/dlexport.mjs`, scratch). Ảnh `final_views.png` render bằng Blender Workbench (`E:/tmp_hero_tripo/render_views.py`) vì thao tác kéo xoay trong cửa sổ ẩn bị treo. Tài khoản 3323 → 398 credit (dự tính 16 × 145 = 2320; phần dư khoảng 600 chưa rõ nguyên nhân).
