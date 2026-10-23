"""rigcore.template - family templates (families/*.json, schema 0): load, merge ``extends``, expand ``{S}``, evaluate the point /
hinge expressions and resolve everything into a skeleton dict that Blender code builds from.

Pipeline::

    fam = load_family("S")                       # S.json merged over H.json, validated
    skel = resolve(fam, landmarks, H)            # expands {S} (L/R) itself; returns the skeleton dict of CONTRACT.md
    save_skeleton("skeleton.json", skel)

Units: metres.  Frame: Blender, Z up, front -Y, character left +X.  ``H`` is the catalogue height; ``off:`` offsets are in units of H.

Merge rule of ``extends`` (``merge_family(parent, child)``; the parent is never modified):

* dicts merge recursively, key by key (child wins): ``priors`` merges by landmark id and, inside an entry, field by field
  (``z_over_H``, ``tol_H``, ``source``); ``landmarks.rules``, ``conventions`` and ``skin`` merge the same way;
* ``bones``, ``ik`` (key ``name``) and ``rom`` (key ``joint``) are lists merged BY KEY: a child entry with an existing key
  updates that entry (recursive dict merge, so ``{"name": "head", "tail": "..."}`` changes only the tail), a new key is appended
  after the parent's entries, and ``{"name": ..., "_remove": true}`` deletes the parent's entry (a ``_remove`` of a key the
  parent does not have raises ValueError: a typo must not pass silently). Keys are the unexpanded names (``{S}_UpperArm``);
* every other value (scalars, other lists such as ``landmarks.center``, ``rom_compound``, ``notes``) is replaced by the child's;
* ``extends`` of the result is the child's; ``version``/``status``/``description`` are the child's.
* ``_files`` (child first) and ``_chain`` (family names) record where the result came from.

Aux bones of the rig brief are added with the same rule: ``merge_family(family, {"bones": [...]})``.

``{S}`` expansion (``expand_sides``): every entry of ``bones``, ``ik``, ``rom`` that contains ``{S}`` (or lower-case ``{s}``)
anywhere becomes two entries, ``L`` then ``R`` (``side`` key set; ``rom`` also gets ``id`` = ``<joint>_<side>``); unsided entries get
``side: null``. On the R copy ``hinge_R`` replaces ``hinge``; ``hinge_R`` is removed from both. Inside ``skin`` a sided string value
``k: "...{S}..."`` becomes two keys ``k_L`` / ``k_R``. ``off:`` negates ``dx`` on the R side (mirror).
"""
from __future__ import annotations

import copy
import hashlib
import os
from typing import Any, Mapping

from . import SCHEMA, geom, schema
from .landmarks import (  # noqa: F401  (re-exported: the landmark helpers "live" here too; TEST-ONLY synthesize_missing is not)
    check_priors,
    from_d01_landmarks,
    landmark_ids,
    load_landmarks,
)
from .landmarks import _pos
from .npzio import read_json, write_json

SIDES = schema.SIDES
KEYED_LISTS = {"bones": "name", "ik": "name", "rom": "joint"}
_REMOVE = "_remove"


class MissingLandmarksError(ValueError):
    """Raised by ``resolve`` when landmarks the template needs are absent. ``.missing`` is the sorted list of ids, ``.needed_by``
    maps each id to the bone names that use it."""

    def __init__(self, missing, needed_by):
        self.missing = sorted(missing)
        self.needed_by = {k: sorted(v) for k, v in needed_by.items()}
        detail = "; ".join(f"{k} (for {', '.join(self.needed_by[k][:4])}{'...' if len(self.needed_by[k]) > 4 else ''})"
                           for k in self.missing)
        super().__init__(f"missing landmarks: {detail}")


# --------------------------------------------------------------------------------------------------------------------------
# loading and merging
# --------------------------------------------------------------------------------------------------------------------------

def default_families_dir() -> str:
    """``<skill>/families`` next to ``scripts/``."""
    here = os.path.dirname(os.path.abspath(__file__))
    return os.path.normpath(os.path.join(here, "..", "..", "families"))


def _find_family(spec, families_dir: str, base_dir: str | None) -> str:
    s = os.fspath(spec)
    if s.lower().endswith(".json") or "/" in s or "\\" in s:
        cands = [os.path.abspath(s)]
    else:
        cands = []
        if base_dir:
            cands.append(os.path.join(base_dir, s + ".json"))
        cands.append(os.path.join(families_dir, s + ".json"))
    for c in cands:
        if os.path.isfile(c):
            return c
    raise FileNotFoundError(f"family template {s!r} not found (looked in {cands})")


def _merge_dict(a: dict, b: Mapping) -> dict:
    out = copy.deepcopy(a)
    for k, v in b.items():
        if isinstance(v, Mapping) and isinstance(out.get(k), dict):
            out[k] = _merge_dict(out[k], v)
        else:
            out[k] = copy.deepcopy(v)
    return out


def _merge_keyed(parent: list, child: list, key: str, what: str) -> list:
    out = [copy.deepcopy(p) for p in parent]
    for c in child:
        if not isinstance(c, Mapping) or key not in c:
            raise ValueError(f"{what}: every entry needs a {key!r} key, got {c!r}")
        idx = next((i for i, o in enumerate(out) if o.get(key) == c[key]), None)
        if c.get(_REMOVE):
            if idx is None:
                have = ", ".join(repr(o.get(key)) for o in out)
                raise ValueError(f"{what}: '_remove' of {key} {c[key]!r}, but the parent has no such entry (typo?); "
                                 f"entries: {have}")
            del out[idx]
            continue
        c = {k: v for k, v in c.items() if k != _REMOVE}
        if idx is not None:
            out[idx] = _merge_dict(out[idx], c)
        else:
            out.append(copy.deepcopy(c))
    return out


def merge_family(parent: Mapping, child: Mapping) -> dict:
    """Merge ``child`` over ``parent`` (see the module docstring for the rule). Returns a new dict."""
    out = copy.deepcopy(dict(parent))
    for k, v in child.items():
        if k in KEYED_LISTS and isinstance(v, list):
            out[k] = _merge_keyed(out.get(k, []), v, KEYED_LISTS[k], f"family {child.get('family', '?')!r}: {k}")
        elif isinstance(v, Mapping) and isinstance(out.get(k), dict):
            out[k] = _merge_dict(out[k], v)
        else:
            out[k] = copy.deepcopy(v)
    out["extends"] = child.get("extends")
    return out


def validate_family(family: Mapping) -> Mapping:
    """Structural check of a (merged) family dict; raises ValueError naming the family, bone and key."""
    fam = family.get("family")
    w = f"family {fam!r}"
    if not isinstance(fam, str) or not fam:
        raise ValueError("family: missing 'family' name")
    if family.get("schema") != SCHEMA:
        raise ValueError(f"{w}: schema is {family.get('schema')!r}, this build reads schema {SCHEMA}")
    if not isinstance(family.get("version"), str):
        raise ValueError(f"{w}: 'version' must be a string")
    bones = family.get("bones")
    if not isinstance(bones, list) or not bones:
        raise ValueError(f"{w}: 'bones' must be a non-empty list")
    for b in bones:
        nm = b.get("name") if isinstance(b, Mapping) else None
        if not isinstance(nm, str) or not nm:
            raise ValueError(f"{w}: bone entry without a name: {b!r}")
        for k in ("parent", "kind", "deform", "head", "tail", "hinge"):
            if k not in b:
                raise ValueError(f"{w}: bone {nm!r}: missing key {k!r}")
        if b["kind"] not in schema.BONE_KINDS:
            raise ValueError(f"{w}: bone {nm!r}: kind {b['kind']!r} not in {schema.BONE_KINDS}")
        if not isinstance(b["deform"], bool):
            raise ValueError(f"{w}: bone {nm!r}: 'deform' must be a bool")
        for k in ("head", "tail", "hinge"):
            if not isinstance(b[k], str):
                raise ValueError(f"{w}: bone {nm!r}: {k!r} must be an expression string, got {b[k]!r}")
        if b["parent"] is not None and not isinstance(b["parent"], str):
            raise ValueError(f"{w}: bone {nm!r}: 'parent' must be a bone name or null")
    return family


def _load(spec, families_dir: str, stack: list, base_dir: str | None) -> dict:
    path = _find_family(spec, families_dir, base_dir)
    key = os.path.normcase(os.path.abspath(path))
    if key in stack:
        raise ValueError("family 'extends' cycle: " + " -> ".join(stack + [key]))
    doc = read_json(path)
    if not isinstance(doc, dict):
        raise ValueError(f"{path}: expected a JSON object")
    ext = doc.get("extends")
    if ext:
        parent = _load(ext, families_dir, stack + [key], os.path.dirname(path))
        merged = merge_family(parent, doc)
        merged["_files"] = [os.path.abspath(path)] + parent["_files"]
        merged["_chain"] = [doc.get("family")] + parent["_chain"]
    else:
        merged = merge_family({}, doc)
        merged["_files"] = [os.path.abspath(path)]
        merged["_chain"] = [doc.get("family")]
    return merged


def load_family(path_or_name, families_dir=None) -> dict:
    """Load ``S`` / ``H`` (a name looked up as ``<families_dir>/<name>.json``) or a path to a family JSON, follow ``extends`` and
    merge. Result is validated and carries ``_files`` and ``_chain``. ``families_dir`` defaults to ``default_families_dir()``."""
    fam = _load(path_or_name, os.fspath(families_dir) if families_dir else default_families_dir(), [], None)
    validate_family(fam)
    return fam


def template_info(family: Mapping) -> dict:
    """``{path, version, sha256, chain, files}`` for ``rig_recipe.json`` ``template``: path of the leaf file, its ``version``, and
    ``sha256`` = SHA-256 over the bytes of all files of the ``extends`` chain, parent first (equals the file's own SHA-256 when the
    family has no parent). ``files`` lists each file's own hash."""
    files = list(family.get("_files") or [])
    if not files:
        raise ValueError("template_info: family was not loaded from files (no '_files')")
    h = hashlib.sha256()
    per = []
    for p in reversed(files):
        data = open(p, "rb").read()
        h.update(data)
        per.append({"path": p, "sha256": hashlib.sha256(data).hexdigest()})
    return {"path": files[0], "version": family["version"], "sha256": h.hexdigest(), "chain": list(family.get("_chain", [])),
            "files": per[::-1]}


# --------------------------------------------------------------------------------------------------------------------------
# {S} expansion
# --------------------------------------------------------------------------------------------------------------------------

def _contains(obj: Any) -> bool:
    if isinstance(obj, str):
        return "{S}" in obj or "{s}" in obj
    if isinstance(obj, Mapping):
        return any(_contains(k) or _contains(v) for k, v in obj.items())
    if isinstance(obj, (list, tuple)):
        return any(_contains(v) for v in obj)
    return False


def _sub(obj: Any, side: str) -> Any:
    if isinstance(obj, str):
        return obj.replace("{S}", side).replace("{s}", side.lower())
    if isinstance(obj, Mapping):
        return {_sub(k, side): _sub(v, side) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sub(v, side) for v in obj]
    return copy.deepcopy(obj)


def _expand_entries(items: list, kind: str) -> list:
    out = []
    for it in items:
        if _contains(it):
            for side in SIDES:
                e = _sub(it, side)
                e["side"] = side
                if "hinge_R" in e:
                    if side == "R":
                        e["hinge"] = e["hinge_R"]
                    del e["hinge_R"]
                if kind == "rom":
                    e["id"] = e["joint"] if _contains(it.get("joint", "")) else f"{e['joint']}_{side}"
                out.append(e)
        else:
            e = copy.deepcopy(it)
            if "hinge_R" in e:
                raise ValueError(f"{kind} entry {e.get('name', e.get('joint'))!r} has 'hinge_R' but no {{S}} in it")
            e["side"] = None
            if kind == "rom":
                e["id"] = e["joint"]
            out.append(e)
    return out


def _expand_list(items: list) -> list:
    out = []
    for it in items:
        if _contains(it):
            out.extend(_sub(it, side) for side in SIDES)
        else:
            out.append(copy.deepcopy(it))
    return out


def _expand_dict(d: Mapping) -> dict:
    out: dict = {}
    for k, v in d.items():
        if _contains(k):
            for side in SIDES:
                out[_sub(k, side)] = _sub(v, side)
        elif isinstance(v, Mapping):
            out[k] = _expand_dict(v)
        elif isinstance(v, list):
            out[k] = _expand_list(v)
        elif _contains(v):
            for side in SIDES:
                out[f"{k}_{side}"] = _sub(v, side)
        else:
            out[k] = copy.deepcopy(v)
    return out


def expand_sides(family: Mapping) -> dict:
    """Expand ``{S}`` into L / R copies (see the module docstring). Returns a new dict with ``_expanded: true``; idempotent."""
    if family.get("_expanded"):
        return copy.deepcopy(dict(family))
    out = copy.deepcopy(dict(family))
    out["bones"] = _expand_entries(family["bones"], "bone")
    out["ik"] = _expand_entries(family.get("ik", []), "ik")
    out["rom"] = _expand_entries(family.get("rom", []), "rom")
    out["skin"] = _expand_dict(family.get("skin", {}))
    out["_expanded"] = True
    return out


# --------------------------------------------------------------------------------------------------------------------------
# expressions
# --------------------------------------------------------------------------------------------------------------------------

def _num(s: str, what: str, expr: str) -> float:
    try:
        return float(s)
    except ValueError:
        raise ValueError(f"expression {expr!r}: {what} {s!r} is not a number") from None


def _lm_id(token: str, expr: str) -> str:
    t = token.strip()
    if t.startswith("lm:"):
        t = t[3:]
    if not t:
        raise ValueError(f"expression {expr!r}: empty landmark id")
    return t


def _parse_point(expr: str) -> tuple:
    """-> ("origin",) | ("lm", id) | ("lerp", p, q, t) | ("off", p, dx, dy, dz); operands of lerp/off are origin or lm:<id>."""
    e = expr.strip()
    if e == "origin":
        return ("origin",)
    if e.startswith("lm:"):
        return ("lm", _lm_id(e, expr))
    head, sep, rest = e.partition(":")
    parts = rest.split("|") if sep else []
    if head == "lerp":
        if len(parts) != 3:
            raise ValueError(f"expression {expr!r}: lerp needs lerp:<p>|<q>|<t>")
        return ("lerp", _parse_atom(parts[0], expr), _parse_atom(parts[1], expr), _num(parts[2], "t", expr))
    if head == "off":
        if len(parts) != 4:
            raise ValueError(f"expression {expr!r}: off needs off:<p>|<dx>|<dy>|<dz>")
        return ("off", _parse_atom(parts[0], expr), _num(parts[1], "dx", expr), _num(parts[2], "dy", expr), _num(parts[3], "dz", expr))
    raise ValueError(f"unknown point expression {expr!r}; expected origin, lm:<id>, lerp:<p>|<q>|<t> or off:<p>|<dx>|<dy>|<dz>")


def _parse_atom(tok: str, expr: str) -> tuple:
    t = tok.strip()
    if t == "origin":
        return ("origin",)
    if t.startswith("lm:"):
        return ("lm", _lm_id(t, expr))
    raise ValueError(f"expression {expr!r}: operand {tok!r} must be 'origin' or 'lm:<id>'")


def _parse_hinge(expr: str) -> tuple:
    e = expr.strip()
    head, sep, rest = e.partition(":")
    if head == "axis" and sep:
        return ("axis", rest)
    if head == "bend" and sep:
        ids = [_lm_id(t, expr) for t in rest.split("|")]
        if len(ids) != 3:
            raise ValueError(f"expression {expr!r}: bend needs bend:<a>|<b>|<c>")
        return ("bend", ids)
    raise ValueError(f"unknown hinge expression {expr!r}; expected axis:+X (or -X, +Y ...) or bend:<a>|<b>|<c>")


def _node_ids(node: tuple) -> list[str]:
    k = node[0]
    if k == "lm":
        return [node[1]]
    if k == "lerp":
        return _node_ids(node[1]) + _node_ids(node[2])
    if k == "off":
        return _node_ids(node[1])
    return []


def referenced_landmarks(expr: str) -> list[str]:
    """Landmark ids a point or hinge expression reads (``[]`` for ``origin`` / ``axis:``)."""
    e = expr.strip()
    if e.startswith("axis:") or e.startswith("bend:"):
        n = _parse_hinge(e)
        return list(n[1]) if n[0] == "bend" else []
    return _node_ids(_parse_point(e))


def _lookup(lm: Mapping, lid: str) -> tuple:
    if lid not in lm:
        raise MissingLandmarksError([lid], {lid: ["<expression>"]})
    return lm[lid]


def _eval_node(node: tuple, lm: Mapping, H: float, side: str | None) -> tuple:
    k = node[0]
    if k == "origin":
        return geom.ZERO
    if k == "lm":
        return _lookup(lm, node[1])
    if k == "lerp":
        return geom.lerp(_eval_node(node[1], lm, H, side), _eval_node(node[2], lm, H, side), node[3])
    if k == "off":
        dx = -node[2] if side == "R" else node[2]  # mirror: the R side negates dx
        p = _eval_node(node[1], lm, H, side)
        return (p[0] + dx * H, p[1] + node[3] * H, p[2] + node[4] * H)
    raise ValueError(f"bad point node {node!r}")  # pragma: no cover


def eval_point(expr: str, landmarks: Mapping, H: float, side: str | None = None) -> tuple:
    """Evaluate a point expression to metres: ``origin``; ``lm:<id>``; ``lerp:<p>|<q>|<t>`` (p + t (q - p)); ``off:<p>|<dx>|<dy>|<dz>``
    (offset in units of H on the Blender axes; ``dx`` is negated when ``side == "R"``). Operands of lerp/off are ``origin`` or
    ``lm:<id>``. ``landmarks`` is ``{id: (x,y,z)}``; a missing id raises ``MissingLandmarksError``."""
    return _eval_node(_parse_point(expr), landmarks, float(H), side)


def eval_hinge(expr: str, landmarks: Mapping) -> tuple:
    """Evaluate a hinge expression to a unit vector: ``axis:+X`` ... (world axis) or ``bend:<a>|<b>|<c>`` (landmark ids; unit normal
    of the plane a-b-c, ``geom.bend_normal``)."""
    node = _parse_hinge(expr)
    if node[0] == "axis":
        return geom.axis_vector(node[1])
    a, b, c = (_lookup(landmarks, i) for i in node[1])
    try:
        return geom.bend_normal(a, b, c)
    except ValueError as e:
        raise ValueError(f"hinge {expr!r}: {e}") from None


# --------------------------------------------------------------------------------------------------------------------------
# resolve
# --------------------------------------------------------------------------------------------------------------------------

def _order_bones(bones: list) -> list:
    names = [b["name"] for b in bones]
    if len(set(names)) != len(names):
        dup = sorted({n for n in names if names.count(n) > 1})
        raise ValueError(f"duplicate bone names after expansion: {dup}")
    known = set(names)
    for b in bones:
        if b["parent"] is not None and b["parent"] not in known:
            raise ValueError(f"bone {b['name']!r}: unknown parent {b['parent']!r}")
    placed: set[str] = set()
    order: list = []
    rest = list(bones)
    while rest:
        nxt = []
        for b in rest:
            if b["parent"] is None or b["parent"] in placed:
                order.append(b)
                placed.add(b["name"])
            else:
                nxt.append(b)
        if len(nxt) == len(rest):
            raise ValueError("cycle in the bone hierarchy among: " + ", ".join(b["name"] for b in nxt))
        rest = nxt
    return order


def _bone_landmark_ids(b: Mapping) -> list[str]:
    ids = _node_ids(_parse_point(b["head"])) + _node_ids(_parse_point(b["tail"]))
    h = _parse_hinge(b["hinge"])
    return ids + (list(h[1]) if h[0] == "bend" else [])


def resolve(family, landmarks: Mapping, H: float, families_dir=None) -> dict:
    """Resolve a family template + landmarks into the skeleton dict of CONTRACT.md.

    ``family``: a loaded family dict (expanded or not) or a name / path for ``load_family``. ``landmarks``: ``{id: (x, y, z)}``
    in metres (values may also be ``{"pos": [...]}``), ``H``: catalogue height in metres.

    Returns ``{schema, family, template_version, template, H, control_kit, builder, bones, ik, rom, rom_compound, skin, warnings}``.
    ``bones`` are in parent-before-child order (stable: template order wins); each is ``{name, parent, kind, deform, head, tail,
    hinge, bend_test, twist, side[, note]}`` with ``head``/``tail`` in metres, ``hinge`` a unit vector (the wanted bone local X, see
    ``geom.roll_z_vector``), ``twist`` = ``{driver, axis, factor}`` or None, ``side`` = "L" / "R" / None. ``ik``, ``rom``,
    ``rom_compound``, ``skin`` are carried over with the sides expanded. ``builder`` is the family's builder block (a copy, None when
    the family has none) and ``template`` its provenance ``{path, version, sha256}`` (``template_info``; None for a family dict that
    was not loaded from files), so the later steps build from the skeleton alone instead of reloading the family by name.

    Errors (ValueError): ``MissingLandmarksError`` (all missing ids at once), unknown parent, duplicate names, hierarchy cycle,
    zero-length bone (< 1e-6 m), collinear ``bend:`` points, unknown twist driver.
    """
    if isinstance(family, (str, os.PathLike)):
        family = load_family(family, families_dir)
    H = float(H)
    if not (H > 0 and H == H and H != float("inf")):
        raise ValueError(f"H must be a positive number (metres), got {H!r}")
    validate_family(family)
    fam = expand_sides(family)
    bones_in = _order_bones(fam["bones"])
    lm = {lid: _pos(p, lid) for lid, p in landmarks.items()}

    needed: dict[str, list[str]] = {}
    for b in bones_in:
        try:
            ids = _bone_landmark_ids(b)
        except ValueError as e:
            raise ValueError(f"bone {b['name']!r}: {e}") from None
        for lid in ids:
            if lid not in lm:
                needed.setdefault(lid, []).append(b["name"])
    if needed:
        raise MissingLandmarksError(needed.keys(), needed)

    out_bones = []
    warnings: list[str] = []
    for b in bones_in:
        nm, side = b["name"], b.get("side")
        try:
            head = eval_point(b["head"], lm, H, side)
            tail = eval_point(b["tail"], lm, H, side)
            hinge = eval_hinge(b["hinge"], lm)
        except MissingLandmarksError:
            raise
        except ValueError as e:
            raise ValueError(f"bone {nm!r}: {e}") from None
        length = geom.dist(head, tail)
        if length < schema.MIN_BONE_LENGTH:
            raise ValueError(f"bone {nm!r}: zero-length bone ({length:.3g} m): head {head} tail {tail}")
        d = geom.unit(geom.sub(tail, head))
        if abs(geom.dot(hinge, d)) > 0.98:
            warnings.append(f"bone {nm!r}: hinge is nearly parallel to the bone (|cos| = {abs(geom.dot(hinge, d)):.3f}); roll falls back")
        tw = b.get("twist")
        if tw is not None:
            tw = {"driver": tw["driver"], "axis": str(tw["axis"]).upper(), "factor": float(tw["factor"])}
        ob = {
            "name": nm,
            "parent": b["parent"],
            "kind": b["kind"],
            "deform": b["deform"],
            "head": list(head),
            "tail": list(tail),
            "hinge": list(hinge),
            "bend_test": b.get("bend_test"),
            "twist": tw,
            "side": side,
        }
        if b.get("note"):
            ob["note"] = b["note"]
        out_bones.append(ob)

    names = {b["name"] for b in out_bones}
    for ob in out_bones:
        if ob["twist"] is not None and ob["twist"]["driver"] not in names:
            raise ValueError(f"bone {ob['name']!r}: twist driver {ob['twist']['driver']!r} is not a bone")

    prov = None
    if family.get("_files"):
        info = template_info(family)
        prov = {k: info[k] for k in ("path", "version", "sha256")}
    skel = {
        "schema": SCHEMA,
        "family": fam["family"],
        "template_version": fam["version"],
        "template": prov,
        "H": H,
        "control_kit": fam.get("control_kit"),
        "builder": copy.deepcopy(fam.get("builder")),
        "bones": out_bones,
        "ik": copy.deepcopy(fam.get("ik", [])),
        "rom": copy.deepcopy(fam.get("rom", [])),
        "rom_compound": copy.deepcopy(fam.get("rom_compound", [])),
        "skin": copy.deepcopy(fam.get("skin", {})),
        "warnings": warnings,
    }
    schema.validate_skeleton(skel)
    return skel


# --------------------------------------------------------------------------------------------------------------------------
# skeleton helpers / io
# --------------------------------------------------------------------------------------------------------------------------

def bone_map(skel: Mapping) -> dict:
    """``{bone name: bone dict}`` of a resolved skeleton (insertion order = bone order)."""
    return {b["name"]: b for b in skel["bones"]}


def deform_names(skel: Mapping) -> list[str]:
    """Names of the bones with ``deform == True`` in skeleton order (the weight columns)."""
    return [b["name"] for b in skel["bones"] if b["deform"]]


def children_map(skel: Mapping) -> dict:
    """``{bone name: [child names]}`` (roots are under the key ``None``)."""
    out: dict = {}
    for b in skel["bones"]:
        out.setdefault(b["parent"], []).append(b["name"])
    return out


def save_skeleton(path, skel: Mapping) -> str:
    """Validate and write ``skeleton.json`` (atomic)."""
    schema.validate_skeleton(skel)
    return write_json(path, skel)


def load_skeleton(path) -> dict:
    """Read and validate ``skeleton.json``."""
    return schema.validate_skeleton(read_json(path))
