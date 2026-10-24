"""A2 tests: solvers.analysis - S1 numbers on D01 (13 islands, 76 boundary edges, legs +10.5 mm in X, arms plane at the hand-tip /
wrist mid-x, per-region asymmetry, crotch, T-pose, front -Y), FL (fused "paddle" fingers, skirt bridging the legs), the texture stop
only for Tripo-sourced GLBs, and unit checks of the self-intersection test, the mirror ICP and the median-residual region plane.

PYTEST_DONT_REWRITE
"""
import json
import os
import struct
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import numpy as np  # noqa: E402
import pytest  # noqa: E402

from rigcore import schema  # noqa: E402
from solvers import analysis, glbmesh  # noqa: E402
from solvers import landmarks_geo as lg  # noqa: E402

REPO = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), *[".."] * 6))
D01 = os.path.join(REPO, "ashlar", "3d", "act-01", "monsters", "D01_hodling", "D01_hodling.glb")
FL = os.path.join(REPO, "ashlar", "3d", "heroes", "FL_flagellant", "vA", "FL_flagellant_vA.glb")


def _analyse(glb, asset, H, family, out):
    """analysis.json (+ .npz) of one GLB, written under ``out`` (pytest's tmp; review r3 F4: ``--basetemp`` chooses the folder)."""
    if not os.path.isfile(glb):
        pytest.skip(f"{glb} not found")
    mesh = glbmesh.glb_to_mesh(glb, asset, H)
    doc, arrays = analysis.analyse(mesh, family, glb)
    analysis.write(doc, arrays, os.path.join(out, asset, "analysis.json"))
    return doc


@pytest.fixture(scope="module")
def out_dir(tmp_path_factory):
    return str(tmp_path_factory.mktemp("analysis"))


@pytest.fixture(scope="module")
def d01(out_dir):
    return _analyse(D01, "D01_hodling", 0.5, "S", out_dir)


@pytest.fixture(scope="module")
def fl(out_dir):
    return _analyse(FL, "FL_flagellant_vA", 1.8, "H", out_dir)


def test_d01_topology(d01):
    schema.validate_analysis(d01)
    assert d01["n_vertices"] == 6505 and d01["n_welded"] == 5389 and d01["n_triangles"] == 10668
    assert d01["n_islands"] == 13  # qa_report: 13 components after seam weld
    assert d01["edges"]["boundary"] == 76 and d01["edges"]["nonmanifold"] == 0
    assert d01["self_intersections"]["n_pairs"] > 0  # Tripo clothing/eyes cross the body shell


def test_d01_symmetry_and_axes(d01):
    s = d01["symmetry"]
    assert abs(s["region_plane_x"]["legs"] - 0.0105) < 0.002  # legs mirror about x = +10.5 mm (qa_report section 2)
    assert abs(s["hand_tip_mid_x"]) < 1e-3  # hand tips symmetric about x = 0
    assert abs(s["region_plane_x"]["arms"]) < 0.0015  # review r1 finding 8: landmark mid-x (ICP said 5.25 mm, surface plane 12.5 mm)
    assert abs(s["wrist_mid_x"]) < 0.0015 and "arms_surface_plane_x" in s
    assert abs(s["leg_vs_hand_tip_x_offset"] - 0.0105) < 0.002
    assert s["normal_angle_to_x_deg"] < 3.0
    assert d01["axes"]["up"] == "+Z" and d01["axes"]["front"] == "-Y"
    # finding 15: per-region RMS about the region's own plane; the asymmetry warning names the regions
    for name in ("legs", "arms", "torso", "head"):
        r = s["regions"][name]
        assert {"plane_x", "rms", "median", "rms_about_global_plane"} <= set(r)
    asym = next(f for f in d01["stop_flags"] if f["code"] == "asymmetric")
    assert set(asym["evidence"]["regions"]) <= {"legs", "arms", "torso", "head"} and "legs" not in asym["evidence"]["regions"]
    assert 0.180 <= d01["frame"]["merge_z"] <= 0.186  # finding 16: crotch 0.182-0.185 (round 1 reported 0.1965)


def test_d01_pose_fingers_cloth(d01):
    assert d01["pose"]["type"] == "T" and d01["pose"]["arm_angle_deg_mean"] < 5.0
    for side in "LR":
        assert d01["pose"]["arms"][side]["contact_length"] == 0.0
        assert d01["fingers"][side]["verdict"] == "separated"
    assert d01["cloth_bridging"]["detected"] is False
    assert d01["texture"]["ok"] is True and d01["source"]["kind"] == "tripo"
    assert d01["stop"] is False
    codes = {f["code"] for f in d01["stop_flags"]}
    assert "leg_plane_offset" in codes and "fingers_fused" not in codes and "cloth_bridging" not in codes


def test_fl_fused_fingers_and_skirt(fl):
    for side in "LR":
        assert fl["fingers"][side]["verdict"] == "paddle"  # tripo.log: "fingers fused into one paddle per hand"
        assert fl["fingers"][side]["gap_over_width"] < analysis.FINGER_GAP_RATIO
    cb = fl["cloth_bridging"]
    assert cb["detected"] is True and cb["kind"] == "cloth"  # long skirt bridges the legs (failure-catalog #6)
    codes = {f["code"]: f["severity"] for f in fl["stop_flags"]}
    assert codes.get("fingers_fused") == "warn" and codes.get("cloth_bridging") == "warn"
    assert codes.get("region_plane_offset") == "info"  # FL's torso sits ~32 mm off the hand-tip midline
    assert fl["pose"]["type"] == "T"


def test_fused_fingers_become_a_stop_when_required():
    if not os.path.isfile(FL):
        pytest.skip("FL GLB not found")
    mesh = glbmesh.glb_to_mesh(FL, "FL_flagellant_vA", 1.8)
    doc, _ = analysis.analyse(mesh, "H", FL, requires_fingers=True)
    assert doc["stop"] is True and any(f["code"] == "fingers_fused" and f["severity"] == "stop" for f in doc["stop_flags"])


def _tiny_glb(path, generator, material="Mat"):
    """A one-triangle GLB without textures (asset.generator and material name given)."""
    pos = np.array([[0, 0, 0], [1, 0, 0], [0, 1, 0]], dtype=np.float32)
    idx = np.array([0, 1, 2, 0], dtype=np.uint16)  # padded to 4 bytes
    bin_ = pos.tobytes() + idx.tobytes()
    js = {"asset": {"version": "2.0", "generator": generator}, "scene": 0, "scenes": [{"nodes": [0]}], "nodes": [{"mesh": 0, "name": "n"}],
          "meshes": [{"primitives": [{"attributes": {"POSITION": 0}, "indices": 1, "material": 0}]}],
          "materials": [{"name": material, "pbrMetallicRoughness": {"baseColorFactor": [1, 1, 1, 1]}}],
          "buffers": [{"byteLength": len(bin_)}],
          "bufferViews": [{"buffer": 0, "byteOffset": 0, "byteLength": 36}, {"buffer": 0, "byteOffset": 36, "byteLength": 6}],
          "accessors": [{"bufferView": 0, "componentType": 5126, "count": 3, "type": "VEC3", "min": [0, 0, 0], "max": [1, 1, 0]},
                        {"bufferView": 1, "componentType": 5123, "count": 3, "type": "SCALAR"}]}
    jb = json.dumps(js).encode()
    jb += b" " * ((4 - len(jb) % 4) % 4)
    body = struct.pack("<II", len(jb), 0x4E4F534A) + jb + struct.pack("<II", len(bin_), 0x004E4942) + bin_
    with open(path, "wb") as fh:
        fh.write(struct.pack("<III", 0x46546C67, 2, 12 + len(body)) + body)
    return path


def test_texture_stop_only_for_tripo_sources(tmp_path):
    """Finding 9: a GLB without textures stops only when it is Tripo-sourced (tier-1 CC0 characters must not stop)."""
    tripo = _tiny_glb(str(tmp_path / "tiny_tripo.glb"), "Tripo")
    cc0 = _tiny_glb(str(tmp_path / "tiny_cc0.glb"), "Khronos glTF Blender I/O v4.2")
    named = _tiny_glb(str(tmp_path / "tiny_named.glb"), "unknown", material="Material_tripo_0123")
    assert analysis.glb_source(tripo)[0] == "tripo" and analysis.glb_source(cc0)[0] == "other"
    assert analysis.glb_source(named) == ("tripo", "material name 'Material_tripo_0123'")
    tex = glbmesh.texture_info(cc0)
    tex.update(ok=False, maps_present=[])
    assert analysis.texture_flag(tex, "tripo")[1] == "stop"
    assert analysis.texture_flag(tex, "other")[1] == "warn"
    assert analysis.texture_flag(dict(tex, ok=True), "tripo") is None and analysis.texture_flag(None, "tripo") is None
    with pytest.raises(ValueError):
        analysis.analyse({"V": np.zeros((3, 3)), "F": np.zeros((1, 3), int), "weld": np.arange(3), "meta": {"H": 1.0}}, source="cc0")


def test_edges_hit_triangles_unit():
    A = np.array([[[0, 0, -1.0], [1, 0, 1], [0, 1, 1]]])
    B = np.array([[[-1, -1, 0.0], [3, -1, 0], [-1, 3, 0]]])
    assert analysis._edges_hit_triangles(A, B)[0] or analysis._edges_hit_triangles(B, A)[0]
    C = B + np.array([0, 0, 5.0])
    assert not (analysis._edges_hit_triangles(A, C)[0] or analysis._edges_hit_triangles(C, A)[0])


def _box(cx, sx=0.2, sy=0.1, sz=0.3):
    V = np.array([[x, y, z] for x in (-sx, sx) for y in (-sy, sy) for z in (0, sz)], dtype=float)
    V[:, 0] += cx
    F = np.array([[0, 1, 3], [0, 3, 2], [4, 6, 7], [4, 7, 5], [0, 4, 5], [0, 5, 1], [2, 3, 7], [2, 7, 6], [0, 2, 6], [0, 6, 4],
                  [1, 5, 7], [1, 7, 3]])
    return V, F


def test_mirror_icp_and_median_region_plane_recover_offset():
    V, F = _box(0.037)
    g = lg.MeshGeom(V, F)
    P = analysis.surface_samples(g.V, g.F, 3000)
    n, d, res = analysis.mirror_icp(g, P, np.array([1.0, 0.05, 0.0]), 0.0, iters=30)
    assert abs(abs(n[0]) - 1) < 1e-6 and abs(d / n[0] - 0.037) < 1e-6
    assert res.max() < 1e-6
    dr, own = analysis.region_plane(g, P, np.array([1.0, 0.0, 0.0]), 0.03, 1.0)
    assert dr == pytest.approx(0.037, abs=5e-5) and np.median(own) < 1e-4
