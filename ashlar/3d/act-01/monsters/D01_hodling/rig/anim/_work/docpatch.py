import os, sys, time
def wr(p, s):
    for _ in range(20):
        try:
            open(p, "w", encoding="utf-8", newline="\n").write(s); return
        except OSError:
            time.sleep(1)
    raise SystemExit("could not write " + p)
rig = r"E:\Diablo2\ashlar\3d\act-01\monsters\D01_hodling\rig"
p = rig + r"\rig_brief.md"
s = open(p, encoding="utf-8").read()
a = "Trạng thái: **G1 đã duyệt (người dùng, 2026-10-21); R2–R5 bản v4 đã qua review kỹ thuật Opus PASS, chờ G2.** Chưa làm clip (R6), chưa tiêu credit, GLB gốc không bị sửa. G2 (duyệt thẩm mỹ rig) **chưa** được duyệt."
b = "Trạng thái: **G1 và G2 đã được người dùng duyệt (2026-10-21, trả lời \"duyệt\"); R6–R7 đã dựng (6 Action, bản thử trong lab), chờ review kỹ thuật Opus rồi G3.** Chưa R8, chưa R9, 0 credit, GLB gốc không bị sửa. G3 và G4 **chưa** duyệt. Xem [`anim/R7_report.md`](anim/R7_report.md) và [`anim/clips.json`](anim/clips.json)."
assert a in s; s = s.replace(a, b)
a = "| G2 (rig) | | **chờ người dùng xem ảnh QA** | | R2–R5 làm 2026-10-21; xem `rig/qa/` và `rig/qa_report.md`. Chưa duyệt |\n| G3 (clip) | | | | |"
b = "| G2 (rig) | 2026-10-21 | **PASS (người dùng duyệt)** | người dùng (trả lời \"duyệt\") | rig v4 (`rig/D01_hodling_rig.blend` sha256 `bf6c53dc…0bcb`), bản chụp trước khi làm clip ở `rig/_snapshots/g2_approved/`. Cho phép R6–R7; không cho phép R8 trở đi |\n| G3 (clip) | | **chờ** | | R6–R7 xong 2026-10-21 (Sonnet), `rig/anim/R7_report.md`; sáu Action `experiment`, chưa Opus review, chưa duyệt |"
assert a in s; s = s.replace(a, b)
a = "| Tham chiếu | `rig/anim/refs/` — chưa tạo."
b = "| Tham chiếu | `rig/anim/refs/` — đã tạo 2026-10-21 (KayKit `kaykit-anims-medium.glb` + skin tham chiếu + `prepare-kaykit.py`, băm đúng blob ghim)."
if a in s: s = s.replace(a, b)
s += "\n## Kết quả R6–R7 (2026-10-21) — chờ G3\n\nSáu Action trên rig G2 (không đổi): `rig/D01_hodling_rig_anim.blend`. Khác kế hoạch ở bảng clip: `idle` dùng KayKit `Idle` (không phải `Unarmed_Idle`, tư thế đấm bốc), 48 khoảng (2,0 s); `walk` 26 khoảng (1,0833 s), `run` 18, `attack` 18 (hit offset 8), `hit` 11, `death` 30 (Death_A kéo 1,5625×). Trượt/tiếp xúc/hit/khố đo thật: xem `anim/R7_report.md`. Điều chỉnh khác nguồn (biên độ idle/hit ×1,8, nâng chân walk ×0,65, chậu attack/hit ×0,45), điều còn tồn tại (khố xuyên đùi ở death, walk nhấc gót vàng, R8 chưa làm, GUI/lab chưa thời gian thực bởi người) đều ở đó.\n"
wr(p, s)
p = r"E:\Diablo2\ashlar\3d\rig-anim\ANIMATION_INVENTORY.md"
s = open(p, encoding="utf-8").read()
a = "| brief (qua G1), rig đang làm / chờ G2 (**G2 chưa duyệt**) | – | – |"
b = "| brief (qua G1), rig (qua G2); 6 Action R6–R7 xong, chờ Opus + **G3 (chưa duyệt)** | `idle`, `walk`, `run`, `attack`, `hit`, `death` (Action trong `rig/D01_hodling_rig_anim.blend`, `status experiment`, KayKit CC0; chưa bake R8) | – |"
assert a in s; s = s.replace(a, b)
a = "R2–R5 dựng xong 2026-10-21 (A1 14/14 đạt), ảnh QA ở `rig/qa/`, báo cáo `rig/qa_report.md`; chưa R6, 0 credit."
b = "**G2 người dùng duyệt 2026-10-21.** R2–R5 (A1 14/14), ảnh QA ở `rig/qa/`, báo cáo `rig/qa_report.md`. R6–R7 2026-10-21: 6 Action, manifest `rig/anim/clips.json`, báo cáo `rig/anim/R7_report.md` (walk 0,358 m/s stride 0,388 m, run 1,627 m/s stride 1,221 m; attack hit offset 8 = 0,333 s; chưa R8, chưa bản trong lab, 0 credit)."
assert a in s; s = s.replace(a, b)
wr(p, s)
print("docs ok")
