"""R7 numerical QA on a REOPENED anim .blend: real evaluated motion (depsgraph), per Action.

  blender -b <anim .blend> -P r7_qa.py -- --out <metrics.json> [--g2 <G2 .blend>] [--loin 1]

Per clip: ownership/slot/range checks, loop seam, root displacement, floor contact on DEFORMED sole geometry, slip, stride/ground speed,
touchdown frames, hit-contact frame (attack), floor penetration of the whole mesh, loincloth clearance (d01_measure), key channel audit.
Finally (optional) compares the mesh + skin weights to the G2 snapshot to prove skin/mesh are untouched.
"""
import hashlib
import json
import math
import os
import sys
import time

import numpy as np

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(HERE)), "tools"))
import d01_rigkit as K  # noqa: E402

args = sys.argv[sys.argv.index("--") + 1:]
opt = {}
for i in range(0, len(args), 2):
    opt[args[i].lstrip("-")] = args[i + 1]
OUT = opt["out"]
G2 = opt.get("g2")
DO_LOIN = opt.get("loin", "1") == "1"
FPS = 24
CONTACT_MM = 2.5


def log(*a):
    print("[r7]", *a, flush=True)


sc = bpy.context.scene
ct = K.control()
mesh = K.get_mesh()
rt = K.runtime()
me = mesh.data
names = [g.name for g in mesh.vertex_groups]
n = len(me.vertices)
W = np.zeros((n, len(names)))
for v in me.vertices:
    for g in v.groups:
        W[v.index, g.group] = g.weight
rest = K.rest_positions()
foot_v = {s: np.nonzero(W[:, [names.index(f"{s}_Foot"), names.index(f"{s}_Toe")]].sum(1) > 0.5)[0] for s in "LR"}
sole_v = {s: foot_v[s][rest[foot_v[s], 2] < 0.006] for s in "LR"}
hand_v = {s: np.nonzero(W[:, names.index(f"{s}_Hand")] > 0.5)[0] for s in "LR"}
chest_v = np.nonzero(W[:, names.index("chest")] > 0.5)[0]
log("sole verts", {s: len(v) for s, v in sole_v.items()}, "hand verts", {s: len(v) for s, v in hand_v.items()})

result = {"blend": bpy.data.filepath, "blender": bpy.app.version_string, "contact_threshold_mm": CONTACT_MM, "clips": {}}
loin_ctx = None
if DO_LOIN:
    import d01_measure as M
    loin_ctx = M.Ctx()
    base = M.flap_vs_body(loin_ctx, rest)
    log("loincloth rest baseline", {k: v for k, v in base.items() if not k.endswith("ids")})


def runs_of(mask, loop):
    m = np.asarray(mask[:-1] if loop else mask, bool)
    L = len(m)
    if not m.any():
        return []
    if m.all():
        return [list(range(L))]
    start = int(np.argmin(m)) if loop else 0
    idx = [(start + i) % L for i in range(L)] if loop else list(range(L))
    runs, cur = [], []
    for i in idx:
        if m[i]:
            cur.append(i)
        elif cur:
            runs.append(cur)
            cur = []
    if cur:
        runs.append(cur)
    return runs


def eval_clip(act):
    info = {}
    meta = json.loads(act["d01_clip"])
    f0, f1 = int(act.frame_start), int(act.frame_end)
    N = f1 - f0
    loop = bool(meta["loop"])
    # ownership
    ct.animation_data.action = act
    slots = [s.identifier for s in act.slots]
    ct.animation_data.action_slot = act.slots[0]
    info["ownership"] = {"action": act.name, "assigned": ct.animation_data.action.name, "slot": ct.animation_data.action_slot.identifier,
                         "slots": slots, "slot_target_id_type": act.slots[0].target_id_type, "use_frame_range": act.use_frame_range, "frame_range": [f0, f1],
                         "use_cyclic": act.use_cyclic, "fake_user": act.use_fake_user, "users": act.users}
    sc.frame_start, sc.frame_end = f0, f1
    # key channel audit
    fcs = []
    try:
        for layer in act.layers:
            for strip in layer.strips:
                for cb in strip.channelbags:
                    fcs.extend(cb.fcurves)
    except Exception as e:  # legacy API fallback
        fcs = list(act.fcurves)
    paths = sorted({fc.data_path.split(".")[-1] if fc.data_path.startswith("pose.bones") else fc.data_path for fc in fcs})
    bones_keyed = sorted({fc.data_path.split('"')[1] for fc in fcs if fc.data_path.startswith("pose.bones")})
    kfr = [kp.co[0] for fc in fcs for kp in fc.keyframe_points]
    info["keys"] = {"fcurves": len(fcs), "paths": paths, "bones_keyed": len(bones_keyed), "all_bones_exist": all(b in ct.pose.bones for b in bones_keyed),
                    "key_frame_min": min(kfr), "key_frame_max": max(kfr), "keys_total": len(kfr),
                    "interpolation": sorted({kp.interpolation for fc in fcs for kp in fc.keyframe_points}),
                    "scale_keys": any("scale" in p for p in paths)}
    frames = list(range(f0, f1 + 1))
    V = np.zeros((len(frames), n, 3), dtype=np.float32)
    root = np.zeros((len(frames), 3))
    cog = np.zeros((len(frames), 3))
    rtroot = np.zeros((len(frames), 3))
    quat = {}
    for i, f in enumerate(frames):
        sc.frame_set(f)
        V[i] = K.eval_mesh_positions()
        root[i] = np.array(ct.pose.bones["ctl_root"].matrix.translation) - np.array(ct.data.bones["ctl_root"].head_local)
        cog[i] = np.array(ct.pose.bones["ctl_cog"].matrix.translation)
        rtroot[i] = np.array(rt.matrix_world @ rt.pose.bones["root"].head)
        for pb in ct.pose.bones:
            quat.setdefault(pb.name, []).append((np.array(pb.rotation_quaternion), np.array(pb.location)))
    info["sample_count"] = len(frames)
    info["duration_s"] = N / FPS
    info["fps"] = FPS
    # loop seam
    seam_mm = float(np.abs(V[0] - V[-1]).max() * 1000)
    max_rot = 0.0
    max_loc = 0.0
    worst = None
    for b, lst in quat.items():
        q0, l0 = lst[0]
        q1, l1 = lst[-1]
        ang = math.degrees(2 * math.acos(min(1.0, abs(float(np.dot(q0, q1))))))
        if ang > max_rot:
            max_rot, worst = ang, b
        max_loc = max(max_loc, float(np.abs(l0 - l1).max()))
    info["seam"] = {"loop": loop, "max_vertex_diff_mm_first_vs_last": seam_mm, "max_bone_rot_diff_deg": max_rot, "worst_bone": worst,
                    "max_loc_diff_mm": max_loc * 1000}
    # root displacement (character stays in place)
    info["root_displacement"] = {"ctl_root_range_m": [float(x) for x in (root.max(0) - root.min(0))], "ctl_root_max_abs_m": [float(x) for x in np.abs(root).max(0)],
                                 "runtime_root_head_range_m": [float(x) for x in (rtroot.max(0) - rtroot.min(0))],
                                 "cog_range_m": [float(x) for x in (cog.max(0) - cog.min(0))],
                                 "note": "ctl_root vertical lift only in death (floor clamp)" if np.abs(root).max() > 1e-6 else "none"}
    # floor
    gmin = V[:, :, 2].min(1) * 1000
    info["floor"] = {"mesh_min_z_mm_min": float(gmin.min()), "mesh_min_z_mm_max": float(gmin.max()), "frames_below_-1mm": [int(f) for f, g in zip(frames, gmin) if g < -1.0]}
    # sole contact + slip
    fe = {}
    expected_v = None
    for s in "LR":
        sz = V[:, sole_v[s], 2] * 1000
        minz = V[:, foot_v[s], 2].min(1) * 1000
        contact = sz.min(1) < CONTACT_MM
        fe[s] = dict(minz=minz, contact=contact, sole_z=sz)
    info["foot"] = {}
    locomotion = meta["state"] in ("walk", "run")
    stride_runs = []
    for s in "LR":
        c = fe[s]["contact"]
        runs = runs_of(c, loop)
        disp_frames = []
        run_info = []
        slip_dev = 0.0
        for r in runs:
            if len(r) < 2:
                continue
            ds, nc = [], []
            for a, b in zip(r[:-1], r[1:]):
                # a, b index into the frame list (a loop run may wrap to 0)
                Ca = set(sole_v[s][np.nonzero(V[a, sole_v[s], 2] * 1000 < CONTACT_MM)[0]])
                Cb = set(sole_v[s][np.nonzero(V[b, sole_v[s], 2] * 1000 < CONTACT_MM)[0]])
                C = sorted(Ca & Cb)
                if len(C) < 3:
                    continue
                ds.append((V[b, C, :2] - V[a, C, :2]).mean(0))
                nc.append(len(C))
            if not ds:
                continue
            ds, nc = np.array(ds), np.array(nc)
            flat = nc >= 0.6 * nc.max()          # steady stance (large contact patch) vs heel-strike / toe-off roll (patch shrinking)
            mean = ds[flat].mean(0)
            dev_flat = np.linalg.norm(ds[flat] - mean, axis=1).max() * 1000
            roll_ok = (~flat) & (nc >= 8)        # transition pairs with a tiny common patch (foot leaving the floor) are not slip
            dev_roll = np.linalg.norm(ds[roll_ok] - mean, axis=1).max() * 1000 if roll_ok.any() else 0.0
            slip_dev = max(slip_dev, dev_flat)
            run_info.append({"frames": [frames[x] for x in (r[0], r[-1])], "len": len(r), "total_travel_mm": float(np.linalg.norm(ds.sum(0)) * 1000),
                             "mean_step_mm_per_frame": float(np.linalg.norm(mean) * 1000), "mean_dir_xy": [float(x) for x in mean / (np.linalg.norm(mean) + 1e-12)],
                             "max_jitter_mm_per_frame": float(dev_flat), "max_jitter_roll_phase_mm_per_frame": float(dev_roll),
                             "flat_pairs": int(flat.sum()), "roll_pairs": int((~flat).sum()), "dt_frames": len(ds)})
            stride_runs.append((s, run_info[-1]))
        touch = []
        m = np.asarray(c[:-1] if loop else c, bool)
        for i in range(len(m)):
            prev = m[i - 1] if (loop or i > 0) else False
            if m[i] and not prev:
                touch.append(frames[i])
        info["foot"][s] = {"contact_frames": [int(frames[i]) for i in range(len(c)) if c[i]], "touchdown_frames": [int(t) for t in touch],
                           "touchdown_s": [(t - f0) / FPS for t in touch], "runs": run_info,
                           "minz_mm_range": [float(fe[s]["minz"].min()), float(fe[s]["minz"].max())],
                           "contact_minz_mm_range": [float(fe[s]["minz"][c].min()), float(fe[s]["minz"][c].max())] if c.any() else None,
                           "max_stance_jitter_mm_per_frame": float(slip_dev)}
    # locomotion numbers
    if locomotion and stride_runs:
        speeds = [r["mean_step_mm_per_frame"] * FPS / 1000.0 for _, r in stride_runs if r["len"] >= 2]
        travel = [r["total_travel_mm"] / 1000.0 for _, r in stride_runs]
        T = N / FPS
        v = float(np.mean(speeds))
        info["locomotion"] = {"ground_speed_mps": v, "speed_per_run_mps": [float(x) for x in speeds],
                              "speed_spread_pct": float((max(speeds) - min(speeds)) / v * 100),
                              "stance_travel_m_mean": float(np.mean(travel)), "cycle_s": T,
                              "stride_m": v * T,                # one full cycle (same foot to same foot)
                              "step_m": v * T / 2,
                              "max_slip_vs_mean_mm_per_frame_flat_stance": max(r["max_jitter_mm_per_frame"] for _, r in stride_runs),
                              "max_slip_vs_mean_mm_per_frame_roll_phase": max(r["max_jitter_roll_phase_mm_per_frame"] for _, r in stride_runs),
                              "slip_pct_of_speed_flat_stance": float(max(r["max_jitter_mm_per_frame"] for _, r in stride_runs) / 1000.0 * FPS / v * 100) if v > 0 else None}
    elif meta["state"] in ("idle", "attack", "hit"):
        info["planted_feet"] = {s: {"max_xy_drift_mm_over_contact": float(max(
            (np.linalg.norm(V[i, sole_v[s], :2].mean(0) - V[j, sole_v[s], :2].mean(0)) * 1000)
            for i in range(len(frames)) for j in range(i, len(frames)) if fe[s]["contact"][i] and fe[s]["contact"][j])) if fe[s]["contact"].sum() > 1 else None}
            for s in "LR"}
    # hit contact (attack): striking hand = R (KayKit Punch_A uses hand.r)
    if meta["state"] == "attack":
        hc = V[:, hand_v["R"], :].mean(1)
        ch = V[:, chest_v, :].mean(1)
        reach = -(hc[:, 1] - ch[:, 1])  # forward distance of the hand from chest (-Y forward)
        sp = np.r_[0, np.linalg.norm(np.diff(hc, axis=0), axis=1) * FPS]
        i_reach = int(reach.argmax())
        info["attack"] = {"hand": "R", "peak_reach_frame": frames[i_reach], "peak_reach_s": (frames[i_reach] - f0) / FPS,
                          "peak_reach_m": float(reach[i_reach]), "peak_speed_frame": frames[int(sp.argmax())], "peak_speed_mps": float(sp.max()),
                          "reach_m_by_frame": [float(x) for x in reach],
                          "hit_event_frame_offset": int(meta.get("event_hit", -1)) if "event_hit" in meta else None}
    # loincloth clearance (frames of strong hip flexion + every 4th frame)
    if loin_ctx is not None:
        sel = list(range(len(frames))) if meta["state"] in ("walk", "run", "death", "attack") else sorted(set(list(range(0, len(frames), 4)) + [len(frames) - 1]))
        worst = {"new_inside_vertices_thigh": 0, "new_intersecting_triangles_thigh": 0, "new_covered_by_thigh_vertices": 0, "max_depth_thigh_mm": 0.0}
        tested = []
        for i in sel:
            d = M.flap_delta(M.flap_vs_body(loin_ctx, V[i].astype(np.float64)), base)
            for k_ in worst:
                worst[k_] = max(worst[k_], d[k_])
            tested.append(frames[i])
        info["loincloth"] = {"frames_tested": tested, "worst": worst, "note": "vs rest baseline; flap vs body only, no vs arms/sack"}
    return info, V


for nm in ["idle", "walk", "run", "attack", "hit", "death"]:
    if nm not in bpy.data.actions:
        log("missing action", nm)
        continue
    act = bpy.data.actions[nm]
    t0 = time.time()
    info, V = eval_clip(act)
    result["clips"][nm] = info
    log(nm, "done", round(time.time() - t0, 1), "s")
    for _try in range(15):  # Windows indexer/AV locks make a write fail now and then
        try:
            np.savez_compressed(os.path.join(os.path.dirname(OUT), f"eval_{nm}.npz"), V=V.astype(np.float16))
            break
        except OSError:
            time.sleep(1.0)

# restore ordinary state: idle assigned, scene range = idle
idle = bpy.data.actions["idle"]
ct.animation_data.action = idle
ct.animation_data.action_slot = idle.slots[0]
sc.frame_start, sc.frame_end = int(idle.frame_start), int(idle.frame_end)
sc.frame_set(1)


def mesh_hash():
    h = hashlib.sha256()
    h.update(rest.astype(np.float32).tobytes())
    h.update(W.astype(np.float32).tobytes())
    h.update(",".join(names).encode())
    return h.hexdigest()


result["mesh_skin_hash"] = mesh_hash()
result["mesh_counts"] = {"verts": n, "tris": len(me.polygons), "bones_runtime": len(rt.data.bones), "bones_control": len(ct.data.bones),
                         "scene": {"fps": sc.render.fps, "fps_base": sc.render.fps_base, "frame_start": sc.frame_start, "frame_end": sc.frame_end,
                                   "preview": sc.use_preview_range, "nla_tracks": len(ct.animation_data.nla_tracks)},
                         "actions": sorted(a.name for a in bpy.data.actions)}
import d01_common as C  # noqa: E402
C.dump_json(OUT, result, indent=1)
log("wrote", OUT)
if G2:
    bpy.ops.wm.open_mainfile(filepath=G2)
    ct = K.control(); mesh = K.get_mesh(); me = mesh.data
    names = [g.name for g in mesh.vertex_groups]
    W = np.zeros((len(me.vertices), len(names)))
    for v in me.vertices:
        for g in v.groups:
            W[v.index, g.group] = g.weight
    rest = K.rest_positions()
    g2 = mesh_hash()
    result["mesh_skin_hash_g2"] = g2
    result["mesh_skin_untouched_vs_g2"] = (g2 == result["mesh_skin_hash"])
    C.dump_json(OUT, result, indent=1)
    log("g2 hash equal:", result["mesh_skin_untouched_vs_g2"])
