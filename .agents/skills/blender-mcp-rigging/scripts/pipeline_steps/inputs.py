r"""pipeline_steps.inputs - input fingerprints of the pipeline steps (I5, review M3): a resume never reuses the outputs of a step
whose inputs or code changed since it ran.

Per step (``steps.step_inputs`` builds it before the step runs; the state keeps it in ``steps.<Sx>.inputs``, the recipe in the
``pipeline.<Sx>`` entry)::

    {"args": {...}, "files": {label: sha256 | None | "generic"}, "scripts": {rel path: sha256}, "code": sha256}

* ``args``: the command-line arguments the step depends on (``--prebend``, ``--requires-fingers``, ``--render-what``, the UniRig
  output path, ...). ``--test-auto-vision`` and ``--keep-going`` are not inputs: what they did stays marked TEST ONLY in the state
  until the step that used them re-runs without them.
* ``files``: sha256 of the input files (GLB, UniRig output, skin rules, vision decisions, override files, family JSONs).
* ``scripts``: sha256 of every script the step runs: the module CLIs it calls and the modules it imports in the driver process
  (``steps.STEP_SCRIPTS``), closed over their in-tree imports (``ast``: ``import a.b``, ``from a import b``, relative imports of
  the packages ``rigcore``, ``rigkit``, ``solvers``, ``pipeline_steps``) and over in-tree file names quoted in their source
  (``"thresholds.json"``, skin_io's ``"skin_common.py"``).
* ``code``: sha256 of the driver code of the step: the step function and every function, class or constant of ``steps`` /
  ``report`` it references by name (recursively). Driver plumbing (``pipeline.py``, ``runner.Ctx``) is not a step input.

``diff(old, new)`` lists what changed as readable strings (empty = the step is up to date).
"""
from __future__ import annotations

import ast
import hashlib
import inspect
import json
import os
import re
import types

from pipeline_steps.runner import SCRIPTS, sha256_file

PACKAGES = ("rigcore", "rigkit", "solvers", "pipeline_steps")
_QUOTED = re.compile(r"""["']([A-Za-z0-9_]+\.(?:py|json))["']""")


def _rel(path: str) -> str:
    return os.path.relpath(path, SCRIPTS).replace("\\", "/")


def _exists_exact(path: str) -> bool:
    """``os.path.isfile`` with the exact case of the last part (Windows: ``rigcore.SCHEMA`` is a constant, not schema.py)."""
    d, f = os.path.split(path)
    try:
        return f in os.listdir(d) and os.path.isfile(path)
    except OSError:
        return False


def _module_file(mod: str) -> str | None:
    """``rigcore.npzio`` -> <scripts>/rigcore/npzio.py; ``rigcore`` -> <scripts>/rigcore/__init__.py; None outside the tree."""
    parts = mod.split(".")
    if not parts or parts[0] not in PACKAGES:
        return None
    base = os.path.join(SCRIPTS, *parts)
    if _exists_exact(base + ".py"):
        return base + ".py"
    if os.path.isdir(base) and _exists_exact(os.path.join(base, "__init__.py")):
        return os.path.join(base, "__init__.py")
    return None


def _tree_files_by_name() -> dict:
    out: dict = {}
    for pkg in PACKAGES:
        d = os.path.join(SCRIPTS, pkg)
        for f in sorted(os.listdir(d)) if os.path.isdir(d) else []:
            if f.endswith((".py", ".json")):
                out.setdefault(f, []).append(os.path.join(d, f))
    return out


_DEPS_CACHE: dict = {}


def _deps(path: str, by_name: dict) -> set:
    """In-tree files that ``path`` imports (any import statement, also inside functions) or names in a string literal (cached per
    file version)."""
    st = os.stat(path)
    key = (os.path.normcase(path), st.st_mtime_ns, st.st_size)
    if key not in _DEPS_CACHE:
        _DEPS_CACHE[key] = _deps_uncached(path, by_name)
    return set(_DEPS_CACHE[key])


def _deps_uncached(path: str, by_name: dict) -> set:
    with open(path, encoding="utf-8") as f:
        src = f.read()
    out = set()
    if path.endswith(".py"):
        rel = _rel(path)
        pkg = rel.split("/")[0] if "/" in rel else ""
        mods = set()
        for node in ast.walk(ast.parse(src, filename=path)):
            if isinstance(node, ast.Import):
                mods.update(a.name for a in node.names)
            elif isinstance(node, ast.ImportFrom):
                base = node.module or ""
                if node.level:  # relative: rigcore's own modules
                    base = pkg + ("." + base if base else "")
                mods.add(base)
                mods.update(f"{base}.{a.name}" for a in node.names)
        for m in mods:
            parts = m.split(".")
            for i in range(1, len(parts) + 1):  # the package __init__ runs too
                p = _module_file(".".join(parts[:i]))
                if p:
                    out.add(p)
        for name in _QUOTED.findall(src):
            hits = by_name.get(name) or []
            if len(hits) == 1 and os.path.normcase(hits[0]) != os.path.normcase(path):
                out.add(hits[0])
    return out


def scripts_closure(entries) -> dict:
    """{rel path: sha256} of ``entries`` (paths relative to scripts/) and every in-tree file they depend on (module docstring)."""
    by_name = _tree_files_by_name()
    todo = [os.path.join(SCRIPTS, *e.split("/")) for e in entries]
    seen: set = set()
    while todo:
        p = os.path.normpath(todo.pop())
        if p in seen:
            continue
        seen.add(p)
        if os.path.isfile(p):
            todo.extend(os.path.normpath(d) for d in _deps(p, by_name))
    return {_rel(p): sha256_file(p) for p in sorted(seen, key=_rel)}  # a missing entry stays listed with None


def _code_names(code: types.CodeType, acc: set):
    acc.update(code.co_names)
    for k in code.co_consts:
        if isinstance(k, types.CodeType):
            _code_names(k, acc)


def _plain(v):
    """JSON text of a plain constant with the skill / repository paths written as ``<skill>`` / ``<repo>`` (the fingerprint must
    not depend on where the tree lives), or None for anything that is not plain data (functions, objects)."""
    try:
        s = json.dumps(v, sort_keys=True)
    except (TypeError, ValueError):
        return None
    skill = os.path.dirname(SCRIPTS)
    repo = os.path.normpath(os.path.join(skill, "..", "..", ".."))
    for path, tag in ((skill, "<skill>"), (repo, "<repo>")):
        s = s.replace(json.dumps(path)[1:-1], tag)
    return s


def code_sha(func, modules) -> str:
    """sha256 over the source of ``func`` and of every function, class or upper-case plain constant defined in ``modules`` that it
    references by name, recursively."""
    pool: dict = {}
    for m in modules:
        for k, v in vars(m).items():
            own = getattr(v, "__module__", None) == m.__name__
            if (inspect.isfunction(v) or inspect.isclass(v)) and own:
                pool.setdefault(k, []).append(v)
            elif k.isupper() and _plain(v) is not None:
                pool.setdefault(k, []).append(v)
    parts, seen, todo = {}, set(), [(func.__name__, func)]
    while todo:
        name, obj = todo.pop()
        key = f"{getattr(obj, '__module__', '')}.{name}"
        if key in seen:
            continue
        seen.add(key)
        names: set = set()
        if inspect.isfunction(obj):
            parts[key] = inspect.getsource(obj)
            _code_names(obj.__code__, names)
        elif inspect.isclass(obj):
            parts[key] = inspect.getsource(obj)
            for v in vars(obj).values():
                if inspect.isfunction(v):
                    _code_names(v.__code__, names)
        else:
            parts[key] = _plain(obj)
        for n in names:
            for v in pool.get(n, []):
                todo.append((n, v))
    h = hashlib.sha256()
    for k in sorted(parts):
        h.update(k.encode("utf-8") + b"\0" + parts[k].encode("utf-8") + b"\0")
    return h.hexdigest()


def digest(fp: dict) -> str:
    return hashlib.sha256(json.dumps(fp, sort_keys=True, default=str).encode("utf-8")).hexdigest()


def _short(v):
    if isinstance(v, str) and re.fullmatch(r"[0-9a-f]{64}", v):
        return v[:12]
    s = json.dumps(v, default=str) if not isinstance(v, str) else v
    return s if len(s) <= 120 else s[:117] + "..."


def diff(old: dict | None, new: dict) -> list:
    """What changed between the recorded fingerprint ``old`` and the current ``new`` (readable strings; empty = up to date)."""
    if not old:
        return ["no input fingerprint recorded (pipeline_state.json written by a driver before I5)"]
    out = []
    for part in ("args", "files"):
        a, b = old.get(part) or {}, new.get(part) or {}
        for k in sorted(set(a) | set(b)):
            if a.get(k) != b.get(k):
                out.append(f"{part}.{k}: {_short(a.get(k))} -> {_short(b.get(k))}")
    a, b = old.get("scripts") or {}, new.get("scripts") or {}
    for k in sorted(set(a) | set(b)):
        if k not in a:
            out.append(f"script {k}: new")
        elif k not in b:
            out.append(f"script {k}: no longer used")
        elif a[k] != b[k]:
            out.append(f"script {k}: changed ({_short(a[k])} -> {_short(b[k])})")
    if old.get("code") != new.get("code"):
        out.append("driver code of the step changed (pipeline_steps/steps.py or report.py)")
    return out
