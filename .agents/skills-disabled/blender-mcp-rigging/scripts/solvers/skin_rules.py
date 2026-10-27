"""solvers.skin_rules - asset rules (``skin_rules.json``) for the skin candidates (owner B, P3): rule expressions, class labels,
side-gate planes, the constraint builder and the common start / end of every candidate (``prepare`` / ``finish``).

* ``eval_expr``: a tiny, safe expression language for asset rules - e.g. ``"cls == 'main' and z > 0.2 and seg_dist('L_ear') <
  0.022"`` - evaluated as numpy arrays over welded vertices. Only the AST nodes listed in ``eval_expr`` are accepted; there is no
  ``eval``/``exec``.
* ``classify``: ordered labelling steps (islands, set, vote) -> one class label per welded vertex.
* ``side_planes``: the side gate's planes come from the skeleton, never x = 0 (skinning.md §3 "Enforce"): torso plane = median x
  of the heads and tails of the unsided deform core bones; each sided chain (from its topmost sided bone: ``{S}_Clavicle``,
  ``{S}_Thigh``, ``{S}_ear`` ...) pairs with its mirror and gets the mean x of the two chain roots' heads (D01 legs 0.0105, FL arms
  0.042 and legs 0.049); every sided bone of the chain uses that plane, a chain without a mirror the torso plane. Rules override
  (``side_gate.x0`` the torso plane, ``side_gate.planes`` listed bones); a rules plane more than half a band off the skeleton's
  plane for the same bones gives a warning. The planes used are reported.
* ``build_constraints``: side gate, region lists, rigid islands, the influence-cap rule and limb groups of the joint profiles ->
  ``Constraints``.
* ``prepare`` / ``finish``: welded topology, columns, colours, classes, constraints / joint profiles then ``enforce``, repeated
  until a pass changes nothing (idempotent: finish(finish(W)) == finish(W)).

``skin_rules.json`` (schema 0; every key optional; bone lists may use ``{S}``; names that are not weight columns are dropped):

    {"schema": 0, "asset_id": ..., "note": ...,
     "side_gate": {"x0": <torso plane>, "band_H": 0.01, "planes": [{"x0": 0.0105, "bones": ["{S}_Thigh", ...]}]},
     "classes":   [classify steps: islands / set / vote],
     "regions":   {name: {"where" | "vertex_ids", "allowed": [...], "fold": {bone|*: bone}}},
     "rigid":     {name: {"where" | "vertex_ids", "bone": name}},
     "enforce":   {"prune": 0.01, "max_influences": 4},
     "profiles":  {"enabled": true, ...}                     (skin_profiles.PROFILE_DEFAULTS),
     "candidate_a" | "candidate_b" | "candidate_c": {...}    (the candidate modules)}

Units: metres. Frame: Blender, Z up, front -Y, left +X. numpy + skin_common + skin_profiles only.
"""
from __future__ import annotations

import ast
import json
import warnings
from dataclasses import dataclass, field
from typing import Any, Mapping, Sequence

import numpy as np

from solvers import skin_common as sc
from solvers import skin_profiles as sp

RuleError = sc.RuleError

# --------------------------------------------------------------------------------------------------------------------------
# rule expressions
# --------------------------------------------------------------------------------------------------------------------------

_CMP = {ast.Lt: np.less, ast.LtE: np.less_equal, ast.Gt: np.greater, ast.GtE: np.greater_equal, ast.Eq: np.equal,
        ast.NotEq: np.not_equal}
_BIN = {ast.Add: np.add, ast.Sub: np.subtract, ast.Mult: np.multiply, ast.Div: np.divide, ast.Pow: np.power}


def eval_expr(expr: str, env: Mapping[str, Any], funcs: Mapping[str, Any] | None = None):
    """Evaluate a rule expression over numpy arrays.

    Grammar (Python expression syntax, whitelisted nodes only): numbers, strings, True/False, names from ``env``, ``+ - * / **``,
    unary ``- not``, comparisons incl. chains (``0.17 < z < 0.31``) and ``in`` / ``not in`` with a literal tuple/list, ``and`` /
    ``or`` (elementwise), calls of the functions in ``funcs`` with positional arguments. Raises ``RuleError`` for anything else."""
    funcs = funcs or {}
    try:
        tree = ast.parse(expr, mode="eval")
    except SyntaxError as e:
        raise RuleError(f"rule {expr!r}: syntax error ({e.msg})") from None

    def ev(node):
        if isinstance(node, ast.Constant):
            if isinstance(node.value, (int, float, str, bool)):
                return node.value
            raise RuleError(f"rule {expr!r}: constant {node.value!r} not allowed")
        if isinstance(node, ast.Name):
            if node.id not in env:
                raise RuleError(f"rule {expr!r}: unknown name {node.id!r} (known: {', '.join(sorted(env))})")
            return env[node.id]
        if isinstance(node, ast.BoolOp):
            vals = [np.asarray(ev(v), dtype=bool) for v in node.values]
            f = np.logical_and if isinstance(node.op, ast.And) else np.logical_or
            out = vals[0]
            for v in vals[1:]:
                out = f(out, v)
            return out
        if isinstance(node, ast.UnaryOp):
            v = ev(node.operand)
            if isinstance(node.op, ast.Not):
                return np.logical_not(np.asarray(v, dtype=bool))
            if isinstance(node.op, ast.USub):
                return -np.asarray(v, dtype=np.float64)
            if isinstance(node.op, ast.UAdd):
                return np.asarray(v, dtype=np.float64)
            raise RuleError(f"rule {expr!r}: unary operator {type(node.op).__name__} not allowed")
        if isinstance(node, ast.BinOp):
            f = _BIN.get(type(node.op))
            if f is None:
                raise RuleError(f"rule {expr!r}: operator {type(node.op).__name__} not allowed")
            return f(np.asarray(ev(node.left), dtype=np.float64), np.asarray(ev(node.right), dtype=np.float64))
        if isinstance(node, ast.Compare):
            left = ev(node.left)
            out = None
            for op, rnode in zip(node.ops, node.comparators):
                if isinstance(op, (ast.In, ast.NotIn)):
                    if not isinstance(rnode, (ast.Tuple, ast.List)):
                        raise RuleError(f"rule {expr!r}: 'in' needs a literal tuple or list")
                    items = [ev(e) for e in rnode.elts]
                    r = np.isin(np.asarray(left), items)
                    if isinstance(op, ast.NotIn):
                        r = ~r
                    right = None
                else:
                    f = _CMP.get(type(op))
                    if f is None:
                        raise RuleError(f"rule {expr!r}: comparison {type(op).__name__} not allowed")
                    right = ev(rnode)
                    r = f(np.asarray(left), np.asarray(right))
                out = r if out is None else np.logical_and(out, r)
                left = right if right is not None else left
            return out
        if isinstance(node, ast.Call):
            if not isinstance(node.func, ast.Name) or node.func.id not in funcs:
                name = node.func.id if isinstance(node.func, ast.Name) else "?"
                raise RuleError(f"rule {expr!r}: unknown function {name!r} (known: {', '.join(sorted(funcs))})")
            if node.keywords:
                raise RuleError(f"rule {expr!r}: keyword arguments are not allowed")
            return funcs[node.func.id](*[ev(a) for a in node.args])
        if isinstance(node, (ast.Tuple, ast.List)):
            return [ev(e) for e in node.elts]
        raise RuleError(f"rule {expr!r}: syntax element {type(node).__name__} not allowed")

    return ev(tree.body)


def _as_mask(v, n: int, expr: str) -> np.ndarray:
    a = np.asarray(v)
    if a.dtype != bool:
        raise RuleError(f"rule {expr!r}: must give a boolean, got {a.dtype}")
    if a.ndim == 0:
        return np.full(n, bool(a))
    if a.shape != (n,):
        raise RuleError(f"rule {expr!r}: result has shape {a.shape}, expected ({n},)")
    return a


@dataclass
class RuleContext:
    """Everything a vertex rule can read. ``colors`` (n_w,3) linear RGB in [0,1] per welded id (mean of duplicates) or None;
    ``labels`` the current class per welded id; ``x0`` the torso plane and ``x0_by_bone`` the side planes of sided bones (m)."""

    topo: sc.WeldTopo
    bones: sc.BoneSet
    colors: np.ndarray | None = None
    labels: np.ndarray | None = None
    x0: float = 0.0
    x0_by_bone: dict = field(default_factory=dict)

    def plane(self, bone: str | None) -> float:
        return float(self.x0_by_bone.get(bone, self.x0)) if bone else self.x0

    def env(self, side: str | None = None, plane_bone: str | None = None) -> dict:
        P = self.topo.P
        x, y, z = P[:, 0], P[:, 1], P[:, 2]
        x0 = self.plane(plane_bone)
        e = {"x": x, "y": y, "z": z, "H": self.topo.H, "ax": np.abs(x - x0),
             "nx": self.topo.normals[:, 0], "ny": self.topo.normals[:, 1], "nz": self.topo.normals[:, 2]}
        if side is not None:
            s = sc.SIDE_SIGN[side]
            e["s"] = s
            e["sx"] = s * (x - x0)
        if self.labels is not None:
            e["cls"] = self.labels
        if self.colors is not None:
            C = self.colors
            e.update(r=C[:, 0], g=C[:, 1], b=C[:, 2], rg=C[:, 0] / np.maximum(C[:, 1], 1e-3))
        isl = self.topo.island
        sizes = np.bincount(isl, minlength=self.topo.n_islands)
        e["island_size"] = sizes[isl]
        e["is_main"] = isl == int(np.argmax(sizes))
        return e

    def funcs(self, side: str | None = None) -> dict:
        P = self.topo.P

        def bone_seg(name):
            nm = sc.sub_side(str(name), side)
            b = self.bones.all_bones.get(nm)
            if b is None:
                raise RuleError(f"unknown bone {nm!r} in a rule")
            return np.asarray(b["head"], float), np.asarray(b["tail"], float)

        def f_seg_dist(name):
            return sc.seg_dist(P, *bone_seg(name))[0]

        def f_seg_t(name):
            return sc.seg_dist(P, *bone_seg(name))[1]

        def f_ellipsoid(cx, cy, cz, rx, ry, rz):
            return ((P[:, 0] - cx) / rx) ** 2 + ((P[:, 1] - cy) / ry) ** 2 + ((P[:, 2] - cz) / rz) ** 2

        def f_head(name, axis):
            return float(bone_seg(name)[0]["xyz".index(axis)])

        def f_tail(name, axis):
            return float(bone_seg(name)[1]["xyz".index(axis)])

        return {"abs": np.abs, "min": np.minimum, "max": np.maximum, "seg_dist": f_seg_dist, "seg_t": f_seg_t,
                "ellipsoid": f_ellipsoid, "head": f_head, "tail": f_tail}

    def mask(self, expr: str, side: str | None = None, plane_bone: str | None = None) -> np.ndarray:
        e = sc.sub_side(expr, side)
        return _as_mask(eval_expr(e, self.env(side, plane_bone), self.funcs(side)), self.topo.n_w, e)

    def value(self, expr: str, side: str | None = None, plane_bone: str | None = None) -> np.ndarray:
        e = sc.sub_side(expr, side)
        v = np.asarray(eval_expr(e, self.env(side, plane_bone), self.funcs(side)), dtype=np.float64)
        return np.broadcast_to(v, (self.topo.n_w,)).copy() if v.ndim == 0 else v


def island_env(ctx: RuleContext) -> tuple[dict, np.ndarray]:
    """Per-island variables for ``classify`` island rules: ``size`` (welded vertices), centroid ``cx cy cz``, bounds ``lo_* hi_*``,
    mean colour ``cr cg cb`` and ``crg`` = cr / cg (only with colours), ``main`` (largest island). Returns (env, ids)."""
    topo = ctx.topo
    isl, n = topo.island, topo.n_islands
    size = np.bincount(isl, minlength=n).astype(np.float64)
    e: dict = {"size": size, "main": np.arange(n) == int(np.argmax(size)), "H": topo.H}
    for a, nm in enumerate("xyz"):
        c = topo.P[:, a]
        e["c" + nm] = np.bincount(isl, weights=c, minlength=n) / size
        lo = np.full(n, np.inf)
        hi = np.full(n, -np.inf)
        np.minimum.at(lo, isl, c)
        np.maximum.at(hi, isl, c)
        e["lo_" + nm], e["hi_" + nm] = lo, hi
    if ctx.colors is not None:
        for a, nm in enumerate("rgb"):
            e["c" + nm] = np.bincount(isl, weights=ctx.colors[:, a], minlength=n) / size
        e["crg"] = e["cr"] / e["cg"]
    return e, np.arange(n)


def classify(ctx: RuleContext, steps: Sequence[Mapping], default: str = "body") -> np.ndarray:
    """Run ordered labelling steps; returns labels (n_w,) numpy unicode. Steps:

    * ``{"islands": {"main": <label>, "rules": [{"if": <island expr>, "set": <label>}, ...], "else": <label>}}``: the largest
      island gets ``main``; every other island the label of the first matching rule (island variables: see ``island_env``);
    * ``{"set": <label>, "where": <vertex expr>}``: relabel the vertices where the expression holds;
    * ``{"vote": {"among": [a, b], "target": b, "other": a, "iters": n, "min_nbrs": k, "grow_frac": f, "grow_where": <expr>,
      "shrink_frac": g}}``: neighbour majority clean-up between two labels (Jacobi: all changes of one sweep apply together):
      an ``other`` vertex with > f of its ``among`` neighbours in ``target`` (and ``grow_where``) becomes ``target``; a ``target``
      vertex with < g becomes ``other``; vertices with fewer than k ``among`` neighbours are skipped.
    """
    n_w = ctx.topo.n_w
    labels = np.full(n_w, default, dtype="<U32")
    ctx.labels = labels
    for i, st in enumerate(steps):
        if "islands" in st:
            spec = st["islands"]
            ienv, ids = island_env(ctx)
            lab_isl = np.full(ctx.topo.n_islands, spec.get("else", default), dtype="<U32")
            done = np.zeros(ctx.topo.n_islands, bool)
            done |= ienv["main"]
            lab_isl[ienv["main"]] = spec.get("main", default)
            for r in spec.get("rules", []):
                m = _as_mask(eval_expr(r["if"], ienv, {"abs": np.abs, "min": np.minimum, "max": np.maximum}),
                             ctx.topo.n_islands, r["if"])
                m &= ~done
                lab_isl[m] = r["set"]
                done |= m
            labels[:] = lab_isl[ctx.topo.island]
        elif "set" in st:
            m = ctx.mask(st["where"])
            labels[m] = st["set"]
        elif "vote" in st:
            v = st["vote"]
            a_lab, t_lab = v["other"], v["target"]
            among = list(v["among"])
            grow_where = ctx.mask(v.get("grow_where", "True"))
            for _ in range(int(v.get("iters", 3))):
                in_among = np.isin(labels, among)
                is_t = labels == t_lab
                ea, eb = ctx.topo.edges[:, 0], ctx.topo.edges[:, 1]
                deg = np.zeros(n_w)
                cnt = np.zeros(n_w)
                both = in_among[ea] & in_among[eb]
                np.add.at(deg, ea[both], 1)
                np.add.at(deg, eb[both], 1)
                np.add.at(cnt, ea[both], is_t[eb[both]])
                np.add.at(cnt, eb[both], is_t[ea[both]])
                ok = in_among & (deg >= int(v.get("min_nbrs", 3)))
                frac = cnt / np.maximum(deg, 1)
                grow = ok & (labels == a_lab) & (frac > float(v["grow_frac"])) & grow_where
                shrink = ok & is_t & (frac < float(v["shrink_frac"]))
                labels[grow] = t_lab
                labels[shrink] = a_lab
        else:
            raise RuleError(f"classes step {i}: unknown step {sorted(st)} (expected islands, set or vote)")
    return labels


# --------------------------------------------------------------------------------------------------------------------------
# side gate planes
# --------------------------------------------------------------------------------------------------------------------------


def skeleton_planes(bones: sc.BoneSet) -> dict:
    """Side planes measured on the skeleton (module docstring): {"torso": x (m), "chains": {"L_root|R_root": x | None}, "root_of":
    {sided bone: chain key}}; a chain without a mirror maps to None (it uses the torso plane)."""
    allb = bones.all_bones
    core = [b for b in allb.values() if bones.side_of(b["name"]) is None and b.get("kind") == "core"]
    used = [b for b in core if b.get("deform")] or core
    xs = [float(p[0]) for b in used for p in (b["head"], b["tail"])]
    torso = float(np.median(xs)) if xs else 0.0

    def chain_root(name):
        side, cur, seen = bones.side_of(name), name, {name}
        while True:
            p = allb[cur]["parent"]
            if p is None or p not in allb or p in seen or bones.side_of(p) != side:
                return cur
            seen.add(p)
            cur = p

    chains, root_of = {}, {}
    for name in allb:
        if bones.side_of(name) not in ("L", "R"):
            continue
        r = chain_root(name)
        mr = sc.mirror_name(r)
        if mr is not None and mr in allb:
            key = "|".join(sorted((r, mr)))
            chains[key] = 0.5 * (float(allb[r]["head"][0]) + float(allb[mr]["head"][0]))
        else:
            key = r
            chains[key] = None
        root_of[name] = key
    return {"torso": torso, "chains": chains, "root_of": root_of}


def side_band(rules: Mapping | None, skin_block: Mapping | None, H: float) -> float:
    """Half width (m) of the midline band: ``side_gate.band_H`` (rules) or ``side_gate_band_H`` (skin block), default 0.01, x H."""
    sg = dict((rules or {}).get("side_gate", {}))
    return float(sg.get("band_H", (skin_block or {}).get("side_gate_band_H", 0.01))) * float(H)


def side_planes(rules: Mapping | None, bones: sc.BoneSet, band: float) -> tuple[float, dict, dict]:
    """(torso plane x0, {sided bone: plane x}, report) for ``rules["side_gate"]`` over the skeleton's planes (metres, Blender X).
    Rules override: ``x0`` = the torso plane, ``planes`` = [{"x0", "bones"}] for the listed bones (``{S}`` expanded). A rules plane
    more than ``band / 2`` away from the skeleton's plane of the same bones is reported in ``warnings`` (and warned)."""
    sk = skeleton_planes(bones)
    sg = dict((rules or {}).get("side_gate", {}))
    warn = []
    x0 = float(sg["x0"]) if "x0" in sg else sk["torso"]
    if "x0" in sg and abs(x0 - sk["torso"]) > 0.5 * band:
        warn.append(f"side_gate.x0 = {x0:.4f} m is {abs(x0 - sk['torso']) * 1000:.1f} mm off the skeleton's torso plane "
                    f"{sk['torso']:.4f} m (> half the band, {band * 500:.1f} mm)")
    by = {nm: (sk["chains"][key] if sk["chains"][key] is not None else x0) for nm, key in sk["root_of"].items()}
    explicit = {}
    for pl in sg.get("planes", []):
        for nm in sc.expand_names(pl["bones"]):
            explicit[nm] = float(pl["x0"])
            if nm in by and abs(explicit[nm] - by[nm]) > 0.5 * band:
                warn.append(f"side_gate plane {explicit[nm]:.4f} m for {nm} is {abs(explicit[nm] - by[nm]) * 1000:.1f} mm off the "
                            f"skeleton's plane {by[nm]:.4f} m (> half the band, {band * 500:.1f} mm)")
    by.update(explicit)
    for w in warn:
        warnings.warn(w, stacklevel=2)
    rep = {"torso": x0, "torso_source": "rules" if "x0" in sg else "skeleton", "skeleton_torso": sk["torso"],
           "chains": {k: (v if v is not None else x0) for k, v in sk["chains"].items()},
           "chains_without_mirror": sorted(k for k, v in sk["chains"].items() if v is None), "explicit": explicit,
           "by_column": {nm: by[nm] for nm in bones.names if nm in by}, "band_m": band, "warnings": warn}
    return x0, by, rep


def side_gate_allowed(P, bones: sc.BoneSet, band: float, x0: float = 0.0, x0_by_bone: Mapping | None = None):
    """(n,k) bool: a sided bone (L = +X) is forbidden on vertices beyond ``band`` metres on the opposite side of its plane
    ``x = x0_by_bone.get(bone, x0)``; unsided bones are allowed everywhere. Returns (allowed, plane per column)."""
    P = np.asarray(P, dtype=np.float64)
    x0_by_bone = dict(x0_by_bone or {})
    plane = np.array([float(x0_by_bone.get(n, x0)) for n in bones.names])
    allowed = np.ones((P.shape[0], bones.k), dtype=bool)
    for j, s in enumerate(bones.side):
        if s in sc.SIDE_SIGN:
            allowed[:, j] = sc.SIDE_SIGN[s] * (P[:, 0] - plane[j]) >= -band
    return allowed, plane


# --------------------------------------------------------------------------------------------------------------------------
# constraints
# --------------------------------------------------------------------------------------------------------------------------


def build_constraints(topo: sc.WeldTopo, bones: sc.BoneSet, rules: Mapping | None = None, labels=None, colors=None,
                      skin_block: Mapping | None = None, caps=None) -> sc.Constraints:
    """Constraints from ``skin_rules`` (side_gate, regions, rigid, enforce, profiles) and the skeleton's ``skin`` block.

    rules["side_gate"] = {"x0": <torso plane>, "band_H": 0.01, "planes": [{"x0": 0.0105, "bones": ["{S}_Thigh", ...]}]}
                         (default planes from the skeleton: ``side_planes``);
    rules["regions"]   = {name: {"where": <expr> | "vertex_ids": [welded ids], "allowed": [bones], "fold": {bone|*: bone}}}
                         (without "allowed" the list comes from the skin block's ``region_bones[name]``, families/README.md);
    rules["rigid"]     = {name: {"where": <expr> | "vertex_ids": [...], "bone": name}};
    rules["enforce"]   = {"prune": 0.01, "max_influences": 4};
    rules["profiles"]  -> the influence-cap rule (``skin_profiles.cap_rule``) when profiles and caps are on.
    Bones in the lists may use ``{S}``; names that are not weight columns are dropped (so one rules file serves several
    skeletons). ``caps`` (n_w,) optional hard per-row influence caps (default: max_influences everywhere)."""
    rules = dict(rules or {})
    skin_block = dict(skin_block or {})
    enf = dict(rules.get("enforce", {}))
    prune = float(enf.get("prune", skin_block.get("prune_below", 0.01)))
    kmax = int(enf.get("max_influences", skin_block.get("max_influences", 4)))
    band = side_band(rules, skin_block, bones.H)
    x0, x0_by, planes_rep = side_planes(rules, bones, band)
    allowed, plane = side_gate_allowed(topo.P, bones, band, x0, x0_by)
    side_allowed = allowed.copy()
    ctx = RuleContext(topo, bones, colors=colors, labels=labels, x0=x0, x0_by_bone=x0_by)

    def region_mask(spec, what):
        if "vertex_ids" in spec:
            m = np.zeros(topo.n_w, bool)
            m[np.asarray(spec["vertex_ids"], dtype=np.int64)] = True
            return m
        if "where" in spec:
            return ctx.mask(spec["where"])
        raise RuleError(f"{what}: needs 'where' or 'vertex_ids'")

    regions: list[sc.Region] = []
    region_of = np.full(topo.n_w, -1, dtype=np.int64)
    for name, spec in (rules.get("regions") or {}).items():
        m = region_mask(spec, f"region {name!r}")
        listed = spec.get("allowed", (skin_block.get("region_bones") or {}).get(name))
        if listed is None:
            raise RuleError(f"region {name!r}: no 'allowed' list and no skin.region_bones[{name!r}] in the skeleton")
        al = sc.expand_names(listed, bones.names)
        if not al:
            raise RuleError(f"region {name!r}: none of its allowed bones {listed} is a weight column")
        fmap = {}
        for k_, v_ in (spec.get("fold") or {}).items():
            tgt = v_ if v_ in bones.names else None
            if tgt is None:
                continue
            for kk in (sc.expand_names([k_]) if k_ != "*" else ["*"]):
                fmap[kk] = tgt
        cols = np.zeros(bones.k, bool)
        cols[[bones.col(b) for b in al]] = True
        allowed[m] &= cols
        region_of[m & (region_of < 0)] = len(regions)
        regions.append(sc.Region(name, m, al, fmap))
    rigid_col = np.full(topo.n_w, -1, dtype=np.int64)
    for name, spec in (rules.get("rigid") or {}).items():
        m = region_mask(spec, f"rigid {name!r}")
        b = spec["bone"]
        if b not in bones.names:
            raise RuleError(f"rigid {name!r}: bone {b!r} is not a weight column")
        rigid_col[m] = bones.col(b)
    r = rigid_col >= 0
    allowed[r] = False
    allowed[np.flatnonzero(r), rigid_col[r]] = True
    if caps is None:
        caps = np.full(topo.n_w, kmax, dtype=np.int64)
    caps = np.minimum(np.asarray(caps, dtype=np.int64), kmax)
    pcfg = sp.profile_config(rules.get("profiles"))
    rule = sp.cap_rule(bones, skin_block, pcfg, kmax) if (pcfg["enabled"] and pcfg["caps"]) else None
    groups = sp.limb_groups(bones, topo, pcfg) if pcfg["enabled"] else None
    cons = sc.Constraints(bones=bones, allowed=allowed, region_of=region_of, regions=regions, rigid_col=rigid_col, caps=caps,
                          prune=prune, max_influences=kmax, side_plane=plane, side_band=band, side_allowed=side_allowed,
                          cap_rule=rule, groups=groups, notes={"side_planes": planes_rep})
    return sc.attach_positions(cons, topo)


# --------------------------------------------------------------------------------------------------------------------------
# common start / end of every candidate
# --------------------------------------------------------------------------------------------------------------------------


@dataclass
class Setup:
    """Common start of every candidate (``prepare``)."""

    topo: sc.WeldTopo
    bones: sc.BoneSet
    colors: np.ndarray | None
    ctx: RuleContext
    labels: np.ndarray
    cons: sc.Constraints


def prepare(mesh: Mapping, skel: Mapping, rules: Mapping | None = None, columns: Sequence[str] | None = None) -> Setup:
    """Welded topology, weight columns, welded base colours (mesh.npz extra ``col``, mean of duplicates), rule context with the
    side-gate planes, class labels (``rules["classes"]``) and the constraints of ``rules`` + the skeleton's skin block."""
    rules = dict(rules or {})
    topo = sc.weld_topo(mesh)
    bones = sc.BoneSet.from_skeleton(skel, columns)
    extra = mesh.get("extra")
    col = extra.get("col") if isinstance(extra, Mapping) else None
    colors = topo.gather(np.asarray(col, dtype=np.float64)) if col is not None else None
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")  # build_constraints warns once
        x0, planes, _ = side_planes(rules, bones, side_band(rules, skel.get("skin"), bones.H))
    ctx = RuleContext(topo, bones, colors=colors, x0=x0, x0_by_bone=planes)
    labels = classify(ctx, rules.get("classes", []))
    ctx.labels = labels
    cons = build_constraints(topo, bones, rules, labels=labels, colors=colors, skin_block=skel.get("skin"))
    return Setup(topo, bones, colors, ctx, labels, cons)


FINISH_ROUNDS = 4
FINISH_TOL = 1e-12


def finish(W, setup: Setup, skel: Mapping, rules: Mapping | None = None, rows=None):
    """Common end of every candidate: joint profiles (``rules["profiles"]``) then ``enforce`` (side gate, regions, rigid, top-k,
    prune, the cap rule), repeated until a pass changes nothing (at most ``FINISH_ROUNDS``; the report gives the rounds and the
    last change, and a ``UserWarning`` names a run that did not converge), so that finish(finish(W)) == finish(W). One or two
    passes are usually enough (FL, D01); more are needed where enforce dropped a whole crease side among many influences and the
    profiles re-create part of it (random weights). The result is a fixed point of enforce after the profiles, not of the profiles
    alone: the final weights match the profile formulas except entries that enforce removed (top-k, prune < ``prune``, caps that
    each remove < ``cap_extra_tol`` of a row per step) and whose weight it moved to their unit, crease partner or the rest of the
    row (``skin_profiles.twist_bins`` reports the twist deviation, max_dev). With ``rows`` (bool (n_w,)) the profiles only replace
    those rows (the selector's blend band). Returns (W, {"profiles", "enforce", "rounds", "side_planes", "limb_leak"}) with
    ``limb_leak`` = ``limb_leak_report`` of the result (measurement only)."""
    rules = dict(rules or {})
    sel = None if rows is None else np.asarray(rows, bool)
    cur = np.asarray(W, dtype=np.float64)
    last = None
    change = None
    per_round = []
    for rnd in range(1, FINISH_ROUNDS + 1):
        Wp, pinfo = sp.apply_profiles(cur, setup.topo, setup.bones, skel.get("skin"), rules.get("profiles"))
        if sel is not None:
            Wp = np.where(sel[:, None], Wp, cur)
            pinfo["rows_replaced"] = int(sel.sum())
        new, rep = sc.enforce(Wp, setup.cons)
        if last is not None:
            change = float(np.abs(new - cur).max()) if new.size else 0.0
        per_round.append({"round": rnd, "change": change, "pruned": rep["pruned"], "topk_removed_max": rep["topk_removed_max"],
                          "folded_weight_sum": rep["folded_weight_sum"],
                          "caps": {k: v for k, v in rep.get("caps", {}).items() if k != "rule"} or None})
        last = (new, pinfo, rep)
        if change is not None and change <= FINISH_TOL:
            break
        cur = new
    new, pinfo, rep = last
    converged = bool(change is not None and change <= FINISH_TOL)
    if not converged:
        warnings.warn(f"skin finish: not converged after {rnd} rounds (last change {change if change is not None else 'n/a'}; "
                      f"FINISH_TOL {FINISH_TOL:g}): the weights are valid (enforce ran last) but one more finish may change them",
                      stacklevel=2)
    rounds = {"rounds": rnd, "last_change": change, "converged": converged, "per_round": per_round}
    return new, {"profiles": pinfo, "enforce": rep, "rounds": rounds, "side_planes": setup.cons.notes.get("side_planes"),
                 "limb_leak": limb_leak_report(new, setup)}


def limb_leak_report(W, setup: Setup, regions=None) -> dict:
    """``skin_common.limb_leak`` of welded weights ``W`` on ``setup``'s welded positions and rest bone segments, with the numbers
    of thresholds.json row ``weights_limb_leak`` (``skin_common.leak_config``), plus ``band`` and ``over_band`` (rows > band).
    Every candidate's ``finish`` report carries it (skinning.md "Candidate B limb envelope": report limb_leak for every
    candidate). ``regions`` {name: bool (n_w,)} adds rows per region."""
    cfg = sc.leak_config()
    b = setup.bones
    out = sc.limb_leak(setup.topo.P, W, b.names, b.head, b.tail, {n: x["parent"] for n, x in b.all_bones.items()},
                       regions=regions, **cfg["params"])
    out.update(band=cfg["band"], over_band=bool(out["rows"] > cfg["band"]))
    return out


def load_rules(path) -> dict:
    """Read a skin_rules.json (plain JSON; schema in the module docstring)."""
    with open(path, "rb") as f:
        doc = json.loads(f.read().decode("utf-8"))
    if not isinstance(doc, dict):
        raise RuleError(f"{path}: expected a JSON object")
    return doc
