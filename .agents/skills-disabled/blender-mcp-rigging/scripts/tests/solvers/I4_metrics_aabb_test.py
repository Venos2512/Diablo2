"""I4 tests: solvers.metrics.aabb_pairs (the penetration broad phase) against a brute-force box-overlap reference.

I4 rewrote its pair bookkeeping for speed (each pair kept in the first grid cell its two boxes share instead of a ``np.unique``
of every candidate; within one set only i < j generated): the output must stay exactly the set of overlapping closed boxes,
sorted by (i, j), whatever the grid cell size.
"""
import os
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import numpy as np  # noqa: E402
import pytest  # noqa: E402

from solvers import metrics as mx  # noqa: E402


def brute(lo_a, hi_a, lo_b=None, hi_b=None):
    same = lo_b is None
    lo_b, hi_b = (lo_a, hi_a) if same else (lo_b, hi_b)
    ov = np.all(lo_a[:, None, :] <= hi_b[None, :, :], axis=2) & np.all(lo_b[None, :, :] <= hi_a[:, None, :], axis=2)
    if same:
        ov &= np.triu(np.ones(ov.shape, bool), 1)
    i, j = np.nonzero(ov)  # row-major: sorted by (i, j)
    return i.astype(np.int64), j.astype(np.int64)


def boxes(rng, n, scale=0.1, degenerate=0.1):
    lo = rng.uniform(-1, 1, (n, 3)) * rng.choice([1.0, 0.2], size=(1, 3))
    hi = lo + rng.exponential(scale, (n, 3)) * (rng.random((n, 1)) >= degenerate)
    return lo, hi


@pytest.mark.parametrize("seed", range(12))
def test_aabb_pairs_equals_brute_force(seed):
    rng = np.random.default_rng(seed)
    for _ in range(10):
        lo, hi = boxes(rng, int(rng.integers(1, 300)))
        lo2, hi2 = boxes(rng, int(rng.integers(1, 300)), scale=0.3)
        for args in ((lo, hi), (lo, hi, lo2, hi2), (lo2, hi2, lo, hi)):
            got, ref = mx.aabb_pairs(*args), brute(*args)
            assert np.array_equal(got[0], ref[0]) and np.array_equal(got[1], ref[1])
            assert got[0].dtype == np.int64 and got[1].dtype == np.int64
        for cell in (0.02, 0.05, 5.0):  # the grid is a broad phase only: any cell size gives the same pairs
            got = mx.aabb_pairs(lo, hi, cell=cell)
            ref = brute(lo, hi)
            assert np.array_equal(got[0], ref[0]) and np.array_equal(got[1], ref[1]), cell


def test_aabb_pairs_edge_cases():
    e = np.zeros((0, 3))
    one = np.array([[0.0, 0.0, 0.0]]), np.array([[1.0, 1.0, 1.0]])
    for args in ((e, e), (e, e, *one), (*one, e, e), one):
        a, b = mx.aabb_pairs(*args)
        assert a.size == 0 and b.size == 0
    lo = np.array([[0.0, 0, 0], [0.0, 0, 0], [1.0, 1, 1], [2.0, 2, 2]])  # identical boxes, touching corners, a far one
    hi = np.array([[1.0, 1, 1], [1.0, 1, 1], [1.5, 1.5, 1.5], [2.0, 2, 2]])
    a, b = mx.aabb_pairs(lo, hi)
    assert list(zip(a.tolist(), b.tolist())) == [(0, 1), (0, 2), (1, 2)]  # closed boxes: touching counts
    a, b = mx.aabb_pairs(lo, hi, lo, hi)
    assert list(zip(a.tolist(), b.tolist())) == [(i, j) for i, j in zip(*brute(lo, hi, lo, hi))]
