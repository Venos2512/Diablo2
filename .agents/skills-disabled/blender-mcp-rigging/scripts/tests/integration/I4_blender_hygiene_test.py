r"""I4 test: the Blender CLIs leave no litter (I3 finding 7).

* ``rigkit/skin_io.py import ... --save <opened file> --overwrite`` rewrites the .blend WITHOUT a ``.blend1`` backup (it used
  Blender's default ``save_version`` = 1; the pipeline deleted the backup afterwards);
* modules that end with ``os._exit`` (skin_io, poses, parity, render) now end with ``rigkit.bl.exit_now``, which removes Blender's
  per-session temp folder (``<TEMP>/blender_<id>/``) that ``os._exit`` used to leave behind empty;
* ``rigkit.bl.purge_session_tempdir`` touches only a ``blender_*`` folder.

Runs headless Blender with TEMP/TMP pointed at an empty folder under pytest's tmp; skipped without Blender.

    E:\tools\rigkit-env\Scripts\python.exe -I -B -m pytest -q -p no:cacheprovider scripts/tests/integration/I4_blender_hygiene_test.py
"""
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
from rigkit import bl  # noqa: E402

BLENDER = r"E:\SteamLibrary\steamapps\common\Blender\blender.exe"
pytestmark = pytest.mark.skipif(not os.path.isfile(BLENDER), reason="Blender not found")

MAKE_BLEND = """
import bpy, sys
bpy.ops.wm.read_factory_settings(use_empty=True)
me = bpy.data.meshes.new("grid_mesh")
me.from_pydata([(0, 0, 0), (1, 0, 0), (0, 1, 0), (1, 1, 0)], [], [(0, 1, 3, 2)])
ob = bpy.data.objects.new("grid", me)
bpy.context.scene.collection.objects.link(ob)
bpy.ops.wm.save_as_mainfile(filepath=sys.argv[sys.argv.index("--") + 1])
"""


def _env(tmp):
    os.makedirs(tmp, exist_ok=True)
    return dict(os.environ, TEMP=str(tmp), TMP=str(tmp), TMPDIR=str(tmp))


def _leftovers(tmp):
    return sorted(n for n in os.listdir(tmp) if n.startswith("blender_"))


def test_skin_io_save_writes_no_blend1_and_leaves_no_session_temp(tmp_path):
    blend = str(tmp_path / "grid.blend")
    r = subprocess.run([BLENDER, "-b", "--factory-startup", "--python-expr", MAKE_BLEND, "--", blend], capture_output=True, text=True,
                       timeout=300, env=_env(tmp_path / "temp_make"))
    assert r.returncode == 0 and os.path.isfile(blend), r.stdout[-1500:] + r.stderr[-1500:]
    W = np.array([[1.0, 0.0], [0.25, 0.75], [0.5, 0.5], [0.0, 1.0]])
    npz = str(tmp_path / "w.npz")
    npzio.save_weights(npz, ["a", "b"], W, meta={"candidate": "I4_test", "params": {}})
    temp = tmp_path / "temp_io"
    for rnd in range(2):  # the second save overwrites an existing file: that is when Blender would write the .blend1
        r = subprocess.run([BLENDER, "-b", blend, "--factory-startup", "-P", os.path.join(SCRIPTS, "rigkit", "skin_io.py"), "--",
                            "import", "--object", "grid", "--weights", npz, "--save", blend, "--overwrite"], capture_output=True,
                           text=True, timeout=300, env=_env(temp))
        assert r.returncode == 0 and '"ok": true' in r.stdout, (rnd, r.stdout[-1500:] + r.stderr[-1500:])
        assert not os.path.exists(blend + "1"), f"round {rnd}: skin_io left {blend}1"
        assert _leftovers(temp) == [], f"round {rnd}: session temp folders left: {_leftovers(temp)}"
    out = str(tmp_path / "back.npz")
    r = subprocess.run([BLENDER, "-b", blend, "--factory-startup", "-P", os.path.join(SCRIPTS, "rigkit", "skin_io.py"), "--", "export",
                        "--object", "grid", "--out", out], capture_output=True, text=True, timeout=300, env=_env(temp))
    assert r.returncode == 0, r.stdout[-1500:] + r.stderr[-1500:]
    back = npzio.load_weights(out)
    assert sorted(back["bones"].tolist()) == ["a", "b"]
    got = back["W"][:, [back["bones"].tolist().index(n) for n in ("a", "b")]]
    assert np.abs(got - W).max() <= 1e-6  # the saved file holds the imported weights
    assert _leftovers(temp) == []


def test_exit_code_survives_exit_now(tmp_path):
    """A failing skin_io call (no such object) still exits 1 through ``exit_now`` and leaves no session temp folder."""
    blend = str(tmp_path / "grid.blend")
    subprocess.run([BLENDER, "-b", "--factory-startup", "--python-expr", MAKE_BLEND, "--", blend], capture_output=True, text=True,
                   timeout=300, env=_env(tmp_path / "temp_make"), check=True)
    temp = tmp_path / "temp_fail"
    r = subprocess.run([BLENDER, "-b", blend, "--factory-startup", "-P", os.path.join(SCRIPTS, "rigkit", "skin_io.py"), "--", "export",
                        "--object", "missing", "--out", str(tmp_path / "x.npz")], capture_output=True, text=True, timeout=300,
                       env=_env(temp))
    assert r.returncode == 1 and '"ok": false' in r.stdout, r.stdout[-1500:]
    assert _leftovers(temp) == []


def test_purge_session_tempdir_outside_blender_is_a_no_op():
    assert bl.bpy is None and bl.purge_session_tempdir() is None
