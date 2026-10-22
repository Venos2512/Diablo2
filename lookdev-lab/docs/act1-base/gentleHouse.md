# ASHLAR · Act I · base · Gentle House (map 4, `act1GentleHouse`)

LD 11.9 · BIO-05 (hospice vôi trắng) · nơi thánh · **không chiến đấu** · D4 C0 · 12 phút. Mở bằng ô **Scene** → *ASHLAR · Act I · base · Gentle House* hoặc `?scene=act1GentleHouse` (thêm `&renderer=webgpu`).

Base map = bố cục, tỉ lệ, sàn, ánh sáng và các beat là thật; mọi model còn thiếu là **blockout đúng cỡ** (màu theo nhóm, SPEC §6b). NPC là hình đứng thay (không tính là asset, liệt kê trong NPCS).

## Bố cục (lát 66 × 94 m; độ dài đề xuất cho bản đầy đủ: ~160 m)

| Đoạn | Nội dung | Cỡ |
|---|---|---|
| **S1 · Lối lên đồi dưới mưa** | Sườn đồi dốc 0.17 (y −2 → −8.4) từ Poppy Reach, đường đá lửa ziczac, khóm anh túc cuối cùng (A08.1), 3 khối đá lửa GLB (`dungeon-prop-flint-boulders`). Mép sườn là **void**: đồi chìm vào sương. Mưa + đất ướt | ~40 × 43 m |
| **S2 · Sân trước cổng** | Bậc thềm vôi trắng (A18.6: 10 bậc 0.18 m, lan can vôi) lên sân 15 × 12 m, hai bên là **tường hốc nến** (A18.5 ×4, nến đứng yên trong mưa), hai chậu hoa ở đầu bậc. **Tháp cổng** (A11.4, lối vòm 2 m): **mưa dừng ở cổng** — trong cổng khô, ấm, đứng yên | 15 × 12 m |
| **S3 · Cloister** | 12 vòm (A11.1, 4 cạnh) quanh **sân cỏ (garth)** 16 × 16 m: 4 bãi cỏ, lối đá chữ thập, bồn hoa giữa, 4 chậu hoa; hành lang 3 m; ánh ngày xám từ trên (đèn đổ bóng duy nhất); 4 chân nến góc | 22 × 22 m |
| **S4 · Phòng bệnh dài** | 2 hàng giường (A11.2 ×14), **13 người ngủ mỉm cười** trong vải lanh sạch (trắng sạch duy nhất được phép), **giường trống của Fen**, 7 cửa sổ cao mỗi bậu **một ngọn nến đứng yên** + một bình hoa (A19.6, A19.1), 6 chân nến giống hệt nhau (A11.6). **Tamsin** trốn sau bình phong lanh (A19.5) chắn lối giữa | 22 × 9 m |
| **S5 · Phòng Mẹ Hawise** | Lên 7 bậc (y +1.2) ở đầu tây dãy nhà: **cửa sổ cao ấm** nhìn ra thung lũng (qua vườn của Mẹ) — **ánh sáng sáng nhất, đứng yên nhất của act** (khớp `N-GH` ở map 1–3), ghế cửa sổ (A19.3), **trà anh túc** (A19.2) = **vision trigger**, tủ vải lanh | 8 × 9 m |
| **S6 · Nhà ăn → bếp** | Nhà ăn: 2 bàn dài + bàn cao (A11.3, bánh mì, khăn lanh, hoa), 4 chân nến; bếp: lò sưởi + nồi (A11.5, **sạch, không lửa**), bàn bếp, 2 giá bánh mì; phòng vải lanh (tủ, bàn gấp, bình phong) | 10 × 31 m |
| **S7 · Cầu thang đêm** | Từ tường đông của bếp: **15 bậc** (0.1875 m) xuống chiếu nghỉ y −3, sàn đá hầm cũ (`BIO08_nave`); đầu xa chìm vào bóng tối (void) = lối xuống **Garden of Hush** (map 5) | 12 × 3 m |
| Vườn của Mẹ | Vườn có tường dưới cửa sổ cao (luống hoa, dây phơi vải lanh đứng im) — nhìn thấy, không đi vào | 8 × 22 m |

Bố cục khớp silhouette xa `N-GH` của map 1–3: tháp cổng góc tây nam, dãy nhà bệnh dài ở phía bắc (mái đá đen), sân có tường phía trước, cửa sổ cao ấm trên mặt nam của dãy nhà.

## Ánh sáng (ngữ pháp ánh sáng)

Toàn bộ là **ánh sáng Perfection**: đứng yên tuyệt đối, đều, nhiều nguồn giống hệt nhau — **không có ánh người lập lòe, không có ánh đỏ** (test kiểm). Nến màu hổ phách `#E0A050` (biome doc: dùng màu nến Act I cho nến không nhấp); cửa sổ cao `#F6B468` (cùng màu cửa sổ của `N-GH`): kính phát sáng ×5.5 + quầng tĩnh lớn bên ngoài (đọc được qua mưa/sương) + một đèn ấm trong phòng. 13 đèn thật + đèn nhân vật = 14 (≤ 16): ánh ngày xám trên garth (spot, đổ bóng), ánh ngày trên đồi (spot), cửa sổ cao, 8 chân nến thật; các chân nến còn lại, nến bậu cửa sổ và nến hốc tường chỉ có quầng + vũng sáng.

**Mưa dừng ở cổng**: vệt mưa quanh tâm camera ở mọi chỗ **ngoài** vùng khô (khu nhà + tháp cổng), đất ngoài cổng ướt (kênh wet của splat); bên trong khô. Thanh *Mưa ngoài vùng khô (× mood)* trong tab Environment.

## Mood

*Gentle House · trong nhà ấm* (mặc định: nến ấm, ngoài trời xám tối, mưa) · *Ngoài cổng · mưa xám ban ngày* (đọc ngoại thất, sương xám) · *Soi texture · sáng đều*.

## Mái nhà (chỉ từ bên ngoài)

Engine trong nhà không có trần (camera nhìn xuyên). Mái ngoại thất (mái dãy nhà bệnh, mái dãy nhà ăn, mái hiên cloister, mái cầu thang đêm) là blockout `roof` chỉ hiện khi **tâm camera / nhân vật ở ngoài trời** (đồi, sân trước, vườn) và ẩn khi bước qua cổng. Bật/tắt: *Mái nhà khi tâm ở ngoài trời*.

## Play

*Điểm xuất phát*: S1 lối lên đồi (mặc định; lưới Play 128 m quanh S1 phủ cả map), S2 sân trước cổng, S3 cloister, S4 phòng bệnh, S5 phòng Mẹ Hawise, S6 nhà ăn, S7 chân cầu thang đêm. Không có quái (không chiến đấu). Bước chân: `surfaceAt` đọc splat.

## Overlay (tab Environment → *Overlay*, tắt mặc định trừ chú giải nhỏ)

Nhãn asset · **Tuần tra + tầm nhìn (nón) · lối đưa ra** (mới): 3 lộ trình tuần tra của các sơ (cloister vòng quanh, lối giữa phòng bệnh, nhà ăn → bếp → cloister) với nón tầm nhìn ở mỗi điểm, sơ gác cổng đứng yên, **lối đưa Tamsin ra cổng** (xanh lá) · Mốc, tầm nhìn, vignette (cửa sổ cao, tháp cổng, lối lên đồi → cửa sổ ấm, REMEMBER: chén trà trong ánh cửa sổ ấm, vision trigger, giường trống của Fen — không đánh dấu, bánh mì lúc nào cũng mới, "vôi mới không một chỗ vá", "bị các sơ thấy = được dẫn ra cổng") · Chỗ NPC (Mẹ Hawise, Tamsin, người ngủ ×13, 4 sơ) · Lối ra (↓ Garden of Hush, ↓ Poppy Reach).

## Khung camera (beat) — thấp và gần hơn các map khác, không nghiêng

Toàn cảnh · Khu nhà từ trên cao · Ngoại thất (mái hiện) · Lối lên đồi dưới mưa · Tháp cổng · Cloister · Phòng bệnh dài · Cửa sổ ấm của Mẹ Hawise · Tamsin sau bình phong · Tuần tra (bật overlay) · Nhà ăn · Bếp · Cầu thang đêm · Cửa sổ cao nhìn từ lối lên đồi.

## Asset (báo cáo đầy đủ: [ASSETS.md](./ASSETS.md))

29 id: **1 glb** (`dungeon-prop-flint-boulders` ×3) · **2 procedural** (A18.6 bậc thềm, N-HS09 cầu thang đêm: engine dựng) · **26 blockout**: A11.1 ×12, A11.2 ×14, A11.3 ×3, A11.4, A11.5, A11.6 ×18, A18.4 (dãy nhà = tường engine + mái N-HS10, không đặt riêng), A18.5 ×4, A19.1 ×12, A19.2 ×2, A19.3, A19.4 ×4, A19.5 ×2, A19.6 ×8, A08.1 ×9, N-HS02…N-HS08 (bồn hoa, chậu hoa, luống vườn, dây phơi, bàn bếp, giá bánh mì, bàn gấp vải), N-HS10…N-HS13 (mái ngoại thất). Quái: không. NPC: Mẹ Hawise, Sơ Anh Túc ×4, Tamsin, người ngủ ×13 (hình đứng thay, không model). Texture còn thiếu: vôi trắng mới liền mạch (tile `BIO05_lime` có mảng như vết rạn: tường đang dùng normal 0.3), sàn gỗ cọ sạch, vải lanh viền đỏ, mái đá + ngói, lối đồi đá phấn ướt, cỏ garth cắt đều. VFX còn thiếu: vision trà anh túc, bị thấy → dẫn ra cổng, người ngủ thở đều cùng nhịp, hơi trà / bánh, tiếng ru (đang dùng thay: mưa vệt, quầng nến tĩnh, cửa sổ phát sáng, bụi GPU, ánh ngày xám).

## Thẻ mood (`ashlar/artdirection.md` §2.1)

| Trường | Nội dung |
|---|---|
| Map | The Gentle House (Act I, LD 11.9, BIO-05), `?scene=act1GentleHouse` |
| Mood mục tiêu | Nơi tốt đẹp nhất bạn từng đến và muốn ở lại: ấm, sạch, mỉm cười — lời nói dối ấm áp nhất. |
| Palette | Vôi trắng mới, vải lanh Mercy (trắng sạch duy nhất được phép), gỗ cọ nhạt, nến hổ phách đứng yên `#E0A050`, cửa sổ ấm `#F6B468`; đỏ anh túc `#B3262A` chỉ ở viền thêu nhỏ. Ngoài cổng: xám xanh ướt Act I. |
| Lighting và thời tiết | Ngoài: mưa phùn, ánh ngày xám, không bóng rõ. Trong cổng: khô, nến không lập lòe, nhiều ngọn giống hệt nhau; cửa sổ cao ấm là ánh sáng sáng nhất act. Không ánh đỏ. |
| Tương phản và value | Vôi và vải sáng, ấm; bóng mềm; garth xám dịu giữa các vòm; cửa sổ cao cháy sáng. |
| Nhịp cảm xúc | Mưa trên dốc → bậc thềm sạch, nến trong hốc tường → qua cổng mưa tắt → cloister yên → phòng bệnh hàng người ngủ mỉm cười → trà bên cửa sổ ấm → Tamsin sau bình phong → bếp sạch không lửa → cầu thang xuống bóng tối. |
| Style | §1 (stylized vừa phải); base map: blockout + procedural, chưa có model cuối. |
| Trạng thái | Đề xuất / đang lookdev (2026-10-21, chưa duyệt) |
| Chưa khoá | Hex vôi trắng/lanh (canon thiếu), hex nến không nhấp; camera Play thấp/gần (đang theo tab Character); cửa sổ cao ở tầng trên của dãy nhà (lát này: phòng nâng 1.2 m). |

## Kiểm chứng (2026-10-21)

- `node --test "scripts/act1-*.test.mjs"` — 61/61 (riêng map 4: 13 test chung + 5 test riêng: kit A11/A18/A19 đúng cỡ concept, không chiến đấu + NPC không tính là asset, ngữ pháp ánh sáng (chỉ Perfection, không đèn đỏ, cửa sổ cao sáng nhất, ≤ 16 đèn kể cả đèn nhân vật), mưa dừng ở cổng (đóng cổng = cloister bị cắt rời), các beat đúng chỗ).
- WebGL2: mở không lỗi console (chỉ `favicon.ico` 404 của dev server); dựng scene 1.7–2.5 s (trang 4.1–4.5 s); 173–202 draw call, 0.15–0.19 M tam giác (1600 × 900).
- WebGPU: mở được (smoke), dựng 1.7 s (trang 12.9 s kể cả khởi động WebGPU); chỉ cảnh báo có sẵn của trình duyệt (`powerPreference`, `WebGPUTimestampQueryPool`).
- Play (WebGL2): từ S1 đi tuyến chính 28/28 điểm — lên bậc thềm, qua cổng, hành lang tây, hành lang bắc, phòng bệnh, lên phòng Mẹ Hawise và xuống lại, qua bình phong, nhà ăn, bếp, xuống 15 bậc tới chiếu nghỉ: độ cao hero lệch sàn plan tối đa 0.18 m (trên bậc), không rơi, không tường vô hình.
- Mặt bằng 2D: [gentleHouse-plan.png](./gentleHouse-plan.png) (`node scripts/act1-interior-preview.mjs gentleHouse`). Ảnh: [shots/gentleHouse/](./shots/gentleHouse/) (01–16 WebGL2, 17–18 WebGPU).

## Giới hạn / chưa làm

Mọi model là blockout (chưa có GLB nào của A11/A18/A19); NPC là hình đứng thay, không AI tuần tra (lộ trình + nón chỉ là overlay), không cơ chế "bị thấy"; camera Play dùng thiết lập của tab Character (khung beat mới thấp/gần); không có tầng trên (cửa sổ cao đặt ở phòng nâng 1.2 m); tile vôi `BIO05_lime` vẫn có mảng như vết rạn (cần tile vôi mới liền mạch); mưa là vệt đường thẳng placeholder; không âm thanh (tiếng ru). Chưa rebuild bản HTML offline.

## Vòng thay model (2026-10-22)

Thay blockout bằng model Tripo đã chuẩn bị (`lookdev-lab/assets/act1-extras/`, kích thước thật, gốc ở đáy giữa):

- **A18.5** tường hốc nến ×4 (sân trước cổng): nến đứng yên đặt đúng vào hốc của model (y 1.5 m).
- **A19.1** bình hoa ×12: 7 bình trên bậu cửa sổ phòng bệnh (bậu model cao 0.88 m), 1 trên nóc tủ lanh (1.90 m), 4 trên bàn.
- **A19.2** khay trà ×2: khay ở phòng Mẹ Hawise đặt lên bàn nhỏ cạnh ghế (mặt bàn 0.56 m).
- **A19.3** ghế cửa sổ ×1: giữ chỗ cũ cạnh cửa sổ; thêm collider 1.0 m (ghế ngồi thấp hơn bước chân 0.6 m của Play).
- **A19.4** tủ vải lanh ×4: lưng tủ sát tường; cửa tủ mở thò ra 0.35 m; collider hộp 1.9 m.
- **A19.5** bình phong ×2: model sâu 0.96 m nên bình phong ở giường Fen lùi 0.3 m cho khỏi chạm chân giường; collider hộp 1.8 m.
- **A19.6** cửa sổ cao ×8: model là một mảng tường có cửa sổ "mù" (lưng đặc). Cửa sổ phòng bệnh ×7 đặt lọt vào tường, mặt nhô 5 cm khỏi mặt tường trong (đầu giường vẫn cách 8 cm). Cửa sổ cao của phòng Mẹ cũng đặt lọt vào bức tường chung (mặt nhô 9 cm vào phòng, lưng cách mặt tường phía vườn 2 cm); tấm kính phát sáng của cửa sổ này chuyển ra mặt ngoài tường (tuỳ chọn mới `pane: 'outer'` của opening), nên từ ngoài đồi vẫn thấy cửa sổ ấm. Lỗ cửa sổ của engine giữ nguyên (chỉ hạ chiều cao 2.8 → 2.4 m để model 3.29 m che kín). Nến trên bậu model là ánh sáng đứng yên của cửa sổ.
- **N-HS07** giá bánh mì ×2: dùng tạm model tủ lanh A19.4 (báo cáo là `kit` = kit tạm, vẫn thiếu model giá bánh mì); lưng tủ sát mặt tường bếp (x 11.875), collider hộp 1.9 m.
- **A18.5** tường hốc nến có collider hộp 2.0 m: tam giác model của A18.5, A19.4, A19.5 không còn vào lưới va chạm của Play.
- Giữ nguyên: A18.4 (dãy nhà do engine dựng), A18.6 (bậc thềm do engine dựng), mọi blockout khác.

**Mờ cùng tường:** model cửa sổ, tấm kính phát sáng và quầng sáng của nến trên bậu mờ dần cùng bức tường khi tường che nhân vật (quy tắc `floorY(focus) + 0.3`), không có phần nào lơ lửng. Ảnh: `shots/gentleHouse/swap-fade-parlour-window-webgl.png`, `swap-fade-ward-north-webgl.png`.

**Ảnh:** so sánh trước/sau `shots/gentleHouse/before-after.png`; cận cảnh `swap-cu-ward-windows`, `swap-cu-hawise-chair-tea`, `swap-cu-linen-room-press-screen`, `swap-cu-kitchen-press-standin`, `swap-cu-forecourt-niche` (WebGL); WebGPU: `swap-ward`, `swap-hawise`, `swap-cu-ward-windows`.

**Hiệu năng** (1600 × 900, máy test): tam giác 133–185 nghìn → 580–750 nghìn; draw call giảm nhẹ (ward 136 → 125); GPU gần như không đổi (+0.1–0.4 ms); bộ nhớ texture 73 → 212 MB (A19.4, A19.5 dùng texture 1024 px; trước đó 276 MB).

**Còn tồn tại:** model cửa sổ màu đá xám hơn tường vôi của engine; texture model có vết nứt (nhà "không một chỗ vá" cần vôi mới liền mạch); vài vệt chéo mờ trên mặt tường hốc nến (có thể là shadow acne); bộ nhớ texture vẫn lớn với các model 2048 còn lại (có thể nén KTX2 sau).
