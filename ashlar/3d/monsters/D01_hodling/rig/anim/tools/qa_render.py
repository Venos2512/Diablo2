"""Render textured Workbench frames of D01 Actions (review evidence, not a release export). Run in Blender:

  blender -b <anim .blend> -P qa_render.py -- --out <dir> --clips idle,walk --views game,side,front --mode strip|all --res 420

strip: ~10 evenly spaced frames per clip; all: every frame (for GIF/video). Files: <dir>/<clip>_<view>_<frameNN>.png
A floor plane and floor-contact line are added in memory only (the .blend is not saved).
"""
import math
import os
import sys

import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(HERE)), "tools"))
import d01_rigkit as K  # noqa: E402
import d01_render as R  # noqa: E402

args = sys.argv[sys.argv.index("--") + 1:]
opt = {}
for i in range(0, len(args), 2):
    opt[args[i].lstrip("-")] = args[i + 1]
OUT = opt["out"]
CLIPS = opt.get("clips", "idle,walk,run,attack,hit,death").split(",")
VIEWS = opt.get("views", "game,side").split(",")
MODE = opt.get("mode", "strip")
RES = int(opt.get("res", 420))
NSTRIP = int(opt.get("n", 10))
os.makedirs(OUT, exist_ok=True)

sc = R.setup_scene(res=RES, bg=(0.36, 0.36, 0.38))
sc.display.shading.show_shadows = False
cam = R.make_camera(sc)
ct = K.control()
mesh = K.get_mesh()

# floor plane (review helper only)
me = bpy.data.meshes.new("floor_qa")
me.from_pydata([(-3, -3, -0.0015), (3, -3, -0.0015), (3, 3, -0.0015), (-3, 3, -0.0015)], [], [(0, 1, 2, 3)])
fl = bpy.data.objects.new("floor_qa", me)
sc.collection.objects.link(fl)
mat = bpy.data.materials.new("floor_qa")
mat.diffuse_color = (0.20, 0.21, 0.23, 1.0)
me.materials.append(mat)

CAMS = {
    "game": dict(az=35.0, el=52.0),      # ARPG-like high 3/4 camera (front-left, 52 deg elevation)
    "side": dict(az=-90.0, el=0.0),      # from the character's right (character faces image right)
    "front": dict(az=0.0, el=0.0),
    "top": dict(az=0.0, el=89.0),
}


def point(view, center, scale):
    c = CAMS[view]
    az, el = math.radians(c["az"]), math.radians(c["el"])
    d = Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el)))
    cam.location = Vector(center) + d * 3.0
    cam.rotation_euler = (-d).to_track_quat("-Z", "Y").to_euler()
    cam.data.ortho_scale = scale
    cam.data.type = "ORTHO"
    bpy.context.view_layer.update()


def hide_all_but():
    for o in bpy.data.objects:
        if o.type == "ARMATURE":
            o.hide_set(True)
            o.hide_render = True


hide_all_but()
ct.hide_set(False)
for clip in CLIPS:
    act = bpy.data.actions[clip]
    ct.animation_data.action = act
    ct.animation_data.action_slot = act.slots[0]
    f0, f1 = int(act.frame_start), int(act.frame_end)
    if MODE == "all":
        frames = list(range(f0, f1 + 1))
    else:
        frames = sorted({round(f0 + (f1 - f0) * i / (NSTRIP - 1)) for i in range(NSTRIP)})
    scale = 1.0 if clip == "death" else 0.82
    center = (0, 0.12, 0.22) if clip == "death" else (0, 0, 0.26)
    for v in VIEWS:
        point(v, center, scale)
        for f in frames:
            sc.frame_set(f)
            sc.render.filepath = os.path.join(OUT, f"{clip}_{v}_{f:03d}.png")
            bpy.ops.render.render(write_still=True)
    print("[qa_render]", clip, len(frames), "frames x", len(VIEWS), "views", flush=True)
    ct.animation_data.action = None
