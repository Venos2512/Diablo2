r"""Owner C, Blender test: rigkit.poses runtime emulation, posing, sign tests, chunked export, and the EXCEPTION SAFETY of the
emulation context in rigkit.poses / rigkit.render / rigkit.parity, on the adversarial synthetic rig of C_synthetic_rig.py.

Part A (no context, as round 1): the copy has the exporter-rule weights, one plain Armature modifier and an OBJECT parent; bones
are forced (bbone 1, weighted socket deforms) and restored by teardown; the source is untouched; the evaluated copy equals numpy LBS
of the exporter weights; the ROM sign test points "(+Y)" / "(-Y)" the right way; a WEAK sign test raises and an explicit sign is
accepted; chunked export + merge equals direct evaluation.
Part B (contexts, on a "dressed" file: Action with slot at frame 7, custom properties, Euler channel, hidden helper, selection,
render / Workbench settings, world): the full ``FileState`` snapshot is EXACTLY equal before and after
  - ``poses.emulation`` with an exception raised inside (after posing and assigning an action), and without one;
  - ``poses.emulation`` failing its weight check (copy weights perturbed by a wrapped skin_io.runtime_copy -> ValueError);
  - ``poses.export_current`` (custom specs; H measured -> ``H_source`` recorded);
  - ``render.render_jobs`` with a shot that raises (camera, world, Workbench settings, Render Result created before it);
  - ``parity.export_current`` with an exporter that raises.

Run: blender -b --factory-startup -P C_test_poses_emulation.py -- [--out E:\tmp_rigkit\C_r3\tests]   (one JSON line; exit 1 on failure)
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPTS = os.path.dirname(os.path.dirname(HERE))
for p in (SCRIPTS, HERE):
    sys.path.insert(0, p)
sys.dont_write_bytecode = True

import bpy  # noqa: E402
import numpy as np  # noqa: E402

import C_synthetic_rig as SR  # noqa: E402
from rigcore import npzio  # noqa: E402
from rigkit import poses as RP  # noqa: E402

args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = args[args.index("--out") + 1] if "--out" in args else r"E:\tmp_rigkit\C_r3\tests"
OUT = os.path.join(OUT, "emulation")
os.makedirs(OUT, exist_ok=True)
checks = {}


def check(name, ok, **kw):
    checks[name] = {"pass": bool(ok), **kw}


def group_hash(ob):
    return hash(tuple((v.index, g.group, round(g.weight, 7)) for v in ob.data.vertices for g in v.groups))


def diff(a, b, path=""):
    """First differences between two nested snapshot dicts (for the report)."""
    out = []
    if isinstance(a, dict) and isinstance(b, dict):
        for k in sorted(set(a) | set(b), key=str):
            if k not in a or k not in b:
                out.append(f"{path}/{k}: only in {'after' if k in b else 'before'}")
            else:
                out += diff(a[k], b[k], f"{path}/{k}")
    elif a != b:
        out.append(f"{path}: {a!r} -> {b!r}")
    return out[:8]


BEND = {"name": "bend", "kind": "rom", "ik": "default", "ops": [{"op": "local_rot", "bones": ["b3"], "axis": "Z", "deg": 40.0}],
        "tags": ["extreme"]}

try:
    # ------------------------------------------------------------------------------------------------ part A
    arm, src, names = SR.build()
    h0 = group_hash(src)
    emu = RP.setup_emulation(src.name, arm.name)
    cp = bpy.data.objects[emu["copy"]]
    check("copy_modifiers", [m.type for m in cp.modifiers] == ["ARMATURE"] and not cp.modifiers[0].use_deform_preserve_volume
          and cp.modifiers[0].use_vertex_groups and not cp.modifiers[0].use_bone_envelopes, modifiers=[m.type for m in cp.modifiers])
    check("copy_parent_object", cp.parent_type == "OBJECT", parent_type=cp.parent_type)
    check("bbone_forced_1", arm.data.bones["b2"].bbone_segments == 1)
    check("weighted_socket_deforms", arm.data.bones["sock"].use_deform, bones_changed=emu["bones_changed"])
    Ws = RP.read_groups_loop(src, names)
    Wc = RP.read_groups_loop(cp, names)
    ref = RP.exporter_rule(Ws)
    check("copy_weights_exporter_rule", float(np.abs(Wc - ref).max()) <= 1e-6 and (Wc > 0).sum(1).max() <= 4
          and emu["weights_check_max"] <= 1e-6, max_dev=float(np.abs(Wc - ref).max()), weights_check_max=emu["weights_check_max"],
          max_influences=int((Wc > 0).sum(1).max()), groups_ignored=emu["groups_ignored"])
    check("junk_group_dropped", "junk" not in [vg.name for vg in cp.vertex_groups] and "junk" in emu["groups_ignored"])
    check("source_untouched", group_hash(src) == h0 and [m.type for m in src.modifiers] == ["ARMATURE", "CORRECTIVE_SMOOTH"])
    pc = RP.PoseContext(arm.name, arm.name, cp.name, switches=[])
    pc.apply(BEND)
    P = RP.eval_world(cp)
    rest = np.array([v.co[:] for v in cp.data.vertices])
    bn = [b.name for b in arm.data.bones]
    S = {b: np.array(arm.matrix_world @ arm.pose.bones[b].matrix)
         @ np.linalg.inv(np.array(arm.matrix_world @ arm.data.bones[b].matrix_local)) for b in bn}
    Vh = np.c_[rest, np.ones(len(rest))]
    L = sum(ref[:, j:j + 1] * (Vh @ S[nm].T)[:, :3] for j, nm in enumerate(names))
    check("copy_equals_numpy_lbs", float(np.abs(P - L).max()) < 1e-6, max_dev=float(np.abs(P - L).max()))
    Psrc = RP.eval_world(src)
    check("source_differs_from_runtime", float(np.abs(Psrc - P).max()) > 1e-4, max_dev=float(np.abs(Psrc - P).max()))
    up = {"name": "up", "kind": "rom", "ik": "default", "ops": [{"op": "local_rot", "bones": ["b5"], "axis": "Z", "deg": 30.0,
                                                                   "positive": "tail goes (+Y)", "side": None, "sign_key": "t_plus"}],
          "tags": ["standard"]}
    dn = {"name": "down", "kind": "rom", "ik": "default", "ops": [{"op": "local_rot", "bones": ["b5"], "axis": "Z", "deg": 30.0,
                                                                     "positive": "tail goes (-Y)", "side": None, "sign_key": "t_minus"}],
          "tags": ["standard"]}
    pc.reset()
    t0 = np.array(arm.matrix_world @ arm.pose.bones["b5"].tail)
    pc.apply(up)
    t_up = np.array(arm.matrix_world @ arm.pose.bones["b5"].tail)
    pc.apply(dn)
    t_dn = np.array(arm.matrix_world @ arm.pose.bones["b5"].tail)
    check("sign_test", t_up[1] > t0[1] + 1e-3 and t_dn[1] < t0[1] - 1e-3 and pc.signs["t_plus"] == -pc.signs["t_minus"]
          and not pc.sign_log["t_plus"]["weak"], signs=pc.signs, dy_up=float(t_up[1] - t0[1]), dy_down=float(t_dn[1] - t0[1]),
          log=pc.sign_log["t_plus"])
    # weak: a rotation about the bone's own axis (local Y) does not move its tail
    weak = {"name": "weak", "kind": "rom", "ik": "default", "ops": [{"op": "local_rot", "bones": ["b5"], "axis": "Y", "deg": 30.0,
                                                                       "positive": "thumb goes (+Z)", "side": None, "sign_key": "t_weak"}],
            "tags": []}
    try:
        pc.apply(weak)
        weak_err = None
    except ValueError as e:
        weak_err = str(e)
    confirmed = json.loads(json.dumps(weak))
    confirmed["ops"][0].update(sign=-1, sign_key="t_conf")
    pc.apply(confirmed)
    check("weak_sign_raises", weak_err is not None and "weak ROM sign test" in weak_err and "t_weak" not in pc.signs, error=weak_err)
    check("explicit_sign_confirms", pc.signs.get("t_conf") == -1.0 and "explicit" in pc.sign_log["t_conf"]["reason"])
    rp = RP.sign_from_test([0, 0, 0], [0.01, 0.0005, 0], [0, 1, 0])
    check("weak_by_angle", rp["weak"] and abs(rp["cos"]) < 0.3, test=rp)
    specs = [RP.rest_spec(), BEND, up, dn]
    meta = {"asset_id": "synthetic", "H": 0.2}
    paths = [RP.export_chunk(pc, specs, i, min(i + 3, len(specs)), OUT, meta)["path"] for i in (0, 3)]
    merged = RP.merge_chunks(paths, os.path.join(OUT, "poses_synthetic.npz"))
    m = npzio.load_poses(merged)
    pc.apply(BEND)
    direct = RP.eval_world(cp)
    k = m["names"].tolist().index("bend")
    check("chunks_merge", m["names"].tolist() == ["rest", "bend", "up", "down"] and float(np.abs(m["P"][k] - direct).max()) < 1e-6
          and m["extra"]["pose_mats"].shape == (4, len(bn), 4, 4) and m["meta"]["rest_index"] == 0,
          names=m["names"].tolist(), dev=float(np.abs(m["P"][k] - direct).max()))
    pc.reset()
    td = RP.teardown_emulation(cp.name)
    check("teardown_restores", td["removed"] and arm.data.bones["b2"].bbone_segments == 3 and not arm.data.bones["sock"].use_deform
          and emu["copy"] not in bpy.data.objects, restored=td["restored"])

    # ------------------------------------------------------------------------------------------------ part B
    arm, src, names = SR.build()
    SR.dress_state(arm)
    snap0 = RP.FileState().as_dict()
    slot0 = arm.animation_data.action_slot.identifier if arm.animation_data.action_slot else None

    def same(name, **kw):
        s1 = RP.FileState().as_dict()
        check(name, s1 == snap0, diff=diff(snap0, s1), **kw)

    try:
        with RP.emulation(src.name, arm.name) as emu:
            pc = RP.PoseContext(arm.name, arm.name, emu["copy"], switches=["ik_arm_L"])
            pc.apply(BEND)
            pc.action("T_idle")
            arm.data.bones["b4"].use_deform = False  # any other change inside is undone too
            raise RuntimeError("boom")
    except RuntimeError as e:
        err = str(e)
    same("context_restores_on_error", error=err, copy_gone=RP.EMUL_SUFFIX not in "".join(bpy.data.objects.keys()),
         bbone=arm.data.bones["b2"].bbone_segments, action=arm.animation_data.action.name if arm.animation_data.action else None,
         slot=(arm.animation_data.action_slot.identifier if arm.animation_data.action_slot else None), slot_before=slot0,
         frame=bpy.context.scene.frame_current)
    with RP.emulation(src.name, arm.name) as emu:
        pc = RP.PoseContext(arm.name, arm.name, emu["copy"], switches=["ik_arm_L"])
        pc.apply(BEND)
        bpy.context.scene.frame_set(3)
    same("context_restores_on_success")
    from rigkit import skin_io

    real_copy = skin_io.runtime_copy

    def bad_copy(*a, **kw):  # a copy whose weights are NOT what the exporter writes
        cp_, rep_ = real_copy(*a, **kw)
        cp_.vertex_groups["b2"].add([0], 0.5, "ADD")
        return cp_, rep_

    skin_io.runtime_copy = bad_copy
    try:
        with RP.emulation(src.name, arm.name):
            wc_err = None
    except ValueError as e:
        wc_err = str(e)
    finally:
        skin_io.runtime_copy = real_copy
    same("weight_check_failure_raises_and_restores", error=wc_err, raised=wc_err is not None and "exporter rule" in (wc_err or ""))
    out_p = os.path.join(OUT, "poses_custom")
    res = RP.export_current(out_p, "custom", mesh=src.name, runtime=arm.name, control=arm.name, asset_id="synthetic",
                            specs=[RP.rest_spec(), BEND])
    same("export_current_restores", n_poses=res["n_poses"])
    check("H_measured_recorded", res["H_source"].startswith("measured") and abs(res["H"] - 0.02) < 1e-6
          and npzio.load_poses(res["poses"])["meta"]["H_source"] == res["H_source"]
          and npzio.load_mesh(res["mesh"])["meta"]["H_source"] == res["H_source"], H=res["H"], H_source=res["H_source"])
    from rigkit import render as R

    po = npzio.load_poses(res["poses"])
    W = npzio.load_weights(res["weights"])
    plan = R.plan_shots(po, W["W"], [str(b) for b in W["bones"]], what=("skel", "weights", "poses"))
    real_shoot = R.Shooter.shoot
    calls = {"n": 0}

    def bad_shoot(self, *a, **kw):
        calls["n"] += 1
        if calls["n"] == 3:
            raise RuntimeError("render failed on purpose")
        return real_shoot(self, *a, **kw)

    R.Shooter.shoot = bad_shoot
    try:
        R.render_jobs(plan["jobs"], os.path.join(OUT, "render_fail"), po)
        r_err = None
    except RuntimeError as e:
        r_err = str(e)
    finally:
        R.Shooter.shoot = real_shoot
    same("render_restores_on_error", error=r_err, shots_before_error=calls["n"] - 1, raised=r_err is not None,
         qa_cam=("QA_cam" in bpy.data.objects))
    from rigkit import export as A1_export, parity as PA

    real_export = A1_export.export_test_glb

    def bad_export(*a, **kw):
        raise RuntimeError("export failed on purpose")

    A1_export.export_test_glb = bad_export
    try:
        PA.export_current(os.path.join(OUT, "parity_fail"), mesh=src.name, runtime=arm.name)
        p_err = None
    except RuntimeError as e:
        p_err = str(e)
    finally:
        A1_export.export_test_glb = real_export
    same("parity_restores_on_error", error=p_err, raised=p_err is not None)
    ok = all(c["pass"] for c in checks.values())
    summary = {"test": "C_test_poses_emulation", "ok": ok, "passed": sum(c["pass"] for c in checks.values()), "total": len(checks),
               "failed": [k for k, c in checks.items() if not c["pass"]]}
except Exception as e:  # pragma: no cover - reported as a failure
    import traceback

    traceback.print_exc()
    ok = False
    summary = {"test": "C_test_poses_emulation", "ok": False, "error": f"{type(e).__name__}: {e}",
               "failed": [k for k, c in checks.items() if not c["pass"]]}
npzio.write_json(os.path.join(OUT, "C_test_poses_emulation.json"), {"summary": summary, "checks": checks})
print(json.dumps(summary))
from rigkit import bl  # noqa: E402

bl.exit_now(0 if ok else 1)  # os._exit without Blender's teardown, after removing the session temp folder
