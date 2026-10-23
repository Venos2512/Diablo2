# Act II concept lanes r3 (2026-10-23) — shared brief

You are an Astra image worker for ASHLAR (child task, do not spawn agents). Codex = images only: no code/scripts that draw images or guides.

Read first: E:/Diablo2/Agent.md, E:/Diablo2/ashlar/artdirection.md (§1–3, 6, 8, 10.3, 11, 13), E:/Diablo2/ashlar/ASHLAR_MONSTER_CHECKLIST_VI.md and E:/Diablo2/ashlar/ASHLAR_QUY_CHUAN_QUAI_VI.md for your IDs; imagegen skill C:/Users/HLC_2021/.codex/skills/.system/imagegen/SKILL.md. Use the built-in image_gen only (no CLI/API).

Sheet: one row H, 3/4, weapon/prop cell if any, LEFT, RIGHT, FRONT, BACK; neutral warm-grey studio, same scale in every view, clean Immortal-like form shading. Paste STYLE CORE, SHEET RULES, MONSTER RULES, CONTENT from artdirection §3 verbatim. Image 1 = style reference (an approved sheet of the same family, view it first); image 2 = guide `_brief/templates/<ID>_A.png` / `_B.png` (Opus-reviewed r2; never templates_before_r2 or staging). Read the matching JSON (H, spans, view_notes, content, alias, estimates, pose) and `_brief/templates/facts_all.json`. A and B must differ truly in silhouette / clothing / armour.

Content: no depicted wounds or penetration; inward-spike halos read as fitted headgear; source palettes yield to artdirection §8.

QA every image per §11 (ratio vs H measured in pixels, views consistent, arms/legs neutral in turnarounds, back is a true back). If it fails, do a new image_gen pass; keep old files, use a new suffix (concept_r2.png, concept_r3.png …). Revision lanes: read the existing qa*.txt in each folder first and fix exactly the listed faults, starting from the latest image.

Save to E:/Diablo2/ashlar/art/act-02-monsters/monsters/<ID_slug>/vA|vB/: concept*.png + matching .prompt.txt + qa*.txt (result, size vs H, remaining faults, status pending_user_review — never approved). Do not touch the master checklist, catalogue, or approved images. Copy exactly the output of YOUR image_gen call (generatedImage result), never "latest file" — 10 workers run in parallel.

AS SOON AS each image passes QA, send it to the root thread with t3_thread_send (threadId f98fef1a-cd14-45a5-8091-352bb1b3cab9, mode queue, unique clientRequestId) in this one-line format:
image-ready: <ID> <A|B>; PNG <absolute path>; QA caveat: <short>; pending_user_review.
If image_gen errors (connection/capacity), retry up to 3 times with a short wait; if still failing, report the exact error, no placeholders. Final answer: table of files, QA result, remaining.
