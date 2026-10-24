"""Chan doan: render cac tu the cuc tri tu .blend (Workbench, texture) ra _work/pd_<pose>_<view>.png. blender -b --factory-startup -P t2_pose_diag.py -- [pose ...]"""
import os, sys
import bpy
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import d01_common as C, d01_rigkit as K, d01_render as R, d01_poses as P
bpy.ops.wm.open_mainfile(filepath=C.BLEND)
sc=R.setup_scene(900); cam=R.make_camera(sc)
sel=C.script_args() or list(P.POSES)
tag=os.environ.get("D01_TAG","pd")
for nm in sel:
    P.apply(nm)
    for v in ("front","side","back"):
        R.render_view(cam,v,(0,0,0.25),0.68,os.path.join(C.WORK,f"{tag}_{nm}_{v}.png"))
    print("pose",nm)
