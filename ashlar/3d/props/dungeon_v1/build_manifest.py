#!/usr/bin/env python3
"""Input images (Astra) for the dungeon props to build with Tripo (2026-10-21 request: "làm bản cho môi trường dungeon hầm mộ
và hang động"). Crypt = ASHLAR BIO-08 Bell Catacombs / BIO-04 Old Face (bone #E6DFCF, soot #17151A, verdigris bronze bells,
tallow candles, bone vaults); cave = BIO-06 Flint Delvings (chalk white, black flint, timber props, antler picks).

Tripo lessons (art-output/tripo-models/Agent.md): one object per image, seen from the side / 3-4 view, flat plain
background, no ground slab under the object. Two candidates per prop. Run from the repo root:
  python -I ashlar/art/terrain-biomes-v1/tools/generate_textures.py --manifest ashlar/3d/props/dungeon_v1/manifest.json
Outputs: dungeon_v1/textures/{id}.png.
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
TILES = Path("E:/Diablo2/ashlar/art/terrain-dungeon-v1")
REF = {"crypt": TILES / "style_ref_crypt.png", "cave": TILES / "style_ref_cave.png"}

COMMON = (
    " The attached image only shows our dungeon floor palette and hand-painted low-detail style (approved floor tiles) - "
    "match that subdued palette and painterly style on the object; do not draw any floor tiles. Image for a 3D model "
    "generator: ONE single isolated object, centred, seen from a slightly elevated three-quarter side view (about 20 degrees "
    "above the horizon) so its full height and its top are both readable, the whole object inside the frame with a generous "
    "margin, on a perfectly flat plain light grey #BDBDBD background: no ground plane, no base slab unless described, no cast "
    "shadow, no other objects, no text. Clear readable silhouette, solid chunky shapes (no thin hair-like parts, no floating "
    "bits), hand-painted stylized game prop with soft painted shading and a top light, low detail, matte. Not gory: old dry "
    "bones only, no blood."
)
PROPS = {
    "sarcophagus": ("crypt",
        "A heavy old stone sarcophagus about 2.2 m long, 0.9 m wide and 1 m tall, pale bone-grey limestone with soot-darkened "
        "edges and chipped corners, a simple lid carved with a very simplified worn recumbent figure, the lid pushed slightly "
        "aside leaving a dark gap; chunky and plain, no symbols or letters."),
    "bone_pile": ("crypt",
        "An ossuary heap of old weathered bones about 1.2 m wide and 60 cm tall: five skulls of different sizes, long bones and "
        "a few ribs piled into one compact mound, pale yellowed bone #D8CCB0 with soot-grey painted shadows, chunky simplified "
        "shapes that touch each other (no thin floating ribs)."),
    "broken_column": ("crypt",
        "A broken gothic stone column: a 1.4 m tall fluted column stump with a jagged broken top on a square stepped base, and "
        "two large fallen column drum pieces leaning against the base, pale limestone with soot stains and a little "
        "green-black mould near the bottom."),
    "candle_cluster": ("crypt",
        "A low cluster of about twelve thick church candles of different heights (5 to 30 cm) standing together on a small "
        "worn square stone block about 50 cm wide, thick pale ivory tallow drips running down the candles and pooled over the "
        "stone block, short black wicks, candles NOT lit: no flames, no glow."),
    "fallen_bell": ("crypt",
        "A large old bronze church bell about 1.2 m tall lying tipped over on its side, dark bronze with heavy blue-green "
        "verdigris streaks, a crack running up from the rim, a thick iron crown loop on top; chunky and simple."),
    "crypt_wall": ("crypt",
        "A straight crypt wall module seen from the front at three-quarter: one section of old stone wall 4 m wide, 3 m tall "
        "and 0.6 m thick, built of large pale limestone blocks with soot staining, with two rows of three dark rectangular "
        "burial niches set into its front face; most niches are sealed with cracked stone plates, two open niches show the "
        "ends of an old skull and bones inside; flat plain back, straight vertical left and right ends so modules can stand "
        "side by side, flat top."),
    "stalagmites": ("cave",
        "A cluster of five chalk-white cave stalagmites of different heights (30 cm to 1.6 m) rising from one shared rounded "
        "flowstone base about 1.2 m wide, creamy pale grey-white with soft vertical drip ridges, tips rounded and thick (not "
        "needle-thin)."),
    "mine_timber": ("cave",
        "An old mine timber support frame: two thick rough-hewn wooden posts about 2.6 m tall with one heavy crossbeam resting "
        "on top, wedged with small wooden blocks, dark weathered brown wood with pale chalk dust on the beam, a few iron "
        "spikes; chunky, stands on its own two posts."),
    "flint_boulders": ("cave",
        "A cluster of three large natural chalk boulders (largest about 1.2 m) with black flint nodules embedded in them and "
        "a few loose black flint chunks at their feet, pale grey-white chalk with darker grey weathering in the cracks, "
        "rounded chunky shapes."),
}


def main():
    jobs = []
    for name, (ref_key, subject) in PROPS.items():
        for v in ("a", "b"):
            jobs.append({"id": f"{name}_{v}", "prop": name, "set": ref_key, "prompt": subject + COMMON,
                         "reference": REF[ref_key].as_posix()})
    (HERE / "manifest.json").write_text(json.dumps(jobs, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{len(jobs)} jobs -> {HERE / 'manifest.json'}")


if __name__ == "__main__":
    main()
