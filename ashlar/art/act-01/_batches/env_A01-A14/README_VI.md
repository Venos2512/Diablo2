# Act I environment: 84 concept asset theo biome và khu vực

> **Trạng thái:** ĐÃ GIAO 28 PNG đã chọn (14 perspective + 14 turnaround), tất cả 1536×1024, cho 14 nhóm / 84 concept asset (60 mới + 24 tái dùng) phủ 11 khu thuộc 8 biome theo mapping ở mục 4. Đây là **concept reference**, KHÔNG phải bản vẽ trực giao kỹ thuật, không phải GLB/UV/PBR, không phải texture tileable. Nhãn `H` trong ảnh chỉ là hướng dẫn thị giác gần đúng; kích thước dựng model chính xác phải xác nhận khi làm model. Danh sách asset, thiết kế và kích thước vẫn là **đề xuất** (không phải canon, không phải bố cục cuối của map Act I). `H` = người trung tính **1,8 m**. **Review Opus 5.5: PASS ngày 2026-10-20 (vòng act1-env-final-review-20261020-r2).** Kiểm tra độc lập: 28 PNG giải mã được, SHA-256 và dung lượng khớp manifest/inventory/thư mục giao/ZIP; ZIP không hỏng; runner `--check` có 0 lỗi và dry-run không tạo lại ảnh.
> Nguồn ảnh: 4 perspective cũ (A01–A04) được tham chiếu tại chỗ, không đổi; 4 turnaround cũ (E03→A01, E04→A02, E01→A03, E02→A04) đã **nhập (copy một lần, không ghi đè)**, sha giữ nguyên; 20 ảnh A05–A14 sinh bằng `image_gen` tích hợp. Riêng **A14** bản chọn là `perspective_scale_v2.png` và `turnaround_scale_v2.png` (generation + edit); bản gốc `perspective.png`/`turnaround.png` giữ nguyên làm bản nháp.
> Gallery xem nhanh: `gallery.html` (file tĩnh cục bộ, không phải website; xem mục 1); `inline_preview.html` là bản nhỏ gọn (2 ảnh) để xem trước trong T3. Ngoài ra không sửa file nào ngoài thư mục này; ảnh gốc ở `map-01-concepts/environments/` không bị di chuyển hay ghi.

> **Vị trí sau sắp xếp 2026-10-24 (vòng 3):** thư mục này là hạ tầng của lô (`ashlar/art/act-01/_batches/env_A01-A14/`). Ảnh của từng nhóm nằm ở `ashlar/art/act-01/environments/<id>_<slug>/` (chỗ nào trong tài liệu này ghi `groups/<id>_<slug>/` thì đọc là thư mục đó); file phụ (`*.prompt.txt`, `*.task.txt`, `*.generation.log`, `*.result.txt`, `*qa*.txt`) nằm trong `_work/` của nhóm.

## 1. Gồm những gì

| File | Nội dung |
|---|---|
| `manifest.json` | 14 nhóm, 28 job, `areaCoverage` (11 khu Act I), đường dẫn tuyệt đối dấu `/`, cùng khuôn với `../map01/_brief/MANIFEST.json`. Mỗi job có `status` = delivered và `delivery` (kích thước, bytes, `sha256`, provenance); job A14 có thêm `supersededOutputs` (bản gốc) và `edit` |
| `prompts/*.txt` | 20 prompt tiếng Anh đầy đủ (10 nhóm mới × perspective + turnaround) |
| `act01_batch.py` | runner nhỏ, mang đi được, đọc manifest (có `--dry-run`, `--check`) |
| `gallery.html` | gallery xem nhanh, CSS+JS nội tuyến, không mạng/fetch: 14 tab nhóm, nút perspective/turnaround, khu + biome + 6 tên asset + mô tả ngắn, mỗi lúc chỉ một ảnh hiện (ảnh `<img>` lazy, đường dẫn tuyệt đối trong `src`, lấy từ `outputPath` trong manifest nên A14 trỏ tới `*_scale_v2.png`). Ảnh đọc lỗi vẫn hiện dòng báo lỗi. Khoảng 200 MiB nếu inline hết nên chỉ mở cục bộ, không dùng cho `html_preview` |
| `inline_preview.html` | bản xem trước nhỏ gọn cho T3 `html_preview`/`html_render`: đúng 2 thẻ `<img>` (Rook's Weir A07 + Gentle House A11, perspective), nút chuyển giữa hai ảnh, CSS+JS nội tuyến; không chứa bản sao 28 ảnh |
| `build_gallery.py`, `gallery.template.html` | sinh lại `gallery.html` từ `manifest.json` (`python build_gallery.py`; chỉ đọc manifest, chỉ ghi `gallery.html`). Sửa mô tả tiếng Việt trong `DESC` của script |
| `groups/<id>_<slug>/perspective.png`, `turnaround.png` | đường ra cố định; do Astra tạo, không bao giờ ghi đè. `A01–A04/turnaround.png` là ảnh nhập (từ E03/E04/E01/E02, kèm nhãn nguồn `turnaround.source.txt`). Các file `*.prompt.txt`, `*.task.txt`, `*.generation.log`, `*.result.txt` là bản prompt gốc đã gửi và log sinh ảnh, giữ nguyên |
| `groups/A14_the_cradle/perspective_scale_v2.png`, `turnaround_scale_v2.png` | **bản chọn của A14** (generation + edit sửa tỉ lệ H). `perspective.png`/`turnaround.png` cùng thư mục là bản nháp gốc, không ghi đè, không xóa |
| `groups/A14_the_cradle/*_scale_v2.edit_prompt.txt` | prompt edit (root, tóm tắt trung thực) cho hai ảnh v2 |
| `_runs/delivery_inventory_2026-10-20.json` | kho giao nhận 28 ảnh đã chọn: kích thước, bytes, `sha256`, provenance; bản nháp A14 và hai lượt edit |
| `_runs/import_turnarounds_2026-10-20.json` | bản ghi nhập 4 turnaround cũ: nguồn, `sha256`, kích thước |
| `_runs/batch_2026-10-20.jsonl` | status JSONL của lượt chạy thật (20 job A05–A14, ghi cả bản gốc A14; giữ nguyên) |

## 2. Con số

| Hạng mục | Số lượng |
|---|---|
| Khu Act I phủ | **11** (LD §11.2–§11.12), thuộc **8 biome** (BIO-01…06, 26, 27) |
| Nhóm | **14** = 4 tái dùng + 10 mới |
| Concept asset | 14 × 6 = **84** (60 mới + 24 tái dùng; đề xuất) |
| Job | **28** = 14 perspective + 14 turnaround |
| PNG đã chọn đã giao | **28** (14 perspective + 14 turnaround), tất cả 1536×1024 |
| Perspective cũ tái dùng (A01–A04) | **4** (tham chiếu tại chỗ, không đổi) |
| Turnaround cũ đã nhập (A01–A04) | **4** (copy độc quyền, `sha256` khớp) |
| Ảnh mới sinh (A05–A14) | **20** = 10 perspective + 10 turnaround; trong đó 2 ảnh A14 là bản edit `*_scale_v2.png` |
| Prompt trong `prompts/` | **20** (turnaround của 4 nhóm cũ dùng lại prompt cũ ở `_brief/prompts/E0x_turnaround.txt`, chỉ còn là nguồn gốc) |

## 3. 14 nhóm

| Nhóm | Tên | Nguồn | Khu chính | Khu dùng chung | 6 asset (ô 1–6) |
|---|---|---|---|---|---|
| A01 | Lychgate: làng đá lửa (E03) | tái dùng `E03` | 11.2 | 11.5 | 1 Repaired thatched stilt cottage · 2 Raised wooden walkway segment · 3 Patched low flint wall · 4 Willow hurdle fence · 5 Village well · 6 Eel-trap fishing rack |
| A02 | Churchyard: nghĩa địa (E04) | tái dùng `E04` | 11.3 | 11.2 | 1 Lychgate roofed gate · 2 Mortsafe grave cage · 3 Small mismatched headstone cluster · 4 Round ossuary tower · 5 Faceless saint statue supporting arch · 6 Funeral hand cart |
| A03 | Đầm lầy: cây cỏ và đá (E01) | tái dùng `E01` | 11.4 | 11.5, 11.7 | 1 Low grass clump · 2 Tall reeds clump · 3 Sedge water clump · 4 Large moss rock · 5 Peat bank chunk · 6 Waterlogged root stump |
| A04 | Cây liễu và gỗ (E02) | tái dùng `E02` | 11.7 | 11.4, 11.5 | 1 Old broad weeping willow · 2 Young willow · 3 Dead angular tree · 4 Gnarled stump · 5 Fallen hollow trunk · 6 Exposed willow root cluster |
| A05 | Bề mặt đất yên và chuyển tiếp | MỚI | — | 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8 | 1 Peat meadow floor · 2 Fen shore mud-to-water · 3 Cobble road with grass verge · 4 Poppy meadow soil · 5 Churchyard turf and grave earth · 6 Chalk and flint spoil floor |
| A06 | Night Fens: lối đi và landmark | MỚI | 11.4 | — | 1 Fen causeway segment · 2 Upright marker stone · 3 Stepping-stone ford · 4 Unlit bog lure post · 5 Half-sunk fen punt · 6 Broken bridge pier |
| A07 | Rook's Weir: làng ngập nước | MỚI | 11.5 | — | 1 Half-drowned flint cottage · 2 Timber-and-stone weir segment · 3 Gable wall with door arch · 4 Sunken roof-ridge platform · 5 Pontoon plank raft · 6 Rook roost pole |
| A08 | Poppy Reach: đồng thuốc phiện | MỚI | 11.6 | — | 1 Poppy drift clump · 2 Drystone wall with stile gap · 3 Abandoned hillside farmhouse · 4 Hay rick · 5 Field gate between stone posts · 6 Poppy-drying rack |
| A09 | Willow Mere: đám cưới và rễ | MỚI | 11.7 | — | 1 Willow wedding arch · 2 Long wedding trestle table · 3 Root-bound chair pair · 4 Great willow root arch · 5 Mere jetty with skiff · 6 Faded ribbon bunting line |
| A10 | Flint Delvings: mỏ phấn và đá lửa | MỚI | 11.8 | — | 1 Chalk-and-flint cut wall · 2 Timber pit-prop frame · 3 Shaft well-head with windlass · 4 Antler pick rack · 5 Spoil heap with sledge · 6 Cold kiln hearth |
| A11 | Gentle House: hospice | MỚI | 11.9 | — | 1 Whitewashed cloister bay · 2 Hospice bed · 3 Refectory table with bread · 4 Gate tower · 5 Kitchen hearth with cauldron · 6 Steady candle stand |
| A12 | Mộng Edda: ngôi nhà trong mơ | MỚI | 11.10 | — | 1 New thatched cottage · 2 Garden gate · 3 Picket fence section · 4 Vegetable beds · 5 Washing line · 6 Looping stepping-stone path |
| A13 | Garden of Hush: vườn người ngủ | MỚI | 11.11 | — | 1 Sleeping bed furrow · 2 Cloth canopy frame · 3 Pink night-light jar · 4 Hush bell post · 5 Root-vaulted wall bay · 6 Poppy furrow |
| A14 | The Cradle: cell của Mercy | MỚI | 11.12 | — | 1 Bone-rail crib frame · 2 Linen curtain pair · 3 Milk-white night-light · 4 Bone mobile on stand · 5 Quilted floor platform · 6 Rocker runner pair |

## 4. Phủ 11 khu Act I

| LD § | Khu | Biome | Nhóm chính | Nhóm dùng chung |
|---|---|---|---|---|
| 11.2 | Lychgate | BIO-03 | A01 | A02, A05 |
| 11.3 | Churchyard, Grave Matters | BIO-03 | A02 | A05 |
| 11.4 | The Night Fens | BIO-01 | A03, A06 | A04, A05 |
| 11.5 | Rook's Weir | BIO-01 | A07 | A01, A03, A04, A05 |
| 11.6 | The Poppy Reach | BIO-02 | A08 | A05 |
| 11.7 | The Willow Mere | BIO-01 | A04, A09 | A03, A05 |
| 11.8 | The Flint Delvings | BIO-06 | A10 | A05 |
| 11.9 | The Gentle House | BIO-05 | A11 | — |
| 11.10 | Edda's Dream | BIO-26 | A12 | — |
| 11.11 | The Garden of Hush | BIO-04 | A13 | — |
| 11.12 | The Cradle | BIO-27 | A14 | — |

Ánh xạ nhóm cũ: `E03` làng Lychgate (hub 11.2), `E04` nghĩa địa (11.3; còn dùng cho Prologue 10.2), `E01` cây cỏ đầm lầy (11.4/11.5/11.7), `E02` liễu (11.7 và 11.4). A05 là bề mặt đất dùng chung nhiều khu, **không** tính là nhóm chính của khu nào.

## 5. Quy tắc

- **Bố cục:** mỗi sheet 6 ô đánh số 3x2, mỗi ô một asset và một bóng người `H` 1,8 m cùng đường nền, cùng tỉ lệ cục bộ. Turnaround: mỗi ô **bốn view nhỏ** LEFT/RIGHT/FRONT/BACK (1 hàng hoặc 2x2 cho asset rộng) và `dependsOn` perspective cùng nhóm; ảnh perspective **đã sinh** được đính làm ảnh danh tính (đường ra của job perspective = tham chiếu thứ cuối của turnaround, runner kiểm tra; với A14 là `perspective_scale_v2.png`).
- **Style:** painterly kiểu Immortal, low detail, mảng lớn mờ, theo mật độ `stylized2` (`_review_stylized2.jpg` đính cho **mọi** job). Màu và mood riêng từng khu, không phủ Dark Wood hay xanh D2 lên toàn bộ.
- **`d2_webgl.png`** (mood Act I D2 ngoài trời) chỉ đính cho A01–A09. **Không** đính cho Flint Delvings (mỏ), Gentle House (hospice), Edda's Dream, Garden of Hush, The Cradle.
- **A05:** là *concept surface* (tấm đất mỏng, mép cắt tay), **không** phải texture tileable. Tile thật phải làm riêng theo quy trình tuần hoàn.
- **A10 Flint Delvings** là mỏ phấn và đá lửa Act I (BIO-06a), **không phải** mỏ muối Act III: cấm muối, teal, tinh thể. Đỏ-cam lò chỉ là vật liệu gốm nung, không phát sáng.
- **A11–A14 sạch/mới:** prompt style yêu cầu mọi asset sạch, mới, không vá, không nứt, không mòn; không còn dòng "vá/sửa" nào trong prompt (turnaround A11/A12 đã bỏ cụm "repair patches" ở dòng danh tính; ảnh A11/A12 đã được root kiểm sạch, không sinh lại).
- **A11–A14:** trắng vôi/lanh, đèn ngủ hồng, vàng-xanh của Edda và màu của Cradle là **đề xuất** (canon thiếu HEX, xem `docs/ASHLAR_BIOME_VA_KHU_VUC_VI.md`). Không phát sáng, không dùng trắng Seamless hay trắng muối. A13 giường rỗng, A14 không hình trẻ sơ sinh.
- Độ phân giải: ưu tiên 3:2, 4K nếu công cụ cho; ảnh cũ là 1536×1024.

## 6. Cách chạy (Astra/root)

> Cả 28 đường ra đã có PNG hợp lệ nên `--dry-run` chỉ cho `reuse-existing` (4) và `skip-exists` (24); chạy thật sẽ không sinh lại gì. Phần dưới mô tả runner đã dùng cho lượt A05–A14.

```
python act01_batch.py --check                       # kiểm manifest, độ phủ, prompt, thứ tự tham chiếu
python act01_batch.py --dry-run [--show-cmd]        # xem mọi job; KHÔNG ghi, KHÔNG sinh
python act01_batch.py --groups A05 A06              # chạy thật (cần --jobs / --groups / --all)
```

- Mỗi job = một phiên `codex exec --enable image_generation -m gpt-6-astra` riêng, `CODEX_HOME=E:/map01-batch/home`, **chỉ** `image_gen` tích hợp một lần (header generation-only như runner Map 01); không `image_gen.py`, không API key (runner còn gỡ `OPENAI_API_KEY`/`CODEX_API_KEY` khỏi môi trường con).
- Mặc định song song 3, thử 1 lần, timeout 1200 s (giới hạn 60–7200); quá hạn thì giết cả cây tiến trình Windows (`taskkill /T /F`). Lệnh dùng danh sách tham số, không shell.
- Trước khi gửi: kiểm prompt, ảnh tham chiếu, phụ thuộc. Job thiếu phụ thuộc bị `BLOCKED`, không gửi. Perspective chạy trước (wave 1), turnaround sau (wave 2); perspective lỗi thì turnaround ghi `blocked-dependency`.
- PNG hợp lệ có sẵn thì bỏ qua; file có sẵn nhưng hỏng thì **giữ nguyên, không ghi đè, không sinh lại**. Sidecar (`.task/.prompt/.generation.log/.result`) có hậu tố `.r2…` nếu đã tồn tại.
- Ảnh nguồn chỉ lấy từ **đúng thư mục `generated_images/<session id>` của phiên đó** (id đọc từ log). Nhiều PNG trong một phiên thì từ chối (dùng `--pick-latest` sau khi xem). PNG được giải mã đầy đủ, kiểm kích thước tối thiểu (`--min-size`, mặc định 1024x680), copy bằng tạo-độc-quyền, so `sha256`. Status ghi `session`, `src`, `out`, `size`, `sha256`, `bytes`.
- Log/status chỉ ghi phần đuôi đã che token; không in biến môi trường.

## 7. Điểm mở

- Gán Map 1 → area vẫn chưa khóa (AD §7.1); brief không giải quyết.
- 60 asset mới là đề xuất; bộ bàn giao và công cụ đã qua review Opus 5.5 (PASS). Danh sách/kích thước chỉ là đề xuất, chưa phải canon.
- Ảnh là concept reference: không phải bản vẽ trực giao kỹ thuật, GLB, UV/PBR hay texture tileable. Nhãn H là hướng dẫn thị giác gần đúng; kích thước dựng model chính xác cần xác nhận khi làm model.
- A01–A04 turnaround là ảnh cũ được nhập (không sinh lại); prompt cũ ghi "1H" (không ghi 1,8 m); manifest chỉ chú thích H = 1,8 m, không sửa prompt gốc.
- A14: bản chọn là hai ảnh `*_scale_v2.png`. `prompts/A14_turnaround.txt` đã trỏ tới `perspective_scale_v2.png`, còn bản prompt đã gửi thật (`groups/A14_the_cradle/turnaround.prompt.txt`) vẫn trỏ `perspective.png` làm nguồn gốc. Một ảnh trung gian không dùng (`call_da05…`) nằm trong cùng thư mục phiên edit; theo dấu thời gian nó có trước ảnh cuối.
- A05 dùng d2 mood vì đa số mẫu là đất ngoài trời; mẫu chalk có thể lệch mood mỏ, cần xem khi duyệt.
- Trắng hospice/Cradle và HEX Edda là đề xuất; cần docs fixer chốt.

## 8. Kiểm tra đã chạy

Lượt giao nhận này: `act01_batch.py --check` (14 nhóm, 28 job, 84 asset, 11 khu, 0 lỗi); `--dry-run` (4 reuse-existing + 24 skip-exists, không ghi file, không sinh); giải mã đầy đủ 28 PNG đã chọn: tất cả hợp lệ 1536×1024, `sha256` ghi trong manifest/`delivery_inventory`; `sha256` hai ảnh v2 khớp file nguồn edit. Chưa chạy kiểm tra nào rộng hơn, chưa có kết luận review Opus.

Trước đó (runner): 4 turnaround cũ nhập bằng mở `xb` (không ghi đè), giải mã 1536×1024, `sha256` bản đích = bản gốc. Smoke test runner với `codex.js` giả (không sinh ảnh thật): ghi/bỏ qua/giữ file hỏng/từ chối nhiều ảnh/ảnh hỏng/thiếu phụ thuộc/timeout giết cây tiến trình/gỡ API key đều đạt.
