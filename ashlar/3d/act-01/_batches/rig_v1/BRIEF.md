# Rig lô quái Act I (`rig_v1`): brief chung, cổng G1

Yêu cầu của người dùng (2026-10-26): rig các quái đã có model 3D, dùng skill `blender-character-rigging`. Quy trình theo
[`rig-anim/Agent.md`](../../../rig-anim/Agent.md): R0 phân loại, R1 brief, **G1 người dùng duyệt**, rồi chạy liền R2–R5 tới G2.
Lượt này chỉ làm rig (R2–R5). Clip (R6 trở đi) là phiên riêng.

Nhãn: **[đo]** = số lấy từ GLB thật (script `tools/r0_probe.py`, kết quả ở `r0/*_r0.json`); **[suy luận]** = rút ra từ số đo
hoặc ảnh, chưa kiểm bằng rig; **[đề xuất]** = chờ duyệt ở G1.

## 1. Môi trường đã kiểm [đo]

- Blender 5.1.1 tại `C:\Program Files\Blender Foundation\Blender 5.1\blender.exe`. Đường dẫn 5.2.2 ghi trong tài liệu cũ
  (`E:\SteamLibrary\...`) không còn; ổ E:, `rigkit-env` và UniRig cũng không có trên máy này.
- Blender đang mở ở cổng 9876 là phiên rig **PS Pyre Singer** của thread khác (file chưa lưu). Lượt này **không dùng** Blender đó;
  mọi việc chạy bằng Blender nền riêng (`blender -b --factory-startup -P …`). Server MCP `blender` của phiên này không kết nối.
- Skill chạy được ở chế độ nền: `rig_core` nạp được; `measure_landmarks`, `build_body_skeleton`, `body_weights`, `apply_pose`,
  `stretch_report` chạy trên U01 (`tools/probe_skill.py`, ảnh ở `probe/`).
- Render Workbench chạy được ở chế độ nền (có texture). Bone không hiện trong render, nên ảnh QA dựng mesh giả cho xương rồi
  ghép lớp.
- Chạy thử skill trên mesh U01 **chưa tách part** cho số đo sai đúng như skill cảnh báo: thân lệch trục +3,4 cm so với tay, vai
  đo ra 0,28H vì áo choàng, bước đi giãn 30×. Phải làm đủ các giai đoạn: căn trục, tách đầu, tách áo, chuỗi xương vải.
- Credit dịch vụ: **0**. Không dùng Tripo, Meshy hay UniRig. GLB gốc chỉ đọc; sha256 ghi trong `r0/*_r0.json`.

## 2. Phân loại R0 (28 GLB trong `act-01/monsters/`)

Tất cả GLB đều không có skin hay vertex group, nên skill **không có weight Tripo** để nhận ra đỉnh tay. Mặt nạ tay sẽ tính theo hình
học (T-pose: phần nằm ngoài khớp vai, trên eo) và lưu thành mask `rig_arm` cho rig editor.

### 2a. Dáng người: dùng skill (19 con)

"Mảnh" = mảnh hình học sau khi hàn đường nối UV [đo]. "Dính liền" = áo hoặc đầu cùng một mảnh với thân, phải cắt theo mặt để
tách part (skill bắt buộc tách đầu và từng part váy/áo dài).

| Asset | Họ | Cao thật (danh mục) | Mảnh [đo] | Cấu trúc mesh [đo + suy luận] | Xương ngoài bộ lõi [đề xuất] |
| --- | --- | --- | --- | --- | --- |
| U01 Shambler | H | 0,95H | 16 | đầu, hai tay, hai chân tách mảnh; thân + áo tunic + áo choàng dính liền; dây thừng rời | váy tunic (F/L/B/R), áo choàng sau, 2 đầu dây thừng |
| F01 Body-Snatcher | H | ~1H | 18 | mũ trùm + thân; váy smock tách mảnh; chân, ủng, khăn thắt lưng, cuộn dây rời | váy smock (F/L/B/R), cuộn dây (cứng) |
| F02 Poppy Nurse | H | 1,08H (khăn trùm) | 17 | khăn trùm, đầu, váy dài nhiều lớp, tạp dề tách mảnh; dài chạm đất | khăn trùm (cứng, theo đầu), váy (F/L/B/R), tạp dề |
| P01 The Soothed | H | 0,95H | 20 | váy + tay + đầu + tóc dính liền; bàn chân tách | váy (F/L/B/R), tóc sau |
| P02 Hush-Herald | H | 1,22H (đỉnh mũ chóp) | 7 | mũ chóp tách; áo dài chạm đất dính thân; bàn tay, bàn chân tách | áo dài (F/L/B/R), mũ chóp (1 xương lắc) |
| P05 Wet-Nurse | H | 1,04H (mũ) | 15 | khăn + áo + tay dính liền; chân tách; nút buộc trên mũ | váy + tạp dề (F/L/B/R), khăn vai. T-pose tay xệ 6–9° (README) |
| B03 Ember-Pot | H | ~1H | 13 | áo poncho dính thân; bàn tay, đầu + vương miện gạch, ủng tách | poncho (F/L/B/R), vương miện (cứng) |
| U05 The Swollen | H | 0,95H | 27 | thân bụng phệ + giẻ + tay chân dính liền; 2 dải râu xúc tu rời | giẻ quanh hông (chuỗi), 2 chuỗi râu |
| U02 Charnel Dead | H, xương | 0,95H | 31 | bộ xương rời từng khúc (sọ, tay, lồng ngực…); khố giẻ | khố (F/B); khúc xương cứng theo xương của nó |
| U03 Charnel Bowman | H, xương | 0,95H | 64 | bộ xương rời; áo choàng mũ trùm; ống tên trên lưng | áo choàng sau (2 chuỗi), ống tên (cứng) |
| D02 Kiln-Shaman | S | 0,47H (canon) | 6 | áo + nồi trên đầu dính liền; bàn tay, mặt nạ, bàn chân tách | áo (F/L/B/R), nồi (cứng) |
| D04 Tithe-Thief | S | 0,50H (canon) | 63 | bao tải lớn sau lưng, chân nến, sừng, áo tunic, chân tách | bao (cứng, con chest), chân nến, tunic (F/B) |
| B02 Lullaby Man | H, cao | mũ 2,2H; lồng 2,55H | 24 | áo dài hình chuông chạm đất dính thân, **không có chân**; lồng nôi 3 bọc trên đầu/lưng; dải ruy băng trước ngực | áo dài (F/L/B/R) thay chân, lồng (cứng), ruy băng (chuỗi) |
| B04 Willow Bride | H | ~1H | 54 | váy chạm đất dính thân, **khối rễ thay chân**; nhiều rễ rủ (mảnh rời) | váy (F/L/B/R), rễ bám chuỗi váy gần nhất |
| B05 Hospice Mother | H + 3 cặp tay | ~3H (canon 2,75H) | 15 | **8 tay** (4 cặp) dang ngang; áo chuông chạm đất; các tầng tay áo | 3 cặp tay phụ `*_2..4`, áo (F/L/B/R), tầng tay áo |
| P07 Cradle-Warden | H, lùn to | canon 2,2H | 16 | khổng lồ lùn, thân + tay to + chân ngắn dính liền; lồng nôi trên lưng | lồng (cứng, con chest) |
| W06 Willow-Hulk | H, tay lệch | canon 1,75H | 64 | tay phải dài to, tay trái ngắn; chân rễ không gối; tóc lá | tay đo **riêng từng bên** (skill mặc định soi gương tay) |
| W01 Mortar-Rat | H, chân khuỷu ngược | 0,22H | 67 | chuột đứng, dính liền; đuôi dài; tai to; gai rời | đuôi (4–5 xương), 2 tai, gai cứng theo xương gần nhất |
| W03 Hush-Wolf | H, chân khuỷu ngược | 0,95H | **1** | toàn bộ một mảnh (cả tấm vải sau lưng) | tấm vải sau (chuỗi), 2 tai |

Chân khuỷu ngược (W01, W03) giữ **tên bone chuẩn**: `Thigh` (hông→gối), `Calf` (gối→gót), `Foot` = đốt bàn dựng đứng (gót→bóng),
`Toe`. Clip người retarget được, nhưng dáng đi cần chỉnh ở phiên animation.

### 2b. Không phải người: skill không áp dụng (7 con), cần bảng bone họ mới

Theo `SKELETON_STANDARD.md` §3 "Họ khác": bảng bone của họ mới phải được duyệt và ghi vào chuẩn **trước** khi rig con đầu tiên.

| Asset | Họ | Bone đề xuất (runtime) |
| --- | --- | --- |
| B01 Sexton's Dog | Q | `root, cog, pelvis, spine_01..02, chest, neck_01..02, head, jaw, L/R_ear, tail_01..04`; chân trước `L_Scapula, L_UpperArm, L_ForeArm, L_Hand, L_Finger`; chân sau `L_Thigh, L_Calf, L_Foot, L_Toe`; vòng cổ (cứng) + khoá (1 xương lắc) |
| W02 Gibbet-Crow | W (chim) | `root, cog, pelvis, spine_01, chest, neck_01..03, head, beak`; cánh `L_Wing_01..03` (+ lông cánh theo xương cánh); chân `L_Thigh, L_Calf, L_Foot, L_Toe`; `tail_01..02` |
| P03 Hush-Moths | W (côn trùng bay) | `root, cog, thorax, abdomen_01..03, head, L/R_antenna_01..02`; `L_WingF_01..02, L_WingB_01..02`; 6 chân `L_Leg1..3_01..03` |
| W04 Mire-Sucker | A + W | như P03 nhưng 2 cánh, `proboscis_01..03`, túi máu `abdomen_L/R`; 6 chân cà kheo `L_Leg1..3_01..04` |
| W07 Shroud-Spinner | A | `root, cog, cephalothorax, abdomen_01..02, L/R_fang`; 8 chân `L_Leg1..4_01..03` |
| P04 Hive-Sleeper | H, tư thế bò | bộ lõi H (tên giữ nguyên), **rest = tư thế bò của mesh**, không T-pose; 3 vòm ấu trùng (cứng) |
| U04 Charnel Ghoul | H, tư thế bò | bộ lõi H, rest = tư thế đứng bốn chi; `jaw` (hàm há); áo choàng (chuỗi) |

Cách làm cho nhóm này: dựng skeleton bằng code theo landmark đo trên mesh, weight bằng khoảng cách tới đoạn xương + làm mịn
Laplace trên mesh đã hàn, phần cứng (vòng cổ, vỏ, khiên) gán một xương. Cùng chuỗi kiểm tra như nhóm 2a. Đây là asset đầu tiên
của mỗi họ nên là phép thử (Agent.md §7).

### 2c. Không rig

- **P06 Poppy-Mound**: prop tĩnh (README: "Tĩnh, không rig").
- **B03 cart** (`B03_ember_pot/cart/`): prop.
- **D01 Hodling**: đã có rig qua G2 (2026-10-21), đang ở bước clip. Không đụng.

## 3. Cách làm cho nhóm dáng người [đề xuất]

Theo các giai đoạn của skill, chạy bằng Blender nền:

1. **Nạp và chuẩn hoá:** import GLB (hàn đỉnh trùng của importer), mặt hướng −Y, chân ở z = 0. Scale về **chiều cao thật** của
   danh mục (G1, mục 5).
2. **Đối xứng:** đo bằng `symmetry_report` theo trục thân; dời mesh cho trục thân về x = 0. Chỉ sửa độ dài tay khi thiết kế là đối
   xứng mà số đo lệch rõ. W06 (tay lệch) và các con cố ý lệch thì giữ nguyên.
3. **Tách part:** đủ 5 nhóm theo chuẩn của skill: `_Body`, `_Head` (chỉ đầu), `_Accessory`, `_Cloth`, và mỗi váy/áo dài một object
   `_Cloth_*`. Mesh dính liền thì cắt theo mặt ở đường cằm và đường eo; đỉnh hai bên vết cắt lấy cùng weight để không hở khi chuyển
   động.
4. **Skeleton:** `measure_landmarks` trên Body + Head đã tách; `build_body_skeleton` (36 xương: bộ lõi H 28 + socket). Mở rộng cho tay
   lệch (W06), 8 tay (B05), chân khuỷu ngược (W01, W03).
5. **Weight:** thân và đầu tính từ khớp (`body_weights`, da cổ chuyển dần head↔neck), phụ kiện cứng hoặc bám da, vải mỗi part một
   chuỗi; chân chạm thì đẩy váy (`leg_colliders`, `push_setup`, script F3 trong file). Không gộp mesh, không merge.
6. **Kiểm:** `weight_health` (≤ 4 ảnh hưởng, tổng 1, không weight trên xương phụ), độ giãn ở các tư thế thử của skill (hạ tay, giơ tay,
   gập khuỷu, đi, cúi, vặn, quay đầu chia neck + head), số đỉnh vải lọt vào chân, khe ở các cặp đỉnh trùng giữa hai part. Mức tham
   chiếu là rig đã duyệt của skill (hạ tay 4,3×, gập khuỷu 4,1×, bước 3,6×…). Ảnh QA: X-ray trước và nghiêng có xương, phóng to
   đầu–cổ, các tư thế thử.
7. **Đầu ra mỗi asset:** `<asset>/rig/<asset_id>_rig.blend`, `rig/qa/`, `rig/validation.json`, `rig/rig.log`, `rig/rig_brief.md`. Không
   export FBX/GLB (giai đoạn 8 chỉ chạy khi người dùng nói rig xong). Code chạy nằm ở `_batches/rig_v1/tools/`; không sửa skill.

Không làm: ngón tay (mỗi bên một xương `Hand`), xương mặt (trừ hàm U04), clip, đăng ký lab.

## 4. Câu hỏi G1

1. **Phạm vi và thứ tự.**
2. **Chiều cao làm việc.** Hằng số của skill chỉnh cho người 1,8 m (cửa sổ khớp tay ±4 cm, dải gối, bán kính collider…). Quái
   trong danh mục từ 0,4 m (W01) tới ~5 m (B05), và nhiều con chưa chốt chiều cao (D02, D04, P07, W06 ghi "canon" khác "sheet").
   Đề xuất: rig ở 1,8 m, khi export scale đều về chiều cao danh mục (scale cả armature và mesh rồi apply, kiểm bằng reimport), ghi hệ
   số vào `rig.log`. Đây là lệch khỏi Agent.md nguyên tắc 4 ("scale về chiều cao danh mục trước khi dựng xương"), nên cần duyệt.
3. **Điểm dừng xem.** Skill bắt người dùng duyệt ranh giới part trước khi rig. Đề xuất gom mỗi đợt thành một tờ ảnh tô màu part và
   một tờ G2.

## 5. Duyệt

| Cổng | Ngày | Kết quả | Ghi chú |
| --- | --- | --- | --- |
| G1 (brief lô) | 2026-10-26 | **duyệt**, kèm 3 lựa chọn dưới | người dùng trả lời trong phiên |

Quyết định G1 của người dùng (2026-10-26):

1. **Phạm vi:** thử U01 Shambler tới G2 trước, rồi 18 con dáng người còn lại theo đợt. 7 con không phải người làm sau, khi người
   dùng duyệt bảng bone họ mới (mục 2b chưa duyệt).
2. **Chiều cao: rig ở chiều cao thật ngay từ đầu** (đúng Agent.md nguyên tắc 4; không theo đề xuất 1,8 m). Cách làm: hằng số tuyệt
   đối của skill (cửa sổ khớp tay, dải gối, độ rộng chuyển tiếp chuỗi, bán kính collider, độ dài xương socket…) nhân với
   `k = chiều cao thật / 1,8 m` bằng lớp bọc trong `tools/rigbatch.py`; skill không bị sửa. `k` ghi trên rig (`rig['skill_scale']`)
   và trong `rig.log`. Giới hạn: `reweight_after_edit` của rig editor gọi skill gốc (hằng số 1,8 m), nên với con xa 1,8 m (W01,
   D02, D04, B02, B05, P07, W06) phải tính lại weight bằng lớp bọc; sẽ đề xuất làm skill hiểu `k` (việc của Sonnet + review Opus).
3. **Điểm dừng:** mỗi đợt một tờ ảnh tô màu part (duyệt ranh giới part), rồi một tờ G2.

Chiều cao thật dùng cho từng con: theo cột "Kích thước thật" của `ashlar/3d/README.md`, H = 1,8 m. Con nào danh mục ghi "canon" khác
"sheet" (D02, D04, P07, W06, B05) thì hỏi lại ở tờ part của đợt đó.
