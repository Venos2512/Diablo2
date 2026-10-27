"""G1 mesh-notes sheet (py -3.11 -I w07_g1_notes.py) from the R1 probe/close-up renders -> rig/qa/W07_shroud_spinner_G1_mesh_notes.png"""
import os
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); RIG = os.path.dirname(HERE); W = os.path.join(RIG, '_work'); G = os.path.join(W, 'g1')
BG = (58, 58, 62)


def font(sz, bold=False):
    for fn in (('arialbd.ttf' if bold else 'arial.ttf'), 'DejaVuSans.ttf'):
        try:
            return ImageFont.truetype(fn, sz)
        except OSError:
            pass
    return ImageFont.load_default()


def flat(p):
    im = Image.open(p).convert('RGBA'); return Image.alpha_composite(Image.new('RGBA', im.size, BG + (255,)), im).convert('RGB')


cells = [(flat(os.path.join(W, 'r1_tex_topdown.png')), '1. Nhìn từ trên: 2 đoạn chân rời sau bụng (dưới cùng)'),
         (flat(os.path.join(G, 'cu_orphan_bq_tex.png')), '1. Đoạn chân rời cắm vào đáy bụng, không nối thân'),
         (flat(os.path.join(W, 'cu_roots_bottom_isl_lab.png')), '2. Từ dưới: chân 1+2 mỗi bên chung một mảnh (tím), gốc chân dưới ức'),
         (flat(os.path.join(W, 'cu_head_front_isl_lab.png')), '3. Đầu: 14/15 nanh · 10/11 chân xúc giác · 8/9 gốc · 16/17 u mặt · 18–21 mắt')]
cols, cell = 4, 600; top = 70
S = Image.new('RGB', (cols * cell, top + cell + 34), (30, 30, 33)); d = ImageDraw.Draw(S)
d.text((12, 10), 'W07 Shroud-Spinner — G1: chỗ mesh cần chốt', fill=(255, 225, 120), font=font(26, True))
d.text((12, 42), 'Mesh 22 mảnh (sau khi hàn): bụng, đầu ngực, 2×(chân 1+2 dính gốc), 2×chân 3, 2×chân 4, 2×đoạn chân rời, 2×chân xúc giác, '
       '2×gốc chân xúc giác, 2×nanh, 2×u mặt, 4 mắt.', fill=(225, 225, 225), font=font(17))
for k, (im, cap) in enumerate(cells):
    im = im.copy(); im.thumbnail((cell, cell)); x0 = k * cell
    d.text((x0 + 6, top + 4), cap, fill=(255, 220, 90), font=font(15, True))
    S.paste(im, (x0 + (cell - im.width) // 2, top + 30 + (cell - im.height) // 2))
out = os.path.join(RIG, 'qa', 'W07_shroud_spinner_G1_mesh_notes.png'); S.save(out); print(out, S.size)
