"""Driver for r6_build.py (module). Runs inside Blender on a COPY of the G2 rig and saves a new .blend.

  blender -b <G2 .blend> -P r6_run.py -- --out <anim .blend> [--clips idle,walk,...] [--json <summary.json>]
"""
import json
import math
import os
import sys
import time

import numpy as np

import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import r6_build as B  # noqa: E402
import d01_rigkit as K  # noqa: E402
from kk_source import Lib  # noqa: E402

args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
opt = {}
i = 0
while i < len(args):
    opt[args[i].lstrip("-")] = args[i + 1]
    i += 2
OUT = opt["out"]
WANT = opt.get("clips", "idle,walk,run,attack,hit,death").split(",")
SUMMARY = opt.get("json", os.path.join(B.ANIM, "_work", "r6_build_summary.json"))
LOIN_K = 30.0 / 70.0  # rig rule (qa_report 5.2 #4): -30 deg at 70 deg hip flexion; first clean angle was -15 deg
ANIM_WORK = os.path.join(B.ANIM, "_work")
os.makedirs(ANIM_WORK, exist_ok=True)


def safe_savez(path, **kw):
    """Windows file locks (indexer/AV) make np.savez raise OSError 22 now and then: write to a temp name, replace with retry."""
    tmp = path + ".tmp.npz"
    last = None
    for _ in range(20):
        try:
            np.savez_compressed(tmp, **kw)
            os.replace(tmp, path)
            return
        except OSError as e:
            last = e
            time.sleep(1.0)
    log("WARNING: could not write", path, last)


def log(*a):
    print("[r6]", *a, flush=True)


rig = B.Rig()
lib = Lib()
rt = B.Retarget(rig, lib)
ct = rig.ct
log("leg scale S =", round(rt.S, 5))
summary = {"S_leg": rt.S, "clips": {}}
import d01_measure as M  # noqa: E402  (flap<->thigh measurement of the rig QA)
loin_ctx = M.Ctx()
loin_base = M.flap_vs_body(loin_ctx, K.rest_positions())
loin_summary = {}
summary["loincloth"] = loin_summary


def apply_arrays(arrs, k):
    for nm, (loc, q) in arrs.items():
        rig.set_basis(nm, loc[k], q[k])
    bpy.context.view_layer.update()


def eval_pos():
    return K.eval_mesh_positions()


def thigh_flex(side):
    pb = rig.pb[f"ctl_{side}_Thigh"]
    M = np.array(pb.matrix)
    d = M[:3, :3] @ np.array([0, 1.0, 0])
    d0 = rig.rest[f"ctl_{side}_Thigh"][:3, :3] @ np.array([0, 1.0, 0])
    a = lambda v: math.atan2(v[1], -v[2])
    return a(d0) - a(d)


def build(name, spec):
    t0 = time.time()
    nf = spec["N"]
    loop = spec["loop"]
    n = nf + 1
    mode = spec.get("feet", "stance")  # stance: retarget + constant-velocity stance | planted: feet stay on their rest spots | free: falling (floor clamp only)
    sol = rt.solve(spec, nf, loop, secondary=True, idle_extra=(name == "idle"))
    arrs = dict(sol["basis"])
    legs = sol["legs"]
    stance_speed = None
    if mode == "stance":  # common stance speed (m per frame) = length-weighted mean over both feet's source runs
        tot, cnt = 0.0, 0
        for s in B.SIDES:
            FR_, FP_ = rt.foot_pose(s, legs[s]["A_pos"], legs[s]["pitch"], legs[s]["yaw"])
            for r in B.contact_runs(legs[s]["contact"], loop):
                if len(r) >= 2:
                    tot += float(np.linalg.norm(FP_[r[-1], :2] - FP_[r[0], :2]))
                    cnt += len(r) - 1
        stance_speed = tot / cnt if cnt else None
        log(name, "common stance speed", None if stance_speed is None else round(stance_speed * B.FPS, 4), "m/s")
    for s in B.SIDES:
        L_ = legs[s]
        rF = rig.rest[f"ctl_{s}_Foot_IK"]
        if mode == "planted":
            L_["pitch"] = np.zeros(n)
            L_["FR"] = np.tile(rF[:3, :3], (n, 1, 1))
            L_["FP"] = np.tile(rF[:3, 3], (n, 1))
            L_["contact"] = np.ones(n, bool)
        else:
            L_["FR"], L_["FP"] = rt.foot_pose(s, L_["A_pos"], L_["pitch"], L_["yaw"])
            L_["FP_src"] = L_["FP"].copy()
            if mode == "stance":
                L_["FP"] = B.stance_lock(L_["FP"], L_["contact"], loop, rF[2, 3], speed=stance_speed, extend=spec.get("stance_extend", False))
                L_["FP"] = rt.contact_pivot(s, L_["FP"], L_["pitch"], L_["yaw"], L_["contact"])
                if loop:
                    L_["FP"][nf] = L_["FP"][0]
            else:
                L_["contact"] = np.zeros(n, bool)
        arrs.update(rt.foot_basis_from(s, L_["FR"], L_["FP"], L_["pitch"]))
    # arms are FK in these clips (IK switches keyed: arms 0, legs 1)
    rig.reset()
    ct["ik_leg_L"] = ct["ik_leg_R"] = 1.0
    ct["ik_arm_L"] = ct["ik_arm_R"] = 0.0
    cog_loc0 = arrs["ctl_cog"][0].copy()
    cog_shift = np.zeros((n, 3))  # world-space cog drop applied when a leg cannot reach the floor
    frames = range(nf if loop else n)

    def cog_world_apply():
        arrs["ctl_cog"] = (cog_loc0 + np.einsum("ji,nj->ni", rt.Rr["ctl_cog"], cog_shift), arrs["ctl_cog"][1])

    for rnd in range(3):
        cog_world_apply()
        for it in range(4):  # ground fix on the DEFORMED sole: contact frames -> lowest foot vertex at z=0, any frame -> no sinking
            worst = 0.0
            for k in frames:
                apply_arrays(arrs, k)
                pos = eval_pos()
                for s in B.SIDES:
                    mz = float(pos[rig.foot_v[s], 2].min())
                    L_ = legs[s]
                    if L_["contact"][k] or mz < 0:
                        if abs(mz) > 2e-4:
                            L_["FP"][k, 2] -= mz
                            fb = rt.foot_basis_from(s, L_["FR"], L_["FP"], L_["pitch"], idx=[k])
                            for kk, (lc, qq) in fb.items():
                                arrs[kk][0][k] = lc[k]
                                arrs[kk][1][k] = qq[k]
                        worst = max(worst, abs(mz))
            if worst < 5e-4:
                break
        # a contact sole still hovering = the leg cannot reach the floor: lower the cog by that shortfall and repeat
        short = np.zeros(n)
        for k in frames:
            apply_arrays(arrs, k)
            pos = eval_pos()
            for s in B.SIDES:
                if legs[s]["contact"][k]:
                    short[k] = max(short[k], float(pos[rig.foot_v[s], 2].min()))
        if short.max() < 1e-3:
            break
        if loop:
            short[nf] = short[0]
        log(name, "round", rnd, "cog drop needed up to", round(short.max() * 1000, 2), "mm")
        cog_shift[:, 2] -= short
    if loop:
        for kk in arrs:
            arrs[kk][0][nf] = arrs[kk][0][0]
            arrs[kk][1][nf] = arrs[kk][1][0]
    # ---- loincloth (ctl_loincloth_front is a manual control, there is no collision): hip-flexion rule (-30 deg at 70 deg, see qa_report 5.2 #4),
    #      raised per frame to the MEASURED smallest world-X angle that leaves no new flap<->thigh intersection (+5 deg margin) where the rule is short
    flex = np.zeros(n)
    for k in range(n):
        apply_arrays(arrs, k)
        flex[k] = max(thigh_flex("L"), thigh_flex("R"), 0.0)
    if loop:
        flex[nf] = flex[0]
    rl, par = "ctl_loincloth_front", "ctl_pelvis"
    rel = np.einsum("nij,jk,kl->nil", sol["Rpose"][par], rt.Rr[par].T, rt.Rr[rl])

    def loin_q(k, ang_k):
        return B.m2q((rel[k].T @ (B.rotx(ang_k) @ rt.Rr[rl]))[None])[0]

    def smooth(a_):
        pad = np.concatenate([a_[-2:-1], a_, a_[1:2]]) if loop else np.concatenate([a_[:1], a_, a_[-1:]])
        o = 0.25 * pad[:-2] + 0.5 * pad[1:-1] + 0.25 * pad[2:]
        if loop:
            o[nf] = o[0]
        return o

    LMAX = int(spec.get("loin_max", 75))
    rule = -LOIN_K * flex  # radians about world X (negative = swing out forward)
    arrs[rl] = (np.zeros((n, 3)), np.stack([loin_q(k, rule[k]) for k in range(n)]))
    req = np.zeros(n)
    searched = 0
    for k in frames:
        if flex[k] < math.radians(50):
            continue
        searched += 1
        for deg in range(0, LMAX, 5):
            arrs[rl][1][k] = loin_q(k, -math.radians(deg))
            apply_arrays(arrs, k)
            d_ = M.flap_delta(M.flap_vs_body(loin_ctx, eval_pos()), loin_base)
            if d_["new_inside_vertices_thigh"] == 0 and d_["new_intersecting_triangles_thigh"] == 0 and d_["new_covered_by_thigh_vertices"] == 0:
                req[k] = deg
                break
            req[k] = float(LMAX)  # not clearable by this control alone
    if loop:
        req[nf] = req[0]
    need = -np.radians(np.where(req > 0, np.minimum(req + 5.0, float(LMAX)), 0.0))
    ang = np.minimum(smooth(np.minimum(rule, need)), need)  # more negative = more swing; never less than needed
    if loop:
        ang[nf] = ang[0]
    arrs[rl] = (np.zeros((n, 3)), np.stack([loin_q(k, ang[k]) for k in range(n)]))
    if loop:
        arrs[rl][1][nf] = arrs[rl][1][0]
    loin_summary[name] = {"frames_searched": searched, "req_deg_max": float(req.max()), "applied_deg_max": float(-np.degrees(ang).min()),
                          "uncleared_frames": [int(k) + 1 for k in range(n) if req[k] >= LMAX]}
    # ---- whole-mesh floor (deformed geometry). death: lift ctl_root if any vertex sinks (recorded in clips.json root_displacement)
    gmin = np.zeros(n)
    for k in range(n):
        apply_arrays(arrs, k)
        gmin[k] = float(eval_pos()[:, 2].min())
    if name == "death":
        lift = np.maximum(-gmin, 0.0)
        arrs["ctl_root"] = (np.stack([np.zeros(n), np.zeros(n), lift], 1) @ rt.Rr["ctl_root"], np.tile([1.0, 0, 0, 0], (n, 1)))
        log(name, "root lift max mm", round(lift.max() * 1000, 2))
    summary["clips"][name] = {"build_s": round(time.time() - t0, 1), "gmin_before_mm_min": float(gmin.min() * 1000), "feet_mode": mode,
                              "flex_deg_max": float(math.degrees(flex.max())), "cog_drop_mm_max": float(-cog_shift[:, 2].min() * 1000),
                              "source_contact_frames": {s: [int(i) for i in np.nonzero(sol["legs"][s]["contact"])[0]] for s in B.SIDES},
                              "t_src": [float(x) for x in sol["meta"]["t_src"]]}
    return arrs, legs, flex


def key_action(name, spec, arrs):
    act = bpy.data.actions.new(name)
    act.use_fake_user = True
    ct.animation_data_create()
    ct.animation_data.action = act
    n = spec["N"] + 1
    bpy.context.preferences.edit.keyframe_new_interpolation_type = "LINEAR"
    loc_bones = {"ctl_cog", "ctl_L_Foot_IK", "ctl_R_Foot_IK", "ctl_root"}
    rig.reset()
    for k in range(n):
        frame = 1 + k
        for nm, (loc, q) in arrs.items():
            pb = rig.pb[nm]
            pb.rotation_mode = "QUATERNION"
            pb.rotation_quaternion = (q[k][0], q[k][1], q[k][2], q[k][3])
            pb.keyframe_insert("rotation_quaternion", frame=frame, group=nm)
            if nm in loc_bones:
                pb.location = Vector(loc[k])
                pb.keyframe_insert("location", frame=frame, group=nm)
    for fr in (1, n):
        for p, v in (("ik_arm_L", 0.0), ("ik_arm_R", 0.0), ("ik_leg_L", 1.0), ("ik_leg_R", 1.0)):
            ct[p] = v
            ct.keyframe_insert(f'["{p}"]', frame=fr, group="D01_switches")
    act.use_frame_range = True
    act.frame_start = 1
    act.frame_end = n
    act.use_cyclic = bool(spec["loop"])
    act["d01_clip"] = json.dumps({"state": spec["state"], "fps": B.FPS, "frame_start": 1, "frame_end": n, "intervals": spec["N"],
                                  "loop": spec["loop"], "source": spec["src"], "status": "experiment",
                                  "event_hit": spec.get("event_hit_frame"), "gain": spec.get("gain", 1.0)})
    act["status"] = "experiment"
    return act


for name in WANT:
    spec = B.CLIPS[name]
    log("build", name)
    arrs, legs, flex = build(name, spec)
    act = key_action(name, spec, arrs)
    log(name, "keyed; slot", [s.identifier for s in act.slots], "fcurves ok")
    ct.animation_data.action = None
    rig.reset()
    safe_savez(os.path.join(ANIM_WORK, f"arrays_{name}.npz"),
               **{f"{k}__loc": v[0] for k, v in arrs.items()}, **{f"{k}__q": v[1] for k, v in arrs.items()})

# default state when the file is opened: idle assigned, scene range = idle, no NLA, preview range off
sc = bpy.context.scene
sc.render.fps = B.FPS
sc.render.fps_base = 1.0
sc.use_preview_range = False
if "idle" in bpy.data.actions:
    idle = bpy.data.actions["idle"]
    ct.animation_data.action = idle
    ct.animation_data.action_slot = idle.slots[0]
    sc.frame_start, sc.frame_end = 1, int(idle.frame_end)
    sc.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=OUT)
B.C.dump_json(SUMMARY, summary, indent=1)
log("saved", OUT)
