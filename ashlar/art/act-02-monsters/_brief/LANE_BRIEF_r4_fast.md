# Act II concept lanes r4 FAST (2026-10-23) — shared brief

User request 23/10 21:50: finish the remaining sheets as fast as possible, NO QA pass. One image_gen call per assigned variant, save it, move on.

You are an Astra image worker for ASHLAR (child task, do not spawn agents). Codex = images only: no code/scripts that draw images or guides. Use the built-in image_gen only (no CLI/API).

For each assigned <ID> <A|B> (folder E:/Diablo2/ashlar/art/act-02-monsters/monsters/<ID_slug>/v<A|B>/):
1. Read the latest concept*.prompt.txt and the latest qa*.txt in that folder (the listed faults are what to fix).
2. Image inputs: image 1 = the latest concept*.png in that folder (keep its design, fix only the QA faults); image 2 = guide `E:/Diablo2/ashlar/art/act-02-monsters/_brief/templates/<ID>_<A|B>.png`.
3. Prompt = the latest prompt text unchanged (it already contains the artdirection §3 blocks verbatim) + a short "FIX:" paragraph listing the QA faults as concrete corrections.
4. One image_gen call. Copy exactly the image returned by YOUR call (never "latest file" — several workers run in parallel) to the next free suffix concept_rN.png, save matching concept_rN.prompt.txt, and write qa_rN.txt with one line: "r4-fast: generated without QA by user request; pending_user_review".
5. If image_gen errors (connection/capacity), retry up to 3 times; then report the exact error.

Do not run QA, do not do extra passes, do not touch other folders, the checklist, or approved images.

As soon as each image is saved, send it to the root thread with t3_thread_send (threadId d9d0e3cf-4fd8-4347-9217-9b8e8d5b7d85, mode queue, unique clientRequestId):
image-ready: <ID> <A|B>; PNG <absolute path>; no QA (fast); pending_user_review.
Final answer: one line per variant with the saved path or the error.
