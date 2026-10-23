"""rigcore must import with numpy + stdlib only, and work inside Blender 5.2 (runs blender_import_check.py headless)."""
import json
import os
import subprocess
import sys

import pytest

BLENDER = r"E:\SteamLibrary\steamapps\common\Blender\blender.exe"
HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPTS = os.path.abspath(os.path.join(HERE, "..", ".."))


def test_rigcore_imports_numpy_and_stdlib_only():
    code = (
        "import sys; sys.path.insert(0, %r); sys.dont_write_bytecode = True\n"
        "import rigcore, rigcore.schema, rigcore.npzio, rigcore.mesh, rigcore.geom, rigcore.landmarks, rigcore.template, rigcore.recipe\n"
        "bad = [m for m in ('scipy', 'trimesh', 'pytest', 'igl', 'bpy', 'mathutils', 'pandas') if m in sys.modules]\n"
        "assert not bad, bad\n"
        "print('ok', rigcore.__version__, rigcore.SCHEMA)\n"
    ) % SCRIPTS
    r = subprocess.run([sys.executable, "-I", "-B", "-c", code], capture_output=True, text=True)
    assert r.returncode == 0, r.stderr
    assert r.stdout.strip() == "ok 0.1.0 0"


def test_blender_import_check(scratch_root):
    if not os.path.isfile(BLENDER):
        pytest.skip(f"Blender not found: {BLENDER}")
    script = os.path.join(HERE, "blender_import_check.py")
    r = subprocess.run([BLENDER, "-b", "--factory-startup", "--python", script], capture_output=True, text=True, timeout=300)
    lines = [ln for ln in r.stdout.splitlines() if ln.startswith("{")]
    os.makedirs(os.path.join(scratch_root, "R0"), exist_ok=True)
    with open(os.path.join(scratch_root, "R0", "blender_import_check.json"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    assert r.returncode == 0, r.stdout[-2000:] + r.stderr[-2000:]
    assert len(lines) == 1, lines
    info = json.loads(lines[0])
    assert info["ok"] is True and info["bones"] == 36
    assert info["blender"].startswith("5.2") and info["weld"] == {"vertices": 24, "welded": 8, "edges": 18}
    assert info["roll_max_err"] < 1e-5
    print("\nBlender:", info["blender"], "python", info["python"], "numpy", info["numpy"], "roll err", info["roll_max_err"])
