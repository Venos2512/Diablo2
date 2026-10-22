"""Real Blender GUI session (not -b): for every Action, assign it with its slot, set the scene range, press ordinary Play (screen.animation_play),
let the event loop advance the frames, grab the 3D viewport (area screenshot, textured Solid shading), then stop. Driven by a timer
because the GUI needs real redraws. Writes a JSON log + PNGs and quits WITHOUT saving.

  blender --window-geometry <x> <y> <w> <h> <anim .blend> --python gui_play_test.py -- --out <dir>
Honest scope: the playback is started by the script's `bpy.ops.screen.animation_play()` in the real window, not by a human click.
"""
import json
import os
import sys
import time

import bpy

args = sys.argv[sys.argv.index("--") + 1:]
OUT = args[args.index("--out") + 1]
os.makedirs(OUT, exist_ok=True)
CLIPS = ["idle", "walk", "run", "attack", "hit", "death"]
log = {"blender": bpy.app.version_string, "background": bpy.app.background, "gpu": None, "clips": {}, "events": []}
t_start = time.time()


def note(*a):
    log["events"].append([round(time.time() - t_start, 2)] + [str(x) for x in a])
    print("[gui]", *a, flush=True)


def finish(code=0):
    with open(os.path.join(OUT, "gui_play_test.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(log, f, indent=1)
    bpy.ops.wm.quit_blender()


def find_view3d():
    for win in bpy.context.window_manager.windows:
        for area in win.screen.areas:
            if area.type == "VIEW_3D":
                region = next(r for r in area.regions if r.type == "WINDOW")
                return win, area, region
    return None, None, None


state = {"i": 0, "phase": 0, "t0": 0.0, "f_start": 0}


def tick():
    try:
        return _tick()
    except Exception as e:  # log and leave
        note("EXCEPTION", repr(e))
        finish(1)
        return None


def _tick():
    sc = bpy.context.scene
    win, area, region = find_view3d()
    if win is None:
        note("no VIEW_3D area in this window's screen")
        finish(1)
        return None
    ct = bpy.data.objects["D01_control"]
    if state["i"] == 0 and state["phase"] == 0:
        try:
            import gpu
            log["gpu"] = {"backend": gpu.platform.backend_type_get(), "renderer": gpu.platform.renderer_get() if hasattr(gpu.platform, "renderer_get") else None}
        except Exception as e:
            log["gpu"] = repr(e)
        sp = area.spaces.active
        log["viewport"] = {"screen": win.screen.name, "shading": sp.shading.type, "color_type": sp.shading.color_type, "light": sp.shading.light, "overlays": sp.overlay.show_overlays,
                           "area_size": [area.width, area.height], "window_size": [win.width, win.height]}
        note("start", log["viewport"])
    if state["i"] >= len(CLIPS):
        note("done")
        finish(0)
        return None
    name = CLIPS[state["i"]]
    act = bpy.data.actions[name]
    with bpy.context.temp_override(window=win, area=area, region=region):
        if state["phase"] == 0:  # switch action + slot + scene range, then Play
            ct.animation_data.action = act
            ct.animation_data.action_slot = act.slots[0]
            sc.frame_start, sc.frame_end = int(act.frame_start), int(act.frame_end)
            sc.frame_set(sc.frame_start)
            state["f_start"] = sc.frame_current
            bpy.ops.screen.animation_play()
            state["t0"] = time.time()
            state["phase"] = 1
            note(name, "assigned", ct.animation_data.action.name, ct.animation_data.action_slot.identifier, "range", sc.frame_start, sc.frame_end, "play started")
            return 0.5
        if state["phase"] == 1:  # playing: sample the frame counter, grab the viewport, stop
            playing = bpy.context.screen.is_animation_playing
            frame = sc.frame_current
            png = os.path.join(OUT, f"gui_{name}.png")
            try:
                bpy.ops.screen.screenshot_area(filepath=png)
                shot = os.path.getsize(png)
            except Exception as e:
                shot = repr(e)
            bpy.ops.screen.animation_cancel(restore_frame=False)
            log["clips"][name] = {"is_animation_playing": playing, "frame_at_sample": frame, "frame_advanced": frame != state["f_start"], "elapsed_s": round(time.time() - state["t0"], 2),
                                  "range": [sc.frame_start, sc.frame_end], "action": ct.animation_data.action.name, "slot": ct.animation_data.action_slot.identifier,
                                  "screenshot": os.path.basename(png), "screenshot_bytes": shot}
            note(name, "sample", log["clips"][name])
            state["i"] += 1
            state["phase"] = 0
            return 0.3
    return 0.5


bpy.app.timers.register(tick, first_interval=4.0)
