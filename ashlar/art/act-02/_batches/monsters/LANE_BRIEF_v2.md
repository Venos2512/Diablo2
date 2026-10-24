> **Ngừng dùng từ 24/10:** lane nhiều ảnh trong một phiên Astra tốn khoảng 2,5 lần token mỗi ảnh. Chạy theo `ashlar/pipeline/codex/README.md` (mỗi phiên một ảnh, prompt dựng sẵn, Claude làm QA) và `ashlar/art-direction/artdirection.md` §13.

# Act II monster concepts — ver2 lanes (2026-10-23) — shared brief

User request 23/10 22:00: "ver2 của tất cả quái, lần này check QA". Every Act II sheet (23 monsters × A/B = 46) gets a ver2: same design identity as the current sheet of that variant, redrawn clean and correct, with full QA.

You are an Astra image worker for ASHLAR (child task, do not spawn agents). Codex = images only: no code/scripts that draw images or guides. Use the built-in image_gen only (no CLI/API). Use the imagegen skill C:/Users/HLC_2021/.codex/skills/.system/imagegen/SKILL.md.

Read first: E:/Diablo2/ashlar/art-direction/artdirection.md (§1–3, 6, 8, 10.3, 11, 13), and for your IDs E:/Diablo2/ashlar/docs/ASHLAR_MONSTER_CHECKLIST_VI.md and E:/Diablo2/ashlar/docs/ASHLAR_QUY_CHUAN_QUAI_VI.md.

For each assigned <ID> <A|B> (folder E:/Diablo2/ashlar/art/act-02/monsters/<ID_slug>/v<A|B>/):
1. Read every qa*.txt in the folder (all past faults are things ver2 must not repeat) and the latest concept*.prompt.txt.
2. Read guide JSON `E:/Diablo2/ashlar/art/act-02/_batches/monsters/templates/<ID>_<A|B>.json` (H, spans, view_notes, content, alias, estimates, pose) and `_brief/templates/facts_all.json`.
3. Image inputs: image 1 = the latest concept*.png of this variant (design reference: keep silhouette, costume, palette, props; it may contain faults); image 2 = guide `_brief/templates/<ID>_<A|B>.png`. Never templates_before_r2 or templates_staging_r2.
4. Prompt: paste STYLE CORE, SHEET RULES, MONSTER RULES, CONTENT from artdirection §3 verbatim, then the monster description from the latest prompt, then a "VER2 FIXES:" list built from all past QA faults. Sheet = one row: H, 3/4, weapon/prop cell if any, LEFT, RIGHT, FRONT, BACK; neutral warm-grey studio; same scale in every view; clean Immortal-like form shading.
5. Save exactly the image returned by YOUR image_gen call (never "latest file": several workers run in parallel) as concept_v2.png + concept_v2.prompt.txt.
6. QA per artdirection §11: measure height/width vs H in pixels, LEFT faces left and RIGHT faces right (not swapped), FRONT/BACK arms neutral and fingertips not touching anything, side-view arms correct, back is a true back, held prop matches the isolated prop cell, no wounds/penetration, palette §8, A and B still differ in silhouette. Write qa_v2.txt (result PASS/FAIL, size vs H, remaining faults, status pending_user_review — never approved).
7. If FAIL: new image_gen pass starting from the latest ver2 image, fix exactly the listed faults, save concept_v2_r2.png / qa_v2_r2.txt, then r3. Max 3 passes per variant; after the 3rd keep the best and mark its remaining faults. Keep all files.
8. image_gen errors (connection/capacity): retry up to 3 times with a short wait, then report the exact error; no placeholders.

Do not touch other folders, the checklist, catalogue, or approved images.

AS SOON AS a variant is final (PASS, or best after 3 passes), send it to the root thread with t3_thread_send (threadId d9d0e3cf-4fd8-4347-9217-9b8e8d5b7d85, mode queue, unique clientRequestId), send ONCE per variant:
v2-ready: <ID> <A|B>; PNG <absolute path>; QA <PASS|FAIL>; caveat: <short>.
Final answer: one line per variant: file, QA result, remaining faults.
