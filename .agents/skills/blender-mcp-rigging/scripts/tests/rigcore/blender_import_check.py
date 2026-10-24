"""Blender compatibility check of rigcore (owner R0). Run headless:

    E:\\SteamLibrary\\steamapps\\common\\Blender\\blender.exe -b --factory-startup --python scripts/tests/rigcore/blender_import_check.py

Imports every rigcore module inside Blender's own Python + numpy (no scipy / trimesh / pytest there), runs a tiny weld_map, an npz
round trip, resolves the real S.json on D01 landmarks (reading only), and checks the roll convention against Blender's
``EditBone.align_roll``. Prints ONE JSON line (the last line starting with "{") and exits non-zero on any failure.
Scratch files go under E:\\tmp_rigkit\\R0\\blender_check (system temp if E: is missing).
"""
import json
import os
import sys
import tempfile
import time
import traceback

T0 = time.time()
try:
    HERE = os.path.dirname(os.path.abspath(__file__))
except NameError:  # pragma: no cover - Blender normally defines __file__ for --python scripts
    HERE = os.path.dirname(os.path.abspath(sys.argv[sys.argv.index("--python") + 1]))
SCRIPTS = os.path.abspath(os.path.join(HERE, "..", ".."))
SKILL = os.path.dirname(SCRIPTS)
REPO = os.path.abspath(os.path.join(SKILL, "..", "..", ".."))
D01_LANDMARKS = os.path.join(REPO, "ashlar", "3d", "act-01", "monsters", "D01_hodling", "rig", "tools", "landmarks.json")
sys.dont_write_bytecode = True
if SCRIPTS not in sys.path:
    sys.path.insert(0, SCRIPTS)

MODULES = ("schema", "npzio", "mesh", "geom", "landmarks", "template", "recipe")


def check():
    import importlib

    import bpy  # noqa: F401  (fails outside Blender, which is the point)
    import mathutils
    import numpy as np

    info = {"blender": bpy.app.version_string, "python": sys.version.split()[0], "numpy": np.__version__}
    import rigcore

    info["rigcore"] = rigcore.__version__
    for m in MODULES:
        importlib.import_module(f"rigcore.{m}")
    forbidden = [n for n in ("scipy", "trimesh", "pytest", "igl") if n in sys.modules]
    assert not forbidden, f"rigcore pulled in {forbidden}"
    info["modules"] = list(MODULES)

    from rigcore import geom, landmarks, mesh, npzio, recipe, template

    # --- weld_map / topology on a cube with duplicated corner vertices (as a Blender export would give per loop split)
    corners = np.array([[x, y, z] for x in (0, 1) for y in (0, 1) for z in (0, 1)], dtype=np.float64)
    quads = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
    V, F = [], []
    for q in quads:  # every face gets its own 4 vertices
        base = len(V)
        V.extend(corners[list(q)])
        F.extend([(base, base + 1, base + 2), (base, base + 2, base + 3)])
    V, F = np.array(V), np.array(F)
    w = mesh.weld_map(V)
    assert V.shape == (24, 3) and int(w.max()) + 1 == 8 and w.dtype == np.int32
    n_isl, _ = mesh.islands(F, w)
    E, cnt = mesh.unique_edges(mesh.welded_faces(F, w), return_counts=True)
    assert n_isl == 1 and len(E) == 18 and set(cnt.tolist()) == {2}
    assert len(mesh.seam_groups(w)) == 8
    info["weld"] = {"vertices": int(len(V)), "welded": int(w.max()) + 1, "edges": int(len(E))}

    # --- npz round trip
    out = r"E:\tmp_rigkit\R0\blender_check"
    try:
        os.makedirs(out, exist_ok=True)
    except OSError:
        out = os.path.join(tempfile.gettempdir(), "rigcore_blender_check")
        os.makedirs(out, exist_ok=True)
    meta = npzio.mesh_meta("cube", 1.0)
    p = npzio.save_mesh(os.path.join(out, "mesh.npz"), V, F, meta=meta)
    d = npzio.load_mesh(p)
    assert np.array_equal(d["weld"], w) and d["meta"]["asset_id"] == "cube"
    Wt = np.zeros((24, 2))
    Wt[:, 0] = 1.0
    npzio.save_weights(os.path.join(out, "weights.npz"), ["a", "b"], Wt, meta={"candidate": "t"}, check_sums=True)
    assert npzio.load_weights(os.path.join(out, "weights.npz"), check_sums=True)["W"].dtype == np.float32
    npzio.save_poses(os.path.join(out, "poses.npz"), ["rest"], np.zeros((1, 24, 3)), ["a"], np.zeros((1, 1, 3)), np.ones((1, 1, 3)))
    assert npzio.load_poses(os.path.join(out, "poses.npz"))["P"].shape == (1, 24, 3)
    info["npz"] = out

    # --- template: real S.json on D01 landmarks (+ TEST ONLY clavicles)
    fam = template.load_family("S")
    assert os.path.isfile(D01_LANDMARKS), f"D01 landmarks not found at {D01_LANDMARKS}"
    lm = landmarks.from_d01_landmarks(D01_LANDMARKS)
    lm = landmarks.synthesize_missing(lm, fam, H=0.5)
    skel = template.resolve(fam, lm, 0.5)
    assert len(skel["bones"]) == 36 and sum(1 for b in skel["bones"] if b["kind"] == "socket") == 8
    sk_path = template.save_skeleton(os.path.join(out, "skeleton.json"), skel)
    assert template.load_skeleton(sk_path) == skel
    info["bones"] = len(skel["bones"])

    # --- recipe + git stamp (git may be missing in the Blender environment: nulls are fine)
    rec = recipe.new_recipe("cube", family="S", template=template.template_info(fam), H=1.0)
    recipe.log_step(rec, "check", {"x": 1}, {"y": 2})
    recipe.save_recipe(os.path.join(out, "rig_recipe.json"), rec)
    info["git_head"] = rec["scripts"]["git_head"]

    # --- the roll convention against Blender: local X of the edit bone must equal the hinge made perpendicular to the bone
    arm = bpy.data.armatures.new("rigcore_check")
    obj = bpy.data.objects.new("rigcore_check", arm)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="EDIT")
    worst = 0.0
    sample = [b for b in skel["bones"] if b["name"] in ("L_UpperArm", "R_UpperArm", "L_Thigh", "R_Hand", "L_Foot", "spine_01", "L_Clavicle")]
    assert len(sample) == 7
    for b in sample:
        eb = arm.edit_bones.new(b["name"])
        eb.head = mathutils.Vector(b["head"])
        eb.tail = mathutils.Vector(b["tail"])
        eb.align_roll(mathutils.Vector(geom.roll_z_vector(b["head"], b["tail"], b["hinge"])))
        x_axis = eb.matrix.to_3x3().col[0]
        d_ = geom.unit(geom.sub(b["tail"], b["head"]))
        want = geom.unit(geom.project_perp(b["hinge"], d_))
        err = geom.dist(tuple(x_axis), want)
        worst = max(worst, err)
    bpy.ops.object.mode_set(mode="OBJECT")
    assert worst < 1e-5, f"align_roll(roll_z_vector) leaves local X {worst:.3g} away from the hinge"
    info["roll_max_err"] = worst
    info["elapsed_s"] = round(time.time() - T0, 2)
    return info


def main():
    try:
        info = check()
        info["ok"] = True
        print(json.dumps(info, sort_keys=True))
        sys.stdout.flush()
    except BaseException as e:  # noqa: BLE001 - report everything, then fail
        print(json.dumps({"ok": False, "error": f"{type(e).__name__}: {e}", "traceback": traceback.format_exc()}))
        sys.stdout.flush()
        os._exit(1)  # Blender may swallow sys.exit() inside --python; this is unconditional


main()
