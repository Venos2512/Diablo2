"""Owner G2: hand-made phase-G FIXTURE for FL_flagellant_vA (H 1.8) - a chain plan (chains.json), garments.npz / garments.json
from simple geometric masks, and a crude garment overlay for the dev run. This stands in for G1's S3g output until it exists; it is
test data, not a planner.

Pieces (welded ids of FL's mesh.npz; azimuth phi around the pelvis axis, 0 = front -Y, 90 = the character's left +X):
    0 tail_F      strip    main island below the attachment line Z_TOP, |phi| < 45
    1 L_tail_S    strip    45 <= phi < 135
    2 tail_B      strip    |phi| >= 135
    3 R_tail_S    strip    -135 < phi <= -45
    4 R_charm_1   cluster  the ten 53-vertex bead islands in front of the right leg (asymmetric: no L partner)
    5 L_lantern   rigid_hanging  the 228-vertex item island on the left hip (one swing bone)
Chains (6): tail_F, L_tail_S, tail_B, R_tail_S (5 bones each, n = clamp(round(L / 0.09 H), 1, 6)), R_charm_1 (5 bones, at most one
bone per two beads), L_lantern_swing (1 bone). Joints lie on each piece's medial curve: per z slab the centroid direction at the
mean radius of the slab (on the cloth, not inside the legs). Hinge X = Y x outward, so +X swings the cloth outward. Leg push on the
four strips (w = 0.5 +- 0.35 sin phi, max 60 deg); the cluster and the lantern have none.

Run (rigkit-env):  python -I -B make_fl_fixture.py [--mesh FL mesh.npz] [--skeleton FL skeleton.json] [--out-dir G2_fixtures]
    ->  FL_chains_fixture.json, FL_garments_fixture.npz, FL_garments_fixture.json
``overlay(mesh, W, bones, garments, chains)`` (also ``--overlay weights.npz --overlay-out weights_fixture.npz``): garment rows get
chain weights (parent -> bone 01 top band over half a bone, then bone-centred linear blend; beads and the lantern rigid), body rows
keep their weights. Units metres, Blender frame.
"""
import argparse
import json
import math
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPTS = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
if SCRIPTS not in sys.path:
    sys.path.insert(0, SCRIPTS)

from rigcore import mesh as rmesh  # noqa: E402
from rigcore import npzio  # noqa: E402

FL_DIR = r"E:\tmp_rigkit\I4\FL_H"
Z_TOP = 1.02  # attachment line of the robe panels (m), below the pelvis head (1.065), above the hips (1.009)
H = 1.8
SECTORS = (("tail_F", None, 0.0), ("L_tail_S", "L", 90.0), ("tail_B", None, 180.0), ("R_tail_S", "R", -90.0))
BEAD_ISLAND_SIZE = 53
LANTERN_ISLAND_SIZE = 228
SPRING = {"stiffness": 0.6, "gravityPower": 1.0, "gravityDir": [0.0, 0.0, -1.0], "dragForce": 0.4, "hitRadius": 0.02}


def welded(mesh):
    weld = np.asarray(mesh["weld"], dtype=np.int64)
    nw = int(weld.max()) + 1
    first = np.full(nw, -1, np.int64)
    idx = np.arange(len(weld))[::-1]
    first[weld[idx]] = idx
    Vw = np.asarray(mesh["V"], dtype=np.float64)[first]
    Fw = weld[np.asarray(mesh["F"], dtype=np.int64)]
    ok = (Fw[:, 0] != Fw[:, 1]) & (Fw[:, 1] != Fw[:, 2]) & (Fw[:, 0] != Fw[:, 2])
    return weld, first, Vw, Fw[ok]


def azimuth(P, axis_xy):
    return np.degrees(np.arctan2(P[:, 0] - axis_xy[0], -(P[:, 1] - axis_xy[1])))


def outward(phi_deg):
    a = math.radians(phi_deg)
    return np.array([math.sin(a), -math.cos(a), 0.0])


def n_bones(L):
    return int(min(6, max(1, round(L / (0.09 * H)))))


def hinge_of(head, tail, out):
    y = np.asarray(tail, float) - np.asarray(head, float)
    y /= np.linalg.norm(y)
    x = np.cross(y, out)
    return (x / np.linalg.norm(x)).tolist()


def medial(P, z_levels, axis_xy, slab):
    """Joint per z level: slab centroid direction at the slab's mean radius (metres)."""
    out = []
    for z in z_levels:
        s = np.abs(P[:, 2] - z) <= slab
        if s.sum() < 3:
            s = np.argsort(np.abs(P[:, 2] - z))[:12]
        Q = P[s]
        d = Q[:, :2] - axis_xy
        r = float(np.linalg.norm(d, axis=1).mean())
        c = d.mean(0)
        c = c / max(float(np.linalg.norm(c)), 1e-9) * r
        out.append([float(axis_xy[0] + c[0]), float(axis_xy[1] + c[1]), float(z)])
    return out


def build(mesh, skel):
    weld, first, Vw, Fw = welded(mesh)
    nw = len(Vw)
    _, lab = rmesh.connected_components(nw, rmesh.unique_edges(Fw))
    lab = np.asarray(lab)
    sizes = np.bincount(lab)
    main = int(np.argmax(sizes))
    bones = {b["name"]: b for b in skel["bones"]}
    axis_xy = np.asarray(bones["pelvis"]["head"][:2], dtype=float)
    piece = np.full(nw, -1, np.int32)
    t = np.full(nw, np.nan, np.float32)
    phi_all = azimuth(Vw, axis_xy)
    low = (lab == main) & (Vw[:, 2] < Z_TOP)
    sector_mask = [np.abs(phi_all) < 45, (phi_all >= 45) & (phi_all < 135), np.abs(phi_all) >= 135,
                   (phi_all > -135) & (phi_all <= -45)]
    for i, m in enumerate(sector_mask):
        piece[low & m] = i
    beads = [k for k in range(len(sizes)) if sizes[k] == BEAD_ISLAND_SIZE and Vw[lab == k][:, 0].mean() < 0]
    for k in beads:
        piece[lab == k] = 4
    lantern = [k for k in range(len(sizes)) if sizes[k] == LANTERN_ISLAND_SIZE]
    for k in lantern:
        piece[lab == k] = 5
    chains, pieces = [], []
    pelvis = bones["pelvis"]
    for i, (name, side, phi) in enumerate(SECTORS):
        P = Vw[piece == i]
        z_hem = float(P[:, 2].min())
        L = Z_TOP - z_hem
        n = n_bones(L)
        sel = piece == i
        t[sel] = np.clip((Z_TOP - Vw[sel, 2]) / L, 0.0, 1.0)
        zs = [Z_TOP - k * L / n for k in range(n + 1)]
        J = medial(P, zs, axis_xy, 0.5 * L / n)
        out = outward(phi)
        bl = []
        for k in range(n):
            nm = f"{name}_{k + 1:02d}"
            bl.append({"name": nm, "parent": "pelvis" if k == 0 else bl[-1]["name"], "head": J[k], "tail": J[k + 1],
                       "hinge": hinge_of(J[k], J[k + 1], out)})
        s = math.sin(math.radians(phi))
        chains.append({"id": name, "piece": f"auto:{i}", "class": "strip", "side": side, "parent": "pelvis", "panel": i,
                       "azimuth_deg": phi, "fan_root": None, "bones": bl,
                       "leg_push": {"enabled": True, "w_L": 0.5 + 0.35 * s, "w_R": 0.5 - 0.35 * s, "dir": out.tolist(),
                                    "max_deg": 60.0},
                       "spring": dict(SPRING)})
        hem = np.nonzero(sel & (Vw[:, 2] < z_hem + 0.04))[0]  # bottom band of the panel (FL's robe has no clean hem border)
        pieces.append({"id": f"auto:{i}", "class": "strip", "confidence": 0.9 - 0.05 * i, "n_welded": int(sel.sum()), "layer": 0,
                       "side": side, "panel": i, "parent": "pelvis",
                       "attach": {"bone": "pelvis", "points": [J[0]]}, "length": L, "width": None,
                       "hem_loop": hem.astype(int).tolist(), "slits": [], "merged_into": None,
                       "reasons": [f"FIXTURE: main island below z {Z_TOP} m, azimuth sector around {phi:g} deg"]})
    # beads: one chain along the cord, at most one bone per two beads
    P = Vw[piece == 4]
    sel = piece == 4
    z0, z1 = float(P[:, 2].max()), float(P[:, 2].min())
    L = z0 - z1
    n = min(n_bones(L), max(1, len(beads) // 2))
    t[sel] = np.clip((z0 - Vw[sel, 2]) / L, 0.0, 1.0)
    zs = [z0 - k * L / n for k in range(n + 1)]
    J = []
    for z in zs:
        s_ = np.argsort(np.abs(P[:, 2] - z))[:20]
        J.append(P[s_].mean(0).tolist())
    phi_b = float(azimuth(np.array([J[0]]), axis_xy)[0])
    out = outward(phi_b)
    bl = []
    for k in range(n):
        nm = f"R_charm_1_{k + 1:02d}"
        bl.append({"name": nm, "parent": "pelvis" if k == 0 else bl[-1]["name"], "head": J[k], "tail": J[k + 1],
                   "hinge": hinge_of(J[k], J[k + 1], out)})
    chains.append({"id": "R_charm_1", "piece": "auto:4", "class": "cluster", "side": "R", "parent": "pelvis", "panel": None,
                   "azimuth_deg": phi_b, "fan_root": None, "bones": bl,
                   "leg_push": {"enabled": False, "w_L": None, "w_R": None, "dir": out.tolist(), "max_deg": 60.0},
                   "spring": dict(SPRING, stiffness=0.3), "asymmetric": "one bead string on the right only"})
    pieces.append({"id": "auto:4", "class": "cluster", "confidence": 0.75, "n_welded": int(sel.sum()), "layer": 0, "side": "R",
                   "panel": None, "parent": "pelvis", "attach": {"bone": "pelvis", "points": [J[0]]}, "length": L, "width": None,
                   "hem_loop": [], "slits": [], "merged_into": None, "reasons": [f"FIXTURE: {len(beads)} bead islands"]})
    # lantern: one swing bone
    P = Vw[piece == 5]
    sel = piece == 5
    top = [float(P[:, 0].mean()), float(P[:, 1].mean()), float(P[:, 2].max())]
    bot = [float(P[:, 0].mean()), float(P[:, 1].mean()), float(P[:, 2].min())]
    t[sel] = np.clip((top[2] - Vw[sel, 2]) / (top[2] - bot[2]), 0.0, 1.0)
    phi_l = float(azimuth(np.array([top]), axis_xy)[0])
    out = outward(phi_l)
    chains.append({"id": "L_lantern_swing", "piece": "auto:5", "class": "rigid_hanging", "side": "L", "parent": "pelvis",
                   "panel": None, "azimuth_deg": phi_l, "fan_root": None,
                   "bones": [{"name": "L_lantern_swing", "parent": "pelvis", "head": top, "tail": bot,
                              "hinge": hinge_of(top, bot, out)}],
                   "leg_push": {"enabled": False, "w_L": None, "w_R": None, "dir": out.tolist(), "max_deg": 60.0},
                   "spring": dict(SPRING, stiffness=0.8), "asymmetric": "one lantern on the left hip"})
    pieces.append({"id": "auto:5", "class": "rigid_hanging", "confidence": 0.55, "n_welded": int(sel.sum()), "layer": 0, "side": "L",
                   "panel": None, "parent": "pelvis", "attach": {"bone": "pelvis", "points": [top]}, "length": top[2] - bot[2],
                   "width": None, "hem_loop": [], "slits": [], "merged_into": None,
                   "reasons": ["FIXTURE: 228-vertex island on the left hip; confidence below 0.6 on purpose (flag list)"]})
    used = sum(len(c["bones"]) for c in chains)
    caps = [{"bone": f"{s}_Thigh", "shape": "capsule", "offset": bones[f"{s}_Thigh"]["head"], "tail": bones[f"{s}_Thigh"]["tail"],
             "radius": 0.07} for s in ("L", "R")]
    meta = {"schema": 0, "asset_id": "FL_flagellant_vA", "fixture": True, "note": "G2 hand-made fixture (make_fl_fixture.py)"}
    chains_doc = {"schema": 0, "asset_id": "FL_flagellant_vA", "H": H, "chains": chains, "colliders": caps,
                  "budget": {"aux_budget": 32, "used": used, "trims": []}, "fixture": True}
    garm_doc = {"schema": 0, "asset_id": "FL_flagellant_vA", "H": H, "family": "H", "params": {"fixture": True, "z_top": Z_TOP},
                "pieces": pieces, "flags": [{"piece": "auto:5", "why": "confidence 0.55 < 0.6 (fixture)"}],
                "budget": {"aux_budget": 32, "used": used, "trims": []}}
    phi = np.full(nw, np.nan, np.float32)
    layer = np.where(piece >= 0, 0, -1).astype(np.int8)
    outer_ref = np.full(nw, -1, np.int32)
    return chains_doc, garm_doc, {"piece": piece, "t": t, "phi": phi, "layer": layer, "outer_ref": outer_ref,
                                  "meta": np.array(json.dumps(meta))}


def overlay(mesh, W, bones, garments, chains):
    """Fixture overlay: (W2 float32 (n,k2), bones2) with every chain bone added as a column and garment rows replaced (see the
    module docstring). ``W`` (n,k) per original vertex; ``garments`` = garments.npz dict; ``chains`` = chains.json dict."""
    weld, first, Vw, Fw = welded(mesh)
    bones = [str(b) for b in bones]
    chain_bones = [b["name"] for c in chains["chains"] for b in c["bones"]]
    bones2 = bones + [b for b in chain_bones if b not in bones]
    W2 = np.zeros((W.shape[0], len(bones2)), np.float32)
    W2[:, :len(bones)] = W
    col = {b: i for i, b in enumerate(bones2)}
    piece_w = np.asarray(garments["piece"])
    t_w = np.asarray(garments["t"], dtype=np.float64)
    _, lab = rmesh.connected_components(len(Vw), rmesh.unique_edges(Fw))
    lab = np.asarray(lab)
    for c in chains["chains"]:
        pidx = int(str(c["piece"]).split(":")[1])
        rows_w = np.nonzero(piece_w == pidx)[0]
        names = [b["name"] for b in c["bones"]]
        Wc = np.zeros((len(rows_w), len(bones2)), np.float32)
        if c["class"] in ("cluster", "rigid_hanging"):
            heads = np.array([b["head"] for b in c["bones"]])
            tails = np.array([b["tail"] for b in c["bones"]])
            for isl in np.unique(lab[rows_w]):
                m = lab[rows_w] == isl
                cen = Vw[rows_w[m]].mean(0)
                d = [np.linalg.norm(cen - (h + np.clip(np.dot(cen - h, tl - h) / max(np.dot(tl - h, tl - h), 1e-12), 0, 1) * (tl - h)))
                     for h, tl in zip(heads, tails)]
                Wc[m, col[names[int(np.argmin(d))]]] = 1.0
        else:
            n = len(names)
            s = t_w[rows_w] * n
            top = s < 0.5
            f = np.where(top, s / 0.5, 0.0)
            Wc[top, col[c["bones"][0]["parent"]]] = 1.0 - f[top]
            Wc[top, col[names[0]]] = f[top]
            sp = np.clip(s[~top] - 0.5, 0.0, n - 1)
            j = np.minimum(np.floor(sp).astype(int), n - 1)
            fr = sp - j
            ri = np.nonzero(~top)[0]
            for r, jj, ff in zip(ri, j, fr):
                Wc[r, col[names[jj]]] += 1.0 - ff
                if jj + 1 < n:
                    Wc[r, col[names[jj + 1]]] += ff
                else:
                    Wc[r, col[names[jj]]] += ff
        for k, rw in enumerate(rows_w):
            W2[weld == rw] = Wc[k]
    return W2, bones2


def main(argv=None):
    ap = argparse.ArgumentParser(description="G2 FL phase-G fixture")
    ap.add_argument("--mesh", default=os.path.join(FL_DIR, "_work", "mesh.npz"))
    ap.add_argument("--skeleton", default=os.path.join(FL_DIR, "skeleton.json"))
    ap.add_argument("--out-dir", default=HERE)
    ap.add_argument("--overlay", default=None, help="body weights.npz to overlay (per original vertex)")
    ap.add_argument("--overlay-out", default=None)
    ap.add_argument("--chains", default=None, help="chains.json for --overlay (default: the fixture)")
    ap.add_argument("--garments", default=None, help="garments.npz for --overlay (default: the fixture)")
    a = ap.parse_args(argv)
    mesh = npzio.load_mesh(a.mesh)
    if a.overlay:
        w = npzio.load_weights(a.overlay)
        ch = npzio.read_json(a.chains or os.path.join(HERE, "FL_chains_fixture.json"))
        with np.load(a.garments or os.path.join(HERE, "FL_garments_fixture.npz")) as z:
            g = {k: z[k] for k in z.files}
        W2, b2 = overlay(mesh, w["W"], w["bones"], g, ch)
        npzio.save_weights(a.overlay_out, b2, W2, meta={"candidate": "fixture_overlay", "base": os.path.abspath(a.overlay)})
        print(json.dumps({"ok": True, "out": a.overlay_out, "bones": len(b2)}))
        return 0
    skel = npzio.read_json(a.skeleton)
    chains_doc, garm_doc, arrays = build(mesh, skel)
    os.makedirs(a.out_dir, exist_ok=True)
    npzio.write_json(os.path.join(a.out_dir, "FL_chains_fixture.json"), chains_doc)
    npzio.write_json(os.path.join(a.out_dir, "FL_garments_fixture.json"), garm_doc)
    np.savez_compressed(os.path.join(a.out_dir, "FL_garments_fixture.npz"), **arrays)
    print(json.dumps({"ok": True, "chains": [c["id"] for c in chains_doc["chains"]],
                      "bones": {c["id"]: len(c["bones"]) for c in chains_doc["chains"]},
                      "pieces": {p["id"]: p["n_welded"] for p in garm_doc["pieces"]},
                      "hem": {p["id"]: len(p["hem_loop"]) for p in garm_doc["pieces"]}}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
