r"""rigkit.poses - S7: QA poses through the control rig, evaluated under runtime emulation, exported to poses.npz in chunks.

Runtime emulation (CONTRACT "Runtime emulation"), built by ``setup_emulation`` on a COPY ``<mesh>__rt_emul``:
  * weights: the copy's groups follow the glTF exporter rule (drop <= 1e-4, top 4, renormalize) through B's
    ``rigkit.skin_io.runtime_copy`` (groups that match any bone of the runtime armature are kept, as the exporter keeps every
    joint); a loop read of the source groups + ``exporter_rule`` here cross-checks it: ``weights_check_max`` above
    ``WEIGHT_CHECK_TOL`` (1e-6) is an error (the copy would not be what the exporter writes);
  * modifiers: the copy has ONE Armature modifier (runtime armature, vertex groups on, envelopes off, Preserve Volume off,
    multi-modifier off); parent type OBJECT (an ARMATURE parent would add a hidden deform);
  * bones: every runtime bone gets ``bbone_segments = 1``; bones without deform that carry weights on the copy get
    ``use_deform = True`` (the exporter skins them; Blender would ignore them). Old values are stored on the copy and restored
    by ``teardown_emulation``. The source mesh, its groups and modifiers are never touched;
  * the copy is hidden with the eye (``hide_set``), which keeps it in the depsgraph (measured in Blender 5.2.2; ``hide_viewport``
    stops its evaluation).

``emulation(...)`` is the exception-safe way to use it (poses ``run``/``export_current``, rigkit.render, rigkit.parity): a context
manager that snapshots the file state (``FileState``: datablock names, every armature's bone flags, pose channels, action + slot,
custom properties, object visibility / selection / active object, scene frame, camera, world, render / view / Workbench
settings) and restores it EXACTLY in ``finally`` - the copy and anything else created inside (appended Actions, QA camera, world,
render images) is removed. The restore never hides the original exception.

Pose sets (each pose is a JSON-able spec, stored in poses.npz meta so render.py can pose the rig again):
  * ``legacy_d01``: the 17 Actions ``QA_pose_<name>`` of ``D01_hodling_qa_poses.blend`` (rigkit.legacy_d01), appended inside the
    emulation context and assigned to the control armature (frame 1). They reproduce D01 ``validation.json`` pose_extremes.
  * ``rom``: generic ROM from a family template / resolved skeleton: every ``rom`` entry (control bone(s) ``+``-joined, local axis,
    ``range_deg``) is sampled at +max/2, +max, -max/2, -max (neutral = the shared ``rest`` pose, not repeated), through FK (all IK
    switches of ``skeleton.ik`` off). ``EXTRA_ROM`` adds, per side, toe flexion +-30 deg (``ctl_{S}_Toe``) and ear motion +-25 deg
    (``ctl_{S}_ear``, as D01's aux_motion) about the bone's hinge X when that control bone exists and the family has no entry for
    the joint (references/deformation-qa.md: "Families with Toe bones add toe flexion +-30 deg"; without them the toe and ear
    regions are never exercised and skin selection cannot judge them). X entries rotate by the value (signs follow the bend
    tests); Y/Z entries with a ``positive``
    text get their sign from a +10 deg displacement test of the first control bone's runtime tail. A WEAK test (the tail moves
    less than 1e-7 m, or its motion is within 72.5 deg of perpendicular to the expected direction: |cos| < 0.3) is an error
    unless the op carries an explicit ``sign`` (+1 / -1) as confirmation. Then the ``rom_compound`` poses (squat, long_step,
    arms_crossed, hands_overhead, twist_p45/m45, hip_flex_knee_bent) defined from D01's values in units of H, anchored on the
    runtime armature's rest bones.
  Before every pose the control rig is reset (identity, IK switches 1) and evaluated; after posing the mesh is evaluated until two
  evaluations agree (``settle``): Blender's IK result otherwise depends on the previously evaluated pose.

Tags per pose (meta ``tags``): ``rest``/``rom``/``compound``/``legacy``, ``standard`` (mid samples) or ``extreme``, ``planted_L`` /
``planted_R`` (feet that should touch the ground), ``forearm_twist_L``/``_R`` (candy-wrapper poses); generated chain poses
(phase G) carry ``chain`` + ``extreme`` (weight tests, never standard).

poses.npz: names, P (p,n,3) world positions of the emulated copy, bone_names (runtime armature, all bones), heads/tails (p,b,3)
world; extras ``pose_mats`` (p,b,4,4) and ``rest_mats`` (b,4,4) world bone matrices (skinning matrix = pose @ inverse(rest)),
``parents`` (b,), ``deform`` (b,) (deform flags of the emulation). Meta ``H`` and ``H_source`` ("given" or how it was measured).
Units metres, Blender frame (Z up, front -Y, left +X).
Chunks: ``export_chunk`` writes ``poses_chunk_<i0>.npz`` (a valid poses file) for a slice of the specs, so no Blender call is
long; ``merge_chunks`` (pure numpy) joins them.

Run headless (opens the file; ``export_current`` is the same on the file already open, e.g. over MCP):
  blender -b --factory-startup -P poses.py -- --blend RIG.blend --set legacy_d01 --actions-blend QA.blend --out-dir DIR
  blender -b --factory-startup -P poses.py -- --blend RIG.blend --set rom --family S --out-dir DIR
Prints one JSON line; exit code 1 on failure.
"""
from __future__ import annotations

import argparse
import contextlib
import glob
import json
import math
import os
import re
import sys
import time

import numpy as np

if __name__ == "__main__":  # bootstrap: scripts/ on sys.path (blender -P / python -I)
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import bpy
    from mathutils import Matrix, Quaternion, Vector
except ImportError:  # pure helpers (planning, exporter rule, chunk merge) also run in rigkit-env for tests
    bpy = None

from rigcore import npzio, template  # noqa: E402

EMUL_SUFFIX = "__rt_emul"
EXPORT_MIN_WEIGHT = 1e-4
EXPORT_MAX_INFLUENCES = 4
WEIGHT_CHECK_TOL = 1e-6  # copy weights vs loop read + exporter rule
ACTION_PREFIX = "QA_pose_"
SIGN_TEST_DEG = 10.0
SIGN_MIN_MOVE = 1e-7  # m: a sign test whose tracked tail moves less is weak
SIGN_MIN_COS = 0.3  # |cos(motion, expected direction)| below this is weak
SETTLE_TOL = 1e-7  # m: two evaluations closer than this count as settled
LEG_WORDS = ("Thigh", "Calf", "Foot", "Toe")
#: generic ROM entries for bones the H/S templates do not exercise: added per side when the control bone exists (or, planning
#: without a control list, when the family has the runtime bone) and the family has no entry with the same joint name. X = the
#: bone's hinge (D01: toe hinge X; ear hinge X points about world up, so +-25 deg swings the ear like D01 aux_motion's world Z)
EXTRA_ROM = ({"joint": "toe_flexion", "control": "ctl_{S}_Toe", "axis": "X", "range_deg": [-30.0, 30.0]},
             {"joint": "ear_motion", "control": "ctl_{S}_ear", "axis": "X", "range_deg": [-25.0, 25.0]})

# --------------------------------------------------------------------------------------------------------------------------
# pure helpers (no bpy)
# --------------------------------------------------------------------------------------------------------------------------


def exporter_rule(W, min_weight: float = EXPORT_MIN_WEIGHT, max_influences: int = EXPORT_MAX_INFLUENCES) -> np.ndarray:
    """glTF exporter weights: drop w <= min_weight, keep the ``max_influences`` largest, renormalize; empty rows stay 0. float32
    (n,k). Same rule as solvers.metrics.exporter_rule and skin_common.exporter_rule.

    Exact ties at the cut: the Blender 5.2 exporter sorts each vertex's (joint, weight) list with a stable sort, so ties keep the
    vertex's group-membership order (MDeformVert order: the order in which the weights were assigned to that vertex); this
    function keeps the COLUMN order. ``setup_emulation`` reads the columns in the source's group order and B's
    ``skin_io.write_groups`` writes the copy's groups in that order, so for the emulated copy both orders are the group order;
    for other column orders an exact tie between the 4th and 5th weight may pick a different bone."""
    W = np.asarray(W, dtype=np.float32)
    out = np.where(W > min_weight, W, np.float32(0.0)).astype(np.float32)
    if out.shape[1] > max_influences:
        order = np.argsort(-out, axis=1, kind="stable")
        np.put_along_axis(out, order[:, max_influences:], np.float32(0.0), axis=1)
    s = out.sum(axis=1, dtype=np.float32)
    nz = s > 0
    out[nz] = out[nz] / s[nz, None]
    return out


def positive_direction(text: str | None, side: str | None):
    """World direction (x, y, z) meant by a ROM ``positive`` text, or None for "either / symmetric". Explicit axis tokens like
    ``(+Z)`` win; otherwise outward/inward (away from / toward the midline), up, down, forward (-Y), back (+Y)."""
    if not text:
        return None
    t = text.lower()
    m = re.search(r"\(([+-])([xyz])\)", t)
    if m:
        v = [0.0, 0.0, 0.0]
        v["xyz".index(m.group(2))] = 1.0 if m.group(1) == "+" else -1.0
        return tuple(v)
    if "either" in t or "symmetric" in t:
        return None
    s = 1.0 if side == "L" else -1.0 if side == "R" else 0.0
    if ("outward" in t or "away from the midline" in t) and s:
        return (s, 0.0, 0.0)
    if ("inward" in t or "toward the midline" in t) and s:
        return (-s, 0.0, 0.0)
    for word, v in ((" up", (0.0, 0.0, 1.0)), (" down", (0.0, 0.0, -1.0)), ("forward", (0.0, -1.0, 0.0)),
                    ("backward", (0.0, 1.0, 0.0)), (" back", (0.0, 1.0, 0.0))):
        if word in " " + t:
            return v
    raise ValueError(f"cannot resolve ROM positive text {text!r}")


def sign_from_test(p0, p1, direction) -> dict:
    """Sign of a ROM displacement test: tracked point ``p0`` -> ``p1`` (m) after +10 deg, expected ``direction``. Returns
    {sign, displacement_along_positive_m, moved_m, cos, weak}; weak = moved < SIGN_MIN_MOVE or |cos| < SIGN_MIN_COS."""
    dv = np.asarray(p1, dtype=float) - np.asarray(p0, dtype=float)
    d = np.asarray(direction, dtype=float)
    moved = float(np.linalg.norm(dv))
    dot = float(np.dot(dv, d))
    cos = dot / (moved * float(np.linalg.norm(d))) if moved > 0 else 0.0
    return {"sign": 1 if dot >= 0 else -1, "displacement_along_positive_m": dot, "moved_m": moved, "cos": cos,
            "weak": bool(moved < SIGN_MIN_MOVE or abs(cos) < SIGN_MIN_COS)}


def _ik_switches(skel) -> list:
    return [e["switch"] for e in skel.get("ik", []) if e.get("switch")]


def _planted(controls, side_free=()):
    """Feet that stay on the ground: a side is free when any listed control is a leg control of that side (or a pelvis/cog/root
    control moves everything)."""
    free = set(side_free)
    for c in controls:
        b = c[4:] if c.startswith("ctl_") else c
        if b in ("pelvis", "cog", "root"):
            return []
        if any(w in b for w in LEG_WORDS):
            free.add("L" if b.startswith("L_") or b.endswith("_L") else "R" if b.startswith("R_") or b.endswith("_R") else "?")
    return [s for s in ("L", "R") if s not in free]


def rest_spec() -> dict:
    return {"name": "rest", "kind": "rest", "ik": "default", "ops": [], "tags": ["rest", "standard", "planted_L", "planted_R"]}


def extra_rom(fam, controls=None) -> list:
    """The ``EXTRA_ROM`` entries (expanded per side, with ``id``, ``side`` and ``extra`` True) that apply to the expanded family
    ``fam``: its rom has no entry with that joint name, and the control bone is in ``controls`` (without a control list: the
    runtime bone - the control name without ``ctl_`` - is a bone of the family)."""
    have = set()
    for e in fam.get("rom", []):
        j = str(e.get("joint", ""))
        have.add(j[:-2] if j[-2:] in ("_L", "_R") else j)
    bones = {b.get("name") for b in fam.get("bones", [])}
    out = []
    for e in EXTRA_ROM:
        if e["joint"] in have:
            continue
        for s in ("L", "R"):
            ctl = e["control"].replace("{S}", s)
            present = ctl in controls if controls is not None else ctl[len("ctl_"):] in bones
            if present:
                out.append(dict(e, control=ctl, side=s, id=f"{e['joint']}_{s}", extra=True))
    return out


def plan_rom(skel, controls=None) -> tuple[list, list]:
    """ROM pose specs from ``skel['rom']`` (expanded entries with ``id`` and ``side``) + the ``extra_rom`` entries (toes, ears).
    ``controls`` = names of the control armature's bones (family entries with missing controls are skipped and returned; extra
    entries without their control bone are simply left out). Returns (specs, skipped)."""
    fam = skel if skel.get("_expanded") or any("id" in e for e in skel.get("rom", [])) else template.expand_sides(skel)
    switches = _ik_switches(fam)
    specs, skipped = [], []
    for e in list(fam.get("rom", [])) + extra_rom(fam, controls):
        bones = [b for b in e["control"].split("+") if b]
        missing = [b for b in bones if controls is not None and b not in controls]
        if missing:
            skipped.append({"id": e["id"], "missing_controls": missing})
            continue
        lo, hi = (float(x) for x in e["range_deg"])
        samples = ([hi / 2.0, hi] if hi > 0 else []) + ([lo / 2.0, lo] if lo < 0 else [])
        axis = str(e["axis"]).upper()
        positive = e.get("positive") if axis in ("Y", "Z") else None
        for v in samples:
            tags = ["rom", "extreme" if v in (lo, hi) else "standard"] + [f"planted_{s}" for s in _planted(bones)]
            if e["joint"].startswith("forearm_pronation") and e.get("side"):
                tags.append(f"forearm_twist_{e['side']}")
            specs.append({
                "name": f"{e['id']}_{'p' if v > 0 else 'm'}{abs(v):g}",
                "kind": "rom", "joint": e["id"], "ik": {s: 0.0 for s in switches},
                "ops": [{"op": "local_rot", "bones": bones, "axis": axis, "deg": v, "positive": positive, "side": e.get("side"),
                         "sign_key": e["id"]}],
                "tags": tags})
    return specs, skipped


def plan_compound(names, bones_rest: dict, H: float, skel=None) -> tuple[list, list]:
    """Compound pose specs. ``bones_rest`` = {runtime bone: (head, tail)} world metres at rest. Values come from D01's
    d01_poses.py in units of H (D01 H = 0.5 m) and are anchored on the rest bones; the step length scales with the measured
    hip-to-ankle reach (S.json note). Returns (specs, skipped)."""
    def head(b):
        return np.asarray(bones_rest[b][0], dtype=float)

    def tail(b):
        return np.asarray(bones_rest[b][1], dtype=float)

    switches = _ik_switches(skel or {})
    leg_sw = [s for s in switches if "leg" in s]
    specs, skipped = [], []
    for nm in names:
        try:
            if nm == "squat":
                ops = [{"op": "move", "bone": "ctl_cog", "delta": [0.0, 0.0, -0.15 * H]},
                       {"op": "world_rot", "bone": "ctl_spine_01", "axis": "x", "deg": 18.0}]
                specs.append({"name": nm, "kind": "compound", "ik": "default", "ops": ops,
                              "tags": ["compound", "extreme", "planted_L", "planted_R"]})
            elif nm == "long_step":
                reach = {s: float(np.linalg.norm(head(f"{s}_Thigh") - tail(f"{s}_Calf"))) for s in ("L", "R")}
                ops = [{"op": "move", "bone": "ctl_L_Foot_IK", "delta": [0.0, -0.385 * reach["L"], 0.0]},
                       {"op": "move", "bone": "ctl_R_Foot_IK", "delta": [0.0, 0.346 * reach["R"], 0.0]},
                       {"op": "world_rot", "bone": "ctl_R_Toe_roll", "axis": "x", "deg": 28.0},
                       {"op": "move", "bone": "ctl_cog", "delta": [0.0, -0.02 * H, -0.024 * H]}]
                specs.append({"name": nm, "kind": "compound", "ik": "default", "ops": ops,
                              "tags": ["compound", "extreme", "planted_L", "planted_R"]})
            elif nm == "arms_crossed":
                c = head("chest")
                ops = [{"op": "place", "bone": "ctl_L_Hand_IK", "pos": [c[0] - 0.07 * H, c[1] - 0.2 * H, c[2] - 0.04 * H]},
                       {"op": "place", "bone": "ctl_R_Hand_IK", "pos": [c[0] + 0.07 * H, c[1] - 0.2 * H, c[2] - 0.01 * H]}]
                specs.append({"name": nm, "kind": "compound", "ik": "default", "ops": ops,
                              "tags": ["compound", "extreme", "planted_L", "planted_R"]})
            elif nm == "hands_overhead":
                c = head("chest")
                top = max(tail("head")[2], head("head")[2])
                ops = [{"op": "place", "bone": "ctl_L_Hand_IK", "pos": [c[0] + 0.2 * H, c[1] - 0.15 * H, top]},
                       {"op": "place", "bone": "ctl_R_Hand_IK", "pos": [c[0] - 0.2 * H, c[1] - 0.15 * H, top]}]
                specs.append({"name": nm, "kind": "compound", "ik": "default", "ops": ops,
                              "tags": ["compound", "extreme", "planted_L", "planted_R"]})
            elif nm in ("twist_p45", "twist_m45"):
                d = 15.0 if nm == "twist_p45" else -15.0
                ops = [{"op": "world_rot", "bone": b, "axis": "z", "deg": d} for b in ("ctl_spine_01", "ctl_spine_02", "ctl_chest")]
                specs.append({"name": nm, "kind": "compound", "ik": "default", "ops": ops,
                              "tags": ["compound", "extreme", "planted_L", "planted_R"]})
            elif nm in GARMENT_COMPOUNDS:
                specs.append(garment_compound(nm, leg_sw))
            elif nm == "hip_flex_knee_bent":
                ops = [{"op": "world_rot", "bone": "ctl_L_Thigh", "axis": "x", "deg": -70.0},
                       {"op": "hinge_rot", "bone": "ctl_L_Calf", "deg": 95.0},
                       {"op": "world_rot", "bone": "ctl_R_Thigh", "axis": "x", "deg": 30.0},
                       {"op": "hinge_rot", "bone": "ctl_R_Calf", "deg": 25.0}]
                specs.append({"name": nm, "kind": "compound", "ik": {s: 0.0 for s in leg_sw}, "ops": ops,
                              "tags": ["compound", "extreme"]})
            else:
                skipped.append({"id": nm, "reason": "no generic definition"})
        except KeyError as e:
            skipped.append({"id": nm, "reason": f"bone {e} missing from the runtime armature"})
    return specs, skipped


#: garment compounds (references/cloth-and-attachments.md §6): (control, local X deg) ops; FK legs (leg IK off) or IK legs planted.
#: The rom set plans them only for a skeleton with chain bones (``plan``), so body results of assets without garments do not
#: change. Thigh +X = hip extension, Calf +X = knee flexion, spine_01 +X = top forward (family H bend tests).
GARMENT_COMPOUNDS = {
    "deep_crouch": ([("ctl_L_Thigh", -60.0), ("ctl_R_Thigh", -60.0), ("ctl_L_Calf", 95.0), ("ctl_R_Calf", 95.0)], "extreme", True),
    "high_kick_L": ([("ctl_L_Thigh", -90.0)], "extreme", True),
    "sit": ([("ctl_L_Thigh", -90.0), ("ctl_R_Thigh", -90.0), ("ctl_L_Calf", 90.0), ("ctl_R_Calf", 90.0)], "extreme", True),
    "run_stride": ([("ctl_L_Thigh", -40.0), ("ctl_L_Calf", 30.0), ("ctl_R_Thigh", 20.0)], "standard", True),
    "lean_fwd": ([("ctl_spine_01", 30.0)], "standard", False),
    "lean_back": ([("ctl_spine_01", -30.0)], "standard", False),
}
CHAIN_POSE_DEG = 30.0  # root (+-) and middle-bone (+) swings of the chain poses (spec §6)
CHAIN_FLARE_DEG = 15.0  # G6: ring / fan flare. LBS cannot fold cloth, so a flare must stretch the hem; 30 deg tore FL's robe
CHAIN_TAGS = ["chain", "extreme", "planted_L", "planted_R"]  # G6: weight tests, never standard poses (metrics buckets)
MAX_CHAIN_POSES = 12
RING_CLASSES = ("skirt",)


def garment_compound(nm: str, leg_switches=()) -> dict:
    """Spec of garment compound ``nm`` (``GARMENT_COMPOUNDS``): local X rotations of the listed controls; legs posed through FK
    (leg IK switches off), so the feet leave the ground; lean poses keep the IK legs planted. Tags ``compound``, ``garment`` and
    ``standard`` / ``extreme``."""
    ops, kind, fk_legs = GARMENT_COMPOUNDS[nm]
    tags = ["compound", "garment", kind] + ([] if fk_legs else ["planted_L", "planted_R"])
    return {"name": nm, "kind": "compound", "ik": {s: 0.0 for s in leg_switches} if fk_legs else "default",
            "ops": [{"op": "local_rot", "bones": [b], "axis": "X", "deg": float(d)} for b, d in ops], "tags": tags}


def chain_rows(skel) -> list:
    """Chains of a merged skeleton (bones with a ``chain`` key) in skeleton order: ``[{id, piece, side, cls, bones, owns_root,
    fan_root}]``; ``cls`` from the standard names (skirt, tail, cape, charm, main_hair, swing, other); a chain whose first bone
    hangs from another chain's bone is a fan sub-chain (``owns_root`` False, ``fan_root`` = that bone). Pure Python."""
    names = {b["name"]: b for b in skel.get("bones", [])}
    rows, by = [], {}
    for b in skel.get("bones", []):
        cid = b.get("chain")
        if cid is None:
            continue
        if cid not in by:
            par = names.get(b["parent"]) or {}
            n = b["name"][2:] if b["name"][:2] in ("L_", "R_") else b["name"]
            cls = next((k for k in ("skirt", "tail", "cape", "charm", "main_hair") if n.startswith(k + "_")),
                       "swing" if n.endswith("_swing") else "other")
            by[cid] = {"id": cid, "piece": b.get("piece"), "side": b.get("side"), "cls": cls, "bones": [],
                       "owns_root": par.get("chain") is None, "fan_root": None if par.get("chain") is None else par["name"]}
            rows.append(by[cid])
        by[cid]["bones"].append(b["name"])
    return rows


def plan_chain_poses(skel, max_poses: int = MAX_CHAIN_POSES, deg: float = CHAIN_POSE_DEG,
                     flare_deg: float = CHAIN_FLARE_DEG) -> tuple:
    """Chain poses of a merged skeleton (spec §6; they test the weights, not the leg drivers): every ring (skirt chains of one
    piece) and every fan flares +``flare_deg`` together (each chain root, or each sub-chain start of a fan, about its local X =
    outward; G6: 15 deg, the spec's 30 deg tore 186 edges of FL's robe: LBS cannot fold cloth, a flare stretches the hem); the
    roots of the other chains swing +-``deg``; every chain's middle bone (``bones[n // 2]``, chains of 2+ bones)
    swings +``deg``. Root and middle poses are grouped by (class, side group): C, L, R, or LR when a class has both sides. Above
    ``max_poses`` the groups coarsen: sides merged per class, then classes merged, then all flares in one pose. Ops act on the FK
    controls ``ctl_<bone>``, one op per bone (``local_rot`` divides an angle shared by several bones). IK default, feet planted;
    tags ``CHAIN_TAGS``: ``chain`` + ``extreme`` (G6: weight tests, so the standard lights of solvers/metrics.py never see
    them; its garment and body lights put every non-standard pose in the extreme bucket). Returns (specs, report)."""
    rows = chain_rows(skel)
    if not rows:
        return [], {"n": 0, "level": None}
    flares = {}
    for r in rows:
        if r["cls"] in RING_CLASSES and r["owns_root"]:
            flares.setdefault(f"ring_{r['piece']}", []).append(r["bones"][0])
    for r in rows:
        if r["fan_root"] is not None:
            lead = next((x for x in rows if x["bones"][0] == r["fan_root"]), None)
            key = f"fan_{r['fan_root']}"
            if lead is not None and len(lead["bones"]) > 1 and lead["bones"][1] not in flares.get(key, []):
                flares.setdefault(key, []).append(lead["bones"][1])
            flares.setdefault(key, []).append(r["bones"][0])

    def build(level):
        sides = {}
        for r in rows:
            sides.setdefault(r["cls"], set()).add(r["side"])
        both = {k: {"L", "R"} <= v for k, v in sides.items()}
        roots, mids = {}, {}
        for r in rows:
            cls = "all" if level >= 2 else r["cls"]
            sd = r["side"] or "C"
            sg = "all" if level >= 1 else ("LR" if sd in ("L", "R") and both[r["cls"]] else sd)
            if r["owns_root"] and r["cls"] not in RING_CLASSES:
                roots.setdefault((cls, sg), []).append(r["bones"][0])
            if len(r["bones"]) >= 2:
                mids.setdefault((cls, sg), []).append(r["bones"][len(r["bones"]) // 2])
        fl = flares if level < 3 else ({"all": [b for v in flares.values() for b in v]} if flares else {})
        return roots, mids, fl

    level = 0
    while True:
        roots, mids, fl = build(level)
        if 2 * len(roots) + len(mids) + len(fl) <= max_poses or level >= 3:
            break
        level += 1

    def spec(name, bones, d):
        return {"name": name, "kind": "chain", "ik": "default", "tags": list(CHAIN_TAGS),
                "ops": [{"op": "local_rot", "bones": ["ctl_" + b], "axis": "X", "deg": float(d)} for b in bones]}

    def tag(x):
        return "".join(ch if ch.isalnum() or ch == "_" else "_" for ch in str(x))

    specs = [spec(f"chain_flare_{tag(k)}", v, flare_deg) for k, v in fl.items()]
    for (cls, sg), bones in roots.items():
        specs.append(spec(f"chain_{cls}_{sg}_root_p{deg:g}", bones, deg))
        specs.append(spec(f"chain_{cls}_{sg}_root_m{deg:g}", bones, -deg))
    for (cls, sg), bones in mids.items():
        specs.append(spec(f"chain_{cls}_{sg}_mid_p{deg:g}", bones, deg))
    rep = {"n": len(specs), "level": ["class+side", "class", "all classes", "all classes + one flare"][level],
           "max_poses": max_poses, "chains": [r["id"] for r in rows], "flare_deg": float(flare_deg), "swing_deg": float(deg),
           "tags": list(CHAIN_TAGS),
           "groups": {x["name"]: [op["bones"][0] for op in x["ops"]] for x in specs}}
    if len(specs) > max_poses:
        rep["warning"] = f"{len(specs)} chain poses even at the coarsest grouping (> {max_poses})"
    return specs, rep


def merge_chunks(paths, out_path, meta_update: dict | None = None) -> str:
    """Join chunk files (valid poses.npz each, same mesh and bones) in the given order into ``out_path``. Pure numpy."""
    parts = [npzio.load_poses(p) for p in paths]
    if not parts:
        raise ValueError("merge_chunks: no chunk files")
    b0 = parts[0]["bone_names"].tolist()
    for p in parts[1:]:
        if p["bone_names"].tolist() != b0 or p["P"].shape[1] != parts[0]["P"].shape[1]:
            raise ValueError("merge_chunks: chunks disagree on bones or vertex count")
    meta = dict(parts[0]["meta"])
    meta.pop("chunk", None)
    tags = {}
    specs = {}
    for p in parts:
        tags.update(p["meta"].get("tags", {}))
        specs.update(p["meta"].get("specs", {}))
    meta["tags"] = tags
    meta["specs"] = specs
    meta.update(meta_update or {})
    names = np.concatenate([p["names"] for p in parts])
    if "rest" in names.tolist():
        meta["rest_index"] = names.tolist().index("rest")
    extra = {"pose_mats": np.concatenate([p["extra"]["pose_mats"] for p in parts]),
             "rest_mats": parts[0]["extra"]["rest_mats"], "parents": parts[0]["extra"]["parents"],
             "deform": parts[0]["extra"]["deform"]}
    return npzio.save_poses(out_path, names, np.concatenate([p["P"] for p in parts]), b0,
                            np.concatenate([p["heads"] for p in parts]), np.concatenate([p["tails"] for p in parts]),
                            meta=meta, extra=extra)


# --------------------------------------------------------------------------------------------------------------------------
# Blender: file state (exception safety)
# --------------------------------------------------------------------------------------------------------------------------


def _need_bpy():
    if bpy is None:
        raise RuntimeError("rigkit.poses: this function runs inside Blender 5.2")


def _update():
    bpy.context.view_layer.update()


DATA_COLLECTIONS = ("objects", "meshes", "armatures", "cameras", "lights", "actions", "node_groups", "images", "materials",
                    "worlds", "collections")
_RENDER_PROPS = ("engine", "resolution_x", "resolution_y", "resolution_percentage", "filepath", "film_transparent")
_SHADING_PROPS = ("light", "color_type", "show_shadows", "show_cavity", "show_object_outline", "show_specular_highlight",
                  "show_xray", "xray_alpha", "single_color", "background_type")


def _vals(x):
    return tuple(float(v) for v in x)


class FileState:
    """Snapshot of what the S7/S8 tools change in a Blender file, with an exact restore (see the module docstring). ``as_dict``
    gives a JSON-able form that tests compare before and after."""

    def __init__(self):
        _need_bpy()
        self.names = {c: set(getattr(bpy.data, c).keys()) for c in DATA_COLLECTIONS}
        self.arm = {}
        for ob in bpy.data.objects:
            if ob.type != "ARMATURE":
                continue
            ad = ob.animation_data
            slot = None
            if ad is not None and ad.action is not None:
                try:
                    slot = ad.action_slot.identifier if ad.action_slot else None
                except AttributeError:  # pre-slot Blender
                    slot = None
            self.arm[ob.name] = {
                "bones": {b.name: (int(b.bbone_segments), bool(b.use_deform)) for b in ob.data.bones},
                "pose": {pb.name: (_vals(pb.location), pb.rotation_mode, _vals(pb.rotation_quaternion), _vals(pb.rotation_euler),
                                   _vals(pb.rotation_axis_angle), _vals(pb.scale)) for pb in ob.pose.bones},
                "anim": None if ad is None else {"action": ad.action.name if ad.action else None, "slot": slot},
                "props": {k: ob[k] for k in ob.keys() if isinstance(ob[k], (int, float, str, bool))},
            }
        vl = bpy.context.view_layer
        self.objects = {}
        for ob in bpy.data.objects:
            try:
                hid, sel = bool(ob.hide_get()), bool(ob.select_get())
            except RuntimeError:  # not in the view layer
                hid, sel = None, None
            self.objects[ob.name] = (hid, sel, bool(ob.hide_viewport), bool(ob.hide_render))
        self.active = vl.objects.active.name if vl.objects.active else None
        sc = bpy.context.scene
        self.scene = sc.name
        self.frame = int(sc.frame_current)
        self.camera = sc.camera.name if sc.camera else None
        self.world = sc.world.name if sc.world else None
        self.render = {k: getattr(sc.render, k) for k in _RENDER_PROPS}
        self.file_format = sc.render.image_settings.file_format
        self.view = (sc.view_settings.view_transform, sc.view_settings.look)
        sh = sc.display.shading
        self.shading = {k: (_vals(getattr(sh, k)) if k == "single_color" else getattr(sh, k)) for k in _SHADING_PROPS
                        if hasattr(sh, k)}
        self.world_colors = {w.name: _vals(w.color) for w in bpy.data.worlds}

    capture = classmethod(lambda cls: cls())

    def as_dict(self) -> dict:
        return {"names": {k: sorted(v) for k, v in self.names.items()}, "armatures": self.arm, "objects": self.objects,
                "active": self.active, "frame": self.frame, "camera": self.camera, "world": self.world, "render": self.render,
                "file_format": self.file_format, "view": self.view, "shading": self.shading, "world_colors": self.world_colors}

    def restore(self) -> dict:
        """Undo every change since the snapshot. Returns {removed: {collection: [names]}, errors: [text]}."""
        errors, removed = [], {}

        def step(what, fn):
            try:
                fn()
            except Exception as e:  # keep restoring the rest
                errors.append(f"{what}: {type(e).__name__}: {e}")

        sc = bpy.data.scenes.get(self.scene) or bpy.context.scene

        def scene_refs():
            sc.camera = bpy.data.objects.get(self.camera) if self.camera else None
            sc.world = bpy.data.worlds.get(self.world) if self.world else None

        step("scene camera/world", scene_refs)
        for coll in DATA_COLLECTIONS:  # objects first: their data blocks lose their users
            data = getattr(bpy.data, coll)
            new = [k for k in data.keys() if k not in self.names[coll]]
            for nm in new:  # includes the "Render Result" image a render creates
                step(f"remove {coll} {nm}", lambda d=data, n=nm: d.remove(d[n]))
            if new:
                removed[coll] = new
        for name, st in self.arm.items():
            ob = bpy.data.objects.get(name)
            if ob is None:
                errors.append(f"armature {name} is gone")
                continue

            def bones(ob=ob, st=st):
                for b in ob.data.bones:
                    v = st["bones"].get(b.name)
                    if v is not None:
                        if b.bbone_segments != v[0]:
                            b.bbone_segments = v[0]
                        if b.use_deform != v[1]:
                            b.use_deform = v[1]

            def pose(ob=ob, st=st):
                for pb in ob.pose.bones:
                    v = st["pose"].get(pb.name)
                    if v is None:
                        continue
                    pb.location, pb.rotation_mode = v[0], v[1]
                    pb.rotation_quaternion, pb.rotation_euler, pb.rotation_axis_angle, pb.scale = v[2], v[3], v[4], v[5]

            def anim(ob=ob, st=st):
                a = st["anim"]
                if a is None:
                    if ob.animation_data is not None:
                        ob.animation_data_clear()
                    return
                ad = ob.animation_data or ob.animation_data_create()
                ad.action = bpy.data.actions.get(a["action"]) if a["action"] else None
                if ad.action is not None and a["slot"]:
                    slot = next((s for s in ad.action.slots if s.identifier == a["slot"]), None)
                    if slot is not None:
                        ad.action_slot = slot

            def props(ob=ob, st=st):
                for k, v in st["props"].items():
                    if k not in ob.keys() or ob[k] != v:
                        ob[k] = v

            step(f"{name} bones", bones)
            step(f"{name} pose", pose)
            step(f"{name} action", anim)
            step(f"{name} properties", props)
        vl = bpy.context.view_layer
        for name, (hid, sel, hv, hr) in self.objects.items():
            ob = bpy.data.objects.get(name)
            if ob is None:
                continue

            def vis(ob=ob, hid=hid, sel=sel, hv=hv, hr=hr):
                if ob.hide_viewport != hv:
                    ob.hide_viewport = hv
                if ob.hide_render != hr:
                    ob.hide_render = hr
                if hid is not None and ob.name in vl.objects:
                    if bool(ob.hide_get()) != hid:
                        ob.hide_set(hid)
                    if bool(ob.select_get()) != sel:
                        ob.select_set(sel)

            step(f"object {name} visibility", vis)
        step("active object", lambda: setattr(vl.objects, "active", bpy.data.objects.get(self.active) if self.active else None))

        def scene_settings():
            for k, v in self.render.items():
                if getattr(sc.render, k) != v:
                    setattr(sc.render, k, v)
            if sc.render.image_settings.file_format != self.file_format:
                sc.render.image_settings.file_format = self.file_format
            sc.view_settings.view_transform, sc.view_settings.look = self.view
            sh = sc.display.shading
            for k, v in self.shading.items():
                if getattr(sh, k) != (list(v) if k == "single_color" else v):
                    setattr(sh, k, v)
            for nm, col in self.world_colors.items():
                w = bpy.data.worlds.get(nm)
                if w is not None and _vals(w.color) != col:
                    w.color = col

        step("scene settings", scene_settings)
        step("frame", lambda: sc.frame_set(self.frame))
        step("update", _update)
        return {"removed": removed, "errors": errors}


@contextlib.contextmanager
def preserved_state():
    """Snapshot the file state, run the block, restore it exactly (also on errors; restore errors never hide the block's error)."""
    st = FileState()
    failed = False
    try:
        yield st
    except BaseException:
        failed = True
        raise
    finally:
        rep = st.restore()
        if rep["errors"] and not failed:
            raise RuntimeError("file state restore failed: " + "; ".join(rep["errors"]))


@contextlib.contextmanager
def emulation(mesh_name: str, runtime_name: str, method: str = "gn", actions_blend: str | None = None,
              max_weight_dev: float = WEIGHT_CHECK_TOL):
    """Runtime emulation inside a ``preserved_state`` block: optional ``actions_blend`` Actions appended, ``setup_emulation``;
    yields its summary (+ ``actions_loaded``). On exit (normal or not) the file is restored exactly: the copy, the appended
    Actions and anything else created inside are removed; bone flags, the control rig's action/slot/pose and the scene are
    restored."""
    with preserved_state():
        loaded = load_actions(actions_blend) if actions_blend else []
        emu = setup_emulation(mesh_name, runtime_name, method=method, max_weight_dev=max_weight_dev)
        emu["actions_loaded"] = loaded
        yield emu


# --------------------------------------------------------------------------------------------------------------------------
# Blender: emulation
# --------------------------------------------------------------------------------------------------------------------------


def read_groups_loop(ob, names) -> np.ndarray:
    """Dense float32 (n,k) weights of the groups ``names`` (one Python pass over vertex.groups)."""
    gi = {vg.index: c for c, vg in enumerate(ob.vertex_groups) if vg.name in names}
    col = {c: names.index(ob.vertex_groups[i].name) for i, c in gi.items()}
    W = np.zeros((len(ob.data.vertices), len(names)), dtype=np.float32)
    for v in ob.data.vertices:
        for g in v.groups:
            c = gi.get(g.group)
            if c is not None:
                W[v.index, col[c]] = g.weight
    return W


def _local_runtime_copy(src, name, bones):
    """Fallback when rigkit.skin_io is unavailable: copy + exporter-rule groups (one add() per bone and distinct weight)."""
    names = [vg.name for vg in src.vertex_groups if vg.name in bones]
    W = exporter_rule(read_groups_loop(src, names))
    cp = src.copy()
    cp.data = src.data.copy()
    cp.name = name
    for c in src.users_collection:
        c.objects.link(cp)
    cp.vertex_groups.clear()
    for j, bn in enumerate(names):
        vg = cp.vertex_groups.new(name=bn)
        col = W[:, j]
        nz = np.nonzero(col > 0)[0]
        for val in np.unique(col[nz]):
            vg.add(nz[col[nz] == val].tolist(), float(val), "REPLACE")
    return cp, {"path": "local fallback"}


def setup_emulation(mesh_name: str, runtime_name: str, copy_name: str | None = None, method: str = "gn",
                    max_weight_dev: float = WEIGHT_CHECK_TOL) -> dict:
    """Create (or rebuild) the runtime-emulation copy of ``mesh_name`` (see the module docstring). Returns a summary dict. Raises
    ValueError (after removing the copy) when the copy's weights differ from the exporter rule by more than ``max_weight_dev``.
    Prefer ``emulation(...)``: it also restores the file when something fails later."""
    _need_bpy()
    src = bpy.data.objects[mesh_name]
    rt = bpy.data.objects[runtime_name]
    name = copy_name or mesh_name + EMUL_SUFFIX
    if name in bpy.data.objects:
        teardown_emulation(name)
    bone_names = [b.name for b in rt.data.bones]
    src_groups = [vg.name for vg in src.vertex_groups]
    used = [g for g in src_groups if g in bone_names]
    path = "rigkit.skin_io.runtime_copy"
    try:
        from rigkit import skin_io

        cp, rep = skin_io.runtime_copy(src, name=name, bones=bone_names, method=method)
    except Exception as e:  # B's module missing or broken: local rule, recorded in the summary
        cp, rep = _local_runtime_copy(src, name, bone_names)
        path = f"local fallback ({type(e).__name__}: {e})"
    cp.name = name
    cp["rigkit_emulation_of"] = mesh_name
    cp["rigkit_runtime"] = runtime_name
    cp["rigkit_bone_restore"] = "{}"
    # cross-check of the copy's weights against a loop read of the source + the exporter rule
    W_src = read_groups_loop(src, used)
    W_ref = exporter_rule(W_src)
    W_cp = read_groups_loop(cp, used)
    dev = float(np.abs(W_cp - W_ref).max()) if W_cp.size else 0.0
    if not dev <= max_weight_dev:
        teardown_emulation(name)
        raise ValueError(f"emulation copy weights differ from the exporter rule by {dev:.3g} > {max_weight_dev:g} "
                         f"(weights path: {path})")
    extra_groups = [vg.name for vg in cp.vertex_groups if vg.name not in used]
    # modifiers / parent: one Armature modifier only
    for m in list(cp.modifiers):
        cp.modifiers.remove(m)
    am = cp.modifiers.new("rt_emul_armature", "ARMATURE")
    am.object = rt
    am.use_vertex_groups = True
    am.use_bone_envelopes = False
    am.use_deform_preserve_volume = False
    am.use_multi_modifier = False
    if cp.parent is not None and cp.parent_type == "ARMATURE":
        cp.parent_type = "OBJECT"
    # bones: bbone_segments = 1; weighted non-deform bones deform (as the exporter skins them)
    carries_weight = {g for j, g in enumerate(used) if np.any(W_cp[:, j] > 0)}
    orig = {}
    for b in rt.data.bones:
        o = {}
        if b.bbone_segments != 1:
            o["bbone_segments"] = b.bbone_segments
        if not b.use_deform and b.name in carries_weight:
            o["use_deform"] = False
        if o:
            orig[b.name] = o
            cp["rigkit_bone_restore"] = json.dumps(orig)  # recorded before the change: teardown can always undo it
            if "bbone_segments" in o:
                b.bbone_segments = 1
            if "use_deform" in o:
                b.use_deform = True
    cp.hide_set(True)
    cp.hide_render = True
    _update()
    src_mods = [(m.type, getattr(m, "use_deform_preserve_volume", None)) for m in src.modifiers]
    return {
        "copy": cp.name, "source": src.name, "runtime": rt.name, "weights_path": path, "copy_report": _jsonable(rep),
        "groups_used": used, "groups_ignored": [g for g in src_groups if g not in bone_names], "extra_groups_on_copy": extra_groups,
        "weights_check_max": dev, "weights_check_tol": max_weight_dev,
        "rule_change_max": float(np.abs(W_ref - W_src).max()) if W_src.size else 0.0,
        "vertices_changed_by_rule": int((np.abs(W_ref - W_src) > 1e-6).any(1).sum()) if W_src.size else 0,
        "vertices_without_weight": int((W_ref.sum(1) == 0).sum()) if W_ref.size else len(src.data.vertices),
        "max_influences_source": int((W_src > EXPORT_MIN_WEIGHT).sum(1).max()) if W_src.size else 0,
        "bones_changed": orig, "source_modifiers": src_mods, "shape_keys": bool(src.data.shape_keys),
        "parent": cp.parent.name if cp.parent else None, "parent_type": cp.parent_type,
    }


def _jsonable(x):
    try:
        json.dumps(x)
        return x
    except TypeError:
        return json.loads(json.dumps(x, default=lambda o: o.item() if hasattr(o, "item") else str(o)))


def teardown_emulation(copy_name: str) -> dict:
    """Restore the runtime bones' bbone_segments / use_deform recorded by ``setup_emulation`` and delete the copy + its mesh."""
    _need_bpy()
    cp = bpy.data.objects.get(copy_name)
    if cp is None:
        return {"removed": False}
    rt = bpy.data.objects.get(cp.get("rigkit_runtime", ""))
    restored = json.loads(cp.get("rigkit_bone_restore", "{}"))
    if rt is not None:
        for bn, o in restored.items():
            b = rt.data.bones.get(bn)
            if b is None:
                continue
            for k, v in o.items():
                setattr(b, k, v)
    me = cp.data
    bpy.data.objects.remove(cp, do_unlink=True)
    if me is not None and me.users == 0:
        bpy.data.meshes.remove(me)
    _update()
    return {"removed": True, "restored": restored}


def eval_world(ob, dg=None) -> np.ndarray:
    """Evaluated vertex positions of ``ob`` in world space, float64 (n,3)."""
    dg = dg or bpy.context.evaluated_depsgraph_get()
    ev = ob.evaluated_get(dg)
    me = ev.to_mesh()
    try:
        n = len(me.vertices)
        if n != len(ob.data.vertices):
            raise ValueError(f"evaluated {ob.name!r} has {n} vertices, the mesh {len(ob.data.vertices)}")
        a = np.empty(n * 3, dtype=np.float64)
        me.vertices.foreach_get("co", a)
    finally:
        ev.to_mesh_clear()
    mw = np.array(ob.matrix_world, dtype=np.float64)
    return a.reshape(n, 3) @ mw[:3, :3].T + mw[:3, 3]


def bone_state(arm, dg=None):
    """World heads (b,3), tails (b,3), pose matrices (b,4,4) of the evaluated armature (bone order of arm.data.bones)."""
    dg = dg or bpy.context.evaluated_depsgraph_get()
    ev = arm.evaluated_get(dg)
    mw = ev.matrix_world
    names = [b.name for b in arm.data.bones]
    H = np.zeros((len(names), 3))
    T = np.zeros((len(names), 3))
    M = np.zeros((len(names), 4, 4))
    for i, nm in enumerate(names):
        pb = ev.pose.bones[nm]
        H[i] = mw @ pb.head
        T[i] = mw @ pb.tail
        M[i] = np.array(mw @ pb.matrix)
    return H, T, M


def rest_bone_data(arm):
    """(names, rest world matrices (b,4,4), parents (b,), deform (b,), {name: (head, tail)} world) of an armature."""
    mw = arm.matrix_world
    names = [b.name for b in arm.data.bones]
    rest = np.array([np.array(mw @ b.matrix_local) for b in arm.data.bones])
    parents = np.array([names.index(b.parent.name) if b.parent else -1 for b in arm.data.bones], dtype=np.int32)
    deform = np.array([b.use_deform for b in arm.data.bones], dtype=bool)
    ht = {b.name: (list(mw @ b.head_local), list(mw @ b.tail_local)) for b in arm.data.bones}
    return names, rest, parents, deform, ht


# --------------------------------------------------------------------------------------------------------------------------
# Blender: posing
# --------------------------------------------------------------------------------------------------------------------------


class PoseContext:
    """Objects and caches for applying pose specs: control armature, runtime armature, emulated copy, IK switch names and the
    signs resolved by displacement tests."""

    def __init__(self, control_name: str, runtime_name: str, copy_name: str, switches=None):
        _need_bpy()
        self.ct = bpy.data.objects[control_name]
        self.rt = bpy.data.objects[runtime_name]
        self.cp = bpy.data.objects[copy_name]
        self.src = bpy.data.objects.get(self.cp.get("rigkit_emulation_of", ""))
        self.switches = list(switches) if switches else [k for k in self.ct.keys() if k.startswith("ik_")]
        self.signs = {}
        self.sign_log = {}
        self.settle_max = 0.0
        try:
            from rigkit import bl

            self._driven = bl.driven_rotation_bones(self.ct)
        except Exception:  # A1's helper missing: no driven control bones assumed
            self._driven = set()

    def reset(self):
        """Control rig to identity (driven rotation bones keep their mode), IK switches to 1, no action; evaluated."""
        ct = self.ct
        if ct.animation_data is not None:
            ct.animation_data.action = None
        for pb in ct.pose.bones:
            pb.location = (0.0, 0.0, 0.0)
            if pb.name in self._driven:
                pb.rotation_euler = (0.0, 0.0, 0.0)
            else:
                pb.rotation_mode = "QUATERNION"
            pb.rotation_quaternion = (1.0, 0.0, 0.0, 0.0)
            pb.scale = (1.0, 1.0, 1.0)
        for k in self.switches:
            if k in ct.keys():
                ct[k] = 1.0
        _update()

    def set_ik(self, ik):
        if ik in (None, "default"):
            return
        if ik == "fk":
            ik = {s: 0.0 for s in self.switches}
        for k, v in ik.items():
            if k in self.ct.keys():
                self.ct[k] = float(v)
        _update()

    # ------------------------------------------------------------ ops
    def _pb(self, name):
        try:
            return self.ct.pose.bones[name]
        except KeyError:
            raise KeyError(f"control bone {name!r} not found on {self.ct.name}") from None

    def local_rot(self, bones, axis, deg):
        ax = {"X": (1.0, 0.0, 0.0), "Y": (0.0, 1.0, 0.0), "Z": (0.0, 0.0, 1.0)}[axis]
        q = Quaternion(ax, math.radians(deg / len(bones)))
        for b in bones:
            pb = self._pb(b)
            pb.rotation_mode = "QUATERNION"
            pb.rotation_quaternion = q @ pb.rotation_quaternion
        _update()

    def world_rot(self, bone, axis, deg, pivot=None):
        """Rotate a control bone about a world axis through its head (D01 d01_poses.rotate)."""
        pb = self._pb(bone)
        ax = Vector({"x": (1, 0, 0), "y": (0, 1, 0), "z": (0, 0, 1)}[axis]) if isinstance(axis, str) else Vector(axis)
        pv = Vector(pivot) if pivot is not None else pb.head.copy()
        R = Matrix.Translation(pv) @ Matrix.Rotation(math.radians(deg), 4, ax) @ Matrix.Translation(-pv)
        pb.matrix = R @ pb.matrix
        _update()

    def hinge_rot(self, bone, deg):
        """Rotate about the bone's own local X expressed in world (D01 pb_hinge)."""
        pb = self._pb(bone)
        ax = (self.ct.matrix_world.to_3x3() @ pb.matrix.to_3x3() @ Vector((1.0, 0.0, 0.0))).normalized()
        self.world_rot(bone, ax, deg)

    def move(self, bone, delta):
        pb = self._pb(bone)
        m = pb.matrix.copy()
        m.translation = m.translation + Vector(delta)
        pb.matrix = m
        _update()

    def place(self, bone, pos):
        pb = self._pb(bone)
        m = pb.matrix.copy()
        m.translation = Vector(pos)
        pb.matrix = m
        _update()

    def action(self, name):
        act = bpy.data.actions.get(name)
        if act is None:
            raise KeyError(f"action {name!r} not in the file (load it with load_actions)")
        ct = self.ct
        if ct.animation_data is None:
            ct.animation_data_create()
        ct.animation_data.action = act
        try:
            if act.slots:
                ct.animation_data.action_slot = act.slots[0]
        except AttributeError:  # pre-slot Blender
            pass
        bpy.context.scene.frame_set(1)
        _update()

    def track_point(self, bones):
        """World tail of the runtime counterpart of the first control bone (or of the control bone itself)."""
        nm = bones[0][4:] if bones[0].startswith("ctl_") else bones[0]
        arm, bn = (self.rt, nm) if nm in self.rt.pose.bones else (self.ct, bones[0])
        dg = bpy.context.evaluated_depsgraph_get()
        ev = arm.evaluated_get(dg)
        return np.array(ev.matrix_world @ ev.pose.bones[bn].tail)

    def resolve_sign(self, op, ik):
        """+1 / -1 so that a positive ROM value moves the tracked tail along the ``positive`` text (cached per sign_key). An
        explicit ``op['sign']`` (+1 / -1) is used as given (confirmation); a weak displacement test raises ValueError."""
        key = op.get("sign_key") or "|".join(op["bones"]) + op["axis"]
        if key in self.signs:
            return self.signs[key]
        if op.get("sign") in (1, -1):
            self.signs[key] = float(op["sign"])
            self.sign_log[key] = {"sign": int(op["sign"]), "reason": "explicit sign in the spec (confirmed)"}
            return self.signs[key]
        d = positive_direction(op.get("positive"), op.get("side"))
        if d is None:
            self.signs[key] = 1.0
            self.sign_log[key] = {"sign": 1, "reason": "no direction in the positive text (symmetric)"}
            return 1.0
        self.reset()
        self.set_ik(ik)
        p0 = self.track_point(op["bones"])
        self.local_rot(op["bones"], op["axis"], SIGN_TEST_DEG)
        p1 = self.track_point(op["bones"])
        self.reset()
        res = sign_from_test(p0, p1, d)
        res["direction"] = list(d)
        self.sign_log[key] = res
        if res["weak"]:
            raise ValueError(f"weak ROM sign test for {key!r}: the tracked tail moved {res['moved_m']:.3g} m with cos "
                             f"{res['cos']:.2f} to {list(d)} ({op.get('positive')!r}); confirm with an explicit op['sign'] = +1 or -1")
        self.signs[key] = float(res["sign"])
        return self.signs[key]

    def apply(self, spec):
        """Reset, set IK switches, run the ops of ``spec``; returns the settle delta (m)."""
        signs = {}
        for op in spec["ops"]:
            if op["op"] == "local_rot" and (op.get("positive") or op.get("sign") in (1, -1)):
                signs[id(op)] = self.resolve_sign(op, spec.get("ik"))
        self.reset()
        self.set_ik(spec.get("ik"))
        for op in spec["ops"]:
            k = op["op"]
            if k == "local_rot":
                self.local_rot(op["bones"], op["axis"], op["deg"] * signs.get(id(op), 1.0))
            elif k == "world_rot":
                self.world_rot(op["bone"], op["axis"], op["deg"], op.get("pivot"))
            elif k == "hinge_rot":
                self.hinge_rot(op["bone"], op["deg"])
            elif k == "move":
                self.move(op["bone"], op["delta"])
            elif k == "place":
                self.place(op["bone"], op["pos"])
            elif k == "action":
                self.action(op["action"])
            else:
                raise ValueError(f"unknown pose op {k!r}")
        return self.settle()

    def settle(self, tries: int = 4) -> float:
        """Evaluate until two consecutive evaluations of the copy agree within SETTLE_TOL; returns the last difference."""
        a = eval_world(self.cp)
        d = 0.0
        for _ in range(tries):
            _update()
            b = eval_world(self.cp)
            d = float(np.abs(b - a).max())
            if d <= SETTLE_TOL:
                break
            a = b
        self.settle_max = max(self.settle_max, d)
        return d


def load_actions(blend_path: str, prefix: str = ACTION_PREFIX) -> list:
    """Append the Actions whose names start with ``prefix`` from ``blend_path`` (skips names already present). Returns the names
    appended by this call."""
    _need_bpy()
    before = set(bpy.data.actions.keys())
    with bpy.data.libraries.load(blend_path, link=False) as (src, dst):
        dst.actions = [n for n in src.actions if n.startswith(prefix) and n not in bpy.data.actions]
    return sorted(set(bpy.data.actions.keys()) - before)


# --------------------------------------------------------------------------------------------------------------------------
# export
# --------------------------------------------------------------------------------------------------------------------------


def export_chunk(pc: PoseContext, specs, i0: int, i1: int, out_dir: str, meta: dict) -> dict:
    """Evaluate specs[i0:i1] and write ``poses_chunk_<i0>.npz`` (a valid poses file with the extras). Returns a summary."""
    t0 = time.time()
    names, rest_mats, parents, deform, _ = rest_bone_data(pc.rt)
    P, Hs, Ts, Ms, done, settle, vs_src = [], [], [], [], [], {}, {}
    for spec in specs[i0:i1]:
        settle[spec["name"]] = pc.apply(spec)
        dg = bpy.context.evaluated_depsgraph_get()
        pos = eval_world(pc.cp, dg)
        P.append(pos.astype(np.float32))
        if pc.src is not None:  # the source mesh keeps its own modifiers: how far is it from the runtime emulation?
            vs_src[spec["name"]] = float(np.abs(eval_world(pc.src, dg) - pos).max())
        h, t, m = bone_state(pc.rt, dg)
        Hs.append(h)
        Ts.append(t)
        Ms.append(m)
        done.append(spec["name"])
    pc.reset()
    m = dict(meta)
    m["chunk"] = [i0, i1]
    m["tags"] = {s["name"]: s.get("tags", []) for s in specs[i0:i1]}
    m["specs"] = {s["name"]: s for s in specs[i0:i1]}
    m["settle_m"] = settle
    m["emulation_vs_source_m"] = vs_src
    path = os.path.join(out_dir, f"poses_chunk_{i0:04d}.npz")
    npzio.save_poses(path, done, np.array(P), names, np.array(Hs, dtype=np.float32), np.array(Ts, dtype=np.float32), meta=m,
                     extra={"pose_mats": np.array(Ms), "rest_mats": rest_mats, "parents": parents, "deform": deform})
    return {"path": path, "poses": done, "seconds": round(time.time() - t0, 3), "settle_max_m": max(settle.values(), default=0.0),
            "emulation_vs_source_m": vs_src}


def export_weights_npz(ob, path, names, candidate: str, meta_more: dict | None = None) -> str:
    """Write the weights of ``ob``'s groups ``names`` (loop read) as weights.npz."""
    W = read_groups_loop(ob, names)
    meta = {"candidate": candidate, "object": ob.name, **(meta_more or {})}
    return npzio.save_weights(path, names, W, meta=meta)


def plan(set_name: str, rt, ct, skel=None, H: float | None = None) -> tuple[list, dict]:
    """Pose specs for a set (``legacy_d01`` or ``rom``) plus a planning report."""
    if set_name == "legacy_d01":
        from rigkit import legacy_d01

        return legacy_d01.specs(), {"set": set_name}
    if set_name != "rom":
        raise ValueError(f"unknown pose set {set_name!r}")
    if skel is None or H is None:
        raise ValueError("the rom set needs a skeleton/family and H")
    controls = {b.name for b in ct.data.bones}
    rom, skipped = plan_rom(skel, controls)
    _, _, _, _, ht = rest_bone_data(rt)
    comp, skipped_c = plan_compound(skel.get("rom_compound", []), ht, H, skel)
    missing_ops = []
    for s in comp:
        bad = [op.get("bone") for op in s["ops"] if op.get("bone") and op["bone"] not in controls]
        if bad:
            missing_ops.append({"id": s["name"], "missing_controls": bad})
    comp = [s for s in comp if not any(op.get("bone") and op["bone"] not in controls for op in s["ops"])]
    rep = {"set": set_name, "skipped_rom": skipped, "skipped_compound": skipped_c + missing_ops, "n_rom": len(rom)}
    chain_specs = []
    if any(b.get("chain") for b in skel.get("bones", [])):  # phase G: garment compounds + chain poses
        bad = [s["name"] for s in comp if any(b not in controls for op in s["ops"] for b in op.get("bones", []))]
        comp = [s for s in comp if s["name"] not in bad]
        chain_specs, crep = plan_chain_poses(skel)
        bad_c = [s["name"] for s in chain_specs if any(b not in controls for op in s["ops"] for b in op["bones"])]
        chain_specs = [s for s in chain_specs if s["name"] not in bad_c]
        rep["chain_poses"] = dict(crep, skipped_missing_controls=bad_c)
        rep["garment_compounds_skipped"] = bad
    else:  # no chain bones: the garment compounds are not planned, body results stay as they were
        comp = [s for s in comp if s["name"] not in GARMENT_COMPOUNDS]
    rep["n_compound"] = len(comp)
    return [rest_spec()] + rom + comp + chain_specs, rep


def measured_H(me) -> tuple[float, str]:
    """Catalogue height fallback: highest world z of ``me``'s vertices (S2 grounds the mesh at z = 0) and a note saying so."""
    mw = np.array(me.matrix_world, dtype=np.float64)
    co = np.empty(len(me.data.vertices) * 3)
    me.data.vertices.foreach_get("co", co)
    z = (co.reshape(-1, 3) @ mw[:3, :3].T + mw[:3, 3])[:, 2]
    return float(z.max()), f"measured: highest vertex z of {me.name!r} in world space (no H given; ground assumed at z = 0, min z {z.min():.4g} m)"


def export_current(out_dir, set_name, mesh=None, runtime=None, control=None, actions_blend=None, skeleton=None, family=None,
                   asset_id=None, H=None, chunk=8, only=None, write_mesh=True, write_weights=True, keep_chunks=False,
                   method="gn", source_blend=None, specs=None) -> dict:
    """S7 poses of the file that is OPEN now (headless after ``open_mainfile``, or a live session over MCP): emulation context,
    plan, chunks, merge to ``out_dir/poses.npz``. ``set_name`` "custom" takes the pose specs from ``specs`` (list of spec dicts,
    the first one should be ``rest_spec()``). The file is left exactly as it was (``emulation``)."""
    _need_bpy()
    t0 = time.time()
    os.makedirs(out_dir, exist_ok=True)
    from rigkit import bl

    me = bpy.data.objects[mesh] if mesh else bl.find("mesh", asset_id)
    rt = bpy.data.objects[runtime] if runtime else bl.find("runtime", asset_id)
    ct = bpy.data.objects[control] if control else bl.find("control", asset_id)
    asset_id = asset_id or me.get("rigkit_asset") or me.name
    if H is None:
        H, H_source = measured_H(me)
    else:
        H, H_source = float(H), "given"
    skel = None
    if skeleton:
        skel = template.load_skeleton(skeleton)
    elif family:
        skel = template.expand_sides(template.load_family(family))
    meta = {"asset_id": asset_id, "H": H, "H_source": H_source, "space": "world", "set": set_name, "mesh_object": me.name,
            "runtime_object": rt.name, "control_object": ct.name,
            "source_blend": os.path.abspath(source_blend) if source_blend else bpy.data.filepath or None,
            "source_blend_sha256": bl.sha256_file(source_blend) if source_blend else None,
            "actions_blend": os.path.abspath(actions_blend) if actions_blend else None,
            "family": (skel or {}).get("family"), "blender": bpy.app.version_string}
    for old in glob.glob(os.path.join(out_dir, "poses_chunk_*.npz")):
        os.remove(old)
    res = {"ok": True, "H": H, "H_source": H_source}
    with emulation(me.name, rt.name, method=method, actions_blend=actions_blend) as emu:
        pc = PoseContext(ct.name, rt.name, emu["copy"], switches=_ik_switches(skel) if skel else None)
        meta["emulation_copy"] = pc.cp.name
        pc.reset()
        rest_src = eval_world(me)
        rest_cp = eval_world(pc.cp)
        if set_name == "custom":
            if not specs:
                raise ValueError("set 'custom' needs specs")
            rep = {"set": "custom", "n": len(specs)}
        else:
            specs, rep = plan(set_name, rt, ct, skel, H)
        if only:
            specs = [s for s in specs if s["name"] in only]
        chunks = []
        for i0 in range(0, len(specs), chunk):  # one export_chunk call per slice: the same calls an MCP session would make
            chunks.append(export_chunk(pc, specs, i0, min(i0 + chunk, len(specs)), out_dir, meta))
        per_pose_src = {k: v for c in chunks for k, v in c["emulation_vs_source_m"].items()}
        src_dev = max(per_pose_src.values(), default=0.0)
        paths = [c["path"] for c in chunks]
        out = os.path.join(out_dir, "poses.npz")
        merge_chunks(paths, out, {"emulation": _jsonable(emu), "plan": rep, "signs": pc.sign_log, "settle_max_m": pc.settle_max,
                                  "emulation_vs_source_max_m": src_dev, "emulation_vs_source_by_pose_m": per_pose_src})
        if not keep_chunks:
            for p in paths:
                os.remove(p)
        res.update({"poses": out, "n_poses": len(specs), "chunks": len(chunks), "emulation": {k: emu[k] for k in (
            "weights_path", "weights_check_max", "rule_change_max", "vertices_without_weight", "bones_changed", "groups_ignored",
            "actions_loaded")}, "rest_emulation_vs_source_max_m": float(np.abs(rest_src - rest_cp).max()),
            "emulation_vs_source_max_m": src_dev, "settle_max_m": pc.settle_max, "signs": pc.sign_log, "plan": rep})
        if write_weights:
            used = emu["groups_used"]
            res["weights"] = export_weights_npz(pc.cp, os.path.join(out_dir, "weights.npz"), used,
                                                candidate=f"emulated:{me.name}", meta_more={"rule": "exporter (drop<=1e-4, top4, renorm)"})
            res["weights_source"] = export_weights_npz(me, os.path.join(out_dir, "weights_source.npz"), used,
                                                       candidate=f"source:{me.name}")
    if write_mesh:
        from rigkit import meshio

        res["mesh"] = meshio.export_mesh_npz(me, os.path.join(out_dir, "mesh.npz"), asset_id, H, source_sha256=None,
                                             source_blend=meta["source_blend"], H_source=H_source)["path"]
    res["seconds"] = round(time.time() - t0, 2)
    npzio.write_json(os.path.join(out_dir, "poses_summary.json"), res)
    return res


def run(blend, out_dir, set_name, **kw) -> dict:
    """Headless driver: open ``blend`` and run ``export_current`` on it (keyword arguments as there)."""
    _need_bpy()
    bpy.ops.wm.open_mainfile(filepath=blend)
    return export_current(out_dir, set_name, source_blend=blend, **kw)


def main(argv=None):
    from rigkit import bl

    ap = argparse.ArgumentParser(description="S7 QA poses under runtime emulation -> poses.npz (Blender)")
    ap.add_argument("--blend", required=True)
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("--set", default="rom", choices=("rom", "legacy_d01"))
    ap.add_argument("--mesh")
    ap.add_argument("--runtime")
    ap.add_argument("--control")
    ap.add_argument("--asset-id")
    ap.add_argument("--H", type=float, help="catalogue height in m (default: measured from the mesh, recorded as H_source)")
    ap.add_argument("--actions-blend", help="blend with QA_pose_* Actions (legacy_d01)")
    ap.add_argument("--skeleton", help="resolved skeleton.json (rom set)")
    ap.add_argument("--family", help="family template name/path (rom set, when no skeleton.json)")
    ap.add_argument("--chunk", type=int, default=8)
    ap.add_argument("--only", default="", help="comma list of pose names")
    ap.add_argument("--method", default="gn", help="skin_io read method (gn | loop)")
    ap.add_argument("--keep-chunks", action="store_true")
    a = ap.parse_args(bl.script_args(argv) if argv is None else argv)
    try:
        res = run(a.blend, a.out_dir, a.set, mesh=a.mesh, runtime=a.runtime, control=a.control, actions_blend=a.actions_blend,
                  skeleton=a.skeleton, family=a.family, asset_id=a.asset_id, H=a.H, chunk=a.chunk,
                  only=[x for x in a.only.split(",") if x] or None, keep_chunks=a.keep_chunks, method=a.method)
        print(json.dumps({k: res[k] for k in ("ok", "poses", "n_poses", "chunks", "H", "H_source", "rest_emulation_vs_source_max_m",
                                             "emulation_vs_source_max_m", "settle_max_m", "seconds")} | {"emulation": res["emulation"]},
                         default=str))
        return 0
    except Exception as e:
        import traceback

        traceback.print_exc()
        print(json.dumps({"ok": False, "error": f"{type(e).__name__}: {e}"}))
        return 1


if __name__ == "__main__":
    code = main()
    if bpy is not None and bpy.app.background:
        from rigkit import bl

        bl.exit_now(code)  # os._exit without Blender's teardown, after removing the session temp folder Blender would remove
    sys.exit(code)
