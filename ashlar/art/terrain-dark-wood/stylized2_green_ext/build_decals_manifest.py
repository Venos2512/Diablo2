#!/usr/bin/env python3
"""Ground decal + shore plant atlases in the approved Dark Wood stylized2_green style (2026-10-21, terrain research:
ARPG ground reads rich because of decals/clutter over the blended tiles — leaves, twigs, pebbles, moss, roots, cracks —
and plants at the water's edge). Magenta #FF00FF background = alpha key, like stylized2_green/grass_cards.png.

Two candidates each. Run from the repo root:
  python -I ashlar/art/terrain-biomes-v1/tools/generate_textures.py --manifest ashlar/art/terrain-dark-wood/stylized2_green_ext/decals_manifest.json
Outputs: stylized2_green_ext/textures/{id}.png (the runner writes next to the manifest).
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
GREEN = HERE.parent / "stylized2_green"

COMMON = (
    " Background: perfectly flat pure magenta #FF00FF everywhere outside the objects (it is keyed out to transparency): no "
    "shadow, no gradient, no ground, no texture on the magenta, and no magenta or pink tones inside the objects. Every object "
    "fits fully inside its own cell with a clear magenta margin and never touches the cell border or another object. Style: "
    "hand-painted stylized game art matching the attached reference exactly (same brush style, low detail, large simple "
    "shapes, dark moody olive-green Diablo II forest palette, nothing saturated or bright), flat even lighting from above, no "
    "cast shadows on the background, no text, no labels, no grid lines drawn."
)
JOBS = {
    "decals_ground": (
        GREEN / "dirt_loam.png",
        "The attached image is one of our approved ground tiles: match its palette, values and painterly low-detail style. Create "
        "ONE square 1:1 sprite atlas of 16 GROUND DECALS seen strictly from straight above (orthographic top-down, lying flat on "
        "the ground), arranged in an invisible 4 x 4 grid of equal cells, one decal centred in each cell, each filling about 70 "
        "percent of its cell. Row 1: three different clusters of fallen dry leaves (dull olive, brown and ochre-grey, 5-12 "
        "simple leaf shapes each) and one cluster of a few dark wet leaves. Row 2: two small broken twigs/branch bits, one "
        "tangle of thin dark roots, one scatter of tiny needles and leaf crumbs. Row 3: three different small groups of rounded "
        "grey-olive pebbles (3-8 stones each, soft painted shading inside the stones only), one single flat grey stone. Row 4: "
        "two soft irregular moss patches (dull moss green), one dark dry crack in the ground drawn as a thin branching line on "
        "a tiny bit of dark soil, one dark wet mud splash/stain blob."),
    "shore_plants": (
        GREEN / "grass_cards.png",
        "The attached image is our approved grass-card atlas: match its card style, palette, brush style and layout logic. "
        "Create ONE square 1:1 sprite atlas of 4 WATERSIDE PLANT CARDS seen from the SIDE (like the reference grass clumps, "
        "standing upright, base at the bottom of the cell), arranged in an invisible 2 x 2 grid of equal cells, one plant clump "
        "centred horizontally in each cell with its base on the cell's lower edge area, each about 75 percent of the cell "
        "height. Cell 1: a clump of tall reeds with a few dark brown cattail heads. Cell 2: a clump of tall thin reeds without "
        "heads, slightly leaning. Cell 3: a low clump of broad water-edge grass/sedge. Cell 4: a small clump of horsetail-like "
        "or rush stems. Dull dark olive and grey-green, darker at the base, slightly lighter tips; nothing bright."),
}


def main():
    jobs = []
    for name, (ref, subject) in JOBS.items():
        for v in ("a", "b"):
            jobs.append({"id": f"{name}_{v}", "atlas": name, "prompt": subject + COMMON, "reference": ref.as_posix()})
    (HERE / "decals_manifest.json").write_text(json.dumps(jobs, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{len(jobs)} jobs -> {HERE / 'decals_manifest.json'}")


if __name__ == "__main__":
    main()
