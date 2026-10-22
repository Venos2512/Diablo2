import os, sys, math
import bpy, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import d01_common as C, d01_rigkit as K
bpy.ops.wm.open_mainfile(filepath=C.BLEND)
ct=K.control(); rt=K.runtime(); me=K.get_mesh()
K.reset_pose(ct)
rest=K.eval_mesh_positions()
print("rest dev from stored", np.abs(rest-K.rest_positions()).max())
def test(name, fn):
    K.reset_pose(ct); fn(); bpy.context.view_layer.update()
    p=K.eval_mesh_positions()
    d=np.linalg.norm(p-rest,axis=1)
    print(f"{name:28s} nan={np.isnan(p).any()} max_move={d.max():.4f} moved>1mm={int((d>0.001).sum())}")
    return p
def loc(n,v): ct.pose.bones[n].location=v
def rot(n,e): 
    pb=ct.pose.bones[n]; pb.rotation_mode="XYZ"; pb.rotation_euler=[math.radians(a) for a in e]
test("L foot IK up 3cm", lambda: loc("ctl_L_Foot_IK",(0,0,0.03)))
test("L foot IK forward 8cm", lambda: loc("ctl_L_Foot_IK",(0,-0.08,0.02)))
test("L hand IK up 10cm", lambda: loc("ctl_L_Hand_IK",(0,0,0.1)))
test("cog down 4cm", lambda: loc("ctl_cog",(0,0,-0.04)))
