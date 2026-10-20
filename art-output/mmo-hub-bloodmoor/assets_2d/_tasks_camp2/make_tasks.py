# Writes one Codex CLI task per camp prop sheet (asset_13..asset_24) into this folder.
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = 'E:/Diablo2/art-output/mmo-hub-bloodmoor/assets_2d'

BASE = (
    "Use case: stylized-concept. Production game prop reference sheet, ONE single 16:9 landscape image. "
    "Reference image 1 (approved cart sheet) and reference image 2 (approved tent sheet): match their low-detail broad shapes, "
    "soft simple material shading, clean evenly spaced layout and flat dark-gray #3A3A3A backdrop. "
    "Reference image 3 is material/palette reference only: cold desaturated gray-green Blood Moor survivor camp, dark gray-brown wet wood, "
    "faded gray-brown patched cloth, dull rusty iron, dark mud; warm orange only from actual fire. "
    "Elevated game three-quarter view means looking down about 50-60 degrees. Original designs, grounded dark-fantasy medieval survivor camp "
    "(Diablo II Rogue Encampment mood), no Blizzard assets. "
    "Uniform slightly cool neutral studio lighting from upper left, soft contact shadows only. No micro wood grain, no fabric fibres, "
    "no individual grass blades; clean silhouettes, large masses, flat colours and soft gradients. "
    "No text, letters, numbers, labels, logos, watermarks, grid lines or scenery. Exactly one neutral gray 1.8 m standing human silhouette "
    "at the far left of the first row for scale. "
    "Keep real-world scale consistent between all items, generous gaps, no overlaps, no cropping, every item fully inside the frame. "
    "Each item sits on a small dark mud patch only as big as its footprint. "
)

SHEETS = [
    ("asset_13_tent_set_b", "Subject: MORE CAMP TENTS, same construction language as reference 2. Exactly TWO rows of three, all in elevated game three-quarter view. TOP ROW: (1) long field-hospital tent with one side wall rolled up showing two straw cots inside; (2) round bell tent with one centre pole and stitched patches; (3) lean-to awning stretched from a cart to two poles with crates beneath. BOTTOM ROW: (4) hunter's hide shelter of stretched animal skins over bent saplings with antlers on top; (5) collapsed half-burnt tent, charred poles and torn scorched canvas on the ground; (6) small quartermaster tent with a wooden supply counter and a hanging lantern."),
    ("asset_14_camp_kitchen_set", "Subject: CAMP KITCHEN PROPS. Exactly TWO rows of three, elevated game three-quarter view. TOP: (1) iron cooking pot hanging on a wooden tripod over a small fire; (2) low stone cooking hearth with a flat griddle stone and embers; (3) butcher's block table with cleaver and meat hanging on a hook rail. BOTTOM: (4) wooden drying rack with strips of meat and fish; (5) water barrel with ladle and two wooden buckets; (6) stack of split firewood with an axe stuck in a chopping stump."),
    ("asset_15_storage_set", "Subject: STORAGE AND CARGO PROPS. Exactly TWO rows of four, elevated game three-quarter view. TOP: (1) single wooden crate with iron corners; (2) stack of three crates; (3) barrel lying on its side in a wooden cradle; (4) cluster of upright barrels. BOTTOM: (5) pile of grain sacks; (6) iron-banded strongbox chest; (7) cargo pile covered with a tarp tied with rope; (8) open crate spilling arrows and old swords."),
    ("asset_16_training_weapons_set", "Subject: TRAINING YARD AND WEAPON PROPS. Exactly TWO rows of three, elevated game three-quarter view. TOP: (1) wooden weapon rack with spears, axes and a sword; (2) straw archery butt on a wooden stand with arrows stuck in it; (3) straw training dummy on a post wearing an old dented helmet. BOTTOM: (4) shield rack with three battered round and kite shields; (5) foot-powered grindstone wheel on a wooden frame; (6) small anvil on a stump with tongs and a quench bucket."),
    ("asset_17_drying_crafts_set", "Subject: DRYING LINES AND CRAFT PROPS. Exactly TWO rows of three, elevated game three-quarter view. TOP: (1) laundry line between two poles with faded cloths and a cloak; (2) wooden frame with a stretched animal hide; (3) herb drying rack with bundles of dried plants. BOTTOM: (4) fishing net hung over poles with floats; (5) leatherworker's bench with hides and tools; (6) fletcher's workbench with arrow shafts and a bucket of feathers."),
    ("asset_18_camp_lighting_set", "Subject: CAMP LIGHT SOURCES (the warm points of a cold camp). Exactly TWO rows of three, elevated game three-quarter view; lit items show only a small localised warm orange glow on themselves and the ground right under them, no bloom. TOP: (1) single torch on a tall stake; (2) iron fire-basket brazier on three legs; (3) tall wooden post with a hanging iron lantern. BOTTOM: (4) cluster of melted candles on a flat stone; (5) the same brazier as (2) but cold and unlit, full of grey ash; (6) signal beacon: stacked log pyre in an iron cage on a tall post, burning."),
    ("asset_19_banners_signs_set", "Subject: BANNERS, SIGNS AND MARKERS. Exactly TWO rows of three, elevated game three-quarter view. TOP: (1) tall pole with a ragged faded dark-red camp banner; (2) wooden signpost with three blank arrow boards, absolutely no letters; (3) rope strung between two poles with tattered cloth pennants. BOTTOM: (4) carved wooden totem post topped with an animal skull; (5) alarm bell hung in a small wooden frame; (6) warding pole with ribbons, charms and small bones."),
    ("asset_20_social_seating_set", "Subject: SOCIAL AND SEATING PROPS where players gather. Exactly TWO rows of three, elevated game three-quarter view. TOP: (1) log bench made from a split trunk; (2) three tree-stump stools around a small fire ring; (3) rough plank dining table with two benches, bowls and a jug. BOTTOM: (4) faded woven rug with two cushions on the ground; (5) small barrel used as a dice table with a candle lantern; (6) bedroll with blanket and backpack next to a wooden chest."),
    ("asset_21_shrine_graves_set", "Subject: SHRINE AND TEMPORARY GRAVES, restrained and sad, not gory. Exactly TWO rows of three, elevated game three-quarter view. TOP: (1) small wayside stone shrine with melted candles and dried flowers; (2) fresh mound grave with a wooden marker and a sword stuck in the earth; (3) row of three simple grave mounds with leaning plank markers. BOTTOM: (4) cairn of stacked prayer stones with ribbons; (5) body covered with a cloth on a wooden stretcher; (6) small kneeling altar with a bowl of ash and a generic old holy symbol (no real-world religion)."),
    ("asset_22_animal_pen_set", "Subject: ANIMAL PEN AND FARM PROPS. Exactly TWO rows of three, elevated game three-quarter view. TOP: (1) wicker chicken coop with two thin chickens; (2) small goat pen of woven fence with one goat; (3) wooden feed trough with hay. BOTTOM: (4) haystack with a pitchfork; (5) wooden wheelbarrow with turnips; (6) tethered pack mule with saddle bags beside a hitching post."),
    ("asset_23_ground_clutter_set", "Subject: SMALL GROUND CLUTTER / scatter decals, all lower than knee height. Exactly TWO rows of five, elevated game three-quarter view. TOP: (1) scattered straw; (2) broken crate planks; (3) spilled sack of grain; (4) three arrows stuck in mud; (5) dented helmet and a broken spear. BOTTOM: (6) pile of gnawed animal bones; (7) broken clay pots; (8) muddy footprints with one dropped boot; (9) coil of rope and a bucket lying on its side; (10) small puddle with floating dead leaves."),
    ("asset_24_work_stations_set", "Subject: CRAFT AND SERVICE WORK STATIONS for an MMO hub. Exactly TWO rows of three, elevated game three-quarter view. TOP: (1) carpenter's sawhorse with a log and a two-man saw; (2) alchemist's folding table with flasks, mortar and a small burner; (3) tanning vats: two wooden tubs with hides soaking. BOTTOM: (4) small field forge with bellows and glowing coals; (5) map table under a small canopy with rolled maps, no readable text; (6) cooper's barrel-making station with staves and iron hoops."),
]

TASK = """You are the Codex CLI runtime and you HAVE the built-in image_gen tool. Call image_gen YOURSELF, directly.
NEVER run `codex`, `codex exec`, codex.ps1, scripts/image_gen.py, API keys or any subprocess/agent to generate. No git. Do not touch other files.

Task: ONE camp prop sheet `{name}.png` for {out}/.
The attached reference images are, in order: asset_01_cart_turnaround.png, asset_02_tent_sheet.png, ref_v3_bonfire.png. Pass them to image_gen as references if possible.
1. Call image_gen once with EXACTLY the prompt between the markers.
2. Copy the returned PNG from ~/.codex/generated_images to {out}/{name}.png (never overwrite an existing file; use {name}_v2.png if it exists).
3. Look at it. Only if items are missing, cropped, overlapping, have text, or the style clearly drifts to bright/cartoon, make ONE corrective generation as {name}_v2.png and keep both.
4. Write {out}/_tasks_camp2/{name}.md: source generated_images path, PNG size, item order left to right and top to bottom, honest QA.

=== PROMPT START ===
{prompt}
=== PROMPT END ===
"""

for name, subject in SHEETS:
    with open(os.path.join(HERE, f'{name}.task.txt'), 'w', encoding='utf-8') as f:
        f.write(TASK.format(name=name, out=OUT, prompt=BASE + subject))
with open(os.path.join(HERE, 'list.txt'), 'w') as f:
    f.write('\n'.join(n for n, _ in SHEETS) + '\n')
print(len(SHEETS), 'tasks')
