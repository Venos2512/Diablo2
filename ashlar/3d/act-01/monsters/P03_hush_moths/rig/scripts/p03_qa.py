"""P03 Hush-Moths R4/R5 helpers: QA poses through the CONTROL rig, and the numbers measured on each pose.

Poses are dicts {ctl_bone: (rot_xyz_deg | None, armature-space offset m | None)} plus 'props' (custom props on the ctl object).
Axes (built at R2): wing masters +X = up (both sides); ctl_wings X = flap both; leg bones +X = flex; abdomen curl +X = tip up;
head +X = nod up, +Z = turn to the moth's left.
"""
import bpy, math
import numpy as np
from mathutils import Vector, Matrix, Euler
from mathutils.bvhtree import BVHTree

LEGS = [f'{s}_Leg{n}' for s in ('L', 'R') for n in (1, 2, 3)]


def _both(d, mirror_y=False, mirror_z=False):
    out = {}
    for k, (rot, off) in d.items():
        out[k] = (rot, off)
        if '_L_' in k:
            r = None if rot is None else (rot[0], -rot[1] if mirror_y else rot[1], -rot[2] if mirror_z else rot[2])
            out[k.replace('_L_', '_R_')] = (r, off)
    return out


def tuck():
    d = {}
    for s in ('L', 'R'):
        for n in (1, 2, 3):
            d[f'ctl_{s}_Leg{n}_01'] = ((-30, 0, 0), None); d[f'ctl_{s}_Leg{n}_02'] = ((65, 0, 0), None); d[f'ctl_{s}_Leg{n}_03'] = ((45, 0, 0), None)
    return d


IK_OFF = {f'ik_leg_{s}{n}': 0.0 for s in ('L', 'R') for n in (1, 2, 3)}

POSES = {
    'rest': dict(),
    'wings_up_65': dict(bones={'ctl_wings': ((65, 0, 0), None)}),
    'wings_mid_30': dict(bones={'ctl_wings': ((30, 0, 0), None)}),
    'wings_down_45': dict(bones={'ctl_wings': ((-45, 0, 0), None)}),
    'wingB_lag_10': dict(bones=_both({'ctl_L_Wing': ((40, 0, 0), None), 'ctl_L_WingB_01': ((-10, 0, 0), None)})),
    'wingB_lead_10': dict(bones=_both({'ctl_L_Wing': ((40, 0, 0), None), 'ctl_L_WingB_01': ((10, 0, 0), None)})),
    'wing_flex_30': dict(bones=_both({'ctl_L_Wing': ((20, 0, 0), None), 'ctl_L_WingF_02': ((30, 0, 0), None),
                                      'ctl_L_WingB_02': ((30, 0, 0), None)})),
    'wing_twist_25': dict(bones=_both({'ctl_L_Wing': ((0, 25, 0), None)}, mirror_y=True)),
    'wing_sweep_20': dict(bones=_both({'ctl_L_Wing': ((0, 0, 20), None)}, mirror_z=True)),
    'abdomen_down_45': dict(bones={'ctl_abdomen_curl': ((-15, 0, 0), None)}),       # 15 deg per segment = 45 deg at the tip
    'abdomen_up_30': dict(bones={'ctl_abdomen_curl': ((10, 0, 0), None)}),
    'abdomen_side_36': dict(bones={'ctl_abdomen_curl': ((0, 0, 12), None)}),
    'antenna_fwd': dict(bones=_both({'ctl_L_antenna_01': ((25, 0, 0), None), 'ctl_L_antenna_02': ((25, 0, 0), None)})),
    'antenna_back': dict(bones=_both({'ctl_L_antenna_01': ((-25, 0, 0), None), 'ctl_L_antenna_02': ((-25, 0, 0), None)})),
    'antenna_side': dict(bones=_both({'ctl_L_antenna_01': ((0, 0, -15), None), 'ctl_L_antenna_02': ((0, 0, -10), None)}, mirror_z=True)),
    'head_nod_15': dict(bones={'ctl_head': ((15, 0, 0), None)}),
    'head_down_15': dict(bones={'ctl_head': ((-15, 0, 0), None)}),
    'head_turn_15': dict(bones={'ctl_head': ((0, 0, 15), None)}),
    'legs_tuck': dict(bones=tuck(), props=IK_OFF),
    'leg_step_IK': dict(bones={'ctl_L_Leg1_IK': (None, (0, -0.03, 0.05)), 'ctl_R_Leg2_IK': (None, (0, 0, 0.04)),
                               'ctl_L_Leg3_IK': (None, (0, 0.02, 0.04))}),
    'crouch_IK': dict(bones={'ctl_cog': (None, (0, 0, -0.035))}),
    'flight_combo': dict(bones={**tuck(), 'ctl_wings': ((55, 0, 0), None), 'ctl_abdomen_curl': ((-15, 0, 0), None),
                                'ctl_cog': ((-10, 0, 0), None)}, props=IK_OFF),
}


def clear(ctl):
    for pb in ctl.pose.bones:
        pb.location = (0, 0, 0); pb.rotation_euler = (0, 0, 0); pb.rotation_quaternion = (1, 0, 0, 0); pb.scale = (1, 1, 1)
    for k in IK_OFF:
        ctl[k] = 1.0
    bpy.context.view_layer.update()


def apply(ctl, spec):
    clear(ctl)
    for k, v in spec.get('props', {}).items():
        ctl[k] = v
    for name, (rot, off) in spec.get('bones', {}).items():
        pb = ctl.pose.bones[name]
        if rot is not None:
            pb.rotation_mode = 'XYZ'; pb.rotation_euler = Euler([math.radians(a) for a in rot], 'XYZ')
        if off is not None:
            R3 = ctl.data.bones[name].matrix_local.to_3x3()
            pb.location = R3.inverted() @ Vector(off)
    bpy.context.view_layer.update()


def positions(ob):
    dg = bpy.context.evaluated_depsgraph_get(); ev = ob.evaluated_get(dg).to_mesh()
    P = np.array([ob.matrix_world @ v.co for v in ev.vertices])
    ob.evaluated_get(dg).to_mesh_clear()
    return P


def bvh_of(P, faces):
    return BVHTree.FromPolygons([Vector(p) for p in P], faces)


def island_faces(me, verts):
    keep = set(int(v) for v in verts)
    return [list(p.vertices) for p in me.polygons if all(v in keep for v in p.vertices)]


def signed_dist(bvh, pts):
    out = []
    for p in pts:
        loc, nrm, idx, d = bvh.find_nearest(Vector(p))
        if loc is None:
            out.append(1.0); continue
        out.append(d if (Vector(p) - loc).dot(nrm) >= 0 else -d)
    return np.array(out)


def near_inside(bvh, pts, maxd=0.03):
    """(inside flags, unsigned distance) against a closed surface; parity only for points within maxd of it."""
    du = np.array([(lambda h: 1.0 if h[0] is None else h[3])(bvh.find_nearest(Vector(p))) for p in pts])
    ins = np.zeros(len(pts), dtype=bool)
    cand = np.nonzero(du < maxd)[0]
    if len(cand):
        ins[cand] = inside_parity(bvh, pts[cand], dirs=((0, 0, 1), (0, 1, 0), (1, 0, 0)))
    return ins, du


def inside_parity(bvh, pts, dirs=((0, 0, 1), (0, 0, -1), (1, 0, 0))):
    res = []
    for p in pts:
        votes = 0
        for d in dirs:
            o = Vector(p); dv = Vector(d); n = 0
            for _ in range(60):
                hit = bvh.ray_cast(o, dv)
                if hit[0] is None:
                    break
                n += 1; o = hit[0] + dv * 1e-5
            votes += n % 2
        res.append(votes * 2 > len(dirs))
    return np.array(res)


def edge_stretch(me, P0, P, min_len, hi=1.6, lo=0.5):
    E = np.array([e.vertices[:] for e in me.edges])
    r = np.linalg.norm(P0[E[:, 0]] - P0[E[:, 1]], axis=1); d = np.linalg.norm(P[E[:, 0]] - P[E[:, 1]], axis=1)
    m = r >= min_len
    q = d[m] / r[m]; qq = np.maximum(q, 1 / np.maximum(q, 1e-6))
    bad = (q > hi) | (q < lo)
    k = int(np.argmax(qq)) if len(qq) else 0
    worst_edge = E[m][k] if len(qq) else None
    ks = int(np.argmax(q)); kc = int(np.argmin(q))
    return dict(worst=round(float(qq.max()), 3), bad=int(bad.sum()), worst_dlen_mm=round(float(abs(d[m][k] - r[m][k])) * 1000, 2),
                worst_at=[round(float(x), 3) for x in P0[worst_edge[0]]] if worst_edge is not None else None,
                stretch_max=round(float(q.max()), 3), stretch_bad=int((q > hi).sum()),
                stretch_at_mm=[round(float(r[m][ks]) * 1000, 1), round(float(d[m][ks]) * 1000, 1)],
                compress_min=round(float(q.min()), 3), compress_bad=int((q < lo).sum()),
                compress_at_mm=[round(float(r[m][kc]) * 1000, 1), round(float(d[m][kc]) * 1000, 1)]), qq, E[m]
