#!/usr/bin/env python3
"""Extra Dark Wood ground tiles in the approved stylized2_green style (2026-10-20 request: "cỏ - đất - cỏ dày - cỏ thưa -
đất ẩm gần nước - vũng nước - nước"). The existing set has dirt_loam, grass_shade, mud_wet; this batch adds dense grass,
sparse grass, damp bank soil and a water surface (puddles stay procedural: water level in the damp/mud hollows).

Two candidates per tile (_a, _b). Run from the repo root:
  python -I ashlar/art/textures/terrain-biomes-v1/tools/generate_textures.py --manifest ashlar/art/textures/terrain-dark-wood/stylized2_green_ext/manifest.json
Raw outputs land in stylized2_green_ext/textures/{id}.png. style_ref.png = the approved dirt | grass | wet mud tiles.
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent

INTRO = (
    "The attached image is a STYLE REFERENCE: three approved ground tiles of our game (left to right: forest loam, shade "
    "grass, wet mud). Match their hand-painted brush style, their LOW detail level, their value range and their dark "
    "olive-green palette exactly, so the new tile sits next to them in one terrain without looking different. Do not copy "
    "their layout. Create ONE new square 1:1 ground tile: "
)
STYLE = (
    " Strictly orthographic top-down view straight down at the ground, seamless tileable texture (continuous on all four "
    "edges), hand-painted stylized game texture, LOW DETAIL: very few, large, simple painted shapes, broad flat brush "
    "strokes, big calm areas of nearly flat colour, strong simple value grouping, no small scattered bits, no fine texture, "
    "no noise, no photographic detail, like simple hand-painted mobile/MOBA ground textures in a dark moody palette, flat "
    "even lighting, no cast shadows, no light gradient, no vignette, no perspective, no text, nothing large or special "
    "touching the edges, even average brightness over the whole tile, irregular non-grid placement (nothing arranged in "
    "rows or a regular pattern), about 3.5 metres of ground in the frame."
)
TILES = {
    "grass_dense": (
        "DENSE GRASS (cỏ dày): lush dark forest grass seen from above, the whole tile covered by large overlapping soft grass "
        "masses with only a few big simple blade strokes on top, almost NO soil showing (at most one or two tiny dark gaps), "
        "slightly deeper and richer green than the reference grass: mean about #34452A, darks #22301E, lights #4E5C3A; "
        "nothing yellow, nothing bright."),
    "grass_sparse": (
        "SPARSE GRASS (cỏ thưa): a few small-to-medium soft grass clumps of very different sizes scattered irregularly over the "
        "dark forest loam of the reference, grass covers only about 35 percent of the tile and bare loam about 65 percent; "
        "grass colour like the reference grass (mean #3C4830, lights #4B543A), loam like the reference loam (mean #34392B, "
        "darks #2C3023); clump edges soft, no single blades scattered everywhere."),
    "soil_damp": (
        "DAMP BANK SOIL near water (đất ẩm gần nước): dark moist soil, darker and smoother than the reference loam, mean about "
        "#2A3024, darks #1E241A, lights #384030; two or three large soft slightly darker wet patches with only a faint soft "
        "sheen (no bright highlights, no puddles, no reflections, no standing water), a few flat dull olive moss smears "
        "#3A4430 and very few small rounded pebbles; calm, low contrast."),
    "water_surface": (
        "WATER SURFACE (nước): calm murky forest pond water seen straight from above, dark green-black water, mean about "
        "#1C2420, with large soft slightly lighter ripple shapes and a few broad gentle light streaks in dull grey-green "
        "#34403A; NO reflections of trees, sky or objects, no foam, no leaves, no shore, no stones, no fish - only the water "
        "surface; very low contrast, painted like the reference tiles."),
}


def main():
    ref = (HERE / "style_ref.png").as_posix()
    jobs = []
    for tile, subject in TILES.items():
        for v in ("a", "b"):
            jobs.append({"id": f"{tile}_{v}", "tile": tile, "prompt": INTRO + subject + STYLE, "reference": ref})
    (HERE / "manifest.json").write_text(json.dumps(jobs, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{len(jobs)} jobs -> {HERE / 'manifest.json'}")


if __name__ == "__main__":
    main()
