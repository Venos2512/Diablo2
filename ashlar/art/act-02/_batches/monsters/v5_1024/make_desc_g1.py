"""Writes the G1 desc files (U06, U08, U09, U10 B, U11, U12, B06, B07) for the v5 Act I-recipe regen."""
from pathlib import Path

HERE = Path(__file__).parent
MARKS = ("At most three to five large marks per figure; never many small tears, rag strips, holes or notches.")
TP = ("LEFT, RIGHT, FRONT, BACK = T-pose like the Act I sheets: arms straight out sideways at shoulder height, legs straight "
       "and parallel; side views show the arms straight out sideways like the Act I sheets. Draw each figure once: no ghost "
       "or double feet, no faded duplicate limbs.")


def hdr(name, v, fam):
    return (f"Asset type: ASHLAR Act II monster concept sheet, pending_user_review. Fresh design sheet, original ASHLAR "
            f"monster {name}, variant {v} (family {fam}). Input images 1 and 2 are approved Act I sheets: style reference "
            f"only, match their hand-painted rendering, chunky Diablo proportions, broad shape masses and readability; "
            f"never copy their designs or colours.")


U06_SUBJ = ("SUBJECT (canon): a dead Pallbearer knight in black armour studded with big silver nails, still carrying a closed "
            "coffin strapped upright on its back. Slow, heavily armoured, bashes with its shield; at half health the coffin "
            "lid bursts open (not shown here).")
U08_SUBJ = ("SUBJECT (canon): a skeleton in a rotted choir robe that still murmurs the Rite of Laying; it hangs back behind "
            "other undead and casts cold and grave-fire spells (no spell effects drawn).")
U09_SUBJ = ("SUBJECT (canon): a bloated corpse fused to a heap of bones, with a second mouth in its belly; it eats corpses and "
            "spits bone shards. Non-graphic: the belly mouth is a clean dark opening rimmed with big blunt ivory teeth, no "
            "blood, no organs.")
U11_SUBJ = ("SUBJECT (canon): the wraith of an old copyist, black as ink, still holding his quill; stooped and narrow as if "
            "writing. Throws blinding ink and \"rewrites\" the floor under the hero into traps (no effects drawn).")
U12_SUBJ = ("SUBJECT (canon): a giant humanoid mass built from many bodies pressed together like bricks inside the Wall; "
            "faces and hands show along both flanks. It crawls out where the Wall breaks, slow and heavy; destroyed, it "
            "releases Wallshades. Non-graphic sculptural horror: bodies fully fused and wrapped in burial cloth, faces and "
            "hands as smooth shallow relief, no wounds, gore, blood or nudity.")
B06_SUBJ = ("SUBJECT (canon): mid-boss of the Bell Catacombs. Twelve Kneeler choristers fused into one singing organ of flesh, "
            "iron pipes and iron nails; it sings \"HOLD... FAST...\" and the hero must silence its voices one by one. "
            "Non-graphic: the singers are covered adults with intact faces, the nails are fixed into iron only, never into "
            "bodies; no wounds, no blood.")
B07_SUBJ = ("SUBJECT (canon): Act II boss, Brother Cassian the Kneeling Saint: a gaunt old man whose legs have become stone "
            "roots, wearing Latreus's iron halo of inward spikes. He tears himself out of the floor; his command \"KNEEL\" "
            "locks the hero in place. Non-graphic: the halo's short inward teeth stop at a padded inner headband with clear "
            "space from the intact bald skull; no wounds, no blood.")
B07_POSE = ("POSES (user decision for this boss): all five views stand upright and neutral, arms down at the sides with a little "
            "air between arm and body, legs straight, stone feet on the baseline with a few low flat stone roots spreading "
            "along the floor (never tall pillars, never a plinth). 3/4 = the same stance but with a stern forward lean of the "
            "head and shoulders. Draw each figure once: no ghost or double feet.")

D = {
"U06_A": [hdr("U06 Pall-Wight", "A", "Unlaid"), U06_SUBJ,
 "BUILD (Act I recipe): THREE big masses: (1) a heavy undead knight in black armour #1F1D22 with CHUNKY squared slab pauldrons, a short barrel chest, thick gauntlets and big sabatons, a broad flat-topped helm with one narrow eye slit and two dim eye points inside; (2) a flat rectangular blackened wooden coffin on the back, upright from the helm top to the knees, bound by THREE wide iron bands and a visible harness over both shoulders; (3) a split knee-length soot tabard ending in five big clean points. Silver #A8A9AD appears as LARGE nail heads (a few, big) and plate borders. " + MARKS,
 "ACCENT: one small pyre-orange #E2622B cloth knot at the belt, nothing else orange. Black ~60 %, silver ~30 %.",
 "PROPS: left hand a broad coffin-shaped iron shield, right hand a short blunt iron mace; draw both again in a separate WEAPON cell.",
 "SILHOUETTE A: a wide square block, flat-topped helm and the coffin's straight edges rising behind the shoulders.",
 "POSES: 3/4 = an acting pose: braced forward behind the raised shield, mace cocked back ready to bash, heavy knees bent. " + TP + " The coffin stays on the back in every view (edges visible past both shoulders in FRONT, its full lid in BACK).",
 "SIZE: total height to the top of the helm 1.15H in every view (coffin top no higher), coffin length 0.90H; the human silhouette H exactly 1H on the same baseline.",
 "Text: exact title \"U06 PALL-WIGHT — A\" and the labels H, 3/4, WEAPON, LEFT, RIGHT, FRONT, BACK only."],
"U06_B": [hdr("U06 Pall-Wight", "B", "Unlaid"), U06_SUBJ,
 "BUILD (Act I recipe): THREE big masses: (1) a tall, tapered undead knight in black armour #1F1D22 with sloping overlapping shoulder plates, long shin plates, CHUNKY gauntlets and sabatons, a smooth pointed helm with a narrow visor; (2) a tapered six-sided coffin on the back, upright from above the shoulders to mid-calf, crossed by TWO big diagonal iron straps; (3) a long soot coat skirt split into five broad tails. Silver #A8A9AD appears as LARGE nail heads (a few, big) and plate rims. " + MARKS,
 "ACCENT: one small pyre-orange #E2622B cloth knot at the chest strap, nothing else orange. Black ~60 %, silver ~30 %.",
 "PROPS: left hand a round heavy iron shield with a broad rim, right hand a squat flanged mace; draw both again in a separate WEAPON cell.",
 "SILHOUETTE B: a tall narrow spike, pointed helm and the coffin's six-sided head rising behind it; clearly unlike a square block.",
 "POSES: 3/4 = an acting pose: striding forward, round shield swung out in a bash, mace low and back. " + TP + " The coffin stays on the back in every view (edges visible past both shoulders in FRONT, its full lid in BACK).",
 "SIZE: total height to the helm point 1.15H in every view, coffin length 0.90H; the human silhouette H exactly 1H on the same baseline.",
 "Text: exact title \"U06 PALL-WIGHT — B\" and the labels H, 3/4, WEAPON, LEFT, RIGHT, FRONT, BACK only."],
"U08_A": [hdr("U08 Charnel Chanter", "A", "Unlaid"), U08_SUBJ,
 "BUILD (Act I recipe): THREE big masses: (1) a thin skeleton in aged ivory #D8CCB0 with CHUNKY readable bones, big knobbly joints, long oversized bony hands and feet, a long skull with the jaw slightly open as if chanting; (2) a long dark-brown choir robe #4A3526 with a deep squared hood framing the skull and a short shoulder cape, the skirt split by two big side openings that show the bony knees; (3) bare bony forearms coming out of close sleeves at the elbow. " + MARKS,
 "ACCENT: one small candle-gold #D9A441 collar clasp only. Brown ~60 %, ivory bone ~30 %. No staff, no held object, no WEAPON cell.",
 "SILHOUETTE A: a narrow upright column with a deep square hood; reads as a thin brown pillar with pale hands.",
 "POSES: 3/4 = an acting pose: leaning forward from the hips, skull tilted, both bony hands raised in front of the chest with fingers spread as if weaving a spell. " + TP,
 "SIZE: crown 0.95H in every view (hood top no higher); the human silhouette H exactly 1H on the same baseline.",
 "Text: exact title \"U08 CHARNEL CHANTER — A\" and the labels H, 3/4, LEFT, RIGHT, FRONT, BACK only."],
"U08_B": [hdr("U08 Charnel Chanter", "B", "Unlaid"), U08_SUBJ,
 "BUILD (Act I recipe): THREE big masses: (1) a skeleton in aged ivory #D8CCB0 with CHUNKY readable bones, big joints and oversized bony hands, a bare rounded skull, jaw open mid-chant, the ribcage showing through one large opening in the chest; (2) a low, broad bell-shaped dark-brown robe #4A3526 widening from small shoulders to the floor, with a tall folded choir collar behind the skull and huge elbow-length draped sleeves; (3) two long hanging brown scarf panels down the front. No hood and no shoulder cape. " + MARKS,
 "ACCENT: one small candle-gold #D9A441 collar clasp only. Brown ~60 %, ivory bone ~30 %. No staff, no held object, no WEAPON cell.",
 "SILHOUETTE B: a wide bell or cone with a small bare skull on top and big sleeve wings; clearly unlike A's narrow hooded column.",
 "POSES: 3/4 = an acting pose: skull thrown back mid-chant, one bony hand raised high, the other stretched toward the viewer, sleeves swinging. " + TP,
 "SIZE: crown 0.95H in every view (collar top no higher); the human silhouette H exactly 1H on the same baseline.",
 "Text: exact title \"U08 CHARNEL CHANTER — B\" and the labels H, 3/4, LEFT, RIGHT, FRONT, BACK only."],
"U09_A": [hdr("U09 Ossuary-Glutton", "A", "Unlaid"), U09_SUBJ,
 "BUILD (Act I recipe): THREE big masses: (1) a huge pear-shaped grey-brown corpse body #6E6A5C, a very small head sunk between rounded shoulders, long heavy hanging arms with oversized hands, a wide HORIZONTAL belly mouth with big blunt ivory teeth; (2) a sleeveless dark taupe burial shroud with four or five big torn flaps framing the belly; (3) a low cluster of LARGE aged-ivory bones #D8CCB0 (skulls, femurs, a big vertebra ridge behind the hips) fused around the short bowed legs and travelling with it. " + MARKS,
 "ACCENT: one small pyre-orange #E2622B burial-cloth tie at the shoulder only.",
 "SILHOUETTE A: a big upright pear on a bone base, tiny head, arms hanging to the bones.",
 "POSES: 3/4 = an acting pose: lurching forward, belly mouth gaping toward the viewer, both big hands reaching low to scoop. " + TP + " The bone cluster stays fused at the legs in every view.",
 "SIZE: crown 1.00H in every view; the human silhouette H exactly 1H on the same baseline.",
 "Text: exact title \"U09 OSSUARY-GLUTTON — A\" and the labels H, 3/4, LEFT, RIGHT, FRONT, BACK only."],
"U09_B": [hdr("U09 Ossuary-Glutton", "B", "Unlaid"), U09_SUBJ,
 "BUILD (Act I recipe): THREE big masses: (1) a wide top-heavy oblong grey-brown corpse torso #6E6A5C on a high hunched back, the head jutting forward low, thick low arms with oversized hands, a VERTICAL oval belly mouth framed by two big ivory jaw shapes; (2) a diagonal burial mantle over one shoulder ending in four or five big panels; (3) LARGE aged-ivory bones #D8CCB0: a strapped rack of big bones across the upper back, and a bone mass fused high around the anatomical LEFT hip. " + MARKS,
 "ACCENT: one small pyre-orange #E2622B tie on the mantle only.",
 "SILHOUETTE B: a top-heavy hunched box with a bone rack on its back and the head thrust forward; clearly unlike an upright pear.",
 "POSES: 3/4 = an acting pose: hunched charge, head low, belly mouth open, one arm swinging forward. " + TP + " The hip bone mass stays on the anatomical LEFT in every view (image-left in BACK).",
 "SIZE: top of the back hump 1.00H in every view; the human silhouette H exactly 1H on the same baseline.",
 "Text: exact title \"U09 OSSUARY-GLUTTON — B\" and the labels H, 3/4, LEFT, RIGHT, FRONT, BACK only."],
"U10_B": [hdr("U10 Wallshade", "B", "Unlaid"),
 "SUBJECT (canon): a wraith only half freed from the ossuary wall it was mortared into; it passes through walls and drains the hero. Its face is flattened as if pressed against glass (non-graphic).",
 "BUILD (Act I recipe): THREE big masses: (1) a broad, low folded mantle in cold desaturated charcoal over rounded hunched shoulders, semi-translucent so the grey backdrop shows faintly through the lower half; below it the shroud splits into TWO long tapering tails like legs that fade out above the floor; (2) a small bare head with a WIDE face compressed horizontally, two dark eye hollows and a long open mouth, no hood; (3) BIG mortar-grey #A39F93 masses: one wide flat band across the ribs and a heavy mortar cuff on each forearm with two or three solid connected teardrop drips each. Long thin arms with oversized pale hands. " + MARKS,
 "ACCENT: one small dull pyre-orange #E2622B burial tie at the waist. No glow, no halo, no wall, no glass pane.",
 "SILHOUETTE B: a bent crescent: rounded mantle hump and a small head jutting forward over two trailing tails; clearly unlike a tall hooded column.",
 "POSES: 3/4 = an acting pose: lunging low and forward through the air, head first, both mortar-heavy arms swept back. " + TP,
 "SIZE: crown 0.95H in every view; the human silhouette H exactly 1H on the same baseline.",
 "Text: exact title \"U10 WALLSHADE — B\" and the labels H, 3/4, LEFT, RIGHT, FRONT, BACK only."],
"U11_A": [hdr("U11 Scribe-Shade", "A", "Unlaid"), U11_SUBJ,
 "BUILD (Act I recipe): THREE big masses: (1) a narrow stooped ink-black #17151A robe with a long narrow hood ending in a forward point, the lower robe semi-translucent and ending in FIVE long heavy tails that fade above the floor; (2) a pale pressed spectral face inside the hood and thin long forearms with oversized pale hands; (3) two BIG pale warm-grey parchment-coloured lining panels showing at side slits of the robe. " + MARKS,
 "ACCENT: one small candle-gold #D9A441 ferrule on the quill only. Ink-black ~60 %, pale lining ~30 %.",
 "PROP: a long quill (broad single grey feather, straight black shaft) in the anatomical right hand in 3/4, drawn again in a separate WEAPON cell; empty hands in the T-pose views.",
 "SILHOUETTE A: a tall narrow hooked comma, the hood point thrust forward.",
 "POSES: 3/4 = an acting pose: bent over as if writing in the air, quill raised to stab, other hand clawing toward the viewer. " + TP,
 "SIZE: hood top 0.95H in every T-pose view (3/4 may stoop lower); the human silhouette H exactly 1H on the same baseline.",
 "Text: exact title \"U11 SCRIBE-SHADE — A\" and the labels H, 3/4, WEAPON, LEFT, RIGHT, FRONT, BACK only."],
"U11_B": [hdr("U11 Scribe-Shade", "B", "Unlaid"), U11_SUBJ,
 "BUILD (Act I recipe): THREE big masses: (1) an arched, hunched ink-black #17151A body: a long tapered robe, semi-translucent below the knees and fading above the floor, with a short overskirt of five big triangular strips; (2) a rounded bald spectral head tucked low under the arched back, pale pressed face, thin wrists and oversized pale hands out of close sleeves; (3) a wide shallow shoulder yoke of pale warm-grey parchment colour across both shoulders. No hood, no pointed collar. " + MARKS,
 "ACCENT: one small candle-gold #D9A441 ferrule on the quill only. Ink-black ~60 %, pale yoke ~30 %.",
 "PROP: a swept curved grey quill with a broad blunt tip and a long black shaft in the anatomical right hand in 3/4, drawn again in a separate WEAPON cell; empty hands in the T-pose views.",
 "SILHOUETTE B: a hunched arch with a small bald head low in front and a wide pale shoulder bar; clearly unlike a hooded comma.",
 "POSES: 3/4 = an acting pose: crouched low, head craned forward, quill flicked out sideways as if throwing ink. " + TP,
 "SIZE: top of head 0.95H in every T-pose view (3/4 lower); the human silhouette H exactly 1H on the same baseline.",
 "Text: exact title \"U11 SCRIBE-SHADE — B\" and the labels H, 3/4, WEAPON, LEFT, RIGHT, FRONT, BACK only."],
"U12_A": [hdr("U12 The Pressed", "A", "Unlaid"), U12_SUBJ,
 "BUILD (Act I recipe): THREE big masses: (1) a squat rectangular tower torso of clay-flesh brown #8A6A5A built from horizontal stacked brick-like body bundles, a small head recessed between massive squared shoulders, short thick legs; (2) two long, heavy slab-like arms ending in huge hands; (3) five broad bone-ivory #D8CCB0 burial-cloth bands wrapping the rows, with big ivory bone struts bracing the hips. On both flanks, two offset rows of smooth relief faces and hands. " + MARKS,
 "ACCENT: one small pyre-orange #E2622B cloth tie only.",
 "SILHOUETTE A: a tall square tower with a tiny head; reads as a walking block of wall.",
 "POSES: 3/4 = an acting pose: lumbering forward, one huge arm raised to slam down. " + TP,
 "SIZE: crown 1.35H in every T-pose view, FRONT body width without arms about 1.15H; the human silhouette H exactly 1H on the same baseline, so the monster is clearly a third taller than the human.",
 "Text: exact title \"U12 THE PRESSED — A\" and the labels H, 3/4, LEFT, RIGHT, FRONT, BACK only."],
"U12_B": [hdr("U12 The Pressed", "B", "Unlaid"), U12_SUBJ,
 "BUILD (Act I recipe): THREE big masses: (1) an inverted-trapezoid clay-flesh brown #8A6A5A torso, a huge rounded forward shoulder mass and blunt arched back, narrowing to two heavy staggered legs, built of offset brick-like body blocks; (2) two long curved arms with big paddle hands that nearly reach the floor; (3) a pair of tall bone-ivory #D8CCB0 ribs framing the torso vertically, and four big diagonal burial-cloth wraps. On both flanks, staggered vertical columns of smooth relief faces and folded hands. " + MARKS,
 "ACCENT: one small pyre-orange #E2622B cloth tie only.",
 "SILHOUETTE B: a top-heavy hunched wedge with long knuckle-dragging arms; clearly unlike a square tower.",
 "POSES: 3/4 = an acting pose: low forward crawl-charge, knuckles on the floor, shoulders surging. " + TP,
 "SIZE: top of the shoulder hump 1.35H in every T-pose view, FRONT body width without arms about 1.15H; the human silhouette H exactly 1H on the same baseline.",
 "Text: exact title \"U12 THE PRESSED — B\" and the labels H, 3/4, LEFT, RIGHT, FRONT, BACK only."],
"B06_A": [hdr("B06 The Choir of Nails", "A", "Perfection-born, Devotion"), B06_SUBJ,
 "BUILD (Act I recipe): THREE big masses: (1) a stepped pyramid of TWELVE hooded singers in three tiers of four, grey-dead flesh #6E6A5C faces with open singing mouths, ivory hoods and soot robes merging into one body; (2) a central peak of TALL soot-iron organ pipes #5A5F66 rising from the top tier, a few big pale iron nail heads #D8D8DC set in the iron bands; (3) a heavy iron casing at the back with three big panels and broad iron straps. Four long thin arms from the lowest tier with big hands resting forward on the floor. " + MARKS,
 "ACCENT: candle-gold #D9A441 only on the pipe mouths' rims, small. Flesh and soot ~60 %, iron ~30 %.",
 "SILHOUETTE A: a triangular mountain of hoods topped by a spire of pipes; readable as a singing pyramid at thumbnail size.",
 "LAYOUT: two rows on a 3:2 landscape canvas, each row starting with its own H silhouette at the same scale: row 1 = H, 3/4, LEFT, RIGHT; row 2 = H, FRONT, BACK. Static creature: no T-pose. 3/4 = an acting pose: the whole choir leaning forward, every mouth open in a shout, the arms clawing at the floor. LEFT/RIGHT/FRONT/BACK = neutral static stance, arms resting with fingertips clear of cloth. Draw each figure once: no ghost duplicates.",
 "SIZE: height to the pipe tips 2.20H, FRONT width about 2.80H, in every view; the human silhouette H exactly 1H on the same baseline in both rows.",
 "Text: exact title \"B06 CHOIR OF NAILS — A\" and the labels H, 3/4, LEFT, RIGHT, FRONT, BACK only."],
"B06_B": [hdr("B06 The Choir of Nails", "B", "Perfection-born, Devotion"), B06_SUBJ,
 "BUILD (Act I recipe): THREE big masses: (1) a wide low bench of TWELVE kneeling singers in a single curved row, grey-dead flesh #6E6A5C faces with open singing mouths, bone-ivory capes over soot robes, fused at the shoulders; (2) TWO big fans of soot-iron organ pipes #5A5F66 rising from the two ends like wings, a few big pale iron nail heads #D8D8DC in the iron collars; (3) a domed iron bellows hump at the back with broad straps. Hands of the singers rest above the knees with fingertips clear. " + MARKS,
 "ACCENT: candle-gold #D9A441 only on the iron collars' rims, small. Flesh and soot ~60 %, iron ~30 %.",
 "SILHOUETTE B: a wide low crescent with two pipe fans like raised wings; clearly unlike A's pyramid.",
 "LAYOUT: two rows on a 3:2 landscape canvas, each row starting with its own H silhouette at the same scale: row 1 = H, 3/4, LEFT, RIGHT; row 2 = H, FRONT, BACK. Static creature: no T-pose. 3/4 = an acting pose: the pipe fans flaring open, all twelve heads thrown back in song. LEFT/RIGHT/FRONT/BACK = neutral static stance. Draw each figure once: no ghost duplicates.",
 "SIZE: height to the pipe tips 2.20H, FRONT width about 3.00H, in every view; the human silhouette H exactly 1H on the same baseline in both rows.",
 "Text: exact title \"B06 CHOIR OF NAILS — B\" and the labels H, 3/4, LEFT, RIGHT, FRONT, BACK only."],
"B07_A": [hdr("B07 Brother Cassian", "A", "Perfection-born, Devotion"), B07_SUBJ,
 "BUILD (Act I recipe): THREE big masses: (1) a tall, gaunt elderly man with a bald skull, hollow stern cheeks, long thin limbs and oversized bony hands, in a long-sleeved soot-black #17151A robe narrowing to the ankles; (2) a long narrow bone-white #E6DFCF scapular down the front, and a short bone-white nape panel at the back; (3) legs turning into grey stone #7F7F7A below the knees, the robe split at the ankles over stone feet with low flat angular roots. The halo: one compact circular muted-iron ring around the crown with short inward teeth on a padded band, candle-gold #D9A441 edges, no glow. " + MARKS,
 "ACCENT: one small pyre-orange #E2622B cloth tie at the waist only. No green.",
 "SILHOUETTE A: a narrow ascetic column with a round iron halo; reads as a thin black pillar with a white stripe.",
 B07_POSE,
 "SIZE: halo top 1.00H, skull crown about 0.93H, in every view; the human silhouette H exactly 1H on the same baseline.",
 "Text: exact title \"B07 BROTHER CASSIAN — A\" and the labels H, 3/4, LEFT, RIGHT, FRONT, BACK only."],
"B07_B": [hdr("B07 Brother Cassian", "B", "Perfection-born, Devotion"), B07_SUBJ,
 "BUILD (Act I recipe): THREE big masses: (1) a gaunt elderly man with a bald skull, hollow stern cheeks and bare thin forearms with oversized bony hands, under a broad angular cropped soot-black #17151A shoulder cape with a rigid faceted iron yoke; (2) a sleeveless knee-length split black tabard over a long narrow bone-white #E6DFCF under-tunic, two square skirt panels; (3) slender grey stone #7F7F7A shins below the hem and low fan-like flat stone roots. The halo: a polygonal muted-iron ring with inward triangular teeth on a padded band, candle-gold #D9A441 edges, no glow. " + MARKS,
 "ACCENT: one small pyre-orange #E2622B binding at the waist only. No green.",
 "SILHOUETTE B: a wide trapezoid of shoulders tapering to a thin waist and two square panels; clearly unlike A's narrow column.",
 B07_POSE,
 "SIZE: halo top 1.00H, skull crown about 0.93H, in every view; the human silhouette H exactly 1H on the same baseline.",
 "Text: exact title \"B07 BROTHER CASSIAN — B\" and the labels H, 3/4, LEFT, RIGHT, FRONT, BACK only."],
}

for k, lines in D.items():
    (HERE / f"{k}.desc.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
print(len(D), "desc files")
