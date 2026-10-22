"""R5: tao file QA rieng (rig/qa/D01_hodling_qa_poses.blend) chua cac tu the thu cuc tri duoi dang Action tinh danh dau QA/experiment.
KHONG phai animation production; file nguon D01_hodling_rig.blend khong bi dung toi (mo trung tinh, khong Action).
Sau khi luu: mo lai, gan tung Action, so sanh dinh voi tu the truc tiep.
Chay: blender -b --factory-startup -P q3_qa_pose_actions.py
"""
import json, os, sys
import bpy, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import d01_common as C, d01_rigkit as K, d01_poses as P
OUT = os.path.join(C.QA, "D01_hodling_qa_poses.blend")
bpy.ops.wm.open_mainfile(filepath=C.BLEND)
ct = K.control()
ct.animation_data_create()
direct = {}
for nm in P.POSES:
    P.apply(nm)
    direct[nm] = K.eval_mesh_positions().copy()
    act = bpy.data.actions.new(f"QA_pose_{nm}")
    act["status"] = "experiment"
    act["purpose"] = "QA static pose (rig deformation check) - NOT a production clip"
    act["source"] = "tools/d01_poses.py"
    ct.animation_data.action = act
    for pb in ct.pose.bones:
        pb.keyframe_insert("location", frame=1)
        pb.keyframe_insert("rotation_quaternion", frame=1)
    for k in [k for k in ct.keys() if k.startswith("ik_")]:
        ct.keyframe_insert(f'["{k}"]', frame=1)
    act.use_fake_user = True
    act.use_frame_range = True
    act.frame_start = 1
    act.frame_end = 1
    ct.animation_data.action = None
P.apply("rest")
ct.animation_data.action = None
bpy.context.scene["d01_qa_note"] = "QA-only poses. Production clips are made only after G2. Source rig: ../D01_hodling_rig.blend"
bpy.context.preferences.filepaths.save_version = 0
import time
for _try in range(10):
    try:
        bpy.ops.wm.save_as_mainfile(filepath=OUT, compress=True)
        break
    except RuntimeError as e:
        print("save retry", _try, e)
        time.sleep(1.5)
# mo lai + gan tung action
bpy.ops.wm.open_mainfile(filepath=OUT)
ct = K.control()
res = {}
for nm in P.POSES:
    act = bpy.data.actions[f"QA_pose_{nm}"]
    ct.animation_data.action = act
    slot = None
    try:
        if act.slots:
            ct.animation_data.action_slot = act.slots[0]
            slot = act.slots[0].identifier
    except Exception as e:
        slot = f"slot error: {e}"
    bpy.context.scene.frame_set(1)
    bpy.context.view_layer.update()
    p = K.eval_mesh_positions()
    res[nm] = {"max_diff_vs_direct_pose_m": float(np.abs(p - direct[nm]).max()), "slot": slot, "fcurves": len(list(act.layers[0].strips[0].channelbags[0].fcurves)) if act.layers else None, "status": act["status"], "frame_range": [act.frame_start, act.frame_end]}
ct.animation_data.action = None
K.reset_pose(ct)
res["_all_ok"] = all(v["max_diff_vs_direct_pose_m"] < 1e-5 for k, v in res.items() if not k.startswith("_"))
json.dump(res, open(os.path.join(C.CHECKS, "qa_pose_actions.json"), "w"), indent=1)
print("qa actions", len(P.POSES), "ok", res["_all_ok"], "->", OUT)
