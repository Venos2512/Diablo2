# HUD: cả sáu nghề

Gom mọi asset HUD của sáu nghề, Flagellant (FL), Pyre-Singer (PS), Pallbearer (PB), Ossuarist (OS), Brinecaller (BR), Exhumer (EX), cùng phần thanh chung, sprite sheet v5 + v6, brief và QA vào một chỗ (27/10/2026; FL + PS trước, bốn nghề sau cùng ngày, chỉ vẽ phần riêng của từng nghề). Đây là **bản copy**: bản gốc vẫn ở `ashlar/art/hud/`; trường `source` trong `manifest.json` chỉ tới từng file gốc. **Chưa duyệt**: người dùng là cổng duyệt cuối.

`manifest.json` liệt kê đủ 374 file: đường dẫn, nguồn, số byte, sha256; với ảnh có thêm kích thước, có alpha hay không, loại, nghề, trạng thái QA, file QA và ghi chú. Chạy lại `python -I ashlar/pipeline/art_final/build_hud_pack.py` sau khi sửa bản gốc: script chỉ copy file đổi rồi ghi lại manifest.

## Cấu trúc

```text
Hud/
├─ README.md, manifest.json
├─ common/            thanh HUD chung (dùng cho mọi nghề)
├─ class_FL/          Flagellant: bình Contrition (hốc xích), globe Wound
├─ class_PS/          Pyre-Singer: bình Breath (lồng củi), ô 5 Hymn, bộ đếm
├─ class_PB/          Pallbearer: bình Burden (khung quan tài), ô 5 Vow, bộ đếm Names
├─ class_OS/          Ossuarist: bình Souls (tháp 8 hốc), Strain, servant
├─ class_BR/          Brinecaller: bình Salinity (chai cao), Encrusted
├─ class_EX/          Exhumer: đèn có chụp (5 nấc bấc), R đổi bấc, Exposed
├─ dev/_sheets/       sprite sheet v5 + v6 để cắt sprite
└─ _brief/v4, v5, v6/ mô tả job, jobfile, script cắt lớp, log chạy, QA v5 / v6
```

Mỗi thư mục ảnh có `_work/` chứa prompt đã gửi (`*.prompt.txt`), prompt kèm khung harness (`*.task.txt`), log, kết quả Codex, QA từng ảnh (`qa_*.txt`) và các ảnh crop đã đính kèm làm tham chiếu (`ref_*.png`).

## Kích thước và cách xếp lớp

- Codex vẽ 16:9 ở **1672×941** trên nền đen. `_brief/v4/cutout_layer.py` phóng lên 2000×1125 rồi cắt dải **2000×696** tại y = 214, ra lớp alpha (`*_layer.png`).
- `common/base_user_layer.png` (2000×696, alpha) là lớp HUD người dùng tự cắt (cặp tượng trùm mũ); mọi lớp nghề vẽ đè lên đúng vị trí đó. `common/_work/base_layer_black16x9.png` là khung đen 2000×1125 đưa cho Codex.

## Ảnh

| File | Nội dung | Trạng thái |
| --- | --- | --- |
| `common/base_user_layer.png` | Lớp gốc của người dùng | gốc |
| `common/HUD00_common_v1.png` + `_layer` | Thanh chung: LMB RMB 1–4, SPACE Q R, F T; globe, minimap, plate, caption, EXP | PASS, chờ duyệt |
| `class_FL/K1_vessel_v1.png` | Bình Contrition: A hốc 10 mắt xích, B hộp than | người dùng chọn **A** |
| `class_FL/K2_globe_v1.png` | Globe: FULL, WOUND, HEALING, FLOOR 10%, SHORED, REDUCED IMAGERY, 3 trạng thái cốt truyện | PASS, chờ duyệt |
| `class_FL/L1_hud_layer_v1.png` + `_layer` | HUD Flagellant hoàn chỉnh | PASS, chờ duyệt |
| `class_PS/K1_vessel_v1.png` | Bình Breath: A lồng củi, B trăng khuyết | người dùng chọn **A** |
| `class_PS/K2_counters_v1.png` | Ô 5 Hymn 3 trạng thái, Smoke-Shape, Long Song, Courage, party, Last Verse | PASS, chờ duyệt |
| `class_PS/L1_hud_layer_v2.png` + `_layer` | HUD Pyre-Singer hoàn chỉnh | PASS, chờ duyệt |
| `class_PS/L1_hud_layer_v1.png` | Bản cũ, còn vòng globe sau lồng | **FAIL**, chỉ giữ làm lịch sử |
| `class_PB/K1_vessel_v1.png`, `K2_counters_v1.png` | Bình Burden: A khung quan tài, B cáng; ô Vow 4 trạng thái, Names 6/10 | người dùng chọn **A** |
| `class_PB/L1_hud_layer_v2.png` + `_layer` | HUD Pallbearer hoàn chỉnh (ô 5 No One Alone) | PASS, chờ duyệt |
| `class_OS/K1_vessel_v1.png`, `K2_counters_v1.png` | Bình Souls: A tháp 8 hốc, B rương hốc; Strain 4 trạng thái, servant 2/3 | người dùng chọn **A** |
| `class_OS/L1_hud_layer_v2.png` + `_layer` | HUD Ossuarist hoàn chỉnh | PASS, chờ duyệt |
| `class_BR/K1_vessel_v1.png`, `K2_counters_v1.png` | Bình Salinity: A chai cao, B hũ muối; Encrusted/Crystallized/Corroded, decal | người dùng chọn **A** |
| `class_BR/L1_hud_layer_v2.png` + `_layer` | HUD Brinecaller hoàn chỉnh | PASS, chờ duyệt |
| `class_EX/K1_vessel_v1.png`, `K2_counters_v1.png` | Đèn: A đèn có chụp 5 nấc, B đèn mộ; phím R đổi bấc, Hooded, Exposed | người dùng chọn **A** |
| `class_EX/L1_hud_layer_v2.png` + `_layer` | HUD Exhumer hoàn chỉnh (trong đèn vẽ nến; game dùng phần dầu + lửa của C_ex) | PASS, chờ duyệt |
| `class_PB/OS/BR/EX/L1_hud_layer_v1.png` | Bản đầu, còn vòng đá tròn sau bình | **FAIL**, chỉ giữ làm lịch sử |

Lỗi nhỏ đã biết (để bản production vẽ đúng bằng code): số mắt xích trong hốc FL, số khấc Long Song của PS, mức máu khó đọc ở grayscale.

## Sprite sheet v5 (`dev/_sheets/`)

Nền xanh phẳng #00FF00 (F_fx nền đen để cộng sáng). QA chi tiết ở `_brief/v5/QA.md`.

| Sheet | Dùng cho | Nội dung | Ghi chú |
| --- | --- | --- | --- |
| `A_bar` | chung | Thân thanh trống, ô skill, plate nhãn, vách ngăn, mặt ô khoá, chấm lượt, rãnh + thanh EXP, keystone level | PASS |
| `B_globe` | chung | Tượng trái + vòng đá, vết nứt, hàng vữa, đinh đỉa, nêm, mặt chất lỏng | Dùng hàng 1 và 3; hàng đĩa FAIL |
| `B_globe_r2` | chung | 5 đĩa màu globe (nền, máu, vữa, máu có sợi, Wound), 322 px | PASS; cắt tròn, thu về ~246 px |
| `C_fl` | FL | Tượng phải + hốc Contrition trống, móc, mắt xích nguội/nóng (mặt và cạnh) | PASS |
| `D_ps` | PS | Tượng phải + lồng củi trống, mũi tên tụt, chấm sói khói, khấc Long Song, Courage, khung party, vòng 8 đoạn, khung ngắm | PASS; sửa đoạn vòng sáng và bàn tay |
| `E_icons` | FL + PS | 17 icon skill: 6 FL, 6 PS, Hymn, Dodge, đèn, Draught, Open a Face | PASS; đưa về cùng một ô vuông |
| `F_fx` | FL + PS | Hiệu ứng sáng: phản chiếu kính, hơi thở, tàn lửa, sương, viền ô, quầng sáng | PASS; dựng lại viền nửa ô |
| `G_plates` | chung | Plate quest, khung + thanh máu nameplate, vòng minimap, plate tên vùng/caption/thuộc tính, tia sáng, plate số, plate đếm | PASS |

## Sprite sheet v6 (`dev/_sheets/`): PB, OS, BR, EX

QA chi tiết ở `_brief/v6/QA.md`. Tượng phải luôn đứng sau bên phải, bình ở bên trái (như HUD).

| Sheet | Dùng cho | Nội dung | Ghi chú |
| --- | --- | --- | --- |
| `C_pb_r2` | PB | Tượng phải + khung quan tài trống, khối vữa 8 hàng, nắp mỏng, bia Names nổi/chìm, plate Names, viền Vow, 2 đai sắt | PASS; dùng thay `C_pb` (v1 vẽ tượng ngược bên) |
| `C_os_r2` | OS | Tượng phải + tháp 8 hốc trống, hốc sáng, 3 vết nứt, khe vỡ, rãnh Strain, token servant sáng/tối, plate đếm | PASS; tô tối lòng vết nứt sau khi key; dùng thay `C_os` |
| `C_br` | BR | Tượng phải + chai trống, lòng chai, nước, muối, pip Encrusted đầy/rỗng, giọt kiềm, cụm tinh thể hai đầu thanh, decal vũng nước mặn + vỏ muối | PASS; che nước/muối đúng lòng chai, gộp mảnh bọt rời |
| `C_ex` | EX | Tượng phải + đèn tắt, dầu, chụp sắt, con trượt bấc sáng/tối, 3 ngọn lửa, token Hooded, pip Exposed, pip bẫy đặt/rỗng, plate đếm | PASS; che dầu đúng bầu đèn, khử viền xanh ngọn lửa; plate có 4 ô bằng nhau |
| `E2_icons` | PB + OS | 13 icon: 7 PB (gồm ô 5 Vow), 6 OS | PASS; đưa về cùng một ô vuông |
| `E3_icons` | BR + EX | 13 icon: 6 BR, 6 EX + icon R đổi bấc | PASS; đưa về ô vuông; key chặt (màu teal gần xanh key) |
| `F2_fx` | PB + OS + BR + EX | Hiệu ứng sáng nền đen: hồn, khe vỡ, vệt rỉ, quầng Beacon, viền Vow kín/nửa, vệt Exposed, ánh muối | PASS; dựng lại viền nửa ô từ viền kín |

Chưa cắt sprite; các sửa bằng code ở cột ghi chú làm lúc cắt.
