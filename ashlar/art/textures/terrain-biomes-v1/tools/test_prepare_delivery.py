"""Checks for prepare_delivery.py. Run:  python -I E:/Diablo2/ashlar/art/textures/terrain-biomes-v1/tools/test_prepare_delivery.py -v

Synthetic fixtures in temp dirs only; the real textures/ directory is never touched.
"""
import json
import os
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import prepare_delivery as pd  # noqa: E402


def smooth_noise(n, seed, scale=6):
    """Smooth, NON-periodic texture (so wrapping it has a real seam)."""
    rng = np.random.default_rng(seed)
    small = rng.random((scale, scale, 3)).astype(np.float32)
    img = Image.fromarray((small * 255).astype(np.uint8)).resize((n, n), Image.BICUBIC)
    return np.asarray(img)


class Maths(unittest.TestCase):
    def test_periodic_leaves_a_constant_image_unchanged(self):
        for value in (0.0, 0.37, 1.0):
            img = np.full((64, 48, 3), value, dtype=np.float32)
            out = pd.periodic(img)
            self.assertLess(float(np.abs(out - value).max()), 1e-6)

    def test_periodic_preserves_per_channel_mean(self):
        img = smooth_noise(96, 3).astype(np.float32) / 255
        out = pd.periodic(img)
        # smooth component has zero mean (s[0,0] = 0); only clipping could move it
        self.assertLess(float(np.abs(out.mean((0, 1)) - img.mean((0, 1))).max()), 2e-3)

    def test_periodic_reduces_the_wrap_jump_and_keeps_detail(self):
        # left-right and top-bottom ramps => big jump across the wrap; periodic must remove most of it
        n = 128
        x = np.linspace(0.15, 0.85, n, dtype=np.float32)
        base = (x[None, :] * 0.6 + x[:, None] * 0.4)[..., None].repeat(3, 2)
        rng = np.random.default_rng(1)
        img = np.clip(base + rng.normal(0, 0.02, base.shape).astype(np.float32), 0, 1)
        before = pd.edge_metrics(pd.to_uint8(img))
        out = pd.periodic(img)
        after = pd.edge_metrics(pd.to_uint8(out))
        self.assertGreater(before["edge_lr"], 60)          # real seam to start with
        self.assertLess(after["edge_lr"], before["edge_lr"] * 0.2)
        self.assertLess(after["edge_tb"], before["edge_tb"] * 0.2)
        # the wrap is now no worse than ordinary neighbouring pixels (ratio ~1 instead of >>1)
        self.assertLess(after["edge_lr"], 3 * after["adjacent_x"] + 2)
        # detail is kept: the noise (high-pass) component is essentially identical
        def hp(a):
            return a - np.roll(a, 1, 0) * 0.5 - np.roll(a, 1, 1) * 0.5
        d = np.abs(hp(out[1:-1, 1:-1]) - hp(img[1:-1, 1:-1])).mean()
        self.assertLess(float(d), 0.01)

    def test_edge_metrics_zero_for_constant_and_flags_a_step(self):
        flat = np.full((16, 16, 3), 90, dtype=np.uint8)
        self.assertEqual(pd.edge_metrics(flat)["edge_lr"], 0.0)
        step = np.zeros((16, 16, 3), dtype=np.uint8)
        step[:, 8:] = 200
        m = pd.edge_metrics(step)
        self.assertEqual(m["edge_lr"], 200.0)
        self.assertEqual(m["edge_tb"], 0.0)

    def test_process_image_reports_hue_neutral_result(self):
        arr = smooth_noise(96, 7)
        _, after, info = pd.process_image(Image.fromarray(arr), 64)
        self.assertEqual(after.shape, (64, 64, 3))
        self.assertLess(info["max_mean_shift"], 1.5)       # no tint / brightness drift
        self.assertLessEqual(info["after"]["edge_lr"], info["before"]["edge_lr"])
        self.assertEqual(info["resized_from"], [96, 96])


class Pipeline(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.biome = Path(self._tmp.name)
        (self.biome / "textures").mkdir()
        jobs = [
            {"id": "BIO01_a", "biome_id": "BIO-01", "name_vi": "Đầm lầy", "material": "Than bùn",
             "prompt": "x Colors #4A3526 #1F2A24 and #4a3526 again."},
            {"id": "BIO24_b", "biome_id": "BIO-24", "name_vi": "Cổng", "material": "Đá", "prompt": "y"},
            {"id": "BIO26_c", "biome_id": "BIO-26", "name_vi": "Mộng", "material": "Sân", "prompt": "z"},
        ]
        (self.biome / "manifest.json").write_text(json.dumps(jobs, ensure_ascii=False), encoding="utf-8")
        for jid, seed in (("BIO01_a", 1), ("BIO24_b", 2)):
            Image.fromarray(smooth_noise(80, seed)).save(self.biome / "textures" / f"{jid}.png")
        self.argv = ["--manifest", str(self.biome / "manifest.json"), "--size", "64", "--cell", "96",
                     "--thumb", "48", "--compact-thumb", "32"]
        self.hashes = {p.name: pd.sha256_of(p) for p in (self.biome / "textures").iterdir()}

    def tearDown(self):
        self._tmp.cleanup()

    def meta(self):
        return json.loads((self.biome / "delivery_metadata.json").read_text(encoding="utf-8"))

    def test_full_run_outputs_counts_and_immutable_sources(self):
        self.assertEqual(pd.main(self.argv), 0)
        m = self.meta()
        self.assertEqual(m["counts"]["manifest_jobs"], 3)
        self.assertEqual(m["counts"]["raw_present"], 2)
        self.assertEqual(m["counts"]["delivered"], 2)
        self.assertEqual(m["counts"]["missing"], 1)
        self.assertTrue(m["sources_unchanged"])
        # originals byte-identical, no new file in textures/
        self.assertEqual({p.name: pd.sha256_of(p) for p in (self.biome / "textures").iterdir()}, self.hashes)
        by = {e["id"]: e for e in m["entries"]}
        a = by["BIO01_a"]
        self.assertEqual(a["status"], "ready")
        self.assertEqual(a["raw"]["sha256"], self.hashes["BIO01_a.png"])
        self.assertEqual(a["processing"]["source_sha256"], a["raw"]["sha256"])
        self.assertEqual(a["processing"]["flatten"], "none")
        self.assertEqual(a["palette_hex"], ["#4A3526", "#1F2A24"])
        self.assertLess(a["metrics"]["after"]["edge_lr"], a["metrics"]["before"]["edge_lr"])
        self.assertEqual(a["delivered"]["width"], 64)
        self.assertEqual(a["delivered"]["sha256"], pd.sha256_of(self.biome / "albedo64" / "BIO01_a.png"))
        self.assertEqual(by["BIO26_c"]["status"], "missing")
        self.assertIsNone(by["BIO26_c"]["raw"])
        self.assertFalse((self.biome / "albedo64" / "BIO26_c.png").exists())  # no fake output
        self.assertIn("Đầm lầy", a["name_vi"])
        self.assertTrue((self.biome / "delivery_qa" / "repeat3x3_sheet_01.png").is_file())
        self.assertTrue((self.biome / "delivery_qa" / "thumbnails_all.png").is_file())

    def test_rerun_skips_unchanged_sources_and_force_redoes(self):
        pd.main(self.argv)
        out = self.biome / "albedo64" / "BIO01_a.png"
        before = out.stat().st_mtime_ns
        pd.main(self.argv)
        self.assertEqual(out.stat().st_mtime_ns, before)
        pd.main(self.argv + ["--force"])
        self.assertNotEqual(out.stat().st_mtime_ns, before)

    def test_changed_source_is_reprocessed(self):
        pd.main(self.argv)
        first = self.meta()["entries"][0]["delivered"]["sha256"]
        Image.fromarray(smooth_noise(80, 99)).save(self.biome / "textures" / "BIO01_a.png")
        pd.main(self.argv)
        self.assertNotEqual(self.meta()["entries"][0]["delivered"]["sha256"], first)

    def test_gallery_is_self_contained_with_all_cards_and_missing_marked(self):
        pd.main(self.argv)
        full = (self.biome / "gallery.html").read_text(encoding="utf-8")
        compact = (self.biome / "gallery.compact.html").read_text(encoding="utf-8")
        for page in (full, compact):
            self.assertEqual(len(re.findall(r'class="card st-', page)), 4)  # 3 manifest + BIO-25
            self.assertEqual(page.count("data:image/jpeg;base64,"), 2)       # only existing outputs
            self.assertEqual(page.count("THIẾU"), 1)                          # the absent one, flagged
            self.assertIn("BIO-25", page)
            self.assertIn("không có texture", page)
            self.assertIn("bloom", page)
            self.assertIn("chưa được duyệt", page)
            self.assertIn("Act I", page)
            self.assertIn("matte", page)
            self.assertIn('id="rep"', page)                                  # repeat toggle
            self.assertNotRegex(page, r'(src|href)="https?://')             # no network
            self.assertNotIn("<script", page)
            self.assertIn("Albedo đã giao <b>2</b>/3", page)
            self.assertIn("Ảnh gốc <b>2</b>/3", page)
        # BIO-25 sits between BIO-24 and BIO-26
        self.assertLess(full.index("BIO24_b"), full.index("BIO-25 · thẻ giải thích"))
        self.assertLess(full.index("BIO-25 · thẻ giải thích"), full.index("BIO26_c"))
        # compact: fluid, transparent, no title banner
        self.assertNotIn("<h1", compact)
        self.assertIn("<h1", full)
        self.assertIn("background:transparent", compact)
        self.assertLess(len(compact), len(full))

    def test_refuses_to_write_into_textures_dir(self):
        tex = self.biome / "textures"
        link = self.biome / "albedo64"  # the output dir for --size 64, aliased onto the originals
        try:
            os.symlink(tex, link, target_is_directory=True)
        except (OSError, NotImplementedError):
            if os.name != "nt" or subprocess.run(["cmd", "/c", "mklink", "/J", str(link), str(tex)],
                                                 capture_output=True).returncode != 0:
                self.skipTest("links unavailable")
        with self.assertRaises(SystemExit):
            pd.main(self.argv)
        self.assertEqual({p.name: pd.sha256_of(p) for p in tex.iterdir()}, self.hashes)

    def test_unknown_only_id_rejected(self):
        with self.assertRaises(SystemExit):
            pd.main(self.argv + ["--only", "NOPE"])

    def test_qa_sheets_group_at_most_twelve(self):
        jobs = [{"id": f"BIO{n:02d}_x", "biome_id": f"BIO-{n:02d}", "name_vi": "n", "material": "m", "prompt": "p"}
                for n in range(1, 14)]
        (self.biome / "manifest.json").write_text(json.dumps(jobs), encoding="utf-8")
        for j in jobs:
            Image.fromarray(smooth_noise(40, 5)).save(self.biome / "textures" / f"{j['id']}.png")
        pd.main(self.argv)
        sheets = self.meta()["outputs"]["repeat3x3_sheets"]
        self.assertEqual([len(s["ids"]) for s in sheets], [12, 1])


if __name__ == "__main__":
    unittest.main()
