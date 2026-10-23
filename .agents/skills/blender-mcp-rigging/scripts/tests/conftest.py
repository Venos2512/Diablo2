r"""pytest bootstrap for scripts/tests/** (owner R0): puts ``scripts/`` on sys.path, keeps bytecode and temp files out of the
repository and off C:, and offers fixtures for the shared paths.

Fixtures (session scope): ``skill_root`` (.../blender-mcp-rigging), ``repo_root`` (E:\Diablo2), ``families_dir``, ``d01_dir`` (read-only
asset folder), ``d01_tools_dir``, ``d01_landmarks_path``, ``d01_glb_path``, ``scratch_root`` (E:\tmp_rigkit, created on demand).
Everything under ``ashlar/`` is read-only for tests.
"""
import os
import sys
import tempfile

import pytest

sys.dont_write_bytecode = True  # never write __pycache__ next to sources, or into asset folders when a test imports from them

SCRIPTS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if SCRIPTS not in sys.path:
    sys.path.insert(0, SCRIPTS)

SKILL_ROOT = os.path.dirname(SCRIPTS)
REPO_ROOT = os.path.normpath(os.path.join(SKILL_ROOT, "..", "..", ".."))
SCRATCH_ROOT = r"E:\tmp_rigkit"

# pytest's tmp_path lives under tempfile.gettempdir() (C:\Users\...\Temp): C: is nearly full, so move it to E: when E:\tmp_rigkit exists
if os.path.isdir(SCRATCH_ROOT):
    _tmp = os.path.join(SCRATCH_ROOT, "_pytest_tmp")
    try:
        os.makedirs(_tmp, exist_ok=True)
        tempfile.tempdir = _tmp
    except OSError:
        pass


@pytest.fixture(scope="session")
def skill_root():
    return SKILL_ROOT


@pytest.fixture(scope="session")
def repo_root():
    return REPO_ROOT


@pytest.fixture(scope="session")
def families_dir():
    return os.path.join(SKILL_ROOT, "families")


@pytest.fixture(scope="session")
def d01_dir():
    p = os.path.join(REPO_ROOT, "ashlar", "3d", "monsters", "D01_hodling")
    if not os.path.isdir(p):
        pytest.skip(f"D01 asset folder not found: {p}")
    return p


@pytest.fixture(scope="session")
def d01_tools_dir(d01_dir):
    return os.path.join(d01_dir, "rig", "tools")


@pytest.fixture(scope="session")
def d01_landmarks_path(d01_tools_dir):
    return os.path.join(d01_tools_dir, "landmarks.json")


@pytest.fixture(scope="session")
def d01_glb_path(d01_dir):
    p = os.path.join(d01_dir, "D01_hodling.glb")
    if not os.path.isfile(p):
        pytest.skip(f"D01 GLB not found: {p}")
    return p


@pytest.fixture(scope="session")
def scratch_root():
    os.makedirs(SCRATCH_ROOT, exist_ok=True)
    return SCRATCH_ROOT
