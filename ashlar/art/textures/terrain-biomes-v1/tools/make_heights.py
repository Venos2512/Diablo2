#!/usr/bin/env python3
"""Height maps for the ASHLAR terrain-biomes-v1 textures, derived from the OpenGL normal maps.

Run:   python -I make_heights.py [--only ID[,ID]] [--sigma 48] [--force] [--biome DIR]
       --biome DIR  another texture folder with the same layout (normal1024/ in, height1024/ out), e.g. ashlar/art/textures/terrain-dungeon-v1; default: the folder above tools/

Inputs (never modified):  normal1024/{id}.png   seamless OpenGL tangent-space normal map (flat = #8080FF)
Outputs:                  height1024/{id}.png   8-bit grayscale, raised = bright, seamless (periodic maths only)

Per texture: decode -> OpenGL slopes (p = dh/dcol, q = dh/drow) -> Frankot-Chellappa integration (periodic FFT, same
functions as prepare_normals.py) -> subtract a periodic gaussian blur (sigma px) so local stones/clumps dominate rather
than tile-wide drift -> robust normalise to a COMMON median: median -> 0.5 (127.5), symmetric spread = the larger of
(median - p0.5) and (p99.5 - median) maps to +-0.5, clipped to 0..255 (so textures do not carry a hidden per-layer height
bias into the blend; skewed textures keep a long tail on one side). Idempotent: the output is rewritten
only when --force is given or the file is missing.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))  # python -I does not put the script dir on sys.path
import prepare_normals as pn  # noqa: E402

BIOME_DIR = Path(__file__).resolve().parent.parent
SIGMA = 48.0
LO_PCT, HI_PCT = 0.5, 99.5


def height_from_normal_rgb(rgb: np.ndarray, sigma: float = SIGMA) -> np.ndarray:
    """uint8 HxWx3 OpenGL normal map -> float32 height in 0..255 (raised = bright), periodic."""
    v = pn.normalize(pn.decode_rgb(rgb[..., :3]))
    p, q = pn.slopes(v)
    h = pn.integrate_slopes(p, q)
    if sigma > 0:
        h = h - pn.gauss(h, sigma)
    lo, med, hi = np.percentile(h, [LO_PCT, 50.0, HI_PCT])
    spread = max(med - lo, hi - med)
    if spread < 1e-12:
        return np.full(h.shape, 127.5, np.float32)
    return (np.clip(0.5 + (h - med) / (2.0 * spread), 0.0, 1.0) * 255.0).astype(np.float32)


def convert(src: Path, dst: Path, sigma: float = SIGMA) -> None:
    rgb = np.asarray(Image.open(src).convert("RGB"))
    h8 = np.rint(height_from_normal_rgb(rgb, sigma)).astype(np.uint8)
    dst.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(h8, "L").save(dst)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="")
    ap.add_argument("--sigma", type=float, default=SIGMA)
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--biome", default="", help="texture folder to work in (default: the folder that contains tools/)")
    a = ap.parse_args()
    only = {s for s in a.only.split(",") if s}
    biome = Path(a.biome).resolve() if a.biome else BIOME_DIR
    srcs = sorted((biome / "normal1024").glob("*.png"))
    n = 0
    for src in srcs:
        if only and src.stem not in only:
            continue
        dst = biome / "height1024" / src.name
        if dst.exists() and not a.force:
            print(f"skip {src.stem} (exists)")
            continue
        convert(src, dst, a.sigma)
        n += 1
        print(f"ok   {src.stem}")
    print(f"{n} written")
    return 0


if __name__ == "__main__":
    sys.exit(main())
