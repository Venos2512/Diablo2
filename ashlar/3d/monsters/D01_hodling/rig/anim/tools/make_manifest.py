"""Build rig/anim/clips.json from the build summary, the R7 metrics and the clip table (python -I; bpy/mathutils are stubbed only to import
the clip table from r6_build.py). Approval fields stay null until the user's G3 / R8 / R9."""
import hashlib
import json
import os
import sys
import types

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ANIM = os.path.dirname(HERE)
RIG = os.path.dirname(ANIM)
ASSET = os.path.dirname(RIG)
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(RIG, "tools"))
for m in ("bpy", "mathutils"):
    sys.modules[m] = types.ModuleType(m)
sys.modules["mathutils"].Matrix = sys.modules["mathutils"].Quaternion = sys.modules["mathutils"].Vector = object
import r6_build as B  # noqa: E402
from kk_source import Lib  # noqa: E402

FPS = 24
qa = json.load(open(os.path.join(ANIM, "qa", "r7_metrics.json")))
bs = json.load(open(os.path.join(ANIM, "qa", "r6_build_summary.json")))
lab = json.load(open(os.path.join(ANIM, "qa", "lab_character_test.json")))
lib = Lib()


def sha(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for ch in iter(lambda: f.read(1 << 20), b""):
            h.update(ch)
    return h.hexdigest()


def runs_cyclic(idx, n, loop):
    m = np.zeros(n, bool)
    m[idx] = True
    if loop:
        m = m[:-1]
    L = len(m)
    if not m.any():
        return []
    if m.all():
        return [(0, L - 1)]
    start = int(np.argmin(m)) if loop else 0
    order = [(start + i) % L for i in range(L)] if loop else list(range(L))
    out, cur = [], []
    for i in order:
        if m[i]:
            cur.append(i)
        elif cur:
            out.append(cur)
            cur = []
    if cur:
        out.append(cur)
    return [(r[0], r[-1]) for r in out]


def ev(frame0, f_start):
    return {"frame": int(frame0 + f_start), "offset_frames": int(frame0), "time_s": round(frame0 / FPS, 6)}


BONE_MAP = {
    "method": "FK: world-space rotation delta of the KayKit bone vs the shared T-pose (KayKit rest, Hodling rest are both T-pose, +X = character left), composed on the Hodling rest rotation of the ctl_ bone and converted to pose-bone basis. Legs: end-effector retarget (hip-joint centre + ankles scaled by S_leg and given to ctl_cog / ctl_*_Foot_IK, heel/ball roll from foot pitch); knees solved by the rig's own IK. Arms stay FK (ik_arm_L/R keyed 0, ik_leg_L/R keyed 1).",
    "S_leg": bs["S_leg"],
    "S_leg_definition": "hip-joint-to-ankle height of the Hodling rest (0.130 m) / the same on the KayKit T-pose",
    "rotation": {"ctl_pelvis": "hips", "ctl_spine_01": "slerp(hips, spine, 0.6)", "ctl_spine_02": "spine", "ctl_chest": "chest", "ctl_neck": "slerp(chest, head, 0.35)", "ctl_head": "head",
                 "ctl_L_UpperArm": "upperarm.l", "ctl_L_ForeArm": "lowerarm.l", "ctl_L_Hand": "hand.l", "ctl_R_UpperArm": "upperarm.r", "ctl_R_ForeArm": "lowerarm.r", "ctl_R_Hand": "hand.r"},
    "translation": {"ctl_cog": "mean(upperleg.l, upperleg.r) position, scaled by S_leg, delta from T-pose", "ctl_L_Foot_IK / ctl_R_Foot_IK": "foot.l / foot.r ankle position, scaled by S_leg, delta from T-pose; yaw+pitch from the source foot orientation"},
    "secondary_not_from_source": {"ctl_sack": "damped lag (3 Hz, zeta 0.45) of chest rotation, 70 % blend", "ctl_helmet": "damped lag (4 Hz, 0.40) of head rotation, 35 %", "ctl_L_ear / ctl_R_ear": "same lag of the head, x1.5",
                                  "ctl_loincloth_front": "hip-flexion rule (-30 deg at 70 deg) raised per frame to the MEASURED smallest world-X angle that leaves no new flap<->thigh intersection (+5 deg), smoothed"},
    "unused_source_bones": ["root", "toes.l", "toes.r", "wrist.*", "handslot.*"],
    "no_finger_bones": "the Hodling has no finger bones; hands cannot close (attack = open-hand strike)",
}

SRC_REF = {"library": "KayKit Adventurers 1.0 (Kay Lousberg)", "license": "CC0-1.0", "license_url": "https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0",
           "git_commit": "12ee5abe75ada7356f45916f73feaf1cffa21994", "file": "lookdev-lab/assets/samples/kaykit-anims-medium.glb (extracted to rig/anim/refs/, file deleted from the lab working tree on purpose, never restored there)",
           "blob": "27fd96a347189b135b0facd83fab7527b301a950", "sha256": "35a136f28c9f9d219ead9e47ddad241fff937063a5578532f2fbde4b80dbe5cf",
           "prepared_by": "lookdev-lab/scripts/prepare-kaykit.py (IK/control channels dropped, rest-pose channels dropped, linear-redundant keys dropped, rotations 16-bit normalized; copy in rig/anim/refs/)",
           "source_fps": "30 (inferred: every duration is a multiple of 1/30 s); the pack's original fps was not verified"}

clips = {}
for name, spec in B.CLIPS.items():
    q = qa["clips"][name]
    s = bs["clips"][name]
    f0 = 1
    N = spec["N"]
    f1 = f0 + N
    loop = spec["loop"]
    t_src = s["t_src"]
    ch = lib.channels(spec["src"])
    keys = max(len(t) for t, _ in ch.values())
    src_dur = lib.clip_range(spec["src"])[1]
    entry = {
        "name": name, "state": spec["state"], "stance": "unarmed", "status": "experiment",
        "status_note": "candidate for G3 (user approval of the motion); not approved",
        "source": {**SRC_REF, "clip": spec["src"], "source_duration_s": round(src_dur, 6), "source_max_keys_per_channel": keys,
                   "source_range_used_s": [round(min(t_src), 6), round(max(t_src), 6)]},
        "derived_from": f"KayKit {spec['src']} (library clip, retargeted: FK world-delta + IK end-effector). Not a video reconstruction and not generated by code; the secondary motion (sack/helmet/ears/loincloth) is derived procedurally from the retargeted body motion.",
        "retime": {"kind": "piecewise-linear time warp of the source, then resampling at 24 fps (not an fps relabel)",
                   "timemap_out_frame_to_source_s": spec["timemap"],
                   "speed_factor_source_over_target": round((max(t_src) - min(t_src)) / (N / FPS), 4) if name != "idle" else round(IDLE := 2 * 1.0666667222976685 / (N / FPS), 4),
                   "note": "idle = two cycles of the 1.0667 s source in 2.0 s" if name == "idle" else None},
        "adaptation": {k: spec[k] for k in ("gain", "hip_xy", "lift", "feet", "stance_extend", "loin_max") if k in spec},
        "frame_start": f0, "frame_end": f1, "fps": FPS, "intervals": N, "sample_count": q["sample_count"],
        "sample_count_note": "keyed frame_start..frame_end inclusive, one key per frame on every keyed channel" + ("; the last frame closes the loop (== first) and is dropped by a runtime export that loops" if loop else ""),
        "duration_s": N / FPS, "duration_check": f"({f1} - {f0}) / {FPS} = {(f1 - f0) / FPS:.6f}",
        "loop": loop,
        "seam": {"max_vertex_diff_first_vs_last_mm": round(q["seam"]["max_vertex_diff_mm_first_vs_last"], 4), "max_bone_rot_diff_deg": round(q["seam"]["max_bone_rot_diff_deg"], 3), "worst_bone": q["seam"]["worst_bone"]},
        "root_displacement": {"horizontal_m": [0.0, 0.0], "vertical_m": q["root_displacement"]["ctl_root_range_m"][2], "ctl_root_range_m": q["root_displacement"]["ctl_root_range_m"],
                              "cog_range_m": [round(x, 4) for x in q["root_displacement"]["cog_range_m"]],
                              "note": q["root_displacement"]["note"] + "; in-place: ctl_root / runtime root never move horizontally (cog sways inside the body)"},
        "floor": {"mesh_min_z_mm": [round(q["floor"]["mesh_min_z_mm_min"], 3), round(q["floor"]["mesh_min_z_mm_max"], 3)], "frames_below_-1mm": q["floor"]["frames_below_-1mm"]},
        "bone_mapping": "see manifest.bone_mapping",
        "textures": {"set": ["D01_hodling_basecolor.jpg", "D01_hodling_normal.jpg", "D01_hodling_rm.png"], "resolution": 4096,
                     "origin": "byte-identical to ../../D01_hodling.glb (rig/validation.json A1.10)", "where": "packed in rig/D01_hodling_rig_anim.blend; the review GLB embeds the same three maps",
                     "relative_path_set": None, "relative_path_note": "relative-path release set is an R8 deliverable"},
        "tolerance": {"export_reimport_vertex_m": None, "proposed_m": 0.001, "note": "R8 (clean reimport) not done; proposed from QA_CHECKLIST B1.8"},
        "approved": {"source": None, "export": None, "engine": None},
        "events": [], "contacts_s": {},
    }
    if loop:
        ent_idx = {sd: [i for i in s["source_contact_frames"][sd] if i < N] for sd in "LR"}
    else:
        ent_idx = {sd: s["source_contact_frames"][sd] for sd in "LR"}
    if name in ("walk", "run"):
        lo = q["locomotion"]
        for sd in "LR":
            r_ = runs_cyclic(ent_idx[sd], N + 1, True)
            entry["contacts_s"][sd] = [{"touchdown": ev(a, f0), "last_stance_frame": ev(b, f0), "stance_frames": int((b - a) % N) + 1,
                                        "derived_from": "source foot/toe height (KayKit), after retime"} for a, b in r_]
            for a, b in r_:
                entry["events"].append({"type": "footstep", "foot": sd, **ev(a, f0)})
        entry["events"].sort(key=lambda e: e["offset_frames"])
        entry["stride_m"] = round(lo["stride_m"], 4)
        entry["stride_definition"] = "ground distance per full cycle (same foot to same foot) = ground_speed * cycle_s; measured on the deformed sole vertices that stay in contact"
        entry["step_m"] = round(lo["step_m"], 4)
        entry["ground_speed_mps"] = round(lo["ground_speed_mps"], 4)
        entry["cycle_s"] = lo["cycle_s"]
        entry["ground_speed_by_stance_mps"] = [round(x, 4) for x in lo["speed_per_run_mps"]]
        entry["lab_measured_natural"] = lab["natural_speed_measured_by_lab"][name]
        entry["foot_slip"] = {"sole_geometry_flat_stance_max_mm_per_frame": round(lo["max_slip_vs_mean_mm_per_frame_flat_stance"], 3),
                              "sole_geometry_toe_off_transition_max_mm_per_frame": round(lo["max_slip_vs_mean_mm_per_frame_roll_phase"], 3),
                              "lab_FootCheck": lab["foot_slip_lab_FootCheck"][name]}
    if name in ("idle", "attack", "hit"):
        entry["foot_slip"] = {"planted_xy_drift_mm_over_clip": {sd: round(q["planted_feet"][sd]["max_xy_drift_mm_over_contact"], 3) for sd in "LR"},
                              "note": "feet stay on their rest spots (Foot_IK at rest); sole contact verified on deformed geometry"}
    if name == "attack":
        a = q["attack"]
        entry["events"].append({"type": "hit", **ev(spec["event_hit_frame"], f0), "percent_of_clip": round(spec["event_hit_frame"] / N * 100, 1),
                                "kind": "offset (relative to frame_start) and absolute Blender frame both given",
                                "measured": {"peak_hand_reach_frame": a["peak_reach_frame"], "peak_hand_reach_s": a["peak_reach_s"], "peak_reach_from_chest_m": round(a["peak_reach_m"], 4),
                                             "peak_hand_speed_frame": a["peak_speed_frame"], "peak_hand_speed_mps": round(a["peak_speed_mps"], 3),
                                             "note": "right hand (KayKit hand.r = Hodling R, -X side) is the striking hand; lab hitAt default 0.45 -> 0.444 here"}})
        entry["recovery"] = {"hit_to_end_s": round((N - spec["event_hit_frame"]) / FPS, 4), "note": "recovery to guard in 10 frames (0.417 s)"}
        entry["weapon"] = "none (unarmed, open-hand strike: no finger bones, cannot make a fist); spear is a separate future asset"
    if name == "death":
        V = np.load(os.path.join(ANIM, "qa", "eval_death.npz"))["V"].astype(float)
        sp = np.linalg.norm(np.diff(V, axis=0), axis=2).max(1) * FPS
        peak = int(sp.argmax())
        settle = next(i for i in range(peak, len(sp)) if sp[i] < 0.35)
        entry["events"] += [{"type": "ground_impact_settle", "note": "first frame after peak vertex speed where the fastest vertex < 0.35 m/s (use for dust at ground)", **ev(settle + 1, f0)},
                            {"type": "death_end", **ev(N, f0)}]
        entry["final_hold"] = {"fastest_vertex_speed_mps_last_3_intervals": [round(float(x), 3) for x in sp[-3:]], "note": "no loop; the runtime holds the last pose"}
        entry["root_displacement"]["note"] += "; ctl_root is lifted vertically by up to 21.9 mm so no vertex sinks below the floor (the body lies on the sack)"
    entry["loincloth"] = {**bs["loincloth"][name], "measured_flap_vs_thigh": q["loincloth"]["worst"], "frames_measured": len(q["loincloth"]["frames_tested"])}
    entry["ownership"] = q["ownership"]
    entry["review_evidence"] = {"strip": f"rig/qa/R7_{name}_strip.jpg", "preview_gif": f"rig/anim/qa/previews/R7_{name}_preview.gif", "gui_viewport": f"rig/anim/qa/gui/gui_{name}.png"}
    clips[name] = entry

manifest = {
    "asset_id": "D01_hodling", "manifest_version": 1, "generated": "2026-10-21", "stage": "R7 (R6 clips + R7 QA); G3, R8, R9 NOT done",
    "approvals": {"G1": "2026-10-21 user ('duyệt')", "G2": "2026-10-21 user ('duyệt') - rig v4", "G3": None, "G4": None, "R9": None},
    "units": "metres; Blender Z up / -Y forward; glTF Y up / +Z forward; character left = +X", "fps": FPS, "target_height_m": 0.5, "scale": 0.679495687,
    "files": {
        "source_blend_with_actions": {"path": "rig/D01_hodling_rig_anim.blend", "sha256": sha(os.path.join(RIG, "D01_hodling_rig_anim.blend")), "bytes": os.path.getsize(os.path.join(RIG, "D01_hodling_rig_anim.blend")),
                                      "note": "NEW file; the G2-approved rig is untouched at rig/D01_hodling_rig.blend and snapshotted. Never run tools/run_all.ps1 / b1_build_rig.py on this: they rebuild and overwrite the rig."},
        "g2_rig_blend": {"path": "rig/D01_hodling_rig.blend", "sha256": "bf6c53dc783842774b6c75b2f35eb708bbbbe47cee0139e560c97efa97bc0bcb", "bytes": 14843252},
        "g2_snapshot": {"path": "rig/_snapshots/g2_approved/D01_hodling_rig_g2.blend", "sha256": sha(os.path.join(RIG, "_snapshots", "g2_approved", "D01_hodling_rig_g2.blend"))},
        "original_glb": {"path": "D01_hodling.glb", "sha256": sha(os.path.join(ASSET, "D01_hodling.glb"))},
        "review_glb_intermediate": {"path": "rig/anim/checks/D01_hodling_anim_review_UNAPPROVED.glb", "sha256": sha(os.path.join(ANIM, "checks", "D01_hodling_anim_review_UNAPPROVED.glb")),
                                    "bytes": os.path.getsize(os.path.join(ANIM, "checks", "D01_hodling_anim_review_UNAPPROVED.glb")),
                                    "note": "R7 review export only (in-memory bake onto D01_runtime). Not the R8 release (D01_hodling_rig.glb does not exist). Blender's exporter dropped KHR_materials_volume (only KHR_materials_specular kept): the final material extension decision is R8, NOT passed here."},
    },
    "skin_mesh_untouched": {"hash_anim_blend": qa["mesh_skin_hash"], "hash_g2": qa.get("mesh_skin_hash_g2"), "equal": qa.get("mesh_skin_untouched_vs_g2"), "what": "sha256 of rest vertex coordinates + all vertex-group weights + group names (r7_qa.py)"},
    "scene_state_after_reopen": qa["mesh_counts"]["scene"],
    "source_library": SRC_REF,
    "bone_mapping": BONE_MAP,
    "lab_character_test": {"file": "rig/anim/qa/lab_character_test.json", "autoClip_map": lab["autoClip_map"], "natural": lab["natural_speed_measured_by_lab"]},
    "gui_session": "rig/anim/qa/gui/gui_play_test.json (real Blender window, ordinary Play operator driven by a timer; not a human click)",
    "clips": clips,
}
out = os.path.join(ANIM, "clips.json")
with open(out, "w", encoding="utf-8", newline="\n") as f:
    json.dump(manifest, f, indent=1, ensure_ascii=False)
print("wrote", out, os.path.getsize(out))
