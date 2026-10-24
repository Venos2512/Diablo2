"""Layout/scale guide images for Codex item concept sheets.

python make_item_templates.py SPEC.json --out PATH_WITHOUT_EXT
python make_item_templates.py --all DIR      (every *.template.json in DIR)
"""
import argparse
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

BG, GRID, EDGE = (141, 137, 131), (120, 116, 110), (95, 92, 88)
TEXT, CNT = (40, 36, 32), (205, 200, 192)
MARGIN, TOP, BOTTOM = 40, 110, 110  # side margin, title zone, label zone


def font(size):
    for p in ("C:/Windows/Fonts/georgiab.ttf", "C:/Windows/Fonts/georgia.ttf"):
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            pass
    return ImageFont.load_default()


def layout(spec):
    """Return facts dict (no drawing)."""
    W, H = spec["canvas"]
    items = spec["items"]
    n = len(items)
    sw = sum(i["w"] for i in items)
    mh = max(i["h"] for i in items)
    cell = spec.get("cell", 118)
    # shrink so row fits with gaps of at least half a cell, and height fits
    fit_w = (W - 2 * MARGIN) // (sw + 0.5 * (n - 1)) if n > 1 else (W - 2 * MARGIN) // sw
    fit_h = (H - TOP - BOTTOM) // mh
    cell = int(min(cell, fit_w, fit_h))
    gap = (W - 2 * MARGIN - sw * cell) / (n - 1) if n > 1 else 0
    gap = int(min(max(gap, cell // 2), cell))  # spread up to one cell
    total = sw * cell + gap * (n - 1)
    x = (W - total) // 2
    base = H - BOTTOM
    out = []
    for it in items:
        pw, ph = it["w"] * cell, it["h"] * cell
        out.append({"label": it["label"], "cells": [it["w"], it["h"]],
                    "rect": [x, base - ph, x + pw, base],
                    "label_pos": [x + pw // 2, base + 10]})
        x += pw + gap
    return {"canvas": [W, H], "cell": cell, "gap": gap, "baseline": base,
            "title": spec.get("title", ""), "items": out}


def draw(facts):
    W, H = facts["canvas"]
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    d.text((W // 2, 50), facts["title"], fill=TEXT, font=font(34), anchor="mm")
    c = facts["cell"]
    for it in facts["items"]:
        x0, y0, x1, y1 = it["rect"]
        for gx in range(x0 + c, x1, c):
            d.line([(gx, y0), (gx, y1)], fill=GRID, width=1)
        for gy in range(y0 + c, y1, c):
            d.line([(x0, gy), (x1, gy)], fill=GRID, width=1)
        d.rectangle([x0, y0, x1, y1], outline=EDGE, width=2)
        d.text((x0 + 6, y0 + 4), "%d\u00d7%d" % tuple(it["cells"]), fill=CNT, font=font(16))
        lab, f22 = it["label"], font(22)
        if d.textlength(lab, font=f22) > (x1 - x0) + facts["gap"] - 12 and " " in lab:
            words = lab.split(" ")  # too wide for its slot: wrap near the middle
            k = min(range(1, len(words)), key=lambda i: abs(len(" ".join(words[:i])) - len(" ".join(words[i:]))))
            lab = " ".join(words[:k]) + chr(10) + " ".join(words[k:])
        d.multiline_text(tuple(it["label_pos"]), lab, fill=TEXT, font=f22, anchor="ma", align="center")
    return img


def build(spec_path, out):
    spec = json.loads(Path(spec_path).read_text(encoding="utf-8"))
    facts = layout(spec)
    out = Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    draw(facts).save(out.with_suffix(".png"))
    out.with_suffix(".json").write_text(json.dumps(facts, indent=1, ensure_ascii=False), encoding="utf-8")
    return facts


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("spec", nargs="?")
    ap.add_argument("--out")
    ap.add_argument("--all")
    a = ap.parse_args()
    if a.all:
        for p in sorted(Path(a.all).glob("*.template.json")):
            f = build(p, p.with_name(p.name[:-len(".template.json")]))
            print(p.name, "cell", f["cell"])
    elif a.spec and a.out:
        print("cell", build(a.spec, a.out)["cell"])
    else:
        ap.error("need SPEC --out PATH, or --all DIR")


if __name__ == "__main__":
    sys.exit(main())
