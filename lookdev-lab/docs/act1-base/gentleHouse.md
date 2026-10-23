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

## Vòng thay kit A01–A14 (2026-10-23)

Thay các blockout A11 bằng model Tripo của bộ kit (`lookdev-lab/assets/act1-kit/`, kích thước thật, gốc ở đáy giữa, mặt trước +z).

- **A11.1** vòm cloister ×12. Model thật ra là một gian nhỏ kín: có tường lưng, hai tường đầu và mái hai mái. Bảng fit ghi "lưng hở" là sai, ảnh QA cũng ghi "lưng là tường trơn". Nếu đặt nguyên như vậy, tường lưng sẽ chắn giữa lối đi 3 m và các tường đầu sẽ chặn lối đi giữa các gian. Vì vậy engine có thêm trường KIT `cut`: các hộp trong khung GLB, tam giác nào có trọng tâm nằm trong hộp thì bị bỏ (hàm `cutTriangles` trong `interior.js`; tam giác diện tích 0 cũng bị bỏ). A11.1 cắt tường lưng và hai tường đầu ở dưới mái (y < 2.42 m), thêm hai mẩu nhỏ. Kết quả:
  - lối đi sau dãy vòm rộng 1.95 m, chạy liền từ gian này sang gian khác;
  - ba vòm mỗi gian (1.1 / 1.0 / 0.9 m) đều cho nhân vật đi qua;
  - chỉ bốn trụ chắn, và blocker là bốn hình chữ nhật đo đúng chân trụ.

  Mái của model được giữ nên lối đi có mái che: khi nhân vật đi dưới mái, phần mái chắn camera mờ đi quanh nhân vật như tường. Vì model đã có mái, bỏ các mái hiên chỉ hiện từ bên ngoài N-HS12.
- **A11.2** giường bệnh ×14. Model giữ chiều dài 2.16 m; lúc đầu rộng 1.71 m (concept 1.08 m), nay thu bề ngang còn 1.2 m (xem mục sửa sau review); giữa hai giường còn 1.5 m, chỗ đặt chân nến và cửa sổ. Mặt nệm cao 0.67 m nên người ngủ nâng lên 0.70 m. Collider 1.0 m giữ nguyên.
- **A11.3** bàn ăn ×3, scale 0.68: mặt bàn cao 0.82 m, bàn 2.94 × 1.75 m kể cả ghế băng. Model có sẵn bánh mì và bình hoa nên bỏ 3 bình hoa A19.1 trên bàn. Collider 1.5 (thành 1.02 m sau scale).
- **A11.5** lò bếp ×1: lưng sát mặt tường bắc của bếp (z −7.72). Collider hộp 2.0 m nên nhân vật không bước vào miệng lò.
- **A11.6** chân nến ×18. Đèn, quầng sáng và ngọn lửa phát sáng đặt đúng ngọn lửa của model ở (0.04, 2.24, 0.06). Ngọn lửa phát sáng là trường KIT `globe` mới: phần phát sáng vẽ cộng sáng đè lên model, theo đúng mức sáng của đèn như globe của blockout.
- **Giữ blockout:**
  - **A11.4** tháp cổng: model không có lối xuyên qua (tường lưng bịt kín) và mặt +x không có tường dưới ≈ 4 m; cần dựng lại (QA: redo).
  - A08.1 khóm anh túc: chưa có model trong kit.

**Đi lại:** con đường chính, mọi điểm xuất phát và lối cloister vẫn đi được. Test mới kiểm GLB sau khi cắt: trong dải 0.35–1.7 m sau các trụ không còn bề mặt nào, và mọi bề mặt còn lại trong dải đó nằm trên blocker trụ (sai lệch ≤ 2 cm). Test cũng kiểm lối đi ≥ 1.8 m và 36 vòm cho nhân vật đi qua. Kiểm bằng lưới nav thật của Play trên trình duyệt:
- 36/36 vòm thông;
- 228/228 điểm lối đi trống;
- 76/76 ô lối đi đến được;
- mọi điểm của con đường chính đến được.

**Ánh sáng:** không đổi số đèn (13 đèn thật + đèn nhân vật ≤ 16), mọi đèn vẫn tĩnh (Perfection), nhóm đèn và thanh trượt không đổi.

**Ảnh** (`shots/gentleHouse/`):
- so sánh `before-after.png`, với "trước" là bản ngay trước vòng này và cùng góc camera;
- WebGL: `kit-<view>-webgl.png` cho các view `compound`, `cloister`, `ward`, `tamsin`, `refectory`, `kitchen`, `gate`, `cu-cloister-arcade`, `cu-cloister-walk`, `cu-ward-beds`, `cu-refectory-table`, `cu-kitchen-hearth`, `cu-candle-stand`;
- WebGPU: `kit-cloister`, `kit-ward`, `kit-refectory`, `kit-cu-cloister-arcade`, `kit-cu-cloister-walk`, `kit-cu-candle-stand`.

**Hiệu năng** (1600 × 900, máy test): tam giác 0.47–0.74 triệu → 0.73–1.10 triệu; draw call gần như không đổi (98–159). GPU WebGL gần như không đổi (−0.3…+0.2 ms: overview 1.09 → 1.29, cloister 2.42 → 2.50, ward 2.13 → 2.09, refectory 1.83 → 1.80, kitchen 2.45 → 2.13). GPU WebGPU tăng 0.04–0.38 ms (cloister 2.70 → 3.08). Bộ nhớ texture (RGBA8 + mipmap, ước tính) 180 → 228 MB. Lưới va chạm của Play: 171 nghìn tam giác, dựng trong 85 ms.

**Còn tồn tại:**
- Chỗ cắt để lại vài lỗ nhỏ ở mặt trong các trụ đầu gian, khuất dưới mái.
- Giữa hai gian có khe 0.45 m.
- Mái che làm lối đi khó nhìn từ góc camera cao khi nhân vật ở chỗ khác.
- Người ngủ (blockout NPC) trông như khối trắng trên tấm chăn của model giường.

### Sửa sau review kit r1 (2026-10-23)

- **Giường đôi (review mục 6):** chỉnh cỡ đều theo chiều dài 2.16 m làm giường A11.2 rộng 1.71 m (concept 1.08 m), nên mỗi giường trông như giường đôi
  chỉ có một người ngủ. Thu nhỏ đều không được: giữ tỉ lệ thì giường chỉ còn dài 1.51 m, ngắn hơn người ngủ. Vì khung giường đơn giản, model được thu
  riêng bề ngang ×0.7 lúc chuẩn bị (bảng SQUASH mới trong `scripts/prepare-act1-kit.py`; pháp tuyến tính lại theo phép co): nay rộng 1.2 m, dài vẫn
  2.16 m, cao 1.07 m, mặt nệm vẫn 0.67 m; vân gỗ và chăn bị nén ngang một chút, nhìn từ camera game không thấy rõ. Mọi GLB khác không đổi byte nào.
- **Khoảng cách và lối đi:** giữ nguyên chỗ đặt (bước 2.71 m), nên khoảng trống giữa hai giường tăng từ 1.0 m lên 1.5 m; lối giữa hai dãy giường
  không đổi. Test mới: GLB rộng 1.1–1.25 m và dài 2.16 m, người ngủ (0.7 m) nằm vừa, giữa hai giường cùng dãy còn ≥ 1.4 m, và lối giữa hai dãy đi
  được qua mọi giường (vòng quanh A19.5 và Tamsin đứng trong lối ở x ≈ 7–8, như trước).
- **Ảnh:** `shots/gentleHouse/kit-ward-webgl.png`, `kit-ward-webgpu.png`, `kit-tamsin-webgl.png`, `kit-tamsin-webgpu.png`, `kit-cu-ward-beds-webgl.png`,
  `kit-cu-ward-beds-webgpu.png` chụp lại; `before-after.png` dựng lại (hàng giường bệnh); so sánh giường trước / sau sửa: `kit-fix-beds.png`.

## Vòng thay A21–A25 (2026-10-23)

Bảy chỗ giữ chỗ của map này nay dùng model Tripo nhóm A23 / A24 (`assets/act1-kit/`, kích thước thật). Số liệu từng model:
`tmp/act1-base-maps/ACT1_KIT_FIT.md` mục A21–A25.

- **N-HS02 → A23.3** bồn hoa sân cỏ: bồn vuông 3.2 m (trước là bồn tròn), viền vôi, đất cao 0.49 m, khóm hoa cao tới 1.27 m, hai bông anh
  túc ở giữa. Chặn cả bồn; collider 1.3 m để nhân vật không bước lên viền.
- **N-HS03 → A23.4** chậu hoa ×6 (2 ở sân trước cổng, 4 ở góc sân cỏ). Sáu chậu giống hệt nhau, không đổi cỡ cho đa dạng, vì ở đây Perfection
  giữ mọi cây bằng nhau. Collider 0.9 m.
- **N-HS04 → A23.5** luống hoa có tường ×4 trong vườn của Mẹ (chỉ nhìn, không vào được). Viền cao 0.27 m, lá cao tới 1.11 m.
- **N-HS05 → A23.6** dây phơi: rộng 3.83 m (bản giữ chỗ 6 m). Đo trên mesh, chân hai cột nằm ở x −1.79 và +1.80; bảng fit ghi −1.66 / +1.77.
  Blocker đặt đúng hai chân cột (r 0.18); tấm vải không chặn vì vườn không vào được.
- **N-HS06 → A24.1** bàn bếp: mặt bàn cao 0.84 m. Model đã có sẵn bát, bánh mì trên thớt kèm dao và khăn gấp. Vì vậy:
  - bỏ bình hoa A19.1 trên bàn;
  - khay trà A19.2 chuyển lên khăn gấp (x 15.72, cao 0.90 m), vì chỗ cũ của khay nay là chỗ để bát của model.
- **N-HS07 → A24.2** giá bánh mì ×2: thay tủ vải lanh A19.4 dùng tạm. Giá rộng 1.16 m (concept 1.6 m) và lưng nằm sau tâm 0.25 m, nên đặt ở
  x 11.66 để lưng sát mặt tường tây của bếp (x 11.4). Đế chặn 1.2 × 0.55 m, collider 1.8 m.
- **N-HS08 → A24.3** bàn gấp vải: mặt bàn cao 0.82 m, chồng vải cao tới 1.09 m, một chồng buộc ruy băng đỏ. Collider 1.1 m.
- Không còn chỗ giữ chỗ nào của map này ở dạng blockout; A19.4 chỉ còn là tủ vải lanh thật (phòng vải lanh, phòng Mẹ).

**Đi lại:** con đường chính và các điểm xuất phát không đổi. Kiểm bằng lưới nav thật của Play (WebGL, collider thật):
- 32/32 điểm con đường đến được;
- chân của mọi model mới đều bị chặn (bồn hoa 1/1, chậu 6/6, luống 4/4, bàn bếp 1/1, giá bánh 2/2, bàn vải 1/1);
- hai cột dây phơi chặn, tấm vải không chặn;
- 5/5 điểm trong bếp đến được, kể cả cửa sang phòng vải lanh;
- cloister giữ nguyên (36/36 vòm, 48/48 trụ).

**Ánh sáng:** không thêm đèn (13 đèn thật + đèn nhân vật ≤ 16, một đèn đổ bóng). Mọi đèn vẫn tĩnh; nhóm đèn và thanh trượt không đổi. Chỗ
vàng ấm trên bánh mì là màu texture, không phải đèn.

**Kiểm Mercy / Perfection (vôi trắng, vải sạch):**
- Vải phơi, chồng vải, khăn trên bàn bếp đều trắng sạch.
- **Cần sửa ảnh / texture (gắn cờ):**
  - A23.3: chân viền bồn có một dải bẩn nâu sẫm, trông cũ (**đã sửa**, mục "Sửa sau review a2x" bên dưới); concept muốn viền vôi liền
    mạch, sạch quá mức. Nhiều khóm hoa xỉn xám xanh thay vì kem / vàng nhạt / tím nhạt (chưa sửa).
  - A24.3: bông anh túc thêu trên chồng vải bên trái ra màu nâu / vàng, nhìn gần như một vết bẩn trên vải trắng.
  - A23.4: hoa xỉn, thiếu cành oải hương (QA).
  - A23.5: thiếu cành hoa oải hương và hoa trắng; lá nhọn như lá thùa (QA).

**Ảnh** (`shots/gentleHouse/`):
- so sánh `before-after.png`, với "trước" là bản ngay trước vòng này và cùng góc camera;
- WebGL: `a2x-<view>-webgl.png` cho `compound`, `cloister`, `kitchen`, `cu-garth-bed`, `cu-forecourt-pots`, `cu-kitchen-table`, `cu-bread-rack`,
  `cu-linen-table`, `cu-mother-garden`, `cu-lk-drying-line`, `cu-lk-garth-bed`, `cu-lk-linen-table`;
- WebGPU: `a2x-cloister`, `a2x-kitchen`, `a2x-cu-garth-bed`, `a2x-cu-kitchen-table`, `a2x-cu-bread-rack`, `a2x-cu-linen-table`, `a2x-cu-lk-drying-line`.

**Hiệu năng** (1600 × 900, một lần đo mỗi bản):
- tam giác (WebGL, theo view) 0.73–1.10 triệu → 0.78–1.25 triệu; draw call giảm 5–11 mỗi view;
- GPU WebGL tăng 0.1–0.4 ms: overview 1.04 → 1.27, cloister 2.00 → 2.09, ward 1.60 → 1.75, refectory 1.46 → 1.78, kitchen 1.62 → 2.05;
- GPU WebGPU gần như không đổi (cloister 3.00 → 3.06, kitchen 2.58 → 2.57);
- bộ nhớ texture (RGBA8 + mip, ước tính) 228 → 280 MB (+7 model 1024 px).

**Còn tồn tại:** các cờ màu ở trên. Dây phơi ngắn hơn bản giữ chỗ 2.2 m nên vườn của Mẹ trống hơn.

### Sửa sau review a2x vòng 1 (2026-10-23)

- **Viền bồn hoa A23.3 sạch lại (F-b).** Ở `a2x-cloister-webgpu.png`, mặt nam của viền có một vệt đen ở nửa dưới. Có hai nguyên nhân:
  - **Texture:** mặt ngoài của viền chuyển từ màu vôi kem (≈ 192 / 174 / 156) ở 0.4–0.62 m xuống nâu xám bẩn (≈ 120 / 105 / 90) dưới 0.2 m,
    kèm một vệt nâu lên tới 0.42 m.
  - **Pháp tuyến (nguyên nhân chính):** mỗi mặt ngoài là một tứ giác dùng chung đỉnh góc với đáy bồn và mặt trên của viền. Vì vậy pháp tuyến ở
    chân viền chúc xuống đất (±0.19, −0.96, ±0.19), ở đỉnh thì chếch lên (±0.67, 0.33, ±0.67). Khi nội suy, nửa dưới mỗi mặt quay xuống sàn,
    gần như không nhận ánh đèn đặt cao của cloister nên bị đen; thêm một vệt chéo theo đường chia hai tam giác.
  - Thử thay texture bằng một màu phẳng, dải đen vẫn còn. Chỉ sửa texture thì không đủ: lần chụp sau khi mới sửa texture, 10 % điểm tối nhất ở
    mặt nam chỉ sáng 25 → 26 (WebGPU), 28 → 33 (WebGL).
- **Sửa trong `scripts/prepare-act1-kit.py`, chỉ cho A23.3:**
  - `LIFT` (thao tác texture riêng cho asset):
    - vùng chọn là bốn mặt ngoài của viền (mặt có cả ba góc nằm trên mặt bên của khung bao), vẽ vào atlas theo độ cao;
    - trọng số 1 dưới 0.40 m, mờ dần (smoothstep) về 0 ở 0.56 m, loang ~2 px qua mép đảo UV (mép mềm);
    - mỗi texel nhân với độ sáng sạch / độ sáng cục bộ (làm mờ 3 px trong vùng), chỉ làm sáng (hệ số ≥ 1, tối đa 2.2), và kéo 60 % về sắc vôi
      sạch. Màu sạch là trung vị của chính các mặt đó ở 0.44–0.6 m: 191 / 173 / 155;
    - giữ chi tiết texel; mặt trên viền, đất và hoa không đổi. Không dùng `TINT` (TINT làm tối). Độ sáng trung bình của dải dưới 0.40 m: 131 → 175.
  - `FLAT`: 8 tam giác của bốn mặt ngoài có đỉnh riêng (24 đỉnh mới), pháp tuyến phẳng theo mặt (cạnh cứng). Hình, UV và số tam giác không đổi.
  - Mọi GLB khác giữ nguyên từng byte. Đã chạy lại cả kit (92 file) vào một thư mục tạm rồi so từng file với `assets/act1-kit/`: 92/92 giống hệt,
    kể cả A23.3 mới (chạy lại cho ra đúng file đó).
- **Kết quả** (view `cloister`, cùng góc camera, 1600 × 900), mặt nam của viền:
  - độ sáng trung bình 100 → 123 (WebGPU), 102 → 119 (WebGL);
  - 10 % điểm tối nhất 25 → 79 (WebGPU), 28 → 75 (WebGL).
  - Không còn dải đen hay vệt đen. Mặt bên đọc là vôi ấm, tối hơn gờ trên một chút: mặt đứng nhận ít sáng hơn mặt trên (khối sáng tối bình thường).
- **QA theo `ashlar/artdirection.md` §11:** không thêm micro texture, không viền đen. Viền là vôi kem có texture, không phát sáng, không lẫn hai màu
  trắng (§4.6). Chuyển sang ảnh xám vẫn tách bồn khỏi nền đá. Hợp với bề mặt Perfection của Act I là "vôi mới" (§4.2: không bụi, không mòn).
- **Ảnh** (`shots/gentleHouse/`):
  - `a2x-fix-garth-before-after.png`: trái là trước, phải là sau; hàng trên là cloister WebGPU, hàng dưới là cận cảnh WebGL;
  - `a2x-fix-cloister-webgpu.png`, `a2x-fix-cloister-webgl.png`, `a2x-fix-cu-garth-bed-webgl.png`, `a2x-fix-cu-garth-bed-webgpu.png`;
  - chụp bằng Chrome headless riêng (CDP 9771, profile mới, đã xoá) với dev server 4871; bỏ lần tải đầu sau mỗi lần đổi backend; UI ẩn.
- **Còn lại:**
  - normal map còn một đường nứt nổi ở nửa phải mặt nam (0.14–0.42 m). Nhìn gần thấy như một đường gợn nhạt; ở khoảng cách game đọc như vân đá,
    không như vết bẩn;
  - vết anh túc nâu trên chồng vải A24.3 để nguyên (theo review);
  - hoa xỉn của A23.3 / A23.4 / A23.5 chưa sửa.
- **Kiểm tra:** `node --test "scripts/act1-*.test.mjs"` 124/124, `node scripts/check.mjs` đạt.

**Sáng hơn (2026-10-23, đã sửa sau review):** Lần nâng đầu (`envI` 0.1 → 0.25) làm phòng ngả màu be, nên đã thay bằng giá trị dưới đây. Ảnh:
`shots/gentleHouse/bright-before-after.png`. Số đo: `tmp/act1-base-maps/BRIGHTNESS.md` §5.

| mood | thay đổi so với giá trị gốc | giữ nguyên |
|---|---|---|
| `warm` | `hemi` 0.85 → 3.3, `floorTone` 0.82 → 0.86, `grade.saturation` 0.96 → 1.03 | `envI` 0.1, `exposure` 0.95 |
| `rain` | `hemi` 1.9 → 3.6, `exposure` 0.55 → 0.78, `grade.saturation` 0.86 → 0.9 | `envI` 0.32 |

Kết quả của mood `warm`:
- Phòng bệnh sáng hơn +27 %, bếp +23 %, cloister +36 %, overview +12 %.
- Màu ấm giữ được: R/B phòng bệnh 1.65 → 1.61, độ bão hòa −2 %. Bếp và phòng Mẹ Hawise lệch ≤ 2.5 %. Khung cloister nhìn xa ấm hơn một chút (R/B +11 %).
- Vải lanh giường bệnh trắng sạch, không cháy.
- Cửa sổ phòng Mẹ Hawise vốn đã cháy; vũng sáng dưới cửa sổ rộng thêm 1.0 điểm %. Đây là giới hạn khiến exposure không tăng.

Ngoài cổng mưa sáng hơn +26 % (trước đó +22 %), màu ít nhạt hơn: cổng độ bão hòa −11 % (trước đó −20 %).
