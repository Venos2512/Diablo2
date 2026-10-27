r"""A1 unit checks (Blender) on synthetic data: intake.normalize on a moved/rotated/scaled mesh, meshio mesh.npz round trip, bend-test
roll flip + ambiguous case and the post-flip skeleton (``skeleton.apply_flips``: rebuilding from it needs no flip, same rolls),
control.add_skirt_chain, the pole sweep's golden-section refinement on a chain whose optimum is off the 0.5 deg grid, the twist
driver (``control.add_twist_driver``: pure and combined poses, survives ``bl.reset_pose``), state snapshot / diff / override files,
bl.find, bl.rad.

    blender -b --factory-startup -P scripts/tests/rigkit/A1_test_units.py -- [--out E:\tmp_rigkit\A1\units]

One JSON line (``checks``: name -> pass); exit 1 on failure.
"""
import json
import math
import os
import sys
import traceback

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPTS = os.path.dirname(os.path.dirname(HERE))
DEFAULT_OUT = r"E:\tmp_rigkit\A1\units"
sys.dont_write_bytecode = True
if SCRIPTS not in sys.path:
    sys.path.insert(0, SCRIPTS)


def _seam_mesh(name):
    """A box whose faces have their own vertices (24 = 8 positions x 3), with a UV layer and two materials."""
    import bpy

    corners = [(x, y, z) for x in (-0.5, 0.5) for y in (-0.25, 0.25) for z in (0.0, 1.0)]
    quads = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
    verts, faces = [], []
    for q in quads:
        base = len(verts)
        verts += [corners[i] for i in q]
        faces.append(tuple(range(base, base + 4)))
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.uv_layers.new(name="UVMap")
    for k, loop in enumerate(me.uv_layers[0].data):
        loop.uv = ((k % 4) / 4.0, (k // 4) / 6.0)
    for i in range(2):
        me.materials.append(bpy.data.materials.new(f"{name}_m{i}"))
    for k, p in enumerate(me.polygons):
        p.material_index = k % 2
    me.update()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def main():
    import argparse

    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=DEFAULT_OUT)
    a = ap.parse_args(argv)
    os.makedirs(a.out, exist_ok=True)
    C, R = {}, {"test": "A1_test_units"}
    try:
        import bpy
        import numpy as np
        from mathutils import Quaternion, Vector

        from rigcore import geom, npzio
        from rigkit import bl, control, functest, intake, meshio, skeleton, state

        bl.new_empty_file()
        # ---------------------------------------------------------------- intake.normalize
        ob = _seam_mesh("box")
        ob.location = (1.0, 2.0, 3.0)
        ob.rotation_euler = (math.radians(30), 0.0, math.radians(45))
        ob.scale = (2.0, 2.0, 2.0)
        bl.update()
        nz = intake.normalize(ob, 1.8)
        V = meshio.rest_vertices(ob, world=True)
        C["normalize_ok"] = nz["ok"] and nz["baked_transform"]
        C["normalize_height"] = abs(float(V[:, 2].max() - V[:, 2].min()) - 1.8) < 1e-6 and abs(float(V[:, 2].min())) < 1e-6
        C["normalize_identity"] = all(abs(ob.matrix_world[i][j] - (i == j)) < 1e-12 for i in range(4) for j in range(4))
        R["normalize"] = nz
        # ---------------------------------------------------------------- meshio
        p = meshio.export_mesh_npz(ob, os.path.join(a.out, "box_mesh.npz"), "box", 1.8, scale_factor=nz["factor"])
        d = npzio.load_mesh(p["path"])
        C["npz_shapes"] = d["V"].shape == (24, 3) and d["F"].shape == (12, 3) and d["UV"].shape == (24, 2) and d["mat"].shape == (12,)
        C["npz_weld_8"] = int(d["weld"].max()) + 1 == 8 and p["n_welded"] == 8
        C["npz_values"] = bool(np.array_equal(d["V"], meshio.rest_vertices(ob))) and set(d["mat"].tolist()) == {0, 1}
        C["npz_meta"] = d["meta"]["asset_id"] == "box" and abs(d["meta"]["scale_factor"] - nz["factor"]) < 1e-12
        ev = meshio.evaluated_vertices(ob)
        C["evaluated_float32"] = ev.dtype == np.float32 and ev.shape == (24, 3) and float(np.abs(ev - d["V"]).max()) < 1e-6
        # ---------------------------------------------------------------- bend test flip + ambiguous
        skel = {"H": 1.0, "bones": [
            {"name": "root", "parent": None, "kind": "core", "deform": False, "head": [0, 0, 0], "tail": [0, 0, 0.1], "hinge": [1, 0, 0]},
            {"name": "up", "parent": "root", "kind": "core", "deform": True, "head": [0, 0, 1], "tail": [0, 0, 2], "hinge": [-1, 0, 0],
             "bend_test": "top moves forward (-Y)"},
            {"name": "up_twist", "parent": "up", "kind": "twist", "deform": True, "head": [0, 0, 1.25], "tail": [0, 0, 1.5], "hinge": [-1, 0, 0]},
            {"name": "amb", "parent": "root", "kind": "core", "deform": True, "head": [1, 0, 1], "tail": [1, 0, 2], "hinge": [1, 0, 0],
             "bend_test": "tail goes along X (+X)"},
        ]}
        arm, rep = skeleton.build_runtime(skel, "flip_test")
        res = {r["bone"]: r for r in rep["bend_tests"]}
        C["flip_fixes_wrong_roll"] = res["up"]["flipped"] and res["up"]["passed"] and res["up"]["cos_before_flip"] < -0.9
        C["flip_twist_child_follows"] = "up_twist" in rep["flipped"]
        C["ambiguous_not_flipped"] = (not res["amb"]["flipped"]) and res["amb"]["ambiguous"] and not res["amb"]["passed"]
        R["flip"] = rep["bend_tests"]
        # the post-flip skeleton describes the built armature: rebuilt from it, no bone needs a flip and the rolls are the same
        eff = skeleton.apply_flips(skel, rep["flipped"])
        byn = {b["name"]: b for b in eff["bones"]}
        C["apply_flips_effective_hinge"] = (byn["up"]["hinge"] == [1.0, 0.0, 0.0] and byn["up_twist"]["hinge"] == [1.0, 0.0, 0.0]
                                            and byn["up"]["roll_flipped"] and byn["up_twist"]["roll_flipped"] and not byn["amb"]["roll_flipped"]
                                            and skel["bones"][1]["hinge"] == [-1, 0, 0])
        arm2, rep2 = skeleton.build_runtime(eff, "flip_test_rebuilt")
        r2 = {r["bone"]: r for r in rep2["bend_tests"]}
        rolls1, rolls2 = skeleton.read_rolls(arm), skeleton.read_rolls(arm2)
        C["rebuild_from_effective_needs_no_flip"] = (not r2["up"]["flipped"] and r2["up"]["passed"] and "up_twist" not in rep2["flipped"]
                                                     and max(abs(math.remainder(rolls1[n] - rolls2[n], 2 * math.pi)) for n in rolls1) < 1e-6)
        R["flip_rebuild"] = {"flipped": rep2["flipped"], "rolls_first": rolls1, "rolls_rebuilt": rolls2}
        # ---------------------------------------------------------------- skirt chain hook
        sk = {"H": 1.0, "bones": [
            {"name": "pelvis", "head": [0, 0, 1.0], "tail": [0, 0, 1.1], "hinge": [1, 0, 0], "parent": None},
            {"name": "L_Thigh", "head": [0.1, 0, 1.0], "tail": [0.1, 0, 0.5], "hinge": [1, 0, 0], "parent": "pelvis"},
            {"name": "R_Thigh", "head": [-0.1, 0, 1.0], "tail": [-0.1, 0, 0.5], "hinge": [1, 0, 0], "parent": "pelvis"},
            {"name": "skirt_01", "head": [0, -0.1, 0.95], "tail": [0, -0.1, 0.7], "hinge": [1, 0, 0], "parent": "pelvis"},
            {"name": "skirt_02", "head": [0, -0.1, 0.7], "tail": [0, -0.1, 0.45], "hinge": [1, 0, 0], "parent": "skirt_01"},
        ]}
        sa = bpy.data.objects.new("skirt_rig", bpy.data.armatures.new("skirt_rig"))
        bl.link(sa)
        with bl.edit_mode(sa) as data:
            for b in sk["bones"]:
                eb = data.edit_bones.new(b["name"])
                eb.head, eb.tail = Vector(b["head"]), Vector(b["tail"])
                eb.align_roll(Vector(geom.roll_z_vector(b["head"], b["tail"], b["hinge"])))
                if b["parent"]:
                    eb.parent = data.edit_bones[b["parent"]]
        hk = control.add_skirt_chain(sa, ["skirt_01", "skirt_02"], "L_Thigh", "R_Thigh", 0.5)

        def skirt_angle(l_deg, r_deg):
            bl.reset_pose(sa)
            sa.pose.bones["L_Thigh"].rotation_quaternion = Quaternion((1, 0, 0), math.radians(l_deg))
            sa.pose.bones["R_Thigh"].rotation_quaternion = Quaternion((1, 0, 0), math.radians(r_deg))
            bl.update()
            pb = sa.pose.bones["skirt_01"]
            q = (sa.data.bones["skirt_01"].matrix_local.inverted() @ pb.matrix).to_quaternion()
            return math.degrees(2 * math.atan2(q.x, q.w))

        one, both, opp = skirt_angle(40, 0), skirt_angle(40, 40), skirt_angle(40, -40)
        bl.reset_pose(sa)
        C["skirt_half_of_one_thigh"] = abs(one - 20.0) < 0.01
        C["skirt_follows_both"] = abs(both - 40.0) < 0.01
        C["skirt_cancels_opposite"] = abs(opp) < 0.01
        R["skirt"] = {"hook": hk, "one_thigh_40": one, "both_40": both, "opposite_40": opp}
        # ---------------------------------------------------------------- pole sweep refinement (optimum off the 0.5 deg grid)
        delta = 1.2345  # extra roll of both chain bones: shifts the optimal pole angle by about delta from D01's -90
        pa = bpy.data.objects.new("pole_rig", bpy.data.armatures.new("pole_rig"))
        bl.link(pa)
        chain = {"ctl_a": ((0.0, 0.0, 1.0), (0.0, -0.03, 0.5), None), "ctl_b": ((0.0, -0.03, 0.5), (0.0, 0.0, 0.1), "ctl_a"),
                 "ctl_t": ((0.0, 0.0, 0.1), (0.0, -0.05, 0.1), None), "ctl_p": ((0.0, -0.33, 0.5), (0.0, -0.36, 0.5), None)}
        with bl.edit_mode(pa) as data:
            for nm, (h, t, par) in chain.items():
                eb = data.edit_bones.new(nm)
                eb.head, eb.tail = Vector(h), Vector(t)
                eb.align_roll(Vector(geom.roll_z_vector(h, t, (1.0, 0.0, 0.0))))
                if nm in ("ctl_a", "ctl_b"):
                    eb.roll += math.radians(delta)
                if par:
                    eb.parent = data.edit_bones[par]
        con = pa.pose.bones["ctl_b"].constraints.new("IK")
        con.target, con.subtarget, con.pole_target, con.pole_subtarget = pa, "ctl_t", pa, "ctl_p"
        con.chain_count, con.use_tail, con.use_stretch = 2, True, False
        hb = pa.pose.bones["ctl_b"]  # the kit's hinge lock
        hb.lock_ik_y, hb.lock_ik_z, hb.use_ik_limit_x, hb.ik_min_x, hb.ik_max_x = True, True, True, 0.0, math.radians(150.0)
        pol = control.find_pole_angles(pa, {"ik": [{"name": "leg", "chain": ["a", "b"]}]})["leg"]
        off = abs(pol["angle_deg"] + 90.0)
        C["pole_grid_alone_misses_1e-4"] = pol["grid_dev_rad"] > 1e-3  # 0.2345 deg off the grid
        C["pole_refined_below_1e-4"] = pol["refined"] and pol["dev_rad"] < 1e-4 and abs(off - delta) < 0.05
        R["pole_refine"] = dict(pol, delta_deg=delta, offset_from_minus90_deg=off)
        g_x, g_f, g_n = control.golden_min(lambda x: abs(x - 0.123456789), -1.0, 1.0, 1e-9, 200)
        C["golden_min_v_shape"] = abs(g_x - 0.123456789) < 1e-8 and g_f < 1e-8 and g_n < 200
        # ---------------------------------------------------------------- twist driver (sibling driver, as the forearm twist)
        ta = bpy.data.objects.new("twist_rig", bpy.data.armatures.new("twist_rig"))
        bl.link(ta)
        with bl.edit_mode(ta) as data:
            fore = data.edit_bones.new("fore")
            fore.head, fore.tail = Vector((0.0, 0.0, 1.0)), Vector((0.3, 0.0, 1.0))
            for nm, h, t in (("hand", (0.3, 0.0, 1.0), (0.4, 0.0, 1.0)), ("tw", (0.15, 0.0, 1.0), (0.225, 0.0, 1.0))):
                eb = data.edit_bones.new(nm)
                eb.head, eb.tail = Vector(h), Vector(t)
                eb.align_roll(Vector((0.0, 0.0, 1.0)))
                eb.parent = fore
            fore.align_roll(Vector((0.0, 0.0, 1.0)))
        info = control.add_twist_driver(ta, "tw", "hand", "Y", 0.5)
        C["twist_driver_simple"] = info["simple_expression"] and info["expression"] == "t * 0.5" and info["index"] == 1
        bl.reset_pose(ta)
        C["reset_pose_keeps_driven_mode"] = (ta.pose.bones["tw"].rotation_mode == "XYZ" and ta.pose.bones["hand"].rotation_mode == "QUATERNION"
                                             and bl.driven_rotation_bones(ta) == {"tw"})
        tw_rows = {}
        for case, steps in functest.TWIST_CASES:
            bl.reset_pose(ta)
            q = functest.twist_case_quaternion(steps)
            ta.pose.bones["hand"].rotation_quaternion = q
            bl.update()
            want = 0.5 * functest._twist_deg(q, "Y")[0]
            got, sw = functest._twist_deg(functest._local_rot(ta, "tw"), "Y")
            tw_rows[case] = {"expected_deg": want, "got_deg": got, "swing_deg": sw}
        bl.reset_pose(ta)
        bl.update()
        C["twist_driver_cases_0p5deg"] = all(abs(r["got_deg"] - r["expected_deg"]) < 0.5 and r["swing_deg"] < 0.5 for r in tw_rows.values())
        C["twist_driver_rest_zero"] = abs(functest._twist_deg(functest._local_rot(ta, "tw"), "Y")[0]) < 1e-9
        R["twist_driver"] = {"info": info, "cases": tw_rows}
        C["bl_rad"] = bl.rad(180.0) == math.pi and not hasattr(bl, "deg")
        # ---------------------------------------------------------------- state snapshot / diff / overrides
        box = bpy.data.objects["box"]
        for g in ("A", "B"):
            vg = box.vertex_groups.new(name=g)
        box.vertex_groups["A"].add(list(range(24)), 0.75, "REPLACE")
        box.vertex_groups["B"].add(list(range(24)), 0.25, "REPLACE")
        names = state.make_landmark_empties({"knee_L": (0.1, -0.02, 0.5), "hip_L": (0.1, 0.0, 0.9)})
        s0 = state.snapshot(box, [sa], weights_file=os.path.join(a.out, "state0.npz"))
        bpy.data.objects["lm_knee_L"].location = (0.1, -0.03, 0.5)
        corner = [i for i, v in enumerate(box.data.vertices) if (v.co - box.data.vertices[0].co).length < 1e-9]
        for i in corner:  # every seam duplicate of one position, as weight paint with the welded rule
            box.vertex_groups["A"].add([i], 0.5, "REPLACE")
        sa.pose.bones["skirt_02"].location = (0.0, 0.01, 0.0)
        s1 = state.snapshot(box, [sa], weights_file=os.path.join(a.out, "state1.npz"))
        dd = state.diff(s0, s1)
        C["diff_landmark"] = list(dd["landmarks"]) == ["knee_L"] and abs(dd["landmarks"]["knee_L"]["moved_m"] - 0.01) < 1e-6
        C["diff_weights"] = dd["weights_changed_groups"] == ["A"]
        C["diff_pose"] = dd["pose_changed"] == {"skirt_rig": ["skirt_02"]}
        C["diff_empty_when_same"] = state.diff(s1, s1)["empty"]
        lo = os.path.join(a.out, "landmarks_override.json")
        wo = os.path.join(a.out, "weights_override.json")
        for f_ in (lo, wo):
            if os.path.exists(f_):
                os.remove(f_)
        state.write_landmarks_override(lo, "box", dd, s1, note="unit test")
        state.write_weights_override(wo, "box", s0, s1, dd, note="unit test")
        L = npzio.read_json(lo)
        Wd = npzio.read_json(wo)
        C["landmarks_override"] = L["kind"] == "landmarks_override" and abs(L["landmarks"]["knee_L"]["pos"][1] + 0.03) < 1e-6
        C["weights_override"] = (len(Wd["entries"]) == 1 and abs(Wd["entries"][0]["weights"]["A"] - 0.5) < 1e-6
                                 and abs(Wd["entries"][0]["before"]["A"] - 0.75) < 1e-6 and Wd["entries"][0]["members"] == 3
                                 and not Wd["entries"][0]["conflict"])
        R["state"] = {"diff": dd, "weights_override": Wd["entries"], "landmark_empties": names}
        # ---------------------------------------------------------------- bl.find
        bl.tag(box, "mesh", "box")
        C["find_by_tag"] = bl.find("mesh", "box") is box
        C["find_missing_returns_none"] = bl.find("control", "nothing", required=False) is None
    except Exception as e:
        traceback.print_exc()
        R["error"] = repr(e)
    R["checks"] = C
    R["ok"] = bool(C) and all(C.values()) and "error" not in R
    with open(os.path.join(a.out, "units.json"), "w", encoding="utf-8") as f:
        f.write(json.dumps(R, indent=1, default=str))
    from rigkit import bl

    print(bl.json_line({"test": R["test"], "ok": R["ok"], "checks": C, "error": R.get("error")}))
    return 0 if R["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
