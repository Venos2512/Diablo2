### Prop: `props/act1_kit_v1/`: A21–A25 (30 asset, hàng R23–R33, 2026-10-22)

Concept: `ashlar/art/act-01/environments/A21_…A25_*` (sheet đã chọn ghi ở `ashlar/art/act-01/_batches/env_A21-A25/README_VI.md`) (sheet đã chọn ghi ở `README_VI.md`: A21 `perspective_v2g`, A22 và A23 `perspective_v2e`, A24 `perspective`, A25 `perspective_v2f`, cùng `turnaround.png` của mỗi nhóm). Mỗi ảnh hàng `rows/R##_<slug>/input_spaced.png` (R24 dùng `input_r2.png`) được dựng một lần trong Tripo Studio (Smart Mesh một ảnh, 4 variant, Smart UV, texture, PBR), rồi `_tools/split_rows.py` tách mỗi vật thành một GLB (tuỳ chọn từng vật ở `_tools/rows.json`). Kệ bánh A24.2 dựng riêng ở hàng `R31r`.

GLB chuẩn hoá như GLB gốc Tripo: cạnh dài nhất 1, gốc ở giữa đáy, +y lên, mặt trước +z. Kích thước thật là W × D, cao H (W là bề ngang mặt trước); khi đưa vào game hay lab thì scale theo kích thước này. Mỗi thư mục có `concept.png` (phần ảnh hàng của vật đó) và `_shots/final_views.png` (trước, 45°, bên, sau). Ảnh tổng: `_review/act1_kit_v1_A21-A25.png`. Tiến độ và credit: `tmp/act1-base-maps/TRIPO_PROGRESS.md`, mục "R23–R33".

| Vật | Hàng, variant | GLB | Tam giác | Kích thước thật | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| [A21.1 Barrow vault door](props/act1_kit_v1/A21_1_barrow_door/) | R25 v2, 4K | 7,2 MB | 8.956 | 2,4 m × 0,8 m, cao 2,8 m |  |
| [A21.2 Flint retaining wall](props/act1_kit_v1/A21_2_flint_retaining_wall/) | R25 v2, 4K | 8,1 MB | 6.760 | 4 m × 0,9 m, cao 3,2 m | Mặt tường là mấy tấm rời trước khung (giữ cả); 3 variant còn lại chỉ có khung rỗng. |
| [A21.3 Peat stack](props/act1_kit_v1/A21_3_peat_stack/) | R27 v1, 8K | 6,8 MB | 10.856 | 1,6 m × 1 m, cao 1,1 m |  |
| [A21.4 Vigil chair](props/act1_kit_v1/A21_4_vigil_chair/) | R27 v1, 8K | 2,2 MB | 3.278 | 0,6 m × 0,6 m, cao 0,95 m | Hai mảnh, giữ cả. |
| [A21.5 The leaning stones (A17.1 v2)](props/act1_kit_v1/A21_5_leaning_stones/) | R23 v1, 4K | 4,6 MB | 840 | 4,6 m × 1,4 m, cao 4,6 m | Bản v2 của A17.1 (id bản đồ vẫn là A17.1). Lối đi đo được 1,78 m ở độ cao 2,2 m (1,65 m sát đất) khi rộng 4,6 m; spec 2,6 m nên trong lab kéo ngang khoảng ×1,46. Khối dựng ra 4,6 × 4,30 × 2,30 m (spec 4,6 × 4,6 × 1,4). Ít đa giác (840 tam giác). |
| [A21.6 Bog grave](props/act1_kit_v1/A21_6_bog_grave/) | R27 v1, 8K | 9,8 MB | 12.746 | 1,3 m × 2,4 m, cao 1,6 m | Cọc và dải vải là mảnh rời cắm trên mộ (giữ cả). |
| [A22.1 Worn shoes (pair)](props/act1_kit_v1/A22_1_worn_shoes/) | R29 v2, 8K | 2,3 MB | 4.957 | 0,45 m × 0,45 m, cao 0,16 m | Đôi giày dính thành một khối, giữ thẳng. Dùng cho cả N-FN02 và N-GD11. |
| [A22.2 Toll post with coin dish](props/act1_kit_v1/A22_2_toll_post/) | R28 v2, 8K | 4,3 MB | 5.021 | 0,5 m × 0,5 m, cao 1,3 m | Ba mảnh chồng nhau (chân có cuộn thừng, cột, đĩa), giữ cả. |
| [A22.3 Empty wicker cradle](props/act1_kit_v1/A22_3_wicker_cradle/) | R29 v2, 8K | 26,8 MB | 18.318 | 1 m × 0,6 m, cao 0,75 m | Giữ thẳng (chân đu cong). |
| [A22.4 Harvester's cairn](props/act1_kit_v1/A22_4_harvester_cairn/) | R28 v2, 8K | 9,3 MB | 18.906 | 1,2 m × 1,2 m, cao 1,1 m |  |
| [A22.5 Crook and folded coat](props/act1_kit_v1/A22_5_crook_and_coat/) | R28 v2, 8K | 3,8 MB | 5.294 | 0,9 m × 0,5 m, cao 1,6 m |  |
| [A22.6 Straw doll](props/act1_kit_v1/A22_6_straw_doll/) | R29 v2, 8K | 3,3 MB | 7.564 | 0,3 m × 0,2 m, cao 0,35 m | Quay mặt về phía camera như trong ảnh. |
| [A23.1 Abandoned reaping](props/act1_kit_v1/A23_1_abandoned_reaping/) | R30 v1, 8K | 6,8 MB | 13.941 | 2,4 m × 2 m, cao 1,1 m | Hai mảnh, giữ cả. |
| [A23.2 Ribbon thorn](props/act1_kit_v1/A23_2_ribbon_thorn/) | R24 v2, 4K | 19,7 MB | 12.828 | 6 m × 5 m, cao 5,5 m | Giữ thẳng như Tripo dựng. Tán là mấy khối mịn có ngọn cành. |
| [A23.3 Garth flower bed](props/act1_kit_v1/A23_3_garth_flower_bed/) | R30 v1, 8K | 8,1 MB | 12.071 | 3,2 m × 3,2 m, cao 0,55 m |  |
| [A23.4 Potted flowers](props/act1_kit_v1/A23_4_potted_flowers/) | R30 v1, 8K | 2,3 MB | 7.262 | 0,6 m × 0,6 m, cao 0,75 m |  |
| [A23.5 Walled flower bed](props/act1_kit_v1/A23_5_walled_flower_bed/) | R30 v1, 8K | 5,3 MB | 8.682 | 4 m × 1,4 m, cao 0,5 m |  |
| [A23.6 Linen drying line](props/act1_kit_v1/A23_6_drying_line/) | R26 v3, 4K | 1,4 MB | 914 | 6 m × 0,3 m, cao 2,2 m | Ít đa giác (914 tam giác). |
| [A24.1 Kitchen work table](props/act1_kit_v1/A24_1_kitchen_table/) | R31 v1, 8K | 3,4 MB | 3.540 | 2,4 m × 1 m, cao 0,9 m | Nhiều mảnh rời, giữ cả. |
| [A24.2 Bread rack](props/act1_kit_v1/A24_2_bread_rack/) | R31r v3, 4K | 18,3 MB | 11.010 | 1,6 m × 0,5 m, cao 1,8 m | Dựng riêng (hàng R31r) từ ảnh cắt bằng code của R31: cả 4 variant của R31 dính một tấm ván lớn lên kệ trên cùng (bản bị loại để ở rows/R31_*/_split/). |
| [A24.3 Linen folding table](props/act1_kit_v1/A24_3_linen_folding_table/) | R31 v1, 8K | 5,7 MB | 12.296 | 2,4 m × 1 m, cao 0,9 m | Nhiều mảnh rời, giữ cả. |
| [A24.4 Turned-down coverlet](props/act1_kit_v1/A24_4_turned_down_coverlet/) | R32 v1, 8K | 7,3 MB | 11.742 | 1,14 m × 1,9 m, cao 0,12 m | Giữ thẳng. Đặt trên luống A13.1. |
| [A24.5 Turned-down quilt](props/act1_kit_v1/A24_5_turned_down_quilt/) | R32 v1, 8K | 8,6 MB | 16.500 | 3 m × 2,6 m, cao 0,24 m | Giữ thẳng. Đặt trên A14.5. |
| [A24.6 Linen pillow](props/act1_kit_v1/A24_6_linen_pillow/) | R32 v1, 8K | 3,2 MB | 5.951 | 1,5 m × 0,75 m, cao 0,32 m | Giữ thẳng. Ba sọc đỏ mảnh như concept (brief: một dải). |
| [A25.1 Root rib arch](props/act1_kit_v1/A25_1_root_rib_arch/) | R23 v1, 4K | 20,8 MB | 18.973 | 6,5 m × 0,5 m, cao 4,9 m | Chân rễ toả sâu khoảng 5 m khi rộng 6,5 m (spec dày 0,5 m). |
| [A25.2 Plank crossing](props/act1_kit_v1/A25_2_plank_crossing/) | R33 v0, 8K | 6,4 MB | 1.444 | 1,5 m × 2,3 m, cao 0,1 m | Hai mảnh, giữ cả. |
| [A25.3 Root fall](props/act1_kit_v1/A25_3_root_fall/) | R26 v3, 4K | 17,8 MB | 18.177 | 4,6 m × 5,4 m, cao 2,6 m | Giữ thẳng (bộ cân bằng tự động lật nó 23°). |
| [A25.4 Harvest basket](props/act1_kit_v1/A25_4_harvest_basket/) | R33 v0, 8K | 6,5 MB | 15.208 | 0,56 m × 0,56 m, cao 0,45 m | Đã cắt mấy cánh hoa đỏ dưới sàn cạnh giỏ (3 mảnh, 360 mặt); quả rơi giữ lại. |
| [A25.5 Tending kit](props/act1_kit_v1/A25_5_tending_kit/) | R33 v0, 8K | 3,5 MB | 2.444 | 1 m × 0,45 m, cao 0,5 m | Ghế, sách và bình tưới; hoa sen vòi là mảnh rời, giữ lại. |
| [A25.6 Tamsin's lantern](props/act1_kit_v1/A25_6_tamsin_lantern/) | R33 v0, 8K | 3,5 MB | 24.145 | 0,3 m × 0,6 m, cao 1 m | Quay về phía camera như trong ảnh; đèn treo bằng móc trên cành. |

Credit: 1.815 cho 12 lần dựng (11 hàng và R31r), tính theo log từng bước.
