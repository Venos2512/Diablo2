"""Ham render Workbench (anh thuc cua model trong Blender, anh sang trung tinh) cho QA rig D01.

Camera truc giao, dat co dinh nen anh <-> toa do the gioi la phep chieu tuyen tinh (PIL ve overlay xuong anh).
Khong dung camera/anh sang thay doi mau: Workbench STUDIO, mau = texture goc; che do VERTEX chi dung cho ban do trong so.
"""
import json
import math
import os

import bpy
from mathutils import Vector

# ten view -> (vi tri camera tuong doi tam, huong len) ; nhan vat nhin -Y trong Blender
VIEWS = {
    "front": (Vector((0, -3, 0)), "front: camera o truoc mat quai, trai quai (+X) o ben phai anh"),
    "side": (Vector((-3, 0, 0)), "side: nhin tu ben PHAI quai, quai nhin sang phai anh"),
    "back": (Vector((0, 3, 0)), "back: nhin tu sau lung, trai quai (+X) o ben trai anh"),
    "top": (Vector((0, 0, 3)), "top: nhin tu tren xuong, mat quai (-Y) o phia duoi anh"),
    "fl": (Vector((2.1, -2.1, 0)), "3/4 truoc-trai: camera o phia truoc, ben trai quai (+X)"),
    "fr": (Vector((-2.1, -2.1, 0)), "3/4 truoc-phai: camera o phia truoc, ben phai quai (-X)"),
}


def setup_scene(res=1400, bg=(0.30, 0.30, 0.32)):
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_WORKBENCH"
    sc.render.resolution_x = sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = "PNG"
    sc.render.film_transparent = False
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
    if sc.world is None:
        sc.world = bpy.data.worlds.new("QA_world")
    sc.world.color = bg
    sh = sc.display.shading
    sh.light = "STUDIO"
    sh.color_type = "TEXTURE"
    sh.show_shadows = False
    sh.show_cavity = False
    sh.show_object_outline = False
    sh.show_specular_highlight = True
    sc.display.shading.single_color = (0.8, 0.8, 0.8)
    return sc


EULER = {"front": (math.pi / 2, 0, 0), "side": (math.pi / 2, 0, -math.pi / 2),
         "back": (math.pi / 2, 0, math.pi), "top": (0, 0, 0),
         "fl": (math.pi / 2, 0, math.pi / 4), "fr": (math.pi / 2, 0, -math.pi / 4)}


def make_camera(sc):
    cam_data = bpy.data.cameras.new("QA_cam")
    cam_data.type = "ORTHO"
    cam_data.clip_start = 0.01
    cam_data.clip_end = 20
    cam = bpy.data.objects.new("QA_cam", cam_data)
    sc.collection.objects.link(cam)
    sc.camera = cam
    return cam


def point_camera(cam, view, center, ortho_scale):
    off, _ = VIEWS[view]
    cam.location = Vector(center) + off
    cam.rotation_euler = EULER[view]
    cam.data.ortho_scale = ortho_scale
    bpy.context.view_layer.update()
    return {"view": view, "center": list(center), "ortho_scale": ortho_scale}


def projection(cam, res):
    """Tra ve ma tran 3x4 world->pixel (goc tren-trai, y xuong) cho camera truc giao."""
    sc = bpy.context.scene
    mw_inv = cam.matrix_world.inverted()
    s = cam.data.ortho_scale
    rows = []
    for axis in (Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1))):
        rows.append(axis)
    # pixel = (res/2) + (res/s) * cam_local.xy ; y anh = res/2 - (res/s)*cam_local.y
    m = mw_inv.to_3x3()
    t = mw_inv.translation
    px = [res / s * m[0][k] for k in range(3)] + [res / 2 + res / s * t[0]]
    py = [-res / s * m[1][k] for k in range(3)] + [res / 2 - res / s * t[1]]
    return {"px": px, "py": py, "res": res}


def render_view(cam, view, center, ortho_scale, path):
    res = bpy.context.scene.render.resolution_x
    point_camera(cam, view, center, ortho_scale)
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    proj = projection(cam, res)
    proj.update(view=view, center=list(center), ortho_scale=ortho_scale, file=os.path.basename(path))
    return proj


def dump_proj(projs, path):
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(projs, f, indent=1)
