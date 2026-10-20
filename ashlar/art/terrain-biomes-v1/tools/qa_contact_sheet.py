#!/usr/bin/env python3
"""QA contact sheets for terrain-biomes-v1 textures (review aid only).

Pillow is used here solely to composite/measure already-generated bitmaps.
Per texture: dimensions + opposite-edge mean difference + a 2x2 tiled thumbnail.
The edge metrics are hints for a human reviewer; they do NOT certify seamlessness.

Writes qa/contact_sheet_NN.png (<=12 textures each) and qa/qa.json.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageStat

BIOME_DIR = Path(__file__).resolve().parent.parent
NOTE = ("Edge metrics are mean absolute RGB differences (0-255) between opposite 1px edges, plus the "
        "same measure between adjacent interior pixel lines as a baseline. They do NOT certify "
        "seamlessness; a human must inspect the 2x2 tiles.")


def _mean(img: Image.Image) -> float:
    s = ImageStat.Stat(img).mean
    return float(sum(s) / len(s))


def metrics(path: Path) -> dict:
    with Image.open(path) as im:
        info = {"width": im.width, "height": im.height, "mode": im.mode, "format": im.format}
        rgb = im.convert("RGB")
    w, h = rgb.size
    lr = _mean(ImageChops.difference(rgb.crop((0, 0, 1, h)), rgb.crop((w - 1, 0, w, h)))) if w > 1 else None
    tb = _mean(ImageChops.difference(rgb.crop((0, 0, w, 1)), rgb.crop((0, h - 1, w, h)))) if h > 1 else None
    base_x = _mean(ImageChops.difference(rgb.crop((0, 0, w - 1, h)), rgb.crop((1, 0, w, h)))) if w > 1 else None
    base_y = _mean(ImageChops.difference(rgb.crop((0, 0, w, h - 1)), rgb.crop((0, 1, w, h)))) if h > 1 else None
    info.update(
        edge_diff_lr=None if lr is None else round(lr, 3),
        edge_diff_tb=None if tb is None else round(tb, 3),
        adjacent_diff_x=None if base_x is None else round(base_x, 3),
        adjacent_diff_y=None if base_y is None else round(base_y, 3),
        edge_vs_adjacent_lr=None if not base_x else round(lr / base_x, 2),
        edge_vs_adjacent_tb=None if not base_y else round(tb / base_y, 2),
        square=im.width == im.height,
    )
    return info


def tile_2x2(path: Path, cell: int) -> Image.Image:
    with Image.open(path) as im:
        rgb = im.convert("RGB")
    w, h = rgb.size
    big = Image.new("RGB", (w * 2, h * 2))
    for x in (0, w):
        for y in (0, h):
            big.paste(rgb, (x, y))
    return big.resize((cell, cell), Image.LANCZOS)


def load_font(size: int):
    for name in ("segoeui.ttf", "arial.ttf", "DejaVuSans.ttf"):
        for base in ("C:/Windows/Fonts", "/usr/share/fonts/truetype/dejavu"):
            p = Path(base) / name
            if p.exists():
                return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()


def load_jobs(manifest: Path) -> list[dict]:
    data = json.loads(manifest.read_text(encoding="utf-8-sig"))
    return [d for d in data if isinstance(d, dict) and d.get("id")]


def make_sheet(entries: list[dict], out: Path, cols: int, cell: int, title: str):
    pad, label_h, head_h = 12, 64, 36
    rows = (len(entries) + cols - 1) // cols
    W = pad + cols * (cell + pad)
    H = head_h + rows * (cell + label_h + pad) + pad
    sheet = Image.new("RGB", (W, H), (24, 24, 26))
    d = ImageDraw.Draw(sheet)
    f_big, f_small = load_font(18), load_font(13)
    d.text((pad, 8), title, fill=(230, 230, 230), font=f_big)
    for i, e in enumerate(entries):
        r, c = divmod(i, cols)
        x = pad + c * (cell + pad)
        y = head_h + r * (cell + label_h + pad)
        sheet.paste(tile_2x2(Path(e["_path"]), cell), (x, y))
        m = e["metrics"]
        d.text((x, y + cell + 3), f'{e["id"]}  {e.get("name_vi", "")}'.strip(), fill=(240, 240, 240), font=f_small)
        d.text((x, y + cell + 21), f'{m["width"]}x{m["height"]}  {m["mode"]}', fill=(190, 190, 190), font=f_small)
        d.text((x, y + cell + 39),
               f'edge L-R {m["edge_diff_lr"]} T-B {m["edge_diff_tb"]}  (adj {m["adjacent_diff_x"]}/{m["adjacent_diff_y"]})',
               fill=(190, 190, 150), font=f_small)
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--manifest", default=str(BIOME_DIR / "manifest.json"))
    ap.add_argument("--textures", default=None, help="default <manifest dir>/textures")
    ap.add_argument("--out", default=None, help="default <manifest dir>/qa")
    ap.add_argument("--group-size", type=int, default=12, help="textures per sheet (max 12)")
    ap.add_argument("--cols", type=int, default=4)
    ap.add_argument("--cell", type=int, default=320, help="px of each 2x2-tiled thumbnail")
    ap.add_argument("--only", action="append", default=[])
    a = ap.parse_args(argv)

    manifest = Path(a.manifest).resolve()
    tex_dir = Path(a.textures) if a.textures else manifest.parent / "textures"
    out = Path(a.out) if a.out else manifest.parent / "qa"
    group = max(1, min(12, a.group_size))
    only = {x.strip() for o in a.only for x in o.split(",") if x.strip()}

    entries, missing = [], []
    for j in load_jobs(manifest):
        if only and j["id"] not in only:
            continue
        p = tex_dir / f'{j["id"]}.png'
        if not p.is_file():
            missing.append(j["id"])
            continue
        try:
            m = metrics(p)
        except Exception as e:  # unreadable bitmap -> report, keep going
            entries.append({"id": j["id"], "error": repr(e), "path": str(p)})
            continue
        entries.append({"id": j["id"], "biome_id": j.get("biome_id", ""), "name_vi": j.get("name_vi", ""),
                        "material": j.get("material", ""), "path": str(p), "_path": str(p), "metrics": m})

    good = [e for e in entries if "metrics" in e]
    sheets = []
    for n in range(0, len(good), group):
        chunk = good[n:n + group]
        name = f"contact_sheet_{n // group + 1:02d}.png"
        make_sheet(chunk, out / name, min(a.cols, len(chunk)), a.cell,
                   f"terrain-biomes-v1  sheet {n // group + 1}  (2x2 tiled; seams are for human review)")
        sheets.append({"file": name, "ids": [e["id"] for e in chunk]})

    report = {
        "generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "note": NOTE, "sheets": sheets, "missing": missing,
        "textures": [{k: v for k, v in e.items() if k != "_path"} for e in entries],
    }
    out.mkdir(parents=True, exist_ok=True)
    (out / "qa.json").write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"{len(good)} textures, {len(sheets)} sheets, {len(missing)} missing -> {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
