"""V3: mo lai D01_hodling_rig.blend, doc trang thai viewport 3D DA LUU (Solid + texture) va thu chup bang bpy.ops.render.opengl (can OpenGL context, khong co trong -b).
Khong luu .blend. Chay: blender -b --factory-startup -P v3_viewport_shot.py -- [out.png]"""
import json, os, sys
import bpy
from mathutils import Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import d01_common as C
import d01_rigkit as K
out = (C.script_args() or [os.path.join(C.QA, "A3_viewport_reopened_v1.png")])[0]
bpy.ops.wm.open_mainfile(filepath=C.BLEND)
wm = bpy.context.window_manager
win = wm.windows[0]
area = [a for a in win.screen.areas if a.type == "VIEW_3D"][0]
region = [r for r in area.regions if r.type == "WINDOW"][0]
sp = area.spaces[0]
info = {"shading": {"type": sp.shading.type, "color_type": sp.shading.color_type, "light": sp.shading.light},
        "bones_overlay": sp.overlay.show_bones, "region": [region.width, region.height], "active": bpy.context.view_layer.objects.active.name,
        "selected": [o.name for o in bpy.data.objects if o.select_get()]}
sc = bpy.context.scene
cam_data = bpy.data.cameras.new("tmp_cam"); cam = bpy.data.objects.new("tmp_cam", cam_data); sc.collection.objects.link(cam)
cam.location = Vector((0.62, -0.95, 0.52)); cam_data.lens = 60
d = Vector((0, 0, 0.24)) - cam.location
cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
sc.camera = cam
sc.render.resolution_x = sc.render.resolution_y = 1400
sc.render.filepath = out
try:
    with bpy.context.temp_override(window=win, area=area, region=region):
        sp.region_3d.view_perspective = "CAMERA"
        bpy.ops.render.opengl(write_still=True, view_context=True)
    info["ok"] = os.path.exists(out)
except Exception as e:
    info["ok"] = False; info["error"] = repr(e)
info["note"] = "Blender -b khong co OpenGL context: khong chup duoc viewport; doc lai trang thai UI da luu (shading Solid/Texture/Studio, overlay bone, doi tuong active/selected). Mo file bang giao dien de xem."
os.makedirs(C.CHECKS, exist_ok=True)
json.dump(info, open(os.path.join(C.CHECKS, "viewport_state.json"), "w"), indent=1)
print("VPSHOT", json.dumps(info))
