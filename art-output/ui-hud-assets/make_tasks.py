# Writes one Codex CLI task per HUD asset sheet (h1..h5) into this folder.
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = 'E:/Diablo2/art-output/ui-hud-assets'

BASE = (
    "Use case: GAME UI SPRITE SHEET for slicing, ONE 16:9 landscape image. Reference image 1 is the approved gameplay HUD mockup of our original "
    "dark-fantasy isometric ARPG/MMO: match its materials, colours and level of detail exactly, but redraw every element ISOLATED, flat front "
    "orthographic view, no perspective, no game world behind. UI ART DIRECTION 'stone, iron and leather': dark weathered stone, blackened iron "
    "with rivets, worn dark leather, subtle engraving, calm and dark, no glossy gradients, no neon, no sci-fi, no cartoon, no statues or gargoyles, "
    "no angels, no demons. BACKGROUND: perfectly flat uniform pure chroma-key green #00FF00 everywhere around and between the elements, no shadow "
    "cast on the background, no glow on the background, no texture, no vignette. Every element is a separate sprite with a wide green gap (at least "
    "40 px) to every other element, nothing touching, nothing overlapping, laid out in neat rows. Any hole or empty inside of a frame is filled with "
    "the same flat green #00FF00. NO TEXT, no letters, no numbers, no labels, no watermark. Clean crisp edges, no green colour inside the sprites. "
)

SHEETS = [
    ("h1_orbs", "Sheet content: LIFE AND MANA ORBS, split into layers. Row 1: (a) the left life-orb housing: a round blackened iron and stone ring "
     "frame with rivets, its round inside EMPTY (flat green), (b) the right mana-orb housing, mirrored version of the same frame, inside EMPTY green. "
     "Row 2: (c) a perfect circle of glowing deep red liquid seen through glass, filling the whole circle, slight dark swirls, (d) the same circle "
     "in deep blue mana liquid, (e) a circle of dark empty glass interior (very dark smoky grey, almost black) for the drained state, "
     "(f) a glass reflection overlay circle: only soft white highlights and a curved specular streak on dark grey. All four circles the same size, "
     "sized to fit exactly inside the housings."),
    ("h2_bottom_bar", "Sheet content: BOTTOM HUD BAR pieces. Row 1: one long horizontal centre bar panel of carved dark stone with a blackened iron "
     "trim top and bottom, 5:1 wide, its surface plain with subtle engraving, ends cut straight so it can sit between the two orbs. Row 2: "
     "(a) a thin long empty experience-bar trough (dark recessed iron channel), (b) the same length thin glowing pale-gold experience fill strip "
     "alone, (c) a short left end-cap and (d) a short right end-cap of carved stone and iron to close the bar. Row 3: (e) a thin stamina trough and "
     "(f) a thin warm-yellow stamina fill strip."),
    ("h3_slots_buttons", "Sheet content: SLOTS AND BUTTONS. Row 1: (a) a large square mouse-skill slot frame of iron with rivets, inside EMPTY green, "
     "(b) a small square hotkey skill slot frame, inside EMPTY green, (c) a small potion-belt slot frame (rounded iron cup), inside EMPTY green, "
     "(d) a square slot hover highlight: thin warm ember-gold glowing rim only, inside EMPTY green, (e) a square slot 'selected' rim in cold pale "
     "silver, inside EMPTY green. Row 2: six small round menu buttons of iron and stone with simple engraved symbols, no letters: character "
     "(helmet), inventory (bag), skills (open book), quests (scroll), map (compass), system (gear). Row 3: the same six buttons in pressed/hover "
     "state, slightly lit with warm ember light. Row 4: one wide rectangular text button plate (iron frame, leather centre) normal and hover."),
    ("h4_frames_bars", "Sheet content: FRAMES AND BARS. Row 1: (a) a party member frame: small round portrait ring of iron on the left with its "
     "inside EMPTY green, joined to a horizontal bar trough on the right, (b) a monster name plate: wide horizontal iron frame with an empty dark "
     "bar trough, small skull-free iron finials on both ends. Row 2: (c) a long thin red life fill strip, (d) a long thin blue mana fill strip, "
     "(e) a long thin orange-brown champion fill strip, (f) a long thin pale grey shield fill strip, each alone. Row 3: (g) a round minimap "
     "frame ring of iron and stone with a small compass notch at the top, inside EMPTY green, (h) a square minimap frame with iron corner brackets, "
     "inside EMPTY green."),
    ("h5_panels_icons", "Sheet content: PANELS AND ICONS. Row 1: (a) a tooltip panel: dark near-black leather rectangle with thin blackened iron "
     "border and small riveted corners, centre plain dark for text, (b) a chat panel: wide translucent-looking dark smoky rectangle with thin iron "
     "edge, (c) an item ground-label plate: small dark rounded rectangle with a thin grey border. Row 2: eight square knight skill icons painted "
     "like engraved metal plaques lit by warm light: sword slash, shield bash, charging boots, holy fire flame, war cry horn, healing hand, "
     "whirling blade, aura sun. Row 3: four potion icons: small red life potion flask, small blue mana potion flask, purple rejuvenation flask, "
     "a rolled scroll of town portal; and four small status icons: poison drop (green-free, use sickly yellow), burning flame, frozen snowflake, "
     "bleeding drop."),
]

TASK = """You are the Codex CLI runtime and you HAVE the built-in image_gen tool. Call image_gen YOURSELF, directly.
NEVER run `codex`, `codex exec`, codex.ps1, scripts/image_gen.py, API keys or any subprocess/agent to generate. No git. Do not touch other files.

Task: ONE HUD sprite sheet `{name}.png` in {out}/.
Attached reference: 01_hud_gameplay.png (approved HUD look). Pass it to image_gen as reference if possible.
1. Call image_gen once with EXACTLY the prompt between the markers.
2. Copy the returned PNG from ~/.codex/generated_images to {out}/{name}.png (never overwrite; use {name}_v2.png if it exists).
3. Look at it. Only if the background is not flat green, elements touch each other, or there is a game world/text, make ONE corrective generation as {name}_v2.png and keep both.
4. Write {out}/{name}.md: source generated_images path, PNG size, the list of elements in reading order, honest QA.

=== PROMPT START ===
{prompt}
=== PROMPT END ===
"""

for name, subject in SHEETS:
    with open(os.path.join(HERE, f'{name}.task.txt'), 'w', encoding='utf-8') as f:
        f.write(TASK.format(name=name, out=OUT, prompt=BASE + subject))
with open(os.path.join(HERE, 'list.txt'), 'w', newline='\n') as f:
    f.write('\n'.join(n for n, _ in SHEETS) + '\n')
print(len(SHEETS), 'tasks')
