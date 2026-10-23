r"""Writer B dev data that does not need Blender (run once before ``B_acceptance_test.py``; D01's mesh/weights/skeleton come from
``tests/rigkit/B_export_d01.py`` in headless Blender).

1. UniRig maps: when writer A2 has not published ``E:\tmp_rigkit\A2\unirig\<asset>\bone_map.json`` yet, run A2's own read-only
   ``solvers.unirig_bridge.process`` on the existing UniRig output (no UniRig run, no GPU) into ``E:\tmp_rigkit\B\unirig\<asset>``.
2. FL: copy A2's FL mesh.npz (``E:\tmp_rigkit\A2\FL_flagellant_vA\mesh.npz``) to ``E:\tmp_rigkit\B\fl`` and resolve an H-family
   skeleton from UniRig's source-d landmarks. DEV ONLY: ``head_top`` = mesh top above the head; each elbow / knee is put on the
   line between its neighbours (shoulder-wrist, hip-ankle) and then moved ``PREBEND_H`` x H in Y (elbow back +Y, knee forward
   -Y), so the bend hinges are defined and point the right way (UniRig limbs are nearly straight, failure-catalog #13; review r2
   N1: a 1 % pre-bend was smaller than the landmarks' own 0.5-1.1 % H off-line bend in X/Z, so the knees hinged sideways and L/R
   differed by 20-45 deg); recorded in ``warnings``.

    python -I tests/solvers/B_make_dev_data.py [--force] [--only fl|unirig]
"""
import argparse
import os
import shutil
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import numpy as np  # noqa: E402

from rigcore import landmarks as rlm  # noqa: E402
from rigcore import npzio, template  # noqa: E402

B_ROOT = r"E:\tmp_rigkit\B"
A2_UNIRIG = r"E:\tmp_rigkit\A2\unirig"
JOBS = [("D01_hodling", r"E:\tmp_unirig\out\D01_hodling\D01_hodling_rigged.glb", os.path.join(B_ROOT, "d01", "mesh.npz"), "S"),
        ("FL_flagellant_vA", r"E:\tmp_unirig\out\FL_flagellant_vA\FL_flagellant_vA_rigged.glb",
         r"E:\tmp_rigkit\A2\FL_flagellant_vA\mesh.npz", "H")]
PREBEND_H = 0.03  # elbow / knee offset in Y after projecting them on the line between their neighbours (fraction of H)


def unirig_maps(force=False):
    from solvers import unirig_bridge as ub

    out = {}
    for aid, glb, mesh, fam in JOBS:
        if os.path.isfile(os.path.join(A2_UNIRIG, aid, "bone_map.json")) and not force:
            out[aid] = "A2 published"
            continue
        if not (os.path.isfile(glb) and os.path.isfile(mesh)):
            out[aid] = "inputs missing"
            continue
        s = ub.process(aid, glb, mesh, family=fam, out_dir=os.path.join(B_ROOT, "unirig", aid))
        out[aid] = {"exact": s["correspondence_exact"], "max_dist_m": s["correspondence_max_dist_m"], "unmapped": s["unmapped"]}
    return out


def fl_dev(force=False):
    O = os.path.join(B_ROOT, "fl")
    os.makedirs(O, exist_ok=True)
    src = r"E:\tmp_rigkit\A2\FL_flagellant_vA\mesh.npz"
    lpath = None
    for root in (A2_UNIRIG, os.path.join(B_ROOT, "unirig")):
        p = os.path.join(root, "FL_flagellant_vA", "landmarks_d.json")
        if os.path.isfile(p):
            lpath = p
            break
    if not os.path.isfile(src) or lpath is None:
        return "inputs missing"
    if os.path.isfile(os.path.join(O, "skeleton.json")) and not force:
        return "exists"
    shutil.copyfile(src, os.path.join(O, "mesh.npz"))
    m = npzio.load_mesh(os.path.join(O, "mesh.npz"))
    H = float(m["meta"]["H"])
    lm = {k: tuple(v) for k, v in rlm.load_landmarks(lpath).items()}
    V = m["V"]
    hd = np.array(lm["head"])
    near = np.linalg.norm(V[:, :2] - hd[:2], axis=1) < 0.08 * H
    lm["head_top"] = (hd[0], hd[1], float(V[near, 2].max()))
    warn = [f"DEV ONLY (writer B tests): head_top = mesh top above the head ({lm['head_top'][2]:.3f} m); landmarks {lpath}"]
    for side in "LR":
        for a, b, c, sgn in (("shoulder", "elbow", "wrist", +1), ("hip", "knee", "ankle", -1)):
            A, Bp, C = (np.array(lm[f"{n}_{side}"]) for n in (a, b, c))
            d = (C - A) / float(np.linalg.norm(C - A))
            on = A + d * float((Bp - A) @ d)
            dy = sgn * PREBEND_H * H
            lm[f"{b}_{side}"] = tuple(on + np.array([0.0, dy, 0.0]))
            warn.append(f"DEV ONLY: {b}_{side} put on the {a}-{c} line ({float(np.linalg.norm(Bp - on)) * 1000:.1f} mm off it) "
                        f"and moved {dy:+.4f} m in Y (pre-bend {PREBEND_H:g} H)")
    fam = template.load_family("H")
    skel = template.resolve(fam, rlm.synthesize_missing(lm, fam, H), H)
    skel["warnings"] = list(skel.get("warnings", [])) + warn
    template.save_skeleton(os.path.join(O, "skeleton.json"), skel)
    return {"bones": len(skel["bones"]), "deform": sum(b["deform"] for b in skel["bones"])}


def main(argv=None):
    ap = argparse.ArgumentParser(description="writer B dev data (UniRig maps, FL skeleton)")
    ap.add_argument("--force", action="store_true", help="rebuild even when the outputs exist")
    ap.add_argument("--only", choices=("fl", "unirig"), help="make only the FL skeleton or only the UniRig maps")
    a = ap.parse_args(argv)
    out = {}
    if a.only in (None, "unirig"):
        out["unirig"] = unirig_maps(a.force)
    if a.only in (None, "fl"):
        out["fl"] = fl_dev(a.force)
    print(out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
