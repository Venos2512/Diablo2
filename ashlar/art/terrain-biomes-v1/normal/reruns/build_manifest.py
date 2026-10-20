#!/usr/bin/env python3
"""v2 reruns for normal maps that missed their brief in the first batch (QA 2026-10-20).

BIO13_salt_glass: v1 mean tilt 9.9 deg with puffy cloud bumps; the brief is an almost flat, seamless salt-glass surface.
BIO09_ash_snow:   v1 fine fractal pits over the dark stone (busy, noisy); the brief is soft broad pillowy drifts.
BIO08_nave_v2, BIO13_salt_glass_v3: same briefs again because of a raw edge band (see EXTRA).
BIO07/BIO21/BIO22/BIO23 v2-v3: shapes cut at the tile edge; original brief + WRAP sentence (see EXTRA).
Run:  python -I tools/generate_textures.py --manifest normal/reruns/manifest.json
Raw outputs land in normal/reruns/textures/{id}.png; v1 files in normal/textures/ are not touched.
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
NORMAL = HERE.parent
sys.path.insert(0, str(NORMAL))
import build_manifest as bm  # noqa: E402

V2 = {
    "BIO13_salt_glass": (
        "one continuous, almost perfectly flat polished surface, like a slab of polished milky glass: at least 90 "
        "percent of the image is exactly flat #8080FF; only a whisper of very broad, very soft undulation that loosely "
        "follows the largest milky cloud masses, never steeper than about 5 degrees. The milky clouds are INSIDE the "
        "glass and have no relief: no puffy mounds, no bumps, no ridges, no edges, no cracks, no seams, no grain. Very "
        "low strength overall"),
    "BIO09_ash_snow": (
        "soft, broad, smooth relief like gently sculpted clay: the pale snow and ash drifts are smooth rounded pillowy "
        "mounds with long soft slopes; the dark slate exposures are simple smooth shallow hollows between them. Keep "
        "only the big shapes: NOT fractal, NOT noisy, no tiny pits, no speckles, no crumbly edges, no fine detail "
        "inside the dark areas. Gentle, low-to-moderate strength"),
}

# Same brief, fresh generation: the BIO08 v1 and BIO13 v2 raws carry a ~5 px band of raised line-to-line difference
# along their top/bottom edges that the periodic seam fix cannot remove (review round 1, 2026-10-20).
# BIO07/BIO21/BIO22/BIO23 v1: stones or slabs are cut by the tile edge (shapes do not continue across the wrap),
# which no smooth seam correction can hide; these get the WRAP sentence on top of their original brief.
WRAP = (" Wrap continuity matters most: the attached texture already tiles perfectly, so keep its four edges exactly: "
        "every stone, slab, joint or crack that touches the left edge continues into the right edge, and every one that "
        "touches the top edge continues into the bottom edge, with the same relief on both sides; no straight cut, "
        "frame, band or change of detail along any edge.")
# (source id, new id, relief or None = the source's original relief, extra text)
EXTRA = [
    ("BIO08_nave", "BIO08_nave_v2", None, ""),
    ("BIO13_salt_glass", "BIO13_salt_glass_v3", V2["BIO13_salt_glass"], ""),
    ("BIO07_limestone", "BIO07_limestone_v2", None, WRAP),
    ("BIO07_limestone", "BIO07_limestone_v3", None, WRAP),
    ("BIO22_abbey", "BIO22_abbey_v2", None, WRAP),
    ("BIO22_abbey", "BIO22_abbey_v3", None, WRAP),
    # review r2: v2 still had a soft straight slab edge on the horizontal wrap, v3 repeated v1's cut
    ("BIO22_abbey", "BIO22_abbey_v4", None, WRAP),
    ("BIO22_abbey", "BIO22_abbey_v5", None, WRAP),
    ("BIO23_course", "BIO23_course_v2", None, WRAP),
    ("BIO23_course", "BIO23_course_v3", None, WRAP),
    ("BIO21_sunken_floor", "BIO21_sunken_floor_v2", None, WRAP),
]


def main():
    base = json.loads((NORMAL / "manifest.json").read_text(encoding="utf-8"))
    by_id = {j["id"]: j for j in base}
    jobs = [(i, f"{i}_v2", relief, "") for i, relief in V2.items()] + EXTRA
    out = []
    for i, new_id, relief, extra in jobs:
        j = dict(by_id[i])
        material, features, base_relief = bm.R[i]
        j["id"] = new_id
        j["source_id"] = i
        j["prompt"] = bm.TPL.format(material=material, features=features, relief=relief or base_relief) + extra
        out.append(j)
    (HERE / "manifest.json").write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{len(out)} jobs -> {HERE / 'manifest.json'}")


if __name__ == "__main__":
    main()
