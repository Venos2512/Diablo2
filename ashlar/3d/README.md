# ASHLAR — model 3D

Mọi model 3D của game ASHLAR nằm ở đây: hero, quái, prop. Mỗi asset một thư mục, gồm GLB gốc từ Tripo và các file làm ra nó
(concept, T-pose, log). Model không thuộc ASHLAR vẫn ở `art-output/tripo-models/`: đồ trại và nature Blood Moor / Act I
(`camp/`, `nature/`), `early_kits/`, `rock_01/`.

Quy trình dựng bằng Tripo: [`art-output/tripo-models/Agent.md`](../../art-output/tripo-models/Agent.md). Ảnh đầu vào theo
[`ashlar/artdirection.md`](../artdirection.md). Rig và animation (skeleton, clip, QA, kiểm kê):
[`rig-anim/Agent.md`](rig-anim/Agent.md).

## Cấu trúc

```text
ashlar/3d/
├─ README.md               quy ước và danh mục (file này)
├─ heroes/<asset_id>/      hero chơi được
├─ weapons/<asset_id>/     vũ khí và đạo cụ cầm tay riêng
├─ monsters/<asset_id>/    quái
├─ props/<lô>/<vật>/       prop môi trường, gom theo lô dựng
└─ rig-anim/               quy trình rig và animation, chuẩn skeleton, QA, kiểm kê clip
```

Nhóm mới (`npcs/`) tạo khi có model đầu tiên.

## Trong thư mục một asset

Hero và quái (Tripo multi-view, bốn góc T-pose):

| File | Nội dung |
| --- | --- |
| `concept.png` | concept gốc |
| `brief.md`, `design.txt` | ghi chú đọc concept; `design.txt` là bản canon cho skill T-pose |
| `tpose_front_back.png`, `tpose_sides.png`, `views/` | ảnh T-pose của Astra và bốn góc đã tách để upload |
| `<asset_id>.glb` | GLB gốc xuất từ Tripo |
| `_shots/` | `variants.png`, `variants.txt`, `final_views.png` (ảnh duyệt cuối) |
| `tripo.log`, `tpose.log`, `_tasks/` | credit, URL model, variant đã chọn, log phiên Astra |
| `_rejected/`, `_v*/` | ảnh bị loại và các lượt trước, giữ để đối chiếu |

Lô prop (Tripo một ảnh mỗi vật):

| File | Nội dung |
| --- | --- |
| `build_manifest.py`, `manifest.json`, `prompts/` | prompt ảnh đầu vào |
| `textures/` | ảnh đầu vào của Astra, hai phương án a/b mỗi vật |
| `logs/`, `run.out` | log tạo ảnh |
| `<vật>/concept.png` | phương án đã chọn |
| `<vật>/<lô>_<vật>.glb` | GLB gốc (tiền tố `dungeon_`, `clutter_`) |
| `<vật>/_shots/`, `<vật>/tripo.log` | ảnh mesh, ảnh bốn góc, credit |

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
| [PS Pyre Singer A](heroes/PS_pyre_singer_vA/) | `PS_pyre_singer_vA.glb`, 19,8 MB | 9.883 | chưa chốt; GLB nguồn cao ~1 m | chưa | Concept v5b, Tripo 2026-10-21, variant 0, 3 map 4096². Mesh chưa rig; gậy tách riêng. Lông/gấu áo nhọn và ngón tay còn thô ở cự ly gần; chưa kiểm biến dạng. `_shots/final_views.png`, `glb_validation.json` |
| [FL Flagellant A](heroes/FL_flagellant_vA/) | `FL_flagellant_vA.glb`, 20,7 MB | 10.488 | cao ~1,8 m (H) | chưa | GLB 2026-10-20, variant 0. Còn tồn tại: ngón tay dính thành khối, góc RIGHT có 9/10 nút; roi xích và sắt nung chưa dựng. Bản thử rig (skeleton Sorceress D2R, 181 bone, **chờ duyệt G2**, nội bộ không phát hành): `FL_flagellant_vA_rig.glb` 20,8 MB và `rig/` (blend, validation, qa, scripts). Bản gốc thử vẫn ở `art-output/tripo-models/heroes/FL_flagellant_vA_sorceress_rig/` |

### Vũ khí

| Asset | GLB | Tam giác | Kích thước thật | Bản trong lab | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| [PS Pyre Staff A](weapons/PS_pyre_staff_vA/) | `PS_pyre_staff_vA.glb`, 18,2 MB | 10.284 | mục tiêu ~1,4H; GLB nguồn cao ~1 m | chưa | Tripo 2026-10-21, variant 0, 3 map 4096²; riêng với hero, chưa rig/socket. Không có hiệu ứng lửa/khói; lồng than và đai quấn hơi thô. `_shots/final_views.png`, `glb_validation.json` |
| [D02 Kiln-Shaman ladle](weapons/D02_kiln_shaman_ladle/) | `D02_kiln_shaman_ladle.glb`, 11,7 MB | 11.180 | gậy ~0,75H (sheet); GLB nguồn 1 m | chưa | 2026-10-22, nhánh một ảnh: ảnh cắt từ cột WEAPON/PROP của concept (không có ảnh Astra), v1 (6400 faces). Muôi đất nung nứt trên cán gỗ quấn dây; không lửa. Chưa socket/rig. `brief.md`, `_shots/final_views.png` |
| [F01 Body-Snatcher spade](weapons/F01_body_snatcher_spade/) | `F01_body_snatcher_spade.glb`, 16,4 MB | 10.807 | cán ~0,5H (sheet); GLB nguồn 1 m | chưa | 2026-10-22, nhánh một ảnh: ảnh cắt từ cột WEAPON/PROP của concept (không có ảnh Astra), v1 (5787 faces). Xẻng cán chữ D, lưỡi sắt mòn. Chưa socket/rig. `brief.md`, `_shots/final_views.png` |
| [F01 Body-Snatcher sack](weapons/F01_body_snatcher_sack/) | `F01_body_snatcher_sack.glb`, 8,8 MB | 9.937 | rộng ~0,5H (sheet); GLB nguồn 1 m | chưa | 2026-10-22, nhánh một ảnh: ảnh cắt từ cột WEAPON/PROP của concept (không có ảnh Astra), v1 (5839 faces). Bao xác buộc ruy băng đỏ; đáy phẳng. Chưa socket/rig. `brief.md`, `_shots/final_views.png` |
| [F02 Poppy Nurse needle](weapons/F02_poppy_nurse_needle/) | `F02_poppy_nurse_needle.glb`, 12,6 MB | 10.193 | dài ~1,05H (sheet); GLB nguồn 1 m | chưa | 2026-10-22, nhánh một ảnh: ảnh cắt từ cột WEAPON/PROP của concept (không có ảnh Astra), v2 (5525 faces). Kim bạc rất mảnh; nhìn ngang Tripo thêm vây nhỏ dưới mũi, thân hơi lượn. Chưa socket/rig. `brief.md`, `_shots/final_views.png` |
| [P02 Hush-Herald censer](weapons/P02_hush_herald_censer/) | `P02_hush_herald_censer.glb`, 26,4 MB | 10.622 | quả cầu ~0,25H (sheet); GLB nguồn 1 m | chưa | 2026-10-22, nhánh một ảnh: ảnh cắt từ cột WEAPON/PROP của concept (không có ảnh Astra), v0 (6041 faces). Lư hương đồng + xích mắt to nằm trên đất như concept; xích treo tay cần cắt/rig trong engine. Chưa socket/rig. `brief.md`, `_shots/final_views.png` |
| [P05 Wet-Nurse bundle](weapons/P05_wet_nurse_bundle/) | `P05_wet_nurse_bundle.glb`, 11,7 MB | 10.104 | ~0,35H (sheet); GLB nguồn 1 m | chưa | 2026-10-22, nhánh một ảnh: ảnh cắt từ cột WEAPON/PROP của concept (không có ảnh Astra), v1 (5288 faces). Bọc vải buộc vải đỏ, hai đầu xương; một mảng vá phẳng bên hông. Chưa socket/rig. `brief.md`, `_shots/final_views.png` |
| [U02 Charnel Dead sword](weapons/U02_charnel_dead_sword/) | `U02_charnel_dead_sword.glb`, 22,2 MB | 10.840 | ~0,4H (sheet); GLB nguồn 1 m | chưa | 2026-10-22, nhánh một ảnh: ảnh cắt từ cột WEAPON/PROP của concept (không có ảnh Astra), v2 (5775 faces). Kiếm ngắn bản rộng. Chưa socket/rig. `brief.md`, `_shots/final_views.png` |
| [U02 Charnel Dead shield](weapons/U02_charnel_dead_shield/) | `U02_charnel_dead_shield.glb`, 25,3 MB | 9.967 | đường kính ~0,28H (sheet); GLB nguồn 1 m | chưa | 2026-10-22, nhánh một ảnh: ảnh cắt từ cột WEAPON/PROP của concept (không có ảnh Astra), v0 (5532 faces). Khiên ván nắp quan tài, viền và núm sắt; mặt sau Tripo tự dựng (có quai). Chưa socket/rig. `brief.md`, `_shots/final_views.png` |
| [U03 Charnel Bowman bow](weapons/U03_charnel_bowman_bow/) | `U03_charnel_bowman_bow.glb`, 12,1 MB | 8.727 | cao ~0,9H (sheet); GLB nguồn 1 m | chưa | 2026-10-22, nhánh một ảnh: ảnh cắt từ cột WEAPON/PROP của concept (không có ảnh Astra), v0 (4602 faces). Cung gỗ thủy tùng; dây cung rất mảnh, đứt quãng vài đoạn. Chưa socket/rig. `brief.md`, `_shots/final_views.png` |

### Quái

| Asset | GLB | Tam giác | Kích thước thật | Bản trong lab | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| [D01 Hodling B](monsters/D01_hodling/) | `D01_hodling.glb`, 14,8 MB | 10.668 | cao ~0,5 m (0,27H) | chưa | GLB 2026-10-20, variant 2. Còn tồn tại: góc mũ nhọn, tai hơi to, tay mảnh |
| [B02 Lullaby Man A](monsters/B02_lullaby_man/) | `B02_lullaby_man.glb`, 17,5 MB | 9.863 | mũ 2,2H, đỉnh lồng nôi 2,55H | chưa | 2026-10-22, variant 2 (5709 faces). Lồng nôi 3 bọc trên đầu/lưng dựng đặc; đường khâu mặt 4 mũi thay vì 3 |
| [B03 Ember-Pot A](monsters/B03_ember_pot/) | `B03_ember_pot.glb`, 24,4 MB; xe nồi `cart/B03_ember_pot_cart.glb` | 10.336 | hình người ~1H (thẳng lưng; concept gù) | chưa | 2026-10-22, variant 1 (6199 faces). Tách hai asset: hình người multi-view T-pose, xe nồi một ảnh (prop). Xích kéo chưa dựng |
| [B04 Willow Bride A](monsters/B04_willow_bride/) | `B04_willow_bride.glb`, 17,2 MB | 10.005 | ~1H, đuôi rễ rộng ~1H | chưa | 2026-10-22, variant 1 (5506 faces). Phần dưới là khối rễ thay chân (như váy dài) |
| [B05 Hospice Mother A](monsters/B05_hospice_mother/) | `B05_hospice_mother.glb`, 16,7 MB | 8.357 | ~3H (canon 2,75H) | chưa | 2026-10-22, variant 0 (5313 faces). 8 tay (4 cặp) dang ngang. Dựng từ **hai góc trước + sau** (góc bên của Astra vẽ tay vươn ra trước, chưa sửa được vì Codex hết hạn mức); độ dày áo do Tripo đoán. Đèn đêm xích dựng riêng (chưa làm, cần ảnh Astra) |
| [D02 Kiln-Shaman A](monsters/D02_kiln_shaman/) | `D02_kiln_shaman.glb`, 20,0 MB | 10.647 | canon đỉnh nồi 0,47H (sheet vẽ 0,77H) | chưa | 2026-10-22, variant 0 (6201 faces). Gậy muôi dựng riêng: [`weapons/D02_kiln_shaman_ladle`](weapons/D02_kiln_shaman_ladle/) |
| [D04 Tithe-Thief A](monsters/D04_tithe_thief/) | `D04_tithe_thief.glb`, 27,4 MB | 9.791 | canon 0,50H (sheet 0,68H) | chưa | 2026-10-22, variant 1 (5881 faces). **Base color 8192²** (tài khoản đổi mặc định sang 8K, 30 credit); thân hơi nghiêng dưới bao |
| [F01 Body-Snatcher A](monsters/F01_body_snatcher/) | `F01_body_snatcher.glb`, 14,2 MB | 10.161 | ~1H | chưa | 2026-10-22, variant 2 (6000 faces). Xẻng và bao xác dựng riêng: [`F01_body_snatcher_spade`](weapons/F01_body_snatcher_spade/), [`F01_body_snatcher_sack`](weapons/F01_body_snatcher_sack/) |
| [F02 Poppy Nurse A](monsters/F02_poppy_nurse/) | `F02_poppy_nurse.glb`, 15,8 MB | 9.978 | khăn trùm 1,08H | chưa | 2026-10-22, variant 2 (5438 faces). Kim dài bạc dựng riêng: [`F02_poppy_nurse_needle`](weapons/F02_poppy_nurse_needle/) |
| [P01 The Soothed A](monsters/P01_the_soothed/) | `P01_the_soothed.glb`, 30,7 MB | 10.216 | 0,95H | chưa | 2026-10-22, variant 1 (6274 faces). **Base color 8192²** (như D04) |
| [P02 Hush-Herald A](monsters/P02_hush_herald/) | `P02_hush_herald.glb`, 12,4 MB | 10.510 | đỉnh mũ chóp 1,22H | chưa | 2026-10-22, variant 1 (6307 faces). Lư hương xích dựng riêng: [`P02_hush_herald_censer`](weapons/P02_hush_herald_censer/); dải mắt 5 thay vì 4 |
| [P03 Hush-Moths A](monsters/P03_hush_moths/) | `P03_hush_moths.glb`, 11,8 MB | 10.378 | râu 0,33H, sải cánh ~0,75H | chưa | 2026-10-22, variant 2 (6188 faces). Một con của đàn; cánh dang một mặt phẳng đứng. Dựng từ **hai góc trước + sau** (sheet góc bên chưa gen); cánh trước/sau hơi lệch thành hai lớp |
| [P04 Hive-Sleeper A](monsters/P04_hive_sleeper/) | `P04_hive_sleeper.glb`, 21,9 MB | 8.664 | lưng 0,60H, thân dài 1,55H | chưa | 2026-10-22, variant 1 (5235 faces). Bò bằng tay và gối (pose `Qh`), ba vòm ấu trùng |
| [P05 Wet-Nurse B](monsters/P05_wet_nurse/) | `P05_wet_nurse.glb`, 19,1 MB | 10.710 | mũ 1,04H | chưa | 2026-10-22, variant 0 (6831 faces). T-pose chưa đạt hẳn (tay xệ 6–9°, tay ngắn hơn concept, chân hơi rộng), vẫn dựng được; lệnh sửa ảnh soạn sẵn ở `E:\tmp_tripo_all\P05_wet_nurse\jobs_fix_prepared.json` nếu cần dựng lại. Bọc vải cầm tay dựng riêng: [`P05_wet_nurse_bundle`](weapons/P05_wet_nurse_bundle/) |
| [P06 Poppy-Mound A](monsters/P06_poppy_mound/) | `P06_poppy_mound.glb`, 14,1 MB | 8.948 | rộng 2,5H | chưa | 2026-10-22, nhánh prop: một ảnh Astra 3/4 + Smart Mesh một ảnh, variant 1 (6053 faces). Tĩnh, không rig |
| [P07 Cradle-Warden A](monsters/P07_cradle_warden/) | `P07_cradle_warden.glb`, 19,2 MB | 10.941 | canon 2,2H (sheet 1,5H) | chưa | 2026-10-22, variant 0 (6554 faces). Lồng nôi trên lưng dựng đặc |
| [U01 Shambler A](monsters/U01_shambler/) | `U01_shambler.glb`, 24,5 MB | 9.629 | 0,95H | chưa | 2026-10-22, variant 0 (5784 faces). **Base color 8192²** (như D04) |
| [U02 Charnel Dead A](monsters/U02_charnel_dead/) | `U02_charnel_dead.glb`, 24,7 MB | 11.125 | 0,95H | chưa | 2026-10-22, variant 1 (6403 faces). Tay ngắn hơn concept ~10 % (span 1,22 so với 1,35); kiếm và khiên dựng riêng: [`U02_charnel_dead_sword`](weapons/U02_charnel_dead_sword/), [`U02_charnel_dead_shield`](weapons/U02_charnel_dead_shield/) |
| [U03 Charnel Bowman A](monsters/U03_charnel_bowman/) | `U03_charnel_bowman.glb`, 25,8 MB | 10.489 | 0,95H | chưa | 2026-10-22, variant 1 (6224 faces). Ống tên giữ trên lưng; cung dựng riêng: [`U03_charnel_bowman_bow`](weapons/U03_charnel_bowman_bow/) |
| [U04 Charnel Ghoul A](monsters/U04_charnel_ghoul/) | `U04_charnel_ghoul.glb`, 16,6 MB | 9.932 | đỉnh đầu 0,65H, thân dài 1,25H | chưa | 2026-10-22, variant 1 (6055 faces). Đứng nghỉ bốn chi (pose `Qh`); Tripo giữ được khoang hàm há |
| [U05 The Swollen A](monsters/U05_the_swollen/) | `U05_the_swollen.glb`, 18,4 MB | 8.902 | 0,95H, bụng 0,90H | chưa | 2026-10-22, variant 0 (5247 faces). Tay ngắn hơn concept (span 1,28 so với ~1,55) |
| [W01 Mortar-Rat B](monsters/W01_mortar_rat/) | `W01_mortar_rat.glb`, 27,7 MB | 10.590 | đỉnh đầu 0,22H | chưa | 2026-10-22, variant 1 (6006 faces). Chuột đứng, T-pose chân khuỷu ngược; mỗi cụm gai 5 nón thay vì 4 |
| [W02 Gibbet-Crow B](monsters/W02_gibbet_crow/) | `W02_gibbet_crow.glb`, 15,1 MB | 9.105 | đứng 0,36H, sải cánh 0,89H | chưa | 2026-10-22, mẫu họ W: cánh dang một mặt phẳng đứng, variant 0 (5615 faces). Concept vẽ cánh rủ; tư thế dang là để dựng mesh |
| [W03 Hush-Wolf A](monsters/W03_hush_wolf/) | `W03_hush_wolf.glb`, 16,3 MB | 9.999 | 0,95H | chưa | 2026-10-22, variant 1 (6108 faces). Chân khuỷu ngược; không có đuôi (concept không vẽ) |
| [W04 Mire-Sucker B](monsters/W04_mire_sucker/) | `W04_mire_sucker.glb`, 22,1 MB | 10.647 | đỉnh cánh 0,87H | chưa | 2026-10-22, variant 2 (6598 faces). **Bốn góc cắt thẳng từ concept** (concept đã vẽ dáng đứng nghỉ sạch; không có ảnh Astra): cánh xếp ra sau, màu xám trong như concept; hai túi máu tách rõ, sáu chân cà kheo |
| [W06 Willow-Hulk B](monsters/W06_willow_hulk/) | `W06_willow_hulk.glb`, 22,5 MB | 9.082 | canon 1,75H (sheet 1,22H) | chưa | 2026-10-22, variant 1 (5593 faces). Mảnh hơn concept, tay rễ dài |
| [W07 Shroud-Spinner A](monsters/W07_shroud_spinner/) | `W07_shroud_spinner.glb`, 13,4 MB | 10.446 | ~0,8H, sải chân ~1,55H | chưa | 2026-10-22, mẫu họ A (nhiều chân): variant 2 (6267 faces), đủ 8 chân tách rời |
| [B01 Sexton's Dog A](monsters/B01_sextons_dog/) | `B01_sextons_dog.glb`, 16,9 MB | 11.184 | vai ~0,55H (~1 m), dài ~1,2H; GLB nguồn dài 1 m | chưa | Họ Q, lượt Tripo đầu tiên của nhánh CREATURE (2026-10-22): multi-view bốn góc dáng đứng nghỉ, variant 0 (7044 faces), 3 map 4096². Bốn chân tách rời, vòng cổ, khoá và đuôi đúng chỗ. Texture phải upload lại bốn góc ở trang Texture. `_shots/final_views.png` |

### Prop: `props/dungeon_v1/` (hầm mộ và hang động, 2026-10-21)

Phương án a/b đã chọn ghi trong `ashlar/art/terrain-dungeon-v1/selection.json`. `crypt_wall` là module phẳng để ghép tường.

| Vật | GLB | Tam giác | Kích thước thật | Bản trong lab |
| --- | --- | --- | --- | --- |
| [sarcophagus](props/dungeon_v1/sarcophagus/) | 19,5 MB | 10.300 | dài 2,2 m | `dungeon-prop-sarcophagus.glb` |
| [bone_pile](props/dungeon_v1/bone_pile/) | 20,3 MB | 10.080 | rộng 1,2 m | `dungeon-prop-bone-pile.glb` |
| [broken_column](props/dungeon_v1/broken_column/) | 18,8 MB | 10.754 | cao 1,5 m | `dungeon-prop-broken-column.glb` |
| [candle_cluster](props/dungeon_v1/candle_cluster/) | 12,6 MB | 10.245 | 0,8 m | `dungeon-prop-candle-cluster.glb` |
| [fallen_bell](props/dungeon_v1/fallen_bell/) | 24,5 MB | 10.012 | 1,25 m | `dungeon-prop-fallen-bell.glb` |
| [crypt_wall](props/dungeon_v1/crypt_wall/) | 24,7 MB | 10.787 | rộng 4 m, cao 2,3 m | `dungeon-prop-crypt-wall.glb` |
| [stalagmites](props/dungeon_v1/stalagmites/) | 15,3 MB | 9.754 | cao 1,6 m | `dungeon-prop-stalagmites.glb` |
| [mine_timber](props/dungeon_v1/mine_timber/) | 14,6 MB | 9.902 | cao 2,6 m | `dungeon-prop-mine-timber.glb` |
| [flint_boulders](props/dungeon_v1/flint_boulders/) | 21,3 MB | 10.236 | rộng 2 m | `dungeon-prop-flint-boulders.glb` |

### Prop: `props/clutter_v1/` (đồ rải nền rừng, 2026-10-21)

| Vật | GLB | Tam giác | Kích thước thật | Bản trong lab |
| --- | --- | --- | --- | --- |
| [riverbank_stones](props/clutter_v1/riverbank_stones/) | 15,5 MB | 10.073 | rộng 1 m | `biome-prop-riverbank-stones.glb` |
| [mushroom_cluster](props/clutter_v1/mushroom_cluster/) | 16,6 MB | 8.902 | cao 0,3 m | `biome-prop-mushrooms.glb` |
| [mossy_stump](props/clutter_v1/mossy_stump/) | 11,7 MB | 10.540 | rộng 0,8 m, cao ~0,5 m | `biome-prop-stump.glb` |

### Prop: `props/act1_extras_v1/` (36 asset môi trường Act I A15–A20, 2026-10-22)

Concept: `ashlar/art/act-01-environments-v2/` (id, kích thước đề xuất, FRONT ở `README_VI.md`). Mỗi vật một ảnh Astra (`textures/<vật>_a.png`), Smart Mesh một ảnh, variant đã chọn ghi trong `<vật>/tripo.log`. Kích thước thật là đề xuất AD (W × D, cao); GLB Tripo chuẩn hoá cạnh dài 1 m.

| Vật | GLB | Tam giác | Kích thước thật | Bản trong lab |
| --- | --- | --- | --- | --- |
| [A15.1 Flint parish church](props/act1_extras_v1/A15_1_flint_church/) | 25,5 MB | 9.311 | 8 m × 16 m, cao 11 m | `act1-a15-1-flint-church.glb` |
| [A15.2 Brannoc's forge](props/act1_extras_v1/A15_2_forge/) | 14,6 MB | 9.782 | 6 m × 4,5 m, cao 4 m | `act1-a15-2-forge.glb` |
| [A15.3 Sleeper name board](props/act1_extras_v1/A15_3_name_board/) | 16,0 MB | 9.224 | 2,6 m × 0,6 m, cao 2,4 m | `act1-a15-3-name-board.glb` |
| [A15.4 Mourning bell frame](props/act1_extras_v1/A15_4_bell_frame/) | 21,1 MB | 9.973 | 2,2 m × 1,2 m, cao 3,4 m | `act1-a15-4-bell-frame.glb` |
| [A15.5 Grave-goods stall](props/act1_extras_v1/A15_5_grave_goods_stall/) | 20,9 MB | 8.536 | 3 m × 1,8 m, cao 2,6 m | `act1-a15-5-grave-goods-stall.glb` |
| [A15.6 Osric's watch post](props/act1_extras_v1/A15_6_watch_post/) | 17,6 MB | 8.836 | 3 m × 3 m, cao 4,2 m | `act1-a15-6-watch-post.glb` |
| [A16.1 Churchyard yew](props/act1_extras_v1/A16_1_yew/) | 15,0 MB | 7.208 | 8 m × 8 m, cao 9 m | `act1-a16-1-yew.glb` |
| [A16.2 Empty tarred gibbet](props/act1_extras_v1/A16_2_gibbet/) | 24,1 MB | 8.537 | 2 m × 0,8 m, cao 4,6 m | `act1-a16-2-gibbet.glb` |
| [A16.3 Grave with jar candles](props/act1_extras_v1/A16_3_jar_candle_grave/) | 24,3 MB | 6.653 | 0,9 m × 2,2 m, cao 0,8 m | `act1-a16-3-jar-candle-grave.glb` |
| [A16.4 Fresh grave](props/act1_extras_v1/A16_4_fresh_grave/) | 18,2 MB | 8.323 | 1 m × 2,4 m, cao 1,2 m | `act1-a16-4-fresh-grave.glb` |
| [A16.5 Unquiet grave](props/act1_extras_v1/A16_5_unquiet_grave/) | 21,6 MB | 7.761 | 1,2 m × 2,6 m, cao 1,3 m | `act1-a16-5-unquiet-grave.glb` |
| [A16.6 Sexton's lamp post](props/act1_extras_v1/A16_6_sexton_lamp/) | 10,9 MB | 9.910 | 0,9 m × 0,4 m, cao 2,6 m | `act1-a16-6-sexton-lamp.glb` |
| [A17.1 The leaning stones](props/act1_extras_v1/A17_1_leaning_stones/) | 29,9 MB | 9.434 | 3,5 m × 1 m, cao 4,6 m | `act1-a17-1-leaning-stones.glb` |
| [A17.2 Drowned bell tower](props/act1_extras_v1/A17_2_drowned_bell_tower/) | 32,4 MB | 9.114 | 4 m × 4 m, cao 10 m | `act1-a17-2-drowned-bell-tower.glb` |
| [A17.3 Gentle House boat](props/act1_extras_v1/A17_3_gentle_boat/) | 19,5 MB | 9.360 | 1,6 m × 7 m, cao 2,6 m | `act1-a17-3-gentle-boat.glb` |
| [A17.4 Flooded supper table](props/act1_extras_v1/A17_4_flooded_supper_table/) | 18,4 MB | 9.907 | 2,4 m × 1,5 m, cao 1 m | `act1-a17-4-flooded-supper-table.glb` |
| [A17.5 Flooded lace window](props/act1_extras_v1/A17_5_flooded_lace_window/) | 24,5 MB | 9.947 | 2,2 m × 0,5 m, cao 2,6 m | `act1-a17-5-flooded-lace-window.glb` |
| [A17.6 Gentle House dock](props/act1_extras_v1/A17_6_gentle_dock/) | 20,5 MB | 9.876 | 2 m × 6 m, cao 3 m | `act1-a17-6-gentle-dock.glb` |
| [A18.1 Abandoned ox cart](props/act1_extras_v1/A18_1_ox_cart/) | 23,6 MB | 9.413 | 1,8 m × 4 m, cao 1,6 m | `act1-a18-1-ox-cart.glb` |
| [A18.2 Bed with clean pillow](props/act1_extras_v1/A18_2_bed_clean_pillow/) | 17,6 MB | 7.781 | 1,2 m × 2 m, cao 1,1 m | `act1-a18-2-bed-clean-pillow.glb` |
| [A18.3 Flint Delvings mouth](props/act1_extras_v1/A18_3_delvings_mouth/) | 24,7 MB | 7.847 | 4 m × 2,5 m, cao 3,6 m | `act1-a18-3-delvings-mouth.glb` |
| [A18.4 Hospice ward range](props/act1_extras_v1/A18_4_hospice_range/) | 26,7 MB | 8.950 | 30 m × 9 m, cao 11 m | `act1-a18-4-hospice-range.glb` |
| [A18.5 Hospice wall niche](props/act1_extras_v1/A18_5_hospice_wall_niche/) | 16,7 MB | 9.127 | 6 m × 0,7 m, cao 3,2 m | `act1-a18-5-hospice-wall-niche.glb` |
| [A18.6 Hilltop steps](props/act1_extras_v1/A18_6_hilltop_steps/) | 15,8 MB | 8.209 | 4 m × 5 m, cao 2,5 m | `act1-a18-6-hilltop-steps.glb` |
| [A19.1 Flowers in a vase](props/act1_extras_v1/A19_1_vase_flowers/) | 16,5 MB | 7.862 | 0,2 m × 0,2 m, cao 0,5 m | `act1-a19-1-vase-flowers.glb` |
| [A19.2 Poppy tea tray](props/act1_extras_v1/A19_2_poppy_tea_tray/) | 17,3 MB | 10.430 | 0,5 m × 0,3 m, cao 0,2 m | `act1-a19-2-poppy-tea-tray.glb` |
| [A19.3 Window chair](props/act1_extras_v1/A19_3_window_chair/) | 21,4 MB | 9.440 | 1,1 m × 0,6 m, cao 1,2 m | `act1-a19-3-window-chair.glb` |
| [A19.4 Linen press](props/act1_extras_v1/A19_4_linen_press/) | 22,0 MB | 9.940 | 1,2 m × 0,5 m, cao 1,9 m | `act1-a19-4-linen-press.glb` |
| [A19.5 Linen screen](props/act1_extras_v1/A19_5_linen_screen/) | 23,6 MB | 9.914 | 2,4 m × 0,4 m, cao 1,8 m | `act1-a19-5-linen-screen.glb` |
| [A19.6 Tall ward window](props/act1_extras_v1/A19_6_tall_ward_window/) | 18,4 MB | 10.361 | 2,4 m × 0,6 m, cao 3,6 m | `act1-a19-6-tall-ward-window.glb` |
| [A20.1 Sleeper: young woman](props/act1_extras_v1/A20_1_sleeper_young_woman/) | 17,1 MB | 7.305 | 0,8 m × 2,1 m, cao 0,3 m | `act1-a20-1-sleeper-young-woman.glb` |
| [A20.2 Sleeper: old man](props/act1_extras_v1/A20_2_sleeper_old_man/) | 19,4 MB | 8.357 | 0,8 m × 2,1 m, cao 0,3 m | `act1-a20-2-sleeper-old-man.glb` |
| [A20.3 Sleeper: fisherman](props/act1_extras_v1/A20_3_sleeper_fisherman/) | 20,9 MB | 8.083 | 0,8 m × 2,1 m, cao 0,3 m | `act1-a20-3-sleeper-fisherman.glb` |
| [A20.4 Sleeper: farm woman](props/act1_extras_v1/A20_4_sleeper_farm_woman/) | 20,9 MB | 7.857 | 0,8 m × 2,1 m, cao 0,3 m | `act1-a20-4-sleeper-farm-woman.glb` |
| [A20.5 Irrigation channel](props/act1_extras_v1/A20_5_irrigation_channel/) | 29,6 MB | 8.296 | 1,4 m × 3 m, cao 1,2 m | `act1-a20-5-irrigation-channel.glb` |
| [A20.6 Harvest table](props/act1_extras_v1/A20_6_harvest_table/) | 22,5 MB | 9.512 | 2,6 m × 0,9 m, cao 2,2 m | `act1-a20-6-harvest-table.glb` |

## Bản dùng ở nơi khác

- **Lab:** `lookdev-lab/scripts/prepare-terrain-biomes-v1.py` đọc `props/clutter_v1/` và `props/dungeon_v1/`, scale về kích thước
  thật, texture 2048 JPEG, ghi vào `lookdev-lab/assets/terrain-biomes/` và đăng ký trong `lookdev-lab/src/assets/samples.json`
  (trường `source` trỏ về đây). Hai scene dùng chúng: "ASHLAR · Biome mix" và "Dungeon". Scene "ASHLAR · Prologue · The Old Face"
  (`?scene=oldFace`) cũng dùng các prop `dungeon_v1` (tường hầm xương, đống xương, cột gãy, cụm nến, đá lăn).
- **Lab, Act I:** `lookdev-lab/scripts/prepare-act1-extras.py` đọc 36 GLB trong `props/act1_extras_v1/`: dựng thẳng lại bản bị
  nghiêng (chỉ A20.3), xoay cho mặt trước khớp blockout Act I (mặt trước là +z, vài vật như nhà thờ, thuyền, bến, kênh tưới theo hướng
  của blockout, ghi trong script), scale đều về kích thước thật theo số đo concept nêu đầu tiên, pivot ở giữa đáy, texture 2048 JPEG
  (1024 cho A19.1–A19.3). Bản sao ở `lookdev-lab/assets/act1-extras/`, đăng ký trong `samples.json`. Bảng khớp kích thước với sáu base
  map: `tmp/act1-base-maps/ACT1_EXTRAS_FIT.md`.
- Hero và quái chưa vào lab. Khi được yêu cầu: texture 2048, đăng ký trong `samples.json` (mục D của Agent.md).
- `ashlar/gametest/` hiện chỉ dùng kit đồ trại, lều và hàng rào (không thuộc ASHLAR, nguồn ở `art-output/tripo-models/camp/` và
  `early_kits/`).
- Không chép thẳng GLB gốc (12–25 MB mỗi file, texture 4096) vào lab hay game.

## Thêm model mới

1. Tạo `ashlar/3d/<nhóm>/<asset_id>/` và chép concept vào `concept.png`. `<asset_id>` gồm mã canon, tên và hướng thiết kế
   (`FL_flagellant_vA`, `D01_hodling`); GLB đặt cùng tên với thư mục.
2. Dựng theo `art-output/tripo-models/Agent.md`, lấy thư mục này làm `<asset_dir>`. Script Tripo vẫn ở
   `art-output/tripo-models/nature/_tools/`.
3. Kiểm GLB theo mục D của Agent.md, rồi thêm một dòng vào danh mục ở trên.
4. Khi đưa vào lab hoặc game, ghi tên bản sao vào cột "Bản trong lab".

## Lịch sử

- 2026-10-21: tạo thư mục. Chuyển từ `art-output/tripo-models/`: `heroes/FL_flagellant_vA`, `monsters/D01_hodling`,
  `dungeon_v1` (thành `props/dungeon_v1`), `nature/clutter_v1` (thành `props/clutter_v1`). Script lab và `samples.json` đã trỏ
  sang đây. Các log viết trước ngày này (`tripo.log`, `tpose.log`, `_tasks/`, `logs/`, `run.out`) vẫn ghi đường dẫn cũ.
- 2026-10-21: thêm bản thử rig `heroes/FL_flagellant_vA/FL_flagellant_vA_rig.glb` và `rig/` (xem `rig-anim/ANIMATION_INVENTORY.md`).
- 2026-10-22: dựng lô quái đã chốt (nhóm `ashlar-chot` trong `bestiary/assets/CONCEPT_SOURCES.json`): 24 quái mới (B01–B04, D02,
  D04, F01, F02, P01, P02, P04–P07, U01–U05, W01–W03, W06, W07), 25 GLB tính cả xe nồi B03. Chưa dựng, ảnh đầu vào dừng vì Codex hết hạn
  mức (mở lại 2026-10-27 15:40): **B05** Hospice Mother (góc bên tay vươn ra trước, lệnh sửa soạn sẵn ở
  `E:\tmp_tripo_all\B05\jobs_edit1.json`), **P03** Hush-Moths (sheet trước/sau đạt, chưa có góc bên: `_tasks\jobs_sides1.json`),
  **W04** Mire-Sucker (chưa gen: `_tasks\jobs_fb1.json`). Vũ khí và đồ cầm tay ghi trong
  `brief.md` mỗi con (REMOVE) chưa dựng. D04, P01, U01 có base color 8192² do tài khoản đổi mặc định texture sang 8K giữa lô.
- 2026-10-22 (sáng, "làm nốt"): Codex vẫn khoá đến 2026-10-27, nên dựng nốt không cần ảnh Astra mới: **B05** và **P03** từ hai góc trước + sau (Tripo multi-view nhận 2 slot, vẫn 100 credit), **W04** từ bốn góc cắt thẳng trên concept. Thêm 9 vũ khí/đồ cầm tay vào `weapons/` (muôi D02, xẻng + bao F01, kim F02, lư hương P02, bọc P05, kiếm + khiên U02, cung U03), mỗi món một ảnh cắt từ cột WEAPON/PROP của concept. Đủ 28/28 quái đã chốt. Chưa dựng: đèn đêm B05 và xích kéo B03 (chỉ vẽ dính trên thân, cần ảnh Astra riêng). Tổng lượt này 12 asset × 145 = 1.740 credit.
