"""rigcore.geom - small vector helpers and the bone-roll geometry shared by Blender and solver code.

Units: metres.  Frame: Blender, Z up, character front -Y, character left +X.  Vectors are plain 3-tuples of Python floats (any
3-sequence or numpy row is accepted as input); no numpy is needed here, so these run anywhere.

``on_line``, ``bend_normal`` and ``roll_z`` are ports of the same-named functions in D01's ``d01_rig_def.py`` and give identical
numbers (the tests compare them bit for bit on all D01 bones).
"""
from __future__ import annotations

import math

Vec = tuple  # (x, y, z)

X: Vec = (1.0, 0.0, 0.0)
Y: Vec = (0.0, 1.0, 0.0)
Z: Vec = (0.0, 0.0, 1.0)
ZERO: Vec = (0.0, 0.0, 0.0)


def vec(v) -> Vec:
    """Any 3-sequence -> tuple of 3 floats (ValueError otherwise)."""
    t = tuple(float(c) for c in v)
    if len(t) != 3:
        raise ValueError(f"expected 3 components, got {len(t)}")
    return t


def add(a, b) -> Vec:
    return (a[0] + b[0], a[1] + b[1], a[2] + b[2])


def sub(a, b) -> Vec:
    return (a[0] - b[0], a[1] - b[1], a[2] - b[2])


def scale(a, s: float) -> Vec:
    return (a[0] * s, a[1] * s, a[2] * s)


def neg(a) -> Vec:
    return (-a[0], -a[1], -a[2])


def dot(a, b) -> float:
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]


def cross(a, b) -> Vec:
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def norm(a) -> float:
    return math.sqrt(dot(a, a))


def dist(a, b) -> float:
    return norm(sub(a, b))


def unit(a) -> Vec:
    """Unit vector; ValueError for a zero vector."""
    n = norm(a)
    if n == 0.0:
        raise ValueError("cannot normalize a zero vector")
    return (a[0] / n, a[1] / n, a[2] / n)


def lerp(a, b, t: float) -> Vec:
    """a + t (b - a); ``t`` may lie outside [0, 1]."""
    return (a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]), a[2] + t * (b[2] - a[2]))


def mid(a, b) -> Vec:
    return lerp(a, b, 0.5)


def mirror_x(p, x0: float = 0.0) -> Vec:
    """Mirror about the plane x = x0 (arms, ears: x0 = 0; D01 legs: x0 = leg_mirror_x)."""
    return (2.0 * x0 - p[0], p[1], p[2])


def axis_vector(spec: str) -> Vec:
    """'+X', '-Y', 'Z' (case-insensitive, sign optional) -> world unit vector."""
    s = spec.strip().upper()
    sign = 1.0
    if s and s[0] in "+-":
        sign = -1.0 if s[0] == "-" else 1.0
        s = s[1:]
    if s not in ("X", "Y", "Z"):
        raise ValueError(f"bad axis {spec!r}; expected +X, -X, +Y, -Y, +Z or -Z")
    return tuple(c + 0.0 for c in scale({"X": X, "Y": Y, "Z": Z}[s], sign))  # "+ 0.0" turns -0.0 into 0.0


def project_perp(v, d) -> Vec:
    """Component of ``v`` perpendicular to the UNIT vector ``d``."""
    k = dot(v, d)
    return (v[0] - k * d[0], v[1] - k * d[1], v[2] - k * d[2])


def angle_deg(a, b) -> float:
    """Unsigned angle between two vectors in degrees (0..180)."""
    na, nb = norm(a), norm(b)
    if na == 0.0 or nb == 0.0:
        raise ValueError("angle of a zero vector")
    c = max(-1.0, min(1.0, dot(a, b) / (na * nb)))
    return math.degrees(math.acos(c))


def signed_angle_deg(a, b, axis) -> float:
    """Angle from ``a`` to ``b`` about ``axis`` (right-hand rule), degrees in (-180, 180]. ``a``/``b`` are projected into the plane
    perpendicular to ``axis`` first."""
    n = unit(axis)
    pa, pb = project_perp(a, n), project_perp(b, n)
    return math.degrees(math.atan2(dot(cross(pa, pb), n), dot(pa, pb)))


def on_line(a, m, b) -> Vec:
    """Point on the line a-b nearest to ``m`` (D01 ``on_line``; used to project the elbow onto the shoulder-wrist line)."""
    ab = sub(b, a)
    den = dot(ab, ab)
    if den == 0.0:
        raise ValueError("on_line: a and b coincide")
    t = dot(sub(m, a), ab) / den
    return (a[0] + t * ab[0], a[1] + t * ab[1], a[2] + t * ab[2])


def prebend(a, m, b, offset=(0.0, 0.0, 0.0)) -> Vec:
    """Builder helper (rigcore itself never calls it): the joint ``m`` moved onto the line a-b, plus ``offset`` (metres). This is the
    elbow fit of D01 ``fitted_landmarks``: ``prebend(shoulder, elbow, wrist, (0, 0.0033, 0))``. A measured arm or leg is nearly
    straight, so the bend plane through the raw points is arbitrary (D01 arm: 59 degrees off): fit first, then resolve."""
    e = on_line(a, m, b)
    return (e[0] + offset[0], e[1] + offset[1], e[2] + offset[2])


def bend_normal(a, m, b, min_sin: float = 1e-9) -> Vec:
    """Unit normal of the bend plane a-m-b = unit(cross(m - a, b - m)): the true hinge axis of an elbow or knee (D01 ``bend_normal``).
    Positive rotation about it bends the distal point further along the existing bend. ValueError when a, m, b are (nearly)
    collinear (sine of the bend angle below ``min_sin``): pre-bend the joint first."""
    u = sub(m, a)
    f = sub(b, m)
    c = cross(u, f)
    nu, nf = norm(u), norm(f)
    if nu == 0.0 or nf == 0.0 or norm(c) <= min_sin * nu * nf:
        raise ValueError("bend_normal: the three points are collinear (straight limb or coincident points); pre-bend the joint")
    return unit(c)


def roll_z(head, tail, hinge) -> tuple[Vec, Vec]:
    """Identical to D01 ``roll_z``: returns ``(z_vec, hinge_perp)``.

    ``hinge_perp`` is the hinge made perpendicular to the bone direction d = unit(tail - head) (the wanted local X); ``z_vec`` =
    hinge_perp x d is the world vector the bone's local +Z must point to so that local X ~ hinge (Blender bones: local Y along
    head->tail, local Z = X x Y). If the hinge is parallel to the bone (|hinge_perp| < 1e-6) a fallback X (or Y when the bone is
    nearly along X) is used, as in D01.
    """
    d = unit(sub(tail, head))
    hp = project_perp(hinge, d)
    if norm(hp) < 1e-6:
        hp = (1.0, 0.0, 0.0) if abs(d[0]) < 0.9 else (0.0, 1.0, 0.0)
    hp = unit(hp)
    return unit(cross(hp, d)), hp


def roll_z_vector(head, tail, hinge) -> Vec:
    """World vector the bone's local +Z must point to, so that local X ~ ``hinge`` (``roll_z(...)[0]``).

    Blender use: ``edit_bone.align_roll(roll_z_vector(head, tail, hinge))`` (``align_roll`` takes the target Z axis in the armature
    frame; a rolled-by-180 degrees alternative is the negated vector)."""
    return roll_z(head, tail, hinge)[0]
