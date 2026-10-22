#!/usr/bin/env python3
"""Dungeon ground-decal atlases (crypt, cave) in the approved ASHLAR tile style (2026-10-21). Same format as the Dark Wood
decal atlas (ashlar/art/terrain-dark-wood/stylized2_green_ext): 4 x 4 cells, magenta #FF00FF background = alpha key.

Two candidates each. Run from the repo root:
  python -I ashlar/art/terrain-biomes-v1/tools/generate_textures.py --manifest ashlar/art/terrain-dungeon-v1/decals_manifest.json
Outputs: terrain-dungeon-v1/textures/{id}.png.
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent

COMMON = (
    " Background: perfectly flat pure magenta #FF00FF everywhere outside the objects (it is keyed out to transparency): no "
    "shadow, no gradient, no floor, no texture on the magenta, and no magenta or pink tones inside the objects. Every object "
    "fits fully inside its own cell with a clear magenta margin and never touches the cell border or another object. Style: "
    "hand-painted stylized game art matching the attached reference tiles exactly (same brush style, low detail, large "
    "simple shapes, subdued dungeon palette, nothing saturated or bright), flat even lighting from above, no cast shadows on "
    "the background, no text, no labels, no grid lines drawn. Not gory: old dry bones only, no blood, no flesh."
)
JOBS = {
    "decals_crypt": (
        "style_ref_crypt.png",
        "The attached image shows three approved crypt floor tiles: match their palette (bone #E6DFCF, soot #17151A, warm "
        "greys), values and painterly low-detail style. Create ONE square 1:1 sprite atlas of 16 FLOOR DECALS seen strictly "
        "from straight above (orthographic top-down, lying flat on the floor), arranged in an invisible 4 x 4 grid of equal "
        "cells, one decal centred in each cell, each filling about 70 percent of its cell. Row 1: one old weathered skull "
        "lying on its side, two crossed long bones, a small scatter of ribs, a few vertebrae and small bone bits (old yellowed "
        "bone, soot-grey in the hollows). Row 2: three different pools of spilled pale candle tallow with one or two "
        "burnt-down candle stubs each (flat wax drips, unlit, no flame), one dark soot burn mark. Row 3: three different "
        "dark branching cracks drawn on a small irregular bit of grey stone, one small group of broken stone chips. Row 4: "
        "one soft drift of grey dust, one coil of old rusty iron chain lying flat, one torn scrap of dirty grey linen shroud, "
        "one dark old water stain."),
    "decals_cave": (
        "style_ref_cave.png",
        "The attached image shows three approved cave and mine floor tiles: match their palette (chalk white, flint black, "
        "cool greys), values and painterly low-detail style. Create ONE square 1:1 sprite atlas of 16 FLOOR DECALS seen "
        "strictly from straight above (orthographic top-down, lying flat on the floor), arranged in an invisible 4 x 4 grid "
        "of equal cells, one decal centred in each cell, each filling about 70 percent of its cell. Row 1: three different "
        "groups of sharp black flint shards, one old antler pick (a mining tool made of a deer antler) lying flat. Row 2: "
        "three different scatters of pale chalk lumps and chips, one patch of white mineral crust. Row 3: two dark wet seep "
        "stains, one ring-shaped drip stain under a stalactite (soft concentric rings), one thin dark crack. Row 4: two soft "
        "dull grey-green cave lichen patches, one smudge of black charcoal and grey ash, one scatter of broken pale timber "
        "splinters."),
}


def main():
    jobs = []
    for name, (ref, subject) in JOBS.items():
        for v in ("a", "b"):
            jobs.append({"id": f"{name}_{v}", "atlas": name, "prompt": subject + COMMON, "reference": (HERE / ref).as_posix()})
    (HERE / "decals_manifest.json").write_text(json.dumps(jobs, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{len(jobs)} jobs -> {HERE / 'decals_manifest.json'}")


if __name__ == "__main__":
    main()
