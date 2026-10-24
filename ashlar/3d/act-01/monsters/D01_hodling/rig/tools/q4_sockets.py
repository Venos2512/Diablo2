"""R5: kiem socket vu khi di theo ban tay dung truc. Gan thanh QA tam (hinh tru + mui nhon, CHI TRONG BO NHO, khong luu) vao R_weapon_attach / L_weapon_attach,
render cac tu the tay. Truc Y local cua socket = truc doc theo can (ra truoc khi T-pose).
Chay: blender -b --factory-startup -P q4_sockets.py -- <tag>   -> rig/qa/_raw/<tag>/sock_<pose>_<view>.png + info_sockets.json"""
import json, math, os, sys
import bpy, numpy as np
from mathutils import Matrix, Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import d01_common as C, d01_poses as P, d01_render as R, d01_rigkit as K
TAG = C.script_args()[0]
RAW = os.path.join(C.QA, "_raw", TAG); os.makedirs(RAW, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=C.BLEND)
ct, rt, me = K.control(), K.runtime(), K.get_mesh()
K.reset_pose(ct)
rt.hide_set(False)
def mat(name, col):
    m = bpy.data.materials.new(name); m.use_nodes = True
    m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*col, 1)
    m.diffuse_color = (*col, 1)
    return m
def make_rod(sock, col):
    pb = rt.pose.bones[sock]
    world = rt.matrix_world @ pb.matrix
    objs = []
    bpy.ops.mesh.primitive_cylinder_add(radius=0.005, depth=0.30, vertices=16)
    rod = bpy.context.active_object
    rod.data.transform(Matrix.Rotation(math.radians(-90), 4, "X"))  # truc cylinder Z -> Y local
    rod.data.transform(Matrix.Translation((0, 0.09, 0)))
    bpy.ops.mesh.primitive_cone_add(radius1=0.012, radius2=0.0, depth=0.035, vertices=16)
    tip = bpy.context.active_object
    tip.data.transform(Matrix.Rotation(math.radians(-90), 4, "X"))
    tip.data.transform(Matrix.Translation((0, 0.255, 0)))
    for ob in (rod, tip):
        ob.data.materials.append(mat("qa_" + sock, col))
        ob.matrix_world = world
        ob.parent = rt; ob.parent_type = "BONE"; ob.parent_bone = sock
        ob.matrix_parent_inverse = (rt.matrix_world @ pb.matrix).inverted()
        ob.name = "QA_standin_" + sock + ("_tip" if ob is tip else "")
    return [rod, tip]
make_rod("R_weapon_attach", (0.15, 0.75, 1.0))
make_rod("L_weapon_attach", (1.0, 0.8, 0.1))
sc = R.setup_scene(1000); cam = R.make_camera(sc)
sc.display.shading.color_type = "TEXTURE"; sc.display.shading.light = "STUDIO"
INFO = {"views": {}, "poses": {}}
POSES = ["rest", "arms_forward_fk", "hands_raised", "hands_crossed", "arms_down_fk", "twist_p45"]
for nm in POSES:
    P.apply(nm)
    pos = K.eval_mesh_positions()
    ext_pts = [pos.min(0), pos.max(0)]
    for s_ in ("R_weapon_attach", "L_weapon_attach"):  # khung hinh phai chua ca thanh QA (-0,06..+0,27 m doc truc Y socket)
        pb_ = rt.pose.bones[s_]; yv = pb_.matrix.to_3x3() @ Vector((0, 1, 0))
        ext_pts += [np.array(pb_.head - yv * 0.06), np.array(pb_.head + yv * 0.275)]
    ext_pts = np.array(ext_pts)
    c = (ext_pts.min(0) + ext_pts.max(0)) / 2; e = float((ext_pts.max(0) - ext_pts.min(0)).max() * 1.15) + 0.03
    sk = {s: {"head": list(K.world_pose_head_tail(rt, s)[0]), "tail": list(K.world_pose_head_tail(rt, s)[1])} for s in ("R_weapon_attach", "L_weapon_attach")}
    INFO["poses"][nm] = {"bbox_min": list(ext_pts.min(0)), "bbox_max": list(ext_pts.max(0)), "sockets": sk,
                         "y_axis_world": {s: [round(float(v), 4) for v in (rt.pose.bones[s].matrix.to_3x3() @ Vector((0, 1, 0)))] for s in sk}}
    for v in ("front", "side", "back"):
        INFO["views"][f"sock_{nm}_{v}"] = R.render_view(cam, v, tuple(c), e, os.path.join(RAW, f"sock_{nm}_{v}.png"))
json.dump(INFO, open(os.path.join(RAW, "info_sockets.json"), "w"), indent=1)
print("sockets done")
