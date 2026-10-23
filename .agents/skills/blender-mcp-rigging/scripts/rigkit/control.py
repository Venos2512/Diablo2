"""rigkit.control - S5: control kit ``humanoid_v1`` (D01's kit generalized: b1_build_rig.py + d01_rigkit.py +
d01_rig_def.control_bones), plus ``ctl_{S}_Clavicle`` FK, twist drivers and a skirt-chain hook.

Units: metres; ``*_H`` parameters are fractions of H.  Frame: Blender, Z up, character front -Y, character left +X.

Kit content (``build_control``):

* FK: one ``ctl_<bone>`` per runtime bone except sockets and twist bones (so root, cog, spine, head, aux bones, clavicles, limbs);
  head/tail from the skeleton dict, roll copied from the built runtime armature (after its bend-test flips).
* Per IK entry of the family (``ik[]``, sides expanded), per side L then R:
  arm: ``target`` (``ctl_{S}_Hand_IK``, on the hand, child of ``target_parent``) and ``pole`` (``ctl_{S}_Elbow_pole``);
  leg: ``foot_roll`` chain ``Foot_IK`` (heel on the ground, child of ``ctl_root``) -> ``Toe_roll`` (pivot toe tip) ->
  ``Heel_roll`` (pivot heel) -> ``Ball_roll`` (pivot ball joint) -> ``target`` (``Ankle_target``, on the foot); ``Toe_target``
  (on the toe, child of ``Heel_roll``); ``pole`` (``ctl_{S}_Knee_pole``, child of ``ctl_root``).
  Poles sit at ``pole_offset_H * H`` along the bend direction (the joint's offset from the proximal-distal line), length
  ``pole_length_H * H`` (D01: 0.12 m / 0.03 m at H = 0.5).
* Constraints: IK on the chain's last bone (chain_count = chain length, use_tail, no stretch; hinge lock: IK Y/Z locked, X limited
  to ``ik_limit_deg``), hand / foot / toe Copy Rotation (world) from their IK targets; influences driven by the switches
  ``ik_arm_{S}`` / ``ik_leg_{S}`` (custom properties on the control object, 1 = IK, 0 = FK).
* Coupling: every runtime bone with a ``ctl_`` twin gets Copy Transforms world -> world ("FollowControl").
* Twist (joint-placement.md "Twist bones"): a runtime bone with ``twist = {driver, axis, factor}`` gets rotation mode XYZ and a
  driver on its Euler ``axis`` channel: ``factor * t``, where ``t`` is a TRANSFORMS variable on the runtime driver bone, ROT_<axis>,
  ``rotation_mode = SWING_TWIST_<axis>``, LOCAL_SPACE (local rotation after constraints, i.e. what Copy Transforms gave the
  bone). ``t`` is the twist of the swing-twist split, so flexion and deviation of the driver do not leak in (Copy Rotation
  Y-only read the Euler Y instead: 12.8 deg instead of 30 for 60 deg pronation + 60 deg flexion, review round 1). The
  expression is simple, so it runs without Python auto-run. ``bl.reset_pose`` keeps the XYZ mode of driven bones.
* Garment chains (phase G, ``add_chain_controls``): chain bones get plain FK controls like every aux bone (``Aux FK``); each
  chain root with leg push gets a helper ``ctl_<root>_push`` (its parent) whose X rotation is driven by the thighs' swing toward
  the chain (``leg_push_expression``; references/cloth-and-attachments.md §4), clamped at the plan's ``max_deg`` (80 deg facing
  a leg, 60 deg at the side); the bone below it gets a drape helper ``ctl_<bone>_drape`` turning it back by ``-drape x`` the
  push (G3b). A cluster, strip or swing item riding on a pushed panel carries the panel chain's push in chains.json
  (``leg_push.inherited``, G6) and is built the same way, but its push helper copies the panel root's control (same pivot and
  axis) and its drape helper, on the plan's ``drape_bone`` (``drape_targets``), the panel's bone-02 control (same fold), so the
  item moves rigidly with the panel (``helper_geometry``).
  ``add_skirt_chain`` is the legacy hook.
* Pole angle by sweep: -180..180 deg in ``coarse_step``, then +-``fine_span`` in ``fine_step``, then a golden-section search in
  +-``fine_step`` around the grid best until the bracket is below ``refine_tol_deg`` (skipped when the grid best is already
  within ``refine_skip_rad``; the refined angle replaces it only when strictly better). The angle with the smallest rotation
  difference between the IK chain and its rest pose wins (D01: -90 deg on all four chains, difference 0, no refinement needed).

``plan`` (the bone table) is pure Python: rigkit-env tests compare it with D01's ``control_bones`` bit for bit. The step CLI takes
its builder defaults (object names, pole offsets) from the ``builder`` block carried in skeleton.json (``builder_of``).
"""
from __future__ import annotations

import copy
import math
import os
import sys

if __name__ == "__main__":  # run as a script: put scripts/ on sys.path (no __pycache__ next to the sources)
    sys.dont_write_bytecode = True
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rigcore import geom, template  # noqa: E402

from rigkit import bl  # noqa: E402

try:
    import bpy
    from mathutils import Vector
except ImportError:  # pragma: no cover - pure-Python use
    bpy = None

KIT = "humanoid_v1"
PREFIX = "ctl_"
CONTROL_DEFAULTS = {
    "pole_offset_H": 0.24,  # D01: 0.12 m at H = 0.5
    "pole_length_H": 0.06,  # D01: tail at 0.15 m
    "foot_ik_len_H": 0.06,  # bone lengths of the foot-roll helpers, pointing forward (-Y); D01: 0.03 / 0.02 / 0.03 / 0.02 m
    "toe_roll_len_H": 0.04,
    "heel_roll_len_H": 0.06,
    "ball_roll_len_H": 0.04,
    "ik_limit_deg": [0.0, 150.0],
    "pole_sweep": {"start": -180.0, "stop": 180.0, "coarse_step": 5.0, "fine_step": 0.5, "fine_span": 5.0,
                   "refine_tol_deg": 1e-6, "refine_skip_rad": 1e-9, "refine_max_evaluations": 80},
    "fk_skip_kinds": ["socket", "twist"],
}
TWIST_AXES = ("X", "Y", "Z")
SPINE_HEAD = ("pelvis", "spine_01", "spine_02", "chest", "neck", "head")
ARM_PARTS = ("Clavicle", "UpperArm", "ForeArm", "Hand")
LEG_PARTS = ("Thigh", "Calf", "Foot", "Toe")
COLLECTIONS = ("Root/COG", "Spine/Head FK", "Arms FK", "Legs FK", "Aux FK", "IK controls", "Poles", "Foot roll")
PALETTE_FK = {"L": "THEME04", "R": "THEME01", "C": "THEME03"}
PALETTE_IK = {"L": "THEME05", "R": "THEME02", "C": "THEME03"}


def _merge(base: dict, over) -> dict:
    out = copy.deepcopy(base)
    for k, v in (over or {}).items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = _merge(out[k], v)
        else:
            out[k] = copy.deepcopy(v)
    return out


def control_params(family=None, params=None) -> dict:
    """``CONTROL_DEFAULTS`` <- ``family["builder"]["control"]`` <- ``params``. ``family`` may be a family dict or a resolved
    skeleton (both carry ``builder``)."""
    fam = ((family or {}).get("builder") or {}).get("control") or {}
    return _merge(_merge(CONTROL_DEFAULTS, fam), params)


def builder_of(skel, family=None, families_dir=None) -> tuple:
    """Builder defaults for the control step. Normally the ``builder`` block carried in the resolved skeleton
    (``rigcore.template.resolve`` copies it from the family, with the template provenance ``skel["template"]``). A skeleton.json
    written before rigcore carried it has no ``builder`` key: then the family ``family`` (default ``skel["family"]``) is loaded by
    name, and the info says so (``warning``). Returns ``(builder dict or None, info {source, template, warning})``."""
    if "builder" in skel:
        return copy.deepcopy(skel["builder"]), {"source": "skeleton", "template": skel.get("template"), "warning": None}
    spec = family or skel.get("family")
    if not spec:
        raise ValueError("skeleton has no carried 'builder' block and no family to fall back on")
    fam = template.load_family(spec, families_dir)
    ti = template.template_info(fam)
    msg = (f"skeleton has no carried 'builder' block (written before rigcore carried it): family {spec!r} reloaded by name from "
           f"{ti['path']} (version {ti['version']}; the skeleton says {skel.get('template_version')!r})")
    return copy.deepcopy(fam.get("builder")), {"source": "family", "template": {k: ti[k] for k in ("path", "version", "sha256")},
                                               "warning": msg}


def ctl(name: str) -> str:
    return PREFIX + name


# --------------------------------------------------------------------------------------------------------------------------
# plan (pure Python)
# --------------------------------------------------------------------------------------------------------------------------

def _children(skel) -> dict:
    out: dict = {}
    for b in skel["bones"]:
        out.setdefault(b["parent"], []).append(b)
    return out


def _next_core(children, name: str):
    """First core child of ``name`` (the hand after the forearm, the foot after the calf, the toe after the foot)."""
    for c in children.get(name, []):
        if c["kind"] == "core":
            return c
    raise ValueError(f"control kit: bone {name!r} has no core child")


def _bend_dir(a, m, b):
    """Unit direction of joint ``m``'s offset from the line a-b (D01: the pole direction)."""
    off = geom.sub(m, geom.on_line(a, m, b))
    return geom.unit(off)


def plan(skel, landmarks, params=None) -> list[dict]:
    """Control-bone table of kit humanoid_v1, in creation order (FK in skeleton order, then per side the arm and leg entries).

    Entry: ``{name, parent, head, tail, hinge, zvec, roll_of, kind, rt, side}``: ``roll_of`` = runtime bone whose roll is copied
    (FK and on-bone targets) else None; then ``zvec`` (world Z wanted, foot-roll helpers) or ``hinge`` (wanted local X) sets the
    roll as in ``geom.roll_z_vector``. ``kind`` in fk / ik / pole / roll / target. ``landmarks`` must hold ``heel_ground_{S}`` and
    ``toe_ground_{S}``. Metres."""
    prm = _merge(CONTROL_DEFAULTS, params)
    H = float(skel["H"])
    bones = {b["name"]: b for b in skel["bones"]}
    kids = _children(skel)
    skip = set(prm["fk_skip_kinds"])
    fk = [b for b in skel["bones"] if b["kind"] not in skip]
    fk_names = {b["name"] for b in fk}
    out = []
    for b in fk:
        p = b["parent"]
        while p is not None and p not in fk_names:
            p = bones[p]["parent"]
        out.append({"name": ctl(b["name"]), "parent": ctl(p) if p else None, "head": tuple(b["head"]), "tail": tuple(b["tail"]),
                    "hinge": tuple(b["hinge"]), "zvec": None, "roll_of": b["name"], "kind": "fk", "rt": b["name"],
                    "side": b.get("side")})
    po, pl = prm["pole_offset_H"] * H, prm["pole_length_H"] * H

    def pole(name, parent, joint, a, b, side):
        bd = _bend_dir(a, joint, b)
        return {"name": name, "parent": parent, "head": geom.add(joint, geom.scale(bd, po)),
                "tail": geom.add(joint, geom.scale(bd, po + pl)), "hinge": geom.X, "zvec": None, "roll_of": None, "kind": "pole",
                "rt": None, "side": side}

    def on_bone(name, parent, src, kind, side):
        return {"name": name, "parent": parent, "head": tuple(src["head"]), "tail": tuple(src["tail"]), "hinge": tuple(src["hinge"]),
                "zvec": None, "roll_of": src["name"], "kind": kind, "rt": None, "side": side}

    def flat(name, parent, head, length, kind, side):
        return {"name": name, "parent": parent, "head": tuple(head), "tail": geom.add(head, (0.0, -length, 0.0)), "hinge": None,
                "zvec": geom.Z, "roll_of": None, "kind": kind, "rt": None, "side": side}

    ik_entries = skel.get("ik", [])
    sides = [s for s in ("L", "R") if any(ik.get("side") == s for ik in ik_entries)] + ([None] if any(ik.get("side") is None for ik in ik_entries) else [])
    for side in sides:
        for ik in [e for e in ik_entries if e.get("side") == side]:
            up, lo = bones[ik["chain"][0]], bones[ik["chain"][-1]]
            a, m, b = tuple(up["head"]), tuple(lo["head"]), tuple(lo["tail"])
            if ik.get("foot_roll"):
                foot = _next_core(kids, lo["name"])
                toe = _next_core(kids, foot["name"])
                fik, toe_roll, heel_roll, ball_roll = ik["foot_roll"]
                sfx = f"_{side}" if side else ""
                hg = geom.vec(landmarks["heel_ground" + sfx])
                tg = geom.vec(landmarks["toe_ground" + sfx])
                toe_target = ik.get("toe_target") or ik["target"].replace("Ankle_target", "Toe_target")
                out.append(flat(fik, ik.get("target_parent") or ctl("root"), hg, prm["foot_ik_len_H"] * H, "ik", side))
                out.append(flat(toe_roll, fik, tg, prm["toe_roll_len_H"] * H, "roll", side))
                out.append(flat(heel_roll, toe_roll, hg, prm["heel_roll_len_H"] * H, "roll", side))
                out.append(flat(ball_roll, heel_roll, toe["head"], prm["ball_roll_len_H"] * H, "roll", side))
                out.append(on_bone(ik["target"], ball_roll, foot, "target", side))
                out.append(on_bone(toe_target, heel_roll, toe, "target", side))
                out.append(pole(ik["pole"], ik.get("pole_parent") or ctl("root"), m, a, b, side))
            else:
                hand = _next_core(kids, lo["name"])
                tp = ik.get("target_parent") or ctl("root")
                out.append(on_bone(ik["target"], tp, hand, "ik", side))
                out.append(pole(ik["pole"], ik.get("pole_parent") or tp, m, a, b, side))
    names = [e["name"] for e in out]
    if len(set(names)) != len(names):
        raise ValueError(f"control plan: duplicate names {sorted({n for n in names if names.count(n) > 1})}")
    return out


def _collection_of(e) -> str:
    if e["kind"] == "fk":
        rt = e["rt"]
        if rt in ("root", "cog"):
            return "Root/COG"
        if rt in SPINE_HEAD:
            return "Spine/Head FK"
        if rt.endswith(ARM_PARTS):
            return "Arms FK"
        if rt.endswith(LEG_PARTS):
            return "Legs FK"
        return "Aux FK"
    return {"ik": "IK controls", "pole": "Poles"}.get(e["kind"], "Foot roll")


def _side_letter(name: str) -> str:
    return "L" if "_L_" in name else ("R" if "_R_" in name else "C")


# --------------------------------------------------------------------------------------------------------------------------
# build (Blender)
# --------------------------------------------------------------------------------------------------------------------------

def _drive(constraint, ct_ob, prop: str):
    fc = constraint.driver_add("influence")
    dr = fc.driver
    dr.type = "AVERAGE"
    v = dr.variables.new()
    v.name = "ik"
    v.type = "SINGLE_PROP"
    v.targets[0].id = ct_ob
    v.targets[0].data_path = f'["{prop}"]'
    return fc


def _copy_rotation(pb, ct_ob, sub: str, name: str):
    c = pb.constraints.new("COPY_ROTATION")
    c.name = name
    c.target = ct_ob
    c.subtarget = sub
    c.target_space = "WORLD"
    c.owner_space = "WORLD"
    return c


def build_control(rt_ob, skel, landmarks, name: str, collection=None, params=None, asset_id: str | None = None,
                  couple: bool = True, sweep: bool = True) -> tuple:
    """Build the control armature ``name`` for the runtime armature ``rt_ob`` (built from ``skel`` by
    ``skeleton.build_runtime``). ``landmarks`` gives the ground points of the feet. With ``couple`` the runtime follows the control
    (Copy Transforms + twist drivers); with ``sweep`` the pole angles are found by sweep.

    Returns ``(control_object, report)``: ``{kit, bones, fk, helpers, switches, ik, pole_angles, coupling, twist}``."""
    bl.require_bpy()
    prm = _merge(CONTROL_DEFAULTS, params)
    entries = plan(skel, landmarks, prm)
    rolls = {}
    with bl.edit_mode(rt_ob) as data:
        for eb in data.edit_bones:
            rolls[eb.name] = float(eb.roll)
    arm = bpy.data.armatures.new(name)
    ct = bpy.data.objects.new(name, arm)
    bl.link(ct, collection)
    bl.tag(ct, "control", asset_id)
    ct["rigkit_kit"] = KIT
    with bl.edit_mode(ct) as data:
        for e in entries:
            eb = data.edit_bones.new(e["name"])
            if eb.name != e["name"]:
                raise RuntimeError(f"control bone name {e['name']!r} became {eb.name!r}")
            eb.head = Vector(e["head"])
            eb.tail = Vector(e["tail"])
            if e["roll_of"] is not None:
                eb.roll = rolls[e["roll_of"]]
            elif e["zvec"] is not None:
                eb.align_roll(Vector(e["zvec"]))
            else:
                eb.align_roll(Vector(geom.roll_z_vector(e["head"], e["tail"], e["hinge"])))
            eb.use_deform = False
            eb.use_connect = False
            if e["parent"]:
                eb.parent = data.edit_bones[e["parent"]]
            eb.inherit_scale = "FULL"
            eb.bbone_segments = 1
    arm.display_type = "OCTAHEDRAL"
    ct.show_in_front = True
    cols = {nm: arm.collections.new(nm) for nm in COLLECTIONS}
    for e in entries:
        bone = arm.bones[e["name"]]
        cols[_collection_of(e)].assign(bone)
        pal = PALETTE_FK if e["kind"] == "fk" else PALETTE_IK
        bone.color.palette = pal[_side_letter(e["name"])]

    # switches (custom properties), D01 order: per side leg then arm
    ik_entries = skel.get("ik", [])
    switches = []
    for side in ("L", "R", None):
        for ik in sorted((e for e in ik_entries if e.get("side") == side), key=lambda e: 0 if e.get("foot_roll") else 1):
            key = ik["switch"]
            ct[key] = 1.0
            ct.id_properties_ui(key).update(min=0.0, max=1.0, soft_min=0.0, soft_max=1.0,
                                            description=f"1 = IK {ik['name']}, 0 = FK")
            switches.append(key)

    lo_deg, hi_deg = prm["ik_limit_deg"]
    kids = _children(skel)
    ik_rep = []
    for side in ("L", "R", None):
        for ik in sorted((e for e in ik_entries if e.get("side") == side), key=lambda e: 0 if e.get("foot_roll") else 1):
            host = ct.pose.bones[ctl(ik["chain"][-1])]
            con = host.constraints.new("IK")
            con.name = "LegIK" if ik.get("foot_roll") else "ArmIK"
            con.target = ct
            con.subtarget = ik["target"]
            con.pole_target = ct
            con.pole_subtarget = ik["pole"]
            con.chain_count = len(ik["chain"])
            con.use_tail = True
            con.use_stretch = False
            host.lock_ik_y = True
            host.lock_ik_z = True
            host.use_ik_limit_x = True
            host.ik_min_x = math.radians(lo_deg)
            host.ik_max_x = math.radians(hi_deg)
            _drive(con, ct, ik["switch"])
            extra = []
            nxt = _next_core(kids, ik["chain"][-1])
            if ik.get("foot_roll"):
                toe = _next_core(kids, nxt["name"])
                toe_target = ik.get("toe_target") or ik["target"].replace("Ankle_target", "Toe_target")
                for owner, tgt in ((ctl(nxt["name"]), ik["target"]), (ctl(toe["name"]), toe_target)):
                    c = _copy_rotation(ct.pose.bones[owner], ct, tgt, "FromContact")
                    _drive(c, ct, ik["switch"])
                    extra.append(owner)
            else:
                c = _copy_rotation(ct.pose.bones[ctl(nxt["name"])], ct, ik["target"], "FromHandIK")
                _drive(c, ct, ik["switch"])
                extra.append(ctl(nxt["name"]))
            ik_rep.append({"name": ik["name"], "host": host.name, "constraint": con.name, "target": ik["target"], "pole": ik["pole"],
                           "switch": ik["switch"], "copy_rotation": extra})

    rep = {"kit": KIT, "bones": len(entries), "fk": sum(1 for e in entries if e["kind"] == "fk"),
           "helpers": sum(1 for e in entries if e["kind"] != "fk"), "switches": switches, "ik": ik_rep, "params": prm}
    if couple:
        rep["coupling"] = couple_runtime(rt_ob, ct, skel)
    if sweep:
        rep["pole_angles"] = find_pole_angles(ct, skel, prm["pole_sweep"])
    bl.reset_pose(ct)
    bl.reset_pose(rt_ob)
    if couple:
        rep["coupling"]["rest_max_diff"] = coupling_rest_diff(rt_ob, ct)
    return ct, rep


def couple_runtime(rt_ob, ct_ob, skel) -> dict:
    """Runtime <- control: Copy Transforms world -> world ("FollowControl") on every runtime bone with a ``ctl_`` twin; a twist
    driver (``add_twist_driver``) on every bone with a ``twist`` entry. Returns ``{followed, followed_count, twist}``."""
    followed, twist = [], []
    for pb in rt_ob.pose.bones:
        c_name = ctl(pb.name)
        if c_name in ct_ob.pose.bones:
            c = pb.constraints.new("COPY_TRANSFORMS")
            c.name = "FollowControl"
            c.target = ct_ob
            c.subtarget = c_name
            c.target_space = "WORLD"
            c.owner_space = "WORLD"
            c.mix_mode = "REPLACE"
            followed.append(pb.name)
    for b in skel["bones"]:
        tw = b.get("twist")
        if tw:
            twist.append(add_twist_driver(rt_ob, b["name"], tw["driver"], tw["axis"], tw["factor"]))
    bl.update()
    return {"followed": followed, "followed_count": len(followed), "twist": twist}


def twist_expression(factor: float, var: str = "t") -> str:
    """Driver expression ``"t * <factor>"`` (``repr`` keeps every digit; a simple expression, no Python auto-run needed)."""
    return f"{var} * {float(factor)!r}"


def add_twist_driver(arm_ob, bone: str, driver_bone: str, axis: str = "Y", factor: float = 0.5) -> dict:
    """Twist bone ``bone`` of ``arm_ob`` turns ``factor`` x the twist of ``driver_bone`` about the local ``axis``: rotation mode
    XYZ and a driver on ``rotation_euler[axis]`` = ``t * factor``, with ``t`` = TRANSFORMS variable on ``driver_bone``,
    ``ROT_<axis>``, ``SWING_TWIST_<axis>``, ``LOCAL_SPACE``. Raises when Blender would need Python to evaluate the expression.
    Returns ``{bone, driver, axis, factor, method, data_path, index, expression, simple_expression}``."""
    ax = str(axis).upper()
    if ax not in TWIST_AXES:
        raise ValueError(f"twist axis must be one of {TWIST_AXES}, got {axis!r}")
    if driver_bone not in arm_ob.pose.bones:
        raise ValueError(f"twist driver bone {driver_bone!r} is not in {arm_ob.name!r}")
    pb = arm_ob.pose.bones[bone]
    pb.rotation_mode = "XYZ"
    pb.rotation_euler = (0.0, 0.0, 0.0)
    idx = TWIST_AXES.index(ax)
    fc = pb.driver_add("rotation_euler", idx)
    dr = fc.driver
    dr.type = "SCRIPTED"
    for v in list(dr.variables):
        dr.variables.remove(v)
    v = dr.variables.new()
    v.name = "t"
    v.type = "TRANSFORMS"
    tg = v.targets[0]
    tg.id = arm_ob
    tg.bone_target = driver_bone
    tg.transform_type = "ROT_" + ax
    tg.rotation_mode = "SWING_TWIST_" + ax
    tg.transform_space = "LOCAL_SPACE"
    dr.expression = twist_expression(factor, v.name)
    if not dr.is_simple_expression:
        raise RuntimeError(f"twist driver of {bone!r}: {dr.expression!r} is not a simple expression (would need Python auto-run)")
    return {"bone": bone, "driver": driver_bone, "axis": ax, "factor": float(factor), "method": "driver_swing_twist",
            "data_path": fc.data_path, "index": idx, "expression": dr.expression, "simple_expression": bool(dr.is_simple_expression)}


def coupling_rest_diff(rt_ob, ct_ob) -> dict:
    """At the rest pose: max |runtime pose matrix - rest matrix| over the runtime bones (0 when the coupling is exact), and max
    |runtime rest - control rest| over twin bones."""
    bl.update()
    pose_d = max((float(max(abs(a - b) for ra, rb in zip(pb.matrix, rt_ob.data.bones[pb.name].matrix_local) for a, b in zip(ra, rb))))
                 for pb in rt_ob.pose.bones)
    rest_d = 0.0
    for b in ct_ob.data.bones:
        nm = b.name[len(PREFIX):] if b.name.startswith(PREFIX) else None
        if nm and nm in rt_ob.data.bones:
            r = rt_ob.data.bones[nm].matrix_local
            rest_d = max(rest_d, max(abs(x - y) for ra, rb in zip(r, b.matrix_local) for x, y in zip(ra, rb)))
    return {"runtime_pose_vs_rest_max": pose_d, "control_vs_runtime_rest_max": float(rest_d)}


def _chain_dev(ct_ob, names) -> float:
    dev = 0.0
    for nm in names:
        pb = ct_ob.pose.bones[nm]
        r = ct_ob.data.bones[nm].matrix_local
        dev = max(dev, pb.matrix.to_quaternion().rotation_difference(r.to_quaternion()).angle)
    return float(dev)


def golden_min(f, a: float, b: float, tol: float, max_evaluations: int = 80) -> tuple:
    """Golden-section search for the minimum of ``f`` on ``[a, b]`` (unimodal there; a V-shaped minimum is fine). Stops when the
    bracket is below ``tol`` or after ``max_evaluations`` calls. Returns ``(x_best, f_best, evaluations)`` over every evaluated
    point (pure Python)."""
    g = (math.sqrt(5.0) - 1.0) / 2.0
    c, d = b - g * (b - a), a + g * (b - a)
    fc, fd = f(c), f(d)
    n = 2
    best = min((fc, c), (fd, d))
    while abs(b - a) > tol and n < max_evaluations:
        if fc <= fd:
            b, d, fd = d, c, fc
            c = b - g * (b - a)
            fc = f(c)
            best = min(best, (fc, c))
        else:
            a, c, fc = c, d, fd
            d = a + g * (b - a)
            fd = f(d)
            best = min(best, (fd, d))
        n += 1
    return best[1], best[0], n


def _wrap_deg(a: float) -> float:
    return (a + 180.0) % 360.0 - 180.0 if abs(a) > 180.0 else a


def find_pole_angles(ct_ob, skel, sweep=None) -> dict:
    """Pole angle of every IK constraint by sweep: ``start..stop`` in ``coarse_step`` degrees, then ``coarse_best +- fine_span`` in
    ``fine_step``, then (unless the grid best is already within ``refine_skip_rad``) a golden-section search on ``grid_best +-
    fine_step`` down to ``refine_tol_deg``, kept only when strictly better. The angle with the smallest rotation difference (radians)
    between the IK chain's pose and its rest wins and is set. The control rig must be at rest with every IK switch on. Armature
    modifiers are paused meanwhile (bones only). Returns ``{chain: {angle_deg, dev_rad, coarse_best_deg, coarse_dev_rad,
    grid_best_deg, grid_dev_rad, refined, evaluations}}``."""
    sw = _merge(CONTROL_DEFAULTS["pole_sweep"], sweep)
    bl.reset_pose(ct_ob)
    saved = {k: ct_ob[k] for k in ct_ob.keys() if k.startswith("ik_")}
    for k in saved:
        ct_ob[k] = 1.0
    out = {}
    try:
        with bl.deform_paused():  # do not deform the mesh ~400 times
            for ik in skel.get("ik", []):
                host = ct_ob.pose.bones[ctl(ik["chain"][-1])]
                con = next(c for c in host.constraints if c.type == "IK")
                names = [ctl(n) for n in ik["chain"]]

                def score(ang):
                    con.pole_angle = math.radians(ang)
                    bl.update()
                    return _chain_dev(ct_ob, names)

                n_c = int(round((sw["stop"] - sw["start"]) / sw["coarse_step"]))
                coarse = [(score(sw["start"] + k * sw["coarse_step"]), sw["start"] + k * sw["coarse_step"]) for k in range(n_c + 1)]
                c_dev, c_ang = min(coarse, key=lambda t: t[0])
                n_f = int(round(sw["fine_span"] / sw["fine_step"]))
                fine = [(score(c_ang + k * sw["fine_step"]), c_ang + k * sw["fine_step"]) for k in range(-n_f, n_f + 1)]
                g_dev, g_ang = min(fine, key=lambda t: t[0])
                best_dev, best_ang, refined, n_r = g_dev, g_ang, False, 0
                if g_dev > sw["refine_skip_rad"]:
                    r_ang, r_dev, n_r = golden_min(score, g_ang - sw["fine_step"], g_ang + sw["fine_step"], sw["refine_tol_deg"],
                                                   int(sw["refine_max_evaluations"]))
                    if r_dev < g_dev:
                        best_dev, best_ang, refined = r_dev, r_ang, True
                best_ang = _wrap_deg(best_ang)
                con.pole_angle = math.radians(best_ang)
                bl.update()
                out[ik["name"]] = {"angle_deg": float(best_ang), "dev_rad": float(_chain_dev(ct_ob, names)), "coarse_best_deg": float(c_ang),
                                   "coarse_dev_rad": float(c_dev), "grid_best_deg": float(_wrap_deg(g_ang)), "grid_dev_rad": float(g_dev),
                                   "refined": refined, "evaluations": len(coarse) + len(fine) + n_r}
    finally:
        for k, v in saved.items():
            ct_ob[k] = v
        bl.update()
    return out


def add_skirt_chain(ct_ob, chain_bones, thigh_L: str, thigh_R: str, factor: float = 0.5) -> dict:
    """Skirt-chain hook: the chain's root control bone ``chain_bones[0]`` copies ``factor`` of each thigh's rotation (two Copy
    Rotation constraints, target space LOCAL_OWNER_ORIENT, owner LOCAL, mix AFTER, influence ``factor`` each), so with 0.5 + 0.5
    it follows the average of the legs (failure-catalog #6). The rest of the chain is plain FK. Names are control bones.
    Returns ``{root, constraints}``."""
    root = ct_ob.pose.bones[chain_bones[0]]
    made = []
    for thigh in (thigh_L, thigh_R):
        c = root.constraints.new("COPY_ROTATION")
        c.name = f"SkirtFrom_{thigh}"
        c.target = ct_ob
        c.subtarget = thigh
        c.target_space = "LOCAL_OWNER_ORIENT"
        c.owner_space = "LOCAL"
        c.mix_mode = "AFTER"
        c.influence = float(factor)
        made.append(c.name)
    bl.update()
    return {"root": root.name, "chain": list(chain_bones), "constraints": made, "factor": float(factor)}


# --------------------------------------------------------------------------------------------------------------------------
# garment chains: FK controls + leg push (phase G, references/cloth-and-attachments.md §4). Replaces add_skirt_chain for new
# rigs; add_skirt_chain stays for the legacy path.
# --------------------------------------------------------------------------------------------------------------------------

PUSH_SUFFIX = "_push"
DRAPE_SUFFIX = "_drape"  # G3b (spec §4 drape): helper above the FK control of the bone after a pushed root
PUSH_COLLECTION = "Cloth push"
LEG_PUSH_MAX_DEG = 60.0  # side chains (and the default of an old chains.json without max_deg)
LEG_PUSH_FACING_DEG = 80.0  # chains facing a leg (front/back: |cos phi| = |dir.y| >= FACING_COS), spec §4 (G3b)
FACING_COS = 0.7
DRAPE = 0.75  # spec §4: the bone after the pushed root counter-rotates by -DRAPE x the push angle
LEG_PUSH_CLASSES = ("skirt", "tail")  # name classes that get a leg push when no chains.json says otherwise (fallback)
SWING_EPS = 1e-6  # rad: below this swing angle the driver uses the limit 2 of s / sin(s / 2)


def chain_table(skel) -> list[dict]:
    """Chains of a merged skeleton (bones with a ``chain`` key), in skeleton order: ``[{id, piece, side, bones: [names], root,
    owns_root}]``. ``root`` = the first bone; ``owns_root`` is False for a fan sub-chain, whose first bone (02) hangs from another
    chain's root (that root carries the fan's one push control). Pure Python."""
    names = {b["name"]: b for b in skel["bones"]}
    out, by = [], {}
    for b in skel["bones"]:
        cid = b.get("chain")
        if cid is None:
            continue
        if cid not in by:
            par = names.get(b["parent"]) or {}
            by[cid] = {"id": cid, "piece": b.get("piece"), "side": b.get("side"), "bones": [], "root": b["name"],
                       "owns_root": par.get("chain") is None, "outward": b.get("outward")}
            out.append(by[cid])
        by[cid]["bones"].append(b["name"])
    return out


def name_class(name: str) -> str:
    """Chain class from the standard chain names (spec §3 "Names"): skirt, tail (strip), cape, charm (cluster), main_hair (hair),
    swing (``<item>_swing``, rigid_hanging), else ``other``."""
    n = name[2:] if name[:2] in ("L_", "R_") else name
    for key in ("skirt", "tail", "cape", "charm", "main_hair"):
        if n.startswith(key + "_") or n == key:
            return key
    return "swing" if n.endswith("_swing") else "other"


def leg_push_of(chain_row, plan_chain=None) -> dict:
    """Leg-push parameters of one chain (``chain_table`` row): the plan's ``leg_push`` (chains.json) when given, else the fallback
    from the skeleton: enabled for skirt and tail chains, ``dir`` = the root's ``outward`` (horizontal unit vector away from the
    body), ``w_L/w_R = 0.5 +- 0.35 sin(phi)`` with sin(phi) = dir.x (phi = azimuth, 0 = front -Y, 90 = left +X), max 60 deg."""
    if plan_chain is not None and plan_chain.get("leg_push") is not None:
        lp = dict(plan_chain["leg_push"])
        lp.setdefault("max_deg", LEG_PUSH_MAX_DEG)
        lp.setdefault("drape", DRAPE)
        lp["source"] = "chains.json"
        return lp
    d = chain_row.get("outward")
    if d is None:
        return {"enabled": False, "source": "skeleton (no outward direction)"}
    s = float(d[0])
    facing = abs(float(d[1])) >= FACING_COS
    return {"enabled": name_class(chain_row["root"]) in LEG_PUSH_CLASSES, "w_L": 0.5 + 0.35 * s, "w_R": 0.5 - 0.35 * s,
            "dir": [float(c) for c in d], "max_deg": LEG_PUSH_FACING_DEG if facing else LEG_PUSH_MAX_DEG, "drape": DRAPE,
            "source": "skeleton fallback (name class + outward)"}


def drape_targets(push: dict, chain_row: dict, kids: dict) -> list:
    """Bones that get a drape helper for a pushed chain: the plan's ``drape_bone`` when ``leg_push`` has that key (G6: a chain
    that inherits the push of the panel it rides on folds back level with the panel's fold; None = no drape), else the chain
    bones right below the root (bone 02; a fan's sub-chain roots too). Pure Python."""
    if "drape_bone" in push:
        db = push["drape_bone"]
        return [db] if db and db in chain_row["bones"] else []
    return list(kids.get(chain_row["root"], []))


def inherit_source(push: dict, plan_by: dict):
    """The chains.json chain whose leg push ``push`` inherits (``push["inherited"]["from"]``, G6), or None."""
    src = (push.get("inherited") or {}).get("from")
    return plan_by.get(src) if src else None


def helper_geometry(push: dict, plan_by: dict, own: str, level: int = 0) -> str:
    """Name of the control bone whose rest head, tail and roll a push helper (``level`` 0) or a drape helper (``level`` 1) copies:
    the chain's own control ``own``, or for an inherited push (G6) the source chain's root / bone-02 control, so the item turns
    about the panel's own pivot and fold axis and moves rigidly with the panel above (and below) its fold. Pure Python."""
    src = inherit_source(push, plan_by)
    if src is None or len(src.get("bones") or []) <= level:
        return own
    return ctl(src["bones"][level]["name"])


def drape_value(push_rad: float, drape: float) -> float:
    """Pure-Python value (radians) of the drape helper: ``-drape x push`` (spec §4). The bone after the root turns back by that
    much about its own local X (+ = outward), so its net turn from rest is ``(1 - drape) x push``: 80 deg -> -60 deg -> 20 deg."""
    return -float(drape) * float(push_rad)


def drape_expression(drape: float) -> str:
    """Driver expression of a drape helper: ``-drape * p`` with ``p`` = the push helper's local ROT_X (a simple expression)."""
    return f"-{_g(drape)}*p"


def leg_push_coeffs(push: dict, thigh_axes: dict) -> dict:
    """Per side ``{w, a, b}`` of the leg-push rule: a thigh's swing vector (local frame, the direction its tail moves times the
    swing angle) is theta * (-az, 0, ax) for a swing about the local axis (ax, 0, az); its part toward the chain is
    theta * (ax * (dir . Zw) - az * (dir . Xw)) with Xw / Zw = the thigh's rest local X / Z in armature space. So ``a = dir . Zw``,
    ``b = -(dir . Xw)``. ``thigh_axes`` = {"L": (Xw, Zw), "R": (Xw, Zw)}. Pure Python."""
    d = geom.vec(push["dir"])
    out = {}
    for s in ("L", "R"):
        if s not in thigh_axes:
            continue
        xw, zw = thigh_axes[s]
        out[s] = {"w": float(push["w_" + s]), "a": float(geom.dot(d, zw)), "b": float(-geom.dot(d, xw))}
    return out


LEG_VARS = {"L": ("a", "b", "c"), "R": ("d", "e", "f")}  # ROT_X, ROT_Z, ROT_W of each thigh (short: Blender keeps 255 characters)
EXPRESSION_MAX = 255


def _g(v: float) -> str:
    return f"{float(v):.6g}"


def leg_push_expression(coeffs: dict, max_deg: float) -> str:
    """Driver expression (radians) of the push angle: ``min(sum_leg w * max(0, (sin(x/2) * a + sin(z/2) * b) * k), m)`` with
    ``k = s / sin(s / 2)`` (2 below ``SWING_EPS``). x, z, s = TRANSFORMS ROT_X, ROT_Z, ROT_W of the thigh in SWING_TWIST_Y,
    LOCAL_SPACE: Blender gives ROT_X = 2 asin(qx), ROT_Z = 2 asin(qz) of the swing quaternion q and ROT_W = the swing angle
    (probe 2026-10-23, Blender 5.2.2), so sin(x/2) * k = theta * ax exactly. Coefficients with 6 significant digits, terms below
    1e-6 dropped, one-letter variables (``LEG_VARS``): Blender cuts driver expressions at 255 characters. The weights are >= 0,
    so the sum needs no lower clamp. A simple expression (no Python auto-run)."""
    terms = []
    for s, c in coeffs.items():
        x, z, w = LEG_VARS[s]
        lin = "+".join(f"sin({v}/2)*{_g(k)}" for v, k in ((x, c["a"]), (z, c["b"])) if abs(k) >= 1e-6) or "0"
        terms.append(f"{_g(c['w'])}*max(0,({lin})*({w}/sin({w}/2) if {w}>{SWING_EPS:g} else 2))")
    expr = f"min({'+'.join(terms) or '0'},{_g(math.radians(float(max_deg)))})"
    if len(expr) > EXPRESSION_MAX:
        raise ValueError(f"leg-push expression too long for Blender ({len(expr)} > {EXPRESSION_MAX}): {expr}")
    return expr


def leg_push_value(coeffs: dict, max_deg: float, swing: dict) -> float:
    """Pure-Python value (radians) of ``leg_push_expression`` for ``swing`` = {side: (x, z, s)} channel values in radians."""
    tot = 0.0
    for s, c in coeffs.items():
        x, z, w = swing.get(s, (0.0, 0.0, 0.0))
        k = 2.0 if w < SWING_EPS else w / math.sin(w / 2.0)
        tot += c["w"] * max(0.0, (math.sin(x / 2.0) * c["a"] + math.sin(z / 2.0) * c["b"]) * k)
    return min(max(tot, 0.0), math.radians(float(max_deg)))


def add_chain_controls(ct_ob, skel, chains=None, thighs=("ctl_L_Thigh", "ctl_R_Thigh")) -> dict:
    """Leg push on the chain roots of the control armature ``ct_ob`` (built by ``build_control`` from the merged skeleton ``skel``,
    so every chain bone already has its plain FK control ``ctl_<bone>`` in ``Aux FK``). For every chain that owns its root and
    whose push is enabled (``leg_push_of``; ``chains`` = chains.json dict, optional): a helper ``ctl_<root>_push`` (collection
    ``Cloth push``) with the root control's head, tail and roll takes the root control's parent, and the root control becomes
    its child. The helper's ``rotation_euler[0]`` (local X = the hinge, + = outward) carries the leg-push driver
    (``leg_push_expression``), reading ``thighs`` in their local space. So the animator keeps full FK on the root (keys add on
    top of the push), QA chain poses on the FK controls never switch the driver off, and the runtime root follows the control
    by its Copy Transforms as before. A fan gets one push, on its shared root.

    Drape (G3b, spec §4): every chain bone right below a pushed root (bone 02; the first bones of a fan's sub-chains) gets a helper
    ``ctl_<bone>_drape`` (same head, tail and roll, collection ``Cloth push``) between the root control and its own FK control;
    its ``rotation_euler[0]`` = ``-drape x`` the push helper's local ROT_X (``drape_expression``, ``leg_push.drape``, default
    0.75). The cloth below the knee hangs back toward gravity (net turn ``(1 - drape) x push``), bones further down follow by
    hierarchy, and the FK controls stay free for the animator and the QA chain poses. Returns ``{chains: [...], pushed, skipped,
    draped}``."""
    bl.require_bpy()
    plan_by = {c["id"]: c for c in (chains or {}).get("chains", [])}
    rows = chain_table(skel)
    arm = ct_ob.data
    th = {}
    for s, nm in zip(("L", "R"), thighs):
        if nm in arm.bones:
            m = arm.bones[nm].matrix_local.to_3x3()
            th[s] = (tuple(m.col[0]), tuple(m.col[2]))
    todo, rep = [], []
    for r in rows:
        push = leg_push_of(r, plan_by.get(r["id"]))
        ent = {"chain": r["id"], "root": r["root"], "owns_root": r["owns_root"], "push": push,
               "inherited_from": (push.get("inherited") or {}).get("from")}
        rep.append(ent)
        if not r["owns_root"] or not push.get("enabled"):
            ent["skipped"] = "fan sub-chain (push on the shared root)" if not r["owns_root"] else "leg push disabled"
            continue
        if ctl(r["root"]) not in arm.bones:
            ent["skipped"] = f"control {ctl(r['root'])} missing"
            continue
        todo.append((r, push, ent))
    if not todo:
        return {"chains": rep, "pushed": 0, "skipped": len(rep), "draped": 0, "thighs": list(thighs)}
    kids = {}  # G3b drape: chain bones right below each pushed root (bone 02; a fan's sub-chain roots too)
    for b in skel["bones"]:
        if b.get("chain"):
            kids.setdefault(b["parent"], []).append(b["name"])
    drapes = []
    with bl.edit_mode(ct_ob) as data:
        for r, push, ent in todo:
            eb = data.edit_bones[ctl(r["root"])]
            hb = data.edit_bones.new(ctl(r["root"]) + PUSH_SUFFIX)
            gname = helper_geometry(push, plan_by, ctl(r["root"]), 0)  # G6: an inherited push pivots on the panel's root
            geo = data.edit_bones[gname] if gname in data.edit_bones else eb
            hb.head, hb.tail, hb.roll = geo.head.copy(), geo.tail.copy(), geo.roll
            if gname != ctl(r["root"]) and gname in data.edit_bones:
                ent["pivot"] = gname
            hb.parent = eb.parent
            hb.use_connect = False
            hb.use_deform = False
            hb.inherit_scale = "FULL"
            hb.bbone_segments = 1
            eb.parent = hb
            d = float(push.get("drape", DRAPE) or 0.0)
            for kb in drape_targets(push, r, kids) if d > 0 else []:
                if ctl(kb) not in data.edit_bones:
                    continue
                ek = data.edit_bones[ctl(kb)]
                dh = data.edit_bones.new(ctl(kb) + DRAPE_SUFFIX)  # same head, tail, roll: local X = the bone's hinge
                gname = helper_geometry(push, plan_by, ctl(kb), 1)  # G6: an inherited drape folds on the panel's fold axis
                gk = data.edit_bones[gname] if gname in data.edit_bones else ek
                dh.head, dh.tail, dh.roll = gk.head.copy(), gk.tail.copy(), gk.roll
                dh.parent = ek.parent
                dh.use_connect = False
                dh.use_deform = False
                dh.inherit_scale = "FULL"
                dh.bbone_segments = 1
                ek.use_connect = False
                ek.parent = dh
                drapes.append((r, ent, kb, d))
    col = arm.collections.get(PUSH_COLLECTION) or arm.collections.new(PUSH_COLLECTION)
    for r, push, ent in todo:
        hname = ctl(r["root"]) + PUSH_SUFFIX
        col.assign(arm.bones[hname])
        arm.bones[hname].color.palette = PALETTE_IK[_side_letter(hname)]
        coeffs = leg_push_coeffs(push, th)
        pb = ct_ob.pose.bones[hname]
        pb.rotation_mode = "XYZ"
        pb.rotation_euler = (0.0, 0.0, 0.0)
        fc = pb.driver_add("rotation_euler", 0)
        dr = fc.driver
        dr.type = "SCRIPTED"
        for v in list(dr.variables):
            dr.variables.remove(v)
        for s, thigh in zip(("L", "R"), thighs):
            if s not in coeffs:
                continue
            for ch, var in zip(("ROT_X", "ROT_Z", "ROT_W"), LEG_VARS[s]):
                v = dr.variables.new()
                v.name = var
                v.type = "TRANSFORMS"
                tg = v.targets[0]
                tg.id = ct_ob
                tg.bone_target = thigh
                tg.transform_type = ch
                tg.rotation_mode = "SWING_TWIST_Y"
                tg.transform_space = "LOCAL_SPACE"
        dr.expression = leg_push_expression(coeffs, push.get("max_deg", LEG_PUSH_MAX_DEG))
        if not dr.is_simple_expression:
            raise RuntimeError(f"leg push of {r['root']!r}: {dr.expression!r} is not a simple expression")
        ent.update(push_bone=hname, coeffs=coeffs, expression=dr.expression, simple_expression=bool(dr.is_simple_expression))
    for r, ent, kb, d in drapes:  # G3b drape: -drape x the push angle about the bone's own hinge, read from the push helper
        hname = ctl(kb) + DRAPE_SUFFIX
        col.assign(arm.bones[hname])
        arm.bones[hname].color.palette = PALETTE_IK[_side_letter(hname)]
        pb = ct_ob.pose.bones[hname]
        pb.rotation_mode = "XYZ"
        pb.rotation_euler = (0.0, 0.0, 0.0)
        fc = pb.driver_add("rotation_euler", 0)
        dr = fc.driver
        dr.type = "SCRIPTED"
        for v in list(dr.variables):
            dr.variables.remove(v)
        v = dr.variables.new()
        v.name = "p"
        v.type = "TRANSFORMS"
        tg = v.targets[0]
        tg.id = ct_ob
        tg.bone_target = ctl(r["root"]) + PUSH_SUFFIX
        tg.transform_type = "ROT_X"
        tg.transform_space = "LOCAL_SPACE"
        dr.expression = drape_expression(d)
        if not dr.is_simple_expression:
            raise RuntimeError(f"drape of {kb!r}: {dr.expression!r} is not a simple expression")
        ent.setdefault("drape", {"drape": d, "bones": [], "expression": dr.expression})["bones"].append(hname)
        ent["drape"]["simple_expression"] = bool(dr.is_simple_expression)
    bl.update()
    return {"chains": rep, "pushed": len(todo), "skipped": len(rep) - len(todo), "draped": len(drapes), "thighs": list(thighs)}


# --------------------------------------------------------------------------------------------------------------------------
# step CLI
# --------------------------------------------------------------------------------------------------------------------------

def main(argv=None) -> int:
    """S5 step: ``blender -b --factory-startup -P rigkit/control.py -- --blend <rig>.blend [--skeleton skeleton.json]
    [--landmarks landmarks_used.json] [--params '{...}']`` -> control armature + coupling + pole sweep, saved in place;
    ``s5_report.json`` and the recipe step next to the .blend (or in ``--out-dir``). Object names and control defaults come from the
    ``builder`` block carried in skeleton.json (``builder_of``); ``--family`` is only the fallback for an older skeleton.json."""
    import argparse
    import json

    from rigcore import landmarks as rl
    from rigcore import npzio, recipe

    ap = argparse.ArgumentParser(description="S5: build the control rig (kit humanoid_v1) on a rig .blend that has its runtime armature")
    ap.add_argument("--blend", required=True)
    ap.add_argument("--skeleton", default=None, help="default: <out-dir>/skeleton.json")
    ap.add_argument("--landmarks", default=None, help="landmarks used for S4 (foot ground points); default <out-dir>/landmarks_used.json")
    ap.add_argument("--family", default=None, help="fallback only: family name/path when skeleton.json carries no 'builder' block")
    ap.add_argument("--asset-id", default=None)
    ap.add_argument("--params", default=None, help="JSON object merged over the control parameters")
    ap.add_argument("--chains", default=None, help="chains.json (phase G): leg-push parameters of the chain roots")
    ap.add_argument("--out-dir", default=None)
    ap.add_argument("--save-as", default=None)
    a = ap.parse_args(bl.script_args() if argv is None else argv)
    out = a.out_dir or os.path.dirname(os.path.abspath(a.blend))
    bl.open_file(a.blend)
    asset = a.asset_id or bl.scene_value("rigkit_asset_id")
    skel = template.load_skeleton(a.skeleton or os.path.join(out, "skeleton.json"))
    lm = rl.load_landmarks(a.landmarks or os.path.join(out, "landmarks_used.json"))
    builder, binfo = builder_of(skel, a.family)
    if binfo["warning"]:
        print("WARNING: " + binfo["warning"])
    elif a.family:
        binfo["warning"] = f"--family {a.family!r} ignored: skeleton.json carries the builder block of {skel['family']!r}"
        print("WARNING: " + binfo["warning"])
    carrier = {"builder": builder}
    names = bl.rig_names(asset, carrier)
    if bpy.data.objects.get(names["control"]) is not None:
        raise RuntimeError(f"{names['control']!r} already exists: rebuild from intake")
    rt = bl.find("runtime", asset)
    prm = control_params(carrier, json.loads(a.params) if a.params else None)
    col = rt.users_collection[0] if rt.users_collection else None
    ct, rep = build_control(rt, skel, lm, names["control"], col, params=prm, asset_id=asset)
    rep["builder_source"] = binfo
    if any(b.get("chain") for b in skel["bones"]):  # phase G: leg push on the chain roots (nothing changes without chain bones)
        rep["chains"] = add_chain_controls(ct, skel, npzio.read_json(a.chains) if a.chains else None)
        rep["chains"]["file"] = os.path.abspath(a.chains) if a.chains else None
    bl.reset_pose(ct)
    bl.reset_pose(rt)
    bl.set_mode(ct, "OBJECT")
    rt.hide_set(True)  # the runtime layer deforms only; animators use the control layer (D01)
    blend = bl.save_main(a.save_as or a.blend)
    files = {"report": npzio.write_json(os.path.join(out, "s5_report.json"), rep)}
    rpath = os.path.join(out, "rig_recipe.json")
    rec = bl.open_recipe(rpath, asset)
    recipe.log_step(rec, "S5", {"kit": KIT, "params": prm, "builder_source": binfo},
                    {"pole_angles": rep["pole_angles"], "coupling": rep["coupling"]["rest_max_diff"], "twist": rep["coupling"]["twist"],
                     "bones": rep["bones"], "files": files, "blend": blend})
    recipe.stamp_scripts(rec)
    recipe.save_recipe(rpath, rec)
    ok = all(v["dev_rad"] < 1e-4 for v in rep["pole_angles"].values()) and rep["coupling"]["rest_max_diff"]["control_vs_runtime_rest_max"] < 1e-6
    print(bl.json_line({"step": "S5", "ok": ok, "bones": rep["bones"], "pole_angles": {k: v["angle_deg"] for k, v in rep["pole_angles"].items()},
                        "builder_source": binfo["source"], "blend": blend}))
    return 0 if ok else 1


if __name__ == "__main__":
    bl.run_main(main)
