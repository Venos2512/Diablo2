# Act I environment v3: 30 concept asset còn thiếu (A21–A25)

> **Trạng thái (22/10/2026):** đang tạo ảnh. Sheet perspective chạy trước, sheet turnaround chạy sau khi perspective qua QA.

> Đây là **concept reference** (sheet 6 asset: một sheet perspective, một sheet turnaround), chưa phải GLB. Thiết kế và kích thước là **đề xuất** (Đề xuất AD), không phải canon. `H` là người trung tính cao **1,8 m**. Khi dựng model, lấy kích thước theo bảng ở mục 3, không đo trên ảnh (AD §7.2).

## 1. Cái gì và vì sao

- **Cái gì:** 5 nhóm A21–A25, mỗi nhóm 6 asset, mỗi nhóm hai sheet (perspective rồi turnaround): **10 ảnh, 30 asset**. Đây là phần tiếp của A15–A20 trong [`../act-01-environments-v2/`](../act-01-environments-v2/README_VI.md).
- **Vì sao:** trên sáu base map Act I còn những khối giữ chỗ (`N…`) chưa có concept. Danh sách lấy từ `lookdev-lab/docs/act1-base/ASSETS.md`, ghi chú thiết kế theo LD §11.2–§11.12 và AD §10.2. Có thêm bản **vẽ lại A17.1 (hai đá nghiêng)**: lối đi giữa hai đá cũ chỉ khoảng 1 m, bản mới rộng 2,6 m. Nguồn: `tmp/act1-base-maps/MISSING_ENV_CONCEPTS_2.md`.
- **Hai kiểu nhìn:** Gentle House, Garden of Hush, the Cradle là nơi của Mercy: liền mạch, sạch quá mức, vôi trắng mới, vải lanh trắng sạch, không vá. Đồ của người ở Act I thì cũ, có vài chỗ vá lớn.
- **Bám art direction:** prompt dán nguyên văn §3.1 STYLE CORE, §3.2 SHEET RULES, §3.7 ENVIRONMENT RULES cùng khối "Sheet 6 asset", và §3.8 CONTENT. Ảnh thứ hai là khung tỷ lệ vẽ bằng code (§6.5). Sheet turnaround gắn sheet perspective đã chọn làm ảnh danh tính (§7.2). A21 gắn thêm bản làm mờ của ô A17.1 cũ, kèm các dòng `WRONG IN THE REFERENCE` (§1.3). Mỗi ảnh QA theo §11.

## 2. Gồm những gì

| File | Nội dung |
|---|---|
| `manifest.json` | 5 nhóm, 10 job, 30 asset; cùng khuôn với manifest v1/v2, chạy được bằng runner v1 `act01_batch.py --manifest` |
| `prompts/*.txt` | prompt tiếng Anh của từng lượt; chạy lại thì có hậu tố mới |
| `templates/` | khung tỷ lệ 1536×1024 (`*_perspective_frame_r05.png`, `*_turnaround_frame.png`) kèm `.json` số đo; `ref_A17_1_old_blur22.png` (ô A17.1 cũ, đã làm mờ) |
| `groups/<id>_<slug>/*.png` | ảnh Astra, không ghi đè ảnh nào; mỗi ảnh kèm `.prompt.txt`, `.task.txt`, `.generation.log`, `.result.txt` |
| `_runs/*.jsonl` | log trạng thái của runner |

Công cụ phiên nằm ngoài repo, ở `E:ct1-env-batch3\`: `spec_v3.py` (nội dung 30 ô), `make_frames_v3.py` (chạy `make_frames.py` của v2 trên spec này), `build_v3.py` (bản chép có chỉnh của `build_v2.py`), `versions_v3.json`.

## 3. ID và kích thước đề xuất (A21.1–A25.6)

`W` là bề ngang mặt FRONT, `D` là chiều sâu, `h` là điểm cao nhất. Cột "Id base map" là khối giữ chỗ trên base map mà ô này thay.

| Nhóm | Tên | Biome | Base map |
|---|---|---|---|
| A21 | Lychgate: hầm nhà Barrow, tường kè; đầm: đá nghiêng (vẽ lại), mộ đầm | BIO-03 (Làng đá lửa & sân nhà thờ); BIO-01 (Đầm lầy & làng nước) | lychgate, fens |
| A22 | Đầm và Poppy Reach: đồ người để lại (giày, cột thu tiền đò, nôi, mộ đá, gậy và áo, búp bê rơm) | BIO-01 (Đầm lầy & làng nước); BIO-02 (Đồng thuốc phiện); BIO-04 (giày dùng lại) | fens, poppyReach, gardenOfHush |
| A23 | Poppy Reach (gặt bỏ dở, cây táo gai buộc ruy băng) và vườn Gentle House (luống hoa, chậu hoa, dây phơi lanh) | BIO-02 (Đồng thuốc phiện) -> BIO-05 (Hospice vôi trắng) | poppyReach, gentleHouse |
| A24 | Gentle House (bàn bếp, giá bánh, bàn gấp vải) và vải lanh của Mercy ở Garden of Hush và the Cradle | BIO-05 (Hospice vôi trắng); BIO-04 (Garden of Hush); BIO-27 (the Cradle) | gentleHouse, gardenOfHush, cradle |
| A25 | Garden of Hush: vòm rễ, cầu ván, đống sập, giỏ thu hoạch, đồ chăm của Poppy Nurse, đèn của Tamsin | BIO-04 (Hầm xương & vườn đất) | gardenOfHush |

| ID | Id base map | Asset (nhãn trên sheet) | Kích thước đề xuất (1H = 1,8 m) | FRONT |
|---|---|---|---|---|
| A21.1 | `N01` | Barrow vault door | width 2.4 m = 1.33H, depth 0.8 m = 0.44H, height 2.8 m = 1.56H | the face with the door |
| A21.2 | `N02` | Flint retaining wall | width 4 m = 2.22H, depth 0.9 m = 0.5H, height 3.2 m = 1.78H | the outer face of the wall |
| A21.3 | `N04` | Peat stack | width 1.6 m = 0.89H, depth 1 m = 0.56H, height 1.1 m = 0.61H | the long side |
| A21.4 | `N10` | Vigil chair | width 0.6 m = 0.33H, depth 0.6 m = 0.33H, height 0.95 m = 0.53H | the front of the seat |
| A21.5 | `A17.1 (redraw)` | The leaning stones | width 4.6 m = 2.56H, depth 1.4 m = 0.78H, height 4.6 m = 2.56H; the passage between the stones 2.6 m = 1.44H wide at the ground and still 2.6 m wide at 2.2 m = 1.22H | looking along the path through the passage |
| A21.6 | `N-FN03` | Bog grave | length 2.4 m = 1.33H, width 1.3 m = 0.72H, mound height 0.5 m = 0.28H, stake 1.6 m = 0.89H | the foot end (the willow stake at the far end) |
| A22.1 | `N-FN02 / N-GD11` | Worn shoes | the pair: width 0.45 m = 0.25H, depth 0.45 m = 0.25H, height 0.16 m = 0.09H | the toes |
| A22.2 | `N-FN06` | Toll post with coin dish | width 0.5 m = 0.28H, depth 0.5 m = 0.28H, height 1.3 m = 0.72H | the side with the coin dish |
| A22.3 | `N-FN08` | Empty wicker cradle | length 1.0 m = 0.56H, width 0.6 m = 0.33H, hood top 0.75 m = 0.42H | the long side, hood at image-right |
| A22.4 | `N-PR02` | Harvester's cairn | width 1.2 m = 0.67H, depth 1.2 m = 0.67H, height 1.1 m = 0.61H | the side with the name slate |
| A22.5 | `N-PR03` | Crook and folded coat | width 0.9 m = 0.5H, depth 0.5 m = 0.28H, crook height 1.6 m = 0.89H | the side with the coat in front of the crook |
| A22.6 | `N-PR05` | Straw doll | width 0.3 m = 0.17H, depth 0.2 m = 0.11H, height 0.35 m = 0.19H | the front of the doll |
| A23.1 | `N-PR01` | Abandoned reaping | width 2.4 m = 1.33H, depth 2 m = 1.11H, height 1.1 m = 0.61H | the side with the scythe handle |
| A23.2 | `N-PR04` | Ribbon thorn | height 5.5 m = 3H, crown width 6 m = 3.3H | the side the trunk leans toward |
| A23.3 | `N-HS02` | Garth flower bed | width 3.2 m = 1.78H, depth 3.2 m = 1.78H, height 0.55 m = 0.31H | one side of the square bed |
| A23.4 | `N-HS03` | Potted flowers | height 0.75 m = 0.42H, pot width 0.6 m = 0.33H | the side with the poppy |
| A23.5 | `N-HS04` | Walled flower bed | width 4 m = 2.22H, depth 1.4 m = 0.78H, height 0.5 m = 0.28H | the long side |
| A23.6 | `N-HS05` | Linen drying line | width 6 m = 3.33H, depth 0.3 m = 0.17H, height 2.2 m = 1.22H | the face of the sheets |
| A24.1 | `N-HS06` | Kitchen work table | width 2.4 m = 1.33H, depth 1 m = 0.56H, height 0.9 m = 0.5H | one long side |
| A24.2 | `N-HS07` | Bread rack | width 1.6 m = 0.89H, depth 0.5 m = 0.28H, height 1.8 m = 1H | the open front with the loaves |
| A24.3 | `N-HS08` | Linen folding table | width 2.4 m = 1.33H, depth 1 m = 0.56H, height 0.9 m = 0.5H | one long side |
| A24.4 | `N-GD10` | Turned-down coverlet | width 1.14 m = 0.63H, length 1.9 m = 1.06H, thickness 0.12 m | the foot end (the pillow at the far end) |
| A24.5 | `N-CR02` | Turned-down quilt | width 3 m = 1.67H, length 2.6 m = 1.44H, thickness 0.24 m = 0.13H | the foot end (the turned-down fold at the far end) |
| A24.6 | `N-CR03` | Linen pillow | width 1.5 m = 0.83H, depth 0.75 m = 0.42H, height 0.32 m = 0.18H | the long side |
| A25.1 | `N-GD01` | Root rib arch | width 6.5 m = 3.61H, depth 0.5 m = 0.28H, height 4.9 m = 2.72H | the face of the arch (looking along the passage) |
| A25.2 | `N-GD05` | Plank crossing | width 1.5 m = 0.83H, length 2.3 m = 1.28H, thickness 0.1 m | one end of the planks |
| A25.3 | `N-GD07` | Root fall | width 4.6 m = 2.56H, depth 5.4 m = 3H, height 2.6 m = 1.44H | the side facing the blocked way |
| A25.4 | `N-GD08` | Harvest basket | width 0.56 m = 0.31H, height 0.45 m = 0.25H | the side with the folded cloth |
| A25.5 | `N-GD09` | Tending kit | width 1 m = 0.56H, depth 0.45 m = 0.25H, height 0.5 m = 0.28H | the side with the watering can at image-right |
| A25.6 | `N-GD15` | Tamsin's lantern | width 0.3 m = 0.17H, depth 0.6 m = 0.33H, height 1 m = 0.56H | the side the arm reaches toward (image-right) |

## 4. Trạng thái từng sheet

| Sheet | Ảnh đã chọn | QA | Ghi chú |
|---|---|---|---|
| A21 perspective | chưa có | — |  |
| A21 turnaround | chưa có | — |  |
| A22 perspective | chưa có | — |  |
| A22 turnaround | chưa có | — |  |
| A23 perspective | chưa có | — |  |
| A23 turnaround | chưa có | — |  |
| A24 perspective | chưa có | — |  |
| A24 turnaround | chưa có | — |  |
| A25 perspective | chưa có | — |  |
| A25 turnaround | chưa có | — |  |

## 5. Cách chạy lại

```
cp ~/.codex/auth.json /e/map01-batch/home-nam/auth.json        # tài khoản Codex mới (Plus), tối đa ~6 phiên song song
cd E:/Diablo2/ashlar/art/act-01-environments
python act01_batch.py --manifest ../act-01-environments-v3/manifest.json --codex-home E:/map01-batch/home-nam --check
python act01_batch.py --manifest ../act-01-environments-v3/manifest.json --codex-home E:/map01-batch/home-nam --jobs A21_perspective
```

- **Chạy lại một sheet:** thêm vào `E:ct1-env-batch3ersions_v3.json` mục `{"<job>": {"tag": "_v2", "revision": ["…lỗi…"]}}`, chạy `python build_v3.py`, rồi chạy runner. Prompt đã gửi không sửa tại chỗ.
- **Lỗi phiên** ("model at capacity", từ chối nhầm, treo): chạy lại ở **phiên mới**. Gặp lỗi hết hạn mức (usage limit) thì dừng và ghi lại.
- **Ảnh hàng cho Tripo** của các asset này: xem `tmp/act1-base-maps/TRIPO_ROWS.md` §3 và AD §3.7 (`TRIPO ROW INPUT`).
