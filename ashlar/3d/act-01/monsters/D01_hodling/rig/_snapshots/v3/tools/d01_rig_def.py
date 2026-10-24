"""Dinh nghia skeleton runtime D01 (ten bone, phan cap, vi tri, huong gap) tu landmarks.json. Python thuong, khong can bpy.

Skeleton runtime = 35 bone: 22 loi (SKELETON_STANDARD muc 3) + 5 phu (helmet, sack, loincloth_front, L_ear, R_ear) + 8 socket.
Moi bone: dict(name, parent, head, tail, hinge, kind). hinge = truc ban le (the gioi) de dat roll: bone local X ~ hinge (da truc giao hoa voi huong bone),
chon sao cho xoay local X duong = gap tu nhien (khuyu gap ra truoc, goi gap ra sau, cui ve truoc).
"""
import json
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))
LM = json.load(open(os.path.join(HERE, "landmarks.json"), encoding="utf-8"))
LEG_MX = LM["leg_mirror_x"]

X, Y, Z = (1.0, 0.0, 0.0), (0.0, 1.0, 0.0), (0.0, 0.0, 1.0)


def neg(v):
    return tuple(-c for c in v)


def add(a, b):
    return tuple(x + y for x, y in zip(a, b))


def mir_arm(p):
    """guong qua x=0 (tay, tai, mat, socket tay)."""
    return (-p[0], p[1], p[2])


def mir_leg(p):
    """guong qua x=leg_mirror_x (chan va ban chan; hai chan do duoc lech +0,0105)."""
    return (2 * LEG_MX - p[0], p[1], p[2])


def on_line(a, m, b):
    """Diem tren duong thang a-b gan m nhat."""
    ab = tuple(y - x for x, y in zip(a, b))
    t = sum((mc - ac) * dc for mc, ac, dc in zip(m, a, ab)) / sum(dc * dc for dc in ab)
    return tuple(ac + t * dc for ac, dc in zip(a, ab))


ELBOW_PREBEND = 0.0033  # m, khuyu lui ra sau duong vai-co tay (~4 do): chuoi IK khong thang tuyet doi o tu the rest, tranh ky di cua IK


def fitted_landmarks():
    """Landmark da do, co hai chinh:
    - khuyu (tay) chieu len duong vai-co tay roi lui +ELBOW_PREBEND theo +Y (gap ra truoc la huong tu nhien, rest khong thang tuyet doi);
    - goi giu nguyen cho da do (chan da cong ~9 do tren mesh)."""
    arm = dict(LM["arm_L"])
    e = on_line(arm["shoulder"], arm["elbow"], arm["wrist"])
    arm["elbow"] = (e[0], e[1] + ELBOW_PREBEND, e[2])
    return arm, dict(LM["leg_L"])


def bend_normal(a, m, b):
    """Phap tuyen mat phang gap a-m-b (truc ban le that cua khuyu/goi), don vi."""
    u = tuple(y - x for x, y in zip(a, m))
    f = tuple(y - x for x, y in zip(m, b))
    return unit(cross(u, f))


def sides():
    return (("L", 1, lambda p: tuple(p), lambda p: tuple(p)), ("R", -1, mir_arm, mir_leg))


def build():
    sp = LM["spine"]
    B = []

    def bone(name, parent, head, tail, hinge, kind):
        B.append(dict(name=name, parent=parent, head=tuple(head), tail=tuple(tail), hinge=hinge, kind=kind))

    # --- goc
    bone("root", None, (0, 0, 0), (0, 0, 0.04), X, "core")  # tro len (+Z Blender) nhu cac bone khac: nut glTF cua root co xoay don vi sau doi truc Y-up
    bone("cog", "root", sp["pelvis"], add(sp["pelvis"], (0, 0, 0.022)), X, "core")
    # --- than
    bone("pelvis", "cog", sp["pelvis"], sp["spine_01"], X, "core")
    bone("spine_01", "pelvis", sp["spine_01"], sp["spine_02"], X, "core")
    bone("spine_02", "spine_01", sp["spine_02"], sp["chest"], X, "core")
    bone("chest", "spine_02", sp["chest"], sp["neck"], X, "core")
    bone("neck", "chest", sp["neck"], sp["head"], X, "core")
    bone("head", "neck", sp["head"], sp["head_tail"], X, "core")
    # --- tay / chan
    for side, s, ma, ml in sides():
        arm_fit, leg_fit = fitted_landmarks()
        a = {k: ma(v) for k, v in arm_fit.items()}
        lg = {k: ml(v) for k, v in leg_fit.items()}
        hinge_arm = bend_normal(a["shoulder"], a["elbow"], a["wrist"])  # xoay local X duong = khuyu gap them ra truoc
        hinge_leg = bend_normal(lg["hip"], lg["knee"], lg["ankle"])  # xoay local X duong = goi gap them (ban chan ra sau)
        hinge_hand = Y if s > 0 else neg(Y)  # co tay gap duong = long ban tay xuong
        bone(f"{side}_UpperArm", "chest", a["shoulder"], a["elbow"], hinge_arm, "core")
        bone(f"{side}_ForeArm", f"{side}_UpperArm", a["elbow"], a["wrist"], hinge_arm, "core")
        bone(f"{side}_Hand", f"{side}_ForeArm", a["wrist"], a["hand_tip"], hinge_hand, "core")
        bone(f"{side}_Thigh", "pelvis", lg["hip"], lg["knee"], hinge_leg, "core")
        bone(f"{side}_Calf", f"{side}_Thigh", lg["knee"], lg["ankle"], hinge_leg, "core")
        bone(f"{side}_Foot", f"{side}_Calf", lg["ankle"], lg["ball"], X, "core")
        bone(f"{side}_Toe", f"{side}_Foot", lg["ball"], lg["toe_tip"], X, "core")
    # --- phu
    h = LM["helmet"]
    bone("helmet", "head", h["head"], h["tail"], X, "aux")
    s_ = LM["sack"]
    bone("sack", "chest", s_["head"], s_["tail"], X, "aux")
    lc = LM["loincloth_front"]
    bone("loincloth_front", "pelvis", lc["head"], lc["tail"], X, "aux")
    for side, s, ma, ml in sides():
        e = LM["ear_L"] if side == "L" else LM["ear_R"]  # tai khong doi xung: do rieng tung ben
        bone(f"{side}_ear", "head", e["base"], e["tip"], Z, "aux")
    # --- socket (khong trong so)
    for side, s, ma, ml in sides():
        palm = ma(LM["arm_L"]["palm"])
        bone(f"{side}_weapon_attach", f"{side}_Hand", palm, add(palm, (0, -0.04, 0)), Z, "socket")  # truc doc theo can: ra truoc
    fh = LM["sockets"]["fx_head"]
    bone("fx_head", "head", fh, add(fh, (0, 0, 0.02)), X, "socket")
    fc = LM["sockets"]["fx_chest"]
    bone("fx_chest", "chest", fc, add(fc, (0, -0.02, 0)), X, "socket")
    for side, s, ma, ml in sides():
        palm = ma(LM["arm_L"]["palm"])
        up = add(palm, (0, 0, 0.012))
        bone(f"fx_hand_{side}", f"{side}_Hand", up, add(up, (0, 0, 0.02)), X, "socket")
    ho = LM["sockets"]["hit_origin"]
    bone("hit_origin", "spine_02", ho, add(ho, (0, -0.03, 0)), X, "socket")
    bone("ground", "root", (0, 0, 0), (0, 0, 0.02), X, "socket")
    return B


def by_name(B=None):
    return {b["name"]: b for b in (B or build())}


def deform_names(B=None):
    return [b["name"] for b in (B or build()) if b["kind"] in ("core", "aux") and b["name"] not in ("root", "cog")]


def unit(v):
    n = math.sqrt(sum(c * c for c in v))
    return tuple(c / n for c in v)


def cross(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def roll_z(head, tail, hinge):
    """Tra ve vector the gioi ma bone local Z can tro toi (Z = hinge' x d) de local X ~ hinge."""
    d = unit(tuple(t - h for h, t in zip(head, tail)))
    hp = tuple(hc - dot(hinge, d) * dc for hc, dc in zip(hinge, d))
    if math.sqrt(dot(hp, hp)) < 1e-6:
        hp = (1.0, 0.0, 0.0) if abs(d[0]) < 0.9 else (0.0, 1.0, 0.0)
    hp = unit(hp)
    return unit(cross(hp, d)), hp


def control_bones(B=None):
    """Rig dieu khien (tien to ctl_): FK cho moi bone runtime khong phai socket + IK chan/tay + control tiep xuc (got/mui/bong)."""
    B = B or build()
    out = []
    for b in B:
        if b["kind"] == "socket":
            continue
        out.append(dict(name="ctl_" + b["name"], parent=("ctl_" + b["parent"]) if b["parent"] else None, head=b["head"], tail=b["tail"],
                        hinge=b["hinge"], zvec=None, kind="fk", rt=b["name"]))
    bn = by_name(B)
    f3 = lambda v: tuple(v)
    for side, s, ma, ml in sides():
        lg = {k: ml(v) for k, v in fitted_landmarks()[1].items()}
        hand, fore = bn[f"{side}_Hand"], bn[f"{side}_ForeArm"]
        out.append(dict(name=f"ctl_{side}_Hand_IK", parent="ctl_chest", head=hand["head"], tail=hand["tail"], hinge=hand["hinge"], zvec=None, kind="ik"))
        el = fore["head"]
        a_ = {k: ma(v) for k, v in fitted_landmarks()[0].items()}
        bd = unit(tuple(k - p for k, p in zip(el, on_line(a_["shoulder"], el, a_["wrist"]))))
        out.append(dict(name=f"ctl_{side}_Elbow_pole", parent="ctl_chest", head=add(el, tuple(0.12 * c for c in bd)), tail=add(el, tuple(0.15 * c for c in bd)), hinge=X, zvec=None, kind="pole"))
        hg = lg["heel_ground"]; bg = lg["ball_ground"]; tg = lg["toe_ground"]
        out.append(dict(name=f"ctl_{side}_Foot_IK", parent="ctl_root", head=hg, tail=add(hg, (0, -0.03, 0)), hinge=None, zvec=Z, kind="ik"))
        out.append(dict(name=f"ctl_{side}_Toe_roll", parent=f"ctl_{side}_Foot_IK", head=tg, tail=add(tg, (0, -0.02, 0)), hinge=None, zvec=Z, kind="roll"))
        out.append(dict(name=f"ctl_{side}_Heel_roll", parent=f"ctl_{side}_Toe_roll", head=hg, tail=add(hg, (0, -0.03, 0)), hinge=None, zvec=Z, kind="roll"))
        bj = bn[f"{side}_Toe"]["head"]  # khop bong chan (z ~0,012): tam xoay Ball_roll, de mui chan khong lun
        out.append(dict(name=f"ctl_{side}_Ball_roll", parent=f"ctl_{side}_Heel_roll", head=bj, tail=add(bj, (0, -0.02, 0)), hinge=None, zvec=Z, kind="roll"))
        foot, toe = bn[f"{side}_Foot"], bn[f"{side}_Toe"]
        out.append(dict(name=f"ctl_{side}_Ankle_target", parent=f"ctl_{side}_Ball_roll", head=foot["head"], tail=foot["tail"], hinge=foot["hinge"], zvec=None, kind="target"))
        out.append(dict(name=f"ctl_{side}_Toe_target", parent=f"ctl_{side}_Heel_roll", head=toe["head"], tail=toe["tail"], hinge=toe["hinge"], zvec=None, kind="target"))
        kn = bn[f"{side}_Calf"]["head"]
        bd = unit(tuple(k - p for k, p in zip(kn, on_line(lg["hip"], kn, lg["ankle"]))))  # huong goi lech khoi duong hong-co chan
        out.append(dict(name=f"ctl_{side}_Knee_pole", parent="ctl_root", head=add(kn, tuple(0.12 * c for c in bd)), tail=add(kn, tuple(0.15 * c for c in bd)), hinge=X, zvec=None, kind="pole"))
    return out


if __name__ == "__main__":
    B = build()
    from collections import Counter
    print(len(B), Counter(b["kind"] for b in B), "deform", len(deform_names(B)))
    for b in B:
        print(f'{b["name"]:18s} <- {str(b["parent"]):12s} head {tuple(round(c, 3) for c in b["head"])} tail {tuple(round(c, 3) for c in b["tail"])}')
