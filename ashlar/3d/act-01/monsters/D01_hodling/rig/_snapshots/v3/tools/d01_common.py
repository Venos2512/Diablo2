"""Hang so va ham dung chung cho cac script rig D01_hodling (chay duoc trong Blender va python thuong).

Quy uoc toa do:
  glTF  : Y len, mat nhin +Z, trai quai = +X.
  Blender: Z len, mat nhin -Y, trai quai = +X (importer doi glTF (x,y,z) -> Blender (x,-z,y)).
Moi toa do trong script rig la toa do Blender, met, sau scale.
"""
import hashlib
import os

TOOLS = os.path.dirname(os.path.abspath(__file__))
RIG = os.path.dirname(TOOLS)
ASSET = os.path.dirname(RIG)
GLB = os.path.join(ASSET, "D01_hodling.glb")
GLB_SHA256 = "bf22ccea25b72a879048fe3d0bf4ecf92b551984b85081ae97e3bea56f3d8c5a"
BLEND = os.path.join(RIG, "D01_hodling_rig.blend")
QA = os.path.join(RIG, "qa")
CHECKS = os.path.join(RIG, "checks")
WORK = os.path.join(RIG, "_work")
LANDMARKS = os.path.join(TOOLS, "landmarks.json")

TARGET_HEIGHT_M = 0.5  # dinh cao nhat cua toan bo mesh (bounds Y glTF = Z Blender)

MESH_NAME = "D01_hodling"
RUNTIME_ARM = "D01_runtime"
CONTROL_ARM = "D01_control"

BLENDER_EXE = r"E:\SteamLibrary\steamapps\common\Blender\blender.exe"


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def script_args():
    import sys
    return sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []


def sample_basecolor(mesh_uv, max_side=1024):
    """Lay mau base color tai UV tung dinh (Blender). Anh goc khong bi sua: scale tren ban sao."""
    import bpy
    import numpy as np
    src = [i for i in bpy.data.images if "basecolor" in i.name.lower()][0]
    cp = src.copy()
    cp.scale(max_side, max_side)
    px = np.empty(max_side * max_side * 4, dtype=np.float32)
    cp.pixels.foreach_get(px)
    px = px.reshape(max_side, max_side, 4)[:, :, :3]
    u = np.clip((mesh_uv[:, 0] * (max_side - 1)).round().astype(int), 0, max_side - 1)
    v = np.clip((mesh_uv[:, 1] * (max_side - 1)).round().astype(int), 0, max_side - 1)
    col = px[v, u]  # Blender: hang 0 = duoi (v=0)
    bpy.data.images.remove(cp)
    return col.astype(np.float64)
