"""R5 (v4): anh DOI CHIEU vai tui khi chi quay dau/co: ban v3 (snapshot, con loi ro ri trong so head->vai tui) va ban hien hanh. Cung camera.
Raw -> rig/qa/_raw/<tag>/cmp_<v3|cur>_<pose>_<view>.png (q2_compose.py ghep A2_compare_sack_head_<tag>.jpg).
Chay: blender -b --factory-startup -P q5_sack_compare.py -- <tag>"""
import json, os, sys
import bpy
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import d01_common as C, d01_poses as P, d01_render as R, d01_rigkit as K
TAG = C.script_args()[0]
RAW = os.path.join(C.QA, "_raw", TAG); os.makedirs(RAW, exist_ok=True)
assert os.path.exists(C.SNAPSHOT_V3), "thieu snapshot v3"
POSES = ["rest", "head_down", "head_up", "head_turn"]
VIEWS = ["back", "fr", "side"]
INFO = {"poses": POSES, "views": VIEWS, "which": {"v3": os.path.relpath(C.SNAPSHOT_V3, C.RIG), "cur": os.path.relpath(C.BLEND, C.RIG)}, "blend_sha256": {}}
for which, path in (("v3", C.SNAPSHOT_V3), ("cur", C.BLEND)):
    bpy.ops.wm.open_mainfile(filepath=path)
    INFO["blend_sha256"][which] = C.sha256_file(path)
    sc = R.setup_scene(700); cam = R.make_camera(sc)
    for nm in POSES:
        P.apply(nm)
        for v in VIEWS:
            R.render_view(cam, v, (-0.02, 0.03, 0.385), 0.22, os.path.join(RAW, f"cmp_{which}_{nm}_{v}.png"))
    K.reset_pose(K.control())
json.dump(INFO, open(os.path.join(RAW, "info_cmp.json"), "w"), indent=1)
print("cmp done", RAW)
