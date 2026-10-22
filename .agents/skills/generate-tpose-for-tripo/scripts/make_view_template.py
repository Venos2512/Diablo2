"""Placement template for a two-view turnaround sheet (PIL only; a layout aid, not artwork).

  python -I make_view_template.py <out.png> [--canvas 2172x724] [--bg 128] [--px-per-h 640] [--floor 0.80]
                                  [--blocks 0.50x0.72 0.50x0.72]

Writes a flat grey canvas with TWO slightly lighter rectangles, centred at 1/4 and 3/4 of the width and standing on
one floor line. The rectangles are size blocks: they fix the canvas shape, the floor line and the scale of the two
views, so that the front/back sheet and the sides sheet of one creature come out at the same scale. The image
generator is told to paint each view inside its block and NOT to draw the block. No text, no floor line, no
outline darker than the split tool's foreground threshold (so a leaked block is removed by `split`).
--blocks takes two WxH sizes in H units (H = adult human height); --px-per-h is how many pixels one H gets.
Prints the block boxes as JSON.
"""
import argparse
import json
import sys

from PIL import Image, ImageDraw


def size(text):
    w, h = text.lower().split('x')
    return float(w), float(h)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('out')
    ap.add_argument('--canvas', default='2172x724')
    ap.add_argument('--bg', type=int, default=128, help='grey level of the flat background')
    ap.add_argument('--px-per-h', type=float, default=640.0)
    ap.add_argument('--floor', type=float, default=0.80, help='floor line as a fraction of the canvas height')
    ap.add_argument('--blocks', nargs=2, default=['0.50x0.72', '0.50x0.72'], metavar='WxH')
    args = ap.parse_args()
    cw, ch = (int(v) for v in args.canvas.lower().split('x'))
    if not 20 <= args.bg <= 235:
        sys.exit('--bg must be between 20 and 235 so that the blocks and the outline stay visible')
    im = Image.new('RGB', (cw, ch), (args.bg,) * 3)
    d = ImageDraw.Draw(im)
    fill = (args.bg + 16,) * 3
    edge = (args.bg - 20,) * 3  # 20 levels is under the split tool's foreground threshold (40)
    floor = round(args.floor * ch)
    boxes = []
    for cx, spec in zip((cw * 0.25, cw * 0.75), args.blocks):
        wh, hh = size(spec)
        w, h = wh * args.px_per_h, hh * args.px_per_h
        box = [round(cx - w / 2), round(floor - h), round(cx + w / 2), floor]
        if box[0] < 12 or box[2] > cw - 12 or box[1] < 12 or box[3] > ch - 12:
            sys.exit(f'block {spec} does not fit the {cw}x{ch} canvas at {args.px_per_h} px/H: {box}')
        d.rectangle(box, fill=fill, outline=edge, width=2)
        boxes.append(box)
    im.save(args.out)
    print(json.dumps({'canvas': [cw, ch], 'floor_y': floor, 'px_per_h': args.px_per_h, 'blocks': boxes}))


if __name__ == '__main__':
    main()
