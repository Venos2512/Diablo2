"""Cut a Codex HUD edit (black 16:9 canvas) back to a 2000x696 RGBA layer.

The input canvas was base_user_layer.png (2000x696) pasted at y=214 on 2000x1125 black.
Alpha = soft key against black, enclosed holes filled (dark socket recesses stay opaque).
Usage: python cutout_layer.py <codex.png> <out.png>
"""
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

W, H, OY, LH = 2000, 1125, 214, 696

src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB').resize((W, H), Image.LANCZOS).crop((0, OY, W, OY + LH))
rgb = np.asarray(im).astype(np.float32)
mx = rgb.max(axis=2)
alpha = np.clip((mx - 8.0) / 22.0, 0.0, 1.0)
solid = ndimage.binary_fill_holes(alpha > 0.5)
alpha = np.maximum(alpha, solid.astype(np.float32))
# un-premultiply the black fringe so edges do not go dark when composited
safe = np.maximum(alpha, 1e-3)[..., None]
col = np.clip(rgb / safe, 0, 255)
col = np.where(alpha[..., None] > 0, col, 0)
out = np.dstack([col, alpha * 255]).astype(np.uint8)
Image.fromarray(out, 'RGBA').save(dst)
print(dst, 'opaque share %.3f' % (alpha > 0.98).mean())
