"""A2 tests: solvers.glbmesh - glTF -> Blender frame, S2 normalisation, vertex order vs raw accessors and vs Blender's importer.

PYTEST_DONT_REWRITE
"""
import json
import os
import subprocess
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import numpy as np  # noqa: E402
import pytest  # noqa: E402

from solvers import glbmesh  # noqa: E402

REPO = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), *[".."] * 6))
D01_GLB = os.path.join(REPO, "ashlar", "3d", "act-01", "monsters", "D01_hodling", "D01_hodling.glb")
BLENDER = r"E:\SteamLibrary\steamapps\common\Blender\blender.exe"


def test_gltf_to_blender_axes():
    # glTF +Y (up) -> Blender +Z; glTF +Z (front) -> Blender -Y; +X (character left) stays +X
    P = np.eye(3)
    B = glbmesh.gltf_to_blender(P)
    assert np.allclose(B[0], [1, 0, 0])
    assert np.allclose(B[1], [0, 0, 1])
    assert np.allclose(B[2], [0, -1, 0])
    assert np.allclose(B, P @ glbmesh.GLTF_TO_BLENDER.T)


def test_frame_roundtrip_random():
    rng = np.random.default_rng(1)
    P = rng.normal(size=(100, 3))
    assert np.allclose(glbmesh.blender_to_gltf(glbmesh.gltf_to_blender(P)), P)


def test_matrix_conversion_rotation_about_up():
    # 90 deg about glTF +Y (up) must become 90 deg about Blender +Z, same handedness
    c, s = 0.0, 1.0
    M = np.array([[c, 0, s, 0], [0, 1, 0, 0], [-s, 0, c, 0], [0, 0, 0, 1.0]])
    B = glbmesh.gltf_matrix_to_blender(M)
    v_gltf = np.array([1.0, 0, 0])
    v_rot_gltf = M[:3, :3] @ v_gltf
    assert np.allclose(glbmesh.gltf_to_blender(v_rot_gltf), B[:3, :3] @ glbmesh.gltf_to_blender(v_gltf))
    assert np.allclose(B[:3, :3] @ np.array([0, 0, 1.0]), [0, 0, 1])  # Blender up axis is invariant


def test_s2_normalize_scale_and_ground():
    V = np.array([[0, 0, 0.2], [1, 0, 1.2], [0.5, 0.3, 0.7]])
    out, f, zo = glbmesh.s2_normalize(V, 1.8)
    assert f == pytest.approx(1.8)
    assert out[:, 2].min() == pytest.approx(0.0)
    assert out[:, 2].max() == pytest.approx(1.8)
    assert zo == pytest.approx(-0.36)
    out2, f2, zo2 = glbmesh.s2_normalize(np.array([[0, 0, 0.0], [0, 0, 2.0]]), 0.5)
    assert zo2 == 0.0 and f2 == pytest.approx(0.25)


@pytest.fixture(scope="module")
def d01_mesh():
    if not os.path.isfile(D01_GLB):
        pytest.skip("D01 GLB not found")
    return glbmesh.glb_to_mesh(D01_GLB, "D01_hodling", 0.5)


def test_d01_counts_and_factor(d01_mesh):
    m = d01_mesh
    assert m["V"].shape == (6505, 3)
    assert m["F"].shape == (10668, 3)
    assert int(m["weld"].max()) + 1 == 5389  # mesh-intake.md: D01 6,505 vertices -> 5,389 positions
    assert m["meta"]["scale_factor"] == pytest.approx(0.679495687, abs=1e-9)  # D01 qa_report section 2
    assert m["meta"]["z_offset"] == 0.0
    assert m["V"][:, 2].min() == pytest.approx(0.0, abs=1e-12)
    assert m["V"][:, 2].max() == pytest.approx(0.5, abs=1e-12)
    assert m["V"][:, 1].min() == pytest.approx(-0.1558, abs=1e-4)  # nose = front extreme at -Y (qa_report: Y = -0.1558)


def test_d01_matches_raw_accessors_and_scales_back(d01_mesh):
    js, bin_ = glbmesh.read_glb(D01_GLB)
    prim = js["meshes"][0]["primitives"][0]
    P = glbmesh.accessor(js, bin_, prim["attributes"]["POSITION"]).astype(np.float64)
    I = glbmesh.accessor(js, bin_, prim["indices"]).astype(np.int64).reshape(-1, 3)
    m = d01_mesh
    back = glbmesh.blender_to_gltf(m["V"] / m["meta"]["scale_factor"])
    assert np.abs(back - P).max() <= 1e-6  # mesh-intake.md S2 check
    assert np.array_equal(m["F"], I)
    uv = glbmesh.accessor(js, bin_, prim["attributes"]["TEXCOORD_0"]).astype(np.float64)
    assert np.allclose(m["UV"], np.c_[uv[:, 0], 1.0 - uv[:, 1]], atol=1e-7)  # Blender/OpenGL v-up


def test_texture_info_d01():
    if not os.path.isfile(D01_GLB):
        pytest.skip("D01 GLB not found")
    t = glbmesh.texture_info(D01_GLB)
    assert t["glb_bytes"] > 1_000_000 and t["n_images"] == 3
    assert set(t["materials"][0]["maps"]) >= {"baseColorTexture", "normalTexture", "metallicRoughnessTexture"}


@pytest.mark.skipif(not os.path.isfile(BLENDER), reason="Blender 5.2 not installed")
def test_blender_importer_same_vertex_order(d01_mesh, tmp_path_factory):
    """Headless Blender: same vertex count, order, positions (after S2), UVs and triangles as glbmesh. Files go under pytest's tmp
    (review r3 F4: ``--basetemp`` chooses the folder)."""
    from rigcore import npzio

    out = str(tmp_path_factory.mktemp("glbmesh_blender"))
    npz = os.path.join(out, "d01_mesh_for_blender.npz")
    m = d01_mesh
    npzio.save_mesh(npz, m["V"], m["F"], weld=m["weld"], UV=m["UV"], mat=m["mat"], meta=m["meta"])
    script = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "rigkit", "A2_test_glb_import_order.py")
    js = os.path.join(out, "d01_blender_check.json")
    p = subprocess.run([BLENDER, "-b", "--factory-startup", "-P", script, "--", "--glb", D01_GLB, "--mesh-npz", npz, "--json", js],
                       capture_output=True, text=True, timeout=600)
    line = next((ln for ln in p.stdout.splitlines() if ln.startswith("A2_SUMMARY ")), None)
    assert line is not None, p.stdout[-2000:] + p.stderr[-2000:]
    r = json.loads(line[len("A2_SUMMARY "):])
    assert p.returncode == 0
    assert r["vertex_order_match"] and r["n_vertices_blender"] == 6505
    assert r["position_max_abs_diff_m"] <= 1e-6
    assert r["uv_max_abs_diff"] <= 1e-6
    assert r["triangles_identical_as_sets"]
