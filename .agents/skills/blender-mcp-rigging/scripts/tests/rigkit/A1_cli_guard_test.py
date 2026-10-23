"""A1 unit tests (rigkit-env): the output-folder guard of A1_test_cli_chain.py (``prepare_out``). It deletes only folders inside the
scratch root that carry its own marker (or are empty); junctions are resolved, so one pointing outside the root is refused.

Run from ``scripts/``:  E:\\tools\\rigkit-env\\Scripts\\python.exe -I -m pytest tests/rigkit -q
"""
import importlib.util
import os

import pytest


@pytest.fixture(scope="module")
def cli():
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "A1_test_cli_chain.py")
    spec = importlib.util.spec_from_file_location("a1_cli_chain_under_test", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_refuses_outside_root_and_root_itself(cli, tmp_path):
    root, other = tmp_path / "root", tmp_path / "other"
    root.mkdir()
    other.mkdir()
    (other / "keep.txt").write_text("x")
    for bad in (other, root, root / ".." / "other", r"C:\Windows\Temp\a1_cli_should_never_be_touched"):
        with pytest.raises(RuntimeError, match="not inside"):
            cli.prepare_out(str(bad), root=str(root))
    assert (other / "keep.txt").read_text() == "x"
    assert cli.SCRATCH_ROOT == r"E:\tmp_rigkit"


def test_needs_marker_or_empty(cli, tmp_path):
    root = tmp_path / "root"
    out = root / "cli"
    out.mkdir(parents=True)
    (out / "evidence.json").write_text("{}")
    with pytest.raises(RuntimeError, match="marker"):
        cli.prepare_out(str(out), root=str(root))
    assert (out / "evidence.json").exists()  # untouched
    (out / "evidence.json").unlink()
    real = cli.prepare_out(str(out), root=str(root))  # empty folder: accepted, marker written
    assert os.path.isfile(os.path.join(real, cli.MARKER))
    (out / "old_run.txt").write_text("old")
    cli.prepare_out(str(out), root=str(root))  # its own folder: cleared
    assert sorted(os.listdir(out)) == [cli.MARKER]
    fresh = root / "new" / "deep"
    cli.prepare_out(str(fresh), root=str(root))
    assert os.listdir(fresh) == [cli.MARKER]
    (fresh / cli.MARKER).unlink()
    (fresh / "x").write_text("x")
    with pytest.raises(RuntimeError, match="marker"):
        cli.prepare_out(str(fresh), root=str(root))
    assert (fresh / "x").exists()


def test_junction_pointing_outside_is_refused(cli, tmp_path):
    _winapi = pytest.importorskip("_winapi")
    root, target = tmp_path / "root", tmp_path / "elsewhere"
    root.mkdir()
    target.mkdir()
    (target / cli.MARKER).write_text("planted")
    (target / "precious.txt").write_text("keep")
    link = root / "cli"
    try:
        _winapi.CreateJunction(str(target), str(link))
    except OSError as e:  # pragma: no cover - no junction support
        pytest.skip(f"cannot create a junction: {e}")
    try:
        with pytest.raises(RuntimeError, match="not inside"):
            cli.prepare_out(str(link), root=str(root))
        assert (target / "precious.txt").read_text() == "keep"
    finally:
        os.rmdir(link)  # removes the junction only
