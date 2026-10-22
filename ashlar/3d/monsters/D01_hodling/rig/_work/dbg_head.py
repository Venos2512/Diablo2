import os,sys,numpy as np,bpy
sys.path.insert(0,'tools')
import d01_common as C, d01_poses as P, d01_render as R, d01_rigkit as K
tag=C.script_args()[0]
bpy.ops.wm.open_mainfile(filepath=C.BLEND)
sc=R.setup_scene(700); cam=R.make_camera(sc)
out=os.path.join(C.RIG,'_work','dbg'); 
views=("front","fl","side","fr","back")
for nm in ("rest","head_turn","head_down","head_up"):
    P.apply(nm)
    for v in views:
        R.render_view(cam,v,(0,-0.0,0.39),0.26,os.path.join(out,f"{tag}_{nm}_{v}.png"))
