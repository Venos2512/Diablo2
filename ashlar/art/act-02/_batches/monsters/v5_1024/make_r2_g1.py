"""G1 round 2: fixes files (edits from the v5 sheet) + U11_B fresh regen desc."""
from pathlib import Path

HERE = Path(__file__).parent
EDIT = ("Asset type: ASHLAR Act II monster concept sheet, pending_user_review. EDIT of input image 1 (the current sheet "
        "{title}). Keep everything not listed in FIXES exactly as it is: design, colours, painting style, poses, layout, "
        "title and labels. Input image 2 is an approved Act I sheet: style reference only, match its hand-painted "
        "rendering, never its design. Output the full corrected sheet at the same size and layout.")

JOBS = {
 "U06_A": ("U06 PALL-WIGHT — A", [
   "SCALE: shrink ONLY the dark-grey H silhouette at far left, feet kept on the baseline: make it 363 px tall (head top at y=215 on the 2172x724 sheet). The knight stays exactly as drawn, so it now measures 1.15H.",
   "LEFT and RIGHT views: T-pose arms straight out sideways at shoulder height, both arms visible as horizontal limbs like the Act I sheets; no arm reaching forward toward the face direction.",
 ]),
 "U09_B": ("U09 OSSUARY-GLUTTON — B", [
   "FRONT view: the fused bone mass at the hip belongs to the anatomical LEFT hip, so in FRONT it must sit on the IMAGE-RIGHT hip; move it there and leave the image-left hip plain. BACK stays as it is (bone mass on image-left).",
   "Mantle and shroud: remove the many small holes and speckle dots; keep at most four or five big clean tears per view.",
 ]),
 "U12_A": ("U12 THE PRESSED — A", [
   "LEFT and RIGHT views (top row): they are too tall. Redraw them as T-pose side views with the same height as FRONT: top of the body at about y=128 (1.42H against the 255 px H silhouette), feet on the baseline.",
   "LEFT and RIGHT views: arms straight out sideways at shoulder height (T-pose seen from the side), not raised up in front of the body.",
 ]),
 "U12_B": ("U12 THE PRESSED — B", [
   "SCALE: shrink ONLY the two dark-grey H silhouettes, feet kept on their baselines: each becomes 289 px tall (top-row head at y=211, bottom-row head at y=651). The monster stays exactly as drawn, so it now measures 1.35H.",
   "Burial cloth wraps: remove the many small brown speckle dots and pin holes; clean pale cloth with big soft fold shadows and only a few big torn edges.",
 ]),
 "B06_A": ("B06 CHOIR OF NAILS — A", [
   "SCALE: the bottom-row H silhouette must match the top-row H: shrink ONLY the bottom-row H to 199 px tall, feet on the bottom baseline (head top at y=729). FRONT and BACK stay as drawn.",
   "RIGHT view: redraw as a TRUE side profile facing image-right, the mirror-opposite side of LEFT with the same narrow width as LEFT; it must not show the singers' faces frontally.",
   "FRONT: show exactly TWELVE hooded singer faces in the pyramid (tiers of 2, 4 and 6 from top to bottom), all the same design.",
 ]),
 "B06_B": ("B06 CHOIR OF NAILS — B", [
   "LABELS: the view above the label LEFT faces image-right and the view above RIGHT faces image-left; swap only the two label words so the view facing image-left is labelled LEFT and the one facing image-right is labelled RIGHT.",
   "SCALE: shrink ONLY the bottom-row H silhouette to 176 px tall, feet on the bottom baseline (head top at y=732). FRONT and BACK stay as drawn.",
   "FRONT: exactly TWELVE singers in the curved row, evenly spaced, all the same design.",
 ]),
 "B07_A": ("B07 BROTHER CASSIAN — A", [
   "SCALE: Cassian is canon human-sized: the halo top must be level with the H head. Enlarge ONLY the dark-grey H silhouette, feet kept on the baseline, to 538 px tall (head top at y=79 on the 2172x724 sheet). Cassian stays exactly as drawn.",
   "HALO: the iron spikes point INWARD toward the skull (short teeth on the inner side of the ring, stopping at a padded band with clear space from the skin), not outward or upward.",
 ]),
 "B07_B": ("B07 BROTHER CASSIAN — B", [
   "SCALE: Cassian is canon human-sized: the halo top must be level with the H head. Enlarge ONLY the dark-grey H silhouette, feet kept on the baseline, to 533 px tall (head top at y=76 on the 2172x724 sheet). Cassian stays exactly as drawn.",
   "HALO: the iron spikes point INWARD toward the skull (short teeth on the inner side of the ring, stopping at a padded band with clear space from the skin), not outward.",
 ]),
}

for k, (title, fixes) in JOBS.items():
    (HERE / f"{k}_r2.desc.txt").write_text(EDIT.format(title=title) + "\n", encoding="utf-8")
    (HERE / f"{k}_r2.fixes.txt").write_text("\n".join(fixes) + "\n", encoding="utf-8")

# U11_B: fresh regen, layout order + no writing
src = (HERE / "U11_B.desc.txt").read_text(encoding="utf-8").rstrip("\n").split("\n")
src.insert(-1, "LAYOUT ORDER (mandatory): cells left to right are exactly H, 3/4, WEAPON, LEFT, RIGHT, FRONT, BACK; the WEAPON cell sits between 3/4 and LEFT, never between LEFT and RIGHT.")
src = [l.replace("a wide shallow shoulder yoke of pale warm-grey parchment colour across both shoulders.",
                 "a wide shallow shoulder yoke of plain pale warm-grey cloth across both shoulders, with no writing, letters or script marks on it.") for l in src]
(HERE / "U11_B_r2.desc.txt").write_text("\n".join(src) + "\n", encoding="utf-8")
print("ok")
