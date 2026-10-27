r"""G6 (rigkit-env, no Blender): generated chain poses are weight tests (tags ``chain`` + ``extreme``, never ``standard``; ring
flare 15 deg, root swings +-30, middle bones +30) and land in solvers/metrics.py's extreme buckets (read only); rigkit/control.py's
pure helpers for an inherited leg push (``drape_targets``, ``helper_geometry``).

    E:\tools\rigkit-env\Scripts\python.exe -I -B -m pytest tests/rigkit/G6_pure_test.py -q -p no:cacheprovider
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(os.path.dirname(HERE)))

from rigkit import control, poses as RP, skeleton  # noqa: E402
from solvers import metrics  # noqa: E402


def _skel():
    bones = [{"name": "root", "parent": None, "kind": "core", "deform": False, "head": [0, 0, 0], "tail": [0, 0, 0.1],
              "hinge": [1, 0, 0], "bend_test": None, "twist": None},
             {"name": "pelvis", "parent": "root", "kind": "core", "deform": True, "head": [0, 0, 1.0], "tail": [0, 0, 1.1],
              "hinge": [1, 0, 0], "bend_test": None, "twist": None}]
    return {"schema": 0, "family": "T", "template_version": "t", "H": 1.8, "bones": bones, "ik": [], "rom": [], "rom_compound": [],
            "skin": {}}


def _chain(cid, phi, n=2, cls="skirt", piece="g00"):
    a = math.radians(phi)
    out = [math.sin(a), -math.cos(a), 0.0]
    bl = []
    for k in range(n):
        head = [0.2 * out[0], 0.2 * out[1], 1.0 - 0.3 * k]
        tail = [0.2 * out[0], 0.2 * out[1], 0.7 - 0.3 * k]
        y = [0.0, 0.0, -1.0]
        hinge = [y[1] * out[2] - y[2] * out[1], y[2] * out[0] - y[0] * out[2], y[0] * out[1] - y[1] * out[0]]
        bl.append({"name": f"{cid}_{k + 1:02d}", "parent": "pelvis" if k == 0 else bl[-1]["name"], "head": head, "tail": tail,
                   "hinge": hinge})
    return {"id": cid, "piece": piece, "class": cls, "side": cid[0] if cid[:2] in ("L_", "R_") else None, "azimuth_deg": phi,
            "fan_root": None, "bones": bl, "leg_push": {"enabled": cls == "skirt", "w_L": 0.5, "w_R": 0.5, "dir": out, "max_deg": 80.0}}


def _ring_skel():
    ch = {"chains": [_chain("skirt_F", 0.0), _chain("L_skirt_S", 90.0, n=1), _chain("skirt_B", 180.0), _chain("R_skirt_S", -90.0),
                     _chain("charm_1", -30.0, n=3, cls="cluster", piece="g08")]}
    return skeleton.merge_chains(_skel(), ch), ch


def test_G6_chain_poses_are_extreme_weight_tests():
    sk, _ = _ring_skel()
    specs, rep = RP.plan_chain_poses(sk)
    assert specs and rep["tags"] == RP.CHAIN_TAGS and rep["flare_deg"] == 15.0 and rep["swing_deg"] == 30.0
    for s in specs:
        assert "chain" in s["tags"] and "extreme" in s["tags"] and "standard" not in s["tags"], s["name"]
    flare = next(s for s in specs if s["name"] == "chain_flare_ring_g00")
    assert sorted(op["bones"][0] for op in flare["ops"]) == sorted(f"ctl_{c}_01" for c in ("skirt_F", "L_skirt_S", "skirt_B",
                                                                                            "R_skirt_S"))
    assert all(op["deg"] == 15.0 for op in flare["ops"])  # G6: the ring flare is 15 deg (30 tore FL's robe: LBS cannot fold)
    roots = [s for s in specs if "_root_" in s["name"]]
    assert roots and {op["deg"] for s in roots for op in s["ops"]} == {30.0, -30.0}  # single-chain root swings kept at +-30
    mids = [s for s in specs if s["name"].endswith("_mid_p30")]
    assert mids and all(op["deg"] == 30.0 for s in mids for op in s["ops"])


class _Cx:
    """The two fields solvers/metrics.py's pose buckets read (``tagged`` via ``tags``, ``rest_index``)."""

    def __init__(self, tags, names):
        self.tags, self.pose_names = tags, names
        self.rest_index = names.index("rest")

    def tagged(self, pose, tag):
        return tag in self.tags.get(pose, [])


def test_G6_chain_poses_land_in_the_extreme_buckets_of_metrics():
    sk, _ = _ring_skel()
    specs, _ = RP.plan_chain_poses(sk)
    tags = {"rest": RP.rest_spec()["tags"], "hip_flexion_L_m60": ["rom", "standard"], "sit": ["compound", "garment", "extreme"]}
    tags.update({s["name"]: s["tags"] for s in specs})
    names = list(tags)
    cx = _Cx(tags, names)
    standard = metrics._poses_with(cx, "standard", names)
    assert "hip_flexion_L_m60" in standard and not any(n.startswith("chain_") for n in standard)
    # compute_lights: extreme = poses tagged extreme
    extreme = metrics._poses_with(cx, "extreme", names)
    assert all(s["name"] in extreme for s in specs)
    # garment_summary: extreme = every pose that is neither standard nor rest
    ext = [nm for nm in names if nm not in standard and nm != names[cx.rest_index]]
    assert all(s["name"] in ext for s in specs)


def test_G6_drape_targets_and_helper_geometry():
    row = {"id": "charm_1", "root": "charm_1_01", "bones": ["charm_1_01", "charm_1_02", "charm_1_03"]}
    kids = {"charm_1_01": ["charm_1_02"]}
    assert control.drape_targets({"drape": 0.75}, row, kids) == ["charm_1_02"]  # own push: bone 02
    assert control.drape_targets({"drape_bone": "charm_1_03"}, row, kids) == ["charm_1_03"]  # inherited: level with the fold
    assert control.drape_targets({"drape_bone": None}, row, kids) == []  # inherited from a one-bone panel: no drape
    assert control.drape_targets({"drape_bone": "skirt_F_02"}, row, kids) == []  # never a bone of another chain
    plan_by = {"R_skirt_FS": _chain("R_skirt_FS", -40.0)}
    inh = {"drape_bone": "charm_1_03", "inherited": {"from": "R_skirt_FS"}}
    assert control.helper_geometry(inh, plan_by, "ctl_charm_1_01", 0) == "ctl_R_skirt_FS_01"  # push pivots on the panel root
    assert control.helper_geometry(inh, plan_by, "ctl_charm_1_03", 1) == "ctl_R_skirt_FS_02"  # drape folds on the panel's fold
    one = {"R_skirt_FS": _chain("R_skirt_FS", -40.0, n=1)}
    assert control.helper_geometry(inh, one, "ctl_charm_1_03", 1) == "ctl_charm_1_03"
    assert control.helper_geometry({"enabled": True}, plan_by, "ctl_skirt_F_01", 0) == "ctl_skirt_F_01"  # own push: own control
