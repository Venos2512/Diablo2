#!/usr/bin/env python3
"""Input images (Astra) for the 36 Act I environment assets A15.1-A20.6 to build with Tripo (2026-10-21 request: "xong concept
nào ổn thì gen 3d tripo luôn"). Concepts: ashlar/art/act-01-environments-v2 (README_VI.md: ids, proposed sizes, FRONT; the
selected perspective sheet of each group is the identity reference, one cell per object).

Same recipe as dungeon_v1 / clutter_v1 (art-output/tripo-models/Agent.md): ONE Astra image per object, slightly elevated 3/4
view, flat #BDBDBD background, no ground slab, then Smart Mesh from that single image. Prompt = AD §3.1 STYLE CORE + §3.7
ENVIRONMENT RULES + §3.8 CONTENT (copied byte-exact from ashlar/artdirection.md) + the Tripo-input block + the group's
palette / forbidden lines (from the concept prompt) + the object's design (the concept cell text, with the fixes the concept
edits and the user notes made). Candidate "a" for every object; "b" only for objects whose "a" fails QA (--b <obj>...).

  python ashlar/3d/props/act1_extras_v1/build_manifest.py [--b OBJ ...]
  python -I ashlar/art/terrain-biomes-v1/tools/generate_textures.py --manifest ashlar/3d/props/act1_extras_v1/manifest.json
Outputs: <obj>/concept.png (crop of its perspective cell), textures/_refs/<obj>.png (same crop, attached), textures/{id}.png.
"""
import argparse
import json
import re
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
AD = Path("E:/Diablo2/ashlar/artdirection.md")
V2 = Path("E:/Diablo2/ashlar/art/act-01-environments-v2")
REFS = HERE / "textures" / "_refs"

# group -> (selected perspective sheet, prompt holding the cell designs, palette/forbidden source)
SHEETS = {
    "A15": ("A15_lychgate_village_extras/perspective_v2e.png", "A15_perspective_v2.txt"),
    "A16": ("A16_churchyard_extras/perspective_v2e2.png", "A16_perspective_v2.txt"),
    "A17": ("A17_fens_drowned_village_extras/perspective_v2e.png", "A17_perspective_v2.txt"),
    "A18": ("A18_poppy_reach_gentle_house_exterior/perspective_v1e.png", "A18_perspective.txt"),
    "A19": ("A19_gentle_house_interior_props/perspective_v2e.png", "A19_perspective_v2.txt"),
    "A20": ("A20_garden_of_hush_sleepers_harvest/perspective_v1e.png", "A20_perspective.txt"),
}
# A16.3: the v2e3 edit of the A16 sheet (headstone mark repainted as a clean Wedge, nothing crossing it) is the reference
CELL_SHEET = {"A16.3": "A16_churchyard_extras/perspective_v2e3.png"}
# 3x2 grid of the 1536x1024 sheets (title band on top); cell n -> box
COLS = [(6, 510), (522, 1014), (1026, 1530)]
ROWS = [(62, 526), (536, 1008)]

# folder name, and the notes that override the concept cell text (concept edits, user notes, Tripo needs)
OBJECTS = {
    "A15.1": ("A15_1_flint_church", "The bell-cote ends in a plain small stone cap and the far gable apex in a plain square stone "
              "block: NO cross anywhere; the only sign is the small carved Wedge (keystone) in the arch above the door."),
    "A15.2": ("A15_2_forge", "The embers are a small warm amber-orange glow painted on the coals only: no flames, no smoke."),
    "A15.3": ("A15_3_name_board", "The name slates are chunky small plates fixed flat to the board; ribbons hang short and close "
              "to the posts."),
    "A15.4": ("A15_4_bell_frame", "No lantern: the iron hook on the left post is empty. The pull rope is thick and hangs straight "
              "down; no loop."),
    "A15.5": ("A15_5_grave_goods_stall", ""),
    "A15.6": ("A15_6_watch_post", "The fire basket holds a small chunky low flame only: NO smoke wisp. The spears are thick and "
              "stand inside their rack; the horn hangs tight against its post."),
    "A16.1": ("A16_1_yew", "The crown is that of an ancient churchyard YEW, an evergreen conifer: a low, broad, dense dome of "
              "near-black green (#1F2A24 in shadow, #33433A at most on the lit top) built from five or six LARGE smooth masses "
              "with soft drooping lower edges, smooth outline with a few big shallow scallops, no frilly edge, no holes, no "
              "single leaves or needles. Short, massive red-brown fluted trunk and a few thick roots."),
    "A16.2": ("A16_2_gibbet", "Keep the two crows as small solid shapes sitting tight on the arm and the cage top. The chain is "
              "short and thick (a few chunky links). The cage is empty: no body, no bones, no rope, no noose."),
    "A16.3": ("A16_3_jar_candle_grave", "The headstone face is plain weathered stone with at most ONE small shallow carved Wedge "
              "in its upper middle: a keystone-shaped trapezoid, wider at the top than at the bottom, a single closed outline "
              "with no line inside or through it. Nothing on the stone may form or suggest a cross: no vertical or horizontal "
              "stroke, no arrow, no letters; draw the Wedge with a flat bottom edge (a trapezoid, not a triangle). The five jar "
              "candles are unlit."),
    "A16.4": ("A16_4_fresh_grave", "The marker is ONE plain flat plank stake with a rounded top and a small blank slate nailed "
              "flat on its face; nothing sticks out sideways (never a cross). The spade is thick and stuck upright in the earth."),
    "A16.5": ("A16_5_unquiet_grave", "The coffin is empty (only darkness inside). The mortsafe bars are thick iron bars."),
    "A16.6": ("A16_6_sexton_lamp", "The lantern flame is a small warm amber glow inside the glass; no halo, no cast light."),
    "A17.1": ("A17_1_leaning_stones", "No carving, no glow. The short strip of path under the stones is a low flat earth base "
              "that is part of the object, exactly as long as the stones' footprint."),
    "A17.2": ("A17_2_drowned_bell_tower", "Show only the tower itself: its bottom ends in a flat straight horizontal cut at the "
              "waterline with the dark water-stain band just above it; NO water, no water ring. The rook's nest is one big "
              "solid rough mass of sticks fixed on the corner of the cap."),
    "A17.3": ("A17_3_gentle_boat", "The bow lamp is a Perfection light: a steady, perfectly round soft milk-white glow inside a "
              "plain lamp, no flicker, no smoke, no soot, no rays. The canopy linen is one taut seamless clean sheet. The hull "
              "sits level on its flat bottom; NO water. The punting pole lies along the gunwale, touching it."),
    "A17.4": ("A17_4_flooded_supper_table", "The pond-weed is one thick dark strand lying flat over a chair back."),
    "A17.5": ("A17_5_flooded_lace_window", "The two lace curtains hang inside the window opening as thick solid cloth shapes "
              "attached to the frame (big simple holes and scalloped edges), swaying slightly sideways but touching the window "
              "frame; no thin floating cloth. Dark waterline stain band straight across the wall at about 1.2 m."),
    "A17.6": ("A17_6_gentle_dock", "Low jetty: the plank deck is only knee-high (0.6 m) on short round posts that end flat at "
              "the bottom (no water). The lamp on its tall post at the far end is the same Perfection light as the boat: a "
              "steady, perfectly round soft milk-white glow, no flicker, no smoke, no rays. The linen strip is tied tight around "
              "one mooring post; the rope is a flat coil on the deck."),
    "A18.1": ("A18_1_ox_cart", ""),
    "A18.2": ("A18_2_bed_clean_pillow", ""),
    "A18.3": ("A18_3_delvings_mouth", "A free-standing chunk of hillside with the portal in its front face; its base is flat. "
              "The entrance is pitch dark: no light inside."),
    "A18.4": ("A18_4_hospice_range", "The one lit upper window is a steady, even, round warm amber glow (Perfection light); "
              "every other window dark. Perfectly symmetric, no patch, no crack, no stain."),
    "A18.5": ("A18_5_hospice_wall_niche", "The candle glow is steady, even and round, with no soot above it."),
    "A18.6": ("A18_6_hilltop_steps", "Low terrace: its top, where the two flower pots stand, is 2 m high (about the height of a "
              "man); a straight flight of about seven shallow identical clean steps between low smooth parapets; the flowers "
              "are chunky clusters inside their pots."),
    "A19.1": ("A19_1_vase_flowers", "The bouquet is short and compact: a few big simple flower shapes close together above the "
              "vase mouth (no thin loose stems)."),
    "A19.2": ("A19_2_poppy_tea_tray", "Teapot at the left of the tray, the two cups and the dish on the right; everything sits "
              "flat on the tray."),
    "A19.3": ("A19_3_window_chair", "The small round side table stands close beside the chair's left side, touching its arm."),
    "A19.4": ("A19_4_linen_press", "Both doors stand open at about 100 degrees; the folded linen stacks are clean solid blocks."),
    "A19.5": ("A19_5_linen_screen", "The screen has exactly THREE equal panels (never two) standing in a gentle zig-zag; each "
              "panel a pale wooden frame with one taut clean seamless white linen sheet; small round feet."),
    "A19.6": ("A19_6_tall_ward_window", "The candle on the sill burns with a steady, even, round warm glow (Perfection light), no "
              "soot. The wall section is a thick block with flat cut sides."),
    "A20.1": ("A20_1_sleeper_young_woman", None),
    "A20.2": ("A20_2_sleeper_old_man", None),
    "A20.3": ("A20_3_sleeper_fisherman", None),
    "A20.4": ("A20_4_sleeper_farm_woman", None),
    "A20.5": ("A20_5_irrigation_channel", "Build it as a SUNKEN channel, not a raised trough: a flat rectangular slab of dark "
              "earth floor (its top surface flat, its cut sides visible) with a straight narrow trench cut down INTO it along "
              "its length; the trench edges are lined with flat stone slabs flush with the floor surface, the dark still water "
              "lies below the floor surface inside the trench. The small wooden sluice gate stands across the trench at the "
              "FRONT end, its frame and lifting handle rising above the floor. A few thick pale root tendrils hang over one edge "
              "into the trench."),
    "A20.6": ("A20_6_harvest_table", "The poppy bundles hang as compact chunky bunches tied tight to the rail."),
}
SLEEPER_NOTE = ("An adult (clearly grown-up) person asleep, peaceful and serene, fully clothed. The poppy is a small plant on a "
                "short green stem rising from between the closed lips: a plant, not a wound; no blood, no gore, no injury. The "
                "low earth mound and the linen are part of the object; the whole thing lies flat on its own soil base.")

TRIPO = (
    "IMAGE FOR A 3D MODEL GENERATOR (single-image to 3D): ONE single isolated object, centred, seen from a slightly elevated "
    "three-quarter view (about 20 degrees above the horizon, the object turned about 35 degrees) so its full height and its "
    "top are both readable; the whole object inside the frame with a generous margin on every side. Perfectly flat plain "
    "light grey #BDBDBD background: no ground plane, no floor, no base slab unless it is described as part of the object, no "
    "cast shadow, no other objects, no human silhouette, no text, no labels, no guide lines, no frame. Chunky readable "
    "shapes with a clear silhouette; no thin floating bits (no loose hair-thin strands, wisps, smoke or flying particles). "
    "Matte surfaces, soft painted shading with a top light."
)
IDENTITY = (
    "IDENTITY REFERENCE: the attached image is the approved concept of this object (one cell of an approved concept sheet). "
    "Recreate exactly this object: same design, shapes, proportions, materials and colours; do not redesign it. Ignore the "
    "cell number and label text, the flat dark-grey human silhouette, the dashed guide lines and the studio backdrop of the "
    "reference: they are not part of the object."
)


def ad_block(head):
    """First ```text block after the heading `head` in artdirection.md, byte-exact."""
    t = AD.read_text(encoding="utf-8")
    i = t.index(head)
    m = re.search(r"```text\n(.*?)\n```", t[i:], re.S)
    return m.group(1)


def sheet_lines(prompt_name):
    t = (V2 / "prompts" / prompt_name).read_text(encoding="utf-8").splitlines()
    cells = {}
    extra = {}
    for line in t:
        m = re.match(r'CELL (\d) - "([^"]+)" \((A\d\d\.\d); proposed size: (.*?); 1H = 1\.8 m\)\. (.*)', line)
        if m:
            body = re.sub(r"\s*SCALE:.*$", "", m.group(5))
            cells[m.group(3)] = {"cell": int(m.group(1)), "name": m.group(2), "size": m.group(4), "body": body}
        for key in ("PALETTE", "FORBIDDEN"):
            if re.match(key + r"\b[^:]*:", line) and key not in extra:
                extra[key] = line
    return cells, extra


def crop(group, cell, aid):
    sheet = Image.open(V2 / "groups" / CELL_SHEET.get(aid, SHEETS[group][0])).convert("RGB")
    c, r = (cell - 1) % 3, (cell - 1) // 3
    return sheet.crop((COLS[c][0], ROWS[r][0], COLS[c][1], ROWS[r][1]))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--b", nargs="*", default=[], help="objects (folder names) that also get candidate b")
    a = ap.parse_args()
    core = "\n\n".join(ad_block(h) for h in ("### 3.1 STYLE CORE", "### 3.7 MÔI TRƯỜNG", "### 3.8 CONTENT"))
    REFS.mkdir(parents=True, exist_ok=True)
    jobs = []
    for group, (_, prompt_name) in SHEETS.items():
        cells, extra = sheet_lines(prompt_name)
        for aid, c in sorted(cells.items()):
            obj, note = OBJECTS[aid]
            if note is None:
                note = SLEEPER_NOTE
            odir = HERE / obj
            odir.mkdir(exist_ok=True)
            ref = REFS / f"{obj}.png"
            if not ref.exists():
                img = crop(group, c["cell"], aid)
                img.save(ref)
                img.save(odir / "concept.png")
            design = (f'OBJECT: "{c["name"]}" ({aid}), ASHLAR Act I. Real size: {c["size"]}. {c["body"]}'
                      + (f" {note}" if note else ""))
            prompt = "\n\n".join([core, TRIPO, extra["PALETTE"], extra["FORBIDDEN"], IDENTITY, design])
            for v in ["a"] + (["b"] if obj in a.b else []):
                jobs.append({"id": f"{obj}_{v}", "assetId": aid, "object": obj, "group": group, "prompt": prompt,
                             "reference": ref.as_posix()})
    (HERE / "manifest.json").write_text(json.dumps(jobs, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{len(jobs)} jobs -> {HERE / 'manifest.json'}")


if __name__ == "__main__":
    main()
