"""Checks for prepare_normals.py. Run:  python -I E:/Diablo2/ashlar/art/terrain-biomes-v1/tools/test_prepare_normals.py -v

Synthetic fixtures in temp dirs only; the real normal/, albedo1024/ and textures/ directories are never touched.
"""
import json
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import prepare_normals as pn  # noqa: E402

N = 128


def height_field(n=N, seed=1, kmin=4, kmax=16, max_slope=0.6):
    """Periodic, band-limited random height (kmin..kmax cycles per tile), scaled to a given peak slope."""
    rng = np.random.default_rng(seed)
    fy, fx = np.fft.fftfreq(n)[:, None] * n, np.fft.fftfreq(n)[None, :] * n
    k = np.hypot(fx, fy)
    spec = (rng.normal(size=(n, n)) + 1j * rng.normal(size=(n, n))) * ((k >= kmin) & (k <= kmax))
    h = np.real(np.fft.ifft2(spec))
    s = np.hypot(pn.ddx(h), pn.ddy(h)).max()
    return h * (max_slope / s)


def normal_u8(h):
    """OpenGL map of a height field: n ~ (-dh/dcol, +dh/drow, 1)."""
    return pn.encode(pn.from_slopes(pn.ddx(h), pn.ddy(h)))


def albedo_u8(h, sign=1.0):
    luma = 0.5 + sign * 0.3 * h / h.std() * 0.5
    return pn.pd.to_uint8(np.clip(luma[..., None] * np.array([1.0, 0.9, 0.78]), 0, 1))


def angle_deg(a_u8, b_u8):
    a, b = pn.normalize(pn.decode_rgb(a_u8)), pn.normalize(pn.decode_rgb(b_u8))
    return np.degrees(np.arccos(np.clip((a * b).sum(-1), -1, 1)))


def smooth_vector_field(n, seed, scale=5, amp=0.8):
    """Smooth NON-periodic slope field => a normal map with a real seam when wrapped."""
    rng = np.random.default_rng(seed)
    out = []
    for _ in range(2):
        small = rng.uniform(-amp, amp, (scale, scale)).astype(np.float32)
        out.append(np.asarray(Image.fromarray(small, "F").resize((n, n), Image.BICUBIC), dtype=np.float64))
    return pn.encode(pn.from_slopes(out[0], out[1]))


def assert_unit_and_up(tc, out_u8):
    v = pn.decode_rgb(out_u8)
    tc.assertLess(float(np.abs(np.sqrt((v * v).sum(-1)) - 1).max()), 0.015)   # 8-bit rounding only
    tc.assertGreaterEqual(float(v[..., 2].min()), 0.0)


class Maths(unittest.TestCase):
    def test_periodic_component_keeps_sign_and_constant(self):
        c = np.full((32, 24), -0.4)
        self.assertLess(float(np.abs(pn.periodic_component(c) + 0.4).max()), 1e-9)   # no [0,1] clip
        u = height_field(64, 2) - 0.5
        out = pn.periodic_component(u)
        self.assertLess(out.min(), -0.5)                                              # negatives survive
        self.assertLess(abs(out.mean() - u.mean()), 1e-9)                            # mean is preserved
        ramp = np.linspace(-1, 1, 64)[None, :] + np.zeros((64, 1))
        r = pn.periodic_component(ramp)
        self.assertLess(abs(r[:, 0] - r[:, -1]).mean(), abs(ramp[:, 0] - ramp[:, -1]).mean() * 0.2)

    def test_fourier_shift_matches_np_roll_and_is_fractional(self):
        h = height_field(64, 3)
        for sy, sx in ((3, -2), (-5, 4), (0, 7)):
            self.assertLess(float(np.abs(pn.fourier_shift(h, sy, sx) - np.roll(h, (sy, sx), (0, 1))).max()), 1e-9)
        half = pn.fourier_shift(h, 0.5, 0)
        back = pn.fourier_shift(half, -0.5, 0)
        self.assertLess(float(np.abs(back - h).max()), 1e-9)
        v = np.stack([h, h * 0.5, h * 0.25], -1)
        self.assertEqual(pn.fourier_shift(v, 2, 1).shape, v.shape)

    def test_estimate_shift_recovers_known_roll_with_subpixel(self):
        h = height_field(N, 4)
        luma = pn.luma_of(albedo_u8(h))
        p, q = pn.ddx(h), pn.ddy(h)
        for sy, sx in ((3, -2), (-1.6, 0.7)):
            ps, qs = pn.fourier_shift(p, sy, sx), pn.fourier_shift(q, sy, sx)   # normal content moved by (sy, sx)
            eN, eL = pn.edge_maps(ps, qs, luma)
            est = pn.estimate_shift(eN, eL)
            self.assertAlmostEqual(est["sy"], -sy, delta=0.5)
            self.assertAlmostEqual(est["sx"], -sx, delta=0.5)
            self.assertGreater(est["ncc_best"], est["ncc_before"])

    def test_phase_shift_sign_and_noise_floor(self):
        rng = np.random.default_rng(5)
        a = pn.gauss(rng.normal(size=(128, 128)), 2)
        b = np.roll(a, (4, -3), (0, 1))
        sy, sx, z = pn.phase_shift(a, b)
        self.assertAlmostEqual(sy, 4, delta=0.3)
        self.assertAlmostEqual(sx, -3, delta=0.3)
        self.assertGreater(z, pn.PEAK_USABLE)
        noise = pn.gauss(rng.normal(size=(128, 128)), 2)
        self.assertLess(pn.phase_shift(a, noise)[2], pn.PEAK_USABLE)

    def test_integrate_slopes_recovers_height(self):
        h = height_field(N, 6)
        r = pn.integrate_slopes(pn.ddx(h), pn.ddy(h))
        self.assertGreater(pn.ncc(r, h), 0.98)

    def test_resize_vec_is_float_and_unit(self):
        v = np.zeros((40, 40, 3))
        v[..., 2] = 1.0
        v[:, 20:] = pn.normalize(np.array([0.6, 0.0, 0.8]))
        r = pn.resize_vec(v, 64)
        self.assertEqual(r.shape, (64, 64, 3))
        self.assertLess(float(np.abs(np.sqrt((r * r).sum(-1)) - 1).max()), 1e-9)
        self.assertLess(float(np.abs(r[:, 4] - [0, 0, 1]).max()), 0.05)

    def test_preview_formulas(self):
        flat = np.zeros((4, 4, 3))
        flat[..., 2] = 1.0
        d = float(pn.LIGHT[2])                                   # n.l for a flat normal
        self.assertAlmostEqual(float(pn.lit_grey(flat)[0, 0, 0]), round((0.25 + 0.75 * d) * 255), delta=1)
        al = np.full((4, 4, 3), 200, dtype=np.uint8)
        self.assertEqual(int(pn.lit_albedo(flat, al)[0, 0, 0]), min(255, int(round(200 * (0.3 + 0.85 * d)))))
        away = flat.copy()
        away[..., 2], away[..., 0] = 0.0, 1.0                    # lit from the left => facing right is dark
        self.assertEqual(int(pn.lit_albedo(away, al)[0, 0, 0]), int(round(200 * 0.3)))


class Pipeline(unittest.TestCase):
    def setUp(self):
        self.h = height_field(N, 1)
        self.truth = normal_u8(self.h)
        self.alb = albedo_u8(self.h)

    def test_opengl_periodic_map_passes_through_nearly_unchanged(self):
        out, info = pn.process_normal(self.truth, self.alb, N)
        self.assertEqual(info["convention"]["decision"], "opengl")
        self.assertFalse(info["convention"]["flipped"])
        self.assertFalse(info["registration"]["applied"])
        err = angle_deg(out, self.truth)
        self.assertLess(float(err.mean()), 0.6)
        self.assertLess(float(np.percentile(err, 99)), 4.0)
        self.assertLess(float(err[16:-16, 16:-16].max()), 1.5)   # only the border band feels the decomposition
        self.assertGreater(info["relief_ncc"], 0.5)
        self.assertEqual(info["warnings"], [])
        assert_unit_and_up(self, out)

    def test_green_flipped_copy_is_detected_directx_and_restored(self):
        dx = self.truth.copy()
        dx[..., 1] = 255 - dx[..., 1]
        out, info = pn.process_normal(dx, self.alb, N)
        self.assertEqual(info["convention"]["decision"], "directx")
        self.assertTrue(info["convention"]["flipped"])
        self.assertLess(float(angle_deg(out, self.truth).mean()), 0.6)
        self.assertTrue(any("DirectX" in w for w in info["warnings"]))
        assert_unit_and_up(self, out)

    def test_known_roll_is_recovered_and_undone(self):
        rolled = np.roll(self.truth, (3, -2), (0, 1))
        out, info = pn.process_normal(rolled, self.alb, N)
        r = info["registration"]
        self.assertTrue(r["applied"], r)
        self.assertAlmostEqual(r["shift_sy"], -3, delta=0.5)
        self.assertAlmostEqual(r["shift_sx"], 2, delta=0.5)
        self.assertGreater(r["ncc_after"], r["ncc_before"] + 0.05)
        self.assertLess(float(angle_deg(out, self.truth).mean()), 1.5)
        self.assertGreater(float(angle_deg(rolled, self.truth).mean()), 3.0)     # the roll really was a defect
        self.assertLess(r["block_residual"]["max_abs"], 1.0)
        assert_unit_and_up(self, out)

    # ---- convention rule (curl at sigma 2 + relief), see detect_convention()
    def noisy_normal(self, h, noise, seed=3):
        rng = np.random.default_rng(seed)
        p = pn.ddx(h) + rng.normal(0, noise, h.shape)
        q = pn.ddy(h) + rng.normal(0, noise, h.shape)
        return pn.encode(pn.from_slopes(p, q))

    @staticmethod
    def flip_green(u8):
        out = u8.copy()
        out[..., 1] = 255 - out[..., 1]
        return out

    def test_directx_decided_at_sigma2_when_sigma0_is_noise_dominated(self):
        h = height_field(N, 7, 4, 10)
        dx = self.flip_green(self.noisy_normal(h, 0.25))
        v = pn.resize_vec(pn.decode_rgb(dx), N)
        p, q = pn.slopes(v)
        c = pn.detect_convention(p, q, pn.luma_of(albedo_u8(h)))
        self.assertGreater(c["r_s0"], 0.85)           # the old "both scales" rule could not have flipped this
        self.assertLessEqual(c["r_s2"], 0.85)
        self.assertEqual(c["decision"], "directx")
        out, info = pn.process_normal(dx, albedo_u8(h), N)
        self.assertTrue(info["convention"]["flipped"])
        assert_unit_and_up(self, out)

    def one_d_height(self, seed=2):
        rng = np.random.default_rng(seed)
        prof = pn.gauss(rng.normal(size=(N, N)), 2.5)[:, :1]                         # varies along rows only
        return np.repeat(prof / np.abs(np.gradient(prof[:, 0])).max() * 0.6, N, 1)

    def test_one_dimensional_relief_alone_decides(self):
        h = self.one_d_height()
        alb = albedo_u8(h)
        gl = normal_u8(h)
        p, q = pn.slopes(pn.resize_vec(pn.decode_rgb(gl), N))
        c = pn.detect_convention(p, q, pn.luma_of(alb))
        self.assertAlmostEqual(c["r_s2"], 1.0, delta=0.05)                            # curl cannot tell
        self.assertGreater(c["d"], 0.4)
        self.assertEqual(c["decision"], "opengl")
        out, info = pn.process_normal(self.flip_green(gl), alb, N)                    # DirectX copy of the same relief
        c = info["convention"]
        self.assertAlmostEqual(c["r_s2"], 1.0, delta=0.05)
        self.assertLess(c["d"], -0.4)
        self.assertEqual(c["decision"], "directx")
        self.assertLess(float(angle_deg(out, gl).mean()), 1.0)

    def test_confident_gl_with_negative_relief_stays_gl_with_warning_only(self):
        alb = albedo_u8(self.h, -1.0)
        p, q = pn.slopes(pn.resize_vec(pn.decode_rgb(self.truth), N))
        c = pn.detect_convention(p, q, pn.luma_of(alb))
        self.assertGreater(c["r_s2"], 1.5)
        self.assertLess(c["relief_gl"], -0.5)
        self.assertEqual(c["decision"], "opengl")
        out, info = pn.process_normal(self.truth, alb, N)
        self.assertFalse(info["convention"]["flipped"])
        self.assertTrue(any("inverted relief" in w for w in info["warnings"]))
        self.assertLess(float(angle_deg(out, self.truth).mean()), 0.6)

    def test_confident_curl_beats_relief_and_flags_the_conflict(self):
        # DirectX by curl, albedo = inverse of the relief: curl is physics, the map is flipped, the disagreement flagged
        dx = self.flip_green(self.truth)
        out, info = pn.process_normal(dx, albedo_u8(self.h, -1.0), N)
        c = info["convention"]
        self.assertLessEqual(c["r_s2"], pn.CONV_R_DX)
        self.assertGreater(c["d"], pn.CONV_D_CONFLICT)
        self.assertEqual(c["decision"], "directx")
        self.assertIn("convention_conflict", c["flags"])
        self.assertTrue(any("convention_conflict" in w for w in info["warnings"]))
        self.assertLess(float(angle_deg(out, self.truth).mean()), 0.8)               # restored to the OpenGL truth
        # and the mirror case: OpenGL by curl, inverted albedo -> stays OpenGL + conflict (see inverted-relief test)
        _, info = pn.process_normal(self.truth, albedo_u8(self.h, -1.0), N)
        self.assertEqual(info["convention"]["decision"], "opengl")
        self.assertIn("convention_conflict", info["convention"]["flags"])

    def test_inconclusive_curl_uses_relief_thresholds(self):
        # r inside (0.75, 1.33): |d| >= 0.4 decides, a smaller |d| keeps OpenGL and flags ambiguity
        h = self.one_d_height()
        gl = normal_u8(h)
        pm, qm = pn.slopes(pn.resize_vec(pn.decode_rgb(gl), N))
        c = pn.detect_convention(pm, qm, pn.luma_of(albedo_u8(h)))
        self.assertTrue(pn.CONV_R_DX < c["r_s2"] < pn.CONV_R_GL)
        self.assertEqual((c["decision"], c["flags"]), ("opengl", []))
        weak = pn.luma_of(albedo_u8(h)) * 0.0 + np.random.default_rng(1).normal(0, 1, (N, N))   # unrelated albedo: d ~ 0
        c = pn.detect_convention(pm, qm, weak)
        self.assertEqual((c["decision"], c["flags"]), ("opengl", ["convention_ambiguous"]))

    # ---- mean slope (DC) removal
    def test_constant_tilt_is_removed_and_the_rest_is_unchanged(self):
        p, q = pn.ddx(self.h) + 0.20, pn.ddy(self.h) - 0.15               # ~14 deg of uniform tilt on top of the relief
        tilted = pn.encode(pn.from_slopes(p, q))
        out, info = pn.process_normal(tilted, self.alb, N)
        b = info["mean_slope_removed"]
        self.assertAlmostEqual(b["mean_p"], 0.20, delta=0.02)
        self.assertAlmostEqual(b["mean_q"], -0.15, delta=0.02)
        self.assertAlmostEqual(b["tilt_deg"], float(np.degrees(np.arctan(0.25))), delta=1.5)
        self.assertTrue(any("tilt bias" in w for w in info["warnings"]))     # > 8 deg
        self.assertLess(info["mean_slope_final"]["tilt_deg"], 0.5)
        fp, fq = pn.slopes(pn.decode_rgb(out))
        self.assertLess(abs(float(fp.mean())), 0.01)
        self.assertLess(abs(float(fq.mean())), 0.01)
        self.assertLess(float(angle_deg(out, self.truth).mean()), 0.8)       # same relief as the untilted truth
        assert_unit_and_up(self, out)

    def test_small_bias_is_recorded_without_warning_and_survives_a_green_flip(self):
        p, q = pn.ddx(self.h) + 0.05, pn.ddy(self.h) + 0.05
        biased = pn.encode(pn.from_slopes(p, q))
        _, info = pn.process_normal(biased, self.alb, N)
        self.assertGreater(info["mean_slope_removed"]["tilt_deg"], 3.0)
        self.assertFalse(any("tilt bias" in w for w in info["warnings"]))
        dx = self.flip_green(biased)                                          # flipped by the convention step afterwards
        out, info = pn.process_normal(dx, self.alb, N)
        self.assertTrue(info["convention"]["flipped"])
        self.assertLess(info["mean_slope_final"]["tilt_deg"], 0.5)

    # ---- registration gate
    def test_registration_uncertain_when_blocks_disagree(self):
        # top half of the map is offset by +3 rows, bottom half is aligned: no single shift fits the blocks
        rolled = self.truth.copy()
        rolled[: N // 2] = np.roll(self.truth, 3, 0)[: N // 2]
        out, info = pn.process_normal(rolled, self.alb, N)
        r = info["registration"]
        agree = r["block_agreement"]
        self.assertFalse(agree["trusted"], r)
        self.assertFalse(r["applied"])
        self.assertTrue(r["uncertain"], r)                                           # gain >= 0.01 but not confirmed
        self.assertTrue(any("registration_uncertain" in w for w in info["warnings"]))
        self.assertLess(float(angle_deg(out, rolled).mean()), 0.8)                    # not moved

    def test_block_consensus_median_and_thresholds(self):
        mk = lambda dys: [(dy, 0.0, 30.0) for dy in dys]
        c = pn.block_consensus(mk([2.0] * 10 + [5.0] * 6))
        self.assertTrue(c["trusted"])
        self.assertEqual((c["median_sy"], c["agree"], c["usable"]), (2.0, 10, 16))
        self.assertFalse(pn.block_consensus(mk([2.0] * 9 + [5.0] * 7))["trusted"])     # 9/16 = 56% < 60%
        self.assertFalse(pn.block_consensus(mk([2.0] * 5))["trusted"])                 # fewer than 6 usable
        self.assertTrue(pn.block_consensus(mk([2.0] * 6))["trusted"])
        mixed = [(2.0, 0.0, 30.0)] * 8 + [(2.0, 0.0, 3.0)] * 8                          # weak peaks do not count
        self.assertEqual(pn.block_consensus(mixed)["usable"], 8)
        diag = [(0.8, 0.8, 30.0)] * 6 + [(0.0, 0.0, 30.0)] * 10                         # 1.13 px away: Euclidean > 1 px
        self.assertEqual(pn.block_consensus(diag)["agree"], 10)

    def test_block_median_wins_over_a_biased_ncc_estimate(self):
        rolled = np.roll(self.truth, (4, -1), (0, 1))
        real = pn.estimate_shift

        def biased(eN, eL, max_shift=pn.MAX_SHIFT):                    # the broad/skewed NCC peak reads far too much
            est = real(eN, eL, max_shift)
            est["sy"], est["sx"] = est["sy"] * 1.5, est["sx"] - 0.9
            return est
        pn.estimate_shift = biased
        try:
            out, info = pn.process_normal(rolled, self.alb, N)
        finally:
            pn.estimate_shift = real
        r = info["registration"]
        self.assertTrue(r["applied"], r)
        self.assertAlmostEqual(r["shift_sy"], -4, delta=0.6)
        self.assertAlmostEqual(r["shift_sx"], 1, delta=0.6)
        self.assertLess(r["ncc_shift_sy"], -5.0)                                       # the diagnostic keeps the bias
        self.assertLess(float(angle_deg(out, self.truth).mean()), 1.5)
        res = r["block_residual"]
        self.assertLess(abs(res["median_sy"]), 0.5)                                    # residuals centre near 0
        self.assertLess(abs(res["median_sx"]), 0.5)

    def test_a_shift_that_makes_the_overlap_worse_is_never_applied(self):
        real = pn.block_shifts
        pn.block_shifts = lambda eN, eL, grid=4: [(3.0, 0.0, 30.0)] * 16               # unanimous but wrong
        try:
            out, info = pn.process_normal(self.truth, self.alb, N)
        finally:
            pn.block_shifts = real
        r = info["registration"]
        self.assertFalse(r["applied"])
        self.assertFalse(r["uncertain"])
        self.assertIn("gain", r["decision"])
        self.assertTrue(any("trusted block shift" in w for w in info["warnings"]))     # not silent (>= 0.5 px, trusted)
        self.assertLess(r["ncc_candidate"], r["ncc_before"])
        self.assertLess(float(angle_deg(out, self.truth).mean()), 0.6)

    def test_no_clear_peak_and_incoherent_blocks_is_uncertain_not_just_unshifted(self):
        rng = np.random.default_rng(21)
        noise = pn.encode(pn.from_slopes(rng.normal(0, 0.1, (N, N)), rng.normal(0, 0.1, (N, N))))
        flat_albedo = np.full((N, N, 3), 140, dtype=np.uint8)                     # no edges to register against
        _, info = pn.process_normal(noise, flat_albedo, N)
        r = info["registration"]
        self.assertFalse(r["applied"])
        self.assertTrue(r["uncertain"], r)
        self.assertTrue(any("registration_uncertain" in w for w in info["warnings"]))

    def test_no_register_measures_but_does_not_move(self):
        rolled = np.roll(self.truth, (3, -2), (0, 1))
        out, info = pn.process_normal(rolled, self.alb, N, do_register=False)
        r = info["registration"]
        self.assertFalse(r["applied"])
        self.assertIn("disabled", r["decision"])
        self.assertAlmostEqual(r["shift_sy"], -3, delta=0.5)
        self.assertGreater(float(angle_deg(out, self.truth).mean()), 3.0)

    def test_random_noise_is_ambiguous_kept_and_warned(self):
        rng = np.random.default_rng(9)
        noise = pn.encode(pn.from_slopes(rng.normal(0, 0.3, (N, N)), rng.normal(0, 0.3, (N, N))))
        out, info = pn.process_normal(noise, self.alb, N)
        self.assertEqual(info["convention"]["decision"], "opengl")                 # prior wins
        self.assertFalse(info["convention"]["flipped"])
        self.assertIn("convention_ambiguous", info["convention"]["flags"])
        self.assertTrue(any("convention_ambiguous" in w for w in info["warnings"]))
        assert_unit_and_up(self, out)

    def test_inverted_relief_is_warned_not_flipped(self):
        out, info = pn.process_normal(self.truth, albedo_u8(self.h, -1.0), N)
        self.assertLess(info["relief_ncc"], -0.5)
        self.assertEqual(info["convention"]["decision"], "opengl")                 # confident curl: relief can't flip G
        self.assertFalse(info["convention"]["flipped"])
        self.assertTrue(any("inverted relief" in w for w in info["warnings"]))
        self.assertLess(float(angle_deg(out, self.truth).mean()), 0.6)            # untouched by the warning

    def test_non_periodic_input_gets_its_seam_removed(self):
        raw = smooth_vector_field(N, 11)
        out, info = pn.process_normal(raw, albedo_u8(height_field(N, 2)), N)
        b, a = info["seam"]["before"], info["seam"]["after"]
        self.assertGreater(max(b["edge_lr"], b["edge_tb"]), 8)                    # a real seam to start with
        self.assertLess(a["edge_lr"], b["edge_lr"] * 0.3)
        self.assertLess(a["edge_tb"], b["edge_tb"] * 0.3)
        assert_unit_and_up(self, out)

    def test_resize_from_larger_non_square_source(self):
        big = np.asarray(Image.fromarray(smooth_vector_field(N, 12)).resize((N + 40, N + 20), Image.LANCZOS))
        out, info = pn.process_normal(big, self.alb, N)
        self.assertEqual(out.shape, (N, N, 3))
        self.assertTrue(info["non_square_source"])
        self.assertTrue(any("non-square" in w for w in info["warnings"]))
        assert_unit_and_up(self, out)

    def test_tilt_and_length_stats(self):
        flat = np.full((N, N, 3), (128, 128, 255), dtype=np.uint8)
        out, info = pn.process_normal(flat, self.alb, N)
        self.assertEqual(info["tilt"]["near_flat_fraction"], 1.0)
        self.assertTrue(any("near-flat" in w for w in info["warnings"]))
        self.assertLess(abs(info["raw_vector_length"]["mean"] - 1.0), 0.02)
        self.assertLess(abs(info["delivered_vector_length"]["mean"] - 1.0), 0.01)


class SeamOrder(unittest.TestCase):
    """The seam is fixed before anything moves content: a shift must not carry the raw seam into the tile."""

    @staticmethod
    def periodic_bumps(n, seed, count=90):
        rng = np.random.default_rng(seed)
        yy, xx = np.mgrid[0:n, 0:n].astype(np.float64)
        h = np.zeros((n, n))
        for _ in range(count):
            cy, cx = rng.uniform(0, n, 2)
            s = rng.uniform(4, 14)
            a = rng.choice([-1, 1]) * rng.uniform(4, 14)
            dy = (yy - cy + n / 2) % n - n / 2
            dx = (xx - cx + n / 2) % n - n / 2
            h += a * np.exp(-(dy ** 2 + dx ** 2) / (2 * s * s))
        return h

    @staticmethod
    def gl_periodic(h):
        hc = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) / 2
        hr = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) / 2
        n = np.stack([-hc, hr, np.ones_like(h)], -1)
        n /= np.linalg.norm(n, axis=-1, keepdims=True)
        return np.clip(np.round((n * 0.5 + 0.5) * 255), 0, 255).astype(np.uint8)

    def test_band_ratio_finds_an_injected_seam_and_ignores_a_clean_wrap(self):
        h = self.periodic_bumps(128, 5, 40)
        clean = pn.encode(pn.from_slopes(pn.ddx(h), pn.ddy(h)))
        b = pn.band_ratio(clean)
        self.assertLess(b["max"], 3.0)
        seamed = clean.copy()
        seamed[:3] = np.roll(clean[:3], 11, 1)                                            # content jump between rows 2 and 3
        b2 = pn.band_ratio(seamed)
        self.assertGreater(b2["rows"], b["rows"] * 1.5)
        self.assertLessEqual(abs(b2["rows_pair"]), pn.BAND_K)

    def test_nonperiodic_raw_plus_applied_shift_keeps_the_seam_out_of_the_tile(self):
        N_, M = 256, 400
        H = self.periodic_bumps(M, 3)
        alb = pn.pd.to_uint8(np.repeat((0.5 + 0.2 * H[:N_, :N_] / np.abs(H).max())[..., None], 3, -1))
        raw = self.gl_periodic(pn.fourier_shift(H, 2.4, -1.7))[:N_, :N_]                 # natural crop, displaced content
        out, info = pn.process_normal(raw, alb, N_)
        r = info["registration"]
        self.assertTrue(r["applied"], r)
        self.assertGreater(max(abs(r["shift_sy"]), abs(r["shift_sx"])), 1.5)
        sm = info["seam"]
        self.assertGreater(sm["band_before"]["max"], 5)                                   # the raw really has a seam
        self.assertLessEqual(sm["band_after"]["max"], 1.8, sm["band_after"])              # ... and the delivered map none
        self.assertFalse(any("seam_band" in w for w in info["warnings"]))
        assert_unit_and_up(self, out)

    def test_seam_band_warning_for_a_raw_with_its_own_edge_band(self):
        h = height_field(N, 4, 4, 12)
        band = normal_u8(h).astype(int)
        band[0:6:2, :, 1] += 60                         # raised line-to-line difference along the top rows (not a wrap jump)
        _, info = pn.process_normal(np.clip(band, 0, 255).astype(np.uint8), albedo_u8(h), N)
        self.assertGreater(info["seam"]["band_after"]["max"], pn.BAND_WARN)
        self.assertTrue(any("seam_band" in w for w in info["warnings"]))

    def test_periodic_resize_commutes_with_a_roll_and_any_ratio_works(self):
        h = self.periodic_bumps(96, 2, 30)
        v = pn.from_slopes(pn.ddx(h), pn.ddy(h))
        a = pn.resize_vec_periodic(np.roll(v, (10, -6), (0, 1)), 48)
        b = np.roll(pn.resize_vec_periodic(v, 48), (5, -3), (0, 1))
        self.assertLess(float(np.abs(a - b).max()), 1e-9)                                  # exact: wrap, no clamped border
        c = pn.resize_vec(np.roll(v, (10, -6), (0, 1)), 48)                               # the clamped resize is not
        self.assertGreater(float(np.abs(c - b).max()), 1e-3)
        odd = pn.resize_vec_periodic(v[:95, :93], 61)                                      # sizes that do not divide
        self.assertEqual(odd.shape, (61, 61, 3))
        self.assertLess(float(np.abs(np.sqrt((odd * odd).sum(-1)) - 1).max()), 1e-9)


class AbsoluteSign(unittest.TestCase):
    """Independent encoder (np.gradient, written by hand - not pn.from_slopes/encode): raised dome in OpenGL."""

    @staticmethod
    def gl_from_height(h):
        hr, hc = np.gradient(h)                       # d/drow, d/dcol
        n = np.stack([hc * -1, hr, np.ones_like(h)], -1)       # (-dh/dx, -dh/dy_up, 1), dy_up = -drow
        n /= np.linalg.norm(n, axis=-1, keepdims=True)
        return np.clip(np.round((n * 0.5 + 0.5) * 255), 0, 255).astype(np.uint8)

    @staticmethod
    def dome(n=N, s=18.0, amp=24.0):
        yy, xx = np.mgrid[0:n, 0:n].astype(np.float64)
        return amp * np.exp(-((yy - n / 2) ** 2 + (xx - n / 2) ** 2) / (2 * s * s))

    def check_dome(self, out, raised=True):
        c, o = N // 2, 18
        top, bottom, left, right = out[c - o, c], out[c + o, c], out[c, c - o], out[c, c + o]
        sign = 1 if raised else -1
        self.assertEqual(int(top[1] > 128), int(sign > 0), top)             # top edge of a raised dome faces up: G > 128
        self.assertEqual(int(bottom[1] < 128), int(sign > 0), bottom)
        self.assertEqual(int(right[0] > 128), int(sign > 0), right)         # right edge faces right: R > 128
        self.assertEqual(int(left[0] < 128), int(sign > 0), left)
        self.assertGreater(abs(int(top[1]) - 128), 30)

    def test_raised_dome_and_pit_have_the_opengl_colours(self):
        h = self.dome()
        gl = self.gl_from_height(h)
        alb = albedo_u8(h)
        self.check_dome(gl)                                                 # the fixture itself is what we claim
        out, info = pn.process_normal(gl, alb, N)
        self.assertEqual(info["convention"]["decision"], "opengl")
        self.check_dome(out)
        pit_out, pit_info = pn.process_normal(self.gl_from_height(-h), albedo_u8(-h), N)
        self.assertEqual(pit_info["convention"]["decision"], "opengl")
        self.check_dome(pit_out, raised=False)

    def test_directx_encoded_dome_comes_out_flipped_to_the_same_opengl_colours(self):
        h = self.dome()
        gl = self.gl_from_height(h)
        dx = gl.copy()
        dx[..., 1] = 255 - dx[..., 1]
        out, info = pn.process_normal(dx, albedo_u8(h), N)
        self.assertEqual(info["convention"]["decision"], "directx")
        self.check_dome(out)
        out_gl, _ = pn.process_normal(gl, albedo_u8(h), N)
        self.assertLess(float(angle_deg(out, out_gl).mean()), 1.0)


class Cli(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.biome = Path(self._tmp.name)
        (self.biome / "normal" / "textures").mkdir(parents=True)
        (self.biome / "normal" / "logs").mkdir()
        (self.biome / "albedo64").mkdir()
        jobs = [
            {"id": "BIO01_a", "biome_id": "BIO-01", "name_vi": "Đầm lầy", "material": "Than bùn", "map": "normal"},
            {"id": "BIO24_b", "biome_id": "BIO-24", "name_vi": "Cổng", "material": "Đá", "map": "normal"},
            {"id": "BIO26_c", "biome_id": "BIO-26", "name_vi": "Mộng", "material": "Sân", "map": "normal"},
        ]
        (self.biome / "normal" / "manifest.json").write_text(json.dumps(jobs, ensure_ascii=False), encoding="utf-8")
        (self.biome / "normal" / "logs" / "BIO01_a.provenance.json").write_text(
            json.dumps({"thread_ids": ["t-123"], "model": "fake", "sha256": "x"}), encoding="utf-8")
        for jid, seed in (("BIO01_a", 1), ("BIO24_b", 2)):
            h64 = height_field(64, seed, 3, 10)      # raw is the same relief at 80 px, albedo at 64 px
            raw80 = pn.encode(pn.resize_vec(pn.decode_rgb(normal_u8(h64)), 80))
            Image.fromarray(raw80).save(self.biome / "normal" / "textures" / f"{jid}.png")
            Image.fromarray(albedo_u8(h64)).save(self.biome / "albedo64" / f"{jid}.png")
        self.argv = ["--biome", str(self.biome), "--size", "64", "--cell", "96", "--thumb", "48"]
        self.inputs = self.input_hashes()

    def tearDown(self):
        self._tmp.cleanup()

    def input_hashes(self):
        return {p.relative_to(self.biome).as_posix(): pn.pd.sha256_of(p)
                for d in ("normal/textures", "albedo64") for p in (self.biome / d).iterdir()}

    def meta(self):
        return json.loads((self.biome / "normal_metadata.json").read_text(encoding="utf-8"))

    def test_full_run_outputs_counts_and_immutable_inputs(self):
        self.assertEqual(pn.main(self.argv), 0)
        m = self.meta()
        self.assertEqual({k: m["counts"][k] for k in ("manifest_jobs", "raw_present", "delivered", "missing", "errors")},
                         {"manifest_jobs": 3, "raw_present": 2, "delivered": 2, "missing": 1, "errors": 0})
        self.assertTrue(m["sources_unchanged"])
        self.assertEqual(self.input_hashes(), self.inputs)
        for jid in ("BIO01_a", "BIO24_b"):
            out = self.biome / "normal64" / f"{jid}.png"
            with Image.open(out) as im:
                self.assertEqual((im.size, im.mode), ((64, 64), "RGB"))
                assert_unit_and_up(self, np.asarray(im))
        self.assertFalse((self.biome / "normal64" / "BIO26_c.png").exists())      # no fake output
        by = {e["id"]: e for e in m["entries"]}
        a = by["BIO01_a"]
        self.assertEqual(a["status"], "ready")
        self.assertEqual(a["raw"]["sha256"], self.inputs["normal/textures/BIO01_a.png"])
        self.assertEqual(a["raw"]["width"], 80)
        self.assertEqual(a["provenance"]["thread_ids"], ["t-123"])
        self.assertEqual(a["processing"]["source_sha256"], a["raw"]["sha256"])
        self.assertEqual(a["delivered"]["sha256"], pn.pd.sha256_of(self.biome / "normal64" / "BIO01_a.png"))
        for key in ("convention", "registration", "relief_ncc", "tilt", "seam", "raw_vector_length"):
            self.assertIn(key, a["metrics"])
        self.assertIn("block_residual", a["metrics"]["registration"])
        self.assertEqual(by["BIO26_c"]["status"], "missing")
        qa = self.biome / "normal_qa"
        for name in ("compare_sheet_01.png", "normals_repeat3x3_sheet_01.png", "lit_repeat3x3_sheet_01.png",
                     "thumbnails_all.png"):
            self.assertTrue((qa / name).is_file(), name)
        self.assertTrue((self.biome / "NORMALS_README.txt").is_file())

    def test_rerun_skips_unchanged_and_force_redoes(self):
        pn.main(self.argv)
        out = self.biome / "normal64" / "BIO01_a.png"
        before = out.stat().st_mtime_ns
        pn.main(self.argv)
        self.assertEqual(out.stat().st_mtime_ns, before)
        pn.main(self.argv + ["--force"])
        self.assertNotEqual(out.stat().st_mtime_ns, before)

    def test_changed_albedo_or_register_flag_reprocesses(self):
        pn.main(self.argv)
        out = self.biome / "normal64" / "BIO01_a.png"
        before = out.stat().st_mtime_ns
        pn.main(self.argv + ["--no-register"])
        self.assertNotEqual(out.stat().st_mtime_ns, before)
        self.assertFalse(self.meta()["register"])

    def test_only_limits_processing(self):
        pn.main(self.argv + ["--only", "BIO01_a"])
        self.assertTrue((self.biome / "normal64" / "BIO01_a.png").is_file())
        self.assertFalse((self.biome / "normal64" / "BIO24_b.png").exists())
        by = {e["id"]: e["status"] for e in self.meta()["entries"]}
        self.assertEqual(by, {"BIO01_a": "ready", "BIO24_b": "raw_only", "BIO26_c": "missing"})
        with self.assertRaises(SystemExit):
            pn.main(self.argv + ["--only", "NOPE"])

    def test_missing_albedo_is_a_counted_error(self):
        (self.biome / "albedo64" / "BIO24_b.png").unlink()
        pn.main(self.argv)
        m = self.meta()
        self.assertEqual(m["counts"]["errors"], 1)
        self.assertEqual(m["counts"]["delivered"], 1)

    def test_gallery_is_self_contained_with_all_cards(self):
        pn.main(self.argv)
        page = (self.biome / "gallery.normals.html").read_text(encoding="utf-8")
        self.assertEqual(len(re.findall(r'class="card st-', page)), 4)            # 3 manifest + BIO-25
        self.assertEqual(page.count("data:image/jpeg;base64,"), 6)                # 2 delivered x 3 thumbnails
        self.assertEqual(page.count("THIẾU"), 1)
        for text in ("OpenGL", "Codex gpt-6-astra", "albedo1024", "chưa tích hợp engine", "không vẽ thêm",
                     "BIO-25", "không có normal map"):
            self.assertIn(text, page)
        self.assertNotRegex(page, r'(src|href)="https?://')
        self.assertNotIn("<script", page)
        self.assertLess(page.index("BIO24_b"), page.index("BIO-25 · thẻ giải thích"))
        self.assertLess(page.index("BIO-25 · thẻ giải thích"), page.index("BIO26_c"))

    def test_compare_sheet_groups_at_most_eight_and_repeat_twelve(self):
        jobs = [{"id": f"BIO{n:02d}_x", "biome_id": f"BIO-{n:02d}", "name_vi": "n", "material": "m", "map": "normal"}
                for n in range(1, 14)]
        (self.biome / "normal" / "manifest.json").write_text(json.dumps(jobs), encoding="utf-8")
        for j in jobs:
            Image.fromarray(normal_u8(height_field(40, 5, 2, 8))).save(self.biome / "normal" / "textures" / f"{j['id']}.png")
            Image.fromarray(albedo_u8(height_field(64, 5, 3, 10))).save(self.biome / "albedo64" / f"{j['id']}.png")
        pn.main(self.argv)
        qa = self.meta()["outputs"]["qa"]
        self.assertEqual([len(s["ids"]) for s in qa["compare"]], [8, 5])
        self.assertEqual([len(s["ids"]) for s in qa["normals_repeat3x3"]], [12, 1])
        self.assertEqual([len(s["ids"]) for s in qa["lit_repeat3x3"]], [12, 1])

    def write_selection(self, raw_rel="reruns/textures/BIO01_a_v2.png", make_raw=True):
        rer = self.biome / "normal" / "reruns"
        (rer / "textures").mkdir(parents=True, exist_ok=True)
        (rer / "logs").mkdir(exist_ok=True)
        (rer / "prompts").mkdir(exist_ok=True)
        if make_raw:
            h = height_field(80, 77, 3, 10)
            Image.fromarray(normal_u8(h)).save(self.biome / "normal" / raw_rel)
        (rer / "logs" / "BIO01_a_v2.provenance.json").write_text(
            json.dumps({"thread_ids": ["t-v2"], "model": "fake2"}), encoding="utf-8")
        (rer / "prompts" / "BIO01_a_v2.txt").write_text("prompt v2", encoding="utf-8")
        sel = {"_note": "comment", "BIO01_a": {"raw": raw_rel, "provenance": "reruns/logs/BIO01_a_v2.provenance.json",
                                               "prompt": "reruns/prompts/BIO01_a_v2.txt", "why": "v2 broad drifts, tune normalScale"}}
        (self.biome / "normal" / "selection.json").write_text(json.dumps(sel), encoding="utf-8")

    def test_selection_uses_the_selected_raw_and_keys_idempotency_on_it(self):
        self.write_selection()
        v1_hashes = self.input_hashes()
        pn.main(self.argv)
        e = {x["id"]: x for x in self.meta()["entries"]}["BIO01_a"]
        v2 = self.biome / "normal" / "reruns" / "textures" / "BIO01_a_v2.png"
        self.assertEqual(e["raw"]["path"], "normal/reruns/textures/BIO01_a_v2.png")
        self.assertEqual(e["raw"]["sha256"], pn.pd.sha256_of(v2))
        self.assertNotEqual(e["raw"]["sha256"], v1_hashes["normal/textures/BIO01_a.png"])
        self.assertEqual(e["selection"]["version"], "v2")
        self.assertIn("broad drifts", e["selection"]["why"])
        self.assertEqual(e["provenance"]["thread_ids"], ["t-v2"])
        self.assertEqual(e["prompt_file"]["path"], "normal/reruns/prompts/BIO01_a_v2.txt")
        self.assertEqual(e["processing"]["source_sha256"], pn.pd.sha256_of(v2))
        page = (self.biome / "gallery.normals.html").read_text(encoding="utf-8")
        self.assertIn('class="badge">v2<', page)
        self.assertIn("broad drifts", page)
        self.assertIn("NoColorSpace", page)
        self.assertIn("normalScale", page)
        self.assertIn("độ nghiêng TB", page)
        self.assertIn("mean slope", page)
        out = self.biome / "normal64" / "BIO01_a.png"
        sha_v2, before = pn.pd.sha256_of(out), out.stat().st_mtime_ns
        sha_v2_raw = pn.pd.sha256_of(v2)
        pn.main(self.argv)                                                   # unchanged selection: skipped
        self.assertEqual(out.stat().st_mtime_ns, before)
        (self.biome / "normal" / "selection.json").unlink()                  # back to v1: must reprocess
        pn.main(self.argv)
        e = {x["id"]: x for x in self.meta()["entries"]}["BIO01_a"]
        self.assertEqual(e["raw"]["sha256"], v1_hashes["normal/textures/BIO01_a.png"])
        self.assertIsNone(e["selection"])
        self.assertNotEqual(pn.pd.sha256_of(out), sha_v2)
        self.assertEqual(pn.pd.sha256_of(v2), sha_v2_raw)                       # the v2 raw is never modified

    def test_missing_selected_raw_is_an_error_without_fallback(self):
        self.write_selection(make_raw=False)
        pn.main(self.argv)
        m = self.meta()
        e = {x["id"]: x for x in m["entries"]}["BIO01_a"]
        self.assertEqual(e["status"], "error")
        self.assertIn("no fallback", e["error"])
        self.assertFalse((self.biome / "normal64" / "BIO01_a.png").exists())      # v1 raw exists but is not used
        self.assertEqual(m["counts"]["errors"], 1)
        self.assertEqual(m["counts"]["delivered"], 1)

    def test_force_with_only_keeps_the_other_entries_metrics(self):
        pn.main(self.argv)
        before = {e["id"]: e for e in self.meta()["entries"]}
        pn.main(self.argv + ["--force", "--only", "BIO01_a"])
        after = {e["id"]: e for e in self.meta()["entries"]}
        self.assertIsNotNone(after["BIO24_b"]["metrics"])
        self.assertEqual(after["BIO24_b"]["metrics"], before["BIO24_b"]["metrics"])
        self.assertEqual(after["BIO24_b"]["warnings"], before["BIO24_b"]["warnings"])
        self.assertEqual(after["BIO24_b"]["delivered"]["sha256"], before["BIO24_b"]["delivered"]["sha256"])
        self.assertEqual(after["BIO24_b"]["status"], "ready")

    def test_metadata_records_the_current_convention_rule_and_all_source_hashes(self):
        pn.main(self.argv)
        m = self.meta()
        rule = m["parameters"]["convention_rule"]
        for text in ("0.75", "1.33", "0.3", "0.4"):
            self.assertIn(text, rule)
        self.assertNotIn("0.85", rule)
        self.assertEqual(m["parameters"]["convention_thresholds"],
                         {"r_directx_max": pn.CONV_R_DX, "r_opengl_min": pn.CONV_R_GL,
                          "d_conflict": pn.CONV_D_CONFLICT, "d_decide": pn.CONV_D_DECIDE})
        self.assertTrue(m["raw_sources_unchanged"])
        self.assertTrue(m["albedo_sources_unchanged"])
        self.assertTrue(m["sources_unchanged"])
        e = m["entries"][0]
        self.assertIn("band_after", e["metrics"]["seam"])
        self.assertIn("band_before", e["metrics"]["seam"])
        self.assertTrue((self.biome / "normal_qa" / "tile_corners_01.png").is_file())
        self.assertEqual(len(m["outputs"]["qa"]["tile_corners"]), 1)

    def test_selection_of_unknown_id_is_rejected(self):
        (self.biome / "normal" / "selection.json").write_text(json.dumps({"NOPE": {"raw": "x.png"}}), encoding="utf-8")
        with self.assertRaises(SystemExit):
            pn.main(self.argv)

    def test_cli_under_isolated_interpreter(self):
        cp = subprocess.run([sys.executable, "-I", str(Path(pn.__file__)), *self.argv], capture_output=True, text=True,
                            encoding="utf-8")
        self.assertEqual(cp.returncode, 0, cp.stderr)
        self.assertTrue((self.biome / "normal64" / "BIO01_a.png").is_file())
        self.assertEqual(self.input_hashes(), self.inputs)


if __name__ == "__main__":
    unittest.main()
