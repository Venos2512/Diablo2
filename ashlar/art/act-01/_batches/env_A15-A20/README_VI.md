# Act I environment v2: 36 concept asset còn thiếu (A15–A20)

> **Trạng thái (21/10/2026):** ĐÃ XONG lượt tạo ảnh, chờ người dùng duyệt. **12 ảnh đã chọn** (6 perspective + 6 turnaround, 1536×1024) cho 36 asset; tất cả qua QA §11 của lead: 3 sheet PASS sạch (A15, A19, A20 perspective), 9 sheet PASS kèm ghi chú lỗi đã biết (mục 4). 38 phiên Astra trong 7 đợt (19 perspective, 19 turnaround; mọi phiên trả ảnh, không lỗi capacity, không bị từ chối an toàn). Runner `--check` 0 lỗi, `--dry-run` 12/12 skip-exists.
> Đây là **concept reference** (sheet 6 asset, perspective + turnaround), không phải bản vẽ kỹ thuật, GLB hay texture. Danh sách asset, thiết kế và kích thước là **đề xuất** (Đề xuất AD), không phải canon, không phải bố cục cuối của map. `H` = người trung tính **1,8 m**. Khi dựng model, lấy kích thước theo bảng ở mục 3, không đo trên ảnh (AD §7.2).

> **Vị trí sau sắp xếp 2026-10-24 (vòng 3):** thư mục này là hạ tầng của lô (`ashlar/art/act-01/_batches/env_A15-A20/`). Ảnh của từng nhóm nằm ở `ashlar/art/act-01/environments/<id>_<slug>/` (chỗ nào trong tài liệu này ghi `groups/<id>_<slug>/` thì đọc là thư mục đó); file phụ (`*.prompt.txt`, `*.task.txt`, `*.generation.log`, `*.result.txt`, `*qa*.txt`) nằm trong `_work/` của nhóm.

## 1. Cái gì và vì sao

- **Cái gì:** 6 nhóm A15–A20, mỗi nhóm 6 asset, mỗi nhóm hai sheet (perspective rồi turnaround) = **12 ảnh, 36 asset**. Nối tiếp A01–A14 của [`../env_A01-A14/`](../env_A01-A14/README_VI.md).
- **Vì sao:** sáu base map Act I (`tmp/act1-base-maps/`) cần những thứ LD đòi ở §10.2 của [`ashlar/art-direction/artdirection.md`](../../../../art-direction/artdirection.md) và §4–§5 của `docs/ASHLAR_BIOME_VA_KHU_VUC_VI.md` mà chưa có concept: nhà thờ đá lửa, lò rèn, bảng tên người ngủ, giá chuông tang (Lychgate); thuỷ tùng, giá treo rỗng, các kiểu mộ (Churchyard); vòm hai đá nghiêng, tháp chuông chìm, thuyền và bến của Gentle House (Fens, Rook's Weir); xe bò, giường gối sạch, cửa mỏ, dãy nhà hospice (Poppy Reach, Gentle House); đạo cụ nội thất hospice; người ngủ và bàn thu hoạch (Garden of Hush). Nguồn danh sách: `tmp/act1-base-maps/MISSING_ENV_CONCEPTS.md`. Base-map builder: khối `N…` nào khớp một hàng ở mục 3 thì lấy id `A15.x…A20.x`.
- **Bám art direction v2.0:** mọi prompt dán nguyên văn §3.1 STYLE CORE, §3.2 SHEET RULES, §3.7 ENVIRONMENT RULES + khối "Sheet 6 asset", §3.8 CONTENT (trích byte-đúng từ `ashlar/art-direction/artdirection.md`), rồi mới tới phần riêng: tiêu đề, palette biome có HEX, cột Cấm Act I (§8), ánh sáng có chủ (§4.3), từng ô (số, tên, kích thước theo H và mét, thiết kế). Nền studio xám ấm, không mang mood map (§2). Ảnh style gắn kèm theo §1.3; khung tỷ lệ vẽ bằng code làm ảnh thứ hai (§6.5); turnaround gắn perspective đã chọn làm ảnh danh tính (§7.2). QA từng ảnh theo §11.

## 2. Gồm những gì

| File | Nội dung |
|---|---|
| `manifest.json` | 6 nhóm, 12 job, 36 asset, 7 khu Act I; **cùng khuôn manifest v1** nên runner v1 chạy được bằng `--manifest`. Mỗi asset có `sizeM`, `sizeH`, `sizeText`, `front`, `turnaroundArrangement`; mỗi job có `frame`, `referenceImages` (đúng thứ tự gắn), `status`, `qa`, và `history` khi đã chạy lại |
| `prompts/*.txt` | prompt tiếng Anh của mọi lượt: bản đầu `<id>_<kind>.txt`, bản chạy lại `_v2` (có mục `REVISION NOTES`), bản sửa bằng edit `_v1e`, `_v2e`, `_v2e2`, `_v1f`, `_v1e2` (mục `EDIT`/`CHANGES`). `manifest.json` trỏ tới prompt của ảnh đã chọn |
| `templates/<id>_perspective_frame.png`, `_frame_v2.png`, `<id>_turnaround_frame.png` | khung tỷ lệ 1536×1024 (+ `.json` số đo: px của H, khối, bố cục từng ô). Khung perspective `_v2` chỉ tính nửa phần "nhô" do nhìn từ trên (đợt 1 vẽ quá to). Khung turnaround có khối ghép nhiều hình chữ nhật cho thuyền, bến, hai kiểu mộ, kênh, ghế |
| `templates/ref_A01_village_blur22.png`, `ref_A02_churchyard_blur22.png` | bản làm mờ Gaussian r 2,2 của perspective A01/A02 cũ, gắn cho A15/A16 làm tham chiếu họ vật liệu (có dòng `WRONG IN THE REFERENCE`, §1.3) |
| `groups/<id>_<slug>/*.png` | 38 ảnh Astra, **không ảnh nào bị ghi đè**; ảnh đã chọn ghi ở mục 4 và trong `manifest.json` (`outputPath`, `delivery` có sha256 và session). Mỗi ảnh kèm `*.prompt.txt` (prompt đã gửi), `*.task.txt`, `*.generation.log`, `*.result.txt` và `*.qa.txt` (kết quả QA §11, kể cả ảnh trượt) |
| `_runs/*.jsonl` | log trạng thái của runner, mỗi lượt một file |

Công cụ phiên (ngoài repo, `E:\act1-env-batch\`; chỉ dựng khung, cắt, đo và ghép chữ, không vẽ asset): `spec_v2.py` + `cues_v2.py` (nội dung 36 ô, gợi ý tỷ lệ theo thân người, khối ghép), `make_frames.py` (khung tỷ lệ + bản mờ), `build_v2.py` (ghép prompt + manifest; khối AD lấy nguyên văn; chế độ edit), `qa.py` (cắt ô, thước đo theo bóng H **vẽ ra**, ảnh xám, so ảnh style), `versions.json` (lịch sử từng lượt), `qa_notes.json`, `wave3_edits.py`/`wave5.py`/`wave6.py`/`finalize.py` (ghi kết quả QA, đặt lượt sau, ghi `delivery`). Runner v1 `act01_batch.py` dùng **nguyên bản, không sửa**.

## 3. ID và kích thước đề xuất (A15.1–A20.6)

Kích thước là **đề xuất**; `W` là bề ngang mặt FRONT, `D` chiều sâu, `h` điểm cao nhất. FRONT là mặt được gọi là FRONT trong turnaround; ở perspective FRONT quay về góc dưới trái, mặt LEFT quay về góc dưới phải.

| Nhóm | Tên | Biome | Khu (LD) | Base map |
|---|---|---|---|---|
| A15 | Lychgate: phần làng còn thiếu | BIO-03 (Làng đá lửa & sân nhà thờ) | chính 11.2; chung 11.3 | map 1 (Lychgate + Churchyard) |
| A16 | Churchyard: phần nghĩa địa còn thiếu | BIO-03 (Làng đá lửa & sân nhà thờ) | chính 11.3; chung 11.2 | map 1 (Lychgate + Churchyard) |
| A17 | Night Fens và Rook's Weir: phần còn thiếu | BIO-01 (Đầm lầy & làng nước) | chính 11.4, 11.5 | map 2 (Night Fens + Rook's Weir) |
| A18 | Poppy Reach và ngoại thất Gentle House | BIO-02 (Đồng thuốc phiện) -> BIO-05 (Hospice vôi trắng) | chính 11.6, 11.9; chung 11.8 | map 3 (Poppy Reach); map 4 (Gentle House); far silhouette in maps 1-2 |
| A19 | Gentle House: đạo cụ nội thất | BIO-05 (Hospice vôi trắng) | chính 11.9 | map 4 (Gentle House) |
| A20 | Garden of Hush: người ngủ và thu hoạch | BIO-04 (Hầm xương & vườn đất) | chính 11.11 | map 5 (Garden of Hush) |

| ID | Asset (nhãn trên sheet) | Kích thước đề xuất (1H = 1,8 m) | FRONT |
|---|---|---|---|
| A15.1 | Flint parish church | length 16 m = 8.9H, width 8 m = 4.4H, eaves 4.5 m = 2.5H, ridge 9 m = 5H, bell-cote top 11 m = 6.1H | the west gable end with the door, the Wedge and the bell-cote |
| A15.2 | Brannoc's forge | width 6 m = 3.3H, depth 4.5 m = 2.5H, front eaves 2.5 m = 1.4H, chimney top 4 m = 2.2H | the open side with the two posts |
| A15.3 | Sleeper name board | width 2.6 m = 1.45H, height 2.4 m = 1.33H | the face of the board with the slates |
| A15.4 | Mourning bell frame | height 3.4 m = 1.9H, width 2.2 m = 1.2H | the broad face showing both posts and the bell |
| A15.5 | Grave-goods stall | width 3 m = 1.7H, depth 1.8 m = 1H, height 2.6 m = 1.45H | the counter side |
| A15.6 | Osric's watch post | footprint 3 x 3 m = 1.7 x 1.7H, deck 2 m = 1.1H, roof top 4.2 m = 2.3H | the side with the ladder |
| A16.1 | Churchyard yew | height 9 m = 5H, crown width 8 m = 4.4H | the side where the trunk splits widest |
| A16.2 | Empty tarred gibbet | height 4.6 m = 2.6H, arm reach 1.6 m | the face that shows the arm side-on, reaching to image-right |
| A16.3 | Grave with jar candles | length 2.2 m = 1.2H, headstone height 0.8 m = 0.44H | the foot end (the headstone at the far end) |
| A16.4 | Fresh grave | length 2.4 m = 1.3H, marker post 1.2 m = 0.67H | the foot end (the marker post at the far end) |
| A16.5 | Unquiet grave | length 2.6 m = 1.45H, mortsafe height 1.2 m = 0.67H | the foot end |
| A16.6 | Sexton's lamp post | height 2.6 m = 1.45H | the face where the hook arm reaches to image-right |
| A17.1 | The leaning stones | height 4.6 m = 2.6H, opening 1.6 m wide at the base, footprint 3.5 m = 1.9H | looking along the path through the opening |
| A17.2 | Drowned bell tower | height above water 10 m = 5.5H, footprint 4 x 4 m = 2.2H | the face with the patched slates |
| A17.3 | Gentle House boat | length 7 m = 3.9H, width 1.6 m = 0.9H, canopy height 2.2 m = 1.2H, bow lamp 2.6 m = 1.45H | the bow with the lamp pole |
| A17.4 | Flooded supper table | length 2.4 m = 1.3H, table height 0.8 m = 0.44H | one long side |
| A17.5 | Flooded lace window | wall section 2.2 m wide = 1.2H, 2.6 m high = 1.45H | the outside face of the wall with the window |
| A17.6 | Gentle House dock | length 6 m = 3.3H, width 2 m = 1.1H, deck 0.6 m = 0.33H, lamp 3 m = 1.67H | the land end (the lamp at the far end) |
| A18.1 | Abandoned ox cart | length 4 m = 2.2H with shafts, load height 1.6 m = 0.9H | the shaft end |
| A18.2 | Bed with clean pillow | length 2 m = 1.1H, mattress height 0.9 m = 0.5H, headboard 1.1 m = 0.6H | the foot end (the headboard at the far end) |
| A18.3 | Flint Delvings mouth | width 4 m = 2.2H, height 3.6 m = 2H, portal lintel 2.3 m = 1.3H | the rock face with the portal |
| A18.4 | Hospice ward range | length 30 m = 16.7H, depth 9 m = 5H, eaves 6.5 m = 3.6H, ridge 11 m = 6.1H | the long facade with the door |
| A18.5 | Hospice wall niche | width 6 m = 3.3H, height 3.2 m = 1.8H, thickness 0.7 m | the face with the niche |
| A18.6 | Hilltop steps | width 4 m = 2.2H, terrace height 2 m = 1.1H, run 5 m = 2.8H | the foot of the steps |
| A19.1 | Flowers in a vase | height 0.5 m = 0.28H | the side with the handle at image-right |
| A19.2 | Poppy tea tray | tray 0.5 x 0.35 m = 0.28H wide, teapot top 0.2 m = 0.11H | a long side of the tray, teapot at image-left |
| A19.3 | Window chair | chair height 1.2 m = 0.67H, chair and side table together 1.1 m wide | the seat side, the side table at image-left |
| A19.4 | Linen press | height 1.9 m = 1.05H, width 1.2 m = 0.67H | the open doors |
| A19.5 | Linen screen | height 1.8 m = 1H, width 2.4 m = 1.3H | the face of the screen |
| A19.6 | Tall ward window | window 1.3 x 2.8 m = 0.7 x 1.55H, in a wall section 2.4 m wide, 3.6 m = 2H high, 0.6 m thick | the inside face with the sill and candle |
| A20.1 | Sleeper: young woman | length about 2.1 m = 1.17H (sleeper 1.8 m = 1H), height 0.35 m | the foot end (the head at the far end) |
| A20.2 | Sleeper: old man | length about 2.1 m = 1.17H (sleeper 1.8 m = 1H), height 0.35 m | the foot end (the head at the far end) |
| A20.3 | Sleeper: fisherman | length about 2.1 m = 1.17H (sleeper 1.8 m = 1H), height 0.35 m | the foot end (the head at the far end) |
| A20.4 | Sleeper: farm woman | length about 2.1 m = 1.17H (sleeper 1.8 m = 1H), height 0.35 m | the foot end (the head at the far end) |
| A20.5 | Irrigation channel | length 3 m = 1.7H, channel 0.6 m wide, shown in a cut-out floor block 1.4 m wide and 0.6 m thick, gate top 1.2 m = 0.67H | the sluice-gate end |
| A20.6 | Harvest table | length 2.6 m = 1.45H, table height 0.9 m = 0.5H, drying rail 2.2 m = 1.2H | one long side |

## 4. Trạng thái từng sheet

| Sheet | Ảnh đã chọn | QA | Lượt đã thử | Ghi chú / lỗi còn lại |
|---|---|---|---|---|
| A15 perspective | `groups/A15_lychgate_village_extras/perspective_v2e.png` | PASS | 3: v1 → v2 → v2e (edit) | v1: nhà thờ to 1,6–2 lần so với H. v2: đúng tỷ lệ nhưng có **thánh giá** trên tháp chuông → edit bỏ. Còn: Wedge trên cửa chỉ là đá khoá vòm; H ô 1 vẽ 70 px (khung 46), nhà thờ ≈0,8× spec |
| A15 turnaround | `groups/A15_lychgate_village_extras/turnaround_v1f.png` | PASS kèm ghi chú | 4: v1 → v1e → v2 → v1f (edit của v1) | Giá chuông giờ 1,83H. Còn: H ô 1 vẽ 48 px (khung 29), ô 6 ≈98 px (khung 76) nên nhà thờ đọc ≈0,6×, chòi canh ≈0,75× so với H vẽ ra (cả hai lấp đúng khối khung); giá chuông đứng trên đường nền riêng cao hơn H; vạch dọc mảnh giữa các view; thêm vạch 1.11H ở ô 6 |
| A16 perspective | `groups/A16_churchyard_extras/perspective_v2e2.png` | PASS kèm ghi chú | 4: v1 → v2 → v2e → v2e2 (edit) | v1: thuỷ tùng giống sồi, tràn sang ô 2, nến hũ đang cháy. Còn: tán thuỷ tùng rộng ≈1,6× spec 8 m, viền tán hơi tua; cỏ và rêu nhỏ trên đá |
| A16 turnaround | `groups/A16_churchyard_extras/turnaround_v1e2.png` | PASS kèm ghi chú | 4: v1 → v1e → v2 → v1e2 (edit) | v1: dấu trên bia giống **thánh giá** → sửa. Còn: dấu bia là tam giác có nét dọc (giống mũi tên, chưa đúng Wedge hình thang); chấm cam nhỏ ở bấc nến; một vạch đứt không nhãn ở đỉnh cột đèn; cột đèn ≈1,2× |
| A17 perspective | `groups/A17_fens_drowned_village_extras/perspective_v2e.png` | PASS kèm ghi chú | 3: v1 → v2 → v2e (edit) | Bàn và bến đã đúng tỷ lệ. Còn: ở ô 6 H được vẽ lại to hơn, đứng trên đoạn nền nâng; một vạch mảnh sót phía trên thuyền; vệt nước trên tường ren mờ |
| A17 turnaround | `groups/A17_fens_drowned_village_extras/turnaround_v2.png` | PASS kèm ghi chú | 2: v1 → v2 | v1: lặp view FRONT, BACK của đá dựng sai, sàn bến cao. Còn: đá dựng ≈1,35×, tường ren ≈1,3× so với H; tổ quạ thiếu ở view FRONT của tháp |
| A18 perspective | `groups/A18_poppy_reach_gentle_house_exterior/perspective_v1e.png` | PASS kèm ghi chú | 3: v1 → v2 → v1e (edit của v1) | Bậc thang đã hạ còn ≈1H. Còn: dãy hospice mập hơn spec (dài/mái hiên ≈2,9 thay vì 4,6), cao ≈1,2×; H ô 6 vẽ 155 px (khung 106), tỷ lệ vẫn đúng |
| A18 turnaround | `groups/A18_poppy_reach_gentle_house_exterior/turnaround_v2.png` | PASS kèm ghi chú | 3: v1 → v1e → v2 | Đúng 4 view trực giao mỗi ô, LEFT/RIGHT đúng. Còn: hospice ≈1,2× cao, bậc ≈1,3×; vạch dọc mảnh giữa vài view |
| A19 perspective | `groups/A19_gentle_house_interior_props/perspective_v2e.png` | PASS | 3: v1 → v2 → v2e (edit) | Khay, bình hoa, bình phong 3 tấm (≈1H) đúng cỡ. H ô 5 vẽ ≈300 px (khung 222), tỷ lệ vẫn đúng |
| A19 turnaround | `groups/A19_gentle_house_interior_props/turnaround_v2.png` | PASS kèm ghi chú | 4: v1 → v1e → v2 → v2e | **Bình phong chỉ có 2 tấm** ở FRONT/BACK (perspective 3 tấm); 4 lần thử không đổi được → dựng 3 tấm theo perspective |
| A20 perspective | `groups/A20_garden_of_hush_sleepers_harvest/perspective_v1e.png` | PASS | 3: v1 → v2 → v1e (edit của v1) | Người ngủ ≈1H, đầu bằng đầu H, một bông anh túc từ môi, không gore. H ô 6 vẽ 249 px (khung 197), bàn ≈1,15× H vẽ ra; ruy băng cô gái màu đỏ tím; cửa cống hơi thấp |
| A20 turnaround | `groups/A20_garden_of_hush_sleepers_harvest/turnaround_v2.png` | PASS kèm ghi chú | 2: v1 → v2 | v1: camera nhìn từ trên, bông hoa ở miệng như môi đỏ. v2: profile ngang tầm mắt đúng. Còn: người ngủ dài ≈1,3×; khối kênh ≈0,48H thay vì 0,33H |

Các lượt hỏng hoặc không chọn đều giữ nguyên trong thư mục nhóm, có `*.qa.txt` ghi lỗi. Lịch sử đầy đủ trong `manifest.json` (`history` của từng job) và `E:\act1-env-batch\versions.json`.

**Bài học của lượt này (để chạy lại cho nhanh):**
- Khối mờ trong khung làm model **lấp đầy hoặc vượt khối**; khối perspective chỉ nên tính nửa phần nhô do nhìn từ trên. Asset nhỏ (khay, bình) và người nằm vẫn ra to 1,3–1,7× nếu thiếu câu so với thân người ("cao tới gối H").
- Bóng H **nhỏ hơn ≈80 px hay bị vẽ to lên**, H lớn đôi khi bị vẽ nhỏ đi; model cũng có lúc dời vạch đứt cho khớp hình (đúng như AD §6.5 cảnh báo): luôn đo bằng bóng H vẽ ra.
- Edit Astra tốt cho sửa một chỗ trên perspective (bỏ thánh giá, hạ bậc, đổi cây); trên turnaround dày, edit nhiều điểm hay lan sang ô khác (thu nhỏ cả H ô khác) → mỗi edit một thay đổi, hoặc chạy lại cả sheet với `REVISION NOTES`.
- "Nhà thờ" kéo theo thánh giá dù prompt cấm: luôn kiểm đỉnh tháp, đầu hồi, bia mộ, cọc mộ.

## 5. Cách chạy lại

```
cp ~/.codex/auth.json /e/map01-batch/home/auth.json          # auth mới cho CODEX_HOME batch
powershell -c "(Get-PSDrive C).Free/1GB"                       # kiểm C: trước mỗi đợt
cd E:/Diablo2/ashlar/art/act-01/_batches/env_A01-A14
python act01_batch.py --manifest ./manifest.json --check
python act01_batch.py --manifest ./manifest.json --dry-run
python act01_batch.py --manifest ./manifest.json --jobs A15_perspective --status ./_runs/<tên>.jsonl
```

- Runner là `act01_batch.py` của v1, **không sửa**: mỗi job một phiên `codex exec --enable image_generation -m gpt-6-astra`, `CODEX_HOME=E:/map01-batch/home`, prompt qua stdin, ảnh tham chiếu `-i` đúng thứ tự trong manifest, chỉ chép PNG của đúng phiên đó, tạo-độc-quyền (không ghi đè). Đường ra đã có PNG hợp lệ thì bỏ qua.
- **Chạy lại một sheet:** ghi lỗi vào `qa_notes.json`, thêm vào `E:\act1-env-batch\versions.json` một mục `{"<job>": {"tag": "_v2", "revision": ["…lỗi cần sửa…"], "history": [...]}}`, chạy `python build_v2.py` (sinh `prompts/<job>_v2.txt`, đổi `outputPath` sang `<kind>_v2.png`; turnaround tự trỏ sang perspective đã chọn), rồi chạy runner như trên. Prompt đã gửi được khoá (`frozen`), không sửa tại chỗ.
- **Khung tỷ lệ:** sửa `spec_v2.py`/`cues_v2.py`, chạy `python make_frames.py --tag _v3 --kinds perspective [--rise 0.5]` (khung đã dùng không bao giờ bị ghi đè: công cụ từ chối nếu thiếu tag mới), đặt `"frame": "_v3"` cho job trong `versions.json`, rồi `python build_v2.py`. Sửa một chỗ trên ảnh đã có: đặt `"edit": {"base": ..., "changes": [...]}` (mỗi edit nên chỉ một thay đổi).
- **Lỗi phiên:** "model at capacity", bị từ chối an toàn nhầm (người ngủ, áo ngủ) hoặc phiên treo → chạy lại job trong **phiên mới** (runner luôn mở phiên mới); không dừng ở "blocked".
- **QA:** `python E:/act1-env-batch/qa.py <ảnh> templates/<id>_<kind>_frame.json` → `E:/act1-env-batch/qa/...` (thước H, xám, so style).

## 6. Quy tắc riêng của lượt này

- Khung tỷ lệ: mỗi ô có bóng người xám đậm phẳng đúng 1H (cắt từ bóng H của U01 đã duyệt, tô phẳng), đường nền, vạch đứt ở chiều cao thật (nhãn theo H), **khối mờ** đánh dấu chỗ và cỡ asset (perspective: cả hình asset ở góc 3/4, camera xoay 35°, nhìn xuống 15°; turnaround: từng view trực giao). Prompt có đoạn PIXEL CHECK theo px.
- Turnaround: mỗi ô bốn view LEFT/RIGHT/FRONT/BACK, một hàng hoặc 2×2, mỗi hàng một H cùng tỷ lệ; LEFT có đầu FRONT ở bên trái ảnh, RIGHT có đầu FRONT ở bên phải ảnh (đúng quy ước §3.2).
- Màu: palette Act I (§8) theo biome; trắng sạch chỉ ở vải lanh Mercy (mái thuyền, dải vải ở bến, gối sạch, vải phủ người ngủ, vải lanh hospice); vôi trắng hospice và phấn mỏ mô tả bằng lời (canon chưa có HEX), không phải trắng Seamless, không phải trắng muối.
- Ánh sáng: người = nhỏ, ấm, lập loè, có muội (lò rèn, rổ lửa, đèn sexton); Perfection = đứng yên, đều, quầng tròn (đèn thuyền/bến Gentle House màu trắng sữa, cửa sổ và nến hospice ấm). Không bloom.
- Nội dung §3.8: không thánh giá (dấu nhà thờ là Wedge, chỉ ở nhà thờ và một bia mộ); giá treo rỗng, không xác, không thòng lọng; quan tài bật nắp trống; chữ trên bảng tên/bia chỉ là nét không đọc được; người ngủ là người lớn, mặc quần áo, bông anh túc là cây, không phải vết thương.

## 7. Điểm mở

- Người dùng là cổng duyệt cuối (§11). Các lỗi tỷ lệ ở mục 4 không chặn việc dựng model: lấy kích thước theo mục 3 (§7.2).
- Vôi trắng hospice, vải lanh và phấn mỏ chưa có HEX canon (biome doc BIO-05/BIO-06a): đang mô tả bằng lời; cần docs chốt nếu muốn khoá màu.
- Hai ảnh tham chiếu họ vật liệu (bản mờ của A01/A02 cũ) kéo A15/A16 về mức chi tiết của bộ cũ (đá lửa thành nhiều viên, rêu nhỏ); nếu người dùng muốn ít chi tiết hơn nữa, chạy lại không gắn bản mờ.
- Phạm vi Map 1 và bố cục cuối của 6 base map chưa khoá (AD §14); id A15.x–A20.x chỉ là danh mục concept.
- Chưa làm: gallery HTML cho v2; bản "sau Act I" của hub/wild (AD §9: ruy băng đen thay nhành anh túc, Gentle House tắt đèn…).
