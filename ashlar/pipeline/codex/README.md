# Codex (Astra) chạy ảnh: một ảnh một session

Quy tắc: Codex chỉ sinh ảnh. Mọi việc code, ghép prompt và QA do Claude làm.
Lý do: session Astra tự đọc ashlar/art-direction/artdirection.md và QA nhiều ảnh tốn ~250k token/ảnh; kiểu Map 1 (prompt dựng sẵn, Astra không đọc gì) chỉ ~100k.

## Luồng

1. Claude viết `desc.txt` (mô tả riêng của asset, tiếng Anh) và `fixes.txt` nếu là lượt sửa (mỗi dòng một lỗi, ngắn).
2. `build_prompt.py` ghép các khối §3 của `ashlar/art-direction/artdirection.md` (parse từ file, dán nguyên văn) + INPUT IMAGES + desc + FIXES thành `<thư mục ảnh>/_work/<tên>.prompt.src.txt` và ghi job vào jobfile.
3. `astra_batch.py` chạy mỗi job một `codex exec` mới, copy PNG ra `outputPath`, ghi `tokens` vào status. Mọi file phụ (prompt, task, log generation, result, `qa_*.txt`) nằm trong `<thư mục ảnh>/_work/`; thư mục ảnh chỉ giữ ảnh thành phẩm.
4. Claude QA ảnh theo §11. Lượt sau là job mới với hậu tố (`_v2`, `_fix1`), không ghi đè ảnh cũ.

## Lệnh

```
python build_prompt.py --kind monster --desc desc.txt [--fixes fixes.txt] \
  --image prev.png=latest --image guide.png=guide \
  --out E:/.../concept_v2.png --id M07_v2 --jobfile E:/.../jobs.json

python astra_batch.py --jobfile E:/.../jobs.json [--jobs M07_v2 ...] [--parallel 4] [--attempts 2]
```

- `--kind`: monster, hero, prop, terrain, tpose-humanoid, tpose-quadruped, env-sheet, scene, tripo-row; hoặc `--blocks STYLE SHEET ...` (khoá: STYLE SHEET HERO MONSTER TERRAIN TPOSE HUMANOID QUADRUPED ENV SIX SCENE TRIPO CONTENT).
- Khối nào thiếu hoặc trùng trong ashlar/art-direction/artdirection.md thì script dừng ngay.
- Status mặc định: `<thư mục jobfile>/_runs/status.jsonl`. Cuối batch in: ảnh ok, lỗi, tổng token, token/ảnh.
- Tài khoản: `--codex-home` hoặc biến `ASTRA_CODEX_HOME` (mặc định `E:/map01-batch/home`); đầu lần chạy in account id (và plan) trong auth.json. Không in token hay email. **Không dùng `E:/map01-batch/home-nam`** (người dùng, 25/10/2026); chạy với `--codex-home ~/.codex`.
- Thư mục làm việc: codex chạy với `-C` một thư mục rỗng ngoài repo (`--workdir`, mặc định `E:/map01-batch/work`, tự tạo) cùng `--skip-git-repo-check`, để không nạp AGENTS.md của repo và Astra khỏi đọc ashlar/art-direction/artdirection.md. Ảnh tham chiếu dùng đường dẫn tuyệt đối. Nếu log cho thấy session vẫn chạy lệnh shell (đọc file), status ghi `policy: "read-files"`: kiểm tra token của ảnh đó.
- Đường dẫn trong jobfile được `build_prompt.py` đổi sang tuyệt đối; đường dẫn tương đối còn sót được hiểu theo thư mục của jobfile. `--jobs` trùng id chỉ chạy một lần; hai job cùng outputPath thì dừng ngay.
- Chạy thử: `python -m pytest tests/test_build_prompt.py tests/test_astra_batch.py` (không gọi codex).

## Quy tắc token

- Một ảnh một session; không gộp nhiều ảnh trong một session.
- Astra không đọc gì: HEADER cấm đọc skill/doc, prompt đã đầy đủ.
- Không tự QA trong Codex; Claude QA bằng ảnh đã thu.
- Fixes là danh sách ngắn (vài dòng), không dán lại cả mô tả.
- Ảnh tham chiếu chỉ gồm ảnh mới nhất và guide, không đính kèm cả lịch sử.
- Hết quota (`limit`) thì batch dừng; `capacity` tự lùi 90 s rồi chạy lại bằng session mới.
