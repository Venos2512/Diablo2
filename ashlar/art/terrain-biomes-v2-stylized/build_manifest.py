#!/usr/bin/env python3
"""Stylized, low-detail versions of every ASHLAR biome tile (2026-10-21, user: "các texture biome bị real quá, tôi muốn nó
stylized và ít chi tiết thôi").

The v1 tiles (ashlar/art/terrain-biomes-v1, ashlar/art/terrain-dungeon-v1) came out with a fractal "cauliflower" dab texture
and jagged outlines everywhere, which reads photographic. The approved ASHLAR look is the Dark Wood stylized2 set
(ashlar/art/terrain-dark-wood/stylized2): few big simple shapes, clean soft outlines, soft painterly gradients, calm areas.
style_ref.png = three approved stylized2 tiles (forest loam | shade grass | big-stone path). Each job keeps its v1 subject and
palette and borrows only the stylized2 painting style and detail level.

Usage (repo root):
  python -I ashlar/art/terrain-biomes-v2-stylized/build_manifest.py [--pilot] [--variants a,b]
  python -I ashlar/art/terrain-biomes-v1/tools/generate_textures.py --manifest ashlar/art/terrain-biomes-v2-stylized/manifest.json
Raw outputs: terrain-biomes-v2-stylized/textures/{id}_{variant}.png
"""
import argparse
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
V1 = Path("E:/Diablo2/ashlar/art/terrain-biomes-v1/manifest.json")
DUNGEON = Path("E:/Diablo2/ashlar/art/terrain-dungeon-v1/manifest_selected.json")
PILOT = ["BIO08_nave", "BIO03_flint", "BIO02_meadow", "BIO19_coastal_rock", "BIO15_pyre_ash", "BIO04_ossuary"]

INTRO = (
    "The attached image shows three approved ground tiles of our game (left to right: forest loam, shade grass, big-stone "
    "path). Match ONLY their painting style and their very LOW level of detail: a few large simple shapes with smooth, clean, "
    "softly rounded outlines, soft painterly gradients inside each shape, a handful of broad brush strokes, calm nearly flat "
    "areas between them. Do NOT copy their dark blue-green colours or their layout. Create ONE new square 1:1 seamless "
    "ground tile of this material, in its own palette: "
)
RULES = {
    "a": (
        " Style rules: hand-painted stylized game texture like the reference; no frilly, fractal or cauliflower-like edges; no "
        "lichen-like dab texture, sponge texture or speckle noise anywhere; no tiny pebbles, crumbs or scattered small bits; no "
        "crackle or hairline cracks; no photographic or realistic detail. Stones, slabs, planks or clumps (if any) are big "
        "simple shapes with clean soft edges and simple soft shading inside, like the stones of the reference path."
    ),
    "b": (
        " Style rules: even simpler than the reference: about half as many shapes, larger shapes, mostly flat colour areas "
        "with only soft gradients and a few broad strokes; no frilly, fractal or cauliflower-like edges; no lichen-like dab or "
        "sponge texture, no speckle noise; no small bits, no crackle, no realistic detail. Stones, slabs, planks or clumps (if "
        "any) are big simple shapes with clean soft edges."
    ),
    # pilot (6 tiles): "a" fixed the stone/slab tiles; grass and ash still came out as many small frilly clumps, so "c"
    # spells out how organic masses are painted (big soft blobs and washes like the reference loam and grass).
    "c": (
        " Style rules: paint it the way the reference tiles are painted: big smooth shapes with soft, clean, rounded outlines "
        "and soft gradients, broad brush strokes. Organic masses (grass, moss, ash, soil, snow, sand, ice, salt, mud) are "
        "painted as a few large soft blobs and broad washes with smooth edges, NOT as many small frilly clumps: absolutely no "
        "broccoli-, cauliflower-, lichen- or sponge-like shapes and no fractal edges; no speckle noise, no tiny bits, no "
        "crackle, no realistic detail. Stones, slabs or planks (if any) are big simple shapes with clean soft edges and simple "
        "soft shading, like the stones of the reference path."
    ),
}
GRASS = (" Grass is painted like the reference shade-grass tile: broad soft masses with only a few long simple blade strokes "
         "on top, never a carpet of small leafy clumps.")
COMMON = (
    " Strictly orthographic top-down view of a flat walkable floor, seamless tileable texture (continuous on all four "
    "edges), flat even lighting, no cast shadows, no light gradient, no vignette, no glints or reflections, no perspective, "
    "no text or symbols, nothing large or special touching the edges, even average brightness over the whole tile, irregular "
    "non-grid placement (nothing in rows or a regular pattern), about 3.5 metres of ground in the frame, quiet low-contrast "
    "floor behind combat."
)


def v1_subject(prompt: str) -> str:
    m = re.search(r"Subject: (.*?) Constraints:", prompt, re.S)
    if not m:
        raise SystemExit("v1 prompt without Subject/Constraints")
    return m.group(1).strip()


def dungeon_subject(prompt: str) -> str:
    m = re.search(r"seamless ground tile: (.*?) Strictly orthographic", prompt, re.S)
    if not m:
        raise SystemExit("dungeon prompt without subject")
    return m.group(1).strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pilot", action="store_true", help="only the six pilot tiles")
    ap.add_argument("--variants", default="a,b")
    a = ap.parse_args()
    variants = [v.strip() for v in a.variants.split(",") if v.strip()]
    tiles = [(e["id"], v1_subject(e["prompt"])) for e in json.loads(V1.read_text(encoding="utf-8"))]
    tiles += [(e["id"].rsplit("_", 1)[0], dungeon_subject(e["prompt"])) for e in json.loads(DUNGEON.read_text(encoding="utf-8"))]
    if a.pilot:
        tiles = [t for t in tiles if t[0] in PILOT]
    ref = (HERE / "style_ref.png").as_posix()
    jobs = [{"id": f"{tid}_{v}", "tile": tid, "variant": v, "reference": ref,
             "prompt": INTRO + subject + RULES[v] + (GRASS if "grass" in subject.lower() else "") + COMMON}
            for tid, subject in tiles for v in variants]
    name = "manifest_pilot.json" if a.pilot else "manifest.json"
    (HERE / name).write_text(json.dumps(jobs, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{len(jobs)} jobs -> {HERE / name}")


if __name__ == "__main__":
    main()
