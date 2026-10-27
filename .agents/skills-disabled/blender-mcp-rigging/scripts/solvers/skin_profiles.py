"""solvers.skin_profiles - joint profiles for linear blend skinning (owner B, P3; references/skinning.md "Joint profiles").

``apply_profiles`` runs, in this order:

1. **Creases**, each a split between a proximal side (bone A + the twist bones parented to A) and a distal side (bone B + its twist
   bones) across a plane through B's head whose normal is the bisector of the two bone directions; u = signed distance (m, + toward
   B); the internal split of each side (e.g. a twist ramp) is kept by scaling the side's columns.

   * **wrist** (ForeArm | Hand), hard: on every row with forearm-side or Hand weight within half a forearm length of the forearm
     or hand segment (``Crease.zone``; review r2 N3: in an A-pose the distal half-space reaches the shins) the hand share is
     clip(0.5 + uu/(2h), 0, 1), h = 0.5 x ``wrist_rings`` (2) x median edge length near the wrist; no hand-back to the
     candidate's split, so the Hand has no weight on the forearm beyond the band.
   * **elbow**, **knee**, soft: within h of the plane (h = 0.5 x ``crease_rings`` (3) x local edge length) the distal share is
     the profile p = clip(0.5 + uu/(2h), 0, 1); from h to 2h the candidate's own share is clipped into an envelope that widens from
     [p, p] to [0, 1] (smoothstep), so it hands back to the candidate continuously and a second application changes nothing.

   ``uu = u + bias x h x inner``: inner-crease rows (the side the joint folds toward, ``inner`` in [0, 1] up to r = half the
   shorter bone from the joint) lean to the distal bone, which limits the collapse (elbow and knee: fold side from the hinge,
   oriented by the pre-bend; wrist: the palm side from the Hand hinge, whose sign the builder fixes by the bend test "hand tip
   goes down at T-pose").
   The wrist runs first: its moves from the Hand to the forearm side would otherwise change the forearm mass after the elbow
   split had been set, and a second application would move the elbow split again.
2. **Twist ramps**, per twist bone T with segment bone G = T's parent: t = position along G clamped to [0, 1]; m = the row's
   weight on G + T; only m is re-split, every other bone (also the twist driver) is untouched.

   * driver distal (forearm: driver Hand, factor f > 0): T = m t, G = m (1 - t) -> effective twist f t (0 at the elbow, f at the
     wrist); the Hand gets no forearm weight;
   * driver = G (upper arm, f < 0): t0 = T's head position on G clamped to [0, 0.9], a = clamp((t - t0)/(1 - t0), 0, 1),
     G = m a, T = m (1 - a) -> roll share 1 + f (1 - a): 1 + f from the shoulder to t0, then linear to 1 at the elbow.

   Several twist bones on one segment use the same targets through ``twist_ramp_weights`` (between the two bones whose twist
   fractions bracket the target).
3. **Influence caps** run inside ``skin_common.enforce`` after top-k and prune (``cap_rule`` builds the bone groups): shoulder and
   hip blend rows at most 3 when their 4th+ influences sum < ``cap_extra_tol`` (0.05), else kept (up to 4) and reported
   (``blend_rows_kept_over_cap_<group>``; review r2: a hard cap removed up to 0.23 of a row on FL and added 339 weight-jump
   edges, while G2 itself has 4th hip influences up to 0.093); finger rows 2 (hard); any row capped to 2 only when its 3rd+
   influences sum < ``cap_extra_tol``. ``limb_groups`` tells ``enforce`` where the weight of a dropped limb entry goes: its twist
   unit, else the other side of the crease that splits it, only on the rows where that crease acts (``Crease.zone``); elsewhere
   it is renormalized over the row. So the profiles find the same split when they run again.

4. **Limb envelope** (``apply_limb_envelope``; not part of ``apply_profiles``: the candidates call it before ``finish``, and it
   is never a gate inside ``enforce``): references/skinning.md "Candidate B limb envelope" (review B r3). Where a candidate's raw
   weights reach far from a limb root (proxy heat diffusing through a robe into the torso, inverse distance on a belly next to
   the thigh), the columns of each limb root's unit are multiplied by a smooth factor and the rows renormalized:

       e(X) = (1 - S((d/L - d0) / (d1 - d0))) x (1 - S((h/L - h0) / (h1 - h0))),   S = smoothstep 3x^2 - 2x^3 on [0, 1]

   d = distance from X to the root's segment, h = height of X above the root's head joint along the bone axis, L = segment
   length. ``LIMB_ENVELOPE``: UpperArm (+ its twist bones) d in [0.5, 0.75] L; Thigh d in [0.75, 1.25] L and h in [0.1, 0.3] L
   (calibrated on D01 and FL in review B r3; recalibrate at P5). Other bones (forearm, hand, calf, foot, toes, aux) keep their
   weights: approved rigs carry legitimate long-range weight there. Candidate B applies it to the raw proxy heat and again to the
   mesh rows after the inpaint; candidate A's generic path (no asset steps) to the raw inverse-distance weights and again after
   the smoothing passes (I4: the smoothing alone re-spread 30 / 56 leaking rows on D01 / FL after the first stage).

Every profile is a fixed function of the vertex position and of the row's own weights that returns its input when applied to its
output (idempotent to rounding). ``measure_hip_transition``, ``twist_bins``, ``wrist_extent`` and ``crease_coverage`` only
measure.

Units: metres. Frame: Blender, Z up, front -Y, left +X. numpy + skin_common only.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping

import numpy as np

from solvers import skin_common as sc

PROFILE_DEFAULTS = {"enabled": True, "crease": True, "crease_rings": 3.0, "crease_bias": 0.25, "wrist": True, "wrist_rings": 2.0,
                    "wrist_bias": 0.25, "twist": True, "caps": True, "cap_extra_tol": 0.05}
# (profile key, proximal bone, distal bone, hard band); the wrist first (module docstring)
CREASES = (("wrist", "{S}_ForeArm", "{S}_Hand", True), ("elbow", "{S}_UpperArm", "{S}_ForeArm", False),
           ("knee", "{S}_Thigh", "{S}_Calf", False))
# cap-rule blend groups: (profile key = max_influences_by_region key, column set a, column set b)
BLEND_GROUPS = (("shoulder", ("{S}_UpperArm", "{S}_UpperArm_twist"), ("chest", "{S}_Clavicle")),
                ("hip", ("{S}_Thigh",), ("pelvis", "spine_01")))
FINGER_WORDS = ("thumb", "index", "middle", "ring", "pinky", "little", "finger")
MASS_EPS = 1e-6  # rows with less mass on a profile's bones are not counted in the reports


def profile_config(cfg: Mapping | None) -> dict:
    """``rules["profiles"]`` merged over ``PROFILE_DEFAULTS``; unknown keys (other than ``note``) raise ``RuleError``."""
    cfg = dict(cfg or {})
    unknown = sorted(set(cfg) - set(PROFILE_DEFAULTS) - {"note"})
    if unknown:
        raise sc.RuleError(f"profiles: unknown keys {unknown} (known: {sorted(PROFILE_DEFAULTS)})")
    return {**PROFILE_DEFAULTS, **cfg}


# --------------------------------------------------------------------------------------------------------------------------
# creases
# --------------------------------------------------------------------------------------------------------------------------


@dataclass
class Crease:
    """One crease joint on one side. ``side_a``/``side_b`` column lists (main bone first); ``J`` joint (m); ``n`` unit normal
    (proximal -> distal); ``f`` unit inner (fold) direction or None; ``r`` radius (m) of the joint neighbourhood; ``ring`` median
    edge length there (m); ``h`` half width (m); ``bias``; ``hard``; ``segs`` the (head, tail) segments of the two main bones and
    ``reach`` (m) the hard crease's distance limit from them (``zone``)."""

    name: str
    hard: bool
    side_a: list
    side_b: list
    J: np.ndarray
    n: np.ndarray
    f: np.ndarray | None
    r: float
    ring: float
    h: float
    bias: float
    segs: tuple = ()
    reach: float = 0.0

    def coords(self, P):
        """(u, uu, inner) for points P: signed distance, distance with the inner-crease bias, inner factor."""
        D = np.asarray(P, dtype=np.float64) - self.J
        u = D @ self.n
        if self.f is None:
            inner = np.zeros(len(D))
        else:
            inner = np.clip((D @ self.f) / max(self.r, 1e-12), 0.0, 1.0)
            inner[np.linalg.norm(D, axis=1) >= self.r] = 0.0
        return u, u + self.bias * self.h * inner, inner

    def zone(self, P, uu=None) -> np.ndarray:
        """Rows (bool) where the crease acts, whatever their weights: soft (elbow, knee) |P - J| < r and |uu| < 2h; hard (wrist)
        within ``reach`` (0.5 x forearm length) of the forearm or hand segment, so an A-pose's distal half-space (shins) is out
        (review r2 N3)."""
        P = np.asarray(P, dtype=np.float64)
        if self.hard:
            if not self.segs:  # built by hand without its segments: no distance limit
                return np.ones(len(P), bool)
            d = np.min([sc.seg_dist(P, a, b)[0] for a, b in self.segs], axis=0)
            return d < self.reach
        if uu is None:
            uu = self.coords(P)[1]
        return (np.linalg.norm(P - self.J, axis=1) < self.r) & (np.abs(uu) < 2.0 * self.h)

    def describe(self, names) -> dict:
        return {"joint": self.name, "hard": self.hard, "half_width_m": self.h, "ring_m": self.ring, "radius_m": self.r,
                "reach_m": self.reach if self.hard else None, "bias": self.bias, "side_a": [names[j] for j in self.side_a],
                "side_b": [names[j] for j in self.side_b], "inner_dir": None if self.f is None else [float(c) for c in self.f]}


def _twist_children(bones: sc.BoneSet, name: str) -> list:
    return [i for i, p in enumerate(bones.parent) if p == name and bones.kind[i] == "twist"]


def crease_specs(topo: sc.WeldTopo, bones: sc.BoneSet, cfg: Mapping) -> tuple[list, list]:
    """The enabled creases of ``cfg`` that exist on this skeleton. Returns (specs, skipped notes)."""
    idx = bones.index
    out, skipped = [], []
    for key, pa, pb, hard in CREASES:
        if not cfg["wrist" if key == "wrist" else "crease"]:
            continue
        rings = float(cfg["wrist_rings" if key == "wrist" else "crease_rings"])
        bias = float(cfg["wrist_bias" if key == "wrist" else "crease_bias"])
        for side in ("L", "R"):
            A, B = sc.sub_side(pa, side), sc.sub_side(pb, side)
            if A not in idx or B not in idx:
                continue
            a, b = idx[A], idx[B]
            J = bones.head[b].copy()
            dA = sc._unit(bones.tail[a] - bones.head[a])
            dB = sc._unit(bones.tail[b] - bones.head[b])
            n = sc._unit(dA + dB)
            r = 0.5 * min(bones.length(a), bones.length(b))
            ring = topo.median_edge_near(J, r)
            if ring is None:
                skipped.append(f"{key}_{side}: no mesh edge within {r:.3g} m of the joint")
                continue
            f = np.cross(bones.hinge[b], dB)
            if np.linalg.norm(f) > 1e-9:
                f = sc._unit(f)
                if not hard:  # elbow / knee: orient by the pre-bend (the joint sticks out on the outer side)
                    line_d = sc._unit(bones.tail[b] - bones.head[a])
                    pre = (bones.head[a] + line_d * float((J - bones.head[a]) @ line_d)) - J
                    if np.linalg.norm(pre) > 1e-6 * bones.H and float(pre @ f) < 0:
                        f = -f
            else:
                f = None
            out.append(Crease(name=f"{key}_{side}", hard=hard, side_a=[a] + _twist_children(bones, A),
                              side_b=[b] + _twist_children(bones, B), J=J, n=n, f=f, r=r, ring=ring, h=0.5 * rings * ring,
                              bias=bias, segs=((bones.head[a], bones.tail[a]), (bones.head[b], bones.tail[b])),
                              reach=0.5 * bones.length(a)))
    return out, skipped


def crease_share(c: Crease, uu, cur=None):
    """Distal share on rows with biased distance ``uu``: hard -> the profile; soft -> ``cur`` clipped into the envelope."""
    p = np.clip(0.5 + uu / (2.0 * c.h), 0.0, 1.0)
    if c.hard:
        return p
    s = sc.smoothstep((np.abs(uu) - c.h) / c.h)  # 0 within h, 1 beyond 2h
    return np.clip(cur, p * (1.0 - s), p + (1.0 - p) * s)


def apply_crease(W, P, c: Crease):
    """One crease on welded weights ``W`` (n,k) at positions ``P`` (module docstring). Returns (W, info)."""
    W = np.array(W, dtype=np.float64, copy=True)
    ma, mb = W[:, c.side_a].sum(1), W[:, c.side_b].sum(1)
    m = ma + mb
    u, uu, inner = c.coords(P)
    sel = (m > 0) & c.zone(P, uu)
    rows = np.flatnonzero(sel)
    cur = mb[rows] / m[rows]
    fb = crease_share(c, uu[rows], cur)
    for cols, target in ((c.side_a, m[rows] * (1.0 - fb)), (c.side_b, m[rows] * fb)):
        sub = W[np.ix_(rows, cols)]
        cs = sub.sum(1)
        share = np.where(cs[:, None] > 0, sub / np.where(cs > 0, cs, 1.0)[:, None], 0.0)
        share[cs <= 0, 0] = 1.0  # an empty side takes its main bone (the twist ramp splits it afterwards)
        W[np.ix_(rows, cols)] = share * target[:, None]
    moved = np.abs(fb - cur)
    return W, {"rows": int((m[rows] > MASS_EPS).sum()), "changed_rows": int((moved * m[rows] > MASS_EPS).sum()),
               "moved_mass_max": float((moved * m[rows]).max()) if rows.size else 0.0}


def crease_coverage(topo: sc.WeldTopo, c: Crease) -> dict:
    """How well the mesh resolves a crease band (measurement only, review r2 N2), on rows within r of the joint: rows inside the
    band on each side of the plane (-h < u < 0, 0 <= u < h), the nearest row on each side (m from the plane), the edges that cross
    the plane (count, longest, largest span in u). ``one_side_empty`` when a side has no row inside the band;
    ``crossing_edge_over_band`` when the longest crossing edge is longer than the band (2h)."""
    u = c.coords(topo.P)[0]
    near = np.linalg.norm(topo.P - c.J, axis=1) < c.r
    prox, dist = near & (u < 0) & (u > -c.h), near & (u >= 0) & (u < c.h)
    e = topo.edges
    cross = near[e[:, 0]] & near[e[:, 1]] & ((u[e[:, 0]] < 0) != (u[e[:, 1]] < 0))
    el = topo.edge_lengths()[cross]
    span = np.abs(u[e[cross, 0]] - u[e[cross, 1]])
    np_, nd = near & (u < 0), near & (u >= 0)
    return {"band_rows_proximal": int(prox.sum()), "band_rows_distal": int(dist.sum()),
            "nearest_row_proximal_m": float(-u[np_].max()) if np_.any() else None,
            "nearest_row_distal_m": float(u[nd].min()) if nd.any() else None, "edges_crossing": int(cross.sum()),
            "crossing_edge_max_m": float(el.max()) if el.size else None,
            "crossing_span_max_m": float(span.max()) if span.size else None,
            "one_side_empty": bool(not prox.any() or not dist.any()),
            "crossing_edge_over_band": bool(el.size and float(el.max()) > 2.0 * c.h)}


# --------------------------------------------------------------------------------------------------------------------------
# twist ramps
# --------------------------------------------------------------------------------------------------------------------------


def twist_segments(bones: sc.BoneSet) -> list[dict]:
    """One entry per segment bone G with twist bones (``twist`` = {driver, axis, factor}) parented to it: mode "self" (driver = G,
    upper arm) or "distal" (driver below G, forearm), the twist fraction phi of every ramp bone (share of the driver's twist it
    carries in LBS: G 1 and T 1 + f in "self" mode, G 0 and T f in "distal" mode; the driver itself is never a ramp bone), t0
    (head of the most proximal twist bone on G, clamped to [0, 0.9]) and the ramp's end values."""
    idx = bones.index
    by_seg: dict = {}
    for j, tw in enumerate(bones.twist):
        if tw and bones.parent[j] in idx:
            by_seg.setdefault(bones.parent[j], []).append(j)
    out = []
    for G, tws in by_seg.items():
        g = idx[G]
        modes = {"self" if bones.twist[j]["driver"] == G else "distal" for j in tws}
        if len(modes) > 1:
            raise sc.RuleError(f"twist bones on {G} mix drivers ({[bones.twist[j]['driver'] for j in tws]}); not supported")
        mode = modes.pop()
        tpos = {bones.names[j]: float(sc.seg_param(bones.head[j][None], bones.head[g], bones.tail[g])[0]) for j in tws}
        f = {bones.names[j]: float(bones.twist[j]["factor"]) for j in tws}
        first = min(tpos, key=tpos.get)
        last = max(tpos, key=tpos.get)
        if mode == "self":
            phi = {G: 1.0, **{t: 1.0 + f[t] for t in tpos}}
            start, end = phi[first], 1.0
        else:
            phi = {G: 0.0, **{t: f[t] for t in tpos}}
            start, end = 0.0, phi[last]
        out.append({"segment": G, "twists": sorted(tpos, key=tpos.get), "mode": mode, "drivers": sorted({bones.twist[j]["driver"]
                    for j in tws}), "phi": phi, "t0": float(np.clip(tpos[first], 0.0, 0.9)), "start": start, "end": end,
                    "head": bones.head[g].copy(), "tail": bones.tail[g].copy()})
    return out


def twist_target(seg: Mapping, t):
    """Target effective twist at segment positions ``t`` (clamped to [0, 1]): "distal" end x t; "self" start + (1 - start) a."""
    t = np.clip(np.asarray(t, dtype=np.float64), 0.0, 1.0)
    if seg["mode"] == "distal":
        return seg["end"] * t
    a = np.clip((t - seg["t0"]) / (1.0 - seg["t0"]), 0.0, 1.0)
    return seg["start"] + (seg["end"] - seg["start"]) * a


def twist_ramp_weights(e, phis: Mapping[str, float]):
    """Split one unit of mass between the bones of ``phis`` so that sum_b w_b phi_b = e: e is clipped to [phi_min, phi_max] and
    shared by the two bones whose phi bracket it (at most 2 non-zero). Returns (names sorted by phi, (n, len) weights)."""
    names = sorted(phis, key=lambda n: (phis[n], n))
    ph = np.array([phis[n] for n in names])
    e = np.clip(np.asarray(e, dtype=np.float64), ph[0], ph[-1])
    Wr = np.zeros((e.shape[0], len(names)))
    if len(names) == 1:
        Wr[:, 0] = 1.0
        return names, Wr
    seg = np.clip(np.searchsorted(ph, e, side="right") - 1, 0, len(names) - 2)
    lo, hi = ph[seg], ph[seg + 1]
    t = np.where(hi > lo, (e - lo) / np.where(hi > lo, hi - lo, 1.0), 0.0)
    rows = np.arange(e.shape[0])
    Wr[rows, seg] = 1.0 - t
    Wr[rows, seg + 1] += t
    return names, Wr


def apply_twist_ramps(W, P, bones: sc.BoneSet):
    """Re-split each segment's G + twist mass by position (module docstring). Returns (W, info)."""
    W = np.array(W, dtype=np.float64, copy=True)
    idx = bones.index
    info = []
    for seg in twist_segments(bones):
        cols = [idx[n] for n in seg["phi"]]
        m = W[:, cols].sum(1)
        rows = np.flatnonzero(m > 0)
        t = sc.seg_param(P[rows], seg["head"], seg["tail"])
        names, Wr = twist_ramp_weights(twist_target(seg, t), seg["phi"])
        before = W[np.ix_(rows, cols)].copy()
        W[np.ix_(rows, cols)] = 0.0
        for c, nm in enumerate(names):
            W[rows, idx[nm]] += m[rows] * Wr[:, c]
        moved = 0.5 * np.abs(W[np.ix_(rows, cols)] - before).sum(1)
        info.append({"segment": seg["segment"], "twists": seg["twists"], "mode": seg["mode"], "phi": seg["phi"], "t0": seg["t0"],
                     "rows": int((m > MASS_EPS).sum()), "changed_rows": int((moved > MASS_EPS).sum())})
    return W, info


def effective_twist(W, bones: sc.BoneSet, seg: Mapping) -> np.ndarray:
    """sum_b w_b phi_b over the ramp bones of ``seg`` divided by the row's mass on them (NaN where the mass is 0)."""
    idx = bones.index
    cols = [idx[n] for n in seg["phi"]]
    ph = np.array([seg["phi"][n] for n in seg["phi"]])
    m = W[:, cols].sum(1)
    with np.errstate(invalid="ignore", divide="ignore"):
        return (W[:, cols] @ ph) / m


# --------------------------------------------------------------------------------------------------------------------------
# influence caps (bone groups for skin_common.CapRule)
# --------------------------------------------------------------------------------------------------------------------------


def cap_rule(bones: sc.BoneSet, skin_block: Mapping | None, cfg: Mapping, max_influences: int | None = None) -> sc.CapRule:
    """``CapRule`` for these columns: shoulder / hip blend groups per side (``BLEND_GROUPS``, tolerance caps from the skin block's
    ``max_influences_by_region`` shoulder / hip, default 3, applied when the entries beyond the cap sum below
    ``cfg["cap_extra_tol"]``), finger columns (``fingers``, default 2, hard), small cap ``default_non_joint`` (default 2) below
    ``cfg["cap_extra_tol"]``. A blend cap below the small cap raises ``RuleError`` when the small cap is itself below
    ``max_influences`` (the hard cap, default the skin block's ``max_influences``, 4): the small cap would then cut kept blend rows
    again and one enforce would not be idempotent. A small cap >= the hard cap never removes anything, so any blend cap goes
    (review B r3 nit a: e.g. hip 3 with default_non_joint 4)."""
    by = dict((skin_block or {}).get("max_influences_by_region") or {})
    idx = bones.index
    small = int(by.get("default_non_joint", 2))
    kmax = int(max_influences if max_influences is not None else (skin_block or {}).get("max_influences", 4))
    groups = []
    for key, ga, gb in BLEND_GROUPS:
        cap = int(by.get(key, 3))
        if cap < small < kmax:
            raise sc.RuleError(f"max_influences_by_region: {key} = {cap} is below default_non_joint = {small} (below the hard "
                               f"cap {kmax})")
        for side in ("L", "R"):
            ca = [idx[n] for n in (sc.sub_side(x, side) for x in ga) if n in idx]
            cb = [idx[n] for n in (sc.sub_side(x, side) for x in gb) if n in idx]
            if ca and cb:
                groups.append((f"{key}_{side}", np.array(ca, dtype=np.int64), np.array(cb, dtype=np.int64), cap))
    fing = np.array([j for j, n in enumerate(bones.names) if any(w in sc.base_name(n).lower() for w in FINGER_WORDS)],
                    dtype=np.int64)
    return sc.CapRule(extra_tol=float(cfg["cap_extra_tol"]), small_cap=small, groups=groups, finger_cols=fing,
                      finger_cap=int(by.get("fingers", 2)))


def limb_groups(bones: sc.BoneSet, topo: sc.WeldTopo, cfg: Mapping | None = None, P=None) -> sc.LimbGroups:
    """``LimbGroups`` for these columns: one unit per twist segment (G + its twist bones), and crease partners from the creases
    that ``crease_specs(topo, bones, cfg)`` builds (``cfg`` = ``rules["profiles"]``): a unit (or single bone) on one side of a
    crease gets the other side, e.g. Hand -> {ForeArm, ForeArm_twist}, UpperArm -> {ForeArm, ForeArm_twist}, Thigh -> {Calf},
    only on the rows where that crease acts (``Crease.zone`` at ``P``, default ``topo.P``): elbow and knee |P - J| < r and
    |uu| < 2h, the wrist within its reach of the forearm and hand segments. A unit between two creases (the forearm: elbow and
    wrist) takes the elbow's other side on its elbow half (t < 0.5 along the segment bone) and the wrist's on the other half, each
    half intersected with that crease's zone. Elsewhere the weight of a dropped entry is renormalized over the row: no profile
    re-splits it there, so profiles + enforce still reach a fixed point (review r2: calf weight moved to the thigh on hip and belly
    rows up to 0.78 m from the knee). Disabled or skipped creases give no partner."""
    cfg = profile_config(cfg)
    P = topo.P if P is None else np.asarray(P, dtype=np.float64)
    idx = bones.index
    segs = twist_segments(bones)
    units = [np.array([idx[n] for n in seg["phi"]], dtype=np.int64) for seg in segs]
    unit_of = {idx[seg["segment"]]: [idx[n] for n in seg["phi"]] for seg in segs}
    specs = crease_specs(topo, bones, cfg)[0] if cfg["enabled"] else []
    ends: dict = {}  # segment column -> {"head": (zone, other side of the crease at its head), "tail": (zone, ... at its tail)}
    for c in specs:
        z = c.zone(P)
        ends.setdefault(c.side_a[0], {})["tail"] = (z, np.array(c.side_b, dtype=np.int64))
        ends.setdefault(c.side_b[0], {})["head"] = (z, np.array(c.side_a, dtype=np.int64))
    partners: dict = {}
    for g, e in sorted(ends.items()):
        if len(e) == 2:
            near_head = sc.seg_param(P, bones.head[g], bones.tail[g]) < 0.5
            lst = [(e["head"][0] & near_head, e["head"][1]), (e["tail"][0] & ~near_head, e["tail"][1])]
        else:
            lst = [next(iter(e.values()))]
        for c in unit_of.get(g, [g]):
            partners[c] = lst
    return sc.LimbGroups(units=units, partners=partners)


# --------------------------------------------------------------------------------------------------------------------------
# limb envelope (candidates A and B, before ``finish``; never inside ``enforce``)
# --------------------------------------------------------------------------------------------------------------------------

#: limb envelope (module docstring item 4): per limb root (``skin_common.limb_base``) the falloff interval of d / L (distance from
#: the root's segment over its length) and, for the thigh, of h / L (height above its head joint along the bone axis); the factor
#: is 1 below the interval, 0 above it, smoothstep in between
LIMB_ENVELOPE = {"UpperArm": {"dist": [0.5, 0.75]}, "Thigh": {"dist": [0.75, 1.25], "above": [0.1, 0.3]}}


def limb_envelope(X, bones: sc.BoneSet, spec=None):
    """Limb envelope factors (module docstring item 4) at points ``X`` (p,3, metres): (E (p,k) in [0, 1], info). For each side and
    each limb root R of ``spec`` ({base name: {"dist": [d0, d1], "above": [h0, h1]}}, default ``LIMB_ENVELOPE``) with a column
    ``<S>_<R>`` (length L, head A, tail B): every column of the root's unit (``skin_common.limb_base`` == R on that side, so the
    upper arm's twist bones too) gets e = (1 - S((d/L - d0)/(d1 - d0))) x (1 - S((h/L - h0)/(h1 - h0))), S = smoothstep,
    d = distance from X to the segment A-B, h = (X - A) . (A - B) / L (height above the head joint, away from the tail; the
    "above" factor only when given). Every other column keeps 1. Continuous in X and in the parameters (C1), no hard gate."""
    X = np.asarray(X, dtype=np.float64)
    spec = LIMB_ENVELOPE if spec is None else spec
    E = np.ones((len(X), bones.k))
    info = {"spec": {k: dict(v) for k, v in spec.items()}, "units": {}}
    for root, prm in spec.items():
        unknown = sorted(set(prm) - {"dist", "above"})
        if unknown:
            raise ValueError(f"envelope {root!r}: unknown keys {unknown} (known: dist, above)")
        for side in ("L", "R"):
            name = f"{side}_{root}"
            if name not in bones.index:
                continue
            j = bones.col(name)
            L = bones.length(j)
            if L <= 0:
                continue
            A, B = bones.head[j], bones.tail[j]
            e = np.ones(len(X))
            if prm.get("dist") is not None:
                d0, d1 = (float(v) for v in prm["dist"])
                e *= 1.0 - sc.smoothstep((sc.seg_dist(X, A, B)[0] / L - d0) / max(d1 - d0, 1e-12))
            if prm.get("above") is not None:
                h0, h1 = (float(v) for v in prm["above"])
                h = (X - A) @ (A - B) / (L * L)
                e *= 1.0 - sc.smoothstep((h - h0) / max(h1 - h0, 1e-12))
            unit = [i for i, nm in enumerate(bones.names) if sc.bone_side(nm) == side and sc.limb_base(nm) == root]
            E[:, unit] = e[:, None]
            info["units"][name] = {"bones": [bones.names[i] for i in unit], "length_m": L, "points_scaled": int((e < 1).sum()),
                                   "points_zero": int((e <= 0).sum())}
    return E, info


def normalize_rows(W, fallback=None):
    """Clamp negatives and normalize the rows of ``W``; rows left without weight take the rows of ``fallback`` (normalized the same
    way) when given. Returns (W, rows that fell back)."""
    def norm(X):
        X = np.clip(X, 0.0, None)
        s = X.sum(1)
        return np.where(s[:, None] > 0, X / np.where(s > 0, s, 1.0)[:, None], 0.0), s

    W, s = norm(W)
    empty = s <= 1e-12
    if fallback is not None and empty.any():
        W[empty] = norm(fallback[empty])[0]
    return W, empty


def apply_limb_envelope(W, X, bones: sc.BoneSet, spec=None):
    """The limb envelope on weight rows ``W`` (p,k) at points ``X`` (p,3, metres): ``W`` times the ``limb_envelope`` factors, then
    clamped and row-normalized (``normalize_rows``; a row the envelope would empty keeps its plain weights). Returns (W, info: the
    envelope units plus ``rows_changed``, ``moved_max`` / ``moved_mean`` (half the L1 change against the plain normalized rows) and
    ``rows_fallback``)."""
    W = np.asarray(W, dtype=np.float64)
    E, info = limb_envelope(X, bones, spec)
    Wn, empty = normalize_rows(W * E, fallback=W)
    plain, _ = normalize_rows(W)
    moved = 0.5 * np.abs(Wn - plain).sum(1)
    info.update(rows_changed=int((moved > 1e-6).sum()), moved_max=float(moved.max()) if len(moved) else 0.0,
                moved_mean=float(moved.mean()) if len(moved) else 0.0, rows_fallback=int(empty.sum()))
    return Wn, info


# --------------------------------------------------------------------------------------------------------------------------
# apply + measurements
# --------------------------------------------------------------------------------------------------------------------------


def apply_profiles(W, topo: sc.WeldTopo, bones: sc.BoneSet, skin_block: Mapping | None, cfg: Mapping | None = None):
    """Creases (wrist, elbow, knee) -> twist ramps on welded weights (module docstring); the caps are applied by ``enforce``.
    ``cfg`` = ``rules["profiles"]`` (``PROFILE_DEFAULTS``). Returns (W, info)."""
    cfg = profile_config(cfg)
    W = np.asarray(W, dtype=np.float64)
    info: dict = {"cfg": cfg}
    if cfg["enabled"]:
        specs, skipped = crease_specs(topo, bones, cfg)
        info["creases"], info["crease_band_flags"] = [], []
        for c in specs:
            W, ci = apply_crease(W, topo.P, c)
            band = crease_coverage(topo, c)
            info["creases"].append({**c.describe(bones.names), **ci, "band": band})
            if band["one_side_empty"]:
                info["crease_band_flags"].append(f"{c.name}: no row inside the band (|u| < {c.h:.3f} m) on one side "
                                                 f"({band['band_rows_proximal']} proximal, {band['band_rows_distal']} distal)")
            if band["crossing_edge_over_band"]:
                info["crease_band_flags"].append(f"{c.name}: an edge {band['crossing_edge_max_m']:.3f} m long crosses the plane, "
                                                 f"longer than the band ({2 * c.h:.3f} m)")
        if skipped:
            info["creases_skipped"] = skipped
        if cfg["twist"]:
            W, info["twist"] = apply_twist_ramps(W, topo.P, bones)
    info["hip_transition"] = measure_hip_transition(W, topo, bones)
    return W, info


def _transition(f, u, L: float, bin_frac: float) -> dict | None:
    """Median of ``f`` per bin of ``bin_frac`` x L along ``u`` (bins with >= 3 rows) and the width between the first 0.1 and the
    first 0.9 median after it (``measure_hip_transition``); None without a bin."""
    b = np.floor(u / (bin_frac * L)).astype(np.int64)
    ub, med = [], []
    for k_ in np.unique(b):
        sel = b == k_
        if sel.sum() >= 3:
            ub.append((k_ + 0.5) * bin_frac * L)
            med.append(float(np.median(f[sel])))
    ub, med = np.array(ub), np.array(med)
    if not ub.size:
        return None
    i_lo = int(np.argmax(med >= 0.1)) if (med >= 0.1).any() else None
    after = med[i_lo:] >= 0.9 if i_lo is not None else np.zeros(0, bool)
    i_hi = i_lo + int(np.argmax(after)) if after.any() else None
    width = float(ub[i_hi] - ub[i_lo]) if i_hi is not None else None
    at_least = float(ub[-1] - ub[i_lo]) if (i_lo is not None and i_hi is None) else None
    w_ok = width if width is not None else at_least
    return {"rows": int(f.size), "width_m": width, "width_over_thigh": (width / L) if width is not None else None,
            "width_at_least_m": at_least, "first_0.1_u_m": float(ub[i_lo]) if i_lo is not None else None,
            "max_median": float(med.max()), "window_m": [float(ub[0]), float(ub[-1])], "thigh_m": L,
            "ok": bool(w_ok is not None and w_ok >= 0.1 * L)}


THIGH_RADIUS_MARGIN = 1.25  # rows "on the thigh" lie within this x the median mid-thigh surface distance of the thigh line


def measure_hip_transition(W, topo: sc.WeldTopo, bones: sc.BoneSet, bin_frac: float = 0.02) -> dict:
    """Width of the pelvis -> thigh blend along each thigh (skinning.md: >= 10 % of the thigh length, measured inside the thigh
    radius). Rows within 0.6 x thigh length of the hip joint whose weight on {thigh, pelvis, spine_01} is >= 0.5 and that lie on
    the thigh: distance rho to the thigh's line below ``THIGH_RADIUS_MARGIN`` x R, R = median rho of the mid-thigh rows (u in
    [0.25, 0.75] x length) whose nearest deform bone segment is this thigh, and (with both thighs) not between the legs: a row
    with rho > R whose lateral offset from the pair's side plane is less than half the thigh line's offset at the same u is
    left out (review r2 N4: robe rows between the legs held the median thigh share below 0.9; rows with rho <= R are on the leg
    and always count). f = thigh / (thigh + pelvis + spine_01); u = coordinate along the
    thigh from the hip joint (m); per bin of ``bin_frac`` x length the median f; width = u where the median first reaches 0.9
    minus u where it first reaches 0.1. When the median stays below 0.9 inside the window, ``width_m`` is None and
    ``width_at_least_m`` = last bin - first 0.1 bin (the blend is wider than the window); ``max_median`` is the largest median.
    ``ok``: the width (or its lower bound) is >= 10 % of the thigh. ``all_rows`` = the same without the two limits (with fewer
    than 10 rows on the thigh the top-level numbers are those of all rows, ``measured_on``). A robe without modelled legs (FL)
    has no separate thigh surface: there the candidate's pelvis weight runs down the whole robe and the median can stay below 0.9
    on the thigh too. Measurement only (no weight is changed)."""
    idx = bones.index
    out = {}
    seg_d = None
    for side in ("L", "R"):
        T = f"{side}_Thigh"
        if T not in idx or "pelvis" not in idx:
            continue
        t = idx[T]
        L = bones.length(t)
        d = (bones.tail[t] - bones.head[t]) / L
        cols = [t, idx["pelvis"]] + ([idx["spine_01"]] if "spine_01" in idx else [])
        m3 = W[:, cols].sum(1)
        D = topo.P - bones.head[t]
        u = D @ d
        rho = np.linalg.norm(D - u[:, None] * d, axis=1)
        rows = (np.linalg.norm(D, axis=1) < 0.6 * L) & (m3 >= 0.5)
        if rows.sum() < 10:
            continue
        if seg_d is None:
            seg_d = np.stack([sc.seg_dist(topo.P, bones.head[j], bones.tail[j])[0] for j in range(bones.k)], axis=1)
        mid = (seg_d.argmin(1) == t) & (u >= 0.25 * L) & (u <= 0.75 * L)
        R = float(np.median(rho[mid])) if mid.sum() >= 10 else None
        on = rows.copy()
        other = sc.mirror_name(T)
        if R is not None:
            on &= rho < THIGH_RADIUS_MARGIN * R
            if other in idx:
                x0 = 0.5 * (bones.head[t][0] + bones.head[idx[other]][0])
                sg = sc.SIDE_SIGN[side]
                between = sg * (topo.P[:, 0] - x0) < 0.5 * sg * (bones.head[t][0] + u * d[0] - x0)
                on &= (rho <= R) | ~between
        res_all = _transition(W[rows, t] / m3[rows], u[rows], L, bin_frac)
        res = _transition(W[on, t] / m3[on], u[on], L, bin_frac) if on.sum() >= 10 else None
        if res_all is None:
            continue
        out[side] = {**(res if res is not None else res_all), "thigh_radius_m": R,
                     "measured_on": "on_thigh" if res is not None else "all_rows", "all_rows": res_all}
    return out


def twist_bins(W, topo: sc.WeldTopo, bones: sc.BoneSet, nbins: int = 10, min_mass: float = 0.5) -> dict:
    """Effective twist per ``1/nbins`` bin of the segment position t for every twist segment, on rows whose mass on the ramp bones
    is >= ``min_mass`` and whose projection falls on the segment: {segment: [{t_lo, t_hi, n, mean, target_mid, max_dev}]}, with
    max_dev = largest |effective - twist_target(t)| in the bin (measurement only)."""
    out = {}
    idx = bones.index
    for seg in twist_segments(bones):
        cols = [idx[n] for n in seg["phi"]]
        m = W[:, cols].sum(1)
        t = sc.seg_param(topo.P, seg["head"], seg["tail"])
        rows = (m >= min_mass) & (t >= 0.0) & (t <= 1.0)
        e = effective_twist(W[rows], bones, seg)
        tr = t[rows]
        dev = np.abs(e - twist_target(seg, tr))
        bins = []
        for b in range(nbins):
            lo, hi = b / nbins, (b + 1) / nbins
            sel = (tr >= lo) & ((tr < hi) if b < nbins - 1 else (tr <= hi))
            bins.append({"t_lo": lo, "t_hi": hi, "n": int(sel.sum()), "mean": float(e[sel].mean()) if sel.any() else None,
                         "target_mid": float(twist_target(seg, np.array([0.5 * (lo + hi)]))[0]),
                         "max_dev": float(dev[sel].max()) if sel.any() else None})
        out[seg["segment"]] = {"mode": seg["mode"], "phi": seg["phi"], "t0": seg["t0"], "bins": bins}
    return out


def wrist_extent(W, topo: sc.WeldTopo, bones: sc.BoneSet, cfg: Mapping | None = None) -> dict:
    """How far the Hand weight reaches up the forearm: per side, the largest distance above the wrist plane (-u, m) of the rows with
    Hand weight > 0 that lie within half a forearm length of the forearm segment, against the band half width h and one ring
    (median edge length near the wrist). ``ok``: extent <= h + ring (measurement only)."""
    cfg = profile_config(cfg)
    specs, _ = crease_specs(topo, bones, {**cfg, "crease": False, "wrist": True})
    idx = bones.index
    out = {}
    for c in specs:
        side = c.name[-1]
        fa, hd = idx[f"{side}_ForeArm"], idx[f"{side}_Hand"]
        u, _, _ = c.coords(topo.P)
        d_fa, _ = sc.seg_dist(topo.P, bones.head[fa], bones.tail[fa])
        rows = (W[:, hd] > 0) & (u < 0) & (d_fa < 0.5 * bones.length(fa))
        ext = float((-u[rows]).max()) if rows.any() else 0.0
        out[side] = {"extent_m": ext, "extent_rings": ext / c.ring, "half_width_m": c.h, "ring_m": c.ring,
                     "rows_above_plane_with_hand": int(rows.sum()), "ok": bool(ext <= c.h + c.ring)}
    return out
