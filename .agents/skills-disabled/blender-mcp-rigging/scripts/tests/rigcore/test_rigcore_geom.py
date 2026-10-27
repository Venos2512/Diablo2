"""rigcore.geom: vector helpers, and bit-for-bit agreement with D01's d01_rig_def (on_line, bend_normal, roll_z)."""
import importlib.util
import math
import os
import sys

import numpy as np
import pytest

from rigcore import geom


@pytest.fixture(scope="module")
def d01(d01_tools_dir):
    """d01_rig_def imported by path, read-only (it reads landmarks.json next to itself; no bytecode is written: conftest)."""
    path = os.path.join(d01_tools_dir, "d01_rig_def.py")
    spec = importlib.util.spec_from_file_location("d01_rig_def_ro", path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules["d01_rig_def_ro"] = mod
    spec.loader.exec_module(mod)
    return mod


def test_roll_z_vector_equals_d01_on_all_bones(d01):
    bones = d01.build()
    assert len(bones) == 35
    for b in bones:
        z_ref, hp_ref = d01.roll_z(b["head"], b["tail"], b["hinge"])
        z, hp = geom.roll_z(b["head"], b["tail"], b["hinge"])
        assert z == z_ref and hp == hp_ref, b["name"]  # identical floats, not just close
        assert geom.roll_z_vector(b["head"], b["tail"], b["hinge"]) == z_ref


def test_roll_z_vector_equals_d01_on_degenerate_and_random(d01):
    cases = [
        ((0, 0, 0), (0, 0, 1), (0, 0, 1)),  # hinge parallel to bone: fallback X
        ((0, 0, 0), (1, 0, 0), (1, 0, 0)),  # bone along X, hinge along X: fallback Y (|d.x| >= 0.9)
        ((0, 0, 0), (0.95, 0.1, 0), (0.95, 0.1, 0)),
        ((0, 0, 0), (0, 0, -1), (0, 0, 2.0)),  # antiparallel
        ((0.1, 0.2, 0.3), (0.1, 0.2, 0.3 + 1e-3), (0, 1, 0)),
    ]
    rng = np.random.default_rng(5)
    for _ in range(200):
        h, t, hi = (tuple(rng.normal(size=3)) for _ in range(3))
        cases.append((h, t, hi))
    for h, t, hi in cases:
        assert geom.roll_z(h, t, hi) == d01.roll_z(h, t, hi)


def test_roll_z_geometry_local_x_matches_hinge():
    """Blender bone frame: Y = head->tail, Z = roll_z_vector, X = Y x Z. X must be the hinge made perpendicular to the bone."""
    rng = np.random.default_rng(1)
    for _ in range(50):
        h, t, hi = (tuple(rng.normal(size=3)) for _ in range(3))
        d = geom.unit(geom.sub(t, h))
        z = geom.roll_z_vector(h, t, hi)
        x = geom.cross(d, z)
        hp = geom.unit(geom.project_perp(hi, d))
        assert geom.norm(geom.sub(x, hp)) < 1e-12
        assert abs(geom.dot(z, d)) < 1e-12 and abs(geom.norm(z) - 1) < 1e-12


def test_on_line_and_bend_normal_equal_d01(d01):
    lm = d01.LM
    for a, m, b in [(lm["arm_L"]["shoulder"], lm["arm_L"]["elbow"], lm["arm_L"]["wrist"]),
                    (lm["leg_L"]["hip"], lm["leg_L"]["knee"], lm["leg_L"]["ankle"])]:
        assert geom.on_line(a, m, b) == d01.on_line(a, m, b)
        assert geom.bend_normal(a, m, b) == d01.bend_normal(a, m, b)
    # on the mirrored side too
    sh, el, wr = (d01.mir_arm(p) for p in (lm["arm_L"]["shoulder"], lm["arm_L"]["elbow"], lm["arm_L"]["wrist"]))
    assert geom.bend_normal(sh, el, wr) == d01.bend_normal(sh, el, wr)


def test_bend_normal_collinear_raises():
    with pytest.raises(ValueError, match="collinear"):
        geom.bend_normal((0, 0, 0), (1, 0, 0), (2, 0, 0))
    with pytest.raises(ValueError, match="collinear"):
        geom.bend_normal((0, 0, 0), (0, 0, 0), (2, 0, 0))
    # a 4 degree bend (the D01 pre-bend) is fine
    n = geom.bend_normal((0, 0, 0), (1, 0, 0), (1 + math.cos(math.radians(4)), math.sin(math.radians(4)), 0))
    assert n == pytest.approx((0, 0, 1))


def test_basic_helpers():
    assert geom.lerp((0, 0, 0), (2, 4, 6), 0.25) == (0.5, 1.0, 1.5)
    assert geom.lerp((0, 0, 0), (2, 4, 6), 1.5) == (3.0, 6.0, 9.0)
    assert geom.mid((0, 0, 0), (2, 2, 2)) == (1.0, 1.0, 1.0)
    assert geom.mirror_x((1, 2, 3)) == (-1.0, 2, 3)
    assert geom.mirror_x((0.0525, 2, 3), 0.0105) == (2 * 0.0105 - 0.0525, 2, 3)
    assert geom.axis_vector("+X") == (1.0, 0.0, 0.0) and geom.axis_vector("-y") == (0.0, -1.0, 0.0)
    assert geom.axis_vector("Z") == (0.0, 0.0, 1.0)
    assert repr(geom.axis_vector("-Y")) == "(0.0, -1.0, 0.0)"  # no negative zeros
    for bad in ("W", "+XY", ""):
        with pytest.raises(ValueError):
            geom.axis_vector(bad)
    with pytest.raises(ValueError):
        geom.unit((0, 0, 0))
    with pytest.raises(ValueError):
        geom.vec((1, 2))
    assert geom.vec(np.array([1, 2, 3])) == (1.0, 2.0, 3.0) and all(type(c) is float for c in geom.vec(np.array([1, 2, 3])))
    assert geom.angle_deg((1, 0, 0), (0, 1, 0)) == pytest.approx(90)
    assert geom.signed_angle_deg((1, 0, 0), (0, 1, 0), (0, 0, 1)) == pytest.approx(90)
    assert geom.signed_angle_deg((1, 0, 0), (0, 1, 0), (0, 0, -1)) == pytest.approx(-90)
    assert geom.dist((0, 0, 0), (3, 4, 0)) == 5.0
    with pytest.raises(ValueError):
        geom.on_line((1, 1, 1), (0, 0, 0), (1, 1, 1))
