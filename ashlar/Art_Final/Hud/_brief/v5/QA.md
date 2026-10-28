# HUD v5 sprite sheets — QA (§11), 2026-10-26

Run 1 (16:43) failed: C: full, Codex wrote 0-byte PNGs that astra_batch still logged "ok". Run 2 (17:18, `run2.log`): 7/7 images, 85.8k tokens (12.3k/image).
Pixel check (`E:/tmp_hudqa/qa.py`): background flat ~#04F906 (std ≤ 2.6), green spill inside sprites ≤ 7 px, sprite counts as briefed on every sheet.

| Sheet | Verdict | Notes |
|---|---|---|
| A_bar | PASS | 10/10. Trough↔fill gap 26 px (< 40 asked), still separate. Locked face browner than "pale grey mortar"; bar ends got diamond caps not in the HUD. |
| B_globe | FAIL row 2 | Guardian, cracks, shored course, staple, wedge, surface ellipse OK (ring inside ≈ disc 246 px). Discs 2–6 came out as glossy balls: baked glass highlights (double with F1), dark outline, meniscus line on all liquids (brief: no surface line). Rerun row 2 only as `B_globe_r2` (`run3_B_r2.log`). |
| B_globe_r2 | PASS | 17:43, 11.4k tokens. 5 discs, all 322 px: no highlight, no outline, no meniscus line. Soft sphere darkening at the edges kept (reads as depth behind the glass). Gaps only ~5 px (asked wide), still separate; cut with a circle mask and scale to the ring inside (≈246 px). Mortar disc beige rather than grey. Use rows 1 and 3 from B_globe, discs from r2. |
| C_fl | PASS | 6/6. Niche empty, staple kept; links all ~300 px tall (asked 120, consistent, scale in code). |
| D_ps | PASS, 2 code fixes | 12/12 (21 parts: 8 ring segments, 4 bracket corners). Lit ring segment (11) is wider than a segment of (10): rebuild by tinting a cut segment. Open hand (8) skin-coloured, emoji-like instead of pale ember: tint or redo later. |
| E_icons | PASS, normalise | 17/17. Not exactly square/equal: rows 1–2 226×215/223, row 3 ~250×238; crop/resize to one square in slicing. #6 ash brow reads weak. |
| F_fx | PASS, 1 code fix | 9/9. Half rim (6) also draws part of the bottom edge: build it by masking the closed rim (5). |
| G_plates | PASS | 10/10. Nameplate fill 418×58 vs frame inside ~490×28: resize to the frame in code. |
