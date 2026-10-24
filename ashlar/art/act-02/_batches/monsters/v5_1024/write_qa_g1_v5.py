"""Writes _work/qa_v5.txt for the G1 v5 sheets (Claude QA 2026-10-24, artdirection §11, style first vs Act I U01 vA r2)."""
from pathlib import Path

M = Path(r"E:\Diablo2\ashlar\art\act-02\monsters")
HEAD = ("Status: pending_user_review; NOT approved. QA 2026-10-24 (Claude, fork G1), concept_v5.png = fresh gen with the Act I "
        "recipe (three big masses, acting 3/4, Act I sheets as style refs). Heights measured by pixel against the H silhouette, "
        "not the model's guide lines (+/-3 %).\n")
QA = {
 "U06_pall_wight/vA": "Result: FAIL (size). Style PASS: chunky hand-painted armour, big nail heads, broad form shading, close to Act I.\nGood: square slab knight, banded coffin on the back in every view, coffin shield + mace match the WEAPON cell, small orange knot only.\nFaults: helm top 1.03H vs canon 1.10-1.20H (asked 1.15H); LEFT/RIGHT arm reaches forward instead of sideways.\nNext: v5_r2 edit (shrink H, side arms).",
 "U06_pall_wight/vB": "Result: PASS. Style PASS, close to Act I.\nGood: tall pointed silhouette, six-sided coffin with two diagonal straps, round shield + flanged mace match WEAPON, top 1.16H (canon 1.10-1.20H), clearly different from A.\nMinor: LEFT/RIGHT arm reaches forward instead of sideways; coffin ~0.78H (asked 0.90H).",
 "U08_charnel_chanter/vA": "Result: PASS. Style PASS, close to Act I.\nGood: deep square hood, long skull, bony split-robe knees, gold clasp only, spell-weaving 3/4.\nMinor: hood top ~1.00H (asked 0.95H, canon 0.90-1.00H OK); side views show one arm forward.",
 "U08_charnel_chanter/vB": "Result: PASS. Style PASS, close to Act I.\nGood: wide bell robe, bare skull, tall collar, ribcage window, chanting 3/4 with raised hand, T-pose views 0.96-0.97H; clearly different from A.\nMinor: a few small holes near the hem; side views one arm forward.",
 "U09_ossuary_glutton/vA": "Result: PASS (minor). Style PASS: strong Diablo-like painted brute.\nGood: pear body, huge horizontal belly maw, bone heap fused at the legs in every view, orange tie small, crown ~1.00H. Two-row layout (H repeated) like Act I U05.\nMinor: belly teeth are sharp fangs (asked blunt plates); shroud has many small holes; LEFT/RIGHT arms hang instead of T-pose.",
 "U09_ossuary_glutton/vB": "Result: FAIL (side consistency). Style PASS.\nGood: hunched top-heavy body, vertical belly maw, bone rack on the back, clearly different from A, ~1.03H.\nFaults: FRONT puts the hip bone mass on image-left (anatomical right) while BACK/LEFT put it on the anatomical left; mantle has many small holes and dots.\nNext: v5_r2 edit.",
 "U10_wallshade/vB": "Result: PASS. Style PASS, matches U10 A v4 rendering.\nGood: bent crescent, wide pressed face, mortar band across ribs and mortar cuffs with drips, translucent split tails, orange tie small; crown ~0.97H; clearly different from A.\nMinor: LEFT/RIGHT one arm forward.",
 "U11_scribe_shade/vA": "Result: PASS (minor). Style PASS.\nGood: hooked pointed hood, pale lining panels, quill in WEAPON cell matches the held one, gold ferrule accent, hood ~0.97H.\nMinor: tiny script-like marks on the pale lining (no text was asked); many wispy smoke tendrils at the hem.",
 "U11_scribe_shade/vB": "Result: FAIL (layout). Style PASS.\nFaults: cell order H, 3/4, LEFT, WEAPON, RIGHT (WEAPON must follow 3/4); scribbled writing on the parchment yoke.\nNext: v5_r2 fresh gen with explicit order.",
 "U12_the_pressed/vA": "Result: FAIL (size/pose). Style PASS (painted, sculptural, non-graphic relief faces).\nGood: square tower of wrapped body bundles, ivory hip struts, tiny head, FRONT 1.42H (canon 1.20-1.50H).\nFaults: LEFT/RIGHT 1.54H, taller than FRONT and over range; side views have an arm raised in front instead of T-pose.\nNext: v5_r2 edit.",
 "U12_the_pressed/vB": "Result: FAIL (size, borderline). Style PASS but cloth speckled.\nGood: hunched wedge 3/4 crawl with knuckles down, clearly different from A, faces in relief.\nFaults: 1.19-1.21H vs asked 1.35H (canon floor 1.20H); many brown speckle dots/pin holes on the wraps (micro texture); vertical ivory ribs missing.\nNext: v5_r2 edit (shrink H, clean cloth).",
 "B06_choir_of_nails/vA": "Result: FAIL (scale/views). Style PASS: strong painted boss read, pyramid of hooded singers under a pipe spire.\nFaults: bottom-row H drawn larger than top-row H (FRONT/BACK 1.69H vs 3/4 2.23H); RIGHT is a 3/4-front, not a side profile; FRONT shows 8 faces, canon twelve.\nNext: v5_r2 edit.",
 "B06_choir_of_nails/vB": "Result: FAIL (labels/scale). Style PASS: wide crescent with twin pipe fans and domed bellows, clearly different from A.\nFaults: LEFT/RIGHT labels swapped (view labelled LEFT faces image-right); bottom row 1.85H vs top row 2.11H; ~10 singers, canon twelve.\nNext: v5_r2 edit.",
 "B07_brother_cassian/vA": "Result: FAIL (size). Style PASS: gaunt old man, black robe, white scapular, stone-root feet, painted.\nFaults: halo top 1.30H vs canon 0.95-1.05H (user: human scale); halo spikes point up/out, canon inward; BACK shows a long white panel (asked short nape panel).\nNext: v5_r2 edit (enlarge H, inward spikes).",
 "B07_brother_cassian/vB": "Result: FAIL (size). Style PASS: wide cape + iron yoke, white under-tunic, root shins, clearly different from A.\nFaults: halo top 1.21H vs canon 0.95-1.05H; halo spikes point outward, canon inward.\nNext: v5_r2 edit.",
}
for k, body in QA.items():
    p = M / k / "_work" / "qa_v5.txt"
    p.write_text(HEAD + body + "\n", encoding="utf-8")
print(len(QA))
