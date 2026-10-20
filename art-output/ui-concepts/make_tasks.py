# Writes one Codex CLI task per UI concept (01..05) into this folder.
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = 'E:/Diablo2/art-output/ui-concepts'

BASE = (
    "Use case: game UI concept, ONE 16:9 landscape image, a full in-game screenshot mockup of an original dark-fantasy isometric ARPG/MMO "
    "(grounded medieval Blood Moor survivor camp, Diablo II Lord-of-Destruction-era mood). Reference image 1 is the approved gameplay "
    "look (camera, cold desaturated grey-green night moor, warm fire pools, low-detail semi-real 3D): keep the game world behind the UI in that look. "
    "Reference image 2 is a camp prop sheet (materials only). "
    "UI ART DIRECTION 'stone, iron and leather': every frame is a physical object of the world, dark weathered stone and blackened iron with rivets, "
    "worn dark leather panels, engraved serif lettering in off-white/grey on dark backgrounds, no flat modern UI, no glossy gradients, no neon, "
    "no sci-fi, no cartoon. The UI is darker and calmer than the gameplay: the frame, not the painting. Life orb red liquid in a glass globe on the left, "
    "mana orb blue on the right. Item names use colour by rarity: white normal, grey low quality, blue magic, yellow rare, green set, "
    "gold-brown unique, orange crafted, red when requirements are not met. Inventory items occupy real grid sizes (1x1 rings, 2x3 armour, 1x4 swords) "
    "with lit, rendered item icons. Text may be short and in English; keep it plausible and sparse, avoid long paragraphs. Original design, no Blizzard "
    "logos, names, or copied layouts beyond the genre conventions. "
)

CONCEPTS = [
    ("01_hud_gameplay", "Screen: MAIN GAMEPLAY HUD. A level 24 knight fighting three zombies on the moor road at night. Bottom bar of carved stone and iron "
     "between the two orbs: 2 mouse-skill slots, 8 hotkey skill slots with engraved icons, a 4-slot potion belt, a thin XP bar. Top-left: small party "
     "frames for 3 other players (portrait, name, red life bar). Top-right: translucent minimap (simple line automap) with camp marker. A monster name "
     "plate at top centre 'Hollowed Fieldhand' with red life bar. One dropped item on the ground with a yellow rare label. A chat box bottom-left, faint."),
    ("02_inventory_character", "Screen: INVENTORY AND CHARACTER EQUIPMENT open over the game. Right half: a leather-and-iron inventory panel with the paper-doll "
     "(silhouette slots for helm, amulet, chest armour, two weapons/shield, gloves, belt, boots, two rings), below it a 10x4 grid bag with items of real sizes, "
     "gold count. Left half: character stats panel (strength, dexterity, vitality, energy, resistances in coloured numbers). A tooltip floating over a ring "
     "showing a blue magic item name and short property lines. The game world dimmed behind."),
    ("03_vendor_stash", "Screen: CAMP VENDOR TRADE + PERSONAL STASH in the survivor camp (blacksmith NPC by the forge visible, dimmed). Left: vendor panel with "
     "tabs Armour / Weapons / Misc on a stone tablet, grid of items for sale. Right: player inventory grid. Bottom: a shared stash chest panel with 4 tab "
     "ribbons. A tooltip comparing two swords side by side (current vs new), gold-brown unique name on one."),
    ("04_skill_tree", "Screen: SKILL TREE for a knight class, full-screen overlay. Three columns carved into a tall weathered stone tablet, each a skill "
     "branch (Combat, Defence, Auras) with round engraved skill sockets connected by iron chains, some lit with a warm ember glow (learned, numbers 1-20), "
     "some dark (locked). A skill-point counter at the top. A tooltip on one skill with short description and next-level values. Leather side tabs."),
    ("05_world_map_quests", "Screen: WORLD MAP + QUEST LOG. Centre: a hand-drawn parchment map of the Blood Moor region pinned on a dark leather board with "
     "iron corners: camp, road, creek, graveyard, a cave entrance, fog-of-war on unexplored parts, waypoint stones marked with a blue rune, a red quest marker. "
     "Right: quest log panel listing Act I quests with wax-seal icons (active, completed, failed), selected quest text short. Left: party/legend strip."),
]

TASK = """You are the Codex CLI runtime and you HAVE the built-in image_gen tool. Call image_gen YOURSELF, directly.
NEVER run `codex`, `codex exec`, codex.ps1, scripts/image_gen.py, API keys or any subprocess/agent to generate. No git. Do not touch other files.

Task: ONE UI concept image `{name}.png` in {out}/.
Attached references in order: v3_01_bonfire_plaza.png (game look), asset_14_camp_kitchen_set.png (materials). Pass them to image_gen as references if possible.
1. Call image_gen once with EXACTLY the prompt between the markers.
2. Copy the returned PNG from ~/.codex/generated_images to {out}/{name}.png (never overwrite; use {name}_v2.png if it exists).
3. Look at it. Only if the screen type is wrong, UI looks flat/modern/sci-fi, or text is badly garbled across most of the UI, make ONE corrective generation as {name}_v2.png and keep both.
4. Write {out}/{name}.md: source generated_images path, PNG size, what is on screen, honest QA (garbled text, layout issues).

=== PROMPT START ===
{prompt}
=== PROMPT END ===
"""

for name, subject in CONCEPTS:
    with open(os.path.join(HERE, f'{name}.task.txt'), 'w', encoding='utf-8') as f:
        f.write(TASK.format(name=name, out=OUT, prompt=BASE + subject))
with open(os.path.join(HERE, 'list.txt'), 'w', newline='\n') as f:
    f.write('\n'.join(n for n, _ in CONCEPTS) + '\n')
print(len(CONCEPTS), 'tasks')
