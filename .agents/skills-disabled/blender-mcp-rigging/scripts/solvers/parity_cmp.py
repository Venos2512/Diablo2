r"""solvers.parity_cmp - S8 runtime parity: posed vertices of the clean glTF reimport vs the runtime emulation, by welded position.

Inputs: ``poses.npz`` (rigkit.poses: emulated copy, world), ``mesh.npz`` (weld map of the same vertex order), ``reimport_poses.npz``
(rigkit.parity: the reimported mesh posed with the same skinning matrices; extras ``rest_raw`` = stored GLB positions, ``rest`` =
positions skinned at the identity pose).
Method: every reimported vertex is matched to the source vertex at the same REST position (nearest neighbour on ``rest_raw`` when
present, within ``match_tol``, default 2e-5 x H: the GLB stores float32) and takes that vertex's welded id; seam duplicates of
either mesh collapse onto one welded id. Per pose the deviation of a welded id is the largest distance between its reimported
members and the source position of the id (first member). Reported per pose: max and mean over welded ids, worst id; coverage =
welded ids present in the reimport. Pass when max <= tolerance = 1e-4 m x H / 1.8 (RIG_SKILL_WORKFLOW §4, A1.9), every GLB vertex is
matched, every welded id is covered and the emulation's own weight check (reimport meta ``emulation.weights_check_max``, the copy's
weights vs the exporter rule) is <= 1e-6.

Units metres; Blender frame (Z up, front -Y, left +X).

Run: python -I parity_cmp.py --poses poses.npz --mesh mesh.npz --reimport reimport_poses.npz --out parity.json   (one JSON line)
"""
from __future__ import annotations

import argparse
import json
import os
import sys

import numpy as np

if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scipy.spatial import cKDTree  # noqa: E402

from rigcore import npzio, schema  # noqa: E402


WEIGHT_CHECK_TOL = 1e-6


def tolerance(H: float) -> float:
    """Runtime parity tolerance in metres for catalogue height H (m): 1e-4 m x H / 1.8."""
    return 1e-4 * H / 1.8


def compare(src_poses: dict, mesh: dict, imp: dict, H: float, match_tol: float | None = None) -> dict:
    """Compare loaded dicts (see the module docstring). Returns the report dict."""
    names = [str(n) for n in src_poses["names"]]
    ri = src_poses["meta"].get("rest_index", names.index("rest") if "rest" in names else None)
    src_rest = np.asarray(src_poses["P"][ri], dtype=np.float64) if ri is not None else np.asarray(mesh["V"], dtype=np.float64)
    weld = np.asarray(mesh["weld"], dtype=np.int64)
    n_w = int(weld.max()) + 1
    first = np.full(n_w, -1, np.int64)
    idx = np.arange(len(weld))[::-1]
    first[weld[idx]] = idx
    match_tol = 2e-5 * H if match_tol is None else match_tol
    ex = imp["extra"]
    imp_rest = np.asarray(ex["rest_raw"] if "rest_raw" in ex else ex["rest"], dtype=np.float64)
    d, nn = cKDTree(src_rest).query(imp_rest)
    unmatched = int((d > match_tol).sum())
    wid = weld[nn]
    covered = np.zeros(n_w, bool)
    covered[wid[d <= match_tol]] = True
    tol = tolerance(H)
    per_pose = {}
    worst = 0.0
    for k, nm in enumerate(str(n) for n in imp["names"]):
        if nm not in names:
            raise ValueError(f"reimport pose {nm!r} is not in poses.npz")
        Ps = np.asarray(src_poses["P"][names.index(nm)], dtype=np.float64)[first]  # source position per welded id
        Pi = np.asarray(imp["P"][k], dtype=np.float64)
        dev_v = np.linalg.norm(Pi - Ps[wid], axis=1)
        dev_w = np.zeros(n_w)
        np.maximum.at(dev_w, wid, dev_v)
        dw = dev_w[covered]
        j = int(np.argmax(dev_w))
        per_pose[nm] = {"max_m": float(dw.max()), "mean_m": float(dw.mean()), "worst_welded_id": j,
                        "worst_rest_xyz": [round(float(c), 5) for c in src_rest[first[j]]], "pass": bool(dw.max() <= tol)}
        worst = max(worst, float(dw.max()))
    wcm = (imp["meta"].get("emulation") or {}).get("weights_check_max")
    weights_ok = wcm is None or float(wcm) <= WEIGHT_CHECK_TOL
    return {
        "schema": 0, "H": H, "tolerance_m": tol, "max_m": worst,
        "pass": bool(worst <= tol and unmatched == 0 and covered.all() and weights_ok),
        "weights_check_max": wcm, "weights_check_ok": bool(weights_ok),
        "n_vertices_source": int(len(weld)), "n_welded_source": n_w, "n_vertices_glb": int(len(imp_rest)),
        "unmatched_glb_vertices": unmatched, "rest_match_max_m": float(d.max()), "match_tol_m": match_tol,
        "welded_ids_covered": int(covered.sum()),
        "bone_fit_max": imp["meta"].get("bone_fit_max"), "per_pose": per_pose,
        "method": "reimported vertex -> source vertex at the same rest position (KD-tree) -> welded id; deviation per welded id = max "
                  "over its reimported members of |posed reimport - posed source (first member)|; seam duplicates collapse",
    }


def main(argv=None):
    ap = argparse.ArgumentParser(description="S8 runtime parity by welded position (rigkit-env)")
    ap.add_argument("--poses", required=True)
    ap.add_argument("--mesh", required=True)
    ap.add_argument("--reimport", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--H", type=float, help="catalogue height (default: mesh meta)")
    ap.add_argument("--match-tol", type=float, help="rest-position match tolerance in m (default 2e-5 x H)")
    a = ap.parse_args(argv)
    try:
        mesh = npzio.load_mesh(a.mesh)
        H = a.H or float(mesh["meta"]["H"])
        rep = compare(npzio.load_poses(a.poses), mesh, npzio.load_poses(a.reimport), H, a.match_tol)
        rep["inputs"] = {"poses": os.path.abspath(a.poses), "mesh": os.path.abspath(a.mesh), "reimport": os.path.abspath(a.reimport)}
        npzio.write_json(a.out, rep)
    except Exception as e:
        print(json.dumps({"ok": False, "error": f"{type(e).__name__}: {e}"}))
        return 1
    print(json.dumps({"ok": True, "pass": rep["pass"], "max_m": rep["max_m"], "tolerance_m": rep["tolerance_m"],
                      "unmatched_glb_vertices": rep["unmatched_glb_vertices"], "out": os.path.abspath(a.out)},
                     default=schema.json_default))
    return 0 if rep["pass"] else 2


if __name__ == "__main__":
    sys.exit(main())
