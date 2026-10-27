"""solvers.skin_region - skin candidate A "region + distance" (owner B, P3), generalized from D01 ``rig/tools/d01_skin.py``.

Per welded vertex: weight per bone = (distance to the bone segment minus the bone's radius, floored) ** -p inside "gates"
(per-bone rule expressions + the side gate), Laplacian smoothing on the welded topology, then data-driven special steps (limb
ramps along the limb coordinate, segment ramps such as ears, rigid islands, cloth regions blended from their neighbours, skin
transition bands, axis ramps such as flaps), joint profiles, and ``enforce``. Everything asset-specific comes from
``skin_rules.json`` (schema: ``skin_rules.py``); without rules the defaults give a plain gated inverse-distance skin.

**Limb envelope** (``skin_profiles.apply_limb_envelope``, the one candidate B uses; references/skinning.md "Candidate B limb
envelope"): plain inverse distance gives the upper arm and the thigh weight far onto the torso (I3 pipeline runs: 1269 leaking
welded rows on D01, 428 on FL; the selector's leak gate then dropped A in 9 regions). Two stages, as in B: the raw weights of
every ``distance`` step are multiplied by the envelope factors before their rows are normalized, and the rows are enveloped again
after the last step (the smoothing passes re-spread 30 / 56 rows on D01 / FL after the first stage alone). The factor is C1 in
position: no weight step, and it is never a gate in ``enforce``. ``candidate_a.envelope``: a spec like
``skin_profiles.LIMB_ENVELOPE`` turns it on, ``{}`` or ``null`` off; default ON on the generic path (no ``candidate_a.steps``) and
OFF with asset-specific steps (they bring their own limb treatment; D01's legacy rules must keep reproducing G2).

Enforcement during smoothing (skinning.md §3 "Enforce", amended after review r1): every smoothing pass is preceded and followed
by a **fold** (side gate, region lists, rigid islands): one fold before the first pass, one after every pass, each checked by
``skin_common.checked_fold``, which raises ``InvariantError`` (not ``assert``) if forbidden weight survives. Full enforcement
(top-4, prune, normalize, influence caps) runs at the end (``skin_rules.finish``), not after every pass: with it after every pass
D01 moved away from G2 (mean L1 0.025, agreement 99.7 %) without a safety gain. ``"per_pass": "enforce"`` keeps that variant for
experiments. This is a deviation from the r1 text "enforce after every pass", recorded in the skill's skinning.md.

``candidate_a`` block of ``skin_rules.json`` (every key optional; bone lists may use ``{S}``):

    "candidate_a": {
        "p": 3.0, "floor_m": 0.006 H, "radius_m": {bone or base name: r},
        "envelope": {"UpperArm": {"dist": [0.5, 0.75]}, ...} | {} | null,  (default: skin_profiles.LIMB_ENVELOPE without "steps")
        "gates": {bone or base name: <expr>},                            (sided bones: ``s``, ``sx`` = s (x - plane))
        "steps": [ {"op": "distance", "classes": [...] | "where": <expr>, "bones": [...]},
                   {"op": "smooth", "classes": [...], "iters": 16, "lambda": 0.5, "compatible": [[a, b]],
                    "cut": {"where": <expr>, "split_x": 0.0105}, "per_pass": "fold" | "enforce"},
                   {"op": "limb_ramp", "where": <expr with sx>, "plane_bone": "{S}_UpperArm", "axis": "x" | "chain",
                    "chain": [b0, b1, b2], "joints": [{"bone": b1, "width_m": w}, ...], "blend_in": {"from_m": f, "width_m": w}},
                   {"op": "segment_ramp", "where": <expr>, "plane_bone": ..., "bone": "{S}_ear", "base": "head",
                    "t0": 0.05, "width": 0.45},
                   {"op": "rigid", "classes": [...], "bone": name},
                   {"op": "region_blend", "class": "sack", "sources": [...], "bone": "sack", "hops": 8,
                    "source_bones": [...], "empty_source_bone": "chest", "region": "sack_cloth",
                    "smooth": {"iters": 6, "lambda": 0.5, "nbr_classes": [...]}},
                   {"op": "skin_band", "around": "sack", "rings": 3, "classes": [...],
                    "moves": [{"to": "chest", "from": [...]}, ...]},
                   {"op": "axis_ramp", "classes": [...], "coord": "z", "v0": 0.205, "v1": 0.170, "bone0": .., "bone1": ..} ]}

Default steps (no ``candidate_a.steps``): one ``distance`` step over every vertex and every deform bone, then 16 smoothing passes,
with the limb envelope on.

CLI::

    python -I solvers/skin_region.py --mesh mesh.npz --skeleton skeleton.json [--rules skin_rules.json] --out weights.npz

Units: metres. Frame: Blender, Z up, front -Y, left +X.
"""
from __future__ import annotations

import argparse
import os
import sys
import time

if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np

from rigcore import npzio, template

from solvers import skin_common as sc
from solvers import skin_profiles as sp
from solvers import skin_rules

CANDIDATE = "A_region"
DEFAULT_SMOOTH = {"iters": 16, "lambda": 0.5}


def _lookup(table: dict, name: str, default=None):
    if name in table:
        return table[name]
    b = sc.base_name(name)
    return table.get(b, default)


class RegionSkin:
    """Candidate A on one mesh + skeleton + rules. ``run()`` returns welded weights (n_w,k) after enforce."""

    def __init__(self, mesh, skel, rules=None, columns=None):
        self.mesh = mesh
        self.skel = skel
        self.rules = dict(rules or {})
        self.setup = skin_rules.prepare(mesh, skel, self.rules, columns)
        self.topo, self.bones, self.ctx = self.setup.topo, self.setup.bones, self.setup.ctx
        self.labels, self.cons = self.setup.labels, self.setup.cons
        A = dict(self.rules.get("candidate_a", {}))
        H = self.bones.H
        self.p = float(A.get("p", 3.0))
        self.floor = float(A.get("floor_m", 0.006 * H))
        self.radius = dict(A.get("radius_m", {}))
        self.gates = dict(A.get("gates", {}))
        self.steps = list(A.get("steps") or [{"op": "distance", "where": "True", "bones": list(self.bones.names)},
                                             {"op": "smooth", "where": "True", **DEFAULT_SMOOTH}])
        # limb envelope (module docstring): default on the generic path only; {} or null switches it off
        self.envelope = A["envelope"] if "envelope" in A else (None if A.get("steps") else sp.LIMB_ENVELOPE)
        if self.envelope is not None and not isinstance(self.envelope, dict):
            raise sc.RuleError(f"candidate_a.envelope must be an object like skin_profiles.LIMB_ENVELOPE, {{}} or null, "
                               f"got {self.envelope!r}")
        if self.envelope:
            sp.limb_envelope(np.zeros((0, 3)), self.bones, self.envelope)  # unknown keys raise here, before any step runs
        self.log: list = []
        self._E = {}

    # ---------------------------------------------------------------- helpers
    def rows(self, st) -> np.ndarray:
        if "classes" in st:
            m = np.isin(self.labels, list(st["classes"]))
            if "where" in st:
                m &= self.ctx.mask(st["where"])
            return m
        return self.ctx.mask(st.get("where", "True"))

    def cols(self, names) -> list:
        return [self.bones.col(n) for n in sc.expand_names(names, self.bones.names)]

    def energy(self, j: int):
        """(raw, gated) energies of column j: max(d - r, floor), gated = inf outside the bone's gate and the side gate."""
        if j in self._E:
            return self._E[j]
        nm = self.bones.names[j]
        d, _ = sc.seg_dist(self.topo.P, self.bones.head[j], self.bones.tail[j])
        e = np.maximum(d - float(_lookup(self.radius, nm, 0.0)), self.floor)
        side = self.bones.side[j]
        g = _lookup(self.gates, nm, "True")
        gate = self.ctx.mask(g, side=side, plane_bone=nm) & self.cons.allowed[:, j]
        self._E[j] = (e, np.where(gate, e, np.inf))
        return self._E[j]

    def refold(self, W, what):
        """Fold forbidden weights (region lists, side gate, rigid) back before / after a smoothing pass; raises
        ``InvariantError`` if any survives."""
        return sc.checked_fold(W, self.cons, what)

    # ---------------------------------------------------------------- steps
    def op_distance(self, W, st):
        m = self.rows(st)
        cols = self.cols(st["bones"])
        if not m.any() or not cols:
            return W, {"rows": int(m.sum())}
        Eg = np.stack([self.energy(j)[1][m] for j in cols], axis=1)
        w = np.where(np.isfinite(Eg), Eg ** -self.p, 0.0)
        s = w.sum(1)
        bad = s == 0
        if bad.any():  # no gated bone: raw distance to the step's bones (D01 FALLBACK), still within the hard constraints
            Er = np.stack([self.energy(j)[0][m][bad] for j in cols], axis=1)
            ok = self.cons.allowed[np.flatnonzero(m)[bad]][:, cols]
            wr = np.where(ok, Er ** -self.p, 0.0)
            wr[wr.sum(1) == 0] = (Er ** -self.p)[wr.sum(1) == 0]
            w[bad] = wr
            s = w.sum(1)
        info = {"rows": int(m.sum()), "fallback_rows": int(bad.sum())}
        out = np.zeros((int(m.sum()), self.bones.k))
        if self.envelope:  # stage 1 of the limb envelope on the raw weights, then normalized (module docstring)
            out[:, cols] = w
            out, env = sp.apply_limb_envelope(out, self.topo.P[m], self.bones, self.envelope)
            info["envelope"] = {k: env[k] for k in ("rows_changed", "moved_max", "moved_mean", "rows_fallback")}
        else:
            out[:, cols] = w / s[:, None]
        W[m] = out
        return W, info

    def op_smooth(self, W, st):
        m = self.rows(st)
        E = self.topo.edges
        ea, eb = E[:, 0], E[:, 1]
        ok = m[ea] & m[eb]
        if st.get("same_class", True):
            same = self.labels[ea] == self.labels[eb]
            for a, b in st.get("compatible", []):
                same |= ((self.labels[ea] == a) & (self.labels[eb] == b)) | ((self.labels[ea] == b) & (self.labels[eb] == a))
            ok &= same
        cut = st.get("cut")
        if cut:
            band = self.ctx.mask(cut.get("where", "True"))
            xs = np.where(self.topo.P[:, 0] > float(cut["split_x"]), 1, -1)
            ok &= ~(band[ea] & band[eb] & (xs[ea] != xs[eb]))
        edges = E[ok]
        lam = float(st.get("lambda", DEFAULT_SMOOTH["lambda"]))
        n_it = int(st.get("iters", DEFAULT_SMOOTH["iters"]))
        per_pass = st.get("per_pass", "fold")
        if per_pass not in ("fold", "enforce"):
            raise sc.RuleError(f"smooth: per_pass must be 'fold' or 'enforce', got {per_pass!r}")
        W = self.refold(W, "smooth: before the first pass")
        for it in range(n_it):
            W = sc.smooth_pass(W, edges, m, lam)
            W = self.refold(W, f"smooth pass {it}")
            if per_pass == "enforce":  # also top-k / prune / renormalize the smoothed rows after every pass
                W[m] = self._enforce_rows(W, m)
        return W, {"rows": int(m.sum()), "edges": int(ok.sum()), "iters": n_it, "per_pass": per_pass}

    def _enforce_rows(self, W, m):
        rows = np.flatnonzero(m)
        groups = self.cons.groups.subset(rows) if self.cons.groups is not None else None
        sub = self.cons.copy_with(allowed=self.cons.allowed[rows], region_of=self.cons.region_of[rows],
                                  rigid_col=self.cons.rigid_col[rows], caps=self.cons.caps[rows], groups=groups,
                                  locked=None, locked_val=None, side_allowed=None, notes={"_P": self.topo.P[rows]})
        return sc.enforce(W[rows], sub, check=True)[0]

    def _coord(self, st, side):
        """Limb coordinate (m) on the side: axis 'x' -> s (x - plane); 'chain' -> projection on the chain direction from b0's head."""
        plane_bone = sc.sub_side(st.get("plane_bone", st["chain"][0]), side)
        if st.get("axis", "x") == "x":
            x0 = self.ctx.plane(plane_bone)
            s = sc.SIDE_SIGN[side]
            return lambda pts: s * (np.asarray(pts)[..., 0] - x0)
        ch = [sc.sub_side(b, side) for b in st["chain"]]
        b0, bl = self.bones.col(ch[0]), self.bones.col(ch[-1])
        o = self.bones.head[b0]
        d = sc._unit(self.bones.tail[bl] - o)
        return lambda pts: (np.asarray(pts) - o) @ d

    def op_limb_ramp(self, W, st):
        info = {}
        for side in st.get("sides", ["L", "R"]):
            plane_bone = sc.sub_side(st.get("plane_bone", st["chain"][0]), side)
            m = self.ctx.mask(st["where"], side=side, plane_bone=plane_bone)
            if not m.any():
                continue
            coord = self._coord(st, side)
            c = coord(self.topo.P[m])
            chain = [self.bones.col(sc.sub_side(b, side)) for b in st["chain"]]
            ts = []
            for jt in st["joints"]:
                jc = float(coord(self.bones.head[self.bones.col(sc.sub_side(jt["bone"], side))]))
                w = float(jt["width_m"])
                ts.append(sc.smoothstep((c - (jc - 0.5 * w)) / w))
            Wa = np.zeros((int(m.sum()), self.bones.k))
            for i, j in enumerate(chain):
                v = np.ones(len(c)) if i == 0 else ts[i - 1].copy()
                for t in ts[i:]:
                    v = v * (1.0 - t)
                Wa[:, j] = v
            bi = st.get("blend_in")
            bl = sc.smoothstep((c - float(bi["from_m"])) / float(bi["width_m"]))[:, None] if bi else 1.0
            W[m] = (1.0 - bl) * W[m] + bl * Wa
            info[side] = int(m.sum())
        return W, info

    def op_segment_ramp(self, W, st):
        info = {}
        for side in st.get("sides", ["L", "R"]):
            bname = sc.sub_side(st["bone"], side)
            if bname not in self.bones.names:
                continue
            plane_bone = sc.sub_side(st.get("plane_bone", st["bone"]), side)
            m = self.rows({k: v for k, v in st.items() if k == "classes"})
            m &= self.ctx.mask(st.get("where", "True"), side=side, plane_bone=plane_bone)
            if not m.any():
                continue
            j = self.bones.col(bname)
            _, t = sc.seg_dist(self.topo.P[m], self.bones.head[j], self.bones.tail[j])
            we = sc.smoothstep((t - float(st.get("t0", 0.0))) / float(st.get("width", 1.0)))
            Wm = np.zeros((int(m.sum()), self.bones.k))
            Wm[:, self.bones.col(sc.sub_side(st["base"], side))] = 1.0 - we
            Wm[:, j] += we
            W[m] = Wm
            info[side] = int(m.sum())
        return W, info

    def op_rigid(self, W, st):
        m = self.rows(st)
        W[m] = 0.0
        W[m, self.bones.col(st["bone"])] = 1.0
        return W, {"rows": int(m.sum())}

    def op_region_blend(self, W, st):
        """Cloth region taking its weights from neighbouring skin: multi-source BFS (``hops``) from the ``sources`` classes into
        the region; alpha = clip(1 - hop / hops, 0, 1); the region vertex becomes (1 - alpha) onehot(bone) + alpha x (the reached
        source's weights restricted to ``source_bones``, renormalized, folded by the region's fold map); then smoothing passes
        over neighbours of ``smooth.nbr_classes`` that only update region vertices, folding after every pass (D01 B1 fix)."""
        tgt = self.labels == st["class"]
        srcm = ~tgt & np.isin(self.labels, list(st["sources"]))
        hops = int(st.get("hops", 8))
        hop, near = sc.bfs_nearest_source(self.topo, srcm, tgt, hops)
        alpha = np.where(tgt, np.clip(1.0 - hop / float(hops), 0.0, 1.0), 0.0)
        cols = self.cols(st["source_bones"])
        T = np.zeros_like(W)
        T[:, cols] = W[:, cols]
        ts = T.sum(1)
        T = np.where(ts[:, None] > 1e-9, T / np.maximum(ts, 1e-9)[:, None], 0.0)
        T[ts <= 1e-9, self.bones.col(st.get("empty_source_bone", st["source_bones"][0]))] = 1.0
        T = sc.fold(T, self._region_cons(st["region"]))
        jb = self.bones.col(st["bone"])
        rows = np.flatnonzero(tgt)
        one = np.zeros((rows.size, self.bones.k))
        one[:, jb] = 1.0
        has = near[rows] >= 0
        new = one.copy()
        a = alpha[rows][:, None]
        new[has] = (1.0 - a[has]) * one[has] + a[has] * T[near[rows][has]]
        W[rows] = new
        sm = st.get("smooth")
        if sm:
            E = self.topo.edges
            nbr_ok = np.isin(self.labels, list(sm["nbr_classes"]))
            ea, eb = E[:, 0], E[:, 1]
            keep = (tgt[ea] & nbr_ok[eb]) | (tgt[eb] & nbr_ok[ea])
            edges = E[keep]
            reg_rows = self._region_cons(st["region"], rows=tgt)
            W = self.refold(sc.fold(W, reg_rows), "region_blend smooth: before the first pass")
            for it in range(int(sm.get("iters", 6))):
                W = sc.smooth_pass(W, edges, tgt, float(sm.get("lambda", 0.5)))
                W = sc.fold(W, reg_rows)  # neighbours are skin that may carry head/neck: fold them out again (D01 B1)
                W = self.refold(W, f"region_blend smooth pass {it}")
        return W, {"rows": int(rows.size), "reached": int(has.sum())}

    def _region_cons(self, name, rows=None):
        """Constraints carrying only one region's allowed list and fold map, on ``rows`` (bool (n_w,); default every row)."""
        reg = next((r for r in self.cons.regions if r.name == name), None)
        if reg is None:
            raise sc.RuleError(f"region_blend: region {name!r} is not defined in rules['regions']")
        n_w, k = self.topo.n_w, self.bones.k
        rows = np.ones(n_w, bool) if rows is None else np.asarray(rows, bool)
        allowed = np.ones((n_w, k), bool)
        cols = np.zeros(k, bool)
        cols[[self.bones.col(b) for b in reg.allowed]] = True
        allowed[rows] = cols
        return sc.Constraints(bones=self.bones, allowed=allowed, region_of=np.where(rows, 0, -1), regions=[reg],
                              rigid_col=np.full(n_w, -1), caps=np.full(n_w, k), prune=0.0, max_influences=k)

    def op_skin_band(self, W, st):
        """Transition band on the skin side of a region border (D01 fix #2): skin vertices 1..rings hops from the region keep a
        fraction fac = smoothstep(hop / (rings + 1)) (0.16 / 0.5 / 0.84 for 3 rings) of their weight on each ``from`` list; the
        rest moves to the list's ``to`` bone."""
        around = self.labels == st["around"]
        skin = np.isin(self.labels, list(st["classes"]))
        rings = int(st.get("rings", 3))
        hop = sc.bfs_hops(self.topo, around, skin, rings)
        rows = np.flatnonzero((hop >= 1) & (hop <= rings))
        fac = sc.smoothstep(hop[rows] / (rings + 1.0))
        moved = {}
        for mv in st["moves"]:
            cols = self.cols(mv["from"])
            if not cols:
                continue
            mvw = W[np.ix_(rows, cols)].sum(1) * (1.0 - fac)
            W[np.ix_(rows, cols)] *= fac[:, None]
            W[rows, self.bones.col(mv["to"])] += mvw
            moved[mv["to"]] = float(mvw.sum())
        return W, {"rows": int(rows.size), "moved": moved, "fac": sorted({round(float(f), 4) for f in fac})}

    def op_axis_ramp(self, W, st):
        m = self.rows(st)
        c = self.topo.P[m, "xyz".index(st.get("coord", "z"))]
        v0, v1 = float(st["v0"]), float(st["v1"])
        t = sc.smoothstep((c - v0) / (v1 - v0))
        Wm = np.zeros((int(m.sum()), self.bones.k))
        Wm[:, self.bones.col(st["bone0"])] = 1.0 - t
        Wm[:, self.bones.col(st["bone1"])] += t
        W[m] = Wm
        return W, {"rows": int(m.sum())}

    OPS = {"distance": op_distance, "smooth": op_smooth, "limb_ramp": op_limb_ramp, "segment_ramp": op_segment_ramp,
           "rigid": op_rigid, "region_blend": op_region_blend, "skin_band": op_skin_band, "axis_ramp": op_axis_ramp}

    # ---------------------------------------------------------------- run
    def run(self):
        W = np.zeros((self.topo.n_w, self.bones.k))
        for i, st in enumerate(self.steps):
            fn = self.OPS.get(st.get("op"))
            if fn is None:
                raise sc.RuleError(f"candidate_a step {i}: unknown op {st.get('op')!r} (known: {sorted(self.OPS)})")
            t0 = time.time()
            W, info = fn(self, W, st)
            self.log.append({"step": i, "op": st["op"], "s": round(time.time() - t0, 3), **info})
        env = None
        if self.envelope:  # stage 2 on the welded rows after the last step (module docstring)
            W, env = sp.apply_limb_envelope(W, self.topo.P, self.bones, self.envelope)
        W, fin = skin_rules.finish(W, self.setup, self.skel, self.rules)
        self.report = {"steps": self.log, "envelope": {"spec": self.envelope or None, "mesh": env}, **fin,
                       "labels": {k: int(v) for k, v in zip(*np.unique(self.labels, return_counts=True))}}
        return W


def run(mesh, skel, rules=None, columns=None):
    """Candidate A -> (welded W (n_w,k), RegionSkin with .report/.topo/.bones/.labels)."""
    rs = RegionSkin(mesh, skel, rules, columns)
    return rs.run(), rs


def main(argv=None):
    ap = argparse.ArgumentParser(description="skin candidate A (region + distance)")
    ap.add_argument("--mesh", required=True)
    ap.add_argument("--skeleton", required=True)
    ap.add_argument("--rules", default=None)
    ap.add_argument("--out", required=True)
    ap.add_argument("--report", default=None, help="JSON report path (default: <out>.json)")
    a = ap.parse_args(argv)
    mesh = npzio.load_mesh(a.mesh)
    skel = template.load_skeleton(a.skeleton)
    rules = skin_rules.load_rules(a.rules) if a.rules else {}
    t0 = time.time()
    Ww, rs = run(mesh, skel, rules)
    W = sc.to_full(Ww, rs.topo)
    npzio.save_weights(a.out, rs.bones.names, W, locked=rs.topo.scatter(rs.cons.rigid_col >= 0),
                       meta={"candidate": CANDIDATE, "params": {"rules": a.rules, "p": rs.p, "floor_m": rs.floor,
                                                                "envelope": rs.envelope or None}},
                       check_sums=True)
    rep = dict(rs.report, seconds=round(time.time() - t0, 2), out=a.out)
    npzio.write_json(a.report or (os.path.splitext(a.out)[0] + ".json"), rep)
    print(f"candidate A: {W.shape[0]} vertices, {len(rs.bones.names)} bones, {rep['seconds']} s -> {a.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
