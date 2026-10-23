r"""solvers.skin_unirig - skin candidate C "UniRig remapped" (owner B, P3). Runs in rigkit-env.

1. **Read** UniRig's skin. Primary input: writer A2's folder ``E:\tmp_rigkit\A2\unirig\<asset>\`` (``unirig_weights.npz`` = raw
   UniRig weights whose rows follow the mesh.npz named in ``correspondence.json``, ``bone_map.json`` =
   ``{unirig_name: standard_bone_or_null}``, ``unirig_joints.json`` = parents). The vertex order is checked against that mesh:
   the same vertices within ``pos_tol`` -> rows used as they are ("verified"); otherwise rows re-ordered by nearest vertex
   ("remapped"). Without ``correspondence.json``, or when the mesh it names is not on disk, the order cannot be checked and the
   reader raises ``ValueError`` unless ``assume_order`` (CLI ``--assume-vertex-order``) is given; the rows are then used in file
   order and the report says ``"order": "unverified"``. Fallback: ``--rigged-glb`` + ``--bone-map`` read with A2's
   ``unirig_bridge.read_rigged_glb`` (exact vertex order when every vertex matches within 1e-7 m, else nearest vertex).
2. **Remap** per vertex: each UniRig joint's weight goes to its standard bone; ``null`` joints fold into the nearest mapped
   UniRig ancestor; standard names that are not weight columns (e.g. ``L_Clavicle`` on D01's legacy rig) walk up the standard
   hierarchy (family H, plus the skeleton's own parents) to the first column (so fingers -> ``{S}_Hand``, clavicle -> ``chest``).
3. **Fill** standard bones that have no UniRig counterpart (aux bones such as ``helmet``, ``sack``, ears; twist bones only when the
   twist profile is off): inside the support of those bones in candidate B (B weight > ``fill_tau``, dilated by ``fill_rings``
   rings), rows where B's share of them is >= ``fill_core`` are pinned to B's row and the rest of the support is re-solved with B's
   inpaint step (``skin_transfer.inpaint``) against C's own rows outside. The default energy is "harmonic" (Dirichlet): the RSWT
   energy overshoots at these abrupt UniRig/B borders (D01: min -0.38 before clamping, negative mass 39), harmonic gives none at
   the same L1. Without a B file these bones stay 0 (reported).
4. Joint profiles (twist ramps give the twist bones their weights), then ``enforce`` with the asset's rules.

CLI::

    python -I solvers/skin_unirig.py --mesh mesh.npz --skeleton skeleton.json --unirig-dir E:\tmp_rigkit\A2\unirig\D01_hodling
        [--assume-vertex-order] [--fill-from weights_B.npz] [--rules skin_rules.json] --out weights.npz

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
from solvers import skin_rules
from solvers import skin_transfer as stf

CANDIDATE = "C_unirig"
DEFAULTS = {"fill_tau": 0.02, "fill_core": 0.5, "fill_rings": 3, "fill_energy": "harmonic"}


# --------------------------------------------------------------------------------------------------------------------------
# input
# --------------------------------------------------------------------------------------------------------------------------


def load_unirig_dir(unirig_dir, mesh, pos_tol: float = 1e-6, assume_order: bool = False) -> dict:
    """A2's outputs -> {"names", "parent" {name: parent name|None}, "bone_map", "W" (n,k_u) float64 in OUR vertex order, "info"}.
    The vertex order is checked through ``correspondence.json`` (module docstring step 1); ``info["order"]`` is "verified",
    "remapped" or, only with ``assume_order``, "unverified"."""
    W = npzio.load_weights(os.path.join(unirig_dir, "unirig_weights.npz"))
    bmap = npzio.read_json(os.path.join(unirig_dir, "bone_map.json"))
    names = W["bones"].tolist()
    parent = {n: None for n in names}
    jpath = os.path.join(unirig_dir, "unirig_joints.json")
    if os.path.isfile(jpath):
        for j in npzio.read_json(jpath)["joints"]:  # "parent" is the parent's name (or its index in the joint list)
            p_ = j.get("parent")
            parent[j["name"]] = names[p_] if isinstance(p_, int) and p_ >= 0 else (p_ if isinstance(p_, str) else None)
    info = {"source": os.path.abspath(unirig_dir), "bones": len(names), "hierarchy": os.path.isfile(jpath)}
    Wu = W["W"].astype(np.float64)
    V = np.asarray(mesh["V"], dtype=np.float64)
    cpath = os.path.join(unirig_dir, "correspondence.json")
    problem = None
    if not os.path.isfile(cpath):
        problem = f"{cpath} is missing"
    else:
        c = npzio.read_json(cpath)
        info["correspondence"] = {k: c.get(k) for k in ("exact", "method", "max_dist_m", "n_ours", "n_unirig", "mesh_npz")}
        other = c.get("mesh_npz")
        if not other:
            problem = f"{cpath} names no mesh_npz"
        elif not os.path.isfile(other):
            problem = f"the mesh its rows follow ({other}) is not on disk"
        else:
            Vo = np.asarray(npzio.load_mesh(other)["V"], dtype=np.float64)  # the mesh A2's rows follow
            if Vo.shape[0] != Wu.shape[0]:
                raise ValueError(f"{unirig_dir}: unirig_weights has {Wu.shape[0]} rows, the mesh it follows ({other}) has "
                                 f"{Vo.shape[0]} vertices")
            if Vo.shape == V.shape and float(np.abs(Vo - V).max()) <= pos_tol:
                info["order"] = "verified"
                info["rows"] = f"same vertex order as our mesh (max |dV| {float(np.abs(Vo - V).max()):.3g} m <= {pos_tol:g})"
            else:  # another vertex order (or count): take each of our vertices from A2's nearest vertex
                from scipy.spatial import cKDTree

                d, idx = cKDTree(Vo).query(V)
                Wu = Wu[idx]
                info["order"] = "remapped"
                info["rows"] = f"remapped by nearest vertex of {other} (max {float(d.max()):.3g} m)"
                info["remap_max_dist_m"] = float(d.max())
    if problem is not None:
        if not assume_order:
            raise ValueError(f"UniRig rows in {unirig_dir}: the vertex order cannot be checked ({problem}). Re-run A2's "
                             f"unirig_bridge to write correspondence.json, or pass assume_order=True (--assume-vertex-order) to "
                             f"use the rows in file order")
        info["order"] = "unverified"
        info["rows"] = f"UNVERIFIED: {problem}; rows used in file order (assume_order)"
    if Wu.shape[0] != V.shape[0]:
        raise ValueError(f"unirig_weights has {Wu.shape[0]} rows, mesh has {V.shape[0]} vertices")
    return {"names": names, "parent": parent, "bone_map": bmap, "W": Wu, "info": info}


def load_unirig_glb(rigged_glb, bone_map_path, mesh, pos_tol: float = 1e-6) -> dict:
    """Fallback reader: the rigged GLB itself (A2's ``unirig_bridge`` helpers), rows mapped to our vertices."""
    from solvers import unirig_bridge as ub

    u = ub.read_rigged_glb(rigged_glb)
    meta = mesh["meta"]
    Vu = ub.to_mesh_frame(u["V_gltf"], float(meta["scale_factor"]), float(meta.get("z_offset") or 0.0))
    corr = ub.correspondence(mesh["V"], Vu, tol=pos_tol)
    names = list(u["names"])
    parent = {n: (names[p] if p >= 0 else None) for n, p in zip(names, u["parent"])}
    return {"names": names, "parent": parent, "bone_map": npzio.read_json(bone_map_path),
            "W": u["W"][corr["ours_to_unirig"]].astype(np.float64),
            "info": {"source": os.path.abspath(rigged_glb), "bones": len(names), "hierarchy": True,
                     "order": "verified" if corr["exact"] else "remapped",
                     "correspondence": {"exact": corr["exact"], "method": corr["method"], "max_dist_m": corr["max_dist"]}}}


# --------------------------------------------------------------------------------------------------------------------------
# remap
# --------------------------------------------------------------------------------------------------------------------------


def standard_parents(skel=None, family: str = "H") -> dict:
    """{standard bone: parent} from the family template (sides expanded), updated with the skeleton's own bones."""
    fam = template.expand_sides(template.load_family(family))
    par = {b["name"]: b["parent"] for b in fam["bones"]}
    if skel is not None:
        par.update({b["name"]: b["parent"] for b in skel["bones"]})
    return par


def remap(W_u, u_names, u_parent: dict, bone_map: dict, columns, std_parent: dict):
    """UniRig columns -> our columns (see module docstring). Returns (W (n,k), report)."""
    W_u = np.asarray(W_u, dtype=np.float64)
    col = {n: i for i, n in enumerate(columns)}
    target = {}
    trace = {}
    for u in u_names:
        name, cur, hops = bone_map.get(u), u, 0
        while name is None and u_parent.get(cur) is not None and hops < 64:  # unmapped joint: nearest mapped ancestor
            cur = u_parent[cur]
            name = bone_map.get(cur)
            hops += 1
        std = name
        hops = 0
        while name is not None and name not in col and hops < 64:  # standard bone without a column: walk up the standard tree
            name = std_parent.get(name)
            hops += 1
        target[u] = col.get(name) if name is not None else None
        trace[u] = {"standard": std, "column": columns[target[u]] if target[u] is not None else None}
    W = np.zeros((W_u.shape[0], len(columns)))
    dropped = 0.0
    for j, u in enumerate(u_names):
        t = target[u]
        if t is None:
            dropped += float(W_u[:, j].sum())
            continue
        W[:, t] += W_u[:, j]
    matched = sorted({columns[t] for t in target.values() if t is not None})
    rep = {"columns_matched": matched, "columns_unmatched": [c for c in columns if c not in matched],
           "dropped_weight_sum": dropped, "trace": trace}
    return W, rep


def fill_unmatched(topo: sc.WeldTopo, W0, W_fill, cols, H: float, tau: float, core: float, rings: int,
                   energy: str = "harmonic"):
    """Fill columns ``cols`` (indices) of the welded weights ``W0`` from ``W_fill`` (same columns) inside their support in
    ``W_fill`` (see module docstring step 3). Returns (W, report)."""
    if not cols:
        return np.asarray(W0, dtype=np.float64), {"filled_columns": []}
    Wf = np.asarray(W_fill, dtype=np.float64)
    sup0 = (Wf[:, cols] > tau).any(1)
    hop = sc.bfs_hops(topo, sup0, np.ones(topo.n_w, bool), int(rings))
    U = hop <= int(rings)
    pin = sup0 & (Wf[:, cols].sum(1) >= core)
    known = ~U | pin
    W_init = np.where((~U)[:, None], W0, np.where(pin[:, None], Wf, 0.0))
    W, info = stf.inpaint(topo, W_init, known, H, energy=energy)
    rep = {"filled_columns": cols, "support_rows": int(sup0.sum()), "region_rows": int(U.sum()), "pinned_rows": int(pin.sum()),
           "inpaint": info}
    return W, rep


# --------------------------------------------------------------------------------------------------------------------------
# candidate C
# --------------------------------------------------------------------------------------------------------------------------


class UniRigSkin:
    def __init__(self, mesh, skel, unirig: dict, rules=None, fill_from=None, columns=None, params=None):
        self.rules = dict(rules or {})
        self.params = {**DEFAULTS, **dict(self.rules.get("candidate_c", {})), **dict(params or {})}
        self.skel = skel
        self.mesh = mesh
        self.u = unirig
        self.setup = skin_rules.prepare(mesh, skel, self.rules, columns)
        self.topo, self.bones, self.labels, self.cons = self.setup.topo, self.setup.bones, self.setup.labels, self.setup.cons
        self.fill_from = fill_from
        self.report: dict = {"params": self.params, "unirig": unirig["info"]}

    def raw(self):
        Wv, rrep = remap(self.u["W"], self.u["names"], self.u["parent"], self.u["bone_map"], self.bones.names,
                         standard_parents(self.skel))
        self.report["remap"] = {k: v for k, v in rrep.items() if k != "trace"}
        self.report["remap_trace"] = rrep["trace"]
        W0 = self.topo.gather(Wv)
        prof = {"enabled": True, "twist": True, **dict(self.rules.get("profiles") or {})}
        skip_twist = bool(prof.get("enabled")) and bool(prof.get("twist"))
        unmatched = [self.bones.col(n) for n in rrep["columns_unmatched"]
                     if not (skip_twist and self.bones.kind[self.bones.col(n)] == "twist")]
        if self.fill_from is not None and unmatched:
            fb = npzio.load_weights(self.fill_from)
            fnames = fb["bones"].tolist()
            Wf = np.zeros((self.mesh["V"].shape[0], self.bones.k))
            for j, n in enumerate(self.bones.names):
                if n in fnames:
                    Wf[:, j] = fb["W"][:, fnames.index(n)]
            W0, frep = fill_unmatched(self.topo, W0, self.topo.gather(Wf), unmatched, self.bones.H, float(self.params["fill_tau"]),
                                      float(self.params["fill_core"]), int(self.params["fill_rings"]),
                                      str(self.params["fill_energy"]))
            frep["filled_columns"] = [self.bones.names[j] for j in frep["filled_columns"]]
            frep["source"] = os.path.abspath(self.fill_from)
        else:
            frep = {"filled_columns": [], "left_zero": [self.bones.names[j] for j in unmatched]}
        self.report["fill"] = frep
        return W0

    def run(self):
        W = self.raw()
        W, fin = skin_rules.finish(W, self.setup, self.skel, self.rules)
        self.report.update(fin)
        return W


def run(mesh, skel, unirig: dict, rules=None, fill_from=None, columns=None, params=None):
    """Candidate C -> (welded W (n_w,k), UniRigSkin with .report/.topo/.bones/.labels)."""
    us = UniRigSkin(mesh, skel, unirig, rules, fill_from, columns, params)
    return us.run(), us


def main(argv=None):
    ap = argparse.ArgumentParser(description="skin candidate C (UniRig weights remapped to the standard skeleton)")
    ap.add_argument("--mesh", required=True)
    ap.add_argument("--skeleton", required=True)
    ap.add_argument("--unirig-dir", default=None, help=r"A2 output folder (E:\tmp_rigkit\A2\unirig\<asset>)")
    ap.add_argument("--assume-vertex-order", action="store_true",
                    help="use the unirig_weights rows in file order when correspondence.json or its mesh is missing "
                         "(recorded as unverified)")
    ap.add_argument("--rigged-glb", default=None, help="fallback: UniRig *_rigged.glb (needs --bone-map)")
    ap.add_argument("--bone-map", default=None)
    ap.add_argument("--fill-from", default=None, help="candidate B weights.npz for bones without a UniRig counterpart")
    ap.add_argument("--rules", default=None)
    ap.add_argument("--out", required=True)
    ap.add_argument("--report", default=None)
    a = ap.parse_args(argv)
    mesh = npzio.load_mesh(a.mesh)
    skel = template.load_skeleton(a.skeleton)
    if a.unirig_dir:
        u = load_unirig_dir(a.unirig_dir, mesh, assume_order=a.assume_vertex_order)
    elif a.rigged_glb and a.bone_map:
        u = load_unirig_glb(a.rigged_glb, a.bone_map, mesh)
    else:
        ap.error("give --unirig-dir, or --rigged-glb and --bone-map")
    rules = skin_rules.load_rules(a.rules) if a.rules else {}
    t0 = time.time()
    Ww, us = run(mesh, skel, u, rules, fill_from=a.fill_from)
    W = sc.to_full(Ww, us.topo)
    npzio.save_weights(a.out, us.bones.names, W, locked=us.topo.scatter(us.cons.rigid_col >= 0),
                       meta={"candidate": CANDIDATE, "params": dict(us.params, rules=a.rules, fill_from=a.fill_from)},
                       check_sums=True)
    rep = dict(us.report, seconds=round(time.time() - t0, 2), out=a.out)
    npzio.write_json(a.report or (os.path.splitext(a.out)[0] + ".json"), rep)
    print(f"candidate C: {W.shape[0]} vertices, {len(us.bones.names)} bones, {rep['seconds']} s -> {a.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
