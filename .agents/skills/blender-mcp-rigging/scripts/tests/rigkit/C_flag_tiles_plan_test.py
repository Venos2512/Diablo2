"""Owner C (I2): rigkit.render S3 flag tiles without Blender - the shot plan of A2's flags.json (crops widened when a source lies
outside A2's crop, context boxes holding the chain neighbours of landmarks.json, views and clip planes per mode), chunk ranges
and the Pillow compose (tile PNGs + contact sheet) on synthetic shots. Runs in rigkit-env:

    E:\\tools\\rigkit-env\\Scripts\\python.exe -I -m pytest scripts/tests/rigkit/C_flag_tiles_plan_test.py -q -p no:cacheprovider
"""
import json
import os

import numpy as np
import pytest

from rigcore import npzio
from rigkit import render as R

H = 1.0


def _flags():
    """Two tiles: knee_L (source d 70 mm above A2's crop: the crop must widen) and head (centre id, d sanity-only)."""
    def crop(c, h):
        c = np.asarray(c, float)
        return {"centre": c.tolist(), "half_size": h, "box_min": (c - h).tolist(), "box_max": (c + h).tolist()}

    knee = {"tile": 1, "key": "knee", "ids": ["knee_L"], "class": "limb", "flag": "vision", "status": "pending", "impact": 6.0,
            "tau_H": 0.015, "grid_m": 0.01, "reasons": {"knee_L": "flagged: a+d disagree"},
            "candidates": {"knee_L": {"a": [0.1, 0.0, 0.5], "d": [0.1, 0.0, 0.62]}}, "sanity_only": {"knee_L": False},
            "provisional": {"knee_L": [0.1, 0.0, 0.5]}, "provisional_source": {"knee_L": "a"}, "gates_failed": {"knee_L": {}},
            "crops": {"knee_L": crop([0.1, 0.0, 0.5], 0.05)}, "crop": crop([0.1, 0.0, 0.5], 0.05),
            "sections": {"knee_L": {"kind": "limb_perpendicular", "plane": {"origin": [0.1, 0, 0.5], "normal": [0, 0, 1]},
                                    "polylines": [{"closed": True, "points": [[0.07, -0.03, 0.5], [0.13, -0.03, 0.5],
                                                                              [0.13, 0.03, 0.5], [0.07, 0.03, 0.5]]}]}}}
    head = {"tile": 2, "key": "head", "ids": ["head"], "class": "convention", "flag": "vision", "status": "pending",
            "impact": 2.0, "tau_H": 0.03, "grid_m": 0.01, "reasons": {"head": "flagged"},
            "candidates": {"head": {"a": [0.0, 0.0, 0.9], "d": [0.0, 0.01, 0.91]}}, "sanity_only": {"head": True},
            "provisional": {"head": [0.0, 0.0, 0.9]}, "provisional_source": {"head": "a"}, "gates_failed": {"head": {"d": ["prior"]}},
            "crops": {"head": crop([0.0, 0.0, 0.9], 0.09)}, "crop": crop([0.0, 0.0, 0.9], 0.09), "sections": {}}
    return {"schema": 0, "asset_id": "synthetic", "family": "H", "H": H, "tiles": [knee, head]}


LANDMARKS = {"hip_L": {"pos": [0.1, 0.0, 0.9]}, "ankle_L": {"pos": [0.1, 0.0, 0.1]}, "neck": {"pos": [0.0, 0.0, 0.8]},
             "head_top": {"pos": [0.0, 0.0, 1.0]}, "knee_L": {"pos": [0.1, 0.0, 0.5]}}


def test_C_flag_tile_boxes_widen_and_context():
    """A2's crop is widened to a cube holding every source + margin (d lies 70 mm above it); the context cube holds the hip and
    the ankle (chain neighbours) and the crop; without the neighbours it is FT_CONTEXT_FACTOR x the crop; capped at 0.6 H."""
    t = _flags()["tiles"][0]
    ref = {k: v["pos"] for k, v in LANDMARKS.items()}
    bx = R.flag_tile_boxes(t, "knee_L", H, ref)
    lo, hi = np.asarray(bx["crop"][0]), np.asarray(bx["crop"][1])
    pts = np.array(list(t["candidates"]["knee_L"].values()))
    assert bx["widened"] > 0 and np.all(pts >= lo) and np.all(pts <= hi) and bx["a2_crop"][0] == t["crops"]["knee_L"]["box_min"]
    assert np.allclose(hi - lo, (hi - lo)[0]) and bx["half"] == pytest.approx(0.5 * (hi - lo)[0])  # a cube
    assert hi[2] >= 0.62 + 0.02 - 1e-9  # margin max(0.1 x half, 0.02 H) = 0.02 above d
    clo, chi = np.asarray(bx["context"][0]), np.asarray(bx["context"][1])
    assert bx["context_neighbours"] == 2 and clo[2] <= 0.1 - 0.03 + 1e-9 and chi[2] >= 0.9 + 0.03 - 1e-9
    assert np.all(clo <= lo) and np.all(chi >= hi) and (chi - clo)[0] / 2 <= R.FT_CONTEXT_MAX_H * H + 1e-9
    b0 = R.flag_tile_boxes(t, "knee_L", H)
    assert b0["context_neighbours"] == 0 and (np.asarray(b0["context"][1]) - b0["context"][0])[0] / 2 == pytest.approx(
        R.FT_CONTEXT_FACTOR * b0["half"])
    th = _flags()["tiles"][1]
    bh = R.flag_tile_boxes(th, "head", H, ref)
    assert bh["widened"] == 0 and bh["crop"] == [th["crops"]["head"]["box_min"], th["crops"]["head"]["box_max"]]
    assert R._ft_neighbours("knee_L", ref) == [ref["hip_L"], ref["ankle_L"]] and R._ft_neighbours("head", ref) == [ref["neck"],
                                                                                                             ref["head_top"]]


def test_C_plan_flag_tiles_jobs():
    """Per landmark: 2 context shots (solid) + front / side / top x solid / x-ray of the crop; side from the landmark's own side
    (left for _L ids, right for centre ids), top with +Y up; x-ray clipped to the crop slab, solid unclipped; info keeps the
    tiles, the reference landmarks and the boxes."""
    plan = R.plan_flag_tiles(_flags(), 300, landmarks=LANDMARKS)
    jobs = {j["name"]: j for j in plan["jobs"]}
    assert len(jobs) == 2 * (len(R.FT_CONTEXT) + len(R.FT_VIEWS) * len(R.FT_MODES)) == len(plan["jobs"])
    k = jobs["ft01_knee_L_side_xray"]
    assert k["view"] == "left" and k["cut"] == k["depth"] and k["cut"] > 0.05 and k["res"] == 300
    assert jobs["ft02_head_side_solid"]["view"] == "side" and jobs["ft02_head_side_solid"]["cut"] is None
    assert jobs["ft02_head_side_solid"]["depth"] == R.FT_FAR and jobs["ft01_knee_L_top_solid"]["up"] == [0.0, 1.0, 0.0]
    assert jobs["ft01_knee_L_ctxfront_solid"]["kind"] == "ctxfront" and jobs["ft01_knee_L_ctxside_solid"]["view"] == "left"
    assert jobs["ft01_knee_L_ctxfront_solid"]["crop_box"] == k["box"]
    info = plan["info"]
    assert info["n_tiles"] == 2 and info["grid_m"] == pytest.approx(0.01 * H) and set(info["reference_landmarks"]) == set(LANDMARKS)
    assert info["tiles"][0]["render_boxes"]["knee_L"]["widened"] > 0
    ch = R.chunk_ranges(plan["jobs"], max_seconds=2.1, setup_seconds=2.0)
    assert ch[0][0] == 0 and ch[-1][1] == len(plan["jobs"]) and all(a < b for a, b in ch) and len(ch) > 1


def _fake_views(plan, res):
    """Projection of an ortho camera per job, in pure numpy (front: x right, z up; side: -y or +y right; top: x right, y up)."""
    views = {}
    for j in plan["jobs"]:
        lo, hi = np.asarray(j["box"][0]), np.asarray(j["box"][1])
        c, s = (lo + hi) / 2, float(np.max(hi - lo))
        right, up = {"front": ([1, 0, 0], [0, 0, 1]), "side": ([0, -1, 0], [0, 0, 1]), "left": ([0, 1, 0], [0, 0, 1]),
                     "top": ([1, 0, 0], [0, 1, 0])}[j["view"]]
        right, up = np.asarray(right, float), np.asarray(up, float)
        px = (res / s * right).tolist() + [res / 2 - res / s * float(right @ c)]
        py = (-res / s * up).tolist() + [res / 2 + res / s * float(up @ c)]
        views[j["name"]] = {"px": px, "py": py, "res": res, "file": j["name"] + ".png", "view": j["view"], "kind": j["kind"],
                            "mode": j["mode"], "box": j["box"], "crop_box": j.get("crop_box"), "tile": j["tile"], "id": j["id"]}
    return views


def test_C_compose_flag_tiles_on_synthetic_shots(tmp_path):
    """compose writes one PNG per tile and the contact sheet from raw shots + projections (no Blender); markers are drawn in
    their colours where the projection puts them."""
    from PIL import Image

    res = 120
    plan = R.plan_flag_tiles(_flags(), res, landmarks=LANDMARKS)
    out = str(tmp_path)
    os.makedirs(os.path.join(out, "raw"))
    for j in plan["jobs"]:
        Image.new("RGB", (res, res), (90, 90, 95)).save(os.path.join(out, "raw", j["name"] + ".png"))
    views = _fake_views(plan, res)
    npzio.write_json(os.path.join(out, R.FT_INFO), dict(plan["info"], views=views, jobs=plan["jobs"]))
    r = R.compose_flag_tiles(out, cell_px=200, thumb_px=100)
    assert r["ok"] and r["files"] == ["flag_tile_01_knee.png", "flag_tile_02_head.png", "flag_tiles_contact.png"]
    for f in r["files"]:
        im = Image.open(os.path.join(out, f))
        assert im.width > 600 and im.height > 200
    # the source a marker of knee_L lands where the projection says (green), in a cell drawn alone
    v = views["ft01_knee_L_front_solid"]
    cell = R._ft_cell(Image.new("RGB", (res, res), (90, 90, 95)), v, plan["info"]["tiles"][0], "knee_L", 0.01, 1.0)
    x, y = R._ft_proj(v)(plan["info"]["tiles"][0]["candidates"]["knee_L"]["a"])
    assert cell.getpixel((int(round(x)), int(round(y)))) == pytest.approx(R.FT_MARKERS["a"], abs=40)
    xd, yd = R._ft_proj(v)(plan["info"]["tiles"][0]["candidates"]["knee_L"]["d"])
    assert 0 <= xd < res and 0 <= yd < res  # the widened crop keeps d in view
    assert json.loads(json.dumps(plan["info"]))  # JSON-able
