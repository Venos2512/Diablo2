"""Checks for make_heights.py. Run:  python -I E:/Diablo2/ashlar/art/textures/terrain-biomes-v1/tools/test_make_heights.py -v

Synthetic fixtures in temp dirs only; the real normal1024/ and height1024/ are never written by the tests.
"""
import hashlib
import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import make_heights as mh  # noqa: E402

N = 128


def dome_normal_rgb(n=N, amp=6.0):
    """Periodic raised dome (centre high) encoded by hand as an OpenGL normal map: n ~ (-dh/dcol, +dh/drow, 1)."""
    y, x = np.mgrid[0:n, 0:n].astype(np.float64)
    cx = cy = n / 2
    d2 = ((x - cx + n / 2) % n - n / 2) ** 2 + ((y - cy + n / 2) % n - n / 2) ** 2
    h = amp * np.exp(-d2 / (2 * (n / 10) ** 2))
    # wrap-aware central differences keep it periodic
    dcol = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) / 2
    drow = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) / 2
    vec = np.stack([-dcol, drow, np.ones_like(h)], -1)
    vec /= np.linalg.norm(vec, axis=-1, keepdims=True)
    return np.rint((vec * 0.5 + 0.5) * 255).astype(np.uint8)


class MakeHeights(unittest.TestCase):
    def test_dome_is_bright_in_centre(self):
        h = mh.height_from_normal_rgb(dome_normal_rgb(), sigma=0)
        c = h[N // 2 - 4:N // 2 + 4, N // 2 - 4:N // 2 + 4].mean()
        corner = np.mean([h[:6, :6].mean(), h[-6:, -6:].mean(), h[:6, -6:].mean(), h[-6:, :6].mean()])
        self.assertGreater(c, 200)
        self.assertGreater(c, corner + 70)
        self.assertLess(abs(corner - 127.5), 12)  # background sits at the common median

    def test_highpass_keeps_dome_bright(self):
        h = mh.height_from_normal_rgb(dome_normal_rgb(), sigma=N / 4)
        self.assertGreater(h[N // 2, N // 2], h[0, 0] + 60)

    def test_output_is_periodic(self):
        h = mh.height_from_normal_rgb(dome_normal_rgb())
        # the wrap pair must not differ more than a typical interior neighbour pair
        wrap = max(np.abs(h[0] - h[-1]).mean(), np.abs(h[:, 0] - h[:, -1]).mean())
        interior = max(np.abs(np.diff(h, axis=0)).mean(), np.abs(np.diff(h, axis=1)).mean())
        self.assertLessEqual(wrap, interior * 1.5 + 1.0)
        # a shifted copy of the input yields the shifted height (translation invariance of the periodic maths)
        rgb = dome_normal_rgb()
        h2 = mh.height_from_normal_rgb(np.roll(rgb, (17, 29), (0, 1)))
        self.assertLess(np.abs(np.roll(h, (17, 29), (0, 1)) - h2).max(), 1.0)

    def test_range_uint8_and_inputs_untouched(self):
        with tempfile.TemporaryDirectory() as td:
            src, dst = Path(td) / "n.png", Path(td) / "out" / "h.png"
            Image.fromarray(dome_normal_rgb()).save(src)
            before = hashlib.sha256(src.read_bytes()).hexdigest()
            mh.convert(src, dst)
            self.assertEqual(before, hashlib.sha256(src.read_bytes()).hexdigest())
            im = Image.open(dst)
            self.assertEqual(im.mode, "L")
            a = np.asarray(im)
            self.assertEqual(a.shape, (N, N))
            self.assertGreater(a.max(), 250)
            self.assertLess(abs(float(np.median(a)) - 127.5), 2.0)
            mh.convert(src, dst)  # idempotent
            self.assertTrue(np.array_equal(a, np.asarray(Image.open(dst))))

    def test_common_median_for_opposite_skew(self):
        dome = dome_normal_rgb()
        pit = dome_normal_rgb(amp=-6.0)  # mirrored height: long tail on the other side
        for rgb in (dome, pit):
            h = mh.height_from_normal_rgb(rgb, sigma=0)
            self.assertLess(abs(float(np.median(h)) - 127.5), 1.5)
        hd, hp = (mh.height_from_normal_rgb(r, sigma=0) for r in (dome, pit))
        self.assertGreater(hd[N // 2, N // 2], 200)  # dome raised = bright
        self.assertLess(hp[N // 2, N // 2], 55)      # pit lowered = dark
        self.assertLess(abs(hd.mean() - hp.mean()), 40)  # no hidden per-layer bias between them

    def test_flat_normal_gives_mid_gray(self):
        flat = np.zeros((N, N, 3), np.uint8)
        flat[...] = (128, 128, 255)
        h = mh.height_from_normal_rgb(flat)
        self.assertTrue(np.allclose(h, h.flat[0]))


if __name__ == "__main__":
    unittest.main()
