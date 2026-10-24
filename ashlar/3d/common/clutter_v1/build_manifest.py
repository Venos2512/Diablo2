#!/usr/bin/env python3
"""Input images (Astra) for small ground-clutter props to build with Tripo (2026-10-21, terrain research: ARPG ground gets
its depth from small 3D clutter next to decals). The lab already has big Tripo props (kit-mossy-rocks, kit-rocks,
kit-moor-rocks, kit-shrubs, kit-dead-trees with fallen logs / branches / roots / a coarse stump); these fill the small,
low-to-the-ground gap.

Tripo lessons (ashlar/pipeline/tripo/Agent.md): one object per image, seen from the side / 3-4 view, flat plain
background, no ground slab under the object. Two candidates per prop. Run from the repo root:
  python -I ashlar/art/textures/terrain-biomes-v1/tools/generate_textures.py --manifest ashlar/3d/common/clutter_v1/manifest.json
Outputs: clutter_v1/textures/{id}.png.
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
REF = Path("E:/Diablo2/ashlar/art/textures/terrain-dark-wood/stylized2_green_ext/style_ref.png")

COMMON = (
    " The attached image only shows our ground palette and hand-painted low-detail style (approved forest loam, grass and "
    "wet mud tiles) - match that dark olive-green Diablo II forest palette and painterly style on the object; do not draw "
    "any ground tiles. Image for a 3D model generator: ONE single isolated object, centred, seen from a slightly elevated "
    "three-quarter side view (about 20 degrees above the horizon) so its full height and its top are both readable, the "
    "whole object inside the frame with a generous margin, on a perfectly flat plain light grey #BDBDBD background: no "
    "ground plane, no base slab, no soil patch, no cast shadow, no other objects, no text. Clear readable silhouette, solid "
    "chunky shapes (no thin hair-like parts, no floating bits), hand-painted stylized game prop with soft painted shading "
    "and a top light, low detail, matte."
)
PROPS = {
    "riverbank_stones": (
        "A natural cluster of six smooth rounded flat river stones of clearly different sizes (largest about 60 cm long, "
        "smallest about 10 cm) nestled together, grey-olive stone with darker wet-looking lower halves, a few soft dull moss "
        "patches on the tops, two or three tiny pebbles touching the cluster."),
    "mushroom_cluster": (
        "A cluster of six small stylized forest mushrooms of different heights (tallest about 25 cm) growing from a short "
        "mossy piece of dead root, dull brown-grey caps with slightly lighter rims, thick pale grey-beige stems, chunky shapes."),
    "mossy_stump": (
        "A small old cut tree stump about 50 cm tall and 60 cm wide with four thick exposed roots spreading low to the sides, "
        "dark weathered grey-brown bark, a soft cap of dull green moss on the cut top, chunky roots that end bluntly."),
}


def main():
    jobs = []
    for name, subject in PROPS.items():
        for v in ("a", "b"):
            jobs.append({"id": f"{name}_{v}", "prop": name, "prompt": subject + COMMON, "reference": REF.as_posix()})
    (HERE / "manifest.json").write_text(json.dumps(jobs, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{len(jobs)} jobs -> {HERE / 'manifest.json'}")


if __name__ == "__main__":
    main()
