"""C1: xuat GLB runtime tam thoi (CHI de kiem A1; KHONG phai <asset>_rig.glb release) tu D01_hodling_rig.blend.
Chay: blender -b --factory-startup -P c1_export_runtime.py [-- <out.glb>]
Chi mesh + skeleton runtime; khong rig dieu khien, khong animation. Khong can va byte anh: exporter giu nguyen byte anh nhung (A1.10 so sha256 theo vai tro).
Luu y: exporter bo extension KHR_materials_volume (va specularFactor mac dinh) cua GLB goc => ban tam nay KHAC GLB goc o material; quyet dinh giu/chuyen sang khi lam ban release (R7).
"""
import os, sys
import bpy
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import d01_common as C, d01_rigkit as K
a=C.script_args()
out=a[0] if a else os.path.join(C.CHECKS,"D01_hodling_runtime_check.glb")
os.makedirs(os.path.dirname(out),exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=C.BLEND)
K.reset_pose(K.control()); K.reset_pose(K.runtime())
rt=K.runtime(); me=K.get_mesh(); ct=K.control()
rt.hide_set(False)
bpy.ops.object.select_all(action="DESELECT")
for o in (rt,me): o.select_set(True)
bpy.context.view_layer.objects.active=rt
import time
tmp_out = out + ".tmp.glb"
for attempt in range(8):  # Windows: quet virus/thumbnailer doi luc khoa file moi tao -> thu lai
    try:
        if os.path.exists(tmp_out):
            os.remove(tmp_out)
        break
    except OSError:
        time.sleep(1.0)
bpy.ops.export_scene.gltf(filepath=tmp_out, export_format="GLB", use_selection=True, export_yup=True, export_animations=False,
    export_skins=True, export_all_influences=False, export_def_bones=False, export_rest_position_armature=True,
    export_image_format="AUTO", export_apply=False, export_cameras=False, export_lights=False, export_extras=False)
for attempt in range(15):
    try:
        os.replace(tmp_out, out)
        break
    except OSError:
        time.sleep(1.0)
else:
    raise RuntimeError("khong ghi duoc " + out)
print("exported",out,os.path.getsize(out))
