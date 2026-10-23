"""rigcore.npzio - save/load of mesh.npz, weights.npz, poses.npz (contract dtypes, validated both ways) and atomic JSON io.

Storage: ``np.savez_compressed`` without pickles. ``meta`` is a 0-d numpy unicode array holding a JSON object (keys sorted); string
arrays are numpy unicode. Every ``save_*`` validates and coerces to the contract dtypes first, writes ``<path>.tmp<pid>`` and
renames it over ``path`` (retrying on Windows file locks), so a reader never sees half a file. Every ``load_*`` validates what it read.

Arrays that the contract does not list can be carried in ``extra`` (dict name -> array); they come back in ``extra`` on load.
Loaded dicts always contain every contract key; absent optional arrays are ``None``.

Units: metres.  Frame: Blender, Z up, front -Y, left +X.
"""
from __future__ import annotations

import json
import os
import time
from typing import Any, Callable, Mapping

import numpy as np

from . import SCHEMA, schema
from .schema import json_default

# --------------------------------------------------------------------------------------------------------------------------
# atomic writes
# --------------------------------------------------------------------------------------------------------------------------


def _atomic_write(path, write: Callable[[Any], None], retries: int = 12) -> str:
    """Write through ``write(fileobj)`` to a temp file next to ``path``, then os.replace. Retries on OSError (Windows scanners and
    indexers lock fresh files for a moment)."""
    path = os.fspath(path)
    parent = os.path.dirname(os.path.abspath(path))
    os.makedirs(parent, exist_ok=True)
    tmp = f"{path}.tmp{os.getpid()}"
    last: OSError | None = None
    for attempt in range(retries):
        try:
            with open(tmp, "wb") as f:
                write(f)
            os.replace(tmp, path)
            return path
        except OSError as e:
            last = e
            time.sleep(min(0.1 * (attempt + 1), 1.0))
    try:
        os.remove(tmp)
    except OSError:
        pass
    assert last is not None
    raise last


def write_json(path, obj: Any, indent: int | None = 2) -> str:
    """Atomic UTF-8 JSON write with LF newlines; NaN/inf are rejected; numpy scalars/arrays are converted."""
    text = json.dumps(obj, indent=indent, ensure_ascii=False, default=json_default, allow_nan=False) + "\n"
    data = text.encode("utf-8")
    return _atomic_write(path, lambda f: f.write(data))


def read_json(path) -> Any:
    with open(os.fspath(path), "rb") as f:
        return json.loads(f.read().decode("utf-8"))


# --------------------------------------------------------------------------------------------------------------------------
# generic npz
# --------------------------------------------------------------------------------------------------------------------------


def _meta_array(meta: Mapping) -> np.ndarray:
    return np.array(json.dumps(meta, sort_keys=True, ensure_ascii=False, default=json_default, allow_nan=False))


def _write_npz(path, arrays: Mapping[str, np.ndarray]) -> str:
    return _atomic_write(path, lambda f: np.savez_compressed(f, **arrays))


def _read_npz(path) -> dict:
    with np.load(os.fspath(path), allow_pickle=False) as z:
        return {k: z[k] for k in z.files}


def _pack(kind: str, v: Mapping[str, Any], specs: tuple) -> dict:
    """validated dict -> arrays to store (only present arrays, meta as JSON string, extras by their own names)."""
    out: dict[str, np.ndarray] = {}
    for sp in specs:
        if v[sp.key] is not None:
            out[sp.key] = v[sp.key]
    out["meta"] = _meta_array(v["meta"])
    out.update(v["extra"])
    return out


def _unpack(kind: str, raw: dict, specs: tuple) -> dict:
    keys = {s.key for s in specs}
    d: dict[str, Any] = {k: raw[k] for k in keys if k in raw}
    if "meta" not in raw:
        raise ValueError(f"{kind}: file has no 'meta' array")
    d["meta"] = raw["meta"]
    d["extra"] = {k: a for k, a in raw.items() if k not in keys and k != "meta"}
    return d


# --------------------------------------------------------------------------------------------------------------------------
# mesh.npz
# --------------------------------------------------------------------------------------------------------------------------


def mesh_meta(asset_id: str, H: float, scale_factor: float | None = None, source_sha256: str | None = None, **more) -> dict:
    """Build the ``meta`` dict of mesh.npz: asset_id, H (metres), scale_factor (S2 uniform scale), source_sha256 of the GLB."""
    m = {"asset_id": asset_id, "H": float(H), "scale_factor": scale_factor, "source_sha256": source_sha256, "schema": SCHEMA}
    m.update(more)
    return m


def save_mesh(path, V, F, weld=None, UV=None, mat=None, meta: Mapping | None = None, extra: Mapping | None = None) -> str:
    """Write mesh.npz. ``V`` float (n,3) m; ``F`` int (m,3); ``weld`` int (n,) or None (then computed with ``mesh.weld_map``);
    ``UV`` (n,2) and ``mat`` (m,) optional; ``meta`` must contain asset_id and H (see ``mesh_meta``). Returns ``path``."""
    if weld is None:
        from .mesh import weld_map

        weld = weld_map(V)
    d = {"V": V, "F": F, "weld": weld, "UV": UV, "mat": mat, "meta": dict(meta or {}), "extra": dict(extra or {})}
    d["meta"].setdefault("schema", SCHEMA)
    v = schema.validate_mesh(d)
    return _write_npz(path, _pack("mesh", v, schema.MESH_ARRAYS))


def load_mesh(path) -> dict:
    """Read + validate mesh.npz -> {"V","F","weld","UV"|None,"mat"|None,"meta":dict,"extra":dict}."""
    return schema.validate_mesh(_unpack("mesh", _read_npz(path), schema.MESH_ARRAYS))


# --------------------------------------------------------------------------------------------------------------------------
# weights.npz
# --------------------------------------------------------------------------------------------------------------------------


def save_weights(path, bones, W, locked=None, meta: Mapping | None = None, check_sums: bool = False, deform_mask=None,
                 tol: float = schema.WEIGHT_SUM_TOL, extra: Mapping | None = None) -> str:
    """Write weights.npz: ``bones`` list of k column names, ``W`` float (n,k) dense, ``locked`` bool (n,) optional, ``meta`` with
    ``candidate`` (str) and optional ``params`` (dict). With ``check_sums`` every row selected by ``deform_mask`` (bool (n,), default
    all rows) must sum to 1 within ``tol`` (and be in [0, 1]); see ``schema.check_weight_sums``."""
    d = {"bones": bones, "W": W, "locked": locked, "meta": dict(meta or {}), "extra": dict(extra or {})}
    d["meta"].setdefault("schema", SCHEMA)
    v = schema.validate_weights(d, check_sums=check_sums, tol=tol, deform_mask=deform_mask)
    return _write_npz(path, _pack("weights", v, schema.WEIGHTS_ARRAYS))


def load_weights(path, check_sums: bool = False, deform_mask=None, tol: float = schema.WEIGHT_SUM_TOL) -> dict:
    """Read + validate weights.npz -> {"bones": str array (k,), "W": float32 (n,k), "locked"|None, "meta", "extra"}."""
    return schema.validate_weights(_unpack("weights", _read_npz(path), schema.WEIGHTS_ARRAYS), check_sums=check_sums, tol=tol,
                                   deform_mask=deform_mask)


# --------------------------------------------------------------------------------------------------------------------------
# poses.npz
# --------------------------------------------------------------------------------------------------------------------------


def save_poses(path, names, P, bone_names, heads, tails, meta: Mapping | None = None, extra: Mapping | None = None) -> str:
    """Write poses.npz: ``names`` (p,), ``P`` float (p,n,3) evaluated vertex positions under runtime emulation, ``bone_names`` (b,),
    ``heads``/``tails`` float (p,b,3) bone ends per pose. Metres, Blender frame."""
    d = {"names": names, "P": P, "bone_names": bone_names, "heads": heads, "tails": tails, "meta": dict(meta or {}),
         "extra": dict(extra or {})}
    d["meta"].setdefault("schema", SCHEMA)
    v = schema.validate_poses(d)
    return _write_npz(path, _pack("poses", v, schema.POSES_ARRAYS))


def load_poses(path) -> dict:
    """Read + validate poses.npz -> {"names","P","bone_names","heads","tails","meta","extra"}."""
    return schema.validate_poses(_unpack("poses", _read_npz(path), schema.POSES_ARRAYS))
