r"""pipeline_steps.finish - the S7 "finish" of the pipeline (references/skinning.md, "finish iterates profiles + enforce to a fixed
point"): ``solvers.skin_rules.finish`` over EVERY row of the selected weights (the selector re-applies the joint profiles only on
the rows of its blend band), the invariants of the result and its limb leak -> the rig's final ``weights.npz``.

The selector's output should already be a fixed point (each candidate's rows were finished by its own module and the profiles are
idempotent), so ``change_max`` is a check, expected <= 1e-6; a larger change is reported, and the finished weights are the ones
written (the fixed point of profiles + enforce).

Invariants (thresholds.json rows ``weights_a1_4_to_7`` and ``weights_colocated_equal``): rows sum to 1, no empty row, at most 4
influences, no negative weight, identical rows on co-located (seam duplicate) vertices.

    python -I scripts/pipeline_steps/finish.py --mesh mesh.npz --skeleton skeleton.json [--rules skin_rules.json]
        --weights selected.npz --out weights.npz --report s7_finish.json

Units: metres. Frame: Blender, Z up, front -Y, left +X. Prints one JSON line; exit 1 when an invariant fails.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import warnings

if __name__ == "__main__":
    sys.dont_write_bytecode = True
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np  # noqa: E402

from rigcore import npzio, template  # noqa: E402
from solvers import skin_common as sc  # noqa: E402
from solvers import skin_rules  # noqa: E402

from pipeline_steps.runner import clean  # noqa: E402

CANDIDATE = "final"
FIXED_POINT_TOL = 1e-6
SUM_TOL = 1e-5
MAX_INFLUENCES = 4


def invariants(W, weld) -> dict:
    """Per-original-vertex weights ``W`` (n,k): sum error, empty rows, influences, negatives, co-located difference."""
    W = np.asarray(W, dtype=np.float64)
    s = W.sum(1)
    nz = (W > 0).sum(1)
    weld = np.asarray(weld, dtype=np.int64)
    first = np.full(int(weld.max()) + 1, -1, dtype=np.int64)
    idx = np.arange(len(weld))[::-1]
    first[weld[idx]] = idx
    coloc = float(np.abs(W - W[first[weld]]).max()) if len(W) else 0.0
    out = {"rows": int(len(W)), "sum_err_max": float(np.abs(s - 1.0).max()) if len(W) else 0.0, "empty_rows": int((nz == 0).sum()),
           "max_influences": int(nz.max()) if len(W) else 0, "rows_over_4": int((nz > MAX_INFLUENCES).sum()),
           "negative_min": float(W.min()) if W.size else 0.0, "colocated_max_diff": coloc,
           "influence_histogram": {str(k): int((nz == k).sum()) for k in range(0, int(nz.max() if len(W) else 0) + 1)}}
    out["ok"] = (out["sum_err_max"] <= SUM_TOL and out["empty_rows"] == 0 and out["rows_over_4"] == 0 and out["negative_min"] >= 0.0
                 and coloc <= 1e-6)
    return out


def run(mesh_path, skel_path, weights_path, out_path, rules_path=None, report_path=None) -> dict:
    t0 = time.time()
    mesh = npzio.load_mesh(mesh_path)
    skel = template.load_skeleton(skel_path)
    rules = skin_rules.load_rules(rules_path) if rules_path else {}
    w = npzio.load_weights(weights_path)
    setup = skin_rules.prepare(mesh, skel, rules)
    topo, bones = setup.topo, setup.bones
    cols = [str(b) for b in w["bones"]]
    W_in = np.asarray(w["W"], dtype=np.float64)
    Wf = np.zeros((topo.n, bones.k))
    for j, n in enumerate(bones.names):
        if n in cols:
            Wf[:, j] = W_in[:, cols.index(n)]
    dropped = {n: float(W_in[:, cols.index(n)].max()) for n in cols if n not in bones.names and W_in[:, cols.index(n)].max() > 0}
    Ww0 = topo.gather(Wf)
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        Ww, fin = skin_rules.finish(Ww0, setup, skel, rules)
    change = float(np.abs(Ww - Ww0).max()) if Ww.size else 0.0
    W = sc.to_full(Ww, topo)
    inv = invariants(W, mesh["weld"])
    params = {"source": os.path.abspath(weights_path), "source_candidate": (w.get("meta") or {}).get("candidate"),
              "source_params": (w.get("meta") or {}).get("params"), "rules": os.path.abspath(rules_path) if rules_path else None,
              "finish_rounds": fin["rounds"]["rounds"], "converged": fin["rounds"]["converged"], "change_max": change}
    npzio.save_weights(out_path, bones.names, W, locked=w.get("locked"), meta={"candidate": CANDIDATE, "params": params},
                       check_sums=True)
    rep = {"ok": bool(inv["ok"]), "out": os.path.abspath(out_path), "change_max": change,
           "fixed_point": bool(change <= FIXED_POINT_TOL), "fixed_point_tol": FIXED_POINT_TOL, "rounds": fin["rounds"],
           "warnings": [str(x.message) for x in caught], "columns_dropped": dropped, "invariants": inv,
           "limb_leak": fin.get("limb_leak"), "side_planes": fin.get("side_planes"), "bones": list(bones.names),
           "seconds": round(time.time() - t0, 2)}
    if report_path:
        npzio.write_json(report_path, clean(rep))
    return rep


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="S7 finish: skin_rules.finish on every row of the selected weights + invariants")
    ap.add_argument("--mesh", required=True)
    ap.add_argument("--skeleton", required=True)
    ap.add_argument("--rules", default=None)
    ap.add_argument("--weights", required=True, help="selected weights (solvers/skin_select.py)")
    ap.add_argument("--out", required=True, help="final weights.npz")
    ap.add_argument("--report", default=None)
    a = ap.parse_args(argv)
    try:
        rep = run(a.mesh, a.skeleton, a.weights, a.out, a.rules, a.report)
    except Exception as e:  # one JSON line, non-zero exit
        import traceback

        traceback.print_exc()
        print(json.dumps({"ok": False, "error": f"{type(e).__name__}: {e}"}))
        return 1
    leak = rep.get("limb_leak") or {}
    print(json.dumps({"ok": rep["ok"], "out": rep["out"], "change_max": rep["change_max"], "fixed_point": rep["fixed_point"],
                      "rounds": rep["rounds"]["rounds"], "converged": rep["rounds"]["converged"],
                      "invariants": {k: v for k, v in rep["invariants"].items() if k != "influence_histogram"},
                      "limb_leak_rows": leak.get("rows"), "seconds": rep["seconds"]}))
    return 0 if rep["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
