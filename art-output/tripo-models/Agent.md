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

Mỗi asset một thư mục. Model của game ASHLAR đặt ở `ashlar/3d/<nhóm>/<asset_id>/` (nhóm `heroes`, `monsters`, `props/<lô>`),
ví dụ `ashlar/3d/monsters/D01_hodling/`; quy ước và danh mục ở [`ashlar/3d/README.md`](../../ashlar/3d/README.md). Model không
thuộc ASHLAR (đồ trại, nature Blood Moor, early kits) ở `art-output/tripo-models/<nhóm>/`. FL, D01, `dungeon_v1` và `clutter_v1`
được chuyển sang `ashlar/3d/` ngày 2026-10-21; log viết trước ngày đó còn ghi đường dẫn cũ. Một thư mục asset gồm:

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
2. Viết `design.txt` (HUMANOID yes/no, DESIGN / ASYMMETRY / REMOVE; thêm PROPORTIONS nếu dạng người) trước khi chạy skill: mô tả đúng dáng người, chất liệu, bề mặt; nói rõ mũ,
   sừng, tai là MỘT hình cụ thể (hình dạng không đồng nhất giữa các ảnh tạo ra gai thừa trong mesh, xem "Bài học").
3. Chạy skill bằng một phiên Codex mới (T3 `delegate_task` không có `image_gen`; gen lỗi thì mở phiên mới), nền, khoảng 8–12 phút:

   ```bash
   bash /e/Diablo2/.agents/skills/generate-tpose-for-tripo/scripts/run_session.sh 'E:\Diablo2\ashlar\3d\<nhóm>\<asset_id>'
   ```

   Log ở `<asset>/_tasks/skill_session.log`, báo cáo của Astra ở `_tasks/skill_session.result.txt`. Nhiều asset thì mở nhiều phiên
   song song (mỗi asset một thư mục). Trong lúc chờ: mở Chrome Tripo, kiểm đăng nhập và số credit (mục B), không đứng chờ.
4. Đọc `views/_contact.png` bằng Read (không tin báo cáo của Astra) và gửi cho người dùng bằng đường dẫn tuyệt đối trong Markdown:
   T-pose đúng (tay thẳng, ngang vai, thân thẳng), bốn góc đủ và không bị cắt, cùng tỉ lệ, đúng thiết kế, bất đối xứng đúng bên, không
   còn đồ cầm tay. Concept dạng người: xem thêm `views/_guides.png` (đường vai/tay đỏ, hông, gối, sàn chung cho bốn góc) và kiểm vai
   ngang bằng, tay không xệ, chân thẳng song song, góc bên không bước chân. Chờ người dùng duyệt rồi mới sang B. Ảnh bị loại giữ ở `_rejected/`.

### A+. Quái không phải người (không T-pose được)

Skill `generate-tpose-for-tripo` có nhánh CREATURE (mục cuối `SKILL.md`), mới viết họ bốn chân Q (bản nháp 2026-10-21, mẫu B01 Sexton's Dog
ở `ashlar/3d/monsters/B01_sextons_dog/`). Họ A (nhiều chân), W (cánh), L (thân dài), F/O/N (khối, vật thể) chưa có template: dừng và báo,
không dùng template T-pose cho chúng.
Cập nhật 2026-10-22: họ A đã có pose block (bản nháp, mẫu thử W07 Shroud-Spinner ở `ashlar/3d/monsters/W07_shroud_spinner/`); W và O có bản nháp chưa chạy (chạy thử một con trước); L, F, N vẫn chưa có.
Kết quả Tripo 2026-10-22 (lô quái đã chốt, xem "Đã chạy"): Q (B01), A (W07, đủ 8 chân), W (W02, cánh dang một mặt phẳng đứng dựng đặc) và
`Qh` (người/ghoul bò bốn chi: U04, P04; khoang hàm há của U04 được giữ) đều cho mesh sạch ở cả 4 variant. Vật tĩnh (P06 gò hoa, xe nồi B03)
đi nhánh prop: một ảnh Astra 3/4 từ trên + Smart Mesh một ảnh. Dáng nghỉ theo họ vẫn là giả thuyết về độ tốt so với tư thế concept
(chưa thử A/B), nhưng không còn là điều chặn.
Không có ảnh Astra (2026-10-22, Codex hết hạn mức) vẫn dựng được: multi-view nhận chỉ hai slot Front + Back (B05 8 tay, P03 bướm đêm;
chiều sâu do Tripo đoán, vẫn 100 credit); khi concept đã vẽ bốn góc dáng đứng nghỉ sạch trên cùng một đường nền thì cắt thẳng bốn góc
từ concept (W04; cùng hàng pixel cho mọi góc để giữ một tỉ lệ). Vũ khí/đồ cầm tay: cắt món đó từ cột WEAPON/PROP của concept, Smart
Mesh một ảnh (9 món trong `ashlar/3d/weapons/`). Thứ chỉ vẽ dính trên thân (đèn B05, xích B03) vẫn cần ảnh Astra riêng.

Bằng chứng, nói đúng mức (tra cứu 2026-10-21, tài liệu developers.tripo3d.ai):
- **Chính thức:** multi-view cần ảnh Front, tối thiểu 2 ảnh, thứ tự front → left → back → right, quy tắc nội dung duy nhất là "cùng một vật,
  ánh sáng nhất quán"; ảnh đơn cần chủ thể rõ, ít bị che, nền sạch. **Không có hướng dẫn tư thế nào cho quái không phải người.** Dáng nghỉ
  trung tính theo họ là giả thuyết suy ra từ thực hành rigging và tài liệu hãng khác (Meshy: dáng đứng trung tính, dây mảnh không dựng
  lại được, phần bị che có thể thành mảnh lơ lửng); chưa kiểm chứng trên Tripo.
- **Rig:** model rig mặc định `v1.0-20240301` chỉ rig người. Quái không phải người cần model `v2.5-20260210` và `rig_type` (quadruped, hexapod,
  octopod, avian, serpentine, aquatic; `others` chỉ có ở `v3.0-20260909`). Preset animation: quadruped:walk, hexapod:walk, octopod:walk,
  serpentine:march, aquatic:march; chưa thấy preset avian. Rig-check miễn phí gợi ý `rig_type` nhưng không nói vì sao trượt. Công cụ MCP
  `rig_model` không có tham số model, nên có nguy cơ rơi về bản chỉ rig người.
- **Ngoài:** Cinevva (2026-08-19, bên thứ ba) đo thấy rig bốn chân của Tripo gập chân quá ít (fold 1,045 so với 1,30 của họa sĩ, 2/12 con lỗi):
  dự kiến rig tay (route M) cho họ Q và A.
- **Câu hỏi mở cho lần chạy Tripo đầu tiên:** (1) Tripo có chuẩn hoá kích thước từng ảnh riêng không (góc bên của quái dài có cạnh dài nhất khác
  góc trước/sau)? Ảnh B01 giữ một tỉ lệ chung và một đường sàn chung. (2) Dáng nghỉ chân thẳng có cho mesh tốt hơn concept gốc không?
  (3) Góc RIGHT lật từ LEFT có đủ cho quái đối xứng không? Đề xuất thử A/B trên B01 và W07 trước khi áp cho cả loạt (khoảng 400 credit, cần
  người dùng đồng ý).

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
  4096². Mốc: Sorcerer 32 MB, 10.057 tam giác; D01 14,8 MB, 10.668 tam giác, JPEG/PNG/JPEG 4096²; FL 20,7 MB, 10.488 tam giác.
  GLB dưới 1 MB là chưa có texture.
- Một lệnh `tripo_views.sh` cho `_shots/final_views.png`. Đây là ảnh duy nhất người dùng nhận ở bước cuối, kèm đường dẫn GLB,
  credit từng bước + số dư, variant đã chọn, lỗi còn tồn tại. Không chụp thêm ảnh từng bước.
- Model ASHLAR: thêm một dòng vào danh mục `ashlar/3d/README.md` (GLB, tam giác, kích thước thật, bản trong lab, lỗi còn tồn tại).
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
- Lỗi giữa các góc (B01, 2026-10-21): mỗi sheet qua QA riêng nhưng vòng cổ ở góc BACK nằm đè lên khối vai (góc bên đặt khối vai ngay sau vòng cổ nên từ phía sau nó phải che vòng cổ) và đuôi BACK dài hơn góc bên 18 % chiều cao; người dùng phát hiện, không phải bước kiểm. Skill giờ bắt buộc bước 4b: bảng VIEWS viết trước khi gen, `tpose_tools.py strip` sau khi tách, bảng đo ghi vào `tpose.log`. Concept là tranh 2D, góc sau của nó không nhất thiết khớp góc bên của chính nó.
- Chrome 9333 dùng chung (2026-10-22): tab không phải tab đang hiển thị của cửa sổ thì không nhận chuột (`cdp.mjs drag` treo, `click`
  trượt im lặng), và cửa sổ không được focus không vẽ khung mới (`shot` trả ảnh cũ, ảnh variant và ảnh bốn góc sai góc). Cách làm: mỗi asset
  một CỬA SỔ riêng (`Target.createTarget {newWindow:true}`, đặt ngoài màn hình), `curl /json/activate/<id>` trước khi xoay/chụp, khoá
  chụp chung khi chạy song song, click bằng JS (`document.elementFromPoint`) thay cho `cdp.mjs click`. Upload file chạy được khi không focus.
- Panel Assets lẫn model của mọi thread: variant = link mới xuất hiện sau khi bấm Generate, rồi soát bằng mắt (thuyền, tháp chuông lọt vào).
  Chạy Generate lần lượt từng asset; UV/texture/PBR/export chạy song song được.
- Không sửa script bash khi nó đang chạy (bash đọc file từng đoạn): P07 chết sau khi đã trả Generate 100. Mỗi lượt chạy chép script ra file tạm.
- Giữa lô (sau khi nạp credit) trang Texture tự chọn 8K: nút ghi "Generate Texture 30" thay vì 20. Trước khi bấm: chọn nút `4K`
  (`data-state=on`) và kiểm nhãn "Generate Texture 20".
- Texture vẫn còn sau khi Chrome tắt giữa chừng (B02): mở model bằng URL rồi chạy tiếp từ PBR.
- Ba cửa sổ chạy Smart Mesh cùng lúc (vũ khí, 2026-10-22): mesh vẫn đúng từng món, nhưng bước chụp variant/ảnh cuối hay timeout
  (rc=124, `drag` treo khi cửa sổ khác giành focus). GLB không ảnh hưởng; chụp lại tuần tự sau (`pv.sh`, `p2.sh <ID> <k> views`).

## Đã chạy

| Ngày | Asset | Ghi chú |
| --- | --- | --- |
| 2026-10-17 | Sorcerer, bản xanh đen | Chạy tay. Ảnh T-pose trong `C:\Users\HLC_2021\.codex\generated_images\01a14779-3942-7c83-b26d-80cd7b5b6dd5\`. GLB: `C:\Users\HLC_2021\Downloads\fantasy mage 3d model.glb` |
| 2026-10-18 | Camp props asset_13–24 | Mỗi lượt một ảnh sheet, không multi-view; `camp/` |
| 2026-10-19 | Nature props 08–12 | Mỗi lượt một ảnh sheet, tốn 1.120 credit; `nature/` |
| 2026-10-20 | D01 Hodling B (`ashlar/3d/monsters/D01_hodling/`) | Skill T-pose lần chạy thứ hai + multi-view; variant 2 (6108 faces); 145 credit (8795 → 8650); GLB 14,8 MB, 10.668 tam giác, 3 map 4096²; còn tồn tại: góc mũ nhọn, tai hơi to, tay mảnh; `_shots/final_views.png` |
| 2026-10-20 | FL Flagellant A (`ashlar/3d/heroes/FL_flagellant_vA/`) | Hero concept v3. T-pose lượt 1 đèn đều, người dùng chê "mất khối sáng tối vải" (cất ở `_v1_flatlight/`), đã sửa template skill; lượt 2 giữ khối. Variant 0 (5974 faces); 145 credit (8645 → 8500); texture phải upload lại bốn góc ở trang Texture; GLB 20,7 MB, 10.488 tam giác, 3 map 4096²; còn tồn tại: ngón tay dính thành khối, góc RIGHT có 9/10 nút; `_shots/final_views.png` |
| 2026-10-21 | Đồ rải mặt đất `ashlar/3d/props/clutter_v1/` (riverbank_stones, mushroom_cluster, mossy_stump) | Ảnh đầu vào Astra (`build_manifest.py`): một vật, góc 3/4 hơi cao, nền xám phẳng #BDBDBD, không tấm đất. Smart Mesh MỘT ảnh (không multi-view), rồi `tripo_asset_finish.sh`. Ba tab ghim chạy song song (mỗi vật một tab): ~10 phút cho cả ba. Mesh 5388 / 5489 / 5773 faces; GLB 15,5 / 16,6 / 11,7 MB, ~10k tam giác, 3 map 4096². Tổng 435 credit (8500 → 8065). Chạy song song làm số credit từng bước trong `tripo.log` lẫn của tab khác, chỉ tổng là đúng. `tripo_views.sh` lần này không xoay được viewer (4 ô cùng một góc) |
| 2026-10-21 | Dungeon `ashlar/3d/props/dungeon_v1/` (hầm mộ: sarcophagus, bone_pile, broken_column, candle_cluster, fallen_bell, crypt_wall; hang động: stalagmites, mine_timber, flint_boulders) | Cùng quy trình với clutter_v1: ảnh Astra một vật, nền #BDBDBD, mỗi vật 2 phương án (`build_manifest.py`, lựa chọn trong `ashlar/art/terrain-dungeon-v1/selection.json`). Smart Mesh một ảnh, sau đó `tripo_asset_finish.sh`. Ba tab ghim chạy song song: 9 model trong ~13 phút. Mesh 5214–6763 faces, GLB 12,6–24,7 MB, ~10k tam giác, 3 map 4096². Tổng 1.300 credit (8065 → 6765). GLB Tripo **chuẩn hoá về cạnh dài 1 m**, pivot ở đáy giữa, nên lab phải tự scale về kích thước thật (ví dụ tường hốc mộ rộng 4 m). `crypt_wall` là một module phẳng, dùng ghép thành tường |
| 2026-10-22 | Lô quái đã chốt (`ashlar-chot`), 24 con + xe nồi B03 trong `ashlar/3d/monsters/` | Ba agent Opus làm T-pose (16 dáng người), một agent mẫu nhện W07, ba agent nhân rộng (W01, B03, B05; U04, P04, P06; W02, P03, W04); agent chính duyệt từng bộ views và chạy Tripo. Multi-view, mỗi asset một cửa sổ Chrome riêng, Generate lần lượt, UV/texture/PBR/export song song. Mesh 4.8–7k faces, GLB 12–31 MB, 8.7–11.2k tam giác. 25 GLB × 145 credit + 30 (ba texture 8K lỡ chọn) ≈ 3.655 credit (cùng lúc thread prop A15–A20 tiêu song song; tài khoản được nạp lên ~17.000 giữa lô). Chưa dựng: B05, P03, W04 (Codex hết hạn mức 01:44, mở lại 10-27). P05 dựng với T-pose chưa đạt hẳn (tay xệ 6–9°). D04, P01, U01 ra base color 8192² vì tài khoản đổi mặc định texture sang 8K. Script thao tác tạm (ngoài repo) `E:\tmp_tripo_all\ops\` |
| 2026-10-22 | Dựng nốt lô quái đã chốt: B05, P03, W04 + 9 vũ khí/đồ cầm tay (`ashlar/3d/weapons/`) | Codex vẫn khoá đến 10-27 nên không gen ảnh mới: B05 và P03 multi-view hai góc trước + sau (`SLOTS="Front Back"`), W04 bốn góc cắt từ concept, vũ khí một ảnh cắt từ cột WEAPON/PROP (`E:\tmp_tripo_all\ops\views_fb.py`). 12 asset × 145 = 1.740 credit (11.413 → 9.673, có thread khác chạy song song). Đủ 28/28 quái đã chốt; còn đèn B05 và xích B03 |

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
