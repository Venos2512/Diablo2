r"""I4 test: rigkit/intake.py writes ``z_offset`` into the mesh.npz meta in the solvers.glbmesh convention
(``V = V_imported * scale_factor + (0, 0, z_offset)``), so solvers/unirig_bridge.py (``to_mesh_frame``, read at
``process``) and solvers/skin_unirig.py map UniRig's glTF positions onto the intake mesh. I3 found the key missing: on a GLB not
grounded at z = 0 UniRig's joints and weights landed z_min x factor too high (the pipeline then read UniRig against the S1 glbmesh
mesh; that workaround is gone).

A synthetic GLB (trimesh, glTF Y up) whose lowest point is 0.35 m above the ground goes through the real intake CLI in headless
Blender (``-b --factory-startup``); the result is compared with ``solvers.glbmesh.glb_to_mesh`` of the same file and with
``unirig_bridge.to_mesh_frame`` of its raw glTF positions. Skipped without Blender.

    E:\tools\rigkit-env\Scripts\python.exe -I -B -m pytest -q -p no:cacheprovider scripts/tests/integration/I4_intake_z_offset_test.py
"""
import json
import os
import subprocess
import sys

sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPTS = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, SCRIPTS)

import numpy as np  # noqa: E402
import pytest  # noqa: E402

from rigcore import npzio  # noqa: E402
from rigkit import intake  # noqa: E402
from solvers import glbmesh, unirig_bridge  # noqa: E402

BLENDER = r"E:\SteamLibrary\steamapps\common\Blender\blender.exe"
H = 1.8


def _lifted_glb(path) -> np.ndarray:
    """A closed, slightly irregular box in glTF coordinates (Y up) from y 0.35 to 1.25 (Blender z after import), written as GLB.
    Returns the glTF vertex positions."""
    import trimesh

    V = np.array([[x, y, z] for x in (-0.2, 0.2) for y in (0.35, 1.25) for z in (-0.1, 0.1)], dtype=np.float64)
    V[7] += (0.03, 0.0, 0.02)  # break the symmetry so a wrong vertex order or axis swap cannot pass
    F = np.array([[0, 1, 3], [0, 3, 2], [4, 6, 7], [4, 7, 5], [0, 4, 5], [0, 5, 1], [2, 3, 7], [2, 7, 6], [0, 2, 6], [0, 6, 4],
                  [1, 5, 7], [1, 7, 3]])
    trimesh.Trimesh(V, F, process=False).export(path, file_type="glb")
    return V


def test_mesh_z_offset_formula():
    """The meta value from a normalize result: -z_min x factor, exactly 0.0 for a grounded mesh."""
    assert intake.mesh_z_offset({"offset_z_m": 0.0, "factor": 0.679}) == 0.0
    assert intake.mesh_z_offset({"offset_z_m": 0.35, "factor": 2.0}) == pytest.approx(-0.7, abs=1e-15)
    assert intake.mesh_z_offset({"offset_z_m": -0.1, "factor": 3.0}) == pytest.approx(0.3, abs=1e-15)


@pytest.mark.skipif(not os.path.isfile(BLENDER), reason="Blender not found")
def test_intake_writes_z_offset_for_a_lifted_mesh(tmp_path):
    glb = str(tmp_path / "lifted.glb")
    Vg = _lifted_glb(glb)
    out = tmp_path / "rig"
    env = dict(os.environ, TEMP=str(tmp_path), TMP=str(tmp_path))
    r = subprocess.run([BLENDER, "-b", "--factory-startup", "-P", os.path.join(SCRIPTS, "rigkit", "intake.py"), "--", "--glb", glb,
                        "--asset-id", "I4_lifted", "--H", str(H), "--out-dir", str(out)], capture_output=True, text=True, timeout=300,
                       env=env, cwd=SCRIPTS)
    assert r.returncode == 0, r.stdout[-2000:] + r.stderr[-2000:]
    info = json.load(open(out / "intake.json", encoding="utf-8"))
    nz = info["normalize"]
    assert nz["ok"] and nz["offset_z_m"] == pytest.approx(0.35, abs=1e-6) and nz["factor"] == pytest.approx(H / 0.9, rel=1e-6)
    mi = npzio.load_mesh(str(out / "_work" / "mesh.npz"))
    mg = glbmesh.glb_to_mesh(glb, "I4_lifted", H)
    # the intake meta now carries z_offset, equal to glbmesh's (same float32 source positions, same float64 arithmetic)
    assert "z_offset" in mi["meta"] and mi["meta"]["z_offset"] == pytest.approx(mg["meta"]["z_offset"], abs=1e-12)
    assert mi["meta"]["z_offset"] == pytest.approx(-0.35 * H / 0.9, abs=1e-6) and mi["meta"]["z_offset"] != 0.0
    assert mi["meta"]["scale_factor"] == pytest.approx(mg["meta"]["scale_factor"], rel=1e-12)
    assert mi["V"][:, 2].min() == pytest.approx(0.0, abs=1e-6) and mi["V"][:, 2].max() == pytest.approx(H, abs=1e-5)
    # UniRig's mapping (unirig_bridge.process: to_mesh_frame with the meta values, then the exact correspondence test) lands on the
    # intake mesh vertex for vertex; without z_offset it is z_min x factor (0.7 m) too high
    P = unirig_bridge.to_mesh_frame(Vg.astype(np.float32), mi["meta"]["scale_factor"], mi["meta"]["z_offset"])
    corr = unirig_bridge.correspondence(mi["V"], P)
    assert corr["exact"] and corr["max_dist"] <= 1e-5, corr["method"]
    stale = unirig_bridge.to_mesh_frame(Vg.astype(np.float32), mi["meta"]["scale_factor"], 0.0)
    assert np.abs(stale[:, 2] - mi["V"][:, 2]).min() == pytest.approx(0.35 * H / 0.9, abs=1e-5)
