"""rigcore.landmarks - landmark dictionaries: landmarks.json io, the D01 converter, the priors check and a TEST-ONLY synthesizer.

A landmark set is a plain ``dict[str, tuple[float, float, float]]`` (id -> metres, Blender frame: Z up, front -Y, left +X).
Ids follow the family template: centre ids (``pelvis``, ``chest``, ``head_top`` ...) and sided ids with ``_L`` / ``_R`` suffix
(``shoulder_L``). Aux landmarks of the rig brief are ``<part>_head`` / ``<part>_tail`` (``helmet_head``) and, for sided parts,
``<part>_head_L`` / ``<part>_tail_L`` (``ear_head_L``).
"""
from __future__ import annotations

import os
from typing import Any, Mapping

from . import SCHEMA, geom, schema
from .npzio import read_json, write_json

Landmarks = dict  # id -> (x, y, z)


def landmark_ids(family: Mapping) -> list[str]:
    """Landmark ids a family template asks for: ``landmarks.center`` then every ``landmarks.sided`` id as ``<id>_L``, ``<id>_R``."""
    lm = family.get("landmarks", {})
    out = list(lm.get("center", []))
    for sid in lm.get("sided", []):
        out.extend(f"{sid}_{s}" for s in schema.SIDES)
    return out


def _pos(entry: Any, lid: str) -> tuple:
    if isinstance(entry, Mapping):
        if "pos" not in entry:
            raise ValueError(f"landmark {lid!r}: entry has no 'pos'")
        entry = entry["pos"]
    try:
        p = geom.vec(entry)
    except (TypeError, ValueError):
        raise ValueError(f"landmark {lid!r}: position must be three numbers, got {entry!r}") from None
    if not all(c == c and abs(c) != float("inf") for c in p):
        raise ValueError(f"landmark {lid!r}: position is not finite: {p}")
    return p


def load_landmarks(src) -> Landmarks:
    """landmarks.json (path, or the parsed dict) -> ``{id: (x, y, z)}``.

    Accepts the contract document ``{schema, asset_id, family, H, landmarks: {id: {pos: [x,y,z], ...}}}`` (validated with
    ``schema.validate_landmarks``) and, leniently, a bare ``{id: [x,y,z]}`` mapping."""
    doc = read_json(src) if isinstance(src, (str, os.PathLike)) else src
    if not isinstance(doc, Mapping):
        raise ValueError(f"landmarks: expected an object, got {type(doc).__name__}")
    if "landmarks" in doc and "schema" in doc:
        schema.validate_landmarks(doc)
        entries = doc["landmarks"]
    else:
        entries = doc
    return {lid: _pos(e, lid) for lid, e in entries.items()}


def landmarks_doc(asset_id: str, family: str, H: float, positions: Mapping, details: Mapping | None = None) -> dict:
    """Contract document from ``positions`` ({id: (x,y,z)}); ``details`` ({id: {sources, spread, decision, confidence, flagged}})
    is merged per landmark. Validated before it is returned."""
    lms = {}
    for lid, p in positions.items():
        e = {"pos": list(_pos(p, lid))}
        if details and lid in details:
            e.update({k: v for k, v in details[lid].items() if k != "pos"})
        lms[lid] = e
    doc = {"schema": SCHEMA, "asset_id": asset_id, "family": family, "H": float(H), "landmarks": lms}
    return schema.validate_landmarks(doc)


def save_landmarks(path, asset_id: str, family: str, H: float, positions: Mapping, details: Mapping | None = None) -> str:
    """Write landmarks.json (atomic, validated)."""
    return write_json(path, landmarks_doc(asset_id, family, H, positions, details))


def check_priors(family: Mapping, landmarks: Mapping, H: float) -> list[dict]:
    """Anatomical sanity check (joint-placement.md source c): for every ``priors`` entry of the family compare ``z / H`` of the
    landmark (or of ``<id>_L`` / ``<id>_R``) with ``z_over_H`` +- ``tol_H``.

    Returns one dict per checked landmark: ``{id, z_over_H, expected, tol_H, ok, source}``. Priors are sanity only, never placement;
    ``ok == False`` means: flag it for the round's flag sheet."""
    out = []
    for pid, pr in family.get("priors", {}).items():
        for lid in (pid, f"{pid}_L", f"{pid}_R"):
            if lid not in landmarks:
                continue
            z = float(landmarks[lid][2]) / float(H)
            out.append({
                "id": lid,
                "z_over_H": z,
                "expected": pr["z_over_H"],
                "tol_H": pr["tol_H"],
                "ok": abs(z - pr["z_over_H"]) <= pr["tol_H"],
                "source": pr.get("source"),
            })
    return out


# --------------------------------------------------------------------------------------------------------------------------
# D01 converter
# --------------------------------------------------------------------------------------------------------------------------

_D01_SPINE = ("pelvis", "spine_01", "spine_02", "chest", "neck", "head")
_D01_ARM = ("shoulder", "elbow", "wrist", "hand_tip", "palm")
_D01_LEG = ("hip", "knee", "ankle", "ball", "toe_tip", "heel_ground", "ball_ground", "toe_ground")


def from_d01_landmarks(src) -> Landmarks:
    """D01's grouped ``landmarks.json`` (``spine``, ``arm_L``, ``leg_L``, ``leg_mirror_x``, ``ear_L``/``ear_R``, ``helmet``, ``sack``,
    ``loincloth_front``, ``sockets``) -> flat ids of the family templates. ``src`` is the path or the parsed dict.

    Mapping (the same mirroring as ``d01_rig_def.build``): centre ids copy from ``spine`` (``head_top`` <- ``spine.head_tail``);
    the left arm ids (``shoulder_L`` ...) copy from ``arm_L`` and the right ones mirror x -> -x; the left leg ids copy from ``leg_L``
    and the right ones mirror about x = ``leg_mirror_x``; ``ear_head_L/_R`` and ``ear_tail_L/_R`` come from ``ear_L`` / ``ear_R``
    (measured per side, not mirrored); ``helmet_head/_tail``, ``sack_head/_tail``, ``loincloth_front_head/_tail`` from the aux
    groups; ``fx_head``, ``fx_chest``, ``hit_origin`` from ``sockets``.

    NOT applied here (a builder concern): the elbow pre-bend of ``d01_rig_def.fitted_landmarks`` (elbow projected on the
    shoulder-wrist line + 3.3 mm toward +Y). The values are the measured landmarks.
    """
    doc = read_json(src) if isinstance(src, (str, os.PathLike)) else src
    mx = float(doc["leg_mirror_x"])
    out: Landmarks = {}
    sp = doc["spine"]
    for k in _D01_SPINE:
        out[k] = geom.vec(sp[k])
    out["head_top"] = geom.vec(sp["head_tail"])
    arm, leg = doc["arm_L"], doc["leg_L"]
    for k in _D01_ARM:
        p = geom.vec(arm[k])
        out[f"{k}_L"] = p
        out[f"{k}_R"] = geom.mirror_x(p, 0.0)
    for k in _D01_LEG:
        p = geom.vec(leg[k])
        out[f"{k}_L"] = p
        out[f"{k}_R"] = geom.mirror_x(p, mx)
    for side in schema.SIDES:
        e = doc[f"ear_{side}"]
        out[f"ear_head_{side}"] = geom.vec(e["base"])
        out[f"ear_tail_{side}"] = geom.vec(e["tip"])
    for part in ("helmet", "sack", "loincloth_front"):
        out[f"{part}_head"] = geom.vec(doc[part]["head"])
        out[f"{part}_tail"] = geom.vec(doc[part]["tail"])
    for k, v in doc["sockets"].items():
        out[k] = geom.vec(v)
    return out


# --------------------------------------------------------------------------------------------------------------------------
# TEST ONLY
# --------------------------------------------------------------------------------------------------------------------------

def synthesize_missing(landmarks: Mapping, family: Mapping, H: float | None = None) -> Landmarks:
    """TEST ONLY - never use this for a real asset: it invents landmarks so that unit tests and development code can build an H/S
    skeleton on D01, whose measured set lacks the clavicle.

    Returns a copy of ``landmarks`` plus, for each side, ``clavicle_<S>`` when the family asks for it and it is absent: x and y are
    35 % of the way from the neck-base midline point (``neck``) to ``shoulder_<S>``, z is ``shoulder.z - 0.01 H``. ``H`` defaults to
    the z of ``head_top`` (or the largest landmark z). Everything else that is missing stays missing (``template.resolve`` reports it).
    Compare ``set(out) - set(landmarks)`` to see what was invented."""
    out: Landmarks = dict(landmarks)
    wanted = set(landmark_ids(family))
    if H is None:
        H = float(landmarks["head_top"][2]) if "head_top" in landmarks else max(float(p[2]) for p in landmarks.values())
    for side in schema.SIDES:
        cid, sid = f"clavicle_{side}", f"shoulder_{side}"
        if cid in wanted and cid not in out and sid in out and "neck" in out:
            p = geom.lerp(out["neck"], out[sid], 0.35)
            out[cid] = (p[0], p[1], float(out[sid][2]) - 0.01 * H)
    return out
