# Art_Final: asset đã chốt

Mỗi file trong đây là **bản copy** của một asset người dùng đã chốt. Bản gốc vẫn nằm nguyên chỗ cũ (`ashlar/art/` cho ảnh, `ashlar/3d/` cho model), nên pipeline Tripo, D2RR và `ashlar/INDEX.md` không bị ảnh hưởng (người dùng chọn copy, 26/10/2026). Nguồn, ghi chú và sha256 của từng ảnh ghi trong `manifest.json`; của từng model ghi trong `Resource_3D/manifest.json`.

Không sửa file trong Art_Final; muốn sửa thì sửa bản gốc rồi copy lại.

## Cấu trúc (26/10)

```text
Art_Final/
├─ README.md                 file này
├─ ASSET_THEO_BIOME.md       asset nào dùng cho biome nào, asset nào dùng lại được
├─ BO_TRI_BIOME.md           cách bố trí asset trong biome, ánh sáng, ngân sách, checklist duyệt map
├─ manifest.json             danh sách ảnh (Concept_Art/, Item/)
├─ Concept_Art/
│  ├─ monsters/act-01/ act-02/ act-03/
│  ├─ heroes/
│  ├─ npcs/
│  └─ environments/act-01/
├─ Item/                     sheet item IT-01–IT-19
├─ Hud/                      HUD cả 6 nghề, thanh chung, sprite sheet v5 + v6 (README + manifest riêng, chưa duyệt)
├─ Texture/                  texture + HDR mà các map trong lab/ dùng (manifest.json riêng)
├─ lab/                      mỗi map một file JSON `ashlar-map/1` (README riêng)
└─ Resource_3D/              bản GLB nhẹ (texture tối đa 2048) của model đã duyệt
   ├─ manifest.json
   ├─ monster/act-01/<ID>/   quái; vũ khí ở <ID>/weapons/<món>/
   ├─ npc/                   chưa có model
   ├─ hero/<ID>/<vX>/        hero; hero/_hands_v1/ = tay màn chọn nghề
   └─ map/act-01/<nhóm>/<vật>/, map/common/<lô>/<vật>/   prop môi trường
```

## Concept_Art và Item

Khi chốt thêm concept: copy file vào đúng thư mục với tên theo ID, thêm một dòng vào `manifest.json` (trường `file` tính từ `Art_Final/`) và cập nhật bảng dưới.

| Thư mục | Số file | Nội dung | Nguồn |
| --- | --- | --- | --- |
| `Concept_Art/monsters/act-01/` | 30 | Quái Act I (Map 1) và Prologue, đủ đội hình, một sheet mỗi con, tên `<ID>.png` | 28 con nhóm `ashlar-chot` (chốt 21/10) + D03 Kiln-Bull `vE/concept_r3_kiln.png` (thay vC r6b, 26/10) và W05 Corpse-Candle `vC/concept.png` (chốt 26/10) |
| `Concept_Art/monsters/act-02/` | 21 | Quái Act II, tên `<ID>.png` | Bản người dùng chọn 26/10 (nguồn và biến thể trong `manifest.json`) |
| `Concept_Art/monsters/act-03/` | 23 | Quái Act III, đủ 23/23 | Bản người dùng chọn 26/10 |
| `Concept_Art/heroes/` | 6 | Hero v5, đủ sáu nghề, tên `<ID>.png` | Bản người dùng chọn 26/10: BR vB/v5b, EX vA/v5, FL vA/v5b, OS vA/v5, PB vA/v5b, PS vA/v5b |
| `Concept_Art/npcs/` | 51 | NPC, một concept mỗi người, tên `<ID>.png` | `ashlar/art/npcs_approved/` (chốt 26/10) |
| `Concept_Art/environments/act-01/` | 50 | Sheet môi trường Act I A01–A25, mỗi nhóm một `_perspective.png` và một `_turnaround.png` | Bản đã chọn trong manifest của `art/act-01/_batches/env_A01-A14`, `env_A15-A20`, `env_A21-A25` (chốt 26/10) |
| `Item/` | 19 | Sheet item IT-01–IT-19 theo lưới D2, tên `<IT-##_slug>.png` | Bản `sheet_d2_*` mới nhất của mỗi nhóm trong `art/items/` (chốt 26/10) |

## Hud

HUD của cả sáu nghề: Flagellant (FL), Pyre-Singer (PS), Pallbearer (PB), Ossuarist (OS), Brinecaller (BR), Exhumer (EX). Gồm thanh chung, sheet bình/bộ đếm, lớp HUD từng nghề (ảnh nền đen + lớp alpha 2000×696), 17 sprite sheet v5 + v6 để cắt sprite, brief v4/v5/v6 và QA. 374 file, khoảng 76 MB; danh sách đủ (nguồn, sha256, kích thước, trạng thái QA) ở `Hud/manifest.json`, mô tả ở `Hud/README.md`. Khác phần còn lại của Art_Final: **chưa duyệt**, gom theo yêu cầu người dùng 27/10 (FL + PS), thêm 4 nghề còn lại cùng ngày.

## Texture

Mọi texture và HDR mà các file JSON trong `lab/` nhắc tới (layer địa hình, normal nước, thẻ cỏ / sậy, đá lát đường, tường xương, nền hang, decal, ảnh key art màn chọn nghề, HDR môi trường), đúng những file đó chứ không phải cả thư mục. 124 file, khoảng 40,7 MB. Bản copy của file mà lab đang nạp (`lookdev-lab/assets/...`, WebP / PNG / HDR đã xử lý: normal có bảng nghiêng, roughness suy ra), giữ đường dẫn con dưới thư mục nguồn: `lookdev-lab/assets/<x>` → `Texture/lab/<x>`, `ashlar/art/textures/<x>` → `Texture/<x>`. Bản gốc không bị sửa. `Texture/manifest.json` ghi từng file: `file`, `source` (file đã copy), `sha256`, `bytes`, và `derivedFrom` khi có ảnh `ashlar/art/...` cùng hình (dựa trên ảnh đó nhưng đã mã hoá lại).

Trong JSON của map, mọi đường dẫn tính từ gốc `Art_Final` (`Texture/lab/terrain-biomes/biome-BIO01_peat.webp`, `Resource_3D_Optimized/map/...glb`), nên loader chỉ cần một base URL. Sinh lại bằng `npm run export:maps` trong `lookdev-lab` (xem `lab/README.md`); script chỉ thêm / cập nhật file, không xoá.

## Resource_3D

Bản copy nhẹ của mọi GLB đã duyệt trong `ashlar/3d/` (bỏ `_work`, `_rejected`, `_batches`, `_shots`, thư mục rig, refs, checks, qa và các lượt `_v*`). Hình học giữ nguyên từng byte; chỉ texture lớn hơn 2048 được thu về 2048 (JPEG 88, normal map JPEG 95, PNG giữ PNG). Kích thước vẫn là cỡ chuẩn hoá của Tripo (cạnh dài nhất 1 m); kích thước thật ở `ashlar/3d/README.md` và bảng fit `tmp/act1-base-maps/ACT1_KIT_FIT.md`. Bản đặt vào lab (đúng kích thước thật, có các biến thể sửa hình `-open`, `-wide`, `-slim`) nằm ở `lookdev-lab/assets/act1-kit/`.

Sinh lại hoặc cập nhật sau khi có model mới:

```text
python -I ashlar/pipeline/art_final/build_resource_3d.py            # chỉ làm file có nguồn đổi
python -I ashlar/pipeline/art_final/build_resource_3d.py --dry-run  # xem kế hoạch
python -I ashlar/pipeline/art_final/build_resource_3d.py --prune --verify  # xoá bản không còn nguồn, đọc lại và so với nguồn
```

| Thư mục | Số GLB | Nội dung |
| --- | --- | --- |
| `monster/act-01/` | 38 | 28 quái Act I có GLB, kèm 9 vũ khí / đồ cầm tay và xe nồi của B03 |
| `hero/` | 6 | FL Flagellant A, PS Pyre Singer A + gậy, ba tay màn chọn nghề (FL, OS, BR) |
| `map/act-01/` | 122 | Prop môi trường A01–A25 (nhóm A05, A09, A10, A12 chưa có model) |
| `map/common/` | 12 | `dungeon_v1` (9 prop hầm mộ, hang), `clutter_v1` (3 prop đá, gốc, nấm) |
| `npc/` | 0 | Trống |

Tổng 178 GLB, khoảng 600 MB (bản gốc 2,5 GB). Không lấy bản rig chưa duyệt (`*_rig.glb`) và biến thể phụ (`_alt/`).

## Còn thiếu hoặc cần chú ý

- **Quái Act I:** đủ 30/30 concept theo đội hình Prologue + Act I (Checklist quái §9). W05 dùng thiết kế Ash Cantor và chưa có sheet định dạng Act I (bóng người H, bốn góc T-pose); D03 và W05 chưa có GLB. GLB D01 dựng từ biến thể B, khác concept đã chốt.
- **Quái Act II:** còn L02 Plumb-Hound và L03 Gargoyle Mortarer chưa chốt (21/23). F05 bản chọn nằm trong danh sách sai tỷ lệ (chuông 1.07H, dáng lùn).
- **Quái Act III:** U14 bản chọn cao 1.29H (QA FAIL kích thước), người dùng giữ; chỉnh kích thước ở bước 3D.
- **Quái Act IV, V:** chưa vẽ (40 con), xem kế hoạch gen 26/10.
- **Hero 3D:** GLB FL Flagellant A dựng từ concept cũ hơn bản v5b đã chốt; PS khớp bản chốt. Bốn nghề còn lại chưa có GLB.
- **NPC:** sáu bản N01, N10, N13, N14, N15, N18 là bản QA nội bộ từng đánh FAIL hoặc đã có bản làm lại. Người dùng giữ theo lựa chọn của mình; cần làm mịn bề mặt trước khi làm T-pose hoặc dựng Tripo. Chưa có GLB NPC.
- **Môi trường:** A01–A04 dùng sheet perspective cũ của E03, E04, E01, E02 (batch A01–A14 tái sử dụng). Với A16, manifest ghi `turnaround_v1e3.png` nhưng file này không có, nên dùng `turnaround_v1e2.png` theo README của batch. Model A07.6, A17.1, A23.1 không dùng (xem `ASSET_THEO_BIOME.md` §3).
- **Chưa có ở đây:** môi trường Act II (G01–G14), HUD, prologue. Các nhóm này chưa chốt.
