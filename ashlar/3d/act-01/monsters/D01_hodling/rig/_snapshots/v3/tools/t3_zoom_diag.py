"""Chan doan zoom: python blender -b -P t3_zoom_diag.py -- <pose> <cx> <cy> <cz> <scale> [tag]"""
import os, sys
import bpy
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import d01_common as C, d01_rigkit as K, d01_render as R, d01_poses as P
a=C.script_args(); pose=a[0]; ctr=tuple(map(float,a[1:4])); sc_=float(a[4]); tag=a[5] if len(a)>5 else "zd"
bpy.ops.wm.open_mainfile(filepath=C.BLEND)
sc=R.setup_scene(900); cam=R.make_camera(sc)
P.apply(pose)
for v in ("front","side","back"):
    R.render_view(cam,v,ctr,sc_,os.path.join(C.WORK,f"{tag}_{pose}_{v}.png"))
