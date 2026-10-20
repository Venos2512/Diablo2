# Rough automatic QA per final concept: size/aspect, figure touching frame edges, and (Redbound) share of red
# among figure pixels. Figure = pixels differing from the flat grey background. Approximate, not a material audit.
import glob, os, json
import numpy as np
from PIL import Image
out = {}
for d in sorted(glob.glob('[0-9]*')):
    ps = sorted(glob.glob(os.path.join(d, 'concept*.png')), key=os.path.getmtime)
    if not ps:
        out[d] = 'missing'; continue
    im = np.asarray(Image.open(ps[-1]).convert('RGB')).astype(float)
    h, w, _ = im.shape
    border = np.concatenate([im[:8].reshape(-1, 3), im[-8:].reshape(-1, 3), im[:, :8].reshape(-1, 3), im[:, -8:].reshape(-1, 3)])
    bg = np.median(border, 0)
    diff = np.abs(im - bg).sum(2)
    sat = im.max(2) - im.min(2)
    fig = (diff > 45) & ~((sat < 18) & (diff < 70))  # drop soft grey contact shadows
    edge = {k: float(v.mean()) for k, v in {'top': fig[:4], 'bottom': fig[-4:], 'left': fig[:, :4], 'right': fig[:, -4:]}.items()}
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    red = (r > g * 1.35) & (r > b * 1.25) & (r > 60)
    out[d] = {'file': os.path.basename(ps[-1]), 'size': [w, h], 'aspect': round(w / h, 3),
              'figure_px_%': round(100 * fig.mean(), 1),
              'edge_touch_%': {k: round(100 * v, 1) for k, v in edge.items() if v > 0.003},
              'red_of_figure_%': round(100 * (red & fig).sum() / max(fig.sum(), 1), 1)}
json.dump(out, open('_rerun/qa_measure.json', 'w'), indent=1)
for d, v in out.items():
    print(d, v if isinstance(v, str) else f"{v['file']:22s} {v['size']} ar={v['aspect']} fig={v['figure_px_%']}% red={v['red_of_figure_%']}% edges={v['edge_touch_%']}")
