"""A1 (kham pha): render anh that cua mesh da scale (khong rig) de tim landmark. Ra rig/_work/raw_*.png + raw_proj.json"""
import os, sys
import bpy
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import d01_common as C, d01_render as R
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=C.GLB)
ob=[o for o in bpy.data.objects if o.type=="MESH"][0]
f=C.TARGET_HEIGHT_M/max(v.co.z for v in ob.data.vertices)
for v in ob.data.vertices: v.co*=f
sc=R.setup_scene(1600); cam=R.make_camera(sc)
projs=[]
for view in ("front","side","back"):
    projs.append(R.render_view(cam,view,(0,0,0.25),0.75,os.path.join(C.WORK,f"raw_{view}.png")))
R.dump_proj(projs,os.path.join(C.WORK,"raw_proj.json"))
