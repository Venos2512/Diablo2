"""PIL helpers for W02 (system Python, run as `python -I w02_pil.py ...`).

PIL lives in the user site-packages, which -I hides; the path is added explicitly (no cwd / script-dir imports).
Reuses tools/compose.py of the rig_v1 batch (imported, not modified).

python -I w02_pil.py grid_sheet <out.png> <cols> <cell> <step_m> <img1>[=caption] ...   metric grid on each ortho render, then a sheet
"""
import sys, os, site
_US = os.path.join(os.environ.get('APPDATA', ''), 'Python', 'Python%d%d' % sys.version_info[:2], 'site-packages')
if os.path.isdir(_US) and _US not in sys.path:
    sys.path.append(_US)
TOOLS = r'D:/Claude/Diablo2/ashlar/3d/act-01/_batches/rig_v1/tools'
sys.path.append(TOOLS)
import compose  # noqa: E402  (tools/compose.py: flat, font, gridlines, overlay, grid)
from PIL import Image, ImageDraw  # noqa: E402


def grid_sheet(out, cols, cell, step, items):
    tmp = []
    for it in items:
        p, _, cap = it.partition('=')
        g = p[:-4] + '_grid.png'
        compose.gridlines(p, g, step=float(step), label_every=2)
        tmp.append(g + ('=' + cap if cap else '=' + os.path.basename(p)[:-4]))
    compose.grid(out, cols, cell, tmp)


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'grid_sheet':
        grid_sheet(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5], sys.argv[6:])
