"""Compose review strips / GIFs from qa_render.py frames (python -I, Pillow).

  python -I qa_compose.py strip <frames_dir> <out_dir> <clip> <fps> <events_json_or_-> [views]
  python -I qa_compose.py gif <frames_dir> <out_gif> <clip> <view> <fps>
"""
import glob
import json
import os
import re
import sys

from PIL import Image, ImageDraw, ImageFont


def load_frames(d, clip, view):
    fs = sorted(glob.glob(os.path.join(d, f"{clip}_{view}_*.png")))
    return [(int(re.search(r"_(\d+)\.png$", f).group(1)), f) for f in fs]


def font(sz):
    for p in (r"C:\Windows\Fonts\segoeui.ttf", r"C:\Windows\Fonts\arial.ttf"):
        if os.path.exists(p):
            return ImageFont.truetype(p, sz)
    return ImageFont.load_default()


def crop_box(im):
    return im


def strip(d, outdir, clip, fps, label_extra, views):
    os.makedirs(outdir, exist_ok=True)
    rows = []
    for v in views:
        fr = load_frames(d, clip, v)
        if fr:
            rows.append((v, fr))
    if not rows:
        raise SystemExit("no frames")
    ncol = max(len(r[1]) for r in rows)
    first = Image.open(rows[0][1][0][1])
    w, h = first.size
    cols_per_row = 5
    n = len(rows[0][1])
    # two lines per view if many frames
    blocks = []
    for v, fr in rows:
        for start in range(0, len(fr), cols_per_row):
            blocks.append((v, fr[start:start + cols_per_row]))
    W = cols_per_row * w
    H = len(blocks) * (h + 22) + 40
    img = Image.new("RGB", (W, H), (30, 30, 34))
    dr = ImageDraw.Draw(img)
    f1, f2 = font(20), font(15)
    dr.text((8, 8), f"D01_hodling  {clip}  (R6 review strip, UNAPPROVED)  {label_extra}", fill=(235, 235, 235), font=f1)
    y = 40
    for v, fr in blocks:
        for i, (fn, p) in enumerate(fr):
            im = Image.open(p).convert("RGB")
            img.paste(im, (i * w, y + 20))
            t = (fn - 1) / fps
            dr.text((i * w + 6, y + 2), f"{v}  f{fn}  {t:.3f}s", fill=(200, 220, 255), font=f2)
        y += h + 22
    out = os.path.join(outdir, f"R7_{clip}_strip.jpg")
    img.save(out, quality=88)
    print(out, img.size)


def gif(d, out, clip, view, fps):
    fr = load_frames(d, clip, view)
    ims = [Image.open(p).convert("P", palette=Image.ADAPTIVE, colors=128) for _, p in fr]
    dur = int(round(1000.0 / fps))
    ims[0].save(out, save_all=True, append_images=ims[1:], duration=dur, loop=0, optimize=True, disposal=2)
    print(out, len(ims), "frames", dur, "ms")


def pair_frames(d, clip):
    """[(frame, PIL image game|side)] for every rendered frame of the clip."""
    g = dict(load_frames(d, clip, "game"))
    s = dict(load_frames(d, clip, "side"))
    out = []
    for f in sorted(g):
        a, b = Image.open(g[f]).convert("RGB"), Image.open(s[f]).convert("RGB")
        im = Image.new("RGB", (a.width + b.width, a.height))
        im.paste(a, (0, 0))
        im.paste(b, (a.width, 0))
        out.append((f, im))
    return out


def label(im, text):
    dr = ImageDraw.Draw(im)
    dr.rectangle((0, 0, im.width, 22), fill=(20, 20, 24))
    dr.text((6, 3), text, fill=(235, 235, 235), font=font(15))
    return im


def gif_pair(d, out, clip, fps):
    fr = pair_frames(d, clip)
    ims = [label(im, f"D01_hodling {clip}  f{f}  {(f - 1) / fps:.3f}s  UNAPPROVED R7 review") .convert("P", palette=Image.ADAPTIVE, colors=96) for f, im in fr]
    ims[0].save(out, save_all=True, append_images=ims[1:], duration=int(round(1000 / fps)), loop=0, optimize=True, disposal=2)
    print(out, len(ims), "frames", os.path.getsize(out), "bytes")


def gif_all(d, out, fps, plan):
    """plan: [(clip, repeats, hold_last_frames)] -> one preview GIF."""
    ims = []
    for clip, rep, hold in plan:
        fr = pair_frames(d, clip)
        seq = []
        for r in range(rep):
            seq += fr[:-1] if (rep > 1 and r < rep - 1) else fr
        seq += [fr[-1]] * hold
        for f, im in seq:
            ims.append(label(im.copy(), f"D01_hodling {clip}  f{f}  {(f - 1) / fps:.3f}s  UNAPPROVED R7 review").convert("P", palette=Image.ADAPTIVE, colors=96))
    ims[0].save(out, save_all=True, append_images=ims[1:], duration=int(round(1000 / fps)), loop=0, optimize=True, disposal=2)
    print(out, len(ims), "frames", os.path.getsize(out), "bytes")


if __name__ == "__main__":
    a = sys.argv[1:]
    if a[0] == "strip":
        strip(a[1], a[2], a[3], float(a[4]), a[5] if a[5] != "-" else "", a[6].split(",") if len(a) > 6 else ["game", "side"])
    elif a[0] == "gif":
        gif(a[1], a[2], a[3], a[4], float(a[5]))
    elif a[0] == "gifpair":
        gif_pair(a[1], a[2], a[3], float(a[4]))
    elif a[0] == "gifall":
        gif_all(a[1], a[2], float(a[3]), [("idle", 1, 0), ("walk", 4, 0), ("run", 4, 0), ("attack", 3, 6), ("hit", 3, 6), ("death", 1, 24)])
