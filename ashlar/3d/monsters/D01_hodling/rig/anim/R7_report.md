# D01 Hodling — báo cáo R6–R7 (clip + kiểm clip), chờ G3

Ngày 2026-10-21. **G2 đã được người dùng duyệt** (trả lời "duyệt", rig v4). Báo cáo này là bản kỹ thuật của người dựng (Sonnet 5.5); **chưa có review Opus, chưa có G3 (duyệt chuyển động), chưa có R8 (bake/xuất/reimport), chưa R9**. Cả sáu Action đều `status: experiment`, `approved.* = null` trong [`clips.json`](clips.json).

## 1. Giao gì

| Mục | Đường dẫn |
| --- | --- |
| Nguồn có thể sửa, 6 Action trên `D01_control` | [`../D01_hodling_rig_anim.blend`](../D01_hodling_rig_anim.blend) (**file mới**; rig G2 `../D01_hodling_rig.blend` không đụng tới, đã chụp bản sao ở [`../_snapshots/g2_approved/`](../_snapshots/g2_approved/PROVENANCE.md)) |
| Manifest | [`clips.json`](clips.json) |
| Nguồn clip (CC0) trích nhị phân từ git ghim | [`refs/`](refs/) (`kaykit-anims-medium.glb`, `kaykit-knight.glb`, `prepare-kaykit.py`; không khôi phục đường dẫn lab đã xoá) |
| Số đo R7 trên file đã mở lại | [`qa/r7_metrics.json`](qa/r7_metrics.json), [`qa/r6_build_summary.json`](qa/r6_build_summary.json), [`qa/viewport_probe_reopened.json`](qa/viewport_probe_reopened.json) |
| Dải ảnh mỗi clip (game 3/4 cao 52° + bên, 10 khung) | [`../qa/R7_<clip>_strip.jpg`](../qa/) |
| Xem thử chạy được (GIF 24 fps, game \| bên) | [`qa/previews/R7_<clip>_preview.gif`](qa/previews/) |
| Phiên GUI Blender thật + ảnh viewport có texture | [`qa/gui/`](qa/gui/gui_play_test.json) |
| GLB xem thử trung gian (CHƯA PHẢI release R8) | [`checks/D01_hodling_anim_review_UNAPPROVED.glb`](checks/) |
| Thử trong lab (tab Character) | [`qa/lab_character_test.json`](qa/lab_character_test.json), ảnh `../qa/R7_lab_character_play_UNAPPROVED.png` |
| Tiến độ | [`progress.json`](progress.json) |

Sáu Action: `idle` 49 khung / 2,0 s, `walk` 27 / 1,0833 s, `run` 19 / 0,75 s, `attack` 19 / 0,75 s (hit ở offset 8 = 0,333 s = 44,4 %), `hit` 12 / 0,4583 s, `death` 31 / 1,25 s. fps 24, khung đầu = 1, `duration = (frame_end − frame_start)/fps`. Idle, walk, run là vòng kín (khung cuối = khung đầu, độ lệch đỉnh 0,000 mm, xoay ≤ 0,27°). Tất cả tại chỗ: `ctl_root` không dịch ngang; `death` nâng `ctl_root` tối đa 21,9 mm để không đỉnh nào chìm dưới sàn.

## 2. Làm thế nào (retarget, không phải bước đi sinh bằng code)

- Nguồn: KayKit Adventurers 1.0 (CC0), các clip `Idle`, `Walking_A`, `Running_A`, `Unarmed_Melee_Attack_Punch_A`, `Hit_A`, `Death_A`. Giải mã accessor glTF (16-bit) trực tiếp, lấy mẫu theo thời gian (`tools/kk_source.py`). `Unarmed_Idle` trong kế hoạch G1 bị thay bằng `Idle`: nó là tư thế đấm bốc (hai tay giơ).
- Thân, đầu, tay (FK trên `ctl_*`): xoay thế giới của xương KayKit so với T-pose chung, đặt lên rest của Hodling. Chân và xương chậu: điểm cuối. Vị trí khớp hông và mắt cá KayKit nhân hệ số `S_leg = 0,3476` (đo từ chiều cao hông→mắt cá của hai rest), đưa cho `ctl_cog` và `ctl_*_Foot_IK`; gối do IK của rig giải.
- Tiếp xúc: nửa đầu theo chiều cao chân nguồn; mọi điều chỉnh sau đó kiểm trên **hình học đế đã biến dạng** (đỉnh thấp nhất của bàn chân = sàn). `walk`/`run`: bàn chân đứng trên một đường vận tốc không đổi (cùng tốc độ cho hai chân), lăn gót/bóng bằng `Heel_roll`/`Ball_roll` và `Foot_IK` được bù để điểm tiếp xúc không bị cọ sàn (khớp bóng cao 12 mm). `idle`/`attack`/`hit`: chân đứng nguyên chỗ rest. `death`: tự do, chỉ chặn chìm.
- Thứ cấp (mỗi clip, không lấy từ nguồn): túi, mũ, tai theo độ trễ có giảm chấn của ngực/đầu; khố trước `ctl_loincloth_front` theo luật gập hông của rig (−30° ở 70°) rồi **nâng lên theo góc đo được** nhỏ nhất không còn giao đùi (+5°).
- Retime tường minh (bảng `timemap_out_frame_to_source_s` trong `clips.json`): lệch thời gian tuyến tính từng đoạn rồi lấy mẫu 24 fps; `attack` dùng hai đoạn (đòn ở khung offset 8). Không đổi nhãn fps.

## 3. Điều chỉnh có lý do (khác nguồn)

| Clip | Điều chỉnh | Lý do |
| --- | --- | --- |
| idle, hit | biên độ ×1,8 quanh pose đầu (`gain`) | clip nguồn rất nhẹ; quái 0,5 m đọc không ra từ camera game |
| walk | độ nâng chân vung ×0,65 (`lift`) | đùi ngắn: nâng nguyên bản cần gập hông tới 88° và khố không thể tránh đùi |
| run | độ nâng ×0,85; khung ngay trước chạm đất / sau nhấc chân đi theo tốc độ đứng và cao ≥ 35 mm | giảm trượt ở lab (bỏ đỏ) |
| attack, hit | xương chậu đi ngang ×0,45 (`hip_xy`) | chân Hodling chỉ vươn ~0,13 m; nếu không chân bị kéo ra khỏi chỗ đặt (trượt 28 mm) |
| death | khố có thể xoay tới 130° | tư thế nằm; vẫn còn xuyên (mục 5) |

## 4. Kết quả đo (file đã lưu rồi mở lại, đánh giá thật bằng depsgraph)

- Quyền sở hữu: mỗi Action gán đúng vào `D01_control` với slot `OBD01_control`, khoảng khung riêng (`use_frame_range`), 0 NLA track, preview range tắt, `scene` mở lên ở `idle` 1–49, 24 fps. Mỗi Action chỉ key `rotation_quaternion`, `location` (cog, hai Foot_IK, root) và 4 công tắc IK (tay FK = 0, chân IK = 1); không key scale.
- Lưới và skin không đổi so với G2: băm tọa độ rest + toàn bộ trọng số + tên nhóm **bằng nhau** (`mesh_skin_untouched_vs_g2 = true`).
- Sàn: đỉnh thấp nhất của cả mesh ≥ −0,15 mm mọi khung mọi clip (walk −0,15; các clip còn lại ≥ −0,01).
- `walk`: tốc độ mặt đất 0,358 m/s (đo trên đế), 0,358 / 0,358 giữa hai chân (lệch 0,1 %), `stride_m` 0,388 (cả chu kỳ), bước 0,194 m. Trượt khi đứng phẳng ≤ 1,6 mm/khung (10 % tốc độ), đoạn nhấc gót ≤ 11,9 mm/khung.
- `run`: 1,627 m/s, stride 1,221 m, trượt 0,0 mm/khung; tiếp xúc chỉ 2 khung mỗi bước.
- `attack`: tay phải vươn xa nhất ở khung 9 (offset 8 = 0,333 s), tốc độ tay cực đại ở khung 8, vươn 0,242 m từ ngực; hồi phục 10 khung. Chân đứng nguyên chỗ (trôi ≤ 0,3 mm).
- Khố ↔ đùi (`d01_measure.flap_vs_body`, đo mọi khung của walk, run, attack, death; idle và hit đo mẫu thưa 13 và 4 khung): 0 đỉnh/tam giác mới xuyên ở idle, walk, run, attack, hit.
- Thử trong lab (xem `qa/lab_character_test.json`): 6 state tự khớp tên (`autoClip`), tốc độ tự nhiên do lab đo walk 0,278 m/s, run 1,611 m/s; trượt chân FootCheck walk trung bình 3,1 cm/s (xanh; 3 plant nhấc gót ngắn 14,5 cm/s = vàng), run 2,6 cm/s (toàn xanh), không đỏ.
- Viewport thật: phiên GUI Blender (cửa sổ thật, ngoài màn hình) cho cả 6 Action: gán Action + slot + khoảng khung, bấm Play thường (`screen.animation_play`), khung chạy tiến, chụp vùng 3D (Solid + Texture, ảnh `qa/gui/gui_<clip>.png`). Tốc độ hiển thị trong GUI khoảng 19,6 fps (texture 3×4096 trên máy này), dưới 24.

## 5. Điều còn tồn tại, nói thẳng

1. **Khố xuyên đùi khi chết**: tư thế nằm (khung 19–31) vẫn còn 13 đỉnh khố mới nằm trong đùi (15 tam giác giao), sâu tối đa 17,5 mm, dù khố đã lật 130°. Không xử lý bằng điều khiển hiện có.
2. **Walk**: đoạn nhấc gót của mỗi bước trượt 14,5 cm/s trong 0,117 s (vàng ở lab). Tốc độ tự nhiên: lab đo 0,278 m/s theo xương ngón, hình học đế cho 0,358 m/s (lệch 22 %); run lệch 1 %. `clips.json` ghi cả hai. Lab đặt tốc độ theo số của nó.
3. **Không có ngón tay**: `attack` là đòn bàn tay mở, không nắm đấm.
4. **Khuyết điểm rig G2 vẫn như cũ** (vai giãn tới 23 mm khi vắt tay, khe mũ–túi khi quay đầu): `qa_report.md` 5.2; chưa thấy chúng thành lỗi nhìn thấy trong strip nhưng không đo lại ở từng khung.
5. **Hit sự kiện**: chỉ đo trong Blender (khung 9 = offset 8 = 44,4 %); lab chưa thử `hitAt`, chưa thử crossfade idle ↔ walk ↔ run ↔ attack, chưa thử revive (không có).
6. **Xác minh bằng giao diện** là phiên GUI tự động (bộ đếm giờ trong cửa sổ Blender thật), không phải người bấm; Blender MCP không có trong bộ công cụ của phiên này. Lab test **không chạy thời gian thực** (tab xem trước kết xuất ~1 khung/4 s bằng GL mềm): điều khiển lab được bước `ctrl.update(1/60)` với phím W giữ. Việc người dùng bấm Play trong Blender và lab vẫn là bằng chứng còn thiếu.
7. **R8 chưa làm**: exporter Blender bỏ `KHR_materials_volume` (còn `KHR_materials_specular`) trong GLB xem thử — chưa quyết, **không** coi là đạt; clip ở GLB xem thử bake bằng khóa từng khung, khung 1 → 0 s; chưa reimport sạch, chưa ngưỡng so hình học.
8. Mở file không gán Action thì `ik_arm_L/R` giữ giá trị cuối (0 = tay FK). Khi tự tạo pose cho tay IK, đặt lại 1.
9. `tools/run_all.ps1` và `b1_build_rig.py` **ghi đè rig**: không chạy lên file animation.

## 6. Chạy lại

```text
bash tools/run_r6.sh <out.blend> <qa.json>      # từ rig/anim; LOIN=1 để đo khố mọi khung; chỉ đọc bản chụp G2, ghi file mới
bash tools/run_evidence.sh                       # probe file mở lại, phiên GUI, strip, GIF, GLB xem thử (từ rig/D01_hodling_rig_anim.blend)
python -I tools/make_manifest.py                 # clips.json (cần qa/r7_metrics.json, qa/r6_build_summary.json, qa/lab_character_test.json)
```

Máy này: ổ C đầy 0 byte lúc làm; đã xoá 4 thư mục hồ sơ Chrome tạm trong `%TEMP%` (`blurcheck-chrome`, `gpu-inst-lab\chrome-profile`, `blurcheck\chrome-profile`, `gb-test\profile`) để các lệnh chạy được; mọi tệp tạm của tác vụ này nằm trên E:.
