"""solvers.skin_common - weld-level weight core shared by the skin candidates (A region, B transfer, C UniRig), the selector and
``rigkit/skin_io.py`` (owner B, P3).

What lives here:

* ``WeldTopo``: the welded topology every solver works on (one row per welded position; seam duplicates share it, so co-located
  vertices get identical weights by construction). ``gather``/``scatter`` move arrays between original and welded ids.
* ``BoneSet``: the weight columns (deform bones of a resolved skeleton) with segments, sides, hierarchy and twist info.
* ``Constraints`` + ``fold`` + ``enforce`` + ``check_invariants``: side gate, region bone lists (fold into the nearest allowed
  bone), rigid islands, user override entries, top-k (hard per-row caps), prune, renormalize, then the weight-dependent influence
  caps of ``CapRule`` (skinning.md "Joint profiles": blend caps are tolerance caps), then every invariant is checked
  (``InvariantError`` with the numbers). With ``LimbGroups`` (profiles on) the weight of a dropped limb entry stays in its twist
  unit, or in its crease partner inside that crease's zone (``drop_entries``), so profiles + enforce reach a fixed point instead
  of drifting weight off the limb at every pass.
* ``exporter_rule``: the glTF exporter's runtime rule (drop <= 1e-4, top 4, renormalize) for runtime emulation.
* Overrides (``overrides_record`` / ``overrides_apply``): ``weights_override.json`` keyed by welded position + bone
  (``{schema, kind: "weights_override", asset_id, H, pos_tol, entries: [{pos, bone, weight}]}``); a vertex left without weight
  raises.
* ``limb_leak``: limb-root weight on torso rows far from the limb (references/deformation-qa.md "Limb leak", review B r3), the
  measurement behind every candidate's ``limb_leak`` report, metrics.py's ``weights_limb_leak`` and the selector's region gate;
  ``leak_config`` reads its numbers from thresholds.json.

Rule expressions, classes, side planes and the constraint builder are in ``skin_rules.py``; joint profiles (creases, twist ramps,
the cap rule's bone groups, hip measurement) in ``skin_profiles.py``. Both need only numpy too, but this module is the one
``rigkit/skin_io.py`` loads by file path inside Blender, so it imports numpy + rigcore only and nothing from ``solvers``
(``tests/solvers/B_skin_common_test.py`` checks that with scipy and igl blocked). Nothing here does dense linear algebra (Blender's
numpy has no fast BLAS); the dense ops are O(n k) elementwise work.

Units: metres.  Frame: Blender, Z up, character front -Y, character left +X.  ``H`` = catalogue height (D01 0.5 m).
"""
from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from typing import Iterable, Mapping, Sequence

import numpy as np

from rigcore import mesh as rmesh

SIDE_SIGN = {"L": 1.0, "R": -1.0}
SUM_TOL = 1e-6  # |row sum - 1| after enforce (float64); float32 storage adds < 1e-7


class RuleError(ValueError):
    """A rule expression or a rules document is invalid (message names the rule and the problem)."""


class InvariantError(AssertionError):
    """A weight invariant failed (``check_invariants``, or a fold that left forbidden weight); ``.report`` holds the numbers."""

    def __init__(self, msg, report):
        super().__init__(msg)
        self.report = report


# --------------------------------------------------------------------------------------------------------------------------
# small helpers
# --------------------------------------------------------------------------------------------------------------------------


def smoothstep(x):
    """3x^2 - 2x^3 on x clipped to [0, 1] (D01 d01_skin.smoothstep)."""
    x = np.clip(x, 0.0, 1.0)
    return x * x * (3.0 - 2.0 * x)


def bone_side(name: str) -> str | None:
    """'L' / 'R' from the ``L_`` / ``R_`` prefix of a runtime bone name, else None (SKELETON_STANDARD names)."""
    if name[:2] in ("L_", "R_"):
        return name[0]
    return None


def base_name(name: str) -> str:
    """Bone name without its side prefix (``L_UpperArm`` -> ``UpperArm``)."""
    return name[2:] if bone_side(name) else name


def mirror_name(name: str) -> str | None:
    """The opposite side's name: ``L_x`` <-> ``R_x``, ``x_L`` <-> ``x_R`` (sockets); None for unsided names."""
    if name[:2] in ("L_", "R_"):
        return ("R_" if name[0] == "L" else "L_") + name[2:]
    if name[-2:] in ("_L", "_R"):
        return name[:-2] + ("_R" if name[-1] == "L" else "_L")
    return None


def sub_side(s: str, side: str | None) -> str:
    """Replace ``{S}`` by the side letter (no-op for side None)."""
    return s if side is None else s.replace("{S}", side)


def expand_names(names: Iterable[str], present: Iterable[str] | None = None) -> list[str]:
    """Expand ``{S}`` entries to L and R; with ``present`` drop names that are not in it (keeps order, removes duplicates)."""
    out: list[str] = []
    pres = set(present) if present is not None else None
    for nm in names:
        for e in ([nm.replace("{S}", "L"), nm.replace("{S}", "R")] if "{S}" in nm else [nm]):
            if (pres is None or e in pres) and e not in out:
                out.append(e)
    return out


def seg_dist(P, a, b):
    """Distance (m) from points ``P`` (n,3) to the segment a-b and the clamped segment parameter t in [0, 1]."""
    P = np.asarray(P, dtype=np.float64)
    a = np.asarray(a, dtype=np.float64)
    b = np.asarray(b, dtype=np.float64)
    ab = b - a
    den = float(ab @ ab)
    t = np.clip(((P - a) @ ab) / den, 0.0, 1.0) if den > 0 else np.zeros(len(P))
    q = a + t[:, None] * ab
    return np.linalg.norm(P - q, axis=1), t


def seg_param(P, a, b):
    """Unclamped parameter t of the projection of ``P`` on the line a->b (0 at a, 1 at b)."""
    P = np.asarray(P, dtype=np.float64)
    a = np.asarray(a, dtype=np.float64)
    ab = np.asarray(b, dtype=np.float64) - a
    return ((P - a) @ ab) / float(ab @ ab)


def _unit(v):
    v = np.asarray(v, dtype=np.float64)
    n = float(np.linalg.norm(v))
    if n == 0.0:
        raise ValueError("zero vector")
    return v / n


# --------------------------------------------------------------------------------------------------------------------------
# welded topology
# --------------------------------------------------------------------------------------------------------------------------


@dataclass
class WeldTopo:
    """Welded topology of a mesh.npz dict. ``P`` = mean position per welded id (m); ``F`` welded triangles without degenerate ones;
    ``edges`` unique edges; CSR adjacency (``indptr``, ``indices``, neighbours sorted by welded id); ``normals`` area-weighted unit
    normals; ``island`` connected pieces; ``rank`` = position of each welded id in the lexicographic order of its position rounded
    to ``order_eps`` (x, then y, then z): breadth-first searches use it so results do not depend on the file's vertex order."""

    weld: np.ndarray
    P: np.ndarray
    F: np.ndarray
    edges: np.ndarray
    indptr: np.ndarray
    indices: np.ndarray
    normals: np.ndarray
    island: np.ndarray
    n_islands: int
    counts: np.ndarray
    rank: np.ndarray
    H: float
    order_eps: float = 2e-6

    @property
    def n(self) -> int:
        return int(self.weld.shape[0])

    @property
    def n_w(self) -> int:
        return int(self.P.shape[0])

    def gather(self, X, how: str = "mean") -> np.ndarray:
        """Per-original-vertex array (n, ...) -> per welded id (n_w, ...): mean of the members (``how="first"``: lowest id)."""
        X = np.asarray(X)
        if X.shape[0] != self.n:
            raise ValueError(f"gather: expected {self.n} rows, got {X.shape[0]}")
        if how == "first":
            first = np.full(self.n_w, -1, dtype=np.int64)
            idx = np.arange(self.n)[::-1]
            first[self.weld[idx]] = idx
            return X[first]
        Xf = X.reshape(self.n, -1).astype(np.float64)
        out = np.zeros((self.n_w, Xf.shape[1]))
        np.add.at(out, self.weld, Xf)
        out /= self.counts[:, None]
        return out.reshape((self.n_w,) + X.shape[1:])

    def scatter(self, Xw) -> np.ndarray:
        """Per welded id (n_w, ...) -> per original vertex (n, ...) (copies the welded row to every duplicate)."""
        Xw = np.asarray(Xw)
        if Xw.shape[0] != self.n_w:
            raise ValueError(f"scatter: expected {self.n_w} rows, got {Xw.shape[0]}")
        return Xw[self.weld]

    def neighbors(self, v: int) -> np.ndarray:
        return self.indices[self.indptr[v]:self.indptr[v + 1]]

    def edge_lengths(self) -> np.ndarray:
        return np.linalg.norm(self.P[self.edges[:, 0]] - self.P[self.edges[:, 1]], axis=1)

    def median_edge_near(self, centre, radius: float) -> float | None:
        """Median length (m) of the edges with both ends within ``radius`` of ``centre`` (None if there is none)."""
        near = np.linalg.norm(self.P - np.asarray(centre, dtype=np.float64), axis=1) < radius
        em = near[self.edges[:, 0]] & near[self.edges[:, 1]]
        return float(np.median(self.edge_lengths()[em])) if em.any() else None


def weld_topo(mesh: Mapping, order_eps: float = 2e-6) -> WeldTopo:
    """Build the ``WeldTopo`` of a loaded mesh.npz dict (``V``, ``F``, ``weld``, ``meta.H``)."""
    V = np.asarray(mesh["V"], dtype=np.float64)
    weld = np.asarray(mesh["weld"], dtype=np.int64)
    n_w = int(weld.max()) + 1
    P = rmesh.welded_positions(V, weld, mode="mean")
    Fw = rmesh.welded_faces(mesh["F"], weld, drop_degenerate=True).astype(np.int64)
    edges = rmesh.unique_edges(Fw).astype(np.int64) if len(Fw) else np.zeros((0, 2), np.int64)
    indptr, indices = rmesh.adjacency_csr(n_w, edges)
    # area-weighted vertex normals on the welded surface
    fn = np.cross(P[Fw[:, 1]] - P[Fw[:, 0]], P[Fw[:, 2]] - P[Fw[:, 0]]) if len(Fw) else np.zeros((0, 3))
    N = np.zeros((n_w, 3))
    for c in range(3):
        np.add.at(N, Fw[:, c], fn)
    nn = np.linalg.norm(N, axis=1)
    N = np.where(nn[:, None] > 0, N / np.maximum(nn, 1e-300)[:, None], 0.0)
    n_isl, isl = rmesh.connected_components(n_w, edges)
    counts = np.bincount(weld, minlength=n_w).astype(np.float64)
    key = np.round(P / order_eps).astype(np.int64)
    order = np.lexsort((key[:, 2], key[:, 1], key[:, 0]))
    rank = np.empty(n_w, dtype=np.int64)
    rank[order] = np.arange(n_w)
    H = float(mesh["meta"]["H"]) if isinstance(mesh.get("meta"), Mapping) else float("nan")
    return WeldTopo(weld=weld, P=P, F=Fw, edges=edges, indptr=indptr, indices=indices.astype(np.int64), normals=N,
                    island=isl.astype(np.int64), n_islands=int(n_isl), counts=counts, rank=rank, H=H, order_eps=order_eps)


def smooth_pass(W, edges, update, lam):
    """One Jacobi Laplacian pass: rows in ``update`` (bool (n,)) with at least one edge become (1 - lam) w + lam mean(neighbours).
    ``edges`` (E,2) undirected. Rows outside ``update`` and isolated rows are unchanged."""
    n = W.shape[0]
    acc = np.zeros_like(W)
    ea, eb = edges[:, 0], edges[:, 1]
    np.add.at(acc, ea, W[eb])
    np.add.at(acc, eb, W[ea])
    deg = np.bincount(np.concatenate([ea, eb]), minlength=n).astype(np.float64)
    has = (deg > 0) & update
    avg = acc / np.maximum(deg, 1.0)[:, None]
    out = W.copy()
    out[has] = (1.0 - lam) * W[has] + lam * avg[has]
    return out


def bfs_hops(topo: WeldTopo, sources, eligible, max_hops: int) -> np.ndarray:
    """Hop distance (int64, 0 at the sources, ``max_hops + 1`` beyond) walking only into ``eligible`` vertices (bool (n_w,))."""
    hop = np.full(topo.n_w, max_hops + 1, dtype=np.int64)
    src = np.flatnonzero(np.asarray(sources))
    hop[src] = 0
    frontier = src
    for h in range(1, max_hops + 1):
        if frontier.size == 0:
            break
        nb = _csr_gather(topo, frontier)[1]
        nb = nb[eligible[nb] & (hop[nb] > h)]
        nb = np.unique(nb)
        hop[nb] = h
        frontier = nb
    return hop


def _csr_gather(topo: WeldTopo, verts):
    """(owner, neighbour) pairs of all neighbours of ``verts`` in CSR order (owner order kept, neighbours ascending by id)."""
    verts = np.asarray(verts, dtype=np.int64)
    starts, ends = topo.indptr[verts], topo.indptr[verts + 1]
    cnt = ends - starts
    owner = np.repeat(verts, cnt)
    if cnt.sum() == 0:
        return owner, np.zeros(0, dtype=np.int64)
    offs = np.repeat(starts - np.concatenate([[0], np.cumsum(cnt)[:-1]]), cnt)
    idx = np.arange(cnt.sum()) + offs
    return owner, topo.indices[idx]


def bfs_nearest_source(topo: WeldTopo, sources, eligible, max_hops: int):
    """Multi-source BFS from ``sources`` into ``eligible`` vertices: returns (hop, near) where ``near`` is the source that reached
    each vertex first (-1 if none); unreached vertices have hop ``max_hops + 1``. Deterministic and independent of the vertex
    order: sources and neighbours are visited in ``topo.rank`` order (lexicographic position), and a vertex takes the source of
    the first frontier vertex that reaches it (as D01 d01_skin.compute did with its position-sorted weld ids)."""
    n_w = topo.n_w
    hop = np.full(n_w, max_hops + 1, dtype=np.int64)
    near = np.full(n_w, -1, dtype=np.int64)
    src = np.flatnonzero(np.asarray(sources))
    src = src[np.argsort(topo.rank[src], kind="stable")]
    hop[src] = 0
    near[src] = src
    frontier = src
    for h in range(1, max_hops + 1):
        if frontier.size == 0:
            break
        owner_pos = np.repeat(np.arange(frontier.size), topo.indptr[frontier + 1] - topo.indptr[frontier])
        _, nb = _csr_gather(topo, frontier)
        # visit neighbours of each frontier vertex in rank order
        o = np.lexsort((topo.rank[nb], owner_pos))
        owner_pos, nb = owner_pos[o], nb[o]
        ok = eligible[nb] & (hop[nb] > h)
        owner_pos, nb = owner_pos[ok], nb[ok]
        if nb.size == 0:
            break
        _, first = np.unique(nb, return_index=True)
        first = np.sort(first)
        nxt = nb[first]
        hop[nxt] = h
        near[nxt] = near[frontier[owner_pos[first]]]
        frontier = nxt
    return hop, near


# --------------------------------------------------------------------------------------------------------------------------
# bones
# --------------------------------------------------------------------------------------------------------------------------


@dataclass
class BoneSet:
    """Weight columns = deform bones of a resolved skeleton, in skeleton order unless ``columns`` is given.

    ``head``/``tail``/``hinge`` (k,3) in metres / unit vectors; ``side`` 'L'/'R'/None; ``kind``; ``parent`` (name of any bone or
    None); ``twist`` dict or None. ``all_bones`` keeps every skeleton bone (sockets, root, cog) for hierarchy walks."""

    names: list
    head: np.ndarray
    tail: np.ndarray
    hinge: np.ndarray
    side: list
    kind: list
    parent: list
    twist: list
    all_bones: dict
    H: float

    @property
    def k(self) -> int:
        return len(self.names)

    @property
    def index(self) -> dict:
        return {n: i for i, n in enumerate(self.names)}

    def col(self, name: str) -> int:
        try:
            return self.names.index(name)
        except ValueError:
            raise KeyError(f"bone {name!r} is not a weight column ({len(self.names)} columns)") from None

    def length(self, j: int) -> float:
        return float(np.linalg.norm(self.tail[j] - self.head[j]))

    def side_of(self, name: str) -> str | None:
        """Side of any skeleton bone: its ``side`` field, else the ``L_``/``R_`` prefix."""
        b = self.all_bones.get(name) or {}
        return b.get("side") or bone_side(name)

    @classmethod
    def from_skeleton(cls, skel: Mapping, columns: Sequence[str] | None = None) -> "BoneSet":
        bones = {b["name"]: b for b in skel["bones"]}
        names = list(columns) if columns is not None else [b["name"] for b in skel["bones"] if b["deform"]]
        missing = [n for n in names if n not in bones]
        if missing:
            raise KeyError(f"columns not in the skeleton: {missing}")
        g = lambda key: np.array([bones[n][key] for n in names], dtype=np.float64).reshape(-1, 3)
        return cls(names=names, head=g("head"), tail=g("tail"), hinge=g("hinge"),
                   side=[bones[n].get("side") or bone_side(n) for n in names], kind=[bones[n]["kind"] for n in names],
                   parent=[bones[n]["parent"] for n in names], twist=[bones[n].get("twist") for n in names],
                   all_bones=bones, H=float(skel["H"]))

    def tree_neighbors(self) -> dict:
        nb: dict = {n: [] for n in self.all_bones}
        for n, b in self.all_bones.items():
            p = b["parent"]
            if p is not None and p in nb:
                nb[n].append(p)
                nb[p].append(n)
        return nb

    def midpoints(self) -> np.ndarray:
        return 0.5 * (self.head + self.tail)


# --------------------------------------------------------------------------------------------------------------------------
# constraints: side gate, regions, rigid, overrides, influence caps
# --------------------------------------------------------------------------------------------------------------------------


@dataclass
class Region:
    name: str
    mask: np.ndarray
    allowed: list
    fold: dict


@dataclass
class CapRule:
    """Weight-dependent influence caps that ``enforce`` applies after top-k and prune (skinning.md "Joint profiles"):

    * blend rows of a group (``groups`` = [(name, cols_a, cols_b, cap)]: a weight >= prune on a column of ``cols_a`` and on a
      column of ``cols_b``, e.g. shoulder {UpperArm, UpperArm_twist} x {chest, Clavicle}) are a tolerance cap: with c = the
      smallest cap of the row's groups, the entries ranked after the c largest (``beyond``) are dropped only when they sum to less
      than ``extra_tol`` (0.05); a row whose ``beyond`` is >= ``extra_tol`` keeps its entries (still <= the hard cap, 4) and is
      reported (``blend_rows_kept_over_cap_<group>``; review r2: a hard cap removed up to 0.23 of a row on FL, mostly belly rows);
    * rows whose largest weight is on a column of ``finger_cols`` keep at most ``finger_cap`` (a hard cap);
    * then any row keeps only its ``small_cap`` (2) largest weights when the rest sums to less than ``extra_tol``, measured after
      the caps above and renormalization; otherwise it keeps up to the hard cap (4).
    So the blend and small caps never remove ``extra_tol`` or more of a row in one step (two steps can add up to more; the report
    has both). Rows with locked (override) entries keep every locked entry and skip the ``small_cap`` step.
    ``skin_profiles.cap_rule`` builds it from the bone names (group caps >= ``small_cap``, unless ``small_cap`` >= the hard cap:
    then the small cap removes nothing). One pass is idempotent: the steps only remove entries and renormalize, which never
    creates a new blend row or a new small tail; a kept blend row has a tail beyond ``small_cap`` of at least ``extra_tol``, so the
    small cap leaves it as it is."""

    extra_tol: float = 0.05
    small_cap: int = 2
    groups: list = field(default_factory=list)
    finger_cols: np.ndarray = field(default_factory=lambda: np.zeros(0, dtype=np.int64))
    finger_cap: int = 2

    def describe(self, names: Sequence[str]) -> dict:
        return {"extra_tol": self.extra_tol, "small_cap": self.small_cap, "finger_cap": self.finger_cap,
                "finger_bones": [names[j] for j in self.finger_cols],
                "groups": [{"name": g[0], "a": [names[j] for j in g[1]], "b": [names[j] for j in g[2]], "cap": int(g[3])}
                           for g in self.groups]}


@dataclass
class LimbGroups:
    """Columns whose mass the joint profiles split by position (``skin_profiles.limb_groups``): ``units`` = twist units (a segment
    bone + its twist bones, e.g. {UpperArm, UpperArm_twist}); ``partners`` = {column: [(rows, columns)]}: the other side of the
    crease that splits the column's unit at those rows (``rows`` bool (n_w,) = the crease's zone, None = every row), e.g. Hand ->
    {ForeArm, ForeArm_twist} near the wrist, Thigh -> {Calf} in the knee zone, ForeArm -> {UpperArm, UpperArm_twist} on the elbow
    half of the forearm inside the elbow zone and {Hand} on the wrist half. When ``enforce`` drops an entry of such a column
    (top-k, prune, caps), its weight goes to the surviving entries of its unit, else of its crease partner side on those rows, in
    proportion to them; weight with no such survivor, or on a row outside the zone, is renormalized over the whole row. The
    profiles split a unit, and a crease's two sides inside its zone, by position: weight kept inside the same split comes back
    unchanged when the profiles run again, while weight spread over the row (pelvis, spine ...) or over the limb would change the
    split, and profiles + enforce would drift at every pass (review r1, finding 4). Outside a crease's zone no profile re-splits
    its two sides, so renormalizing is a fixed point too, and stray limb weight there is not moved to the other side of a joint
    far away (review r2: calf weight went to the thigh on belly rows)."""

    units: list = field(default_factory=list)
    partners: dict = field(default_factory=dict)

    def subset(self, rows) -> "LimbGroups":
        """The same groups for the welded rows ``rows`` (index array or bool mask)."""
        return LimbGroups(units=self.units, partners={c: [(None if m is None else m[rows], cols) for m, cols in lst]
                                                      for c, lst in self.partners.items()})

    def describe(self, names: Sequence[str]) -> dict:
        return {"units": [[names[j] for j in u] for u in self.units],
                "partners": {names[c]: [{"bones": [names[j] for j in cols], "rows": None if m is None else int(m.sum())}
                                        for m, cols in lst] for c, lst in self.partners.items()}}


def _give(out, pending, free, src_cols, recv_cols, back, rows=None):
    """Move the pending dropped weight of ``src_cols`` to the surviving free entries of ``recv_cols`` (in proportion), on ``rows``
    (bool mask; None = every row)."""
    lu = pending[:, src_cols].sum(1)
    recv = np.where(free[:, recv_cols], out[:, recv_cols], 0.0)
    ss = recv.sum(1)
    ok = (lu > 0) & (ss > 0)
    if rows is not None:
        ok &= rows
    ok = np.flatnonzero(ok)
    if ok.size:
        out[np.ix_(ok, recv_cols)] += recv[ok] * (lu[ok] / ss[ok])[:, None]
        pending[np.ix_(ok, src_cols)] = 0.0
        back[ok] += lu[ok]


def drop_entries(W, drop, groups: LimbGroups | None = None, locked=None):
    """Zero the entries ``drop`` (bool (n,k)) of ``W``. With ``groups`` the dropped weight of a limb column goes to the surviving
    (unlocked) columns of its unit, else of its crease partners, in proportion (``LimbGroups``); the rest is left for the
    caller's renormalization. Returns (W, dropped weight per row, weight given back inside limbs per row)."""
    W = np.asarray(W, dtype=np.float64)
    drop = np.asarray(drop, bool) & (W != 0)
    lost = np.where(drop, W, 0.0)
    out = np.where(drop, 0.0, W)
    back = np.zeros(W.shape[0])
    if groups is None or not drop.any():
        return out, lost.sum(1), back
    free = np.ones(W.shape, bool) if locked is None else ~np.asarray(locked, bool)
    pending = lost.copy()
    for cols in groups.units:
        _give(out, pending, free, cols, cols, back)
    for c, lst in groups.partners.items():
        for rows, recv_cols in lst:
            if pending[:, c].any():
                _give(out, pending, free, np.array([c]), recv_cols, back, rows)
    return out, lost.sum(1), back


@dataclass
class Constraints:
    """Hard invariants for one asset + bone set on welded vertices.

    ``allowed`` (n_w,k) bool = side gate AND region lists AND rigid; ``region_of`` (n_w,) index into ``regions`` (-1 none) used for
    fold maps; ``rigid_col`` (n_w,) one-hot column for rigid rows (-1 none); ``caps`` (n_w,) hard influence cap per row (<= max);
    ``cap_rule`` the weight-dependent caps (None: off); ``groups`` where dropped limb weight goes (None: renormalize the row);
    ``locked`` (n_w,k) user override entries with values ``locked_val``. ``prune`` threshold and ``max_influences``."""

    bones: BoneSet
    allowed: np.ndarray
    region_of: np.ndarray
    regions: list
    rigid_col: np.ndarray
    caps: np.ndarray
    prune: float = 0.01
    max_influences: int = 4
    locked: np.ndarray | None = None
    locked_val: np.ndarray | None = None
    side_plane: np.ndarray | None = None
    side_band: float = 0.0
    side_allowed: np.ndarray | None = None
    cap_rule: CapRule | None = None
    groups: LimbGroups | None = None
    notes: dict = field(default_factory=dict)
    _fold_cache: dict = field(default_factory=dict, repr=False)

    def copy_with(self, **kw) -> "Constraints":
        d = {k: getattr(self, k) for k in self.__dataclass_fields__ if not k.startswith("_")}
        d.update(kw)
        return Constraints(**d)


def _fold_targets(cons: Constraints, allowed_row: np.ndarray, region: int) -> np.ndarray:
    """Target column per column for one allowed pattern: allowed columns map to themselves; others to the region's fold map,
    else to the nearest allowed bone in the bone tree (ties: nearest bone midpoint, then column order)."""
    key = (allowed_row.tobytes(), region)
    hit = cons._fold_cache.get(key)
    if hit is not None:
        return hit
    bones = cons.bones
    idx = bones.index
    nbrs = cons._fold_cache.get("_tree")
    if nbrs is None:
        nbrs = bones.tree_neighbors()
        cons._fold_cache["_tree"] = nbrs
    mids = bones.midpoints()
    fmap = cons.regions[region].fold if region >= 0 else {}

    def nearest_allowed(j):
        start = bones.names[j]
        seen = {start}
        level = [start]
        while level:
            cand = [idx[n] for n in level if n in idx and allowed_row[idx[n]]]
            if cand:
                d = [float(np.linalg.norm(mids[c] - mids[j])) for c in cand]
                return cand[int(np.lexsort((np.array(cand), np.array(d)))[0])]
            nxt = []
            for n in level:
                for m in nbrs.get(n, []):
                    if m not in seen:
                        seen.add(m)
                        nxt.append(m)
            level = nxt
        al = np.flatnonzero(allowed_row)
        if al.size == 0:
            raise RuleError("a vertex has no allowed bone at all (region lists and side gate exclude everything)")
        d = np.linalg.norm(mids[al] - mids[j], axis=1)
        return int(al[np.argmin(d)])

    tgt = np.arange(bones.k)
    for j in np.flatnonzero(~allowed_row):
        name = bones.names[j]
        t = fmap.get(name, fmap.get("*"))
        tj = idx[t] if t is not None else None
        if tj is None or not allowed_row[tj]:
            tj = nearest_allowed(j if tj is None else tj)
        tgt[j] = tj
    cons._fold_cache[key] = tgt
    return tgt


def fold(W, cons: Constraints) -> np.ndarray:
    """Move every weight on a forbidden (row, bone) into that row's fold target (weights are moved, never lost)."""
    W = np.asarray(W, dtype=np.float64)
    bad_rows = np.flatnonzero(((W != 0) & ~cons.allowed).any(axis=1))
    if bad_rows.size == 0:
        return W.copy()
    out = W.copy()
    keys = np.concatenate([np.packbits(cons.allowed[bad_rows], axis=1),
                           cons.region_of[bad_rows, None].astype(np.int64).view(np.uint8).reshape(len(bad_rows), -1)], axis=1)
    _, inv = np.unique(keys, axis=0, return_inverse=True)
    inv = inv.reshape(-1)
    for g in range(int(inv.max()) + 1):
        rows = bad_rows[inv == g]
        tgt = _fold_targets(cons, cons.allowed[rows[0]], int(cons.region_of[rows[0]]))
        sub = W[rows]
        new = np.zeros_like(sub)
        for j in range(cons.bones.k):
            new[:, tgt[j]] += sub[:, j]
        out[rows] = new
    return out


def checked_fold(W, cons: Constraints, what: str) -> np.ndarray:
    """``fold`` and verify that nothing is left on a forbidden (row, bone) pair; raises ``InvariantError`` (never ``assert``)."""
    W = fold(W, cons)
    left = np.where(~cons.allowed, W, 0.0)
    bad = float(np.abs(left).max()) if W.size else 0.0
    if bad != 0.0:
        rows = np.flatnonzero((left != 0).any(1))
        raise InvariantError(f"{what}: forbidden weight {bad:.3g} survived the fold on {rows.size} rows",
                             {"what": what, "forbidden_weight_max": bad, "rows": rows[:20].tolist()})
    return W


def _normalize(W, locked=None):
    """Rows to sum 1. With ``locked`` entries, only the unlocked part is scaled (to 1 - locked sum); rows whose locked sum is
    >= 1 or that have no unlocked weight are scaled as a whole. All-zero rows stay zero."""
    s = W.sum(axis=1)
    if locked is None or not locked.any():
        return np.where(s[:, None] > 0, W / np.where(s > 0, s, 1.0)[:, None], 0.0)
    Wl = np.where(locked, W, 0.0)
    Wu = W - Wl
    sl, su = Wl.sum(1), Wu.sum(1)
    part = (sl < 1.0 - 1e-12) & (su > 0)
    out = np.where(s[:, None] > 0, W / np.where(s > 0, s, 1.0)[:, None], 0.0)
    f = np.where(part, (1.0 - sl) / np.where(su > 0, su, 1.0), 1.0)
    out[part] = Wl[part] + Wu[part] * f[part, None]
    return out


def top_k(W, caps, locked=None):
    """Keep the ``caps[v]`` largest entries of each row (locked entries rank first; ties: lower column first)."""
    key = W + (2.0 * locked if locked is not None else 0.0)
    order = np.argsort(-key, axis=1, kind="stable")
    rank = np.empty_like(order)
    rows = np.arange(W.shape[0])[:, None]
    rank[rows, order] = np.arange(W.shape[1])[None, :]
    keep = rank < np.asarray(caps)[:, None]
    return np.where(keep, W, 0.0)


def blend_rows(W, cons: Constraints) -> dict:
    """{group name: (bool (n,) rows with weight >= prune on both column sets of the group, cap)} for ``cons.cap_rule``."""
    out = {}
    rule = cons.cap_rule
    if rule is None:
        return out
    for name, ca, cb, cap in rule.groups:
        m = (W[:, ca] >= cons.prune).any(1) & (W[:, cb] >= cons.prune).any(1)
        out[name] = (m, int(cap))
    return out


def _cap_drop(W, caps, locked):
    """Entries beyond the ``caps[v]`` largest of each row (locked entries rank first): bool (n,k)."""
    return (W != 0) & (top_k(W, caps, locked) == 0)


def blend_caps(W, cons: Constraints):
    """(per-row blend cap = the smallest cap of the row's ``blend_rows`` groups, k where the row is in none; ``blend_rows``)."""
    groups = blend_rows(W, cons)
    capb = np.full(W.shape[0], W.shape[1], dtype=np.int64)
    for m, c in groups.values():
        capb[m] = np.minimum(capb[m], c)
    return capb, groups


def _bone_table(names, E, top: int) -> dict:
    """{bone: {entries, weight_sum, weight_max}} of the ``top`` columns of ``E`` (n,k; 0 = no entry) by weight sum."""
    order = [j for j in np.argsort(-E.sum(0), kind="stable") if (E[:, j] > 0).any()][:top]
    return {names[j]: {"entries": int((E[:, j] > 0).sum()), "weight_sum": round(float(E[:, j].sum()), 4),
                       "weight_max": round(float(E[:, j].max()), 4)} for j in order}


def apply_cap_rule(W, cons: Constraints, locked=None):
    """The ``CapRule`` step of ``enforce`` on normalized, pruned rows (see ``CapRule``; dropped limb weight goes back to the limb,
    ``LimbGroups``). Returns (W, report): rows capped per step, the weight removed from the dropped entries (of the normalized row
    before this step) and how much of it went back to the same limb, and per blend group the rows kept over their cap
    (``blend_rows_kept_over_cap_<g>``), the largest kept ``beyond`` (``kept_beyond_max_<g>``) and the top 5 bones of the kept
    entries beyond the cap (``kept_bones_<g>``)."""
    rule = cons.cap_rule
    n, k = W.shape
    names = cons.bones.names
    rep: dict = {"rule": rule.describe(names)}
    nl = locked.sum(1) if locked is not None else np.zeros(n, dtype=np.int64)
    capb, groups = blend_caps(W, cons)
    capb = np.maximum(capb, nl)  # never drop a locked entry
    db = _cap_drop(W, capb, locked)  # the entries ranked after the row's blend cap
    beyond = np.where(db, W, 0.0).sum(1)
    keep = db.any(1) & (beyond >= rule.extra_tol)  # tolerance cap: these rows keep their entries
    cap = np.where(keep, k, capb)
    blend_cut = db.any(1) & ~keep
    fing = np.zeros(n, bool)
    if rule.finger_cols.size:  # the finger cap is hard, also on a kept blend row
        fing = np.isin(W.argmax(1), rule.finger_cols) & (W.sum(1) > 0)
        rep["finger_rows"] = int(fing.sum())
        cap[fing] = np.minimum(cap[fing], int(rule.finger_cap))
        keep &= ~fing
    cap = np.maximum(cap, nl)
    for name, (m, c) in groups.items():
        kg = keep & m
        rep[f"blend_rows_{name}"] = int(m.sum())
        rep[f"blend_rows_kept_over_cap_{name}"] = int(kg.sum())
        rep[f"kept_beyond_max_{name}"] = float(beyond[kg].max()) if kg.any() else 0.0
        rep[f"kept_bones_{name}"] = _bone_table(names, np.where(db & kg[:, None], W, 0.0), 5)
    d1 = _cap_drop(W, cap, locked)
    W1, lost1, back1 = drop_entries(W, d1, cons.groups, locked)
    W1 = _normalize(W1, locked)
    tail = (-np.sort(-W1, axis=1))[:, rule.small_cap:].sum(1)
    small = (tail > 0) & (tail < rule.extra_tol) & (nl == 0)
    d2 = _cap_drop(W1, np.where(small, rule.small_cap, k), locked)
    W2, lost2, back2 = drop_entries(W1, d2, cons.groups, locked)
    W2 = _normalize(W2, locked)
    removed = lost1 + lost2 * np.maximum(1.0 - lost1 + back1, 0.0)  # in units of the row entering this step
    gone = (W > 0) & (W2 == 0)
    rmax = lambda x, m: float(x[m].max()) if m.any() else 0.0  # noqa: E731
    rep.update({"rows_capped_group_or_finger": int(d1.any(1).sum()), "rows_capped_blend": int(blend_cut.sum()),
                "blend_rows_kept_over_cap": int(keep.sum()), "rows_capped_small": int(small.sum()),
                "rows_with_removed_mass": int((removed > 0).sum()), "removed_max": float(removed.max()) if n else 0.0,
                "removed_sum": float(removed.sum()), "rows_removed_over_extra_tol": int((removed >= rule.extra_tol).sum()),
                "blend_cap_removed_max": rmax(lost1, blend_cut & ~fing), "finger_cap_removed_max": rmax(lost1, fing),
                "small_cap_removed_max": float(np.where(small, tail, 0.0).max()) if n else 0.0,
                "given_back_to_limb_sum": float((back1 + back2).sum()),
                "removed_by_bone": _bone_table(names, np.where(gone, W, 0.0), 12)})
    return W2, rep


def enforce(W, cons: Constraints, check: bool = True):
    """fold -> rigid -> fill empty rows -> normalize -> top-k (hard caps) -> prune < cons.prune -> renormalize -> cap rule (when
    ``cons.cap_rule`` is set) -> check.

    ``W`` (n_w,k) welded weights (any non-negative scale). Returns (W float64, report). Empty rows (no weight at all) take the
    nearest allowed bone by distance to the bone segment and are counted in the report; a row whose override entries zero every
    weight it had raises ``ValueError`` (the user removed all weights of a vertex: that is not filled silently). Locked override
    entries keep their values through top-k/prune/caps/normalize (the rest of the row is scaled around them).
    Idempotent: enforce(enforce(W)) == enforce(W)."""
    W = np.array(W, dtype=np.float64, copy=True)
    if W.shape != cons.allowed.shape:
        raise ValueError(f"enforce: W has shape {W.shape}, constraints are for {cons.allowed.shape}")
    if not np.isfinite(W).all():
        raise ValueError("enforce: W contains NaN or inf")
    rep: dict = {"negative_clamped": int((W < 0).sum()), "min_before": float(W.min()) if W.size else 0.0}
    W[W < 0] = 0.0
    locked = cons.locked
    lk = locked if (locked is not None and locked.any()) else None
    if lk is not None:
        W[lk] = cons.locked_val[lk]
    moved = float(np.where(~cons.allowed, W, 0.0).sum())
    W = fold(W, cons)
    rep["folded_weight_sum"] = moved
    r = cons.rigid_col >= 0
    if r.any():
        W[r] = 0.0
        W[np.flatnonzero(r), cons.rigid_col[r]] = 1.0
    empty = W.sum(1) <= 0
    if lk is not None and (empty & lk.any(1)).any():
        bad = np.flatnonzero(empty & lk.any(1))
        P = cons.notes.get("_P")
        where = [list(map(float, P[v])) for v in bad[:5]] if P is not None else bad[:5].tolist()
        raise ValueError(f"enforce: overrides zero every weight of {bad.size} vertices (first at {where}); give each edited "
                         f"vertex at least one bone with weight > 0")
    rep["empty_filled"] = int(empty.sum())
    if empty.any():
        rows = np.flatnonzero(empty)
        b = cons.bones
        P = cons.notes.get("_P")
        if P is None:
            raise ValueError("enforce: rows without weight and no positions to fill them (call attach_positions)")
        D = np.stack([seg_dist(P[rows], b.head[j], b.tail[j])[0] for j in range(b.k)], axis=1)
        D[~cons.allowed[rows]] = np.inf
        W[rows, np.argmin(D, axis=1)] = 1.0
    W = _normalize(W, lk)
    W, lost, _ = drop_entries(W, _cap_drop(W, cons.caps, lk), cons.groups, lk)
    rep["topk_removed_max"] = float(lost.max()) if W.size else 0.0
    rowmax = W.max(axis=1, keepdims=True)
    small = (W > 0) & (W < cons.prune) & (W < rowmax)
    if lk is not None:
        small &= ~lk
    rep["pruned"] = int(small.sum())
    W, _, _ = drop_entries(W, small, cons.groups, lk)
    W = _normalize(W, lk)
    if cons.cap_rule is not None:
        W, rep["caps"] = apply_cap_rule(W, cons, lk)
    if check:
        rep["invariants"] = check_invariants(W, cons)
    return W, rep


def attach_positions(cons: Constraints, P) -> Constraints:
    """Remember welded positions (a ``WeldTopo`` or an (n_w,3) array, metres) in ``cons``: ``enforce`` uses them to fill empty
    rows and to name zeroed override rows."""
    cons.notes["_P"] = np.asarray(P.P if isinstance(P, WeldTopo) else P, dtype=np.float64)
    return cons


def check_invariants(W, cons: Constraints, tol: float = SUM_TOL) -> dict:
    """Check: finite, >= 0, row sums 1 +- tol, nonzeros <= caps <= max_influences, no empty row, nothing on forbidden
    (row, bone) pairs (side gate, region lists, rigid), rigid rows one-hot, no unlocked weight below prune except a row's
    maximum, and with a cap rule (unlocked rows): no blend row with more influences than its cap whose entries beyond the cap sum
    below ``extra_tol`` (the tolerance cap; rows at or above it are counted in ``blend_rows_kept_over_cap``), finger rows within
    ``finger_cap``, no row with more than ``small_cap`` influences whose extra influences sum below ``extra_tol``. Raises
    ``InvariantError`` with the numbers; returns the numbers on success."""
    W = np.asarray(W, dtype=np.float64)
    nnz = (W > 0).sum(1)
    s = W.sum(1)
    rep = {
        "n": int(W.shape[0]),
        "sum_err_max": float(np.abs(s - 1.0).max()) if W.size else 0.0,
        "min_weight": float(W.min()) if W.size else 0.0,
        "max_influences": int(nnz.max()) if W.size else 0,
        "influence_hist": {str(i): int((nnz == i).sum()) for i in range(0, cons.max_influences + 1)},
        "over_cap": int((nnz > cons.caps).sum()),
        "empty": int((nnz == 0).sum()),
        "forbidden_weight_max": float(np.where(~cons.allowed, W, 0.0).max()) if W.size else 0.0,
        "forbidden_rows": int(((W > 0) & ~cons.allowed).any(1).sum()),
    }
    r = cons.rigid_col >= 0
    rep["rigid_rows"] = int(r.sum())
    rep["rigid_bad"] = int((np.abs(W[np.flatnonzero(r), cons.rigid_col[r]] - 1.0) > tol).sum()) if r.any() else 0
    unl = (W > 0) & (W < W.max(1, keepdims=True))
    if cons.locked is not None:
        unl &= ~cons.locked
    rep["below_prune"] = int((unl & (W < cons.prune - 1e-12)).sum())
    errs = []
    if cons.cap_rule is not None:
        rule = cons.cap_rule
        free = np.ones(W.shape[0], bool) if cons.locked is None else ~cons.locked.any(1)
        srt = -np.sort(-W, axis=1)
        capb, _ = blend_caps(W, cons)
        beyond = np.where(np.arange(W.shape[1])[None, :] >= capb[:, None], srt, 0.0).sum(1)
        over_b = free & (nnz > capb)
        over = over_b & (beyond < rule.extra_tol - 1e-9)
        if rule.finger_cols.size:
            over |= np.isin(W.argmax(1), rule.finger_cols) & (nnz > rule.finger_cap) & free
        tail = srt[:, rule.small_cap:].sum(1)
        smallv = free & (nnz > rule.small_cap) & (tail < rule.extra_tol - 1e-9)
        rep["cap_rule_over"] = int(over.sum())
        rep["blend_rows_kept_over_cap"] = int((over_b & (beyond >= rule.extra_tol - 1e-9)).sum())
        rep["cap_rule_small_tail"] = int(smallv.sum())
        if over.any() or smallv.any():
            errs.append(f"cap rule: {int(over.sum())} blend/finger rows over their cap, {int(smallv.sum())} rows keep "
                        f"influences that sum below {rule.extra_tol}")
    if not np.isfinite(W).all():
        errs.append("non-finite weights")
    if rep["min_weight"] < 0:
        errs.append(f"negative weight {rep['min_weight']:.3g}")
    if rep["sum_err_max"] > tol:
        errs.append(f"row sums off by {rep['sum_err_max']:.3g} > {tol:g}")
    if rep["max_influences"] > cons.max_influences or rep["over_cap"]:
        errs.append(f"{rep['over_cap']} rows over their influence cap (max {rep['max_influences']})")
    if rep["empty"]:
        errs.append(f"{rep['empty']} empty rows")
    if rep["forbidden_rows"]:
        errs.append(f"{rep['forbidden_rows']} rows carry weight on forbidden bones (max {rep['forbidden_weight_max']:.3g})")
    if rep["rigid_bad"]:
        errs.append(f"{rep['rigid_bad']} rigid rows are not one-hot")
    if rep["below_prune"]:
        errs.append(f"{rep['below_prune']} weights below prune {cons.prune}")
    if errs:
        raise InvariantError("weight invariants failed: " + "; ".join(errs), rep)
    return rep


def seam_max_diff(W_full, weld) -> float:
    """Largest weight difference between co-located duplicates of a per-original-vertex weight array."""
    W_full = np.asarray(W_full, dtype=np.float64)
    weld = np.asarray(weld)
    n_w = int(weld.max()) + 1
    lo = np.full((n_w, W_full.shape[1]), np.inf)
    hi = np.full((n_w, W_full.shape[1]), -np.inf)
    np.minimum.at(lo, weld, W_full)
    np.maximum.at(hi, weld, W_full)
    return float((hi - lo).max()) if W_full.size else 0.0


# --------------------------------------------------------------------------------------------------------------------------
# runtime exporter rule
# --------------------------------------------------------------------------------------------------------------------------


def exporter_rule(W, drop: float = 1e-4, k: int = 4) -> np.ndarray:
    """What the Blender glTF exporter writes (export-runtime.md): weights <= ``drop`` removed, the ``k`` largest kept (ties: lower
    column first), rows renormalized; all-zero rows stay zero (the exporter would bind them to a neutral joint). float64."""
    W = np.array(W, dtype=np.float64, copy=True)
    W[W <= drop] = 0.0
    W = top_k(W, np.full(W.shape[0], k))
    return _normalize(W)


# --------------------------------------------------------------------------------------------------------------------------
# user overrides (weights_override.json)
# --------------------------------------------------------------------------------------------------------------------------


def match_positions(P_w, Q, tol: float):
    """For each query point in ``Q`` (q,3) the welded id whose position is nearest, or -1 if none lies within ``tol`` (m). Brute
    force in chunks of 32 queries (override files are small; numpy only, so it also runs inside Blender)."""
    P_w = np.asarray(P_w, dtype=np.float64)
    Q = np.asarray(Q, dtype=np.float64).reshape(-1, 3)
    out = np.full(len(Q), -1, dtype=np.int64)
    for i0 in range(0, len(Q), 32):
        q = Q[i0:i0 + 32]
        d2 = ((q[:, None, :] - P_w[None, :, :]) ** 2).sum(-1)
        j = d2.argmin(1)
        ok = d2[np.arange(len(q)), j] <= tol * tol
        out[i0:i0 + 32] = np.where(ok, j, -1)
    return out


def overrides_record(P_w, bone_names: Sequence[str], W_ref, W_user, asset_id: str, H: float, tol: float = 1e-6,
                     pos_tol: float | None = None) -> dict:
    """Diff the user's welded weights against the generated ones: every welded row whose largest change exceeds ``tol`` is
    recorded completely (each bone with a non-zero user weight, plus bones the user set to zero) keyed by its welded position.
    A changed row without any weight left raises ``ValueError`` (a vertex must keep at least one bone)."""
    W_ref = np.asarray(W_ref, dtype=np.float64)
    W_user = np.asarray(W_user, dtype=np.float64)
    diff = np.abs(W_user - W_ref).max(1)
    rows = np.flatnonzero(diff > tol)
    zeroed = rows[W_user[rows].sum(1) <= 0]
    if zeroed.size:
        raise ValueError(f"overrides_record: the edits remove every weight of {zeroed.size} vertices (first at "
                         f"{[list(map(float, P_w[v])) for v in zeroed[:5]]}); give each vertex at least one bone")
    entries = []
    for v in rows:
        for j in np.flatnonzero((W_user[v] > 0) | (W_ref[v] > 0)):
            entries.append({"pos": [float(c) for c in P_w[v]], "bone": bone_names[j], "weight": float(W_user[v, j])})
    return {"schema": 0, "kind": "weights_override", "asset_id": asset_id, "H": float(H),
            "pos_tol": float(pos_tol if pos_tol is not None else 1e-5 * H), "entries": entries}


def overrides_apply(doc: Mapping, P_w, bones: BoneSet, pos_tol: float | None = None):
    """Turn override entries into (locked bool (n_w,k), values (n_w,k), report). Entries whose position matches no welded vertex
    within ``pos_tol`` (default ``doc["pos_tol"]``) or whose bone is not a column are reported, not applied."""
    n_w = len(P_w)
    locked = np.zeros((n_w, bones.k), bool)
    vals = np.zeros((n_w, bones.k))
    ents = list(doc.get("entries", []))
    tol = float(pos_tol if pos_tol is not None else doc.get("pos_tol", 1e-5 * bones.H))
    rep = {"entries": len(ents), "applied": 0, "unmatched_pos": 0, "unknown_bone": []}
    if not ents:
        return locked, vals, rep
    ids = match_positions(P_w, [e["pos"] for e in ents], tol)
    idx = bones.index
    for e, v in zip(ents, ids):
        if v < 0:
            rep["unmatched_pos"] += 1
            continue
        j = idx.get(e["bone"])
        if j is None:
            rep["unknown_bone"].append(e["bone"])
            continue
        locked[v, j] = True
        vals[v, j] = float(e["weight"])
        rep["applied"] += 1
    rep["rows"] = int(locked.any(1).sum())
    return locked, vals, rep


# --------------------------------------------------------------------------------------------------------------------------
# comparison helpers
# --------------------------------------------------------------------------------------------------------------------------


def compare_weights(W_a, W_b, names_a: Sequence[str], names_b: Sequence[str], weld=None) -> dict:
    """Per-vertex L1 = sum_j |a_j - b_j| over the union of bone names (missing columns count as 0), on welded rows when ``weld`` is
    given (rows are gathered by mean), plus dominant-bone agreement. Returns numbers for reports."""
    union = list(dict.fromkeys(list(names_a) + list(names_b)))

    def full(W, names):
        W = np.asarray(W, dtype=np.float64)
        out = np.zeros((W.shape[0], len(union)))
        for j, n in enumerate(names):
            out[:, union.index(n)] = W[:, j]
        return out

    A, B = full(W_a, names_a), full(W_b, names_b)
    if weld is not None:
        weld = np.asarray(weld)
        n_w = int(weld.max()) + 1
        cnt = np.bincount(weld, minlength=n_w)[:, None]
        Aw = np.zeros((n_w, A.shape[1]))
        np.add.at(Aw, weld, A)
        A = Aw / cnt
        Bw = np.zeros((n_w, B.shape[1]))
        np.add.at(Bw, weld, B)
        B = Bw / cnt
    l1 = np.abs(A - B).sum(1)
    da, db = A.argmax(1), B.argmax(1)
    agree = da == db
    per_bone = {}
    for j, n in enumerate(union):
        m = db == j
        if m.any():
            per_bone[n] = {"n_dominant_ref": int(m.sum()), "agree": float(agree[m].mean())}
    return {"n": int(A.shape[0]), "l1_mean": float(l1.mean()), "l1_max": float(l1.max()), "l1_p99": float(np.quantile(l1, 0.99)),
            "dominant_agreement": float(agree.mean()), "per_bone": per_bone, "l1_rows": l1}


def to_full(Ww, topo: WeldTopo) -> np.ndarray:
    """Welded weights -> per-original-vertex float32 (seam duplicates identical)."""
    return np.asarray(topo.scatter(Ww), dtype=np.float32)


# --------------------------------------------------------------------------------------------------------------------------
# limb leak (references/deformation-qa.md "Limb leak", review B r3)
# --------------------------------------------------------------------------------------------------------------------------

#: base names (side prefix and ``_twist`` suffix removed) of the bones on a limb chain; their descendants (fingers) count too
LIMB_BASES = ("Clavicle", "UpperArm", "ForeArm", "Hand", "Thigh", "Calf", "Foot", "Toe")
#: fallback parameters of ``limb_leak``; the values in use come from thresholds.json row ``weights_limb_leak``
LEAK_PARAMS = {"w_min": 0.1, "arm_rel": 0.75, "thigh_rel": 0.3}
LEAK_BAND = 3
LEAK_GATE_REGIONS = ("pelvis", "spine_01", "spine_02", "spine_03", "chest", "neck", "{S}_Clavicle", "{S}_UpperArm", "{S}_Thigh")
THRESHOLDS_JSON = os.path.join(os.path.dirname(os.path.abspath(__file__)), "thresholds.json")


def leak_config(path=None) -> dict:
    """The limb-leak numbers of thresholds.json row ``weights_limb_leak`` (``path`` default: the file next to this module):
    {"params": {w_min, arm_rel, thigh_rel}, "band": the green bound (rows a candidate may have in a gate region), "red",
    "gate_regions": names with ``{S}`` expanded}. Missing file or row: the module fallbacks."""
    row: dict = {}
    p = os.fspath(path) if path is not None else THRESHOLDS_JSON
    if os.path.isfile(p):
        with open(p, "rb") as f:
            doc = json.loads(f.read().decode("utf-8"))
        row = next((r for r in doc.get("rows", []) if r.get("id") == "weights_limb_leak"), {})
    gate = row.get("gate_regions", LEAK_GATE_REGIONS)
    return {"params": {k: float(row.get(k, v)) for k, v in LEAK_PARAMS.items()},
            "band": float((row.get("green") or [None, LEAK_BAND])[1]), "red": float((row.get("red") or [None, 10])[1]),
            "gate_regions": sorted({g.replace("{S}", s) for g in gate for s in ("L", "R")}),
            "source": p if row else "skin_common fallbacks"}


def limb_base(name: str) -> str:
    """``L_UpperArm_twist`` -> ``UpperArm`` (side prefix and any ``_twist...`` suffix removed)."""
    return base_name(name).split("_twist")[0]


def limb_columns(names: Sequence[str], parent_of: Mapping | None = None) -> np.ndarray:
    """bool (k,): the columns ``names`` that lie on a limb chain: ``limb_base`` in ``LIMB_BASES``, or an ancestor in ``parent_of``
    ({bone: parent name or None}) that does (fingers under the hand). Unsided bones, ears, sacks and other aux bones are not limb
    bones."""
    parent_of = dict(parent_of or {})
    out = np.zeros(len(names), bool)
    for j, n in enumerate(names):
        cur, seen = str(n), set()
        while cur is not None and cur not in seen:
            if bone_side(cur) and limb_base(cur) in LIMB_BASES:
                out[j] = True
                break
            seen.add(cur)
            cur = parent_of.get(cur)
    return out


def limb_leak(P, W, names: Sequence[str], heads, tails, parent_of: Mapping | None = None, w_min: float = LEAK_PARAMS["w_min"],
              arm_rel: float = LEAK_PARAMS["arm_rel"], thigh_rel: float = LEAK_PARAMS["thigh_rel"], regions: Mapping | None = None,
              with_mask: bool = False) -> dict:
    """Limb weight leaking onto the torso (references/deformation-qa.md "Limb leak"; review B r3, the review's ``stray_cmp.py``).

    A row is a TORSO row when its nearest weight-column segment (head-tail, ``heads``/``tails`` (k,3) at rest, m) is not a limb
    bone (``limb_columns``: so torso, neck, head and aux bones such as a sack or an ear). A torso row LEAKS when it carries
    >= ``w_min`` of a limb root far from it, per side S:

    * ``arm_S``: the upper-arm unit (``S_UpperArm`` + its twist columns), the row farther than ``arm_rel`` x upper-arm length
      from the ``S_UpperArm`` segment;
    * ``thigh_S``: ``S_Thigh``, the row more than ``thigh_rel`` thigh lengths above the hip joint along the thigh axis
      (u = (P - head) . (head - tail) / L^2: 0 at the hip joint, > 0 on the side away from the knee).

    ``P`` (n,3) row positions (m), ``W`` (n,k) weights of the columns ``names``. Per side and limb: ``rows`` (leaking rows),
    ``w_max`` (largest limb weight on the far / high torso rows, also below ``w_min``), the unit's ``bones`` and ``length_m``;
    for the thigh also the review's numbers ``rows_above_joint`` (torso rows with u > 0 and weight >= ``w_min``), their largest
    height ``height_max_rel`` (thigh lengths) and ``w_max_above_joint``. ``rows`` = union over sides and limbs (the light value),
    ``w_max`` = largest leaking weight; with ``regions`` ({name: bool (n,)}) ``by_region`` = {region: {"rows", limb: rows}} for
    the regions that hold leaking rows. Measurement only. Returns a JSON-able dict (+ ``mask`` bool (n,) with ``with_mask``)."""
    P = np.asarray(P, dtype=np.float64).reshape(-1, 3)
    W = np.asarray(W, dtype=np.float64)
    names = [str(x) for x in names]
    A = np.asarray(heads, dtype=np.float64).reshape(-1, 3)
    B = np.asarray(tails, dtype=np.float64).reshape(-1, 3)
    if W.shape != (len(P), len(names)) or A.shape != B.shape or len(A) != len(names):
        raise ValueError(f"limb_leak: P {P.shape}, W {W.shape}, {len(names)} names, heads {A.shape}, tails {B.shape}")
    n, k = W.shape
    idx = {nm: j for j, nm in enumerate(names)}
    limb = limb_columns(names, parent_of)
    D = np.stack([seg_dist(P, A[j], B[j])[0] for j in range(k)], axis=1) if k and n else np.zeros((n, k))
    torso = ~limb[D.argmin(1)] if k and n else np.zeros(n, bool)
    union = np.zeros(n, bool)
    rmax = lambda x, m: float(x[m].max()) if m.any() else 0.0  # noqa: E731
    by: dict = {}
    masks: dict = {}
    for s in ("L", "R"):
        ua = f"{s}_UpperArm"
        if ua in idx:
            j = idx[ua]
            unit = [j] + [i for i, nm in enumerate(names) if i != j and bone_side(nm) == s and limb_base(nm) == "UpperArm"]
            L = float(np.linalg.norm(B[j] - A[j]))
            far = torso & (D[:, j] > arm_rel * L)
            w = W[:, unit].sum(1)
            m = far & (w >= w_min)
            by[f"arm_{s}"] = {"rows": int(m.sum()), "w_max": rmax(w, far), "bones": [names[i] for i in unit], "length_m": L}
            masks[f"arm_{s}"] = m
        th = f"{s}_Thigh"
        if th in idx:
            j = idx[th]
            L = float(np.linalg.norm(B[j] - A[j]))
            u = (P - A[j]) @ (A[j] - B[j]) / max(L * L, 1e-30)
            w = W[:, j]
            high = torso & (u > thigh_rel)
            m = high & (w >= w_min)
            above = torso & (u > 0) & (w >= w_min)
            by[f"thigh_{s}"] = {"rows": int(m.sum()), "w_max": rmax(w, high), "bones": [th], "length_m": L,
                                "rows_above_joint": int(above.sum()), "height_max_rel": rmax(u, above),
                                "w_max_above_joint": rmax(w, torso & (u > 0))}
            masks[f"thigh_{s}"] = m
    for m in masks.values():
        union |= m
    wl = np.zeros(n)
    for key, m in masks.items():
        cols = [idx[b] for b in by[key]["bones"]]
        wl = np.where(m, np.maximum(wl, W[:, cols].sum(1)), wl)
    out = {"rows": int(union.sum()), "w_max": float(wl.max()) if n else 0.0, "torso_rows": int(torso.sum()), "by_limb": by,
           "params": {"w_min": float(w_min), "arm_rel": float(arm_rel), "thigh_rel": float(thigh_rel)}}
    if regions is not None:
        br = {}
        for r, rm in regions.items():
            rm = np.asarray(rm, bool)
            c = int((union & rm).sum())
            if c:
                br[str(r)] = {"rows": c, **{key: int((m & rm).sum()) for key, m in masks.items() if (m & rm).any()}}
        out["by_region"] = br
    if with_mask:
        out["mask"] = union
    return out
