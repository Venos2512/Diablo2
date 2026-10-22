import os,sys,numpy as np,bpy
sys.path.insert(0,'tools')
import d01_common as C, d01_poses as P, d01_render as R, d01_rigkit as K
a=C.script_args(); tag,blend=a[0],a[1]; poses=a[2].split(','); cen=tuple(float(x) for x in a[3].split(',')); sca=float(a[4]); views=a[5].split(',')
bpy.ops.wm.open_mainfile(filepath=blend)
sc=R.setup_scene(700); cam=R.make_camera(sc)
out=os.path.join(C.RIG,'_work','dbg')
for nm in poses:
    P.apply(nm)
    for v in views:
        R.render_view(cam,v,cen,sca,os.path.join(out,f"{tag}_{nm}_{v}.png"))
