"""rigkit.skeleton - S4: pre-bend of elbows/knees, the runtime armature built from a resolved skeleton dict, rolls, bend tests with
roll flips, and the S4 checks.

Units: metres, degrees in reports.  Frame: Blender, Z up, character front -Y, character left +X.

Pipeline (the pre-bend runs BEFORE ``rigcore.template.resolve``, because the hinge of a limb is the normal of its bend plane)::

    lm, pre = apply_prebend(landmarks, family, params)          # pure Python
    skel = rigcore.template.resolve(family, lm, H)
    rt, rep = build_runtime(skel, "D01_runtime", collection)     # Blender: edit bones, rolls, collections, bend tests + flips
    skel = apply_flips(skel, rep["flipped"])                     # skeleton.json = the built armature (effective hinges)
    chk = check_runtime(rt, skel, mesh_ob, exempt=...)           # heads inside the mesh, root, scale, symmetry

Roll rule (joint-placement.md): the bone's local X is the hinge made perpendicular to the bone, set with
``EditBone.align_roll(rigcore.geom.roll_z_vector(head, tail, hinge))``. The bend test rotates the bone +20 deg about its local X in
pose space and checks the direction its TAIL moves against the ``(+X|-X|+Y|-Y|+Z|-Z)`` token of ``bend_test``; a failing bone gets
its roll flipped by 180 deg and is tested again (twist children follow their parent's flip). A flipped bone's local X is the
negated template hinge: ``apply_flips`` writes that effective hinge back with ``roll_flipped: true``, so a skeleton.json written
after the build describes the built armature (rebuilding from it needs no flip).

Bone collections of the runtime armature follow D01's G2 file: ``Deform`` (core and twist deform bones), ``Aux`` (aux bones),
``Sockets``, ``Root`` (other non-deform bones: root, cog).

``apply_prebend``, ``limb_chains``, ``bend_angle_deg``, ``parse_bend_test``, ``apply_flips`` are pure Python (rigkit-env tests import
them).

Step CLI (S4 on a rig .blend made by ``intake``; adds the runtime armature, parents the mesh, saves in place)::

    blender -b --factory-startup -P rigkit/skeleton.py -- --blend <rig>.blend --landmarks landmarks.json --family S
            [--prebend '{"mode": "measured"}'] [--chains chains.json] [--out-dir <rig dir>]
            ->  skeleton.json, landmarks_used.json, s4_report.json, recipe

Phase G: ``--chains`` merges the chain bones of S3g's chains.json (``merge_chains_any``: G1's ``solvers.chains.merge_chains`` when
it imports inside Blender, else ``merge_chains`` here) before the build; chain roots carry a bend test "swings outward" and their
results are copied to ``s4_report.json`` ``chains.root_bend_tests``. Without ``--chains`` nothing changes.
"""
from __future__ import annotations

import copy
import math
import os
import re
import sys

if __name__ == "__main__":  # run as a script: put scripts/ on sys.path (no __pycache__ next to the sources)
    sys.dont_write_bytecode = True
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rigcore import geom, template  # noqa: E402

from rigkit import bl  # noqa: E402

try:
    import bpy
    from mathutils import Quaternion, Vector
    from mathutils.bvhtree import BVHTree
except ImportError:  # pragma: no cover - pure-Python use
    bpy = None

# --------------------------------------------------------------------------------------------------------------------------
# pre-bend (pure Python)
# --------------------------------------------------------------------------------------------------------------------------

PREBEND_DEFAULTS = {
    "mode": "measured",  # "measured" | "legacy_d01" | "off"
    "arm": {"min_deg": 4.0, "target_deg": 5.0, "direction": "+Y"},  # elbow moves back
    "leg": {"min_deg": 4.0, "target_deg": 5.0, "direction": "-Y"},  # knee moves forward
    "keep_direction_cos": 0.5,  # a measured bend >= min_deg is kept only if it bends within 60 deg of the expected direction
    "legacy_elbow_offset_m": [0.0, 0.0033, 0.0],  # D01 fitted_landmarks: elbow on the shoulder-wrist line + 3.3 mm toward +Y
}


def _merge(base: dict, over) -> dict:
    out = copy.deepcopy(base)
    for k, v in (over or {}).items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = _merge(out[k], v)
        else:
            out[k] = copy.deepcopy(v)
    return out


def prebend_params(family=None, params=None) -> dict:
    """Effective pre-bend parameters: ``PREBEND_DEFAULTS`` <- ``family["builder"]["prebend"]`` <- ``params``."""
    fam = ((family or {}).get("builder") or {}).get("prebend") or {}
    return _merge(_merge(PREBEND_DEFAULTS, fam), params)


def bend_angle_deg(a, m, b) -> float:
    """Bend of the chain a-m-b in degrees: the angle between (m - a) and (b - m); 0 = straight."""
    return geom.angle_deg(geom.sub(m, a), geom.sub(b, m))


def _lm_operand(expr: str):
    e = expr.strip()
    return e[3:] if e.startswith("lm:") else None


def limb_chains(family) -> list[dict]:
    """Two-bone IK chains of a family as landmark triples: ``[{name, kind ("arm"/"leg"), side, ids: [proximal, joint, distal]}]``.
    ``ids`` come from the chain's bone expressions (upper head, lower head, lower tail; each must be a plain ``lm:<id>``). ``kind``
    is the ik entry's ``kind`` or its name prefix (``arm_`` / ``leg_``). A chain that is not two bones with plain landmark ends
    gets ``ids: None`` and a ``reason`` (the pre-bend skips it)."""
    fam = template.expand_sides(family)
    bones = {b["name"]: b for b in fam["bones"]}
    out = []
    for ik in fam.get("ik", []):
        chain = ik.get("chain") or []
        kind = ik.get("kind") or ik["name"].split("_")[0]
        row = {"name": ik["name"], "kind": kind, "side": ik.get("side"), "ids": None}
        if len(chain) != 2 or any(c not in bones for c in chain):
            row["reason"] = f"not a chain of two known bones: {chain}"
        else:
            up, lo = bones[chain[0]], bones[chain[1]]
            ids = [_lm_operand(up["head"]), _lm_operand(lo["head"]), _lm_operand(lo["tail"])]
            if None in ids:
                row["reason"] = f"chain ends are not plain lm:<id> expressions ({up['head']}, {lo['head']}, {lo['tail']})"
            else:
                row["ids"] = ids
        out.append(row)
    return out


def _rebend(a, m, b, target_deg: float, direction) -> tuple:
    """Joint moved onto the line a-b, then perpendicular to it toward ``direction`` so that the bend is ``target_deg``.
    Returns ``(new_joint, offset_m)``."""
    e = geom.on_line(a, m, b)
    d_ab = geom.unit(geom.sub(b, a))
    p = geom.project_perp(direction, d_ab)
    if geom.norm(p) < 1e-6:
        raise ValueError(f"pre-bend direction {direction} is parallel to the limb {d_ab}")
    p = geom.unit(p)
    P = geom.dot(geom.sub(e, a), d_ab)
    Q = geom.dist(a, b) - P
    if P <= 0.0 or Q <= 0.0:
        raise ValueError(f"pre-bend: the joint does not project inside its limb (P={P:.4g} m, Q={Q:.4g} m)")
    # deviation(h) = atan(h/P) + atan(h/Q) = target  <=>  (T/(PQ)) h^2 + (1/P + 1/Q) h - T = 0, T = tan(target)
    T = math.tan(math.radians(target_deg))
    A, B = T / (P * Q), 1.0 / P + 1.0 / Q
    h = (-B + math.sqrt(B * B + 4.0 * A * T)) / (2.0 * A)
    return geom.add(e, geom.scale(p, h)), h


def _direction_cos(a, m, b, direction) -> float | None:
    """Cosine between the joint's offset from the line a-b and the expected direction (perpendicular part); None when on the line."""
    e = geom.on_line(a, m, b)
    off = geom.sub(m, e)
    p = geom.project_perp(direction, geom.unit(geom.sub(b, a)))
    if geom.norm(off) < 1e-12 or geom.norm(p) < 1e-12:
        return None
    return geom.dot(geom.unit(off), geom.unit(p))


def apply_prebend(landmarks, family, params=None) -> tuple[dict, dict]:
    """Pre-bend the elbows and knees of ``family``'s IK chains in a copy of ``landmarks`` (``{id: (x,y,z)}``, metres).

    Modes (``params["mode"]``, default from ``family["builder"]["prebend"]``, else ``"measured"``):

    * ``"measured"``: per chain kind (``arm`` / ``leg``) with ``{min_deg, target_deg, direction}``. A measured bend >= ``min_deg``
      that points within 60 deg of ``direction`` is kept; otherwise the joint is projected on the proximal-distal line and moved
      perpendicular to it toward ``direction`` (arms ``+Y``, back; legs ``-Y``, forward) until the bend is ``target_deg``.
    * ``"legacy_d01"``: D01's ``fitted_landmarks`` exactly: every arm joint ``rigcore.geom.prebend(shoulder, elbow, wrist,
      legacy_elbow_offset_m)`` (projection + 3.3 mm toward +Y), legs untouched.
    * ``"off"``: nothing changes.

    Returns ``(landmarks_out, report)``; the report holds the effective parameters and, per chain, the angles before/after, the
    move in metres and what was done. Log it in the recipe (``rigcore.recipe.log_step``)."""
    prm = prebend_params(family, params)
    mode = prm["mode"]
    if mode not in ("measured", "legacy_d01", "off"):
        raise ValueError(f"pre-bend mode must be measured, legacy_d01 or off, got {mode!r}")
    for kind in ("arm", "leg"):
        kp = prm.get(kind) or {}
        if mode == "measured" and kp and not (0.0 < float(kp["target_deg"]) < 60.0 and 0.0 <= float(kp["min_deg"]) <= float(kp["target_deg"])):
            raise ValueError(f"pre-bend {kind}: need 0 <= min_deg <= target_deg < 60, got {kp}")
    lm = {k: geom.vec(v) for k, v in landmarks.items()}
    rows = []
    for ch in limb_chains(family):
        if ch["ids"] is None:
            rows.append({"chain": ch["name"], "action": "skipped", "reason": ch["reason"]})
            continue
        ia, im, ib = ch["ids"]
        missing = [i for i in ch["ids"] if i not in lm]
        if missing:
            rows.append({"chain": ch["name"], "action": "skipped", "reason": f"missing landmarks {missing}"})
            continue
        a, m, b = lm[ia], lm[im], lm[ib]
        before = bend_angle_deg(a, m, b)
        row = {"chain": ch["name"], "kind": ch["kind"], "side": ch["side"], "ids": ch["ids"], "angle_before_deg": before}
        new = m
        if mode == "off":
            row["action"] = "off"
        elif mode == "legacy_d01":
            if ch["kind"] == "arm":
                new = geom.prebend(a, m, b, tuple(float(c) for c in prm["legacy_elbow_offset_m"]))
                row["action"] = "legacy_d01: on_line + offset"
                row["offset_m"] = list(prm["legacy_elbow_offset_m"])
            else:
                row["action"] = "legacy_d01: untouched"
        else:
            kp = prm.get(ch["kind"])
            if kp is None:
                row["action"] = f"kept (no parameters for kind {ch['kind']!r})"
            else:
                dvec = geom.axis_vector(kp["direction"]) if isinstance(kp["direction"], str) else geom.vec(kp["direction"])
                cos = _direction_cos(a, m, b, dvec)
                row["direction"] = kp["direction"]
                row["direction_cos_before"] = cos
                if before >= kp["min_deg"] and cos is not None and cos >= prm["keep_direction_cos"]:
                    row["action"] = "kept (measured bend)"
                else:
                    why = "bend below min_deg" if before < kp["min_deg"] else "bend points away from the expected direction"
                    new, h = _rebend(a, m, b, kp["target_deg"], dvec)
                    row["action"] = f"rebent ({why})"
                    row["offset_from_line_m"] = h
                    row["min_deg"], row["target_deg"] = kp["min_deg"], kp["target_deg"]
        lm[im] = new
        row["angle_after_deg"] = bend_angle_deg(a, new, b)
        row["moved_m"] = geom.dist(m, new)
        row["joint_before"], row["joint_after"] = list(m), list(new)
        rows.append(row)
    return lm, {"params": prm, "chains": rows}


def load_landmarks_any(path) -> tuple[dict, str]:
    """Landmarks from a contract ``landmarks.json`` or from D01's grouped file (detected by its ``leg_mirror_x`` key; converted with
    ``rigcore.landmarks.from_d01_landmarks``). Returns ``({id: (x,y,z)}, "contract" | "d01")``."""
    from rigcore import landmarks as rl
    from rigcore.npzio import read_json

    doc = read_json(path)
    if isinstance(doc, dict) and "leg_mirror_x" in doc and "spine" in doc:
        return rl.from_d01_landmarks(doc), "d01"
    return rl.load_landmarks(doc), "contract"


def resolve_skeleton(family, landmarks, H, prebend=None, families_dir=None) -> tuple[dict, dict, dict]:
    """``apply_prebend`` then ``rigcore.template.resolve``. ``family`` is a loaded family dict or a name/path. Returns
    ``(skeleton, landmarks_used, prebend_report)``."""
    if not isinstance(family, dict):
        family = template.load_family(family, families_dir)
    lm, rep = apply_prebend(landmarks, family, prebend)
    return template.resolve(family, lm, H), lm, rep


# --------------------------------------------------------------------------------------------------------------------------
# bend-test tokens (pure Python)
# --------------------------------------------------------------------------------------------------------------------------

_TOKEN = re.compile(r"\(\s*([+\-−])\s*([XYZ])\s*\)")


def parse_bend_test(text) -> tuple | None:
    """Expected world direction of a bend test: the first ``(+X|-X|+Y|-Y|+Z|-Z)`` token of ``text`` (the Unicode minus is accepted)
    -> ``((x, y, z), "-Y")``; None when ``text`` is empty. ValueError when there is text but no token."""
    if not text:
        return None
    m = _TOKEN.search(text)
    if not m:
        raise ValueError(f"bend_test {text!r} has no (+X|-X|+Y|-Y|+Z|-Z) token")
    sign = "-" if m.group(1) in "-−" else "+"
    tok = sign + m.group(2)
    return geom.axis_vector(tok), tok


def apply_flips(skel, flipped) -> dict:
    """Copy of the resolved skeleton ``skel`` with the bend-test roll flips of ``build_runtime`` (``rep["flipped"]``) written back:
    every bone gets ``roll_flipped`` (bool; toggled for a bone in ``flipped``, so applying the flips of a rebuild keeps the record),
    and a flipped bone's ``hinge`` is negated: it is the bone's effective local X (the roll rule ``roll_z_vector`` gives the
    flipped roll from it). Unknown names raise ValueError."""
    out = copy.deepcopy(skel)
    fl = set(flipped)
    names = {b["name"] for b in out["bones"]}
    if fl - names:
        raise ValueError(f"apply_flips: unknown bones {sorted(fl - names)}")
    for b in out["bones"]:
        now = b["name"] in fl
        if now:
            b["hinge"] = [-float(c) + 0.0 for c in b["hinge"]]  # + 0.0: no negative zeros in skeleton.json
        b["roll_flipped"] = bool(b.get("roll_flipped", False)) != now
    return out


# --------------------------------------------------------------------------------------------------------------------------
# garment chains (pure Python; references/cloth-and-attachments.md §3, CONTRACT "Phase G")
# --------------------------------------------------------------------------------------------------------------------------

def chain_outward(chain, bones=None):
    """Unit horizontal direction in which chain ``chain`` (a chains.json entry) swings OUTWARD, away from the body: the
    ``leg_push.dir`` of the plan, else the azimuth (``azimuth_deg``: 0 = front -Y, 90 = the character's left +X), else the
    horizontal offset of the root head from its parent's head (``bones`` = {name: bone dict} of the skeleton). None when none of
    them gives a direction (a chain hanging on the parent's axis)."""
    lp = chain.get("leg_push") or {}
    d = lp.get("dir")
    if d is None and chain.get("azimuth_deg") is not None:
        a = math.radians(float(chain["azimuth_deg"]))
        d = (math.sin(a), -math.cos(a), 0.0)
    if d is None and bones is not None and chain.get("bones"):
        root = chain["bones"][0]
        par = bones.get(root.get("parent"))
        if par is not None:
            d = geom.sub(root["head"], par["head"])
    if d is None:
        return None
    h = (float(d[0]), float(d[1]), 0.0)
    return geom.unit(h) if geom.norm(h) > 1e-9 else None


def axis_token(v) -> str:
    """``(+X|-X|+Y|-Y|+Z|-Z)`` token of the dominant axis of ``v`` (a bend test of a diagonal chain passes with cos 0.71)."""
    i = max(range(3), key=lambda k: abs(v[k]))
    return ("+" if v[i] >= 0 else "-") + "XYZ"[i]


def merge_chains(skel, chains) -> dict:
    """Copy of the resolved skeleton ``skel`` with the chain bones of ``chains`` (a chains.json dict, CONTRACT "Phase G")
    appended in plan order: ``kind: "aux"``, ``deform: True``, ``side`` of the chain, ``chain`` (chain id), ``piece`` (piece id),
    ``twist: None``; head / tail / hinge / parent from the plan. The ROOT of every chain gets ``bend_test`` "swings outward
    (<token>)" (``outward_bend_tests``), so S4 tests it like a core bone (+X swings the cloth away from the body, spec §3). A fan shares its root: a bone already merged with the same name, parent, head and tail is skipped; any other name
    clash raises ValueError, as does a parent that is not merged yet (parent-before-child). The skeleton gets ``chains`` =
    {source, n_chains, n_bones, ids} for the report. This is G2's fallback; ``merge_chains_any`` prefers G1's
    ``solvers.chains.merge_chains`` when it can be imported."""
    out = copy.deepcopy(skel)
    by_name = {b["name"]: b for b in out["bones"]}
    added, ids = [], []
    for ch in (chains or {}).get("chains", []):
        ids.append(ch["id"])
        side = ch.get("side") if ch.get("side") in ("L", "R") else None
        for k, b in enumerate(ch.get("bones", [])):
            nm = b["name"]
            new = {"name": nm, "parent": b["parent"], "side": side, "kind": "aux", "deform": True,
                   "head": [float(c) for c in b["head"]], "tail": [float(c) for c in b["tail"]],
                   "hinge": list(geom.unit(b["hinge"])), "bend_test": None, "twist": None, "chain": ch["id"],
                   "piece": ch.get("piece")}
            if nm in by_name:
                old = by_name[nm]
                same = (old.get("chain") is not None and old["parent"] == new["parent"]
                        and geom.dist(old["head"], new["head"]) <= 1e-9 and geom.dist(old["tail"], new["tail"]) <= 1e-9)
                if same:  # shared fan root
                    continue
                raise ValueError(f"merge_chains: bone {nm!r} of chain {ch['id']!r} clashes with an existing bone")
            if new["parent"] not in by_name:
                raise ValueError(f"merge_chains: parent {new['parent']!r} of {nm!r} (chain {ch['id']!r}) is not merged yet")
            out["bones"].append(new)
            by_name[nm] = new
            added.append(nm)
    out["chains"] = {"source": "rigkit.skeleton.merge_chains (G2 fallback)", "n_chains": len(ids), "n_bones": len(added),
                     "ids": ids}
    return outward_bend_tests(out, chains)


def outward_bend_tests(skel, chains) -> dict:
    """Give the first bone of every chain of ``chains`` (the root; the first bone 02 of a fan sub-chain) the executable bend test
    ``"swings outward (<token>)"`` (``chain_outward``; dominant world axis) and ``outward`` = the exact unit vector, in place on
    ``skel`` (a skeleton with the chain bones merged); returns ``skel``. Applied after either merge: G1's merge writes the text
    "+X swings the cloth outward", which names no world direction for ``parse_bend_test``."""
    by_name = {b["name"]: b for b in skel["bones"]}
    for ch in (chains or {}).get("chains", []):
        if not ch.get("bones"):
            continue
        b = by_name.get(ch["bones"][0]["name"])
        if b is None:
            continue
        d = chain_outward(ch, by_name)
        if d is None:
            b["bend_test"] = None
            b.pop("outward", None)
        else:
            b["bend_test"] = f"swings outward ({axis_token(d)})"
            b["outward"] = [float(c) for c in d]
    return skel


def merge_chains_any(skel, chains) -> tuple[dict, str]:
    """``solvers.chains.merge_chains(skel, chains)`` (G1) when that module imports here (inside Blender it must not need scipy),
    else ``merge_chains`` of this module. Returns ``(skeleton, source)``."""
    try:
        from solvers import chains as g1_chains  # noqa: WPS433 (optional, G1's module)

        fn = g1_chains.merge_chains
    except Exception as e:  # missing module, missing function or an import that needs rigkit-env packages
        return merge_chains(skel, chains), f"rigkit.skeleton.merge_chains (G2 fallback; solvers.chains: {type(e).__name__}: {e})"
    out = outward_bend_tests(fn(skel, chains), chains)
    ids = [c["id"] for c in (chains or {}).get("chains", [])]
    n = sum(1 for b in out["bones"] if b.get("chain") is not None)
    out["chains"] = {"source": "solvers.chains.merge_chains (G1)", "n_chains": len(ids), "n_bones": n, "ids": ids}
    return out, "solvers.chains.merge_chains (G1) + rigkit.skeleton.outward_bend_tests"


# --------------------------------------------------------------------------------------------------------------------------
# runtime armature (Blender)
# --------------------------------------------------------------------------------------------------------------------------

BUILD_DEFAULTS = {
    "bend_test_deg": 20.0,
    "flip": True,
    "min_cos": 0.25,  # |cos(displacement, expected)| below this is ambiguous: neither orientation passes, no flip
    "display_type": "OCTAHEDRAL",
    "show_in_front": True,
}
#: bone collections of the runtime armature, in creation order (the names of D01's G2 file)
COLLECTIONS = {"deform": "Deform", "aux": "Aux", "socket": "Sockets", "other": "Root"}


def collection_key(bone) -> str:
    """``COLLECTIONS`` key of a skeleton bone dict: socket -> Sockets, aux -> Aux, other deform bones -> Deform, the rest -> Root."""
    if bone["kind"] == "socket":
        return "socket"
    if bone["kind"] == "aux":
        return "aux"
    return "deform" if bone["deform"] else "other"


def _wrap_pi(a: float) -> float:
    return (a + math.pi) % (2.0 * math.pi) - math.pi


def build_runtime(skel, name: str, collection=None, params=None, asset_id: str | None = None) -> tuple:
    """Runtime armature object ``name`` from a resolved skeleton dict (``rigcore.template.resolve``). Every bone: head/tail from the
    dict, roll by ``align_roll(roll_z_vector(head, tail, hinge))``, ``use_connect=False``, parent, ``use_deform``,
    ``inherit_scale='FULL'``, ``bbone_segments=1``. Bone collections ``Deform``, ``Aux``, ``Sockets``, ``Root`` (``collection_key``;
    D01's G2 names). Then the bend tests with roll flips (``bend_tests``); pass ``rep["flipped"]`` to ``apply_flips`` before
    writing skeleton.json.

    Returns ``(armature_object, report)``: ``{bones, deform, sockets, bend_tests, flipped, rolls}`` (rolls in radians, after flips)."""
    bl.require_bpy()
    prm = _merge(BUILD_DEFAULTS, params)
    arm = bpy.data.armatures.new(name)
    ob = bpy.data.objects.new(name, arm)
    bl.link(ob, collection)
    bl.tag(ob, "runtime", asset_id)
    with bl.edit_mode(ob) as data:
        for b in skel["bones"]:
            eb = data.edit_bones.new(b["name"])
            if eb.name != b["name"]:
                raise RuntimeError(f"bone name {b['name']!r} became {eb.name!r}")
            eb.head = Vector(b["head"])
            eb.tail = Vector(b["tail"])
            eb.align_roll(Vector(geom.roll_z_vector(b["head"], b["tail"], b["hinge"])))
            eb.use_deform = bool(b["deform"])
            eb.use_connect = False
            if b["parent"]:
                eb.parent = data.edit_bones[b["parent"]]
            eb.inherit_scale = "FULL"
            eb.bbone_segments = 1
    arm.display_type = prm["display_type"]
    ob.show_in_front = prm["show_in_front"]
    cols = {k: arm.collections.new(v) for k, v in COLLECTIONS.items()}
    for b in skel["bones"]:
        cols[collection_key(b)].assign(arm.bones[b["name"]])
    tests = bend_tests(ob, skel, prm)
    rep = {
        "bones": len(skel["bones"]),
        "deform": sum(1 for b in skel["bones"] if b["deform"]),
        "sockets": sum(1 for b in skel["bones"] if b["kind"] == "socket"),
        "bend_tests": tests["results"],
        "bend_tests_passed": tests["passed"],
        "bend_tests_total": tests["total"],
        "flipped": tests["flipped"],
        "rolls": read_rolls(ob),
        "params": prm,
    }
    return ob, rep


def read_rolls(arm_ob) -> dict:
    """``{bone: roll}`` in radians (edit-bone roll; enters and leaves edit mode)."""
    with bl.edit_mode(arm_ob) as data:
        return {eb.name: float(eb.roll) for eb in data.edit_bones}


def _mute_constraints(arm_ob, mute: bool, saved=None):
    if mute:
        saved = {}
        for pb in arm_ob.pose.bones:
            for c in pb.constraints:
                saved[(pb.name, c.name)] = c.mute
                c.mute = True
        return saved
    for pb in arm_ob.pose.bones:
        for c in pb.constraints:
            if (pb.name, c.name) in saved:
                c.mute = saved[(pb.name, c.name)]
    return None


def _bend_once(arm_ob, name: str, angle_deg: float):
    """Tail displacement (armature space, metres) of bone ``name`` rotated ``angle_deg`` about its local X (all else at rest)."""
    bl.reset_pose(arm_ob, update_scene=False)
    pb = arm_ob.pose.bones[name]
    pb.rotation_quaternion = Quaternion((1.0, 0.0, 0.0), math.radians(angle_deg))
    bl.update()
    d = pb.tail - arm_ob.data.bones[name].tail_local
    pb.rotation_quaternion = (1.0, 0.0, 0.0, 0.0)
    return d


def bend_tests(arm_ob, skel, params=None) -> dict:
    """Run every bone's ``bend_test``: +``bend_test_deg`` about local X, the tail's displacement must point along the token axis
    (cosine >= ``min_cos``). A bone that fails with cosine <= -``min_cos`` gets roll += 180 deg (``flip``) and is retested;
    twist bones whose parent flipped are flipped too (their X stays parallel to the parent's). Constraints are muted meanwhile.

    Returns ``{results: [{bone, expected, cos, disp_m, passed, flipped, ambiguous}], passed, total, flipped: [names]}``."""
    prm = _merge(BUILD_DEFAULTS, params)
    saved = _mute_constraints(arm_ob, True)
    try:
        with bl.deform_paused():  # bones only
            return _run_bend_tests(arm_ob, skel, float(prm["bend_test_deg"]), float(prm["min_cos"]), bool(prm["flip"]))
    finally:
        _mute_constraints(arm_ob, False, saved)
        bl.update()


def _run_bend_tests(arm_ob, skel, ang: float, min_cos: float, allow_flip: bool) -> dict:
    """Body of ``bend_tests`` (constraints muted, deformation paused by the caller)."""
    bl.set_mode(arm_ob, "OBJECT")
    todo = []
    for b in skel["bones"]:
        exp = parse_bend_test(b.get("bend_test"))
        if exp is not None:
            todo.append((b["name"], exp))

    def measure(nm, exp):
        d = _bend_once(arm_ob, nm, ang)
        n = d.length
        c = (d.dot(Vector(exp[0])) / n) if n > 0 else 0.0
        return {"bone": nm, "expected": exp[1], "cos": float(c), "disp_m": [float(v) for v in d], "disp_len_m": float(n)}

    res = {nm: measure(nm, exp) for nm, exp in todo}
    flip = [nm for nm, r in res.items() if r["cos"] <= -min_cos] if allow_flip else []
    if flip:
        fl = set(flip)
        twins = [b["name"] for b in skel["bones"] if b["kind"] == "twist" and b["parent"] in fl]
        with bl.edit_mode(arm_ob) as data:
            for nm in flip + twins:
                eb = data.edit_bones[nm]
                eb.roll = _wrap_pi(eb.roll + math.pi)
        flip = flip + twins
        for nm, exp in todo:
            if nm in fl:
                first = res[nm]
                res[nm] = measure(nm, exp)
                res[nm]["cos_before_flip"] = first["cos"]
    bl.reset_pose(arm_ob)
    out = []
    for nm, exp in todo:
        r = res[nm]
        r["flipped"] = nm in flip
        r["passed"] = r["cos"] >= min_cos
        r["ambiguous"] = abs(r.get("cos_before_flip", r["cos"])) < min_cos
        out.append(r)
    return {"results": out, "passed": sum(r["passed"] for r in out), "total": len(out), "flipped": flip}


# --------------------------------------------------------------------------------------------------------------------------
# checks (Blender)
# --------------------------------------------------------------------------------------------------------------------------

# skewed ray directions of D01 d01_measure._inside (axis-aligned rays graze edges of axis-aligned features)
_RAY_DIRS = ((0.5773, 0.3011, 0.7589), (-0.2917, 0.8123, -0.5), (0.1931, -0.4617, -0.8664))


def mesh_bvh(mesh_ob, depsgraph=None):
    """BVH of the evaluated mesh in the mesh's object space."""
    dg = depsgraph or bpy.context.evaluated_depsgraph_get()
    return BVHTree.FromObject(mesh_ob, dg)


def point_inside(bvh, p, max_hits: int = 60, eps: float = 1e-6) -> bool:
    """Inside test by 3-ray parity (majority of 3 skewed rays with an odd number of hits), as D01 ``d01_measure._inside``."""
    votes = 0
    for d in _RAY_DIRS:
        dv = Vector(d).normalized()
        o = Vector(p)
        cnt = 0
        for _ in range(max_hits):
            hit = bvh.ray_cast(o, dv)
            if hit[0] is None:
                break
            cnt += 1
            o = hit[0] + dv * eps
        votes += cnt % 2
    return votes >= 2


def winding_numbers(mesh_ob, points, depsgraph=None):
    """Generalized winding number (sum of the triangles' signed solid angles / 4 pi, Van Oosterom-Strackee) of ``points`` (object
    space of the mesh) against the evaluated mesh: about 1 inside one closed shell, 2 inside two nested shells (cloth over the
    body), 0 outside; open surfaces give fractions. Same inside rule as A2 / metrics (w > 0.5). numpy, O(points x triangles):
    a few heads against ~10k triangles is milliseconds. (I3, P3 integration: 3-ray parity counts an even number of crossings for a
    point inside two nested shells and calls it outside - FL's calves, thighs and spine under the robe.)"""
    import numpy as np

    dg = depsgraph or bpy.context.evaluated_depsgraph_get()
    ev = mesh_ob.evaluated_get(dg)
    me = ev.to_mesh()
    try:
        me.calc_loop_triangles()
        V = np.empty(len(me.vertices) * 3)
        me.vertices.foreach_get("co", V)
        V = V.reshape(-1, 3)
        T = np.empty(len(me.loop_triangles) * 3, dtype=np.int64)
        me.loop_triangles.foreach_get("vertices", T)
        T = T.reshape(-1, 3)
    finally:
        ev.to_mesh_clear()
    A, B, C = V[T[:, 0]], V[T[:, 1]], V[T[:, 2]]
    out = []
    for p in points:
        a, b, c = A - p, B - p, C - p
        la, lb, lc = (np.linalg.norm(x, axis=1) for x in (a, b, c))
        det = np.einsum("ij,ij->i", a, np.cross(b, c))
        div = la * lb * lc + np.einsum("ij,ij->i", a, b) * lc + np.einsum("ij,ij->i", b, c) * la + np.einsum("ij,ij->i", c, a) * lb
        out.append(float(np.sum(2.0 * np.arctan2(det, div)) / (4.0 * np.pi)))
    return np.array(out)


def heads_inside(arm_ob, mesh_ob, names=None, depsgraph=None) -> dict:
    """``{bone: {inside, dist_to_surface_mm, winding, inside_winding}}`` for the rest heads of ``names`` (default all bones),
    tested against the evaluated mesh (call at the rest pose). ``inside`` is D01's 3-ray parity (kept as is: the legacy regression
    compares it with D01); ``winding`` is the generalized winding number and ``inside_winding`` = winding > 0.5, which also holds
    inside nested shells (cloth over the body), where parity says outside."""
    bvh = mesh_bvh(mesh_ob, depsgraph)
    to_mesh = mesh_ob.matrix_world.inverted() @ arm_ob.matrix_world
    out, pts = {}, []
    for b in arm_ob.data.bones:
        if names is not None and b.name not in names:
            continue
        p = to_mesh @ b.head_local
        loc = bvh.find_nearest(p)
        out[b.name] = {"inside": bool(point_inside(bvh, p)), "dist_to_surface_mm": round(float(loc[3]) * 1000.0, 3) if loc[0] else None}
        pts.append(tuple(p))
    if pts:
        for nm, w in zip(out, winding_numbers(mesh_ob, pts, depsgraph)):
            out[nm]["winding"] = round(float(w), 4)
            out[nm]["inside_winding"] = bool(w > 0.5)
    return out


def _is_identity(m, tol: float = 1e-9) -> bool:
    return all(abs(m[i][j] - (1.0 if i == j else 0.0)) <= tol for i in range(4) for j in range(4))


def check_runtime(arm_ob, skel, mesh_ob=None, exempt=(), H=None) -> dict:
    """S4 checks on the built runtime armature (rest pose):

    * no bone shorter than ``rigcore.schema.MIN_BONE_LENGTH``; one root, named ``root``, head at the origin;
    * unit object transform (scale 1), every bone ``inherit_scale == 'FULL'`` and ``bbone_segments == 1``;
    * symmetric L/R bone lengths: max |len(L_x) - len(R_x)| in metres and in H;
    * with ``mesh_ob``: heads of the core deform bones (and twist bones) inside the mesh (3-ray parity); ``exempt`` lists thin
      parts allowed outside (the S template lists ears and flaps). Aux bones and sockets are reported, not judged.

    Returns a JSON-able dict with ``ok`` (all judged checks pass)."""
    from rigcore import schema

    H = float(H if H is not None else skel["H"])
    bones = arm_ob.data.bones
    kinds = {b["name"]: b for b in skel["bones"]}
    zero = [b.name for b in bones if b.length < schema.MIN_BONE_LENGTH]
    roots = [b.name for b in bones if b.parent is None]
    root_head = list(bones["root"].head_local) if "root" in bones else None
    root_ok = roots == ["root"] and root_head is not None and max(abs(c) for c in root_head) <= 1e-9
    mw = arm_ob.matrix_world
    obj_ok = _is_identity(mw) and all(abs(s - 1.0) <= 1e-9 for s in arm_ob.scale)
    bad_inherit = [b.name for b in bones if b.inherit_scale != "FULL"]
    bad_bbone = [b.name for b in bones if b.bbone_segments != 1]
    missing = [nm for nm in kinds if nm not in bones]
    extra = [b.name for b in bones if b.name not in kinds]
    pairs, worst, worst_d, core_worst, core_d = 0, None, 0.0, None, 0.0
    for b in bones:
        if b.name.startswith("L_") and ("R_" + b.name[2:]) in bones:
            r = bones["R_" + b.name[2:]]
        elif b.name.endswith("_L") and (b.name[:-2] + "_R") in bones:
            r = bones[b.name[:-2] + "_R"]
        else:
            continue
        pairs += 1
        d = abs(b.length - r.length)
        if d >= worst_d:
            worst, worst_d = b.name, d
        if kinds.get(b.name, {}).get("kind") in ("core", "twist") and d >= core_d:
            core_worst, core_d = b.name, d
    rep = {
        "bones": len(bones), "missing": missing, "extra": extra, "zero_length": zero,
        "roots": roots, "root_head": root_head, "root_ok": bool(root_ok),
        "object_identity": bool(obj_ok), "object_scale": list(arm_ob.scale),
        "inherit_scale_not_full": bad_inherit, "bbone_segments_not_1": bad_bbone,
        "symmetry": {"pairs": pairs, "max_len_diff_m": worst_d, "max_len_diff_H": worst_d / H, "worst": worst,
                     "core_max_len_diff_m": core_d, "core_max_len_diff_H": core_d / H, "core_worst": core_worst},
    }
    ok = not (zero or missing or extra or bad_inherit or bad_bbone) and root_ok and obj_ok
    if mesh_ob is not None:
        ins = heads_inside(arm_ob, mesh_ob)
        judged = [nm for nm, b in kinds.items() if (b["kind"] == "core" and b["deform"]) or b["kind"] == "twist"]
        # inside = 3-ray parity OR winding number > 0.5 (I3: parity fails inside nested shells such as a robe over the legs)
        out_core = [nm for nm in judged if not (ins[nm]["inside"] or ins[nm].get("inside_winding"))]
        rep["inside_rule"] = "3-ray parity or generalized winding number > 0.5"
        out_bad = [nm for nm in out_core if nm not in set(exempt)]
        rep["inside"] = ins
        rep["inside_judged"] = judged
        rep["core_outside"] = out_core
        rep["core_outside_not_exempt"] = out_bad
        rep["exempt"] = list(exempt)
        rep["aux_outside"] = [nm for nm, b in kinds.items()
                              if b["kind"] == "aux" and not (ins[nm]["inside"] or ins[nm].get("inside_winding"))]
        ok = ok and not out_bad
    rep["ok"] = bool(ok)
    return rep


# --------------------------------------------------------------------------------------------------------------------------
# step CLI
# --------------------------------------------------------------------------------------------------------------------------

def main(argv=None) -> int:
    import argparse
    import json

    from rigcore import landmarks as rl
    from rigcore import npzio, recipe
    from rigkit import intake

    ap = argparse.ArgumentParser(description="S4: build the runtime armature from landmarks + family template into a rig .blend")
    ap.add_argument("--blend", required=True, help="rig .blend from intake (saved in place unless --save-as)")
    ap.add_argument("--landmarks", required=True, help="landmarks.json (contract format, or D01's grouped file)")
    ap.add_argument("--family", required=True, help="family name (S, H, S_legacy_D01) or path")
    ap.add_argument("--asset-id", default=None, help="default: the scene's rigkit_asset_id")
    ap.add_argument("--H", type=float, default=None, help="default: the scene's rigkit_H")
    ap.add_argument("--prebend", default=None, help="JSON object merged over the pre-bend parameters")
    ap.add_argument("--build", default=None, help="JSON object merged over BUILD_DEFAULTS (bend test angle, flip, min_cos)")
    ap.add_argument("--chains", default=None, help="chains.json of S3g: chain bones merged into the skeleton (phase G)")
    ap.add_argument("--no-parent", action="store_true", help="do not parent the mesh to the runtime armature")
    ap.add_argument("--out-dir", default=None, help="default: the folder of --blend")
    ap.add_argument("--save-as", default=None)
    a = ap.parse_args(bl.script_args() if argv is None else argv)
    out = a.out_dir or os.path.dirname(os.path.abspath(a.blend))
    bl.open_file(a.blend)
    asset = a.asset_id or bl.scene_value("rigkit_asset_id")
    H = float(a.H if a.H is not None else bl.scene_value("rigkit_H"))
    if not asset or not H:
        raise ValueError("need --asset-id and --H (or a blend written by rigkit.intake)")
    fam = template.load_family(a.family)
    names = bl.rig_names(asset, fam)
    if bpy.data.objects.get(names["runtime"]) is not None:
        raise RuntimeError(f"{names['runtime']!r} already exists in {a.blend}: rebuild from intake (the recipe is the source of truth)")
    mesh_ob = bl.find("mesh", asset)
    lm, lm_kind = load_landmarks_any(a.landmarks)
    skel, lm2, pre = resolve_skeleton(fam, lm, H, json.loads(a.prebend) if a.prebend else None)
    chain_info = None
    if a.chains:
        skel, src = merge_chains_any(skel, npzio.read_json(a.chains))
        chain_info = dict(skel.get("chains") or {}, file=os.path.abspath(a.chains), source=src)
    col = mesh_ob.users_collection[0] if mesh_ob.users_collection else None
    rt, rep = build_runtime(skel, names["runtime"], col, json.loads(a.build) if a.build else None, asset_id=asset)
    skel = apply_flips(skel, rep["flipped"])  # skeleton.json describes the built armature
    exempt = ((fam.get("builder") or {}).get("inside_exempt")) or []
    chk = check_runtime(rt, skel, mesh_ob, exempt=exempt, H=H)
    par = None if a.no_parent else intake.parent_to_armature(mesh_ob, rt)
    blend = bl.save_main(a.save_as or a.blend)
    files = {"skeleton": template.save_skeleton(os.path.join(out, "skeleton.json"), skel),
             "landmarks_used": rl.save_landmarks(os.path.join(out, "landmarks_used.json"), asset, fam["family"], H, lm2)}
    report = {"prebend": pre, "build": rep, "checks": chk, "parent": par, "landmarks_source": {"path": os.path.abspath(a.landmarks), "kind": lm_kind},
              "family": template.template_info(fam), "blend": blend}
    if chain_info is not None:
        roots = {b["name"] for b in skel["bones"] if b.get("chain") and b.get("bend_test")}
        chain_info["root_bend_tests"] = [r for r in rep["bend_tests"] if r["bone"] in roots]
        report["chains"] = chain_info
    files["report"] = npzio.write_json(os.path.join(out, "s4_report.json"), report)
    rpath = os.path.join(out, "rig_recipe.json")
    rec = bl.open_recipe(rpath, asset, H=H)
    rec["family"] = fam["family"]
    rec["template"] = {k: template.template_info(fam)[k] for k in ("path", "version", "sha256")}
    rec["landmarks"]["file"] = os.path.abspath(a.landmarks)
    recipe.log_step(rec, "S4.prebend", pre["params"], {"chains": pre["chains"]})
    s4_params = {"family": fam["family"], "build": rep["params"], "inside_exempt": exempt}
    if a.chains:  # recipe unchanged for runs without chains
        s4_params["chains"] = os.path.abspath(a.chains)
    recipe.log_step(rec, "S4", s4_params,
                    {"bones": rep["bones"], "bend_tests_passed": rep["bend_tests_passed"], "bend_tests_total": rep["bend_tests_total"],
                     "flipped": rep["flipped"], "checks_ok": chk["ok"], "files": files})
    recipe.stamp_scripts(rec)
    recipe.save_recipe(rpath, rec)
    ok = chk["ok"] and rep["bend_tests_passed"] == rep["bend_tests_total"]
    print(bl.json_line({"step": "S4", "ok": ok, "bones": rep["bones"], "bend_tests": f"{rep['bend_tests_passed']}/{rep['bend_tests_total']}",
                        "flipped": rep["flipped"], "core_outside": chk.get("core_outside_not_exempt"), "blend": blend}))
    return 0 if ok else 1


if __name__ == "__main__":
    bl.run_main(main)
