"""B1: dung toan bo rig D01 tu GLB goc (R2 skeleton + R3 skin + rig dieu khien) va luu rig/D01_hodling_rig.blend.

Chay:  blender -b --factory-startup -P b1_build_rig.py
Lap lai duoc: moi lan chay dung lai tu GLB goc. Khong sua GLB goc (kiem sha256 truoc).
Cac buoc: import -> scale deu (dinh cao nhat = 0,5 m) -> armature runtime (35 bone) -> trong so -> armature dieu khien (ctl_, IK) ->
runtime bam theo dieu khien (Copy Transforms) -> thiet lap viewport co texture -> luu.
"""
import math
import os
import shutil
import sys

import bpy
import numpy as np
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import d01_common as C
import d01_rig_def as D
import d01_rigkit as K
import d01_skin as S

assert C.sha256_file(C.GLB) == C.GLB_SHA256, "GLB goc da bi doi"

# ------------------------------------------------------------------ 1. import + scale
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
bpy.ops.import_scene.gltf(filepath=C.GLB)
mesh_ob = [o for o in bpy.data.objects if o.type == "MESH"][0]
for o in [o for o in bpy.data.objects if o.type == "EMPTY"]:
    for ch in o.children:
        mw = ch.matrix_world.copy()
        ch.parent = None
        ch.matrix_world = mw
    bpy.data.objects.remove(o)
assert np.allclose(np.array(mesh_ob.matrix_world), np.eye(4)), "mesh goc co transform khac don vi"
me = mesh_ob.data
n = len(me.vertices)
co = np.empty(n * 3)
me.vertices.foreach_get("co", co)
co = co.reshape(n, 3)
FACTOR = C.TARGET_HEIGHT_M / co[:, 2].max()
co *= FACTOR
me.vertices.foreach_set("co", co.ravel())
me.update()
mesh_ob.name = C.MESH_NAME
me.name = C.MESH_NAME + "_mesh"
mesh_ob.location = (0, 0, 0)
mesh_ob.rotation_euler = (0, 0, 0)
mesh_ob.scale = (1, 1, 1)
for img in bpy.data.images:
    if img.source == "FILE" and not img.packed_file:
        img.pack()
print("scale factor", FACTOR)

# ------------------------------------------------------------------ 2. collection + armature runtime
col = bpy.data.collections.new("D01_Rig")
sc.collection.children.link(col)
for c in list(mesh_ob.users_collection):
    c.objects.unlink(mesh_ob)
col.objects.link(mesh_ob)

B = D.build()
BN = D.by_name(B)
rt_data = bpy.data.armatures.new(C.RUNTIME_ARM)
rt = bpy.data.objects.new(C.RUNTIME_ARM, rt_data)
col.objects.link(rt)
K.set_mode(rt, "EDIT")
for b in B:
    K.add_edit_bone(rt_data, b["name"], b["head"], b["tail"], hinge=b["hinge"], parent=b["parent"], deform=b["kind"] in ("core", "aux") and b["name"] not in ("root", "cog"))
K.set_mode(rt, "OBJECT")
rt_data.display_type = "OCTAHEDRAL"
rt.show_in_front = True

# bone collections (runtime)
coll_def = rt_data.collections.new("Deform")
coll_aux = rt_data.collections.new("Aux")
coll_sock = rt_data.collections.new("Sockets")
coll_root = rt_data.collections.new("Root")
for b in B:
    bone = rt_data.bones[b["name"]]
    tgt = {"core": coll_def, "aux": coll_aux, "socket": coll_sock}[b["kind"]]
    if b["name"] in ("root", "cog"):
        tgt = coll_root
    tgt.assign(bone)

# ------------------------------------------------------------------ 3. skin
uvl = me.uv_layers[0].data
uv_loop = np.empty(len(uvl) * 2)
uvl.foreach_get("uv", uv_loop)
vert_of_loop = np.empty(len(me.loops), dtype=np.int64)
me.loops.foreach_get("vertex_index", vert_of_loop)
uv = np.zeros((n, 2))
uv[vert_of_loop.astype(int)] = uv_loop.reshape(-1, 2)
colors = C.sample_basecolor(uv)
me.calc_loop_triangles()
tris = np.empty(len(me.loop_triangles) * 3, dtype=np.int64)
me.loop_triangles.foreach_get("vertices", tris)
tris = tris.reshape(-1, 3)
res = S.compute(co, colors, tris)
Wn = res["W"][res["inv"]]  # trong so theo dinh goc, dinh trung vi tri dung chung (khong nut o duong noi UV)
names = res["names"]
for nm in names:
    mesh_ob.vertex_groups.new(name=nm)
vg = [mesh_ob.vertex_groups[nm] for nm in names]
for vi in range(n):
    row = Wn[vi]
    for bi in np.nonzero(row)[0]:
        vg[bi].add([vi], float(row[bi]), "REPLACE")
mod = mesh_ob.modifiers.new("Armature", "ARMATURE")
mod.object = rt
mod.use_vertex_groups = True
mesh_ob.parent = rt
mesh_ob.parent_type = "OBJECT"

# ------------------------------------------------------------------ 4. rig dieu khien
ct_data = bpy.data.armatures.new(C.CONTROL_ARM)
ct = bpy.data.objects.new(C.CONTROL_ARM, ct_data)
col.objects.link(ct)
CB = D.control_bones(B)
K.set_mode(ct, "EDIT")
for b in CB:
    K.add_edit_bone(ct_data, b["name"], b["head"], b["tail"], hinge=b["hinge"], zvec=b["zvec"], parent=b["parent"], deform=False)
K.set_mode(ct, "OBJECT")
ct_data.display_type = "OCTAHEDRAL"
ct.show_in_front = True

# runtime theo dieu khien: Copy Transforms the gioi -> the gioi
for pb in rt.pose.bones:
    ctl = "ctl_" + pb.name
    if ctl in ct.pose.bones:
        c = pb.constraints.new("COPY_TRANSFORMS")
        c.name = "FollowControl"
        c.target = ct
        c.subtarget = ctl
        c.target_space = "WORLD"
        c.owner_space = "WORLD"
        c.mix_mode = "REPLACE"

# thuoc tinh bat/tat IK tren doi tuong dieu khien
for side in K.SIDES:
    for kind in ("leg", "arm"):
        key = f"ik_{kind}_{side}"
        ct[key] = 1.0
        ct.id_properties_ui(key).update(min=0.0, max=1.0, soft_min=0.0, soft_max=1.0, description=f"1 = IK {kind} {side}, 0 = FK")


def drive(constraint, prop):
    fc = constraint.driver_add("influence")
    dr = fc.driver
    dr.type = "AVERAGE"
    v = dr.variables.new()
    v.name = "ik"
    v.type = "SINGLE_PROP"
    v.targets[0].id = ct
    v.targets[0].data_path = f'["{prop}"]'


def lock_hinge(pb, lo=0.0, hi=math.radians(150)):
    pb.lock_ik_y = True
    pb.lock_ik_z = True
    pb.use_ik_limit_x = True
    pb.ik_min_x = lo
    pb.ik_max_x = hi


for side in K.SIDES:
    # chan: IK goi/dui toi Ankle_target, pole goi; foot/toe copy xoay tu control tiep xuc
    calf = ct.pose.bones[f"ctl_{side}_Calf"]
    ik = calf.constraints.new("IK")
    ik.name = "LegIK"
    ik.target = ct
    ik.subtarget = f"ctl_{side}_Ankle_target"
    ik.pole_target = ct
    ik.pole_subtarget = f"ctl_{side}_Knee_pole"
    ik.chain_count = 2
    ik.use_tail = True
    ik.use_stretch = False
    lock_hinge(calf)
    drive(ik, f"ik_leg_{side}")
    for nm, tgt in ((f"ctl_{side}_Foot", f"ctl_{side}_Ankle_target"), (f"ctl_{side}_Toe", f"ctl_{side}_Toe_target")):
        cr = ct.pose.bones[nm].constraints.new("COPY_ROTATION")
        cr.name = "FromContact"
        cr.target = ct
        cr.subtarget = tgt
        cr.target_space = "WORLD"
        cr.owner_space = "WORLD"
        drive(cr, f"ik_leg_{side}")
    # tay: IK khuyu/co tay toi Hand_IK, pole khuyu; ban tay copy xoay tu Hand_IK
    fore = ct.pose.bones[f"ctl_{side}_ForeArm"]
    ik = fore.constraints.new("IK")
    ik.name = "ArmIK"
    ik.target = ct
    ik.subtarget = f"ctl_{side}_Hand_IK"
    ik.pole_target = ct
    ik.pole_subtarget = f"ctl_{side}_Elbow_pole"
    ik.chain_count = 2
    ik.use_tail = True
    ik.use_stretch = False
    lock_hinge(fore)
    drive(ik, f"ik_arm_{side}")
    cr = ct.pose.bones[f"ctl_{side}_Hand"].constraints.new("COPY_ROTATION")
    cr.name = "FromHandIK"
    cr.target = ct
    cr.subtarget = f"ctl_{side}_Hand_IK"
    cr.target_space = "WORLD"
    cr.owner_space = "WORLD"
    drive(cr, f"ik_arm_{side}")

# bone collections + mau (rig dieu khien)
cc = {nm: ct_data.collections.new(nm) for nm in ("Root/COG", "Spine/Head FK", "Arms FK", "Legs FK", "Aux FK", "IK controls", "Poles", "Foot roll")}
for b in CB:
    bone = ct_data.bones[b["name"]]
    nm = b["name"]
    side = "L" if "_L_" in nm else ("R" if "_R_" in nm else "C")
    if b["kind"] == "fk":
        rt_n = b["rt"]
        if rt_n in ("root", "cog"):
            cc["Root/COG"].assign(bone)
        elif rt_n in ("pelvis", "spine_01", "spine_02", "chest", "neck", "head"):
            cc["Spine/Head FK"].assign(bone)
        elif rt_n.endswith(("UpperArm", "ForeArm", "Hand")):
            cc["Arms FK"].assign(bone)
        elif rt_n.endswith(("Thigh", "Calf", "Foot", "Toe")):
            cc["Legs FK"].assign(bone)
        else:
            cc["Aux FK"].assign(bone)
    elif b["kind"] == "ik":
        cc["IK controls"].assign(bone)
    elif b["kind"] == "pole":
        cc["Poles"].assign(bone)
    else:
        cc["Foot roll"].assign(bone)
    bone.color.palette = {"L": "THEME04", "R": "THEME01", "C": "THEME03"}[side] if b["kind"] in ("fk", "aux") else ({"L": "THEME05", "R": "THEME02", "C": "THEME03"}[side])
# FK cua target/roll khong can xem thuong xuyen: an collection "Foot roll" khong, de animator dung duoc.

# ------------------------------------------------------------------ 5. tim pole_angle: rest -> khong xoay
bpy.context.view_layer.update()


def max_dev(names_):
    dev = 0.0
    for nm in names_:
        pb = ct.pose.bones[nm]
        r = ct.data.bones[nm].matrix_local
        dev = max(dev, pb.matrix.to_quaternion().rotation_difference(r.to_quaternion()).angle)
    return dev


best = {}
for side in K.SIDES:
    for chain, cname, tgt_names in (("leg", "LegIK", (f"ctl_{side}_Thigh", f"ctl_{side}_Calf")), ("arm", "ArmIK", (f"ctl_{side}_UpperArm", f"ctl_{side}_ForeArm"))):
        host = f"ctl_{side}_Calf" if chain == "leg" else f"ctl_{side}_ForeArm"
        con = ct.pose.bones[host].constraints[cname]
        scores = []
        for ang in (0, 90, 180, -90):
            con.pole_angle = math.radians(ang)
            bpy.context.view_layer.update()
            scores.append((max_dev(tgt_names), ang))
        scores.sort()
        coarse = scores[0][1]
        fine = []
        for k in range(-24, 25):
            ang = coarse + 0.25 * k
            con.pole_angle = math.radians(ang)
            bpy.context.view_layer.update()
            fine.append((max_dev(tgt_names), ang))
        fine.sort()
        con.pole_angle = math.radians(fine[0][1])
        bpy.context.view_layer.update()
        best[f"{side}_{chain}"] = {"coarse": scores, "fine_best": fine[0]}
        bpy.context.view_layer.update()
print("pole angle search (rad deviation, deg):", best)

# ------------------------------------------------------------------ 6. an toan: pose trung tinh
K.reset_pose(ct)
K.reset_pose(rt)

# ------------------------------------------------------------------ 7. canh, viewport, luu
sc.unit_settings.system = "METRIC"
sc.unit_settings.scale_length = 1.0
sc.render.fps = 24
sc.frame_start, sc.frame_end = 1, 24
sc.frame_current = 1
sc.tool_settings.use_keyframe_insert_auto = False
rt.hide_set(True)  # skeleton runtime chi de deform; dieu khien nam o rig dieu khien
for o in col.objects:
    o.select_set(False)
bpy.context.view_layer.objects.active = ct
ct.select_set(True)
for scr in bpy.data.screens:
    for area in scr.areas:
        if area.type == "VIEW_3D":
            sp = area.spaces[0]
            sp.shading.type = "SOLID"
            sp.shading.light = "STUDIO"
            sp.shading.color_type = "TEXTURE"
            sp.shading.show_shadows = False
            sp.shading.show_cavity = False
            sp.overlay.show_bones = True
            sp.overlay.show_outline_selected = True
            sp.clip_end = 100.0
            sp.clip_start = 0.001
            sp.region_3d.view_perspective = "PERSP"
            sp.region_3d.view_location = (0, 0, 0.25)
            sp.region_3d.view_distance = 1.4
            sp.region_3d.view_rotation = (0.8, 0.55, 0.2, 0.0) if False else sp.region_3d.view_rotation
bpy.context.scene["d01_scale_factor"] = FACTOR
bpy.context.scene["d01_source_sha256"] = C.GLB_SHA256
bpy.context.scene["d01_rig_status"] = "R2-R3 build, cho G2; khong co Action production"

if os.path.exists(C.BLEND):
    try:  # ban sao ban truoc de doi chieu (khong quan trong; bo qua neu file dang bi khoa)
        os.makedirs(os.path.join(C.WORK, "prev"), exist_ok=True)
        shutil.copy2(C.BLEND, os.path.join(C.WORK, "prev", "D01_hodling_rig_prev.blend"))
    except OSError as e:
        print("WARN khong chep duoc ban truoc:", e)
bpy.context.preferences.filepaths.save_version = 0  # khong tao .blend1 (tranh loi sao luu khi file bi khoa tam thoi)
import time
for _try in range(10):
    try:
        bpy.ops.wm.save_as_mainfile(filepath=C.BLEND, compress=True)
        break
    except RuntimeError as e:
        print("save retry", _try, e)
        time.sleep(1.5)
else:
    raise RuntimeError("khong luu duoc " + C.BLEND)
print("saved", C.BLEND)
