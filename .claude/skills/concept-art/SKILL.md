---
name: concept-art
description: Vẽ concept art cho ASHLAR (quái, boss, hero, NPC, prop, sheet asset môi trường, cảnh/key art) bằng Codex Astra theo kiểu tiết kiệm token: Claude dựng sẵn prompt, mỗi phiên codex exec một ảnh, Claude tự QA. Chỉ dùng khi cần vẽ hoặc sửa một ảnh concept. Không dùng cho terrain tile, normal map, texture, T-pose cho Tripo (đã có skill generate-tpose-for-tripo) hay việc code.
---

# Concept art (ASHLAR)

Codex chỉ vẽ. Claude đọc tài liệu, viết prompt, chạy runner, QA và báo người dùng. Lý do: lane Astra tự đọc tài liệu và tự QA tốn khoảng 248k token mỗi ảnh; kiểu một ảnh một phiên chỉ khoảng 100k (đo 24/10, `ashlar/art-direction/artdirection.md` §12–§13).

Công cụ ở `ashlar/pipeline/codex/` (cách dùng chi tiết trong `README.md` ở đó):
- `build_prompt.py`: dán nguyên văn các khối §3 của `ashlar/art-direction/artdirection.md` theo `--kind`, thêm thứ tự ảnh đầu vào, mô tả, danh sách sửa; ghi job vào jobfile.
- `astra_batch.py`: mỗi job một `codex exec` mới, tự copy PNG, ghi token mỗi ảnh.

## Các bước

1. **Claude đọc** (Astra không đọc): `ashlar/art-direction/artdirection.md` §0, §1, phần theo loại (§5 hero, §6 quái, §7 môi trường), §8 màu act, §11 QA, §12 quyết định mới nhất; với quái thêm dòng của ID trong `ashlar/docs/ASHLAR_QUY_CHUAN_QUAI_VI.md` và `ashlar/docs/ASHLAR_MONSTER_CHECKLIST_VI.md`. Chỉ đọc mục cần, không đọc cả file.
2. **Khung tỷ lệ** cho sheet có H (§6.5): dùng template có sẵn của act (ví dụ `ashlar/art/act-02/_batches/monsters/templates/<ID>_<A|B>.png`) hoặc dựng bằng code. Astra hay vẽ to hơn H, nên ghi rõ kích thước theo H trong mô tả.
3. **Viết `desc.txt`** (tiếng Anh, ngắn): tên và tiêu đề sheet, bố cục các ô, kích thước theo H, silhouette, màu chính/phụ/nhấn, đạo cụ, điều khác biệt giữa A và B. Không chép lại các khối §3 vì script đã dán. **Viết theo công thức Act I** (thử 24/10: U07/U10 Act II lên ngang Act I chỉ nhờ đổi cách viết, ~45k token/ảnh):
   - `SUBJECT (canon)`: một hai câu cốt truyện của quái.
   - `BUILD`: hình dựng từ **ba khối lớn** đánh số (thân, khối vải/giáp, đạo cụ nặng), xương khớp to, tay chân hơi quá cỡ kiểu Diablo; "at most three to five large marks; never many small tears, rag strips or notches".
   - `SILHOUETTE A/B`: một câu hình đọc được ở cỡ thumbnail, A và B khác hẳn.
   - `POSES`: **3/4 là tư thế có diễn** (khom, lao, vươn tay chụp); LEFT, RIGHT, FRONT, BACK là T-pose như sheet Act I (tay ngang ở LEFT/RIGHT được chấp nhận, không bắt chĩa về camera).
   - **Mật độ detail (26/10, người dùng: "phải bám kĩ là lượng detail cần như thế này, gen hay bị gai gai lắm"):** mức chuẩn là ảnh "Mật độ chi tiết" ở §1.3 của art direction (sheet Act II `G09`/`G03`/`G12` `perspective_v4.png`). Sheet môi trường và prop gắn một ảnh đó làm ảnh style; mô tả dùng số cụ thể (mỗi mặt tường 3–8 khối đá, gỗ 2–4 tấm ván, kim loại trơn).
   - Gắn hai sheet Act I đã duyệt làm tham chiếu style (ví dụ `act-01/monsters/U01_shambler/vA/concept_r2.png`, `act-01/monsters/U02_charnel_dead/vB/concept_r2.png`); không gắn bản gen yếu của chính quái đó.
4. **Lượt sửa: giữ chất lượng.** Act II (23/10) cho thấy sửa nối tiếp làm ảnh xuống cấp: U06 bản đầu còn nét vẽ tay kiểu Diablo, đến `concept_v2_r3` thành đồ chơi nhựa bóng, chân ngắn kiểu chibi; F05 v2 cũng vậy. Vì thế:
   - **Không sửa nối tiếp.** Không lấy ảnh đã sửa làm đầu vào cho lần sửa sau. Mỗi lượt sửa đều xuất phát từ ảnh **đẹp nhất** của biến thể (thường là bản gen đầu), không phải ảnh mới nhất.
   - Lỗi lớn (dáng, tỷ lệ, góc nhìn sai) thì **gen mới** từ mô tả, kèm ảnh đẹp nhất làm tham chiếu thiết kế, thay vì sửa ảnh.
   - `fixes.txt` tối đa khoảng 5 dòng, chỉ lỗi quan trọng; danh sách dài làm model bỏ style để chạy theo lỗi.
   - Luôn gắn thêm một sheet đã duyệt của Act I làm **tham chiếu style** (ví dụ `ashlar/art/act-01/monsters/U01_shambler/vA/concept_r2.png`), ghi rõ "style reference only: match its hand-painted rendering, not its design".
   - Khung tỷ lệ chỉ gắn khi cần sửa kích thước; ảnh khung hình khối phẳng dễ kéo ảnh về kiểu khối nhựa.
5. **Dựng job:**
   ```
   python ashlar/pipeline/codex/build_prompt.py --kind monster --desc desc.txt [--fixes fixes.txt] \
     --image <latest.png>=design reference --image <guide.png>=scale guide \
     --out <folder>/concept_v3.png --id <ID>_<V>_v3 --jobfile <batch>/jobs.json
   ```
   `--kind`: `monster`, `hero`, `prop`, `env-sheet`, `scene`. Ra file mới, hậu tố mới; không ghi đè ảnh cũ.
6. **Chạy** bằng Bash `run_in_background`: `python ashlar/pipeline/codex/astra_batch.py --jobfile <batch>/jobs.json`. Đọc dòng account id ở đầu log; sai tài khoản thì dừng và hỏi người dùng (xem memory về CODEX_HOME). Gặp `limit` thì báo giờ mở lại, không chạy tiếp. Runner chạy Codex trong thư mục trống `E:/map01-batch/work` để Codex không nạp `AGENTS.md`; dòng status nào có `policy: "read-files"` nghĩa là Astra vẫn tự đọc file, xem lại phiên đó.
7. **QA §11 trên PNG** (Claude, bằng Read). **Kiểm style trước tiên**, đặt cạnh sheet Act I tham chiếu: nét vẽ tay, khối sáng tối, tỷ lệ giải phẫu thật. Trông như đồ chơi, nhựa bóng, render 3D sạch, chibi hay chân ngắn thì FAIL dù các lỗi khác đã hết; nhiều detail hơn ảnh chuẩn "Mật độ chi tiết" (§1.3) hoặc "gai gai" (nét xước mảnh, mép răng cưa, tua tủa, gai nhỏ dày) cũng FAIL; không gửi ảnh đó là "đạt". Sau đó kiểm: kích thước theo H đo bằng pixel, LEFT/RIGHT không bị đảo, BACK là lưng thật, đối chiếu chéo các góc, tay và đạo cụ, màu §8, A và B khác silhouette. Ghi `_work/qa_<hậu tố>.txt` trong thư mục của ảnh (file phụ prompt, task, log, result cũng ở `_work/`; ngoài `_work/` chỉ có ảnh thành phẩm) (PASS/FAIL, lỗi còn lại, `pending_user_review`).
8. **Gửi người dùng ngay** từng ảnh bằng đường dẫn tuyệt đối dạng ảnh Markdown, kèm lỗi còn lại. Không đợi đủ bộ. Ảnh FAIL thì quay lại bước 4, tối đa 3 lượt mỗi biến thể rồi để người dùng chọn.
9. Báo tổng token mỗi ảnh từ dòng tổng kết của runner. Cao hơn hẳn khoảng 100k thì xem lại độ dài prompt và ảnh đầu vào.

## Không làm

- Không giao cho Astra cả lane nhiều ảnh, không bảo Astra đọc `artdirection.md`, QA cũ hay skill, không dùng T3 `delegate_task` để vẽ.
- Không vẽ bằng code (PIL, SVG, canvas); code chỉ để dựng khung tỷ lệ, cắt, đo.
- Quyết định mới của người dùng về hình ghi vào `ashlar/art-direction/artdirection.md` §12 trước khi vẽ tiếp.
