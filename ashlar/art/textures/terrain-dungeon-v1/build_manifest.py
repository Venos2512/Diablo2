#!/usr/bin/env python3
"""Dungeon ground tiles for the lab (2026-10-21 request: "làm bản cho môi trường dungeon hầm mộ và hang động").

ASHLAR sources (ashlar/docs/ASHLAR_BIOME_VA_KHU_VUC_VI.md):
  * Crypt / catacomb = BIO-08 Bell Catacombs (bone #E6DFCF + soot #17151A, candle-gold light #D9A441, "vang, chôn, hợp xướng")
    and BIO-04 Old Face (bone and warm wet mortar, vaults, roots; "sinh ra từ trong tường, lạnh, gần").
  * Cave = BIO-06 Flint Delvings (chalk white and black flint, wells, timber props, antler picks, kiln glow #E2622B from cracks).
Existing tiles reused as layers: BIO08_nave, BIO27_vault, BIO04_ossuary, BIO07_limestone (crypt); BIO06_flint_spoil,
BIO19_coastal_rock, BIO12_dark_planks (cave). This batch adds the missing layers: grave dust, damp crypt stone, collapsed
rubble; natural chalk cave floor, wet cave clay, chalk-and-flint rubble, wet flowstone.

Two candidates per tile (_a, _b). Run from the repo root:
  python -I ashlar/art/textures/terrain-biomes-v1/tools/generate_textures.py --manifest ashlar/art/textures/terrain-dungeon-v1/manifest.json
Raw outputs land in terrain-dungeon-v1/textures/{id}.png. style_ref_crypt.png / style_ref_cave.png = three approved BIO tiles.
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent

INTRO = (
    "The attached image is a STYLE REFERENCE: three approved ground tiles of our game ({refs}). Match their hand-painted "
    "brush style, their LOW detail level and their value range exactly, so the new tile sits next to them in one dungeon "
    "floor without looking different. Do not copy their layout. Create ONE new square 1:1 seamless ground tile: "
)
REFS = {
    "crypt": ("style_ref_crypt.png", "left to right: pale cathedral floor slabs, umber bone-and-mortar ossuary floor, dark sooty ossuary stone"),
    "cave": ("style_ref_cave.png", "left to right: chalk and flint quarry spoil, dark weathered rock, pale salt-mine floor"),
}
STYLE = (
    " Strictly orthographic top-down view straight down at the floor, seamless tileable texture (continuous on all four "
    "edges), hand-painted stylized game texture, LOW DETAIL: few large simple painted shapes, broad flat brush strokes, big "
    "calm areas of nearly flat colour, strong simple value grouping, no fine texture, no noise, no photographic detail. Flat "
    "neutral albedo: even lighting, no baked light or cast shadows, no light gradient, no vignette, no glints, no "
    "reflections, no perspective, no text, no symbols, nothing large or special touching the edges, even average brightness "
    "over the whole tile, irregular non-grid placement, about 3.5 metres of floor in the frame. Quiet floor behind combat, "
    "subdued palette; mood lighting (candles, torches) is added in the engine."
)
TILES = {
    "crypt_dust": ("crypt",
        "GRAVE DUST (bụi hầm mộ): packed fine grave dust and pale bone grit lying over an old stone floor, broad soft drifts "
        "of warm pale grey-beige dust (mean about #A99F8B, lights #D8CCB0, darks #6E665A), in a few places the flush edges of "
        "buried floor slabs faintly show through, a handful of tiny flush bone chips; very soft and low contrast, no skulls, "
        "no whole bones, no footprints."),
    "crypt_damp": ("crypt",
        "DAMP CRYPT STONE (đá hầm ẩm): dark wet old floor slabs of soot-dark stone (mean about #33302D, darks #1E1C1B, lights "
        "#4A4540) with narrow dark joints, broad soft darker seepage stains, a few muted green-black mould blooms #2B3326 "
        "creeping out of the joints, faint chalky white mineral rims on two or three stains #8E887C; no puddles, no standing "
        "water, no reflections, no highlights."),
    "crypt_rubble": ("crypt",
        "COLLAPSED RUBBLE (đá vụn sập): fallen masonry rubble lying on a dusty crypt floor, about a dozen chunky broken pieces "
        "of pale bone-grey limestone slab (#CFC4AE faces, soot-grey #4A4540 broken edges) and smaller angular stone chips of "
        "clearly mixed sizes, grey-beige dust #8E8574 between them; chunky simple shapes, flat albedo without cast shadows, "
        "no dense small gravel."),
    "cave_floor": ("cave",
        "NATURAL CHALK CAVE FLOOR (nền hang phấn): smooth water-worn natural cave rock floor of pale grey-white chalk (mean "
        "about #BDBAB0, lights #DEDBD2, darks #85837D), broad soft undulating rock planes with rounded edges, a few flush black "
        "flint nodules #2B2C2E embedded in the chalk, soft grey drip-worn hollows; natural rock only, no cut blocks, no tiles, "
        "no mortar joints."),
    "cave_clay": ("cave",
        "WET CAVE CLAY (bùn sét hang): smooth wet grey chalk clay mud floor, mean about #6A6862 with lighter drier crust "
        "edges #96938A and darker wet hollows #4A4844, broad smooth shapes and a few soft shallow drag marks; no puddles, no "
        "standing water, no reflections, no highlights."),
    "cave_rubble": ("cave",
        "CHALK AND FLINT RUBBLE (đá vụn hang): fallen pale chalk lumps and sharp black flint shards scattered over grey cave "
        "dust, chunky angular chalk pieces #D2CEC2 of clearly mixed sizes, matte black flint chips #242528, grey dust #8C8981 "
        "between them; chunky simple shapes, flat albedo without cast shadows, no dense fine gravel."),
    "cave_flowstone": ("cave",
        "WET FLOWSTONE (đá chảy calcite): creamy calcite flowstone floor next to underground water, smooth rounded terraced "
        "rims of small dry rimstone pools drawn as broad flat painted shapes, cream #D3CAB3 and pale ochre-grey #ADA38D, faint "
        "teal-grey mineral stains #6F8784 in the hollows; no standing water, no reflections."),
}


def main():
    jobs = []
    for tile, (ref_key, subject) in TILES.items():
        ref_file, ref_desc = REFS[ref_key]
        for v in ("a", "b"):
            jobs.append({"id": f"{tile}_{v}", "tile": tile, "set": ref_key,
                         "prompt": INTRO.format(refs=ref_desc) + subject + STYLE, "reference": (HERE / ref_file).as_posix()})
    (HERE / "manifest.json").write_text(json.dumps(jobs, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{len(jobs)} jobs -> {HERE / 'manifest.json'}")


if __name__ == "__main__":
    main()
