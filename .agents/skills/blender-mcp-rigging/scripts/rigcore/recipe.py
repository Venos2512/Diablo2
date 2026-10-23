"""rigcore.recipe - ``rig_recipe.json``: one file that lets a rig be rebuilt (inputs, family template, scale, landmarks, skin choice,
script version, step log).

Layout (schema 0, CONTRACT.md)::

    {schema, asset_id, input:{glb, sha256}, family, template:{path, version, sha256}|null, scale:{factor, H},
     landmarks:{file, overrides}, skin:{candidates, choice, params, overrides}, scripts:{git_head, dirty},
     steps:[{step, time, params, outputs}]}

Values not known yet are ``null`` and filled by later steps. Times are UTC ISO-8601 strings. Units: metres.
"""
from __future__ import annotations

import os
import subprocess
from datetime import datetime, timezone
from typing import Any, Mapping

from . import SCHEMA, schema
from .npzio import read_json, write_json

SCRIPTS_REL = ".agents/skills/blender-mcp-rigging/scripts"  # git path whose cleanliness the stamp reports
_IGNORED = ("__pycache__", ".pyc", ".pytest_cache")  # generated files never count as "dirty"


def default_repo_root() -> str:
    """The repository root two levels above the skill: ``<repo>/.agents/skills/blender-mcp-rigging/scripts/rigcore/recipe.py``."""
    here = os.path.dirname(os.path.abspath(__file__))
    return os.path.normpath(os.path.join(here, "..", "..", "..", "..", ".."))


def now_iso() -> str:
    """Current UTC time, ``2026-10-23T01:02:03+00:00``."""
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _git(repo: str, *args: str, timeout: float) -> str | None:
    """stdout of ``git -C repo args`` or None when git is missing / fails. Uses no optional locks, so it never blocks other threads
    working in the same checkout."""
    env = dict(os.environ)
    env["GIT_OPTIONAL_LOCKS"] = "0"
    kw: dict[str, Any] = {}
    if os.name == "nt":
        kw["creationflags"] = getattr(subprocess, "CREATE_NO_WINDOW", 0)
    try:
        r = subprocess.run(["git", "-C", repo, *args], capture_output=True, timeout=timeout, env=env, **kw)
    except (OSError, subprocess.SubprocessError):
        return None
    if r.returncode != 0:
        return None
    return r.stdout.decode("utf-8", "replace")


def script_stamp(repo_root: str | None = None, timeout: float = 20.0) -> dict:
    """``{"git_head": <40-hex or None>, "dirty": <bool or None>}``: HEAD of the repository and whether anything under
    ``.agents/skills/blender-mcp-rigging/scripts`` differs from it (modified, staged or untracked files; ``__pycache__`` and
    ``.pytest_cache`` are ignored). Both are None when git is not available or ``repo_root`` is not a repository."""
    repo = os.fspath(repo_root) if repo_root else default_repo_root()
    head = _git(repo, "rev-parse", "HEAD", timeout=timeout)
    if head is None:
        return {"git_head": None, "dirty": None}
    head = head.strip() or None
    st = _git(repo, "status", "--porcelain", "--untracked-files=all", "--", SCRIPTS_REL, timeout=timeout)
    if st is None:
        return {"git_head": head, "dirty": None}
    lines = [ln for ln in st.splitlines() if ln.strip() and not any(tok in ln for tok in _IGNORED)]
    return {"git_head": head, "dirty": bool(lines)}


def new_recipe(asset_id: str, glb: str | None = None, sha256: str | None = None, family: str | None = None,
               template: Mapping | None = None, factor: float | None = None, H: float | None = None,
               stamp: bool = True, repo_root: str | None = None) -> dict:
    """A fresh recipe. ``template`` is ``template.template_info(family)`` (only path / version / sha256 are kept) or None.
    ``stamp`` fills ``scripts`` from ``script_stamp(repo_root)``; with ``stamp=False`` it is ``{git_head: null, dirty: null}``."""
    tpl = None
    if template is not None:
        tpl = {k: template.get(k) for k in ("path", "version", "sha256")}
    rec = {
        "schema": SCHEMA,
        "asset_id": asset_id,
        "input": {"glb": glb, "sha256": sha256},
        "family": family,
        "template": tpl,
        "scale": {"factor": factor, "H": None if H is None else float(H)},
        "landmarks": {"file": None, "overrides": {}},
        "skin": {"candidates": [], "choice": {}, "params": {}, "overrides": {}},
        "scripts": script_stamp(repo_root) if stamp else {"git_head": None, "dirty": None},
        "steps": [],
    }
    return schema.validate_recipe(rec)


def stamp_scripts(recipe: dict, repo_root: str | None = None) -> dict:
    """Refresh ``recipe["scripts"]`` from git (call before saving when the scripts may have changed). Returns the stamp."""
    recipe["scripts"] = script_stamp(repo_root)
    return recipe["scripts"]


def log_step(recipe: dict, step: str, params: Mapping | None = None, outputs: Mapping | list | None = None,
             time: str | None = None) -> dict:
    """Append ``{step, time, params, outputs}`` to ``recipe["steps"]`` (``time`` defaults to now, UTC) and return the entry.
    ``step`` is the pipeline label (``"S2"``, ``"S3.consensus"`` ...); ``outputs`` lists the files / numbers the step produced."""
    if not isinstance(step, str) or not step:
        raise ValueError("log_step: step must be a non-empty string")
    if outputs is None:
        outputs = {}
    if not isinstance(outputs, (Mapping, list)):
        raise ValueError("log_step: outputs must be a dict or a list")
    entry = {"step": step, "time": time or now_iso(), "params": dict(params or {}), "outputs": outputs}
    recipe.setdefault("steps", []).append(entry)
    return entry


def load_recipe(path) -> dict:
    """Read + validate ``rig_recipe.json``."""
    return schema.validate_recipe(read_json(path))


def save_recipe(path, recipe: Mapping) -> str:
    """Validate and write ``rig_recipe.json`` (atomic, UTF-8, LF)."""
    schema.validate_recipe(recipe)
    return write_json(path, recipe)
