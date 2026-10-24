# B03 Ember-Pot A — Tripo preparation (2026-10-22)

Concept: `concept.png` = `ashlar/art/act-01/monsters/B03_ember_pot/vA/concept.png` (2170x725, one row: H, 3/4, LEFT,
RIGHT, FRONT, BACK; approved, group `ashlar-chot`). Canon text: `concept.prompt.txt` next to it; checklist row B03 (a swollen
Kiln-Shaman dragging a coal pot the size of an ox cart that re-fires every Hodling nearby; the pot must be smashed first;
optional mini-boss, family Discarded, Act I Flint Delvings).

Split into two assets (ROLLOUT_PLAN): (a) the shaman figure in the humanoid T-pose flow (`views/`, this brief); (b) the pot on its
wheeled cart as a static prop image (`cart/prop_input.png`, prop route). The chain is left out of both (engine or a simple
separate prop later).

## Size (measured on the sheet against the H silhouette, not the drawn guide lines)
- H silhouette 300 px. Figure 376 px from the soles to the top of the brick crown = 1.25 H (hunched; upright it is a little
  taller). Pot about 0.68 H high, cart and pot about 1.3 H long.
- The concept prompt says "shaman crown 0.60H, pot height 0.90H"; the sheet draws the shaman about 2x that. Kept: the drawn
  proportions; the game scale is set later in the lab.

## Silhouette and build
- Swollen, heavy, broad shaman, pot-bellied and wide-hipped, thick limbs, hunched forward under a humped olive cloak in the
  concept (head low between the shoulders). The T-pose straightens the torso (slight forward lean only) and lifts the head
  above the shoulders; the heavy rounded upper back stays.
- Head: wrapped in cream linen, an iron band round the brow, a soot-black face guard over the eyes and nose, the mouth and chin
  wrapped in cream linen; a crown of upright red bricks stuck in the iron band.
- Clothing: thick cream scarf/cowl round the neck falling in a V on the chest; olive-green cloak over the shoulders and back with
  big jagged hem points; long cream linen sleeves; an orange-terracotta front apron/tabard to the knees with jagged points;
  red-brown robe panels at the sides and back; a dark soot-grey underskirt to the shins; cream-wrapped shins and feet, wrapped
  hands.

## Materials and colours
Soot black #17151A (face guard), clay red-brick #9C4A2C and kiln orange #E2622B (crown bricks, apron), pot dark red-brown
#5A2A1E (the cart prop only), olive-green cloak, cream linen (scarf, sleeves, wraps), red-brown robe, dark grey underskirt,
dark iron band.

## Asymmetric details
The chain lies over the LEFT shoulder and the LEFT hand holds it at the chest (removed). The body itself is symmetric.

## Parts Tripo cannot build, and what to do
- Chain: removed (separate prop later). Pot and cart: separate prop asset (`cart/prop_input.png`).
- Ragged cloak, apron and robe hems: a few big thick jagged points hanging straight close to the body.
- Brick crown: ONE fixed shape (seven upright bricks in a ring on the iron band), the same in every view.
- Kiln glow: painted colour only, no glow, no smoke, no embers.

## Hand-held items (NOT in the T-pose)
- The chain (pulled over the left shoulder in the concept).

For T-pose: use the existing design.txt unchanged. Read ashlar/art-direction/artdirection.md; prepend verbatim STYLE CORE (§3.1), T-POSE RULES (§3.6), CONTENT (§3.8) to each filled skill template and save the full prompts next to the sheets (tpose_front_back.prompt.txt, tpose_sides.prompt.txt, *_retry.prompt.txt). Use built-in image_gen only. Self-QA each image against §11 and the concept. Do not run Tripo or spend credits in the image session.
