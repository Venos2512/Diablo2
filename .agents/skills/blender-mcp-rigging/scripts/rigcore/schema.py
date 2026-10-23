"""rigcore.schema - file kinds, keys, dtypes, shapes and validators (schema 0). Single source of truth for CONTRACT.md "Data formats".

Units: metres.  Frame: Blender, Z up, character front -Y, character left +X.

Two validator families, all raising ``ValueError`` with a message that names the file kind, the key and what was expected:

* array files (mesh / weights / poses): ``validate_mesh(d)`` etc. take a dict of arrays + ``meta`` (dict or JSON string), COERCE every
  array to the contract dtype and return a NEW normalized dict ``{key: ndarray, ..., "meta": dict, "extra": dict}``.
  Optional arrays that are absent come back as ``None``.
* JSON files (landmarks / skeleton / recipe / analysis / metrics): ``validate_landmarks(doc)`` etc. check the document and return it
  unchanged (extra keys are allowed so that later schema revisions stay readable).

``validate(kind, obj)`` dispatches on the kind name.
"""
from __future__ import annotations

import json
import math
from typing import Any, Mapping, NamedTuple

import numpy as np

from . import SCHEMA

# --------------------------------------------------------------------------------------------------------------------------
# constants
# --------------------------------------------------------------------------------------------------------------------------

#: file kinds in contract order
FILE_KINDS = ("mesh", "weights", "poses", "landmarks", "skeleton", "recipe", "analysis", "metrics")

#: canonical file name per kind (CONTRACT.md)
FILE_NAMES = {
    "mesh": "mesh.npz",
    "weights": "weights.npz",
    "poses": "poses.npz",
    "landmarks": "landmarks.json",
    "skeleton": "skeleton.json",
    "recipe": "rig_recipe.json",
    "analysis": "analysis.json",
    "metrics": "metrics.json",
}

BONE_KINDS = ("core", "twist", "aux", "socket")
LANDMARK_SOURCES = ("a", "b", "c", "d", "e")  # joint-placement.md: a geometry, b proxy, c prior, d UniRig, e user
LIGHTS = ("green", "yellow", "red")
SIDES = ("L", "R")
MIN_BONE_LENGTH = 1e-6  # m; shorter bones are rejected everywhere
WEIGHT_SUM_TOL = 1e-4  # rows of deforming vertices sum to 1 within this
HINGE_UNIT_TOL = 1e-6

#: per-region metric keys of metrics.json (poses -> pose -> region -> these); ``penetration`` is {"n_tris", "max_depth"}
METRIC_KEYS = (
    "stretch_max",
    "stretch_p99",
    "n_over_1_25",
    "n_over_1_5",
    "area_change_max",
    "volume_ratio",
    "penetration",
    "seam_crack_max",
)
PENETRATION_KEYS = ("n_tris", "max_depth")


#: required top-level keys of the JSON kinds (validators check these first; per-key types are checked by the validators)
LANDMARKS_REQUIRED = ("schema", "asset_id", "family", "H", "landmarks")
LANDMARK_ENTRY_REQUIRED = ("pos",)
LANDMARK_ENTRY_OPTIONAL = ("sources", "spread", "decision", "confidence", "flagged")
SKELETON_REQUIRED = ("schema", "family", "template_version", "H", "bones", "ik", "rom", "rom_compound", "skin")
BONE_REQUIRED = ("name", "parent", "kind", "deform", "head", "tail", "hinge")
BONE_OPTIONAL = ("bend_test", "twist", "side", "note")
RECIPE_REQUIRED = ("schema", "asset_id", "input", "family", "template", "scale", "landmarks", "skin", "scripts", "steps")
STEP_REQUIRED = ("step", "time", "params", "outputs")
ANALYSIS_REQUIRED = ("schema", "asset_id")
METRICS_REQUIRED = ("schema", "asset_id", "poses", "joints", "summary", "lights")


class ArraySpec(NamedTuple):
    """One array of an npz file. ``dims`` entries are ints (fixed) or str (symbolic, must agree across arrays of one file)."""

    key: str
    dtype: str  # numpy dtype name, or "str" for numpy unicode
    dims: tuple
    required: bool


MESH_ARRAYS = (
    ArraySpec("V", "float64", ("n", 3), True),  # object-space positions after S2, metres
    ArraySpec("F", "int32", ("m", 3), True),  # triangles (original vertex ids)
    ArraySpec("weld", "int32", ("n",), True),  # welded id per vertex (contiguous 0..n_welded-1)
    ArraySpec("UV", "float32", ("n", 2), False),
    ArraySpec("mat", "int16", ("m",), False),  # material index per triangle
)
MESH_META_REQUIRED = ("asset_id", "H")  # also expected (optional): scale_factor, source_sha256

WEIGHTS_ARRAYS = (
    ArraySpec("bones", "str", ("k",), True),  # column names
    ArraySpec("W", "float32", ("n", "k"), True),  # dense; rows of deforming vertices sum to 1
    ArraySpec("locked", "bool", ("n",), False),  # rigid / override vertices
)
WEIGHTS_META_REQUIRED = ("candidate",)  # also expected (optional): params

POSES_ARRAYS = (
    ArraySpec("names", "str", ("p",), True),
    ArraySpec("P", "float32", ("p", "n", 3), True),  # evaluated positions under runtime emulation, metres
    ArraySpec("bone_names", "str", ("b",), True),
    ArraySpec("heads", "float32", ("p", "b", 3), True),
    ArraySpec("tails", "float32", ("p", "b", 3), True),
)
POSES_META_REQUIRED = ()

ARRAY_FILES = {
    "mesh": (MESH_ARRAYS, MESH_META_REQUIRED),
    "weights": (WEIGHTS_ARRAYS, WEIGHTS_META_REQUIRED),
    "poses": (POSES_ARRAYS, POSES_META_REQUIRED),
}


# --------------------------------------------------------------------------------------------------------------------------
# small predicates / helpers
# --------------------------------------------------------------------------------------------------------------------------

def is_num(x: Any) -> bool:
    """True for a finite real number (int/float, numpy scalars included, bool excluded)."""
    if isinstance(x, (bool, np.bool_)):
        return False
    if isinstance(x, (int, float, np.integer, np.floating)):
        return math.isfinite(float(x))
    return False


def is_vec3(x: Any) -> bool:
    try:
        return len(x) == 3 and all(is_num(c) for c in x)
    except TypeError:
        return False


def _fmt_dims(dims: tuple) -> str:
    return "(" + ", ".join(str(d) for d in dims) + ("," if len(dims) == 1 else "") + ")"


def json_default(o: Any) -> Any:
    """``json.dumps(default=...)``: numpy scalars / arrays and sets become plain JSON values."""
    if isinstance(o, np.generic):
        return o.item()
    if isinstance(o, np.ndarray):
        return o.tolist()
    if isinstance(o, (set, frozenset)):
        return sorted(o)
    raise TypeError(f"object of type {type(o).__name__} is not JSON serializable")


def _coerce(kind: str, key: str, value: Any, dtype: str) -> np.ndarray:
    """Coerce ``value`` to the contract dtype or raise ValueError. Floats must be finite; integers must be integral and fit."""
    where = f"{kind}: key {key!r}"
    try:
        a = np.asarray(value)
    except Exception as e:  # ragged lists and the like
        raise ValueError(f"{where}: cannot convert to an array ({e})") from None
    if dtype == "str":
        if a.dtype.kind == "U":
            return np.ascontiguousarray(a)
        if a.dtype.kind in "OS":
            items = a.ravel().tolist()
            out = []
            for it in items:
                if isinstance(it, bytes):
                    it = it.decode("utf-8")
                if not isinstance(it, str):
                    raise ValueError(f"{where}: expected strings, found {type(it).__name__}")
                out.append(it)
            return np.asarray(out, dtype=str).reshape(a.shape)
        if a.size == 0:
            return np.zeros(a.shape, dtype=str)
        raise ValueError(f"{where}: expected a string array, got dtype {a.dtype}")
    target = np.dtype(dtype)
    if target.kind == "f":
        if a.dtype.kind not in "fiu":
            raise ValueError(f"{where}: expected a real numeric array ({dtype}), got dtype {a.dtype}")
        out = a.astype(target)
        if out.size and not np.isfinite(out).all():
            raise ValueError(f"{where}: contains NaN or inf")
        return np.ascontiguousarray(out)
    if target.kind == "i":
        if a.dtype.kind not in "iu":
            raise ValueError(f"{where}: expected an integer array ({dtype}), got dtype {a.dtype}")
        out = a.astype(target)
        if a.size and not np.array_equal(out, a):
            raise ValueError(f"{where}: values do not fit {dtype}")
        return np.ascontiguousarray(out)
    if target.kind == "b":
        if a.dtype.kind != "b":
            raise ValueError(f"{where}: expected a bool array, got dtype {a.dtype}")
        return np.ascontiguousarray(a)
    raise ValueError(f"{where}: unsupported contract dtype {dtype!r}")  # pragma: no cover


def coerce_arrays(kind: str, specs: tuple, data: Mapping[str, Any]) -> tuple[dict, dict]:
    """Coerce + shape-check the arrays of one npz kind. Returns (arrays, dims) with absent optional arrays set to None and
    ``dims`` the bound symbolic dimensions (``{"n": 6505, "m": 10668}``)."""
    dims: dict[str, int] = {}
    origin: dict[str, str] = {}
    out: dict[str, Any] = {}
    for sp in specs:
        v = data.get(sp.key)
        if v is None:
            if sp.required:
                raise ValueError(f"{kind}: missing required key {sp.key!r}")
            out[sp.key] = None
            continue
        a = _coerce(kind, sp.key, v, sp.dtype)
        if a.ndim != len(sp.dims):
            raise ValueError(f"{kind}: key {sp.key!r}: expected shape {_fmt_dims(sp.dims)}, got {tuple(a.shape)}")
        for want, got in zip(sp.dims, a.shape):
            if isinstance(want, int):
                if got != want:
                    raise ValueError(f"{kind}: key {sp.key!r}: expected shape {_fmt_dims(sp.dims)}, got {tuple(a.shape)}")
            elif want in dims:
                if dims[want] != got:
                    raise ValueError(
                        f"{kind}: key {sp.key!r}: dimension {want!r} is {got} but {dims[want]} in {origin[want]!r} "
                        f"(shape {tuple(a.shape)}, expected {_fmt_dims(sp.dims)})"
                    )
            else:
                dims[want] = int(got)
                origin[want] = sp.key
        out[sp.key] = a
    return out, dims


def normalize_meta(kind: str, meta: Any, required: tuple = (), fill_schema: bool = False) -> dict:
    """``meta`` as stored in npz: a JSON string (or 0-d string array) or a dict. Returns a dict with ``schema`` == SCHEMA."""
    if meta is None:
        meta = {}
    if isinstance(meta, np.ndarray):
        if meta.ndim != 0:
            raise ValueError(f"{kind}: meta must be a 0-d string array, got shape {tuple(meta.shape)}")
        meta = meta[()]
    if isinstance(meta, bytes):
        meta = meta.decode("utf-8")
    if isinstance(meta, str):
        try:
            meta = json.loads(meta)
        except ValueError as e:
            raise ValueError(f"{kind}: meta is not valid JSON ({e})") from None
    if not isinstance(meta, Mapping):
        raise ValueError(f"{kind}: meta must be a dict or a JSON object string, got {type(meta).__name__}")
    meta = dict(meta)
    if fill_schema:
        meta.setdefault("schema", SCHEMA)
    if "schema" not in meta:
        raise ValueError(f"{kind}: meta has no 'schema' key (this build reads schema {SCHEMA})")
    if meta["schema"] != SCHEMA:
        raise ValueError(f"{kind}: meta.schema is {meta['schema']!r}, this build reads schema {SCHEMA}")
    for k in required:
        if k not in meta or meta[k] is None:
            raise ValueError(f"{kind}: meta is missing required key {k!r}")
    return meta


def _split_extra(kind: str, d: Mapping[str, Any], specs: tuple) -> dict:
    extra = d.get("extra")
    if extra is None:
        return {}
    if not isinstance(extra, Mapping):
        raise ValueError(f"{kind}: 'extra' must be a dict of arrays")
    known = {s.key for s in specs} | {"meta", "extra", "file"}  # "file" is the first parameter name of np.savez
    out = {}
    for k, v in extra.items():
        if not isinstance(k, str) or not k:
            raise ValueError(f"{kind}: extra array name must be a non-empty string, got {k!r}")
        if k in known:
            raise ValueError(f"{kind}: extra array {k!r} clashes with a contract key")
        a = np.asarray(v)
        if a.dtype.kind == "O":
            raise ValueError(f"{kind}: extra array {k!r} has object dtype (pickles are not allowed)")
        out[k] = a
    return out


# --------------------------------------------------------------------------------------------------------------------------
# array files
# --------------------------------------------------------------------------------------------------------------------------

def validate_mesh(d: Mapping[str, Any]) -> dict:
    """mesh.npz: V float64 (n,3), F int32 (m,3), weld int32 (n,), UV float32 (n,2)?, mat int16 (m,)?, meta."""
    arr, dims = coerce_arrays("mesh", MESH_ARRAYS, d)
    n, m = dims["n"], dims["m"]
    F, weld = arr["F"], arr["weld"]
    if m and (F.min() < 0 or F.max() >= n):
        bad = int(np.argmax((F < 0).any(1) | (F >= n).any(1)))
        raise ValueError(f"mesh: F has vertex ids outside [0, {n}) (first bad triangle {bad}: {F[bad].tolist()})")
    if n:
        if weld.min() < 0 or weld.max() >= n:
            raise ValueError(f"mesh: weld ids must lie in [0, {n}), got range [{int(weld.min())}, {int(weld.max())}]")
        n_w = int(weld.max()) + 1
        if np.unique(weld).size != n_w:
            raise ValueError(f"mesh: weld ids are not contiguous 0..{n_w - 1} ({np.unique(weld).size} distinct ids)")
    meta = normalize_meta("mesh", d.get("meta"), MESH_META_REQUIRED)
    if not isinstance(meta["asset_id"], str) or not meta["asset_id"]:
        raise ValueError("mesh: meta.asset_id must be a non-empty string")
    if not is_num(meta["H"]) or meta["H"] <= 0:
        raise ValueError(f"mesh: meta.H must be a positive number (metres), got {meta['H']!r}")
    for k in ("scale_factor",):
        if meta.get(k) is not None and (not is_num(meta[k]) or meta[k] <= 0):
            raise ValueError(f"mesh: meta.{k} must be a positive number, got {meta[k]!r}")
    if meta.get("source_sha256") is not None and not isinstance(meta["source_sha256"], str):
        raise ValueError("mesh: meta.source_sha256 must be a string")
    out = dict(arr)
    out["meta"] = meta
    out["extra"] = _split_extra("mesh", d, MESH_ARRAYS)
    return out


def validate_weights(d: Mapping[str, Any], check_sums: bool = False, tol: float = WEIGHT_SUM_TOL, deform_mask: Any = None) -> dict:
    """weights.npz: bones str (k,), W float32 (n,k), locked bool (n,)?, meta (candidate, params). With ``check_sums`` also runs
    ``check_weight_sums(W, tol, deform_mask)``."""
    arr, dims = coerce_arrays("weights", WEIGHTS_ARRAYS, d)
    bones = arr["bones"]
    if bones.size == 0:
        raise ValueError("weights: 'bones' is empty")
    if any(not b for b in bones.tolist()):
        raise ValueError("weights: 'bones' contains an empty name")
    if len(set(bones.tolist())) != bones.size:
        dup = sorted({b for b in bones.tolist() if bones.tolist().count(b) > 1})
        raise ValueError(f"weights: duplicate bone names in 'bones': {dup}")
    meta = normalize_meta("weights", d.get("meta"), WEIGHTS_META_REQUIRED)
    if not isinstance(meta["candidate"], str) or not meta["candidate"]:
        raise ValueError("weights: meta.candidate must be a non-empty string")
    if meta.get("params") is not None and not isinstance(meta["params"], Mapping):
        raise ValueError("weights: meta.params must be an object")
    if check_sums:
        check_weight_sums(arr["W"], tol=tol, deform_mask=deform_mask)
    out = dict(arr)
    out["meta"] = meta
    out["extra"] = _split_extra("weights", d, WEIGHTS_ARRAYS)
    return out


def check_weight_sums(W: Any, tol: float = WEIGHT_SUM_TOL, deform_mask: Any = None, neg_tol: float = 1e-6) -> float:
    """Raise ValueError unless every row of ``W`` selected by ``deform_mask`` (bool (n,), default all rows) sums to 1 within ``tol``,
    has no weight below ``-neg_tol`` and none above ``1 + tol``. Returns the largest sum error. An all-zero row is an error
    (a deforming vertex without weights); exclude non-deforming vertices with the mask."""
    W = np.asarray(W)
    if W.ndim != 2:
        raise ValueError(f"weights: W must be 2-D, got shape {tuple(W.shape)}")
    n = W.shape[0]
    if deform_mask is None:
        mask = np.ones(n, dtype=bool)
    else:
        mask = np.asarray(deform_mask)
        if mask.dtype != bool or mask.shape != (n,):
            raise ValueError(f"weights: deform_mask must be bool with shape ({n},), got {mask.dtype} {tuple(mask.shape)}")
    if not mask.any():
        return 0.0
    Wm = W[mask].astype(np.float64)
    err = np.abs(Wm.sum(axis=1) - 1.0)
    ids = np.flatnonzero(mask)
    bad = err > tol
    if bad.any():
        j = int(np.argmax(err))
        raise ValueError(
            f"weights: {int(bad.sum())} of {int(mask.sum())} deforming rows do not sum to 1 within {tol:g} "
            f"(worst: vertex {int(ids[j])} sums to {float(Wm[j].sum()):.6f}; first bad vertices {ids[bad][:5].tolist()})"
        )
    if Wm.min() < -neg_tol:
        j = np.unravel_index(int(np.argmin(Wm)), Wm.shape)
        raise ValueError(f"weights: negative weight {float(Wm[j]):.3g} at vertex {int(ids[j[0]])}, column {int(j[1])}")
    if Wm.max() > 1.0 + tol:
        j = np.unravel_index(int(np.argmax(Wm)), Wm.shape)
        raise ValueError(f"weights: weight {float(Wm[j]):.6f} > 1 at vertex {int(ids[j[0]])}, column {int(j[1])}")
    return float(err.max())


def validate_poses(d: Mapping[str, Any]) -> dict:
    """poses.npz: names str (p,), P float32 (p,n,3), bone_names str (b,), heads/tails float32 (p,b,3), meta."""
    arr, dims = coerce_arrays("poses", POSES_ARRAYS, d)
    for key in ("names", "bone_names"):
        lst = arr[key].tolist()
        if len(set(lst)) != len(lst):
            dup = sorted({x for x in lst if lst.count(x) > 1})
            raise ValueError(f"poses: duplicate entries in {key!r}: {dup}")
    meta = normalize_meta("poses", d.get("meta"), POSES_META_REQUIRED)
    out = dict(arr)
    out["meta"] = meta
    out["extra"] = _split_extra("poses", d, POSES_ARRAYS)
    return out


def check_consistency(mesh: Mapping | None = None, weights: Mapping | None = None, poses: Mapping | None = None) -> None:
    """Cross-file check of loaded dicts: the vertex count n must agree between mesh V, weights W and poses P."""
    ns = {}
    if mesh is not None:
        ns["mesh.V"] = mesh["V"].shape[0]
    if weights is not None:
        ns["weights.W"] = weights["W"].shape[0]
    if poses is not None:
        ns["poses.P"] = poses["P"].shape[1]
    if len(set(ns.values())) > 1:
        raise ValueError("vertex count mismatch between files: " + ", ".join(f"{k}={v}" for k, v in ns.items()))


# --------------------------------------------------------------------------------------------------------------------------
# JSON files
# --------------------------------------------------------------------------------------------------------------------------

def _need(doc: Any, key: str, where: str, pred, what: str) -> Any:
    if not isinstance(doc, Mapping):
        raise ValueError(f"{where}: expected an object, got {type(doc).__name__}")
    if key not in doc:
        raise ValueError(f"{where}: missing required key {key!r}")
    v = doc[key]
    if not pred(v):
        raise ValueError(f"{where}: key {key!r} must be {what}, got {v!r}")
    return v


def _is_str(x): return isinstance(x, str) and bool(x)
def _is_str_or_none(x): return x is None or isinstance(x, str)
def _is_dict(x): return isinstance(x, Mapping)
def _is_list(x): return isinstance(x, list)
def _is_pos(x): return is_num(x) and x > 0
def _is_num_or_none(x): return x is None or is_num(x)


def _require(doc: Any, keys: tuple, where: str) -> None:
    if not isinstance(doc, Mapping):
        raise ValueError(f"{where}: expected an object, got {type(doc).__name__}")
    for k in keys:
        if k not in doc:
            raise ValueError(f"{where}: missing required key {k!r}")


def _check_schema(doc: Any, where: str) -> None:
    v = _need(doc, "schema", where, lambda x: isinstance(x, int) and not isinstance(x, bool), "an integer")
    if v != SCHEMA:
        raise ValueError(f"{where}: schema is {v}, this build reads schema {SCHEMA}")


def validate_landmarks(doc: Any) -> dict:
    """landmarks.json: {schema, asset_id, family, H, landmarks: {id: {pos:[x,y,z], sources?:{a..e:[x,y,z]}, spread?, decision?,
    confidence?, flagged?}}}."""
    w = "landmarks"
    _require(doc, LANDMARKS_REQUIRED, w)
    _check_schema(doc, w)
    _need(doc, "asset_id", w, _is_str, "a non-empty string")
    _need(doc, "family", w, _is_str, "a non-empty string")
    _need(doc, "H", w, _is_pos, "a positive number (metres)")
    lms = _need(doc, "landmarks", w, _is_dict, "an object")
    for lid, e in lms.items():
        ww = f"landmarks: landmark {lid!r}"
        if not isinstance(lid, str) or not lid:
            raise ValueError(f"{w}: landmark ids must be non-empty strings, got {lid!r}")
        _require(e, LANDMARK_ENTRY_REQUIRED, ww)
        _need(e, "pos", ww, is_vec3, "three finite numbers [x, y, z]")
        src = e.get("sources")
        if src is not None:
            if not isinstance(src, Mapping):
                raise ValueError(f"{ww}: 'sources' must be an object")
            for sk, sv in src.items():
                if sk not in LANDMARK_SOURCES:
                    raise ValueError(f"{ww}: unknown source key {sk!r} (allowed {LANDMARK_SOURCES})")
                if not is_vec3(sv):
                    raise ValueError(f"{ww}: source {sk!r} must be [x, y, z], got {sv!r}")
        if e.get("spread") is not None and not is_num(e["spread"]):
            raise ValueError(f"{ww}: 'spread' must be a number, got {e['spread']!r}")
        if e.get("flagged") is not None and not isinstance(e["flagged"], bool):
            raise ValueError(f"{ww}: 'flagged' must be a bool, got {e['flagged']!r}")
        if e.get("decision") is not None and not isinstance(e["decision"], str):
            raise ValueError(f"{ww}: 'decision' must be a string, got {e['decision']!r}")
        c = e.get("confidence")
        if c is not None and not (is_num(c) or isinstance(c, str)):
            raise ValueError(f"{ww}: 'confidence' must be a number or a string, got {c!r}")
    return doc  # type: ignore[return-value]


def validate_skeleton(doc: Any) -> dict:
    """Resolved skeleton: {schema, family, template_version, H, bones:[{name, parent, kind, deform, head, tail, hinge, bend_test,
    twist}], ik, rom, rom_compound, skin}. Bones are parent-before-child, hinge is a unit vector, length >= MIN_BONE_LENGTH."""
    w = "skeleton"
    _require(doc, SKELETON_REQUIRED, w)
    _check_schema(doc, w)
    _need(doc, "family", w, _is_str, "a non-empty string")
    _need(doc, "template_version", w, _is_str, "a non-empty string")
    _need(doc, "H", w, _is_pos, "a positive number (metres)")
    bones = _need(doc, "bones", w, lambda x: isinstance(x, list) and len(x) > 0, "a non-empty list")
    _need(doc, "ik", w, _is_list, "a list")
    _need(doc, "rom", w, _is_list, "a list")
    _need(doc, "rom_compound", w, lambda x: isinstance(x, list) and all(isinstance(s, str) for s in x), "a list of strings")
    _need(doc, "skin", w, _is_dict, "an object")
    names = [b.get("name") if isinstance(b, Mapping) else None for b in bones]
    seen: set[str] = set()
    for i, b in enumerate(bones):
        if not isinstance(b, Mapping):
            raise ValueError(f"{w}: bones[{i}] must be an object")
        nm = _need(b, "name", f"{w}: bones[{i}]", _is_str, "a non-empty string")
        ww = f"{w}: bone {nm!r}"
        _require(b, BONE_REQUIRED, ww)
        if nm in seen:
            raise ValueError(f"{ww}: duplicate bone name")
        parent = _need(b, "parent", ww, _is_str_or_none, "a bone name or null")
        _need(b, "kind", ww, lambda x: x in BONE_KINDS, f"one of {BONE_KINDS}")
        _need(b, "deform", ww, lambda x: isinstance(x, bool), "a bool")
        head = _need(b, "head", ww, is_vec3, "[x, y, z]")
        tail = _need(b, "tail", ww, is_vec3, "[x, y, z]")
        hinge = _need(b, "hinge", ww, is_vec3, "[x, y, z]")
        if parent is not None and parent not in seen:
            where_ = "does not exist" if parent not in names else "comes after the bone (not parent-before-child)"
            raise ValueError(f"{ww}: parent {parent!r} {where_}")
        ln = math.dist(head, tail)
        if ln < MIN_BONE_LENGTH:
            raise ValueError(f"{ww}: zero-length bone ({ln:.3g} m < {MIN_BONE_LENGTH:g} m)")
        hn = math.sqrt(sum(float(c) ** 2 for c in hinge))
        if abs(hn - 1.0) > HINGE_UNIT_TOL:
            raise ValueError(f"{ww}: hinge must be a unit vector, |hinge| = {hn:.6f}")
        bt = b.get("bend_test")
        if bt is not None and not isinstance(bt, str):
            raise ValueError(f"{ww}: bend_test must be a string or null")
        if b.get("side") not in (None, "L", "R"):
            raise ValueError(f"{ww}: side must be null, 'L' or 'R'")
        seen.add(nm)
    for b in bones:
        tw = b.get("twist")
        if tw is None:
            continue
        ww = f"{w}: bone {b['name']!r} twist"
        _need(tw, "driver", ww, lambda x: x in seen, "the name of a bone of this skeleton")
        _need(tw, "axis", ww, lambda x: x in ("X", "Y", "Z"), "'X', 'Y' or 'Z'")
        _need(tw, "factor", ww, is_num, "a number")
    return doc  # type: ignore[return-value]


def validate_recipe(doc: Any) -> dict:
    """rig_recipe.json: {schema, asset_id, input:{glb, sha256}, family, template:{path, version, sha256}|null, scale:{factor, H},
    landmarks:{file, overrides}, skin:{candidates, choice, params, overrides}, scripts:{git_head, dirty}, steps:[{step, time, params,
    outputs}]}. Values that are not known yet (before S2/S3) are null."""
    w = "recipe"
    _require(doc, RECIPE_REQUIRED, w)
    _check_schema(doc, w)
    _need(doc, "asset_id", w, _is_str, "a non-empty string")
    inp = _need(doc, "input", w, _is_dict, "an object")
    _need(inp, "glb", "recipe: input", _is_str_or_none, "a string or null")
    _need(inp, "sha256", "recipe: input", _is_str_or_none, "a string or null")
    _need(doc, "family", w, _is_str_or_none, "a string or null")
    tpl = _need(doc, "template", w, lambda x: x is None or isinstance(x, Mapping), "an object or null")
    if tpl is not None:
        for k in ("path", "version", "sha256"):
            _need(tpl, k, "recipe: template", _is_str_or_none, "a string or null")
    sc = _need(doc, "scale", w, _is_dict, "an object")
    _need(sc, "factor", "recipe: scale", _is_num_or_none, "a number or null")
    _need(sc, "H", "recipe: scale", _is_num_or_none, "a number or null")
    lm = _need(doc, "landmarks", w, _is_dict, "an object")
    _need(lm, "file", "recipe: landmarks", _is_str_or_none, "a string or null")
    _need(lm, "overrides", "recipe: landmarks", _is_dict, "an object")
    sk = _need(doc, "skin", w, _is_dict, "an object")
    _need(sk, "candidates", "recipe: skin", _is_list, "a list")
    for k in ("choice", "params", "overrides"):
        _need(sk, k, "recipe: skin", _is_dict, "an object")
    sr = _need(doc, "scripts", w, _is_dict, "an object")
    _need(sr, "git_head", "recipe: scripts", _is_str_or_none, "a string or null")
    _need(sr, "dirty", "recipe: scripts", lambda x: x is None or isinstance(x, bool), "a bool or null")
    steps = _need(doc, "steps", w, _is_list, "a list")
    for i, s in enumerate(steps):
        ww = f"recipe: steps[{i}]"
        _require(s, STEP_REQUIRED, ww)
        _need(s, "step", ww, _is_str, "a non-empty string")
        _need(s, "time", ww, _is_str, "an ISO-8601 string")
        _need(s, "params", ww, _is_dict, "an object")
        _need(s, "outputs", ww, lambda x: isinstance(x, (Mapping, list)), "an object or a list")
    return doc  # type: ignore[return-value]


def validate_analysis(doc: Any) -> dict:
    """analysis.json (references/mesh-intake.md S1). rigcore only fixes the envelope {schema, asset_id}; the measures are owned by
    solvers/analysis.py. Count fields, when present, must be non-negative integers."""
    w = "analysis"
    _require(doc, ANALYSIS_REQUIRED, w)
    _check_schema(doc, w)
    _need(doc, "asset_id", w, _is_str, "a non-empty string")
    for k in ("n_vertices", "n_welded", "n_triangles", "n_islands"):
        if doc.get(k) is not None:
            _need(doc, k, w, lambda x: isinstance(x, int) and not isinstance(x, bool) and x >= 0, "a non-negative integer")
    return doc  # type: ignore[return-value]


def validate_metrics(doc: Any) -> dict:
    """metrics.json: {schema, asset_id, poses:{pose:{region:{METRIC_KEYS...}}}, joints:{...}, summary:{...}, lights:{metric: color}}.
    Region metrics must carry every key of METRIC_KEYS (number or null; ``penetration`` is {n_tris, max_depth})."""
    w = "metrics"
    _require(doc, METRICS_REQUIRED, w)
    _check_schema(doc, w)
    _need(doc, "asset_id", w, _is_str, "a non-empty string")
    poses = _need(doc, "poses", w, _is_dict, "an object")
    _need(doc, "joints", w, _is_dict, "an object")
    _need(doc, "summary", w, _is_dict, "an object")
    lights = _need(doc, "lights", w, _is_dict, "an object")
    for pname, regions in poses.items():
        if not isinstance(regions, Mapping):
            raise ValueError(f"metrics: poses[{pname!r}] must be an object of regions")
        for rname, m in regions.items():
            ww = f"metrics: poses[{pname!r}][{rname!r}]"
            if not isinstance(m, Mapping):
                raise ValueError(f"{ww} must be an object")
            for k in METRIC_KEYS:
                if k not in m:
                    raise ValueError(f"{ww}: missing metric {k!r}")
                if k == "penetration":
                    pen = m[k]
                    if not isinstance(pen, Mapping) or any(pk not in pen for pk in PENETRATION_KEYS):
                        raise ValueError(f"{ww}: 'penetration' must be an object with {PENETRATION_KEYS}")
                    for pk in PENETRATION_KEYS:
                        if not _is_num_or_none(pen[pk]):
                            raise ValueError(f"{ww}: penetration.{pk} must be a number or null, got {pen[pk]!r}")
                elif not _is_num_or_none(m[k]):
                    raise ValueError(f"{ww}: {k!r} must be a number or null, got {m[k]!r}")
    for k, v in lights.items():
        if v not in LIGHTS:
            raise ValueError(f"metrics: lights[{k!r}] must be one of {LIGHTS}, got {v!r}")
    return doc  # type: ignore[return-value]


VALIDATORS = {
    "mesh": validate_mesh,
    "weights": validate_weights,
    "poses": validate_poses,
    "landmarks": validate_landmarks,
    "skeleton": validate_skeleton,
    "recipe": validate_recipe,
    "analysis": validate_analysis,
    "metrics": validate_metrics,
}


def validate(kind: str, obj: Any) -> Any:
    """Dispatch to the validator of ``kind`` (one of FILE_KINDS)."""
    if kind not in VALIDATORS:
        raise ValueError(f"unknown file kind {kind!r}; expected one of {FILE_KINDS}")
    return VALIDATORS[kind](obj)
