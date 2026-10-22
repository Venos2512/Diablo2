"""Read back the saved UI state of an anim .blend in background mode (screens, 3D viewport shading, timeline, scene range, assigned action).
  blender -b <anim .blend> -P viewport_probe.py -- --out <json>
This only reads the SAVED state; it is not a GUI check (see gui_play_test.py for the real-window session)."""
import json
import os
import sys

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(HERE)), "tools"))
import d01_common as C  # noqa: E402

args = sys.argv[sys.argv.index("--") + 1:]
out = args[args.index("--out") + 1]
sc = bpy.context.scene
ct = bpy.data.objects["D01_control"]
res = {"scene": {"name": sc.name, "fps": sc.render.fps, "fps_base": sc.render.fps_base, "frame_start": sc.frame_start, "frame_end": sc.frame_end,
                 "frame_current": sc.frame_current, "use_preview_range": sc.use_preview_range, "frame_preview": [sc.frame_preview_start, sc.frame_preview_end]},
       "assigned": {"action": ct.animation_data.action.name if ct.animation_data and ct.animation_data.action else None,
                    "slot": ct.animation_data.action_slot.identifier if ct.animation_data and ct.animation_data.action_slot else None,
                    "nla_tracks": len(ct.animation_data.nla_tracks) if ct.animation_data else 0},
       "actions": {a.name: {"range": [a.frame_start, a.frame_end], "use_frame_range": a.use_frame_range, "cyclic": a.use_cyclic, "fake_user": a.use_fake_user,
                            "slots": [s.identifier for s in a.slots], "status": a.get("status")} for a in bpy.data.actions},
       "ik_switches": {k: ct[k] for k in ("ik_leg_L", "ik_leg_R", "ik_arm_L", "ik_arm_R")},
       "viewports": [], "screens": []}
for scr in bpy.data.screens:
    res["screens"].append({"name": scr.name, "areas": [a.type for a in scr.areas]})
    for a in scr.areas:
        if a.type == "VIEW_3D":
            sp = a.spaces.active
            sh = sp.shading
            res["viewports"].append({"screen": scr.name, "shading_type": sh.type, "color_type": sh.color_type, "light": sh.light, "show_overlays": sp.overlay.show_overlays,
                                     "show_bones": getattr(sp.overlay, "show_bones", None), "show_armature_overlay": None})
res["objects"] = [{"name": o.name, "type": o.type, "hide_viewport": o.hide_viewport, "hide_get": o.hide_get(), "select": o.select_get()} for o in bpy.data.objects]
res["images"] = [{"name": i.name, "size": list(i.size), "packed": i.packed_file is not None} for i in bpy.data.images]
C.dump_json(out, res, indent=1)
print("[probe] ok", out)
