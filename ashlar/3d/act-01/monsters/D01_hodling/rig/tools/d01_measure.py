"""Phep do chuyen biet cho sua loi v4 (chay trong Blender, tren file .blend dang mo):

  1. SACK: lop vai tui (`sack`, khong tinh `brick`) phai gan nhu dung yen khi chi quay dau/co (nguc khong di chuyen);
     do dich chuyen tuyet doi so voi rest, khoi trong so cua head/neck tren vai tui, va gian canh o duong bien tui <-> da than.
  2. KHO TRUOC (`flap_front`): xuyen mesh voi dui. Hai cach do doc lap, giu nguyen hinh hoc sau bien dang:
       a) flap_front vertex nam TRONG khoi than (bo phieu 3 tia chan le tren tam giac than kin) + do sau toi be mat gan nhat
       b) so tam giac khố giao voi tam giac than (BVH overlap), loc theo vung than (dui/bap chan...)
       c) so dinh khố bi dui CHE: tia ra truoc (-Y) trong 8 cm trung be mat dui (khố nam sau dui du khong xuyen the tich)
     Vung than lay theo nhom trong so troi nhat cua dinh gan nhat tren be mat than, KHONG dung khoang cach dinh khong dau.
     Moi con so phai tru di gia tri o rest (chong dinh co the da nam sat/cham than ngay tu dau).
Lop dinh (cls) tinh lai tu d01_skin.compute tren mesh rest + texture: xac dinh va giong luc dung rig.
"""
import numpy as np
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

import d01_common as C
import d01_rigkit as K
import d01_skin as S

BODY_CLASSES = ("main", "ear", "strap", "sack")
SACK_ALLOWED = ("sack", "chest", "spine_02", "spine_01")


def mesh_tris(me):
    me.calc_loop_triangles()
    t = np.empty(len(me.loop_triangles) * 3, dtype=np.int64)
    me.loop_triangles.foreach_get("vertices", t)
    return t.reshape(-1, 3)


def mesh_uv(me):
    n = len(me.vertices)
    uvl = me.uv_layers[0].data
    a = np.empty(len(uvl) * 2)
    uvl.foreach_get("uv", a)
    v = np.empty(len(me.loops), dtype=np.int64)
    me.loops.foreach_get("vertex_index", v)
    uv = np.zeros((n, 2))
    uv[v] = a.reshape(-1, 2)
    return uv


def weights_matrix(ob):
    me = ob.data
    n = len(me.vertices)
    names = [g.name for g in ob.vertex_groups]
    W = np.zeros((n, len(names)))
    for v in me.vertices:
        for g in v.groups:
            W[v.index, g.group] = g.weight
    return W, names


class Ctx:
    """Mang du lieu tinh cua mesh dang mo: lop dinh theo chi so dinh goc, tam giac, canh han, trong so."""

    def __init__(self):
        self.ob = K.get_mesh()
        me = self.ob.data
        self.tris = mesh_tris(me)
        self.rest = K.rest_positions()
        col = C.sample_basecolor(mesh_uv(me))
        res = S.compute(self.rest, col, self.tris)
        self.inv = res["inv"]
        self.cls = res["cls"][self.inv]  # (n,) nhan lop theo dinh goc
        self.W, self.names = weights_matrix(self.ob)
        self.gi = {nm: i for i, nm in enumerate(self.names)}
        self.nw = int(self.inv.max()) + 1
        self.E = S.adjacency(self.inv[self.tris], self.nw)  # canh theo dinh han
        cls_w = np.empty(self.nw, dtype=object)
        cls_w[self.inv] = self.cls
        self.cls_w = cls_w
        tcls = self.cls[self.tris]
        self.body_tri = np.isin(tcls, BODY_CLASSES).all(1)
        self.flap_tri = (tcls == "flap_front").all(1)
        self.dom = np.array(self.names)[self.W.argmax(1)]
        self.watertight = self._boundary_edges()

    def _boundary_edges(self):
        t = self.inv[self.tris[self.body_tri]]
        e = np.concatenate([t[:, [0, 1]], t[:, [1, 2]], t[:, [2, 0]]])
        e = np.sort(e, axis=1)
        u, cnt = np.unique(e, axis=0, return_counts=True)
        hole = np.unique(u[cnt == 1].ravel())
        self.hole_pts = self.welded(self.rest)[hole] if len(hole) else np.zeros((0, 3))
        return {"body_triangles": int(self.body_tri.sum()), "edges": int(len(cnt)), "boundary_edges": int((cnt == 1).sum()), "nonmanifold_edges": int((cnt > 2).sum())}

    def idx(self, *classes):
        return np.nonzero(np.isin(self.cls, classes))[0]

    def welded(self, pos):
        P = np.zeros((self.nw, 3))
        P[self.inv] = pos
        return P


# ------------------------------------------------------------------ 1. SACK
def sack_static(cx):
    """Khoi trong so cua bone khong nam trong SACK_ALLOWED tren cac dinh vai tui (khong tinh gach)."""
    sk = cx.idx("sack")
    allowed = [cx.gi[n] for n in SACK_ALLOWED]
    mask = np.ones(len(cx.names), bool)
    mask[allowed] = False
    off = cx.W[sk][:, mask].sum(1)
    cols = {nm: float(cx.W[sk][:, cx.gi[nm]].max()) for nm in ("head", "neck", "pelvis", "L_UpperArm", "R_UpperArm")}
    return {"sack_vertices": int(len(sk)), "brick_vertices": int(len(cx.idx("brick"))), "max_weight_outside_allowed": float(off.max()),
            "vertices_with_outside_weight_gt_0.001": int((off > 1e-3).sum()), "max_weight_by_bone": cols,
            "head_plus_neck_max": float((cx.W[sk][:, cx.gi["head"]] + cx.W[sk][:, cx.gi["neck"]]).max())}


def sack_motion(cx, base, pos):
    sk = cx.idx("sack")
    d = np.linalg.norm(pos[sk] - base[sk], axis=1)
    top = sk[np.argsort(-d)[:1]]
    return {"max_mm": float(d.max() * 1000), "p99_mm": float(np.percentile(d, 99) * 1000), "mean_mm": float(d.mean() * 1000),
            "worst_vertex": int(top[0]), "worst_rest_xyz": [round(float(v), 4) for v in cx.rest[top[0]]]}


def boundary_stretch(cx, base, pos):
    """Gian canh tren duong bien vai tui <-> da than (canh co mot dau la sack, dau kia la main/ear/strap)."""
    a, b = cx.E[:, 0], cx.E[:, 1]
    ca, cb = cx.cls_w[a], cx.cls_w[b]
    bd = ((ca == "sack") & np.isin(cb, ("main", "ear", "strap"))) | ((cb == "sack") & np.isin(ca, ("main", "ear", "strap")))
    Pb, Pp = cx.welded(base), cx.welded(pos)
    L0 = np.linalg.norm(Pb[a[bd]] - Pb[b[bd]], axis=1)
    L1 = np.linalg.norm(Pp[a[bd]] - Pp[b[bd]], axis=1)
    g = L1 - L0
    return {"boundary_edges": int(bd.sum()), "max_growth_mm": float(g.max() * 1000), "p99_growth_mm": float(np.percentile(g, 99) * 1000),
            "max_edge_len_mm": float(L1.max() * 1000), "rest_mean_edge_mm": float(L0.mean() * 1000)}


# ------------------------------------------------------------------ 2. KHO TRUOC <-> than
_DIRS = [Vector(v).normalized() for v in ((0.5773, 0.3011, 0.7589), (-0.2917, 0.8123, -0.5), (0.1931, -0.4617, -0.8664))]


def _inside(bvh, p):
    votes = 0
    for d in _DIRS:
        o = Vector(p)
        cnt = 0
        for _ in range(60):
            hit = bvh.ray_cast(o, d)
            if hit[0] is None:
                break
            cnt += 1
            o = hit[0] + d * 1e-6
        votes += cnt % 2
    return votes >= 2


def region_of_tri(cx, tri_vs):
    w = cx.W[tri_vs].mean(0)
    nm = cx.names[int(w.argmax())]
    return nm


def region_class(nm):
    b = nm[2:] if nm[:2] in ("L_", "R_") else nm
    return "thigh" if b in ("Thigh", "Calf", "Foot", "Toe") else "torso_other"


def flap_vs_body(cx, pos):
    """Do xuyen khố truoc <-> than o tu the 'pos' (n,3 the gioi)."""
    verts = [Vector(p) for p in pos]
    body = np.nonzero(cx.body_tri)[0]
    bvh_b = BVHTree.FromPolygons(verts, [tuple(int(v) for v in cx.tris[i]) for i in body], epsilon=0.0)
    flap_t = np.nonzero(cx.flap_tri)[0]
    bvh_f = BVHTree.FromPolygons(verts, [tuple(int(v) for v in cx.tris[i]) for i in flap_t], epsilon=0.0)
    # (a) dinh khố nam trong khoi than
    fv = np.unique(cx.tris[flap_t].ravel())
    ins = []
    for v in fv:
        if _inside(bvh_b, pos[v]):
            loc, nrm, fi, dist = bvh_b.find_nearest(Vector(pos[v]))
            reg = region_of_tri(cx, cx.tris[body[fi]])
            ins.append((int(v), float(dist), reg, region_class(reg)))
    thigh = [x for x in ins if x[3] == "thigh"]
    other = [x for x in ins if x[3] != "thigh"]
    # (c) khố bi dui che: tu moi dinh khố ban tia ra TRUOC than (-Y the gioi = huong truoc cua pelvis, pelvis khong di chuyen trong tu the dui)
    #     trong 8 cm; trung be mat dui => khố nam SAU dui (loi 'khố kẹt sau đùi' khi dui nang len khong xuyen the tich dui)
    fwd = Vector((0.0, -1.0, 0.0))
    cov = []
    for v in fv:
        loc, nrm, fi, dist = bvh_b.ray_cast(Vector(pos[v]) + fwd * 1e-4, fwd, 0.08)
        if loc is not None and region_class(region_of_tri(cx, cx.tris[body[fi]])) == "thigh":
            cov.append(int(v))
    # (b) tam giac giao nhau
    pairs = bvh_f.overlap(bvh_b)
    f_hit_thigh, f_hit_other = set(), set()
    for fi, bi in pairs:
        reg = region_class(region_of_tri(cx, cx.tris[body[bi]]))
        (f_hit_thigh if reg == "thigh" else f_hit_other).add(fi)
    return {"flap_vertices": int(len(fv)), "flap_triangles": int(len(flap_t)),
            "inside_vertices_thigh": len(thigh), "inside_vertices_other": len(other),
            "max_depth_thigh_mm": float(max([x[1] for x in thigh], default=0.0) * 1000),
            "max_depth_other_mm": float(max([x[1] for x in other], default=0.0) * 1000),
            "intersecting_flap_triangles_thigh": len(f_hit_thigh), "intersecting_flap_triangles_other": len(f_hit_other),
            "covered_by_thigh_vertices": len(cov), "covered_by_thigh_vertex_ids": sorted(cov),
            "inside_thigh_vertex_ids": sorted(x[0] for x in thigh), "inside_other_vertex_ids": sorted(x[0] for x in other),
            "inside_thigh_regions": sorted({x[2] for x in thigh})}


def flap_delta(cur, rest):
    """Con so da tru gia tri rest: so dinh moi nam trong dui / so tam giac moi giao dui."""
    new_v = set(cur["inside_thigh_vertex_ids"]) - set(rest["inside_thigh_vertex_ids"])
    return {"new_inside_vertices_thigh": len(new_v), "new_inside_vertices_other": len(set(cur["inside_other_vertex_ids"]) - set(rest["inside_other_vertex_ids"])),
            "new_intersecting_triangles_thigh": max(0, cur["intersecting_flap_triangles_thigh"] - rest["intersecting_flap_triangles_thigh"]),
            "new_covered_by_thigh_vertices": len(set(cur["covered_by_thigh_vertex_ids"]) - set(rest["covered_by_thigh_vertex_ids"])),
            "max_depth_thigh_mm": cur["max_depth_thigh_mm"]}
