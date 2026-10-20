# Workflow dựng model 3D bằng Tripo AI

Áp dụng khi dựng model 3D (nhân vật, quái, vật thể) từ concept bằng Tripo Studio trên trình duyệt. Phân công model và vòng lặp
Sonnet 5.5 → Opus 5.5 vẫn theo [Agent.md gốc](../../Agent.md).

## Quy trình

```text
concept → (A) T-pose bốn góc bằng Astra, người dùng duyệt contact sheet
        → (B) tripo_multiview.sh --generate : upload bốn ô, Generate 100, lấy 4 variant       ~3 phút
        → chọn variant từ MỘT ảnh ghép
        → (C) tripo_asset_finish.sh : Smart UV → Texture 4K → PBR → Export GLB                ~3 phút
        → (D) kiểm GLB bằng số + tripo_views.sh : MỘT ảnh bốn góc cho người dùng duyệt
```

Hai điểm dừng: duyệt T-pose (trước khi tiêu credit) và duyệt kết quả cuối. Giữa (B) và (D) chạy liền, không chụp màn hình từng
bước, không hỏi lại giữa chừng trừ khi có lỗi hoặc mesh hỏng. Không tự thêm bước tốn credit (retopology, segmentation, rigging,
animate, texture 8K) khi người dùng chưa yêu cầu. Một lượt: 145 credit (100 + 20 + 20 + 5).

Chạy tay lần đầu ngày 2026-10-17 (Sorcerer), chạy bằng script ngày 2026-10-20 (D01 Hodling): xem mục "Đã chạy".

## Phân công

| Phần việc | Ai làm |
| --- | --- |
| Đọc concept, viết brief, kiểm ảnh, điều khiển Tripo, kiểm GLB, báo cáo | Agent chính |
| Tạo ảnh T-pose bốn góc (skill `generate-tpose-for-tripo`) | Astra (`codex` / `gpt-6-astra`), phiên `codex exec` mới |
| Viết hoặc sửa script (multi-view, kết thúc, xem bốn góc, xử lý GLB) | Sonnet 5.5 làm, Opus 5.5 review |
| Tra lịch sử, tài liệu Tripo | Haiku 5.5 |

## Thư mục asset

Mỗi asset một thư mục `art-output/tripo-models/<nhóm>/<asset_id>/`, ví dụ `characters/sorceress/`, `monsters/D01_hodling/`:

| File | Nội dung |
| --- | --- |
| `concept.png` | concept gốc (đầu vào của skill T-pose) |
| `brief.md`, `design.txt` | ghi chú đọc concept; `design.txt` là bản canon viết trước khi chạy skill |
| `tpose_front_back.png`, `tpose_sides.png` | ảnh T-pose từ Astra |
| `views/front.png`, `back.png`, `left.png`, `right.png`, `_contact.png` | ảnh từng góc để upload (skill ghi) |
| `<asset_id>.glb` | GLB xuất từ Tripo |
| `_shots/` | `variants.png`, `variants.txt`, `final_views.png`; không lưu ảnh chụp từng bước |
| `tripo.log` | credit trước và sau mỗi bước, URL model, variant đã chọn, lỗi (các script tự ghi) |

## A. Đọc concept, T-pose, tách bốn góc

1. Xem concept bằng Read; ghi `brief.md` (tỉ lệ, silhouette, vật liệu, chi tiết bất đối xứng, phần Tripo khó dựng: vải mỏng bay
   rời, dây lủng lẳng, tóc rời, vật lơ lửng, phát sáng, trong suốt; xử lý bằng khối dày ôm sát thân hoặc bỏ). Vũ khí, đạo cụ cầm
   tay không để trong T-pose, dựng riêng.
2. Viết `design.txt` (DESIGN / ASYMMETRY / REMOVE) trước khi chạy skill: mô tả đúng dáng người, chất liệu, bề mặt; nói rõ mũ,
   sừng, tai là MỘT hình cụ thể (hình dạng không đồng nhất giữa các ảnh tạo ra gai thừa trong mesh, xem "Bài học").
3. Chạy skill bằng một phiên Codex mới (T3 `delegate_task` không có `image_gen`; gen lỗi thì mở phiên mới), nền, khoảng 8–12 phút:

   ```bash
   bash /e/Diablo2/.agents/skills/generate-tpose-for-tripo/scripts/run_session.sh 'E:\Diablo2\art-output\tripo-models\<nhóm>\<asset_id>'
   ```

   Log ở `<asset>/_tasks/skill_session.log`, báo cáo của Astra ở `_tasks/skill_session.result.txt`. Nhiều asset thì mở nhiều phiên
   song song (mỗi asset một thư mục). Trong lúc chờ: mở Chrome Tripo, kiểm đăng nhập và số credit (mục B), không đứng chờ.
4. Đọc `views/_contact.png` bằng Read (không tin báo cáo của Astra) và gửi cho người dùng bằng đường dẫn tuyệt đối trong Markdown:
   T-pose đúng (tay thẳng, ngang vai, thân thẳng), bốn góc đủ và không bị cắt, cùng tỉ lệ, đúng thiết kế, bất đối xứng đúng bên, không
   còn đồ cầm tay. Chờ người dùng duyệt rồi mới sang B. Ảnh bị loại giữ ở `_rejected/`.

## B. Tripo: multi-view và Generate

Không dùng MCP `tripo`: `tripo-ai-mcp-server` 1.1.0 gọi API V2, API này ngừng nhận request từ 2026-11-01 00:00 UTC+8.

**Chrome.** Profile đã đăng nhập `%LOCALAPPDATA%\tripo-cdp-profile`, CDP port 9333.

- Kiểm trước: `curl -s http://127.0.0.1:9333/json/list`. Thread khác có thể đang dùng.
- Chưa chạy thì mở bằng Bash `run_in_background` với `timeout: 7200000` (mặc định 30 phút sẽ tắt Chrome giữa chừng), cửa sổ ra ngoài
  màn hình để không che người dùng:

  ```bash
  "/c/Program Files/Google/Chrome/Application/chrome.exe" --remote-debugging-port=9333 --window-position=2500,0 \
    --user-data-dir='C:\Users\HLC_2021\AppData\Local\tripo-cdp-profile' https://studio.tripo3d.ai/workspace/generate
  ```

- Trang hiện nút Log in thì nhờ người dùng tự đăng nhập, không hỏi mật khẩu qua chat.
- Mở tab riêng: `curl -s -X PUT "http://127.0.0.1:9333/json/new?https://studio.tripo3d.ai/workspace/generate"`, lấy `id`, đặt
  `CDP_TARGET=<id>` trước MỌI lệnh (shell không giữ biến giữa các lệnh). Thiếu `CDP_TARGET`, `cdp.mjs` rơi về trang đầu tiên và
  có thể điều khiển nhầm tab thread khác. Không ghi đè `nature/_tools/target.txt`. Các script dưới đây đều bắt buộc `CDP_TARGET`.

**Script** ở `art-output/tripo-models/nature/_tools/` (đường dẫn Bash `/e/Diablo2/...`):

| Script | Việc | Thời gian |
| --- | --- | --- |
| `tripo_multiview.sh <asset_dir>` | Smart Mesh → icon multi-view → upload front/left/right/back, từng ô một, chờ ảnh blob hiện trong ô | ~75 s |
| `tripo_multiview.sh <asset_dir> --generate` | thêm: Number of Generation 4, "Generate 100", chờ mesh, ghi 4 variant (uuid + faces) vào `_shots/variants.txt` và ảnh ghép `_shots/variants.png` | + ~1 phút |
| `tripo_asset_finish.sh <asset_dir> <asset_id> [uv\|texture\|pbr\|export]` | Smart UV Save → Texture 4K → PBR → Export GLB → `<asset_dir>/<asset_id>.glb`; tham số 3 = bước bắt đầu (chạy lại sau lỗi) | ~3 phút |
| `tripo_views.sh <model_uuid> <out.png>` | một ảnh ghép 2×2: trước, 3/4, ngang, sau | ~20 s |
| `step.sh '<js>'`, `cdp.mjs shot/eval/upload/click/key/type/goto/drag` | công cụ gốc; `drag x1,y1 x2,y2` xoay viewer | |

Ghi chú: phần upload của `tripo_multiview.sh` đã chạy thật. Phần Generate (bấm nút, chờ mesh) đã chạy bằng lệnh tương đương ngày
2026-10-20 (FL Flagellant, mesh xong sau ~30 s). Phần lấy 4 variant lọc thumbnail theo `x > 1300` nên ở viewport 1384 px không khớp
thumbnail nào (thumbnail nằm ở x 1137/1255): tới khi script được sửa, lấy variant bằng tay theo mục "Ghi chú UI".

Chụp số credit trước khi bắt đầu; script tự ghi credit vào `tripo.log`. Poly count để mặc định 5000 (faces quad; GLB sau khi chia
tam giác nhiều hơn khoảng 1.5–2 lần: D01 6108 faces → 10.668 tam giác). Chỉ đổi khi người dùng yêu cầu, bằng `tripo_faces.sh`;
ô này là mặc định chung của tài khoản, xong phải trả về 5000.

**Chọn variant.** Mỗi Generate ra 4 variant. Xem MỘT ảnh `_shots/variants.png` (bốn variant cạnh nhau, chỉ số 0–3 trái sang phải),
chọn bản silhouette khớp concept, tay chân tách rời, không thủng, bất đối xứng đúng bên; faces gần bằng nhau thì chọn theo hình.
Mở bản đã chọn bằng URL `https://studio.tripo3d.ai/workspace/generate/<uuid>` (uuid trong `variants.txt`), ghi vào `tripo.log`.
Không bản nào dùng được thì dừng, sửa ảnh (A) rồi Generate lại; không trả tiền UV/texture cho mesh hỏng. Lượt lỗi vẫn mất 100 credit.

## C. Smart UV, Texture, PBR, Export

`CDP_TARGET=<tab> bash tripo_asset_finish.sh <asset_dir> <asset_id>` trên tab đang mở variant đã chọn. Làm lần lượt, mỗi bước ghi
credit và tự bỏ qua nếu đã làm:

- **Smart UV** (`/workspace/smart-uv/<uuid>`): "Unwrap UV" 20 credit, chờ nút "Save" (tối đa 15 phút), bấm Save; model đã unwrap từ trước chỉ cần Save.
- **Texture** (`/workspace/texture/<uuid>`): 4K mặc định, không bật "Remove Lighting", không dùng "8K Trial"; "Generate Texture 20"
  (D01: ~40 s). Xong khi hết chữ Generating/Texturing/Queue/In progress và nút hiện lại. Không `goto` trong lúc texture chạy: mất texture
  đã trả tiền; tab hỏng thì mở lại URL model trong log.
  Model mở bằng URL (sau `goto`) thì ô ảnh tham chiếu của khung texture TRỐNG. Khi đó "Generate Texture 20" không chạy, không trừ
  credit, không báo lỗi; script vẫn ghi "texture 4K done" với credit không đổi, và Export ra GLB không texture (~0,3 MB). Sau bước texture,
  credit phải giảm 20. Nếu không giảm: chọn icon thứ hai (cube) của khung texture, upload lại front/left/right/back từng ô một (giống
  multi-view Generate), rồi bấm lại (FL 2026-10-20: 52 s).
- **PBR** (`/workspace/texture-pbr/<uuid>`): "Generate PBR 5" = 5 credit, ~25 s. Nút giữ nguyên nhãn khi chạy; xong khi hết chữ
  "PBR Generation..." và nút Cancel. Không có nút Save.
- **Export**: xoá `~/Downloads/<asset_id>.glb` cũ, "Export" → Format GLB → Texture Resolution "4k" → tên file `<asset_id>` →
  "Export" của hộp thoại; script chờ file về Downloads và chuyển vào thư mục asset (D01: 14 MB).

Script có thể chạy lại từ bước lỗi: `... tripo_asset_finish.sh <dir> <id> pbr`.

## D. Kiểm tra và bàn giao

- Kiểm GLB bằng JSON chunk (không mở viewer): 1 mesh, số tam giác (~10k), material có baseColor + metallicRoughness + normal, ba ảnh
  4096². Mốc: Sorcerer 32 MB, 10.057 tam giác; D01 14,4 MB, 10.668 tam giác, JPEG/PNG/JPEG 4096²; FL 20,7 MB, 10.488 tam giác.
  GLB dưới 1 MB là chưa có texture.
- Một lệnh `tripo_views.sh` cho `_shots/final_views.png`. Đây là ảnh duy nhất người dùng nhận ở bước cuối, kèm đường dẫn GLB,
  credit từng bước + số dư, variant đã chọn, lỗi còn tồn tại. Không chụp thêm ảnh từng bước.
- Chỉ đưa vào lab khi được yêu cầu: texture lab dùng 2048 (4096 của Tripo chỉ mang chi tiết cỡ 2048), đăng ký trong
  `lookdev-lab/src/assets/samples.json`. Rig và animation là việc riêng, hỏi trước.

## Credit

| Bước | Credit | Nguồn |
| --- | --- | --- |
| Generate (Smart Mesh, 4 variant) | 100 | nút "Generate 100" |
| Smart UV | 20 | D01: 8695 → 8675 |
| Generate Texture 4K | 20 | D01: 8675 → 8655 |
| PBR | 5 | D01: 8655 → 8650 |
| Xem, chuyển variant, Export | 0 | |

Một lượt: 145 credit. Lượt lỗi vẫn bị trừ tiền. Chỉ tiêu trong phạm vi người dùng giao (số asset hoặc ngân sách); vượt thì hỏi.

## Giảm thời gian chờ (đã áp dụng)

- Không `sleep` cố định: mọi bước chờ tín hiệu trên trang (`waitUntil`) rồi đi tiếp ngay.
- Không chụp màn hình từng bước; chỉ ba ảnh: `variants.png` (để chọn, agent tự xem), `final_views.png` (cho người dùng), `_contact.png` (duyệt T-pose).
- Một lệnh thay mười lệnh: upload bốn ô + Generate trong một script; UV + Texture + PBR + Export trong một script, chạy nền được.
- Trong lúc Astra tạo T-pose (8–12 phút): mở Chrome, kiểm đăng nhập, ghi credit; nhiều asset thì chạy nhiều phiên Astra song song.
- Xem variant không tốn credit và không cần bốn lần chụp: một ảnh ghép.

## Bài học đã trả giá

- Một ảnh nhiều hàng vật thể: Tripo chỉ giữ 1–2 hàng trên. Mỗi ô upload chỉ một hình.
- Ảnh vẽ từ camera game cho ra vật đứng trên tấm bùn nghiêng. Ảnh đưa vào Tripo phải nhìn ngang, nền phẳng.
- Chrome Tripo dùng chung port 9333 với thread khác: luôn ghim `CDP_TARGET`. `goto` giữa chừng làm mất bước đã trả tiền.
- Ô poly count là mặc định chung của tài khoản: đổi thì phải trả về 5000.
- Texture Tripo trông mềm trong game: lab dùng 2048 và anisotropy, không cắt xuống 1024.
- Codex gen ảnh lỗi: mở phiên mới. T3 `delegate_task` sang codex không có `image_gen`.
- Chọn nhầm icon thứ ba của khung upload ("Batch Images to 3D") = mỗi ảnh một model, 100 credit mỗi ảnh. Multi-view là icon thứ hai (cube).
- Bốn ô multi-view upload song song thì ghi đè nhau, và mỗi ô mất ~10–18 s mới hiện ảnh: upload từng ô một, chờ ảnh blob trong ô.
  Ô đã nhận file mất `<input type=file>` ngay khi bắt đầu tải, nên "input biến mất" chưa phải là tải xong.
- Mũ, sừng, tai không đồng nhất giữa ảnh trước/sau và ảnh hai bên (đầu bên hông chúi ra trước, mũ nhọn khác nhau) làm mesh có gai
  thừa ở mũ và tai. Texture che phần lớn nhưng không hết: ghi mũ/sừng/tai thành một hình cụ thể trong `design.txt`, và so đầu ở
  hai ảnh nguồn khi duyệt T-pose.
- Chuỗi regex trong script: trong `bash step.sh "..."` (nháy kép) phải viết `\\\b` mới ra `\\b` trong JS; `\b` đơn là ký tự backspace.
  Lệnh inline gõ thẳng trong tool call cũng mất `\b` (2026-10-20): so nhãn ô bằng `split(' ')[0] === 'Front'`, không dùng regex `\b`.
- Ảnh T-pose dùng "soft even neutral light" làm vải phẳng, mất khối sáng tối (FL 2026-10-20, người dùng chê). Template skill giờ xin
  khối sáng tối vẽ tay của concept, đèn từ trên, giống nhau ở cả bốn góc.
- Nút history ở viewer (1076,388) mở bảng lịch sử phiên bản, không phải nút reset góc nhìn.

## Đã chạy

| Ngày | Asset | Ghi chú |
| --- | --- | --- |
| 2026-10-17 | Sorcerer, bản xanh đen | Chạy tay. Ảnh T-pose trong `C:\Users\HLC_2021\.codex\generated_images\01a14779-3942-7c83-b26d-80cd7b5b6dd5\`. GLB: `C:\Users\HLC_2021\Downloads\fantasy mage 3d model.glb` |
| 2026-10-18 | Camp props asset_13–24 | Mỗi lượt một ảnh sheet, không multi-view; `camp/` |
| 2026-10-19 | Nature props 08–12 | Mỗi lượt một ảnh sheet, tốn 1.120 credit; `nature/` |
| 2026-10-20 | D01 Hodling B (`monsters/D01_hodling/`) | Skill T-pose lần chạy thứ hai + multi-view; variant 2 (6108 faces); 145 credit (8795 → 8650); GLB 14,4 MB, 10.668 tam giác, 3 map 4096²; còn tồn tại: góc mũ nhọn, tai hơi to, tay mảnh; `_shots/final_views.png` |
| 2026-10-20 | FL Flagellant A (`heroes/FL_flagellant_vA/`) | Hero concept v3. T-pose lượt 1 đèn đều, người dùng chê "mất khối sáng tối vải" (cất ở `_v1_flatlight/`), đã sửa template skill; lượt 2 giữ khối. Variant 0 (5974 faces); 145 credit (8645 → 8500); texture phải upload lại bốn góc ở trang Texture; GLB 20,7 MB, 10.488 tam giác, 3 map 4096²; còn tồn tại: ngón tay dính thành khối, góc RIGHT có 9/10 nút; `_shots/final_views.png` |

## Ghi chú UI

Cập nhật sau mỗi lần chạy: nhãn nút, selector, quy ước ô Left/Right.

- Nhãn đã chạy được: "Smart Mesh", "Generate 100", "Smart UV", "Unwrap UV", "Save", "Texture", "Generate Texture 20",
  "PBR", "Generate PBR 5", "Export". Viewport 1384×749 (ảnh chụp 1384×805). Hộp thoại Export có combobox Format (option "GLB") và
  Texture Resolution ("4k Current"). Số credit đọc từ `bodyText()` theo mẫu `Resources 99+ <số>`.
- Multi-view: Smart Mesh → icon thứ hai của khung upload (khoảng x=167, y=188) → bốn ô Front / Left / Right / Back; `input[type=file]`
  theo thứ tự đó, nhãn ở `parentElement.innerText`; ô nhận file thì input mất. Ảnh trong ô là `<img src="blob:...">` ở vùng
  x 90–300, y 200–420; nút "Generate 100" bị khoá tới khi đủ bốn ô. "Number of Generation" (1/2/4) được tài khoản nhớ, đang là 4.
- Quy ước Left/Right trên D01 (không thấy lật khi xoay model): ảnh `left.png` (mặt quay sang trái màn hình) gắn vào ô Left; dây đeo, mũ và vết nứt
  lưng nằm đúng bên ở cả bốn góc nhìn.
- Viewer: kéo chuột trái xoay ~0.43°/px (105 px ≈ 45°, 210 px ≈ 90°); mở model bằng URL trực tiếp luôn ra góc nhìn trước.
- Thumbnail trong panel Assets: hai cột ở x 1137 và 1255 (viewport 1384); ô đầu (x 1137, y 157) là "Upload 3D Model", không có `<img>`.
  Lọc `img` có x > 1100, y > 120, rộng và cao > 60; thứ tự DOM là thứ tự nhìn. Panel sắp theo lần cập nhật cuối (model vừa texture
  nhảy lên đầu), nên ngay sau Generate bốn thumbnail đầu là bốn variant mới. URL model là `/workspace/generate/<slug>-<uuid>`: lấy 36 ký
  tự cuối làm uuid.
- Trang Texture: icon thứ nhất của khung = một ảnh, thứ hai (cube) = multi-view bốn ô Front/Left/Right/Back (input giống trang
  Generate), thứ ba = text. Hộp thoại Export có thể còn mở sau script: `key Escape` rồi bấm ra ngoài.
- Chrome 9333 có thể tắt giữa chừng khi tác vụ nền của thread đã mở nó hết hạn (FL 2026-10-20). Mở lại theo mục B; tab mới có id mới,
  profile vẫn còn đăng nhập.
