# D01 Hodling R6–R7: Opus review (read-only)

Date: 2026-10-21. Reviewer: Opus 5.5. Verdict: **PASS, ready for the G3 preview.** This covers motion quality and R7 evidence only. R8, G4 and R9 are not reviewed.

## What I checked
- SHA-256 hashes. `D01_hodling_rig.blend` and `_snapshots/g2_approved/D01_hodling_rig_g2.blend` both hash to `bf6c53dc…bc0bcb`, so the G2 file is untouched. `D01_hodling_rig_anim.blend` hashes to `c5996c2b…37b9`, matching `progress.json`.
- `qa/viewport_probe_reopened.json` (the saved file, reopened):
  - six Actions, each on slot `OBD01_control`, with `use_frame_range` on;
  - idle, walk and run are cyclic;
  - 0 NLA tracks, 24 fps, preview range off;
  - leg IK = 1, arm IK = 0.
- `qa/r7_metrics.json`:
  - the mesh and skin hash matches G2;
  - the loop seam is 0.0 mm (worst bone rotation 0.26°, on the loincloth);
  - no scale keys, and `ctl_root` has no horizontal motion.
- `clips.json`:
  - each clip records its KayKit CC0 source with a pinned blob and sha, plus its duration;
  - attack has a hit event at offset 8 (0.333 s = 44.4 %), and that frame matches the measured peak hand reach;
  - death has `ground_impact_settle` at 21 and `death_end` at 31;
  - walk and run have footstep events.
- `qa/gui/gui_play_test.json`: a real Blender 5.2.2 window (not background mode, OpenGL on an RTX 4070) ran `screen.animation_play` and the frame advanced for all six Actions. A script triggered playback instead of a person, but it is ordinary playback, so I accept it as evidence.
- I looked at all six strips (`../qa/R7_*_strip.jpg`) for quality.

## Blocking findings
None.

## Non-blocking notes (show the user at G3; none of them blocks G3)
1. **Death, frames 19–31: the loincloth goes into the thigh by up to 17.5 mm.** I could not see it in the game-camera or side strips: in the lying pose the flap sits between the raised legs and under the sack. Show the user one close-up of frame 31. If they reject it, the smallest fix is in R6: key a little more thigh spread (or a small extra flap tilt) on frames 19–31 only. The other option is a corrective shape key, but that touches the mesh, so it is an R8 decision. Do not change the rig.
2. **Walk speed has two values: 0.358 m/s from the sole vertices and 0.278 m/s from the lab's toe bone.** The yellow heel-lift slip (14.5 cm/s for 0.117 s) is short and was not visible in the strip. Before G4, decide which speed the engine will use and record it in `clips.json`. Recommendation: the lab value, because that is what FootCheck scored green.
3. **Run: stride 1.22 m per cycle, 1.63 m/s, with only 2 contact frames per step.** That is a fast scurry, about 3.3 body heights per second. The side strip looks believable rather than skating. This is the user's call at G3. If it reads as floaty, the minimal fix is to shorten the source time-warp so the clip covers less ground per cycle, giving a lower run speed (e.g. about 1.3 m/s). No rig change is needed.
4. **Attack is an open-hand swipe.** That follows from the approved no-fingers mesh. It reads clearly in the game view (f9: arm fully extended).
5. **Hit, frames 2–3:** the sack swings hard and briefly shows its inner side in the game view. It reads well as a hit reaction and needs no action.
6. **Not yet checked in the lab:** `hitAt`, crossfades between idle, walk, run and attack, and real-time playback (the lab test stepped `ctrl.update(1/60)` instead of running in real time). Put these in the G4/R8 lab pass, not G3.
7. **Blender playback hitch on loops:** the cyclic Actions have last frame = first frame, so playing 1–49 in Blender shows that pose twice (one 1/24 s hold). Time-based engine playback (duration = (end − start)/fps) is correct. This only affects the Blender preview.
8. **Missing KHR_materials_volume in the review GLB:** it is correctly held back for R8, and the GLB is clearly marked UNAPPROVED.

## Path to G3
Show the user the six GIFs in `qa/previews/`, the strips, and one close-up of death frame 31. Ask them for:
- G3 approve or reject for each clip;
- a decision on the run speed (note 3);
- whether the death clipping is acceptable (note 1).
